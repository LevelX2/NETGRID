# V1.8.0 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_7_1_TO_V1_8_1_DETAILED_PLAN.md`
- `docs/derived/V1_8_0_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_G_1_8_0_SPEC.md`
- `docs/derived/V1_8_0_TEST_MATRIX.md`
- `docs/derived/V1_8_0_RELEASE_ASSIGNMENT_PREFLIGHT.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_8_0_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_7_2: true`

Der 13-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 6-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt Agenda-Difficulty, scored-agenda-Statik und overadvance-basierte Zusatzpunkte konfliktfrei ab und hält die Counter-/Virus-/Purge-Folgeplanung für V1.8.1 sauber getrennt.

## Geklärte Entscheidungen

- Agenda-Difficulty wird zentral berechnet und in Legality- sowie Score-Prüfung identisch angewendet.
- `Corporate Ally` und `Databroker` nutzen einen expliziten Agenda-Punkt-Kostenpfad über Forfeit nach `removed_from_game`.
- `Desperate Competitor` und `Hot Tip for WNS` werden turn-lokal an passende Agenda-Subtype-Liberation gebunden.
- `Project Babylon` vergibt zusätzliche Agenda-Punkte nur beim Scoren (nicht beim Stehlen) deterministisch.
- Die sieben Counter-gekoppelten Karten (`Fait Accompli`, `Falsified-Transactions Expert`, `Management Shake-Up`, `Project Consultants`, `Silver Lining Recovery Protocol`, `Systematic Layoffs`, `Team Restructuring`) bleiben deferred.
- AI-Support bleibt unverändert.

## Gate

V1.8.0 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.

