---
activityId: act-2026-05-24-proteus-phase-6d-corp-asset-upgrade-utility
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 6d
blockedBy: []
resultArtifacts: []
checks: []
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

Noch offen.
