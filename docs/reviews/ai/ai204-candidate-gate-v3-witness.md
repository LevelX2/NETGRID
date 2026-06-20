# AI204 Candidate Gate v3 with Witness

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI204 laesst das Candidate Gate v3 gegen Witness-basierte Projection-Evidence laufen. Das Gate verlangt echte `LegalActionWitness`, TargetRef-v1-Vollstaendigkeit, CandidatePathBinding aus Witness, Kosten-/Timing-/Gate-Evidence, Intent-Match, Wiederholung oder klares Fixture und Redaction-Safety.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| evaluierte Kandidaten | 103 |
| Gate-positive Kandidaten | 0 |
| blockierte Kandidaten | 103 |
| AI177/AI183-nahe Kandidaten | 9 |
| AI177/AI183 gate-positiv | 0 |
| Coverage-Faelle | 13 |
| Coverage-Bindings | 26 |
| Coverage dry-run-capable | 0 |
| Stale-Punish-Faelle | 20 |
| Stale-Punish Replacement Candidates | 17 |
| Runtime-Effekte | 0 |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | Action | TargetRef | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `install_card` | `ownInstalled:actorKnownRef:wall_of_static` | `blocked` | `binding:target_identity_unresolved`, `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `resolve_choice` | `choice:unknown` | `blocked` | `binding:choice_option_missing`, `candidate_path_binding_not_from_witness`, `choice_option_missing`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `gain_credit` | `none` | `blocked` | `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `draw_card` | `none` | `blocked` | `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `install_card` | `ownInstalled:actorKnownRef:wall_of_static` | `blocked` | `binding:target_identity_unresolved`, `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `end_turn` | `none` | `blocked` | `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `advance_card` | `ownInstalled:actorKnownRef:corporate_war` | `blocked` | `binding:target_identity_unresolved`, `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `draw_card` | `none` | `blocked` | `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `end_turn` | `none` | `blocked` | `candidate_path_binding_not_from_witness`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |

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
| `candidate_path_binding_not_from_witness` | 103 |
| `choice_option_missing` | 2 |
| `legalaction_witness_missing` | 103 |
| `legalaction_witness_missing_real_action_id` | 103 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved` | 2 |

## Schluss

Gate v3 blockiert weiterhin alle Kandidaten, jetzt aber nicht mehr diffus: Der Hauptblocker ist `legalaction_witness_missing_real_action_id` plus `candidate_path_binding_not_from_witness`. Coverage- und Stale-Punish-Eingaenge bleiben fuer AI208/AI207 verwertbar, erzeugen aber keine Runtime-Wirkung.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai204-candidate-gate-v3-witness.ts`
- `git diff --check`
