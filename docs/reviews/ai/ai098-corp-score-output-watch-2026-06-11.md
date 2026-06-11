# AI098 Corp Score Output Watch

Datum: 2026-06-11

Branch: `codex/ai095-ai100-action-limit-closure`

Auditdaten: `docs/reviews/ai/ai098-corp-score-output-watch-2026-06-11.json`

Referenztrace: `docs/reviews/ai/ai097-late-run-step-stall-classifier-a-d-5seed-2026-06-11.json`

## Ergebnis

AI098 nimmt keine Runtime-Änderung vor. Der Audit findet keinen klaren, sicher verpassten Corp-Score:

- `corpAgendaScores = 12`
- `corpFlatlines = 5`
- `unsafeScoreChosen = 3`
- `safeScoreMisses = 0`
- `scoreWindowMissed = 0` im A-D-x5-Trace

Damit ist `corpAgendaScores = 12` nach aktuellem Trace kein isolierter Scoreline-Bug. Eine direkte Score-Erhöhung oder ein Safety-Gate-Bypass wäre nicht begründet.

## Audit-Zusammenfassung

| Metrik | Wert |
| --- | ---: |
| Spiele | 20 |
| Corp Score Actions | 12 |
| Runner Steals | 32 |
| Corp Flatlines | 5 |
| Terminal Score Windows | 70 |
| Terminal Scores | 12 |
| Terminal Advances | 10 |
| Terminal Skips | 35 |
| Skips für Economy | 7 |
| Skips für Protection | 0 |
| Skips für Draw | 0 |
| Skips für Install Ice | 0 |
| Skips mit späterem ActionLimit | 0 |
| Unsafe Scores | 3 |
| Sichere verpasste Scorefenster | 0 |

## Per-Pair-Lage

| Pair | Corp Scores | Runner Steals | Action-Limit-Spiele | Unsafe Scores | Safe Misses |
| --- | ---: | ---: | ---: | ---: | ---: |
| A | 3 | 13 | 1 | 1 | 0 |
| B | 4 | 2 | 3 | 0 | 0 |
| C | 2 | 8 | 4 | 1 | 0 |
| D | 3 | 9 | 2 | 1 | 0 |

## Bewertung

Die 12 Corp-Scores sind nicht isoliert niedrig, weil fünf Corp-Siege über Flatline laufen und Runner-Steals in mehreren langen Spielen den Scoreplan früh unterbrechen. Die Terminal-Fenster zeigen außerdem keine Fälle, in denen ein sicherer Score legal und unproblematisch offen lag, aber ohne Gate-Grund ausgelassen wurde.

Die drei Unsafe-Scores bleiben der bekannte AI094/AI095-Restbefund. AI096 hatte kurz eine stärkere Safety-Penalty getestet; diese wurde nicht übernommen, weil sie Score-Window-/Passive-Signale deutlich verschlechterte. AI098 bestätigt damit: ohne konkretes sicheres Alternativfenster bleibt die richtige Maßnahme Dokumentation statt Score-Buff.

## Verifikation

Audit erzeugt mit fokussierter Auswertung der A-D-x5-Simulation:

```powershell
corepack pnpm --filter @netgrid/server exec tsx <inline-ai098-audit>
```

Ergebnis:

- 20 Spiele ausgewertet
- keine Illegal-/Replay-/Redaction-Verschlechterung gegenüber AI097
- `safeScoreMisses = 0`

## Schlussfolgerung

AI098 schließt keinen Runtime-Fix an. AI099 soll den ActionLimit-Zielwert mit den nun präziseren Restursachen bewerten:

- kein echter `late_gain_credit_without_funding_need`
- kein grober `late_run_step_stall`
- verbleibend: Runner-Reserve, einzelne Run-Microstep-/Continue-Fälle und gemischte Endfenster
