# Netrunner-Webapplikation – Detailliertes Testkonzept

**Status:** Arbeitsfassung  
**Stand:** 03.05.2026  
**Gültig für:** MVP 0.1 Engine/Stabilisierung und MVP 0.2 private Human-vs-Human-Partie  
**Regelbaseline:** Null Signal Games Comprehensive Rules v26.03, begrenzt auf den dokumentierten MVP-Regelumfang  
**Testbasis:** `Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`, `Netrunner_MVP_0.2_Plan.md`, `Erstes Testdeck.txt`, `Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf`

---

## 1. Zweck des Testkonzepts

Dieses Testkonzept definiert, wie die Netrunner-Webapplikation für den MVP-Umfang belastbar geprüft wird. Es behandelt zwei Stufen:

1. **MVP 0.1:** lokale bzw. kontrollierte Engine-Grundlage mit Demo-Decks, LegalActions, PlayerViews, EventLog, Replay, einfacher Corp-KI und deterministischen Szenariotests.
2. **MVP 0.2:** serverautoritatives privates Human-vs-Human-Spiel über Internet mit Einladung, WebSocket-Synchronisation, getrennten PlayerViews, Reconnect, Undo, Persistenz, Action-Idempotenz und Hidden-Info-Schutz.

Das Ziel ist nicht primär eine hohe Zahl einzelner Tests, sondern ein belastbares Qualitätsnetz gegen die Fehlerklassen, die bei Netrunner besonders kritisch sind: regelwidrige Zustände, divergierende Multiplayer-Zustände, fehlerhafte Timingpunkte, Hidden-Info-Leaks, nicht reproduzierbare Zufallsentscheidungen, doppelt verarbeitete Actions und unfaire Undo-/Reconnect-Situationen.

---

## 2. Leitprinzipien

| Prinzip | Konsequenz für Tests |
|---|---|
| Engine ist Regelautorität | Tests prüfen `applyAction`, `getLegalActions`, `getPlayerView`, `validateGameState`, `replayEvents` direkt. UI-Tests dürfen keine Regelkorrektheit ersetzen. |
| Kein Client sieht den vollständigen GameState | Jede Client-Payload wird gegen eine Visibility-Oracle geprüft. Verdeckte Daten dürfen nicht nur optisch versteckt sein, sondern dürfen im Payload nicht existieren. |
| Determinismus vor Komfort | Seeds, RandomCounter, RandomDrawRecords und StateHashes sind Testgegenstände. Nicht reproduzierbare Tests gelten als Fehler. |
| Jede Transition ist validiert | Nach jeder erfolgreichen Engine-Transition muss `validateGameState()` laufen und ein Event mit StateHash erzeugt werden. |
| LegalActions sind Angebote, keine Autorisierung | Manipulierte PlayerActions werden erneut durch Server und Engine validiert. |
| Multiplayer ist transaktional | Pro Match darf immer nur eine Engine-Transition gleichzeitig verarbeitet werden. |
| Undo ist konservativ | Undo wird nur bei Zustimmung und ohne Hidden-Info-Barrier erlaubt. |
| Neue Karten benötigen Tests | Kein `playable_mvp` ohne Manifest-Eintrag, Kartentest, Szenario und Regression. |
| Tests sind Release-Gates | Visibility-, Replay-, Multiplayer-, Reconnect- und Concurrency-Tests sind keine optionalen Ergänzungen. |

---

## 3. Testumfang

### 3.1 In Scope

| Bereich | Enthaltene Prüfungen |
|---|---|
| Setup | deterministische Match-Erzeugung, Seed, Starthände, Zonen, Startressourcen, Identitäten ohne aktive Fähigkeit |
| Engine-Grundaktionen | Credits nehmen, Karte ziehen, installieren, Event/Operation spielen, Agenda advancen, Zug beenden |
| State Machine | Corp Draw, Corp Action, Runner Action, Turnwechsel, Click-Verbrauch, Timingpunkte für MVP-Aktionen |
| Run Engine | Run-Initiation, Serverwahl, Approach ICE, Rez-Choice, Encounter, Pump/Break, Subroutinen, Pass ICE, Approach Server, Success, Breach, Access, Run-Ende |
| Access/Breach | HQ random access, R&D top access, Archives, Remote root access, Agenda-Steal, Trash-Cost-Entscheidung |
| Scoring | Agenda installieren, Advancement-Token legen, Score-Bedingung, Agenda scoren, Siegbedingung |
| Demo-Karten | alle Karten aus Runner Demo Deck 01 und Corp Demo Deck 01 |
| PlayerViews | RunnerView, CorpView, PublicEvents, PrivateEvents, LegalActions, ChoiceRequests, Fehler, Reconnect, Undo, UI-Debug |
| EventLog/Replay | Event-Schema, StateVersion, StateHash, RandomDrawRecords, vollständiges Replay, sichtgefilterter Replay |
| KI MVP 0.1 | einfache Corp-KI wählt legale Aktionen, Fallback, Timeout, 100-Testzüge ohne Invariant-Verletzung |
| REST MVP 0.2 | Match erstellen, Join-Info, Join, Reconnect, Bootstrap, optional Replay |
| WebSocket MVP 0.2 | Join, Action Submit, Pass Priority, Undo, Ping/Pong, StateUpdate, LegalActions, EventLogUpdate, Errors |
| Serverautorität | Token, Seite, Session, MatchStatus, StateVersion, Idempotency, Locking, Engine-Legalität |
| Multiplayer-Synchronisation | getrennte PlayerViews, gleiche StateVersion, unterschiedliche Sicht, Events, ActionReceipts |
| Concurrency | gleichzeitige Actions, Double Click, doppelte Messages, stale StateVersion, Lock-Freigabe bei Fehlern |
| Reconnect | Disconnect-Erkennung, Session-Wiederaufnahme, Connection-Replacement, Reconnect in Action/Run/Encounter/Access |
| Undo | Anfrage, Zustimmung, Ablehnung, Ablauf, Restore über Snapshot/Replay, Block nach Hidden-Info-Barrier |
| Persistenz | SQLite/Storage-Adapter, MatchState, Events, Snapshots, Sessions, Receipts, Crash Recovery, Migration Marker |
| UI/E2E | zwei Browser-Kontexte, Einladung, Join, Game Board, Wartezustände, LegalActions, EventLog, Reconnect, Undo |
| Betrieb/Sicherheit | Token-Handling, Logs, Rate Limits, CORS/Origin, Debug-Abgrenzung, Docker/Lokalstart |

### 3.2 Out of Scope für MVP 0.1/0.2

| Bereich | Begründung |
|---|---|
| Öffentliches Matchmaking, Lobby, Ranglisten | Nicht Ziel von MVP 0.2. |
| Vollständiger offizieller Kartenpool | MVP verwendet feste Demo-Decks. |
| Formatlegalität, Rotation, Einfluss, freier Deckbau | Für kontrollierte MVP-Partien zurückgestellt. |
| Zuschauer-Modus als Pflichtfunktion | Visibility-Struktur vorbereiten, aber kein Abnahmeziel. |
| Chat als Pflichtfunktion | Keine Testpflicht, solange nicht gebaut. |
| Vollständige Paid-Ability-/Priority-Fenster des offiziellen Spiels | Nur MVP-relevante Timingpunkte werden geprüft. |
| Tags, Trace, Damage, Viren, Hosting, Prevention/Replacement, Multiaccess, Bypass | Erst testen, wenn entsprechende Karten eingeführt werden. |
| Kompetitive Anti-Cheating-/Commit-Reveal-Fairness für Zufall | Für private MVP-Spiele nicht erforderlich. |

---

## 4. Qualitätsziele und kritische Fehlerklassen

### 4.1 Qualitätsziele

| Ziel | Messbare Bedingung |
|---|---|
| Regelstabilität | Jede erfolgreiche Action erzeugt validen State, Event und StateHash. |
| Reproduzierbarkeit | Eine Beispielpartie kann aus InitialState, Seed, EventLog und RandomDrawRecords vollständig replayt werden. |
| Hidden-Info-Sicherheit | Automatische Leak-Tests finden keine verbotenen Kartendetails, CardIds, Zoneninhalte, Tokens oder Full-State-Dumps in falschen Outputs. |
| Multiplayer-Konsistenz | Beide Clients haben nach jeder akzeptierten Action dieselbe StateVersion und passende seitenspezifische PlayerViews. |
| Robustheit gegen Manipulation | Falsche Seite, falscher Token, falscher Timingpunkt, illegale Targets, stale StateVersion und doppelte Idempotency-Keys werden kontrolliert abgelehnt. |
| Reconnect-Fähigkeit | Reconnect stellt in Action Phase, Run, Encounter und Access dieselbe berechtigte Entscheidung wieder her. |
| Undo-Fairness | Undo vor Hidden-Info-Barrier funktioniert mit Zustimmung; Undo nach Hidden-Info-Barrier wird blockiert. |
| Persistenz | Aktive Matches überleben Neustart oder werden sauber aus Snapshot/EventLog pausiert bzw. wiederhergestellt. |

### 4.2 Fehlerklassen mit höchster Priorität

| Fehlerklasse | Beispiel | Priorität |
|---|---|---:|
| Hidden-Info-Leak | Runner-Payload enthält HQ-Kartentitel oder unrezzed ICE-Titel. | P0 |
| State-Korruption | Eine Karte existiert in zwei Zonen oder Credits werden negativ. | P0 |
| Divergierender Multiplayer-State | Corp und Runner sehen unterschiedliche StateVersions nach akzeptierter Action. | P0 |
| Doppelte Transition | Double Click erzeugt zwei Credit-Gains oder zwei Scoring-Events. | P0 |
| Falsche Autorisierung | Join-Token erlaubt Übernahme der Gegenseite. | P0 |
| Undo nach Informationsgewinn | Spieler kann nach gesehenem HQ-/R&D-Zugriff zurückdrehen. | P0 |
| Nicht reproduzierbarer Replay | EventLog erzeugt anderen StateHash als Originalpartie. | P0 |
| Falsche LegalActions | UI/KI erhält Action, die `applyAction` ablehnt, oder illegale Action wird akzeptiert. | P1 |
| Reconnect-Verlust | Spieler reconnectet während Access und PendingChoice ist weg oder verändert. | P1 |
| UI-Desynchronisierung | Button bleibt aktiv während Serververarbeitung und erzeugt stale Aktionen. | P1 |
| Unklare Fehlermeldung | Fehler nennt private Karte, interne CardId oder Token. | P1/P0 bei Leak |

