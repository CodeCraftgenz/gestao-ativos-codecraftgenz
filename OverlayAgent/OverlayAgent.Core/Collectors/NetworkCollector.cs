using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Domain;

namespace OverlayAgent.Core.Collectors;

/// <summary>
/// Coletor de informacoes de rede
/// </summary>
public class NetworkCollector : ICollector<List<NetworkInfo>>
{
    private readonly ILogger<NetworkCollector> _logger;

    public NetworkCollector(ILogger<NetworkCollector> logger)
    {
        _logger = logger;
    }

    public Task<List<NetworkInfo>> CollectAsync()
    {
        var networks = new List<NetworkInfo>();

        try
        {
            var interfaces = NetworkInterface.GetAllNetworkInterfaces()
                .Where(nic => nic.OperationalStatus == OperationalStatus.Up)
                .Where(nic => nic.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                .ToList();

            // Identifica interface primaria (primeira com gateway)
            NetworkInterface? primaryInterface = null;

            foreach (var nic in interfaces)
            {
                var ipProps = nic.GetIPProperties();
                var gateway = ipProps.GatewayAddresses.FirstOrDefault(g => g.Address.AddressFamily == AddressFamily.InterNetwork);

                if (gateway != null && primaryInterface == null)
                {
                    primaryInterface = nic;
                }
            }

            foreach (var nic in interfaces)
            {
                try
                {
                    var network = CollectInterfaceInfo(nic, nic == primaryInterface);
                    networks.Add(network);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao coletar informacoes da interface {Name}", nic.Name);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes de rede");
        }

        return Task.FromResult(networks);
    }

    private NetworkInfo CollectInterfaceInfo(NetworkInterface nic, bool isPrimary)
    {
        var ipProps = nic.GetIPProperties();

        var info = new NetworkInfo
        {
            InterfaceName = nic.Name,
            InterfaceType = GetInterfaceType(nic),
            IsPrimary = isPrimary,
            SpeedMbps = nic.Speed > 0 ? (int)(nic.Speed / 1_000_000) : null
        };

        // MAC Address
        var mac = nic.GetPhysicalAddress().ToString();
        if (mac.Length == 12)
        {
            info.MacAddress = string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
        }

        // IPv4
        var ipv4 = ipProps.UnicastAddresses
            .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetwork);

        if (ipv4 != null)
        {
            info.Ipv4Address = ipv4.Address.ToString();
            info.Ipv4Subnet = ipv4.IPv4Mask?.ToString();
        }

        // Gateway
        var gateway = ipProps.GatewayAddresses
            .FirstOrDefault(g => g.Address.AddressFamily == AddressFamily.InterNetwork);

        if (gateway != null)
        {
            info.Ipv4Gateway = gateway.Address.ToString();
        }

        // IPv6
        var ipv6 = ipProps.UnicastAddresses
            .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetworkV6);

        if (ipv6 != null)
        {
            info.Ipv6Address = ipv6.Address.ToString();
        }

        // DNS
        var dnsServers = ipProps.DnsAddresses
            .Where(a => a.AddressFamily == AddressFamily.InterNetwork)
            .Select(a => a.ToString())
            .ToList();

        if (dnsServers.Any())
        {
            info.DnsServers = dnsServers;
        }

        // DHCP
        try
        {
            info.IsDhcpEnabled = ipProps.GetIPv4Properties()?.IsDhcpEnabled;
        }
        catch
        {
            // Algumas interfaces nao suportam
        }

        // WiFi SSID
        if (info.InterfaceType == "WiFi")
        {
            info.WifiSsid = GetWifiSsid();
        }

        return info;
    }

    private string GetInterfaceType(NetworkInterface nic)
    {
        // Verifica se e virtual
        var description = nic.Description.ToLowerInvariant();

        if (description.Contains("virtual") ||
            description.Contains("hyper-v") ||
            description.Contains("vmware") ||
            description.Contains("virtualbox"))
        {
            return "Virtual";
        }

        return nic.NetworkInterfaceType switch
        {
            NetworkInterfaceType.Ethernet => "Ethernet",
            NetworkInterfaceType.Wireless80211 => "WiFi",
            NetworkInterfaceType.Loopback => "Loopback",
            _ => "Other"
        };
    }

    private string? GetWifiSsid()
    {
        try
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "netsh",
                    Arguments = "wlan show interfaces",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };

            process.Start();
            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(5000);

            // Procura pela linha "SSID"
            var lines = output.Split('\n');
            foreach (var line in lines)
            {
                if (line.TrimStart().StartsWith("SSID") && !line.Contains("BSSID"))
                {
                    var parts = line.Split(':', 2);
                    if (parts.Length == 2)
                    {
                        return parts[1].Trim();
                    }
                }
            }
        }
        catch (Exception)
        {
            // Ignora erros
        }

        return null;
    }
}
