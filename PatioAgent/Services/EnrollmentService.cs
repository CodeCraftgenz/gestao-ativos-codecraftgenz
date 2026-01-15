using System.Management;
using System.Net.NetworkInformation;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent.Services;

/// <summary>
/// Servico de enrollment - registra o dispositivo no servidor
/// </summary>
public class EnrollmentService
{
    private readonly ApiClient _apiClient;
    private readonly LocalStorage _storage;

    public EnrollmentService(ApiClient apiClient, LocalStorage storage)
    {
        _apiClient = apiClient;
        _storage = storage;
    }

    public async Task<bool> EnrollAsync()
    {
        Log.Information("Iniciando enrollment do dispositivo");

        try
        {
            var deviceInfo = CollectDeviceInfo();
            var response = await _apiClient.PostAsync<EnrollResponse>("/api/agent/enroll", deviceInfo, authenticate: false);

            if (!response.Success || response.Data == null)
            {
                Log.Warning("Falha no enrollment: {Error}", response.Error);
                return false;
            }

            var data = response.Data;
            Log.Information("Enrollment resultado: {Status}", data.Status);

            switch (data.Status)
            {
                case "approved":
                    _storage.Config.DeviceId = deviceInfo.DeviceId;
                    _storage.UpdateTokens(data.AgentToken!, data.RefreshToken);
                    _storage.SetEnrollmentStatus(EnrollmentStatus.Approved);
                    Log.Information("Dispositivo aprovado!");
                    return true;

                case "pending":
                    _storage.Config.DeviceId = deviceInfo.DeviceId;
                    _storage.SetEnrollmentStatus(EnrollmentStatus.Pending);
                    Log.Information("Dispositivo aguardando aprovacao");
                    return false;

                case "blocked":
                    _storage.SetEnrollmentStatus(EnrollmentStatus.Blocked);
                    Log.Warning("Dispositivo bloqueado");
                    return false;

                default:
                    Log.Warning("Status desconhecido: {Status}", data.Status);
                    return false;
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro durante enrollment");
            return false;
        }
    }

    public async Task<bool> CheckStatusAsync()
    {
        if (string.IsNullOrEmpty(_storage.Config.DeviceId))
            return false;

        try
        {
            var response = await _apiClient.GetAsync<EnrollStatusResponse>(
                $"/api/agent/enroll/status?device_id={_storage.Config.DeviceId}",
                authenticate: false
            );

            if (!response.Success || response.Data == null)
                return false;

            var data = response.Data;

            if (data.Status == "approved" && !string.IsNullOrEmpty(data.AgentToken))
            {
                _storage.UpdateTokens(data.AgentToken, data.RefreshToken);
                _storage.SetEnrollmentStatus(EnrollmentStatus.Approved);
                Log.Information("Dispositivo foi aprovado!");
                return true;
            }

            if (data.Status == "blocked")
            {
                _storage.SetEnrollmentStatus(EnrollmentStatus.Blocked);
            }

            return false;
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao verificar status");
            return false;
        }
    }

    private EnrollRequest CollectDeviceInfo()
    {
        var deviceId = _storage.Config.DeviceId ?? Guid.NewGuid().ToString();

        return new EnrollRequest
        {
            DeviceId = deviceId,
            Hostname = Environment.MachineName,
            SerialBios = GetWmiValue("Win32_BIOS", "SerialNumber"),
            SystemUuid = GetWmiValue("Win32_ComputerSystemProduct", "UUID"),
            PrimaryMacAddress = GetPrimaryMacAddress(),
            OsName = GetOsName(),
            OsVersion = Environment.OSVersion.Version.ToString(),
            OsBuild = Environment.OSVersion.Version.Build.ToString(),
            OsArchitecture = Environment.Is64BitOperatingSystem ? "x64" : "x86",
            AgentVersion = "1.0.0",
            CurrentUser = Environment.UserName,
            Domain = Environment.UserDomainName
        };
    }

    private static string? GetWmiValue(string wmiClass, string property)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher($"SELECT {property} FROM {wmiClass}");
            foreach (var obj in searcher.Get())
            {
                var value = obj[property]?.ToString();
                if (!string.IsNullOrWhiteSpace(value) && value != "To Be Filled By O.E.M.")
                    return value;
            }
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Erro ao obter {Property} de {Class}", property, wmiClass);
        }
        return null;
    }

    private static string? GetPrimaryMacAddress()
    {
        try
        {
            return NetworkInterface.GetAllNetworkInterfaces()
                .Where(n => n.OperationalStatus == OperationalStatus.Up &&
                           n.NetworkInterfaceType != NetworkInterfaceType.Loopback)
                .Select(n => n.GetPhysicalAddress().ToString())
                .FirstOrDefault(m => !string.IsNullOrEmpty(m) && m.Length == 12)?
                .Insert(10, ":")
                .Insert(8, ":")
                .Insert(6, ":")
                .Insert(4, ":")
                .Insert(2, ":");
        }
        catch
        {
            return null;
        }
    }

    private static string GetOsName()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Caption FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                return obj["Caption"]?.ToString() ?? "Windows";
            }
        }
        catch { }
        return "Windows";
    }
}

// DTOs
public class EnrollRequest
{
    public string DeviceId { get; set; } = "";
    public string Hostname { get; set; } = "";
    public string? SerialBios { get; set; }
    public string? SystemUuid { get; set; }
    public string? PrimaryMacAddress { get; set; }
    public string? OsName { get; set; }
    public string? OsVersion { get; set; }
    public string? OsBuild { get; set; }
    public string? OsArchitecture { get; set; }
    public string? AgentVersion { get; set; }
    public string? CurrentUser { get; set; }
    public string? Domain { get; set; }
}

public class EnrollResponse
{
    public string Status { get; set; } = "";
    public string? Message { get; set; }
    public int? DeviceInternalId { get; set; }
    public string? AgentToken { get; set; }
    public string? RefreshToken { get; set; }
}

public class EnrollStatusResponse
{
    public string Status { get; set; } = "";
    public string? AgentToken { get; set; }
    public string? RefreshToken { get; set; }
}
