# MVP 0.96 Test Matrix - Trace, Link und Bidding

Status: Requirements-Freeze-Testmatrix
Stand: 2026-05-04

| Test-ID | Bereich | Requirement-IDs | Erwartung |
|---|---|---|---|
| V096-T001 | Shared Types | M096-SHARED-001, M096-LINK-001 | TraceState, Link-Vertrag und Trace-Subroutine sind additiv typisiert. |
| V096-T002 | Trace Start | M096-TRACE-001, M096-TRACE-002, M096-CARD-001 | Eine manifestierte lokale Trace-Harness-Karte startet einen Trace und erzeugt eine Corp-Bid-Choice. |
| V096-T003 | Corp Bid Legal | M096-TRACE-003, M096-TRACE-006 | Corp wählt einen legalen Bid, zahlt exakt diesen Betrag und erzeugt die Runner-Bid-Choice. |
| V096-T004 | Corp Bid Illegal | M096-TRACE-003, M096-VISIBILITY-001 | Falsche Side, stale StateVersion, falsche ChoiceId, doppelte/fehlende/zu teure Optionen werden abgelehnt. |
| V096-T005 | Runner Bid Legal | M096-TRACE-004, M096-TRACE-005, M096-TRACE-006 | Runner sieht Trace-Strength und Link, wählt einen legalen Bid und zahlt exakt diesen Betrag. |
| V096-T006 | Runner Bid Illegal | M096-TRACE-005, M096-VISIBILITY-001 | Falsche Side, stale StateVersion, falsche ChoiceId, doppelte/fehlende/zu teure Optionen werden abgelehnt. |
| V096-T007 | Trace Success | M096-TRACE-007, M096-TRACE-008 | `traceStrength > runnerStrength` führt genau zum freigegebenen `add_tag`-Effekt. |
| V096-T008 | Trace Failure/Tie | M096-TRACE-007, M096-TRACE-008 | Gleichstand oder höherer Runner-Wert erzeugt keinen Tag und keinen weiteren Effekt. |
| V096-T009 | Trace Close/Run | M096-TRACE-009 | Trace-State und Choice schließen deterministisch; die Trace-Subroutine wird nicht erneut ausgelöst. |
| V096-T010 | PublicEvents | M096-EVENT-001, M096-VISIBILITY-001 | Trace-Events enthalten nur öffentliche Trace-/Bid-/Credit-/Tag-Daten. |
| V096-T011 | PlayerView/Reconnect | M096-VISIBILITY-001, M096-MP-001 | Nur die zuständige Seite sieht die offene Trace-Choice; die Gegenseite sieht keine private Choice-Daten. |
| V096-T012 | Replay/StateHash | M096-REPLAY-001 | Trace-Actionstream replayt deterministisch mit identischem StateHash und ohne neue RandomDrawRecords. |
| V096-T013 | Undo | M096-UNDO-001, M096-MP-001 | Trace-Bids erzeugen keine Hidden-Info-Barriere; bestehende Barrieren bleiben wirksam. |
| V096-T014 | AI Smoke | M096-AI-001 | AI wählt Trace-Bid-Aktionen und Bid-Optionen nur aus LegalActions/PlayerView. |
| V096-T015 | Multiplayer Submit/Idempotency | M096-MP-001 | Submit und idempotente Wiederholung funktionieren für Corp- und Runner-Bid-Choices. |
| V096-T016 | Deck/Manifest Gate | M096-CARD-001, M096-DECK-001 | Trace-Harness wird nur mit Manifest, Resolver und vollständiger Testabdeckung spielbar/deck-legal. |
| V096-T017 | No-Scope Regression | M096-NOSCOPE-001, M096-GATE-001 | V0.97+-Mechaniken, Trace-Damage, Hosting, Viren, Counter-Familien und Prevention bleiben unspielbar. |
| V096-T018 | Build Gate | M096-GATE-001 | Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build sind grün oder Blocker sind akzeptiert dokumentiert. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/web typecheck`
- Engine-Tests für Trace-Start, Corp-Bid, Runner-Bid, Erfolg/Fehlschlag, IllegalActions, Visibility und Replay/StateHash
- Server-Multiplayer-Smokes für Submit, Idempotency, Reconnect und Undo-Barrieren
- AI-Smokes für LegalActions-only Trace-Bidding
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
