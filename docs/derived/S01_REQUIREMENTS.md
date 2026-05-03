# S01 Requirements

Status: Requirements Freeze
Stand: 2026-05-03
Phase: Sonderphase 01 - Spielende, Ergebnisfenster, Spielziel und Audio

## Kurzentscheidung

S01 ergänzt den bestehenden Matchflow um ein sichtbares Spielende mit Ergebnisfenster, side-sicherer Statistik, Startauswahl für das Spielziel und optionale Audioeffekte.

Die Engine bleibt die einzige Regelautorität. Der Server erzeugt nur side-sichere Ergebnisdaten. Die UI zeigt Ergebnis, Statistik, Hintergrundgrafik und Audio als reine Präsentation.

## Scope

S01 umfasst:

- Ergebnisfenster bei Spielende,
- Perspektivtext für Sieg, Niederlage und Unentschieden,
- sichere Ergebnisstatistik,
- Startauswahl `Regelmatch · 7 Agendapunkte` oder `Einzelspiel · Deckziel`,
- Audio-Opt-in mit Lautstärke,
- Tests für Ergebnisdaten, Visibility und UI-Bindung.

## Nicht-Ziele

S01 baut nicht:

- neue Karten,
- neue Regelmechaniken,
- öffentliche Plattformfunktionen,
- offizielle Assets, Logos, Card Frames oder Card Backs,
- FullState im Browser,
- mehrspielige Serienautomatik mit Seitenwechsel.

Mehrspielige Serien bleiben ein separater Folgeausbau, weil Seitenwechsel Session-, Token-, Reconnect- und WebSocket-Kontexte berührt.

## Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium | Testspur |
|---|---|---|---|
| S01-MUST-001 | Ergebnisfenster | Bei `winner`/`match_finished` erscheint ein Ergebnisfenster. | S01-T001 |
| S01-MUST-002 | Perspektivtext | Eigene Seite gewinnt: `Du hast das Spiel gewonnen.`; Gegenseite gewinnt: `Du hast das Spiel verloren.`; Draw: Unentschieden. | S01-T002 |
| S01-MUST-003 | Ergebnisstatistik | `GameResultSummary` enthält nur aggregierte, side-sichere Werte. | S01-T003 |
| S01-MUST-004 | Spielziel-Auswahl | Startscreen bietet Regelmatch mit 7 Punkten und Einzelspiel mit Deckziel. | S01-T004 |
| S01-MUST-005 | Audio-Opt-in | Audioeffekte sind lokal, stumm schaltbar und lautstärkeregelbar. | S01-T005 |
| S01-MUST-006 | Kein Gameplay-Einfluss | Ergebnisgrafik, Audio und Statistik beeinflussen Engine, LegalActions, Replay und StateHash nicht. | S01-T006 |
| S01-MUST-007 | Visibility-Schutz | Ergebnispayloads, Modal, Reconnect und Fehler enthalten keine Hidden Cards, Tokens, Decklisten oder `cardInstances`. | S01-T007 |
| S01-MUST-008 | Regression | `lint`, `typecheck`, `test`, `build` bleiben grün. | S01-T008 |

## Gate

`ready_for_implementation: true`
