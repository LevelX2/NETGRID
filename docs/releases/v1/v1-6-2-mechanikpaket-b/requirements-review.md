# V1.6.2 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/releases/v1/v1-6-1-mechanikpaket-a/plan-to-v1-7-0.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/requirements.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/spec.md`
- `docs/releases/v1/v1-6-2-mechanikpaket-b/test-matrix.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_6_2_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_6_1: true`

Der 50-Karten-Planungskorb wurde vor Umsetzung in einen freigabefähigen 5-Karten-Kern plus deferred Rest aufgeteilt. Der Kern deckt die Modifier-/Persistenz-Bausteine konfliktfrei zu V1.6.3+ ab.

## Geklärte Entscheidungen

- Rez-Kosten- und Stärke-Modifier laufen über deterministische Engine-Helfer.
- Priority Requisition wird deterministisch auf ein Ziel-ICE angewandt.
- Deferred-Karten bleiben bis zu ihren Mechanikpaketen gesperrt.
- AI-Support bleibt unverändert.

## Gate

V1.6.2 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.
