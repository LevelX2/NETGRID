# Trace/Link/Bidding 0.96 Spec

Status: Spezifikation für V0.96-Implementierung
Stand: 2026-05-04

## Regelkern

Ein Trace ist ein offener Vergleich zwischen Corp-Trace-Strength und Runner-Link-Strength. Die Corp beginnt mit einer Basis-Trace-Strength der Quelle und darf zuerst beliebig viele bezahlbare Credits ausgeben. Danach darf der Runner beliebig viele bezahlbare Credits ausgeben. Runner-Link-Strength ist Runner-Link plus Runner-Bid. Der Trace ist erfolgreich, wenn die Trace-Strength die Runner-Link-Strength übersteigt; bei Gleichstand oder höherem Runner-Wert schlägt der Trace fehl.

## Shared Contract

- `SubroutineType` erhält eine Trace-Subroutine für den V0.96-Harness.
- `TraceState` hält Trace-ID, Quelle, Base-Trace-Strength, Status, Bids, Runner-Link und begrenzten Erfolgseffekt.
- `RunState` darf resolved Subroutines side-sicher markieren, damit eine Trace-Subroutine nach Abschluss nicht erneut ausgelöst wird.
- `CardDefinition` darf einen öffentlichen `baseLink`-Wert für Runner-Identities tragen.
- `ChoiceKind` nutzt den vorhandenen Wert `bid_amount`.
- `PendingChoice` bleibt side-gefiltert; nur die zuständige Seite erhält die aktuelle Choice in der PlayerView.

## Trace-Start

Ein Trace-Start ist legal, wenn:

- die auslösende Karte manifestiert und als `playable_mvp` freigegeben ist,
- die Quelle in einem legalen Timingfenster resolvt,
- kein anderer Trace und keine andere Choice offen ist,
- der Trace eine nicht negative Base-Trace-Strength hat,
- der Erfolgseffekt in V0.96 exakt `add_tag` ist.

Nach Trace-Start:

- `state.trace` wird angelegt,
- die Corp erhält eine `PendingChoice` mit Optionen von 0 bis zu ihren aktuellen Credits,
- die Choice ist öffentlich klassifiziert, wird aber nur der Corp als zu beantwortende Choice angezeigt,
- der Run bleibt im Encounter-Fenster pausiert, bis der Trace abgeschlossen ist.

## Corp-Bid

Corp-Bid ist legal, wenn:

- aktive Choice der Corp gehört,
- ChoiceId und StateVersion passen,
- Trace-Status `corp_bid` ist,
- genau eine legale Bid-Option ausgewählt wurde,
- der Bid eine ganze Zahl größer/gleich 0 ist,
- die Corp genügend Credits hat.

Effekt:

- Corp zahlt den gewählten Bid,
- Trace-Strength wird als `baseTraceStrength + corpBid` festgehalten,
- Runner-Link wird deterministisch berechnet,
- Runner erhält eine `PendingChoice` mit Optionen von 0 bis zu den aktuellen Runner-Credits,
- PublicEvent enthält Trace-ID, Corp-Bid, Base-Trace-Strength und resultierende Trace-Strength.

## Runner-Bid und Ergebnis

Runner-Bid ist legal, wenn:

- aktive Choice dem Runner gehört,
- ChoiceId und StateVersion passen,
- Trace-Status `runner_bid` ist,
- genau eine legale Bid-Option ausgewählt wurde,
- der Bid eine ganze Zahl größer/gleich 0 ist,
- der Runner genügend Credits hat.

Effekt:

- Runner zahlt den gewählten Bid,
- Runner-Strength wird als `runnerLink + runnerBid` berechnet,
- Trace-Erfolg ist `traceStrength > runnerStrength`,
- bei Erfolg erhält der Runner exakt 1 Tag,
- bei Fehlschlag passiert in V0.96 kein weiterer Effekt,
- `state.trace` und `pendingChoice` werden geschlossen,
- die Trace-Subroutine gilt für diesen Encounter als resolved,
- der Runner erhält wieder das Encounter-Fenster, kann also den Run fortsetzen.

## Visibility-Vertrag

Trace-Daten sind public, soweit sie aus offener Karte, offenen Bids, öffentlichen Credits, Link-Wert und Tag-Zahl bestehen. PublicEvents dürfen enthalten:

- Trace-ID,
- Quelle als öffentliche Karten-ID, wenn die Quelle bereits öffentlich ist,
- Base-Trace-Strength,
- Corp-Bid,
- Trace-Strength,
- Runner-Link,
- Runner-Bid,
- Runner-Strength,
- Trace-Ergebnis,
- hinzugefügte Tags.

Nicht erlaubt sind verdeckte Kartentitel, verdeckte Instance-IDs, Hand-/Decklisten, HQ-/R&D-Listen, verdeckte Archives-Karten, private Choice-Rohdaten der falschen Seite, FullState, Replay-privatePayloads in öffentlichen Kanälen oder diagnostische Payloads mit Hidden-Zone-Inhalten.

## Replay und StateHash

Trace verwendet keine Randomness. Die einzige variable Eingabe sind die legal ausgewählten Bid-Optionen aus `PlayerAction.selectedChoices`. EventLog, Replay und StateHash müssen bei identischem Seed, Decksnapshot und Action-Stream identisch bleiben.

## AI-Vertrag

AI darf Trace-Bids nur aus ihrer PlayerView, aktuellen LegalActions und sichtbaren Credit-/Trace-Daten wählen. Difficulty darf die Höhe des Bids beeinflussen, aber keinen Zugriff auf verdeckte gegnerische Karten, FullState oder nicht öffentliche Diagnosen erhalten.

## Multiplayer-Vertrag

Der Server muss offene Trace-Choices über Submit, idempotente Wiederholung, WebSocket, Reconnect und Undo side-sicher behandeln:

- nur die zuständige Seite sieht die aktuelle `pendingChoice`,
- öffentliche Trace-Bid-Events dürfen an beide Seiten,
- idempotente Wiederholung liefert dasselbe Ergebnis,
- Reconnect zeigt die aktuelle Choice nur der zuständigen Seite,
- Undo wird nicht durch Trace-Bids selbst blockiert.

## No-Scope-Grenzen

Nicht in V0.96:

- Trace-Damage,
- Trace-Resource-Trash,
- Trace mit Prevention/Avoid/Interrupt/Replacement,
- vollständige Trace-Modifier-Engine,
- Identity-Abilities außer Base Link 0,
- Multiaccess, Jack-out oder Breach-Ausbau,
- Search, Reveal, Expose, Arrange, Shuffle,
- Hosting, Virus, Purge, Recurring Credits, Bad Publicity,
- offizielle Karten oder externe Kartendatenbank-Abhängigkeiten.
