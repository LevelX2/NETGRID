# Corp-Scoring-/Remote-Iteration Runde 1

Status: keine Code-Promotion. Die untersuchten Kandidaten verbessern Einzelmuster, aber keiner erfuellt den 100er-Promotionsgate sauber.

## Baseline

100 Spiele, 480 Actions, Seeds `latest-match-baseline-*`:

- Runner-Siege: 20
- Corp-Siege: 64
- Action-Limits: 16
- Runner-AP Schnitt: 3.69
- Corp-AP Schnitt: 1.02
- Corp score actions: 57
- Runner steal actions: 210
- Spiele mit Errors: 1

## Kandidaten

| Kandidat | Idee | 30er Ergebnis | 100er Ergebnis | Entscheidung |
| --- | --- | --- | --- | --- |
| 4 | Prepared-Scoreline-Offpath hart bestrafen, aktive Scoreline nicht liegenlassen | Runner 11 / Corp 16 / Limits 3, Score 32, Steals 70 | Runner 22 / Corp 64 / Limits 14, Score 69, Steals 209 | Verworfen: scoret mehr, kippt aber zwei Limits zu Runner-Siegen. |
| 5 | Scoreline-Druck bei sichtbar contestbarer Remote stark entschärfen | Runner 11 / Corp 16 / Limits 3, Score 24, Steals 70 | Runner 21 / Corp 64 / Limits 15, Score 55, Steals 207 | Verworfen: weniger Runner-Steals, aber Corp-Score-Actions unter Baseline und Runner +1. |
| 7 | Score-Level-Gate plus breites Triage-Gate gegen sichtbar erreichbare Remotes | Runner 11 / Corp 15 / Limits 4, Score 20, Steals 71 | nicht ausgeführt | Verworfen: 30er verliert Score-Actions und Corp-AP deutlich. |
| 9 | Score-Level-Gate plus enges Triage-Gate bei sehr hohem HQ-Flood | Runner 11 / Corp 16 / Limits 3, Score 24, Steals 70 | Runner 21 / Corp 64 / Limits 15, Score 56, Steals 206 | Verworfen: 080 verbessert, aber 083 kippt zum Runner; Score-Actions unter Baseline. |
| 10 | Prepared-Offpath-Penalty nur abschwächen statt abschalten | Seed-Check | nicht ausgeführt | Verworfen: 072 und 083 kippen weiter zum Runner. |

## Reproduzierbare Erkenntnisse

- Kandidat 4 beweist, dass der Prepared-Scoreline-Druck die Corp zu mehr Agenda-Scoring bringt. Das Problem ist nicht die Richtung, sondern die fehlende Begrenzung bei sichtbar contestbaren Remotes.
- Kandidat 5 beweist, dass die Begrenzung Runner-Steals senkt, aber zu viel Scoring-Druck entfernt.
- Kandidat 7/9 zeigen, dass ein Triage-Gate allein zu leicht neue Stalls erzeugt oder andere Seeds kippt.
- Der naechste sinnvolle Hebel ist nicht weiteres globales Hoch-/Runterdrehen, sondern eine separate Behandlung von "sichtbar contestbar, aber Remote-Schutzaktion verfuegbar" gegen "sichtbar contestbar, keine Schutzaktion, nur Agenda-Gift". In ersterem Fall muss Remote-ICE/Rez hoeher, in letzterem Draw/Economy, nicht Agenda-Install.
- Seed `latest-match-baseline-053` bleibt ein eigener Stall: Corp steht bei 6 AP und scoret korrekt vorhandene Score-Actions, findet oder nutzt danach aber keinen finalen Abschluss. Dieser Seed sollte separat untersucht werden, statt den Prepared-Scoreline-Druck weiter global zu drehen.

## Naechster Schnitt

1. Candidate-Code nicht promoten.
2. Naechste Runde isoliert auf zwei neue Komponenten ausrichten:
   - Contestable-prepared-remote: Remote-ICE/Rez vor Agenda-Install, wenn Schutz legal verfuegbar ist.
   - Post-6-AP-Endgame: bei Corp 6 AP Scoreline-Suche/Draw/Install gezielt priorisieren, ohne blind Agenda-Gifts zu erzeugen.
3. Erst danach wieder 30er/100er laufen lassen.
