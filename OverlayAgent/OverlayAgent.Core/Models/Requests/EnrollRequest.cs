using System.Text.Json.Serialization;

namespace OverlayAgent.Core.Models.Requests;

/// <summary>
/// Request para enrollment do dispositivo
/// </summary>
public class EnrollRequest
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("hostname")]
    public string Hostname { get; set; } = string.Empty;

    [JsonPropertyName("serial_bios")]
    public string? SerialBios { get; set; }

    [JsonPropertyName("system_uuid")]
    public string? SystemUuid { get; set; }

    [JsonPropertyName("primary_mac_address")]
    public string? PrimaryMacAddress { get; set; }

    [JsonPropertyName("os_name")]
    public string? OsName { get; set; }

    [JsonPropertyName("os_version")]
    public string? OsVersion { get; set; }

    [JsonPropertyName("os_build")]
    public string? OsBuild { get; set; }

    [JsonPropertyName("os_architecture")]
    public string? OsArchitecture { get; set; }

    [JsonPropertyName("agent_version")]
    public string AgentVersion { get; set; } = string.Empty;

    [JsonPropertyName("current_user")]
    public string? CurrentUser { get; set; }

    [JsonPropertyName("domain")]
    public string? Domain { get; set; }
}

/// <summary>
/// Request para heartbeat
/// </summary>
public class HeartbeatRequest
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("agent_version")]
    public string? AgentVersion { get; set; }

    [JsonPropertyName("uptime_seconds")]
    public long? UptimeSeconds { get; set; }

    [JsonPropertyName("cpu_usage_percent")]
    public float? CpuUsagePercent { get; set; }

    [JsonPropertyName("ram_usage_percent")]
    public float? RamUsagePercent { get; set; }

    [JsonPropertyName("disk_free_gb")]
    public float? DiskFreeGb { get; set; }

    [JsonPropertyName("current_user")]
    public string? CurrentUser { get; set; }
}

/// <summary>
/// Request para envio de inventario
/// </summary>
public class InventoryRequest
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("collected_at")]
    public string CollectedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("hardware")]
    public HardwareInfoDto? Hardware { get; set; }

    [JsonPropertyName("disks")]
    public List<DiskInfoDto>? Disks { get; set; }

    [JsonPropertyName("network")]
    public List<NetworkInfoDto>? Network { get; set; }

    [JsonPropertyName("software")]
    public List<SoftwareInfoDto>? Software { get; set; }
}

public class HardwareInfoDto
{
    [JsonPropertyName("cpu_model")]
    public string? CpuModel { get; set; }

    [JsonPropertyName("cpu_cores")]
    public int? CpuCores { get; set; }

    [JsonPropertyName("cpu_threads")]
    public int? CpuThreads { get; set; }

    [JsonPropertyName("cpu_max_clock_mhz")]
    public int? CpuMaxClockMhz { get; set; }

    [JsonPropertyName("cpu_architecture")]
    public string? CpuArchitecture { get; set; }

    [JsonPropertyName("ram_total_gb")]
    public decimal? RamTotalGb { get; set; }

    [JsonPropertyName("ram_slots_used")]
    public int? RamSlotsUsed { get; set; }

    [JsonPropertyName("ram_slots_total")]
    public int? RamSlotsTotal { get; set; }

    [JsonPropertyName("gpu_model")]
    public string? GpuModel { get; set; }

    [JsonPropertyName("gpu_memory_gb")]
    public decimal? GpuMemoryGb { get; set; }

    [JsonPropertyName("motherboard_manufacturer")]
    public string? MotherboardManufacturer { get; set; }

    [JsonPropertyName("motherboard_model")]
    public string? MotherboardModel { get; set; }

    [JsonPropertyName("bios_version")]
    public string? BiosVersion { get; set; }

    [JsonPropertyName("bios_date")]
    public string? BiosDate { get; set; }
}

public class DiskInfoDto
{
    [JsonPropertyName("drive_letter")]
    public string? DriveLetter { get; set; }

    [JsonPropertyName("volume_label")]
    public string? VolumeLabel { get; set; }

    [JsonPropertyName("disk_type")]
    public string DiskType { get; set; } = "Unknown";

    [JsonPropertyName("file_system")]
    public string? FileSystem { get; set; }

    [JsonPropertyName("total_gb")]
    public decimal TotalGb { get; set; }

    [JsonPropertyName("free_gb")]
    public decimal FreeGb { get; set; }

    [JsonPropertyName("used_percent")]
    public decimal UsedPercent { get; set; }

    [JsonPropertyName("serial_number")]
    public string? SerialNumber { get; set; }

    [JsonPropertyName("model")]
    public string? Model { get; set; }
}

public class NetworkInfoDto
{
    [JsonPropertyName("interface_name")]
    public string InterfaceName { get; set; } = string.Empty;

    [JsonPropertyName("interface_type")]
    public string InterfaceType { get; set; } = "Other";

    [JsonPropertyName("mac_address")]
    public string? MacAddress { get; set; }

    [JsonPropertyName("ipv4_address")]
    public string? Ipv4Address { get; set; }

    [JsonPropertyName("ipv4_subnet")]
    public string? Ipv4Subnet { get; set; }

    [JsonPropertyName("ipv4_gateway")]
    public string? Ipv4Gateway { get; set; }

    [JsonPropertyName("ipv6_address")]
    public string? Ipv6Address { get; set; }

    [JsonPropertyName("dns_servers")]
    public List<string>? DnsServers { get; set; }

    [JsonPropertyName("is_primary")]
    public bool IsPrimary { get; set; }

    [JsonPropertyName("is_dhcp_enabled")]
    public bool? IsDhcpEnabled { get; set; }

    [JsonPropertyName("speed_mbps")]
    public int? SpeedMbps { get; set; }

    [JsonPropertyName("wifi_ssid")]
    public string? WifiSsid { get; set; }
}

public class SoftwareInfoDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    public string? Version { get; set; }

    [JsonPropertyName("publisher")]
    public string? Publisher { get; set; }

    [JsonPropertyName("install_date")]
    public string? InstallDate { get; set; }

    [JsonPropertyName("install_location")]
    public string? InstallLocation { get; set; }

    [JsonPropertyName("size_mb")]
    public decimal? SizeMb { get; set; }

    [JsonPropertyName("is_system_component")]
    public bool IsSystemComponent { get; set; }
}

/// <summary>
/// Request para envio de resultado de comando
/// </summary>
public class CommandResultRequest
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("exit_code")]
    public int? ExitCode { get; set; }

    [JsonPropertyName("stdout")]
    public string? Stdout { get; set; }

    [JsonPropertyName("stderr")]
    public string? Stderr { get; set; }

    [JsonPropertyName("execution_time_ms")]
    public int? ExecutionTimeMs { get; set; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request para envio de eventos
/// </summary>
public class EventsRequest
{
    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("events")]
    public List<EventDto> Events { get; set; } = new();
}

public class EventDto
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = "INFO";

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("details")]
    public Dictionary<string, object>? Details { get; set; }

    [JsonPropertyName("source")]
    public string? Source { get; set; }

    [JsonPropertyName("occurred_at")]
    public string OccurredAt { get; set; } = DateTime.UtcNow.ToString("o");
}
