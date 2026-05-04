# MVP 0.8 Test Matrix

Status: Requirements Freeze
Stand: 2026-05-03

| Test-ID | Deckt ab | Ebene | Erwartung |
|---|---|---|---|
| V08-T001 | V08-MUST-001 | Artifact | V0.8-Dokumente existieren und Requirements Review ist ready. |
| V08-T002 | V08-MUST-002 | Data | `data/cards/demo-cards-0.8.json` enthält lokale fiktive Karten ohne offizielle Assets. |
| V08-T003 | V08-MUST-003, V08-MUST-012 | Catalog/Deck | Import-only und blocked Karten bleiben nicht matchstartfähig. |
| V08-T004 | V08-MUST-004 | Engine | Jede neue Karte hat expliziten Resolvernamen. |
| V08-T005 | V08-MUST-005 | Manifest | Manifesteinträge enthalten Tests, Szenarien, Visibility, Replay und KI-Smoke. |
| V08-T006 | V08-MUST-006 | Unit | Kartenkosten, Timing, Effekte und illegale Nutzung werden geprüft. |
| V08-T007 | V08-MUST-007 | Scenario | SCN-V08-001 bis SCN-V08-004 decken alle neuen Karten ab. |
| V08-T008 | V08-MUST-008 | Visibility | PlayerViews, PublicEvents, APIs und AI-Inputs leaken keine Hidden Info. |
| V08-T009 | V08-MUST-009 | Replay/StateHash | Gleiche Seeds und Snapshots erzeugen gleiche Hashes. |
| V08-T010 | V08-MUST-010 | AI | KI wählt mit V0.8-Decks nur LegalActions und erhält nur PlayerViews. |
| V08-T011 | V08-MUST-011 | Decks | V0.8-Snapshots validieren gegen Formatprofil und Kartenstatus. |
| V08-T012 | V08-MUST-012 | Decks | Nicht spielbare Karten blockieren Validierung und Matchstart. |
| V08-T013 | V08-MUST-013 | Decks | DeckHash ist stabil; Public Metadata enthält keine Kartenliste. |
| V08-T014 | V08-MUST-014 | Server | Matchstart revalidiert V0.8-Snapshots. |
| V08-T015 | V08-MUST-015 | Multiplayer | Human-vs-Human, Reconnect, Undo und stale action bleiben korrekt. |
| V08-T016 | V08-MUST-016 | Web | V0.7 UI zeigt neue Karten ohne FullState und ohne offizielle Assets. |
| V08-T017 | V08-MUST-017 | AI Data | Neue Karten haben Rollen-Tags. |
| V08-T018 | V08-MUST-018 | Manifest | Jede neue Karte ist `local_original`. |
| V08-T019 | V08-MUST-019 | Smoke | V0.8-KI-Smokes laufen über mehrere Seeds ohne illegal action. |
| V08-T020 | V08-MUST-020 | Performance | Kernpfade bleiben lokal im Budget oder Blocker ist dokumentiert. |
| V08-T021 | V08-MUST-021 | Regression | `lint`, `typecheck`, `test`, `build` bestehen. |

## Pflicht-Checks

- `corepack pnpm --filter @netrunner/engine test`
- `corepack pnpm --filter @netrunner/ai test`
- `corepack pnpm --filter @netrunner/decks test`
- `corepack pnpm --filter @netrunner/server test`
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
