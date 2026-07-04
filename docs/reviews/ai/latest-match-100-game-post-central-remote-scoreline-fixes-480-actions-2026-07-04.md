# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-07-04T11:47:20.771Z
Git head: 513bde69a

## Source

- Match: `match_41020769c9f35150`
- SQLite: `data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-06-29T09:00:29.406Z`
- Runner deck: `Inside Forgery Loop` (fnv1a:14c9bd9a)
- Corp deck: `KI Rush Score - Static ICE Mix` (fnv1a:a1182048)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 35m 50s
- Average seconds per completed game: 21.496
- Runner wins: 52 (52%)
- Corp wins: 48 (48%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 3.41, Corp 5.53
- Median agenda points: Runner 3, Corp 6
- Average actions: 298.82
- Average turns: 46.15
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 26s | 17.172 | 3.8 | 4 | 0 |
| 2 | 6-10 | 2m 28s | 29.654 | 2.4 | 4.6 | 0 |
| 3 | 11-15 | 1m 28s | 17.663 | 4 | 5.8 | 0 |
| 4 | 16-20 | 1m 39s | 19.71 | 5.2 | 5.6 | 0 |
| 5 | 21-25 | 2m 23s | 28.695 | 2.2 | 4.8 | 0 |
| 6 | 26-30 | 1m 37s | 19.314 | 3.6 | 4.2 | 0 |
| 7 | 31-35 | 1m 39s | 19.791 | 2 | 6.6 | 0 |
| 8 | 36-40 | 1m 8s | 13.655 | 4.4 | 5.8 | 0 |
| 9 | 41-45 | 1m 12s | 14.398 | 4.2 | 5.8 | 0 |
| 10 | 46-50 | 1m 31s | 18.202 | 3.8 | 6.6 | 0 |
| 11 | 51-55 | 1m 49s | 21.76 | 6.8 | 2.4 | 0 |
| 12 | 56-60 | 1m 46s | 21.166 | 3.6 | 6.2 | 0 |
| 13 | 61-65 | 2m 6s | 25.23 | 4.2 | 5.6 | 0 |
| 14 | 66-70 | 1m 42s | 20.431 | 2.6 | 6.4 | 0 |
| 15 | 71-75 | 1m 19s | 15.702 | 4 | 4.6 | 0 |
| 16 | 76-80 | 1m 15s | 15.075 | 1.8 | 6 | 0 |
| 17 | 81-85 | 1m 25s | 16.926 | 3.6 | 7 | 0 |
| 18 | 86-90 | 2m 30s | 30.007 | 1.4 | 6.4 | 0 |
| 19 | 91-95 | 2m 17s | 27.358 | 3.4 | 6 | 0 |
| 20 | 96-100 | 1m 42s | 20.485 | 1.2 | 6.2 | 0 |

## Progression Signals

- Corp score actions: 315
- Runner steal actions: 194
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 29882
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 29882
- Decisions with top-level WhyNot: 19432
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 19432
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
