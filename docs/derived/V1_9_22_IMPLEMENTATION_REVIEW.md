# V1.9.22 Implementation Review

Stand: 2026-05-13
Status: planning/catalog WIP

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf 47 Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_22_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.22 noch nicht im Runtime-Releasepool steht.
- WIP-Datenartefakte ohne Promotion sind angelegt: `data/scenarios/v1922-per-card-longtail-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.22.json` und `data/rules/mechanics-coverage-1.9.22.json`.
- Keine V1.9.22-Karte wurde Runtime-, Catalog- oder AI-promotet.

## Gate

`V1_9_22_done: false`
`V1_9_22_phase: implementing`

## Naechster Schnitt

Runtime-WIP fuer die erste eng begrenzte Longtail-Gruppe, vorzugsweise einfache Runner-Install-/MU-Hardware oder ein kleiner Runner-Event-Cluster mit LegalAction-/applyAction- und Visibility-Smoke.

## Verifikation

- JSON-Validation fuer `data/**/*.json`: pass, 302 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 36 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
