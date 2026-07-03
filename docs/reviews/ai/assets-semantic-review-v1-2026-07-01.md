# Assets Semantic Review v1

Status: `review-only`

Stand: 2026-07-01

Dieser Bericht prüft alle aktiven Corp-Assets analog zum Agenda- und Operation-Review. Er ändert keine AI-Daten; er dokumentiert den Ist-Stand und einen empfohlenen Nachher-Stand für Taktiksignale, Strategieanker und hierarchische `strategySupportPairs`.

## Zusammenfassung

- Scope: 55 Corp-Assets (classic: 3, originalset-v1: 41, proteus: 11).
- Aktuell: 55 mit Taktiksignalen, 45 mit losem Strategieanker, 45 mit loser Rolle, 0 mit `strategySupportPairs`.
- Empfohlen: 45 Karten mit Strategieanker, 10 bewusst support-only, 53 StrategySupportPairs.
- Review-Status: kleine Änderung: 39, ändern: 6, behalten: 10.

## Wichtigste Befunde

1. Aktive Asset-Hints sind fast vollständig vorhanden, aber kein Asset besitzt derzeit strategySupportPairs.
2. Originalset- und Proteus-Assets können weitgehend aus AI026-1 in die neue Hierarchie überführt werden.
3. Classic-Assets besitzen seit 2026-07-01 Basis-Hints; Strategic Planning Group sollte auf corp.draw_engine statt corp.central_stabilize umgehängt werden.
4. Support-only Assets bleiben bewusst ohne Strategieanker, wenn sie nur Draw, Handgröße, Expose-Prävention oder private HQ/R&D-Utility liefern.
5. Hidden-Info-Grenze bleibt corp_side_only_until_rezzed_or_accessed; verdeckte Asset-Identitäten und private Kartenwahl dürfen nicht in öffentliche AI-/Runner-Sichten gelangen.

## Empfohlene Strategieanker-Verteilung

- `corp.ambush_bluff`: 10
- `corp.asset_economy`: 11
- `corp.central_stabilize`: 1
- `corp.damage_kill`: 6
- `corp.draw_engine`: 1
- `corp.economy_rez_reserve`: 3
- `corp.fast_advance`: 3
- `corp.ice_tax_glacier`: 5
- `corp.remote_scoring`: 2
- `corp.tag_trace_punish`: 11

## Kartenreview

### Indiscriminate Response Team (onr_classic_019_indiscriminate-response-team)

Set: classic

Typ/Subtypen: `asset` / `node`, `black_ops`

Kosten: Rez 0 / Trash 2

Regeltext: After Runner makes a successful run, you may have Runner shuffle his or her hand into his or her stack and then draw as many cards as he or she had before.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `run.successful_run_grip_reset`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: _keine_
- Effekte: `access_punish/after_successful_run/runner/cards/target=runner_grip_shuffle_stack_redraw`, `zone_shuffle/after_successful_run/stack/cards/target=runner_grip_shuffle_stack_redraw`, `draw/after_successful_run/runner/cards/target=same_count_redraw`
- Conditions: `requires_successful_run`

Empfohlener Nachher-Stand:
- Taktiksignale: `run.successful_run_grip_reset`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.central_stabilize -> defensive_tool/successful_run_grip_reset_defense (medium)`
- Target/Constraints: kein TargetProfile; Runner-Handidentitäten bleiben verborgen, der Effekt ist nur als erfolgreicher-Run-Folgefenster relevant
- Änderung: Current-Hint ist fachlich brauchbar; es fehlt nur die hierarchische Pair-Ebene.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Satellite Monitors (onr_classic_021_satellite-monitors)

Set: classic

Typ/Subtypen: `asset` / `node`

Kosten: Rez 3 / Trash 1

Regeltext: At the start of each of your turns, you may roll a die for each run Runner made during his or her last turn. Dor each 1, give Runner a tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.multiple_runs_last_turn`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/start_of_turn/runner/tags/amount=1/target=tag.source`
- Conditions: `requires_start_of_turn`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.multiple_runs_last_turn`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/multi_run_start_turn_tag_source (high)`
- Target/Constraints: kein Zielwahlprofil; Bedingung ist vergangene Runner-Run-Anzahl plus Würfel-/Zufallsauflösung
- Änderung: Anker und Signale passen, aber die Rolle muss unter `corp.tag_trace_punish` als Pair hängen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Strategic Planning Group (onr_classic_025_strategic-planning-group)

Set: classic

Typ/Subtypen: `asset` / `node`, `unique`

Kosten: Rez 2 / Trash 4

Regeltext: Whenever you draw one or more cards, draw an extra card. Then place one of the drawn cards on the bottom of R&D. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`, `hq.corp_hand_refresh`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `draw/persistent/corp/cards/amount=1/target=draw.corp_draw`, `zone_shuffle/persistent/rnd/cards/amount=1/target=bottom_one_drawn_card`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `draw.corp_recurring`, `hq.corp_hand_filter`
- Strategieanker: `corp.draw_engine`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.draw_engine -> engine_anchor/start_turn_draw_filter_engine (high)`
- Target/Constraints: Controller-only Kartenwahl; gezogene Kartenidentitäten dürfen nicht in öffentliche oder Runner-seitige AI-Inputs gelangen
- Änderung: `corp.central_stabilize` ist zu grob; der neue Agenda-Anker `corp.draw_engine` beschreibt die Funktion besser.
- Geänderte Felder bei Umsetzung: `tacticSignals`, `lineSupport`, `strategySupportPairs`

### ACME Savings and Loan (onr_v1_308_acme-savings-and-loan)

Set: originalset-v1

Typ/Subtypen: `asset` / `transactions`

Kosten: Rez 0 / Trash 0

Regeltext: Rezzing ACME S&L costs 1 agenda point, in addition to the normal cost. When you rez ACME S&L, gain 12 credits and trash ACME S&L. For the remainder of the game, pay 1 credit at the end of each of your turns, or lose the game. You can remove this effect, and score 1 agenda point, by taking an action to pay 12 credits.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_credit_burst`, `risk.agenda_point_cost`, `risk.loss_condition`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/on_rez/corp/credits/amount=12`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`, `risk.agenda_point_cost`, `risk.loss_condition`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.asset_economy -> payoff_anchor/high_risk_economy_payoff (medium)`
- Target/Constraints: schema_gap: long_term_liability_payment_choice
- Änderung: Large one-shot credit injection with agenda-point and lose-game liability; economy function is explicit, risk is modeled separately. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### BBS Whispering Campaign (onr_v1_309_bbs-whispering-campaign)

Set: originalset-v1

Typ/Subtypen: `asset` / `advertisement`

Kosten: Rez 0 / Trash 4

Regeltext: Put [16] from the bank on BBS Whispering Campaign when you rez it.  When all the bits have been removed, trash BBS Whispering Campaign. A: Take [2] from BBS Whispering Campaign.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/credits/amount=2`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Installed credit campaign creates remote trash pressure but no subtype signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Blood Cat (onr_v1_310_blood-cat)

