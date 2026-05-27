---
activityId: act-2026-05-27-proteus-pro009-1-icebreaker-correctness-hardening
status: done
kind: implementation
area: cards
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO009-1
proReferences:
  - PRO009
  - PRO009-1
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/fubar.ts
  - packages/engine/src/game/run/encounter-actions.ts
  - packages/engine/src/game/run/encounter-entry.ts
  - packages/engine/src/game/abilities/trigger-ability-execution.ts
  - packages/engine/src/game/run/card-implementation-run-actions.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO009\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/encounter-entry.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
---

# Proteus PRO009-1: Icebreaker Correctness Hardening

## Ergebnis

PRO009 wurde an drei Stellen nachgehärtet:

- `Fubar` wählt seinen Icebreaker-Typ nicht mehr beim Installieren, sondern einmalig im normalen Encounter-Fenster, in dem Icebreaker genutzt werden.
- `Bulldozer` bindet den kostenlosen Followup-Break an genau die nächste ICE-Begegnung; ist die nächste ICE keine Sentry, verfällt der Effekt.
- `Lockjaw` nutzt einen generischen `tapped`-Zustand für Karteninstanzen: Nutzung tappt die Quelle, weitere Runs im selben Runner-Zug können Lockjaw nicht erneut nutzen, und Runner-Karten werden zu Beginn des nächsten Runner-Zugs wieder bereit.

Die Proteus-Zählung bleibt unverändert bei 154 Karten, 87 implementiert, 67 fehlend und 0 Drift. Keine Karte wurde `deck_legal`, `format_legal` oder `ai_supported`.
