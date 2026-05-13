# V1.9.21 Implementation Review

Status: runtime WIP
Stand: 2026-05-13

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf sechs Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_21_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.21 noch nicht im Runtime-Releasepool steht.
- 6/6 V1.9.21-Zielkarten haben Runtime-Definitionen in `packages/shared/src/index.ts` mit finalen display-only Texten ohne `WIP`-Praefix.
- `packages/engine/src/index.test.ts` schuetzt die Runtime-Zielmenge mit V1.9.22-No-Promotion-Sentinel.
- `data/scenarios/v1921-deterministic-random-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.21.json` und `data/rules/mechanics-coverage-1.9.21.json` dokumentieren den WIP-Scope maschinenlesbar ohne Promotion.

## Gate

`V1_9_21_done: false`
`V1_9_21_phase: implementing`

## Naechster Schnitt

Erster deterministischer Random-Resolver und Engine-Smokes fuer Seed/RandomCounter/RandomDrawRecords.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 35 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- JSON-Validation fuer `data/**/*.json`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 266 Tests.
