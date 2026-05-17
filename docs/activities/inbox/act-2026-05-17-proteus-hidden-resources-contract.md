---
activityId: act-2026-05-17-proteus-hidden-resources-contract
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Hidden-Resources-Vertrag vorbereiten

## Ziel

Die Proteus-Familie verdeckter Runner-Resources soll als eigenes Hidden-Info-Feature beschrieben werden, bevor einzelne Karten umgesetzt werden.

## Kontext und Quellen

- Grundlage: `data/rules/proteus-mechanics-coverage-2026-05-17.json`.
- Relevanter Cluster: `hidden_runner_resources`.
- Beispiele: `Airport Locker`, `Back Door to Netwatch`, `Bolt-Hole`, `Chiba Bank Account`, `Credit Subversion`, `HQ Mole`, `R&D Mole`, `Wired Switchboard`.

## Scope

- Installations-, Reveal-, Trash- und Aktivierungsvertrag für Hidden Resources definieren.
- PlayerView/PublicEvent/AIInput-Grenzen für verdeckte Runner-Resources festlegen.
- Aktivierungsfenster nach Trace, Damage, Access und Kosten-/Penalty-Zahlung trennen.
- Kleinsten ersten Umsetzungs-Slice vorschlagen.

## Nicht im Scope

- Keine Runtime-Implementierung.
- Keine Kartenfreigabe.
- Keine offiziellen Bilder oder Assetpfade.

## Akzeptanzkriterien

- [ ] Hidden-Resource-Zustände und Sichtbarkeit sind side-sicher definiert.
- [ ] Mindestens ein kleiner erster Hidden-Resource-Slice ist benannt.
- [ ] Tests für Reconnect, PublicEvents, AIInput und Replay/StateHash sind skizziert.

## Ergebnisnotiz

Noch offen.
