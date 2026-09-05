# Account-Alpha betreiben

Stand: 2026-09-04

## Voraussetzungen

- Der Multiplayer-Server wird regulär über `scripts/start-netgrid.ps1`
  gestartet.
- Account- und Matchdaten verwenden standardmäßig dieselbe SQLite-Datei aus
  `NETGRID_SQLITE_STORAGE_PATH`. Optional kann
  `NETGRID_ACCOUNT_SQLITE_PATH` eine eigene Account-Datenbank benennen.
  Relative Pfade beider Variablen sowie des Backupverzeichnisses werden
  einheitlich vom Repository-Root aus aufgelöst.
- Im Profil `private_internet` gelten die vorhandenen HTTPS-, Origin- und
  Token-Salt-Gates. Account-Cookies sind dort immer `Secure`.
- Web und Account-API müssen im Browser same-site erreichbar sein. Beim
  lokalen Start wird deshalb die vom Startskript ausgegebene gemeinsame
  LAN- oder Loopback-Hostvariante verwendet; im Internet übernimmt ein
  HTTPS-Reverse-Proxy die beiden Pfade unter der freigegebenen Origin.

## Zugangsmodi

Die Accountdaten besitzen genau eine Autorität und eine persistente
Zugangsrichtlinie. `NETGRID_ACCOUNT_ACCESS_MODE` setzt nur den Ausgangswert,
solange noch keine persistierte Auswahl existiert:

- `invite_only` ist der unveränderte Standard des Entwicklungsbetriebs und
  erhält den bestehenden Admin-, Einladungs- und Resetablauf.
- `simple` ist der empfohlene lokale Produktmodus. Jeder erreichbare lokale
  Nutzer darf ein Profil mit Anzeigenamen anlegen oder auswählen; NETGRID
  merkt das aktive Profil über eine nicht erratbare HttpOnly-Sitzung je
  Browser. Ein Spielerpasswort existiert in diesem Modus nicht.
- `protected` erlaubt ebenfalls die direkte Profilanlage, verlangt aber
  Anmeldename und mindestens 15 Zeichen langes Passwort.

Selbstregistrierung und Profilwahl sind in den installierten Produktprofilen
`local` und `private_lan` verfügbar. `private_internet` bleibt unabhängig vom
konfigurierten Zugangsmodus geschlossen. Ein Wechsel zwischen `simple` und
`protected` erfolgt nur über eine direkte Loopback-Verbindung unter
`/maintenance/accounts`, verlangt eine frische
Maintenance-Passwortbestätigung und beendet alle Spielersitzungen. Beim
Wechsel nach `protected` muss jedes aktive Profil ein Passwort erhalten.
Vergessene Spielerpasswörter werden dort zurückgesetzt; Profil, Decks und
Spielhistorie bleiben erhalten.

Der empfohlene Installerweg setzt `simple` als Ausgangswert; der
benutzerdefinierte Weg darf `protected` wählen. Das normale Startskript setzt
die Variable nicht und bleibt dadurch bei `invite_only`.

## Ersten Admin lokal anlegen

Der Bootstrap funktioniert ausschließlich, solange noch kein Account
existiert. Das Passwort wird nicht als Kommandozeilenargument übergeben:

```powershell
$env:NETGRID_ACCOUNT_BOOTSTRAP_PASSWORD = '<lange einmalige Passphrase>'
corepack pnpm account:auth -- bootstrap admin "NETGRID Admin"
Remove-Item Env:NETGRID_ACCOUNT_BOOTSTRAP_PASSWORD
```

Die ausgegebene Session wird nicht benötigt; anschließend erfolgt die normale
Browseranmeldung. Ein erneuter Bootstrap wird serverseitig abgewiesen.

## Einladungen und Resets

Administratoren erzeugen Einladungen und Resetlinks über die Accountoberfläche
beziehungsweise die geschützten Admin-Endpunkte. Für eine lokale
Betreiberoperation stehen zusätzlich zur Verfügung:

```powershell
corepack pnpm account:auth -- invite runner1 "Runner Eins"
corepack pnpm account:auth -- reset runner1
```

Der jeweilige Rohwert wird genau einmal auf der Konsole ausgegeben. In SQLite
liegt nur sein HMAC-Hash. Ein Invite ist standardmäßig 72 Stunden, ein Reset
2 Stunden gültig und kann atomar nur einmal beansprucht werden.

## Sicherheitsverhalten

- Keine Registrierung im Deploymentprofil `private_internet` und keine
  E-Mail-Erhebung in dieser Stufe.
