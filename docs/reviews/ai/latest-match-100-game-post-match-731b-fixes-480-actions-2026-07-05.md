# AI Match Deck Baseline match_731b436e85fb2484

Status: complete
Generated: 2026-07-05T19:30:19.601Z
Git head: 41e3f0e3b

## Source

- Match: `match_731b436e85fb2484`
- SQLite: `data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T16:46:21.992Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Tycho Ice Stack` (fnv1a:c72ff4b7)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 73m 3s
- Average seconds per completed game: 43.826
- Runner wins: 37 (37%)
- Corp wins: 11 (11%)
- Action-limit games: 52 (52%)
- Average agenda points: Runner 3.96, Corp 2.17
- Median agenda points: Runner 4, Corp 0
- Average actions: 400.65
- Average turns: 49.78
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 3m 45s | 44.942 | 4 | 3 | 3 |
| 2 | 6-10 | 2m 59s | 35.728 | 4 | 2.2 | 2 |
| 3 | 11-15 | 3m 28s | 41.529 | 4.8 | 4.8 | 0 |
| 4 | 16-20 | 3m 37s | 43.43 | 2.4 | 4 | 3 |
| 5 | 21-25 | 3m 10s | 38.085 | 4.8 | 2.4 | 2 |
| 6 | 26-30 | 2m 8s | 25.532 | 4 | 4 | 1 |
| 7 | 31-35 | 5m 23s | 64.572 | 1.6 | 1.4 | 5 |
| 8 | 36-40 | 3m 14s | 38.823 | 4 | 4.4 | 2 |
| 9 | 41-45 | 2m 59s | 35.804 | 4.8 | 1.4 | 3 |
| 10 | 46-50 | 6m 17s | 75.413 | 3.2 | 3.2 | 4 |
| 11 | 51-55 | 4m 12s | 50.469 | 2.4 | 1.6 | 4 |
| 12 | 56-60 | 4m 13s | 50.644 | 1.6 | 3.6 | 4 |
| 13 | 61-65 | 4m 21s | 52.265 | 4 | 2.4 | 3 |
| 14 | 66-70 | 1m 58s | 23.527 | 5.6 | 0 | 2 |
| 15 | 71-75 | 2m 15s | 27.012 | 3.2 | 0.6 | 3 |
| 16 | 76-80 | 4m 0s | 47.924 | 5.6 | 0.8 | 2 |
| 17 | 81-85 | 3m 42s | 44.309 | 3.2 | 1.2 | 4 |
| 18 | 86-90 | 3m 36s | 43.21 | 7.2 | 0.8 | 1 |
| 19 | 91-95 | 2m 33s | 30.576 | 4 | 0 | 3 |
| 20 | 96-100 | 3m 16s | 39.155 | 4.8 | 1.6 | 1 |

## Progression Signals

- Corp score actions: 57
- Runner steal actions: 99
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 40065
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 40065
- Decisions with top-level WhyNot: 25197
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 25197
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
