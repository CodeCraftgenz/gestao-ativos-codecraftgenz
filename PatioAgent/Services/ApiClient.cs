using System.Net.Http.Headers;
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

    private void SetAuthHeader()
    {
        if (!string.IsNullOrEmpty(_storage.Config.AgentToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _storage.Config.AgentToken);
        }
    }

    public async Task<ApiResponse<T>> PostAsync<T>(string endpoint, object data, bool authenticate = true) where T : class
    {
        try
        {
            var url = $"{_storage.Config.ServerUrl}{endpoint}";
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            if (authenticate)
                SetAuthHeader();
            else
                _httpClient.DefaultRequestHeaders.Authorization = null;

            Log.Debug("POST {Url}", url);
            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonSerializer.Deserialize<ApiWrapper<T>>(responseBody, _jsonOptions);
                return new ApiResponse<T> { Success = true, Data = result?.Data };
            }

            // Erro 401 - Token revogado
            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                Log.Warning("Token revogado ou expirado");
                return new ApiResponse<T> { Success = false, Error = "Unauthorized", TokenRevoked = true };
            }

            Log.Warning("API retornou erro: {Status} - {Body}", response.StatusCode, responseBody);
            return new ApiResponse<T> { Success = false, Error = responseBody };
        }
        catch (HttpRequestException ex)
        {
            Log.Error(ex, "Erro de rede ao chamar API");
            return new ApiResponse<T> { Success = false, Error = ex.Message };
        }
        catch (TaskCanceledException ex)
        {
            Log.Error(ex, "Timeout ao chamar API");
            return new ApiResponse<T> { Success = false, Error = "Timeout" };
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro inesperado ao chamar API");
            return new ApiResponse<T> { Success = false, Error = ex.Message };
        }
    }

    public async Task<ApiResponse<T>> GetAsync<T>(string endpoint, bool authenticate = true) where T : class
    {
        try
        {
            var url = $"{_storage.Config.ServerUrl}{endpoint}";

            if (authenticate)
                SetAuthHeader();
            else
                _httpClient.DefaultRequestHeaders.Authorization = null;

            Log.Debug("GET {Url}", url);
            var response = await _httpClient.GetAsync(url);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var result = JsonSerializer.Deserialize<ApiWrapper<T>>(responseBody, _jsonOptions);
                return new ApiResponse<T> { Success = true, Data = result?.Data };
            }

            if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                return new ApiResponse<T> { Success = false, Error = "Unauthorized", TokenRevoked = true };
            }

            return new ApiResponse<T> { Success = false, Error = responseBody };
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Erro ao chamar API");
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
