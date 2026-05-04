# MVP 0.94 Final Review

Status: bestanden
Stand: 2026-05-04

## Ergebnis

`MVP_0.94_done: true`

`ready_for_MVP_0.95_requirements_freeze: true`

V0.94 ist als Damage-/Flatline-Gate umgesetzt, getestet, dokumentiert und gegen die wichtigsten Hidden-Info-, Replay- und Multiplayer-Risiken geprüft. Der Scope bleibt eng: Net- und Meat-Damage sind spielbar, Flatline ist als side-sicherer Game-End-Grund vorhanden, und alle V0.95+-Mechaniken bleiben gesperrt.

## Umgesetzte Artefakte

- `docs/derived/MVP_0.94_REQUIREMENTS.md`
- `docs/derived/DAMAGE_FLATLINE_0.94_SPEC.md`
- `docs/derived/MVP_0.94_TEST_MATRIX.md`
- `docs/derived/MVP_0.94_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.94_IMPLEMENTATION_REVIEW.md`
- `data/rules/rules-baseline-0.94.json`
- `data/cards/demo-cards-0.94.json`
- `data/decks/demo-decks-0.94.json`
- `data/manifests/card-implementation-manifest-0.94.json`
- `data/rules/mechanics-coverage-0.94.json`
- `data/scenarios/v094-damage-flatline.json`
- `data/scenarios/v094-multiplayer-damage-smoke.json`

## Fachliches Ergebnis

- Damage wird nur ueber Engine-Resolver, Subroutine oder EffectCommand aufgeloest.
- `applyAction` bleibt LegalActions-only und revalidiert Side, ActionId, StateVersion und aktuellen Timingkontext.
- Net- und Meat-Damage trashen zufaellig Karten aus dem Runner-Grip.
- Mehrere Damage-Punkte werden ohne Replacement ausgewaehlt.
- Flatline tritt bei `amount > grip.length` ein, ohne zusaetzliche Random-Auswahl.
- `gameEndReason: "flatline"` wird side-sicher in PlayerViews, Multiplayer Result Summary und Web-UI gefuehrt.
- Damage-Events sind `hidden_info_barrier` und blockieren Undo.
- Die lokale Karte `v094_neural_sentry_ice` ist fiktiv, manifestiert und voll testgedeckt.

## Sicherheitsreview

- Keine vor-Damage-Grip-Liste in PublicEvents, Corp PlayerView, WebSocket/Reconnect, Undo-Fehlern, AI-Input oder UI-Diagnostics.
- Runner sieht nach ueberlebtem Damage die eigenen getrashten Karten im Heap; das ist die sichtbare Folge der Zone-Bewegung, kein Vorab-Leak.
- RandomDrawRecords enthalten Zweckstrings ohne Kartentitel, DefinitionIds oder verdeckte Reihenfolgen.
- Replay reproduziert Damage-Auswahl und finalen StateHash.
- Private lokale Kartenbilder bleiben reine Anzeige-Artefakte und beeinflussen Engine, KI, GameState, Replay, StateHash, Decklegalitaet oder Match-State nicht.

## No-Scope Ergebnis

Nicht freigeschaltet:

- Core-Damage-Handlimit/Counters.
- Damage Prevention, Avoid, Interrupt und Replacement.
- Resources und tag-basiertes Resource-Trash.
- Trace, Link und Bidding.
- Mulligan.
- Jack-out, Breach und Multiaccess.
- Identity-Abilities und Hidden-Zone-Tools.
- Hosting, Viren, Purge, Counter-Familien, Recurring Credits und Bad Publicity.

## Checks

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 32 Tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 17 Tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 16 Tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 18 Tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 Tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 78 Pakettests plus 27 Root-Spec-Tests.
- `corepack pnpm build`: pass; bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route bleibt ohne Build-Abbruch.

## Restpunkte

- V0.95 darf erst nach diesem Commit als eigener Requirements Freeze fuer Resources und Tag-Interaktion starten.
- Core-Damage und Prevention bleiben spaetere eigene Gates.
- Die bestehenden Vorarbeiten und fremden Aenderungen im Worktree muessen beim Commit sauber von V0.94 getrennt bleiben.
