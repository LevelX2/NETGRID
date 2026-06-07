# AI-CLEAN-3 Legacy-Pfad-Markierung

Datum: 2026-06-07
Status: abgeschlossenes Cleanup-Review

## Befund

Die AI-CLEAN-1-Klassifikation bleibt gültig: Die alten Runner-/Corp-Planer, Doctrine-PlanWeights und ActionScore-Pfade sind kein Löschmaterial, sondern Legacy-Fallback, Notaus oder Diagnose-/Testfläche. AI-CLEAN-3 markiert deshalb nur die missverständlichsten Stellen und vermeidet breite Umbenennungen.

## Umgesetzte Markierungen

| Pfad                                                                                             | Änderung                                                               | Zweck                                                                                           |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/ai/src/runner-plans.ts` `chooseRunnerPlanAction`                                       | Kommentar `Legacy fallback planner` ergänzt                            | Macht sichtbar, dass dieser Planer nicht die primäre Semantic-Runtime-Entscheidungsschicht ist. |
| `packages/ai/src/corp-plans.ts` `chooseCorpPlanAction`                                           | Kommentar `Legacy fallback planner` ergänzt                            | Gleiche Fallback-/Fixture-Rolle für Corp.                                                       |
| `packages/ai/src/deck-doctrine.ts` `CORP_DOCTRINE_PLAN_WEIGHTS` / `RUNNER_DOCTRINE_PLAN_WEIGHTS` | Kommentar zu Legacy-Fallback-Weights ergänzt                           | Trennt alte PlanWeights von der neueren DeckCapability-/TacticalGoal-Schicht.                   |
| `packages/ai/src/index.test.ts` `V1.4.0 plan-based Corp AI`                                      | Testabschnitt in `Legacy fallback V1.4.0 plan-based Corp AI` umbenannt | Tests benennen jetzt ausdrücklich, dass sie Legacy-Fallback-Planer absichern.                   |
| `packages/ai/src/index.test.ts` Doctrine-PlanWeight-Test                                         | Testtitel auf `bounded legacy Corp plan weight` geschärft              | Verhindert, dass PlanWeights als neue Runtime-Planungswahrheit gelesen werden.                  |

## Bewusst nicht geändert

- `packages/ai/src/index.ts` wurde nicht breit umbenannt, weil die Datei aktuell lokale, nicht zu diesem Paket gehörende Änderungen enthält. Die Entrypoints sind durch AI-CLEAN-1 dokumentiert; die Markierung wurde hier über die aufgerufenen Legacy-Planerdateien und Tests gesetzt.
- Öffentliche Debug-/Viewer-Felder wurden nicht erweitert. Die bestehenden Deck-Strategy-Viewer-Pfade tragen bereits `diagnostic_only` und `plannerEffect: "none"`.
- Es wurden keine Feldnamen in DTOs oder Shared Types geändert, damit keine Debug-/Snapshot-Kontrakte unnötig bewegt werden.

## Sicherheitsgrenzen

- Keine neue KI-Logik, keine Score-Kalibrierung und keine Plannerwirkung.
- Keine Entfernung von Legacy-Notaus, No-Candidate-Fallback, Diagnosepfaden oder Tests.
- Keine Änderung an Engine, `LegalActions`, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Projektion.
- Die finale Action-Auswahl bleibt unverändert auf aktuelle `input.legalActions` begrenzt.