Set: originalset-v1

Typ/Subtypen: `asset` / `ai`

Kosten: Rez 6 / Trash 0

Regeltext: A:Trace 5 -If trace is successful, give Runner a tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace/action/runner/amount=5`, `tag_source/trace_success/runner`
- Conditions: `requires_trace_success`

Empfohlener Nachher-Stand:
- Taktiksignale: `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_tag_source (medium)`
- Target/Constraints: candidate: use_target:runner
- Änderung: Trace 5 in Tag; kein Trace-Credit-Enabler. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Braindance Campaign (onr_v1_311_braindance-campaign)

Set: originalset-v1

Typ/Subtypen: `asset` / `advertisement`, `gray ops`

Kosten: Rez 6 / Trash 7

Regeltext: Put [12] from the bank on Braindance Campaign when you rez it. Take [2] from Braindance Campaign at the start of each of your turns. When all the bits have been removed, trash Braindance Campaign.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/start_of_turn/corp/credits/amount=2`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Start-of-turn installed economy creates asset-economy pressure; Gray Ops remains only a subtype. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Chicago Branch (onr_v1_312_chicago-branch)

Set: originalset-v1

Typ/Subtypen: `asset` / `asset`

Kosten: Rez 2 / Trash 1

Regeltext: A, [3]: Add two advancement counters to an installed card that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_placement`, `advance.score_window_support`, `remote.scoring_protection`
- Strategieanker: `corp.fast_advance`, `corp.remote_scoring`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance/action/installed_card/amount=2`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_placement`, `advance.score_window_support`, `remote.scoring_protection`
- Strategieanker: `corp.fast_advance`, `corp.remote_scoring`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/advancement_enabler (high)`, `corp.remote_scoring -> scoring_tool/advancement_enabler (medium)`
- Target/Constraints: candidate: use_target:installed_advanceable_card
- Änderung: Repeatable two-counter placement is real score conversion support. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### City Surveillance (onr_v1_313_city-surveillance)

Set: originalset-v1

Typ/Subtypen: `asset` / `gray ops`

Kosten: Rez 1 / Trash 2

Regeltext: For each card Runner draws, give Runner a tag unless Runner pays 1, in addition to any other costs, to avoid receiving that tag. You may rez City Surveillance just before the card is drawn.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `tag.corp_persistent_source`, `tag.source`, `tax.runner_credit`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/runner_turn/runner`, `run_tax/runner_turn/runner`
- Conditions: `requires_runner_pay_or_take_tag`

Empfohlener Nachher-Stand:
- Taktiksignale: `tag.corp_persistent_source`, `tag.source`, `tax.runner_credit`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/persistent_tag_source (high)`
- Target/Constraints: not_required
- Änderung: Persistent draw-linked tag pressure is a tag source, not a tagged payoff. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Corporate Negotiating Center (onr_v1_314_corporate-negotiating-center)

Set: originalset-v1

Typ/Subtypen: `asset` / `asset`

Kosten: Rez 0 / Trash 3

Regeltext: At the start of each of your turns, gain 1 for each agenda card stored in HQ that you show to Runner.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `economy.corp_hq_agenda_reveal_credit`, `info.hq_agenda_reveal`, `risk.reveal_hq_agendas`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `agenda_reveal_economy/start_of_turn/corp/target=economy.corp_hq_agenda_reveal_credit`
- Conditions: `requires_agenda_reveal`

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_hq_agenda_reveal_credit`, `info.hq_agenda_reveal`, `risk.reveal_hq_agendas`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: HQ-Agenda-Reveal-Economy with explicit reveal risk; no high-difficulty agenda risk. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Corprunner's Shattered Remains (onr_v1_315_corprunners-shattered-remains)

Set: originalset-v1

Typ/Subtypen: `asset` / `ambush`

Kosten: Rez 2 / Trash 0

Regeltext: You may advance Shattered Remains before and after you rez it. When Runner accesses Shattered Remains, trash one piece of hardware for each advancement counter on it.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.corp_hardware_trash`, `access.punish`, `advance.corp_counter_bank`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `support_tool`
- StrategySupportPairs: _keine_
- Effekte: `hardware_trash/on_access/runner`
- Conditions: `requires_accessed_card`, `requires_advancement_counter`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.corp_hardware_trash`, `access.punish`, `advance.corp_counter_bank`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_hardware_trash (high)`
- Target/Constraints: candidate: use_target:installed_hardware
- Änderung: Hardware-Trash-Access-Ambush ohne Tag-/Tagged-Logik. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Cowboy Sysop (onr_v1_316_cowboy-sysop)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 3

