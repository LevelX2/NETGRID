# Lokale Datei-Deckbibliothek

Stand: 2026-05-07

## Entscheidung

Persönliche, bearbeitbare Decks werden nicht mehr nur im Browser-`localStorage` als primärer Speicher betrachtet. NETGRID speichert eigene Decks über die Web-App in einer lokalen Datei-Deckbibliothek.

## Speicherorte

- Standard Windows: `%APPDATA%\NetGrid\Decks`
- Konfigurierbar: `NETGRID_DECK_LIBRARY_PATH`; `NETRUNNER_DECK_LIBRARY_PATH` bleibt als Legacy-Fallback lesbar.
- Fallback außerhalb Windows: lokaler Benutzer-Datenordner beziehungsweise `~/.netgrid/decks`

Jedes Deck wird als eigene JSON-Datei gespeichert. Der Dateiname basiert auf der lokalen `deckId`.

## Abgrenzung

- Versionierte Vorlagen, Demo-Decks und Standardsnapshots bleiben unter `data/decks/`.
- Match-Snapshots und private Matchdaten bleiben in der Multiplayer-SQLite-Datenbank.
- Die Datei-Deckbibliothek enthält bearbeitbare persönliche Decks, nicht den autoritativen Matchzustand.
- Beim Matchstart validiert NETGRID das gespeicherte Deck erneut und friert daraus einen unveränderlichen Snapshot für das Match ein.

## Migration

Beim Laden der Deckansicht liest NETGRID zuerst die Datei-Deckbibliothek. Wenn sie leer ist und alte Browser-Decks unter `netrunner-v0-6-local-decks` existieren, werden diese einmalig über den neuen `netgrid-v0-6-local-decks`-Kompatibilitätspfad in die Datei-Deckbibliothek übernommen.

## Produktverhalten

- `Speichern` schreibt in die lokale Datei-Deckbibliothek.
- Ungespeicherte Änderungen bleiben sichtbar.
- Ein lokales Deck mit ungespeicherten Änderungen wird vor dem Matchstart blockiert, bis es gespeichert wurde.
- Importierte und kopierte Decks werden ebenfalls in der Datei-Deckbibliothek abgelegt.
