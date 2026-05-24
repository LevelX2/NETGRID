---
activityId: act-2026-05-24-proteus-phase-1a-reuse-only-baseline
status: inbox
kind: concept
area: cards
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 1a
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Alle fünf Zielkarten haben eigene per-card CardImplementation-Dateien oder eine dokumentierte Migration aus vorhandener Umsetzung.
- [ ] `Toughonium™ Wall` hat keinen Legacy-plus-CardImplementation-Doppeleffekt.
- [ ] Region-Baseline und Agenda-Difficulty wirken nur am selben Fort und nur öffentlich nachvollziehbar.
- [ ] `Streetware Distributor` erzeugt, nimmt und projiziert Hosted Credits side-sicher.
- [ ] Nicht-Zielkarten bleiben blockiert, nicht decklegal, nicht formatlegal und nicht `ai_supported`.
- [ ] Engine-Smoke, Visibility-, Replay-/StateHash- und Web-Catalog-No-Promotion-Checks sind dokumentiert.

## Umsetzungshinweise

- Dies ist der erste abarbeitbare Ersatz für das blockierte Sammelpaket.
- Wenn ein vorhandener Region- oder Hosted-Credit-Baustein in der Runtime nicht vollständig interpretiert wird, diesen Slice nicht breiter ziehen, sondern gezielt eine kleine generische Extension innerhalb dieses Pakets dokumentieren.

## Ergebnisnotiz

Noch offen.
