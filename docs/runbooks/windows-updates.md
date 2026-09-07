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

Die serverseitige Grundlage des Ursachenfixes ist inzwischen umgesetzt;
ihre Anbindung im Windows-Launcher steht noch aus. Ablehnung oder Abbruch der
Windows-Bestätigung müssen die Freigabe kontrolliert zurücknehmen. Direkte
MSI-Upgrades benötigen denselben Schutz vor dem Entfernen der bisherigen
Version; die vorhandene Installer-/Launcher-Stoppkoordination allein ersetzt
ihn nicht. Diese Punkte bleiben WIN-I08-Releaseblocker.

`apps/server/src/update-readiness.test.ts` prüft die aktuelle Zählung über den
echten SQLite-/HTTP-Pfad für sämtliche elf gespeicherten Matchzustände:
nichtterminale Lobbys, Countdown und aktive Spiele blockieren auch ohne
verbundene Spieler; ausschließlich terminale Zustände erlauben ein Update.
Ein nicht verfügbarer Speicherstatus wird mit 503 abgewiesen. Dieser Test
belegt bewusst weder eine atomare Freigabe noch den nativen Updateablauf.

### Serverseitige Vorbereitungsschnittstelle

`POST /api/system/update-preparation` schließt die Zulassung neuer
Matchoperationen synchron, wartet auf bereits zugelassene Operationen und
liest erst danach die aktuelle nichtterminale Matchanzahl. Nur bei null
bleibt die Sperre gehalten und die Antwort enthält `updateAllowed=true`.
Der Aufruf braucht auf direktem Loopback das vorhandene flüchtige
Launcher-Control-Token sowie `x-netgrid-update-owner`: eine neue 32-stellige,
kleingeschriebene Hex-Nonce je Versuch. Im Internetprofil ist der Pfad
gesperrt. Es werden keine Maintenance-Credentials verwendet.

`DELETE` auf derselben Route mit derselben Nonce nimmt die Vorbereitung
zurück. Wiederholte Abbrüche desselben Versuchs sind idempotent; ein anderer
Owner darf eine bestehende Sperre nicht lösen. Eine quittierte Rücknahme
verhindert auch eine verspätete Vorbereitung mit derselben Nonce. Diese
Versuchsmetadaten liegen ausschließlich im Arbeitsspeicher des Servers.
Der künftige Launcher muss bei unklarem Vorbereitungsergebnis denselben
Versuch explizit abbrechen und die Quittierung prüfen, bevor er normalen
Betrieb behauptet.

Der fachliche Owner ist `MultiplayerService`; die bestehende Match-Lock-
Reihenfolge und alle Engine-/KI-Entscheidungen bleiben unverändert.
Spielanlage, Beitritt, Reconnect, Recovery und kontogebundener Wiedereinstieg
sowie die bestehende Match-Lock-Strecke nehmen an der Sperre teil. Schon
zugelassene verschachtelte Vorgänge, insbesondere das nächste Serienspiel,
dürfen zu Ende laufen und werden vollständig abgewartet. Spätere Aufrufe
scheitern mit dem sprachneutralen Spielerfehler `server_update_preparing`,
den Webclients in `de`/`en`/`fr` erklären. Countdown-Fortsetzungen warten auf
die Wiederfreigabe, statt verloren zu gehen oder einen zweiten Timer-Owner
zu erzeugen.

Die Akquisition ist auf 30 Sekunden begrenzt. Timeout, fehlender oder
ungültiger Speicherstatus autorisieren kein Update und lösen ausschließlich
die eigene noch nicht erfolgreiche Akquisition. Eine erfolgreich gehaltene
Sperre läuft nicht stillschweigend ab: Sie bleibt bis zur expliziten
Rücknahme oder zum Prozessende bestehen. Health und die lesende
Readiness-Momentaufnahme bleiben erreichbar; letztere ist weiterhin kein
Ersatz für die Vorbereitung. Beide Control-Antworten sind `no-store`.

