---
activityId: act-2026-05-24-proteus-phase-3-variable-complex-ice
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 3
blockedBy:
  - act-2026-05-24-proteus-phase-2-bad-publicity-cards
resultArtifacts: []
checks: []
---

# Proteus Phase 3: Variable und komplexe ICE

## Ziel

Die variable und komplexe Proteus-ICE-Familie in CardImplementation-kompatible generische Abstraktionen überführen und danach die Phase-3-Karten in eigenen Dateien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/release-slicing-plan.md`, Abschnitte `Phase 3`, `Slice 3` und `CardImplementation- und Ability-Bedarfsanalyse`.
- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Abschnitt `Phase 3: Variable and Complex ICE`; dieses Paket ist vor Codearbeit in die dort beschriebenen Slices 3a bis 3e zu zerlegen.
- `docs/releases/proteus/variable-ice-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `docs/activities/done/act-2026-05-17-proteus-variable-ice-contracts.md`.
- `docs/activities/done/act-2026-05-17-proteus-variable-ice-harness-slice.md`.

## Zielkarten

- `onr_proteus_012_bug-zapper` Bug Zapper
- `onr_proteus_013_caryatid` Caryatid
- `onr_proteus_017_credit-blocks` Credit Blocks
- `onr_proteus_018_datacomb` Datacomb
- `onr_proteus_019_death-yo-yo` Death Yo-Yo
- `onr_proteus_020_digiconda` Digiconda
- `onr_proteus_021_dog-pile` Dog Pile
- `onr_proteus_022_food-fight` Food Fight
- `onr_proteus_023_galatea` Galatea
- `onr_proteus_024_gatekeeper` Gatekeeper
- `onr_proteus_025_homing-missile` Homing Missile
- `onr_proteus_026_hunting-pack` Hunting Pack
- `onr_proteus_028_lesser-arcana` Lesser Arcana
- `onr_proteus_029_marionette` Marionette
- `onr_proteus_030_mastermind` Mastermind
- `onr_proteus_033_mobile-barricade` Mobile Barricade
- `onr_proteus_036_sandstorm` Sandstorm
- `onr_proteus_037_scaffolding` Scaffolding
- `onr_proteus_039_sphinx-2006` Sphinx 2006
- `onr_proteus_040_sumo-2008` Sumo 2008
- `onr_proteus_042_tumblers` Tumblers
- `onr_proteus_043_twisty-passages` Twisty Passages
- `onr_proteus_044_walking-wall` Walking Wall

## Scope

- Bestehenden ID-spezifischen Digiconda/Food-Fight-Harness in eine generische CardImplementation-Familie überführen.
- Abstraktionen für variable Rez-Familien bereitstellen: X-Stärke, bezahlte ETR-Subroutinen, alternative Subtypen.
- Danach getrennte Unterfamilien für relative ICE-Zählung, Pass-Trigger mit HQ-Rückführung und ICE-Repositionierung schneiden.
- Pro Zielkarte eigene CardImplementation-Datei, Tests und Manifest-/Coverage-Nachweis.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Proteus-Virus-/Purge- oder Random-Longtail-Karten außerhalb der Zielmenge.
- Keine pauschale KI-Bewertung variabler Proteus-ICE.
- Keine neuen kartenindividuellen ID-Branches in `packages/engine/src/index.ts`.

## Akzeptanzkriterien

- [ ] Variable Rez-Werte werden aus frischen LegalActions revalidiert und in StateHash-relevantem Engine-State gespeichert.
- [ ] Digiconda/Food Fight und spätere variable ICE deklarieren ihre Familie in per-card CardImplementation-Dateien.
- [ ] Encounter, Break-LegalActions, PlayerViews, PublicEvents und Replay nutzen dieselbe effektive Stärke/Subroutinenliste.
- [ ] Relative Zählung, Pass-Trigger und Repositionierung sind als generische Familien oder bewusst getrennte Folgepakete dokumentiert.
- [ ] Keine private unrezzed ICE-Identität oder abgelehnte Rez-Varianten leaken.

## Umsetzungshinweise

- Der vorhandene Harness ist technische Vorarbeit, aber vor echter Promotion nicht die Zielarchitektur.
- Homing Missile nicht zusammen mit dem ersten X-Stärke-Refactor überziehen; Trace-Folgeeffekt gesondert absichern.
- Bei Repositionierung stabile ICE-Reihenfolge, Reconnect und StateHash früh testen.

## Ergebnisnotiz

Noch offen.
