# Windows-Releaseoutput erzeugen und prüfen

Stand: 2026-09-04

## Zweck

Dieses Runbook erzeugt den installerneutralen NETGRID-Produktoutput und kann
ihn anschließend in das Windows-MSI und den geführten Setup-Host verpacken.
Der Build selbst verändert keine Windows-Dienste, Firewallregeln oder lokalen
Hauptinstanzen; erst eine bestätigte erhöhte Installation konfiguriert das
gewählte Zielsystem.

## Voraussetzungen

- Windows x64 mit der im Workspace verwendeten Node-24-Laufzeit;
- installierte Workspace-Abhängigkeiten;
- sauber klassifizierte Produktdaten gemäß
  `docs/architecture/windows/windows-release-boundary.md`.

## Schnelle Vertragsprüfung

```powershell
corepack pnpm check:release-boundary:selftest
corepack pnpm check:release-boundary
corepack pnpm check:release-card-index
corepack pnpm check:windows-release-output:selftest
```

## Output bauen

```powershell
corepack pnpm build:windows-release-output
```

Der Befehl erzeugt und auditiert `output/windows-release`. Das Verzeichnis ist
ein wegwerfbares Buildartefakt und wird nicht versioniert. Ein nachträglich
verändertes Artefakt erneut prüfen mit:

```powershell
corepack pnpm check:windows-release-output
```

Ein grüner Audit bestätigt positive Pfade, Manifestvollständigkeit, Hashes,
Windows-Sharp-Runtime und das Fehlen verbotener Daten. Er ist noch kein
Codesigning- oder Installer-Nachweis.

## Installer bauen und prüfen

Die Toolchain ist auf .NET SDK 10.0.302 und WiX Toolset 7.0.0 festgelegt. WiX
7 wird unter der bestätigten OSMF-EULA verwendet. Auf einem Buildrechner mit
dem gepinnten SDK genügt:

```powershell
corepack pnpm build:windows-installer
```

Der Befehl baut und auditiert zuerst `output/windows-release`, erzeugt das
Runtime-Lizenzinventar und schreibt danach MSI, Setup, Release-Metadaten und
SHA-256-Prüfsummen nach `output/windows-installer`. Für eine erneute
Paketierung eines unveränderten, bereits geprüften Outputs kann diagnostisch
`scripts/build-windows-installer.ps1 -SkipReleaseBuild` verwendet werden.

Die MSI-Lifecycle-Komponente wird separat mit exakt gepinntem WiX DTF 7.0.0
und Locked Restore gebaut. Sie wird nicht als Programmdatei installiert,
sondern im MSI-Binary-Stream ausgeführt. Der Installer-Audit prüft ihre
64-Bit-Architektur, vier exportierte Einstiegspunkte, den eingebetteten Hash
und die tatsächlichen MSI-Sequenznummern einschließlich Commit-/Rollback-
Typflags.
Zusätzlich wird die innere CAB-Payload der Lifecycle-Binary auf genau drei
erlaubte Dateien und identische Buildinput-Hashes geprüft; Quellen und
Debugsymbole sind auch dort verboten.

Die Framework-LaunchCondition wird zusätzlich mit dem echten MSI-Auswerter
in einer isolierten Paketsitzung geprüft. Die fünf Fälle berücksichtigen
das `#`-Präfix roher Registry-DWORD-Werte. Dabei wird keine Installation
oder MSI-Aktion ausgeführt; eine alleinige Quelltextprüfung reicht dafür
nicht aus.

Eng begrenzte Prüfungen ohne Installation:

Die gemeinsame `InstallationLaunchFence` schützt die letzte Gateprüfung samt
Kindstart gegen gleichzeitigen MSI-/Updater-Lease-Erwerb. Das Lifecycle-Gate
prüft dafür echte Prozesskonkurrenz, Rechte und Fehlerpfade ausschließlich
mit eigenen Fixtures. `installation_gate_launch_fence_timeout`,
`installation_gate_launch_fence_abandoned` und
`installation_gate_launch_fence_open_failed` sind abbrechende Diagnosen;
vorhandene Installersperren werden dabei nicht automatisch gelöscht.
Launcher- und First-Run-Gates prüfen zusätzlich ihre tatsächliche letzte
Startstelle. Ein grünes Ergebnis ist keine native Freigabe direkter MSI-
Updates bei laufenden Spielen und kein erhöhtes Mehrbenutzer-Testat.

Direkte MSI-Versionswechsel verwenden inzwischen die gebundene
`preparing-msi`-Anforderung an den ursprünglichen Launcher. Ohne Launcher
läuft `storage-admin.mjs update-readiness` unter der Installersperre als reine
SQLite-Leseprüfung. `installation_gate_active_games` bricht vor Dateiaustausch
ab und erhält bei erfolgreicher Preparation-Absage den laufenden Launcher.
`installation_gate_readiness_*` und `installation_gate_msi_*` sind keine
Freigabe zur manuellen Sperrentfernung. Die eigentliche Nativevidence muss
beide Wege, Absage, Verbindungsende und Prozessstopp getrennt nachweisen.

`installation_gate_protocol_unsupported` weist einen installierten Stand ohne
`InstallerLifecycleProtocol=msi-data-v1` vor der neuen Sperrphase ab.
Alte Testbuilds dürfen deshalb nicht als Basis der neuen Zwei-Versionen-
Matrix verwendet werden. `installation_gate_upgrade_root_changed` verhindert
einen stillen Ordnerwechsel. Gleiche-Version-Reparatur ohne aktive Runtime
muss auch bei fehlender Node-/CLI-Datei möglich bleiben; sie verwendet nicht
den Offline-Versionswechselcheck. Für einen vollständigen Releaseabschluss
ist neben diesen Komponententests insbesondere die Backup-/Health-/Restore-
Absicherung direkter MSI-Versionswechsel noch offen.

Der Updater verwendet nun `UpdateDataSnapshot` für den vollständigen
Live-Datenroot; der alte Storage-CLI-Befehl `backup-update` ist weiterhin nur
ein Match-SQLite-Backup und nicht mehr seine Sicherungsautorität. Die neuen
Archive liegen geschützt unter `config/update-backups/<ID>`. Historische
Storagebackups und Installer-Caches sind ausdrücklich ausgeschlossen.
Konfiguration und vorhandene Maintenance-Credentials werden nur auf
Unverändertheit geprüft, niemals zurückgeschrieben. Vor einem Restore wird
auch der fehlgeschlagene Datenstand separat gesichert. Genau entfernte neue
Dateien sind dort wiederauffindbar; Archive werden nicht automatisch gelöscht.

Enger, in der Installer-Buildstrecke gebundener Regressionstest:

