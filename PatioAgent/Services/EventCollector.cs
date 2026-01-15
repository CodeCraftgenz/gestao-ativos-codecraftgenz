using System.Diagnostics.Eventing.Reader;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent.Services;

/// <summary>
/// Coleta eventos de boot, shutdown, login e logout do Windows Event Log
/// </summary>
public class EventCollector
{
    private readonly ApiClient _apiClient;
    private readonly LocalStorage _storage;
    private DateTime _lastBootTime;
    private DateTime _lastCollectionTime;

    public EventCollector(ApiClient apiClient, LocalStorage storage)
    {
        _apiClient = apiClient;
        _storage = storage;
        _lastBootTime = GetSystemBootTime();
        _lastCollectionTime = _storage.Config.LastEventSentAt ?? DateTime.UtcNow.AddDays(-1);
    }

    /// <summary>
    /// Coleta e envia eventos recentes
    /// </summary>
    public async Task CollectAndSendEventsAsync()
    {
        try
        {
            var events = new List<ActivityEvent>();
            var now = DateTime.UtcNow;

            // Coleta eventos desde a ultima coleta
            var bootEvents = GetBootShutdownEvents(_lastCollectionTime);
            var loginEvents = GetLoginLogoutEvents(_lastCollectionTime);

            events.AddRange(bootEvents);
            events.AddRange(loginEvents);

            if (events.Count == 0)
            {
                Log.Debug("Nenhum evento novo para enviar");
                return;
            }

            // Ordena por data
            events = events.OrderBy(e => e.OccurredAt).ToList();

            Log.Information("Enviando {Count} eventos de atividade", events.Count);

            var request = new ActivityEventsRequest
            {
                DeviceId = _storage.Config.DeviceId!,
                Events = events
            };

            var response = await _apiClient.PostAsync<ActivityEventsResponse>("/api/agent/activity", request);

            if (response.Success)
            {
                _storage.Config.LastEventSentAt = now;
                _storage.Save();
                Log.Information("Eventos enviados com sucesso: {Count}", response.Data?.Received ?? 0);
            }
            else if (response.TokenRevoked)
            {
                Log.Warning("Token revogado, limpando autenticacao");
                _storage.ClearAuth();
            }
            else
            {
                Log.Warning("Falha ao enviar eventos: {Error}", response.Error);
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao coletar/enviar eventos");
        }
    }

    /// <summary>
    /// Envia heartbeat simples
    /// </summary>
    public async Task SendHeartbeatAsync()
    {
        try
        {
            var heartbeat = new HeartbeatRequest
            {
                DeviceId = _storage.Config.DeviceId!,
                Timestamp = DateTime.UtcNow.ToString("o"),
                AgentVersion = "1.0.0",
                UptimeSeconds = (long)(DateTime.UtcNow - _lastBootTime).TotalSeconds,
                CurrentUser = Environment.UserName
            };

            var response = await _apiClient.PostAsync<HeartbeatResponse>("/api/agent/heartbeat", heartbeat);

            if (response.Success)
            {
                _storage.Config.LastHeartbeatAt = DateTime.UtcNow;
                _storage.Save();
                Log.Debug("Heartbeat enviado");
            }
            else if (response.TokenRevoked)
            {
                Log.Warning("Token revogado no heartbeat");
                _storage.ClearAuth();
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao enviar heartbeat");
        }
    }

    private List<ActivityEvent> GetBootShutdownEvents(DateTime since)
    {
        var events = new List<ActivityEvent>();

        try
        {
            // Event ID 6005 = Event Log started (boot)
            // Event ID 6006 = Event Log stopped (shutdown)
            // Event ID 6008 = Unexpected shutdown
            var query = new EventLogQuery("System", PathType.LogName,
                $"*[System[(EventID=6005 or EventID=6006 or EventID=6008) and TimeCreated[@SystemTime>='{since:o}']]]");

            using var reader = new EventLogReader(query);

            EventRecord? record;
            while ((record = reader.ReadEvent()) != null)
            {
                using (record)
                {
                    var eventType = record.Id switch
                    {
                        6005 => "boot",
                        6006 => "shutdown",
                        6008 => "shutdown", // Unexpected shutdown
                        _ => null
                    };

                    if (eventType != null && record.TimeCreated.HasValue)
                    {
                        events.Add(new ActivityEvent
                        {
                            EventType = eventType,
                            OccurredAt = record.TimeCreated.Value.ToUniversalTime().ToString("o")
                        });
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Erro ao ler eventos de boot/shutdown");
        }

        return events;
    }

    private List<ActivityEvent> GetLoginLogoutEvents(DateTime since)
    {
        var events = new List<ActivityEvent>();

        try
        {
            // Event ID 4624 = Login sucesso
            // Event ID 4634 = Logoff
            // Event ID 4647 = User initiated logoff
            var query = new EventLogQuery("Security", PathType.LogName,
                $"*[System[(EventID=4624 or EventID=4634 or EventID=4647) and TimeCreated[@SystemTime>='{since:o}']]]");

            using var reader = new EventLogReader(query);

            EventRecord? record;
            while ((record = reader.ReadEvent()) != null)
            {
                using (record)
                {
                    if (!record.TimeCreated.HasValue) continue;

                    // Para login, filtrar apenas logins interativos (tipo 2, 10, 11)
                    if (record.Id == 4624)
                    {
                        var logonType = GetEventDataValue(record, "LogonType");
                        if (logonType != "2" && logonType != "10" && logonType != "11")
                            continue;
                    }

                    var eventType = record.Id == 4624 ? "login" : "logout";
                    var username = GetEventDataValue(record, "TargetUserName");

                    // Ignorar usuarios de sistema
                    if (IsSystemUser(username)) continue;

                    events.Add(new ActivityEvent
                    {
                        EventType = eventType,
                        OccurredAt = record.TimeCreated.Value.ToUniversalTime().ToString("o"),
                        LoggedUser = username
                    });
                }
            }
        }
        catch (UnauthorizedAccessException)
        {
            Log.Warning("Sem permissao para ler Security Event Log. Execute como administrador.");
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Erro ao ler eventos de login/logout");
        }

        return events;
    }

    private static string? GetEventDataValue(EventRecord record, string name)
    {
        try
        {
            var xml = record.ToXml();
            var start = xml.IndexOf($"Name=\"{name}\"");
            if (start < 0) return null;

            var valueStart = xml.IndexOf(">", start) + 1;
            var valueEnd = xml.IndexOf("<", valueStart);
            if (valueEnd > valueStart)
                return xml[valueStart..valueEnd];
        }
        catch { }
        return null;
    }

    private static bool IsSystemUser(string? username)
    {
        if (string.IsNullOrEmpty(username)) return true;
        var systemUsers = new[] { "SYSTEM", "LOCAL SERVICE", "NETWORK SERVICE", "ANONYMOUS LOGON", "-", "DWM-1", "DWM-2", "UMFD-0", "UMFD-1" };
        return systemUsers.Contains(username.ToUpper()) || username.EndsWith("$");
    }

    private static DateTime GetSystemBootTime()
    {
        try
        {
            var uptime = TimeSpan.FromMilliseconds(Environment.TickCount64);
            return DateTime.UtcNow - uptime;
        }
        catch
        {
            return DateTime.UtcNow;
        }
    }
}

// DTOs
public class ActivityEvent
{
    public string EventType { get; set; } = "";
    public string OccurredAt { get; set; } = "";
    public string? LoggedUser { get; set; }
    public long? DurationSeconds { get; set; }
}

public class ActivityEventsRequest
{
    public string DeviceId { get; set; } = "";
    public List<ActivityEvent> Events { get; set; } = new();
}

public class ActivityEventsResponse
{
    public int Received { get; set; }
}

public class HeartbeatRequest
{
    public string DeviceId { get; set; } = "";
    public string Timestamp { get; set; } = "";
    public string? AgentVersion { get; set; }
    public long? UptimeSeconds { get; set; }
    public string? CurrentUser { get; set; }
}

public class HeartbeatResponse
{
    public bool Received { get; set; }
    public bool HasPendingCommands { get; set; }
}
