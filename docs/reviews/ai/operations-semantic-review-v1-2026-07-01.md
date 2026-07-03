# Operations Semantic Review v1

Status: `review-only`

Stand: 2026-07-01

Dieser Bericht prüft alle aktiven Corp-Operations analog zum Agenda-Review. Er ändert keine AI-Daten; er dokumentiert den Ist-Stand und einen empfohlenen Nachher-Stand für Taktiksignale, Strategieanker und hierarchische `strategySupportPairs`.

## Zusammenfassung

- Scope: 38 Corp-Operations (classic: 3, originalset-v1: 27, proteus: 8).
- Aktuell: 38 mit Taktiksignalen, 24 mit losem Strategieanker, 24 mit loser Rolle, 0 mit `strategySupportPairs`.
- Empfohlen: 29 Karten mit Strategieanker, 9 bewusst support-only, 35 StrategySupportPairs.
- Review-Status: kleine Änderung: 21, ändern: 8, behalten: 9.

## Wichtigste Befunde

1. Die Operation-Hints haben noch nicht den Agenda-Stand erreicht: Es gibt lose `lineSupport`-/`strategicRole`-Felder, aber keine hierarchischen `strategySupportPairs`.
2. Reine Economy-/Draw-Operations sollten support-only bleiben; sie sind nützlich, aber kein eigener Strategieanker.
3. Tag-Operations müssen sauber zwischen Tag-Quelle, Tagged-Runner-Payoff und Damage-Kill-Payoff getrennt werden.
4. Extra-Action-Operations sollten den neuen `corp.action_tempo`-Anker nutzen.
5. Advancement-Operations sollten `corp.fast_advance` tragen und bei Overadvance-Signalen zusätzlich `corp.overadvance_value` unterstützen.
6. ICE-Rez-/ICE-Recovery-/ICE-Rearrange-Operations gehören unter `corp.ice_tax_glacier`, wenn sie echte ICE-Struktur- oder Rez-Fenster schaffen.

## Empfohlene Strategieanker-Verteilung

- `corp.action_tempo`: 3
- `corp.damage_kill`: 3
- `corp.deck_recycle_engine`: 1
- `corp.fast_advance`: 5
- `corp.ice_tax_glacier`: 4
- `corp.overadvance_value`: 3
- `corp.tag_trace_punish`: 16

## Kartenreview

### Badtimes (onr_classic_016_badtimes)

Set: classic

Kosten: 4

Regeltext: Play only if Runner is tagged. Runner's MU is reduced by 2 until end of turn.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `global_modifier/action/runner/memory amount=-2`, `program_trash/action/installed_program`, `tag_punish_payoff/action/runner/memory amount=2`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_memory_pressure (medium)`
- Target/Constraints: keine Zielwahl; Wirkung trifft Runner-MU und daraus folgende legale Programmauswahl.
- Änderung: `strategySupportPairs` ergänzen; Taktiksignal bleibt vorerst ausreichend, aber Memory-Druck ist noch zu grob.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Corporate Shuffle (onr_classic_017_corporate-shuffle)

Set: classic

Kosten: 0

Regeltext: Draw five cards, then shuffle a card stored in HQ into R&D. Playing a double operation costs two consecutive actions this turn instead of one.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `support_tool`
- StrategySupportPairs: _keine_
- Effekte: `draw/action/corp/cards amount=5`, `zone_shuffle/action/rnd/cards amount=1`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`
- Strategieanker: `corp.deck_recycle_engine`
- Strategische Rollen: `support_tool`
- StrategySupportPairs: `corp.deck_recycle_engine -> support_tool/hand_refresh_rnd_shuffle (medium)`
- Target/Constraints: Corp wählt eine eigene HQ-Karte; keine Runner-seitige Hidden-Info-Projektion.
- Änderung: `corp.central_stabilize` durch `corp.deck_recycle_engine` ersetzen und Pair ergänzen.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategySupportPairs`

### Reclamation Project (onr_classic_018_reclamation-project)

Set: classic

Kosten: 0

