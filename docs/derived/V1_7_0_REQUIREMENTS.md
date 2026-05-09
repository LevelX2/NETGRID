# V1.7.0 Requirements - Mechanikpaket D

Stand: 2026-05-09  
Status: eingefroren

## Ziel

V1.7.0 setzt einen freigabefähigen Kern von Mechanikpaket D um: Unique-Constraint im Deck- und Runtime-Lebenszyklus, Daemon-Hosting mit Kaskaden-Trash, Recurring- und Start-of-turn-Resolver sowie subtype-basierte Stealth-/Noisy-/Worm-Verträge.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V170-MUST-001 | V1.7.0 startet erst nach grünem V1.6.3-Final-Gate. |
| V170-MUST-002 | Die Release-Zuordnung wird als `freigabefähig` vs `deferred` dokumentiert. |
| V170-MUST-003 | Der V1.7.0-Kernkorb enthält exakt 5 neue Runtime-Karten: `onr_v1_011_cloak`, `onr_v1_036_jackhammer`, `onr_v1_069_succubus`, `onr_v1_163_floating-runner-bbs`, `onr_v1_180_smiths-pawnshop`. |
| V170-MUST-004 | Unique-Constraint ist im Deckvertrag aktiv: Deckvalidierung lehnt `quantity > 1` für Unique-Karten ab. |
| V170-MUST-005 | Unique-Constraint ist im Runtimevertrag aktiv: installierte Unique-Karten desselben Namens können nicht doppelt ins Spiel kommen. |
| V170-MUST-006 | `onr_v1_069_succubus` hostet Programme bis 3 MU, hosted Programme verbrauchen dort keine Runner-MU und werden bei Host-Verlust deterministisch getrasht. |
| V170-MUST-007 | Recurring-Stealth-Credits aus `onr_v1_011_cloak` sind im Run nur für nicht-noisy Icebreaker nutzbar. |
| V170-MUST-008 | Start-of-turn-Resolver für `onr_v1_163_floating-runner-bbs` und `onr_v1_180_smiths-pawnshop` läuft deterministisch inklusive Choice-Auflösung. |
| V170-MUST-009 | Subtype-Vertrag ist konsistent: `onr_v1_021_dwarf` und `onr_v1_074_worm` tragen `worm`; Noisy-/Stealth-Gating bleibt regelkonform. |
| V170-MUST-010 | Event-/Replay-/StateHash-/Visibility-Verträge bleiben regressionsfrei. |
| V170-MUST-011 | Keine Karte außerhalb des 5er-Kernkorbs wird implizit `human_playable` oder `deck_legal`; `ai_supported` wird nicht automatisch erweitert. |
| V170-MUST-012 | Keine Public-Plattform-, Account-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V170-SHOULD-001 | Hosted-Install- und Normal-Install-Aktionen sollen eindeutige ActionIds ohne Kollision haben. |
| V170-SHOULD-002 | Recurring-Refresh soll alle installierten Runner-Rig-Karten mit Recurring-Countern turnstart-konsistent aktualisieren. |
| V170-SHOULD-003 | Der 36-Karten-Planungskorb bleibt vollständig dokumentiert; nicht freigabefähige Karten sind explizit deferred. |

## Gate

`ready_for_implementation_after_V1_6_3: true`

V1.7.0 ist als Kernrelease mit dokumentiertem Deferred-Schnitt zur Umsetzung freigegeben.