- Browser erhalten den Session-Rohwert ausschließlich als `HttpOnly`-Cookie.
- Login-, Invite- und Resetmutationen verlangen eine erlaubte Origin;
  eingeloggte Mutationen zusätzlich `X-NETGRID-CSRF`.
- Der CSRF-Nachweis ist per HMAC an die jeweilige Account-Session gebunden.
  `GET /api/account/session` liefert für dieselbe gültige Session stabil
  denselben Nachweis; Reloads und mehrere Tabs dürfen sich deshalb nicht
  gegenseitig invalidieren. Eine neue Anmeldung beziehungsweise Session
  erzeugt weiterhin einen neuen Nachweis.
- Passwortwechsel und Reset erhöhen die Credential-Version und widerrufen alle
  Account-Sessions.
- Account-Cookies autorisieren keine Matchaktion. Match-Join-, Session- und
  Reconnect-Capabilities bleiben eigenständige Rohwerte.

## Backup und Wiederherstellung

Vor einer SQLite-Schemamigration erzeugt die autoritative Storage-Kette ein
Backup im konfigurierten Backupverzeichnis. Für manuelle Sicherung und Restore
gelten dieselben konsistenten SQLite-Regeln wie im Storage-Runbook; die Tabellen
`accounts`, `account_password_credentials`, `account_sessions`,
`account_invites`, `account_reset_tokens`, `account_decks`,
`account_match_participants`, `account_game_results` und
`account_series_results` müssen gemeinsam gesichert werden.

```powershell
corepack pnpm storage:inspect
corepack pnpm storage:backup
corepack pnpm storage:restore -- <Backupverzeichnis>
corepack pnpm storage:inspect
```

Nach einem Restore müssen `integrity_check` und `foreign_key_check` grün sein.
Ein Restore einzelner Accounttabellen ist kein unterstützter Betriebspfad.

Restore ist ausschließlich bei gestopptem Server und geschlossenen SQLite-
Verbindungen zulässig. Das zu ersetzende Ziel muss dabei nicht mehr als SQLite
lesbar sein: Datenbank sowie vorhandene `-wal`, `-shm` und `-journal` werden
zuerst bytegetreu und per SHA-256 nach
`<Backupverzeichnis>/pre-restore-snapshots/<ID>/` gesichert. `snapshot.json`
kennzeichnet diese Dateien ausdrücklich als ungeprüften Altbestand, nicht als
validiertes Backup. Die CLI nennt den Pfad als `preRestoreSnapshotDir`.
Erst nach Prüfung des ausgewählten Backups und der vorbereiteten Zieldatei
werden die gesicherten alten Sidecars entfernt und die Datenbank ersetzt.
Wurde der Altbestand währenddessen verändert, bricht Restore sichtbar ab.
Diese Offline-Voraussetzung gilt auch für den Windows-Updater.

Die Statistikmigration hebt SQLite auf Schema 3 an und erzeugt davor ein
Pre-Migration-Backup. Der Restore-Probelauf muss zusätzlich bestätigen, dass
Bindungs- und Ergebnisledger auf dem Sicherungsstand wiederhergestellt werden.

## Private Matchstatistik

- Nur eine gültige Account-Session bindet einen Matchslot an einen Account.
  Account-ID und Anmeldename bleiben außerhalb von Matchrecord, Engine,
  PlayerView, Replay, StateHash und KI-Input.
- `GET /api/account/statistics` liefert ausschließlich die Aggregate des
  angemeldeten Accounts. `GET /api/account/match-history` liefert dessen
  cursorpaginierte, redigierte Historie. Beide Antworten sind `no-store` und
  besitzen einen eigenen Read-Rate-Limit-Bucket.
- Die Statistik beginnt am in der API ausgewiesenen `statisticsSince`.
  Historische Spiele werden nicht über Anzeigenamen nachträglich zugeordnet.
- Spiel- und Serienzeilen sind idempotent. Beim Serverstart gleicht ein
  Reconciliation-Lauf noch vorhandene terminale Matches mit dem Ledger ab.
- Self-Play desselben Accounts wird gespeichert und gekennzeichnet, aber nicht
  in Siege, Niederlagen oder Winrate eingerechnet. KI-gegen-KI zählt nicht.
- Match-Retention darf Rohmatches löschen, ohne die schmalen persönlichen
  Ergebnisledger zu entfernen.
- Account-Export-Schema 2 enthält eigene Bindungs-, Spiel- und Serienfakten
  sowie die private Zusammenfassung. Accountlöschung entfernt alle
  persönlichen Statistikzeilen; anonyme Ergebniszeilen anderer Accounts
  enthalten keine Gegner-Account-ID und bleiben unverändert.

