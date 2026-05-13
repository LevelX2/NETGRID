# V1.9.21 Random Effect Completion Review

Status: implemented
Stand: 2026-05-13

## Scope

Diese Completion-Nacharbeit ergänzt den formalen V1.9.21-Abschluss, ohne das ursprüngliche Final Review umzudeuten. Der reparierte Scope umfasst genau die sechs V1.9.21-Zufallskarten:

- `onr_v1_002_ai-boon`
- `onr_v1_008_boardwalk`
- `onr_v1_104_playful-ai`
- `onr_v1_172_quest-for-cattekin`
- `onr_v1_339_schlaghund`
- `onr_v1_367_rio-de-janeiro-city-grid`

## Ergebnis

- `Playful AI` bildet die vollständige Würfel-/Set-aside-Schleife über eine Runner-`PendingChoice` ab. Jeder Wurf schreibt einen `RandomDrawRecord`; Runner-Choices werden gegen Side, `stateVersion`, ChoiceId und legale Split-Optionen revalidiert.
- `AI Boon` würfelt beim Start eines Runs und speichert die Stärke run-lokal.
- `Boardwalk` erhält Counter nach erfolgreichen HQ-Runs und revealt zu Runner-Zugbeginn pro zwei Counter zufällige HQ-Karten ohne vollständige HQ-Leaks.
- `Quest for Cattekin` würfelt zu Runner-Zugbeginn, nutzt unpreventable Damage für 1/2 und setzt bei 6 den persistenten Extra-Action-Zustand.
- `Schlaghund` würfelt über eine rezzed Asset-LegalAction, vergleicht gegen Runner-Tags, verursacht bei Erfolg 10 Meat Damage und trasht sich selbst.
- `Rio de Janeiro City Grid` würfelt nach dem Passieren rezzter ICE auf dem eigenen Fort und beendet den Run bei 1.

## Artefakte

- Engine und Tests: `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`
- Shared-State-Typen: `packages/shared/src/index.ts`
- AI-Choice-Verhalten: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`
- Web-Anzeige fuer Extra-Aktionen: `apps/web/app/action-board-ui.ts`, `apps/web/app/action-board-ui.test.ts`, `apps/web/app/page.tsx`, `docs/derived/RESOURCE_CARD_DISPLAY_1_0_6_SPEC.md`
- Datenstatus: `data/manifests/card-implementation-manifest-1.9.21.json`, `data/rules/mechanics-coverage-1.9.21.json`, `data/ai/ai-card-hints-deck-legal-v1921.json`
- Szenarien: `data/scenarios/v1921-deterministic-random-release-smoke.json`, `data/scenarios/ai-deck-legal-v1921-smokes.json`

## Nachweis

- Engine-Testlauf: `corepack pnpm --filter @netgrid/engine test -- --runInBand` grün mit 275 Tests.
- AI-Testlauf: `corepack pnpm --filter @netgrid/ai test -- --runInBand` grün mit 92 Tests.
- Workspace-Testlauf: `corepack pnpm test` grün; dabei liefen Catalog, Engine, Decks, AI, Web, Server und Root-Spezifikationen.
- Typecheck: `corepack pnpm typecheck` grün.
- Lint: `corepack pnpm lint` grün.
- Build: `corepack pnpm build` grün. Der Web-Build meldet weiterhin die bekannte Turbopack-NFT-Tracing-Warnung zu `apps/web/next.config.ts`, kompiliert aber erfolgreich.

## Restgrenze

Die Completion bleibt im V1.9.21-Scope. Es wurden keine V1.9.22-Karten oder externen Assets freigeschaltet.
