---
activityId: act-2026-07-17-ice-and-data-expose-feedback
status: done
kind: enhancement
area: web
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt: 2026-07-17
completedAt: 2026-07-17
branch: codex/ice-and-data-expose-feedback
releaseTarget: Current private playtest
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/engine-runtime-internal/corp-zone-runtime-hosts.ts
  - packages/engine/src/public-context.ts
  - apps/web/app/chronicle.ts
  - apps/web/app/page.tsx
  - apps/web/features/game-board/ActiveServerGrid.tsx
  - apps/web/features/settings/OptionsPanel.tsx
  - docs/architecture/ice-and-data-expose-feedback-process-2026-07-17.md
  - docs/reviews/web/ice-and-data-expose-feedback-final-review-2026-07-17.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/rule-contract-baseline-utilities.test.ts (20 Tests)
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts app/action-board-ui.test.ts (293 Tests nach Main-Abgleich)
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm typecheck
  - corepack pnpm check:package-boundaries
  - corepack pnpm format:changed
  - git diff --check
---

# Ice and Data Special Report: Expose-Feedback

## Ziel

Beim Abschluss von `Ice and Data Special Report` sollen Chronik und
Spielfeld zeigen, welche installierten Korp-Karten in welchem Data Fort
exposed wurden. Der Spielfeldhinweis ist lokal schaltbar und bleibt höchstens
zehn Sekunden sichtbar.

## Ergebnisnotiz

Abgeschlossen. Der Engine-Eventvertrag enthält für den bereits öffentlichen
Expose eines einzelnen Data Forts die konkreten Karteninstanzen. Der Webclient
verwendet sie nur, wenn die Karten im eigenen PlayerView sichtbar sind: Die
Chronik listet Karte und Fort-Position, das Board markiert genau diese Karten
mit einem grünen Rahmen. Die Markierung endet nach zehn Sekunden oder beim
Turnwechsel.

`Exposed-Karten hervorheben` ist eine standardmäßig eingeschaltete, lokal
persistierte Komfortoption. Sie ändert keine Regeln, Events, LegalActions,
Replays oder den Match-State.
