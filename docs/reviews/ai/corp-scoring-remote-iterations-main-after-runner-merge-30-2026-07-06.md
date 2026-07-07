# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T21:41:53.431Z
Git head: 46306db4c

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T18:30:18.406Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)

## Baseline

- Games: 30/30
- Batch size: 5
- Max actions per game: 480
- Elapsed: 10m 44s
- Average seconds per completed game: 21.455
- Runner wins: 11 (36.7%)
- Corp wins: 18 (60%)
- Action-limit games: 1 (3.3%)
- Average agenda points: Runner 4.333, Corp 2.833
- Median agenda points: Runner 4.5, Corp 2
- Average actions: 213.867
- Average turns: 30.2
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 27s | 17.368 | 2.2 | 5.2 | 0 |
| 2 | 6-10 | 1m 52s | 22.345 | 2.8 | 1.2 | 0 |
| 3 | 11-15 | 1m 5s | 13.094 | 6.8 | 1 | 0 |
| 4 | 16-20 | 1m 3s | 12.543 | 3.8 | 2.8 | 0 |
| 5 | 21-25 | 3m 26s | 41.168 | 4.8 | 5 | 1 |
| 6 | 26-30 | 1m 43s | 20.644 | 5.6 | 1.8 | 0 |

## Progression Signals

- Corp score actions: 46
- Runner steal actions: 76
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 6416
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 6416
- Decisions with top-level WhyNot: 3741
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 3741
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
