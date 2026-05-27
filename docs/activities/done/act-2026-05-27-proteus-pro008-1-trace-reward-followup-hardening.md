---
activityId: act-2026-05-27-proteus-pro008-1-trace-reward-followup-hardening
status: done
kind: test
area: engine
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO008-1
proReferences:
  - PRO008-1
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/game/trace/base-link.ts
  - packages/engine/src/game/trace/trace-orchestration.ts
  - packages/engine/src/game/run/encounter-printed-effects.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
  - docs/releases/proteus/proteus-cardimplementation-detailplan-2026-05-26.md
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO008\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "git diff --check"
---

# Proteus PRO008-1: Trace-Reward-/Followup-Härtung

## Ziel

Die bereits umgesetzten PRO008-Karten bleiben unverändert. Dieses Nacharbeitspaket korrigiert zwei Review-Funde: Trace-Avoid-Rewards dürfen nur aus tatsächlich genutzten Trace-Abilities entstehen, und Remote Detonator muss seine Tagmenge aus dem konkreten CardImplementation-Descriptor lesen.

## Ergebnisnotiz

Abgeschlossen am 2026-05-27.

Trace-Avoid-Rewards werden jetzt beim konkreten Base-Link- oder Post-Bid-Link-Choice in `state.trace.traceAvoidRewardUsages` gespeichert. Die spätere Trace-Auflösung summiert nur diese gespeicherten Nutzungen. Dadurch geben `Back Door to Rivals` und `Runner Sensei` bei Base-Link-Nutzung exakt 1 Credit und bei Post-Bid-Link-Nutzung exakt 1 Credit; die zweite Ability derselben Karte wird nicht mehr versehentlich mitgezählt.

Remote Detonator nutzt im generischen Followup-Pfad den `tagAmount` des konkreten `trash_rezzed_ice_on_last_successful_run_fort_and_add_tags`-Effekts statt einer fest kodierten `3`.

Dieses Paket implementiert keine neue Proteus-Karte, ändert keine Manifest-Freigaben und hält die Proteus-Zählung bei 80/154 implementierten Karten.
