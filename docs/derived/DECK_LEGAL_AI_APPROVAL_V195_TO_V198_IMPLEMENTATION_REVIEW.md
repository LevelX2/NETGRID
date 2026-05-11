# Deck-Legal AI Approval V1.9.5 bis V1.9.8 Implementation Review

Datum: 2026-05-11

## Ergebnis

Der Slice `V1.9.5 bis V1.9.8` ist für den AI-gesteuerten Kartensatz vollständig umgesetzt und lokal verifiziert.

- Freigegebene Karten (6):
  - `onr_v1_219_superior-net-barriers`
  - `onr_v1_308_acme-savings-and-loan`
  - `onr_v1_236_data-raven`
  - `onr_v1_001_afreet`
  - `onr_v1_018_dogcatcher`
  - `onr_v1_019_dropp`
- Alle sechs Karten sind jetzt `ai_supported`.
- Keine Karte außerhalb der Zielmenge ist neu freigegeben.

## Artefakte

- AI-Hints: `data/ai/ai-card-hints-deck-legal-v195-v198.json`
- Manifest: `data/manifests/deck-legal-ai-approval-v195-v198-manifest.json`
- Szenarien: `data/scenarios/ai-deck-legal-v195-v198-smokes.json`

## Runtime- und API-Integration

- `packages/catalog/src/index.ts`
  - neuer Slice-Export `DECK_LEGAL_AI_APPROVAL_V195_TO_V198_CARD_IDS`
  - Aufnahme in `DECK_LEGAL_AI_APPROVED_CARD_ID_SET` für wirksame Runtime-Freigabe
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `apps/web/app/api/cards/catalog-data.ts`
  - Hint-Merge für V1.9.5 bis V1.9.8 ergänzt

## Tests und Gates

Gezielte Pakettests:

- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`

Pflicht-Gates:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

## Sicherheits- und Scope-Gates

- Engine-Regelautorität bleibt unverändert.
- KI nutzt weiterhin nur LegalActions, PlayerView, PublicEvents.
- Keine Hidden-Info-Leaks in API/Replay/DecisionDebug.
- Replay/StateHash-Vertrag ist unverändert grün.
- Kein Scope-Drift:
  - keine neuen Mechaniken
  - kein Kartentextparser
  - kein Belief State / keine FullState-Simulation
  - keine offiziellen Assets
  - keine Public-Plattformfunktionen
