# AI-COMPLETE-16 Scoring Ownership Matrix

Status: `IN_PROGRESS`

Zweck: Erstes Ownership-Artefakt für `AI-COMPLETE-16`, damit doppelte oder widersprüchliche Bewertungslogik nicht mehr über verstreute Score-Module, Legacy-Planer und Simulation-Diagnostik entschieden wird.

## Owner-Matrix

| Bewertungsdimension | Primärer Owner | Erlaubte Consumer | Audit-Fokus |
| --- | --- | --- | --- |
| Score-Aggregation und Rundung | `packages/ai/src/runtime/semantic-runtime-score-breakdown.ts`, `semantic-runtime-score-components.ts` | Runtime-Choice-Builder, Ranking, Tests | Keine zweite Gesamtpunkt-Komposition außerhalb der Score-Breakdown-Schicht. |
| Action-Goal-Fit | `packages/ai/src/decision/action-goal-fit.ts`, Runtime-Goal-Fit-Module | Runner-/Corp-Runtime-Score-Komponenten | Legacy-Planbasis darf Goal-Fit nicht als parallele Produktivautorität überschreiben. |
| Strategic Action Fit | `packages/ai/src/runtime/strategic-action-fit.ts` | Semantic Runtime Score | Target- und Strategie-Fit nicht zusätzlich in Legacy-Heuristiken replizieren. |
| Target Fit und TargetChoice | `packages/ai/src/decision/target-choice-shadow.ts`, `packages/ai/src/actions/action-target-context.ts` | Target-Fit-Score, Diagnose, Coverage | TargetChoice bleibt Fit-/Diagnose-Consumer und erzeugt keine eigenen `selectedTargets`. |
| Runner Run Reachability | `packages/ai/src/runner-run-target-evaluation.ts`, bekannte ICE-/Path-Score-Module | Runner-Score-Komponenten, Simulation-Metriken | Legacy-Runner-Planer darf Reachability nur noch als gekapselter Fallback/Comparator liefern. |
| Remote-/Access-Payoff | `packages/ai/src/decision/access-decision-projection.ts`, Remote-Trash-/Run-Target-Module | Runner-Run-Score, Simulation-Diagnostik | Access-Wert, Trash-Wert und Known-Remote-Memory nicht in mehreren Pfaden unterschiedlich skalieren. |
| Corp Scoreline und Board-Triage | `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.ts`, `semantic-runtime-corp-board-triage.ts`, `semantic-runtime-corp-board.ts` | Corp-Score-Komponenten, Safety-Gates | Board-Triage darf Scoreline-Sicherheit und Economy-Bedarf nicht neben Safety-Gates widersprüchlich bewerten. |
| Corp Economy und Rez-Floor | `packages/ai/src/runtime/semantic-runtime-corp-score.ts`, Corp-Board-Triage-Kontext | Corp-Score-Komponenten, Simulation-Metriken | Economy-Stabilisierung, Rez-Bedarf und passive Scoreline-Penalty müssen eine gemeinsame Skala nutzen. |
| Plan Continuity und Fortschritt | `packages/ai/src/runtime/semantic-runtime.ts`, TacticalPlan-/Progression-Module | Choice-Builder, WhyChosen/WhyNot, Simulation-Metriken | Planfortschritt darf keine blockierten oder payofflosen Wiederholungen gegenüber Reachability/Access-Memory hochziehen. |
| Legacy Action Scoring | `packages/ai/src/legacy/legacy-action-scorer.ts`, `legacy-action-scoring-composition.ts` | Legacy-Fallback, Comparator, Exclusion-Kontext | Legacy bleibt gekapselt; produktive Ownership liegt bei Runtime-/Decision-Ownern. |

## Guard-Status

- Score-Aggregation: `packages/ai/src/decision/module-boundaries.test.ts` erlaubt `semanticRuntimeScoreFromComponents` nur noch im Score-Components-Owner, im Runtime-Choice-Builder und im Public-Entrypoint-Reexport. Neue produktive Gesamtpunkt-Summierungen außerhalb dieser Boundary fallen damit als Boundary-Verstoß auf.

## Erste Audit-Befunde

- `rg` zeigt erwartungsgemäß viele Score-/Reachability-/Access-Treffer, aber keine einzelne zentrale Owner-Dokumentation vor diesem Artefakt.
- Die stärksten Kollisionszonen sind Runner-Run-Reachability versus Legacy-Runner-Planer, Remote-/Access-Payoff versus Simulation-Metriken, Corp-Board-Triage versus Corp-Scoreline/Safety und Legacy-Action-Scoring versus Runtime-Score.
- Nächster Umsetzungsschnitt sollte eine konkrete Kollisionszone in Code oder Tests binden, statt die Matrix breiter zu machen.

## Gates

- Keine Engine-Regeländerung.
- Keine neue LegalAction-Erzeugung.
- Keine Hidden-Info-Erweiterung.
- Keine Score-Gewichte in diesem Dokumentationsschnitt.
