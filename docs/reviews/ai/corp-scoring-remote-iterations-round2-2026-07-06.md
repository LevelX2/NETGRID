# Corp-Scoring-/Remote-Iteration Runde 2

Status: Kandidat 16 wird promotet. Der wichtigste Befund ist kein weiteres globales Scoreline-Tuning, sondern ein Opening-Hand-Bewertungsfehler: Karten wurden pro Rollenfund statt pro Karte gezaehlt.

## Aenderungen

- Opening-Hand-Bewertung zaehlt Corp- und Runner-Karten jetzt einmal pro Rollenfamilie. Eine Agenda mit mehreren Agenda-/Scoreline-Rollen wird also als eine Agenda gezaehlt, nicht als mehrere Agendas.
- Corp-Mulligan bei Agenda-Flood ist dadurch belastbarer: Im 100-Seed-Startdiagnose-Sample wurden 3-Agenda-Haende 5/5 mal gemulligant; 3+ Agenda-Haende wurden 0 mal behalten.
- 2-Agenda-Haende bleiben nicht automatisch schlecht: 15/20 wurden gehalten, wenn ICE/Economy den Plan stuetzen. Das ist absichtlich, weil eine Rush-Corp nicht jede 2-Agenda-Hand wegwerfen soll.
- `run_lock` zaehlt im ICE-Placement nicht mehr als sofortiger Access-Stopp. Next-Encounter-/positionsabhaengige ICE wie Shock.r erzeugen damit solo keine belastbare Scoring-Sicherheit.

## Verworfene Zwischenkandidaten

| Kandidat | Idee | Ergebnis | Entscheidung |
| --- | --- | --- | --- |
| 12 | R&D vor zweiter HQ-Schicht oeffnen | 30er praktisch unveraendert | Zurueckgenommen. |
| 13 | Kandidat 12 plus `run_lock` nicht als Immediate-Stop | 30er: Runner 11 / Corp 17 / Limits 2, aber Corp score actions 24 | Aufgespalten, weil der R&D-Teil nicht belegbar war. |
| 14 | Nur `run_lock`-Fix | 30er: Runner 11 / Corp 17 / Limits 2, Runner AP 4.133, Corp AP 1.367 | Fachlich korrekter ICE-Profil-Fix, aber allein kein ausreichender Scoreline-Fortschritt. |
| 15 | `run_lock` plus Remote-Exit-vor-zweiter-HQ-Schicht | 30er identisch zu Kandidat 14 | Zurueckgenommen, kein messbarer Effekt. |
| 16 | `run_lock` plus Opening-Hand-Kartenzahl-Fix | 30er: Runner 10 / Corp 18 / Limits 2 | Promotet und mit 100er verifiziert. |

## 100er Vergleich

Gleicher Match-Snapshot, gleiche Seed-Serie `latest-match-baseline-*`, 480 Actions.

| Metrik | Baseline | Kandidat 16 | Delta |
| --- | ---: | ---: | ---: |
| Runner-Siege | 20 | 21 | +1 |
| Corp-Siege | 64 | 66 | +2 |
| Action-Limits | 16 | 13 | -3 |
| Runner-AP Schnitt | 3.69 | 3.63 | -0.06 |
| Corp-AP Schnitt | 1.02 | 1.04 | +0.02 |
| Corp score actions | 57 | 59 | +2 |
| Runner steal actions | 210 | 206 | -4 |
| Missed score windows | 0 | 0 | 0 |
| Spiele mit Errors | 1 | 0 | -1 |

## Bewertung

Kandidat 16 ist kein grosser Durchbruch im Scoring-Verhalten, aber ein belastbarer Fortschritt: mehr Corp-Siege, weniger Limits, mehr Corp-Scores, weniger Runner-Steals und keine Replay-/Error-Verschlechterung. Der Runner-Sieg-Wert steigt um 1, deshalb ist der Effekt nicht als reine Dominanzverbesserung zu lesen.

Der Mulligan-Fix ist trotzdem notwendig, weil die alte Evidence unmoegliche Werte erzeugen konnte, z.B. mehr Agenda- oder ICE-Zaehler als Karten in der Starthand. Dadurch waren Agenda-Flood-Entscheidungen nicht verlaesslich auswertbar.

## Rest-Risiko

- Die Corp gewinnt weiterhin oft ueber Flatline statt ueber Agenda-Scoring; das zentrale Scoring-/Remote-Thema ist damit nicht geloest.
- 2-Agenda-Haende werden bewusst nicht pauschal gemulligant. Falls kuenftige Spielanalysen zeigen, dass diese Haende trotz ICE/Economy zu oft HQ-Gifts erzeugen, sollte das als eigener Kandidat getestet werden.
- Die verworfenen Remote-/Central-Gewichtsversuche sollten nicht ohne neuen Seed-Beleg wieder aufgenommen werden.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/deck-opening-hand.test.ts src/runtime/corp-ice-placement/corp-ice-placement.test.ts src/runtime/semantic-runtime-corp-board-triage.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
