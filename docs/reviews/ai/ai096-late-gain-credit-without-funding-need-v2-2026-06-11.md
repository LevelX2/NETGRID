# AI096 Late Gain Credit Without Funding Need v2

Datum: 2026-06-11

Branch: `codex/ai095-ai100-action-limit-closure`

Trace: `docs/reviews/ai/ai096-late-gain-credit-v2-a-d-5seed-2026-06-11.json`

## Ergebnis

AI096 reduziert den alten Sammel-Subcluster `late_gain_credit_without_funding_need` von 6 auf 0, ohne die AI095-Safety-Zielwerte zu verschlechtern:

- `illegalActions = 0`
- `replayFailures = 0`
- `allRedactionSafe = true`
- `unsafeScoreChosen = 3`
- `repeated_no_progress_run = 33`
- `actionLimitReached = 10`

Die eigentliche Schlussfolgerung ist wichtig: Die vermeintlichen No-Need-Credit-Fälle waren im A-D-x5-Lauf keine klaren sicheren Progress-Aussetzer. Sie klassifizieren sich jetzt als `runner_late_gain_credit_real_reserve = 5`. Eine Runtime-Verbreiterung über den bereits vorhandenen engen Closeout-Guard hinaus wurde getestet und verworfen.

## Umsetzung

Geändert wurden:

- `packages/ai/src/index.ts`
  - Der vorhandene Runner-Malus für wiederholtes spätes `gain_credit` verwendet nun eine explizite Safe-Progress-Target-Hilfsfunktion.
  - Das Verhalten bleibt auf den bisherigen engen Closeout-Fall begrenzt: frische Pressure-Line, keine Funding Need, keine wiederholte Same-Server-No-Progress-Linie.
- `packages/ai/src/simulation/selfplay-trace-mining.ts`
  - `gain_credit`-Subcluster werden nach Runner/Corp und Reserve-/Alternativlage getrennt.
  - Der alte Sammel-Subcluster bleibt als Kompatibilitätsfeld erhalten, wird aber nicht mehr für klare Runner-/Corp-Fälle verwendet.
- Tests:
  - Runner-Credit wird bei klar sicherer Progress-Alternative weiter bestraft.
  - Runner-Credit bleibt bei echtem Funding-/Reservebedarf erlaubt.
  - Repeated-No-Progress-Run verdrängt Credit nicht.
  - Unsafe-Score-Evidence bleibt von Credit-Alternativen side-safe getrennt.

## Verworfener Versuch

Ein breiterer Runner-Guard, der auch nicht-closeout `readyTargets` erzwingen sollte, wurde nicht übernommen. Der A-D-x5-Lauf damit zeigte:

| Metrik | Wert |
| --- | ---: |
| `actionLimitReached` | 10 |
| `unsafeScoreChosen` | 4 |
| `repeated_no_progress_run` | 34 |
| `passiveActionWithScoreLineAvailable` | 9 |

Das verletzt die AI094/AI095-Safety-Grenzen. Der finale AI096-Stand nimmt diese Verbreiterung deshalb zurück.

## Finale Matrix

| Metrik | AI095 | AI096 |
| --- | ---: | ---: |
| Spiele | 20 | 20 |
| Entscheidungen | 2501 | 2501 |
| Critical Findings | 0 | 0 |
| High Findings | 3 | 3 |
| Illegal Actions | 0 | 0 |
| Replay Failures | 0 | 0 |
| Redaction Safe | 1 | 1 |
| `actionLimitReached` | 10 | 10 |
| `unsafeScoreChosen` | 3 | 3 |
| `repeated_no_progress_run` | 33 | 33 |
| `passiveActionWithScoreLineAvailable` | 2 | 2 |
| `scoreWindowMissed` | 0 | 0 |
| `corpAgendaScores` | 12 | 12 |
| `runnerAgendaSteals` | 32 | 32 |
| `corpFlatlines` | 5 | 5 |

Action-Limit-Cluster:

| Cluster | AI096 |
| --- | ---: |
| `action_limit_low_value_repeat` | 7 |
| `action_limit_setup_economy_loop` | 1 |
| `action_limit_mixed_or_unknown` | 2 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |

Action-Limit-Subcluster:

| Subcluster | AI096 |
| --- | ---: |
| `late_gain_credit_without_funding_need` | 0 |
| `runner_late_gain_credit_without_funding_need` | 0 |
| `runner_late_gain_credit_real_reserve` | 5 |
| `runner_late_gain_credit_no_safe_alternative` | 0 |
| `corp_late_gain_credit_without_rez_score_protection_need` | 0 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 |
| `corp_late_gain_credit_no_safe_alternative` | 0 |
| `late_run_step_stall` | 5 |
| `mixed_unknown` | 0 |

## Verifikation

```powershell
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai096-late-gain-credit-v2-a-d-5seed-2026-06-11.json
```

Ergebnis:

- `@netgrid/ai`: 63 Dateien, 1105 Tests grün
- `@netgrid/ai` Typecheck grün
- `benchmark-reports.test.ts`: 11 Tests grün
- A-D-x5 Trace safety-grün

## Schlussfolgerung

AI096 schließt die klare Ursache im Subcluster: `late_gain_credit_without_funding_need` war zu grob und hat Reserve-/Safety-Credit falsch eingeordnet. Eine weitere Action-Limit-Reduktion ist aus AI096 heraus nicht sauber begründbar. Der nächste relevante Rest ist jetzt `late_run_step_stall`, also AI097.
