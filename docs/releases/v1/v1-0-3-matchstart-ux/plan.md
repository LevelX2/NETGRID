# V1.0.3 Matchstart-UX-Plan

Status: umgesetzt und lokal verifiziert
Stand: 2026-05-04

## Zweck

V1.0.3 soll den Startbildschirm logisch und sprachlich glätten und den privaten Mensch-gegen-Mensch-Start über eine explizite Startbereitschaftslobby absichern, ohne Engine-Regeln, Kartenpool, offizielle Mechaniken, Replay, StateHash oder öffentliche Plattformfunktionen zu erweitern.

Der aktuelle Startbildschirm mischt zwei Entscheidungen:

- Gegner-/Spielart: Mensch gegen Mensch, Mensch gegen KI, KI gegen KI.
- Seitenrolle: Runner, Corp oder Auslosen.

V1.0.3 trennt diese Entscheidungen sichtbar. Dadurch wird der normale private Mensch-gegen-Mensch-Start verständlicher und die bisherigen Test- und KI-Pfade bleiben erhalten.

Zusätzlich führt V1.0.3 für normale Mensch-gegen-Mensch-Spiele eine Zwischenlobby ein: Nach dem Joiner-Deck-Handshake startet das Spiel nicht sofort, sondern beide Beteiligten sehen side-sichere Startdaten, bestätigen ihre Bereitschaft, können während eines kurzen Countdowns abbrechen und erst danach wird das Match aktiv. In dieser Lobby darf ein kleiner privater Textchat für die beiden Teilnehmenden existieren.

## Einordnung zur laufenden V1.0.2

V1.0.2 ist die aktuell laufende Umsetzung für Gegner-Aktionsdarstellung, KI-Pacing, Cues, Highlights und Audio. V1.0.3 soll danach als kleines Zusatzrelease geplant werden.

Empfohlene Reihenfolge:

1. V1.0.2 abschließen und grün verifizieren.
2. V1.0.3 auf dem V1.0.2-Endstand umsetzen.
3. V1.0.3 nicht parallel in denselben UI-Bereichen wie V1.0.2 finalisieren, weil beide wahrscheinlich `apps/web/app/page.tsx` berühren.

Wenn V1.0.3 doch parallel vorbereitet wird, soll die Umsetzung auf ein separates Helper-Modul für Matchstart-Ableitung begrenzt werden und erst nach V1.0.2 in die Seite integriert werden.

## Quellen und geprüfte Codepfade

Geprüft:

