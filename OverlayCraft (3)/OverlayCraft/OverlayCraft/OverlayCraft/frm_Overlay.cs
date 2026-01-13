using OpenHardwareMonitor.Hardware;
using RAMSPDToolkit.Windows.Driver;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Management;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.ListView;
using SettingsAlias = OverlayCraft.Properties.Settings;

namespace OverlayCraft
{
    public partial class frm_Overlay : Form
    {
        private readonly HttpClient _httpClient = new HttpClient();
        public const int AppId = 101;
        private const string BaseUrl = "https://codecraftgenz.com.br";
        public bool b_Valida = false;

        FuncGeral obj_FuncGeral = new FuncGeral();
        private Panel dragPanel;
        private Timer timer;
        private Timer fadeTimer;

        //persiana
        private bool b_Aberta = true;
        private readonly Timer AnimTimer;
        private int i_TargetLeft;

        private double targetOpacity = 0.5;
        private const double fadeStep = 0.05;

        private PerformanceCounter cpuCounter;
        private PerformanceCounter ramCounter;
        private PerformanceCounter diskQueueCounter;
        private PerformanceCounter diskQueueTotal;
        private PerformanceCounter memPageWrites;
        private PerformanceCounter memModified;

        Dictionary<string, PerformanceCounter> diskQueues = new Dictionary<string, PerformanceCounter>();


        //para GPU
        private List<PerformanceCounter> gpuCounters;


        // [ADD] Contadores por núcleo
        private PerformanceCounter[] cpuCoresCounters;

        private Computer hardwareMonitor;
        private NotifyIcon trayIcon;
        private ContextMenu trayMenu;

        // Servidor HTTP para monitoramento em tempo real (Admin Panel)
        private MonitoringServer _monitoringServer;
        private const int MONITORING_PORT = 8585;

        // Serviço de envio de dados para o servidor
        private OverlayApiService _overlayApiService;
        private Timer _snapshotTimer;
        private const int SNAPSHOT_INTERVAL_MS = 10000; // Envia a cada 10 segundos

        private string cpuName = "N/D";
        private string gpuName = "N/D";

        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();
        [DllImport("user32.dll")]
        public static extern IntPtr SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        private const int WM_NCLBUTTONDOWN = 0xA1;
        private const int HTCAPTION = 0x2;

        public float cpuUsoTotal = 0;

        /*****************************************************************************
                  Nome: frm_Overlay
             Descrição: Construtor principal do overlay. Inicializa componentes,
                          contadores, monitoramento, tray e restaura configurações.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Estrutura inicial ajustada para o padrão Designer-first.
            Criada por: mFacine
        ******************************************************************************/
        public frm_Overlay()
        {
            string HardwareId = HardwareUtil.GetHardwareId();
            string IdLicence = ObterServiceTag();

            if (SettingsAlias.Default.License != obj_FuncGeral.Criptografa(IdLicence) || SettingsAlias.Default.License == "") 
            {
                
                frm_License obj_frm_License = new frm_License();
                obj_frm_License.ShowDialog(this);

                if (ValidarCodigo(obj_frm_License.email, AppId, HardwareId).GetAwaiter().GetResult())
                {
                    SettingsAlias.Default.License = obj_FuncGeral.Criptografa(ObterServiceTag());
                }
                else
                {
                    MessageBox.Show("A licença informada não pôde ser validada." +
                                   "\r\nVerifique se o e-mail está correto ou se sua assinatura do OverlayCraft está ativa." +
                                   "\r\nCaso o problema persista, entre em contato com o suporte da CodeCraft-GenZ.");
                    Environment.Exit(1);
                }
            }


            InicializarComponentes();
            InicializarContadores();
            InicializarMonitoramento();
            InicializarDiskQueueTotal();
            ConfigurarTray();
            AplicarConfiguracoes();// [ADD] Aplicar as configurações salvas do usuário ao iniciar
            AtualizarInfo();
            RestaurarPosicao();
            InicializarMonitoringServer(); // Servidor HTTP para Admin Panel
            InicializarSnapshotService(); // Serviço de envio de dados para o servidor

            

            // Cria o overlay, mas começa fora da tela, escondido
            this.ShowInTaskbar = false;
            this.TopMost = true;
            this.StartPosition = FormStartPosition.Manual;
            this.Location = new Point(-this.Width, 0);


            // animação suave
            AnimTimer = new Timer() { Interval = 15 };

            AnimTimer.Tick += Animar;

            this.Load += frm_Overlay_Load;

        }


        public async Task<bool> ValidarCodigo(string email, int AppId, string HardwareId)
        {
            try
            {
                // Fazer a requisição
                var response = await _httpClient.GetAsync($"https://codecraftgenz.com.br/api/compat/license-check?" + "email=" + Uri.EscapeDataString(email) + "&id_pc=" + Uri.EscapeDataString(HardwareId) + "&app_id=" + Uri.EscapeDataString(AppId.ToString()));




                // Ler resposta
                string resposta = await response.Content.ReadAsStringAsync();

                b_Valida = resposta.Contains("true");


                // Verificar se a validação foi bem-sucedida
                return b_Valida;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro na validação: {ex.Message}");
                return b_Valida;
            }
        }


        /*****************************************************************************
              Procedure: InicializarDiskQueueTotal
              Descrição:  
            Dt. Criação: 12/11/2025  
          Dt. Alteração:  
         Obs. Alteração: 
             Criada por: mFacine
        ******************************************************************************/
        private void InicializarDiskQueueTotal()
        {
            try
            {
                diskQueueTotal = new PerformanceCounter(
                    "PhysicalDisk",
                    "Current Disk Queue Length",
                    "_Total"
                );
            }
            catch
            {
                diskQueueTotal = null; // se der erro, melhor assumir null
            }
        }



        /*****************************************************************************
              Procedure: InicializarComponentes
              Descrição: Configura propriedades básicas do form, ativa timers de
                         fade, define eventos e inicializa o logo.
            Dt. Criação: 30/10/2025  
          Dt. Alteração:  
         Obs. Alteração: Substituiu a criação dinâmica de controles por uso do Designer.
             Criada por: mFacine
        ******************************************************************************/
        private void InicializarComponentes()
        {
            InitializeComponent();

            this.DoubleBuffered = true;
            this.Location = new Point(100, 100);
            this.Resize += frm_Overlay_Resize;
            AjustarBotaoConfig();
            fadeTimer = new Timer();
            fadeTimer.Interval = 100; // velocidade da transição
            fadeTimer.Tick += FadeTimer_Tick;
            fadeTimer.Start();

            this.FormClosing += frm_Overlay_FormClosing;
            this.MouseEnter += frm_Overlay_MouseEnter;
            this.MouseLeave += frm_Overlay_MouseLeave;
            picbox_Logo.Image = Properties.Resources.Logo_Overlay; // nome do recurso
        }

        /*****************************************************************************
             Procedure: AplicarConfiguracoes
             Descrição: Lê as configurações salvas do usuário, aplica a cor da
                        fonte, atualiza botões e reativa o fade se necessário.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Incluído tratamento para fallback de cor e validação do timer.
            Criada por: mFacine
        ******************************************************************************/
        public void AplicarConfiguracoes()
        {
            try
            {
                // Obtém a cor salva nas configurações
                var hex = OverlayCraft.Properties.Settings.Default.FontColor;

                if (string.IsNullOrWhiteSpace(hex))
                {
                    hex = "#32CD32"; // cor padrão (LimeGreen)
                }
                Color corFonte = ColorTranslator.FromHtml(hex);

                // Aplica a cor no texto principal
                lb_Info.ForeColor = corFonte;

                // Aplica a cor também no botão de configuração
                if (btn_Config != null)
                {
                    btn_Config.ForeColor = corFonte;
                    btn_Config.FlatAppearance.BorderColor = corFonte;
                }

                // Aplica a cor também no botão de Fechar
                if (btn_Close != null)
                {
                    btn_Close.ForeColor = corFonte;
                    btn_Close.FlatAppearance.BorderColor = corFonte;
                }

                //Ligar o timer se o fade tiver sido ativado:
                if (SettingsAlias.Default.EnableFade && !fadeTimer.Enabled)
                {
                    fadeTimer.Start();
                }
            }
            catch
            {
                // fallback em caso de erro
                lb_Info.ForeColor = Color.LimeGreen;
                btn_Config.ForeColor = Color.LightGray;
                btn_Close.ForeColor = Color.LightGray;
            }

            // Atualiza os textos exibidos conforme as opções do usuário
            AtualizarInfo();
        }

