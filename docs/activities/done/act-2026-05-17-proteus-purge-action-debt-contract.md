---
activityId: act-2026-05-17-proteus-purge-action-debt-contract
status: done
kind: concept
area: cards
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-4
releaseTarget: Proteus planning
blockedBy: []
outcome: completed
resultArtifacts:
  - docs/derived/PROTEUS_PURGE_ACTION_DEBT_CONTRACT.md
  - docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md
checks:
  - rg -n "PROTEUS_PURGE_ACTION_DEBT_CONTRACT|P-PAD|proteus_virus_purge|corpActionDebt|V0\\.99|Scaldan|Pipe|Doppelganger|Pattel|Advancement|StateHash|PublicPayload|AI-Hints|Kartenpromotion" docs/derived/PROTEUS_PURGE_ACTION_DEBT_CONTRACT.md docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md "KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md"
  - rg -n "Runtime-Implementierung|AI-Hints|Kartenpromotion|Decklegalitaet|deck_legal|human_playable|ai_supported" docs/derived/PROTEUS_PURGE_ACTION_DEBT_CONTRACT.md docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md
  - git diff --check
---

# Proteus Purge-/Action-Debt-Vertrag schneiden

## Ziel

Der Proteus-spezifische Purge-Vertrag soll vom vorhandenen V0.99-Main-Action-Purge getrennt und als eigener Timing-/Action-Debt-Vertrag beschrieben werden.

## Kontext und Quellen

- `docs/derived/PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md`
- `docs/releases/mvp/mvp-0-99-hosting-virus-counters/virus-purge-spec.md`
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

- [x] Proteus-Purge ist fachlich vom V0.99-Purge abgegrenzt.
- [x] Timing, Action-Debt und StateHash-Anforderungen sind beschrieben.
- [x] Visibility-/Replay-Tests sind skizziert.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/PROTEUS_PURGE_ACTION_DEBT_CONTRACT.md` beschreibt den separaten Proteus-Purge als Spezialeffekt-/Rez-ähnliches Timingfenster mit sofortiger Counter-Entfernung und kumulierbarem, StateHash-relevantem Korp-Action-Debt. Der Vertrag grenzt V0.99-Main-Action-Purge, Antibody-Folgezähler, Advancement-Counter, Pipe-/Scaldan-Reihenfolge, PublicPayloads, Replay/StateHash und spätere Testskizzen ab.

Der bestehende `PROTEUS_VIRUS_ANTIBODY_COUNTER_CONTRACT.md` verlinkt den neuen Vertrag, und der Wiki-Index nennt die Proteus-Planungsartefakte als planning-only Stand. Es wurden keine Runtime-Dateien, keine AI-Hints und keine Kartenpromotion geändert.
