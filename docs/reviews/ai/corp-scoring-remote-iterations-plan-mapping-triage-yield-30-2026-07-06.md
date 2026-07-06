# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T11:52:40.180Z
Git head: 1d6b57a30

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
- Elapsed: 7m 27s
- Average seconds per completed game: 14.885
- Runner wins: 14 (46.7%)
- Corp wins: 16 (53.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 4.867, Corp 2.967
- Median agenda points: Runner 6, Corp 2
- Average actions: 220.6
- Average turns: 29.367
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 12s | 14.448 | 2.8 | 3.8 | 0 |
| 2 | 6-10 | 46s | 9.223 | 2.6 | 3 | 0 |
| 3 | 11-15 | 38s | 7.69 | 6.2 | 1.6 | 0 |
| 4 | 16-20 | 1m 27s | 17.398 | 5.6 | 3.4 | 0 |
| 5 | 21-25 | 2m 30s | 29.959 | 5.8 | 4.8 | 0 |
| 6 | 26-30 | 46s | 9.157 | 6.2 | 1.2 | 0 |

## Progression Signals

- Corp score actions: 52
- Runner steal actions: 84
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6618
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6618
- Decisions with top-level WhyNot: 3980
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3980
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
