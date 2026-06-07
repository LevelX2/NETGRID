---
activityId: act-2026-06-08-ai-struct-runtime-entrypoints
status: inbox
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-08-ai-stabilize-golden-deck-tests
resultArtifacts: []
checks: []
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

- [ ] Mindestens AI-Input-Projektion und Live-Entrypoint-Delegation sind aus `packages/ai/src/index.ts` herausgelöst oder klar in neue Runtime-Module vorbereitet.
- [ ] `index.ts` bleibt als kompatible Facade/Re-Export-Fläche nutzbar.
- [ ] Es gibt keine absichtliche Score-, Prioritäts- oder DecisionDebug-Semantikänderung.
- [ ] Bestehende fokussierte Runtime-, Golden-Deck- und AI-Input-/Redaction-Tests sind grün.
- [ ] `corepack pnpm --filter @netgrid/ai test` ist grün oder verbleibende fremde Fails sind konkret benannt und nicht durch dieses Paket verursacht.
- [ ] `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check` sind grün.

## Umsetzungshinweise

- Klein anfangen: zuerst pure Input-/Side-Safety-Helfer und Entrypoint-Delegation bewegen.
- Wenn die Semantic-Runtime-Extraktion zu breit wird, diese in eine neue Folgeactivity schneiden statt dieses Paket zu einem Big-Bang-Refactor zu machen.
- Vor und nach der Extraktion relevante Tests laufen lassen, damit die Änderung als mechanische Verschiebung überprüfbar bleibt.

## Ergebnisnotiz

Noch offen.
