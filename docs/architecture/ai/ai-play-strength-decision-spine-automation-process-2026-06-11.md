# AI Play-Strength Decision Spine Automation Process 2026-06-11

## Status

`final_green_passed_pending_main_merge`

Arbeitsbranch: `codex/ai-play-strength-decision-spine`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_DECISION_SPINE`

Hauptworkspace: `C:\Projekte\NETGRID`

## Quelle/Vorgabe

Quelle ist die Nutzer-Ergebnisanalyse `Mutiger nächster Schritt: AI Play-Strength Decision Spine` vom 2026-06-11. Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, Checks je Paket, Commit je Paket, finaler lokaler Merge nach `main`, kein Push.

## Schlussfolgerung aus der Ergebnisanalyse

Die letzten AI-Strukturpakete haben die Voraussetzungen geschaffen: `ActionSemanticCandidate`, Definition-vs-Instance-ID, TargetProfile-Safety, semantische Invarianten und vollständige grüne AI-Tests sind vorhanden. Der nächste Hebel ist daher nicht weitere reine Strukturkosmetik, sondern ein gekapselter Entscheidungsrücken für Spielstärke.

Optimierungsrichtung:

- Entscheidungen sollen als side-safe `DecisionFrame` erklärbar werden.
- TacticalGoals sollen in normalisierte Utility-Familien übersetzt werden.
- LegalActions sollen über `ActionGoalFit` gegen Ziele, Kosten, Timing, Risiken und Planbezug bewertet werden.
- Threat-/Opportunity-Projektionen sollen Gefahren und Chancen bündeln.
- Ein `SemanticShadowDecision`-Trace soll Rankings erzeugen, ohne default produktiv zu entscheiden.
- Eine kleine Snapshot-Suite soll typische Fehlerklassen reproduzierbar machen.
- Ein enger lokaler Basic-/Setup-Pilot darf nur opt-in und default-off Runtime-Wirkung bekommen.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: neuer Decision-Spine für Spielstärke ohne neue Engine- oder LegalAction-Autorität.
- Reihenfolge: AI-PLAY-0 bis AI-PLAY-9 plus FINAL-GREEN.
- Scope: `packages/ai/src/decision/**`, `packages/ai/src/evaluation/**`, kleinere AI-Runtime-/Diagnostik-Anbindungen und AI-Review-Dokumentation.
- Nicht-Ziele: keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Abnahme: paketbezogene Vitest-Läufe, vollständiger `@netgrid/ai`-Testlauf, Typecheck und `git diff --check`.
- Branch-/Worktree-Erwartung: eigener Branch `codex/ai-play-strength-decision-spine`, final lokal nach `main`.

Konservative Annahme: Wenn ein Paket eine große riskante Runtime-Extraktion verlangen würde, wird nur der side-safe, pure und testbare Teil extrahiert; der Rest wird als bewusst verbleibende Folgearbeit dokumentiert.

## Gesamtziel

Der Prozess baut einen mutigen, aber sicheren AI-Play-Strength-Entscheidungsrücken:

```text
AiDecisionInput
-> SemanticDecisionFrame
-> Threat/Opportunity Projection
-> TacticalGoalUtility
-> ActionGoalFit
-> SemanticDecisionTrace
-> SemanticShadowDecision
-> optionaler lokaler Basic/Setup-Pilot
```

Default bleibt ohne produktive Runtime-Änderung. Eine Runtime-Übernahme ist nur im Paket AI-PLAY-7 über `NETGRID_AI_PLAY_STRENGTH_PILOT=basic_setup` erlaubt und dort hart auf Low-Risk Basic-/Setup-Familien begrenzt.

## Nicht-Ziele

- Keine Änderung an `packages/engine/**`.
- Keine Änderung an LegalAction-Erzeugung.
- Keine Änderung an `applyAction`, Replay, StateHash oder Randomness.
- Keine Hidden-Info-Ausweitung in PlayerViews, AI-Inputs, Debug, Logs, Reports, Reconnect-Payloads oder Simulationstraces.
- Keine produktive CardId-Sonderlogik.
- Keine Löschung von Legacy-Code.
- Keine Entfernung von `NETGRID_SEMANTIC_AI_RUNTIME=legacy`.
- Keine Entfernung von No-Candidate-Fallback.
- Kein DeckDoctrine-v2-Cutover und kein neuer KI-Spieler.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Ein Paket wird erst abgeschlossen, wenn sein Done-Gate erfüllt ist.
- Finale AI-Actions stammen weiterhin aus `input.legalActions`.
- Die KI erzeugt keine Legalität.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert.
- Shadow Ranking hat default keine Runtime-Wirkung.
- Pilot-Runtime-Wirkung ist default-off und nur per explizitem lokalem Flag aktiv.
- Konkrete Kartenfälle sind Regressionen/Testanker, nicht Produktiv-Sonderregeln.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktiven Paket eingegrenzt und eng behoben.
- Kein `test.skip`, `test.only`, pauschales Löschen von Tests oder breites Lockern von Assertions.
- Keine Hidden-Info-Allowlist-Erweiterung ohne konkreten, side-safe Vertrag.
- Wenn ein sinnvoller Score nur über Hidden-Info oder Engine-Änderungen möglich wäre, wird der Fall als Blocker oder Follow-up dokumentiert.
- Konflikte mit weitergelaufenem `main` werden defensiv gelöst; beide Intentionen bleiben erhalten, wenn fachlich kompatibel.
- Kein `git reset --hard` und kein pauschales Revert fremder Änderungen.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- eine AI-Action nicht aus `input.legalActions` stammt;
- eine Änderung neue LegalAction-Erzeugung oder Engine-Vertragsänderung verlangt;
- Hidden-Info-Grenzen breiter werden müssten;
- Replay, StateHash oder Randomness beeinflusst würden;
- Legacy- oder No-Candidate-Fallback nicht erhalten werden kann;
- Debug-/Trace-Daten verdeckte Gegnerinformationen leaken;
- der Basic-/Setup-Pilot ohne explizites Flag Runtime-Wirkung bekommt.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und durch fokussierte Checks belegt ist.

## State Machine

```text
process_prepared
  -> ai_play_0_preflight
  -> ai_play_1_decision_frame_trace
  -> ai_play_2_tactical_goal_utility
  -> ai_play_3_action_goal_fit
  -> ai_play_4_threat_opportunity
  -> ai_play_5_semantic_shadow_decision
  -> ai_play_6_decision_snapshot_suite
  -> ai_play_7_basic_setup_pilot
  -> ai_play_8_decision_debug_diagnostics
  -> ai_play_9_final_report
  -> final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessartefakt | Artefakt existiert, Worktree sauber, `git diff --check` grün | `docs(ai): define play strength decision spine process` |
| `AI-PLAY-0` | Preflight und Baseline | `@netgrid/ai test`, Typecheck und Diffcheck grün; Strukturinventar dokumentiert | `docs(ai): record play strength decision spine preflight` |
| `AI-PLAY-1` | DecisionFrame und DecisionTrace | side-safe Frame/Trace mit Tests, keine Auswahl | `feat(ai): add semantic decision frame` |
| `AI-PLAY-2` | TacticalGoalUtility | Goal-Utility-Familien und Tests, keine ActionId-Forderung | `feat(ai): normalize tactical goal utility` |
| `AI-PLAY-3` | ActionGoalFit | generischer Fit-Scorer, ScoreComponents, HardGates und Tests | `feat(ai): score action goal fit generically` |
| `AI-PLAY-4` | Threat/Opportunity | Gefahren-/Chancenprojektion mit Tests, keine Action-Erzeugung | `feat(ai): add threat and opportunity projections` |
| `AI-PLAY-5` | SemanticShadowDecision | deterministisches Shadow Ranking und Trace ohne default Runtime-Wirkung | `feat(ai): add semantic shadow decision ranking` |
| `AI-PLAY-6` | Mistake Snapshot Suite | Fehlerklassen und Snapshot-Suite mit Tests | `test(ai): add decision snapshot mistake suite` |
| `AI-PLAY-7` | Lokaler Basic/Setup-Pilot | default unverändert; opt-in nur Low-Risk-Familien | `feat(ai): add local basic setup semantic pilot` |
| `AI-PLAY-8` | DecisionDebug Richtung diagnostics | pure Formatter oder sicherer Debug-Teil extrahiert; Redaction unverändert | `refactor(ai): move decision debug formatting toward diagnostics` |
| `AI-PLAY-9` | Abschlussreport | Final-Report mit Runtime-Wirkung, Grenzen und Verifikation | `docs(ai): record play strength decision spine` |
| `FINAL-GREEN` | Vollständiger AI-Green-Lauf | vollständiger `@netgrid/ai test`, Typecheck und Diffcheck grün; lokal nach `main` integriert | optional `docs(ai): record play strength final green` oder `fix(ai): resolve play strength final test regressions` |

## Paketdetails

### AI-PLAY-0: Preflight und Baseline

Ziel: aktuellen grünen Stand bestätigen und Baseline erfassen.

Kernartefakt: `docs/reviews/ai/ai-play-strength-decision-spine-preflight-2026-06-11.md`

Checks:

```bash
git status --short
git rev-parse HEAD
git log --oneline -20
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Zusätzlich Inventar:

```bash
wc -l packages/ai/src/index.ts
rg "semanticRuntimeDecisionDebug|decisionFromChoices|scoreActions|simulate|benchmark|chooseAiAction" packages/ai/src/index.ts
rg "ActionSemanticCandidate|TacticalGoal|RunnerRunTargetEvaluation|RiskProjection|PlanStepFit" packages/ai/src
```

### AI-PLAY-1: DecisionFrame und DecisionTrace

Neue Dateien:

- `packages/ai/src/decision/semantic-decision-frame.ts`
- `packages/ai/src/decision/semantic-decision-trace.ts`
- `packages/ai/src/decision/semantic-decision-frame.test.ts`

Done-Gate:

- Frame enthält nur ActionIds aus `input.legalActions`.
- Frame/Trace serialisieren keine privaten Gegnerkartendaten.
- Runner und Corp sind abgedeckt.
- Gleicher Input erzeugt deterministischen Frame.
- Trace enthält ohne Ranking keine `selectedActionId`.

### AI-PLAY-2: TacticalGoalUtility

Neue Dateien:

- `packages/ai/src/decision/tactical-goal-utility.ts`
- `packages/ai/src/decision/tactical-goal-utility.test.ts`

Utility-Familien:

```text
survival, economy, setup, coverage, run_access, remote_contest, corp_scoreline,
corp_ice_defense, tag_punish, damage_pressure, target_resolution, cleanup
```

Done-Gate: Goals fordern keine direkte ActionId, enthalten keine Hidden-Info und bleiben generisch.

### AI-PLAY-3: ActionGoalFit

Neue Dateien:

- `packages/ai/src/decision/action-goal-fit.ts`
- `packages/ai/src/decision/score-components.ts`
- `packages/ai/src/decision/hard-gates.ts`
- `packages/ai/src/decision/action-goal-fit.test.ts`

Done-Gate: generische Fit-Bewertung für zentrale Basic-/Setup-/Run-/Risk-Fälle, ohne Runtime-Wirkung und ohne CardId-Sonderlogik.

### AI-PLAY-4: Threat/Opportunity

Neue Dateien:

- `packages/ai/src/decision/threat-projection.ts`
- `packages/ai/src/decision/opportunity-projection.ts`
- `packages/ai/src/decision/threat-opportunity.test.ts`

Done-Gate: Gefahren und Chancen beeinflussen nur Utility-/Trace-Evidence, erzeugen keine Actions und lesen keine Hidden-Info außerhalb side-safe Belief/Memory.

### AI-PLAY-5: SemanticShadowDecision

Neue Dateien:

- `packages/ai/src/decision/semantic-shadow-decision.ts`
- `packages/ai/src/decision/semantic-shadow-decision.test.ts`

Optional:

- `packages/ai/src/evaluation/semantic-shadow-report.ts`

Done-Gate: Ranking enthält nur Frame-ActionIds, ist deterministisch, erklärt blockierte Actions und wird nicht automatisch produktiv genutzt.

### AI-PLAY-6: Mistake Snapshot Suite

Neue Dateien:

- `packages/ai/src/evaluation/mistake-taxonomy.ts`
- `packages/ai/src/evaluation/decision-snapshot.ts`
- `packages/ai/src/evaluation/decision-snapshot-suite.ts`
- `packages/ai/src/evaluation/decision-snapshot-suite.test.ts`

Optional:

- `docs/reviews/ai/ai-play-strength-decision-snapshot-suite-2026-06-11.md`

Done-Gate: Fehlerklassen wie `unsafe_run`, `missed_safe_access`, `ignored_remote_threat`, `missed_score_window`, `economy_starvation` und `bad_rez_spend` sind diagnostisch testbar.

### AI-PLAY-7: Lokaler Opt-in-Pilot

Neue Dateien:

- `packages/ai/src/decision/semantic-basic-setup-pilot.ts`
- `packages/ai/src/decision/semantic-basic-setup-pilot.test.ts`

Bestehende mögliche Anbindungen:

- `packages/ai/src/runtime/semantic-runtime.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`

Done-Gate:

- `NETGRID_AI_PLAY_STRENGTH_PILOT` unset erhält exakt altes Verhalten.
- `basic_setup` darf nur `gain_credit`, `draw_card`, safe `install_card`, high/critical `remove_tag` und defensives `end_turn` beeinflussen.
- Run-, Access-, Rez-, Score-, Advance-, Damage-/Punish-, Target-Choice- und Random-/Self-Damage-Actions bleiben außerhalb des Piloten.

### AI-PLAY-8: DecisionDebug Richtung diagnostics

Neue oder erweiterte Dateien:

- `packages/ai/src/diagnostics/decision-debug.ts`
- `packages/ai/src/diagnostics/decision-debug.test.ts`

Done-Gate: pure Formatter oder sicherer Debug-Teil sind extrahiert; Debugfelder und Redaction bleiben kompatibel.

### AI-PLAY-9: Abschlussreport

Kernartefakt:

- `docs/reviews/ai/ai-play-strength-decision-spine-final-report-2026-06-11.md`

Done-Gate: Report nennt Umsetzung, Nicht-Änderungen, Runtime-Wirkung, Verifikation und offene Grenzen.

### FINAL-GREEN

Pflichtchecks:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts
corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts
```

Nach Merge auf `main` im Hauptworkspace dieselben relevanten Checks wiederholen.

## Verifikationsregeln

- Nach jedem Paket paketbezogene Vitest-Dateien und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Am Ende vollständiger `corepack pnpm --filter @netgrid/ai test`.
- Wenn Dateien außerhalb `packages/ai` geändert werden, betroffene Paketchecks ergänzen.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Arbeits-Worktree.
- Hauptworkspace nur für finalen lokalen Merge.
- Jeder Paketabschluss erhält einen thematischen Commit.
- Kein Push und kein Pull Request.
- Vor finalem Merge Arbeitsbranch sauber und grün.
- Aktuelles `main` vor finalem Merge in den Arbeitsbranch integrieren.
- Fast-Forward-Merge nach `main` bevorzugt; falls nicht möglich, Ursache prüfen und dokumentieren.
- Arbeits-Worktree erst nach erfolgreichem Merge und Hauptworkspace-Checks entfernen.

## Controller-Prompt-Kern

```text
/Goal Arbeite die Paketserie AI-PLAY-0 bis AI-PLAY-9 plus FINAL-GREEN vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-planning-agent.md, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_PLAY_STRENGTH_DECISION_SPINE auf Branch codex/ai-play-strength-decision-spine.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- AI-PLAY-0 bis AI-PLAY-9 und FINAL-GREEN sind abgeschlossen oder ein Sicherheitsblocker ist dokumentiert.
- Alle Paketcommits liegen auf `codex/ai-play-strength-decision-spine`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Default-Runtime bleibt unverändert; lokaler Pilot ist default-off.
- Vollständiger `@netgrid/ai` Testlauf, Typecheck und `git diff --check` sind grün.
- Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace ist nach Merge geprüft.
- Arbeits-Worktree ist entfernt.
