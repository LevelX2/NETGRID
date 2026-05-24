---
activityId: act-2026-05-24-proteus-phase-1g-post-pass-derez-utility
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
releaseTarget: Proteus Phase 1g
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts: []
checks: []
---

# Proteus Phase 1g: Post-Pass Derez Utility

## Ziel

`Disintegrator` als eigenen Runner-Programm-Schnitt planen, weil die Karte einen präzisen Post-Pass-/Fully-Broken-Run-Zustand braucht.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarte

- `onr_proteus_085_disintegrator` Disintegrator

## Benötigte Funktionsbausteine

- Installed Runner program baseline:
  - Installkosten und MU aus CardDefinition.
  - Karte bleibt nicht decklegal und nicht `ai_supported`.
- Post-pass fully-broken hook:
  - Timing nur, wenn Runner gerade ein ICE erfolgreich passiert hat.
  - Bedingung: Runner hat alle Subroutinen dieses ICE gebrochen.
  - Hook speichert das gerade passierte ICE als public target.
- Paid ability during run:
  - Kosten `[2]`.
  - Quelle muss installiert, aktiv und vom Runner kontrolliert sein.
  - Ziel ist das gerade passierte ICE aus dem Hook, nicht ein frei wählbares anderes ICE.
- Effects:
  - Ziel-ICE derezzen.
  - aktuellen Run beenden.
- Cleanup:
  - Hook-Zustand endet nach Nutzung, nach anderem Timingfenster oder am Run-Ende.

## Nicht im Scope

- Keine allgemeinen Icebreaker-Pump/Break-Programme.
- Keine Virus-/Purge- oder Random-Karten.
- Keine variable ICE-Umsetzung.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] `Disintegrator` hat eine per-card CardImplementation-Datei.
- [ ] Ability erscheint nur nach vollständig gebrochenem und passiertem ICE.
- [ ] Kosten, Source, Timing und Target werden in `applyAction` revalidiert.
- [ ] Derez und Run-Ende sind PublicEvent-, Replay- und StateHash-stabil.
- [ ] Ability erscheint nicht nach nicht vollständig gebrochenem ICE, nicht außerhalb eines Runs und nicht gegen stale Targets.

## Umsetzungshinweise

- Bestehende Break-/Pass-Zustände genau prüfen, bevor ein neuer Hook eingeführt wird.
- Wenn "alle Subroutinen gebrochen" aktuell nicht persistiert wird, zuerst einen generischen side-sicheren Encounter-Summary-Baustein schneiden.

## Ergebnisnotiz

Noch offen.
