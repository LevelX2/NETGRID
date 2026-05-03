# Netrunner-Webapplikation – Visibility- und Security-Konzept

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Primäres Ziel:** Schutz verdeckter Spielinformationen und sicherer privater Betrieb

## 1. Zweck

Netrunner ist ein Spiel mit zentraler verdeckter Information. Ein Multiplayer-Client darf nicht nur optisch daran gehindert werden, private Informationen zu sehen. Diese Informationen dürfen im falschen Clientpayload überhaupt nicht vorhanden sein.

Dieses Dokument definiert Sichtbarkeitsregeln, Sicherheitsgrenzen, Tokenmodell, Logging-Regeln, Debug-Ausnahmen und Testpflichten.

## 2. Sicherheitsziele

| Ziel | Bedeutung |
|---|---|
| Hidden-Info-Schutz | Keine gegnerischen Handkarten, Deckreihenfolgen, unrezzed Karten oder privaten Choices im falschen Client. |
| Serverautorität | Clients können keine Regeln umgehen und keinen GameState setzen. |
| Seitenspezifische Payloads | Jede ausgehende Nachricht wird für Corp oder Runner getrennt erzeugt. |
| Token-Schutz | Klartexttokens werden nicht gespeichert, geloggt oder in Events geschrieben. |
| Debug-Trennung | Full-State-Debug ist nicht Teil des normalen Spielerclients. |
| Fehlerhygiene | Fehler enthalten keine privaten Kartendetails, internen IDs oder Tokenhinweise. |
| Replay-Sicherheit | Public/Player-Replays sind gefiltert; Full-Replay nur lokal/serverseitig. |

## 3. Bedrohungsmodell für MVP 0.2

MVP 0.2 ist privater Betrieb, aber der Client ist trotzdem nicht vertrauenswürdig.

Zu erwartende Risiken:

- Spieler öffnet Browser DevTools und liest WebSocket-Payloads.
- Spieler manipuliert Clientcode und sendet eigene Actions.
- Spieler versucht Join- oder Reconnect-Token für falsche Seite zu verwenden.
- Spieler sendet doppelte oder gleichzeitige Actions.
- Spieler provoziert Fehler, um private Details in Error-Messages zu erhalten.
- Debug-Panel oder Logs leaken Full-State.
- Reconnect oder Undo liefert mehr Informationen als normaler Spielablauf.

Nicht vollständig adressiert in MVP 0.2:

- böswilliger Serveradministrator,
- öffentliche Plattformangriffe im großen Maßstab,
- kompetitive Anti-Cheat-Prüfung,
- verteilte DDoS-Abwehr,
- Accountübernahme, da kein Accountsystem existiert.

## 4. Vertrauensgrenzen

```text
Nicht vertrauenswürdig:
  Browser UI
  Browser Storage
  WebSocket Messages vom Client
  REST Requests vom Client
  DisplayName und freie Texte

Vertrauenswürdig mit Prüfung:
  Match Server
  Storage Adapter
  Session/Token Service

Regelautorität:
  Rules Engine

Nur lokal/serverseitig erlaubt:
  Full GameState Debug
  vollständige Replays
  private Payloads beider Seiten
```

## 5. Grundsatz

> Kein normaler Client erhält jemals den vollständigen GameState.

Dies gilt auch für:

- den Host,
- lokale private Partien im Browser,
- Reconnect,
- Undo-Vorschau,
- EventLog,
- Fehlerausgaben,
- Debug-Panel im normalen Spielerclient,
- Browser-Konsole,
- Client-seitige Logs.

## 6. Sichtbarkeitsmatrix

| Information | Corp-Client | Runner-Client | PublicEvent |
|---|---:|---:|---:|
| Corp HQ Karten | Ja | Nein | Nein |
| Corp HQ Anzahl | Ja | Ja | Ja, falls relevant |
| Corp R&D Reihenfolge | Ja | Nein | Nein |
| Corp R&D Anzahl | Ja | Ja | Ja |
| Corp Archives faceup | Ja | Ja | Ja |
| Corp Archives facedown vor Breach | Ja | Nein | Nein |
| Unrezzed ICE Titel | Ja | Nein | Nein |
| Unrezzed ICE Position | Ja | Ja, als verdeckte ICE-Karte | Ja, strukturell |
| Rezzed ICE Titel und Werte | Ja | Ja | Ja |
| Verdeckte Remote-Root-Karten | Ja | Nein | Nein |
| Rezzed Assets/Upgrades | Ja | Ja | Ja |
| Runner Grip Karten | Nein | Ja | Nein |
| Runner Grip Anzahl | Ja | Ja | Ja, falls relevant |
| Runner Stack Reihenfolge | Nein | Nein, außer durch erlaubte Effekte | Nein |
| Runner Stack Anzahl | Ja | Ja | Ja |
| Runner Heap | Ja | Ja | Ja |
| Runner Rig | Ja | Ja | Ja |
| Score Areas | Ja | Ja | Ja |
| Credits, Clicks, Tags, Bad Publicity | Ja | Ja | Ja |
| PendingChoice Optionen | Nur berechtigte Seite | Nur berechtigte Seite | Nein |
| SessionToken | Nie | Nie | Nie |
| TokenHash | Nie | Nie | Nie |
| Full StateHash | Optional lokal/debug | Optional lokal/debug | Nicht im normalen PublicEvent nötig |

