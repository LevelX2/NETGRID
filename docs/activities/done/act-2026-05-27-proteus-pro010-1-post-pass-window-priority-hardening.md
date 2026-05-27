---
activityId: act-2026-05-27-proteus-pro010-1-post-pass-window-priority-hardening
status: done
kind: hardening
area: engine
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO010-1
proReferences:
  - PRO010-1
  - PRO010
resultArtifacts:
  - packages/engine/src/game/legal-actions.ts
  - packages/engine/src/index-tests/proteus/variable-ice.test.ts
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/variable-ice.test.ts -t \"PRO010\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "git diff --check"
---

# Proteus PRO010-1: Post-Pass Window Priority Hardening

## Ergebnis

PRO010-1 härtet die LegalAction-Priorität für gleichzeitige Post-Pass-Fenster. Wenn ein PRO010-Lifecycle-ICE auf einem Fort mit `Rasmin Bridger` passiert wird, erzeugt die Engine zuerst Korp-Lifecycle-Aktionen für `corpPostPassIceReturnToHq`. Das Runner-Fort-Pass-Fenster `postPassPayOrEndRun` wird erst danach angeboten, sofern es noch offen ist.

## Scope-Grenze

Es wurde keine neue Proteus-Karte umgesetzt, keine CardImplementation-Datei ergänzt und kein Manifeststatus geändert. Die Proteus-Zählung bleibt 154 total, 97 implementiert, 57 fehlend und 0 Drift.

## Nachweis

Der fokussierte Regressionstest kombiniert `Datacomb` und `Rasmin Bridger` auf demselben Fort. Er prüft LegalAction-Angebot, `applyAction`-Revalidierung für Korp- und Runner-Schritt, Hidden-Info-Payload-Grenzen sowie Replay-/StateHash-Stabilität.
