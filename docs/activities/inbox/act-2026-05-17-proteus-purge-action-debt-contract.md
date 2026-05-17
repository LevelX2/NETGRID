---
activityId: act-2026-05-17-proteus-purge-action-debt-contract
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

# Proteus Purge-/Action-Debt-Vertrag schneiden

## Ziel

Der Proteus-spezifische Purge-Vertrag soll vom vorhandenen V0.99-Main-Action-Purge getrennt und als eigener Timing-/Action-Debt-Vertrag beschrieben werden.

## Kontext und Quellen

- `docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md`
- `docs/derived/VIRUS_PURGE_0.99_SPEC.md`
- `docs/source/Netrunner Errata 1.70.md`

## Scope

- Timingfenster für Proteus-Virus-Removal klären.
- `forgo next three actions` als StateHash-relevanten Action-Debt modellieren.
- Kumulation, Start-of-turn-Reihenfolge, Pipe-/Scaldan-Interaktion und PublicPayloads beschreiben.
- Abgrenzung: Antibody-Folgezähler und Advancement-Counter bleiben nicht purgefähig.

## Nicht im Scope

- Keine Runtime-Implementierung.
- Keine AI-Hints.
- Keine Kartenpromotion.

## Akzeptanzkriterien

- [ ] Proteus-Purge ist fachlich vom V0.99-Purge abgegrenzt.
- [ ] Timing, Action-Debt und StateHash-Anforderungen sind beschrieben.
- [ ] Visibility-/Replay-Tests sind skizziert.

## Ergebnisnotiz

Noch offen.
