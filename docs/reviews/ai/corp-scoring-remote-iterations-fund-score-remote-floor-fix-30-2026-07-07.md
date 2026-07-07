# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T08:24:12.075Z
Git head: 6447119eb

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
- Elapsed: 7m 47s
- Average seconds per completed game: 15.565
- Runner wins: 8 (26.7%)
- Corp wins: 22 (73.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4, Corp 3.433
- Median agenda points: Runner 4, Corp 2
- Average actions: 196.2
- Average turns: 28.5
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 4s | 12.896 | 2 | 5.8 | 0 |
| 2 | 6-10 | 19s | 3.776 | 2.2 | 0.8 | 0 |
| 3 | 11-15 | 57s | 11.428 | 6.8 | 2.2 | 0 |
| 4 | 16-20 | 58s | 11.589 | 3.8 | 4.4 | 0 |
| 5 | 21-25 | 2m 34s | 30.727 | 4 | 5 | 0 |
| 6 | 26-30 | 1m 48s | 21.659 | 5.2 | 2.4 | 0 |

## Progression Signals

- Corp score actions: 56
- Runner steal actions: 71
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5886
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5886
- Decisions with top-level WhyNot: 3525
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3525
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
