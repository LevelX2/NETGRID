# Paketprozess: Windows-Installer und Launcher

Stand: 2026-09-04  
Status: in Umsetzung; WIN-I00 bis WIN-I07 verifiziert, WIN-I08 aktiv

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
- WIN-I05 bündelt die bestehende Maintenance-Auth-CLI als eng freigegebenen
  Produkt-Entrypoint und installiert einen selbstenthaltenen First-Run-Host.
  Das Passwort wird zweimal verdeckt erfasst und ausschließlich per stdin an
  den bestehenden `bootstrap`-Befehl übertragen; MSI, Argumentlisten und Logs
  bleiben secretfrei.
- First Run prüft zuerst den Initialisierungsstatus und bietet keinen Reset.
  Der isolierte Smoke belegt einen erfolgreichen Scrypt-Bootstrap und die
  bytegleiche Erhaltung des Credentialstores bei einem zweiten abgewiesenen
  Versuch. Ein Startmenüeintrag erlaubt den sicheren Wiederanlauf nach
  „Später“.
- Der benutzerdefinierte Setupweg wählt `simple` oder `protected`, während der
  empfohlene Weg `simple` übernimmt. Der Wert initialisiert nur die vorhandene
  Account-Policy. Persistierte Wechsel über Maintenance bleiben autoritativ;
  im Private-LAN-Profil funktioniert Self-Service, aber Policyverwaltung und
  Maintenance bleiben Loopback-only.
- WIN-I06 prüft beim Launcherstart ausschließlich die GitHub Releases von
  `LevelX2/NETGRID`; ohne Netzwerk bleibt der Spielbetrieb unverändert. Drafts
  werden ignoriert, Vorabversionen nur nach expliziter Einstellung angeboten
  und jedes Update erst nach Zustimmung heruntergeladen.
- Setup, `SHA256SUMS.txt` und `release-metadata.json` müssen im Release
  gemeinsam vorhanden sein und denselben SHA-256-Wert ausweisen. Der Download
  wird erneut gehasht; widersprüchliche oder manipulierte Artefakte scheitern
  vor jeder Installation.
- Ein zufälliges, nur an den Serverkindprozess übergebenes Launcher-Token
  schützt die lokale Readiness-Abfrage. Nicht abgeschlossene Partien blockieren
  das Update sowohl vor als auch nach dem Download.
- Der getrennte Updater wartet auf den kontrollierten Launcher-Stopp, erzeugt
  über die bestehende Storage-Autorität ein geprüftes `pre_update`-Backup und
  führt das MSI-Major-Upgrade aus. Erst ein erfolgreicher Start-/Healthcheck
  ersetzt die lokal gecachte Vorversion. Bei einem nachgelagerten Fehler werden
  Programm und Backup zurückgerollt; kann das nicht sicher abgeschlossen
  werden, bleibt NETGRID mit Diagnose gestoppt.
- WIN-I07 bündelt eine gemeinsame, beim Build auf Schlüssel- und
  Platzhaltervollständigkeit geprüfte Windows-Sprachquelle für Deutsch,
  Englisch und Französisch. Setup erlaubt die Sprachwahl vor dem Assistenten;
  First Run, Launcher, Recovery und Updater folgen der Windows-Sprache mit
  Englisch als explizitem Fallback.
- Setup, installierte Anwendungen, Tray und Verknüpfungen verwenden das
  NETGRID-Icon. Die Setupoberfläche wurde mit echten Renderings für alle drei
  Sprachen bei 100, 125 und 150 Prozent geprüft; lange französische Texte
  führten dabei zu einer korrigierten Gruppen- und Feldgeometrie.
- Der Launcher exportiert nur auf Nutzeraktion ein lokales ZIP mit
  Produkt-/Systemmetadaten, redigierter Runtimekonfiguration und bekannten
  Launcher-/Updaterlogs. SQLite, Spiele, Credentials, Tokens und private
  Kartenbilder sind ausgeschlossen; der Leak-Smoke injiziert und verwirft
  diese Inhalte ausdrücklich.

## Verifikationsregeln

### Offene Windows-Installationsprüfung (2026-09-05)

Der erste erhöhte Lauf scheiterte in `InitializeNetgridRuntime` mit Exitcode 2
(MSI 1603/1722); Windows Installer rollte die Installation zurück. Die
EXE-Custom-Actions verwendeten fälschlich `[CustomActionData]`. Ihre Argumente
sind jetzt an die jeweils vorbereitete Action-Property gebunden, und der
Decompile-Audit prüft diese Bindung ausdrücklich.

Das Vergleichslayout 1.0.8103 wurde manifestgetreu aus seinem MSI rekonstruiert
und mit der korrigierten Installer-Hülle neu paketiert; das neue Paket trägt
1.0.8104. Beide haben den vollständigen Build-/Payload-Audit mit 10.901 Dateien
bestanden. Die korrigierten Vergleichsartefakte liegen unter
`output/windows-installer-e2e/base`, der neue Stand unter
`output/windows-installer`. Das ursprünglich fehlgeschlagene Vergleichspaket
liegt separat unter `base-initialization-failed` und ist keine Testfreigabe.

Nach erneuter Benutzerbestätigung startete der erhöhte Wiederholungslauf.
Empfohlene Installation, Launcher-Health, Datenbehalt, explizite Datenlöschung,
Custom-Installation, Backup, Reparatur des Ausgangsstands, abgewiesener
Upgradeversuch und reguläres Upgrade erreichten ihre Assertions. Die Reparatur
des aktualisierten Stands scheiterte anschließend mit MSI 1706/1603: Als
Installationsquelle war nur das bereits gelöschte temporäre MSI des Setuphosts
registriert. Die Testinstallation wurde danach entfernt.

Die Ursachen-Korrektur speichert das vollständige MSI unter dem geschützten
`config/installer/<ProductCode>` und bindet es über `SOURCELIST`; der
Regressionstest repariert über ProductCode ohne externe Quelldatei und ohne
wiederholte Pfadangaben. Runtimekonfigurations-/Cachetests, Installerneubau,
18 UI-Renderings und der vollständige Audit aller 10.901 Payload-Dateien sind
grün. Der am 2026-09-05 von 15:54 bis 16:07 Uhr bestätigte erhöhte Lauf ist mit
allen 13 Assertions und Exitcode 0 abgeschlossen. Insbesondere funktioniert
die Reparatur des aktualisierten Produkts allein über den ProductCode aus der
geschützten Quelle. Die Testprogramm-/Datenordner und NETGRID-Registrierung
sind entfernt; auf den Testports 32141/32142 verbleibt kein Listener.

Die zusätzliche Prüfung des Updatertransaktionspfads reproduzierte einen
Parserfehler: Der vom Runtimekonfigurator korrekt zitierte `NETGRID_DATA_ROOT`
wurde einschließlich Anführungszeichen als Windows-Pfad verarbeitet. Der
Updater entfernt nun genau ein vollständiges äußeres Anführungszeichenpaar,
bewahrt Gleichheitszeichen in Werten und weist unvollständige Quotes sowie
doppelte Schlüssel strukturiert ab. Der neue Test unter
`tests/windows/Netgrid.Updater.Tests` scheiterte zunächst am echten Parser und
ist nach dem Fix grün; er ist im Installerbuild als Gate eingebunden. Der
Artefaktneubau mit diesem zusätzlichen Fix ist ebenfalls grün, einschließlich
der 18 Renderings und des vollständigen 10.901-Dateien-Payload-Audits. Der
aktuelle Stand liegt weiterhin unter `output/windows-installer`; sein lokaler
MSI-E2E-Nachweis liegt prüfsummengebunden unter
`output/windows-installer-e2e/windows-11-x64-result.json`.
WIN-I08-Commit und lokale Integration bleiben gesperrt, bis die ausdrücklich
geforderten Gates bestanden sind. Der eigenständige MSI-Downgrade ersetzt
keinen echten Updater-Healthfehler mit Programm-/Datenrollback, und ein Lauf auf
diesem Entwicklungsrechner ersetzt keinen Nachweis auf einer sauberen Maschine
ohne Entwicklungswerkzeuge.

### Verbleibender Abnahmeumfang

Vorheriger Kandidat vom 8. September: `output/windows-installer-msidata-8190`
enthält Setup und MSI 1.0.8190 aus dem sauberen Quellcommit
`5b4b84eddfd9e67b720b4ed0c0fff9a2c4bfd17b`. Der separat wiederholte vollständige
Installer-Audit endet nach Korrektur der PowerShell-Modulbindung mit
`WINDOWS_INSTALLER_CHECK_OK files=10902` und Exitcode 0. Die Korrektur
`2f55d8494` betrifft ausschließlich Prüfskript und Runbook; die Binärdateien
wurden nicht neu gebaut oder umetikettiert. Setup-SHA-256:
`b0415526f98dfcbb2e5009e846efc2ce7697edb940f5bfb63dedc1479a8cb4bd`,
MSI-SHA-256:
`960177b25595e8dd91f3bef71b9e9e509161f5e3ec90a048756ee12d8bd0bc42`.
Der ursprüngliche Buildlauf erreichte seine abschließende Metadaten-Ausgabe
nicht; Release-Metadaten und Prüfsummendatei fehlen noch. Der Paket-Audit
ersetzt weder diese Fertigstellung noch die native Abnahme von 8190.
Es wurde in diesem Prüfschritt keine Produktinstallation gestartet.

Die anschließende native Prüfung von 8190 am 8. September ist getrennt davon
unter `output/windows-sandbox-e2e/bb8eccf05f4747369da2d3c3806c1f85/result/`
belegt: `native-8190-retained-install.json` bestätigt den SYSTEM-MSI-Lauf
mit Exit 0 und bytegleich erhaltenen Konfigurations-/Credentialdateien;
`native-8190-retained-verify.json` bindet 10.890 Manifestdateien und die vier
Installerprogramme an den Kandidaten. `native-8190-health-corrected.json`
belegt den installierten Headless-Healthcheck samt striktem Stopp mit Exit 0,
ohne verbleibende Produktprozesse oder Listener. Der erste Health-Aufruf
verwendete im Testskript irrtümlich `--environment` statt
`--environment-file` und wurde vor dem Runtime-Start abgewiesen; er bleibt
als fehlgeschlagener Testaufruf erhalten, nicht als Produkt-Healthfehler.
Das vorhandene WDAG-Konto besitzt einen Administratortoken; diese Prüfung
ersetzt keinen Standardbenutzer- oder alternativen Administrator-Nachweis.

`native-8190-uninstall-start.json` bindet den tatsächlich laufenden Launcher
5872 an seine Startzeit und bestätigt Web 200 sowie Server-Health.
Der anschließende SYSTEM-MSI-Uninstall endet mit Exit 0.
`native-8190-uninstall-verify.json` bestätigt um 02:27:54 UTC: keine
Produktprozesse, keine Listener auf 3100/8787, keine Produktregistrierung,
keine Launcherdatei, erhaltene SQLite-Datei und unveränderte geschützte
Dateien. Es gab keinen manuellen Prozess-Cleanup. Das ist ein nativer
MSI-Lifecycle-Nachweis auf 8190, keine GUI-Uninstall-Abnahme.

Offener Produktfehler, inzwischen ebenfalls nativ belegt: Bei der erneuten
Installation über erhaltene Daten bleibt `config/updates/NETGRID-Setup.exe`
auf einem alten Stand; nur `NETGRID-Setup.pending.exe` entspricht 8190.
Der direkte MSI-/Setupweg besitzt bisher keine Übernahme nach erfolgreichem
Abschluss. Der normale Updater und die Setup-Startmenüverknüpfung verwenden
jedoch die alte aktuelle Datei. Ein manuelles Umbenennen wäre kein Fix.
Benötigt wird eine transaktionsgebundene Cache-Zuordnung einschließlich
Fehlschlag, Repair, direktem Versionswechsel und Updater-Rollback.
Der Test hat keine Cachedatei zur Kaschierung dieses Fehlers umgeschrieben.

Der anschließende Ursachen-Fix verwendet unveränderliche Cacheeinträge je
ProductCode statt globaler aktueller/pending Slots. MSI besitzt den Selektor
`CurrentProductCode` und die produktgebundene Setup-Verknüpfung; Updater und
Absturzreparatur wählen über denselben gemeinsamen Reader. 21 echte
Datei-/HKCU-Cachechecks, 23 Recoveryprüfungen, 407 Lifecyclechecks und fünf
Authoringtests sind grün. Die Runtimekonfigurationssuite besteht unter
Windows PowerShell 5.1; der erste Aufruf unter PowerShell 7 scheiterte an den
vorhandenen Framework-ACL-Methoden des Testskripts, seine eigene temporäre
Fixture wurde gezielt bereinigt. Der MSI-Autorisierungsprobe unter
`output/msi-authoring-probe-ea6bcb2896654c56829257a47f42e3d1` und dessen
WiX-Rückübersetzung bestätigen Registry-Owner, Shortcutbindung und Sequenz.
Diese Probe enthält inerte Dateien und wurde nicht installiert.
Der darauf folgende Produktbuild und die erste native Cacheabnahme sind
unten für 8195 gebunden. Vor dem Zweiversionslauf war zusätzlich die
Dateiversionierung zu korrigieren:
Die produktgebundenen EXEs von 8190 tragen trotz unterschiedlicher
Git-Buildkennung noch durchgehend `FileVersion=1.0.0.0`; unveränderte
Dateiversionen dürfen keinen unbemerkten Verbleib alter Programmbytes erlauben.

Die Buildstrecke setzt inzwischen die native NETGRID-Version aus dem
Produktlayout; der Extraktionsaudit prüft alle fünf EXE-Versionsressourcen.
Das ursprüngliche 8190-Launcherbinary wird vom neuen Gate wie erwartet
abgewiesen. Eine ausschließlich lokale RuntimeConfig-Versionsprobe mit
`Version=1.0.8194` besteht den Positivfall; sie ist kein Releasekandidat.
Das MSI definiert zusätzlich `REINSTALLMODE=amus` für seinen unveränderlichen
Programmoutput einschließlich Rückkehr auf ältere Dateiversionen. Fünf
Authoringtests inklusive negativer Austauschpolicy sind grün. Der neue
Gesamtbuild ist inzwischen grün; native Upgrade-/Downgrade-Hashnachweise
stehen noch aus.

Aktueller Kandidat: `output/windows-installer-cache-version-8195`, Version
1.0.8195, sauberer Quellcommit `eb610097458601b477527b3d060e44c3fed497cc`.
Der vollständige Build ohne `SkipReleaseBuild` endet mit Exit 0,
`WINDOWS_INSTALLER_CHECK_OK files=10902` und `WINDOWS_INSTALLER_BUILD_OK`.
Release-Metadaten und `SHA256SUMS.txt` sind regulär erzeugt. Setup-SHA-256:
`4c35f8475b4a818ba3520c0a1ceb2ba502c86c06aef06f807e63dc95db144ff2`,
MSI-SHA-256:
`efff406345bb26a6743ad9e7763c490ab282a747ceaeca62620b97898c963a6c`.

Die native Wiederinstallation über erhaltene Daten im bestehenden Sandboxlauf
`bb8eccf05f4747369da2d3c3806c1f85` besteht am 8. September um 03:04:54 UTC.
`native-8195-cache-install.json` und `native-8195-cache-verify.json` belegen
MSI-Exit 0, 10.890 Manifestdateien, vier identische native Buildhashes mit
Dateiversion 1.0.8195.0 und unveränderte Konfigurations-/Credentialdateien.
Der registrierte ProductCode `{CCC80DA0-D45B-44DF-92C9-6D98C0670511}` wählt
den passenden Setupcachehash; die tatsächliche Setup-Verknüpfung zeigt auf
genau diesen Eintrag. Alte globale Cachedateien wurden nicht umbenannt.
Der erste Probeaufruf hatte die absichtlich erhaltenen Registry-Präferenzen
fälschlich als installierte Anwendung behandelt. Die reine Diagnose belegt
nur `RuntimeDataRoot`, Desktoppräferenz und Sprache ohne ProductCode,
Programmregistrierung oder Launcher. Der korrigierte Preflight lässt genau
diese erhaltenen Werte zu; der fehlgeschlagene Probebericht bleibt erhalten.

Die nachfolgende Reparatur ausschließlich per ProductCode, ohne übergebene
Programm-/Datenpfade oder Setupquelle, endet um 03:09:47 UTC mit Exit 0.
`native-8195-cache-repair.json` und `native-8195-cache-verifyrepair.json`
belegen danach erneut alle Manifestdateien, nativen Hashes und Versionen,
denselben Cache-/Shortcutselektor und unveränderte geschützte Dateien.
Auch der Änderungszeitpunkt des unveränderlichen Setupcacheeintrags bleibt
identisch. Diese Nachweise gelten für den SYSTEM-MSI-Lauf in dieser Sandbox,
nicht für eine Standardbenutzer-/UAC-Abnahme.

`native-8195-cache-health.json` bestätigt anschließend um 03:11:25 UTC den
installierten Headless-Healthcheck mit Exit 0 und striktem Prozess-/Listener-
Stopp. Konfiguration und Credentials bleiben bytegleich. Das WDAG-Konto
besitzt weiterhin einen Administratortoken; normal privilegierter Neustart
nach echter Updater-Erhöhung ist damit nicht nachgewiesen. 8195 bleibt in
der Sandbox als gestoppte, geprüfte Basis für den nächsten Versionswechsel
installiert. Die Host-Hauptinstanz bleibt unangetastet.

Der Standalone-E2E-Harness verwendet jetzt echte MSI-Aufrufe statt veralteter,
ungebundener Setup-Updateroptionen. Seine Negativprobe verlangt die konkrete
Diagnose des verbotenen Programmordnerwechsels, nicht irgendeinen Fehlercode,
und wird nicht als Rollback bezeichnet. Nach Install-/Repair-/Versionsschritten
prüft er Quellcommit, Manifestdateien, native Hashes und Dateiversionen sowie
Setupcache und Shortcutziel.
Fünf Harness-Vertrags-/PowerShell-Syntaxchecks bestehen ohne Installation.
Die neue vollständige Zweiversionsmatrix und der getrennte produktgebundene
Tray-/Updaterlauf sind dadurch nicht bereits nativ abgenommen.

Der reguläre Gegenbuild 1.0.8196 unter
`output/windows-installer-msi-matrix-8196` stammt aus dem sauberen Commit
`4ade46c0646abf432595569bffa860c0e95bd154`. Vollständiger Build ohne
`SkipReleaseBuild`, Komponenten-/UI-Gates und 10.902-Dateien-Audit bestehen;
Metadaten und Prüfsummen sind regulär erzeugt. Setup-SHA-256:
`41d81af3eb3a2134ae845c10c24fe40a685c2b9aa14cc2c5a970377a9bc5e764`,
MSI-SHA-256:
`a5bc24ef7e04fbc343fad7ebbb00eea7752f911d19dbd6f0db465c16694e7695`.
Der Kandidat ist gebaut, aber wegen des folgenden nativen Fehlers nicht
freigegeben.

Im selben Sandboxlauf belegt `native-8195-upgrade-readiness.json` rein lesend
null offene Partien. `native-8195-8196-rejectroot.json` bestätigt die konkrete
Ablehnung `installation_gate_upgrade_root_changed` mit MSI-Exit 1603 und
anschließend unveränderten 8195-Dateien, Cache und geschützten Daten.
Der danach gestartete echte Standalone-MSI-Versionswechsel 8195 → 8196
scheitert jedoch am gebundenen Healthcheck:
`NETGRID_MSI_DATA_ERROR code=installation_gate_msi_data_health_failed`.
Dies war kein injizierter Fehler. Der Upgrade-Test bleibt rot.

Windows Installer führt danach seine tatsächliche Rücknahme einschließlich
`NETGRID_MSI_DATA_OK operation=restore` und
`NETGRID_LIFECYCLE_ROLLBACK released=True` aus. Der MSI-Prozess endet um
03:32:25 UTC mit 1603. `native-8195-8196-verifyfailedupgrade.json` bestätigt
anschließend um 03:38:49 UTC den vollständig zurückgekehrten 8195-Stand:
10.890 Manifestdateien, vier native Hashes/Versionen, ursprünglicher
ProductCode, unveränderter Setupcache einschließlich Änderungszeitpunkt,
korrektes Shortcutziel, bytegleiche Konfiguration und Credentials sowie keine
Produktprozesse oder Listener. Die ursprüngliche Snapshot-ID
`a5ca54e69f184b938b0228beb6aa04d1` ist über die abgeschlossene Lease mit
`restored` und Manifesthash
`b0ccd814d901babf7cb2c4302f0627f4da105f765f3416a3d41062b3bcd0e995` gebunden.
Es gab keine manuelle Prozessbeendigung oder Registryreparatur.

Zum Zeitpunkt dieses MSI-Laufs war die Ursache des fehlgeschlagenen
Verifier-Abschlusses noch nicht bewiesen; die anschließende Eingrenzung folgt unten.
Die erhaltene Fehlstand-Sicherung
`f378dc7ef9984bbf93624774aaa0f02d` zeigt Webbereitschaft um 03:31:10 UTC,
Serverbereitschaft kurz danach und den angeforderten Serverstopp um
03:31:11 UTC. Der Verifier meldet erst um 03:31:31 UTC Fehler. Der normale
Headless-Pfad verschluckt die konkrete Ausnahme bisher hinter Exit 2; diese
Diagnoselücke muss vor einer belastbaren Ursachenbehebung geschlossen werden.
Die rein gefilterte Verbindungsevidence `native-8196-websocket-audit.json`
enthält in diesem Zeitfenster nur Serverstart/-stopp, keine WebSocketöffnung.
Ein WebSocket-Stoppfehler ist damit nicht als Ursache belegt. Die ältere
Diagnose-JSON enthält versehentlich PowerShell-Stringmetadaten und ist sehr
groß; nur ihre Stringwerte beziehungsweise die gefilterte Folgeevidence lesen.
Keine fehlgeschlagene Installation erneut starten, bevor Ursache und
Reproduktionspfad eingegrenzt sind. Standalone-Downgrade und geplante
Prüfsummen-Fehlerinjektion wurden nicht ausgeführt.

Unabhängig davon wurde eine konkrete Snapshot-Abgrenzungslücke reproduziert:
`config/installer` gehörte bis 8196 irrtümlich zum Live-Dateninventar.
Der gemeinsame `UpdateDataLayout`-Owner schließt jetzt auch diesen
MSI-Reparaturcache aus; Snapshot und Restore verändern seine eigenen oder
neu hinzugekommenen Cachedateien nicht. Überschneidungen mit Live-Daten- oder
Backup-Overrides werden abgewiesen. Der neue Test scheitert zuerst mit
`manifest_msi_cache_target_accepted`; nach dem Ursachen-Fix bestehen alle
122 Snapshot-/Restore-Prüfungen, die Updater-/Cache-/Recoveryprüfungen und
die Übergabe-/Verifier-Suite einschließlich 71 MSI-Datentransaktionschecks.
Die Builds 8195/8196 enthalten diesen Fix nicht. Ihre native Rücknahme ist
daher kein vollständiges Testat des korrigierten Snapshotvertrags; neue
Builds und native Wiederholung bleiben nötig. Alte Snapshots werden nicht
konvertiert. WIN-I08 bleibt aktiv, Main und Remote bleiben unverändert.

### Eingegrenzter HTTP-Stoppfehler und Ursachen-Fix (2026-09-08)

`native-8195-stop-repeat.json` reproduziert den Fehler bereits beim ersten
unveränderten Headless-Lauf von 8195 ohne MSI: Exit 2 nach 21.537 ms.
`native-launcher-stop-diagnostic.json` bindet den Timeout an den Server:
`launcher_child_stop_failed:server` mit innerer `TaskCanceledException` nach
zehn Sekunden; der Webprozess beendet sich. Die gewöhnliche nachfolgende
Dispose-Bereinigung benötigt weitere zehn Sekunden. Sie ist kein erfolgreicher
strikter Stopp und darf nicht als solcher gewertet werden.

Der gesonderte Node-Vorabimport in der Sandbox protokolliert ausschließlich
Lebenszyklusereignisse, Ressourcenarten und Byte-/Anfragezähler, keine URLs,
Header, Inhalte oder Zugangsdaten. `native-launcher-stop-sockets-events.json`
zeigt am 08.09. um 03:56:51 UTC drei angenommene TCP-Verbindungen. Zwei
abgeschlossene HTTP-Verbindungen schließen sofort; die dritte hat zunächst
null gelesene/geschriebene Bytes und keine Anfrage. Sie bleibt offen und
bearbeitet anschließend im Abstand mehrerer Sekunden weitere Anfragen.
Der HTTP-Close-Callback wird nicht erreicht. Damit liegt die belegte Ursache
im HTTP-Verbindungsabschluss, nicht in `stdin.pause()` oder einer
nachgewiesenen WebSocket-Verbindung. Direkte Server-/Webstarts ohne diese
Vorabverbindung hatten den Hänger nicht reproduziert.

`HttpConnectionDrain` besitzt jetzt am HTTP-Einstieg die angenommenen
Verbindungen und noch nicht abgeschlossenen Antworten. Beim Stopp schließt
er Vorabverbindungen und unvollständige Header ohne angenommene Anfrage;
bereits angenommene, auch gepipelinete Antworten laufen vollständig aus.
Spätere HTTP-Anfragen gelangen nicht mehr zur Anwendung und erhalten 503
mit `server_stopping`. Upgrades verlassen diese Ownership zugunsten von
Realtime. Kein Prozess-Kill, längerer Timeout oder Fehler-Fallback ersetzt
den strikten Abschluss.

