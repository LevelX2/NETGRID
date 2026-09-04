# Paketprozess: Windows-Installer und Launcher

Stand: 2026-09-04  
Status: in Umsetzung; WIN-I00 bis WIN-I04 verifiziert, nächstes Paket WIN-I05

## Quelle und Zielprüfung

Führend sind `windows-release-boundary.md`,
`windows-installer-product-contract.md`, `product-layout.json` und
`product-manifest.json`. Ziel, Produktgrenze, Defaults, Sicherheitsgrenzen,
Abnahmekriterien und Paketfolge sind bestimmbar. Die installerunabhängigen
Produktvoraussetzungen sind in Anwendung, Releasekonfiguration, Tests und
aktuellen Runbooks umgesetzt. Für die private Alpha ist WiX Toolset 7.0.0
unter ausdrücklicher Annahme der OSMF-EULA als Installerbasis bestätigt. Der
Launcher und der First Run werden als selbst enthaltene .NET-10-Windows-
Desktopanwendung umgesetzt; dadurch benötigt das Zielsystem keine separat
installierte .NET-Laufzeit. Die spätere Codesigning-Beschaffung bleibt ein
eigenes Release-Gate.

## Gesamtziel

Ein Windows-11-x64-Setup installiert den auditierten NETGRID-Produktoutput
und die Node-24-Laufzeit pro Rechner, richtet Daten, Launcher, Netzwerk,
Kontomodus und Maintenance sicher ein, unterstützt GitHub-Updates und lässt
sich vollständig auf einer sauberen Testmaschine prüfen. Entwicklungs-, Test-
und private Daten bleiben ausgeschlossen.

## Annahmen und Nicht-Ziele

- GitHub Releases bleibt der einzige Distributionskanal.
- Der normale Entwicklungsstart bleibt ohne Installerkonfiguration bei
  `invite_only`; nur das installierte Releaseprodukt erhält seinen gewählten
  `simple`- oder `protected`-Ausgangsmodus.
- Die erste private Alpha darf unsigniert sein; breite Veröffentlichung nicht.
- Es gibt keine V0-Legacy-Migrationspflicht. Eine reale Produktmigration wird
  nur mit explizitem Schema- und Restorevertrag umgesetzt.
- Windows-Dienst, Autostart, öffentlicher Internetbetrieb, Store, MSIX,
  Windows 10 und ARM64 sind nicht Teil dieses Prozesses.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Paketierung beginnt ausschließlich nach grüner Releaseoutput-Prüfung.
- Installationsbinärdateien sind unveränderlich; Nutzerdaten liegen nur im
  validierten externen Datenroot.
- Geheimnisse erscheinen nie in MSI-Eigenschaften, Kommandozeilen oder Logs.
- Maintenance bleibt Loopback-only und unabhängig vom Spielerkontomodus
  geschützt.
- Netzwerkfreigaben gelten ausschließlich für das private Windows-Profil.
- Updates verändern Daten erst nach geprüftem Backup und besitzen einen
  fail-closed Rollbackpfad.
- Neue Fallbacks, zweite Accountautoritäten und Releasekopien von
  Entwicklungsdaten sind unzulässig.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Ein Paket darf eng diagnostizieren und ursächlich korrigieren. Bei
Manifestabweichung, unklarem Datenpfad, unsicherer Secretweitergabe,
unprüfbarem Download, fehlendem Backup, unvollständigem Rollback oder
ungeklärter öffentlicher Netzwerkexposition stoppt der Prozess fail-closed.
Der Blockerbericht benennt Ursache, betroffenen Vertrag und Removal Condition.

## State Machine

```text
prepared -> package_active -> package_verified -> package_committed
         -> next_package ... -> integration_verified -> merged -> cleaned
                    \-> security_blocked
```

## Paketfolge

Voraussetzung für WIN-I01 sind der abgeschlossene und lokal integrierte
Paketprozess WIN-P00 bis WIN-P05 sowie das lokale Preflightpaket WIN-I00.
WIN-I00 repariert den beim Zentralisieren der Runtimepfade entstandenen
Maintenance-Credential-Pfadbruch ohne Passwortänderung und härtet den
Releaseoutput gegen mitkopierte Entwicklungsartefakte. Dadurch konsumiert der
Installer nur noch stabile Anwendungskonfiguration und implementiert keine
eigene Account-, Cleanup- oder Versionsautorität.

