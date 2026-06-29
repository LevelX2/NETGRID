# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-29T16:13:34.917Z
Git head: a97d2859e

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
- Max actions per game: 160
- Elapsed: 23m 22s
- Average seconds per completed game: 14.022
- Runner wins: 1 (1%)
- Corp wins: 14 (14%)
- Action-limit games: 85 (85%)
- Average agenda points: Runner 1.21, Corp 4.46
- Median agenda points: Runner 0.5, Corp 4
- Average actions: 151.2
- Average turns: 22.89
- Replay failures: 0
- Games with errors: 8

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 5s | 13.04 | 1.6 | 3.4 | 5 |
| 2 | 6-10 | 1m 12s | 14.302 | 0.8 | 4 | 5 |
| 3 | 11-15 | 1m 25s | 17.058 | 2 | 4.4 | 5 |
| 4 | 16-20 | 58s | 11.668 | 1.8 | 6 | 3 |
| 5 | 21-25 | 1m 12s | 14.433 | 0.6 | 3.8 | 4 |
| 6 | 26-30 | 1m 6s | 13.2 | 1.2 | 3.6 | 4 |
| 7 | 31-35 | 1m 12s | 14.369 | 0 | 4.2 | 5 |
| 8 | 36-40 | 1m 2s | 12.488 | 2.4 | 4 | 5 |
| 9 | 41-45 | 1m 7s | 13.404 | 1.8 | 5.2 | 4 |
| 10 | 46-50 | 1m 4s | 12.875 | 1 | 5 | 5 |
| 11 | 51-55 | 1m 0s | 11.956 | 1 | 4.2 | 5 |
| 12 | 56-60 | 1m 13s | 14.608 | 1.6 | 6.4 | 2 |
| 13 | 61-65 | 50s | 10.039 | 0.6 | 4.8 | 4 |
| 14 | 66-70 | 1m 1s | 12.179 | 0.4 | 4 | 5 |
| 15 | 71-75 | 59s | 11.834 | 2.8 | 4.2 | 3 |
| 16 | 76-80 | 54s | 10.765 | 0.6 | 4.2 | 5 |
| 17 | 81-85 | 1m 2s | 12.307 | 1.8 | 4.6 | 3 |
| 18 | 86-90 | 1m 0s | 11.94 | 0.8 | 5.4 | 3 |
| 19 | 91-95 | 1m 12s | 14.359 | 1 | 4 | 5 |
| 20 | 96-100 | 1m 8s | 13.543 | 0.4 | 3.8 | 5 |

## Progression Signals

- Corp score actions: 258
- Runner steal actions: 75
- Missed score windows: 43

## Why Coverage

- Audit status: complete
- Decisions sampled: 15120
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 15120
- Decisions with top-level WhyNot: 9371
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 9371
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