Regeltext: Search the archives for any number of ice cards. Show those cards to Runner, then store them in HQ. Playing a double operation costs two consecutive actions this turn instead of one.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `archives.corp_recovery`, `ice.recovery`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `support_tool`
- StrategySupportPairs: _keine_
- Effekte: `card_recovery/action/archives/cards`, `search/action/archives/cards`
- Conditions: `requires_archives_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `archives.corp_recovery`, `ice.recovery`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `support_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> support_tool/archives_ice_recovery (high)`
- Target/Constraints: Corp wählt ICE aus Archives; gewählte Karten werden Runner gezeigt, danach HQ.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Accounts Receivable (onr_v1_281_accounts-receivable)

Set: originalset-v1

Kosten: 5

Regeltext: Gain 9.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/credits amount=9`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Support-only belassen; generische Economy ist kein Strategieanker.
- Geänderte Felder bei Umsetzung: _keine_

### Annual Reviews (onr_v1_282_annual-reviews)

Set: originalset-v1

Kosten: 0

Regeltext: Draw three cards.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `draw/action/corp/cards amount=3`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Support-only belassen; einmaliger Draw ist kein Draw-Engine-Anker.
- Geänderte Felder bei Umsetzung: _keine_

### Audit of Call Records (onr_v1_283_audit-of-call-records)

Set: originalset-v1

Kosten: 0

Regeltext: Play only if Runner attempted two or more runs during last turn. Trace 5 - If successful, give Runner 1 tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.multiple_runs_last_turn`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace/action/runner amount=5`, `tag_source/trace_success/runner/tags amount=1`
- Conditions: `requires_runner_action`, `requires_trace_success`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.multiple_runs_last_turn`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_tag_source (high)`
- Target/Constraints: Trace-Bidding über LegalActions; keine freie Zielwahl.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Chance Observation (onr_v1_284_chance-observation)

Set: originalset-v1

Kosten: 2

Regeltext: Play only if Runner attempted a run during last turn. Trace 5 - If successful, give Runner 1 tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.last_turn_run`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace/action/runner amount=5`, `tag_source/trace_success/runner/tags amount=1`
- Conditions: `requires_trace_success`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.last_turn_run`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_tag_source (high)`
- Target/Constraints: Trace-Bidding über LegalActions; keine freie Zielwahl.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Closed Accounts (onr_v1_285_closed-accounts)

Set: originalset-v1

Kosten: 1

Regeltext: Play only if Runner is tagged. Runner loses all bits.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `tag_punish_payoff/action/runner/credits`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_credit_punish (high)`
- Target/Constraints: keine Zielwahl; Runner verliert Credits.
- Änderung: Hierarchisches Payoff-Pair ergänzen; optional später präzises Credit-loss-Signal ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Corporate Detective Agency (onr_v1_286_corporate-detective-agency)

Set: originalset-v1

Kosten: 1

Regeltext: Play only if Runner is tagged. Trash up to two Resources at no cost.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `resource.trash_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `resource_trash/action/runner amount=2`, `tag_punish_payoff/action/runner amount=2`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `resource.trash_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_resource_trash (high)`
- Target/Constraints: Bis zu zwei installierte Ressourcen; sichtbare/legale Ziele.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Datapool by Zetatech (onr_v1_287_datapool-by-zetatech)

Set: originalset-v1

Kosten: 1

Regeltext: Play only if Runner is tagged. Give Runner two tags.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/action/runner/tags amount=2`, `tag_punish_payoff/action/runner/tags amount=2`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/tag_snowball_source (high)`
- Target/Constraints: keine Zielwahl.
- Änderung: Pair ergänzen; bei Umsetzung prüfen, ob zusätzlich `tag.source` aufgenommen und `tag.payoff` enger benannt werden sollte.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Day Shift (onr_v1_288_day-shift)

Set: originalset-v1

Kosten: 0

Regeltext: Draw two cards and gain 1.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `draw/action/corp/cards amount=2`, `economy/action/corp/credits amount=1`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Support-only belassen.
- Geänderte Felder bei Umsetzung: _keine_

