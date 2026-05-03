# Netrunner-Webapplikation – Konsolidiertes Entwicklungskonzept

**Status:** verbindliche Arbeitsfassung für Entwicklung  
**Stand:** 03.05.2026  
**Primärer Fokus:** MVP 0.1 – Human Runner gegen einfache Corp-KI  
**Dokumenttyp:** konsolidiertes Konzept-, Architektur- und Umsetzungsdokument  
**Kontrollabgleich:** geprüft gegen die vier Ursprungskonzepte am 03.05.2026  

Dieses Dokument konsolidiert und ersetzt die bisherigen Konzeptzwischenstände vollständig. Frühere Konzeptdateien sind nach Erstellung dieser Fassung nicht mehr verbindlich und müssen für die Entwicklung nicht parallel gepflegt werden. Entscheidungen, Scope-Grenzen, technische Vorgaben, Test-Gates und bekannte Vereinfachungen werden in dieser Fassung geführt.

## Inhaltsverzeichnis

- 1. Kurzentscheidung
- 2. Zielbild
- 3. MVP 0.1 – Produktziel
- 4. MVP 0.1 – Nicht-Ziele
- 5. Leitprinzipien
- 6. Zielnutzer und Nutzungsszenarien
- 7. Verbindliche Referenzbasis
- 8. Abweichungsregister
- 9. Enthaltener Regelumfang MVP 0.1
- 10. Systemarchitektur
- 11. Datenmodell
- 12. Engine-API
- 13. LegalActions und PlayerActions
- 14. Phasen-, Timing- und Priority-Modell
- 15. Resolver-Pipeline
- 16. Engine-Invarianten
- 17. Run-, Breach- und Access-Modell
- 18. Siegbedingungen
- 19. Verdeckte Information und PlayerViews
- 20. EventLog, Replay, Zufall und StateHash
- 21. Persistenz und Migration
- 22. Kartenstrategie
- 23. CardImplementation-Manifest
- 24. Demo-Decks für MVP 0.1
- 25. Card Data, Copyright, Assets und Attribution
- 26. KI-Konzept MVP 0.1
- 27. UI-/UX-Konzept
- 28. Backend und spätere Human-vs-Human-Vorbereitung
- 29. Sicherheit und privater Betrieb
- 30. Teststrategie
- 31. Akzeptanzkriterien MVP 0.1
- 32. Definition of Done für MVP 0.1
- 33. Umsetzungsplan MVP 0.1
- 34. Strategische Entwicklungsstufen nach MVP 0.1
- 35. Versionen nach MVP 0.1
- 36. Hauptrisiken und Gegenmaßnahmen
- 37. Offene Entscheidungen
- 38. Konsolidierte Kernformel
- 39. Kontrollabgleich und bewusst verdichtete Punkte

## 1. Kurzentscheidung

MVP 0.1 ist keine verkleinerte öffentliche Netrunner-Plattform und kein Versuch, sofort das vollständige Spiel mit breitem Kartenpool abzubilden. MVP 0.1 ist ein eng abgegrenzter, testbarer und deterministischer Regelausschnitt: Ein Mensch spielt als Runner über eine private Weboberfläche gegen eine einfache Corp-KI. Beide Seiten verwenden feste Demo-Decks. Die Engine entscheidet, welche Aktionen legal sind. UI, Mensch und KI wählen ausschließlich aus diesen LegalActions.

Die zentrale technische Entscheidung lautet:

> Die Rules Engine ist die alleinige Regelautorität. Menschliche Spieler, UI und KI reichen nur Entscheidungen ein; die Engine validiert und verarbeitet sie deterministisch.

Daraus folgen die wichtigsten Architekturprinzipien:

- Die Engine ist eine reine TypeScript-Library ohne React-, WebSocket-, Datenbank- oder KI-Abhängigkeiten.
- Der vollständige GameState ist serverseitig bzw. engine-intern autoritativ.
- Clients, KI-Inputs, öffentliche Events, Fehlerausgaben und sichtgefilterte Replays erhalten keine verdeckten Informationen.
- Jede Engine-Transition erzeugt ein versioniertes Event mit StateHash.
- Zufall wird über Seed, RandomCounter und RandomDrawRecords reproduzierbar gemacht.
- Tests sind Teil der Engine-Entwicklung, nicht ein späteres Add-on.
- Karten werden nur spielbar freigeschaltet, wenn sie im CardImplementation-Manifest dokumentiert und getestet sind.
- Human-vs-Human über Internet wird architektonisch vorbereitet, aber nicht in MVP 0.1 gebaut.

## 2. Zielbild

Langfristig soll eine private Webapplikation entstehen, mit der Netrunner regelgeführt gespielt, getestet, simuliert und analysiert werden kann. Die Anwendung ist zunächst nicht als öffentliche Plattform gedacht. Es geht nicht um Matchmaking, Ranglisten, Turniere, Moderation oder Community-Betrieb, sondern um eine technisch saubere, private und schrittweise erweiterbare Spielumgebung.

Langfristig sollen folgende Spielmodi möglich sein:

| Spielmodus | Zielstatus | Bemerkung |
|---|---:|---|
| Human vs KI | MVP 0.1 startet mit Human Runner vs Corp-KI | Erste produktive Spielform. |
| KI vs Human | Später | Erfordert Runner-KI. |
| Human vs Human online | MVP 0.2 | Privater Einladungslink, WebSocket, PlayerViews, Reconnect. |
| Human vs Human lokal / Hotseat | Später optional | Für Tests und Lernpartien möglich; echte Hidden Information eingeschränkt. |
| KI vs KI | Später, als Testmodus vorbereitbar | Nützlich für Simulationen, Regressionen und KI-Stabilität. |
| Replay / Zuschaueransicht | Replay als Testinstrument ab MVP 0.1, Zuschaueransicht später | In MVP 0.1 reicht EventLog-/Replay-Grundlage. |

Die langfristige Plattform entsteht aus derselben Engine-Basis. MVP 0.1 muss deshalb klein sein, aber die richtigen technischen Strukturen bereits enthalten.

## 3. MVP 0.1 – Produktziel

Ein Mensch kann als Runner eine vollständige Grundpartie gegen eine einfache Corp-KI spielen. Die Partie startet aus festen Demo-Decks, läuft über eine Weboberfläche, validiert jede Aktion über die Engine, protokolliert jedes Ereignis und endet durch unterstützte Siegbedingungen.

Der MVP beweist nicht, dass alle Netrunner-Regeln und alle Karten funktionieren. Er beweist, dass die technische Basis tragfähig ist:

- GameState kann erzeugt, verändert, validiert und gespeichert werden.
- LegalActions werden aus dem aktuellen State berechnet.
- PlayerActions werden erneut gegen StateVersion, Seite, Timingpunkt, Kosten und Targets validiert.
- Grundaktionen, Installationen, Runs, ICE, Breaker, Breach, Access, Agenda-Steal, Agenda-Score und Siegbedingungen funktionieren für den Demo-Kartenpool.
- Die Corp-KI handelt ausschließlich über LegalActions und sieht keine verbotenen Informationen.
- EventLog, Replay und StateHash erlauben reproduzierbare Testläufe.
- Visibility-Tests schützen Hidden Information.

## 4. MVP 0.1 – Nicht-Ziele

Für MVP 0.1 ausdrücklich nicht bauen:

- Kein Human-vs-Human über Internet.
- Kein öffentlicher Betrieb, keine Lobby, kein Matchmaking, keine Rangliste, keine Turniere, keine Moderation.
- Kein freier Deckbau, keine Formatvalidierung, keine Rotation, keine Banlisten, keine Einflussprüfung außerhalb der Demo-Decks.
- Kein vollständiger Kartenpool.
- Keine automatische Interpretation von Kartentexten als Regelquelle.
- Keine starke KI, keine LLM-Strategie und keine KI mit Zugriff auf vollständigen GameState.
- Keine vollständige Modellierung komplexer Sondermechaniken wie Tags, Trace, Damage, Viren, Hosting, Prevention, Avoid, Replacement, Interrupt, Bypass, Forced Encounters, Run-Umleitung, Multiaccess oder zusätzliche Steal-Kosten.
- Keine Smartphone-optimierte UI als Abnahmekriterium. Ein Desktop-orientiertes Layout reicht.
- Keine perfekte optische Plattform. Debug- und Lernklarheit sind wichtiger als UI-Politur.

Diese Nicht-Ziele sind verbindlich. Sie schützen das Projekt vor Scope Creep und verhindern, dass der erste spielbare Stand durch den vollständigen Karten- und Regelumfang blockiert wird.

## 5. Leitprinzipien

| Prinzip | Konsequenz |
|---|---|
| Engine zuerst | Spielzustand, LegalActions, Invarianten und Tests entstehen vor UI-Komfort. |
| Regelautorität nur in der Engine | UI und KI dürfen keine Regeln auslegen oder Aktionen erfinden. |
| Server-authoritative State | Der vollständige GameState ist nicht Client-Wahrheit. |
| Keine Hidden-Info-Leaks | PlayerViews, Events, Logs, Fehler, Replays und KI-Inputs werden gefiltert. |
| Event-Sourcing light | Jede Engine-Transition erzeugt ein Event mit StateVersion und StateHash. |
| Determinismus | Seeds, RandomCounter und Zufallsergebnisse werden gespeichert. |
| Kleiner Kartenpool | Zwei feste Demo-Decks statt freier Deckbau. |
| Kartenlogik explizit | Gedruckter Text und maschinenlesbare Engine-Logik bleiben getrennt. |
| Tests als Gate | Kein neuer Engine-Effekt ohne Test, keine neue Karte ohne Kartentest. |
| Erweiterbarkeit ohne Vorgriff | TimingPointIds, Manifest, PlayerActions und PlayerViews werden vorbereitet, auch wenn viele Features leer bleiben. |

## 6. Zielnutzer und Nutzungsszenarien

| Nutzerrolle | Bedarf | Relevanz für MVP 0.1 |
|---|---|---|
| Privater Spieler | Netrunner-Grundabläufe regelgeführt üben. | Primärnutzer. |
| Entwickler | Engine-Fehler finden, Szenarien reproduzieren, Karten schrittweise implementieren. | Primärnutzer für Debugging und Tests. |
| KI-/Simulationsnutzer | Heuristiken testen und später KI-vs-KI simulieren. | In 0.1 nur über Corp-KI und vorbereitete Teststruktur relevant. |
| Online-Gegenspieler | Später privat über Einladungslink spielen. | Nicht in 0.1, aber Architektur vorbereitet. |

### 6.1 Kern-User-Journey MVP 0.1

1. Der Nutzer öffnet die private Webapp und startet ein neues Demo-Spiel.
2. Die App zeigt RulesBaseline, Demo-Decks, Seed und bekannte MVP-Einschränkungen an.
3. Der Nutzer spielt als Runner; die Corp wird durch eine einfache KI kontrolliert.
4. Die Engine erzeugt GameState, PlayerViews, LegalActions und ein initiales EventLog.
5. Der Runner wählt Aktionen aus der aktuellen LegalAction-Liste: Credit nehmen, Karte ziehen, Karte installieren, Event spielen, Run starten oder Zug beenden.
6. Bei einem Run führt die UI durch Serverwahl, Approach, Encounter, Break-Entscheidungen, Subroutinen, Breach und Access.
7. Nach dem Runner-Zug führt die Corp-KI legale Aktionen aus: Economy, ICE installieren, Remote aufbauen, Agenda installieren, advancen, scoren oder Credits nehmen.
8. Das Spiel endet, wenn Runner oder Corp die erforderlichen Agenda Points erreichen oder eine andere in MVP 0.1 unterstützte Siegbedingung eintritt.
9. Nach Spielende kann der Nutzer EventLog, StateHashes, Replay-Informationen und testrelevante Daten ansehen.

### 6.2 Debug- und Lern-Journey

Für den ersten Entwicklungsstand ist ein Debug-/Lernmodus wichtiger als visuelle Perfektion. Der Nutzer soll erkennen können:

- welcher TimingPoint aktiv ist,
- warum eine Aktion legal oder gesperrt ist,
- welche Kosten gezahlt wurden,
- welcher Resolver-Schritt ausgeführt wurde,
- welche StateVersion vor und nach einer Aktion gilt,
- welcher StateHash aus der Transition resultiert.

