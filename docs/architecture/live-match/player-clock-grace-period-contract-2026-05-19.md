# Spielerzeit mit Grundfrist

Stand: 2026-05-19
Status: Produkt-, Server- und Engine-Vertrag für optionale private Spielerzeit
Quelle: `docs/architecture/live-match/visible-match-timer-system-concept-2026-05-17.md`, `docs/architecture/live-match/timer-server-sync-contract-2026-05-17.md`

## Zweck

Dieser Vertrag gibt ein optionales Spielerzeitmodell für private Matches frei. Beide Seiten können ein eigenes Zeitkonto erhalten. Jede neue zugewiesene Entscheidung bekommt zuerst eine kostenfreie Grundfrist. Nur die Zeit oberhalb dieser Grundfrist wird vom Zeitkonto der Seite abgezogen, die gerade entscheiden muss. Fällt ein aktiviertes Zeitkonto auf 0, endet die Partie regulär durch Zeitablauf und die Gegenseite gewinnt.

Das Modell ersetzt nicht den bestehenden UI-only-Timer. Es baut auf dessen Server-Snapshot-Idee auf, ergänzt aber erstmals eine regelwirksame Match-Lifecycle-Folge. Diese Folge ist nur aktiv, wenn beim Matchstart ausdrücklich Zeitbegrenzung gewählt wurde.

## Produktentscheidung

Zeitbegrenzung ist opt-in. Der Standard bleibt `none`: keine Spielerzeit, kein Abzug und keine Niederlage durch Zeitablauf.

Erlaubte Modi:

| Modus | Wirkung |
| --- | --- |
| `none` | Keine Spielerzeit. UI darf weiterhin die sichtbare Matchlaufzeit anzeigen. |
| `player_clock` | Runner und Korp starten mit gleichem Zeitkonto und gleicher Grundfrist je Entscheidung. |

Freigegebene Zeitkonto-Presets:

| Label | Wert |
| --- | --- |
| Kurze Testpartie | 5 Minuten je Seite |
| 10 Minuten | 10 Minuten je Seite |
| 15 Minuten | 15 Minuten je Seite |
| 20 Minuten | 20 Minuten je Seite |
| 30 Minuten | 30 Minuten je Seite |
| 45 Minuten | 45 Minuten je Seite |

Benutzerdefinierte Zeit ist im ersten Umsetzungsslice optional. Falls sie umgesetzt wird, gilt:

- Minimum: 1 Minute je Seite.
- Maximum: 120 Minuten je Seite.
- UI-Eingabe nur in ganzen Minuten.
- Server validiert unabhängig von der UI.

Freigegebene Grundfrist-Presets:

| Label | Wert |
| --- | --- |
| Keine Grundfrist | 0 Sekunden |
| 5 Sekunden | 5 Sekunden |
| 10 Sekunden | 10 Sekunden |
| 15 Sekunden | 15 Sekunden |
| 30 Sekunden | 30 Sekunden |

Benutzerdefinierte Grundfrist ist im ersten Umsetzungsslice optional. Falls sie umgesetzt wird, gilt:

- Minimum: 0 Sekunden.
- Maximum: 60 Sekunden.
- UI-Eingabe nur in ganzen Sekunden.
- Server validiert unabhängig von der UI.

## Autoritätsmodell

Die Rules Engine bleibt die einzige Regelautorität für Karten, LegalActions, PlayerActions, Replay und StateHash. Spielerzeit wird im ersten harten Spielerzeit-Slice serverautoritativ im Match-Record geführt, nicht als tickender Wallclock-Wert im deterministischen `GameState`.

Der Server hält:

- Zeitkonfiguration des Matches.
- verbleibende Spielerzeit je Side.
- aktuellen Entscheidungseigner.
- Startzeitpunkt der aktuellen Aktivitätszuweisung.
- bereits abgerechnete belastete Millisekunden für diese Aktivität.
- terminale Zeitablauf-Auflösung, falls eingetreten.

