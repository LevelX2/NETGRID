# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T18:49:07.726Z
Git head: 6c5f0b563

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
- Elapsed: 26m 28s
- Average seconds per completed game: 15.881
- Runner wins: 22 (22%)
- Corp wins: 71 (71%)
- Action-limit games: 7 (7%)
- Average agenda points: Runner 3.36, Corp 2.2
- Median agenda points: Runner 2.5, Corp 0
- Average actions: 209.56
- Average turns: 28.91
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 54s | 22.89 | 2 | 4.8 | 0 |
| 2 | 6-10 | 1m 8s | 13.658 | 2.2 | 2 | 1 |
| 3 | 11-15 | 1m 13s | 14.518 | 6.2 | 0.6 | 1 |
| 4 | 16-20 | 28s | 5.648 | 4.8 | 1.2 | 0 |
| 5 | 21-25 | 2m 8s | 25.575 | 4.8 | 4.4 | 2 |
| 6 | 26-30 | 1m 10s | 13.926 | 4.6 | 0 | 0 |
| 7 | 31-35 | 2m 0s | 24.038 | 3 | 3.8 | 1 |
| 8 | 36-40 | 1m 10s | 14.047 | 3.2 | 1.6 | 0 |
| 9 | 41-45 | 53s | 10.657 | 2.4 | 2 | 0 |
| 10 | 46-50 | 1m 0s | 11.963 | 1.8 | 2 | 0 |
| 11 | 51-55 | 1m 45s | 21.006 | 3 | 4 | 1 |
| 12 | 56-60 | 2m 2s | 24.422 | 3.8 | 3.8 | 0 |
| 13 | 61-65 | 1m 28s | 17.604 | 4.2 | 1.2 | 0 |
| 14 | 66-70 | 44s | 8.795 | 4.2 | 0.4 | 0 |
| 15 | 71-75 | 1m 8s | 13.661 | 2.6 | 0.6 | 1 |
| 16 | 76-80 | 2m 12s | 26.451 | 5 | 5.2 | 0 |
| 17 | 81-85 | 1m 6s | 13.155 | 2 | 1.4 | 0 |
| 18 | 86-90 | 10s | 1.976 | 2 | 0.4 | 0 |
| 19 | 91-95 | 1m 17s | 15.389 | 4.2 | 3.4 | 0 |
| 20 | 96-100 | 26s | 5.204 | 1.2 | 1.2 | 0 |

## Progression Signals

- Corp score actions: 123
- Runner steal actions: 194
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 20956
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 20956
- Decisions with top-level WhyNot: 12937
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 12937
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