        /*****************************************************************************
             Procedure: InicializarContadores
             Descrição: Cria e configura contadores de desempenho (CPU, RAM e
                        por núcleo). Recupera nomes de CPU e GPU via WMI.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Adicionado fallback para categoria 'Processor Information'.
            Criada por: mFacine
        ******************************************************************************/
        private void InicializarContadores()
        {
            try
            {
                cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                ramCounter = new PerformanceCounter("Memory", "% Committed Bytes In Use");

                // Contador de Fila de Disco (todas as unidades)
                diskQueueCounter = new PerformanceCounter("PhysicalDisk", "Current Disk Queue Length", "_Total");
                // Contador de Fila de memória (todas as unidades)
                memPageWrites = new PerformanceCounter("Memory", "Page Writes/sec");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao inicializar contadores: {ex.Message}", "OverlayCraft",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            memPageWrites = new PerformanceCounter("Memory", "Page Writes/sec");
            memModified = new PerformanceCounter("Memory", "Modified Page List Bytes");



            // Nome da CPU
            try
            {
                var searcherCPU = new ManagementObjectSearcher("root\\CIMV2", "SELECT * FROM Win32_Processor");
                cpuName = searcherCPU.Get()?.Cast<ManagementObject>().FirstOrDefault()?["Name"]?.ToString() ?? "N/D";
            }
            catch { cpuName = "N/D"; }

            // Nome da GPU
            try
            {
                var searcherGPU = new ManagementObjectSearcher("root\\CIMV2", "SELECT * FROM Win32_VideoController");
                gpuName = searcherGPU.Get().Cast<ManagementObject>().FirstOrDefault()?["Name"]?.ToString() ?? "N/D";
            }
            catch { gpuName = "N/D"; }

            // [ADD] Criar contadores individuais por core
            try
            {
                int numCores = Environment.ProcessorCount;

                // Tenta "Processor"
                var temp = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                temp.NextValue(); // força inicialização
                cpuCoresCounters = Enumerable.Range(0, numCores)
                    .Select(i => new PerformanceCounter("Processor", "% Processor Time", i.ToString()))
                    .ToArray();
            }
            catch
            {
                try
                {
                    // Fallback: "Processor Information" (alguns Windows)
                    int numCores = Environment.ProcessorCount;
                    cpuCoresCounters = Enumerable.Range(0, numCores)
                        .Select(i => new PerformanceCounter("Processor Information", "% Processor Time", i.ToString()))
                        .ToArray();
                }
                catch
                {
                    cpuCoresCounters = null; // desativa feature
                }
            }


            try
            {
                gpuCounters = new List<PerformanceCounter>();
                var categoria = new PerformanceCounterCategory("GPU Engine");
                var instancias = categoria.GetInstanceNames();

                foreach (var instancia in instancias)
                {
                    // Filtra apenas engines de 3D (gráficos)
                    if (instancia.ToLower().Contains("engtype_3d"))
                    {
                        gpuCounters.Add(new PerformanceCounter("GPU Engine", "Utilization Percentage", instancia));
                    }
                }
            }
            catch
            {
                gpuCounters = null;
            }



            timer = new Timer { Interval = 2000 };
            timer.Tick += (s, e) => AtualizarInfo();
            timer.Start();
        }

        /*****************************************************************************
             Procedure: InicializarMonitoramento
             Descrição: Habilita o monitoramento de hardware via biblioteca
                        OpenHardwareMonitor (CPU e GPU).
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Nova implementação para leitura de sensores em tempo real.
            Criada por: mFacine
        ******************************************************************************/
        // [ADD] Inicialização do monitoramento de hardware (temperaturas reais)
        private void InicializarMonitoramento()
        {
            hardwareMonitor = new Computer();
            hardwareMonitor.IsCpuEnabled = true;
            hardwareMonitor.IsGpuEnabled = true;
            hardwareMonitor.Open(true);
        }

        /*****************************************************************************
             Procedure: InicializarMonitoringServer
             Descrição: Inicia o servidor HTTP embutido que expoe dados de monitoramento
                        em tempo real para o Admin Panel.
           Dt. Criação: 10/01/2026
         Dt. Alteração:
        Obs. Alteração:
            Criada por: Claude/mFacine
        ******************************************************************************/
        private void InicializarMonitoringServer()
        {
            try
            {
                _monitoringServer = new MonitoringServer(MONITORING_PORT, ColetarDadosMonitoramento);
                _monitoringServer.Start();
                System.Diagnostics.Debug.WriteLine($"MonitoringServer iniciado na porta {MONITORING_PORT}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erro ao iniciar MonitoringServer: {ex.Message}");
            }
        }

        /*****************************************************************************
             Function: ColetarDadosMonitoramento
             Descrição: Coleta todos os dados de monitoramento do sistema para expor
                        via servidor HTTP.
              Retorno: MonitoringData
            Parametro: --
           Dt. Criação: 10/01/2026
         Dt. Alteração:
        Obs. Alteração:
            Criada por: Claude/mFacine
        ******************************************************************************/
        private MonitoringData ColetarDadosMonitoramento()
        {
            var data = new MonitoringData();

            try
            {
                // Info basica
                data.ServiceTag = ObterServiceTag();
                data.Hostname = Environment.MachineName;
                data.Username = Environment.UserName;
                data.OS = Environment.OSVersion.ToString();
                data.Timestamp = DateTime.UtcNow;

                // CPU
                data.Cpu.Name = cpuName;
                data.Cpu.UsagePercent = cpuCounter?.NextValue() ?? 0;

                // Temperatura CPU (parse do formato "XX.X °C")
                string cpuTempStr = ObterTemperaturaCPU();
                if (cpuTempStr != "N/D")
                {
                    float.TryParse(cpuTempStr.Replace(" °C", "").Replace(",", "."),
                        System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out float cpuTemp);
                    data.Cpu.Temperature = cpuTemp;
                }

                // Cores CPU
                if (cpuCoresCounters != null)
                {
                    foreach (var core in cpuCoresCounters)
                    {
                        try { data.Cpu.CoreUsages.Add(core.NextValue()); }
                        catch { data.Cpu.CoreUsages.Add(0); }
                    }
                }

                // GPU
                data.Gpu.Name = gpuName;
                data.Gpu.UsagePercent = ObterUsoGPU();

                // Temperatura GPU (parse do formato "XX.X °C")
                string gpuTempStr = ObterTemperaturaGPU();
                if (gpuTempStr != "N/D")
                {
                    float.TryParse(gpuTempStr.Replace(" °C", "").Replace(",", "."),
                        System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out float gpuTemp);
                    data.Gpu.Temperature = gpuTemp;
                }

                // RAM
                data.Ram.UsagePercent = ramCounter?.NextValue() ?? 0;

                // Total RAM
                try
                {
                    var searcher = new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        double bytes = Convert.ToDouble(obj["TotalPhysicalMemory"]);
                        data.Ram.TotalGB = (float)(bytes / 1024 / 1024 / 1024);
                        data.Ram.UsedGB = data.Ram.TotalGB * (data.Ram.UsagePercent / 100f);
                    }
                }
                catch { }

                data.Ram.PageWrites = memPageWrites?.NextValue() ?? 0;
                data.Ram.ModifiedMB = (memModified?.NextValue() ?? 0) / (1024 * 1024);

                // Discos
                try
                {
                    var drives = DriveInfo.GetDrives()
                        .Where(d => d.IsReady && (d.DriveType == DriveType.Fixed || d.DriveType == DriveType.Removable));

                    foreach (var drive in drives)
                    {
                        var disk = new DiskData
                        {
                            Letter = drive.Name.Replace("\\", ""),
                            TotalGB = (float)(drive.TotalSize / 1024.0 / 1024 / 1024),
                            FreeGB = (float)(drive.AvailableFreeSpace / 1024.0 / 1024 / 1024)
                        };
                        disk.UsedGB = disk.TotalGB - disk.FreeGB;
                        disk.UsagePercent = disk.TotalGB > 0 ? (disk.UsedGB / disk.TotalGB) * 100 : 0;

                        // Queue length
                        string letra = drive.Name.Replace("\\", "").Replace(":", "");
                        if (diskQueues.ContainsKey(letra))
                        {
                            try { disk.QueueLength = diskQueues[letra].NextValue(); }
                            catch { }
                        }

                        data.Disks.Add(disk);
                    }
                }
                catch { }

                // Rede
                var (ip, mask, gateway, mac) = ObterRedeLocal();
                data.Network.IP = ip;
                data.Network.Mask = mask;
                data.Network.Gateway = gateway;
                data.Network.MAC = mac;

                var interfaceAtiva = NetworkInterface.GetAllNetworkInterfaces()
                    .FirstOrDefault(n => n.OperationalStatus == OperationalStatus.Up
                              && n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211);
                if (interfaceAtiva != null)
                    data.Network.WifiSSID = ObterNomeWiFi();

                // Bateria
                try
                {
                    var batStatus = System.Windows.Forms.SystemInformation.PowerStatus;
                    data.Battery.HasBattery = batStatus.BatteryChargeStatus != BatteryChargeStatus.NoSystemBattery;
                    data.Battery.IsCharging = batStatus.PowerLineStatus == PowerLineStatus.Online;
                    data.Battery.Percentage = (int)(batStatus.BatteryLifePercent * 100);
                }
                catch { }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erro ao coletar dados: {ex.Message}");
            }

            return data;
        }


