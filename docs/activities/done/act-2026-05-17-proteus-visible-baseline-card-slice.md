---
activityId: act-2026-05-17-proteus-visible-baseline-card-slice
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget: Proteus planning
blockedBy:
  - act-2026-05-17-proteus-release-slicing-plan
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/catalog/src/catalog-gates.ts
  - packages/catalog/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/catalog/src/index.test.ts
  - apps/web/app/api/cards/catalog-data.test.ts
  - data/manifests/card-implementation-manifest-proteus-visible-baseline-2026-05-17.json
  - data/rules/proteus-visible-baseline-mechanics-coverage-2026-05-17.json
  - data/scenarios/proteus-visible-baseline-smoke-2026-05-17.json
checks:
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/catalog test
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "rezzes Toughonium Wall"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts src/gate-evidence.test.ts -t "Proteus|catalog gate"
---

# Proteus Visible-Baseline-Kartenslice vorbereiten

## Ziel

Der erste Proteus-Kartenslice soll eine kleine sichtbare Baseline aus `covered`- und sehr einfachen `resolver`-Karten umsetzen, ohne Hidden-, Random-, Variable-, Purge-, Bad-Publicity- oder Proteus-Gesamtfreigabe.

## Kontext und Quellen

- `docs/derived/PROTEUS_RELEASE_SLICING_PLAN.md`
- `docs/derived/PROTEUS_MECHANICS_COVERAGE_ANALYSIS.md`
- `data/rules/proteus-mechanics-coverage-2026-05-17.json`
- `docs/derived/PROTEUS_SPOILER_IMPORT_REPORT.md`

## Scope

- Einen kleinen Kandidatensatz aus sichtbaren, niedrig riskanten Proteus-Karten auswählen.
- Bevorzugte Startkandidaten aus `covered`: einfache ICE, Corp-Upgrades, einfache Operationen, `Disintegrator`, `Streetware Distributor`.
- Optional einzelne einfache `resolver`-Karten nur nach lokalem Kartenvertrag aufnehmen.
- Runtime-Resolver, Manifest, Mechanics-Coverage, Szenario-Smokes und Web-Catalog-Guard für genau diese Karten pflegen.
- Hidden-Info-, LegalAction-, Replay-, StateHash-, stale-action- und illegal-action-Gates nachweisen.

## Nicht im Scope

- Keine Hidden Resources.
- Keine variable Rez-ICE.
- Keine Bad-Publicity-7+-Karten.
- Keine Virus-/Antibody-/Purge-Karten.
- Keine Random-/Würfelkarten.
- Keine `Ice and Data Special Report`-Klärung.
- Keine Proteus-Deckgesamtfreigabe und keine AI-Hints.

## Akzeptanzkriterien

- [x] Der Kandidatensatz ist klein und enthält keine Karte mit offenem Vertiefungs- oder Quellenblocker.
- [x] Jede freigegebene Karte hat Runtime-Resolver, Manifest-/Coverage-Eintrag und Szenarioabdeckung.
- [x] Proteus bleibt außerhalb des Kandidatensatzes blockiert und nicht decklegal.
- [x] `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- [x] Visibility, Replay, StateHash, stale-action und illegal-action sind getestet.
- [x] AI-Support bleibt separat und wird nicht automatisch aus Human-Spielbarkeit abgeleitet.

## Umsetzungshinweise

- Primärer Agent: `release-implementation-agent`.
- Keine Karte aus `deepen` oder `blocked` aufnehmen.
- Bei jedem Zweifel Karte zurückstellen und ein kleineres Folgepaket schneiden.

## Ergebnisnotiz

Umgesetzt wurde bewusst nur `onr_proteus_041_toughoniumtm-wall` (`Toughonium™ Wall`) als sichtbare Baseline-Karte. Die Karte ist runtime- und human-playable, aber nicht decklegal, nicht formatlegal und nicht AI-supported; alle übrigen Proteus-Karten bleiben im Runtime-Katalog blockiert. Hidden Resources, variable ICE, Bad-Publicity-, Virus-/Purge-, Random- und AI-Hint-Scope wurden nicht erweitert.
