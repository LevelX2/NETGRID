# AI120 Residual Action-Limit A-D-x10 Watch

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI120 prüft, ob der A-D-x5-Zielwert `actionLimitReached <= 9` auf einem erweiterten A-D-x10-Seed-Korpus stabil bleibt.

## Artefakt

Trace:

- `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`

Konfiguration:

- Pair A-D
- Seeds `ai-v143-tuning-001` bis `ai-v143-tuning-010`
- `maxActions: 160`
- `maxFindings: 50`

## Ergebnis

| Metrik | A-D-x10 |
| --- | ---: |
| Spiele | 40 |
| Entscheidungen | 5264 |
| Illegale Actions | 0 |
| Replay-Fehler | 0 |
| Redaction safe | true |
| `actionLimitReached` | 21 |
| `repeated_no_progress_run` | 53 |
| `scoreWindowMissed` | 0 |
| `unsafeScoreChosen` | 8 |
| `passiveActionWithScoreLineAvailable` | 8 |
| Corp-Scores | 25 |
| Runner-Steals | 57 |
| Corp-Flatlines | 8 |

Subcluster:

| Subcluster | A-D-x10 |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 9 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 3 |
| `corp_late_gain_credit_no_safe_alternative` | 2 |
| `late_draw_for_coverage_or_hand_goal` | 1 |
| `late_draw_without_coverage_or_hand_goal` | 1 |
| `run_microstep_required` | 3 |
| `continue_chain_to_access` | 1 |
| `break_pump_required` | 1 |
| `mixed_unknown` | 0 |
| `continue_without_progress` | 0 |

## Bewertung

Safety bleibt grün:

- keine Illegal Actions,
- keine Replay-Fehler,
- keine Redaction-Fails,
- keine `scoreWindowMissed`.

Der A-D-x5-Zielwert ist aber nicht als robust stabil zu bewerten. A-D-x10 hat 21 Action-Limit-Spiele aus 40. Das ist mehr als nur eine lineare Bestätigung der x5-Lage und zeigt, dass die Residualprobleme seedabhängig bleiben.

Wichtig:

- `mixed_unknown = 0` bleibt gut.
- `continue_without_progress = 0` bleibt gut.
- Ein neuer `late_draw_without_coverage_or_hand_goal` in Pair A zeigt, dass die Late-Draw-Klasse noch nicht vollständig bereinigt ist.
- B005 bleibt relevant, ist aber nicht der einzige robuste Restcluster im x10-Korpus.

## Schlussfolgerung

AI120 priorisiert keine sofortige breite Runtime-Änderung. Ein AI121-Fix darf weiterhin nur eng sein. Der beste belegte Kandidat bleibt B005 Coverage-Draw gegenüber wiederholtem Reserve-Credit; neue x10-Restfälle müssen separat geschnitten werden, wenn sie nach AI122 weiter relevant sind.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/ai120-generate-x10-watch.test.ts` temporär zur Artefakterzeugung
- `git diff --check`
