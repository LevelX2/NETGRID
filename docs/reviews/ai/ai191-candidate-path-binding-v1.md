# AI191 Candidate Path Binding v1

Datum: 2026-06-14

Branch: `codex/ai191-ai200-binding-replay-proof`

## Ziel

AI191 erzeugt ein read-only `CandidatePathBinding`, das `SemanticActionSignature`, stabile redigierte Action-Referenz, `stateVersion`, Side, TargetIdentity, Kosten-/Timingklasse und Gate-Summaries zusammenfÃ¼hrt. Die Bindings sind Diagnose-Evidence und Ã¤ndern keine Runtime-Entscheidung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Quellkandidaten | 33 |
| CandidatePathBindings | 103 |
| vollstÃ¤ndig gebunden | 21 |
| blockiert | 82 |
| AI177-Bindings | 9 |
| Coverage-Bindings | 26 |
| Corp-Tempo-Bindings | 68 |
| Redaction safe | 1 |

## AI177-Kandidaten

| Quelle | Case | Familie | Pfad | Action | TargetIdentity | Binding | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `visible_installable_solution` | `install_card` | `unknown_target` | `blocked` | `target_identity_unresolved` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `resolve_choice` | `choice:unknown` | `blocked` | `choice_option_missing` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `gain_credit` | `none` | `bound` | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `draw_card` | `none` | `bound` | none |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `install_card` | `unknown_target` | `blocked` | `target_identity_unresolved` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `end_turn` | `none` | `bound` | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `scoreline` | `advance_card` | `unknown_target` | `blocked` | `target_identity_unresolved` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `scoreline` | `draw_card` | `none` | `bound` | none |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `scoreline` | `end_turn` | `none` | `bound` | none |

## Blocker

| Blocker | Count |
| --- | ---: |
| `blocked_reason:plan_mismatch` | 47 |
| `blocked_reason:semantic_excluded:archives_known_no_agenda` | 7 |
| `blocked_reason:semantic_excluded:known_ice_path_no_access` | 6 |
| `choice_option_missing` | 2 |
| `hard_gate_blocked` | 60 |
| `server_target_missing` | 6 |
| `target_blocked_by_hard_gate` | 60 |
| `target_identity_unresolved` | 14 |

## Schluss

AI191 schlieÃŸt die Signatur an einen stabilen candidate-path Referenzpunkt an. Echte `actionId`-Werte liegen in den AI170-Snapshots weiterhin nicht vor; deshalb nutzt das Artefakt redigierte Action-Referenzen mit lokaler Mapping-Tabelle. Das ist ausreichend fÃ¼r TargetIdentity-/Gate-Reviews, aber noch nicht fÃ¼r eine echte PlayerAction.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai191-candidate-path-binding-v1.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/candidate-path-binding.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`
- `git diff --check`
