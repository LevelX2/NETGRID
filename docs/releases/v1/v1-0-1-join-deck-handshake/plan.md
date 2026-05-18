# V1.0.1 Deckbibliothek und Join-Deck-Handshake

Status: implemented_locally_verified
Stand: 2026-05-04

## Zweck

V1.0 stabilisiert Deckpaare und Serien technisch, ist aber im Human-vs-Human-Start noch zu stark als host-kontrollierte Testkonstellation gedacht. V1.0.1 soll daraus ein produktlogisch sauberes privates Lobby-/Join-Modell machen:

- Eigene gespeicherte Decks sind der normale Arbeits- und Matchstart-Gegenstand.
- Vorgefertigte Decks/Templates sind nur ein optionaler Einstiegspunkt, nicht die prominente Hauptliste.
- Im normalen Mensch-vs-Mensch-Modus wählt jede Person ihre eigenen Decks.
- Der Host gibt dem Gegenspieler keine Decks vor.
- KI-Decks bleiben bewusst steuerbar: fest, explizit gewählt oder deterministisch zufällig.
- Die V1.0-Testfähigkeit bleibt erhalten, aber nicht als Standard-UX für echte private Spiele.

## Ausgangslage

V1.0 ist umgesetzt:

- Server kennt persönliche Deckpaare über `participantADecks` und `participantBDecks`.
- Serien-Folgespiele nutzen persönliche Runner-/Corp-Deckpaare korrekt über den Seitenwechsel.
- KI-Deckpolitik unterstützt `fixed`, `selected` und `seeded_random`.
- Matchstart validiert Snapshots serverseitig und leakt keine Decklisten.

Produktlücke:

- Der Deckeditor trennt lokale Deckentwürfe, gespeicherte Decks und matchstartfähige Snapshots nicht verständlich genug.
- Lokale Decks werden technisch automatisch im Browser gespeichert, die UI zeigt aber kein klares Speichern-/Gespeichert-Modell.
- Der Matchstart kann nur eingefrorene Standardsnapshots und genau den zuletzt validierten lokalen Snapshot je Side auswählen.
- Dadurch wirkt es so, als müsse man ein Deck erst über `Validieren` und `Für Match` in einen unsichtbaren temporären Slot schieben.
- Template-Buttons stehen dauerhaft prominent oben im Deckbereich und nehmen Raum ein, obwohl sie mittelfristig nur Hilfsmittel zum Erstellen eigener Decks sind.
- Die Web-Host-UI zeigt im Human-vs-Human-Modus alle vier Deckslots.
- Dadurch wirkt es so, als solle Teilnehmer A auch die Decks von Teilnehmer B bestimmen.
- Für reale private Human-vs-Human-Spiele ist das falsch; der Joiner muss seine eigenen Decks auswählen.

## Produktentscheidungen für V1.0.1

### Deckbibliothek und gespeicherte Decks

Normales Nutzungsmodell:

1. Spieler erstellt oder importiert ein eigenes Deck.
2. Spieler speichert das Deck bewusst.
3. Das gespeicherte Deck bleibt im Browser lokal erhalten.
4. Beim Matchstart wählt der Spieler aus seinen gespeicherten Decks.
5. Beim Start oder auf Wunsch vorher wird das gewählte Deck validiert.
6. Nur ein erfolgreich validiertes Deck wird für das Match als unveränderlicher Snapshot eingefroren.

Begriffe:

- `Gespeichertes Deck`: editierbares lokales Deck in der eigenen Deckbibliothek.
- `Vorlage`: versioniertes Startdeck, aus dem ein gespeichertes eigenes Deck kopiert werden kann.
- `Validierter Snapshot`: technische, unveränderliche Match-Eingabe aus einem gespeicherten Deck.
- `Standard-Snapshot`: fest versioniertes Demo-/KI-/Testdeck aus dem Projekt.

UI-Entscheidung:

- Der Deck-Tab heißt inhaltlich `Meine Decks`.
- Die Hauptfläche zeigt zuerst eigene gespeicherte Decks.
- `Speichern` ist ein sichtbarer Button und Teil des Benutzervertrags.
- Technisch darf eine lokale Entwurfssicherung existieren, aber die UI muss klar anzeigen:
  - ungespeicherte Änderungen
  - gespeichert
  - zuletzt geprüft/gültig
  - nicht matchstartfähig
