# NETGRID-Webapplikation – Technisches Architekturkonzept

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Primäres Ziel:** robuste, deterministische, regelautoritative und multiplayerfähige Architektur

## 1. Zweck

Dieses Dokument beschreibt die technische Zielarchitektur der NETGRID-Webapplikation. Es konkretisiert die Modulgrenzen aus dem MVP-0.1-Konzept und dem MVP-0.2-Plan. Es legt fest, welche Schicht welche Verantwortung trägt, welche Daten sie besitzen darf und welche Verträge zwischen Engine, Backend, Frontend, KI, Storage und Tests gelten.

Die Architektur ist bewusst kleiner als eine öffentliche Plattform. Sie muss aber von Beginn an die späteren Anforderungen an Multiplayer, Hidden Information, Reconnect, Undo, Replay und Debugging tragen.

## 2. Architekturziele

| Ziel | Konsequenz |
|---|---|
| Regelautorität nur in der Engine | UI, KI und Backend legen keine Spielregeln aus. |
| Determinismus | Gleicher Initialzustand plus EventLog erzeugt gleichen StateHash. |
| Hidden-Info-Sicherheit | Kein Client erhält den vollständigen GameState. |
| Multiplayerfähigkeit | Actions sind serverseitig serialisiert, versioniert und idempotent. |
| Reproduzierbarkeit | Seeds, RandomDrawRecords, EventLog und Snapshots sind Teil des Designs. |
| Erweiterbarkeit | TimingPoints, AbilityDefinitions und PlayerActions werden nicht auf den Demo-Kartenpool verengt. |
| Testbarkeit | Engine und Filter sind ohne UI und Netzwerk testbar. |
| Privater Betrieb | Lokaler, LAN- und privater Serverbetrieb sind möglich, ohne öffentliche Plattformfunktionen zu erzwingen. |

## 3. Nicht-Ziele der Architektur für MVP 0.1/0.2

Nicht Bestandteil der Architekturabnahme sind:

- öffentliche Accounts,
- Matchmaking,
- Ranglisten,
- Turnierbetrieb,
- Zuschaueransicht,
- Chat als Pflichtfunktion,
- freier Deckbau,
- vollständiger Kartenpool,
- horizontale Skalierung über mehrere Serverprozesse,
- kompetitive Anti-Cheat-Mechanismen über den privaten Betrieb hinaus,
- LLM-basierte KI.

Die Architektur darf diese Funktionen später nicht unmöglich machen, muss sie aber nicht vorzeitig implementieren.

## 4. Schichtenmodell

```text
Browser Client
  ├─ Web UI
  ├─ PlayerView Renderer
  ├─ LegalActions Panel
  └─ WebSocket/REST Adapter

Server App
  ├─ REST API
  ├─ WebSocket Gateway
  ├─ Match Service
  ├─ Session/Token Service
  ├─ Action Pipeline
  ├─ Visibility Filter
  ├─ Storage Adapter
  ├─ AI Adapter
  └─ Debug/Replay Adapter

Engine Package
  ├─ GameState
  ├─ Rules / Phases / Timing
  ├─ Actions / Resolver
  ├─ Runs / Breach / Access
  ├─ Cards / Effects
  ├─ Random / StateHash
  ├─ PlayerViews
  └─ Validation / Invariants

Shared Package
  ├─ TypeScript Types
  ├─ Schemas
  ├─ Protocol Constants
  └─ Test Fixtures

Storage
  ├─ SQLite für MVP 0.2
  └─ JSON nur als Dev-Adapter
```

## 5. Verantwortlichkeiten der Schichten

### 5.1 Rules Engine

Die Rules Engine ist eine reine TypeScript-Library ohne React-, WebSocket-, HTTP-, Datenbank- oder Dateisystemabhängigkeit.

Sie verantwortet:

- Erzeugung des initialen `GameState`,
- Berechnung von `LegalActions`,
- Validierung und Verarbeitung von `PlayerActions`,
- Phasen-, Timing- und Priority-Struktur,
- Kosten, Targets, Choices und Resolver,
- Run-, Encounter-, Breach- und Access-State-Machines,
- Siegbedingungen,
- Invariantenprüfung,
- Event-Erzeugung,
- StateHash,
- deterministische Zufallsentscheidungen,
- PlayerView-Berechnung auf Engine-Ebene.

