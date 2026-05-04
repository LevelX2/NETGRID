# MVP 0.9 Test Matrix

Status: Requirements Freeze
Stand: 2026-05-03

| Test-ID | Deckt ab | Ebene | Erwartung |
|---|---|---|---|
| V09-T001 | V09-MUST-001 | Artifact | Alle V0.9-Dokumente und Review existieren. |
| V09-T002 | V09-MUST-002 | AI Input | Decision-Input enthält keine FullState-/Token-/Hidden-Info-Felder. |
| V09-T003 | V09-MUST-003 | AI Unit | Jede Entscheidung wählt aktuelle LegalAction; manipulierte ActionIds fallen durch. |
| V09-T004 | V09-MUST-004 | AI Visibility | Hidden-State-Invarianztest erzeugt gleiche Entscheidung. |
| V09-T005 | V09-MUST-005 | Data | Kartenrollenmanifest ist parsebar, manuell und nicht aus Kartentext. |
| V09-T006 | V09-MUST-006 | Data/AI | Deckrollenprofile sind deterministisch aus Snapshots und Rollen. |
| V09-T007 | V09-MUST-007 | AI Unit | ObservedFacts aus EventTail sind side-sicher rekonstruierbar. |
| V09-T008 | V09-MUST-008 | Server/AI | Autoplay stoppt/pausiert bei Winner, Pending Undo, stale State und Actionlimit. |
| V09-T009 | V09-MUST-009 | AI Simulation | Summaries enthalten Qualitätsmetriken und Coverage. |
| V09-T010 | V09-MUST-010 | Runner AI | Runner-Setup-, Run-, Encounter-, Access-, Tag- und Economy-Fixtures bestehen. |
| V09-T011 | V09-MUST-011 | Corp AI | Corp-Score-, Remote-, ICE-, Rez-, Economy- und Tag-Fixtures bestehen. |
| V09-T012 | V09-MUST-012 | Explanation | Reason-Codes und Explanations sind stabil und leak-frei. |
| V09-T013 | V09-MUST-013 | Soak | Multi-Seed-/Difficulty-Soak ohne IllegalAction, Drift oder Leak. |
| V09-T014 | V09-MUST-014 | Tuning | Profile, Golden- und Holdout-Seeds sind versioniert. |
| V09-T015 | V09-MUST-015 | Regression | Multiplayer- und AI-vs-AI-Pfade bleiben kompatibel. |

## Pflicht-Checks

- `corepack pnpm --filter @netrunner/ai test`
- `corepack pnpm --filter @netrunner/server test`
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
