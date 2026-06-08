---
activityId: act-2026-06-08-ai-struct-runtime-entrypoints
status: done
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt: 2026-06-08
completedAt: 2026-06-08
branch:
releaseTarget:
blockedBy:
  - act-2026-06-08-ai-stabilize-golden-deck-tests
resultArtifacts:
  - packages/ai/src/runtime/ai-decision-input.ts
  - packages/ai/src/runtime/choose-ai-action.ts
  - packages/ai/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec tsc --noEmit
  - corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/runner-golden-deck-debug.test.ts
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "side-safe|AI input|redaction|selectAiDecisionSideForState|buildAiDecisionInput|All-Nighter|Faked Hit"
  - corepack pnpm --filter @netgrid/ai test
  - git diff --check
---

# AI-STRUCT-1: Runtime-Entrypoints aus index.ts extrahieren

## Ziel

`packages/ai/src/index.ts` soll ohne Verhaltensänderung in Richtung Facade/Re-Export-Datei entlastet werden. Der erste Schnitt trennt AI-Input-Projektion, Seitenwahl und Live-Entrypoints von den übrigen Legacy-, Simulations- und Diagnosebereichen.

## Kontext und Quellen

- `docs/reviews/ai/ai-player-code-structure-analysis-2026-06-07.md`
- Nutzerbewertung vom 2026-06-08 aus dem eingefügten Text: Kein Big-Bang, erst Teststatus grün, dann kleiner Strukturpfad.
- Analysebefund: `packages/ai/src/index.ts` bündelt Package-Barrel, Live-Runtime, Semantic Runtime, Legacy-Fallback, Simulation, Benchmark und Diagnosen.
- Empfohlene Zielmodule aus dem Review:
  - `packages/ai/src/runtime/ai-decision-input.ts`
  - `packages/ai/src/runtime/choose-ai-action.ts`
  - `packages/ai/src/runtime/semantic-runtime.ts`

## Scope

- Einen risikoarmen `runtime/`-Ordner einführen.
- `buildAiDecisionInput`, `selectAiDecisionSideForState` und side-sichere AI-Input-/Allowlist-Helfer nach `runtime/ai-decision-input.ts` extrahieren.
- `chooseAiAction`, `chooseRunnerAction` und `chooseCorpAction` nach `runtime/choose-ai-action.ts` extrahieren oder mit minimaler Delegation vorbereiten.
- Semantic-Runtime-Helfer nur so weit nach `runtime/semantic-runtime.ts` verschieben, wie dies mechanisch und ohne Score-/Prioritätsänderung möglich ist.
- Die öffentliche Importoberfläche `@netgrid/ai` über `index.ts` stabil halten.

## Nicht im Scope

- Keine Score-, Prioritäts-, TacticalPlan-, Baseline- oder Entscheidungslogik ändern.
- Keine Legacy-Baseline-Isolation; dafür gibt es `act-2026-06-08-ai-struct-legacy-baseline-isolation`.
- Keine Simulation-/Benchmark-Auslagerung; dafür gibt es `act-2026-06-08-ai-struct-simulation-benchmark-split`.
- Keine Aufteilung von `index.test.ts`; dafür gibt es `act-2026-06-08-ai-test-index-modularization`.
- Keine Engine-, `LegalActions`-, `applyAction`-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.

## Akzeptanzkriterien

- [x] Mindestens AI-Input-Projektion und Live-Entrypoint-Delegation sind aus `packages/ai/src/index.ts` herausgelöst oder klar in neue Runtime-Module vorbereitet.
- [x] `index.ts` bleibt als kompatible Facade/Re-Export-Fläche nutzbar.
- [x] Es gibt keine absichtliche Score-, Prioritäts- oder DecisionDebug-Semantikänderung.
- [x] Bestehende fokussierte Runtime-, Golden-Deck- und AI-Input-/Redaction-Tests sind grün.
- [x] `corepack pnpm --filter @netgrid/ai test` ist grün oder verbleibende fremde Fails sind konkret benannt und nicht durch dieses Paket verursacht.
- [x] `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check` sind grün.

## Umsetzungshinweise

- Klein anfangen: zuerst pure Input-/Side-Safety-Helfer und Entrypoint-Delegation bewegen.
- Wenn die Semantic-Runtime-Extraktion zu breit wird, diese in eine neue Folgeactivity schneiden statt dieses Paket zu einem Big-Bang-Refactor zu machen.
- Vor und nach der Extraktion relevante Tests laufen lassen, damit die Änderung als mechanische Verschiebung überprüfbar bleibt.

## Ergebnisnotiz

Mechanischer Runtime-Schnitt umgesetzt:

- `packages/ai/src/runtime/ai-decision-input.ts` enthält jetzt `buildAiDecisionInput`, `selectAiDecisionSideForState`, `AiDecisionSideSelection`, `AiDecisionInputWithDeckCapabilities` und die Forbidden-Field-Liste.
- `packages/ai/src/runtime/choose-ai-action.ts` enthält `AiDecisionRuntimeOptions` und `chooseAiActionFromSides` als kleine Live-Entrypoint-Delegationsschicht.
- `packages/ai/src/index.ts` bleibt die kompatible Facade und re-exportiert `buildAiDecisionInput`, `selectAiDecisionSideForState` und `AiDecisionSideSelection`; die bestehenden `chooseAiAction`, `chooseRunnerAction` und `chooseCorpAction` bleiben öffentlich unverändert.

Semantic-Runtime-Helfer wurden bewusst nicht verschoben, weil das in diesem Paket ein breiter Score-/Debug-Risiko-Schnitt geworden wäre. Es gab keine absichtliche Entscheidungs-, Score-, Prioritäts- oder DecisionDebug-Semantikänderung.
