# AI209 Corp Scoreline/Tempo Witness Review

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI209 prueft Corp-Scoreline-/Tempo-Kandidaten gegen Witness/TargetRef-Evidence. Es gibt keine generischen Credit-/Draw-/Run-Punishments, keine Runtime-Gewichte und keine Runtime-Wirkung.

## Relevante Kartenlinien

| Karte oder Linie |
| --- |
| Corporate Boon |
| Corporate Coup |
| Political Coup |
| Project Consultants |
| Management Shake-Up |
| Systematic Layoffs |
| Chicago Branch |
| On-Call Solo Team |
| Scorched Earth |
| Urban Renewal |
| Solo Squad |

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-Tempo-Faelle | 17 |
| Faelle mit Witness-Projection | 13 |
| Witness-Projections | 76 |
| complete/irrelevant TargetRefs | 30 |
| witness-buildable Cases | 0 |
| Scoreline-Cases | 0 |
| Advance legal Cases | 1 |
| Protection-Cases | 10 |
| Punish-Replacement-Cases | 13 |
| Dry-run-capable | 0 |
| Runtime-Effekte | 0 |

## Witness Action Types

| Action Type | Count |
| --- | ---: |
| `coverage_setup` | 3 |
| `economy` | 13 |
| `scoreline` | 2 |
| `server_protection` | 9 |

## Cases

| Case | Primaerpfad | Advance legal | Protection legal | Witness-Projections | TargetRefs complete/irrelevant | Buildable | Gate | TargetRefs |
| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `opaque_ability` | no | no | 0 | 0 | 0 | `blocked` | none |
| `A-ai-v143-tuning-008` | `opaque_or_basic` | no | no | 0 | 0 | 0 | `blocked` | none |
| `A-ai-v143-tuning-009` | `scoreline` | no | yes | 11 | 9 | 0 | `blocked` | `choice:unknown`, `none`, `ownInstalled:actorKnownRef:wall_of_static`, `ownInstalled:actorKnownRef:off_site_backups` |
| `B-ai-v143-tuning-001` | `scoreline` | yes | no | 10 | 7 | 0 | `blocked` | `ownInstalled:actorKnownRef:corporate_war`, `none`, `unknown_unprojected:unknown` |
| `B-ai-v143-tuning-003` | `opaque_or_basic` | no | no | 0 | 0 | 0 | `blocked` | none |
| `B-ai-v143-tuning-006` | `scoreline` | no | yes | 6 | 1 | 0 | `blocked` | `none`, `unknown_unprojected:unknown` |
| `B-ai-v143-tuning-008` | `scoreline` | no | yes | 6 | 2 | 0 | `blocked` | `ownInstalled:actorKnownRef:bodyweight_synthetic_blood`, `unknown_unprojected:unknown`, `none` |
| `B-ai-v143-tuning-009` | `scoreline` | no | yes | 6 | 1 | 0 | `blocked` | `none`, `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-001` | `scoreline` | no | yes | 6 | 1 | 0 | `blocked` | `ownInstalled:actorKnownRef:mantis_fixer_at_large`, `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-005` | `scoreline` | no | yes | 5 | 1 | 0 | `blocked` | `none`, `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-006` | `economy` | no | no | 1 | 0 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-007` | `scoreline` | no | no | 6 | 4 | 0 | `blocked` | `unknown_unprojected:unknown`, `none`, `ownInstalled:actorKnownRef:tycho_mem_chip` |
| `C-ai-v143-tuning-008` | `scoreline` | no | yes | 6 | 1 | 0 | `blocked` | `ownInstalled:actorKnownRef:bbs_whispering_campaign`, `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-003` | `scoreline` | no | yes | 3 | 0 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-004` | `scoreline` | no | yes | 6 | 3 | 0 | `blocked` | `none`, `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-008` | `scoreline` | no | yes | 4 | 0 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-010` | `opaque_ability` | no | no | 0 | 0 | 0 | `blocked` | none |

## Blocker

| Blocker | Count |
| --- | ---: |
| `action_id_redacted` | 13 |
| `binding:blocked_reason:plan_mismatch` | 9 |
| `binding:blocked_reason:semantic_excluded:archives_known_no_agenda` | 4 |
| `binding:blocked_reason:semantic_excluded:known_ice_path_no_access` | 2 |
| `binding:choice_option_missing` | 1 |
| `binding:hard_gate_blocked` | 11 |
| `binding:server_target_missing` | 3 |
| `binding:target_blocked_by_hard_gate` | 11 |
| `binding:target_identity_unresolved` | 7 |
| `blocked_reason:plan_mismatch` | 9 |
| `blocked_reason:semantic_excluded:archives_known_no_agenda` | 4 |
| `blocked_reason:semantic_excluded:known_ice_path_no_access` | 2 |
| `choice_option_missing` | 1 |
| `hard_gate_blocked` | 11 |
| `legalaction_witness_missing` | 13 |
| `legalaction_witness_missing_real_action_id` | 13 |
| `server_target_missing` | 3 |
| `target_blocked_by_hard_gate` | 11 |
| `target_identity_unresolved` | 7 |
| `target_identity_unresolved_from_snapshot` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 13 |

## Schluss

AI209 findet Corp-Tempo-/Scoreline-Faelle mit TargetRef-gebundenen Witness-Projections, aber 0 witness-buildable Kandidaten. Advance/Protection/Scoreline bleiben dadurch weiter ein Evidence-Thema: Ohne echte LegalActionWitnesses und aus Witness abgeleitete CandidatePathBindings gibt es keinen Micro-Cutover.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai209-corp-tempo-witness-review.ts`
- `git diff --check`
