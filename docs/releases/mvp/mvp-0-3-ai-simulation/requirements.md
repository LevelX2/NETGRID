# MVP 0.3 Requirements

Status: frozen_for_implementation  
Stand: 2026-05-03  
Scope: KI und Simulation, ohne Kartenpool-Erweiterung

## Scope-Entscheidung

MVP 0.3 ist die KI- und Simulationsphase. Der vorhandene MVP-0.1-Kartenpool und die MVP-0.2-Multiplayer-Gates bleiben unverändert. Kartenpool- und Regelbreite-Erweiterungen werden erst in MVP 0.4 bearbeitet.

## Must Requirements

| ID | Requirement | Akzeptanzkriterium | Test-/Szenario-Abdeckung |
|---|---|---|---|
| V03-REQ-001 | Side-neutrales AI-Input-Modell | Runner und Corp können mit demselben Contract entscheiden. | T-AI-001, T-AI-002 |
| V03-REQ-002 | Kein FullState im AI-Input | AI-Input enthält nur PlayerView, LegalActions, PublicEvents und explizite Metadaten. | T-AI-002, T-AI-007 |
| V03-REQ-003 | Controller-Abstraktion | Human, AI und Replay sind als Controller-Typen modelliert, ohne Engine-Regelautorität zu ändern. | T-AI-003 |
| V03-REQ-004 | Runner-KI | Runner-KI wählt legale Economy-, Install-, Run-, Break-, Access-, Steal-, Trash- und End-Turn-Actions. | T-AI-004, SCN-AI-001 |
| V03-REQ-005 | Corp-KI v2 | Corp-KI priorisiert Mandatory Draw, Score, Rez, Economy, Remote-Aufbau, Advance, ICE und End Turn. | T-AI-005, SCN-AI-002 |
| V03-REQ-006 | LegalAction-Zwang | Jede KI-Entscheidung wird gegen aktuelle LegalActions geprüft; ungültige interne Wahl nutzt deterministischen Fallback. | T-AI-006 |
| V03-REQ-007 | Determinismus | Gleicher AI-Input erzeugt dieselbe Entscheidung; Simulationen sind seed-stabil. | T-AI-008, SCN-AI-003 |
| V03-REQ-008 | KI-vs-KI-Harness | Harness läuft bis Winner oder Limit und liefert Summary mit Seed, Actions, Winner und finalem StateHash. | T-AI-009, SCN-AI-003 |
| V03-REQ-009 | Replay/StateHash | Mindestens eine KI-vs-KI-Partie ist replaybar und reproduziert den finalen StateHash. | T-AI-010, SCN-AI-003 |
| V03-REQ-010 | Erklärmodus | Jede KI-Entscheidung enthält Reason-Code, Erklärung, betrachtete Action-Typen und Fallback-Markierung. | T-AI-011 |
| V03-REQ-011 | Explanation Visibility | KI-Erklärungen nennen keine gegnerischen verdeckten Karten, Tokens oder privaten Sessiondaten. | T-AI-012 |
| V03-REQ-012 | Human Runner vs Corp-KI | Server kann ein aktives Match mit Runner-Human und Corp-KI starten; KI handelt durch die Server-Action-Pipeline. | T-SRV-AI-001 |
| V03-REQ-013 | Human Corp vs Runner-KI | Server kann ein aktives Match mit Corp-Human und Runner-KI starten; Runner-KI handelt nach Corp-Zug automatisch. | T-SRV-AI-002 |
| V03-REQ-014 | KI-vs-KI API | Lokaler Server kann eine KI-vs-KI-Simulation als side-sichere Summary ausführen. | T-SRV-AI-003 |
| V03-REQ-015 | UI-Moduswahl | Web-UI bietet Human-vs-Human, Runner-vs-Corp-KI, Corp-vs-Runner-KI und KI-vs-KI-Simulation. | T-WEB-AI-001 |
| V03-REQ-016 | Bestehende Gates bleiben grün | MVP-0.1-Engine-, Replay-, Visibility- und MVP-0.2-Multiplayer-Tests bestehen weiterhin. | Full check suite |

## Should Requirements

| ID | Requirement | Entscheidung für MVP 0.3 |
|---|---|---|
| V03-SHOULD-001 | Difficulty easy/normal unterscheidbar | In Scope: einfache unterschiedliche Prioritäten. |
| V03-SHOULD-002 | Hard Difficulty | Typisiert, aber nur normalähnlich; echter Lookahead bleibt später. |
| V03-SHOULD-003 | Simulation Report | In Scope: side-sichere Summary ohne FullState/EventLog-Export. |
| V03-SHOULD-004 | Soak-Konfiguration | In Scope als Test-/Harness-Konfiguration, kleiner Standardlauf. |
| V03-SHOULD-005 | Debug-Ansicht | In Scope als Reason-Code/EventLog-Anzeige, nicht als FullState-Browseransicht. |

## Nicht-Ziele

- Keine neuen Karten.
- Keine offiziellen Assets oder Kartendatenbanken.
- Keine LLM-KI.
- Keine KI mit FullState oder verdeckter Gegenseiteninformation.
- Kein freier Deckbuilder.
- Keine öffentlichen Plattformfunktionen.

## Gate

`ready_for_implementation: true`

Begründung: Alle Must Requirements sind testbar, der Scope ist auf KI/Simulation begrenzt, die Visibility-Regeln sind explizit und V0.4-Kartenpoolthemen sind nicht Teil dieses Gates.
