# Card Function Abstraction Review 2026-06-12

Status: inventory_with_vertical_slice

## Kurzbefund

Kartennamen sind in Katalog- und Testkontexten weiterhin zulässig. Problematisch sind kartenspezifische Namen in funktionalen `kind`-Werten, Payload-Keys, Runtime-State-Feldern, Resolvernamen und verhaltenssteuernden Konstanten.

Dieser Review ist ein Inventar mit erstem vertikalem Refactor-Slice, kein Abschlussbericht über vollständige Bereinigung. Der Preying-Mantis-Pfad ist generisch umgestellt; die übrigen Kandidaten bleiben sichtbar offen.

Der zugehörige Guard ist ein konservativer Baseline-/Inventory-Guard. Er blockiert Änderungen am geprüften Inventar und ergänzt eine automatisch aus dem Kartenkatalog abgeleitete New-Leak-Erkennung; er ersetzt weiterhin keine semantische Architekturprüfung für alle künftigen Mechaniken.

## Zählung

| Kategorie | Anzahl |
| --- | ---: |
| test_only_card_name | 37 |
| false_positive | 2 |

## Problemstellen


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

Der Derived-Guard erzeugt 1891 Tokens aus Kartentiteln und `cardDefinitionId`-Varianten und hält 353 problemzonenrelevante Fingerprints als Baseline.
Die kompakte Fingerprint-Baseline dient nur als New-Leak-Detektor; das lesbare Review-Inventar bleibt die Known-Token-Fundliste unten.

| Kategorie | Anzahl |
| --- | ---: |
| new_unclassified_card_name_leak | 183 |
| runtime_state_field_uses_card_name | 156 |
| resolver_function_uses_card_name | 10 |
| functional_kind_uses_card_name | 4 |

## Erlaubte Referenzen
