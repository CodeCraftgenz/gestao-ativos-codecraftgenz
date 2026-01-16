# ============================================================================
# Script de Limpeza Completa - PatioAgent e OverlayAgent
# Execute como Administrador!
# ============================================================================

Write-Host "=== LIMPEZA COMPLETA DE AGENTES ===" -ForegroundColor Cyan
Write-Host ""

# 1. Parar servicos
Write-Host "[1/7] Parando servicos..." -ForegroundColor Yellow
$services = @("PatioAgent", "OverlayAgent")
foreach ($svc in $services) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "  Parando $svc..." -ForegroundColor Gray
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# 2. Remover servicos
Write-Host "[2/7] Removendo servicos do Windows..." -ForegroundColor Yellow
foreach ($svc in $services) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "  Removendo $svc..." -ForegroundColor Gray
        sc.exe delete $svc 2>$null
    }
}
Start-Sleep -Seconds 1

# 3. Limpar LocalAppData do usuario atual
Write-Host "[3/7] Limpando LocalAppData do usuario atual..." -ForegroundColor Yellow
$userLocalAppData = $env:LOCALAPPDATA
$foldersToClean = @("PatioAgent", "OverlayAgent", "OverlayCraft")
foreach ($folder in $foldersToClean) {
    $path = Join-Path $userLocalAppData $folder
    if (Test-Path $path) {
        Write-Host "  Removendo $path" -ForegroundColor Gray
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 4. Limpar ProgramData
Write-Host "[4/7] Limpando ProgramData..." -ForegroundColor Yellow
$programData = $env:ProgramData
foreach ($folder in $foldersToClean) {
    $path = Join-Path $programData $folder
    if (Test-Path $path) {
        Write-Host "  Removendo $path" -ForegroundColor Gray
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 5. Limpar perfil SYSTEM (onde o servico grava logs)
Write-Host "[5/7] Limpando perfil SYSTEM..." -ForegroundColor Yellow
$systemProfile = "C:\Windows\System32\config\systemprofile\AppData\Local"
foreach ($folder in $foldersToClean) {
    $path = Join-Path $systemProfile $folder
    if (Test-Path $path) {
        Write-Host "  Removendo $path" -ForegroundColor Gray
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 6. Remover de Program Files
Write-Host "[6/7] Removendo de Program Files..." -ForegroundColor Yellow
$programFiles = @($env:ProgramFiles, ${env:ProgramFiles(x86)})
foreach ($pf in $programFiles) {
    if ($pf) {
        foreach ($folder in $foldersToClean) {
            $path = Join-Path $pf $folder
            if (Test-Path $path) {
                Write-Host "  Removendo $path" -ForegroundColor Gray
                Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# 7. Verificar outros usuarios
Write-Host "[7/7] Verificando outros perfis de usuario..." -ForegroundColor Yellow
$usersPath = "C:\Users"
$userFolders = Get-ChildItem -Path $usersPath -Directory -ErrorAction SilentlyContinue
foreach ($userFolder in $userFolders) {
    $localAppData = Join-Path $userFolder.FullName "AppData\Local"
    foreach ($folder in $foldersToClean) {
        $path = Join-Path $localAppData $folder
        if (Test-Path $path) {
            Write-Host "  Removendo $path" -ForegroundColor Gray
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host ""
Write-Host "=== LIMPEZA CONCLUIDA ===" -ForegroundColor Green
Write-Host ""

# Verificar se ainda existe algo
Write-Host "Verificando se restou algum arquivo..." -ForegroundColor Yellow
$remainingServices = @()
foreach ($svc in $services) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        $remainingServices += $svc
    }
}

if ($remainingServices.Count -gt 0) {
    Write-Host "  AVISO: Servicos ainda existem: $($remainingServices -join ', ')" -ForegroundColor Red
    Write-Host "  Reinicie o computador e execute novamente." -ForegroundColor Red
} else {
    Write-Host "  Todos os servicos foram removidos." -ForegroundColor Green
}

# Verificar pastas
$remainingFolders = @()
$allPaths = @(
    "$env:LOCALAPPDATA\PatioAgent",
    "$env:LOCALAPPDATA\OverlayAgent",
    "$env:LOCALAPPDATA\OverlayCraft",
    "$env:ProgramData\PatioAgent",
    "$env:ProgramData\OverlayAgent",
    "$env:ProgramFiles\PatioAgent",
    "$env:ProgramFiles\OverlayAgent",
    "$env:ProgramFiles\OverlayCraft",
    "C:\Windows\System32\config\systemprofile\AppData\Local\PatioAgent",
    "C:\Windows\System32\config\systemprofile\AppData\Local\OverlayAgent"
)

foreach ($path in $allPaths) {
    if (Test-Path $path) {
        $remainingFolders += $path
    }
}

if ($remainingFolders.Count -gt 0) {
    Write-Host "  AVISO: Pastas ainda existem:" -ForegroundColor Red
    foreach ($folder in $remainingFolders) {
        Write-Host "    - $folder" -ForegroundColor Red
    }
} else {
    Write-Host "  Todas as pastas foram removidas." -ForegroundColor Green
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
