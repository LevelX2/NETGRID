# V1.4.1 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_4_1_PLAN_BASED_RUNNER_AI_DETAILED_PLAN.md`
- `docs/derived/V1_4_1_REQUIREMENTS.md`
- `docs/derived/PLAN_BASED_RUNNER_AI_1_4_1_SPEC.md`
- `docs/derived/V1_4_1_TEST_MATRIX.md`
- `docs/derived/PLAN_BASED_CORP_AI_1_4_0_SPEC.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`
- bestehende Runner-KI-, Run-, Breach-, Access- und Pacing-Artefakte

## Ergebnis

`V1_4_1_requirements_freeze_done: true`

`ready_for_implementation_after_V1_4_0: true`

V1.4.1 ist ausreichend geplant, um nach V1.4.0 umgesetzt zu werden. Die Planung hält Runner-Planung strikt an sichtbare Projektionen, LegalActions und AI-Hints gebunden.

## Geklärte Entscheidungen

- Runner-Pläne bewerten Unsicherheit, nicht echte verdeckte Korpdaten.
- Verdeckte HQ-/R&D-/Remote-Titel bleiben unbekannt.
- Corp-Rezfenster und KI-Pacing sind Pflichtregression.
- V1.4.0-Corp-Plan-KI bleibt Baseline und darf nicht regressieren.
- Belief State und Simulation bleiben V1.4.2/V1.4.3.

## Stärken

- Die Planung hat klare Negativfixtures gegen sinnlose Runs.
- Hidden-State-Invariance ist explizites Gate.
- Runner-Plan-Debug trennt sichtbare Gründe von Unsicherheit.
- KI-vs-KI mit planbasierter Corp wird als Regression genutzt.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Runner-KI errät versteckte Corpkarten. | Sehr hoch | Invariance-Tests und Debug-Redaction. |
| Runner-KI macht zu riskante Runs. | Hoch | RunCostEstimator und Negativfixtures. |
| Pacing hängt an Corp-Rezfenstern. | Hoch | Human-Corp-vs-Runner-KI-Smoke. |
| Runner-Planer destabilisiert Corp-Planer. | Mittel | V1.4.0-Regressionssuite bleibt Pflicht. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Run-Risikoschwellen können in V1.4.1 konservativ starten.
- `safe_probe_run` darf als vorsichtiger Informationsplan starten und später durch Belief State verbessert werden.

## Gate

V1.4.1 ist nach V1.4.0 bereit für Umsetzung.
