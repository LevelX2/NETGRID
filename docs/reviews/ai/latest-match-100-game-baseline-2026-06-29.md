# AI Match Deck Baseline match_41020769c9f35150

Status: complete
Generated: 2026-06-29T12:32:43.986Z
Git head: fb07895c0

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
- Elapsed: 14m 39s
- Average seconds per completed game: 8.794
- Runner wins: 13 (13%)
- Corp wins: 0 (0%)
- Action-limit games: 87 (87%)
- Average agenda points: Runner 3.2, Corp 0.25
- Median agenda points: Runner 3, Corp 0
- Average actions: 153.32
- Average turns: 18.54
- Replay failures: 0
- Games with errors: 0

## Batch Timings

| Batch |  Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| ----- | -----: | -------: | -----------: | --------: | ------: | -----: |
| 1     |    1-5 |      57s |       11.322 |       2.6 |     0.4 |      4 |
| 2     |   6-10 |      41s |        8.214 |       2.8 |     0.2 |      4 |
| 3     |  11-15 |      49s |        9.801 |         4 |     0.4 |      5 |
| 4     |  16-20 |      48s |        9.556 |       5.4 |       0 |      4 |
| 5     |  21-25 |      42s |        8.452 |         1 |       0 |      5 |
| 6     |  26-30 |      32s |         6.39 |       2.8 |       0 |      5 |
| 7     |  31-35 |      43s |         8.62 |       1.8 |     0.2 |      4 |
| 8     |  36-40 |      44s |        8.835 |       3.2 |       0 |      5 |
| 9     |  41-45 |      33s |        6.598 |       6.6 |       0 |      2 |
| 10    |  46-50 |      44s |        8.763 |         3 |     0.4 |      5 |
| 11    |  51-55 |      33s |        6.601 |       3.8 |       0 |      4 |
| 12    |  56-60 |      37s |        7.461 |         4 |     1.2 |      5 |
| 13    |  61-65 |      45s |        9.003 |       3.8 |     0.4 |      5 |
| 14    |  66-70 |      52s |       10.443 |       2.4 |       0 |      5 |
| 15    |  71-75 |      42s |        8.447 |       4.4 |       0 |      4 |
| 16    |  76-80 |    1m 3s |       12.645 |         1 |     0.8 |      5 |
| 17    |  81-85 |      33s |        6.621 |       1.8 |     0.4 |      5 |
| 18    |  86-90 |      44s |        8.775 |       2.6 |       0 |      4 |
| 19    |  91-95 |      26s |        5.194 |       4.6 |     0.6 |      2 |
| 20    | 96-100 |      37s |        7.417 |       2.4 |       0 |      5 |

## Progression Signals

- Corp score actions: 14
- Runner steal actions: 187
- Missed score windows: 13

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
