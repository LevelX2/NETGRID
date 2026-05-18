# AI-Architektur

`docs/architecture/ai/` bündelt releaseübergreifende KI-Zielbilder, Schnittstellenregeln und side-sichere Architekturgrenzen. Diese Artefakte geben keine Karten frei und ändern keine Engine-Regeln; sie beschreiben, welche Informationen KI-Pfade nutzen dürfen und wie AI-Hints, Coaching, Simulation und Controller an LegalActions, PlayerViews und Redaction gebunden bleiben.

## Enthaltene Artefakte

- `ai-controller-spec.md`: Controller-Schnitt für KI-Entscheidungen.
- `ai-simulation-test-matrix.md`: übergreifende Testmatrix für KI-Simulation.
- `ai-hints-structure-decision-2026-05-15.md`: Strukturentscheidung für aktive AI-Hints.
- `coaching-boundary-spec-2026-05-17.md`: side-sichere Grenze für AI-Coaching und Hinweise.

## Regel

Konkrete Benchmarks, Regressionen und Diagnoseberichte liegen unter `docs/reviews/ai/`. Abgeschlossene Doctrine- und Deck-Legal-Approval-Spuren liegen unter `docs/releases/ai/`.