```powershell
.\.tools\dotnet\dotnet.exe run --project tests/windows/Netgrid.UpdateData.Tests/Netgrid.UpdateData.Tests.csproj -c Release
```

Die Prüfung nutzt ausschließlich eigene temporäre Dateien mit einer expliziten
Fixture-DACL. Sie prüft unter anderem zwei echte SQLite-Dateien samt WAL,
beschädigte Daten, Pfadgrenzen, Hardlinks/Junctions, parallele Schreiber,
veränderte Backups, wiederhergestellte DACLs und unveränderte Credentials.
Sie beweist noch keine tatsächlich erhöhte Archivbereitstellung oder native
MSI-Transaktion. Das Wiederöffnen eines gebundenen Archivs nach dem Ende seines
Erzeugerprozesses ist inzwischen ebenfalls geprüft: Manifestversion 2,
gespeicherte Prüfsumme, Pfad-/ACL-Grenzen und unveränderte Credentials bleiben
Pflicht. Der aktive Updater bezieht die Referenz aus dem geschützten
`Recovery`-Wert seiner Installationslease und verwendet diesen Weg auch im
normalen Rollback. Ein Archiv darf seine eigene Prüfsumme nicht als
Wiederherstellungsfreigabe liefern. Das vorherige Setup liegt zusätzlich
prüfsummengebunden im Snapshot, unabhängig vom inzwischen ersetzten Cache.
Der explizite Reparatureinstieg ist komponentenweise implementiert; seine
native erhöhte Abnahme bleibt offen. Direkte MSI-Versionswechsel verwenden
inzwischen ebenfalls Snapshot, gebundene Prüfung und Datenrestore; die
vollständige native Transaktion ist noch nicht abgenommen.
Archive nicht manuell in eine laufende Runtime
kopieren; insbesondere darf dabei kein Credentialstore überschrieben werden.

Der direkte MSI-Pfad ruft den installierten Updater ausschließlich synchron
für `capture`, `verify` und bei Rollback `restore` auf. Diese internen
`--msi-data`-Befehle sind keine manuelle Reparaturfreigabe. Der geschützte
`MsiData`-Wert im Lifecycle-Key bindet Programmtransaktion, ProductCode,
Datenroot, Snapshot und Prüfergebnis; Commit und Rollback verweigern die
Freigabe ohne passenden Nachweis. Ein Timeout beendet keinen schreibenden
Helper gewaltsam. Bleibt eine Helper-/MSI-Bindung nach Prozessverlust zurück,
müssen Ursache und tatsächlicher MSI-Zustand geprüft werden; nicht manuell
Registrywerte entfernen oder die normale Absturzreparatur erzwingen.

Die reale MSI-Sequenz lässt sich ohne Installation prüfen:

```powershell
.\scripts\test-windows-msi-authoring.ps1
```

Voraussetzungen sind der aktuell gebaute DTF-Wrapper und die lokalen
Installer-Lizenzinputs. Das Script baut mit WiX 7 eine eindeutig als
`AUTHORING-PROBE-NOT-FOR-INSTALL.msi` benannte Fixture mit inerten
Ersatzdateien und prüft die echten MSI-Tabellen read-only. Es startet keine
Installation und ist weder ein Produktoutput noch ein auszulieferndes Artefakt.
Die Prüfung muss `RemoveExistingProducts < VerifyNetgridLifecycle <
InstallFinalize` sowie fünf korrekt gebundene Lifecycle-Exporte nachweisen.

Für die kontrollierte Reparatur eines abgebrochenen Updater-Laufs lautet der
Einstieg bei Standardinstallation:

```powershell
& 'C:\Program Files\NETGRID\NETGRID.Updater.exe' --repair-update --program-root 'C:\Program Files\NETGRID'
```

Bei einem eigenen Installationsordner müssen beide Pfade auf diese registrierte
Installation zeigen. Dies ist kein allgemeiner MSI-Reparaturbefehl. Der Einstieg
fragt ausdrücklich nach Zustimmung und fordert Windows-Administratorrechte
an. Eine noch laufende Update-Instanz, eine gebundene MSI-Teiltransaktion,
verbleibende Produktprozesse oder ein unvollständiges/verändertes Archiv
verhindern die Reparatur. Registry-Sperren nicht manuell löschen. Der erhöhte
Helfer stellt die gebundene Vorversion und Daten wieder her und prüft sie vor
der Freigabe. Erst nach der Erfolgsmeldung NETGRID über die normale Verknüpfung
starten; der Helfer startet keine Administrator-Runtime. Diese native
Gesamtstrecke ist noch nicht als Release-Nachweis abgenommen.

Die Deckbibliothek liegt im Releaseprofil nun unter
`NETGRID_DATA_ROOT/runtime/decks`; ein expliziter Bibliothekspfad muss innerhalb
dieses Roots liegen. `APPDATA` entscheidet nur weiterhin über die bisherige
Entwicklungsablage. Der fokussierte Test
`corepack pnpm --filter @netgrid/web exec vitest run app/api/decks/library-store.test.ts --maxWorkers=1`
prüft auch tatsächliches Lesen und Schreiben ohne Import oder Änderung von
Entwicklungsdecks. Das ersetzt weder einen neuen Payload-Build noch das offene
vollständige Backup-/Restore-Gate.

```powershell
.\.tools\dotnet\dotnet.exe run --project tests/windows/Netgrid.InstallerLifecycle.Tests/Netgrid.InstallerLifecycle.Tests.csproj -c Release
.\.tools\dotnet\dotnet.exe run --project tests/windows/Netgrid.Launcher.Tests/Netgrid.Launcher.Tests.csproj -c Release -- --check-installation-stop
.\scripts\check-windows-msi-lifecycle.ps1 -MsiPath <konkretes-geprüftes-MSI>
```

Der erste Test verwendet nur einen eindeutig eigenen HKCU-Fixture-Key und
verifiziert dessen Entfernung. Keiner dieser Checks ersetzt den nativen
Uninstall-Test bei laufendem Launcher. Eine aktive Installersperre in HKLM
wird bei Diagnose nicht pauschal gelöscht; Eigentümer, MSI-Endzustand und
Produktprozesse müssen zuerst geklärt werden.

