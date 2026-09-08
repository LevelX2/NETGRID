# Windows-Installer-Produktvertrag

Stand: 2026-09-04  
Status: beschlossenes Zielbild; Anwendungsvoraussetzungen, Installerbasis,
Datenvertrag, Launcher, Setupführung, First Run, Updater, Lokalisierung,
Branding und Diagnose als Komponenten umgesetzt; gebundene Updateanbindung
und ursprünglicher Benutzer-Neustart implementiert; direkter
MSI-Aktivspielschutz als Komponentenpfad umgesetzt, native Abnahme offen

## Zweck und Grenze

Dieser Vertrag beschreibt den geführten Windows-11-x64-Installer, den
Launcher und den Updateweg für NETGRID. Er baut ausschließlich auf dem
auditierten Output aus `build:windows-release-output` auf. Repositoryquellen,
Entwicklungsdatenbanken, Testspiele, Demo- und Selfplay-Daten, private
Kartenbilder, Secrets und sonstige Entwicklungsartefakte bleiben gemäß
`windows-release-boundary.md` ausgeschlossen.

Der Vertrag führt kein zweites fachliches Datenmodell ein. Das gepinnte
WiX-7-Installerskelett setzt bereits Produktgrenze, Buildidentität,
Lizenzinventar und vollständigen Payload-Audit um; Launcher, First Run,
geführte Konfiguration und Updater folgen im Paketprozess.

## Installationsprodukt

- Offiziell unterstützt wird zunächst Windows 11 x64.
- Ausgeliefert wird ein klassischer Windows-Setup-Assistent mit `Setup.exe`
  und MSI-Paket, Eintrag unter „Installierte Apps“, Reparatur und sauberer
  Deinstallation. WiX ist die bevorzugte Werkzeugbasis.
- NETGRID wird pro Rechner installiert. Der Programmordner ist standardmäßig
  `C:\Program Files\NETGRID` und darf in den erweiterten Optionen geändert
  werden.
- Node.js 24 x64 wird mitgeliefert. Die zugehörigen Lizenz-, Copyright- und
  Drittanbieterhinweise sind Bestandteil des Pakets.
- Installation, Update, Reparatur und Deinstallation fordern einmalig die
  Windows-Administratorfreigabe an. Der normale Betrieb benötigt keine
  Administratorrechte.
- Die erste private Alpha darf unsigniert sein. Codesigning, Timestamping und
  die Beschaffung eines öffentlich vertrauenswürdigen Zertifikats bleiben vor
  einer breiteren Veröffentlichung ein eigenes Release-Gate.
- Die nativen NETGRID-Dateiversionen sind an die technische Produktversion
  gebunden. Das MSI verwendet für seinen unveränderlichen Programmoutput
  `REINSTALLMODE=amus`, damit auch eine ausdrücklich gewählte Rückkehrversion
  die vorhandenen Programmbytes ersetzt. Datenroot und Credentials gehören
  nicht zu dieser Dateimenge. Releaseprüfungen kontrollieren PE-Versionen,
  MSI-Policy und anschließend die installierten Hashes; ein Versionslabel
  allein ist kein Beleg für den tatsächlichen Austausch.

## Zwei geführte Installationswege

Die erste fachliche Auswahl des Setups lautet:

1. **Voreingestellte Werte verwenden**: zeigt nur unvermeidbare Entscheidungen und
   übernimmt alle übrigen Werte aus diesem Vertrag. Sie ist vorausgewählt.
2. **Benutzerdefinierte Installation**: führt verständlich durch alle
   freigegebenen Optionen, erklärt Folgen und zeigt jeweils den empfohlenen
   Wert. Sie schaltet keine internen Entwicklerparameter frei.

Auch der Weg mit voreingestellten Werten muss mindestens die Betriebsart abfragen,
weil eine Netzwerkfreigabe nicht stillschweigend erfolgen darf. Notwendige
Ersteinrichtungen können nach Abschluss in einem sicheren First-Run-Assistenten
erfolgen, wenn Geheimnisse nicht gefahrlos über MSI-Eigenschaften verarbeitet
werden können.

### Empfohlene Defaults

| Bereich            | Vorauswahl                             |
| ------------------ | -------------------------------------- |
| Setupweg           | Voreingestellte Werte verwenden        |
| Betriebsart        | Nur dieser Rechner                     |
| Kontomodus         | Einfach, ohne Spielerpasswörter        |
| Programmordner     | `C:\Program Files\NETGRID`             |
| Datenordner        | `C:\ProgramData\NETGRID`               |
| Web-/Serverport    | `3100` / `8787`                        |
| Spielaufbewahrung  | automatische Bereinigung nach 30 Tagen |
| Desktopverknüpfung | aktiviert, abwählbar                   |
| Abschlussaktion    | „NETGRID jetzt starten“ aktiviert      |
| Updatekanal        | nur stabile GitHub Releases            |

## Datenablage und Lebenszyklus

- Alle veränderlichen Daten liegen außerhalb des Programmordners unter einem
  absoluten `NETGRID_DATA_ROOT`.
- Die bearbeitbare Deckbibliothek verwendet im Releaseprofil
  `NETGRID_DATA_ROOT/runtime/decks`, unabhängig vom Windows-Benutzerprofil.
  Ein expliziter `NETGRID_DECK_LIBRARY_PATH` muss ein absoluter Unterpfad des
  Datenroots sein; fehlende oder ungültige Releasepfade brechen sichtbar ab.
  Der Entwicklungsbetrieb behält seine bisherige benutzerbezogene Ablage.
  Bestehende Entwicklungsdecks werden weder importiert noch verändert.
- Standard ist `C:\ProgramData\NETGRID`. In den erweiterten Optionen darf ein
  anderer Ordner auf einem lokalen, dauerhaft verfügbaren Laufwerk gewählt
  werden.
- Netzwerkfreigaben, Cloud-Synchronisationsordner und Wechselmedien sind als
  Datenroot nicht unterstützt. Programm- und Datenordner dürfen nicht
  identisch sein.
- Das Setup prüft Zielpfad, Schreibrechte, verfügbaren Speicher und einen
  gegebenenfalls vorhandenen gültigen NETGRID-Datenbestand. Updates behalten
  den gewählten Datenpfad bei.
- Eine Entwicklungs- oder Playtest-Datenbank wird weder automatisch erkannt
  noch importiert. Produktdatenmigrationen benötigen einen eigenen
  versionierten Vertrag und Upgrade-Test.
