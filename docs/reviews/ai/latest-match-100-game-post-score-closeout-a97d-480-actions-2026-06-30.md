# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-30T09:20:00.733Z
Git head: a97d2859e

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
- Elapsed: 27m 36s
- Average seconds per completed game: 16.558
- Runner wins: 18 (18%)
- Corp wins: 73 (73%)
- Action-limit games: 9 (9%)
- Average agenda points: Runner 1.97, Corp 6.62
- Median agenda points: Runner 2, Corp 7
- Average actions: 238.96
- Average turns: 36.34
- Replay failures: 0
- Games with errors: 9

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 18s | 15.675 | 2.4 | 6 | 1 |
| 2 | 6-10 | 57s | 11.394 | 0.8 | 7.2 | 0 |
| 3 | 11-15 | 2m 8s | 25.595 | 3.6 | 6.4 | 0 |
| 4 | 16-20 | 37s | 7.338 | 1.8 | 6.8 | 1 |
| 5 | 21-25 | 1m 32s | 18.471 | 2.2 | 7 | 0 |
| 6 | 26-30 | 1m 53s | 22.625 | 4 | 4.8 | 0 |
| 7 | 31-35 | 55s | 11.091 | 0 | 7.4 | 1 |
| 8 | 36-40 | 2m 23s | 28.56 | 3.2 | 6.4 | 0 |
| 9 | 41-45 | 1m 19s | 15.746 | 2.2 | 7 | 0 |
| 10 | 46-50 | 1m 22s | 16.326 | 1.8 | 6.6 | 1 |
| 11 | 51-55 | 1m 37s | 19.433 | 2.2 | 6.8 | 1 |
| 12 | 56-60 | 43s | 8.535 | 1.6 | 7.6 | 0 |
| 13 | 61-65 | 1m 9s | 13.769 | 1 | 6.6 | 2 |
| 14 | 66-70 | 1m 23s | 16.669 | 0.4 | 6.6 | 1 |
| 15 | 71-75 | 1m 6s | 13.181 | 4 | 5.2 | 0 |
| 16 | 76-80 | 44s | 8.734 | 1 | 6.6 | 1 |
| 17 | 81-85 | 1m 20s | 15.944 | 2.2 | 6.2 | 0 |
| 18 | 86-90 | 52s | 10.477 | 0.8 | 7.6 | 0 |
| 19 | 91-95 | 1m 31s | 18.118 | 3 | 6.4 | 0 |
| 20 | 96-100 | 1m 37s | 19.495 | 1.2 | 7.2 | 0 |

## Progression Signals

- Corp score actions: 377
- Runner steal actions: 114
- Missed score windows: 66

## Why Coverage

- Audit status: complete
- Decisions sampled: 23896
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 23896
- Decisions with top-level WhyNot: 15495
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 15495
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
