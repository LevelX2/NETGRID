---
activityId: act-2026-05-28-proteus-pro013-agenda-steal-overadvance-suite
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: PRO013
proReferences:
  - PRO013
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/corp/agendas/corporate-headhunters.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/fetal-ai.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/marked-accounts.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/project-zurich.ts
  - packages/engine/src/card-implementations/proteus/corp/agendas/world-domination.ts
  - packages/engine/src/card-implementations/proteus/runner/events/blackmail.ts
  - packages/engine/src/card-implementations/proteus/runner/events/pirate-broadcast.ts
  - packages/engine/src/card-implementations/proteus/runner/events/promises-promises.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "PRO013"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/access/access-flow.test.ts src/game/access/access-effect-handlers.test.ts src/game/corp/scored-agenda-flow.test.ts src/game/corp/scored-agenda-abilities.test.ts src/game/run/run-access-transition.test.ts src/game/run/run-end-cleanup.test.ts src/game/turn/runner-main-actions.test.ts src/game/damage/prevention.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Proteus PRO013: Agenda/Steal/Overadvance Suite

## Ergebnis

PRO013 ist umgesetzt. Acht Proteus-Karten besitzen konkrete CardImplementation-Dateien, sind registriert und im Manifest engine-/human-playable markiert. Keine Karte wurde decklegal, formatlegal oder AI-unterstützt gesetzt.

## Karten

- `onr_proteus_003_corporate-headhunters` Corporate Headhunters
- `onr_proteus_004_fetal-ai` Fetal AI
- `onr_proteus_005_marked-accounts` Marked Accounts
- `onr_proteus_008_project-zurich` Project Zurich
- `onr_proteus_010_world-domination` World Domination
- `onr_proteus_102_blackmail` Blackmail
- `onr_proteus_116_pirate-broadcast` Pirate Broadcast
- `onr_proteus_119_promises-promises` Promises, Promises

## Neue Bausteine

- Current-access Self-Steal-Cost für die aktuell accessete Agenda.
- Agenda-Access-Ambush mit Hidden-Zone-Barriere und R&D-Reveal nur für die aktuelle Karte.
- Source-bound scored-agenda Meat-Damage mit Handgrößenreduktion nur bei erfolgreichem Schaden.
- Fixe Score-Agenda-Punktmodifikatoren und overadvance-basierte scored-agenda Start-of-Corp-Turn-Credits.
- Successful-run access replacement für Runner-Event-Agenda-Punkte.
- Deterministische Mehrfach-Run-Sequenz über Data Forts mit Action-Debt bei Fehlschlag.
- Einmaliger Next-Agenda-Access-Agenda-Punktmodifier für den Runner-Zug.

## Zählung

Der Reconcile-Harness steht nach PRO013 bei 154 Proteus-Karten total, 121 konkreten CardImplementation-Dateien, 33 fehlenden Dateien und 0 Drift.