## 7. PlayerView-Regeln

### 7.1 `PlayerViewEnvelope`

```ts
type PlayerViewEnvelope = {
  schemaVersion: string
  matchId: string
  side: "corp" | "runner"
  matchVersion: number
  stateVersion: number
  view: PlayerView
  legalActions: LegalAction[]
  pendingChoice: ChoiceRequest | null
  publicEventTail: PublicOrSideFilteredGameEvent[]
}
```

### 7.2 RunnerView darf nicht enthalten

- Corp-HQ-Kartentitel,
- Corp-HQ-CardIds verdeckter Karten,
- R&D-Reihenfolge,
- R&D-Kartentitel außerhalb eines erlaubten Access,
- Titel oder Kosten unrezzed ICE,
- Titel verdeckter Assets/Upgrades,
- verdeckte Archives-Karten vor erlaubtem Breach,
- private Corp-Choice-Optionen,
- Token, SessionIds oder Tokenhashes,
- vollständigen GameState.

### 7.3 RunnerView darf enthalten

- Anzahl HQ-Karten,
- Anzahl R&D-Karten,
- Serverstruktur,
- Position verdeckter ICE ohne Identität,
- Position verdeckter Remote-Karten ohne Identität,
- gerezzte Karten mit öffentlichen Eigenschaften,
- eigene Grip-, Heap-, Stackanzahl- und Rig-Informationen,
- eigene LegalActions,
- erlaubte Access-Informationen während Access.

### 7.4 CorpView darf enthalten

- HQ vollständig,
- R&D vollständig,
- Archives aus Corp-Sicht,
- unrezzed ICE und verdeckte Remote-Karten,
- eigene Rez-/Score-/Installationsoptionen,
- öffentliche Runner-Informationen.

### 7.5 CorpView darf nicht enthalten

- Runner-Grip-Kartentitel,
- Runner-Stack-Reihenfolge,
- private Runner-Choice-Optionen,
- nicht offenbarte Runner-Zufallsergebnisse,
- Token oder Full-State-Debugdaten im normalen Client.

## 8. LegalActions und ChoiceRequests

`LegalAction` ist nicht automatisch öffentlich. Sie kann private Details enthalten, z. B.:

- welche unrezzed ICE die Corp rezzen kann,
- welche HQ-Karte aus Corp-Sicht als Ziel möglich ist,
- welche private Choice-Optionen verfügbar sind.

Regeln:

1. LegalActions werden pro Seite berechnet oder vor Versand pro Seite gefiltert.
2. Der Gegner erhält keine private LegalAction-Liste.
3. Ein Wartezustand darf anzeigen, dass der Gegner entscheidet, aber nicht worüber genau, wenn das private Informationen offenlegt.
4. `ChoiceRequest.options` werden nur an die berechtigte Seite gesendet.
5. Abgelehnte Actions geben keine privaten Gründe preis.

## 9. EventLog-Regeln

### 9.1 Eventarten

```ts
type GameEvent = {
  publicText: string
  privateText?: Partial<Record<Side, string>>
  publicPayload: unknown
  privatePayload?: Partial<Record<Side, unknown>>
}
```

### 9.2 PublicEvent

PublicEvents dürfen enthalten:

- öffentliche Aktionen,
- bezahlte öffentliche Kosten,
- sichtbare Kartenbewegungen,
- gerezzte Karten,
- Score/Steal öffentlich bekannter Agendas,
- Run-Start, Serverziel, Erfolg/Fehlschlag,
- öffentliche Subroutinenauflösung.

PublicEvents dürfen nicht enthalten:

- nicht offenbarte HQ-Karten,
- nicht offenbarte R&D-Karten,
- unrezzed Kartentitel,
- verdeckte Remote-Kartentitel,
- private Random-Ergebnisse,
- interne verdeckte CardInstanceIds.

### 9.3 PrivateEvent

