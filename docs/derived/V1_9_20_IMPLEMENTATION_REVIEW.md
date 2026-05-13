# V1.9.20 Implementation Review

Status: planning complete
Stand: 2026-05-13

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf 26 Zielkarten festgelegt.
- `packages/catalog/src/index.ts` führt `ONR_V1_9_20_WIP_CARD_IDS` als exakte 26er-Zielmenge.
- `packages/catalog/src/index.test.ts` schützt die Zielmenge und bestätigt, dass V1.9.20 noch nicht im Runtime-Releasepool steht.
- Es wurden noch keine Runtime-, AI- oder Web-Promotionen vorgenommen.

## Gate

`V1_9_20_done: false`
`V1_9_20_phase: implementing`

## Nächster Schnitt

WIP-Runtime-Definitionen für die 26 Zielkarten anlegen; danach erste Engine-Smokes für Handlimit/MU, Action Economy, globale Modifier und persistente Sonderzustände.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 34 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
