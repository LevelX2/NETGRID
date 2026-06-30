# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T06:57:10.507Z
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
- Max actions per game: 160
- Elapsed: 21m 2s
- Average seconds per completed game: 12.619
- Runner wins: 30 (30%)
- Corp wins: 0 (0%)
- Action-limit games: 70 (70%)
- Average agenda points: Runner 4.49, Corp 1.87
- Median agenda points: Runner 5, Corp 2
- Average actions: 143.49
- Average turns: 19.98
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 6s | 13.118 | 3 | 1.4 | 3 |
| 2 | 6-10 | 58s | 11.67 | 4.8 | 1.8 | 3 |
| 3 | 11-15 | 1m 16s | 15.154 | 4.6 | 2 | 3 |
| 4 | 16-20 | 1m 1s | 12.287 | 6 | 2 | 3 |
| 5 | 21-25 | 1m 7s | 13.381 | 2.8 | 1.6 | 4 |
| 6 | 26-30 | 58s | 11.55 | 5.2 | 1.4 | 3 |
| 7 | 31-35 | 53s | 10.555 | 2.6 | 2.2 | 4 |
| 8 | 36-40 | 1m 2s | 12.304 | 5 | 2.4 | 5 |
| 9 | 41-45 | 47s | 9.455 | 6.8 | 2.4 | 1 |
| 10 | 46-50 | 59s | 11.747 | 3.6 | 3.2 | 4 |
| 11 | 51-55 | 54s | 10.769 | 5.4 | 2.2 | 3 |
| 12 | 56-60 | 55s | 11.049 | 5.2 | 2.2 | 4 |
| 13 | 61-65 | 59s | 11.708 | 4.8 | 2.4 | 5 |
| 14 | 66-70 | 1m 12s | 14.465 | 3.8 | 1.6 | 4 |
| 15 | 71-75 | 51s | 10.212 | 6.2 | 0.8 | 3 |
| 16 | 76-80 | 1m 15s | 15.08 | 3.2 | 2 | 4 |
| 17 | 81-85 | 48s | 9.559 | 4.4 | 2 | 4 |
| 18 | 86-90 | 1m 8s | 13.676 | 3.6 | 1.8 | 4 |
| 19 | 91-95 | 37s | 7.43 | 4.8 | 0.4 | 2 |
| 20 | 96-100 | 1m 0s | 11.915 | 4 | 1.6 | 4 |

## Progression Signals

- Corp score actions: 111
- Runner steal actions: 261
- Missed score windows: 11

## Why Coverage

- Audit status: complete
- Decisions sampled: 14349
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 14349
- Decisions with top-level WhyNot: 8618
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 8618
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
