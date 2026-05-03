# MVP 0.4 Implementation Review

Status: passed  
Stand: 2026-05-03

## Implementierter Scope

- Versionierte V0.4-Datenartefakte für Baseline, Karten, Decks, Manifest, Deviations und Szenarien.
- Neue interne fiktive Karten: Draw Event, Setup Hardware, Efficient Fracter, Priority Agenda, Draw Operation, Taxing Barrier ICE, Simple Upgrade, Tag ICE und Tag Punishment Operation.
- Explicit Deck Selection für Legacy- und V0.4-Demo-Decks.
- V0.4-Baseline-Inferenz, wenn 0.4-Decks verwendet werden.
- Runner-Hardware mit Memory-Limit-Erhöhung.
- Corp-Upgrades als einfache Root-Karten: verdeckt installierbar, rezzbar, access-/trashbar.
- Tags durch ICE-Subroutine `give_runner_tag`.
- Runner-Grundaktion `remove_tag` mit 1 Click und 2 Credits.
- Tag-Punishment-Operation nur bei getaggtem Runner.
- Eingeschränkte Deckvalidierung für kuratierte interne Decks.
- Runner-KI priorisiert `remove_tag`; KI-vs-KI-Simulation kann V0.4-Decks ausführen.
- UI zeigt Runner-Tags und kann KI-vs-KI mit 0.4-Decks simulieren.

## Scope-Grenzen

- Damage nicht implementiert.
- Keine Resources.
- Keine Trace-, Virus-, Hosting-, Multiaccess-, Bypass-, Prevention- oder Replacement-Systeme.
- Kein freier Deckbuilder.
- Keine offiziellen Karten, Assets oder externen Datenbanken.

## Wichtige geänderte Dateien

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/http-server.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/phase1-artifacts.test.ts`
- `data/*/*0.4*.json`
- `docs/derived/MVP_0.4_*.md`

## Checks

- `corepack pnpm --filter @netrunner/engine test`: pass, 15 Engine tests.
- `corepack pnpm --filter @netrunner/ai test`: pass, 10 AI tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 42 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## Gate

`ready_for_hardening: true`

Keine roten Tests, kein bekannter Blocker.
