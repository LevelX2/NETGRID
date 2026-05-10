# V1.7.1 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_7_1_TO_V1_8_1_DETAILED_PLAN.md`
- `docs/derived/V1_7_1_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_E_1_7_1_SPEC.md`
- `docs/derived/V1_7_1_TEST_MATRIX.md`
- `docs/derived/V1_7_1_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_7_1_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_7_0: true`

Der 48-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 5-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt Hidden-Zone-Search, Run/Access-Replacement und HQ-Multiaccess konfliktfrei ab und hält die Folgeplanung für V1.7.2+ sauber getrennt.

## Geklärte Entscheidungen

- Hidden-Zone-Search wird im Kernrelease legal-action-basiert und replaybar umgesetzt.
- HQ-Run-Events mit Access-Replacement laufen deterministisch und side-sicher.
- HQ-Multiaccess wird als installierte Hardware-Static auf HQ begrenzt.
- `Dupré` und `Data Naga` bleiben in V1.7.1 deferred (`geprüft` + Folgeabhängigkeit).
- AI-Support bleibt unverändert.

## Gate

V1.7.1 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.
