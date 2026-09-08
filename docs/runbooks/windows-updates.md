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
2. Eine Readiness-Abfrage vor dem Download weist früh auf nicht beendete
   Partien hin. Sie ist ausdrücklich keine spätere Installationsfreigabe.
3. Der Launcher kopiert den installierten Updater in einen eigenen zufälligen
   Versuchspfad unter `runtime/updates/staging`, verifiziert den Hash und hält
   Quell- und Zieldatei bis zum Abschluss der Übergabe gegen Schreiben und
   Ersetzen gesperrt. Danach fordert er die Windows-Freigabe an.
4. Der erhöhte Updater bindet registrierte Pfade, ursprüngliche Launcher-PID,
   Startzeit und Image, hält die äußere `preparing`-Lease und verbindet die
   konkrete Pipe. Erst danach reserviert der Launcher atomar den spielfreien
   Zustand über `PrepareUpdateAsync`. Nichtterminale Partien führen zur
   quittierten Rücknahme und zum Ende dieses Updaterversuchs, ohne den
   laufenden Spielbetrieb zu stoppen.
5. Bei Freigabe stoppt der Launcher seine Runtime strikt und sendet erst
   danach `Proceed`. Der Updater entfernt die Launcher-Ausnahme, wartet auf
   dessen tatsächliches Prozessende und prüft bis zu 45 Sekunden die Abwesenheit
   weiterer Produktprozesse am konkreten Installationsort. Erst dann darf er
   Produktdaten öffnen. Fremde Prozesse werden nicht beendet.
6. `UpdateDataSnapshot` erzeugt und prüft den vollständigen Live-Datenroot-
   Snapshot. Der bestehende Storage-CLI-Befehl `backup-update` sichert nur
   Match-SQLite und ist nicht die Sicherungsautorität dieses Updatewegs.
   Installerarchive und -caches bleiben außerhalb dieses Restores, insbesondere
   auch der MSI-Reparaturcache unter `config/installer`.
7. Der heruntergeladene Setuphost führt unter der explizit weitergereichten
   äußeren Lease ein erhöhtes MSI-Major-Upgrade aus.
   Das vorhandene `runtime.env`, Maintenance-Credentials, Kontopolicy und der
   Datenroot bleiben autoritativ.
8. Der konkret gebundene `NETGRID.exe --headless-verify` startet unter der
   eigenen Prüfausnahme Server und Webclient, prüft beide Healthpfade und
   beendet sie kontrolliert. Erst danach wird der neue
   Setuphost aus dem zur registrierten MSI-Produktkennung gehörenden Cache
   nochmals gegen die erwartete Prüfsumme geprüft und NETGRID neu gestartet.
   Die Cacheeinträge unter `config/updates/<ProductCode>/NETGRID-Setup.exe`
   sind getrennt und unveränderlich; normale Benutzer können sie nicht
   schreiben. MSI besitzt den Registry-Selektor `CurrentProductCode` und
   nimmt ihn bei Transaktionsfehlern zusammen mit den Programmdateien zurück.
   Der alte Cacheeintrag bleibt unabhängig vom Selektor erhalten.

### Noch offene Abnahmen vor der Freigabe

Die Komponentengates ersetzen keine native Produktabnahme. Der aktuelle
Artefakt-/Ergebnisnachweis steht im aktiven
[Windows-Installer-Paketprozess](../architecture/windows/windows-installer-package-process.md).

Belastbar nachgewiesen sind bislang:

- Die vollständige Offline-MSI-Matrix 8207/8208 auf sauberem Windows 11 x64:
  16 Prüfbereiche einschließlich Installation ohne Setupquelle, Custom-Pfaden,
  tatsächlicher Reparaturquelle im geschützten Cache, Upgrade, Downgrade,
  nativer Dateiidentität, Datenerhalt und expliziter Datenlöschung.
  Gesamtabschluss einschließlich Cleanup: 8. September, 08:49:07 UTC.
  Alle 13 MSI-Logs sind auf den Host kopiert und dort erneut hashgeprüft.
