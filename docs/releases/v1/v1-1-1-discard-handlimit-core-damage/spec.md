# Discard, Handlimit und Core Damage 1.1.1 Spec

Stand: 2026-05-07
Status: eingefroren

## Discard-Phasen

Die Engine ergänzt `corp_discard_phase` und `runner_discard_phase` als formale Phasen. `end_turn` aus der Action Phase startet die Discard-Verarbeitung der aktiven Seite. Erst nach abgeschlossenem Discard-Step wird zum nächsten Zug gewechselt.

Timingpoints:

- `corp_discard.select_cards`
- `corp_discard.complete`
- `runner_discard.flatline_check`
- `runner_discard.select_cards`
- `runner_discard.complete`

Wenn keine Karten abgeworfen werden müssen, darf die Engine die Phase innerhalb derselben Action-Auflösung automatisch abschließen. Wenn Karten abgeworfen werden müssen, erzeugt sie eine `PendingChoice` mit `kind: "select_cards"`, `source: "discard_phase"` und exakt gleicher `minSelections`/`maxSelections`.

## Handlimit

Beide Seiten beginnen mit maximaler Handgröße 5. In V1.1.1 gibt es noch keine Korp-Handlimit-Karten und keine allgemeinen Modifier. Runner-Core-Damage reduziert das Runner-Handlimit dauerhaft:

```text
runnerMaxHandSize = 5 - runner.coreDamage
corpMaxHandSize = 5
```

PlayerViews tragen `own.maxHandSize`, `own.coreDamage` für Runner-relevante Statuswerte und gegnerische `maxHandSize`/`coreDamage`-Counts side-sicher.

## Discard-Choice

Discard erfolgt über vorhandene `resolve_choice`-Spieleraktionen. Die Engine validiert:

- offene ChoiceId,
- Side,
- StateVersion,
- genaue Auswahlanzahl,
- Optionsmenge ohne Duplikate,
- Karten liegen weiterhin in HQ bzw. Grip,
- Karten gehören der auswählenden Seite,
- Timingpoint ist der passende Discard-Select-Timingpoint.

Korp-Optionen zeigen der Korp eigene HQ-Karten, Runner sieht keine Korp-Optionen. Runner-Optionen zeigen dem Runner eigene Grip-Karten, Korp sieht keine Runner-Optionen.

## Zone-Moves

Korp-Discard:

- bewegt gewählte HQ-Karten gleichzeitig in Archives,
- setzt sie facedown und unrezzed,
- ist `hidden_info_barrier`,
- öffentliche Payload enthält Count und Discard-Kontext, keine Titel oder DefinitionIds.

Runner-Discard:

- bewegt gewählte Grip-Karten gleichzeitig in den Heap,
- setzt sie faceup/rezzed nach bestehendem Heap-Sichtvertrag,
- ist `hidden_info_barrier`, weil die Auswahlentscheidung private Handinformation enthält,
- öffentliche Payload enthält Count und Discard-Kontext, nicht die vor-Choice-Grip-Liste.

Discard-Events sind keine Trash-Events. Sie verwenden `discardResolved`, `discardSide`, `discardCount` und `discardZone`.

## Core Damage

Core Damage nutzt denselben Grundpfad wie V0.94 Net-/Meat-Damage:

1. Die Quelle erzeugt eine validierte Damage-Anforderung mit `damageType: "core"`.
2. Bei `amount > runner.grip.length` endet das Spiel sofort mit `winner: "corp"` und `gameEndReason: "flatline"` ohne Random-Auswahl.
3. Bei überlebtem Damage wählt die Engine exakt `amount` Grip-Karten ohne Replacement über Seed, RandomCounter und RandomDrawRecords.
4. Die Karten gehen gleichzeitig in den Heap.
5. `runner.coreDamage` steigt um `amount`.
6. Das Runner-Handlimit sinkt dadurch dauerhaft um `amount`.
7. PublicPayloads enthalten Damage-Typ, Menge, Anzahl getrashter Karten, Core-Damage-Count und neues Runner-Handlimit, keine Grip-Liste.

Core Damage kann das Runner-Handlimit unter 0 senken. Das löst keine zusätzliche sofortige Flatline aus, solange der Runner die Damage-Menge selbst überlebt hat.

## Negative-Handlimit-Flatline

Zu Beginn des Runner-Discard-Steps prüft die Engine:

```text
if runnerMaxHandSize < 0:
  winner = "corp"
  gameEndReason = "flatline"
```

Danach findet keine Discard-Choice mehr statt. Diese Regel ist keine Runner-Deckout-Siegbedingung.

## KI

Die KI löst Discard-Choices aus PlayerView und LegalActions. Minimalheuristik:

- Discard-Choices haben Vorrang vor normalen Aktionen.
- Bei `select_cards` mit `source: "discard_phase"` wählt die KI deterministisch die ersten stabil sortierten Optionen bis `maxSelections`.
- Sortierung verwendet nur sichtbare Option-Daten aus der eigenen PlayerView, nicht FullState.

## UI

Die Web UI entfernt statische Handlimitannahmen. `Grip x/y` bzw. `HQ x/y` kommen aus PlayerView. Runner-Core-Damage wird als Statuswert beim Runner gezeigt. Eigene Discard-Choice kann über die vorhandene Choice-/Handauswahl gelöst werden; gegnerische Discard-Choices erscheinen nur als Wartestatus.

## Replay, Undo und Visibility

Core-Damage-Randomness nutzt nur RandomDrawRecords. Discard-Choices sind im Replay deterministisch durch die PlayerAction reproduzierbar. Erfolgreiche Discard- und Damage-Events sind Hidden-Info-Barrieren und blockieren Undo. Reconnect, WebSocket und EventTail dürfen nur side-gefilterte PlayerViews und redigierte PublicEvents ausliefern.

