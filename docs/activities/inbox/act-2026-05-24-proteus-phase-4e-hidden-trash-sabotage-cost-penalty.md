---
activityId: act-2026-05-24-proteus-phase-4e-hidden-trash-sabotage-cost-penalty
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
releaseTarget: Proteus Phase 4e
blockedBy:
  - act-2026-05-24-proteus-phase-4a-hidden-resource-activation-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 4e: Hidden Trash, Sabotage and Cost Penalty

## Ziel

Die verdeckten Trash-, Forfeit-, Sabotage- und Cost-Penalty-Resources als CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4e Hidden Trash/Sabotage/Cost Penalty`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_136_credit-subversion` Credit Subversion
- `onr_proteus_137_death-from-above` Death from Above
- `onr_proteus_145_mercenary-subcontract` Mercenary Subcontract

## Scope

- Trash-, Forfeit-, Sabotage- und Kostenstrafe-Familien generisch als Hidden-Resource-Aktivierungen modellieren.
- Zielwahl gegen installierte Karten und deterministische Kostenbehandlung absichern.
- Öffentliche Labels und PublicEvents so redigieren, dass nicht aktivierte Hidden Resources verborgen bleiben.

## Nicht im Scope

- Keine Economy-/Bank-, Access- oder Prevention-Familien.
- Keine offiziellen Assets und keine externen Kartendatenbank-Abhängigkeiten.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Trash-/Sabotage-/Cost-Penalty-Effekte nutzen generische Hidden-Resource-Bausteine.
- [ ] Kosten und Ziele werden aus frischen LegalActions in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.

## Ergebnisnotiz

Noch offen.
