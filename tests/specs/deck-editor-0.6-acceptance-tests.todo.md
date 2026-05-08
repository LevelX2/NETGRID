# Deck Editor 0.6 Acceptance Tests

Status: implemented and final-gate covered
Stand: 2026-05-03

## Artifact Tests

- T-V06-MODEL-001: V0.6 Deckprofile, Templates, Snapshots und Manifest parsen. Covered by `tests/specs/phase1-artifacts.test.ts`.
- T-V06-SNAPSHOT-001: Deck-Snapshot-Hashes sind deterministisch. Covered by `@netgrid/decks` tests and `tests/specs/phase1-artifacts.test.ts`.
- T-V06-VALID-001: Versionierte Demo-Snapshots sind valide. Covered by `@netgrid/decks` tests.
- T-V06-VIS-001: Öffentliche Deckmetadaten enthalten keine vollständigen Kartenlisten. Covered by server and visibility tests.

## Validation Tests

- falsche Side wird abgelehnt,
- fehlende Identity wird abgelehnt,
- Identity falscher Side wird abgelehnt,
- unbekannte Karte wird abgelehnt,
- import-only Karte wird für spielbaren Matchstart abgelehnt,
- nicht `deck_legal` Karte wird abgelehnt,
- ungültige Menge wird abgelehnt,
- Corp-Deck ohne genug Agenda Points wird abgelehnt,
- Mengenlimit wird geprüft.

Coverage: `packages/decks/src/index.test.ts`, `apps/server/src/multiplayer.test.ts`.

## Import/Export Tests

- JSON-Export lässt sich wieder importieren.
- Export/Import erhält Deckhash bei unverändertem Inhalt.
- ungültiges JSON wird ohne Stacktrace oder lokalen Pfad abgelehnt.
- Deckname kann keine Pfadmanipulation auslösen.

Coverage: `packages/decks/src/index.test.ts` and Web Deck API validation route smoke in final hardening.

## Match Setup Tests

- Human-vs-Human startet mit validierten Snapshots.
- Human-vs-KI startet mit gewählten validierten Snapshots.
- KI-vs-KI startet mit gewählten validierten Snapshots.
- Ungültige Decks blockieren Matchstart mit safe error.

Coverage: `apps/server/src/multiplayer.test.ts`.

## Visibility Tests

- Bootstrap leakt keine vollständige gegnerische Deckliste.
- WebSocket-Payloads enthalten nur erlaubte Deckmetadaten.
- Reconnect-Payloads enthalten keine gegnerische private Kartenliste.
- Logs und Errors enthalten keine Tokens und keine FullState-Ausgabe.

Coverage: `tests/specs/visibility-contract.test.ts`, `apps/server/src/multiplayer.test.ts`.

## Regression

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
