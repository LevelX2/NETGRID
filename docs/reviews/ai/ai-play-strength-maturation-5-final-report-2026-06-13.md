# AI Play-Strength Maturation 5 Final Report

Status: `completed_pending_final_green`

Datum: 2026-06-13

Branch: `codex/ai-play-strength-maturation-5`

## Status

AI-MAT5-0 bis AI-MAT5-24 wurden paketweise umgesetzt und committed. Die Serie bleibt LegalActions-only, side-safe und ohne neue Engine-Regelautorität.

## MAT4 / Holovid-Einordnung

Der MAT4-Engine-Touch wurde als Import-/Bootstrap-Touch ohne Rules-, LegalAction- oder `applyAction`-Änderung eingeordnet. Der Holovid-Fix wurde nicht als CardId-Sonderfall fortgeführt, sondern in `KnownRemoteAccessCommitment`, AccessDecisionProjection und Outcome-Memory verallgemeinert.

## Evidence Scrub Fix

Runtime-Score-Component-Evidence nutzt jetzt die zentrale semantische Redaction statt grobem `_1`-Scrubbing. Dadurch bleiben side-sichere Evidence-Werte erhalten, während verbotene Hidden-Info-Marker weiterhin entfernt werden.

## KnownRemoteAccessCommitment

Bekannte Remote-Zugriffe werden als eigenes Decision-Modul modelliert. Agenda-Steal, Trash, Access-only und Decline werden mit Gründen wie Reservebruch, Low-Value-Target, finite-pool depletion, Agenda-Payoff und Trash-Affordability beschrieben.

## AccessDecisionProjection

Pre-run, Access-Window und Plan-Memory nutzen dieselbe AccessDecisionProjection für Steal, Trash, Decline, Free Trash, Trash-Cost-Waiver, Reservebruch und finite pool value remaining. TargetChoice-`wouldSelect` kann als Dry-Run-Evidence angebunden werden, ohne `selectedChoices` oder `selectedTargets` zu erzeugen.

## Pilot Policy

`basic_setup` hat einen expliziten lokalen Default-Env-Pfad über `NETGRID_AI_PLAY_STRENGTH_LOCAL_DEFAULT=basic_setup`, nur wenn `NETGRID_AI_PLAY_STRENGTH_PILOT` unset ist. `runner_safe_access` bleibt explicit-env. `corp_score_window` bleibt env-gated. `remote_contest` bleibt report-only und ist kein Pilot-Scope.

## TargetChoice Followups

TargetChoice-Readiness erzeugt jetzt konkrete Follow-up-Kandidaten:

- `missing_side_safe_options`
- `engine_only_target`
- `tie_without_preference`
- `hidden_info_blocked`
- `scorecard_unclear`

Diese Kandidaten wurden in Real-Engine-Corpus-Regressionschecks übernommen.

## Originalset Worklists

Diagnostische Invariant-Tests und Records wurden ergänzt für:

- Runner Multiaccess / Access Payoff
- Runner Economy / Commitment
- Corp Remote Economy / Asset
- Corp ICE Tax / Rez Economy

Alle Worklists bleiben diagnostic-only und erzeugen keine Runtime-Gewichtung.

## Proteus Model Backlog

Proteus-Readiness wurde in technische Modellpakete übersetzt:

- `random_outcome_model`
- `bad_publicity_model`
- `hidden_resource_model`
- `virus_counter_model`
- `x_cost_model`
- `temporary_action_model`
- `access_ambush_model`
- `run_modification_model`

`random_outcome_model` hat ein erstes report-only Readiness-Modul für AI Board Member, Bargain with Viacox, Quest for Cattekin, Playful AI, Roadblock und Rio de Janeiro City Grid.

## Selfplay Promotion

Die Selfplay-Promotion-Queue kann Activity-Markdown-Kandidaten formatieren. Der Formatter schreibt keine Dateien und setzt `writeAllowed: false`.

## ShadowLeague Report Formatting

SemanticShadowLeagueDelta enthält eine Dashboard-Summary. Der neue Formatter erzeugt einen redaction-sicheren Markdown-Report für Delta-Metriken, Pilot Readiness und Evidence.

## Nicht Geändert

- Keine Engine-Regeländerungen.
- Keine neuen LegalActions.
- Keine öffentlichen API-Exports für MAT5-Internals.
- Keine Produktivaktivierung von TargetChoice, RemoteContest, Proteus-Modellen oder Worklist-Semantik.
- Keine Hidden-Info-Allowlist-Erweiterung.

## Verifikation

Paketweise wurden die jeweils relevanten fokussierten Vitest-Läufe, `@netgrid/ai typecheck` und `git diff --check` ausgeführt. Längere bestehende Simulations-/Delta-/Index-Tests wurden bei Bedarf mit explizit erhöhtem `--testTimeout` erneut ausgeführt und bestanden.

Der finale Full-Green-Gate nach diesem Bericht bleibt:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```