        /*****************************************************************************
             Procedure: InicializarSnapshotService
             Descrição: Inicializa o serviço de envio de snapshots para o servidor.
           Dt. Criação: 10/01/2026
         Dt. Alteração:
        Obs. Alteração:
            Criada por: mFacine/Claude
        ******************************************************************************/
        private void InicializarSnapshotService()
        {
            try
            {
                _overlayApiService = new OverlayApiService();

                _snapshotTimer = new Timer { Interval = SNAPSHOT_INTERVAL_MS };
                _snapshotTimer.Tick += async (s, e) => await EnviarSnapshotAsync();
                _snapshotTimer.Start();

                // Envia o primeiro snapshot imediatamente
                Task.Run(async () => await EnviarSnapshotAsync());

                System.Diagnostics.Debug.WriteLine($"[SnapshotService] Iniciado - intervalo: {SNAPSHOT_INTERVAL_MS}ms");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[SnapshotService] Erro ao iniciar: {ex.Message}");
            }
        }

        /*****************************************************************************
             Function: ColetarPayload
             Descrição: Coleta todos os dados de monitoramento e retorna um payload
                        formatado para envio à API.
              Retorno: OverlayCraftPayload
            Parametro: --
           Dt. Criação: 10/01/2026
         Dt. Alteração:
        Obs. Alteração:
            Criada por: mFacine/Claude
        ******************************************************************************/
        private OverlayCraftPayload ColetarPayload()
        {
            var payload = new OverlayCraftPayload();

            try
            {
                // Service Tag e Info Básica
                payload.ServiceTag = ObterServiceTag();
                payload.Usuario = Environment.UserName;
                payload.SO = Environment.OSVersion.ToString();
                payload.Timestamp = DateTime.UtcNow;

                // CPU
                payload.CPU = cpuName;
                float cpuUso = cpuCounter?.NextValue() ?? 0;
                payload.CPU_Uso = $"{cpuUso:F1}%";
                payload.CPU_Temp = ObterTemperaturaCPU();

                // GPU
                payload.GPU = gpuName;
                float gpuUso = ObterUsoGPU();
                payload.GPU_Uso = $"{gpuUso:F1}%";
                payload.GPU_Temp = ObterTemperaturaGPU();

                // RAM
                payload.RAM_Total = ObterMemoriaInstalada();
                float ramUso = ramCounter?.NextValue() ?? 0;
                payload.RAM_Uso = $"{ramUso:F1}%";
                payload.RAM_PageWritesSec = $"{(memPageWrites?.NextValue() ?? 0):F1}";
                payload.RAM_ModifiedPages = $"{((memModified?.NextValue() ?? 0) / (1024 * 1024)):F1} MB";

                // Discos
                var discosInfo = new System.Text.StringBuilder();
                try
                {
                    var drives = DriveInfo.GetDrives()
                        .Where(d => d.IsReady && (d.DriveType == DriveType.Fixed || d.DriveType == DriveType.Removable));

                    foreach (var drive in drives)
                    {
                        double livre = drive.AvailableFreeSpace / 1024.0 / 1024 / 1024;
                        double total = drive.TotalSize / 1024.0 / 1024 / 1024;
                        string tipo = drive.DriveType == DriveType.Removable ? "USB" : "Disco";

                        string letra = drive.Name.Replace("\\", "").Replace(":", "");
                        float fila = 0;
                        if (diskQueues.ContainsKey(letra))
                        {
                            try { fila = diskQueues[letra].NextValue(); }
                            catch { }
                        }

                        discosInfo.AppendLine($"{tipo}: {drive.Name} {livre:F1} GB / {total:F1} GB livres | Fila: {fila:F2}");
                    }

                    float filaTotal = diskQueueTotal?.NextValue() ?? 0;
                    discosInfo.AppendLine($"Fila Total: {filaTotal:F2}");
                }
                catch { }
                payload.Discos = discosInfo.ToString().Trim();

                // Rede
                var (ip, mask, gateway, mac) = ObterRedeLocal();
                payload.IP = ip;
                payload.Mascara = mask;
                payload.Gateway = gateway;
                payload.MAC = mac;

                var interfaceAtiva = NetworkInterface.GetAllNetworkInterfaces()
                    .FirstOrDefault(n => n.OperationalStatus == OperationalStatus.Up
                              && n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211);
                payload.SSIDWiFi = interfaceAtiva != null ? ObterNomeWiFi() : "N/D";

                // Bateria
                try
                {
                    var ps = System.Windows.Forms.SystemInformation.PowerStatus;
                    if (ps.BatteryChargeStatus != BatteryChargeStatus.NoSystemBattery)
                    {
                        int bateria = (int)(ps.BatteryLifePercent * 100);
                        payload.Bateria = $"{bateria}%";
                        payload.Energia = ps.PowerLineStatus == PowerLineStatus.Online ? "Carregando" : "Descarregando";
                    }
                    else
                    {
                        payload.Bateria = "N/D";
                        payload.Energia = "Desktop";
                    }
                }
                catch
                {
                    payload.Bateria = "N/D";
                    payload.Energia = "N/D";
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[ColetarPayload] Erro: {ex.Message}");
            }

            return payload;
        }

        /*****************************************************************************
             Procedure: EnviarSnapshotAsync
             Descrição: Envia os dados de monitoramento para o servidor de forma assíncrona.
           Dt. Criação: 10/01/2026
         Dt. Alteração:
        Obs. Alteração:
            Criada por: mFacine/Claude
        ******************************************************************************/
        private async Task EnviarSnapshotAsync()
        {
            try
            {
                var payload = ColetarPayload();
                bool sucesso = await _overlayApiService.EnviarSnapshotAsync(payload);

                System.Diagnostics.Debug.WriteLine($"[EnviarSnapshot] ServiceTag: {payload.ServiceTag} => {(sucesso ? "OK" : "FALHOU")}");
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[EnviarSnapshot] Erro: {ex.Message}");
            }
        }

        /*****************************************************************************
             Procedure: InicializarDiskQueues
             Descrição:

           Dt. Criação: 12/11/2025
         Dt. Alteração:
        Obs. Alteração:
            Criada por: mFacine
        ******************************************************************************/
        private void InicializarDiskQueues()
        {
            var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_LogicalDisk WHERE DriveType=3");

            foreach (ManagementObject disk in searcher.Get())
            {
                string letra = disk["DeviceID"].ToString().Replace("\\", "").Replace(":", "");

                string instance = GetDiskInstance(letra);

                if (instance != null)
                {
                    diskQueues[letra] = new PerformanceCounter(
                        "PhysicalDisk",
                        "Current Disk Queue Length",
                        instance
                    );
                }
            }
        }



        /*****************************************************************************
             Procedure: ConfigurarTray
             Descrição: Cria o ícone de bandeja do sistema (NotifyIcon) com menu
                        contextual e opções Restaurar e Sair.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Atualizado para ícone genérico e comportamento persistente.
            Criada por: mFacine
        ******************************************************************************/
        private void ConfigurarTray()
        {
            trayMenu = new ContextMenu();
            trayMenu.MenuItems.Add("Restaurar", (s, e) => Restaurar());
            trayMenu.MenuItems.Add("Sair", (s, e) => Application.Exit());

            trayIcon = new NotifyIcon
            {
                Text = "System Overlay",
                Icon = SystemIcons.Information,
                ContextMenu = trayMenu,
                Visible = true
            };
            trayIcon.DoubleClick += (s, e) => Restaurar();
        }




        // ===========================
        // EVENTOS DE HOVER DO BOTÃO X
        // ===========================
        private void btn_Close_MouseEnter_Highlight(object sender, EventArgs e)
        {
            //Controla o efeito visual do botão de fechar (✕) ao passar
            //o mouse, aplicando variação de cor.
            try
            {
                var hex = OverlayCraft.Properties.Settings.Default.FontColor;
                if (string.IsNullOrWhiteSpace(hex)) hex = "#32CD32";
                Color corFonte = ColorTranslator.FromHtml(hex);
                btn_Close.ForeColor = ControlPaint.Light(corFonte);
            }
            catch { btn_Close.ForeColor = Color.White; }
        }

        private void btn_Close_MouseLeave_Reset(object sender, EventArgs e)
        {
            try
            {
                var hex = OverlayCraft.Properties.Settings.Default.FontColor;
                if (string.IsNullOrWhiteSpace(hex)) hex = "#32CD32";
                btn_Close.ForeColor = ColorTranslator.FromHtml(hex);
            }
            catch { btn_Close.ForeColor = Color.LightGray; }
        }




        // ============================
        // EVENTOS DE HOVER DO BOTÃO ⚙️
        // ============================
        private void btn_Config_MouseEnter_Highlight(object sender, EventArgs e)
        {
            //Gerencia o efeito visual do botão de configurações (⚙)
            //durante o hover, destacando o botão.
            try
            {
                var hex = OverlayCraft.Properties.Settings.Default.FontColor;
                if (string.IsNullOrWhiteSpace(hex)) hex = "#32CD32";
                Color corFonte = ColorTranslator.FromHtml(hex);
                btn_Config.ForeColor = ControlPaint.Light(corFonte);
            }
            catch { btn_Config.ForeColor = Color.White; }
        }

        private void btn_Config_MouseLeave_Reset(object sender, EventArgs e)
        {
            try
            {
                var hex = OverlayCraft.Properties.Settings.Default.FontColor;
                if (string.IsNullOrWhiteSpace(hex)) hex = "#32CD32";
                btn_Config.ForeColor = ColorTranslator.FromHtml(hex);
            }
            catch { btn_Config.ForeColor = Color.LightGray; }
        }

        /*****************************************************************************
             Procedure: Restaurar
             Descrição: Restaura o overlay ao estado visível e normal quando
                        minimizado para a bandeja.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Simplificado para restaurar visibilidade e taskbar.
            Criada por: mFacine
        ******************************************************************************/
        private void Restaurar()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.ShowInTaskbar = true;
        }
        