Regeltext: A: Choose one of your installed cards to be uninstalled. Store it in HQ.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `hq.corp_installed_card_bounce`, `install.corp_uninstall_to_hq`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `card_recovery/action/installed_card/target=hq.corp_installed_card_bounce`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `hq.corp_installed_card_bounce`, `install.corp_uninstall_to_hq`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: schema_gap: corp_private_installed_card_to_hq_choice
- Änderung: Uninstall eigener installierter Karte nach HQ; keine Archives-Recovery. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Data Masons (onr_v1_317_data-masons)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 1 / Trash 1

Regeltext: Walls cost 2 less to rez and get +1 strength while Data Masons is rezzed.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `ice.corp_rez_discount`, `ice.corp_strength_support`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: _keine_
- Effekte: `rez_discount/persistent/ice`, `global_modifier/persistent/ice`
- Conditions: `requires_installed_ice`

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_rez_discount`, `ice.corp_strength_support`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_tax_support (high)`
- Target/Constraints: not_required
- Änderung: Static Wall scope is a constraint, not a TargetProfile. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Department of Truth Enhancement (onr_v1_318_department-of-truth-enhancement)

Set: originalset-v1

Typ/Subtypen: `asset` / `gray ops`

Kosten: Rez 2 / Trash 1

Regeltext: A: Put [3] from the bank on Department of Truth Enhancement. A: Take all the bits from Department of Truth Enhancement.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_action_charged_bank`, `economy.corp_charge_bank`, `economy.corp_counter_bank`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `finite_economy_pool/action/corp/target=economy.corp_charge_bank`, `economy/action/corp/target=economy.corp_action_charged_bank`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_action_charged_bank`, `economy.corp_charge_bank`, `economy.corp_counter_bank`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Action-charged bank, nicht normaler Installed-Drip. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Disinfectant, Inc. (onr_v1_319_disinfectant-inc)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 4

Regeltext: You may pay [1] to avoid receiving a Virus counter. Use this ability only once each turn.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `virus.corp_counter_prevention`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `prevention_replacement/persistent/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `virus.corp_counter_prevention`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: Virus-counter prevention is defensive utility, not a generic Corp virus strategy. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Encoder, Inc. (onr_v1_320_encoder-inc)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 1

Regeltext: Code gates cost 1 less to rez while Encoder, Inc. is rezzed. All code gates have an additional "End the run" subroutine after all other subroutines.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `ice.corp_rez_discount`, `ice.corp_subroutine_support`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: _keine_
- Effekte: `rez_discount/persistent/ice`, `global_modifier/persistent/ice`
- Conditions: `requires_installed_ice`

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_rez_discount`, `ice.corp_subroutine_support`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_tax_support (high)`
- Target/Constraints: not_required
- Änderung: Static Code-Gate scope is a constraint, not a TargetProfile. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### ESA Contract (onr_v1_321_esa-contract)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 3

Regeltext: A: Draw two cards.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `draw/action/corp/amount=2/target=draw.corp_draw`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: Corp Draw, nicht Credit-Economy. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Euromarket Consortium (onr_v1_322_euromarket-consortium)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 2 / Trash 4

Regeltext: Hand size +2; A, [1]: Draw two cards.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`, `setup.corp_hand_size`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `draw/action/corp/amount=2/target=draw.corp_draw`, `hand_size_modifier/persistent/corp/target=setup.corp_hand_size`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `setup.corp_hand_size`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: Draw und Corp-Handsize, kein Score-Kontext. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Experimental AI (onr_v1_323_experimental-ai)

Set: originalset-v1

Typ/Subtypen: `asset` / `ai`, `ambush`

Kosten: Rez 2 / Trash 0

Regeltext: You may advance Experimental AI before and after you rez it. When Runner accesses Experimental AI, trash one program for each advancement counter on it.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.corp_program_trash`, `access.punish`, `advance.corp_counter_bank`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `program_trash/on_access/runner`
- Conditions: `requires_accessed_card`, `requires_advancement_counter`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.corp_program_trash`, `access.punish`, `advance.corp_counter_bank`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_program_trash (high)`
- Target/Constraints: candidate: use_target:installed_program
- Änderung: Access program trash is a concrete ambush payoff; AI/Ambush subtypes remain card data. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Fortress Architects (onr_v1_324_fortress-architects)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 3

Regeltext: Cost to install ice is reduced by 1.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.rez_discount`, `ice.corp_install_discount`, `tax.ice`
- Strategieanker: `corp.economy_rez_reserve`, `corp.ice_tax_glacier`
- Strategische Rollen: `engine_anchor`, `tax_tool`
- StrategySupportPairs: _keine_
- Effekte: `install_discount/persistent/ice`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.rez_discount`, `ice.corp_install_discount`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`, `corp.economy_rez_reserve`
- Strategische Rollen: `tax_tool`, `engine_anchor`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_tax_support (medium)`, `corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (medium)`
- Target/Constraints: not_required
- Änderung: Static ICE-install discount has no target choice in current hint layer. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Hacker Tracker Central (onr_v1_325_hacker-tracker-central)

Set: originalset-v1

Typ/Subtypen: `asset` / `asset`

Kosten: Rez 0 / Trash 2

Regeltext: After each trace attempt, whether successful or not, put 1 from the bank on Hacker Tracker Central. During a trace attempt, each bit you spend from Hacker Tracker Central increases by 1 both your trace strength and your trace limit.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_trace_credit_support`, `trace.corp_credit_support`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace_credit/trace_window/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_trace_credit_support`, `trace.corp_credit_support`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_credit_enabler (medium)`
- Target/Constraints: not_required
- Änderung: Trace-specific credit support enables trace decks but is not a tag source by itself. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Holovid Campaign (onr_v1_326_holovid-campaign)

