# Operations Semantic Review v2 Implementation

Status: umgesetzt im Arbeitsbranch `codex/operations-semantic-review-v2`
Stand: 2026-07-01

## Kurzfazit

- 38 Corp-Operations nach Review v2 aktualisiert.
- Review-Status: ändern: 19, kleine Änderung: 13, behalten: 6.
- Prioritäten: high: 16, medium: 14, low: 8.
- Bestätigte StrategySupportPairs: 29 auf 25 Karten.
- Candidate/deferred-Hinweise: 6; keine produktiven Pairs für `corp.action_tempo`, `corp.overadvance_value` oder `corp.deck_recycle_engine`.
- Änderungen sind reine AI-Hint-Metadaten; keine Engine-, LegalAction-, Planner-, UI-, Replay- oder Hidden-Info-Vertragsänderung.

## Verifikation

- `node scripts/check-operations-semantic-review-v2.mjs`: grün.
- `pnpm --filter @netgrid/ai test -- hint-ontology`: blockiert vor Testausführung durch `ERR_PNPM_IGNORED_BUILDS` für `esbuild`/`sharp` während Dependency-Install.
- `git diff --check`: wird im Paketabschluss und Integrationsabschluss ausgeführt.

## Karten

### Badtimes (`onr_classic_016_badtimes`)

- Review: ändern, Priorität medium, Bucket `tagged_runner_payoff / memory_pressure`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`.
- Vorher Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `tag.runner_memory_pressure`, `runner.memory_reduction`, `risk.program_cleanup_after_mu_loss`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_memory_pressure (medium)`
- Target/Constraints: Keine Corp-Zielwahl. Wirkung reduziert Runner-MU; daraus folgende Programm-Auswahl/Trash ist Engine-/Runner-Entscheidung und darf nicht als Corp-Targeting modelliert werden.
- Taxonomie-Follow-up: Präzises Signal für tagged-runner memory pressure katalogisieren; tag.payoff nur als Oberklasse behalten.

### Corporate Shuffle (`onr_classic_017_corporate-shuffle`)

- Review: ändern, Priorität high, Bucket `draw_hand_refresh / support_only`.
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`.
- Vorher Taktiksignale: `draw.corp_draw`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`
- Nachher Taktiksignale: `draw.corp_draw`, `hq.corp_hand_refresh`, `rnd.corp_shuffle_hq_into_rnd`, `risk.double_operation_action_cost`
- Vorher Strategieanker/Rollen: `corp.central_stabilize` / `support_tool`
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Corp wählt eine eigene HQ-Karte für R&D. Keine Runner-Zielwahl; keine kontrollierte Topdeck-Strategie ableiten.
- Taxonomie-Follow-up: corp.deck_recycle_engine hier nicht setzen. Falls später eine Deck-Recycle-Strategy existiert, sollte diese wiederholbare/zentral deckprägende Effekte verlangen.

### Reclamation Project (`onr_classic_018_reclamation-project`)

- Review: kleine Änderung, Priorität medium, Bucket `ice_recovery / glacier_support`.
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `archives.corp_recovery`, `ice.recovery`
- Nachher Taktiksignale: `archives.corp_recovery`, `hq.corp_ice_recovery`, `ice.corp_recovery`, `info.reveal_recovered_cards_to_runner`, `risk.double_operation_action_cost`
- Vorher Strategieanker/Rollen: `corp.ice_tax_glacier` / `support_tool`
- Nachher Strategieanker/Rollen: `corp.ice_tax_glacier` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.ice_tax_glacier -> enabler/archives_ice_restock (medium)`
- Target/Constraints: Corp wählt beliebig viele ICE aus Archives; gewählte Karten werden Runner gezeigt und in HQ gespeichert. Zielprofil: eigene Archives-Karten, Typ ICE.
- Taxonomie-Follow-up: ice.recovery ggf. auf ice.corp_recovery normalisieren.

### Accounts Receivable (`onr_v1_281_accounts-receivable`)

- Review: behalten, Priorität low, Bucket `economy_support`.
- Geänderte Felder: _keine_.
- Vorher Taktiksignale: `economy.corp_credit_burst`
- Nachher Taktiksignale: `economy.corp_credit_burst`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl.

### Annual Reviews (`onr_v1_282_annual-reviews`)

- Review: behalten, Priorität low, Bucket `draw_support`.
- Geänderte Felder: _keine_.
- Vorher Taktiksignale: `draw.corp_draw`
- Nachher Taktiksignale: `draw.corp_draw`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl.

### Audit of Call Records (`onr_v1_283_audit-of-call-records`)

- Review: kleine Änderung, Priorität medium, Bucket `trace_tag_source`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `condition.multiple_runs_last_turn`, `tag.source`, `trace.source`
- Nachher Taktiksignale: `condition.runner_attempted_multiple_runs_last_turn`, `trace.source`, `tag.source`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/retaliatory_multiple_run_tag_source (high)`
- Target/Constraints: Keine Zielwahl; Trace-Bidding über LegalActions. Spielbar nur, wenn Runner letzte Runde mindestens zwei Runs versucht hat.
- Taxonomie-Follow-up: condition.multiple_runs_last_turn zu condition.runner_attempted_multiple_runs_last_turn normalisieren.

