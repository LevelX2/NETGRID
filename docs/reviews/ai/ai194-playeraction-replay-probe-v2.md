# AI194 PlayerAction Replay Probe v2

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI194 prÃ¼ft, ob aus AI193 Dry-Run-fÃ¤hige Kandidaten sicher in eine echte Apply-/Replay-Probe Ã¼berfÃ¼hrt werden kÃ¶nnen.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | 103 |
| Dry-Run gebaut | 0 |
| Replay-probed | 0 |
| nicht probbar | 103 |
| Apply-Harness-blockiert | 0 |
| IllegalActions | 0 |
| deterministische Replay-Failures | 0 |

## AI177-Kandidaten

| Quelle | Case | Familie | Action | Dry-Run | Replay-Probe | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `install_card` | `blocked` | `not_probeable` | `action_id_redacted`, `binding:target_identity_unresolved`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `resolve_choice` | `blocked` | `not_probeable` | `action_id_redacted`, `binding:choice_option_missing`, `choice_option_missing`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `gain_credit` | `blocked` | `not_probeable` | `action_id_redacted`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `draw_card` | `blocked` | `not_probeable` | `action_id_redacted`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `install_card` | `blocked` | `not_probeable` | `action_id_redacted`, `binding:target_identity_unresolved`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `end_turn` | `blocked` | `not_probeable` | `action_id_redacted`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `advance_card` | `blocked` | `not_probeable` | `action_id_redacted`, `binding:target_identity_unresolved`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `draw_card` | `blocked` | `not_probeable` | `action_id_redacted`, `provide real actionId plus same-state replayable action proof` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `end_turn` | `blocked` | `not_probeable` | `action_id_redacted`, `provide real actionId plus same-state replayable action proof` |

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
| `provide real actionId plus same-state replayable action proof` | 103 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved_from_snapshot` | 2 |
| `unsupported_action_family_for_dry_run_builder` | 66 |

## Schluss

AI194 startet keine Apply-Probe, weil AI193 keinen Kandidaten mit echter `actionId` bauen konnte. Es gibt dadurch keine IllegalAction und keinen Replay-Failure, aber auch keinen positiven Replay-Proof. Removal Condition bleibt: echte `actionId`, vollstÃ¤ndige TargetIdentity und same-state rekonstruierbarer Apply-/Replay-Harness.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai194-playeraction-replay-probe-v2.ts`
- `git diff --check`
