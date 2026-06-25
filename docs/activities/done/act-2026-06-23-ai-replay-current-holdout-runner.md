---
activityId: act-2026-06-23-ai-replay-current-holdout-runner
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
  - packages/ai/src/evaluation/current-ai-holdout-runner.ts
  - packages/ai/src/evaluation/current-ai-holdout-runner.test.ts
  - scripts/run-ai-replay-current-holdout.ts
  - docs/reviews/ai/ai-replay-current-holdout-runner-2026-06-23.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/current-ai-holdout-runner.test.ts --maxWorkers=1 --testTimeout=30000
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm exec tsx scripts/run-ai-replay-current-holdout.ts --db data/runtime/multiplayer/netgrid.sqlite --run-id 2026-06-23
---

# AI-Replay: aktuelle KI auf Holdout-DecisionPoints ausführen

## Ziel

Der Holdout-Nachweis soll von historischer Pattern-Zählung auf echte aktuelle KI-Auswertung gehoben werden. Die aktuelle KI muss auf denselben Holdout-DecisionPoints laufen, soweit lokale Runtime-Daten vorhanden sind.

## Kontext und Quellen

- `docs/reviews/ai/ai-replay-decision-holdout-handoff-2026-06-23.md`
- `docs/reviews/ai/ai-replay-decision-safe-summary-2026-06-23.json`
- `packages/ai/src/evaluation/replay-acceptance-harness.ts`
- `scripts/build-ai-replay-acceptance-report.ts`

## Scope

- Lokalen Runner ergänzen oder erweitern, der Holdout-DecisionPoints aus einer explizit übergebenen SQLite-DB rekonstruiert.
- Für jede auswertbare Holdout-Decision die aktuelle KI mit `PlayerView` und `LegalActions` ausführen.
- Aggregiert berichten: geänderte Entscheidungen, IllegalActions, Rekonstruktionsfehler, Redaction-Verstöße und Recurrence des gefixten Musters.

## Nicht im Scope

- Kein Commit vollständiger Holdout-DecisionCases oder FullState-Snapshots.
- Keine Nutzung von Holdout zur Score-Justierung.
- Kein neuer KI-Fix für Remote-Contest-/Creditbase oder andere Cluster.

## Akzeptanzkriterien

- [x] Der Runner nimmt DB-Pfad, Run-ID, Cutoff und Output-Verzeichnis per CLI-Parameter.
- [x] Output landet standardmäßig unter `data/local/` und wird nicht versioniert.
- [x] Ein versionierter Summary-Bericht enthält nur Aggregate, Digests oder wenige redigierte Beispiele.
- [x] IllegalActions, Replay-/Rekonstruktionsfehler und Redaction-Verstöße werden explizit gezählt.

## Umsetzungshinweise

- Primär `test-quality-agent`, weil die Aufgabe ein Abnahme-Gate ist.
- Bei fehlender lokaler DB darf der Runner mit klarer Fehlermeldung abbrechen, ohne Tests zu brechen.

## Ergebnisnotiz

Umgesetzt mit `scripts/run-ai-replay-current-holdout.ts` und `packages/ai/src/evaluation/current-ai-holdout-runner.ts`. Der lokale Lauf `2026-06-23` rekonstruierte und bewertete 283/283 Holdout-DecisionPoints aus `data/runtime/multiplayer/netgrid.sqlite`; Ergebnis: 97 geänderte Entscheidungen, 0 IllegalActions, 0 Rekonstruktionsfehler, 0 KI-Fehler, 0 Redaction-Verstöße und 0/3 aktuelle Recurrence des ersten Coverage-Mapping-Fix-Musters. Vollständige Outputs liegen nichtversioniert unter `data/local/ai-replay/2026-06-23`; versioniert ist nur der redigierte Summary-Bericht `docs/reviews/ai/ai-replay-current-holdout-runner-2026-06-23.md`.