        /*****************************************************************************
             Procedure: RestaurarPosicao
             Descrição: Recupera a posição salva do overlay e evita abertura fora
                        da área de trabalho em caso de mudança de monitor.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Adicionado controle de segurança para múltiplos monitores.
            Criada por: mFacine
        ******************************************************************************/
        private void RestaurarPosicao()
        {
            int x = OverlayCraft.Properties.Settings.Default.OverlayPosX;
            int y = OverlayCraft.Properties.Settings.Default.OverlayPosY;

            // Evita que o overlay abra fora da tela (ex: troca de monitor)
            Rectangle tela = Screen.PrimaryScreen.WorkingArea;
            if (x < tela.Left || y < tela.Top || x > tela.Right - 50 || y > tela.Bottom - 50)
            {
                x = 100;
                y = 100;
            }

            this.StartPosition = FormStartPosition.Manual;
            this.Location = new Point(x, y);
        }

        /*****************************************************************************
             Procedure: AtualizarVelocimetro
             Descrição: Atualiza periodicamente as informações do sistema (CPU,
                        RAM, GPU, rede, discos e sensores) exibidas no overlay.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Incluído suporte a contadores por core e sensores de GPU.
            Criada por: mFacine
        ******************************************************************************/
        //private void AtualizarVelocimetroGPU(float valor)
        //{
        //    if (obj_frm_Velocimetro != null)
        //    {
        //        obj_frm_Velocimetro.AtualizarValor(valor);
        //    }
        //}



