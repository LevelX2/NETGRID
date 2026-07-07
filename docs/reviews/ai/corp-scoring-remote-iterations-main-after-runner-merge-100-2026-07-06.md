# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T22:17:07.018Z
Git head: 46306db4c

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T18:30:18.406Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 34m 51s
- Average seconds per completed game: 20.908
- Runner wins: 22 (22%)
- Corp wins: 70 (70%)
- Action-limit games: 8 (8%)
- Average agenda points: Runner 3.59, Corp 2.73
- Median agenda points: Runner 3.5, Corp 2
- Average actions: 219.85
- Average turns: 31.23
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 24s | 16.88 | 2.2 | 5.2 | 0 |
| 2 | 6-10 | 1m 53s | 22.678 | 2.8 | 1.2 | 0 |
| 3 | 11-15 | 1m 7s | 13.426 | 6.8 | 1 | 0 |
| 4 | 16-20 | 1m 8s | 13.549 | 3.8 | 2.8 | 0 |
| 5 | 21-25 | 3m 36s | 43.194 | 4.8 | 5 | 1 |
| 6 | 26-30 | 1m 55s | 22.959 | 5.6 | 1.8 | 0 |
| 7 | 31-35 | 2m 7s | 25.399 | 4.2 | 3 | 1 |
| 8 | 36-40 | 1m 6s | 13.251 | 2.4 | 1.6 | 0 |
| 9 | 41-45 | 2m 14s | 26.837 | 3.4 | 4.4 | 1 |
| 10 | 46-50 | 48s | 9.545 | 2 | 0.8 | 0 |
| 11 | 51-55 | 1m 35s | 18.977 | 3.8 | 2.6 | 1 |
| 12 | 56-60 | 3m 8s | 37.559 | 3.8 | 4.6 | 1 |
| 13 | 61-65 | 1m 42s | 20.373 | 4 | 2 | 0 |
| 14 | 66-70 | 1m 45s | 21.015 | 3.8 | 3.2 | 1 |
| 15 | 71-75 | 1m 26s | 17.257 | 3.2 | 2.2 | 1 |
| 16 | 76-80 | 2m 1s | 24.295 | 3.8 | 5.2 | 0 |
| 17 | 81-85 | 22s | 4.489 | 1.4 | 0 | 0 |
| 18 | 86-90 | 11s | 2.161 | 1.2 | 0.4 | 0 |
| 19 | 91-95 | 2m 37s | 31.4 | 5.2 | 5.2 | 1 |
| 20 | 96-100 | 1m 22s | 16.488 | 3.6 | 2.4 | 0 |

## Progression Signals

- Corp score actions: 152
- Runner steal actions: 206
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 21985
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 21985
- Decisions with top-level WhyNot: 13159
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 13159
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