### Chance Observation (`onr_v1_284_chance-observation`)

- Review: kleine Änderung, Priorität medium, Bucket `trace_tag_source`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `condition.last_turn_run`, `tag.source`, `trace.source`
- Nachher Taktiksignale: `condition.runner_attempted_run_last_turn`, `trace.source`, `tag.source`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/retaliatory_run_tag_source (high)`
- Target/Constraints: Keine Zielwahl; Trace-Bidding über LegalActions. Spielbar nur nach Runner-Run im letzten Runnerzug.
- Taxonomie-Follow-up: condition.last_turn_run zu condition.runner_attempted_run_last_turn normalisieren.

### Closed Accounts (`onr_v1_285_closed-accounts`)

- Review: ändern, Priorität high, Bucket `tagged_runner_payoff / credit_loss`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`.
- Vorher Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `economy.runner_credit_loss`, `tag.runner_credit_punish`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_credit_lockout (high)`
- Target/Constraints: Keine Zielwahl; betrifft Runner-Creditpool vollständig.
- Taxonomie-Follow-up: economy.runner_credit_loss und tag.runner_credit_punish katalogisieren bzw. als präzise Varianten nutzen.

### Corporate Detective Agency (`onr_v1_286_corporate-detective-agency`)

- Review: ändern, Priorität medium, Bucket `tagged_runner_payoff / resource_trash`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`.
- Vorher Taktiksignale: `resource.trash_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `target.runner_resource_trash`, `tag.runner_resource_trash_payoff`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_resource_trash (high)`
- Target/Constraints: TargetProfile nötig: bis zu zwei installierte Runner-Resources, sichtbare/legale Ziele, Trash at no cost.
- Taxonomie-Follow-up: resource.trash_payoff durch target.runner_resource_trash/tag.runner_resource_trash_payoff präzisieren.

### Datapool by Zetatech (`onr_v1_287_datapool-by-zetatech`)

