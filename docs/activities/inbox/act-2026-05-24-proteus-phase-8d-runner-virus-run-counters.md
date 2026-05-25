---
activityId: act-2026-05-24-proteus-phase-8d-runner-virus-run-counters
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
releaseTarget: Proteus Phase 8d
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 8d: Runner Virus Run Counters

## Ziel

Runner-Virus-Programme mit successful-run-Triggern, zentralen Server-Scopes und purgefähigen Virus-Countern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8d Runner Virus Run Counters`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- Existing successful-run- und Counter-Muster.

## Zielkarten

- `onr_proteus_090_highlighter` Highlighter
- `onr_proteus_097_taxman` Taxman
- `onr_proteus_098_vienna-22` Vienna 22
- `onr_proteus_099_viral-pipeline` Viral Pipeline

## Scope

- Successful-run-Trigger und zentrale Server-Scopes.
- Virus-Counter-Erzeugung, Cleanup und Purge-Interaktion.
- Public-safe CounterDisplay und Replay-/StateHash-Stabilität.

## Nicht im Scope

- Keine Access-/Trash-Programme aus 8e.
- Keine Random-/Bad-Publicity-Longtails aus 8f.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Successful-run-Trigger sind LegalAction-/Timing-sicher.
- [ ] Purge-Interaktion und CounterDisplay sind getestet.
- [ ] Hidden-Info-, stale-action-, Replay-/StateHash- und Manifest-/Coverage-Nachweise sind vorhanden.

## Ergebnisnotiz

Noch offen.
