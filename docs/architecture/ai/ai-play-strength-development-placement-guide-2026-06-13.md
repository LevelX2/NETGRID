# AI Play-Strength Development Placement Guide

Status: active_guidance

## Zweck

Dieser Guide übersetzt die gewachsene AI-Play-Strength-Struktur in konkrete Platzierungsregeln für neue KI-Fixes. Ziel ist, neue Diagnose-, Scoring- und Pilot-Arbeit in die passende interne Schicht zu legen und `packages/ai/src/index.ts` als öffentliche Fassade klein zu halten.

## Grundregel

Neue KI-Arbeit wird nach Funktion platziert, nicht nach dem gerade betroffenen Test oder nach der ersten auffindbaren Hilfsfunktion. `index.ts` erhält nur Public-Facade-Schnitte: Exports, Runtime-Entrypoints und bewusst öffentliche Kompatibilitätsflächen.

## Platzierungsregeln

| Neue Arbeit                                                           | Zielbereich                                                                                                                             |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Neuer Run-Fix                                                         | `packages/ai/src/actions/run-action-projection.ts` oder `packages/ai/src/decision/run-target-action-alignment.ts`                       |
| Neues Risiko oder neue harte Pilot-Blockade                           | `packages/ai/src/actions/risk-action-projection.ts` oder `packages/ai/src/decision/pilot/*`                                             |
| Neue Zielwahl-, Choice- oder Target-Bewertung                         | `packages/ai/src/decision/target-choice-shadow.ts` oder `packages/ai/src/actions/action-target-context.ts`                              |
| Neue Doctrine-, Goal- oder Decklinie                                  | `packages/ai/src/decision/doctrine-goal-synthesis.ts`, `packages/ai/src/deck-doctrine-strategy.ts` oder ein eng benanntes Modul daneben |
| Neue Pilot-Aktivierung, Scope-Policy oder lokaler Override            | `packages/ai/src/decision/pilot/*`                                                                                                      |
| Neue Evaluation, Coverage, Delta, Corpus-Metrik oder Readiness-Matrix | `packages/ai/src/evaluation/*`                                                                                                          |
| Neue Debug-Ausgabe oder Entwicklerdiagnose                            | `packages/ai/src/diagnostics/*`                                                                                                         |
| Neue Reportformatierung ohne Entscheidungslogik                       | `packages/ai/src/reports/*`                                                                                                             |
| Historische Regressionsevidence                                       | unveränderliche Fixture unter `evaluation/` oder `simulation/regression/`; keine ausführbare Legacy-Implementierung                     |
| Simulation-Harness, Soak oder reine Simulationsaggregation            | `packages/ai/src/simulation/*`                                                                                                          |
| Runtime-nahe Score-Komponenten ohne Auswahl und ohne Fallback         | `packages/ai/src/runtime/*`                                                                                                             |
| Choice-Ranking-Override einer bestehenden Plan-/Action-Familie        | `packages/ai/src/runtime/choice-ranking/*`; `semantic-choice-ranking.ts` bleibt Orchestrator                                            |
| Corp-Scoreline-, Board-Triage- oder Scoring-Window-Komponente         | `packages/ai/src/runtime/corp-scoreline/*`; die drei bisherigen Rootmodule bleiben Fassaden                                             |
| Sichtbare Run-Kosten-, Pfad- oder Hazard-Projektion                   | `packages/ai/src/run-analysis/*`; `visible-run-analysis.ts` bleibt Consumer-Fassade                                                     |
| Runner-Handsignal oder Persistent-Install-Bewertung                   | `packages/ai/src/runner/hand-development/*`; `runner-hand-development.ts` bleibt Orchestrator                                           |
| Gemeinsamer Action-Semantik-Vertrag ohne Projektion                   | `packages/ai/src/action-semantic-candidate-types.ts`; Projektionslogik bleibt unter `actions/*`                                         |
| Aktuelle League-, Profil-Run- oder Simulations-Gate-Logik             | neutral benannt unter `packages/ai/src/simulation/*`; historische Fixtures ausschließlich unter `simulation/regression/<version>/`      |

## Negative Regeln

- Keine neue Fachlogik direkt in `index.ts`, wenn sie in `actions/`, `decision/`, `evaluation/`, `diagnostics/`, `reports/`, `runtime/` oder `simulation/` passt.
- Keine Runtime-Chooser-Imports in `evaluation/`.
- Keine Action-Chooser-Imports in `reports/`.
- Keine mutierende Auswahl in `diagnostics/`.
- Keine produktiven Target- oder Choice-Entscheidungen aus `target-choice-shadow`.
- Keine Proteus-KI-Freigabe durch Readiness-Dokumente oder Semantiktests.
- Keine historische Frameworkversion in aktuellen Simulationsverträgen,
  Benchmarktypen oder Public-Exports.
- Keine neuen Rückimporte fachlicher Module in ihre Orchestrator-Fassade;
  gemeinsame Typen gehören in ein reines Contractmodul.

## Entscheidungsfolge für neue Fixes

1. Betrifft die Änderung die Ableitung side-sicherer Action-Semantik aus LegalActions? Dann `actions/*`.
2. Betrifft sie Entscheidungsscoring, Zielausrichtung, Doctrine-Goals oder Pilot-Gates? Dann `decision/*`.
3. Betrifft sie Messung, Corpus, ShadowLeague, Readiness oder Delta? Dann `evaluation/*`.
4. Betrifft sie nur menschenlesbare Ausgabe? Dann `reports/*`.
5. Betrifft sie Entwicklerdiagnose ohne Runtime-Wirkung? Dann `diagnostics/*`.
6. Betrifft sie historische Regressionsevidence? Dann als unveränderliche,
   nicht ausführbare Fixture unter `evaluation/` oder
   `simulation/regression/`; alte Planner oder Baselines werden nicht neu
   angelegt.
7. Betrifft sie einen bestehenden Choice-, Corp-Scoreline-, Run-Analyse- oder
   HandDevelopment-Orchestrator? Dann in dessen fachliche Untergruppe legen
   und die Fassade nur verdrahten.
8. Betrifft sie öffentliche API-Fläche? Dann erst Public-Export-Contract und
   Modulgrenzen prüfen, danach minimal in `index.ts` beziehungsweise
   `simulation.ts` re-exportieren.

## Sicherheitsgrenzen

Alle Bereiche bleiben an dieselben NETGRID-Invarianten gebunden:

- KI nutzt ausschließlich aus `LegalActions` abgeleitete Handlungsoptionen.
- Keine Schicht erzeugt eigene Legalität.
- Hidden Information bleibt aus PlayerViews, AI-Inputs, Reports, Debug und Logs heraus.
- Replay, StateHash und Randomness bleiben Engine-Verträge und werden durch AI-Strukturarbeit nicht geändert.

## Anwendung auf Maturation IV

Maturation IV nutzt diese Zuordnung als Leitplanke:

- Semantic Runtime Score Families wandern nach `runtime/`.
- Simulation Metrics Aggregation wandert nach `simulation/`.
- Local Default Policy bleibt in `decision/pilot/`.
- TargetChoice Readiness bleibt in `evaluation/`, TargetChoice Dry-Run bleibt in `decision/target-choice-shadow`.
- DoctrineGoal ActionFit bleibt in `evaluation/`.
- Worklist- und Proteus-Pakete bleiben Semantik-/Readiness-Arbeit ohne Runtime-Freigabe.
