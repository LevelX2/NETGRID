---
activityId: act-2026-05-24-proteus-phase-1b-dynamic-public-etr-ice
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
releaseTarget: Proteus Phase 1b
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts: []
checks: []
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

- [ ] Beide Karten haben per-card CardImplementation-Dateien.
- [ ] Dynamische Subroutinen werden in LegalActions und `applyAction` konsistent revalidiert.
- [ ] Stale Break-/Resolve-Actions gegen alte dynamische Subroutine-Listen werden abgelehnt.
- [ ] Replay reproduziert StateHash bei wechselnder Rezzed-ICE-Zahl.
- [ ] Keine `onr_proteus_*`-Branches in `packages/engine/src/index.ts`.

## Umsetzungshinweise

- Vor Umsetzung prüfen, ob die bestehende `additional_subroutine`-Familie auf source-self und dynamische Anzahl erweitert werden kann, statt eine parallele Familie anzulegen.
- Wenn Riddlers Wiederholbarkeit unklar bleibt, erst Regel-/Quellenklärung dokumentieren.

## Ergebnisnotiz

Noch offen.