- Direkte MSI-Upgrades, Downgrades und physischer Fehlerrollback unter
  Sandbox-SYSTEM mit dem aktuellen Bundlepaar 8209/8210. Alle sechs Phasen
  enden am 8. September um 09:34:22 UTC grün. Programmhashes/-versionen,
  Registrierung, Cache-/Shortcutbindung, Dateninhalte und Berechtigungen
  sind geprüft. Nach Capture veränderte eigene Testdaten wurden zurückgestellt
  und zusätzlich im separaten Fehlerstand erhalten. Konfiguration und zuvor
  frisch eingerichtete Testauthentifizierung bleiben bytegleich. Der
  wiederhergestellte installierte 8209-Stand besteht den Headless-Healthlauf
  mit Exit 0, anschließend sind eigene Runtimeprozesse und Testports frei.
  Dies ist ein Nachweis des direkten MSI-Wegs, nicht des Tray-Updaters.
- MSI-Alleininstallation, vollständige installierte Dateiidentität und
  ProductCode-Reparatur von 8207. Eine weitere Reparatur bei tatsächlich
  entfernten Downloadkopien verwendet nachweislich den geschützten
  Original-MSI-Cache. Der rekonstruierte Setupcache bleibt hash- und
  zeitgleich; normales Löschen und Datenerhalt sind gesonderte Matrixfälle.
- Nichtadministrativer Lauf von 8207 mit verweigertem Schreibzugriff auf
  Programm und Konfiguration, beschreibbarer Runtime und gesundem
  Launcherstart. Die Datenbank bestand zuvor bereits; ihre erstmalige
  Erstellung unter Standardbenutzer bleibt dadurch unbewiesen. Der neue
  native 8209-Lauf schließt genau diese Lücke: Nach MSI-Alleininstallation
  mit vollständiger Dateiidentität ist die SQLite-Datei nachweislich noch
  abwesend. Der erste Launcher-/Healthlauf wird dann unter einem frisch
  angelegten Standardbenutzer ausgeführt; 
  `databaseExistedBefore=false`, Datenbank danach vorhanden, Health und
  ACL-Schreibschutz sind grün. Konfiguration und Setupcache bleiben gleich,
  das temporäre Konto ist entfernt (08:54:55 UTC).
