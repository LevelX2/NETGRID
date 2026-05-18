# V1.7.2 Requirements - Mechanikpaket F

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.7.2 setzt einen freigabefähigen Kern von Mechanikpaket F um: trace-basierte Corp-Operations mit Last-Turn-Run-Attempt-Validierung, tag-basierte Resource-Interaktion sowie Runner-ActionEconomy-/Tag-Remove-Resource-Aktionen über installierte Runner-Resources.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V172-MUST-001 | V1.7.2 startet erst nach grünem V1.7.1-Final-Gate. |
| V172-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` je Karte dokumentiert. |
| V172-MUST-003 | Der V1.7.2-Kernkorb enthält exakt 5 neue Runtime-Karten: `onr_v1_283_audit-of-call-records`, `onr_v1_284_chance-observation`, `onr_v1_286_corporate-detective-agency`, `onr_v1_158_danshis-second-id`, `onr_v1_179_silicon-saloon-franchise`. |
| V172-MUST-004 | `Audit of Call Records` und `Chance Observation` validieren Runner-Run-Attempts des letzten Runner-Turns deterministisch und starten danach einen Trace-5-Tag-Pfad ohne Hidden-Info-Leak. |
| V172-MUST-005 | Trace-Auflösung aus Corp-Operationen funktioniert außerhalb von Run-Subroutinen legal-action-only und kehrt nach Runner-Bid deterministisch in den Corp-Action-Kontext zurück. |
| V172-MUST-006 | `Corporate Detective Agency` triggert nur bei getaggtem Runner und trasht deterministisch bis zu zwei installierte Runner-Resources ohne zusätzliche Klick-/Credit-Kosten über den Operationseffekt. |
| V172-MUST-007 | `Danshi's Second ID` bietet als installierte Runner-Resource eine deterministische Tag-Removal-Action (bis zu 3 Tags, keine Credit-Kosten, Trash bei Nutzung). |
| V172-MUST-008 | `Silicon Saloon Franchise` bietet als installierte Runner-Resource eine Action-Economy-Action (1 Klick -> +1 Credit und 1 Karte ziehen). |
| V172-MUST-009 | Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei. |
| V172-MUST-010 | Keine Karte außerhalb des 5er-Kernkorbs wird implizit `human_playable`/`deck_legal`; `ai_supported` wird nicht automatisch erweitert. |
| V172-MUST-011 | Keine Counter-/Virus-/Purge-Breite aus V1.8.1, keine Agenda-/Scored-Static-Breite aus V1.8.0, keine Public-Plattformfeatures. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V172-SHOULD-001 | Trace-Operationen sollen in Event-Payloads mit `traceStarted` und Trace-IDs eindeutig nachvollziehbar bleiben. |
| V172-SHOULD-002 | Last-Turn-Run-Attempt-Flags sollen nur den Corp-Turn überdauern und mit Beginn des nächsten Runner-Turns sauber zurückgesetzt werden. |
| V172-SHOULD-003 | Der 28-Karten-Planungskorb bleibt vollständig dokumentiert; nicht freigabefähige Karten sind explizit deferred. |

## Gate

`ready_for_implementation_after_V1_7_1: true`

V1.7.2 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.
