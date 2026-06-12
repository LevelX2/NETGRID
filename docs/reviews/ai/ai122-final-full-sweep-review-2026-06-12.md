# AI122 Final Full Sweep Review

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI122 schließt den AI115-AI122-Folgeblock mit vollständiger Verifikation und finalem A-D-x5-Trace ab.

## Finaler Trace

Artefakt:

- `docs/reviews/ai/ai122-final-a-d-5seed-2026-06-12.json`

Kernwerte:

| Metrik | AI122 |
| --- | ---: |
| Spiele | 20 |
| Entscheidungen | 2498 |
| Illegale Actions | 0 |
| Replay-Fehler | 0 |
| Redaction safe | true |
| `actionLimitReached` | 9 |
| `repeated_no_progress_run` | 31 |
| `unsafeScoreChosen` | 3 |
| `passiveActionWithScoreLineAvailable` | 4 |

Subcluster:

| Subcluster | AI122 |
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

## Ergebnis des Folgeblocks

AI115-AI122 hat die Restfälle besser belegt, aber keinen Runtime-Fix übernommen.

Wesentliche Entscheidungen:

- B005 hat eine konkrete legale Draw-Alternative gegenüber wiederholtem Reserve-Credit.
- Der getestete enge Runtime-Kandidat wurde verworfen, weil `actionLimitReached` im A-D-x5-Kandidatentrace von 9 auf 10 stieg.
- Corp-Ability-Alternative ist `Corporate Boon` und in diesem Fenster `economy_only`, nicht Scoreline-/Protection-/Rez-Fortschritt.
- Coverage-Draws sind gemischt: frühere Draws konvertieren oder erhalten Optionen, finale Draws konvertieren nicht.
- A-D-x10 ist safety-grün, aber `actionLimitReached = 21/40` zeigt, dass der Zielwert nicht robust skaliert.

## Verifikation

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/ai122-generate-final-trace.test.ts` temporär zur Trace-Erzeugung
- `git diff --check`

## Schlussfolgerung

Der Block ist abgeschlossen. `actionLimitReached <= 9` bleibt auf A-D-x5 stabil, aber nicht als robuste x10-Aussage. Weitere Optimierung sollte nicht denselben verworfenen B005-Malus erneut testen, sondern neue x10-Restcluster gezielt schneiden.
