# Card Import 0.5 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Zweck

Card Import 0.5 übernimmt lokale, freigegebene Demo-Kartendaten in einen versionierten Snapshot. Der Import ist eine Daten- und Katalogfunktion, keine Rules-Engine-Funktion.

## Quellen

Aktive Quellen stehen in `data/card-import/source-registry-0.5.json`.

Zugelassen:

- `data/cards/demo-cards.json`
- `data/cards/demo-cards-0.4.json`
- fiktive lokale Katalog-Fixtures innerhalb des V0.5-Snapshots

Ausgeschlossen:

- externe Karten-APIs,
- offizielle Artworks, Logos, Card Frames oder Card Backs,
- Laufzeitabfragen gegen externe Kartendatenbanken,
- Kartentext als Regelparser.

## Snapshot

Der V0.5-Snapshot liegt in `data/card-import/card-snapshot-0.5.json`.

Pflichtfelder pro Karte:

- `catalogCardId`
- `sourceCardId`
- `engineCardId`
- `title`
- `side`
- `type`
- `subtypes`
- `faction`
- `setId`
- `collectorNumber`
- `text`
- `displayOnlyText`
- `numeric`
- `statuses`
- `blockReasons`
- `implementationManifest`

`displayOnlyText: true` ist verbindlich. Der Text darf angezeigt und durchsucht werden, aber keine Engine-Fähigkeiten erzeugen.

## Normalisierung

Die Normalisierung ist deterministisch:

- Karten werden nach `catalogCardId` sortiert.
- fehlende optionale Listen werden zu `[]`,
- fehlende numerische Felder werden zu `null`,
- Suchtext wird später aus normalisierten Anzeige- und Metadatenfeldern erzeugt,
- Asset-Felder werden nicht importiert,
- der Snapshot-Hash wird über kanonisches JSON mit FNV-1a gebildet.

Hash-Datei:

- `data/card-import/card-snapshot-0.5.hash`

## Import-Report

`data/card-import/import-report-0.5.json` dokumentiert:

- verwendete Quellen,
- Anzahl importierter, validierter, katalogbereiter, implementierter, spielbarer, decklegaler und blockierter Karten,
- Warnungen und Fehler,
- Snapshot-Hash,
- Gate-Assertions zu Assets, Laufzeitabfragen, Kartentext und Auto-Playable.

## Update-Regeln

Ein Update des Snapshots ist nur zulässig, wenn:

- die Quelle im Source Registry steht,
- die Änderung versioniert und reviewbar ist,
- der Import-Report neu erzeugt wird,
- der Snapshot-Hash aktualisiert wird,
- Import-only-Karten nicht automatisch `implemented`, `playable` oder `deck_legal` werden.

## Sicherheitsregeln

- Importcode darf keine Skripte aus Kartentext ausführen.
- Katalogtext wird als Text gerendert, nicht als HTML.
- Lokale Pfade, Secrets, Tokens und Runtime-Daten erscheinen nicht in Reports oder API-Fehlern.
- `deck_legal` darf nur gesetzt sein, wenn `playable` gesetzt ist.