- Bei der Deinstallation bleiben Konten, Profile, Decks, Spiele,
  Einstellungen, Kartenbilder und Backups standardmäßig erhalten. „Alle
  NETGRID-Daten endgültig löschen“ ist eine gesonderte, nicht vorausgewählte
  und lokalisierte Bestätigung.

### Umgesetzte Installations- und Datenbasis

- Der Installer liefert die offizielle Node.js-24.20.0-x64-Laufzeit als
  minimales `runtime/node/node.exe` aus. Das Quellarchiv ist mit seiner
  veröffentlichten SHA-256-Prüfsumme gepinnt; Node- und .NET-Lizenzen sowie
  Drittanbieterhinweise liegen unter `legal`.
- `NETGRID.RuntimeConfig.exe` ist eine selbstenthaltene .NET-10-Windows-
  Komponente. Sie bestimmt ohne benutzerdefinierte Angabe
  `C:\ProgramData\NETGRID`, bewahrt eine zuvor registrierte Auswahl und
  speichert den gewählten Datenroot unter
  `HKLM\SOFTWARE\LevelX2\NETGRID`.
- Die Komponente erzeugt `config/runtime.env` atomar aus der freigegebenen
  Vorlage. `NETGRID_TOKEN_SALT` entsteht intern aus 32 Zufallsbytes und wird
  nie über MSI-Eigenschaften, Prozessargumente oder Ausgaben transportiert.
  Eine vorhandene valide Konfiguration wird bei Repair nicht ersetzt; ein
  Platzhalter oder abweichender Datenroot bricht sichtbar ab.
- `runtime`, dessen bekannten Unterordner und `card-images` geben der lokalen
  Benutzergruppe Änderungsrechte. Der Root ist nur durchquerbar, `config`
  samt Runtimekonfiguration und Installationsstatus nur lesbar; Administratoren
  und Local System behalten Vollzugriff.
- UNC-Pfade, nicht feste Laufwerke, Laufwerkswurzeln, Reparse-Points und jede
  Überlappung mit dem Programmordner sind fail-closed. Die MSI-
  Initialisierung ist erhöht, als Deferred Action verborgen und für
  vollständige Deinstallationen ausgeschlossen. Deshalb bleiben Produktdaten
  beim Standard-Uninstall unangetastet.

### Installer-/Launcher-Koordination (in nativer Abnahme)

Die Setup-Rückkehrdatei und die Setup-Verknüpfung sind an dieselbe MSI-
Produktkennung gebunden. `InstalledSetupCache` schreibt ausschließlich
`config/updates/<ProductCode>/NETGRID-Setup.exe`: Hashprüfung und Kopie halten
die Quelldatei gegen Änderung gesperrt; Verzeichnisse werden beim Zugriff
gegen Austausch gehalten. Ein vorhandener Eintrag darf nur mit exakt
identischen Bytes wiederverwendet werden. Eine neue Produktkennung erhält
einen getrennten Eintrag. MSI besitzt `CurrentProductCode` als Registrywert
seiner Launcher-Komponente und nimmt ihn bei Fehlern transaktional zurück.
Updater und Reparatur wählen über diese Registrierung, nicht über globale
„aktuell“-/„pending“-Dateien. Die Rückkehrdatei bleibt zusätzlich im
geschützten Updatesnapshot gehalten. Nach Erfolg oder Rücknahme wird der
selektierte Cachehash vor Freigabe gegen den erwarteten Stand geprüft.
Die Komponenten- und MSI-Tabellenprüfungen sowie die native Wiederinstallation
und ProductCode-Reparatur von 8195 mit korrektem Cache-/Shortcutziel sind grün.
Die direkten MSI-Transaktionen mit 8201/8202 belegen inzwischen Upgrade,
Downgrade und Fehlerrollback einschließlich unveränderter vorheriger Caches.
GUI-/Tray-Updater und Mehrbenutzerbetrieb bleiben gesonderte native Gates.

Die MSI-Transaktion besitzt eine pro Programmordner gebundene Installersperre
unter `HKLM\SOFTWARE\LevelX2\NETGRID.InstallerLifecycle` (64-Bit-Ansicht).
Der gemeinsame Writer ist nur in erhöhte MSI-Aktion und Updater eingebunden;
Launcher und First Run lesen ausschließlich. Die MSI-Aktion verwendet die
Sperre bereits; der Updater hält seine übergeordnete Lease über Backup,
MSI-Teiltransaktion, Healthprüfung und gegebenenfalls Rollback hinweg.
Der bestehende Launcher bleibt Owner des geordneten Runtime-Stopps. Während
der Sperre sind neue Starts und Recovery ausgeschlossen. Die MSI-Aktion
verändert erst Dateien, wenn die exakt zugehörigen Produktprozesse beendet
sind. Ein Timeout scheitert sichtbar statt Prozesse fremd zu beenden.

Commit und Rollback dürfen nur ihre eigene Transaktions-ID abschließen.
Ein Abschlusszeitpunkt bleibt als Installationsmetadatum in der
Registry erhalten, auch nach Deinstallation: Er blockiert alte, erst nach
Transaktionsende zum Zuge kommende Launcherprozesse. Diese Metadaten
enthalten weder Nutzerdaten noch Zugangsdaten. Unlesbare oder fremde aktive
Sperren werden nicht stillschweigend gelöscht. Die aus dem MSI-Binary-Stream
ausgeführte Komponente benötigt das Windows-11-Framework .NET 4.8 oder höher;
die normalen selbstenthaltenen NETGRID-Anwendungen bleiben davon getrennt.
Der aktuelle native Abnahmestand steht im Paketprozess, nicht in dieser
Architekturbeschreibung.

Der aktuelle Quellstand verwendet einen atomaren, versionierten Datensatz
mit den Phasen `preparing`, `preparing-msi`, `stopping`, `verifying` und `completed`. Die vorbereitete
Updatephase lässt ausschließlich den ursprünglichen Launcher mit exakt
gebundener PID und Prozessstartzeit weiterlaufen, während neue Starts
gesperrt sind. Ihr Abbruch bewahrt diese Ausnahme; der Übergang zum Stopp
entfernt sie. Eine kurze Writer-Mutex serialisiert Änderungen, während der
persistente Datensatz die längerlebige Sperre besitzt. Ungültige oder alte
Datensatzformate werden nicht still konvertiert. Die Vorbereitung ist an den
Updateablauf angebunden; dessen vollständige native Abnahme bleibt offen.
Die aktuelle MSI-Bindung ergänzt denselben atomaren Datensatz um eine
Teiltransaktions-Lease und den ProductCode. Ein MSI-Commit oder -Rollback
darf nur diese eigene Bindung abschließen; eine übergeordnete Updatesperre
bleibt gehalten. Die Entfernung der alten Version liegt nach
`InstallExecute` innerhalb der neuen Transaktion. Der verschachtelte
Altversions-Uninstall prüft die Bindung an den neuen ProductCode und löst
weder die Sperre noch Daten-/Firewall-Löschaktionen aus. Die echte
Zwei-Versionen-Prüfung mit absichtlichem MSI-Fehlerrollback ist für den
ruhenden Sandbox-SYSTEM-Fall grün; die vollständige Abnahme bleibt offen.

