# V1.8.0 Requirements - Mechanikpaket G

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.8.0 setzt einen freigabefähigen Kern von Mechanikpaket G um: Agenda-Difficulty-/Overadvance-Logik und scored-agenda-statische Effekte als deterministische Kernpfade ohne Counter-/Virus-/Purge-Breite aus V1.8.1.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V180-MUST-001 | V1.8.0 startet erst nach grünem V1.7.2-Final-Gate. |
| V180-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` je Karte dokumentiert. |
| V180-MUST-003 | Der V1.8.0-Kernkorb enthält exakt 6 neue Runtime-Karten: `onr_v1_083_desperate-competitor`, `onr_v1_090_hot-tip-for-wns`, `onr_v1_156_corporate-ally`, `onr_v1_159_databroker`, `onr_v1_201_executive-extraction`, `onr_v1_214_project-babylon`. |
| V180-MUST-004 | `Desperate Competitor` und `Hot Tip for WNS` sind nur legal, wenn im aktuellen Runner-Turn bereits eine passende Agenda-Subtype-Liberation erfolgt ist (`gray_ops` bzw. `black_ops`), und liefern danach genau 1 Agenda-Punkt deterministisch. |
| V180-MUST-005 | `Corporate Ally` verlangt beim Installieren zusätzlich 1 Agenda-Punkt als Kostenpfad und erhöht die Difficulty aller Agendas um +1, solange die Karte installiert ist. |
| V180-MUST-006 | `Databroker` bietet als installierte Runner-Resource eine LegalAction-only-Aktion: 1 Klick, 1 Agenda-Punkt bezahlen, Karte trashen, +10 Credits. |
| V180-MUST-007 | `Executive Extraction` reduziert als gescorte Agenda die Difficulty von `gray_ops`-Agendas um 1 deterministisch und ohne Hidden-Info-Leak. |
| V180-MUST-008 | `Project Babylon` vergibt beim Scoren zusätzliche Agenda-Punkte deterministisch pro zwei Overadvance-Counter über aktueller Difficulty. |
| V180-MUST-009 | Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei. |
| V180-MUST-010 | Keine Karte außerhalb des 6er-Kernkorbs wird implizit `human_playable`/`deck_legal`; `ai_supported` wird nicht automatisch erweitert. |
| V180-MUST-011 | Keine Counter-/Virus-/Purge-Breite aus V1.8.1, keine Würfel-/Ambush-Scopeanteile aus V1.9.0, keine Public-Plattformfeatures. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V180-SHOULD-001 | Agenda-Difficulty-Berechnung soll als zentraler Engine-Helfer gebündelt werden, damit Scoring-Gates und Resolver dieselbe Logik verwenden. |
| V180-SHOULD-002 | Agenda-Punkt-Kostenpfade sollen als expliziter Forfeit-Pfad (`removed_from_game`) nachvollziehbar im Event-Kontext erscheinen. |
| V180-SHOULD-003 | Der 13-Karten-Planungskorb bleibt vollständig dokumentiert; alle Counter-gekoppelten Karten sind explizit deferred. |

## Gate

`ready_for_implementation_after_V1_7_2: true`

V1.8.0 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.

