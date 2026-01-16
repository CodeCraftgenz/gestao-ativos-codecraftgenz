using Microsoft.Extensions.Hosting;
using PatioAgent.Services;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent;

/// <summary>
/// Worker principal do PatioAgent
/// </summary>
public class PatioWorker : BackgroundService
{
    private readonly LocalStorage _storage;
    private readonly EnrollmentService _enrollmentService;
    private readonly EventCollector _eventCollector;

    // Intervalos
    private readonly TimeSpan _heartbeatInterval = TimeSpan.FromMinutes(5);
    private readonly TimeSpan _eventCollectionInterval = TimeSpan.FromMinutes(10);
    private readonly TimeSpan _pendingCheckInterval = TimeSpan.FromMinutes(5);
    private readonly TimeSpan _blockedCheckInterval = TimeSpan.FromMinutes(30);

    // Controle de enrollment para evitar loops
    private DateTime _lastEnrollmentTime = DateTime.MinValue;
    private int _consecutiveEnrollmentFailures = 0;
    private readonly TimeSpan _minEnrollmentInterval = TimeSpan.FromMinutes(2);

    public PatioWorker(
        LocalStorage storage,
        EnrollmentService enrollmentService,
        EventCollector eventCollector)
    {
        _storage = storage;
        _enrollmentService = enrollmentService;
        _eventCollector = eventCollector;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Log.Information("PatioWorker iniciado");

        // Aguarda um pouco para o sistema estabilizar
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Erro no ciclo principal");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        Log.Information("PatioWorker finalizado");
    }

    private async Task RunCycleAsync(CancellationToken ct)
    {
        var status = _storage.Config.Status;

        switch (status)
        {
            case EnrollmentStatus.NotEnrolled:
                await HandleNotEnrolledAsync(ct);
                break;

            case EnrollmentStatus.Pending:
                await HandlePendingAsync(ct);
                break;

            case EnrollmentStatus.Approved:
                await HandleApprovedAsync(ct);
                break;

            case EnrollmentStatus.Blocked:
                await HandleBlockedAsync(ct);
                break;
        }
    }

    private async Task HandleNotEnrolledAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var timeSinceLastEnrollment = now - _lastEnrollmentTime;

        // Evita enrollment em loop - aguarda intervalo minimo
        if (timeSinceLastEnrollment < _minEnrollmentInterval)
        {
            var waitTime = _minEnrollmentInterval - timeSinceLastEnrollment;
            Log.Debug("Aguardando {Seconds}s antes de novo enrollment (cooldown)", waitTime.TotalSeconds);
            await Task.Delay(waitTime, ct);
            return;
        }

        // Backoff exponencial apos falhas consecutivas
        if (_consecutiveEnrollmentFailures > 0)
        {
            var backoffMinutes = Math.Min(Math.Pow(2, _consecutiveEnrollmentFailures), 30);
            Log.Information("Aguardando {Minutes} minutos antes de tentar enrollment (falha #{Count})",
                backoffMinutes, _consecutiveEnrollmentFailures);
            await Task.Delay(TimeSpan.FromMinutes(backoffMinutes), ct);
        }

        Log.Information("Dispositivo nao registrado, iniciando enrollment...");
        _lastEnrollmentTime = now;

        var enrolled = await _enrollmentService.EnrollAsync();

        if (enrolled)
        {
            Log.Information("Enrollment concluido com sucesso!");
            _consecutiveEnrollmentFailures = 0;

            // Aguarda um pouco antes de enviar eventos para garantir que o token foi persistido
            await Task.Delay(TimeSpan.FromSeconds(3), ct);

            // Envia eventos pendentes
            await _eventCollector.CollectAndSendEventsAsync();
        }
        else
        {
            _consecutiveEnrollmentFailures++;
            Log.Warning("Enrollment falhou (tentativa #{Count})", _consecutiveEnrollmentFailures);
        }
    }

    private async Task HandlePendingAsync(CancellationToken ct)
    {
        Log.Debug("Aguardando aprovacao do dispositivo...");

        var approved = await _enrollmentService.CheckStatusAsync();

        if (approved)
        {
            Log.Information("Dispositivo aprovado!");
            await _eventCollector.CollectAndSendEventsAsync();
        }
        else
        {
            await Task.Delay(_pendingCheckInterval, ct);
        }
    }

    private async Task HandleApprovedAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Verifica se deve enviar heartbeat
        var lastHeartbeat = _storage.Config.LastHeartbeatAt ?? DateTime.MinValue;
        if (now - lastHeartbeat >= _heartbeatInterval)
        {
            await _eventCollector.SendHeartbeatAsync();

            // Se token foi revogado durante heartbeat, aguarda antes de fazer novo enrollment
            if (_storage.Config.Status == EnrollmentStatus.NotEnrolled)
            {
                Log.Warning("Token revogado no heartbeat. Aguardando cooldown antes de re-enrollment...");
                _lastEnrollmentTime = DateTime.UtcNow; // Ativa cooldown
                return;
            }
        }

        // Verifica se deve coletar eventos (apenas se ainda aprovado)
        if (_storage.Config.Status == EnrollmentStatus.Approved)
        {
            var lastEvent = _storage.Config.LastEventSentAt ?? DateTime.MinValue;
            if (now - lastEvent >= _eventCollectionInterval)
            {
                await _eventCollector.CollectAndSendEventsAsync();
            }
        }

        // Aguarda proximo ciclo
        await Task.Delay(TimeSpan.FromMinutes(1), ct);
    }

    private async Task HandleBlockedAsync(CancellationToken ct)
    {
        Log.Debug("Dispositivo bloqueado, verificando periodicamente...");

        // Verifica se foi desbloqueado
        await _enrollmentService.CheckStatusAsync();

        await Task.Delay(_blockedCheckInterval, ct);
    }
}
