---
activityId: act-2026-05-24-proteus-phase-6e-runner-agenda-overadvance-events
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
releaseTarget: Proteus Phase 6e
proReferences:
  - PRO029
blockedBy:
  - act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline
  - successful-run-access-replacement-runner-agenda-point
  - event-run-sequence-action-debt-contract
  - next-agenda-access-agenda-point-modifier
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

## Blocker

Der Slice ist ohne neue generische Agenda-/Run-Event-Bausteine nicht vollständig und nicht regelkonform umsetzbar:

- `Blackmail` braucht ein successful-run access replacement für HQ, das den normalen Access unterdrückt und stattdessen 1 Runner-Agenda-Punkt vergibt. Die vorhandenen `successfulRunAccessReplacement`-Varianten decken nur Corp-Credit-Verlust, Runner-Spend-zu-Corp-Credit-Verlust, privaten R&D-Blick und Archives-Faceup-to-R&D ab.
- `Pirate Broadcast` braucht eine generische Sequenz "run on each data fort", Erfolg-/Fehlschlag-Aggregation über alle Teilruns, 1 Runner-Agenda-Punkt bei vollständigem Erfolg und Action-Debt über `forgoNextActionsPending`, falls ein Teilrun nicht erfolgreich ist. Vorhandene Event-Run-Bausteine starten Einzelruns und bilden keine mehrstufige Run-Queue mit Abschlussauswertung ab.
- `Promises, Promises` braucht einen einmaligen "next agenda access this turn"-Modifier, der beim nächsten Agenda-Zugriff 1 zusätzlichen Runner-Agenda-Punkt vergibt. Der vorhandene `gain_runner_event_agenda_point` ist ein unmittelbarer Play-Effekt mit Agenda-Point-Kontext, kein Access-Trigger.
- Alle drei Zielkarten hängen damit an der in 6a blockierten Agenda-/Steal-/Agenda-Point-Baseline, weil Agenda-Punkt-Vergabe und Victory-Priorität im Run-/Access-Kontext verbindlich geklärt werden müssen.

Es wurden bewusst keine Teil-CardImplementations promotet, weil der Slice sonst entweder Kartennamen-/ID-Sonderlogik oder unvollständige Access-/Agenda-Punkt-Semantik erzwingen würde.

## Ergebnisnotiz

Blockiert dokumentiert. Nächster unblockender Schritt ist ein generischer Vertrag für Runner-Agenda-Punkt-Gewinne im Access-/Successful-Run-Kontext, plus ein event-run sequence/action-debt contract für mehrstufige Runner-Events.
