# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T09:45:06.889Z
Git head: 24ad48bed

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
- Elapsed: 22m 47s
- Average seconds per completed game: 13.671
- Runner wins: 21 (21%)
- Corp wins: 66 (66%)
- Action-limit games: 13 (13%)
- Average agenda points: Runner 3.63, Corp 1.04
- Median agenda points: Runner 4, Corp 0
- Average actions: 199.5
- Average turns: 27.62
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 18s | 27.623 | 1.8 | 5.4 | 1 |
| 2 | 6-10 | 30s | 6.043 | 2.6 | 2.4 | 0 |
| 3 | 11-15 | 1m 0s | 12.042 | 7 | 0 | 0 |
| 4 | 16-20 | 11s | 2.124 | 2.8 | 0 | 0 |
| 5 | 21-25 | 44s | 8.732 | 4 | 0.4 | 0 |
| 6 | 26-30 | 1m 40s | 19.905 | 5.6 | 0 | 1 |
| 7 | 31-35 | 1m 15s | 15.067 | 4.2 | 0 | 2 |
| 8 | 36-40 | 2m 15s | 27.035 | 3.2 | 2.2 | 2 |
| 9 | 41-45 | 17s | 3.446 | 1.4 | 0.4 | 0 |
| 10 | 46-50 | 1m 8s | 13.528 | 3 | 1.4 | 1 |
| 11 | 51-55 | 1m 37s | 19.315 | 4.4 | 0 | 0 |
| 12 | 56-60 | 50s | 10.007 | 4.4 | 1.2 | 0 |
| 13 | 61-65 | 41s | 8.177 | 3.8 | 0.8 | 0 |
| 14 | 66-70 | 39s | 7.726 | 4 | 1 | 0 |
| 15 | 71-75 | 22s | 4.411 | 3 | 0.4 | 0 |
| 16 | 76-80 | 2m 30s | 29.951 | 4.2 | 2.4 | 3 |
| 17 | 81-85 | 1m 56s | 23.183 | 3.6 | 1.6 | 2 |
| 18 | 86-90 | 23s | 4.609 | 2.4 | 0 | 0 |
| 19 | 91-95 | 46s | 9.246 | 5.2 | 0 | 0 |
| 20 | 96-100 | 50s | 9.952 | 2 | 1.2 | 1 |

## Progression Signals

- Corp score actions: 59
- Runner steal actions: 206
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 19950
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 19950
- Decisions with top-level WhyNot: 11845
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 11845
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