        /*****************************************************************************
             Procedure: AtualizarInfo
             Descrição: Atualiza periodicamente as informações do sistema (CPU,
                        RAM, GPU, rede, discos e sensores) exibidas no overlay.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Incluído suporte a contadores por core e sensores de GPU.
            Criada por: mFacine
        ******************************************************************************/
        private void AtualizarInfo()
        {
            float cpuTotal = cpuCounter.NextValue();
            float ramUsage = ramCounter.NextValue();
            float pageWrites = memPageWrites.NextValue();
            float modifiedMB = memModified.NextValue() / (1024 * 1024);
            float diskQueue = 0;

            string discos = ObterEspacoDiscos();
            string user = Environment.UserName;
            string sistema = Environment.OSVersion.ToString();
            string cpuTemp = ObterTemperaturaCPU();
            string gpuTemp = ObterTemperaturaGPU();
            (string ip, string mask, string gateway, string mac) = ObterRedeLocal();

            string wifiSSID = "N/D";
            var interfaceAtiva = NetworkInterface.GetAllNetworkInterfaces()
            .FirstOrDefault(n => n.OperationalStatus == OperationalStatus.Up
                      && n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211);

            if (interfaceAtiva != null)
                wifiSSID = ObterNomeWiFi();

            string serviceTag = ObterServiceTag();
            string memoriaTotal = ObterMemoriaInstalada();

            if (gpuCounters != null)
            {
                foreach (var c in gpuCounters) { try { c.NextValue(); } catch { } }
            }


            try
            {
                diskQueue = diskQueueCounter.NextValue();
            }
            catch
            {
                diskQueue = -1;
            }

            // [ADD] Leitura de todos os núcleos
            string usoPorCore = "";
            if (cpuCoresCounters != null)
            {
                for (int i = 0; i < cpuCoresCounters.Length; i++)
                {
                    try
                    {
                        float uso = cpuCoresCounters[i].NextValue();
                        usoPorCore += $"      Core {i:D2}: {uso:F1}%\n";
                    }
                    catch
                    {
                        usoPorCore += $"      Core {i:D2}: N/D\n";
                    }
                }
            }

            lb_Info.Font = new Font("Segoe UI Symbol", 12, FontStyle.Regular);
            lb_Info.Text = "";

            if (SettingsAlias.Default.ShowServiceTag)
            {
                lb_Info.Text += $"🔖 Service Tag: {serviceTag}\n";
            }

            if (SettingsAlias.Default.ShowUser)
            {
                lb_Info.Text += $"👤 Usuário: {user}\n";
            }

            if (SettingsAlias.Default.ShowSO)
            {
                lb_Info.Text += $"💻 SO: {sistema}\n";
            }

            if (SettingsAlias.Default.ShowCPU)
            {
                lb_Info.Text += $"💻 CPU: {cpuName}\n" +
                                  $"    Uso Total: {cpuTotal:F1}% | Temp: {cpuTemp}\n";

                if (SettingsAlias.Default.ShowCPUPerCore && cpuCoresCounters != null)
                {
                    for (int i = 0; i < cpuCoresCounters.Length; i++)
                    {
                        try
                        {
                            float uso = cpuCoresCounters[i].NextValue();
                            lb_Info.Text += $"      Core {i:D2}: {uso:F1}%\n";
                        }
                        catch
                        {
                            lb_Info.Text += $"      Core {i:D2}: N/D\n";
                        }
                    }
                }
                cpuUsoTotal = cpuTotal;
            }

            if (SettingsAlias.Default.ShowGPU)
            {
                float gpuUso = 0f;

                try
                {
                    gpuUso = ObterUsoGPU();// 🔥 agora forçando a leitura real
                }
                catch
                {
                    gpuUso = 0f;
                }

                
                lb_Info.Text += $"🎮 GPU: {gpuName}\n";
                lb_Info.Text += $"    Uso: {gpuUso:F1}% | Temp: {gpuTemp}\n";
            }

            if (SettingsAlias.Default.ShowRAM)
            {
                lb_Info.Text += $"💾 RAM: {memoriaTotal} ( {ramUsage:F1}% )\n";
                lb_Info.Text += $"   Page Writes/sec: {pageWrites:F1}\n";
                lb_Info.Text += $"   Modified Pages: {modifiedMB:F1} MB\n";
            }


            //if (SettingsAlias.Default.ShowDisks)
            //{
            //    foreach (DriveInfo drive in DriveInfo.GetDrives())
            //    {
            //        if (drive.IsReady)
            //        {
            //            // INFORMAÇÃO DO DISCO
            //            lb_Info.Text +=
            //                $"💽 {drive.Name} {drive.TotalFreeSpace / (1024 * 1024 * 1024.0):n1} GB / " +
            //                $"{drive.TotalSize / (1024 * 1024 * 1024.0):n1} GB livres\n";
            //
            //            //string letra = drive.Name.Substring(0, drive.Name.Length - 1);
            //
            //            // FILA DE GRAVAÇÃO DA UNIDADE
            //            if (diskQueues.ContainsKey(letra))
            //            {
            //                float dq = diskQueues[letra].NextValue();
            //                lb_Info.Text += $"📀 Fila de Gravação: {dq:n2}\n";
            //            }
            //
            //            lb_Info.Text += "\n"; // espaço entre as unidades
            //        }
            //    }
            //}


            if (SettingsAlias.Default.ShowDisks)
            {





                //try
                //{
                //    var drives = DriveInfo.GetDrives()
                //        .Where(d => d.IsReady && (d.DriveType == DriveType.Fixed || d.DriveType == DriveType.Removable));
                //
                //    var linhas = drives.Select(d =>
                //    {
                //        double livre = d.AvailableFreeSpace / 1024.0 / 1024 / 1024;
                //        double total = d.TotalSize / 1024.0 / 1024 / 1024;
                //        string tipo = d.DriveType == DriveType.Removable ? "🔌 USB" : "💽";
                //        return $"{tipo} {d.Name} {livre:F1} GB / {total:F1} GB livres";
                //    });
                //
                //    return string.Join("\n", linhas);
                //}
                //catch
                //{
                //    return "💽 Disco: N/D";
                //}



                foreach (DriveInfo drive in DriveInfo.GetDrives())
                {
                    if (drive.IsReady)
                    {
                        // Normaliza a letra da unidade (C:, D:, etc.)
                        string letra = drive.Name.Replace("\\", "").Replace(":", "");

                        string tipo = drive.DriveType == DriveType.Removable ? "🔌 USB" : "💽";

                        // INFORMAÇÃO DO DISCO
                        lb_Info.Text +=
                            $"{tipo} {drive.Name} {drive.TotalFreeSpace / (1024d * 1024 * 1024):n1} GB / " +
                            $"{drive.TotalSize / (1024d * 1024 * 1024):n1} GB livres\n";

                       
                        // FILA DE GRAVAÇÃO (POR UNIDADE)
                       

                        if (diskQueues.ContainsKey(letra) && tipo != "🔌 USB")
                        {
                            try
                            {
                                float dq = diskQueues[letra].NextValue();
                                lb_Info.Text += $"📀 Fila de Gravação: {dq:n2}\n";
                            }
                            catch
                            {
                                lb_Info.Text += $"📀 Fila de Gravação: N/D\n";
                            }
                        }
                    }
                }
                float filaTotal = diskQueueTotal.NextValue();
                lb_Info.Text += $"  Fila Total: {filaTotal:n2}\n";

            }



            if (SettingsAlias.Default.ShowNetwork)
            {
                if (ip != "N/D")
                {
                    lb_Info.Text += $"🌐 IP: {ip}\n" +
                                      $"   Máscara: {mask}\n" +
                                      $"   Gateway: {gateway}\n";
                    if (interfaceAtiva != null && wifiSSID != "N/D")
                        lb_Info.Text += $"   SSID Wi-Fi: {wifiSSID}\n";
                    lb_Info.Text += $"   MAC: {mac}\n";
                }
            }

            

            // -------------------------------------------------------------------
            // 🔋 STATUS DE BATERIA (somente notebooks)
            // -------------------------------------------------------------------
            try
            {
                var ps = System.Windows.Forms.SystemInformation.PowerStatus;
                int bateria = (int)(ps.BatteryLifePercent * 100);
                string status = ps.PowerLineStatus == PowerLineStatus.Online ? "⚡ Carregando" : "🔋 Descarregando";

                // Exibe somente se houver bateria detectada (evita desktops)
                if (ps.BatteryChargeStatus != BatteryChargeStatus.NoSystemBattery)
                {
                    lb_Info.Text += $"\n🔋 Bateria {bateria}%\n";
                    lb_Info.Text += $"🔌 Energia: {status}\n";
                    
                }
            }
            catch {}


            Debug.WriteLine($"Instâncias registradas: {string.Join(", ", frm_Analogico.Instancias.Keys)}");

            if (frm_Analogico.Instancias.ContainsKey("CPU") &&
                frm_Analogico.Instancias["CPU"] != null &&
                frm_Analogico.Instancias["CPU"].Visible)
            {
                frm_Analogico.Instancias["CPU"].AtualizarValor(cpuTotal);
            }

            if (frm_Analogico.Instancias.ContainsKey("GPU") &&
                frm_Analogico.Instancias["GPU"] != null &&
                frm_Analogico.Instancias["GPU"].Visible)
            {
                // Agora ObterUsoGPU() já retorna 0–100 (%)
                frm_Analogico.Instancias["GPU"].AtualizarValor(ObterUsoGPU());
            }

            if (frm_Analogico.Instancias.ContainsKey("RAM") &&
                frm_Analogico.Instancias["RAM"] != null &&
                frm_Analogico.Instancias["RAM"].Visible)
            {
                frm_Analogico.Instancias["RAM"].AtualizarValor(ramUsage);
            }



            AjustarTamanhoJanela();
        }


        /*****************************************************************************
              Function: ObterDiskInstance
             Descrição: 

               Retorno: 
             Parametro: --
           Dt. Criação: 12/11/2025  
         Dt. Alteração:  
        Obs. Alteração: 
            Criada por: mFacine
        ******************************************************************************/
        private string GetDiskInstance(string driveLetter)
        {
            driveLetter = driveLetter.Replace("\\", "").Replace(":", "");

            var driveSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive");

            foreach (ManagementObject drive in driveSearcher.Get())
            {
                string index = drive["Index"].ToString();

                foreach (ManagementObject partition in drive.GetRelated("Win32_DiskPartition"))
                {
                    foreach (ManagementObject logical in partition.GetRelated("Win32_LogicalDisk"))
                    {
                        string logicalLetter = logical["DeviceID"].ToString().Replace("\\", "").Replace(":", "");

                        if (logicalLetter == driveLetter)
                        {
                            // FORMATO CORRETO DO WINDOWS PERFORMANCE COUNTER
                            return $"{index} {logicalLetter}:";
                        }
                    }
                }
            }

            return null;
        }



