# MVP 0.95 Test Matrix - Resources und Tag-Interaktion

Status: Requirements-Freeze-Testmatrix
Stand: 2026-05-04

| Test-ID | Bereich | Requirement-IDs | Erwartung |
|---|---|---|---|
| V095-T001 | Shared Types | M095-SHARED-001, M095-RIG-001 | `resource` und Resource-Boarddarstellung sind additiv typisiert. |
| V095-T002 | Resource Install | M095-INSTALL-001, M095-INSTALL-002, M095-CARD-001 | Runner installiert eine lokale/fiktive Resource nur über LegalAction; Kosten und Ziel werden revalidiert. |
| V095-T003 | Resource Visibility | M095-RIG-001, M095-VISIBILITY-001, M095-EVENT-001 | Installierte Resource ist für beide Seiten öffentlich sichtbar, ohne verdeckte Zonen zu leaken. |
| V095-T004 | Corp Trash Legal | M095-TRASH-001, M095-TRASH-002, M095-TRASH-003 | Corp kann bei getaggtem Runner 1 Klick und 2 Credits zahlen und eine installierte Resource in den Runner-Heap trashen. |
| V095-T005 | Corp Trash Illegal Untagged | M095-TRASH-001, M095-TRASH-004 | Ohne Runner-Tag gibt es keine `trash_resource`-LegalAction und `applyAction` lehnt den Versuch ab. |
| V095-T006 | Corp Trash Costs/Stale | M095-TRASH-002, M095-TRASH-004 | Fehlende Klicks/Credits, falsche Side und stale StateVersion werden abgelehnt. |
| V095-T007 | Corp Trash Target | M095-TRASH-003, M095-TRASH-004, M095-VISIBILITY-001 | Nicht installierte, verdeckte, falsche oder Nicht-Resource-Ziele werden abgelehnt. |
| V095-T008 | Replay/StateHash | M095-REPLAY-001 | Install/Trash-Actionstream replayt deterministisch mit identischem StateHash. |
| V095-T009 | PublicEvents | M095-EVENT-001, M095-VISIBILITY-001 | Events enthalten nur public Resource-Daten und keine Hand-/Decklisten. |
| V095-T010 | Undo | M095-UNDO-001, M095-MP-001 | Undo vor Hidden-Info bleibt möglich; Resource-Trash erzeugt keine zusätzliche Hidden-Info-Barriere. |
| V095-T011 | AI Smoke | M095-AI-001 | AI wählt Resource-Aktionen nur aus LegalActions und bleibt side-sicher. |
| V095-T012 | Multiplayer Submit/Idempotency | M095-MP-001 | Submit und idempotente Wiederholung funktionieren für Resource-Install und Resource-Trash. |
| V095-T013 | Multiplayer Reconnect | M095-MP-001, M095-VISIBILITY-001 | Reconnect-Payload zeigt installierte Resources public und keine verdeckten Zonen. |
| V095-T014 | Deck/Manifest Gate | M095-CARD-001, M095-DECK-001 | Resource wird nur spielbar/deck-legal mit Manifest, Resolver und Testabdeckung. |
| V095-T015 | No-Scope Regression | M095-NOSCOPE-001, M095-GATE-001 | Trace/Link/Bidding, Multiaccess, Identity-Abilities, Hosting, Viren, Counter-Familien und Prevention bleiben unspielbar. |
| V095-T016 | Build Gate | M095-GATE-001 | Typecheck, Engine-Tests, betroffene Pakettests, Visibility, Replay/StateHash, AI-Smokes, Multiplayer-Smokes, Lint, Test und Build sind grün oder Blocker sind akzeptiert dokumentiert. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/ai typecheck`
- Engine-Tests für Resource-Install, Resource-Trash, IllegalActions, Visibility und Replay/StateHash
- Server-Multiplayer-Smokes für Submit, Idempotency, Reconnect und Undo-Barrieren
- AI-Smokes für LegalActions-only Resource-/Tag-Situationen
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
