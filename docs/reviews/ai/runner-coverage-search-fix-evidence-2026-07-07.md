# Runner Coverage Search Fix Evidence 2026-07-07

SQLite-Pfad: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

Analysemodus: read-only über `node:sqlite` und gespeicherte `ai_decision_traces`, Events, Snapshots und finalen State. Es wurden keine Runtime-Daten verändert und kein Server gestartet.

## Matches

### `match_e05dbb4eadd9a5f4`

- Modus: `human_corp_vs_runner_ai`
- Ende: 2026-07-07T18:55:00.787Z
- Ergebnis: Corp-Sieg durch Agenda-Punkte
- Umfang: 248 Events, 248 Snapshots, 135 AI-Traces
- Runner ScoreArea: `Corporate Retreat`, `Project Zurich`
- End-Rig: `Cyfermaster`, `Dwarf`, `Raptor`, `Loony Goon`, `Tycho Mem Chip`, `The Short Circuit`

Wichtige Beobachtungen:

- StateVersion 17: erster Zugriff auf `Setup!`; `trash_accessed_card` war besser bewertet als `decline_trash`, wurde aber nicht gewählt. Folge: Net Damage traf unter anderem `Broker` und `R&D Interface`.
- StateVersion 33: `start_run` auf R&D hatte Score `2603` mit `payoff:agenda`; gewählt wurde `draw_card` unter `runner.obtain_breaker_coverage` mit Score `1328`.
- StateVersion 74 bis 155: wiederholte `The Short Circuit`-Suchen erzeugten eine Suchschleife mit mehrfachen Rollen-/Kartenduplikaten.
- Danach wurden viele gesuchte oder hochwertige Karten abgeworfen, darunter `Codecracker`, `Force Shield` x2, `Cloak` x3, `Clown`, `SeeYa`, `Vewy Vewy Quiet` x2.
- Remote-Contest kam spät, während die Corp mehrere Agenda-Scores vorbereiten konnte.

### `match_13f99872809e6a66`

- Modus: `human_corp_vs_runner_ai`
- Ende: 2026-07-07T18:42:37.876Z
- Ergebnis: Corp-Sieg durch Agenda-Punkte
- Umfang: 125 Events, 125 Snapshots, 68 AI-Traces
- Runner ScoreArea: `Project Venice`
- End-Rig: `Pile Driver`, `Codecracker`, `Loony Goon`

Wichtige Beobachtungen:

- StateVersion 16: erster Zugriff auf `Setup!`; gleiche falsche Nicht-Trash-Entscheidung wie im späteren Spiel.
- StateVersion 41 und 42: bekannte HQ-Agenda-Chance mit Score `2703` wurde von Coverage-Setup verdrängt.
- Corp scorete danach `Corporate Retreat`, später `Project Zurich` und `Marine Arcology`.
- Interfaces blieben in der Hand, während der Runner das Tempo verlor.

## Fehlergruppen

### Bereits behoben: Access-Trash gegen Ambush

Der erste `Setup!`-Trash-Fehler ist auf aktuellem `main` bereits behoben. Dieser Prozess implementiert dafür keine zweite Codeänderung.

### Umzusetzen: Coverage-Plan blockiert Agenda-Chancen

`runner.obtain_breaker_coverage` behandelt starke direkte Runs als Plan-Mismatch, obwohl die Scoring-Evidence `payoff:agenda`, bekannte HQ-Agenda oder `recommendation:run_now` enthält.

Erwartung: Akute Agenda-/Score-Threat-Chancen dürfen Coverage-Aufbau übersteuern.

### Umzusetzen: Coverage-Search-Schleife

Der Runner sucht weiter nach Programmen, obwohl bereits passende oder frisch gefundene Antworten in der Hand liegen und das Handlimit weitere Suche unproduktiv macht.

Erwartung: Search muss stoppen oder stark verlieren, sobald eine vorhandene Handantwort installiert oder finanziert werden sollte.

### Umzusetzen: Fehlender Install-/Funding-Pivot

Frisch gesuchte Programme werden nicht verbindlich in ein nächstes Install-/Funding-Ziel übersetzt.

Erwartung: Nach Sucherfolg priorisiert der Plan Installation oder Credits für genau diese Antwort vor weiterer Suche.

### Umzusetzen: Remote-Score-Threat und Low-Payoff-Runs

Remote-Contest wird teils ohne Strategieanker blockiert; Archives/simple Runs ohne konkreten Payoff sind zu leicht verfügbar.

Erwartung: fortgeschrittene Remotes erzeugen kurzfristig Contest-Druck; Low-Payoff-Runs verlieren gegen konkrete Agenda-, Setup- oder Funding-Ziele.

## Nicht aus diesen Spielen freigegeben

Ein Broker-spezifischer Plan bleibt außerhalb dieses Prozesses. In `match_e05dbb4eadd9a5f4` ging `Broker` durch Net Damage verloren, in `match_13f99872809e6a66` blieb er im Stack.

## Umgesetzte Gegenmaßnahmen

- `packages/ai/src/plans/tactical-plan-coverage-search-fit.ts` blockiert wiederholte Coverage-Programmsuche, wenn ein sichtbares Programm aus einer vorherigen Suche in der Hand auf Installation oder Funding wartet.
- Derselbe Fit-Pfad blockiert rig-basierte Programmsuche bei erreichtem Handlimit, damit Suchergebnisse nicht direkt in die Discard-Phase laufen.
- `packages/ai/src/runtime/semantic-choice-ranking.ts` lässt bekannte HQ-Agenda- und frische R&D-Payoff-Runs Coverage-Setup übersteuern, sofern der Run in der semantischen Bewertung deutlich besser ist.
- `packages/ai/src/plans/tactical-plan-goal-evidence.ts` akzeptiert neutrale und RunTarget-basierte Remote-Contest-Goals als Score-Threat-Anker.

## Regressionen

- `packages/ai/src/plans/tactical-plan-coverage-search-fit.test.ts`: Fit-Rejection für wiederholte Programmsuche und Handlimit.
- `packages/ai/src/tactical-plans.test.ts`: Mapping blockiert erneute `The Short Circuit`-Suche; neutrale Remote-Score-Threat-Goals boosten Remote-Contest.
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`: Nach sichtbarem Suchtreffer wählt die Runner-Runtime Funding statt erneuter Suche.
- `packages/ai/src/runtime/semantic-choice-ranking.test.ts`: bekannte HQ-Agenda und frischer R&D-Payoff übersteuern Coverage-Setup; echte Coverage-Antworten bleiben geschützt.
