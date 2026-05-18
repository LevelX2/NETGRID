# V1.9.15 Implementation Review

Stand: 2026-05-13 08:05 CEST
Status: final

## Umgesetzter Scope

- `packages/shared/src/index.ts` enthaelt WIP-Runtime-Definitionen fuer alle 14 V1.9.15-Zielkarten.
- `packages/catalog/src/index.ts` fuehrt `ONR_V1_9_15_RELEASE_CARD_IDS` und `DECK_LEGAL_AI_APPROVAL_V1915_CARD_IDS` fuer genau 14 Zielkarten.
- `packages/catalog/src/index.test.ts` prueft die V1.9.15-Promotion gegen Manifest, Scenario, Mechanics-Coverage und AI-Gate.
- `packages/engine/src/index.test.ts` prueft 14/14 WIP-Runtime-Definitionen und den No-Scope-Guard gegen V1.9.16.
- `packages/engine/src/index.ts` enthaelt WIP-Resolver fuer die V1.9.15-Runner-Events `Lucidrine Booster Drug`, `Priority Wreck`, `Social Engineering` und `Stumble through Wilderspace`; alle starten Runs ueber explizite `play_event`-LegalActions und revalidierte Serverziele.
- `packages/engine/src/index.ts` enthaelt einen WIP-Resolver fuer `New Blood`; die Operation ist erst nach einem sichtbaren Runner-Run-Versuch im letzten Zug legal und erzeugt nur oeffentliche Korp-Credit-Pressure.
- `packages/engine/src/index.test.ts` deckt Priority-Wreck-R&D-Multiaccess inklusive Hidden-Queue-Schutz und Replay/StateHash ab.
- `packages/engine/src/index.ts` enthaelt konkrete installierte Helferpfade fuer die sieben bisher offenen V1.9.15-Runner-Tools: `Dupré` setzt beim Run-Start einen oeffentlichen Power-Counter; Access-Helfer erweitern bestehende Breach-Queues begrenzt; Reveal-Helfer markieren legalen Access side-sicher.
- `packages/engine/src/index.test.ts` deckt diese installierten Helper ueber Install-, Run-, Breach-Queue-, Hidden-Zone-Barrier- und Counter-Pfade ab.
- `packages/engine/src/index.test.ts` deckt Cerberus und Mastiff als V1.9.15-ICE-Ueberlappung mit dem bestehenden side-sicheren Trace-Bid-Fenster ab.
- `data/scenarios/v1915-run-access-multiaccess-smoke.json` dokumentiert den Release-Smoke maschinenlesbar.
- Manifest, Mechanics-Coverage, AI-Hints, AI-Smokes und AI-Approval-Manifest sind finalisiert; alle 14 Zielkarten sind `human_playable`, `deck_legal` und `ai_supported`.
- `apps/web/app/page.tsx` zeigt `V1.9.15`.
- Die V1.9.15-Kartentexte in `packages/shared/src/index.ts` sind nach der Display-Text-Finalization-Policy aus den lokal bestaetigten Matrix-Regelkernen finalisiert und enthalten keinen `V1.9.15 WIP:`-Praefix mehr. Diese Texte bleiben display-only und sind keine Engine-, Parser-, KI-, Replay- oder StateHash-Autoritaet.

## Verifikation

- `v1-9-install-and-check.ps1 -Task engine`: pass, 227 Tests.
- `v1-9-install-and-check.ps1 -Task catalog`: pass, 30 Tests.
- `v1-9-install-and-check.ps1 -Task typecheck`: pass.
- `v1-9-install-and-check.ps1 -Task ai`: pass, 84 Tests.
- `v1-9-install-and-check.ps1 -Task server`: pass, 72 Tests.
- `v1-9-install-and-check.ps1 -Task web`: pass, 76 Tests.
- `v1-9-install-and-check.ps1 -Task test`: pass, Workspace-Pakettests plus 49 Root-Spec-Tests.
- `v1-9-install-and-check.ps1 -Task lint`: pass.
- `v1-9-install-and-check.ps1 -Task build`: pass; bekannte nicht-blockierende Turbopack-NFT-Warnung bleibt.
- JSON-Validation: pass, 252 `data/**/*.json`.

## Gate-Status

`V1_9_15_done: true`

`V1_9_15_phase: final`

`hard_gate_blocker: none`

Completion-Gate ist erfuellt; der Cursor darf nach Abschlusscommit und Push auf V1.9.16 wechseln.
