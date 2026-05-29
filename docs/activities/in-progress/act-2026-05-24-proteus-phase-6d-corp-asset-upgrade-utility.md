---
activityId: act-2026-05-24-proteus-phase-6d-corp-asset-upgrade-utility
status: resolved-by-done-activity
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 6d
proReferences:
  - PRO014
blockedBy: []
resultArtifacts:
  - docs/activities/done/act-2026-05-28-proteus-pro014-corp-asset-upgrade-utility-suite.md
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-6d-corp-asset-upgrade-utility.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_055|onr_proteus_056|onr_proteus_059|onr_proteus_061|onr_proteus_067|onr_proteus_071|onr_proteus_074|onr_proteus_076|Cybertech Think Tank|Department of Misinformation|Government Contract|LDL Traffic Analyzers|Panic Button|Raymond Ellison|Siren|Syd Meyer Superstores\" data/cards/proteus-cards.json docs/releases/proteus data/manifests/proteus-card-support.json -S"
  - "rg -n \"accessEffects|trashPreventionSources|corpUtility|start_of_corp_turn|start_of_runner_turn|on_rez|on_access|trash_cost|prevent.*trash|successful run|draw_cards|gain_credits|take_hosted_credits|source_has_hosted_credits\" packages/engine/src/card-implementations packages/engine/src/ability-engine packages/engine/src/game packages/engine/src/index.ts -S"
  - "git diff --check"
---

# Proteus Phase 6d: Corp Asset/Upgrade Utility

## Ziel

Die Proteus-Corp-Assets und Upgrades mit Rez-, Aktivierungs-, Access-Trash- und servergebundenen Utility-Effekten umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6d Corp Asset/Upgrade Utility`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Asset-/Upgrade-Rez-, Access-, Trash-Prevention-, Server- und Corp-Utility-Muster.

## Zielkarten

- `onr_proteus_055_cybertech-think-tank` Cybertech Think Tank
- `onr_proteus_056_department-of-misinformation` Department of Misinformation
- `onr_proteus_059_government-contract` Government Contract
- `onr_proteus_061_ldl-traffic-analyzers` LDL Traffic Analyzers
- `onr_proteus_067_panic-button` Panic Button
- `onr_proteus_071_raymond-ellison` Raymond Ellison
- `onr_proteus_074_siren` Siren
- `onr_proteus_076_syd-meyer-superstores` Syd Meyer Superstores

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Asset-/Upgrade-Rez- und Aktivierungsfähigkeiten, Access-Trash-/Prevent-Fenster, Run- oder Server-gebundene Trigger, öffentliche Ergebnislabels.
- LegalAction- und `applyAction`-Revalidierung für Kosten, Ziele, Access-Kontext und Timing.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Corp-Operations oder ICE aus Phase 6b und 6c.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Access- und Server-Kontext leaken keine verdeckten Karten oder künftigen Queue-Einträge.
- [ ] Kosten-, Ziel-, Timing-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

PRO014 ist über die neue Done-Activity `act-2026-05-28-proteus-pro014-corp-asset-upgrade-utility-suite` abgeschlossen. Diese Umbrella-Activity bleibt als historische Phase-6d-Referenz bestehen und zählt keine Karten zusätzlich.

Umgesetzt wurden acht CardImplementation-Dateien, Registry-/Coverage-/Manifest-Promotion und die generischen Bausteine für HQ-/Remote-Installbindung, temporäre Corp-Credit-Pools, Corp-Run-/Trace-Aktivierungsfenster, Start-of-run-Redirect und eigenes rezzed ICE als Corp-Ziel.
