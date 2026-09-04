# Paketprozess: Windows-Installer und Launcher

Stand: 2026-09-04  
Status: umsetzungsbereit geplant; Produktvoraussetzungen sind abgeschlossen

## Quelle und Zielprüfung

Führend sind `windows-release-boundary.md`,
`windows-installer-product-contract.md`, `product-layout.json` und
`product-manifest.json`. Ziel, Produktgrenze, Defaults, Sicherheitsgrenzen,
Abnahmekriterien und Paketfolge sind bestimmbar. Die installerunabhängigen
Produktvoraussetzungen sind in Anwendung, Releasekonfiguration, Tests und
aktuellen Runbooks umgesetzt. Die konkrete WiX-Version,
Launcher-Technologie und spätere Codesigning-Beschaffung dürfen innerhalb der
jeweiligen Pakete entschieden werden, ohne den Produktvertrag zu verändern.

## Gesamtziel

Ein Windows-11-x64-Setup installiert den auditierten NETGRID-Produktoutput
und die Node-24-Laufzeit pro Rechner, richtet Daten, Launcher, Netzwerk,
Kontomodus und Maintenance sicher ein, unterstützt GitHub-Updates und lässt
sich vollständig auf einer sauberen Testmaschine prüfen. Entwicklungs-, Test-
und private Daten bleiben ausgeschlossen.

## Annahmen und Nicht-Ziele

- GitHub Releases bleibt der einzige Distributionskanal.
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

Voraussetzung für WIN-I01 ist der abgeschlossene und lokal integrierte
Paketprozess WIN-P00 bis WIN-P05. Dadurch konsumiert der Installer nur noch
stabile Anwendungskonfiguration und implementiert keine eigene Account-,
Cleanup- oder Versionsautorität.

| Paket | Ziel | Kernartefakte und Arbeit | Direkte Checks | Done-Gate | Commit-Vorschlag |
| --- | --- | --- | --- | --- | --- |
| WIN-I01 Toolchain und Installer-Skelett | Reproduzierbares Setup-Grundgerüst | WiX-/Bootstrapper-Entscheidung, stabile Produkt-/Upgradecodes, Versionierung, Lizenzinventar, ausschließlich auditierten Output konsumieren | Setup-Build, Payload-/Manifestvergleich, Boundary-Gates | MSI und Setup bauen reproduzierbar ohne verbotene Payload | `build(installer): add Windows setup skeleton` |
| WIN-I02 Installations- und Datenvertrag | Sichere per-machine Installation | Program Files, wählbarer lokaler Datenroot, ACLs, Secret-Erzeugung, Node-Runtime, Reparatur/Uninstall und Datenerhalt | Clean-install-, ACL-, Pfad-, Repair- und Uninstall-Tests | Normalbetrieb ohne Adminrechte; Daten bleiben standardmäßig erhalten | `feat(installer): implement installation and data layout` |
| WIN-I03 Launcher und Windows-Integration | Bedarfsgesteuerter Betrieb | Single Instance, Server/Web-Start, Healthcheck, Tray, Startmenü, Desktopoption, kontrolliertes Beenden, einmaliger Recovery, Icons | Launcher-Komponententests und Windows-Integrationssmoke | Kein Autostart/Dienst; alle Einstiegspunkte verwenden dieselbe Instanz | `feat(launcher): add managed NETGRID desktop runtime` |
| WIN-I04 Geführtes Setup und Netzwerk | Empfohlenen und benutzerdefinierten Weg liefern | Setupmodus, Local/LAN-Wahl, Portprüfung, Private-Firewallregel, Cleanup-Default und Abschlussstart | UI-Flow-, Portkonflikt- und Firewallprofiltests | Empfohlener Weg fragt nur Pflichtwerte; LAN wird nie still aktiviert | `feat(installer): add guided setup and private network mode` |
| WIN-I05 First Run, Profile und Maintenance | Bestehende Kontomodi sicher konfigurieren | Maintenance-Passwort über sicheren Bootstrap, Auswahl der vorhandenen `simple`-/`protected`-Policy und geführter Erstzugang | First-Run-, Secret-, Policy- und Wiederanlauftests | Installer nutzt die bestehende Accountautorität; Maintenance bleibt separat geschützt | `feat(installer): configure installed-product onboarding` |
| WIN-I06 GitHub-Updater und Rollback | Zustimmungsbasiertes Update | Startprüfung, Stable/Prerelease, Download/Integritätsprüfung, Backup, laufende Matches, kontrollierter Neustart und Rollback | API-Fixtures, Offline-, Tamper-, Backup-/Restore- und Upgrade-Tests | Kein stilles Update; Fehler hinterlässt alten oder sicher gestoppten Stand | `feat(updater): add verified GitHub release updates` |
| WIN-I07 Lokalisierung, Branding und Diagnose | Veröffentlichungsfähige Oberfläche | `de`/`en`/`fr`, Terminologie, NETGRID-Icons/Grafiken, DPI-/Kontrastprüfung, redigierter Diagnoseexport, Drittanbieterhinweise | String-Vollständigkeit, Screenshotmatrix, Diagnose-Leak-Gate, Lizenzcheck | Keine Platzhalter/Clips/rohen Fehler; alle Oberflächen visuell abgenommen | `feat(installer): finalize localization branding and diagnostics` |
| WIN-I08 End-to-End-Releasegate | Saubere Maschine beweisen | Frischinstallation, Custom-Setup, Update, Prerelease, Rollback, Repair, Uninstall, Retention und Datenlöschung auf Windows 11 x64 | vollständige Installer-E2E-Matrix plus bestehende Releaseoutput-Gates | reproduzierbares GitHub-Releaseartefakt samt Prüfsumme; alle Gates grün | `test(installer): certify Windows release workflow` |

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

Die spätere Umsetzung verwendet einen eigenen `codex/`-Branch und einen
eigenen Worktree. Der Hauptworkspace dient nur dem finalen lokalen Merge.
Jedes Paket erhält einen Commit. Vor dem Abschluss wird aktuelles `main`
defensiv integriert, die direkt betroffenen Gates werden wiederholt, der
Arbeitsbranch lokal nach `main` gemergt und anschließend Worktree sowie
gemergter Branch nach den Projektregeln verifiziert entfernt. Ein Push erfolgt
nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Windows-Installer- und Launcher-Prozess vollständig und
sequenziell von WIN-I01 bis WIN-I08 ab und merge den abgeschlossenen
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

Der Prozess ist erst abgeschlossen, wenn alle acht Done-Gates erfüllt, alle
Paketcommits integriert, der Windows-11-x64-E2E-Nachweis grün, der lokale
Main-Stand sauber sowie Arbeits-Worktree und gemergter Branch nachweislich
entfernt sind. Codesigning darf nur für die private Alpha offen bleiben und
muss vor einer breiteren Veröffentlichung als ausdrückliches Release-Gate
geschlossen werden.
