# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T09:21:32.429Z
Git head: 24ad48bed

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
- Elapsed: 6m 29s
- Average seconds per completed game: 12.979
- Runner wins: 10 (33.3%)
- Corp wins: 18 (60%)
- Action-limit games: 2 (6.7%)
- Average agenda points: Runner 3.967, Corp 1.367
- Median agenda points: Runner 4, Corp 0
- Average actions: 193.367
- Average turns: 27.2
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 18s | 27.564 | 1.8 | 5.4 | 1 |
| 2 | 6-10 | 30s | 6.058 | 2.6 | 2.4 | 0 |
| 3 | 11-15 | 1m 0s | 12.066 | 7 | 0 | 0 |
| 4 | 16-20 | 11s | 2.108 | 2.8 | 0 | 0 |
| 5 | 21-25 | 44s | 8.787 | 4 | 0.4 | 0 |
| 6 | 26-30 | 1m 40s | 19.979 | 5.6 | 0 | 1 |

## Progression Signals

- Corp score actions: 24
- Runner steal actions: 68
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5801
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5801
- Decisions with top-level WhyNot: 3401
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3401
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
