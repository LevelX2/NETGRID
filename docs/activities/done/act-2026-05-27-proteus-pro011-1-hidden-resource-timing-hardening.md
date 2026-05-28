---
activityId: act-2026-05-27-proteus-pro011-1-hidden-resource-timing-hardening
status: done
kind: implementation
area: cards
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO011-1
proReferences:
  - PRO011
  - PRO011-1
resultArtifacts:
  - packages/engine/src/ability-engine/card-implementation-runtime.ts
  - packages/engine/src/game/run/run-access-transition.ts
  - packages/engine/src/game/run/card-implementation-run-actions.ts
  - packages/engine/src/game/damage/damage-core.ts
  - packages/engine/src/index-tests/proteus/hidden-resource-hardening.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/hidden-resource-hardening.test.ts -t "PRO011"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "PRO011"
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Proteus PRO011-1: Hidden Resource Timing and Behavior Hardening

## Ergebnis

PRO011-1 härtet ausschließlich Timing und Verhalten der bereits umgesetzten PRO011-Hidden-Resources. Es setzt keine neue Proteus-Karte um, ändert keine Manifest-Freigaben und promotet keine Karte zu `deck_legal`, `format_legal` oder `ai_supported`.

Der Proteus-Harness bleibt bei 154 total, 105 implementiert, 49 fehlend und 0 Drift.

## Gehärtete Punkte

- `Chiba Bank Account`, `Liberated Savings Account` und `Swiss Bank Account` sind nicht mehr normale `during_run`-Abilities, sondern laufen über ein generisches Runner-Kosten-/Penalty-Support-Fenster mit Source-, Tap-, Kosten-, Timing- und Window-Revalidierung.
- `HQ Mole` und `R&D Mole` nutzen ein generisches Access-Start-Fenster vor Aufbau der Access-Queue. Die Queue wird erst nach der Runner-Aktivierung final gebaut; zentrale Karten bleiben vorher verdeckt.
- `Time to Collect` prüft `activeOnlyDuring: "corp_turn"` gegen echte Korp-Zugphasen statt nur gegen `activeSide` und schützt weiterhin nicht sich selbst.

## Grenzen

PRO011-1 ist eine Nacharbeits- und Härtungsactivity. Sie erweitert keine PRO012- bis PRO020-Scope-Karten und schaltet keine neuen Proteus-Karten frei.
