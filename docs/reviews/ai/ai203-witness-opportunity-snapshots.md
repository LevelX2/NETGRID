# AI203 Witness Opportunity Snapshots

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI203 verbindet Opportunity-Candidate-Pfade mit `TargetRef v1` und einer Witness-Projection. Weil AI170/AI191 keine echten `actionId`-Werte oder LegalAction-Objekte enthalten, erzeugt AI203 keine unechte `LegalActionWitness`, sondern blockiert die Ableitung praezise.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| CandidatePathBindings | 103 |
| Witness-Projections | 103 |
| echte LegalActionWitnesses | 0 |
| CandidatePathBinding aus Witness | 0 |
| TargetRef complete/irrelevant | 33 |
| echte actionIds vorhanden | 0 |
| redactedActionRefs vorhanden | 103 |
| blockiert | 103 |
| Runtime geaendert | 0 |

## AI177/AI183-nahe Kandidaten

| Quelle | Case | Familie | Action | TargetRef | Status | Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `install_card` | `ownInstalled:actorKnownRef:wall_of_static` | `blocked` | `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `resolve_choice` | `choice:unknown` | `blocked` | `binding:choice_option_missing`, `choice_option_missing`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `gain_credit` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `draw_card` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `install_card` | `ownInstalled:actorKnownRef:wall_of_static` | `blocked` | `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `end_turn` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `advance_card` | `ownInstalled:actorKnownRef:corporate_war` | `blocked` | `binding:target_identity_unresolved`, `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `draw_card` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `end_turn` | `none` | `blocked` | `legalaction_witness_missing`, `legalaction_witness_missing_real_action_id` |

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

AI203 macht den Snapshot-Engpass enger: TargetRefs sind an die Candidate-Pfade gebunden, aber echte Witness-Ableitung bleibt bei 0, weil die alten Opportunity-Snapshots nur `redactedActionRef` und keine Engine-`actionId` enthalten. Die Removal Condition fuer AI205/AI206 bleibt damit explizit: neue Snapshots muessen echte LegalActionWitnesses oder mindestens echte `actionId`-Evidence tragen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai203-witness-opportunity-snapshots.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/witness-opportunity-projection.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
