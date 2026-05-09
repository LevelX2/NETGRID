# V1.6.1 Requirements Review

Stand: 2026-05-09  
Status: pass

## Review-Gegenstand

Geprüft wurden:

- `docs/derived/V1_6_1_TO_V1_7_0_DETAILED_PLAN.md`
- `docs/derived/V1_6_1_REQUIREMENTS.md`
- `docs/derived/MECHANIKPAKET_A_1_6_1_SPEC.md`
- `docs/derived/V1_6_1_TEST_MATRIX.md`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`

## Ergebnis

`V1_6_1_requirements_freeze_done: true`  
`ready_for_implementation_after_V1_6_0: true`

Die ursprüngliche 111-Kartenplanung wurde vor Umsetzung in einen freigabefähigen Kernkorb plus deferred Rest aufgeteilt. Der Kernkorb ist als 6-Karten-Slice mit vollständigem Gate testbar und konfliktfrei zu V1.6.2+.

## Geklärte Entscheidungen

- Runtime-Damage-Prevention wird in V1.6.1 erstmals über echte installierte Runner-Karten genutzt.
- Replacement bleibt in V1.6.1 regressionspflichtig, aber ohne neue Runtime-Replacement-Karte.
- Karten mit späteren Effektblockern bleiben deferred und werden nicht implizit freigegeben.
- AI-Support bleibt unverändert.

## Risiken

| Risiko | Bewertung | Behandlung |
| --- | --- | --- |
| 111er-Scope nicht vollständig im selben Release umsetzbar | Hoch | Kernkorb + deferred Schnitt dokumentiert und getestet |
| Event-Modification-Reconnect-Regression | Hoch | Pflichtlauf `apps/server/src/multiplayer.test.ts` |
| Hidden-Info-Leak in neuen Prevention-Choices | Hoch | Visibility-/Reconnect-Regression plus Label-Grenze |

## Gate

V1.6.1 ist mit dokumentiertem Kernkorb und Deferred-Schnitt zur Implementierung freigegeben.
