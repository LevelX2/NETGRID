# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-07-03T11:45:49.103Z
Git head: 26926f7b7

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
- Elapsed: 19m 7s
- Average seconds per completed game: 11.467
- Runner wins: 69 (69%)
- Corp wins: 24 (24%)
- Action-limit games: 7 (7%)
- Average agenda points: Runner 5.6, Corp 3.34
- Median agenda points: Runner 7, Corp 2
- Average actions: 254.83
- Average turns: 28.28
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 29s | 17.824 | 2.6 | 6.2 | 0 |
| 2 | 6-10 | 1m 7s | 13.37 | 5.4 | 3 | 1 |
| 3 | 11-15 | 45s | 8.962 | 7.2 | 2.2 | 0 |
| 4 | 16-20 | 37s | 7.33 | 5.2 | 3.8 | 0 |
| 5 | 21-25 | 1m 7s | 13.385 | 6.4 | 3.2 | 0 |
| 6 | 26-30 | 41s | 8.295 | 6 | 3 | 0 |
| 7 | 31-35 | 1m 19s | 15.717 | 2.8 | 5 | 0 |
| 8 | 36-40 | 33s | 6.601 | 7.4 | 1.2 | 0 |
| 9 | 41-45 | 42s | 8.306 | 6.6 | 2.4 | 1 |
| 10 | 46-50 | 1m 22s | 16.462 | 5.6 | 3.6 | 1 |
| 11 | 51-55 | 22s | 4.412 | 7.2 | 1.6 | 0 |
| 12 | 56-60 | 59s | 11.898 | 7.4 | 2.4 | 0 |
| 13 | 61-65 | 55s | 11.064 | 6.2 | 3.2 | 1 |
| 14 | 66-70 | 1m 13s | 14.542 | 4.2 | 4.4 | 1 |
| 15 | 71-75 | 52s | 10.382 | 7.8 | 3 | 0 |
| 16 | 76-80 | 49s | 9.725 | 5.2 | 4.4 | 0 |
| 17 | 81-85 | 54s | 10.789 | 6 | 3.2 | 1 |
| 18 | 86-90 | 30s | 6.041 | 4.6 | 2.2 | 1 |
| 19 | 91-95 | 44s | 8.763 | 3 | 4.4 | 0 |
| 20 | 96-100 | 1m 2s | 12.355 | 5.2 | 4.4 | 0 |

## Progression Signals

- Corp score actions: 188
- Runner steal actions: 330
- Missed score windows: 15

## Why Coverage

- Audit status: complete
- Decisions sampled: 25483
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 25483
- Decisions with top-level WhyNot: 17046
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 17046
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