Set: originalset-v1

Typ/Subtypen: `asset` / `advertisement`

Kosten: Rez 4 / Trash 7

Regeltext: Put 12 from the bank on Holovid Campaign when you rez it. Take 1 from Holovid Campaign at the start of each of your turns. When all the bits have been removed, trash Holovid Campaign.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/start_of_turn/corp/credits/amount=1`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Installed credit drip creates asset-economy pressure; Advertisement remains a subtype. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### I Got a Rock (onr_v1_327_i-got-a-rock)

Set: originalset-v1

Typ/Subtypen: `asset` / `black ops`

Kosten: Rez 3 / Trash 2

Regeltext: A, 3 agenda points: Do 15 meat damage to Runner. Use this ability only if Runner has two or more tags.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `damage/action/runner/amount=15`
- Conditions: `requires_runner_tagged`, `requires_scored_agenda`

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_payoff (high)`, `corp.tag_trace_punish -> win_condition/tagged_meat_payoff (high)`
- Target/Constraints: candidate: use_target:runner
- Änderung: Large tagged meat damage payoff is both Kill and Tag/Punish; Black Ops remains a subtype. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Information Laundering (onr_v1_328_information-laundering)

Set: originalset-v1

Typ/Subtypen: `asset` / `transactions`

Kosten: Rez 0 / Trash 1

Regeltext: You may advance Information Laundering before and after you rez it. A, T: Gain [4] for each advancement counter on Information Laundering.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `economy.corp_advanceable_cashout`, `economy.corp_counter_cashout`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/target=economy.corp_counter_cashout`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `economy.corp_advanceable_cashout`, `economy.corp_counter_cashout`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: candidate: use_target:self_advancement_counter_count
- Änderung: Advanceable counter cashout, nicht generischer Installed-Drip. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Investment Firm (onr_v1_329_investment-firm)

Set: originalset-v1

Typ/Subtypen: `asset` / `transactions`

Kosten: Rez 1 / Trash 2

Regeltext: Take 1 from Investment Firm, if it has any bits, at the start of each of your turns. Whenever 1 or more bits are added to your pool, you may put 2 from the bank on Investment Firm for each 1 you choose not to add to your pool. Effects that give you bits at the start of your turn cannot be used this way.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_counter_bank`, `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/start_of_turn/corp`, `finite_economy_pool/action/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_counter_bank`, `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Banked installed economy supports asset economy; Transactions remains card data. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Krumz (onr_v1_330_krumz)

Set: originalset-v1

Typ/Subtypen: `asset` / `ai`

Kosten: Rez 0 / Trash 2

Regeltext: Put [1] from the bank on Krumz when you rez it. Use this bit only to pay for traces. If you use this bit, replace it at the start of your next turn.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_trace_credit_support`, `trace.corp_credit_support`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace_credit/persistent/corp/amount=1`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_trace_credit_support`, `trace.corp_credit_support`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_credit_enabler (low)`
- Target/Constraints: not_required
- Änderung: Small recurring trace credit support; not a tag source. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Nevinyrral (onr_v1_331_nevinyrral)

Set: originalset-v1

Typ/Subtypen: `asset` / `ai`, `unique`

Kosten: Rez 3 / Trash 5

Regeltext: Gain an action during each of your turns. If Nevinyrral leaves play while rezzed, you lose the game.
Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `action.corp_repeatable_extra_action`, `risk.leaves_play_loss`, `risk.loss_condition`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `extra_action/corp_turn/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_repeatable_extra_action`, `risk.leaves_play_loss`, `risk.loss_condition`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: Repeatable extra action with lose-game risk; no automatic Fast-Advance/Remote-Scoring anchor. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Newsgroup Taunting (onr_v1_332_newsgroup-taunting)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 1 / Trash 0

Regeltext: At the start of each run, Runner must pay 1, in addition to any other costs, or end the run.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `run.corp_start_tax`, `tax.runner_credit`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: _keine_
- Effekte: `run_tax/during_run/runner/amount=1`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `run.corp_start_tax`, `tax.runner_credit`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_tax_support (medium)`
- Target/Constraints: not_required
- Änderung: Start-of-run credit tax supports tax/glacier without creating run legality. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Omniscience Foundation (onr_v1_333_omniscience-foundation)

Set: originalset-v1

Typ/Subtypen: `asset` / `gray ops`

Kosten: Rez 0 / Trash 1

Regeltext: Give Runner a tag at the end of each turn during which Runner received a tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/corp_turn/runner/target=tag.additional_tag_followup`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/tag_snowball_followup (medium)`
- Target/Constraints: not_required
- Änderung: Conditional additional-tag follow-up; not an initial or persistent tag source. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Pacifica Regional AI (onr_v1_334_pacifica-regional-ai)

