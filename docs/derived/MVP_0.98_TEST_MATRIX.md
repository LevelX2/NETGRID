# MVP 0.98 Test Matrix - Identities und Hidden-Zone-Tools

Status: Requirements-Freeze-Testmatrix
Stand: 2026-05-04

| Test-ID | Bereich | Requirement-IDs | Erwartung |
|---|---|---|---|
| V098-T001 | Shared Types | M098A-SHARED-001 | Modifier-/Usage-/Hidden-Zone-Choice-Typen sind additiv. |
| V098-T002 | Runner Identity Setup | M098A-IDENTITY-001, M098A-SETUP-001 | Runner-Identity-Fähigkeit läuft genau einmal und ist replaybar. |
| V098-T003 | Corp Identity Setup | M098A-IDENTITY-001, M098A-SETUP-001 | Corp-Identity-Fähigkeit läuft genau einmal und leakt keine Hidden Info. |
| V098-T004 | Static Modifier | M098A-MODIFIER-001, M098A-LINK-001, M098A-MEMORY-001 | Modifier beeinflussen LegalActions und `applyAction` konsistent. |
| V098-T005 | Usage Marker | M098A-USAGE-001 | Usage-Marker werden deterministisch geschrieben und resetten nur dokumentiert. |
| V098-T006 | Identity Replay | M098A-VISIBILITY-001, M098B-REPLAY-001 | Identity-Setup/Modifier replayen mit identischem StateHash. |
| V098-T007 | Search Own Zone | M098B-CHOICE-001, M098B-SEARCH-001 | Eigene Hidden-Zone-Suche zeigt Kandidaten nur der berechtigten Side. |
| V098-T008 | Search Illegal | M098B-CHOICE-001 | Falsche Side, stale StateVersion, falsche Zone und ungültige Choices werden abgelehnt. |
| V098-T009 | Reveal | M098B-REVEAL-001, M098B-EVENT-001 | Reveal erzeugt ein PublicEvent mit exakt freigegebenen Kartendaten. |
| V098-T010 | Expose | M098B-EXPOSE-001, M098B-EVENT-001 | Expose zeigt nur installierte unrezzed Karten und ist replaybar. |
| V098-T011 | Arrange | M098B-ARRANGE-001, M098B-VISIBILITY-001 | Private Reihenfolge wird nicht in gegnerischen Payloads sichtbar. |
| V098-T012 | Shuffle | M098B-SHUFFLE-001 | Shuffle nutzt RandomDrawRecords und ist deterministisch replaybar. |
| V098-T013 | Swap | M098B-SWAP-001 | Swap respektiert Owner, Controller, Zone und Faceup-Invarianten. |
| V098-T014 | Undo | M098B-UNDO-001 | Hidden-Zone-Barrieren blockieren Undo nach privater Information. |
| V098-T015 | AI Contract | M098B-AI-001 | AI nutzt keine gegnerischen Hidden-Zone-Kandidaten oder private Reihenfolgen. |
| V098-T016 | Multiplayer | M098B-MP-001, M098-CARD-001, M098-DECK-001 | Submit, Idempotency, Reconnect und Undo-Barriere bleiben side-sicher; spielbare Harness-Karten sind manifest- und deck-gated. |
| V098-T017 | No Scope | M098-NOSCOPE-001, M098-GATE-001 | V0.99+, Hosting, Virus, Counter und Prevention bleiben unspielbar. |
| V098-T018 | Build Gate | M098-GATE-001 | Typecheck, Tests, Visibility, AI, Multiplayer, Lint, Test und Build sind grün oder Blocker akzeptiert. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- Engine-Tests für V0.98a und V0.98b
- Server-Multiplayer-Smokes für Submit, Idempotency, Reconnect und Undo-Barrieren
- AI-Smokes für Identity-/Hidden-Zone-LegalActions-only Situationen
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
