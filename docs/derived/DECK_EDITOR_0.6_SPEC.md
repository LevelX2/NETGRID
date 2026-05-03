# Deck Editor 0.6 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Zweck

Der Deckeditor verwaltet lokale Deckentwürfe. Er ist nicht die Regelautorität und startet keine Matches direkt. Matchstart nutzt nur validierte Deck-Snapshots.

## Deckmodell

Ein editierbares Deck enthält mindestens:

- `deckId`
- `deckVersion`
- `name`
- `side`
- `identityCardId`
- `cards`
- `cardPoolSnapshotId`
- `formatProfileId`
- `createdAt`
- `updatedAt`
- `validation`

Ein Karteneintrag enthält:

- `cardId`
- `quantity`

## Funktionen

Pflichtfunktionen:

- neues Deck erstellen,
- Deck speichern,
- Deck laden,
- Deck duplizieren,
- Deck löschen,
- Karte hinzufügen,
- Karte entfernen,
- Menge ändern,
- Deck aus Template erzeugen,
- Deck als JSON exportieren,
- Deck aus JSON importieren.

## UI-Grenze

Die UI bleibt funktional:

- Deckliste,
- Editorfläche,
- Katalogauswahl,
- Validierungsfeedback,
- Import-/Export-Schaltflächen,
- Startblocker bei ungültigem Deck.

V0.6 darf keine V0.7-Board- oder Design-Neugestaltung beginnen.

## Snapshots

Ein Snapshot entsteht aus einem validierten Deckentwurf. Nach Erzeugung ist er unveränderlich. Änderungen am Deckentwurf nach Matchstart ändern den Snapshot nicht.
