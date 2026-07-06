# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T20:14:13.112Z
Git head: 902f30093

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
- Elapsed: 10m 37s
- Average seconds per completed game: 21.231
- Runner wins: 9 (30%)
- Corp wins: 19 (63.3%)
- Action-limit games: 2 (6.7%)
- Average agenda points: Runner 4.033, Corp 2.633
- Median agenda points: Runner 4, Corp 1
- Average actions: 213.467
- Average turns: 30.567
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 36s | 19.213 | 1.8 | 6 | 0 |
| 2 | 6-10 | 1m 32s | 18.452 | 3.2 | 0.8 | 0 |
| 3 | 11-15 | 1m 39s | 19.726 | 6.6 | 1 | 1 |
| 4 | 16-20 | 1m 24s | 16.883 | 4 | 3 | 0 |
| 5 | 21-25 | 3m 8s | 37.556 | 4.4 | 5 | 1 |
| 6 | 26-30 | 1m 10s | 13.953 | 4.2 | 0 | 0 |

## Progression Signals

- Corp score actions: 43
- Runner steal actions: 71
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6404
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6404
- Decisions with top-level WhyNot: 3812
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3812
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
