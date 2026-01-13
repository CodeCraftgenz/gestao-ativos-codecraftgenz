using System.Diagnostics;
using System.Reflection;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Http;
using OverlayAgent.Core.Models.Requests;
using OverlayAgent.Core.Storage;

namespace OverlayAgent.Core.Services;

/// <summary>
/// Interface do servico de heartbeat
/// </summary>
public interface IHeartbeatService
{
    /// <summary>
    /// Envia um heartbeat para o servidor
    /// </summary>
    Task<HeartbeatResult> SendHeartbeatAsync();
}

/// <summary>
/// Resultado do heartbeat
/// </summary>
public class HeartbeatResult
{
    public bool Success { get; set; }
    public bool HasPendingCommands { get; set; }
    public bool ConfigChanged { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Servico responsavel por enviar heartbeats periodicos
/// </summary>
public class HeartbeatService : IHeartbeatService
{
    private readonly IApiClient _apiClient;
    private readonly ISecureStorage _storage;
    private readonly ILogger<HeartbeatService> _logger;

    private PerformanceCounter? _cpuCounter;
    private PerformanceCounter? _ramCounter;

    public HeartbeatService(
        IApiClient apiClient,
        ISecureStorage storage,
        ILogger<HeartbeatService> logger)
    {
        _apiClient = apiClient;
        _storage = storage;
        _logger = logger;

        InitializePerformanceCounters();
    }

    private void InitializePerformanceCounters()
    {
        try
        {
            _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            _ramCounter = new PerformanceCounter("Memory", "% Committed Bytes In Use");

            // Primeira leitura descarta (inicializacao)
            _cpuCounter.NextValue();
            _ramCounter.NextValue();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao inicializar contadores de performance");
        }
    }

    public async Task<HeartbeatResult> SendHeartbeatAsync()
    {
        try
        {
            var config = await _storage.LoadConfigAsync();

            if (string.IsNullOrEmpty(config.DeviceId))
            {
                _logger.LogWarning("DeviceId nao encontrado, nao e possivel enviar heartbeat");
                return new HeartbeatResult
                {
                    Success = false,
                    Error = "DeviceId nao configurado"
                };
            }

            var request = new HeartbeatRequest
            {
                DeviceId = config.DeviceId,
                Timestamp = DateTime.UtcNow.ToString("o"),
                AgentVersion = GetAgentVersion(),
                UptimeSeconds = GetUptimeSeconds(),
                CpuUsagePercent = GetCpuUsage(),
                RamUsagePercent = GetRamUsage(),
                DiskFreeGb = GetDiskFreeGb(),
                CurrentUser = Environment.UserName
            };

            _logger.LogDebug("Enviando heartbeat - CPU: {Cpu}%, RAM: {Ram}%, Disco livre: {Disk}GB",
                request.CpuUsagePercent?.ToString("F1") ?? "N/A",
                request.RamUsagePercent?.ToString("F1") ?? "N/A",
                request.DiskFreeGb?.ToString("F2") ?? "N/A");

            var response = await _apiClient.SendHeartbeatAsync(request);

            if (!response.Success || response.Data == null)
            {
                _logger.LogWarning("Heartbeat rejeitado: {Error}", response.Error);
                return new HeartbeatResult
                {
                    Success = false,
                    Error = response.Error
                };
            }

            var heartbeatResponse = response.Data;

            // Atualiza config se mudou
            if (heartbeatResponse.ConfigChanged && heartbeatResponse.NewConfig != null)
            {
                _logger.LogInformation("Configuracao alterada pelo servidor");

                config.ServerConfig.HeartbeatIntervalSeconds = heartbeatResponse.NewConfig.HeartbeatIntervalSeconds;
                config.ServerConfig.InventoryIntervalHours = heartbeatResponse.NewConfig.InventoryIntervalHours;
                config.ServerConfig.CommandPollIntervalSeconds = heartbeatResponse.NewConfig.CommandPollIntervalSeconds;

                await _storage.SaveConfigAsync(config);
            }

            // Atualiza ultimo heartbeat
            config.LastHeartbeatAt = DateTime.UtcNow;
            await _storage.SaveConfigAsync(config);

            _logger.LogDebug("Heartbeat aceito - Comandos pendentes: {HasCommands}",
                heartbeatResponse.HasPendingCommands);

            return new HeartbeatResult
            {
                Success = true,
                HasPendingCommands = heartbeatResponse.HasPendingCommands,
                ConfigChanged = heartbeatResponse.ConfigChanged
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao enviar heartbeat");
            return new HeartbeatResult
            {
                Success = false,
                Error = ex.Message
            };
        }
    }

    private string GetAgentVersion()
    {
        return Assembly.GetExecutingAssembly()
            .GetName()
            .Version?
            .ToString(3) ?? "1.0.0";
    }

    private long GetUptimeSeconds()
    {
        try
        {
            return Environment.TickCount64 / 1000;
        }
        catch
        {
            return 0;
        }
    }

    private float? GetCpuUsage()
    {
        try
        {
            if (_cpuCounter == null) return null;
            return _cpuCounter.NextValue();
        }
        catch
        {
            return null;
        }
    }

    private float? GetRamUsage()
    {
        try
        {
            if (_ramCounter == null) return null;
            return _ramCounter.NextValue();
        }
        catch
        {
            return null;
        }
    }

    private float? GetDiskFreeGb()
    {
        try
        {
            // Drive do sistema
            var systemDrive = new DriveInfo(Path.GetPathRoot(Environment.SystemDirectory) ?? "C:");

            if (systemDrive.IsReady)
            {
                return (float)(systemDrive.AvailableFreeSpace / 1024.0 / 1024.0 / 1024.0);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Erro ao obter espaco livre em disco");
        }

        return null;
    }
}
