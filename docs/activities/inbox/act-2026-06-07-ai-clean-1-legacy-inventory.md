---
activityId: act-2026-06-07-ai-clean-1-legacy-inventory
status: inbox
kind: architecture
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget: ai-clean-legacy-runtime-cleanup
blockedBy: []
resultArtifacts: []
checks: []
---

# AI-CLEAN-1: Legacy-KI-Inventar und Nutzungsstatus

## Ziel

Nach AI-PLAN-3 bis AI-PLAN-8 und AI-STRAT-1 bis AI-STRAT-4 soll klar dokumentiert sein, welche alten KI-Planer, PlanWeights, ActionScores, Debugfelder und Legacy-Heuristiken noch im Livepfad, als Fallback, diagnostisch oder nur in Tests gebraucht werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-07: aus eingefügtem AI-Cleanup-Vorschlag Activity-Pakete erstellen.
- Eingefügter Vorschlag: kontrolliert mit AI-CLEAN-1 starten, nicht blind alles löschen.
- `docs/reviews/ai/semantic-ai-runtime-cutover-2026-06-04.md`: Semantic Runtime ist default aktiv; Legacy bleibt Notaus und No-Candidate-Fallback.
- `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md`
- `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md`
- `docs/architecture/ai/ai-strat-runner-intent-run-target-goals-automation-process-2026-06-07.md`
- `docs/reviews/ai/ai-strat-runner-intent-goals-final-report-2026-06-07.md`

## Scope

- AI-Entry-Points und Entscheidungsfluss inventarisieren, insbesondere `chooseAiAction`, `chooseSemanticRuntimeAction`, TacticalPlans, RunnerStrategicIntent, RunnerRunTargetEvaluation und RunnerTacticalGoals.
- Alte Runner-/Corp-Planer, Doctrine-/PlanWeight-Pfade, ActionScore-Helfer, Shadow-/Meta-Helfer und Debugfelder auf Imports, Tests, UI-Verbrauch, Runtime-Nutzung und Fallback-Nutzung prüfen.
- Je Pfad eine eindeutige Klassifikation dokumentieren:
  - `runtime_active`
  - `diagnostic_only`
  - `fallback_only`
  - `test_only`
  - `dead_code`
  - `remove_candidate`
  - `keep_but_rename`
- Einen kurzen Review unter `docs/reviews/ai/` anlegen, der die Klassifikation und die Folgeempfehlungen nachvollziehbar macht.
- Konkrete Folge-Activities ergänzen oder diese vorbereiteten Folgepakete aktualisieren, falls das Inventar andere Schnitte nahelegt.

## Nicht im Scope

- Keine breite Code-Löschung ohne belegte Klassifikation.
- Keine neue KI-Logik, keine neuen Strategy-IDs, keine neuen Taktiksignale und keine Kartensemantikänderung.
- Keine Engine-, `LegalAction`-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Entfernung dokumentarischer Reports, die Verlauf oder Entscheidungen erklären.
- Keine Abschwächung von Legacy-Notaus, Fallbacks oder Tests, solange sie als gebraucht klassifiziert sind.

## Akzeptanzkriterien

- [ ] Ein Review-Artefakt unter `docs/reviews/ai/` listet die geprüften Pfade mit Datei/Funktion, Klassifikation, Begründung und empfohlener Folgeaktion.
- [ ] Livepfad, Notaus-/Fallbackpfad, Diagnosepfad und Test-/Fixture-Nutzung sind getrennt ausgewiesen.
- [ ] Eindeutig tote Pfade sind als `dead_code` oder `remove_candidate` markiert und für AI-CLEAN-2 verwertbar.
- [ ] Zu behaltende, aber irreführend benannte Pfade sind als `keep_but_rename`, `diagnostic_only` oder `fallback_only` markiert und für AI-CLEAN-3 verwertbar.
- [ ] Hidden-Info-, LegalAction-, Engine-, Replay- und StateHash-Grenzen sind als unverändert dokumentiert.
- [ ] Falls keine Löschkandidaten gefunden werden, begründet das Review den Befund und schließt AI-CLEAN-2 entsprechend klein oder als nicht nötig ein.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte: `packages/ai/src/index.ts`, `packages/ai/src/tactical-plans.ts`, `packages/ai/src/deck-doctrine.ts`, `packages/ai/src/deck-doctrine-strategy.ts`, `packages/ai/src/runner-strategic-intent.ts`, `packages/ai/src/runner-run-target-evaluation.ts`, `packages/ai/src/runner-tactical-goals.ts` und relevante Debug-/Trace-Module.
- Bei Unsicherheit lieber `remove_candidate` statt `dead_code` verwenden und konkrete Prüfschritte notieren.
- Review-Zielname: `docs/reviews/ai/ai-clean-1-legacy-ai-code-inventory-2026-06-07.md`.

## Ergebnisnotiz

Noch offen.