Wallclock-Zeit selbst wird nicht in Engine-Replay oder StateHash replayt. Abgerechnet wird serverseitig an stabilen Beobachtungspunkten:

- vor Annahme einer eingehenden Spieleraktion,
- beim Wechsel des Entscheidungskontexts,
- bei Reconnect-/Snapshot-Erzeugung,
- bei periodischem serverseitigem Deadline-Check.

Wenn Zeitablauf festgestellt wird, beendet der Server das Match über den Match-Lifecycle mit Grund `time_expired`. Das ist kein Karten- oder Engine-Sieg und kein verdeckter Engine-Event. Der letzte echte Engine-StateHash bleibt der letzte durch die Engine erzeugte StateHash vor der Zeitablauf-Auflösung.

## Zeitverbrauch

Zeit läuft nur, wenn eine Seite tatsächlich eine Entscheidung treffen muss. Maßgeblich ist der aktuelle Entscheidungseigner, nicht pauschal die Zugseite.

Zeitbelastete Kontexte:

- normale Korp- und Runner-Action-Phasen,
- Setup- und Mulligan-Entscheidungen,
- Discard-/Handlimit-Choices,
- Rez-/Nicht-Rez-Fenster,
- Trace-/Bid-/Choice-Fenster,
- Access-/Trash-/Steal-/Jack-out-/Continue-/Break-/Pump-Entscheidungen,
- sonstige `LegalActions` oder `pendingChoice`, bei denen genau eine Side eine Entscheidung treffen muss.

Nicht zeitbelastete Kontexte:

- automatische Engine-Effekte ohne Spielerentscheidung,
- reine Animationen, UI-Hinweise, Chronikdarstellung und Kartenanzeigezeiten,
- technische Wartezeit ohne aktuellen Entscheidungseigner,
- Serverbroadcasts, Timer-Snapshots und Reconnect-Token-Rotation,
- bereits beendete Matches.

Bei jeder neuen Aktivitätszuweisung startet die Grundfrist neu. Eine neue Aktivitätszuweisung liegt vor, wenn sich mindestens eines dieser Merkmale ändert:

- entscheidende Side,
- `stateVersion`,
- `timingPoint`,
- PendingChoice-Identität,
- relevanter Run-/Encounter-/Access-Kontext,
- Match-Lifecycle von Lobby zu Spiel oder Spiel zu terminal.

Abzug:

```text
belasteteZeit = max(0, elapsedSinceActivityStart - gracePeriod - alreadyChargedInThisActivity)
remainingTime[decisionOwnerSide] -= belasteteZeit
```

Entscheidungen innerhalb der Grundfrist belasten das Zeitkonto nicht. Entscheidungen nach Ablauf der Grundfrist belasten nur die überschrittene Zeit. Die Abrechnung darf nie negative Zeit gutschreiben.

## Zeitablauf

Zeitablauf darf nur greifen, wenn alle Bedingungen erfüllt sind:

- Modus ist `player_clock`.
- Match ist noch nicht anderweitig beendet.
- Es gibt einen aktuellen Entscheidungseigner.
- Das Zeitkonto dieser Side ist nach Abrechnung bei 0 oder darunter.
- Der Server beobachtet den Ablauf autoritativ.

Folge:

- Verlierer ist die Side mit abgelaufenem Zeitkonto.
- Gewinner ist die Gegenseite.
- Ergebnisgrund ist `time_expired`.
- `GameResultSummary` enthält den terminalen Grund side-sicher.
- Chronik und Ergebnisfenster zeigen, welche Side durch Zeitablauf verloren hat.
- Kein zweites Matchende wird erzeugt, falls die Partie bereits durch Agenda, Flatline, Deckout, Forfeit oder anderes Ende terminal ist.

Der finale Engine-StateHash bleibt der letzte echte Engine-StateHash. Ein zusätzlicher Match-Lifecycle-Record oder ResultSummary darf die Matchmetadaten verändern, aber nicht den Engine-StateHash umdeuten.

