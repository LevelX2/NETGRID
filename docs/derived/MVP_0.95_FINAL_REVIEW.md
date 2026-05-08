# MVP 0.95 Final Review

Status: Final Gate bestanden
Stand: 2026-05-04

## Gate-Ergebnis

`MVP_0.95_done: true`

`ready_for_MVP_0.96_requirements_freeze: true`

V0.95 ist als enger Resources-und-Tag-Interaktionsslice umgesetzt. Runner-Resources sind public installierte Boardkarten. Die Corp kann bei getaggtem Runner mit `trash_resource` genau eine installierte Resource für 1 Klick und 2 Credits trashen. Resource-Install und Resource-Trash bleiben LegalActions-only, werden in `applyAction` revalidiert, leaken keine verdeckten Zonen und verändern Replay/StateHash deterministisch ohne neue Randomness.

## Umgesetzter Scope

- Additiver Kartentyp `resource`.
- Runner-Rig-Erweiterung `resources`.
- Public PlayerView-Darstellung installierter Resources für Runner und Corp.
- Lokale/fiktive spielbare Resource `v095_safehouse_resource`.
- Corp-Basisaktion `trash_resource` bei getaggtem Runner.
- Public Events und Chronicle/UI-Anzeige für Resource-Install und Resource-Trash.
- AI-Smoke für LegalActions-only Resource-Trash.
- Multiplayer-Smoke für Submit, Idempotency, Reconnect und Undo nach public Resource-Trash.

## Artefakte

- `docs/derived/MVP_0.95_REQUIREMENTS.md`
- `docs/derived/RESOURCE_TAG_INTERACTION_0.95_SPEC.md`
- `docs/derived/MVP_0.95_TEST_MATRIX.md`
- `docs/derived/MVP_0.95_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.95_IMPLEMENTATION_REVIEW.md`
- `data/rules/rules-baseline-0.95.json`
- `data/cards/demo-cards-0.95.json`
- `data/decks/demo-decks-0.95.json`
- `data/manifests/card-implementation-manifest-0.95.json`
- `data/rules/mechanics-coverage-0.95.json`
- `data/scenarios/v095-resource-tag.json`
- `data/scenarios/v095-multiplayer-resource-smoke.json`

## Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test -- --run`: pass, 36 Tests.
- `corepack pnpm --filter @netgrid/ai test -- --run`: pass, 18 Tests.
- `corepack pnpm --filter @netgrid/server test -- --run`: pass, 17 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.

## Nicht Umgesetzt

Trace, Link/Bidding, Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Purge, Counter-Familien, Recurring Credits, Bad Publicity sowie Prevention/Avoid/Interrupt/Replacement bleiben gesperrt und müssen eigene spätere Gates durchlaufen.

## Review-Entscheidung

V0.95 ist abgeschlossen und lokal commitfähig. Der nächste Gate-Schritt ist V0.96 Requirements Freeze für Trace, Link und Bidding. V0.96 darf erst beginnen, wenn dieser Finalstand committed ist.
