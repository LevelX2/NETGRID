# V1.9.21 Implementation Review

Status: release complete
Stand: 2026-05-13

## Umgesetzter Schnitt

- Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sind erstellt.
- Der Scope ist auf sechs Zielkarten festgelegt.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_21_WIP_CARD_IDS` als exakte Zielmenge.
- `packages/catalog/src/index.test.ts` schuetzt die Zielmenge und bestaetigt, dass V1.9.21 noch nicht im Runtime-Releasepool steht.
- 6/6 V1.9.21-Zielkarten haben Runtime-Definitionen in `packages/shared/src/index.ts` mit finalen display-only Texten ohne `WIP`-Praefix.
- `packages/engine/src/index.test.ts` schuetzt die Runtime-Zielmenge mit V1.9.22-No-Promotion-Sentinel.
- `data/scenarios/v1921-deterministic-random-wip-smoke.json`, `data/manifests/card-implementation-manifest-1.9.21.json` und `data/rules/mechanics-coverage-1.9.21.json` dokumentieren den WIP-Scope maschinenlesbar ohne Promotion.
- `Schlaghund` hat den ersten V1.9.21-Engine-Resolver: eine rezzed Asset LegalAction fuer eine deterministische Wuerfelprobe, die `RandomDrawRecords` nutzt, Wrong-Side/Stale-State ablehnt, im PublicEvent nur oeffentliche Zufallsmetadaten zeigt und replay-/StateHash-stabil ist.
- `Rio de Janeiro City Grid` deckt den Upgrade-/Server-Zufallspfad mit eigener `v1921UpgradeAbility`, PublicEvent-Metadaten und replay-/StateHash-stabilem `RandomDrawRecords`-Nachweis ab.
- `AI Boon` und `Boardwalk` decken installierte Runner-Programm-Zufallspfade mit eigener `v1921RunnerProgramAbility`, Wrong-Side-Revalidation, PublicEvent-Metadaten und replay-/StateHash-stabilen `RandomDrawRecords` ab.
- `Playful AI` deckt den Runner-Event-Zufallspfad ueber `play_event`, Heap-Bewegung, `v1921RunnerEventAbility`, Wrong-Side-Revalidation, PublicEvent-Metadaten und replay-/StateHash-stabile `RandomDrawRecords` ab.
- `Quest for Cattekin` deckt den installierten Runner-Resource-Zufallspfad mit `v1921RunnerResourceAbility`, Wrong-Side-Revalidation, PublicEvent-Metadaten und replay-/StateHash-stabilen `RandomDrawRecords` ab.
- Nicht-promotende AI-Draft-Artefakte sind angelegt und mit dem AI-Gate geprueft: `data/ai/ai-card-hints-deck-legal-v1921-draft.json`, `data/scenarios/ai-deck-legal-v1921-draft-smokes.json` und `data/manifests/v1921-deck-legal-ai-approval-draft-manifest.json`. Status bleibt `hinted_only`/`draft_no_ai_promotion`.
- Finale Promotion-Artefakte sind angelegt: `data/ai/ai-card-hints-deck-legal-v1921.json`, `data/scenarios/ai-deck-legal-v1921-smokes.json`, `data/manifests/deck-legal-ai-approval-v1921-manifest.json` und `data/scenarios/v1921-deterministic-random-release-smoke.json`.
- `ONR_V1_9_21_RELEASE_CARD_IDS`, `DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS` und die Webclient-Version `V1.9.21` sind gesetzt.
- `apps/web/app/api/cards/catalog-data.ts` liefert die V1.9.21-AI-Hints im Katalogdetail aus.

## Gate

`V1_9_21_done: true`
`V1_9_21_phase: done`

## Naechster Schnitt

V1.9.21 ist abgeschlossen. Naechster erlaubter Cursor ist V1.9.22.

## Verifikation

- JSON-Validation fuer `data/**/*.json`: pass, 299 Dateien.
- `scripts/automation/v1-9-install-and-check.ps1 -Task catalog`: pass, 36 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task typecheck`: pass.
- JSON-Validation fuer `data/**/*.json`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task engine`: pass, 271 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task ai`: pass, 85 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task web`: pass, 77 Tests.
- `scripts/automation/v1-9-install-and-check.ps1 -Task test`: pass, Exit 0 ohne Detailausgabe.
- `scripts/automation/v1-9-install-and-check.ps1 -Task lint`: pass.
- `scripts/automation/v1-9-install-and-check.ps1 -Task build`: pass mit bekannter nicht-blockierender Turbopack-NFT-Warnung.
