using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PatioAgent.Services;
using PatioAgent.Storage;
using Serilog;

namespace PatioAgent;

public class Program
{
    public static void Main(string[] args)
    {
        // Configurar Serilog
        var logPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PatioAgent", "logs", "patio-.log"
        );

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console()
            .WriteTo.File(logPath, rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)
            .CreateLogger();

        try
        {
            Log.Information("=== PatioAgent v1.0.0 iniciando ===");

            var builder = Host.CreateApplicationBuilder(args);

            // Registrar servicos
            builder.Services.AddSingleton<LocalStorage>();
            builder.Services.AddSingleton<ApiClient>();
            builder.Services.AddSingleton<EnrollmentService>();
            builder.Services.AddSingleton<EventCollector>();
            builder.Services.AddSingleton<InventoryCollector>();
            builder.Services.AddHostedService<PatioWorker>();

            // Configurar como Windows Service
            builder.Services.AddWindowsService(options =>
            {
                options.ServiceName = "PatioAgent";
            });

            // Adicionar Serilog
            builder.Logging.AddSerilog();

            var host = builder.Build();
            host.Run();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "PatioAgent falhou ao iniciar");
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }
}
