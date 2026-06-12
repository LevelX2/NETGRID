# AI130 Final Full Sweep Review

Datum: 2026-06-12

Branch: `codex/ai123-ai130-x10-residual-action-limit-sweep`

## Ziel

AI130 schließt AI123-AI130 mit vollständigem Testlauf, finalen A-D-Traces und Fehlerprüfung ab.

## Finale Traces

Artefakte:

- `docs/reviews/ai/ai130-final-a-d-5seed-2026-06-12.json`
- `docs/reviews/ai/ai130-final-a-d-10seed-2026-06-12.json`

## A-D-x5 Ergebnis

| Metrik | Wert |
| --- | ---: |
| Spiele | 20 |
| Entscheidungen | 2498 |
| Action-Limit-Spiele | 9 |
| Illegale Actions | 0 |
| Replay-Fehler | 0 |
| Redaction safe | true |
| `repeated_no_progress_run` | 31 |
| `unsafeScoreChosen` | 3 |
| `passiveActionWithScoreLineAvailable` | 4 |
| `scoreWindowMissed` | 0 |
| Corp-Scores | 12 |
| Runner-Steals | 33 |
| Corp-Flatlines | 5 |

Subcluster:

| Subcluster | Spiele |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 4 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 1 |
| `corp_late_gain_credit_no_safe_alternative` | 1 |
| `late_draw_for_coverage_or_hand_goal` | 1 |
| `run_microstep_required` | 1 |
| `break_pump_required` | 1 |

## A-D-x10 Ergebnis

| Metrik | Wert |
| --- | ---: |
| Spiele | 40 |
| Entscheidungen | 5264 |
| Action-Limit-Spiele | 21 |
| Illegale Actions | 0 |
| Replay-Fehler | 0 |
| Redaction safe | true |
| `repeated_no_progress_run` | 53 |
| `unsafeScoreChosen` | 8 |
| `passiveActionWithScoreLineAvailable` | 8 |
| `scoreWindowMissed` | 0 |
| Corp-Scores | 25 |
| Runner-Steals | 57 |
| Corp-Flatlines | 8 |

Subcluster:

| Subcluster | Spiele |
| --- | ---: |
| `runner_late_gain_credit_real_reserve` | 9 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 3 |
| `run_microstep_required` | 3 |
| `corp_late_gain_credit_no_safe_alternative` | 2 |
| `late_draw_for_coverage_or_hand_goal` | 1 |
| `late_draw_without_coverage_or_hand_goal` | 1 |
| `continue_chain_to_access` | 1 |
| `break_pump_required` | 1 |

## Gate-Bewertung nach AI129

| Gate | Ergebnis |
| --- | --- |
| Safety-Gates | bestanden |
| A-D-x5 `actionLimitReached <= 9` | bestanden |
| A-D-x5 `unsafeScoreChosen <= 3` | bestanden |
| A-D-x10 Watch `actionLimitReached <= 21` | bestanden |
| A-D-x10 Watch `unsafeScoreChosen <= 8` | bestanden |
| x5 Ziel `<= 8` | nicht erreicht |
| x10 robuste Stabilität | nicht erreicht, aber nicht verschlechtert |

## Checks

| Befehl | Ergebnis |
| --- | --- |
| `corepack pnpm install --frozen-lockfile` | grün, bekannte Buildscript-Warnung für `esbuild`/`sharp` |
| `corepack pnpm test` | grün |
| `corepack pnpm -r --if-present run typecheck` | grün |
| `corepack pnpm -r --if-present run test` | grün |
| `corepack pnpm --filter @netgrid/ai test` | grün |
| `corepack pnpm --filter @netgrid/engine test` | grün |
| `corepack pnpm --filter @netgrid/server test` | grün |
| `corepack pnpm --filter @netgrid/web test` | grün |
| `git diff --check` | grün |
| Redaction-Scan finaler Traces | grün |

## Fehlerbehebung

Es traten im Full Sweep keine roten Tests auf. Daher wurde keine zusätzliche Fehlerbehebung vorgenommen.

## Abschlussbewertung

AI123-AI130 verbessert nicht direkt die Runtime, sondern klärt den nächsten sicheren Arbeitskorridor:

- x10 ist der relevante neue Watch-Korpus.
- Der kleine x5-Korpus bleibt kontrolliert, aber nicht ausreichend robust.
- Kein aktuell sichtbarer Runtime-Kandidat erfüllt die Evidence-Schwelle.
- Action-Alternative-Snapshots sind jetzt in den normalen Trace-Matrix-Flow integriert und können künftige Residualentscheidungen stützen.

## Restziele

- x10-Action-Limits unter 21 drücken, ohne x5 oder Safety zu verschlechtern.
- Wiederholte Alternative-Snapshot-Muster suchen, nicht pauschale Gewichtungen.
- `runner_late_gain_credit_real_reserve`, Corp-No-Safe-D-Fälle und Run-Microsteps getrennt weiter beobachten.

## Finaler Status

AI130 ist lokal fertig und bereit für Integration nach `main`.
