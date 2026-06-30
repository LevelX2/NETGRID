# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T08:24:22.913Z
Git head: 105d58a5c

## Source

- Match: `match_41020769c9f35150`
- SQLite: `data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-06-29T09:00:29.406Z`
- Runner deck: `Inside Forgery Loop` (fnv1a:14c9bd9a)
- Corp deck: `KI Rush Score - Static ICE Mix` (fnv1a:a1182048)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 24m 6s
- Average seconds per completed game: 14.461
- Runner wins: 74 (74%)
- Corp wins: 19 (19%)
- Action-limit games: 7 (7%)
- Average agenda points: Runner 5.93, Corp 3.29
- Median agenda points: Runner 7, Corp 2
- Average actions: 232.33
- Average turns: 30.04
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 53s | 22.64 | 3.8 | 4.6 | 1 |
| 2 | 6-10 | 1m 2s | 12.343 | 5.6 | 2.6 | 0 |
| 3 | 11-15 | 52s | 10.497 | 6.6 | 2.4 | 0 |
| 4 | 16-20 | 46s | 9.279 | 7 | 3 | 0 |
| 5 | 21-25 | 1m 12s | 14.428 | 6 | 2.4 | 1 |
| 6 | 26-30 | 1m 18s | 15.596 | 6.4 | 2.2 | 0 |
| 7 | 31-35 | 1m 26s | 17.212 | 5 | 4.2 | 1 |
| 8 | 36-40 | 1m 27s | 17.427 | 6.4 | 4 | 0 |
| 9 | 41-45 | 38s | 7.553 | 7.2 | 2.8 | 0 |
| 10 | 46-50 | 1m 24s | 16.895 | 6 | 4.4 | 0 |
| 11 | 51-55 | 39s | 7.777 | 7 | 2.8 | 0 |
| 12 | 56-60 | 1m 4s | 12.745 | 6 | 4 | 0 |
| 13 | 61-65 | 1m 0s | 11.94 | 6.4 | 4 | 0 |
| 14 | 66-70 | 1m 7s | 13.323 | 5.6 | 2.6 | 0 |
| 15 | 71-75 | 46s | 9.297 | 7.2 | 2.4 | 0 |
| 16 | 76-80 | 1m 7s | 13.301 | 5.2 | 3.8 | 0 |
| 17 | 81-85 | 1m 19s | 15.816 | 5.4 | 4 | 1 |
| 18 | 86-90 | 1m 22s | 16.405 | 4.2 | 3.8 | 1 |
| 19 | 91-95 | 46s | 9.125 | 5 | 2 | 1 |
| 20 | 96-100 | 1m 53s | 22.553 | 6.6 | 3.8 | 1 |

## Progression Signals

- Corp score actions: 190
- Runner steal actions: 344
- Missed score windows: 15

## Why Coverage

- Audit status: complete
- Decisions sampled: 23233
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 23233
- Decisions with top-level WhyNot: 15114
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 15114
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
