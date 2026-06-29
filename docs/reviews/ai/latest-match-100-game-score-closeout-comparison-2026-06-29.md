# 100-Game Benchmark Comparison: Score-Closeout Fix

Datum: 2026-06-29

Match-Snapshot: `match_41020769c9f35150`

Decks:

- Runner: `Inside Forgery Loop` (`fnv1a:14c9bd9a`)
- Corp: `KI Rush Score - Static ICE Mix` (`fnv1a:a1182048`)

Konfiguration:

- Spiele: 100
- Seeds: `latest-match-baseline-001` bis `latest-match-baseline-100`
- Batchgröße: 5
- Max Actions: 160
- Controller: `current_candidate` gegen `current_candidate`

Verglichene Läufe:

- Vorher: `fb07895c0`, `docs/reviews/ai/latest-match-100-game-baseline-2026-06-29.json`
- Nachher: `a97d2859e`, `docs/reviews/ai/latest-match-100-game-post-score-closeout-2026-06-29.json`

## Kernvergleich

| Kennzahl | Vorher | Nachher | Delta |
| --- | ---: | ---: | ---: |
| Runner-Siege | 13 | 1 | -12 |
| Corp-Siege | 0 | 14 | +14 |
| Action-Limit-Spiele | 87 | 85 | -2 |
| Runner-Siegquote | 13% | 1% | -12 pp |
| Corp-Siegquote | 0% | 14% | +14 pp |
| Action-Limit-Quote | 87% | 85% | -2 pp |
| Durchschnitt Runner-AP | 3.20 | 1.21 | -1.99 |
| Durchschnitt Corp-AP | 0.25 | 4.46 | +4.21 |
| Median Runner-AP | 3 | 0.5 | -2.5 |
| Median Corp-AP | 0 | 4 | +4 |
| Durchschnitt Aktionen | 153.32 | 151.20 | -2.12 |
| Durchschnitt Turns | 18.54 | 22.89 | +4.35 |
| Replay-Failures | 0 | 0 | 0 |
| Spiele mit Errors | 0 | 8 | +8 |

## Scoreline-Signale

| Signal | Vorher | Nachher | Delta |
| --- | ---: | ---: | ---: |
| Corp score actions | 14 | 258 | +244 |
| Runner steal actions | 187 | 75 | -112 |
| Score-Actions verfügbar | 27 | 301 | +274 |
| Score-Actions genommen | 14 | 258 | +244 |
| Score-Take-Rate | 51.9% | 85.7% | +33.8 pp |
| Passive Action mit Scoreline verfügbar | 2468 | 978 | -1490 |
| `corp_never_scores_long_game` | 81 | 3 | -78 |
| `unsafeScoreChosen` | 0 | 0 | 0 |

## Restbefunde

| Signal | Vorher | Nachher | Delta |
| --- | ---: | ---: | ---: |
| Missed score windows | 13 | 43 | +30 |
| High findings | 98 | 21 | -77 |
| Medium findings | 3821 | 2306 | -1515 |
| `repeated_no_progress_run` | 2606 | 863 | -1743 |
| `recovery_low_value_loop` | 574 | 622 | +48 |
| `plan_step_action_mismatch` | 1115 | 1040 | -75 |
| `repeated_low_value_archives` | 1 | 10 | +9 |
| `illegal_action` | 0 | 8 | +8 |
| `action_limit_low_value_repeat` | 71 | 36 | -35 |
| `action_limit_setup_economy_loop` | 6 | 27 | +21 |

## Error-Seeds

Alle 8 Error-Spiele enden mit `ERR_INVALID_CHOICE`; Replay-Failures bleiben 0.

- `latest-match-baseline-003`, stateVersion 77, Corp `score_agenda`
- `latest-match-baseline-020`, stateVersion 80
- `latest-match-baseline-046`, stateVersion 109
- `latest-match-baseline-051`, stateVersion 131
- `latest-match-baseline-063`, stateVersion 55
- `latest-match-baseline-065`, stateVersion 120
- `latest-match-baseline-068`, stateVersion 77
- `latest-match-baseline-077`, stateVersion 21

## Bewertung

Die Scoreline-Änderung ist im 100-Seed-Vergleich klar wirksam: Die Corp scoret massiv häufiger, gewinnt erstmals substantiell Spiele und reduziert Runner-Agenda-Punkte deutlich. Die ursprüngliche Schwäche "Corp scoret praktisch nicht" ist damit nicht bestätigt, sondern deutlich verbessert.

Nicht gelöst ist das Endgame-/Progressionsproblem: 85 von 100 Spielen laufen weiterhin ins Action-Limit. Außerdem ist der neue `ERR_INVALID_CHOICE`-Cluster ein harter Folgefund und sollte vor weiterem Balancing separat analysiert werden.
