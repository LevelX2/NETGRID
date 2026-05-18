# Card Catalog 0.5 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Zweck

Der Kartenkatalog zeigt normalisierte Kartendaten und ihren Projektstatus. Er ist read-only und bleibt getrennt von Match-State, Engine-State, Tokens, Sessions und Hidden-Info-Payloads.

## Datenbasis

Aktive Daten:

- Snapshot: `data/card-import/card-snapshot-0.5.json`
- Index: `data/card-import/catalog-index-0.5.json`
- Statusmanifest: `data/manifests/card-catalog-status-0.5.json`

Der Katalog darf keine Engine-Resolver aus Kartentext erzeugen.

## API

Minimale read-only Endpunkte:

- `GET /api/cards/catalog`
- `GET /api/cards/catalog/:id`
- `GET /api/cards/status-summary`

Erlaubte Antwortdaten:

- Katalog-ID, Titel, Side, Type, Subtypes, Faction, Set,
- Anzeige-Text,
- numerische Kartendaten,
- Statuswerte,
- Blockgründe,
- Manifest- und Testreferenzen als öffentliche Projektmetadaten.

Verbotene Antwortdaten:

- `GameState`,
- `cardInstances`,
- `privatePayload`,
- Match-, Session-, Reconnect- oder Join-Tokens,
- vollständige gegnerische Decklisten aus laufenden Matches,
- lokale Runtime-Pfade,
- Stacktraces.

## Filter und Suche

Pflicht für die funktionale UI:

- Textsuche über Titel, Side, Type, Subtypes und Text,
- Filter nach Side,
- Filter nach Type,
- Filter nach Set,
- Filter nach Status.

Sortierung:

1. Side,
2. Type,
3. Titel,
4. `catalogCardId`.

## UI

Die V0.5-UI ist funktional:

- Suchfeld,
- Filter,
- Liste,
- Detailansicht,
- Statusanzeige.

Sie darf bestehende Layouts ergänzen, aber kein V0.7-Redesign beginnen. Keine offiziellen Bilder, Frames oder Card Backs.

## Smoke-Kriterien

- Katalogseite öffnet lokal.
- Suche findet `Simple Run Event`.
- Statusfilter zeigt mindestens eine nicht spielbare Katalogkarte.
- Detailansicht zeigt Kartentext als Anzeigeinformation.
- API-Response enthält keine Hidden-Info- oder Match-Daten.
