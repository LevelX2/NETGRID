# Aktuelle KI auf Holdout-DecisionPoints

Run-ID: `2026-06-23`

Status: ausgeführt

Quelle: `local_sqlite_runtime:data/runtime/multiplayer/netgrid.sqlite`

Cutoff: keiner

## Aggregate

| Metrik | Wert |
| --- | ---: |
| Holdout-Cases | 283 |
| Ausgewertet | 283 |
| Geänderte Entscheidungen | 97 |
| IllegalActions | 0 |
| Rekonstruktionsfehler | 0 |
| KI-Fehler | 0 |
| Redaction-Verstöße | 0 |
| Historische Fix-Muster-Fälle | 3 |
| Aktuelle Fix-Muster-Recurrence | 0 |

## Gates

| Gate | Erfüllt |
| --- | --- |
| `currentAiHoldoutEvaluated` | ja |
| `noIllegalActions` | ja |
| `noRedactionViolations` | ja |
| `reconstructionComplete` | ja |
| `productiveUseDisabled` | ja |

## Seiten

| Wert | Anzahl |
| --- | ---: |
| `runner` | 277 |
| `corp` | 6 |

## Historische Aktionstypen

| Wert | Anzahl |
| --- | ---: |
| `gain_credit` | 52 |
| `start_run` | 47 |
| `continue_run` | 42 |
| `end_turn` | 32 |
| `access_card` | 29 |
| `install_card` | 19 |
| `break_subroutine` | 12 |
| `pump_breaker` | 10 |
| `draw_card` | 9 |
| `resolve_choice` | 8 |
| `play_event` | 7 |
| `decline_trash` | 5 |

## Aktuelle Aktionstypen

| Wert | Anzahl |
| --- | ---: |
| `gain_credit` | 51 |
| `continue_run` | 49 |
| `start_run` | 46 |
| `end_turn` | 32 |
| `access_card` | 31 |
| `install_card` | 13 |
| `break_subroutine` | 12 |
| `draw_card` | 12 |
| `play_event` | 9 |
| `resolve_choice` | 8 |
| `activated_card_ability` | 5 |
| `decline_trash` | 5 |

## Redigierte Beispiele

| Case | Status | Historisch | Aktuell | Geändert |
| --- | --- | --- | --- | --- |
| `holdout-41a251319bace299` | `evaluated` | `start_run/runner.opportunistic_central_run` | `gain_credit/runner.obtain_breaker_coverage` | ja |
| `holdout-b2f242a6bd0c0f0a` | `evaluated` | `start_run/runner.obtain_breaker_coverage` | `gain_credit/runner.obtain_breaker_coverage` | ja |
| `holdout-48320b958e8cacbc` | `evaluated` | `start_run/runner.obtain_breaker_coverage` | `gain_credit/runner.obtain_breaker_coverage` | ja |
| `holdout-44df659c9e1dbc56` | `evaluated` | `start_run/runner.obtain_breaker_coverage` | `start_run/runner.opportunistic_central_run` | ja |
| `holdout-1af5f455147340d7` | `evaluated` | `gain_credit/runner.opportunistic_central_run` | `start_run/runner.opportunistic_central_run` | ja |
| `holdout-90371c6b50346d0d` | `evaluated` | `start_run/simple_hq_or_rnd_pressure` | `gain_credit/runner.obtain_breaker_coverage` | ja |
| `holdout-a2c05976b1e80676` | `evaluated` | `start_run/simple_hq_or_rnd_pressure` | `start_run/runner.opportunistic_central_run` | ja |
| `holdout-1489d088e2fa6395` | `evaluated` | `install_card/build_rig` | `start_run/runner.opportunistic_central_run` | ja |

## Schlussfolgerungen

- Aktuelle Holdout-Auswertung: 283/283.
- Geänderte Entscheidungen: 97.
- IllegalActions: 0.
- Rekonstruktionsfehler: 0.
- Redaction-Verstöße: 0.
- Aktuelle Recurrence des ersten Fix-Musters: 0/3.

## Sicherheitsgrenzen

- Der Runner ist read-only und schreibt vollständige Laufdaten nur in einen lokalen Ausgabepfad.
- KI-Inputs werden aus `PlayerView` und `LegalActions` für den rekonstruierten Snapshot gebaut.
- Dieser Bericht enthält keine Match-IDs, Trace-IDs, FullState-Snapshots, Hidden Cards, Decklisten oder lokalen Pfade.
- Holdout bleibt Abnahme, nicht Fixableitung.
