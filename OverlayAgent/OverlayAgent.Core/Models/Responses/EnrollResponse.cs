using System.Text.Json.Serialization;

namespace OverlayAgent.Core.Models.Responses;

/// <summary>
/// Response base da API
/// </summary>
public class ApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("details")]
    public List<string>? Details { get; set; }
}

/// <summary>
/// Response do enrollment
/// </summary>
public class EnrollResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("device_internal_id")]
    public int? DeviceInternalId { get; set; }

    [JsonPropertyName("agent_token")]
    public string? AgentToken { get; set; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("config")]
    public AgentConfigResponse? Config { get; set; }
}

/// <summary>
/// Configuracao do agente recebida do servidor
/// </summary>
public class AgentConfigResponse
{
    [JsonPropertyName("heartbeat_interval_seconds")]
    public int HeartbeatIntervalSeconds { get; set; } = 60;

    [JsonPropertyName("inventory_interval_hours")]
    public int InventoryIntervalHours { get; set; } = 24;

    [JsonPropertyName("command_poll_interval_seconds")]
    public int CommandPollIntervalSeconds { get; set; } = 30;
}

/// <summary>
/// Response do heartbeat
/// </summary>
public class HeartbeatResponse
{
    [JsonPropertyName("accepted")]
    public bool Accepted { get; set; }

    [JsonPropertyName("server_time")]
    public string ServerTime { get; set; } = string.Empty;

    [JsonPropertyName("has_pending_commands")]
    public bool HasPendingCommands { get; set; }

    [JsonPropertyName("config_changed")]
    public bool ConfigChanged { get; set; }

    [JsonPropertyName("new_config")]
    public AgentConfigResponse? NewConfig { get; set; }
}

/// <summary>
/// Response do inventario
/// </summary>
public class InventoryResponse
{
    [JsonPropertyName("received")]
    public bool Received { get; set; }

    [JsonPropertyName("changes_detected")]
    public bool ChangesDetected { get; set; }

    [JsonPropertyName("next_inventory_at")]
    public string NextInventoryAt { get; set; } = string.Empty;
}

/// <summary>
/// Response dos comandos pendentes
/// </summary>
public class PendingCommandsResponse
{
    [JsonPropertyName("commands")]
    public List<CommandDto> Commands { get; set; } = new();
}

/// <summary>
/// Comando recebido do servidor
/// </summary>
public class CommandDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("payload")]
    public Dictionary<string, object>? Payload { get; set; }

    [JsonPropertyName("priority")]
    public int Priority { get; set; }

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }
}

/// <summary>
/// Response do envio de eventos
/// </summary>
public class EventsResponse
{
    [JsonPropertyName("received")]
    public int Received { get; set; }
}
