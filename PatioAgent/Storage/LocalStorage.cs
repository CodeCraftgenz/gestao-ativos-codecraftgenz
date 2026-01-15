using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace PatioAgent.Storage;

/// <summary>
/// Armazenamento local seguro usando DPAPI do Windows
/// </summary>
public class LocalStorage
{
    private readonly string _configPath;
    private readonly byte[] _entropy;
    private AgentConfig _config;

    public LocalStorage()
    {
        var appDataPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PatioAgent"
        );

        Directory.CreateDirectory(appDataPath);
        _configPath = Path.Combine(appDataPath, "agent.config");

        // Entropy baseado no hardware para vincular ao dispositivo
        var entropySource = $"{Environment.MachineName}-{Environment.UserName}-PatioAgent";
        _entropy = SHA256.HashData(Encoding.UTF8.GetBytes(entropySource));

        _config = LoadConfig();
    }

    public AgentConfig Config => _config;

    public void Save()
    {
        try
        {
            var json = JsonSerializer.Serialize(_config);
            var plainBytes = Encoding.UTF8.GetBytes(json);
            var encryptedBytes = ProtectedData.Protect(plainBytes, _entropy, DataProtectionScope.LocalMachine);
            File.WriteAllBytes(_configPath, encryptedBytes);
        }
        catch (Exception ex)
        {
            Serilog.Log.Error(ex, "Erro ao salvar configuracao");
        }
    }

    private AgentConfig LoadConfig()
    {
        try
        {
            if (!File.Exists(_configPath))
                return new AgentConfig();

            var encryptedBytes = File.ReadAllBytes(_configPath);
            var plainBytes = ProtectedData.Unprotect(encryptedBytes, _entropy, DataProtectionScope.LocalMachine);
            var json = Encoding.UTF8.GetString(plainBytes);
            return JsonSerializer.Deserialize<AgentConfig>(json) ?? new AgentConfig();
        }
        catch (Exception ex)
        {
            Serilog.Log.Warning(ex, "Erro ao carregar configuracao, usando padrao");
            return new AgentConfig();
        }
    }

    public void UpdateTokens(string agentToken, string? refreshToken = null)
    {
        _config.AgentToken = agentToken;
        if (refreshToken != null)
            _config.RefreshToken = refreshToken;
        Save();
    }

    public void SetEnrollmentStatus(EnrollmentStatus status)
    {
        _config.Status = status;
        Save();
    }

    public void ClearAuth()
    {
        _config.AgentToken = null;
        _config.RefreshToken = null;
        _config.Status = EnrollmentStatus.NotEnrolled;
        Save();
    }
}

public class AgentConfig
{
    public string ServerUrl { get; set; } = "https://gestao-ativos-server.onrender.com";
    public string? DeviceId { get; set; }
    public string? AgentToken { get; set; }
    public string? RefreshToken { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.NotEnrolled;
    public int HeartbeatIntervalSeconds { get; set; } = 300; // 5 minutos
    public DateTime? LastHeartbeatAt { get; set; }
    public DateTime? LastEventSentAt { get; set; }
}

public enum EnrollmentStatus
{
    NotEnrolled,
    Pending,
    Approved,
    Blocked
}
