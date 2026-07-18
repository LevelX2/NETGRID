# Action Semantic Signal Catalog Gate 2026-06-12

Diagnosebericht fuer aktive Karten. Der Bericht nutzt Active Hints, Compiled Hints, den Hint-Inspector-Index und den Tactic-Signal-Katalog.

Keine Runtime-Anbindung, keine Action-Auswahl, kein Scoring und keine Hidden-Info-Projektion.

`ai_supported` bezeichnet nur die technische KI-Deckzulassung. Semantische Abdeckung und Play-Strength-Readiness bleiben getrennte Gates und erfordern Strategie-, Szenario-, Benchmark- und Runtime-Evidence.

## Summary

| Metric                                                         | Count |
| -------------------------------------------------------------- | ----: |
| Active cards                                                   |   618 |
| covered                                                        |   599 |
| deferred                                                       |     0 |
| no_signal_reason != none                                       |    19 |
| target_profile_gap                                             |     0 |
| structural signal violations                                   |     0 |
| unknown signals                                                |     0 |
| covered delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE            |   +60 |
| deferred delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE           |   -45 |
| no_signal delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE          |    -6 |
| target_profile_gap delta vs P2_POST_TARGET_PROFILE_GAP_CLOSURE |   -84 |

## No Signal Reasons

| no_signal_reason       | Cards |
| ---------------------- | ----: |
| `none`                 |   599 |
| `legacy_fallback_only` |    15 |
| `no_function_signal`   |     4 |

## Target Profile Gaps

| Card | Side | Type | Signals expecting targets |
| ---- | ---- | ---- | ------------------------- |
| none | -    | -    | -                         |

## No Signal Review Start

| Card                                | Side   | Type     | Reason                 |
| ----------------------------------- | ------ | -------- | ---------------------- |
| `corp_identity_001`                 | corp   | identity | `legacy_fallback_only` |
| `onr_proteus_074_siren`             | corp   | asset    | `no_function_signal`   |
| `onr_v1_083_desperate-competitor`   | runner | event    | `no_function_signal`   |
| `onr_v1_090_hot-tip-for-wns`        | runner | event    | `no_function_signal`   |
| `onr_v1_173_restrictive-net-zoning` | runner | resource | `no_function_signal`   |
| `onr_v1_220_tycho-extension`        | corp   | agenda   | `legacy_fallback_only` |
| `runner_identity_001`               | runner | identity | `legacy_fallback_only` |
| `simple_agenda`                     | corp   | agenda   | `legacy_fallback_only` |
| `simple_draw_event`                 | runner | event    | `legacy_fallback_only` |
| `simple_economy_event`              | runner | event    | `legacy_fallback_only` |
| `simple_priority_agenda`            | corp   | agenda   | `legacy_fallback_only` |
| `simple_run_event`                  | runner | event    | `legacy_fallback_only` |
| `simple_setup_hardware`             | runner | hardware | `legacy_fallback_only` |
| `simple_upgrade`                    | corp   | upgrade  | `legacy_fallback_only` |
| `v08_burst_credit_event`            | runner | event    | `legacy_fallback_only` |
| `v08_deep_draw_event`               | runner | event    | `legacy_fallback_only` |
| `v08_memory_chip`                   | runner | hardware | `legacy_fallback_only` |
| `v08_overclock_run_event`           | runner | event    | `legacy_fallback_only` |
| `v08_project_agenda`                | corp   | agenda   | `legacy_fallback_only` |

## Deferred Review Scope

| Scope | Cards |
| ----- | ----: |
| none  |     0 |

## Row Contract

Every JSON row contains `covered`, `deferred`, `deferred_review_scope`, `deferred_owner`, `no_signal_reason` and `target_profile_gap`.
