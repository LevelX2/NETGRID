---
activityId: act-2026-05-24-proteus-phase-1a-reuse-only-baseline
status: done
kind: implementation
area: cards
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 1a
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/ice/toughonium-wall.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/networked-center.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/research-bunker.ts
  - packages/engine/src/card-implementations/proteus/corp/upgrades/weapons-depot.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/streetware-distributor.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/card-implementations/coverage.test.ts
  - packages/engine/src/card-implementations/definition-descriptors.test.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - packages/catalog/src/index.test.ts
  - apps/web/app/api/cards/catalog-data.test.ts
  - data/manifests/proteus-card-support.json
  - data/scenarios/proteus-phase-1a-reuse-only-baseline-smoke-2026-05-24.json
  - data/scenarios/proteus-visible-baseline-smoke-2026-05-17.json
  - docs/releases/proteus/README.md
  - docs/releases/proteus/release-slicing-plan.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 1a"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 1a"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Visible Baseline"
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Proteus Phase 1a: Reuse-only Baseline

## Ziel

Den kleinsten Proteus-Phase-1-Schnitt umsetzen, der ohne neue generische Mechanikfamilie auskommt und ausschließlich vorhandene CardImplementation-Bausteine nutzt oder eine bereits vorhandene Umsetzung in per-card Struktur überführt.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/activities/in-progress/act-2026-05-24-proteus-phase-1-visible-baseline-cards.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `data/manifests/proteus-card-support.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.
- `docs/activities/done/act-2026-05-17-proteus-visible-baseline-card-slice.md`.

## Zielkarten

- `onr_proteus_041_toughoniumtm-wall` Toughonium™ Wall
- `onr_proteus_065_networked-center` Networked Center
- `onr_proteus_072_research-bunker` Research Bunker
- `onr_proteus_077_weapons-depot` Weapons Depot
- `onr_proteus_150_streetware-distributor` Streetware Distributor

## Benötigte Funktionsbausteine

- Per-card CardImplementation-Dateien unter `packages/engine/src/card-implementations/`.
- `printedSubroutines` mit vier öffentlichen `end_the_run`-Subroutinen für `Toughonium™ Wall`; bestehende Runtime-/Manifest-Spur darf nicht doppelt wirken.
- `modifiers` vom Kind `agenda_difficulty` für Region-Upgrades:
  - `Networked Center`: `gray_ops`-Agenden im selben Fort um 1 erleichtern.
  - `Research Bunker`: `research`-Agenden im selben Fort um 1 erleichtern.
  - `Weapons Depot`: `black_ops`-Agenden im selben Fort um 1 erleichtern.
- `regionBaseline` für die drei Region-Upgrades: Rez on install, install only if rez-affordable, one region per fort, trash older regions.
- Hosted-Credits-Lifecycle für `Streetware Distributor`:
  - Start of Runner turn: falls Hosted Credits vorhanden, 1 Credit von der Karte nehmen.
  - Runner-Main-Ability: `[A]` legt 3 öffentliche Hosted Credits auf die Karte.
- Registry-, Coverage-, Manifest- und Szenario-Nachweis für genau diese Karten.

## Nicht im Scope

- Keine neuen Timingfenster.
- Keine dynamischen ICE-Subroutinen.
- Keine Named Counter außerhalb Hosted Credits.
- Keine Hidden-Zone-Bewegung.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [x] Alle fünf Zielkarten haben eigene per-card CardImplementation-Dateien oder eine dokumentierte Migration aus vorhandener Umsetzung.
- [x] `Toughonium™ Wall` hat keinen Legacy-plus-CardImplementation-Doppeleffekt.
- [x] Region-Baseline und Agenda-Difficulty wirken nur am selben Fort und nur öffentlich nachvollziehbar.
- [x] `Streetware Distributor` erzeugt, nimmt und projiziert Hosted Credits side-sicher.
- [x] Nicht-Zielkarten bleiben blockiert, nicht decklegal, nicht formatlegal und nicht `ai_supported`.
- [x] Engine-Smoke, Visibility-, Replay-/StateHash- und Web-Catalog-No-Promotion-Checks sind dokumentiert.

## Umsetzungshinweise

- Dies ist der erste abarbeitbare Ersatz für das blockierte Sammelpaket.
- Wenn ein vorhandener Region- oder Hosted-Credit-Baustein in der Runtime nicht vollständig interpretiert wird, diesen Slice nicht breiter ziehen, sondern gezielt eine kleine generische Extension innerhalb dieses Pakets dokumentieren.

## Ergebnisnotiz

Abgeschlossen am 2026-05-24. Umgesetzt wurden fünf per-card CardImplementations für `Toughonium™ Wall`, `Networked Center`, `Research Bunker`, `Weapons Depot` und `Streetware Distributor`. Toughonium nutzt die generische `printedSubroutines`-Familie; die drei Region-Upgrades nutzen bestehende Region-Baseline- und `agenda_difficulty`-Modifier; Streetware Distributor nutzt die bestehenden öffentlichen Hosted-Credit-Effekte für Runner-Main-Ability und Start-of-Runner-turn-Lifecycle. `data/manifests/proteus-card-support.json` markiert genau diese fünf Karten als `human_playable`; `deck_legal`, `format_legal` und `ai_supported` bleiben aus, alle übrigen Proteus-Karten bleiben blockiert. Fokussierte Engine-/CardImplementation-/Catalog-/Web-Tests, Shared-/Engine-/Catalog-/Web-Typechecks und `git diff --check` sind grün.
