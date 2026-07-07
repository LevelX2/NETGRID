# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T07:32:50.264Z
Git head: 45c6a6fe9

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
- Elapsed: 7m 33s
- Average seconds per completed game: 15.093
- Runner wins: 8 (26.7%)
- Corp wins: 22 (73.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.1, Corp 3.433
- Median agenda points: Runner 4, Corp 2
- Average actions: 197.467
- Average turns: 28.567
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 8s | 13.514 | 2.4 | 5.8 | 0 |
| 2 | 6-10 | 19s | 3.712 | 2.2 | 0.8 | 0 |
| 3 | 11-15 | 55s | 10.947 | 6.8 | 2.2 | 0 |
| 4 | 16-20 | 56s | 11.103 | 4 | 4.4 | 0 |
| 5 | 21-25 | 2m 27s | 29.317 | 4 | 5 | 0 |
| 6 | 26-30 | 1m 44s | 20.706 | 5.2 | 2.4 | 0 |

## Progression Signals

- Corp score actions: 56
- Runner steal actions: 72
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5924
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5924
- Decisions with top-level WhyNot: 3547
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3547
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
