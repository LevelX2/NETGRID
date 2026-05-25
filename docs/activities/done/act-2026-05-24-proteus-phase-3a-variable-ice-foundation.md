---
activityId: act-2026-05-24-proteus-phase-3a-variable-ice-foundation
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
releaseTarget: Proteus Phase 3a
blockedBy: []
resultArtifacts: []
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "Proteus Phase 3a"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t "Proteus Phase 3a"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 3a"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/api/cards/catalog-data.test.ts -t "Proteus"
  - corepack pnpm --filter @netgrid/web typecheck
  - node JSON parse data/manifests/proteus-card-support.json and data/scenarios/proteus-phase-3a-variable-ice-foundation-smoke-2026-05-24.json
  - git diff --check
---

# Proteus Phase 3a: Variable ICE Foundation

## Ziel

Den bestehenden ID-spezifischen Digiconda-/Food-Fight-Harness in eine generische CardImplementation-kompatible `variableRez`-/`variableIceState`-Familie überführen.

## Zielkarten

- `onr_proteus_020_digiconda` Digiconda
- `onr_proteus_022_food-fight` Food Fight

## Scope

- Eigene CardImplementation-Dateien für beide Karten.
- Generische variable Rez-Familien für X-Stärke und bezahlte ETR-Subroutinen.
- Keine Proteus-ID-/Kartennamen-Branches in nachgelagerten Engine-/UI-/Catalog-/KI-Pfaden.
- LegalAction-/`applyAction`-Revalidierung für variable Zusatzkosten, Kosten, Ziel, Side und StateVersion.
- Effektive Stärke/Subroutinen in PlayerViews, PublicEvents, Replay und StateHash.

## Nicht im Scope

- Keine Homing-Missile-Trace-Folgeeffekte.
- Keine weiteren variablen/subtypwechselnden ICE.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Digiconda und Food Fight haben eigene CardImplementation-Dateien.
- [ ] Der alte ID-spezifische Harness ist durch generische CardImplementation-Bausteine ersetzt.
- [ ] Variable Werte werden aus frischen LegalActions revalidiert und StateHash-stabil gespeichert.
- [ ] Encounter, Break-LegalActions, PlayerViews, PublicEvents und Replay nutzen dieselben effektiven Werte.
- [ ] PublicPayloads enthalten öffentliche variable Rez-Werte, aber keine verdeckten ICE-Informationen.

## Ergebnisnotiz

Fertig umgesetzt.

- Digiconda und Food Fight haben eigene Proteus-CardImplementation-Dateien.
- Der alte Digiconda-/Food-Fight-spezifische Runtime-Harness wurde durch generische `variableRez`-Definitionen und persistierte `variableIceState`-Daten ersetzt.
- Digiconda nutzt `x_strength`; Food Fight nutzt `paid_end_the_run_subroutines`.
- `applyAction` revalidiert Side, StateVersion, Ziel, Kosten und variable Werte über frische LegalActions.
- Public Payloads enthalten nur öffentliche Variable-Rez-Werte; verdeckte Zonen bleiben redigiert.
- Replay und StateHash sind in den gezielten Engine-Tests stabil.