### Edgerunner, Inc., Temps (onr_v1_289_edgerunner-inc-temps)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Gain three consecutive actions, which you may use only to install cards. You are not required to take all three of these actions.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `action.corp_install_action_bundle`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `install/action/corp`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_install_action_bundle`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.action_tempo -> enabler/install_only_action_bundle (medium)`
- Target/Constraints: Folgeaktionen dürfen nur legale Install-LegalActions sein.
- Änderung: Neuen `corp.action_tempo`-Anker und Pair ergänzen; optional Signal auf `action.corp_install_only_action` normalisieren.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Efficiency Experts (onr_v1_290_efficiency-experts)

Set: originalset-v1

Kosten: 0

Regeltext: Gain 3.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/credits amount=3`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Support-only belassen.
- Geänderte Felder bei Umsetzung: _keine_

### Falsified-Transactions Expert (onr_v1_291_falsified-transactions-expert)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Move up to three advancement counters from one card to another installed card that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.corp_counter_transfer`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance/action/installed_card/advancement_counters amount=3`
- Conditions: `requires_advancement_counter`, `requires_installed_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.corp_counter_transfer`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/advancement_counter_reposition (high)`
- Target/Constraints: Von einer Karte auf eine installierte advancebare Karte; nur legale/side-safe Ziele.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Management Shake-Up (onr_v1_292_management-shake-up)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Add three advancement counters to any combination of installed cards that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance_burst/action/score_area/advancement_counters`
- Conditions: `requires_installed_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`, `corp.overadvance_value`
- Strategische Rollen: `scoring_tool`, `enabler`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/advance_counter_burst (high)`; `corp.overadvance_value -> enabler/overadvance_counter_burst (medium)`
- Target/Constraints: Any combination of installed advanceable cards; Hidden-Info nur Corp-seitig.
- Änderung: Pairs für Fast-Advance und Overadvance ergänzen.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Netwatch Credit Voucher (onr_v1_293_netwatch-credit-voucher)

Set: originalset-v1

Kosten: 0

Regeltext: Play only if Runner is tagged. Give Runner 1 tag and gain 1.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `economy.corp_credit_burst`, `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/action/runner/tags amount=1`, `tag_punish_payoff/action/runner/tags amount=1`, `economy/action/corp/credits amount=1`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`, `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/tag_snowball_credit_source (medium)`
- Target/Constraints: keine Zielwahl.
- Änderung: Pair ergänzen; `tag.payoff` später enger von `tag.source`/Snowball trennen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### New Blood (onr_v1_294_new-blood)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Conceal all revealed but unrezzed ice; then rearrange your installed ice by swapping pairs of ice while Runner looks away.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `ice.corp_rearrange_conceal`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `zone_shuffle/action/ice`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_rearrange_conceal`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> defensive_tool/ice_rearrange_conceal (medium)`
- Target/Constraints: Corp ordnet eigene ICE; Runner darf neue verdeckte Ordnung nicht aus KI-/Inspector-Daten ableiten.
- Änderung: `corp.ice_tax_glacier`-Pair ergänzen; Hidden-Info-Hinweis im Report festhalten.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Night Shift (onr_v1_295_night-shift)

Set: originalset-v1

Kosten: 0

Regeltext: Gain 2 and draw one card.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/credits amount=2`, `draw/action/corp/cards amount=1`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Support-only belassen.
- Geänderte Felder bei Umsetzung: _keine_

### Off-Site Backups (onr_v1_296_off-site-backups)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Bring any card from the Archives into HQ.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `archives.corp_recovery`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `card_recovery/action/archives`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `archives.corp_recovery`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: Corp wählt Archives-Karte; side-safe eigene Zone.
- Änderung: Support-only belassen; kein bestehender Strategieanker für allgemeine Archives-Recovery.
- Geänderte Felder bei Umsetzung: _keine_

### Overtime Incentives (onr_v1_297_overtime-incentives)

Set: originalset-v1

Kosten: 4

Regeltext: Gain two actions.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `action.corp_extra_action_support`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `extra_action/action/corp/actions`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_extra_action_support`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.action_tempo -> payoff_anchor/extra_action_burst (high)`
- Target/Constraints: keine Zielwahl; Folgezuege bleiben LegalActions.
- Änderung: `corp.action_tempo`-Pair ergänzen; Signal optional auf `action.corp_extra_action` normalisieren.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Planning Consultants (onr_v1_298_planning-consultants)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Look at the top five cards of R&D and arrange them in any order you choose.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `rnd.corp_topdeck_reorder`, `rnd.corp_topdeck_setup`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `topdeck_info/action/rnd`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `rnd.corp_topdeck_reorder`, `rnd.corp_topdeck_setup`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: Corp sieht/ordnet R&D top 5; keine Runner-Info.
- Änderung: Support-only belassen; wichtiger Hidden-Info-Hinweis.
- Geänderte Felder bei Umsetzung: _keine_

