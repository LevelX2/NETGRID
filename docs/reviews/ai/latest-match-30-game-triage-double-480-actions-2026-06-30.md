# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T10:41:15.767Z
Git head: 680b97c1d

## Source

- Match: `match_41020769c9f35150`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-06-29T09:00:29.406Z`
- Runner deck: `Inside Forgery Loop` (fnv1a:14c9bd9a)
- Corp deck: `KI Rush Score - Static ICE Mix` (fnv1a:a1182048)

## Baseline

- Games: 30/30
- Batch size: 5
- Max actions per game: 480
- Elapsed: 8m 31s
- Average seconds per completed game: 17.017
- Runner wins: 8 (26.7%)
- Corp wins: 22 (73.3%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 2.833, Corp 6.467
- Median agenda points: Runner 2.5, Corp 7
- Average actions: 267.033
- Average turns: 41.633
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 12s | 26.405 | 3 | 6.6 | 0 |
| 2 | 6-10 | 1m 29s | 17.741 | 1 | 6.8 | 0 |
| 3 | 11-15 | 1m 23s | 16.661 | 4.4 | 6.4 | 0 |
| 4 | 16-20 | 44s | 8.803 | 2.8 | 6.6 | 0 |
| 5 | 21-25 | 1m 24s | 16.845 | 3.2 | 6 | 0 |
| 6 | 26-30 | 1m 10s | 13.911 | 2.6 | 6.4 | 0 |

## Progression Signals

- Corp score actions: 112
- Runner steal actions: 50
- Missed score windows: 4

## Why Coverage

- Audit status: complete
- Decisions sampled: 8011
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 8011
- Decisions with top-level WhyNot: 5310
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 5310
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
