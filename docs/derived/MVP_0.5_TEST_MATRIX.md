# MVP 0.5 Test Matrix

Status: frozen_for_implementation  
Stand: 2026-05-03

| ID | Bereich | Erwartung | Requirement |
|---|---|---|---|
| T-V05-DOC-001 | Requirements | Alle V05-MUST-Anforderungen sind in Requirements, Spezifikationen und Testmatrix abgedeckt. | V05-MUST-001 |
| T-V05-DATA-001 | JSON-Artefakte | V0.5 Source Registry, Snapshot, Import-Report, Catalog Index und Statusmanifest parsen. | V05-MUST-002, V05-MUST-010 |
| T-V05-DATA-002 | Snapshot-Hash | `card-snapshot-0.5.hash` entspricht dem kanonischen Snapshot-Hash. | V05-MUST-003 |
| T-V05-DATA-003 | Quellen/Assets | Source Registry und Import-Report verbieten offizielle Assets und externe Runtime-Fetches. | V05-MUST-010 |
| T-V05-STATUS-001 | Statusmodell | Alle Katalogkarten haben getrennte Statusfelder; `deck_legal` setzt `playable` voraus. | V05-MUST-004 |
| T-V05-STATUS-002 | Manifest-Abgleich | Implementierte und spielbare Karten referenzieren Engine-/Manifestdaten; import-only Karten bleiben nicht spielbar. | V05-MUST-005, V05-MUST-008 |
| T-V05-API-001 | Katalog-API | Katalog-Endpunkte sind read-only und leaken keine Match-, Token-, FullState- oder Hidden-Info-Daten. | V05-MUST-006 |
| T-V05-UI-001 | Katalog-UI | Suche, Filter, Liste, Detail und Statusanzeige funktionieren lokal ohne V0.7-Redesign. | V05-MUST-007 |
| T-V05-SAFETY-001 | Kein Auto-Playable | Import-only Fixtures können kein Match starten, erscheinen nicht in Engine-Karten und sind nicht decklegal. | V05-MUST-008 |
| T-V05-REG-001 | Regression | MVP-0.1 bis MVP-0.4 Tests, Visibility, Replay/StateHash, KI und Build bleiben grün. | V05-MUST-009 |

## Manuelle Smokes

- Katalogansicht öffnen.
- Suche nach `Simple Run Event`.
- Filter `runner`, `corp`, `playable`, `blocked` prüfen.
- Detailansicht für `catalog_preview_operation_001` öffnen und Nicht-Spielbarkeit prüfen.
- Bestehenden Matchstart mit V0.4-Demo-Decks unverändert starten.

## Checkliste

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- paketbezogene Catalog-Tests nach Implementierung
- lokale Smoke-Prüfung der Katalogansicht
