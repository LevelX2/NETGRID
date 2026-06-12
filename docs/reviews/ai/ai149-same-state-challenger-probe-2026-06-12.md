# AI149 Same-State Challenger Probe

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI149 prüft die 17 AI136-Verbesserungskandidaten erneut in den vom neuen Folgeblock geforderten Kategorien. Ein Kandidat ist nur cutover-tauglich, wenn am exakten terminalen Legacy-Entscheidungspunkt eine gleiche oder äquivalente LegalAction-Alternative sichtbar ist.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Kandidaten | 17 |
| Same-State Matches | 0 |
| Same-State Legal Better | 0 |
| Same-State Legal Equivalent | 0 |
| Historical Only Not Legal Now | 17 |
| TargetContext Missing | 0 |
| Redaction-safe | 1 |

## Kategorien

| Kategorie | Fälle |
| --- | ---: |
| `historical_only_not_legal_now` | 17 |

## Kandidaten

| Case | Subcluster | Legacy | Historischer Challenger | Snapshot | Match | Kategorie | TargetContext |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | corp/advance_card/`no_progress_stale` | runner/continue_run/`progress_reachability_improved` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/continue_run/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/decline_rez/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/resolve_choice/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/pump_breaker/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | runner/continue_run/`progress_reachability_improved` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | runner/gain_credit/`no_progress_plausible` | runner/install_card/`progress_coverage_install` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/gain_credit/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | corp/advance_card/`no_progress_stale` | runner/steal_agenda/`progress_steal` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | runner/resolve_choice/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | runner/activated_card_ability/`progress_coverage_install` | runner/steal_agenda/`progress_steal` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/mandatory_draw/`no_progress_stale` | runner/activated_card_ability/`progress_coverage_install` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | runner/end_turn/`no_progress_plausible` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | runner/break_subroutine/`progress_reachability_improved` | corp/score_agenda/`progress_score` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | corp/end_turn/`no_progress_stale` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | corp/end_turn/`no_progress_stale` | corp/score_agenda/`progress_score` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | runner/gain_credit/`no_progress_plausible` | runner/access_card/`progress_access` | 1 | 0 | `historical_only_not_legal_now` | `not_present` |

## Schluss

AI149 findet keinen produktionsfähigen same-state Kandidaten. Alle 17 Verbesserungshinweise bleiben historische Challenger: Die bessere Aktion war im Korpus vorhanden, aber am terminalen Legacy-Entscheidungspunkt nicht als gleiche oder äquivalente LegalAction-Alternative belegt. Damit bleibt der Block weiterhin in Shadow-/Diagnosearbeit, bis ein späterer Fixture-Aufbau echte same-state Kandidaten liefert.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai149-same-state-challenger-probe.ts`
- `git diff --check`
