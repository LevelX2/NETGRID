# AI198 Opportunity Micro-Cutover Experiment

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI198 darf genau einen Opportunity-Micro-Cutover testen, aber nur wenn CandidatePathBinding, TargetIdentity, PlayerAction-Dry-Run und Replay-Probe vollstÃ¤ndig proof-fÃ¤hig sind.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprÃ¼fte Bindings | 103 |
| eligible Micro-Cutover-Kandidaten | 0 |
| Runtime-geflaggte Kandidaten | 0 |
| No-Go | 1 |

## Runtime

| Feld | Wert |
| --- | --- |
| Flag | `NETGRID_AI_OPPORTUNITY_MICRO_CUTOVER` |
| Default | `off` |
| implementiert | 0 |
| Grund | `no proof-complete candidate` |

## Fehlende Gates

| Gate | Count |
| --- | ---: |
| `candidate_path_binding_complete` | 82 |
| `playeraction_dry_run_passed` | 103 |
| `replay_probe_passed` | 103 |
| `target_identity_complete_or_irrelevant` | 70 |
| `x10_not_worse` | 103 |
| `x5_not_worse` | 103 |

## Blocker

| Blocker | Count |
| --- | ---: |
| `action_id_redacted` | 103 |
| `binding:blocked_reason:plan_mismatch` | 47 |
| `binding:blocked_reason:semantic_excluded:archives_known_no_agenda` | 7 |
| `binding:blocked_reason:semantic_excluded:known_ice_path_no_access` | 6 |
| `binding:choice_option_missing` | 2 |
| `binding:hard_gate_blocked` | 60 |
| `binding:server_target_missing` | 6 |
| `binding:target_blocked_by_hard_gate` | 60 |
| `binding:target_identity_unresolved` | 14 |
| `blocked_reason:plan_mismatch` | 47 |
| `blocked_reason:semantic_excluded:archives_known_no_agenda` | 7 |
| `blocked_reason:semantic_excluded:known_ice_path_no_access` | 6 |
| `choice_option_missing` | 2 |
| `hard_gate_blocked` | 60 |
| `provide real actionId plus same-state replayable action proof` | 103 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved` | 14 |
| `target_identity_unresolved_from_snapshot` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 66 |

## Schluss

AI198 bleibt No-Go. Es gibt keinen Kandidaten mit echter PlayerAction-Dry-Run- und Replay-Proof-Kette. Deshalb wird kein Runtime-Flag implementiert, kein Score geÃ¤ndert und kein Micro-Cutover aktiviert.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai198-opportunity-micro-cutover-experiment.ts`
- `git diff --check`