Der Installer-Audit extrahiert das MSI über Windows Installer in einen bewusst
kurzen temporären Pfad, vergleicht jede Produktdatei gegen das Manifest und
prüft das im Setup-Host eingebettete MSI anhand seines Hashes. Der Host gibt
außerdem seinen maschinenlesbaren Führungsvertrag für den Audit aus, und die
Prüfung belegt die Erkennung eines real belegten Loopbackports. WiX 7 schreibt aktuell
nicht steuerbare Paketcodes und Zeitfelder; wiederholte Builds sind deshalb
inhaltlich und über Manifest/Prüfsummen verifizierbar, aber nicht
byteidentisch (siehe [WiX-Issue #8978](https://github.com/wixtoolset/issues/issues/8978)). Release-Metadaten müssen für eine Veröffentlichung
`sourceDirty: false` ausweisen.

Die Laufzeitmaterialisierung lädt das fest konfigurierte offizielle
Node.js-24-x64-Archiv nur bei fehlendem lokalen Cache unter `.tools/downloads`,
prüft dessen SHA-256 und übernimmt ausschließlich `node.exe` und die
Node-Lizenz. Die selbstenthaltene .NET-Runtimekonfiguration und ihre
Rechtstexte entstehen im selben Build. Ein Netzwerk- oder Hashfehler stoppt
die Paketierung; es gibt keinen Ersatzdownload.

Der direkt ausführbare Datenvertragstest setzt voraus, dass der Installerinput
bereits gebaut wurde:

```powershell
corepack pnpm test:windows-runtime-config
```

Er verwendet ausschließlich einen temporären Datenroot. Geprüft werden
atomare Secret-Erzeugung, bytegleicher Repair, Benutzerrechte für veränderliche
Daten, Schreibschutz der Konfiguration sowie das fail-closed Verhalten bei
UNC-Pfaden, Pfadüberlappung und ungültigem vorhandenem Secret. Die erhöhte
echte Install-/Repair-/Uninstall-Matrix folgt im Windows-11-Releasegate.

## Launcher isoliert prüfen

Der reale CLR-Einstieg des Launchers ist ein synchrones `[STAThread] Main`.
Er übergibt an den bestehenden asynchronen Ablauf; der interaktive Zweig
erreicht `Application.Run` ohne vorheriges `await`. Ein direktes `async Main`
ist hier nicht zulässig: Beim nachgewiesenen Build trug dessen generierter
`<Main>`-Einstieg kein STA-Attribut. Der Regressionstest prüft deshalb
`Assembly.EntryPoint`, nicht nur den sichtbaren C#-Quelltext. Windows-
Dateidialoge und andere COM-Oberflächen benötigen den
[STA-Vertrag am tatsächlichen Einstieg](https://learn.microsoft.com/en-us/dotnet/api/system.stathreadattribute?view=net-10.0).
Headless-Smokes bleiben asynchron; der synchrone Einstieg ersetzt keine
native Prüfung des Diagnose-Speicherdialogs.

Nach gebautem Release- und Installerinput startet folgender Befehl einen
vollständigen installierten Produktbaum auf zwei freien Nichtstandardports und
einem temporären Datenroot:

```powershell
corepack pnpm smoke:windows-launcher
```

Der Test startet Server und Webclient ausschließlich über `NETGRID.exe`,
prüft beide Healthflächen, beendet den Webprozess zweimal kontrolliert für den
einmaligen Recoveryvertrag und fordert beim Server den stdin-Shutdown an.
SQLite-Anlage, der geordnete Stoppeintrag und geschlossene Ports werden vor
dem Entfernen der temporären Daten geprüft. Die Standardports und die
Hauptinstanz bleiben unangetastet.

## Isolierten Frischstart prüfen

```powershell
corepack pnpm smoke:windows-release-output
```

Der Smoke verwendet automatisch zwei freie Nichtstandardports und einen
frischen temporären `NETGRID_DATA_ROOT`. Er baut ein separates Artefakt,
startet ausschließlich dessen Prozesse und prüft:

- SQLite-Health und Anlage der Datenbank außerhalb des Produktbaums;
- Start der Weboberfläche;
- Kartenkatalog ohne `testset`;
- Deckendpunkte ohne Demo-Snapshots;
- nicht verfügbare Tutorial-Testfläche;
- eine produktive KI-vs-KI-Simulation mit StateHash.

Eigene Prozesse, temporärer Output und Datenroot werden anschließend
entfernt. Die Standardports `3100` und `8787` sowie die Daten der
Hauptinstanz bleiben unangetastet.

## Geführtes Setup

`NETGRID-Setup-<Version>-x64.exe` bietet „Voreingestellte Werte verwenden“ und
„Benutzerdefinierte Installation“. Local/LAN, Desktopverknüpfung und Start nach Abschluss
sind sichtbar; im benutzerdefinierten Weg kommen Pfade, Ports,
Spielaufbewahrung und die Wahl zwischen einfachem und geschütztem
Spielerprofilmodus hinzu. Erst „Installieren“ fordert Windows-Administratorrechte
an. Der Hinweis unterscheidet diese Windows-Freigabe ausdrücklich vom separaten
Passwort für die NETGRID-Verwaltung; der First-Run-Dialog fordert ein neues
NETGRID-Passwort an, nicht das Windows-Passwort.
Das Setup übergibt ausschließlich nicht geheime, validierte MSI-Eigenschaften.

Private-LAN-Installationen benötigen eine erkannte private IPv4-Adresse. Die
Spielports werden ausschließlich im Windows-Netzwerkprofil „Privat“ geöffnet;
Maintenance und Launcher-Health bleiben Loopback-only. Der Standard ist lokal,
und LAN wird nie still aktiviert. Die vollständige erhöhte Firewall- und
Installationsmatrix folgt im WIN-I08-Releasegate.

Nach erfolgreicher MSI-Installation startet `NETGRID.FirstRun.exe`. Zuerst
fragt der Dialog, ob die NETGRID-Verwaltung jetzt eingerichtet werden soll.
Nur „Jetzt einrichten“ öffnet die Passwortfelder. Dort stehen „Zurück“ und
„Einrichtung abschließen“, nicht mehr „Später“. „Zurück“ leert und verdeckt
beide Eingaben und führt zur ersten Entscheidung zurück. Das
Maintenance-Passwort wird im zweiten Schritt zweimal verdeckt eingegeben und ausschließlich
über eine lokale stdin-Pipe an `app/maintenance-auth.mjs` übergeben. „Später“
lässt die Spieloberfläche nutzbar, während Maintenance gesperrt bleibt; die
Ersteinrichtung kann über den gleichnamigen Startmenüeintrag erneut geöffnet
werden. Ein vorhandenes Credential wird weder zurückgesetzt noch ersetzt.
Beide Passwortfelder besitzen getrennte Augen-Schaltflächen mit lokalisierten
„Anzeigen“-/„Verbergen“-Aktionen. Standardmäßig, beim Verlassen des Dialogs
und vor dem Abschicken sind beide Eingaben verdeckt. Die Umschaltung verändert
weder den Eingabetext noch den sicheren Bootstrapweg. Im ersten Schritt erklärt
„Später“, dass noch kein Passwort eingerichtet wird und Maintenance gesperrt
bleibt, und nennt den sprachabhängigen Startmenüeintrag zum Nachholen.
Die Ansicht selbst startet keine Runtime; der interaktive Programmeinstieg
bindet die Initialisierung an das geöffnete Fenster. Dadurch prüfen die
UI-Komponententests Darstellung und Umschaltung ohne installierte Runtime
oder Zugriff auf echte Credentials.

## Installationsvertrag für die nächsten Pakete

Der Installer erhält ausschließlich den erfolgreich auditierten Ordner
`output/windows-release`. Er liest `product-layout.json`, verifiziert vor dem
Paketieren `product-manifest.json` und erzeugt aus
`config/runtime.env.example` eine reale, geschützte Konfiguration. Der
Platzhalter `NETGRID_TOKEN_SALT` darf nie unverändert übernommen werden.

Der vorgesehene Datenroot ist `C:\ProgramData\NETGRID`. Das
Installationsverzeichnis und der Datenroot dürfen nicht identisch sein. Eine
bestehende Entwicklungsdatenbank wird nicht importiert. Falls später eine
Produktdatenmigration erforderlich wird, braucht sie einen eigenen
versionierten Vertrag und einen expliziten Upgrade-Test.

## Übergabe an Installer und spätere Veröffentlichung

Der aktuelle Output wird ausschließlich über GitHub Releases bereitgestellt. Das
Release enthält mindestens Version, Änderungshinweise, Installerdatei und
Prüfsumme. Zielverhalten und Paketfolge für Installer, Launcher und den
zustimmungsbasierten GitHub-Updater sind in
`../architecture/windows/windows-installer-product-contract.md` und
`../architecture/windows/windows-installer-package-process.md` festgelegt.
Der Launcher prüft diesen Kanal beim Start; Download und Upgrade beginnen erst
nach ausdrücklicher Zustimmung und erfolgreicher Integritätsprüfung.

## Fehlerdiagnose

Die echte Windows-Installationsprüfung läuft über
`corepack pnpm test:windows-installer:e2e`. Sie benötigt eine bestätigte
Windows-UAC-Abfrage und zwei zuvor gebaute, prüfsummengebundene Artefaktsätze.
`output/windows-installer-e2e/base` enthält das Vergleichspaket,
`output/windows-installer` den zu prüfenden neuen Stand. Der Test verwendet
eigene `NETGRID-E2E-*`-Programm-/Datenordner und die vorher auf freie Belegung
geprüften Ports `32141`/`32142`; die Betriebsports der Entwicklungsinstanz
bleiben reserviert. Für die Default-Prüfung werden nur die Testpfade und Ports
abweichend gesetzt.

Die Standalone-Matrix verwendet direkte MSI-Installations-, Reparatur- und
Deinstallationsbefehle. Sie ruft keine internen, an eine Updater-Lease
gebundenen Setupoptionen auf und ersetzt nicht den echten Tray-/Pipe-
Updaterlauf. Nach Installationen, Reparaturen und Versionswechseln prüft sie
zusätzlich den Quellcommit, sämtliche Manifestdateien, vier native EXE-Hashes
und Dateiversionen sowie den registrierten
Setupcache und das tatsächliche Ziel der Setup-Verknüpfung. Der negative
Ordnerwechsel muss explizit `installation_gate_upgrade_root_changed` liefern;
eine Ablehnung vor Änderungen ist kein Rollback-Nachweis.
`node --test scripts/check-windows-installer-e2e-harness.test.mjs` prüft diese
Harnessverträge und die Windows-PowerShell-Syntax ohne Installation. Der
überarbeitete Gesamtlauf benötigt weiterhin zwei aktuelle, regulär gebaute
Artefaktsätze und ist noch nativ auszuführen.

`corepack pnpm certify:windows-release` verbindet Releasegrenzenprüfung,
Installer-Build und diesen erhöhten Lauf. Das Ergebnis unter
`output/windows-installer-e2e/windows-11-x64-result.json` bindet die geprüften
MSI-/Setup-Dateien per SHA-256. Ein fehlendes Ergebnis oder ein Fehler gilt
nicht als Abnahme. Ein Lauf auf dem Entwicklungsrechner belegt die lokale
Installationsmatrix, ersetzt aber keinen Nachweis auf einer sauberen
Windows-11-x64-Umgebung ohne Entwicklungswerkzeuge.

Nach einmaliger Windows-Sandbox-Aktivierung und dem erforderlichen Host-Neustart
kann `powershell -NoProfile -ExecutionPolicy Bypass -File
scripts/run-windows-installer-sandbox.ps1` diese Matrix ohne weitere Host-UAC-
Abfragen in einer wegwerfbaren Windows-11-Umgebung ausführen. Das Script lässt
bereits vorhandene Sandboxen unangetastet. Es übergibt nur die vier per
Metadaten und Prüfsummen geprüften MSI-/Setup-Artefakte sowie Testhelfer; das
Repository und private Daten werden nicht freigegeben. Die Eingabefreigabe ist
nur lesbar. Netzwerk, Zwischenablage, Audio, Video und Drucker sind deaktiviert.
Ergebnisse landen im ausgewiesenen `output/windows-sandbox-e2e/<ID>/result`.
`-PrepareOnly` darf auch bei vorhandenen Sandboxen die isolierten Hosteingaben
und die Konfiguration vorbereiten; es startet, verbindet oder verändert keinen
Gast. Der automatische Start ohne diesen Schalter bleibt bei vorhandenen
Sandboxen gesperrt. Ein gezielter neuer Start über die
[Windows-Sandbox-CLI](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/windows-sandbox-cli)
kann zusätzlich an `CO_E_APPSINGLEUSE` scheitern. Dann bleibt die bestehende
Sandbox unangetastet; es braucht eine ausdrückliche Freigabe zum Verwerfen
dieses Gasts oder einen anderen Testrechner. Ein vorbereitetes Testverzeichnis
ist kein ausgeführter Test.
Ein gestarteter Sandboxprozess ist noch kein bestandenes Gate; maßgeblich ist
das terminale, prüfsummengebundene `result.json` einschließlich Cleanup.
`suite-result.json` beschreibt den gesamten beauftragten Lauf einschließlich
optionaler Zusatztests; ein später fehlgeschlagener Zusatztest überschreibt
nicht den getrennten MSI-Nachweis. `-EnableNetwork` aktiviert ausdrücklich die
Netzwerkanbindung einer neuen Test-Sandbox und kennzeichnet deren Ergebnis
entsprechend; allein dadurch gilt noch kein Private-LAN-/Firewall-Gate als
bestanden. Der Host und seine Firewallregeln bleiben unverändert.

`-IncludeRollback` ergänzt einen echten Updatertransaktionstest und einen
installierten Standardbenutzertest. Dafür wird der Testhelfer vorher mit
`.tools/dotnet/dotnet.exe publish
tests/windows/Netgrid.Updater.FaultFixture/Netgrid.Updater.FaultFixture.csproj
-c Release -r win-x64 --self-contained true -p:DebugType=None -p:DebugSymbols=false
-o output/windows-updater-fault-fixture` gebaut. Dieser Helfer ist niemals
Releasepayload. Er verweigert den Hostbetrieb und darf nur die registrierte
zufällige `NETGRID-E2E-*`-Testdatenbank nach dem echten MSI-Upgrade beschädigen.
Der unveränderte, an die aktuellen Releasemetadaten gebundene Updater muss
daraufhin die Vorversion und das Backup wiederherstellen. Geprüft werden
SQLite-Integrität, ein zuvor gesetzter Datenbankmarker und die unveränderte
Runtimekonfiguration. Die abschließende Meldungsbox ist eine getrennte UI-
Abnahme; ihr bloßes Stoppen nach verifizierter Transaktion zählt nicht als
Dialogtest. Der Standardbenutzertest verwendet nur ein temporäres Sandboxkonto
und prüft reale Launcher-/SQLite-Funktion sowie verweigerte Schreibzugriffe auf
Programm und geschützte Konfiguration.

Für einen anschließenden Private-LAN-Test in derselben netzwerkfähigen Sandbox
stehen `test-windows-private-lan-sandbox.ps1` (Gast) und
`test-windows-private-lan-host.ps1` (Host) bereit. Der Gast erlaubt `Start` erst
nach erfolgreichem `suite-result.json`, ohne verbleibende Installation und mit
freien Testports. Der Test installiert in neue zufällige Testordner und startet
die installierten Node-Entrypoints gezielt ohne Tray oder Browser. Dies ist nur
der isolierte Netzwerktest, kein Ersatz für den normalen Launcherbetrieb.
Nach `Start` prüft der Host mit `-RunRoot <Laufordner> -Profile Private`
Web/Server-Erreichbarkeit und die Abweisung von Maintenance. Gastaktion
`Public`, danach `Loopback`, bereiten die Hostprüfung `-Profile Public` vor:
Remotezugriffe müssen blockiert sein, während die Dienste lokal weiterlaufen.
`Stop` beendet nur anhand Pfad und Startzeit identifizierte eigene Testprozesse
und prüft Deinstallation, Datenlöschung, Firewallbereinigung und freie Ports.
Eine pauschale Sandbox-Regel „Container: allow inbound“ kann sonst die
Private-/Public-Grenze überlagern. Der Gasthelfer deaktiviert für die Messung
nur eine anhand Name und vollständiger Allow-All-Form identifizierte
Containerregel und protokolliert sie. Der Hosthelfer verlangt diesen Preflight.
Nach Stop wird die Regel wieder aktiviert; Hostregeln bleiben unangetastet.
Es wird keine testseitige Blockregel hinzugefügt. Nur die erfolgreich
abgeschlossenen, artefaktgebundenen Ergebnisse einschließlich dieser
Umgebungsvorbereitung und ihrer Rücknahme gelten als Netzwerknachweis.

Der Installerbuild führt auch
`tests/windows/Netgrid.SetupHost.Tests` gegen die tatsächliche Setup-Assembly
aus. Diese fensterlosen Tests prüfen spezifische Fehlerübersetzungen in allen
drei Sprachen, die Abweisung ungültiger/relativer Ordnerangaben und den Schutz
vor rohen Ausnahmetexten. Sie ersetzen keine visuelle oder funktionale
Dialogabnahme. Ein unerwarteter Setupfehler zeigt Typ und HRESULT zur Diagnose;
bekannte Fehler behalten ihre spezifische übersetzte Meldung.

`tests/windows/Netgrid.Launcher.Tests` ergänzt den tatsächlichen Download-
Dateipfad: Nach SHA-256-Prüfung muss der Prüfstream geschlossen sein, bevor
Windows die temporäre Datei an ihren endgültigen Namen verschieben kann.
Hashfehler dürfen eine vorhandene geprüfte Datei nicht ersetzen und keine
Teil-Downloads hinterlassen. Dieser fensterlose Komponententest ersetzt
weder die Zustimmung im Tray noch einen echten GitHub-Releaseabruf.

### Hilfen und Platzprüfung im Setup

Während Prüfung, Vorbereitung und Administratorfreigabe zeigt das Setup einen
Aktivitätsbalken mit der tatsächlichen Phase. Für die interaktive Installation
startet es erst nach dem Installationsklick eine erhöhte Instanz desselben
Setuphosts. Diese installiert ausschließlich die eigene hashgeprüfte MSI-Payload
über `MsiInstallProductW` und wertet `MsiSetExternalUIRecord` aus. Sobald MSI
einen berechenbaren Ausführungsumfang meldet, zeigt der Balken dessen echten
Prozentwert als **aktuellen Installationsabschnitt**, nicht als Restzeit oder
Fortschritt der gesamten Ersteinrichtung. Rückwärtslauf wird ausdrücklich als
solcher beschriftet. Vorbereitung, fehlender Umfang und nicht berechenbare
Zwischenstände bleiben als solche erkennbar; es entstehen keine erfundenen
Aufgaben-, Datei- oder Zeitprozente.

Die Rückmeldung verwendet feste numerische Frames auf einer lokalen Pipe mit
geschützter ACL, Netzwerksperre und beidseitiger Kernel-PID-Prüfung. Die erhöhte
Instanz prüft zusätzlich Startzeit und ausführbare Datei des Elternprozesses.
Anonyme Impersonation verhindert, dass der nicht erhöhte Setuphost das
Administratortoken übernimmt; eine Freigabe durch ein anderes Windows-
Administratorkonto ist im ACL-Vertrag berücksichtigt. Nur typisierte,
nicht geheime Setupwerte werden übergeben, keine beliebigen MSI-Pfade,
MSI-Eigenschaftslisten, Logziele oder Passwörter. Ausführbare Datei und
MSI-Quelle bleiben gegen Austausch geschützt. Die MSI-Payload wird in einem
atomar neu angelegten, ausschließlich für Administratoren und SYSTEM
zugänglichen Unterordner von `%WINDIR%\Temp` entpackt. Die Platzprüfung
berücksichtigt dieses Laufwerk. Nach MSI-Ende wird nur die temporäre
MSI-Datei gelöscht; das dortige `install.log` bleibt zur Diagnose erhalten
und benötigt zum Öffnen Windows-Administratorrechte.

Ein Verbindungsfehler bricht den Callback ab; der Setuphost beendet den
Installer nicht gewaltsam und wartet sein Ende beziehungsweise Rollback ab,
bevor er die Eingaben wieder freigibt. Erfolg setzt sowohl einen gültigen
Abschlussframe als auch den passenden Prozess-Exitcode voraus. Update- und
Deinstallationsaufrufe bleiben auf ihrem bestehenden getrennten Pfad.
Nach erfolgreichem MSI-Ende stoppt die Animation; der Hinweis verweist auf
die separate Ersteinrichtung. Fehler und abgebrochene Administratorfreigaben
stoppen den Balken und geben die Eingaben wieder frei. Status und Balken
bleiben aktiv und lesbar, während die Optionen gesperrt sind. Status, Balken
und Installationsknopf liegen zusammen mit dem Datenaufbewahrungshinweis in
einem festen unteren Bereich außerhalb der
scrollbaren Optionen, damit längere Übersetzungen die Rückmeldung und Aktion
nicht aus dem Fenster schieben. Der Datenhinweis bleibt während der Installation
lesbar und hat einen eigenen Abstand zum Status; er darf nicht an der Grenze
der scrollbaren Optionen abgeschnitten werden.

Der neue messbare Pfad ist komponentengeprüft, aber noch nicht als neu
gebautes Paket nativ abgenommen. Das bereits installierte Testpaket `1.0.8123`
enthält weiterhin den früheren Aktivitätsbalken und den einstufigen
Passwortdialog. Eine Komponentenansicht ersetzt diese Sandbox-Abnahme nicht.
Die normalen Ordner sind `C:\Program Files\NETGRID` und
`C:\ProgramData\NETGRID`; bei bestehender Installation wird deren registrierter
Datenordner angeboten. `NETGRID-E2E-<ID>` gehört ausschließlich zur gezielt
vorbereiteten Testinstallation, nicht zum normalen Namensvorschlag.

Alle Optionen besitzen lokalisierte „?“-Hilfen: Tooltip bei Mauszeigerkontakt,
ausführlicher Dialog per Klick oder Tastatur sowie zugängliche Beschreibung.
Maintenance wird zusätzlich über einen sichtbaren Erklärlink eingeführt.
Tooltips besitzen eine DPI-skalierte Maximalbreite von 440 logischen Pixeln,
zusätzlich begrenzt durch die Arbeitsfläche des jeweiligen Bildschirms.
Größenberechnung und Darstellung verwenden dieselbe Schrift, Innenabstände
und Wortumbruch-Flags; vollständiger Text und zugängliche Beschreibung bleiben
erhalten. Der tatsächliche Popup- und Draw-Handler wird fensterlos getestet.
Mit `--render-to <absoluter Ausgabeordner>` erzeugt der Setup-Komponententest
zusätzlich die zwölf Hilfetexte in allen drei Sprachen als PNG-Vorschauen.
Diese Prüfung ersetzt nicht die native Popup-Positionierung am Bildschirmrand.

Die Sprachauswahl ordnet ihre Aktionen über Layoutcontainer statt fester
Koordinaten an. „Weiter“ und „Abbrechen“ erscheinen ausschließlich in der
gerade ausgewählten Sprache und wechseln unmittelbar mit der Auswahl.
Komponententests sichern freie Schaltflächen ohne Überlappung sowie den
Sprachwechsel. Das Setup übergibt die Auswahl als `NETGRID_UI_LANGUAGE` an
die erhöhte Runtimekonfiguration. Nur diese schreibt die Installationspräferenz
`UiLanguage`; eine leere MSI-Eigenschaft bedeutet bei Repair/Update ausdrücklich
keine neue Auswahl. Alle vier Windows-Oberflächen laden denselben Wert.
`--audit-localization <JSON-Datei>` gibt ihre tatsächlich gewählte Sprache
ohne Fenster, Passwortdialog oder Serverstart aus. Der E2E-Test prüft die
französische Auswahl gegen alle installierten Folgeprogramme; rein lokale
Komponententests verändern dafür keine Host-Registrierung.
Für eine bereits erfolgreich abgearbeitete, weiter geöffnete Test-Sandbox
steht zusätzlich `test-windows-installed-language-sandbox.ps1` bereit. Er
akzeptiert ausschließlich einen schreibgeschützt bereitgestellten, sauber
commitgebundenen Artefaktsatz unter `C:\NETGRID-TestInput\language-review-<Build>`.
Französische Frischinstallation, Sprachübernahme der drei Folgeprogramme und
ProductCode-Reparatur werden getrennt vom allgemeinen MSI-Lauf geprüft.
`language-result.json` zählt nur bei Erfolg einschließlich Entfernung der
eigenen Testinstallation; der Test bedient keine Passwort- oder sonstigen
Authentifizierungsdialoge und ersetzt keine visuelle Abnahme.
Die Build-Vorschauen umfassen Sprachauswahl, Setup und
Deinstallation in drei Sprachen und drei geometrischen Skalierungen. Diese
Skalierung über `Form.Scale` ersetzt keinen Test mit real geänderter
Windows-DPI-Einstellung und entsprechend skalierten Schriften.

Der Setup-Layouttest prüft zusätzlich ohne Eingabeinjektion in einem
Offscreen-Fenster die kleinste Fenstergröße: Am maximalen Scroll-Ende müssen
Desktop-/Abschlussoption und ihre Hilfeschaltflächen vollständig innerhalb
des Viewports liegen. Die sichtbare Fortschritts- und Aktionsfläche bleibt
getrennt davon. Dieser Check läuft auch ohne `--render-to` und verhindert
eine Wiederholung des bei echter 150-Prozent-Skalierung in 8145 gefundenen
Scrollgrenzenfehlers. Der Renderlauf prüft zusätzlich Status, Hinweis und
Fortschrittsbalken. Beide Checks ersetzen weiterhin keine native DPI-Abnahme
des neu gebauten Artefakts.

Zusätzlich enthält derselbe Setup-Test einen echten DPI-Layoutpfad:
`dotnet run --project tests/windows/Netgrid.SetupHost.Tests/Netgrid.SetupHost.Tests.csproj -c Release -- --check-native-dpi-layout`.
Er öffnet die tatsächliche Sprachauswahl, das Setup und den
Deinstallationsdialog außerhalb des sichtbaren Bildschirms, protokolliert
`DeviceDpi` und prüft Skalierung, Arbeitsfläche, vollständige Auswahltexte
und Scroll-Ende in de/en/fr. Es werden keine Aktionen injiziert und keine
Installation, Deinstallation oder Runtime gestartet. Der Pfad ist auch im
normalen Komponententest enthalten. Für die 100-/125-/150-Prozent-Matrix muss
Windows selbst nach ausdrücklicher Freigabe umgestellt und der Testprozess
jeweils neu gestartet werden; anschließend sind die ursprünglichen
Anzeigeeinstellungen wiederherzustellen. Ein künstlich skaliertes Rendering
ist kein Ersatz. UI-Callbackfehler brechen den Test ab, statt einen modalen
.NET-Weiter-Dialog zu öffnen.

### Verbleibende native UI-Abnahme

Diese Checkliste ist ein Prüfablauf, kein bereits erbrachter Nachweis.
Jede Abnahme bindet Setup/MSI per SHA-256, Windows-Version, gewählte Sprache,
tatsächliche Windows-Anzeigeskalierung und hellen bzw. dunklen Kontext.
Die sichtbaren Flows müssen in `de`, `en` und `fr` funktional geprüft werden;
die visuelle Prüfung umfasst echte 100 %, 125 % und 150 %. Eine skalierte
Bilddatei, Viewer-Zoom oder `Form.Scale` zählt nicht als Windows-DPI-Wechsel.

| Oberfläche | Zu prüfen |
| --- | --- |
| Sprachauswahl und Setup | Sprachwechsel samt Aktionsbeschriftungen; voreingestellte und benutzerdefinierte Werte; vollständige Texte, Fokusreihenfolge, Maus- und Tastaturhilfen; Tooltips an beiden Bildschirmrändern |
| Validierung | Ungültige Pfade, belegte Testports und unzureichender Speicher führen zu verständlichen lokalisierten Meldungen vor der Installation; keine rohen Ausnahmetexte |
| Ersteinrichtung | Verdeckte doppelte Eingabe, verständliche Rückmeldung, „Später“ und unveränderter vorhandener Zugang; Passwort-/Authentifizierungsschritte bedient der Nutzer selbst |
| Launcher und Tray | Spiel, Maintenance, zweite Instanz, geordnetes Beenden, Wiederherstellung und Diagnose; vollständige lokalisierte Menüs und Meldungen |
| Update und Reparatur | Tatsächlicher GitHub-Releaseabruf, Stable-/Prerelease-Auswahl, ausdrückliche Zustimmung, laufendes Spiel als Sperre, Erfolg und Fehler samt Reparaturweg; reine API-Fixtures reichen nicht |
| Deinstallation | Datenerhalt als Standard; Datenlöschung ausdrücklich und getrennt bestätigt; vollständige lokalisierte Warnung sowie Erfolg und Fehler |

Installationen und funktionale Tests bleiben auf einer ausdrücklich
freigegebenen sauberen Testmaschine, mit isolierten Daten und freien Testports.
Ein ergänzender Host-DPI-Test darf ohne gesonderte Installationsfreigabe nur
das Setupfenster zeigen: keine Installation, keine Ersteinrichtung und kein
Launcherstart. Änderungen der Host-Anzeige erfolgen nur nach Zustimmung;
der ursprüngliche Wert wird dokumentiert und anschließend wiederhergestellt.
Die laufende Entwicklungsinstanz und ihre Daten bleiben unangetastet.
Bei Windows-UI-Automation werden Installations- und Löschaktionen unmittelbar
vor Ausführung bestätigt; Authentifizierungs- und UAC-Dialoge übernimmt der
Nutzer. Eine für den echten Updatepfad nötige GitHub-Veröffentlichung benötigt
eine eigene Freigabe und bestandene lokale Release-Gates.

Fehlt der Testumgebung die Windows-Skalierungsseite oder verlangt ein Schritt
noch Zustimmung, bleibt genau dieser Nachweis offen. Vorhandene grüne
Komponenten- und MSI-Tests werden weder verworfen noch als Ersatz für den
fehlenden UI-Nachweis umgedeutet.

Die drei lokalisierten First-Run-Startmenünamen stammen beim MSI-Build aus
`first.title` derselben explizit als UTF-8 gelesenen Sprachquelle; dies ist
auch unter Windows PowerShell 5.1 verbindlich. Bedingte, transitive MSI-Komponenten
stellen genau die gewählte Verknüpfung bereit und entfernen bei einer
ausdrücklichen Sprachänderung die vorherige. Die Namen sind im MSI literal
gebunden: Die `Name`-Spalte der
[Shortcut-Tabelle](https://learn.microsoft.com/en-us/windows/win32/msi/shortcut-table)
ist kein zur Laufzeit formatierter Eigenschaftstext.
Reparatur und Update lesen die registrierte Sprache. Das geführte Setup
übergibt immer seine erkannte bzw. gewählte Sprache; direkte MSI-Aufrufe
können `NETGRID_UI_LANGUAGE=de|en|fr` setzen und verwenden ohne Angabe oder
vorhandene Registrierung die englische MSI-Paketsprache. Die
Windows-Spracherkennung des Setup-Assistenten bleibt davon unverändert.
Der gezielte Sandbox-Sprachtest prüft mit `-VerifyShortcuts` zusätzlich alle
drei Namen, Reparatur und die Entfernung der zuvor gewählten Verknüpfung.
Die bestehende Präferenz wird mit `/fa ProductCode` repariert. Eine neue
Auswahl verwendet dagegen `/i ProductCode REINSTALL=ALL REINSTALLMODE=amus`
mit `NETGRID_UI_LANGUAGE`: Die
[`/f`-Reparaturoption](https://learn.microsoft.com/en-us/windows/win32/msi/command-line-options)
ignoriert Kommandozeileneigenschaften und kann deshalb keine neue Sprache
übernehmen.

Beim Update ist allein die vom Installer gespeicherte Zeichenfolge
`DesktopShortcutPreference` (`0` oder `1`) maßgeblich. Ein fehlender oder
ungültiger Wert stoppt mit einer lokalisierten Reparaturmeldung; weder die
Existenzmarkierung einer Shortcut-Komponente noch ein stiller Standardwert
ersetzen die ursprüngliche Auswahl.

Die Updateoberfläche unterscheidet Suche, Download und Vorbereitung.
DNS-/Verbindungsfehler ohne HTTP-Status sowie das HTTP-Zeitlimit gelten nur
während der Suche als derzeit nicht erreichbare Updatequelle. Die manuelle
Suche erklärt diesen Zustand und lässt NETGRID weiter nutzbar; die Prüfung
beim Start bleibt dabei wie vorgesehen still. HTTP-Statusfehler, TLS-Fehler,
ungültige Metadaten und Integritätsfehler werden weder als Offlinezustand
noch als „auf dem neuesten Stand“ ausgegeben. Nach einer Updatezustimmung
werden Fehler beim Download oder der Vorbereitung auch dann angezeigt,
wenn die ursprüngliche Suche automatisch beim Start ausgelöst wurde.

`launcher-update.log` hält Owner, Phase, freigegebenen Fehlercode, Ausnahmetyp,
HRESULT und gegebenenfalls HTTP-Status/-Fehlerart fest. Ausnahmetexte,
innere Ausnahmen, URLs, Header und Geheimnisse werden nicht übernommen.
Das Protokoll rotiert bei 64 KiB mit genau einer Vorgängerdatei und gehört
über den bestehenden `launcher-`-Filter zum lokalen Diagnoseexport. Kann
die Diagnose nicht gespeichert werden, zeigt die Oberfläche beide
strukturierten Fehler an, statt auf ein nicht vorhandenes Protokoll zu
verweisen. Es findet keine automatische Übermittlung statt.

`read-windows-msi-footprint.ps1` liest ausschließlich die tatsächliche
MSI-File-Tabelle. Dateigröße, Anzahl und MSI-Größe werden im Setup eingebettet
und beim Installer-Audit gegen die extrahierte Payload verglichen. Die
Platzprüfung reserviert den vollständigen neuen Programmstand samt
Allokationspuffer, geschützte Setup-/MSI-Caches, eine vollständige Payload als
temporären Puffer und 512 MiB als anfängliche Datenreserve. Mehrere Ziele auf
demselben Laufwerk zählen zusammen. Das ist ein konservativer Installations-
Platzplan, keine Zusage über späteren Speicherbedarf der Spielhistorie.
Fehlt Kapazität oder lässt sie sich nicht sicher prüfen, startet die
Installation nicht; die lokalisierte Meldung nennt einzuplanenden und freien
Platz pro betroffenem Laufwerk. Auch Updates verwenden diese Prüfung vor dem
Entpacken. Eine zwischenzeitliche Belegung durch andere Programme kann nicht
ausgeschlossen werden und bleibt zusätzlich Aufgabe der MSI-Fehlerbehandlung.

Die Runtimekonfiguration wird als EXE-Custom-Action aufgerufen. Ihre
Argumente werden beim Einplanen aus der jeweils vorbereiteten Action-Property
formatiert (`[InitializeNetgridRuntime]`, `[CacheNetgridSetup]` usw.).
`[CustomActionData]` ist hier kein verfügbarer EXE-Sitzungszugriff. Der
MSI-Decompile-Audit prüft deshalb ausdrücklich die Argumentbindung;
Build-/Extraktionserfolg allein beweist keine funktionierende Installation.

Der native Fortschrittscallback bestätigt auch datensatzlose
`INSTALLMESSAGE_PROGRESS`-Benachrichtigungen sowie gültige Records mit null
Feldern: Windows Installer sendet beide Formen beim Öffnen beziehungsweise
Installieren eines Pakets. Sie
ändern keinen Zähler und erzeugen keine Prozentanzeige. Ein vorhandener,
aber ungültiger numerischer Fortschrittsrecord bleibt dagegen ein Fehler;
auch eine unterbrochene Fortschrittsübertragung bricht weiterhin ab.

Die Installation speichert ihr vollständiges Quell-MSI bytegleich unter
`<Datenroot>/config/installer/<ProductCode>/` und registriert dieses Verzeichnis
über die Windows-Installer-Eigenschaft `SOURCELIST`. Der Dateiname bleibt der
ursprüngliche MSI-Quellname. Dies ist die dauerhafte Reparaturquelle, nicht der
vom Setup anschließend entfernte temporäre Extraktionspfad. Normale Benutzer
besitzen dort nur Leserechte. Programm- und Datenpfad werden für Reparaturen
aus der Installationsregistrierung aufgelöst; ausdrücklich übergebene Pfade
haben Vorrang. Der E2E-Test repariert den neuen Stand nur über seinen
ProductCode, ohne externes MSI oder erneut übergebene Installationspfade.
Führend sind Microsofts Verträge zu
[`SOURCELIST`](https://learn.microsoft.com/en-us/windows/win32/msi/sourcelist)
und [`OriginalDatabase`](https://learn.microsoft.com/en-us/windows/win32/msi/originaldatabase).

Der lokale MSI-Test unterscheidet einen abgewiesenen Upgradeversuch, ein
erfolgreiches Upgrade und einen eigenständigen Downgrade. Diese Prüfungen
beweisen für sich allein noch keinen vom Updater ausgelösten vollständigen
Programm-/Datenrollback nach fehlgeschlagenem Healthcheck. Auch die Bereinigung
fließt in das E2E-Ergebnis ein; zurückgebliebene Testinstallationen oder
Bereinigungsfehler verhindern ein erfolgreiches Ergebnis.

Die selbstenthaltenen NETGRID-Komponenten und der Setuphost erhalten beim
Build dieselbe `Version=1.0.<Buildnummer>` wie das Produktlayout und MSI.
`check-windows-native-version.ps1` kontrolliert nach der MSI-Extraktion die
echten PE-Dateiversionen aller vier installierten NETGRID-Programme und des
Setups; die frühere konstante Dateiversion `1.0.0.0` besteht dieses Gate
nicht mehr. Node behält seine unabhängig gepinnte Herstellerversion.

Das MSI setzt `REINSTALLMODE=amus`. Der unveränderliche Programmoutput muss
bei Installation und expliziter Versionsrücknahme exakt dem gewählten Paket
entsprechen, auch bei zuvor gleichen oder höheren Dateiversionen. Nutzerdaten
liegen außerhalb der MSI-Dateimenge und bleiben dem bestehenden Datenvertrag
unterstellt. Die tatsächliche Eigenschaft wird aus der MSI-Tabelle geprüft.
Diese Policy nutzt die dokumentierten
[REINSTALLMODE-Regeln](https://learn.microsoft.com/en-us/windows/win32/msi/reinstallmode),
ersetzt aber keinen nativen Hashvergleich nach Upgrade und Downgrade.

- `RELEASE_PRODUCT_BOUNDARY_*`: Klassifikation oder verbotener
  Repositoryinhalt korrigieren.
- `Get-FileHash` fehlt nur im Node-gestarteten Windows-PowerShell-Prüfprozess:
  Der Zwischenprozess kann den Modulsuchpfad von PowerShell 7 unverändert
  an Windows PowerShell 5.1 weiterreichen. Der DTF-Payload-Audit importiert
  deshalb `Microsoft.PowerShell.Utility` explizit aus `$PSHOME` des
  ausführenden Engines. Keine globale Änderung des Modulsuchpfads und kein
  Überspringen der Hashprüfung. Der direkte PowerShell-Aufruf allein ist
  kein Regressionstest; auch den Node-Kindprozesspfad prüfen.
- `WINDOWS_RELEASE_AUDIT_*`: Output nicht verteilen; Manifest- oder
  Positivgrenze ursächlich reparieren.
- `release_next_dependency_*`: fehlende Web-Laufzeitabhängigkeit im
  Materialisierungsschritt ergänzen, nicht den Workspace mitkopieren.
- `deck_snapshot_*` im Release: Produktdefault oder Standarddeck-Katalog
  prüfen; keine Demo-Snapshots als Fallback ausliefern.
- fehlender externer Datenroot: absoluten `NETGRID_DATA_ROOT` setzen; keinen
  relativen Repositorypfad verwenden.
