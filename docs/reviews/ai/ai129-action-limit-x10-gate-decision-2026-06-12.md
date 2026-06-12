# AI129 Action-Limit x10 Gate Decision and Target Reset

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI129 trennt das bisherige A-D-x5-Gate vom erweiterten A-D-x10-Watch. `<=8` bleibt ein Optimierungsziel, aber kein zulässiger Erfolg, wenn x10 gleichzeitig schlechter wird.

## Quellen

- x5: `docs/reviews/ai/ai122-final-a-d-5seed-2026-06-12.json`
- x10: `docs/reviews/ai/ai120-residual-action-limit-a-d-10seed-2026-06-12.json`
- x10 Inventory: `docs/reviews/ai/ai123-x10-residual-cluster-inventory-2026-06-12.md`
- Kandidatenentscheidung: `docs/reviews/ai/ai128-one-candidate-runtime-experiment-2026-06-12.md`

## Vergleich x5 vs. x10

| Metrik | A-D-x5 | A-D-x10 |
| --- | ---: | ---: |
| Spiele | 20 | 40 |
| Entscheidungen | 2498 | 5264 |
| Action-Limit-Spiele | 9 | 21 |
| Action-Limit-Rate | 45.0% | 52.5% |
| Illegale Actions | 0 | 0 |
| Replay-Fehler | 0 | 0 |
| Redaction safe | true | true |
| `repeated_no_progress_run` | 31 | 53 |
| `unsafeScoreChosen` | 3 | 8 |
| `passiveActionWithScoreLineAvailable` | 4 | 8 |
| `scoreWindowMissed` | 0 | 0 |

## Pair-Verteilung x10

| Pair | Action-Limit-Spiele | Rate |
| --- | ---: | ---: |
| A | 3/10 | 30.0% |
| B | 6/10 | 60.0% |
| C | 7/10 | 70.0% |
| D | 5/10 | 50.0% |

## Seed-Verteilung

| Seedbereich | Action-Limit-Spiele | Anteil |
| --- | ---: | ---: |
| 001-005 | 9/20 | 45.0% |
| 006-010 | 12/20 | 60.0% |

Der x10-Zusatzbereich ist schlechter als der x5-Basisbereich. Der x5-Wert ist daher nicht robust stabil.

## Subcluster-Verteilung x10

| Subcluster | Spiele |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 9 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 3 |
| `run_microstep_required` | 3 |
| `corp_late_gain_credit_no_safe_alternative` | 2 |
| `break_pump_required` | 1 |
| `continue_chain_to_access` | 1 |
| `late_draw_for_coverage_or_hand_goal` | 1 |
| `late_draw_without_coverage_or_hand_goal` | 1 |

## Gate-Entscheidung

### Harte Safety-Gates

Diese Gates bleiben hart und blockierend:

| Gate | Ziel |
| --- | ---: |
| Illegal Actions | 0 |
| Replay-Fehler | 0 |
| Redaction-Fail | 0 |
| `scoreWindowMissed` | 0 |
| Hidden-Info-Marker | 0 |

### A-D-x5 Gate

| Gate | Ziel |
| --- | ---: |
| `actionLimitReached` | `<= 9` |
| `unsafeScoreChosen` | `<= 3` |
| `repeated_no_progress_run` | nicht über 31 |
| `passiveActionWithScoreLineAvailable` | nicht über 4 |

Interpretation:

- `<= 9` ist aktuell das stabile Minimum-Gate.
- `<= 8` bleibt Zielwert, aber nicht als alleiniger Merge-Grund.
- Ein x5-Verbesserungskandidat wird verworfen, wenn x10 schlechter wird.

### A-D-x10 Watch-Gate

| Gate | Zielkorridor |
| --- | ---: |
| `actionLimitReached` | Watch: `<= 21`, Ziel: `< 21`, stark: `<= 18` |
| `unsafeScoreChosen` | Watch: `<= 8`, Ziel: `< 8`, stark: `<= 6` |
| `repeated_no_progress_run` | Watch: `<= 53`, Ziel: `< 53`, stark: `<= 45` |
| `passiveActionWithScoreLineAvailable` | Watch: `<= 8`, Ziel: `< 8`, stark: `<= 6` |

Interpretation:

- x10 ist zunächst Watch-Gate, nicht hartes Default-Gate.
- Ein Runtime-Kandidat darf x10 nicht verschlechtern.
- Eine x5-Verbesserung zählt nur, wenn x10 mindestens stabil bleibt.
- Für eine robuste nächste KI-Runde ist eine x10-Verbesserung wichtiger als ein isoliertes x5-`<=8`.

## Regressionsregeln

Ein Kandidat wird verworfen, wenn eine dieser Bedingungen eintritt:

- `actionLimitReached` steigt im x5 oder x10.
- `unsafeScoreChosen > 3` im x5 oder x10-Rate steigt.
- `repeated_no_progress_run` steigt.
- `passiveActionWithScoreLineAvailable` steigt.
- x5 verbessert sich, aber x10 wird schlechter.
- Illegal Actions, Replay-Fehler oder Redaction-Fail auftreten.

## Zielkorridor für die nächste KI-Runde

Priorität:

1. Safety unverändert grün halten.
2. x10 nicht verschlechtern.
3. x10-Subcluster mit klarer Alternative reduzieren.
4. Erst danach x5 von 9 auf 8 drücken.

Empfohlene nächste Kandidatenklasse:

- keine generische Economy- oder Draw-Strafe;
- nur Alternativen-Snapshot-gestützte Korrektur;
- bevorzugt wiederholte x10-Fälle mit gleicher besserer LegalAction-Familie.

## Entscheidung

AI129 setzt:

- A-D-x5 `actionLimitReached <= 9` als aktuelles Gate;
- A-D-x10 `actionLimitReached <= 21` als Watch-Gate;
- x5 `<= 8` als sekundäres Ziel, nicht als isoliertes Erfolgskriterium;
- Safety-Gates bleiben hart und unverändert.

## Verifikation

- Abgleich mit AI122 x5
- Abgleich mit AI120/AI123 x10
- `git diff --check`
