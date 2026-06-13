# Card Function Abstraction Review 2026-06-12

Status: inventory_with_vertical_slice

## Kurzbefund

Kartennamen sind in Katalog- und Testkontexten weiterhin zulässig. Problematisch sind kartenspezifische Namen in funktionalen `kind`-Werten, Payload-Keys, Runtime-State-Feldern, Resolvernamen und verhaltenssteuernden Konstanten.

Dieser Review ist ein Inventar mit erstem vertikalem Refactor-Slice, kein Abschlussbericht über vollständige Bereinigung. Der Preying-Mantis-Pfad ist generisch umgestellt; die übrigen Kandidaten bleiben sichtbar offen.

Der zugehörige Guard ist ein konservativer Baseline-/Inventory-Guard. Er blockiert Änderungen am geprüften Inventar und ergänzt eine automatisch aus dem Kartenkatalog abgeleitete New-Leak-Erkennung; er ersetzt weiterhin keine semantische Architekturprüfung für alle künftigen Mechaniken.

## Zählung

| Kategorie | Anzahl |
| --- | ---: |
| functional_kind_uses_card_name | 29 |
| false_positive | 33 |
| test_only_card_name | 77 |
| allowed_catalog_reference | 43 |
| runtime_state_field_uses_card_name | 174 |
| mechanics_constant_controls_behavior_by_card_id | 31 |

## Problemstellen

- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:81` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:104` Omniscience Foundation / `omniscience_foundation` -> `end_turn_tag_on_successful_run_condition`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:108` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:114` Newsgroup Taunting / `newsgroup_taunting` -> `run_start_tax`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:162` Siren / `siren` -> `start_run_redirect_to_source_fort`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:204` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:208` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:212` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:216` Shell Traders / `shell_traders` -> `delayed_install_sequence`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:220` Bizarre Encryption Scheme / `bizarre_encryption_scheme` -> `delayed_agenda_access_replacement`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:809` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- functional_kind_uses_card_name: `packages/engine/src/ability-engine/definition-types.ts:831` Project Babylon / `project_babylon` -> `overadvance_bonus_agenda_points`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/agendas/corporate-war.ts:8` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/agendas/project-babylon.ts:8` Project Babylon / `project_babylon` -> `overadvance_bonus_agenda_points`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/assets/disinfectant-inc.ts:8` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/assets/newsgroup-taunting.ts:8` Newsgroup Taunting / `newsgroup_taunting` -> `run_start_tax`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/assets/omniscience-foundation.ts:8` Omniscience Foundation / `omniscience_foundation` -> `end_turn_tag_on_successful_run_condition`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/operations/new-blood.ts:8` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/operations/silver-lining-recovery-protocol.ts:8` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/corp/upgrades/bizarre-encryption-scheme.ts:8` Bizarre Encryption Scheme / `bizarre_encryption_scheme` -> `delayed_agenda_access_replacement`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/runner/preps/fortress-respecification.ts:8` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/runner/preps/social-engineering.ts:8` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/onr-v1/runner/resources/the-shell-traders.ts:8` Shell Traders / `shell_traders` -> `delayed_install_sequence`
- functional_kind_uses_card_name: `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:15` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/runner-special-trigger-execution.ts:214` Shell Traders / `shell_traders` -> `delayed_install_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/runner-special-trigger-execution.ts:351` Shell Traders / `shell_traders` -> `delayed_install_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/trigger-ability-execution.ts:160` Pirate Broadcast / `pirate_broadcast` -> `multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/trigger-ability-execution.ts:166` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/trigger-ability-execution.ts:168` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/trigger-ability-execution.ts:173` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/trigger-ability-execution.ts:174` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-effect-handlers.ts:42` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-effect-handlers.ts:1440` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-effect-handlers.ts:1441` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-effect-handlers.ts:1444` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-flow.ts:456` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-flow.ts:607` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/access/access-flow.ts:609` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:420` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:421` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:421` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:485` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:487` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:488` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/card-implementation/card-implementation-runtime-deps.ts:489` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- functional_kind_uses_card_name: `packages/engine/src/game/corp/scored-agenda/corporate-war-sequence.ts:12` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- runtime_state_field_uses_card_name: `packages/engine/src/game/corp/scored-agenda/corporate-war-sequence.ts:41` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- runtime_state_field_uses_card_name: `packages/engine/src/game/corp/scored-agenda/corporate-war-sequence.ts:48` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- runtime_state_field_uses_card_name: `packages/engine/src/game/corp/scored-agenda/overadvance-score-effects.ts:27` Project Babylon / `project_babylon` -> `overadvance_bonus_agenda_points`
- runtime_state_field_uses_card_name: `packages/engine/src/game/corp/scored-agenda/scored-agenda-direct-effect-registry.ts:110` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- functional_kind_uses_card_name: `packages/engine/src/game/corp/scored-agenda/scored-agenda-direct-effect-registry.ts:111` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- runtime_state_field_uses_card_name: `packages/engine/src/game/corp/scored-agenda/scored-agenda-direct-effect-registry.ts:114` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- runtime_state_field_uses_card_name: `packages/engine/src/game/create-game.ts:213` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/access-flow-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:661` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:743` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:860` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:934` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/activated-card-runtime-hosts.ts:620` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/apply-action-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts:622` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-bootstrap.ts:662` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-bootstrap.ts:744` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-delegates.ts:231` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-delegates.ts:233` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:620` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:1283` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:1292` Newsgroup Taunting / `newsgroup_taunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:1345` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:643` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:935` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:1560` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:1562` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:1576` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-strength-cost-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/choice-hidden-zone-resolvers.ts:643` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/choice-hidden-zone-resolvers.ts:940` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/corp-runtime-resolvers.ts:643` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/corp-runtime-resolvers.ts:925` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/counter-turn-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/damage-trace-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/economy-runtime-services.ts:648` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/encounter-movement-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:663` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:745` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:763` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:789` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:843` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:899` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:1205` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/install-rez-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/legal-action-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/lookup-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/pending-choice-runtime-hosts.ts:254` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/pending-choice-runtime-hosts.ts:369` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/pending-choice-runtime-hosts.ts:478` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/pending-choice-runtime-hosts.ts:495` Siren / `siren` -> `start_run_redirect_to_source_fort`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/play-board-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:661` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:743` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:1157` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/run-flow-runtime-hosts.ts:632` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/runtime-bootstrap-support.ts:662` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/runtime-bootstrap-support.ts:744` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/scored-economy-runtime-hosts.ts:621` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-corp-runtime-resolvers.ts:648` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-corp-runtime-resolvers.ts:946` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-runtime-bootstrap.ts:662` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-bootstrap.ts:744` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-bootstrap.ts:1164` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts:931` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts:1439` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts:1452` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts:1457` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts:1464` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts:1465` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/trigger-ability-runtime-hosts.ts:620` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/trigger-ability-runtime-hosts.ts:944` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:649` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:930` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:1178` Omniscience Foundation / `omniscience_foundation` -> `end_turn_tag_on_successful_run_condition`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:1184` Omniscience Foundation / `omniscience_foundation` -> `end_turn_tag_on_successful_run_condition`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:1188` Omniscience Foundation / `omniscience_foundation` -> `end_turn_tag_on_successful_run_condition`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:2135` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:2203` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:2272` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:2274` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:2312` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:2313` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/zone-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:360` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:368` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:370` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:406` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:415` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:417` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:439` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:662` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:685` Fortress Respecification / `fortress_respecification` -> `ice_reorder_hidden_zone_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:711` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/arrange-choice-handlers.ts:736` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:374` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:376` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:629` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:647` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:683` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:736` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:738` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:769` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/hidden-zone/nonsearch-choice-handlers.ts:771` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- runtime_state_field_uses_card_name: `packages/engine/src/game/play/corp-operation-resolution.ts:433` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- runtime_state_field_uses_card_name: `packages/engine/src/game/play/corp-operation-resolution.ts:543` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- runtime_state_field_uses_card_name: `packages/engine/src/game/play/corp-operation-resolution.ts:553` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- runtime_state_field_uses_card_name: `packages/engine/src/game/play/corp-operation-resolution.ts:757` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/play/corp-operation-resolution.ts:759` New Blood / `new_blood` -> `conceal_reorder_installed_ice`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-core-execution.ts:48` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-core-execution.ts:241` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-core-execution.ts:242` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-core-execution.ts:242` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:322` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:385` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:533` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:543` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:547` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:565` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:573` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:574` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:580` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:591` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/run-end-cleanup.ts:592` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:53` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:54` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:55` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:57` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:61` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:65` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:68` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:96` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:104` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:105` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:106` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/run/start-run-action-execution.ts:106` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/state/turn-flags-counters.ts:186` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/corp-main-actions.ts:731` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/main-action-hosts.ts:252` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/main-action-hosts.ts:252` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:61` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:229` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:229` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:301` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:301` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:302` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:303` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:304` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:304` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:306` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:307` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:320` Pirate Broadcast / `pirate_broadcast` -> `multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:321` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:322` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:330` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1122` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1151` Newsgroup Taunting / `newsgroup_taunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1152` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1153` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1218` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1219` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1236` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1237` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1244` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1245` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1291` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1292` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1294` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1300` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1314` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1334` Newsgroup Taunting / `newsgroup_taunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1335` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1336` Newsgroup Taunting / `newsgroupTaunting` -> `run_start_tax`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1342` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/turn/runner-main-actions.ts:1346` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/asset-node-effects.ts:7` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/public-payload-schema.ts:117` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/random-effects.ts:5` Quest for Cattekin / `questForCattekin` -> `persistentModifiers / start_turn_random_effect_table`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/random-effects.ts:14` Quest for Cattekin / `questForCattekin` -> `persistentModifiers / start_turn_random_effect_table`
- runtime_state_field_uses_card_name: `packages/shared/src/index.ts:1155` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/shared/src/index.ts:1199` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/shared/src/index.ts:1206` Siren / `siren` -> `start_run_redirect_to_source_fort`
- runtime_state_field_uses_card_name: `packages/shared/src/index.ts:1364` Bizarre Encryption Scheme / `bizarreEncryption` -> `runDurationEffects.access_replacement`
- runtime_state_field_uses_card_name: `packages/shared/src/index.ts:1410` Pirate Broadcast / `pirateBroadcast` -> `pendingSequences.multi_server_success_sequence`
- runtime_state_field_uses_card_name: `packages/shared/src/index.ts:1469` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:868` Corporate War / `corporate_war` -> `score_credit_swing_if_corp_credit_threshold_met`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:1524` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:3700` Shell Traders / `shell_traders` -> `delayed_install_sequence`

## Abstraktionsplan

| Priorität | Fundklasse | Zielbaustein | State-Ziel |
| --- | --- | --- | --- |
| slice_now | Preying Mantis | `optional_extra_action_with_delayed_damage` | `runnerTurnFlags.abilityUsedSourceIdsByLimitKey[limitKey]`, `runnerTurnFlags.delayedEndTurnEffects[]` |
| slice_done | Quest for Cattekin | `start_turn_random_effect_table` | `runnerTurnFlags.persistentModifiers[]` |
| deferred_refactor_required | Pirate Broadcast | `multi_server_success_sequence` | `runnerTurnFlags.pendingSequences[]` |
| deferred_refactor_required | Bizarre Encryption Scheme | `delayed_agenda_access_replacement` | `runDurationEffects[]`, `delayedAccessEffects[]` |
| slice_done | Code Viral Cache | `purge_replacement_with_runner_virus_counter_cleanup` | `replacementEffects[]` |
| slice_done | Startup Immolator | `trash_fully_broken_passed_ice` | `runnerTurnFlags.abilityUsedSourceIdsByLimitKey[limitKey]` |
| slice_done | Krumz | `recurring_trace_credit_pool` | `recurringCreditPools[]` |
| deferred_refactor_required | Siren | `start_run_redirect_to_source_fort` | `runStartInterventions[]` |
| deferred_refactor_required | Corporate War / Project Babylon | `score_credit_swing_if_corp_credit_threshold_met / overadvance_bonus_agenda_points` | `scoredAgendaAbilities[]` |

## Nächste Umsetzung

Der erste Code-Slice hat `Preying Mantis` refaktoriert, weil dort alle problematischen Ebenen in einem schmalen Pfad zusammenfallen: `kind`, Payload-Ability, Resolvername, Usage-State und Delayed-End-Turn-State.
Die Guard-Nachpflege, der `Quest for Cattekin`-Slice, die `Code Viral Cache`-Install-/Purge-/Corp-Trash-Slices sowie die kleinen `Krumz`- und `Startup Immolator`-Slices sind umgesetzt. `Pirate Broadcast`, `Bizarre Encryption Scheme` und `Siren` bleiben wegen Run-/Access-/Redirect-State eigene größere Prozesse.

## Automatisch abgeleiteter Guard

Der Derived-Guard erzeugt 1317 Tokens aus Kartentiteln und `cardDefinitionId`-Varianten und hält 5715 problemzonenrelevante Fingerprints als Baseline.
Die kompakte Fingerprint-Baseline dient nur als New-Leak-Detektor; das lesbare Review-Inventar bleibt die Known-Token-Fundliste unten.

| Kategorie | Anzahl |
| --- | ---: |
| new_unclassified_card_name_leak | 1303 |
| functional_kind_uses_card_name | 42 |
| runtime_state_field_uses_card_name | 4262 |
| resolver_function_uses_card_name | 106 |
| payload_key_uses_card_name | 2 |

## Erlaubte Referenzen

- `packages/engine/src/card-implementations/coverage.ts:182` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/coverage.ts:183` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/coverage.ts:196` Krumz / `krumz`
- `packages/engine/src/card-implementations/coverage.ts:197` Krumz / `krumz`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/disinfectant-inc.ts:5` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/disinfectant-inc.ts:6` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/krumz.ts:4` Krumz / `Krumz`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/krumz.ts:5` Krumz / `Krumz`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/krumz.ts:6` Krumz / `krumz`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/krumz.ts:7` Krumz / `krumz`
- `packages/engine/src/card-implementations/onr-v1/corp/assets/newsgroup-taunting.ts:5` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/onr-v1/corp/upgrades/bizarre-encryption-scheme.ts:5` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/onr-v1/runner/programs/startup-immolator.ts:5` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/onr-v1/runner/resources/preying-mantis.ts:5` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/onr-v1/runner/resources/quest-for-cattekin.ts:5` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:3` Siren / `Siren`
- `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:4` Siren / `Siren`
- `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:4` Siren / `Siren`
- `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:4` Siren / `Siren`
- `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:5` Siren / `Siren`
- `packages/engine/src/card-implementations/proteus/corp/assets/siren.ts:6` Siren / `siren`
- `packages/engine/src/card-implementations/proteus/runner/events/pirate-broadcast.ts:3` Pirate Broadcast / `pirateBroadcast`
- `packages/engine/src/card-implementations/registry.ts:52` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/registry.ts:52` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/registry.ts:63` Krumz / `krumz`
- `packages/engine/src/card-implementations/registry.ts:63` Krumz / `krumz`
- `packages/engine/src/card-implementations/registry.ts:65` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/registry.ts:171` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/registry.ts:334` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/registry.ts:365` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/registry.ts:366` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/registry.ts:396` Siren / `siren`
- `packages/engine/src/card-implementations/registry.ts:396` Siren / `Siren`
- `packages/engine/src/card-implementations/registry.ts:474` Pirate Broadcast / `pirateBroadcast`
- `packages/engine/src/card-implementations/registry.ts:648` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/registry.ts:679` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/registry.ts:680` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/registry.ts:793` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/registry.ts:804` Krumz / `krumz`
- `packages/engine/src/card-implementations/registry.ts:806` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/registry.ts:888` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/registry.ts:972` Siren / `Siren`
- `packages/engine/src/card-implementations/registry.ts:1004` Pirate Broadcast / `pirateBroadcast`