Der Lernmodus darf keine verdeckten Informationen anzeigen, wenn er aus einer Spielerperspektive läuft. Ein vollständiger Debug-Replay bleibt serverseitig oder nur im lokalen Entwicklerkontext zugänglich.

## 7. Verbindliche Referenzbasis

Jede intern getestete oder ausgelieferte Version speichert eine RulesBaseline. Dadurch bleiben Replays, Tests und Bugentscheidungen nachvollziehbar.

Für MVP 0.1 wird die bereitgestellte Comprehensive-Rules-Version `26.03` als Regelreferenz festgeschrieben. Vereinfachungen werden nicht implizit toleriert, sondern im Abweichungsregister dokumentiert.

```ts
type RulesBaseline = {
  rulesVersion: string
  cardTextSource: "netrunnerdb" | "local_snapshot" | "manual"
  cardTextSnapshotId: string
  engineSchemaVersion: string
  cardImplementationVersion: string
  deviationRegistryVersion: string
}
```

Empfohlene MVP-Baseline:

```json
{
  "rulesVersion": "26.03",
  "cardTextSource": "manual",
  "cardTextSnapshotId": "mvp-0.1-demo",
  "engineSchemaVersion": "0.1.0",
  "cardImplementationVersion": "0.1.0",
  "deviationRegistryVersion": "0.1.0"
}
```

Zusätzliche Referenz- und Prüfpunkte aus den Ursprungskonzepten:

- Für spätere Kartendatenquellen wird ein versionierter lokaler Snapshot bevorzugt; NetrunnerDB/API oder offizielle JSON-Daten können später als Quelle dienen, aber nicht als direkte Regelinterpretation.
- Für spätere Nutzung von Namen, Texten, Logos, Kartenbildern, Frames, Rückseiten oder sonstigen visuellen Assets müssen die jeweils aktuellen NetrunnerDB-/Null-Signal-Games-/Asset-Hinweise separat geprüft werden.
- Diese technische Referenzbasis ersetzt keine Rechtsberatung zu Urheberrecht, Markenrecht, Datenschutz oder Hostingbedingungen.


## 8. Abweichungsregister

Der MVP ist nicht „ungefähr Netrunner“, sondern ein abgegrenzter Regelausschnitt. Jede absichtliche Vereinfachung gegenüber der vollständigen Regelbasis muss im Abweichungsregister stehen. Eine Vereinfachung darf nur bestehen bleiben, wenn sie für den aktuellen Kartenpool unschädlich ist oder in der UI klar als Einschränkung ausgewiesen wird.

```ts
type RuleDeviation = {
  id: string
  area: "turn" | "run" | "access" | "card" | "deckbuilding" | "multiplayer" | "ui"
  officialRuleRef?: string
  simplifiedBehavior: string
  reason: string
  affectedCards: string[]
  allowedInVersions: string[]
  removalCondition: string
  testCoverage: string[]
}
```

Initiale MVP-Abweichungen:

| Bereich | Vereinfachung in MVP 0.1 | Rückbau-/Erweiterungsbedingung |
|---|---|---|
| Deckbau | Keine freie Deckwahl, keine Format- und Einflussprüfung. | Sobald offizielle Decks oder freier Deckbau eingeführt werden. |
| Kartenpool | Nur feste Demo-Karten mit `playable_mvp`. | Erweiterung pro Karte nur mit Manifest und Tests. |
| Identitäten | Runner- und Corp-Identitäten haben deaktivierte Sonderfähigkeiten. | Sobald echte IDs mit getesteten Fähigkeiten genutzt werden. |
| Timing | TimingPointIds existieren, viele Fenster bleiben leer oder bieten keine Aktionen. | Sobald Karten diese Fenster benötigen. |
| Paid Abilities | Nur Breaker- und Demo-relevante Paid Abilities. | Sobald Karten mit weiteren Paid Abilities spielbar werden. |
| Tags/Trace/Damage/Viren | Nicht implementiert. | Erst mit Karten, die diese Mechaniken benötigen. |
| Prevention/Replacement/Interrupt | Nicht implementiert. | Erst bei Karten, die solche Effekte benötigen; dann Resolver erweitern. |
| Hosting/Hosted Cards | Nicht implementiert. | Erst mit Karten, die Hosting verwenden. |
| Multiaccess/Bypass/Run-Umleitung | Nicht implementiert. | Erst mit entsprechenden Karten oder fortgeschrittener Run-Engine. |
| Public Replay | Nur einfacher EventLog-/Replay-Viewer, keine öffentliche Replay-Plattform. | Späteres Komfort-Feature. |

## 9. Enthaltener Regelumfang MVP 0.1

| Bereich | Enthalten |
|---|---|
| Setup | Match-Erzeugung, feste Decks, Identitäten ohne aktive Sonderfähigkeit, Seed, Shuffle, Starthände, Startressourcen, Score Areas, Zonen. Mulligan kann in MVP 0.1 zunächst weggelassen oder als dokumentierte Abweichung optional implementiert werden. |
| Grundaktionen | Credit nehmen, Karte ziehen, Runner-Karte installieren, Corp-Karte installieren, Event/Operation mit einfachem Effekt spielen, Agenda advancen, Zug beenden. |
| Corp-Zug | Pflicht-Draw zu Beginn, Click-Management, Credits, Installation von ICE, Assets und Agendas, Remote-Erstellung, Agenda scoren. |
| Runner-Zug | Click-Management, Credits, Draw, Installation von Programmen, einfache Events, Runs. |
| Server | HQ, R&D, Archives, mindestens ein Remote, ICE vor Servern, Root-Karten für Remote. |
| Run | Run-Initiation, Serverwahl, Approach ICE, Rez-Choice für Corp, Encounter, Break, Subroutinen, Pass ICE, Approach Server, Success, Breach, Access, Run Ends. |
| ICE und Breaker | Einfache Barrier, Code Gate, Sentry; passende Fracter/Decoder/Killer mit Pump- und Break-Fähigkeiten. |
| Access/Breach | HQ random access, R&D top access, Archives access, Remote root access, Agenda-Steal, Trash-Cost-Entscheidung bei Assets. |
| Scoring | Agenda installieren, Advancement-Token legen, Score-Bedingung prüfen, Agenda scoren. |
| Siegbedingungen | Agenda-Sieg für Runner und Corp; weitere Siegbedingungen nur, wenn im Demo-Pool benötigt. |
| EventLog | Öffentliche und private Eventanteile, StateVersion, StateHash, RandomDrawRecords. |
| Replay | Reproduktion einer Beispielpartie aus initialState, EventLog, Seed und RandomDrawRecords. |
| KI | Einfache Corp-KI mit LegalAction-Zwang, Timeout und Fallback. |
| Tests | Unit-, Integrations-, Run-, Access-, Visibility-, Replay-, KI- und Kartentests. |

Ausdrücklich zurückgestellt:

| Zurückgestellter Bereich | Grund |
|---|---|
| Freier Deckbau, Rotation, Banlisten, Einflussvalidierung | Nicht nötig für feste Demo-Decks. |
| Tags, Trace, Damage, Viren, Bad-Publicity-Sonderlogik | Erhöht Regel- und Timingkomplexität ohne Bedarf im Demo-Pool. |
| Prevention, Avoid, Replacement, Interrupt | Benötigen erweiterten Resolver. |
| Hosting, Hosted Cards, komplexe Counter-Orte | Erst für spätere Kartenpools. |
| Forced Encounters, Bypass, Run-Umleitung, Multiaccess | Erst nach stabilem Run-/Access-Kern. |
| Region-, Unique-, Console- und zentrale Root-Upgrade-Sonderfälle | Nicht im ersten Demo-Deck enthalten. |
| Vollständige Paid-Ability-Struktur | Struktur vorbereitet, Aktionen nur bei Bedarf. |
| Starke KI und LLM-KI | Erst nach stabiler LegalAction-/Visibility-Schicht. |

## 10. Systemarchitektur

Die Anwendung besteht aus fünf klar getrennten Schichten.

| Schicht | Verantwortung |
|---|---|
| Rules Engine | GameState, Regeln, Phasen, Timingpunkte, Runs, Breach, Access, legale Aktionen, Siegbedingungen, Invarianten, Karteneffekte, Visibility. |
| Backend / Match Server | Matches, Controller, Speicherung, WebSocket-Vorbereitung, Einladungslinks, Reconnect, EventLogs, Snapshots, KI-Anbindung. |
| Frontend / Web UI | Spielbrett, Zonen, Aktionen, Run-Status, ChoiceRequests, EventLog, Replay-/Debug-Anzeige. |
| KI-Modul | Bewertet LegalActions aus zulässiger PlayerView und wählt eine actionId. |
| Testsystem | Unit-, Integrations-, Szenario-, Visibility-, Replay-, KI-, Karten- und Regressionstests. |

Die Engine darf keine UI-, Netzwerk- oder Persistenzlogik enthalten. Backend, UI und KI sind Adapter um dieselbe Engine.

### 10.1 Empfohlener Stack

| Bereich | Empfehlung für MVP |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, TypeScript |
| Realtime | Für MVP 0.1 nur vorbereiten; später WebSocket, z. B. Socket.io oder native `ws` |
| Engine | Eigenes TypeScript-Paket |
| Persistenz Phase 1 | JSON-Dateien oder SQLite; SQLite bevorzugt, sobald mehrere Matches oder WebSocket relevant werden |
| Persistenz später | PostgreSQL |
| Tests | Vitest oder Jest, zusätzlich Szenario-Tests |
| Deployment | Lokal, privater Homeserver, Docker, später optional privater VPS |

### 10.2 Projektstruktur

```txt
/netrunner-app
  /packages
    /engine
      /src
        state/
        rules/
        actions/
        phases/
        runs/
        breach/
        cards/
        effects/
        visibility/
        random/
        tests/
    /ai
      /src
        heuristic/
        evaluation/
        fallback/
        simulations/
        llm-adapter/      # später, nicht MVP 0.1
    /shared
      /src
        types/
        schemas/
        constants/
  /apps
    /web
      /components
      /game
      /cards
      /replay
      /styles
    /server
      /api
      /ws-prep
      /auth-prep
      /storage
      /matches
      /ai-runner
  /data
    /cards
    /decks
    /manifests
    /deviations
    /scenarios
```

### 10.3 Architekturgrenzen

- Die UI ruft keine direkten Mutationsfunktionen auf. Sie reicht PlayerActions ein.
- Die KI erhält keine Engine-internen Full-State-Objekte.
- Der Server speichert und verarbeitet den vollständigen GameState; Clients erhalten nur PlayerViews.
- Kartenresolver enthalten keine UI-, Netzwerk- oder Datenbanklogik.
- Tests können die Engine ohne Backend und Frontend ausführen.
- Jede externe Schicht behandelt die Engine als Autorität, nicht als Empfehlung.

## 11. Datenmodell

### 11.1 Zentrale Objekte

| Objekt | Zweck |
|---|---|
| Match | Container für Controller, Baseline, GameState, EventLog, Snapshots und Settings. |
| PlayerController | Beschreibt, ob eine Seite durch lokalen Menschen, Remote-Mensch, KI oder Replay gesteuert wird. |
| GameState | Autoritativer Spielzustand mit Turn, Phase, TimingPoint, StateVersion, CorpState, RunnerState, RunState und Winner. |
| CorpState | Identity, Credits, Clicks, Bad Publicity, HQ, R&D, Archives, Score Area, Server. |
| RunnerState | Identity, Credits, Clicks, Tags als Zukunftsfeld, Memory, Grip, Stack, Heap, Score Area, Rig. |
| CardDefinition | Statische Kartendaten: Titel, Typ, Subtypes, Kosten, RezCost, TrashCost, AgendaRequirement, Stärke, MVP-AbilityDefinition. |
| CardInstance | Konkrete Karteninstanz in einer Partie mit Zone, Owner, Controller, Status, Countern, Host-Relationen und Implementierungsstatus. |
| Server | HQ/R&D/Archives/Remote mit Root-Karten und ICE-Kette. |
| LegalAction | Von der Engine angebotene legale Handlung. |
| PlayerAction | Vom Client oder von der KI eingereichte konkrete Entscheidung. |
| GameEvent | Versioniertes Event mit öffentlichen/privaten Payloads, StateVersion und StateHash. |

