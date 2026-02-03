using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent.Services;

/// <summary>
/// Serviço responsável por capturar screenshots da tela principal
/// para auditoria de produtividade
/// </summary>
[SupportedOSPlatform("windows")]
public class ScreenshotCollector
{
    private readonly LocalStorage _storage;
    private readonly ApiClient _apiClient;

    // Qualidade de compressão JPEG (0-100)
    // 60-70% oferece bom balanço entre qualidade e tamanho
    private const long JpegQuality = 65L;

    // Tamanho máximo do arquivo em bytes (2MB)
    private const int MaxFileSizeBytes = 2 * 1024 * 1024;

    public ScreenshotCollector(LocalStorage storage, ApiClient apiClient)
    {
        _storage = storage;
        _apiClient = apiClient;
    }

    /// <summary>
    /// Verifica se existe um usuário ativo logado na sessão
    /// LGPD: Evita capturas de telas de bloqueio vazias
    /// </summary>
    public bool HasActiveUser()
    {
        try
        {
            var loggedUser = GetLoggedUsername();
            if (string.IsNullOrEmpty(loggedUser))
            {
                Log.Debug("Nenhum usuario logado - pulando captura");
                return false;
            }

            // Verifica se a estação está bloqueada
            if (IsWorkstationLocked())
            {
                Log.Debug("Estacao bloqueada - pulando captura");
                return false;
            }

            return true;
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Erro ao verificar usuario ativo");
            return false;
        }
    }

    /// <summary>
    /// Captura a tela principal e retorna os bytes comprimidos em JPEG
    /// </summary>
    public byte[]? CaptureScreen(out int width, out int height)
    {
        width = 0;
        height = 0;

        try
        {
            // Obtém dimensões da tela principal
            var screenBounds = GetPrimaryScreenBounds();
            if (screenBounds.Width == 0 || screenBounds.Height == 0)
            {
                Log.Warning("Nao foi possivel obter dimensoes da tela");
                return null;
            }

            width = screenBounds.Width;
            height = screenBounds.Height;

            using var bitmap = new Bitmap(screenBounds.Width, screenBounds.Height);
            using var graphics = Graphics.FromImage(bitmap);

            // Captura a tela
            graphics.CopyFromScreen(
                screenBounds.X,
                screenBounds.Y,
                0,
                0,
                screenBounds.Size,
                CopyPixelOperation.SourceCopy
            );

            // Converte para JPEG comprimido
            return CompressToJpeg(bitmap);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao capturar tela");
            return null;
        }
    }

    /// <summary>
    /// Captura e envia screenshot para o servidor
    /// </summary>
    public async Task<bool> CaptureAndSendAsync()
    {
        // Verifica se tem usuário ativo (LGPD compliance)
        if (!HasActiveUser())
        {
            return false;
        }

        // Verifica se está aprovado
        if (_storage.Config.Status != EnrollmentStatus.Approved)
        {
            Log.Debug("Dispositivo nao aprovado - pulando captura");
            return false;
        }

        try
        {
            // Captura a tela
            var imageData = CaptureScreen(out var width, out var height);
            if (imageData == null || imageData.Length == 0)
            {
                Log.Warning("Captura retornou vazia");
                return false;
            }

            // Verifica tamanho
            if (imageData.Length > MaxFileSizeBytes)
            {
                Log.Warning("Screenshot muito grande ({Size} bytes) - max {Max} bytes",
                    imageData.Length, MaxFileSizeBytes);
                return false;
            }

            Log.Information("Screenshot capturado: {Width}x{Height}, {Size} KB",
                width, height, imageData.Length / 1024);

            // Envia para o servidor
            var loggedUser = GetLoggedUsername();
            var success = await _apiClient.UploadScreenshotAsync(
                imageData,
                loggedUser,
                width,
                height
            );

            if (success)
            {
                Log.Information("Screenshot enviado com sucesso");
                _storage.UpdateLastScreenshotAt();
            }
            else
            {
                Log.Warning("Falha ao enviar screenshot");
            }

            return success;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao capturar/enviar screenshot");
            return false;
        }
    }

    /// <summary>
    /// Comprime bitmap para JPEG com qualidade configurável
    /// </summary>
    private static byte[]? CompressToJpeg(Bitmap bitmap)
    {
        try
        {
            var encoder = GetJpegEncoder();
            if (encoder == null)
            {
                Log.Warning("Encoder JPEG nao encontrado");
                return null;
            }

            var encoderParams = new EncoderParameters(1);
            encoderParams.Param[0] = new EncoderParameter(Encoder.Quality, JpegQuality);

            using var memoryStream = new MemoryStream();
            bitmap.Save(memoryStream, encoder, encoderParams);
            return memoryStream.ToArray();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao comprimir imagem");
            return null;
        }
    }

    /// <summary>
    /// Obtém o encoder JPEG
    /// </summary>
    private static ImageCodecInfo? GetJpegEncoder()
    {
        var codecs = ImageCodecInfo.GetImageEncoders();
        return codecs.FirstOrDefault(c =>
            c.FormatID == ImageFormat.Jpeg.Guid);
    }

    /// <summary>
    /// Obtém os limites da tela principal
    /// </summary>
    private static Rectangle GetPrimaryScreenBounds()
    {
        // Usa P/Invoke para obter dimensões da tela
        int width = GetSystemMetrics(SM_CXSCREEN);
        int height = GetSystemMetrics(SM_CYSCREEN);
        return new Rectangle(0, 0, width, height);
    }

    /// <summary>
    /// Obtém o nome do usuário logado na sessão atual
    /// </summary>
    private static string? GetLoggedUsername()
    {
        try
        {
            return Environment.UserName;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Verifica se a estação de trabalho está bloqueada
    /// </summary>
    private static bool IsWorkstationLocked()
    {
        try
        {
            // Verifica se existe janela de login visível
            var desktopHandle = GetForegroundWindow();
            if (desktopHandle == IntPtr.Zero)
                return true;

            // Verifica se o desktop está acessível
            var inputDesktop = OpenInputDesktop(0, false, DESKTOP_SWITCHDESKTOP);
            if (inputDesktop == IntPtr.Zero)
                return true;

            CloseDesktop(inputDesktop);
            return false;
        }
        catch
        {
            return false; // Em caso de erro, assume que não está bloqueado
        }
    }

    #region P/Invoke

    private const int SM_CXSCREEN = 0;
    private const int SM_CYSCREEN = 1;
    private const uint DESKTOP_SWITCHDESKTOP = 0x0100;

    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool CloseDesktop(IntPtr hDesktop);

    #endregion
}
