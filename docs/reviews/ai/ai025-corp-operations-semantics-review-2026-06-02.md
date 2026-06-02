# AI025 Corp Operations Semantics Review

## Kurzfazit

AI025 prüft 40 aktive/compiled Corp-Operations aus der Repo-Wahrheit. Davon sind 27 Originalset-Operations und 8 Proteus-Operations; zusätzlich bleiben 5 aktive Test-/V08-Operations vollständig abgedeckt. Operation-Typen und Subtypen wie Transactions, Gray Ops und Black Ops bleiben Kartendaten und werden nicht als Taktiksignale gespiegelt.

## Inventar

- Originalset: 27 aktive/compiled Corp-Operations; Spoiler-Erwartung 27.
- Proteus: 8 aktive/compiled Corp-Operations; Spoiler-Erwartung 8.
- Test/V08: 5 aktive/compiled Repo-Operations; als Repo-Wahrheit mitgeprüft.
- Classic: 4 bekannte inaktive Corp-Operations im Repo.

## Clusterübersicht

- advancement: 5
- agenda_stolen_recovery: 1
- archives_recovery: 2
- draw: 2
- economy: 5
- economy_draw: 2
- extra_actions: 1
- future_extra_actions: 1
- hardware_trash: 1
- ice_rearrange_conceal: 1
- ice_rez_tempo: 2
- install_only_actions: 1
- resource_trash: 1
- rnd_topdeck_setup: 1
- tag_snowball_followup: 1
- tag_source: 3
- tagged_meat_damage: 3
- tagged_runner_payoff: 3
- trace_tag_source: 4

## Neue und wiederverwendete Taktiksignale

AI025 ergänzt 22 kontrollierte Corp-side Funktionssignale. Wiederverwendet werden `tag.source`, `tag.payoff`, `trace.source`, `damage.payoff` und `risk.requires_tagged_runner`, wenn SideScope und Wirkung passen.

- `economy.corp_credit_burst`: supportOnly=true, mayAnchor=false, anchors=none
- `economy.corp_conditional_credit`: supportOnly=true, mayAnchor=false, anchors=none
- `economy.corp_draw`: supportOnly=true, mayAnchor=false, anchors=none
- `action.corp_extra_action_support`: supportOnly=true, mayAnchor=false, anchors=none
- `action.corp_future_extra_action`: supportOnly=true, mayAnchor=false, anchors=none
- `action.corp_install_action_bundle`: supportOnly=true, mayAnchor=false, anchors=none
- `advance.agenda_counter`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance
- `advance.overadvance_support`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance
- `advance.score_window_support`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance
- `hardware.trash_payoff`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `resource.trash_payoff`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `ice.corp_free_rez`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier, corp.remote_scoring
- `ice.corp_temporary_rez`: supportOnly=true, mayAnchor=false, anchors=none
- `ice.corp_deferred_rez`: supportOnly=true, mayAnchor=false, anchors=none
- `ice.corp_rearrange_conceal`: supportOnly=true, mayAnchor=false, anchors=none
- `archives.corp_recovery`: supportOnly=true, mayAnchor=false, anchors=none
- `rnd.corp_topdeck_reorder`: supportOnly=true, mayAnchor=false, anchors=none
- `rnd.corp_topdeck_setup`: supportOnly=true, mayAnchor=false, anchors=none
- `condition.last_turn_run`: supportOnly=true, mayAnchor=false, anchors=none
- `condition.agenda_stolen_last_turn`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.agenda_forfeit_drawback`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.temporary_rez_liability`: supportOnly=true, mayAnchor=false, anchors=none

## Vermiedene Typ-/Subtyp-Signale

Nicht eingeführt wurden: `corp.black_ops`, `corp.gray_ops`, `corp.operation`, `corp.operation_damage`, `corp.operation_economy`, `corp.operation_tag`, `corp.transactions`, `corp_op.damage`, `corp_op.economy`, `operation.black_ops`, `operation.gray_ops`, `operation.management_shakeup`, `operation.power_grid`, `operation.power_grid_overload`, `operation.scorched_earth`, `operation.transaction`, `operation.transactions`.

## Strategieentscheidungen

Einfache Economy-, Draw-, Recovery-, R&D-Reorder-, Extra-Action- und ICE-Rez-Supportkarten erhalten keinen Strategieanker ohne explizite Decklinie. Advancement-Operations ankern `corp.fast_advance`; Tag-Quellen ankern als Enabler, nicht als Payoff; Tagged Runner Payoffs und tagged Meat-Damage-Kill-Karten trennen `corp.tag_trace_punish` und `corp.damage_kill`.

