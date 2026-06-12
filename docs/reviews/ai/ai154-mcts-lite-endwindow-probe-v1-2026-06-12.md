# AI154 MCTS-lite Endwindow Probe v1

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI154 testet einen kleinen deterministischen Lookahead für kritische Endfenster. Da der Failure-Corpus keinen vollständigen Engine-State für echte `applyAction`-Simulation enthält, nutzt v1 einen statischen Progress-Proxy über die letzten 30 gelabelten Aktionen. Keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Endfenster | 10 |
| Proxy schlägt Legacy | 10 |
| AI136 Challenger in Top 3 | 7 |
| Redaction-safe | 1 |

## Probes

| Case | Legacy | AI136 Challenger | Top Proxy Actions | AI136 in Top 3 | Runtime-Blocker |
| --- | --- | --- | --- | ---: | --- |
| `A-ai-v143-tuning-006` | corp/advance_card/`no_progress_stale` | runner/continue_run/`progress_reachability_improved` | runner/continue_run/`progress_reachability_improved`:69, runner/start_run/`progress_reachability_improved`:69, runner/continue_run/`progress_reachability_improved`:69 | 1 | `proxy_only_no_engine_state_applyaction_replay` |
| `A-ai-v143-tuning-008` | runner/continue_run/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | runner/access_card/`progress_access`:120, runner/trash_accessed_card/`progress_trash`:106, runner/start_run/`progress_reachability_improved`:103 | 0 | `proxy_only_no_engine_state_applyaction_replay` |
| `A-ai-v143-tuning-009` | corp/decline_rez/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | runner/access_card/`progress_access`:118, runner/access_card/`progress_access`:106, runner/trash_accessed_card/`progress_trash`:104 | 1 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-001` | corp/resolve_choice/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | runner/access_card/`progress_access`:104, runner/continue_run/`progress_reachability_improved`:97, runner/break_subroutine/`progress_reachability_improved`:97 | 0 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-003` | runner/pump_breaker/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | runner/install_card/`progress_coverage_install`:98, runner/install_card/`progress_coverage_install`:88, corp/rez_ice/`progress_server_protected`:84 | 1 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-006` | runner/continue_run/`progress_reachability_improved` | runner/access_card/`progress_access` | runner/access_card/`progress_access`:92, runner/continue_run/`progress_reachability_improved`:83, runner/break_subroutine/`progress_reachability_improved`:83 | 1 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-008` | runner/gain_credit/`no_progress_plausible` | runner/install_card/`progress_coverage_install` | runner/install_card/`progress_coverage_install`:70, runner/gain_credit/`progress_economy_converted`:49, corp/gain_credit/`progress_economy_converted`:49 | 1 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-009` | corp/gain_credit/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | runner/access_card/`progress_access`:104, runner/continue_run/`progress_reachability_improved`:97, runner/start_run/`progress_reachability_improved`:97 | 0 | `proxy_only_no_engine_state_applyaction_replay` |
| `C-ai-v143-tuning-001` | corp/advance_card/`no_progress_stale` | runner/steal_agenda/`progress_steal` | runner/steal_agenda/`progress_steal`:148, runner/access_card/`progress_access`:132, corp/score_agenda/`progress_score`:128 | 1 | `proxy_only_no_engine_state_applyaction_replay` |
| `C-ai-v143-tuning-005` | runner/resolve_choice/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | runner/access_card/`progress_access`:118, corp/rez_ice/`progress_server_protected`:118, runner/trash_accessed_card/`progress_trash`:104 | 1 | `proxy_only_no_engine_state_applyaction_replay` |

## Schluss

Der Proxy bewertet mindestens zehn Endfenster und bestätigt häufig, dass Legacy nicht die stärkste Progress-Spur ist. Er ersetzt aber keinen same-state LegalAction-Beweis: Ohne Engine-State, LegalAction-Snapshot und Replay bleibt AI154 reine Evidence für spätere Fixture-Arbeit.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai154-mcts-lite-endwindow-probe-v1.ts`
- `git diff --check`
