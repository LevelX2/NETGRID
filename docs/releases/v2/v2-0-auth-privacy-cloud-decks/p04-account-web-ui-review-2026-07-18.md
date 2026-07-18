# P04-Review – Account-Weboberfläche

Stand: 2026-07-18

Ergebnis: abgeschlossen

## Umgesetzt

- Der Startbildschirm hat einen eigenständigen Bereich `Account`/`Profil`.
- Ohne Account bleibt der bestehende lokale Gastmodus unverändert nutzbar.
- Login, Sessionwiederherstellung, Einladungseinlösung, Logout, Abmeldung aller
  Geräte und Passwortänderung sind vollständig angebunden.
- Admins können in der Profiloberfläche einmalige Einladungs- und Resetlinks
  erzeugen. Resetlinks können auf demselben Startbildschirm eingelöst werden.
- Der Account-Anzeigename wird als Match-Anzeigename übernommen. Dabei wird
  ausschließlich der Anzeigename lokal gespeichert.
- Der Account-Session-Rohwert bleibt im `HttpOnly`-Cookie. Der CSRF-Rohwert
  lebt ausschließlich im React-Hook und wird beim Session-Restore rotiert.
- Der Account-Client verwendet immer `credentials: include`; er schreibt
  weder Account- noch CSRF-Tokens in Browser-Storage.
- Der bereits vorhandene Action-Type-Drift `rez_ice`/`rez_card`, der den
  Web-Typecheck und einen Multiplayer-Test blockierte, wurde an den aktuellen
  Enginevertrag angeglichen. Die UI behandelt sowohl ICE-Rez als auch
  allgemeines Karten-Rezzen kontextuell.

## Nachweise

- `corepack pnpm --filter @netgrid/web typecheck`: grün.
- `corepack pnpm --filter @netgrid/web exec vitest run features/account/account-client.test.ts app/action-board-ui.test.ts`: 2 Dateien, 116 Tests grün.
- `corepack pnpm --filter @netgrid/web build`: grün; 14 Seiten erzeugt.
- `corepack pnpm --filter @netgrid/server typecheck`: grün.
- Gezielte Account-, Session- und Root-Rez-Regression: 3 Dateien, 6 Tests
  grün, 124 nicht ausgewählte Tests.
- Quellscan des Accountfeatures: kein Zugriff auf `localStorage` oder
  `sessionStorage`, kein JavaScript-Feld für den Account-Session-Rohwert.
- `git diff --check`: grün.

## Done-Gate

Erfüllt. Account- und Gastflow sind benutzbar, Sessionwiederherstellung rotiert
CSRF, und kein Account-Session-Rohwert liegt in Browser-Storage oder
JavaScript-Payloads.
