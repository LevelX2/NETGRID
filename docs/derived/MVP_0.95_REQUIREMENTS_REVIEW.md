# MVP 0.95 Requirements Review

Status: bestanden
Stand: 2026-05-04

## Ergebnis

`requirements_review_passed: true`

`ready_for_MVP_0.95_implementation: true`

Die V0.95-Anforderungen sind aus V0.94, der Mechanik-Coverage, dem V0.95-Detailplan und dem CR-v26.03-Abgleich abgeleitet. Der Scope ist testbar und eng genug fuer die Implementierung von Resources und tag-basiertem Resource-Trash.

## Reviewpunkte

- Alle Must-Anforderungen aus `MVP_0.95_REQUIREMENTS.md` sind in `MVP_0.95_TEST_MATRIX.md` abgedeckt.
- Resource-Install nutzt oeffentliche installierte Runner-Karten und darf keine Grip-/Stack-Informationen leaken.
- Resource-Trash ist auf die CR-Basic-Action beschraenkt: Corp, getaggter Runner, 1 Klick, 2 Credits, installiertes Resource-Ziel.
- `applyAction` muss alle Kosten, Ziele, Tags, Side, Timing und StateVersion erneut validieren.
- Resource-Trash ist selbst keine Hidden-Info-Barriere; bestehende Hidden-Info-Barrieren bleiben fuer Undo unveraendert relevant.
- Eine lokale Resource-Testkarte bleibt manifest- und testgegated und darf keine offizielle Karte oder externe Kartendaten nutzen.
- No-Scope-Guards schliessen Trace, Link/Bidding, Prevention, Hosting, Viren, Counterfamilien, Multiaccess, Identity-Abilities und Mulligan aus.

## Fachliche Entscheidungen

| Thema | Entscheidung |
|---|---|
| Resource-Status | V0.95 implementiert nur faceup installierte, aktive Runner-Resources. |
| Resource-Limit | Kein Limit fuer installierte Resources. |
| Corp-Basic-Action | Nur bei getaggtem Runner; Kosten 1 Klick und 2 Credits; Ziel ist eine installierte Runner-Resource. |
| Sichtbarkeit | Installierte Resources sind oeffentliche Boardkarten; Handherkunft bleibt redigiert. |
| Undo | Resource-Trash blockiert Undo nicht selbst, weil er nur oeffentliche Boardinformationen nutzt. |
| Testkarte | Eine lokale/fiktive Resource darf genutzt werden, wenn Manifest und alle Pflicht-Smokes vorhanden sind. |

## Offene Punkte für Implementation Review

- Der konkrete State-Zuschnitt fuer Runner-Resources muss dokumentiert werden, insbesondere ob bestehende Rig-Listen erweitert oder eine neue Resource-Liste eingefuehrt wird.
- Wenn eine lokale Resource-Karte spielbar wird, muessen Card-/Deck-/Manifest-Artefakte und Szenario-Fixtures im selben V0.95-Gate entstehen.
- Falls StateHash sich durch Resource-Zonen oder neue State-Felder aendert, ist die Schemaaenderung im Implementation Review zu begruenden und Replay muss gruen bleiben.

## Gate

V0.95 ist zur Implementierung freigegeben, solange keine Trace-, Link-, Bidding-, Prevention-, Hosting-, Virus-, Counter-, Multiaccess-, Identity- oder Mulligan-Mechanik mitfreigeschaltet wird.
