---
activityId: act-2026-05-24-proteus-phase-6b-corp-ice-simple-resolver
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 6b
proReferences:
  - PRO006
  - PRO025
blockedBy:
  - Chihuahua needs a printed trace success effect that deals preventable Net damage; current trace success effects support tags, counters, end-run, hardware/program trash, run locks and unpreventable meat damage, but not preventable net/core damage.
  - Coyote needs a run-duration future-ICE strength modifier that the Runner may cancel by paying while passing the source ICE; current run-duration strength subroutines have no pass-window payment/cancel clause.
  - Washed-Up Solo Construct needs "Trash a program unless Runner pays 1"; current printed trash_program has no runner-payment avoidance branch.
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-6b-corp-ice-simple-resolver.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_011|onr_proteus_014|onr_proteus_015|onr_proteus_016|onr_proteus_027|onr_proteus_032|onr_proteus_038|onr_proteus_045|Brain Wash|Chihuahua|Colonel Failure|Coyote|Iceberg|Misleading Access Menus|Snowbank|Washed-Up Solo Construct\" data/cards/proteus-cards.json docs/releases/proteus data/manifests/proteus-card-support.json -S"
  - "rg -n \"CardPrintedSubroutineImplementation|run_duration_ice_strength|trash_program|end_the_run_unless_runner_pays|add_current_encounter_additional_subroutine|traceSuccessEffect\" packages/engine/src/ability-engine packages/engine/src/card-implementations packages/engine/src/game packages/engine/src/index.ts -S"
  - "git diff --check"
---

# Proteus Phase 6b: Corp ICE Simple Resolver

## Ziel

Die einfachen öffentlichen Proteus-Corp-ICE-Resolver über generische Printed-Subroutine- und Encounter-Bausteine umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6b Corp ICE Simple Resolver`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Printed-Subroutine-Muster für Trace, Tags, Damage, Trash/Forfeit, Credits und End-the-Run.

## Zielkarten

- `onr_proteus_011_brain-wash` Brain Wash
- `onr_proteus_014_chihuahua` Chihuahua
- `onr_proteus_015_colonel-failure` Colonel Failure
- `onr_proteus_016_coyote` Coyote
- `onr_proteus_027_iceberg` Iceberg
- `onr_proteus_032_misleading-access-menus` Misleading Access Menus
- `onr_proteus_038_snowbank` Snowbank
- `onr_proteus_045_washed-up-solo-construct` Washed-Up Solo Construct

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Printed Subroutines für Trace, Tags, Damage, Trash/Forfeit, Credits und ETR.
- Break-Projektion, Subroutine-Resolve-Revalidierung und öffentliche Ergebnislabels.

## Nicht im Scope

- Keine Variable-ICE-Mechaniken aus Phase 3.
- Keine Operation-, Agenda- oder Asset-/Upgrade-Resolver aus Phase 6a, 6c und 6d.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Subroutine-Kosten, Ziele, Trace-Choices und Break-Status werden in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Trace-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Blockiert. Mehrere Zielkarten passen in bestehende Familien, aber der Slice ist als Ganzes nicht vollstaendig umsetzbar:

- `Brain Wash`, `Colonel Failure`, `Misleading Access Menus`, `Snowbank` und Teile von `Iceberg` sind voraussichtlich mit vorhandenen `damage`, `trash_program`, `end_the_run_unless_runner_pays`, Lifecycle-`on_rez` und Riddler-artigem `add_current_encounter_additional_subroutine` abbildbar.
- `Chihuahua` braucht aber eine Trace-Erfolg-Folge fuer preventable Net damage; die aktuelle Trace-Success-Union deckt diesen Effekt nicht ab.
- `Coyote` braucht eine rungebundene Future-ICE-Strength-Erhoehung mit Runner-Zahlungsfenster beim Passieren genau dieser Quelle. Der vorhandene `run_duration_ice_strength`-Baustein hat keine solche Cancel-/Pass-Window-Revalidierung.
- `Washed-Up Solo Construct` braucht ein generisches "Runner zahlt sonst trash program"-Printed-Subroutine-Fenster; `trash_program` ist aktuell unmittelbar.
- Keine CardImplementation wurde fuer 6b angelegt und keine Manifest-/Coverage-Promotion vorgenommen.
