# V1.4.2 Detailed Plan - Belief State und Gegner-Modell

Stand: 2026-05-08
Status: detailgeplant

## Ziel

V1.4.2 ergänzt ein faires, rekonstruierbares KI-Memory für beide Seiten. Die KI darf Annahmen über unbekannte Informationen bilden, aber niemals echten Hidden State erhalten oder behaupten.

## Reihenfolge im Release

1. V1.4.1-Final Review und aktuelle KI-Freigaben lesen.
2. Belief-State-Datenmodell definieren.
3. Eventklassifikation für sichtbare und eigene private Fakten erstellen.
4. Memory-Rekonstruktion aus PlayerView, side-gefilterten Events und Replay-Historie bauen.
5. Gegner-Modelle für Corp und Runner ergänzen.
6. `rnd_access_freshness` als side-sicheren Runner-Memory-Fall aufnehmen.
7. DecisionDebug um Annahmen, Unsicherheit und Invalidierungen erweitern.
8. Undo-, Reconnect- und Replay-Rekonstruktion testen.
9. Hidden-State-Invariance und Redaction-Gates ausführen.
10. Implementation Review und Final Review erstellen.

## Produkt- und Feature-Ziele

- KI-Entscheidungen werden nachvollziehbarer, ohne mehr zu wissen.
- Runner und Corp können aus sichtbarer Historie vorsichtige Erwartungen ableiten.
- DecisionDebug zeigt Fakten, Hypothesen und Unsicherheit getrennt.
- Wiederholte R&D-Runs auf eine Runner-bekannte unveränderte Topkarte werden abgewertet.

## Mechanik-, Karten- und Effektgrenzen

V1.4.2 führt keine neue Spielmechanik und keine neue Kartenfreigabe ein. Das Release nutzt bestehende Events, PlayerViews und Replaydaten nur zur Memory-Rekonstruktion.

Zulässig:

- Eventklassifikation für Install, Rez, Advance, Score, Steal, Access, Trash, Draw, Shuffle, Arrange, Move, Reveal und Expose.
- Hypothesen über unbekannte Remote-Karten oder Serverwerte.
- bekannte Fakten aus eigenen Karten und rechtmäßig gesehenen gegnerischen Karten.

Nicht zulässig:

- echte verdeckte Kartenidentitäten aus Full GameState.
- echte gegnerische Decklisten.
- neue `ai_supported`-Karten.
- neue Resolver oder Ability-Mechaniken.
- Kartentextparser.

## KI-Arbeit

Für Corp:

- RunnerThreatModel.
- RunnerAggressionMemory.
- BreakerAvailabilityEstimate.
- RemoteContestProbability.
- HQPressureEstimate.
- RNDPressureEstimate.

Für Runner:

- CorpPlanEstimate.
- RemoteCardBelief.
- UnrezzedIceRiskModel.
- HQAgendaDensityEstimate.
- RNDValueEstimate.
- CorpCreditReserveInterpretation.
- R&D Access Freshness Memory.

## `R&D access freshness`

Der Runner darf sich merken, dass er eine R&D-Topkarte gesehen hat, wenn:

- der Access regelhaft aus Runner-Sicht stattfand,
- die Karte nicht gestohlen, getrasht, entfernt oder bewegt wurde,
- seitdem kein sichtbares Ereignis die R&D-Toplage plausibel invalidiert.

Ein erneuter sofortiger R&D-Run wird abgewertet, solange die Toplage nicht invalidiert wurde.

Invalidierungen:

- Corp zieht von R&D.
- R&D wird gemischt.
- R&D wird arrangiert oder geswappt.
- Access führt zu Steal, Trash, Remove-from-game oder sonstigem Move.
- ein Effekt verändert R&D-Toplage sichtbar oder side-sicher ableitbar.

## Nicht-Ziele

- Keine Simulation.
- Kein Selfplay-Tuning.
- Keine Replay-Browser-UI.
- Keine Tutorialfunktion.
- Keine öffentlichen Plattformfunktionen.
- Keine LLM-Deutung als Spielzugquelle.

## Erwartete Artefakte nach Umsetzung

- Belief-State-Code oder gleichwertige Module.
- Memory-/Opponent-Model-Profile.
- Belief-State-Szenarien.
- Hidden-State-Invariance-Report.
- `docs/derived/V1_4_2_IMPLEMENTATION_REVIEW.md`.
- `docs/derived/V1_4_2_FINAL_REVIEW.md`.

## Done

- Belief State ist deterministisch aus erlaubter Historie rekonstruierbar.
- DecisionDebug trennt Fakten, Hypothesen und Unsicherheit.
- Gleiche sichtbare Projektionen führen zu gleicher oder erlaubter deterministischer Unsicherheit.
- `rnd_access_freshness` verhindert den dokumentierten Wiederholungsfehler ohne Hidden-Info-Zugriff.
- Keine neue Karte, Mechanik oder Simulation wurde eingeführt.
