# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T22:30:46.409Z
Git head: 46306db4c

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T18:30:18.406Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)

## Baseline

- Games: 5/5
- Batch size: 5
- Max actions per game: 480
- Elapsed: 1m 12s
- Average seconds per completed game: 14.373
- Runner wins: 0 (0%)
- Corp wins: 5 (100%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 2, Corp 4.8
- Median agenda points: Runner 2, Corp 5
- Average actions: 185
- Average turns: 26.8
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 11s | 14.269 | 2 | 4.8 | 0 |

## Progression Signals

- Corp score actions: 14
- Runner steal actions: 6
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 925
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 925
- Decisions with top-level WhyNot: 562
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 562
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