- Review: ändern, Priorität high, Bucket `tag_snowball_followup`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`.
- Vorher Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Nachher Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_source`, `tag_snowball_followup`, `tag.payoff`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/additional_tag_amplifier (high)`
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: tag.additional_tag_followup auf tag.additional_tag_source/tag_snowball_followup normalisieren; tag.source nicht als initiale Quelle verwenden.

### Day Shift (`onr_v1_288_day-shift`)

- Review: behalten, Priorität low, Bucket `draw_economy_support`.
- Geänderte Felder: _keine_.
- Vorher Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Nachher Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl.

### Edgerunner, Inc., Temps (`onr_v1_289_edgerunner-inc-temps`)

- Review: ändern, Priorität high, Bucket `action_tempo_candidate / install_burst`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `action.corp_install_action_bundle`
- Nachher Taktiksignale: `action.corp_install_only_action_bundle`, `install.corp_action_bundle`, `tempo.corp_install_burst`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Candidate/deferred: OPS-V2: Strategy candidate/deferred: candidate: corp.action_tempo -> enabler/install_only_action_bundle (medium), falls Strategy ID bewusst eingeführt wird
- Target/Constraints: Folgeaktionen dürfen nur legale Install-Actions sein; nicht alle drei müssen genommen werden.
- Taxonomie-Follow-up: corp.action_tempo als Strategy-ID separat entscheiden. Bis dahin support-only mit StrategyCandidate/deferred.

### Efficiency Experts (`onr_v1_290_efficiency-experts`)

- Review: behalten, Priorität low, Bucket `economy_support`.
- Geänderte Felder: _keine_.
- Vorher Taktiksignale: `economy.corp_credit_burst`
- Nachher Taktiksignale: `economy.corp_credit_burst`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl.

### Falsified-Transactions Expert (`onr_v1_291_falsified-transactions-expert`)

- Review: kleine Änderung, Priorität medium, Bucket `advancement_counter_transfer / fast_advance`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `advance.corp_counter_transfer`, `advance.score_window_support`
- Nachher Taktiksignale: `advance.corp_counter_transfer`, `advance.counter_reallocation`, `advance.score_window_support`, `condition.requires_advancement_counter`, `condition.requires_installed_advanceable_card`
- Vorher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Nachher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.fast_advance -> scoring_tool/advancement_counter_reposition (high)`
- Target/Constraints: TargetProfile nötig: Quelle mit bis zu drei vorhandenen Advancement-Countern; Ziel ist andere installierte Karte, die advanced werden kann.
- Taxonomie-Follow-up: advance.corp_counter_transfer und advance.counter_reallocation ggf. zusammenführen; keine counter_placement-Signale verwenden.

### Management Shake-Up (`onr_v1_292_management-shake-up`)

- Review: ändern, Priorität high, Bucket `advancement_counter_burst / fast_advance / overadvance_candidate`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Nachher Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_burst`, `advance.score_window_support`, `advance.overadvance_support`, `condition.requires_installed_advanceable_card`
- Vorher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Nachher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.fast_advance -> scoring_tool/advance_counter_burst (high)`
- Candidate/deferred: OPS-V2: Strategy candidate/deferred: candidate: corp.overadvance_value -> enabler/overadvance_counter_burst (medium), falls Strategy ID beschlossen wird
- Target/Constraints: TargetProfile nötig: drei Advancement-Counter in beliebiger Kombination auf installierte advancebare Karten; eigene hidden information bleibt Corp-seitig.
- Taxonomie-Follow-up: corp.overadvance_value separat entscheiden; bis dahin nur als candidate/deferred ausweisen.

### Netwatch Credit Voucher (`onr_v1_293_netwatch-credit-voucher`)

- Review: ändern, Priorität high, Bucket `tag_snowball_followup / minor_economy`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`.
- Vorher Taktiksignale: `economy.corp_credit_burst`, `risk.requires_tagged_runner`, `tag.additional_tag_followup`, `tag.payoff`
- Nachher Taktiksignale: `risk.requires_tagged_runner`, `tag.additional_tag_source`, `tag_snowball_followup`, `economy.corp_credit_burst`, `tag.payoff`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/additional_tag_minor_credit_followup (medium)`
- Target/Constraints: Keine Zielwahl.
- Taxonomie-Follow-up: tag.additional_tag_followup auf tag.additional_tag_source/tag_snowball_followup normalisieren. Economy ist SupportingEvidence, nicht Rollenursache.

### New Blood (`onr_v1_294_new-blood`)

- Review: kleine Änderung, Priorität medium, Bucket `ice_rearrange_conceal / glacier_support`.
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `ice.corp_rearrange_conceal`
- Nachher Taktiksignale: `ice.corp_conceal_unrezzed_ice`, `ice.corp_rearrange_installed_ice`, `info.corp_hidden_ice_order_reset`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: `corp.ice_tax_glacier` / `defensive_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.ice_tax_glacier -> defensive_tool/ice_conceal_rearrange (medium)`
- Target/Constraints: Corp ordnet eigene ICE verdeckt; Runner darf neue Ordnung nicht aus Inspector-/KI-Daten kennen. TargetProfile/Choice muss side-safe sein.
- Taxonomie-Follow-up: ice.corp_rearrange_conceal ggf. durch zwei präzisere Signale ersetzen.

### Night Shift (`onr_v1_295_night-shift`)

