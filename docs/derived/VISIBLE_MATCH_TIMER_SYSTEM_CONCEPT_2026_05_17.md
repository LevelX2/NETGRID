# Sichtbares Timer-System für Chat und Spiel

Stand: 2026-05-17
Status: Konzept und Release-Schnitt, keine Implementierungsfreigabe für harte Zeitregeln
Zielbereich: Private Matches, spätere V2.x-Plattformfähigkeit

## Ausgangslage

NETGRID braucht eine sichtbare Zeitdarstellung für laufende Partien und perspektivisch für Chat-/Match-Abläufe. Zeit darf dabei nicht still zu einer zweiten Regelautorität werden. Die Rules Engine bleibt einzige Regelautorität; UI, Server, menschliche Spieler und KI reichen nur Aktionen ein, die aus `LegalActions` abgeleitet oder als später explizit definierte Engine-Timeout-Aktion freigegeben sind.

Der sichere Einstieg ist deshalb eine sichtbare Uhr ohne Regelwirkung. Harte Zeitfolgen wie Auto-Pass, Aktionsverlust oder Spielverlust bleiben blockiert, bis Server-Sync, Engine-Timeout-Vertrag, Replay und StateHash gemeinsam spezifiziert sind.

## Timerarten und Priorität

| Timerart | Bewertung | Priorität | Regelwirkung im ersten Slice | Begründung |
| --- | --- | --- | --- | --- |
| Partie/global | Empfehlenswert als sichtbare Laufzeit seit Matchstart | hoch | keine | Einfach verständlich, keine Hidden-Info-Gefahr, hilfreich im Spiel- und Chatbereich. |
| Aktive Seite/Spieler | Empfehlenswert als sichtbare Zeit seit letztem Seiten- oder Entscheidungswechsel | hoch | keine | Gute Orientierung, kann später in Spielerzeit überführt werden. |
| Entscheidungsphase/Pending Choice | Beste Grundlage für spätere harte Timeouts | hoch für Vertrag, nicht für harte Umsetzung | Warnung ja, harte Folge nein | Passt am klarsten zu `LegalActions`, `stateVersion`, aktiver Seite und serverseitiger Revalidierung. |
| Zug | Als sichtbare Zugdauer sinnvoll, als harte Grenze riskant | mittel | keine | NETGRID-Züge enthalten mehrere Action- und Reaktionsfenster; harte Zuglimits könnten legitime Pending Choices falsch treffen. |
| Run | Sichtbar sinnvoll, harte Grenze später nur mit Run-spezifischem Vertrag | mittel | keine | Runs enthalten Rez-, Encounter-, Jack-out-, Access- und Präventionsfenster; harte Auto-Folgen müssen Timingpunkte sauber kennen. |
| Aktion | Als UI-Label eher redundant zur Entscheidungsphase | niedrig bis mittel | keine | Eine einzelne klickbare Action ist nur während eines LegalAction-Fensters relevant. Server sollte nicht Client-Latenz bestrafen. |
| Spieler-Gesamtzeit/Chess Clock | Später optional für kompetitive/private Modi | niedrig für ersten Slice | keine | Braucht Pause-/Reconnect-/Disconnect-Regeln und klare Fairness-Entscheidung. |
| Chat-Cooldown oder Chatfenster | Eigener Plattform-/UGC-Scope, nicht Engine | niedrig | keine Engine-Wirkung | Chat ist kein GameEvent, kein Replay, kein StateHash und kein KI-Signal. Chat-Rate-Limits gehören zum V2.2-Chatvertrag. |

Empfohlene Reihenfolge:

1. UI-only-Uhr: Matchlaufzeit, aktive Seite und Entscheidungsalter anzeigen.
2. Server-Sync-Vertrag: autoritative Zeit-Snapshots für Multiplayer, Reconnect und Warnungen definieren.
3. Harte Engine-Timeouts: nur für eng definierte Entscheidungsfenster, erst nach Vertrag und Tests.

## Autoritätsmodell

### UI-only-Uhr

