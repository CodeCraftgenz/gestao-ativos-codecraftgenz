using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Domain;

namespace OverlayAgent.Core.Storage;

/// <summary>
/// Interface para armazenamento seguro de dados
/// </summary>
public interface ISecureStorage
{
    /// <summary>
    /// Salva a configuracao do agente
    /// </summary>
    Task SaveConfigAsync(LocalAgentConfig config);

    /// <summary>
    /// Carrega a configuracao do agente
    /// </summary>
    Task<LocalAgentConfig> LoadConfigAsync();

    /// <summary>
    /// Verifica se existe configuracao salva
    /// </summary>
    bool HasConfig();

    /// <summary>
    /// Limpa toda a configuracao
    /// </summary>
    void ClearConfig();
}

/// <summary>
/// Implementacao de armazenamento seguro usando DPAPI no Windows
/// </summary>
public class SecureStorage : ISecureStorage
{
    private readonly ILogger<SecureStorage> _logger;
    private readonly string _configPath;
    private readonly byte[] _additionalEntropy;
    private readonly string _serverUrl;

    public SecureStorage(ILogger<SecureStorage> logger, string serverUrl = "http://localhost:3000")
    {
        _logger = logger;
        _serverUrl = serverUrl;

        // Pasta de configuracao
        var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var agentFolder = Path.Combine(appDataPath, "OverlayAgent");

        if (!Directory.Exists(agentFolder))
        {
            Directory.CreateDirectory(agentFolder);
        }

        _configPath = Path.Combine(agentFolder, "agent.config");

        // Entropia adicional baseada no hardware (opcional, mas recomendado)
        _additionalEntropy = GenerateEntropyFromHardware();
    }

    public async Task SaveConfigAsync(LocalAgentConfig config)
    {
        try
        {
            // Serializa para JSON
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions
            {
                WriteIndented = false
            });

            // Converte para bytes
            var data = Encoding.UTF8.GetBytes(json);

            // Encripta usando DPAPI (Windows Data Protection API)
            var encryptedData = ProtectedData.Protect(
                data,
                _additionalEntropy,
                DataProtectionScope.CurrentUser
            );

            // Salva em arquivo
            await File.WriteAllBytesAsync(_configPath, encryptedData);

            _logger.LogDebug("Configuracao salva com sucesso em {Path}", _configPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao salvar configuracao");
            throw;
        }
    }

    public async Task<LocalAgentConfig> LoadConfigAsync()
    {
        try
        {
            if (!File.Exists(_configPath))
            {
                _logger.LogDebug("Arquivo de configuracao nao encontrado, retornando config padrao");
                return CreateDefaultConfig();
            }

            // Le arquivo encriptado
            var encryptedData = await File.ReadAllBytesAsync(_configPath);

            // Decripta usando DPAPI
            var data = ProtectedData.Unprotect(
                encryptedData,
                _additionalEntropy,
                DataProtectionScope.CurrentUser
            );

            // Deserializa
            var json = Encoding.UTF8.GetString(data);
            var config = JsonSerializer.Deserialize<LocalAgentConfig>(json);

            if (config == null)
            {
                _logger.LogWarning("Configuracao deserializada como null, retornando config padrao");
                return CreateDefaultConfig();
            }

            _logger.LogDebug("Configuracao carregada com sucesso");
            return config;
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "Erro ao decriptar configuracao, arquivo pode estar corrompido");
            // Remove arquivo corrompido e retorna config padrao
            ClearConfig();
            return CreateDefaultConfig();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao carregar configuracao");
            return CreateDefaultConfig();
        }
    }

    public bool HasConfig()
    {
        return File.Exists(_configPath);
    }

    public void ClearConfig()
    {
        try
        {
            if (File.Exists(_configPath))
            {
                File.Delete(_configPath);
                _logger.LogInformation("Configuracao removida");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao remover configuracao");
        }
    }

    private LocalAgentConfig CreateDefaultConfig()
    {
        return new LocalAgentConfig
        {
            DeviceId = Guid.NewGuid().ToString(),
            EnrollmentStatus = EnrollmentStatus.NotEnrolled,
            ServerUrl = _serverUrl,
            ServerConfig = new AgentConfig()
        };
    }

    private byte[] GenerateEntropyFromHardware()
    {
        // Gera entropia baseada no nome da maquina
        // Isso torna os dados portaveis apenas dentro da mesma maquina
        var machineName = Environment.MachineName;
        var userName = Environment.UserName;

        var combined = $"{machineName}:{userName}:OverlayAgent";

        using var sha256 = SHA256.Create();
        return sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
    }
}
