# AI Shadow League Baseline 2026-06-12

## Status

baseline_recorded

## Scope

Lokale, versionierte Semantic-Shadow-League-Baseline für den Real-Engine-Decision-Corpus. Diese Baseline ist diagnostisch und report-only.

## Baseline

| Feld | Wert |
| --- | ---: |
| sampleCount | 30 |
| runnerScenarioCount | 15 |
| corpScenarioCount | 15 |
| agreementComparedCount | 12 |
| agreementCount | 9 |
| agreementRate | 0.75 |
| mistakeCount | 1 |
| pilotEligibleCount | 26 |
| scopeCandidateCount | 90 |
| scopeAllowedCount | 26 |
| pilotWouldOverrideCount | 26 |
| pilotActualOverrideCount | 0 |
| pilotEligibilityRate | 0.867 |
| averageScoreGap | 21.276 |
| remoteContestPilotCandidateCount | 1 |
| rankedActionCount | 430 |
| rejectedActionCount | 0 |
| topScoreAverage | 99.567 |
| topScoreMin | 0 |
| topScoreMax | 153 |
| redactionStatus | passed |

## Mistake Count By Class

| Klasse | Wert |
| --- | ---: |
| hidden_info_dependency | 0 |
| missed_score_window | 1 |
| total_observed | 1 |

## Scope Breakdown

| Scope | eligibleCount | wouldOverrideCount | Szenarien |
| --- | ---: | ---: | --- |
| `basic_setup` | 13 | 13 | `runner_real_low_credits`, `runner_real_click_limited_economy`, `runner_real_tagged_low_credits`, `corp_real_advance_score_window`, `corp_real_low_rez_reserve`, `corp_real_basic_economy_draw`, `corp_real_remote_defense_setup`, `corp_real_install_credit_pressure`, `corp_real_high_credit_main_window`, `corp_real_remote_ice_defense`, `corp_real_low_credit_main_window`, `corp_real_remote_double_asset_setup`, `corp_real_draw_pressure_window` |
| `runner_safe_access` | 11 | 11 | `runner_real_safe_hq_access`, `runner_real_safe_rd_access`, `runner_real_damage_buffer_needed`, `runner_real_tag_cleanup`, `runner_real_remote_probe`, `runner_real_rnd_pressure_with_buffer`, `runner_real_high_credits_setup`, `runner_real_empty_hand_draw`, `runner_real_safe_archives_access`, `runner_real_remote_with_ice_probe`, `runner_real_low_click_tag_cleanup` |
| `corp_score_window` | 2 | 2 | `corp_real_score_agenda_window`, `corp_real_score_low_credits` |

## Blocked By Reason

| Reason | Count |
| --- | ---: |
| `basic_setup_action_type_blocked` | 17 |
| `corp_score_window_action_type_blocked` | 13 |
| `corp_score_window_wrong_side` | 15 |
| `runner_safe_access_action_type_blocked` | 3 |
| `runner_safe_access_non_central_target` | 1 |
| `runner_safe_access_wrong_side` | 15 |

## RemoteContest Candidate

| Feld | Wert |
| --- | --- |
| candidateCount | 1 |
| scenarioIds | `runner_real_remote_score_threat` |
| candidateStatus | `eligible` |
| productiveUseAllowed | `false` |
| runtimeConsumerStatus | `none` |

## Top Disagreement Reasons

- `corp_real_advance_score_window:expected=advance_card:observed=gain_credit`
- `runner_real_damage_buffer_needed:expected=draw_card:observed=start_run`
- `runner_real_tag_cleanup:expected=remove_tag:observed=start_run`

## Einordnung

- `pilotEligibleCount` zählt Szenarien mit mindestens einem erlaubten Scope. `scopeCandidateCount` zählt geprüfte Szenario/Scope-Paare. `scopeAllowedCount` zählt erlaubte Szenario/Scope-Paare.
- `pilotWouldOverrideCount` ist report-only und bedeutet: Die Shadow-Top-Action hätte bei erlaubtem Scope und positivem Score-Gap ein hypothetisches Override-Potenzial. Es ist keine produktive Entscheidung.
- `pilotActualOverrideCount` bleibt 0, weil die Shadow-League keinen Runtime-Consumer hat.
- Der RemoteContest-Kandidat ist in V2 streng bewertet, bleibt aber weiterhin report-only und hat keinen Runtime-Consumer.
- Die `runner_safe_access`-Eligibility in `runner_real_damage_buffer_needed` und `runner_real_tag_cleanup` ist ein bewusst sichtbarer Baseline-Befund, kein Freigabesignal.
- `redactionStatus: passed` bestätigt nur den lokalen Report-Scrub. Es erweitert keine Hidden-Info-Allowlist.
- Nach AI-MAT2-2 umfasst der Korpus lokal 30 Szenarien. Die drei Top-Disagreements bleiben unverändert; die zusätzlichen Szenarien erhöhen die Pilot-Scope-Eligibility.
- Die hier gelisteten Metriken wurden am 2026-06-13 aus `buildSemanticShadowLeagueReport(buildRealEngineDecisionCorpus(buildRealEngineDecisionCorpusScenarios()))` erzeugt, nicht aus einer separaten Erwartungsliste gepflegt.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/real-engine-decision-corpus.test.ts`: bestanden.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league.test.ts`: bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.
