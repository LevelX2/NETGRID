# AI-Historienrollup bis AI212

## Zweck

Dieses Rollup ersetzt die nicht mehr current-state-relevanten Einzelreports und
Roh-JSON-Ausgaben der abgeschlossenen AI020-bis-AI046- sowie
AI123-/AI131-bis-AI212-Prozessketten. Die Einzelartefakte beschrieben
Zwischeninventare, Dry-Runs, Shadow-Kandidaten, Scorecard-Versionen und
No-Go-/Handoff-Stände. Sie sind weder aktive Runtimequelle noch aktuelles Gate.

## Verdichteter Erkenntniswert

- AI020 bis AI030 normalisierten Karten-Hints und Taktiksignale nach Side und
  Kartenfamilie.
- AI031 bis AI046 bauten die read-only Action-Semantics-Brücke aus vorhandenen
  LegalActions, Source-/Target-/Cost-/Timing-Projektionen und diagnostischer
  Doctrine-/Goal-Zuordnung auf.
- AI123 und AI131 bis AI177 untersuchten Action-Limits, Progress-Muster,
  Same-State-Alternativen, Endwindow-Lookahead und Opportunity-Solver.
- AI182 bis AI200 präzisierten Target Identity, Candidate Binding und
  testseitige PlayerAction-/Replay-Probes.
- AI201 bis AI212 ergänzten LegalAction Witness und TargetRef; der damalige
  Micro-Cutover blieb mangels belastbarer Action-ID-/Witness-Bindung gesperrt.

## Aktueller Endzustand

Die damaligen Zwischen- und Shadow-Verträge sind durch die produktive Semantic
Runtime und den AI Current-State-Cleanup vom 2026-07-09 ersetzt:

- `@netgrid/ai` exportiert nur aktuelle Live-Verträge;
- Simulation liegt hinter `@netgrid/ai/simulation`;
- alte Planer, Baselines, Shadow-/META-Code und deren Runtime-Notaus sind
  entfernt;
- die KI wählt ausschließlich vorhandene LegalActions;
- der Semantic-Coverage-Restpfad arbeitet fail-closed;
- aktive Hints, Derived Facts, Action-Signal-Katalog und aktuelle Strategy-
  Benchmarks sind die führenden Gates.

Führende Evidence:

- `docs/reviews/ai/ai-current-state-cleanup-final-review-2026-07-09.md`
- `docs/architecture/ai/README.md`
- `docs/architecture/ai/ai-current-state-cleanup-process-2026-07-09.md`

## Retention-Entscheidung

Die ersetzten nummerierten Generator-/Check-/Apply-Scripts und ihre
Einzelreports werden gelöscht. Git-Historie bleibt für forensische Rückfragen
ausreichend. Neue AI-Reports werden nur versioniert, wenn sie ein aktuelles
Gate, eine reproduzierbare Regression, eine Architekturentscheidung oder eine
konkrete Removal Condition tragen. Umfangreiche rohe Läufe gehören nach
`data/local/` und erhalten höchstens ein kleines versioniertes Summary.
