---
activityId: act-2026-05-17-rio-city-grid-visible-die-roll
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Rio de Janeiro City Grid: Würfelwurf für beide Spieler sichtbar machen

## Ziel

Der Würfelwurf von `Rio de Janeiro City Grid` muss für Runner und Korp als sichtbares Ereignis und in der Chronik nachvollziehbar erscheinen.

## Kontext und Quellen

- Nutzeranforderung vom 2026-05-17: Wurf und Folge, insbesondere `Wurf: 1` und `Run endet`, sollen für beide Spieler sichtbar sein.
- Lokaler Kartenanker: `onr_v1_367_rio-de-janeiro-city-grid`.

## Scope

- Prüfen, ob der Würfelwurf nur intern/chronikalisch passiert oder als UI-Event projiziert wird.
- PublicEvent an beide Spieler senden.
- Anzeige für normale Eventdauer oder Bestätigung sichtbar halten.
- Chronik mit Karte, Wurf, Ergebnis und Folge prüfen/ergänzen.

## Nicht im Scope

- Keine Änderung am deterministischen Zufall, Seed, RandomCounter oder RandomDrawRecords.
- Keine neue allgemeine Würfelanimation, wenn ein bestehender Cue reicht.

## Akzeptanzkriterien

- [ ] Beide Spieler sehen, dass Rio de Janeiro City Grid ausgelöst wurde.
- [ ] Wurfwert und Konsequenz sind sichtbar und bleiben ausreichend lange stehen.
- [ ] Chronik nennt Karte, Wurf, Ergebnis und Run-Folge.
- [ ] Replay/StateHash und RandomDrawRecords bleiben deterministisch.
- [ ] Regression deckt Wurf `1` und einen Nicht-1-Wurf ab.

## Umsetzungshinweise

- Bestehender Chronicle-Test kann ein Anker sein, reicht aber nicht als UI-Sichtbarkeitsnachweis.

## Ergebnisnotiz

Noch offen.
