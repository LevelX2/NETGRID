# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T02:43:19.859Z
Git head: 358f2d2b2

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
- Elapsed: 25m 39s
- Average seconds per completed game: 15.388
- Runner wins: 20 (20%)
- Corp wins: 78 (78%)
- Action-limit games: 2 (2%)
- Average agenda points: Runner 3.5, Corp 2.83
- Median agenda points: Runner 3, Corp 1.5
- Average actions: 200.5
- Average turns: 28.92
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 5s | 12.942 | 2.6 | 5 | 0 |
| 2 | 6-10 | 1m 1s | 12.198 | 2.6 | 1.2 | 0 |
| 3 | 11-15 | 55s | 10.969 | 7.4 | 1.8 | 0 |
| 4 | 16-20 | 1m 14s | 14.849 | 3.6 | 4.4 | 0 |
| 5 | 21-25 | 2m 2s | 24.442 | 3.6 | 4.6 | 0 |
| 6 | 26-30 | 1m 33s | 18.575 | 5.6 | 1.8 | 0 |
| 7 | 31-35 | 1m 50s | 21.946 | 4.2 | 2.8 | 0 |
| 8 | 36-40 | 1m 57s | 23.447 | 4 | 3.8 | 0 |
| 9 | 41-45 | 52s | 10.493 | 3.2 | 4.4 | 0 |
| 10 | 46-50 | 36s | 7.214 | 2.2 | 1.4 | 0 |
| 11 | 51-55 | 1m 9s | 13.873 | 3 | 1.6 | 1 |
| 12 | 56-60 | 2m 13s | 26.685 | 3 | 4.8 | 1 |
| 13 | 61-65 | 1m 23s | 16.654 | 4 | 2 | 0 |
| 14 | 66-70 | 53s | 10.52 | 3.8 | 2.8 | 0 |
| 15 | 71-75 | 1m 20s | 16.071 | 2.8 | 2.6 | 0 |
| 16 | 76-80 | 1m 29s | 17.741 | 3.4 | 4.4 | 0 |
| 17 | 81-85 | 22s | 4.431 | 1.4 | 0 | 0 |
| 18 | 86-90 | 9s | 1.886 | 1.2 | 0.4 | 0 |
| 19 | 91-95 | 1m 32s | 18.345 | 4.8 | 4.4 | 0 |
| 20 | 96-100 | 59s | 11.858 | 3.6 | 2.4 | 0 |

## Progression Signals

- Corp score actions: 158
- Runner steal actions: 199
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 20050
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 20050
- Decisions with top-level WhyNot: 12148
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 12148
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