- Speichern ist auch für noch ungültige Decks erlaubt.
- Validierung ist eine Prüfung, kein Speichern.
- `Für Match` entfällt als notwendiger Zwischenschritt oder wird durch `Im Matchstart auswählen` ersetzt.

Vorlagen:

- Vorgefertigte Decks werden nicht dauerhaft als Button-Leiste oben angezeigt.
- Sie liegen in einem aufklappbaren Bereich, z. B. `Vorgefertigte Decks anzeigen` oder `Aus Vorlage erstellen`.
- Ein Klick auf eine Vorlage erstellt ein normales gespeichertes eigenes Deck.
- Später können dort bewusst gepflegte Start-/Beispieldecks liegen; sie bleiben trotzdem Hilfsmittel, nicht Primärnavigation.

Matchstart:

- Matchstart wählt gespeicherte Decks direkt aus.
- Bei Start validiert der Server die ausgewählten Decks erneut und friert sie als Match-Snapshots ein.
- Ungültige Decks erzeugen eine klare Meldung mit den Validierungsgründen.
- Die UI darf Gültigkeitsstatus vorab anzeigen, darf sich aber nicht allein auf einen alten Clientstatus verlassen.
- Standard-/Projekt-Snapshots bleiben für Tests und KI-Fixed nutzbar, aber nicht als dominante Auswahl für normale eigene Spiele.

Persistenzgrenze:

- V1.0.1 bleibt lokal und privat.
- Keine Accounts, keine Cloud-Decks, keine öffentlichen Decklisten.
- Gespeicherte Decks liegen zunächst weiter lokal im Browser.
- Export/Import bleibt als manuelle Sicherung und Transfermöglichkeit erhalten.

### Human vs Human

Default-Modell:

- Teilnehmer A ist Host.
- Teilnehmer B ist Joiner.
- Host wählt nur eigene Decks:
  - `Teilnehmer A · Runner-Deck`
  - `Teilnehmer A · Corp-Deck`
- Joiner wählt beim Beitritt eigene Decks:
  - `Teilnehmer B · Runner-Deck`
  - `Teilnehmer B · Corp-Deck`
- Das Match startet erst, wenn beide Teilnehmer ihre erforderlichen Decks validiert und eingereicht haben.

Deckanforderung:

- Für `two_game_side_swap` sind pro Teilnehmer Runner- und Corp-Deck Pflicht.
- Für `hostSide=random` sind pro Teilnehmer Runner- und Corp-Deck Pflicht.
- Für einfache explizite Einzelspiele könnte theoretisch nur das aktuell gespielte Side-Deck reichen. V1.0.1 sollte trotzdem standardmäßig beide Decks verlangen, damit die UI, Serienlogik und Reconnect-/Replay-Verträge einfach und einheitlich bleiben.

Sichtbarkeit:

- Decklisten bleiben privat.
- Nach erfolgreichem Join dürfen beide Seiten nur öffentliche Deckmetadaten sehen, wie bisher `deckName`, `deckHash`, `side`, `snapshotId`.
- Joiner darf die Host-Deckliste nicht sehen.
- Host darf die Joiner-Deckliste nicht sehen.

### Testkonstellationen

Die V1.0-Fähigkeit, alle vier Deckslots vorzugeben, bleibt nützlich für reproduzierbare lokale Tests.

V1.0.1 sollte diese Fähigkeit nicht als normale Human-vs-Human-UX anbieten, sondern sauber einordnen:

- Server/API darf weiterhin vollständige `participantADecks` und `participantBDecks` akzeptieren.
- Web-UI kann optional einen klar benannten Modus `Testkonstellation` oder `Beide Teilnehmer festlegen` anbieten.
- Dieser Modus ist nicht der Standard für private Human-vs-Human-Spiele.

### Human vs KI

Host wählt immer die eigenen Decks.

Für die KI gibt es drei sinnvolle Modi:

- `selected`: Host wählt die KI-Decks explizit, um eine konkrete Konstellation zu testen.
- `fixed`: Server nutzt ein festes Standard-KI-Deckpaar.
- `seeded_random`: Server wählt deterministisch aus einem hinterlegten KI-Deckpool.

