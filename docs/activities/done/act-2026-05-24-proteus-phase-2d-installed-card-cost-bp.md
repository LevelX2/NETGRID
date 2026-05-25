---
activityId: act-2026-05-24-proteus-phase-2d-installed-card-cost-bp
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
releaseTarget: Proteus Phase 2d
blockedBy:
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/events/poisoned-water-supply.ts
  - packages/engine/src/ability-engine/definition-types.ts
  - packages/engine/src/index.ts
  - packages/engine/src/public-context.ts
  - packages/shared/src/index.ts
  - data/scenarios/proteus-phase-2d-installed-connection-bp-cost-smoke-2026-05-24.json
  - data/manifests/proteus-card-support.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 2d"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 2d"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 2d"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - node -e "JSON.parse(require('fs').readFileSync('data/manifests/proteus-card-support.json','utf8')); JSON.parse(require('fs').readFileSync('data/scenarios/proteus-phase-2d-installed-connection-bp-cost-smoke-2026-05-24.json','utf8')); console.log('json ok')"
  - git diff --check
---

# Proteus Phase 2d: Installed-Card Cost BP

## Ziel

`Poisoned Water Supply` mit Bedingung auf installierte Connections und Trash eigener installierter Karten als Kosten-/Effektteil umsetzen.

## Zielkarte

- `onr_proteus_117_poisoned-water-supply` Poisoned Water Supply

## Scope

- Eigene CardImplementation-Datei.
- Bedingung auf zwei installierte Runner-Connections.
- Auswahl/Trash eigener installierter Karten side-sicher revalidieren.
- Danach Bad Publicity über Phase-2a-Baustein.

## Nicht im Scope

- Keine Hidden-Resource-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Karte hat eine eigene CardImplementation-Datei.
- [ ] Connection-Bedingung, Zielwahl und Kosten werden revalidiert.
- [ ] BP-Erhöhung nutzt den generischen Baustein.
- [ ] PublicPayload, Replay und StateHash sind stabil.

## Ergebnisnotiz

Erledigt am 2026-05-24. `Poisoned Water Supply` ist als eigene CardImplementation unter `packages/engine/src/card-implementations/proteus/runner/events/poisoned-water-supply.ts` umgesetzt.

Der Slice ergänzt einen kartenunabhängigen Runner-Event-Longtail `trash_installed_runner_connections_then_add_bad_publicity`. Die LegalAction wird nur projiziert, wenn mindestens zwei installierte Runner-Connections vorhanden sind. Beim Spielen öffnet die Engine eine hidden-info-barrier Choice für genau zwei installierte Connections; die Choice-Auflösung revalidiert Seite, State-Version, Auswahlgröße und aktuelle installierte Connection-Ziele, trasht die gewählten Connections und nutzt danach den generischen `add_bad_publicity`-Baustein aus Phase 2a.

Tests decken Gate/LegalAction-Projektion, Wrong-Side, stale State, Choice-Ziel-/Drift-Revalidierung, PublicPayload/ResolvedEffects, Replay/StateHash und die Priorität `bad_publicity_7` ab. Decklegalität, Formatlegalität und AI-Support bleiben aus.
