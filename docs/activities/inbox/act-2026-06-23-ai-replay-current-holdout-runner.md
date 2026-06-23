---
activityId: act-2026-06-23-ai-replay-current-holdout-runner
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

- [ ] Der Runner nimmt DB-Pfad, Run-ID, Cutoff und Output-Verzeichnis per CLI-Parameter.
- [ ] Output landet standardmäßig unter `data/local/` und wird nicht versioniert.
- [ ] Ein versionierter Summary-Bericht enthält nur Aggregate, Digests oder wenige redigierte Beispiele.
- [ ] IllegalActions, Replay-/Rekonstruktionsfehler und Redaction-Verstöße werden explizit gezählt.

## Umsetzungshinweise

- Primär `test-quality-agent`, weil die Aufgabe ein Abnahme-Gate ist.
- Bei fehlender lokaler DB darf der Runner mit klarer Fehlermeldung abbrechen, ohne Tests zu brechen.

## Ergebnisnotiz

Noch offen.
