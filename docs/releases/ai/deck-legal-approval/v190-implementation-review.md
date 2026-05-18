# Deck-Legal AI Approval V1.9.0 Implementation Review

Datum: 2026-05-10

## Ergebnis

Der V1.9.0-AI-Approval-Slice ist vollständig umgesetzt und verifiziert.

- Alle 5 V1.9.0-Releasekarten (zuvor `human_playable`, noch nicht `ai_supported`) sind jetzt `ai_supported`.
- Keine Karte außerhalb der Zielmenge wurde neu freigeschaltet.

Freigegebene Karten:

- `onr_v1_005_bartmoss-memorial-icebreaker`
- `onr_v1_007_blink`
- `onr_v1_115_terrorist-reprisal`
- `onr_v1_223_banpei`
- `onr_v1_275_vacuum-link`

## Artefakte

- AI-Hints:
  - `data/ai/ai-card-hints-deck-legal-v190.json`
- Manifest:
  - `data/manifests/deck-legal-ai-approval-v190-manifest.json`
- Szenarien:
  - `data/scenarios/ai-deck-legal-v190-smokes.json`

## Runtime- und API-Integration

- `packages/catalog/src/index.ts`
  - neuer Slice-Export `DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS`
  - Aufnahme in `DECK_LEGAL_AI_APPROVED_CARD_ID_SET` (wirksame Runtime-Freigabe)
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `apps/web/app/api/cards/catalog-data.ts`
  - Hint-Merge für V1.9.0 ergänzt

## Tests und Gates

Gezielte Pakettests:

- `corepack pnpm --filter @netgrid/catalog test`: pass
- `corepack pnpm --filter @netgrid/ai test`: pass
- `corepack pnpm --filter @netgrid/server test`: pass
- `corepack pnpm --filter @netgrid/web test`: pass

Pflicht-Gates:

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass (mit bekannter nicht-blockierender Turbopack-NFT-Warnung)

## Sicherheits- und Scope-Gates

- Rules Engine bleibt einzige Regelautorität: unverändert.
- KI nutzt weiterhin nur LegalActions/PlayerView/PublicEvents: unverändert.
- Hidden-Info-/DecisionDebug-/Visibility-Barrieren: grün.
- Replay/StateHash-Vertrag: grün.
- Kein Scope-Drift:
  - keine neuen Mechaniken
  - kein Kartentextparser
  - kein Belief State / keine FullState-Simulation
  - keine offiziellen Assets
  - keine Public-Plattformfunktionen

## Vorher/Nachher (V1.9.0-Zielmenge)

- `human_playable`: 5 -> 5
- `ai_supported`: 0 -> 5
- offene Kandidaten: 5 -> 0

## Vorher/Nachher (Runtime O:NR-v1 gesamt)

- `human_playable`: 117 -> 117
- `ai_supported`: 112 -> 117
- offene Kandidaten: 5 -> 0
