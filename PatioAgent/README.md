# PatioAgent - Agente de Controle de Maquinas

Agente Windows simplificado para o **Patio de Controle de Maquinas**.

## Funcionalidades

- **Boot/Shutdown**: Detecta quando a maquina liga e desliga
- **Login/Logout**: Rastreia sessoes de usuarios
- **Heartbeat**: Envia sinal de vida a cada 5 minutos
- **Enrollment**: Registro automatico com aprovacao pelo admin

## Requisitos

- Windows 10/11 ou Windows Server 2016+
- .NET 8.0 Runtime (incluido no pacote self-contained)
- Permissoes de administrador (para ler Security Event Log)

## Compilacao

```powershell
# Compilar para producao
dotnet publish -c Release -o ./publish

# Ou compilar single-file
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o ./publish
```

## Instalacao

1. Copie os arquivos compilados para `C:\Program Files\PatioAgent\`

2. Execute como administrador:
```powershell
.\install-service.ps1
```

3. O servico sera iniciado automaticamente

## Desinstalacao

```powershell
.\uninstall-service.ps1
```

## Configuracao

O agente conecta automaticamente ao servidor:
- URL padrao: `https://gestao-ativos-server.onrender.com`

A configuracao local e armazenada em:
- `%LOCALAPPDATA%\PatioAgent\agent.config` (criptografado com DPAPI)

Logs em:
- `%LOCALAPPDATA%\PatioAgent\logs\`

## Fluxo de Operacao

1. **Enrollment**: Na primeira execucao, o agente coleta informacoes do hardware e envia para o servidor
2. **Aguarda Aprovacao**: Se o admin configurou aprovacao manual, o agente aguarda
3. **Operacao Normal**: Apos aprovado:
   - Envia heartbeat a cada 5 minutos
   - Coleta eventos de boot/shutdown/login/logout a cada 10 minutos
   - Eventos sao lidos do Windows Event Log

## Eventos Coletados

| Evento | Event ID | Log |
|--------|----------|-----|
| Boot | 6005 | System |
| Shutdown | 6006, 6008 | System |
| Login | 4624 (tipo 2,10,11) | Security |
| Logout | 4634, 4647 | Security |

## Seguranca

- Tokens JWT armazenados com DPAPI (vinculado ao hardware)
- Comunicacao HTTPS com o servidor
- Apenas logins interativos sao reportados (tipo 2, 10, 11)
- Usuarios de sistema (SYSTEM, SERVICE, etc) sao ignorados

## Troubleshooting

### Servico nao inicia
- Verifique os logs em `%LOCALAPPDATA%\PatioAgent\logs\`
- Confirme que o executavel tem permissao de execucao

### Eventos de login nao aparecem
- O servico precisa rodar como SYSTEM ou admin local
- Verifique se a auditoria de logon esta habilitada no Windows

### Token revogado
- O dispositivo foi bloqueado no painel admin
- O agente tentara re-enrollment automaticamente

## Arquitetura

```
PatioAgent/
├── Program.cs           # Entry point
├── PatioWorker.cs       # Background service principal
├── Services/
│   ├── ApiClient.cs     # Cliente HTTP
│   ├── EnrollmentService.cs  # Registro de dispositivo
│   └── EventCollector.cs     # Coleta de eventos
└── Storage/
    └── LocalStorage.cs  # Armazenamento local seguro
```
