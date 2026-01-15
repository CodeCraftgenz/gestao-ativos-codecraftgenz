; Inno Setup Script for PatioAgent
; Patio de Controle - Agente Windows

#define MyAppName "PatioAgent"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "CodeCraft"
#define MyAppExeName "PatioAgent.exe"
#define MyAppDescription "Agente de monitoramento para controle de maquinas"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-PATIOAGENT01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=PatioAgent-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
LicenseFile=..\LICENSE.txt

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Executavel principal e dependencias
Source: "..\PatioAgent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\*.json"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "..\*.pdb"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

[Run]
; Instala como servico Windows apos instalacao
Filename: "sc.exe"; Parameters: "create PatioAgent binPath= ""{app}\{#MyAppExeName}"" start= auto DisplayName= ""Patio de Controle - Agent"""; Flags: runhidden waituntilterminated; StatusMsg: "Registrando servico..."
Filename: "sc.exe"; Parameters: "description PatioAgent ""Agente de monitoramento para controle de maquinas (boot/shutdown/login)"""; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "failure PatioAgent reset= 86400 actions= restart/60000/restart/60000/restart/60000"; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "start PatioAgent"; Flags: runhidden waituntilterminated; StatusMsg: "Iniciando servico..."

[UninstallRun]
; Para e remove o servico antes de desinstalar
Filename: "sc.exe"; Parameters: "stop PatioAgent"; Flags: runhidden waituntilterminated
Filename: "sc.exe"; Parameters: "delete PatioAgent"; Flags: runhidden waituntilterminated

[Code]
// Verifica se o servico ja existe e para antes de instalar
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  LocalAppData: String;
begin
  Result := '';

  // Para e remove servicos antigos
  Exec('sc.exe', 'stop PatioAgent', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('sc.exe', 'stop OverlayAgent', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(2000);
  Exec('sc.exe', 'delete PatioAgent', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('sc.exe', 'delete OverlayAgent', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(1000);

  // Remove dados antigos
  LocalAppData := ExpandConstant('{localappdata}');
  DelTree(LocalAppData + '\PatioAgent', True, True, True);
  DelTree(LocalAppData + '\OverlayAgent', True, True, True);
end;

// Mensagem de conclusao
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    MsgBox('PatioAgent instalado com sucesso!' + #13#10 + #13#10 +
           'O servico foi iniciado automaticamente.' + #13#10 +
           'Logs em: %LOCALAPPDATA%\PatioAgent\logs\', mbInformation, MB_OK);
  end;
end;
