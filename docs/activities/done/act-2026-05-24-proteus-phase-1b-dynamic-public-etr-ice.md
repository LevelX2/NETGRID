---
activityId: act-2026-05-24-proteus-phase-1b-dynamic-public-etr-ice
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
releaseTarget: Proteus Phase 1b
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/ice/minotaur.ts
  - packages/engine/src/card-implementations/proteus/corp/ice/riddler.ts
  - packages/engine/src/ability-engine/additional-subroutine-modifiers.ts
  - packages/engine/src/ability-engine/effect-interpreter.ts
  - data/scenarios/proteus-phase-1b-dynamic-public-etr-ice-smoke-2026-05-24.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 1b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 1b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Dynamic Public ETR ICE"
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Proteus Phase 1b: Dynamic Public ETR ICE

## Ziel

`Minotaur` und `Riddler` als öffentliche ICE-Subroutinenfamilie planen und später umsetzen, ohne Proteus-ID-Branches in Runtime-Code.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarten

- `onr_proteus_031_minotaur` Minotaur
- `onr_proteus_034_riddler` Riddler

## Benötigte Funktionsbausteine

- Dynamischer öffentlicher Additional-Subroutine-Modifier für ICE:
  - Quelle ist das ICE selbst.
  - Ziel ist das ICE selbst.
  - Anzahl wird aus dem aktuellen öffentlichen Boardzustand berechnet.
  - `Minotaur`: je gerezztem Code Gate oder Wall außerhalb von `Minotaur` eine `end_the_run`-Subroutine.
  - Exklusion der Quelle und klare Behandlung von derezzed, uninstalled, trashed und moved ICE.
- Encounter-paid temporary subroutine ability:
  - Timing nur, wenn Runner gerade `Riddler` encountered.
  - Korp zahlt `[2]`.
  - Wirkung gilt nur für das aktuelle Encounter.
  - Wiederholbarkeit pro Encounter ist explizit zu klären und im LegalAction-Modell abzubilden.
- Stabile dynamische Subroutine-IDs für Break/Resolve, Replay und StateHash.
- PublicPayload ohne versteckte Kartendaten; nur öffentliche ICE-Zählung und öffentliche Subroutine-Texte.

## Nicht im Scope

- Keine Variable-Rez-ICE.
- Keine zufälligen Subroutinen.
- Keine Hidden-Info-Choices.
- Keine anderen Phase-3-ICE.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [x] Beide Karten haben per-card CardImplementation-Dateien.
- [x] Dynamische Subroutinen werden in LegalActions und `applyAction` konsistent revalidiert.
- [x] Stale Break-/Resolve-Actions gegen alte dynamische Subroutine-Listen werden abgelehnt.
- [x] Replay reproduziert StateHash bei wechselnder Rezzed-ICE-Zahl.
- [x] Keine neuen `onr_proteus_*`-Branches in `packages/engine/src/index.ts`; der vorbestehende Digiconda-/Food-Fight-Variable-ICE-Harness bleibt bewusst außerhalb von Phase 1b und ist für spätere Variable-ICE-Slices zu migrieren.

## Umsetzungshinweise

- Vor Umsetzung prüfen, ob die bestehende `additional_subroutine`-Familie auf source-self und dynamische Anzahl erweitert werden kann, statt eine parallele Familie anzulegen.
- Wenn Riddlers Wiederholbarkeit unklar bleibt, erst Regel-/Quellenklärung dokumentieren.

## Ergebnisnotiz

Abgeschlossen am 2026-05-24.

- `Minotaur` nutzt eine generische Erweiterung der öffentlichen `additional_subroutine`-Modifier: Quelle und Ziel können dasselbe gerezzte ICE sein, die Anzahl wird aus aktuell gerezzten installierten Code Gates/Walls berechnet, und derezzed/uninstall/move-Zustände fallen durch die Revalidierung aus der dynamischen Liste.
- `Riddler` nutzt ein generisches `corp_encounter`-Timing für aktivierte CardImplementation-Abilities und einen generischen Effekt für zusätzliche aktuelle Encounter-Subroutinen. Die Fähigkeit ist wiederholbar, solange die Korp je Nutzung `[2]` zahlen kann; jede Nutzung fügt eine weitere öffentliche `end_the_run`-Subroutine für diesen Encounter hinzu.
- LegalActions, PlayerView-Run-Quote, Break/Continue-Revalidierung, PublicEvent-Redaction und Replay/StateHash sind fokussiert getestet.
- Manifest und Scenario-Nachweis markieren nur `Minotaur` und `Riddler` zusätzlich als `human_playable`; Decklegalität, Formatlegalität und AI-Support bleiben aus.
