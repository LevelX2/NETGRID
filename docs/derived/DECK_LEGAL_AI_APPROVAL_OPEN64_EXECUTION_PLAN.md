# Deck-Legal AI Approval Open64 Execution Plan

Stand: 2026-05-10  
Status: ausführbarer Umsetzungsplan für vollständige AI-Freigabe der 64 offenen O:NR-v1-Runtime-Karten

## Ziel

Alle 64 aktuell `human_playable` aber noch nicht `ai_supported` O:NR-v1-Karten werden kontrolliert als KI-spielbar freigegeben.

## Scope und Nicht-Ziele

- Scope:
  - Nur die vorgegebene 64er-Zielmenge.
  - Freigabe nur nach Artefakt-, Test- und Safety-Gate.
  - Keine Karte außerhalb der Zielmenge erhält `ai_supported`.
- Nicht-Ziele:
  - Keine neuen Mechaniken außerhalb bereits umgesetzter Engine-Verträge.
  - Kein Belief-State-/FullState-Scope-Sprung.
  - Keine Public-Plattformfunktionen, keine offiziellen Assets.

## Batchreihenfolge

1. Batch `v171_to_v181` (28 Karten)
   - umfasst alle offenen Karten aus V1.7.1, V1.7.2, V1.8.0, V1.8.1.
2. Batch `legacy_open64` (36 Karten)
   - umfasst alle offenen Altbestände aus V1.2.3, V1.1.2K, V1.0.6K, V1.0.5K.

## Pflichtartefakte je Batch

- AI-Hints unter `data/ai/ai-card-hints-*.json`
- Batch-Manifest unter `data/manifests/deck-legal-ai-approval-*-manifest.json`
- Batch-Szenario-Smokes unter `data/scenarios/ai-deck-legal-*-smokes.json`
- Implementation Review unter `docs/derived/DECK_LEGAL_AI_APPROVAL_*_IMPLEMENTATION_REVIEW.md`

## Freigaberegel je Karte

Eine Zielkarte erhält `ai_supported` nur, wenn:

1. `human_playable`, `deck_legal`, `format_legal` erfüllt sind.
2. Eine spezifische AI-Hint-Zeile mit `aiSupportStatus: "ai_supported"` existiert.
3. Mindestens eine `scenarioRef` auf Batch-Smokes gesetzt ist.
4. Katalog-/AI-/API-/Visibility-Gates ohne Hidden-Info-Leak bestehen.

## Pflicht-Gates

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- plus gezielte Pakettests:
  - `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`
  - `corepack pnpm --filter @netgrid/ai test -- index.test.ts`
  - `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`

## Done

- Alle 64 Zielkarten sind `ai_supported = true`.
- Keine Nicht-Zielkarte wurde neu freigeschaltet.
- Hidden-Info-/DecisionDebug-/Visibility-/Replay-/StateHash-Safety bleibt grün.
- Status- und Review-Artefakte sind aktualisiert.