### 11.2 Match

```ts
type Match = {
  id: string
  status: "waiting" | "active" | "paused" | "finished"
  version: number
  baseline: RulesBaseline
  createdAt: string
  updatedAt: string
  corpController: PlayerController
  runnerController: PlayerController
  gameState: GameState
  eventLog: GameEvent[]
  snapshots: StateSnapshot[]
  settings: MatchSettings
}
```

### 11.3 PlayerController

```ts
type PlayerController = {
  controllerId: string
  side: "corp" | "runner"
  type: "human_local" | "human_remote" | "ai" | "replay"
  userId?: string
  connected: boolean
}
```

Dadurch werden alle späteren Kombinationen vorbereitet: Human vs KI, KI vs Human, Human vs Human, KI vs KI und Replay.

### 11.4 GameState

```ts
type GameState = {
  gameId: string
  seed: string
  randomCounter: number
  stateVersion: number
  turn: number
  activeSide: "corp" | "runner"
  phase: PhaseState
  timingPoint: TimingPointId
  priority: PriorityState | null
  corp: CorpState
  runner: RunnerState
  run: RunState | null
  pendingChoices: ChoiceRequest[]
  checkpoints: CheckpointState[]
  winner: "corp" | "runner" | "draw" | null
}
```

### 11.5 CorpState

```ts
type CorpState = {
  identity: CardInstanceRef
  credits: number
  clicks: number
  maxHandSize: number
  badPublicity: number
  hq: CardInstanceRef[]
  rd: CardInstanceRef[]
  archives: CardInstanceRef[]
  scoreArea: CardInstanceRef[]
  servers: Server[]
}
```

### 11.6 RunnerState

```ts
type RunnerState = {
  identity: CardInstanceRef
  credits: number
  clicks: number
  maxHandSize: number
  tags: number
  memoryUsed: number
  memoryLimit: number
  grip: CardInstanceRef[]
  stack: CardInstanceRef[]
  heap: CardInstanceRef[]
  scoreArea: CardInstanceRef[]
  rig: RunnerRig
}
```

### 11.7 Server

```ts
type Server = {
  id: string
  type: "hq" | "rd" | "archives" | "remote"
  root: CardInstanceRef[]
  ice: CardInstanceRef[]
  createdByEventId?: string
}
```

Die ICE-Reihenfolge muss eindeutig dokumentiert werden. Für MVP 0.1 wird empfohlen: `ice[0]` ist outermost oder die Reihenfolge wird explizit über ein Feld markiert. Die gewählte Konvention muss in Tests fixiert werden.

### 11.8 CardDefinition

```ts
type CardDefinition = {
  cardId: string
  printedCardCode?: string
  title: string
  side: "corp" | "runner"
  type: CardType
  subtypes: string[]
  faction?: string
  cost?: number
  rezCost?: number
  trashCost?: number
  advancementRequirement?: number
  agendaPoints?: number
  strength?: number
  memoryCost?: number
  text: string
  abilities: AbilityDefinition[]
}
```

### 11.9 CardInstance

```ts
type CardInstance = {
  instanceId: string
  cardId: string
  printedCardCode: string
  owner: Side
  controller: Side
  zone: ZoneRef
  faceup: boolean
  rezzed?: boolean
  active: boolean
  installed: boolean
  order?: number
  advancementTokens: number
  counters: Record<string, number>
  hosted: CardInstanceRef[]
  host?: CardInstanceRef
  temporaryModifiers: ModifierRef[]
  lingeringEffects: LingeringEffectRef[]
  implementationStatus: CardImplementationStatus
}
```

CardDefinition beschreibt eine Karte allgemein. CardInstance beschreibt eine konkrete Karte in einer laufenden Partie.

### 11.10 CardInstanceRefs statt Objektduplikate

Zonen enthalten CardInstanceRefs, nicht duplizierte Kartenobjekte. Jede CardInstance existiert genau einmal. Dadurch werden Visibility, Replays, EventPayloads und Invarianten kontrollierbarer.

## 12. Engine-API

Die Engine soll wenige zentrale öffentliche Funktionen haben:

```ts
createGame(config): GameState
getLegalActions(gameState, side): LegalAction[]
applyAction(gameState, playerAction): EngineResult
getPlayerView(gameState, side): PlayerView
validateGameState(gameState): ValidationResult
checkWinConditions(gameState): Winner | null
replayEvents(initialState, eventLog): GameState
hashState(gameState): string
```

Wichtige Regeln:

- `applyAction` validiert ActionId, Seite, StateVersion, Timingpunkt, Kosten und Targets erneut.
- Eine Aktion wird nicht akzeptiert, nur weil sie vorher in einer LegalActions-Liste stand.
- Veraltete oder doppelte Actions werden abgelehnt oder idempotent beantwortet.
- Jede erfolgreiche Aktion erzeugt mindestens ein GameEvent.
- Nach jeder Aktion wird `validateGameState()` ausgeführt.
- Nach jeder Aktion werden PlayerViews und LegalActions neu berechnet.

## 13. LegalActions und PlayerActions

LegalAction ist das Interface zur UI und KI. PlayerAction ist die konkrete, vom Client oder von der KI eingereichte Entscheidung. Beide müssen getrennt bleiben.

```ts
type LegalAction = {
  actionId: string
  side: Side
  type: ActionType
  label: string
  source: CardInstanceRef | "basic_action" | "game_rule"
  timingPoint: TimingPointId
  costs: Cost[]
  targetRequirements: TargetRequirement[]
  choices?: ChoiceSchema
  visibility: "public" | "private_to_actor"
  expiresAtStateVersion: number
}

type PlayerAction = {
  matchId: string
  side: Side
  actionId: string
  selectedTargets: Record<string, string>
  selectedChoices: Record<string, unknown>
  clientKnownStateVersion: number
  idempotencyKey: string
}
```

Beispiele für ActionTypes:

| ActionType | MVP-Relevanz |
|---|---|
| `gain_credit` | Basisaktion beider Seiten. |
| `draw_card` | Basisaktion; Corp-Pflichtdraw zusätzlich im Phasenmodell. |
| `install_card` | Runner- und Corp-Installationen. |
| `play_operation` | Corp-Economy-Operation. |
| `play_event` | Runner-Economy- und Run-Event. |
| `advance_card` | Corp-Agenda-Scoring-Schleife. |
| `run_server` | Start eines Runs. |
| `rez_card` | Corp rezzt ICE oder Asset. |
| `break_subroutine` | Runner nutzt passenden Breaker. |
| `jack_out` | Struktur vorbereiten, in MVP nur anbieten, wenn erlaubt. |
| `access_card` | Access-Sequenz. |
| `steal_agenda` | Agenda-Steal. |
| `trash_accessed_card` | Trashbare Assets gegen Trash Cost. |
| `pass_priority` | Für Choice/Priority-Struktur. |
| `end_turn` | Zug beenden. |

Nicht in MVP 0.1 enthaltene, aber strukturell spätere ActionTypes aus den Ursprungskonzepten sind z. B. `trash_resource`, `purge_virus_counters`, `remove_tag`, `trigger_ability`, `prevent_damage` und vergleichbare Sonderaktionen. Sie werden nicht früh implementiert, sollen aber durch das Action-/Resolver-Modell nicht ausgeschlossen werden.

Die UI zeigt nur LegalActions an. Die Engine muss dennoch manipulierte PlayerActions ablehnen.

## 14. Phasen-, Timing- und Priority-Modell

### 14.1 Phasenmodell

```ts
type Phase =
  | "corp_turn_start"
  | "corp_draw_phase"
  | "corp_action_phase"
  | "corp_discard_phase"
  | "runner_turn_start"
  | "runner_action_phase"
  | "runner_discard_phase"
```

Die Corp hat eine verpflichtende Draw Phase. Der Runner hat keine entsprechende verpflichtende Draw Phase. Beide Seiten haben eine Action Phase und bei Bedarf Discard/Handlimit-Verarbeitung.

### 14.2 TimingPointIds

Auch wenn MVP 0.1 nicht alle offiziellen Timingpunkte vollständig nutzt, muss die Engine stabile TimingPointIds besitzen. Dadurch bleiben Tests, Replays und Kartenresolver später kompatibel.

```ts
type TimingPointId =
  | "corp_draw_gain_clicks"
  | "corp_draw_paid_window"
  | "corp_draw_mandatory_draw"
  | "corp_action_paid_window"
  | "corp_action_take_action"
  | "runner_action_gain_clicks"
  | "runner_action_paid_window_before_turn_begin"
  | "runner_action_paid_window_before_action"
  | "runner_action_take_action"
  | "run_initiation_begin"
  | "run_initiation_paid_window"
  | "run_approach_ice_paid_window"
  | "run_encounter_ice_paid_window"
  | "run_movement_jack_out_choice"
  | "run_success_breach_server"
  | "breach_choose_candidate"
  | "access_mid_access_window"
  | "access_steal_agenda"
  | "access_trash_or_continue"
  | "run_ends_cleanup"
```

Für MVP 0.1 dürfen viele Timingpunkte leere Durchläufe sein. Entscheidend ist, dass die Struktur existiert und später nicht neu erfunden werden muss.

### 14.3 ChoiceRequest und Priority

```ts
type ChoiceRequest = {
  id: string
  side: "corp" | "runner"
  prompt: string
  legalActions: LegalAction[]
  canPass: boolean
  context: ChoiceContext
}
```

Ablauf:

1. Engine erzeugt einen ChoiceRequest.
2. Nur die betroffene Seite erhält Auswahl und private Optionsdaten.
3. Spieler oder KI wählt eine Aktion oder Pass.
4. Engine verarbeitet die Entscheidung.
5. Wenn beide Seiten in einem Fenster passen müssen, geht es erst nach beidseitigem Pass weiter.
6. Pass-Entscheidungen in Priority Windows werden im State gespeichert und bei neuer relevanter Fähigkeit zurückgesetzt, falls die Regeln dies verlangen.

Die UI darf während eines ChoiceRequest nur die passenden Aktionen anzeigen. Intern kann diese Struktur später als `PriorityWindow` mit gespeicherten Pass-Entscheidungen modelliert werden; für MVP 0.1 reicht `ChoiceRequest`, sofern der State eindeutig speichert, welche Seite gerade entscheiden darf.

## 15. Resolver-Pipeline

LegalActions allein reichen nicht. Kosten, Targets, mehrteilige Effekte, Checkpoints, `PendingEffects`, `PendingChoices` und spätere Replacement-/Prevention-Effekte brauchen einen stabilen Resolver. Eine explizite `PendingEffectQueue` ist für MVP 0.1 noch nicht zwingend, darf durch die Pipeline aber nicht ausgeschlossen werden.

Grundablauf:

1. LegalActions aus GameState, TimingPoint und berechtigter PlayerView berechnen.
2. PlayerAction gegen aktuellen State, Seite, TimingPoint, ActionId, Kosten und Targets validieren.
3. Kosten bezahlen und CostPaidCheckpoint auslösen, falls relevant.
4. Eine einzelne Instruction ausführen.
5. Checkpoint ausführen und PendingEffects oder PendingChoices erzeugen.
6. Pflicht- und optionale Entscheidungen als ChoiceRequest serialisieren.
7. Nächste Instruction oder nächsten TimingPoint fortsetzen.
8. GameState validieren, Event schreiben, StateHash erzeugen und PlayerViews neu berechnen.

Ab späteren Ausbaustufen muss die Engine die Semantik für `cannot`, `if able`, nicht ausführbare Teilanweisungen, verschachtelte Kosten, Prevention, Replacement und Interrupts unterstützen. Für MVP 0.1 wird diese Komplexität nicht vollständig implementiert, aber die Pipeline darf sie nicht unmöglich machen.

## 16. Engine-Invarianten

Nach jeder Engine-Transition muss `validateGameState()` mindestens folgende Invarianten prüfen:

