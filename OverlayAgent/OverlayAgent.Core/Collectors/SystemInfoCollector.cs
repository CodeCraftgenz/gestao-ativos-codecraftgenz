using System.Management;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Domain;

namespace OverlayAgent.Core.Collectors;

/// <summary>
/// Interface para coletores de informacao
/// </summary>
public interface ICollector<T>
{
    Task<T> CollectAsync();
}

/// <summary>
/// Coletor de informacoes basicas do sistema
/// </summary>
public class SystemInfoCollector : ICollector<SystemInfo>
{
    private readonly ILogger<SystemInfoCollector> _logger;

    public SystemInfoCollector(ILogger<SystemInfoCollector> logger)
    {
        _logger = logger;
    }

    public Task<SystemInfo> CollectAsync()
    {
        var info = new SystemInfo
        {
            Hostname = Environment.MachineName,
            CurrentUser = Environment.UserName,
            Domain = Environment.UserDomainName,
            OsArchitecture = GetOsArchitecture()
        };

        try
        {
            // Informacoes do SO via WMI
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                info.OsName = obj["Caption"]?.ToString()?.Trim();
                info.OsVersion = obj["Version"]?.ToString();
                info.OsBuild = obj["BuildNumber"]?.ToString();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes do SO via WMI");
        }

        try
        {
            // Serial BIOS
            using var biosSearcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
            foreach (var obj in biosSearcher.Get())
            {
                info.SerialBios = obj["SerialNumber"]?.ToString()?.Trim();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar serial BIOS");
        }

        try
        {
            // UUID do sistema
            using var csProductSearcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
            foreach (var obj in csProductSearcher.Get())
            {
                info.SystemUuid = obj["UUID"]?.ToString()?.Trim();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar UUID do sistema");
        }

        try
        {
            // MAC Address primario (primeira interface ativa)
            info.PrimaryMacAddress = GetPrimaryMacAddress();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar MAC Address");
        }

        return Task.FromResult(info);
    }

    private string GetOsArchitecture()
    {
        // Converte para o formato esperado pelo servidor: x86, x64 ou ARM64
        return RuntimeInformation.OSArchitecture switch
        {
            Architecture.X86 => "x86",
            Architecture.X64 => "x64",
            Architecture.Arm64 => "ARM64",
            _ => "x64" // Default
        };
    }

    private string? GetPrimaryMacAddress()
    {
        // Busca a primeira interface de rede ativa que nao seja virtual
        var interfaces = NetworkInterface.GetAllNetworkInterfaces()
            .Where(nic => nic.OperationalStatus == OperationalStatus.Up)
            .Where(nic => nic.NetworkInterfaceType != NetworkInterfaceType.Loopback)
            .Where(nic => !nic.Description.Contains("Virtual", StringComparison.OrdinalIgnoreCase))
            .Where(nic => !nic.Description.Contains("VPN", StringComparison.OrdinalIgnoreCase))
            .Where(nic => !nic.Description.Contains("Hyper-V", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(nic => nic.NetworkInterfaceType == NetworkInterfaceType.Ethernet)
            .ThenByDescending(nic => nic.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
            .FirstOrDefault();

        if (interfaces == null)
        {
            return null;
        }

        var mac = interfaces.GetPhysicalAddress().ToString();

        // Formata como XX:XX:XX:XX:XX:XX
        if (mac.Length == 12)
        {
            return string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
        }

        return mac;
    }
}
