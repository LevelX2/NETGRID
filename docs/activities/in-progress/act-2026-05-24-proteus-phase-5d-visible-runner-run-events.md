---
activityId: act-2026-05-24-proteus-phase-5d-visible-runner-run-events
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
releaseTarget: Proteus Phase 5d
blockedBy:
  - Generic event-initiated run flags do not yet support "cannot use noisy icebreakers during that run"; All-Hands and Rush Hour cannot be promoted with accessCount alone.
  - Run-encounter interventions currently model installed sources such as Smarteye; Decoy Signal needs source-bound event-run exposure on every unrezzed ICE approach with jack-out-before-rez cleanup.
  - Successful-run access replacements do not yet support "do not access; trash all rezzed ICE on the attacked fort; Corp gives Runner three tags" for Demolition Run.
  - The fully-broken-passed-ICE derez window currently requires an installed program source; Disgruntled Ice Technician needs the same family as a temporary event-run follow-up.
  - The engine tracks a boolean successful-run-this-turn flag, but not the exact successful data fort for later event play; Remote Detonator cannot revalidate its target fort yet.
  - Damage-prevention sources are installed source based; Weefle Initiation needs a temporary, run-bound prevention pool that expires at run end.
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-5d-visible-runner-run-events.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_101|onr_proteus_104|onr_proteus_105|onr_proteus_106|onr_proteus_107|onr_proteus_120|onr_proteus_121|onr_proteus_122|onr_proteus_127\" data/cards/proteus-cards.json data/manifests/proteus-card-support.json docs/releases/proteus -S"
  - "rg -n \"make_run|traceAwareRun|successfulRunAccessReplacement|freeTrashAccessZones|expose_installed|runner.*tag|prevent.*tag|access_count|followup|run-end\" packages/engine/src packages/engine/src/card-implementations -S"
  - "git diff --check"
---

# Proteus Phase 5d: Visible Runner Run Events

## Ziel

Die sichtbaren Proteus-Run-Events über generische `make_run`- und rungebundene Follow-up-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5d Visible Runner Run Events`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Run-/Access-/Expose-/Trash-/Tag-/Damage-Muster.

## Zielkarten

- `onr_proteus_101_all-hands` All-Hands
- `onr_proteus_104_decoy-signal` Decoy Signal
- `onr_proteus_105_demolition-run` Demolition Run
- `onr_proteus_106_disgruntled-ice-technician` Disgruntled Ice Technician
- `onr_proteus_107_drone-for-a-day` Drone for a Day
- `onr_proteus_120_reconnaissance` Reconnaissance
- `onr_proteus_121_remote-detonator` Remote Detonator
- `onr_proteus_122_rush-hour` Rush Hour
- `onr_proteus_127_weefle-initiation` Weefle Initiation

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- `make_run`-Erweiterungen, rungebundene Follow-up-Flags, Expose-/Trash-/Tag-/Damage-/Access-Folgefenster und Run-End-Cleanup.
- Keine Regelautorität außerhalb der Engine.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine einfachen Economy-/Draw-Karten aus Phase 5c.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Runstart, Runziel, Folgeflags und Cleanup sind deterministisch und revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Blockiert. Die Zielkarten teilen zwar die sichtbare Runner-Run-Event-Familie, benötigen aber mehrere generische, source-bound Run-Follow-up-Bausteine, die aktuell nicht vorhanden sind:

- `All-Hands` und `Rush Hour` koennen ihre Zusatz-Access-Anzahl ueber bestehendes `accessCount` ausdruecken, brauchen aber zusaetzlich ein rungebundenes Verbot fuer noisy Icebreaker-Nutzung. Ohne diesen Flag waere die Umsetzung regelwidrig.
- `Decoy Signal` kann nicht sauber durch den installierten `Smarteye`-Hook ersetzt werden, weil der Effekt als Event fuer genau diesen Run auf jede Annäherung an unrezzed ICE wirkt.
- `Demolition Run` und `Remote Detonator` brauchen ein generisches Rezzed-ICE-Trash-auf-Fort-Folgefenster mit Access-Unterdrueckung beziehungsweise erfolgreichem-Data-Fort-History-Target und drei Tags.
- `Disgruntled Ice Technician` braucht die vorhandene Disintegrator-Mechanik als temporären Event-Run-Follow-up statt als installierte Programmfaehigkeit.
- `Reconnaissance` braucht einen rungebundenen Trigger auf Corp-Rez waehrend dieses Runs.
- `Weefle Initiation` braucht einen temporären Damage-Prevention-Pool bis Run-Ende.
- `Drone for a Day` ist isoliert als Gain-plus-Tag-Event machbar, wird aber nicht einzeln promotet, weil der Slice als Ganzes nicht alle Akzeptanzkriterien erfuellen kann.

Keine CardImplementation wurde fuer 5d angelegt und keine Manifest-/Coverage-Promotion vorgenommen.
