# MVP 0.96 Final Review - Trace, Link und Bidding

Status: bestanden
Stand: 2026-05-04

## Zusammenfassung

V0.96 ist als enges Trace/Link/Bidding-Gate umgesetzt. Die lokale/fiktive Harness-Karte `v096_trace_probe_ice` startet Trace 2 aus einer ICE-Subroutine. Die Corp bietet zuerst, der Runner bietet danach, beide zahlen exakt ihre Bids, und der Trace ist nur erfolgreich, wenn Trace-Strength strikt größer als Runner-Strength ist. Der einzige freigegebene Erfolgseffekt ist `add_tag`.

## Finaler Scope

Umgesetzt:

- `TraceState` im GameState.
- `bid_amount`-Choices als echte Trace-Entscheidungen.
- Runner Base Link 0 als öffentlicher Identity-Wert.
- Public Trace-Events für Start, Corp-Bid, Runner-Bid und Ergebnis.
- Deterministisches Replay/StateHash ohne neue Randomness.
- Side-sichere AI-Bid-Auswahl und Multiplayer-Trace-Smokes.
- Versionierte V0.96-Artefakte, Manifest, Szenarien und Coverage.

Nicht umgesetzt:

- Trace-Damage.
- Resource-spezifische Trace-Effekte.
- Jack-out, Breach, Multiaccess.
- Aktive Identity-Abilities.
- Hidden-Zone-Tools.
- Hosting, Viren, Purge, Counter-Familien.
- Recurring Credits, Bad Publicity.
- Prevention, Avoid, Interrupt, Replacement.

## Hidden-Info- und Determinismus-Befund

- PlayerViews zeigen offene Trace-Choices nur der zuständigen Seite.
- PublicEvents enthalten keine verdeckten Kartenlisten, keine verdeckten Instance-IDs und keinen FullState.
- Trace-Bids sind public und keine Hidden-Info-Barriere.
- Bestehende Hidden-Info-Barrieren, etwa Rez oder Damage, bleiben unverändert.
- Trace verwendet keine Randomness und verändert RandomCounter/RandomDrawRecords nicht.
- Replay reproduziert StateHashes über Trace-Actionstreams.

## Artefakte

- `docs/derived/MVP_0.96_REQUIREMENTS.md`
- `docs/derived/TRACE_LINK_BIDDING_0.96_SPEC.md`
- `docs/derived/MVP_0.96_TEST_MATRIX.md`
- `docs/derived/MVP_0.96_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.96_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.96_FINAL_REVIEW.md`
- `data/rules/rules-baseline-0.96.json`
- `data/cards/demo-cards-0.96.json`
- `data/decks/demo-decks-0.96.json`
- `data/manifests/card-implementation-manifest-0.96.json`
- `data/rules/mechanics-coverage-0.96.json`
- `data/scenarios/v096-trace-link.json`
- `data/scenarios/v096-multiplayer-trace-smoke.json`

## Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test -- --run`: pass, 41 Tests.
- `corepack pnpm --filter @netgrid/ai test -- --run`: pass, 19 Tests.
- `corepack pnpm --filter @netgrid/server test -- --run`: pass, 18 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 22 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt bestehen.

## Gate-Ergebnis

`MVP_0.96_done: true`

`ready_for_MVP_0.97_requirements_freeze: true`

V0.97 darf erst nach dem V0.96-Commit als eigenes Gate beginnen.
