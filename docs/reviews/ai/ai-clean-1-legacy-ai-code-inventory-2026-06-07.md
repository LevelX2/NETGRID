# AI-CLEAN-1 Legacy-KI-Code-Inventar

Datum: 2026-06-07
Status: abgeschlossenes Architektur-Review
Primärer Agent: `architecture-review-agent`

## Befund

Es gibt nach aktuellem Stand keinen eindeutig toten KI-Entscheidungspfad, der ohne Folgerisiko gelöscht werden sollte. Die alten Runner-/Corp-Planer, `ActionScore`-Helfer und `ownDeckDoctrine.planWeights` sind im Default-Pfad zwar nicht mehr die primäre Entscheidungautorität, werden aber weiterhin als Legacy-Entscheidung berechnet und bleiben für `NETGRID_SEMANTIC_AI_RUNTIME=legacy` sowie den `semantic_runtime_no_non_excluded_legal_action`-Fallback wirksam.

AI-CLEAN-2 sollte deshalb klein bleiben: keine breite Code-Löschung, sondern höchstens gezielte Entfernung einzelner später belegter Exporte oder Reports. In diesem Review wurden keine `dead_code`-Pfade bestätigt.

AI-CLEAN-3 ist der wichtigere Folgeschnitt. Mehrere alte Namen klingen nach aktiver Zielarchitektur, obwohl sie heute Legacy-Fallback, Diagnose oder Übergangsschicht sind. Diese Pfade sollten markiert oder umbenannt werden, ohne ihre Fallback-Funktion zu entfernen.

Die geprüften Pfade bleiben auf `LegalActions`, `PlayerView` und side-sichere Debug-/DTO-Ausgaben begrenzt. Hidden-Info-, `applyAction`-, Engine-, Replay-, StateHash- und Randomness-Grenzen werden durch dieses Inventar nicht verändert.

## Geprüfte Quellen