- Review: behalten, Priorität low, Bucket `draw_economy_support`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `draw.corp_draw`, `economy.corp_credit_burst`
- Nachher Taktiksignale: `economy.corp_credit_burst`, `draw.corp_draw`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl.

### Off-Site Backups (`onr_v1_296_off-site-backups`)

- Review: kleine Änderung, Priorität medium, Bucket `archives_recovery / support_only`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `archives.corp_recovery`
- Nachher Taktiksignale: `archives.corp_recovery`, `hq.corp_card_recovery`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: TargetProfile nötig: Corp wählt eine Karte aus eigenen Archives und bringt sie nach HQ; side-safe eigene Zone.
- Taxonomie-Follow-up: Keine Strategy ID für generische Recovery setzen.

### Overtime Incentives (`onr_v1_297_overtime-incentives`)

- Review: ändern, Priorität high, Bucket `action_tempo_candidate / extra_action_burst`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `action.corp_extra_action_support`
- Nachher Taktiksignale: `action.corp_extra_action_burst`, `action.corp_extra_action_support`, `tempo.corp_action_burst`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Candidate/deferred: OPS-V2: Strategy candidate/deferred: candidate: corp.action_tempo -> payoff_anchor/extra_action_burst (high), falls Strategy ID bewusst eingeführt wird
- Target/Constraints: Keine Zielwahl; die gewonnenen Folgeaktionen bleiben normale LegalActions mit eigenen Kosten/Timing-Gates.
- Taxonomie-Follow-up: corp.action_tempo separat entscheiden. Falls akzeptiert, Overtime ist der klarste High-Confidence-Anker dieser neuen Linie.

### Planning Consultants (`onr_v1_298_planning-consultants`)

- Review: kleine Änderung, Priorität low, Bucket `rnd_topdeck_setup / support_only`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `rnd.corp_topdeck_reorder`, `rnd.corp_topdeck_setup`
- Nachher Taktiksignale: `info.corp_rnd_peek`, `rnd.corp_topdeck_reorder`, `rnd.corp_topdeck_setup`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Corp sieht und ordnet Top 5 von R&D; keine Runner-Information ableiten.
- Taxonomie-Follow-up: Kein Deck-Recycle- oder Central-Stabilize-Anker allein aus Topdeck-Setup.

### Power Grid Overload (`onr_v1_299_power-grid-overload`)

- Review: ändern, Priorität high, Bucket `tagged_runner_payoff / hardware_trash`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`.
- Vorher Taktiksignale: `hardware.trash_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `risk.requires_tagged_runner`, `tag.payoff`, `target.runner_hardware_trash`, `tag.runner_hardware_trash_payoff`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tagged_runner_hardware_trash (high)`
- Target/Constraints: TargetProfile nötig: X installierte Runner-Hardware, Constraint not_cybernetics; nur sichtbare/legale Hardware-Ziele.
- Taxonomie-Follow-up: hardware.trash_payoff durch target.runner_hardware_trash/tag.runner_hardware_trash_payoff präzisieren; not_cybernetics als Constraint, nicht als Taktiksignal.

### Project Consultants (`onr_v1_300_project-consultants`)

- Review: ändern, Priorität high, Bucket `advancement_counter_burst / fast_advance / overadvance_candidate`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Nachher Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_burst`, `advance.score_window_support`, `advance.overadvance_support`, `condition.requires_installed_advanceable_card`
- Vorher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Nachher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.fast_advance -> scoring_tool/advance_counter_burst (high)`
- Candidate/deferred: OPS-V2: Strategy candidate/deferred: candidate: corp.overadvance_value -> enabler/overadvance_counter_burst (medium), falls Strategy ID beschlossen wird
- Target/Constraints: TargetProfile nötig: vier Advancement-Counter in beliebiger Kombination auf installierte advancebare Karten.
- Taxonomie-Follow-up: corp.overadvance_value separat entscheiden. Bis dahin als candidate/deferred führen.

### Punitive Counterstrike (`onr_v1_301_punitive-counterstrike`)

- Review: kleine Änderung, Priorität medium, Bucket `tagged_meat_damage_payoff`.
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `damage.corp_meat_source`, `damage.corp_tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Vorher Strategieanker/Rollen: `corp.damage_kill`, `corp.tag_trace_punish` / `punish_payoff`, `win_condition`
- Nachher Strategieanker/Rollen: `corp.damage_kill`, `corp.tag_trace_punish` / `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.damage_kill -> punish_payoff/tagged_meat_damage_payoff (high)`, `corp.tag_trace_punish -> punish_payoff/tagged_runner_meat_damage_payoff (high)`
- Target/Constraints: Keine Zielwahl; Damage-Prevention/Flatline bleiben Engine-Vertrag.
- Taxonomie-Follow-up: damage.meat_source auf damage.corp_meat_source oder damage.corp_tagged_meat_payoff präzisieren.

