# V1.6.1 Requirements - Mechanikpaket A

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.6.1 setzt den freigabefähigen Kern von Mechanikpaket A um: Runtime-Damage-Prevention auf Basis installierter Runner-Karten, zusätzliche Core-Damage-ICE-Pfade und einen explizit dokumentierten Deferred-Schnitt für Karten mit späteren Effektblockern.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V161-MUST-001 | V1.6.1 startet erst nach grünem V1.6.0-Final-Gate. |
| V161-MUST-002 | Die Release-Zuordnung aus der lokalen Matrix wird vor Umsetzung als `freigabefähig` vs `deferred` dokumentiert. |
| V161-MUST-003 | Der V1.6.1-Kernkorb enthält exakt 6 neue Runtime-Karten: `onr_v1_023_evil-twin`, `onr_v1_028_force-shield`, `onr_v1_125_dermatech-bodyplating`, `onr_v1_229_code-corpse`, `onr_v1_231_cortical-scrub`, `onr_v1_254_liche`. |
| V161-MUST-004 | Runtime-Damage-Prevention muss ohne Test-Harness aus installierten Runner-Karten angeboten werden. |
| V161-MUST-005 | Prevention-Usage pro Karte ist turn-basiert begrenzt und deterministisch. |
| V161-MUST-006 | Core-Damage-Subroutinen der neuen ICE laufen über bestehende Damage/Flatline-Verträge und bleiben replay-/statehash-stabil. |
| V161-MUST-007 | Event-Modification-Reconnect-/Undo-/Idempotency-Verträge dürfen nicht regressieren. |
| V161-MUST-008 | Replacement-Pipeline aus V1.2.1 bleibt funktional; zusätzliche Runtime-Replacement-Karten sind in V1.6.1 nicht Pflicht. |
| V161-MUST-009 | Keine Karte außerhalb des 6er-Kernkorbs wird durch V1.6.1 implizit `human_playable` oder `deck_legal`. |
| V161-MUST-010 | `ai_supported` wird nicht automatisch erweitert. |
| V161-MUST-011 | Hidden-Info-Schutz gilt unverändert für PlayerViews, PublicEvents, Reconnect-, Undo- und Fehlerpfade. |
| V161-MUST-012 | Keine Public-Plattform-, Account-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |
| V161-MUST-013 | Keine automatische Kartentextinterpretation als Laufzeitautorität. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V161-SHOULD-001 | V1.6.1 sollte bestehende O:NR-V1-Smoke-Decks unverändert lauffähig halten. |
| V161-SHOULD-002 | Neue Prevention-Choices sollten card-spezifisch benannt sein, ohne Test-Harness-Labels in Runtime-Projektionen. |
| V161-SHOULD-003 | Deferred-Karten sollten pro Release-Blocker knapp dokumentiert sein. |

## Gate

`ready_for_implementation_after_V1_6_0: true`

V1.6.1 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.
