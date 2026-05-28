---
activityId: act-2026-05-28-proteus-pro015-1-bad-publicity-hardening
status: done
kind: hardening
area: cards
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-28
startedAt: 2026-05-28
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO015-1
proReferences:
  - PRO015-1
  - PRO015
resultArtifacts:
  - packages/engine/src/game/damage/damage-core.ts
  - packages/engine/src/index-tests/proteus/bad-publicity-run-replacement-suite.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/bad-publicity-run-replacement-suite.test.ts
---

# PRO015-1: Bad-Publicity-Härtung

## Ergebnis

PRO015-1 härtet den bestehenden PRO015-Scope ohne neue Proteus-Karten, ohne Manifest-Promotion und ohne neue Deck-, Format- oder AI-Freigaben.

- `Identity Donor` wird nur noch in echten Korp-Zugphasen angeboten und beim Resolve revalidiert: `corp_draw_phase`, `corp_action_phase`, `corp_discard_phase`.
- `activeSide === "corp"` reicht nicht mehr als Korp-Zug-Nachweis, weil Korp-Fenster auch während Runner-Runs auftreten können.
- Die PRO015-Run-History-Regressionen prüfen die relevanten Produktionshooks statt zentrale Run-Zähler direkt zu setzen: Encounter-Entry für Black ICE, `rezCard` für Black-Ops-Rez, Access-/Steal-Flow für Black-Ops-Agenda-Liberation, Access-/Trash-Flow für Advertisement-Trash und Run-End-Cleanup für den Frame-Up-Bonus.

## Zählstand

Der Proteus-Harness bleibt unverändert bei 154 Karten gesamt, 134 implementiert, 20 fehlend und 0 Drift.

Keine Proteus-Karte wird durch diese Härtung `deck_legal`, `format_legal` oder `ai_supported`.
