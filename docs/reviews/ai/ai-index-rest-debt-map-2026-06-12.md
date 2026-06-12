# AI Index Rest Debt Map

Datum: 2026-06-12

Status: diagnostisch, aktualisiert nach AI-MAT-17. Dieses Paket nimmt keine große `index.ts`-Extraktion vor, sondern markiert die restlichen Schnittflächen nach dem AI-Structural-Play-Strength-Konsolidierungsstand und der nachgezogenen Play-Strength-Debug-Erweiterung.

## Inventar

- Datei: `packages/ai/src/index.ts`
- Umfang nach AI-MAT-17: 35.984 Zeilen
- Inventar-Kommandos:
  - `(Get-Content packages/ai/src/index.ts).Count`
  - `rg -n "function |const |let |class " packages/ai/src/index.ts`
  - `rg -n "decisionFromChoices|scoreActions|semanticRuntimeDecisionDebug|simulate|benchmark|format|ScoreRow|Why" packages/ai/src/index.ts`
  - `rg -n "semanticRuntimeDecisionDebug|targetChoiceShadowDebugItems|doctrineGoalDebugItems|semanticRuntimeActionAlternatives|decisionFromChoices|scoreActions" packages/ai/src/index.ts`

## Delta nach AI-MAT-17

- `semanticRuntimeDecisionDebug` beginnt weiter in `packages/ai/src/index.ts:3768`.
- Die reinen Debug-Item-Helfer sitzen jetzt gebündelt um `targetChoiceShadowDebugItems` (`:3957`), `doctrineGoalDebugItems` (`:3994`) und `mistakeSummaryDebugItems` (`:4046`).
- `diagnostics/decision-debug.ts` ist bereits der Besitzer der `detailSections`-Form, aber `index.ts` liefert noch die Runtime-spezifischen Section-Items.
- Der nächste sichere Strukturzug ist deshalb nicht `scoreActions`, sondern ein enger `diagnostics/semantic-runtime-debug.ts`-Schnitt für Runtime-Debug-Item-Erzeugung plus `semanticRuntimeDecisionDebug`-Zusammenbau.

## Debt-Matrix

| Block | Zeilenbereich | Verantwortung heute | Zielmodul | Extraktionsrisiko | Benötigte Tests | Empfohlener Schnitt |
| --- | ---: | --- | --- | --- | --- | --- |
| Benchmark- und Deck-Manifeste | 2246-2454 | JSON-Adapter, Deck-Slots, lokale Benchmark-Profile | `evaluation/benchmark-manifest-adapters.ts` | Mittel: Datenformate und lokale private Decklisten dürfen nicht mit Runtime gekoppelt werden. | `src/index.test.ts`, Benchmark-Adapter-Unit-Tests, Typecheck | Reine Loader/Normalizer exportieren; `index.ts` behält nur Public API-Reexports. |
| Public AI Entry Points | 3298-3456 | `chooseAiAction`, Corp-/Runner-Auswahl, Semantic-Runtime-Bridge | `runtime/public-ai-actions.ts` und `runtime/semantic-runtime-adapter.ts` | Hoch: Public API, Fallback-Regeln und Runtime-Flag-Verhalten sind regressionskritisch. | `src/index.test.ts`, `src/semantic-ai-runtime-cutover.test.ts`, AI Full Test | Erst Adapter extrahieren, dann Entry-Point-Reexports im `index.ts` stabil halten. |
| Semantic Runtime Adjustments und Debug | 3458-4054 | Run-only-Korrekturen, Pilot-Evidence, DecisionDebug-Diagnostik, TargetChoiceShadow-, DoctrineGoal- und Mistake-Section-Items | `runtime/semantic-runtime-adjustments.ts`, `diagnostics/semantic-runtime-debug.ts` | Hoch: darf Auswahl nicht aus Debugdaten ableiten und darf keine Hidden Marker durchreichen. | `src/diagnostics/decision-debug.test.ts`, `src/semantic-ai-runtime-cutover.test.ts`, `src/index.test.ts` | Debug-Item-Helfer und `semanticRuntimeDecisionDebug` zuerst herauslösen; Runtime-Auswahlfunktionen getrennt lassen. |
| Tactical-Plan- und Memory-Debug | 4056-4551 | Plan-Detailsektionen, Memory Facts, OpponentModel-Debug | `diagnostics/tactical-plan-debug.ts`, `diagnostics/semantic-memory-debug.ts` | Mittel: Seitensicherheit und deutsche UI-/Debug-Texte müssen stabil bleiben. | `src/index.test.ts`, Runner-Golden-Debug-Tests, Redaction-Tests | Pure Formatter mit side-safe Inputs; keine Selector-Imports in Diagnostics. |
| Runtime Alternatives und Score Breakdown | 4553-5007 | Ranked/action alternatives, whyChosen/whyNot, Score-Komponenten | `diagnostics/semantic-alternatives-debug.ts`, `runtime/semantic-score-breakdown.ts` | Hoch: Debug-Scores und Auswahlprioritäten sind eng gekoppelt. | `src/index.test.ts`, `src/semantic-ai-runtime-cutover.test.ts`, Snapshot/Contract-Tests | Score-Komponenten als Runtime-Modul, Anzeigegründe als Diagnostics-Modul trennen. |
| Semantic Exclusions und Runner Board Evaluators | 5008-10673 | Action-Exclusions, Blink/Rig/Bank/Run-Payoff-Regeln | bestehende Runner- und Runtime-Module, plus `runtime/semantic-exclusions.ts` | Hoch: Engine-Korrektheit und LegalAction-Grenzen berühren viele Tests. | `src/index.test.ts`, Runner-Fokus-Tests, relevante Engine-Smokes bei Verhaltensänderung | Nur thematische Cluster mit vorhandenen Tests schneiden; keine Sammel-Extraktion. |
| Legacy Decision Core | 10674, 13386, 15338ff. | Fallback-Wahl, `decisionFromChoices`, `scoreActions` | `legacy/decision-from-choices.ts`, `legacy/action-scoring.ts` | Hoch: Legacy bleibt Referenz für Debug und Fallbacks. | `src/index.test.ts`, Legacy-Baseline-Tests, Runtime-Cutover | Erst type-only Schnitt einführen, dann Scoring-Funktionen verschieben. |
| Simulation Entry Points | 11418-11761 | `simulateAiGame`, `simulateAiSoak`, Controller-Loop | `simulation/simulate-ai-game.ts`, `simulation/simulate-ai-soak.ts` | Mittel bis hoch: deterministisches Replay, Seed und Action-Application dürfen sich nicht ändern. | Simulation-Smokes, `src/index.test.ts`, StateHash-/Replay-Checks falls betroffen | Runtime-unabhängige Simulations-API extrahieren; Engine-Aufrufe unverändert lassen. |
| Benchmark Deck Adapter | 11839-12824, 13224 | Snapshot-/Frozen-/Local-Deck-Benchmark-Adapter | `evaluation/benchmark-deck-adapters.ts` | Mittel: lokale Datenvalidierung und Unsupported-Card-Fehler müssen gleich bleiben. | Benchmark-Adapter-Tests, `src/index.test.ts`, Typecheck | Public Funktionen reexportieren; private Manifesttypen ins Zielmodul verschieben. |
| Report- und Format-Funktionen | 12825, importierte `format*`-Marker | Berichtstexte, Doctrine-Quality-Ausgaben, Debugfeldformatierung | `simulation/benchmark-reports.ts`, `diagnostics/debug-format.ts` | Niedrig bis mittel: Textsnapshots können brechen. | Format-Unit-Tests, Snapshot-Tests, `src/index.test.ts` | Nur reine Formatter verschieben; keine Metrikberechnung mitnehmen. |
| Match-Progression- und Doctrine-Metriken | 18840, 20257-23194, 35387-35781 | Action-Sequenz-Metriken, Score-Window-Zähler, Doctrine-Tags | `simulation/match-progression-metrics.ts`, `simulation/doctrine-quality-metrics.ts` | Hoch: Auswertung ist breit mit Simulation, Benchmark und Reports verflochten. | Match-Progression-Benchmark-Tests, Doctrine-Quality-Tests, `src/index.test.ts` | Metriktypen und pure Aggregatoren zuerst; Simulation nur als Producer anbinden. |
| Kleine Utilities | 35930-35984 | `sortedUnique`, Hashing, Runden, Record-Parsing, Debug-Helfer | `utils/ai-format-utils.ts` oder bestehende Zielmodule | Niedrig, aber nur nach Owner-Klärung sinnvoll. | Typecheck, betroffene Unit-Tests | Nicht vorziehen; erst verschieben, wenn ein Fachblock diese Helper mitnimmt. |

