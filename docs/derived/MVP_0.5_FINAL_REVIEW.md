# MVP 0.5 Final Review

Status: pass  
Stand: 2026-05-03

## Ergebnis

`MVP_0.5_done: true`

`ready_for_MVP_0.6_requirements: true`

MVP 0.5 Card Import und Card Catalog sind requirements-gefroren, implementiert, validiert, gehärtet und dokumentiert.

## Gelieferter Scope

- Lokaler V0.5-Source-Registry-Eintrag für versionierte Demo-/Projektdaten.
- Deterministischer V0.5-Card-Snapshot mit Snapshot-Hash.
- Import-Report, Katalogindex und Statusmanifest.
- Statusmodell mit `imported`, `validated`, `catalog_ready`, `implemented`, `playable`, `deck_legal` und `blocked`.
- Reines TypeScript-Paket `@netrunner/catalog`.
- Read-only Katalog-API unter `/api/cards/catalog`, `/api/cards/catalog/:id` und `/api/cards/status-summary`.
- Funktionale Katalogansicht mit Suche, Filtern, Liste, Detail und Statusanzeige.
- Tests für Snapshot-Validierung, Hash, Index, Suche, Statusinvarianten und Payload-Sicherheit.

## Finale Checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 Package-Tests plus 12 Root-Spec-Tests.
- `corepack pnpm build`: pass.
- Katalog-API-Smoke `GET /api/cards/catalog?status=blocked`: pass.
- Katalog-API-Smoke `GET /api/cards/status-summary`: pass.
- Katalog-Payload-Leak-Scan: pass, keine Match-/Token-/FullState-/Hidden-Info-Felder in API-Antworten.
- Browser-Smoke auf `http://127.0.0.1:3000`: pass, Suche nach `Catalog Preview Resource` zeigt die blockierte nicht spielbare Karte.

## Gate-Bewertung

| Gate | Ergebnis |
|---|---|
| Jede Must-Anforderung hat Test- oder Szenarioabdeckung. | pass |
| Importierte Karten werden nicht automatisch spielbar. | pass |
| Katalog-API leakt keine Hidden Info, Tokens oder Matchdaten. | pass |
| Bestehende MVP-0.1 bis MVP-0.4 Tests bleiben grün. | pass |
| Spielbare Karten bleiben durch Manifest, Resolver, Tests, Visibility, Replay/StateHash und KI-Smoke abgesichert. | pass |
| V0.7-UI-Redesign wurde nicht begonnen. | pass |

## Annahmen

- Die V0.5-Katalog-Fixtures sind lokale fiktive Demo-Daten und dienen nur Status-/UI-Smokes.
- Externe Kartenquellen bleiben ausgeschlossen, bis sie ausdrücklich freigegeben werden.
- `deck_legal` ist in V0.5 nur eine lokale Demo-Freigabe und keine vollständige Format-/Turnierlegalität.

## Bekannte Grenzen

- Der Import liest noch keinen externen Datenbestand.
- Es gibt noch keinen Deckeditor; V0.6 muss Katalogstatus und Deckvalidierung v2 verbinden.
- Die Katalogansicht ist funktional, aber nicht die finale V0.7-Gestaltung.

## Nächster Scope

V0.6 Requirements: Deck Editor und Match Setup Foundation. V0.7 bleibt außerhalb dieses Umsetzungsscopes.
