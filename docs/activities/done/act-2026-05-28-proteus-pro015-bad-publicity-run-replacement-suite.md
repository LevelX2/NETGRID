---
activityId: act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO015
proReferences:
  - PRO015
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/events/frame-up.ts
  - packages/engine/src/card-implementations/proteus/runner/events/identity-donor.ts
  - packages/engine/src/card-implementations/proteus/runner/events/live-news-feed.ts
  - packages/engine/src/card-implementations/proteus/runner/events/senatorial-field-trip.ts
  - packages/engine/src/card-implementations/proteus/runner/events/subliminal-corruption.ts
  - packages/engine/src/index-tests/proteus/bad-publicity-run-replacement-suite.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/bad-publicity-run-replacement-suite.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
---

# PRO015: Bad-Publicity Run/Replacement Suite

## Zielkarten

- `onr_proteus_109_frame-up` Frame-Up
- `onr_proteus_112_identity-donor` Identity Donor
- `onr_proteus_113_live-news-feed` Live News Feed
- `onr_proteus_123_senatorial-field-trip` Senatorial Field Trip
- `onr_proteus_125_subliminal-corruption` Subliminal Corruption

## Ergebnis

PRO015 ist umgesetzt. Die fünf Zielkarten haben eigene CardImplementation-Dateien, Registry- und Coverage-Einträge sowie Manifest-Promotion auf `implemented`, `engine_supported`, `playable` und `human_playable`. `deck_legal`, `format_legal` und `ai_supported` bleiben `false`.

Der Proteus-Harness steht nach Umsetzung bei 154 Karten gesamt, 134 implementiert, 20 fehlend und 0 Drift.

## Generische Bausteine

- Run-scoped Bad-Publicity-Aftermath für Make-Run-Events.
- Run-History-Zähler für encountered Black ICE, während eines Runs gerezzte Black-Ops-Karten, liberierte Black-Ops-Agenden sowie getrashte Black-Ops- und Advertisement-Karten.
- Runner-Turn-History für erfolgreiche HQ- und R&D-Runs plus relevante Black-Ops-Access-Historie.
- Grip-basiertes, damage-event-gebundenes Meat-Damage-Replacement für Identity Donor.
- Stale-sichere Last-Rezzed-Black-ICE-History mit Corp-Choice "derez oder 2 Bad Publicity".

## Abschlussnotiz

Das bestehende Bad-Publicity-7+-Loss-Gate bleibt die einzige Game-End-Autorität. PRO015 ergänzt keine parallele Game-End-Logik und keine Proteus-ID-Sonderlogik in generischen Engine-Dateien.
