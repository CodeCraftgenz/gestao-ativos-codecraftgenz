using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Collectors;
using OverlayAgent.Core.Http;
using OverlayAgent.Core.Models.Domain;
using OverlayAgent.Core.Models.Requests;
using OverlayAgent.Core.Storage;

namespace OverlayAgent.Core.Services;

/// <summary>
/// Interface do servico de inventario
/// </summary>
public interface IInventoryService
{
    /// <summary>
    /// Coleta e envia inventario completo para o servidor
    /// </summary>
    Task<InventoryResult> CollectAndSendAsync();

    /// <summary>
    /// Coleta inventario completo localmente
    /// </summary>
    Task<FullInventory> CollectAsync();
}

/// <summary>
/// Resultado do envio de inventario
/// </summary>
public class InventoryResult
{
    public bool Success { get; set; }
    public bool ChangesDetected { get; set; }
    public DateTime? NextInventoryAt { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Servico responsavel por coletar e enviar inventario do sistema
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly IApiClient _apiClient;
    private readonly ISecureStorage _storage;
    private readonly ICollector<SystemInfo> _systemInfoCollector;
    private readonly ICollector<HardwareInfo> _hardwareCollector;
    private readonly ICollector<List<DiskInfo>> _diskCollector;
    private readonly ICollector<List<NetworkInfo>> _networkCollector;
    private readonly ICollector<List<SoftwareInfo>> _softwareCollector;
    private readonly ILogger<InventoryService> _logger;

    public InventoryService(
        IApiClient apiClient,
        ISecureStorage storage,
        ICollector<SystemInfo> systemInfoCollector,
        ICollector<HardwareInfo> hardwareCollector,
        ICollector<List<DiskInfo>> diskCollector,
        ICollector<List<NetworkInfo>> networkCollector,
        ICollector<List<SoftwareInfo>> softwareCollector,
        ILogger<InventoryService> logger)
    {
        _apiClient = apiClient;
        _storage = storage;
        _systemInfoCollector = systemInfoCollector;
        _hardwareCollector = hardwareCollector;
        _diskCollector = diskCollector;
        _networkCollector = networkCollector;
        _softwareCollector = softwareCollector;
        _logger = logger;
    }

    public async Task<FullInventory> CollectAsync()
    {
        _logger.LogInformation("Iniciando coleta de inventario...");

        var inventory = new FullInventory
        {
            CollectedAt = DateTime.UtcNow
        };

        // Sistema
        try
        {
            inventory.System = await _systemInfoCollector.CollectAsync();
            _logger.LogDebug("Sistema coletado: {Hostname}", inventory.System.Hostname);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao coletar informacoes do sistema");
        }

        // Hardware
        try
        {
            inventory.Hardware = await _hardwareCollector.CollectAsync();
            _logger.LogDebug("Hardware coletado: CPU={Cpu}, RAM={Ram}GB",
                inventory.Hardware?.CpuModel ?? "N/A",
                inventory.Hardware?.RamTotalGb?.ToString("F1") ?? "N/A");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao coletar informacoes de hardware");
        }

        // Discos
        try
        {
            inventory.Disks = await _diskCollector.CollectAsync();
            _logger.LogDebug("Discos coletados: {Count} unidades", inventory.Disks.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao coletar informacoes de discos");
        }

        // Rede
        try
        {
            inventory.Network = await _networkCollector.CollectAsync();
            _logger.LogDebug("Interfaces de rede coletadas: {Count}", inventory.Network.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao coletar informacoes de rede");
        }

        // Software
        try
        {
            inventory.Software = await _softwareCollector.CollectAsync();
            _logger.LogDebug("Software coletado: {Count} aplicativos", inventory.Software.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao coletar informacoes de software");
        }

        _logger.LogInformation("Coleta de inventario concluida");
        return inventory;
    }

    public async Task<InventoryResult> CollectAndSendAsync()
    {
        try
        {
            var config = await _storage.LoadConfigAsync();

            if (string.IsNullOrEmpty(config.DeviceId))
            {
                _logger.LogWarning("DeviceId nao encontrado, nao e possivel enviar inventario");
                return new InventoryResult
                {
                    Success = false,
                    Error = "DeviceId nao configurado"
                };
            }

            // Coleta inventario
            var inventory = await CollectAsync();

            // Converte para DTO
            var request = ConvertToRequest(config.DeviceId, inventory);

            _logger.LogInformation("Enviando inventario para o servidor...");
            _logger.LogDebug("Hardware: {HasHardware}, Discos: {DiskCount}, Rede: {NetworkCount}, Software: {SoftwareCount}",
                request.Hardware != null,
                request.Disks?.Count ?? 0,
                request.Network?.Count ?? 0,
                request.Software?.Count ?? 0);

            // Envia para o servidor
            var response = await _apiClient.SendInventoryAsync(request);

            if (!response.Success || response.Data == null)
            {
                _logger.LogWarning("Inventario rejeitado: {Error}", response.Error);
                return new InventoryResult
                {
                    Success = false,
                    Error = response.Error
                };
            }

            // Atualiza ultimo inventario na config
            config.LastInventoryAt = DateTime.UtcNow;
            await _storage.SaveConfigAsync(config);

            _logger.LogInformation("Inventario enviado com sucesso. Proximo em: {NextAt}",
                response.Data.NextInventoryAt);

            return new InventoryResult
            {
                Success = true,
                ChangesDetected = response.Data.ChangesDetected,
                NextInventoryAt = DateTime.TryParse(response.Data.NextInventoryAt, out var nextAt)
                    ? nextAt
                    : DateTime.UtcNow.AddHours(24)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao coletar e enviar inventario");
            return new InventoryResult
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    private static InventoryRequest ConvertToRequest(string deviceId, FullInventory inventory)
    {
        return new InventoryRequest
        {
            DeviceId = deviceId,
            CollectedAt = inventory.CollectedAt.ToString("o"),
            Hardware = inventory.Hardware != null ? ConvertHardware(inventory.Hardware) : null,
            Disks = inventory.Disks.Select(ConvertDisk).ToList(),
            Network = inventory.Network.Select(ConvertNetwork).ToList(),
            Software = inventory.Software.Select(ConvertSoftware).ToList()
        };
    }

    private static HardwareInfoDto ConvertHardware(HardwareInfo hw)
    {
        return new HardwareInfoDto
        {
            CpuModel = hw.CpuModel,
            CpuCores = hw.CpuCores,
            CpuThreads = hw.CpuThreads,
            CpuMaxClockMhz = hw.CpuMaxClockMhz,
            CpuArchitecture = hw.CpuArchitecture,
            RamTotalGb = hw.RamTotalGb,
            RamSlotsUsed = hw.RamSlotsUsed,
            RamSlotsTotal = hw.RamSlotsTotal,
            GpuModel = hw.GpuModel,
            GpuMemoryGb = hw.GpuMemoryGb,
            MotherboardManufacturer = hw.MotherboardManufacturer,
            MotherboardModel = hw.MotherboardModel,
            BiosVersion = hw.BiosVersion,
            BiosDate = hw.BiosDate
        };
    }

    private static DiskInfoDto ConvertDisk(DiskInfo disk)
    {
        return new DiskInfoDto
        {
            DriveLetter = disk.DriveLetter,
            VolumeLabel = disk.VolumeLabel,
            DiskType = disk.DiskType,
            FileSystem = disk.FileSystem,
            TotalGb = disk.TotalGb,
            FreeGb = disk.FreeGb,
            UsedPercent = disk.UsedPercent,
            SerialNumber = disk.SerialNumber,
            Model = disk.Model
        };
    }

    private static NetworkInfoDto ConvertNetwork(NetworkInfo net)
    {
        return new NetworkInfoDto
        {
            InterfaceName = net.InterfaceName,
            InterfaceType = net.InterfaceType,
            MacAddress = net.MacAddress,
            Ipv4Address = net.Ipv4Address,
            Ipv4Subnet = net.Ipv4Subnet,
            Ipv4Gateway = net.Ipv4Gateway,
            Ipv6Address = net.Ipv6Address,
            DnsServers = net.DnsServers,
            IsPrimary = net.IsPrimary,
            IsDhcpEnabled = net.IsDhcpEnabled,
            SpeedMbps = net.SpeedMbps,
            WifiSsid = net.WifiSsid
        };
    }

    private static SoftwareInfoDto ConvertSoftware(SoftwareInfo sw)
    {
        return new SoftwareInfoDto
        {
            Name = sw.Name,
            Version = sw.Version,
            Publisher = sw.Publisher,
            InstallDate = sw.InstallDate,
            InstallLocation = sw.InstallLocation,
            SizeMb = sw.SizeMb,
            IsSystemComponent = sw.IsSystemComponent
        };
    }
}
