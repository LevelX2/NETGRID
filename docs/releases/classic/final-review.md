# Classic Full Card Implementation Final Review

Stand: 2026-06-30

## Gate-Ergebnis

`CLASSIC_FULL_CARD_IMPLEMENTATION_DONE: true`
`CLASSIC_CARDS_FULLY_PROMOTED: 52/52`
`READY_FOR_LOCAL_MAIN_MERGE: true`

Die vollständige Classic-Implementierung ist abgeschlossen. Alle 52 Karten aus `data/cards/classic-cards.json` haben konkrete CardImplementation-Dateien, Registry-Einträge, resolverRefs, aktive AI-Hints, kompilierte AI-Hints und SzenarioRefs. Das Supportmanifest meldet für 52/52 Karten `implemented`, `engine_supported`, `playable`, `human_playable`, `deck_legal`, `format_legal` und `ai_supported`; `blocked` ist überall `false`.

Classic bleibt ein optionales Zusatzset für private lokale Matches und ist nur additiv zum Originalset freigegeben. Eine eigenständige Classic-only-Freigabe wurde nicht eingeführt.

## Nachweis

- Engine: `packages/engine/src/card-implementations/classic/` enthält 52 konkrete Implementierungen; Coverage und Descriptor-Gates melden `Classic 52/52`, keine fehlenden Dateien und keinen Manifestdrift.
- Catalog/Manifest: `data/manifests/classic-card-support.json` ist die aktive Freigabequelle für Human-, Deck-, Format- und AI-Status.
- Scenarios: Paket-Smokes liegen unter `data/scenarios/classic-03-*` bis `classic-09-*`; `data/scenarios/card-support-ai-supported-current.json` enthält alle Classic-Karten im aktiven AI-Approval-Scenario.
- AI: `data/ai/ai-card-hints-active.json` und `data/ai/ai-card-hints-compiled.json` enthalten alle 52 Classic-Karten; `check:ai-compiled-hints` meldet 616 Karten, 0 Fehler.
- Decks: `classic_runner_ai_snapshot_v1` und `classic_corp_ai_snapshot_v1` sind 45-Karten-Snapshots im Classic-Formatprofil und im seeded AI-Deckpool.
- Webclient-Version: Die sichtbare App-Version bleibt `V1.9.22`; Classic ist kein neues V1.x-Produktrelease, sondern ein privater lokaler Zusatzset-Abschluss.

## Checks

- `corepack pnpm typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/classic-agendas.test.ts src/index-tests/mechanics/classic-corp-assets-upgrades.test.ts src/index-tests/mechanics/classic-runner-rest-cards.test.ts src/card-implementations/coverage.test.ts src/card-implementations/definition-descriptors.test.ts`: pass, 5 Testdateien, 96 Tests.
- `corepack pnpm --filter @netgrid/catalog exec vitest run src/index.test.ts`: pass, 12 Tests.
- `corepack pnpm --filter @netgrid/decks exec vitest run src/index.test.ts`: pass, 17 Tests.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "Classic AI snapshots|V1.2.3 cards out|marks every active support AI group"`: pass, 3 gezielte Tests.
- `corepack pnpm check:ai-compiled-hints`: pass, 616 Karten, 0 Fehler.
- `corepack pnpm check:engine-cardimplementation-architecture-target`: pass.
- `corepack pnpm check:card-function-abstraction`: pass, 141 Baseline-Findings unverändert.
- `git diff --check`: pass.

## Integration

Der Arbeitsbranch `codex/classic-full-card-implementation` ist nach dem Final-Commit für einen lokalen Fast-forward-Merge nach `main` vorbereitet. Es gibt keinen Push, keinen PR und keine Remote-Integration in diesem Abschluss.

## Restpunkte

Keine Classic-Blocker. Weitere Produktfreigaben, öffentliche Distribution, offizielle Assets, externe Kartendatenbanken oder Classic-only-Formate bleiben separate Planung.
