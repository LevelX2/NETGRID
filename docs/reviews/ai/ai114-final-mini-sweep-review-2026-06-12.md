# AI114 Finaler Residual-Action-Limit-Mini-Sweep

Datum: 2026-06-12

Branch: `codex/ai108-ai114-residual-action-limit-mini-sweep`

## Ziel

AI114 schließt den AI108-AI114-Folgeblock mit vollständiger lokaler Verifikation und finalem A-D-x5-Selfplay-Trace ab.

## Trace-Nachweis

Artefakt:

- `docs/reviews/ai/ai114-final-a-d-5seed-2026-06-12.json`

Kernwerte:

| Metrik | AI114 |
| --- | ---: |
| Spiele | 20 |
| Entscheidungen | 2498 |
| Illegale Actions | 0 |
| Replay-Fehler | 0 |
| Redaction safe | true |
| `actionLimitReached` | 9 |
| `repeated_no_progress_run` | 31 |
| `scoreWindowMissed` | 0 |
| `unsafeScoreChosen` | 3 |
| `passiveActionWithScoreLineAvailable` | 4 |
| Corp-Scores | 12 |
| Runner-Steals | 33 |
| Corp-Flatlines | 5 |

Action-Limit-Subcluster:

| Subcluster | AI114 |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 4 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 |
| `corp_late_gain_credit_no_safe_alternative` | 1 |
| `late_draw_for_coverage_or_hand_goal` | 1 |
| `late_draw_without_coverage_or_hand_goal` | 0 |
| `run_microstep_required` | 1 |
| `break_pump_required` | 1 |
| `mixed_unknown` | 0 |
| `continue_without_progress` | 0 |

## Schlussfolgerung

Der Folgeblock verbessert die Diagnosequalität des Residual-Clusters, ohne einen riskanten Runtime-Fix einzuführen. Der einzige Late-Draw-Rest aus AI108 ist nach AI109 als Coverage-/Hand-Goal-Draw eingeordnet. Für Corp-No-Safe-Alternative und Runner-Reserve-Outcomes gibt es weiterhin keinen engen Fix-Kandidaten, der das Testziel erhalten würde.

`actionLimitReached <= 9` bleibt stabil. Ein `<= 8`-Experiment bleibt ein Folgeauftrag erst dann, wenn ein konkreter legaler Alternativpfad oder ein enger Scoring-Kandidat nachgewiesen ist.

## Verifikation

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai114-final-a-d-5seed-2026-06-12.json --max-actions 160 --max-findings 50`
