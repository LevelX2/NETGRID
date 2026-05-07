# S01 Match Series Spec

Status: implemented_for_S01
Stand: 2026-05-03

## Entscheidung

Die private S01-Matchserie ist eine Hülle über einzelnen Spielen. Ein Spiel bleibt die Engine-Einheit mit eigenem `GameState`, Replay und finalem StateHash. Die Serie speichert nur Metadaten, Ergebnisse und die Referenz auf das nächste Spiel.

## Format

Unterstützt wird zunächst:

- `two_game_side_swap`: zwei private Spiele mit Seitenwechsel nach Spiel 1.

Das Format ist keine öffentliche Turnierlogik, kein Matchmaking und keine Ranking-Funktion.

## Servermodell

Ein Serienmatch nutzt `matchFormat: "two_game_side_swap"` und ergänzt den Matchdatensatz um:

- `seriesId`,
- `status: active | between_games | finished`,
- `gameNumber`,
- `gamesPlanned`,
- stabile Spieler-Slots `player_a` und `player_b`,
- Seitenzuordnung je Spiel,
- Ergebnisliste mit Gewinner, Agenda-Punkten, Abschlusszeit und finalem StateHash,
- optional `previousMatchId` und `nextMatchId`.

Nach Spielende erzeugt der Server eine side-sichere `series`-Zusammenfassung innerhalb von `GameResultSummary`.

## Serienwertung

Die private Zwei-Spiel-Serie wird zuerst nach Spielgewinnen entschieden. Wenn beide Spieler nach den zwei Spielen gleich viele Spielgewinne haben, entscheidet die Summe der side-sicher gespeicherten Agenda-Punkte über die Serie. Sind auch die Agenda-Punkte gleich, endet die private Matchserie unentschieden.

Diese Serienwertung ist eine private Produktregel für NETGRID. Sie bleibt getrennt von offizieller öffentlicher Turnierlogik und verändert nicht den Engine-Vertrag für einzelne Spiele.

## Folgespiel

Das Folgespiel wird über `POST /api/matches/:matchId/series-next` erstellt.

Voraussetzungen:

- das aktuelle Spiel ist beendet,
- es ist eine private Serie,
- es gibt noch kein bereits erzeugtes Folgespiel,
- der anfragende Spieler ist per Session-Token authentifiziert.

Das neue Spiel nutzt dieselben Deck-Snapshots und Matchsettings, aber die Seite des anfragenden Spielers wird gewechselt. Bei Human-vs-Human entsteht ein neuer privater Join-Link für die Gegenseite.

## Sicherheitsgrenzen

- Die Engine entscheidet weiterhin nur das Einzelspielende.
- Serie, Ergebnisgrafik und Audio gehen nicht in Replay oder StateHash ein.
- `GameResultSummary.series` enthält nur Aggregationen und Referenzen, keine Decklisten, Tokens, `cardInstances` oder private Payloads.
- Verdeckte Kartendaten bleiben ausschließlich server-/storage-intern.

## Tests

Die Umsetzung ist über Server-Tests und Visibility-Vertrag abgedeckt:

- Spiel 1 einer Serie endet mit side-sicherem Serienstand.
- Geteilte Spielgewinne werden per Agenda-Punkte-Summe als Serien-Tiebreaker entschieden.
- `series-next` erstellt Spiel 2 mit Seitenwechsel.
- doppeltes Erstellen des Folgespiels wird abgelehnt.
- UI-Vertrag enthält private Matchserie, Folgespiel-Aktion und keine verbotenen ResultSummary-Felder.