### Scorched Earth (`onr_v1_302_scorched-earth`)

- Review: kleine Änderung, Priorität medium, Bucket `tagged_meat_damage_closeout`.
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `damage.corp_meat_source`, `damage.corp_tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Vorher Strategieanker/Rollen: `corp.damage_kill`, `corp.tag_trace_punish` / `win_condition`
- Nachher Strategieanker/Rollen: `corp.damage_kill`, `corp.tag_trace_punish` / `win_condition`, `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_damage_closeout (high)`, `corp.tag_trace_punish -> punish_payoff/tagged_runner_meat_damage_payoff (high)`
- Target/Constraints: Keine Zielwahl; Damage-Prevention/Flatline bleiben Engine-Vertrag.
- Taxonomie-Follow-up: damage.meat_source auf damage.corp_meat_source normalisieren.

### Silver Lining Recovery Protocol (`onr_v1_303_silver-lining-recovery-protocol`)

- Review: kleine Änderung, Priorität low, Bucket `reactive_economy_support`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `condition.agenda_stolen_last_turn`, `economy.corp_conditional_credit`
- Nachher Taktiksignale: `condition.agenda_stolen_last_turn`, `economy.corp_reactive_credit_burst`, `economy.corp_conditional_credit`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl; Betrag hängt von Advancement-Countern der gestohlenen Agendas ab.
- Taxonomie-Follow-up: Kein overadvance_support: die Karte nutzt gestohlene Agenda-Counter retrospektiv, sie unterstützt Overadvance nicht aktiv.

### Systematic Layoffs (`onr_v1_304_systematic-layoffs`)

- Review: ändern, Priorität high, Bucket `advancement_counter_burst / fast_advance / overadvance_candidate`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `advance.agenda_counter`, `advance.overadvance_support`, `advance.score_window_support`
- Nachher Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_burst`, `advance.score_window_support`, `advance.overadvance_support`, `condition.requires_installed_advanceable_card`
- Vorher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Nachher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.fast_advance -> scoring_tool/advance_counter_burst (high)`
- Candidate/deferred: OPS-V2: Strategy candidate/deferred: candidate: corp.overadvance_value -> enabler/overadvance_counter_burst (medium), falls Strategy ID beschlossen wird
- Target/Constraints: TargetProfile nötig: zwei Advancement-Counter in beliebiger Kombination auf installierte advancebare Karten.
- Taxonomie-Follow-up: corp.overadvance_value separat entscheiden.

### Team Restructuring (`onr_v1_305_team-restructuring`)

- Review: ändern, Priorität high, Bucket `distributed_advancement / fast_advance`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `advance.agenda_counter`, `advance.score_window_support`
- Nachher Taktiksignale: `advance.corp_counter_placement`, `advance.corp_distributed_counter_support`, `advance.score_window_support`, `condition.requires_installed_advanceable_card`
- Vorher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Nachher Strategieanker/Rollen: `corp.fast_advance` / `scoring_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.fast_advance -> scoring_tool/distributed_advance_counter_support (medium)`
- Target/Constraints: TargetProfile nötig: je ein Counter auf bis zu zwei installierte Karten, die advanced werden können.
- Taxonomie-Follow-up: requires_score_window entfernen; optional schwaches advance.overadvance_support nur als supporting signal prüfen.

### Trojan Horse (`onr_v1_306_trojan-horse`)

- Review: kleine Änderung, Priorität medium, Bucket `retaliatory_tag_source`.
- Geänderte Felder: `strategySupportPairs`.
- Vorher Taktiksignale: `condition.agenda_stolen_last_turn`, `tag.source`
- Nachher Taktiksignale: `condition.agenda_stolen_last_turn`, `tag.source`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/retaliatory_agenda_stolen_tag_source (medium)`
- Target/Constraints: Keine Zielwahl. Nur spielbar, wenn Runner letzte Runde Agenda(s) gestohlen hat.
- Taxonomie-Follow-up: retaliatory_tag_source in RoleDetail präzisieren; condition beibehalten.