PrivateEvents dürfen seitenspezifische Details enthalten, müssen aber getrennt gespeichert und gefiltert versendet werden. Beispiel: Die Corp darf ein privates Event über die genaue HQ-Karte behalten, die zufällig ausgewählt wurde, falls das für Debugging nötig ist; der Runner darf nur die Karte sehen, die er regelkonform accessed.

## 10. Fehlernachrichten

Fehler dürfen nicht verraten:

- welche private Karte existiert,
- welche Karte unrezzed ist,
- welche verdeckte Karte Ziel einer abgelehnten Action gewesen wäre,
- welche Seite ein Token gültig machen würde,
- interne CardInstanceIds,
- Stack- oder R&D-Reihenfolge,
- Debug-Dumps.

Beispiele:

| Situation | Erlaubter Fehler | Verbotener Fehler |
|---|---|---|
| Runner versucht ungültiges Rez | „Die Aktion ist für diese Seite nicht legal.“ | „Runner kann unrezzed Simple Barrier ICE nicht rezzen.“ |
| Stale Action | „Der Spielzustand wurde aktualisiert. Aktionen wurden neu geladen.“ | „Action ungültig, weil Corp inzwischen Simple Agenda installiert hat.“ |
| Token ungültig | „Der Link ist ungültig oder abgelaufen.“ | „Token gehört zur Runner-Seite.“ |
| Undo blockiert | „Undo blockiert, weil seitdem verdeckte Information offengelegt wurde.“ | „Undo blockiert, weil Runner die oberste R&D-Karte Simple Agenda gesehen hat.“ |

## 11. Reconnect-Sicherheit

Reconnect-Payloads müssen identisch streng gefiltert sein wie normale StateUpdates.

Pflichtregeln:

- Seite wird aus Token bestimmt.
- Client darf Seite nicht selbst festlegen.
- Alte Verbindung derselben Seite wird ersetzt oder deaktiviert.
- Reconnect während PendingChoice liefert nur berechtigte Optionen.
- Reconnect während Access liefert nur die Informationen, die die Seite im aktuellen Access sehen darf.
- EventLog-Tail ist gefiltert.
- Keine Token, Tokenhashes oder Sessiondetails im Clientpayload.

## 12. Undo-Sicherheit

Undo ist wegen verdeckter Information besonders gefährlich.

Regeln:

1. Undo benötigt Zustimmung beider Seiten.
2. Undo wird blockiert, wenn seit Zielpunkt relevante verdeckte Information offengelegt wurde.
3. Hidden-Info-Barrier-Gründe bleiben im Client allgemein.
4. Undo-Vorschau darf keine privaten Kartendetails enthalten.
5. Restore erzeugt neue PlayerViews und LegalActions, nicht wiederverwendete alte Clientdaten.

Hidden-Info-Barrier-Beispiele:

- HQ-Zugriff mit zufälliger Karte,
- Zugriff auf oberste R&D-Karte,
- Aufdecken verdeckter Archives-Karten,
- Shuffle/Draw, dessen Ergebnis bereits gesehen wurde,
- später: Effekte, die gegnerische Hand oder Deckkarten offenlegen.

## 13. Token- und Session-Sicherheit

### 13.1 Mindestanforderungen

| Bereich | Regel |
|---|---|
| Tokenentropie | Mindestens 128 Bit, empfohlen 192 oder 256 Bit. |
| Speicherung | Nur Hash, kein Klartext. |
| Logging | Token und Tokenhashes nicht loggen. |
| Join-Link | Nur freie Seite. |
| Reconnect | Seitenspezifisch, keine Seitenübernahme. |
| Ablauf | Join-Token optional 24h; aktive Sessions länger oder matchgebunden. |
| Widerruf | Tokens können widerrufen werden. |
| Fehlermeldungen | Keine Auskunft über gültige Seite. |

### 13.2 Token-Verwendung

- URL-Token wird beim ersten Laden in eine seitenspezifische Session überführt.
- Der Browser speichert den SessionToken nur so lange wie nötig.
- Token dürfen nicht in PublicEvents, Screenshots, Debugexports oder Clientlogs erscheinen.
- Bei privatem Internetbetrieb sollte `Secure`/`HttpOnly` Cookie-Storage geprüft werden. Falls Bearer Token im Client genutzt werden, muss Logging besonders streng gefiltert werden.

## 14. Logging und Debugging

### 14.1 Normale Logs dürfen enthalten

- MatchId,
- grober Eventtyp,
- StateVersion,
- MatchVersion,
- Fehlercode,
- TimingPoint,
- ConnectionStatus,
- Dauer von Operationen.

### 14.2 Normale Logs dürfen nicht enthalten