## API- und Snapshot-Vertrag

Der bestehende Timer-Snapshot-Vertrag wird additiv erweitert. Für `player_clock` braucht der Umsetzungsslice einen neuen oder versionierten Snapshot, z. B. `timer-snapshot-v2`.

Pflichtfelder:

```ts
export type ApiPlayerClockMode = "none" | "player_clock";

export type ApiPlayerClockConfig = {
  mode: ApiPlayerClockMode;
  startingTimeMs?: number;
  gracePeriodMs?: number;
};

export type ApiPlayerClockSnapshot = {
  schemaVersion: "player-clock-v1";
  mode: ApiPlayerClockMode;
  remainingMs?: { runner: number; corp: number };
  startingTimeMs?: number;
  gracePeriodMs?: number;
  decisionOwnerSide?: Side;
  activityStartedAtMs?: number;
  elapsedActivityMs?: number;
  graceRemainingMs?: number;
  chargeableElapsedMs?: number;
  warningLevel: "none" | "grace" | "charging" | "critical" | "expired";
  expiredSide?: Side;
};
```

`ApiTimerSnapshot` darf den Player-Clock-Snapshot einbetten oder daneben übertragen werden. Die Felder bleiben REST-, WebSocket- und Reconnect-Payloads vorbehalten. Sie sind keine `PublicGameEvent`-Quelle und kein `AIInput`.

Startoptionen müssen in Shared/API-Contracts abgebildet und serverseitig validiert werden. Ungültige Werte werden abgelehnt oder auf serverdefinierte Presets normalisiert; die UI darf nicht allein validieren.

## UI-Vertrag

Der bevorzugte Ort ist ein horizontaler Zeitbalken direkt unter der Statusleiste. Runner- und Korp-Panels dürfen optional kurze Sekundärwerte zeigen, sind aber nicht der primäre Ort.

Der Zeitbalken zeigt:

- beide verbleibenden Zeitkonten,
- die aktuell entscheidende Side,
- Grundfriststatus,
- nach Grundfristablauf den sichtbaren sekundenweisen Abzug,
- kritischen Zustand kurz vor Ablauf,
- terminalen Zeitablauf im Ergebniszustand.

Darstellung:

- Während der Grundfrist normale Darstellung mit erkennbarem Grace-Indikator.
- Nach Grundfristablauf rotes Segment oder roter Hintergrund für die belastete Side.
- Unter 60 Sekunden zusätzlicher kritischer Zustand.
- Bei `mode: "none"` wird kein Spielerzeitbalken gezeigt; die bisherige Matchlaufzeit darf bleiben.
- Mobile und Desktop dürfen keine Überlappung mit Statusleiste, Action Board, Board, Run-Zeitstrahl oder Result Modal erzeugen.

Matchstart:

- Zeitbegrenzung aus/an klar anbieten.
- Presets für Zeitkonto und Grundfrist sichtbar machen.
- Bei ausgeschalteter Zeitbegrenzung die Grundfristauswahl deaktivieren oder ausblenden.

## Chronik und Ergebnis

Chronikmeldungen:

- Beim Start eines Matches mit Spielerzeit: Zeitkonto und Grundfrist protokollieren.
- Bei Zeitablauf: abgelaufene Side und Matchende durch Zeitablauf protokollieren.
- Normale kurze Entscheidungen werden nicht einzeln protokolliert.
- Timer-Ticks erzeugen keine Chronikmeldungen.

ResultSummary:

- `reason: "time_expired"` oder äquivalenter typisierter Ergebnisgrund.
- Gewinner/Verlierer side-sicher.
- Kein Leak von verdeckten Karten, Decklisten, Tokens oder privaten Choices.
- Serienwertung übernimmt ein zeitabgelaufenes Einzelspiel wie ein regulär terminales Einzelspielergebnis nach dem jeweils gültigen Serienvertrag.

## Hidden-Info- und Redaction-Grenzen

