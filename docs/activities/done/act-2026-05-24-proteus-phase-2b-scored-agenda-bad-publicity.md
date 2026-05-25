---
activityId: act-2026-05-24-proteus-phase-2b-scored-agenda-bad-publicity
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
releaseTarget: Proteus Phase 2b
blockedBy:
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/agendas/charity-takeover.ts
  - data/scenarios/proteus-phase-2b-scored-agenda-bad-publicity-smoke-2026-05-24.json
  - data/manifests/proteus-card-support.json
  - packages/shared/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 2b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 2b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 2b"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - node -e "const fs=require('fs'); for (const f of ['data/manifests/proteus-card-support.json','data/scenarios/proteus-phase-2b-scored-agenda-bad-publicity-smoke-2026-05-24.json']) JSON.parse(fs.readFileSync(f,'utf8')); console.log('json ok')"
  - git diff --check
---

# Proteus Phase 2b: Scored-Agenda Bad Publicity

## Ziel

`Charity Takeover` über scored-agenda Effekte mit Credits plus Bad Publicity umsetzen.

## Zielkarte

- `onr_proteus_002_charity-takeover` Charity Takeover

## Scope

- Eigene CardImplementation-Datei.
- Generischen Bad-Publicity-Effekt aus Phase 2a wiederverwenden.
- Priorität gleichzeitiger Korp-Sieg vs. Bad-Publicity-Verlust testen.
- Manifest-/Coverage-/Szenario-Nachweis.

## Nicht im Scope

- Keine weiteren Bad-Publicity-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [x] Karte hat eine eigene CardImplementation-Datei.
- [x] Score-Effekt gibt Credits und erhöht Bad Publicity generisch.
- [x] Sieg-/Verlustpriorität ist getestet.
- [x] Replay/StateHash/PublicPayload sind stabil.

## Ergebnisnotiz

Erledigt am 2026-05-24. `Charity Takeover` ist als eigene CardImplementation unter `packages/engine/src/card-implementations/proteus/corp/agendas/charity-takeover.ts` umgesetzt. Die Karte nutzt eine geordnete `lifecycle.on_score`-Sequenz: erst `gain_credits` für 9 Credits, danach den generischen `add_bad_publicity`-Effekt aus Phase 2a für 1 Bad Publicity.

Der gezielte Engine-Test scoret die Agenda über echte LegalActions, revalidiert Wrong-Side und stale State über `applyAction`, prüft PublicPayload/ResolvedEffects, Replay und StateHash. Ein zweiter Test setzt die Korp vor dem Score auf 6 Bad Publicity und `agendaPointsToWin: 1`; trotz gleichzeitig erfülltem Korp-Agenda-Sieg bleibt `bad_publicity_7` primär und der Runner gewinnt. Manifest, Szenario und Catalog/Web-Proteus-Guard wurden auf die zusätzliche freigegebene Karte aktualisiert; Decklegalität, Formatlegalität und AI-Support bleiben aus.
