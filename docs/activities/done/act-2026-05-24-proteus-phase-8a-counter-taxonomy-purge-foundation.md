---
activityId: act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
status: done
kind: implementation
area: engine
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 8a
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/public-context.ts
  - packages/engine/src/mechanics/public-payload-schema.ts
  - packages/engine/src/game/view/card-view.ts
  - packages/engine/src/game/view/player-view-projection.ts
  - packages/engine/src/game/counters/proteus-purge-foundation.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/counters/proteus-purge-foundation.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/turn/corp-basic-actions.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "purge"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
---

# Proteus Phase 8a: Counter Taxonomy/Purge Foundation

## Ziel

Die generische Grundlage für purgefähige Runner-Virus-Counter, Antibody-/Advancement-Abgrenzung, Proteus-Purge und CounterDisplay-Projektion schaffen, ohne Zielkarten zu promoten.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8a Counter Taxonomy/Purge Foundation`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- `docs/releases/proteus/purge-action-debt-contract.md`.
- Bestehende O:NR-v1-Virus-/Counter-/Purge-Muster.

## Zielkarten

Keine Zielkartenpromotion.

## Scope

- Purgeable Runner-Virus-Counter vs. Antibody-/Advancement-Counter.
- Proteus-Purge-Grundlage mit Action Debt/Forgo Actions.
- CounterDisplay-Projektion und public-safe Payloads.
- Replay-/StateHash-stabile Counter- und Action-Debt-Zustände.

## Nicht im Scope

- Keine Antibody-, Agenda-, Run-, Access- oder Random-Zielkarten aus 8b bis 8f.
- Keine AI-Hints oder Decklegalität.
- Keine Alias-Änderung am bestehenden V0.99-Main-Action-Purge ohne explizite Kompatibilität.

## Akzeptanzkriterien

- [x] Counter-Taxonomie ist runtime- und testseitig eindeutig.
- [x] Purge entfernt nur registrierte purgefähige Runner-Virus-Counter und lässt Antibody-/Advancement-Counter stehen.
- [x] Action-Debt ist LegalAction-basiert, StateHash-relevant, kumulierbar und deterministisch abtragbar.
- [x] PlayerView/PublicPayload/Replay leaken keine privaten Counter- oder Kandidatenlisten.
- [x] Folge-Slices 8b bis 8f können deklarativ auf der Grundlage aufsetzen.

## Ergebnisnotiz

Umgesetzt als generische Foundation ohne Zielkartenpromotion:

- `PurgeableRunnerVirusCounterState` trennt purgefähige Runner-Virus-Counter mit Corp-, Server- und Effect-Scope von normalen Karten-Countern, Antibody-Countern und Advancement-Countern.
- `purge_runner_virus_counters` ist eine eigene LegalAction in einem expliziten Runner-Virus-Purge-Fenster und bleibt vom bestehenden V0.99-`purge_virus_counters` getrennt.
- Korp-Action-Debt wird als `corpActionDebt` StateHash-relevant gespeichert und über öffentliche `forgo_action`-LegalActions deterministisch abgetragen; Mandatory Draw bleibt davon unberührt.
- PlayerViews projizieren Corp- und Server-scope Runner-Virus-Counter als öffentliche CounterDisplays; PublicPayloads verwenden nur aggregierte Counter-/Debt-Daten.
- Replay bestätigt StateHash-Stabilität für Purge und Debt.
