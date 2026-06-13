# AI159 Opportunity-State Mining

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI159 prüft die 17 AI149-Fälle nicht am terminalen Zustand, sondern sucht den frühesten Progress-Punkt im Endfenster und die vorhergehende Entscheidung derselben Seite. Der Korpus enthält für diese früheren Punkte keine vollständigen LegalAction-Snapshots; diese Lücke wird ausdrücklich als TargetContext-/Snapshot-Blocker klassifiziert.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fälle | 17 |
| Opportunity same-state better | 0 |
| Opportunity TargetContext missing | 2 |
| No Opportunity State Found | 15 |
| Redaction-safe | 1 |

## Kategorien

| Kategorie | Fälle |
| --- | ---: |
| `no_opportunity_state_found` | 15 |
| `opportunity_target_context_missing` | 2 |

## Fälle

| Case | Subcluster | First Progress | Previous Same-Side Decision | Legal Snapshot | Kategorie | Blocker |
| --- | --- | --- | --- | ---: | --- | --- |
| `A-ai-v143-tuning-006` | `continue_chain_to_access` | runner/steal_agenda@100/`progress_steal` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `A-ai-v143-tuning-008` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/gain_credit@100/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `A-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | runner/gain_credit@101/`progress_economy_converted` | runner/install_card@100/`no_progress_stale` | 0 | `opportunity_target_context_missing` | `no_earlier_legal_action_snapshot_in_failure_corpus` |
| `B-ai-v143-tuning-001` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/gain_credit@101/`progress_economy_converted` | corp/advance_card@100/`no_progress_stale` | 0 | `opportunity_target_context_missing` | `no_earlier_legal_action_snapshot_in_failure_corpus` |
| `B-ai-v143-tuning-003` | `corp_late_gain_credit_real_rez_or_protection_reserve` | corp/gain_credit@100/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `B-ai-v143-tuning-006` | `continue_chain_to_access` | runner/gain_credit@100/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `B-ai-v143-tuning-008` | `runner_late_gain_credit_real_reserve` | runner/play_event@100/`progress_coverage_install` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `B-ai-v143-tuning-009` | `runner_late_gain_credit_real_reserve` | runner/gain_credit@101/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `C-ai-v143-tuning-001` | `runner_late_gain_credit_real_reserve` | runner/continue_run@100/`progress_reachability_improved` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `C-ai-v143-tuning-005` | `runner_late_gain_credit_real_reserve` | runner/gain_credit@100/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `C-ai-v143-tuning-006` | `runner_late_gain_credit_real_reserve` | corp/gain_credit@100/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `C-ai-v143-tuning-007` | `corp_late_gain_credit_real_rez_or_protection_reserve` | runner/activated_card_ability@100/`progress_coverage_install` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `C-ai-v143-tuning-008` | `run_microstep_required` | corp/rez_ice@100/`progress_server_protected` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `D-ai-v143-tuning-003` | `continue_chain_to_access` | runner/start_run@100/`progress_reachability_improved` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `D-ai-v143-tuning-004` | `runner_late_gain_credit_real_reserve` | runner/gain_credit@104/`progress_economy_converted` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `D-ai-v143-tuning-008` | `continue_chain_to_access` | runner/start_run@101/`progress_reachability_improved` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |
| `D-ai-v143-tuning-010` | `continue_chain_to_access` | runner/access_card@100/`progress_access` | none | 0 | `no_opportunity_state_found` | `no_progress_action_in_endwindow` |

## Schluss

AI159 findet frühere Opportunity-Fenster, aber keine verwertbaren LegalAction-Snapshots für diese Zeitpunkte. Damit ist der nächste reale Engpass nicht Scoring, sondern Fixture-/Trace-Instrumentierung: Opportunity-State-Snapshots müssen LegalActions, TargetContext, Kosten- und Timingprofile enthalten, bevor ein Cutover möglich wird.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai159-opportunity-state-mining.ts`
- `git diff --check`
