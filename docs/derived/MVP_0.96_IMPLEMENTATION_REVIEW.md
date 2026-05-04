# MVP 0.96 Implementation Review - Trace, Link und Bidding

Status: bestanden
Stand: 2026-05-04

## Umgesetzter Scope

V0.96 implementiert Trace/Link/Bidding als engen, side-sicheren Mechanik-Slice:

- Additive Shared-Verträge für `TraceState`, Trace-Subroutine, Runner-Base-Link und resolved Encounter-Subroutines.
- `MVP_0_96_BASELINE`, Demo-Decks `demo_runner_096`/`demo_corp_096` und lokale/fiktive Harness-Karte `v096_trace_probe_ice`.
- Trace-Start aus einer manifestierten ICE-Subroutine im Encounter.
- Corp-`PendingChoice` vom Typ `bid_amount` mit Optionen von 0 bis zu aktuellen Corp-Credits.
- Runner-`PendingChoice` vom Typ `bid_amount` nach Corp-Bid mit Optionen von 0 bis zu aktuellen Runner-Credits.
- Exakte Credit-Kosten für beide Bids.
- CR-konformer Vergleich: `baseTraceStrength + corpBid > runnerLink + runnerBid`.
- Erfolgseffekt nur `add_tag`.
- Öffentliche Trace-Events ohne Hidden-Zone-Payloads.
- Replay/StateHash ohne neue Randomness.
- AI-Bid-Auswahl aus PlayerView/LegalActions und Server-AI-Weitergabe von `selectedChoices`.
- Multiplayer-Submit, Idempotency, Reconnect und Undo-Smoke für Trace-Bids.

## Geprüfte Requirements

| Requirement | Ergebnis |
|---|---|
| M096-SHARED-001 | Pass. Shared Types sind additiv erweitert. |
| M096-LINK-001 | Pass. Base Link 0 ist als öffentlicher Identity-Wert modelliert und deterministisch berechnet. |
| M096-TRACE-001 bis M096-TRACE-009 | Pass. Trace-Start, Corp-Bid, Runner-Bid, Kosten, Ergebnis, Erfolgseffekt und Run-Fortsetzung sind abgedeckt. |
| M096-VISIBILITY-001, M096-EVENT-001 | Pass. Trace-Events sind public und enthalten nur öffentliche Trace-/Bid-/Tag-Daten. |
| M096-UNDO-001 | Pass. Trace-Bids erzeugen keine Hidden-Info-Barriere. |
| M096-REPLAY-001 | Pass. Replay/StateHash reproduzieren Trace-Sequenzen ohne neue RandomDrawRecords. |
| M096-AI-001 | Pass. AI entscheidet Trace-Bids aus side-sicherem Input. |
| M096-MP-001 | Pass. Multiplayer-Smoke deckt Submit, Idempotency, Reconnect und Undo ab. |
| M096-CARD-001, M096-DECK-001 | Pass. Harness-Karte ist lokal/fiktiv, manifestiert und durch Szenario-/Testartefakte gated. |
| M096-NOSCOPE-001 | Pass. V0.97+-Mechaniken bleiben nicht freigeschaltet. |

## Risiken und Befund

| Risiko | Befund |
|---|---|
| Trace könnte Subroutine erneut auslösen. | Behoben durch `resolvedSubroutineIndexes` im Encounter. |
| Bid-Choice könnte ohne Auswahl replayen. | Behoben durch `PlayerAction.selectedChoices`-Revalidierung und AI-/Server-Weitergabe. |
| Trace-Events könnten Hidden-Zone-Daten enthalten. | Public Payloads enthalten nur Trace-ID, öffentliche Quelle, Bids, Strength-Werte und Tags. |
| AI könnte FullState oder verdeckte Karten nutzen. | AI-Input bleibt PlayerView/EventTail/LegalActions-only; Tests prüfen Forbidden-Felder. |
| V0.97+ Run-Ausbau könnte mitschwingen. | Kein Jack-out, Breach, Multiaccess oder Access-Ausbau implementiert. |

## Prüfläufe

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 41 Tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 19 Tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 18 Tests.

## Review-Ergebnis

`ready_for_hardening: true`

`ready_for_MVP_0.96_final_review: true`
