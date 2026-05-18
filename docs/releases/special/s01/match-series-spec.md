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

Die private Zwei-Spiel-Serie nutzt die Original-Netrunner-nahe Matchpunktwertung: Jeder Einzelspielsieg gibt dem Gewinner 10 Matchpunkte. Der Verlierer erhält für dieses Einzelspiel so viele Matchpunkte, wie er eigene Agenda-Punkte erzielt hat. Bei einem Einzelspiel-Draw erhalten beide Spieler ihre erzielten Agenda-Punkte als Matchpunkte. Nach den geplanten Serienspielen entscheidet die Summe dieser Matchpunkte über die Serie; gleiche Matchpunkte ergeben ein Serienunentschieden.

Diese Serienwertung ist eine private Produktregel für NETGRID und ist bewusst so geschnitten, dass sie später auch für Serien mit mehr als zwei geplanten Spielen erweitert werden kann. Sie bleibt getrennt von offizieller öffentlicher Turnierlogik und verändert nicht den Engine-Vertrag für einzelne Spiele.

## Einzelspiel-Aufgabe innerhalb einer Serie

Ein `forfeit` in einer privaten Matchserie beendet nur das aktuell laufende Einzelspiel. Die Serie selbst wird dadurch nicht automatisch abgebrochen, solange noch geplante Serienspiele offen sind. Eine komplette Serienaufgabe oder ein Serienabbruch ist ein eigener, separater Vertrag und gehört nicht zur bestehenden `forfeitMatch`-Semantik.

Für ein aufgegebenes Serienspiel gilt derselbe Lifecycle-Vertrag wie bei einem normalen Einzelspiel:

- die aufgebende menschliche Seite ist `loserSide`;
- die Gegenseite ist `winnerSide`;
- `reason` ist `forfeit`;
- `finalEngineStateHash` ist der letzte echte Engine-StateHash vor der Aufgabe;
- das Engine-`GameState.winner` wird nicht künstlich gesetzt;
- Replay und StateHash enthalten nur die bis dahin echten Engine-Ereignisse.

Das aufgegebene Einzelspiel wird trotzdem als Serienergebnis in `series.results` aufgenommen. Der Gewinner erhält für dieses Serienspiel 10 Matchpunkte. Der Verlierer erhält die bis zur Aufgabe tatsächlich erzielten eigenen Agenda-Punkte. Diese Wertung entspricht der normalen Serienwertung für einen Einzelspielsieg und verhindert, dass eine Aufgabe automatisch die gesamte Serie entscheidet.

Nach einer Einzelspiel-Aufgabe bleibt `series-next` verfügbar, wenn:

- die Serie noch nicht alle geplanten Spiele abgeschlossen hat;
- für das nächste Spiel noch kein `nextMatchId` existiert;
- der anfragende Spieler mit gültiger Session authentifiziert ist;
- das aufgegebene Spiel einen side-sicheren terminalen Matchstatus und `series.results`-Eintrag besitzt.

Nach dem letzten geplanten Spiel schließt die Serie auch dann regulär ab, wenn dieses letzte Spiel per `forfeit` endet. Die Serienentscheidung verwendet dieselbe Matchpunkt-Summe wie bei regulär beendeten Einzelspielen.

UI-Texte müssen im Serienkontext zwischen Einzelspiel und Serie trennen:

- `Spiel aufgeben` bedeutet: nur dieses Serienspiel wird aufgegeben.
- Bestätigungstext muss ausdrücklich sagen, dass die Matchserie fortgesetzt werden kann, sofern noch ein Folgespiel offen ist.
- `Matchserie abbrechen` oder `Serie aufgeben` darf nicht als Synonym für `forfeitMatch` verwendet werden.
- Ein späterer kompletter Serienabbruch braucht eigenen Serververtrag, eigene UI-Texte und eigene Tests.

## Folgespiel

Das Folgespiel wird über `POST /api/matches/:matchId/series-next` erstellt.

Voraussetzungen:

- das aktuelle Spiel ist regulär beendet oder im Serienkontext als Einzelspiel aufgegeben,
- es ist eine private Serie,
- es gibt noch kein bereits erzeugtes Folgespiel,
- der anfragende Spieler ist per Session-Token authentifiziert.

Das neue Spiel nutzt dieselben Deck-Snapshots und Matchsettings, aber die Seite des anfragenden Spielers wird gewechselt. Bei Human-vs-Human entsteht ein neuer privater Join-Link für die Gegenseite.

## Sicherheitsgrenzen

- Die Engine entscheidet weiterhin nur das Einzelspielende.
- Einzelspiel-Aufgabe bleibt Match-/Server-Lifecycle und erzeugt keinen Engine-Sieg.
- Serie, Ergebnisgrafik und Audio gehen nicht in Replay oder StateHash ein.
- `GameResultSummary.series` enthält nur Aggregationen und Referenzen, keine Decklisten, Tokens, `cardInstances` oder private Payloads.
- Verdeckte Kartendaten bleiben ausschließlich server-/storage-intern.

## Tests

Die Umsetzung ist über Server-Tests und Visibility-Vertrag abgedeckt:

- Spiel 1 einer Serie endet mit side-sicherem Serienstand.
- Serienergebnisse werden per 10-Punkte-Siegwertung plus Verlierer-Agenda-Punkten entschieden.
- `series-next` erstellt Spiel 2 mit Seitenwechsel.
- Aufgabe in Spiel 1 einer Serie erzeugt ein Einzelspiel-Forfeit-Resultat und hält `series-next` verfügbar.
- Aufgabe im letzten Serienspiel schließt die Serie über die normale Matchpunktwertung ab.
- doppeltes Erstellen des Folgespiels wird abgelehnt.
- UI-Vertrag enthält private Matchserie, Folgespiel-Aktion und keine verbotenen ResultSummary-Felder.
