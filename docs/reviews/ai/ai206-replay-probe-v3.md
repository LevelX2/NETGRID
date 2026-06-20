# AI206 Replay Probe v3

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI206 replay-probt nur PlayerActions, die aus echten LegalActionWitnesses gebaut wurden. Es gibt keine synthetische Replay-Probe fuer redigierte Candidate-Pfade.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | 103 |
| buildbare PlayerActions | 0 |
| replay-probed | 0 |
| replay passed | 0 |
| not probeable | 103 |
| IllegalActions | 0 |
| ReplayFailures | 0 |
| Runtime-Effekte | 0 |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | TargetRef | Probe | Blocker |
| --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `ownInstalled:actorKnownRef:wall_of_static` | `not_probeable` | `playeraction_not_built`, `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `choice:unknown` | `not_probeable` | `playeraction_not_built`, `binding:choice_option_missing`, `choice_option_missing`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `none` | `not_probeable` | `playeraction_not_built`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `none` | `not_probeable` | `playeraction_not_built`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `ownInstalled:actorKnownRef:wall_of_static` | `not_probeable` | `playeraction_not_built`, `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `none` | `not_probeable` | `playeraction_not_built`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `ownInstalled:actorKnownRef:corporate_war` | `not_probeable` | `playeraction_not_built`, `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `none` | `not_probeable` | `playeraction_not_built`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `none` | `not_probeable` | `playeraction_not_built`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |

## Blocker

| Blocker | Count |
| --- | ---: |
| `binding:blocked_reason:plan_mismatch` | 47 |
| `binding:blocked_reason:semantic_excluded:archives_known_no_agenda` | 7 |
| `binding:blocked_reason:semantic_excluded:known_ice_path_no_access` | 6 |
| `binding:choice_option_missing` | 2 |
| `binding:hard_gate_blocked` | 60 |
| `binding:server_target_missing` | 6 |
| `binding:target_blocked_by_hard_gate` | 60 |
| `binding:target_identity_unresolved` | 14 |
| `choice_option_missing` | 2 |
| `legalaction_witness_missing` | 103 |
| `legalaction_witness_missing_real_action_id` | 103 |
| `playeraction_not_built` | 103 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved` | 2 |

## Removal Conditions

| Bedingung |
| --- |
| LegalActionWitness present in opportunity snapshot |
| buildPlayerActionFromWitness returns built |
| same-state snapshot harness available |
| applyAction accepts the PlayerAction |
| Replay and StateHash remain deterministic |

## Schluss

AI206 ist ein korrektes No-Go: `playeraction_replay_probe_pass_rate` bleibt 0, weil AI205 keine PlayerAction aus echten Witnesses bauen kann. Es gab keine IllegalActions und keine ReplayFailures, weil kein unsicherer Apply-Pfad ausgefuehrt wurde.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai206-replay-probe-v3.ts`
- `git diff --check`
