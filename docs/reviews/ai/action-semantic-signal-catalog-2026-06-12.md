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
| target_profile_gap           |    84 |
| structural signal violations |     0 |
| unknown signals              |     0 |

## No Signal Reasons

| no_signal_reason       | Cards |
| ---------------------- | ----: |
| `none`                 |   539 |
| `legacy_fallback_only` |    23 |
| `no_function_signal`   |     2 |

## Target Profile Gaps

| Card                                           | Side   | Type     | Signals expecting targets                                                 |
| ---------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------- |
| `onr_proteus_009_viral-breeding-ground`        | corp   | agenda   | `access.runner_program_bounce`, `access.runner_program_disruption`        |
| `onr_proteus_056_department-of-misinformation` | corp   | asset    | `expose.corp_prevention`                                                  |
| `onr_proteus_079_big-frackin-gun`              | runner | program  | `breaker.multi_subroutine_break`                                          |
| `onr_proteus_093_redecorator`                  | runner | program  | `breaker.multi_subroutine_break`                                          |
| `onr_proteus_104_decoy-signal`                 | runner | event    | `info.expose`, `info.ice_approach_expose`                                 |
| `onr_proteus_105_demolition-run`               | runner | event    | `fort.all_rezzed_ice_trash`, `fort.all_rezzed_ice_trash_tag_risk`         |
| `onr_proteus_106_disgruntled-ice-technician`   | runner | event    | `ice.trash_rezzed`                                                        |
| `onr_proteus_107_drone-for-a-day`              | runner | event    | `fort.all_rezzed_ice_trash_tag_risk`                                      |
| `onr_proteus_110_hijack`                       | runner | event    | `setup.hardware_install`, `setup.install_credit`, `setup.program_install` |
| `onr_proteus_118_prearranged-drop`             | runner | event    | `access.next_agenda_credit`                                               |
| `onr_proteus_119_promises-promises`            | runner | event    | `access.next_agenda_bonus`                                                |
| `onr_proteus_120_reconnaissance`               | runner | event    | `info.expose`, `info.run_recon`                                           |
| `onr_proteus_121_remote-detonator`             | runner | event    | `fort.all_rezzed_ice_trash`, `fort.all_rezzed_ice_trash_tag_risk`         |
| `onr_proteus_129_back-door-to-netwatch`        | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_proteus_131_bargain-with-viacox`          | runner | resource | `setup.search`                                                            |
| `onr_proteus_132_bolt-hole`                    | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_proteus_133_chiba-bank-account`           | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_proteus_136_credit-subversion`            | runner | resource | `access.hq_sabotage_credit_loss`, `hidden.reveals_on_trash`               |
| `onr_proteus_140_expendable-family-member`     | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_proteus_141_get-ready-to-rumble`          | runner | resource | `access.hq_random_discard_retaliation`, `hidden.reveals_on_trash`         |
| `onr_proteus_142_hq-mole`                      | runner | resource | `access.hq_hidden_multiaccess`, `hidden.reveals_on_trash`                 |
| `onr_proteus_143_liberated-savings-account`    | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_proteus_146_precision-bribery`            | runner | resource | `fort.creation_lock`                                                      |
| `onr_proteus_147_r-and-d-mole`                 | runner | resource | `access.rnd_hidden_multiaccess`, `hidden.reveals_on_trash`                |
| `onr_proteus_149_simulacrum`                   | runner | resource | `hidden.reveals_on_trash`, `run.bypass_ap_ice`, `run.encounter_escape`    |
| `onr_proteus_152_swiss-bank-account`           | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_proteus_154_wired-switchboard`            | runner | resource | `hidden.reveals_on_trash`                                                 |
| `onr_v1_008_boardwalk`                         | runner | program  | `access.hq_random_reveal`, `info.hq_information`                          |
| `onr_v1_017_deep-thought`                      | runner | program  | `access.rnd_top_card`, `info.rnd_information`                             |
| `onr_v1_020_dupre`                             | runner | program  | `breaker.scaling_strength`                                                |

## Row Contract

Every JSON row contains `covered`, `deferred`, `no_signal_reason` and `target_profile_gap`.
