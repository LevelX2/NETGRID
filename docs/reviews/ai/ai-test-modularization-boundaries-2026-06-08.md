# AI-Testmodularisierung: Zielgrenzen 2026-06-08

## Anlass

`packages/ai/src/index.test.ts` bleibt ein wichtiges Sicherheitsnetz, soll aber nicht weiter der Default-Ort für jede neue AI-Regression sein. Der erste konkrete Schnitt verschiebt Benchmark-Report- und Gate-Tests nach `packages/ai/src/simulation/benchmark-reports.test.ts`.

## Zielorte für neue Regressionen

- Runtime-/Controller-Verträge: nahe an `packages/ai/src/runtime/`, besonders für `AiDecisionInput -> AiDecision`, Side-Auswahl, DTO-/Hidden-Info-Grenzen und No-Candidate-Verhalten.
- Legacy-/Fallback-Verträge: nahe an `packages/ai/src/legacy/`, besonders für Baseline-, Notaus- und Referenzpfade.
- Simulation, Soak, Benchmark und Reports: unter `packages/ai/src/simulation/`; Simulation darf abgeschlossene `GameState`- und Metrikdaten auswerten, darf aber keine Live-Entscheidungsgrundlage werden.
- Runner-spezifische Regressionen: in bestehende Runner-Testdateien wie `runner-run-target-evaluation.test.ts`, `runner-tactical-goals.test.ts`, `runner-golden-deck-debug.test.ts` oder in eine fokussierte `runner-regressions.test.ts`, wenn kein nahes Modul passt.
- Corp-spezifische Regressionen: nahe an Corp-Modulen wie `corp-plans` oder in eine fokussierte `corp-regressions.test.ts`, wenn der betroffene Vertrag noch im Monolithen hängt.

## Restrolle von `index.test.ts`

`index.test.ts` bleibt als altes Integrations- und Sicherheitsnetz erhalten. Neue Tests gehören dort nur hinein, wenn sie bewusst den öffentlichen Gesamtvertrag des AI-Pakets prüfen oder wenn der Zielcode noch keine tragfähige Modulgrenze hat.