- `docs/releases/v1/v1-0-deck-match-stabilization/plan.md`
- `docs/releases/v1/v1-0-1-join-deck-handshake/plan.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/requirements.md`
- `docs/releases/v1/v1-0-2-opponent-action-presentation/test-matrix.md`
- `apps/web/app/page.tsx`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/deck-setup.ts`
- `apps/server/src/multiplayer.test.ts`

Relevante bestehende Verträge:

- Der Server kennt weiterhin technische `MatchMode`s:
  - `human_vs_human`
  - `human_runner_vs_corp_ai`
  - `human_corp_vs_runner_ai`
- `ai_vs_ai` ist aktuell ein Web-/Simulationpfad über `/api/simulations/ai-vs-ai`, kein normaler Multiplayer-`MatchMode`.
- `hostSide: "random"` existiert bereits und wird serverseitig deterministisch aus dem Seed ausgelost.
- V1.0.1 hat den normalen Mensch-gegen-Mensch-Fluss bereits so gehärtet, dass der Host nur eigene Decks wählt und der Joiner eigene Decks beim Beitritt einreicht.
- V1.0.2 ergänzt voraussichtlich KI-Pacing auf Match-Orchestrierungsebene, nicht im Engine-State.

## Produktentscheidung

### Spielart

Der Startbildschirm soll als oberste Auswahl nicht mehr Runner-/Corp-Rollen mit Gegnerart vermischen.

Empfohlene sichtbare Optionen:

| Wert | Sichtbarer Text | Bedeutung |
|---|---|---|
| `human_vs_human` | `Mensch gegen Mensch · privater Link` | Zwei Menschen spielen privat per Link. |
| `human_vs_ai` | `Mensch gegen KI` | Eine menschliche Person spielt gegen eine KI-Seite. |
| `ai_vs_ai` | `KI gegen KI · Simulation` | Lokale Simulation/Testfläche. |

Die technische Server-API muss dafür nicht sofort neue MatchModes bekommen. `human_vs_ai` kann im Web nur ein UI-Modell sein und wird vor dem Start in den bestehenden technischen MatchMode übersetzt.

### Seitenzuteilung

Für `Mensch gegen Mensch`:

- Sichtbares Feld: `Seitenzuteilung`
- Optionen:
  - `Auslosen`
  - `Ich spiele Runner`
  - `Ich spiele Corp`
- Empfohlener Default: `Auslosen`
- Die Auslosung bleibt serverautoritativ und deterministisch über `hostSide: "random"` und Seed.
- Wenn der Host Runner oder Corp festlegt, ist das eine zulässige private Sonderregel, nicht die normale Empfehlung.

Für `Mensch gegen KI`:

- Sichtbares Feld: `Deine Seite`
- Optionen:
  - `Auslosen`
  - `Runner`
  - `Corp`
- Empfohlener Default: `Auslosen`, wenn V1.0.3 den Startscreen als normalen Spielstart behandelt.
- Alternative für Lern-/Testkomfort: `Runner` als Default, aber `Auslosen` trotzdem anbieten.
- `Auslosen` bedeutet auch hier nur Seitenzuteilung: Die menschliche Person spielt entweder Runner gegen Corp-KI oder Corp gegen Runner-KI. Turn-Reihenfolge und Engine-Regeln bleiben davon unberührt.

Für `KI gegen KI`:

- Keine menschliche Seitenwahl.
- KI-Schwierigkeit und KI-Deckpolitik bleiben sichtbar.

### Spielziel

`Spielziel` bleibt eine eigene, unabhängige Auswahl:

- `Regelmatch · 7 Agendapunkte`
- `Einzelspiel · Deckziel`
- `Private Matchserie · Seitenwechsel`

Wichtig: `Einzelspiel · Deckziel` darf bei normalem Mensch-gegen-Mensch mit Join-Deck-Handshake nicht zu früh aus einem Platzhalter-Corp-Deck abgeleitet werden. Der finale Zielwert muss aus dem tatsächlich verwendeten Corp-Deck bestimmt werden, sobald beide Deckpaare bekannt sind.

Projektintern bedeutet `Deckziel`: Der Zielwert wird aus der validierten Corp-Deck-/Snapshot-Information abgeleitet, sofern kein expliziter Testwert gesetzt ist. `Regelmatch` bleibt die klare 7-Agenda-Punkte-Variante.

### Startbereitschaftslobby

V1.0.3 soll den normalen privaten Mensch-gegen-Mensch-Start nicht direkt nach dem Joiner-Deck-Handshake aktivieren.

Zielbild:

1. Host erstellt die Lobby und reicht eigene Runner-/Corp-Decks ein.
2. Joiner öffnet den Link, sieht side-sichere Spieldaten, wählt eigene Runner-/Corp-Decks und reicht sie ein.
3. Server validiert die Joiner-Decks und finalisiert daraus die startrelevanten, öffentlichen Matchdaten:
   - tatsächliche Seitenzuordnung,
   - Spielziel,
   - finaler Agenda-Zielwert,
   - Namen/Teilnehmerstatus,
   - Deck-Bereitschaft je Teilnehmer,
   - Verbindungsstatus.
4. Beide sehen eine Startbereitschaftslobby.
5. Jede Person setzt `Bereit`.
6. Wenn beide bereit sind, startet ein kurzer serverautoritativ angekündigter Countdown, Default 3 Sekunden.
7. Während des Countdowns kann jede Person abbrechen; dann kehrt die Lobby in den Bereitschaftszustand zurück.
8. Erst nach erfolgreichem Countdown erzeugt der Server den `GameState`, setzt das Match auf `active` und sendet die normalen side-gefilterten Spielpayloads.

Die Lobby darf keine gegnerischen Decklisten zeigen. Empfohlene sichtbare Anzeige:

- eigener Name und gegnerischer Anzeigename,
- eigene Seite und gegnerische Seite,
- `Runner-Deck geprüft` / `Corp-Deck geprüft` als Status,
- finaler Agenda-Zielwert,
- Spielziel,
- Verbindung: `online`, `instabil` oder `offline`,
- Bereitschaftsstatus,
- Countdown.
- private Lobbychat-Nachrichten mit Anzeigename und Uhrzeit.

Nicht anzeigen:

- gegnerische Deckliste,
- verdeckte Kartentitel,
- private Snapshot-Inhalte,
- Session-/Reconnect-/Join-Tokens,
- rohe IP-/Netzwerkdaten.

Ob gegnerische Decknamen oder Deckhashes im Lobbybildschirm sichtbar sein sollen, ist eine Produktentscheidung. Empfehlung für V1.0.3: Im Lobbybildschirm nicht anzeigen; nur Startfähigkeit und validierten Status anzeigen.

Countdown-Auswahl:

- Der Host darf beim Erstellen für die Startbereitschaftslobby einen Countdown wählen.
- Erlaubte Werte: 3, 5 oder 10 Sekunden.
- Default: 3 Sekunden.
- Der Wert ist Match-Orchestrierung und nicht Engine-State, Replay oder StateHash.

### Lobbychat

V1.0.3 darf einen kleinen privaten Lobbychat für Mensch-gegen-Mensch-Lobbys einführen.

Scope:

- nur für die private Matchlobby,
- nur für die zwei teilnehmenden Sessions,
- Textnachrichten mit Anzeigename, Zeitstempel und kurzer Nachricht,
- sichtbar für Host und Joiner,
- Reconnect zeigt die letzten Lobbychat-Nachrichten wieder an.

Nicht-Ziele:

- kein globaler Chat,
- kein öffentlicher Chat,
- kein Chat während öffentlicher Matchlisten,
- keine Datei-, Bild- oder Link-Vorschau,
- keine Moderations-/Accountfunktionen,
- keine KI- oder Engine-Nutzung der Chattexte.

Sicherheits- und Sichtbarkeitsregeln:

- Nachrichten werden als Text behandelt und im Web escaped gerendert.
- Empfohlenes Limit: maximal 300 Zeichen pro Nachricht.
- Leere Nachrichten werden verworfen.
- Chattexte gehen nicht in Engine, Replay, RandomDrawRecords, StateHash, AI-Inputs oder PublicGameEvents.
- Chatpayloads enthalten keine Tokens, Session-IDs, privaten Decklisten oder verdeckten Kartendaten.
- Der Anzeigename wird aus der Session übernommen und ebenfalls escaped gerendert.

### Anzeigename merken

Die Web-UI soll den zuletzt verwendeten menschlichen Anzeigenamen lokal im Browser merken.

Empfehlung:

- localStorage-Key z. B. `netgrid.displayName`.
- Beim Ändern oder erfolgreichen Matchstart/Join speichern.
- Beim nächsten Öffnen als Vorbelegung nutzen.
- Ohne gespeicherten Namen weiter `Teilnehmer A` bzw. `Teilnehmer B` verwenden.
- Keine Accounts, kein Cloud-Sync, keine Server-weite Namensregistrierung.
- Name bleibt ein Anzeigename pro lokaler Browserumgebung.

### Sprache

V1.0.3 sollte die sichtbaren Startbereich-Texte in deutsches UI-Deutsch überführen:

- `Human vs Human` -> `Mensch gegen Mensch · privater Link`
- `Runner vs Corp-KI` / `Corp vs Runner-KI` -> entfällt als oberste Auswahl
- `KI vs KI` -> `KI gegen KI · Simulation`
- `Random` -> `Auslosen`
- `Seite` -> `Seitenzuteilung` oder `Deine Seite`
- `Host` -> optional `Match erstellen`
- `Join` -> optional `Beitreten`
- Default-Name `Runner` -> `Teilnehmer A`
- Join-Default-Name `Runner` -> `Teilnehmer B`

Runner und Corp bleiben als Rollennamen erhalten, weil sie im NETGRID-Kontext Fachrollen sind.

## Empfohlenes UI-Modell

V1.0.3 sollte im Web ein kleines Startmodell einführen, statt den bestehenden technischen `GameMode` direkt an die UI zu binden.

Vorgeschlagene Typen:

```ts
type PlayMode = "human_vs_human" | "human_vs_ai" | "ai_vs_ai";
type HumanSideSelection = "runner" | "corp" | "random";
type HumanAiSideSelection = "runner" | "corp" | "random";
```

Daraus wird vor Matchstart abgeleitet:

```ts
type DerivedMatchStart = {
  technicalMode?: "human_vs_human" | "human_runner_vs_corp_ai" | "human_corp_vs_runner_ai";
  requestedPlayMode: "human_vs_human" | "human_vs_ai" | "ai_vs_ai";
  hostSide: "runner" | "corp" | "random";
  hasAiOpponent: boolean;
  isSimulation: boolean;
};
```

Abbildungsregeln:

| UI-Auswahl | technische Ableitung |
|---|---|
| Mensch gegen Mensch + Auslosen | `mode: "human_vs_human"`, `hostSide: "random"` |
| Mensch gegen Mensch + Runner | `mode: "human_vs_human"`, `hostSide: "runner"` |
| Mensch gegen Mensch + Corp | `mode: "human_vs_human"`, `hostSide: "corp"` |
| Mensch gegen KI + Runner | `mode: "human_runner_vs_corp_ai"`, `hostSide: "runner"` |
| Mensch gegen KI + Corp | `mode: "human_corp_vs_runner_ai"`, `hostSide: "corp"` |
| Mensch gegen KI + Auslosen | serverseitig aus Seed ableiten: danach `human_runner_vs_corp_ai` oder `human_corp_vs_runner_ai` |
| KI gegen KI | `/api/simulations/ai-vs-ai` |

Diese Ableitung sollte als pure Funktion ausgelagert werden, z. B. nach `apps/web/app/match-start.ts`, damit sie testbar ist und `page.tsx` weniger Sonderlogik tragen muss.

Wichtig: Bei `Mensch gegen KI + Auslosen` darf der Browser die finale Seite nicht selbst bestimmen. Der Client sendet einen serverseitig auswertbaren Wunsch, z. B. `playMode: "human_vs_ai"` und `humanSide: "random"`, und der Server speichert danach weiterhin einen der bestehenden technischen AI-MatchModes.

## Technische Auswirkungen

### Web Startscreen

Betroffene Bereiche in `apps/web/app/page.tsx`:

- State für `gameMode` ersetzen oder ergänzen:
  - von technischem `GameMode`
  - zu UI-`PlayMode` plus Seitenwahl.
- `hasAiOpponent` aus der abgeleiteten technischen Auswahl berechnen.
- `createMatch` muss `mode` und `hostSide` aus der Ableitungsfunktion verwenden.
- `matchDeckPayload`, `currentSideDeckPayload` und `currentCorpSnapshotForSetup` müssen nicht mehr direkt an sichtbaren UI-Modus gekoppelt sein, sondern an die abgeleitete technische Auswahl.
- Sichtbare Controls neu ordnen:
  1. Spielart
  2. Seitenzuteilung/Deine Seite
  3. Spielziel
  4. Name
  5. KI-Optionen
  6. Countdown, nur für Mensch-gegen-Mensch-Lobby
  7. Seed
  8. Deckslots
- Human-vs-Human Default:
  - nur Teilnehmer-A-Deckslots
  - Hinweis auf Teilnehmer-B-Deckwahl beim Beitritt
  - Testkonstellation bleibt getrennt.
- Join-Ansicht bleibt funktional gleich, aber Begriffe können deutscher werden.
- Host/Join-Tabs sollen in `Match erstellen` und `Beitreten` umbenannt werden.
- Nach Lobby-Erstellung und nach Mensch-gegen-KI-Auslosung zeigt die UI die tatsächliche eigene Seite an, z. B. `Du startest als Corp`.
- Anzeigename wird aus localStorage vorbefüllt und bei Nutzung aktualisiert.

### Server-API

Empfehlung: Kein neuer gespeicherter Server-`MatchMode` in V1.0.3. Für `Mensch gegen KI + Auslosen` braucht die Create-API aber einen vorgelagerten Request-Wert, der serverseitig in einen bestehenden technischen MatchMode übersetzt wird.

Begründung:

- Bestehender gespeicherter Serververtrag bildet die aktiven Spielarten bereits ab.
- V1.0.2-KI-Pacing hängt bereits an den bestehenden AI-MatchModes.
- Ein neuer persistierter Servermodus `human_vs_ai` würde `controllersForMode`, `aiPlayerForMode`, `nextModeForSideSwap`, Tests, gespeicherte Matches und Pacing-Payloads verbreitern.
- Für den Startscreen reicht eine Request-Ableitung vor dem Speichern.

Empfohlene API-Erweiterung:

```ts
type CreateMatchRequestMode =
  | { mode: "human_vs_human"; hostSide: "runner" | "corp" | "random" }
  | { playMode: "human_vs_ai"; humanSide: "runner" | "corp" | "random" }
  | { simulation: "ai_vs_ai" };
