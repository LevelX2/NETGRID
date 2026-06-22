# AI Trace Planner Strength Loop Planning Gate

Datum: 2026-06-22

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai-trace-planner-strength-loop-planning-gate-2026-06-22.json --pairs a,b,c,d --max-actions 160 --include-action-alternatives --max-alternatives-per-finding 8
```

## Ergebnis

| Metrik | Wert |
|---|---:|
| Spiele | 20 |
| Entscheidungen | 2492 |
| Findings | 836 |
| High Findings | 4 |
| Medium Findings | 592 |
| Low Findings | 240 |
| IllegalActions | 0 |
| ReplayFailures | 0 |
| RedactionSafe | true |
| Action-Limits | 11 |
| Corp Scores | 13 |
| Runner Steals | 28 |
| Corp Flatlines | 5 |

## Dominante Diagnoseklassen

| Detector | Anzahl |
|---|---:|
| `plan_step_action_mismatch` | 539 |
| `semantic_override_suspicious` | 408 |
| `repeated_no_progress_run` | 35 |
| `action_limit_reached` | 11 |
| `bank_over_target_without_funding_need` | 7 |
| `recovery_low_value_loop` | 4 |
| `corp_never_scores_long_game` | 4 |

## Kandidatenableitung

Die Action-Alternativen zeigen keine Hidden-Info- oder Legalitätslücke. Der
stärkste wiederholbare Low-Risk-Hebel liegt im Planner-Mapping:

- `runner.build_credit_base` bleibt in einigen langen Runner-Situationen aktiv.
- Gleichzeitig existieren legale, nützliche Hand-Development-Aktionen.
- Diese Alternativen werden als `plan_mismatch` beziehungsweise
  `excluded_by_current_plan` markiert.
- Reine weitere Credit-Base-Aktionen verlängern dann Spiele oder führen zu
  Low-Value-Repeat-Clustern, obwohl ein vorhandener legaler Install-Schritt
  den finanzierten Zweck teilweise bereits erfüllen könnte.

## Entscheidung

`implement_candidate`

TRACE-PLANNER-2 soll keinen neuen Action-Typ, keine LegalAction-Erzeugung und
keine Hidden-Info-Erweiterung einführen. Der Kandidat ist:

Wenn eine nützliche Runner-Handentwicklung bereits `legal_now` ist, soll ein
`runner.build_credit_base`-Plan zurücktreten, solange keine harte
Mindestreserve, keine Remote-Contest-Finanzierung und kein Overdraw-Credit-
Pressure aktiv ist.
