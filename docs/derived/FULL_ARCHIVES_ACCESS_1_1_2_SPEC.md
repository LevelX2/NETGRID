# Full Archives Access 1.1.2 Spec

Stand: 2026-05-07
Status: Spezifikation eingefroren

## Zweck

Diese Spezifikation beschreibt Track A von V1.1.2: vollständigen Runner-Access auf Korp-Archives mit gemischten faceup/facedown Karten. Ziel ist ein regel- und sichtbarkeitskorrekter Access-/Breach-Vertrag, der spätere Karten tragen kann, ohne Hidden Info, Replay oder StateHash zu beschädigen.

## Ausgangszustand

V1.1.0 hat ein Archives-facedown-Fundament eingeführt:

- Korp-Archives können faceup und facedown Karten enthalten.
- Korp sieht eigene Archives vollständig.
- Runner sieht nur erlaubte faceup Informationen.
- Full Archives Access wurde ausdrücklich auf V1.1.2 verschoben.

Der aktuelle Engine-Code enthält bereits `archives` als Server und baut für Breach-Queues bei Archives grundsätzlich `state.corp.archives.slice()`. Die kritische Lücke ist, dass facedown Archives-Karten in der Access-Queue und in Events konsequent als Hidden Info behandelt werden müssen, bis sie tatsächlich accessed werden.

## Datenmodell

### CardInstance

Der bestehende Vertrag bleibt:

- `faceup: true`: Runner darf Korp-Archives-Karte vor dem Access kennen.
- `faceup: false`: Runner darf Korp-Archives-Karte vor dem Access nicht kennen.
- Korp darf eigene Karten unabhängig von `faceup` kennen.

### AccessQueueEntry

`AccessQueueEntry.hiddenInfo` muss für Archives gelten:

- R&D: hidden, solange nicht accessed.
- HQ: hidden, solange nicht accessed.
- Remote Root: hidden, wenn nicht rezzed/faceup und nicht accessed.
- Archives: hidden genau dann, wenn die Korp-Archives-Karte `faceup === false` und noch nicht accessed wurde.

Eine Implementierung darf dafür `isBreachEntryHidden` anpassen oder ein spezifischeres Feld ergänzen. Entscheidend ist der sichtbare Vertrag, nicht der Feldname.

### BreachState

Für Archives gilt:

- `serverId: "archives"`.
- `queue`: alle `corp.archives`-Einträge in authoritative Array-Reihenfolge.
- `currentIndex`: aktueller Queue-Eintrag.
- `remainingCount`: nur Anzahl, keine Identitäten künftiger hidden Einträge.
- `accessedSummaries`: nur bereits abgeschlossene Einträge; für hidden Einträge erst nach Access mit erlaubter Redaction.

## Access-Reihenfolge

V1.1.2 verwendet die bestehende authoritative Reihenfolge von `state.corp.archives`.

Regel:

- Keine Sortierung nach faceup/facedown.
- Kein Random.
- Kein manuelles Reorder.
- Kein Überspringen facedown Karten.

Begründung:

- Deterministisch.
- Minimaler Scope.
- Keine neue Choice- oder Timing-Komplexität.

Wenn spätere Karten Archives-Reihenfolge oder gezielte Auswahl ändern, brauchen sie ein eigenes Gate.

## PlayerView-Vertrag

### Runner-View vor Archives-Access

Runner darf sehen:

- Archives-Server existiert.
- Anzahl Korp-Archives über `opponent.discardCount`.
- Faceup Archives-Karten mit vollständigen sichtbaren Daten.
- Füll-/Count-Information für facedown Karten nur als anonyme Anzahl, sofern UI das darstellt.

Runner darf nicht sehen:

- Titel, DefinitionId, Regeltext, Kosten, Typen, Subtypen, Bildpfade oder DOM-IDs facedown Archives-Karten.
- Reihenfolge hidden Einträge über unterscheidbare IDs.
- Hidden-Karten über `heapOrArchives`, `servers.root`, Reconnect oder Debugdaten.

### Korp-View

Korp darf sehen:

- Vollständige eigene Archives in eigener `heapOrArchives`-Anzeige.
- Faceup/facedown Zustand.
- Vollständige Kartendaten.

Korp darf nicht über side-gefilterte Runner-Aktionen zusätzliche Runner-Hidden-Info erhalten.

## Access-Ablauf

### Erfolgreicher Run auf Archives

1. Run wird erfolgreich.
2. Engine ruft `enterAccess`.
3. Engine baut `BreachState` für Archives.
4. Wenn Archives leer ist, endet der Run erfolgreich ohne Access.
5. Wenn Queue nicht leer ist, Timingpoint `access.resolve_card`, activeSide Runner.

### `access_card`

1. LegalAction existiert nur für Runner und nur bei pending Queue-Eintrag.
2. `applyAction` revalidiert StateVersion, Timingpoint, Side und aktuellen Queue-Eintrag.
3. Engine setzt `accessedCardId` auf aktuellen Eintrag.
4. Engine setzt die accessed Karte `faceup: true`.
5. Engine erzeugt Access-Event mit serverId, breachId und accessIndex.
6. Wenn Karte Agenda ist: Runner kann/stealt nach bestehendem Vertrag.
7. Wenn Karte trashbar ist: Trash/Decline bleibt nach bestehendem Vertrag.
8. Wenn Karte weder Agenda noch trashbar ist: Queue-Eintrag wird abgeschlossen und nächster pending Eintrag wird aktiv.

