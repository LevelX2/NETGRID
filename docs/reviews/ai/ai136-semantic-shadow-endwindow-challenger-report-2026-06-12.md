# AI136 Semantic Shadow Endwindow Challenger Report

Datum: 2026-06-12

Branch: `codex/ai131-ai139-semantic-endwindow-optimization`

## Ziel

AI136 vergleicht für alle x10-Action-Limit-Endfenster die terminale Legacy-Auswahl mit einem semantischen Shadow-Challenger aus den letzten 20 historischen legalen Endfenster-Actions. Das Paket ändert keine Runtime-Entscheidung.

## Methode

- Quelle: AI131-Failure-Corpus und AI132-Progress-Delta-Labels.
- Der Challenger wählt die stärkste side-safe Progress-Klasse im finalen 20-Action-Fenster.
- `legalBasis` ist `historical_selected_legal_action`; der Challenger wird nicht als neue aktuelle LegalAction generiert.
- Ein Fall gilt nur als Verbesserungskandidat, wenn das Challenger-Progress-Label das terminale Legacy-Label übertrifft.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 21 |
| andere Challenger | 17 |
| Verbesserungskandidaten | 17 |
| No-Go-Fälle | 4 |
| Hidden-Info-Funde | 0 |
| nichtlegale Challenger-Actions | 0 |
| Redaction-safe | 1 |

## Top-3-Verbesserungsfälle

1. `A-ai-v143-tuning-006`
2. `A-ai-v143-tuning-008`
3. `A-ai-v143-tuning-009`

## Vergleichstabelle

| Case | Subcluster | Legacy | Challenger | anders | Outcome-Hinweis | No-Go |
| --- | --- | --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | corp/advance_card/`no_progress_stale` | runner/continue_run/`progress_reachability_improved` | 1 | no_followup_progress_in_window | 0 |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/continue_run/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | 1 | progress_reachability_improved | 0 |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/decline_rez/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | 1 | progress_reachability_improved | 0 |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/resolve_choice/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | 1 | no_followup_progress_in_window | 0 |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/pump_breaker/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | 1 | progress_reachability_improved | 0 |
| `B-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | runner/end_turn/`no_progress_plausible` | runner/end_turn/`no_progress_plausible` | 0 | no_followup_progress_in_window | 1 |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | runner/continue_run/`progress_reachability_improved` | runner/access_card/`progress_access` | 1 | progress_reachability_improved | 0 |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | runner/gain_credit/`no_progress_plausible` | runner/install_card/`progress_coverage_install` | 1 | no_followup_progress_in_window | 0 |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | corp/gain_credit/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | 1 | no_followup_progress_in_window | 0 |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | corp/advance_card/`no_progress_stale` | runner/steal_agenda/`progress_steal` | 1 | progress_coverage_install,progress_reachability_improved | 0 |
| `C-ai-v143-tuning-002` | `continue_chain_to_access` | runner/trash_accessed_card/`progress_trash` | runner/trash_accessed_card/`progress_trash` | 0 | no_followup_progress_in_window | 1 |
| `C-ai-v143-tuning-004` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/rez_ice/`progress_server_protected` | corp/rez_ice/`progress_server_protected` | 0 | no_followup_progress_in_window | 1 |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | runner/resolve_choice/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | 1 | progress_coverage_install | 0 |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | runner/activated_card_ability/`progress_coverage_install` | runner/steal_agenda/`progress_steal` | 1 | progress_coverage_install | 0 |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/mandatory_draw/`no_progress_stale` | runner/activated_card_ability/`progress_coverage_install` | 1 | no_followup_progress_in_window | 0 |
| `C-ai-v143-tuning-008` | `run_microstep_required` | runner/end_turn/`no_progress_plausible` | runner/access_card/`progress_access` | 1 | no_followup_progress_in_window | 0 |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | runner/break_subroutine/`progress_reachability_improved` | corp/score_agenda/`progress_score` | 1 | progress_reachability_improved | 0 |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | corp/end_turn/`no_progress_stale` | runner/access_card/`progress_access` | 1 | no_followup_progress_in_window | 0 |
| `D-ai-v143-tuning-006` | `corp_late_gain_credit_no_safe_alternative` | runner/gain_credit/`no_progress_plausible` | runner/gain_credit/`no_progress_plausible` | 0 | no_followup_progress_in_window | 1 |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | corp/end_turn/`no_progress_stale` | corp/score_agenda/`progress_score` | 1 | progress_reachability_improved,progress_access | 0 |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | runner/gain_credit/`no_progress_plausible` | runner/access_card/`progress_access` | 1 | no_followup_progress_in_window | 0 |

## Schlüsse

- Der Challenger zeigt mehrere historische bessere Endfenster-Aktionen, aber diese sind noch keine aktuellen LegalAction-Alternativen am terminalen Entscheidungszustand.
- AI137 darf daher nur dann cutovern, wenn ein Kandidat zusätzlich als wiederholbare side-safe Alternative am selben Entscheidungstyp belegbar ist.
- Der Bericht liefert Prioritäten für AI137, aber keinen automatischen Runtime-Fix.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai136-semantic-shadow-endwindow-challenger.ts`
- `git diff --check`