---

## 5. Teststufen

| Teststufe | Zweck | Typische Tools/Umsetzung | Gate |
|---|---|---|---|
| Type-/Schema-Tests | Shared Types, Event-Schema, PlayerView-Schema, Migration Marker validieren | TypeScript, JSON Schema, Zod/ähnlich | Ja |
| Unit Tests | Einzelne Engine-Funktionen, Resolver, Kosten, Targets, Tokenvalidierung, Filter | Vitest/Jest oder äquivalent | Ja |
| Szenariotests | deterministische Spielsequenzen über Engine-API | JSON-Szenarien + Test Runner | Ja |
| Property-/Invariant-Tests | zufällige legale Action-Sequenzen, State-Invarianten | generativer Runner, Seed-Logging | Ja für Kerninvarianten |
| Integrationstests | REST, WebSocket, Storage, Action-Pipeline | Testserver + In-Memory/SQLite | Ja |
| Concurrency-Tests | gleichzeitige Actions, Locking, Idempotency | Promise-Race, WS-Harness, DB-Transaktionen | Ja |
| Visibility-Tests | alle ausgehenden Payloads, Errors, Logs, Reconnect, Undo prüfen | Payload-Crawler + Visibility-Oracle | Ja, P0 |
| Replay-Tests | EventLog replayen, StateHash vergleichen | Engine-Replay-Runner | Ja |
| Persistenz-/Recovery-Tests | Neustart, Snapshot, EventLog, Migration | SQLite-Testdatenbank, Server-Neustart | Ja für 0.2 |
| E2E-Tests | Zwei Menschen/Browser simulieren private Partie | Playwright/Cypress/ähnlich mit zwei Kontexten | Ja für Abnahme |
| Manuelle Explorations-Tests | Randfälle, UX, Timinggefühl, Debugging | Checklisten | Ergänzend, kein Ersatz |

---

## 6. Testumgebungen

| Umgebung | Zweck | Mindestkonfiguration |
|---|---|---|
| `unit-local` | schnelle Engine-, Resolver-, Filter- und Schema-Tests | kein Netzwerk, deterministische Seeds |
| `scenario-local` | vollständige Engine-Szenarien und Replay | feste Demo-Decks, initialState-Fixtures |
| `integration-memory` | REST/WebSocket ohne persistente DB | Testserver, In-Memory-Storage, Fake Clock |
| `integration-sqlite` | Persistenz, Snapshots, Recovery, Idempotency-Receipts | SQLite-Datei pro Test, Transaktionen |
| `e2e-two-browser` | Human-vs-Human-Flow | zwei isolierte Browser-Kontexte, getrennte Storage/Cookies |
| `crash-recovery` | Serverneustart während aktiver Partie | SQLite, Prozessneustart, Reconnect-Token |
| `local-dev-debug` | Debug-Funktionen prüfen | Full-State nur serverseitig oder lokal erlaubt |
| `private-server-smoke` | privater Betrieb über Netzwerk | HTTPS/WSS empfohlen, Origin/CORS konfiguriert |

---

## 7. Testdaten und Fixtures

### 7.1 Demo-Decks

Die festen Decks sind Testinstrumente. Jede Karte isoliert eine konkrete Mechanik.

| Deck | Karten | Primäre Testabdeckung |
|---|---|---|
| Runner Demo Deck 01 – Run & Steal | Runner Identity, Simple Economy Event, Simple Run Event, Simple Fracter, Simple Decoder, Simple Killer | Event spielen, Credits, Run-Start durch Effekt, Installation, Memory, Breaker Pump/Break nach ICE-Typ |
| Corp Demo Deck 01 – Build & Score | Corp Identity, Simple Agenda, Simple Economy Operation, Simple Economy Asset, Simple Barrier ICE, Simple Code Gate ICE, Simple Sentry ICE | Operation, Remote, Rez, Trash Cost, ICE-Installation, Encounter, Subroutinen, Agenda Score/Steal |

### 7.2 Standard-Seeds

| Seed | Verwendung |
|---|---|
| `mvp_setup_001` | deterministisches Setup und Starthände |
| `mvp_rd_agenda_top_001` | R&D-Access stiehlt oberste Agenda |
| `mvp_hq_random_001` | reproduzierbarer HQ-random-access |
| `mvp_remote_score_001` | Corp installiert und scored Agenda |
| `mvp_run_break_001` | Runner begegnet gerezztem ICE und bricht Subroutinen |
| `mvp_reconnect_access_001` | Reconnect während CurrentAccess |
| `mvp_undo_safe_001` | Undo vor Hidden-Info-Barrier |
| `mvp_undo_blocked_001` | Undo nach Hidden-Info-Barrier |
| `mvp_concurrency_001` | gleichzeitige Actions und Idempotency |

Jeder fehlschlagende Test muss den verwendeten Seed im Fehlerbericht ausgeben. Generative Tests müssen Seed, Action-Sequenz und finalen StateHash speichern.

### 7.3 Empfohlene Fixtures

| Fixture | Beschreibung | Wichtigste Erwartung |
|---|---|---|
| `initial_demo_match` | frisches Match mit festen Demo-Decks | valide Zonen, Startwerte, StateVersion 0 oder 1 |
| `runner_has_all_breakers` | Runner hat Fracter, Decoder, Killer installiert und Credits | Pump/Break-Tests ohne Setup-Lärm |
| `corp_rd_protected_barrier` | R&D mit unrezzed Barrier ICE | Rez, Encounter, Break/ETR |
| `corp_rd_protected_code_gate` | R&D mit Code Gate ICE | mehrere Subroutinen, Teilbrechen |
| `corp_remote_with_agenda` | Remote mit installierter Agenda | Advance/Score, Runner-Access/Steal |
| `corp_remote_with_asset` | Remote mit unrezzed/rezzed Asset | Rez-Effekt, Trash Cost |
| `hq_multiple_cards` | HQ enthält mehrere verdeckte Karten | RandomAccess und Visibility |
| `current_access_agenda` | Runner muss Agenda stehlen | PendingChoice und Reconnect |
| `current_access_asset_trashable` | Runner kann Asset trashen oder liegen lassen | ChoiceRequest und Kostenprüfung |
| `pending_corp_rez_choice` | Corp soll ICE rezzen | Corp-only Choice, Runner-Wartezustand |
| `after_hidden_info_barrier` | Hidden-Info-Event liegt nach TargetEvent | Undo muss blockieren |
| `pre_hidden_info_safe_undo` | kein Hidden-Info-Event seit TargetEvent | Undo kann Gegnerzustimmung anfordern |

### 7.4 Visibility-Oracle

String-Suchen nach Kartentiteln reichen nicht aus, weil Karten später legal sichtbar werden können. Deshalb braucht die Testbasis eine Visibility-Oracle:

```ts
visibilityOracle(gameState, side): {
  visibleCardInstanceIds: Set<string>
  visibleCardTitles: Set<string>
  visibleZones: Set<string>
  allowedPrivateEventIds: Set<string>
  forbiddenFieldNames: Set<string>
}
```

Die Oracle prüft pro Payload:

1. Keine vollständigen `gameState`-, `deck`-, `stack`-, `rdOrder`- oder Token-Strukturen im Client-Payload.
2. Keine CardInstanceId, die für die Empfängerseite nicht sichtbar ist.
3. Kein Kartentitel, keine Kosten, kein Typ und keine Subtypen verdeckter Karten.
4. Keine gegnerischen privaten Choices.
5. Keine private RandomDraw-Auswertung außerhalb der berechtigten Seite.
6. Keine Token, SessionHashes, Full-State-Debugdaten oder internen Lock-Daten.

---

## 8. Eintritts- und Austrittskriterien

### 8.1 Eintrittskriterien für MVP-0.1-Testphase

