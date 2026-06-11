# AI090 Action-Limit Low-Value-Repeat Subclusters Review

Datum: 2026-06-11

Branch: `codex/ai088-ai094-post-stabilization-closure`

## Ergebnis

AI090 erweitert die Trace-Diagnostik um Action-Limit-Subcluster auf Basis der letzten 40 Aktionen und ergänzt einen eng begrenzten Runtime-Guard gegen wiederholtes Runner-`gain_credit` ohne Funding Need vor einem frischen zentralen Closeout-Ziel.

Der Guard bleibt absichtlich eng:

- nur Runner-`gain_credit`
- nur bei wiederholten jüngsten Basic-Credit-Aktionen
- nur ohne aktiven Funding Need
- nur bei echtem zentralem Closeout-Profil
- nicht, wenn das Pressure-Ziel gerade als Same-Server-No-Progress-Lauf wiederholt wurde

Ein breiterer erster Guard gegen alle frischen Pressure-Ziele wurde verworfen: Er hielt `actionLimitReached` bei 10, erhöhte aber `repeated_no_progress_run` auf 34 und `unsafeScoreChosen` auf 4. Dieser Stand wurde nicht übernommen.

## Baseline AI088

Quelle: `docs/reviews/ai/ai088-current-head-a-d-5seed-2026-06-11.json`

- Spiele: 20
- `actionLimitReached`: 10
- `unsafeScoreChosen`: 3
- `repeated_no_progress_run`: 33
- `action_limit_low_value_repeat`: 8
- `action_limit_mixed_or_unknown`: 2

## AI090 Trace

Quelle: `docs/reviews/ai/ai090-action-limit-a-d-5seed-2026-06-11.json`

- Spiele: 20
- `actionLimitReached`: 10
- `unsafeScoreChosen`: 3
- `repeated_no_progress_run`: 33
- `action_limit_low_value_repeat`: 7
- `action_limit_setup_economy_loop`: 1
- `action_limit_mixed_or_unknown`: 2

Subcluster der zehn Action-Limit-Spiele:

| Subcluster | Matches |
| --- | ---: |
| `late_gain_credit_without_funding_need` | 6 |
| `late_run_step_stall` | 4 |
| `late_draw_without_coverage_or_hand_goal` | 0 |
| `late_ability_reuse_low_delta` | 0 |
| `late_install_low_delta` | 0 |
| `mixed_unknown` | 0 |

## Bewertung

Das harte Non-Regression-Gate ist erfüllt:

- keine Illegal Actions
- keine Replay-Failures
- Redaction-Safety grün
- `unsafeScoreChosen` nicht erhöht
- `repeated_no_progress_run` nicht erhöht
- `actionLimitReached` bleibt unter 11

Die Zielmarke `actionLimitReached <= 8` ist nicht erreicht. Der Restbefund ist nicht mehr nur ein einzelner klarer Credit-Loop: 4/10 Fälle sind `late_run_step_stall`, und die verbleibenden Credit-Fälle enthalten auch Corp-/Tempo-Kontext. Eine aggressivere AI090-Änderung würde in AI091/AI092-Safety hineinwirken und wurde deshalb nicht übernommen.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "repeated basic credit|same-server|economy setup|coverage and credits"`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai090-action-limit-a-d-5seed-2026-06-11.json`