- Jede CardInstance existiert genau einmal in genau einer Zone oder als gehostetes Objekt.
- Jede Zone enthält CardInstanceRefs, nicht duplizierte Kartenobjekte.
- Sichtbare und verdeckte Eigenschaften entsprechen Zone, Rezzed-/Faceup-Status und Kartenstatus.
- Credits, Clicks, Tags, Bad Publicity, Memory und Agenda Points liegen im erlaubten Wertebereich der aktuellen Regeln.
- Runner-Programme überschreiten die Memory-Grenze nur, wenn unmittelbar ein Pflicht-Trash-ChoiceRequest offen ist.
- ICE-Reihenfolge ist eindeutig und dokumentiert.
- Remote-Server ohne Root-Karten und ohne ICE werden entfernt, sofern keine laufende Regel etwas anderes verlangt.
- PendingChoices sind genau einer Seite zugeordnet und leaken keine privaten Optionsdaten.
- LegalActions haben bezahlbare Kosten und gültige Targets.
- Jedes Event referenziert eine gültige Vorher/Nachher-Transition.
- Jeder erfolgreiche Resolver-Lauf erzeugt einen reproduzierbaren StateHash.
- Es gibt keinen negativen Credit-, Click- oder Counter-Zustand, außer eine Regel erlaubt ihn ausdrücklich.

## 17. Run-, Breach- und Access-Modell

Runs sind der komplexeste Kernbereich und müssen als eigene State Machine modelliert werden.

```ts
type RunState = {
  runId: string
  attackedServerId: string
  originalServerId: string
  timingPoint: TimingPointId
  phase: "initiation" | "approach_ice" | "encounter_ice" | "movement" | "success" | "run_ends"
  position:
    | { kind: "ice"; serverId: string; iceIndex: number }
    | { kind: "server"; serverId: string }
    | null
  approachedIceId?: string
  encounteredIceId?: string
  unbrokenSubroutines: SubroutineRef[]
  passedIceThisPhase?: string
  successfulDeclared: boolean
  unsuccessfulDeclared: boolean
  jackOutAllowed: boolean
  badPublicityFund: number
  temporaryCredits: TemporaryCredit[]
  breach: BreachState | null
  endRunPending: boolean
}
```

### 17.1 Run-Ablauf in MVP 0.1

1. Runner wählt LegalAction `run_server` und einen erlaubten Server.
2. Engine erstellt RunState und setzt TimingPoint auf `run_initiation_begin`.
3. Falls ICE vorhanden ist, nähert sich der Runner dem äußersten noch nicht passierten ICE.
4. Corp erhält bei unrezzed ICE eine Choice zum Rezzen, sofern Kosten bezahlbar sind.
5. Runner encountered gerezztes ICE und kann passende Breaker-Fähigkeiten nutzen.
6. Ungebrochene Subroutinen werden in definierter Reihenfolge aufgelöst.
7. Wenn der Run nicht beendet wurde, passiert der Runner ICE und bewegt sich weiter.
8. Nach dem letzten ICE erreicht der Runner den Server; bei erfolgreichem Run wird Breach gestartet.
9. Beim Access wird die aktuelle Karte nach Serverregeln bestimmt und die passende Entscheidung angeboten.
10. Nach Access und Cleanup endet der Run; temporäre Credits und RunState werden bereinigt.

### 17.2 BreachState und AccessState

```ts
type BreachState = {
  serverId: string
  accessLimit: number
  candidates: AccessCandidate[]
  accessed: CardInstanceRef[]
  currentAccess: AccessState | null
}

type AccessState = {
  cardRef: CardInstanceRef
  sourceZone: ZoneRef
  cardVisibleToRunner: boolean
  midAccessUsed: boolean
  stealRequired: boolean
  trashOptionAvailable: boolean
}
```

### 17.3 Access-Regeln MVP 0.1

| Server | Access-Regel |
|---|---|
| HQ | Zufälliger Zugriff auf eine Karte aus HQ; Zufallsentscheidung mit Seed und RandomCounter protokollieren. |
| R&D | Zugriff auf oberste Karte; Reihenfolge bleibt für Runner verdeckt, außer während des erlaubten Access. |
| Archives | Offene Karten sichtbar; verdeckte Karten werden beim Breach nach MVP-Regel aufgedeckt und danach nicht mehr als verdeckt behandelt. |
| Remote | Zugriff auf Root-Karten des Servers; Agendas werden gestohlen, trashbare Assets können gegen Trash Cost getrasht werden. |

Während Access muss die Engine Entscheidungen anbieten können:

- Agenda stehlen, wenn die Steal-Bedingung erfüllt ist.
- Trash Cost zahlen, wenn Karte trashbar ist.
- Karte nicht trashen.
- Nächste Karte accessen, falls mehrere Kandidaten existieren.
- Access beenden, wenn keine Pflichtaktion offen ist.

## 18. Siegbedingungen

MVP 0.1 braucht mindestens Agenda-Siegbedingungen für Runner und Corp. Weitere Siegbedingungen werden nur implementiert, wenn sie im festen Demo-Kartenpool vorkommen.

Mindesttests:

- Ein deterministischer Runner-Sieg durch Agenda-Steal.
- Ein deterministischer Corp-Sieg durch Agenda-Score.
- Ein Match ohne Sieger nach Teilspielzustand.
- StateHash-Stabilität nach Siegbedingungsprüfung.

Da das erste Demo-Deck nur drei Agendas mit je 2 Punkten vorsieht, sollte der Siegwert für MVP-Testpartien konfigurierbar sein. Alternativ muss das Deck so angepasst werden, dass eine normale Agenda-Punkt-Siegbedingung erreichbar ist.

## 19. Verdeckte Information und PlayerViews

Verdeckte Informationen dürfen nicht nur im UI ausgeblendet werden. Sie dürfen im falschen Client, in KI-Inputs, öffentlichen Events, Fehlerausgaben und öffentlichen Replays gar nicht vorhanden sein.

### 19.1 Vollständiger GameState

Der serverseitige GameState kennt alles:

- HQ-Karten,
- R&D-Reihenfolge,
- Stack-Reihenfolge,
- unrezzed ICE,
- verdeckte Assets und Upgrades,
- verdeckte Archives-Karten,
- Handkarten beider Spieler,
- alle zufälligen Entscheidungen.

Dieser Zustand bleibt ausschließlich serverseitig oder in lokaler Test-/Debugumgebung.

### 19.2 RunnerView

RunnerView darf nicht enthalten:

- HQ-Kartendetails,
- R&D-Reihenfolge,
- Identität unrezzed ICE,
- verdeckte Remote-Kartendetails,
- verdeckte Archives-Details vor erlaubtem Zugriff,
- interne CardIds verdeckter Corp-Karten,
- private Zufallsergebnisse außerhalb erlaubter Information.

RunnerView darf enthalten:

- HQ-Kartenanzahl,
- R&D-Kartenanzahl,
- Archives-Informationen nach Sichtbarkeitsregel,
- unrezzed ICE als verdeckte Karte ohne Identität,
- verdeckte Remote-Karten als verdeckte Karte ohne Identität,
- öffentliche Spielwerte wie Credits, Clicks, Score, Serverstruktur und gerezzte Karten.

### 19.3 CorpView

CorpView darf enthalten:

- HQ vollständig,
- R&D vollständig,
- Archives gemäß Corp-Sicht,
- unrezzed ICE vollständig,
- verdeckte Remote-Karten vollständig,
- eigene Entscheidungen und private Events.

CorpView darf nicht enthalten:

- Runner-Handkartendetails,
- Runner-Stack-Reihenfolge,
- private Runner-Entscheidungsdetails außerhalb offener Information.

### 19.4 Sichtbarkeitsregeln pro Objekt

| Objekt | Regel |
|---|---|
| GameState | Vollständige Informationen; nur serverseitig oder lokal im Debug. |
| PlayerView | Nur Informationen der jeweiligen Seite. Verdeckt bedeutet keine CardId, kein Titel, keine Kosten, keine Kartentypen und keine Reihenfolge, soweit nicht offen. |
| PublicGameEvent | Keine verdeckten CardIds, Titel oder privaten Zufallsergebnisse. |
| PrivateGameEvent | Darf seitenbezogene Details enthalten; nur an berechtigte Seite. |
| Replay | Zwei Modi: vollständiger Debug-Replay serverseitig und sichtgefilterter Spieler-Replay. |
| SpectatorView | Für MVP 0.1 nicht nötig; falls später Zuschaueransicht ergänzt wird, gilt mindestens dieselbe Filterung wie beim sichtgefilterten Replay. |
| Error Message | Keine privaten Kartennamen, internen IDs oder Debug-Dumps im Client. |
| KI-Input | Ausschließlich PlayerView, PublicEventLog und LegalActions der KI-Seite. |

Pflichttests prüfen, dass verbotene CardIds, Titel und verdeckte Zoneninhalte in keiner falschen Ausgabe erscheinen.

## 20. EventLog, Replay, Zufall und StateHash

### 20.1 GameEvent

```ts
type GameEvent = {
  eventId: string
  eventSchemaVersion: string
  stateVersionBefore: number
  stateVersionAfter: number
  timestamp: string
  side: Side | "system"
  actionType: string
  timingPoint: TimingPointId
  publicText: string
  privateText?: Partial<Record<Side, string>>
  publicPayload: unknown
  privatePayload?: Partial<Record<Side, unknown>>
  randomDraws?: RandomDrawRecord[]
  resultingStateHash: string
}
```

Jedes Event muss zwischen öffentlichen und privaten Informationen unterscheiden. PublicEventPayloads dürfen keine verdeckten CardIds oder privaten Kartennamen enthalten.

### 20.2 Replay

Replay ist in MVP 0.1 kein Komfortfeature, sondern ein Qualitätsinstrument. Eine vollständige Beispielpartie muss aus folgenden Daten reproduzierbar sein:

- initialState,
- EventLog,
- RulesBaseline,
- Seed,
- RandomCounter bzw. RandomDrawRecords.

Für die UI reicht zunächst ein einfacher EventLog-Viewer. Serverseitig muss ein Debug-Replay den finalen StateHash prüfen können.

### 20.3 Zufall und Fairness

Zufällige Entscheidungen müssen reproduzierbar sein:

- Deck mischen,
- zufälliger HQ-Access,
- zufällige Auswahl durch spätere Karteneffekte.

```ts
type RandomState = {
  seed: string
  counter: number
}
```

Jede Zufallsentscheidung wird im EventLog mit Zweck, Counter und Ergebnis dokumentiert. Für private Spiele reicht das aus. Für öffentliche kompetitive Spiele wären später zusätzliche Fairness-Mechanismen nötig.

### 20.4 StateHash

StateHash wird nach jeder Transition über kanonische JSON-Serialisierung berechnet, nicht über unkontrollierte Objekt-Reihenfolge.

Nutzen:

- Replay-Validierung,
- Debugging,
- Multiplayer-Synchronisation,
- Regressionstests,
- Erkennen divergierender Zustände.

## 21. Persistenz und Migration

Für die erste lokale Version genügt ein Storage-Adapter mit JSON-Dateien oder SQLite. Sobald mehrere Matches, WebSocket oder Reconnect relevant werden, ist SQLite gegenüber reinen JSON-Dateien vorzuziehen.

Mindestregeln:

- Jeder Match-Snapshot enthält baseline, gameState, stateVersion, EventLog-Position und createdAt.
- Snapshots werden mindestens bei Spielstart, nach N Events und bei Match-Ende gespeichert.
- EventLog und Snapshot enthalten Schema-Versionen.
- Migrationen können alte Events/Snapshots in neue Schema-Versionen überführen oder als `read-only replay` markieren.
- Persistente Logs enthalten keine unverschlüsselten privaten Tokens oder Secrets.
- Crash Recovery rekonstruiert aktive Matches aus Snapshot + EventLog oder markiert sie sauber als pausiert.

## 22. Kartenstrategie

### 22.1 Grundsatzentscheidung

MVP 0.1 beginnt mit festen Demo- und Lerndecks, nicht mit freiem Deckbau. Diese Decks sind technische Test- und Lerninstrumente, keine turnierlegalen oder balancierten Decks.

Gründe:

