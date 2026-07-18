# P05-Review – Persönliche Decks und Standards im Server

Stand: 2026-07-18

Ergebnis: abgeschlossen

## Umgesetzt

- Der Server lädt ausschließlich die 40 als `standard` kuratierten Decks in
  den öffentlichen Standardkatalog. `internal_ai`, `test_fixture` und
  `retire` werden nicht ausgeliefert.
- Alle Standarddecks werden bei Snapshotanforderung erneut gegen den
  versionierten Kartenpool und das Formatprofil validiert. Ihre Snapshots sind
  deterministisch, immutable und direkt mit dem bestehenden Matchstartvertrag
  kompatibel.
- Persönliche Decks liegen owner-gebunden in `account_decks`. CRUD,
  Standardkopie, Import über denselben Create-Vertrag, Soft-Delete und
  Optimistic Locking sind umgesetzt.
- Das Defaultlimit beträgt 50. Anlage und Standardkopie zählen und schreiben
  in einer SQLite-`BEGIN IMMEDIATE`-Transaktion; konkurrierende Überschreitung
  ist ausgeschlossen.
- Ungültige Entwürfe dürfen gespeichert werden. Der Match-Snapshot-Endpunkt
  validiert neu und verweigert ungültige Decks.
- Account A erhält für IDs von Account B dieselbe 404-Sicht wie für nicht
  vorhandene Decks. Owner-Account-IDs werden aus HTTP-Deckantworten entfernt.
- Accountexport umfasst redigierte Account-/Sessiondaten und persönliche
  Decks. Accountlöschung entfernt Credentials, Sessions, Einmal-Tokens und
  persönliche Decks, ohne Match-Snapshots zu verändern.
- CORS erlaubt nun die für CRUD benötigten Methoden `PUT` und `DELETE`, weiter
  ausschließlich für explizit erlaubte Origins und mit Credentials.

## Nachweise

- `corepack pnpm --filter @netgrid/server typecheck`: grün.
- `corepack pnpm --filter @netgrid/server exec vitest run src/account-session.test.ts src/account-password.test.ts src/account-decks.test.ts src/account-decks-http.test.ts src/account-http-auth.test.ts`: 5 Dateien, 14 Tests grün.
- Die Service-Suite prüft alle 40 Standards, deterministische valide
  Snapshots, Owner-Isolation, 50/51-äquivalente Quote, Parallelanlage,
  Versionskonflikt, Soft-Delete und ungültige Entwürfe.
- Die HTTP-Suite prüft Katalogredaktion, CSRF, Owner-404, Quote, PUT/DELETE,
  Export/Löschung und die direkte Annahme eines Standard-Snapshots durch den
  Matchstart.
- `multiplayer-payload`, `spectator-projection`, `observability-redaction` und
  `deck-setup`: 4 Dateien, 15 Privacy-/Snapshot-Regressionen grün.
- `git diff --check`: grün.

## Done-Gate

Erfüllt. Persönliche Decks sind owner-only, die Quote ist atomar und
Match-Snapshots sind nach Erstellung von Draftänderung oder Accountlöschung
unabhängig. Öffentliche Antworten enthalten keine internen Deckklassen oder
fremden Ownerdaten.
