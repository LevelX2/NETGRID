# MVP 0.97 Test Matrix - Run, Jack-out, Breach und Multiaccess

Status: Requirements-Freeze-Testmatrix
Stand: 2026-05-04

| Test-ID | Bereich | Requirement-IDs | Erwartung |
|---|---|---|---|
| V097-T001 | Shared Types | M097-SHARED-001 | BreachState, AccessQueue und `jack_out` sind additiv typisiert. |
| V097-T002 | Single Access Regression | M097-RUN-001 | Alte Single-Access-Runs bleiben fachlich kompatibel. |
| V097-T003 | Jack-out Legal | M097-JACK-001, M097-JACK-002 | Runner kann im Movement-Fenster jack-outen; Run endet ohne Breach. |
| V097-T004 | Jack-out Illegal | M097-JACK-003 | Falsche Side, falsches Timing und stale StateVersion werden abgelehnt. |
| V097-T005 | Breach Start | M097-BREACH-001, M097-BREACH-002 | Erfolgreicher V0.97-Run erzeugt genau einen internen Breach-State ohne Queue-Leak. |
| V097-T006 | Access Next | M097-ACCESS-001, M097-ACCESS-002 | `access_card` revealt nur die aktuelle Queue-Position und setzt die Queue korrekt fort. |
| V097-T007 | R&D Multiaccess | M097-RD-001, M097-VISIBILITY-001 | R&D-Queue greift Top N deterministisch ab und leakt keine künftigen Titel. |
| V097-T008 | HQ Multiaccess | M097-HQ-001, M097-RANDOM-001 | HQ-Queue wählt N verschiedene Karten deterministisch über RandomDrawRecords. |
| V097-T009 | Archives Access | M097-ARCHIVES-001 | Archives-Queue bleibt im lokalen Modell side-sicher. |
| V097-T010 | Remote Access | M097-REMOTE-001 | Remote-Root-Access bleibt mit Steal/Trash/Decline kompatibel. |
| V097-T011 | Hidden-Info-Barriere | M097-EVENT-001, M097-UNDO-001 | Jeder Hidden-Zone-Access blockiert Undo und leakt keine künftigen Queue-Entries. |
| V097-T012 | PlayerView/Reconnect | M097-VISIBILITY-001, M097-MP-001 | Reconnect während Breach zeigt nur zulässigen aktuellen Access-State. |
| V097-T013 | Replay/StateHash | M097-REPLAY-001 | Breach/Multiaccess replayt mit identischem StateHash. |
| V097-T014 | AI Smoke | M097-AI-001 | AI wählt nur LegalActions und kennt keine künftigen Queue-Karten. |
| V097-T015 | Multiplayer Submit/Idempotency | M097-MP-001 | Submit und idempotente Wiederholung funktionieren während Breach/Access. |
| V097-T016 | Deck/Manifest Gate | M097-CARD-001, M097-DECK-001 | Multiaccess-Harness wird nur mit Manifest und Testabdeckung spielbar/deck-legal. |
| V097-T017 | No-Scope Regression | M097-NOSCOPE-001, M097-GATE-001 | V0.98+-Mechaniken, Replacement, Hidden-Zone-Tools, Hosting, Viren und Counter bleiben unspielbar. |
| V097-T018 | Build Gate | M097-GATE-001 | Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build sind grün oder Blocker sind akzeptiert dokumentiert. |

## Pflichtchecks

- `corepack pnpm --filter @netrunner/shared typecheck`
- `corepack pnpm --filter @netrunner/engine typecheck`
- `corepack pnpm --filter @netrunner/server typecheck`
- `corepack pnpm --filter @netrunner/ai typecheck`
- `corepack pnpm --filter @netrunner/web typecheck`
- Engine-Tests für Jack-out, Breach-State, Access-Queue, R&D/HQ/Archives/Remote-Access, IllegalActions, Visibility und Replay/StateHash
- Server-Multiplayer-Smokes für Submit, Idempotency, Reconnect und Undo-Barrieren
- AI-Smokes für LegalActions-only Breach-/Access-Situationen
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