### Power Grid Overload (onr_v1_299_power-grid-overload)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Play only if Runner is tagged. Trash X pieces of hardware, other than cybernetics.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `hardware.trash_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: _keine_
- Effekte: `hardware_trash/action/runner`, `tag_punish_payoff/action/runner`
- Conditions: `requires_runner_tagged`, `requires_installed_hardware`

Empfohlener Nachher-Stand:
- Taktiksignale: `hardware.trash_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_hardware_trash (high)`
- Target/Constraints: X Hardware außer Cybernetics; nur sichtbare/legale installierte Hardware.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Project Consultants (onr_v1_300_project-consultants)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Add four advancement counters to any combination of installed cards that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance_burst/action/score_area/advancement_counters`
- Conditions: `requires_installed_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`, `corp.overadvance_value`
- Strategische Rollen: `scoring_tool`, `enabler`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/advance_counter_burst (high)`; `corp.overadvance_value -> enabler/overadvance_counter_burst (medium)`
- Target/Constraints: Any combination of installed advanceable cards; Hidden-Info nur Corp-seitig.
- Änderung: Pairs für Fast-Advance und Overadvance ergänzen.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Punitive Counterstrike (onr_v1_301_punitive-counterstrike)

Set: originalset-v1

Kosten: 0

Regeltext: Play only if Runner is tagged. Do 2 meat damage.

Review-Status: kleine Änderung; Priorität: high.

Ist-Stand:
- Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`, `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `damage/action/runner/damage amount=2`, `tag_punish_payoff/action/runner/damage amount=2`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/tagged_meat_damage_payoff (high)`; `corp.tag_trace_punish -> punish_payoff/tagged_runner_punish_payoff (high)`
- Target/Constraints: keine Zielwahl; damage prevention/flatline bleibt Engine-Vertrag.
- Änderung: Zwei hierarchische Payoff-Pairs ergänzen.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Scorched Earth (onr_v1_302_scorched-earth)

Set: originalset-v1

Kosten: 3

Regeltext: Play only if Runner is tagged. Do 4 meat damage.

Review-Status: kleine Änderung; Priorität: high.

Ist-Stand:
- Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `damage/action/runner/damage amount=4`, `tag_punish_payoff/action/runner/damage amount=4`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`, `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_damage_closeout (high)`; `corp.tag_trace_punish -> punish_payoff/tagged_runner_punish_payoff (high)`
- Target/Constraints: keine Zielwahl; damage prevention/flatline bleibt Engine-Vertrag.
- Änderung: Zwei hierarchische Payoff-Pairs ergänzen; `win_condition` an Damage-Pair binden.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Silver Lining Recovery Protocol (onr_v1_303_silver-lining-recovery-protocol)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: If any agendas were stolen during Runner's last turn, gain bits equal to three times the number of advancement counters those agendas had.

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `condition.agenda_stolen_last_turn`, `economy.corp_conditional_credit`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/credits`
- Conditions: `requires_stolen_agenda_last_turn`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.agenda_stolen_last_turn`, `economy.corp_conditional_credit`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Reactive Economy bleibt support-only.
- Geänderte Felder bei Umsetzung: _keine_

