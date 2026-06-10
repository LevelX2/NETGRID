# AI073-AI080 Selfplay Stabilization Automation Process 2026-06-10

## Status

`in_progress`

Arbeitsbranch: `codex/ai073-ai080-selfplay-stabilization`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI073_AI080_SELFPLAY_STABILIZATION`

Hauptworkspace: `C:\Projekte\NETGRID`

Primärer Agent: `release-implementation-agent`

## Quelle/Vorgabe

Quelle ist die Nutzer-Vorgabe `AI073-AI080 Selfplay-Stabilisierung und Semantik-Absicherung` aus dem Codex-Anhang vom 2026-06-10. Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, fokussierte Checks, thematische Commits je Paket, finaler lokaler Merge nach `main`, kein Push.

## Preflight

Ausgangscommit:

```text
67f4c51c docs(ai): record action semantics final green
```

Startstatus im Hauptworkspace:

```text
## main...origin/main [ahead 15]
 M packages/ai/src/runner-run-target-evaluation.ts
```

Die uncommitted Änderung in `packages/ai/src/runner-run-target-evaluation.ts` wurde unverändert in den Arbeits-Worktree übernommen, damit die Selfplay-Baseline nicht auf einem älteren Runner-Target-Auswertungsstand läuft. Der Hauptworkspace bleibt bis zur finalen Integration unverändert; die Änderung wird im Paketprozess fachlich eingeordnet und nicht als fremder Diff verworfen.

## Zielprüfung

Die Vorgabe ist für direkte Umsetzung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Den AI072-Selfplay-Stand stabilisieren und die verbleibenden Loop-, Remote-No-Payoff-, Scoreline-, Doctrine- und ActionLimit-Befunde in kleinen Paketen reduzieren.
- Reihenfolge: AI073, AI074, AI075, AI076, AI077, AI078, AI079, AI080, finaler Review und lokaler Merge.
- Scope: primär `packages/ai`, `docs/reviews/ai` und AI-Architekturartefakte.
- Nicht-Ziele: kein neuer AI-Player, keine Engine-/LegalAction-/Replay-/StateHash-/Randomness-Änderungen, keine Hidden-Info-Ausweitung, kein Proteus-Runtime-Cutover.
- Akzeptanz: paketbezogene Typechecks, fokussierte Vitest-Slices, `git diff --check`, A-D x 5 Trace-Mining nach Runtime- oder Detector-Änderungen und Commit je Paket.

## Gesamtziel

NETGRID erhält einen stabileren Selfplay-KI-Pfad für die aktuellen A-D-Benchmark-Decks, ohne die Rules-Engine-Autorität oder Hidden-Info-Sicherheit zu schwächen. Die KI bleibt ausschließlich Konsument bestehender `LegalActions`; Ranking, Diagnose und Doctrine-Gewichte dürfen nur bestehende legale Optionen priorisieren oder abwerten.

## AI072-Ausgangswerte

Die Vorgabe nennt für den AI072-Endstand:

| Metrik | Wert |
| --- | ---: |
| Spiele | 20 |
| `illegalActions` | 0 |
| `replayFailures` | 0 |
| `allRedactionSafe` | 1 |
| `criticalFindings` | 0 |
| `corp_never_scores_long_game` | 3 |
| `actionLimitReached` | 11 |
| `repeated_no_progress_run` | 34 |
| `repeated_known_no_payoff_remote` | 1 |
| `recovery_low_value_loop` | 99 |
| `plan_step_action_mismatch` | 533 |
| `semantic_override_suspicious` | 423 |
| `corpAgendaScores` | 14 |
| `runnerAgendaSteals` | 29 |
| `corpFlatlines` | 4 |
| `scoreWindowMissed` | 0 |
| `unsafeScoreChosen` | 6 |
| `passiveActionWithScoreLineAvailable` | 6 |

## Erfolgskriterien

Harte Safety-Werte:

- `illegalActions` bleibt 0.
- `replayFailures` bleibt 0.
- `criticalFindings` bleibt 0.
- `allRedactionSafe` bleibt 1.
- Hidden-Info-Marker bleiben 0.
- Gewählte Actions bleiben in `input.legalActions`.

Qualitätsziele:

- `repeated_known_no_payoff_remote` sinkt auf 0.
- `repeated_no_progress_run` sinkt auf höchstens 33.
- `recovery_low_value_loop` sinkt auf höchstens 88 und unter die AI073-Baseline.
- `unsafeScoreChosen` sinkt unter 6, Ziel höchstens 3.
- `passiveActionWithScoreLineAvailable` bleibt höchstens 6.
- `corp_never_scores_long_game` bleibt höchstens 5, Ziel höchstens 3.
- `actionLimitReached` sinkt auf höchstens 8 und sichtbar unter AI073.
- `corpAgendaScores` sinkt nicht unter 13, außer ein dokumentierter Safety-Gewinn rechtfertigt es.

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Erweiterung von Hidden-Info-Zugriffen in PlayerViews, AI-Inputs, Debug, Logs, WebSocket-Payloads oder Reports.
- Kein kartenspezifisches oder seed-spezifisches Tuning.
- Keine Reduktion von Befunden durch pauschales Stummschalten von Detektoren.
- Keine produktive Proteus-Runtime-Freigabe.
- Keine strategischen Gewichte in alten PlanScorern ohne enge Runtime-Gates.
- Kein Push und keine PR in diesem Prozess.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Jedes Paket endet mit einem eigenen Commit.
- Nach jedem Paket läuft `git diff --check`.
- Nach jedem Codepaket laufen mindestens `corepack pnpm --filter @netgrid/ai typecheck` und ein fokussierter Vitest-Slice.
- Nach Runtime- oder Detector-Änderungen läuft A-D x 5 Trace-Mining oder der Review dokumentiert einen konkreten lokalen Laufzeitblocker.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert und side-safe.
- Metriken und Detektoren begründen Verhalten; sie ersetzen keine Legalität.

## Automatische Fehlerbehandlung

- Rote TypeScript- oder Vitest-Checks werden im aktiven Paket eingegrenzt und repariert.
- Wenn eine Verhaltensänderung Safety-Werte verschlechtert, wird sie enger gegatet oder zurückgeführt.
- Detector-Änderungen brauchen reproduzierbare False-Classification-Evidence.
- Wenn der A-D-Lauf lokal scheitert, wird ein fokussierter reproduzierbarer Lauf dokumentiert und das Paket nicht als metrisch erfolgreich verkauft.
- Mergekonflikte werden defensiv gelöst, ohne fremde fachliche Änderungen zu entfernen.

## Sicherheitsblocker

Der Prozess stoppt ohne Merge nach `main`, wenn einer dieser Punkte bestätigt ist:

- Eine KI wählt eine nicht legale oder nicht in `input.legalActions` enthaltene Action.
- Eine Änderung nutzt oder leakt verdeckte gegnerische Kartendaten.
- Engine-Regelvalidierung, LegalAction-Erzeugung oder `applyAction` müsste geändert werden.
- Replay-Determinismus oder StateHash würde durch KI-Diagnostik beeinflusst.
- Ein Detector müsste ohne reproduzierbare Fehlklassifikation abgeschwächt werden.
- Fremde Worktree-Änderungen sind nicht klassifizierbar und blockieren sauberes Staging.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und mit fokussierten Checks belegt ist.

## State Machine

```text
process_prepared
  -> ai073_selfplay_regression_matrix
  -> ai074_runner_recovery_loop_disambiguation
  -> ai075_known_remote_no_payoff_guard_v2
  -> ai076_safe_scoreline_hard_gate_audit
  -> ai077_action_semantic_candidate_coverage_report
  -> ai078_doctrine_runtime_weight_clamp_and_gate
  -> ai079_action_limit_root_cause_reducer
  -> ai080_full_test_sweep
  -> final_review
  -> merge_to_main
  -> complete
