# AI183 Candidate Gate v2

Datum: 2026-06-13

Branch: `codex/ai181-ai190-signature-proof`

## Ziel

AI183 ersetzt das grobe AI177-Gate durch ein Gate, das SemanticActionSignature und TargetIdentity-Resolution aus AI181/AI182 verwendet.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Signaturfamilien | 35 |
| wiederholte Signaturfamilien | 15 |
| geprüfte Kandidaten | 3 |
| Gate-pass | 0 |
| blockiert | 3 |

## Kandidatenprüfung

| Quelle | Case | Familie | Pfad | Gate | Fehlende Bedingungen | TargetIdentity-Blocker |
| --- | --- | --- | --- | --- | --- | --- |
| AI173 | `A-ai-v143-tuning-009` | `runner_coverage` | `visible_installable_solution` | `blocked` | `target_identity_complete_or_irrelevant` | `target_identity_unresolved_from_snapshot` |
| AI175 | `A-ai-v143-tuning-009` | `corp_tempo` | `scoreline` | `blocked` | `target_identity_complete_or_irrelevant` | `choice_option_missing` |
| AI175 | `B-ai-v143-tuning-001` | `corp_tempo` | `scoreline` | `blocked` | `target_identity_complete_or_irrelevant` | `target_identity_unresolved_from_snapshot` |

## Größte Signaturfamilien

| Count | TargetIdentity | Cases | Signature |
| ---: | --- | --- | --- |
| 6 | `blocked_by_hard_gate` | `B-ai-v143-tuning-001`, `B-ai-v143-tuning-006`, `B-ai-v143-tuning-009`, `C-ai-v143-tuning-001`, `C-ai-v143-tuning-005`, `D-ai-v143-tuning-008` | `action:draw_card|semantic:economy|source:basic_action|definition:none|ability:none|target:blocke...` |
| 6 | `blocked_by_hard_gate` | `B-ai-v143-tuning-001`, `B-ai-v143-tuning-006`, `B-ai-v143-tuning-008`, `B-ai-v143-tuning-009`, `C-ai-v143-tuning-001`, `C-ai-v143-tuning-005` | `action:end_turn|semantic:economy|source:game_rule|definition:none|ability:none|target:blocked_by...` |
| 5 | `none` | `A-ai-v143-tuning-009`, `B-ai-v143-tuning-001`, `B-ai-v143-tuning-008`, `C-ai-v143-tuning-007`, `D-ai-v143-tuning-004` | `action:draw_card|semantic:economy|source:basic_action|definition:none|ability:none|target:none|c...` |
| 5 | `none` | `A-ai-v143-tuning-009`, `B-ai-v143-tuning-006`, `B-ai-v143-tuning-009`, `C-ai-v143-tuning-005`, `C-ai-v143-tuning-007` | `action:gain_credit|semantic:economy|source:basic_action|definition:none|ability:none|target:none...` |
| 4 | `none` | `A-ai-v143-tuning-009`, `B-ai-v143-tuning-001`, `C-ai-v143-tuning-007`, `D-ai-v143-tuning-004` | `action:end_turn|semantic:economy|source:game_rule|definition:none|ability:none|target:none|cost:...` |
| 4 | `blocked_by_hard_gate` | `B-ai-v143-tuning-001`, `B-ai-v143-tuning-008`, `C-ai-v143-tuning-001`, `D-ai-v143-tuning-008` | `action:gain_credit|semantic:economy|source:basic_action|definition:none|ability:none|target:bloc...` |
| 4 | `blocked_by_hard_gate` | `D-ai-v143-tuning-003`, `D-ai-v143-tuning-008` | `action:install_card|semantic:coverage_setup|source:visible_card_or_ability|definition:Bartmoss M...` |
| 4 | `blocked_by_hard_gate` | `B-ai-v143-tuning-006`, `C-ai-v143-tuning-001`, `C-ai-v143-tuning-005`, `C-ai-v143-tuning-007` | `action:start_run|semantic:economy|source:basic_action|definition:none|ability:none|target:blocke...` |
| 3 | `blocked_by_hard_gate` | `C-ai-v143-tuning-008` | `action:install_card|semantic:scoreline|source:visible_card_or_ability|definition:Superior Net Ba...` |
| 3 | `blocked_by_hard_gate` | `B-ai-v143-tuning-006`, `D-ai-v143-tuning-003`, `D-ai-v143-tuning-008` | `action:start_run|semantic:economy|source:basic_action|definition:none|ability:none|target:blocke...` |

## Schluss

Das Gate blockiert weiterhin alle Kandidaten. Die Infrastruktur für Signaturfamilien ist vorhanden; der harte Blocker bleibt die fehlende candidate-path TargetIdentity. Wiederholte Signaturen allein reichen nicht, solange sie nur `none`, `unknown_target`, `server:unknown` oder `choice:unknown` tragen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai183-candidate-gate-v2.ts`
- `git diff --check`
