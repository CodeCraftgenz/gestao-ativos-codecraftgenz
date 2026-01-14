using System;
using System.Linq;
using System.Management;
using System.Security.Cryptography;
using System.Text;

namespace OverlayCraft
{
    public static class HardwareUtil
    {
        public static string GetHardwareId()
        {
            try
            {
                string cpuId = GetCpuId();
                string mbSerial = GetMotherboardSerial();

                if (string.IsNullOrWhiteSpace(cpuId) &&
                    string.IsNullOrWhiteSpace(mbSerial))
                {
                    // fallback mínimo
                    cpuId = Environment.MachineName;
                    mbSerial = "NO_MB_SERIAL";
                }

                string baseString = cpuId.Trim() + "|" + mbSerial.Trim();

                using (SHA256 sha = SHA256.Create())
                {
                    byte[] bytes = Encoding.UTF8.GetBytes(baseString);
                    byte[] hash = sha.ComputeHash(bytes);

                    StringBuilder sb = new StringBuilder();
                    foreach (byte b in hash)
                        sb.Append(b.ToString("X2")); // HEX maiúsculo

                    return sb.ToString();
                }
            }
            catch
            {
                // fallback extremo, se der ruim no WMI/crypto
                return "HWID_ERROR_" + Environment.MachineName;
            }
        }

        private static string GetCpuId()
        {
            try
            {
                using (var searcher = new ManagementObjectSearcher("select ProcessorId from Win32_Processor"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        var id = obj["ProcessorId"]?.ToString();
                        if (!string.IsNullOrWhiteSpace(id))
                            return id;
                    }
                }
            }
            catch { }

            return string.Empty;
        }

        private static string GetMotherboardSerial()
        {
            try
            {
                using (var searcher = new ManagementObjectSearcher("select SerialNumber from Win32_BaseBoard"))
                {
                    foreach (ManagementObject obj in searcher.Get())
                    {
                        var serial = obj["SerialNumber"]?.ToString();
                        if (!string.IsNullOrWhiteSpace(serial))
                            return serial;
                    }
                }
            }
            catch { }

            return string.Empty;
        }
    }
}