        /*****************************************************************************
              Function: ObterRedeLocal
             Descrição: Retorna IP, máscara e gateway da interface de rede ativa,
                        priorizando conexões Ethernet e Wi-Fi reais.
               Retorno: string ip, string mask, string gateway
             Parametro: --
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Implementado filtro para descartar adaptadores virtuais/VPN.
            Criada por: mFacine
        ******************************************************************************/
        private (string ip, string mask, string gateway, string mac) ObterRedeLocal()
        {
            try
            {
                var all = NetworkInterface.GetAllNetworkInterfaces()
                    .Where(n => n.OperationalStatus == OperationalStatus.Up
                             && n.NetworkInterfaceType != NetworkInterfaceType.Loopback);

                // Prioriza Ethernet/Wi-Fi e ignora nomes suspeitos
                Func<NetworkInterface, int> score = n =>
                {
                    int s = 0;
                    if (n.NetworkInterfaceType == NetworkInterfaceType.Ethernet) s += 2;
                    if (n.NetworkInterfaceType == NetworkInterfaceType.Wireless80211) s += 1;
                    var name = n.Name + " " + n.Description;
                    if (name.IndexOf("virtual", StringComparison.OrdinalIgnoreCase) >= 0) s -= 2;
                    if (name.IndexOf("hyper-v", StringComparison.OrdinalIgnoreCase) >= 0) s -= 2;
                    if (name.IndexOf("vpn", StringComparison.OrdinalIgnoreCase) >= 0) s -= 2;
                    return s;
                };

                foreach (var nic in all.OrderByDescending(score))
                {
                    var props = nic.GetIPProperties();
                    var ipv4 = props.UnicastAddresses.FirstOrDefault(a => a.Address.AddressFamily == AddressFamily.InterNetwork);
                    var gateway = props.GatewayAddresses.FirstOrDefault(g => g.Address.AddressFamily == AddressFamily.InterNetwork);
                    string mac = string.Join(":", nic.GetPhysicalAddress()
                    .GetAddressBytes()
                    .Select(b => b.ToString("X2")));


                    if (ipv4 != null)
                    {
                        return (
                            ipv4.Address.ToString(),
                            ipv4.IPv4Mask?.ToString() ?? "N/D",
                            gateway?.Address?.ToString() ?? "N/D",
                            mac?.ToString()?? "N/D" 
                        );
                    }

                }
                
            }
            catch { }
            return ("N/D", "N/D", "N/D", "N/D");
        }

