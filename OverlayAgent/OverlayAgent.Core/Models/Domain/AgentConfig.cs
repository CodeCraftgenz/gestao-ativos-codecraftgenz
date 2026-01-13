namespace OverlayAgent.Core.Models.Domain;

/// <summary>
/// Configuracao do agente recebida do servidor
/// </summary>
public class AgentConfig
{
    /// <summary>
    /// Intervalo de heartbeat em segundos
    /// </summary>
    public int HeartbeatIntervalSeconds { get; set; } = 60;

    /// <summary>
    /// Intervalo de coleta de inventario em horas
    /// </summary>
    public int InventoryIntervalHours { get; set; } = 24;

    /// <summary>
    /// Intervalo de polling de comandos em segundos
    /// </summary>
    public int CommandPollIntervalSeconds { get; set; } = 30;
}

/// <summary>
/// Configuracao local do agente (persistida no disco)
/// </summary>
public class LocalAgentConfig
{
    /// <summary>
    /// URL base do servidor
    /// </summary>
    public string ServerUrl { get; set; } = "http://localhost:3000";

    /// <summary>
    /// GUID unico do dispositivo
    /// </summary>
    public string? DeviceId { get; set; }

    /// <summary>
    /// Token de autenticacao do agente
    /// </summary>
    public string? AgentToken { get; set; }

    /// <summary>
    /// Token de refresh
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Status do enrollment
    /// </summary>
    public EnrollmentStatus EnrollmentStatus { get; set; } = EnrollmentStatus.NotEnrolled;

    /// <summary>
    /// Configuracoes recebidas do servidor
    /// </summary>
    public AgentConfig ServerConfig { get; set; } = new();

    /// <summary>
    /// Data/hora da ultima coleta de inventario
    /// </summary>
    public DateTime? LastInventoryAt { get; set; }

    /// <summary>
    /// Data/hora do ultimo heartbeat enviado
    /// </summary>
    public DateTime? LastHeartbeatAt { get; set; }
}

public enum EnrollmentStatus
{
    NotEnrolled,
    Pending,
    Approved,
    Blocked
}
