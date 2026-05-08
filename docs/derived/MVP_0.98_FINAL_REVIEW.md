# MVP 0.98 Final Review - Identities, Modifier und Hidden-Zone-Tools

Status: bestanden
Stand: 2026-05-04

## Zusammenfassung

V0.98 ist als enges Identity-/Hidden-Zone-Gate umgesetzt. Die neuen lokalen/fiktiven Identities setzen Setup-Credits, Runner-Link und Memory-Modifier deterministisch. Hidden-Zone-Tools laufen ueber kleine Harness-Karten und bleiben auf Search, Reveal, Expose, Arrange, Shuffle und Swap beschraenkt.

## Finaler Scope

Umgesetzt:

- V0.98-Demo-Baseline, Demo-Decks und lokale/fiktive Harness-Karten.
- Runner- und Corp-Identity mit Setup-Usage-Markern.
- Statischer Runner-Memory-Modifier und Runner-Link aus der aktiven Identity.
- Runner-Stack-Search fuer Programme mit privater `select_cards`-Choice und deterministischem Shuffle.
- Runner-Stack-Arrange Top 2 mit privater Reihenfolge-Choice.
- Public Reveal eines definierten Stack-Tops.
- Public Expose einer installierten unrezzed Corp-Karte ohne `faceup`-/`rezzed`-Mutation.
- Corp HQ/R&D-Swap als Hidden-Info-Barriere ohne Randomness.
- Side-sichere AI- und Multiplayer-Smokes.
- Versionierte V0.98-Artefakte, Manifest, Szenarien und Coverage.

Nicht umgesetzt:

- Hosting, Viren, Purge und Counter-Familien.
- Recurring Credits und Bad Publicity.
- Prevention, Avoid, Interrupt und Replacement.
- Set Aside, Remove from Game und Ownership-/Control-Wechsel.
- Vollstaendige offizielle Search-/Expose-/Swap-Kandidatenmatrix.
- Vollstaendige Deckbuilding-/Formatregeln.

## Hidden-Info- und Determinismus-Befund

- Private Hidden-Zone-Kandidaten erscheinen nur in der PlayerView der berechtigten Side.
- Oeffentliche Choice-Events fuer Search/Arrange enthalten nur redaktierte Hidden-Zone-Kontexte.
- Reveal/Expose nennen bewusst genau die freigegebene Kartendefinition.
- Search-Shuffle wird ueber Seed, RandomCounter und RandomDrawRecords aufgezeichnet.
- Swap nutzt keine Randomness und leakt keine HQ-/R&D-Titel.
- Replay reproduziert StateHashes fuer V0.98-Identity- und Hidden-Zone-Sequenzen.
- Multiplayer-Reconnect und AI-Inputs bleiben side-sicher.

## Artefakte

- `docs/derived/MVP_0.98_REQUIREMENTS.md`
- `docs/derived/IDENTITY_MODIFIERS_0.98_SPEC.md`
- `docs/derived/HIDDEN_ZONE_TOOLS_0.98_SPEC.md`
- `docs/derived/MVP_0.98_TEST_MATRIX.md`
- `docs/derived/MVP_0.98_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.98_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.98_FINAL_REVIEW.md`
- `data/rules/rules-baseline-0.98.json`
- `data/cards/demo-cards-0.98.json`
- `data/decks/demo-decks-0.98.json`
- `data/manifests/card-implementation-manifest-0.98.json`
- `data/rules/mechanics-coverage-0.98.json`
- `data/scenarios/v098-identity-hidden-zone.json`
- `data/scenarios/v098-hidden-zone-tools.json`
- `data/scenarios/v098-multiplayer-hidden-zone-smoke.json`

## Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test`: pass, 54 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass, 23 Tests.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass, 20 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 26 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt bestehen.

## Gate-Ergebnis

`MVP_0.98_done: true`

`ready_for_MVP_0.99_requirements_freeze: true`

V0.99 darf erst nach dem V0.98-Commit als eigenes Gate beginnen.
