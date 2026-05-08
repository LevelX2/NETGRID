# MVP 0.97 Final Review - Run, Jack-out, Breach und Multiaccess

Status: bestanden
Stand: 2026-05-04

## Zusammenfassung

V0.97 ist als enges Run/Breach-Gate umgesetzt. V0.97-Baselines erhalten ein Movement-Fenster mit Runner-Jack-out, Successful Runs erzeugen eine interne Breach-Queue, und `v097_deep_dive_event` erlaubt R&D/HQ-Multiaccess 2 als lokale/fiktive Harness-Karte. Alte Baselines bleiben auf dem bisherigen Access-Pfad.

## Finaler Scope

Umgesetzt:

- `jack_out`-LegalAction im V0.97-Movement-Fenster.
- Interner `BreachState` mit Queue und Summary in PlayerViews.
- Queue-basierter Access für R&D, HQ, Archives und Remote Root.
- R&D-Multiaccess in stabiler Top-N-Reihenfolge.
- HQ-Multiaccess deterministisch ohne Replacement über `RandomDrawRecords`.
- Hidden-Info-Barriere für Access-Events und Multiplayer-Undo-Blockade.
- Side-sichere AI- und Multiplayer-Smokes.
- Versionierte V0.97-Artefakte, Manifest, Szenarien und Coverage.

Nicht umgesetzt:

- Search, Reveal, Expose, Arrange, Shuffle/Swap.
- Aktive Identity-Abilities.
- Hosting, Viren, Purge, Counter-Familien.
- Recurring Credits, Bad Publicity.
- Prevention, Avoid, Interrupt, Replacement.
- Vollständige offizielle Access-Replacement- oder Candidate-Choice-Matrix.
- Vollständiger facedown-Archives-Ausbau.

## Hidden-Info- und Determinismus-Befund

- PlayerViews zeigen nur `breachId`, Server, aktuellen Index, Restanzahl und Completion-Status.
- PublicEvents enthalten künftige Queue-Karten nicht vor deren eigenem `access_card`.
- Reconnect während Breach zeigt keine künftigen R&D-/HQ-Titel.
- AI-Inputs enthalten keine FullState-/CardInstances-Daten und keine künftigen Queue-Titel.
- HQ-Multiaccess ist die einzige neue Randomness und nutzt `RandomDrawRecords`.
- Replay reproduziert StateHashes über Breach-/Multiaccess-Sequenzen.

## Artefakte

- `docs/derived/MVP_0.97_REQUIREMENTS.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/derived/MVP_0.97_TEST_MATRIX.md`
- `docs/derived/MVP_0.97_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.97_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.97_FINAL_REVIEW.md`
- `data/rules/rules-baseline-0.97.json`
- `data/cards/demo-cards-0.97.json`
- `data/decks/demo-decks-0.97.json`
- `data/manifests/card-implementation-manifest-0.97.json`
- `data/rules/mechanics-coverage-0.97.json`
- `data/scenarios/v097-run-breach-multiaccess.json`
- `data/scenarios/v097-multiplayer-breach-smoke.json`

## Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test -- --run`: pass, 46 Tests.
- `corepack pnpm --filter @netgrid/ai test -- --run`: pass, 21 Tests.
- `corepack pnpm --filter @netgrid/server test -- --run`: pass, 19 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 24 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt bestehen.

## Gate-Ergebnis

`MVP_0.97_done: true`

`ready_for_MVP_0.98_requirements_freeze: true`

V0.98 darf erst nach dem V0.97-Commit als eigenes Gate beginnen.
