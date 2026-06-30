# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T11:09:37.838Z
Git head: c2d70fcde

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
- Elapsed: 8m 59s
- Average seconds per completed game: 17.974
- Runner wins: 10 (33.3%)
- Corp wins: 20 (66.7%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 3.233, Corp 6.1
- Median agenda points: Runner 2, Corp 7
- Average actions: 269.067
- Average turns: 42
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 6s | 25.253 | 3.8 | 5 | 0 |
| 2 | 6-10 | 1m 26s | 17.254 | 2.6 | 5.8 | 0 |
| 3 | 11-15 | 1m 36s | 19.234 | 4.6 | 5.8 | 0 |
| 4 | 16-20 | 1m 17s | 15.311 | 2.6 | 6.8 | 0 |
| 5 | 21-25 | 1m 22s | 16.324 | 2.6 | 6.6 | 0 |
| 6 | 26-30 | 1m 4s | 12.804 | 3.2 | 6.6 | 0 |

## Progression Signals

- Corp score actions: 107
- Runner steal actions: 56
- Missed score windows: 7

## Why Coverage

- Audit status: complete
- Decisions sampled: 8072
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 8072
- Decisions with top-level WhyNot: 5332
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 5332
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