| Paket                                        | Ziel                                                                     | Kernartefakte und Arbeit                                                                                                                                                                                                                                                           | Direkte Checks                                                                                        | Done-Gate                                                                                                                                      | Commit-Vorschlag                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| WIN-I00 Preflight und Releaseinput           | Bestehendes Credential erhalten und strikt produktive Payload herstellen | Vorhandene Maintenance-Auth-Datei einmalig vom früheren paketlokalen an den kanonischen Repository-Datenpfad verschieben, Pfadauflösung absichern, rekursives Mitkopieren nicht benötigter Dependency-Dokumentation, Tests, Typdeklarationen und Source Maps ursächlich beseitigen | Maintenance-Status am alten und neuen Pfad, Runtimepfad-Tests, Boundary-Gates, Releasebuild und Smoke | Vorhandenes Passwort bleibt unverändert nutzbar; kein Legacy-Fallback; Output enthält weder private/eigene noch sonstige Entwicklungsartefakte | `fix(release): harden installer input and preserve maintenance auth` |
| WIN-I01 Toolchain und Installer-Skelett      | Reproduzierbares Setup-Grundgerüst                                       | WiX-/Bootstrapper-Entscheidung, stabile Produkt-/Upgradecodes, Versionierung, Lizenzinventar, ausschließlich auditierten Output konsumieren                                                                                                                                        | Setup-Build, Payload-/Manifestvergleich, Boundary-Gates                                               | MSI und Setup bauen reproduzierbar ohne verbotene Payload                                                                                      | `build(installer): add Windows setup skeleton`                       |
| WIN-I02 Installations- und Datenvertrag      | Sichere per-machine Installation                                         | Program Files, wählbarer lokaler Datenroot, ACLs, Secret-Erzeugung, Node-Runtime, Reparatur/Uninstall und Datenerhalt                                                                                                                                                              | Clean-install-, ACL-, Pfad-, Repair- und Uninstall-Tests                                              | Normalbetrieb ohne Adminrechte; Daten bleiben standardmäßig erhalten                                                                           | `feat(installer): implement installation and data layout`            |
| WIN-I03 Launcher und Windows-Integration     | Bedarfsgesteuerter Betrieb                                               | Single Instance, Server/Web-Start, Healthcheck, Tray, Startmenü, Desktopoption, kontrolliertes Beenden, einmaliger Recovery, Icons                                                                                                                                                 | Launcher-Komponententests und Windows-Integrationssmoke                                               | Kein Autostart/Dienst; alle Einstiegspunkte verwenden dieselbe Instanz                                                                         | `feat(launcher): add managed NETGRID desktop runtime`                |
| WIN-I04 Geführtes Setup und Netzwerk         | Empfohlenen und benutzerdefinierten Weg liefern                          | Setupmodus, Local/LAN-Wahl, Portprüfung, Private-Firewallregel, Cleanup-Default und Abschlussstart                                                                                                                                                                                 | UI-Flow-, Portkonflikt- und Firewallprofiltests                                                       | Empfohlener Weg fragt nur Pflichtwerte; LAN wird nie still aktiviert                                                                           | `feat(installer): add guided setup and private network mode`         |
| WIN-I05 First Run, Profile und Maintenance   | Bestehende Kontomodi sicher konfigurieren                                | Maintenance-Passwort über sicheren Bootstrap, Auswahl der vorhandenen `simple`-/`protected`-Policy und geführter Erstzugang                                                                                                                                                        | First-Run-, Secret-, Policy- und Wiederanlauftests                                                    | Installer nutzt die bestehende Accountautorität; Maintenance bleibt separat geschützt                                                          | `feat(installer): configure installed-product onboarding`            |
| WIN-I06 GitHub-Updater und Rollback          | Zustimmungsbasiertes Update                                              | Startprüfung, Stable/Prerelease, Download/Integritätsprüfung, Backup, laufende Matches, kontrollierter Neustart und Rollback                                                                                                                                                       | API-Fixtures, Offline-, Tamper-, Backup-/Restore- und Upgrade-Tests                                   | Kein stilles Update; Fehler hinterlässt alten oder sicher gestoppten Stand                                                                     | `feat(updater): add verified GitHub release updates`                 |
| WIN-I07 Lokalisierung, Branding und Diagnose | Veröffentlichungsfähige Oberfläche                                       | `de`/`en`/`fr`, Terminologie, NETGRID-Icons/Grafiken, DPI-/Kontrastprüfung, redigierter Diagnoseexport, Drittanbieterhinweise                                                                                                                                                      | String-Vollständigkeit, Screenshotmatrix, Diagnose-Leak-Gate, Lizenzcheck                             | Keine Platzhalter/Clips/rohen Fehler; alle Oberflächen visuell abgenommen                                                                      | `feat(installer): finalize localization branding and diagnostics`    |
| WIN-I08 End-to-End-Releasegate               | Saubere Maschine beweisen                                                | Frischinstallation, Custom-Setup, Update, Prerelease, Rollback, Repair, Uninstall, Retention und Datenlöschung auf Windows 11 x64                                                                                                                                                  | vollständige Installer-E2E-Matrix plus bestehende Releaseoutput-Gates                                 | reproduzierbares GitHub-Releaseartefakt samt Prüfsumme; alle Gates grün                                                                        | `test(installer): certify Windows release workflow`                  |

