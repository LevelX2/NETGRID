# V1.9.21 Implementation Review

Status: planning and catalog WIP
Stand: 2026-05-13

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf sechs Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_21_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.21 noch nicht im Runtime-Releasepool steht.

## Gate

`V1_9_21_done: false`
`V1_9_21_phase: implementing`

## Naechster Schnitt

WIP-Runtime-Definitionen mit finalen display-only Texten, erster deterministischer Random-Resolver und Engine-Smokes fuer Seed/RandomCounter/RandomDrawRecords.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 35 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
