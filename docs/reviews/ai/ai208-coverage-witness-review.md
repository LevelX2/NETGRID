# AI208 Coverage Witness Review

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI208 prueft die 13 Coverage-Faelle mit Witness/TargetRef-Evidence. Relevant sind Install-/Search-/Draw-/Credit-Alternativen fuer fehlende ICE-Type-Coverage; es gibt keinen Draw-/Credit-Malus und keine Runtime-Wirkung.

## Relevante Kartenlinien

| Karte oder Linie |
| --- |
| Self-Modifying Code |
| Temple Microcode Outlet |
| The Short Circuit |
| Codecracker |
| Dwarf |
| Worm |
| Corrosion |
| Skeleton Passkeys |
| Boring Bit |

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-Faelle | 13 |
| Faelle mit Witness-Projection | 9 |
| Witness-Projections | 27 |
| witness-buildable Cases | 0 |
| sichtbare Coverage-Loesung | 5 |
| Install/Search-Pfad | 5 |
| Runtime-Effekte | 0 |

## Cases

| Case | Visible solution | Install | Search | Witness-Projections | Buildable | Gate | TargetRefs |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | no | no | no | 0 | 0 | `blocked` | none |
| `A-ai-v143-tuning-009` | yes | yes | no | 2 | 0 | `blocked` | `ownInstalled:actorKnownRef:wall_of_static` |
| `B-ai-v143-tuning-006` | no | no | no | 3 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `B-ai-v143-tuning-008` | no | no | no | 2 | 0 | `blocked` | `ownInstalled:actorKnownRef:bodyweight_synthetic_blood`, `unknown_unprojected:unknown` |
| `B-ai-v143-tuning-009` | no | no | no | 3 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-001` | no | no | no | 2 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-005` | yes | yes | no | 2 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `C-ai-v143-tuning-006` | no | no | no | 0 | 0 | `blocked` | none |
| `C-ai-v143-tuning-008` | yes | yes | no | 0 | 0 | `blocked` | none |
| `D-ai-v143-tuning-003` | yes | yes | no | 6 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-004` | no | no | no | 3 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-008` | yes | yes | no | 4 | 0 | `blocked` | `unknown_unprojected:unknown` |
| `D-ai-v143-tuning-010` | no | no | no | 0 | 0 | `blocked` | none |

## Blocker

| Blocker | Count |
| --- | ---: |
| `action_id_redacted` | 9 |
| `binding:blocked_reason:plan_mismatch` | 7 |
| `binding:blocked_reason:semantic_excluded:archives_known_no_agenda` | 3 |
| `binding:blocked_reason:semantic_excluded:known_ice_path_no_access` | 2 |
| `binding:hard_gate_blocked` | 8 |
| `binding:server_target_missing` | 3 |
| `binding:target_blocked_by_hard_gate` | 8 |
| `binding:target_identity_unresolved` | 2 |
| `blocked_reason:plan_mismatch` | 7 |
| `blocked_reason:semantic_excluded:archives_known_no_agenda` | 3 |
| `blocked_reason:semantic_excluded:known_ice_path_no_access` | 2 |
| `hard_gate_blocked` | 8 |
| `legalaction_witness_missing` | 9 |
| `legalaction_witness_missing_real_action_id` | 9 |
| `server_target_missing` | 3 |
| `target_blocked_by_hard_gate` | 8 |
| `target_identity_unresolved` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 8 |

## Schluss

AI208 findet Coverage-Faelle mit TargetRef-gebundenen Witness-Projections, aber 0 witness-buildable Kandidaten. Der Blocker bleibt nicht ein Draw-/Credit-Scoreproblem, sondern fehlende echte LegalActionWitness-/actionId-Evidence.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai208-coverage-witness-review.ts`
- `git diff --check`