## Aktueller Umsetzungsstand

- WIN-I00 ist verifiziert: Der bestehende Maintenance-Credentialstore wurde
  ohne Passwortänderung hashgleich an den kanonischen Repository-Datenpfad
  verschoben. CLI und laufender Server erkennen ihn dort; am früheren
  paketlokalen Pfad bleibt keine zweite Kopie.
- Die Release-Materialisierung entfernt nicht benötigte
  Dependency-Dokumentation, Tests, Scripts, Typdeklarationen und Source Maps.
  Der gehärtete Output enthält in diesen Kategorien sowie für eigene Quellen,
  SQLite und private Daten jeweils null Treffer.
- Fokussierte Runtimepfad-/Maintenance-Tests, Boundary-Gates,
  Releaseoutput-Build und isolierter Release-Smoke sind grün.
- WIN-I01 pinnt .NET SDK 10.0.302 und WiX Toolset 7.0.0. Produktlayout und
  Installer-Metadaten tragen Buildnummer, Commit und Dirty-Zustand; MSI und
  Setup entstehen nur aus dem zuvor auditierten Releaseoutput. Der zunächst
  verwendete Standard-Burn-Host wurde in WIN-I04 durch die benötigte geführte
  NETGRID-Oberfläche ersetzt.
- Der Installer-Audit extrahiert das MSI administrativ, vergleicht 10.891
  Dateien vollständig gegen Größe und SHA-256 des Produktmanifests, bestätigt
  die Rechtstexte und bindet das im Setup-Host eingebettete MSI per Hash.
  Das Lizenzinventar umfasst aktuell 37 eindeutige Runtimepakete.
- WiX 7 erzeugt trotz identischer Eingaben derzeit keinen byteidentischen MSI-
  oder Bundle-Output, weil Paketcode und Zeitfelder nicht steuerbar sind. Die
  Reproduzierbarkeit bedeutet deshalb eine gepinnte, wiederholbare Buildstrecke
  mit manifestgebundener Payload und Prüfsummen je erzeugtem Artefakt; eine
  behauptete Byte-Reproduzierbarkeit wäre sachlich falsch.
- WIN-I02 liefert ausschließlich `node.exe` aus dem per SHA-256 gepinnten
  offiziellen Node.js-24.20.0-x64-Archiv sowie dessen Lizenz aus. Der
  selbstenthaltene .NET-Runtimekonfigurator erzeugt das Tokensalz intern aus
  32 kryptografisch zufälligen Bytes und übernimmt nie ein Secret aus einer
  MSI-Eigenschaft oder Kommandozeile.
- Der Datenroot muss absolut, lokal, fest eingebaut, von Program Files getrennt
  und frei von Reparse-Points sein. `runtime` und `card-images` sind für lokale
  Benutzer änderbar; `config` und die dortige `runtime.env` bleiben
  installerverwaltet und nur lesbar. Reparatur erhält eine bestehende valide
  Konfiguration bytegleich. Die Initialisierung läuft nicht bei
  Deinstallation, und die Datenroot-Registrierung bleibt für eine spätere
  Neuinstallation erhalten.
- Der isolierte Initialisierungs-/Repair-/ACL-Test sowie der vollständige MSI-
  Extraktions-, Decompile-, Manifest- und Bundle-Audit sind grün. Die echte
  erhöhte Install-/Repair-/Uninstall-Matrix bleibt zusätzlich Bestandteil des
  sauberen Windows-11-Gesamtgates in WIN-I08.
- WIN-I03 liefert `NETGRID.exe` als selbstenthaltenen .NET-10-Windows-
  Tray-Launcher. Er übernimmt ausschließlich die geschützte `runtime.env`,
  entfernt vererbte NETGRID-/Node-Overrides, startet die installierte Node-
  Laufzeit ohne Konsole, wartet auf Server- und Web-Health und öffnet Spiel
  oder Maintenance über denselben Prozess.
- Eine globale Mutex verhindert die zweite Launcherinstanz. Server und
  Webclient bleiben bedarfsgestartete Kindprozesse ohne Dienst oder Autostart.
  Beim Beenden erhält der Server über seinen privaten stdin-Steuerkanal einen
  geordneten Shutdown; verbleibende Prozesse werden begrenzt beendet.
