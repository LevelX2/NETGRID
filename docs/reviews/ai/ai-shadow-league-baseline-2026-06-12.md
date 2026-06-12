# AI Shadow League Baseline 2026-06-12

## Status

baseline_recorded

## Scope

Lokale, versionierte Semantic-Shadow-League-Baseline für den Real-Engine-Decision-Corpus. Diese Baseline ist diagnostisch und report-only.

## Baseline

| Feld | Wert |
| --- | ---: |
| sampleCount | 12 |
| agreementRate | 0.75 |
| mistakeCount | 1 |
| pilotEligibleCount | 9 |
| pilotWouldOverrideCount | 9 |
| redactionStatus | passed |

## Mistake Count By Class

| Klasse | Wert |
| --- | ---: |
| hidden_info_dependency | 0 |
| total_observed | 1 |

## Scope Breakdown

| Scope | eligibleCount | wouldOverrideCount | Szenarien |
| --- | ---: | ---: | --- |
| `basic_setup` | 4 | 4 | `runner_real_low_credits`, `corp_real_advance_score_window`, `corp_real_low_rez_reserve`, `corp_real_basic_economy_draw` |
| `runner_safe_access` | 4 | 4 | `runner_real_safe_hq_access`, `runner_real_safe_rd_access`, `runner_real_damage_buffer_needed`, `runner_real_tag_cleanup` |
| `corp_score_window` | 1 | 1 | `corp_real_score_agenda_window` |

## Top Disagreement Reasons

- `corp_real_advance_score_window:expected=advance_card:observed=gain_credit`
- `runner_real_damage_buffer_needed:expected=draw_card:observed=start_run`
- `runner_real_tag_cleanup:expected=remove_tag:observed=start_run`

## Einordnung

- `pilotWouldOverrideCount` ist report-only und bedeutet: Die Shadow-Top-Action wäre unter Scope-Regeln eligible, wenn Runtime-Choice, Score-Gap und Opt-in passen. Es ist keine produktive Entscheidung.
- Die `runner_safe_access`-Eligibility in `runner_real_damage_buffer_needed` und `runner_real_tag_cleanup` ist ein bewusst sichtbarer Baseline-Befund, kein Freigabesignal.
- `redactionStatus: passed` bestätigt nur den lokalen Report-Scrub. Es erweitert keine Hidden-Info-Allowlist.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/semantic-shadow-league.test.ts`: 2 Tests bestanden.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/play-strength-benchmark.test.ts`: 1 Test bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.
