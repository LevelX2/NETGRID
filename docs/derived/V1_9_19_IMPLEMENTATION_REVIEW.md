# V1.9.19 Implementation Review

Status: WIP
Stand: 2026-05-13

## Umgesetzter Schnitt

- Detailplan, Requirements, Agenda/Overadvance-Spezifikation, Testmatrix und Requirements Review sind erstellt.
- `packages/shared/src/index.ts` enthält WIP-Runtime-Definitionen für alle 20 V1.9.19-Zielkarten mit finalen display-only Texten ohne `WIP`-Präfix.
- `packages/catalog/src/index.ts` führt `ONR_V1_9_19_WIP_CARD_IDS` als WIP-Zielmenge, ohne sie in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` oder AI-Approval aufzunehmen.
- `packages/catalog/src/index.test.ts` schützt die WIP-Zielmenge und prüft No-Promotion gegen den Runtime-Releasepool.
- `packages/engine/src/index.test.ts` prüft 20/20 Runtime-Definitionen, finale display-only Texte und den No-Scope-Guard gegen V1.9.20.
- `data/scenarios/v1919-agenda-overadvance-wip-smoke.json` dokumentiert den WIP-Smoke maschinenlesbar ohne Release- oder AI-Promotion.

## Gate

`V1_9_19_done: false`
`V1_9_19_phase: implementing`

## Nächster Schnitt

Konkrete Agenda-/Overadvance-LegalAction-/applyAction-Pfade für Score-, Steal-, Difficulty- und Overadvance-Familien.

## Verifikation

- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 252 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 33 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- JSON-Validation für `data/**/*.json`: pass, 273 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
