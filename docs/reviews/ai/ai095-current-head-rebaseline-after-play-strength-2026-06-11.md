# AI095 Current-Head Rebaseline After Play Strength

Datum: 2026-06-11

Branch: `codex/ai095-ai100-action-limit-closure`

Lokaler Start-HEAD: `6eb4973e`

Trace-HEAD: siehe `gitHead` in `docs/reviews/ai/ai095-current-head-a-d-5seed-2026-06-11.json`

Remote-Referenz aus der Ergebnisanalyse: `origin/main` bei `ed0c0f7b4e9a3ed4702fc7004b61abca63dfd106`

## Ergebnis

AI095 bestätigt den AI094-Stand auf dem aktuellen lokalen Integrationsbranch nach den zusätzlichen lokalen Commits. Die Sicherheitsmarker bleiben grün und die Action-Limit-Restursache bleibt unverändert:

- `illegalActions = 0`
- `replayFailures = 0`
- `criticalFindings = 0`
- `allRedactionSafe = true`
- `unsafeScoreChosen = 3`
- `repeated_no_progress_run = 33`
- `actionLimitReached = 10`

Damit bleiben AI096 und AI097 fachlich unverändert relevant. AI096 muss den `late_gain_credit_without_funding_need`-Rest nur bei klar sicherer Alternative angreifen. AI097 muss `late_run_step_stall` zuerst besser klassifizieren, damit notwendige Run-Microsteps nicht fälschlich als Stall bestraft werden.

## Setup-Hinweis

Der erste Root-Testlauf im frischen Worktree scheiterte vor der Projektausführung, weil `node_modules` noch fehlte und `vitest` nicht gefunden wurde. Danach wurde ausgeführt:

```powershell
corepack pnpm install --frozen-lockfile
```

Der Installationslauf änderte keine versionierten Dateien. Alle folgenden Checks liefen danach erfolgreich.

## Verifikation

### Root-Test

Befehl:

```powershell
corepack pnpm test
```

Ergebnis:

- `packages/shared`: 1 Datei, 3 Tests grün
- `packages/catalog`: 2 Dateien, 14 Tests grün
- `packages/engine`: 157 Dateien, 1456 Tests grün
- `packages/decks`: 1 Datei, 15 Tests grün
- `packages/ai`: 63 Dateien, 1101 Tests grün
- `apps/web`: 33 Dateien, 415 Tests grün
- `apps/server`: 6 Dateien, 127 Tests grün
- Root-Specs: 2 Dateien, 5 Tests grün

### Typecheck

Befehl:

```powershell
corepack pnpm -r --if-present run typecheck
```

Ergebnis: alle Workspace-Projekte grün.

### Pakettests

Befehle:

```powershell
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
```

Ergebnis:

- `@netgrid/ai`: 63 Dateien, 1101 Tests grün
- `@netgrid/engine`: 157 Dateien, 1456 Tests grün
- `@netgrid/server`: 6 Dateien, 127 Tests grün

### Diff-Check

Befehl:

```powershell
git diff --check
```

Ergebnis: grün.

### A-D-x5 Trace

Befehl:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai095-current-head-a-d-5seed-2026-06-11.json
```

Quelle: `docs/reviews/ai/ai095-current-head-a-d-5seed-2026-06-11.json`

| Metrik | AI094 | AI095 |
| --- | ---: | ---: |
| Spiele | 20 | 20 |
| Entscheidungen | 2501 | 2501 |
| Critical Findings | 0 | 0 |
| High Findings | 3 | 3 |
| Illegal Actions | 0 | 0 |
| Replay Failures | 0 | 0 |
| Redaction Safe | 1 | 1 |
| `actionLimitReached` | 10 | 10 |
| `unsafeScoreChosen` | 3 | 3 |
| `repeated_no_progress_run` | 33 | 33 |
| `corp_never_scores_long_game` | 3 | 3 |
| `corpAgendaScores` | 12 | 12 |
| `runnerAgendaSteals` | 32 | 32 |
| `corpFlatlines` | 5 | 5 |

Action-Limit-Cluster:

| Cluster | AI095 |
| --- | ---: |
| `action_limit_low_value_repeat` | 7 |
| `action_limit_setup_economy_loop` | 1 |
| `action_limit_mixed_or_unknown` | 2 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |

Action-Limit-Subcluster:

| Subcluster | AI095 |
| --- | ---: |
| `late_gain_credit_without_funding_need` | 6 |
| `late_run_step_stall` | 4 |
| `late_draw_without_coverage_or_hand_goal` | 0 |
| `late_ability_reuse_low_delta` | 0 |
| `late_install_low_delta` | 0 |
| `mixed_unknown` | 0 |

## Schlussfolgerung

AI095 zeigt keine Regression durch den aktuellen lokalen Head. Die AI094-Folgeaufträge bleiben in gleicher Reihenfolge sinnvoll:

1. AI096: `late_gain_credit_without_funding_need` eng nach Seite, Reservebedarf und sicherer Alternative trennen.
2. AI097: `late_run_step_stall` klassifizieren, bevor Runtime-Scoring geändert wird.
3. AI098: `corpAgendaScores = 12` als Safety-Tradeoff prüfen, nicht pauschal buffen.
4. AI099/AI100: Action-Limit-Restziel gegen Safety-Gates abschließend bewerten.
