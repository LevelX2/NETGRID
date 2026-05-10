# Deck-Legal AI Approval Open64 Implementation Review

Datum: 2026-05-10

## Ergebnis

Die Open64-Freigabe ist vollständig umgesetzt und verifiziert.

- Alle 64 Zielkarten (zuvor `human_playable`, noch nicht `ai_supported`) sind jetzt `ai_supported`.
- Keine Karte außerhalb der Zielmenge wurde neu freigeschaltet.
- Die Freigabe erfolgte in zwei Artefakt-Batches:
  - `deck_legal_ai_approval_v171_to_v181_open64` (28 Karten)
  - `deck_legal_ai_approval_legacy_open64` (36 Karten)

## Artefakte

- Plan:
  - `docs/derived/DECK_LEGAL_AI_APPROVAL_OPEN64_EXECUTION_PLAN.md`
- AI-Hints:
  - `data/ai/ai-card-hints-deck-legal-v171-v181-open64.json`
  - `data/ai/ai-card-hints-deck-legal-legacy-open64.json`
- Manifeste:
  - `data/manifests/deck-legal-ai-approval-v171-v181-open64-manifest.json`
  - `data/manifests/deck-legal-ai-approval-legacy-open64-manifest.json`
- Szenarien:
  - `data/scenarios/ai-deck-legal-v171-v181-open64-smokes.json`
  - `data/scenarios/ai-deck-legal-legacy-open64-smokes.json`

## Runtime- und API-Integration

- `packages/catalog/src/index.ts`
  - neue AI-Approval-Konstanten für beide Open64-Batches
  - Aufnahme in `DECK_LEGAL_AI_APPROVED_CARD_ID_SET` (wirksame Runtime-Freigabe)
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `apps/web/app/api/cards/catalog-data.ts`
  - Hint-Merges für beide Open64-Batches ergänzt

## Tests und Gates

Gezielte Pakettests:

- `corepack pnpm --filter @netgrid/catalog test`: pass
- `corepack pnpm --filter @netgrid/ai test`: pass
- `corepack pnpm --filter @netgrid/engine test`: pass
- `corepack pnpm --filter @netgrid/server test`: pass

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

## Vorher/Nachher (Open64-Zielmenge)

- `human_playable`: 64 -> 64
- `ai_supported`: 0 -> 64
- offene Kandidaten: 64 -> 0

## Vorher/Nachher (Runtime O:NR-v1 gesamt)

- `human_playable`: 112 -> 112
- `ai_supported`: 48 -> 112
- offene Kandidaten: 64 -> 0