### Urban Renewal (`onr_v1_307_urban-renewal`)

- Review: kleine Änderung, Priorität medium, Bucket `tagged_meat_damage_closeout`.
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `damage.meat_source`, `damage.tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Nachher Taktiksignale: `damage.corp_meat_source`, `damage.corp_tagged_meat_payoff`, `risk.requires_tagged_runner`, `tag.payoff`
- Vorher Strategieanker/Rollen: `corp.damage_kill`, `corp.tag_trace_punish` / `win_condition`
- Nachher Strategieanker/Rollen: `corp.damage_kill`, `corp.tag_trace_punish` / `win_condition`, `punish_payoff`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.damage_kill -> win_condition/tagged_meat_damage_closeout (high)`, `corp.tag_trace_punish -> punish_payoff/tagged_runner_meat_damage_payoff (high)`
- Target/Constraints: Keine Zielwahl; Damage-Prevention/Flatline bleiben Engine-Vertrag.
- Taxonomie-Follow-up: damage.meat_source auf damage.corp_meat_source normalisieren.

### Corporate Guard(R) Temps (`onr_proteus_046_corporate-guard-r-temps`)

- Review: ändern, Priorität high, Bucket `action_tempo_candidate / recurring_extra_action_with_drawback`.
- Geänderte Felder: `tacticSignals`.
- Vorher Taktiksignale: `action.corp_future_extra_action`, `risk.agenda_forfeit_drawback`
- Nachher Taktiksignale: `action.corp_future_extra_action`, `action.corp_recurring_extra_action_limited`, `risk.future_forfeit_drawback`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Candidate/deferred: OPS-V2: Strategy candidate/deferred: candidate: corp.action_tempo -> engine_anchor/delayed_recurring_extra_action_engine (medium), falls Strategy ID bewusst eingeführt wird
- Target/Constraints: X wird beim Spielen gewählt/bezahlt; Folgeaktionen und Forfeit-Folge müssen als Engine-/LegalAction-Vertrag abgebildet werden.
- Taxonomie-Follow-up: corp.action_tempo separat entscheiden. Drawback-Signal nach Regeltextverifikation normalisieren.

### Credit Consolidation (`onr_proteus_047_credit-consolidation`)

- Review: behalten, Priorität low, Bucket `economy_support`.
- Geänderte Felder: _keine_.
- Vorher Taktiksignale: `economy.corp_credit_burst`
- Nachher Taktiksignale: `economy.corp_credit_burst`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: _keine_ / _keine_
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: _keine_
- Target/Constraints: Keine Zielwahl.

### Data Sifters (`onr_proteus_048_data-sifters`)

- Review: ändern, Priorität high, Bucket `retaliatory_tag_source`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `condition.node_trashed_last_turn`, `tag.source`
- Nachher Taktiksignale: `condition.runner_trashed_node_last_turn`, `tag.source`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/retaliatory_node_trash_tag_source (medium)`
- Target/Constraints: Keine Zielwahl. Spielbar nur, wenn Runner letzte Runde Node(s) trashte.
- Taxonomie-Follow-up: condition.node_trashed_last_turn auf condition.runner_trashed_node_last_turn normalisieren.

### Emergency Rig (`onr_proteus_049_emergency-rig`)

- Review: kleine Änderung, Priorität medium, Bucket `ice_rez / temporary_rez`.
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `ice.corp_free_rez`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability`
- Nachher Taktiksignale: `ice.corp_free_rez`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability`, `risk.trash_rezzed_ice_after_kludge`
- Vorher Strategieanker/Rollen: `corp.ice_tax_glacier` / `tax_tool`
- Nachher Strategieanker/Rollen: `corp.ice_tax_glacier` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.ice_tax_glacier -> enabler/temporary_free_rez_ice (medium)`
- Target/Constraints: TargetProfile nötig: eine installierte ICE; X Kludge-Counter > 0; Trash beim letzten entfernten Counter ist Engine-Folge.
- Taxonomie-Follow-up: risk.temporary_rez_liability kann Oberklasse bleiben; präzises Trash-Liability-Signal ergänzen.

