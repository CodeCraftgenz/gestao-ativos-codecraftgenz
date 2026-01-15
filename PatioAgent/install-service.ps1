# Script de instalacao do PatioAgent como servico Windows
# Execute como Administrador

$ServiceName = "PatioAgent"
$DisplayName = "Patio de Controle - Agent"
$Description = "Agente de monitoramento para controle de maquinas (boot/shutdown/login)"
$ExePath = "$PSScriptRoot\PatioAgent.exe"

# Verifica se esta rodando como admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Execute este script como Administrador!"
    exit 1
}

# Verifica se o executavel existe
if (-NOT (Test-Path $ExePath)) {
    Write-Error "Executavel nao encontrado: $ExePath"
    Write-Host "Execute primeiro: dotnet publish -c Release -o ."
    exit 1
}

# Para o servico se estiver rodando
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Parando servico existente..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    Write-Host "Removendo servico existente..."
    sc.exe delete $ServiceName
    Start-Sleep -Seconds 2
}

# Cria o servico
Write-Host "Criando servico..."
New-Service -Name $ServiceName `
    -BinaryPathName $ExePath `
    -DisplayName $DisplayName `
    -Description $Description `
    -StartupType Automatic

# Configura recuperacao (reinicia em caso de falha)
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000

# Inicia o servico
Write-Host "Iniciando servico..."
Start-Service -Name $ServiceName

# Verifica status
$service = Get-Service -Name $ServiceName
Write-Host ""
Write-Host "=== Servico Instalado ===" -ForegroundColor Green
Write-Host "Nome: $($service.Name)"
Write-Host "Status: $($service.Status)"
Write-Host "Startup: $($service.StartType)"
Write-Host ""
Write-Host "Logs em: %LOCALAPPDATA%\PatioAgent\logs\"
Write-Host ""
