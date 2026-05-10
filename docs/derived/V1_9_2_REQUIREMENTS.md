# V1.9.2 Requirements - Hidden-Zone-/Access-/Run-Kernverbreiterung

Stand: 2026-05-10  
Status: eingefroren

## Ziel

V1.9.2 verbreitert die Hidden-Zone-/Access-/Run-Vertraege inklusive Recurring/Start-of-turn-Erweiterungen als Grundlage fuer die Folgereleases.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V192-MUST-001 | V1.9.2 startet erst nach gruenem V1.9.1-Final-Gate. |
| V192-MUST-002 | Scope umfasst nur: `L2_HiddenZone_Search_Reveal_Reorder_Shuffle`, `L2_Access_Breach_und_Multiaccess_Erweiterungen`, `L2_Ambush_auf_Access_Resolver`, `L2_Run_Flow_Erweiterungen_und_RunLocks`, `L2_Recurring_Pools_und_StartOfTurn_Resolver`. |
| V192-MUST-003 | Vor Implementierung wird ein Release-Preflight mit finalem V1.9.2-Kernkorb (`freigabefaehig` vs `deferred`) erstellt und eingefroren. |
| V192-MUST-004 | `Data Naga` wird vor Code explizit als `freigabefaehig` oder `deferred` entschieden und begruendet. |
| V192-MUST-005 | Hidden-Zone-/Search-/Reveal-/Reorder-/Shuffle-Pfade bleiben side-sicher in PlayerViews, PublicEvents, Reconnect und Undo. |
| V192-MUST-006 | Access-/Run-Lock-/Recurring-Erweiterungen bleiben deterministisch, replaybar und stale-action-sicher. |
| V192-MUST-007 | Keine implizite Freigabe von Karten mit spaeteren Pflichtabhaengigkeiten (insbesondere V1.9.3+). |
| V192-MUST-008 | Keine V2.x-Features und keine Scope-Ausweitung auf Trace/Tag oder Damage/Prevention-Familien. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V192-SHOULD-001 | Preflight dokumentiert pro Kandidatenkarte den Hauptgrund fuer `freigabefaehig` oder `deferred`. |
| V192-SHOULD-002 | Access- und Run-Lock-Regressionen enthalten Mehrfachzug-/Reconnect-Faelle. |
| V192-SHOULD-003 | Ambush-Foundation aus V1.9.0 wird nur erweitert, nicht neu interpretiert. |

## Gate

`ready_for_implementation_after_V1_9_1_and_V1_9_2_preflight: true`

V1.9.2 ist als sequenzieller Folge-Release nach V1.9.1 umsetzungsreif eingegrenzt.
