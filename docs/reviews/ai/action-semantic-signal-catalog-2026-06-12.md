# Action Semantic Signal Catalog Gate 2026-06-12

Diagnosebericht fuer aktive Karten. Der Bericht nutzt Active Hints, Compiled Hints, den Hint-Inspector-Index und den Tactic-Signal-Katalog.

Keine Runtime-Anbindung, keine Action-Auswahl, kein Scoring und keine Hidden-Info-Projektion.

## Summary

| Metric                       | Count |
| ---------------------------- | ----: |
| Active cards                 |   564 |
| covered                      |   539 |
| deferred                     |    45 |
| no_signal_reason != none     |    25 |
| target_profile_gap           |   116 |
| structural signal violations |     0 |
| unknown signals              |     0 |

## No Signal Reasons

| no_signal_reason       | Cards |
| ---------------------- | ----: |
| `none`                 |   539 |
| `legacy_fallback_only` |    23 |
| `no_function_signal`   |     2 |

## Target Profile Gaps

| Card                                           | Side   | Type      | Signals expecting targets                                                                       |
| ---------------------------------------------- | ------ | --------- | ----------------------------------------------------------------------------------------------- |
| `onr_proteus_004_fetal-ai`                     | corp   | agenda    | `access.rnd_reveal_requirement`                                                                 |
| `onr_proteus_005_marked-accounts`              | corp   | agenda    | `access.rnd_reveal_requirement`                                                                 |
| `onr_proteus_009_viral-breeding-ground`        | corp   | agenda    | `access.runner_program_bounce`, `access.runner_program_disruption`, `score.fort_trash_on_score` |
| `onr_proteus_013_caryatid`                     | corp   | ice       | `corp_ice.type_choice_or_mode_choice`                                                           |
| `onr_proteus_017_credit-blocks`                | corp   | ice       | `corp_ice.type_choice_or_mode_choice`                                                           |
| `onr_proteus_023_galatea`                      | corp   | ice       | `corp_ice.type_choice_or_mode_choice`                                                           |
| `onr_proteus_028_lesser-arcana`                | corp   | ice       | `corp_ice.type_choice_or_mode_choice`                                                           |
| `onr_proteus_033_mobile-barricade`             | corp   | ice       | `corp_ice.mobile_position_change`                                                               |
| `onr_proteus_035_roadblock`                    | corp   | ice       | `corp_ice.random_or_guessing`                                                                   |
| `onr_proteus_039_sphinx-2006`                  | corp   | ice       | `corp_ice.type_choice_or_mode_choice`                                                           |
| `onr_proteus_040_sumo-2008`                    | corp   | ice       | `corp_ice.type_choice_or_mode_choice`                                                           |
| `onr_proteus_044_walking-wall`                 | corp   | ice       | `corp_ice.mobile_position_change`                                                               |
| `onr_proteus_048_data-sifters`                 | corp   | operation | `condition.node_trashed_last_turn`                                                              |
| `onr_proteus_049_emergency-rig`                | corp   | operation | `ice.corp_temporary_rez`                                                                        |
| `onr_proteus_051_rent-to-own-contract`         | corp   | operation | `ice.corp_deferred_rez`, `ice.corp_installment_rez`                                             |
| `onr_proteus_052_schlaghund-pointers`          | corp   | operation | `condition.run_this_game`                                                                       |
| `onr_proteus_053_underworld-mole`              | corp   | operation | `condition.resource_installed_last_turn`                                                        |
| `onr_proteus_054_bel-digmo-antibody`           | corp   | asset     | `access.corp_rnd_net_damage_ambush`, `access.rnd_reveal_requirement`                            |
| `onr_proteus_055_cybertech-think-tank`         | corp   | asset     | `advance.corp_counter_bank`                                                                     |
| `onr_proteus_056_department-of-misinformation` | corp   | asset     | `expose.corp_prevention`                                                                        |
| `onr_proteus_057_doppelganger-antibody`        | corp   | asset     | `access.corp_credit_loss_counter`, `access.rnd_reveal_requirement`                              |
| `onr_proteus_059_government-contract`          | corp   | asset     | `advance.corp_counter_bank`                                                                     |
| `onr_proteus_061_ldl-traffic-analyzers`        | corp   | asset     | `advance.corp_counter_bank`                                                                     |
| `onr_proteus_068_pattel-antibody`              | corp   | asset     | `access.corp_icebreaker_strength_counter`, `access.rnd_reveal_requirement`                      |
| `onr_proteus_075_stereogram-antibody`          | corp   | asset     | `access.corp_archives_net_damage_ambush`                                                        |
| `onr_proteus_079_big-frackin-gun`              | runner | program   | `breaker.multi_subroutine_break`                                                                |
| `onr_proteus_084_crumble`                      | runner | program   | `access.free_trash`, `access.hq_trash_pressure`, `access.trash_untrashable`                     |
| `onr_proteus_089_garbage-in`                   | runner | program   | `access.free_trash`, `access.rnd_trash_pressure`, `access.trash_untrashable`                    |
| `onr_proteus_093_redecorator`                  | runner | program   | `breaker.multi_subroutine_break`                                                                |
| `onr_proteus_104_decoy-signal`                 | runner | event     | `info.expose`, `info.ice_approach_expose`                                                       |

## Row Contract

Every JSON row contains `covered`, `deferred`, `no_signal_reason` and `target_profile_gap`.
