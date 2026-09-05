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
| Produktgrenze und Installer-Payload | Vollständiger Manifestvergleich; 10.901 Dateien auch nach dem Updaterfix | Für den aktuellen Build erfüllt; nach weiteren Payloadänderungen erneut prüfen |
| Installation, Upgrade und Repair | Vollständiger erhöhter 13-Punkte-Lauf am 2026-09-05, einschließlich ProductCode-Repair und geprüftem Cleanup | Lokaler MSI-Vertrag erfüllt; funktionale UI- und Clean-Windows-Gates bleiben getrennt |
| GitHub-Updateauswahl und Integrität | Lokale API-Fixtures für Stable/Prerelease, Offline und manipulierte Hashes; echter Launcher-Download-Dateipfad nach reproduzierter Windows-Dateisperre korrigiert und getestet | Echter zustimmungsbasierter installierter Updatefluss; neue Artefakte mit Downloadfix |
| Updatertransaktion und Rollback | Neuer echter Sandboxlauf 8105/8106 am 2026-09-05 grün: geprüftes Backup, MSI-Upgrade, bewusst beschädigte Testdatenbank, erkannter Healthfehler, Programmrollback auf 8105, Datenmarker und SQLite-Integrität wiederhergestellt, Konfiguration unverändert, Cleanup verifiziert | Transaktionsgate für dieses Artefaktpaar erfüllt; abschließende Benachrichtigung bleibt ein separater Dialogtest |
| Benutzerbetrieb und Netzwerk | Standardbenutzerbetrieb und ACLs grün. Private-LAN-Test des installierten 8106: Web/Server vom Host erreichbar, Maintenance mit 403 abgewiesen; im öffentlichen Profil beide Ports bei weiterhin gesunden lokalen Diensten blockiert. Testinstallation, Ports und NETGRID-Regeln bereinigt; temporär deaktivierte pauschale Sandbox-Containerfreigabe wiederhergestellt | Für 8106 einschließlich dokumentierter Sandbox-Firewallvorbereitung erfüllt; neue Builds bleiben gesondert gebunden |
| Sichtbare Flows | 18 Setup-/Uninstall-Renderings für de/en/fr und drei Skalierungen | Funktionale Gesamtflows einschließlich Update/Repair/Fehlern auf dem installierten Produkt |
| Saubere Windows-11-x64-Maschine | Vollständige 13-Punkte-Offline-MSI-Matrix am 2026-09-05 von 18:22 bis 18:55 Uhr einschließlich Cleanup grün: Windows 11 Enterprise x64 (26100), ohne Entwicklungswerkzeuge; alle vier Artefakthashes mit dem Hostnachweis abgeglichen | Lokaler Clean-Windows-MSI-Vertrag erfüllt. Zusätzliche Updater-, Standardbenutzer-, Netzwerk- und UI-Gates bleiben getrennt; der laufende Rollbacktest erweitert nicht rückwirkend diese Evidenz |

Diese offenen Anforderungen werden nicht durch engere grüne Tests ersetzt.

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