        /*****************************************************************************
              Function: ObterNomeWiFi
             Descrição: 
               Retorno: string
             Parametro: --
           Dt. Criação: 04/11/2025  
         Dt. Alteração:  
        Obs. Alteração: 
            Criada por: mFacine
        ******************************************************************************/
        private string ObterNomeWiFi()
        {
            try
            {
                var process = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "netsh",
                    Arguments = "wlan show interfaces",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (var p = System.Diagnostics.Process.Start(process))
                {
                    string output = p.StandardOutput.ReadToEnd();
                    p.WaitForExit();

                    // Busca pela linha SSID : NomeDaRede
                    var match = System.Text.RegularExpressions.Regex.Match(
                        output, @"\s*SSID\s*:\s*(.+)",
                        System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                    if (match.Success)
                        return match.Groups[1].Value.Trim();
                }
            }
            catch { }

            return "N/D";
        }



        /*****************************************************************************
              Function: ObterServiceTag
             Descrição: Consulta o número de série (Service Tag) via WMI na classe
                        Win32_BIOS.
               Retorno: String
             Parametro: --
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Adicionado tratamento de exceção seguro.
            Criada por: mFacine
        ******************************************************************************/
        private string ObterServiceTag()
        {
            try
            {
                var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
                foreach (ManagementObject obj in searcher.Get())
                {
                    return obj["SerialNumber"]?.ToString().Trim() ?? "N/D";
                }
            }
            catch { }
            return "N/D";
        }

        /*****************************************************************************
              Function: ObterMemoriaInstalada
             Descrição: Retorna a quantidade total de memória física instalada
                        no sistema, convertendo para GB.
               Retorno: String
             Parametro: --
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Padronizado cálculo com precisão de 1 casa decimal.
            Criada por: mFacine
        ******************************************************************************/
        private string ObterMemoriaInstalada()
        {
            try
            {
                var searcher = new ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
                foreach (ManagementObject obj in searcher.Get())
                {
                    double bytes = Convert.ToDouble(obj["TotalPhysicalMemory"]);
                    double gb = bytes / 1024 / 1024 / 1024;
                    return $"{gb:F1} GB";
                }
            }
            catch { }
            return "N/D";
        }

        /*****************************************************************************
              Function: ObterEspacoDiscos
             Descrição: Lista todos os discos fixos e removíveis, exibindo espaço
                        total e livre em GB.
               Retorno: String
             Parametro: --
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Adicionado ícone diferenciado para unidades USB.
            Criada por: mFacine
        ******************************************************************************/
        private string ObterEspacoDiscos()
        {
            try
            {
                var drives = DriveInfo.GetDrives()
                    .Where(d => d.IsReady && (d.DriveType == DriveType.Fixed || d.DriveType == DriveType.Removable));

                var linhas = drives.Select(d =>
                {
                    double livre = d.AvailableFreeSpace / 1024.0 / 1024 / 1024;
                    double total = d.TotalSize / 1024.0 / 1024 / 1024;
                    string tipo = d.DriveType == DriveType.Removable ? "🔌 USB" : "💽";
                    return $"{tipo} {d.Name} {livre:F1} GB / {total:F1} GB livres";
                });

                return string.Join("\n", linhas);
            }
            catch
            {
                return "💽 Disco: N/D";
            }
        }

        /*****************************************************************************
              Function: ObterTemperaturaCPU
             Descrição: Obtém a média de temperatura dos núcleos de CPU via
                        OpenHardwareMonitor.
               Retorno: String
             Parametro: --
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Alterado para média dos sensores válidos.
            Criada por: mFacine
        ******************************************************************************/
        private string ObterTemperaturaCPU()
        {
            try
            {
                if (hardwareMonitor != null)
                {
                    foreach (var hw in hardwareMonitor.Hardware)
                    {
                        if (hw.HardwareType == HardwareType.Cpu)
                        {

                            var t = hw.Sensors.FirstOrDefault(s => s.SensorType == SensorType.Temperature && s.Value.HasValue);

                            if (t != null)
                            {
                                return $"{t.Value.Value:F1} °C";
                            }




                            hw.Update();
                            var temps = hw.Sensors
                                .Where(s => s.SensorType == SensorType.Temperature && s.Value.HasValue)
                                .Select(s => s.Value.Value)
                                .ToList();
                            if (temps.Count > 0)
                            {
                                return $"{temps.Average():F1} °C"; // ou temps.Max()
                            }
                        }
                    }
                }
            }
            catch { }
            return "N/D";
        }


        /*****************************************************************************
              Function: ObterTemperaturaGPU
              Descrição: Retorna a temperatura da GPU ativa (NVIDIA, AMD ou Intel)
                         via OpenHardwareMonitor.
               Retorno: String
             Parametro: --
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Implementado suporte multi-vendor com leitura segura.
            Criada por: mFacine
        ******************************************************************************/
        private string ObterTemperaturaGPU()
        {
            try
            {
                if (hardwareMonitor != null)
                {
                    foreach (var hw in hardwareMonitor.Hardware)
                    {
                        hw.Update();
                        if (hw.HardwareType == HardwareType.GpuNvidia || hw.HardwareType == HardwareType.GpuAmd || hw.HardwareType == HardwareType.GpuIntel)
                        {
                            var t = hw.Sensors.FirstOrDefault(s => s.SensorType == SensorType.Temperature && s.Value.HasValue);
                            
                            if (t != null)
                            {
                                return $"{t.Value.Value:F1} °C";
                            }
                        }
                    }
                }
            }
            catch { }
            return "N/D";
        }



        /*****************************************************************************
              Function: ObterUsoGPU
              Descrição: Retorna o uso da GPU ativa (NVIDIA, AMD ou Intel)
                         via OpenHardwareMonitor.
               Retorno: float
             Parametro: --
           Dt. Criação: 06/11/2025  
         Dt. Alteração:  
        Obs. Alteração: 
            Criada por: mFacine
        ******************************************************************************/
        private float ObterUsoGPU()
        {
            //try
            //{
            //    if (hardwareMonitor == null)
            //        return 0f;
            //
            //    foreach (var hw in hardwareMonitor.Hardware)
            //    {
            //        if (hw.HardwareType == OpenHardwareMonitor.Hardware.HardwareType.GpuNvidia ||
            //            hw.HardwareType == OpenHardwareMonitor.Hardware.HardwareType.GpuAmd ||
            //            hw.HardwareType == OpenHardwareMonitor.Hardware.HardwareType.GpuIntel)
            //        {
            //            hw.Update();
            //            AtualizarSubHardware(hw);
            //
            //            // 🔹 Coleta todos os sensores de carga da GPU e subitens
            //            var gpuLoad = hw.Sensors
            //                .Where(s => s.SensorType == OpenHardwareMonitor.Hardware.SensorType.Load)
            //                .Select(s => $"{s.Name}: {s.Value:F1}%")
            //                .ToList();
            //
            //            // 🔹 Inclui sub-hierarquias (caso os sensores estejam nelas)
            //            foreach (var sub in hw.SubHardware)
            //            {
            //                sub.Update();
            //                gpuLoad.AddRange(sub.Sensors
            //                    .Where(s => s.SensorType == OpenHardwareMonitor.Hardware.SensorType.Load)
            //                    .Select(s => $"{s.Name}: {s.Value:F1}%"));
            //            }
            //
            //            // 🔹 Mostra no Output (Debug)
            //            System.Diagnostics.Debug.WriteLine("GPU => " + string.Join(" | ", gpuLoad));
            //
            //            // 🔹 Busca o sensor de carga principal
            //            var sensorCore = hw.Sensors.FirstOrDefault(s =>
            //                s.SensorType == OpenHardwareMonitor.Hardware.SensorType.Load &&
            //                s.Name.ToLower().Contains("core"));
            //
            //            if (sensorCore == null)
            //            {
            //                // fallback: tenta pegar o primeiro sensor válido
            //                sensorCore = hw.Sensors.FirstOrDefault(s =>
            //                    s.SensorType == OpenHardwareMonitor.Hardware.SensorType.Load && s.Value.HasValue);
            //            }
            //
            //            if (sensorCore != null && sensorCore.Value.HasValue)
            //            {
            //                return sensorCore.Value.Value;
            //            }
            //        }
            //    }
            //}
            //catch (Exception ex)
            //{
            //    System.Diagnostics.Debug.WriteLine("Erro GPU: " + ex.Message);
            //}
            //
            //return 0f;

            try
            {
                if (hardwareMonitor == null)
                    return 0f;

                foreach (var hw in hardwareMonitor.Hardware)
                {
                    if (hw.HardwareType == HardwareType.GpuNvidia ||
                        hw.HardwareType == HardwareType.GpuAmd ||
                        hw.HardwareType == HardwareType.GpuIntel)
                    {
                        hw.Update();

                        // ❌ REMOVE TOTALMENTE QUALQUER CHAMADA RECURSIVA
                        // AtualizarSubHardware(hw);  <-- APAGAR

                        var sensoresCarga = hw.Sensors
                            .Where(s => s.SensorType == SensorType.Load && s.Value.HasValue)
                            .Select(s => s.Value.Value)
                            .ToList();

                        if (sensoresCarga.Count > 0)
                            return sensoresCarga.Average();
                    }
                }
            }
            catch
            {
                // Se der erro em máquina sem GPU dedicada, retorna 0
                return 0f;
            }

            return 0f;

        }

        // 🔸 Atualiza sensores recursivos (sub-hardware)
        private void AtualizarSubHardware(OpenHardwareMonitor.Hardware.IHardware hardware)
        {
            try
            {
                hardware.Update();
                foreach (var sub in hardware.SubHardware)
                {
                    AtualizarSubHardware(sub);
                }
            }
            catch { }
        }




        private void FadeTimer_Tick(object sender, EventArgs e)
        {
            //Controla a opacidade do overlay de acordo com a presença
            //do mouse, aplicando efeito de fade suave.


            bool fadeAtivo = OverlayCraft.Properties.Settings.Default.EnableFade;

            // Se o fade estiver desativado, mantém sempre opacidade total
            if (!fadeAtivo)
            {
                // Apenas garante 1x a opacidade padrão e para o timer
                this.Opacity = 0.90D;// mantenha igual ao Designer
                return;
            }

            // Se ativar o fade (via config), garanta que o timer está rodando
            if (!fadeTimer.Enabled)
            {
                fadeTimer.Start();
            }

            // Comportamento normal se estiver ativado
            if (Math.Abs(this.Opacity - targetOpacity) < fadeStep)
            {
                this.Opacity = targetOpacity;
            }
            else
            {
                if (this.Opacity < targetOpacity)
                {
                    this.Opacity += fadeStep;
                }
                else
                {
                    if (this.Opacity > targetOpacity)
                    {
                        this.Opacity -= fadeStep;
                    }
                }
            }
        }

        private void frm_Overlay_MouseEnter(object sender, EventArgs e)
        {
            //Define a opacidade alvo (targetOpacity) para o fade ao
            //detectar entrada ou saída do mouse sobre o overlay.
            targetOpacity = 0.9;
        }

        private void frm_Overlay_MouseLeave(object sender, EventArgs e)
        {
            //Define a opacidade alvo(targetOpacity) para o fade ao
            //detectar saida ou saída do mouse sobre o overlay.
            targetOpacity = 0.3;
        }


        ///*****************************************************************************
        //     Procedure: AjustarTamanhoJanela
        //     Descrição: Redimensiona automaticamente a janela do overlay conforme
        //                o conteúdo do texto, ajustando tanto a altura quanto a largura
        //                de forma responsiva.
        //   Dt. Criação: 30/10/2025
        // Dt. Alteração: 04/11/2025 
        //Obs. Alteração: Incluído redimensionamento horizontal dinâmico e prevenção
        //                de quebras de linha (WordBreak removido).
        //                Incluído acréscimo fixo de 10px na largura final do overlay
        //                para preservar espaçamento e estética visual.
        //    Criada por: mFacine
        //******************************************************************************/
        private void AjustarTamanhoJanela()
        {
            if (lb_Info == null || pnl_Rodape == null)
            {
                return;
            }

            const int margemLateral = 20;
            const int margemInferior = 10;
            const int larguraMinima = 300;
            int larguraMaxima = Screen.PrimaryScreen.WorkingArea.Width - 100;

            var texto = lb_Info.Text ?? string.Empty;
            var linhas = texto.Replace("\r\n", "\n").Split('\n');

            int maiorLinha = larguraMinima;
            using (var g = lb_Info.CreateGraphics())
            {
                foreach (var linha in linhas)
                {
                    var sz = TextRenderer.MeasureText(
                        string.IsNullOrEmpty(linha) ? " " : linha,
                        lb_Info.Font,
                        new Size(int.MaxValue, int.MaxValue),
                        TextFormatFlags.SingleLine | TextFormatFlags.NoPadding);
                    if (sz.Width > maiorLinha)
                    {
                        maiorLinha = sz.Width;
                    }
                }
            }

            // Calcula largura base com limites
            int novaLargura = Math.Min(Math.Max(maiorLinha + margemLateral, larguraMinima), larguraMaxima);

            // Mede altura
            var tamanhoAltura = TextRenderer.MeasureText(texto.Length == 0 ? " " : texto, lb_Info.Font,
                new Size(int.MaxValue, int.MaxValue),
                TextFormatFlags.TextBoxControl | TextFormatFlags.NoPadding);

            int novaAlturaTotal = tamanhoAltura.Height + pnl_Rodape.Height + margemInferior;

            bool mudarLargura = Math.Abs(this.Width - (novaLargura + margemLateral)) > 2;
            bool mudarAltura = Math.Abs(this.Height - novaAlturaTotal) > 2;

            if (mudarLargura || mudarAltura)
            {
                this.Size = new Size(novaLargura + margemLateral + btn_Toggle.Width, novaAlturaTotal + margemInferior);  // 🔥 acrescimo final aqui
            }
        }

        /*****************************************************************************
             Procedure: AjustarBotaoConfig
             Descrição: Calcula dinamicamente a posição dos botões e do logo no
                        rodapé conforme o tamanho da janela.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Atualizado para manter espaçamento proporcional e responsivo.
            Criada por: mFacine
        ******************************************************************************/
        private void AjustarBotaoConfig()
        {
            if (btn_Config == null || btn_Close == null || picbox_Logo == null || pnl_Rodape == null)
                return;

            int spacing = 5;

            btn_Config.Location = new Point(
                pnl_Rodape.Width - btn_Config.Width - 15,
                (pnl_Rodape.Height - btn_Config.Height) / 2
            );

            btn_Close.Location = new Point(
                btn_Config.Left - btn_Close.Width - spacing,
                btn_Config.Top
            );

            picbox_Logo.Location = new Point(
                15,
                (pnl_Rodape.Height - picbox_Logo.Height) / 2
            );

            AjustarLogo();
        }

        /*****************************************************************************
             Procedure: AjustarLogo
             Descrição: Redimensiona e reposiciona o logo de acordo com a largura
                        da janela, mantendo proporções visuais.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Incluído cálculo proporcional baseado em ClientSize.
            Criada por: mFacine
        ******************************************************************************/
        private void AjustarLogo()
        {
            if (picbox_Logo == null) return;

            // Tamanho máximo permitido
            int maxWidth = 185;
            int maxHeight = 35;

            // Fator de ajuste proporcional com base na largura da janela
            // (mantém proporção em telas menores, sem crescer demais em telas grandes)
            float escala = Math.Min(1f, this.ClientSize.Width / 400f);
            int largura = (int)(maxWidth * escala);
            int altura = (int)(maxHeight * escala);

            // Garante limites
            largura = Math.Min(largura, maxWidth);
            altura = Math.Min(altura, maxHeight);

            picbox_Logo.Size = new Size(largura, altura);

            // Reposiciona junto ao botão de fechar
            if (btn_Close != null)
            {
                int spacing = 5;
                picbox_Logo.Location = new Point(
                    btn_Close.Left - picbox_Logo.Width - spacing,
                    btn_Close.Top + (btn_Close.Height - picbox_Logo.Height) / 2
                );
            }
        }

        /*****************************************************************************
             Procedure: ArrastarJanela
             Descrição: Permite mover o overlay pela tela clicando e arrastando
                        em qualquer área configurada (painel, texto ou logo).
             Parametro: object sender, MouseEventArgs e 
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: Refeito para compatibilidade com o padrão FormBorderStyle.None.
            Criada por: mFacine
        ******************************************************************************/
        private void ArrastarJanela(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                ReleaseCapture();
                SendMessage(this.Handle, WM_NCLBUTTONDOWN, HTCAPTION, 0);
            }
        }



