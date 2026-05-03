# MVP 0.3 Implementation Review

Status: passed  
Stand: 2026-05-03

## Implementierter Scope

- Side-neutraler AI-Input-Builder.
- Runner-KI mit Economy-, Install-, Run-, Break-, Access-, Steal-, Trash- und End-Turn-Prioritäten.
- Corp-KI v2 mit Mandatory-, Score-, Rez-, Operation-, Remote-, Advance-, ICE- und End-Turn-Prioritäten.
- Deterministische AI-Decisions mit Reason-Code, Explanation, ConsideredActions und Fallback-Markierung.
- KI-vs-KI-Simulationsharness mit Seed, Action-Limit, Winner/Limit, finalem StateHash und Replay-Prüfung.
- Servermodi für Human Runner vs Corp-KI und Human Corp vs Runner-KI.
- Lokale AI-vs-AI-Simulations-API.
- Web-UI-Moduswahl für Human-vs-Human, Human-vs-KI und KI-vs-KI.

## Scope-Grenzen

- Kartenpool bleibt unverändert.
- Keine LLM-KI.
- Kein FullState im Browser oder in AI-Standardpayloads.
- Kein freier Deckbuilder.
- Kein öffentliches Matchmaking oder Accountsystem.

## Wichtige geänderte Dateien

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/server/src/index.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/api/game/route.ts`

## Checks

- `corepack pnpm --filter @netrunner/ai test`: pass, 8 AI tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 11 Server/Multiplayer/AI-mode tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 35 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass, inklusive Next.js Build.

## Gate

`ready_for_hardening: true`

Keine roten Tests, kein bekannter Blocker.
