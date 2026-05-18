# Test Matrix MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

## Testfälle

| Test ID | Art | Beschreibung | Requirements | Szenario |
|---|---|---|---|---|
| T-BASE-001 | Unit | RulesBaseline und Versionen werden geladen und in GameState/EventLog geführt. | REQ-001 | - |
| T-SETUP-001 | Unit | `createGame` mit gleichem Seed erzeugt identische Startzustände. | REQ-002, REQ-003 | SCN-006 |
| T-RANDOM-001 | Unit | Seeded Shuffle und RandomCounter sind reproduzierbar. | REQ-003, REQ-005 | SCN-006 |
| T-RANDOM-002 | Unit | HQ random access nutzt RandomCounter und RandomDrawRecord. | REQ-027 | - |
| T-API-001 | Unit | LegalAction-Schema enthält Pflichtfelder und aktuelle StateVersion. | REQ-008 | - |
| T-API-002 | Unit | PlayerAction-Schema enthält Pflichtfelder und Choices/Targets. | REQ-009 | - |
| T-STATE-001 | Unit | CardInstance-Eindeutigkeit und ZoneRef-Konsistenz. | REQ-004 | - |
| T-STATE-002 | Unit | GameState enthält Version, Seed, RandomCounter, EventLog und TimingPoint. | REQ-005 | - |
| T-STATE-003 | Unit | Nach Transition sind Invarianten gültig und keine negativen Werte vorhanden. | REQ-033 | - |
| T-ACTION-001 | Unit | `getLegalActions` liefert nur Side-/Timing-gültige Aktionen. | REQ-006, REQ-007 | - |
| T-ACTION-002 | Unit | LegalActions enthalten nur bezahlbare Kosten und gültige Targets. | REQ-007 | - |
| T-ACTION-003 | Unit | `applyAction` lehnt falsche Seite, ActionId, TimingPoint und Target ab. | REQ-010, REQ-011 | - |
| T-ACTION-004 | Unit | `applyAction` lehnt stale StateVersion ab. | REQ-010, REQ-011 | - |
| T-ACTION-005 | Unit | `applyAction` lehnt unbezahlbare Kosten ab. | REQ-011 | - |
| T-ACTION-006 | Integration | Basic Actions zahlen Clicks/Kosten, ändern State und erzeugen Events. | REQ-015 | - |
| T-TURN-001 | Integration | Corp-Pflichtdraw und Corp Action Phase mit 3 Clicks. | REQ-013 | - |
| T-TURN-002 | Integration | Runner Action Phase mit 4 Clicks. | REQ-014 | - |
| T-TURN-003 | Integration | End Turn wechselt aktive Seite korrekt. | REQ-015 | - |
| T-RUN-001 | Scenario | Runner startet Run auf HQ, R&D, Archives und Remote. | REQ-019 | SCN-001, SCN-004 |
| T-RUN-002 | Scenario | RunState durchläuft Initiation, Approach, Encounter, Movement, Success, Access, Run Ends. | REQ-020 | SCN-002 |
| T-RUN-003 | Scenario | Corp rezzt approached ICE oder declines; unrezzed ICE wird passiert. | REQ-021 | SCN-002 |
| T-RUN-004 | Scenario | Breaker pumpt und bricht passende Subroutine. | REQ-022 | SCN-002 |
| T-RUN-005 | Scenario | Ungebrochene ETR-Subroutine beendet Run ohne Breach. | REQ-023 | SCN-003 |
| T-ACCESS-001 | Scenario | Erfolgreicher Run breacht R&D und accesses Top Card. | REQ-025, REQ-026 | SCN-001 |
| T-ACCESS-002 | Scenario | Remote Access stiehlt Agenda oder trasht Asset gegen Trash Cost. | REQ-028 | SCN-004 |
| T-ACCESS-003 | Integration | Archives Access ist side-sicher und MVP-konform. | REQ-029 | - |
| T-SCORE-001 | Scenario | Corp installiert, advanced und scored Simple Agenda. | REQ-031 | SCN-004 |
| T-SCORE-002 | Scenario | Runner stiehlt Simple Agenda aus R&D. | REQ-030 | SCN-001 |
| T-WIN-001 | Scenario | Runner gewinnt bei 6 Agenda Points durch Steal. | REQ-032 | SCN-001, SCN-006 |
| T-WIN-002 | Scenario | Corp gewinnt bei 6 Agenda Points durch Score. | REQ-032 | SCN-004 |
| T-EVENT-001 | Unit | Erfolgreiche Transition schreibt GameEvent mit StateHash. | REQ-033 | SCN-006 |
| T-REPLAY-001 | Scenario | Replay reproduziert finalen StateHash. | REQ-039 | SCN-006 |
| T-VIS-001 | Visibility | RunnerView enthält keine Corp-HQ-/R&D-/unrezzed ICE-Titel außerhalb Access. | REQ-026, REQ-035 | SCN-005 |
| T-VIS-002 | Visibility | HQ random access leakt keine nicht zugegriffenen HQ-Karten. | REQ-027 | - |
| T-VIS-003 | Visibility | PublicEvents enthalten keine privaten CardIds oder verdeckten Titel. | REQ-034 | SCN-005 |
| T-VIS-004 | Visibility | EngineError und ChoiceRequest leaken keine verdeckten Daten. | REQ-012 | - |
| T-VIS-005 | Visibility | CorpView enthält keine Runner-Grip-/Stack-Titel außerhalb erlaubter Sicht. | REQ-036 | - |
| T-VIS-006 | UI/Visibility | Spieler-UI erhält keinen Full GameState. | REQ-041 | - |
| T-AI-001 | AI | Corp-KI wählt nur LegalActions. | REQ-006, REQ-038 | - |
| T-AI-002 | AI/Visibility | Corp-KI-Input enthält nur Corp PlayerView, PublicEvents, LegalActions und erlaubte Metadaten. | REQ-037 | - |
| T-AI-003 | AI | Corp-KI spielt 100 Testzüge ohne illegale Action oder Invariant-Verletzung. | REQ-038 | - |
| T-UI-001 | E2E | Minimal-UI zeigt Board, LegalActions, Run-Panel und EventLog side-sicher. | REQ-041 | - |
| T-UI-002 | UI | Debug-Panel zeigt TimingPoint, StateVersion, StateHash side-sicher. | REQ-043 | - |
| T-UI-003 | UI | Startscreen zeigt RulesBaseline und erlaubt Seed. | REQ-044 | - |
| T-UI-004 | UI | EventLog-Export als JSON, falls umgesetzt. | REQ-045 | - |
| T-E2E-001 | E2E | Human Runner kann Demo-Partie gegen Corp-KI lokal spielen. | REQ-042 | SCN-006 |

