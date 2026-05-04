# MVP 0.95 Test Matrix

Status: geplant
Stand: 2026-05-04

## Matrix

| Test-ID | Deckt ab | Prüfpfad | Erwartung |
|---|---|---|---|
| V095-T001 | M095-SHARED-001, M095-RIG-001 | Shared/Engine Typechecks | `resource` und Runner-Resource-Boardbereich sind additiv typisiert. |
| V095-T002 | M095-INSTALL-001 | Engine Unit Test | Runner kann eine lokale/fiktive Resource aus Grip legal installieren. |
| V095-T003 | M095-INSTALL-002, M095-VISIBILITY-001 | PlayerView/Visibility Test | Installierte Resource ist fuer beide Seiten oeffentlich sichtbar; Grip bleibt redigiert. |
| V095-T004 | M095-CARD-001, M095-DECK-001 | Manifest/Artifact Test | Resource ist nur mit Manifest, Resolver und Testabdeckung spielbar/deck-legal. |
| V095-T005 | M095-TRASH-001 | Engine LegalAction Test | Corp sieht Resource-Trash nur, wenn Runner getaggt ist. |
| V095-T006 | M095-TRASH-002, M095-TRASH-003 | Engine Unit Test | Resource-Trash kostet 1 Klick und 2 Credits, bewegt Ziel in Runner-Heap und revalidiert. |
| V095-T007 | M095-TRASH-004 | Engine Illegal-Action Test | Untagged Runner blockiert Resource-Trash. |
| V095-T008 | M095-TRASH-004 | Engine Illegal-Action Test | Falsche Side, stale StateVersion, zu wenig Kosten, nicht installierte Karte und falsches Ziel werden abgelehnt. |
| V095-T009 | M095-REPLAY-001 | Replay/StateHash Test | Install und Trash replayen deterministisch mit identischem finalen StateHash. |
| V095-T010 | M095-EVENT-001, M095-VISIBILITY-001 | PublicEvent Test | Install-/Trash-Events enthalten nur oeffentliche Resource-Daten und keine Hand-/Deckinformationen. |
| V095-T011 | M095-MP-001 | Server Multiplayer Smoke | Submit, Idempotency, Stale-State-Ablehnung, Reconnect und EventTail bleiben side-sicher. |
| V095-T012 | M095-UNDO-001 | Server Undo Test | Undo ueber Resource-Trash ist moeglich, solange keine andere Hidden-Info-Barriere dazwischen liegt. |
| V095-T013 | M095-AI-001 | AI Smoke | AI nutzt LegalActions-only und keine Hidden-Info fuer Resource-/Tag-Bewertung. |
| V095-T014 | M095-NOSCOPE-001 | No-Scope Regression | Keine Trace-, Link-, Bid-, Prevention-, Hosting-, Virus-, Counter-, Multiaccess-, Identity- oder Mulligan-Action wird spielbar. |
| V095-T015 | M095-GATE-001 | Review Docs | Requirements, Spec, Testmatrix und Requirements Review liegen vor. |
| V095-T016 | Build Gate | Workspace Checks | `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` laufen gruen oder ein Blocker ist dokumentiert. |

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

- Resource-Trash darf nur bei getaggtem Runner legal sein.
- Kosten muessen exakt 1 Corp-Klick und 2 Corp-Credits sein.
- Resource-Trash darf kein Hidden-Info-Undo-Barrier-Event werden, solange nur oeffentliche installierte Karten betroffen sind.
- Trace, Link/Bidding, Hosting, Viren, Counterfamilien, Prevention und Replacement bleiben gesperrt.
