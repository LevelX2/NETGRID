# V1.8.1 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-7-1-mechanikpaket-e/plan-to-v1-8-1.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/requirements.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/spec.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/test-matrix.md`
- `docs/releases/v1/v1-8-1-mechanikpaket-h/release-assignment-preflight.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_8_1_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_8_0: true`

Der 15-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 12-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt Counter-/Virus-/Purge-Verträge und rungebundene Folgeflags konfliktfrei ab und hält Würfelabhängigkeiten sowie offene Resolverhinweise strikt aus dem Scope.

## Geklärte Entscheidungen

- `Cockroach` und `Incubator` bleiben wegen deterministischer Würfelabhängigkeit bis V1.9.0 deferred.
- `Grubb` bleibt wegen offenem remainder-of-run-Breaker-Lifecycle und Scope-Schutz in V1.8.1 deferred.
- `Pox` und `Restrictive Net Zoning` bündeln servergebundene ICE-Install-Taxpfade in einer gemeinsamen deterministischen Kostenlogik.
- `Purge` entfernt Virus-Counter sowohl von Karten als auch aus servergebundenen Virusstrukturen (Pox).
- `Corporate Coup`/`Political Coup` nutzen score-area-basierte Counteraktionen ausschließlich über LegalActions und Revalidierung.
- `Inside Job` bleibt auf einen deterministischen First-ICE-Bypass im Run begrenzt.
- AI-Support bleibt unverändert.

## Gate

V1.8.1 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.