---
activityId: act-2026-05-17-proteus-bad-publicity-loss-gate
status: in-progress
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Game-End-Vertrag für Bad Publicity 7+ ist eindeutig beschrieben.
- [ ] Gleichzeitige Sieg-/Niederlagenfälle sind als Testmatrix benannt.
- [ ] Folgepaket für einen engen Engine-Harness ist ableitbar.

## Ergebnisnotiz

Noch offen.
