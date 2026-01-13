; ============================================
; OverlayCraft + Agent - Instalador Combinado
; ============================================

#define MyAppName "OverlayCraft"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Sua Empresa"
#define MyAppURL "https://suaempresa.com.br"
#define MyAppExeName "OverlayCraft.exe"
#define MyServiceName "OverlayAgentService"

; Caminhos dos arquivos fonte (caminho absoluto)
#define OverlayCraftPath "C:\projetos\gestao-ativos-codecraft\OverlayCraft (3)\OverlayCraft\OverlayCraft\OverlayCraft\bin\Debug"
#define AgentPath "C:\projetos\gestao-ativos-codecraft\OverlayAgent\publish"

[Setup]
AppId={{B2C3D4E5-F6A7-8901-BCDE-F12345678901}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Diretorio de instalacao
DefaultDirName={autopf}\OverlayCraft
DefaultGroupName={#MyAppName}

; Arquivo de saida
OutputDir=..\installer-output
OutputBaseFilename=OverlayCraft_Setup_{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes

; Requisitos
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0

; Visual
WizardStyle=modern
WizardSizePercent=100

; Desinstalacao
UninstallDisplayName={#MyAppName}

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Messages]
brazilianportuguese.WelcomeLabel1=Bem-vindo ao Assistente de Instalacao do [name]
brazilianportuguese.WelcomeLabel2=Este assistente instalara o [name/ver] em seu computador.%n%nInclui o aplicativo OverlayCraft e o Agente de Gestao de Ativos.

[Types]
Name: "full"; Description: "Instalacao completa (recomendado)"
Name: "overlay"; Description: "Apenas OverlayCraft (sem agente)"
Name: "custom"; Description: "Instalacao personalizada"; Flags: iscustom

[Components]
Name: "overlaycraft"; Description: "OverlayCraft - Aplicativo Principal"; Types: full overlay custom; Flags: fixed
Name: "agent"; Description: "Agente de Gestao de Ativos"; Types: full custom

[Tasks]
Name: "desktopicon"; Description: "Criar icone na Area de Trabalho"; GroupDescription: "Icones adicionais:"
Name: "startupicon"; Description: "Iniciar OverlayCraft com o Windows"; GroupDescription: "Opcoes de inicializacao:"
Name: "startagent"; Description: "Iniciar Agente com o Windows (servico)"; GroupDescription: "Opcoes de inicializacao:"; Components: agent

[Files]
; ========== OVERLAYCRAFT ==========
Source: "{#OverlayCraftPath}\OverlayCraft.exe"; DestDir: "{app}"; Flags: ignoreversion; Components: overlaycraft
Source: "{#OverlayCraftPath}\OverlayCraft.exe.config"; DestDir: "{app}"; Flags: ignoreversion; Components: overlaycraft
Source: "{#OverlayCraftPath}\*.dll"; DestDir: "{app}"; Flags: ignoreversion; Components: overlaycraft
Source: "{#OverlayCraftPath}\*.xml"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist; Components: overlaycraft

; ========== AGENT ==========
Source: "{#AgentPath}\OverlayAgent.Service.exe"; DestDir: "{app}\Agent"; Flags: ignoreversion; Components: agent
Source: "{#AgentPath}\*.dll"; DestDir: "{app}\Agent"; Flags: ignoreversion skipifsourcedoesntexist; Components: agent

[Icons]
; Atalhos no Menu Iniciar
Name: "{group}\OverlayCraft"; Filename: "{app}\{#MyAppExeName}"; Components: overlaycraft
Name: "{group}\Desinstalar OverlayCraft"; Filename: "{uninstallexe}"

; Atalho na Area de Trabalho
Name: "{autodesktop}\OverlayCraft"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Components: overlaycraft

; Iniciar com Windows
Name: "{userstartup}\OverlayCraft"; Filename: "{app}\{#MyAppExeName}"; Tasks: startupicon; Components: overlaycraft

[Run]
; Instala o servico do Agent (se selecionado)
Filename: "sc.exe"; Parameters: "create {#MyServiceName} binPath= ""{app}\Agent\OverlayAgent.Service.exe"" start= auto DisplayName= ""Overlay Agent Service"""; Flags: runhidden waituntilterminated; Components: agent; Tasks: startagent
Filename: "sc.exe"; Parameters: "description {#MyServiceName} ""Agente de coleta de inventario e monitoramento de ativos"""; Flags: runhidden waituntilterminated; Components: agent; Tasks: startagent
Filename: "sc.exe"; Parameters: "failure {#MyServiceName} reset= 86400 actions= restart/5000/restart/10000/restart/30000"; Flags: runhidden waituntilterminated; Components: agent; Tasks: startagent
Filename: "sc.exe"; Parameters: "start {#MyServiceName}"; Flags: runhidden waituntilterminated; Components: agent; Tasks: startagent; StatusMsg: "Iniciando o servico do Agente..."

; Perguntar se quer executar o app apos instalar
Filename: "{app}\{#MyAppExeName}"; Description: "Executar OverlayCraft agora"; Flags: nowait postinstall skipifsilent; Components: overlaycraft

[UninstallRun]
; Para e remove o servico do Agent
Filename: "sc.exe"; Parameters: "stop {#MyServiceName}"; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "delete {#MyServiceName}"; Flags: runhidden waituntilterminated

[UninstallDelete]
; Remove dados locais do Agent
Type: filesandordirs; Name: "{localappdata}\OverlayAgent"

[Code]
var
  ServerURLPage: TInputQueryWizardPage;
  AgentSelected: Boolean;

procedure InitializeWizard();
begin
  // Cria pagina para solicitar URL do servidor (so aparece se Agent estiver selecionado)
  ServerURLPage := CreateInputQueryPage(wpSelectTasks,
    'Configuracao do Agente',
    'Digite a URL do servidor de Gestao de Ativos',
    'O agente enviara os dados de inventario para este servidor.');

  ServerURLPage.Add('URL do Servidor:', False);
  ServerURLPage.Values[0] := 'http://localhost:3000';
end;

function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;

  // Pula a pagina de URL se o Agent nao estiver selecionado
  if PageID = ServerURLPage.ID then
  begin
    Result := not IsComponentSelected('agent');
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  URL: String;
begin
  Result := True;

  if CurPageID = ServerURLPage.ID then
  begin
    URL := ServerURLPage.Values[0];

    if URL = '' then
    begin
      MsgBox('Por favor, digite a URL do servidor.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if (Pos('http://', URL) <> 1) and (Pos('https://', URL) <> 1) then
    begin
      MsgBox('A URL deve comecar com http:// ou https://', mbError, MB_OK);
      Result := False;
      Exit;
    end;
  end;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';

  // Para e remove o servico existente
  Exec('sc.exe', 'stop {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(2000);
  Exec('sc.exe', 'delete {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(1000);
end;

procedure SaveAgentConfig();
var
  ConfigFile: String;
  JsonContent: String;
begin
  if not IsComponentSelected('agent') then Exit;

  ConfigFile := ExpandConstant('{app}\Agent\appsettings.json');

  JsonContent := '{' + #13#10;
  JsonContent := JsonContent + '  "ServerUrl": "' + ServerURLPage.Values[0] + '",' + #13#10;
  JsonContent := JsonContent + '  "Logging": {' + #13#10;
  JsonContent := JsonContent + '    "LogLevel": {' + #13#10;
  JsonContent := JsonContent + '      "Default": "Information",' + #13#10;
  JsonContent := JsonContent + '      "Microsoft": "Warning"' + #13#10;
  JsonContent := JsonContent + '    }' + #13#10;
  JsonContent := JsonContent + '  }' + #13#10;
  JsonContent := JsonContent + '}';

  SaveStringToFile(ConfigFile, JsonContent, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    SaveAgentConfig();
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('sc.exe', 'stop {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(2000);
    Exec('sc.exe', 'delete {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(1000);
  end;
end;
