# AI026 Corp Nodes / Assets Semantics Review

## Kurzfazit

AI026 prüft 54 aktive/compiled Corp-Nodes/Assets aus der Repo-Wahrheit. Davon sind 41 Originalset-Karten und 11 Proteus-Karten; zusätzlich bleiben 2 aktive Test-/V08-Assets abgedeckt. Node-/Asset-Typen und Subtypen wie AI, Ambush, Advertisement, Transactions, Virus und Random bleiben Kartendaten und werden nicht als Taktiksignale gespiegelt.

## Inventar

- Originalset: 41 aktive/compiled Corp-Nodes/Assets; Spoiler-Erwartung 41.
- Proteus: 11 aktive/compiled Corp-Nodes/Assets; Spoiler-Erwartung 11.
- Test/V08: 2 aktive/compiled Repo-Assets; als Repo-Wahrheit mitgeprüft.
- Classic: 3 bekannte inaktive Corp-Nodes/Assets im Repo.

## Clusterübersicht

- access_brain_damage_ambush: 1
- access_counter_economy_punish: 1
- access_hardware_trash_ambush: 1
- access_icebreaker_strength_punish: 1
- access_net_damage_ambush: 2
- access_net_damage_tag_ambush: 1
- access_program_trash_ambush: 1
- advanceable_install_rez_economy: 1
- advanceable_installed_economy: 1
- advanceable_trace_credit_support: 1
- advancement_action_engine: 1
- advancement_counter_bank_transfer: 1
- advancement_fast_advance_support: 1
- archives_access_net_damage_antibody: 1
- damage_amplifier: 1
- draw: 1
- draw_hand_size: 1
- expose_prevention: 1
- hand_size: 1
- high_risk_economy: 1
- hq_agenda_reveal_economy: 1
- hq_rnd_hand_filter: 1
- ice_install_discount: 1
- ice_rez_discount: 1
- ice_rez_discount_strength_support: 1
- ice_rez_discount_subroutine_support: 1
- ice_trash_cashout: 1
- installed_card_bounce: 1
- installed_economy_action_burst: 1
- installed_economy_bank: 2
- installed_economy_campaign: 4
- installed_economy_charge_bank: 1
- persistent_tag_tax: 1
- repeatable_extra_action: 1
- repeatable_extra_action_high_risk: 1
- rnd_access_net_damage_antibody: 1
- run_redirect_control: 1
- run_tax: 1
- run_temporary_economy_with_random_cost: 1
- tag_snowball: 1
- tagged_runner_meat_damage_payoff: 3
- test_installed_economy: 2
- trace_credit_support: 2
- trace_tag_source: 1
- virus_counter_defense: 1

## Neue und wiederverwendete Taktiksignale

AI026 ergänzt 32 kontrollierte Corp-side Funktionssignale. Wiederverwendet werden unter anderem `remote.asset_economy`, `remote.ambush`, `access.punish`, `damage.payoff`, `tag.source`, `tag.payoff`, `trace.source`, `tax.ice`, `economy.rez_discount`, `economy.advanceable`, `score.hand_size`, `access.rnd_reveal_requirement` und `access.archives_safe_exception`, sofern SideScope und Wirkung passen.

- `economy.corp_installed_credit_drip`: supportOnly=true, mayAnchor=false, anchors=none
- `economy.corp_counter_bank`: supportOnly=true, mayAnchor=false, anchors=none
- `economy.corp_install_rez_credit`: supportOnly=false, mayAnchor=true, anchors=corp.economy_rez_reserve
- `economy.corp_run_temporary_credit`: supportOnly=false, mayAnchor=true, anchors=corp.economy_rez_reserve
- `economy.corp_asset_cashout`: supportOnly=false, mayAnchor=true, anchors=corp.asset_economy, corp.economy_rez_reserve
- `economy.corp_trace_credit_support`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `action.corp_repeatable_extra_action`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance, corp.remote_scoring
- `action.corp_counter_to_action`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance
- `advance.corp_counter_placement`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance, corp.remote_scoring
- `advance.corp_counter_bank`: supportOnly=true, mayAnchor=false, anchors=none
- `advance.corp_counter_transfer`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance, corp.remote_scoring
- `ice.corp_install_discount`: supportOnly=false, mayAnchor=true, anchors=corp.economy_rez_reserve, corp.ice_tax_glacier
- `ice.corp_rez_discount`: supportOnly=false, mayAnchor=true, anchors=corp.economy_rez_reserve, corp.ice_tax_glacier
- `ice.corp_strength_support`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `ice.corp_subroutine_support`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `trace.corp_credit_support`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `tag.corp_persistent_source`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `damage.corp_tagged_meat_payoff`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill, corp.tag_trace_punish
- `damage.corp_damage_amplifier`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `access.corp_hardware_trash`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff, corp.tag_trace_punish
- `access.corp_program_trash`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff
- `access.corp_counter_punish`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff
- `expose.corp_prevention`: supportOnly=true, mayAnchor=false, anchors=none
- `run.corp_redirect`: supportOnly=false, mayAnchor=true, anchors=corp.remote_scoring
- `run.corp_start_tax`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `hq.corp_hand_filter`: supportOnly=true, mayAnchor=false, anchors=none
- `virus.corp_counter_prevention`: supportOnly=true, mayAnchor=false, anchors=none
- `rnd.corp_self_shuffle_access`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.agenda_point_cost`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.leaves_play_loss`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.temporary_credit_drawback`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.random_discard_cost`: supportOnly=true, mayAnchor=false, anchors=none