- Netrunner hat hohe Regel- und Karteneffektkomplexität.
- Freier Deckbau würde früh sehr viele Karten und Sonderfälle verlangen.
- Feste Decks reduzieren UI-, Engine-, KI- und Testkomplexität.
- Jede Karte kann isoliert getestet werden.
- Partien sind reproduzierbarer.
- Die KI erhält einen begrenzten Entscheidungsraum.

### 22.2 Anforderungen an erste Demo-Decks

Die ersten festen Decks müssen:

- zentrale Grundmechaniken abbilden,
- möglichst wenige Sonderregeln enthalten,
- typische Runner- und Corp-Spielweisen zeigen,
- für menschliche Spieler nachvollziehbar sein,
- der KI einen begrenzten Entscheidungsraum geben,
- reproduzierbar sein,
- nur Karten enthalten, die vollständig implementiert oder eindeutig als nicht spielbar markiert sind.

### 22.3 Empfohlenes erstes Deckpaar

| Seite | Deck | Ausrichtung | Zweck |
|---|---|---|---|
| Runner | Runner Demo Deck 01 – Run & Steal | Criminal-orientiert, Run & Money | Credits aufbauen, Runs durchführen, ICE mit Breakern überwinden, Agendas stehlen. |
| Corp | Corp Demo Deck 01 – Build & Score | Weyland-orientiert, Build & Score | ICE installieren und rezzen, Remote-Server bauen, Agendas installieren, advancen und scoren. |

Diese Kombination deckt die Kernschleifen des Spiels ab, ohne sofort Tags, Trace, Viren, Damage, komplexe Timingfenster oder Spezialkarten zu verlangen.

## 23. CardImplementation-Manifest

Jede Karte im festen Deck erhält einen Implementierungseintrag. Eine Karte darf nur in einem aktiven Demo-Deck spielbar sein, wenn alle im Demo-Kontext relevanten Fähigkeiten implementiert und getestet sind.

```ts
type CardImplementationStatus =
  | "data_only"
  | "stub_visible_not_playable"
  | "playable_mvp"
  | "playable_full"
  | "blocked"

type CardImplementation = {
  cardCode: string
  title: string
  rulesTextSnapshot: string
  status: CardImplementationStatus
  implementedAbilities: string[]
  unsupportedAbilities: string[]
  allowedInDecks: string[]
  requiredTests: string[]
  knownLimitations: string[]
}
```

Auswahlkriterien für `playable_mvp`:

- möglichst ein einzelner mechanischer Zweck pro Karte,
- keine zusätzlichen Steal-Kosten,
- keine Prevention-, Avoid-, Replacement- oder Interrupt-Effekte,
- keine Traces, Tags, Damage oder Viren,
- keine Hosted-Card-Mechanik,
- keine Server-Umleitung, Forced Encounters, Multiaccess oder Bypass,
- keine Texte mit mehreren nicht-trivialen Timingfenstern,
- mindestens ein Unit-Test und ein Integrationstest pro spielbarer Karte.

Gedruckter Kartentext und maschinenlesbare Engine-Logik bleiben getrennt. Die Engine interpretiert Kartentext nicht automatisch.

### 23.1 Karteneffekt-System

Für MVP 0.1 werden nur wenige einfache Karten manuell definiert. Das Kartensystem muss aber so strukturiert sein, dass später generische AbilityDefinitions und Custom Resolver möglich sind.

```ts
type AbilityDefinition = {
  trigger: Trigger
  cost?: Cost[]
  effect: Effect[]
  timing: TimingWindow
}
```

Beispiel für eine einfache Breaker-Fähigkeit:

```json
{
  "trigger": "paid_ability",
  "cost": [{ "type": "credit", "amount": 1 }],
  "effect": [{ "type": "break_subroutine", "amount": 1 }]
}
```

Komplexe Karten bekommen später eigene Resolver, statt durch freie Textinterpretation umgesetzt zu werden.

```ts
type CardResolver = {
  cardId: string
  getLegalActions(gameState: GameState, cardInstance: CardInstance): LegalAction[]
  resolveAbility(gameState: GameState, action: PlayerAction): EngineResult
}
```

### 23.2 Priorisierung der Kartenimplementierung

Die Implementierung erfolgt nicht nach Beliebtheit oder Vollständigkeit, sondern nach technischer Nützlichkeit.

| Priorität | Kartentypen / Mechaniken |
|---:|---|
| 1 | Einfache Economy-Karten, einfache Agendas, einfache ICE, einfache Icebreaker, einfache Installationskarten. |
| 2 | Assets mit Trash-Kosten, einfache Upgrades, einfache Run-Events, einfache Draw-Karten, klare Triggerbedingungen. |
| 3 | Schaden, Tags, Prevention, Replacement-Effekte, Hosting, Virus Counter, komplexe Paid Abilities, komplexe Timingfenster. |
| 4 | Vollständige Fraktionsmechaniken, breiter Kartenpool, Sonderfälle einzelner Karten, seltene Timingkonflikte, vollständige Turnierlegalität. |

## 24. Demo-Decks für MVP 0.1

### 24.1 Runner Demo Deck 01 – Run & Steal

| Karte | Anzahl | Typ | Zweck |
|---|---:|---|---|
| Runner Identity | 1 | Identity | Startidentität ohne aktive Sonderfähigkeit. |
| Simple Economy Event | 3 | Event | Sofortige Credits. |
| Simple Run Event | 3 | Event | Einfacher Run mit kleinem Bonus. |
| Simple Fracter | 2 | Program: Icebreaker – Fracter | Bricht Barrier-Subroutinen. |
| Simple Decoder | 2 | Program: Icebreaker – Decoder | Bricht Code-Gate-Subroutinen. |
| Simple Killer | 2 | Program: Icebreaker – Killer | Bricht Sentry-Subroutinen. |

#### Runner Identity

- Typ: Runner Identity
- Fähigkeit: deaktiviert
- Implementierungsstatus: sichtbar, aber ohne aktive Ability

Diese Karte initialisiert die Runner-Seite sauber und setzt keine Sonderregeln voraus. Die UI markiert sie als Testidentität.

#### Simple Economy Event

- Typ: Event
- Kosten: 0 Credits
- Text: „Erhalte 4 Credits.“
- Rolle: Economy

Testet: Event spielen, Kosten prüfen, Click ausgeben, Effekt ausführen, Karte in den Heap legen. Keine Bedingungen, Trigger oder verdeckte Information.

#### Simple Run Event

- Typ: Event
- Kosten: 0 Credits
- Text: „Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.“
- Rolle: Run-Event

Testet: Übergang von Karteneffekt in Run-Sequenz, Serverauswahl, Run-Start, Erfolg/Fehlschlag speichern, Bonus nach Run auswerten. Kein Bypass, kein Multiaccess, kein Replacement-Effekt.

#### Simple Fracter

- Typ: Program – Icebreaker – Fracter
- Installationskosten: 2 Credits
- Memory: 1 MU
- Stärke: 2
- Fähigkeiten:
  - „1 Credit: +1 Stärke.“
  - „1 Credit: Brich 1 Barrier-Subroutine.“

Testet: Pump-Fähigkeit, Stärkevergleich, Subroutinen-Auswahl, Brechen einzelner Barrier-Subroutinen.

#### Simple Decoder

- Typ: Program – Icebreaker – Decoder
- Installationskosten: 3 Credits
- Memory: 1 MU
- Stärke: 2
- Fähigkeiten:
  - „1 Credit: +1 Stärke.“
  - „1 Credit: Brich 1 Code-Gate-Subroutine.“

Testet denselben Breaker-Ablauf für Code Gates.

#### Simple Killer

- Typ: Program – Icebreaker – Killer
- Installationskosten: 3 Credits
- Memory: 1 MU
- Stärke: 1
- Fähigkeiten:
  - „1 Credit: +1 Stärke.“
  - „1 Credit: Brich 1 Sentry-Subroutine.“

Testet Breaker-Ablauf gegen Sentries und erzeugt eine relevante Entscheidung gegen strafendere ICE.

### 24.2 Corp Demo Deck 01 – Build & Score

| Karte | Anzahl | Typ | Zweck |
|---|---:|---|---|
| Corp Identity | 1 | Identity | Startidentität ohne aktive Sonderfähigkeit. |
| Simple Agenda | 3 | Agenda | Installieren, advancen, scoren oder stehlen. |
| Simple Economy Operation | 3 | Operation | Sofortige Credits. |
| Simple Economy Asset | 3 | Asset | Remote-Installation, Rez, Trash-Kosten. |
| Simple Barrier ICE | 3 | ICE – Barrier | Einfacher Stopper. |
| Simple Code Gate ICE | 3 | ICE – Code Gate | Kleiner Tax-Effekt plus End-the-run. |
| Simple Sentry ICE | 3 | ICE – Sentry | Einfache Strafwirkung ohne Damage/Tags. |

#### Corp Identity

- Typ: Corp Identity
- Fähigkeit: deaktiviert
- Implementierungsstatus: sichtbar, aber ohne aktive Ability

Initialisiert die Corp-Seite ohne Fraktionsbonus, Trigger oder Sonderregeln.

#### Simple Agenda

- Typ: Agenda
- Advancement Requirement: 3
- Agenda Points: 2
- Text: keine zusätzliche Fähigkeit
- Rolle: basale Score-/Steal-Karte

Testet: Agenda installieren, Advancement-Token legen, Score-Bedingung prüfen, scoren; auf Runner-Seite Agenda-Steal beim Zugriff.

#### Simple Economy Operation

- Typ: Operation
- Kosten: 0 Credits
- Text: „Erhalte 4 Credits.“
- Rolle: Corp-Economy

Testet: Operation spielen, Credit-Änderung, Karte nach Archives verschieben.

#### Simple Economy Asset

- Typ: Asset
- Rez-Kosten: 1 Credit
- Trash-Kosten: 3 Credits
- Text: „Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.“
- Rolle: installierbare Remote-Economy

Testet: verdeckt installieren, Remote-Server, später rezzen, beim Zugriff sichtbar sein, Runner-Trash gegen Trash-Kosten. Vermeidet wiederkehrende Trigger, Hosted Credits und komplizierte Aktivierungsfenster.

#### Simple Barrier ICE

- Typ: ICE – Barrier
- Rez-Kosten: 3 Credits
- Stärke: 3
- Subroutinen:
  - „End the run.“

Testet: ICE-Installation, ICE-Rez, Encounter, Stärkevergleich, Barrier-Breaking, Run-Ende durch ungebrochene Subroutine.

#### Simple Code Gate ICE

- Typ: ICE – Code Gate
- Rez-Kosten: 2 Credits
- Stärke: 2
- Subroutinen:
  - „Die Corp erhält 1 Credit.“
  - „End the run.“

Testet: ICE mit mehreren Subroutinen und Entscheidung, ob nur End-the-run oder auch der kleine Economy-Effekt gebrochen wird.

#### Simple Sentry ICE

- Typ: ICE – Sentry
- Rez-Kosten: 4 Credits
- Stärke: 3
- Subroutinen:
  - „Der Runner verliert 2 Credits, falls möglich.“
  - „End the run.“

Simuliert strafendere Sentry-Logik ohne Damage, Tags oder Program-Trash.

### 24.3 Bewusste Vereinfachungen der Demo-Karten

Die ersten Karten verwenden keine Tags, Traces, Viren, Damage-Effekte, Hosted Cards, Multiaccess, Bypass, Replacement-Effekte oder komplexe Paid-Ability-Fenster. Identitätsfähigkeiten bleiben deaktiviert. Jede Karte deckt eine klar isolierte Mechanik ab, damit Fehler in Engine, UI oder KI reproduzierbar bleiben.

### 24.4 Beispiel: internes Runner-Deckformat

