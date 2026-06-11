# AI099 Action-Limit Closure Review

Datum: 2026-06-11

Branch: `codex/ai095-ai100-action-limit-closure`

Pflichttrace: `docs/reviews/ai/ai099-action-limit-closure-a-d-5seed-2026-06-11.json`

Erweiterter Watchtrace: `docs/reviews/ai/ai099-action-limit-closure-a-d-10seed-2026-06-11.json`

## Ergebnis

AI099 bestätigt die AI096/AI097-Schlussfolgerung im Pflichtumfang: Die verbliebenen Action-Limits haben keine klare, sichere Runtime-Ursache mehr im alten `late_gain_credit_without_funding_need` oder im alten `late_run_step_stall`.

Der erweiterte 10-Seed-Watch hat aber einen echten Engine-Fehler sichtbar gemacht: In Pair A, Seed `ai-v143-tuning-006`, konnte `corp.end_turn` beim Runner-Turnstart an The Shell Traders scheitern, wenn der letzte Shell-Counter eine vorbereitete Programminstallation auslösen sollte, der Runner aber aktuell kein freies Memory hatte. Das war keine AI-Entscheidungsursache, sondern ein LegalActions-/Turnwechsel-Guard-Fehler.

Der Fehler ist behoben. Prepared-Shell-Traders-Ziele bleiben legal, solange ein nicht-finaler Counter entfernt wird. Beim finalen Counter wird das Ziel nur dann als entfernbar angeboten oder automatisch gewählt, wenn die kostenlose Installation aktuell legal ist. Dadurch bleiben Turnwechsel, LegalActions und Replay deterministisch, ohne verdeckte Daten oder AI-Sonderlogik einzuführen.

## Umsetzung

Geändert wurden:

- `packages/engine/src/game/abilities/runner-special-trigger-execution.ts`
  - `shellTradersPreparedTargetIds` filtert finale Shell-Counter jetzt gegen die reale kostenlose Installierbarkeit.
  - Nicht-finale Shell-Counter bleiben trotz Memory-Druck fortschreitbar.
  - Die bestehende Installationsausführung bleibt die Regelautorität für die eigentliche Rig-Installation.
- `packages/engine/src/game/abilities/runner-special-trigger-execution.test.ts`
  - Regressionstest: finaler Shell-Counter wird bei Memory-Mangel nicht entfernt und crasht den Start-of-Turn nicht.
  - Regressionstest: nicht-finaler Shell-Counter darf trotz Memory-Druck weiter reduziert werden.

## Pflichtmatrix

| Metrik | AI098/AI097 | AI099 x5 |
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
| `passiveActionWithScoreLineAvailable` | 2 | 2 |
| `corpAgendaScores` | 12 | 12 |
| `runnerAgendaSteals` | 32 | 32 |
| `corpFlatlines` | 5 | 5 |

Action-Limit-Subcluster im Pflichttrace:

| Subcluster | AI099 x5 |
| --- | ---: |
| `late_gain_credit_without_funding_need` | 0 |
| `runner_late_gain_credit_real_reserve` | 5 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 |
| `corp_late_gain_credit_no_safe_alternative` | 0 |
| `late_run_step_stall` | 0 |
| `run_microstep_required` | 1 |
| `continue_chain_to_access` | 0 |
| `break_pump_required` | 1 |
| `continue_without_progress` | 1 |
| `mixed_unknown` | 2 |

## Erweiterter Watch

Der 10-Seed-Watch läuft nach dem Shell-Traders-Fix safety-grün:

| Metrik | AI099 x10 |
| --- | ---: |
| Spiele | 40 |
| Entscheidungen | 5140 |
| Critical Findings | 0 |
| Illegal Actions | 0 |
| Replay Failures | 0 |
| Redaction Safe | 1 |
| `actionLimitReached` | 21 |
| `unsafeScoreChosen` | 8 |
| `passiveActionWithScoreLineAvailable` | 6 |
| `corpAgendaScores` | 24 |
| `runnerAgendaSteals` | 55 |
| `corpFlatlines` | 9 |

Per Pair:

| Pair | Corp Scores | Runner Steals | Corp Flatlines | Action-Limit-Spiele | Unsafe Scores | Passive Score-Line-Actions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 4 | 19 | 1 | 3 | 1 | 3 |
| B | 7 | 4 | 4 | 6 | 0 | 0 |
| C | 7 | 14 | 0 | 7 | 5 | 3 |
| D | 6 | 18 | 4 | 5 | 2 | 0 |

## Verifikation

```powershell
corepack pnpm --filter @netgrid/engine exec vitest run src/game/abilities/runner-special-trigger-execution.test.ts
corepack pnpm --filter @netgrid/engine typecheck
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai099-action-limit-closure-a-d-10seed-2026-06-11.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 50
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai099-action-limit-closure-a-d-5seed-2026-06-11.json --max-actions 160 --max-findings 50
```

Ergebnis:

- Engine-Fokustest: 8 Tests grün
- `@netgrid/engine` Typecheck grün
- A-D-x5 Trace safety-grün
- A-D-x10 Trace safety-grün

## Schlussfolgerung

AI099 schließt einen klaren Engine-Fehler aus dem erweiterten Watch, ändert aber keine AI-Heuristik. Die verbleibenden Action-Limits sind weiterhin Diagnose-Restklassen: Runner-Reserve, einzelne notwendige Run-Microsteps und gemischte Endfenster.

AI100 soll deshalb keinen neuen Tuning-Schnitt erzwingen, sondern den gesamten Zielblock mit Full Sweep, finalem A-D-x5-Trace und Abschlussreview verifizieren.
