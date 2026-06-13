# AI160 Stale Intent Root-Cause Review

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI160 priorisiert die 27 `stale_without_conversion`-Intents aus AI151 nach Intent-Typ, Pair/Seed, Subcluster, letzter Conversion-Spur und Problemklasse. Es werden keine Action-Type-Mali eingeführt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| stale Intents | 27 |
| Top-Familien | 5 |

## Top-5 Stale Intent Families

| Family | Problemklasse | Fälle | Stale Total | Intents | Subcluster |
| --- | --- | ---: | ---: | --- | --- |
| `punish_stale_or_no_real_tag_window` | `fix` | 20 | 175 | `corp.convert_tag_to_punish` | `continue_chain_to_access`, `corp_late_gain_credit_no_safe_alternative`, `corp_late_gain_credit_real_rez_or_protection_reserve`, `run_microstep_required`, `runner_late_gain_credit_real_reserve` |
| `reachability_not_converted_to_access` | `fix` | 3 | 23 | `runner.convert_reachability_to_access` | `corp_late_gain_credit_no_safe_alternative`, `corp_late_gain_credit_real_rez_or_protection_reserve` |
| `tempo_conversion_gap` | `tempo` | 1 | 18 | `corp.convert_economy_to_scoreline` | `continue_chain_to_access` |
| `protection_conversion_gap` | `tempo` | 1 | 8 | `corp.protect_scoreline` | `continue_chain_to_access` |
| `payoff_selection_gap` | `fix` | 1 | 6 | `runner.find_payoff` | `runner_late_gain_credit_real_reserve` |

## Letzte Conversion-Versuche

| Family | Beispiele |
| --- | --- |
| `punish_stale_or_no_real_tag_window` | `A-ai-v143-tuning-006:corp/decline_rez@150`, `A-ai-v143-tuning-008:corp/decline_rez@158`, `A-ai-v143-tuning-009:corp/decline_rez@159`, `B-ai-v143-tuning-001:runner/gain_credit@150`, `B-ai-v143-tuning-003:runner/resolve_choice@156` |
| `reachability_not_converted_to_access` | `B-ai-v143-tuning-003:runner/pump_breaker@159`, `C-ai-v143-tuning-004:runner/continue_run@151`, `D-ai-v143-tuning-006:runner/continue_run@139` |
| `tempo_conversion_gap` | `B-ai-v143-tuning-006:runner/gain_credit@154` |
| `protection_conversion_gap` | `B-ai-v143-tuning-006:corp/install_card@151` |
| `payoff_selection_gap` | `D-ai-v143-tuning-004:runner/access_card@150` |

## Stale Intents

| Case | Subcluster | Intent | Stale Count | Last Conversion Attempt | Family |
| --- | --- | --- | ---: | --- | --- |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 20 | `runner/end_turn@159` | `punish_stale_or_no_real_tag_window` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `corp.convert_economy_to_scoreline` | 18 | `runner/gain_credit@154` | `tempo_conversion_gap` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | `corp.convert_tag_to_punish` | 12 | `runner/gain_credit@159` | `punish_stale_or_no_real_tag_window` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 11 | `runner/gain_credit@159` | `punish_stale_or_no_real_tag_window` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | `corp.convert_tag_to_punish` | 11 | `runner/gain_credit@159` | `punish_stale_or_no_real_tag_window` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | 10 | `runner/resolve_choice@156` | `punish_stale_or_no_real_tag_window` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 10 | `runner/end_turn@156` | `punish_stale_or_no_real_tag_window` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 10 | `corp/decline_rez@153` | `punish_stale_or_no_real_tag_window` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | 9 | `corp/decline_rez@158` | `punish_stale_or_no_real_tag_window` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.convert_reachability_to_access` | 9 | `runner/continue_run@151` | `reachability_not_converted_to_access` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | `corp.convert_tag_to_punish` | 9 | `runner/end_turn@159` | `punish_stale_or_no_real_tag_window` |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | `corp.convert_tag_to_punish` | 8 | `corp/decline_rez@150` | `punish_stale_or_no_real_tag_window` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 8 | `corp/decline_rez@159` | `punish_stale_or_no_real_tag_window` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `corp.protect_scoreline` | 8 | `corp/install_card@151` | `protection_conversion_gap` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `corp.convert_tag_to_punish` | 8 | `corp/decline_rez@158` | `punish_stale_or_no_real_tag_window` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 8 | `runner/end_turn@156` | `punish_stale_or_no_real_tag_window` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | 8 | `runner/end_turn@155` | `punish_stale_or_no_real_tag_window` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 8 | `runner/resolve_choice@159` | `punish_stale_or_no_real_tag_window` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.convert_reachability_to_access` | 7 | `runner/pump_breaker@159` | `reachability_not_converted_to_access` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | `corp.convert_tag_to_punish` | 7 | `runner/end_turn@141` | `punish_stale_or_no_real_tag_window` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | `runner.convert_reachability_to_access` | 7 | `runner/continue_run@139` | `reachability_not_converted_to_access` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | 6 | `runner/end_turn@158` | `punish_stale_or_no_real_tag_window` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | `runner.find_payoff` | 6 | `runner/access_card@150` | `payoff_selection_gap` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | 4 | `runner/gain_credit@150` | `punish_stale_or_no_real_tag_window` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | 4 | `runner/gain_credit@151` | `punish_stale_or_no_real_tag_window` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | `runner.find_payoff` | 4 | `runner/access_card@150` | `target_context_or_run_step_gap` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | `corp.convert_tag_to_punish` | 4 | `corp/install_card@127` | `punish_stale_or_no_real_tag_window` |

## Schluss

Die wichtigste Root-Cause-Familie ist stale oder nicht reales Punish-/Tag-Fenster. Danach folgen Reachability, die nicht in Access konvertiert, und Schutz-/Tempo-Konversionen. Das sind konkrete Kandidaten für AI164/AI165, aber weiterhin keine Begründung für pauschale Credit-, Draw-, Run- oder Corp-Economy-Strafen.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai160-stale-intent-root-cause-review.ts`
- `git diff --check`
