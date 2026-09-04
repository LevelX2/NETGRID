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

Der aktuelle Output wird noch manuell über GitHub Releases bereitgestellt. Das
Release enthält mindestens Version, Änderungshinweise, Installerdatei und
Prüfsumme. Zielverhalten und Paketfolge für Installer, Launcher und den
späteren zustimmungsbasierten GitHub-Updater sind in
`../architecture/windows/windows-installer-product-contract.md` und
`../architecture/windows/windows-installer-package-process.md` festgelegt.
Bis zum Abschluss des Updaterpakets beginnt ein Upgrade weiterhin nur durch
einen manuell gestarteten Installer.

## Fehlerdiagnose

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
