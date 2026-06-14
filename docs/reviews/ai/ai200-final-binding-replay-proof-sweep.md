# AI200 Final Binding Replay Proof Sweep

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI200 schlieÃŸt AI191 bis AI200 mit vollstÃ¤ndigem lokalen Verify-Lauf, finalen x5-/x10-Traces und Scorecard-v5-Stand ab.

## Scorecard v5

| Metrik | ZÃ¤hler/Nenner | Rate |
| --- | ---: | ---: |
| `candidate_path_binding_rate` | 21/103 | 20.4% |
| `target_identity_complete_rate` | 33/103 | 32.0% |
| `dry_run_build_rate` | 0/103 | 0.0% |
| `replay_probe_pass_rate` | 0/103 | 0.0% |
| `coverage_binding_candidate_rate` | 9/13 | 69.2% |
| `corp_tempo_binding_candidate_rate` | 13/17 | 76.5% |
| `stale_punish_replacement_candidate_rate` | 17/20 | 85.0% |
| `runtime_flagged_candidate_count` | 0/1 | 0.0% |

Aktueller Blocker: `action_id_redacted_and_replay_probe_missing`.

## Sweep-Ergebnis

| Sweep | Games | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | Redaction Safe | Avg Length | Corp Scores | Runner Steals | Flatlines |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| x5 | 20 | 11 | 0 | 0 | 0 | safe | 124.6 | 13 | 28 | 5 |
| x10 | 40 | 23 | 0 | 0 | 0 | safe | 129.45 | 23 | 49 | 10 |

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
| `git diff --check` | `passed` |
| `finaler x5 Trace` | `passed` |
| `finaler x10 Trace` | `passed` |

## Teststabilisierung

| Ã„nderung |
| --- |
| packages/ai/package.json: AI Vitest uses one worker and 30s default timeout |
| packages/ai/src/index.test.ts: V0.8 starter smoke timeout 30s |
| apps/web/app/api/cards/catalog-data.test.ts: Proteus baseline catalog timeout 45s |
| apps/server/src/multiplayer.test.ts: AI-vs-AI simulation API timeout 15s |

## Schluss

AI200 ist safety-grÃ¼n. x5 und x10 sind gegen AI190 nicht schlechter: x5 bleibt bei 11/20 Action-Limits, x10 bleibt bei 23/40 Action-Limits; IllegalActions, ReplayFailures und Hidden-Info-Marker bleiben jeweils 0. Es gibt keinen Runtime-Fix und keinen default-off Micro-Cutover, weil echte `actionId` und Replay-Probe weiterhin fehlen.
