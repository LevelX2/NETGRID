---
activityId: act-2026-05-17-proteus-bad-publicity-loss-gate
status: done
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - docs/releases/proteus/bad-publicity-loss-gate-contract.md
  - docs/activities/inbox/act-2026-05-17-proteus-bad-publicity-engine-harness.md
checks:
  - rg -n "bad_publicity_loss_gate|PROTEUS_BAD_PUBLICITY_LOSS_GATE_CONTRACT|proteus-bad-publicity-engine-harness" docs data
  - rg -n "Proteus planning|no runtime implementation|Keine Proteus-Kartenpromotion|human_playable|ai_supported|deck_legal" docs/releases/proteus/bad-publicity-loss-gate-contract.md docs/activities/inbox/act-2026-05-17-proteus-bad-publicity-engine-harness.md
  - git diff --check
---

# Proteus Bad-Publicity-Loss-Gate klären

## Ziel

Die Proteus-Regel, dass die Korp bei 7 oder mehr Bad Publicity das Spiel verliert, soll als zentraler Game-End-Vertrag vorbereitet werden.

## Kontext und Quellen

- Grundlage: `data/rules/proteus-mechanics-coverage-2026-05-17.json`.
- Relevanter Cluster: `bad_publicity_loss_gate`.
- Beispiele: `Charity Takeover`, `Faked Hit`, `Frame-Up`, `Senatorial Field Trip`, `Subliminal Corruption`, `Back Door to Netwatch`, `Scaldan`.
- Mehrere Texte erwähnen Gleichzeitigkeit mit Victory Conditions.

## Scope

- Timing und Priorität des Bad-Publicity-Verlusts gegenüber Score-/Steal-/Flatline-/Agenda-Sieg beschreiben.
- PublicPayload, Ergebnisgrund, Replay und StateHash Anforderungen festlegen.
- Kleinsten Test-Harness ohne Proteus-Promotion vorschlagen.

## Nicht im Scope

- Keine Engine-Implementierung.
- Keine Proteus-Kartenpromotion.
- Keine AI-Strategie für Bad-Publicity-Decks.

## Akzeptanzkriterien

- [x] Game-End-Vertrag für Bad Publicity 7+ ist eindeutig beschrieben.
- [x] Gleichzeitige Sieg-/Niederlagenfälle sind als Testmatrix benannt.
- [x] Folgepaket für einen engen Engine-Harness ist ableitbar.

## Ergebnisnotiz

Abgeschlossen. `docs/releases/proteus/bad-publicity-loss-gate-contract.md` beschreibt den planning-only Vertrag für das Proteus-Cluster `bad_publicity_loss_gate`: Korp verliert bei 7+ Bad Publicity mit vorgeschlagenem `gameEndReason = bad_publicity_7`; der Runner gewinnt auch bei gleichzeitigen Score-/Steal-/Flatline-/Agenda-Sieg- oder Deckout-Konstellationen. Das Artefakt legt PublicPayload-/PlayerView-/Replay-/StateHash-Grenzen, Hidden-Info-Barrieren und eine spätere Harness-Testmatrix fest.

Als Folgepaket wurde `docs/activities/inbox/act-2026-05-17-proteus-bad-publicity-engine-harness.md` angelegt. Es bleibt bewusst eng: Engine-Harness und Tests ohne Proteus-Kartenpromotion, ohne Decklegalität und ohne AI-Hints.

Checks: Die relevanten `rg`-Prüfungen und `git diff --check` wurden für die Dokumentationsänderung vorgesehen und beim Abschluss ausgeführt.
