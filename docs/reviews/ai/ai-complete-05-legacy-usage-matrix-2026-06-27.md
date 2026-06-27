# AI-COMPLETE-05 Legacy-Nutzungsmatrix 2026-06-27

## Zweck

Diese Matrix klassifiziert die aktuellen Legacy-Nutzungen im AI-Paket fuer `AI-COMPLETE-05`.
Fuehrend ist der Code-Stand nach `refactor(ai): add legacy planner entrypoint`.

## Einstiegspunkte

| Bereich | Datei | Nutzung | Klassifikation | Zielzustand |
| --- | --- | --- | --- | --- |
| Produktiver Planner-Zugriff | `packages/ai/src/legacy/legacy-planner-entrypoints.ts` | Buendelt `chooseCorpPlanAction`, `hasCorpPlanAction`, `assessCorpScoreTerminalWindow`, `chooseRunnerPlanAction` und `hasRunnerPlanAction`. | Erlaubte interne Legacy-Eingangsschnittstelle fuer Legacy-Planfunktionen. | Bleibt einziger produktiver Importpfad zu Legacy-Planfunktionen, bis die Funktionen ersetzt oder entfernt sind. |
| Historische Facade | `packages/ai/src/runner-plans.ts` | Re-exportiert `legacy/runner-plans.ts`. | Kompatibilitaets-Fassade fuer historische Importe und Public Contract. | Keine neue produktive Callsite; spaeter entfernen oder auf explizite Legacy-Kompatibilitaet begrenzen. |
| Historische Facade | `packages/ai/src/corp-plans.ts` | Re-exportiert `legacy/corp-plans.ts`. | Kompatibilitaets-Fassade fuer historische Importe und Public Contract. | Keine neue produktive Callsite; spaeter entfernen oder auf explizite Legacy-Kompatibilitaet begrenzen. |
| Public Runtime Wiring | `packages/ai/src/ai-runtime-public-entrypoints.ts` | Verwendet Legacy-Planfunktionen ueber `legacy-planner-entrypoints`. | Produktiver Legacy-Fallback-/Override-Verbraucher. | Nach semantischer Migration nur noch Sicherheits-Fallback oder entfernen. |
| Public Exports | `packages/ai/src/index.ts` | Exportiert historische Runner-/Corp-Planfacades weiter. | Public-Contract-Kompatibilitaet, nicht neue Semantik. | Separat pruefen, ob Public Contract diese Legacy-Exports weiter braucht. |

## Runtime- und Scoring-Nutzungen

| Bereich | Datei | Nutzung | Klassifikation | Zielzustand |
| --- | --- | --- | --- | --- |
| Baseline-Entrypoints | `packages/ai/src/runtime/ai-action-entrypoints.ts` | Definiert Baseline-Entscheidungen, Plan-Overrides und Legacy-Provider fuer Semantic Runtime. | Erlaubter produktiver Baseline-/Fallback-Kontext. | Auf eine Legacy-Provider-Schnittstelle beschraenken; Legacy-Plan-Overrides spaeter durch semantische Planner ersetzen. |
| Entrypoint Composition | `packages/ai/src/runtime/ai-action-entrypoints-composition.ts` | Baut `scoreActionsForLegacy` in die AI-Entrypoints ein. | Erlaubter Legacy-Scoring-Adapter. | Behalten, bis produktive Scoring-Consumers Legacy-Scorer abloesen. |
| Action Exclusion Composition | `packages/ai/src/runtime/semantic-runtime-action-exclusion-composition.ts` | Erzeugt Legacy-Action-Scoring fuer Exclusion- und Self-Damage-Kontexte. | Erlaubter Legacy-Scoring-Adapter mit Migrationsbedarf. | Einzelne Exclusions auf semantische Scores/Contexts umstellen; Adapter danach entfernen. |
| Semantic Runtime | `packages/ai/src/runtime/semantic-runtime.ts` | Nutzt `semanticRuntimeForcedLegacy` und materialisiert Legacy nur bei Forced-Legacy, No-Candidate-Fallback oder Diagnosebedarf. | Erlaubter Safety-Fallback. | Forced-Legacy-Fallback als Release-Sicherung behalten, bis Cutover-Gates ihn ersetzen. |
| Semantic Runtime Decision Context | `packages/ai/src/runtime/semantic-runtime-decision-context.ts` | Memoisiert Legacy-Provider und reicht ihn an Semantic Runtime. | Erlaubte Lazy-Legacy-Kapselung. | Behalten, solange Runtime Legacy-Fallback kennt. |
| Runner Baseline Support | `packages/ai/src/runtime/runner-baseline-support-composition.ts` | Nutzt Legacy-Decision-Context fuer Runner-Support-Kompositionen. | Erlaubter Baseline-Kontext mit Migrationsbedarf. | Auf semantische Runner-Kontexte umstellen, sobald AI-COMPLETE-07/17 tragen. |