`update-admission.test.ts` und `update-preparation.test.ts` prüfen die
Sperrautorität, verzögerte Speicheroperationen, Verschachtelung, veraltete
Fortsetzungen, Abbruch und HTTP-Zugriffsschutz. Der native Launcher-/MSI-
Integrationsnachweis ist damit ausdrücklich noch nicht erbracht.

Der vorbereitete `UpdatePreparationClient` im Windows-Launcher besitzt eine
Nonce je Versuch und verwendet sie auch nach einer verlorenen oder
fehlerhaften Antwort für den expliziten Abbruch. Er akzeptiert nur HTTP-
Loopbackziele ohne Benutzerinformationen; sein eigener HTTP-Handler folgt
weder Weiterleitungen noch einem Proxy. Die gesamte Antwort ist auf 35
Sekunden und 4.096 Bytes begrenzt. Erfolg verlangt exakt die vereinbarten
JSON-Felder, `ok=true`, eine nichtnegative ganzzahlige Matchanzahl und eine
dazu konsistente Freigabe. Doppelte Felder, fehlende Werte und zusätzliche
Felder werden abgewiesen. `Dispose` des HTTP-Clients ersetzt ausdrücklich
keine quittierte Rücknahme. Der Client ist inzwischen in den Runtime-Owner
integriert, aber noch nicht im Tray-Updatepfad aufgerufen.

`LauncherRuntime.PrepareUpdateAsync` hält die bestehende Lifecycle-Sperre
von vor dem POST bis zur quittierten Rücknahme oder zum geprüften Stopp.
Sie verlangt die eigene laufende Prozessgruppe; Start, Recovery und
gewöhnlicher Stopp können währenddessen nicht dazwischenlaufen. Ein
ungültiges oder verlorenes Vorbereitungsergebnis wird mit derselben Nonce
explizit zurückgenommen. Erst nach gültiger DELETE-Quittierung wird normaler
Betrieb wieder zugelassen. Scheitert die Quittierung, wird die Runtime über
denselben Owner terminal gestoppt; ein zusätzlich scheiternder Prozessstopp
bleibt als strukturierter Fehler erhalten. Die Sperre wird dann gelöst,
ohne das terminale Startverbot zurückzunehmen.

Das zurückgegebene `PreparedUpdate` ist ein explizit abzuschließender Scope.
Sein `DisposeAsync` führt gegebenenfalls die quittierte Rücknahme aus und
kann daher scheitern. Konkurrierende Abschlüsse sind ungültig, wiederholtes
Dispose eines abgeschlossenen Scopes ist unschädlich. Nur eine erfolgreiche
Vorbereitung erlaubt `StopAsync`: Dieser setzt das terminale Startverbot,
verlangt für den eigenen Server einen erfolgreichen stdin-Shutdown mit
Exitcode 0 und wartet auf beide eigenen Prozessenden. Ein schon zuvor
beendeter Server, Schreibfehler, Timeout oder Fehlerexit darf nicht durch
Kill in einen erfolgreichen Update-Stopp umgedeutet werden. `Stopped=true`
wird ausschließlich nach vollständigem Erfolg gesetzt. Dies berechtigt
für sich allein noch nicht zum Backup: Der künftige Aufrufer muss zusätzlich
die updateweite Installersperre und die gebundene Updater-Übergabe halten.

### Offene Übergabe- und Stoppreihenfolge

Der bisherige Updater startet die Transaktion nach `WaitForParent`: Er
wartet höchstens 30 Sekunden auf das Ende der angegebenen Launcher-PID und
akzeptiert auch eine bereits fehlende PID. Das allein beweist weder einen
quittierten geordneten Stopp noch die Zustimmung zur konkreten Übergabe.
Zudem liegt zwischen dem Launcher-Ende und dem späteren MSI-Beginn bereits
das Datenbackup. Die jetzige MSI-Sperre schützt dieses frühere Zeitfenster
noch nicht vor einem neuen Launcherstart.