Die Engine kennt keine Sessions, Tokens, IP-Adressen, Browser, WebSocket-Verbindungen, Datenbanktabellen oder HTTP-Endpunkte.

### 5.2 Backend / Match Server

Das Backend ist serverautoritativ für Match-Lifecycle und Multiplayer-Synchronisation, aber nicht für Spielregeln.

Es verantwortet:

- Match-Erstellung,
- Join- und Reconnect-Flows,
- Token- und Sessionvalidierung,
- MatchStatus und MatchVersion,
- Locking pro Match,
- Idempotency Receipts,
- Persistenz von State, Events, Snapshots und Sessions,
- WebSocket- und REST-Protokoll,
- Versand seitenspezifischer PlayerViews,
- Disconnect-Erkennung,
- Undo-Verfahren mit Zustimmung,
- Crash-Recovery,
- private Betriebs- und Debugschnittstellen.

Das Backend darf `GameState` speichern und an die Engine übergeben. Es darf daraus aber keine zusätzlichen Spielregeln ableiten, die der Engine widersprechen.

### 5.3 Frontend / Web UI

Das Frontend rendert ausschließlich die erlaubte Sicht des verbundenen Spielers.

Es verantwortet:

- Match-Erstellen- und Join-Screens,
- Lobby und Invite-Link-Anzeige,
- Spielbrett aus `PlayerView`,
- Anzeige von `LegalActions`,
- Anzeige von `ChoiceRequests`,
- Eingabe von `PlayerActions`,
- Wartezustände,
- Reconnect-Banner,
- Undo-Dialog,
- EventLog-Anzeige,
- lokale UI-Deaktivierung während Serververarbeitung.

Das Frontend darf keine Regeln nachbauen, um Aktionen zu erfinden. Es darf Buttons aus `LegalActions` darstellen und daraus eine `PlayerAction` bilden. Jede Manipulation des Clients muss serverseitig wirkungslos bleiben.

### 5.4 KI-Modul

Das KI-Modul ist ein Adapter, der aus erlaubten Informationen eine Action auswählt.

Es erhält:

- eigene `PlayerView`,
- eigene `LegalActions`,
- erlaubten EventLog-Ausschnitt,
- optional nicht-private Bewertungsparameter.

Es erhält nicht:

- vollständigen GameState,
- gegnerische Handkarten,
- verdeckte Deckreihenfolgen,
- unrezzed Corp-Kartentitel, wenn die KI die Runner-Seite steuert,
- interne Debugdaten.

Für MVP 0.1 ist nur eine einfache Corp-KI vorgesehen. Für MVP 0.2 ist KI nicht Kernziel, kann aber weiter als Testcontroller verwendet werden.

### 5.5 Shared Package

Das Shared Package enthält Typen, Konstanten und Schemata, die mehrere Schichten benötigen.

Erlaubt sind:

- `Side`, `MatchStatus`, `ActionType`, `TimingPointId`,
- Protokollversionen,
- JSON-Schema/Zod-Schema-Definitionen,
- DTO-Typen für REST/WebSocket,
- Test-Fixtures ohne private Secrets.

Nicht erlaubt sind:

- Engine-Resolver mit Seiteneffekten,
- UI-Komponenten,
- Datenbankzugriffe,
- konkrete Tokenwerte.

## 6. Paket- und Ordnerstruktur

Empfohlene Zielstruktur:

```text
/netgrid-app
  /packages
    /engine
      /src
        state/
        rules/
        actions/
        phases/
        timing/
        runs/
        breach/
        access/
        cards/
        effects/
        visibility/
        random/
        replay/
        validation/
        tests/
    /shared
      /src
        types/
        schemas/
        constants/
        protocol/
        fixtures/
    /ai
      /src
        heuristic/
        evaluation/
        fallback/
        simulations/
  /apps
    /server
      /src
        api/
        ws/
        auth/
        sessions/
        matches/
        action-pipeline/
        visibility/
        storage/
        replay/
        config/
    /web
      /src
        app/
        components/
        game/
        match/
        board/
        actions/
        eventlog/
        reconnect/
        undo/
  /data
    /cards
    /decks
    /manifests
    /deviations
    /scenarios
  /docs
```

## 7. Zentrale Datenflüsse

### 7.1 Neues Spiel in MVP 0.1

