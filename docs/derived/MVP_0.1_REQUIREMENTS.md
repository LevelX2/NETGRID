# MVP 0.1 Requirements

Status: Phase 1 freeze candidate  
Stand: 2026-05-03  
Scope: Human Runner gegen einfache Corp-KI mit festen Demo-Decks

## Quellen

Primär:

- `docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
- `docs/source/Erstes Testdeck.txt`
- `docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf` als Regelreferenz

Zukunftskompatibilität:

- `docs/source/Netrunner_MVP_0.2_Plan.md`, ohne Scope-Erweiterung vor bestandenem MVP-0.1-Gate

## Gate

`ready_for_implementation: true`

Begründung: Alle Must-Anforderungen sind mit stabiler ID formuliert, auf Tests oder Szenarien abgebildet, alle `playable_mvp`-Karten haben Unit- und Szenario-/Integrationstest-Zuordnung, offene Punkte haben deterministische MVP-Annahmen, und Abweichungen sind registriert.

## Nicht-Ziele

| ID | Nicht-Ziel |
|---|---|
| NG-001 | Kein Human-vs-Human-Multiplayer in MVP 0.1. |
| NG-002 | Kein Matchmaking, keine öffentliche Lobby, keine Rankings, keine Accounts, keine Turnierfunktionen. |
| NG-003 | Kein freier Deckbau, keine Rotation, keine Banlisten, keine Einfluss- oder Formatvalidierung außerhalb der Demo-Decks. |
| NG-004 | Kein breiter Kartenpool und keine externen Kartendatenbank-Abhängigkeiten. |
| NG-005 | Keine offiziellen Artworks, Logos, Card Frames oder Card Backs. |
| NG-006 | Keine Tags, Traces, Damage, Viren, Hosting, Prevention, Replacement, Interrupts, Bypass, Forced Encounters, Run-Umleitung oder Multiaccess. |
| NG-007 | Keine LLM-KI und keine KI mit Zugriff auf den vollständigen GameState. |

## Requirements

| ID | Priorität | Anforderung | Test-/Szenarioabdeckung |
|---|---|---|---|
| REQ-001 | Must | MVP 0.1 verwendet eine versionierte RulesBaseline mit Regeln `26.03`, manueller Demo-Kartenquelle und Schema-/Manifest-/Deviation-Version `0.1.0`. | T-BASE-001 |
| REQ-002 | Must | Ein neues Demo-Spiel wird nur aus den festen Runner- und Corp-Demo-Decks erzeugt. | T-SETUP-001, SCN-006 |
| REQ-003 | Must | `createGame` ist für gleichen Seed, gleiche Baseline und gleiche Decklisten deterministisch. | T-SETUP-001, T-RANDOM-001, SCN-006 |
| REQ-004 | Must | Jede CardInstance existiert genau einmal in genau einer Zone oder als explizit gehostetes Objekt; MVP 0.1 nutzt keine gehosteten Karten. | T-STATE-001 |
| REQ-005 | Must | GameState führt StateVersion, Seed, RandomCounter, RandomDrawRecords, EventLog, Phase, TimingPoint und optionalen RunState. | T-STATE-002, T-RANDOM-001, T-REPLAY-001 |
| REQ-006 | Must | Die Engine ist die einzige Regelautorität; UI und KI reichen nur PlayerActions ein. | T-ACTION-001, T-AI-001 |
| REQ-007 | Must | `getLegalActions` liefert nur aktuelle Aktionen für die angefragte Seite, den Timingpunkt und die bezahlbaren Kosten. | T-ACTION-001, T-ACTION-002 |
| REQ-008 | Must | Jede LegalAction enthält `actionId`, `side`, `type`, `label`, `source`, `timingPoint`, `costs`, `targetRequirements`, `visibility` und `expiresAtStateVersion`. | T-API-001 |
| REQ-009 | Must | Jede PlayerAction enthält `side`, `actionId`, `clientKnownStateVersion` und bei Bedarf `selectedTargets`, `selectedChoices`, `idempotencyKey`. | T-API-002 |
| REQ-010 | Must | `applyAction` validiert Seite, ActionId, StateVersion, TimingPoint, Kosten, Targets und Choices erneut. | T-ACTION-003, T-ACTION-004 |
| REQ-011 | Must | Manipulierte Actions mit falscher Seite, falschem Timingpunkt, falschem Target, zu wenig Credits oder stale StateVersion werden abgelehnt. | T-ACTION-003, T-ACTION-004, T-ACTION-005 |
| REQ-012 | Must | Fehlerausgaben nennen keine verdeckten Kartenidentitäten, fremden Handkarten, unrezzed ICE-Titel oder verdeckte Deckpositionen. | T-VIS-004 |
| REQ-013 | Must | Corp-Zug hat verpflichtenden Draw zu Beginn und anschließend Action Phase mit drei Clicks. | T-TURN-001 |
| REQ-014 | Must | Runner-Zug hat Action Phase mit vier Clicks und keine verpflichtende Draw Phase. | T-TURN-002 |
| REQ-015 | Must | Grundaktionen `gain_credit`, `draw_card`, `install_card`, `play_event`, `play_operation`, `advance_card` und `end_turn` werden unterstützt, soweit sie zur Seite und Phase passen. | T-ACTION-006, T-TURN-003 |
| REQ-016 | Must | Runner kann Programme aus Grip installieren, wenn Credits und MU ausreichen. | T-CARD-RUN-003, T-CARD-RUN-004, T-CARD-RUN-005 |
| REQ-017 | Must | Corp kann ICE vor zentralen Servern oder Remotes installieren und Agenda/Asset in Remote Root installieren. | T-CARD-CORP-004, T-CARD-CORP-005, T-SCORE-001 |
| REQ-018 | Must | Event und Operation mit einfachem Credit-Effekt werden gespielt, bezahlen Kosten/Click und landen danach in Heap/Archives. | T-CARD-RUN-001, T-CARD-CORP-002 |
| REQ-019 | Must | Runs können auf HQ, R&D, Archives und mindestens einen Remote-Server gestartet werden. | T-RUN-001, SCN-001, SCN-004 |
| REQ-020 | Must | RunState modelliert Initiation, Approach ICE, Encounter ICE, Movement, Success, Breach/Access und Run Ends. | T-RUN-002, SCN-002, SCN-003 |
| REQ-021 | Must | Corp darf in MVP 0.1 das aktuell approached ICE rezzen, wenn genug Credits vorhanden sind; ICE bleibt sonst unrezzed und wird passiert. | T-RUN-003, SCN-002 |
| REQ-022 | Must | Encounter setzt Subroutinen auf unbroken, Runner darf passende Breaker pumpen und Subroutinen brechen, wenn Stärke und Typ passen. | T-RUN-004, T-CARD-RUN-003, T-CARD-RUN-004, T-CARD-RUN-005, SCN-002 |
| REQ-023 | Must | Ungebrochene `End the run`-Subroutine beendet den Run ohne Breach. | T-RUN-005, T-CARD-CORP-004, SCN-003 |
| REQ-024 | Must | Ungebrochene Economy-/Credit-Loss-Subroutinen werden in Reihenfolge abgehandelt und erzeugen Events ohne verdeckte Leaks. | T-CARD-CORP-005, T-CARD-CORP-006 |
| REQ-025 | Must | Erfolgreicher Run breacht den angegriffenen Server und führt Access gemäß MVP-Scope aus. | T-ACCESS-001, SCN-001, SCN-002 |
| REQ-026 | Must | R&D-Access zeigt dem Runner nur die oberste zugegriffene Karte, nicht weitere R&D-Karten. | T-VIS-001, SCN-001 |
| REQ-027 | Must | HQ-Access wählt deterministisch über Seed/RandomCounter eine zufällige HQ-Karte und leakt keine übrigen HQ-Karten. | T-RANDOM-002, T-VIS-002 |
| REQ-028 | Must | Remote-Access greift Root-Karten zu; Agenda wird gestohlen, Asset kann gegen Trash Cost getrasht werden. | T-ACCESS-002, T-CARD-CORP-003, SCN-004 |
| REQ-029 | Must | Archives-Access ist MVP-tauglich implementiert und offenbart nur für den Access relevante Archives-Daten. | T-ACCESS-003 |
| REQ-030 | Must | Agenda-Steal verschiebt Agenda in Runner Score Area und aktualisiert Runner Agenda Points. | T-SCORE-002, SCN-001 |
| REQ-031 | Must | Corp kann installierte Agenda mit Advancement Requirement 3 advancen und scoren. | T-SCORE-001, SCN-004 |
| REQ-032 | Must | Agenda-Siegbedingungen für Runner und Corp sind deterministisch; MVP-Test-Siegwert ist für Demo-Partien auf 6 Punkte konfigurierbar. | T-WIN-001, T-WIN-002 |
| REQ-033 | Must | Jede erfolgreiche Transition validiert GameState, erhöht StateVersion, erzeugt GameEvent und StateHash. | T-EVENT-001, T-STATE-003 |
| REQ-034 | Must | PublicEvents enthalten keine privaten CardIds, keine verdeckten Titel und keine nicht zugegriffenen Karten. | T-VIS-003, SCN-005 |
| REQ-035 | Must | `getPlayerView(gameState, "runner")` leakt keine Corp-HQ-, R&D-, unrezzed ICE- oder verdeckte Remote-Details. | T-VIS-001, SCN-005 |
| REQ-036 | Must | `getPlayerView(gameState, "corp")` leakt keine Runner-Stack- oder verdeckte Runner-Grip-Daten außerhalb eigener Sichtregeln. | T-VIS-005 |
| REQ-037 | Must | Corp-KI erhält nur Corp PlayerView, PublicEvents, LegalActions und erlaubte Metadaten. | T-AI-002 |
| REQ-038 | Must | Corp-KI wählt deterministisch eine LegalAction oder Fallback-Action und bleibt in 100 Testzügen ohne Invariant-Verletzung. | T-AI-001, T-AI-003 |
| REQ-039 | Must | Replay aus InitialState, EventLog, Seed und RandomDrawRecords reproduziert finalen StateHash. | T-REPLAY-001, SCN-006 |
| REQ-040 | Must | Jede `playable_mvp`-Karte hat Manifest-Eintrag, Unit-Test-Zuordnung und Szenario-/Integrationstest-Zuordnung. | T-CARD-000 bis T-CARD-CORP-006 |
| REQ-041 | Must | UI zeigt PlayerView, LegalActions, Run-Status, EventLog und bekannte MVP-Einschränkungen, aber niemals Full GameState in Spieleransicht. | T-UI-001, T-VIS-006 |
| REQ-042 | Must | MVP 0.1 ist lokal startbar und eine Beispielpartie Human Runner gegen Corp-KI ist manuell spielbar. | T-E2E-001 |
| REQ-043 | Should | Debug-Ansicht zeigt TimingPoint, StateVersion, StateHash und letzte Events in side-gefilterter Form. | T-UI-002 |
| REQ-044 | Should | Startscreen erlaubt Seed-Eingabe und zeigt RulesBaseline. | T-UI-003 |
| REQ-045 | Could | EventLog kann als JSON exportiert werden. | T-UI-004 |

## Phase-2-Umsetzungsreihenfolge

1. Shared Types und Schemas aus `ENGINE_API_SPEC.md` und `GAME_STATE_MODEL.md`.
2. Engine: Karten, Decks, `createGame`, deterministischer Shuffle, StateHash.
3. Engine: LegalActions, PlayerActions, Validierung, Grundaktionen, Turns.
4. Engine: Run-, Encounter-, Access-, Score- und Win-State-Machine.
5. Visibility, EventLog, Replay und StateHash-Gates.
6. Corp-KI mit legalem Fallback.
7. Minimal-UI für Human Runner vs Corp-KI.
8. Szenario-, Acceptance-, Card-, Visibility-, Replay-, KI- und Build-Gates.

