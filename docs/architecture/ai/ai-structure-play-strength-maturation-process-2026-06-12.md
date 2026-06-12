# AI Structure & Play-Strength Maturation Process 2026-06-12

## Status

ai_mat_9_calibration_version

## Quelle/Vorgabe

Quelle ist die Ergebnisprüfung vom 2026-06-12 zur lokal abgeschlossenen Structural-Play-Strength-Consolidation. Die Prüfung konnte den lokalen Abschluss `9f6f0987` und den Branch remote nicht sehen und leitet daraus eine neue Maturation-Serie ab. Der lokale Stand ist inzwischen weiter: `main` steht zu Prozessbeginn auf `924940fa` und enthält bereits die Konsolidierungsarbeit inklusive Pilot-Registry, DoctrineGoalSynthesis, TargetChoiceShadow, Calibration-Bindung, 18er Real-Engine-Corpus und Final-Green-Artefakte.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Kleine Lücken werden konservativ behandelt:

- Bereits vorhandene lokale Umsetzungen werden nicht dupliziert, sondern in den jeweiligen Paketen auditiert, modularisiert oder als erledigter Delta-Stand dokumentiert.
- `AI-MAT-5` und `AI-MAT-9` werden nicht parallel bearbeitet, sondern sequenziell an sinnvoller Stelle eingeschoben.
- `AI-MAT-11` zielt auf mindestens 30 Real-Engine-Corpus-Szenarien; der lokale Startwert ist 18.
- Änderungen außerhalb `packages/ai`, `docs/architecture/ai` und `docs/reviews/ai` sind nur zulässig, wenn ein Paket sie ausdrücklich verlangt und Tests sie decken.

## Gesamtziel

Die neue AI-Play-Strength-Struktur wird robust, modular und besser evaluierbar gemacht: Pilot-Scopes werden in echte Scope-Module getrennt, RunTarget-Alignment nutzt strukturierte Felder zuerst, TargetChoiceShadow hängt an SemanticCandidates und DecisionTrace, Corpus/League werden breiter und metadata-getrieben, DoctrineGoals bleiben diagnostisch sichtbar, und `index.ts`-Restschuld wird neu kartiert.

## Annahmen

- Lokaler Integrationsbranch ist `main`.
- Arbeitsbranch: `codex/ai-structure-play-strength-maturation`.
- Worktree: `C:\Projekte\NETGRID_AI_STRUCTURE_PLAY_STRENGTH_MATURATION`.
- Der Hauptworkspace ist zu Prozessbeginn sauber.
- GitHub-/Remote-Sichtbarkeit wird nur dokumentiert; kein Push oder PR ohne ausdrücklichen Nutzerwunsch.
- Die Rules Engine bleibt einzige Regelautorität.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine produktive Aktivierung von RemoteContest, TargetChoiceShadow oder Calibration.
- Keine Hidden-Info-Allowlist-Erweiterung ohne belegte Side-Safety.
- Kein Entfernen von Legacy-Fallbacks.
- Kein großer `index.ts`-Big-Bang-Refactor.

## Controller-Invarianten

- AI-Module erzeugen keine LegalActions.
- Runtime, Debug, Trace, Evaluation und Reports bleiben side-safe redigiert.
- Evaluation und Diagnostics treffen keine Runtime-Auswahl.
- Pilot-Scopes bleiben lokal opt-in.
- TargetChoiceShadow erzeugt keine `selectedChoices` oder `selectedTargets`.
- DoctrineGoalSynthesis bleibt diagnostisch und frame-/option-gesteuert.
- Paketcommits stagen ausschließlich paketzugehörige Pfade.

## Automatische Fehlerbehandlung

- Bei roten Tests: Testname, Assertion und betroffene Datei lesen; Ursache eng beheben; Einzeltest, Datei-Test und Paketchecks wiederholen.
- Bei bereits erfülltem Paket: Audit/Delta dokumentieren, relevante Guard-Tests ausführen, Paket committen.
- Bei fachlichem Vertragskonflikt: Blocker-Report mit Removal Condition schreiben und nicht weiter integrieren.
- Bei Merge-Konflikt: beide Intentionen lesen und kompatibel zusammenführen; danach relevante Tests erneut ausführen.

## Sicherheitsblocker

- Hidden-Info-Daten erscheinen in AIInput, Trace, Debug, Report, PublicEvent, Reconnect oder Logs.
- Pilot-Registry erlaubt nicht-legale Actions oder produktive Default-Wirkung ohne Opt-in.
- TargetChoiceShadow erzeugt produktive Choices/Targets.
- Calibration-Änderung beeinflusst Default-Runtime-Verhalten.
- Testfix erfordert Engine-Regeländerung nur für AI-Testgrün.

## State Machine