1. UI fordert lokales oder serverseitiges neues Demo-Spiel an.
2. Backend oder lokaler Controller ruft `createGame(config)` auf.
3. Engine initialisiert GameState, Seed, Decks, Zonen, Credits, Clicks und EventLog-Start.
4. Engine berechnet RunnerView und CorpView.
5. UI zeigt RunnerView und Runner-LegalActions.
6. Corp-KI erhält CorpView und Corp-LegalActions, sobald sie am Zug ist.

### 7.2 Action-Flow in MVP 0.2

```text
Browser
  -> WebSocket submit_action
Server
  -> Session und Seite prüfen
  -> Match laden
  -> Idempotency prüfen
  -> Match-Lock erwerben
  -> StateVersion prüfen
  -> Engine.applyAction(GameState, PlayerAction)
Engine
  -> Action erneut validieren
  -> Resolver ausführen
  -> Event, StateVersion, StateHash erzeugen
Server
  -> State, Event, Snapshot/Receipt speichern
  -> PlayerViews berechnen oder von Engine abrufen
  -> side-filtered Messages senden
Browser
  -> neue View, LegalActions, EventLog anzeigen
```

Jede erfolgreiche Transition ist atomar. Entweder werden State, EventLog und Receipt gemeinsam gespeichert, oder keine Zustandsänderung gilt als bestätigt.

### 7.3 Reconnect-Flow

1. Client öffnet Match-URL mit SessionToken oder ReconnectToken.
2. REST oder WebSocket validiert Token und MatchStatus.
3. Server bestimmt die Seite aus der Session, nicht aus Clientparametern.
4. Alte Connection der Seite wird ersetzt oder als stale markiert.
5. Server sendet aktuelle PlayerView, LegalActions, PendingChoice und EventLog-Tail.
6. Gegner erhält aktualisierten OpponentStatus.

Reconnect darf nie detailreicher sein als der normale StateUpdate derselben Seite.

### 7.4 Undo-Flow

1. Spieler wählt Ziel-Event im erlaubten EventLog.
2. Server prüft Snapshot/Replaysfähigkeit.
3. Server prüft Hidden-Info-Barrier zwischen Ziel und aktuellem State.
4. Bei Barrier wird Undo blockiert.
5. Ohne Barrier erhält der Gegner eine Anfrage.
6. Bei Zustimmung wird der Zielzustand per Snapshot oder Replay wiederhergestellt.
7. Server schreibt Systemevent und sendet neue PlayerViews.

Undo ist ein Match-Service-Vorgang über Engine-State, aber kein Clientrecht. Es darf verdeckte Informationen nicht rückwirkend nutzbar machen.

## 8. Serverautorität

Der Server ist autoritativ für:

- MatchExistenz,
- Session- und Tokenzuordnung,
- aktive Seite je Verbindung,
- MatchStatus,
- Locking,
- Idempotency,
- Persistenz,
- Zustellung von PlayerViews.

Die Engine ist autoritativ für:

- Spielregeln,
- LegalActions,
- Kosten und Targets,
- Timing,
- StateTransition,
- Events,
- StateHash,
- Winner.

Der Client ist niemals autoritativ für:

- Credits,
- Clicks,
- Kartenpositionen,
- Kostenbezahlung,
- Rezzed-/Faceup-Status,
- erfolgreiche Runs,
- Agenda Points,
- StateVersion,
- Random-Ergebnisse,
- Hidden-Info-Barrier.

## 9. Event-Sourcing-light

Das Projekt nutzt kein vollständiges Event-Sourcing als alleiniges Speichermodell. Stattdessen gilt:

- Der aktuelle GameState wird gespeichert.
- Jedes erfolgreiche Engine-Ereignis wird im EventLog gespeichert.
- Snapshots werden regelmäßig und an kritischen Punkten gespeichert.
- Replay nutzt initialen Snapshot plus EventLog-Suffix.
- StateHash nach jeder Transition erlaubt Divergenzerkennung.

Dieses Modell ist pragmatisch genug für MVP 0.2 und gleichzeitig stark genug für Debugging, Regression und Undo.

## 10. Fehler- und Ausfallmodell

