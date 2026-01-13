# Uninstall-Service.ps1
# Script para desinstalar o Overlay Agent Service
# Requer privilégios de Administrador

param(
    [string]$ServiceName = "OverlayAgentService"
)

# Verifica se está rodando como admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Este script requer privilegios de Administrador!"
    exit 1
}

# Verifica se o serviço existe
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Servico '$ServiceName' nao encontrado."
    exit 0
}

Write-Host "Parando servico '$ServiceName'..."
Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removendo servico..."
sc.exe delete $ServiceName | Out-Null

# Limpa dados locais (opcional)
$localDataPath = Join-Path $env:LOCALAPPDATA "OverlayAgent"
if (Test-Path $localDataPath) {
    $response = Read-Host "Deseja remover os dados locais do agent? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Remove-Item -Path $localDataPath -Recurse -Force
        Write-Host "Dados locais removidos."
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host " Overlay Agent desinstalado com sucesso!" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