```

## Paketfolge

### AI073: Selfplay Regression Matrix

Ziel: Aktuellen HEAD-Stand mit A-D x 5 Trace-Mining messen und als Regression-Matrix versionieren.

Kernartefakte:

- `docs/reviews/ai/ai073-selfplay-regression-matrix-review-2026-06-10.md`
- `docs/reviews/ai/ai073-selfplay-regression-matrix-a-d-5seed-2026-06-10.json`

Checks:

```powershell
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts
git diff --check
```

Commit: `docs(ai): add AI073 selfplay regression baseline`

### AI074: Runner Recovery Loop Disambiguation

Ziel: `recovery_low_value_loop` reduzieren, ohne echte Funding- oder Survival-Recovery zu blockieren.

Kernpunkte:

- Recovery-Subkategorien im Trace-Mining oder Detector ausweisen.
- Fortschrittssignale wie neuer Zugriff, Trash, Score, installierte relevante Karte, Credits aus Funding-Need und nicht wiederholtes Low-Value-Banking unterscheiden.
- Kleine negative Runtime-Komponente `runner_low_value_recovery_repeat` nur bei klarer Low-Value-Wiederholung.

Commit: `fix(ai): disambiguate runner low-value recovery loops`

### AI075: Known Remote No-Payoff Guard v2

Ziel: `repeated_known_no_payoff_remote` auf 0 bringen und verhindern, dass `contest_remote`-Doctrine bekannte No-Payoff-Remotes überstimmt.

Kernpunkte:

- Guard vor positivem Doctrine-Gewicht.
- Evidence: `runner_known_remote_no_payoff_guard:true` und `deck_doctrine_remote_contest_suppressed:true`.
- Plausible scoring remotes bleiben contestbar.

Commit: `fix(ai): suppress doctrine contest on known no-payoff remotes`

### AI076: Safe Scoreline Hard-Gate Audit

Ziel: `unsafeScoreChosen` reduzieren, ohne sichere Corp-Scorelines wieder passiv zu machen.

Kernpunkte:

- Unsafe-Score-Subgründe reporten.
- Positive `score_now`-Doctrine erst nach Scoreline-Safety-Gate anwenden.
- Evidence: `corp_scoreline_safety_gate_blocks_doctrine:true` und `score_now_doctrine_suppressed:true`.

Commit: `fix(ai): gate scoreline doctrine behind safety checks`

### AI077: ActionSemanticCandidate Coverage Report v1

Ziel: ActionSemanticCandidate-Abdeckung read-only auswertbar machen.

Kernpunkte:

- Reportfunktionen für Coverage-Summary und Markdown-Format ergänzen.
- Gruppen wie `basic_action`, `game_rule`, `runner_card_action`, `corp_card_action`, `choice_resolution`, `run_action`, `access_action`, `corp_window_action`, `score_action`, `install_action`, `advance_action`, `rez_action` ausweisen.
- Kein Runtime-Entscheidungsverhalten ändern.

Commit: `docs(ai): report action semantic candidate coverage`

### AI078: Doctrine Runtime Weight Clamp and Gate Review

Ziel: Consumer-spezifische Doctrine-Clamps und Gates erzwingen.

Kernpunkte:

- Clamps: Corp `score_now` +/-24, `score_next_turn` +/-18, `build_scoring_remote` +/-18, Runner `pressure_rnd` +/-12, `pressure_hq` +/-12, `contest_remote` +/-9.
- Gate-first vor positivem Runtime-Gewicht.
- Suppression-Evidence statt stiller Gewichtsanwendung.

Commit: `fix(ai): clamp doctrine runtime weights by consumer gates`

### AI079: ActionLimitReached Root-Cause Reducer

Ziel: Action-Limit-Spiele diagnostisch clustern und genau einen belegten Root Cause fixen.

Kernpunkte:

- Cluster wie `action_limit_runner_recovery_stall`, `action_limit_runner_no_progress_runs`, `action_limit_corp_scoreline_stall`, `action_limit_corp_passive_endgame`, `action_limit_mixed_low_progress` und `action_limit_unknown`.
- Nur ein reproduzierbarer Micro-Fix, sonst Diagnosepaket ohne Heuristik-Raten.

Commit: `fix(ai): reduce action-limit stalls with gated progress pressure`

### AI080: Full Test Sweep, Fehleranalyse und Reparatur

Ziel: Vollständige verfügbare Checks ausführen, Fehler ursächlich beheben und den finalen A-D x 5 Stand dokumentieren.

Kernartefakte:

- `docs/reviews/ai/ai080-final-selfplay-trace-mining-a-d-2026-06-10.json`
- `docs/reviews/ai/ai080-full-test-sweep-final-review-2026-06-10.md`

Commit: `test(ai): run full sweep and fix selfplay stabilization regressions`

### Final Review und lokale Integration

Ziel: Abschlussreview erstellen, Branch lokal nach `main` integrieren und Worktree aufräumen.

Kernartefakt:

- `docs/reviews/ai/ai073-ai080-selfplay-stabilization-final-review-2026-06-10.md`

Commit: `docs(ai): finalize AI073-AI080 selfplay stabilization review`