```text
created
  -> ai_mat_0_audit
  -> ai_mat_1_git_discipline
  -> ai_mat_2_pilot_modules
  -> ai_mat_3_multi_scope_env
  -> ai_mat_4_runner_safe_access_risk
  -> ai_mat_5_remote_contest_diagnostic
  -> ai_mat_6_structured_run_alignment
  -> ai_mat_7_target_choice_candidate
  -> ai_mat_8_target_choice_trace
  -> ai_mat_9_calibration_version
  -> ai_mat_10_fixture_builder
  -> ai_mat_11_corpus_expansion
  -> ai_mat_12_corpus_metadata_league
  -> ai_mat_13_doctrine_goal_delta
  -> ai_mat_14_doctrine_trace_option
  -> ai_mat_15_boundary_guard
  -> ai_mat_16_pilot_metrics
  -> ai_mat_17_debug_sections
  -> ai_mat_18_index_debt
  -> ai_mat_19_originalset_backlog
  -> ai_mat_20_final_report
  -> final_green
  -> main_integration
  -> complete
```

## Paketfolge

1. `AI-MAT-0` Local/Remote Audit und Report-Sync.
2. `AI-MAT-1` Path-scoped Git-Disziplin hart machen.
3. `AI-MAT-2` Pilot-Scope-Registry in Scope-Module splitten.
4. `AI-MAT-3` Multi-Scope Pilot-Env validieren/ergänzen.
5. `AI-MAT-4` RunnerSafeAccess risk-aware Gates.
6. `AI-MAT-5` RemoteContest-Pilot-Candidate report-only.
7. `AI-MAT-6` RunTargetActionAlignment strukturiert vor Evidence.
8. `AI-MAT-7` TargetChoiceShadow aus ActionSemanticCandidate.
9. `AI-MAT-8` TargetChoiceShadow-Summary im DecisionTrace.
10. `AI-MAT-9` Calibration Profile versioniert/baseline-gebunden prüfen und ergänzen.
11. `AI-MAT-10` Real-Engine-Corpus-Mutationen kapseln.
12. `AI-MAT-11` Real-Engine-Corpus auf mindestens 30 Szenarien erweitern.
13. `AI-MAT-12` Shadow-League-Erwartungen aus Corpus-Metadata ableiten.
14. `AI-MAT-13` DoctrineGoalSynthesis Delta prüfen/ergänzen.
15. `AI-MAT-14` DoctrineGoals optional im ShadowTrace.
16. `AI-MAT-15` Module-Boundary-Guard erweitern.
17. `AI-MAT-16` Pilot-Eligibility-Metriken in Shadow-League.
18. `AI-MAT-17` DecisionDebug Trace Sections vervollständigen.
19. `AI-MAT-18` `index.ts` Restschuldkarte aktualisieren.
20. `AI-MAT-19` Originalset-Semantik-Backlog an Spine koppeln.
21. `AI-MAT-20` Abschlussbericht.
22. `FINAL-GREEN`.

## Paketdetails

Jedes Paket enthält: Ziel, Kernartefakte, Checks, Done-Gate und Commit-Message. Die exakten Aufgaben folgen der Ergebnisanalyse; bei lokal bereits erfülltem Inhalt wird das Paket als Audit-/Delta-Paket abgeschlossen.

