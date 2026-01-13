using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Requests;
using OverlayAgent.Core.Models.Responses;
using OverlayAgent.Core.Storage;

namespace OverlayAgent.Core.Http;

/// <summary>
/// Interface do cliente HTTP para comunicacao com o servidor
/// </summary>
public interface IApiClient
{
    /// <summary>
    /// Registra o dispositivo no servidor
    /// </summary>
    Task<ApiResponse<EnrollResponse>> EnrollAsync(EnrollRequest request);

    /// <summary>
    /// Verifica status do enrollment
    /// </summary>
    Task<ApiResponse<EnrollResponse>> GetEnrollStatusAsync(string deviceId);

    /// <summary>
    /// Envia heartbeat
    /// </summary>
    Task<ApiResponse<HeartbeatResponse>> SendHeartbeatAsync(HeartbeatRequest request);

    /// <summary>
    /// Envia inventario
    /// </summary>
    Task<ApiResponse<InventoryResponse>> SendInventoryAsync(InventoryRequest request);

    /// <summary>
    /// Busca comandos pendentes
    /// </summary>
    Task<ApiResponse<PendingCommandsResponse>> GetPendingCommandsAsync();

    /// <summary>
    /// Envia resultado de comando
    /// </summary>
    Task<ApiResponse<object>> SendCommandResultAsync(int commandId, CommandResultRequest request);

    /// <summary>
    /// Envia eventos/logs
    /// </summary>
    Task<ApiResponse<EventsResponse>> SendEventsAsync(EventsRequest request);
}

/// <summary>
/// Implementacao do cliente HTTP
/// </summary>
public class ApiClient : IApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ISecureStorage _storage;
    private readonly ILogger<ApiClient> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public ApiClient(
        HttpClient httpClient,
        ISecureStorage storage,
        ILogger<ApiClient> logger)
    {
        _httpClient = httpClient;
        _storage = storage;
        _logger = logger;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            WriteIndented = false
        };
    }

    public async Task<ApiResponse<EnrollResponse>> EnrollAsync(EnrollRequest request)
    {
        return await PostAsync<EnrollResponse>("/api/agent/enroll", request, authenticated: false);
    }

    public async Task<ApiResponse<EnrollResponse>> GetEnrollStatusAsync(string deviceId)
    {
        return await GetAsync<EnrollResponse>($"/api/agent/enroll/status?device_id={Uri.EscapeDataString(deviceId)}", authenticated: false);
    }

    public async Task<ApiResponse<HeartbeatResponse>> SendHeartbeatAsync(HeartbeatRequest request)
    {
        return await PostAsync<HeartbeatResponse>("/api/agent/heartbeat", request);
    }

    public async Task<ApiResponse<InventoryResponse>> SendInventoryAsync(InventoryRequest request)
    {
        return await PostAsync<InventoryResponse>("/api/agent/inventory", request);
    }

    public async Task<ApiResponse<PendingCommandsResponse>> GetPendingCommandsAsync()
    {
        return await GetAsync<PendingCommandsResponse>("/api/agent/commands/pending");
    }

    public async Task<ApiResponse<object>> SendCommandResultAsync(int commandId, CommandResultRequest request)
    {
        return await PostAsync<object>($"/api/agent/commands/{commandId}/result", request);
    }

    public async Task<ApiResponse<EventsResponse>> SendEventsAsync(EventsRequest request)
    {
        return await PostAsync<EventsResponse>("/api/agent/events", request);
    }

    private async Task<ApiResponse<T>> GetAsync<T>(string endpoint, bool authenticated = true)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, endpoint);

            if (authenticated)
            {
                await AddAuthHeaderAsync(request);
            }

            var response = await _httpClient.SendAsync(request);

            return await ProcessResponseAsync<T>(response);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Erro de rede ao fazer GET {Endpoint}", endpoint);
            return new ApiResponse<T>
            {
                Success = false,
                Error = "Erro de conexao com o servidor"
            };
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout ao fazer GET {Endpoint}", endpoint);
            return new ApiResponse<T>
            {
                Success = false,
                Error = "Timeout na requisicao"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao fazer GET {Endpoint}", endpoint);
            return new ApiResponse<T>
            {
                Success = false,
                Error = "Erro inesperado"
            };
        }
    }

    private async Task<ApiResponse<T>> PostAsync<T>(string endpoint, object data, bool authenticated = true)
    {
        try
        {
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
            {
                Content = content
            };

            if (authenticated)
            {
                await AddAuthHeaderAsync(request);
            }

            var response = await _httpClient.SendAsync(request);

            return await ProcessResponseAsync<T>(response);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Erro de rede ao fazer POST {Endpoint}", endpoint);
            return new ApiResponse<T>
            {
                Success = false,
                Error = "Erro de conexao com o servidor"
            };
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout ao fazer POST {Endpoint}", endpoint);
            return new ApiResponse<T>
            {
                Success = false,
                Error = "Timeout na requisicao"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro inesperado ao fazer POST {Endpoint}", endpoint);
            return new ApiResponse<T>
            {
                Success = false,
                Error = "Erro inesperado"
            };
        }
    }

    private async Task AddAuthHeaderAsync(HttpRequestMessage request)
    {
        var config = await _storage.LoadConfigAsync();

        if (!string.IsNullOrEmpty(config.AgentToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.AgentToken);
        }
    }

    private async Task<ApiResponse<T>> ProcessResponseAsync<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            try
            {
                var result = JsonSerializer.Deserialize<ApiResponse<T>>(content, _jsonOptions);
                return result ?? new ApiResponse<T> { Success = true };
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Erro ao deserializar resposta: {Content}", content);
                return new ApiResponse<T>
                {
                    Success = false,
                    Error = "Resposta invalida do servidor"
                };
            }
        }

        // Tenta extrair mensagem de erro do JSON
        try
        {
            var errorResponse = JsonSerializer.Deserialize<ApiResponse<object>>(content, _jsonOptions);
            return new ApiResponse<T>
            {
                Success = false,
                Error = errorResponse?.Error ?? $"Erro HTTP {(int)response.StatusCode}",
                Details = errorResponse?.Details
            };
        }
        catch
        {
            return new ApiResponse<T>
            {
                Success = false,
                Error = $"Erro HTTP {(int)response.StatusCode}"
            };
        }
    }
}