Set: originalset-v1

Typ/Subtypen: `asset` / `ai`

Kosten: Rez 0 / Trash 0

Regeltext: You may advance Pacifica Regional AI before and after you rez it.
Regional AI advancement counter: Gain an action.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `action.corp_counter_to_action`, `advance.corp_counter_bank`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `extra_action/action/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_counter_to_action`, `advance.corp_counter_bank`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.fast_advance -> engine_anchor/fast_advance_action_engine (high)`
- Target/Constraints: candidate: use_target:self_advancement_counter_count
- Änderung: Advancement-counter-to-action conversion remains a plausible Fast-Advance anchor. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Remote Facility (onr_v1_335_remote-facility)

Set: originalset-v1

Typ/Subtypen: `asset` / `asset`

Kosten: Rez 5 / Trash 1

Regeltext: Gain an action during each of your turns.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `action.corp_repeatable_extra_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `extra_action/corp_turn/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_repeatable_extra_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: Repeatable extra action remains a tactic signal; Fast-Advance/Remote-Scoring anchor deferred because no direct score conversion is encoded. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Rescheduler (onr_v1_336_rescheduler)

Set: originalset-v1

Typ/Subtypen: `asset` / `gray ops`

Kosten: Rez 0 / Trash 3

Regeltext: A: Note the number of cards stored in HQ. Shuffle those cards into R&D, and then draw that many cards.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`, `hq.corp_hand_filter`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `shuffle_draw/action/corp/target=hq.corp_hand_refresh`, `zone_shuffle/action/rnd/target=rnd.corp_shuffle_hq_into_rnd`, `draw/action/corp/target=draw.corp_draw`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `hq.corp_hand_filter`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: schema_gap: private_hq_shuffle_and_draw_count
- Änderung: HQ in R&D mischen und gleich viele Karten ziehen ist Hand-Refresh, kein kontrolliertes Topdeck-Setup. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Rockerboy Promotion (onr_v1_337_rockerboy-promotion)

Set: originalset-v1

Typ/Subtypen: `asset` / `advertisement`

Kosten: Rez 4 / Trash 3

Regeltext: Put [15] from the bank on Rockerboy Promotion when you rez it. When all the bits have been removed, trash Rockerboy Promotion. A: Take [3] from Rockerboy Promotion.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/amount=3`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Installed action economy creates asset-economy pressure; no Advertisement signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Rustbelt HQ Branch (onr_v1_338_rustbelt-hq-branch)

Set: originalset-v1

Typ/Subtypen: `asset` / `asset`

Kosten: Rez 0 / Trash 2

Regeltext: Hand size +2.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `setup.corp_hand_size`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `hand_size_modifier/persistent/corp/amount=2/target=setup.corp_hand_size`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `setup.corp_hand_size`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: not_required
- Änderung: Corp-Handsize, kein Score-Kontext. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Schlaghund (onr_v1_339_schlaghund)

Set: originalset-v1

Typ/Subtypen: `asset` / `black ops`, `random`

Kosten: Rez 2 / Trash 4

Regeltext: A: Roll a die. If you roll less than or equal to the number of tags Runner has, Schlaghund does 10 meat damage and you trash Schlaghund.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.random_action`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `damage/action/runner/amount=10`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.random_action`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_payoff (high)`, `corp.tag_trace_punish -> win_condition/tagged_meat_payoff (high)`
- Target/Constraints: candidate: use_target:runner
- Änderung: Tagged meat damage payoff is modeled by function; Random and Black Ops remain subtypes. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Setup! (onr_v1_340_setup)

Set: originalset-v1

Typ/Subtypen: `asset` / `ambush`

Kosten: Rez 0 / Trash 0

Regeltext: When Runner accesses Setup!, it does 2 Net damage, even if it is not installed. Ignore this effect if Runner accesses it from the Archives. If Setup! is accessed from R&D, Runner must show it to you.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_net_damage_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `damage.payoff`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `damage/on_access/runner/amount=2/target=access.corp_net_damage_ambush`
- Conditions: `requires_accessed_card`, `requires_rnd_top`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_net_damage_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `damage.payoff`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high)`
- Target/Constraints: not_required
- Änderung: Net-Damage-Access-Ambush; `damage.payoff` bleibt nur Oberklasse, kein Damage-Kill-Anker. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Skälderviken SA Beta Test Site (onr_v1_341_skalderviken-sa-beta-test-site)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 2

Regeltext: Black ice costs 2 less to rez while this asset is rezzed.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `ice.corp_rez_discount`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: _keine_
- Effekte: `rez_discount/persistent/ice`
- Conditions: `requires_installed_ice`

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_rez_discount`, `tax.ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_tax_support (medium)`
- Target/Constraints: not_required
- Änderung: Static Black-ICE scope is a constraint, not a TargetProfile. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Solo Squad (onr_v1_342_solo-squad)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 3