- `docs/reviews/ai/semantic-ai-runtime-cutover-2026-06-04.md`
- `docs/architecture/ai/ai-plan-3-8-deck-capability-tactical-plans-automation-process-2026-06-06.md`
- `docs/reviews/ai/ai-plan-3-8-deck-capability-tactical-plans-final-report-2026-06-06.md`
- `docs/architecture/ai/ai-strat-runner-intent-run-target-goals-automation-process-2026-06-07.md`
- `docs/reviews/ai/ai-strat-runner-intent-goals-final-report-2026-06-07.md`
- `packages/ai/src/index.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/deck-doctrine-strategy.ts`
- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/action-doctrine-goal-diagnostics.ts`
- `packages/ai/src/controlled-shadow-mode.ts`
- `packages/ai/src/runner-strategic-intent.ts`
- `packages/ai/src/runner-run-target-evaluation.ts`
- `packages/ai/src/runner-tactical-goals.ts`
- `apps/web/app/api/decks/strategy-profile/strategy-profile-data.ts`
- `apps/web/app/deck-strategy-profile-ui.ts`
- relevante Tests unter `packages/ai/src/*.test.ts` und `apps/web/app/*strategy-profile*.test.ts`

## Livepfad

| Pfad                                                                                            | Klassifikation                              | Begründung                                                                                                                                                                               | Folgeaktion                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/ai/src/index.ts:3338` `chooseAiAction`                                                | `runtime_active`                            | Zentraler Entrypoint für Corp und Runner. Routing geht weiter über side-spezifische Action-Builder.                                                                                      | Behalten. Keine AI-CLEAN-2-Löschung.                                    |
| `packages/ai/src/index.ts:3347` `chooseCorpAction`                                              | `runtime_active` mit Legacy-Fallback-Anteil | Berechnet zuerst Baseline und alten Corp-Plan, übergibt aber anschließend an `chooseSemanticRuntimeAction`.                                                                              | Für AI-CLEAN-3 als "semantic entry with legacy fallback" dokumentieren. |
| `packages/ai/src/index.ts:3363` `chooseRunnerAction`                                            | `runtime_active` mit Legacy-Fallback-Anteil | Berechnet Baseline und optional alten Runner-Plan, übergibt aber anschließend an `chooseSemanticRuntimeAction`.                                                                          | Für AI-CLEAN-3 analog markieren.                                        |
| `packages/ai/src/index.ts:3398` `chooseSemanticRuntimeAction`                                   | `runtime_active`                            | Default-Entscheidungspfad. Nutzt Semantic Choices, DeckCapabilities, RunnerStrategicIntent, RunTargetEvaluation, EconomyPosture, HandDevelopment, RunnerTacticalGoals und TacticalPlans. | Behalten. Kein Legacy-Entfernungspunkt.                                 |
| `packages/ai/src/action-semantic-candidate.ts:293` `buildActionSemanticCandidates`              | `runtime_active`                            | Liefert die semantische Mapping-Grundlage für `evaluateTacticalPlans`; der Neutralkandidat ist nur Fallback innerhalb dieses Builders.                                                   | Behalten.                                                               |
| `packages/ai/src/tactical-plans.ts:284` `buildTacticalPlans` und `:292` `evaluateTacticalPlans` | `runtime_active`                            | Wird im Semantic Runtime-Pfad ausgewertet, außer bei reaktiven Choices. Verwendet redaktierte Debugfacts und mappt PlanSteps zurück auf aktuelle `LegalActions`.                         | Behalten.                                                               |
| `packages/ai/src/runner-strategic-intent.ts:68` `buildRunnerStrategicIntentProfile`             | `runtime_active`                            | Runner-spezifische strategische Eingabe für Semantic Runtime und TacticalPlans.                                                                                                          | Behalten.                                                               |
| `packages/ai/src/runner-run-target-evaluation.ts:127` `buildRunnerEconomyPosture`               | `runtime_active`                            | Lauf- und Ökonomie-Kontext im Runner-Pfad.                                                                                                                                               | Behalten.                                                               |
| `packages/ai/src/runner-run-target-evaluation.ts:362` `evaluateRunnerRunTargets`                | `runtime_active`                            | Bewertet sichtbare Run-Ziele für Runner TacticalPlans.                                                                                                                                   | Behalten.                                                               |
| `packages/ai/src/runner-tactical-goals.ts:52` `buildRunnerTacticalGoals`                        | `runtime_active`                            | Erzeugt taktische Runner-Ziele, die in `evaluateTacticalPlans` verbraucht und redaktiert debuggt werden.                                                                                 | Behalten.                                                               |

## Notaus- und Fallbackpfad

| Pfad                                                                 | Klassifikation                                                      | Begründung                                                                                                                                     | Folgeaktion                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/ai/src/index.ts:3773` `semanticRuntimeForcedLegacy`        | `fallback_only`                                                     | `NETGRID_SEMANTIC_AI_RUNTIME=legacy` schaltet bewusst auf Legacy-Entscheidung zurück.                                                          | Behalten, solange der Notaus vertraglich gebraucht wird.                         |
| `packages/ai/src/index.ts:3403` Force-Legacy-Branch                  | `fallback_only`                                                     | Gibt `legacyDecision` mit Evidence `semantic_runtime_force_legacy` zurück.                                                                     | Nicht löschen.                                                                   |
| `packages/ai/src/index.ts:3498` No-Candidate-Fallback                | `fallback_only`                                                     | Wenn alle semantischen LegalActions ausgeschlossen sind, bleibt die Legacy-Entscheidung die abgesicherte Rückgabe.                             | Nicht löschen.                                                                   |
| `packages/ai/src/index.ts:3359` `chooseCorpBaselineAction`           | `fallback_only` und `keep_but_rename`                               | Baseline wird vor Semantic Runtime berechnet und kann über Notaus/Fallback tatsächliche Entscheidung werden.                                   | In AI-CLEAN-3 als `legacyCorpBaselineAction` oder per Kommentar markieren.       |
| `packages/ai/src/index.ts:3382` `chooseRunnerBaselineAction`         | `fallback_only` und `keep_but_rename`                               | Wie Corp-Baseline; zusätzlich Schutzlogik für reaktive Runner-Entscheidungen.                                                                  | In AI-CLEAN-3 als `legacyRunnerBaselineAction` oder per Kommentar markieren.     |
| `packages/ai/src/index.ts:10213` `decisionFromChoices`               | `fallback_only`                                                     | Baut die Baseline-Entscheidung aus ActionScores.                                                                                               | Behalten; Namen optional mit Legacy-Kontext versehen.                            |
| `packages/ai/src/index.ts:11305` `scoreActions`                      | `fallback_only` und `keep_but_rename`                               | Alter ActionScore-Sammler für Baseline. Wird weiterhin berechnet.                                                                              | AI-CLEAN-3: Kommentar oder Umbenennung Richtung `scoreLegacyBaselineActions`.    |
| `packages/ai/src/index.ts:11314` `scoreRunnerAction`                 | `fallback_only` und `keep_but_rename`                               | Runner-Baseline-Heuristik inklusive Doctrine-/Opening-/Run-Heuristiken.                                                                        | AI-CLEAN-3: Legacy-Fallback-Markierung.                                          |
| `packages/ai/src/index.ts:11760` `scoreCorpAction`                   | `fallback_only` und `keep_but_rename`                               | Corp-Baseline-Heuristik inklusive Doctrine-/Opening-/Remote-Heuristiken.                                                                       | AI-CLEAN-3: Legacy-Fallback-Markierung.                                          |
| `packages/ai/src/runner-plans.ts:512` `chooseRunnerPlanAction`       | `fallback_only` und `keep_but_rename`                               | Kann die Legacy-Entscheidung prägen, wird aber im Default nur als Fallback-Autorität verwendet.                                                | Nicht löschen; AI-CLEAN-3 sollte Namen/Doku schärfen.                            |
| `packages/ai/src/runner-plans.ts:559` `chooseRunnerPlanDecision`     | `fallback_only` / `test_only`                                       | Planentscheidung wird von `chooseRunnerPlanAction` und zahlreichen Tests genutzt.                                                              | Behalten; ggf. als Legacy-Plan-Decision markieren.                               |
| `packages/ai/src/runner-plans.ts:674` `generateRunnerPlanCandidates` | `fallback_only` / `test_only`                                       | Kandidatenbasis des alten Runner-Planers; Tests prüfen weiterhin Candidate-Form und Regressionen.                                              | Nicht in AI-CLEAN-2 löschen.                                                     |
| `packages/ai/src/runner-plans.ts:783` `evaluateRunnerPlan`           | `fallback_only` / `test_only`                                       | Bewertet alte PlanCandidates und ist für Legacy-Fallback erklärungsrelevant.                                                                   | Behalten.                                                                        |
| `packages/ai/src/corp-plans.ts:611` `chooseCorpPlanAction`           | `fallback_only` und `keep_but_rename`                               | Wie Runner-PlanAction für Corp.                                                                                                                | Nicht löschen; AI-CLEAN-3 markieren.                                             |
| `packages/ai/src/corp-plans.ts:658` `chooseCorpPlanDecision`         | `fallback_only` / `test_only`                                       | Alter Corp-Planentscheider, weiterhin Fallback- und Testfläche.                                                                                | Behalten.                                                                        |
| `packages/ai/src/corp-plans.ts:777` `generateCorpPlanCandidates`     | `fallback_only` / `test_only`                                       | Kandidatenbasis des alten Corp-Planers.                                                                                                        | Nicht in AI-CLEAN-2 löschen.                                                     |
| `packages/ai/src/corp-plans.ts:877` `evaluateCorpPlan`               | `fallback_only` / `test_only`                                       | Bewertet alte Corp-Pläne; für Fallback-Debug erklärungsrelevant.                                                                               | Behalten.                                                                        |
| `packages/ai/src/deck-doctrine.ts:60` `buildDeckDoctrineProfile`     | `runtime_active` für Inputbau, `fallback_only` für alte PlanWeights | `buildAiDecisionInput` baut `ownDeckDoctrine`; alte Planer und Baseline-Scores lesen `planWeights`, neue TacticalPlans lesen sie nicht direkt. | Behalten; AI-CLEAN-3 sollte `planWeights` als Legacy-Fallback-Weights markieren. |
| `packages/ai/src/deck-doctrine.ts:102` `evaluateCorpOpeningHand`     | `fallback_only` / `test_only`                                       | Von Baseline/Legacy-Heuristiken und Tests genutzt.                                                                                             | Behalten.                                                                        |
| `packages/ai/src/deck-doctrine.ts:142` `evaluateRunnerOpeningHand`   | `fallback_only` / `test_only`                                       | Von Baseline/Legacy-Heuristiken und Tests genutzt.                                                                                             | Behalten.                                                                        |

## Diagnose- und UI-Pfade

| Pfad                                                                                                             | Klassifikation                            | Begründung                                                                                                  | Folgeaktion                                      |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `packages/ai/src/deck-doctrine-strategy.ts:277` `buildDeckStrategyProfile`                                       | `diagnostic_only`                         | Der Typ deklariert `source.mode: "diagnostic_only"` und `plannerEffect: "none"`.                            | Nicht löschen; bereits klar markiert.            |
| `packages/ai/src/deck-doctrine-strategy.ts:119` `legacySignalCounts`                                             | `diagnostic_only`                         | Zählt Legacy-Signale für Viewer/Analyse, nicht für Runtime-Entscheidungen.                                  | Behalten, Name ist passend.                      |
| `apps/web/app/api/decks/strategy-profile/strategy-profile-data.ts:85` `buildDeckStrategyProfile`-Verbrauch       | `diagnostic_only`                         | API/Viewermodell nutzt Strategieprofil zur Darstellung und grenzt Plannerwirkung aus.                       | Behalten.                                        |
| `apps/web/app/deck-strategy-profile-ui.ts:81` Diagnosehinweise                                                   | `diagnostic_only`                         | UI trennt `diagnostic_only` und `runtime_projection`; Filter blockieren verbotene Felder wie `planWeights`. | Behalten.                                        |
| `packages/ai/src/action-doctrine-goal-diagnostics.ts:83` Diagnose-Scope                                          | `diagnostic_only`                         | Report- und Taxonomie-Mapping ohne Entscheidungsverbrauch.                                                  | Behalten.                                        |
| `packages/ai/src/controlled-shadow-mode.ts:537` Default-Config                                                   | `diagnostic_only`                         | Shadow-Harness ist default-off und garantiert `actualDecision_equals_legacyDecision`.                       | Behalten.                                        |
| `packages/ai/src/controlled-shadow-mode.ts:1211` `runRuntimeShadowHarness`                                       | `diagnostic_only`                         | Bei aktivierter Diagnose entsteht ShadowTrace, tatsächliche Entscheidung bleibt Legacy-Input.               | Behalten.                                        |
| `packages/ai/src/controlled-shadow-mode.ts:1244` `buildRuntimeShadowHarnessReport`                               | `diagnostic_only`                         | Report erklärt Default-Off- und No-Runtime-Effect-Vertrag.                                                  | Behalten.                                        |
| `packages/ai/src/index.ts:3848` `semanticRuntimeDecisionDebug`                                                   | `diagnostic_only` mit Runtime-Entstehung  | Debug entsteht im Runtimepfad, beeinflusst aber die Entscheidung nicht. Redaktierte Facts werden verwendet. | Behalten; keine öffentlichen Payloads erweitern. |
| `packages/ai/src/tactical-plans.ts:442` `getTacticalPlanMemorySnapshot` und `:452` `rememberTacticalPlanRuntime` | `runtime_active` mit Debug-/Memory-Anteil | PlanMemory beeinflusst Planfortschritt und Ausschlüsse, ist kein rein totes Debugfeld.                      | Behalten.                                        |

## Test-, Fixture- und Reportnutzung

| Pfad                                                          | Klassifikation                                   | Begründung                                                                                                               | Folgeaktion                                     |
| ------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `packages/ai/src/index.test.ts` PlanDecision-/Candidate-Tests | `test_only` plus Fallback-Schutz                 | Tests importieren und prüfen alte Runner-/Corp-Planer weiterhin breit. Das schützt Notaus/Fallback-Regressionsverhalten. | Nicht löschen, solange Fallback existiert.      |
| `packages/ai/src/controlled-shadow-mode.test.ts`              | `test_only`                                      | Prüft Default-Off-Diagnosevertrag und dass Actual Decision unverändert bleibt.                                           | Behalten.                                       |
| `packages/ai/src/tactical-plans.test.ts`                      | `test_only` für Runtime-Pläne                    | Testet aktive TacticalPlan-Schicht.                                                                                      | Behalten.                                       |
| Historische Reviews unter `docs/reviews/ai/`                  | `diagnostic_only` / `test_only` im weiteren Sinn | Erklären Entscheidungen und Übergänge; Activity schließt Dokumentationslöschung aus.                                     | Nicht Bestandteil von AI-CLEAN-2.               |
| Datenreports und Readiness-Artefakte zu Shadow/Semantik       | `diagnostic_only`                                | Evidence für Gate- und Architekturentscheidungen.                                                                        | Nicht löschen ohne separates Doku-Aufräumpaket. |

## AI-CLEAN-2-Kandidaten

Bestätigte `dead_code`-Kandidaten: keine.

Bestätigte `remove_candidate`-Kandidaten: keine auf Codeebene. Die alten Planer, ActionScores und PlanWeights sind alle noch durch mindestens einen der folgenden Verträge gebunden:

- Legacy-Notaus über `NETGRID_SEMANTIC_AI_RUNTIME=legacy`
- No-Candidate-Fallback aus `chooseSemanticRuntimeAction`
- Baseline-/Plan-Debug für erklärbare Fallbacks
- Regressionstests, die den Fallbackvertrag absichern
- UI-/Diagnosepfade mit explizitem `diagnostic_only`-Status

Empfehlung für AI-CLEAN-2: Paket als sehr kleinen No-op-/Review-Abschluss behandeln oder auf später verschieben, bis ein konkreter einzelner Export mit `rg` und Testlauf als unreferenziert belegt ist. Keine breite Löschung aus diesem Inventar ableiten.

## AI-CLEAN-3-Kandidaten

| Pfad                                                         | Aktuelle Schärfung                     | Empfehlung                                                                                                      |
| ------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `chooseRunnerBaselineAction`, `chooseCorpBaselineAction`     | `keep_but_rename`                      | Als Legacy-Baseline-Fallback markieren oder umbenennen.                                                         |
| `scoreActions`, `scoreRunnerAction`, `scoreCorpAction`       | `keep_but_rename`                      | Namen/Kommentar Richtung Legacy-ActionScores schärfen.                                                          |
| `chooseRunnerPlanAction`, `chooseCorpPlanAction`             | `keep_but_rename`                      | Als Legacy-Plan-Fallback markieren.                                                                             |
| `chooseRunnerPlanDecision`, `chooseCorpPlanDecision`         | `keep_but_rename`                      | Öffentliche Test-/Debug-API beibehalten, aber Legacy-Kontext sichtbar machen.                                   |
| `generateRunnerPlanCandidates`, `generateCorpPlanCandidates` | `keep_but_rename`                      | Kandidaten als Legacy Plan Candidates kennzeichnen.                                                             |
| `ownDeckDoctrine.planWeights`                                | `keep_but_rename`                      | Im Typ/Debug/Review als Legacy-PlanWeights ausweisen; nicht mit neuem `DeckCapabilityProfile` verwechseln.      |
| `buildDeckDoctrineProfile`                                   | `runtime_active` und `keep_but_rename` | Builder bleibt aktiv, aber alte PlanWeight-Komponente sollte klar als Legacy-Fallback-Teil dokumentiert werden. |
| `decisionDebug`-Felder aus Legacy-Planern                    | `diagnostic_only` und `fallback_only`  | Debug-Felder nicht löschen; stattdessen klarer nach Semantic Runtime vs Legacy Fallback benennen.               |

## Sicherheitsgrenzen

- Alle betrachteten Entscheidungspfade wählen ausschließlich aus aktuellen `LegalActions`.
- `applyAction`-, Engine-, Replay-, StateHash- und Randomness-Verträge wurden nicht verändert.
- Private Deckinformationen bleiben auf eigene `ownDeckDoctrine`/DeckCapability-Eingaben begrenzt und werden in Debug-/DTO-Ausgaben redaktiert.
- Diagnose- und Viewerpfade mit `plannerEffect: "none"` bleiben ohne Entscheidungseffekt.
- Shadow-Harness bleibt default-off und liefert keine produktive Entscheidung.

## Schluss

AI-CLEAN-1 erfüllt seinen Zweck als Stoppschild vor einer zu frühen Legacy-Löschung. Der aktuelle Zustand ist kein toter Codeblock, sondern eine Übergangsarchitektur: Semantic Runtime entscheidet default, Legacy bleibt berechneter Fallback und Notaus. Der nächste sinnvolle Schritt ist Markierung/Benennung, nicht Entfernung.