## Legacy-Implementierungen

| Bereich | Datei | Nutzung | Klassifikation | Zielzustand |
| --- | --- | --- | --- | --- |
| Runner Legacy Planner | `packages/ai/src/legacy/runner-plans.ts` | Voller historischer Runner-Planer, 8796 Zeilen. | Eingefrorene Fallback-/Regression-Implementierung. | Keine neue Semantik; schrittweise ersetzen und geloeschte Bereiche entfernen. |
| Corp Legacy Planner | `packages/ai/src/legacy/corp-plans.ts` | Voller historischer Corp-Planer, 9793 Zeilen. | Eingefrorene Fallback-/Regression-Implementierung. | Keine neue Semantik; schrittweise ersetzen und geloeschte Bereiche entfernen. |
| Runner Legacy Action Scorer | `packages/ai/src/legacy/runner-baseline-action-score.ts` | Runner-Baseline-Action-Scoring, 632 Zeilen. | Legacy-Scoring-Implementierung. | Durch semantische Scoring-Consumers ersetzen. |
| Corp Legacy Action Scorer | `packages/ai/src/legacy/corp-baseline-action-score.ts` | Corp-Baseline-Action-Scoring, 394 Zeilen. | Legacy-Scoring-Implementierung. | Durch semantische Scoring-Consumers ersetzen. |
| Legacy Action Dispatcher | `packages/ai/src/legacy/legacy-action-scorer.ts` | Side-spezifischer Dispatcher fuer Legacy-Scorer. | Erlaubter Legacy-Scoring-Adapter. | Entfernen, wenn Runtime keine Legacy-Scorer mehr braucht. |
| Legacy Scoring Composition | `packages/ai/src/legacy/legacy-action-scoring-composition.ts` | Erzeugt Runner-/Corp-Legacy-Scorer. | Erlaubte Composition-Grenze. | Entfernen, wenn Scorer ersetzt sind. |
| Legacy Decision Context | `packages/ai/src/legacy/legacy-decision-context.ts` | Decision-Assembly und Selected-Choices-Aufloesung. | Erlaubter Baseline-Kontext. | Entfernen, wenn keine Legacy-Decision mehr materialisiert wird. |
| Legacy Baseline | `packages/ai/src/legacy/legacy-baseline.ts` | Baseline-Helfer fuer Entrypoints. | Erlaubter Baseline-Adapter. | In Runtime-Baseline-Kontext integrieren oder entfernen. |
| Legacy Runtime Fallback | `packages/ai/src/legacy/legacy-runtime-fallback.ts` | Env-Flag fuer Forced-Legacy. | Release-Sicherheitsadapter. | Spaeter durch explizites Release-Gate ersetzen. |

## Diagnostik und Simulation

| Bereich | Datei/Gruppe | Nutzung | Klassifikation | Zielzustand |
| --- | --- | --- | --- | --- |
| Shadow-/Comparison-Diagnostik | `packages/ai/src/controlled-shadow-mode.ts`, `packages/ai/src/shadow-scoring-diagnostics.ts` | Vergleicht Legacy-Referenzen mit semantischen Entscheidungen. | Diagnose-only, kein produktiver Selector. | Behalten, solange Cutover-Vergleich gebraucht wird; nicht als produktive Entscheidung verwenden. |
| Simulation Decision Context | `packages/ai/src/simulation/simulation-decision-context.ts` und Simulation Compositions | Nutzt Baseline-Entscheider als Vergleichs-/Harness-Abhaengigkeit. | Simulation/Benchmark. | Behalten, aber als explizite Baseline-Abhaengigkeit dokumentieren. |
| Corp Simulation Diagnostics | `packages/ai/src/simulation/corp-*-diagnostics.ts` und verwandte Dateien | Importieren teils historische `corp-plans.ts`-Facade fuer Diagnosehelfer. | Diagnose-/Metriknutzung mit Migrationsbedarf. | Auf dedizierte Diagnose-/Ontology-Module oder `legacy-planner-entrypoints` umstellen. |

## Naechste Schnitte

1. Produktive Direktimporte auf Legacy-Kompatibilitaetsfacades weiter reduzieren.
2. Simulation-/Diagnoseimporte aus `corp-plans.ts` fachlich klassifizieren und auf dedizierte Diagnosemodule umstellen.
3. Legacy-Scoring-Adapterverbraucher nach Semantic-Scoring-Ownern aufteilen.
4. Legacy-Planer-Dateien einfrieren: Boundary-Test soll neue produktive Importe oder neue Semantik in `legacy/runner-plans.ts` und `legacy/corp-plans.ts` verhindern.
