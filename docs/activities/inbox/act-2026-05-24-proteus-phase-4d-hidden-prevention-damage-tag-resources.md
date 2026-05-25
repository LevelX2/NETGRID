---
activityId: act-2026-05-24-proteus-phase-4d-hidden-prevention-damage-tag-resources
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
releaseTarget: Proteus Phase 4d
blockedBy:
  - act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 4d: Hidden Prevention, Damage and Tag Resources

## Ziel

Die verdeckten Prevention-, Damage-, Trace-/Tag- und Bad-Publicity-Resources als CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4d Hidden Prevention/Damage/Tag Resources`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/bad-publicity-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_129_back-door-to-netwatch` Back Door to Netwatch
- `onr_proteus_132_bolt-hole` Bolt-Hole
- `onr_proteus_140_expendable-family-member` Expendable Family Member
- `onr_proteus_141_get-ready-to-rumble` Get Ready to Rumble
- `onr_proteus_154_wired-switchboard` Wired Switchboard

## Scope

- Damage-, Trace-, Tag- und Resource-Trash-Prevention generisch in Timingfenster integrieren.
- Bad-Publicity-Wiederverwendung für `Back Door to Netwatch` ohne ID-Branch nutzen.
- Source-redigierte PublicEvents für nicht vollständig öffentliche Aktivierungskontexte absichern.

## Nicht im Scope

- Keine Economy-/Bank-, Access- oder Sabotage-Familien.
- Keine AI-Support-Promotion und keine UI-Regelautorität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Prevention-/Replacement-Effekte nutzen generische Hidden-Resource-Bausteine.
- [ ] Trace-, Damage-, Tag- und Bad-Publicity-Änderungen werden in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.

## Ergebnisnotiz

Noch offen.
