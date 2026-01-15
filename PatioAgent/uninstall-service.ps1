# Script de desinstalacao do PatioAgent
# Execute como Administrador

$ServiceName = "PatioAgent"

# Verifica se esta rodando como admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Execute este script como Administrador!"
    exit 1
}

$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-NOT $existingService) {
    Write-Host "Servico nao encontrado: $ServiceName"
    exit 0
}

Write-Host "Parando servico..."
Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Removendo servico..."
sc.exe delete $ServiceName

Write-Host ""
Write-Host "=== Servico Removido ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dados locais em: %LOCALAPPDATA%\PatioAgent\"
Write-Host "Para remover completamente, delete a pasta acima."
Write-Host ""