Checks: Die zwei echten HTTP-Reproduktionen scheitern vor dem Codepatch mit
`timeout` statt `stopped`. Anschließend bestehen zehn Tests aus
`http-shutdown.test.ts`, `http-connection-drain.test.ts` und
`update-readiness.test.ts`, einschließlich vollständiger Antworten trotz
Pipelining, spätem Request und separater Upgrade-Ownership. Der
Server-Typecheck und `git diff --check` sind grün.

`native-fixed-server-stop.json` und dessen Binding belegen fünf sequenzielle
Sandboxläufe um 04:03:33–04:03:38 UTC. Der neue Server wird als separate
Quellfixture gebündelt; Sharp ist ausdrücklich auf die bereits installierte
Abhängigkeit gebunden. Installierte Programmdateien werden nicht ersetzt.
Der reale Node-Prozess, installierte Webclient und unveränderte
Launcher-Laufzeit führen Start, Health und `StopForVerificationAsync` aus;
eine zusätzliche TCP-Vorabverbindung bleibt bis zum erfolgreichen Stopp
absichtlich im Prüfer offen. Gemessene Stoppzeiten: 31, 23, 27, 22 und 33 ms;
Server-Exit jeweils 0, beide Prozesse bereits nachweislich beendet.
Fixture-SHA-256:
`6c9e5b03d3e9f9e3daf313af315044ce905a3a35f30984f0d4868faf4d0fa5a0`.
Das Binding bestätigt unveränderte `runtime.env`/Maintenance-Credentials,
null verbleibende Produktprozesse und null Listener. Die installierte
Version bleibt 8195. Diese Diagnosefixture ersetzt nicht die Abnahme neuer
MSIs; die anschließende Headless-Fehlerdiagnose ist unten beschrieben. WIN-I08,
Main-Integration und Remote bleiben unverändert offen.

### Dauerhafte Headless-Fehlerdiagnose (2026-09-08)

Der tatsächliche Headless-Einstieg verwendet jetzt `HeadlessVerification`.
Er erfasst die fehlgeschlagene Phase und führt die Runtime-Bereinigung
separat aus. Primärfehler bleiben auch bei einem zweiten Dispose-Fehler
erhalten; Bereinigungsfehler verhindern weiterhin Erfolg. Nur fest
klassifizierte Felder werden nach Abschluss als einzelne stderr-Zeile
ausgegeben. Kennwörter, Umgebungswerte, Pfade und rohe Exception-Nachrichten
bleiben ausgeschlossen.

`UpdateVerification` besitzt den gemeinsamen begrenzten Wire-Vertrag.
`UpdateVerifier` fordert stderr-Umleitung ausdrücklich an, liest parallel
zum laufenden Kind und hält höchstens 256 Zeichen im Diagnosepuffer. Er
prüft die vollständige Ausgabe gegen die feste Grammatik und gibt nur einen
validierten `installation_gate_verification_*`-Code an den bestehenden
MSI-/Updater-Fehlerpfad. Fehlende Ausgabe bei einem fehlerhaften Prozessende
bleibt ein generischer negativer Healthausgang; beliebige, mehrzeilige,
überlange oder mit Exit 0 widersprüchliche Ausgabe wird abgewiesen.

Die fokussierten Launcher-Gates bestehen, einschließlich 15 neuer
Headless-Prüfungen mit echter Program-Dispatch-Prüfung, Phasenerhalt,
primärem Server-Timeout und zusätzlichem Bereinigungsfehler. Die
Übergabesuite besteht einschließlich 139 nativer Verifierprüfungen gegen
isolierte HKCU-/Prozess-/Pipe-Fixtures und 71 MSI-Datentransaktionschecks.
Die Diagnosefixtures prüfen feste Formatfelder, Geheimnisschutz und die
unveränderte Weitergabe durch `UpdateSession.DiagnosticCode`; echte Kinder
decken gültige, ungültige, 64-KiB-lange und mit Erfolg widersprüchliche
stderr-Ausgabe sowohl für normale Update- als auch direkte MSI-Leases ab.
Ein neues Installerbuild und dessen native Installation bleiben erforderlich.

### Nachfolgendes Gate 8199 → 8200: Commit-Reihenfolge korrigieren

Der reguläre, saubere Build 8200 aus `e7555ed85b8322e748ae8d624e20a5dddfeea575`
liegt unter `output/windows-installer-msi-pair-8200`. Setup-SHA-256:
`3c4c33bcac5ce20b7853ac2f18b9df453cfe45dfe20755ccbef7d58cc634795a`,
MSI-SHA-256:
`c6e3c925bd693ebb0dc2738aa24216eb3572e3a9c13b9fa9ed1a27cf98c0cc00`.
Die regulären Build-/Payload-/UI-Gates sind grün. Im bisherigen Sandboxlauf
`bb8eccf05f4747369da2d3c3806c1f85` bestehen die Rootwechsel-Ablehnung und
anschließend erstmals `MSI_DATA_OK capture` sowie `MSI_DATA_OK verify` im
echten Upgrade. Der Lauf endet am 2026-09-08 um 04:54:07 UTC dennoch mit MSI
1603: Der zweite Commit-Callback findet nach dem ersten, freigebenden Commit
keinen aktiven MSI-Owner mehr. Rollback meldet `released=False`, keinen Restore.

`native-8200-commit-failure-state.json` belegt um 04:57:18 UTC lesend:
8199-Registrierung und alle 10.890 Programmdateien wiederhergestellt,
Konfiguration/Credentials unverändert, keine Produktprozesse oder Listener.
Lease `completed`, MSI-Bindung leer, Datenphase weiterhin `verified`.
Snapshot `92a28c8ce8e24aa3ac1077827bc909dc` ist hashgeprüft; `config/installer`
ist ausgeschlossen und fehlt im Snapshotpayload. Es wird weder ein
Datenrestore noch ein erfolgreicher Versionswechsel behauptet.

Ursachenfix: Den äußeren Commit erst nach der verschachtelten Entfernung
einreihen, unmittelbar nach Verify vor InstallFinalize. Die strenge
Ownerprüfung wird nicht gelockert. Der neue Quellregressionstest ist vor der
Änderung rot, danach sind sechs Quell-/Binarytests und 407 Lifecyclechecks
grün. Auch das neue echte MSI-Sequenzgate weist das alte 8200 mit
`installer_lifecycle_sequence_invalid:CommitNetgridLifecycle` ab.
Die korrigierte MSI-Tabelle und der native Upgrade-Pilot sind anschließend
grün (siehe unten); WIN-I08 bleibt aktiv, kein Push oder Main-Merge.

### Build 8201: korrigierter MSI-Abschluss nativ grün

Der reguläre Build aus `2a97297113a3e93c14498bfe40381fc0eb101f2d` liegt sauber
unter `output/windows-installer-commit-order-8201`. Alle regulären Gates
bestehen, einschließlich 10.902 Payload-Dateien, 185 Strings in drei Sprachen
bei drei Skalierungen, sechs Lifecycle-Quell-/Binarytests und 407
Lifecycle-Komponentenchecks. Die echte MSI-Tabelle bestätigt
`RemoveExistingProducts=6501 < VerifyNetgridLifecycle=6598 <
CommitNetgridLifecycle=6599 < InstallFinalize=6600`. Der separate inerte
Authoring-Probe `msi-authoring-probe-8127c59e40214bfa89cdd98188167285` bestätigt
dieselbe Reihenfolge und wurde nicht installiert.

- Setup-SHA-256:
  `f077cee9b8a84b7df202130fec17965640a840cb04ba930d738a8932163fdc10`.
- MSI-SHA-256:
  `fa09b84cda930f85f3317a411a41cd421121f4459f742264ce37d09f9880cc25`.

Die unveränderten Artefakte liegen hashgeprüft in `candidate-8201` des
bisherigen Sandboxinputs. Vor dem Pilotupgrade bestätigen fünf tatsächliche
8199-Headless-Läufe nach dem vorherigen Abbruch Exit 0 und leeres stderr
(`native-8199-post8200-health.json`, 05:10:16 UTC). Kein Datenrestore wird daraus
abgeleitet. Das Pilotfixture `test-native-8199-8201-msi.ps1` lässt nur
Rootwechsel-Ablehnung, Upgrade und dessen Verifikation zu: Kein Downgrade auf
die alte, fehlerhafte Commit-Reihenfolge von 8199.

Am 2026-09-08 um 05:16:59 UTC ist die Rootwechsel-Ablehnung grün, einschließlich
aller unveränderten alten Dateien und Caches. Das echte Upgrade endet um
05:21:34 UTC mit MSI 0, erfolgreichem Capture/Verify und ohne Commitfehler.
`native-8199-8201-verifyupgrade.json` bestätigt um 05:22:20 UTC:

- 1.0.8201, ProductCode `{2A5E60ED-DF1E-4539-A301-FBB855136B6C}`;
- alle 10.890 Manifestdateien sowie vier native Hashes/Dateiversionen korrekt;
- Registrierung, Original-MSI-Cache, Setupcache und Setup-Startmenüziel korrekt;
- alter Setupcache einschließlich Änderungszeit und sämtliche vorherigen
  MSI-Caches unverändert;
- Snapshot `e3754fb62f214570b7ff2860b88f1380`, Manifest-SHA-256
  `1a53bde7be538af667c6baabd4a38b2d352da5e650fe401453267bff0667e1f8`,
  Datenphase `verified`, Lease `completed`, MSI-Bindung freigegeben;
- MSI-Cache im Snapshot ausgeschlossen, keine Produktprozesse/Listener,
  Konfiguration und vorhandene Credentials bytegleich erhalten.

Es wurden weder Prozesse manuell beendet noch Registry-/Datenzustände
repariert. Dieser Sandbox-SYSTEM-Pilot belegt den direkten Upgrade-Fix,
nicht Standardbenutzerbetrieb, GUI-/Tray-Updater, Downgrade oder Fehlerrestore.
Als Nächstes ist ein zweiter korrigierter Build für Upgrade, Downgrade und
gezielte Fehlertransaktion erforderlich. Host-Port 3100 bleibt bei PID 25276;
Main und Remote sind unverändert, WIN-I08 bleibt offen.

### Regulärer Build 8199: Installation, Repair und Headless nativ grün

`output/windows-installer-stop-diagnostic-8199` ist regulär aus dem sauberen
Commit `e5b86f6e268505160ef241746d74468f9551209f` gebaut. Der Lauf endet mit
Exit 0 einschließlich Produktoutput, 122 Snapshotprüfungen, 42
Diagnosecodecprüfungen, 139 nativen Verifierchecks, Setup-/First-Run-/Launcher-
und Lifecycle-Gates, Laufzeitsmokes, 185 Sprachtexten in de/en/fr,
Layoutmatrix 100/125/150 Prozent und dem vollständigen 10.902-Dateien-
Installer-Payloadaudit. Die Quellfixes für HTTP-Drain und MSI-Cacheausschluss
sind enthalten; die offizielle Node-Laufzeit bleibt 24.20.0.

- Setup-SHA-256: `ab54d80ab7f26320f4e76fbd42b42c0d4ba57e57ef75ac37d5d53f288c7192e2`
- MSI-SHA-256: `a8e6d73808a543ac979c5b38bfd04757a13ef780da205f587a731ca82b8054b9`
- Produktmanifest-SHA-256: `046f655b8b4ed7ac0bef51a5f71feeb4eade68d68bc5636ae72989065f55d8c7`

Die Dateien und Metadaten liegen zusätzlich hashgleich im bestehenden
Sandboxeingang `candidate-8199`. Das explizite Fixture `test-native-8199.ps1`
wurde mit Windows PowerShell 5.1 geparst und prüft den SYSTEM-SID, die
Artefakt-/Quellidentität, ruhende Produktprozesse und beide geschützten
Dateien gegen die bestehende Retentionbaseline. Es nimmt keine manuellen
Programm-, Konfigurations-, Kennwort- oder Registryänderungen vor.

`native-8199-removeold.json` und `native-8199-verifyretained.json` belegen
die normale ProductCode-Deinstallation von 8195 mit erhaltenen Daten um
04:22:43 UTC. `native-8199-install.json` belegt die Neuinstallation von 8199
um 04:25:52 UTC, MSI-Client und -Server jeweils 0. Der Schritt ist ausdrücklich
kein Upgradebeleg: Er ersetzt die alte Basis mit abweichendem Snapshotvertrag.
`native-8199-verify.json` prüft danach sämtliche 10.890 Manifestdateien,
die tatsächlichen vier nativen Dateiversionen und -Hashes, den registrierten
ProductCode `{3F1D49C5-F6B2-401C-9422-4F255152227D}`, den Setupcache und die
darauf gebundene Setup-Verknüpfung.

Die ProductCode-Reparatur `/fa` ohne Quellen-/Rootargumente endet um
04:30:33 UTC mit MSI 0. `native-8199-verifyrepair.json` bestätigt erneut alle
Dateien sowie denselben Cacheinhalt und dessen unveränderte Schreibzeit
`2026-09-08T04:25:49.7670920Z`. Die fünf anschließenden echten installierten
`NETGRID.exe --headless-verify`-Läufe in `native-8199-health.json` enden alle
mit Exit 0 und leerem stderr. Ihre gesamten Prozesslaufzeiten sind 2437,
1484, 1467, 1450 und 1461 ms; nach jedem Lauf sind Produktprozesse und beide
Listener nachweislich beendet. Das ist kein Standardbenutzer-Testat.

`native-8199-diagnostic.json` bestätigt um 04:32:38 UTC den negativen
Diagnosepfad des tatsächlich installierten Launchers: Eine ausdrücklich
nicht vorhandene separate Runtime-Datei führt ohne Runtime-Start nach
159 ms zu Exit 2 und genau
`NETGRID_VERIFICATION_ERROR stage=load code=invalid_state cleanup=ok`.
In allen Phasen bleiben `runtime.env` und bestehende Maintenance-Credentials
bytegleich. Die native Weitergabe eines solchen Fehlers durch den MSI-/
Updaterprozess ist damit noch nicht zusätzlich bewiesen. Der Hostbetrieb
bleibt unverändert (Web 3100, PID 25276); kein fremder Prozess wird beendet.
Eine zweite korrigierte Installer-Version und deren native Versionswechsel,
Rollback sowie die übrigen WIN-I08-Gates bleiben erforderlich. Kein Push,
Main-Merge oder Worktree-Cleanup.

| Nachweis | Aktuelle belastbare Evidenz | Noch erforderlich |
| --- | --- | --- |
| Produktgrenze und Installer-Payload | Builds 8136 und 8145 regulär aus sauberen Quellständen gebaut, jeweils 10.901-Dateien-Audit und Setup-/MSI-Prüfsummen grün; installierte Binärdateien zusätzlich für 8136 gebunden | Für beide Builds erfüllt; keine Versions-/Hash-Umetikettierung |
| Installation, Upgrade und Repair | Vollständiger 13-Punkte-Sandboxlauf 8145 → 8150 am 2026-09-07 einschließlich ProductCode-Repair und geprüftem Cleanup grün; alle vier Artefakthashes erneut verglichen. Zusätzlicher installierter Sprachwechsel-/Shortcut-/Repairtest 8145 grün | Für 8145 → 8150 erfüllt; native funktionale UI-Gates bleiben getrennt |
| GitHub-Updateauswahl und Integrität | Aktueller Downloadfix und Stable-/Prerelease-/Tamper-Fixtures grün; native deutsche Offline-Rückmeldung auf 8136 bestätigt; höherer regulärer Kandidat 8145 gebaut und lokal geprüft | Echter zustimmungsbasierter GitHub-Download/Update; GitHub-Übertragung am 7. September freigegeben, Testrelease erst nach Abschluss der übrigen Prüfungen; netzfähige isolierte Testumgebung erforderlich |
| Updatertransaktion und Rollback | Echter Sandboxlauf 8145/8150 am 2026-09-07 grün: geprüftes Backup, MSI-Upgrade, bewusst beschädigte Testdatenbank, erkannter Healthfehler, Programmrollback auf 8145, Datenmarker und SQLite-Integrität wiederhergestellt, Konfiguration unverändert, Cleanup verifiziert | Transaktionsgate für 8145/8150 erfüllt; abschließende Benachrichtigung bleibt ein separater Dialogtest |
| Benutzerbetrieb und Netzwerk | Standardbenutzerbetrieb und ACLs für installierten 8145-Basisstand im neuen Rollbacklauf grün. Private-LAN-Test des installierten 8150: Web/Server vom Host erreichbar, Maintenance mit 403 abgewiesen; im öffentlichen Profil beide Ports bei weiterhin gesunden lokalen Diensten blockiert. Testinstallation, Ports und NETGRID-Regeln bereinigt; temporär deaktivierte pauschale Sandbox-Containerfreigabe wiederhergestellt | Netzwerkbeleg für 8150 einschließlich dokumentierter Sandbox-Firewallvorbereitung erfüllt; Standardbenutzerbeleg ausdrücklich auf Basis 8145 gebunden |
| Nativer Setup-/Fortschrittsworker | 8150 über deutschen Setup-Host im sauberen Gast installiert, MSI-Client/Server jeweils 0; echter Abschnittsfortschritt von 51 Prozent um 15:21:32 UTC sichtbar aufgenommen, Datenhinweis und Status/Balken getrennt. Direkter MSI-Countertest grün | Nativer deutscher Fortschrittsnachweis erfüllt; Windows-UAC mit alternativem Administrator und weitere native Fehler-/Abbruchpfade bleiben getrennte Prüfungen |
| Launcher, Browser und Diagnose | 8150: normaler Desktopstart, einzelne Instanz, nativer SaveFileDialog und redigierter ZIP-Export grün. Tray-Beenden und Desktop-Neustart grün. Erster Serverabbruch wird automatisch wiederhergestellt; zweiter stoppt beide Dienste mit nativem deutschen Recovery-Dialog, „Wiederholen“ startet erfolgreich. Fehlende Edge-ProgID ausschließlich im Gast ergänzt | Gastvorbereitung transparent erhalten; dies ersetzt nicht sämtliche Sprach-/DPI-/Kontextvarianten oder alle Aktionen des Recovery-Dialogs |
| First Run | Nativer deutscher vorgeschalteter Entscheidungsdialog auf 8150 beobachtet; Nutzer bestätigt Abschluss, Setup beendet mit Exitcode 0. Hashgebundene reine Statusabfrage bestätigt eingerichteten Maintenance-Zugang, kein Agent-Bootstrap/Reset | Unbeobachtete Passwort-/Zurück-/Sichtbarkeitsschritte nicht nachträglich als abgenommen ausgeben; Authentifizierungsbedienung durch Nutzer, vorhandene Zugangsdaten erhalten |
| Native Deinstallation bei laufendem Launcher | 8190: SYSTEM-MSI-Uninstall bei laufendem Launcher nativ grün; anschließend keine Produktprozesse, Listener oder Produktregistrierung, Datenbank und geschützte Dateien erhalten, kein manueller Prozess-Cleanup. 8150: frühere de/en/fr-Ansicht und Abbrechen grün | Direkter MSI-Lifecycle für diesen Kontext belegt. GUI-Setup-Uninstall erst nach Korrektur der nativ nachgewiesenen veralteten Setup-Cache-Zuordnung; andere Windows-Benutzerkontexte bleiben getrennt |
| Sichtbare Flows | 8150: Sprachauswahl und Setup-Hauptformular in allen 18 Kombinationen de/en/fr × echte 100/125/150 Prozent × heller/dunkler Systemkontext nativ geprüft. 8145: installierter Sprachwechsel fr → de → en, Repair, Sprachübernahme aller drei Komponenten und Austausch lokalisierter Shortcutnamen mit sieben Prüfungen grün; Tooltip-Renderings und native Tastatur-Popups vorhanden | Übrige Komponentendialoge, funktionale Gesamtflows und Hover-/Tastatur-Randfälle bleiben offen; Hovereingabe ist im verfügbaren Computer-Use-API nicht vorhanden und benötigt Nutzerbedienung |
| Saubere Windows-11-x64-Maschine | Vollständige 13-Punkte-MSI-Matrix 8145 → 8150 einschließlich Cleanup grün: Windows 11 Enterprise x64 (26100), ohne Entwicklungswerkzeuge; Standardbenutzer-/Rollback- und Private-LAN-Test zusätzlich grün. Native Frischinstallation 8136 und installierter Sprachwechsel 8145 separat bestanden | Artefaktgebundene Nachweise nicht pauschal auf spätere Builds übertragen; finale Abnahme bleibt offen bis alle obigen Ergänzungen vorliegen |

Diese offenen Anforderungen werden nicht durch engere grüne Tests ersetzt.

### Scroll-Fix: Artefakt- und native Nachprüfung 8148

Am 7. September wurde `1.0.8148` regulär aus dem sauberen Commit
`c09bd9816243b515d32620c998305c202e9aa50e` nach
`output/windows-installer-scroll-review` gebaut. Der vollständige Build
endete mit Exitcode 0: Produktoutput, Setup 1.967 Assertions, First Run 63,
Launcher-/Updatertests, Runtime-/Launcher-/First-Run-/Updater-Smokes,
173 Sprachtexte, 27 geometrische Vorschauen und 10.901-Dateien-Payload-Audit
sind grün. Metadaten bestätigen `sourceDirty: false`; die tatsächlichen
Artefakte wurden danach erneut gehasht:

- Setup: `c1c7a9c9bcccb5b2dd878e51129b2d52054ad1a4a51aa5ba471c0c1bf3ba0d45`
- MSI: `14a90d4cf88026b928c1d8d37d694b80310c881f2331bb616c436fc785310669`

Die freigegebene Hostprüfung zeigte ausschließlich den Setup-Host, ohne
Installation, First Run oder Launcher. Unter echter Windows-Skalierung
150 Prozent wurden de/en/fr jeweils frisch über die Sprachauswahl geöffnet.
Alle drei Formulare zeigen am maximalen Scroll-Ende jetzt die vollständigen
Desktop-/Abschlussoptionen samt Hilfeschaltflächen oberhalb des festen
Fußbereichs. Die angeklickte deutsche Abschlussstart-Hilfe ist erreichbar,
mehrzeilig und innerhalb des Bildschirms. Damit ist der konkrete
Scrollgrenzenfehler von 8145 nativ für 8148 behoben nachgewiesen.
Frisch geöffnete deutsche Formulare wurden zusätzlich bei echten 125 Prozent
(einschließlich Custom-Auswahl und aktivierter Felder) sowie 100 Prozent
geprüft; Abschlussoptionen und Fußbereich waren sichtbar.

Die vollständige visuelle Freigabe von 8148 bleibt dennoch offen: Bei
150 Prozent werden längere ausgewählte Aufbewahrungs-/Spielerprofiltexte im
geschlossenen Auswahlfeld teilweise abgeschnitten, insbesondere in en/fr.
Die anschließende Ursachenprüfung und Quellkorrektur sind unten beschrieben;
sie verändern das bereits gebaute Artefakt 8148 nicht.
Diese Prüfung hat weder sämtliche Kombinationen aus Sprache, DPI und Design
noch die weiteren funktionalen Installerflows abgenommen. Dunkles Design
wurde in diesem Lauf nicht erneut aktiviert. Ein GitHub-Testrelease wurde
nicht erstellt; die gesonderten übrigen WIN-I08-Gates bleiben bestehen.

Die Hostanzeige ist abschließend verifiziert auf 100 Prozent, 1920 × 1200,
Apps und Windows hell. Nachtmodus blieb eingeschaltet; Bildschirmzuordnung
und sonstige Einstellungen wurden nicht verändert. Alle eigenen
8148-Setupfenster sind nachweislich geschlossen. Baseline und strukturierte
Prüfnotizen: `output/host-display-review-8148`.

### DPI-Referenz und Auswahlbreiten: Quellprüfung vom 7. September

Ein neuer Test öffnet die tatsächlichen WinForms außerhalb des sichtbaren
Bildschirms und misst ihre native `DeviceDpi`, statt `Form.Scale` aufzurufen.
Vor der Korrektur blieb das 90-Pixel-Portfeld bei echten 144 DPI nur
90 statt 135 Pixel breit. Bereits bei 96 DPI benötigte die längste
französische Aufbewahrungsoption 239 Pixel, das Feld bot nur 210 Pixel.
Die fehlende 96-DPI-Designreferenz und die nicht aus dem vollständigen
Sprachinhalt bestimmte Auswahlbreite waren damit getrennt reproduziert.

Sprachauswahl, Setup und Deinstallation setzen nun ihre Designreferenz nach
dem vollständigen Layoutaufbau. Das Setup begrenzt seine Größe auf die
Arbeitsfläche und bestimmt die Breite beider Auswahlfelder aus sämtlichen
Texten, aktueller Schrift und DPI-skalierten Bedienelementrändern.
Die benötigte Breite ist auch als Mindestbreite verankert. Das verhindert
die im ersten 125-Prozent-Lauf aufgedeckte vorübergehende Nullbreite während
der Layoutneuberechnung; UI-Callbackfehler scheitern im Test unmittelbar
statt in einem unbeaufsichtigten .NET-Fehlerdialog zu warten.

Der endgültige Quellstand besteht je 72 native Layoutprüfungen bei realen
96, 120 und 144 DPI in de/en/fr: initiale Skalierung, Bildschirmgrenze,
vollständige Auswahltexte, Tabellenbegrenzung und letzte Optionszeile am
Scroll-Ende. Bei wiederhergestellten 100 Prozent bestehen außerdem Setup
2.039 Assertions, First Run 63 sowie Launcher- und Updatertests. Diese
Offscreen-Tests starten weder Installation noch Deinstallation oder Runtime;
sie ersetzen nicht die sichtbare Abnahme des neu zu bauenden Installers und
nicht die offenen funktionalen WIN-I08-Gates. Die Hostanzeige wurde wieder
auf 100 Prozent, 1920 × 1200 und hellen Windows-/App-Kontext geprüft;
Nachtmodus blieb eingeschaltet.