```

Serverseitige Ableitung:

- `playMode: "human_vs_ai", humanSide: "runner"` -> gespeicherter `mode: "human_runner_vs_corp_ai"`.
- `playMode: "human_vs_ai", humanSide: "corp"` -> gespeicherter `mode: "human_corp_vs_runner_ai"`.
- `playMode: "human_vs_ai", humanSide: "random"` -> serverseitig deterministisch aus Seed Runner oder Corp bestimmen, dann gespeicherten technischen AI-MatchMode setzen.
- Response enthält die tatsächlich zugeloste menschliche Seite, z. B. über bestehendes `hostSide` und sichtbare UI-Notice.

Serverseitig dennoch prüfen/anpassen:

- `hostSide: "random"` für normale Mensch-gegen-Mensch-Lobbys bleibt erlaubt und soll als Default-Pfad getestet werden.
- `humanSide: "random"` für Mensch-gegen-KI wird deterministisch serverseitig abgeleitet und getestet.
- `createMatch` soll bei Mensch-gegen-Mensch mit Pending-Deck-Handshake weiterhin keinen `GameState` erzeugen, bis der endgültige Start autorisiert ist.
- `startNextSeriesGame` bleibt unverändert: Es wechselt die Seite des anfragenden Spielers und nutzt persönliche Deckpaare.
- `nextModeForSideSwap` bleibt unverändert, solange es keinen neuen Server-`MatchMode` gibt.

Für die Startbereitschaftslobby braucht der Server aber eine erweiterte Match-Lifecycle-Schicht. Empfohlen:

- Neuer Matchstatus oder Unterstatus:
  - `waiting_for_joiner_decks`: Host-Lobby existiert, Joiner-Decks fehlen.
  - `ready_check`: beide Deckpaare sind validiert, Spiel ist noch nicht aktiv.
  - `countdown`: beide sind bereit, Startdeadline läuft.
  - `active`: `GameState` existiert und normales Spiel läuft.
- Alternativ kann `ready_check`/`countdown` als eigenes Lobbyobjekt neben bestehendem `MatchStatus` modelliert werden. Ein klarer Status ist für Tests und UI aber einfacher.
- Neue serverseitige Datenstruktur, z. B. `MatchStartLobbyState`:

```ts
type MatchStartLobbyState = {
  hostReady: boolean;
  joinerReady: boolean;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  agendaPointsToWin: number;
  matchFormat: MatchFormat;
  sideAssignment: { runnerPlayer: "player_a" | "player_b"; corpPlayer: "player_a" | "player_b" };
  participants: {
    player_a: LobbyParticipantStatus;
    player_b: LobbyParticipantStatus;
  };
};