UI-Verhalten:

- Bei `selected` werden KI-Runner-/Corp-Deckslots angezeigt.
- Bei `fixed` und `seeded_random` werden KI-Deckslots nicht als editierbare Auswahl angezeigt, sondern als Serverentscheidung kommuniziert.

### KI-Deckpool

V1.0 nutzt für `seeded_random` eingefrorene validierte Snapshots. V1.0.1 sollte diesen Pool sauberer modellieren.

Empfohlen:

- Neues versioniertes Manifest unter `data/ai/ai-deck-pool-1.0.1.json`.
- Enthält erlaubte KI-Snapshots mit Side, Snapshot-ID, Schwierigkeit/Tags und Zweck.
- Beispiel-Tags:
  - `starter`
  - `runner_ai_safe`
  - `corp_ai_safe`
  - `easy`
  - `normal`
  - `hard`
  - `series_safe`
- Private lokale O:NR-Snapshots bleiben für Random-KI ausgeschlossen, solange sie nicht über ein bewusst lokales, ignoriertes Manifest freigegeben werden.
- Explizit gewählte lokale O:NR-Decks bleiben erlaubt, sofern sie als validierte lokale Snapshots eingereicht werden.

## Technisches Zielbild

### Match-Lifecycle

Aktuell erzeugt `createMatch` direkt ein `GameState`, wofür beide Seiten-Decks bekannt sein müssen.

Für V1.0.1 braucht Human-vs-Human einen Lobby-Zwischenzustand:

1. Host erstellt Match mit eigenen Decks.
2. Server speichert ein pending Match/Lobby ohne finalen `GameState`.
3. Joiner ruft Join-Link auf und wählt eigene Decks.
4. Server validiert Joiner-Decks.
5. Erst dann löst der Server Side-Zuweisung, Teilnehmerdeckpaare, `GameState`, Initial-Snapshot, EventLog und PlayerViews aus.
6. Host erhält danach per Bootstrap/WebSocket den gestarteten Matchzustand.

Mögliche Statuswerte:

- `waiting_for_joiner_decks`
- `active`
- `finished`

Alternativ kann der bestehende Status `waiting_for_runner`/`waiting_for_corp` erhalten bleiben und um eine explizite Deck-Handshake-Information ergänzt werden. Wichtig ist: vor vollständigem Deck-Handshake darf es keinen finalen `GameState` geben, der falsche oder placeholderartige Gegnerdecks enthält.

### Server/API

Anpassungen:

- `POST /api/matches`:
  - Human-vs-Human-Default: akzeptiert nur Host-Deckpaar.
  - Optionaler Testmodus: akzeptiert weiterhin beide Teilnehmerdeckpaare und startet direkt.
- `POST /api/matches/:id/join`:
  - akzeptiert Joiner-Deckpaar.
  - validiert und friert Joiner-Snapshots ein.
  - startet Match, sobald beide Deckpaare vorhanden sind.
- `GET /api/matches/:id/join-info`:
  - sollte anzeigen, ob Deckauswahl beim Join erforderlich ist.
  - darf keine Host-Deckliste leaken.
- `GET /api/matches/:id/bootstrap`:
  - muss pending Lobby-Zustand side-sicher liefern oder sauber sagen, dass noch kein `PlayerView` existiert.

Zu prüfen:

- Ob `StoredMatch.gameState` optional werden soll.
- Ob ein eigener `LobbyRecord` eingeführt wird.
- Ob `CreateMatchResult` und `JoinMatchResult` in pending/active Varianten aufgeteilt werden.

Empfohlener technischer Schnitt:

- `StoredMatch.gameState?: GameState`
- `stateSnapshots`, `eventLog`, `actionReceipts` bleiben leer, bis das Match aktiv startet.
- `payloadFor` wird nur für aktive Matches mit `gameState` aufgerufen.
- Neue Lobby-Payloads für pending Zustände halten UI und Serververtrag explizit.

### Web-UI

Deck-Ansicht:

- Oben: Liste/Karten der eigenen gespeicherten Decks mit Side, Kartenzahl und Validierungsstatus.
- Primäre Aktionen:
  - `Neues Runner-Deck`
  - `Neues Corp-Deck`
  - `Speichern`
  - `Prüfen`
  - `Export`
  - `Import`