Für die Betriebsprüfung müssen `storage:inspect` beziehungsweise die
Maintenance-Ansicht die drei Statistiktabellen nur als redigierte Zeilen- und
Größenwerte ausweisen. Vollständige Statistikantworten gehören nicht in Logs.

## Persönliche Decks

- Das Standardlimit beträgt 50 aktive persönliche Decks. Eine abweichende
  private Testquote kann über `NETGRID_ACCOUNT_DECK_LIMIT` gesetzt werden.
- Anlegen und Standardkopie zählen die Quote in einer `BEGIN IMMEDIATE`-
  Transaktion; das 51. Deck wird ohne Teilschreibvorgang abgewiesen.
- Persönliche Decks dürfen als ungültiger Entwurf gespeichert werden. Erst der
  Snapshot-Endpunkt validiert erneut und übergibt ausschließlich einen
  gültigen immutable Snapshot an den Matchstart.
- Account-Export enthält redigierte Account-/Sessiondaten und persönliche
  Deckentwürfe. Accountlöschung entfernt Credentials, Sitzungen, Invite-/Reset-
  Daten und persönliche Decks, verändert aber keine bereits in Matches
  eingebetteten Snapshots.

## Bedienvertrag im Deckeditor

- `Standard-Decks` werden vom Server geliefert, sind unveränderlich und
  können direkt am Matchstart verwendet werden.
- Ein konkret ausgewähltes Standard-Deck kann vom Matchstart direkt im
  Decktisch geöffnet werden. Die Vorschau schützt Deckzusammensetzung und
  Speicheraktion, erlaubt aber eine temporäre Kartenanordnung auf dem Tisch.
- `Als eigenes Deck kopieren` legt eine unabhängige persönliche Kopie an und
  verbraucht einen Quotenplatz. Aus der Decktisch-Vorschau wird die aktuelle
  Tischanordnung übernommen und anschließend die bearbeitbare Kopie geöffnet;
  Verlassen ohne Kopie verwirft die temporäre Anordnung.
- `Meine Decks` liegen ausschließlich im Accountstorage. Anlegen, Import,
  Duplizieren und Standardkopie werden bei ausgeschöpfter Quote abgewiesen.
- Speichern verwendet die geladene Deckversion. Nach einem Versionskonflikt
  wird nicht blind überschrieben; der aktuelle Serverstand muss neu geladen
  werden.
- Ein ungültiger Draft bleibt editierbar. `Prüfen` beziehungsweise die
  Matchauswahl erzeugt erst nach erneuter Servervalidierung einen immutable
  Snapshot.
- Ohne Anmeldung bleibt NETGRID im lokalen Gastmodus. Die eingefrorenen
  Projekt-, KI- und Testquelldecks sind dort unsichtbar; neu angelegte eigene
  Gastdecks bleiben lokale Datei-Decks und werden nicht automatisch in ein
  späteres Konto importiert.
- Im Profilkopf steht die normale Aktion `Abmelden`; `Alle Geräte abmelden`
  bleibt als getrennte stärkere Aktion im Profil. Scheitert der Serveraufruf,
  darf der Client nicht nur lokal in den Gastzustand wechseln, sondern zeigt
  den Fehler bei weiterhin angemeldeter Sitzung an.

## Anzeigename und Matchidentität

- Angemeldete Spieler verwenden beim Erstellen und Beitreten immer den im
  Account hinterlegten Anzeigenamen. Das Feld ist in der Startoberfläche
  schreibgeschützt; der Server ignoriert zusätzlich abweichende Namen in
  manipulierten Matchrequests.
- Gäste können weiterhin pro Browserprofil einen freien Gastnamen setzen.
- Matches speichern ausschließlich die öffentliche Kategorie `account` oder
  `guest` je Teilnehmer. Account-ID, Anmeldename, Credential- oder
  Sessiondaten werden weder in GameState und Replay noch in die öffentliche
  Ergebnisliste übernommen.
- „Letzte Spiele“ kennzeichnet Teilnehmer als `Account`, `Gast` oder `KI`.
  Historische Matches ohne Identitätskategorie werden als Gast behandelt.

## Noch nicht enthalten

Diese Alpha versendet keine E-Mails und besitzt weder E-Mail-Verifikation noch
Self-Service-Recovery, Passkeys oder Zwei-Faktor-Authentisierung. Ein
verlorenes Spielerpasswort wird lokal durch Maintenance zurückgesetzt. Eine
Selbstregistrierung außerhalb des lokalen Deploymentprofils darf erst in
einer späteren, separat gegateten Stufe aktiviert werden.
