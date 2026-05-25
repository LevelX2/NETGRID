---
activityId: act-2026-05-24-proteus-phase-7d-base-link-trace-deck
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 7d
blockedBy:
  - act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/hardware/deck-the.ts
  - packages/engine/src/index.test.ts
  - docs/activities/done/act-2026-05-24-proteus-phase-7a-hardware-deck-foundation.md
  - docs/releases/proteus/README.md
checks:
  - rg onr_proteus_138/Deck, The/trace_base_link_window/trace_post_bid_link_window/use_base_link/increase_trace_link in 7a artifacts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Deck, The"
  - git diff --check
---

# Proteus Phase 7d: Base-Link/Trace Deck

## Ziel

Den Base-Link-/Trace-Anteil von `Deck, The` umsetzen, falls er in 7a nicht vollständig und sauber enthalten war.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7d Base-Link/Trace Deck`.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Bestehende Trace-, Link- und PlayerView-Projektionsmuster.

## Zielkarten

- `onr_proteus_138_deck-the` Deck, The, falls Base-Link/Trace nach 7a offen bleibt.

## Scope

- Base-Link-/Trace-Modifier.
- PlayerView-Projektion und AIInput nur side-sichere öffentliche Werte.
- Replay-/StateHash-stabile Modifier-Anwendung ohne UI-Regelautorität.

## Nicht im Scope

- Keine erneute Umsetzung der Deck-Foundation aus 7a.
- Keine AI-Hints oder AI-Support-Promotion.
- Keine Decklegalität.

## Akzeptanzkriterien

- [x] Base-Link-/Trace-Modifier sind entweder in 7a nachweislich erledigt oder hier generisch umgesetzt.
- [x] Projektionen sind public-safe; Hidden-Info wird nicht geleakt.
- [x] Wrong-Side-, stale-action-, Kosten-, Ziel-, Trace-/Link- und Replay-/StateHash-Tests sind vorhanden.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht oder Nichtbedarf dokumentiert.

## Ergebnisnotiz

Kein separater Codebedarf. `Deck, The` wurde in Phase 7a vollständig mit `trace_base_link_window`, `trace_post_bid_link_window`, `use_base_link`, `increase_trace_link` und `one_base_link_card_per_trace_attempt` umgesetzt und getestet. 7d ist als Nachweis-/No-op-Slice abgeschlossen.
