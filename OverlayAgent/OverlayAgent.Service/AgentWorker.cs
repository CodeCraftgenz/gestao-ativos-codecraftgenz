using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Domain;
using OverlayAgent.Core.Services;
using OverlayAgent.Core.Storage;

namespace OverlayAgent.Service;

/// <summary>
/// Worker principal do agente que coordena todas as operacoes
/// </summary>
public class AgentWorker : BackgroundService
{
    private readonly IEnrollmentService _enrollmentService;
    private readonly IHeartbeatService _heartbeatService;
    private readonly IInventoryService _inventoryService;
    private readonly ISecureStorage _storage;
    private readonly ILogger<AgentWorker> _logger;

    // Intervalos padrao (podem ser sobrescritos pelo servidor)
    private TimeSpan _heartbeatInterval = TimeSpan.FromSeconds(60);
    private TimeSpan _inventoryInterval = TimeSpan.FromHours(24);
    private TimeSpan _enrollmentCheckInterval = TimeSpan.FromMinutes(5);

    // Controle de ultimo inventario
    private DateTime _lastInventoryAt = DateTime.MinValue;

    public AgentWorker(
        IEnrollmentService enrollmentService,
        IHeartbeatService heartbeatService,
        IInventoryService inventoryService,
        ISecureStorage storage,
        ILogger<AgentWorker> logger)
    {
        _enrollmentService = enrollmentService;
        _heartbeatService = heartbeatService;
        _inventoryService = inventoryService;
        _storage = storage;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Agent Worker iniciado");

        // Aguarda um pouco antes de comecar (para o sistema estabilizar)
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Carrega config atual
                var config = await _storage.LoadConfigAsync();

                // Atualiza intervalos baseado na config do servidor
                _heartbeatInterval = TimeSpan.FromSeconds(config.ServerConfig.HeartbeatIntervalSeconds);
                _inventoryInterval = TimeSpan.FromHours(config.ServerConfig.InventoryIntervalHours);

                // Atualiza ultimo inventario da config
                if (config.LastInventoryAt.HasValue)
                {
                    _lastInventoryAt = config.LastInventoryAt.Value;
                }

                switch (config.EnrollmentStatus)
                {
                    case EnrollmentStatus.NotEnrolled:
                        await HandleNotEnrolledAsync(stoppingToken);
                        break;

                    case EnrollmentStatus.Pending:
                        await HandlePendingAsync(stoppingToken);
                        break;

                    case EnrollmentStatus.Approved:
                        await HandleApprovedAsync(stoppingToken);
                        break;

                    case EnrollmentStatus.Blocked:
                        await HandleBlockedAsync(stoppingToken);
                        break;
                }
            }
            catch (OperationCanceledException)
            {
                // Servico parando
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no loop principal do worker");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }

        _logger.LogInformation("Agent Worker encerrado");
    }

    private async Task HandleNotEnrolledAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Dispositivo nao registrado. Iniciando enrollment...");

        var result = await _enrollmentService.EnrollAsync();

