# Corp Scoring Remote Iterations - Action-Limit Metric Fix Panel 20

Datum: 2026-07-07

## Zweck

Dieser Lauf validiert einen Benchmark-/Diagnose-Fix. Die langen Trace-Matrix-Läufe dämpfen den `action_limit_reached`-Finding-Detector, damit 480-Action-Benchmarks nicht nur aus Limit-Findings bestehen. Die Aggregatmetrik `actionLimitReached` darf dadurch aber nicht auf `0` fallen, wenn `winner: "action_limit_reached"` vorliegt.

## Änderung

- `runAiSelfplayTraceMining` zählt `aggregate.actionLimitReached` wieder direkt aus `summary.winner === "action_limit_reached"` plus sauberem Action-Limit-Ende.
- Trace-Matrix- und Play-Strength-Script-Ausgaben leiten `actionLimitReached` pro Summary ebenfalls aus `winner` ab, statt ein nicht existierendes Summary-Feld zu lesen.
- Der Finding-Zähler `findingsByDetector.action_limit_reached` bleibt bei langen Läufen weiterhin `0`, wenn der Detector bewusst deaktiviert ist.

## Ergebnis

Gleiche 20 Spiele, gleiche Seeds, gleiche Deckpaare, `maxActions=480`.

| Kennzahl | Vor Fix | Nach Fix |
|---|---:|---:|
| Spiele | 20 | 20 |
| Corp-Siege | 7 | 7 |
| Runner-Siege | 11 | 11 |
| Action-Limit-Spiele nach Winner | 2 | 2 |
| `aggregate.actionLimitReached` | 0 | 2 |
| Durchschnittliche Aktionen | 215.45 | 215.45 |
| Corp Scores | 30 | 30 |
| Runner Steals | 28 | 28 |
| Unsafe Score Chosen | 0 | 0 |
| Passive Scoreline Available | 22 | 22 |

## Paarbild nach Fix

| Paar | Ergebnis | Action Limits | Ø Aktionen | Corp Scores | Runner Steals | Low-Value-Loops |
|---|---:|---:|---:|---:|---:|---:|
| E Event Pressure vs Tag Ops Control | Runner 5 | 0 | 187.0 | 3 | 10 | 186 |
| F Starter Pressure vs Starter Score Grid | Corp 2 / Runner 3 | 0 | 124.8 | 8 | 4 | 61 |
| G Stealth Interface Starter vs Ivory Bastion | Runner 2 / Corp 1 / Limit 2 | 2 | 299.8 | 7 | 10 | 0 |
| H Blink Pressure Rig vs Siren Fortress | Corp 4 / Runner 1 | 0 | 250.2 | 12 | 4 | 0 |

## Bewertung

Der Fix verbessert nicht die KI selbst, sondern die Benchmark-Interpretation. Die aktuellen Gameplay-Signale bleiben:

- Paar E ist weiter der schwächste Korp-Slot im Panel.
- Paar G erzeugt die beiden echten Action-Limit-Spiele.
- Die nächsten Gameplay-Iterationen sollten nicht auf `actionLimitReached=0` aufbauen, sondern auf der korrigierten Zählung `2/20`.