## Kartenabdeckung

| Test ID | Karte | Unit-Test | Szenario-/Integrationstest | Requirements |
|---|---|---|---|---|
| T-CARD-RUN-000 | Runner Identity | Initialisierung ohne aktive Ability. | SCN-006 | REQ-002, REQ-040 |
| T-CARD-RUN-001 | Simple Economy Event | Spielen gibt 4 Credits und verschiebt in Heap. | SCN-006 | REQ-018, REQ-040 |
| T-CARD-RUN-002 | Simple Run Event | Startet Run und gibt bei Erfolg 2 Credits. | SCN-002 | REQ-019, REQ-025, REQ-040 |
| T-CARD-RUN-003 | Simple Fracter | Pump/Break nur gegen Barrier. | SCN-002, SCN-003 | REQ-016, REQ-022, REQ-040 |
| T-CARD-RUN-004 | Simple Decoder | Pump/Break nur gegen Code Gate. | SCN-002 | REQ-016, REQ-022, REQ-040 |
| T-CARD-RUN-005 | Simple Killer | Pump/Break nur gegen Sentry. | SCN-002 | REQ-016, REQ-022, REQ-040 |
| T-CARD-CORP-000 | Corp Identity | Initialisierung ohne aktive Ability. | SCN-006 | REQ-002, REQ-040 |
| T-CARD-CORP-001 | Simple Agenda | Advancement Requirement 3, Agenda Points 2. | SCN-001, SCN-004 | REQ-030, REQ-031, REQ-040 |
| T-CARD-CORP-002 | Simple Economy Operation | Spielen gibt 4 Credits und verschiebt in Archives. | SCN-006 | REQ-018, REQ-040 |
| T-CARD-CORP-003 | Simple Economy Asset | Rez Cost 1, Rez-Effekt +3 Credits, Trash Cost 3. | SCN-004 | REQ-017, REQ-028, REQ-040 |
| T-CARD-CORP-004 | Simple Barrier ICE | Rez, Strength 3, ETR-Subroutine. | SCN-002, SCN-003 | REQ-021, REQ-023, REQ-040 |
| T-CARD-CORP-005 | Simple Code Gate ICE | Rez, Strength 2, Corp +1, ETR. | SCN-002 | REQ-021, REQ-024, REQ-040 |
| T-CARD-CORP-006 | Simple Sentry ICE | Rez, Strength 3, Runner verliert bis zu 2 Credits, ETR. | SCN-002 | REQ-021, REQ-024, REQ-040 |