### Systematic Layoffs (onr_v1_304_systematic-layoffs)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Add two advancement counters to any combination of installed cards that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance_burst/action/score_area/advancement_counters amount=2`
- Conditions: `requires_installed_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`, `corp.overadvance_value`
- Strategische Rollen: `scoring_tool`, `enabler`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/advance_counter_burst (high)`; `corp.overadvance_value -> enabler/overadvance_counter_burst (medium)`
- Target/Constraints: Any combination of installed advanceable cards.
- Änderung: Pairs für Fast-Advance und Overadvance ergänzen.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Team Restructuring (onr_v1_305_team-restructuring)

Set: originalset-v1

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Add one advancement counter to each of up to two installed cards that can be advanced.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: _keine_
- Effekte: `advance/action/score_area/advancement_counters`
- Conditions: `requires_score_window`

Empfohlener Nachher-Stand:
- Taktiksignale: `advance.agenda_counter`, `advance.score_window_support`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.fast_advance -> scoring_tool/distributed_advance_counter_support (medium)`
- Target/Constraints: Bis zu zwei installierte advancebare Karten.
- Änderung: Hierarchisches Fast-Advance-Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Trojan Horse (onr_v1_306_trojan-horse)

Set: originalset-v1

Kosten: 2

Regeltext: Play only if Runner stole any agendas during his or her last turn. Give Runner a tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.agenda_stolen_last_turn`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/action/runner/tags amount=1`
- Conditions: `requires_stolen_agenda_last_turn`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.agenda_stolen_last_turn`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/retaliatory_tag_source (medium)`
- Target/Constraints: keine Zielwahl.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Urban Renewal (onr_v1_307_urban-renewal)

Set: originalset-v1

Kosten: 6

Regeltext: Play only if Runner is tagged. Do 5 meat damage.

Review-Status: kleine Änderung; Priorität: high.

Ist-Stand:
- Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: _keine_
- Effekte: `damage/action/runner/damage amount=5`, `tag_punish_payoff/action/runner/damage amount=5`
- Conditions: `requires_runner_tagged`

Empfohlener Nachher-Stand:
- Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `win_condition`, `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_damage_closeout (high)`; `corp.tag_trace_punish -> punish_payoff/tagged_runner_punish_payoff (high)`
- Target/Constraints: keine Zielwahl; damage prevention/flatline bleibt Engine-Vertrag.
- Änderung: Zwei hierarchische Payoff-Pairs ergänzen; `win_condition` an Damage-Pair binden.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Corporate Guard(R) Temps (onr_proteus_046_corporate-guard-r-temps)

Set: proteus

Kosten: 0

Regeltext: Pay two times [X] when you play Corporate Guard(R) Temps, to gain an action during each of your next X turns. Forfeit the next [X] you gain.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `action.corp_future_extra_action`, `risk.agenda_forfeit_drawback`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `extra_action/corp_turn/corp/actions`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `action.corp_future_extra_action`, `risk.agenda_forfeit_drawback`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.action_tempo -> engine_anchor/delayed_recurring_extra_action_engine (medium)`
- Target/Constraints: X wird beim Spielen bezahlt; Folgeaktionen/Forfeit bleiben LegalAction-/Engine-Vertrag.
- Änderung: `corp.action_tempo`-Pair ergänzen.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Credit Consolidation (onr_proteus_047_credit-consolidation)

Set: proteus

Kosten: 10

Regeltext: Gain [15].

Review-Status: behalten; Priorität: low.

Ist-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `economy/action/corp/credits`
- Conditions: _keine_

Empfohlener Nachher-Stand:
- Taktiksignale: `economy.corp_credit_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Target/Constraints: keine Zielwahl.
- Änderung: Support-only belassen.
- Geänderte Felder bei Umsetzung: _keine_

### Data Sifters (onr_proteus_048_data-sifters)

Set: proteus

Kosten: 4

