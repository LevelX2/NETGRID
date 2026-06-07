# AI-Architektur

`docs/architecture/ai/` bündelt releaseübergreifende KI-Zielbilder, Schnittstellenregeln und side-sichere Architekturgrenzen. Diese Artefakte geben keine Karten frei und ändern keine Engine-Regeln; sie beschreiben, welche Informationen KI-Pfade nutzen dürfen und wie AI-Hints, Coaching, Simulation und Controller an LegalActions, PlayerViews und Redaction gebunden bleiben.

## Enthaltene Artefakte

- `ai-controller-spec.md`: Controller-Schnitt für KI-Entscheidungen.
- `ai-decision-trace-contract-2026-05-22.md`: lokaler Vertrag für versionierte KI-Entscheidungslogs, Trace-Redaction, Meta/Drilldown, Export und Live-Follow.
- `ai-simulation-test-matrix.md`: übergreifende Testmatrix für KI-Simulation.
- `ai-hints-structure-decision-2026-05-15.md`: Strukturentscheidung für aktive AI-Hints.
- `coaching-boundary-spec-2026-05-17.md`: side-sichere Grenze für AI-Coaching und Hinweise.
- `ki-zielbild-metaebene-2026-06-01-v5.md`: Zielbild der künftigen semantischen KI-Kette von Kartensemantik über DeckDoctrine und taktische Zwischenziele bis zu semantisch verstandenen LegalActions.
- `ki-roadmap-neue-ki-spieler-2026-06-02-v1.md`: Roadmap für neue semantische KI-Spieler mit read-only Foundation, Action-Semantik-Brücke, Shadow Mode und bereichsweisem Cutover.
- `taktiksignale-strategieanker-guide-2026-06-02-v3.md`: Leitfaden für Taktiksignale, Strategieanker, Rollen, TargetProfiles, Conditions, Risiken und Constraints.
- `action-semantics-bridge-automation-process-2026-06-04.md`: sequenzieller AI034-bis-AI043-Prozess für die read-only Action-Semantik-Brücke mit Preflight, Szenario-Coverage, erweitertem Candidate-/Gate-Schema, eigenem Arbeits-Worktree, lokalen Merge-nach-`main`-Regeln und Handoff.
- `controlled-shadow-mode-automation-process-2026-06-04.md`: sequenzieller AI051-bis-AI060-Prozess für Controlled Shadow Mode nach AI050 mit Trace-Vertrag, Szenario-Korpus, Semantic-Shadow-Decision, Legacy-Vergleich, Deviation-Triage, Metriken, default-off Runtime-Harness, Batch-Report, Regression-Fixtures, Shadow-Readiness-Review, eigenem Umsetzungs-Worktree und lokalem Merge nach `main`; kein produktiver Cutover.
- `semantic-ai-core-meta-automation-process-2026-06-04.md`: Semantic AI Core META 1 bis META 6 für DeckStrategicProfile, DeckDoctrine, mehrzügige TacticalGoalState-Verfolgung, Semantic Decision Score, WhyNot, Cutover Safety Envelope, Agreement-only Canary, testinternen Scoped Override Pilot und Stabilisierung. Ergebnis: `limited_rollout_candidate_for_selected_scopes`, `fullProductionReady: false`, `legacyRemovalReady: false`, Legacy bleibt Fallback.
- `semantic-ai-production-readiness-automation-process-2026-06-04.md`: Semantic AI Production Readiness META 7 bis META 12 für Multi-Run Evaluation, Human-Review-Closure, Internal Canary, Production-Safe Shadow, limited scoped Cutover, Scope Expansion, Kalibrierung und Legacy-Freeze-Stabilisierung. Ergebnis: `limitedScopedProductionActive: true` für `basic_economy_draw`, `tag_removal`, `simple_score_advance` und `basic_install`; `legacy_freeze_for_selected_scopes_ready`; Full Production, Bulk-Aktivierung und Legacy Removal bleiben ausgeschlossen.
- `hq-hand-memory-contract-matrix-2026-06-07.md`: side-sicherer Vertrag für Runner-KI-HQ-Hand-Wissen mit Ereignismatrix, Kandidatengruppen, sicheren Restmengen, erlaubten Invalidierungen und Handoff an die HQ-Memory-Umsetzungspakete.

## Regel

Konkrete Benchmarks, Regressionen und Diagnoseberichte liegen unter `docs/reviews/ai/`. Abgeschlossene Doctrine- und Deck-Legal-Approval-Spuren liegen unter `docs/releases/ai/`.
