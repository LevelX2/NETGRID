# Card Function Abstraction Review 2026-06-12

Status: inventory_with_vertical_slice

## Kurzbefund

Kartennamen sind in Katalog- und Testkontexten weiterhin zulässig. Problematisch sind kartenspezifische Namen in funktionalen `kind`-Werten, Payload-Keys, Runtime-State-Feldern, Resolvernamen und verhaltenssteuernden Konstanten.

Dieser Review ist ein Inventar mit erstem vertikalem Refactor-Slice, kein Abschlussbericht über vollständige Bereinigung. Der Preying-Mantis-Pfad ist generisch umgestellt; die übrigen Kandidaten bleiben sichtbar offen.

Der zugehörige Guard ist ein konservativer Baseline-/Inventory-Guard. Er blockiert Änderungen am geprüften Inventar und ergänzt eine automatisch aus dem Kartenkatalog abgeleitete New-Leak-Erkennung; er ersetzt weiterhin keine semantische Architekturprüfung für alle künftigen Mechaniken.

## Zählung

| Kategorie | Anzahl |
| --- | ---: |
| test_only_card_name | 46 |
| allowed_catalog_reference | 43 |
| runtime_state_field_uses_card_name | 7 |
| mechanics_constant_controls_behavior_by_card_id | 31 |
| false_positive | 22 |
| functional_kind_uses_card_name | 2 |

## Problemstellen

- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/runner-special-trigger-execution.ts:214` Shell Traders / `shell_traders` -> `delayed_install_sequence`
- runtime_state_field_uses_card_name: `packages/engine/src/game/abilities/runner-special-trigger-execution.ts:351` Shell Traders / `shell_traders` -> `delayed_install_sequence`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/access-flow-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:661` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:934` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/activated-card-runtime-hosts.ts:620` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/apply-action-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts:622` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-bootstrap.ts:659` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:620` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:643` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-strength-cost-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/choice-hidden-zone-resolvers.ts:643` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/corp-runtime-resolvers.ts:643` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/counter-turn-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/damage-trace-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/economy-runtime-services.ts:648` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/encounter-movement-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:663` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/install-rez-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/legal-action-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/lookup-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/play-board-runtime-hosts.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:661` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:1157` Social Engineering / `social_engineering` -> `secret_guess_run_effect`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/run-flow-runtime-hosts.ts:632` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/runtime-bootstrap-support.ts:662` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/scored-economy-runtime-hosts.ts:621` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-corp-runtime-resolvers.ts:648` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-runtime-bootstrap.ts:662` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/trigger-ability-runtime-hosts.ts:620` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/trigger-ability-runtime-hosts.ts:944` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:649` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:1184` Omniscience Foundation / `omniscience_foundation` -> `end_turn_tag_on_successful_run_condition`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/zone-runtime-services.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/asset-node-effects.ts:7` Disinfectant / `disinfectant` -> `counter_prevention_replacement`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/random-effects.ts:5` Quest for Cattekin / `questForCattekin` -> `persistentModifiers / start_turn_random_effect_table`
- runtime_state_field_uses_card_name: `packages/engine/src/mechanics/random-effects.ts:14` Quest for Cattekin / `questForCattekin` -> `persistentModifiers / start_turn_random_effect_table`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:1532` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:3711` Shell Traders / `shell_traders` -> `delayed_install_sequence`

## Abstraktionsplan

| Priorität | Fundklasse | Zielbaustein | State-Ziel |
| --- | --- | --- | --- |
| slice_now | Preying Mantis | `optional_extra_action_with_delayed_damage` | `runnerTurnFlags.abilityUsedSourceIdsByLimitKey[limitKey]`, `runnerTurnFlags.delayedEndTurnEffects[]` |
| slice_done | Quest for Cattekin | `start_turn_random_effect_table` | `runnerTurnFlags.persistentModifiers[]` |
| slice_done | Pirate Broadcast | `multi_server_success_sequence` | `runnerTurnFlags.pendingSequences[]` |
| slice_done | Bizarre Encryption Scheme | `delayed_agenda_access_replacement` | `runDurationEffects[]`, `delayedAccessEffects[]` |
| slice_done | Code Viral Cache | `purge_replacement_with_runner_virus_counter_cleanup` | `replacementEffects[]` |
| slice_done | Startup Immolator | `trash_fully_broken_passed_ice` | `runnerTurnFlags.abilityUsedSourceIdsByLimitKey[limitKey]` |
| slice_done | Krumz | `recurring_trace_credit_pool` | `recurringCreditPools[]` |
| slice_done | Siren | `start_run_redirect_to_source_fort` | `runStartInterventions[]` |
| slice_done | Corporate War / Project Babylon | `score_credit_swing_if_corp_credit_threshold_met / overadvance_bonus_agenda_points` | `scoredAgendaAbilities[]` |

## Nächste Umsetzung

Der erste Code-Slice hat `Preying Mantis` refaktoriert, weil dort alle problematischen Ebenen in einem schmalen Pfad zusammenfallen: `kind`, Payload-Ability, Resolvername, Usage-State und Delayed-End-Turn-State.
Die Guard-Nachpflege, der `Quest for Cattekin`-Slice, die `Code Viral Cache`-Install-/Purge-/Corp-Trash-Slices sowie die kleinen `Krumz`-, `Startup Immolator`-, `Siren`-, `Bizarre Encryption Scheme`- und `Pirate Broadcast`-Slices sind umgesetzt. Die uebrigen kartennamenspezifischen funktionalen Reststellen bleiben eigene Prozesse.

## Automatisch abgeleiteter Guard

Der Derived-Guard erzeugt 1317 Tokens aus Kartentiteln und `cardDefinitionId`-Varianten und hält 5553 problemzonenrelevante Fingerprints als Baseline.
Die kompakte Fingerprint-Baseline dient nur als New-Leak-Detektor; das lesbare Review-Inventar bleibt die Known-Token-Fundliste unten.

| Kategorie | Anzahl |
| --- | ---: |
| new_unclassified_card_name_leak | 1303 |
| functional_kind_uses_card_name | 42 |
| runtime_state_field_uses_card_name | 4106 |
| resolver_function_uses_card_name | 100 |
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