- vollständigen GameState,
- HQ-/R&D-/Grip-/Stack-Kartentitel,
- unrezzed Kartentitel im falschen Kontext,
- Token oder Tokenhashes,
- private Payloads,
- vollständige WebSocket-Payloads ungefiltert.

### 14.3 Debug-Modi

```ts
type DebugAccessMode = "disabled" | "local_dev_only" | "server_console_only"
```

| Modus | Bedeutung |
|---|---|
| `disabled` | Kein Full-State-Debug. |
| `local_dev_only` | Nur lokaler Entwicklerkontext; nicht über privaten Internetspielerclient. |
| `server_console_only` | Full-State nur über Serverkonsole/geschützte Logs, nicht Browser. |

Für private Internetspiele gilt: `disabled` oder `server_console_only`.

## 15. REST-/WebSocket-Schutz

| Bereich | Regel |
|---|---|
| CORS/Origin | Private Server beschränken erlaubte Origins. |
| Rate Limits | Match-Erstellung, Join, Reconnect und SubmitAction begrenzen. |
| WebSocket Join | Keine Spielnachricht vor erfolgreichem `join_match`. |
| Message Size | Payload-Größe begrenzen. |
| Schema Validation | Jede Clientmessage gegen Schema validieren. |
| Idempotency | Pflicht für Actions und PassPriority. |
| Locking | Pro Match nur eine Transition gleichzeitig. |
| Error Hygiene | Generische Meldungen ohne private Details. |

Empfohlene private Rate Limits:

| Aktion | Limit |
|---|---:|
| Match erstellen | 10 pro Stunde/IP |
| Join-Versuche | 20 pro Stunde/Match oder IP |
| WebSocket Join | 30 pro Stunde/Match |
| Submit Action | 5 pro Sekunde/Session plus Idempotency |
| Reconnect | 30 pro Stunde/Session |

## 16. Visibility-Oracle

Automatisierte Tests sollen jeden ausgehenden Payload serialisieren und gegen verbotene Werte prüfen.

### 16.1 Oracle-Inputs

- vollständiger GameState,
- Zielseite,
- gesendeter Payload,
- Liste privater CardInstanceIds,
- Liste privater Kartentitel,
- verbotene Tokenmuster,
- aktuelle erlaubte Access-Ausnahmen.

### 16.2 Zu prüfende Outputs

- REST Bootstrap,
- REST Replay,
- WebSocket StateUpdate,
- LegalActions,
- ChoiceRequest,
- EventLogUpdate,
- ActionReceipt,
- ErrorMessage,
- UndoRequested/UndoResolved,
- clientseitiger Debugexport.

### 16.3 Negative Golden Cases

Pflichtfälle:

- Runner-Payload enthält keine Corp-HQ-Titel.
- Runner-Payload enthält keine R&D-Reihenfolge.
- Runner-Payload enthält keine unrezzed ICE-Titel.
- Corp-Payload enthält keine Runner-Grip-Titel.
- PublicEvent nach HQ-Access enthält keine nicht gesehenen HQ-Karten.
- Reconnect-Payload ist nicht detailreicher als normaler StateUpdate.
- Undo-Block nennt keinen konkreten verdeckten Kartentitel.
- ErrorMessage enthält keine private CardInstanceId.
- Normale Logs enthalten keine Klartexttokens.

## 17. Incident-Verfahren bei Leak-Verdacht

Wenn ein Hidden-Info-Leak entdeckt wird:

1. Payload, StateVersion, MatchId und EventId sichern.
2. Klartexttokens aus Debugmaterial entfernen.
3. Betroffenen Message-Typ identifizieren.
4. Visibility-Oracle um den Fall erweitern.
5. Filterlogik zentral korrigieren, nicht nur UI kaschieren.
6. Regressionstest hinzufügen.
7. Replays oder gespeicherte Events prüfen, ob PublicPayloads betroffen sind.
8. Falls nötig, EventSchema-Migration oder read-only-Markierung alter Replays vornehmen.

## 18. Security-Abnahmekriterien

Security/Visibility gilt als abnahmefähig, wenn:

- jeder REST- und WebSocket-Ausgang einen zentralen Filterpfad nutzt,
- alle Pflicht-Negativtests bestehen,
- falsche Tokens keine privaten Details leaken,
- Clientmanipulation keine illegalen Actions durchsetzt,
- normale Logs keine Tokens und keine privaten Kartendetails enthalten,
- Full-State-Debug nicht im normalen Spielerclient verfügbar ist,
- Reconnect und Undo dieselben Visibility-Regeln erfüllen,
- keine bekannten P0-Hidden-Info-Leaks offen sind.