### Manhunt (`onr_proteus_050_manhunt`)

- Review: ändern, Priorität high, Bucket `scaling_trace_tag_source`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `condition.last_turn_run`, `tag.source`, `trace.source`
- Nachher Taktiksignale: `condition.runner_attempted_run_last_turn`, `trace.source`, `tag.source`, `tag.scaling_trace_margin_source`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/scaling_trace_margin_tag_source (high)`
- Target/Constraints: Keine Zielwahl; Trace-Bidding über LegalActions; Tag-Anzahl = erfolgreiche Trace-Marge.
- Taxonomie-Follow-up: tag.scaling_trace_margin_source oder RoleDetail scaling_trace_tag_source katalogisieren; condition.last_turn_run normalisieren.

### Rent-to-Own Contract (`onr_proteus_051_rent-to-own-contract`)

- Review: ändern, Priorität high, Bucket `ice_rez / installment_liability`.
- Geänderte Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.
- Vorher Taktiksignale: `ice.corp_deferred_rez`, `ice.corp_installment_rez`
- Nachher Taktiksignale: `ice.corp_free_rez`, `ice.corp_installment_rez`, `risk.deferred_rez_payment_liability`, `risk.term_counter_payment_liability`
- Vorher Strategieanker/Rollen: _keine_ / _keine_
- Nachher Strategieanker/Rollen: `corp.ice_tax_glacier` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.ice_tax_glacier -> enabler/installment_free_rez_ice (medium)`
- Target/Constraints: TargetProfile nötig: eine installierte ICE; Term-Counter = Rez-Kosten; Folgezahlung/Counter-Änderung ist Engine-Vertrag.
- Taxonomie-Follow-up: ice.corp_deferred_rez entfernen oder nur als Legacy; präzise Immediate-Free-Rez-plus-Installment-Semantik verwenden.

### Schlaghund Pointers (`onr_proteus_052_schlaghund-pointers`)

- Review: ändern, Priorität medium, Bucket `paid_trace_tag_source`.
- Geänderte Felder: `tacticSignals`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `condition.run_this_game`, `tag.source`, `trace.source`
- Nachher Taktiksignale: `condition.runner_attempted_run_this_game`, `trace.source`, `tag.source`, `risk.extra_trace_cost`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/paid_trace_tag_source (medium)`
- Target/Constraints: Keine Zielwahl; Trace-Bidding/Kosten über LegalActions; Bedingung: Runner hat in diesem Spiel einen Run versucht.
- Taxonomie-Follow-up: condition.run_this_game normalisieren; risk.extra_trace_cost oder CostProfile-Feld prüfen.

### Underworld Mole (`onr_proteus_053_underworld-mole`)

- Review: ändern, Priorität high, Bucket `conditional_trace_tag_source / resource_trash`.
- Geänderte Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`, `conditions`.
- Vorher Taktiksignale: `condition.resource_installed_last_turn`, `resource.trash_payoff`, `tag.source`, `trace.source`
- Nachher Taktiksignale: `condition.runner_installed_resource_last_turn`, `trace.source`, `tag.source`, `target.runner_resource_trash`, `resource.runner_recent_install_trash`
- Vorher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`
- Nachher Strategieanker/Rollen: `corp.tag_trace_punish` / `enabler`, `support_tool`
- Vorher StrategySupportPairs: _keine_
- Nachher StrategySupportPairs: `corp.tag_trace_punish -> enabler/resource_install_retaliatory_trace_tag_source (medium)`, `corp.tag_trace_punish -> support_tool/trace_success_recent_resource_trash (medium)`
- Target/Constraints: TargetProfile nötig: nur eine Resource, die Runner im letzten Zug installiert hat; Trash und Tag erfolgen nur bei Trace-Erfolg.
- Taxonomie-Follow-up: condition.resource_installed_last_turn normalisieren; resource.trash_payoff richtungs- und zeitpräzise machen.
