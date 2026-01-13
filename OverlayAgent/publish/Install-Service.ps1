# Install-Service.ps1
# Script para instalar o Overlay Agent como Windows Service
# Requer privilégios de Administrador

param(
    [string]$ServerUrl = "http://localhost:3000",
    [string]$ServiceName = "OverlayAgentService",
    [string]$DisplayName = "Overlay Agent Service",
    [string]$Description = "Agente de coleta de inventario e monitoramento de ativos"
)

# Verifica se está rodando como admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Este script requer privilegios de Administrador!"
    exit 1
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$exePath = Join-Path $scriptPath "OverlayAgent.Service.exe"

# Verifica se o executável existe
if (-not (Test-Path $exePath)) {
    Write-Error "Executavel nao encontrado: $exePath"
    exit 1
}

# Para e remove o serviço se já existir
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Servico existente encontrado. Removendo..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 2
}

# Atualiza o appsettings.json com a URL do servidor
$appsettingsPath = Join-Path $scriptPath "appsettings.json"
$appsettings = @{
    ServerUrl = $ServerUrl
    Logging = @{
        LogLevel = @{
            Default = "Information"
            Microsoft = "Warning"
        }
    }
}
$appsettings | ConvertTo-Json -Depth 3 | Set-Content $appsettingsPath -Encoding UTF8

Write-Host "Configuracao salva: ServerUrl = $ServerUrl"

# Cria o serviço Windows
Write-Host "Criando servico Windows..."
$result = New-Service -Name $ServiceName `
    -BinaryPathName $exePath `
    -DisplayName $DisplayName `
    -Description $Description `
    -StartupType Automatic `
    -ErrorAction Stop

# Configura recovery options (reiniciar em caso de falha)
sc.exe failure $ServiceName reset=86400 actions=restart/5000/restart/10000/restart/30000 | Out-Null

# Inicia o serviço
Write-Host "Iniciando servico..."
Start-Service -Name $ServiceName

# Verifica status
$service = Get-Service -Name $ServiceName
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Overlay Agent instalado com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nome do Servico: $ServiceName"
Write-Host "Status: $($service.Status)"
Write-Host "Servidor: $ServerUrl"
Write-Host ""
Write-Host "Use 'Get-Service $ServiceName' para verificar o status"
Write-Host "Use 'Stop-Service $ServiceName' para parar"
Write-Host "Use 'Start-Service $ServiceName' para iniciar"
