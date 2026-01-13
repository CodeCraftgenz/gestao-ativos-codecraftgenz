@echo off
title Desinstalador do Overlay Agent
echo.
echo ========================================
echo  Desinstalador do Overlay Agent Service
echo ========================================
echo.

:: Verifica se está rodando como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERRO: Execute este desinstalador como Administrador!
    echo Clique com botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

:: Executa o script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0Uninstall-Service.ps1"

echo.
pause
