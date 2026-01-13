using System.Management;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Domain;

namespace OverlayAgent.Core.Collectors;

/// <summary>
/// Coletor de informacoes de hardware
/// </summary>
public class HardwareCollector : ICollector<HardwareInfo>
{
    private readonly ILogger<HardwareCollector> _logger;

    public HardwareCollector(ILogger<HardwareCollector> logger)
    {
        _logger = logger;
    }

    public Task<HardwareInfo> CollectAsync()
    {
        var info = new HardwareInfo();

        try
        {
            CollectCpuInfo(info);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes da CPU");
        }

        try
        {
            CollectMemoryInfo(info);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes de memoria");
        }

        try
        {
            CollectGpuInfo(info);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes da GPU");
        }

        try
        {
            CollectMotherboardInfo(info);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes da placa-mae");
        }

        return Task.FromResult(info);
    }

    private void CollectCpuInfo(HardwareInfo info)
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor");

        foreach (var obj in searcher.Get())
        {
            info.CpuModel = obj["Name"]?.ToString()?.Trim();
            info.CpuCores = Convert.ToInt32(obj["NumberOfCores"]);
            info.CpuThreads = Convert.ToInt32(obj["NumberOfLogicalProcessors"]);
            info.CpuMaxClockMhz = Convert.ToInt32(obj["MaxClockSpeed"]);
            info.CpuArchitecture = GetArchitectureName(Convert.ToInt32(obj["Architecture"]));

            // Pega apenas o primeiro processador
            break;
        }
    }

    private void CollectMemoryInfo(HardwareInfo info)
    {
        // Total de RAM
        using (var osSearcher = new ManagementObjectSearcher("SELECT TotalVisibleMemorySize FROM Win32_OperatingSystem"))
        {
            foreach (var obj in osSearcher.Get())
            {
                var totalKb = Convert.ToUInt64(obj["TotalVisibleMemorySize"]);
                info.RamTotalGb = Math.Round((decimal)totalKb / 1024 / 1024, 2);
            }
        }

        // Slots de memoria
        using (var memSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemoryArray"))
        {
            foreach (var obj in memSearcher.Get())
            {
                info.RamSlotsTotal = Convert.ToInt32(obj["MemoryDevices"]);
            }
        }

        // Slots em uso
        using (var memModSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemory"))
        {
            info.RamSlotsUsed = 0;
            foreach (var obj in memModSearcher.Get())
            {
                info.RamSlotsUsed++;
            }
        }
    }

    private void CollectGpuInfo(HardwareInfo info)
    {
        using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_VideoController");

        foreach (var obj in searcher.Get())
        {
            info.GpuModel = obj["Name"]?.ToString()?.Trim();

            var adapterRam = obj["AdapterRAM"];
            if (adapterRam != null)
            {
                var ramBytes = Convert.ToUInt64(adapterRam);
                info.GpuMemoryGb = Math.Round((decimal)ramBytes / 1024 / 1024 / 1024, 2);
            }

            // Pega apenas a primeira GPU
            break;
        }
    }

    private void CollectMotherboardInfo(HardwareInfo info)
    {
        // Placa-mae
        using (var bbSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_BaseBoard"))
        {
            foreach (var obj in bbSearcher.Get())
            {
                info.MotherboardManufacturer = obj["Manufacturer"]?.ToString()?.Trim();
                info.MotherboardModel = obj["Product"]?.ToString()?.Trim();
                break;
            }
        }

        // BIOS
        using (var biosSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_BIOS"))
        {
            foreach (var obj in biosSearcher.Get())
            {
                info.BiosVersion = obj["SMBIOSBIOSVersion"]?.ToString()?.Trim();
                info.BiosDate = obj["ReleaseDate"]?.ToString()?.Trim();
                break;
            }
        }
    }

    private string GetArchitectureName(int architecture)
    {
        return architecture switch
        {
            0 => "x86",
            5 => "ARM",
            6 => "IA64",
            9 => "x64",
            12 => "ARM64",
            _ => "Unknown"
        };
    }
}
