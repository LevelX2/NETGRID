# Deck Storage 0.6 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Speichertrennung

V0.6 trennt:

- versionierte Template- und Testdecks unter `data/decks/`,
- versionierte Snapshot-Artefakte für Tests und Demo-Matchstart,
- private lokale Deckentwürfe als Runtime-Daten.

Private lokale Deckentwürfe werden nicht versioniert.

## Lokaler Deckspeicher

Empfohlener Runtime-Pfad:

- `data/runtime/decks/local-decks.json`

Dieser Pfad bleibt nicht versioniert.

## JSON-Format

Deckimport/-export nutzt ein kleines lokales JSON-Format:

- `schemaVersion`
- `deckId`
- `deckVersion`
- `name`
- `side`
- `identityCardId`
- `cards`
- `cardPoolSnapshotId`
- `formatProfileId`

## Sicherheitsregeln

- Dateipfade werden nicht aus Decknamen gebaut.
- Ungültiges JSON erzeugt safe errors ohne Stacktrace.
- Unbekannte Felder werden nicht regelrelevant.
- Importierte Decks werden vor Speichern und Matchstart validiert.
- Export enthält keine Sessiontokens, Matchtokens oder gegnerischen Decklisten.
