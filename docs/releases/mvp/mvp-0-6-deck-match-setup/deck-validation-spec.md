# Deck Validation 0.6 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Datenbasis

Deckvalidierung v2 nutzt:

- V0.5-Katalogstatus,
- `data/decks/deck-format-profiles-0.6.json`,
- `data/decks/deck-templates-0.6.json`,
- `data/decks/deck-snapshots-0.6.json`,
- `data/manifests/deck-validation-manifest-0.6.json`.

## Pflichtprüfungen

- Side ist `runner` oder `corp`.
- Identity existiert.
- Identity passt zur Side.
- Identity ist `playable` und `deck_legal`.
- Jede Karte existiert im Katalog.
- Jede Karte passt zur Side.
- Jede Karte ist `playable` und `deck_legal`.
- Mengen sind positive Ganzzahlen.
- Mengenlimit des Formatprofils wird eingehalten.
- Mindestdeckgröße des Formatprofils wird eingehalten.
- Corp-Deck erreicht Mindest-Agenda-Points.
- Snapshot-Hash ist deterministisch.

## Fehlerregeln

Fehler dürfen Kartennamen und lokale Katalog-IDs nennen, aber keine:

- gegnerischen privaten Decklisten,
- Matchtokens,
- Sessiontokens,
- FullState-Daten,
- lokalen Runtime-Pfade,
- Stacktraces.

## Nicht-spielbare Karten

Karten mit nur `imported`, `validated` oder `catalog_ready` blockieren spielbare Matches.

Regel:

`deck_legal` setzt `playable` voraus. Import oder Kataloganzeige kann diesen Status nicht setzen.
