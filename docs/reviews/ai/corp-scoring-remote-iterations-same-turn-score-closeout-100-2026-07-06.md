# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T21:25:43.525Z
Git head: 8ff156044

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T18:30:18.406Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 40m 50s
- Average seconds per completed game: 24.496
- Runner wins: 17 (17%)
- Corp wins: 77 (77%)
- Action-limit games: 6 (6%)
- Average agenda points: Runner 3.59, Corp 2.58
- Median agenda points: Runner 3.5, Corp 2
- Average actions: 220.39
- Average turns: 31.73
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 43s | 20.51 | 1.8 | 6 | 0 |
| 2 | 6-10 | 2m 8s | 25.656 | 2.8 | 1.2 | 0 |
| 3 | 11-15 | 1m 50s | 22.09 | 6.6 | 1 | 1 |
| 4 | 16-20 | 1m 37s | 19.452 | 3.8 | 3 | 0 |
| 5 | 21-25 | 3m 27s | 41.438 | 4.4 | 5 | 1 |
| 6 | 26-30 | 1m 28s | 17.567 | 4 | 1 | 0 |
| 7 | 31-35 | 2m 48s | 33.617 | 4.6 | 3.8 | 1 |
| 8 | 36-40 | 1m 23s | 16.649 | 3.8 | 1.6 | 0 |
| 9 | 41-45 | 1m 20s | 16.032 | 2 | 2.8 | 0 |
| 10 | 46-50 | 1m 8s | 13.678 | 1.8 | 2 | 0 |
| 11 | 51-55 | 2m 36s | 31.249 | 5.4 | 3 | 0 |
| 12 | 56-60 | 3m 31s | 42.151 | 3.8 | 3.6 | 1 |
| 13 | 61-65 | 2m 52s | 34.416 | 5.6 | 3.2 | 0 |
| 14 | 66-70 | 1m 52s | 22.461 | 4.2 | 2.2 | 0 |
| 15 | 71-75 | 1m 6s | 13.111 | 3.4 | 1 | 0 |
| 16 | 76-80 | 2m 35s | 31.076 | 4.2 | 5.6 | 0 |
| 17 | 81-85 | 26s | 5.258 | 1.4 | 0 | 0 |
| 18 | 86-90 | 15s | 2.928 | 2 | 0.4 | 0 |
| 19 | 91-95 | 3m 38s | 43.554 | 4 | 3.6 | 2 |
| 20 | 96-100 | 1m 17s | 15.396 | 2.2 | 1.6 | 0 |

## Progression Signals

- Corp score actions: 144
- Runner steal actions: 204
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 22039
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 22039
- Decisions with top-level WhyNot: 13161
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 13161
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
