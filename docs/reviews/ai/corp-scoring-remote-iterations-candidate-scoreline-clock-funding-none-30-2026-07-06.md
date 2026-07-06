# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T11:35:15.616Z
Git head: 4a93368b7

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
- Elapsed: 6m 20s
- Average seconds per completed game: 12.66
- Runner wins: 14 (46.7%)
- Corp wins: 16 (53.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.7, Corp 2.833
- Median agenda points: Runner 5.5, Corp 2
- Average actions: 202.3
- Average turns: 27.167
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 12s | 14.419 | 2.8 | 3.8 | 0 |
| 2 | 6-10 | 38s | 7.582 | 3 | 2.4 | 0 |
| 3 | 11-15 | 39s | 7.752 | 6.4 | 1.6 | 0 |
| 4 | 16-20 | 47s | 9.457 | 5.4 | 2.8 | 0 |
| 5 | 21-25 | 2m 5s | 25.033 | 4.2 | 5.2 | 0 |
| 6 | 26-30 | 52s | 10.368 | 6.4 | 1.2 | 0 |

## Progression Signals

- Corp score actions: 49
- Runner steal actions: 80
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6069
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6069
- Decisions with top-level WhyNot: 3513
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3513
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
