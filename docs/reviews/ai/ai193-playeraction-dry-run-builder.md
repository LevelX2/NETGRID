# AI193 PlayerAction Dry-Run Builder

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI193 fÃ¼hrt einen test-only/read-only Builder `buildPlayerActionFromCandidateBinding(...)` ein. Er baut nur dann eine `PlayerAction`, wenn Binding, TargetIdentity, echte `actionId`, Side, `stateVersion` und unterstÃ¼tzte Zielklasse vollstÃ¤ndig sind.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | 103 |
| Dry-Run gebaut | 0 |
| Dry-Run blockiert | 103 |
| AI177 Dry-Run gebaut | 0 |

## AI177-Kandidaten

| Quelle | Case | Familie | Action | TargetIdentity | Dry-Run | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `install_card` | `installedOwnCard:actorKnownRef:wall_of_static` | `blocked` | `action_id_redacted`, `binding:target_identity_unresolved` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `resolve_choice` | `choice:unknown` | `blocked` | `action_id_redacted`, `binding:choice_option_missing`, `choice_option_missing` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `gain_credit` | `none` | `blocked` | `action_id_redacted` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `draw_card` | `none` | `blocked` | `action_id_redacted` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `install_card` | `installedOwnCard:actorKnownRef:wall_of_static` | `blocked` | `action_id_redacted`, `binding:target_identity_unresolved` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `end_turn` | `none` | `blocked` | `action_id_redacted` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `advance_card` | `installedOwnCard:actorKnownRef:corporate_war` | `blocked` | `action_id_redacted`, `binding:target_identity_unresolved` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `draw_card` | `none` | `blocked` | `action_id_redacted` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `end_turn` | `none` | `blocked` | `action_id_redacted` |

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
| `choice_option_missing` | 2 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved_from_snapshot` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 66 |

## Schluss

Der Builder ist funktionsfÃ¤hig und testet No-target- und Server-Run-Pfade mit echten ActionIds. Die aktuellen AI191-Bindings enthalten jedoch nur `redactedActionRef`, keine echte `actionId`. Deshalb wird im Review-Artefakt kein Candidate in eine PlayerAction Ã¼berfÃ¼hrt. Das ist ein konkreter Blocker, kein Runtime-Fehler.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai193-playeraction-dry-run-builder.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/playeraction-dry-run-builder.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
