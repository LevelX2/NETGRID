---
activityId: act-2026-05-17-proteus-hidden-resources-contract
status: done
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-2
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md
  - docs/activities/inbox/act-2026-05-17-proteus-hidden-resource-foundation-slice.md
checks:
  - rg -n "hidden_runner_resources|onr_proteus_128|onr_proteus_154" data/rules/proteus-mechanics-coverage-2026-05-17.json docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md
  - rg -n "hidden_resource_foundation_no_card_promotion|Keine Proteus-Kartenfreigabe|keine Runtime-Resolver" docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md docs/activities/inbox/act-2026-05-17-proteus-hidden-resource-foundation-slice.md
  - git diff --check
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

- [x] Hidden-Resource-Zustände und Sichtbarkeit sind side-sicher definiert.
- [x] Mindestens ein kleiner erster Hidden-Resource-Slice ist benannt.
- [x] Tests für Reconnect, PublicEvents, AIInput und Replay/StateHash sind skizziert.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md` definiert den gemeinsamen Vertrag für Proteus-Hidden-Runner-Resources: verdeckte Installation im Runner-Rig, Reveal/Trash bei Aktivierung oder erfolgreichem Trash, redigierte Korp-PlayerViews, PublicEvent- und AIInput-Grenzen sowie getrennte Fenster für Trace, Damage, Access und Kosten-/Penalty-Zahlung. Der erste kleine Folge-Slice `hidden_resource_foundation_no_card_promotion` ist als Activity `docs/activities/inbox/act-2026-05-17-proteus-hidden-resource-foundation-slice.md` angelegt. Keine Runtime-Dateien, Kartenfreigaben, AI-Hints, Deck-Legalität oder Assets wurden geändert.
