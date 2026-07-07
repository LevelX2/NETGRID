# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T05:29:53.457Z
Git head: 023b9a09c

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
- Elapsed: 8m 6s
- Average seconds per completed game: 16.186
- Runner wins: 8 (26.7%)
- Corp wins: 22 (73.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.133, Corp 3.533
- Median agenda points: Runner 4, Corp 2
- Average actions: 193.433
- Average turns: 27.767
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 11s | 14.251 | 2.6 | 5.2 | 0 |
| 2 | 6-10 | 20s | 4.02 | 2.2 | 0.8 | 0 |
| 3 | 11-15 | 1m 4s | 12.821 | 7 | 2.2 | 0 |
| 4 | 16-20 | 1m 1s | 12.192 | 4 | 4.4 | 0 |
| 5 | 21-25 | 2m 29s | 29.806 | 3.8 | 6.2 | 0 |
| 6 | 26-30 | 1m 53s | 22.678 | 5.2 | 2.4 | 0 |

## Progression Signals

- Corp score actions: 57
- Runner steal actions: 73
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5803
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5803
- Decisions with top-level WhyNot: 3469
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3469
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
