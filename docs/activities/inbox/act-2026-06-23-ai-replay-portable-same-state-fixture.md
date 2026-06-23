---
activityId: act-2026-06-23-ai-replay-portable-same-state-fixture
status: inbox
kind: test
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Das Fixture läuft in einem normalen `@netgrid/ai`-Test ohne lokale SQLite.
- [ ] Die Eingabe enthält keine FullState-, Hidden-Info-, Decklisten- oder lokalen Pfad-Daten.
- [ ] Der Test belegt die gewünschte `start_run`-Entscheidung und mindestens eine Negativkontrolle.
- [ ] `corepack pnpm --filter @netgrid/ai typecheck` und der fokussierte Fixture-Test sind grün.

## Umsetzungshinweise

- Primär `test-quality-agent`, weil die Lücke ein Repro- und Regression-Schutzproblem ist.
- Das Fixture darf aus dem lokalen Repro abgeleitet sein, muss aber repository-seitig redigiert und klein bleiben.

## Ergebnisnotiz

Noch offen.
