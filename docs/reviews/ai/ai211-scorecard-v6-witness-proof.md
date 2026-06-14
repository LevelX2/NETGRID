# AI211 Scorecard v6 - Witness Proof

Datum: 2026-06-14

Branch: `codex/ai201-ai212-witness-proof`

## Ziel

AI211 fasst die Witness-Proof-Kette als Scorecard v6 zusammen. Ein Candidate zaehlt nur dann als runtime-relevant, wenn LegalActionWitness, TargetRef, PlayerAction-Build und Replay-Probe zusammen bestehen.

## Scorecard v6

| Metrik | Zaehler/Nenner | Rate | Bedeutung |
| --- | ---: | ---: | --- |
| `legalaction_witness_rate` | 0/103 | 0.0% | Share of opportunity projections backed by a real LegalActionWitness. |
| `targetref_complete_or_irrelevant_rate` | 33/103 | 32.0% | Share of projections whose TargetRef is complete, side-safe and snapshot-stable or irrelevant. |
| `candidate_path_binding_from_witness_rate` | 0/103 | 0.0% | Share of CandidatePathBindings derived from Witness evidence rather than redacted candidate refs. |
| `playeraction_build_rate` | 0/103 | 0.0% | Share of projections that build a PlayerAction from Witness evidence. |
| `replay_probe_pass_rate` | 0/103 | 0.0% | Share of candidates with a successful Replay Probe v3 pass. |
| `coverage_witness_candidate_rate` | 9/13 | 69.2% | Share of coverage cases with at least one TargetRef-bound Witness Projection. |
| `corp_tempo_witness_candidate_rate` | 13/17 | 76.5% | Share of Corp-Tempo cases with at least one TargetRef-bound Witness Projection. |
| `punish_goal_switch_candidate_rate` | 20/20 | 100.0% | Share of stale-punish cases where the shadow goal switch disables stale punish intent. |
| `runtime_flagged_candidate_count` | 0/1 | 0.0% | Count-like gate for any default-off runtime micro-cutover candidate. |

## Proof Chain

| Stufe | Wert |
| --- | ---: |
| Candidate-Projections | 103 |
| echte LegalActionWitnesses | 0 |
| PlayerActions aus Witness gebaut | 0 |
| Replay Probe passed | 0 |
| eligible Micro-Cutover Candidates | 0 |

## Shadow-only Befunde

| Befund | Wert |
| --- | ---: |
| Coverage-Cases mit Witness-Projection | 9 |
| Corp-Tempo-Cases mit Witness-Projection | 13 |
| stale Punish deaktiviert | 20 |
| stale Punish Switches | 20 |

## Blocker

Aktueller Blocker: `legalaction_witness_missing_real_action_id`

Removal Condition: A same-state opportunity snapshot must carry real LegalActions/actionIds into Witness projection.

## Schluss

Scorecard v6 ist als Safety-/Proof-Scorecard gruen, aber nicht runtime-cutover-gruen: Die Review-Kandidaten sind TargetRef-projizierbar, doch echte LegalActionWitnesses und Replay-Probes fehlen weiterhin.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai211-scorecard-v6-witness-proof.ts`
- `git diff --check`
