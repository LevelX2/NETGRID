# Standard-Deck-Kuration 2026-07-18

Status: P01-Freeze

## Ergebnis

Die aktuelle lokale Datei-Deckbibliothek wurde als Quelle der künftigen
Standard-Decks inventarisiert. 40 erkennbare spielerische Benutzerdecks sind
in `data/decks/standard-deck-catalog-1.0.0.json` als unveränderliche
Standardkandidaten übernommen.

Die vollständige Entscheidung liegt in
`data/decks/standard-deck-curation-2026-07-18.json`:

| Quelle | `standard` | `internal_ai` | `test_fixture` | `retire` |
| --- | ---: | ---: | ---: | ---: |
| lokale Datei-Deckbibliothek | 40 | 2 | 10 | 1 |
| bisherige Projekt-Snapshots | 0 | 11 | 10 | 0 |

## Regeln

- Normale Nutzer sehen nur `standard`.
- Explizite KI-Diagnosedecks bleiben `internal_ai`.
- Mit `unused` oder `V1.9.22` gekennzeichnete Labor-/Releasefixtures bleiben
  `test_fixture`.
- Der unfertige Platzhalter `Neues Korp-Deck` wird nicht in den aktiven
  Katalog kopiert und ist `retire`.
- Bestehende Projekt-Snapshots bleiben für KI, Tests und historische
  Formatverträge unverändert erhalten, erscheinen aber künftig nicht mehr als
  allgemeine benutzersichtbare `Projekt-Snapshots`.

## Sicherheits- und Produktgrenze

Der Katalog enthält nur Deckdefinitionen. Er enthält keine lokalen Pfade,
Accountdaten, Tokens, Matchdaten oder Zeitstempel des lokalen Dateisystems.
Standarddecks werden vor Matchstart mit dem aktuellen Formatprofil und
Kartenpool revalidiert. Eine Katalogaufnahme ist keine neue Karten- oder
Mechanikfreigabe.

## Offene Promotion

Interne/testbezogene Decks können später nach eigenem Playtest und
Namensreview zu `standard` promoviert werden. Die erste Umsetzung löscht keine
Quelldatei und ändert keinen KI-Pool.
