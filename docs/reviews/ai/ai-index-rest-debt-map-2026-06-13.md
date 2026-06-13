# AI Index Rest Debt Map nach Maturation IV Schnitt 4/5

Status: complete

## Messung

Datei: `packages/ai/src/index.ts`

| Messpunkt | Wert |
| --- | ---: |
| Aktuelle Zeilen per `Get-Content(...).Count` | 36182 |
| Treffer `function |const |let |class ` | 3630 |
| Treffer `scoreActions|decisionFromChoices|simulate|benchmark|Debug|ScoreRow|Why` | 191 |

Gezielte Anker:

```text
chooseSemanticRuntimeAction: line 3442
semanticRuntimeDecisionDebug: line 3765
semanticRuntimeScoreBreakdown: line 4807
simulateAiGame: line 11745
simulateAiSoak: line 12088
decisionFromChoices: line 13669
scoreActions: line 15606
summarizeMatchProgressionMetrics: line 20647
```

## Abgeschlossene Schnitte in AI-MAT4

- `runtime/semantic-runtime-score-components.ts`: Runtime-Choice-Anreicherung, runtime-spezifische Confidence, Score-Rundung und Evidence-Scrubbing.
- `simulation/simulation-metric-aggregation.ts`: Doctrine-Metric-Namen, Doctrine-Summen, Doctrine-Deltas und gemeinsame Durchschnittsberechnung.
- `reports/simulation-report-formatters.ts`: nutzt die zentrale Doctrine-Metric-Liste.

Diese Schnitte ändern keine Auswahlfunktion, keinen Legacy-Fallback, keine Simulation-Seeds, keine Engine-Aufrufe und keine Randomness.

## Restschuld

`index.ts` bleibt fachlich zu groß. Die nächsten sinnvollen Schnitte sind nicht mechanisch, sondern nach Verantwortungsgrenzen:

1. Semantic Runtime Decision Assembly: `chooseSemanticRuntimeAction`, Runtime-Dependency-Zusammenbau und DecisionDebug-Orchestrierung.
2. Runtime Score Families: größere Scoring-Familien wie Bank, No-Run-Economy, Coverage, RemoteContest und CorpScoreWindow.
3. Simulation Harness: `simulateAiGame`, `simulateAiSoak`, Benchmark-Adapter und MatchProgression-Zusammenbau.
4. Legacy Baseline: `scoreActions`, `decisionFromChoices` und alte RankedChoice-Helfer.
5. Simulation Diagnostics: lange `*ForMetrics`-Helper rund um RemoteTrash, CentralPressure, CorpScore und RunnerReserve.

## Platzierungsregel

Neue KI-Fixes werden ab diesem Stand nach `docs/architecture/ai/ai-play-strength-development-placement-guide-2026-06-13.md` einsortiert. Direkte neue Fachlogik in `index.ts` braucht einen begründeten Public-Facade-Schnitt.

## Check

AI-MAT4-4 ist dokumentarisch. Paketnahe Codechecks stammen aus AI-MAT4-2 und AI-MAT4-3:

```text
runtime score components test: grün
simulation metric aggregation test: grün
semantic runtime cutover test: grün
simulation harness test: grün
index.test.ts: grün
@netgrid/ai typecheck: grün
git diff --check: grün
```
