# AI205 PlayerAction Builder from Witness

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI205 ergaenzt den test-only Helper `buildPlayerActionFromWitness(...)`. Er baut strukturelle `PlayerAction`-Objekte nur aus echten `LegalActionWitness`-Eintraegen und blockiert fehlende, hidden-blocked oder unsupported Witnesses.

## Unterstuetzte Startmenge

| Familie |
| --- |
| no-target basic actions |
| start_run with server TargetRef |
| resolve_choice with choice TargetRef |
| actor-known installed-card actions for install/advance/rez/score |

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Candidate-Projections | 103 |
| Witness vorhanden | 0 |
| PlayerActions gebaut | 0 |
| blockiert | 103 |
| Runtime-Effekte | 0 |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | TargetRef | Build | Blocker |
| --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `ownInstalled:actorKnownRef:wall_of_static` | `blocked` | `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `choice:unknown` | `blocked` | `binding:choice_option_missing`, `choice_option_missing`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `ownInstalled:actorKnownRef:wall_of_static` | `blocked` | `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `ownInstalled:actorKnownRef:corporate_war` | `blocked` | `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |

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
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved` | 2 |

## Schluss

Der Builder selbst kann no-target, Server-Run, Choice-Option und actor-known installed-card Witnesses strukturell bauen. Die aktuellen Opportunity-Candidates bleiben aber 0/103 buildbar, weil AI203 keine echten LegalActionWitnesses findet. Das verhindert weiterhin Replay-Probe und Runtime-Cutover.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai205-playeraction-builder-from-witness.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/playeraction-dry-run-builder.test.ts src/legalaction-witness.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
