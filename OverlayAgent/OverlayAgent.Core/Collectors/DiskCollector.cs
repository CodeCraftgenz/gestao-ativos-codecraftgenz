using System.Management;
using Microsoft.Extensions.Logging;
using OverlayAgent.Core.Models.Domain;

namespace OverlayAgent.Core.Collectors;

/// <summary>
/// Coletor de informacoes de discos
/// </summary>
public class DiskCollector : ICollector<List<DiskInfo>>
{
    private readonly ILogger<DiskCollector> _logger;

    public DiskCollector(ILogger<DiskCollector> logger)
    {
        _logger = logger;
    }

    public Task<List<DiskInfo>> CollectAsync()
    {
        var disks = new List<DiskInfo>();

        try
        {
            // Coleta informacoes logicas dos drives
            var drives = DriveInfo.GetDrives()
                .Where(d => d.IsReady && (d.DriveType == DriveType.Fixed || d.DriveType == DriveType.Removable));

            foreach (var drive in drives)
            {
                try
                {
                    var disk = new DiskInfo
                    {
                        DriveLetter = drive.Name.TrimEnd('\\'),
                        VolumeLabel = string.IsNullOrEmpty(drive.VolumeLabel) ? null : drive.VolumeLabel,
                        FileSystem = drive.DriveFormat,
                        TotalGb = Math.Round((decimal)drive.TotalSize / 1024 / 1024 / 1024, 2),
                        FreeGb = Math.Round((decimal)drive.TotalFreeSpace / 1024 / 1024 / 1024, 2),
                        DiskType = drive.DriveType == DriveType.Removable ? "USB" : "Unknown"
                    };

                    disk.UsedPercent = disk.TotalGb > 0
                        ? Math.Round((1 - disk.FreeGb / disk.TotalGb) * 100, 2)
                        : 0;

                    disks.Add(disk);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao coletar informacoes do drive {Drive}", drive.Name);
                }
            }

            // Enriquece com informacoes de WMI (modelo, serial, tipo)
            EnrichWithWmiInfo(disks);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao coletar informacoes de discos");
        }

        return Task.FromResult(disks);
    }

    private void EnrichWithWmiInfo(List<DiskInfo> disks)
    {
        try
        {
            // Mapeia letras de drive para disk index
            var driveToIndex = new Dictionary<string, uint>();

            using (var partitionSearcher = new ManagementObjectSearcher(
                "SELECT * FROM Win32_LogicalDiskToPartition"))
            {
                foreach (var obj in partitionSearcher.Get())
                {
                    var dependent = obj["Dependent"]?.ToString() ?? "";
                    var antecedent = obj["Antecedent"]?.ToString() ?? "";

                    // Extrai letra do drive (ex: "C:")
                    var driveMatch = System.Text.RegularExpressions.Regex.Match(dependent, @"DeviceID=""(\w:)""");
                    var diskMatch = System.Text.RegularExpressions.Regex.Match(antecedent, @"Disk #(\d+)");

                    if (driveMatch.Success && diskMatch.Success)
                    {
                        driveToIndex[driveMatch.Groups[1].Value] = uint.Parse(diskMatch.Groups[1].Value);
                    }
                }
            }

            // Coleta informacoes dos discos fisicos
            var physicalDisks = new Dictionary<uint, (string Model, string Serial, string MediaType)>();

            using (var diskSearcher = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive"))
            {
                foreach (var obj in diskSearcher.Get())
                {
                    var index = Convert.ToUInt32(obj["Index"]);
                    var model = obj["Model"]?.ToString()?.Trim() ?? "";
                    var serial = obj["SerialNumber"]?.ToString()?.Trim() ?? "";
                    var mediaType = obj["MediaType"]?.ToString() ?? "";

                    physicalDisks[index] = (model, serial, mediaType);
                }
            }

            // Associa informacoes aos discos logicos
            foreach (var disk in disks)
            {
                var driveLetter = disk.DriveLetter?.TrimEnd(':') + ":";

                if (driveLetter != null && driveToIndex.TryGetValue(driveLetter, out var diskIndex))
                {
                    if (physicalDisks.TryGetValue(diskIndex, out var physicalInfo))
                    {
                        disk.Model = string.IsNullOrEmpty(physicalInfo.Model) ? null : physicalInfo.Model;
                        disk.SerialNumber = string.IsNullOrEmpty(physicalInfo.Serial) ? null : physicalInfo.Serial;

                        // Determina tipo do disco
                        disk.DiskType = DetermineDiskType(physicalInfo.Model, physicalInfo.MediaType);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao enriquecer informacoes de disco via WMI");
        }
    }

    private string DetermineDiskType(string model, string mediaType)
    {
        var modelLower = model.ToLowerInvariant();

        // NVMe
        if (modelLower.Contains("nvme"))
        {
            return "NVMe";
        }

        // SSD
        if (modelLower.Contains("ssd") ||
            modelLower.Contains("solid state") ||
            mediaType.Contains("SSD", StringComparison.OrdinalIgnoreCase))
        {
            return "SSD";
        }

        // HDD
        if (mediaType.Contains("Fixed hard disk", StringComparison.OrdinalIgnoreCase))
        {
            return "HDD";
        }

        // USB/Removable
        if (mediaType.Contains("Removable", StringComparison.OrdinalIgnoreCase))
        {
            return "USB";
        }

        return "Unknown";
    }
}
