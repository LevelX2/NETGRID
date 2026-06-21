# AI220 Practical Play Scorecard

Datum: 2026-06-21

## Scorecard

| Bereich | Status | Evidenz |
|---|---|---|
| LegalAction-Grenze | gruen | Comparator wendet nur Kandidaten an, deren `actionId` in `input.legalActions` vorhanden ist. |
| Hidden-Info-Schutz | gruen | Unit-Test prueft bekannte verbotene Transport-/Hidden-Felder; Matrixlaeufe `redactionSafe: true`. |
| Replay | gruen | A-D x5 und x10 Apply: `replayFailures: 0`. |
| Illegal Actions | gruen | A-D x5 und x10 Apply: `illegalActions: 0`. |
| Practical Impact x5 | rot | Keine Verbesserung: 11/20 Action-Limit-Spiele, 0 markierte Practical-Micro-Aktionen. |
| Practical Impact x10 | rot | 23/40 Action-Limit-Spiele, 0 markierte Practical-Micro-Aktionen. |
| Cutover | rot | No-Go, Default bleibt aus. |

## Bewertung

Die technische Schicht ist als Diagnose- und Experimentierhaken brauchbar. Als Spielstaerke-Fix ist der Block nicht ausreichend, weil die produktiven A-D-Selfplay-Zustaende keine der vier Kandidatenbedingungen erreichen.

