# MVP 0.99 Final Review - Hosting, Viren, Purge und Counter-Familien

Status: bestanden
Stand: 2026-05-04

## Zusammenfassung

V0.99 ist als enges Hosting-/Counter-Gate umgesetzt. Die neuen lokalen/fiktiven Harness-Karten decken direkte Hosting-Beziehungen, Virus-Counter, Purge, Recurring Credits und Bad Publicity ab, ohne M11+ Mechaniken oder breite offizielle Sonderfallmatrix freizuschalten.

## Finaler Scope

Umgesetzt:

- V0.99-Demo-Baseline, Demo-Decks und lokale/fiktive Harness-Karten.
- Additive `CounterType`- und `CardInstance.counters`-Vertraege.
- Direkte `hostedOn`-Beziehung mit Azyklik-Validation.
- Runner-Hosting-Choice aus eigener Grip ueber `PendingChoice`.
- Host-Trash-Kaskade fuer V0.99-Hosted-Programme.
- Virus-Counter beim Installieren von `v099_virus_program`.
- Corp-Basic-Action `purge_virus_counters` mit 3-Click-Kosten.
- Recurring Credits auf `v099_recurring_chip`, Refresh ohne Akkumulation und Programminstall-Zahlung.
- Bad Publicity auf Corp-State, Run-Start-Fund und Run-Ende-Cleanup.
- Side-sichere AI- und Multiplayer-Smokes.
- Versionierte V0.99-Artefakte, Manifest, Szenarien und Coverage.

Nicht umgesetzt:

- Prevention, Avoid, Interrupt und Replacement.
- Set Aside, Remove from Game und Ownership-/Control-Wechsel.
- Vollstaendige offizielle Hosting-/Hosted-Kartenmatrix.
- Vollstaendige Counter-Familien ohne konkreten Kartenbedarf.
- Bad Publicity fuer Trace-Bids.
- Vollstaendige Deckbuilding-/Formatregeln.

## Hidden-Info- und Determinismus-Befund

- Private Hosting-Kandidaten erscheinen nur in der PlayerView der berechtigten Side.
- Oeffentliche Hosting-Events enthalten nur redaktierte Hidden-Zone-Kontexte.
- Nach Hosting-Resolve ist das Programm bewusst oeffentlich im Runner-Rig sichtbar.
- Purge entfernt nur Virus-Counter und ist public.
- Recurring Credits und Bad Publicity sind offene, deterministische Counter-/Side-State-Daten.
- Replay reproduziert StateHashes fuer V0.99-Sequenzen.
- Multiplayer-Reconnect und AI-Inputs bleiben side-sicher.

## Artefakte

- `docs/derived/MVP_0.99_REQUIREMENTS.md`
- `docs/derived/COUNTER_HOSTING_0.99_SPEC.md`
- `docs/derived/VIRUS_PURGE_0.99_SPEC.md`
- `docs/derived/RECURRING_BAD_PUBLICITY_0.99_SPEC.md`
- `docs/derived/MVP_0.99_TEST_MATRIX.md`
- `docs/derived/MVP_0.99_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.99_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.99_FINAL_REVIEW.md`
- `data/rules/rules-baseline-0.99.json`
- `data/cards/demo-cards-0.99.json`
- `data/decks/demo-decks-0.99.json`
- `data/manifests/card-implementation-manifest-0.99.json`
- `data/rules/mechanics-coverage-0.99.json`
- `data/scenarios/v099-counter-hosting.json`
- `data/scenarios/v099-virus-recurring-bad-publicity.json`
- `data/scenarios/v099-multiplayer-hosting-smoke.json`

## Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test`: pass, 60 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass, 25 Tests.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass, 21 Tests.
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 37 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass; bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt ohne Build-Fehler.

## Gate-Ergebnis

`MVP_0.99_done: true`

`mechanics_completion_V0.94_to_V0.99_done: true`

V1.0/M11+ darf erst nach eigenem Requirements Freeze beginnen.
