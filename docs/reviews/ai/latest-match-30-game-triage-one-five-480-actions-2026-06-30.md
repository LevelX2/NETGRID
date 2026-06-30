# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T10:59:15.970Z
Git head: b70355e44

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
- Elapsed: 9m 49s
- Average seconds per completed game: 19.62
- Runner wins: 9 (30%)
- Corp wins: 21 (70%)
- Action-limit games: 0 (0%)
- Average agenda points: Runner 2.7, Corp 6.533
- Median agenda points: Runner 2, Corp 7
- Average actions: 277.933
- Average turns: 43.033
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 37s | 31.303 | 2.8 | 5.8 | 0 |
| 2 | 6-10 | 1m 7s | 13.324 | 0.8 | 7.2 | 0 |
| 3 | 11-15 | 1m 27s | 17.429 | 3.6 | 7.2 | 0 |
| 4 | 16-20 | 1m 26s | 17.171 | 3.2 | 6.4 | 0 |
| 5 | 21-25 | 1m 21s | 16.224 | 2.8 | 6.4 | 0 |
| 6 | 26-30 | 1m 42s | 20.458 | 3 | 6.2 | 0 |

## Progression Signals

- Corp score actions: 111
- Runner steal actions: 47
- Missed score windows: 5

## Why Coverage

- Audit status: complete
- Decisions sampled: 8338
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 8338
- Decisions with top-level WhyNot: 5605
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 5605
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
