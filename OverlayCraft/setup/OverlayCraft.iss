[Setup]
AppName=OverlayCraft
AppVersion=1.0.0.0
AppPublisher=CodeCraft-GenZ
DefaultDirName={pf}\OverlayCraft
DefaultGroupName=OverlayCraft
OutputDir=..\dist\installer
OutputBaseFilename=OverlayCraft-Setup
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
SetupIconFile=..\Overlay.ico
ArchitecturesInstallIn64BitMode=x64
DisableDirPage=no
DisableReadyPage=no
DisableFinishedPage=no

[Files]
Source: "..\bin\Debug\OverlayCraft.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\bin\Debug\OverlayCraft.exe.config"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\bin\Debug\*.dll"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs
Source: "..\bin\Debug\*.xml"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\OverlayCraft"; Filename: "{app}\OverlayCraft.exe"; WorkingDir: "{app}"
Name: "{commondesktop}\OverlayCraft"; Filename: "{app}\OverlayCraft.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na área de trabalho"; GroupDescription: "Tarefas adicionais:"; Flags: unchecked

[Run]
Filename: "{app}\OverlayCraft.exe"; Description: "Executar OverlayCraft"; Flags: nowait postinstall skipifsilent

