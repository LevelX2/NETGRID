# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T18:04:03.305Z
Git head: 712f4560d

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
- Elapsed: 25m 45s
- Average seconds per completed game: 15.447
- Runner wins: 21 (21%)
- Corp wins: 74 (74%)
- Action-limit games: 5 (5%)
- Average agenda points: Runner 3.32, Corp 2.17
- Median agenda points: Runner 2, Corp 0
- Average actions: 202.27
- Average turns: 28.01
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 3s | 24.54 | 2 | 4.8 | 0 |
| 2 | 6-10 | 1m 13s | 14.673 | 2.2 | 2 | 1 |
| 3 | 11-15 | 48s | 9.695 | 6.6 | 0.6 | 0 |
| 4 | 16-20 | 30s | 6.099 | 4.8 | 1.2 | 0 |
| 5 | 21-25 | 2m 1s | 24.197 | 5.2 | 3.4 | 1 |
| 6 | 26-30 | 1m 11s | 14.198 | 4.6 | 0 | 0 |
| 7 | 31-35 | 2m 5s | 25.015 | 3 | 3.8 | 1 |
| 8 | 36-40 | 48s | 9.501 | 3 | 1.2 | 0 |
| 9 | 41-45 | 52s | 10.43 | 2.4 | 2 | 0 |
| 10 | 46-50 | 55s | 10.909 | 1.8 | 2 | 0 |
| 11 | 51-55 | 1m 41s | 20.241 | 3 | 4 | 1 |
| 12 | 56-60 | 1m 57s | 23.432 | 3.8 | 3.8 | 0 |
| 13 | 61-65 | 1m 25s | 16.934 | 4.2 | 1.2 | 0 |
| 14 | 66-70 | 46s | 9.12 | 4 | 0.4 | 0 |
| 15 | 71-75 | 1m 20s | 16.057 | 2.6 | 0.4 | 1 |
| 16 | 76-80 | 2m 13s | 26.666 | 4.4 | 6 | 0 |
| 17 | 81-85 | 1m 2s | 12.414 | 1.4 | 1.6 | 0 |
| 18 | 86-90 | 10s | 1.991 | 2 | 0.4 | 0 |
| 19 | 91-95 | 1m 17s | 15.463 | 4.2 | 3.4 | 0 |
| 20 | 96-100 | 26s | 5.244 | 1.2 | 1.2 | 0 |

## Progression Signals

- Corp score actions: 120
- Runner steal actions: 189
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 20227
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 20227
- Decisions with top-level WhyNot: 12465
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 12465
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
