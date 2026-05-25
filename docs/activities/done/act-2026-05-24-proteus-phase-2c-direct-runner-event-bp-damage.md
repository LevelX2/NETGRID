---
activityId: act-2026-05-24-proteus-phase-2c-direct-runner-event-bp-damage
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
releaseTarget: Proteus Phase 2c
blockedBy:
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/events/faked-hit.ts
  - packages/engine/src/ability-engine/card-implementation-effect-adapters.ts
  - packages/engine/src/ability-engine/effect-interpreter.ts
  - packages/engine/src/public-context.ts
  - data/scenarios/proteus-phase-2c-direct-runner-event-bp-damage-smoke-2026-05-24.json
  - data/manifests/proteus-card-support.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 2c"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 2c"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 2c"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - node -e "const fs=require('fs'); for (const f of ['data/manifests/proteus-card-support.json','data/scenarios/proteus-phase-2c-direct-runner-event-bp-damage-smoke-2026-05-24.json']) JSON.parse(fs.readFileSync(f,'utf8')); console.log('json ok')"
  - git diff --check
---

# Proteus Phase 2c: Direct Runner Event BP + Damage

## Ziel

`Faked Hit` als Runner-Event-Sequenz aus Bad Publicity plus unpreventable Brain/Core Damage umsetzen.

## Zielkarte

- `onr_proteus_108_faked-hit` Faked Hit

## Scope

- Eigene CardImplementation-Datei.
- Bad-Publicity-Effekt aus Phase 2a.
- Unpreventable Brain/Core-Damage-Pfad nur über bestehende generische Damage-Bausteine oder sauber neu geschnittenen Helper.
- Flatline-vs.-Bad-Publicity-Priorität testen.

## Nicht im Scope

- Keine Hidden-Resource- oder Replacement-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [x] Karte hat eine eigene CardImplementation-Datei.
- [x] BP und Damage laufen als Engine-sequenzierte Effekte.
- [x] Flatline-/Bad-Publicity-Priorität ist getestet.
- [x] PublicPayload, Replay und StateHash sind stabil.

## Ergebnisnotiz

Erledigt am 2026-05-24. `Faked Hit` ist als eigene CardImplementation unter `packages/engine/src/card-implementations/proteus/runner/events/faked-hit.ts` umgesetzt. Die Karte spielt über eine geordnete `on_play`-Sequenz: `add_bad_publicity` erhöht die Korp um 1 Bad Publicity, danach löst ein generischer `damage`-Effekt mit `preventable: false` 2 unpreventable Core/Brain Damage beim Runner aus.

Der Slice ergänzt einen kartenunabhängigen unpreventable-Damage-Adapter für CardImplementation-Effekte. Dieser nutzt den bestehenden Engine-`doDamage`-Primitive direkt, öffnet keine Prevention-/Replacement-Fenster und projiziert nur öffentliche Damage-Summaries. Tests decken echtes `play_event`, Wrong-Side, stale State, PublicPayload/ResolvedEffects, Replay/StateHash und die Priorität `bad_publicity_7` vor gleichzeitigem Runner-Flatline ab. Decklegalität, Formatlegalität und AI-Support bleiben aus.
