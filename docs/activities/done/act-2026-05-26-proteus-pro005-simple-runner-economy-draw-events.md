---
activityId: act-2026-05-26-proteus-pro005-simple-runner-economy-draw-events
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-26
startedAt: 2026-05-26
completedAt: 2026-05-26
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO005
proReferences:
  - PRO005
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/events/cruising-for-netwatch.ts
  - packages/engine/src/card-implementations/proteus/runner/events/stakeout.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/card-implementations/coverage.test.ts
  - packages/engine/src/index.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-5c-simple-runner-economy-draw-setup.md
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO005\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"Proteus PRO005\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "git diff --check"
---

# Proteus PRO005: Simple Runner Economy/Draw Events

## Ziel

Die zwei einfachen Runner-Events aus PRO005 als konkrete Proteus-CardImplementation-Dateien umsetzen, ohne die PRO014-History-/Trace-Reward-Karten freizugeben.

## Ergebnisnotiz

Abgeschlossen am 2026-05-26.

`Cruising for Netwatch` nutzt den vorhandenen deklarativen `on_play`-Pfad mit `gain_credits` 1 und anschließend `draw_cards` 2. `Stakeout` nutzt denselben Pfad mit `gain_credits` 2 und anschließend `draw_cards` 1. Beide Karten haben Kosten 0, brauchen keinen Run-Kontext, keine History, keinen Trace, keine Hidden-Info-Mechanik, kein Wahlfenster und keine neuen Engine-Helfer.

Beide Karten sind registriert, in der Coverage als `implemented` sichtbar und im Proteus-Manifest `implemented`, `engine_supported`, `playable` und `human_playable`. `deck_legal`, `format_legal` und `ai_supported` bleiben `false`.

Die Phase-5c-Sammelactivity bleibt für PRO014 blockiert. `On the Fast Track`, `Prearranged Drop`, `Back Door to Rivals` und `Runner Sensei` wurden nicht umgesetzt.
