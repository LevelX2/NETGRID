# AI070 Action-Semantik-Brücke Review

Stand: 2026-06-10
Status: abgeschlossen im Paket `AI070`
Branch: `codex/ai068-ai072-selfplay-quality`

## Ziel

BasicActions sowie Score-, Run-, Rez- und Advance-Aktionen sollen über die vorhandene `ActionSemanticCandidate`-Brücke minimal, side-sicher und produktionsnah in Runtime-Ranking und Diagnostik sichtbar sein.

## Umsetzung

- Die Semantic-Runtime baut `ActionSemanticCandidate`s jetzt vor dem Choice-Scoring und übergibt sie an `scoreSemanticRuntimeAction`.
- Der Runtime-Scope kann stabile `semanticActionType`-Werte aus `ActionSemanticCandidate` nutzen:
  - `economy.gain_credit`
  - `draw.card`
  - `run.start`, `run.continue`, `run.jack_out`
  - `corp_window.rez`, `corp_window.decline_rez`
  - `score.advance_card`, `score.agenda`
  - Access-, Choice- und End-Turn-Basisfamilien
- Wenn kein stabiler Candidate-Scope passt, bleibt der bisherige Action-Type-Fallback aktiv.
- Runtime-Evidence enthält side-sicher:
  - `action_semantic_candidate:<semanticActionType>`
  - `action_semantic_projection:<primaryProjectionStatus>`

## A-D-Messlauf

Der A-D-Lauf ist gegenüber AI069 unverändert. Das ist für AI070 erwartet, weil das Paket die Semantik-Brücke anschließt und sichtbar macht, aber keine neue strategische Heuristik einführt.

| Metric | Nach AI069 | Nach AI070 |
| --- | ---: | ---: |
| games | 20 | 20 |
| illegalActions | 0 | 0 |
| replayFailures | 0 | 0 |
| allRedactionSafe | 1 | 1 |
| criticalFindings | 0 | 0 |
| corp_never_scores_long_game | 3 | 3 |
| actionLimitReached | 11 | 11 |
| repeated_no_progress_run | 33 | 33 |
| recovery_low_value_loop | 88 | 88 |
| corpAgendaScores | 13 | 13 |
| runnerAgendaSteals | 30 | 30 |
| corpFlatlines | 4 | 4 |
| scoreWindowMissed | 0 | 0 |
| unsafeScoreChosen | 6 | 6 |
| passiveActionWithScoreLineAvailable | 6 | 6 |

## Bewertung

AI070 erfüllt die strukturelle Anforderung, ohne die Scoreline- oder Loop-Metriken erneut zu verschieben. Die nächsten Pakete können `action_semantic_candidate` und die vorhandene `ActionSemanticCandidate`-Struktur für trennschärfere Diagnostics und Doctrine-Consumer verwenden.

## Verification

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/action-semantic-candidate.test.ts`: grün.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "penalizes repeated runner pressure on the same server across no-progress setup|surfaces action semantic candidate evidence in semantic runtime choices"`: grün.
- `git diff --check`: grün.
- A-D-Trace-Mining-Lauf: ausgeführt, gegenüber AI069 unverändert.

## Sicherheitsgrenzen

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Die Brücke liest nur vorhandene `LegalActions` und side-sichere Candidate-Projektionen.
- Keine Hidden-Info-Erweiterung.
- Keine Karten-ID-Hardcodierung.
