# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-07T04:39:58.607Z
Git head: bea24599f

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
- Elapsed: 6m 51s
- Average seconds per completed game: 13.715
- Runner wins: 12 (40%)
- Corp wins: 18 (60%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.4, Corp 3.167
- Median agenda points: Runner 4, Corp 2
- Average actions: 186.5
- Average turns: 26.5
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 6s | 13.284 | 2.6 | 5.2 | 0 |
| 2 | 6-10 | 19s | 3.893 | 2.2 | 0.8 | 0 |
| 3 | 11-15 | 38s | 7.592 | 7.8 | 1 | 0 |
| 4 | 16-20 | 54s | 10.847 | 4 | 4.4 | 0 |
| 5 | 21-25 | 2m 24s | 28.712 | 4.6 | 5.8 | 0 |
| 6 | 26-30 | 1m 24s | 16.765 | 5.2 | 1.8 | 0 |

## Progression Signals

- Corp score actions: 51
- Runner steal actions: 76
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 5595
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 5595
- Decisions with top-level WhyNot: 3324
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3324
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
