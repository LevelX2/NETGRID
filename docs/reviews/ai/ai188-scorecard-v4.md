# AI188 Scorecard v4

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI188 erweitert die Scorecard um Signature-Proof-Metriken. Die Scorecard zeigt, ob die aktuelle Blockade an Daten, TargetIdentity, Replay oder fachlichem No-Go liegt.

## Scorecard

| Metrik | Zähler/Nenner | Rate | Hinweis |
| --- | ---: | ---: | --- |
| `semantic_action_signature_rate` | 76/76 | 100.0% | Share of Opportunity alternatives carrying a deterministic signature. |
| `target_identity_complete_rate` | 16/76 | 21.1% | Share of alternatives with complete or irrelevant side-safe TargetIdentity. |
| `candidate_gate_pass_rate` | 0/3 | 0.0% | AI183 gate v2 pass rate. |
| `playeraction_replay_probe_pass_rate` | 0/3 | 0.0% | Share of candidates with successful PlayerAction replay probe. |
| `coverage_candidate_signature_pass_rate` | 0/13 | 0.0% | Coverage candidates passing signature plus TargetIdentity review. |
| `runtime_cutover_candidate_count` | 0/1 | 0.0% | Count-like gate for any runtime-cutover candidate in this block. |

## Stale Punish Root Cause Distribution

| Root Cause | Fälle |
| --- | ---: |
| `missing_punish_payoff` | 11 |
| `missing_tag_window` | 6 |
| `protection_should_replace` | 1 |
| `scoreline_should_replace` | 2 |

## Schluss

Die Signaturrate ist vollständig, aber TargetIdentity und Replay bleiben der Blocker. Es gibt weiterhin 0 Runtime-Cutover-Kandidaten.

Aktueller Blocker: `candidate_path_target_identity_and_playeraction_replay_missing`.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai188-scorecard-v4.ts`
- `git diff --check`
