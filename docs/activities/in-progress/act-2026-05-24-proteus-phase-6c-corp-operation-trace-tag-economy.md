---
activityId: act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy
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
releaseTarget: Proteus Phase 6c
proReferences:
  - PRO007
  - PRO026
blockedBy:
  - Data Sifters needs a Runner-last-turn history condition for trashed nodes; current CardConditionImplementation does not track or query subtype/card-type trash history from the Runner's previous turn.
  - Manhunt needs a trace success effect that gives tags equal to the margin by which Corp trace strength exceeded Runner link; current trace success effects support fixed tag amounts only.
  - Schlaghund Pointers needs a play condition for "Runner attempted a run this game" and an additional trace-cost model based on trace points above 0; current operation conditions cover last-turn run attempts but not this game, and trace cost is not declarative per base trace point.
  - Underworld Mole needs a Runner-last-turn installed-resource history condition and a trace success target limited to one of those resources, then trash plus tag; current trace success effects cannot target last-turn-installed resources.
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_047|onr_proteus_048|onr_proteus_050|onr_proteus_052|onr_proteus_053|Credit Consolidation|Data Sifters|Manhunt|Schlaghund Pointers|Underworld Mole\" data/cards/proteus-cards.json docs/releases/proteus data/manifests/proteus-card-support.json -S"
  - "rg -n \"runner_attempted_run_last_turn|trace|add_tags|trash_runner_resources_if_tagged|gain_credits|lose_credits|runner_is_tagged|runner.*last turn|on_play\" packages/engine/src/card-implementations/onr-v1/corp/operations packages/engine/src/card-implementations/proteus packages/engine/src/ability-engine packages/engine/src/game packages/engine/src/index.ts -S"
  - "git diff --check"
---

# Proteus Phase 6c: Corp Operation Trace/Tag/Economy

## Ziel

Die sichtbaren Proteus-Corp-Operations mit Trace-, Tag-, Credit- und Trash-Effekten über generische `on_play`- und Trace-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6c Corp Operation Trace/Tag/Economy`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Corp-Operation-, Trace-, Tag-, Credit- und Trash-Effektmuster.

## Zielkarten

- `onr_proteus_047_credit-consolidation` Credit Consolidation
- `onr_proteus_048_data-sifters` Data Sifters
- `onr_proteus_050_manhunt` Manhunt
- `onr_proteus_052_schlaghund-pointers` Schlaghund Pointers
- `onr_proteus_053_underworld-mole` Underworld Mole

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Corp-Operation-`on_play`, Trace-Fenster, Tag-/Credit-/Trash-Effekte.
- Wrong-Side-, stale-action-, Kosten-, Trace- und Zielrevalidierung.

## Nicht im Scope

- Keine Corp-ICE-Printed-Subroutines aus Phase 6b.
- Keine Asset-/Upgrade-Aktivierungen aus Phase 6d.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Trace- und Folgeeffekte sind LegalAction-basiert und in `applyAction` erneut validiert.
- [ ] Hidden-Info- und PublicPayload-Grenzen sind nachgewiesen.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Blockiert. `Credit Consolidation` ist isoliert als einfache Operation mit `gain_credits` umsetzbar, aber der vollständige 6c-Slice benötigt mehrere fehlende generische History- und Trace-Varianten:

- `Data Sifters` braucht eine Runner-last-turn-History für getrashte Nodes.
- `Manhunt` braucht einen Trace-Erfolg "Tags gleich Trace-Marge über Runner-Link" statt fester Tag-Anzahl.
- `Schlaghund Pointers` braucht eine "Runner attempted a run this game"-Condition und ein deklaratives Zusatzkostenmodell für Trace-Punkte über 0.
- `Underworld Mole` braucht eine Runner-last-turn-History für installierte Resources, eine Zielauswahl aus genau diesen Resources und einen Trace-Erfolg "trash target plus tag".
- Keine CardImplementation wurde fuer 6c angelegt und keine Manifest-/Coverage-Promotion vorgenommen.
