# AI Quality 0.9 Acceptance Tests

Status: Abgeschlossen
Stand: 2026-05-03

## Artifact und Requirements

- [x] V09-T001: V0.9-Dokumente existieren; alle Must-IDs stehen in Requirements und Testmatrix.
- [x] V09-T001: `MVP_0.9_REQUIREMENTS_REVIEW.md` enthält `ready_for_implementation: true`.

## Input, Rollen und Safety

- [x] V09-T002: AI-Inputs enthalten keine FullState-, Token- oder Hidden-Info-Felder.
- [x] V09-T003: KI wählt nur aktuelle LegalActions.
- [x] V09-T004: Hidden-State-Invarianztest besteht.
- [x] V09-T005: Kartenrollenmanifest ist versioniert und manuell.
- [x] V09-T006: Deckrollenprofile sind deterministisch.
- [x] V09-T007: ObservedFacts sind side-sicher.

## Qualität und Erklärungen

- [x] V09-T009: Simulation Summaries enthalten Metriken und Coverage.
- [x] V09-T010: Runner-Fixtures bestehen.
- [x] V09-T011: Corp-Fixtures bestehen.
- [x] V09-T012: Reason-Codes und Erklärungen sind stabil und leak-frei.

## Soak und Regression

- [x] V09-T008: Controller Lifecycle stoppt/pausiert korrekt.
- [x] V09-T013: Multi-Seed-/Difficulty-Soak besteht ohne IllegalAction, Drift oder Leak.
- [x] V09-T014: Tuning-Profile, Golden Seeds und Holdout-Seeds sind versioniert.
- [x] V09-T015: Multiplayer- und KI-Pfade bleiben kompatibel.
- [x] V09-T015: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.

## Abschlussnachweis

- AI-Pakettests: 15 Tests bestanden.
- Server-Pakettests: 12 Tests bestanden.
- V0.9-Soak-Smoke: 27 Läufe, 0 IllegalActions, 0 ReplayFailures, FallbackRate 0,02, TimeoutRate 0.
- Reason-Code-Coverage im Smoke: 15 Prefixe; ActionType-Coverage: 18 Actiontypen.
- Summary-Leak-Scan: keine `cardInstances` und keine versteckten V0.8-Instanz-IDs.