Die UI darf lokal zwischen Server-Snapshots weiterzählen, aber keine Regelentscheidung daraus ableiten. Die dargestellte Zeit ist Komfort- und Orientierungsinformation. Bei Drift, Reload oder Reconnect wird die Anzeige durch den nächsten serverseitigen Snapshot korrigiert.

Erlaubte UI-Felder:

- Matchlaufzeit seit serverseitigem Matchstart.
- Aktive Seite.
- aktueller grober Bereich wie `setup`, `turn`, `run`, `choice`, `finished`.
- Alter des aktuellen Entscheidungssnapshots.
- optionale Warnstufe aus serverseitiger Konfiguration.

Nicht erlaubt:

- Client entscheidet Timeout.
- Client erzeugt Auto-Pass, Aktionsverlust, Forfeit oder Engine-Action allein anhand lokaler Zeit.
- Timer-Anzeige erweitert `LegalActions`, `PlayerActions`, `AIInput` oder `DecisionDebug`.

### Server-Sync ohne harte Regelwirkung

Der Server ist Autorität für Zeit-Snapshots, weil Multiplayer-Clients unterschiedliche Uhren, Latenzen und Reconnect-Zeitpunkte haben. Der Server sollte monotone Serverzeit verwenden und aus Match-/State-/Decision-Metadaten eine side-sichere Projektion senden.

Ein späterer Sync-Vertrag sollte mindestens enthalten:

- `matchId`, `matchVersion`, `stateVersion`.
- `serverNowMs` oder äquivalente relative Serverzeit für Driftkorrektur.
- `matchStartedAtMs` oder `elapsedMatchMs`.
- `timerScope`: `match`, `side`, `turn`, `run`, `decision`, optional `chat`.
- `activeSide` und `decisionOwnerSide`, falls öffentlich ableitbar.
- `timerStartedAtMs` oder `elapsedScopeMs`.
- `softLimitMs`, `warningThresholdsMs`, `hardLimitMs` nur, wenn für beide Seiten sichtbar oder side-sicher.
- `deadlineId`, sobald harte Fristen später eingeführt werden.

Reconnect muss denselben Snapshot liefern wie Live-WebSocket-Clients. Ein Reconnect darf keine privaten Choices, Kartennamen, Zieloptionen, Decklisten, Token oder Hidden-Zone-Inhalte über Timerfelder rekonstruierbar machen.

### Harte Engine-Timeouts

Harte Zeitfolgen verändern Regeln und brauchen daher einen eigenen Engine-Vertrag. Der Server darf nicht einfach `applyAction` umgehen. Wenn Zeitablauf eine Spielwirkung haben soll, muss die Rules Engine eine explizite, validierte Timeout-Auflösung kennen.

Möglicher Zielvertrag:

- Die Engine erzeugt oder kennt pro timeoutfähigem Entscheidungsfenster eine `timeoutPolicy`.
- Der Server beobachtet die Deadline, reicht aber bei Ablauf eine explizite Timeout-Aktion mit `side`, `stateVersion`, `deadlineId` und Policy ein.
- Die Engine validiert erneut aktive Seite, StateVersion, Timingpunkt, Kostenfreiheit, erlaubte Timeout-Folge und Choice-Kontext.
- Replay speichert die Timeout-Auflösung als deterministischen Event-/Action-Schritt.
- StateHash ändert sich nur durch die angewandte Timeout-Auflösung, nicht durch das bloße Verstreichen von Wall-Clock-Zeit.
- Zufall bleibt unverändert; falls eine Timeout-Folge Zufall bräuchte, muss sie über bestehende Seed-/RandomCounter-/RandomDrawRecords laufen.

Nicht freigegeben:

- harte globale Spielzeit mit automatischem Spielverlust.
- pauschales Auto-End-Turn bei beliebigem offenem Fenster.
- Auto-Auswahl aus mehreren privaten Choices ohne Engine-Policy.
- Timerdaten in `AIInput`, `DecisionDebug`, Public Replay oder Logs ohne Redaction-Gate.

## Warnungen und Limits

Warnungen sind früher zulässig als harte Limits, solange sie keine Regelwirkung haben und side-sicher sind.

