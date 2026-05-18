# Playable Card Slice 0.8 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Scope

Der V0.8-Slice besteht aus 14 lokalen Originalkarten. Alle Namen, Texte und Rollen sind projektintern und fiktiv. Der Slice nutzt nur vorhandene oder eng erweiterte MVP-0.4-Mechaniken:

- Runner Events: Credits, Draw, Run mit Erfolgsbonus.
- Runner Rig: Hardware mit Memory-Erhöhung, Fracter, Decoder, Killer.
- Corp Operations: Credits, Draw.
- Corp Board: Agenda, Asset, Barrier ICE, Code Gate ICE, Sentry ICE mit Tag.

## Neue spielbare Karten

| Karte | Side | Typ | Resolver | Rollen | Szenario |
|---|---|---|---|---|---|
| `v08_burst_credit_event` | runner | event | `runner_event_gain_credits_6` | `economy`, `tempo` | SCN-V08-001 |
| `v08_deep_draw_event` | runner | event | `runner_event_draw_3` | `draw`, `setup` | SCN-V08-001 |
| `v08_overclock_run_event` | runner | event | `runner_event_run_success_3` | `run_pressure`, `economy` | SCN-V08-002 |
| `v08_memory_chip` | runner | hardware | `runner_install_memory_plus_1` | `memory`, `setup` | SCN-V08-001 |
| `v08_steady_fracter` | runner | program | `runner_breaker_fracter` | `breaker_fracter` | SCN-V08-002 |
| `v08_precise_decoder` | runner | program | `runner_breaker_decoder` | `breaker_decoder` | SCN-V08-002 |
| `v08_adaptive_killer` | runner | program | `runner_breaker_killer` | `breaker_killer` | SCN-V08-002 |
| `v08_credit_surge_operation` | corp | operation | `corp_operation_gain_credits_7` | `economy`, `tempo` | SCN-V08-003 |
| `v08_archive_planning_operation` | corp | operation | `corp_operation_draw_3` | `draw`, `setup` | SCN-V08-003 |
| `v08_project_agenda` | corp | agenda | `corp_agenda_3_2` | `agenda_2pt`, `score_plan` | SCN-V08-003 |
| `v08_cashout_asset` | corp | asset | `corp_asset_rez_gain_4` | `asset_economy`, `trash_target` | SCN-V08-003 |
| `v08_wall_ice` | corp | ice | `corp_ice_barrier_etr` | `defensive_ice`, `barrier` | SCN-V08-004 |
| `v08_gate_ice` | corp | ice | `corp_ice_code_gate_tax_etr` | `taxing_ice`, `code_gate` | SCN-V08-004 |
| `v08_watchdog_ice` | corp | ice | `corp_ice_sentry_tag_etr` | `tag_ice`, `sentry` | SCN-V08-004 |

## Zurückgestellte Mechaniken

| Mechanik | Status | Grund |
|---|---|---|
| Damage | deferred | benötigt RandomDrawRecords, Undo-Barriere und eigene Visibility-Gates. |
| Resources | deferred | neuer Kartentyp und dauerhafte Boardregeln. |
| Traces | deferred | benötigt Choice-/Bid-Sequenz und Replay-Modell. |
| Identitätsfähigkeiten | deferred | dauerhafte passive oder ausgelöste Effekte. |
| Multiaccess | deferred | komplexere Access-Sequenz und Hidden-Info-Risiko. |
| Hosting, Viren | deferred | neue Objektbeziehungen und Counter. |
| Prevention/Replacement | deferred | neue Resolver-Pipeline. |

## Decks

V0.8 verwendet zwei kuratierte Snapshots:

- `demo_runner_008_snapshot_v0_8`
- `demo_corp_008_snapshot_v0_8`

Public Metadata bleibt auf Side, Identity, Deckname, Kartenpool, Formatprofil und DeckHash begrenzt. Gegnerische Decklisten bleiben privat.
