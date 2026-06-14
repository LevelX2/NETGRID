# AI199 Scorecard v5 - Binding and Replay Proof

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI199 erweitert die Scorecard um Binding-, TargetIdentity-, Dry-Run-, Replay-, Coverage-, Corp-Tempo-, Stale-Punish- und Runtime-Flag-Metriken.

## Scorecard

| Metrik | ZÃ¤hler/Nenner | Rate | Hinweis |
| --- | ---: | ---: | --- |
| `candidate_path_binding_rate` | 21/103 | 20.4% | Share of CandidatePathBindings with signature, action reference, no hard gate and non-blocking target seed. |
| `target_identity_complete_rate` | 33/103 | 32.0% | Share of CandidatePathBindings with complete or irrelevant TargetIdentity v2. |
| `dry_run_build_rate` | 0/103 | 0.0% | Share of bindings that build a structural PlayerAction in the test-only dry-run builder. |
| `replay_probe_pass_rate` | 0/103 | 0.0% | Share of candidates with a successful PlayerAction replay probe. |
| `coverage_binding_candidate_rate` | 9/13 | 69.2% | Share of Coverage cases with at least one CandidatePathBinding. |
| `corp_tempo_binding_candidate_rate` | 13/17 | 76.5% | Share of Corp-Tempo cases with at least one CandidatePathBinding. |
| `stale_punish_replacement_candidate_rate` | 17/20 | 85.0% | Share of stale punish cases with a shadow replacement-goal candidate. |
| `runtime_flagged_candidate_count` | 0/1 | 0.0% | Count-like gate for any default-off opportunity micro-cutover candidate. |

## Schluss

Der aktuelle Blocker ist `action_id_redacted_and_replay_probe_missing`. CandidatePathBinding und TargetIdentity v2 sind messbar besser, aber Dry-Run, Replay-Probe und Runtime-Flag bleiben bei 0. Damit bleibt ein Runtime-Cutover No-Go.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai199-scorecard-v5-binding-replay-proof.ts`
- `git diff --check`