| Fehlerklasse | Architekturantwort |
|---|---|
| Client sendet manipulierte Action | Server prüft Seite und StateVersion; Engine lehnt illegale Action ab. |
| Doppelklick | Idempotency-Key und ActionReceipt verhindern doppelte Transition. |
| Zwei Spieler senden gleichzeitig | Per-Match-Lock oder DB-Transaktion serialisiert Transitionen. |
| Client ist stale | Action wird abgelehnt, frische View wird gesendet. |
| WebSocket bricht ab | Match bleibt erhalten, Seite wird disconnected, Reconnect möglich. |
| Serverneustart | Match wird aus SQLite/Snapshot/EventLog geladen oder pausiert. |
| EventLog divergiere | Replay-StateHash schlägt fehl; Match wird als debugpflichtig markiert. |
| Hidden-Info-Leak-Verdacht | Payload wird isoliert, Leak-Test ergänzt, Debug-Full-State deaktiviert. |
| Tokenfehler | Fehler bleibt generisch und verrät keine gültige Seite. |

## 11. Konfigurationsmodell

Empfohlene Environment-Variablen:

```env
NODE_ENV=development
APP_BASE_URL=http://localhost:3000
SERVER_PORT=3000
DATABASE_URL=file:./data/netgrid.sqlite
SESSION_SECRET=<secret>
TOKEN_HASH_SECRET=<secret>
PUBLIC_PROTOCOL_VERSION=0.2.0
ENGINE_SCHEMA_VERSION=0.2.0
PLAYER_VIEW_SCHEMA_VERSION=0.2.0
DEBUG_ACCESS_MODE=local_dev_only
ALLOW_FULL_STATE_DEBUG=false
RATE_LIMIT_ENABLED=true
```

Außerhalb von localhost sollen HTTPS und WSS verwendet werden. Secrets dürfen nicht im Repository liegen.

## 12. Architekturentscheidungen

| Entscheidung | Festlegung | Begründung |
|---|---|---|
| Engine als reine Library | Ja | Testbarkeit, Determinismus, klare Grenzen. |
| Server-authoritative Multiplayer | Ja | Hidden Info und Race Conditions erfordern zentrale Autorität. |
| SQLite für MVP 0.2 | Empfohlen | Transaktional, lokal, einfach zu sichern. |
| JSON-Dateien | Nur Dev/Debug | Zu fehleranfällig bei Concurrent Actions. |
| WebSocket für laufende Partie | Ja | Bidirektionale Zustandsupdates und Choices. |
| REST für Match-Setup | Ja | Einfacher Join-/Bootstrap-/Replay-Zugriff. |
| Full-State Debug im Client | Nein | Hidden-Info-Risiko. |
| Demo-Decks statt freier Deckbau | Ja | Reduziert Scope und Tests. |
| Undo konservativ | Ja | Hidden Information hat Vorrang vor Komfort. |

## 13. Architektur-Invarianten

Diese Invarianten dürfen durch keine Implementierung gebrochen werden:

1. Jede erfolgreiche Action erhöht die `stateVersion` oder erzeugt klar dokumentiert keinen Spielzustandswechsel.
2. Jeder StateUpdate an Clients enthält ausschließlich seitenerlaubte Informationen.
3. Jeder `PlayerAction` wird server- und engine-seitig validiert.
4. Kein Clientpayload enthält Klartexttokens anderer Sessions.
5. Keine normale Logausgabe enthält vollständigen GameState oder verdeckte Kartentitel der Gegenseite.
6. Die Engine kann ohne Backend und Frontend getestet werden.
7. Replay eines EventLogs reproduziert denselben finalen StateHash.
8. Ein Match verarbeitet nie zwei Engine-Transitionen gleichzeitig.

## 14. Abnahmekriterien für die Architektur

Die Architektur gilt für MVP 0.2 als ausreichend umgesetzt, wenn:

- die Engine als separates Paket ohne Netzwerk- und UI-Abhängigkeiten testbar ist,
- REST-Endpunkte und WebSocket-Messages dem Protokolldokument entsprechen,
- Action-Pipeline mit Locking, StateVersion und Idempotency implementiert ist,
- PlayerViews zentral und automatisiert getestet gefiltert werden,
- SQLite oder gleichwertiger transaktionaler Storage State, Events, Snapshots, Sessions und Receipts speichert,
- Reconnect während Action Phase, Encounter und Access funktioniert,
- Undo vor Hidden-Info-Barrier funktioniert und danach blockiert wird,
- CI-Tests für Engine, Visibility, Concurrency, Reconnect, Undo und Replay bestehen.