| Paket | Kernartefakte | Mindestchecks | Commit |
| --- | --- | --- | --- |
| AI-MAT-0 | Preflight-Report, Final-Report, AI-README | `git diff --check` | `docs(ai): audit structural play strength consolidation` |
| AI-MAT-1 | dieses Prozessartefakt | `git diff --check` | `docs(ai): require path scoped staging for play strength work` |
| AI-MAT-2 | `decision/pilot/*`, Fassade, Tests | Pilot-, Fassade-, Runtime-Test, Typecheck | `refactor(ai): split play strength pilot scopes` |
| AI-MAT-3 | Pilot parser/registry, Runtime-Test | Registry-Test, Runtime-Test, Typecheck | `feat(ai): support multiple local play strength pilot scopes` |
| AI-MAT-4 | RunnerSafeAccess-Pilot, Tests | RunnerSafeAccess-Test, Corpus-Test, Typecheck | `test(ai): harden runner safe access pilot gates` |
| AI-MAT-5 | RemoteContest-Diagnostic | RemoteContest-Test, Alignment-Test, Typecheck | `test(ai): add remote contest pilot candidate diagnostics` |
| AI-MAT-6 | RunTargetActionAlignment, Candidate projection | Alignment-Test, ActionCoverage-Test, Typecheck | `refactor(ai): prefer structured run target alignment` |
| AI-MAT-7 | TargetChoiceShadow Candidate API | TargetChoiceShadow-Test, Candidate-Test, Typecheck | `feat(ai): build target choice shadow from semantic candidates` |
| AI-MAT-8 | DecisionTrace TargetChoice summary | ShadowDecision-Test, TargetChoiceShadow-Test, Typecheck | `feat(ai): surface target choice shadow in decision trace` |
| AI-MAT-9 | Calibration profile metadata | Calibration-Test, Benchmark-Test, Typecheck | `test(ai): version semantic shadow calibration profiles` |
| AI-MAT-10 | Fixture builder | Corpus-Test, Typecheck | `refactor(ai): encapsulate real engine corpus mutations` |
| AI-MAT-11 | Corpus fixtures/tests | Corpus-Test, ShadowLeague-Test, Typecheck | `test(ai): expand real engine decision corpus scenarios` |
| AI-MAT-12 | Corpus metadata, ShadowLeague | ShadowLeague-Test, Corpus-Test, Typecheck | `refactor(ai): derive shadow league expectations from corpus` |
| AI-MAT-13 | DoctrineGoalSynthesis delta | Doctrine-Test, NeutralGoal-Test, Typecheck | `feat(ai): add diagnostic doctrine goal synthesis` |
| AI-MAT-14 | ShadowDecision option | ShadowDecision-Test, Doctrine-Test, Typecheck | `feat(ai): include diagnostic doctrine goals in shadow trace` |
| AI-MAT-15 | Module-boundary guard | Boundary-Test, Typecheck | `test(ai): guard play strength module boundaries` |
| AI-MAT-16 | ShadowLeague pilot metrics | ShadowLeague-Test, Registry-Test, Typecheck | `test(ai): report pilot eligibility in shadow league` |
| AI-MAT-17 | DecisionDebug sections | DecisionDebug-, Runtime-, Index-Test, Typecheck | `feat(ai): add play strength trace debug sections` |
| AI-MAT-18 | Index debt map | `git diff --check` | `docs(ai): update index implementation debt map` |
| AI-MAT-19 | Originalset semantic backlog, invariant guard | Invariant-Test, Typecheck | `docs(ai): map originalset semantic backlog for play strength` |
| AI-MAT-20 | Final report | `git diff --check` | `docs(ai): record play strength maturation` |

## Verifikationsregeln

- Vor jedem Commit: `git status --short`.
- Vor jedem Commit: `git diff --check`.
- Staging nur mit expliziter Pfadliste.
- Kein `git add .`, kein `git add -A`.
- Keine Testlöschung, kein `test.skip`, kein `test.only`.
- Nicht ausgeführte Checks werden im Paketartefakt begründet.

## Paketstatus und Staging-Nachweise

