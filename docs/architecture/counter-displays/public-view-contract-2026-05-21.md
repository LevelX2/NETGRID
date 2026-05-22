# CounterDisplay PublicView Contract

## Zweck

`counterDisplays` sind eine additive Anzeigeprojektion im viewer-spezifischen `PlayerView`. Sie geben Web-UI, Reconnect-Payloads und späteren Anzeige-Clients eine side-sichere Semantik für Counter-Badges, ohne `GameState`, Rules Engine, LegalActions oder KI-Entscheidungen zu ersetzen.

## Minimaler Typvertrag

Der erste Schnitt verwendet diesen semantischen Vertrag:

- `id`: stabile, deterministische Display-ID innerhalb der sichtbaren Karte, zum Beispiel `advancement` oder `stored_credits`.
- `amount`: nicht negativer ganzzahliger Anzeigenwert.
- `displayKind`: enges Anzeigeformat wie `advancement`, `stored_credits`, `recurring_credit`, `virus`, `trace`, `generic_counter`.
- `label`: kurzer sichtbarer Badge-Text.
- `ariaLabel`: vollständiger zugänglicher Anzeigenname.
- `counterType` optional: ursprünglicher technischer `CounterType`, wenn die Anzeige direkt aus einem Rohcounter stammt.
- `usageHint` optional: reiner Anzeigehinweis, zum Beispiel `spendable`, `refreshing`, `score_modifier` oder `status_marker`.

Kein `visibility`-Feld wird an die UI gegeben. Sichtbarkeit wird vollständig durch die Engine-/PublicView-Projection entschieden.

## Schichtgrenzen

- `counterDisplays` entstehen nur in der Engine-Projection für `PlayerView` und öffentliche sichtbare Karten.
- `counterDisplays` werden nicht im `GameState`, in CardInstances, Event-Log-Snapshots oder StateHash-Eingaben gespeichert.
- `hashState`, deterministisches Replay, LegalAction-Erzeugung und `applyAction` dürfen keine Anzeigeprojektion lesen.
- `VisibleCard.counters` bleibt zunächst als kompatibler Rohwert erhalten, ist aber nicht die Quelle für neue UI-Semantik.
- Web-UI darf Counter-Badges aus `counterDisplays` rendern, aber keine Legalität, Kosten, Choices oder KI-Entscheidungen daraus ableiten.
- Server, Multiplayer, KI und Reconnect dürfen `counterDisplays` weiterreichen, aber nicht als Regelautorität interpretieren.

## Hidden-Info-Regeln

- Für bekannte eigene Karten und öffentlich bekannte installierte Karten darf die Projection semantische Labels aus Kartenidentität und sichtbaren Countern bilden.
- Für verdeckte Korp-Karten sind `counterDisplays` grundsätzlich verboten, außer für regelhaft öffentliche Advancement-Counter.
- Der Advancement-Sonderfall auf verdeckten Korp-Root-Karten darf nur generische öffentliche Informationen enthalten: stabile ID, Betrag und generische Advancement-Beschriftung. Keine Definition-ID, kein Kartentitel, kein kartenindividuelles Label und kein sonstiges Counterdetail dürfen entstehen.
- Hidden Runner Resources, verdeckte HQ/R&D/Archives-Karten, verdeckte Remotes ohne öffentliche Counter und private Choice-Optionen erhalten keine semantischen CounterDisplays.

## Sortierung und Duplikate

Die Projection sortiert deterministisch nach fachlicher Priorität, danach nach `id`:

1. Advancement.
2. Gespeicherte Credits/Bits.
3. Recurring Credits.
4. Virus-/Trace-/Status-Counter.
5. Generische Counter.

Pro Karte darf je fachlicher Counterfamilie höchstens ein Display entstehen. Wenn mehrere technische Countertypen dieselbe fachliche Anzeige speisen, entscheidet der Projektor eindeutig und dokumentiert die Zusammenführung im Code oder Test.

## Folgepaket-Grenzen

Das erste Implementierungspaket soll `CounterDisplay` und `VisibleCard.counterDisplays` additiv einführen und Advancement als Referenzfamilie projizieren. Spätere Pakete migrieren gespeicherte Credits, Recurring Credits, Spezialcounter und Web-Rendering schrittweise. Alte Web-Helfer werden erst entfernt, wenn Tests belegen, dass die relevante Familie vollständig aus `counterDisplays` gerendert wird.
