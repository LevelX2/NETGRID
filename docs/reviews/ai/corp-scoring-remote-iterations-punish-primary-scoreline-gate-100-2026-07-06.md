# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T16:19:54.049Z
Git head: 3ba76d5a0

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Mode: `human_runner_vs_corp_ai`
- Updated: `2026-07-05T18:30:18.406Z`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)

## Baseline

- Games: 100/100
- Batch size: 5
- Max actions per game: 480
- Elapsed: 22m 53s
- Average seconds per completed game: 13.733
- Runner wins: 19 (19%)
- Corp wins: 71 (71%)
- Action-limit games: 10 (10%)
- Average agenda points: Runner 3.23, Corp 2.08
- Median agenda points: Runner 2.5, Corp 0
- Average actions: 194.8
- Average turns: 27.25
- Replay failures: 0
- Games with errors: 4

## Korrekter Vergleichsstand

Dieser Lauf nutzt denselben Match-Snapshot wie die aktuellen Shadoe-Vergleiche:

- Match: `match_32b46ac7268c2c75`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)
- Seeds: `latest-match-baseline-001` bis `latest-match-baseline-100`
- Max actions: 480

Der frühere Fast-Advance-Zwischenlauf ist fuer diesen Vergleich nicht gueltig, weil er ein anderes Corp-Deck verwendet. Der hier relevante Vorher-Stand ist `corp-scoring-remote-iterations-shadoe-current-after-server-fixes-100-2026-07-06`: 55 Corp-Siege, 32 Runner-Siege, 13 Action-Limits, Runner-AP 4.24, Corp-AP 2.68, 152 Corp-Scores, 244 Runner-Steals, 42 Flatlines, 3 Spiele mit Errors.

Gegen diesen korrekten Shadoe-Vorher-Stand verbessert der Kandidat: 71 Corp-Siege, 19 Runner-Siege, 10 Action-Limits, Runner-AP 3.23, Corp-AP 2.08, 111 Corp-Scores, 184 Runner-Steals, 59 Flatlines. Die Error-Zahl steigt allerdings von 3 auf 4 und bleibt als separater Simulations-/Target-Folgepunkt offen.

Hinweis: Der automatisch eingetragene Git-Head zeigt den Basis-Commit vor dem lokalen Kandidaten-Commit. Der Lauf wurde im Worktree mit den uncommitted Punish-Primary-Scoreline-Gate-Aenderungen ausgefuehrt.

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 29s | 17.858 | 2.2 | 5.4 | 1 |
| 2 | 6-10 | 1m 24s | 16.763 | 1.8 | 1.6 | 2 |
| 3 | 11-15 | 47s | 9.402 | 6.4 | 0.8 | 0 |
| 4 | 16-20 | 25s | 5.004 | 4.8 | 1.2 | 0 |
| 5 | 21-25 | 2m 8s | 25.65 | 5.4 | 3 | 1 |
| 6 | 26-30 | 1m 4s | 12.796 | 4.6 | 0 | 0 |
| 7 | 31-35 | 1m 29s | 17.739 | 2.6 | 2.8 | 1 |
| 8 | 36-40 | 1m 8s | 13.537 | 3.4 | 1.2 | 0 |
| 9 | 41-45 | 47s | 9.356 | 2.4 | 2 | 0 |
| 10 | 46-50 | 1m 3s | 12.698 | 2.4 | 2.4 | 0 |
| 11 | 51-55 | 1m 24s | 16.867 | 3 | 3.6 | 1 |
| 12 | 56-60 | 1m 43s | 20.655 | 3.8 | 3.2 | 1 |
| 13 | 61-65 | 58s | 11.555 | 3.8 | 1.2 | 0 |
| 14 | 66-70 | 46s | 9.101 | 4 | 0.4 | 0 |
| 15 | 71-75 | 8s | 1.517 | 1.8 | 0.4 | 1 |
| 16 | 76-80 | 1m 41s | 20.108 | 2.2 | 5.2 | 1 |
| 17 | 81-85 | 57s | 11.344 | 2.2 | 1.4 | 0 |
| 18 | 86-90 | 10s | 1.969 | 2 | 0.4 | 0 |
| 19 | 91-95 | 1m 49s | 21.72 | 4.4 | 3.8 | 0 |
| 20 | 96-100 | 37s | 7.477 | 1.4 | 1.6 | 1 |

## Progression Signals

- Corp score actions: 111
- Runner steal actions: 184
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 19480
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 19480
- Decisions with top-level WhyNot: 11784
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 11784
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