```json
{
  "id": "demo_runner_001",
  "name": "Runner Demo Deck 01 - Run & Steal",
  "side": "runner",
  "purpose": "engine_test_and_tutorial",
  "version": "0.1.0",
  "legal": false,
  "description": "Festes Runner-Demonstrationsdeck für MVP 0.1. Fokus auf Credits, Installation, Runs, Icebreaker und Agenda-Steals.",
  "identity": {
    "cardCode": "DEMO_RUNNER_IDENTITY",
    "title": "Runner Identity",
    "implemented": true,
    "abilityEnabled": false
  },
  "cards": [
    { "cardCode": "DEMO_RUNNER_ECON_EVENT", "title": "Simple Economy Event", "quantity": 3, "implemented": true, "role": "economy" },
    { "cardCode": "DEMO_RUN_EVENT", "title": "Simple Run Event", "quantity": 3, "implemented": true, "role": "run_event" },
    { "cardCode": "DEMO_FRACTER", "title": "Simple Fracter", "quantity": 2, "implemented": true, "role": "icebreaker_barrier" },
    { "cardCode": "DEMO_DECODER", "title": "Simple Decoder", "quantity": 2, "implemented": true, "role": "icebreaker_code_gate" },
    { "cardCode": "DEMO_KILLER", "title": "Simple Killer", "quantity": 2, "implemented": true, "role": "icebreaker_sentry" }
  ],
  "developmentNotes": [
    "Dieses Deck ist ein technisches Testdeck.",
    "Decklegalität ist für MVP 0.1 nicht relevant.",
    "Alle Karten müssen im CardImplementation-Manifest als playable_mvp freigegeben sein."
  ]
}
```

### 24.5 Beispiel: internes Corp-Deckformat

```json
{
  "id": "demo_corp_001",
  "name": "Corp Demo Deck 01 - Build & Score",
  "side": "corp",
  "purpose": "engine_test_and_tutorial",
  "version": "0.1.0",
  "legal": false,
  "description": "Festes Corp-Demonstrationsdeck für MVP 0.1. Fokus auf ICE, Remote-Server, Agendas, Advancement und Scoring.",
  "identity": {
    "cardCode": "DEMO_CORP_IDENTITY",
    "title": "Corp Identity",
    "implemented": true,
    "abilityEnabled": false
  },
  "cards": [
    { "cardCode": "DEMO_AGENDA", "title": "Simple Agenda", "quantity": 3, "implemented": true, "role": "agenda" },
    { "cardCode": "DEMO_CORP_ECON_OPERATION", "title": "Simple Economy Operation", "quantity": 3, "implemented": true, "role": "economy_operation" },
    { "cardCode": "DEMO_CORP_ECON_ASSET", "title": "Simple Economy Asset", "quantity": 3, "implemented": true, "role": "economy_asset" },
    { "cardCode": "DEMO_BARRIER_ICE", "title": "Simple Barrier ICE", "quantity": 3, "implemented": true, "role": "ice_barrier" },
    { "cardCode": "DEMO_CODE_GATE_ICE", "title": "Simple Code Gate ICE", "quantity": 3, "implemented": true, "role": "ice_code_gate" },
    { "cardCode": "DEMO_SENTRY_ICE", "title": "Simple Sentry ICE", "quantity": 3, "implemented": true, "role": "ice_sentry" }
  ],
  "developmentNotes": [
    "Dieses Deck ist ein technisches Testdeck.",
    "Decklegalität ist für MVP 0.1 nicht relevant.",
    "Die Corp muss ICE installieren, rezzen, Agendas advancen und scoren können."
  ]
}
```

## 25. Card Data, Copyright, Assets und Attribution

Für MVP 0.1 gilt eine vorsichtige Datenstrategie:

- Kartendaten werden nicht frei interpretiert, sondern aus manuell definierten Demo-Karten oder einem versionierten lokalen Snapshot übernommen.
- Gedruckter Kartentext und maschinenlesbare Engine-Logik bleiben getrennt.
- Kartenbilder, Frames, Rückseiten, Logos und Artwork werden nur genutzt, wenn die jeweilige Nutzungsfreigabe dies erlaubt.
- Für öffentliche oder halböffentliche Bereitstellung muss separat geprüft werden, ob Namen, Logos, Kartentexte, Bilder und Markenhinweise zulässig verwendet werden.
- Eine Attribution-/Credits-Seite wird von Anfang an vorgesehen.
- Externe Kartendaten werden gecacht und nicht unnötig häufig abgerufen; bei späterer Nutzung von NetrunnerDB-/NSG-Daten sind HTTP-Caching und die jeweilige Nutzungsfreigabe zu beachten.
- Visuelle Asset-Regeln werden separat geprüft; Hinweise wie die Null-Signal-Games-Visual-Assets-Guidelines und dort genannte Lizenzmodelle, etwa CC BY-ND 4.0 für bestimmte Assets, ersetzen keine pauschale Freigabe für Card Art, Frames oder Card Backs.

Dieser Abschnitt ist eine technische Vorsichtsmaßnahme und ersetzt keine Rechtsberatung.

## 26. KI-Konzept MVP 0.1

### 26.1 Grundsatz

Die Corp-KI ist ein Controller, kein Regelakteur. Sie erhält nur PlayerView, PublicEventLog und LegalActions. Sie darf weder Kartentexte interpretieren noch illegale Aktionen erzeugen. Jede KI-Entscheidung wird durch `applyAction` erneut validiert.

```ts
type AiDecisionInput = {
  side: "corp"
  playerView: PlayerView
  publicEventLog: PublicGameEvent[]
  legalActions: LegalAction[]
  difficulty: "easy" | "normal" | "hard"
  seed: string
}

type AiDecision = {
  actionId: string
  reason?: string
  confidence?: number
}
```

Die KI bekommt nicht:

- verdeckte Runner-Informationen,
- vollständigen GameState,
- Zugriff auf illegale Aktionen,
- nicht sichtbare Kartendetails,
- private Debug-Dumps.

### 26.2 Corp-Heuristik

Priorisierte Entscheidungsregeln:

| Priorität | Regel |
|---:|---|
| 1 | Wenn eine Agenda scorebar ist und genug Clicks vorhanden sind: scoren. |
| 2 | Wenn Credits niedrig sind: Economy-Operation spielen oder Credit nehmen. |
| 3 | Wenn zentrale Server ungeschützt sind und ICE verfügbar ist: R&D oder HQ schützen. |
| 4 | Wenn Agenda auf HQ und Remote-Server möglich ist: Remote vorbereiten oder Agenda installieren. |
| 5 | Wenn Agenda in Remote liegt: advancen, sofern Schutz und Credits ausreichend sind. |
| 6 | Wenn Runner häufig einen Server angreift: dort ICE installieren oder rezzen. |
| Fallback | Erste legale sichere Basisaktion wählen, bevorzugt Credit nehmen oder Zug beenden. |

Die erste KI muss nicht stark sein. Sie muss regelkonform, stabil, deterministisch testbar und nachvollziehbar sein.

### 26.3 Stabilitätsregeln

- Jede KI-Entscheidung hat ein Zeitbudget.
- Ungültige, abgelaufene oder nicht mehr legale actionIds werden abgelehnt.
- Bei Timeout, Fehler oder ungültiger Antwort greift eine deterministische Fallback-Aktion.
- KI-vs-KI ist für MVP 0.1 kein Ziel, kann aber als interner Smoke-Test vorbereitet werden.
- KI-Erklärungen dürfen nur Informationen aus PlayerView und öffentlichen Events verwenden.
- Tests prüfen, dass im KI-Input keine verdeckten Runner- oder Corp-Informationen enthalten sind.

### 26.4 Spätere Runner-KI

Eine spätere Runner-KI sollte priorisieren:

- Economy aufbauen,
- Rig installieren,
- offene oder schwach geschützte Server angreifen,
- R&D/HQ pressure aufbauen,
- gefährliche Runs bei wenig Grip vermeiden,
- Tags entfernen, wenn diese Mechanik später existiert,
- Scoring Remote angreifen, wenn die Corp verdächtig advanced.

### 26.5 LLM-KI nur als spätere Option

Ein LLM darf später höchstens strategischer Berater sein. Es darf nur eine actionId aus LegalActions zurückgeben und keine Regeln auslegen. Es erhält keine verdeckten Informationen. Eine LLM-Strategie wird nicht vor stabiler LegalAction-, Visibility- und Replay-Schicht eingeführt.

### 26.6 Schwierigkeitsgrade ohne Informationsvorteil

Schwierigkeitsgrade dürfen nicht dadurch entstehen, dass die KI verdeckte Karten kennt. Ein späterer Hard-Modus verwendet bessere Bewertung, tiefere Suche, Risikoabschätzung und Simulationen auf Basis erlaubter Informationen. Easy kann bewusst schwächere Heuristiken nutzen; Normal soll eine faire, nachvollziehbare Heuristik verwenden.

## 27. UI-/UX-Konzept

### 27.1 Layout

| Bereich | Inhalt |
|---|---|
| Oben: Corp | HQ-Zähler, R&D-Zähler, Archives, Score Area, Credits, Clicks, Bad Publicity als Zukunftsfeld, Remote-Server, ICE. |
| Unten: Runner | Grip, Stack-Zähler, Heap, Score Area, Credits, Clicks, Tags als Zukunftsfeld, Memory, Rig mit Programmen und später Hardware/Resources. |
| Mitte: Server/Run | Serverstruktur, angegriffener Server, aktuelle ICE-Position, Run-Step, Encounter-Status, Breach/Access-Status. |
| Rechts: Aktionen/Log | LegalActions, ChoiceRequests, EventLog, KI-Erklärung, Validierungsfehler. |
| Debug/Lernen | TimingPoint, StateVersion, Seed, StateHash, letzte Events, Gründe für gesperrte Aktionen optional. |

### 27.2 UX-Prinzipien

- Die UI zeigt nur legale Aktionen und notwendige Entscheidungen.
- Kosten, Targets und erwartete Konsequenzen einer Aktion werden vor Ausführung sichtbar gemacht.
- Fehler sind regelbezogen und knapp: falscher Timingpunkt, zu wenig Credits, ungültiges Target, veralteter State.
- Run-Schritte werden geführt dargestellt, damit der Nutzer den Ablauf versteht.
- Verdeckte Karten werden als neutrale verdeckte Karten angezeigt; Titel, Typ, Kosten und interne ID bleiben verborgen.
- Kartendetails werden nur für sichtbare oder eigene Karten angezeigt.
- EventLog unterscheidet öffentliche und seitenbezogene private Informationen.
- Debug-Ansichten mit vollständigem State sind lokal oder serverseitig geschützt.

### 27.3 Mindest-Screens für MVP 0.1

| Screen | Mindestfunktion |
|---|---|
| Start / Setup | Neues Demo-Spiel, Seed optional eingeben, RulesBaseline und Abweichungen anzeigen, Spiel starten. |
| Game Board | MVP-Zonen, aktuelle Phase, LegalActions, ChoiceRequests. |
| Run View | Serverwahl, ICE-Kette, Rez-Status, Break-Optionen, Subroutinen, Access. |
| Card Detail | Sichtbare Kartendaten, Implementierungsstatus, bekannte Limitierungen. |
| EventLog / Replay | Eventsequenz, StateVersion, öffentliche Texte, Replay-Start. |
| Debug Panel | Nur lokal: StateHash, TimingPoint, Invariant-Ergebnis, letzte Engine-Fehler. |

## 28. Backend und spätere Human-vs-Human-Vorbereitung

MVP 0.1 baut Human-vs-Human nicht, aber die Daten- und Action-Struktur muss darauf vorbereitet sein.

### 28.1 Match-Erstellung für spätere Online-Spiele

Späterer Ablauf:

1. Spieler erstellt neues privates Spiel.
2. App erzeugt Match-ID.
3. Spieler wählt Seite: Corp, Runner oder zufällig.
4. App erzeugt privaten Einladungslink mit geheimem Token.
5. Zweiter Spieler öffnet Link.
6. Zweiter Spieler übernimmt freie Seite.
7. Beide wählen Deck oder Standarddeck.
8. Server validiert Setup.
9. Spiel startet.

Ein vollständiges Accountsystem ist für private Spiele nicht sofort nötig. Ein Token-Link reicht für frühe private Versionen.

### 28.2 REST und WebSocket

REST eignet sich für:

- Match erstellen,
- Match laden,
- Deck speichern,
- Replay laden,
- optional Login.

WebSocket eignet sich für das laufende Spiel:

- `join_match`,
- `submit_action`,
- `request_undo`,
- `accept_undo`,
- `decline_undo`,
- `pass_priority`,
- optional `chat_message`,
- `disconnect`,
- `reconnect`.