        private void frm_Overlay_Load(object sender, EventArgs e)
        {
            //Eventos do ciclo de vida do formulário. Ajustam layout,
            //comportamento na minimização e salvam configurações.
            AjustarBotaoConfig();
            InicializarDiskQueues();

            // Posiciona a persiana fixa na lateral esquerda
            this.Left = 0;
            this.Top = 0;
            this.Height = Screen.PrimaryScreen.WorkingArea.Height;

            AtualizarCores();
            AtualizarSeta();


        }

        private void AtualizarCores()
        {
            string hex = SettingsAlias.Default.FontColor;
            if (string.IsNullOrWhiteSpace(hex))
                hex = "#32CD32";

            Color cor = ColorTranslator.FromHtml(hex);
            btn_Toggle.ForeColor = cor;
            btn_Toggle.FlatAppearance.BorderColor = cor;
        }

        private void AtualizarSeta()
        {
            btn_Toggle.Text = b_Aberta ? "◀" : "▶";
        }




        private void frm_Overlay_Resize(object sender, EventArgs e)
        {
            AjustarBotaoConfig();
            if (this.WindowState == FormWindowState.Minimized)
            {
                this.Hide();
                this.ShowInTaskbar = false;
            }
            AjustarLogo();
        }

        private void frm_Overlay_FormClosing(object sender, FormClosingEventArgs e)
        {
            trayIcon.Visible = false;

            try
            {
                var pos = this.Location;
                OverlayCraft.Properties.Settings.Default.OverlayPosX = pos.X;
                OverlayCraft.Properties.Settings.Default.OverlayPosY = pos.Y;
                hardwareMonitor?.Close();
            }
            catch { }

            try
            {
                timer?.Stop();
                fadeTimer?.Stop();
                timer?.Dispose();
                fadeTimer?.Dispose();
            }
            catch { }

            // [ADD] Para o servidor de monitoramento
            try
            {
                _monitoringServer?.Stop();
                _monitoringServer?.Dispose();
            }
            catch { }

            // [ADD] Para o serviço de envio de snapshots
            try
            {
                _snapshotTimer?.Stop();
                _snapshotTimer?.Dispose();
                _overlayApiService?.Dispose();
            }
            catch { }

            // [ADD] Força salvamento permanente das configurações do usuário
            OverlayCraft.Properties.Settings.Default.Save();
        }

        private void btn_Config_MouseEnter(object sender, EventArgs e)
        {
            btn_Config.ForeColor = Color.White; // ilumina levemente
        }

        private void btn_Config_MouseLeave(object sender, EventArgs e)
        {
            btn_Config.ForeColor = Color.LightGray; // volta à cor neutra
        }


        private void btn_Config_Click(object sender, EventArgs e)
        {
            frm_ConfigOverlay obj_frm_ConfigOverlay = new frm_ConfigOverlay(this);
            obj_frm_ConfigOverlay.ShowDialog(this);
        }

        private void btn_Close_Click(object sender, EventArgs e)
        {
            try
            {
                trayIcon.Visible = false;
                hardwareMonitor?.Close();

                // Salva posição e preferências
                var pos = this.Location;
                OverlayCraft.Properties.Settings.Default.OverlayPosX = pos.X;
                OverlayCraft.Properties.Settings.Default.OverlayPosY = pos.Y;
                OverlayCraft.Properties.Settings.Default.Save();

                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao fechar o Overlay: {ex.Message}", "OverlayCraft", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        /*****************************************************************************
             Procedure: CreateParams (Override)
             Descrição: Adiciona flag WS_EX_COMPOSITED para reduzir flicker e
                        melhorar o render do overlay. Inserido para suavizar redraw do 
                        formulário.
           Dt. Criação: 30/10/2025  
         Dt. Alteração:  
        Obs. Alteração: 
            Criada por: mFacine
        ******************************************************************************/
        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= 0x02000000; // WS_EX_COMPOSITED
                return cp;
            }
        }



        //PERSIANA
        private void btn_Toggle_Click(object sender, EventArgs e)
        {
            b_Aberta = !b_Aberta;
            i_TargetLeft = b_Aberta ? 0 : -this.Width + btn_Toggle.Width;
            AtualizarSeta();

            if (!this.Visible)
            {
                this.Opacity = 0.98;
                this.Show();
            }
            AnimTimer.Start();
        }


        private void Animar(object sender, EventArgs e)
        {
            const int passo = 25;

            if (this.Left < i_TargetLeft)
            {
                this.Left = Math.Min(this.Left + passo, i_TargetLeft);
            }
            else if (this.Left > i_TargetLeft)
            {
                this.Left = Math.Max(this.Left - passo, i_TargetLeft);
            }
            else
            {
                AnimTimer.Stop();
            }
        }

    }
}
