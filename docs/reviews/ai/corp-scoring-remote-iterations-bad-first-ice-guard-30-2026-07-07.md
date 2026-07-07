# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T00:28:00.167Z
Git head: 696602aa9

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
- Elapsed: 8m 58s
- Average seconds per completed game: 17.947
- Runner wins: 10 (33.3%)
- Corp wins: 20 (66.7%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.5, Corp 2.967
- Median agenda points: Runner 4.5, Corp 2
- Average actions: 206.133
- Average turns: 29.6
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 14s | 14.755 | 2.8 | 5 | 0 |
| 2 | 6-10 | 1m 4s | 12.847 | 2.6 | 1.2 | 0 |
| 3 | 11-15 | 58s | 11.58 | 7.4 | 1.4 | 0 |
| 4 | 16-20 | 58s | 11.634 | 4 | 4.4 | 0 |
| 5 | 21-25 | 3m 0s | 35.937 | 4.6 | 4 | 0 |
| 6 | 26-30 | 1m 37s | 19.47 | 5.6 | 1.8 | 0 |

## Progression Signals

- Corp score actions: 49
- Runner steal actions: 79
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6184
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6184
- Decisions with top-level WhyNot: 3665
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3665
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