        if (result.Success)
        {
            _logger.LogInformation("Enrollment realizado: {Status} - {Message}",
                result.Status, result.Message);
        }
        else
        {
            _logger.LogWarning("Falha no enrollment: {Error}. Tentando novamente em 30s...",
                result.Error);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task HandlePendingAsync(CancellationToken stoppingToken)
    {
        _logger.LogDebug("Verificando status de aprovacao...");

        var result = await _enrollmentService.CheckEnrollmentStatusAsync();

        if (result.Status == EnrollmentStatus.Approved)
        {
            _logger.LogInformation("Dispositivo aprovado! Iniciando operacao normal.");
        }
        else if (result.Status == EnrollmentStatus.Blocked)
        {
            _logger.LogWarning("Dispositivo bloqueado pelo administrador.");
        }
        else
        {
            _logger.LogDebug("Ainda aguardando aprovacao. Proxima verificacao em {Interval}",
                _enrollmentCheckInterval);
            await Task.Delay(_enrollmentCheckInterval, stoppingToken);
        }
    }

    private async Task HandleApprovedAsync(CancellationToken stoppingToken)
    {
        // Verifica se e hora de enviar inventario
        var timeSinceLastInventory = DateTime.UtcNow - _lastInventoryAt;
        if (timeSinceLastInventory >= _inventoryInterval || _lastInventoryAt == DateTime.MinValue)
        {
            _logger.LogInformation("Enviando inventario (ultimo: {LastInventory}, intervalo: {Interval})",
                _lastInventoryAt == DateTime.MinValue ? "nunca" : _lastInventoryAt.ToString("o"),
                _inventoryInterval);

            var inventoryResult = await _inventoryService.CollectAndSendAsync();

            if (inventoryResult.Success)
            {
                _logger.LogInformation("Inventario enviado com sucesso");
                _lastInventoryAt = DateTime.UtcNow;
            }
            else
            {
                _logger.LogWarning("Falha ao enviar inventario: {Error}", inventoryResult.Error);

                // Se token foi revogado, invalida e faz re-enrollment
                if (IsTokenRevokedError(inventoryResult.Error))
                {
                    await HandleTokenRevokedAsync();
                    return;
                }
            }
        }

        // Envia heartbeat
        var heartbeatResult = await _heartbeatService.SendHeartbeatAsync();

        if (heartbeatResult.Success)
        {
            _logger.LogDebug("Heartbeat enviado com sucesso");

            // Se ha comandos pendentes, processa
            if (heartbeatResult.HasPendingCommands)
            {
                _logger.LogInformation("Ha comandos pendentes para processar");
                // TODO: Implementar CommandService para buscar e executar comandos
            }
        }
        else
        {
            _logger.LogWarning("Falha ao enviar heartbeat: {Error}", heartbeatResult.Error);

            // Se token foi revogado, invalida e faz re-enrollment
            if (IsTokenRevokedError(heartbeatResult.Error))
            {
                await HandleTokenRevokedAsync();
                return;
            }
        }

        // Aguarda proximo ciclo
        await Task.Delay(_heartbeatInterval, stoppingToken);
    }

    private bool IsTokenRevokedError(string? error)
    {
        if (string.IsNullOrEmpty(error)) return false;

        return error.Contains("Token revogado", StringComparison.OrdinalIgnoreCase) ||
               error.Contains("dispositivo nao encontrado", StringComparison.OrdinalIgnoreCase) ||
               error.Contains("401", StringComparison.OrdinalIgnoreCase);
    }

    private async Task HandleTokenRevokedAsync()
    {
        _logger.LogWarning("Token revogado ou dispositivo nao encontrado. Limpando config e reiniciando enrollment...");

        // Limpa a config e reinicia o enrollment
        var config = await _storage.LoadConfigAsync();
        config.EnrollmentStatus = OverlayAgent.Core.Models.Domain.EnrollmentStatus.NotEnrolled;
        config.AgentToken = null;
        config.RefreshToken = null;
        config.DeviceId = null; // Gera novo DeviceId no proximo enrollment
        await _storage.SaveConfigAsync(config);

        _logger.LogInformation("Config limpa. Proximo ciclo iniciara novo enrollment.");
    }

    private async Task HandleBlockedAsync(CancellationToken stoppingToken)
    {
        _logger.LogWarning("Dispositivo bloqueado. Verificando status periodicamente...");

        // Dispositivo bloqueado - verifica periodicamente se foi desbloqueado
        await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);

        var result = await _enrollmentService.CheckEnrollmentStatusAsync();

        if (result.Status != EnrollmentStatus.Blocked)
        {
            _logger.LogInformation("Status do dispositivo alterado para: {Status}", result.Status);
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Parando Agent Worker...");
        await base.StopAsync(stoppingToken);
    }
}
