# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T02:16:39.049Z
Git head: 358f2d2b2

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T18:30:18.406Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)

## Baseline

- Games: 30/30
- Batch size: 5
- Max actions per game: 480
- Elapsed: 8m 12s
- Average seconds per completed game: 16.394
- Runner wins: 9 (30%)
- Corp wins: 21 (70%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.233, Corp 3.133
- Median agenda points: Runner 4, Corp 2
- Average actions: 205.233
- Average turns: 29.5
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 8s | 13.515 | 2.6 | 5 | 0 |
| 2 | 6-10 | 1m 5s | 13.026 | 2.6 | 1.2 | 0 |
| 3 | 11-15 | 58s | 11.605 | 7.4 | 1.8 | 0 |
| 4 | 16-20 | 1m 18s | 15.607 | 3.6 | 4.4 | 0 |
| 5 | 21-25 | 2m 3s | 24.626 | 3.6 | 4.6 | 0 |
| 6 | 26-30 | 1m 33s | 18.621 | 5.6 | 1.8 | 0 |

## Progression Signals

- Corp score actions: 51
- Runner steal actions: 74
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6157
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6157
- Decisions with top-level WhyNot: 3624
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3624
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
