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

| Nachweis | Aktuelle belastbare Evidenz | Noch erforderlich |
| --- | --- | --- |
| Produktgrenze und Installer-Payload | Builds 8136 und 8145 regulär aus sauberen Quellständen gebaut, jeweils 10.901-Dateien-Audit und Setup-/MSI-Prüfsummen grün; installierte Binärdateien zusätzlich für 8136 gebunden | Für beide Builds erfüllt; Installation und Update auf 8145 noch nicht ausgeführt |
| Installation, Upgrade und Repair | Vollständiger 13-Punkte-Offline-Sandboxlauf 8106 → 8109 am 2026-09-05, 22:06–22:38 Uhr, einschließlich ProductCode-Repair und geprüftem Cleanup; alle vier Artefakthashes erneut verglichen | Für dieses Artefaktpaar erfüllt; folgende Sprach-/Shortcutänderungen sowie funktionale UI-Gates bleiben getrennt |
| GitHub-Updateauswahl und Integrität | Aktueller Downloadfix und Stable-/Prerelease-/Tamper-Fixtures grün; native deutsche Offline-Rückmeldung auf 8136 bestätigt | Echter zustimmungsbasierter GitHub-Download/Update; GitHub-Übertragung am 7. September freigegeben, Testrelease erst nach Abschluss der übrigen Prüfungen; höheres reguläres Updateartefakt und netzfähige isolierte Testumgebung erforderlich |
| Updatertransaktion und Rollback | Neuer echter Sandboxlauf 8105/8106 am 2026-09-05 grün: geprüftes Backup, MSI-Upgrade, bewusst beschädigte Testdatenbank, erkannter Healthfehler, Programmrollback auf 8105, Datenmarker und SQLite-Integrität wiederhergestellt, Konfiguration unverändert, Cleanup verifiziert | Transaktionsgate für dieses Artefaktpaar erfüllt; abschließende Benachrichtigung bleibt ein separater Dialogtest |
| Benutzerbetrieb und Netzwerk | Standardbenutzerbetrieb und ACLs grün. Private-LAN-Test des installierten 8106: Web/Server vom Host erreichbar, Maintenance mit 403 abgewiesen; im öffentlichen Profil beide Ports bei weiterhin gesunden lokalen Diensten blockiert. Testinstallation, Ports und NETGRID-Regeln bereinigt; temporär deaktivierte pauschale Sandbox-Containerfreigabe wiederhergestellt | Für 8106 einschließlich dokumentierter Sandbox-Firewallvorbereitung erfüllt; neue Builds bleiben gesondert gebunden |
| Nativer Setup-/Fortschrittsworker | 8136 über deutschen Setup-Host installiert, MSI-Client/Server jeweils 0; recordlose und Nullfeld-Progress-Meldungen ursächlich korrigiert; echter direkter MSI-Countertest grün, Datenhinweis im Setup nicht überlagert | Sichtbare Zwischenprozente der kurzen Ausführungsphase noch nicht aufgenommen; Windows-UAC mit alternativem Administrator und weitere native Fehler-/Abbruchpfade bleiben getrennte Prüfungen |
| Launcher, Browser und Diagnose | 8136: einzelner Launcher, normale Desktop-/Tray-Einstiege zeigen Spielseite nach ausdrücklich freigegebener Reparatur der fehlenden Edge-ProgID im Gast; nativer SaveFileDialog und lokaler redigierter ZIP-Export grün | Gastvorbereitung transparent erhalten; dies ersetzt nicht sämtliche Sprach-/Kontext- und funktionalen Gesamtflows |
| First Run | Nativer deutscher vorgeschalteter Entscheidungsdialog auf 8136 beobachtet; spätere hashgebundene reine Statusabfrage bestätigt eingerichteten Maintenance-Zugang, kein Agent-Bootstrap/Reset | Unbeobachtete Passwort-/Zurück-Schritte nicht nachträglich als abgenommen ausgeben; Authentifizierungsbedienung durch Nutzer, vorhandene Zugangsdaten erhalten |
| Sichtbare Flows | 8136: native englische/französische Sprachwahl, Standard-/Custom-Masken und angeklickte Custom-Hilfe lesbar; ältere 8113-Evidenz für installierten Sprachwechsel, Repair und Shortcutnamen bleibt separat gebunden; Tooltip-Renderings und native Tastatur-Popups vorhanden | Reale 100-/125-/150-Prozent- und Hell-/Dunkel-Kontexte sowie funktionale Gesamtflows in de/en/fr; Sandbox bietet keine nutzbare Skalierungsseite, Hovereingabe ist im verfügbaren Computer-Use-API nicht vorhanden; diese Nachweise brauchen einen geeigneten Testkontext bzw. Nutzerbedienung |
| Saubere Windows-11-x64-Maschine | Vollständige ältere 13-Punkte-Offline-MSI-Matrix einschließlich Cleanup grün: Windows 11 Enterprise x64 (26100), ohne Entwicklungswerkzeuge; neue native Frischinstallation 8136 zusätzlich bestanden | Artefaktgebundene Nachweise nicht pauschal auf spätere Builds übertragen; finale Abnahme bleibt offen bis alle obigen Ergänzungen vorliegen |

Diese offenen Anforderungen werden nicht durch engere grüne Tests ersetzt.

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
Der Ergebnisordner des neuen Laufs ist leer: Die neue Matrix ist ausdrücklich
noch nicht gestartet oder bestanden. Für den Start muss der vorhandene Gast
ausdrücklich zum Verwerfen freigegeben oder ein anderer geeigneter Testrechner
bereitgestellt werden. Es wurde kein GitHub-Release erstellt.

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
