# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T04:47:38.408Z
Git head: bea24599f

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
- Elapsed: 7m 5s
- Average seconds per completed game: 14.155
- Runner wins: 9 (30%)
- Corp wins: 21 (70%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.133, Corp 3
- Median agenda points: Runner 4, Corp 2
- Average actions: 193.033
- Average turns: 27.633
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 4s | 12.839 | 2.6 | 5 | 0 |
| 2 | 6-10 | 18s | 3.621 | 2.2 | 0.8 | 0 |
| 3 | 11-15 | 55s | 10.932 | 7.4 | 1.8 | 0 |
| 4 | 16-20 | 1m 14s | 14.754 | 3.6 | 4.4 | 0 |
| 5 | 21-25 | 2m 1s | 24.294 | 3.6 | 4.6 | 0 |
| 6 | 26-30 | 1m 26s | 17.237 | 5.4 | 1.4 | 0 |

## Progression Signals

- Corp score actions: 49
- Runner steal actions: 74
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5791
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5791
- Decisions with top-level WhyNot: 3428
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3428
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