Die Windows-Anbindung muss deshalb die bestätigte Servervorbereitung,
zugehörige Prozesse, geordneten Stopp und den gesamten exklusiven Update-
Abschnitt bis zur geprüften Wiederaufnahme verbinden. Ein bloßes Hinzufügen
von `PrepareAsync` vor den bisherigen UAC-Aufruf reicht nicht. Erfolgreiche
HTTP-Komponententests werden nicht als Nachweis dieser noch offenen
Prozessübergabe oder der Major-Upgrade-Reihenfolge ausgegeben.

Als gemeinsame, noch nicht in den Produktablauf eingebundene Grundlage
liegt `apps/windows/Common/UpdateHandoff.cs` vor. Die lokale Duplex-Pipe
besitzt eine geschützte DACL für den aufrufenden Benutzer und explizit
bestätigte Windows-Administratoren; Netzwerkzugriffe sind ausgeschlossen.
Der zufällige Pipename allein ist keine Identitätsprüfung: Beide Seiten
prüfen den Gegenprozess über Windows-Kernel-Pipeabfragen und halten die
zugehörigen Prozesshandles. Der erhöhte Empfänger muss zusätzlich PID,
Startzeit und erwartetes Launcherimage mit `OpenParent` binden. Eine bereits
fehlende PID ist dabei kein Erfolg.

Der einmalige Kanal verwendet ausschließlich feste 12-Byte-Nachrichten mit
Protokollkennung, Version und typisiertem Entscheidungs-/Quittierungscode.
Weder Pfade noch Befehle, Konfiguration oder Zugangsdaten werden als Payload
übertragen. Ein Empfänger darf nur nach der expliziten `Proceed`-Entscheidung
weiterarbeiten; EOF, ungültige Reihenfolge oder ein Timeout beim Warten auf
die Entscheidung ersetzen sie nicht. Für alle Wartephasen muss der
aufrufende Transaktionsowner einen begrenzten CancellationToken setzen.

Nach Beginn der `Proceed`-Übertragung ist ein fehlendes Ack hingegen ein
unklarer Ausgang, keine sicher zurückgenommene Freigabe. Dafür bleibt
`ProceedMayHaveBeenDelivered=true` erhalten. Der künftige Aufrufer muss dann
die Exklusivität bewahren und den genau gebundenen Worker verfolgen, statt
normalen Betrieb oder einen zweiten Updateversuch freizugeben. Der Transport
beweist selbst weder geordneten Runtime-Stopp noch die updateweite Sperre;
beides bleibt Aufgabe der noch ausstehenden Transaktionsanbindung.

Der Launcher gibt seine beiden Runtime-Prozessslots inzwischen erst frei,
nachdem das Ende des jeweils gehaltenen Prozesshandles nachgewiesen ist.
Auch auf einen erzwungenen Stopp seines eigenen Webprozesses folgt ein
begrenztes Warten auf das Ende. Ein Fehler beim Serverstopp verhindert nicht
den unabhängigen Webstopp; ungeklärte Handles bleiben beim Launcher. Ein
erneuter Start muss diese alten Prozesse zuerst erfolgreich stoppen und
darf die Slots nicht überschreiben. Die Installerbeobachtung meldet in
diesem Fehlerfall keinen erfolgreichen Stopp; ein fehlgeschlagenes Beenden
des Tray-Launchers lässt dessen Owner für einen ausdrücklichen erneuten
Stopp erhalten und zeigt eine Erklärung in `de`/`en`/`fr`.

Die bestehende begrenzte Abschaltpolicy kann den eigenen Server bei einem
fehlgeschlagenen stdin-Shutdown weiterhin zwangsweise beenden. Der neue
Prozess-Ende-Nachweis allein ist deshalb ausdrücklich kein Nachweis eines
erfolgreichen Storage-Flushs oder eines sicheren Backups. Die vollständige
Updateübergabe muss diese Bedingungen zusätzlich prüfen. Ihr vorbereiteter
Runtime-Scope verwendet deshalb den oben beschriebenen strikten Stopp;
der normale Beenden-/Recoverypfad behält seine bestehende Abschaltpolicy.
Die neuen
`StopOwnershipTests` verwenden ausschließlich eigene inert laufende
Kindprozesse sowie einen absichtlich ungebundenen Testhandle und öffnen
weder Produktdaten noch Listener.

