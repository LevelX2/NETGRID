# AI152 Runner Coverage Solver Shadow

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI152 macht Runner-Coverage-Planung konkreter: sichtbare oder suchbare Coverage schlägt Draw, Draw schlägt Credit, und Credit zählt nur, wenn er einen konkreten Coverage- oder Reachability-Pfad ermöglicht. Das Paket bleibt shadow-only.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Runner-/Run-Fälle | 15 |
| Assertions bestanden | 4/4 |
| Redaction-safe | 1 |

## Kategorien

| Kategorie | Fälle |
| --- | ---: |
| `coverage_credit_needed` | 5 |
| `coverage_install_now` | 10 |

## Assertions

| Test | Erwartet | Erhalten | Ergebnis |
| --- | --- | --- | --- |
| sichtbarer Wall-Breaker vor Credit | `coverage_install_now` | `coverage_install_now` | pass |
| Search-Action vor Draw | `coverage_search_now` | `coverage_search_now` | pass |
| Credit bleibt korrekt bei konkretem Kostenpfad | `coverage_credit_needed` | `coverage_credit_needed` | pass |
| keine Stack-Hidden-Info | `coverage_no_visible_path` | `coverage_no_visible_path` | pass |

## Fälle

| Case | Subcluster | Missing Coverage | Install | Search | Draw | Credit | Stale | Kategorie | Cutover |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | `reachability_step` | 1 | 1 | 0 | 0 | 7 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `unknown_or_none_visible` | 0 | 0 | 0 | 1 | 0 | `coverage_credit_needed` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `specific_visible_gap` | 1 | 0 | 0 | 0 | 11 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | `reachability_step` | 1 | 1 | 0 | 0 | 0 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | `specific_visible_gap` | 1 | 1 | 0 | 0 | 5 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | `specific_visible_gap` | 1 | 1 | 0 | 0 | 9 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | `specific_visible_gap` | 1 | 1 | 0 | 0 | 3 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | `reachability_step` | 1 | 1 | 0 | 0 | 0 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | `specific_visible_gap` | 1 | 1 | 0 | 0 | 0 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | `specific_visible_gap` | 1 | 1 | 0 | 0 | 0 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | `reachability_step` | 1 | 1 | 0 | 0 | 0 | `coverage_install_now` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | `reachability_step` | 0 | 0 | 0 | 1 | 0 | `coverage_credit_needed` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | `unknown_or_none_visible` | 0 | 0 | 0 | 1 | 8 | `coverage_credit_needed` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | `reachability_step` | 0 | 0 | 0 | 1 | 9 | `coverage_credit_needed` | `shadow_only_needs_same_state_fixture` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | `reachability_step` | 0 | 0 | 0 | 1 | 10 | `coverage_credit_needed` | `shadow_only_needs_same_state_fixture` |

## Schluss

Der Solver trennt konkrete Coverage-Pfade von bloßer Reserve. Sichtbare und suchbare Coverage wird als bessere Shadow-Priorität markiert; Credit bleibt nur dann Coverage-Pfad, wenn keine direkte oder suchbare Lösung sichtbar ist und ein späterer Coverage-/Reachability-Fortschritt im side-safe Label-Corpus folgt. AI149 liefert weiterhin keinen same-state Cutover-Kandidaten.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai152-runner-coverage-solver-shadow.ts`
- `git diff --check`
