# Hidden-Zone-Tools 0.98 Specification

Status: Spezifikation für V0.98b
Stand: 2026-05-04

## Regelbasis

- CR 1.21.2: Look erlaubt einem Spieler eine nicht normalerweise sichtbare Vorderseite zu sehen, ohne sie dem Gegner zu zeigen.
- CR 1.21.3: Reveal zeigt eine Karte allen Spielern und dreht sie nicht automatisch faceup.
- CR 1.21.4: Expose ist Reveal für installierte, unrezzed Karten.
- CR 8.7: Search erlaubt Blick in eine Zone, Found Cards werden nach Kriterien gewählt und Deck-Suchen shufflen danach.
- CR 8.8: Swap tauscht Kartenpositionen nur zwischen legalen Orten.
- CR 10.2 trennt Hidden Information und Open Information.

## Startscope

| Mechanik | V0.98b-Scope |
|---|---|
| Search | Eigene Hidden-Zone-Suche per `select_cards`-Choice; erste Harness bevorzugt Runner-Stack oder Corp-R&D/HQ nur für eigene Side. |
| Reveal | Öffentlicher Informationswechsel für eine definierte Karte; kein automatisches Faceup/Rezzed. |
| Expose | Installierte, unrezzed Corp-Karte wird öffentlich gezeigt. |
| Arrange | Private Reihenfolge-Choice für eine kleine Zone-Teilmenge, zum Beispiel Top 2 Karten. |
| Shuffle | Deterministischer Shuffle nach Search oder eigener Shuffle-Harness über RandomDrawRecords. |
| Swap | Enger Swap zwischen legalen, explizit freigegebenen Positionen; keine Ownership-/Control-Wechsel. |

## Choice-Vertrag

- `PendingChoice.kind = "select_cards"` wird für Search und Arrange genutzt.
- Optionslabels mit Kartentiteln erscheinen nur im PlayerView der berechtigten Side.
- Öffentliche Events für private Choices enthalten nur `redactedKind: "choice"` und keine Optionsliste.
- `applyAction` revalidiert ChoiceId, Side, StateVersion, Optionsmenge und Auswahlanzahl.

## Event- und Undo-Vertrag

- Search, Arrange und private Hidden-Zone-Swap-Schritte sind `hidden_info_barrier`, sobald private Karteninformationen angesehen oder private Reihenfolgen verändert wurden.
- Reveal und Expose sind public Informationswechsel und dürfen nur die freigegebenen Kartendaten zeigen.
- Undo nach Hidden-Zone-Barriere bleibt blockiert.

## Randomness

- Shuffle nutzt `shuffleIds`/RandomDrawRecords mit eindeutigem Purpose.
- Keine Hidden-Zone-Manipulation darf `Math.random` oder nicht aufgezeichnete Randomness nutzen.

## Tests

- V098-T007 Search Own Zone.
- V098-T008 Search Illegal.
- V098-T009 Reveal.
- V098-T010 Expose.
- V098-T011 Arrange.
- V098-T012 Shuffle.
- V098-T013 Swap.
- V098-T014 Undo.
- V098-T015 AI Contract.
- V098-T016 Multiplayer/UI.
- V098-T017 No Scope.
