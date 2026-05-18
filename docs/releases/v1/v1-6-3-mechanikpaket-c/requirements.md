# V1.6.3 Requirements - Mechanikpaket C

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.6.3 setzt einen freigabefähigen Kern von Mechanikpaket C um: generische Upgrade-Lifecycle-Pfade, uninstall/destroy über ICE-Subroutinen und servergebundene Upgrade-Modifier mit deterministischen Run-Ergebnispfaden.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V163-MUST-001 | V1.6.3 startet erst nach grünem V1.6.2-Final-Gate. |
| V163-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` dokumentiert. |
| V163-MUST-003 | Der V1.6.3-Kernkorb enthält exakt 5 neue Runtime-Karten: `onr_v1_233_d-arc-knight`, `onr_v1_267_sentinels-prime`, `onr_v1_273_triggerman`, `onr_v1_350_antiquated-interface-routines`, `onr_v1_371_tokyo-chiba-infighting`. |
| V163-MUST-004 | `Trash a program`-Subroutinen zerstören installierte Runner-Programme deterministisch, replaybar und side-sicher. |
| V163-MUST-005 | `onr_v1_350_antiquated-interface-routines` erhöht ICE-Stärke nur auf dem eigenen Fort deterministisch. |
| V163-MUST-006 | `onr_v1_371_tokyo-chiba-infighting` vergibt nach erfolglosen Runs auf demselben Fort deterministisch 1 Credit. |
| V163-MUST-007 | Region-Installregeln (install-and-rez, nur eine Region je Fort, ältere Region trashen) sind für den Kernpfad engine-seitig abgesichert. |
| V163-MUST-008 | Event-/Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei. |
| V163-MUST-009 | Keine Karte außerhalb des 5er-Kernkorbs wird implizit `human_playable` oder `deck_legal`. |
| V163-MUST-010 | `ai_supported` wird nicht automatisch erweitert. |
| V163-MUST-011 | Keine Public-Plattform-, Account-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V163-SHOULD-001 | Upgrade-Servereffekte sollen in Encounter und PlayerView konsistent sichtbar sein. |
| V163-SHOULD-002 | Uninstall-Resolver soll bei mehreren Programmen deterministische Zielauswahl nutzen. |
| V163-SHOULD-003 | ChoiceFlow/Guessing wird mangels freigabefähiger Karten explizit deferred dokumentiert. |

## Gate

`ready_for_implementation_after_V1_6_2: true`

V1.6.3 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.