Regeltext: A: Do 1 meat damage. Use this ability only if Runner is tagged.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `damage/action/runner/amount=1`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_payoff (medium)`, `corp.tag_trace_punish -> win_condition/tagged_meat_payoff (medium)`
- Target/Constraints: candidate: use_target:runner
- Änderung: Small repeatable tagged damage is a tag-punish kill support card, not a generic damage label. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### South African Mining Corp (onr_v1_343_south-african-mining-corp)

Set: originalset-v1

Typ/Subtypen: `asset` / `transactions`

Kosten: Rez 0 / Trash 1

Regeltext: A, A, A: Gain [6].

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_multi_action_credit`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/amount=6/target=economy.corp_multi_action_credit`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_multi_action_credit`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.asset_economy -> payoff_anchor/high_risk_economy_payoff (low)`
- Target/Constraints: not_required
- Änderung: Drei Aktionen fuer 6 Credits; keine normale Drip-Economy. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Spinn® Public Relations (onr_v1_344_spinn-public-relations)

Set: originalset-v1

Typ/Subtypen: `asset` / `transactions`

Kosten: Rez 1 / Trash 4

Regeltext: Take [1] from Spinn(R) Public Relations, if it has any bits, at the start of each of your turns. A: Put [3] from the bank on Spinn(R) Public Relations.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_counter_bank`, `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `finite_economy_pool/action/corp`, `economy/start_of_turn/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_counter_bank`, `economy.corp_installed_credit_drip`, `remote.asset_economy`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.asset_economy -> engine_anchor/installed_economy_engine (medium)`
- Target/Constraints: not_required
- Änderung: Installed banked economy supports asset economy without using Transactions as signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### TRAP! (onr_v1_345_trap)

Set: originalset-v1

Typ/Subtypen: `asset` / `ambush`

Kosten: Rez 0 / Trash 0

Regeltext: If you pay [4] when Runner accesses TRAP!, it does 3 Net damage and gives Runner a tag, even if TRAP! is not installed. Ignore this effect if Runner accesses it from the Archives. If TRAP! is accessed from R&D, Runner must show it to you.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_net_damage_ambush`, `access.corp_tag_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `damage.payoff`, `remote.ambush`, `tag.source`
- Strategieanker: `corp.ambush_bluff`, `corp.tag_trace_punish`
- Strategische Rollen: `enabler`, `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `damage/on_access/runner/amount=3/target=access.corp_net_damage_ambush`, `tag_source/on_access/runner/amount=1/target=access.corp_tag_ambush`
- Conditions: `requires_accessed_card`, `requires_corp_credits_threshold`, `requires_rnd_top`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_net_damage_ambush`, `access.corp_tag_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `damage.payoff`, `remote.ambush`, `tag.source`
- Strategieanker: `corp.ambush_bluff`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`, `enabler`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high)`, `corp.tag_trace_punish -> enabler/access_tag_source (medium)`
- Target/Constraints: not_required
- Änderung: Access-Net-Damage plus Access-Tag-Ambush; die Tag-Rolle ist nicht persistent. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Vacant Soulkiller (onr_v1_346_vacant-soulkiller)

Set: originalset-v1

Typ/Subtypen: `asset` / `ambush`

Kosten: Rez 2 / Trash 0

Regeltext: You may advance Vacant Soulkiller before and after you rez it. When Runner accesses Vacant Soulkiller, it does 1 brain damage for each advancement counter on it.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.corp_brain_damage_ambush`, `access.punish`, `advance.corp_counter_bank`, `damage.payoff`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`, `corp.damage_kill`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `damage/on_access/runner/target=access.corp_brain_damage_ambush`
- Conditions: `requires_accessed_card`, `requires_advancement_counter`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.corp_brain_damage_ambush`, `access.punish`, `advance.corp_counter_bank`, `damage.payoff`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`, `corp.damage_kill`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_brain_damage_payoff (high)`, `corp.damage_kill -> punish_payoff/access_brain_damage_payoff (medium)`
- Target/Constraints: not_required
- Änderung: Brain-Damage-Ambush nach Advancement Countern; keine Meat-Damage-Rolle. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Vapor Ops (onr_v1_347_vapor-ops)

Set: originalset-v1

Typ/Subtypen: `asset`

Kosten: Rez 0 / Trash 1

