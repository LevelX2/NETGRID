# Windows-Updates

Status: operativer Vertrag für den privaten Windows-Alpha-Installer

## Updatekanal

Der Launcher verwendet ausschließlich die GitHub-Releases-API für
`LevelX2/NETGRID`. Er prüft einmal nach einem erfolgreichen Start; ein
Netzwerkfehler unterbricht weder Launcher noch Spiel. Standardmäßig werden nur
stabile Releases angeboten. „Stabile und Vorabversionen“ wird im Tray
ausdrücklich aktiviert und im veränderbaren Datenbereich gespeichert.

Ein verwendbares Release enthält den x64-Setuphost, `SHA256SUMS.txt` und
`release-metadata.json`. Prüfsummendatei und Metadaten müssen für den Setupnamen
denselben SHA-256-Wert enthalten. Zusätzlich wird die heruntergeladene Datei
vor dem Start gehasht. Drafts, unvollständige Releases und widersprüchliche
Integritätsangaben werden nicht installiert.

## Sicherer Ablauf

1. Der Nutzer stimmt Download und Installation ausdrücklich zu; eine
   Vorabversion zeigt eine zusätzliche Warnung.
2. Der Launcher fragt den Server über ein zufälliges, nur an diesen
   Kindprozess übergebenes Control-Token ab. Mindestens eine nicht beendete
   Partie blockiert das Update. Nach dem Download wird erneut geprüft.
3. Eine Kopie des Updaters läuft aus `runtime/updates/staging`, wartet auf den
   vollständigen Launcher-Stopp und öffnet die Datenbank erst danach.
4. `app/storage-admin.mjs backup-update` erzeugt und prüft ein vollständiges
   Backup mit Grund `pre_update`.
5. Der heruntergeladene Setuphost führt ein erhöhtes MSI-Major-Upgrade aus.
   Das vorhandene `runtime.env`, Maintenance-Credentials, Kontopolicy und der
   Datenroot bleiben autoritativ.
6. `NETGRID.exe --headless-verify` startet Server und Webclient, prüft beide
   Healthpfade und beendet sie kontrolliert. Erst danach wird der neue
   Setuphost aus dem installerverwalteten Cache als neue Vorversion
   übernommen und NETGRID neu gestartet. Der Cache liegt unter `config`, ist
   für normale Benutzer schreibgeschützt und hält bis zu diesem Healthcheck
   die alte Version unverändert.

### Noch offene Schutzlücke vor der Freigabe

Die beiden Readiness-Abfragen sind momentan nur lesende Momentaufnahmen,
keine Reservierung des spielfreien Zustands. Insbesondere kann nach der
zweiten Abfrage während der Windows-Administratorbestätigung eine neue
Partie angelegt werden, bevor der Launcher tatsächlich stoppt. Der Ablauf
oben ist deshalb noch kein abgeschlossener Nachweis eines lückenlosen
Aktivspielschutzes. Eine weitere Statusabfrage allein löst diesen Wettlauf
nicht.

Der Ursachenfix muss die Freigabe und das Verhindern neuer Spielstarts beim
Server als fachlichem Owner zusammenführen und bereits laufende asynchrone
Spielstarts berücksichtigen. Ablehnung oder Abbruch der Windows-Bestätigung
müssen die Freigabe kontrolliert zurücknehmen. Direkte MSI-Upgrades benötigen
denselben Schutz vor dem Entfernen der bisherigen Version; die vorhandene
Installer-/Launcher-Stoppkoordination allein ersetzt ihn nicht. Diese Punkte
bleiben WIN-I08-Releaseblocker.

`apps/server/src/update-readiness.test.ts` prüft die aktuelle Zählung über den
echten SQLite-/HTTP-Pfad für sämtliche elf gespeicherten Matchzustände:
nichtterminale Lobbys, Countdown und aktive Spiele blockieren auch ohne
verbundene Spieler; ausschließlich terminale Zustände erlauben ein Update.
Ein nicht verfügbarer Speicherstatus wird mit 503 abgewiesen. Dieser Test
belegt bewusst weder eine atomare Freigabe noch den nativen Updateablauf.

## Fehlschlag und Rollback

Scheitert Windows Installer, greift zunächst seine Transaktionsrücknahme; der
Updater startet nur einen weiterhin verifizierbaren alten Stand. Scheitert der
nachgelagerte Healthcheck, deinstalliert der neue Setuphost seine MSI-Version,
installiert den vor dem Update gecachten Setuphost und stellt das unmittelbar
zuvor erzeugte Backup über die bestehende Storage-Restore-Autorität wieder her.

Kann Programm- oder Datenrollback nicht vollständig verifiziert werden, bleibt
NETGRID gestoppt. Maßgebliche Diagnose liegt unter
`runtime/logs/updater-*.log`; sie enthält keine Passwörter, Tokens, Datenbank
oder gespeicherten Partien. Es gibt keinen automatischen Upload und keine
Telemetrie.

## Releaseprüfung

`scripts/smoke-windows-updater.mjs` prüft API-Fixtures für Stable,
Vorabversion, Offlineantwort und manipulierte Integritätsquellen sowie die
Artefakthash- und Rollback-Vertragsbindung. Der komplette erhöhte
Installations-, Update- und Rollbacklauf gehört zusätzlich zur Windows-11-x64-
Matrix in WIN-I08.
