# V1.8.1 Requirements - Mechanikpaket H

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.8.1 setzt einen freigabefähigen Kern von Mechanikpaket H um: Counter-System, Virus-/Purge-Trigger und rungebundene Folgeeffekte aus dem 15-Karten-Korb mit sauberem Deferred-Schnitt für Würfel- und offene Restmechanik.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V181-MUST-001 | V1.8.1 startet erst nach grünem V1.8.0-Final-Gate. |
| V181-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` je Karte dokumentiert. |
| V181-MUST-003 | Der V1.8.1-Kernkorb enthält exakt 12 neue Runtime-Karten: `onr_v1_012_clown`, `onr_v1_046_pattels-virus`, `onr_v1_049_pox`, `onr_v1_094_inside-job`, `onr_v1_173_restrictive-net-zoning`, `onr_v1_193_corporate-coup`, `onr_v1_209_political-coup`, `onr_v1_222_ball-and-chain`, `onr_v1_225_canis-major`, `onr_v1_226_canis-minor`, `onr_v1_242_fatal-attractor`, `onr_v1_268_shock-r`. |
| V181-MUST-004 | `Cockroach` (`onr_v1_013_cockroach`) und `Incubator` (`onr_v1_034_incubator`) bleiben bis V1.9.0 deferred (Würfel-/Zufallsabhängigkeit). |
| V181-MUST-005 | `Grubb` (`onr_v1_030_grubb`) bleibt in V1.8.1 deferred mit expliziter Resolver-Begründung (offener remainder-of-run-Breaker-Lifecycle außerhalb Scope). |
| V181-MUST-006 | `Clown` reduziert die Stärke aller während einer Run-Sequenz encounterten ICE deterministisch um 1, solange `Clown` installiert ist. |
| V181-MUST-007 | `Pattel's Virus` und `Pox` erzeugen erfolgreiche-Run-abhängige Virus-Counter deterministisch; Corp-`purge_virus_counters` entfernt diese Virus-Counter vollständig. |
| V181-MUST-008 | `Inside Job` bildet einen deterministischen Run-Bypass für das erste ICE des Runs ohne Hidden-Info-Leak ab. |
| V181-MUST-009 | `Restrictive Net Zoning` und `Pox` erhöhen ICE-Installkosten servergebunden deterministisch über öffentliche Run-/Installinformationen. |
| V181-MUST-010 | `Corporate Coup` und `Political Coup` erhalten beim Scoren feste Counterwerte (5 bzw. 6) und erlauben nur LegalAction-only Click-Aktionen zum Entnehmen dieser Counter in Credits. |
| V181-MUST-011 | `Ball and Chain`, `Canis Major`, `Canis Minor`, `Fatal Attractor` und `Shock.r` setzen rungebundene Folgeflags deterministisch durch (Encounterkosten, Future-Strength, Next-Encounter-Penalty, Break-/Jackout-Lock). |
| V181-MUST-012 | Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei; keine Hidden-Info-Leaks in PlayerView, PublicEvents, WebSocket, Reconnect, Undo, Logs, Errors oder DecisionDebug. |
| V181-MUST-013 | Keine Karte außerhalb des 12er-Kernkorbs wird implizit `human_playable`/`deck_legal`; `ai_supported` wird nicht automatisch erweitert. |
| V181-MUST-014 | Keine Würfelmechanik aus V1.9.0, keine Ambush-Scopeanteile aus V1.9.0, keine V2.x-Features und keine Public-Plattformfeatures. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V181-SHOULD-001 | Run-Folgeflags sollen zentral im Run-State geführt werden, damit Encounter, Jack-out-Fenster und Replay dieselben Zustandsübergänge sehen. |
| V181-SHOULD-002 | Servergebundene Installkosten-Tax soll in einer zentralen Kostenfunktion gebündelt werden statt ad-hoc pro Karte. |
| V181-SHOULD-003 | Purge-Kontext soll die Anzahl purgter Virus-Counter aus Karten- und Serverquellen transparent im Event-Kontext abbilden. |

## Gate

`ready_for_implementation_after_V1_8_0: true`

V1.8.1 ist als 12-Karten-Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.