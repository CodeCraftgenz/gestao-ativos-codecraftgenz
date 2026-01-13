@echo off
title Instalador do Overlay Agent
echo.
echo ========================================
echo   Instalador do Overlay Agent Service
echo ========================================
echo.

:: Verifica se está rodando como admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERRO: Execute este instalador como Administrador!
    echo Clique com botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

:: Solicita URL do servidor
set /p SERVER_URL="Digite a URL do servidor (ex: http://servidor:3000): "
if "%SERVER_URL%"=="" set SERVER_URL=http://localhost:3000

echo.
echo Instalando com servidor: %SERVER_URL%
echo.

:: Executa o script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0Install-Service.ps1" -ServerUrl "%SERVER_URL%"

echo.
pause
