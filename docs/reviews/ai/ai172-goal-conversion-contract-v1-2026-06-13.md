# AI172 Goal Conversion Contract v1

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI172 definiert read-only Endgame-Goal-Conversion-Contracts und wendet sie auf die 27 stale Intents aus AI160 an. Die Contracts beschreiben erwartete Konversionen, Blocker und LegalAction-Anforderungen, ohne Scoring oder Runtime-Auswahl zu ändern.

## Contracts

| Contract | Side | Stale Threshold | Expected Conversions |
| --- | --- | ---: | --- |
| `runner.fix_coverage` | runner | 5 | coverage_program_installed, coverage_search_resolved, wall_passage_reachability_improved |
| `runner.convert_reachability_to_access` | runner | 3 | access_card, trash_accessed_card, steal_agenda |
| `runner.find_payoff` | runner | 4 | agenda_stolen, valuable_card_trashed, new_information_accessed |
| `corp.convert_economy_to_scoreline` | corp | 4 | agenda_scored, agenda_advanced_to_scoreline |
| `corp.protect_scoreline` | corp | 4 | scoreline_remote_protected, server_rezzed_or_hardened |
| `corp.convert_tag_to_punish` | corp | 3 | tag_payoff_used, damage_or_resource_punish_taken, punish_line_abandoned_for_scoreline |

## Klassifikation

| Metrik | Wert |
| --- | ---: |
| Contracts | 6 |
| Stale Intents | 27 |

| Blocker | Fälle |
| --- | ---: |
| `missing_conversion_payoff` | 22 |
| `missing_legal_alternative` | 1 |
| `stale_without_replacement` | 4 |

## Top-Stale-Intents

| Case | Contract | Stale Count | Family | Blocker |
| --- | --- | ---: | --- | --- |
| `B-ai-v143-tuning-005` | `corp.convert_tag_to_punish` | 20 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `B-ai-v143-tuning-006` | `corp.convert_economy_to_scoreline` | 18 | `tempo_conversion_gap` | `missing_conversion_payoff` |
| `D-ai-v143-tuning-010` | `corp.convert_tag_to_punish` | 12 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `B-ai-v143-tuning-008` | `corp.convert_tag_to_punish` | 11 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `D-ai-v143-tuning-006` | `corp.convert_tag_to_punish` | 11 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `B-ai-v143-tuning-003` | `corp.convert_tag_to_punish` | 10 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `B-ai-v143-tuning-009` | `corp.convert_tag_to_punish` | 10 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `C-ai-v143-tuning-006` | `corp.convert_tag_to_punish` | 10 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `A-ai-v143-tuning-008` | `corp.convert_tag_to_punish` | 9 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `C-ai-v143-tuning-004` | `runner.convert_reachability_to_access` | 9 | `reachability_not_converted_to_access` | `stale_without_replacement` |
| `C-ai-v143-tuning-008` | `corp.convert_tag_to_punish` | 9 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |
| `A-ai-v143-tuning-006` | `corp.convert_tag_to_punish` | 8 | `punish_stale_or_no_real_tag_window` | `missing_conversion_payoff` |

## Schluss

Die stale Intents sind jetzt nicht nur gezählt, sondern an Zielverträge gebunden. Besonders `corp.convert_tag_to_punish` bleibt ohne sichtbaren Payoff oder Ersatzentscheidung der größte Contract-Blocker. Folgepakete dürfen daraus Solver-Fragen ableiten, aber noch keine produktive Gewichtung.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai172-goal-conversion-contract-v1.ts`
- `corepack pnpm --filter @netgrid/ai test -- endgame-goal-conversion-contracts`
- `git diff --check`
