# V1.7.2 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_7_1_TO_V1_8_1_DETAILED_PLAN.md`
- `docs/derived/V1_7_2_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_F_1_7_2_SPEC.md`
- `docs/derived/V1_7_2_TEST_MATRIX.md`
- `docs/derived/V1_7_2_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_7_2_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_7_1: true`

Der 28-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 5-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt Trace/Tag/Resource/ActionEconomy konfliktfrei ab und hält die Folgeplanung für V1.8.0+ sauber getrennt.

## Geklärte Entscheidungen

- Trace aus Corp-Operationen wird als legal-action-only Trace-Fenster außerhalb des Run-Kontexts ergänzt.
- Last-Turn-Run-Attempt-Flags werden deterministisch und turn-boundary-sicher geführt.
- Tag-basierter deterministischer Resource-Trash aus Operationseffekt ist im Kernrelease enthalten.
- Runner-Resource-Aktionen für Tag-Remove und Economy/Draw werden als explizite LegalActions ergänzt.
- `Data Raven`, `Pocket Virtual Reality` und `TKO 2.0` bleiben deferred.
- Bereits früher freigegebene Karten (`Fetch 4.0.1`, `Trojan Horse`) werden nicht erneut als Runtime-Releasekarten geführt.
- AI-Support bleibt unverändert.

## Gate

V1.7.2 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.
