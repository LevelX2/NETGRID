# Corp-Scoring-/Remote-Iteration: verworfener Scoreline-Plan-Yield

Status: verworfen, nicht in Runtime übernommen.

Der getestete Kandidat ließ `corp.create_score_window`-Planmapping gegen eine bessere semantische Alternative verlieren, wenn die gemappte Aktion eine stark negative `advance_card`- oder `install_card`-Scoreline-Aktion war. Ziel war, unsichere Advance-Schritte nicht durch TacticalPlan-Mapping zu erzwingen.

Seed-Vergleich mit `latest-match-baseline-023`, `maxActions=480`, Match `match_32b46ac7268c2c75`:

| Stand | Ergebnis | Aktionen | Runner-AP | Corp-AP | Runner-Steals | Corp-Scores |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| durable Access-Stop only | Runner gewinnt | 145 | 8 | 0 | 5 | 0 |
| Scoreline-Plan-Yield-Kandidat | Runner gewinnt | 97 | 7 | 0 | 4 | 0 |

Beobachtung:

- Der Kandidat korrigierte zwar die frühe Plan-Mapping-Übersteuerung bei Action 16, wo `advance_card` mit negativem Score gegen `gain_credit` verlor.
- Danach wurden aber weitere unsichere Advance-Schritte derselben Remote-Linie gewählt.
- Das Spiel kippte sogar schneller an den Runner, weil die eigentliche Ursache nicht das generische Mapping-Yield ist, sondern die vorherige Scoreline-/Remote-Safety-Bewertung und die Wahl nicht belastbarer Remote-Protection.

Entscheidung:

- Kein globaler Yield im TacticalPlan-Mapping.
- Nächster Ansatz muss am konkreten Remote-/Scoreline-Safety-Pfad ansetzen, insbesondere an Agenda-Install in schwache Remotes und ICE-Placement, das Trace-/Punish-ICE ohne Access-Stop als Scoring-Schutz überschätzt.