Regeltext: You may advance Vapor Ops before and after you rez it.
Vapor Ops advancement counter: Gain 1.
[A]: Move any number of advancement counters from Vapor Ops to another installed card that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `advance.corp_counter_transfer`, `advance.score_window_support`, `economy.corp_counter_bank`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance/action/installed_card`, `economy/action/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `advance.corp_counter_transfer`, `advance.score_window_support`, `economy.corp_counter_bank`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/advancement_enabler (high)`
- Target/Constraints: candidate: use_target:installed_advanceable_card
- Änderung: Counter bank and movement can convert to score windows; no generic asset signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Virus Test Site (onr_v1_348_virus-test-site)

Set: originalset-v1

Typ/Subtypen: `asset` / `ambush`

Kosten: Rez 0 / Trash 0

Regeltext: You may advance Virus Test Site before and after you rez it. When Runner accesses Test Site, it does 2 Net damage per advancement counter on it, or 1 Net damage if it has no counters, even if it is not installed or rezzed. Ignore this effect if Runner accesses it from the Archives. If Test Site is accessed from R&D, Runner must show it to you.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_net_damage_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `advance.corp_counter_bank`, `damage.payoff`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`, `corp.damage_kill`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `damage/on_access/runner/target=access.corp_net_damage_ambush`
- Conditions: `requires_accessed_card`, `requires_advancement_counter`, `requires_rnd_top`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_net_damage_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `advance.corp_counter_bank`, `damage.payoff`, `remote.ambush`
- Strategieanker: `corp.ambush_bluff`, `corp.damage_kill`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (high)`, `corp.damage_kill -> punish_payoff/access_net_damage_payoff (medium)`
- Target/Constraints: not_required
- Änderung: Net-Damage-Ambush skaliert mit Advancement Countern; keine Meat-Damage-Rolle. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Bel-Digmo Antibody (onr_proteus_054_bel-digmo-antibody)

Set: proteus

Typ/Subtypen: `asset` / `ambush`, `node`, `virus`

Kosten: Rez 0 / Trash 0

Regeltext: Shuffle Bel-Digmo Antibody into R&D when it is rezzed. When Runner accesses Bel-Digmo Antibody from R&D, do 1 Net damage, and Runner must show it to you.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.corp_net_damage_ambush`, `access.corp_rnd_net_damage_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `damage.payoff`, `rnd.corp_self_shuffle_access`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `damage/on_access/runner/amount=1/target=access.corp_rnd_net_damage_ambush`, `zone_shuffle/on_rez/rnd/target=rnd.corp_self_shuffle_access`
- Conditions: `requires_rnd_top`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.corp_net_damage_ambush`, `access.corp_rnd_net_damage_ambush`, `access.punish`, `access.rnd_reveal_requirement`, `damage.payoff`, `rnd.corp_self_shuffle_access`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (medium)`
- Target/Constraints: not_required
- Änderung: R&D-Access-Net-Damage plus Reveal/Self-Shuffle. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Cybertech Think Tank (onr_proteus_055_cybertech-think-tank)

Set: proteus

Typ/Subtypen: `asset` / `asset`, `node`

Kosten: Rez 1 / Trash 3

Regeltext: You may advance Cybertech Think Tank before and after you rez it. Cybertech Think Tank advancement counter: Increase by 1 the meat damage dealt by another source.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `damage.corp_damage_amplifier`, `damage.payoff`
- Strategieanker: `corp.damage_kill`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `global_modifier/action/damage`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `damage.corp_damage_amplifier`, `damage.payoff`
- Strategieanker: `corp.damage_kill`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.damage_kill -> enabler/damage_amplifier (high)`
- Target/Constraints: schema_gap: use_target:damage_source
- Änderung: Advancement counters increase another meat damage source; this is kill support, not a Node/AI signal. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Department of Misinformation (onr_proteus_056_department-of-misinformation)

Set: proteus

Typ/Subtypen: `asset` / `asset`, `node`

Kosten: Rez 0 / Trash 4

Regeltext: You may rez Department of Misinformation when Runner attempts to expose a card. [1]: Prevent a card from being exposed.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `expose.corp_prevention`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `prevention_replacement/prevention_window/installed_card`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `expose.corp_prevention`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: candidate: use_target:corp_card_expose_attempt
- Änderung: Expose prevention is defensive utility and not automatically remote contest. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: _keine_

### Doppelganger Antibody (onr_proteus_057_doppelganger-antibody)

Set: proteus

Typ/Subtypen: `asset` / `ambush`, `node`, `virus`

Kosten: Rez 0 / Trash 0

Regeltext: When Runner accesses Doppelganger Antibody, you may pay [2] to give Runner a Doppelganger counter, even if Doppelganger is not installed. Ignore this effect if Runner accesses Doppelganger from the Archives. Each Doppelganger counter causes Runner to lose [1] at the start of each of his or her turns. Runner may take an action to pay [4] to remove a Doppelganger counter. If Doppelganger is accessed from R&D, Runner must show it to you.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_counter_punish`, `access.corp_credit_loss_counter`, `access.punish`, `access.rnd_reveal_requirement`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `access_punish/on_access/runner/target=access.corp_credit_loss_counter`
- Conditions: `requires_accessed_card`, `requires_corp_credits_threshold`, `requires_rnd_top`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_counter_punish`, `access.corp_credit_loss_counter`, `access.punish`, `access.rnd_reveal_requirement`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_counter_credit_loss (medium)`
- Target/Constraints: not_required
- Änderung: Counter-Punish konkret als Runner-Credit-Loss-Counter. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Executive Boot Camp (onr_proteus_058_executive-boot-camp)

Set: proteus

Typ/Subtypen: `asset` / `node`

Kosten: Rez 0 / Trash 2

Regeltext: Discard a card at random: Gain [2]. Use this ability only during a run. At the end of the run, return to the bank any of the [2] you did not spend.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_run_temporary_credit`, `risk.random_discard_cost`, `risk.temporary_credit_drawback`
- Strategieanker: `corp.economy_rez_reserve`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/during_run/corp/amount=2`
- Conditions: `requires_during_run`

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_run_temporary_credit`, `risk.random_discard_cost`, `risk.temporary_credit_drawback`
- Strategieanker: `corp.economy_rez_reserve`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (medium)`
- Target/Constraints: schema_gap: private_random_discard_cost
- Änderung: Temporary run-only credits support rez/trace reserve with explicit random discard and temporary-credit drawbacks. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Government Contract (onr_proteus_059_government-contract)

Set: proteus

Typ/Subtypen: `asset` / `asset`, `node`

Kosten: Rez 2 / Trash 2

Regeltext: You may advance Government Contract before and after you rez it. Government Contract advancement counter: Gain [3]. Use these bits only to pay for installing or rezzing cards. When the turn ends, return to the bank any of the [3] you did not spend.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `economy.advanceable`, `economy.corp_install_rez_credit`, `risk.temporary_credit_drawback`
- Strategieanker: `corp.economy_rez_reserve`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/amount=3`
- Conditions: `requires_installed_card`, `requires_during_run`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `economy.advanceable`, `economy.corp_install_rez_credit`, `risk.temporary_credit_drawback`
- Strategieanker: `corp.economy_rez_reserve`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.economy_rez_reserve -> engine_anchor/install_rez_reserve (high)`
- Target/Constraints: candidate: use_target:install_or_rez_payment
- Änderung: Advanceable install/rez credits support reserve-sensitive Corp economy with temporary-credit risk. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### LDL Traffic Analyzers (onr_proteus_061_ldl-traffic-analyzers)

Set: proteus

Typ/Subtypen: `asset` / `asset`, `node`

Kosten: Rez 0 / Trash 4

Regeltext: You may advance LDL Traffic Analyzers before and after you rez it. You may rez LDL Traffic Analyzers during a trace attempt. LDL Traffic Analyzers advancement counter: Gain [5]. Use this ability only during a trace attempt. When the trace attempt ends, return to the bank any of the [5] you did not spend.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `economy.corp_trace_credit_support`, `risk.temporary_credit_drawback`, `trace.corp_credit_support`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace_credit/trace_window/corp/amount=5`
- Conditions: `requires_trace_attempt`, `requires_during_run`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_bank`, `economy.corp_trace_credit_support`, `risk.temporary_credit_drawback`, `trace.corp_credit_support`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_credit_enabler (medium)`
- Target/Constraints: candidate: use_target:trace_attempt
- Änderung: Advancement counters convert to trace-only credits, supporting trace lines without being a tag source. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Pattel Antibody (onr_proteus_068_pattel-antibody)

