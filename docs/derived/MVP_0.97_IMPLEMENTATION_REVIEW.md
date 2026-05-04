# MVP 0.97 Implementation Review - Run, Jack-out, Breach und Multiaccess

Status: bestanden
Stand: 2026-05-04

## Umgesetzter Scope

V0.97 implementiert Run/Jack-out/Breach/Multiaccess als enges, baseline-gesteuertes Mechanik-Gate:

- Additive Shared-Verträge für `jack_out`, `RunState.phase = "movement"`, `BreachState` und interne Access-Queue-Einträge.
- `MVP_0_97_BASELINE`, Demo-Decks `demo_runner_097`/`demo_corp_097` und lokale/fiktive Harness-Karte `v097_deep_dive_event`.
- V0.97-Movement-Fenster nach passiertem ICE und vor dem nächsten ICE oder Server.
- Runner-`jack_out` als LegalAction nur in diesem Movement-Fenster.
- Successful V0.97 Runs erzeugen einen internen Breach mit Queue.
- `access_card`, `steal_agenda`, `trash_accessed_card` und `decline_trash` arbeiten queue-basiert weiter.
- R&D-Multiaccess greift die obersten N Karten in stabiler Reihenfolge.
- HQ-Multiaccess wählt N verschiedene Karten deterministisch ohne Replacement über `RandomDrawRecords`.
- `access_card` bleibt Hidden-Info-Barriere; künftige Queue-Karten erscheinen nicht in PlayerViews, PublicEvents, Reconnect-Payloads oder AI-Inputs.
- AI- und Multiplayer-Smokes decken LegalActions-only, Submit, Idempotency, Reconnect und Undo-Barriere ab.

## Geprüfte Requirements

| Requirement | Ergebnis |
|---|---|
| M097-SHARED-001 | Pass. Shared Types sind additiv erweitert. |
| M097-RUN-001 | Pass. Alte Single-Access-Baselines bleiben ohne Breach/Jack-out kompatibel. |
| M097-JACK-001 bis M097-JACK-003 | Pass. Jack-out ist nur im Movement-Fenster legal, endet den Run public und bleibt side-/timing-/stale-validiert. |
| M097-BREACH-001, M097-BREACH-002 | Pass. V0.97-BreachState ist intern und leakt keine künftigen Queue-Einträge. |
| M097-ACCESS-001, M097-ACCESS-002 | Pass. Access revealt nur die aktuelle Queue-Position und setzt nach Steal/Trash/Decline deterministisch fort. |
| M097-RD-001, M097-HQ-001 | Pass. R&D-Reihenfolge und HQ-Zufall ohne Replacement sind getestet. |
| M097-ARCHIVES-001, M097-REMOTE-001 | Pass als enger Queue-Vertrag ohne vollständigen facedown-Archives-Ausbau. |
| M097-VISIBILITY-001, M097-EVENT-001 | Pass. Hidden Queue bleibt vor Access verborgen; Access-Events sind Hidden-Info-Barrieren. |
| M097-UNDO-001 | Pass. Multiplayer blockiert Undo nach Access-Barrier. |
| M097-REPLAY-001, M097-RANDOM-001 | Pass. Replay/StateHash ist deterministisch; neue Randomness ist HQ-Multiaccess-only. |
| M097-AI-001, M097-MP-001 | Pass. AI und Server verwenden nur LegalActions/PlayerViews. |
| M097-CARD-001, M097-DECK-001 | Pass. Die Harness-Karte ist lokal/fiktiv, manifestiert und über Szenarien/Tests gated. |
| M097-NOSCOPE-001 | Pass. V0.98+-Mechaniken bleiben unspielbar. |

## Risiken und Befund

| Risiko | Befund |
|---|---|
| Alte Run-Flows könnten durch Jack-out/Breach ihr Timing ändern. | Verhindert durch V0.97-Baseline-Gating und Regressionstest für Legacy-Single-Access. |
| Multiaccess könnte künftige R&D-/HQ-Karten leaken. | PlayerView zeigt nur Breach-Summary; PublicEvents revealen nur die aktuelle Access-Karte. |
| HQ-Multiaccess könnte nicht replaybar sein. | Auswahl nutzt Seed, RandomCounter und RandomDrawRecords mit eindeutigen Purposes. |
| Access-Fortsetzung könnte nach Steal/Trash/Decline hängen bleiben. | Queue-Fortsetzung und Abschluss sind engine-seitig getestet. |
| Multiplayer-Undo könnte Hidden-Info zurückrollen. | Access-Events bleiben Hidden-Info-Barrieren und blockieren Undo. |

## Prüfläufe

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 46 Tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 21 Tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 19 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 24 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.

## Review-Ergebnis

`ready_for_hardening: true`

`ready_for_MVP_0.97_final_review: true`
