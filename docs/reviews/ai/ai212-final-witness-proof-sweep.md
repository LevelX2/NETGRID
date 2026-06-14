# AI212 Full Sweep - Witness Proof

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI212 schliesst AI201 bis AI212 mit vollstaendigem Verify-Lauf, finalen x5-/x10-Traces und Scorecard-v6-Stand ab.

## Scorecard v6

| Metrik | Zaehler/Nenner | Rate |
| --- | ---: | ---: |
| `legalaction_witness_rate` | 0/103 | 0.0% |
| `targetref_complete_or_irrelevant_rate` | 33/103 | 32.0% |
| `candidate_path_binding_from_witness_rate` | 0/103 | 0.0% |
| `playeraction_build_rate` | 0/103 | 0.0% |
| `replay_probe_pass_rate` | 0/103 | 0.0% |
| `coverage_witness_candidate_rate` | 9/13 | 69.2% |
| `corp_tempo_witness_candidate_rate` | 13/17 | 76.5% |
| `punish_goal_switch_candidate_rate` | 20/20 | 100.0% |
| `runtime_flagged_candidate_count` | 0/1 | 0.0% |

Aktueller Blocker: `legalaction_witness_missing_real_action_id`

Runtime-Cutover-eligible: `false`

## Sweep-Ergebnis

| Sweep | Games | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | Redaction Safe | Avg Length | Corp Scores | Runner Steals | Flatlines |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| x5 | 20 | 11 | 0 | 0 | 0 | safe | 124.6 | 13 | 28 | 5 |
| x10 | 40 | 23 | 0 | 0 | 0 | safe | 129.45 | 23 | 49 | 10 |

## Vergleich zu AI200

| Sweep | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | High Findings | Critical Findings | Gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| x5 | 0 | 0 | 0 | 0 | 0 | 0 | `not_worse` |
| x10 | 0 | 0 | 0 | 0 | 0 | 0 | `not_worse` |

## Checks

| Befehl | Status |
| --- | --- |
| `corepack pnpm install --frozen-lockfile` | `passed` |
| `corepack pnpm test` | `passed` |
| `corepack pnpm -r --if-present run typecheck` | `passed` |
| `corepack pnpm -r --if-present run test` | `passed` |
| `corepack pnpm --filter @netgrid/ai test` | `passed` |
| `corepack pnpm --filter @netgrid/engine test` | `passed` |
| `corepack pnpm --filter @netgrid/server test` | `passed` |
| `corepack pnpm --filter @netgrid/web test` | `passed` |
| `finaler x5 Trace` | `passed` |
| `finaler x10 Trace` | `passed` |
| `git diff --check` | `passed` |

## Teststabilisierung

| Aenderung |
| --- |
| packages/ai/src/index.test.ts: V1.4.3 league timeout 120s |
| packages/ai/src/index.test.ts: V0.9 soak timeout 120s |
| packages/ai/src/simulation/benchmark-reports.test.ts: doctrine quality benchmark timeout 60s |
| packages/ai/src/simulation/benchmark-reports.test.ts: deck-separated match progression suite timeout 120s |
| packages/ai/src/simulation/benchmark-reports.test.ts: trace mining report timeout 60s |
| packages/ai/src/simulation/benchmark-reports.test.ts: action alternative snapshot timeout 90s |
| packages/ai/src/simulation/simulation-harness.test.ts: deterministic AI-vs-AI replay timeout 45s |
| packages/engine/src/index.test.ts: agenda shuffle timeout 15s |
| packages/engine/src/index.test.ts: HQ access replay timeout 15s |

## Schluss

AI212 ist safety-gruen: x5 und x10 bleiben gegen AI200 in den harten Gates nicht schlechter. Action-Limits bleiben bei 11/20 und 23/40; IllegalActions, ReplayFailures und Hidden-Info-Marker bleiben jeweils 0. Es gibt weiterhin keinen Runtime-Fix und keinen default-off Micro-Cutover, weil echte LegalActionWitnesses, aus Witness abgeleitete PlayerActions und Replay-Probe-Passes fehlen.

## Verifikation

Alle oben gelisteten Checks wurden im Worktree `C:\Projekte\NETGRID-worktrees\ai201-ai212-witness-proof` ausgefuehrt.
