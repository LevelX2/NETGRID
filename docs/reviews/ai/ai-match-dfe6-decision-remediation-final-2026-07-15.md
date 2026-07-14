# Match DFE6: Decision-Remediation Final Review

## Ergebnis

Die drei freigegebenen Findings aus `match_dfe6223d817c646d` sind auf dem
aktuellen KI-Stand generisch geschlossen. Sechs Match-Zustände wurden mit
`warmup-policy=strict` ohne eine einzige Abweichung der 27 bis 93 jeweils
vorgelagerten Entscheidungen rekonstruiert.

Vor den Produktionsänderungen waren fünf Zielverträge rot und drei
Gegenproben grün. Nach den Änderungen sind alle acht Verträge unverändert grün.
Die Deckstrategien `runner.run_event_tempo` und `runner.rig_first` wurden weder
geändert noch überstimmt; korrigiert wurden nachgelagerte Bewertungen und die
Plan-Schritt-Abbildung.

## Spielgleiche Verträge

| Finding | Match-Zustand | Roter Ausgang | Finaler Vertrag |
| --- | --- | --- | --- |
| DFE6-F01 | Decisions 47, 72 und 94 | jeweils unbegründeter Archives-Run | Archives ohne Agenda-, Zufallsabwurf- oder Korp-Deckdruck nicht gegenüber sinnvollen Alternativen wählen |
| DFE6-F02 | Decision 53, StateVersion 94 | redundanter Fall Guy trotz Grip 1 und kritischem Schadensdruck | Draw als reale Handpuffer-Antwort; Tag-Vermeidung erfüllt keinen Schadensplan |
| DFE6-F03 | Decision 51, StateVersion 92 | richtige Continue-Aktion mit falscher `break_or_pump_available`-Strafe | Continue ohne diese Strafe, wenn Pump-und-Break insgesamt unbezahlbar ist |

Die Gegenproben sichern weiterhin:

- Archives bleibt bei auf sechs Karten reduziertem Korp-R&D attraktiv;
- der erste nützliche Fall Guy bleibt installierbar;
- mit 20 Credits beginnt die KI gegen Liche weiterhin die bezahlbare
  Pump-und-Break-Sequenz.

## Generische Korrekturen

1. `hiddenArchivesPressureContext` führt Runner-Matchpunkt weiterhin als
   Diagnoseinformation, qualifiziert damit aber allein keinen verdeckten
   Archives-Payoff mehr.
2. `find_survival_answer` unterscheidet den aktiven Schadensgrund von
   allgemeiner Survival-Semantik. Nur Draw und konkrete Damage-/Flatline-
   Prävention werden als Schadensantwort gemappt; der Plan selbst bleibt
   unangetastet.
3. Die Continue-Strafe prüft legale Break-/Pump-Aktionen über die bereits
   produktiv verwendete Encounter-Viabilitätsbewertung. Stärkeaufbau,
   notwendige Breaks, sichtbare Creditpools und der verbleibende Zugriffspfad
   werden damit aus derselben Quelle beurteilt.
4. Decision-Checkpoints können für die ausgewählte Aktion erforderliche oder
   verbotene Score-Komponentenschlüssel festlegen. Das schützt fachliche
   Begründungen, ohne fragile Scorezahlen einzufrieren.

Es gibt keine Match-ID-, Kartenname-, Liche-, Krash- oder Fall-Guy-Sonderregel
in der Produktionslogik. LegalActions, Engine-Autorität, PlayerView-Grenzen,
Replay und StateHash bleiben unverändert.

## Verifikation

```text
Roter Ausgang: 5 behavior_regression-Fehler, 3 Gegenproben grün
Finale Match-Verträge: 8/8 grün
Fokussierter Gesamt-Verify: 7 Dateien, 127/127 Tests grün
@netgrid/ai Typecheck: grün
git diff --check: grün
```

Der fokussierte Lauf umfasst Checkpoint-Runner, DFE6-Match-Verträge,
Archives-Score, Plan-Schritt-Matching, Continue-Strafe, RunnerRunPlan und die
vollständige Semantic-Runtime-Cutover-Suite. Entsprechend der Nutzervorgabe
wurden keine Benchmarks, Behavior-Baselines, Selfplays oder zusätzlichen
Simulationsspiele ausgeführt.

## Abschlussbewertung

Die Testzone prüft nun nicht nur die gewählte Aktion, sondern im Liche-Fall
auch den fachlich relevanten Teil ihrer internen Entscheidungskette. Ein
späterer Umbau der Plan- oder Scorearchitektur darf die Implementierung
verändern, muss aber weiterhin dieselben stabilen Verhaltens- und
Begründungsverträge erfüllen oder eine explizite Fixture-Migration vornehmen.