| Kriterium | Bedingung |
|---|---|
| Engine-API vorhanden | `createGame`, `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `checkWinConditions`, `replayEvents`, `hashState` sind implementiert oder als testbare Module verfügbar. |
| Demo-Karten modelliert | Alle Demo-Karten sind im CardDefinition-/Manifest-System vorhanden. |
| Deterministischer Seed | Shuffle und RandomCounter sind reproduzierbar. |
| Test Runner | Unit- und Szenariotests können lokal und in CI ausgeführt werden. |
| Abweichungsregister | Bewusste MVP-Regelvereinfachungen sind dokumentiert. |

### 8.2 Austrittskriterien für MVP 0.1

| Kriterium | Pass/Fail |
|---|---|
| Setup | Match startet deterministisch mit festen Decks. |
| Engine-Invarianten | Nach jeder Transition sind alle Kerninvarianten gültig. |
| Grundaktionen | Credits, Draw, Install, Advance, Play Event/Operation, End Turn funktionieren. |
| Run/Access | ungeschützter und geschützter Run, Break, ungebrochene Subroutine, Access und Steal sind getestet. |
| Scoring/Sieg | Corp kann Agenda scoren; Runner kann Agenda stehlen; Siegtests existieren. |
| PlayerViews | keine verdeckten Daten in RunnerView, CorpView-Fremdanteilen, PublicEvents, Fehlern oder KI-Input. |
| Replay | Beispielpartie replayt mit identischen StateHashes. |
| KI | Corp-KI schafft 100 Testzüge ohne illegale Action, Endlosschleife oder Invariant-Verletzung. |
| Karten | Jede `playable_mvp` Karte hat Kartentest und Manifest-Eintrag. |

### 8.3 Eintrittskriterien für MVP-0.2-Testphase

| Kriterium | Bedingung |
|---|---|
| MVP-0.1-Gates bestanden | Engine, PlayerViews, EventLog und LegalActions sind stabil genug. |
| Match-Modell vorhanden | MatchStatus, Sessions, Tokens, EventLog, Snapshots, Receipts sind modelliert. |
| Storage-Adapter vorhanden | SQLite oder testbarer In-Memory-Adapter mit gleicher Schnittstelle. |
| WebSocket-Harness vorhanden | Zwei Seiten können getrennt simuliert werden. |
| Visibility-Oracle erweitert | Oracle prüft REST, WebSocket, Reconnect, Undo und Errors. |

### 8.4 Austrittskriterien für MVP 0.2

| Kriterium | Pass/Fail |
|---|---|
| Match-Erstellung und Join | privates Match mit Host-Seite und Join-Link funktioniert; Join übernimmt genau freie Seite. |
| Serverautorität | falsche Seite, falscher Token, falscher Timingpunkt, illegale Action und stale StateVersion werden abgelehnt. |
| WebSocket-Sync | beide Seiten erhalten aktuelle StateVersion, passende PlayerView und LegalActions. |
| Idempotency/Concurrency | doppelte oder gleichzeitige Actions erzeugen keine doppelte Transition und keinen inkonsistenten State. |
| Reconnect | Reconnect funktioniert in Action Phase, Run, Encounter und Access. |
| Undo | Undo vor Hidden Info funktioniert mit Zustimmung; Undo nach Hidden-Info-Barrier wird blockiert. |
| Persistenz | Match, State, Events, Snapshots, Sessions und Receipts werden gespeichert und nach Neustart wiederhergestellt oder sauber pausiert. |
| Visibility | keine Leaks in WebSocket, Reconnect, EventLog, Undo, Errors, Logs oder Debug-Panel. |
| E2E | Zwei Browser-Kontexte spielen deterministische Beispielpartie bis Agenda-Sieg oder Test-Siegwert. |

---

## 9. Traceability-Matrix

### 9.1 MVP 0.1

| Anforderung | Testabdeckung | Test-ID-Bereiche |
|---|---|---|
| Deterministisches Setup | Unit, Szenario, Replay | SET, REP |
| LegalActions und PlayerActions getrennt | Unit, Negative Tests, KI | ACT, NEG, AI |
| Grundaktionen | Unit, Szenario | BAS |
| State Machine | Unit, Szenario, Invariant | STM, INV |
| Run Engine | Szenario, Kartentest, E2E | RUN, CARD, E2E |
| Access/Breach | Szenario, Visibility, Replay | ACC, VIS, REP |
| Scoring und Sieg | Szenario, Unit | SCO, WIN |
| PlayerViews | Visibility-Oracle, Snapshot-Vergleich | VIS |
| EventLog/Replay/Zufall | Replay, Seed-Tests | EVT, REP, RNG |
| Corp-KI | KI-Harness, 100-Turn-Soak | AI |
| Demo-Karten | Kartentests | CARD |

### 9.2 MVP 0.2

| Anforderung | Testabdeckung | Test-ID-Bereiche |
|---|---|---|
| Private Match-Erstellung | REST Integration, E2E | API, E2E |
| Join-Link und Tokens | REST, Auth-Negativtests, Security | AUTH, API, SEC |
| WebSocket-Verbindung | WS Integration, E2E | WS, E2E |
| Serverautoritative Action-Pipeline | Integration, Negative Tests | PIPE, NEG |
| PlayerView-Härtung | Visibility-Oracle über alle Payloads | VIS, WS, API |
| Reconnect/Disconnect | Integration, E2E | REC |
| ChoiceRequests/Priority | Engine und WS | CHO, WS |
| Undo mit Zustimmung | Integration, Replay, Snapshot | UND, PER |
| Idempotency/Locking | Concurrency, Storage | CON, PIPE, PER |
| Persistenz/Snapshots | DB-Integration, Crash Recovery | PER |
| UI-Zustände | E2E, manuelle Checks | UI, E2E |

---

## 10. Detail-Testkatalog

Die folgenden Testfälle sind als Startkatalog zu verstehen. Für jede implementierte Karte, jeden neuen Timingpunkt und jeden Bugfix wird der Katalog erweitert.

### 10.1 Setup, Determinismus und Grundzustand

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| SET-001 | P0 | Deterministisches Setup | Seed `mvp_setup_001` | `createGame` zweimal mit identischer Config | Starthände, Deckreihenfolge, StateHash identisch | Unit |
| SET-002 | P0 | Unterschiedliche Seeds | zwei verschiedene Seeds | `createGame` je Seed | RandomState und Deckreihenfolge unterscheiden sich kontrolliert | Unit |
| SET-003 | P0 | Karten existieren eindeutig | initiales Match | `validateGameState` | Jede CardInstance liegt genau in einer Zone | Unit/Invariant |
| SET-004 | P1 | Startressourcen | initiales Match | Views und State prüfen | Credits, Clicks, Score, Hand, Decks gemäß MVP-Config | Unit |
| SET-005 | P1 | Identitäten ohne aktive Ability | initiales Match | LegalActions zu Spielstart prüfen | Keine ID-Sonderfähigkeit wird angeboten | Unit |
| SET-006 | P1 | Baseline-Marker | initiales Match | Baseline auslesen | RulesVersion, EngineSchemaVersion, DeckMode gesetzt | Unit |
| SET-007 | P0 | Initiale PlayerViews | initiales Match | `getPlayerView` für Runner/Corp | Runner sieht keine Corp-HQ/R&D-Details; Corp sieht keine Runner-Grip-Details | Visibility |

### 10.2 Engine-Actions und Invarianten

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| ACT-001 | P0 | LegalAction wird akzeptiert | initiales Match, aktive Seite | erste LegalAction über `applyAction` | Action akzeptiert, Event erzeugt, StateVersion erhöht | Unit |
| ACT-002 | P0 | Manipulierte Action wird abgelehnt | gültige LegalAction kopieren | Side ändern | `ACTION_WRONG_SIDE` oder Engine-Ablehnung, kein Statewechsel | Unit/Negative |
| ACT-003 | P0 | Stale StateVersion | aktuelle Action mit alter Version | `applyAction` | Ablehnung, keine Transition | Unit/Integration |
| ACT-004 | P0 | Ungültiges Target | Install/Run mit falschem Target | `applyAction` | Ablehnung ohne private Details | Unit/Negative |
| ACT-005 | P0 | Kostenprüfung | Karte teurer als vorhandene Credits | Action submitten | Ablehnung, Credits unverändert | Unit |
| ACT-006 | P0 | Click-Verbrauch | Click-Aktion ausführen | State nach Action prüfen | Clicks um 1 reduziert, nicht negativ | Unit |
| ACT-007 | P0 | Keine Actions bei 0 Clicks | aktive Seite mit 0 Clicks | `getLegalActions` | keine click-kostenpflichtigen Actions | Unit |
| ACT-008 | P0 | Event pro erfolgreicher Transition | beliebige gültige Action | EventLog prüfen | mindestens ein GameEvent mit before/after und hash | Unit |
| ACT-009 | P0 | StateValidation nach Action | gültige Action | Spy/Hook oder Ergebnis prüfen | `validateGameState` erfolgreich | Unit |
| ACT-010 | P1 | LegalActions neu berechnet | nach Action | `getLegalActions` vorher/nachher | Actions reflektieren neuen Zustand | Unit |

### 10.3 Grundaktionen und Kartenbewegungen

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| BAS-001 | P0 | Credit nehmen | aktive Seite | `gain_credit` | Credits +1, Click -1, Event | Unit |
| BAS-002 | P0 | Karte ziehen | aktive Seite mit Karten im Stack/R&D | `draw_card` | Karte bewegt sich korrekt in Grip/HQ, Zone eindeutig | Unit |
| BAS-003 | P0 | Runner installiert Program | Runner-Hand enthält Breaker, genug Credits/MU | `install_card` | Program in Rig, Credits reduziert, MU belegt | Unit/Szenario |
| BAS-004 | P0 | Runner-Memory-Grenze | Runner hat fast volle MU | zusätzliches Program installieren | Legal nur wenn MU verfügbar oder Pflicht-Trash vorbereitet | Unit |
| BAS-005 | P0 | Corp installiert ICE | Corp-Hand enthält ICE | ICE vor Zielserver installieren | ICE verdeckt in Server-Ice-Zone, Credits/Clicks korrekt | Unit/Szenario |
| BAS-006 | P0 | Corp erstellt Remote | Corp installiert Agenda/Asset in neuem Remote | `install_card` | Remote existiert, Root-Karte verdeckt | Unit |
| BAS-007 | P1 | Operation spielen | Corp hat Simple Economy Operation | `play_operation` | Corp +4 Credits, Karte in Archives | Unit/Card |
| BAS-008 | P1 | Event spielen | Runner hat Simple Economy Event | `play_event` | Runner +4 Credits, Karte in Heap | Unit/Card |
| BAS-009 | P1 | End Turn | aktive Seite hat Action | `end_turn` | Turnwechsel, Clicks/Phase korrekt | Unit/Szenario |
| BAS-010 | P1 | Corp-Pflichtdraw | Corp-Zugbeginn | Turnwechsel zu Corp auslösen | Corp zieht Pflichtkarte oder definierter MVP-Ablauf | Szenario |

### 10.4 Run Engine

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| RUN-001 | P0 | Run auf ungeschütztes R&D | R&D ohne ICE, Agenda oben | `run_server(rd)` bis Access | Run success, Access öffnet oberste R&D-Karte | Szenario |
| RUN-002 | P0 | Run auf geschütztes R&D, Corp rezzt ICE | R&D mit unrezzed Barrier, Corp genug Credits | Run starten, Corp rezzt | ICE wird rezzed, Credits reduziert, Runner sieht Titel erst nach Rez | Szenario/Visibility |
| RUN-003 | P0 | Ungebrochene End-the-run-Subroutine | gerezzte Barrier, Runner bricht nicht | Subroutine auflösen | Run endet, kein Access | Szenario |
| RUN-004 | P0 | Barrier wird mit Fracter gebrochen | Runner hat Simple Fracter, genug Credits | Pump falls nötig, Break ETR | Subroutine broken, ICE passiert | Szenario/Card |
| RUN-005 | P0 | Falscher Breaker kann Subroutine nicht brechen | Runner hat Decoder gegen Barrier | Break versuchen | Action nicht legal oder wird abgelehnt | Unit/Card |
| RUN-006 | P0 | Code Gate mit zwei Subroutinen | Simple Code Gate rezzed | Runner bricht nur ETR | Corp erhält ggf. Credit, Run geht weiter | Szenario |
| RUN-007 | P1 | Sentry-Strafwirkung | Simple Sentry rezzed, Runner bricht nicht erste Subroutine | Subroutine auflösen | Runner verliert bis zu 2 Credits, ETR beendet Run | Szenario |
| RUN-008 | P1 | Simple Run Event startet Run | Runner hat Simple Run Event | Event spielen, Server wählen | Run startet aus Karteneffekt; bei Success +2 Credits | Szenario/Card |
| RUN-009 | P1 | Serverwahl validieren | Runner wählt nicht existierenden Server | RunAction submitten | Ablehnung ohne Statewechsel | Unit/Negative |
| RUN-010 | P1 | Run-Ende räumt temporären State auf | beliebiger abgeschlossener Run | State prüfen | currentRun/currentAccess/PendingChoice zurückgesetzt | Unit/Invariant |
| RUN-011 | P1 | Jack-out nicht fälschlich angeboten | MVP-Timing ohne Jack-out-Erlaubnis | LegalActions prüfen | `jack_out` nur in erlaubten Timingpunkten | Unit |
| RUN-012 | P0 | Rez-Choice ist Corp-only | Runner läuft auf unrezzed ICE | Payloads prüfen | Corp erhält Rez-Option mit Kartendetail; Runner nur Wartezustand | Visibility/WS |

### 10.5 Access, Breach, Steal und Trash

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| ACC-001 | P0 | R&D-Access auf Agenda | Agenda oben auf R&D | erfolgreicher Run | Runner kann Agenda stehlen, R&D-Reihenfolge sonst verborgen | Szenario/Visibility |
| ACC-002 | P0 | HQ random access deterministisch | HQ mit mehreren Karten, Seed | erfolgreicher HQ-Run | ausgewählte Karte reproduzierbar, RandomDrawRecord vorhanden | Szenario/Replay |
| ACC-003 | P0 | HQ-Access leakt keine nicht gezogenen Karten | HQ random access | PublicEvent und RunnerView prüfen | nur legal aufgedeckte Karte sichtbar; keine anderen HQ-Karten | Visibility |
| ACC-004 | P0 | Archives facedown verborgen bis Breach | facedown Archives-Karten | RunnerView vor/nach Breach | vor Breach verborgen, während erlaubtem Access sichtbar | Visibility/Szenario |
| ACC-005 | P0 | Remote Agenda Steal | Remote mit Agenda, Run success | Access, steal | Runner Score + Agenda Points, Karte in Runner Score Area | Szenario |
| ACC-006 | P1 | Trashbares Asset | Remote mit rezzed Asset, Runner genug Credits | Access, trash | Runner zahlt Trash Cost, Asset in Archives | Szenario/Card |
| ACC-007 | P1 | Trash-Kosten nicht bezahlbar | Runner hat zu wenige Credits | Access Asset | Trash-Action nicht legal oder Ablehnung | Unit/Card |
| ACC-008 | P1 | Nicht trashbare Agenda | Runner accesses Agenda | LegalActions | kein Trash, nur Steal/Weiter | Unit |
| ACC-009 | P0 | CurrentAccess nach Entscheidung geräumt | Access abgeschlossen | State prüfen | keine alte Access-Referenz im State | Invariant |
| ACC-010 | P0 | Access erzeugt Hidden-Info-Barrier | HQ/R&D/Archives-fd Access | Event prüfen | `hiddenInformationBarrier` gesetzt | Unit/Undo |

### 10.6 Scoring und Siegbedingungen

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| SCO-001 | P0 | Agenda advancen | Corp Remote mit Agenda | `advance_card` | Advancement +1, Click/Credit korrekt | Unit/Szenario |
| SCO-002 | P0 | Score nicht vor Requirement | Agenda mit <3 Advancements | `score_agenda` versuchen | nicht legal oder Ablehnung | Unit |
| SCO-003 | P0 | Score bei Requirement | Agenda mit 3 Advancements | `score_agenda` | Agenda in Corp Score Area, Punkte +2 | Szenario |
| SCO-004 | P0 | Runner Agenda-Sieg | Test-Siegwert erreicht | Runner stiehlt Agenda | Winner Runner gesetzt, Match Ende vorbereitet | Szenario |
| SCO-005 | P0 | Corp Agenda-Sieg | Test-Siegwert erreicht | Corp scored Agenda | Winner Corp gesetzt | Szenario |
| SCO-006 | P0 | Keine Actions nach Game Over | Winner gesetzt | `getLegalActions` / SubmitAction | keine Spielactions, Submit abgelehnt | Unit/Integration |

### 10.7 PlayerViews und Hidden-Info-Sicherheit

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| VIS-001 | P0 | RunnerView ohne HQ-Details | Corp HQ enthält Demo-Karten | `getPlayerView(runner)` | keine HQ-Titel, IDs, Kosten, Typen | Visibility |
| VIS-002 | P0 | RunnerView ohne R&D-Reihenfolge | Corp R&D bekannt im FullState | RunnerView prüfen | nur Kartenanzahl, keine Reihenfolge/Titel | Visibility |
| VIS-003 | P0 | RunnerView ohne unrezzed ICE-Titel | unrezzed ICE vor R&D | RunnerView prüfen | verdeckte Karte ohne Titel/CardId | Visibility |
| VIS-004 | P0 | CorpView ohne Runner-Grip-Details | Runner-Hand enthält Karten | CorpView prüfen | keine Runner-Handtitel/CardIds | Visibility |
| VIS-005 | P0 | PublicEvent ohne private Payloads | geheime Kartenbewegung | PublicEvent prüfen | keine verdeckten Karteninformationen | Visibility |
| VIS-006 | P0 | Error ohne private Details | Runner versucht illegales Target auf unrezzed ICE | Error prüfen | generischer Fehler, kein Titel/CardId | Visibility/Negative |
| VIS-007 | P0 | LegalActions seitengefiltert | Rez-Choice offen | Runner- und Corp-Actions prüfen | Rez-Action nur Corp; Runner sieht Wartezustand | Visibility |
| VIS-008 | P0 | ChoiceRequest seitengebunden | Access- oder Rez-Choice | Payloads prüfen | Optionsdetails nur für berechtigte Seite | Visibility/WS |
| VIS-009 | P0 | Reconnect nicht detailreicher | Runner reconnectet | Bootstrap mit normalem StateUpdate vergleichen | keine zusätzlichen privaten Felder | Visibility/REC |
| VIS-010 | P0 | Undo-Blockgrund nicht privat | Undo nach HQ Access | Undo-Response prüfen | allgemeiner Blockgrund, keine Kartennennung | Visibility/UND |
| VIS-011 | P0 | Debug-Panel ohne FullState im Spielerclient | normaler Matchclient | DOM/Netzwerk prüfen | kein FullState, keine Tokens, keine internen IDs | E2E/Visibility |
| VIS-012 | P0 | Logs ohne Tokens/Kartenleaks | Tokenfehler, Actionfehler | Server-/Client-Logs scannen | keine Token, keine verbotenen privaten Kartendaten | Security |

### 10.8 EventLog, Replay und Zufall

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| EVT-001 | P0 | Event enthält StateVersion before/after | beliebige Action | Event prüfen | before = alter State, after = neuer State | Unit |
| EVT-002 | P0 | StateHash nach jeder Action | Action-Sequenz | Events prüfen | jeder Event hat resultingStateHash | Unit |
| EVT-003 | P0 | Public/Private getrennt | geheime Aktion/Access | EventPayload prüfen | private Details nur in `privatePayload[side]` | Unit/Visibility |
| RNG-001 | P0 | Shuffle reproduzierbar | Seed | Setup replayen | gleiche Reihenfolge und RandomCounter | Unit |
| RNG-002 | P0 | HQ random access dokumentiert | HQ-Access | Event prüfen | RandomDrawRecord mit Zweck, Counter, Ergebnis | Unit/Replay |
| REP-001 | P0 | Beispielpartie replaybar | EventLog einer Partie | `replayEvents` | finaler StateHash identisch | Replay |
| REP-002 | P0 | Replay bricht bei Event-Manipulation | EventLog mit verändertem Event | Replay | Hash-Abweichung wird erkannt | Replay/Negative |
| REP-003 | P1 | Sichtgefilterter Replay | Spieler-Replay laden | Payload prüfen | keine privaten Daten der Gegenseite | Visibility/Replay |
| REP-004 | P1 | Multiplayer-EventLog replaybar | 0.2-Match mit WS-Actions | Replay aus Snapshot/EventLog | finaler StateHash identisch | Integration |

### 10.9 Demo-Kartentests

| ID | Prio | Karte | Testfokus | Erwartung | Automatisierung |
|---|---:|---|---|---|---|
| CARD-R-001 | P1 | Runner Identity | keine aktive Ability | LegalActions enthalten keine ID-Ability | Unit |
| CARD-R-002 | P1 | Simple Economy Event | Kosten, Effekt, Ablage | Kosten 0, Runner +4 Credits, Karte in Heap | Unit/Card |
| CARD-R-003 | P1 | Simple Run Event | Run-Start und Success-Bonus | Run startet; bei Erfolg +2 Credits | Szenario/Card |
| CARD-R-004 | P0 | Simple Fracter | Pump/Break Barrier | nur Barrier-Subroutinen brechbar | Unit/Card |
| CARD-R-005 | P0 | Simple Decoder | Pump/Break Code Gate | nur Code-Gate-Subroutinen brechbar | Unit/Card |
| CARD-R-006 | P0 | Simple Killer | Pump/Break Sentry | nur Sentry-Subroutinen brechbar | Unit/Card |
| CARD-C-001 | P1 | Corp Identity | keine aktive Ability | LegalActions enthalten keine ID-Ability | Unit |
| CARD-C-002 | P0 | Simple Agenda | Score/Steal | 3 Advancement Requirement, 2 Agenda Points | Szenario/Card |
| CARD-C-003 | P1 | Simple Economy Operation | Kosten, Effekt, Ablage | Corp +4 Credits, Karte in Archives | Unit/Card |
| CARD-C-004 | P1 | Simple Economy Asset | Rez-Effekt, Trash Cost | Rez kostet 1, Corp +3, Runner trash für 3 | Szenario/Card |
| CARD-C-005 | P0 | Simple Barrier ICE | ETR, Stärke, Rez | Rez 3, Stärke 3, Barrier, ETR | Szenario/Card |
| CARD-C-006 | P0 | Simple Code Gate ICE | mehrere Subs | Corp +1 und ETR separat auflös-/brechbar | Szenario/Card |
| CARD-C-007 | P0 | Simple Sentry ICE | Credit Loss und ETR | Runner verliert bis zu 2 Credits, ETR | Szenario/Card |

### 10.10 Corp-KI MVP 0.1

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| AI-001 | P1 | KI wählt nur LegalActions | beliebiger Corp-Zustand | KI-Entscheidung prüfen | gewählte Action ist in `getLegalActions(corp)` | Unit |
| AI-002 | P1 | KI-Fallback | leerer/unklarer Plan | KI-Zug ausführen | Fallback ist legal, kein Hängenbleiben | Unit |
| AI-003 | P1 | Timeout | KI künstlich verlangsamt | KI-Aufruf | Timeout greift, Fallback wird genutzt | Unit |
| AI-004 | P1 | 100-Züge-Soak | Demo-Match | KI spielt 100 Corp-Entscheidungen gegen Script/Runner | keine illegale Action, keine Invariant-Verletzung | Soak |
| AI-005 | P0 | KI erhält keine verbotenen Daten | Corp-KI/Input oder spätere Runner-KI | KI-Input prüfen | nur PlayerView/PublicEvents/LegalActions der KI-Seite | Visibility |

### 10.11 REST API MVP 0.2

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| API-001 | P0 | Match erstellen als Runner | kein Match | `POST /api/matches` hostSide runner | Match waiting, Host Runner, Invite für Corp | Integration |
| API-002 | P0 | Match erstellen als Corp | kein Match | hostSide corp | Host Corp, Joiner Runner | Integration |
| API-003 | P1 | Random-Seitenwahl | hostSide random, Seed | Match erstellen | Seite deterministisch aus Seed, geloggt | Integration |
| API-004 | P0 | Join-Info minimal | waiting Match | `GET join-info` | keine privaten Kartendaten, verfügbare Seite, RulesVersion | Integration/Visibility |
| API-005 | P0 | Join mit gültigem Token | waiting Match | `POST join` | SessionToken seitenspezifisch, Status ready | Integration |
| API-006 | P0 | Join mit falschem Token | waiting Match | falschen Token senden | Ablehnung ohne Matchdetails/Side-Leak | Integration/Security |
| API-007 | P0 | Join zweites Mal | bereits beigetreten | Join-Link erneut verwenden | keine doppelte Seitenübernahme; ggf. Reconnect-Regel | Integration |
| API-008 | P0 | Bootstrap validiert Token | gültige Session | `GET bootstrap` | PlayerView nur für Side, LegalActions passend | Integration/Visibility |
| API-009 | P0 | Bootstrap mit falscher Seite | Runner-Token für Corp | Request manipulieren | Ablehnung, keine Daten | Integration/Security |
| API-010 | P1 | Replay-Endpunkt gefiltert | optionaler Replay aktiv | Replay laden | Spieler-Replay sichtbarkeitsgefiltert | Integration/Visibility |

### 10.12 WebSocket und Action-Pipeline

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| WS-001 | P0 | WS Join mit gültiger Session | Match ready | `join_match` senden | `match_joined`, StateVersion, ProtocolVersion | Integration |
| WS-002 | P0 | WS Join mit falschem Token | Match vorhanden | falsche Session | `AUTH_INVALID_TOKEN`, keine State-Daten | Integration/Security |
| WS-003 | P0 | Beide Seiten verbinden | Match ready | Runner und Corp verbinden | beide erhalten eigene PlayerView | Integration/Visibility |
| WS-004 | P0 | Submit gültige Action | active Match | Runner nimmt Credit | Receipt accepted, StateUpdate beide Seiten | Integration |
| WS-005 | P0 | Falsche Side in Action | Runner-Session sendet Corp-Action | submit | `ACTION_WRONG_SIDE`, keine Transition | Integration/Negative |
| WS-006 | P0 | Illegaler Timingpunkt | Corp sendet Action im Runner-only Timing | submit | Ablehnung, Resync möglich | Integration |
| WS-007 | P0 | Stale Action | ClientKnownStateVersion alt | submit | `ACTION_STALE_STATE_VERSION`, aktuelle View/Actions gesendet | Integration |
| WS-008 | P0 | Duplicate Idempotency | gleiche Nachricht zweimal | submit x2 | eine Transition, zweiter Receipt identisch | Integration/Concurrency |
| WS-009 | P0 | gleicher Key, anderer Inhalt | gleicher Key, geänderte Action | submit | Ablehnung, kein zweiter Statewechsel | Integration/Concurrency |
| WS-010 | P0 | Versandregel nach Transition | gültige Action | Nachrichten mitschneiden | Receipt, StateUpdate, LegalActions, EventLogUpdate seitenspezifisch | Integration |
| WS-011 | P1 | Ping/Pong | WS verbunden | `ping` | `pong`, lastSeen aktualisiert | Integration |
| WS-012 | P0 | Error-Payload sichtbarkeitsgefiltert | absichtlich illegal | Error prüfen | keine privaten Kartendaten, keine Token | Visibility |

### 10.13 Concurrency, Locking und Idempotency

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| CON-001 | P0 | Zwei Actions gleichzeitig | active Match, aktive Seite hat zwei mögliche Actions | zwei submits parallel | nur eine Transition; andere stale oder nach Lock neu bewertet | Concurrency |
| CON-002 | P0 | Rapid Double Click | UI/Button oder WS sendet gleiche Action doppelt | parallel senden | eine Transition, gespeicherter Receipt | E2E/Integration |
| CON-003 | P0 | Lock-Freigabe bei Engine-Fehler | EngineResult invalid simulieren | submit | Lock wird freigegeben, Match nicht dauerhaft blockiert | Integration |
| CON-004 | P0 | Lock schützt DB-Write | SQLite aktiv | parallele Actions | EventLog und State atomar konsistent | Integration/DB |
| CON-005 | P1 | Action während Undo pending | Undo-Anfrage offen | Action submitten | gemäß Regel blockiert oder eindeutig behandelt | Integration |
| CON-006 | P1 | Action während Reconnect | eine Seite reconnectet, andere sendet Action | parallel | keine doppelte Connection- oder State-Korruption | Integration |

### 10.14 Reconnect und Disconnect

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| REC-001 | P0 | Disconnect aktiver Spieler | active Match | aktive WS-Verbindung schließen | Match `paused_disconnect` oder definierter Wartezustand | Integration |
| REC-002 | P1 | Disconnect nichtaktiver Spieler | active Match | nichtaktive Seite schließen | Gegner sieht Status; kritische Choices blockieren | Integration/E2E |
| REC-003 | P0 | Reconnect Action Phase | Spieler disconnected in Action Phase | reconnect mit Token | gleiche PlayerView/LegalActions wie vor Disconnect | Integration |
| REC-004 | P0 | Reconnect bei Corp Rez-Choice | RezChoice offen | Corp disconnected/reconnect | Corp erhält dieselbe RezChoice, Runner nicht | Integration/Visibility |
| REC-005 | P0 | Reconnect bei Runner Encounter | Encounter offen | Runner reconnect | Runner erhält passende Breaker-/Pass-Optionen | Integration |
| REC-006 | P0 | Reconnect bei CurrentAccess | AccessChoice offen | Runner reconnect | gleiche Access-Entscheidung, keine Zusatzinfos | Integration/Visibility |
| REC-007 | P0 | Alte Connection ersetzen | gleiche Seite verbindet erneut | alte und neue WS aktiv | alte Connection stale; nur neue erhält Updates | Integration |
| REC-008 | P0 | Reconnect falsche Seite | Runner-Token versucht Corp | reconnect | Ablehnung ohne private Daten | Security |
| REC-009 | P1 | Serverneustart + Reconnect | active Match, SQLite | Server stoppen/starten, reconnect | Match aus Snapshot/EventLog wiederhergestellt oder sauber pausiert | Recovery |

### 10.15 Undo

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| UND-001 | P0 | Undo-Anfrage vor Hidden Info | mehrere öffentliche Actions | RequestUndo zu früherem Event | Gegner erhält Anfrage | Integration |
| UND-002 | P0 | Gegner akzeptiert Undo | UND-001 pending | Respond accept | State auf TargetVersion, Undo-Systemevent, neue Views | Integration/Replay |
| UND-003 | P1 | Gegner lehnt Undo ab | pending | Respond decline | State unverändert, Status declined | Integration |
| UND-004 | P0 | Undo nach HQ Access blockiert | Hidden-Info-Barrier seit Target | RequestUndo | `UNDO_BLOCKED_BY_HIDDEN_INFORMATION`, kein privater Grund | Integration/Visibility |
| UND-005 | P0 | Undo nach R&D Access blockiert | Runner sah R&D-Karte | RequestUndo vor Access | blockiert | Integration |
| UND-006 | P0 | Snapshot nicht verfügbar | alter TargetState ohne Snapshot/Replay | RequestUndo | kontrollierte Ablehnung `snapshot_not_available` | Integration |
| UND-007 | P0 | Undo bei finished Match | Match beendet | RequestUndo | blockiert oder nicht verfügbar | Integration |
| UND-008 | P1 | Undo-Timeout | pending Undo, Fake Clock | Zeit überschreiten | expired, State unverändert | Integration |
| UND-009 | P0 | Undo-Payload ohne verdeckte Details | blockierter Undo | Payload prüfen | keine Kartentitel/CardIds/RandomDetails | Visibility |
| UND-010 | P0 | Replay nach Undo | akzeptiertes Undo und weitere Actions | replayEvents | finaler StateHash identisch | Replay |

### 10.16 Persistenz, Snapshots und Migration

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| PER-001 | P0 | Match persistiert | Match erstellt | DB prüfen | Match, Status, Baseline, Settings gespeichert | Integration/DB |
| PER-002 | P0 | State persistiert nach Action | Action akzeptiert | DB prüfen | match_states aktualisiert, StateHash korrekt | Integration/DB |
| PER-003 | P0 | Event atomar gespeichert | Action akzeptiert | DB prüfen | Event und State-Version konsistent | Integration/DB |
| PER-004 | P0 | ActionReceipt gespeichert | WS Submit | DB prüfen | Receipt mit Key, Side, before/after | Integration/DB |
| PER-005 | P0 | Duplicate nach Neustart | Action gesendet, Server restart, gleiche Action erneut | submit | gespeicherter Receipt, keine zweite Transition | Recovery |
| PER-006 | P0 | Snapshot alle N Events | SnapshotEveryEvents=10 | 10+ Events spielen | Snapshot bei erwarteter Version | Integration/DB |
| PER-007 | P0 | Snapshot bei Hidden-Info-Barrier | Access-Event | DB prüfen | Snapshot nach/vor Barrier gemäß Regel | Integration |
| PER-008 | P0 | Recovery aus Snapshot + EventLog | Match mit Snapshot | State laden/replayen | StateHash entspricht gespeichertem State | Recovery |
| PER-009 | P1 | Schema-Versionen | neue DB/Match | Marker prüfen | engineSchemaVersion, multiplayerProtocolVersion, playerViewSchemaVersion gesetzt | Integration |
| PER-010 | P1 | Alte Replays read-only | 0.1 Replay | laden | read-only oder sauber migriert | Migration |

### 10.17 Sicherheit und Betrieb

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| SEC-001 | P0 | Token nie im Klartext gespeichert | Match/Session erstellt | DB und Logs prüfen | nur Hash, kein Klartexttoken | Security |
| SEC-002 | P0 | Token nicht in PublicEvents | Match erstellen/joinen | EventLog prüfen | keine Tokens/SessionTokens | Security/Visibility |
| SEC-003 | P0 | Hohe Token-Entropie | Token-Generator | viele Tokens erzeugen | Länge/Entropie nach Vorgabe, keine Duplikate | Unit/Security |
| SEC-004 | P1 | Token-Ablauf | abgelaufenes Token | Join/Reconnect | Ablehnung ohne Details | Integration |
| SEC-005 | P1 | Revoked Token | Token widerrufen | Join/Reconnect | Ablehnung | Integration |
| SEC-006 | P1 | Rate Limit Join | viele falsche Joins | Requests senden | Limit greift, keine Matchdetails | Integration |
| SEC-007 | P1 | Rate Limit Actions | >5 Actions/sec Session | senden | Limit oder Idempotency/Backpressure greift | Integration |
| SEC-008 | P1 | Origin/CORS | nicht erlaubter Origin | Request/WS | abgelehnt gemäß Konfiguration | Integration |
| SEC-009 | P0 | Full-State-Debug nicht remote | private-server-smoke | Client/Netzwerk prüfen | kein FullState endpoint/payload im Spielerclient | E2E/Security |
| SEC-010 | P1 | Docker/Lokalstart Smoke | Build vorhanden | App starten | Health/Startscreen erreichbar, Tests können laufen | Smoke |

### 10.18 UI und End-to-End

| ID | Prio | Test | Vorbedingung | Schritte | Erwartung | Automatisierung |
|---|---:|---|---|---|---|---|
| UI-001 | P1 | Startscreen Match erstellen | App offen | Seite wählen, Seed optional | Match wird erstellt, Invite-Link kopierbar | E2E |
| UI-002 | P1 | Waiting Lobby | Host wartet | Lobby ansehen | Host-Seite, Status, Invite-Link sichtbar; keine Tokens offen außer Link | E2E |
| UI-003 | P1 | Join Screen | Join-Link öffnen | Join bestätigen | freie Seite sichtbar, Spiel verbindet | E2E |
| UI-004 | P0 | Zwei Browser getrennte Sessions | Host/Join in separaten Kontexten | Spiel starten | beide sehen eigene Seite, getrennte PlayerViews | E2E/Visibility |
| UI-005 | P1 | LegalAction Button deaktiviert während Send | Action klicken | während Pending erneut klicken | kein doppelter Statewechsel | E2E/Concurrency |
| UI-006 | P1 | Gegner am Zug | Choice Gegnerseite | UI prüfen | keine eigenen irrelevanten Buttons, Wartezustand | E2E |
| UI-007 | P1 | Stale Resync Anzeige | künstlich stale Action | UI prüft Error/Resync | Actions werden aktualisiert | E2E |
| UI-008 | P1 | Reconnect-Banner | Verbindung verlieren | UI prüfen | Disconnect/Reconnect klar sichtbar | E2E |
| UI-009 | P1 | Undo Dialog | Undo verfügbar | Anfrage/Antwort | Dialog korrekt, Ergebnis sichtbar | E2E |
| UI-010 | P0 | EventLog ohne private Details | mehrere geheime Aktionen | DOM prüfen | keine verbotenen Kartentitel/IDs | E2E/Visibility |
| E2E-001 | P0 | Vollständige Beispielpartie | zwei Browser, Seed | Match erstellen, joinen, Run, Rez, Break/ETR, Steal, Score, Reconnect, Undo, Finish | Partie beendet deterministisch, Replay-Hash stimmt | E2E |
| E2E-002 | P0 | E2E mit Serverneustart | SQLite aktiv | mitten im Match Server neu starten, reconnecten | Match fortsetzbar oder sauber pausiert | E2E/Recovery |

---

## 11. Abnahmeszenarien

### 11.1 MVP-0.1-Abnahmeszenario: Engine-Grundspiel

1. Spiel mit `mvp_setup_001` starten.
2. Runner nimmt Credit, zieht Karte, installiert Simple Fracter.
3. Runner spielt Simple Economy Event.
4. Runner beendet Zug.
5. Corp zieht Pflichtkarte.
6. Corp spielt Simple Economy Operation.
7. Corp installiert Simple Barrier ICE vor R&D.
8. Corp installiert Simple Agenda in Remote.
9. Corp beendet Zug.
10. Runner startet Run auf R&D.
11. Corp rezzt Simple Barrier ICE.
12. Runner bricht ETR oder Run endet durch ETR, je nach Testpfad.
13. Corp advanced Remote-Agenda über mehrere Züge.
14. Corp scored Simple Agenda.
15. Runner führt später erfolgreichen Run auf R&D/Remote durch und stiehlt Simple Agenda.
16. Eine definierte Siegbedingung wird erreicht.
17. EventLog wird replayt; finaler StateHash stimmt.
18. Visibility-Oracle prüft alle PlayerViews und PublicEvents der Partie.

### 11.2 MVP-0.2-Abnahmeszenario: Private Human-vs-Human-Partie

1. Host erstellt privates Match als Runner.
2. Host erhält Runner-Session, Host-Reconnect-Link und Invite-Link.
3. Joiner öffnet Invite-Link und übernimmt Corp.
4. Beide Browser verbinden per WebSocket.
5. Beide erhalten `match_joined`, `state_update`, `legal_actions` und EventLogTail.
6. Runner nimmt Credits und beendet Zug.
7. Corp installiert ICE vor R&D und beendet Zug.
8. Runner startet Run auf R&D.
9. Corp erhält private Rez-Choice; Runner sieht nur Wartezustand.
10. Corp rezzt ICE.
11. Runner nutzt passenden Breaker oder Run endet durch Subroutine.
12. Später greift Runner auf Agenda zu und stiehlt sie.
13. Corp installiert und scored eine Agenda in einem Remote.
14. Eine Seite disconnected während einer Entscheidung und reconnectet.
15. Reconnect stellt dieselbe PendingChoice ohne Zusatzinformationen wieder her.
16. Undo vor Hidden-Info-Barrier wird angefragt, akzeptiert und korrekt wiederhergestellt.
17. Undo nach HQ- oder R&D-Access wird blockiert.
18. Spiel endet durch Agenda-Sieg oder konfigurierten Test-Siegwert.
19. Multiplayer-EventLog replayt den finalen StateHash.
20. Visibility-Oracle prüft REST-, WebSocket-, Reconnect-, Undo-, Error- und EventLog-Payloads.

---

## 12. Testfallformat

Neue Tests sollten nach folgendem Format dokumentiert oder als maschinenlesbares Szenario abgelegt werden.

```json
{
  "id": "RUN-004",
  "name": "Simple Fracter breaks Simple Barrier ICE",
  "priority": "P0",
  "type": ["scenario", "card", "run"],
  "baseline": {
    "rulesVersion": "26.03",
    "engineSchemaVersion": "0.1.0",
    "deckMode": "fixed_demo_decks"
  },
  "seed": "mvp_run_break_001",
  "initialStateRef": "runner_has_all_breakers_vs_barrier_rd",
  "actions": [
    { "side": "runner", "type": "run_server", "server": "rd" },
    { "side": "corp", "type": "rez_card", "target": "ice_outermost_rd" },
    { "side": "runner", "type": "pump_breaker", "source": "simple_fracter" },
    { "side": "runner", "type": "break_subroutine", "source": "simple_fracter", "target": "barrier_etr" }
  ],
  "expected": {
    "runContinues": true,
    "brokenSubroutines": 1,
    "runnerCreditsDelta": -2,
    "noInvariantViolation": true,
    "visibilityAssertions": ["runner_saw_ice_title_only_after_rez"]
  }
}
```

Pflichtfelder für jeden automatisierten Szenariotest:

| Feld | Zweck |
|---|---|
| `id` | stabile Referenz in Defect-Reports und Traceability-Matrix |
| `priority` | Gate-Relevanz |
| `baseline` | Regeln, Engine-Schema, Kartenpool |
| `seed` | Reproduzierbarkeit |
| `initialStateRef` | eindeutige Fixture |
| `actions` | deklarative Action-Sequenz, keine UI-Schritte |
| `expected` | messbare Assertions |
| `visibilityAssertions` | explizite Leak-Prüfungen, wenn Hidden Info berührt wird |

---

## 13. Automatisierungsstrategie

### 13.1 Testpyramide

| Ebene | Anteil | Ziel |
|---|---:|---|
| Unit/Schema/Invariant | hoch | schnelle Rückmeldung für Engine, Filter, Kosten, Targets, Token |
| Szenario/Replay | hoch | regelnahe Abläufe deterministisch prüfen |
| Integration REST/WS/DB | mittel | Multiplayer- und Persistenzfehler finden |
| E2E | gering, aber kritisch | echte User-Journeys und UI-Sync prüfen |
| Manuell explorativ | ergänzend | UX-Randfälle, Timinggefühl, nicht antizipierte Sequenzen |

### 13.2 CI-Gates

| Gate | Inhalt | Blockiert Merge/Release |
|---|---|---|
| `ci:types` | Typecheck, Schema-Validierung, Lint | Ja |
| `ci:unit` | Engine-, Resolver-, Card-, Token-, Filter-Tests | Ja |
| `ci:scenario` | deterministische Szenarien, Replay, StateHash | Ja |
| `ci:visibility` | PlayerView-, Payload-, Error-, Log-Leak-Tests | Ja, P0 |
| `ci:integration` | REST, WebSocket, Storage, Action-Pipeline | Ja für 0.2 |
| `ci:concurrency` | Idempotency, Locks, parallel submits | Ja für 0.2 |
| `ci:e2e-smoke` | Match erstellen, Join, Action, StateUpdate | Ja für 0.2 |
| `nightly:e2e-full` | vollständige Beispielpartie inkl. Undo/Reconnect/Replay | Ja für Release, nicht zwingend für jeden Commit |
| `nightly:soak` | KI/Random LegalAction-Sequenzen, 100+ Seeds | Release Gate bei Fehlern |

### 13.3 Flaky-Test-Regel

Ein flakender Test wird wie ein Produktfehler behandelt, nicht ignoriert. Jeder Flake muss mindestens folgende Daten loggen:

- Seed,
- Test-ID,
- Action-Sequenz,
- StateVersion vor/nach Fehler,
- StateHash,
- EventIds,
- relevante WS-/REST-Payloads in sichtgefilterter Form,
- Storage-Adapter und Umgebung.

---

## 14. Visibility-Testdesign

### 14.1 Zu prüfende Outputs

| Output | Muss geprüft werden |
|---|---|
| `getPlayerView(gameState, runner)` | keine Corp-HQ/R&D/unrezzed/Remote-fd-Details |
| `getPlayerView(gameState, corp)` | keine Runner-Grip-/Stack-Details |
| `LegalAction[]` | nur Actions der berechtigten Seite, private Targets nur berechtigt |
| `ChoiceRequest` | Optionen nur für Side des ChoiceRequests |
| `PublicGameEvent` | keine verdeckten CardIds/Titel/RandomDetails |
| `PrivateGameEvent` | nur an berechtigte Seite gesendet |
| REST `join-info` | minimale öffentliche Matchdaten, keine Kartendaten |
| REST `bootstrap` | nicht detailreicher als PlayerViewEnvelope |
| WebSocket `state_update` | seitenspezifisch gefiltert |
| WebSocket `event_log_update` | Public + private nur für Empfänger |
| WebSocket `error` | keine private Karte, CardId, Token, FullState |
| Undo-Payloads | keine verdeckten Ursachen oder Zielkartendetails |
| Reconnect-Payloads | gleiche Sicht wie normale Updates |
| UI Debug Panel | kein FullState im normalen Spielerclient |
| Logs | keine Tokens, keine FullState-Dumps, keine private Kartendetails |

### 14.2 Beispiel für Payload-Crawler

```ts
function assertPayloadVisibleOnlyToSide(payload: unknown, side: Side, fullState: GameState) {
  const oracle = visibilityOracle(fullState, side)
  const visited = flattenJson(payload)

  for (const field of visited.fields) {
    expect(field.path).not.toMatch(/token|tokenHash|sessionToken|gameState|fullState/i)
  }

  for (const cardId of visited.cardInstanceIds) {
    expect(oracle.visibleCardInstanceIds.has(cardId)).toBe(true)
  }

  for (const cardTitleOccurrence of visited.cardTitles) {
    expect(oracle.visibleCardTitles.has(cardTitleOccurrence.title)).toBe(true)
  }
}
```

### 14.3 Negative Golden Cases

Für jede verdeckte Informationsart wird mindestens ein Test gebaut, der ohne Filter sicher fehlschlagen würde:

| Hidden-Info-Art | Negativfall |
|---|---|
| HQ-Karten | Runner erhält absichtlich ungefilterten FullState im Testdouble; Oracle muss Fehler finden. |
| R&D-Reihenfolge | Runner-Payload enthält Liste von R&D-Ids; Oracle muss Fehler finden. |
| Unrezzed ICE | Runner-Payload enthält `Simple Barrier ICE`; Oracle muss Fehler finden, solange ICE unrezzed ist. |
| Runner Grip | Corp-Payload enthält `Simple Fracter`; Oracle muss Fehler finden. |
| Token | Error enthält SessionToken; Security-Test muss Fehler finden. |
| Debug FullState | Spielerclient lädt Debug-Endpunkt; E2E muss Fehler finden. |

---

## 15. Concurrency- und Idempotency-Testdesign

### 15.1 Grundregeln

1. Idempotency-Key ist pro Match, Side und StateVersion eindeutig.
2. Identische Wiederholung einer bereits verarbeiteten Nachricht liefert denselben Receipt.
3. Derselbe Key mit anderem Inhalt wird abgelehnt.
4. Parallel eingehende Actions werden pro Match sequenziell verarbeitet.
5. Nach Lock-Freigabe muss StateVersion konsistent sein.
6. Ein Fehler in Engine oder Storage darf den Match-Lock nicht dauerhaft halten.

### 15.2 Empfohlene Race-Teststruktur

```ts
it("processes only one action per match at a time", async () => {
  const match = await createActiveMatchFixture("mvp_concurrency_001")
  const actionA = buildAction({ type: "gain_credit", idempotencyKey: "key-a" })
  const actionB = buildAction({ type: "draw_card", idempotencyKey: "key-b" })

  const [resultA, resultB] = await Promise.allSettled([
    submitAction(match.runnerSession, actionA),
    submitAction(match.runnerSession, actionB)
  ])

  const persisted = await loadMatch(match.id)
  expect(countAccepted([resultA, resultB])).toBe(1)
  expect(persisted.eventLog).toHaveLength(match.eventLog.length + 1)
  expect(validateGameState(persisted.gameState).ok).toBe(true)
})
```

---

## 16. Reconnect-Testdesign

Reconnect darf nicht nur bei ruhiger Action Phase funktionieren. Kritisch sind temporäre States.

| Timing | Warum kritisch | Muss wiederhergestellt werden |
|---|---|---|
| Action Phase | häufigster Fall | PlayerView, LegalActions, EventTail |
| Corp Rez-Choice | private Corp-Optionen | gleiche ChoiceId, gleiche legalen Rez-Optionen für Corp, Runner nur Wartezustand |
| Encounter | Runner-Breaker-Optionen | aktuelles ICE, gebrochene/ungebrochene Subs, Pump/Break-Actions |
| Access | Hidden Info sichtbar für berechtigte Seite | CurrentAccess, Steal/Trash/No-op-Optionen, keine zusätzlichen Karten |
| Undo pending | soziale Entscheidung | UndoRequestId, requester, target, keine privaten Details |
| Finished | keine Spielactions | Winner und finaler EventTail, keine neuen Actions |

Für jeden Reconnect-Test gilt: Der Payload nach Reconnect darf nicht mehr Informationen enthalten als ein normaler `state_update` plus zulässige `legal_actions` und zulässiger EventTail.

---

## 17. Undo-Testdesign

### 17.1 Sichere Undo-Zone

Eine Action-Sequenz ist undo-fähig, wenn seit dem Ziel-Event keine Hidden-Info-Barrier eingetreten ist. Beispiele:

- Credit nehmen,
- öffentliches Installieren ohne neue verdeckte Offenlegung an Gegner,
- End Turn,
- Operation/Event mit vollständig öffentlichem Effekt,
- Advancement einer bereits installierten verdeckten Agenda ist vorsichtig zu behandeln: Der Gegner darf dadurch nicht mehr Details erhalten, aber die Aktion selbst kann private Informationen über Corp-Planung betreffen. Für MVP sollte Undo hier nur erlaubt werden, wenn die definierte Regel es ausdrücklich erlaubt.

### 17.2 Blockierende Barrier-Beispiele

| Event | Blockgrund |
|---|---|
| HQ random access | `random_access_performed` |
| R&D top card gesehen | `access_card_seen` |
| facedown Archives aufgedeckt | `hidden_information_revealed` |
| Shuffle/Draw-Ergebnis wurde sichtbar | `deck_order_changed_and_seen` |
| Gegner sah private Choice-Information | `hidden_information_revealed` |

### 17.3 Restore-Prüfung

Nach akzeptiertem Undo müssen geprüft werden:

1. GameState entspricht TargetStateVersion.
2. StateHash entspricht Snapshot oder Replay-Ergebnis.
3. EventLog enthält ein Undo-Systemevent.
4. ActionReceipts nach Zielversion sind ungültig oder klar als historisch markiert.
5. PendingChoices werden neu berechnet.
6. Beide Seiten erhalten neue PlayerViews und LegalActions.
7. Keine Payload nennt private Details aus der verworfenen Zukunft.

---

## 18. Persistenz- und Recovery-Testdesign

### 18.1 Atomare Transition

Eine akzeptierte Action muss in einem atomaren Schritt speichern:

- neuen `game_state_json`,
- `state_hash`,
- Event(s),
- PublicEvent(s),
- ActionReceipt,
- ggf. Snapshot,
- MatchVersion/UpdatedAt.

Ein Test sollte einen künstlichen Fehler zwischen Event-Write und State-Write simulieren. Erwartung: entweder vollständiger Rollback oder eindeutig reparierbarer Zustand, nie ein Event ohne passenden StateHash.

### 18.2 Crash-Recovery-Pfade

| Pfad | Test |
|---|---|
| Neustart nach akzeptierter Action | Match laden, StateHash prüfen, Reconnect möglich |
| Neustart nach ActionReceipt | Duplicate Idempotency liefert gespeicherten Receipt |
| Neustart während Disconnect | Match bleibt paused oder reconnectbar |
| Neustart nach Undo | State und EventLog bleiben replaybar |
| Migration alter Daten | alte Replays read-only oder migriert, keine stillen Schemafehler |

---

## 19. Manuelle Explorations-Checkliste

Diese Checkliste ergänzt automatisierte Tests und sollte vor einer MVP-0.2-Abnahme einmal vollständig durchlaufen werden.

| Bereich | Check |
|---|---|
| Einladung | Invite-Link kopieren, in anderem Browser öffnen, Seite korrekt? |
| Zwei Geräte | Host und Joiner auf unterschiedlichen Geräten im LAN/privaten Server testen. |
| Wartezustände | Ist klar erkennbar, wer am Zug ist und wer entscheiden muss? |
| Double Click | Mehrfach schnelles Klicken auf Actions erzeugt keine doppelte Aktion. |
| Disconnect | Browser-Tab schließen, wieder öffnen, Reconnect mit gleicher Seite. |
| Access | Sieht Runner beim Access genau die erlaubte Karte und nicht mehr? |
| Rez | Sieht Runner unrezzed ICE erst nach Corp-Rez mit Titel? |
| Undo | Anfrage/Annahme/Ablehnung verständlich? Block nach Hidden Info klar, aber nicht verräterisch? |
| EventLog | Verständlich, aber ohne private gegnerische Details? |
| Fehler | Fehlermeldungen hilfreich, aber ohne interne IDs/Tokens? |
| Debug | Kein FullState im normalen Client. |
| Serverneustart | Match ist fortsetzbar oder sauber pausiert. |

---

## 20. Defect-Klassifikation

| Severity | Beschreibung | Beispiele | Release-Auswirkung |
|---|---|---|---|
| S0 Blocker | Sicherheits-/Fairness-/State-kritischer Fehler | Hidden-Info-Leak, State-Korruption, doppelte Transition, falsche Seite, Replay unbrauchbar | Kein Release |
| S1 Kritisch | Kernspiel oder Multiplayer häufig kaputt | Reconnect in Run verliert Choice, Run-Sequenz falsch, Agenda nicht scorebar | Kein Release, außer dokumentierter Nicht-Scope |
| S2 Hoch | Workaround möglich, aber MVP-Erlebnis deutlich beeinträchtigt | UI zeigt falschen Wartezustand, einzelne nichtkritische Action stale | Release nur nach Entscheidung |
| S3 Mittel | Komfort-/Darstellungsfehler | EventText unklar, Layoutproblem | Release möglich |
| S4 Niedrig | kosmetisch oder Dokumentation | Tippfehler, Debug-Beschriftung | Release möglich |

P0-Testfälle entsprechen in der Regel S0/S1-Risiken. Ein fehlgeschlagener P0-Test blockiert Merge oder Release.

---

## 21. Coverage-Policy

Line Coverage allein ist kein ausreichendes Qualitätsmaß. Für diesen MVP gelten verhaltensbasierte Mindestabdeckungen:

| Bereich | Mindestabdeckung |
|---|---|
| Public Engine API | jede Funktion mit Normalfall, Fehlerfall und mindestens einem Invariant-Test |
| ActionTypes | jeder MVP-ActionType mindestens ein positiver und ein negativer Test |
| Demo-Karten | jede Karte mindestens ein Kartentest; ICE/Breaker zusätzlich Cross-Type-Negativtest |
| Timingpunkte | jeder implementierte Timingpunkt mindestens ein Szenario |
| PlayerViews | jede verdeckte Zone mindestens ein Leak-Test je Empfängerseite |
| REST-Endpunkte | jeder Endpunkt gültiger Request, ungültiger Token, falscher Status, Visibility-Prüfung |
| WebSocket Messages | jeder ClientMessage-Typ positiver/negativer Test; jeder ServerMessage-Typ Sichtprüfung |
| Persistenz | jede Tabelle/Collection durch mindestens einen Integrationstest abgedeckt |
| Reconnect | Action Phase, Rez-Choice, Encounter, Access |
| Undo | accept, decline, hidden-info-block, snapshot-not-available |
| E2E | mindestens ein vollständiger deterministischer Zwei-Browser-Flow |

---

## 22. Release-Gates

### Gate A – Engine-Basis MVP 0.1

- SET, ACT, BAS, STM/INV, CARD P0/P1 bestanden.
- Kein bekannter State-Korruptionsfehler.
- Demo-Decks spielbar.

### Gate B – Run/Access/Scoring MVP 0.1

- RUN, ACC, SCO, WIN P0 bestanden.
- Mindestens ein Runner-Sieg und ein Corp-Sieg als deterministische Szenarien.

### Gate C – Visibility und Replay MVP 0.1

- VIS P0 bestanden.
- REP/RNG P0 bestanden.
- Keine privaten Daten in PlayerViews, PublicEvents, KI-Input oder Errors.

### Gate D – Multiplayer-Infrastruktur MVP 0.2

- API, WS, PIPE, AUTH P0 bestanden.
- Match erstellen, joinen, beide Seiten verbinden, Actions submitten.

### Gate E – Multiplayer-Robustheit MVP 0.2

- CON, REC, UND, PER P0 bestanden.
- Serverneustart-/Reconnect-Flow erfolgreich oder sauber pausiert.

### Gate F – Abnahme MVP 0.2

- E2E-001 bestanden.
- Vollständiger Replay-Hash stimmt.
- Kein offener S0/S1-Defect.
- Scope-Grenzen und bekannte Einschränkungen dokumentiert.

---

## 23. Regression und Wartung

### 23.1 Neue Karte

Eine neue Karte darf erst `playable_mvp` erhalten, wenn vorhanden sind:

1. Manifest-Eintrag mit unterstützten und nicht unterstützten Regeln.
2. Unit-Test für Kosten, Timing und Effekt.
3. Szenariotest im relevanten Spielablauf.
4. Visibility-Test, falls verdeckte Information betroffen ist.
5. Replay-Test, falls Zufall oder komplexe State-Änderung betroffen ist.
6. Regressionstest für mindestens eine bestehende Demo-Partie.

### 23.2 Neuer Timingpunkt

Ein neuer Timingpunkt benötigt:

- State-Machine-Test,
- LegalActions-Test,
- Pass/Priority-Test,
- PendingChoice-Test,
- Reconnect-Test, wenn menschliche Entscheidung möglich ist,
- Visibility-Test für ChoiceOptions.

### 23.3 Bugfix

Jeder Bugfix erhält einen Regressionstest, der ohne Fix fehlschlägt. Der Testname sollte die Defect-ID oder eine stabile Kurzbeschreibung enthalten.

---

## 24. Risiken und Gegenmaßnahmen

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---:|---:|---|
| Hidden-Info-Leak durch neues Payload-Feld | hoch | sehr hoch | zentrale Visibility-Oracle, Payload-Crawler in CI, keine FullState-DTOs im Client |
| Engine und UI entwickeln doppelte Regelinterpretation | mittel | hoch | UI zeigt nur LegalActions, Engine validiert erneut, UI-Regeltests nicht als Ersatz |
| Flaky E2E durch Timing/WebSocket | mittel | mittel | deterministische Waits auf StateVersion/EventId, Fake Clock, Retry nur für Transport, nicht für Assertions |
| Concurrency-Fehler erst unter Last sichtbar | mittel | hoch | gezielte Race-Tests, SQLite-Transaktionen, Lock-Tests, idempotente Receipts |
| Undo erzeugt unfaire Vorteile | mittel | hoch | Hidden-Info-Barrier, konservative Block-Regel, Payload-Tests |
| Replay bricht durch Schemaänderungen | mittel | hoch | Versionierte Events, Migration/read-only-Regel, Replay-Gate |
| Zu breite Kartenimplementierung verzögert Stabilität | hoch | mittel | kleiner Demo-Pool, neue Karten nur mit Tests |
| Logs verraten Tokens oder Kartendaten | mittel | hoch | Log-Sanitizer, Security-Tests, Token nie im Klartext speichern |
| Persistenzadapter unterscheiden sich | mittel | mittel | gleiche Storage-Schnittstelle, Tests gegen In-Memory und SQLite |

---

## 25. Empfohlene nächste Umsetzungsschritte

1. Test-ID-Namensschema und Szenarioformat im Repository anlegen.
2. Fixtures für `initial_demo_match`, `runner_has_all_breakers`, `corp_rd_protected_barrier`, `corp_remote_with_agenda`, `hq_multiple_cards` erstellen.
3. Visibility-Oracle und Payload-Crawler zuerst bauen, bevor WebSocket-Features wachsen.
4. Engine-Szenariotests für Setup, Run, Access, Score und Replay priorisieren.
5. Danach REST/WS-Harness mit zwei simulierten Sessions ergänzen.
6. Concurrency-, Reconnect- und Undo-Tests als MVP-0.2-Gates einbauen.
7. Abschließend E2E-001 als vollständige private Zwei-Browser-Partie stabilisieren.

---

## 26. Kompakte Go/No-Go-Regel

Ein MVP-Build ist **No-Go**, wenn mindestens eine dieser Bedingungen zutrifft:

- irgendein P0-Test schlägt fehl,
- irgendein bekannter Hidden-Info-Leak offen ist,
- Replay einer Abnahmepartie erzeugt abweichenden StateHash,
- zwei parallele Actions können denselben MatchState korrupt verändern,
- falscher Token oder falsche Seite erhält Match-/Kartendaten,
- Undo nach Hidden-Info-Barrier ist möglich,
- Reconnect zeigt mehr Informationen als ein normaler StateUpdate,
- vollständige private Human-vs-Human-E2E-Partie ist nicht spielbar.

Ein MVP-0.2-Build ist **Go**, wenn alle Gates A bis F bestanden sind, keine offenen S0/S1-Defects existieren und alle bewussten Einschränkungen im Abweichungsregister dokumentiert sind.