- Nativer Cross-Account-Start des korrigierten `OriginalUserRestart`-Owners
  vor und nach Ende des ursprünglichen Benutzerprozesses, einschließlich
  Kindtokenprüfung vor Resume. Details und Grenzen stehen im
  [Neustartvertrag](#neustart-im-ursprünglichen-benutzerkontext).
- Reguläres Upgrade auf 8212 mit vollständiger Datei-/Cachebindung und
  anschließend tatsächlichem Edge-Betrieb auf Custom-Ports: Standarddecks
  werden geladen, eine Lobby lässt sich anlegen und verbindet sich. Die
  Browseradresse wird jetzt zur Laufzeit aus `NETGRID_SERVER_BASE_URL`
  projiziert statt aus einer eingefrorenen `NEXT_PUBLIC_`-Buildvariable.
  Reine Web-HTML-/Backend-Healthchecks hatten diesen Fehler nicht erkannt.
- Echter direkter MSI-Versionswechsel bei laufendem 8212-Launcher und einer
  über Edge erstellten offenen Lobby: Die installierte Pipe-/Prepare-Strecke
  lehnt mit `installation_gate_active_games` vor Datencapture ab. Dateien,
  Credentials und die drei laufenden Runtimeprozesse bleiben unverändert.
  Das ist ein nativer Nichtterminal-Lobbybeleg, kein Mehrbenutzernachweis.
- Derselbe native Schutz bei regulär geschlossener Runtime: Die persistierte
  offene Lobby verhindert den Versionswechsel über die installierte read-only
  Offlineprüfung, wiederum vor Capture und ohne veränderte Produkt- oder
  Zugangsdaten. Anschließend normaler Benutzerstart, Wiederverbindung im
  Browser und regulärer Lobbyabbruch. Der Abschlusscheck meldet null offene
  Partien und erlaubte Updates (8. September, 10:24:48 UTC).

Offen sind weiterhin der mehrbenutzerübergreifende Schutztest,
vollständiger GUI-/Tray-Updater mit gebundener Pipe, ursprünglichem
Benutzerneustart und anderer UAC-Administratorfreigabe sowie
Absturzreparatur. Keine Releasefreigabe durch Zusammenzählen
engerer oder früherer Komponentenbelege.

Zusätzlicher offener UI-Fund: Wiederöffnen des Setups muss den vorhandenen
Programmordner und die installierten Ports korrekt anzeigen. Der bisherige
Dialog lädt nur den Datenordner und zeigt ansonsten Neuanlage-Defaults; er
darf keine Konfigurationsänderungen suggerieren, die der Datenerhalt ignoriert.

Die Behauptung, ein direktes MSI könne keinen Setupcache herstellen, gilt
nicht mehr: Der installierte Setupstub und der geschützte vollständige
MSI-Cache besitzen inzwischen genau diesen Rekonstruktionspfad.
`config/installer` bleibt außerhalb von Snapshot/Restore; Live-Datenpfade
und benutzerdefinierte Backupordner dürfen diesen Bereich nicht überlappen.
Unpassende alte Snapshotformate werden abgewiesen, nicht konvertiert.

Der frühere HTTP-Stoppfehler ist am `HttpConnectionDrain`-Owner korrigiert:
Vorabverbindungen ohne Anfrage werden geschlossen, bereits angenommene
Antworten dürfen auslaufen, spätere Anfragen erhalten `503 server_stopping`.
Launcher-Timeout und Stoppeigentümerschaft bleiben streng. Der Headless-Pfad
meldet auf stderr ausschließlich begrenzte Phasen-/Ursachen-/Cleanupcodes;
der Updater validiert diese vor Weitergabe. Rohe Ausnahmen oder
Konfigurationsinhalte sind keine Diagnoseausgabe.

GitHub Releases bleibt der einzige Kanal. Die echte Repository-Abfrage vom
8. September liefert aktuell keine Releases; ein reales Releaseasset kann
deshalb noch nicht heruntergeladen und geprüft werden. Fixturetests für
Stable, Prerelease, Offlinebetrieb und Integritätsfehler bleiben davon
getrennt. Die laufenden Tests begründen weder einen Push noch eine
Veröffentlichung.

### Korrespondierende WiX-Quellen vor Weitergabe

Die verwendeten NuGet-Pakete `WixToolset.Dtf.CustomAction` und
`WixToolset.Dtf.WindowsInstaller` 7.0.0 binden in ihren Nuspec-Dateien denselben
Upstreamcommit `b8977d6f88e7b68e000bac226a2814f236770570`. Die bereits
angenommene OSMF-EULA ersetzt nicht die Bereitstellungsbedingungen der
[MS-RL dieses Quellstands](https://github.com/wixtoolset/wix/blob/b8977d6f88e7b68e000bac226a2814f236770570/LICENSE.TXT).

Das vollständige unveränderte Upstreamarchiv wurde am 8. September separat
unter `output/wix-corresponding-source-b8977d6f88e7b68e000bac226a2814f236770570`
bereitgestellt: 12.882.294 Bytes, 6.305 ZIP-Einträge, SHA-256
`7383d9b68f9ad31188566d0e6cb0b0d59b0056e55b8959e736cd83bc38eb548f`.
`source-audit.json` bestätigt die Bindung beider Binärpakete, sichere
Archivpfade, enthaltene SfxCA-/WindowsInstaller-/DUtil-Quellen und die
Übereinstimmung aller nichtleeren Lizenztextzeilen mit den ausgelieferten
Hinweisen. Es wurde weder entpackt noch ausgeführt oder installiert.

Dies ist eine vorbereitete technische Quellenbereitstellung, noch keine
erfolgte Weitergabe oder vollständige Releasefreigabe. Vor Veröffentlichung
muss die Mitbereitstellung des Archivs samt Prüfsumme und Hinweisen im
Release geprüft werden. Das Herstellerquellarchiv bleibt ein separates
Lizenzartefakt außerhalb der installierbaren NETGRID-Payload; NETGRID-
Repositoryquellen und Entwicklungsdaten bleiben ausgeschlossen. Die beiden
bereits gebauten Installerartefakte und ihre Metadaten werden dafür nicht
nachträglich umgeschrieben.

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
Der Launcher muss bei unklarem Vorbereitungsergebnis denselben
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
keine quittierte Rücknahme. Der Client ist im Runtime-Owner integriert und
wird nun über `UpdateTransfer` aus dem Tray-Updatepfad aufgerufen.

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
für sich allein noch nicht zum Backup: Der Aufrufer muss zusätzlich
die updateweite Installersperre und die gebundene Updater-Übergabe halten.

### Gebundene Übergabe- und Stoppreihenfolge

`WaitForParent` und die Annahme, eine fehlende PID autorisiere ein Update,
sind entfernt. `UpdateRequest` verlangt sämtliche Bindungsparameter;
doppelte, unbekannte, unvollständige oder nicht kanonische Identitäten
scheitern vor dem Produktlauf. `UpdateSession` nimmt ausschließlich eine
explizite Übergabe entgegen und hält die äußere Sperre über Backup, MSI,
Prüfung und gegebenenfalls Rollback. `Dispose` gibt eine nach `Proceed`
gehaltene Sperre niemals implizit frei. Nur der nachweislich gesunde
Transaktionspfad darf `Complete` aufrufen.

`UpdateTransfer` prüft nach der Pipeverbindung zusätzlich den kompletten
Registrybezug auf ursprünglichen Launcher und konkreten Updater. Bei
blockierenden Partien verlangt es zuerst die DELETE-Quittierung, dann
Pipe-Cancel, Updater-Ende und den passenden abgeschlossenen Registryrecord.
Die bloße Ausnahme des ursprünglichen Launchers in einer noch aktiven
`preparing`-Lease gilt nicht als erfolgreiche Rücknahme. Ein vor Verbindung
beendeter Worker wird sofort erkannt. Vor-Übergabe-Fehler werden vom
ursprünglichen Launcher angezeigt; der Updater beendet diesen Fehlversuch
ohne blockierenden zweiten Dialog. Seine Diagnose wird nur unter dem zuvor
registrierungsgeprüften Datenroot geschrieben, ohne freie Fehlertexte oder
Zugangsdaten. Fehler beim Schreiben bleiben als Fehler erhalten.

Die gemeinsame Grundlage ist `apps/windows/Common/UpdateHandoff.cs`.
Die lokale Duplex-Pipe
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
`ProceedMayHaveBeenDelivered=true` erhalten. Der bereits terminal gestoppte
Launcher darf dann weder normalen Betrieb noch einen zweiten Updateversuch
freigeben. Er beendet sich; nur der gebundene Updater kann die gehaltene
Transaktion fortsetzen und nach Verifikation abschließen. Ein Fehler gibt
diese Sperre nicht implizit frei. Der Transport allein beweist weder
geordneten Runtime-Stopp noch die updateweite Sperre; beides wird deshalb
vom jeweiligen Runtime- beziehungsweise Transaktionsowner geprüft.

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
Der Updater ruft die Phasen über `UpdateSession` und `UpdateVerifier` im
Produktablauf auf. Launcher und First Run binden weiterhin ausschließlich
den Reader ein.

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

Die Phase `verifying` verwendet denselben atomaren Registrywert.
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
diesem Fall gehalten. Der Transaktionsaufrufer darf nach einem
solchen Fehler weder Rollback noch normalen Betrieb behaupten.

Die Komponentenprüfungen verwenden echte lokale Pipes und ausschließlich
eigene inerte Kindprozesse sowie zufällige HKCU-Testbäume. Sie belegen
Identitätsbindung, Owner-Ende, Rücknahme, Exitcodeauswertung und strikten
Runtime-Stopp, aber keinen installierten Healthlauf. Der tatsächliche
`UpdateTransaction`-/Tray-Pfad ruft diese Komponente jetzt auf. Die native
Abnahme des zusammenhängenden Ablaufs bleibt ein Releaseblocker.

### MSI-Teiltransaktionen und Major-Upgrade

Eine Standalone-MSI-Transaktion besitzt eine eigene zufällige Lease und
bindet ihren ProductCode. Innerhalb eines Updaterlaufs verlangt sie dagegen
die ausdrücklich übergebene `NETGRID_UPDATE_LEASE`, dieselbe aktive
Stopp-Lease sowie den noch lebenden Updater mit passender PID/Startzeit.
Die Eigenschaft wird als `Secure` und `Hidden` geführt. Eine noch aktive
Vorbereitung, eine fremde Sperre oder eine schon laufende MSI-Teiltransaktion
wird nicht übernommen. Teiltransaktionen besitzen jeweils zusätzlich eine
eigene zufällige `msiLease`; verspätete Rollbacks können keinen späteren
MSI-Lauf freigeben. Der Setuphost übergibt die äußere Lease explizit;
der Updater verwendet diesen gebundenen Modus für Upgrade und Downgrade.

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
`InstallFiles < InstallExecute < RemoveExistingProducts < VerifyNetgridLifecycle
< CommitNetgridLifecycle < InstallFinalize`,
die geschützte Weitergabe der äußeren Lease und die Bedingungen beider
Cleanup-Aktionen samt Parameterbereitstellung. Die Registrytests prüfen
separat Standalone-Besitz, verschachtelte Bindung, fremde/verspätete Abschlüsse
und das unveränderte äußere Startverbot nach MSI-Commit oder -Rollback.

Die äußere Commit-Aktion wird erst nach dem Einreihen der verschachtelten
Altversions-Abschlüsse eingetragen. Das entspricht der
[MSI-Aktionsreihenfolge](https://learn.microsoft.com/en-us/windows/win32/msi/action-execution-order)
und berücksichtigt, dass ein Fehler in einer
[Commit-Aktion](https://learn.microsoft.com/en-us/windows/win32/msi/commit-custom-actions)
noch einen Rollback auslösen kann. Die tatsächliche Tabelle des 8201-MSI
enthält `RemoveExistingProducts=6501`, `VerifyNetgridLifecycle=6598`,
`CommitNetgridLifecycle=6599` und `InstallFinalize=6600`.

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

## Neustart im ursprünglichen Benutzerkontext

`UpdateSession` bereitet bei angefordertem Neustart den Kontext vor dem Erwerb
der Installersperre vor. `OriginalUserRestart` verlangt zuerst das bereits
verfügbare Windows-Prozessstartrecht `SeImpersonatePrivilege`; es aktiviert
keine zusätzlichen Rechte und weicht bei Fehlen nicht auf einen anderen
Startpfad aus. Erst dann dupliziert es den Token des schon durch Image, PID
und Startzeit gebundenen ursprünglichen Launchers. Das ist ausschließlich ein
nicht vererbbarer Handle im Arbeitsspeicher, keine gespeicherte Anmeldung und
kein Passwort. Bei Abbruch oder Sessionende werden Token und Environmentblock
freigegeben. Die [Windows-Token-Duplizierung](https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-duplicatetokenex)
erhält dessen vorhandenen Sicherheitskontext; ein Explorerprozess oder das
erhöhte Administratorkonto wird nicht als Ersatzbenutzer ausgewählt.
Der duplizierte Handle erhält exakt `0x018B`: `ASSIGN_PRIMARY`, `DUPLICATE`,
`QUERY`, `ADJUST_DEFAULT` und `ADJUST_SESSIONID`. Die beiden letzten
[Handle-Zugriffsrechte](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-rights-for-access-token-objects)
sind keine Aktivierung von Benutzerprivilegien. Im nativen Windows-11-
Cross-Account-Test scheitern `0x000B`, `0x008B` und `0x010B` mit Fehler 5;
erst `0x018B` ermöglicht den verifizierten Prozessstart. Es gibt weder
`ALL_ACCESS`, eine Änderung von Gruppen/Privilegien noch eine Retry-Maskenfolge
im Produkt. Sitzung, Anmeldevorgang und nicht erhöhter Kontext bleiben vor
und nach der Prozessanlage exakt geprüft.

Der Kontext muss ein nicht erhöhter primärer Token mit mittlerer
Integritätsstufe in derselben interaktiven Windows-Sitzung sein. System- und
Dienstkonten, AppContainer und UIAccess werden abgewiesen. Benutzer-SID und
Anmeldevorgang bleiben neben Sitzung und Rechtestatus exakt gebunden. Diese
Identitäten werden weder in Requests noch Logs gespeichert. Der
[Benutzer-Environmentblock](https://learn.microsoft.com/en-us/windows/win32/api/userenv/nf-userenv-createenvironmentblock)
entsteht ohne Übernahme der Updater-Prozessumgebung und bleibt ebenfalls nur
im Arbeitsspeicher. Das Benutzerprofil stammt vom bereits laufenden Launcher.

Erst nach erfolgreichem Healthcheck und explizitem Abschluss der äußeren Lease
darf `RestartLauncher` genau einmal starten. Der explizite Programmpfad wird
über [CreateProcessWithTokenW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createprocesswithtokenw)
mit Benutzerprofil, eigenem Unicode-Environment und zunächst angehaltenem
Hauptthread ausgeführt. Vor dessen Freigabe wird der tatsächliche Kindtoken
gegen den ursprünglichen Kontext geprüft. Nur bei vollständiger Übereinstimmung
wird der Thread fortgesetzt. Bei fehlgeschlagener Prüfung wird ausschließlich
dieser eigene noch nicht freigegebene Prozess beendet und sein Ende geprüft;
das ist keine erzwungene Abschaltung einer laufenden NETGRID-Runtime. Ein
unbewiesener Abbruch bleibt ein strukturierter Fehler.

Ein gescheiterter Neustart nach gesundem Installationsabschluss erhält den
eigenen Exitcode 4 und einen Hinweis in `de`/`en`/`fr`, NETGRID aus dem Startmenü
zu öffnen. Ein fehlgeschlagenes MSI-Update mit erneut verifizierter alter
Version meldet ebenfalls ausdrücklich diesen Zustand, statt fälschlich eine
gestoppte oder erfolgreich aktualisierte Anwendung zu behaupten.

Die 40 `OriginalUserRestartTests` prüfen x64-Interoplayouts, echte Tokenabfragen, Duplizierung,
nicht vererbbare Handles, ursprüngliches Profil, Ausschluss der
Updater-Prozessumgebung, Fortbestand nach Parent-Ende, einmalige Verwendung
und die native Bereinigung eines eigenen angehaltenen inerten Prozesses.
Eine ausschließlich testseitige, lesende `NtQueryObject`-Abfrage verlangt
außerdem die tatsächlich gewährte Handle-Maske exakt, nicht bloß eine
Quelltextkonstante. Der neue Check wurde vor dem Fix rot und danach grün geprüft.
Der unelevierte Hostlauf besitzt kein `SeImpersonatePrivilege`: Er belegt
Fehler 1314 und die Ablehnung vor Lease-Erwerb, **nicht** den erfolgreichen
erhöhten Benutzerstart. Ein separater Sandbox-Test vom 8. September belegt
inzwischen den unverändert eingebundenen korrigierten Capture-/Startpfad:
anderes Administratorkonto, echter normaler Testbenutzer, Start vor und nach
Parent-Ende, identischer Kindtoken vor Resume, ursprüngliche Profilumgebung
ohne Admin-Sentinel und einmalige Kontextverwendung. Der inerte `where.exe`-
Aufruf ohne Argumente endet wie der Kontrollaufruf mit Exit 2; das ist hier
erwartet und kein Installationsfehler. Das Testkonto wurde entfernt.
Dies ist ein nativer Komponentenbeleg, keine UAC-Bedienung und kein voller
Tray-Updater-Lauf. Die andere Administratorkonto-Freigabe über UAC sowie
anschließend normal privilegierte Launcher-/Runtimeprozesse im vollständigen
Produktablauf bleiben Teil der nativen Abnahme.

## Fehlschlag und Rollback

Scheitert Windows Installer, greift zunächst seine Transaktionsrücknahme; der
Updater startet nur einen weiterhin verifizierbaren alten Stand. Scheitert der
nachgelagerte Healthcheck, installiert der vor dem Update gecachte Setuphost
den vorherigen Stand als ausdrücklich erlaubtes MSI-Downgrade unter derselben
äußeren Lease. Das Entfernen der neuen Version bleibt Teil dieser einen
MSI-Transaktion; eine vorgeschaltete Deinstallation würde die noch benötigte
registrierte Installationsidentität entfernen. Danach stellt der Updater das
unmittelbar zuvor erzeugte Backup über die bestehende Storage-Restore-Autorität
wieder her und verlangt erneut den gebundenen Healthcheck.

Der bisherige `test-windows-updater-rollback-sandbox.ps1`-Lauf mit synthetischer
Parent-PID belegt ausschließlich die früher getesteten Builds. Sein ungebundener
`--apply`-Aufruf wird vom aktuellen Updater abgewiesen. Der Harness prüft jetzt
vor MSI- oder Benutzeranlage den auditierten Übergabevertrag und lehnt den
neuen gebundenen Modus ausdrücklich ab. Er muss für die neue
native Abnahme durch einen produktgebundenen Launcher-/Pipe-Lauf ersetzt
werden; alte Testergebnisse oder ein direkter Entwickleraufruf sind kein
Nachweis des neuen Übergabevertrags.

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
