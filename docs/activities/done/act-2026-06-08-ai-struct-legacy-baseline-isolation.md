---
activityId: act-2026-06-08-ai-struct-legacy-baseline-isolation
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
  - act-2026-06-08-ai-struct-runtime-entrypoints
resultArtifacts:
  - packages/ai/src/legacy/legacy-baseline.ts
  - packages/ai/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
  - git diff --check
---

# AI-STRUCT-2: Legacy-Baseline sichtbar isolieren

## Ziel

Legacy-Baseline, alte Baseline-Scorer und Fallback-Entscheidungshilfen sollen aus dem Restmonolithen heraus in einen klar benannten `legacy/`-Bereich verschoben werden. Die alte Logik bleibt erhalten, wird aber nicht mehr mit der live tragenden Semantic-/TacticalPlan-Zielarchitektur verwechselt.

## Kontext und Quellen

- `docs/reviews/ai/ai-player-code-structure-analysis-2026-06-07.md`
- `docs/reviews/ai/ai-clean-1-legacy-ai-code-inventory-2026-06-07.md`
- `docs/reviews/ai/ai-clean-3-legacy-path-marking-2026-06-07.md`
- Nutzerbewertung vom 2026-06-08: Legacy-Code nicht löschen, sondern isolieren; Notaus, No-Candidate-Fallback, Referenz und Regressionstestfläche bleiben relevant.
- Betroffene Hauptfläche: `packages/ai/src/index.ts`

## Scope

- `packages/ai/src/legacy/legacy-baseline.ts` oder einen äquivalent klaren Legacy-Zielort anlegen.
- Legacy-/Baseline-Funktionen wie `chooseRunnerBaselineAction`, `chooseCorpBaselineAction`, `scoreActions`, `scoreRunnerAction`, `scoreCorpAction` und `decisionFromChoices` aus `index.ts` isolieren, soweit sie im aktuellen Code so vorhanden sind.
- Benennung, Kommentare und nahe Tests so anpassen, dass die Rolle als `legacyFallback`, Notaus, Referenz oder Testfläche klar ist.
- Öffentliche Exports und bestehende Fallback-Verträge stabil halten.

## Nicht im Scope

- Keine Entfernung der alten Runner-/Corp-Planer.
- Keine Änderung daran, wann Legacy als Notaus oder No-Candidate-Fallback genutzt wird.
- Keine neue Semantic-Runtime-Kalibrierung und keine Plannergewichte ändern.
- Keine Simulation-/Benchmark-Auslagerung.
- Keine Engine-, `LegalActions`-, `applyAction`-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.

## Akzeptanzkriterien

- [ ] Legacy-Baseline-Code liegt nicht mehr vermischt im zentralen Runtime-/Facade-Teil von `index.ts`.
- [ ] Bestehende Legacy-Fallback- und No-Candidate-Fallback-Tests bleiben grün.
- [ ] Neue oder angepasste Namen machen klar, dass diese Pfade Legacy/Fallback sind und nicht die aktive Zielarchitektur.
- [ ] Es gibt keine absichtliche Änderung der gewählten AI-Actions.
- [ ] `corepack pnpm --filter @netgrid/ai test` ist grün oder verbleibende fremde Fails sind konkret benannt und nicht durch dieses Paket verursacht.
- [ ] `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check` sind grün.

## Umsetzungshinweise

- Dieses Paket baut auf dem Runtime-Entrypoint-Schnitt auf; wenn `index.ts` noch zu stark vermischt ist, zuerst `act-2026-06-08-ai-struct-runtime-entrypoints` abschließen.
- Nicht breit umbenennen, wenn ein kleiner Modulmove plus klare Kommentare reicht.
- Falls die Extraktion zeigt, dass weitere Legacy-Familien getrennte Zielmodule brauchen, Folgeactivities schneiden.

## Ergebnisnotiz

Abgeschlossen. Die öffentlichen Corp-/Runner-Baseline-Einstiege delegieren jetzt über `packages/ai/src/legacy/legacy-baseline.ts`; die gekoppelten Scorer- und Entscheidungshelfer bleiben verhaltensgleich in `index.ts`, sind dort aber als Legacy-Baseline-Implementierung markiert. Ein vollständiger Scorer-Modulmove bleibt bewusst aus, weil die Helfergraphen noch breit an den Restmonolithen gekoppelt sind und dieses Paket keine Verhaltensänderung riskieren soll.
