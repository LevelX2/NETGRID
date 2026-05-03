# MVP 0.5 Requirements

Status: frozen_for_implementation  
Stand: 2026-05-03  
Scope: Card Import und Card Catalog

## Scope-Entscheidung

MVP 0.5 baut eine getrennte Kartenimport- und Katalogschicht. Die Phase erweitert nicht die spielbare Regelbreite und macht keine neuen Karten automatisch spielbar.

Leitsatz:

> Importiert ist nicht spielbar. Spielbar wird eine Karte erst durch Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke.

## Quellen und Annahmen

- V0.5 nutzt zunächst nur lokale, versionierte interne Demo-Daten aus `data/cards/demo-cards.json` und `data/cards/demo-cards-0.4.json`.
- Zwei fiktive lokale Katalog-Fixtures liegen im Snapshot, damit `imported` ohne `playable` und `blocked` ausführbar prüfbar sind.
- Es gibt keine externe Kartenquelle, keine Laufzeitabfrage und keine offiziellen Assets.
- Kartentext ist reine Anzeige- und Kataloginformation. Er ist niemals Parser-Input und erzeugt keine Engine-Fähigkeit.

## Nicht-Ziele

- automatische Regelumsetzung aus Kartentext,
- neue spielbare Karten oder neue Regelmechaniken,
- Deckeditor oder freie Deckvalidierung,
- V0.7-UI-Neugestaltung,
- offizielle Artworks, Logos, Card Frames oder Card Backs,
- externe Kartendatenbank als Laufzeitabhängigkeit,
- öffentliche Plattformfunktionen, Accounts, Matchmaking, Rankings oder Cloud-Sync.

## Must Requirements

| ID | Requirement | Akzeptanzkriterium | Test-/Szenario-Abdeckung |
|---|---|---|---|
| V05-MUST-001 | Import-Spezifikation | `CARD_IMPORT_0.5_SPEC.md` beschreibt Quellen, Snapshot, Normalisierung, Nutzungsgrenzen und Update-Regeln. | T-V05-DOC-001 |
| V05-MUST-002 | Lokales Snapshot-Schema | `card-snapshot-0.5.json` enthält versionierte Katalogkarten mit Pflichtfeldern und parsebarer Struktur. | T-V05-DATA-001 |
| V05-MUST-003 | Deterministische Normalisierung | Derselbe Input erzeugt dieselbe Sortierung, denselben Snapshot-Hash und denselben Katalogindex. | T-V05-DATA-002 |
| V05-MUST-004 | Statusmodell | `imported`, `validated`, `catalog_ready`, `implemented`, `playable`, `deck_legal` und `blocked` sind getrennte Status. | T-V05-STATUS-001 |
| V05-MUST-005 | Manifest-Abgleich | Katalogstatus zeigt, welche Karten importiert, implementiert, spielbar, decklegal oder gesperrt sind. | T-V05-STATUS-002 |
| V05-MUST-006 | Read-only Katalog-API | Katalog-Endpunkte liefern nur Katalogdaten und keine Match-, Token-, FullState- oder Hidden-Info-Daten. | T-V05-API-001 |
| V05-MUST-007 | Funktionaler Katalog-Client | Die Web-UI bietet Suche, Filter, Liste, Detail und Statusanzeige ohne V0.7-Redesign. | T-V05-UI-001 |
| V05-MUST-008 | Kein Auto-Playable | Keine importierte Karte wird allein durch Import für Engine, KI, Deckvalidierung oder Matchstart spielbar. | T-V05-SAFETY-001 |
| V05-MUST-009 | Legacy-Kompatibilität | MVP-0.1 bis MVP-0.4-Demo-Decks, Tests, Visibility, Replay/StateHash und KI-Smokes bleiben grün. | T-V05-REG-001 |
| V05-MUST-010 | Quellen- und Asset-Grenzen | V0.5 nutzt keine offiziellen Assets, keine externen APIs und dokumentiert lokale Quellen. | T-V05-DATA-003 |

## Should Requirements

| ID | Requirement | Akzeptanzkriterium |
|---|---|---|
| V05-SHOULD-001 | Import-Report | `import-report-0.5.json` enthält Counts, Warnungen, Fehler, Snapshot-Hash und Gate-Assertions. |
| V05-SHOULD-002 | Katalogfilter | Filter nach Side, Type, Faction, Set und Status sind im Index vorbereitet. |
| V05-SHOULD-003 | Katalog-Indizes | `catalog-index-0.5.json` enthält deterministische `byId`, Filter und Search-Index-Felder. |
| V05-SHOULD-004 | Nicht-spielbare Anzeige | Mindestens eine importierte, nicht spielbare Karte erscheint im Katalog sichtbar als nicht spielbar. |

## Artefakte

Derived Docs:

- `docs/derived/CARD_IMPORT_0.5_SPEC.md`
- `docs/derived/CARD_CATALOG_0.5_SPEC.md`
- `docs/derived/CARD_STATUS_0.5_SPEC.md`
- `docs/derived/MVP_0.5_TEST_MATRIX.md`
- `docs/derived/MVP_0.5_REQUIREMENTS_REVIEW.md`

Daten:

- `data/card-import/source-registry-0.5.json`
- `data/card-import/card-snapshot-0.5.json`
- `data/card-import/card-snapshot-0.5.hash`
- `data/card-import/import-report-0.5.json`
- `data/card-import/catalog-index-0.5.json`
- `data/manifests/card-catalog-status-0.5.json`

Tests:

- `tests/specs/card-import-0.5-acceptance-tests.todo.md`
- V0.5-Artefaktprüfungen in `tests/specs/phase1-artifacts.test.ts`

## Gate

`ready_for_implementation: true`

Begründung: Der Scope ist lokal, versioniert und ohne externe Abhängigkeit. Die Status-Trennung ist im Snapshot ausführbar abgebildet. Das Gate für Spielbarkeit bleibt unverändert hart: Import allein kann keine Karte in Engine, KI, Deckvalidierung oder Matchstart freigeben.
