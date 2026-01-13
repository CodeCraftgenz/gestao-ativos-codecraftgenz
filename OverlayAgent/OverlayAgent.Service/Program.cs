using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OverlayAgent.Core.Collectors;
using OverlayAgent.Core.Http;
using OverlayAgent.Core.Models.Domain;
using OverlayAgent.Core.Services;
using OverlayAgent.Core.Storage;
using Polly;
using Polly.Extensions.Http;
using Serilog;

namespace OverlayAgent.Service;

public class Program
{
    private static IConfiguration? _configuration;

    public static async Task Main(string[] args)
    {
        // Carrega configuracao do appsettings.json
        var basePath = AppContext.BaseDirectory;
        _configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .Build();

        // Configura Serilog
        var logPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "OverlayAgent",
            "Logs",
            "agent-.log"
        );

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
            .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .WriteTo.File(
                logPath,
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 7,
                fileSizeLimitBytes: 10 * 1024 * 1024 // 10MB
            )
            .CreateLogger();

        try
        {
            var serverUrl = _configuration["AgentSettings:ServerUrl"] ?? "http://localhost:3000";
            Log.Information("Iniciando Overlay Agent Service...");
            Log.Information("Server URL: {ServerUrl}", serverUrl);

            var host = Host.CreateDefaultBuilder(args)
                .UseWindowsService(options =>
                {
                    options.ServiceName = "OverlayAgent";
                })
                .UseSerilog()
                .ConfigureServices((context, services) =>
                {
                    ConfigureServices(services, serverUrl);
                })
                .Build();

            await host.RunAsync();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Erro fatal ao iniciar o servico");
            throw;
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }

    private static void ConfigureServices(IServiceCollection services, string serverUrl)
    {
        // Registra a configuracao do servidor
        services.AddSingleton(new AgentSettings { ServerUrl = serverUrl });

        // Storage
        services.AddSingleton<ISecureStorage>(sp =>
        {
            var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<SecureStorage>>();
            return new SecureStorage(logger, serverUrl);
        });

        // Collectors
        services.AddSingleton<ICollector<SystemInfo>, SystemInfoCollector>();
        services.AddSingleton<ICollector<HardwareInfo>, HardwareCollector>();
        services.AddSingleton<ICollector<List<DiskInfo>>, DiskCollector>();
        services.AddSingleton<ICollector<List<NetworkInfo>>, NetworkCollector>();
        services.AddSingleton<ICollector<List<SoftwareInfo>>, SoftwareCollector>();

        // HTTP Client com retry policy
        services.AddHttpClient<IApiClient, ApiClient>((client) =>
            {
                client.BaseAddress = new Uri(serverUrl);
                client.Timeout = TimeSpan.FromSeconds(30);
                client.DefaultRequestHeaders.Add("User-Agent", "OverlayAgent/1.0");
            })
            .AddPolicyHandler(GetRetryPolicy())
            .AddPolicyHandler(GetCircuitBreakerPolicy());

        // Services
        services.AddSingleton<IEnrollmentService, EnrollmentService>();
        services.AddSingleton<IHeartbeatService, HeartbeatService>();
        services.AddSingleton<IInventoryService, InventoryService>();

        // Worker
        services.AddHostedService<AgentWorker>();
    }

    private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .WaitAndRetryAsync(3, retryAttempt =>
                TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)) // 2, 4, 8 segundos
            );
    }

    private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1));
    }
}

/// <summary>
/// Configuracoes do agente lidas do appsettings.json
/// </summary>
public class AgentSettings
{
    public string ServerUrl { get; set; } = "http://localhost:3000";
}
