using System.Reflection;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Collectors;
using OverlayAgent.Core.Http;
using OverlayAgent.Core.Models.Domain;
using OverlayAgent.Core.Models.Requests;
using OverlayAgent.Core.Storage;

namespace OverlayAgent.Core.Services;

/// <summary>
/// Interface do servico de enrollment
/// </summary>
public interface IEnrollmentService
{
    /// <summary>
    /// Verifica se o dispositivo ja esta enrolled
    /// </summary>
    Task<bool> IsEnrolledAsync();

    /// <summary>
    /// Executa o processo de enrollment
    /// </summary>
    Task<EnrollmentResult> EnrollAsync();

    /// <summary>
    /// Verifica o status do enrollment (para dispositivos pendentes)
    /// </summary>
    Task<EnrollmentResult> CheckEnrollmentStatusAsync();
}

/// <summary>
/// Resultado do enrollment
/// </summary>
public class EnrollmentResult
{
    public bool Success { get; set; }
    public EnrollmentStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Error { get; set; }
}

/// <summary>
/// Servico responsavel pelo enrollment do dispositivo
/// </summary>
public class EnrollmentService : IEnrollmentService
{
    private readonly IApiClient _apiClient;
    private readonly ISecureStorage _storage;
    private readonly ICollector<SystemInfo> _systemInfoCollector;
    private readonly ILogger<EnrollmentService> _logger;

    public EnrollmentService(
        IApiClient apiClient,
        ISecureStorage storage,
        ICollector<SystemInfo> systemInfoCollector,
        ILogger<EnrollmentService> logger)
    {
        _apiClient = apiClient;
        _storage = storage;
        _systemInfoCollector = systemInfoCollector;
        _logger = logger;
    }

    public async Task<bool> IsEnrolledAsync()
    {
        var config = await _storage.LoadConfigAsync();
        return config.EnrollmentStatus == EnrollmentStatus.Approved &&
               !string.IsNullOrEmpty(config.AgentToken);
    }

