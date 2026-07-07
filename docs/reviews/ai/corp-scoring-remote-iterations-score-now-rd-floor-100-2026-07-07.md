# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T00:08:02.789Z
Git head: 9c844b4d4

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
- Elapsed: 27m 15s
- Average seconds per completed game: 16.352
- Runner wins: 25 (25%)
- Corp wins: 72 (72%)
- Action-limit games: 3 (3%)
- Average agenda points: Runner 3.64, Corp 2.67
- Median agenda points: Runner 3.5, Corp 2
- Average actions: 203.43
- Average turns: 29.21
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 15s | 15.051 | 2.8 | 5 | 0 |
| 2 | 6-10 | 1m 13s | 14.58 | 1.8 | 1.2 | 0 |
| 3 | 11-15 | 29s | 5.823 | 6.8 | 0.6 | 0 |
| 4 | 16-20 | 55s | 11.064 | 4 | 4.4 | 0 |
| 5 | 21-25 | 2m 48s | 33.519 | 4.8 | 3.6 | 0 |
| 6 | 26-30 | 1m 33s | 18.567 | 5.6 | 1.8 | 0 |
| 7 | 31-35 | 1m 49s | 21.747 | 4.2 | 2.8 | 0 |
| 8 | 36-40 | 1m 23s | 16.536 | 3.6 | 2.6 | 0 |
| 9 | 41-45 | 1m 6s | 13.246 | 4 | 4.2 | 0 |
| 10 | 46-50 | 36s | 7.299 | 2.2 | 1.4 | 0 |
| 11 | 51-55 | 1m 8s | 13.606 | 3 | 1.6 | 1 |
| 12 | 56-60 | 2m 54s | 34.77 | 4.6 | 4 | 1 |
| 13 | 61-65 | 1m 24s | 16.797 | 4 | 2 | 0 |
| 14 | 66-70 | 1m 28s | 17.536 | 3.8 | 3.6 | 1 |
| 15 | 71-75 | 1m 18s | 15.622 | 3.2 | 2.2 | 0 |
| 16 | 76-80 | 1m 39s | 19.763 | 3.4 | 4.4 | 0 |
| 17 | 81-85 | 20s | 4.083 | 1.4 | 0 | 0 |
| 18 | 86-90 | 9s | 1.878 | 1.2 | 0.4 | 0 |
| 19 | 91-95 | 1m 46s | 21.176 | 4.8 | 5.2 | 0 |
| 20 | 96-100 | 1m 0s | 11.913 | 3.6 | 2.4 | 0 |

## Progression Signals

- Corp score actions: 149
- Runner steal actions: 210
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 20343
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 20343
- Decisions with top-level WhyNot: 12321
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 12321
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
