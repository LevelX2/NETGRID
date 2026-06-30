# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T10:14:57.397Z
Git head: 8798a658e

## Source

- Match: `match_41020769c9f35150`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-06-29T09:00:29.406Z`
- Runner deck: `Inside Forgery Loop` (fnv1a:14c9bd9a)
- Corp deck: `KI Rush Score - Static ICE Mix` (fnv1a:a1182048)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 30m 49s
- Average seconds per completed game: 18.489
- Runner wins: 26 (26%)
- Corp wins: 73 (73%)
- Action-limit games: 1 (1%)
- Average agenda points: Runner 2.71, Corp 6.49
- Median agenda points: Runner 2, Corp 7
- Average actions: 258.23
- Average turns: 40.23
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 2m 41s | 32.143 | 2.8 | 5.4 | 0 |
| 2 | 6-10 | 1m 15s | 15.064 | 0.8 | 7.2 | 0 |
| 3 | 11-15 | 1m 29s | 17.862 | 4 | 6.8 | 0 |
| 4 | 16-20 | 1m 25s | 17.035 | 3.2 | 6.4 | 0 |
| 5 | 21-25 | 1m 18s | 15.551 | 1.8 | 7.2 | 0 |
| 6 | 26-30 | 1m 17s | 15.37 | 2.6 | 6.4 | 0 |
| 7 | 31-35 | 1m 29s | 17.776 | 2 | 7.2 | 0 |
| 8 | 36-40 | 1m 28s | 17.638 | 3.4 | 5.4 | 0 |
| 9 | 41-45 | 1m 21s | 16.115 | 3.6 | 5.6 | 0 |
| 10 | 46-50 | 1m 41s | 20.237 | 3.4 | 5.4 | 0 |
| 11 | 51-55 | 1m 36s | 19.127 | 4.8 | 7.2 | 0 |
| 12 | 56-60 | 42s | 8.396 | 2 | 7.4 | 0 |
| 13 | 61-65 | 1m 27s | 17.445 | 0.8 | 5.6 | 1 |
| 14 | 66-70 | 1m 54s | 22.825 | 2.2 | 7.2 | 0 |
| 15 | 71-75 | 1m 33s | 18.591 | 3.2 | 7 | 0 |
| 16 | 76-80 | 1m 10s | 14.046 | 3 | 7.2 | 0 |
| 17 | 81-85 | 1m 42s | 20.469 | 3.8 | 5.8 | 0 |
| 18 | 86-90 | 1m 7s | 13.312 | 2 | 7.2 | 0 |
| 19 | 91-95 | 1m 30s | 17.98 | 3 | 5.6 | 0 |
| 20 | 96-100 | 1m 27s | 17.405 | 1.8 | 6.6 | 0 |

## Progression Signals

- Corp score actions: 369
- Runner steal actions: 154
- Missed score windows: 25

## Why Coverage

- Audit status: complete
- Decisions sampled: 25823
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 25823
- Decisions with top-level WhyNot: 17209
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 17209
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
