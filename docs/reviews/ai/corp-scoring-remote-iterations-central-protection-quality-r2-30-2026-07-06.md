# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T19:54:31.570Z
Git head: 19620ad92

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
- Elapsed: 11m 13s
- Average seconds per completed game: 22.447
- Runner wins: 10 (33.3%)
- Corp wins: 17 (56.7%)
- Action-limit games: 3 (10%)
- Average agenda points: Runner 4.067, Corp 2.667
- Median agenda points: Runner 4, Corp 0
- Average actions: 234.3
- Average turns: 32.767
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 7s | 25.434 | 2 | 4.4 | 0 |
| 2 | 6-10 | 1m 54s | 22.876 | 2.8 | 2.4 | 1 |
| 3 | 11-15 | 1m 32s | 18.435 | 6.6 | 1 | 1 |
| 4 | 16-20 | 1m 18s | 15.611 | 4 | 3 | 0 |
| 5 | 21-25 | 2m 54s | 34.782 | 4.4 | 5.2 | 1 |
| 6 | 26-30 | 1m 19s | 15.705 | 4.6 | 0 | 0 |

## Progression Signals

- Corp score actions: 45
- Runner steal actions: 71
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 7029
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 7029
- Decisions with top-level WhyNot: 4144
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 4144
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
