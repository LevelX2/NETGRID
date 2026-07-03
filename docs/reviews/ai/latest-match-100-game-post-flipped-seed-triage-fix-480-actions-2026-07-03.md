# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-07-03T13:48:01.802Z
Git head: b525bf09e

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
- Elapsed: 31m 17s
- Average seconds per completed game: 18.766
- Runner wins: 52 (52%)
- Corp wins: 35 (35%)
- Action-limit games: 13 (13%)
- Average agenda points: Runner 4.12, Corp 4.38
- Median agenda points: Runner 4, Corp 4
- Average actions: 308.64
- Average turns: 41.38
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 59s | 23.891 | 2.4 | 6 | 0 |
| 2 | 6-10 | 1m 37s | 19.456 | 3 | 5.2 | 1 |
| 3 | 11-15 | 53s | 10.629 | 5 | 4.2 | 0 |
| 4 | 16-20 | 1m 57s | 23.46 | 5.2 | 5.6 | 0 |
| 5 | 21-25 | 1m 30s | 17.953 | 5 | 4.2 | 1 |
| 6 | 26-30 | 59s | 11.819 | 4.4 | 2.8 | 1 |
| 7 | 31-35 | 2m 1s | 24.172 | 0.6 | 7 | 1 |
| 8 | 36-40 | 1m 13s | 14.681 | 7.6 | 2 | 0 |
| 9 | 41-45 | 2m 27s | 29.409 | 3.6 | 4 | 1 |
| 10 | 46-50 | 1m 39s | 19.816 | 2.4 | 6.4 | 0 |
| 11 | 51-55 | 52s | 10.356 | 6.8 | 2.6 | 1 |
| 12 | 56-60 | 1m 12s | 14.331 | 5.6 | 3.2 | 0 |
| 13 | 61-65 | 1m 30s | 17.973 | 4.8 | 4.2 | 0 |
| 14 | 66-70 | 1m 44s | 20.826 | 3 | 4.4 | 0 |
| 15 | 71-75 | 1m 49s | 21.846 | 4.8 | 3.2 | 3 |
| 16 | 76-80 | 1m 13s | 14.64 | 4 | 6.8 | 0 |
| 17 | 81-85 | 1m 26s | 17.232 | 4.8 | 3.2 | 1 |
| 18 | 86-90 | 1m 10s | 14.096 | 3.8 | 3.8 | 1 |
| 19 | 91-95 | 47s | 9.368 | 3.6 | 4.8 | 0 |
| 20 | 96-100 | 1m 39s | 19.773 | 2 | 4 | 2 |

## Progression Signals

- Corp score actions: 251
- Runner steal actions: 238
- Missed score windows: 19

## Why Coverage

- Audit status: complete
- Decisions sampled: 30864
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 30864
- Decisions with top-level WhyNot: 20812
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 20812
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
