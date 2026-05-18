# MVP 0.99 Test Matrix - Hosting, Viren, Purge und Counter-Familien

Status: Requirements-Freeze-Testmatrix
Stand: 2026-05-04

| Test-ID | Bereich | Requirement-IDs | Erwartung |
|---|---|---|---|
| V099-T001 | Shared Types/Baseline | M099A-SHARED-001, M099-DECK-001 | V0.99-Typen, Baseline und Demo-Decks sind additiv. |
| V099-T002 | Counter Model | M099A-COUNTER-001, M099A-COUNTER-002 | Karten- und Side-Counter sind nicht-negative Integer. |
| V099-T003 | Counter Visibility | M099A-VISIBILITY-001 | Counter leaken keine verdeckten Kartendaten. |
| V099-T004 | Hosting Choice | M099B-HOSTING-003, M099B-HOSTING-004, M099B-HOSTING-007 | Hosting-Kandidaten erscheinen nur im Runner-PlayerView. |
| V099-T005 | Hosting Invariants | M099B-HOSTING-001, M099B-HOSTING-002, M099B-HOSTING-005 | Host-Beziehung ist direkt, existierend, azyklisch und ohne Control-Wechsel. |
| V099-T006 | Host Trash | M099B-HOSTING-006 | Host-Trash bewegt gehostetes V0.99-Programm deterministisch in den Heap. |
| V099-T007 | Virus Program | M099C-VIRUS-001 | Virus-Programm erhält beim Installieren den erwarteten Virus-Counter. |
| V099-T008 | Purge LegalAction | M099C-VIRUS-002, M099C-VIRUS-005 | Corp erhält Purge nur im legalen Main-Window. |
| V099-T009 | Purge Revalidation | M099C-VIRUS-004 | Falsche Side, stale StateVersion und fehlende Virus-Counter werden abgelehnt. |
| V099-T010 | Purge Effekt | M099C-VIRUS-003 | Purge entfernt alle Virus-Counter und keine anderen Counter. |
| V099-T011 | Purge Replay | M099C-VIRUS-006, M099A-REPLAY-001 | Purge replayt mit identischem StateHash und ohne Randomness. |
| V099-T012 | Recurring Refresh | M099D-RECURRING-001, M099D-RECURRING-002 | Recurring Credits werden gesetzt/refresht und akkumulieren nicht. |
| V099-T013 | Recurring Spend | M099D-RECURRING-003, M099D-RECURRING-004 | Programminstall kann Recurring nutzen und revalidiert Kosten. |
| V099-T014 | Bad Publicity Operation | M099D-BADPUB-001 | Corp-Operation erhöht Bad Publicity öffentlich. |
| V099-T015 | Bad Publicity Run Fund | M099D-BADPUB-002, M099D-BADPUB-003, M099D-BADPUB-004 | Run-Fund entsteht beim Run-Start, wird genutzt und danach entfernt. |
| V099-T016 | Bad Publicity Replay | M099A-REPLAY-001 | Bad-Publicity-Sequenzen replayen deterministisch. |
| V099-T017 | No Scope | M099-NOSCOPE-001 | Keine M11+-, Set-Aside-, Remove-from-Game- oder Ownership-/Control-Mechanik ist spielbar. |
| V099-T018 | Card/Deck Gate | M099-CARD-001, M099-DECK-001 | Jede spielbare V0.99-Karte ist manifestiert, getestet und deck-gated. |
| V099-T019 | AI Contract | M099-CARD-001 | AI nutzt nur PlayerView, LegalActions und side-sichere Choices. |
| V099-T020 | Multiplayer | M099-GATE-001 | Submit, Idempotency, Reconnect und Undo-Barrieren funktionieren für V0.99. |
| V099-T021 | Build Gate | M099-GATE-001 | Typecheck, Tests, Visibility, AI, Multiplayer, Lint, Test und Build sind grün oder Blocker akzeptiert. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- Engine-Tests für V0.99a bis V0.99d
- Server-Multiplayer-Smokes für Submit, Idempotency, Reconnect und Undo-Barrieren
- AI-Smokes für Counter-, Hosting-, Purge-, Recurring- und Bad-Publicity-Situationen
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