type LobbyParticipantStatus = {
  displayName: string;
  side?: "runner" | "corp";
  runnerDeckReady: boolean;
  corpDeckReady: boolean;
  connected: boolean;
  connectionQuality: "online" | "unstable" | "offline";
  ready: boolean;
};
```

Dieses Lobbyobjekt ist Match-Orchestrierung, nicht Engine-State. Es darf nicht in Replay, RandomDrawRecords oder StateHash eingehen.

Neue oder erweiterte API-/WS-Aktionen:

- `set_ready`: setzt eigene Bereitschaft auf `true` oder `false`.
- `cancel_countdown`: setzt eigene Bereitschaft oder den Countdown zurück.
- `lobby_update`: side-sicherer Broadcast der Startbereitschaftslobby.
- `start_countdown`: serverseitiger Countdown-Broadcast mit Deadline.
- `match_activated`: Übergang zu normalen `state_update`-/`legal_actions`-Payloads.

Der Server muss der einzige Startautor sein. Clients dürfen Countdown anzeigen, aber nicht selbst das Match aktivieren. Wenn ein Timer verpasst wird, kann die Aktivierung beim nächsten Heartbeat, WS-Kommando oder Server-Timer nachgeholt werden, solange die serverseitige Deadline und beide Ready-Flags gültig sind.

### Deckzuweisung

Das bestehende V1.0.1-Modell bleibt richtig:

- Teilnehmer A ist Host.
- Teilnehmer B ist Joiner oder KI.
- Jeder Teilnehmer besitzt ein Runner- und ein Corp-Deck.
- Die aktuelle Seite bestimmt nur, welches persönliche Deck in diesem Spiel verwendet wird.

Auswirkung der neuen Default-Auslosung:

- Bei normalem Mensch-gegen-Mensch müssen beide Host-Decks weiterhin Pflicht sein, weil der Host bei `Auslosen` Runner oder Corp werden kann.
- Der Joiner muss weiterhin beide Decks einreichen.
- Testkonstellation mit beiden Teilnehmern muss auch bei `Auslosen` funktionieren, weil der Server die finale Seite bestimmt und daraus `runnerPlayer`/`corpPlayer` ableitet.

Auswirkung der Startbereitschaftslobby:

- Nach Joiner-Deck-Einreichung müssen die privaten Snapshots beider Teilnehmer gespeichert bleiben, aber es entsteht noch kein aktiver `GameState`.
- `deckSetupForParticipants` kann schon zur Berechnung von Seitenzuordnung, Agenda-Zielwert und öffentlicher Lobby-Zusammenfassung genutzt werden.
- Die tatsächlichen Engine-Decks sollen erst beim Aktivieren oder als private vorbereitete Struktur gehalten werden. Empfehlung: `GameState` erst beim Aktivieren erzeugen, damit Abbruch/Countdown keine angefangenen Replays oder StateHashes erzeugt.

### Spielziel und Agenda-Zielwert

Hier besteht der wichtigste fachliche Seiteneffekt.

Aktuelle Lage:

- Die Web-UI berechnet `effectiveAgendaTarget` vor dem Matchstart.
- Bei `single_game` wird dafür ein vermutetes Corp-Deck herangezogen.
- Im normalen Mensch-gegen-Mensch-Handshake kennt der Host das spätere Corp-Deck des Joiners aber noch nicht.
- Dadurch kann `Einzelspiel · Deckziel` bei Pending-Lobbys zu früh auf einen falschen Zielwert festgelegt werden.

V1.0.3 sollte das korrigieren:

- Die Produkt-UI soll für `single_game` keinen selbst abgeleiteten `agendaPointsToWin` mitschicken.
- Der Server soll `agendaPointsToWin` für `single_game` aus dem tatsächlich auf Corp-Seite verwendeten Deck ableiten, sobald das DeckSetup vollständig ist.
- Bei Pending-Mensch-gegen-Mensch-Lobbys soll der Wert beim Joiner-Deck-Handshake finalisiert werden.
- Explizite Testwerte in Server-Tests dürfen weiterhin möglich sein, damit kurze Ergebnis- und Serien-Tests nicht unnötig aufgebläht werden.
- Die Startbereitschaftslobby soll den finalen Zielwert anzeigen, nachdem beide Deckpaare validiert wurden.

Empfohlene technische Absicherung:

- `MatchSettings` optional um eine interne Quelle ergänzen, z. B. `agendaPointsSource`.
- Mögliche Quellen:
  - `explicit`
  - `rules_match`
  - `deck_target_pending`
  - `deck_target`
- Bei `rules_match` und `two_game_side_swap`: 7, außer Tests setzen explizit etwas anderes.
- Bei `single_game` ohne expliziten Wert:
  - direkter Start mit vollständigen Decks: `defaultAgendaPointsToWin(deckSetup)`
  - Pending-Lobby: zunächst pending markieren, bei `activatePendingDeckHandshake` aus finalem DeckSetup ableiten.

Diese Änderung ist serverseitig klein, aber fachlich wichtig, weil sie verhindert, dass die neue Startlogik eine alte Annahme sichtbarer macht.

### Verbindung und Bereitschaft

V1.0.3 soll keine echte Netzwerkdiagnostik oder WebRTC-artige Messung einführen. Für die private Lobby reicht ein side-sicherer, grober Status:

- `online`: WebSocket verbunden oder jüngster Ping/Heartbeat frisch.
- `instabil`: verbunden, aber letzter Heartbeat/Pong über Schwellwert.
- `offline`: keine aktive Verbindung oder deutlich veralteter `lastSeenAt`.

Diese Werte sind reine UI-/Server-Orchestrierung. Sie dürfen keine IP-Adressen, User-Agent-Details, Tokens oder lokalen Netzwerkdaten offenlegen.

Ready-Regeln:

- Bereitschaft kann erst gesetzt werden, wenn beide Deckpaare validiert und die Lobbydaten finalisiert sind.
- Jede Änderung an Decks oder relevanten Matchsettings setzt die betroffene Ready-Flag zurück.
- Wenn eine Person während des Countdowns abbricht oder die Verbindung verliert, wird der Countdown abgebrochen.
- Danach bleibt die Startbereitschaftslobby bestehen.
- Die getrennte Person kann per bestehendem Reconnect-Token wieder einsteigen.
- Wenn der Browser die Session noch kennt, soll der Join-Link oder die Seite automatisch in den Lobby-Reconnect statt in einen neuen Join führen.
- Wenn die Session verloren ist und der Join-Token bereits verbraucht wurde, ist das ein bekannter privater MVP-Grenzfall; bevorzugt wird robuste Session-Persistenz direkt nach erfolgreichem Join.

### KI-Deckpolitik

Bestehendes Verhalten bleibt:

- `selected`: Host wählt KI-Runner-/Corp-Decks explizit.
- `fixed`: Server nutzt feste Standard-KI-Decks.
- `seeded_random`: Server nutzt den versionierten KI-Deckpool deterministisch.

Auswirkung der neuen Spielart:

- Bei `Mensch gegen KI` sollen KI-Decks nur bei `selected` als Deckslots erscheinen.
- Bei `fixed` und `seeded_random` sollen keine editierbaren KI-Deckslots erscheinen.
- Bei `KI gegen KI` bleibt Simulation/Testfläche; KI-Deckpolitik wirkt auf beide Seiten wie bisher.

Keine Änderung an `data/ai/ai-deck-pool-1.0.1.json` erforderlich.

### V1.0.2-KI-Pacing

V1.0.3 darf V1.0.2 nicht umgehen.

Erwartung nach V1.0.2:

- Mensch gegen KI startet standardmäßig mit `AiPacingMode: "paced"`.
- KI gegen KI/Testpfade behalten `fast`.
- Human-vs-Human hat keine KI-Pacing-Logik.

V1.0.3 muss die technische Ableitung so liefern, dass V1.0.2-Pacing weiterhin korrekt greift:

- `Mensch gegen KI + Runner` erzeugt weiter `human_runner_vs_corp_ai`.
- `Mensch gegen KI + Corp` erzeugt weiter `human_corp_vs_runner_ai`.
- `Mensch gegen KI + Auslosen` wird serverseitig zuerst auf Runner oder Corp abgebildet und erzeugt danach einen dieser beiden technischen Modi.
- `Mensch gegen Mensch` erzeugt weiter `human_vs_human`.
- `KI gegen KI` nutzt weiter Simulation und nicht versehentlich einen Human-vs-KI-MatchMode.

### Persistenz und Reconnect

Keine Änderung an bestehenden Session- oder Reconnect-Tokens geplant.

Zu beachten:

- UI-Default-Name sollte neutral werden, damit `hostSide: "random"` nicht mit DisplayName `Runner` gespeichert wird.
- Bestehende gespeicherte Sessions bleiben unberührt.
- Join-URLs behalten `matchId` und `joinToken`; die Join-Ansicht kann weiterhin automatisch geöffnet werden.
- Bei Join-URL-Autofill sollte der Default-Name `Teilnehmer B` statt `Runner` sein.

### Sichtbarkeit und Hidden-Info

V1.0.3 darf keine neuen Decklisten- oder Hidden-Info-Leaks erzeugen.

Prüfpunkte:

- Pending Lobby enthält keine privaten Decklisten.
- Startbereitschaftslobby enthält keine privaten Decklisten.
- JoinInfo nennt nur Matchstatus und verfügbare Seite.
- Host erfährt nicht die Joiner-Deckliste.
- Joiner erfährt nicht die Host-Deckliste.
- Gegnerische Decknamen und Deckhashes sind im Lobbybildschirm standardmäßig nicht sichtbar.
- Startscreen-Hinweise und Fehlermeldungen nennen keine verdeckten gegnerischen Karten.
- Bei KI-`seeded_random` werden keine privaten lokalen O:NR-Snapshots zufällig in die KI-Auswahl aufgenommen.

## Nicht-Ziele

V1.0.3 baut nicht:

- neue Engine-Regeln,
- neue Karten oder Mechaniken,
- neue KI-Heuristik,
- neue öffentliche Plattformfunktionen,
- Matchmaking, Accounts, Rankings oder Turnierlogik,
- globalen oder öffentlichen Chat außerhalb der privaten Startlobby,
- detaillierte Netzwerkdiagnostik,
- neue offizielle Assets,
- zufällige öffentliche Deckauswahl,
- vollständige Umbenennung aller historischen Dokumente.

Historische Dokumente wie V1.0 oder V1.0.1 müssen nicht rückwirkend umbenannt werden; V1.0.3 dokumentiert die neue UI-Entscheidung.

## Umsetzungsplan

### Schritt 1: Matchstart-Ableitung isolieren

Neu:

- `apps/web/app/match-start.ts`
- optional `apps/web/app/match-start.test.ts`

Inhalt:

- UI-Typen für `PlayMode`, `HumanSideSelection`, `HumanAiSideSelection`.
- Pure Ableitungsfunktion von UI-Auswahl zu technischem Matchstart.
- Label-Helfer für sichtbare Texte.

Akzeptanz:

- Die Ableitung ist ohne React testbar.
- Kein Server- oder Engine-Import im Helper.

### Schritt 2: Startscreen-State umstellen

In `apps/web/app/page.tsx`:

- UI-State einführen:
  - `playMode`
  - `humanSideSelection`
  - `humanAiSide`
- technischen `gameMode` nur noch abgeleitet verwenden.
- `hostSide` für Mensch-gegen-Mensch default auf `random` setzen.
- `humanAiSideSelection` unterstützt `random`.
- Default-DisplayName auf `Teilnehmer A` setzen.
- Join-URL-Autofill setzt `Teilnehmer B`.
- Countdown-Auswahl 3/5/10 Sekunden für Mensch-gegen-Mensch-Lobbys ergänzen.
- localStorage-Vorbelegung für Anzeigenamen ergänzen.

Akzeptanz:

- Sichtbarer Startbereich zeigt die neue Reihenfolge und deutsche Labels.
- Bestehende Startaktionen rufen weiterhin die bisherigen Endpunkte auf.

### Schritt 3: Deck- und Spielziel-Ableitung korrigieren

In Web:

- `effectiveAgendaTarget` nicht mehr als Client-Quelle für `single_game` verwenden.
- Für `rules_match` und `two_game_side_swap` darf die UI weiterhin 7 senden oder der Server darf es ableiten; bevorzugt ist serverseitige Ableitung.
- `currentSideDeckPayload` nur noch für tatsächlich benötigte aktuelle Side-Snapshots nutzen; Teilnehmerdeckpaare bleiben Hauptquelle.

In Server:

- `single_game`-Zielwert aus finalem DeckSetup ableiten, wenn kein expliziter Testwert gesetzt ist.
- Pending-Human-vs-Human-Lobby bei Joiner-Deck-Handshake finalisieren.

Akzeptanz:

- Mensch-gegen-Mensch + Einzelspiel + Joiner-Corp-Deck verwendet das tatsächliche Joiner-Corp-Deck für `agendaPointsToWin`.
- Explizite kurze Testwerte bleiben möglich.

### Schritt 4: Startbereitschaftslobby einführen

In Server:

- Joiner-Deck-Handshake erzeugt nach erfolgreicher Validierung nicht sofort ein aktives Spiel.
- Stattdessen wird ein side-sicherer Lobbyzustand gespeichert.
- Der finale Agenda-Zielwert wird im Lobbyzustand gespeichert.
- `set_ready` und `cancel_countdown` werden side-authentifiziert.
- Bei beiden Ready-Flags startet der Server einen kurzen Countdown.
- Nach erfolgreichem Countdown wird `GameState` erzeugt und das Match wird `active`.
- Abbruch, relevante Änderung oder Verbindungsverlust während Countdown setzen den Countdown zurück.
- Lobby-Reconnect liefert den aktuellen Lobbyzustand statt eines normalen Spiel-`PlayerView`, solange das Match noch nicht aktiv ist.

In Web:

- Host sieht nach Joiner-Deck-Einreichung eine Startbereitschaftslobby.
- Joiner sieht dieselbe Lobby aus eigener Perspektive.
- Beide sehen Namen, Seiten, Spielziel, Agenda-Zielwert, Deck-Bereitschaft, Verbindungsstatus, Ready-Status und Countdown.
- Beide können `Bereit` setzen und während Countdown abbrechen.
- Bei Reconnect in die Lobby wird der aktuelle Bereitschafts- und Countdownzustand wieder angezeigt.
- Nach Aktivierung wechselt die UI in die bestehende Spielansicht.

Akzeptanz:

- Kein `GameState` vor finaler Aktivierung.
- Startbereitschaftslobby leakt keine Decklisten, Tokens oder verdeckten Kartendaten.
- Beide Ready-Flags sind erforderlich.
- Countdown kann abgebrochen werden.

### Schritt 5: Lobbychat und Anzeigename

In Server:

- Lobbychat-Nachrichten side-authentifiziert annehmen.
- Nachrichtenlänge begrenzen.
- Nachrichten mit Session-Anzeigename, Zeitstempel und fortlaufender ID speichern.
- Chat nur in Lobby-/Reconnect-Payloads für die beiden Teilnehmenden ausgeben.

In Web:

- Kleines Chatfenster in Startbereitschaftslobby anzeigen.
- Nachrichten als Text rendern, nicht als HTML.
- Anzeigename lokal merken und beim nächsten Start/Join vorbefüllen.

Akzeptanz:

- Host und Joiner sehen Chatnachrichten mit Anzeigename.
- Reconnect zeigt die letzten Chatnachrichten.
- Chattexte gehen nicht in Engine, Replay, StateHash, AI-Inputs oder PublicGameEvents.
- Anzeigename wird lokal wiederverwendet.

### Schritt 6: KI-Optionen und Testkonstellation erhalten

- Mensch gegen KI zeigt `Deine Seite`.
- KI-Schwierigkeit zeigt nur die tatsächlich gegnerische KI-Seite.
- KI-Deckslots erscheinen nur bei `selected`.
- Testkonstellation bleibt nur bei Mensch gegen Mensch sichtbar.
- KI gegen KI bleibt Simulation.

Akzeptanz:

- Alle bisherigen KI-Deckpolitik-Pfade bleiben erreichbar.
- V1.0.2-Pacing-Defaults bleiben erreichbar.

### Schritt 7: Tests und Smokes

Unit/Web:

- UI-Ableitung:
  - Mensch gegen Mensch + Auslosen -> `human_vs_human`, `hostSide: "random"`
  - Mensch gegen Mensch + Runner -> `human_vs_human`, `hostSide: "runner"`
  - Mensch gegen Mensch + Corp -> `human_vs_human`, `hostSide: "corp"`
  - Mensch gegen KI + Runner -> `human_runner_vs_corp_ai`
  - Mensch gegen KI + Corp -> `human_corp_vs_runner_ai`
  - Mensch gegen KI + Auslosen -> Request-Ableitung für serverseitige Auslosung
  - KI gegen KI -> Simulation

Server:

- `hostSide: "random"` erzeugt deterministische Seitenzuteilung und pending Lobby.
- `humanSide: "random"` für Mensch-gegen-KI erzeugt deterministisch Runner- oder Corp-Human und den passenden technischen AI-MatchMode.
- Pending Mensch-gegen-Mensch erzeugt weiterhin keinen `GameState` vor Joiner-Decks.
- Joiner-Deck-Handshake führt zu `ready_check`/Startbereitschaftslobby, nicht direkt zu `active`.
- Beide `set_ready`-Aufrufe starten Countdown.
- `cancel_countdown` setzt Countdown und Bereitschaft sicher zurück.
- Countdown-Dauer 3/5/10 wird akzeptiert und andere Werte werden abgelehnt oder auf Default normalisiert.
- Verbindungsverlust während Countdown bricht Countdown ab; Reconnect führt zurück in die Lobby.
- Countdown-Aktivierung erzeugt genau einen `GameState` und normale side-gefilterte Payloads.
- Lobbychat speichert und broadcastet nur textuelle Nachrichten für die beiden Sessions.
- `single_game` mit Pending-Joiner-Corp-Deck finalisiert `agendaPointsToWin` aus dem tatsächlichen Corp-Deck.
- Testkonstellation mit `hostSide: "random"` und beiden Teilnehmerdeckpaaren startet mit korrekter Assignment.
- Serien-Folgespiel bleibt bei persönlichem Seitenwechsel korrekt.
- KI-Deckpolitik `selected`, `fixed`, `seeded_random` bleibt grün.
- V1.0.2-Pacing-Tests bleiben grün.

Visibility:

- Keine `cardInstances`, privaten Decklisten, Tokens oder verdeckten gegnerischen Kartentitel in Start-, Lobby-, Join-, Reconnect-, SidePayload- oder Fehlerdaten.
- Chatpayloads enthalten keine Tokens, Session-IDs, privaten Decklisten oder verdeckten Kartendaten.

Browser-Smokes:

- Neuer Default: Mensch gegen Mensch + Auslosen erstellt eine Lobby; Joiner wählt Decks; beide sehen Startbereitschaft; beide bestätigen; Countdown startet; Match startet.
- Countdown abbrechen hält das Match in der Lobby.
- Verbindung während Countdown trennen und per Reconnect in die Lobby zurückkehren.
- Lobbychat: Host schreibt, Joiner sieht; Joiner schreibt, Host sieht.
- Anzeigename wird beim nächsten Start/Join wieder vorbefüllt.
- Mensch gegen KI + Runner startet gegen Corp-KI.
- Mensch gegen KI + Corp startet gegen Runner-KI.
- Mensch gegen KI + Auslosen zeigt die tatsächlich zugeloste Seite und startet gegen die passende KI.
- KI gegen KI startet Simulation.
- Einzelspiel + Deckziel mit Joiner-Corp-Deck zeigt/finalisiert den richtigen Zielwert.
- V1.0.2 Human-vs-KI-Pacing bleibt nach Startscreen-Änderung beobachtbar.

Pflichtchecks:

- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Risiken und Gegenmaßnahmen

| Risiko | Einschätzung | Gegenmaßnahme |
|---|---|---|
| V1.0.2 und V1.0.3 ändern beide `page.tsx`. | Mittel | V1.0.3 nach V1.0.2 umsetzen; Startableitung in Helper auslagern. |
| Server bekommt unnötig neuen persistierten `human_vs_ai`-Mode. | Mittel | Nur Request-Ableitung verwenden; gespeicherter MatchMode bleibt einer der bestehenden technischen AI-Modi. |
| Mensch-gegen-KI-Auslosung wird clientseitig bestimmt. | Mittel | Serverseitigen Request-Wert `humanSide: "random"` einführen und danach bestehenden technischen AI-MatchMode speichern. |
| `single_game`-Zielwert wird bei Pending-Lobby zu früh festgelegt. | Hoch | Server finalisiert Zielwert erst nach vollständigem DeckSetup. |
| Joiner-Deck-Handshake startet plötzlich nicht mehr sofort. | Mittel | Neue Startbereitschaftslobby klar anzeigen; beide Ready-Flags und Countdown testen. |
| Countdown erzeugt Timing-Flakes in Tests. | Mittel | Countdown über serverseitige Deadline und testbare Clock modellieren; Tests mit kontrollierter Zeit. |
| GameState wird vor Start erzeugt und dann abgebrochen. | Mittel | `GameState` erst bei Aktivierung erzeugen oder vorbereitete States klar als nicht replayrelevant behandeln; bevorzugt erst bei Aktivierung. |
| Lobby zeigt zu viel gegnerische Deckinformation. | Mittel | Im Lobbybildschirm nur Ready-/Validierungsstatus anzeigen, keine gegnerischen Decknamen oder Deckhashes. |
| Lobbychat wird zur Plattformfunktion. | Mittel | Nur private Zwei-Personen-Lobby, kurze Textnachrichten, kein globaler Chat, keine Attachments, kein aktiver Matchchat in V1.0.3. |
| Chattexte erzeugen XSS oder Log-Leaks. | Mittel | Text escaped rendern, Längenlimit, keine HTML-/Markdown-Auswertung, keine Tokens oder privaten Daten in Chatpayloads. |
| Verbindungsqualität wird zu detailliert oder privat. | Niedrig | Nur grobe Kategorien aus Heartbeat/lastSeen, keine IPs oder Rohdaten. |
| Gespeicherter Anzeigename wirkt wie Accountsystem. | Niedrig | Nur localStorage-Vorbelegung im Browser, keine Registrierung, kein Cloud-Sync. |
| Default-Name `Runner` passt nicht zu ausgeloster Seite. | Niedrig, aber sichtbar | Default auf `Teilnehmer A`/`Teilnehmer B` ändern. |
| KI-Pacing aus V1.0.2 greift nicht mehr. | Mittel | Technische AI-MatchModes unverändert ableiten. |
| Testkonstellation verliert reproduzierbare Side-Setups. | Niedrig | `hostSide` Runner/Corp/Auslosen im Testmodus weiter erlauben. |
| Hidden-Info-Leak durch bessere Deck-/Starttexte. | Niedrig | Sichtbarkeitsscans und keine Decklisten in UI-Hinweisen. |

## Geklärte Entscheidungen

Aus dem Review vom 2026-05-04 festgelegt:

- `Auslosen` wird auch bei `Mensch gegen KI` angeboten.
- `Auslosen` wird bei `Mensch gegen KI` ebenfalls Default.
- Der Startscreen benennt `Host`/`Join` in `Match erstellen`/`Beitreten` um.
- Die tatsächlich zugeloste Seite wird nach Lobby- oder Match-Erstellung sichtbar angezeigt.
- Gegnerische Decknamen und Deckhashes werden in der Startbereitschaftslobby nicht angezeigt.
- Countdown-Optionen: 3, 5 oder 10 Sekunden; Default 3 Sekunden.
- Verbindungsverlust während Countdown bricht den Countdown ab.
- Nach Countdown-Abbruch bleibt Reconnect in die Lobby möglich.
- Ein kleiner privater Lobbychat gehört zu V1.0.3.
- Der Chat bleibt in V1.0.3 auf die Lobby begrenzt und verschwindet nach Matchstart.
- Der menschliche Anzeigename wird lokal im Browser gemerkt und beim nächsten Start/Join vorbefüllt.
- `Einzelspiel · Deckziel` darf für Tests weiterhin explizite API-Zielwerte verwenden, aber die normale Produkt-UI lässt den Server aus dem finalen DeckSetup ableiten.

## Noch zu entscheiden

Keine fachlichen offenen Punkte aus dem Planungsreview. Umsetzung darf auf Basis der geklärten Entscheidungen starten, nachdem V1.0.2 abgeschlossen und grün verifiziert ist.

## Done-Kriterien

V1.0.3 ist done, wenn:

- der Startscreen die Entscheidungen Spielart, Seite und Spielziel sauber trennt,
- Mensch-gegen-Mensch als `Mensch gegen Mensch · privater Link` sichtbar ist,
- `Auslosen` der Default für Mensch gegen Mensch ist,
- Host- und Joiner-Namen neutral sind,
- der zuletzt verwendete Anzeigename lokal wieder vorbefüllt wird,
- Mensch gegen KI über `Mensch gegen KI` plus `Deine Seite` startet,
- Mensch gegen KI ebenfalls `Auslosen` unterstützt und serverseitig deterministisch auf Runner oder Corp abbildet,
- KI gegen KI weiterhin Simulation ist,
- Testkonstellation, Join-Deck-Handshake, persönliche Deckpaare und Serien-Seitenwechsel erhalten bleiben,
- nach Joiner-Deck-Einreichung eine Startbereitschaftslobby erscheint,
- beide Personen `Bereit` bestätigen müssen,
- ein Countdown mit 3, 5 oder 10 Sekunden läuft und abbrechbar ist,
- Verbindungsverlust während Countdown abbricht und Reconnect zurück in die Lobby führt,
- der private Lobbychat für beide Teilnehmenden funktioniert und keine Engine-/Replay-Daten berührt,
- der `GameState` erst nach erfolgreichem Countdown entsteht,
- `single_game` bei Pending-Lobbys den finalen Zielwert aus dem tatsächlichen Corp-Deck ableitet,
- die Lobby nur side-sichere Statusdaten zeigt,
- V1.0.2-Pacing und Cues nicht regressieren,
- alle Pflichtchecks und Browser-Smokes grün sind,
- keine Hidden-Info-Leaks bekannt sind.
