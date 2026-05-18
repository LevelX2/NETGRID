# Deck-Legal AI Approval V1.9.1 bis V1.9.4 Implementation Review

Datum: 2026-05-10

## Ergebnis

Der V1.9.1-bis-V1.9.4-AI-Approval-Slice ist vollständig umgesetzt und verifiziert.

- Alle 16 V1.9.1- bis V1.9.4-Releasekarten (zuvor `human_playable`, noch nicht `ai_supported`) sind jetzt `ai_supported`.
- Keine Karte außerhalb der Zielmenge wurde neu freigeschaltet.

Freigegebene Karten:

- `onr_v1_013_cockroach`
- `onr_v1_034_incubator`
- `onr_v1_030_grubb`
- `onr_v1_076_all-nighter`
- `onr_v1_096_kilroy-was-here`
- `onr_v1_107_romp-through-hq`
- `onr_v1_184_top-runners-conference`
- `onr_v1_188_ai-chief-financial-officer`
- `onr_v1_211_polymer-breakthrough`
- `onr_v1_235_data-naga`
- `onr_v1_207_netwatch-operations-office`
- `onr_v1_213_private-cybernet-police`
- `onr_v1_251_jack-attack`
- `onr_v1_271_tko-2-0`
- `onr_v1_208_on-call-solo-team`
- `onr_v1_217_strike-force-kali`

## Artefakte

- AI-Hints:
  - `data/ai/ai-card-hints-deck-legal-v191-v194.json`
- Manifest:
  - `data/manifests/deck-legal-ai-approval-v191-v194-manifest.json`
- Szenarien:
  - `data/scenarios/ai-deck-legal-v191-v194-smokes.json`

## Runtime- und API-Integration

- `packages/catalog/src/index.ts`
  - neuer Slice-Export `DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS`
  - Aufnahme in `DECK_LEGAL_AI_APPROVED_CARD_ID_SET` (wirksame Runtime-Freigabe)
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `apps/web/app/api/cards/catalog-data.ts`
  - Hint-Merge für V1.9.1 bis V1.9.4 ergänzt

## Tests und Gates

Gezielte Pakettests:

- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/ai test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass
- `corepack pnpm --filter @netgrid/web test -- catalog-data.test.ts`: pass

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

## Vorher/Nachher (V1.9.1-bis-V1.9.4-Zielmenge)

- `human_playable`: 16 -> 16
- `ai_supported`: 0 -> 16
- offene Kandidaten: 16 -> 0
