# V1.7.2 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/requirements.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/spec.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/test-matrix.md`
- `docs/releases/v1/v1-7-2-mechanikpaket-f/release-assignment-preflight.md`
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
