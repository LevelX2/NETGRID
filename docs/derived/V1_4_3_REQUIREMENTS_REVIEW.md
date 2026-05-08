# V1.4.3 Requirements Review

Stand: 2026-05-08
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_4_3_SIMULATION_SELFPLAY_EXPLOIT_REGRESSION_DETAILED_PLAN.md`
- `docs/derived/V1_4_3_REQUIREMENTS.md`
- `docs/derived/SIMULATION_SELFPLAY_EXPLOIT_REGRESSION_1_4_3_SPEC.md`
- `docs/derived/V1_4_3_TEST_MATRIX.md`
- `docs/derived/V1_4_2_TO_V1_6_0_PLANNING_REVIEW.md`

## Ergebnis

`V1_4_3_requirements_freeze_done: true`

`ready_for_implementation_after_V1_4_2: true`

V1.4.3 ist sinnvoll als eigener Release nach V1.4.2. Die Planung ist nur dann umsetzbar, wenn V1.4.2 einen side-sicheren Belief State liefert.

## Geklärte Entscheidungen

- Simulation ist lokal und analytisch, nicht Produkt-Regelautorität.
- Simulation nutzt Hypothesen aus Belief State, nicht echten Hidden State.
- Benchmarking ist messend und regressionsorientiert.
- Kartenfreigaben bleiben ausgeschlossen.
- Public Replay und Spectator bleiben V1.4.3-No-Scope.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| Simulation mutiert echten Matchstate. | Sehr hoch | State-Isolation-Test. |
| Simulation nutzt echte verdeckte Karten. | Sehr hoch | Inputvertrag und Hidden-Info-Test. |
| Tuning overfittet auf wenige Seeds. | Hoch | Holdout-Seeds. |
| Soaks werden zu langsam. | Mittel | definierte Laufgrößen und Performancebudget. |

## Offene Punkte

Keine blockierenden offenen Punkte.

Nicht blockierend:

- Die konkrete Soak-Größe kann beim Implementation Review an reale Laufzeiten angepasst werden, solange sie dokumentiert bleibt.

## Gate

V1.4.3 ist nach V1.4.2 bereit für spätere Umsetzung.
