---
activityId: act-2026-05-28-proteus-pro014-1-corp-utility-hardening
status: done
kind: hardening
area: cards
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: PRO014-1
proReferences:
  - PRO014
  - PRO014-1
blockedBy: []
resultArtifacts:
  - packages/engine/src/ability-engine/card-implementation-runtime.ts
  - packages/engine/src/ability-engine/effect-interpreter.ts
  - packages/engine/src/game/choices/pending-choice-resolution.ts
  - packages/engine/src/game/damage/damage-core.ts
  - packages/engine/src/game/run/run-core-execution.ts
  - packages/engine/src/game/run/run-flow-hosts.ts
  - packages/engine/src/game/run/start-run-action-execution.ts
  - packages/engine/src/game/turn/corp-main-actions.ts
  - packages/engine/src/game/turn/runner-main-actions.ts
  - packages/engine/src/index.ts
  - packages/shared/src/index.ts
  - packages/engine/src/index-tests/proteus/corp-asset-upgrade-utility.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/corp-asset-upgrade-utility.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Proteus PRO014-1: Corp Utility Hardening

## Ergebnis

PRO014-1 ist als reine Härtung erledigt. Es wurden keine neuen Proteus-Karten implementiert, keine zusätzlichen Karten freigeschaltet und keine Manifest-/Decklegalitäts-/Formatlegalitäts-/AI-Flags verändert.

## Behobene Findings

- Siren wird nicht mehr als Runner-Start-Run-Alternative angeboten. Normale Runner-Runs öffnen ein Korp-Start-of-run-Redirect-Fenster; Pass und Redirect sind explizite LegalActions mit Revalidierung von Quelle, Timing, Kosten und Zielserver.
- Department of Misinformation verhindert Expose nicht mehr automatisch. Expose-Versuche öffnen ein Korp-Reaktionsfenster mit Pass oder Nutzung; unrezzed Department bezahlt Rez-Kosten plus 1 Credit, rezzed Department nur 1 Credit.
- Cybertech Think Tank konsumiert Advancement-Counter nicht mehr automatisch. Meat-Damage anderer Quellen öffnet ein Korp-Event-Modification-Fenster; die gewählte Quelle gibt genau 1 Counter aus und erhöht genau den pending Damage-Event um 1.
- Government-Contract-Credits sind auf Install-/Rez-Zahlungen beschränkt und werden nicht mehr als global bevorzugter Korp-Credit-Pool für Trace-Bids, aktivierte Fähigkeiten, Siren oder Expose-Prevention verbraucht.
- LDL Traffic Analyzers, Panic Button, Raymond Ellison und Syd Meyer Superstores sind in der PRO014-Verhaltenstestdatei mit echten Engine-Pfaden gegen Timing, Kosten, Zielbindung und temporäre Credit-Verwendung abgesichert.

## Zählung

Der PRO014-1-Harness-Stand bleibt 154 Proteus-Karten total, 129 konkrete CardImplementation-Dateien, 25 fehlende Dateien und 0 Drift.