Der reguläre Neubau `1.0.8150` aus dem sauberen Commit
`88a47a0031ad288418ac533dc0488c186d9266ca` ist anschließend mit Exitcode 0
abgeschlossen (`output/windows-installer-dpi-review-8150`). Setup-/First-Run-
und Launcher-/Updatertests, sämtliche Komponenten-Smokes, 173 Sprachtexte,
27 geometrische Vorschauen und der 10.901-Dateien-Payload-Audit sind grün.
Die Releasemetadaten melden `sourceDirty: false`; beide Artefakte wurden
unabhängig erneut gehasht:

- Setup: `56dce16b31bfe7f99986eb7e6b18afdee36193dc30350c4904095dee8b0de1a1`
- MSI: `6df5184ad7db4dcb29962237bd1cee5c305ec822d0480db70b44bff7718598ad`

Der hashgleiche Setup-Host wurde danach bei echten 150 Prozent in de/en/fr
jeweils frisch gestartet. Sprachauswahl, Standard-/Custom-Auswahl und die
aktivierten Felder am maximalen Scroll-Ende sind nativ geprüft. Die längste
französische Aufbewahrungsoption „Ne jamais supprimer automatiquement“ wurde
ausgewählt und ist nun vollständig im geschlossenen Feld sichtbar;
die Standardtexte beider Auswahlfelder in en/de und die französische
Spielerprofil-Auswahl sind ebenfalls vollständig. Abschlussoptionen samt
Hilfen bleiben oberhalb des festen Fußbereichs. Die angeklickte deutsche
Abschlussstart-Hilfe ist mehrzeilig und vollständig auf dem Bildschirm.
Der konkrete Auswahlbreitenfehler von 8148 ist damit auch für das neue
Artefakt nativ korrigiert nachgewiesen.

Keine Hostinstallation wurde gestartet. Alle drei eigenen Setup-Prozesse und
deren Fenster wurden geschlossen und ihre Abwesenheit geprüft. Die Anzeige
steht wieder auf 100 Prozent, 1920 × 1200 und hellem Windows-/App-Kontext;
Nachtmodus blieb eingeschaltet. Strukturierte Prüfnachweise:
`output/host-display-review-8150/review.json`. Die anschließende Erweiterung
dieser Setup-Matrix ist nachfolgend beschrieben. Kein GitHub-Testrelease,
Push oder Main-Merge.

### Setup-Hauptformular: vollständige Sprach-/DPI-/Kontextmatrix 8150

Der hashgleiche Installer 8150 wurde am 7. September anschließend in den
15 noch fehlenden Kombinationen erneut nativ geöffnet. Damit sind für
Sprachauswahl und Setup-Hauptformular alle 18 Kombinationen aus de/en/fr,
echten 100/125/150 Prozent und hellem/dunklem Windows-/App-Kontext geprüft.
Jede Kombination verwendete einen frischen Prozess und umfasste die
voreingestellte sowie die aktivierte benutzerdefinierte Ansicht. Auswahltexte,
Abschlussoptionen und getrennter Fußbereich sind vollständig sichtbar;
bei 125 und 150 Prozent wurde das maximale Scroll-Ende zusätzlich bedient.
Die längste französische Aufbewahrungsoption ist auch bei 100 und 125 Prozent
im geschlossenen Feld nativ vollständig bestätigt.

Windows und Apps wurden über die Farbeinstellungen tatsächlich auf Dunkel
umgestellt; die beiden Theme-Werte waren dabei 0. Das Setup behält seine
helle WinForms-Oberfläche bei und zeigt keinen zusätzlichen beobachteten
Kontrastfehler. Dies ist eine Prüfung im dunklen Systemkontext, keine
Behauptung einer eigenen Dunkelansicht. Alle 15 eigenen Folgeprozesse wurden
geschlossen; die abschließende Fenster- und Prozessprüfung ist leer.
100 Prozent, 1920 × 1200, heller Windows-/App-Modus (beide Werte 1),
eingeschalteter Nachtmodus und allein aktiver Bildschirm 1 sind wieder
verifiziert. Die Einzelkombinationen und geprüften Prozess-IDs stehen im
obigen lokalen Prüfnachweis.

Dieses Ergebnis schließt die beschriebene **Setup-Hauptformularmatrix**, nicht
die vollständige UI- oder Releaseabnahme: übrige Komponentendialoge,
Hover-/Tastatur-Randfälle, funktionale Installations-/Fehler-/Abbruchflows,
nutzerbediente Authentifizierung/UAC und echter GitHub-Updatepfad bleiben
separat offen. Auf dem Host wurde nichts installiert und kein NETGRID-
Runtimeprozess gestartet; bestehende Zugangsdaten blieben unangetastet.

### Erneute Sandbox-Abnahme 8145 → 8150: MSI, Rollback und Private LAN grün

Am 7. September um 14:16:59 UTC wurde nach verifiziert leerer Sandboxliste
der Gast `8d4881be-5836-42a6-b4b5-48ebea3aa95f` gestartet. Der bestehende
Runner verwendet die hashgeprüften Artefakte aus
`output/windows-installer-acceptance-8145` und
`output/windows-installer-dpi-review-8150`, einschließlich echtem
Updater-Rollbacktest. Netzwerk ist für die anschließende getrennte
Private-LAN-Prüfung aktiviert; Repository, private Daten, Zwischenablage,
Audio, Video und Drucker werden nicht freigegeben. Die Gastvorprüfung
bestätigt Windows 11 Enterprise x64 (26100), keine Entwicklungswerkzeuge
und alle vier Eingangsartefakthashes.

Führender Laufordner:
`output/windows-sandbox-e2e/bb8eccf05f4747369da2d3c3806c1f85`.
Die vollständige 13-Punkte-MSI-Matrix ist um 14:49:29 UTC einschließlich
Cleanup grün abgeschlossen (`result/result.json`). Geprüft sind Defaults,
Frischinstallation, Custom-Pfade/-Policy, Verknüpfungen, Launcher-Health,
Backup, Reparatur, fehlgeschlagenes Upgrade mit erhaltener Vorversion,
Upgrade auf 8150, ProductCode-Reparatur aus dem geschützten Cache,
eigenständiger Downgrade, Datenerhalt bei normaler Deinstallation und
ausdrückliche Testdatenlöschung. Alle vier Ergebnis-Hashes wurden danach
erneut gegen die tatsächlichen Hostartefakte und ihre Releasemetadaten
verglichen; sie stimmen vollständig überein. Der äußere Abschlusszeitpunkt
liegt nach der Bereinigung, der innere Installerzeitpunkt davor.

Der separate Standardbenutzer-/Updater-Rollbacktest ist von 14:49:31 bis
15:02:17 UTC vollständig einschließlich Cleanup grün abgeschlossen.
`result/standard-user-result.json` bestätigt fünf Prüfungen ohne Erhöhung
auf der installierten Basis 8145: Programm und Konfiguration sind nicht
beschreibbar, Laufzeitdaten dagegen schon; Launcher-Health und SQLite-Anlage
funktionieren ohne Administratorrechte. `result/rollback-result.json`
bestätigt das echte Upgrade auf 8150 mit anschließend absichtlich beschädigter
Testdatenbank, erkanntem Healthfehler und Programmrollback auf 8145.
Datenbankmarker und SQLite-Integrität wurden wiederhergestellt, die
Konfiguration blieb unverändert. Alle sieben Transaktionsprüfungen und
`cleanupVerified` sind grün. `result/suite-result.json` beendet die gesamte
MSI-/Rollbackstrecke erfolgreich um 15:02:17 UTC. Die vier Artefakthashes
sowie Updater- und Fault-Fixture-Hash wurden unabhängig erneut gegen die
tatsächlichen Eingangsdateien geprüft. Der abschließende native
Benachrichtigungsdialog ist ausdrücklich nicht Bestandteil dieses Nachweises.

Der anschließende Netzwerk-Nachweis installiert genau den hashgebundenen
8150-Stand im selben Gast mit eigenen zufälligen Programm-/Datenpfaden und
den Testports 32141/32142. Der isolierte Testhelfer startet die installierten
Node-Programme ohne Tray oder Browser. Nur im Wegwerfgast wird die exakt
identifizierte pauschale Container-Inbound-Freigabe vorübergehend deaktiviert,
damit sie die Produktregeln nicht überdeckt; die Host-Firewall bleibt
unverändert. Die beiden NETGRID-Regeln sind an die installierte Node-Datei,
ihren jeweiligen Port und ausschließlich das Profil „Privat“ gebunden.

`result/lan-host-private.json` bestätigt um 15:07:08 UTC Web und Server vom
Host mit HTTP 200; Maintenance wird mit HTTP 403 und
`maintenance_unavailable` abgewiesen. Nach Wechsel des Gastprofils auf
„Öffentlich“ bestätigt `result/lan-host-public.json` um 15:07:50 UTC beide
Remoteports als unerreichbar. Die unmittelbar vorher im Gast geprüften
Loopbackdienste bleiben jeweils HTTP 200; die lokale noch nicht eingerichtete
Maintenance meldet erwartungsgemäß HTTP 503. Beide Hostproben binden die
Gastadresse an die Sandbox-ID und dieselben erneut geprüften 8150-Hashes.

Die LAN-Bereinigung endet um 15:08:59 UTC mit Exitcode 0 und
`result/lan-state.json: state=cleaned, sandboxFirewallRestored=true`.
Eigene Laufzeitprozesse, Testprogramm/-daten, Produktregistrierung,
NETGRID-Firewallregeln und Testlistener sind entfernt; die ursprüngliche
Containerfreigabe ist verifiziert wieder eingeschaltet. Die Sandbox bleibt
für die gesonderten nativen Prüfungen geöffnet; es läuft kein MSI-/LAN-Test
mehr. Main-Betrieb und vorhandene Maintenance-Zugangsdaten sind unberührt.

Damit sind diese automatisierten, artefaktgebundenen Zusatzgates erfüllt;
die verbleibende native UI- und Releaseabnahme bleibt separat offen.
Ein erfolgreicher MSI-/Rollback-/Netzwerklauf wird nicht als nativer Dialog-,
Authentifizierungs- oder GitHub-Downloadnachweis umgedeutet.
Eine reine GitHub-Abfrage am selben Tag
bestätigt das öffentliche Repository `LevelX2/NETGRID`, aber noch keine
Releases (`gh release list`: leere Liste). Der echte Release-Downloadtest
kann daher nicht gegen einen bereits vorhandenen Kandidaten erfolgen;
es wurde weder veröffentlicht noch gepusht.

### Native Fortsetzung 8150: Hilfen und Installationsfortschritt geprüft

Am 7. September wurde danach derselbe hashgebundene 8150-Setup-Host im
bereinigten Gast nativ geöffnet. In der deutschen Custom-Ansicht erreicht
Tab die Custom-Hilfe und zeigt ihren vollständigen mehrzeiligen Text;
der nächste Tab wechselt zur lokalen Betriebsart, entfernt den vorherigen
Hilfetext und zeigt die passende lokale Hilfe. Der angeklickte Link
„Was ist Maintenance?“ öffnet eine vollständig sichtbare Erklärung mit
Abgrenzung zum Spiel, lokalem Verwaltungszugriff, eigenständigem Passwort
und späteren Einstiegspunkten. Der Informationsdialog wurde geschlossen.
Dies ist ein gezielter Tastatur-/Hilfenachweis, keine vollständige
Fokusreihenfolge-, Hover- oder Installationsabnahme.

Das Hauptformular steht anschließend auf voreingestellten Werten,
„Nur dieser Rechner“, Desktopverknüpfung an und Abschlussstart aus.
`result/native-8150-preflight.json` bestätigt um 15:15:16 UTC den eindeutigen
Setup-Prozess 5576, dessen bekannten Hash, fehlende Produktregistrierung,
noch nicht vorhandene Standardzielpfade und freie Gastports 3100/8787.
Diese Ports und Pfade liegen ausschließlich im Gast; die Hauptinstanz des
Hosts bleibt unberührt. Es wurde noch nicht auf „Installieren“ geklickt.
Die native Installation zur sichtbaren Fortschrittsprüfung benötigt die
unmittelbare Klickbestätigung nach dem Computer-Use-Skill; Authentifizierung
und Windows-UAC bleiben Nutzeraktionen. WIN-I08 bleibt aktiv.

Die anschließende ausdrückliche Nutzerbestätigung „Ja, jetzt installieren“
wurde nach erneuter Sichtprüfung des unveränderten Formulars ausgeführt.
Der Installationsklick erfolgte um 15:18:57 UTC. Zunächst waren die
Dateivorbereitung und danach „Windows Installer bereitet die Installation
vor und ermittelt den Arbeitsumfang …“ sichtbar. Um 15:21:32 UTC zeigte
der native Setup-Host „Aktueller Installationsabschnitt: 51 %. Weitere
Abschnitte können folgen.“ mit entsprechend gefülltem kontinuierlichem
Balken. Datenhinweis, Status und Balken blieben getrennt und lesbar.
Dieser Nachweis belegt echte sichtbare Zwischenprozente des MSI-Abschnitts,
keine zeitbasierte Gesamtfortschrittsschätzung.

Um 15:21:45 UTC erschien der vorgeschaltete First-Run-Entscheidungsdialog
„NETGRID-Verwaltung jetzt einrichten?“. Das Setup meldet dahinter
„NETGRID ist installiert. Bitte schließen Sie die Ersteinrichtung im
geöffneten Fenster ab.“ und einen vollständig gefüllten Balken.
`result/native-8150-installed.json` bestätigt unabhängig die registrierte
Version 1.0.8150, Standardspeicherorte ohne Test-ID, Sprache de,
Desktopverknüpfung und die vier installierten Komponentenprüfsummen gegen
die 8150-Releasemetadaten. Das zu diesem Lauf gehörende MSI-Protokoll
bestätigt Client und Server jeweils mit `MainEngineThread is returning 0`.
Der reine Prüfhilfer verwendete zunächst einen falschen Launcherdateinamen;
nach Abgleich mit dem Installervertrag wurde ausschließlich der Hilfer auf
`NETGRID.exe` korrigiert und vollständig erfolgreich erneut ausgeführt.

Es wurde weder „Später“ noch „Jetzt einrichten“ automatisiert betätigt.
Passwörter wurden nicht gelesen oder geändert; die Nutzerentscheidung zur
Ersteinrichtung steht noch aus. Kein UAC-Dialog wurde durch den Agenten
bedient. Der erfolgreiche native Installations-/Fortschrittsnachweis ersetzt
nicht die übrigen Sprach-, Authentifizierungs-, UAC- und GitHub-Updategates.

Nach der Nutzerbestätigung des Abschlusses ist der ursprüngliche
Setup-Aufruf terminal mit Exitcode 0. Die erneute installierte Identitäts-
prüfung um 17:05:53 UTC bleibt grün. `result/native-8150-completion.json`
bestätigt geschlossene Setup-/First-Run-Prozesse und über den bestehenden
hashgeprüften `--status`-Pfad einen eingerichteten Verwaltungszugang.
Die Abfrage liefert ausschließlich den booleschen Status; sie bootstrapped
oder überschreibt keine Credentials. Welche Passwort-, Zurück- oder
Sichtbarkeitsschritte der Nutzer bedient hat, wurde nicht beobachtet.

Beim anschließenden normalen Desktopstart des installierten 8150 erscheint
zunächst die Windows-Meldung zum nicht öffnungsfähigen HTTP-Link.
`result/native-8150-browser-before-repair.json` grenzt den Fehler auf die
frische Sandbox ein: Web und Server antworten mit HTTP 200, ein einzelner
Launcher läuft, HTTP-UserChoice lautet `MSEdgeHTM`, dessen HKCR-Klasse fehlt
jedoch. Die vorhandene Edge-Datei besitzt eine gültige Microsoft-Signatur.
Die bereits freigegebene Sandbox-Vorbereitung ergänzt nur diese fehlende
HKCU-Klasse mit dem bestehenden, geprüften Reparaturhelfer. UserChoice und
Hash bleiben unverändert; Browserdaten, Sicherheitsoptionen und Host werden
nicht geändert (`result/edge-http-registration-repair.json`).

Der erneute Desktop-Doppelklick öffnet um 17:09 UTC über den normalen
ShellExecute-Pfad Edge mit `127.0.0.1:3100` und sichtbar „V1.0 · Build 8150“.
`result/native-8150-browser-first-start.json` bestätigt anschließend Web/Server HTTP 200
und denselben einzelnen Launcher PID 7000. Die Sandbox und diese installierte
Runtime bleiben für weitere Tests geöffnet. Dies ist keine unveränderte
Browserausstattung des Ausgangsimages und kein NETGRID-Fallback; die
Gastvorbereitung bleibt Bestandteil der Nachweisbedingungen. Der
Hauptbetrieb auf dem Host wurde nicht berührt.

### Native Tray-Prüfung 8150: Diagnoseexport, Beenden und Neustart

Der deutsche Tray-Einstieg „Diagnosepaket erstellen …“ öffnet am 7. September
den nativen Speicherdialog. Die Dateinameneingabe über das Automatisierungs-
werkzeug wird in der Sandbox nicht übernommen; mit Strg+Z wurde der
vorgeschlagene Name wiederhergestellt. Gespeichert wurde ausschließlich das
neue lokale `NETGRID-diagnostics-20260907-191244.zip` in den Gastdokumenten.
Die native Erfolgsmeldung ist sichtbar bestätigt. Es wurde weder eine
vorhandene Datei überschrieben noch ein ZIP hochgeladen.

Der unabhängige Prüfer bestätigt vier erlaubte Einträge: `diagnostics.json`,
`runtime.env.redacted`, `launcher-server.log` und `launcher-web.log`.
Versionsmetadaten binden 1.0.8150; Datenbank-/Credential-/Uploadflags sind
false. Alle geheimen Werte aus der Runtimekonfiguration wurden intern gegen
sämtliche ZIP-Texte geprüft, ohne diese Werte auszugeben; die Redaktion ist
grün. Erst danach wurde die Datei bytegleich in den eigenen Ergebnisordner
kopiert. Hosthash und Gastnachweis stimmen überein:
`a0faece194e4fb59dcc1902813287991f881d204aa2bca17e965cbd10c224e18`.
Führend: `result/native-diagnostics-8150-verification.json` und
`result/native-diagnostics-8150-20260907-171244.zip`.

Vor dem Beenden bestätigt eine strikt lesende SQLite-Abfrage null Partien
und null Startlobbys. Prozess-/Portbindung sind geprüft: Launcher 7000 mit
seinen beiden installierten Node-Kindprozessen 3960/2968 besitzt ausschließlich
die Gastlistener 8787/3100. Der native Menüpunkt „NETGRID beenden“ wird um
17:16:52 UTC ausgeführt. `result/native-8150-stop-after.json` bestätigt drei
Sekunden später keine dieser installierten Prozesse und keine Listener mehr;
der Agent hat keine Prozesse erzwungen beendet.

Der anschließende Desktop-Doppelklick startet um 17:17 UTC eine neue einzelne
Launcherinstanz 980 und öffnet wieder die Spielseite mit Build 8150.
`result/native-8150-browser-restart.json` bestätigt Web und Server mit
HTTP 200. Die Runtime bleibt für weitere Abnahmen geöffnet. Diese Prüfung
belegt den normalen Menü-Stopp und anschließenden Start, nicht das separate
Recovery-Verhalten nach einem Prozessabbruch. Bestehende Zugangsdaten und
Hauptbetrieb des Hosts bleiben unverändert; WIN-I08 bleibt aktiv.

### Native Recovery-Prüfung 8150

Am 7. September wurde im vorhandenen Sandboxlauf die installierte Runtime
unter Launcher 980 geprüft. Vor jedem Schritt bestätigt eine strikt lesende
SQLite-Abfrage null Partien und Startlobbys. Der Fehlerhelfer bindet den
Abbruch an den exakten installierten Node-Pfad, Launcher-Parent, Startzeit
und Gastlistener 8787; er beendet nur diesen Serverprozess. Die ursprüngliche
Millisekunden-Zeit aus der PowerShell-JSON-Ausgabe war für einen exakten
CIM-Vergleich zu grob. Der Helfer brach deshalb vor jeder Mutation ab.
Nach read-only Prüfung wurden die tatsächliche Mikrosekunden-CIM-Zeit und
die entsprechende Präzision von `Get-Process` korrekt verglichen; die
Produktprogramme wurden nicht geändert.

Der erste gezielte Abbruch von Server 3676 um 17:22:14 UTC wird vom
unveränderten Launcher automatisch behandelt. Neue Kinder 5604/8076 ersetzen
das alte Paar 3676/6396; Web und Server liefern HTTP 200. Die kurze
Ballonbenachrichtigung wurde nicht sichtbar aufgenommen und wird nicht als
abgenommen ausgegeben. Nach dem zweiten Abbruch bleibt Launcher 980 bestehen,
aber beide Node-Prozesse und Listener sind weg. Der native deutsche Dialog
„NETGRID konnte nach einem Prozessabbruch nicht wiederhergestellt werden.“
ist über die Taskleiste erreichbar und vollständig lesbar. „Wiederholen“,
„Diagnose öffnen“ und „Beenden“ sind sichtbar; nur „Wiederholen“ wurde bedient.

Nach dem Klick startet derselbe Launcher neue Kinder 3416/5388, öffnet die
Spielseite mit Build 8150 und erreicht beide Healthziele erneut mit HTTP 200.
Der Hash der Runtimekonfiguration bleibt über alle fünf Schritte identisch.
Der bestehende reine Maintenance-Statuspfad bestätigt abschließend weiterhin
den eingerichteten Zugang; kein Bootstrap, Reset oder Passwortzugriff durch
den Agenten. Führend sind die fünf erfolgreichen
`result/native-8150-recovery-{failfirst,verifyfirst,failsecond,verifystopped,verifyretry}.json`.
Die initiale Prüfhelferdiagnose bleibt davon getrennt. NETGRID läuft danach
wieder in der Sandbox. Damit sind automatische Einmal-Wiederherstellung,
sicherer Stopp nach erneutem Abbruch und der native deutsche Retry-Pfad
artefaktgebunden bestätigt; andere Sprach-/Kontextvarianten bleiben offen.

### Native Updatesuche 8150 und verbleibende Abschlussgrenzen

Die manuelle deutsche Tray-Aktion „Nach Updates suchen …“ zeigt am
7. September um 17:26:44 UTC im netzfähigen Gast den vollständig lesbaren
Informationsdialog „NETGRID ist auf dem neuesten Stand.“. Der Dialog wurde
geschlossen; weder Updatezustimmung noch Download oder Installation wurden
ausgelöst. Die unabhängige aktuelle GitHub-Abfrage für `LevelX2/NETGRID`
liefert weiterhin eine leere Releaseliste. Dieser Nachweis gilt damit für
die reguläre Suche ohne angebotenen Kandidaten, ausdrücklich nicht für den
erforderlichen tatsächlichen Stable-/Prerelease-Download samt Zustimmung.

Der erneute Abgleich mit dem Produktvertrag bewahrt den vollständigen Scope:

- Die deutschen nativen Installations-, Fortschritts-, Desktop-, Diagnose-,
  Stopp-/Neustart- und Recoverypfade sind für 8150 inzwischen gebunden.
  Daraus folgt keine pauschale funktionale Abnahme aller Flows in en/fr
  oder aller übrigen Dialoge bei 100/125/150 Prozent und hellem/dunklem
  Windows-Kontext. Die abgeschlossene 18er-Matrix betrifft nur Sprachwahl
  und Setup-Hauptformular.
- Native Validierungs-, Abbruch-, Reparatur-/Deinstallationsdialoge
  (außer den unten gebundenen de/en/fr-Öffnen-/Abbrechen-Pfaden),
  die abschließende Updater-Rollbackbenachrichtigung und die noch fehlenden
  Sprach-/Kontextvarianten bleiben anhand der Runbook-Checkliste zu prüfen.
  Erfolgreiche MSI-/Komponententests ersetzen diese sichtbaren Flows nicht.
- Passwortanzeige, Zurück-Navigation und Authentifizierung werden nicht
  automatisiert. Zum bereits nutzerbedienten deutschen First Run wurde
  gezielt nach den tatsächlich ausprobierten Sichtbarkeits-/Zurück-Schritten
  gefragt; solange keine Antwort vorliegt, entsteht kein zusätzlicher
  manueller Nachweis. Windows-UAC mit alternativem Administrator und
  Maus-Hover-Randfälle benötigen ebenfalls Nutzerbedienung.
- Ein echter GitHub-Updatekandidat ist weiterhin nicht veröffentlicht.
  Die bedingte Testreleasefreigabe ersetzt weder die vorher verlangte
  übrige Abnahme noch den aktuell fortgeltenden Auftrag „Kein Push“.
  Es wird kein Tag auf einen unbeteiligten Quellstand gesetzt und kein
  lokales Artefakt als bereits veröffentlichter Updatekandidat ausgegeben.
- WIN-I08 ist nicht abgeschlossen. Die gelesenen Integrationsregeln des
  Paketprozess-Skills erlauben Main-Abgleich, Merge und verifizierten
  Worktree-/Branch-Cleanup erst nach dem letzten Paket; diese Schritte
  wurden nicht vorgezogen.

### Native Deinstallationsansicht und Abbrechen 8150

