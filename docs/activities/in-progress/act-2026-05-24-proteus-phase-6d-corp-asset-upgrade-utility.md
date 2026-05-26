---
activityId: act-2026-05-24-proteus-phase-6d-corp-asset-upgrade-utility
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
releaseTarget: Proteus Phase 6d
proReferences:
  - PRO027
  - PRO028
blockedBy:
  - Cybertech Think Tank needs an advancement-counter payment window that increases another source's successful meat damage; current damage pipelines do not expose a generic source-bound "boost other source damage" reaction.
  - Department of Misinformation needs rez-during-expose-attempt plus paid expose prevention; no generic expose-attempt prevention/replacement window exists.
  - Government Contract and LDL Traffic Analyzers need advancement-counter activated temporary credits scoped to install/rez or the current trace attempt with end-of-turn/trace cleanup; current hosted/restricted credit families do not model this corp advancement-counter pool.
  - Panic Button needs an HQ-only install constraint and an activated draw ability legal only during runs on HQ; current activated timing has no declarative same-server run constraint for this pattern.
  - Raymond Ellison needs fort-scoped removal of any number of advancement counters from installed cards with temporary run credits and cleanup.
  - Siren needs rez-on-install plus a start-of-run redirect/replacement effect to force a run target onto Siren's fort.
  - Syd Meyer Superstores needs a corp activated ability that targets and trashes one rezzed ICE, then pays credits.
resultArtifacts:
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

Blockiert. Der Slice benoetigt mehrere neue generische Asset-/Upgrade-Utility-Bausteine:

- `Cybertech Think Tank` braucht eine advancement-counter-basierte Reaktion, die Meat damage einer anderen Quelle erhoeht.
- `Department of Misinformation` braucht ein Expose-Attempt-Fenster mit optionalem Rez und bezahlter Expose-Verhinderung.
- `Government Contract` und `LDL Traffic Analyzers` brauchen advancement-counter-aktivierte temporaere Credits mit enger Verwendungsbindung und Cleanup am Turn- beziehungsweise Trace-Ende.
- `Panic Button` braucht HQ-Installbindung und eine Run-on-HQ-aktivierte Draw-Faehigkeit.
- `Raymond Ellison` braucht eine fortweite Advancement-Counter-Entnahme mit temporaeren Run-Credits.
- `Siren` braucht einen Start-of-run-Redirect auf den installierten Fort.
- `Syd Meyer Superstores` braucht ein Corp-Zielfenster fuer eigenes rezzed ICE trashen plus Credit-Gain.

Keine CardImplementation wurde fuer 6d angelegt und keine Manifest-/Coverage-Promotion vorgenommen.
