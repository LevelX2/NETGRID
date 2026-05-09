# V1.6.2 Requirements - Mechanikpaket B

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.6.2 setzt den freigabefähigen Kern von Mechanikpaket B um: globale ICE-Kosten-/Stärke-Modifier, generische Asset/Node-Modifierpfade und persistente Wirkung über Rez-/Score-Zustände.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V162-MUST-001 | V1.6.2 startet erst nach grünem V1.6.1-Final-Gate. |
| V162-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` dokumentiert. |
| V162-MUST-003 | Der V1.6.2-Kernkorb enthält exakt 5 neue Runtime-Karten: `onr_v1_212_priority-requisition`, `onr_v1_215_security-net-optimization`, `onr_v1_317_data-masons`, `onr_v1_320_encoder-inc`, `onr_v1_341_skalderviken-sa-beta-test-site`. |
| V162-MUST-004 | Globale ICE-Rez-Kosten-Modifier wirken deterministisch über rezzed Asset/Node-Karten. |
| V162-MUST-005 | Globale ICE-Stärke-Modifier wirken deterministisch über rezzed Assets und gescorte Agenda-Modifier. |
| V162-MUST-006 | Priority Requisition rezzt beim Scoren genau ein installiertes unrezzed ICE kostenfrei und deterministisch. |
| V162-MUST-007 | Event-/Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei. |
| V162-MUST-008 | Keine Karte außerhalb des 5er-Kernkorbs wird implizit `human_playable` oder `deck_legal`. |
| V162-MUST-009 | `ai_supported` wird nicht automatisch erweitert. |
| V162-MUST-010 | Keine Public-Plattform-, Account-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V162-SHOULD-001 | Modifier-Kosten sollen direkt in Corp-Rez-LegalActions sichtbar sein. |
| V162-SHOULD-002 | ICE-Stärke-Modifier sollen in PlayerViews konsistent mit Run-Encounter gelten. |
| V162-SHOULD-003 | Deferred-Karten aus dem 50er-Planungskorb bleiben mit Begründung dokumentiert. |

## Gate

`ready_for_implementation_after_V1_6_1: true`

V1.6.2 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.