- Audit of Call Records: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Chance Observation: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Closed Accounts: `corp.tag_trace_punish` -> `tag_payoff` (high)
- Corporate Detective Agency: `corp.tag_trace_punish` -> `resource_payoff` (high)
- Datapool by Zetatech: `corp.tag_trace_punish` -> `tag_payoff` (medium)
- Falsified-Transactions Expert: `corp.fast_advance` -> `fast_advance_enabler` (medium)
- Management Shake-Up: `corp.fast_advance` -> `fast_advance_enabler` (high)
- Netwatch Credit Voucher: `corp.tag_trace_punish` -> `tag_snowball_followup` (medium)
- Power Grid Overload: `corp.tag_trace_punish` -> `hardware_payoff` (high)
- Project Consultants: `corp.fast_advance` -> `fast_advance_enabler` (high)
- Punitive Counterstrike: `corp.damage_kill` -> `tagged_minor_damage_payoff` (medium)
- Punitive Counterstrike: `corp.tag_trace_punish` -> `tag_payoff` (high)
- Scorched Earth: `corp.damage_kill` -> `tagged_damage_payoff` (high)
- Scorched Earth: `corp.tag_trace_punish` -> `tag_payoff` (high)
- Systematic Layoffs: `corp.fast_advance` -> `fast_advance_enabler` (high)
- Team Restructuring: `corp.fast_advance` -> `fast_advance_enabler` (medium)
- Trojan Horse: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Urban Renewal: `corp.damage_kill` -> `tagged_damage_payoff` (high)
- Urban Renewal: `corp.tag_trace_punish` -> `tag_payoff` (high)
- Data Sifters: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Emergency Rig: `corp.ice_tax_glacier` -> `free_rez_enabler` (medium)
- Manhunt: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Schlaghund Pointers: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Underworld Mole: `corp.tag_trace_punish` -> `tag_source_enabler` (medium)
- Simple Tag Punishment Operation: `corp.tag_trace_punish` -> `tag_payoff` (medium)

## TargetProfile-Kandidaten

- Corporate Detective Agency: candidate (use_target:installed_resource)
- Edgerunner, Inc., Temps: schema_gap (multi_install_action_bundle)
- Falsified-Transactions Expert: candidate (use_target:installed_agenda_or_score_window)
- Management Shake-Up: candidate (use_target:installed_agenda_or_overadvance_card)
- New Blood: schema_gap (private_ice_rearrange_or_conceal)
- Off-Site Backups: schema_gap (private_archives_recovery_choice)
- Planning Consultants: schema_gap (private_rnd_top5_reorder)
- Power Grid Overload: candidate (use_target:installed_hardware)
- Project Consultants: candidate (use_target:installed_agenda_or_overadvance_card)
- Systematic Layoffs: candidate (use_target:installed_agenda_or_overadvance_card)
- Team Restructuring: candidate (use_target:installed_agenda_or_score_window)
- Corporate Guard(R) Temps: schema_gap (x_value_future_turns_and_forfeit_drawback)
- Emergency Rig: candidate (use_target:installed_ice_rez_choice)
- Rent-to-Own Contract: candidate (use_target:installed_ice_deferred_rez_choice)
- Archive Planning Operation: schema_gap (private_archives_or_hq_choice)

## Hidden-Info-Grenzen

Operations sind grundsätzlich public when played. Private Corp-Entscheidungen wie R&D-Reorder, Archives-Recovery, ICE-Rearrange/Conceal und X-value/future-action choices bleiben bis zur legalen Auflösung Corp-side. AI025 ergänzt keine Runner-seitige verdeckte Operation-Semantik und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Deferred Items

- target_profile_v1_for_operations: deferred_or_schema_gap. Multi-step installs, score-window advancement, R&D topdeck reorder, hidden Archives recovery, ICE rearrange/conceal and X-value future-action choices remain report-only until side-safe TargetProfile schema support exists.
- corp_tempo_strategy: deferred. Extra actions and install bundles receive function signals, but no new generic Corp tempo or operation strategy is introduced in AI025.

## Post-Review-Liste

Die vollständige Kartenliste mit Funktionsfamilie, Conditions, Risiken, Taktiksignalen, Strategieankern, `strategySupportPairs`, TargetProfile-Status und Hidden-Info-Policy steht im JSON-Report `ai025-corp-operations-semantics-review-report-2026-06-02.json`.