Am 7. September um 17:35–17:36 UTC wurde im bestehenden Gast ausschließlich
der SHA-256-gebundene Setuphost 8150 mit `--uninstall` geöffnet. Nach der
deutschen Sprachwahl zeigt das native Fenster vollständig lesbar den
standardmäßigen Erhalt von Konten, Profilen, Decks, Spielen, Einstellungen,
Kartenbildern und Backups. „Alle NETGRID-Daten endgültig löschen“ ist sichtbar
nicht ausgewählt; der Zusatztext erklärt den betroffenen Datenordner.
Der Agent klickte ausschließlich „Abbrechen“, nicht „Deinstallieren“.
Der Setupaufruf endete mit Exitcode 0.

Die schreibgeschützten Vorher-/Nachher-Prüfungen
`result/native-8150-uninstall-cancel-{before,after}.json` bestätigen dieselben
Prozesse einschließlich Startzeiten (Launcher 980, Server 3416, Web 5388),
bytegleiche Runtimekonfiguration, weiterhin eingerichtete Maintenance sowie
HTTP 200 für Server und Spielseite. Der Prüfhelfer änderte keine Zugangsdaten.
Damit ist nur dieser deutsche Ansichts-/Abbruchpfad bestätigt; tatsächliche
native Entfernung, zusätzliche Löschbestätigung und en/fr-Varianten bleiben
offen. Keine Deinstallation oder Datenlöschung wurde ausgelöst.

Die anschließenden nativen en/fr-Läufe desselben Artefakts schließen die
Sprachvarianten dieses Ansichts-/Abbruchpfads: Englisch zeigt alle Texte und
Schaltflächen vollständig und schließt per Escape. Französisch zeigt auch
die lange Überschrift und den zweizeiligen Erklärungstext vollständig;
Sprachwahl per Tastatur, Weiter per Enter sowie sichtbarer Tab-Fokus auf
„Désinstaller“ und anschließend „Annuler“ wurden geprüft. Enter auf dem
beobachteten Fokus „Annuler“ schließt nur das Fenster. Die Löschoption blieb
in beiden Dialogen nicht ausgewählt; kein destruktiver Knopf wurde betätigt.

Beide Setupaufrufe endeten mit Exitcode 0. Die vier Ergebnisdateien
`result/native-8150-uninstall-cancel-{en,fr}-{before,after}.json` bestätigen
um 17:40:31 beziehungsweise 17:42:26 UTC unveränderte Prozessidentitäten,
bytegleiche Konfiguration, eingerichtete Maintenance und beide HTTP-200-
Antworten. Die aus dem CLI gestartete Sprachwahl lag zunächst hinter dem
Browser und wurde mit Alt+Tab sichtbar gemacht, ohne den Setupaufruf neu
zu starten. Dieser Nachweis gilt für den vorhandenen hellen Gastkontext;
andere DPI-/Kontrastkontexte und die tatsächlichen Lösch-/Uninstall-Flows
werden dadurch nicht als bestanden markiert.

Für die anschließend angefragte echte native Deinstallation mit Datenerhalt
ist die unmittelbare Nutzerbestätigung noch offen. Der vorbereitende,
ausschließlich lesende Gastlauf `probe-native-8150-retention.ps1 -Phase
Baseline` endete mit Exitcode 0 und erzeugte
`result/native-8150-retention-baseline.json`. Er bindet Konfiguration und
Maintenance-Credentialdatei über Größe und SHA-256, bestätigt die vorhandene
Spieldatenbank und den initialisierten Zugang über die hashgebundene
First-Run-Statusabfrage. Keine Credentialinhalte wurden ausgegeben und keine
Dateien des Produkts geändert. Der vorbereitete Modus `VerifyRetained` ist
noch nicht ausgeführt: Er verlangt identische geschützte Dateien, eine
weiterhin vorhandene Datenbank sowie entfernte Programm-EXE und gestoppte
Runtime. Für die im Betrieb veränderliche SQLite-Datei wird ausdrücklich
keine Bytegleichheit aus diesem laufenden Ausgangsstand behauptet.
Diese Vorbereitung ist kein bestandener Deinstallationsnachweis.

### Offener Ursachen-Fix: laufende Runtime bei nativer Deinstallation 8150

Nach unmittelbarer Nutzerbestätigung wurde am 7. September um 18:24:08 UTC
der deutsche Deinstallationsknopf ohne ausgewählte Datenlöschung betätigt.
Vorher bestätigte die schreibgeschützte SQLite-Prüfung null Matches und
Startlobbys. Die native Erfolgsmeldung wurde gesehen und geschlossen.
Das MSI-Protokoll `NETGRID-install-20260907-182408.log` im temporären
Gastbenutzerordner enthält sowohl für Client als auch Server
`MainEngineThread is returning 0`; die Programm-EXE ist entfernt.

Die anschließende tatsächliche Abnahme scheitert trotzdem: Launcher 980 und
seine während der Transaktion um 18:24:21 UTC neu gestarteten Kinder 4088
und 8020 laufen weiterhin; 8787 und 3100 lauschen noch auf Loopback.
`result/native-8150-retention-failure.json` bindet diese Prozessidentitäten
und bestätigt zugleich bytegleiche Konfiguration und Maintenance-Credential-
datei sowie die weiterhin vorhandene Spieldatenbank. Die erste
`VerifyRetained`-Prüfung endet deshalb korrekt mit Exitcode 1.

Die Codeprüfung zeigt die fehlende Lifecycle-Koordination: Der
Deinstallationsworker startet direkt die MSI-Entfernung. Der Launcher behält
dabei seinen normalen Recoverypfad und kann Kindprozesse nach deren Ende
neu starten. Vor der Dateientfernung fehlt ein mit dem laufenden Launcher
abgestimmter, bestätigter Stopp einschließlich Recovery-Unterdrückung und
Schutz gegen einen konkurrierenden Neustart. Dieser Owner-Vertrag muss
ursächlich ergänzt und mit laufendem Launcher regressionsgesichert werden;
ein alleiniger Dateilöschtest oder manuelles Vorab-Beenden genügt nicht.

Als ausdrücklich temporäre Testbereinigung wurden um 18:29:43 UTC nur die
drei gegen Pfad, Startzeit und Elternbeziehung verifizierten eigenen
Gastprozesse beendet. Das Tray war nach der Entfernung nicht mehr erreichbar.
`result/native-8150-uninstall-orphan-cleanup.json` markiert deshalb ausdrücklich
`nativeUninstallGatePassed: false`. Ein initialer Fehler beim Lesen des
PowerShell-JSON-Zeitformats stoppte den Helfer vor jeder Prozessänderung;
nach korrekter DateTime-Auswertung bestand die Identitätsprüfung.
Die anschließende `native-8150-retention-verifyretained.json` bestätigt um
18:29:48 UTC erhaltene geschützte Dateien und Datenbank sowie geschlossene
Ports und keine Produktprozesse. Dieses Ergebnis gilt **nach manuellem
Cleanup**, nicht als grüner nativer Deinstallationsablauf. Es wurde kein
Passwort geändert, keine Nutzerdaten gelöscht und nichts neu installiert.
Removal Condition der temporären Bereinigung: neuer Installer mit dem oben
genannten Lifecycle-Fix und erneutem nativen Uninstall-Nachweis ohne Eingriff.

#### Ursachen-Fix in Arbeit: terminaler Launcher-Stopp

Der erste Implementierungsschritt ergänzt im bestehenden `LauncherRuntime`
`StopForInstallationAsync`. Anders als ein gewöhnlicher Stopp ist dieser
Zustand für die betreffende Runtimeinstanz endgültig. Die Anforderung wird
vor dem Warten auf den bestehenden Lifecycle-Lock veröffentlicht; dadurch
können bereits wartende Start-/Retry-Aufrufe den Stopp nicht zurücksetzen.
Start, Health-Wartepfad und Recovery prüfen denselben Zustand. Ein während
des Installer-Stopps endender Kindprozess erzeugt weder Recovery noch einen
irreführenden Fatal-Dialog. Der vorhandene geordnete Prozess-Stopp bleibt
Owner; es entsteht keine zweite Prozessbeendigungslogik.

`InstallationStopTests.cs` war vor der Änderung rot
(`terminal_installer_stop_missing`) und besteht danach mit neun Checks.
Geprüft werden erneuter Start nach Stopp, Erhalt der Sperre über gewöhnliches
Stoppen hinweg, wiederholter Installer-Stopp, vor dem Stopp eingereihter
Retry sowie das Ende eines echten, isolierten Testkindprozesses während der
gesperrten Lifecycle-Phase. Beide Testkinder müssen nach dem Stopp beendet
sein; der Fixture-Cleanup ersetzt diese Assertion nicht. Es werden weder
Produktdaten, Registry noch NETGRID-Serverports verwendet. Der paketnahe
Launcher-Testlauf besteht zusätzlich mit den bisherigen STA-, 35 Update-
Fehler- und Download-/Tamper-Prüfungen; `git diff --check` ist grün.

