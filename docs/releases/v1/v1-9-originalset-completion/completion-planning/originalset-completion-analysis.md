# V1.9.10 bis V1.9.xx Originalset Completion Analysis

Status: Planungsartefakt, keine Codeimplementierung
Stand: 2026-05-12
Primärer Agent: release-planning-agent

## Zweck

Dieses Dokument rekonstruiert den Kartenstand nach V1.9.9 und schneidet die restliche Human- und KI-Spielbarkeit des lokalen alten O:NR-v1-Originalsets in V1.9.10+-Gates. Die lokalen Kartentexte wurden gelesen und haben vollständig den Status `user_confirmed_clean_text`; die Planung verwendet daraus abgeleitete Mechanik- und Regelkern-Aussagen, nicht automatische Textparser.

## Ausgewertete Quellen

- `AGENTS.md`
- `AGENTS.local.md`
- `agents/release-planning-agent.md`
- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-9-pre-sprint/final-review.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-5-to-v1-9-8-deferred-sprint/deferred-register.md`
- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
- `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`
- `data/local/card-import/onr-v1-limited/catalog-index-onr-v1-limited.local.json`
- `data/local/card-import/onr-v1-limited/onr-v1-basisset-mechanics-release-matrix.local.csv`
- `data/local/card-import/onr-v1-limited/onr-v1-open-card-review.local.csv`
- `data/manifests/card-implementation-manifest*.json`
- `data/manifests/deck-legal-ai-approval*.json`
- `data/rules/mechanics-coverage*.json`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/index.test.ts`
- `packages/engine/src/index.ts`

## Ausgangslage nach V1.9.9

| Kennzahl | Wert | Einordnung |
| --- | ---: | --- |
| Gesamtzahl alter Originalset-Karten im lokalen Bestand | 374 | Snapshot `onr-v1-limited` |
| Karten mit lokal bestätigtem sauberem Text | 374 | Grundlage der Analyse |
| Bereits human_playable und deck_legal nach Runtime-Gate | 143 | `ONR_V1_RUNTIME_RELEASE_CARD_IDS` und Katalogtests |
| Bereits ai_supported | 143 | Deck-Legal-AI-Manifeste und Tests |
| Human/deck, aber nicht ai_supported | 0 | Nach V1.9.9 keine bekannte Lücke |
| Nicht human_playable/deck_legal | 231 | Zielmenge V1.9.11 bis V1.9.22 |
| Rohsnapshot playable/deck_legal | 49 | Stale Statusquelle, Textquelle bleibt gültig |

## Statuskategorien

| Kategorie | Karten | Bedeutung |
| --- | ---: | --- |
| Erledigt | 140 | Vollständig human/deck/KI und über Implementierungs- oder Core-Manifest belegbar |
| Statuskonflikt | 3 | Runtime/AI/Test vollständig, aber Manifest-/Narrativdrift muss vor V2.x repariert werden |
| V1.9.10+ geplant | 231 | Noch nicht human_playable/deck_legal/ai_supported |
| Deferred/blockiert | 0 | Kein aktueller Text-/Rechts-/Assetblocker im lokalen bestätigten Bestand |

## Statusdrift

| Drift | Befund | Auswirkung | Removal Condition |
| --- | --- | --- | --- |
| Snapshot vs Runtime | Snapshotstatus markiert nur 49 Karten als playable/deck_legal, Runtime-Gate führt 143. | Snapshotstatus ist nachgeordnet. | V1.9.10 dokumentiert oder erzeugt ein aktuelles Runtime-Status-Artefakt. |
| Katalogindex | `catalog-index-onr-v1-limited.local.json` ist ungültiges JSON, weil ein `@@`-Patchmarker enthalten ist. | Nicht als Statusquelle verwendbar. | V1.9.10 repariert/regeneriert und validiert JSON. |
| Manifest vs Runtime/AI | Fetch 4.0.1, Hunter und Trojan Horse sind Runtime/AI/Test-vollständig, fehlen aber in der card-implementation-Manifestspur. | Completion-Ledger ist offen. | V1.9.10 ergänzt eindeutige Manifest-/Review-Referenz. |
| Statusnarrativ | Ältere Statusstellen nennen V1.2.3 mit acht Karten, Runtime/Test führt elf. | Dokumentationsdrift. | V1.9.10 harmonisiert die Zählung. |

## Release-Schnittübersicht

