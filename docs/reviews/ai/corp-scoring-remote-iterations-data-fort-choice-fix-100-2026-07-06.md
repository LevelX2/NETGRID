# AI Match Deck Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-06T17:00:22.663Z
Git head: bc55ac0f8

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
- Elapsed: 28m 38s
- Average seconds per completed game: 17.178
- Runner wins: 18 (18%)
- Corp wins: 75 (75%)
- Action-limit games: 7 (7%)
- Average agenda points: Runner 3.24, Corp 2.17
- Median agenda points: Runner 2.5, Corp 0
- Average actions: 203.23
- Average turns: 28.54
- Replay failures: 0
- Games with errors: 0

## Vergleich zum Punish-Primary-Scoreline-Gate

Dieser Lauf nutzt denselben Match-Snapshot, dieselben Decks, dieselben Seeds `latest-match-baseline-001` bis `latest-match-baseline-100` und `maxActions=480` wie `corp-scoring-remote-iterations-punish-primary-scoreline-gate-100-2026-07-06`.

- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)
- Vorher: 71 Corp-Siege, 19 Runner-Siege, 10 Action-Limits, 4 Spiele mit `ERR_INVALID_TARGET`.
- Nachher: 75 Corp-Siege, 18 Runner-Siege, 7 Action-Limits, 0 Spiele mit Errors.
- Progression: Corp-Scores 116, Runner-Steals 185, Corp-Flatlines 60.

Ursache des behobenen Fehlers: Nach `Data Fort Reclamation` hatte der generische `select_cards`-Fallback alle HQ-Optionen gewählt. Dadurch wurden Agendas oder mehrere nicht kompatible Root-Hauptkarten für ein neues Remote ausgewählt und die Engine lehnte die Resolution korrekt mit `ERR_INVALID_TARGET` ab. Der neue Choice-Resolver bildet für `score_install_hq_cards_into_new_remote_then_rez` eine side-safe Auswahl aus eigener sichtbarer HQ-Hand: ICE werden bevorzugt, höchstens eine Asset-Hauptkarte wird ausgewählt, Upgrades sind nachrangig, Agendas werden nicht blind in das neue Remote gelegt.

## Batch Timings

| Batch | Games | Duration | Seconds/Game | Runner AP | Corp AP | Limits |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1-5 | 1m 37s | 19.386 | 2.2 | 5.8 | 0 |
| 2 | 6-10 | 1m 27s | 17.319 | 1.8 | 1.6 | 2 |
| 3 | 11-15 | 50s | 10.043 | 6.4 | 0.8 | 0 |
| 4 | 16-20 | 27s | 5.382 | 4.8 | 1.2 | 0 |
| 5 | 21-25 | 2m 34s | 30.854 | 5 | 3.2 | 1 |
| 6 | 26-30 | 1m 10s | 14.028 | 4.6 | 0 | 0 |
| 7 | 31-35 | 1m 36s | 19.154 | 2.6 | 2.8 | 1 |
| 8 | 36-40 | 1m 14s | 14.738 | 3.4 | 1.2 | 0 |
| 9 | 41-45 | 50s | 10.082 | 2.4 | 2 | 0 |
| 10 | 46-50 | 1m 9s | 13.708 | 2.4 | 2.4 | 0 |
| 11 | 51-55 | 2m 12s | 26.306 | 3 | 3.6 | 1 |
| 12 | 56-60 | 2m 13s | 26.576 | 2.8 | 3.6 | 1 |
| 13 | 61-65 | 1m 3s | 12.64 | 3.8 | 1.2 | 0 |
| 14 | 66-70 | 50s | 9.952 | 4 | 0.4 | 0 |
| 15 | 71-75 | 1m 28s | 17.639 | 2.6 | 0.4 | 1 |
| 16 | 76-80 | 2m 2s | 24.437 | 3 | 5.8 | 0 |
| 17 | 81-85 | 1m 2s | 12.332 | 2.2 | 1.4 | 0 |
| 18 | 86-90 | 11s | 2.189 | 2 | 0.4 | 0 |
| 19 | 91-95 | 2m 4s | 24.838 | 4.4 | 3.8 | 0 |
| 20 | 96-100 | 1m 16s | 15.269 | 1.4 | 1.8 | 0 |

## Progression Signals

- Corp score actions: 116
- Runner steal actions: 185
- Missed score windows: 0

## Why Coverage

- Audit status: complete
- Decisions sampled: 20323
- Decisions requiring WhyNot: 0
- Decisions not requiring WhyNot: 20323
- Decisions with top-level WhyNot: 12255
- Decisions missing top-level WhyNot: 0
- Decisions with Runtime WhyNot section: 12255
- ActionAlternatives: 0
- Selected ActionAlternatives with WhyChosen: 0/0
- Non-selected ActionAlternatives with WhyNot: 0/0
- ActionAlternatives with WhyChosen: 0
- ActionAlternatives with WhyNot: 0
- Missing coverage signals: none

## Vergleichshinweis

Diese Baseline ist ein lokaler Diagnosewert für dieselben Match-Decks mit `current_candidate` auf beiden Seiten. Für spätere Vergleiche sollten derselbe Match-Snapshot, dieselben Seeds, dieselbe Batchgröße und derselbe `maxActions`-Wert genutzt werden.
