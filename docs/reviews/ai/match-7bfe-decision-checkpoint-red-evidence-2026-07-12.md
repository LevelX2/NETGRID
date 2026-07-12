# Match 7BFE: Decision-Checkpoint Red Evidence

## Stand

Red-Gate vor jeder Verhaltenskorrektur bestanden. Ausgeführt auf Branch
`codex/ai-decision-checkpoint-testzone` nach Infrastruktur-Commit
`d06a07575` und vor Änderungen an KI-Scores, Planern, Discard oder
Endgame-Risiko.

## Fixture-Herkunft

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`,
  read-only geöffnet
- Match: `match_7bfe82501d0fdcb8`
- Actor: Corp, Difficulty `hard`
- Promoted Fixtures:
  `data/scenarios/ai-decision-checkpoints/cp-7bfe-01.json` bis
  `cp-7bfe-05.json`
- Runtime-Warmup: je nach Checkpoint 8 bis 127 historische KI-Entscheidungen
- Runtime-Restore: TacticalPlan, PlanPortfolio und StrategicIntent in allen
  sechs Zielzuständen vorhanden
- Future-Event-Gate: Event-Prefix endet jeweils an der Ziel-StateVersion
- Redaction-Gate: keine Session-, Reconnect-, Join-, Token-, PrivatePayload-
  oder FullGameState-Felder auf der Fixture-Oberfläche

## Befehl

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/match-7bfe-decision-checkpoints.test.ts \
  --maxWorkers=1 --testTimeout=30000
```

## Erwartete rote Zieltests

| Checkpoint | Aktuelle Auswahl | Verletzter Vertrag |
| --- | --- | --- |
| `CP-7BFE-01` | BBS Whispering Campaign aktivieren | bezahlbares R&D-ICE muss Central-Schutz vor weiterem finite-economy drain erhalten |
| `CP-7BFE-02a` | Corporate War mit 5 Credits installieren | nicht vollständig finanzierbarer Same-Turn-Pfad darf nicht begonnen werden |
| `CP-7BFE-02b` | Systematic Layoffs mit 5 Credits spielen | nach Operationskosten fehlt der Credit für den letzten Advance |
| `CP-7BFE-03` | historischer Corp-Discard | BBS und City Surveillance gehen verloren, I Got a Rock bleibt trotz unerfüllter Voraussetzung |
| `CP-7BFE-04` | Closed Accounts gegen 0 Credits | Operation besitzt keinen marginalen Effekt |
| `CP-7BFE-05` | Karte ziehen | Agenda-Suche ignoriert Matchpunkt, HQ-Reachability und bekannte Multiaccess-Evidence |

Alle sechs Fehler wurden vom Runner als `behavior_regression` klassifiziert.
Es gab keinen `engine_legality_drift`, `runtime_state_drift`,
`fixture_migration_required`, `fixture_redaction_violation` oder
`fixture_invalid`.

## Gleichzeitig grüne Gegenproben

1. Derselbe Corporate-War-Zustand mit 6 statt 5 Credits beginnt weiterhin
   einen legalen Corporate-War-Closeout.
2. Closed Accounts bleibt gegen einen getaggten Runner mit 3 Credits die
   gewählte Payoff-Aktion.
3. I Got a Rock bleibt im Discard-Zustand erhalten, wenn Corp-Agendapunkte
   und zwei Runner-Tags seine sichtbaren Voraussetzungen erfüllen.

Ergebnis des kontrollierten Laufs: 9 Tests, davon exakt 6 erwartete rote
Zieltests und 3 grüne Gegenproben.

## Freigabe für die nächste Phase

Die Korrekturphase darf beginnen, sobald der checkpoint-basierte Audit des
älteren Serienspiels abgeschlossen ist. Ein Fix gilt nur dann als erfolgreich,
wenn die roten Zieltests grün werden und die Gegenproben grün bleiben.

