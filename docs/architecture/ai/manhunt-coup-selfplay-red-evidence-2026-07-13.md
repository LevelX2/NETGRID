# Manhunt-vs.-Coup-Selfplay: rote Decision-Checkpoint-Evidence

Stand: 2026-07-13, vor jeder Änderung am KI-Verhalten

Quelle ist das gespeicherte Match `match_606a546d0ba02826` mit den daraus eingefrorenen Deck-Snapshots. Die drei Selfplays wurden mit `current_candidate` auf beiden Seiten und Schwierigkeit `normal` deterministisch bis unmittelbar vor die jeweilige Entscheidung wiederholt. Der Capture-Haken kopiert `GameState` und side-safe `AiDecisionInput` defensiv; der Runtime-Checkpoint wird synchron vor dem Zielentscheid exportiert.

## Reproduzierte Fehler

| Checkpoint | Exakter Zustand | Aktuelles Verhalten | Verhaltensvertrag | Ergebnis |
| --- | --- | --- | --- | --- |
| `cp-manhunt-coup-selfplay-001-unsafe-agenda` | Seed 001, Index/StateVersion 137, Hash `fnv1a:7ddbd46e`, Corp mit 5 Credits und 2 Klicks | Installation von Corporate War in `remote_1` | Corporate War hier nicht installieren, weil weder sofortige Fertigstellung noch erzwungener Endspiel-Score nötig ist | `behavior_regression` |
| `cp-manhunt-coup-selfplay-003-low-value-archives` | Seed 003, Index/StateVersion 282, Hash `fnv1a:ce32cca2`, Runner mit letztem Klick; Archives enthält 15 bekannte Nicht-Agenden und genau eine unbekannte Karte | `runner.start_run.archives` | Archives ohne bekannte Beute, Abwurfindiz oder Corp-/Deckout-Druck nicht allein wegen einer unbekannten Karte anlaufen | `behavior_regression` |
| `cp-manhunt-coup-selfplay-005-deckout-closeout` | Seed 005, Index/StateVersion 429, Hash `fnv1a:cf355b94`, Corp bei 6 Punkten, 1 Karte in R&D, Corporate War in HQ, 3 Klicks und 2 Credits | `corp.gain_credit` | Corporate War jetzt installieren: Danach bleiben zwei Klicks zum Finanzieren; nach dem letzten Pflichtzug kann die Corp dreimal advancen und auf 9 Punkte scoren | `behavior_regression` |

Die gespeicherten Event-Präfixe umfassen 138, 283 und 430 side-safe Public Events. Alle drei Fixtures enthalten Tactical Plan, Plan Portfolio und Strategic Intent aus dem Moment vor der Entscheidung. Validierung und Ausführung melden weder `engine_legality_drift` noch `runtime_state_drift`, Fixture-Migration oder Redaktionsverletzung.

## Grüne Gegenproben auf unverändertem Code

1. Seed 001 mit vier Klicks und zwölf Credits akzeptiert die geschützte Corporate-War-Linie, die im selben Zug abgeschlossen werden kann.
2. Seed 003 mit einer offen sichtbaren Agenda in Archives wählt weiterhin den Archives-Run.
3. Seed 005 mit sechs zusätzlichen Karten in R&D behält die gewöhnliche Credit-Recovery; ohne akuten Deckout-Takt darf die neue Abschlusspriorität nicht greifen.

## Ausgeführter Rotlauf

```text
Test Files  1 failed (1)
Tests       3 failed | 3 passed (6)

001: behavior_regression | corp.install_card...corporate-war...remote_1
003: behavior_regression | runner.start_run.archives
005: behavior_regression | corp.gain_credit
```

Damit sind alle drei Änderungen als echte, spielgleiche Verhaltensregressionen freigegeben. Der nächste Commit nach dieser Evidence darf Verhaltenscode verändern; dieser Stand selbst enthält ausschließlich Capture-/Checkpoint-Infrastruktur, Fixtures, Tests und Dokumentation.
