# V1.9.4 Requirements - Damage/Prevention/Core-Erweiterungen

Stand: 2026-05-10  
Status: eingefroren

## Ziel

V1.9.4 schliesst den Damage-/Prevention-/Core-Block als eigenen Hochrisiko-Release vor den nachfolgenden Board-/Counter-/Resolver-Longtail-Releases.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V194-MUST-001 | V1.9.4 startet erst nach gruenem V1.9.3-Final-Gate. |
| V194-MUST-002 | Scope umfasst nur: `L2_Damage_Familien_und_Flatline_Integration`, `L3_Prevention_Avoid_Replacement`, `L3_Core_Brain_Damage_Erweiterungen`. |
| V194-MUST-003 | Vor Implementierung wird ein Release-Preflight mit finalem V1.9.4-Kernkorb (`freigabefaehig` vs `deferred`) erstellt und eingefroren. |
| V194-MUST-004 | `Data Darts` wird vor Code explizit als `freigabefaehig` oder `deferred` entschieden und begruendet. |
| V194-MUST-005 | Damage-/Prevention-/Avoid-/Replacement-Pfade bleiben deterministisch und Choice-validiert ueber LegalActions. |
| V194-MUST-006 | Core-/Brain-Damage-Erweiterungen bleiben konsistent mit Handlimit-/Flatline-/Game-End-Vertrag. |
| V194-MUST-007 | Hidden-Info-Schutz bleibt in allen Damage-/Discard-/Reveal-nahen Pfaden regressionsfrei. |
| V194-MUST-008 | Keine Scope-Ausweitung auf V1.9.5+ Familien und keine V2.x-Features. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V194-SHOULD-001 | Prevention- und Replacement-Ketten werden mit Konflikt-/Prioritaetstests abgesichert. |
| V194-SHOULD-002 | Flatline-/Core-Grenzfaelle erhalten mehrstufige Replay-Szenarien mit Undo-Barrierepruefung. |
| V194-SHOULD-003 | DecisionDebug erklaert Damage-/Prevention-Entscheidungen ohne private Gegenkarteninfos. |

## Gate

`ready_for_implementation_after_V1_9_3_and_V1_9_4_preflight: true`

V1.9.4 ist als sequenzieller Folge-Release nach V1.9.3 umsetzungsreif eingegrenzt.
