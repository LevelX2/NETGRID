# MVP 0.94 Test Matrix

Status: umgesetzt
Stand: 2026-05-04

## Matrix

| Test-ID | Deckt ab | Prüfpfad | Erwartung |
|---|---|---|---|
| V094-T001 | M094-SHARED-001, M094-GAMEEND-001 | Shared/Engine/Server/AI Typechecks | Damage- und Game-End-Typen sind additiv. |
| V094-T002 | M094-DAMAGE-001 | Engine Unit Test | Net-Damage trasht exakt `amount` Karten aus Grip. |
| V094-T003 | M094-DAMAGE-001 | Engine Unit Test | Meat-Damage nutzt denselben Basisablauf wie Net-Damage. |
| V094-T004 | M094-RANDOM-001, M094-RANDOM-002 | Engine Randomness Test | Gleicher Seed und gleiche Actions erzeugen gleiche Damage-Auswahl und RandomDrawRecords. |
| V094-T005 | M094-RANDOM-002 | Engine Unit Test | Eine Karte wird in einem Damage-Batch nicht doppelt ausgewählt. |
| V094-T006 | M094-FLATLINE-001 | Engine Unit Test | Damage größer als Grip setzt `winner: "corp"` und `gameEndReason: "flatline"` ohne weitere Grip-Auswahl. |
| V094-T007 | M094-FLATLINE-002 | Engine Unit Test | Damage gleich Grip-Größe trashte alle Karten und löst nicht allein wegen der Menge Flatline aus. |
| V094-T008 | M094-HEAP-001 | PlayerView Test | Nach überlebtem Damage liegen getrashte Karten im Runner-Heap nach bestehendem Sichtbarkeitsvertrag. |
| V094-T009 | M094-VISIBILITY-001 | Engine/PublicEvent Test | Damage-Event ist `hidden_info_barrier` und PublicPayload bleibt redigiert. |
| V094-T010 | M094-VISIBILITY-002 | Visibility Contract Root Spec | CorpView, PublicEvents, WebSocket, Reconnect, Undo und UI-Diagnostics enthalten keine vor-Damage-Grip-Liste. |
| V094-T011 | M094-UNDO-001 | Server Multiplayer Test | Undo nach Damage wird blockiert, auch ohne Flatline. |
| V094-T012 | M094-REPLAY-001 | Engine Replay/StateHash Test | Replay reproduziert Damage, RandomDrawRecords, Zone-Moves, Flatline und finalen StateHash. |
| V094-T013 | M094-DAMAGE-002, M094-DAMAGE-003 | Engine Illegal-Action Tests | Falsche Side, stale StateVersion, falsches Timing, falsches Ziel und nicht freigegebene Quelle werden abgelehnt. |
| V094-T014 | M094-AI-001 | AI Smoke | AI entscheidet LegalActions-only und erhält keine gegnerische Grip-Liste. |
| V094-T015 | M094-MP-001 | Server Multiplayer Smoke | Submit, Idempotency, Stale-State-Ablehnung, Reconnect und EventTail bleiben side-sicher. |
| V094-T016 | M094-CARD-001 | Manifest/Scenario Tests | Jede neue Damage-Testkarte hat Manifest, Resolver, Unit-Test, Szenario, Visibility, Replay/StateHash, AI- und Multiplayer-Smoke. |
| V094-T017 | M094-NOSCOPE-001 | No-Scope Regression | Keine Trace-, Resource-, Mulligan-, Multiaccess-, Identity-, Hosting-, Virus-, Prevention-, Avoid-, Interrupt- oder Replacement-Action ist spielbar. |
| V094-T018 | M094-GATE-001 | Review Docs | Requirements, Spec, Testmatrix und Requirements Review liegen vor. |
| V094-T019 | Build Gate | Workspace Checks | `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` laufen grün oder ein Blocker ist dokumentiert. |

## Pflichtchecks für Implementierung und Finalgate

- `corepack pnpm --filter @netrunner/shared typecheck`
- `corepack pnpm --filter @netrunner/engine typecheck`
- `corepack pnpm --filter @netrunner/engine test -- --run`
- `corepack pnpm --filter @netrunner/ai test -- --run`
- `corepack pnpm --filter @netrunner/server test -- --run`
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Spezielle Reviewpunkte

- Damage darf keinen neuen Randomness-Pfad neben RandomDrawRecords öffnen.
- PublicEvents und Match-Payloads dürfen den vor-Damage-Grip-Inhalt nicht verraten.
- Flatline darf nicht den vollen M2-Setup-Scope aktivieren.
- Core-Damage, Damage-Prevention und Replacement bleiben gesperrt.
