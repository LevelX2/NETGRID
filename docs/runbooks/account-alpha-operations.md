# Account-Alpha betreiben

Stand: 2026-07-18

## Voraussetzungen

- Der Multiplayer-Server wird regulär über `scripts/start-netgrid.ps1`
  gestartet.
- Account- und Matchdaten verwenden standardmäßig dieselbe SQLite-Datei aus
  `NETGRID_SQLITE_STORAGE_PATH`. Optional kann
  `NETGRID_ACCOUNT_SQLITE_PATH` eine eigene Account-Datenbank benennen.
- Im Profil `private_internet` gelten die vorhandenen HTTPS-, Origin- und
  Token-Salt-Gates. Account-Cookies sind dort immer `Secure`.

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

- Keine öffentliche Registrierung und keine E-Mail-Erhebung in dieser Stufe.
- Browser erhalten den Session-Rohwert ausschließlich als `HttpOnly`-Cookie.
- Login-, Invite- und Resetmutationen verlangen eine erlaubte Origin;
  eingeloggte Mutationen zusätzlich `X-NETGRID-CSRF`.
- Passwortwechsel und Reset erhöhen die Credential-Version und widerrufen alle
  Account-Sessions.
- Account-Cookies autorisieren keine Matchaktion. Match-Join-, Session- und
  Reconnect-Capabilities bleiben eigenständige Rohwerte.

## Backup und Wiederherstellung

Vor einer SQLite-Schemamigration erzeugt die autoritative Storage-Kette ein
Backup im konfigurierten Backupverzeichnis. Für manuelle Sicherung und Restore
gelten dieselben konsistenten SQLite-Regeln wie im Storage-Runbook; die Tabellen
`accounts`, `account_password_credentials`, `account_sessions`,
`account_invites` und `account_reset_tokens` müssen gemeinsam gesichert werden.

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