- Nach einem unerwarteten Kindprozessende erfolgt genau ein gemeinsamer
  Recovery-Start. Der zweite Fehler stoppt und bietet Wiederholen,
  Diagnoseordner oder Beenden. Rotierte Launcherlogs redigieren bekannte und
  schematisch erkennbare Secrets.
- Startmenüeinträge für Spiel und Maintenance sowie die standardmäßig
  aktivierte, per MSI-Eigenschaft abwählbare Desktopverknüpfung sind im Paket
  gebunden. Der isolierte Smoke hat Health, kontrollierten Stopp, genau einen
  Recovery-Versuch, SQLite-Anlage und geschlossene Testports nachgewiesen.
- WIN-I04 ersetzt die generische Burn-Außenoberfläche durch einen
  selbstenthaltenen NETGRID-Setuphost; das WiX-MSI bleibt alleinige
  Installationsautorität. Der Host bettet genau dieses MSI ein und prüft es
  vor der Extraktion gegen die beim Build gebundene SHA-256-Prüfsumme.
- Empfohlener und benutzerdefinierter Weg, explizite Local-/Private-LAN-Wahl,
  Programm-/Datenpfad, Ports, Aufbewahrung, Desktopoption und Abschlussstart
  sind im geführten Vertrag abgebildet. Ein echter belegter Port wird erkannt;
  der empfohlene Weg bietet nur nach Bestätigung ein freies Alternativpaar.
- `private_lan` akzeptiert ausschließlich private IPv4-URLs, verwendet die
  bestehende CORS-/Rate-Limit-Härtung und hält Launcher sowie Maintenance auf
  Loopback. Zwei erhöhte Firewallregeln gelten nur für das Windows-Profil
  „Privat“ und werden bei lokalem Betrieb oder Deinstallation entfernt.
- Der Setupwert für 7, 30, 90, 180, 365 Tage oder „nie“ initialisiert nur eine
  noch nicht gespeicherte Cleanup-Policy. Spätere Maintenance-Änderungen
  werden weder bei Repair noch beim Wiederanlauf überschrieben.

## Verifikationsregeln

Nach jedem Paket laufen nur die direkt betroffenen Tests, anschließend
`git diff --check`, ein paketbezogener Commit und die Aktualisierung des
Prozessstands. Die bestehenden Releasegrenzen
`check:release-boundary`, `check:windows-release-output`,
`build:windows-release-output` und `smoke:windows-release-output` werden immer
dann wiederholt, wenn Payload, Layout, Entrypoints oder Runtimekonfiguration
betroffen sind. WIN-I08 führt die vollständige Installer-E2E-Matrix auf einer
sauberen Windows-11-x64-Umgebung aus.

## Worktree-, Git- und Integrationsregeln

Die Umsetzung verwendet den Branch `codex/windows-installer-v1` im Worktree
`C:\Projekte\NETGRID_WINDOWS_INSTALLER_V1`. Der Hauptworkspace dient nur dem
finalen lokalen Merge.
Jedes Paket erhält einen Commit. Vor dem Abschluss wird aktuelles `main`
defensiv integriert, die direkt betroffenen Gates werden wiederholt, der
Arbeitsbranch lokal nach `main` gemergt und anschließend Worktree sowie
gemergter Branch nach den Projektregeln verifiziert entfernt. Ein Push erfolgt
nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Windows-Installer- und Launcher-Prozess vollständig und
sequenziell von WIN-I00 bis WIN-I08 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, docs/codex/CODEX_STATUS.md,
docs/architecture/windows/windows-release-boundary.md,
docs/architecture/windows/windows-installer-product-contract.md und dieses
Prozessartefakt. Arbeite ausschließlich im eigens angelegten Worktree auf
einem codex/-Branch und immer nur am aktuellen Paket. Implementiere keine
zurückgestellten Funktionen und liefere keine Entwicklungs-, Test- oder
privaten Daten aus. Führe die paketnahen Checks aus, committe jedes
abgeschlossene Paket und stoppe bei einem Sicherheitsblocker fail-closed mit
Ursache und Removal Condition. Nach WIN-I08 verifiziere die direkt betroffenen
Gates, merge lokal nach main und entferne Worktree und gemergten Branch erst
nach den vorgeschriebenen Prüfungen. Push nur auf ausdrücklichen Wunsch.
```

## Abschlusskriterien

Der Prozess ist erst abgeschlossen, wenn alle neun Done-Gates erfüllt, alle
Paketcommits integriert, der Windows-11-x64-E2E-Nachweis grün, der lokale
Main-Stand sauber sowie Arbeits-Worktree und gemergter Branch nachweislich
entfernt sind. Codesigning darf nur für die private Alpha offen bleiben und
muss vor einer breiteren Veröffentlichung als ausdrückliches Release-Gate
geschlossen werden.
