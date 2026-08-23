---
activityId: act-2026-08-23-shell-traders-domain-owner-review
status: inbox
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks:
  - Shell-Traders-State, Continuations und Host-Ports geprüft
---

# Shell-Traders-Domain-Owner prüfen

## Ziel

Prüfen, ob Set-aside, Counter-Countdown, MU-Choice, Installationsabschluss und
Start-of-turn-Auflösung aus `runner-special-trigger-execution.ts` in einen
eigenen Shell-Traders-Owner mit schmalem Host-Port gehören.

## Kontext und Quellen

- Regel-Engine-Review Batch 8 vom 2026-08-23.
- Aktivierungsauslöser: nächste Änderung an der Shell-Traders-Continuation.

## Scope

- Persistierten State, Choices, Checkpoints und Cleanup vollständig kartieren.
- Einen atomaren Domain-Schnitt bewerten und bei positiver Entscheidung paketieren.

## Nicht im Scope

- Änderung der Kartenregel oder Zielauswahl.
- Allgemeiner Runner-Spezialtrigger-Umbau.

## Akzeptanzkriterien

- [ ] Set-aside-, MU-, Choice- und Install-Continuation bleiben exakt gebunden.
- [ ] Es entsteht kein zweiter Installations- oder Memory-Owner.
- [ ] Replay, StateHash und Hidden-Info-Verträge bleiben erhalten.

## Ergebnisnotiz

Noch nicht bearbeitet.
