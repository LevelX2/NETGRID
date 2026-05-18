# V1.6.0 Requirements - Tutorial und Regelhilfe

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.6.0 führt einen ersten Tutorial- und Regelhilfe-Slice ein. Er nutzt bestehende Engine-, Replay- und LegalAction-Verträge.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V160-MUST-001 | V1.6.0 startet erst nach grünem V1.5.0-Final-Gate. |
| V160-MUST-002 | Tutorialmodus ist klar von normalen Matches getrennt. |
| V160-MUST-003 | Tutorial-Szenarien nutzen nur bereits freigegebene Karten, Mechaniken und Resolver. |
| V160-MUST-004 | Jede Tutorialentscheidung referenziert aktuelle LegalActions. |
| V160-MUST-005 | Tutorial-Hinweise dürfen keine illegalen Aktionen vorschlagen. |
| V160-MUST-006 | Tutorial-Replays sind deterministisch und StateHash-prüfbar. |
| V160-MUST-007 | Hidden-Info-Beispiele bleiben side-sicher. |
| V160-MUST-008 | Erste Lektionen decken Setup/Mulligan, Klicks/Credits/Draw, Run, Encounter/Breaker, Access, Score/Steal und Game-End-Grundlagen ab. |
| V160-MUST-009 | Damage/Flatline darf als geführter Sonderfall nur mit bestehenden freigegebenen Mechaniken erklärt werden. |
| V160-MUST-010 | Trace/Tags/Resources/Counter/Prevention/Replacement/Special Zones werden nur erklärt, wenn das konkrete Szenario bereits freigegeben ist. |
| V160-MUST-011 | Regelhilfe nutzt ein projektinternes Glossar und markiert NETGRID-Scope-Abweichungen. |
| V160-MUST-012 | KI-Sparring nutzt nur bestehende LegalAction-KI und keine Hidden-Info-Vorteile. |
| V160-MUST-013 | Optionaler Coach-/LLM-Pfad bleibt ausgeschlossen oder post-game/side-safe und erzeugt keine Actions. |
| V160-MUST-014 | Keine Public-Plattform-, Account-, Cloud-Fortschritt-, Matchmaking-, Ranking- oder Turnierfunktion wird eingeführt. |
| V160-MUST-015 | Keine neue Karte, Mechanik, offizielle Assetnutzung oder KI-Deckfreigabe entsteht durch Tutorial. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V160-SHOULD-001 | Tutorials sollten an V1.5.0-Replay-Timeline anknüpfen. |
| V160-SHOULD-002 | Hinweise sollten kurz, deutsch und UI-konform sein. |
| V160-SHOULD-003 | Tutorialfortschritt sollte lokal sein und keine Accounts benötigen. |

## Gate

`ready_for_implementation_after_V1_5_0: true`

V1.6.0 ist nach V1.5.0 bereit für Umsetzung.
