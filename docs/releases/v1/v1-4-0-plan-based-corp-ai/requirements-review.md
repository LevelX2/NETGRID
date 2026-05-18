# V1.4.0 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-4-0-plan-based-corp-ai/plan.md`
- `docs/releases/v1/v1-4-0-plan-based-corp-ai/requirements.md`
- `docs/releases/v1/v1-4-0-plan-based-corp-ai/spec.md`
- `docs/releases/v1/v1-4-0-plan-based-corp-ai/test-matrix.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- `docs/releases/v1/v1-3-1-card-data-pipeline-v2/spec.md`
- bestehende `packages/ai`-Heuristiken, AI-Profile und Rollenmanifeste

## Ergebnis

`V1_4_0_requirements_freeze_done: true`

`ready_for_implementation_after_V1_3_1: true`

V1.4.0 ist ausreichend geplant, um nach V1.3.1 umgesetzt zu werden. Die Planung baut auf der Card Data Pipeline und AI-Hints auf, erweitert aber keine Karten, Mechaniken oder Informationsrechte.

## Geklärte Entscheidungen

- Corp-Pläne sind Bewertungsstrukturen über LegalActions.
- `applyAction` bleibt alleinige Regelvalidierung.
- Difficulty-Profile ändern Risikobereitschaft und Bewertungsbreite, nicht Sichtbarkeit.
- DecisionDebug ist side-sicher und nennt keine verdeckten Gegnerdaten.
- Runner-Plan-KI bleibt V1.4.1.

## Stärken

- Der Release hat klare Szenariometriken statt vager KI-Verbesserung.
- Hidden-Info- und LegalAction-Gates sind im Kernmodell verankert.
- Fallback und Zeitbudget verhindern KI-Hänger.
- Planrollen greifen die V1.3.1-Hints wiederverwendbar auf.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Planbewertung driftet in versteckte Gegnerannahmen. | Sehr hoch | Input-Invariance- und Debug-Redaction-Tests. |
| Pläne werden zu komplex und instabil. | Mittel | Kleine Planarten, deterministic scoring, Fallback. |
| Benchmarks sind zu leicht manipulierbar. | Mittel | Holdout-Seeds und Baseline-Vergleich dokumentieren. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Exakte Score-Gewichte und Schwellen werden in versionierten Profilen umgesetzt.
- Ein Plan darf in frühen Profilen bewusst konservativ sein, solange Szenario- und Regressionstore erfüllt sind.

## Gate

V1.4.0 ist nach V1.3.1 bereit für Umsetzung.