Spielerzeit-Payloads dürfen enthalten:

- Modus, Presetwerte, verbleibende Millisekunden je Side,
- aktuelle entscheidende Side,
- grobe Aktivitätsdauer, Grundfriststatus und Warnstufe,
- terminale abgelaufene Side.

Spielerzeit-Payloads dürfen nicht enthalten:

- `sessionToken`, `reconnectToken`, `joinToken`, Account-Tokens oder Token-Hashes,
- Decklisten, Deckhashes, Cloud-Deck-IDs oder private Decksnapshots,
- `FullState`, `cardInstances`, `privatePayload`, Hidden-Zone-Inhalte oder verdeckte Kartentitel,
- private Choice-Optionen, Optionsanzahl, Hidden-Zone-Ziel-IDs oder Such-/Reorder-Details,
- `AIInput`, `AiDecisionInput`, `DecisionDebug`, Belief-State- oder Doctrine-Diagnosedaten,
- Undo-Preview-Daten, lokale Pfade, Runtime-Dumps oder Error-Stacktraces.

Diese Grenzen gelten für REST, WebSocket, Reconnect, Logs, Fehlertexte, Health-/Ops-Diagnostik und spätere Public-/Spectator-Projektionen.

## Replay, StateHash, Undo und Reconnect

Replay:

- Timer-Ticks erscheinen nicht im Engine-Replay.
- Zeitablauf wird als Match-Lifecycle-/Result-Eintrag geführt, nicht als Kartenereignis.
- Public Replay darf den terminalen Grund zeigen, aber keine laufenden privaten Decision-Details rekonstruieren.

StateHash:

- Wallclock-Ticks verändern keinen Engine-StateHash.
- Der finale Engine-StateHash bei `time_expired` ist der letzte echte Engine-StateHash.
- Replay reproduziert diesen Engine-StateHash aus Engine-Aktionen, nicht aus Echtzeit.

Undo:

- Undo darf keine bereits terminale Zeitablauf-Auflösung zurücknehmen, außer ein späterer expliziter Admin-/Debug-Vertrag erlaubt das.
- Undo-Preview enthält keine Timer-internen Rohdaten.
- Timerdaten dürfen aus Undo-Previews keine Hidden-Info ableiten lassen.

Reconnect:

- Reconnect liefert verbleibende Zeit, Entscheidungseigner, Grundfriststatus und Serverzeit konsistent zum Live-Snapshot.
- Beim Reconnect wird die Zeit bis zum Reconnect-Zeitpunkt serverseitig abgerechnet, wenn eine Entscheidung offen war.
- Token-Rotation bleibt getrennt; Timerfelder enthalten nie Roh-Tokens oder Token-Hashes.

Disconnect:

- Im ersten Spielerzeit-Slice läuft die Spielerzeit bei offener Entscheidung weiter, auch wenn der Client getrennt ist.
- Es gibt keine zusätzliche Disconnect-Grace außerhalb der gewählten Grundfrist.
- Eine spätere Abwesenheits-/Pause-Policy braucht ein separates Paket.

## KI-Grenze

Menschliche Spielerzeit ist kein KI-Planungsbudget.

- `AiDecisionInput` erhält keine Spielerzeitfelder.
- `AiDecisionDebug` spiegelt keine menschlichen Deadlines.
- KI-interne Felder wie `timeBudgetMs` und `timeoutUsed` bleiben getrennt.
- Human-vs-KI nutzt denselben Matchtimer nur für die menschliche Produktregel. Eine KI-Aktion darf weiterhin nur aus `LegalActions` kommen; KI gibt nicht wegen menschlicher Timerdaten private Informationen preis.

## Umsetzungshandoff

Der Umsetzungsslice soll folgende Artefakte anfassen:

