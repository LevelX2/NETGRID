---
activityId: act-2026-05-24-proteus-phase-9d-data-fort-creation-lock
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
releaseTarget: Proteus Phase 9d
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/resources/precision-bribery.ts
  - packages/engine/src/game/turn/corp-data-fort-lock.ts
  - packages/engine/src/game/turn/corp-data-fort-lock.test.ts
  - data/manifests/proteus-card-support.json
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/turn/corp-data-fort-lock.test.ts src/game/turn/corp-install-actions.test.ts src/card-implementations/coverage.test.ts src/card-implementations/definition-descriptors.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/catalog test
  - corepack pnpm --filter @netgrid/catalog typecheck
  - node JSON parse data/manifests/proteus-card-support.json
---

# Proteus Phase 9d: Data-Fort Creation Lock

## Ziel

`Precision Bribery` über einen generischen, turngebundenen Data-Fort-Creation-Lock umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9d Data-Fort Creation Lock`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.

## Zielkarte

- `onr_proteus_146_precision-bribery` Precision Bribery

## Scope

- Lock auf Data-Fort-Erstellung und Installationspfade in neue Remotes.
- Kosten-/Trash-/Sabotage-Revalidierung.
- Turngebundener Lock-Cleanup.

## Nicht im Scope

- Keine allgemeine Remote-/Server-Neudefinition.
- Keine Hidden-Zone-Search oder Random-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [x] Die Zielkarte besitzt eine eigene CardImplementation-Datei.
- [x] Der Data-Fort-Creation-Lock ist generisch, turngebunden und StateHash-relevant.
- [x] Install-/Create-Remote-LegalActions werden korrekt gefiltert und in `applyAction` revalidiert.
- [x] Wrong-Side-, stale-action-, Kosten-/Trash-, Lock-Cleanup- und Replay-/StateHash-Tests sind vorhanden.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Erledigt. `Precision Bribery` deklariert einen generischen `new_data_fort_creation_lock`-Modifier. Die Korp erhält solange keine `new_remote`-Install-LegalActions für ICE oder Root-Karten; Installationen in bestehende Forts bleiben legal. Die Korp kann die Lock-Quelle in der Korp-Aktionsphase mit 1 Aktion und 4 Credits trashen; Kosten, Ziel, Side und stale Actions werden über LegalActions und Resolver revalidiert. PublicEvents zeigen die öffentliche Lock-Entfernung ohne versteckte Zoneninformationen. `data/manifests/proteus-card-support.json` markiert die Karte als `human_playable`, aber weiter nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`.
