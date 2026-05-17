---
activityId: act-2026-05-17-proteus-variable-ice-contracts
status: done
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-3
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - docs/derived/PROTEUS_VARIABLE_ICE_CONTRACT.md
  - docs/activities/inbox/act-2026-05-17-proteus-variable-ice-harness-slice.md
checks:
  - rg -n "Proteus Variable ICE Contract|proteus-variable-ice-harness-slice|act-2026-05-17-proteus-variable-ice-contracts" docs/derived docs/activities
  - rg -n "human_playable|deck_legal|ai_supported|format_legal|runtime implementation|Proteus-Kartenpromotion" docs/derived/PROTEUS_VARIABLE_ICE_CONTRACT.md docs/activities/inbox/act-2026-05-17-proteus-variable-ice-harness-slice.md
  - git diff --check
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

- [x] Erster variabler Proteus-ICE-Slice ist klein und eindeutig abgegrenzt.
- [x] Variable Werte sind deterministisch und replaybar beschrieben.
- [x] Sichtbarkeits- und PublicPayload-Grenzen sind benannt.
- [x] Folgepaket für Umsetzung oder weitere Regelklärung ist ableitbar.

## Ergebnisnotiz

Abgeschlossen am 2026-05-17. `docs/derived/PROTEUS_VARIABLE_ICE_CONTRACT.md` listet alle betroffenen Proteus-ICE-Familien und schneidet als kleinsten nicht-promotenden ersten Harness-Slice genau `Digiconda` und `Food Fight`: `Digiconda` deckt `X` als persistente Rez-Stärke ab, `Food Fight` deckt dynamische `End the run`-Subroutinen je 2 Zusatzcredits ab. Der Vertrag beschreibt LegalAction-/`applyAction`-Revalidierung, persistente StateHash-relevante Werte, PublicPayload, PlayerView/Reconnect, Replay und Tests fuer Subtyp-Wechsler, Homing Missile, relative ICE-Zählung, Pass-Trigger und Repositionierung als Folgefamilien.

Als Folgepaket wurde `docs/activities/inbox/act-2026-05-17-proteus-variable-ice-harness-slice.md` angelegt. Es ist bewusst nur ein späterer Umsetzungsschnitt fuer den nicht-promotenden Digiconda-/Food-Fight-Harness; keine Runtime-Implementierung, keine Proteus-Kartenpromotion, keine Decklegalität und keine AI-Hints wurden vorgenommen.
