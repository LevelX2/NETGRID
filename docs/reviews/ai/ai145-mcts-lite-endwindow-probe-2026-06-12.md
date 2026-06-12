# AI145 MCTS-lite Endwindow Probe

Datum: 2026-06-12

Branch: `codex/ai140-ai148-semantic-endgame-optimization`

## Ziel

AI145 prototypisiert einen kleinen deterministischen Endwindow-Lookahead. Da der Failure-Corpus keinen vollständigen Engine-State enthält, nutzt der Probe einen sicheren Progress-Proxy aus AI132 statt `applyAction`-Simulation. Keine Runtime-Wirkung.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| geprüfte Endfenster | 5 |
| Proxy schlägt Legacy | 5 |
| Redaction-safe | 1 |

## Probes

| Case | Legacy | Shadow Challenger | Top Proxy Actions | Runtime-Blocker |
| --- | --- | --- | --- | --- |
| `A-ai-v143-tuning-006` | corp/advance_card/`no_progress_stale` | runner/continue_run/`progress_reachability_improved` | runner/continue_run/`progress_reachability_improved`:67, runner/start_run/`progress_reachability_improved`:67, runner/gain_credit/`progress_economy_converted`:52 | `proxy_only_no_engine_state_applyaction_replay` |
| `A-ai-v143-tuning-008` | runner/continue_run/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | runner/activated_card_ability/`progress_coverage_install`:96, runner/install_card/`progress_coverage_install`:96, runner/activated_card_ability/`progress_coverage_install`:91 | `proxy_only_no_engine_state_applyaction_replay` |
| `A-ai-v143-tuning-009` | corp/decline_rez/`no_progress_plausible` | runner/trash_accessed_card/`progress_trash` | runner/access_card/`progress_access`:114, runner/trash_accessed_card/`progress_trash`:97, runner/continue_run/`progress_reachability_improved`:91 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-001` | corp/resolve_choice/`no_progress_stale` | runner/trash_accessed_card/`progress_trash` | runner/access_card/`progress_access`:97, runner/trash_accessed_card/`progress_trash`:80, runner/gain_credit/`no_progress_plausible`:10 | `proxy_only_no_engine_state_applyaction_replay` |
| `B-ai-v143-tuning-003` | runner/pump_breaker/`progress_reachability_improved` | corp/rez_ice/`progress_server_protected` | runner/install_card/`progress_coverage_install`:99, runner/install_card/`progress_coverage_install`:86, runner/start_run/`progress_reachability_improved`:84 | `proxy_only_no_engine_state_applyaction_replay` |

## Schluss

Der Progress-Proxy bestätigt die AI136-Richtung für die geprüften Fälle, bleibt aber kein Runtime-Beweis. Ohne vollständigen Engine-State, LegalAction-Snapshot und Replay kann AI146 daraus keinen Cutover schneiden.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai145-mcts-lite-endwindow-probe.ts`
- `git diff --check`
