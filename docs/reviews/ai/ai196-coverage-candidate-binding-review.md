# AI196 Coverage Candidate Binding Review

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI196 prÃ¼ft die 13 Runner-Coverage-FÃ¤lle aus AI173 erneut mit CandidatePathBinding, TargetIdentity v2 und PlayerAction-Dry-Run-Ergebnis. Es wird kein Draw-/Credit-Malus abgeleitet.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Coverage-FÃ¤lle | 13 |
| Dry-Run-fÃ¤hig | 0 |
| blockiert | 13 |
| CandidatePathBindings | 26 |
| FÃ¤lle mit complete/irrelevant TargetIdentity | 2 |
| visible-installable FÃ¤lle | 5 |
| Runtime-Wirkungen | 0 |

## FÃ¤lle

| Case | Vorheriger Pfad | Bindings | TargetIdentity complete/irrelevant | Dry-Run gebaut | Gate | Source Definitions |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `no_solution_visible` | 0 | 0 | 0 | `blocked` | none |
| `A-ai-v143-tuning-009` | `visible_installable_solution` | 1 | 1 | 0 | `blocked` | `Wall of Static` |
| `B-ai-v143-tuning-006` | `draw_solution` | 3 | 0 | 0 | `blocked` | none |
| `B-ai-v143-tuning-008` | `draw_solution` | 2 | 1 | 0 | `blocked` | `Bodyweight™ Synthetic Blood` |
| `B-ai-v143-tuning-009` | `draw_solution` | 3 | 0 | 0 | `blocked` | none |
| `C-ai-v143-tuning-001` | `draw_solution` | 2 | 0 | 0 | `blocked` | none |
| `C-ai-v143-tuning-005` | `visible_installable_solution` | 2 | 0 | 0 | `blocked` | `Armored Fridge` |
| `C-ai-v143-tuning-006` | `no_solution_visible` | 0 | 0 | 0 | `blocked` | none |
| `C-ai-v143-tuning-008` | `visible_installable_solution` | 0 | 0 | 0 | `blocked` | none |
| `D-ai-v143-tuning-003` | `visible_installable_solution` | 6 | 0 | 0 | `blocked` | `Bartmoss Memorial Icebreaker` |
| `D-ai-v143-tuning-004` | `draw_solution` | 3 | 0 | 0 | `blocked` | none |
| `D-ai-v143-tuning-008` | `visible_installable_solution` | 4 | 0 | 0 | `blocked` | `Bartmoss Memorial Icebreaker`, `Broker` |
| `D-ai-v143-tuning-010` | `no_solution_visible` | 0 | 0 | 0 | `blocked` | none |

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
| `server_target_missing` | 3 |
| `target_blocked_by_hard_gate` | 8 |
| `target_identity_unresolved` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 8 |

## Schluss

Coverage-Kandidaten sind mit Bindings prÃ¤ziser reviewbar, aber weiterhin nicht Dry-Run-fÃ¤hig, weil die Snapshot-Artefakte keine echte `actionId` enthalten. Sichtbare installierbare LÃ¶sungen und relevante Programme bleiben Evidence, nicht Runtime-Gewichte.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai196-coverage-candidate-binding-review.ts`
- `git diff --check`
