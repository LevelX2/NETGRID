# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T20:44:20.653Z
Git head: 8ff156044

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
- Elapsed: 11m 9s
- Average seconds per completed game: 22.291
- Runner wins: 8 (26.7%)
- Corp wins: 20 (66.7%)
- Action-limit games: 2 (6.7%)
- Average agenda points: Runner 3.9, Corp 2.867
- Median agenda points: Runner 4, Corp 2
- Average actions: 223.167
- Average turns: 32.033
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 28s | 17.661 | 1.8 | 6 | 0 |
| 2 | 6-10 | 1m 47s | 21.364 | 2.8 | 1.2 | 0 |
| 3 | 11-15 | 1m 30s | 17.968 | 6.6 | 1 | 1 |
| 4 | 16-20 | 1m 25s | 16.913 | 3.8 | 3 | 0 |
| 5 | 21-25 | 3m 23s | 40.602 | 4.4 | 5 | 1 |
| 6 | 26-30 | 1m 27s | 17.442 | 4 | 1 | 0 |

## Progression Signals

- Corp score actions: 47
- Runner steal actions: 69
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6695
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6695
- Decisions with top-level WhyNot: 3963
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3963
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
