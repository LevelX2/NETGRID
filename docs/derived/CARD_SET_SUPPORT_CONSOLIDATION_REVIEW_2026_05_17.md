# Karten- und Supportdaten-Konsolidierung 2026-05-17

## Ergebnis

Die aktive Karten-Datenautorität ist auf setbasierte Dateien umgestellt.

Aktive Kartendaten:

- `data/cards/testset-cards.json`
- `data/cards/originalset-v1-cards.json`
- `data/cards/proteus-cards.json`

Aktive Supportdaten:

- `data/manifests/testset-card-support.json`
- `data/manifests/originalset-v1-card-support.json`
- `data/manifests/proteus-card-support.json`

Die alten Release-, AI-Approval-, Catalog-Status-, Card-Support- und Deckvalidation-Manifeste liegen unter `data/manifests/archive/legacy-card-gates/` und werden von aktivem Code, aktiven Tests und Scripts nicht mehr referenziert.

## Umsetzung

- `packages/catalog/src/card-set-loader.ts` lädt die neuen Set- und Supportdateien, validiert Set- und Statusinvarianten und erzeugt Runtimekarten, Supportgruppen, AI-Supportlisten und Evidence-Projektionen.
- `packages/catalog/src/index.ts` erzeugt den Runtime-Snapshot aus dem neuen Loader statt aus historischen Gate-Batches.
- `packages/catalog/src/catalog-pipeline.ts` enthält die historischen Card-Pipeline-v1.3.1-Helfer. `packages/catalog/src/index.ts` bleibt der öffentliche Paket-Einstieg, enthält aber keine alten Gate-/Batch-/lokalen Snapshot-Imports mehr.
- `scripts/check-ai-approval-consistency.mjs` prüft `*-card-support.json`, `data/ai/ai-card-hints-active.json` und `data/scenarios/*.json`.
- Root- und Package-Tests prüfen setorientierte Invarianten statt historischer Manifest- oder Approval-Batch-Namen.
- `data/scenarios/card-support-ai-supported-current.json` ist das aktive maschinenlesbare AI-Support-Szenario für alle `ai_supported`-Karten.

## Statuswerte

Die funktionalen Statuswerte bleiben als aktive Supportwahrheit erhalten:

- `human_playable`
- `deck_legal`
- `format_legal`
- `ai_supported`

`blocked` bleibt für Proteus und andere nicht freigegebene Karten ein hartes Sperrsignal. Blockierte Karten sind nicht decklegal, nicht formatlegal und nicht AI-supported.

## Sicherheit

Die neuen Supportdateien enthalten keine Hidden-Info-, Token-, FullState-, Decklisten- oder lokalen Pfad-Daten. Private lokale O:NR-Quellen wurden nur zur Konsolidierung neutraler, bereits akzeptierter Kartendaten genutzt; lokale Pfade und Assetdaten wurden nicht übernommen.

## Verifikation

Grün am 2026-05-17:

- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/catalog typecheck`
- `corepack pnpm --filter @netgrid/decks test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`
- `node scripts/check-ai-approval-consistency.mjs`
- JSON-Validation für `data/**/*.json`
- Hidden-Info-/Token-/FullState-/Decklisten-/lokaler-Pfad-Scan für die neuen Supportdateien
- Aktiver Referenzscan: keine alten Manifestmuster in `packages`, `apps`, `tests` oder `scripts`
- Fokusreview der Set-Rechte: `testset` 38/38 Supporteinträge mit 36 `ai_supported`; `originalset-v1` 374/374 Supporteinträge mit 374 `ai_supported`; `proteus` 154/154 Supporteinträge, 153 `blocked`, 0 `deck_legal`, 0 `format_legal`, 0 `ai_supported`.

Der finale Build nach dem Import-Cleanup lief ohne die vorherige Turbopack-NFT-Warnung.
