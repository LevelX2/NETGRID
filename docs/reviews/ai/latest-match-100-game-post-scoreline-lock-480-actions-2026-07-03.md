# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-07-03T16:39:19.114Z
Git head: 28c521da1

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
- Elapsed: 27m 46s
- Average seconds per completed game: 16.659
- Runner wins: 48 (48%)
- Corp wins: 40 (40%)
- Action-limit games: 12 (12%)
- Average agenda points: Runner 3.85, Corp 4.92
- Median agenda points: Runner 3, Corp 6
- Average actions: 295.54
- Average turns: 39.26
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 25s | 17.042 | 3.4 | 5.2 | 0 |
| 2 | 6-10 | 1m 25s | 16.963 | 2.2 | 6 | 0 |
| 3 | 11-15 | 58s | 11.579 | 4.2 | 5 | 1 |
| 4 | 16-20 | 1m 29s | 17.71 | 5 | 5.6 | 1 |
| 5 | 21-25 | 1m 26s | 17.21 | 4 | 5.6 | 1 |
| 6 | 26-30 | 1m 9s | 13.767 | 4.8 | 3.6 | 0 |
| 7 | 31-35 | 1m 31s | 18.165 | 1.2 | 6.6 | 1 |
| 8 | 36-40 | 1m 18s | 15.657 | 3.8 | 5.2 | 1 |
| 9 | 41-45 | 1m 43s | 20.579 | 4.8 | 5.6 | 1 |
| 10 | 46-50 | 1m 45s | 20.974 | 2.6 | 5 | 1 |
| 11 | 51-55 | 48s | 9.698 | 6.8 | 2.2 | 1 |
| 12 | 56-60 | 47s | 9.305 | 6.2 | 3.4 | 0 |
| 13 | 61-65 | 1m 44s | 20.876 | 3.6 | 4.6 | 1 |
| 14 | 66-70 | 1m 26s | 17.144 | 3.2 | 4.2 | 1 |
| 15 | 71-75 | 1m 39s | 19.816 | 4 | 5 | 0 |
| 16 | 76-80 | 43s | 8.529 | 3.6 | 5.4 | 0 |
| 17 | 81-85 | 1m 27s | 17.463 | 4.4 | 5.2 | 0 |
| 18 | 86-90 | 1m 2s | 12.472 | 3.4 | 4.2 | 1 |
| 19 | 91-95 | 44s | 8.839 | 4.4 | 4.4 | 1 |
| 20 | 96-100 | 1m 53s | 22.509 | 1.4 | 6.4 | 0 |

## Progression Signals

- Corp score actions: 280
- Runner steal actions: 224
- Missed score windows: 18

## Why Coverage

- Audit status: complete
- Decisions sampled: 29554
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 29554
- Decisions with top-level WhyNot: 20821
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 20821
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
