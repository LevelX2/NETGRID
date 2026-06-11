# AI097 Late Run Step Stall Classifier

Datum: 2026-06-11

Branch: `codex/ai095-ai100-action-limit-closure`

Trace: `docs/reviews/ai/ai097-late-run-step-stall-classifier-a-d-5seed-2026-06-11.json`

## Ergebnis

AI097 ersetzt den groben Sammel-Subcluster `late_run_step_stall` durch konkrete Run-Step-Unterklassen. Eine Runtime-Änderung wurde nicht vorgenommen, weil der Trace keine isolierte sichere Alternative zu einem echten Run-Stall zeigt.

Der alte Sammelwert sinkt:

| Subcluster | AI096 | AI097 |
| --- | ---: | ---: |
| `late_run_step_stall` | 5 | 0 |
| `run_microstep_required` | 0 | 1 |
| `continue_chain_to_access` | 0 | 0 |
| `break_pump_required` | 0 | 1 |
| `jackout_loop` | 0 | 0 |
| `continue_without_progress` | 0 | 1 |
| `access_pending` | 0 | 0 |
| `breach_pending` | 0 | 0 |
| `mixed_unknown` | 0 | 2 |

Die zwei `mixed_unknown`-Fälle entstehen durch gemischte Endfenster, nicht durch einen einzelnen dominanten Run-Step-Stall.

## Umsetzung

Geändert wurden:

- `packages/ai/src/simulation/selfplay-trace-mining.ts`
  - Neue Subcluster für notwendige Run-Microsteps und echte Loop-Verdachte.
  - Die Klassifikation betrachtet jetzt das lokale Endfenster, damit `continue_run` korrekt erkannt wird, wenn kurz danach Access, Steal, Trash oder Breach folgt.
- `packages/ai/src/simulation/benchmark-reports.test.ts`
  - Fixture: Run-Microstep mit anschließendem Access wird nicht mehr als Stall gezählt.
  - Fixture: Continue-Loop ohne Access wird als `continue_without_progress` gezählt.
  - Fixture: Jack-out-Wiederholung wird als `jackout_loop` gezählt.
  - Redaction-/Hidden-Info-Schutz bleibt über die bestehenden JSON-Sicherheitsassertions abgedeckt.

## Finale Matrix

| Metrik | AI096 | AI097 |
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
| `corpAgendaScores` | 12 | 12 |
| `runnerAgendaSteals` | 32 | 32 |
| `corpFlatlines` | 5 | 5 |

Per Action-Limit-Spiel:

| Pair | Seed | AI097-Subcluster | Letzte Signatur |
| --- | --- | --- | --- |
| A | `ai-v143-tuning-002` | `continue_without_progress` | Run/Continue-Kette endet vor weiterem Progress |
| B | `ai-v143-tuning-001` | `mixed_unknown` | Corp-Credit plus Runner-Run-Microsteps |
| B | `ai-v143-tuning-003` | `runner_late_gain_credit_real_reserve` | Run beginnt, Pump/Break steht noch aus |
| B | `ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | Credit-Reserve-Endfenster |
| C | `ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | Credit/Draw/Event/Advance-Mix |
| C | `ai-v143-tuning-002` | `break_pump_required` | Break-/Continue-Kette führt zu Access/Trash |
| C | `ai-v143-tuning-004` | `mixed_unknown` | Break/Continue plus Draw/Corp-Install-Mix |
| C | `ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | Access/Trash bereits erfolgt, danach Setup |
| D | `ai-v143-tuning-003` | `run_microstep_required` | Run startet kurz vor weiterem Encounter-Schritt |
| D | `ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | Reserve-Endfenster |

## Verifikation

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai097-late-run-step-stall-classifier-a-d-5seed-2026-06-11.json
```

Ergebnis:

- `benchmark-reports.test.ts`: 13 Tests grün
- `@netgrid/ai` Typecheck grün
- A-D-x5 Trace safety-grün

## Schlussfolgerung

AI097 liefert keine klare Runtime-Fix-Ursache. Die echten Resttreiber sind jetzt:

- Runner-Reserve-Credits, nicht No-Need-Credits
- ein einzelner `continue_without_progress`
- ein einzelner `run_microstep_required`
- ein einzelner `break_pump_required`
- zwei gemischte Endfenster

Damit soll AI098 die Corp-Score-Output-Frage dokumentieren, statt auf Basis des früheren Sammelbegriffs `late_run_step_stall` pauschal in Run-Microsteps einzugreifen.