`Netgrid.UpdateHandoff.Tests` prüft unter Windows die echten Pipes, ACLs,
Prozessbindung und getrennte eigene Testprozesse, ohne Erhöhung oder
Installation. Der Lauf ist in den Installerbuild aufgenommen. Die separate
Freigabe durch ein anderes Windows-Administratorkonto bleibt eine native
Abnahme, die diese unelevierten Komponentenprüfungen nicht ersetzen.

## Vorbereitete updateweite Installersperre

`Common/InstallationLease.cs` ist der einzige Writer der bestehenden
Installersperre und wird von MSI-Aktionen und Updater gemeinsam verwendet.
Der Updater ruft die neuen Phasen noch nicht im Produktablauf auf. Launcher
und First Run binden weiterhin ausschließlich den Reader ein.

Der atomare Registrywert `Lease` enthält zehn Felder:
`3|lease|phase|cutoffTicks|parentId|parentStartTicks|ownerId|ownerStartTicks|msiLease|msiProductCode`.
Die Startzeiten sind UTC-Ticks. `preparing` hält die Sperre für alle neuen
Starts, nimmt aber exakt den ursprünglichen Launcher anhand PID und
Startzeit aus. Der aufrufende Updater muss diese Identitäten zuvor am echten
Prozess binden; die Registryvalidierung allein beweist sie nicht.
`StopPrepared` verlangt denselben Lease-Owner und entfernt die Ausnahme in
der Phase `stopping`. Der Standalone-MSI-Pfad beginnt direkt mit `stopping`.

Beim Abbruch von `preparing` bleibt nur dieser ursprüngliche Launcher
ausgenommen. Alle anderen bis zum Abschlusszeitpunkt geborenen Prozesse
bleiben gesperrt; ein verspäteter Start erhält durch den Abbruch keine
Freigabe. Der ursprüngliche Launcher kann erneut vorbereiten. Ein vorher
bereits gesperrter anderer Launcher kann sich diese Ausnahme nicht erwerben.
Der Abschluss einer Stopptransaktion bewahrt keine Prozessausnahme. Der
Cutoff sinkt auch bei rückwärts verstellter Uhr nicht.

Eine pro Programmroot benannte globale Mutex serialisiert nur die kurzen
Read/Modify/Write-Abschnitte. Timeout oder verlassene Mutex ergeben eine
sichtbare Diagnose ohne Registryänderung. Sie ersetzt nicht die gehaltene
Transaktionssperre. Alle Phasen und Prozessidentitäten werden zusammen als
ein Registrywert veröffentlicht. Unbekannte Phasen, unvollständige
Identitäten und alte Recordformate sind fail-closed; es gibt weder
Dual-Read noch automatische Löschung einer bestehenden Sperre. Kandidat
8169 enthält noch das frühere Format und ist kein Beleg für diesen neuen
Quellstand.

`Netgrid.InstallerLifecycle.Tests` prüft diese Phasen einschließlich
Abbruch, PID-Wiederverwendung, Cutoff, fehlerhaften Records und acht
konkurrierenden Schreibern ausschließlich in einem temporären HKCU-Testbaum.
Das ersetzt noch nicht den nativen Nachweis des Backup-/MSI-/Healthablaufs
oder die Prüfung mit einem anderen Windows-Administratorkonto.

### Gebundener Prüfprozess unter gehaltener Sperre

Die vorbereitete Phase `verifying` verwendet denselben atomaren Registrywert.
Ihre einzige Prozessausnahme gilt für PID und Startzeit des konkreten
Prüfkindes, nicht mehr für den ursprünglichen Launcher. Die Ausnahme ist nur
gültig, solange auch der anhand PID, Startzeit und Prozesshandle geprüfte
Updater lebt. Sein Ende oder eine abweichende Startzeit entzieht die Freigabe,
ohne die äußere Installersperre zu löschen. Unlesbare Prozess-/Registrydaten
bleiben fail-closed. Andere Launcher und MSI-Teiltransaktionen sind weiterhin
gesperrt; `ReleaseOwned` darf eine laufende Prüfphase nicht abschließen.

