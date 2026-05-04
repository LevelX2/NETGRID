# Setup/Game-End 0.93 Spec

Status: M2-Requirements, nicht implementiert
Stand: 2026-05-03

## Zweck

Diese Spezifikation friert den nächsten Mechanikblock M2 vor. V0.93 implementiert daraus nichts spielbar. Das Dokument dient als sichere Anschlussfläche für spätere Setup-, Mulligan- und Game-End-Arbeit.

## Deterministische Setup-Sequenz

Die spätere M2-Implementierung soll Setup als explizite Engine-Sequenz modellieren:

1. Match-Konfiguration und Baseline festlegen.
2. Runner- und Corp-Decks serverseitig validieren.
3. Identitäten als offene Startkarten instanziieren.
4. Decks mit Seed, RandomCounter und RandomDrawRecords deterministisch mischen.
5. Startressourcen und Clicks setzen.
6. Initial Hands ziehen.
7. Mulligan-Choices erzeugen.
8. Nach Abschluss aller Setup-Choices den ersten Timingpunkt betreten.

## Mulligan

Mulligan wird später als `PendingChoice` umgesetzt:

- je Seite genau eine private Choice,
- Side-Filter in PlayerView,
- Replay mit privater Entscheidung,
- keine Optionsdetails in PublicEvents,
- StateVersion-Revalidierung,
- deterministisches erneutes Mischen/Ziehen.

V0.93 macht keinen Mulligan spielbar und erzeugt keine echte Mulligan-Choice im Matchstart.

## Siegwerte

Für neue Formate gilt 7 Agenda-Punkte als Standardziel. Legacy-Demo-Zielwerte bleiben erlaubt, wenn Baseline und Decks das dokumentieren. Der aktuelle private Match-Server darf daher weiter zwischen Regelmatch mit 7 Punkten und Einzelspiel mit Deckziel unterscheiden.

## Deckout

Corp-Deckout ist bereits als Runner-Sieg bei leerem R&D im Corp-Draw-Pfad vorhanden. M2 soll den Game-End-Vertrag so normalisieren, dass auch Runner-Deckout sauber vorbereitet werden kann. V0.93 aktiviert keine neue Runner-Deckout-Mechanik.

## Flatline

Flatline wird nur als späterer Game-End-Zustand vorbereitet:

- Winner bleibt `corp`.
- Grund wird separat klassifizierbar.
- Damage selbst bleibt gesperrt.
- Hidden-Info-Sicherheit für zufälliges Trashing ist Voraussetzung vor Implementierung.

## Identity Setup

Identitätsfähigkeiten werden als eigene Setup-Ability-Kategorie vorbereitet. Eine spätere Umsetzung darf nur Fähigkeiten aktivieren, die im Setup-Fenster ausdrücklich erlaubt sind. V0.93 macht keine Identitätsfähigkeit spielbar.

## Archives und facedown Review

Vor Archives-Ausbau muss geklärt werden:

- welche Archives-Karten faceup/facedown sind,
- welche Seite welche Information sieht,
- wie Access, Multiaccess und Replay damit umgehen,
- ob PublicEvents nur abstrakte Zusammenfassungen zeigen,
- wann Undo durch Archives-Zugriff blockiert wird.

V0.93 ändert das bestehende Archives-Verhalten nicht.