Set: proteus

Typ/Subtypen: `asset` / `ambush`, `node`, `virus`

Kosten: Rez 0 / Trash 0

Regeltext: When Runner accesses Pattel Antibody, you may pay [3] to put a Pattel counter on all installed icebreakers, even if Pattel Antibody is not installed. Ignore this effect if Runner accesses Pattel Antibody from the Archives. Each Pattel counter on an icebreaker reduces its strength by 1. If Pattel Antibody is accessed from R&D, Runner must show it to you.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_counter_punish`, `access.corp_icebreaker_strength_counter`, `access.punish`, `access.rnd_reveal_requirement`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `access_punish/on_access/runner/target=access.corp_icebreaker_strength_counter`
- Conditions: `requires_accessed_card`, `requires_corp_credits_threshold`, `requires_rnd_top`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.archives_safe_exception`, `access.corp_counter_punish`, `access.corp_icebreaker_strength_counter`, `access.punish`, `access.rnd_reveal_requirement`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_counter_icebreaker_strength (medium)`
- Target/Constraints: candidate: use_target:installed_icebreaker
- Änderung: Counter-Punish konkret als Icebreaker-Strength-Counter. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Siren (onr_proteus_074_siren)

Set: proteus

Typ/Subtypen: `asset` / `node`

Kosten: Rez 3 / Trash 0

Regeltext: Rez Siren when you install it. Install Siren only if you can pay to rez it. [1]: Runner must make a run on the fort Siren is installed in, if possible, instead of on the fort he or she was originally going to make a run on. Use this ability only at the start of a run.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `remote.scoring_protection`, `run.corp_redirect`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: _keine_
- Effekte: `run_lock/during_run/runner`
- Conditions: `requires_during_run`, `requires_remote_server`

Empfohlener Nachher-Stand:
- Taktiksignale: `remote.scoring_protection`, `run.corp_redirect`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.remote_scoring -> defensive_tool/remote_run_control (high)`
- Target/Constraints: schema_gap: run_redirect_fort_choice
- Änderung: Run redirect/control supports remote defense but adds no planner or legality behavior. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Stereogram Antibody (onr_proteus_075_stereogram-antibody)

Set: proteus

Typ/Subtypen: `asset` / `ambush`, `node`, `virus`

Kosten: Rez 0 / Trash 0

Regeltext: When Runner accesses Stereogram Antibody from the Archives, do 1 Net damage and shuffle Stereogram Antibody into R&D.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `access.corp_archives_net_damage_ambush`, `access.corp_net_damage_ambush`, `access.punish`, `damage.payoff`, `rnd.corp_self_shuffle_access`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `damage/on_access/runner/amount=1/target=access.corp_archives_net_damage_ambush`, `zone_shuffle/on_access/rnd/target=rnd.corp_self_shuffle_access`
- Conditions: `requires_archives_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `access.corp_archives_net_damage_ambush`, `access.corp_net_damage_ambush`, `access.punish`, `damage.payoff`, `rnd.corp_self_shuffle_access`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_net_damage_payoff (medium)`
- Target/Constraints: not_required
- Änderung: Archives selbst ist der Trigger; keine Archives-safe-exception. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Syd Meyer Superstores (onr_proteus_076_syd-meyer-superstores)

Set: proteus

Typ/Subtypen: `asset` / `asset`, `node`

Kosten: Rez 0 / Trash 2

Regeltext: A: Trash a rezzed piece of ice. Gain [4].

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_asset_cashout`, `ice.corp_self_trash_cost`, `risk.trash_own_rezzed_ice`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/amount=4/target=economy.corp_asset_cashout`, `ice_trash/action/ice/target=ice.corp_self_trash_cost`
- Conditions: `requires_rezzed_ice`

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_asset_cashout`, `ice.corp_self_trash_cost`, `risk.trash_own_rezzed_ice`
- Strategieanker: `corp.asset_economy`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.asset_economy -> payoff_anchor/high_risk_economy_payoff (medium)`
- Target/Constraints: candidate: use_target:own_rezzed_ice
- Änderung: Cashout durch Trash eigener rezzed ICE; kein Install-Discount und keine Temporary-Rez-Liability. Node/Asset type and subtypes remain card data and are not mirrored as tactic signals.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`
