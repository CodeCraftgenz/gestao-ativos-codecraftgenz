using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using OverlayAgent.Core.Models.Domain;

namespace OverlayAgent.Core.Collectors;

/// <summary>
/// Coletor de informacoes de software instalado
/// </summary>
public class SoftwareCollector : ICollector<List<SoftwareInfo>>
{
    private readonly ILogger<SoftwareCollector> _logger;

    // Chaves de registro onde ficam os softwares instalados
    private static readonly string[] RegistryPaths =
    {
        @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        @"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    };

    public SoftwareCollector(ILogger<SoftwareCollector> logger)
    {
        _logger = logger;
    }

    public Task<List<SoftwareInfo>> CollectAsync()
    {
        var software = new Dictionary<string, SoftwareInfo>();

        // HKEY_LOCAL_MACHINE
        foreach (var path in RegistryPaths)
        {
            try
            {
                CollectFromRegistry(RegistryHive.LocalMachine, path, software);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erro ao coletar software de HKLM\\{Path}", path);
            }
        }

        // HKEY_CURRENT_USER
        try
        {
            CollectFromRegistry(
                RegistryHive.CurrentUser,
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
                software
            );
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar software de HKCU");
        }

        var result = software.Values
            .Where(s => !string.IsNullOrWhiteSpace(s.Name))
            .Where(s => s.Name.Length > 1)
            .OrderBy(s => s.Name)
            .ToList();

        _logger.LogDebug("Coletados {Count} softwares instalados", result.Count);

        return Task.FromResult(result);
    }

    private void CollectFromRegistry(
        RegistryHive hive,
        string path,
        Dictionary<string, SoftwareInfo> software)
    {
        using var baseKey = RegistryKey.OpenBaseKey(hive, RegistryView.Registry64);
        using var uninstallKey = baseKey.OpenSubKey(path);

        if (uninstallKey == null)
        {
            return;
        }

        foreach (var subKeyName in uninstallKey.GetSubKeyNames())
        {
            try
            {
                using var subKey = uninstallKey.OpenSubKey(subKeyName);

                if (subKey == null)
                {
                    continue;
                }

                var displayName = subKey.GetValue("DisplayName")?.ToString()?.Trim();

                if (string.IsNullOrWhiteSpace(displayName))
                {
                    continue;
                }

                // Usa chave unica baseada no nome para evitar duplicatas
                var key = displayName.ToLowerInvariant();

                if (software.ContainsKey(key))
                {
                    continue;
                }

                var info = new SoftwareInfo
                {
                    Name = displayName,
                    Version = subKey.GetValue("DisplayVersion")?.ToString()?.Trim(),
                    Publisher = subKey.GetValue("Publisher")?.ToString()?.Trim(),
                    InstallLocation = subKey.GetValue("InstallLocation")?.ToString()?.Trim(),
                    IsSystemComponent = IsSystemComponent(subKey)
                };

                // Data de instalacao
                var installDate = subKey.GetValue("InstallDate")?.ToString();
                if (!string.IsNullOrEmpty(installDate) && installDate.Length == 8)
                {
                    // Formato YYYYMMDD
                    try
                    {
                        info.InstallDate = $"{installDate.Substring(0, 4)}-{installDate.Substring(4, 2)}-{installDate.Substring(6, 2)}";
                    }
                    catch
                    {
                        // Ignora formato invalido
                    }
                }

                // Tamanho estimado
                var size = subKey.GetValue("EstimatedSize");
                if (size != null)
                {
                    try
                    {
                        var sizeKb = Convert.ToInt64(size);
                        info.SizeMb = Math.Round((decimal)sizeKb / 1024, 2);
                    }
                    catch
                    {
                        // Ignora
                    }
                }

                software[key] = info;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Erro ao processar subchave {SubKey}", subKeyName);
            }
        }
    }

    private bool IsSystemComponent(RegistryKey subKey)
    {
        // Verifica flag de componente do sistema
        var systemComponent = subKey.GetValue("SystemComponent");
        if (systemComponent != null && Convert.ToInt32(systemComponent) == 1)
        {
            return true;
        }

        // Verifica WindowsInstaller
        var windowsInstaller = subKey.GetValue("WindowsInstaller");
        if (windowsInstaller != null && Convert.ToInt32(windowsInstaller) == 1)
        {
            // Componentes MSI podem ser do sistema
            var parentDisplayName = subKey.GetValue("ParentDisplayName");
            if (parentDisplayName != null)
            {
                return true;
            }
        }

        return false;
    }
}
