namespace OverlayAgent.Core.Models.Domain;

/// <summary>
/// Informacoes de hardware do sistema
/// </summary>
public class HardwareInfo
{
    public string? CpuModel { get; set; }
    public int? CpuCores { get; set; }
    public int? CpuThreads { get; set; }
    public int? CpuMaxClockMhz { get; set; }
    public string? CpuArchitecture { get; set; }

    public decimal? RamTotalGb { get; set; }
    public int? RamSlotsUsed { get; set; }
    public int? RamSlotsTotal { get; set; }

    public string? GpuModel { get; set; }
    public decimal? GpuMemoryGb { get; set; }

    public string? MotherboardManufacturer { get; set; }
    public string? MotherboardModel { get; set; }
    public string? BiosVersion { get; set; }
    public string? BiosDate { get; set; }
}

/// <summary>
/// Informacoes de disco
/// </summary>
public class DiskInfo
{
    public string? DriveLetter { get; set; }
    public string? VolumeLabel { get; set; }
    public string DiskType { get; set; } = "Unknown";
    public string? FileSystem { get; set; }
    public decimal TotalGb { get; set; }
    public decimal FreeGb { get; set; }
    public decimal UsedPercent { get; set; }
    public string? SerialNumber { get; set; }
    public string? Model { get; set; }
}

/// <summary>
/// Informacoes de interface de rede
/// </summary>
public class NetworkInfo
{
    public string InterfaceName { get; set; } = string.Empty;
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

/// <summary>
/// Informacoes de software instalado
/// </summary>
public class SoftwareInfo
{
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string? Publisher { get; set; }
    public string? InstallDate { get; set; }
    public string? InstallLocation { get; set; }
    public decimal? SizeMb { get; set; }
    public bool IsSystemComponent { get; set; }
}

/// <summary>
/// Informacoes do sistema operacional
/// </summary>
public class SystemInfo
{
    public string Hostname { get; set; } = string.Empty;
    public string? SerialBios { get; set; }
    public string? SystemUuid { get; set; }
    public string? PrimaryMacAddress { get; set; }
    public string? OsName { get; set; }
    public string? OsVersion { get; set; }
    public string? OsBuild { get; set; }
    public string? OsArchitecture { get; set; }
    public string? CurrentUser { get; set; }
    public string? Domain { get; set; }
}

/// <summary>
/// Inventario completo do dispositivo
/// </summary>
public class FullInventory
{
    public SystemInfo System { get; set; } = new();
    public HardwareInfo? Hardware { get; set; }
    public List<DiskInfo> Disks { get; set; } = new();
    public List<NetworkInfo> Network { get; set; } = new();
    public List<SoftwareInfo> Software { get; set; } = new();
    public DateTime CollectedAt { get; set; } = DateTime.UtcNow;
}