Die MSI-Anbindung ist inzwischen als weiterer, noch nicht nativ abgenommener
Implementierungsschritt ergänzt: Eine erhöhte Deferred Action setzt eine
pro Programmordner gehashte HKLM-64-Bit-Lease. Der Launcher beobachtet diese
Sperre, übergibt an `StopForInstallationAsync` und schließt danach sein Tray.
Neue Launcherstarts prüfen dieselbe Autorität. Commit und Rollback geben nur
die eigene Transaktions-ID frei; ein persistenter Abschlusszeitpunkt verhindert
auch den verspäteten Start eines während der Installation erzeugten Prozesses.
Eine unlesbare Sperre wird nicht als Freigabe behandelt. Ein offener First-Run-
Prozess wird nicht zwangsweise geschlossen: Die MSI-Aktion wartet höchstens
45 Sekunden auf das Ende aller exakt zum Programmordner gehörenden Prozesse
und bricht andernfalls vor den Dateiänderungen ab. Restart Manager ist kein
zweiter Shutdown-Owner (`DisableShutdown`). Die Anbindung berücksichtigt die
dokumentierten
[Rollback-Aktionsgrenzen](https://learn.microsoft.com/en-us/windows/win32/msi/rollback-custom-actions)
und [Commit-Aktionsgrenzen](https://learn.microsoft.com/en-us/windows/win32/msi/commit-custom-actions)
und verweigert deaktiviertes Rollback.

Die neue `Netgrid.InstallerActions`-Komponente verwendet gepinntes WiX DTF
7.0.0 unter der bereits akzeptierten WiX-EULA und .NET Framework 4.8 des
Windows-11-Zielsystems; das Framework wird vorab geprüft. Locked Restore,
64-Bit-PE-/Exportprüfung, vollständige Lizenzhinweise mit konkretem Upstream-
Quellverweis und die SHA-256-Bindung der eingebetteten MSI-Binary sind in der
Buildstrecke ergänzt. Die rechtlich vollständige Bereitstellung des
korrespondierenden WiX-Quellcodes bleibt vor einer Weitergabe zu prüfen;
der Quellverweis allein wird hier nicht als abgeschlossene Lizenzabnahme
gewertet. Es wurden keine NETGRID-Quellen in eine Produktpayload aufgenommen.

Aktueller Prüfnachweis: 47 isolierte HKCU-/Owner-/Sequenz-Checks sowie 14
Launcher-Stoppchecks bestehen; auch die bisherigen STA-, 35 Updatefehler-
und Download-/Tamper-Tests bleiben grün. Das ausschließlich zur Paketprüfung
gebaute `output/lifecycle-msi-probe-5513f99c627b478295464cb4b89fdfa0/PROBE-NOT-FOR-INSTALLATION.msi`
verwendet absichtlich `1.0.0` und ältere Produktpayloads: Es ist **kein**
Installations- oder Releasekandidat und wurde nicht installiert. Seine reale
MSI-Tabelle bestätigt `Rollback=1501`, `Begin=1502`, `Commit=1503` vor
`RemoveRegistryValues=2600`, `RemoveFiles=3500`, `InstallFiles=4000`.
Die vier CustomAction-Typflags und die exportierte Lifecycle-Binary bestanden
die Prüfung. Nachfolgende Codeänderungen benötigen einen neuen Binärnachweis.

Der nachfolgende Komponentenbuild (korrekt als beendet erkannte
Prozessabgänge während der Image-Abfrage; alle Prozesshandles werden auch
bei frühem Rücksprung freigegeben) besteht ohne Warnungen. Drei zusätzliche
Audit-Regressionstests verwerfen x86-/falsche PE-Header, fehlende Exporte,
bedingte Lifecycle-Aktionen und fremde Binary-Bindungen. Das Diagnose-MSI
enthält diesen nachfolgenden Prozessabfrage-Fix noch nicht.

Der volle Setup-Test meldete bei der aktuellen Hostskalierung von 120 DPI
zunächst zwei abgeschnittene Pixel am letzten Hilfezeichen. Die ergänzte
Diagnose zeigte jedoch: Der Test führte **nach** dem Scrollen ein explizites
Relayout aus. Dadurch wuchs der Scrollbereich um 41 Pixel; die Position lag
noch bei 206 statt am neuen Ende 247. Das Relayout erfolgt nun vor der
Scrollaktion, und eine zusätzliche Assertion sichert das tatsächliche
aktuelle Ende (`Maximum - LargeChange + 1`). Die bisherigen vollständigen
Bounds-Assertions bleiben unverändert streng. Es wurde kein Produktlayout
geändert oder um einen Ersatzabstand ergänzt. Ergebnis: 2.042 Setupchecks
bei 125 % und 63 First-Run-UI-Checks in allen drei Sprachen grün, ohne
Installation oder Credentialzugriff.

Konkurrierende First-Run-Aufrufe prüfen inzwischen dieselbe Installersperre
beim Laden und unmittelbar vor jedem Status-/Bootstrap-Kindprozess. Ein
bereits offenes Passwortfenster wird weder automatisch bestätigt noch
geschlossen. Die Sperre sowie ein unlesbarer Status führen zu eigenen
lokalisierten Meldungen in `de`/`en`/`fr`; vorhandene Credentials werden nicht
angefasst. Fünf zusätzliche Tests injizieren ausschließlich eine Sperrabfrage
und verwenden absichtlich nicht vorhandene Programmpfade: Sperre und
Lesefehler müssen vor jeglichem CLI-/Dateizugriff scheitern. Zusammen mit den
bisherigen First-Run-UI-Tests bestehen 68 Checks.

Auch die innere CAB-Payload der Lifecycle-Binary wird nun positiv auditiert:
genau `NETGRID.InstallerActions.dll`, `WixToolset.Dtf.WindowsInstaller.dll`
und `CustomAction.config`, ohne Unterpfade oder weitere Dateien. Alle drei
extrahierten Dateien müssen ihre Buildinputs per SHA-256 treffen. Der Audit
lief aus Windows PowerShell erfolgreich; sein ausschließlich eigener
temporärer Ordner wurde entfernt. Buildstrecke und vollständiger
MSI-Payloadprüfer rufen denselben Audit auf. NETGRID-Quellen, PDBs oder weitere
Buildartefakte sind auch innerhalb dieser eingebetteten Binary nicht erlaubt.

Die Prüfung des aktiven-Spiel-Schutzes bestätigt eine verbleibende Lücke:
Der GitHub-Updater prüft `/api/system/update-readiness` vor und nach dem
Download; die neue direkte MSI-Lifecycle-Aktion stoppt dagegen bislang ohne
diese Abfrage. Das gilt nicht als bestandenes Updategate. Zusätzlich muss
die Reihenfolge des Major-Upgrades berücksichtigt werden: Das alte MSI wird
bei der aktuellen Standardplanung bereits vor der Deferred-Phase des neuen
MSI entfernt. Ein nativer Standalone-Uninstall-Nachweis würde diese separaten
Upgradefragen nicht beantworten und darf nicht als solcher ausgegeben werden.

Die weitere Codeprüfung konkretisiert auch im GitHub-Weg eine Zeitlücke:
Nach der zweiten lesenden Readiness-Abfrage folgen Dateikopie und erhöhter
Updaterstart einschließlich Windows-Bestätigung, erst danach `CloseAsync`.
Eine zwischenzeitliche Spielanlage wird nicht gesperrt. Der offene Fix
benötigt eine serverseitig atomare Freigabe mit Startsperre und kontrollierter
Rücknahme bei Abbruch, nicht bloß eine dritte Momentaufnahme.

Die fokussierte Suite `update-readiness.test.ts` besteht mit fünf Tests,
darunter jetzt der echte SQLite-/HTTP-Pfad für alle elf Matchstatuswerte
und die Ablehnung eines nicht verfügbaren Speicherstatus. Die Datenbank und
Backups liegen in einem eigenen temporären Fixtureordner, der Listener auf
einem dynamisch vergebenen Loopbackport. Der Credentialstore ist ausschließlich
im Speicher; produktive Daten und Zugangsdaten werden nicht verwendet.
Die Statusfixtures prüfen Klassifikation, nicht künstliche Engine-Übergänge.
Damit ist die bisher nur gemockte Zählung zusätzlich abgesichert, nicht die
offene Start-/Stopp-Race geschlossen. Kandidat 8169 bleibt unverändert an
seinen ursprünglichen Quellcommit gebunden und weiterhin ungestartet.

Die serverseitige Vorbereitung ist anschließend umgesetzt: `UpdateAdmission`
schließt die Zulassung synchron, wartet auf zugelassene und verschachtelte
Vorgänge und liest dann den bestehenden SQLite-Matchstatus. Die Integration
umfasst Matchanlage, Join, Reconnect, Recovery, Account-Wiedereinstieg und die
bisherige Match-Lock-Strecke. Die bestehende Engine-/KI-Entscheidungsautorität
wurde nicht geändert. Timergebundene Countdown-Fortsetzungen warten auf eine
Rücknahme der Sperre, statt verloren zu gehen. Die neue token- und
loopbackgeschützte POST-/DELETE-Schnittstelle, Nonce-Bindung, Abbruchsemantik
und 30-Sekunden-Akquisitionsgrenze sind im Update-Runbook beschrieben.

35 fokussierte Tests in vier Dateien bestehen, einschließlich 17
Admission-Owner-Tests, elf realer SQLite-/HTTP-Vorbereitungstests, der fünf
Readiness-Tests und zwei Präsentationsprüfungen. Zusätzlich bestehen sechs
ausgewählte vorhandene Multiplayer-Regressionen für Host-Abbruch,
Lobbyerhalt, Reconnect, Undo, nächstes Serienspiel und den Zwei-Tab-Lobbyweg.
Server-, Shared- und Web-Typechecks sind grün. Das Sprachgate besteht mit
2.344 ausgerichteten Meldungen in drei Sprachen und 64 Oberflächen; es wurde
aus dem Repositoryroot gestartet, da der vorhandene Paketalias fälschlich
einen paketrelativen Arbeitsordner voraussetzt. Dieser unabhängige Aliasfehler
wurde nicht nebenbei verändert.

Der Windows-Launcher ruft die neue Vorbereitung noch nicht auf; seine
Anbindung, Abbruch-/Recovery-Koordination und direkte MSI-Upgrades bleiben
offen. Deshalb ist dies ein geprüfter Server-Teilschritt, keine vollständige
Schließung des Updategates. Es wurde kein neuer Installer gebaut, kein
vorhandenes Artefakt verändert und keine Sandbox-Installation gestartet.

Der nächste Teilschritt ergänzt den noch nicht aufgerufenen
`UpdatePreparationClient` für den Launcher. 44 fokussierte Checks belegen
exakte Antwortvalidierung, konsistente Freigabe/Matchanzahl, dieselbe
Versuchs-Nonce bei der Rücknahme nach ungültiger Antwort, Ablehnung
fehlgeschlagener Rücknahme-Quittierungen sowie die 4.096-Byte-Grenze und
Loopbackbeschränkung. Der vollständige paketnahe Launcher-Testlauf besteht
auch weiterhin mit 14 Installationsstoppchecks, STA-Einstieg, 35
Updatefehlerchecks und Download-/Tamper-Regressionen. Keine Installation
oder native Dialogaktion wurde dabei ausgeführt.

Die Prüfung des bestehenden Updaters zeigt zusätzlich, weshalb die
Tray-Anbindung noch nicht abschließend erfolgen kann: `WaitForParent`
akzeptiert bloß das Ende beziehungsweise Fehlen einer PID. Eine explizite,
prozessgebundene Übergabebestätigung fehlt; vor dem MSI-Beginn liegt bereits
das Backup, während die MSI-Sperre noch keinen neuen Launcherstart blockiert.
Die Ursachenfix-Arbeit muss diesen gesamten exklusiven Updateabschnitt
einschließlich Abbruch und Wiederaufnahme abdecken. Die aktuelle Vorbereitung
wird deshalb noch nicht in den unsicheren bisherigen Übergabepfad eingebaut.
WIN-I08 bleibt aktiv und der vorbereitete Installer 8169 unverändert.

Der gemeinsame Übergabetransport ist anschließend als `UpdateHandoff`
ergänzt und in Launcher sowie Updater als gemeinsame Quelle eingebunden.
49 Checks bestehen mit echten Windows-Pipes, geschützter DACL,
Netzwerkausschluss, Kernel-Peerprüfung, PID-/Startzeit-/Imagebindung und
getrennten, ausschließlich selbst gestarteten Testprozessen. Explizite
Freigabe und Abbruch sind quittiert; falscher Gegenprozess, ungültige
Nachrichten, EOF vor einer Entscheidung und Empfangstimeout werden
abgewiesen. Ein nach möglicher `Proceed`-Zustellung fehlendes oder falsches
Ack bleibt ausdrücklich ein unklarer Ausgang und setzt die Freigabe nicht
stillschweigend zurück. Die zugehörige Caller-Pflicht ist im Runbook gesichert.

Die bisherigen Launcher- und Updater-Komponententests bestehen weiterhin;
das geänderte Buildscript besteht die PowerShell-Syntaxprüfung. Kein
vollständiger Installerbuild, keine Erhöhung und keine native
Installationsaktion wurden ausgeführt. Der Transport wird noch nicht im
realen Tray-/Updater-Startpfad aufgerufen. Insbesondere bleiben die
transaktionsweite Startsperre einschließlich Backup und Healthcheck,
deren Eigentümerschaft gegenüber den MSI-Teiltransaktionen sowie die
konkrete Anbindung der sicheren Übergabe offen.

Der gemeinsame Writer der bestehenden Installersperre unterstützt jetzt
explizit Vorbereitung, Stopp und Abschluss. Die Vorbereitung bewahrt exakt
den ursprünglichen Launcher (PID plus Startzeit), ihr Abbruch erhält diese
Ausnahme, und der Stopp entfernt sie. Die atomare Registrybindung
bewahrt den Abschluss-Cutoff und serialisiert konkurrierende Writer. Es gibt
keinen zweiten Sperrowner und keine stillschweigende Altformatkonvertierung.
157 Lifecyclechecks bestehen in isoliertem HKCU, einschließlich acht
konkurrierender Schreiber und der verspäteten/recycelten Prozessidentitäten.
Launcher-, Updater- und First-Run-Tests sowie der geänderte net48-MSI-
Komponentenbuild bestehen ebenfalls (Build: null Warnungen und Fehler).
Der Writer wurde aus der MSI-Komponente nach `Common` verschoben; die alte
Datei bleibt über Git wiederherstellbar. Die updateweite Phasenanbindung,
MSI-Teiltransaktionen und Healthfreigabe sind weiterhin offen. Dieser
Quellstand wurde nicht als Installer gebaut oder installiert; der bereits
bereitgestellte Kandidat 8169 bleibt unverändert.

Im vorhandenen Launcher-Stopp wurde anschließend eine tatsächliche
Ownership-Lücke geschlossen: Die Prozessslots werden nicht mehr vor dem
Stopp gelöscht, und auch nach dem eigenen Web-Kill wird das Prozessende
abgewartet. Fehler behalten den ungeklärten Handle, stoppen das andere Kind
trotzdem und verhindern einen überschreibenden Neustart. Watcher und Tray
melden fehlgeschlagene Stopps sichtbar, statt einen erfolgreichen Abschluss
anzunehmen oder den Owner wegzuwerfen. Der Startpfad räumt auch einen schon
gestarteten Server auf, wenn der nachfolgende Webstart scheitert.

18 neue Ownershipchecks mit eigenen Testprozessen bestehen, daneben alle
14 bisherigen Installationsstoppchecks, 44 Vorbereitungsklientchecks,
35 Fehlerchecks sowie STA-/Download-Regressionen. Der Sprachkatalog ist für
179 Strings in drei Sprachen vollständig; dies ist keine neue native
Darstellungsabnahme. Die 157 Lifecyclechecks bleiben grün. Ein erster
Testlauf scheiterte am nicht rechtzeitig gehaltenen Beobachterhandle; der
korrigierte Test bindet ihn vor dem Stopp und prüft das Ende ohne nachträglich
darauf zu warten. Der bestehende erzwungene Serverstopp bei fehlgeschlagenem
stdin-Shutdown belegt weiterhin keinen sauberen Storage-Flush; die atomare
Updateübergabe bleibt offen. Keine Installation oder Credentialänderung.

Der Vorbereitungsklient ist jetzt an `LauncherRuntime` gebunden: Ein
`PreparedUpdate` hält die bereits vorhandene Lifecycle-Sperre durch POST,
quittierte Rücknahme oder strikten Stopp. Ein unklarer Abbruch setzt ein
terminales Startverbot und stoppt über denselben Owner; es entsteht keine
zweite Prozess- oder Recoveryautorität. Der Update-Stopp verlangt einen
noch laufenden Server, erfolgreichen stdin-Shutdown und Exitcode 0 sowie
das nachgewiesene Ende beider eigenen Prozesse. Ein erzwungenes Beenden,
ein vorheriges Prozessende oder fehlgeschlagene Quittierungen ergeben keine
Updatefreigabe. Normaler Betrieb behält seine bestehende Abschaltpolicy.

39 neue Runtime-Vorbereitungschecks bestehen mit verzögerten Antworten,
konkurrierendem Start/Abschluss, aktivem Spiel, fehlerhaftem POST/DELETE,
erfolgreichem Stopp, Server-Fehlerexit und unbrauchbarer stdin-Pipe. Tests
verwenden nur synthetische HTTP-Antworten und eigene inerte Kindprozesse.
Der gesamte Launcher-Komponententest bleibt grün; sein geänderter Build
hat null Warnungen und Fehler. Die echte Tray-/Updater-Anbindung sowie
MSI-Teiltransaktionen und die Healthfreigabe bleiben weiterhin offen.
Kandidat 8169 wurde dabei weder ersetzt noch installiert.

Die MSI-Seite bindet jetzt Standalone- und Updater-Teiltransaktionen sowie
den verschachtelten Altversions-Uninstall an denselben Registryowner.
Version 3 des atomaren Records ergänzt MSI-Lease und ProductCode; alte
Formate werden nicht automatisch konvertiert. Ein MSI-Abschluss löst die
äußere Updatesperre nicht, und ihr Owner kann sie nicht während einer aktiven
MSI-Teiltransaktion freigeben. Ein vom Updater beauftragter MSI-Lauf prüft
zusätzlich dessen noch lebende PID/Startzeit. Der Aufruf durch den echten
Updater bleibt noch anzubinden; der vorbereitete Setuphost-Modus folgt unten.

Die neue Reihenfolge `afterInstallExecute` wird in einem ausdrücklich nicht
installierbaren Diagnosepaket tatsächlich als `6500 < 6501 < 6600`
(`InstallExecute`, `RemoveExistingProducts`, `InstallFinalize`) gespeichert.
Die ursprüngliche Quelle und die wirkliche MSI-Tabelle sind getrennt geprüft,
weil die WiX-7-Rückübersetzung dieser Probe fälschlich
`afterInstallFinalize` ausgibt. Der Paketchecker darf diese Rückübersetzung
nicht als Sequenznachweis verwenden. Firewall-/Daten-Cleanup und ihre
Parameterbereitstellung sind im verschachtelten Uninstall ausgeschlossen.

205 Lifecyclechecks, vier Binär-/Authoring-Regressionstests, der net48-Build
mit null Warnungen/Fehlern und die echten MSI-Tabellen-/Strukturprüfungen
bestehen. Launcher-, First-Run- und Updater-Komponententests bleiben grün.
Der letzte zusätzliche Record-Invariantencheck wurde nach der Probe nur
als Komponentenbuild geprüft; es wird kein vollständiger aktueller
Installer-/Payloadaudit behauptet. Native Zwei-Versionen-Upgrades,
Rollback, Aktivspielschutz und Komponentenreferenzzählung bleiben offen.
Die Diagnoseprobe ist im Runbook gebunden; 8169 und dessen Sandbox bleiben
unverändert. Kein Main-Merge, Push oder Release.

Der Setuphost bietet nun explizite updatergebundene Installations- und
Deinstallationsbefehle mit validierter Lease und Programmroot. Er bindet
vor Extraktion/Start den registrierten Installationsort und den lebenden
Updateprozess und reicht die Lease an MSI weiter. Setuphost und MSI nutzen
dabei dieselbe read-only Prozessbindung; PID-Wiederverwendung, fehlender
Owner, falsche Phase und schon aktive MSI-Teiltransaktion werden abgewiesen.
Standalone-Operationen bleiben getrennt und übernehmen keine vorhandene
Sperre. Insbesondere gilt MSI-Code 1605 im gebundenen Rollback nicht als Erfolg.

52 neue Setup-Argument-/Ergebnischecks und neun zusätzliche Ownerchecks
bestehen. Insgesamt sind 2.103 Setupchecks, 214 Lifecyclechecks, 180
Sprachstrings in `de`/`en`/`fr` sowie die geänderten Setup-/net48-Builds grün.
Die Setupprüfungen erzeugen nur Offscreen-Vorschauen, keinen installierten
Produktstand. Die echte Updater-/Tray-Anbindung einschließlich Healthpermit
und die nativen Gates bleiben offen. 8169 ist unverändert und nicht gestartet.

Die Healthprüfung besitzt nun eine vorbereitete, ausschließlich für den
gebundenen Prüfkindprozess gültige `verifying`-Phase. Sie verwendet dieselbe
Installersperre, prüft zusätzlich den lebenden Updater-Owner und öffnet keinen
allgemeinen Startpfad. Der Updater widerruft die Ausnahme nach Erfolg oder
Fehler und wartet auf das echte Kindprozessende. Ein fehlgeschlagener
Widerruf überspringt die Prozessverfolgung nicht; ungeklärtes Ende bleibt ein
Fehler mit gehaltener äußerer Sperre. Der Launcher verlangt für einen
erfolgreichen Healthlauf jetzt einen geordneten Server-Stopp mit Exitcode 0.

45 neue Prüfprozesschecks verwenden echte lokale Pipes, ausschließlich eigene
inerte Prozesse und isolierte HKCU-Testbäume. 24 Launcher-Argumentchecks und
14 zusätzliche Runtimechecks sichern vollständige Freigabeparameter und
strikten Stopp. Die bestehenden 49 Pipe- und 214 Lifecyclechecks bleiben
grün; die Runtime-Vorbereitungssuite umfasst jetzt 53 Checks. Dies ist ein
Komponentennachweis, keine Installation. `UpdateTransaction` und Tray rufen
die neue Prüffreigabe noch nicht auf. Diese Anbindung sowie die nativen Gates
bleiben offen; Kandidat 8169 ist unverändert.

Am 8. September ist die zusammenhängende Anbindung im tatsächlichen
Tray-/Updaterpfad umgesetzt: hashgeprüfte und gesperrte Updaterkopie je
Versuch, eindeutige Requestparameter, registrierte Pfad- und Prozessbindung,
`preparing` vor atomarer Servervorbereitung, strikter Stopp vor `Proceed`,
echtes Parent-Ende und Prüfung verbleibender Produktprozesse vor Backup.
MSI und beide Healthläufe nutzen dieselbe äußere Lease. Der Programmrollback
verwendet das erlaubte MSI-Downgrade statt einer vorgelagerten Deinstallation,
die die noch benötigte Installationsregistrierung entfernen würde.

32 neue Sessionchecks mit tatsächlich endendem Parent, 44 Requestchecks,
16 Stagingchecks einschließlich ausgeführter inerter Windows-CLI unter
gehaltenem Dateilock und 42 neue Runtime-/Übergabechecks bestehen. Die
Runtime-Vorbereitungssuite umfasst jetzt 95 Checks. Unter anderem sind aktive
Partien, fehlender Cancel-Abschluss, falsche Ownerbindung, vorzeitig
beendeter Worker, fehlgeschlagener Serverstopp und verlorenes Ack abgedeckt.
Die bestehenden 49 Pipe-, 45 Healthpermit- und 214 Lifecyclechecks sowie
Updater-Umgebungs-/Logtests und vier MSI-Strukturgates bleiben grün.

Dies sind keine erhöhten Installationsnachweise. Der direkte Neustart aus
dem erhöhten Updater ist noch auf den ursprünglichen normalen Benutzer zu
binden. Der bisherige Rollback-Sandboxharness mit synthetischer Parent-PID
kann den neuen Vertrag nicht mehr prüfen und muss durch einen gebundenen
Produktlauf ersetzt werden. Direkter MSI-Aktivspielschutz, aktuelle
Zwei-Versionen-Upgrades und die übrigen nativen Gates bleiben offen. 8169,
Sandbox, Main und vorhandene Maintenance-Zugangsdaten wurden nicht verändert.

Der anschließende Benutzer-Neustart ist inzwischen im Transaktionsowner
angebunden. Vor Lease-Erwerb prüft der Updater sein vorhandenes
Prozessstartrecht und hält ausschließlich den nicht vererbbaren Token und
Environmentblock des bereits gebundenen ursprünglichen normalen Launchers.
Benutzer, Sitzung, Anmeldevorgang und nicht erhöhte Rechte müssen vor der
Freigabe des neu erzeugten angehaltenen Kindes erneut übereinstimmen. Es
gibt weder einen erhöhten Ersatzstart noch eine gespeicherte Anmeldung.
Ein nicht gelungener Neustart nach gesundem Update erhält eine eigene Meldung
und Exitcode 4; eine verifizierte alte Version nach MSI-Fehler wird ebenfalls
zutreffend gemeldet.

39 neue Kontext-/Neustartchecks sind grün, darunter x64-Interoplayouts, echte Windows-Token- und
Environmentabfragen, Parent-Ende, nicht vererbbare Handles sowie die geprüfte
Bereinigung eines eigenen angehaltenen inerten Prozesses. Der lokale Host ist
uneleviert: Die CreateProcessWithTokenW-Prüfung bestätigt hier erwartungsgemäß
Fehler 1314, nicht einen erfolgreichen erhöhten Start. Die 49 Pipe-, 45
Healthpermit-, 32 Session- und 44 Requestchecks bleiben grün; das
Updater-Vertrags-/Umgebungs-/Loggate und 182 UI-Strings in drei Sprachen
bestehen. Kein neuer Installer, keine UAC-Ausführung und kein nativer
Benutzerwechsel wurden in diesem Schritt gestartet. Der erfolgreiche
erhöhte Neustart einschließlich anderer Administratorkonto-Freigabe bleibt
ein konkretes natives Gate, kein als erledigt ausgewiesener Komponentencheck.

Die gemeinsame Start-Mutex ist im Launcher-Start-/Recovery-Owner, First Run,
MSI-Lease-Erwerb und Updater-Vorbereitung eingebunden. Die letzte Gateprüfung
und der Kindstart können nicht mehr durch den Lease-Erwerb getrennt werden;
der gebundene Updater prüft den ursprünglichen Parent unter derselben Mutex
erneut. Die kurze Mutex wird nicht über Health-/Pipe-/Prozesswartezeiten
gehalten und gibt normalen Benutzern keine Registry-Schreibrechte.
Die Lifecycle-Prüfung umfasst jetzt 239 Checks einschließlich echter
Zwei-Prozess-Konkurrenz, DACL, Abandonment, Timeout und Start-/Lease-Reihenfolge
in isoliertem HKCU. Vier neue Launcherchecks und zwei zusätzliche First-Run-
Checks prüfen die tatsächlichen letzten Guardstellen unter der Mutex, ohne
Runtime oder Credentialzugriff. Launcher-, Handoff- und First-Run-Regressionen
sind grün, die Framework-4.8-MSI-Komponente baut ohne Warnungen. Dies ersetzt
keinen erhöhten Mehrbenutzer- oder vollständigen MSI-Lauf; 8169 und die Sandbox
bleiben unverändert.

Der direkte MSI-Aktivspielschutz ist inzwischen im Quellpfad angebunden:
geschützte `preparing-msi`-Phase, exakt gebundener ursprünglicher Launcher,
derselbe atomare Server-Preparation-Owner und derselbe Pipevertrag wie beim
Updater. Nur ein bestätigter geordneter Stopp erlaubt den Übergang zum
Dateiaustausch; aktive Spiele, verlorene Verbindung und Stopfehler tun dies
nicht. Ein passender Rollback darf eine Vorbereitung abbrechen und den
ursprünglichen Launcher erhalten; ein Commit darf die unbestätigte Phase
nicht als Erfolg abschließen. Der normale Launcher benötigt zum Prüfen des
MSI-Prozesses nur Lese-/Warterechte. Alte installierte Teststände ohne den
aktuellen registrierten Protokollvertrag werden vor der neuen Phase abgewiesen.

Ein Versionswechsel ohne Launcher liest SQLite über den neuen vorhandenen
Storage-CLI-Entrypoint, ohne Storageinitialisierung oder Credentialzugriff.
Alle elf gespeicherten Statuswerte werden gegen die bestehende Maintenance-
Definition geprüft. Die Reparatur desselben Produkts ohne aktive Runtime
kann fehlende Prüfbinärdateien wiederherstellen; bei laufender Runtime gilt
auch dort die Launcher-Vorbereitung. Expliziter Uninstall bleibt autorisiert.

Aktuelle Komponenten-Evidence: 306 Lifecyclechecks inklusive echter Pipe-
Partner, Absage/EOF/Prozessende, Offline-Readiness-Parser, Protokollregistrierung
und tatsächlichem isoliertem Node-Probeaufruf mit Umlaut-/Leerzeichenpfaden;
118 Runtime-Preparation-Checks inklusive fünf neuer MSI-Antwortszenarien;
fünf Read-only-Prozessidentitätschecks einschließlich Exitcode 259. Die
bisherigen Handoff-, Healthpermit-, Session-, Request-, Neustart- und
Updater-Komponentengates bleiben grün. Vier neue Storage-/CLI-Tests, fünf
bestehende HTTP-Readiness-Tests und der Server-Typecheck sind grün. Die elf
SQLite-Zustandsfälle benötigen zusammen ein eigenes 30-Sekunden-Testfenster;
ein zuvor überschrittenes Fünf-Sekunden-Limit wurde nicht als fachlicher
Erfolg gewertet. Die Framework-MSI-Komponente baut ohne Warnungen.

Kein Installer wurde in diesem Schritt neu gebaut oder ausgeführt; kein
UAC-/SYSTEM-/anderes Administratorkonto-Test wurde behauptet. Der aktuelle
Quellpfad ersetzt weder die Zwei-Build-MSI-Abnahme noch Payload- oder
Uninstall-Nachweise. Außerdem bleibt zu klären und umzusetzen, wie direkte
MSI-Versionswechsel den geforderten vollständigen Backup-/Health-/Restore-
Vertrag erfüllen; die Aktivspielprüfung allein ist kein vollständiges
Transaktions- oder Release-Done. Sandbox, 8169 und Zugangsdaten sind unverändert.

Die anschließende Prüfung der Sicherungsquelle zeigt eine weitere konkrete
Lücke innerhalb dieses Vertrags: Auch der vorhandene Updater sichert mit
`backup-update` nur die Match-SQLite-Datei. Separate Kontendatenbanken,
Konfiguration, Credentials, Deckdateien und Kartenbilder sind nicht enthalten.
Der alte SQLite-Backupnachweis bleibt gültig, wird aber nicht als Nachweis
für den vollständigen Datenbestand gewertet. Die unten beschriebene neue
Updater-Anbindung schließt die Dateiabdeckung im Komponentenpfad; direkte
MSI-Anbindung und native Gesamtprüfung bleiben offen.

Als notwendige Korrektur der Datenablage verwendet die Web-Deckbibliothek im
Releaseprofil nun `NETGRID_DATA_ROOT/runtime/decks` statt des Windows-
Benutzerprofils. Ungültige Releasepfade und Overrides außerhalb des Datenroots
scheitern sichtbar; die Entwicklungsdefaults bleiben erhalten. Neun fokussierte
Tests einschließlich tatsächlicher Standardpfad-I/O, simuliertem Wechsel von
`APPDATA` und unveränderter Entwicklungsbibliothek sowie der Web-Typecheck sind
grün. Das ist keine Windows-Identitäts-/ACL-Abnahme. Es wurde kein neuer
Installer gebaut oder gestartet und kein bestehender Datenbestand migriert.

Der Updater verwendet inzwischen den neuen vollständigen Live-Datenroot-
Snapshot statt des Match-SQLite-CLI-Backups. Gesichert werden auch getrennte
Kontendatenbanken, Sidecars, Decks, Kartenbilder, Import-/Paketdateien,
Konfiguration und Logs. Historische Backups und Installer-Caches sind klar
ausgeschlossen; alle konfigurierten Live-Pfade müssen im erfassten Root liegen.
Private Archiv-DACL und Administratoren-Eigentümer sind verbindlich. Der
Restore sichert zuerst den fehlgeschlagenen aktuellen Bestand, prüft ihn
erneut gegen Veränderungen und ersetzt dann nur die gebundenen Dateien.
Auch nach einem fehlgeschlagenen MSI erfolgt dies vor dem Healthcheck und
Wiederanlauf. Credentials und Runtimekonfiguration werden niemals überschrieben.

85 fokussierte Assertions sind grün: vollständige Datei-/Leerordnerabdeckung,
Pfad- und Ausschlussgrenzen, DACL-Policy, echte Hardlinks/Junctions,
Umbenennungs- und Schreibsperren, manipulierte Backups, unveränderte
Zugangsdaten, Original-Abwesenheit einer Datenbank und ein Restore zweier
echter SQLite-Dateien mit noch nicht in die Hauptdatei übernommenen WAL-Daten.
Der Rücksicherungstest verändert auch Verzeichnisrechte; Datei-, Verzeichnis-
und Root-DACLs werden nach dem Restore geprüft. Die initiale reine
Attribut-Verzeichnissperre ließ Umbenennen zu; erst die korrigierte
`FILE_LIST_DIRECTORY`-Bindung besteht diesen nativen Fixture-Test. Kein roter
Vorläuferlauf wurde als Nachweis gewertet. Die Updater-Regressionstests sind
ebenfalls grün; das neue Snapshot-Gate ist an die Installer-Buildstrecke gebunden.

Die Archivtests verwenden nur eigene temporäre Fixture-DACLs und sind keine
erhöhte SYSTEM-/Administratoren-Abnahme. Eine Rücksicherung nach Verlust des
Updaterprozesses benötigt noch einen autorisierten Reparatureinstieg mit
geprüfter Owner-Übernahme. Direkte
MSI-Versionswechsel, neue Payloads und die native Gesamtmatrix sind weiterhin
nicht freigegeben. Es wurde kein Installer gestartet, keine Sandbox verändert
und kein bestehendes Maintenance-Kennwort angefasst. WIN-I08 bleibt aktiv.

Die gespeicherte Sicherung kann inzwischen anhand einer separat vertrauenswürdig
gebundenen ID und Manifestprüfsumme erneut geöffnet werden. Manifestversion 2
bindet zusätzlich die geschützten Pfade; alte, doppelte, mehrdeutige oder
unvollständige Felder, Pfadtraversal, Windows-Dateialiasse, falsche Hashes und
abweichende Rechte werden abgewiesen. Fehlende normale Verzeichnisse werden
beim Restore mit ihren ursprünglichen DACLs angelegt. Stagingdateien erhalten
ihre effektiven Rechte atomar vor dem ersten kopierten Byte; eine zwischenzeitlich
erweiterte Eltern-DACL darf keine zusätzlichen Leser hinzufügen.

Vor jedem MSI-Start speichert der Updater seine Snapshot- und vorherige
Setup-Prüfsumme zusammen mit Lease und Datenroot als atomaren `Recovery`-Wert
im bestehenden geschützten Lifecycle-Key. Der einzige Lease-Writer prüft
aktuellen Prozess, Startzeit, Phase und fehlende MSI-Teiltransaktion.
Der normale Updater-Rollback öffnet das Archiv bereits über diese Referenz
erneut, statt ausschließlich dem gehaltenen Objekt zu vertrauen. Abweichende
Neubindungen, fremde/abgeschlossene Leases und beschädigte Registrywerte werden
nicht automatisch ersetzt oder freigegeben.

Aktuelle gezielte Evidence: 111 Snapshot-/Restore-Assertions, einschließlich
eines tatsächlich beendeten separaten Snapshot-Erzeugerprozesses, erneuter
Öffnung, Wiederherstellung eines gelöschten Datenverzeichnisses und
Staging-ACL-Prüfung vor dem ersten Byte. 331 Lifecyclechecks sind grün,
darunter 25 neue Tests der geschützten Recovery-Bindung in einem eigenen
HKCU-Fixture. Die echte Updater-Sitzungsprüfung bindet ihre Recovery-Referenz
ebenfalls; Handoff-, Verifier-, Session-, Request- und ursprüngliche
Benutzer-Neustart-Gates bleiben grün. Die DTF-Komponente baut unter .NET
Framework 4.8 ohne Warnungen. Keine native Installation wurde ausgeführt.

Der explizite Reparatureinstieg ist inzwischen implementiert: Er fragt nach
Zustimmung und startet eine erhöhte, separat kopierte Updater-Instanz. Der
installierte Bootstrap muss vor dem MSI-Lauf tatsächlich beendet sein.
Die zentrale Lease-Autorität übernimmt ausschließlich denselben verwaisten
Vorgang nach Prozessende, ohne aktive MSI-Teiltransaktion oder verbleibende
Produktprozesse. Sie prüft den unveränderten Registryzustand unter Start- und
Schreibsperre erneut. Erst Programmrestore, Datenrestore und gebundener
Healthcheck erlauben die Freigabe; ein Neustart bleibt eine normale
Benutzeraktion. Das vorherige Setup wird vor dem ersten MSI zusätzlich
prüfsummengebunden im geschützten Snapshot erhalten, sodass auch ein schon
ausgetauschter Installer-Cache die Absturzreparatur nicht verhindert.

Die gemeinsame Staging-Implementierung von Launcher und Reparatureinstieg
hält nun Quelle, Kopie und sämtliche Elternverzeichnisse gegen Austausch
gesperrt. Jeder neue Unterordner wird unter gepinntem Elternordner angelegt
und vor dem nächsten Zugriff gegen Reparse Points geprüft. Dateilinks werden
abgewiesen. 20 Stagingchecks sind grün, einschließlich Verzeichnis-Rename,
Junction-Abweisung ohne Zieländerung, Lock-Freigabe im Fehlerfall und tatsächlicher
Ausführung einer inerten Windows-CLI unter Dateisperre.

Aktuell grün: 373 Lifecyclechecks mit 42 neuen Owner-Übernahmeprüfungen in
eigenen HKCU-Fixtures und echten, selbst gestarteten Kindprozessen; 113
Snapshot-/Restore-Assertions einschließlich des dauerhaft erhaltenen alten
Setups nach Cachewechsel; 23 Reparaturreihenfolge-/Argumentprüfungen ohne UAC
oder MSI. Launcher-, Handoff-, Verifier-, Session-, Request- und ursprüngliche
Benutzer-Neustart-Gates bleiben grün. Der net48-DTF-Build hat keine Warnungen
oder Fehler; vier Lifecycle-Strukturtests und 185 UI-Sprachschlüssel in
de/en/fr sind geprüft. Die Sprachquellenprüfung ersetzt keinen nativen Renderlauf.

Die native erhöhte Reparatur, native direkte MSI-Transaktionsparität, erhöhte
Rechteprüfung und die native Gesamtmatrix bleiben offen. Keine Installation,
UAC-Aktion oder bestehende Zugangsdaten wurden bei diesen Prüfungen berührt;
der Prozess behauptet kein Release-Done.

### Direkte MSI-Verifikation und Datenanbindung: native Abnahme offen

Der bestehende Verifier kann jetzt innerhalb einer exakt gebundenen direkten
MSI-Operation arbeiten. Die zentrale Lease-Autorität bindet den Helper an
seine tatsächliche PID/Startzeit und erhält Lease/ProductCode über die
Verifierfreigabe und deren Widerruf. Sie verweigert Abschluss oder Rollback
solange der Helper die Operation hält. Die Rückgabe der Rolle allein gibt
NETGRID nicht frei. Äußere Updater-Lease und untergeordnete MSI-Lease dürfen
nicht identisch sein; ihr MSI-Teil kann keine direkte Operationsrolle übernehmen.

403 Lifecyclechecks sind grün, davon 30 neue Operationsprüfungen für Identität,
Fremdprodukt, doppelte Übernahme, Wiederverwendung einer PID, Startblockade,
Commit-/Rollback-Sperre und Trennung vom äußeren Updater. 75 Verifierchecks
decken zusätzlich echte isolierte Kindprozesse für erfolgreiches, ungesundes
und widerrufenes direktes MSI-Verify ab; in jedem Fall wird das tatsächliche
Prozessende geprüft und die MSI-Bindung erhalten. Die bestehenden Handoff-,
Session-, Request-, Neustart- und Launcher-Gates sind grün. Die gemeinsame
DTF-Komponente baut für net48 ohne Warnungen oder Fehler.

Snapshot/Verify/Restore sind inzwischen an die Custom Actions angebunden.
Direkte Versionswechsel starten vor den MSI-Dateiänderungen den installierten
Updater synchron zur Sicherung. Ein geschützter `MsiData`-Wert bindet
Lease/ProductCode, Datenroot, Snapshot-ID/Hash und die Zustände `preparing`,
`captured`, `verified`, `restored`. Nur geprüfte neue Daten erlauben Commit;
nur geprüfte Rücksicherung erlaubt Rollback-Freigabe. Ein bereits gescheiterter
Snapshot vor Dateimutationen darf abgebrochen werden. Fehler oder Prozessverlust
mit aktiver Operation lösen die Sperre nicht automatisch. Bestehende
Credentials und Konfiguration werden bei jedem Wiederöffnen geprüft und
niemals überschrieben.

`VerifyNetgridLifecycle` ist ein fünfter, synchroner SYSTEM-Deferred-Export.
Er wird vor `InstallFinalize` ausgeführt; die zuerst registrierte
Rollback-Aktion stellt nach MSI-Programmrollback die Daten wieder her und
prüft die Vorversion. Der Code verlangt jetzt `msi-data-v1` beim Ausgangsprodukt;
zwei neu gebaute Stände sind nötig. Alte Testinstaller bleiben ungeeignet.

71 Transaktionstests mit echten temporären Snapshotdateien prüfen Erfolg,
Healthfehler, Commit-Rollback, Sicherungs-/Restorefehler, geschützte Credentials,
Archivbindung und strikte Argumente. 407 Lifecyclechecks, 75 Verifierchecks,
die übrigen Handoff-/Session-/Request-/Neustart-Gates und Updater-Unitchecks
sind grün. Ein ungültiger `--msi-data`-Aufruf endet geprüft ohne nativen Dialog.
Der net48-DTF-Build ist warnungsfrei; vier Strukturtests sichern fünf Exporte.

Die aktuelle Product.wxs wurde zusätzlich mit WiX 7.0.0 und inerten Dateien
in `output/msi-authoring-probe-277f5295418249e0a480d151cd4bf921/`
kompiliert. Die tatsächliche MSI-Tabelle ist geprüft: `InstallExecute=6500`,
`RemoveExistingProducts=6501`, `VerifyNetgridLifecycle=6599`,
`InstallFinalize=6600`. Das Prüf-MSI wurde nicht installiert und ist kein
Releaseoutput. Neue vollständige Payloads, echte MSI-Rollback-Ausführung,
SYSTEM-/Mehrbenutzerverhalten und die native Sandbox-Gesamtmatrix bleiben
offen. Diese Evidence behauptet keine vollständige native Datentransaktion.

Vor der Freigabe bleiben die vollständige Prozess-Ende-Raceprüfung,
die native Abnahme direkter MSI-Updatepfade hinsichtlich
laufender Spiele und vollständiger Transaktionsabsicherung, verständliche lokalisierte Fehler, die vollständige
Build-/Payloadprüfung und der native Uninstall-Nachweis offen. Eine nach
hartem Abbruch stehengebliebene fremde aktive Lease wird absichtlich nicht
automatisch gelöscht. Das Uninstall-Gate bleibt rot; kein Main-Merge,
kein Push und kein Release.

#### Kandidat 8168 und nachgezogene Framework-Prüfung

Der saubere Commit `ab6f87db5` wurde vollständig als `1.0.8168` unter
`output/windows-installer-lifecycle-8168` gebaut. Produktoutput, 2.042
Setupchecks, 68 First-Run-Checks, Launcher-/Updater-Tests und -Smokes,
47 Lifecycle-Checks, drei Binäraudit-Regressionstests, innere CA-Payload,
177 Sprachstrings, 27 Darstellungsrenderings und der vollständige Audit von
10.902 installierten Dateien bestanden. Der Build ist terminal mit Exitcode 0.

**Dieser Kandidat ist dennoch nicht zur Installation freigegeben.** Eine
zusätzliche Voraussetzungenprüfung fand einen Fehler in der neuen .NET-
Framework-Bedingung: `RegistrySearch Type="raw"` liefert DWORD-Werte mit
`#`-Präfix, während die Bedingung bisher gegen die ungekennzeichnete Zahl
`528040` verglich. Der echte MSI-Auswerter bestätigt am gebauten 8168-MSI
für `#528040` fälschlich `false`. Die Bedingung wurde auf den dokumentierten
Rohwertvergleich mit `"#528040"` korrigiert. Führend ist das
[RegLocator-Rohwertformat](https://learn.microsoft.com/en-us/windows/win32/msi/reglocator-table).

`check-windows-msi-framework.ps1` öffnet eine isolierte MSI-Paketsitzung mit
`IGNOREMACHINESTATE`, setzt nur deren temporäre Testeigenschaft und wertet
die tatsächliche LaunchCondition aus. Es ruft keine Installationsaktion,
keinen AppSearch und keine ExecuteSequence auf. Fehlender Wert und zwei zu
alte Versionen müssen abgewiesen, .NET 4.8 sowie der tatsächliche
Sandboxstand .NET 4.8.1 angenommen werden. Eine ausschließlich zu dieser
Diagnose geänderte Kopie unter
`output/framework-condition-probe-c93f67905b994b1a8115d2cce94dd229/PROBE-NOT-FOR-INSTALLATION.msi`
besteht alle fünf Fälle; die Quellautorisierung besteht mit 48 Lifecyclechecks.
Die neue Prüfung ist vor dem Payload-Audit in der Buildstrecke gebunden.
Der korrigierte Quellstand wurde anschließend als eigener Kandidat 8169
gebaut; dessen konkreter Nachweis folgt unten.

Die bestehende Sandbox `8d4881be-5836-42a6-b4b5-48ebea3aa95f` wurde um
19:30:52 UTC lesend geprüft: kein installiertes NETGRID-Programm, keine
Produktprozesse, keine Listener auf 3100/8787, Konfiguration und vorhandene
Maintenance-Credentials weiterhin hashidentisch, Framework-Releasewert
533320. Der vom Nutzer bestätigte Installationsversuch wurde wegen des
nachgewiesenen Kandidatenfehlers noch nicht ausgeführt. Es wurde nur der
Explorer in dieser Sandbox geöffnet; weder Installation noch UAC- oder
Passworteingabe erfolgten. Die vorbereiteten 8168-Staging-/Fortschrittshelfer
wurden nicht ausgeführt und dürfen nicht versehentlich für den Nachfolger
verwendet werden.

#### Korrigierter Kandidat 8169 bereit zur nativen Abnahme

`1.0.8169` wurde aus dem sauberen Commit
`88b381b82a351b1990dcf6e9a7aeb2f370e36f49` unter
`output/windows-installer-lifecycle-8169` vollständig gebaut (Exitcode 0,
`sourceDirty=false`). Die fünf Frameworkfälle bestehen am tatsächlichen
MSI, ebenso die MSI-Sequenz-/Typprüfung, 48 Lifecyclechecks, die übrigen
Komponentenprüfungen und Smokes sowie der vollständige Audit von 10.902
Payload-Dateien. Setup-SHA-256:
`284eee31524946ecaaabba534ae0be62c54bfb8271677f8c69c59f6ea54d9c44`;
MSI-SHA-256:
`3266eac0e84311fcca58eb0279e3125fdea42af22d0ff325e35ddc8cbedaf8a1`.

Am 7. September um 20:00:55 UTC wurden ausschließlich Setup und Metadaten
hashgeprüft nach `C:\NETGRID-Test\lifecycle-8169` in der bestehenden Sandbox
kopiert. `result/native-8169-staged.json` bindet Pfad und Hash. Die anschließende
rein lesende Prüfung `result/native-8169-preinstall.json` bestätigt erneut:
kein installiertes Programm, keine Produktprozesse oder Gastlistener auf
3100/8787, Konfiguration und Maintenance-Credentials unverändert,
Framework-Releasewert 533320. Das Setup wurde noch nicht gestartet oder
installiert. Die Bestätigung zum verworfenen 8168-Versuch wird nicht auf
den neuen Kandidaten übertragen; die unmittelbare Freigabe für 8169 ist
noch einzuholen. Native Deinstallation ohne übrig gebliebene Prozesse und
die übrigen WIN-I08-Gates bleiben offen. Kein Main-Merge oder Release.

### Aktueller Updatekandidat und Teststart vom 7. September 2026

`1.0.8145` wurde regulär aus dem sauberen Commit
`130eb076cb2d893ae3f07b3328943bf94db9b02a` gebaut. Der vollständige
Buildaufruf endete mit Exitcode 0: Setup 1.940 Assertions, First Run 63,
Launcher-STA-/Download-/Updatefehlerprüfungen, Komponenten-Smokes,
173 Sprachstrings, 27 Renderings und 10.901-Dateien-Payload-Audit bestanden.
Die Renderings ersetzen weiterhin keine echte Windows-DPI-Abnahme.
Artefakte unter `output/windows-installer-acceptance-8145`:

- Setup-SHA-256: `1391a1e25fce94330d2d2bdc621fd2e94412aed67c1dd93aa741299fc9f065cc`
- MSI-SHA-256: `1219fa5d2136640c8e3a263711920fb0b969866757abaf7852d2240bdc8f3c11`

Der getrennte Offline-Test 8136 → 8145 mit nachgeschaltetem Standardbenutzer-
und Rollbacktest ist unter
`output/windows-sandbox-e2e/075b9347473543a59004da12fe908f5a` vorbereitet.
Alle vier Eingangsartefakte wurden gegen Metadaten und `SHA256SUMS.txt`
geprüft; die Test-Fault-Fixture wurde neu gebaut und gehört nicht zum Produkt.
Ihr Hash ist `eb35cf460a827e4e17d016d93154ca5a77f52a5de59e698ea3444b4a76e9418c`.

Der tatsächliche Start einer zusätzlichen Sandbox wurde von Windows mit
`0x800401F6 (CO_E_APPSINGLEUSE)` abgewiesen. Vor und nach dem Versuch existierte
ausschließlich Gast `4710465f-f845-4713-a399-8d4529ea49ef`; dessen installierter
8136-Stand und eingerichteter Maintenance-Zugang wurden nicht verändert.
Nach ausdrücklicher Nutzerfreigabe wurde dieser Gast samt Testdaten und dem
dort eingerichteten Maintenance-Passwort verworfen; die danach leere
Sandboxliste wurde geprüft. Der vorbereitete Lauf wurde anschließend in Gast
`841a55be-606f-435c-9ae4-b574e91f40f0` gestartet. Die Gastvorprüfung meldet
seit 10:58 UTC Windows 11 Enterprise (26100), keine Entwicklungswerkzeuge und
korrekte Artefakthashes. Die 13-Punkte-Matrix einschließlich Bereinigung ist
um 11:30:24 UTC grün abgeschlossen (`result/result.json`); alle vier
Ergebnis-Hashes wurden erneut gegen Hostartefakte und Releasemetadaten geprüft.
Der nachgeschaltete Standardbenutzer-/Rollbacktest ist um 11:43:07 UTC ebenfalls
grün abgeschlossen (`rollback-result.json`, `standard-user-result.json`,
`suite-result.json`). Der echte Updater bestätigt geprüftes Backup, erkannten
Healthfehler und Programmrollback auf 8136; der unabhängige Test bestätigt
wiederhergestellten Datenmarker und SQLite-Integrität, unveränderte Konfiguration
sowie Cleanup von Installation, Testkonto und Testports. Vier Artefakthashes,
Updaterhash und Fault-Fixture sind gebunden. Der abschließende Benachrichtigungs-
dialog wurde dabei ausdrücklich nicht als UI-Abnahme gezählt.
Der zusätzliche installierte Sprachwechseltest für 8145 ist um 11:57:35 UTC
mit sieben Prüfungen und verifiziertem Cleanup grün abgeschlossen
(`language-result.json`): explizites Französisch, gemeinsame Sprachübernahme,
Repair mit Erhalt der Sprache, unveränderte Konfiguration sowie korrekter
Austausch der französischen, deutschen und englischen Verknüpfungen. Beide
Ergebnis-Hashes wurden erneut gegen die tatsächlichen 8145-Artefakte geprüft.
Die unabhängige Schlussprüfung um 11:58:43 UTC bestätigt keine verbliebene
Testinstallation, Produktregistrierung, Verknüpfung, Testlistener,
NETGRID-Prozesse oder Testkonten (`final-cleanup.json`). Danach wurde ausschließlich
der selbst erzeugte Gast `841a55be-606f-435c-9ae4-b574e91f40f0` beendet und eine
leere Sandboxliste verifiziert. Hostseitige Testartefakte und Ergebnisse bleiben
erhalten. Die anschließend ausdrücklich freigegebene Host-Anzeigeprüfung
verwendete den hashgleichen Setup-Host 8145 ohne Installation. Windows wurde
tatsächlich von 100 auf 125 und 150 Prozent umgestellt; die Sprachauswahl und
das deutsche Hauptformular wurden je Stufe frisch geöffnet. Bei 100 Prozent
waren die Standard-/Custom-Maske und angeklickte Custom-Hilfe lesbar. Bei
150 Prozent blieben am Scroll-Ende die Kontrollkästchen für Desktop und
Abschlussstart abgeschnitten. Dieser Befund blockiert die visuelle Freigabe
von 8145; der vorherige geometrische Rendernachweis hatte ihn nicht erfasst.
Ein Wechsel auf dunklen Windows-Kontext bei 150 Prozent zeigte weiterhin
ein helles Setup ohne zusätzlichen erkennbaren Kontrastfehler; dies ist
keine vollständige Sprach-/Designmatrix.

Die Ursache liegt im zugleich füllenden und scrollenden `TableLayoutPanel`:
seine letzte automatisch bemessene Zeile lag außerhalb der erreichbaren
Scrollgrenze. Ein echter Offscreen-Layouttest reproduzierte dies auch bei
minimaler Fenstergröße unter 100 Prozent (letzte Option Y=586, Höhe=19,
Viewporthöhe=584). Das Setup trennt nun den scrollenden `Panel`-Viewport
von einer oben angedockten, vollständig automatisch bemessenen Tabelle.
Der feste Fußbereich bleibt außerhalb des Viewports. Der neue Standardtest
prüft in de/en/fr am Scroll-Ende alle Elemente der letzten Optionszeile auf
vollständige Sichtbarkeit und die Trennung vom Fußbereich. 1.967 Assertions
sind grün; der ergänzende Renderlauf nach dem Layoutfix bestand mit 2.123
Assertions. Diese Codekorrektur ist noch nicht im unveränderten Artefakt
8145 enthalten und braucht einen neuen regulären Build samt nativer
DPI-/Sprachabnahme.

Die Ausgangseinstellungen wurden nach der Prüfung wiederhergestellt und
verifiziert: 100 Prozent, Apps und Windows hell, 1920 × 1200. Nachtmodus
blieb eingeschaltet und die Zuordnung „Nur auf 1 anzeigen“ unverändert.
Das eigene Setupfenster wurde ohne Installation geschlossen. Baseline und
Prüfnotizen liegen unter `output/host-display-review-8145`.
Die normale Hostinstallation und ihre Zugangsdaten bleiben außerhalb dieser
Freigabe und wurden nicht verändert. Es wurde kein GitHub-Release erstellt.

Der Testcontroller erlaubt jetzt `-PrepareOnly` neben einer bestehenden
Sandbox, da dieser Pfad ausschließlich neue isolierte Host-Testeingaben
erzeugt. Der normale automatische Start bleibt bei vorhandenen Gästen
gesperrt. Beide Pfade wurden konkret geprüft: Schutzfehler ohne Schalter,
erfolgreiche Vorbereitung mit Schalter. Diese reine Testhilfe wurde erst
nach Abschluss des sauberen 8145-Produktbuilds geändert.

Der verifizierte Storage-Ursachenfix liegt als lokaler Zwischencommit
`b1b2b26b4` vor (Git-Buildnummer 8105); WIN-I08 bleibt aktiv und ist damit
nicht abgeschlossen. Der neue Vergleichsinstaller wird aus diesem Stand
gebaut. Ein Rollback führt die Storage-CLI der rückinstallierten Vorversion
aus: Deshalb muss auch der neue Vergleichsstand den Restore-Fix enthalten.
Die bisherigen 8103-/8104-Artefakte bleiben als getrennte Fehler- und
MSI-Evidence erhalten, sind aber kein Nachweis für den korrigierten Datenrestore.

Vergleichsbuild 8105 und Updatebuild 8106 sind einschließlich Komponenten-
Smokes, 18 Renderings und vollständigem 10.901-Dateien-Audit gebaut. 8106
enthält zusätzlich den lokal getesteten Zwischencommit `7bb74118e`: Der
Updater protokolliert Transaktionsfehler mit begrenzter, redigierter Ursache.
Die neue Clean-Windows-MSI-Matrix gegen dieses Paar ist am 2026-09-05 um
20:18 Uhr einschließlich Bereinigung mit allen 13 Prüfpunkten grün beendet.
Alle vier Ergebnis-Hashes wurden anschließend erneut gegen die tatsächlichen
Hostartefakte und deren Releasemetadaten verifiziert. Der Nachweis liegt unter
`output/windows-sandbox-e2e/793526b6b355460798f2aae4aef5c9be/result/result.json`.
Der nachgeschaltete Standardbenutzer- und Rollbacktest ist um 20:31 Uhr
ebenfalls vollständig grün beendet. `rollback-result.json` belegt anhand
derselben Artefakthashes sowie des tatsächlichen Updaterhashes Backup,
echtes Upgrade, Datenbankfehler, Rückinstallation von 8105, wiederhergestellten
SQLite-Marker und Integrität, unveränderte Konfiguration und geprüften Cleanup.
`suite-result.json` bestätigt beide Teilprüfungen. Die abschließende Meldungsbox
wurde dabei nicht bedient und ist keine bestandene Dialogabnahme.
Die Netzwerkanbindung
dieser separaten Sandbox ist für den folgenden Private-LAN-Test ausdrücklich
aktiviert; sie ersetzt nicht den separat bestandenen Offline-Nachweis.
Die Artefakte tragen ihren tatsächlichen Dirty-Buildstatus und sind noch keine
finale, aus einem sauberen Integrationsstand erzeugte Releasefreigabe.

Die anschließende Prüfung der Setup-Fehlerpfade hat einen fest deutschen
LAN-Hinweis, generische englische/französische Setupfehler sowie direkt
angezeigte .NET-Ausnahmetexte gefunden. Alle 31 bekannten Fehlercodes werden
jetzt über die gemeinsame Sprachquelle aufgelöst. Unerwartete Fehler zeigen
eine übersetzte Meldung mit technischem Typ/HRESULT, nicht den möglicherweise
sensitiven rohen Ausnahmetext. Relative und ungültige Ordnerangaben werden
vor der Pfadnormalisierung strukturiert abgewiesen. Die tatsächliche Setup-
Assembly besteht 330 fensterlose Assertions für de/en/fr; der String-Audit
prüft außerdem jeden im Quellcode verwendeten Setupfehler auf Übersetzung.
Diese nachträglichen Änderungen sind noch nicht in den eingefrorenen
8105-/8106-Sandboxartefakten enthalten; deren Ergebnis gilt ausschließlich
für die jeweils gebundenen Hashes. Die neue Setupoberfläche benötigt weiterhin
ihren erneuten Render- und funktionalen Abnahmenachweis.

Der direkte Test von `UpdateDiscovery.DownloadVerifiedAsync` in der echten
Launcher-Assembly reproduzierte außerdem eine Windows-Dateisperre: Der
Prüfstream war bei `File.Move` noch geöffnet. Der Stream wird jetzt vor der
Veröffentlichung des geprüften Downloads geschlossen. Der Regressionstest
war zuvor rot und belegt jetzt erfolgreichen Downloadabschluss, exklusiven
Dateizugriff danach, Ablehnung eines falschen Hashes ohne Überschreiben der
vorhandenen gültigen Datei sowie Entfernung temporärer Teil-Downloads.
Er ist als `tests/windows/Netgrid.Launcher.Tests` im Installerbuild gebunden.
Ursachenfix und Regressionstest sind im lokalen Zwischencommit `3c2f104d3`
(Git-Buildnummer 8107) gesichert; WIN-I08 bleibt aktiv.
Der übersetzte Zustimmungstext beschreibt nun die tatsächliche Reihenfolge
Stopp, geprüftes Backup, Installation. Auch diese Korrektur benötigt neue
Releaseartefakte; der laufende Rollbacktest bleibt an 8105/8106 gebunden.

Der Nutzerreview der geöffneten 8106-Maske zeigte einen Wortumbruch im Label
„Spielaufbewahrung“ und einen unverständlichen entwicklungsinternen Hinweis.
Die Beschriftung lautet nun „Spiele behalten“; die Labelspalte ist inhalts-
statt fest pixelbasiert breit, die Pfadfelder füllen ihre verbleibende Spalte.
Der untere Hinweis erklärt jetzt Datenordner und Datenerhalt bei normaler
Deinstallation. Alle drei Sprachen sind aktualisiert. Die getrennte deutsche
und französische Render-Vorschau bestätigt die lesbare Beschriftung; die
offene 8106-Maske enthält diese Änderungen noch nicht.

Auf weiteren Nutzerwunsch besitzt jede Setupoption eine „?“-Hilfe mit
Tooltip, tastaturbedienbarem Hilfedialog und zugänglicher Beschreibung.
„Was ist Maintenance?“ erklärt den getrennten lokalen Verwaltungsbereich und
sein eigenes Passwort. Radio-Auswahlgruppen behalten denselben gemeinsamen
Parent; Regressionen sichern die gegenseitige Auswahl und die Übersetzungen.

Die pauschale 512-MiB-Prüfung am Datenziel ist durch einen paketgebundenen
Platzplan ersetzt. Der Build liest Größe und Anzahl der Dateien aus der
tatsächlichen MSI-File-Tabelle; die Setup-Metadaten werden im Payload-Audit
gegen die vollständig extrahierten Dateien geprüft. Der Plan umfasst die
Programmdateien mit Dateisystem-Allokationspuffer, Setup-/MSI-Caches,
temporären vollständigen Payloadpuffer und 512 MiB anfängliche Datenreserve.
Gleiche Laufwerke werden zusammengezählt. Die Prüfung läuft vor Entpacken und
UAC in Installation und Update; fehlende Metadaten, unbekannte Kapazität oder
Platzmangel scheitern sichtbar. Die Meldung nennt den konservativ einzuplanenden
und den verfügbaren Platz je betroffenem Laufwerk. 543 fokussierte Assertions
für Fehlertexte, Hilfen, Auswahlgruppen und Platzberechnung sind grün.

Der neue Testbuild unter `output/windows-installer-ui-review` (8107) hat
Komponententests, 18 Vorschauen und den vollständigen 10.901-Dateien-Audit
einschließlich der MSI-gebundenen Platzmetadaten bestanden. Die anschließende
Sandbox-Sichtprüfung und der Nutzerbefund zeigten überlappende Schaltflächen
in der Sprachauswahl. Ein Regressionstest reproduzierte die Überlappung.
Layoutcontainer und ausschließlich in der gewählten Sprache angezeigte
Aktionen beheben sie; der Test prüft zusätzlich den unmittelbaren Sprachwechsel.
Die neuen deutschen und französischen Vorschauen sind visuell geprüft.
Der weitere Testbuild unter `output/windows-installer-language-review`
enthält diese letzte Korrektur. Sein Build ist einschließlich 543 Setup-
Assertions, Komponenten-Smokes, 27 Vorschauen und vollständigem Audit aller
10.901 Dateien grün. Die Setup-Prüfsumme lautet
`922765b192930821a808cbe8d0940c51bcaec2e447c006b9bb12915719f53eba`.
Genau diese Datei wurde in die bestehende Sandbox kopiert und dort erneut
gehasht. Die Sprachauswahl ist sichtbar ohne überlappende oder abgeschnittene
Aktionen. Weitere automatisierte Klicks wurden wegen erkannter Benutzereingabe
angehalten; der neue Installations-/Hilfedialogfluss ist noch nicht abgenommen.
Die gestartete Instanz ist unter `result/ui-review-language-process.json`
im genannten Sandboxlauf dokumentiert. Es wurde noch keine Installation aus
dieser Maske gestartet.
Die erneute Abfrage um 21:35 Uhr bestätigt einen reaktionsfähigen Setup-Prozess
und keine Registrierung unter `HKLM\SOFTWARE\LevelX2\NETGRID`. Ein separater
fensterloser Test des tatsächlichen Button-Ereignisses bestätigt `OK` für
Weiter, `Cancel` für Abbrechen und die korrekte Enter-/Escape-Zuordnung;
der Setup-Komponentenstand umfasst damit 555 Assertions. Die automatisierte
Sandbox-Eingabe hat den sichtbaren Sprachdialog bisher dennoch nicht verlassen.
Ein normaler Nutzerklick ist als Abgleich angefragt; daraus folgt noch keine
bestandene UI-Abnahme und kein belegter Fehler im Produkt-Ereignispfad.

Die anschließende Prüfung des Updatevertrags reproduzierte eine stille
Ersatzwertentscheidung bei fehlender Desktop-Präferenz. Der Setuphost liest
jetzt ausschließlich `DesktopShortcutPreference` als exakte Zeichenfolge
`0` oder `1`. Fehlende oder ungültige Werte stoppen vor der MSI-Extraktion
mit einer spezifischen Reparaturmeldung in allen drei Sprachen. Der vorher
rote Regressionstest ist grün; die Setup-Komponenten umfassen nun 591
Assertions. Diese letzte Quellenkorrektur ist noch nicht in der geöffneten
8107-Sandboxdatei enthalten und wird im nächsten Artefaktstand gebunden.
Die geprüften Produktkorrekturen werden als lokaler Zwischenstand gesichert;
die getrennte E2E-Teststrecke und WIN-I08 bleiben aktiv, ohne Main-Integration
oder Releasefreigabe.
Die Vorschauen werden um die Sprachauswahl erweitert. `Form.Scale` prüft
dabei geometrische Skalierung, nicht reale Windows-DPI-/Schriftskalierung;
dieser Unterschied bleibt im offenen visuellen Abnahmeumfang ausdrücklich
berücksichtigt. Kein dieser Testbuilds ist die finale Releasefreigabe.

Nach Neuverbindung mit derselben Sandbox war die zuvor eingefrorene Viewer-
Ansicht wieder aktuell. Weiter öffnete die Setupmaske; der angeklickte
Maintenance-Hilfedialog war lesbar und mehrzeilig. Der anschließende
Nutzerbefund betrifft dagegen die Hover-Tooltips: Ihre unbeschränkte Breite
ließ lange Texte über den Bildschirm hinausragen. Ein Test des tatsächlichen
Popup-Ereignisses reproduzierte die fehlende Breitenbegrenzung. Der Tooltip-
Owner berechnet und zeichnet nun denselben Wortumbruch mit DPI-skalierter,
zusätzlich arbeitsflächenbegrenzter Breite. 1.638 Setup-Assertions sind grün,
darunter alle zwölf Hilfen in drei Sprachen, drei Schrift-/DPI-Skalierungen
und drei Bildschirmbreiten. Die echten Draw-Handler erzeugen 36 Vorschauen;
lange deutsche und französische Texte wurden vollständig sichtbar geprüft.
Native Hover-Positionierung und der neue Paketstand in der Sandbox stehen
noch aus. WIN-I08 bleibt aktiv.
Der Ursachenfix ist als `cb4ed5037` gesichert. Der anschließende vollständige
Build unter `output/windows-installer-tooltip-review` erzeugt Version
`1.0.8109` aus diesem Commit. Komponentenprüfungen, 27 Dialogvorschauen und
der vollständige Audit aller 10.901 Payload-Dateien sind grün; die beiden
Artefakthashes wurden danach unabhängig mit den Metadaten verglichen.
Der Stand ist weiterhin ein Testbuild (`sourceDirty: true` wegen der noch
offenen E2E-Teststrecke), keine Releasefreigabe. Die bisherige Sandbox war
bei der erneuten CLI-Abfrage bereits beendet; es wurde weder eine neue
Sandbox geöffnet noch eine Installation gestartet. Die native Hover-
Sichtprüfung benötigt deshalb eine neue Testsitzung.

Die isolierte E2E-Teststrecke ist unter `aa148864e` gesichert. Der neue
Offline-Sandboxlauf `9d17bc6835d74f11918ab7fe2a823061` bindet 8106 als Basis
und den Tooltip-Teststand 8109 als Update. Alle 13 Prüfungen samt Cleanup
sind um 22:38 Uhr erfolgreich beendet; die vier Artefakthashes wurden erneut
unabhängig geprüft. Die VM `0a6030a3-a7a0-4a18-a780-e87bc9db6714` wird für
den getrennten Folgetest weiterverwendet. Eingaben sind schreibgeschützt,
Entwicklungswerkzeuge fehlen, die Hauptinstanz bleibt unberührt. Der
abgeschlossene Lauf wird nicht nachträglich auf neue Quellen umgebunden.

Der anschließende UI-Vertragsabgleich zeigte, dass die gewählte Setupsprache
bisher nicht an Folgeprogramme weitergegeben wurde. Eine gemeinsame
Installationspräferenz und ihre MSI-Bindung beheben diesen Prozessübergang.
1.649 Setup-Assertions, isolierte Runtimekonfigurationstests, vier erfolgreiche
Komponentenbuilds und deren fensterlose Sprachaudits sind grün. Der E2E-Helfer
prüft künftig die explizite französische Wahl gegen Ersteinrichtung, Launcher
und Updater. Diese Quellenänderung benötigt einen neuen Installer und einen
eigenen installierten Nachweis; 8109 enthält sie noch nicht. Die reale
GitHub-Releaseprüfung ist weiterhin offen: der read-only Abruf liefert keine
Releases; Veröffentlichungsfreigabe wurde angefragt, nichts hochgeladen.
Der vollständige Build `output/windows-installer-language-persistence`
hat 8111 aus `6d964c143` mit `sourceDirty: false` erzeugt. Alle Komponenten-
Smokes, 27 Dialogvorschauen und der vollständige 10.901-Dateien-Audit sind
grün; die Artefakthashes wurden unabhängig mit den Metadaten verglichen.
Der gesonderte installierte Sprachtest für 8111 ist am 2026-09-05 um
22:45 Uhr einschließlich Cleanup erfolgreich beendet. Die drei installierten
Folgeprogramme verwenden Französisch vor und nach ProductCode-Reparatur;
die geschützte Runtimekonfiguration bleibt bytegleich. Das Ergebnis ist an
die beiden 8111-Artefakthashes gebunden.
Die im Testinput eingefrorene Scriptfassung prüft ausschließlich
Sprachweitergabe und Reparatur, nicht die danach ergänzte Shortcutkorrektur.
Der fest deutsche First-Run-Startmenüname wurde quellenbezogen durch drei
sprachgebundene, transitive MSI-Komponenten ersetzt. Die Namen stammen aus
dem bestehenden Sprachkatalog. WiX-7-Authoring-Kompilation und der vorher
rote Sprach-Strukturtest sind grün. Paketierung und installierter Nachweis
einschließlich Wechsel fr → de → en und Entfernung alter Verknüpfungen
stehen noch aus; `-VerifyShortcuts` aktiviert diese zusätzlichen Prüfungen
im gezielten Sprachtest. Die normale Setup-Spracherkennung bleibt erhalten;
unmittelbare MSI-Aufrufe ohne Sprache und Registrierung folgen nun der
englischen MSI-Paketsprache. Keine vollständige visuelle Sprachfreigabe.

Der nachfolgende 8112-Build wurde vom tatsächlichen MSI-Audit abgewiesen:
Windows PowerShell 5.1 las den UTF-8-Sprachkatalog ohne explizite Kodierung als
ANSI, wodurch der französische Shortcutname beschädigt wurde. Explizites
`-Encoding UTF8` behebt den Fehler am Katalogeingang; die tatsächliche
Build-Anweisung wurde unter PowerShell 5.1 erfolgreich geprüft. Ein
Strukturguard sichert die Kodierung, der unveränderte MSI-Audit verlangt
weiter den exakten Katalogtext. Der vollständige Neubau 8113 aus `48695e306`
ist grün: Komponenten-Smokes, 27 Dialogvorschauen und der vollständige Audit
aller 10.901 Payload-Dateien. Die drei Shortcutnamen sind zusätzlich direkt
im dekompilierten MSI exakt gegen den Katalog geprüft. Der gezielte
installierte Shortcut-/Sprachwechseltest bleibt offen. Sein PowerShell-5.1-
Testhelfer trägt jetzt einen UTF-8-BOM, damit auch sein französischer
Erwartungswert unverändert geparst wird.

Im echten 8111-Setup derselben Sandbox wurden deutsche native Tooltips per
Tastatur am linken und rechten Bildschirmrand geprüft: vollständiger Text,
mehrzeiliger Umbruch und Platzierung innerhalb des sichtbaren Bildschirms.
Das ist ein nativer Tastatur-Popup-Nachweis, kein direkter Maus-Hover-Test
und kein Ersatz für die noch offene reale DPI-/Sprach-Gesamtmatrix.

Im echten 8113-Setup wurden zusätzlich die französische und englische
Sprachauswahl, empfohlene und benutzerdefinierte Setupmaske, der native
Tastatur-Tooltip der benutzerdefinierten Installation und der angeklickte
Maintenance-Hilfedialog geprüft. Texte sind vollständig sichtbar und brechen
mehrzeilig um; die Sprachauswahl stellt die Aktionsbeschriftungen unmittelbar
um. Beide eigenen Reviewprozesse wurden ohne Installationsaktion geschlossen.
Die vorhandene Sandbox stellt in ihren Systemeinstellungen keine
Anzeige-/Skalierungsseite bereit; der Desktop-Eintrag „Anzeigeeinstellungen“
führt zur Startseite. Die Systemeinstellungsseite beginnt mit „Sound“.
Eine echte 100-/125-/150-Prozent-Abnahme ist dadurch hier noch nicht belegt.
Es wurden keine Anzeige-, Sicherheits- oder Hosteinstellungen verändert.

Der installierte 8113-Sprachtest `288854b6c7484f5d970a07780dcbf61d` endete
um 23:17 Uhr rot, mit erfolgreichem Cleanup. Französisch und ProductCode-
Reparatur bestanden. Der anschließende Testaufruf `/fa ProductCode
NETGRID_UI_LANGUAGE=de` war jedoch ungültig für eine neue Auswahl: `/f`
ignoriert laut Microsoft Kommandozeileneigenschaften. Das reale MSI-Log
bestätigt die fehlende Übergabe und das korrekte erneute Lesen von `fr` aus
der Registrierung. Der Test verwendet für die explizite Änderung nun
`/i ProductCode REINSTALL=ALL REINSTALLMODE=amus NETGRID_UI_LANGUAGE=...`;
ein Guard weist die fehlerhafte Kombination im Testhelfer vor jedem
Prozessstart ab. Der erneute installierte Nachweis bleibt offen; der
Fehlversuch ist kein Produktfreigabe-Nachweis.

Der korrigierte Wiederholungslauf `1fe0d2624d20423ba0fd08d5a9a35ccf` ist
am 2026-09-05 von 23:19 bis 23:33 Uhr vollständig grün. Die unveränderten,
sauber commitgebundenen 8113-Artefakte bestehen französische Frischinstallation,
ProductCode-Reparatur ohne neue Auswahl und die expliziten Wechsel nach
Deutsch und Englisch. Alle drei installierten Folgeprogramme übernehmen
jeweils die neue Sprache; genau die passende First-Run-Verknüpfung bleibt
bestehen. Runtimekonfiguration und bestehende Auswahl bei Repair bleiben
erhalten. Testinstallation, Datenordner, Startmenü und Registrierung sind
geprüft entfernt. Der Nachweis liegt im Laufordner unter
`language-1fe0d2624d20423ba0fd08d5a9a35ccf/result.json`; die älteren Ergebnisse
liegen getrennt bei ihren jeweiligen Test-IDs. Kein GitHub-Upload und keine
Main-Integration wurden vorgenommen.

Die am 2026-09-06 ausdrücklich bestätigte native Installation des 8113-Setups
in derselben Sandbox endet um 06:46 Uhr mit MSI-Code 0. Der Prüfpfad
`manual-setup-8113-installed.json` bindet Setuphash und Test-ID
`b9b5b463cbb6488dae94e4f2b3a025c7`; 10.901 Programmdateien, deutscher
registrierter Sprachwert, isolierter Datenroot und die sichtbare
Desktopverknüpfung sind nachgewiesen. Die deutsche Ersteinrichtung ist geöffnet;
Passworteingabe und Abschluss wurden dem Nutzer übergeben. Das ist noch kein
vollständiger First-Run- oder Cleanup-Nachweis. Es läuft eine Sandbox mit
mehreren Viewerfenstern, nicht mehrere getrennte Testmaschinen.

Der dabei beobachtete unveränderte Freigabetext während des bereits laufenden
MSI und die Nutzeranforderung an eine Fortschrittsanzeige führen zu einer
gezielten Setupkorrektur: animierter Balken und phasengebundene Meldungen für
Prüfung, Vorbereitung, Freigabe und Installation; keine geschätzten Prozente.
Nach MSI-Erfolg endet die Animation, während der Text auf die Ersteinrichtung
verweist. Die Statuszeile bleibt trotz gesperrter Optionen lesbar und bricht um.
1.757 fokussierte Assertions einschließlich Phasen, Sprachtexten, deaktivierten
Eingaben, Retry und Fehlerstopp sind grün. Layoutvorschauen werden getrennt
von echten Installerabläufen erzeugt. Die Änderung ist noch nicht im
geöffneten 8113-Setup enthalten und braucht einen neuen artefaktgebundenen Lauf.

Nach dem Schließen der Sandboxfenster durch den Nutzer liefert `wsb list`
am 2026-09-06 keine laufende Sandbox mehr. Die VM wurde nicht erneut gestartet.
Die MSI-Erfolgsevidence bleibt erhalten; ob die anschließende Ersteinrichtung
vom Nutzer beendet wurde, ist nicht bestätigt. Auf Nutzerwunsch erhalten
beide Passwortfelder eigene Augen-Schaltflächen und der Dialog eine klare
„Später“-Erklärung samt lokalisiertem Startmenüpfad. 51 UI-Assertions in drei
Sprachen, die Layoutvorschauen und der isolierte Bootstrap-Smoke sind grün;
der vorhandene Credentialstore des Smokes blieb beim zweiten Bootstrap
unverändert. Das sind Komponentenprüfungen, kein erneuter installierter
First-Run-Nachweis. Die Fortschrittskorrektur ist unter `d7054c714` gesichert.

Der vollständige Neubau `output/windows-installer-onboarding-review` erzeugt
`1.0.8119` aus dem sauberen Commit `82476bd3d`. Komponenten-Smokes,
1.757 Setup-Assertions, 36 fensterlose First-Run-Assertions, Sprach-/Layoutgate
und der tatsächliche Audit aller 10.901 Payload-Dateien sind grün. Die
sechs off-screen Fortschrittsvorschauen und drei First-Run-Vorschauen sind
getrennte Layoutprüfungen; der First-Run-Vorschaulauf umfasst 51 Assertions
und startet keine Runtime. Beide Artefakthashes wurden unabhängig gegen
Metadaten und `SHA256SUMS.txt` geprüft.

Auf die ausdrückliche Klarstellung, die Sandbox weiter zu verwenden, wurde
eine neue Offline-Sandbox `2450080a-5aa1-44c0-a576-9b6fe463c102` mit genau
einem Viewer gestartet. Laufordner:
`output/windows-sandbox-e2e/6dae9bd7feb14b849baba0f826ea0228`.
Der Logon-Auftrag öffnet ausschließlich das hashgeprüfte 8119-Setup; er startet
keine automatische MSI-Matrix. Für die native Prüfung des empfohlenen Wegs
stehen diesmal die normalen Gastordner `C:\Program Files\NETGRID` und
`C:\ProgramData\NETGRID` sowie die im Gast freien Ports `3100`/`8787` bereit.
Das ist eine frische, netzwerkisolierte VM und kein Worktree-Server auf den
Hostports. Hostdienste und Hostdaten bleiben unverändert. Der neue
Installationsklick ist noch nicht erfolgt; dafür wird die unmittelbare
Bestätigung eingeholt. WIN-I08 bleibt offen, insbesondere native Gesamtflows,
reale DPI-/Kontexte und GitHub-Updateabnahme. Kein Push oder Main-Merge.

Der Nutzer hat die neue Maske nur angesehen und noch keine Installation
gestartet. Auf seinen Textbefund heißt die erste Setupoption nun
„Voreingestellte Werte verwenden“ statt „Empfohlene Installation“, in allen
drei Sprachen entsprechend angepasst. Der Hilfetext erklärt Übernahme bzw.
Änderung der angezeigten Werte und die in beiden Wegen freie Betriebsartwahl.
Keine Verhaltensänderung. 1.760 Setup-Assertions und das Sprachgate sind grün;
die längeren deutschen und französischen Beschriftungen passen in die
geprüften Layoutvorschauen. Das offene 8119-Setup enthält diese nachfolgende
Textänderung noch nicht. Der Installationsklick bleibt unangetastet.

Die anschließende Textprüfung trennt Windows-Administratorfreigabe und
NETGRID-Maintenance-Passwort jetzt ausdrücklich in Setup und Ersteinrichtung
(DE/EN/FR). Der benutzerdefinierte Hilfetext erklärt außerdem, dass einzelne
Werte geändert und andere Vorgaben beibehalten werden können. Der längere
Setuphinweis machte in der französischen Fortschrittsansicht einen bisher
nicht erfassten abgeschnittenen Installationsknopf sichtbar. Status, Balken
und Aktion liegen deshalb nun außerhalb der scrollbaren Optionen in einem
festen unteren Bereich. 1.808 Setup-Assertions einschließlich Fenstergrenzen
und Überlappungsprüfung bei normaler und minimaler Fenstergröße, 51 First-Run-
Assertions und das Sprachgate sind grün. Die Komponentenansichten unter
`output/windows-admin-copy-review` wurden in allen drei Sprachen geprüft;
dies ersetzt keine native DPI- oder Installationsabnahme. Das offene
8119-Setup enthält diese Quelländerungen noch nicht. Keine Installation,
Passworteingabe oder Änderung bestehender Zugangsdaten wurde dadurch ausgelöst.

Der anschließende vollständige Installerbuild **1.0.8123** aus dem sauberen
Quellcommit `714561a748c427bf84681e4e69e718ef7e0e2f92` ist erfolgreich:
`output/windows-installer-admin-copy-review`. Releaseoutput, Komponenten,
isolierter Launcher-Smoke (Ports `57839`/`57840`), First-Run-Smoke mit
unverändertem Credential, Updater-Smoke, Sprach-/Layoutmatrix und der Audit
aller 10.901 Payload-Dateien sind grün. Setup-SHA-256:
`4e50ef5f617632215f3da8caa442f6f0ea05365a1f5ce84dc87544ca68e71ce0`;
MSI-SHA-256:
`8901d849fc0122b36a85c3ab7c1ac4b67f458e39904547c4def0b8a5c5f7f494`.
Beide Dateien wurden unabhängig gegen Metadaten und `SHA256SUMS.txt` geprüft.
Dieser Build enthält die gesammelten Textkorrekturen und den festen
Fortschritts-/Aktionsbereich. Am 6. September um 05:34 UTC wurde das noch
nicht installierende 8119-Fenster geschlossen und durch das hashgeprüfte
8123-Setup in derselben VM ersetzt, ohne einen weiteren Viewer zu öffnen.
Gast: Windows 11 Enterprise `10.0.26100`; Setup-PID `5332`, Startzeit
`2026-09-06T05:34:14.5032103Z`. Die deutsche Sprachauswahl, vollständig
angezeigte neue Texte, der benutzerdefinierte Hilfedialog und der reversible
Wechsel zwischen Vorgaben und eigenen Werten wurden nativ geprüft. Danach
sind wieder die Vorgaben und „Nur dieser Rechner“ ausgewählt.
`result/ui-review-8123-start.json` und `result/ui-review-8123-preflight.json`
im bestehenden Laufordner `6dae9bd7feb14b849baba0f826ea0228` binden den Start
und bestätigen um 05:36 UTC: keine NETGRID-Registrierung, keine Produkt-/
Datenordner, kein MSI-Prozess und freie Gastports `3100`/`8787`.
„Installieren“ wurde nicht betätigt; die unmittelbare Bestätigung steht aus.
Die weitere native Abnahme und GitHub-Updatefreigabe bleiben offen; WIN-I08
ist nicht abgeschlossen, Main-Integration und Cleanup erfolgen noch nicht.

Die anschließende native Vorinstallationsprüfung von 8123 erfasst auch
Englisch und Französisch: Auswahl über den echten Sprachdialog, dazu passend
wechselnde Weiter-/Abbrechen-Beschriftungen, vollständige Setuptexte und
umgebrochene benutzerdefinierte Hilfedialoge; beide Hilfedialoge ließen sich
per Eingabetaste schließen. Geprüfte Gastprozesse: EN `5452`, FR `4980`.
Danach wurde Deutsch mit unveränderten Standardwerten wieder geöffnet:
PID `6944`, Startzeit `2026-09-06T05:41:36.7804510Z`, dokumentiert in
`result/ui-review-8123-current-process.json`. Es blieb bei einem Viewer
derselben VM; kein Installationsklick. Diese Prüfung deckt die genannten
Vorinstallationsansichten ab, nicht First Run, installierte Gesamtflows,
Hoverpositionierung oder unterschiedliche native Windows-DPI-Kontexte.

Nach ausdrücklicher aktueller Freigabe wurde 8123 am 6. September um
05:55 UTC über den nativen Installationsknopf mit den Standardwerten in
derselben Sandbox installiert. Der animierte Balken und der tatsächliche
Installationsstatus waren sichtbar. `result/ui-install-8123-state.json`
bindet den Setuphash und das Log
`C:\Users\WDAGUtilityAccount\AppData\Local\Temp\NETGRID-install-20260906-055537.log`:
MSI-Ende um 05:58:16 UTC erfolgreich, Client- und Servercode `0`, danach
First Run PID `6940` aus `C:\Program Files\NETGRID\NETGRID.FirstRun.exe`.
Die Passworteinrichtung bleibt beim Nutzer; daraus wird noch keine
abgeschlossene First-Run-Abnahme abgeleitet.

Zwei weitere Nutzerbefunde sind im Quellstand ursächlich korrigiert:
Der Datenhinweis liegt nun vollständig im festen Fußbereich vor Status und
Balken und bleibt lesbar. Der ergänzte Test scheiterte zuvor genau an seiner
falschen Zuordnung zum Scrollbereich; danach sind 1.850 Setup-Assertions grün.
Die Ersteinrichtung fragt zuerst nach „Jetzt einrichten“ oder „Später“ und
erklärt den späteren Startmenüweg. Erst danach erscheinen Passwortfelder mit
„Zurück“ und „Einrichtung abschließen“. Zurück leert und verdeckt die Eingaben;
bestehende Credentials führen nur zum Schließen, nicht zur Neuerstellung.
144 UI-Assertions, neun Komponentenansichten und der isolierte First-Run-Smoke
mit unverändertem vorhandenem Credential sind grün. Diese Änderungen sind
noch nicht im installierten 8123-Paket enthalten.

Der zusätzlich gewünschte messbare Fortschritt ist nun im Quellstand
angebunden: Ein erst nach dem Installationsklick erhöhter Setupworker ruft
`MsiInstallProductW` mit der eigenen verifizierten MSI auf und verarbeitet
numerische `MsiSetExternalUIRecord`-Meldungen. Der Fortschritt beschreibt den
aktuellen MSI-Ausführungsabschnitt; Vorbereitung und fehlender berechenbarer
Umfang erhalten ausdrücklich keine Prozentbehauptung. Auch Rückwärtslauf und
nachträglich geänderter Gesamtumfang bleiben erhalten. Microsofts
[Callback-Vertrag](https://learn.microsoft.com/en-us/windows/win32/msi/monitoring-an-installation-using-msisetexternaluirecord)
und [Fortschrittsbehandlung](https://learn.microsoft.com/en-us/windows/win32/msi/handling-progress-messages-using-msisetexternalui)
sind dafür führend. Eine ACL-geschützte, netzwerkgesperrte Pipe mit beidseitiger
Kernel-PID-Prüfung überträgt ausschließlich feste numerische Frames; Startzeit
und identischer Setup-Pfad binden den Worker an seinen Elternprozess. Die
erhöhte Seite akzeptiert nur die typisierten nicht geheimen Setupwerte, keine
beliebigen MSI-, Log- oder Kommandopfade. Source-Locks und eine atomar neu
angelegte Administrator-/SYSTEM-Tempstruktur schützen die Quellen gegen
Austausch; die Platzprüfung berücksichtigt den geänderten Entpackort.

1.935 fokussierte Assertions prüfen einschließlich echter MSI-Record- und
Callbackregistrierungs-APIs (ohne Produktinstallation), realer Windows-Pipe,
Peer-/ACL-Prüfung, fragmentierter Frames, ungültiger Eingaben, Kanalabbruch,
Zählergrenzen und lokalisierter numerischer Anzeige. Der vorausgehende
Renderlauf mit 2.090 Assertions prüft auch die Mindestfenstergeometrie und
21 Offscreen-Ansichten; DE-Prozentanzeige und FR-Zustand ohne berechenbaren
Umfang wurden visuell kontrolliert. 144 First-Run-Assertions bleiben grün.
Diese Änderungen sind noch nicht im installierten 8123 enthalten. Neuer
Paketbuild ist inzwischen grün; die native Prüfung einschließlich UAC-/MSI-
Übergang, messbarem Verlauf und Fehlerpfad steht aus. WIN-I08 bleibt offen;
keine Main-Integration.

Aktuelles neues Abnahmepaket: `1.0.8128` unter
`output/windows-installer-measured-progress-review`, gebaut aus dem sauberen
Commit `193a262720fa6c08ac4bb6cea6fd0d53e25a52f6` (`sourceDirty=false`).
Releaseoutput, Setup-/First-Run-/Launcher-/Updater-Tests, isolierte Runtime-
und Bootstrap-Smokes, DE/EN/FR-UI-Matrix sowie 10.901-Dateien-Payloadaudit sind
grün. Setup-SHA-256:
`f595de356c752de19d105f04003d65457140a938bb0b70261d2f2d9f039ef02f`;
MSI-SHA-256:
`7d1c7b71cf855fae4b432a1de679bd1fc6b56259c813813667f0d1fe9c2f64b5`.
Beide unabhängigen Dateihashes stimmen mit `release-metadata.json` und
`SHA256SUMS.txt` überein. Das Paket enthält die zweistufige Ersteinrichtung,
den festen Datenhinweis und den gemessenen MSI-Fortschritt; es wurde noch
nicht in der Sandbox installiert.

Die bestehende VM `2450080a-5aa1-44c0-a576-9b6fe463c102` läuft weiter, ohne
einen zweiten Viewer zu öffnen oder die Testinstallation zu verändern.
Die reine installierte `NETGRID.FirstRun.exe --status`-Abfrage meldet am
6. September um 06:38:38 UTC Code `0` beziehungsweise
`maintenanceInitialized=true`; `result/ui-first-run-8123-status.json` im
Laufordner `6dae9bd7feb14b849baba0f826ea0228` bindet den Nachweis. Passwort-
inhalte wurden dabei nicht ausgegeben, und Credentials wurden nicht geändert.
Setup und First Run sind geschlossen; der Launcher läuft als PID `5928`.
Für eine erneute native Erstinstallation samt vorgeschalteter Einrichtungs-
entscheidung ist eine frische Sandbox erforderlich. Die bestehende VM und
ihr eingerichteter Zugang werden bis zur Entscheidung des Nutzers bewahrt.

Eine ergänzende native Sichtprüfung am 6. September um 06:49–06:50 UTC
erreichte in derselben installierten 8123-VM das deutsche NETGRID-Traymenü.
Die manuelle Updateprüfung zeigte ohne Installationszustimmung den generischen
Fehler „Das Update konnte nicht vorbereitet werden“ samt Diagnoseverweis.
Die VM ist weiterhin netzwerkisoliert. Eine zusätzliche headless Gastdiagnose
wurde vom Ausführungswerkzeug abgewiesen; daraus wird kein konkreter DNS-
oder HTTP-Fehler als nachgewiesen abgeleitet. Der Dialog wurde geschlossen;
keine Installation, kein Update und keine Änderung von Zugängen oder
Windows-Einstellungen wurden ausgelöst.

Die Codeprüfung belegte zwei Lücken im gemeinsamen Catch-Pfad: Bei manueller
Suche erhielt auch eine unerreichbare Quelle die irreführende Meldung zur
Updatevorbereitung, und nach Zustimmung zu einem beim Start entdeckten
Update wurden spätere Transportfehler weiterhin als stiller Offline-Start
behandelt. Außerdem wurde trotz Diagnoseverweis die Ursache nicht protokolliert.
Der Quellstand unterscheidet jetzt Suche, Download und Vorbereitung und
protokolliert ausschließlich strukturierte, nicht geheime Diagnosedaten.
35 neue fokussierte Assertions sowie die bestehenden Downloadtests und der
173-Schlüssel-Sprachkatalogcheck sind grün. Dies ist ein separater enger
UI-/Fehlerpfad-Fix; das bereits gebaute Paket 8128 enthält ihn noch nicht.
Für den gemeinsamen neuen Abnahmestand sind ein neuer Paketbuild und die
native Prüfung weiterhin nötig. Die bestehende Sandbox bleibt erhalten;
die Frage nach ihrem Ersetzen ist noch unbeantwortet.

Beim anschließenden nativen Aufruf „Diagnosepaket erstellen …“ erschien kein
Speicherdialog; ein Export wurde deshalb nicht als bestanden gewertet. Die
reine Prozessprüfung um 07:07:58 UTC bestätigte weiterhin Launcher PID `5928`,
also keinen nachgewiesenen Prozessabsturz. Die lokale PE-Metadatenprüfung
belegte jedoch eine konkrete Eintrittspunktlücke: Der aus `async Main`
generierte reale CLR-Einstieg `<Main>` hatte keine Attribute und
`hasStaThread=false`. Der neue Test auf `Assembly.EntryPoint` scheiterte
zunächst genau daran. Ein synchrones `[STAThread] Main`, das den bestehenden
asynchronen Ablauf aufruft, korrigiert diese Windows-Dateidialog-Voraussetzung.
Danach sind Eintrittspunkt-, Updatefehler- und Downloadtests sowie ein
isolierter Launcher-Smoke auf Ports `51033`/`51034` einschließlich Recovery,
Stopp und redigiertem Diagnoseexport grün. Der native Speicherdialog selbst
bleibt bis zum Test der neuen Installation offen.

Der parallel fertig gewordene Build `1.0.8130` unter
`output/windows-installer-update-feedback-review` stammt noch aus Commit
`f3ae44c3623571c615ae48ac63f8a7ec43ddb282` und enthält den Updatefehler-Fix,
aber **nicht** die danach bestätigte STA-Korrektur. Trotz grüner Build- und
Payload-Gates ist er deshalb kein abschließender Abnahmestand. Seine
eingefrorenen Binärdateien wurden nicht nachträglich verändert. Ein neuer
gemeinsamer Build muss die STA-Korrektur einschließen; bestehende Sandbox,
Credentials, Main-Betrieb und GitHub-Veröffentlichungen bleiben unberührt.

Der neue gemeinsame Abnahmestand ist `1.0.8131` unter
`output/windows-installer-launcher-sta-review`, gebaut aus dem sauberen
Commit `fbe770215ac1edf80e1dffbb9a6c4e6ba32e16ce`. Er enthält jetzt auch den
realen STA-Einstieg. Vollständige Buildstrecke, 1.935 Setup-Assertions,
63 First-Run-Assertions ohne Renderfenster, Eintrittspunkt- und 35 neue
Updatefehler-Prüfungen, Downloadtests, Runtime-/Launcher-/Bootstrap-/Updater-
Smokes, 173-Schlüssel-Sprachmatrix und 10.901-Dateien-Payloadaudit sind grün.
Der Launcher-Smoke verwendete isoliert die Ports `58112`/`58113`.
Setup-SHA-256:
`0325ee88824aeca0458f740627e37921b056c7423c1001e9056a8b51a68cee9c`;
MSI-SHA-256:
`497aeadef0bbc836ad74b8b9573f72716499febbe9dd8c61ea3323634eaccc51`.
Die Dateien wurden unabhängig gegen Metadaten und `SHA256SUMS.txt` geprüft.
Dieser Stand ist noch nicht nativ installiert; weder 8130 noch 8131 ersetzt
stillschweigend die bisherige 8123-Sandboxinstallation.

Die [öffentliche GitHub-Releases-Seite](https://github.com/LevelX2/NETGRID/releases)
zeigte bei der erneuten Prüfung am 6. September um 07:13 UTC weiterhin keine
Releases. Eine Veröffentlichung wurde nicht vorgenommen. Damit bleiben die
frische native Erstinstallation einschließlich neuer Dialoge und messbarem
MSI-Verlauf, die vollständigen Sprach-/DPI-/Kontextprüfungen und der echte
GitHub-Updatetest offen. Die inzwischen erteilte Freigabe zum Ersetzen der
Sandbox und ihrer Testdaten wurde am 6. September um 07:41 UTC umgesetzt:
VM `2450080a-5aa1-44c0-a576-9b6fe463c102` wurde beendet und ihre Abwesenheit
vor dem Neustart per `wsb list` geprüft. Die alten Host-Testprotokolle bleiben
erhalten. Genau eine neue, weiterhin netzwerkisolierte VM
`4710465f-f845-4713-a399-8d4529ea49ef` läuft mit dem unveränderten, erneut
hashgeprüften Setup 8131. Der Laufordner
`output/windows-sandbox-e2e/c250d4b94f9c4ff391f76456d008d472` enthält unter
`result/ui-review-start.json` den Startnachweis (Setup-PID `6436`). Die
native deutsche Sprachwahl und das neue Setupfenster wurden erreicht;
Standardordner sind `C:\Program Files\NETGRID` und `C:\ProgramData\NETGRID`.
Die Installation wurde noch nicht ausgelöst; für den UI-Klick auf
„Installieren“ bleibt die separate Bestätigung unmittelbar vor der Aktion
gemäß Computer-Use-Regeln erforderlich. Authentifizierung und etwaige UAC-
Dialoge werden nicht automatisiert. WIN-I08 ist nicht abgeschlossen; Main-Merge,
Worktree-Cleanup und Push erfolgen nicht.

Die ausdrücklich freigegebene native Installation von 8131 wurde am
6. September um 11:54 UTC ausgelöst und scheiterte noch vor der Registrierung
des Produkts. Der Worker meldete Stufe 4; MSI-Client und -Server beendeten
sich mit 1602. Die read-only Gastprüfung bestätigt `installed=false`.
Eine isolierte Diagnose mit `MsiOpenPackageExW` (nur Öffnen, keine Installation)
reproduzierte den konkreten Callback: `INSTALLMESSAGE_PROGRESS`, `hRecord=0`.
Der bisherige Reader wandelte diese datensatzlose Windows-Benachrichtigung
in `msi_progress_record_missing` und `IDCANCEL` um. Er bestätigt sie jetzt
ohne Zähleränderung oder erfundene Messwerte. Vorhandene ungültige numerische
Records sowie Übertragungsfehler bleiben abbrechende Fehler.
Der neue Regressionstest war vor dem Fix rot; danach bestehen 1.937
Setup-Assertions. Die Gastdiagnosen liegen im aktuellen Laufordner unter
`result/install-8131-probe.json` und `result/msi-progress-open-before.json`.
8131 ist damit kein bestandener nativer Abnahmestand. Ein korrigierter Build
und dessen erneute native Installation sind erforderlich; das vorherige
Setup wurde nach Bestätigung des Fehlerdialogs geschlossen. Es wurden keine
Zugangsdaten geändert.

Der korrigierte Build `1.0.8134` aus sauberem Commit
`9424a988411ad50ec0dee5bc7b9be9472aca15d5` liegt unter
`output/windows-installer-empty-progress-review`. Die vollständige Buildstrecke
ist mit Exit 0 beendet: 1.937 Setup-Assertions, 63 First-Run-Assertions,
Launcher-/Updater-Prüfungen, isolierte Runtime-/Bootstrap-Smokes,
173-Schlüssel-Sprachmatrix und 10.901-Dateien-Payloadaudit sind grün.
Der Launcher-Smoke verwendete die isolierten Ports `52458`/`52459`.
Setup-SHA-256:
`6ff88fefe5b2d95fbab4caa3173126f10a4a5cd7025675a226b8cba06552a2d3`;
MSI-SHA-256:
`cb26cbe82aacab2557f826b9f589174e75e69609f5818493913cfc3a7188c7eb`.
Originale und Gast-Eingangskopien wurden gegen Metadaten und Prüfsummendatei
geprüft. In derselben VM wurde um 12:09:37 UTC das neue Setup als PID `2584`
geöffnet (`result/corrected-setup-start.json`); die deutsche Sprachwahl und
das Installationsformular wurden zunächst ohne Installationsstart erreicht.

Der anschließend ausdrücklich freigegebene UI-Test von 8134 scheiterte am
6. September um 13:43 UTC erneut mit Worker-Stufe 4 und MSI-Code 1602 vor
Produktregistrierung. Die gezielte native Diagnose belegte einen zweiten
Fall: einen gültigen Fortschrittsrecord mit Feldanzahl 0 (nicht `hRecord=0`).
8134 ist deshalb weiterhin kein bestandener nativer Abnahmestand. Der Reader
bestätigt jetzt beide datenlosen Formen ohne Zähleränderung; vorhandene
fehlerhafte numerische Records werden unverändert abgewiesen.

Ein zusätzlicher direkter MSI-Test mit dem neuen Reader und den unveränderten,
hashgeprüften 8134-Paketdateien installierte ausschließlich in
`C:\Program Files\NETGRID-Progress-Probe` und
`C:\ProgramData\NETGRID-Progress-Probe` innerhalb derselben Sandbox und
deinstallierte danach mit expliziter Testdatenbereinigung. Installation und
Cleanup lieferten jeweils 0, beide Testordner sind entfernt, der Reader hatte
keinen Fehler. Verarbeitet wurden 57.977 Progress-Nachrichten (darunter 838
datenlose) und 68.034 Zähleraktualisierungen einschließlich ActionData. Echte
MSI-Prozente von 0 bis 100 sowie Vorbereitung und abschließender Nullumfang
sind belegt. Der Nachweis liegt unter
`result/msi-progress-full-diagnostic.json`, der isolierte Diagnosequelltext
unter `output/msi-progress-diagnostic`; Authentifizierung und Spielstart
wurden nicht ausgeführt. Dieser Test prüft den nativen MSI-Reader, nicht den
vollständigen Setup-/Pipe-/Onboarding-UI-Pfad. Für dessen Abnahme bleibt ein
erneuter sichtbarer Setup-Test erforderlich.

Der neue gemeinsame Kandidat `1.0.8136` unter
`output/windows-installer-zero-field-progress-review` stammt aus sauberem
Commit `63c3e59a93c9719c6f6c5a46e67924a71d5bd4c6`. Seine vollständige
Buildstrecke ist mit Exit 0 abgeschlossen: 1.940 Setup-Assertions,
63 First-Run-Assertions, Launcher-/Updater-Prüfungen, isolierte Runtime-,
Bootstrap- und Launcher-Smokes (Ports `60772`/`60773`), 173-Schlüssel-
Sprachmatrix sowie 10.901-Dateien-Payloadaudit sind grün.
Setup-SHA-256:
`30676d7ec7b46bbc3c7520caea4032ae7375bc3560c2f5dd04fc46730959a827`;
MSI-SHA-256:
`23ec2c9fe2d57bffb02777e92eecbbfccc4c6b4398154e2b8f1f5c08668c041e`.
Originale und Eingangskopien wurden gegen Metadaten und Prüfsummendatei
verifiziert. Das alte 8134-Setup ist nach Bestätigung seines Fehlerdialogs
geschlossen. 8136 wurde am 6. September um 14:03:33 UTC in derselben VM als
PID `2896` gestartet; `result/zero-field-setup-start.json` bindet Pfad und
Hash. Ein Installationsklick wurde nicht ausgeführt. Der Nutzer stoppte
Computer Use beim anschließenden Erfassungsversuch mit der physischen
Escape-Taste; die UI-Steuerung bleibt bis zu seiner ausdrücklichen
Fortsetzungsanweisung angehalten. Die Installation von 8136 und ihre native
Abnahme sind damit weiterhin offen. Es läuft kein Build oder MSI-Test mehr.
WIN-I08 bleibt offen; kein Main-Merge, Worktree-Cleanup oder Push.

Nach ausdrücklicher Fortsetzungs- und Installationsfreigabe wurde 8136 am
6. September um 14:12 UTC über das native deutsche Setup gestartet. Der
erhöhte Worker (PID `2784`) durchlief MSI und Pipe ohne den bisherigen
Callbackfehler. MSI-Client und -Server meldeten um 14:14:39 UTC jeweils 0;
die anschließende read-only Prüfung bestätigt Produktregistrierung und
installierte Version `1.0.8136`. Log:
`C:\Windows\Temp\NETGRID-install-94845b82b8e746df847a1c1eb3e522d2\install.log`;
gebundener Nachweis: `result/install-8136-probe.json` im aktuellen Laufordner.
Native Screenshots zeigen die Vorbereitung mit Aktivitätsbalken, den weiterhin
lesbaren, getrennten Datenhinweis und den fertigen Balken nach MSI-Erfolg.
Die kurze messbare Ausführungsphase lag zwischen zwei Aufnahmen; sichtbare
Zwischenprozente sind deshalb noch nicht als beobachtet abgenommen. Der
vorherige direkte MSI-Test beweist die numerischen Counterdaten, nicht diese
fehlende Zwischenaufnahme der Setupoberfläche.

Der neue native Dialog „NETGRID-Verwaltung jetzt einrichten?“ ist erreicht
(First-Run-PID `5284`, Setup-PID `2896`). Er zeigt zunächst die Entscheidung
„Jetzt einrichten“/„Später“, erklärt Maintenance und nennt den späteren
Startmenü-Einstieg; es sind noch keine Passwortfelder geöffnet. Die
Einrichtungsentscheidung und Passwortbedienung werden dem Nutzer überlassen.
Der eigentliche MSI-Lauf war beendet; First Run wartete bei dieser Aufnahme
auf die Entscheidung.
Keine Zugangsdaten wurden durch den Agenten geändert. Weitere native
Sprach-/DPI-/Kontext-, Launcher- und GitHub-Updategates bleiben offen.

Die anschließende Identitätsprüfung (`result/installed-8136-identity.json`,
zuletzt am 6. September um 19:40 UTC erneut mit Exit 0 ausgeführt) bestätigt
die vier installierten Binärdateien gegen die Release-Metadaten sowie Desktop-
und vier Startmenüverknüpfungen. First Run und Setup sind geschlossen, der
Launcher läuft. Welche Einrichtungsentscheidung der Nutzer getroffen hat,
ist damit nicht belegt; vorhandene Zugangsdaten werden nicht verändert.

Der native deutsche Launcher-Test um 19:36–19:40 UTC bestätigt den korrigierten
STA-Pfad: „Diagnosepaket erstellen …“ öffnet den Windows-Speicherdialog; nach
Speichern erscheint die Erfolgsmeldung. Automatisierte Texteingabe kam im
Sandbox-Dateifeld auch nach erneuter Fokusprüfung nicht an. Dieser Versuch
wurde abgebrochen und der Dialog mit seinem vorgeschlagenen Dateinamen erneut
geöffnet. Die Sandbox-Sicherheitseinstellungen blieben unverändert.
Das lokal erzeugte Archiv `NETGRID-diagnostics-20260906-213807.zip` wurde
hashgleich in den Laufordner kopiert:
`result/native-diagnostics-8136-20260906-193807.zip`, SHA-256
`5fa4356f7935c0d7fceebde98bc38da23f36d8178d0c63c6a9e7639396f9136b`.
`result/native-diagnostics-8136-verification.json` bindet die fünf Einträge:
`diagnostics.json`, drei Launcher-Logs einschließlich `launcher-update.log`
und `runtime.env.redacted`. Die Metadaten nennen 1.0.8136, Windows x64 und
de-DE; Datenbank-/Zugangsdaten-Dateien sind nicht enthalten. Die eine sensible
Konfigurationszuweisung ist redigiert. Das ist keine Behauptung über jede
mögliche künftige Logfüllung; deren Schutz bleibt zusätzlich testgebunden.
Es fand kein Upload statt.

Die manuelle native Updatesuche in derselben netzlosen Sandbox zeigt nun
den Informationsdialog zur nicht erreichbaren GitHub-Updatequelle mit
Hinweis auf Internetverbindung, späteren Versuch und weitere Nutzbarkeit
von NETGRID. Der Dialog wurde geschlossen; keine Updateinstallation wurde
gestartet. Damit sind deutscher Diagnoseexport und manuelle Offline-Rückmeldung
auf dem installierten 8136-Stand nativ belegt. Ein echter GitHub-Release-
Download/Update sowie die übrigen Sprach-/DPI-/Einrichtungsabnahmen bleiben
offen; WIN-I08, Main-Integration und Worktree-Cleanup sind nicht abgeschlossen.

Der native Desktop-Starttest am 6. September um 19:41 UTC erreicht eine
Windows-Meldung, dass der `http`-Link nicht geöffnet werden kann. Die
read-only Gastdiagnose `result/browser-health-8136.json` grenzt dies ein:
Webclient auf `127.0.0.1:3100` liefert 200, Server auf `127.0.0.1:8787/health`
liefert 200 mit `ok=true`, der einzige Launcher bleibt PID `6264`.
Edge ist installiert und über sein vorhandenes Desktopsymbol startbar;
der generische `HKCR\http\shell\open\command` fehlt, während eine
benutzerspezifische HTTP-Auswahl existiert. Daraus wird keine vollständige
Diagnose des konkreten UserChoice-ProgID abgeleitet. Belegt ist der
fehlgeschlagene Windows-Linkstart bei gesunder NETGRID-Laufzeit.

Ein ausdrücklich diagnostischer Aufruf des vorhandenen Edge mit
`http://127.0.0.1:3100/` zeigt die deutsche Spielstartseite, sichtbare Version
„V1.0 · Build 8136“, Matchauswahl und Gastnamenfeld. Gebundener Startnachweis:
`result/browser-diagnostic-start-8136.json`. Dieser direkte Browseraufruf ist
kein eingebauter Launcher-Ersatzpfad und ersetzt nicht die noch offene Abnahme
des normalen Browserstarts. Browserzuordnung, Authentifizierung und
Sicherheitseinstellungen wurden nicht verändert. Für den normalen Starttest
ist zunächst eine funktionierende HTTP-Standardbrowserzuordnung im Gast
erforderlich; der Hauptrechner bleibt unverändert.

Die hashgebundene reine First-Run-Statusabfrage vom 6. September um 19:45:58 UTC
bestätigt inzwischen `initialized=true` mit Exit 0
(`result/first-run-status-8136.json`). Es wurde ausschließlich `--status`
ausgeführt, kein Bootstrap oder Reset. Das beweist den eingerichteten Zustand,
nicht die unbeobachteten einzelnen Passwort-/Zurück-Schritte des Nutzers.

Von 19:46 bis 19:50 UTC wurden außerdem die nativen englischen und französischen
Setupoberflächen von 8136 geprüft: Sprachwahl mit unmittelbar übersetzten,
getrennten Aktionsschaltflächen, Standardwerte, benutzerdefinierte Optionen
und deren angeklickter Hilfedialog. Sichtbare Beschriftungen, Standardordner,
Datenhinweis und mehrzeilige Hilfe sind vollständig und ohne Überlagerungen
dargestellt. Die Reviewprozesse `6340` und `7028` wurden jeweils über das
Fensterkreuz ohne Installationsaktion geschlossen. Startbindungen liegen in
`result/language-review-8136-start.json` und
`result/language-review-8136-start-7028.json`. Die Sprachauswahl änderte nur
den jeweiligen Reviewprozess, nicht die installierte Sprachpräferenz.
Dies ist eine Sichtprüfung im vorhandenen Sandboxkontext, keine zusätzliche
reale DPI-Stufe, kein Hovernachweis und keine funktionale Sprachabnahme von
Installation, Update oder Ersteinrichtung. Diese übrigen Gates bleiben offen.

Die vertiefte read-only Browserdiagnose um 19:52:33 UTC
(`result/http-association-8136.json`) belegt die konkrete Inkonsistenz:
HTTP-UserChoice ist bereits `MSEdgeHTM`, aber diese Klasse und ihr
`shell\open\command` fehlen vollständig in HKCR. Edge ist damit ausgewählt,
jedoch nicht als HTTP-Handler registriert. Die bisher angefragte bloße
Standardbrowserzuordnung ist deshalb nicht als ausreichende Reparatur belegt.
Es wurden keine Registrywerte geschrieben und kein Browser repariert oder
neu installiert. Der nächste Umgebungsschritt benötigt die Freigabe zur
Reparatur der Edge-Browserregistrierung ausschließlich im Gast.

Auch die erneute read-only Prüfung der öffentlichen
[GitHub-Releases-Seite](https://github.com/LevelX2/NETGRID/releases) am
6. September um 19:52 UTC zeigt weiterhin keine Releases. Ohne freigegebenes
veröffentlichtes Testartefakt kann der echte GitHub-Download-/Updatefluss nicht
abgenommen werden; lokale Fixtures ersetzen diesen Nachweis nicht. Weder
Releaseveröffentlichung noch Push, Main-Integration oder Cleanup sind erfolgt.

Nach der Nutzerfreigabe aller angefragten Punkte wurde am 6. September um
20:00:47 UTC ausschließlich im Sandbox-Benutzerkonto der fehlende ProgID
`HKCU\Software\Classes\MSEdgeHTM` mit URL-Kennzeichnung, Icon und dem
Öffnungsbefehl des vorhandenen Edge ergänzt. Vorbedingungen waren eine gültige
Microsoft-Signatur der vorhandenen EXE, die unveränderte Auswahl `MSEdgeHTM`
und das vollständige Fehlen der Klasse; vorhandene Registrierungen werden
nicht überschrieben. UserChoice einschließlich Hash wurde davor/danach
auf Unverändertheit geprüft. Nachweis:
`result/edge-http-registration-repair.json`. Keine Browserinstallation,
Änderung von Sicherheitsoptionen oder NETGRID-Produktänderung war erforderlich.

Danach öffneten sowohl „NETGRID öffnen“ im Tray um 20:02 UTC als auch die
Desktopverknüpfung um 20:04 UTC jeweils einen neuen Edge-Tab mit der Spielseite
von Build 8136 ohne Windows-Fehlermeldung. Anders als der frühere direkte
Edge-Diagnoseaufruf verwendeten beide Tests den normalen Produktpfad über
Windows ShellExecute. Die erneute installierte Identitätsprüfung ist mit Exit
0 grün; der Launcher blieb die einzelne Instanz PID `6264`. Der Browserblocker
dieses Sandboxlaufs ist damit geschlossen. Die Gastvorbereitung ist nicht
Bestandteil des NETGRID-Installers und wird nicht als unverändertes frisches
Windows-Ausgangsimage ausgegeben.

Die GitHub-Testfreigabe ist erteilt; der fortgeltende ursprüngliche Auftrag
„Kein Push“ ist aber noch nicht ausdrücklich aufgehoben. Die read-only
GitHub-CLI-Prüfung ist authentifiziert als `LevelX2`; für den Quellcommit des
8136-Artefakts `63c3e59a93c9719c6f6c5a46e67924a71d5bd4c6` liefert GitHub
422 „No commit found“. Ein Release-Tag soll auf den tatsächlichen Quellstand
zeigen, nicht auf ein unbeteiligtes Remote-Main. Deshalb wurde die konkrete
Freigabe für Testbranch-/Tag-Übertragung separat angefragt. Bis zur Antwort
erfolgt keine solche Übertragung oder Veröffentlichung. Ein Updateziel muss
zudem regulär mit einer höheren Buildversion als 8136 erzeugt werden; Versions-
oder Prüfsummenmetadaten vorhandener Artefakte werden dafür nicht umgeschrieben.

Am 7. September hat der Nutzer die GitHub-Übernahme ausdrücklich freigegeben
und ein Testrelease für einen anderen PC gewünscht, jedoch nur unter der
Bedingung, dass der übrige Stand fertig geprüft ist. Die zuvor ausstehende
GitHub-Freigabe ist damit erteilt; die übrigen offenen Abnahmen sind dadurch
nicht erlassen. Noch keine Veröffentlichung oder Übertragung ist erfolgt.
Vor dem Testrelease müssen die nicht von GitHub abhängigen Abnahmen geschlossen
werden. Der echte GitHub-Download-/Update-Nachweis folgt anschließend mit dem
Testrelease und bleibt Voraussetzung für den vollständigen WIN-I08-Abschluss.
Ein solcher Testkandidat wird nicht als bereits vollständig zertifiziertes
Release bezeichnet. Die geplante Probe auf dem anderen PC ersetzt noch keinen
tatsächlich ausgeführten Nachweis.

Der Private-LAN-Nachweis liegt im Laufordner `793526b6b355460798f2aae4aef5c9be`
unter `lan-host-private.json`, `lan-host-public.json` und `lan-state.json`.
Die erste Public-Prüfung war wegen der pauschalen, aktiven Sandbox-Regel
„Container: allow inbound“ nicht aussagekräftig: Diese erlaubte alle Ports
in allen Profilen trotz inaktiver NETGRID-Regeln. Nach ausschließlich temporärer
Deaktivierung dieser eindeutig identifizierten Gastregel wurden Public und
Private erneut geprüft, ohne neue Blockregeln anzulegen. Beide Prüfungen
bestanden; Cleanup und Wiederherstellung der Gastregel sind um 20:45 Uhr
bestätigt. Host-Firewall und Produkt-Firewalllogik blieben unverändert.

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
