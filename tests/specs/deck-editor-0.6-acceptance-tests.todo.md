# Deck Editor 0.6 Acceptance Tests

Status: requirements frozen, implementation pending  
Stand: 2026-05-03

## Artifact Tests

- T-V06-MODEL-001: V0.6 Deckprofile, Templates, Snapshots und Manifest parsen.
- T-V06-SNAPSHOT-001: Deck-Snapshot-Hashes sind deterministisch.
- T-V06-VALID-001: Versionierte Demo-Snapshots sind valide.
- T-V06-VIS-001: Öffentliche Deckmetadaten enthalten keine vollständigen Kartenlisten.

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

## Import/Export Tests

- JSON-Export lässt sich wieder importieren.
- Export/Import erhält Deckhash bei unverändertem Inhalt.
- ungültiges JSON wird ohne Stacktrace oder lokalen Pfad abgelehnt.
- Deckname kann keine Pfadmanipulation auslösen.

## Match Setup Tests

- Human-vs-Human startet mit validierten Snapshots.
- Human-vs-KI startet mit gewählten validierten Snapshots.
- KI-vs-KI startet mit gewählten validierten Snapshots.
- Ungültige Decks blockieren Matchstart mit safe error.

## Visibility Tests

- Bootstrap leakt keine vollständige gegnerische Deckliste.
- WebSocket-Payloads enthalten nur erlaubte Deckmetadaten.
- Reconnect-Payloads enthalten keine gegnerische private Kartenliste.
- Logs und Errors enthalten keine Tokens und keine FullState-Ausgabe.

## Regression

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
