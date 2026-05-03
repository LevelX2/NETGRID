# MVP 0.6 Test Matrix

Status: frozen_for_implementation  
Stand: 2026-05-03

| ID | Bereich | Erwartung | Requirement |
|---|---|---|---|
| T-V06-DOC-001 | Requirements | Alle V06-MUST-Anforderungen sind in Requirements, Spezifikationen und Testmatrix abgedeckt. | V06-MUST-001 |
| T-V06-MODEL-001 | Deckmodell | Versionierte Deckobjekte enthalten Side, Identity, Kartenliste, Kartenpool und Formatprofil. | V06-MUST-002 |
| T-V06-SNAPSHOT-001 | Snapshot | Gleicher Deckinhalt erzeugt denselben Hash; Änderung an Inhalt, Identity, Formatprofil oder Kartenpool ändert den Hash. | V06-MUST-003, V06-MUST-009 |
| T-V06-VALID-001 | Validierung | Valide Demo-Snapshots bestehen Side-, Identity-, Mengen-, Agenda-Point- und Formatprofilprüfung. | V06-MUST-004 |
| T-V06-VALID-002 | Nicht-spielbare Karten | Import-only und nicht decklegale Karten blockieren spielbare Matches. | V06-MUST-005 |
| T-V06-UI-001 | Deckeditor UI | Deckliste, Editor, Speichern, Laden, Duplizieren, Löschen und Validierungsfeedback funktionieren lokal. | V06-MUST-006 |
| T-V06-IO-001 | Import/Export | JSON-Export lässt sich wieder importieren; ungültiges JSON wird safe abgelehnt. | V06-MUST-007 |
| T-V06-MATCH-001 | Match Setup | Human-vs-Human, Human-vs-KI und KI-vs-KI starten mit validierten Runner-/Corp-Snapshots. | V06-MUST-008 |
| T-V06-REPLAY-001 | Replay/StateHash | Match-Record enthält Deckhashes; laufendes Match bleibt stabil nach Entwurfsänderung. | V06-MUST-009 |
| T-V06-VIS-001 | Visibility | Gegner sieht keine vollständige private Deckliste, nur erlaubte Metadaten. | V06-MUST-010 |
| T-V06-REG-001 | Regression | MVP-0.1 bis MVP-0.5 Tests, Visibility, Replay/StateHash, KI und Build bleiben grün. | V06-MUST-011 |

## Manuelle Smokes

- Deckliste öffnet.
- Demo-Deck als editierbare Kopie erstellen.
- Karte hinzufügen/entfernen.
- Validierungsfehler sehen.
- Validiertes Deck für Match auswählen.
- Ungültiges Deck blockiert Matchstart.