Eine zweite, kurze und pro Programmordner benannte Windows-Mutex
`InstallationLaunchFence` schließt die Lücke zwischen letzter Sperrprüfung
und Kindprozessstart. Launcher (einschließlich Recovery) und First Run lesen
die Installersperre unter dieser Mutex erneut und starten ihre Kinder noch
im selben synchronen Abschnitt. MSI-Lease-Erwerb und Updater-Vorbereitung
verwenden dieselbe Mutex; der Updater prüft dort zusätzlich, ob sein bereits
gebundener ursprünglicher Launcher noch lebt. Health-, Pipe- und
Prozessende-Wartezeiten liegen außerhalb dieses Abschnitts. Die Lockreihenfolge
lautet lokale Launcher-Lifecycle-Sperre, Start-Mutex, Registry-Writer-Mutex;
es wird keine Mutex über ein `await` hinweg gehalten.

Die Start-Mutex ist keine zusätzliche Installationsautorität. Der ACL-Eintrag
für authentifizierte Benutzer gewährt nur Warten und Freigeben, keine
DACL-Änderungsrechte; Windows-Eigentümerrechte bleiben davon unberührt. Eine explizite
Medium-Integritätsmarkierung ermöglicht den normalen Launcherzugriff auch
nach Erstellung durch einen erhöhten Teilnehmer. Netzwerk-Anmeldungen sind
ausgeschlossen; Admin und SYSTEM erhalten Vollzugriff. Öffnungsfehler,
Abandonment und fünf Sekunden Wartezeitüberschreitung verhindern die Aktion.
Die Implementierung verwendet
[`CreateMutexExW`](https://learn.microsoft.com/en-us/windows/win32/api/synchapi/nf-synchapi-createmutexexw)
mit expliziten Minimalrechten auch beim Öffnen eines vorhandenen Objekts.
Der Aktivspielschutz eines direkt gestarteten MSI ist anschließend an diese
Grenze angebunden; seine native Abnahme bleibt ein eigenes offenes Gate.

Bei direktem Versionswechsel oder Reparatur bindet das MSI unter der Start-
Mutex den exakt zugehörigen ursprünglichen Launcher. `preparing-msi` enthält
dessen PID/Startzeit, den MSI-Prozess und die eigene ProductCode-/Lease-
Bindung. Nur der ursprüngliche Launcher bleibt startberechtigt. Sein
bestehender Watcher beantwortet die Anforderung über den gemeinsamen
`UpdateHandoff`-Pipevertrag. Beide Endpunkte prüfen den tatsächlichen
Windows-Pipepartner; der normale Launcher hält für den MSI-Prozess lediglich
einen Handle mit Query-Limited-/Synchronize-Rechten, keinen Vollzugriff.
Startzeit und signalisierter Prozesszustand werden getrennt geprüft. Ein
Exitcode 259 wird nicht mit einem laufenden Prozess verwechselt; ein noch
laufender Prozess hat laut
[`GetProcessTimes`](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getprocesstimes)
keinen definierten Exitzeitwert.

Der Launcher verwendet ausschließlich seinen vorhandenen
`PrepareUpdateAsync`-/`PreparedUpdate`-Owner: atomare Serversperre und
SQLite-Spielanzahl, bestätigter Abbruch bei nicht abgeschlossenen Spielen
oder geordneter Serverstopp mit Exitcode 0. Nur danach darf `Proceed`
gesendet werden. Fehler, Verbindungsende und fehlende Bestätigung sind keine
Freigabe. Eine Absage erhält den ursprünglichen Launcher; eine unbestätigte
Vorbereitung kann nur der passende Rollback, nicht ein erfolgreicher
MSI-Commit abschließen. Erst nach `stopping` und nachgewiesener Abwesenheit
der Produktprozesse darf das MSI Dateien verändern.

Ohne laufenden Launcher prüft ein Versionswechsel unter der gehaltenen
Installersperre über `storage-admin.mjs update-readiness` ausschließlich
lesend die vorhandene SQLite-Datei. Die Statusklassifikation gehört dem
bestehenden Storage-/Maintenance-Modul. Unbekannte Statuswerte, Formatfehler,
beschädigte Daten, fehlende Prüfdateien oder ungültige Antworten scheitern
sichtbar. Eine nie angelegte Datenbank wird nicht dafür erzeugt. Eine
Reparatur desselben Produkts ohne laufende Runtime darf fehlende Node-/CLI-
Dateien wiederherstellen und benötigt diesen Offline-Versionswechselcheck
nicht. Ein expliziter Uninstall bleibt eine autorisierte Stoppoperation.

Der zum Launcher gehörende MSI-Component registriert den aktuellen Vertrag
`InstallerLifecycleProtocol=msi-data-v1`. Fehlt dieser bei einem
vorhandenen Produkt, wird vor Veröffentlichung der neuen Sperrphase
abgebrochen. Es entsteht kein Legacy- oder Ersatzprotokoll. Die native
Upgrade-/Downgrade-Abnahme benötigt daher zwei aktuelle Builds; alte
Testkandidaten sind keine gültige Basis. Der Versionswechsel behält den
registrierten Programmordner bei. Vollständige native Transaktions-,
Reparatur- und Mehrbenutzerprüfungen bleiben offen. Updater und direkte
MSI-Versionswechsel binden Backup, Healthcheck und Restore als Ablauf zusammen.
Beide verwenden den vollständigen Live-Datenroot-Snapshot aus `UpdateDataSnapshot`,
nicht mehr das reine Match-SQLite-Backup aus `storage-admin.mjs backup-update`.
Direkte MSI-Upgrades, Downgrades und der physisch nachgeprüfte Datenrestore
nach einem absichtlichen Cachefehler sind mit 8201/8202 unter Sandbox-SYSTEM
belegt. Der vollständige Tray-Updater-Ablauf, Aktivspielschutz und
Mehrbenutzerbetrieb bleiben offen; diese Teilabnahme erfüllt nicht das
gesamte Release-Gate.

Die gemeinsame Lease-Autorität unterstützt als Voraussetzung dafür einen
kurzlebigen direkten MSI-Operationsowner. Er bindet seine tatsächliche
PID/Startzeit an die unveränderte MSI-Lease und den ProductCode. Nur ein
direktes MSI (`Lease == MsiLease`) ohne vorhandenen Operationsowner darf diese
Rolle vergeben; eine MSI-Teiltransaktion eines äußeren Updaters bleibt davon
ausgeschlossen. Deren Lease-IDs müssen ausdrücklich verschieden sein.
`OpenVerificationOwner` erlaubt den bestehenden gebundenen Headless-Verifier
auch innerhalb dieser direkten MSI-Operation. `OpenUpdateOwner` bleibt enger
und erlaubt weiterhin keine aktive MSI-Teiltransaktion.

Die Verifierfreigabe erhält MSI-Lease und ProductCode. Nur der genaue
Operationsowner darf sie vergeben, widerrufen und seine Rolle regulär zurückgeben.
Ein Commit oder Rollback kann die MSI-Lease während einer aktiven Operation
nicht freigeben. Nach Rückgabe bleibt die MSI-Sperre aktiv; weder ein
fehlgeschlagener Healthcheck noch ein Helper-Ende beweist einen erfolgreichen
Datenrestore. Diese Ownership- und Verifierpfade sind isoliert geprüft
und inzwischen durch die MSI-Custom-Actions aufgerufen.

Für direkte Versionswechsel startet `BeginNetgridLifecycle` nach dem geordneten
Stopp synchron den installierten Updater mit dem engen `--msi-data capture`-
Vertrag. Der Helper prüft Administratorrechte, registrierten Programm-/Datenroot
und sein installiertes Image. Er verwendet keine beliebigen Archivpfade und
öffnet keine Dialoge, auch nicht im SYSTEM-Kontext. Vor Snapshot-Erzeugung
schreibt der einzige Lease-Writer den geschützten `MsiData`-Nachweis; nach
vollständiger Prüfung bindet er Snapshot-ID und Manifest-SHA-256 an dieselbe
MSI-Lease und denselben ProductCode. Ein Exitcode allein ersetzt diesen
Nachweis nicht.

`VerifyNetgridLifecycle` ist eine synchrone Deferred-Aktion. Ihr Helper öffnet
das gebundene Archiv erneut, prüft weiterhin unveränderte Konfiguration und
Credentials und führt den vorhandenen Headless-Verifier aus. Nur dessen
Erfolg und tatsächliches Ende erlauben den Zustand `verified`. Beim Rollback
öffnet der zurückgekehrte Helper der Vorversion dieselbe Sicherung, erhält
zuerst den fehlgeschlagenen Datenstand in einem separaten Snapshot und führt
Restore plus Healthcheck aus. Erst `restored` erlaubt die Rollback-Freigabe.
Ein Abbruch noch während der vorbereitenden Sicherung darf ohne Restore
beendet werden, weil die Begin-Aktion dann keine MSI-Dateiänderung freigegeben
hat. Fehlende, beschädigte oder fremde Nachweise werden nicht ersetzt.

Zwischen den synchronen Helper-Aufrufen hält die MSI-Lease den Produktstart
gesperrt; jeder neue Helper prüft und sperrt die Snapshot- und geschützten
Live-Dateien erneut. Dateisperren werden nicht über ein beendetes Prozessobjekt
hinweg behauptet. Ein noch lebender Verifier, eine fehlgeschlagene Rücksicherung
oder eine durch Prozessverlust verwaiste Helper-Operation bewirkt keine
automatische Freigabe der MSI-Transaktion. Der noch laufende synchrone
MSI-Aufrufer hält den echten Kindprozesshandle und dessen Startzeit. Nach
nachgewiesenem Kindprozessende und Abwesenheit aller Produktprozesse darf
er ausschließlich die passende Helper-Rolle zurückgeben. Ein noch lebender
gebundener Verifier verhindert auch dies. Die Rückgabe läuft unter Startfence
und Registry-Schreibsperre, erhält dieselbe aktive MSI-Lease, ProductCode und
den vollständigen Sicherungsnachweis und erlaubt nur den anschließenden
regulären MSI-Rollback. Ein Fehlerexit bleibt ein Fehler; selbst Exit 0 ohne
reguläre Helper-Rückgabe gilt nicht als erfolgreiche Datenoperation.
Bei Timeout, weiterlaufenden Prozessen, fremdem Owner oder Verlust des
Custom-Action-Aufrufers bleibt die Bindung bestehen. Der davon getrennte
`msiexec /i`-Client ist nicht der Halter des Helper-Prozesshandles. Sein
nativer Abbruch während eines Versionswechsels ist inzwischen mit fortgesetzter
erfolgreicher Installer-Ausführung belegt; er beweist weder einen Ausfall
des Custom-Action-Hosts noch eine verwaiste MSI-Transaktion. Umfang und
unabhängige Abschlussnachweise stehen im Update-Runbook. Die normale Updater-Absturzreparatur
darf sie weiterhin nicht löschen. Same-Product-Repair, Erstinstallation,
Uninstall, verschachtelte Altproduktentfernung und bereits außen abgesicherte
Updater-MSI-Teiltransaktionen erzeugen keine zweite Datensicherung.

Für die verbleibende Anbindung gilt: Die Prüfung der neuen Version muss als
synchrone Deferred-Aktion vor `InstallFinalize` und nach dem Dateiaustausch
einschließlich verschachtelter Altproduktentfernung erfolgen. Ein fehlgeschlagener
Check muss die noch rücknehmbare MSI-Transaktion scheitern lassen. Die vor
Dateiänderungen registrierte Rollback-Aktion führt nach Rücknahme der
Programmänderungen den eigenen Datenrestore und dessen Prüfung aus. Eine
Commit-Aktion ersetzt dieses Verify-Gate nicht. Führend sind Microsofts
[InstallFinalize-Vertrag](https://learn.microsoft.com/en-us/windows/win32/msi/installfinalize-action)
und [Rollback-Custom-Action-Vertrag](https://learn.microsoft.com/en-us/windows/win32/msi/rollback-custom-actions).

### Vollständige Updatesicherung im Updater

- Nach gehaltenem Installationslease und nachgewiesener Abwesenheit aller
  Produktprozesse sichert `UpdateDataSnapshot` die Dateiinhalte, relativen
  Pfade, leeren Verzeichnisse und DACLs des registrierten Datenroots. Das
  umfasst insbesondere beide SQLite-Dateien bei getrennter Kontenablage,
  vorhandene SQLite-Sidecars, Decks, Kartenbilder, Import-/Paketdateien,
  Einstellungen und lokale Logs. Es ist kein Volume-/NTFS-Abbild.
- Die ausdrücklich ausgeschlossenen Bereiche sind historische Storagebackups
  (`NETGRID_STORAGE_BACKUP_DIR`, sonst `runtime/backups`),
  `config/update-backups` für diese Snapshots sowie die getrennt behandelten
  Installer-Caches `config/updates`, `config/installer` und `runtime/updates`.
  Auch der MSI-Reparaturcache bleibt dadurch im Besitz des Installers und
  wird von einem Datenrestore weder ersetzt noch entfernt. Ein Live-Datenpfad
  außerhalb des Roots oder unter einem ausgeschlossenen Bereich bricht ab.
  Eine überlappende Backupwurzel wird nicht stillschweigend akzeptiert.
- Snapshots liegen unter `config/update-backups/<zufällige-ID>` mit
  geschützter DACL ausschließlich für Administratoren und SYSTEM; Eigentümer
  ist die Administratorengruppe. Ein vorhandener Archivordner mit abweichenden
  Rechten oder Eigentümer wird abgewiesen. Das Manifest enthält Größen,
  SHA-256 und DACLs, keine Datei- oder Credentialinhalte. Der Updater protokolliert
  nur Snapshot-ID und Manifestprüfsumme.
- Quellverzeichnisse und ihre Vorfahren bleiben gegen Umbenennen gehalten;
  Datei-Lesehandles erlauben keine parallelen Schreiber oder Löschungen.
  Reparse Points und Hardlinks werden abgewiesen. Die Inventare vor und nach
  dem Kopieren müssen übereinstimmen. Ein Attribut-Handle allein genügt nicht
  als Verzeichnissperre; der native Regressionstest erfordert tatsächlich
  verweigertes Umbenennen mit `FILE_LIST_DIRECTORY` und ohne
  `FILE_SHARE_DELETE` ([Windows-Dateizugriff](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea)).
- `config/runtime.env` und der aufgelöste Maintenance-Credentialpfad werden
  gesichert, aber niemals vom Restore beschrieben. Vorhandene Dateien bleiben
  während der Transaktion lesend gesperrt; Inhalte und DACLs werden vor
  Freigabe geprüft. Auch eine zuvor fehlende und inzwischen neu angelegte
  Credentialdatei führt zum sichtbaren Abbruch statt zu einer Überschreibung.
- Vor jeder Rücksicherung wird der fehlgeschlagene aktuelle Datenzustand
  separat vollständig gesichert. Erst nachdem Quellsnapshot und aktueller
  Zustand geprüft sind, werden Dateien einzeln über gleichverzeichnisige
  Stagingdateien ersetzt. Deren ursprüngliche wirksame DACL wird bereits
  beim Anlegen gesetzt und bis zur Wiederherstellung der ursprünglichen
  Elternrechte gegen zusätzliche Vererbung geschützt
  ([.NET-Dateierstellung mit ACL](https://learn.microsoft.com/en-us/dotnet/api/system.io.filesystemaclextensions?view=net-10.0)).
  Neu entstandene Dateien werden nur nach dieser
  Sicherung gezielt entfernt; zusätzliche leere Verzeichnisse bleiben stehen.
  Eine zuvor nie angelegte Datenbank wird nicht für das Backup initialisiert.
- Auch bei einem fehlgeschlagenen MSI wird vor dem Wiederanlauf der vorige
  Datenstand zurückgesichert. Erst erfolgreiche Datenprüfung, Healthcheck,
  erneute Prozessabwesenheit und unveränderte geschützte Dateien erlauben die
  Lease-Freigabe. Datei- und Verzeichnisrechte werden wiederhergestellt und
  geprüft. Die Dateisperren enden vor dem normalen Benutzer-Neustart.

Vor dem MSI-Start bindet der aktuelle Updater-Owner Snapshot-ID,
Manifest-SHA-256, Datenroot und Prüfsumme des vorherigen Setups an seine
Lease. Diese Referenz liegt als einzelner `Recovery`-Wert im geschützten
HKLM-Lifecycle-Key; sie stammt weder aus dem Archiv noch aus einer frei
angegebenen Restore-Datei. Nur der aktuelle Prozess mit exakt gebundener
Startzeit in `stopping` ohne laufende MSI-Teiltransaktion darf sie schreiben.
Eine abweichende zweite Referenz derselben Lease wird abgewiesen; eine
abgeschlossene Referenz berechtigt weder zur Wiederholung noch zur Freigabe
einer neuen Transaktion.

Der Updater öffnet seine Rücksicherung inzwischen erneut über diese Referenz.
`UpdateDataSnapshot.Reopen` prüft Manifestversion 2, ID, erwartete Prüfsumme,
Archiv-DACL/Eigentümer, Datenroot, Ausnahmen, geschützte Dateien, vollständige
Feldstruktur, eindeutige relative Pfade, Elternreihenfolge, Dateigrößen,
Dateihashes und DACLs. Pfadtraversal, Windows-Dateialiasse, fehlende/zusätzliche
oder doppelte Felder und alte Manifestversionen scheitern sichtbar. Es gibt
keinen Legacy- oder Archiv-selbstautorisierten Restore. Beim Wiederöffnen
werden sämtliche Archivinhalte sowie vorhandene Konfiguration und Credentials
erneut lesend gesperrt. Fehlende normale Datenverzeichnisse können anhand des
Manifests mit ihren ursprünglichen Rechten neu angelegt werden; geschützte
Dateien werden weiterhin niemals ersetzt.

Das vorherige Setup wird vor dem ersten MSI-Start zusätzlich als
`previous-setup.exe` im geschützten Snapshot gehalten und per gebundener
Prüfsumme geöffnet. Ein bereits ausgetauschter Installer-Cache darf die
Rückkehr zur Vorversion nach einem Prozessabbruch nicht verhindern.

Der explizite Einstieg `NETGRID.Updater.exe --repair-update --program-root
<Installationsordner>` fragt nach Zustimmung und startet einen erhöhten
Reparaturhelfer aus einer separaten Kopie. Quelle, Kopie und sämtliche
Elternverzeichnisse sind während dieser Übergabe gegen Austausch gesperrt;
Junctions und Dateilinks werden abgewiesen. Der installierte Einstieg beendet
sich vor dem MSI-Lauf. Die registrierte Installation und der geschützte
Recovery-Wert bestimmen die Daten und das Setup; freie Archivpfade sind keine
Reparaturautorität.

Die Übernahme derselben Lease erfolgt nur in `stopping` oder `verifying`,
nach nachgewiesenem Ende des ursprünglichen Owners, ohne MSI-Teiltransaktion
und ohne verbleibende Produktprozesse. Zustand und Prozessidentität werden
unter Start- und Schreibsperre erneut geprüft. Programmwiederherstellung,
Datenrestore und gebundener Healthcheck müssen gelingen, bevor die Sperre
freigegeben wird. Danach startet der Nutzer NETGRID über seine normale
Verknüpfung; der Reparaturhelfer startet keine erhöhte Runtime.

Wiederöffnen nach Ende eines separaten Snapshot-Erzeugers, Lease-Übernahme,
Reparaturreihenfolge und Staging-Sperren sind komponentenweise geprüft.
Die tatsächliche erhöhte Absturzreparatur, verwaiste direkte MSI-Transaktion
und vollständige native Updater-Abnahme bleiben Release-Gates. Die erhöhten
Archivberechtigungen gegenüber Standardbenutzern und die direkte native
Zwei-Build-MSI-Matrix sind inzwischen nachgewiesen; Umfang und Grenzen stehen
im aktiven Paketprozess und im Update-Runbook. Eine noch gebundene
MSI-Teiltransaktion wird auch nach dem
Owner-Ende nicht automatisch gelöscht. Ein Fehler
erhält die Sicherungen und lässt die Installationssperre bestehen; er wird
nicht als erfolgreiche Reparatur gewertet.

### Aufbewahrung gespeicherter Spiele

- Automatische Bereinigung ist standardmäßig aktiv und entfernt ungeschützte,
  terminale Spiele nach 30 Tagen.
- Der geführte Ablauf bietet mindestens 7, 30, 90, 180 und 365 Tage sowie
  „Nie automatisch löschen“.
- Als „behalten“ markierte Spiele werden nicht automatisch gelöscht.
- Der Backend-Start stößt eine fällige Bereinigung zeitnah asynchron an; das
  Öffnen der Anwendung wartet nicht darauf. Danach bleibt die stündliche
  Prüfung aktiv.
- Der Routine-Cleanup erstellt kein vollständiges Backup, da gelöschte Spiele
  sonst dauerhaft in Sicherungen fortbestehen würden. Update-Backups sind
  davon getrennt.

## Betriebs- und Netzwerkmodell

- NETGRID verwendet einen Benutzerlauncher und keinen Windows-Dienst.
- Es gibt keinen Windows-Autostart. NETGRID startet nur über Startmenü,
  optionale Desktopverknüpfung oder einen bereits geöffneten Launcher.
- Der Launcher startet Server und Weboberfläche bei Bedarf, erkennt eine
  vorhandene Instanz und öffnet dann die richtige URL.
- Während des Betriebs bleibt ein NETGRID-Symbol im System-Tray sichtbar. Es
  bietet mindestens „NETGRID öffnen“, „Maintenance öffnen“ und „NETGRID
  beenden“.
- Das Schließen des Browserfensters beendet NETGRID nicht. Nur „NETGRID
  beenden“ stoppt die Instanz kontrolliert.
- Startmenüeinträge „NETGRID“ und „NETGRID Maintenance“ verwenden dieselbe
  Instanz. Maintenance bleibt unabhängig von der Spielbetriebsart lokal über
  Loopback erreichbar und behält ihre eigene Authentifizierung.
- Nach einem unerwarteten Prozessabbruch versucht der Launcher genau einen
  automatischen Neustart. Scheitert auch dieser, zeigt er einen verständlichen
  Dialog mit Wiederholen, Diagnose und Beenden; es gibt keine Endlosschleife.

### Umgesetzter Launcherbetrieb

- `NETGRID.exe` ist eine selbstenthaltene .NET-10-Windows-Desktopanwendung
  ohne separat benötigte .NET-Laufzeit. Sie startet ausschließlich die unter
  Program Files installierten, manifestgebundenen Entrypoints mit der
  mitgelieferten Node-Laufzeit.
- Eine globale Mutex begrenzt den Launcher auf eine Instanz. Weitere Aufrufe
  öffnen die bereits konfigurierte Spiel- oder Maintenance-URL und starten
  keine zweite Prozessgruppe.
- Der Launcher bereinigt geerbte NETGRID- und Node-Konfigurationswerte und
  übernimmt anschließend die geschützte `runtime.env` als Autorität. Server-
  und Web-Health müssen innerhalb von zwei Minuten erfolgreich sein.
- Der Server besitzt nur im Launcherbetrieb einen privaten stdin-
  Steuerkanal für den geordneten HTTP-, WebSocket- und Storage-Shutdown. Der
  Webclient wird danach als eigener Prozessbaum beendet. Es gibt weiterhin
  keinen Dienst und keinen Autostart.
- Nach dem ersten unerwarteten Prozessende wird die gesamte Prozessgruppe
  genau einmal wiederhergestellt. Ein zweiter Fehler stoppt sie und bietet
  Wiederholen, Öffnen des Diagnoseordners oder Beenden.
- Launcherlogs liegen unter `runtime/logs`, rotieren bei zwei MiB und
  redigieren sowohl das reale Tokensalz als auch erkennbare
  Token-/Passwort-/Secret-/Salt-Zuweisungen.

### Betriebsarten

Das Setup fragt ausdrücklich:

- **Nur dieser Rechner**: Bindung und Zugriff bleiben lokal.
- **Privates Netzwerk**: Spielzugriff wird im privaten LAN erlaubt. Eine
  eingehende Windows-Firewallregel gilt ausschließlich für das Netzwerkprofil
  „Privat“. Im Profil „Öffentlich“ bleibt externer Zugriff blockiert.

Eine öffentliche Internetfreigabe, Router-Portweiterleitung oder exponierte
Maintenance-Oberfläche wird nie automatisch eingerichtet. Zugriff über ein
vom Benutzer eingerichtetes VPN kann den privaten LAN-Weg nutzen. Die
Standardports `3100` und `8787` werden vorab geprüft; bei Konflikten bietet
das Setup einen freien Alternativsatz beziehungsweise in der
benutzerdefinierten Installation eine gültige manuelle Auswahl an.

### Umgesetzte Setupführung und LAN-Grenze

- `NETGRID-Setup-<Version>-x64.exe` ist ein selbstenthaltener .NET-10-
  Setup-Assistent. Er bettet genau das separat veröffentlichte WiX-MSI ein,
  bindet es an dessen SHA-256 und prüft den Hash vor jeder Extraktion.
- Der vorausgewählte empfohlene Weg zeigt die unvermeidbare Wahl zwischen
  lokalem Betrieb und privatem LAN sowie Desktop- und Abschlussoption. Der
  benutzerdefinierte Weg schaltet Programm-/Datenpfad, beide Ports und die
  freigegebenen Aufbewahrungswerte frei.
- Belegte Standardports führen im empfohlenen Weg zu einem bestätigungspflichtigen
  freien Alternativpaar. Im benutzerdefinierten Weg muss der Nutzer den
  Konflikt selbst korrigieren. Vor der Bestätigung findet keine Erhöhung und
  keine Systemänderung statt.
- `private_lan` ist ein eigener Anwendungs-Vertrag und nicht das vorhandene
  HTTPS-Profil `private_internet`: öffentliche Spiel-URLs müssen eine private
  IPv4-Adresse verwenden, Wildcards und öffentliche Adressen werden
  fail-closed abgewiesen. Launcher-Health und Maintenance bleiben auf
  Loopback.
- Die erhöht angelegte Windows-Firewallfreigabe bindet ausschließlich die
  mitgelieferte Node-Laufzeit, TCP und die gewählten Ports an das Profil
  „Privat“. Für „Öffentlich“ wird keine Regel angelegt; lokaler Betrieb und
  Deinstallation entfernen die beiden bekannten NETGRID-Regeln.
- Der gewählte Aufbewahrungswert initialisiert die bestehende Storage-Policy
  nur, wenn noch keine Policy gespeichert ist. Danach bleibt Maintenance die
  einzige Autorität; Reparatur und erneuter Setupstart überschreiben die
  gespeicherte Auswahl nicht.

## Spielerprofile und Maintenance

### Kontomodi

Beide Modi erlauben im erreichbaren lokalen beziehungsweise privaten Netzwerk
die direkte Selbstanlage eines Spielerprofils ohne Einladung und ohne
Betreiberfreigabe:

- **Einfach**: Profil anlegen oder auswählen, kein Spielerpasswort. Der Modus
  ist für den eigenen Rechner und ein vertrauenswürdiges privates Netzwerk
  vorausgewählt.
- **Geschützt**: Bei der Profilanlage wird ein Passwort vergeben; Anmeldung
  und Profilwechsel sind damit geschützt.

Das bisherige Invite-only-Bootstrapmodell ist für das installierte Produkt
nicht der Zielweg. Der aktive Profilname wird vor jedem Spiel deutlich
angezeigt und kann dort gewechselt werden. Ein Browser beziehungsweise Gerät
merkt sich sein zuletzt verwendetes Profil; im geschützten Modus darf der
Benutzer bewusst „Auf diesem Gerät angemeldet bleiben“ wählen.

Spieler dürfen das eigene Profil umbenennen. Eine endgültige Profillöschung
mit ihren persönlichen Zuordnungen erfolgt nur über Maintenance. Gäste
bleiben ohne dauerhaftes Profil und ohne fortgeführte persönliche Statistik;
das anonyme Spiel unterliegt weiterhin der normalen Matchaufbewahrung.

Maintenance kann ohne Neuinstallation zwischen einfachem und geschütztem
Kontomodus wechseln. Beim Wechsel in den geschützten Modus führt ein Assistent
durch die Passwortvergabe für bestehende Profile. Beim Rückwechsel verlangt
Maintenance eine erneute Passwortbestätigung und warnt vor dem anschließend
passwortlosen Profilzugriff. Beide Richtungswechsel widerrufen alle
Spielersitzungen. Vergessene Spielerpasswörter werden ausschließlich über
Maintenance zurückgesetzt, ohne Spiele oder Historie zu löschen.

### Maintenance-Ersteinrichtung

Der Maintenance-Zugang bleibt in beiden Kontomodi eigenständig geschützt.
Das Passwort wird nicht als MSI-Eigenschaft oder Kommandozeilenargument
übergeben. Nach der Installation richtet ein lokaler, geschützter
First-Run-Schritt das Passwort durch zweimalige verdeckte Eingabe über den
bestehenden sicheren Bootstrapweg ein. Die normale Spieloberfläche bleibt
nutzbar; Maintenance bleibt bis zur Initialisierung gesperrt.

### Umgesetzte Ersteinrichtung

- Der benutzerdefinierte Setupweg bietet ausschließlich die vorhandenen
  Account-Policies `simple` und `protected`; der empfohlene Weg verwendet
  `simple`. Dieser nicht geheime Wert initialisiert die bestehende
  Accountautorität und überschreibt keine später persistierte Policy.
- `NETGRID.FirstRun.exe` wird nach der Installation gestartet und bleibt als
  Startmenüpunkt wiederaufrufbar. Es liest ausschließlich die geschützte
  installierte Runtimekonfiguration und verwendet die mitgelieferte Node-
  Laufzeit sowie `app/maintenance-auth.mjs`.
- Bei noch nicht eingerichtetem Zugang entscheidet der Nutzer zuerst zwischen
  „Jetzt einrichten“ und „Später“. Die Auswahl erklärt den Zweck der
  NETGRID-Verwaltung und den späteren Startmenüweg. Nur „Jetzt einrichten“
  öffnet die Passwortfelder mit „Zurück“ und „Einrichtung abschließen“;
  dort gibt es keinen konkurrierenden „Später“-Knopf. „Zurück“ löscht und
  verdeckt die Eingaben und kehrt zur Entscheidung zurück.
- Das Maintenance-Passwort wird zweimal verdeckt erfasst und nur über die
  Standardeingabe-Pipe an den bestehenden `bootstrap`-Befehl übergeben. Es
  erscheint weder in MSI-Eigenschaften noch Prozessargumenten, Dateien des
  Setuphosts oder Protokollen.
- Ein bereits vorhandener Credentialstore wird vorab erkannt; auch ein
  konkurrierender zweiter Bootstrap wird von der Authentifizierungsautorität
  abgewiesen. First Run besitzt absichtlich keinen Reset- oder
  Überschreibepfad.
- Im privaten LAN sind Selbstanlage und Anmeldung im gewählten Profilmodus
  erlaubt. Account-Policy-Verwaltung, Maintenance und lokaler Reset bleiben
  weiterhin an eine direkte Loopback-Verbindung auf dem Serverrechner
  gebunden.

## Updates über GitHub Releases

- GitHub Releases ist der einzige Veröffentlichungs- und Updatekanal.
- Der Launcher prüft einmal beim Start, ob eine neuere freigegebene Version
  existiert. Ohne Internet bleibt NETGRID uneingeschränkt nutzbar.
- Standardmäßig werden nur stabile Releases angeboten. In den Einstellungen
  kann „Stabile und Vorabversionen“ aktiviert werden. Maßgeblich ist das
  GitHub-`prerelease`-Flag; Drafts werden ignoriert.
- Ein Update wird nur nach ausdrücklicher Zustimmung heruntergeladen und
  installiert. Vorabversionen erhalten eine zusätzliche deutliche Warnung.
- Vor jeder Updateinstallation wird ein vollständiges, geprüftes Datenbackup
  erzeugt. Eine Vorabversion verwendet dieselbe Installation und denselben
  Datenbestand; ein Downgrade ist nicht zugesichert.
- Läuft NETGRID, warnt der Updater und beendet es kontrolliert. Ein laufendes
  Spiel blockiert das Update, bis es beendet oder das Update abgebrochen wird.
- Nach erfolgreichem Update wird eine zuvor laufende Instanz wieder gestartet.
- Bei einem Fehlschlag werden soweit technisch möglich die vorherige
  Programmversion und das unmittelbar davor erzeugte Datenbackup
  wiederhergestellt. Ist das nicht sicher möglich, bleibt NETGRID gestoppt
  und zeigt einen klaren Reparaturweg statt eines teilaktualisierten Starts.
- Releases enthalten mindestens Versionsangabe, lokalisierte
  Änderungshinweise, Installer und veröffentlichte SHA-256-Prüfsumme. Vor der
  Installation muss der Download gegen die freigegebene Integritätsinformation
  geprüft werden; Codesigning ergänzt dieses Gate später.

## Datenschutz, Diagnose und Support

- NETGRID sendet keine Telemetrie und keine automatischen Fehlerberichte.
  Der einzige automatische externe Kontakt ist die Updateprüfung bei GitHub.
- Der Launcher kann auf ausdrückliche Benutzeraktion ein Diagnosepaket
  erzeugen. Es enthält Versionen, technische Konfiguration und bereinigte
  Protokolle, aber keine Datenbank, Passwörter, Tokens, privaten Kartendaten,
  gespeicherten Spiele oder menschlichen Hidden-Info-Inhalte.
- Das Diagnosepaket wird nie automatisch hochgeladen. Der Benutzer entscheidet
  selbst, ob es einem GitHub-Fehlerbericht beigefügt wird.

## Sprache, Branding und visuelle Qualität

- Setup, First Run, Launcher, Tray-Menü, Update-, Reparatur-, Fehler- und
  Deinstallationsdialoge sind vollständig auf Deutsch, Englisch und
  Französisch verfügbar.
- Die Windows-Sprache wird erkannt; `de`, `en` und `fr` werden direkt gewählt,
  sonst Englisch. Die Sprache kann am Setupbeginn geändert werden.
- Die ausdrücklich gewählte Setupsprache wird pro Installation unter
  `HKLM\SOFTWARE\LevelX2\NETGRID\UiLanguage` gespeichert. Setup,
  Ersteinrichtung, Launcher und Updater verwenden dieselbe Präferenz;
  Reparatur und Update ohne neue Auswahl behalten sie bei. Ohne gespeicherte
  Auswahl gilt die Windows-Sprache. Ungültige gespeicherte Werte werden nicht
  durch einen stillen Ersatzwert verdeckt.
- Sichtbare Texte verwenden natürliche, korrekt formatierte Sprache, echte
  Umlaute und `ß` im Deutschen, konsistente Terminologie, verständliche
  Fehlerursachen und handlungsorientierte Schaltflächen. Abgeschnittene Texte,
  rohe Logmeldungen, unübersetzte Platzhalter und technisch wirkende
  Provisorien sind Releaseblocker.
- Das vorhandene NETGRID-Windows-Icon wird konsistent für Setup-Datei,
  Startmenü, Desktopverknüpfung, Tray und „Installierte Apps“ eingebunden.
  Setupgrafiken, Abstände, Typografie, Skalierung und Kontrast bilden ein
  zusammenhängendes NETGRID-Erscheinungsbild.
- Visuelle Abnahme erfolgt mindestens bei 100 %, 125 % und 150 %
  Windows-Skalierung sowie mit den längsten Texten aller drei Sprachen. Icon-
  und Dialogdarstellung werden auf hellem und dunklem Windows-Kontext geprüft,
  soweit die verwendete Setuptechnologie dies unterstützt.

## Release-Gates des späteren Installers

Ein Installer ist erst veröffentlichungsfähig, wenn mindestens nachgewiesen
ist:

1. ausschließlich auditierter Produktoutput und freigegebene
   Installerressourcen sind enthalten;
2. Frischinstallation, empfohlener und benutzerdefinierter Weg, Reparatur,
   Upgrade, fehlgeschlagenes Upgrade mit Rollback und Deinstallation bestehen;
3. Programm-/Datenrechte, Secret-Erzeugung, Portkonflikte und beide
   Netzwerkprofile verhalten sich fail-closed;
4. Launcher, Single-Instance, Tray, Startmenü, Desktopoption, kontrolliertes
   Beenden und einmaliger Crash-Recovery funktionieren;
5. Daten bleiben bei Upgrade und Standarddeinstallation erhalten; explizite
   Datenlöschung und Backup/Restore sind geprüft;
6. einfacher und geschützter Kontomodus, First Run, Maintenance-Trennung und
   Sitzungswiderruf bestehen;
7. stabile und Vorab-Releases werden korrekt unterschieden, Downloads geprüft
   und nur nach Zustimmung installiert;
8. sämtliche sichtbaren Flows sind in `de`, `en` und `fr` funktional,
   sprachlich und visuell abgenommen;
9. Lizenz- und Drittanbieterhinweise sind vollständig; für eine breite
   Veröffentlichung ist zusätzlich Codesigning entschieden und geprüft;
10. eine saubere Windows-11-x64-Testmaschine ohne Entwicklungswerkzeuge kann
    NETGRID nach dem Setup out of the box starten und wieder entfernen.

## Bewusst zurückgestellt

- Windows 10, ARM64, MSIX, Microsoft Store und portable ZIP-Distribution;
- Windows-Dienst und Windows-Autostart;
- öffentliche Internetfreigabe, automatischer Reverse Proxy und automatische
  VPN-Einrichtung;
- E-Mail-Recovery, Passkeys, Zwei-Faktor-Authentisierung und öffentliche
  Registrierung;
- automatische Übermittlung von Telemetrie oder Diagnosen;
- Signaturpflicht für die erste private Alpha.
