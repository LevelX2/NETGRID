# Rejected: Remote-Protection-Hard-Mismatch

Kandidat: Bei `protect_score_remote` mit hoher Severity sollte ein ICE-Install auf dieselbe Remote, der keinen echten Access-Stop liefert, nicht nur normaler Triage-Mismatch sein, sondern einen Hard-Mismatch von `-4200` bekommen.

Seed-Vergleich mit `latest-match-baseline-023`, `maxActions=480`, Match `match_32b46ac7268c2c75`:

- Akzeptierte Baseline `durable-access-stop-only`: Runner gewinnt 8:0 nach 145 Aktionen.
- Normaler Remote-Protection-Mismatch: Runner gewinnt 8:0 nach 145 Aktionen; Hunter wird nicht mehr als Alignment-Schutz gewertet, bleibt aber wegen Plan-/Install-Boni ausgewählt.
- Hard-Mismatch-Variante: Runner gewinnt 8:0 nach 112 Aktionen.

Grund der Verwerfung: Der Hard-Mismatch entfernt Hunter als bevorzugten Schutz, drückt die Auswahl aber in noch schlechteres unsicheres Advancen bzw. Economy-/Scoreline-Stottern. Damit wird das konkrete Fehlmuster nicht gelöst, sondern beschleunigt.

Nicht übernommen. Der akzeptierte Schnitt bleibt enger: bekannte non-stopping ICE zählen nicht mehr als `corp_board_triage_alignment` für `protect_score_remote`; eine zusätzliche harte Sonderstrafe wird nicht gesetzt.
