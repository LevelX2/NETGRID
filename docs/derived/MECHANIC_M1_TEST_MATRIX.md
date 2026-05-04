# Mechanic M1 Test Matrix

Status: V0.92 Freeze
Stand: 2026-05-03
Ziel: V0.93-Implementierung

## Gate-Uebersicht

| Test-ID | Bereich | Deckt Anforderungen ab | Erwartung |
|---|---|---|---|
| V093-T001 | Shared Types | M092-M1-EFFECT-001, M092-M1-ABILITY-001, M092-M1-CHOICE-001, M092-M1-VISIBILITY-001 | Typecheck akzeptiert additive Typen ohne Bruch bestehender Imports. |
| V093-T002 | PendingChoice Side-Filter | M092-M1-CHOICE-001, M092-M1-VISIBILITY-002 | Runner sieht nur Runner-Choice, Corp sieht keine gegnerischen Optionen; ohne Choice bleibt View unveraendert. |
| V093-T003 | Choice-Revalidierung | M092-M1-CHOICE-001, M092-M1-TIMING-002 | Falsche Side, stale StateVersion, falsche ChoiceId, ungueltige Option und falsche Anzahl werden abgelehnt. |
| V093-T004 | PendingChoice blockiert andere Actions | M092-M1-CHOICE-001 | Bei aktiver Choice sind nur passende Choice-Actions legal. |
| V093-T005 | No Mulligan/Trace Gameplay | M092-M1-CHOICE-002 | Keine LegalAction macht Mulligan, Trace, Prevention oder Multiaccess spielbar. |
| V093-T006 | Effect Commands Basis | M092-M1-EFFECT-001 | Credits, Draw, Tags, Strength und Break koennen ueber Commands deterministisch getestet werden. |
| V093-T007 | Effect Visibility | M092-M1-VISIBILITY-001 | Effect Events tragen eine Sichtbarkeitsklasse und leaken keine verdeckten Details. |
| V093-T008 | Breaker Ability Pilot | M092-M1-ABILITY-002 | Pump/Break bleiben als `pump_breaker`/`break_subroutine` legal und pruefen Kosten, Timing, ICE-Subtype und Subroutine. |
| V093-T009 | Public Action Compatibility | M092-M1-EFFECT-003, M092-M1-ABILITY-002 | Bestehende UI-/Server-/AI-Payloads akzeptieren alte Action Types weiter. |
| V093-T010 | StateHash Review | M092-M1-REPLAY-001 | Jede State-/Eventschema-Aenderung ist dokumentiert; Replay bleibt deterministisch. |
| V093-T011 | Engine Regression | M092-M1-GATE-001 | Bestehende Engine-Tests fuer Draw, Install, Play, Advance, Score, Run, Rez, Pump, Break, Access, Steal, Trash, Remove Tag bleiben gruen. |
| V093-T012 | Visibility Regression | M092-M1-VISIBILITY-002 | Root-Visibility-Contract laeuft gruen; RunnerView/WebSocket/Reconnect/Undo leaken keine Hidden Info. |
| V093-T013 | AI Smoke | M092-M1-AI-001 | KI nutzt weiter nur PlayerView, LegalActions und side-gefilterte Events; unbekannte Ability-Felder fuehren nicht zu illegalen Actions. |
| V093-T014 | Multiplayer Smoke | M092-M1-MP-001 | Bootstrap, WebSocket, Reconnect und Undo serialisieren optionale Choice-/Eventfelder side-sicher. |
| V093-T015 | Artifact Gate | M092-M0-COVERAGE-002, M092-M1-GATE-001 | Coverage-JSON und Reviews bleiben parsebar/vorhanden. |

## Mindestbefehle fuer V0.93

- `corepack pnpm --filter @netrunner/shared typecheck`
- `corepack pnpm --filter @netrunner/engine test`
- `corepack pnpm --filter @netrunner/ai test`
- `corepack pnpm --filter @netrunner/server test`
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Rebaselines

StateHash-Rebaselines sind nur erlaubt, wenn eine dokumentierte State- oder Eventschema-Aenderung vorliegt. Die V0.93-Implementation-Review muss dann nennen:

- welches Feld neu ist,
- warum der Hash fachlich neu ist,
- welche Szenarien betroffen sind,
- warum kein Hidden-Info-Leak maskiert wird.
