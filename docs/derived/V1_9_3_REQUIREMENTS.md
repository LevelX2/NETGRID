# V1.9.3 Requirements - Trace/Tag/Resource/Action-Fenster

Stand: 2026-05-10  
Status: eingefroren

## Ziel

V1.9.3 konsolidiert Trace-/Tag-/Resource-/Action-Economy- und Handsize-Fenster als stabilen Mittelblock vor den Damage-/Prevention-Erweiterungen.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V193-MUST-001 | V1.9.3 startet erst nach gruenem V1.9.2-Final-Gate. |
| V193-MUST-002 | Scope umfasst nur: `L2_Trace_Link_Bidding_und_BaseLink_Windowing`, `L2_Tag_Bedingungen_Remove_Avoid`, `L2_Resource_Tag_Interactions`, `L2_Handsize_und_ActionEconomy_Modifier`. |
| V193-MUST-003 | Vor Implementierung wird ein Release-Preflight mit finalem V1.9.3-Kernkorb (`freigabefaehig` vs `deferred`) erstellt und eingefroren. |
| V193-MUST-004 | `TKO 2.0` wird vor Code explizit als `freigabefaehig` oder `deferred` entschieden und begruendet. |
| V193-MUST-005 | Trace-/Bid-/Tag-/Resource-Pfade sind deterministisch, replaybar und side-sicher. |
| V193-MUST-006 | Action-Economy-/Handsize-Modifier bleiben konsistent ueber Undo, Reconnect und stale-action-Pfade. |
| V193-MUST-007 | Counter-gekoppelte Folgethemen (z. B. `Data Raven`) bleiben ausserhalb des V1.9.3-Kerns, sofern V1.9.6-Abhaengigkeit nicht aufgeloest ist. |
| V193-MUST-008 | Keine Scope-Ausweitung auf Damage/Prevention/Core oder V2.x-Features. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V193-SHOULD-001 | Trace- und Tag-Entscheidungen werden mit Negativtests fuer illegale Choice-Kombinationen gehaertet. |
| V193-SHOULD-002 | Resource-Trash- und Tag-Remove-Pfade erhalten Replay-Ketten mit mehreren aufeinanderfolgenden Turn-Wechseln. |
| V193-SHOULD-003 | DecisionDebug bleibt rein auf erlaubte, sichtbare Informationen begrenzt. |

## Gate

`ready_for_implementation_after_V1_9_2_and_V1_9_3_preflight: true`

V1.9.3 ist als sequenzieller Folge-Release nach V1.9.2 umsetzungsreif eingegrenzt.
