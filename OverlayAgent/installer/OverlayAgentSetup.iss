; ============================================
; Overlay Agent - Inno Setup Script
; ============================================

#define MyAppName "Overlay Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Sua Empresa"
#define MyAppURL "https://suaempresa.com.br"
#define MyAppExeName "OverlayAgent.Service.exe"
#define MyServiceName "OverlayAgentService"

[Setup]
; Informacoes basicas
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Diretorio de instalacao
DefaultDirName={autopf}\OverlayAgent
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Arquivo de saida
OutputDir=..\installer-output
OutputBaseFilename=OverlayAgent_Setup_{#MyAppVersion}
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
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Messages]
brazilianportuguese.WelcomeLabel1=Bem-vindo ao Assistente de Instalacao do [name]
brazilianportuguese.WelcomeLabel2=Este assistente instalara o [name/ver] em seu computador.%n%nO agente coletara informacoes de inventario e enviara para o servidor central de gestao de ativos.

[Types]
Name: "full"; Description: "Instalacao completa"
Name: "custom"; Description: "Instalacao personalizada"; Flags: iscustom

[Components]
Name: "main"; Description: "Arquivos do Agente"; Types: full custom; Flags: fixed

[Files]
; Arquivos principais
Source: "..\publish\OverlayAgent.Service.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\publish\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\publish\*.pdb"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Run]
; Instala e inicia o servico apos a instalacao
Filename: "sc.exe"; Parameters: "create {#MyServiceName} binPath= ""{app}\{#MyAppExeName}"" start= auto DisplayName= ""Overlay Agent Service"""; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "description {#MyServiceName} ""Agente de coleta de inventario e monitoramento de ativos"""; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "failure {#MyServiceName} reset= 86400 actions= restart/5000/restart/10000/restart/30000"; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "start {#MyServiceName}"; Flags: runhidden waituntilterminated; StatusMsg: "Iniciando o servico..."

[UninstallRun]
; Para e remove o servico antes de desinstalar
Filename: "sc.exe"; Parameters: "stop {#MyServiceName}"; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "delete {#MyServiceName}"; Flags: runhidden waituntilterminated

[UninstallDelete]
; Remove dados locais na desinstalacao (opcional)
Type: filesandordirs; Name: "{localappdata}\OverlayAgent"

[Code]
var
  ServerURLPage: TInputQueryWizardPage;

procedure InitializeWizard();
begin
  // Cria pagina para solicitar URL do servidor
  ServerURLPage := CreateInputQueryPage(wpSelectDir,
    'Configuracao do Servidor',
    'Digite a URL do servidor de Gestao de Ativos',
    'O agente enviara os dados de inventario para este servidor.');

  ServerURLPage.Add('URL do Servidor:', False);
  ServerURLPage.Values[0] := 'http://localhost:3000';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  URL: String;
begin
  Result := True;

  if CurPageID = ServerURLPage.ID then
  begin
    URL := ServerURLPage.Values[0];

    // Valida URL
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

  // Para o servico se ja existir
  Exec('sc.exe', 'stop {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(2000);

  // Remove o servico se ja existir
  Exec('sc.exe', 'delete {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(1000);
end;

procedure SaveConfigFile();
var
  ConfigFile: String;
  JsonContent: String;
begin
  ConfigFile := ExpandConstant('{app}\appsettings.json');

  // Cria o conteudo JSON
  JsonContent := '{' + #13#10;
  JsonContent := JsonContent + '  "ServerUrl": "' + ServerURLPage.Values[0] + '",' + #13#10;
  JsonContent := JsonContent + '  "Logging": {' + #13#10;
  JsonContent := JsonContent + '    "LogLevel": {' + #13#10;
  JsonContent := JsonContent + '      "Default": "Information",' + #13#10;
  JsonContent := JsonContent + '      "Microsoft": "Warning"' + #13#10;
  JsonContent := JsonContent + '    }' + #13#10;
  JsonContent := JsonContent + '  }' + #13#10;
  JsonContent := JsonContent + '}';

  // Salva o arquivo
  SaveStringToFile(ConfigFile, JsonContent, False);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Salva o arquivo de configuracao apos copiar os arquivos
    SaveConfigFile();
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    // Para o servico
    Exec('sc.exe', 'stop {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(2000);

    // Remove o servico
    Exec('sc.exe', 'delete {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(1000);
  end;
end;
