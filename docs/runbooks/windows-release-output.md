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

`NETGRID-Setup-<Version>-x64.exe` zeigt den empfohlenen und den
benutzerdefinierten Weg. Local/LAN, Desktopverknüpfung und Start nach Abschluss
sind sichtbar; im benutzerdefinierten Weg kommen Pfade, Ports,
Spielaufbewahrung und die Wahl zwischen einfachem und geschütztem
Spielerprofilmodus hinzu. Erst „Installieren“ fordert Administratorrechte an.
Das Setup übergibt ausschließlich nicht geheime, validierte MSI-Eigenschaften.

Private-LAN-Installationen benötigen eine erkannte private IPv4-Adresse. Die
Spielports werden ausschließlich im Windows-Netzwerkprofil „Privat“ geöffnet;
Maintenance und Launcher-Health bleiben Loopback-only. Der Standard ist lokal,
und LAN wird nie still aktiviert. Die vollständige erhöhte Firewall- und
Installationsmatrix folgt im WIN-I08-Releasegate.

Nach erfolgreicher MSI-Installation startet `NETGRID.FirstRun.exe`. Das
Maintenance-Passwort wird dort zweimal verdeckt eingegeben und ausschließlich
über eine lokale stdin-Pipe an `app/maintenance-auth.mjs` übergeben. „Später“
lässt die Spieloberfläche nutzbar, während Maintenance gesperrt bleibt; die
Ersteinrichtung kann über den gleichnamigen Startmenüeintrag erneut geöffnet
werden. Ein vorhandenes Credential wird weder zurückgesetzt noch ersetzt.

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

Beim Update ist allein die vom Installer gespeicherte Zeichenfolge
`DesktopShortcutPreference` (`0` oder `1`) maßgeblich. Ein fehlender oder
ungültiger Wert stoppt mit einer lokalisierten Reparaturmeldung; weder die
Existenzmarkierung einer Shortcut-Komponente noch ein stiller Standardwert
ersetzen die ursprüngliche Auswahl.

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

- `RELEASE_PRODUCT_BOUNDARY_*`: Klassifikation oder verbotener
  Repositoryinhalt korrigieren.
- `WINDOWS_RELEASE_AUDIT_*`: Output nicht verteilen; Manifest- oder
  Positivgrenze ursächlich reparieren.
- `release_next_dependency_*`: fehlende Web-Laufzeitabhängigkeit im
  Materialisierungsschritt ergänzen, nicht den Workspace mitkopieren.
- `deck_snapshot_*` im Release: Produktdefault oder Standarddeck-Katalog
  prüfen; keine Demo-Snapshots als Fallback ausliefern.
- fehlender externer Datenroot: absoluten `NETGRID_DATA_ROOT` setzen; keinen
  relativen Repositorypfad verwenden.
