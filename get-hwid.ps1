$cpuId = (Get-WmiObject Win32_Processor).ProcessorId
$mbSerial = (Get-WmiObject Win32_BaseBoard).SerialNumber
$baseString = $cpuId.Trim() + "|" + $mbSerial.Trim()
Write-Host "CPU ID: $cpuId"
Write-Host "MB Serial: $mbSerial"
Write-Host "Base String: $baseString"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($baseString)
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hash = $sha256.ComputeHash($bytes)
$hardwareId = [System.BitConverter]::ToString($hash) -replace '-',''
Write-Host "HardwareId: $hardwareId"