`UpdateVerifier` startet ausschließlich `NETGRID.exe --headless-verify` mit
explizitem Programmroot, Environmentpfad, Update-Lease und neuer Pipesitzung.
Das Kind bindet zuerst den lebenden Owner der ruhenden Stopp-Lease. Erst nach
kernelgeprüfter Pipeverbindung trägt der Updater dessen konkrete Identität
als Ausnahme ein und sendet `Proceed`. Das Kind prüft die eigene Freigabe vor
dem normalen Runtime-Start. Es besitzt keinen Registrywriter und umgeht den
gewöhnlichen Launcher-Guard nicht.

Ein erfolgreicher Healthlauf verlangt anschließend den strikten eigenen
Server-Shutdown mit Exitcode 0, das Ende des Webprozesses und eine noch gültige
Freigabe. Fehler oder Kill gelten nicht als erfolgreicher Flush. Der
Updater wartet maximal drei Minuten, nimmt die Ausnahme anschließend über
`EndVerification` zurück und verfolgt ein noch laufendes Prüfkind weitere
45 Sekunden. Er beendet es nicht zwangsweise, um daraus Rollbacksicherheit
abzuleiten. Unbewiesenes Prozessende sowie Fehler bei Rücknahme oder Prüfung
bleiben als strukturierte Fehler erhalten; auch ein Rücknahmefehler darf die
Verfolgung des eigenen Kindes nicht überspringen. Die äußere Lease bleibt in
diesem Fall gehalten. Der künftige Transaktionsaufrufer darf nach einem
solchen Fehler weder Rollback noch normalen Betrieb behaupten.

Die Komponentenprüfungen verwenden echte lokale Pipes und ausschließlich
eigene inerte Kindprozesse sowie zufällige HKCU-Testbäume. Sie belegen
Identitätsbindung, Owner-Ende, Rücknahme, Exitcodeauswertung und strikten
Runtime-Stopp, aber keinen installierten Healthlauf. Der tatsächliche
`UpdateTransaction`-/Tray-Pfad ruft diese Komponente noch nicht auf; seine
zusammenhängende Anbindung und die native Abnahme bleiben Releaseblocker.

### MSI-Teiltransaktionen und Major-Upgrade

Eine Standalone-MSI-Transaktion besitzt eine eigene zufällige Lease und
bindet ihren ProductCode. Innerhalb eines Updaterlaufs verlangt sie dagegen
die ausdrücklich übergebene `NETGRID_UPDATE_LEASE`, dieselbe aktive
Stopp-Lease sowie den noch lebenden Updater mit passender PID/Startzeit.
Die Eigenschaft wird als `Secure` und `Hidden` geführt. Eine noch aktive
Vorbereitung, eine fremde Sperre oder eine schon laufende MSI-Teiltransaktion
wird nicht übernommen. Teiltransaktionen besitzen jeweils zusätzlich eine
eigene zufällige `msiLease`; verspätete Rollbacks können keinen späteren
MSI-Lauf freigeben. Der Setuphost kann die äußere Lease inzwischen explizit
übergeben; der Updater ruft diesen gebundenen Modus noch nicht auf.

Für einen updatergebundenen Aufruf akzeptiert der Setuphost ausschließlich
`--install-update --program-root <root> --update-lease <lease>` beziehungsweise
dieselbe Form mit `--uninstall-update`. Die Lease ist eine kanonische,
nichtleere GUID ohne Trennzeichen, der Programmroot ein absoluter lokaler
Pfad. Zusätzliche, doppelte oder unvollständige Argumente werden abgewiesen.
Vor Extraktion und MSI-Start muss der Root zum registrierten Installationsort
passen. Der gemeinsame read-only Reader bindet die aktive Stopp-Lease und
den noch lebenden Owner anhand PID und Startzeit; der Setuphost hält diesen
Handle durch den gesamten MSI-Aufruf. Eine noch aktive MSI-Teiltransaktion
blockiert diesen Einstieg. Datenlöschung ist in diesem gebundenen Modus
nicht zulässig. Die erhöhte MSI-Aktion prüft den Owner nochmals unabhängig.

