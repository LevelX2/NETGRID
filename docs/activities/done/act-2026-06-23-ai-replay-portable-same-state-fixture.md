---
activityId: act-2026-06-23-ai-replay-portable-same-state-fixture
status: done
kind: test
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-23
startedAt: 2026-06-23
completedAt: 2026-06-23
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/evaluation/replay-portable-fixtures.ts
  - packages/ai/src/evaluation/replay-portable-fixtures.test.ts
  - docs/reviews/ai/ai-replay-portable-same-state-fixture-2026-06-23.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-portable-fixtures.test.ts --maxWorkers=1 --testTimeout=30000
  - corepack pnpm --filter @netgrid/ai typecheck
---

# AI-Replay: portables Same-State-Fixture erstellen

## Ziel

Der bestätigte Coverage-Mapping-Fall aus der ersten AI-Replay-Mistake-Iteration soll ohne lokale SQLite reproduzierbar werden. Das Ergebnis soll ein minimiertes, redigiertes Fixture enthalten, das nur `PlayerView`, `LegalActions` und die minimal nötigen side-safe Entscheidungsanker enthält.

## Kontext und Quellen

- `docs/reviews/ai/ai-replay-decision-repro-2026-06-23.md`
- `docs/reviews/ai/ai-replay-decision-fix-2026-06-23.md`
- `packages/ai/src/runtime/semantic-choice-ranking.test.ts`
- `packages/ai/src/evaluation/replay-acceptance-harness.ts`

## Scope

- Ein minimales Fixture im bestehenden AI-Test-/Fixture-Stil erstellen.
- Belegen, dass die aktuelle KI den Fall ohne lokale Runtime-DB über `PlayerView` und `LegalActions` prüft.
- Falls der originale Zustand nicht vollständig rekonstruierbar ist, ein nahes synthetisches Fixture mit klarer Abweichungsnotiz erstellen.

## Nicht im Scope

- Kein FullState- oder Hidden-Card-Snapshot im Repository.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine neue Ranking-Gewichtung außerhalb des bestehenden Fixes.

## Akzeptanzkriterien

- [x] Das Fixture läuft in einem normalen `@netgrid/ai`-Test ohne lokale SQLite.
- [x] Die Eingabe enthält keine FullState-, Hidden-Info-, Decklisten- oder lokalen Pfad-Daten.
- [x] Der Test belegt die gewünschte `start_run`-Entscheidung und mindestens eine Negativkontrolle.
- [x] `corepack pnpm --filter @netgrid/ai typecheck` und der fokussierte Fixture-Test sind grün.

## Umsetzungshinweise

- Primär `test-quality-agent`, weil die Lücke ein Repro- und Regression-Schutzproblem ist.
- Das Fixture darf aus dem lokalen Repro abgeleitet sein, muss aber repository-seitig redigiert und klein bleiben.

## Ergebnisnotiz

Umgesetzt mit `packages/ai/src/evaluation/replay-portable-fixtures.ts` und `packages/ai/src/evaluation/replay-portable-fixtures.test.ts`. Das Fixture `ai-replay-coverage-run-gap-portable-v1` ist bewusst ein redigiertes `synthetic_near_same_state`: Es enthält nur `PlayerView`, `LegalActions` und sichtbare Entscheidungsanker, nicht den lokalen SQLite-FullState. Der Test belegt die gewünschte `start_run`-Entscheidung und die Negativkontrolle ohne erfundenen Run. Dokumentiert in `docs/reviews/ai/ai-replay-portable-same-state-fixture-2026-06-23.md`.
