---
activityId: act-2026-05-24-proteus-phase-7b-icebreaker-credit-decks
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 7b
blockedBy:
  - act-2026-05-24-proteus-phase-7a-hardware-deck-foundation
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/hardware/cortical-cybermodem.ts
  - packages/engine/src/card-implementations/proteus/runner/hardware/sunburst-cranial-interface.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/index.test.ts
  - packages/shared/src/index.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Proteus Phase 7b"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles CardImplementation coverage"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - rg onr_proteus_134/onr_proteus_151/Cortical Cybermodem/Sunburst Cranial Interface in engine/shared/manifest/release/activity surfaces
  - git diff --check
---

# Proteus Phase 7b: Icebreaker-Credit Decks

## Ziel

`Cortical Cybermodem` und `Sunburst Cranial Interface` mit source-bound Restricted Credits für Icebreaker-/Programmnutzung umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `7b Icebreaker-Credit Decks`.
- `docs/releases/proteus/cybernetics-deck-hardware-contract.md`.
- Existing CardImplementation-Familien für hosted/restricted credits, hardware decks und icebreaker payments.

## Zielkarten

- `onr_proteus_134_cortical-cybermodem` Cortical Cybermodem
- `onr_proteus_151_sunburst-cranial-interface` Sunburst Cranial Interface

## Scope

- Restricted Credits nur für Icebreaker-/Programmnutzung.
- Kostenprojektion in LegalActions und erneute `applyAction`-Revalidierung.
- Start-of-turn-Refresh, source-bound Counter und Sichtbarkeit.
- Sunburst-Noisy-Ausschluss nur, falls er generisch und regelkonform abbildbar ist.

## Nicht im Scope

- Keine allgemeine Payment-UI-Neugestaltung.
- Keine AI-Hints oder Decklegalität.
- Keine Damage-/Prevention-Hardware aus 7c.

## Akzeptanzkriterien

- [x] Beide Zielkarten besitzen eigene CardImplementation-Dateien.
- [x] Zweckgebundene Bits werden LegalAction- und `applyAction`-seitig source-bound revalidiert.
- [x] Noisy-/Icebreaker-/Program-Zahlungseinschränkungen sind generisch und ohne Karten-ID-Branch umgesetzt oder präzise blockiert.
- [x] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [x] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Umgesetzt. `Cortical Cybermodem` und `Sunburst Cranial Interface` nutzen eigene CardImplementation-Dateien mit generischer Deck-Einzigkeit, öffentlichen MU-/Handgrößenmodifiern, source-bound `bit`-Countern, Start-of-turn-Refill und vorhandenen `restrictedHostedCreditSource`-Zweckbindungen. Sunburst verwendet den bestehenden non-noisy Icebreaker-Run-Credit-Pfad.