| Paket | Status | Commit | Staging-Nachweis |
| --- | --- | --- | --- |
| Prozess-Setup | complete | `d41f18aa` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md` |
| AI-MAT-0 | complete | `e4604a27` | `git add -- docs/architecture/ai/README.md docs/reviews/ai/ai-structural-play-strength-consolidation-final-report-2026-06-12.md docs/reviews/ai/ai-structure-play-strength-maturation-preflight-2026-06-12.md` |
| AI-MAT-1 | complete | `0576f2e5` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md` |
| AI-MAT-2 | complete | `56d75425` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/pilot-scope-registry.ts packages/ai/src/decision/pilot/basic-setup-pilot.ts packages/ai/src/decision/pilot/corp-score-window-pilot.ts packages/ai/src/decision/pilot/pilot-scope-common.ts packages/ai/src/decision/pilot/pilot-scope-registry.ts packages/ai/src/decision/pilot/pilot-scope-registry.test.ts packages/ai/src/decision/pilot/runner-safe-access-pilot.ts` |
| AI-MAT-3 | complete | `682fa54f` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/pilot/pilot-scope-common.ts packages/ai/src/decision/pilot/pilot-scope-registry.ts packages/ai/src/decision/pilot/pilot-scope-registry.test.ts packages/ai/src/semantic-ai-runtime-cutover.test.ts` |
| AI-MAT-4 | complete | `6b781134` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/pilot/runner-safe-access-pilot.ts packages/ai/src/decision/pilot/pilot-scope-registry.test.ts packages/ai/src/evaluation/real-engine-decision-corpus.test.ts` |
| AI-MAT-5 | complete | `2df0c774` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/evaluation/semantic-shadow-league.ts packages/ai/src/evaluation/semantic-shadow-league.test.ts packages/ai/src/decision/run-target-action-alignment.test.ts` |
| AI-MAT-6 | complete | `21a29a29` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/run-target-action-alignment.ts packages/ai/src/decision/run-target-action-alignment.test.ts` |
| AI-MAT-7 | complete | `386262ba` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/target-choice-shadow.ts packages/ai/src/decision/target-choice-shadow.test.ts` |
| AI-MAT-8 | complete | `de8705d0` | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/semantic-decision-trace.ts packages/ai/src/decision/semantic-shadow-decision.ts packages/ai/src/decision/semantic-shadow-decision.test.ts` |
| AI-MAT-9 | complete in current package commit | pending | `git add -- docs/architecture/ai/ai-structure-play-strength-maturation-process-2026-06-12.md packages/ai/src/decision/semantic-shadow-calibration.ts packages/ai/src/decision/semantic-shadow-calibration.test.ts packages/ai/src/evaluation/play-strength-benchmark.ts packages/ai/src/evaluation/play-strength-benchmark.test.ts` |

## Check-Nachweise

- `AI-MAT-2`: `corepack pnpm --filter @netgrid/ai test -- src/decision/pilot/pilot-scope-registry.test.ts src/decision/semantic-basic-setup-pilot.test.ts src/semantic-ai-runtime-cutover.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1206 Tests ausgefuehrt.
- `AI-MAT-2`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-3`: `corepack pnpm --filter @netgrid/ai test -- src/decision/pilot/pilot-scope-registry.test.ts src/semantic-ai-runtime-cutover.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1209 Tests ausgefuehrt.
- `AI-MAT-3`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-4`: `corepack pnpm --filter @netgrid/ai test -- src/decision/pilot/pilot-scope-registry.test.ts src/evaluation/real-engine-decision-corpus.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1210 Tests ausgefuehrt.
- `AI-MAT-4`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-5`: `corepack pnpm --filter @netgrid/ai test -- src/evaluation/semantic-shadow-league.test.ts src/decision/run-target-action-alignment.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1211 Tests ausgefuehrt.
- `AI-MAT-5`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-6`: `corepack pnpm --filter @netgrid/ai test -- src/decision/run-target-action-alignment.test.ts src/actions/action-semantic-coverage.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1212 Tests ausgefuehrt.
- `AI-MAT-6`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-7`: `corepack pnpm --filter @netgrid/ai test -- src/decision/target-choice-shadow.test.ts src/action-semantic-candidate.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1214 Tests ausgefuehrt.
- `AI-MAT-7`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-8`: `corepack pnpm --filter @netgrid/ai test -- src/decision/semantic-shadow-decision.test.ts src/decision/target-choice-shadow.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1215 Tests ausgefuehrt.
- `AI-MAT-8`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.
- `AI-MAT-9`: `corepack pnpm --filter @netgrid/ai test -- src/decision/semantic-shadow-calibration.test.ts src/evaluation/play-strength-benchmark.test.ts` lief gruen; wegen Workspace-Argumentweitergabe wurden 76 Testdateien mit 1215 Tests ausgefuehrt.
- `AI-MAT-9`: `corepack pnpm --filter @netgrid/ai typecheck` gruen.

## Harte Git-Disziplin fuer Folgepakete

- Jedes Paket prueft vor dem Commit `git status --short` und `git diff --check`.
- Jedes Paket staged ausschliesslich die direkt zum Paket gehoerenden Pfade mit `git add -- <pfad> ...`.
- Ein Paketcommit darf keine fremden Arbeitsdateien, generierten Caches, Laufzeitdaten oder zusammengefassten Folgepakete enthalten.
- Werden waehrend eines Pakets bestehende lokale Fremdaenderungen sichtbar, werden sie nicht gestasht, nicht reverted und nicht mitcommitted. Das Paket dokumentiert dann die betroffenen Pfade und arbeitet nur weiter, wenn die Paketgrenze eindeutig bleibt.
- Mechanische Formatierung ist nur paketbezogen erlaubt und muss vor dem Commit als eigener betroffener Pfad sichtbar sein.
- Der finale Main-Merge bleibt ein eigener Integrationsschritt nach `FINAL-GREEN`; vorher wird nicht im Hauptworkspace gearbeitet.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-structure-play-strength-maturation`.
- Worktree: `C:\Projekte\NETGRID_AI_STRUCTURE_PLAY_STRENGTH_MATURATION`.
- Hauptworkspace wird nur für finalen Merge nach `main` genutzt.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.
- Vor finalem Merge: aktuellen `main` in Arbeitsbranch integrieren, final testen, dann bevorzugt Fast-Forward nach `main`.
- Nach Merge: `@netgrid/ai test`, `@netgrid/ai typecheck`, `git diff --check`, Status prüfen und Worktree entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Structure & Play-Strength Maturation vollständig und sequenziell von AI-MAT-0 bis AI-MAT-20 sowie FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, den Release-Implementation-Agenten und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_STRUCTURE_PLAY_STRENGTH_MATURATION auf Branch codex/ai-structure-play-strength-maturation.
Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket mit expliziter Pfadliste.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete `AI-MAT-0` bis `AI-MAT-20` sind umgesetzt oder als bereits erfüllter Delta-Stand mit Tests dokumentiert.
- `FINAL-GREEN` ist grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Arbeits-Worktree ist entfernt.
- Goal ist erst danach complete.