| Release | Zielbild | Karten/Driftpunkte |
| --- | --- | ---: |
| V1.9.10 | Status-, Manifest- und Katalog-Konsolidierung | 3 |
| V1.9.11 | Hidden-Zone Search, Reveal, Reorder und Shuffle | 16 |
| V1.9.12 | Counter, Virus, Purge und Recurring Pools | 11 |
| V1.9.13 | Damage, Prevention, Avoid und Replacement Longtail | 17 |
| V1.9.14 | Trace, Link, Tags und Resource-Tag-Interaktionen | 25 |
| V1.9.15 | Run Flow, Access, Multiaccess und Ambush on Access | 14 |
| V1.9.16 | Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy | 16 |
| V1.9.17 | Generische Asset/Node-Fähigkeiten | 18 |
| V1.9.18 | Generische Upgrade-, Root-, Grid- und Server-Fähigkeiten | 15 |
| V1.9.19 | Agenda Difficulty, Scored Agenda Abilities und Overadvance | 20 |
| V1.9.20 | Globale Modifier, Handgröße, Action Economy und persistente Sonderzustände | 26 |
| V1.9.21 | Deterministischer Zufall und Würfelkarten | 6 |
| V1.9.22 | Per-card Resolver Longtail und Originalset Completion Gate | 47 |

## Funktionale Cluster

| Cluster | Erwähnungen in offenen Karten | Zielrelease | Resolverfamilie |
| --- | ---: | --- | --- |
| Per-card Resolver/Test Gate | 47 | V1.9.22 | `per_card_longtail_resolver_gate` |
| Hidden-Zone Search/Reveal/Reorder/Shuffle | 46 | V1.9.11 | `hidden_zone_search_reveal_reorder_resolver` |
| Generische Asset/Node-Fähigkeiten | 42 | V1.9.17 | `generic_asset_node_ability_resolver` |
| Counter/Virus/Purge | 40 | V1.9.12 | `typed_counter_virus_purge_resolver` |
| Damage/Flatline | 32 | V1.9.13 | `damage_event_prevention_resolver` |
| Trace/Link/Base-Link | 30 | V1.9.14 | `trace_link_bid_window_resolver` |
| Prevention/Avoid/Replacement | 29 | V1.9.13 | `event_modification_prevention_avoid_resolver` |
| Persistente Sonderzustände | 23 | V1.9.20 | `persistent_special_state_resolver` |
| Scored Agenda Static/Active/Overadvance | 23 | V1.9.19 | `scored_agenda_static_active_resolver` |
| Agenda Difficulty/Overadvance | 23 | V1.9.19 | `agenda_difficulty_overadvance_resolver` |
| Recurring/Start-of-turn Pools | 20 | V1.9.12 | `recurring_pool_start_turn_resolver` |
| Generische Upgrade/Root/Grid-Fähigkeiten | 20 | V1.9.18 | `generic_upgrade_root_server_resolver` |
| Run Flow/Run Locks | 18 | V1.9.15 | `run_flow_lock_resolver` |
| Access/Breach/Multiaccess | 18 | V1.9.15 | `access_breach_multiaccess_resolver` |
| Program Subtypes/Daemon/Stealth/Worm/Base-Link | 16 | V1.9.16 | `program_subtype_daemon_stealth_worm_resolver` |
| Handsize/Action Economy Modifier | 15 | V1.9.20 | `action_economy_handsize_modifier_resolver` |
| Globale ICE-/Kosten-/Stärke-Modifier | 14 | V1.9.20 | `global_static_modifier_layer_resolver` |
| Tag Avoid/Remove/Bedingungen | 12 | V1.9.14 | `tag_condition_avoid_remove_resolver` |
| Ambush on Access | 10 | V1.9.15 | `access_ambush_resolver` |
| Hosting/Hosted Lifecycles | 8 | V1.9.16 | `hosting_hosted_lifecycle_resolver` |
| Resource/Tag Interaction | 8 | V1.9.14 | `resource_tag_interaction_resolver` |
| Deterministischer Würfel/Zufall | 6 | V1.9.21 | `deterministic_random_card_resolver` |
| Core/Brain Damage Longtail | 6 | V1.9.13 | `core_brain_damage_modifier_resolver` |
| Uninstall/Destroy Installed Cards | 4 | V1.9.16 | `installed_card_destroy_uninstall_resolver` |

## Deferred-/Blocker-Register

| Priorität | Punkt | Status | Removal Condition |
| --- | --- | --- | --- |
| P0 | V2.x bleibt blockiert, solange die 231 offenen Karten nicht vollständig erledigt oder sauber blockiert sind. | offen | V1.9.22 Completion-Review ist grün. |
| P0 | Katalogindex ist invalides JSON. | offen | V1.9.10 JSON-Validation grün. |
| P0 | Drei Runtime-/AI-Karten ohne Manifestparität. | offen | V1.9.10 ergänzt Fetch 4.0.1, Hunter, Trojan Horse in der Implementation-Referenz. |
| P1 | 47 L1B-Longtailkarten brauchen per-card Adapter. | geplant | V1.9.22 liefert Adapter oder Blocker mit Removal Condition. |
