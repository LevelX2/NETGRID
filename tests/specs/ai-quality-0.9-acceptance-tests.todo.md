# AI Quality 0.9 Acceptance Tests

Status: Requirements Freeze
Stand: 2026-05-03

## Artifact und Requirements

- [ ] V09-T001: V0.9-Dokumente existieren; alle Must-IDs stehen in Requirements und Testmatrix.
- [ ] V09-T001: `MVP_0.9_REQUIREMENTS_REVIEW.md` enthält `ready_for_implementation: true`.

## Input, Rollen und Safety

- [ ] V09-T002: AI-Inputs enthalten keine FullState-, Token- oder Hidden-Info-Felder.
- [ ] V09-T003: KI wählt nur aktuelle LegalActions.
- [ ] V09-T004: Hidden-State-Invarianztest besteht.
- [ ] V09-T005: Kartenrollenmanifest ist versioniert und manuell.
- [ ] V09-T006: Deckrollenprofile sind deterministisch.
- [ ] V09-T007: ObservedFacts sind side-sicher.

## Qualität und Erklärungen

- [ ] V09-T009: Simulation Summaries enthalten Metriken und Coverage.
- [ ] V09-T010: Runner-Fixtures bestehen.
- [ ] V09-T011: Corp-Fixtures bestehen.
- [ ] V09-T012: Reason-Codes und Erklärungen sind stabil und leak-frei.

## Soak und Regression

- [ ] V09-T008: Controller Lifecycle stoppt/pausiert korrekt.
- [ ] V09-T013: Multi-Seed-/Difficulty-Soak besteht ohne IllegalAction, Drift oder Leak.
- [ ] V09-T014: Tuning-Profile, Golden Seeds und Holdout-Seeds sind versioniert.
- [ ] V09-T015: Multiplayer- und KI-Pfade bleiben kompatibel.
- [ ] V09-T015: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.
