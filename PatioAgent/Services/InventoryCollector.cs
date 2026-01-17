using System.Management;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent.Services;

/// <summary>
/// Coleta inventario de hardware e rede do dispositivo
/// NAO coleta software instalado (compliance LGPD)
/// </summary>
public class InventoryCollector
{
    private readonly ApiClient _apiClient;
    private readonly LocalStorage _storage;

    public InventoryCollector(ApiClient apiClient, LocalStorage storage)
    {
        _apiClient = apiClient;
        _storage = storage;
    }

    /// <summary>
    /// Coleta e envia inventario completo
    /// </summary>
    public async Task CollectAndSendInventoryAsync()
    {
        try
        {
            Log.Information("Iniciando coleta de inventario...");

            var inventory = new InventoryRequest
            {
                DeviceId = _storage.Config.DeviceId!,
                CollectedAt = DateTime.UtcNow.ToString("o"),
                Hardware = CollectHardwareInfo(),
                Disks = CollectDiskInfo(),
                Network = CollectNetworkInfo()
                // Software NAO coletado - LGPD compliance
            };

            Log.Information("Inventario coletado: CPU={Cpu}, RAM={Ram}GB, Discos={Disks}, Redes={Networks}",
                inventory.Hardware?.CpuModel ?? "N/A",
                inventory.Hardware?.RamTotalGb ?? 0,
                inventory.Disks?.Count ?? 0,
                inventory.Network?.Count ?? 0);

            var response = await _apiClient.PostAsync<InventoryResponse>("/api/agent/inventory", inventory);

            if (response.Success)
            {
                _storage.Config.LastInventoryAt = DateTime.UtcNow;
                _storage.Save();
                Log.Information("Inventario enviado com sucesso. Mudancas detectadas: {Changes}",
                    response.Data?.ChangesDetected ?? false);
            }
            else if (response.TokenRevoked)
            {
                Log.Warning("Token revogado durante envio de inventario");
                _storage.ClearAuth();
            }
            else
            {
                Log.Warning("Falha ao enviar inventario: {Error}", response.Error);
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao coletar/enviar inventario");
        }
    }

    /// <summary>
    /// Coleta informacoes de hardware via WMI
    /// </summary>
    private HardwareInfo CollectHardwareInfo()
    {
        var info = new HardwareInfo();

        try
        {
            // CPU
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor"))
            {
                foreach (var obj in searcher.Get())
                {
                    info.CpuModel = obj["Name"]?.ToString()?.Trim();
                    info.CpuCores = Convert.ToInt32(obj["NumberOfCores"] ?? 0);
                    info.CpuThreads = Convert.ToInt32(obj["NumberOfLogicalProcessors"] ?? 0);
                    info.CpuMaxClockMhz = Convert.ToInt32(obj["MaxClockSpeed"] ?? 0);
                    info.CpuArchitecture = GetCpuArchitecture(obj["Architecture"]?.ToString());
                    break; // Pega apenas o primeiro processador
                }
            }

            // RAM
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_ComputerSystem"))
            {
                foreach (var obj in searcher.Get())
                {
                    var totalBytes = Convert.ToUInt64(obj["TotalPhysicalMemory"] ?? 0);
                    info.RamTotalGb = Math.Round(totalBytes / 1073741824.0, 2); // Bytes to GB
                    break;
                }
            }

            // RAM Slots
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemory"))
            {
                int slotsUsed = 0;
                foreach (var obj in searcher.Get())
                {
                    slotsUsed++;
                }
                info.RamSlotsUsed = slotsUsed;
            }

            // Total de slots (pode ser maior que os usados)
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemoryArray"))
            {
                foreach (var obj in searcher.Get())
                {
                    info.RamSlotsTotal = Convert.ToInt32(obj["MemoryDevices"] ?? 0);
                    break;
                }
            }

            // GPU
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_VideoController"))
            {
                foreach (var obj in searcher.Get())
                {
                    var name = obj["Name"]?.ToString();
                    // Ignora adaptadores virtuais/basicos
                    if (name != null && !name.Contains("Basic") && !name.Contains("Microsoft"))
                    {
                        info.GpuModel = name;
                        var adapterRAM = Convert.ToUInt64(obj["AdapterRAM"] ?? 0);
                        if (adapterRAM > 0)
                        {
                            info.GpuMemoryGb = Math.Round(adapterRAM / 1073741824.0, 2);
                        }
                        break;
                    }
                }
            }

            // Motherboard
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_BaseBoard"))
            {
                foreach (var obj in searcher.Get())
                {
                    info.MotherboardManufacturer = obj["Manufacturer"]?.ToString()?.Trim();
                    info.MotherboardModel = obj["Product"]?.ToString()?.Trim();
                    break;
                }
            }

            // BIOS
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_BIOS"))
            {
                foreach (var obj in searcher.Get())
                {
                    info.BiosVersion = obj["SMBIOSBIOSVersion"]?.ToString()?.Trim();
                    info.BiosDate = obj["ReleaseDate"]?.ToString();
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Erro ao coletar informacoes de hardware");
        }

        return info;
    }

    /// <summary>
    /// Coleta informacoes de discos
    /// </summary>
    private List<DiskInfo> CollectDiskInfo()
    {
        var disks = new List<DiskInfo>();

        try
        {
            // Primeiro, mapeia os discos fisicos para saber o tipo
            var diskTypes = new Dictionary<string, string>();
            using (var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive"))
            {
                foreach (var obj in searcher.Get())
                {
                    var deviceId = obj["DeviceID"]?.ToString() ?? "";
                    var mediaType = obj["MediaType"]?.ToString() ?? "";
                    var model = obj["Model"]?.ToString() ?? "";

                    // Detecta SSD/NVMe pelo nome ou tipo
                    var diskType = "HDD";
                    if (model.Contains("NVMe", StringComparison.OrdinalIgnoreCase))
                        diskType = "NVMe";
                    else if (model.Contains("SSD", StringComparison.OrdinalIgnoreCase) ||
                             mediaType.Contains("SSD", StringComparison.OrdinalIgnoreCase))
                        diskType = "SSD";

                    diskTypes[deviceId] = diskType;
                }
            }

            // Agora coleta informacoes das particoes/volumes
            foreach (var drive in DriveInfo.GetDrives())
            {
                try
                {
                    if (!drive.IsReady) continue;

                    var diskInfo = new DiskInfo
                    {
                        DriveLetter = drive.Name.TrimEnd('\\'),
                        VolumeLabel = string.IsNullOrEmpty(drive.VolumeLabel) ? null : drive.VolumeLabel,
                        FileSystem = drive.DriveFormat,
                        TotalGb = Math.Round(drive.TotalSize / 1073741824.0, 2),
                        FreeGb = Math.Round(drive.AvailableFreeSpace / 1073741824.0, 2),
                        DiskType = drive.DriveType switch
                        {
                            DriveType.Fixed => "HDD", // Sera refinado abaixo
                            DriveType.Removable => "USB",
                            DriveType.Network => "Network",
                            _ => "Unknown"
                        }
                    };

                    diskInfo.UsedPercent = diskInfo.TotalGb > 0
                        ? Math.Round(((diskInfo.TotalGb - diskInfo.FreeGb) / diskInfo.TotalGb) * 100, 1)
                        : 0;

                    // Tenta refinar o tipo do disco
                    if (drive.DriveType == DriveType.Fixed)
                    {
                        // Busca tipo real via WMI
                        diskInfo.DiskType = GetDiskTypeForVolume(drive.Name) ?? "HDD";
                    }

                    disks.Add(diskInfo);
                }
                catch (Exception ex)
                {
                    Log.Debug(ex, "Erro ao coletar info do drive {Drive}", drive.Name);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Erro ao coletar informacoes de discos");
        }

        return disks;
    }

    /// <summary>
    /// Tenta determinar o tipo de disco para um volume
    /// </summary>
    private string? GetDiskTypeForVolume(string driveLetter)
    {
        try
        {
            var letter = driveLetter.TrimEnd(':', '\\');
            var query = $"ASSOCIATORS OF {{Win32_LogicalDisk.DeviceID='{letter}:'}} WHERE AssocClass=Win32_LogicalDiskToPartition";

            using var partitionSearcher = new ManagementObjectSearcher(query);
            foreach (var partition in partitionSearcher.Get())
            {
                var partitionId = partition["DeviceID"]?.ToString();
                if (string.IsNullOrEmpty(partitionId)) continue;

                var diskQuery = $"ASSOCIATORS OF {{Win32_DiskPartition.DeviceID='{partitionId}'}} WHERE AssocClass=Win32_DiskDriveToDiskPartition";
                using var diskSearcher = new ManagementObjectSearcher(diskQuery);
                foreach (var disk in diskSearcher.Get())
                {
                    var model = disk["Model"]?.ToString() ?? "";
                    if (model.Contains("NVMe", StringComparison.OrdinalIgnoreCase))
                        return "NVMe";
                    if (model.Contains("SSD", StringComparison.OrdinalIgnoreCase))
                        return "SSD";
                    return "HDD";
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Erro ao determinar tipo de disco para {Drive}", driveLetter);
        }
        return null;
    }

    /// <summary>
    /// Coleta informacoes de rede
    /// </summary>
    private List<NetworkInterfaceInfo> CollectNetworkInfo()
    {
        var networks = new List<NetworkInterfaceInfo>();

        try
        {
            var interfaces = NetworkInterface.GetAllNetworkInterfaces()
                .Where(ni => ni.OperationalStatus == OperationalStatus.Up &&
                            ni.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                .ToList();

            // Determina interface primaria (a com gateway padrao)
            string? primaryMac = null;
            foreach (var ni in interfaces)
            {
                var props = ni.GetIPProperties();
                if (props.GatewayAddresses.Any(g => g.Address.AddressFamily == AddressFamily.InterNetwork))
                {
                    primaryMac = ni.GetPhysicalAddress().ToString();
                    break;
                }
            }

            foreach (var ni in interfaces)
            {
                try
                {
                    var props = ni.GetIPProperties();
                    var ipv4 = props.UnicastAddresses
                        .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetwork);
                    var ipv6 = props.UnicastAddresses
                        .FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetworkV6 &&
                                            !a.Address.IsIPv6LinkLocal);
                    var gateway = props.GatewayAddresses
                        .FirstOrDefault(g => g.Address.AddressFamily == AddressFamily.InterNetwork);
                    var dns = props.DnsAddresses
                        .Where(d => d.AddressFamily == AddressFamily.InterNetwork)
                        .Select(d => d.ToString())
                        .ToList();

                    var mac = ni.GetPhysicalAddress().ToString();
                    var formattedMac = FormatMacAddress(mac);

                    var netInfo = new NetworkInterfaceInfo
                    {
                        InterfaceName = ni.Name,
                        InterfaceType = GetInterfaceType(ni.NetworkInterfaceType),
                        MacAddress = formattedMac,
                        Ipv4Address = ipv4?.Address.ToString(),
                        Ipv4Subnet = ipv4?.IPv4Mask?.ToString(),
                        Ipv4Gateway = gateway?.Address.ToString(),
                        Ipv6Address = ipv6?.Address.ToString(),
                        DnsServers = dns.Count > 0 ? dns : null,
                        IsPrimary = mac == primaryMac,
                        IsDhcpEnabled = props.GetIPv4Properties()?.IsDhcpEnabled ?? false,
                        SpeedMbps = ni.Speed > 0 ? (int)(ni.Speed / 1_000_000) : null
                    };

                    // Tenta pegar SSID para WiFi
                    if (ni.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
                    {
                        netInfo.WifiSsid = GetWifiSsid(ni.Name);
                    }

                    networks.Add(netInfo);
                }
                catch (Exception ex)
                {
                    Log.Debug(ex, "Erro ao coletar info da interface {Interface}", ni.Name);
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Erro ao coletar informacoes de rede");
        }

        return networks;
    }

    private static string GetCpuArchitecture(string? arch)
    {
        return arch switch
        {
            "0" => "x86",
            "5" => "ARM",
            "6" => "Itanium",
            "9" => "x64",
            "12" => "ARM64",
            _ => "Unknown"
        };
    }

    private static string GetInterfaceType(NetworkInterfaceType type)
    {
        return type switch
        {
            NetworkInterfaceType.Ethernet => "Ethernet",
            NetworkInterfaceType.Wireless80211 => "WiFi",
            NetworkInterfaceType.Loopback => "Loopback",
            NetworkInterfaceType.Ppp or NetworkInterfaceType.Slip => "Virtual",
            NetworkInterfaceType.Tunnel => "Virtual",
            _ => "Other"
        };
    }

    private static string? FormatMacAddress(string mac)
    {
        if (string.IsNullOrEmpty(mac) || mac.Length != 12)
            return null;

        return string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
    }

    private static string? GetWifiSsid(string interfaceName)
    {
        try
        {
            // Usa netsh para obter o SSID conectado
            var startInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "netsh",
                Arguments = "wlan show interfaces",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = System.Diagnostics.Process.Start(startInfo);
            if (process == null) return null;

            var output = process.StandardOutput.ReadToEnd();
            process.WaitForExit(5000);

            // Procura pela linha SSID
            var lines = output.Split('\n');
            foreach (var line in lines)
            {
                if (line.Trim().StartsWith("SSID") && !line.Contains("BSSID"))
                {
                    var parts = line.Split(':');
                    if (parts.Length >= 2)
                    {
                        return parts[1].Trim();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Erro ao obter SSID WiFi");
        }
        return null;
    }
}

// =============================================================================
// DTOs para Inventario
// =============================================================================

public class InventoryRequest
{
    public string DeviceId { get; set; } = "";
    public string CollectedAt { get; set; } = "";
    public HardwareInfo? Hardware { get; set; }
    public List<DiskInfo>? Disks { get; set; }
    public List<NetworkInterfaceInfo>? Network { get; set; }
    // Software NAO incluido - LGPD compliance
}

public class HardwareInfo
{
    public string? CpuModel { get; set; }
    public int? CpuCores { get; set; }
    public int? CpuThreads { get; set; }
    public int? CpuMaxClockMhz { get; set; }
    public string? CpuArchitecture { get; set; }
    public double? RamTotalGb { get; set; }
    public int? RamSlotsUsed { get; set; }
    public int? RamSlotsTotal { get; set; }
    public string? GpuModel { get; set; }
    public double? GpuMemoryGb { get; set; }
    public string? MotherboardManufacturer { get; set; }
    public string? MotherboardModel { get; set; }
    public string? BiosVersion { get; set; }
    public string? BiosDate { get; set; }
}

public class DiskInfo
{
    public string? DriveLetter { get; set; }
    public string? VolumeLabel { get; set; }
    public string DiskType { get; set; } = "Unknown";
    public string? FileSystem { get; set; }
    public double TotalGb { get; set; }
    public double FreeGb { get; set; }
    public double UsedPercent { get; set; }
    public string? SerialNumber { get; set; }
    public string? Model { get; set; }
}

public class NetworkInterfaceInfo
{
    public string InterfaceName { get; set; } = "";
    public string InterfaceType { get; set; } = "Other";
    public string? MacAddress { get; set; }
    public string? Ipv4Address { get; set; }
    public string? Ipv4Subnet { get; set; }
    public string? Ipv4Gateway { get; set; }
    public string? Ipv6Address { get; set; }
    public List<string>? DnsServers { get; set; }
    public bool IsPrimary { get; set; }
    public bool? IsDhcpEnabled { get; set; }
    public int? SpeedMbps { get; set; }
    public string? WifiSsid { get; set; }
}

public class InventoryResponse
{
    public bool Received { get; set; }
    public bool ChangesDetected { get; set; }
    public string? NextInventoryAt { get; set; }
}
