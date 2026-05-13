# V1.9.15 Implementation Review

Stand: 2026-05-13 07:25 CEST
Status: implementing_wip

## Umgesetzter WIP-Scope

- `packages/shared/src/index.ts` enthaelt WIP-Runtime-Definitionen fuer alle 14 V1.9.15-Zielkarten.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_15_WIP_CARD_IDS` fuer genau 14 Zielkarten.
- `packages/catalog/src/index.test.ts` prueft, dass diese 14er-WIP-Zielmenge nicht in `ONR_V1_RUNTIME_RELEASE_CARD_IDS` vorgezogen wird.
- `packages/engine/src/index.test.ts` prueft 14/14 WIP-Runtime-Definitionen und den No-Scope-Guard gegen V1.9.16.
- `packages/engine/src/index.ts` enthaelt WIP-Resolver fuer die V1.9.15-Runner-Events `Lucidrine Booster Drug`, `Priority Wreck`, `Social Engineering` und `Stumble through Wilderspace`; alle starten Runs ueber explizite `play_event`-LegalActions und revalidierte Serverziele.
- `packages/engine/src/index.ts` enthaelt einen WIP-Resolver fuer `New Blood`; die Operation ist erst nach einem sichtbaren Runner-Run-Versuch im letzten Zug legal und erzeugt nur oeffentliche Korp-Credit-Pressure.
- `packages/engine/src/index.test.ts` deckt Priority-Wreck-R&D-Multiaccess inklusive Hidden-Queue-Schutz und Replay/StateHash ab.
- `packages/engine/src/index.test.ts` deckt Cerberus und Mastiff als V1.9.15-ICE-Ueberlappung mit dem bestehenden side-sicheren Trace-Bid-Fenster ab.
- `data/scenarios/v1915-run-access-multiaccess-wip-smoke.json` dokumentiert den neuen WIP-Smoke maschinenlesbar.
- WIP-Datenartefakte fuer Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes und AI-Approval-Manifest sind angelegt; sie markieren den Stand ausdruecklich als nicht release-promotet und setzen keine Karte auf `ai_supported`.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: pass, 226 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 29 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.

## Gate-Status

`V1_9_15_done: false`

`V1_9_15_phase: implementing`

`hard_gate_blocker: none`

Offen bleiben die vollstaendige Kartenpromotion, finale display-only Texte ohne WIP-Praefix, finale Manifest-/Mechanics-Coverage-/Scenario-/AI-Artefakte, Catalog/Web-Promotion, Webclient-Version, volle Pflichtchecks und Final Review.
