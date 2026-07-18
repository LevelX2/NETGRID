# P01 Review – Vertrag, Schema und Deckkuratierung

Stand: 2026-07-18

Status: abgeschlossen

## Ergebnis

Der Passwort-first-Schnitt für die geschlossene Alpha ist eingefroren. Der
Account-, Session-, Invite-/Reset-, persönliche Deck- und Standarddeck-Vertrag
ist ausführbar spezifiziert. Die gemeinsame SQLite-Datei erhält mit Schema 2
eine atomare Migration sowie eine gemeinsame Backup-/Restore-Verantwortung.

Die lokale Datei-Deckbibliothek wurde ohne lokale Pfade oder Accountdaten in
einen versionierten Standardkatalog überführt:

- 40 kuratierte Standard-Decks;
- 2 explizite KI-Diagnosedecks bleiben intern;
- 10 Labor-/Releasefixtures bleiben Testartefakte;
- 1 unfertiger Platzhalter wird nicht übernommen;
- 21 bisherige Projekt-Snapshots bleiben unverändert als KI-/Testartefakte und
  werden nicht als allgemeine Standards veröffentlicht.

## Artefakte

- `password-accounts-cloud-decks-requirements.md`
- `password-account-auth-contract.md`
- `account-deck-storage-schema.md`
- `account-and-deck-api-spec.md`
- `password-accounts-cloud-decks-test-matrix.md`
- `standard-deck-curation-review-2026-07-18.md`
- `data/decks/standard-deck-catalog-1.0.0.json`
- `data/decks/standard-deck-curation-2026-07-18.json`

## Verifikation

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm --filter @netgrid/decks exec vitest run src/index.test.ts`
  – 1 Datei, 19 Tests grün.
- `corepack pnpm --filter @netgrid/decks typecheck`
- lokaler Pfadscan über beide Standarddeck-Artefakte – keine Treffer.
- `git diff --check`

## Done-Gate

Credential-, Cookie-, SQLite-, Deckquote-, Owner-, Standarddeck- und
Match-Snapshot-Grenzen sind festgelegt. P02 kann ohne weitere Schema- oder
Produktentscheidung beginnen.
