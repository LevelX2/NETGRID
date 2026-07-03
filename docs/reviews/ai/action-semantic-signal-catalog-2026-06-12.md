# Action Semantic Signal Catalog Gate 2026-06-12

Diagnosebericht fuer aktive Karten. Der Bericht nutzt Active Hints, Compiled Hints, den Hint-Inspector-Index und den Tactic-Signal-Katalog.

Keine Runtime-Anbindung, keine Action-Auswahl, kein Scoring und keine Hidden-Info-Projektion.

## Summary

| Metric | Count |
| --- | ---: |
| Active cards | 616 |
| covered | 591 |
| deferred | 42 |
| no_signal_reason != none | 25 |
| target_profile_gap | 92 |
| structural signal violations | 0 |
| unknown signals | 0 |
| covered delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE | +52 |
| deferred delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE | -3 |
| no_signal delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE | 0 |
| target_profile_gap delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE | +8 |

## No Signal Reasons

| no_signal_reason | Cards |
| --- | ---: |
| `none` | 591 |
| `legacy_fallback_only` | 23 |
| `no_function_signal` | 2 |

## Target Profile Gaps

| Card | Side | Type | Signals expecting targets |
| --- | --- | --- | --- |
| `onr_classic_005_baskerville` | corp | ice | `economy.rez_discount` |
| `onr_classic_006_bolter-swarm` | corp | ice | `corp_ice.next_ice_break_lock`, `economy.rez_discount` |
| `onr_classic_021_satellite-monitors` | corp | asset | `condition.multiple_runs_last_turn` |
| `onr_classic_022_self-destruct` | corp | upgrade | `access.corp_net_damage_ambush` |
| `onr_classic_023_shock-treatment` | corp | upgrade | `access.corp_hardware_trash`, `access.corp_program_trash` |
| `onr_classic_030_psychic-friend` | runner | program | `breaker.scaling_strength` |
| `onr_classic_031_rent-i-con` | runner | program | `breaker.emergency_coverage` |
| `onr_proteus_004_fetal-ai` | corp | agenda | `access.corp_agenda_steal_tax`, `access.corp_net_damage_ambush` |
| `onr_proteus_005_marked-accounts` | corp | agenda | `access.corp_tag_ambush` |
| `onr_proteus_009_viral-breeding-ground` | corp | agenda | `access.corp_program_disruption`, `access.corp_runner_program_bounce` |
| `onr_proteus_056_department-of-misinformation` | corp | asset | `expose.corp_prevention` |
| `onr_proteus_079_big-frackin-gun` | runner | program | `breaker.multi_subroutine_break` |
| `onr_proteus_093_redecorator` | runner | program | `breaker.multi_subroutine_break` |
| `onr_proteus_104_decoy-signal` | runner | event | `info.expose`, `info.ice_approach_expose` |
| `onr_proteus_105_demolition-run` | runner | event | `fort.all_rezzed_ice_trash`, `fort.all_rezzed_ice_trash_tag_risk` |
| `onr_proteus_106_disgruntled-ice-technician` | runner | event | `ice.trash_rezzed` |
| `onr_proteus_107_drone-for-a-day` | runner | event | `fort.all_rezzed_ice_trash_tag_risk` |
| `onr_proteus_110_hijack` | runner | event | `setup.hardware_install`, `setup.install_credit`, `setup.program_install` |
| `onr_proteus_118_prearranged-drop` | runner | event | `access.next_agenda_credit` |
| `onr_proteus_119_promises-promises` | runner | event | `access.next_agenda_bonus` |
| `onr_proteus_120_reconnaissance` | runner | event | `info.expose`, `info.run_recon` |
| `onr_proteus_121_remote-detonator` | runner | event | `fort.all_rezzed_ice_trash`, `fort.all_rezzed_ice_trash_tag_risk` |
| `onr_proteus_129_back-door-to-netwatch` | runner | resource | `hidden.reveals_on_trash` |
| `onr_proteus_131_bargain-with-viacox` | runner | resource | `setup.search` |
| `onr_proteus_132_bolt-hole` | runner | resource | `hidden.reveals_on_trash` |
| `onr_proteus_133_chiba-bank-account` | runner | resource | `hidden.reveals_on_trash` |
| `onr_proteus_136_credit-subversion` | runner | resource | `access.hq_sabotage_credit_loss`, `hidden.reveals_on_trash` |
| `onr_proteus_140_expendable-family-member` | runner | resource | `hidden.reveals_on_trash` |
| `onr_proteus_141_get-ready-to-rumble` | runner | resource | `access.hq_random_discard_retaliation`, `hidden.reveals_on_trash` |
| `onr_proteus_142_hq-mole` | runner | resource | `access.hq_hidden_multiaccess`, `hidden.reveals_on_trash` |

## No Signal Review Start

| Card | Side | Type | Reason |
| --- | --- | --- | --- |
| `corp_identity_001` | corp | identity | `legacy_fallback_only` |
| `onr_proteus_034_riddler` | corp | ice | `legacy_fallback_only` |
| `onr_proteus_074_siren` | corp | asset | `no_function_signal` |
| `onr_v1_291_falsified-transactions-expert` | corp | operation | `no_function_signal` |
| `runner_identity_001` | runner | identity | `legacy_fallback_only` |
| `simple_agenda` | corp | agenda | `legacy_fallback_only` |
| `simple_barrier_ice` | corp | ice | `legacy_fallback_only` |
| `simple_code_gate_ice` | corp | ice | `legacy_fallback_only` |
| `simple_draw_event` | runner | event | `legacy_fallback_only` |
| `simple_economy_event` | runner | event | `legacy_fallback_only` |
| `simple_priority_agenda` | corp | agenda | `legacy_fallback_only` |
| `simple_run_event` | runner | event | `legacy_fallback_only` |
| `simple_sentry_ice` | corp | ice | `legacy_fallback_only` |
| `simple_setup_hardware` | runner | hardware | `legacy_fallback_only` |
| `simple_tag_ice` | corp | ice | `legacy_fallback_only` |
| `simple_taxing_barrier_ice` | corp | ice | `legacy_fallback_only` |
| `simple_upgrade` | corp | upgrade | `legacy_fallback_only` |
| `v08_burst_credit_event` | runner | event | `legacy_fallback_only` |
| `v08_deep_draw_event` | runner | event | `legacy_fallback_only` |
| `v08_gate_ice` | corp | ice | `legacy_fallback_only` |
| `v08_memory_chip` | runner | hardware | `legacy_fallback_only` |
| `v08_overclock_run_event` | runner | event | `legacy_fallback_only` |
| `v08_project_agenda` | corp | agenda | `legacy_fallback_only` |
| `v08_wall_ice` | corp | ice | `legacy_fallback_only` |
| `v08_watchdog_ice` | corp | ice | `legacy_fallback_only` |

## Deferred Review Scope

| Scope | Cards |
| --- | ---: |
| `inspector_warning_and_active_hint_quality` | 32 |
| `inspector_warning` | 10 |

## Row Contract

Every JSON row contains `covered`, `deferred`, `deferred_review_scope`, `deferred_owner`, `no_signal_reason` and `target_profile_gap`.
