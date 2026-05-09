# V1.7.0 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_6_1_TO_V1_7_0_DETAILED_PLAN.md`
- `docs/derived/V1_7_0_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_D_1_7_0_SPEC.md`
- `docs/derived/V1_7_0_TEST_MATRIX.md`
- `docs/derived/V1_7_0_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_7_0_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_6_3: true`

Der 36-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 5-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt Unique-/Hosting-/Recurring-/Subtype-Pfade konfliktfrei ab und hält die Folgeplanung für V1.7.1+ sauber getrennt.

## Geklärte Entscheidungen

- Unique-Constraint ist im Kernrelease aktiv (Deckvalidierung + Runtime-Installblock).
- Daemon-Hosting wird als deterministischer Install-/Trash-Lifecycle mit Kaskadenbereinigung abgesichert.
- Recurring-/Start-of-turn-Reihenfolge wird explizit deterministisch getestet.
- Stealth/Noisy-Interaktion ist explizit geregelt und regressionsabgedeckt.
- AI-Support bleibt unverändert.

## Gate

V1.7.0 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.
