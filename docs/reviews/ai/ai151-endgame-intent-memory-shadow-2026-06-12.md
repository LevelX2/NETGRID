# AI151 Endgame Intent Memory Shadow

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI151 verfolgt Endgame-Absichten über mehrere Aktionen als Shadow-Modell. Es bewertet nicht einzelne Credit-, Draw-, Run- oder Corp-Economy-Aktionen pauschal, sondern ob eine Absicht erwartbar konvertiert, stale wird oder mangels Same-State-Proof blockiert bleibt.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 21 |
| Intents | 122 |
| Top-Stale/Blocked sichtbar | 10 |
| Redaction-safe | 1 |

## Status

| Status | Anzahl |
| --- | ---: |
| `conversion_observed` | 95 |
| `stale_without_conversion` | 27 |

## Intent-Typen

| Intent | Anzahl |
| --- | ---: |
| `corp.convert_economy_to_scoreline` | 21 |
| `corp.convert_tag_to_punish` | 20 |
| `corp.protect_scoreline` | 21 |
| `runner.convert_reachability_to_access` | 21 |
| `runner.find_payoff` | 18 |
| `runner.fix_coverage` | 21 |

## Top Stale / Blocked Intents

| Case | Subcluster | Intent | Status | Stale Count | Blocker |
| --- | --- | --- | --- | ---: | --- |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 20 | `intent_repeated_without_expected_conversion` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `corp.convert_economy_to_scoreline` | `stale_without_conversion` | 18 | `intent_repeated_without_expected_conversion` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 12 | `intent_repeated_without_expected_conversion` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 11 | `intent_repeated_without_expected_conversion` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 11 | `intent_repeated_without_expected_conversion` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 10 | `intent_repeated_without_expected_conversion` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 10 | `intent_repeated_without_expected_conversion` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 10 | `intent_repeated_without_expected_conversion` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `corp.convert_tag_to_punish` | `stale_without_conversion` | 9 | `intent_repeated_without_expected_conversion` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.convert_reachability_to_access` | `stale_without_conversion` | 9 | `intent_repeated_without_expected_conversion` |

## Fälle

| Case | Subcluster | Intents |
| --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | `runner.fix_coverage:conversion_observed:stale=7:start=runner/install_card@103`, `runner.convert_reachability_to_access:conversion_observed:stale=6:start=runner/start_run@134`, `runner.find_payoff:conversion_observed:stale=1:start=runner/steal_agenda@100`, `corp.convert_economy_to_scoreline:conversion_observed:stale=18:start=runner/gain_credit@106`, `corp.protect_scoreline:conversion_observed:stale=8:start=runner/install_card@103`, `corp.convert_tag_to_punish:stale_without_conversion:stale=8:start=runner/trigger_ability@101` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.fix_coverage:conversion_observed:stale=8:start=runner/gain_credit@100`, `runner.convert_reachability_to_access:conversion_observed:stale=2:start=runner/start_run@108`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@111`, `corp.convert_economy_to_scoreline:conversion_observed:stale=5:start=runner/gain_credit@100`, `corp.protect_scoreline:conversion_observed:stale=10:start=corp/advance_card@103`, `corp.convert_tag_to_punish:stale_without_conversion:stale=9:start=runner/end_turn@101` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=8:start=runner/install_card@100`, `runner.convert_reachability_to_access:conversion_observed:stale=1:start=runner/start_run@115`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@118`, `corp.convert_economy_to_scoreline:conversion_observed:stale=15:start=runner/gain_credit@101`, `corp.protect_scoreline:conversion_observed:stale=8:start=runner/install_card@100`, `corp.convert_tag_to_punish:stale_without_conversion:stale=8:start=runner/resolve_choice@103` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.fix_coverage:conversion_observed:stale=11:start=corp/gain_credit@101`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@118`, `runner.find_payoff:conversion_observed:stale=1:start=runner/access_card@123`, `corp.convert_economy_to_scoreline:conversion_observed:stale=21:start=corp/gain_credit@101`, `corp.protect_scoreline:conversion_observed:stale=4:start=corp/advance_card@100`, `corp.convert_tag_to_punish:stale_without_conversion:stale=4:start=corp/decline_rez@134` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.fix_coverage:conversion_observed:stale=9:start=corp/gain_credit@100`, `runner.convert_reachability_to_access:stale_without_conversion:stale=7:start=runner/start_run@104`, `corp.convert_economy_to_scoreline:conversion_observed:stale=14:start=corp/gain_credit@100`, `corp.protect_scoreline:conversion_observed:stale=5:start=corp/rez_ice@108`, `corp.convert_tag_to_punish:stale_without_conversion:stale=10:start=corp/decline_rez@106` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=18:start=runner/gain_credit@100`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@132`, `runner.find_payoff:conversion_observed:stale=1:start=runner/access_card@133`, `corp.convert_economy_to_scoreline:conversion_observed:stale=21:start=runner/gain_credit@100`, `corp.protect_scoreline:conversion_observed:stale=3:start=runner/install_card@122`, `corp.convert_tag_to_punish:stale_without_conversion:stale=20:start=runner/gain_credit@100` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `runner.fix_coverage:conversion_observed:stale=6:start=runner/gain_credit@100`, `runner.convert_reachability_to_access:conversion_observed:stale=3:start=runner/start_run@111`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@115`, `corp.convert_economy_to_scoreline:stale_without_conversion:stale=18:start=runner/gain_credit@100`, `corp.protect_scoreline:stale_without_conversion:stale=8:start=corp/install_card@105`, `corp.convert_tag_to_punish:stale_without_conversion:stale=8:start=runner/end_turn@103` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=10:start=runner/play_event@100`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@114`, `runner.find_payoff:conversion_observed:stale=1:start=runner/access_card@115`, `corp.convert_economy_to_scoreline:conversion_observed:stale=29:start=runner/resolve_choice@102`, `corp.protect_scoreline:conversion_observed:stale=6:start=runner/install_card@101`, `corp.convert_tag_to_punish:stale_without_conversion:stale=11:start=runner/resolve_choice@102` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=12:start=runner/gain_credit@101`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@112`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@113`, `corp.convert_economy_to_scoreline:conversion_observed:stale=15:start=runner/gain_credit@101`, `corp.protect_scoreline:conversion_observed:stale=4:start=corp/advance_card@107`, `corp.convert_tag_to_punish:stale_without_conversion:stale=10:start=runner/end_turn@105` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=4:start=runner/gain_credit@105`, `runner.convert_reachability_to_access:conversion_observed:stale=1:start=runner/continue_run@100`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@101`, `corp.convert_economy_to_scoreline:conversion_observed:stale=11:start=runner/gain_credit@105`, `corp.protect_scoreline:conversion_observed:stale=12:start=corp/install_card@110`, `corp.convert_tag_to_punish:stale_without_conversion:stale=8:start=runner/end_turn@108` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | `runner.fix_coverage:conversion_observed:stale=2:start=corp/install_card@100`, `runner.convert_reachability_to_access:conversion_observed:stale=7:start=runner/start_run@104`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@107`, `corp.convert_economy_to_scoreline:conversion_observed:stale=7:start=corp/gain_credit@101`, `corp.protect_scoreline:conversion_observed:stale=6:start=corp/install_card@100`, `corp.convert_tag_to_punish:stale_without_conversion:stale=7:start=corp/decline_rez@105` |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.fix_coverage:conversion_observed:stale=8:start=corp/gain_credit@103`, `runner.convert_reachability_to_access:stale_without_conversion:stale=9:start=runner/start_run@132`, `corp.convert_economy_to_scoreline:conversion_observed:stale=9:start=corp/gain_credit@103`, `corp.protect_scoreline:conversion_observed:stale=10:start=corp/advance_card@102`, `corp.convert_tag_to_punish:stale_without_conversion:stale=8:start=runner/end_turn@100` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=7:start=runner/gain_credit@100`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@153`, `runner.find_payoff:conversion_observed:stale=1:start=runner/access_card@154`, `corp.convert_economy_to_scoreline:conversion_observed:stale=11:start=runner/gain_credit@100`, `corp.protect_scoreline:conversion_observed:stale=9:start=corp/install_card@109`, `corp.convert_tag_to_punish:stale_without_conversion:stale=8:start=runner/resolve_choice@103` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=5:start=corp/gain_credit@100`, `runner.convert_reachability_to_access:conversion_observed:stale=4:start=runner/start_run@107`, `runner.find_payoff:conversion_observed:stale=1:start=runner/access_card@155`, `corp.convert_economy_to_scoreline:conversion_observed:stale=15:start=corp/gain_credit@100`, `corp.protect_scoreline:conversion_observed:stale=9:start=runner/install_card@102`, `corp.convert_tag_to_punish:stale_without_conversion:stale=10:start=runner/resolve_choice@106` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | `runner.fix_coverage:conversion_observed:stale=6:start=runner/activated_card_ability@100`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@121`, `runner.find_payoff:conversion_observed:stale=1:start=runner/access_card@122`, `corp.convert_economy_to_scoreline:conversion_observed:stale=11:start=runner/activated_card_ability@100`, `corp.protect_scoreline:conversion_observed:stale=9:start=corp/advance_card@104`, `corp.convert_tag_to_punish:stale_without_conversion:stale=6:start=runner/end_turn@102` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | `runner.fix_coverage:conversion_observed:stale=6:start=corp/gain_credit@101`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@106`, `runner.find_payoff:conversion_observed:stale=4:start=runner/access_card@109`, `corp.convert_economy_to_scoreline:conversion_observed:stale=7:start=corp/gain_credit@101`, `corp.protect_scoreline:conversion_observed:stale=8:start=corp/rez_ice@100`, `corp.convert_tag_to_punish:stale_without_conversion:stale=9:start=corp/decline_rez@107` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | `runner.fix_coverage:conversion_observed:stale=2:start=corp/install_card@113`, `runner.convert_reachability_to_access:conversion_observed:stale=7:start=runner/start_run@100`, `runner.find_payoff:conversion_observed:stale=2:start=runner/access_card@104`, `corp.convert_economy_to_scoreline:conversion_observed:stale=3:start=runner/gain_credit@143`, `corp.protect_scoreline:conversion_observed:stale=8:start=corp/install_card@113` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | `runner.fix_coverage:conversion_observed:stale=6:start=corp/install_card@100`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@106`, `runner.find_payoff:stale_without_conversion:stale=6:start=runner/access_card@110`, `corp.convert_economy_to_scoreline:conversion_observed:stale=17:start=runner/gain_credit@104`, `corp.protect_scoreline:conversion_observed:stale=4:start=corp/install_card@100`, `corp.convert_tag_to_punish:stale_without_conversion:stale=4:start=corp/install_card@100` |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | `runner.fix_coverage:conversion_observed:stale=11:start=runner/gain_credit@100`, `runner.convert_reachability_to_access:stale_without_conversion:stale=7:start=runner/start_run@130`, `corp.convert_economy_to_scoreline:conversion_observed:stale=20:start=runner/gain_credit@100`, `corp.protect_scoreline:conversion_observed:stale=3:start=runner/install_card@109`, `corp.convert_tag_to_punish:stale_without_conversion:stale=11:start=runner/end_turn@102` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | `runner.fix_coverage:conversion_observed:stale=9:start=runner/gain_credit@106`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@101`, `runner.find_payoff:stale_without_conversion:stale=4:start=runner/access_card@105`, `corp.convert_economy_to_scoreline:conversion_observed:stale=12:start=runner/gain_credit@106`, `corp.protect_scoreline:conversion_observed:stale=5:start=runner/install_card@107`, `corp.convert_tag_to_punish:stale_without_conversion:stale=4:start=runner/resolve_choice@108` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | `runner.fix_coverage:conversion_observed:stale=9:start=corp/install_card@108`, `runner.convert_reachability_to_access:conversion_observed:stale=0:start=runner/start_run@102`, `runner.find_payoff:conversion_observed:stale=4:start=runner/access_card@100`, `corp.convert_economy_to_scoreline:conversion_observed:stale=19:start=corp/gain_credit@109`, `corp.protect_scoreline:conversion_observed:stale=3:start=corp/install_card@108`, `corp.convert_tag_to_punish:stale_without_conversion:stale=12:start=runner/end_turn@106` |

## Schluss

Intent Memory ist weiterhin nur Evidence. Es zeigt, welche Zielversuche stale werden, ohne daraus Runtime-Gewichte abzuleiten. AI149 bleibt das harte Gate: Solange kein same-state LegalAction-Match existiert, darf kein Intent automatisch in einen Cutover übersetzt werden.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai151-endgame-intent-memory-shadow.ts`
- `git diff --check`
