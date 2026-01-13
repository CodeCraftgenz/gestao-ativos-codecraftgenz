using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace OverlayCraft
{
    /*****************************************************************************
          Classe: OverlayApiService
       Descrição: Serviço responsável por enviar os dados de monitoramento
                  do OverlayCraft para a API do servidor.
      Dt. Criação: 10/01/2026
    Dt. Alteração:
   Obs. Alteração:
       Criada por: mFacine/Claude
    ******************************************************************************/
    public class OverlayApiService : IDisposable
    {
        private readonly HttpClient _httpClient;
        private readonly string _baseUrl;
        private bool _disposed = false;

        public OverlayApiService(string baseUrl = "https://codecraftgenz.com.br")
        {
            _baseUrl = baseUrl;
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(15);
        }

        /*****************************************************************************
              Função: EnviarSnapshotAsync
           Descrição: Envia os dados de monitoramento para o endpoint da API.
             Retorno: bool - true se enviou com sucesso, false caso contrário
           Parâmetro: OverlayCraftPayload payload - dados a serem enviados
          Dt. Criação: 10/01/2026
        Dt. Alteração:
       Obs. Alteração:
           Criada por: mFacine/Claude
        ******************************************************************************/
        public async Task<bool> EnviarSnapshotAsync(OverlayCraftPayload payload)
        {
            try
            {
                string url = $"{_baseUrl}/api/overlay/snapshot";

                JsonSerializerOptions options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                };

                string json = JsonSerializer.Serialize(payload, options);

                using (HttpContent content = new StringContent(json, Encoding.UTF8, "application/json"))
                {
                    HttpResponseMessage response = await _httpClient.PostAsync(url, content);

                    System.Diagnostics.Debug.WriteLine($"[OverlayApiService] POST {url} => {(int)response.StatusCode} {response.StatusCode}");

                    return response.IsSuccessStatusCode;
                }
            }
            catch (TaskCanceledException)
            {
                System.Diagnostics.Debug.WriteLine("[OverlayApiService] Timeout ao enviar snapshot");
                return false;
            }
            catch (HttpRequestException ex)
            {
                System.Diagnostics.Debug.WriteLine($"[OverlayApiService] Erro HTTP: {ex.Message}");
                return false;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[OverlayApiService] Erro: {ex.Message}");
                return false;
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    _httpClient?.Dispose();
                }
                _disposed = true;
            }
        }
    }
}
