# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T10:31:10.655Z
Git head: 47daeef06

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
- Elapsed: 9m 29s
- Average seconds per completed game: 18.963
- Runner wins: 9 (30%)
- Corp wins: 21 (70%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 2.833, Corp 6.233
- Median agenda points: Runner 2.5, Corp 7
- Average actions: 273.133
- Average turns: 41.867
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 40s | 31.972 | 2.8 | 5 | 0 |
| 2 | 6-10 | 1m 12s | 14.327 | 0.8 | 7.2 | 0 |
| 3 | 11-15 | 1m 25s | 16.931 | 4 | 6.8 | 0 |
| 4 | 16-20 | 1m 21s | 16.233 | 3.2 | 6.4 | 0 |
| 5 | 21-25 | 1m 26s | 17.107 | 2.8 | 6.4 | 0 |
| 6 | 26-30 | 1m 17s | 15.485 | 3.4 | 5.6 | 0 |

## Progression Signals

- Corp score actions: 105
- Runner steal actions: 49
- Missed score windows: 6

## Why Coverage

- Audit status: complete
- Decisions sampled: 8194
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 8194
- Decisions with top-level WhyNot: 5477
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 5477
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
