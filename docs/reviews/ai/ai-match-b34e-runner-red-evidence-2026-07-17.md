# AI-Match-B34E – Red Evidence

Status: bestätigt auf unverändertem produktivem KI-Code vor den Fixes

## Capture-Vertrag

Die zehn historischen Fixtures stammen read-only aus
`match_b34e724e4cfc0362`. Wegen des nachgewiesenen Watch-Server-Neustarts
unmittelbar vor D43 beginnt der Strict-Warmup für alle späteren Fixtures bei
D43. Jeder Capture meldete:

- `warmupPolicy: strict`
- `warmupDriftCount: 0`
- vollständigen kompatiblen Warmup-Suffix
- vorhandene taktische Pläne, Plan-Portfolio und strategische Intention;
  `runnerRunPlan` ist genau in den historischen Runsituationen vorhanden
- side-gefiltertes Eventpräfix und unveränderten StateHash

`rebase` wurde nicht verwendet. Der vorherige Warmup über die tatsächliche
Prozessgrenze wurde als Infrastrukturfehler verworfen und nicht als
Verhaltensbeleg genutzt.

## Bestätigte rote Checkpoints

Alle folgenden Fehler liefern ausschließlich `behavior_regression`; es gab
keinen `engine_legality_drift`, `runtime_state_drift`,
`fixture_migration_required`, Redaction- oder Fixture-Fehler:

1. D69: `Library Search` trägt weiterhin
   `runner_goal_fit_coverage_search`.
2. D106: eine `Tutor`-Fortsetzung trägt weiterhin
   `runner_goal_fit_tactical_goal_setup`.
3. D91: Overflow-Draw verdrängt den offenen HQ-Closeout.
4. D92: `Elena Laskova` verdrängt den offenen HQ-Closeout.
5. D94: `Little Black Box` verdrängt den offenen HQ-Closeout.
6. D97: Overflow-Draw verdrängt `Finders Keepers` oder den HQ-Run.
7. D101: Setup-Draw verdrängt HQ-/Multiaccess-Closeoutdruck.
8. D102: `Networking` verdrängt HQ-/Multiaccess-Closeoutdruck.
9. D54: die KI pumpt `Rent-I-Con`, obwohl `continue_run` ohne die
   marginalen Viral-15-Kosten akzeptabel ist.

Zusätzlich sind zwei enge Consumer-Zieltests rot:

- ein Quellkartentitel mit `Search` erzeugt fälschlich Suchsemantik;
- eine Corp-Encounter-Fortsetzung mit strukturierter Suchrolle wird
  fälschlich als Runner-Antwort projiziert.

## Grüne Gegenproben vor den Fixes

Folgende Kontrollen sind bereits grün und müssen nach den Fixes grün bleiben:

- D104: Draw vor dem dringenden Remote-Contest bleibt zulässig;
- Match 9FEF D92: eine echte Jack-out-Sicherheitsentscheidung bleibt zulässig;
- synthetische Viral-15-Begleitprobe: ein zusätzlich installiertes wertvolles
  Programm führt weiterhin zum notwendigen Pump-Schritt;
- strukturierte Runner-Suchrolle bleibt `search`;
- strukturierte Draw-Mechanik bleibt `draw`;
- echter Suchregeltext bleibt `search`;
- Substring-Rauschen wie `research`, `withdraw` oder `tutorish` bleibt ohne
  Such-/Draw-Rolle.

## Ausgeführter Red-Lauf

```text
vitest match-b34e-runner-decision-checkpoints.test.ts
  9 behavior_regression rot
  3 Gegenproben grün

vitest runner-source-card-answer-role.test.ts
  2 Zieltests rot
  2 bestehende Kontrollen grün
```

Damit sind alle drei freigegebenen Fehlergruppen als aktuelle, produktiv
reproduzierbare KI-Verhaltensregressionen bestätigt. Produktive Fixes dürfen
nun beginnen; die Expectations werden nicht verändert.
