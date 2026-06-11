# AI094 Final Full Sweep Review

Datum: 2026-06-11

Branch: `codex/ai088-ai094-post-stabilization-closure`

HEAD bei Trace-Erzeugung: siehe `gitHead` in `docs/reviews/ai/ai094-final-a-d-5seed-2026-06-11.json`

## Ergebnis

Der finale Full Sweep ist technisch grün:

- Root-Test grün
- Workspace-Typecheck grün
- AI094 A-D/5-Seed-Trace ohne Illegal Actions
- keine Replay-Failures
- Redaction-Safety grün

Die Produkt-/AI-Zielmarke `actionLimitReached <= 8` ist weiterhin nicht erreicht. Der finale Stand bleibt bei `actionLimitReached = 10`. Das ist als Restbefund dokumentiert und wurde nicht durch einen aggressiveren Runtime-Fix verdeckt, weil ein breiterer Pressure-Guard zuvor Safety-Metriken verschlechtert hatte.

## Verifikation

### Root-Test

Befehl:

```powershell
corepack pnpm test
```

Ergebnis:

- `packages/shared`: 1 Datei, 3 Tests grün
- `packages/catalog`: 2 Dateien, 14 Tests grün
- `packages/engine`: 157 Dateien, 1449 Tests grün
- `packages/decks`: 1 Datei, 15 Tests grün
- `packages/ai`: 55 Dateien, 1059 Tests grün
- `apps/web`: 33 Dateien, 413 Tests grün
- `apps/server`: 6 Dateien, 125 Tests grün
- Root-Specs: 2 Dateien, 5 Tests grün

### Typecheck

Befehl:

```powershell
corepack pnpm -r --if-present run typecheck
```

Ergebnis: alle Workspace-Projekte grün.

### Finaler Trace

Befehl:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai094-final-a-d-5seed-2026-06-11.json
```

Quelle: `docs/reviews/ai/ai094-final-a-d-5seed-2026-06-11.json`

| Metrik | Wert |
| --- | ---: |
| Spiele | 20 |
| Entscheidungen | 2501 |
| Critical Findings | 0 |
| High Findings | 3 |
| Illegal Actions | 0 |
| Replay Failures | 0 |
| Redaction Safe | 1 |
| `actionLimitReached` | 10 |
| `unsafeScoreChosen` | 3 |
| `repeated_no_progress_run` | 33 |
| `corp_never_scores_long_game` | 3 |
| `corpAgendaScores` | 12 |
| `runnerAgendaSteals` | 32 |
| `corpFlatlines` | 5 |

Action-Limit-Cluster:

| Cluster | Matches |
| --- | ---: |
| `action_limit_low_value_repeat` | 7 |
| `action_limit_setup_economy_loop` | 1 |
| `action_limit_mixed_or_unknown` | 2 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |

Action-Limit-Subcluster:

| Subcluster | Matches |
| --- | ---: |
| `late_gain_credit_without_funding_need` | 6 |
| `late_run_step_stall` | 4 |
| `late_draw_without_coverage_or_hand_goal` | 0 |
| `late_ability_reuse_low_delta` | 0 |
| `late_install_low_delta` | 0 |
| `mixed_unknown` | 0 |

## Restbefund

Offen bleibt die Reduktion von `actionLimitReached` von 10 auf <=8. Der nächste sinnvolle Zuschnitt sollte nicht erneut generisch Pressure erzwingen, sondern zwei getrennte Ursachen isolieren:

- `late_gain_credit_without_funding_need` mit Corp-/Runner-Seitendifferenzierung und konkretem sicheren Alternativzug
- `late_run_step_stall` mit Replay-Fixture, die zwischen notwendigem Run-Microstep und echtem Stall unterscheidet

