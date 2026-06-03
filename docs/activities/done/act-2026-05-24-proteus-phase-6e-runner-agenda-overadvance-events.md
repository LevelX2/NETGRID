---
activityId: act-2026-05-24-proteus-phase-6e-runner-agenda-overadvance-events
status: done-reference
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 6e
proReferences:
  - PRO013
blockedBy: []
resultArtifacts:
  - docs/releases/proteus/README.md
checks:
  - rg onr_proteus_102/onr_proteus_116/onr_proteus_119 in Proteus cards, manifest and release docs
  - rg gain_runner_event_agenda_point/successfulRunAccessReplacement/forgoNextActionsPending/agenda history in engine
  - git diff --check
---

# Proteus Phase 6e: Runner Agenda/Overadvance Events

## Ziel

Die Runner-Events mit Agenda-, Run- und Overadvance-Bezug nach der Agenda-Baseline aus Phase 6a umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6e Runner Agenda/Overadvance Events`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Phase 6a Agenda-/Steal-/Overadvance-Baseline.

## Zielkarten

- `onr_proteus_102_blackmail` Blackmail
- `onr_proteus_116_pirate-broadcast` Pirate Broadcast
- `onr_proteus_119_promises-promises` Promises, Promises

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Runner-Events gegen Agenda-/Advancement-Zustände, agenda-point-/overadvance-bezogene Kosten und Effekte, Run-/Access-History falls benötigt.
- Keine Regelautorität außerhalb der Engine.

## Nicht im Scope

- Keine Agenda-Baseline-Karten aus Phase 6a.
- Keine Action-Debt-Longtails aus Phase 9, außer sie werden als Blocker dokumentiert.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Run-/Agenda-/Overadvance-Voraussetzungen sind LegalAction-basiert und in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Durch PRO013 erledigt. Die drei Phase-6e-Zielkarten sind als konkrete CardImplementation-Dateien umgesetzt und im Manifest engine-/human-playable markiert, ohne Decklegalität, Formatlegalität oder AI-Unterstützung.

Ergänzt wurden ein successful-run access replacement für Runner-Event-Agenda-Punkte, eine deterministische mehrstufige Data-Fort-Run-Sequenz mit Action-Debt bei Fehlschlag und ein einmaliger Next-Agenda-Access-Agenda-Punktmodifier für den Runner-Zug.

Diese alte Umbrella-Activity bleibt nur Statusreferenz. Die Zählung erfolgt über die neue Done-Activity `docs/activities/done/act-2026-05-28-proteus-pro013-agenda-steal-overadvance-suite.md`, damit PRO013 nicht doppelt gezählt wird.
