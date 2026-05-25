---
activityId: act-2026-05-24-proteus-phase-8b-corp-antibody-access
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
releaseTarget: Proteus Phase 8b
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/assets/bel-digmo-antibody.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/doppelganger-antibody.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/pattel-antibody.ts
  - packages/engine/src/card-implementations/proteus/corp/assets/stereogram-antibody.ts
  - packages/engine/src/game/counters/proteus-antibody-access.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
  - docs/releases/proteus/virus-antibody-counter-contract.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/counters/proteus-antibody-access.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/access/access-effect-handlers.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles CardImplementation coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - git diff --check
---

# Proteus Phase 8b: Corp Antibody/Access

## Ziel

Die Corp-Antibody-Assets mit Access- und Counter-Effekten nach der 8a-Counter-Taxonomie umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8b Corp Antibody/Access`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_054_bel-digmo-antibody` Bel-Digmo Antibody
- `onr_proteus_057_doppelganger-antibody` Doppelganger Antibody
- `onr_proteus_068_pattel-antibody` Pattel Antibody
- `onr_proteus_075_stereogram-antibody` Stereogram Antibody

## Scope

- Access- und scored/installed Counter-Effekte.
- Antibody-Counter und öffentliche Counter-Displays.
- Purge-Unberührbarkeit von Antibody-Countern.

## Nicht im Scope

- Keine Runner-Virus-Programme aus 8d bis 8f.
- Keine Agenda-Karte aus 8c.
- Keine Random-Longtails.

## Akzeptanzkriterien

- [x] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [x] Access-/Counter-Fenster sind LegalAction-basiert und in `applyAction` revalidiert.
- [x] Antibody-Counter sind public-safe sichtbar und nicht purgefähig.
- [x] Hidden-Info-, stale-action-, Choice-, Replay-/StateHash- und Manifest-/Coverage-Nachweise sind vorhanden.

## Ergebnisnotiz

Phase 8b ist umgesetzt: Bel-Digmo Antibody, Doppelganger Antibody, Pattel Antibody und Stereogram Antibody besitzen eigene CardImplementation-Dateien und verwenden generische Access-, Counter-, Shuffle- und Runner-Counter-Lifecycle-Bausteine. Doppelganger-/Pattel-Antibody-Counter sind sichtbar, nicht Teil der purgefähigen Runner-Virus-Taxonomie und werden über LegalAction-/Choice-Pfade erneut validiert. Bel-Digmo/Stereogram nutzen eine Hidden-Zone-Barriere für Shuffle-in-R&D-PublicPayloads. Manifest, Registry, Coverage und Proteus-Gate-Dokumentation sind aktualisiert.
