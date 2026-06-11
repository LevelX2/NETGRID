# AI095-AI100 Action-Limit Closure Prozess

## Ausgangslage

Dieser Paketprozess setzt die GitHub-Ergebnisanalyse zu AI088-AI094 um. Der dort geprüfte Remote-Stand war `origin/main` bei `ed0c0f7b4e9a3ed4702fc7004b61abca63dfd106`. Der lokale Integrationsstand beim Prozessstart ist `main` bei `6eb4973e` und enthält zusätzlich lokale Folgecommits. Der Arbeitsbranch startet bewusst von diesem lokalen `main`, weil `main` die lokale Integrationslinie des Projekts ist.

AI094 ist fachlich sicher, aber noch nicht vollständig geschlossen:

- `illegalActions = 0`
- `replayFailures = 0`
- `criticalFindings = 0`
- `allRedactionSafe = true`
- `unsafeScoreChosen = 3`
- `repeated_no_progress_run = 33`
- `actionLimitReached = 10`

Der verbleibende Zielkonflikt liegt in `actionLimitReached`: Die bisherige Zielmarke `<= 8` wurde nicht erreicht. Die Analyse nennt als Restursachen vor allem `late_gain_credit_without_funding_need` und `late_run_step_stall`. Runtime-Änderungen dürfen nur erfolgen, wenn sie klar eng begrenzt sind und keine Hidden-Info-, Replay-, Legalitäts- oder Unsafe-Score-Regressionsrisiken erzeugen.

## /Goal

NETGRID Folgeblock AI095-AI100 gemäß `paketprozess-worktree-goal` umsetzen: Current-HEAD-Rebaseline nach AI-Play-Strength, Late-Gain-Credit-/Run-Step-Stall-/Corp-Score-Output-/ActionLimit-Closure-Prüfungen, finaler Full Sweep, Commit je Paket, lokaler Merge nach `main` und Worktree-Aufräumung.

## Arbeitsmodell

- Branch: `codex/ai095-ai100-action-limit-closure`
- Worktree: `C:\Projekte\NETGRID_AI095_AI100_ACTION_LIMIT_CLOSURE`
- Basis: lokaler `main` bei `6eb4973e`
- Paketabschluss: jedes Paket bekommt einen eigenen Commit.
- Abschluss: nach grünem Schlussstand wird der Arbeitsbranch lokal nach `main` integriert und der Worktree entfernt.
- Kein Push ohne gesonderten Nutzerauftrag.

## Paketfolge

### AI095 Current-HEAD Rebaseline nach AI-Play-Strength-Merge

Ziel: Den aktuellen lokalen Integrationsstand gegen die AI094-Baseline neu vermessen.

Pflichtchecks:

- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `git diff --check`
- A-D-x5 Trace-Matrix

Artefakte:

- `docs/reviews/ai/ai095-current-head-rebaseline-after-play-strength-2026-06-11.md`
- `docs/reviews/ai/ai095-current-head-a-d-5seed-2026-06-11.json`

Commit: `test(ai): rebaseline current head after play strength merge`

### AI096 Late Gain Credit Without Funding Need v2

Ziel: Den dominanten Restcluster nur dort reduzieren, wo wiederholtes `gain_credit` ohne Finanzierungs-, Rez-, Schutz- oder Überlebensbedarf eine sichere Progress-Alternative verdrängt.

Umsetzung:

- Trace-Diagnose nach Runner/Corp und echter Reserve/Safety-Notwendigkeit trennen.
- Runtime-Malus nur eng begrenzt anwenden:
  - wiederholtes `gain_credit`
  - kein Funding-, Rez-, Protection- oder Survival-Bedarf
  - legale sichere Progress-Aktion vorhanden
  - nicht durch Same-Server-No-Progress, Unsafe-Score oder Known-No-Payoff blockiert
- Tests für sichere Progress-Alternative, echte Reserve, unsafe score und repeated no-progress run ergänzen.

Commit: `fix(ai): reduce late gain credit stalls with safe alternatives`

### AI097 Late Run Step Stall Fixture and Classifier

Ziel: `late_run_step_stall` zwischen notwendigen Run-Microsteps und echten Stalls unterscheiden.

Umsetzung:

- Subcluster erweitern:
  - `run_microstep_required`
  - `continue_chain_to_access`
  - `break_pump_required`
  - `jackout_loop`
  - `continue_without_progress`
  - `access_pending`
  - `breach_pending`
- Zuerst nur Klassifikation/Tests; Runtime-Änderung nur bei klar isoliertem Stall mit sicherer Alternative.

Commit: `fix(ai): classify late run-step stalls without penalizing microsteps`

### AI098 Corp Score Output Watch

Ziel: Bewerten, ob `corpAgendaScores = 12` ein akzeptabler Safety-Tradeoff oder ein echter Scoreline-Aussetzer ist.

Umsetzung:

- Keine direkte Score-Buff-Änderung.
- 20 Spiele auf verpasste sichere Scorefenster, korrekt blockierte Safety-Gates, Protection/Advance-Alternativen und Flatline-Siege prüfen.
- Nur bei eindeutig verpasstem sicherem Scorefenster eng korrigieren.

Commit: `docs(ai): audit corp score output after safety gates`

### AI099 ActionLimit Goal Closure Review

Ziel: Nach AI096-AI098 entscheiden, ob `actionLimitReached <= 8` sicher erreichbar ist oder der Restbefund fachlich begründet offen bleibt.

Umsetzung:

- A-D-x5 erneut ausführen.
- Optional A-D-x10, wenn die x5-Ergebnisse nahe am Ziel liegen oder instabil wirken.
- AI094 zu AI099 vergleichen und Restspiele begründen.

Commit: `docs(ai): review action-limit closure after targeted fixes`

### AI100 Full Test Sweep and Bug Fixing

Ziel: Finaler grüner Gesamtstand des Folgeblocks.

Pflichtchecks:

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `git diff --check`
- finale A-D-x5 Trace-Matrix

Artefakte:

- `docs/reviews/ai/ai100-final-full-sweep-review-2026-06-11.md`
- `docs/reviews/ai/ai100-final-a-d-5seed-2026-06-11.json`

Commit: `test(ai): complete action-limit closure sweep`

## Stop-Regeln

- Keine Testlöschung zur Erzielung eines grünen Laufs.
- Keine Redaction- oder Hidden-Info-Aufweichung.
- Keine generische Action-Preference-Strafe, wenn die Ursache nicht klar isoliert ist.
- Keine Unsafe-Score-Verschlechterung über den AI094-Wert `3`.
- Keine Änderung an LegalActions/PlayerActions-Regelautorität außerhalb eines klar begründeten Bugs.