## Vermiedene Typ-/Subtyp-Signale

Nicht eingeführt wurden: `asset.acme`, `asset.campaign`, `corp.asset`, `corp.asset_economy`, `corp.node`, `node.advertisement`, `node.ai`, `node.ambush`, `node.asset`, `node.black_ops`, `node.gray_ops`, `node.random`, `node.schlaghund`, `node.transactions`, `node.unique`, `node.virus`, `node.virus_test_site`.

## Strategieentscheidungen

Simple Draw-/Hand-size-/Utility-Nodes bleiben support-only. Campaign- und installed-economy Nodes ankern nur bei echter Remote-/Asset-Economy-Funktion. Tag-/Trace-Karten trennen Quellen, Trace-Credits und Payoffs. Access-Punish- und Ambush-Karten ankern nur über konkrete Access-Wirkungen, nicht über Ambush- oder Virus-Subtypen. Advancement- und Extra-Action-Karten ankern nur bei klarer Score-Conversion.

- ACME Savings and Loan: `corp.asset_economy` -> `high_risk_economy_payoff` (medium)
- BBS Whispering Campaign: `corp.asset_economy` -> `installed_economy_engine` (medium)
- Blood Cat: `corp.tag_trace_punish` -> `trace_credit_enabler` (medium)
- Braindance Campaign: `corp.asset_economy` -> `installed_economy_engine` (medium)
- Chicago Branch: `corp.fast_advance` -> `advancement_enabler` (high)
- Chicago Branch: `corp.remote_scoring` -> `advancement_enabler` (medium)
- City Surveillance: `corp.tag_trace_punish` -> `persistent_tag_source` (high)
- Corprunner's Shattered Remains: `corp.ambush_bluff` -> `access_hardware_trash` (high)
- Corprunner's Shattered Remains: `corp.tag_trace_punish` -> `access_hardware_trash` (low)
- Data Masons: `corp.ice_tax_glacier` -> `ice_tax_support` (high)
- Department of Truth Enhancement: `corp.asset_economy` -> `installed_economy_engine` (medium)
- Encoder, Inc.: `corp.ice_tax_glacier` -> `ice_tax_support` (high)
- Experimental AI: `corp.ambush_bluff` -> `access_program_trash` (high)
- Fortress Architects: `corp.ice_tax_glacier` -> `ice_tax_support` (medium)
- Fortress Architects: `corp.economy_rez_reserve` -> `install_rez_reserve` (medium)
- Hacker Tracker Central: `corp.tag_trace_punish` -> `trace_credit_enabler` (medium)
- Holovid Campaign: `corp.asset_economy` -> `installed_economy_engine` (medium)
- I Got a Rock: `corp.damage_kill` -> `tagged_meat_payoff` (high)
- I Got a Rock: `corp.tag_trace_punish` -> `tagged_meat_payoff` (high)
- Information Laundering: `corp.asset_economy` -> `installed_economy_engine` (medium)
- Investment Firm: `corp.asset_economy` -> `installed_economy_engine` (medium)
- Krumz: `corp.tag_trace_punish` -> `trace_credit_enabler` (low)
- Nevinyrral: `corp.fast_advance` -> `repeatable_action_engine` (medium)
- Nevinyrral: `corp.remote_scoring` -> `repeatable_action_engine` (medium)
- Newsgroup Taunting: `corp.ice_tax_glacier` -> `run_tax_support` (medium)
- Omniscience Foundation: `corp.tag_trace_punish` -> `persistent_tag_source` (medium)
- Pacifica Regional AI: `corp.fast_advance` -> `fast_advance_action_engine` (high)
- Remote Facility: `corp.fast_advance` -> `repeatable_action_engine` (medium)
- Remote Facility: `corp.remote_scoring` -> `repeatable_action_engine` (medium)
- Rockerboy Promotion: `corp.asset_economy` -> `installed_economy_engine` (medium)
- Schlaghund: `corp.damage_kill` -> `tagged_meat_payoff` (high)
- Schlaghund: `corp.tag_trace_punish` -> `tagged_meat_payoff` (high)
- Setup!: `corp.ambush_bluff` -> `access_ambush_payoff` (high)
- Skälderviken SA Beta Test Site: `corp.ice_tax_glacier` -> `ice_tax_support` (medium)
- Solo Squad: `corp.damage_kill` -> `tagged_meat_payoff` (medium)
- Solo Squad: `corp.tag_trace_punish` -> `tagged_meat_payoff` (medium)
- South African Mining Corp: `corp.asset_economy` -> `installed_economy_engine` (low)
- Spinn® Public Relations: `corp.asset_economy` -> `installed_economy_engine` (medium)
- TRAP!: `corp.ambush_bluff` -> `access_ambush_payoff` (high)
- TRAP!: `corp.tag_trace_punish` -> `persistent_tag_source` (medium)
- Vacant Soulkiller: `corp.ambush_bluff` -> `access_ambush_payoff` (high)
- Vacant Soulkiller: `corp.damage_kill` -> `meat_damage_payoff` (medium)
- Vapor Ops: `corp.fast_advance` -> `advancement_enabler` (high)
- Virus Test Site: `corp.ambush_bluff` -> `access_ambush_payoff` (high)
- Virus Test Site: `corp.damage_kill` -> `meat_damage_payoff` (medium)
- Bel-Digmo Antibody: `corp.ambush_bluff` -> `access_ambush_payoff` (medium)
- Cybertech Think Tank: `corp.damage_kill` -> `damage_amplifier` (high)
- Doppelganger Antibody: `corp.ambush_bluff` -> `access_ambush_payoff` (medium)
- Executive Boot Camp: `corp.economy_rez_reserve` -> `install_rez_reserve` (medium)
- Government Contract: `corp.economy_rez_reserve` -> `install_rez_reserve` (high)
- LDL Traffic Analyzers: `corp.tag_trace_punish` -> `trace_credit_enabler` (medium)
- Pattel Antibody: `corp.ambush_bluff` -> `access_ambush_payoff` (medium)
- Siren: `corp.remote_scoring` -> `remote_run_control` (high)
- Stereogram Antibody: `corp.ambush_bluff` -> `access_ambush_payoff` (low)
- Syd Meyer Superstores: `corp.asset_economy` -> `high_risk_economy_payoff` (medium)
- Syd Meyer Superstores: `corp.economy_rez_reserve` -> `install_rez_reserve` (low)

