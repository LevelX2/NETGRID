# Corp-Scoring-/Remote-Iteration: verworfene Access-vs-Steal-Lockerung

Status: verworfen, nicht in Runtime übernommen.

Der getestete breite Kandidat lockerte die game-ending Scoreline-Exposure-Strafe, wenn der Runner zwar vor dem Score accessen konnte, ein sichtbarer Steal aber zunächst blockiert wirkte. Zusätzlich durfte Triage eine side-safe Agenda-Installation in denselben Remote als passend zum Schutz-Ziel werten.

30er-Vergleich mit `latest-match-baseline-*`, `maxActions=480`, Match `match_32b46ac7268c2c75`:

| Stand | Runner-Siege | Corp-Siege | Action-Limit | Runner-AP | Corp-AP | Corp-Scores | Runner-Steals |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ohne Access-vs-Steal-Kandidat | 9 | 21 | 0 | 4.133 | 3.000 | 49 | 74 |
| breite Lockerung + durable trace guard | 12 | 18 | 0 | 4.400 | 3.167 | 51 | 76 |
| durable Access-Stop only | 9 | 21 | 0 | 4.167 | 3.233 | 52 | 73 |

Entscheidung:

- Die breite Lockerung kippt drei zusätzliche Spiele zur Runner-Seite und wird verworfen.
- Der kleinere Fix bleibt: Trace-/Tax-/Damage-ICE ohne echten Access-Stop zählt nicht als `durable` Scoring-Schutz.
- Das Ziel bleibt, Access erreichbar und Agenda stehlbar weiter getrennt zu bewerten, aber nicht über eine globale Abschwächung der game-ending Exposure-Strafe.
