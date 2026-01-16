using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent.Services;

/// <summary>
/// Cliente HTTP para comunicacao com a API
/// </summary>
public class ApiClient
{
    private readonly HttpClient _httpClient;
    private readonly LocalStorage _storage;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiClient(LocalStorage storage)
    {
        _storage = storage;
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
    }

    /// <summary>
    /// Gera correlation ID unico para rastreamento
    /// </summary>
    private static string GenerateCorrelationId()
    {
        return $"agent-{Guid.NewGuid():N}"[..24];
    }

    /// <summary>
    /// Calcula SHA-256 do token (igual ao servidor)
    /// </summary>
    private static string CalculateTokenHash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private void SetAuthHeader(string correlationId)
    {
        // Remove headers anteriores
        _httpClient.DefaultRequestHeaders.Remove("X-Correlation-Id");

        // Adiciona correlation ID
        _httpClient.DefaultRequestHeaders.Add("X-Correlation-Id", correlationId);

        if (!string.IsNullOrEmpty(_storage.Config.AgentToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _storage.Config.AgentToken);

            // Log seguro do token (apenas prefixo, sufixo e hash)
            var token = _storage.Config.AgentToken;
            var safePrefix = token.Length > 20 ? token[..10] : "short";
            var safeSuffix = token.Length > 20 ? token[^6..] : "token";
            var tokenHash = CalculateTokenHash(token);
            var hashPrefix = tokenHash[..16];

            Log.Debug("Auth header set [cid={CorrelationId}]: token={Prefix}...{Suffix} (len={Length}), hashPrefix={HashPrefix}",
                correlationId, safePrefix, safeSuffix, token.Length, hashPrefix);
        }
        else
        {
            _httpClient.DefaultRequestHeaders.Authorization = null;
            Log.Debug("No auth token available [cid={CorrelationId}]", correlationId);
        }
    }

    public async Task<ApiResponse<T>> PostAsync<T>(string endpoint, object data, bool authenticate = true) where T : class
    {
        var correlationId = GenerateCorrelationId();

        try
        {
            var url = $"{_storage.Config.ServerUrl}{endpoint}";
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            if (authenticate)
                SetAuthHeader(correlationId);
            else
            {
                _httpClient.DefaultRequestHeaders.Authorization = null;
                _httpClient.DefaultRequestHeaders.Remove("X-Correlation-Id");
                _httpClient.DefaultRequestHeaders.Add("X-Correlation-Id", correlationId);
            }

            Log.Debug("POST {Url} [cid={CorrelationId}]", url, correlationId);
            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonSerializer.Deserialize<ApiWrapper<T>>(responseBody, _jsonOptions);
                Log.Debug("POST {Url} success [cid={CorrelationId}]", url, correlationId);
                return new ApiResponse<T> { Success = true, Data = result?.Data };
            }

            // Erro 401 - Token revogado
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Log.Warning("Token revogado ou expirado [cid={CorrelationId}] - Response: {Body}", correlationId, responseBody);
                return new ApiResponse<T> { Success = false, Error = "Unauthorized", TokenRevoked = true };
            }

            Log.Warning("API retornou erro [cid={CorrelationId}]: {Status} - {Body}", correlationId, response.StatusCode, responseBody);
            return new ApiResponse<T> { Success = false, Error = responseBody };
        }
        catch (HttpRequestException ex)
        {
            Log.Error(ex, "Erro de rede [cid={CorrelationId}]", correlationId);
            return new ApiResponse<T> { Success = false, Error = ex.Message };
        }
        catch (TaskCanceledException ex)
        {
            Log.Error(ex, "Timeout [cid={CorrelationId}]", correlationId);
            return new ApiResponse<T> { Success = false, Error = "Timeout" };
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro inesperado [cid={CorrelationId}]", correlationId);
            return new ApiResponse<T> { Success = false, Error = ex.Message };
        }
    }

    public async Task<ApiResponse<T>> GetAsync<T>(string endpoint, bool authenticate = true) where T : class
    {
        var correlationId = GenerateCorrelationId();

        try
        {
            var url = $"{_storage.Config.ServerUrl}{endpoint}";

            if (authenticate)
                SetAuthHeader(correlationId);
            else
            {
                _httpClient.DefaultRequestHeaders.Authorization = null;
                _httpClient.DefaultRequestHeaders.Remove("X-Correlation-Id");
                _httpClient.DefaultRequestHeaders.Add("X-Correlation-Id", correlationId);
            }

            Log.Debug("GET {Url} [cid={CorrelationId}]", url, correlationId);
            var response = await _httpClient.GetAsync(url);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonSerializer.Deserialize<ApiWrapper<T>>(responseBody, _jsonOptions);
                return new ApiResponse<T> { Success = true, Data = result?.Data };
            }

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Log.Warning("GET unauthorized [cid={CorrelationId}]: {Body}", correlationId, responseBody);
                return new ApiResponse<T> { Success = false, Error = "Unauthorized", TokenRevoked = true };
            }

            Log.Warning("GET error [cid={CorrelationId}]: {Status} - {Body}", correlationId, response.StatusCode, responseBody);
            return new ApiResponse<T> { Success = false, Error = responseBody };
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro GET [cid={CorrelationId}]", correlationId);
            return new ApiResponse<T> { Success = false, Error = ex.Message };
        }
    }
}

public class ApiWrapper<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public bool TokenRevoked { get; set; }
}