- Vorlagen in einem eingeklappten Bereich `Vorgefertigte Decks`.
- Kein permanenter Template-Knopfstreifen als Hauptinhalt.
- Kein versteckter Einzel-Snapshot als einziger Weg in den Matchstart.

Host-Ansicht:

- Human-vs-Human:
  - zeigt nur Teilnehmer A Runner/Corp.
  - zeigt Hinweis, dass Teilnehmer B seine Decks beim Beitritt wählt.
  - optionaler Testmodus-Schalter für beide Teilnehmer festlegen.
- Human-vs-KI:
  - zeigt Teilnehmer A Runner/Corp.
  - zeigt KI-Deckpolitik.
  - zeigt KI-Deckslots nur bei `selected`.
- KI-vs-KI:
  - bleibt Simulation/Testfläche; beide KI-Seiten folgen KI-Deckpolitik.

Join-Ansicht:

- Join-Link öffnet Join-Bereich.
- Joiner gibt Name und eigene Decks an.
- Bei Serien/Random/Default: Runner- und Corp-Deck.
- Button: `Mit Decks beitreten`.
- Nach erfolgreichem Join startet das Match oder zeigt den aktiven Matchzustand.

Deckeditor-Verbindung:

- Matchstart bezieht gespeicherte lokale Decks direkt ein.
- Der alte `Für Match`-Pfad darf nicht mehr der einzige Weg sein.
- Wenn eine kontextsensitive Schnellaktion erhalten bleibt, muss sie eindeutig sein:
  - `Im Matchstart auswählen`
  - Host-Human-vs-Human: setzt Teilnehmer A.
  - Join-Ansicht: setzt Teilnehmer B.
  - KI-selected: optional klare Slot-Auswahl, für welchen KI-Slot das Deck genutzt werden soll.
- Die eigentliche Matchstart-Aktion validiert und friert die ausgewählten gespeicherten Decks erneut ein.

## Tests

Pflichttests:

- Deckbibliothek:
  - Neues Deck kann erstellt, geändert und explizit gespeichert werden.
  - Gespeichertes Deck bleibt nach Reload sichtbar.
  - Ungespeicherte Änderungen werden erkennbar.
  - Vorlagen sind eingeklappt und erzeugen bei Auswahl ein eigenes gespeichertes Deck.
  - Validierung speichert nicht implizit und Speichern validiert nicht implizit.
  - Ungültiges gespeichertes Deck bleibt in der Bibliothek, wird beim Matchstart aber mit klarer Meldung blockiert.
- Matchstart:
  - gespeicherte lokale Runner-/Corp-Decks erscheinen direkt in der eigenen Deckauswahl.
  - Matchstart friert gespeicherte Decks serverseitig als Snapshots ein.
  - alte validierte lokale Snapshots können nicht unbemerkt weiterverwendet werden, wenn das gespeicherte Deck danach geändert wurde.
- Server:
  - Human-vs-Human `createMatch` mit nur Host-Deckpaar erzeugt pending Lobby und keinen `GameState`.
  - Join mit validem Joiner-Deckpaar startet Match und erzeugt korrekte PlayerViews.
  - Join ohne erforderliche Decks wird abgelehnt.
  - Host kann im Default-Human-vs-Human nicht heimlich Teilnehmer-B-Decks vorgeben.
  - Expliziter Testmodus darf beide Teilnehmerdeckpaare direkt starten.
  - Serien-Folgespiel nutzt nach Join-Handshake weiterhin persönliche Deckpaare.
  - Hidden-Info: keine Decklisten in JoinInfo, Lobby-Payload, WebSocket, Reconnect, ResultSummary.
- KI:
  - `selected` nutzt explizit gewählte KI-Decks.
  - `fixed` nutzt Standard-KI-Deckpaar.
  - `seeded_random` nutzt KI-Deckpool deterministisch.
  - lokale O:NR-Snapshots werden bei Random nicht ohne Manifest aufgenommen.
