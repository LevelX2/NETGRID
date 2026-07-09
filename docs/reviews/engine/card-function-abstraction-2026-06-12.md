# Card Function Abstraction Review 2026-06-12

Status: inventory_with_vertical_slice

## Kurzbefund

Kartennamen sind in Katalog- und Testkontexten weiterhin zulässig. Problematisch sind kartenspezifische Namen in funktionalen `kind`-Werten, Payload-Keys, Runtime-State-Feldern, Resolvernamen und verhaltenssteuernden Konstanten.

Dieser Review ist ein Inventar mit erstem vertikalem Refactor-Slice, kein Abschlussbericht über vollständige Bereinigung. Der Preying-Mantis-Pfad ist generisch umgestellt; die übrigen Kandidaten bleiben sichtbar offen.

Der zugehörige Guard ist ein konservativer Baseline-/Inventory-Guard. Er blockiert Änderungen am geprüften Inventar und ergänzt eine automatisch aus dem Kartenkatalog abgeleitete New-Leak-Erkennung; er ersetzt weiterhin keine semantische Architekturprüfung für alle künftigen Mechaniken.

## Zählung

| Kategorie | Anzahl |
| --- | ---: |
| test_only_card_name | 45 |
| allowed_catalog_reference | 43 |
| mechanics_constant_controls_behavior_by_card_id | 29 |
| functional_kind_uses_card_name | 2 |
| false_positive | 14 |

## Problemstellen

- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/access-flow-runtime-hosts.ts:629` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/action-runtime-bootstrap.ts:651` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/activated-card-runtime-hosts.ts:610` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/apply-action-runtime-hosts.ts:610` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts:615` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-bootstrap.ts:641` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-deps-hosts.ts:609` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-runtime-resolvers.ts:615` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/card-strength-cost-runtime-services.ts:610` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/choice-hidden-zone-resolvers.ts:632` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/corp-runtime-resolvers.ts:614` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/counter-turn-runtime-services.ts:610` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/damage-trace-runtime-hosts.ts:629` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/economy-runtime-services.ts:619` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/encounter-movement-runtime-hosts.ts:612` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/flow-runtime-bootstrap.ts:653` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/install-rez-runtime-hosts.ts:629` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/legal-action-runtime-hosts.ts:610` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/lookup-runtime-services.ts:628` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/play-board-runtime-hosts.ts:611` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts:651` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/run-flow-runtime-hosts.ts:603` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/runtime-bootstrap-support.ts:656` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/scored-economy-runtime-hosts.ts:611` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-corp-runtime-resolvers.ts:638` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/state-runtime-bootstrap.ts:658` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/trigger-ability-runtime-hosts.ts:611` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts:639` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- mechanics_constant_controls_behavior_by_card_id: `packages/engine/src/game/engine-runtime-internal/zone-runtime-services.ts:630` Code Viral Cache / `CODE_VIRAL_CACHE` -> `purge_replacement_with_runner_virus_counter_cleanup`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:1533` Silver Lining Recovery Protocol / `silver_lining` -> `recovery_protocol_after_runner_action`
- functional_kind_uses_card_name: `scripts/check-ai-derived-facts.mjs:3722` Shell Traders / `shell_traders` -> `delayed_install_sequence`

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

Der Derived-Guard erzeugt 1317 Tokens aus Kartentiteln und `cardDefinitionId`-Varianten und hält 142 problemzonenrelevante Fingerprints als Baseline.
Die kompakte Fingerprint-Baseline dient nur als New-Leak-Detektor; das lesbare Review-Inventar bleibt die Known-Token-Fundliste unten.

| Kategorie | Anzahl |
| --- | ---: |
| runtime_state_field_uses_card_name | 2 |
| new_unclassified_card_name_leak | 133 |
| functional_kind_uses_card_name | 7 |

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
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-006.ts:11` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-006.ts:33` Startup Immolator / `startupImmolator`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-008.ts:2` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-008.ts:3` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-008.ts:24` Preying Mantis / `preyingMantis`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-008.ts:25` Quest for Cattekin / `questForCattekin`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-013.ts:16` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-013.ts:16` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-013.ts:38` Disinfectant / `disinfectant`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-014.ts:7` Krumz / `krumz`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-014.ts:7` Krumz / `krumz`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-014.ts:9` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-014.ts:29` Krumz / `krumz`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-014.ts:31` Newsgroup Taunting / `newsgroupTaunting`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-018.ts:11` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-018.ts:33` Bizarre Encryption Scheme / `bizarreEncryption`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-022.ts:15` Siren / `siren`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-022.ts:15` Siren / `Siren`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-022.ts:37` Siren / `Siren`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-024.ts:7` Pirate Broadcast / `pirateBroadcast`
- `packages/engine/src/card-implementations/subregistries/card-implementation-group-024.ts:29` Pirate Broadcast / `pirateBroadcast`
