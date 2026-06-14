# AI197 Corp Tempo Candidate Binding Review

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI197 prÃ¼ft Corp-Tempo-Kandidaten aus AI175/AI188 mit CandidatePathBinding, TargetIdentity v2, Dry-Run-FÃ¤higkeit und AI195-Punish-Replacement-Shadow. Es wird kein pauschaler Corp-Credit-Malus eingefÃ¼hrt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Corp-Tempo-FÃ¤lle | 17 |
| Dry-Run-fÃ¤hig | 0 |
| blockiert | 17 |
| CandidatePathBindings | 68 |
| FÃ¤lle mit complete/irrelevant TargetIdentity | 10 |
| Scoreline-FÃ¤lle | 0 |
| Protection-FÃ¤lle | 10 |
| Punish-Replacement-FÃ¤lle | 13 |
| Runtime-Wirkungen | 0 |

## FÃ¤lle

| Case | PrimÃ¤rpfad | Bindings | TargetIdentity complete/irrelevant | Dry-Run gebaut | Familien | Punish Replacement | Gate |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `A-ai-v143-tuning-006` | `opaque_ability` | 0 | 0 | 0 | none | `no_replacement_candidate` | `blocked` |
| `A-ai-v143-tuning-008` | `opaque_or_basic` | 0 | 0 | 0 | `punish_replacement` | `corp.replace_stale_punish_with_protection` | `blocked` |
| `A-ai-v143-tuning-009` | `scoreline` | 6 | 5 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `B-ai-v143-tuning-001` | `scoreline` | 7 | 4 | 0 | `advance`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_scoreline` | `blocked` |
| `B-ai-v143-tuning-003` | `opaque_or_basic` | 0 | 0 | 0 | `punish_replacement` | `corp.replace_stale_punish_with_protection` | `blocked` |
| `B-ai-v143-tuning-006` | `scoreline` | 6 | 1 | 0 | `protection_rez`, `economy_to_scoreline` | `no_replacement_candidate` | `blocked` |
| `B-ai-v143-tuning-008` | `scoreline` | 6 | 2 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `B-ai-v143-tuning-009` | `scoreline` | 6 | 1 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `C-ai-v143-tuning-001` | `scoreline` | 6 | 1 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `C-ai-v143-tuning-005` | `scoreline` | 5 | 1 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `C-ai-v143-tuning-006` | `economy` | 1 | 0 | 0 | `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `C-ai-v143-tuning-007` | `scoreline` | 6 | 4 | 0 | `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_protection` | `blocked` |
| `C-ai-v143-tuning-008` | `scoreline` | 6 | 1 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_scoreline` | `blocked` |
| `D-ai-v143-tuning-003` | `scoreline` | 3 | 0 | 0 | `protection_rez` | `not_in_stale_punish_shadow` | `blocked` |
| `D-ai-v143-tuning-004` | `scoreline` | 6 | 3 | 0 | `protection_rez`, `economy_to_scoreline`, `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |
| `D-ai-v143-tuning-008` | `scoreline` | 4 | 0 | 0 | `protection_rez`, `economy_to_scoreline` | `no_replacement_candidate` | `blocked` |
| `D-ai-v143-tuning-010` | `opaque_ability` | 0 | 0 | 0 | `punish_replacement` | `corp.replace_stale_punish_with_economy_conversion` | `blocked` |

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
| `server_target_missing` | 3 |
| `target_blocked_by_hard_gate` | 11 |
| `target_identity_unresolved` | 7 |
| `target_identity_unresolved_from_snapshot` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 13 |

## Schluss

Corp-Tempo-Kandidaten sind mit Binding und TargetIdentity besser eingegrenzt, bleiben aber mangels echter `actionId` nicht Dry-Run-fÃ¤hig. Scoreline-, Protection- und Punish-Replacement-Evidence bleibt Shadow-/Review-Material ohne Runtime-Gewichtung.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai197-corp-tempo-candidate-binding-review.ts`
- `git diff --check`
