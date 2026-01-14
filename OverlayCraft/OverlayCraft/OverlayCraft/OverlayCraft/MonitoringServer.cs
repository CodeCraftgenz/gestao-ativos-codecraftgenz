using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace OverlayCraft
{
    /// <summary>
    /// Servidor HTTP embutido para expor dados de monitoramento em tempo real.
    /// Permite que o Admin Panel puxe informacoes do OverlayCraft via HTTP.
    /// </summary>
    public class MonitoringServer : IDisposable
    {
        private HttpListener _listener;
        private Thread _listenerThread;
        private volatile bool _isRunning;
        private readonly int _port;
        private readonly Func<MonitoringData> _getDataCallback;

        public int Port => _port;
        public bool IsRunning => _isRunning;

        /// <summary>
        /// Cria uma nova instancia do servidor de monitoramento.
        /// </summary>
        /// <param name="port">Porta HTTP (padrao: 8585)</param>
        /// <param name="getDataCallback">Callback para obter dados atuais do overlay</param>
        public MonitoringServer(int port, Func<MonitoringData> getDataCallback)
        {
            _port = port;
            _getDataCallback = getDataCallback;
        }

        /// <summary>
        /// Inicia o servidor HTTP.
        /// </summary>
        public void Start()
        {
            if (_isRunning) return;

            try
            {
                _listener = new HttpListener();
                _listener.Prefixes.Add($"http://+:{_port}/");
                _listener.Start();
                _isRunning = true;

                _listenerThread = new Thread(ListenerLoop)
                {
                    IsBackground = true,
                    Name = "MonitoringServer"
                };
                _listenerThread.Start();
            }
            catch (HttpListenerException ex)
            {
                // Tenta com localhost se nao tiver permissao para +
                try
                {
                    _listener = new HttpListener();
                    _listener.Prefixes.Add($"http://localhost:{_port}/");
                    _listener.Start();
                    _isRunning = true;

                    _listenerThread = new Thread(ListenerLoop)
                    {
                        IsBackground = true,
                        Name = "MonitoringServer"
                    };
                    _listenerThread.Start();
                }
                catch
                {
                    System.Diagnostics.Debug.WriteLine($"Erro ao iniciar MonitoringServer: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Para o servidor HTTP.
        /// </summary>
        public void Stop()
        {
            _isRunning = false;
            try
            {
                _listener?.Stop();
                _listener?.Close();
            }
            catch { }
        }

        private void ListenerLoop()
        {
            while (_isRunning)
            {
                try
                {
                    var context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem(_ => HandleRequest(context));
                }
                catch (HttpListenerException)
                {
                    // Servidor parado
                    break;
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            try
            {
                var request = context.Request;
                var response = context.Response;

                // CORS headers
                response.Headers.Add("Access-Control-Allow-Origin", "*");
                response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
                response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

                // Handle preflight
                if (request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = 204;
                    response.Close();
                    return;
                }

                string responseString = "";
                response.ContentType = "application/json; charset=utf-8";

                switch (request.Url.AbsolutePath.ToLower())
                {
                    case "/":
                    case "/status":
                        var data = _getDataCallback?.Invoke() ?? new MonitoringData();
                        responseString = data.ToJson();
                        break;

                    case "/health":
                        responseString = "{\"status\":\"ok\",\"timestamp\":\"" + DateTime.UtcNow.ToString("o") + "\"}";
                        break;

                    default:
                        response.StatusCode = 404;
                        responseString = "{\"error\":\"Endpoint nao encontrado\"}";
                        break;
                }

                byte[] buffer = Encoding.UTF8.GetBytes(responseString);
                response.ContentLength64 = buffer.Length;
                response.OutputStream.Write(buffer, 0, buffer.Length);
                response.Close();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erro ao processar request: {ex.Message}");
            }
        }

        public void Dispose()
        {
            Stop();
        }
    }

    /// <summary>
    /// Dados de monitoramento expostos pelo servidor HTTP.
    /// </summary>
    public class MonitoringData
    {
        public string ServiceTag { get; set; } = "";
        public string Hostname { get; set; } = "";
        public string Username { get; set; } = "";
        public string OS { get; set; } = "";
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // CPU
        public CpuData Cpu { get; set; } = new CpuData();

        // GPU
        public GpuData Gpu { get; set; } = new GpuData();

        // RAM
        public RamData Ram { get; set; } = new RamData();

        // Discos
        public List<DiskData> Disks { get; set; } = new List<DiskData>();

        // Rede
        public NetworkData Network { get; set; } = new NetworkData();

        // Bateria
        public BatteryData Battery { get; set; } = new BatteryData();

        /// <summary>
        /// Converte para JSON manualmente (evita dependencias externas no .NET Framework 4.7.2)
        /// </summary>
        public string ToJson()
        {
            var sb = new StringBuilder();
            sb.Append("{");

            sb.AppendFormat("\"serviceTag\":\"{0}\",", EscapeJson(ServiceTag));
            sb.AppendFormat("\"hostname\":\"{0}\",", EscapeJson(Hostname));
            sb.AppendFormat("\"username\":\"{0}\",", EscapeJson(Username));
            sb.AppendFormat("\"os\":\"{0}\",", EscapeJson(OS));
            sb.AppendFormat("\"timestamp\":\"{0}\",", Timestamp.ToString("o"));

            // CPU
            sb.Append("\"cpu\":{");
            sb.AppendFormat("\"name\":\"{0}\",", EscapeJson(Cpu.Name));
            sb.AppendFormat("\"usagePercent\":{0},", Cpu.UsagePercent.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendFormat("\"temperature\":{0},", Cpu.Temperature.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append("\"cores\":[");
            for (int i = 0; i < Cpu.CoreUsages.Count; i++)
            {
                if (i > 0) sb.Append(",");
                sb.Append(Cpu.CoreUsages[i].ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            }
            sb.Append("]},");

            // GPU
            sb.Append("\"gpu\":{");
            sb.AppendFormat("\"name\":\"{0}\",", EscapeJson(Gpu.Name));
            sb.AppendFormat("\"usagePercent\":{0},", Gpu.UsagePercent.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendFormat("\"temperature\":{0}", Gpu.Temperature.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append("},");

            // RAM
            sb.Append("\"ram\":{");
            sb.AppendFormat("\"usagePercent\":{0},", Ram.UsagePercent.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendFormat("\"totalGB\":{0},", Ram.TotalGB.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendFormat("\"usedGB\":{0},", Ram.UsedGB.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendFormat("\"pageWrites\":{0},", Ram.PageWrites.ToString("F0", System.Globalization.CultureInfo.InvariantCulture));
            sb.AppendFormat("\"modifiedMB\":{0}", Ram.ModifiedMB.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
            sb.Append("},");

            // Discos
            sb.Append("\"disks\":[");
            for (int i = 0; i < Disks.Count; i++)
            {
                if (i > 0) sb.Append(",");
                var disk = Disks[i];
                sb.Append("{");
                sb.AppendFormat("\"letter\":\"{0}\",", EscapeJson(disk.Letter));
                sb.AppendFormat("\"totalGB\":{0},", disk.TotalGB.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
                sb.AppendFormat("\"freeGB\":{0},", disk.FreeGB.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
                sb.AppendFormat("\"usedGB\":{0},", disk.UsedGB.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
                sb.AppendFormat("\"usagePercent\":{0},", disk.UsagePercent.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
                sb.AppendFormat("\"queueLength\":{0}", disk.QueueLength.ToString("F1", System.Globalization.CultureInfo.InvariantCulture));
                sb.Append("}");
            }
            sb.Append("],");

            // Rede
            sb.Append("\"network\":{");
            sb.AppendFormat("\"ip\":\"{0}\",", EscapeJson(Network.IP));
            sb.AppendFormat("\"mask\":\"{0}\",", EscapeJson(Network.Mask));
            sb.AppendFormat("\"gateway\":\"{0}\",", EscapeJson(Network.Gateway));
            sb.AppendFormat("\"mac\":\"{0}\",", EscapeJson(Network.MAC));
            sb.AppendFormat("\"wifiSSID\":\"{0}\"", EscapeJson(Network.WifiSSID));
            sb.Append("},");

            // Bateria
            sb.Append("\"battery\":{");
            sb.AppendFormat("\"percentage\":{0},", Battery.Percentage);
            sb.AppendFormat("\"isCharging\":{0},", Battery.IsCharging.ToString().ToLower());
            sb.AppendFormat("\"hasBattery\":{0}", Battery.HasBattery.ToString().ToLower());
            sb.Append("}");

            sb.Append("}");
            return sb.ToString();
        }

        private string EscapeJson(string s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            return s.Replace("\\", "\\\\")
                    .Replace("\"", "\\\"")
                    .Replace("\n", "\\n")
                    .Replace("\r", "\\r")
                    .Replace("\t", "\\t");
        }
    }

    public class CpuData
    {
        public string Name { get; set; } = "N/D";
        public float UsagePercent { get; set; }
        public float Temperature { get; set; }
        public List<float> CoreUsages { get; set; } = new List<float>();
    }

    public class GpuData
    {
        public string Name { get; set; } = "N/D";
        public float UsagePercent { get; set; }
        public float Temperature { get; set; }
    }

    public class RamData
    {
        public float UsagePercent { get; set; }
        public float TotalGB { get; set; }
        public float UsedGB { get; set; }
        public float PageWrites { get; set; }
        public float ModifiedMB { get; set; }
    }

    public class DiskData
    {
        public string Letter { get; set; } = "";
        public float TotalGB { get; set; }
        public float FreeGB { get; set; }
        public float UsedGB { get; set; }
        public float UsagePercent { get; set; }
        public float QueueLength { get; set; }
    }

    public class NetworkData
    {
        public string IP { get; set; } = "N/D";
        public string Mask { get; set; } = "N/D";
        public string Gateway { get; set; } = "N/D";
        public string MAC { get; set; } = "N/D";
        public string WifiSSID { get; set; } = "N/D";
    }

    public class BatteryData
    {
        public int Percentage { get; set; }
        public bool IsCharging { get; set; }
        public bool HasBattery { get; set; }
    }
}