| Stufe | Wirkung | Autorität | Anforderungen |
| --- | --- | --- | --- |
| Info | Uhr läuft sichtbar | Server-Snapshot plus lokale UI-Interpolation | keine Engine-Änderung |
| Soft Warning | visuelle/akustische Warnung, optional Chat-/Chronik-Hinweis ohne GameEvent | Server-Konfiguration | side-sicher, abschaltbare Audio-/UI-Darstellung |
| Grace | Anzeige einer Nachlaufphase | Server-Konfiguration | keine Action-Erzeugung |
| Hard Timeout | Engine-Auflösung | Server beobachtet, Engine validiert | eigener Timeout-Vertrag, Replay-/StateHash-Tests |
| Match Loss/Forfeit | Spielende | Engine validiert | nur in explizitem kompetitivem Modus, nicht Default |

Sinnvolle erste Defaults für UI-only-Slices:

- keine Hard Limits.
- Warnschwellen nur als Konfiguration, nicht als Regel.
- lokales Audio optional und nicht Teil von Replay oder StateHash.
- keine Chat-Timebox im Engine-Konzept; Chat-Cooldowns separat behandeln.

## Multiplayer-Sync und Reconnect

Multiplayer-Anforderungen:

- Serverzeit ist führend; Clients korrigieren Drift anhand von Snapshots.
- WebSocket sendet Timer-Snapshots bei Matchstart, StateVersion-Wechsel, Seitenwechsel, Run-Start/-Ende, PendingChoice-Wechsel, Reconnect und periodisch oder auf Anfrage.
- Clients zeigen bei Verbindungsverlust eine eingefrorene oder als unsicher markierte Uhr, aber lösen keine Timeout-Aktion aus.
- Reconnect erhält den aktuellen Timer-Snapshot zusammen mit `playerView`, `legalActions`, `eventTail` und Matchstatus.
- Zuschauer/Public-Replay, falls später vorhanden, bekommen nur public-safe Timerprojektionen.

Disconnect ist keine automatische Spielregel. Ob eine Uhr während Disconnect weiterläuft, pausiert oder Grace erhält, ist eine Produktentscheidung und muss vor harten Limits festgelegt werden. Für private Matches ist der konservative Default: sichtbare Uhr läuft weiter, harte Strafe bleibt aus.

## Hidden-Info-Grenzen

Timer dürfen keine verdeckten Informationen indirekt leaken.

Erlaubte Projektionen:

- welche Seite am Zug oder in einer öffentlich erkennbaren Entscheidung ist.
- grobe Phase wie `Runner entscheidet`, `Korp-Rezfenster`, `Run läuft`.
- Zeit seit letztem öffentlichem oder side-sicherem Zustand.

Verbotene Projektionen:

- private Choice-Anzahl, Kartennamen, versteckte Zielkarten oder Hidden-Zone-Größenänderungen außerhalb bestehender PlayerViews.
- Hinweise wie `Runner wählt Karte aus Grip` für die Korp-Sicht, wenn die konkrete Choice privat ist.
- Timerlabels aus privaten Card-Resolvern, `privatePayload`, FullState oder `cardInstances`.
- Timerdaten in `AIInput`, `DecisionDebug`, Observability-Logs oder Fehlertexten ohne Redaction-Policy.

Wenn eine private Pending Choice existiert, sollte die Gegenseite höchstens einen groben Status sehen, der bereits durch den blockierten Spielfluss ableitbar ist.

## Replay und StateHash

UI-only- und Sync-Timer sind keine Replay-Quelle und gehören nicht in den StateHash. Sie können in Matchmetadaten oder Diagnostics auftauchen, aber nicht als Engine-Event.

Harte Timeout-Auflösungen sind anders zu behandeln:

- Der Zeitablauf selbst ist nicht replaydeterministisch.
- Die angewandte Timeout-Auflösung muss als deterministischer Schritt im Eventlog stehen.
- Replay rekonstruiert die Action-/Eventfolge, nicht die damalige Echtzeitverzögerung.
- StateHash vergleicht den Zustand nach der Timeout-Auflösung.
- PublicEvents dürfen nur die side-sichere Timeout-Wirkung zeigen, nicht private Choice-Daten.