Regeltext: Play only if Runner trashed any nodes during his or her last turn. Give Runner a tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.node_trashed_last_turn`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `tag_source/action/runner/tags amount=1`
- Conditions: `requires_installed_card`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.node_trashed_last_turn`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/retaliatory_tag_source (medium)`
- Target/Constraints: keine Zielwahl.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Emergency Rig (onr_proteus_049_emergency-rig)

Set: proteus

Kosten: variabel/nicht numerisch im Datenmodell

Regeltext: Rez a piece of ice, at no cost. Put X Kludge counters on that piece of ice; X cannot be 0. At the start of each of your turns, remove a Kludge counter. Trash that piece of ice when the last Kludge counter is removed from it.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `ice.corp_free_rez`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: _keine_
- Effekte: `rez/action/ice`
- Conditions: `requires_installed_ice`

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_free_rez`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.ice_tax_glacier -> enabler/temporary_free_rez_ice (medium)`
- Target/Constraints: Wähle installierte ICE; Rez-/Counter-/Trash-Folge ist Engine-Vertrag.
- Änderung: Hierarchisches Pair ergänzen; Rolle von losem `tax_tool` auf `enabler` präzisieren.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

### Manhunt (onr_proteus_050_manhunt)

Set: proteus

Kosten: 4

Regeltext: Play only if Runner attempted a run during his or her last turn. Trace 6-If trace is successful, give Runner one tag for each point by which your trace exceeded his or her link.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.last_turn_run`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace/action/runner`, `tag_source/trace_success/runner/tags amount=1`
- Conditions: `requires_trace_success`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.last_turn_run`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/scaling_trace_tag_source (high)`
- Target/Constraints: Trace-Bidding über LegalActions.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Rent-to-Own Contract (onr_proteus_051_rent-to-own-contract)

Set: proteus

Kosten: 0

Regeltext: Rez a piece of ice, at no cost. Put on that ice a number of Term counters equal to its rez cost. At the start of each of your turns, if you have at least [2], lose [2] and remove one of these Term counters; otherwise, put a Term counter on that piece of ice.

Review-Status: ändern; Priorität: medium.

Ist-Stand:
- Taktiksignale: `ice.corp_deferred_rez`, `ice.corp_installment_rez`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_
- Effekte: `rez/action/ice`, `rez/corp_turn/ice`
- Conditions: `requires_installed_ice`

Empfohlener Nachher-Stand:
- Taktiksignale: `ice.corp_deferred_rez`, `ice.corp_installment_rez`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.ice_tax_glacier -> enabler/installment_free_rez_ice (medium)`
- Target/Constraints: Wähle installierte ICE; Term-Counter und Zahlung/Verlängerung bleiben Engine-Vertrag.
- Änderung: Neuen `corp.ice_tax_glacier`-Anker und Pair ergänzen.
- Geänderte Felder bei Umsetzung: `lineSupport`, `strategicRole`, `strategySupportPairs`

### Schlaghund Pointers (onr_proteus_052_schlaghund-pointers)

Set: proteus

Kosten: 6

Regeltext: Play only if Runner has attempted a run this game. Trace 3-If trace is successful, give Runner a tag. Pay [1], in addition to the normal cost, for each point of trace above 0.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.run_this_game`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace/action/runner`, `tag_source/trace_success/runner/tags amount=1`
- Conditions: `requires_runner_action`, `requires_trace_success`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.run_this_game`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/paid_trace_tag_source (medium)`
- Target/Constraints: Trace-Bidding/Kosten über LegalActions.
- Änderung: Hierarchisches Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategySupportPairs`

### Underworld Mole (onr_proteus_053_underworld-mole)

Set: proteus

Kosten: 6

Regeltext: Play only if Runner installed any resources during his or her last turn. Trace 4-If trace is successful, trash a resource Runner installed during his or her last turn and give Runner a tag.

Review-Status: kleine Änderung; Priorität: medium.

Ist-Stand:
- Taktiksignale: `condition.resource_installed_last_turn`, `resource.trash_payoff`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: _keine_
- Effekte: `trace/action/runner amount=4`, `resource_trash/trace_success/runner`, `tag_source/trace_success/runner/tags amount=1`
- Conditions: `requires_installed_resource`, `requires_trace_success`

Empfohlener Nachher-Stand:
- Taktiksignale: `condition.resource_installed_last_turn`, `resource.trash_payoff`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/trace_resource_trash_tag_payoff (high)`
- Target/Constraints: Nur Ressourcen, die Runner letzte Runde installierte; Trace und Zielwahl legal/side-safe.
- Änderung: Hierarchisches Payoff-Pair ergänzen.
- Geänderte Felder bei Umsetzung: `strategicRole`, `strategySupportPairs`

## Handoff

Für eine Umsetzung sollte ein eigenes Implementation-Paket die empfohlenen `strategySupportPairs` in `data/ai/ai-card-hints-active.json` ergänzen, ggf. wenige Taktiksignal-Normalisierungen vornehmen, compiled hints und Inspector-Index regenerieren und die AI-/Web-Inspector-Tests auf Operation-Pairs erweitern.
