# V1.7.0 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-6-1-mechanikpaket-a/plan-to-v1-7-0.md`
- `docs/releases/v1/v1-7-0-mechanikpaket-d/requirements.md`
- `docs/releases/v1/v1-7-0-mechanikpaket-d/spec.md`
- `docs/releases/v1/v1-7-0-mechanikpaket-d/test-matrix.md`
- `docs/releases/v1/v1-7-0-mechanikpaket-d/release-assignment-preflight.md`
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