Damit bleibt der StateHash stabil, solange dieselbe Folge aus Spieleraktionen und Engine-Timeout-Auflösungen replayt wird.

## KI

KI-Zeitbudgets und KI-Fallbacks existieren bereits als eigene Sicherheitsklasse und dürfen nicht mit menschlichen Match-Timern vermischt werden. Eine KI darf intern ein Zeitbudget haben; das ist kein sichtbarer Matchtimer, kein menschliches Timeout und kein zusätzlicher Hidden-Info-Kanal.

Wenn eine harte menschliche Timeout-Policy später auch KI-Seiten betrifft, muss die KI weiterhin nur aus `LegalActions` wählen oder eine explizite Engine-Timeout-Auflösung erhalten. Keine KI darf aufgrund sichtbarer Timerdaten private Informationen bekommen.

## Release-Schnitt

### Slice A: UI-only-Uhr

In Scope:

- sichtbare Matchlaufzeit und aktive Entscheidungszeit im Spielbereich.
- optional kompakte Anzeige im Lobby-/Chatbereich.
- lokale Interpolation zwischen serverseitig vorhandenen Match-/State-Daten, falls noch kein neuer Sync-Vertrag existiert.
- keine Regelwirkung.

Out of Scope:

- Server-Deadline-Protokoll.
- Auto-Pass, Aktionsverlust, Forfeit.
- Engine-, Replay-, StateHash- oder KI-Änderungen.

### Slice B: Server-Sync-Vertrag

In Scope:

- API-/WebSocket-/Reconnect-Vertrag für `timerSnapshot`.
- Driftkorrektur und Warnschwellen.
- Redaction- und Hidden-Info-Testmatrix.
- Trennung von Timerdaten zu Chat, Replay, AIInput und DecisionDebug.

Out of Scope:

- harte Engine-Folgen.
- UI-Redesign.

### Slice C: Harte Engine-Timeouts

In Scope:

- Engine-Timeout-Policy für ausgewählte Entscheidungsfenster.
- servergenerierte, enginevalidierte Timeout-Auflösung.
- Replay-/StateHash-/Visibility-/Stale-Action-Tests.
- klare Konfigurationsgrenze für private Matches.

Out of Scope:

- pauschale globale Partiezeit mit Spielverlust.
- Chatmoderation oder Chat-Retention.
- öffentliche Turnierregeln.

## Akzeptanzgates für spätere Umsetzung

Ein späteres Implementierungspaket darf harte Timer erst freigeben, wenn diese Gates grün sind:

1. Timer-Snapshot enthält keine Hidden-Info, Tokens, Deckdaten, FullState, `AIInput` oder `DecisionDebug`.
2. Reconnect zeigt denselben Timerstand wie Live-Clients, ohne private Choice-Details zu leaken.
3. UI-only-Uhr verändert keine `PlayerAction`, `LegalAction`, `GameState`, Replay-Events oder StateHash.
4. Harte Timeout-Auflösung wird durch die Engine validiert und ist stale-action-sicher.
5. Replay reproduziert finalen StateHash nach Timeout-Auflösung.
6. Undo-/Reconnect-/Disconnect-Verhalten ist für harte Fristen explizit entschieden.
7. KI-Zeitbudgets bleiben getrennt von menschlichen Match-Timern.

## Folgeactivities

Angelegt:

1. `act-2026-05-17-timer-ui-only-clock` - sichtbare UI-Uhr ohne Regelwirkung.
2. `act-2026-05-17-timer-server-sync-contract` - Server-/WebSocket-/Reconnect-Vertrag für Timer-Snapshots.
3. `act-2026-05-17-engine-hard-timeout-contract` - Engine-Vertrag für harte Timeout-Auflösungen.

## Entscheidung

NETGRID startet Timer nicht als harte Regelmechanik. Der erste sinnvolle Produktschnitt ist eine sichtbare, side-sichere UI-Uhr. Multiplayer-Sync wird als eigener Serververtrag vorbereitet. Harte Timeouts bleiben blockiert, bis sie als enginevalidierte, replay- und StateHash-stabile Timeout-Auflösungen spezifiziert und getestet sind.