Standalone-Setupoperationen bleiben ausdrücklich ohne äußere Lease und
dürfen keine vorhandene Updatesperre automatisch übernehmen. Nur der
Standalone-Uninstall ist bei MSI-Code 1605 (Produkt nicht installiert)
idempotent. Ein updatergebundener Rollback reicht diesen Fehler unverändert
zurück; er darf keine nicht erfolgte Deinstallation als Erfolg ausgeben.
Die Argument-/Ergebnisprüfungen starten keinen Installer, die Ownerprüfungen
verwenden ausschließlich eine temporäre HKCU-Fixture und den eigenen
Testprozess.

Der MSI-Commit beziehungsweise -Rollback beendet nur die exakt passende
MSI-Bindung. Gehört der Gesamtvorgang dem Updater, bleiben dessen Phase,
Identität und Startverbot unverändert bestehen. Der Updater kann umgekehrt
seine Sperre nicht abschließen, solange noch eine MSI-Bindung aktiv ist.
Bei einer Standalone-Transaktion schließt ausschließlich ihr äußerer MSI-
Owner auch die gesamte Sperre ab.

`MajorUpgrade` verwendet jetzt `afterInstallExecute`: Erst wird die neue
Dateitransaktion unter der Sperre ausgeführt, dann die alte Version innerhalb
derselben Transaktion entfernt. Das erfordert stabile Komponentenidentitäten
und Referenzzählung und ist noch nativ mit zwei aktuellen Builds abzunehmen.
Maßgeblich sind die [WiX-Sequenzregeln](https://docs.firegiant.com/wix/schema/wxs/majorupgrade/)
und die [Windows-Installer-Reihenfolge](https://learn.microsoft.com/en-us/windows/win32/msi/removeexistingproducts-action).
Die verschachtelte Deinstallation bindet `UPGRADINGPRODUCTCODE` an den
aktiven neuen ProductCode und dessen konkrete MSI-Lease; sie darf diese
Sperre weder neu anlegen noch freigeben. Ihre Daten- und Firewall-Löschaktionen
sind ausgeschlossen, damit sie die soeben eingerichtete Version nicht
beschädigen. Alte Alpha-MSI-Dateien enthalten diesen Vertrag nicht und sind
kein geeigneter Altstand für dessen Zwei-Versionen-Abnahme.

`check-windows-msi-lifecycle.ps1` prüft im kompilierten Paket insbesondere
`InstallFiles < InstallExecute < RemoveExistingProducts < InstallFinalize`,
die geschützte Weitergabe der äußeren Lease und die Bedingungen beider
Cleanup-Aktionen samt Parameterbereitstellung. Die Registrytests prüfen
separat Standalone-Besitz, verschachtelte Bindung, fremde/verspätete Abschlüsse
und das unveränderte äußere Startverbot nach MSI-Commit oder -Rollback.

Die reine Diagnosekompilierung unter
`output/msi-ownership-probe-0afaa24b96a8473ab29ddf76b13ba5a6/NOT-FOR-INSTALLATION.msi`
bestätigt die Tabellenwerte `InstallExecute=6500`,
`RemoveExistingProducts=6501` und `InstallFinalize=6600`. WiX 7 rekonstruiert
in der zugehörigen `probe.wxs` dagegen `Schedule="afterInstallFinalize"`.
Deshalb prüft `checkLifecycleSource` die ursprüngliche Vorgabe; für das
ausführbare Artefakt bleibt ausschließlich die echte MSI-Sequenztabelle
maßgeblich. `checkLifecycleAuthoring` verwendet die Rückübersetzung nur für
Struktur-, Binding- und Cleanup-Prüfungen, nicht für die Upgrade-Reihenfolge.
Der Diagnosebuild kombiniert vorhandene Buildressourcen mit der geänderten
MSI-Autorisierung und ist weder Releasekandidat noch Installationstest.

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
