---
activityId: act-2026-06-08-ai-struct-simulation-benchmark-split
status: done
kind: architecture
area: ai
priority: normal
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
  - packages/ai/src/simulation/benchmark-reports.ts
  - packages/ai/src/index.ts
checks:
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test -- src/index.test.ts -t benchmark
  - corepack pnpm --filter @netgrid/ai test
  - git diff --check
---

# AI-STRUCT-3: Simulation und Benchmark vom Live-Entrypoint trennen

## Ziel

AI-Simulation, Soak, Benchmarking und Metrikaggregation sollen aus dem Live-Entrypoint-Monolithen herausgelöst werden. Die Live-Runtime soll stärker auf `AiDecisionInput -> AiDecision` begrenzt sein; Simulation darf eigene, klar getrennte Daten- und Metrikbedarfe behalten.

## Kontext und Quellen

- `docs/reviews/ai/ai-player-code-structure-analysis-2026-06-07.md`
- Nutzerbewertung vom 2026-06-08: Simulation und Benchmarking als eigene Schicht auslagern, weil sie andere Daten und Metriken als die side-sichere Live-Runtime brauchen.
- Betroffene Hauptfläche: `packages/ai/src/index.ts`
- Empfohlene Zielmodule aus dem Review:
  - `packages/ai/src/simulation/simulation-harness.ts`
  - `packages/ai/src/simulation/simulation-metrics.ts`
  - `packages/ai/src/simulation/benchmark-reports.ts`
  - optional `packages/ai/src/simulation/exploit-fixtures.ts`

## Scope

- Einen `simulation/`-Bereich in `packages/ai/src/` einführen.
- Simulation-/Soak-/Benchmark-Funktionen aus `index.ts` herauslösen, soweit dies mechanisch ohne Verhaltensänderung möglich ist.
- Metrikaggregation und Reportformatierung in eigene Simulation-/Benchmark-Module verschieben oder klar vorbereiten.
- Bestehende Simulationsexports über `index.ts` kompatibel halten, sofern sie extern genutzt werden.
- Safety-Kommentare oder nahe Tests erhalten, die Live-Input-Side-Safety von Simulationen mit `GameState` trennen.

## Nicht im Scope

- Keine Änderung der AI-Liveentscheidung.
- Keine Änderung von Benchmark-Grenzwerten, Metrikdefinitionen oder Quality-Gates.
- Keine neue Simulation, kein neues Deckprofil und keine neue Exploit-Liga.
- Keine Legacy-Baseline-Isolation; dafür gibt es `act-2026-06-08-ai-struct-legacy-baseline-isolation`.
- Keine Engine-, `LegalActions`-, `applyAction`-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.

## Akzeptanzkriterien

- [ ] Mindestens ein klarer Simulation-/Benchmark-Bereich ist aus `packages/ai/src/index.ts` extrahiert.
- [ ] Live-Runtime-Module importieren keine Simulation-only-Funktionen als Entscheidungsgrundlage.
- [ ] Bestehende Simulation-/Benchmark-Tests bleiben grün.
- [ ] AI-Input-Side-Safety- und Hidden-Info-Regressionen bleiben grün.
- [ ] `corepack pnpm --filter @netgrid/ai test` ist grün oder verbleibende fremde Fails sind konkret benannt und nicht durch dieses Paket verursacht.
- [ ] `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check` sind grün.

## Umsetzungshinweise

- Mit reinen Report-/Metrikhelfern beginnen, falls der eigentliche Harness zu breit gekoppelt ist.
- Wenn Simulationsexporte bisher Teil der öffentlichen `@netgrid/ai`-Oberfläche sind, nur intern verschieben und über `index.ts` weiter re-exportieren.
- Keine Safety-Schranke durch Verschiebung verwässern: Simulation darf mehr Kontext haben, der Live-Entscheidungspfad nicht.

## Ergebnisnotiz

Abgeschlossen. Benchmark-Gate- und Reportformatierung liegen jetzt in `packages/ai/src/simulation/benchmark-reports.ts` und werden über `index.ts` kompatibel re-exportiert. Die Simulationsausführung und die zugehörigen Metrikaggregationen bleiben wegen ihrer breiten Kopplung im aktuellen Paket noch im Monolithen; das neue Modul dokumentiert, dass diese Reporthelfer Simulation-only sind und nicht als Live-Entscheidungsgrundlage genutzt werden dürfen.
