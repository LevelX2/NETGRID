# V1.9.0 Requirements - Mechanikpaket I

Stand: 2026-05-10  
Status: eingefroren

## Ziel

V1.9.0 schließt die verbleibenden Zufalls- und Sonderresolverpfade als letzten Mechanikschritt vor V2.x.  
Der Kernscope bleibt auf fünf freigabefähige Karten begrenzt und ergänzt eine testbare Ambush-Foundation ohne zusätzliche Kartenfreigabe.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V190-MUST-001 | V1.9.0 startet erst nach grünem V1.8.1-Final-Gate. |
| V190-MUST-002 | Der V1.9.0-Kernkorb enthält exakt 5 neue Runtime-Karten: `onr_v1_005_bartmoss-memorial-icebreaker`, `onr_v1_007_blink`, `onr_v1_115_terrorist-reprisal`, `onr_v1_223_banpei`, `onr_v1_275_vacuum-link`. |
| V190-MUST-003 | Ein zentraler deterministischer Würfelresolver (`1..6`) basiert auf `seed`, `randomCounter` und purpose-gebundenen RandomRecords. |
| V190-MUST-004 | `Bartmoss Memorial Icebreaker` würfelt deterministisch nach einem Encounter, wenn er in diesem Encounter Subroutinen gebrochen hat; bei Ergebnis `1` wird er getrasht. |
| V190-MUST-005 | `Blink` würfelt bei seiner Break-Aktivierung deterministisch; bei `4..6` wird die gewählte Subroutine gebrochen, sonst erleidet der Runner `Net Damage` in Höhe des Wurfergebnisses. |
| V190-MUST-006 | `Blink` ist pro Encounter/Subroutine höchstens einmal nutzbar. |
| V190-MUST-007 | `Terrorist Reprisal` ist nur legal, wenn die Corp im letzten Corp-Zug mindestens eine `black_ops`-Agenda gescored hat, und discarden anschließend deterministisch bis zu 5 zufällige HQ-Karten nach Archives. |
| V190-MUST-008 | `Banpei` nutzt den konkreten Sonderresolver für `trash program` plus `end the run` deterministisch und replaybar. |
| V190-MUST-009 | `Vacuum Link` würfelt deterministisch; bei `1..3` wird der Run auf die entsprechende Anzahl rezzter ICE zurückgesetzt oder auf das erste ICE begrenzt, inklusive regelkonformer Jack-out-Option. |
| V190-MUST-010 | `L2_Ambush_auf_Access_Resolver` wird als Foundationscope umgesetzt und mit eigenen Tests nachgewiesen, ohne automatische zusätzliche Kartenfreigabe. |
| V190-MUST-011 | Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei; keine Hidden-Info-Leaks in PlayerView, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors oder DecisionDebug. |
| V190-MUST-012 | Keine Karte außerhalb des 5er-Kernkorbs wird implizit `human_playable`/`deck_legal`; `ai_supported` wird nicht automatisch erweitert. |
| V190-MUST-013 | `onr_v1_013_cockroach`, `onr_v1_034_incubator` und `onr_v1_030_grubb` bleiben im V1.9.0-Kernscope deferred und werden explizit dokumentiert. |
| V190-MUST-014 | Keine V2.x-Funktionen, keine Public-Plattformfeatures, keine Scope-Ausweitung auf neue Mechanikfamilien außerhalb `L2_Ambush`, `L3_Deterministischer_Wuerfel_Zufall`, `L4_Konkreter_Sonderresolver_noch_offen`. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V190-SHOULD-001 | Zufallswürfe sollen über einen gemeinsamen Würfel-Helper laufen, nicht als Kartenspezialcode pro Resolver. |
| V190-SHOULD-002 | Die Turn-Tracking-Logik für Agenda-Subtypen soll symmetrisch für Runner- und Corp-Last-Turn-Bedingungen geführt werden. |
| V190-SHOULD-003 | V1.9.0 soll einen klaren Deferred-Überhangbericht für die drei offenen V1.8.1-Karten enthalten. |
| V190-SHOULD-004 | Ambush-Foundationscope soll durch dedizierte Tests von normalen Access-/Trash-Pfaden getrennt nachweisbar sein. |

## Gate

`ready_for_implementation_after_V1_8_1: true`

V1.9.0 ist als 5-Karten-Kernrelease mit dokumentiertem Deferred-Schnitt und Foundationscope für Ambush zur Umsetzung freigegeben.
