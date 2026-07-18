# P02-Review – Account- und Passwort-Service

Stand: 2026-07-18

Ergebnis: abgeschlossen

## Umgesetzt

- Das gemeinsame SQLite-Schema ist auf Version 2 angehoben und enthält
  Accounts, Passwort-Credentials, widerrufbare Account-Sessions sowie die
  vorbereiteten Invite-, Reset- und Account-Deck-Tabellen.
- Schema 1 wird vor der Migration gesichert. Bestehende Accounttabellen
  erhalten normalisierte Anmeldenamen, Credential-Version und die neuen
  Sessionfelder; alte Sessions werden technisch ungültig.
- Anmeldenamen werden normalisiert und eindeutig gespeichert. Accounts haben
  Status, Rolle und eine serverseitige Credential-Version.
- Passwörter werden mit versioniertem `scrypt`, individuellem Salt,
  Mindestlänge, Blockliste und kontextbezogener Prüfung verarbeitet.
- Unbekannter Account und falsches Passwort liefern denselben öffentlichen
  Fehler und durchlaufen beide eine speicherharte Verifikation.
- Account-Sessions verwenden getrennte hochentropische Session- und
  CSRF-Rohwerte. Persistiert werden ausschließlich HMAC-Hashes.
- Ablauf, Einzelwiderruf, Widerruf aller Sessions und die Invalidierung über
  die Credential-Version sind implementiert.
- Self-Views enthalten weder Passwortdaten noch Token-Hashes.

## Nachweise

- `corepack pnpm --filter @netgrid/server typecheck`: grün.
- `corepack pnpm --filter @netgrid/server exec vitest run src/account-session.test.ts src/account-password.test.ts src/storage-account-schema.test.ts`: 3 Dateien, 7 Tests grün.
- Der breite Lauf einschließlich `src/multiplayer.test.ts` hatte 131 von 132
  Tests grün. Der verbleibende Test erwartet fachfremd noch den bereits
  abgelösten Action-Typ `rez_ice`, während die Engine `rez_card` liefert. Das
  Auth-/Storage-Paket verändert diesen Pfad nicht; der Fund bleibt außerhalb
  von P02 und wird im Releaseabschluss erneut gegen den aktuellen Main-Stand
  bewertet.
- `git diff --check`: grün.

## Done-Gate

Erfüllt. Klartextpasswörter, Session-Rohwerte und CSRF-Rohwerte werden nicht
persistiert oder über Self-Views ausgegeben. Ablauf und Revocation sind durch
Tests nachgewiesen. Die HTTP-Cookie-, Origin- und Rate-Limit-Anbindung folgt
separat in P03.
