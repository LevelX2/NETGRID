# Open Questions MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

Alle offenen Punkte haben eine deterministische MVP-Annahme. Keine der Fragen blockiert Phase 2.

| ID | Frage | Deterministische MVP-Annahme | Risiko | Blockiert Implementation |
|---|---|---|---|---|
| OQ-001 | Soll MVP 0.1 mit offiziellem 7-Punkte-Siegwert oder Demo-Siegwert laufen? | `agendaPointsToWin = 6` für feste Demo-Partien; als DEV-010 dokumentiert. | Späterer Wechsel auf 7 muss Tests/Decks anpassen. | Nein |
| OQ-002 | Wird Mulligan benötigt? | Kein Mulligan in MVP 0.1; Start ist seed-deterministisch. | Weniger echte Spielnähe. | Nein |
| OQ-003 | Soll Jack-out im ersten Run-Modell angeboten werden? | Nicht abnahmepflichtig; Runs laufen deterministisch weiter, außer ETR beendet sie. | Weniger Spielerentscheidung. | Nein |
| OQ-004 | Wie genau wird Archives facedown/offen modelliert? | MVP implementiert side-sicheren Archives-Access ohne komplexe facedown-Sonderfälle. | Spätere Archives-Karten benötigen Ausbau. | Nein |
| OQ-005 | Nutzt MVP 0.1 SQLite oder JSON? | Engine bleibt rein; lokale App kann in-memory/JSON verwenden. SQLite erst bei MVP 0.2 bevorzugt. | Persistenzkomfort gering. | Nein |
| OQ-006 | Wie sichtbar darf Debug sein? | Spieler-Debug ist side-gefiltert. Full-State-Debug nur lokal/serverintern, nicht in PlayerView oder UI-Spieleransicht. | Fehlbedienung könnte leaken, daher Tests nötig. | Nein |
| OQ-007 | Soll Simple Run Event jeden Server wählen können? | Ja, Serverwahl über LegalAction-Choice; Erfolgsbonus nur für diesen Run. | Muss Run-Source im RunState führen. | Nein |
| OQ-008 | Wird Trash eines Assets automatisch oder optional? | Runner erhält Choice `trash_accessed_card` oder `decline_trash`, wenn Credits reichen. | UI braucht Access-Choice. | Nein |
| OQ-009 | Wie hart soll die Corp-KI planen? | Einfache deterministische Heuristik mit Fallback; Stärke ist kein MVP-Gate. | Spielstärke gering. | Nein |
| OQ-010 | Werden offizielle Kartentexte oder Assets benötigt? | Nein, ausschließlich interne Demo-Karten und Text-/Platzhalterdarstellung. | Kein offizieller Look. | Nein |

