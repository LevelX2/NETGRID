# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T23:40:09.711Z
Git head: 9c844b4d4

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
- Elapsed: 8m 15s
- Average seconds per completed game: 16.497
- Runner wins: 11 (36.7%)
- Corp wins: 19 (63.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.3, Corp 2.767
- Median agenda points: Runner 4.5, Corp 2
- Average actions: 197.7
- Average turns: 28.2
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 14s | 14.894 | 2.8 | 5 | 0 |
| 2 | 6-10 | 1m 12s | 14.385 | 1.8 | 1.2 | 0 |
| 3 | 11-15 | 29s | 5.84 | 6.8 | 0.6 | 0 |
| 4 | 16-20 | 55s | 11.059 | 4 | 4.4 | 0 |
| 5 | 21-25 | 2m 46s | 33.163 | 4.8 | 3.6 | 0 |
| 6 | 26-30 | 1m 32s | 18.34 | 5.6 | 1.8 | 0 |

## Progression Signals

- Corp score actions: 46
- Runner steal actions: 77
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5931
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5931
- Decisions with top-level WhyNot: 3491
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3491
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
