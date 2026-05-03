# Card Import 0.5 Acceptance Tests

Status: implemented and covered  
Stand: 2026-05-03

## Artifact Tests

- T-V05-DATA-001: V0.5 JSON-Artefakte parsen.
- T-V05-DATA-002: Snapshot-Hash ist stabil und entspricht `card-snapshot-0.5.hash`.
- T-V05-DATA-003: Source Registry und Import-Report verbieten offizielle Assets und externe Runtime-Fetches.

## Status Tests

- T-V05-STATUS-001: Jede Katalogkarte hat alle Statusfelder.
- T-V05-STATUS-002: `deck_legal` setzt `playable` voraus.
- T-V05-SAFETY-001: `catalog_preview_operation_001` und `catalog_preview_resource_001` bleiben nicht spielbar und nicht decklegal.

## API Tests

- T-V05-API-001: `GET /api/cards/catalog` liefert keine Match-, Token-, FullState-, `cardInstances`- oder `privatePayload`-Daten.
- T-V05-API-002: `GET /api/cards/catalog/:id` liefert Detaildaten und safe errors ohne Stacktrace oder lokale Pfade.
- T-V05-API-003: Katalog-Endpunkte sind read-only.

## UI Smokes

- T-V05-UI-001: Katalogseite öffnet.
- T-V05-UI-002: Suche findet `Simple Run Event`.
- T-V05-UI-003: Filter `playable`, `deck_legal` und `blocked` funktionieren.
- T-V05-UI-004: Detailansicht zeigt `catalog_preview_operation_001` als nicht spielbar.

## Regression

- T-V05-REG-001: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.
- T-V05-REG-002: Bestehende Engine-, AI-, Multiplayer-, Visibility- und Replay/StateHash-Tests bleiben grün.

## Implementierungszuordnung

- Pakettests: `packages/catalog/src/index.test.ts`.
- Artefakt- und Hash-Tests: `tests/specs/phase1-artifacts.test.ts`.
- API-/Visibility-Vertrag: `tests/specs/visibility-contract.test.ts`.
- Browser-Smoke: Katalogsuche und blocked-Karte auf `http://127.0.0.1:3000`.