```ts
type ClientMessage =
  | { type: "join_match"; matchId: string; token: string }
  | { type: "submit_action"; matchId: string; action: PlayerAction }
  | { type: "request_undo"; matchId: string; toEventId: string }
  | { type: "pass_priority"; matchId: string }

type ServerMessage =
  | { type: "state_update"; view: PlayerView }
  | { type: "legal_actions"; actions: LegalAction[] }
  | { type: "event_log_update"; events: PublicGameEvent[] }
  | { type: "choice_request"; choice: ChoiceRequest }
  | { type: "error"; message: string }
```

### 28.3 Multiplayer-Konsistenz

Für Human-vs-Human müssen Actions transaktional verarbeitet werden:

- Jedes Match hat eine monoton steigende Version.
- Jede PlayerAction enthält `clientKnownStateVersion`.
- Optional kann zusätzlich eine serverseitige Action Sequence Number geführt werden.
- Der Server verarbeitet immer nur eine Engine-Transition pro Match gleichzeitig.
- Die Kombination aus Match-Version, `clientKnownStateVersion` und transaktionaler Verarbeitung dient als einfache Optimistic-Locking-Strategie.
- Veraltete Actions werden mit `currentStateVersion` und neuer PlayerView beantwortet.
- Jede Action enthält `idempotencyKey`, damit doppelte WebSocket-Sendungen nicht doppelt angewendet werden.
- Optional kann jede Action zusätzlich eine `actionSequenceNumber` tragen; zusammen mit StateVersion und Transaktionsgrenze entsteht ein einfaches Optimistic-Locking-Modell.
- Reconnect sendet ausschließlich aktuelle PlayerView und zulässige LegalActions.

### 28.4 Reconnect

Bei Verbindungsabbruch:

- Match bleibt bestehen.
- Spielerstatus wird auf disconnected gesetzt.
- Gegenspieler sieht Verbindungsstatus.
- Spieler kann über denselben Link oder Account wieder einsteigen.
- Server sendet nach Reconnect die aktuelle PlayerView.
- Keine verdeckte Information wird offengelegt.

### 28.5 Undo

Undo ist später möglich, aber eingeschränkt:

- Undo nur auf Anfrage.
- Gegenspieler muss zustimmen.
- Kein Undo nach relevanter neuer verdeckter Information.
- Kein Undo nach zufälligem Zugriff, wenn dadurch neue Information bekannt wurde.
- Snapshots oder Event-Replay müssen Rückkehr ermöglichen.

Technisch kann eine spätere Undo-Anfrage mindestens so modelliert werden:

```ts
type UndoRequest = {
  matchId: string
  requestedBy: "corp" | "runner"
  targetEventId: string
  reason?: string
}
```

Für Phase 0/1 sind Snapshots einfacher. Event-Replay bleibt als Validierung wichtig.

## 29. Sicherheit und privater Betrieb

Auch eine private App braucht Mindeststandards.

| Bereich | Mindeststandard |
|---|---|
| Transport | Localhost ohne TLS ist zulässig; außerhalb localhost HTTPS/WSS nutzen. |
| Einladungslinks | Token mit ausreichender Entropie, nicht erratbar, optional ablaufend, serverseitig widerrufbar. |
| Secrets | Keine Secrets im Repository; Environment Variables oder Secret Store. |
| Logging | Keine privaten Kartendaten in allgemeinen Logs; Debug-Logs nur lokal oder geschützt. |
| Backups | Sicherung von Matchdaten, EventLogs und Deck-Snapshots bei persistenter Nutzung. |
| Crash Recovery | Nach Neustart aktive Matches aus Snapshot + EventLog rekonstruieren oder sauber pausieren. |
| Rate Limits | Pragmatische Limits für Action Submit, Start Match, Join, Reconnect und optional Login/Passwortschutz. |
| Zugriffsschutz | Für private Deployments optional einfacher Passwortschutz oder Zugriffstoken; kein umfassendes Accountsystem für MVP 0.1. |
| Debug | Full-State-Debug niemals an normale Spieleransicht ausliefern. |

Nicht sofort erforderlich:

- OAuth,
- umfassende Nutzerprofile,
- öffentliches Reporting,
- Moderation,
- Ranglisten,
- Turnierschutz.

## 30. Teststrategie

Tests sind bei diesem Projekt nicht optional. Netrunner ist wegen Timing, verdeckter Information, Karteneffekten und verschachtelten Runs zu komplex, um die Engine nur manuell zu prüfen.

### 30.1 Testarten

| Testart | MVP-Abdeckung |
|---|---|
| Unit Tests | `createGame`, `drawCard`, `gainCredit`, `installCard`, `advanceCard`, `startRun`, `rezIce`, `accessCard`, `scoreAgenda`, `stealAgenda`, `checkWinConditions`, `getPlayerView`. |
| State Machine Tests | Corp Draw, Corp Action, Runner Action, Discard/Handlimit soweit nötig, Turnwechsel, Click-Verbrauch. |
| Run Tests | Ungeschützter Server, geschützter Server, Rez, Encounter, Break, ungebrochene Subroutinen, Pass ICE, Server erreichen, Run ends. |
| Access/Breach Tests | HQ, R&D, Archives, Remote; Agenda-Steal, Trash Cost, nicht trashbare Karte, Access-Reihenfolge. |
| Visibility Tests | Keine verdeckten Kartendetails in RunnerView, CorpView-Fremdanteilen, PublicEvents, Client Payloads, KI-Input, Fehlern, Public Replay oder späterer SpectatorView. |
| Replay Tests | EventLog von initialState abspielen, Endzustand und StateHashes prüfen, Zufall reproduzieren. |
| KI Tests | KI wählt nur legale Aktionen, bleibt nicht hängen, beendet 100 Testzüge ohne Invariant-Verletzung. |
| Kartentests | Für jede `playable_mvp` Karte: Installationsbedingungen, Kosten, Timing, Effekt, Regression. |
| Regressionstests | Bugfixes und neue Karten dürfen bestehende Demo-Decks nicht brechen. |
| End-to-End-Tests | Spiel starten, Runner-Zug, Corp-Zug, Run, ICE brechen, Agenda stehlen, Corp scored Agenda, Spielende. |

### 30.2 Szenarioformat

```json
{
  "name": "Runner accesses unprotected R&D and steals agenda",
  "baseline": { "rulesVersion": "26.03", "engineSchemaVersion": "0.1.0" },
  "initialStateRef": "scenario_rd_agenda_top",
  "actions": [
    { "side": "runner", "type": "run_server", "server": "rd" },
    { "side": "runner", "type": "access_card" },
    { "side": "runner", "type": "steal_agenda" }
  ],
  "expected": { "runnerAgendaPoints": 2, "winner": null }
}
```

### 30.3 Erste Testszenarien

- Setup erzeugt reproduzierbare Deckreihenfolge und Starthände aus Seed.
- Runner nimmt Credit, zieht Karte, installiert Breaker und beendet Zug.
- Corp zieht Pflichtkarte, nimmt Credits, installiert ICE vor R&D und beendet Zug.
- Runner läuft ungeschütztes R&D und stiehlt oberste Agenda.
- Runner läuft geschütztes R&D, Corp rezzt ICE, Runner bricht Subroutine und accesses R&D.
- Runner läuft geschütztes Remote, bricht nicht, End-the-run-Subroutine beendet Run.
- Corp installiert Agenda in Remote, advanced drei Mal über mehrere Züge und scored.
- RunnerView enthält keine Details unrezzed ICE oder HQ/R&D-Karten.
- PublicGameEvent enthält keine privaten CardIds bei HQ random access.
- Replay reproduziert vollständige Beispielpartie mit identischen StateHashes.
- Corp-KI wählt bei leerem Plan eine legale Fallback-Aktion.
- Manipulierte PlayerAction mit falscher Seite oder abgelaufener StateVersion wird abgelehnt.

### 30.4 Test-Philosophie

- Kein neuer Engine-Effekt ohne Test.
- Keine neue Karte ohne Kartentest.
- Kein neuer Timing-Schritt ohne Szenario-Test.
- Kein Multiplayer-Feature ohne Visibility-Test.
- Kein Bugfix ohne Regressionstest.
- Kein `playable_mvp` Status ohne Manifest-Eintrag und Testabdeckung.

## 31. Akzeptanzkriterien

### 31.1 Akzeptanzkriterien für MVP 0.1

| Kriterium | Pass/Fail-Bedingung |
|---|---|
| Setup | Ein Match mit festen Demo-Decks startet deterministisch aus einem Seed. Starthände und Deckreihenfolge sind reproduzierbar. |
| LegalActions | UI und KI erhalten ausschließlich Aktionen, die `applyAction` akzeptiert. Manipulierte illegale Aktionen werden abgelehnt. |
| Grundaktionen | Credits, Draw, Install, Advance, Play Event/Operation und End Turn funktionieren für unterstützte Karten. |
| Run | Mindestens ein Run auf ungeschützten Server, ein Run auf geschützten Server mit ICE, ein gebrochener Encounter und ein ungebrochener Encounter sind getestet. |
| Access/Breach | HQ, R&D, Archives und Remote werden korrekt gebreacht. Agenda-Steal und Trash-Entscheidung funktionieren für Demo-Karten. |
| Scoring | Die Corp kann eine Agenda installieren, advancen und scoren. |
| Siegbedingungen | Mindestens je ein Runner-Sieg und ein Corp-Sieg existieren als deterministische Szenariotests. |
| Replay | Eine vollständige Beispielpartie kann aus initialState + EventLog reproduziert werden; alle StateHashes stimmen. |
| Visibility | RunnerView, PublicEvents, Client Payloads und KI-Input enthalten keine verdeckten HQ/R&D/unrezzed/Remote-Details. |
| KI | Die Corp-KI beendet 100 KI-Testzüge ohne ungültige Action, Endlosschleife oder State-Invariant-Verletzung. |
| Karten | Jede `playable_mvp` Karte ist im CardImplementation-Manifest dokumentiert und getestet. |
| CI | Alle Unit-, Integration-, Visibility-, Replay-, KI- und Kartentests für MVP-Karten bestehen. |
| Betrieb | Die App lässt sich lokal oder per Docker privat starten. |

### 31.2 Akzeptanzkriterien für MVP 0.2

MVP 0.2 beginnt erst nach erfüllten MVP-0.1-Gates. Für private Human-vs-Human-Partien gelten zusätzlich folgende Pass/Fail-Kriterien:

| Kriterium | Pass/Fail-Bedingung |
|---|---|
| Einladung | Match-Link mit geheimem Token erlaubt Join genau der freien Seite oder eines berechtigten Reconnects. |
| Serverautorität | Falsche Seite, falscher Token und veraltete State-Versionen werden abgelehnt. |
| Synchronisation | Nach jeder gültigen Action erhalten beide Seiten konsistente, aber unterschiedlich gefilterte PlayerViews. |
| Concurrency | Zwei gleichzeitig eingereichte Actions erzeugen keine doppelte Transition und keinen inkonsistenten State. |
| Reconnect | Disconnect/Reconnect während Action Phase, Run und Access stellt korrekte PlayerView und LegalActions wieder her. |
| Undo | Undo funktioniert vor Informationsgewinn und wird nach verdecktem Informationsgewinn blockiert oder nur nach klarer Regel freigegeben. |
| Visibility | Automatische Leak-Tests prüfen WebSocket-Nachrichten, Events, Reconnect-Payloads und Undo-Zustände. |

## 32. Definition of Done für MVP 0.1

MVP 0.1 ist fertig, wenn alle folgenden Bedingungen erfüllt sind:

- Alle Akzeptanzkriterien aus Abschnitt 31 sind erfüllt.
- Jede absichtliche Regelvereinfachung steht im Abweichungsregister.
- Jede Engine-Transition validiert den State und erzeugt ein Event mit StateHash.
- Eine vollständige Beispielpartie ist manuell spielbar und automatisch replaybar.
- Die Corp-KI spielt 100 Testzüge ohne illegale Aktion oder Invariant-Verletzung.
- Keine verdeckten Kartendaten erscheinen in RunnerView, PublicEvent, KI-Input, Error Message oder sichtgefiltertem Replay.
- Die Demo-Decks laufen ohne manuelle State-Korrektur.
- Die App ist lokal oder per Docker privat startbar.

