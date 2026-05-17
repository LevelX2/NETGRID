---
activityId: act-2026-05-17-proteus-variable-ice-contracts
status: in-progress
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-3
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus variable ICE-Verträge schneiden

## Ziel

Für Proteus-ICE mit variablen Rez-Zusatzkosten, dynamischer Stärke, dynamischen Subroutinen, Positionszählung oder Pass-Triggern soll ein kleiner Runtime-Vertrag vorbereitet werden.

## Kontext und Quellen

- Grundlage: `data/rules/proteus-mechanics-coverage-2026-05-17.json`.
- Relevante Cluster: `variable_rez_cost_strength_subroutines`, `installed_ice_relative_counting`, `pass_trigger_uninstall_ice`, `ice_repositioning`.
- Beispiele: `Digiconda`, `Homing Missile`, `Food Fight`, `Gatekeeper`, `Sandstorm`, `Caryatid`, `Credit Blocks`, `Datacomb`, `Walking Wall`.

## Scope

- Kartenliste und kleinsten umsetzbaren ersten ICE-Slice bestimmen.
- LegalAction-/applyAction-Vertrag für variable Rez-Zusatzkosten und daraus abgeleitete Stärke/Subroutinen skizzieren.
- Sichtbarkeit, PublicPayload, Reconnect, Replay und StateHash für variable Werte definieren.
- Testanforderungen pro Unterfamilie dokumentieren.

## Nicht im Scope

- Keine Runtime-Implementierung.
- Keine Proteus-Kartenpromotion.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Erster variabler Proteus-ICE-Slice ist klein und eindeutig abgegrenzt.
- [ ] Variable Werte sind deterministisch und replaybar beschrieben.
- [ ] Sichtbarkeits- und PublicPayload-Grenzen sind benannt.
- [ ] Folgepaket für Umsetzung oder weitere Regelklärung ist ableitbar.

## Ergebnisnotiz

Noch offen.