### Steal/Trash/Decline

Für Archives-Breach gilt derselbe Queue-Fortschritt wie bei anderen Breaches:

- Steal entfernt Karte aus Corp-Zone und bewegt sie in Runner-ScoreArea.
- Trash darf Karte nicht doppelt in Archives legen, wenn sie bereits aus Archives stammt.
- Decline schließt nur aktuellen Eintrag.
- Nach letztem Eintrag endet Breach/Run sauber.

Wichtiger Implementierungspunkt:

- `trashAccessedCard` muss Archives-Quellzone berücksichtigen. Eine Karte, die bereits in `corp.archives` liegt, darf beim Trash nicht erneut an `corp.archives` angehängt werden.

## Event- und Redaction-Vertrag

### GameEvent

Authoritative GameEvents dürfen intern ausreichend Daten für Replay und StateHash tragen. Sobald Daten als PublicEvent, PlayerView, WebSocket, Reconnect oder UI-Diagnostik sichtbar werden, gilt Side-Redaction.

### Runner sichtbare Access-Events

Runner darf beim aktuellen Access sehen:

- Titel und DefinitionId der gerade accessed Karte.
- Server `Archives`.
- Access-Index/Fortschritt ohne künftige hidden Titel.

### Korp sichtbare Access-Events

Korp darf eigene Archives-Karten kennen. Trotzdem muss die Event-Redaction sicherstellen, dass keine Runner-Hidden-Info oder andere verdeckte Nicht-Korp-Daten durch allgemeine Access-Redaction regressieren.

### Öffentliche/diagnostische Flächen

Nicht side-spezifische PublicEvent-Listen, Logs und Diagnoseflächen dürfen keine facedown Archives-Titel enthalten, bevor die Karte tatsächlich accessed wurde und die jeweilige Sichtbarkeit dies erlaubt.

## Hidden-Info-Barriere und Undo

Access auf eine vor dem Access facedown Archives-Karte:

- ist eine Hidden-Info-Barriere,
- blockiert Undo über dieses Event hinweg,
- muss in Event-/Undo-Snapshots als Barriere erkennbar sein.

Access auf ausschließlich faceup bekannte Archives-Karten:

- darf als Access weiterhin relevant sein,
- soll aber keine zusätzliche Hidden-Info-Barriere nur wegen Archives setzen, sofern keine verdeckte Information neu entsteht.

Wenn die technische Undo-Implementierung aktuell alle `access_card`-Events als Hidden-Info-Barriere behandelt, darf V1.1.2 diese konservative Regel beibehalten, muss sie aber im Implementation Review als strenger als minimal dokumentieren.

## Replay und StateHash

Replay muss reproduzieren:

- Archives-Queue-Reihenfolge.
- Accessed Karte pro Index.
- `faceup`-Wechsel beim Access.
- Steal/Trash/Decline.
- Hidden-Info-Barriere.
- finalen StateHash.

Keine neue Randomness wird eingeführt.

## Server und Multiplayer

Server muss:

- Submit über bestehende Action-Pipeline führen.
- Idempotency für `access_card`, Steal/Trash/Decline erhalten.
- Stale StateVersion ablehnen.
- Reconnect während Archives-Breach side-sicher liefern.
- EventTail ohne künftige facedown Kartentitel ausgeben.
- WebSocket-Payloads side-sicher redigieren.

## KI-Vertrag

KI darf:

- aus LegalActions entscheiden, ob sie einen Runner-Access fortsetzt oder eine KI-Choice ausführt, soweit relevant.
- eigene Korp-Archives sehen, wenn sie Korp ist.

KI darf nicht:

- als Runner vor dem Access facedown Korp-Archives-Karten kennen.
- FullState oder private Korp-Archives-Daten in Runner-KI-Input erhalten.

## Web UI

Die UI soll zeigen:

- Archives als zentralen Server.
- Vor Access: bekannte faceup Karten und anonyme facedown Anzahl.
- Während Breach: Fortschritt, z. B. `Archives 2/5`.
- Access-Reveal für die aktuelle Karte.
- Nach Access: Karte wird in sichtbarem Verlauf/Chronik nur nach erlaubter Side angezeigt.

Die UI darf nicht zeigen:

- Cardback-Bilder oder offizielle Rückseiten.
- Bildpfade facedown Karten.
- hidden DOM-Attribute mit echten IDs/Titeln.

## Tests

Siehe `docs/derived/V1_1_2_TEST_MATRIX.md`, insbesondere:

- Engine Archives Queue.
- facedown Redaction.
- Reveal beim Access.
- Steal/Trash/Decline aus Archives.
- Undo-Barriere.
- Replay/StateHash.
- Server Reconnect.
- E2E mit Leak-Scan.

## Implementierungsreihenfolge

1. Tests für aktuellen Sollvertrag schreiben.
2. Hidden-Klassifikation für Archives korrigieren.
3. Access-/Trash-/Decline-Zonenlogik absichern.
4. Event-/PlayerView-/Reconnect-Redaction prüfen.
5. Web-Darstellung und E2E ergänzen.
6. Full Regression.