## 33. Umsetzungsplan MVP 0.1

### 33.1 Priorisierte Reihenfolge

1. RulesBaseline, Abweichungsregister und CardImplementation-Manifest anlegen.
2. GameState mit Versionen, CardInstanceRef-Modell, Invarianten und getrennten PlayerViews implementieren.
3. TimingPointId und Resolver-Pipeline implementieren, auch wenn viele Timingpunkte zunächst leer bleiben.
4. Demo-Decks und interne Demo-Karten definieren; nur `playable_mvp` Karten freischalten.
5. Grundaktionen, Phasen, Zonen und EventLog implementieren.
6. Run-, Breach- und Access-State-Machine implementieren.
7. Agenda-Steal, Agenda-Score und Siegbedingungen implementieren.
8. UI für Spielbrett, Aktionen, Run-Panel und EventLog bauen.
9. Corp-KI mit Fallback und Tests ergänzen.
10. Replay, StateHash, Visibility-Tests und Abnahmeszenarien stabilisieren.

### 33.2 Arbeitspakete

| Paket | Ergebnis | Gate |
|---|---|---|
| A. Foundation | Monorepo, Engine-Paket, Shared Types, Test Runner, CI. | `createGame` und `validateGameState` bestehen. |
| B. Basismodell | GameState, Zonen, CardInstanceRefs, PlayerViews, Invarianten. | Visibility-Basistests bestehen. |
| C. Aktionen/Phasen | Clicks, Credits, Draw, Install, Advance, End Turn. | State-Machine-Tests bestehen. |
| D. Run-Kern | RunState, ICE, Rez, Encounter, Break, Subroutinen. | Run-Tests bestehen. |
| E. Access/Scoring | Breach, Access, Steal, Trash, Score, Sieg. | Access- und Siegtests bestehen. |
| F. Decks/Karten | Demo-Decks, CardImplementation-Manifest, Kartenresolver. | Alle Karten `playable_mvp` getestet. |
| G. UI | Spielbrett, LegalActions, Run-Panel, EventLog. | Eine manuelle Beispielpartie spielbar. |
| H. KI/Replay | Corp-KI, Fallback, Replay, StateHash. | Akzeptanzkriterien 0.1 bestehen. |

### 33.3 Minimaler Backlog

| Priorität | Eintrag |
|---|---|
| Must | Monorepo und Engine-Paket erstellen. |
| Must | RulesBaseline, DeviationRegistry und CardImplementation-Manifest als Datenstrukturen anlegen. |
| Must | GameState, CardInstanceRef, Zonen, Server und PlayerViews implementieren. |
| Must | `createGame`, `getLegalActions`, `applyAction`, `validateGameState`, `getPlayerView` implementieren. |
| Must | Grundaktionen: `gain_credit`, `draw_card`, `install_card`, `advance_card`, `end_turn`. |
| Must | RunState und Kernablauf für Runs auf HQ, R&D, Archives und Remote. |
| Must | ICE-Rez, Encounter, Breaker-Fähigkeiten und Subroutinen. |
| Must | Breach, Access, Agenda-Steal, Trash Cost und Agenda-Score. |
| Must | EventLog, StateVersion, StateHash und Replay einer Beispielpartie. |
| Must | Corp-KI mit Fallback und Timeout. |
| Must | UI mit Board, LegalActions, Run-Panel und EventLog. |
| Must | Akzeptanztests und CI. |
| Should | Debug-Panel mit TimingPoint, StateHash und Invariant-Status. |
| Should | Seed-Eingabe im Startscreen. |
| Could | Einfacher Tutorial-Hinweis pro Timingphase. |
| Could | Export des EventLogs als JSON. |

## 34. Strategische Entwicklungsstufen nach MVP 0.1

| Stufe | Ziel | Inhalt |
|---:|---|---|
| 0 | Datenbasis und Kartenmodell | Kartendaten lokal nutzbar machen, internes Kartenmodell, Implementierungsstatus. |
| 1 | Minimal spielbarer Prototyp | Spielstart, Deck laden, Starthand, Clicks, Credits, Draw, Install, Zugwechsel, einfache Server. |
| 2 | Demo-Decks vollständig spielbar | Economy, Breaker, ICE, Rez, Encounter, Access, Steal, Score. |
| 3 | Regelgenauigkeit Kernablauf | Timingpunkte, Runs, Access-Typen, Trash-Kosten, Zonen präzisieren. |
| 4 | KI für feste Decks | Erste Corp-KI, später Runner-KI, LegalAction-Zwang, Tests. |
| 5 | Human vs Human online | Einladungslink, Rollenverteilung, WebSocket, Reconnect, Synchronisation, Visibility, einfache Spielhistorie. |
| 6 | Vier feste Lern-Decks | Criminal, Shaper, Weyland, Haas-Bioroid; weiterhin kontrollierter Kartenpool. |
| 7 | Offizielle Beispieldecks | System-Gateway-/Einstiegsdecks prüfen, Manifest-Abgleich, Decklisten versionieren. |
| 8 | Freier Deckbau | Deckbuilder, Import/Export, Fraktionen, Einfluss, Mindestdeckgröße, Agenda-Dichte, erlaubte Kartenpools, Rotation/Formate, Validierung. |

Empfohlene spätere Deck-Erweiterung:

- Runner 1: Criminal / Run & Money
- Runner 2: Shaper / Setup & Breaker Suite
- Corp 1: Weyland / Build & Score
- Corp 2: Haas-Bioroid / Efficient ICE & Remote

Noch zurückstellen:

- Jinteki mit stärkerem Schadens- und Bluff-Fokus,
- NBN mit Tags und Tag-Punishment,
- komplexe Virusmechaniken,
- komplexe Hosting-Mechaniken,
- breite Kartenpools.

## 35. Versionen nach MVP 0.1

| Version | Kernziel | Enthalten |
|---|---|---|
| 0.1 | Private Netrunner AI Prototype | Human Runner vs Corp-KI, feste Demo-Decks, Engine, EventLog, Replay, Tests. |
| 0.2 | Private Human-vs-Human-Partie über Internet | Match-Link, WebSocket, PlayerViews, Reconnect, Pass/Priority, Undo mit Zustimmung, Visibility- und Multiplayer-Tests. |
| 0.3 | Beide Seiten gegen KI spielbar | Runner-KI, verbesserte Corp-KI, KI-vs-KI, Erklärmodus, Simulationstests. |
| 0.4 | Mehr Karten und stabileres Timing | Karteneffekt-System, Trigger, Paid Ability Windows, mehr Karten, Kartentests, Regressionen. |
| 1.0 | Private stabile Netrunner-Plattform | Human-vs-KI, Human-vs-Human, KI-vs-KI, Replays, Zuschaueransicht, Deckimport, größerer Kartenpool, gute Testsuite, private Hostingfähigkeit, später tablet-optimiertes UI. |

## 36. Hauptrisiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Karteneffekte werden zu früh komplex | Engine instabil, Tests unklar, Scope Creep. | Feste Demo-Decks, Manifest, `playable_mvp` nur mit Tests. |
| Timingmodell zu grob | Spätere Neuarchitektur erforderlich. | TimingPointIds und Resolver-Pipeline schon in 0.1 anlegen. |
| Effektauflösung unklar | Kosten, Targets und spätere Replacement-/Prevention-Effekte werden schwer integrierbar. | Resolver-Pipeline mit Validate → Pay Costs → Execute Instruction → Checkpoint → PendingEffects. |
| Hidden-Info-Leaks | Multiplayer später unsicher, KI unfair. | PlayerViews, Public/Private Events, Leak-Tests als Gate. |
| Multiplayer-Race-Conditions | Doppelte oder widersprüchliche Transitions. | Match-Version, idempotencyKey, transaktionale Verarbeitung. |
| KI blockiert Spiel | Partie hängt oder erzeugt illegale Actions. | Timeout, Fallback, Max-Action-Grenzen, deterministische Tests. |
| Replay bricht bei Schemaänderungen | Regressionen nicht reproduzierbar. | Versionierte Events, Snapshots, StateHash, Migrationskonzept. |
| UI überholt Engine | Schöne Oberfläche ohne regelstabile Basis. | Engine- und Test-Gates vor UI-Komfort. |
| Scope Creep | MVP wird nicht fertig. | Nicht-Ziele verbindlich halten, Kartenpool klein, alte Konzepte nicht parallel pflegen. |
| Asset-/Copyright-Unklarheit | Spätere Veröffentlichung oder Hosting riskant. | Manuelle Demo-Karten, lokale Snapshots, Attribution, keine unklaren Assets. |

## 37. Offene Entscheidungen

| Entscheidung | Empfehlung |
|---|---|
| Quelle für Kartendaten | Kurzfristig manuelle Demo-Karten oder lokaler Snapshot; später API/offizielles JSON mit Versionierung. |
| Konkrete offizielle Karten im ersten Deck | Nicht nötig für MVP 0.1; interne Demo-Karten sind sauberer. |
| Siegpunktwert in Demo-Partien | Konfigurierbar machen oder Deck auf erreichbaren Siegwert anpassen. |
| Paid Ability Windows im MVP | Struktur vollständig modellieren, aber nur demo-relevante Aktionen anbieten. |
| Datenbank Phase 1 | SQLite bevorzugen, sobald WebSocket, mehrere Matches oder Reconnect relevant werden. |
| Undo-Technik | Früh Snapshots nutzen; Event-Replay als Validierung beibehalten. |
| LLM-KI | Nicht vor stabiler LegalAction-/Visibility-Schicht einführen. |
| Kartenbilder und Assets | In MVP 0.1 nicht erforderlich; Text-/Platzhalterdarstellung reicht. |
| Asset- und Kartendaten-Prüfung | Vor Nutzung externer Kartentexte, APIs oder visueller Assets die jeweils aktuellen Quellen-, Caching-, Copyright- und Asset-Bedingungen prüfen und dokumentieren. |

## 38. Konsolidierte Kernformel

Private Netrunner-Webapp = deterministische Regel-Engine + serverseitiger Spielzustand + gefilterte Spieleransichten + Human/KI-Controller + EventLog + StateHash + umfassende Tests + schrittweise Kartenerweiterung.

MVP 0.1 ist erfolgreich, wenn eine kleine, kontrollierte Netrunner-Grundpartie stabil, reproduzierbar, hidden-info-sicher und regelgeführt funktioniert. Alles Weitere baut darauf auf.

## 39. Kontrollabgleich und bewusst verdichtete Punkte

Der Kontrollabgleich gegen die vier Ursprungskonzepte bestätigt: Der MVP-0.1-Kern ist vollständig in dieser Fassung enthalten. Nicht jedes Formulierungsdetail der Zwischenstände wird wörtlich übernommen. Übernommen oder bewusst verdichtet wurden insbesondere:

- alle verbindlichen MVP-Scope- und Nicht-Ziel-Entscheidungen,
- Zielarchitektur, Stack, Projektstruktur und Engine-als-Regelautorität,
- Datenmodell, LegalActions, PlayerActions, TimingPointIds, Resolver-Pipeline und Invarianten,
- Run-, Breach-, Access-, Score- und Siegmodell,
- Hidden-Info-Sicherheit, PlayerViews, Public/Private Events, Replay, Zufall und StateHash,
- feste Demo-Decks, Demo-Karten, CardImplementation-Manifest und Kartenpriorisierung,
- Corp-KI, spätere Runner-KI, LLM-Option und faire Schwierigkeitsgrade ohne verdeckte Informationen,
- Human-vs-Human-Vorbereitung mit WebSocket, Reconnect, Undo, Concurrency und Visibility-Gates,
- Persistenz, Migration, minimaler Betriebsstandard und Asset-/Kartendaten-Vorsicht,
- Teststrategie, Akzeptanzkriterien, Definition of Done und priorisierte Umsetzung.

Bewusst nicht als aktive Anforderungen übernommen wurden rein historische Zwischenstandformulierungen, Platzhalter wie `TO_BE_DEFINED`, doppelte Begründungstexte und Features, die für MVP 0.1 ausdrücklich zurückgestellt sind. Solche Punkte erscheinen, soweit sie langfristig relevant bleiben, als spätere Stufe, offene Entscheidung oder Nicht-Ziel.