## Schlussfolgerungen

1. Der nächste sinnvolle Strukturzug ist nicht eine pauschale `index.ts`-Kürzung, sondern eine Folge kleiner Owner-Schnitte mit bestehendem Testanker.
2. `DecisionDebug` bleibt der beste nächste Extraktionskandidat: AI-CONS-9 hat den Diagnostics-Builder etabliert, AI-MAT-17 hat die fehlende `doctrine_goal`-Section ergänzt, und die Runtime-Auswahl bleibt davon getrennt.
3. `scoreActions` und `decisionFromChoices` sind wichtig, aber risikoreicher: Sie sollten erst nach einem type-only Contract und fokussierten Legacy-Baseline-Tests bewegt werden.
4. Simulation und Benchmark-Adapter können separat geschnitten werden, solange Seed, RandomCounter, Replay und Engine-Apply-Pfad unverändert bleiben.
5. Runner-Board-Evaluator-Blöcke bleiben fachlich kritisch. Dort ist pro Mechanik-Cluster ein eigener Paketauftrag nötig.

## Empfohlene Folgepakete

- AI-STRUCT-NEXT-1: `semanticRuntimeDecisionDebug` und die lokalen Debug-Item-Helfer (`semanticShadowTopDebugItems`, `pilotScopeDebugItems`, `calibrationProfileDebugItems`, `targetChoiceShadowDebugItems`, `doctrineGoalDebugItems`, `mistakeSummaryDebugItems`) aus `index.ts` nach `diagnostics/semantic-runtime-debug.ts` verschieben.
- AI-STRUCT-NEXT-2: Benchmark-Deck-Adapter und Manifestnormalisierung aus `index.ts` in `evaluation/benchmark-deck-adapters.ts` verschieben.
- AI-STRUCT-NEXT-3: `decisionFromChoices` mit minimalem Legacy-Contract in `legacy/decision-from-choices.ts` extrahieren.
- AI-STRUCT-NEXT-4: `scoreActions` in `legacy/action-scoring.ts` vorbereiten, aber nur mit unveränderten Public-Reexports.
- AI-STRUCT-NEXT-5: Match-Progression-Metrik-Aggregatoren in ein reines Simulation-Metrikmodul schneiden.

## Nicht geändert

- Keine Public API wurde in diesem Paket verschoben.
- Keine Runtime-Auswahl, Scoring-Regel oder Engine-Anbindung wurde geändert.
- Keine produktive Aktivierung von Shadow-, Calibration- oder TargetChoiceShadow-Diagnostik wurde vorgenommen.