## TargetProfile-Kandidaten

- ACME Savings and Loan: schema_gap (long_term_liability_payment_choice)
- Blood Cat: candidate (use_target:runner)
- Chicago Branch: candidate (use_target:installed_advanceable_card)
- Corprunner's Shattered Remains: candidate (use_target:installed_hardware)
- Cowboy Sysop: schema_gap (corp_private_installed_card_to_hq_choice)
- Data Masons: candidate (use_target:installed_ice_constraint)
- Encoder, Inc.: candidate (use_target:installed_ice_constraint)
- Experimental AI: candidate (use_target:installed_program)
- Fortress Architects: candidate (use_target:ice_install)
- I Got a Rock: candidate (use_target:runner)
- Information Laundering: candidate (use_target:self_advancement_counter_count)
- Pacifica Regional AI: candidate (use_target:self_advancement_counter_count)
- Rescheduler: schema_gap (private_hq_shuffle_and_draw_count)
- Schlaghund: candidate (use_target:runner)
- Skälderviken SA Beta Test Site: candidate (use_target:installed_ice_constraint)
- Solo Squad: candidate (use_target:runner)
- Vapor Ops: candidate (use_target:installed_advanceable_card)
- Cybertech Think Tank: schema_gap (use_target:damage_source)
- Department of Misinformation: candidate (use_target:corp_card_expose_attempt)
- Executive Boot Camp: schema_gap (private_random_discard_cost)
- Government Contract: candidate (use_target:install_or_rez_payment)
- LDL Traffic Analyzers: candidate (use_target:trace_attempt)
- Pattel Antibody: candidate (use_target:installed_icebreaker)
- Siren: schema_gap (run_redirect_fort_choice)
- Syd Meyer Superstores: candidate (use_target:own_rezzed_ice)

## Hidden-Info-Grenzen

Korp-Node-/Asset-Semantik bleibt `corp_side_only_until_rezzed_or_accessed`, bis eine Karte rezzed, accessed, exposed oder anderweitig legal bekannt ist. AI026 ergänzt keine Runner-seitige verdeckte Node-/Asset-Sicht und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log-, Client-Error-, Planner- oder Targeting-KI-Projektion.

## Deferred Items

- target_profile_v1_for_assets: deferred_or_schema_gap. Hidden installed-card choices, run redirect, self-counter spending, private HQ/R&D manipulation and access-triggered counters remain report-only until side-safe TargetProfile schema support exists.
- generic_node_or_asset_strategy: rejected. AI026 introduces no generic Corp node, asset, advertisement, transactions, AI, ambush, virus or random strategy. Anchors use existing strategy IDs only when function evidence supports them.

## Post-Review-Liste

Die vollständige Kartenliste mit Funktionsfamilie, Conditions, Risiken, Taktiksignalen, Strategieankern, `strategySupportPairs`, TargetProfile-Status und Hidden-Info-Policy steht im JSON-Report `ai026-corp-nodes-assets-semantics-review-report-2026-06-02.json`.