    public async Task<EnrollmentResult> EnrollAsync()
    {
        try
        {
            _logger.LogInformation("Iniciando processo de enrollment...");

            // Carrega ou cria config local
            var config = await _storage.LoadConfigAsync();

            // Gera novo DeviceId se nao existir
            if (string.IsNullOrEmpty(config.DeviceId))
            {
                config.DeviceId = Guid.NewGuid().ToString();
                _logger.LogInformation("Novo DeviceId gerado: {DeviceId}", config.DeviceId);
            }

            // Coleta informacoes do sistema
            var systemInfo = await _systemInfoCollector.CollectAsync();

            // Monta request
            var request = new EnrollRequest
            {
                DeviceId = config.DeviceId,
                Hostname = systemInfo.Hostname,
                SerialBios = systemInfo.SerialBios,
                SystemUuid = systemInfo.SystemUuid,
                PrimaryMacAddress = systemInfo.PrimaryMacAddress,
                OsName = systemInfo.OsName,
                OsVersion = systemInfo.OsVersion,
                OsBuild = systemInfo.OsBuild,
                OsArchitecture = systemInfo.OsArchitecture,
                AgentVersion = GetAgentVersion(),
                CurrentUser = systemInfo.CurrentUser,
                Domain = systemInfo.Domain
            };

            // Envia para o servidor
            var response = await _apiClient.EnrollAsync(request);

            if (!response.Success || response.Data == null)
            {
                _logger.LogError("Falha no enrollment: {Error}", response.Error);
                return new EnrollmentResult
                {
                    Success = false,
                    Status = EnrollmentStatus.NotEnrolled,
                    Error = response.Error ?? "Erro desconhecido"
                };
            }

            // Processa resposta
            var enrollResponse = response.Data;

            switch (enrollResponse.Status)
            {
                case "approved":
                    config.EnrollmentStatus = EnrollmentStatus.Approved;
                    config.AgentToken = enrollResponse.AgentToken;
                    config.RefreshToken = enrollResponse.RefreshToken;

                    if (enrollResponse.Config != null)
                    {
                        config.ServerConfig = new AgentConfig
                        {
                            HeartbeatIntervalSeconds = enrollResponse.Config.HeartbeatIntervalSeconds,
                            InventoryIntervalHours = enrollResponse.Config.InventoryIntervalHours,
                            CommandPollIntervalSeconds = enrollResponse.Config.CommandPollIntervalSeconds
                        };
                    }

                    await _storage.SaveConfigAsync(config);

                    _logger.LogInformation("Enrollment aprovado! DeviceId: {DeviceId}", config.DeviceId);

                    return new EnrollmentResult
                    {
                        Success = true,
                        Status = EnrollmentStatus.Approved,
                        Message = enrollResponse.Message
                    };

                case "pending":
                    config.EnrollmentStatus = EnrollmentStatus.Pending;
                    await _storage.SaveConfigAsync(config);

                    _logger.LogInformation("Enrollment pendente - aguardando aprovacao do admin");

                    return new EnrollmentResult
                    {
                        Success = true,
                        Status = EnrollmentStatus.Pending,
                        Message = enrollResponse.Message
                    };

                case "blocked":
                    config.EnrollmentStatus = EnrollmentStatus.Blocked;
                    await _storage.SaveConfigAsync(config);

                    _logger.LogWarning("Dispositivo bloqueado pelo servidor");

                    return new EnrollmentResult
                    {
                        Success = false,
                        Status = EnrollmentStatus.Blocked,
                        Message = enrollResponse.Message,
                        Error = "Dispositivo bloqueado"
                    };

                default:
                    _logger.LogWarning("Status de enrollment desconhecido: {Status}", enrollResponse.Status);
                    return new EnrollmentResult
                    {
                        Success = false,
                        Status = EnrollmentStatus.NotEnrolled,
                        Error = $"Status desconhecido: {enrollResponse.Status}"
                    };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro durante o enrollment");
            return new EnrollmentResult
            {
                Success = false,
                Status = EnrollmentStatus.NotEnrolled,
                Error = ex.Message
            };
        }
    }

    public async Task<EnrollmentResult> CheckEnrollmentStatusAsync()
    {
        try
        {
            var config = await _storage.LoadConfigAsync();

            if (string.IsNullOrEmpty(config.DeviceId))
            {
                return new EnrollmentResult
                {
                    Success = false,
                    Status = EnrollmentStatus.NotEnrolled,
                    Error = "DeviceId nao encontrado"
                };
            }

            _logger.LogDebug("Verificando status de enrollment para DeviceId: {DeviceId}", config.DeviceId);

            var response = await _apiClient.GetEnrollStatusAsync(config.DeviceId);

            if (!response.Success || response.Data == null)
            {
                _logger.LogWarning("Falha ao verificar status: {Error}", response.Error);
                return new EnrollmentResult
                {
                    Success = false,
                    Status = config.EnrollmentStatus,
                    Error = response.Error
                };
            }

            var enrollResponse = response.Data;

            switch (enrollResponse.Status)
            {
                case "approved":
                    config.EnrollmentStatus = EnrollmentStatus.Approved;
                    config.AgentToken = enrollResponse.AgentToken;
                    config.RefreshToken = enrollResponse.RefreshToken;

                    if (enrollResponse.Config != null)
                    {
                        config.ServerConfig = new AgentConfig
                        {
                            HeartbeatIntervalSeconds = enrollResponse.Config.HeartbeatIntervalSeconds,
                            InventoryIntervalHours = enrollResponse.Config.InventoryIntervalHours,
                            CommandPollIntervalSeconds = enrollResponse.Config.CommandPollIntervalSeconds
                        };
                    }

                    await _storage.SaveConfigAsync(config);

                    _logger.LogInformation("Dispositivo foi aprovado!");

                    return new EnrollmentResult
                    {
                        Success = true,
                        Status = EnrollmentStatus.Approved,
                        Message = enrollResponse.Message
                    };

                case "pending":
                    return new EnrollmentResult
                    {
                        Success = true,
                        Status = EnrollmentStatus.Pending,
                        Message = "Aguardando aprovacao do administrador"
                    };

                case "blocked":
                    config.EnrollmentStatus = EnrollmentStatus.Blocked;
                    config.AgentToken = null;
                    config.RefreshToken = null;
                    await _storage.SaveConfigAsync(config);

                    _logger.LogWarning("Dispositivo foi bloqueado");

                    return new EnrollmentResult
                    {
                        Success = false,
                        Status = EnrollmentStatus.Blocked,
                        Message = enrollResponse.Message,
                        Error = "Dispositivo bloqueado"
                    };

                default:
                    return new EnrollmentResult
                    {
                        Success = false,
                        Status = config.EnrollmentStatus,
                        Error = $"Status desconhecido: {enrollResponse.Status}"
                    };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao verificar status de enrollment");
            return new EnrollmentResult
            {
                Success = false,
                Status = EnrollmentStatus.NotEnrolled,
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
}