- `packages/shared/src/api-contracts.ts`: Startoptionen, Result-Grund und Snapshot-Typen.
- `apps/server/src/multiplayer.ts`: serverautoritative Spielerzeit, Aktivitätswechsel, Abrechnung, Zeitablauf, Reconnect.
- `apps/server/src/http-server.ts`: Matchstart-Validierung und Payloads.
- `apps/web/app/match-start.ts` und `apps/web/app/match-start-storage.ts`: Startoptionen und Persistenz.
- `apps/web/app/match-timer-ui.ts`, `apps/web/app/page.tsx`, `apps/web/app/globals.css`: Zeitbalken unter der Statusleiste.
- passende Server-, Shared-/API-, Web- und Visibility-Tests.

Der Umsetzungsslice muss injizierbare Serverzeit oder Fake-Timer nutzen. Tests dürfen nicht von realer Wallclock-Laufzeit abhängen.

## Testmatrix

| ID | Bereich | Erwartung |
| --- | --- | --- |
| PC-T001 | Matchstart Off | `mode: "none"` erzeugt keine Spielerzeit, keinen Abzug und keinen Zeitablauf. |
| PC-T002 | Matchstart Presets | Zeitkonto- und Grundfrist-Presets werden shared/serverseitig validiert. |
| PC-T003 | Custom Bounds | Optionale Custom-Werte respektieren Min-/Max-Grenzen. |
| PC-T004 | Decision Owner | Zeit läuft für `decisionOwnerSide`, nicht pauschal für `activeSide`. |
| PC-T005 | Grace | Entscheidung innerhalb der Grundfrist zieht 0 ms ab. |
| PC-T006 | Charge | Nach Grundfrist wird nur die Überschreitung abgezogen. |
| PC-T007 | Activity Reset | Neue Aktivitätszuweisung startet Grundfrist neu. |
| PC-T008 | Automatic Effects | Automatische Effekte und reine Anzeigezeiten verbrauchen keine Spielerzeit. |
| PC-T009 | Time Expired | Zeitkonto 0 beendet das Match mit Gewinner Gegenseite und `time_expired`. |
| PC-T010 | Already Finished | Bereits terminales Match erhält kein zweites Zeitablauf-Ende. |
| PC-T011 | ResultSummary | ResultSummary und UI zeigen Zeitablauf side-sicher. |
| PC-T012 | Chronicle | Start und Zeitablauf werden protokolliert; normale kurze Entscheidungen und Ticks nicht. |
| PC-T013 | Reconnect | Reconnect zeigt konsistente Restzeit und Grundfrist-/Belastungsstatus. |
| PC-T014 | Redaction | Timerpayloads enthalten keine Hidden Cards, Tokens, Decklisten, FullState, `AIInput` oder `DecisionDebug`. |
| PC-T015 | Replay | Timer-Ticks erscheinen nicht im Engine-Replay. |
| PC-T016 | StateHash | Timer-Ticks ändern `hashState(gameState)` nicht; finaler Engine-StateHash bleibt der letzte echte Hash. |
| PC-T017 | Undo | Undo-Preview leakt keine Timer-Rohdaten und hebt kein terminales Zeitablauf-Ende auf. |
| PC-T018 | UI Desktop | Zeitbalken unter der Statusleiste überlappt keine Status-, Action-, Board- oder Result-Elemente. |
| PC-T019 | UI Mobile | Zeitbalken bleibt auf schmalem Viewport lesbar und ohne Überlappung. |
| PC-T020 | AI Boundary | `AiDecisionInput` und `AiDecisionDebug` bleiben ohne Spielerzeitdaten. |

## Entscheidung

NETGRID führt Spielerzeit mit Grundfrist als optionalen privaten Matchmodus ein. Die harte Folge ist ein serverautoritatives Match-Lifecycle-Ende `time_expired`, nicht ein tickender Engine-State. Die Engine bleibt Regelautorität für Spielaktionen; Replay und StateHash bleiben deterministisch über echte Engine-Schritte. UI und Server dürfen Spielerzeit anzeigen, abrechnen und terminal auswerten, solange alle Redaction-, Reconnect-, Undo-, Replay- und StateHash-Gates erfüllt sind.
