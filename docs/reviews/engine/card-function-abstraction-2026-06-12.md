# Card Function Abstraction Review 2026-06-12

Status: inventory_with_vertical_slice

## Kurzbefund

Kartennamen sind in Katalog- und Testkontexten weiterhin zulässig. Problematisch sind kartenspezifische Namen in funktionalen `kind`-Werten, Payload-Keys, Runtime-State-Feldern, Resolvernamen und verhaltenssteuernden Konstanten.

Dieser Review ist ein Inventar mit erstem vertikalem Refactor-Slice, kein Abschlussbericht über vollständige Bereinigung. Der Preying-Mantis-Pfad ist generisch umgestellt; die übrigen Kandidaten bleiben sichtbar offen.

Der zugehörige Guard ist ein konservativer Baseline-/Inventory-Guard. Er blockiert Änderungen am geprüften Inventar und ergänzt eine automatisch aus dem Kartenkatalog abgeleitete New-Leak-Erkennung; er ersetzt weiterhin keine semantische Architekturprüfung für alle künftigen Mechaniken.

## Zählung

| Kategorie | Anzahl |
| --- | ---: |
| allowed_catalog_reference | 43 |
| test_only_card_name | 45 |
| mechanics_constant_controls_behavior_by_card_id | 28 |
| false_positive | 2 |

## Problemstellen

- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/access-flow-runtime-hosts.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:621` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/activated-card-runtime-hosts.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/apply-action-runtime-hosts.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts:615` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-bootstrap.ts:619` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:608` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:613` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-strength-cost-runtime-services.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/choice-hidden-zone-resolvers.ts:610` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/corp-runtime-resolvers.ts:615` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/counter-turn-runtime-services.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/damage-trace-runtime-hosts.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/economy-runtime-services.ts:616` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/encounter-movement-runtime-hosts.ts:608` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:621` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/install-rez-runtime-hosts.ts:607` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/legal-action-runtime-hosts.ts:608` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/lookup-runtime-services.ts:606` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/play-board-runtime-hosts.ts:608` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:622` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/run-flow-runtime-hosts.ts:600` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/runtime-bootstrap-support.ts:625` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/scored-economy-runtime-hosts.ts:614` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-corp-runtime-resolvers.ts:616` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-runtime-bootstrap.ts:628` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/trigger-ability-runtime-hosts.ts:608` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/zone-runtime-services.ts:608` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`

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

Der Derived-Guard erzeugt 1317 Tokens aus Kartentiteln und `cardDefinitionId`-Varianten und hält 72 problemzonenrelevante Fingerprints als Baseline.
Die kompakte Fingerprint-Baseline dient nur als New-Leak-Detektor; das lesbare Review-Inventar bleibt die Known-Token-Fundliste unten.

| Kategorie | Anzahl |
| --- | ---: |
| new_unclassified_card_name_leak | 72 |

## Erlaubte Referenzen

- `packages/engine/src/card-implementations/coverage-source-locations.ts:81` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/coverage-source-locations.ts:82` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/coverage-source-locations.ts:95` Krumz / `krumz`
- `packages/engine/src/card-implementations/coverage-source-locations.ts:96` Krumz / `krumz`
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
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-acme-savings-and-loan-to-information-laundering.ts:13` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-acme-savings-and-loan-to-information-laundering.ts:13` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-acme-savings-and-loan-to-information-laundering.ts:36` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-i-got-a-rock-to-south-african-mining-corp.ts:4` Krumz / `krumz`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-i-got-a-rock-to-south-african-mining-corp.ts:4` Krumz / `krumz`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-i-got-a-rock-to-south-african-mining-corp.ts:6` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-i-got-a-rock-to-south-african-mining-corp.ts:27` Krumz / `krumz`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-asset-i-got-a-rock-to-south-african-mining-corp.ts:29` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-upgrade-aardvark-to-roving-submarine.ts:4` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/subregistries/onr-v1-corp-upgrade-aardvark-to-roving-submarine.ts:27` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/subregistries/onr-v1-runner-program-shield-to-zetatech-software-installer.ts:9` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/subregistries/onr-v1-runner-program-shield-to-zetatech-software-installer.ts:27` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/subregistries/onr-v1-runner-resource-loan-from-chiba-to-umbrella-policy.ts:5` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/subregistries/onr-v1-runner-resource-loan-from-chiba-to-umbrella-policy.ts:6` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/subregistries/onr-v1-runner-resource-loan-from-chiba-to-umbrella-policy.ts:28` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/subregistries/onr-v1-runner-resource-loan-from-chiba-to-umbrella-policy.ts:29` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/subregistries/proteus-corp-asset-implementations.ts:7` Siren / `siren`
- `packages/engine/src/card-implementations/subregistries/proteus-corp-asset-implementations.ts:7` Siren / `Siren`
- `packages/engine/src/card-implementations/subregistries/proteus-corp-asset-implementations.ts:20` Siren / `Siren`
- `packages/engine/src/card-implementations/subregistries/proteus-runner-event-faked-hit-to-remote-detonator.ts:17` Pirate Broadcast / `pirateBroadcast`
- `packages/engine/src/card-implementations/subregistries/proteus-runner-event-faked-hit-to-remote-detonator.ts:40` Pirate Broadcast / `pirateBroadcast`
