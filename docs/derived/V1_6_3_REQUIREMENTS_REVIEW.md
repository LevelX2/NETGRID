# V1.6.3 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_6_1_TO_V1_7_0_DETAILED_PLAN.md`
- `docs/derived/V1_6_3_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_C_1_6_3_SPEC.md`
- `docs/derived/V1_6_3_TEST_MATRIX.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_6_3_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_6_2: true`

Der 23-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 5-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt uninstall-/upgrade-/region-Lifecycle-Pfade konfliktfrei zur V1.7.0-Folgeplanung ab.

## Geklärte Entscheidungen

- `trash program` wird deterministisch ohne gegnerische Hidden-Info-Expansion aufgelöst.
- Upgrade-Servermodifikatoren laufen servergebunden und replay-stabil.
- Region-Installlifecycle wird im Kernpfad engine-seitig abgesichert.
- ChoiceFlow bleibt im Kernrelease nachvollziehbar deferred dokumentiert.
- AI-Support bleibt unverändert.

## Gate

V1.6.3 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.