- Web/Visibility:
  - Deck-Tab zeigt eigene Decks als Hauptinhalt und Vorlagen nur auf Bedarf.
  - Speichern-/Gespeichert-/Prüfstatus ist sichtbar.
  - Host-Human-vs-Human zeigt nur eigene Deckslots.
  - Join-Ansicht zeigt eigene Deckslots.
  - KI-selected zeigt KI-Slots; KI-fixed/random nicht editierbar.
  - Browser-Smoke: Deck aus Vorlage erstellen, ändern, speichern, reloaden, im Matchstart auswählen, Match starten.
  - Browser-Smoke: Host erstellt Lobby, Joiner wählt gespeicherte eigene Decks, Match startet.

## Nicht Teil von V1.0.1

- Accounts.
- Cloud-Decks.
- Öffentliche Decklisten.
- Matchmaking.
- Rankings.
- Turnierlegalität.
- Öffentliche Distribution offizieller Assets.
- Vollständige offizielle Deckbuilding-Regeln.
- Neue Karten oder Mechaniken.

## Done-Kriterien

- Eigene gespeicherte Decks sind der zentrale Deckeditor- und Matchstart-Fluss.
- `Speichern`, `Prüfen` und Matchstart-Snapshot sind für Nutzer unterscheidbar.
- Vorgefertigte Decks sind optional/eingeklappt und nehmen nicht dauerhaft den Hauptplatz ein.
- Matchstart kann gespeicherte lokale Decks direkt auswählen und validiert sie zuverlässig.
- Human-vs-Human-Default lässt Host nur eigene Decks wählen.
- Joiner wählt eigene Decks beim Beitritt.
- Match startet erst nach validierten Deckpaaren beider Teilnehmer.
- Testkonstellationsmodus bleibt möglich, aber klar getrennt vom normalen Human-vs-Human-Flow.
- KI-Deckpolitik bleibt vollständig nutzbar und ist in der UI verständlich.
- KI-Random nutzt ein dokumentiertes KI-Deckpool-Modell.
- Hidden-Info- und Replay-/StateHash-Verträge bleiben grün.
- Browser-Smoke mit zwei Fenstern oder zwei Sessions ist bestanden.
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.

## Umsetzungsergebnis 2026-05-04

Umgesetzt:

- Web-Deckbereich ist als `Meine Decks` ausgerichtet.
- Lokale Decks haben einen sichtbaren `Speichern`-Button und Status für ungespeicherte Änderungen, geprüft/gültig und geprüft/nicht matchstartfähig.
- Validierung prüft nur; Matchstart und Join validieren gespeicherte lokale Decks erneut und senden daraus unveränderliche Snapshots.
- Vorlagen liegen in einem eingeklappten Bereich `Vorgefertigte Decks anzeigen`; Auswahl erzeugt ein eigenes gespeichertes Deck.
- Matchstart zeigt gespeicherte lokale Runner-/Corp-Decks direkt in den Deckslots.
- Human-vs-Human-Default erzeugt eine pending Lobby mit Host-Deckpaar; der Joiner wählt beim Beitritt eigene Runner-/Corp-Decks.
- Das Match startet erst nach validiertem Joiner-Deckpaar.
- Testkonstellationen mit Teilnehmer-B-Deckslots bleiben über `Testkonstellation · beide Teilnehmer festlegen` getrennt.
- Human-vs-KI behält `fixed`, `selected` und `seeded_random`; KI-Deckslots sind nur bei `selected` editierbar.
- `data/ai/ai-deck-pool-1.0.1.json` dokumentiert den KI-Random-Pool und schließt private lokale O:NR-Snapshots aus zufälliger KI-Auswahl aus.
- Hidden-Info-Vertrag bleibt erhalten: Decklisten bleiben nur in privaten Snapshots/Engine-Input und erscheinen nicht in PlayerViews, JoinInfo oder öffentlichen Payloads.

Checks:

- `corepack pnpm typecheck`: bestanden.
- `corepack pnpm test`: bestanden, 176 Tests.
- `corepack pnpm lint`: bestanden.
- `corepack pnpm build`: bestanden.
- Browser-Smoke: bestanden für Deck aus Vorlage, Änderung, explizites Speichern, Reload, Auswahl im Matchstart, Human-vs-KI-Start, Host-Lobby, Joiner-Deckauswahl und aktiven Matchstart nach Join-Deck-Handshake.

Bekannte Restpunkte:

- Lokale Deckbibliothek bleibt bewusst browserlokal; kein Account-, Cloud- oder Sync-Modell.
