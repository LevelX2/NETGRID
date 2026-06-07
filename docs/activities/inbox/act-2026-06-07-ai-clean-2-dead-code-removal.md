---
activityId: act-2026-06-07-ai-clean-2-dead-code-removal
status: inbox
kind: cleanup
area: ai
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-07
startedAt:
completedAt:
branch:
releaseTarget: ai-clean-legacy-runtime-cleanup
blockedBy:
  - act-2026-06-07-ai-clean-1-legacy-inventory
resultArtifacts: []
checks: []
---

# AI-CLEAN-2: Eindeutig tote Legacy-KI-Pfade entfernen

## Ziel

Nach dem AI-CLEAN-1-Inventar sollen nur die KI-Pfade entfernt werden, die eindeutig nicht mehr importiert, getestet, diagnostisch angezeigt, als Fallback genutzt oder als Fixture gebraucht werden.

## Kontext und Quellen

- Nutzerauftrag vom 2026-06-07: AI-Cleanup als Activities vorbereiten.
- Vorgeschaltetes Paket: `act-2026-06-07-ai-clean-1-legacy-inventory`.
- Erwartetes Review-Artefakt: `docs/reviews/ai/ai-clean-1-legacy-ai-code-inventory-2026-06-07.md`.
- Fachlicher Grund: Die Semantic Runtime, TacticalPlans, DeckCapabilityProfile, RunnerStrategicIntent, RunTargetEvaluation und RunnerTacticalGoals tragen inzwischen eigene Entscheidungsstrukturen; tote oder halb-tote Legacy-Pfade erhöhen Diagnose- und Fehlerrisiko.

## Scope

- Nur Pfade entfernen, die im Inventar als `dead_code` klassifiziert oder mit klarer Begründung als sicherer `remove_candidate` bestätigt sind.
- Entfernte Exporte, Imports, Tests und Debugfelder konsistent bereinigen.
- Tests aktualisieren, wenn sie ausschließlich obsoletes Legacy-Verhalten absichern und keinen aktuellen Fallback-, Diagnose- oder Fixture-Wert mehr haben.
- Review- oder Ergebnisnotiz ergänzen, welche Pfade entfernt wurden und welche bewusst bleiben.

## Nicht im Scope

- Keine Entfernung von `diagnostic_only`, `fallback_only`, `test_only` oder unklaren Pfaden.
- Keine neue KI-Entscheidungslogik und keine Kalibrierung von Scores, TacticalGoals oder Runner-/Corp-Strategien.
- Keine neuen Strategy-IDs, keine neuen Taktiksignale, keine Kartensemantikänderung.
- Keine Änderung an Engine, `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Projektion.
- Keine Löschung historischer AI-Reports oder Architekturartefakte, sofern sie Entscheidungen nachvollziehbar machen.

## Akzeptanzkriterien

- [ ] Jede Code-Entfernung verweist auf eine AI-CLEAN-1-Klassifikation oder eine im Paket dokumentierte Zusatzprüfung.
- [ ] Es bleiben keine toten Exporte, verwaisten Imports oder irreführenden Tests für entfernte Legacy-Pfade zurück.
- [ ] Legacy-Notaus, No-Candidate-Fallback, diagnostische Deckprofile, Deckeditor-Analyse, Golden-Deck-Fixtures und relevante Benchmarks bleiben erhalten, sofern AI-CLEAN-1 sie nicht ausdrücklich als löschbar klassifiziert.
- [ ] Die finale Action-Auswahl bleibt ausschließlich aus `input.legalActions`.
- [ ] Hidden-Info-, Engine-, Replay- und StateHash-Grenzen bleiben unverändert.
- [ ] Relevante `@netgrid/ai`-Checks und `git diff --check` sind ausgeführt oder begründet ausgelassen.

## Umsetzungshinweise

- Vor dem Löschen `rg` über `packages/ai`, `apps/web`, `apps/server`, `data/ai`, `docs/reviews/ai` und Tests laufen lassen.
- Wenn ein Pfad nur wegen Benennung oder Debug-Verwirrung problematisch ist, nicht löschen, sondern an AI-CLEAN-3 übergeben.
- Falls AI-CLEAN-1 keine sicheren Löschkandidaten liefert, dieses Paket mit Ergebnis "nicht nötig" abschließen statt künstlich Code zu entfernen.

## Ergebnisnotiz

Noch offen.
