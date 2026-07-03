# Upgrades Semantic Review v2 Implementation Report

Stand: 2026-07-03

## Kurzfazit

45 Corp-Upgrades wurden auf den v2-Zielzustand gesetzt. Ergebnis: 38 Karten mit Strategieanker, 7 support-only Karten und 47 StrategySupportPairs.

Keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, UI- oder Hidden-Info-Änderung. Die Umsetzung betrifft nur AI-Hint-Metadaten und den Taktiksignal-Katalog.

## Kennzahlen

| Kennzahl | Wert |
|---|---:|
| Geprüfte Upgrades | 45 |
| Karten mit Strategieanker | 38 |
| Support-only Karten | 7 |
| StrategySupportPairs | 47 |
| Neue Taktiksignale | 17 |

## Strategieanker-Verteilung

| Strategieanker | Pairs |
|---|---:|
| `corp.ambush_bluff` | 6 |
| `corp.central_stabilize` | 1 |
| `corp.damage_kill` | 2 |
| `corp.economy_rez_reserve` | 1 |
| `corp.ice_tax_glacier` | 16 |
| `corp.remote_scoring` | 15 |
| `corp.tag_trace_punish` | 6 |

## Support-only Karten

- Aardvark
- New Galveston City Grid
- Tokyo-Chiba Infighting
- Twenty-Four-Hour Surveillance
- Panic Button
- Simple Upgrade
- London City Grid

## Verifikation

- node scripts/check-upgrades-semantic-review-v2.mjs passed
- JSON parse for active hints, tactic signals, review input and implementation report passed
- git diff --check passed
- pnpm --filter @netgrid/ai test -- hint-ontology blocked before test execution by ERR_PNPM_IGNORED_BUILDS for esbuild@0.27.7 and sharp@0.34.5; generated pnpm-workspace.yaml allowBuilds placeholder was reverted.

## Karten

### Aardvark (`onr_v1_349_aardvark`)

Set: originalset-v1; Status: behalten; Priority: low; Kosten: Rez 0 / Trash 4.

Regeln: Runner cannot use worms during runs on this fort. If Runner uses a worm during a run on this fort before Aardvark is rezzed, you may rez Aardvark to trash that worm, and any bits spent using that worm on the current piece of ice are lost to no effect. Runner may then use further icebreakers to break the ice.

Geänderte Hint-Felder: keine semantischen Feldänderungen; Review-Metadaten ergänzt.

Alt Taktiksignale: `run.corp_worm_lockout`
Neu Taktiksignale: `run.corp_worm_lockout`
Alt Strategiesignale: -
Neu Strategiesignale: -
Alt Strategierollen: -
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Worm/program target remains a TargetProfile/constraint, not a strategy anchor.

Begründung: Niche worm hate. Useful tactically, but not a reliable deck-line anchor.

### Antiquated Interface Routines (`onr_v1_350_antiquated-interface-routines`)

Set: originalset-v1; Status: kleine Änderung; Priority: medium; Kosten: Rez 2 / Trash 1.

Regeln: All ice on this fort has +1 strength.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_strength_support`
Neu Taktiksignale: `ice.corp_strength_support`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/fort_ice_strength_support` (medium)

Target/Constraints: Fort-wide ICE modifier; no single ICE target.

Begründung: Old anchor is plausible; hierarchical pair is missing.

### Bizarre Encryption Scheme (`onr_v1_351_bizarre-encryption-scheme`)

Set: originalset-v1; Status: ändern; Priority: high; Kosten: Rez 0 / Trash 1.

Regeln: Runner does not score any agenda or agendas on a run during which Bizarre Encryption Scheme is accessed; return that agenda to the fort instead. Runner scores the agenda at the start of his or her next turn, if neither you nor Runner has scored it by then. This does not affect any further runs.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `access.corp_agenda_score_delay`
Neu Taktiksignale: `access.corp_agenda_score_delay`, `remote.scoring_protection`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> defensive_tool/access_agenda_score_delay` (high)

Target/Constraints: Access replacement for agendas in this fort; no normal target profile.

Begründung: Role should be defensive_tool rather than generic scoring_tool.

### Chester Mix (`onr_v1_352_chester-mix`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 0 / Trash 3.

Regeln: The cost to install ice on this fort is reduced by 2.

Geänderte Hint-Felder: `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_install_discount`
Neu Taktiksignale: `ice.corp_install_discount`
Alt Strategiesignale: `corp.economy_rez_reserve`, `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `support_tool`, `tax_tool`
Neu Strategierollen: `support_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> support_tool/ice_install_discount_fort_builder` (medium)

Target/Constraints: Installed-ICE/Fort constraint; install discount, not rez discount.

Begründung: Remove corp.economy_rez_reserve; install discounts are not a rez-reserve engine.

### Chimera (`onr_v1_353_chimera`)

Set: originalset-v1; Status: kleine Änderung; Priority: medium; Kosten: Rez 2 / Trash 3.

Regeln: When Runner accesses Chimera, trash a daemon.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `access.corp_daemon_trash`, `access.punish`
Neu Taktiksignale: `remote.ambush`, `access.punish`, `access.corp_daemon_trash`
Alt Strategiesignale: `corp.ambush_bluff`
Neu Strategiesignale: `corp.ambush_bluff`
Alt Strategierollen: `punish_payoff`
Neu Strategierollen: `punish_payoff`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_daemon_trash` (medium)

Target/Constraints: Program target with Daemon subtype constraint.

Begründung: Add remote ambush context and explicit pair.

### Crybaby (`onr_v1_354_crybaby`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 1 / Trash 2.

Regeln: When Runner accesses Crybaby, give Runner a Crying counter. Each Crying counter reduces Runner's link by 2 during each trace attempt. Runner can remove a Crying counter by taking an action to pay [2].

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `access.punish`, `remote.ambush`, `tax.runner_persistent`
Neu Taktiksignale: `remote.ambush`, `access.punish`, `trace.runner_link_penalty`, `tax.runner_persistent`
Alt Strategiesignale: `corp.ambush_bluff`
Neu Strategiesignale: `corp.ambush_bluff`, `corp.tag_trace_punish`
Alt Strategierollen: `punish_payoff`
Neu Strategierollen: `punish_payoff`, `enabler`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_trace_link_counter` (medium); `corp.tag_trace_punish -> enabler/persistent_trace_link_penalty` (medium)

Target/Constraints: Crying counter on Runner state; no card target.

Begründung: Current ambush-only model misses the trace-support role.

### Crystal Palace Station Grid (`onr_v1_355_crystal-palace-station-grid`)

Set: originalset-v1; Status: kleine Änderung; Priority: medium; Kosten: Rez 5 / Trash 5.

Regeln: Runner must pay 1, in addition to the normal cost, to break each subroutine of each piece of ice encountered during runs on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `tax.remote`
Neu Taktiksignale: `tax.remote`, `tax.runner_credit`, `remote.scoring_protection`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`, `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/remote_break_tax` (high); `corp.remote_scoring -> defensive_tool/remote_break_tax_protection` (medium)

Target/Constraints: Region/Fort constraint; no single target.

Begründung: Old anchors are plausible; role must be split per strategy.

### Dedicated Response Team (`onr_v1_356_dedicated-response-team`)

Set: originalset-v1; Status: ändern; Priority: high; Kosten: Rez 1 / Trash 2.

Regeln: When Runner accesses Dedicated Response Team, it does 3 meat damage. Ignore this effect unless Runner is tagged.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.payoff`, `tag.payoff`
Neu Taktiksignale: `remote.ambush`, `access.punish`, `condition.requires_tagged_runner`, `damage.corp_tagged_meat_payoff`, `damage.payoff`, `tag.payoff`
Alt Strategiesignale: `corp.damage_kill`, `corp.tag_trace_punish`
Neu Strategiesignale: `corp.damage_kill`, `corp.tag_trace_punish`
Alt Strategierollen: `punish_payoff`
Neu Strategierollen: `punish_payoff`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.damage_kill -> punish_payoff/tagged_meat_damage_payoff` (high); `corp.tag_trace_punish -> punish_payoff/tagged_meat_damage_payoff` (medium)

Target/Constraints: Runner tagged condition; no target profile.

Begründung: Condition should be explicit; add ambush context and pairs.

### Dieter Esslin (`onr_v1_357_dieter-esslin`)

Set: originalset-v1; Status: kleine Änderung; Priority: medium; Kosten: Rez 0 / Trash 3.

Regeln: When Runner accesses Dieter Esslin, Dieter does 1 Net damage.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `access.corp_net_damage_ambush`, `access.punish`, `damage.payoff`
Neu Taktiksignale: `remote.ambush`, `access.corp_net_damage_ambush`, `access.punish`, `damage.payoff`
Alt Strategiesignale: `corp.ambush_bluff`
Neu Strategiesignale: `corp.ambush_bluff`
Alt Strategierollen: `punish_payoff`
Neu Strategierollen: `punish_payoff`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_net_damage_payoff` (medium)

Target/Constraints: No target profile; on-access Runner damage.

Begründung: Keep ambush only; do not add damage_kill.

### Dr. Dreff (`onr_v1_358_dr-dreff`)

Set: originalset-v1; Status: ändern; Priority: high; Kosten: Rez 0 / Trash 3.

Regeln: Whenever Runner makes a successful run on this fort, you may choose an ice card stored in HQ. Pay half of that card's rez cost, rounded down, to force Runner to encounter it; the run is not considered successful unless Runner passes that piece of ice. Trash that ice after the encounter ends. Use this ability only once during each run on this fort.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_hq_runpath_insert`
Neu Taktiksignale: `ice.corp_temporary_encounter`, `risk.temporary_ice_trash`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`, `tax_tool`
Neu Strategierollen: `tax_tool`, `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/successful_run_temporary_hq_ice_encounter` (medium); `corp.remote_scoring -> defensive_tool/successful_run_temporary_hq_ice_encounter_defense` (high)

Target/Constraints: Corp chooses an ICE card stored in HQ; own private HQ identity is controller-only. The ICE is encountered temporarily and trashed after the encounter.

Begründung: `ice.corp_hq_runpath_insert` war zu breit: Dr. Dreff installiert/swappt kein ICE, sondern erzeugt eine temporäre Begegnung. Das Risiko ist präziser `risk.temporary_ice_trash` statt abstrakter Liability.

### Jenny Jett (`onr_v1_359_jenny-jett`)

Set: originalset-v1; Status: kleine Änderung; Priority: high; Kosten: Rez 1 / Trash 1.

Regeln: Whenever Runner makes a successful run on this fort, you may choose an ice card stored in HQ. Install that piece of ice on this fort in the innermost position, 	paying an installation cost of [1] for each piece of ice already on the fort. Runner is now considered to be approaching that piece of ice. Use this ability only once during each run on this fort.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_hq_runpath_insert`, `remote.scoring_protection`
Neu Taktiksignale: `ice.corp_hq_runpath_insert`, `ice.corp_install_during_run`, `remote.scoring_protection`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `tax_tool`, `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/successful_run_hq_ice_insert` (medium); `corp.remote_scoring -> defensive_tool/successful_run_hq_ice_insert_defense` (high)

Target/Constraints: Corp chooses HQ ICE; hidden info is controller-only.

Begründung: Remote-defense role is stronger than generic scoring_tool.

### Jerusalem City Grid (`onr_v1_360_jerusalem-city-grid`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 2 / Trash 5.

Regeln: Cost to rez walls on this fort is reduced by [2]. All walls on this fort have +1 strength. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_rez_discount`, `ice.corp_strength_support`
Neu Taktiksignale: `ice.corp_rez_discount`, `ice.corp_strength_support`, `tax.ice`
Alt Strategiesignale: `corp.economy_rez_reserve`, `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `support_tool`, `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/wall_rez_discount_strength_support` (high)

Target/Constraints: Region/Fort constraint; Wall-only is a constraint.

Begründung: Remove economy_rez_reserve; function is ICE tax/glacier.

### Namatoki Plaza (`onr_v1_361_namatoki-plaza`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 3 / Trash 1.

Regeln: Rez Namatoki Plaza when you install it. Install Namatoki Plaza only if you can pay to rez it. Install only inside a subsidiary data fort. That fort may have an additional agenda or node installed inside it. If Namatoki Plaza leaves play while installed, and this results in the fort having too many agendas and nodes installed inside it, trash one of those agendas or nodes.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `remote.capacity_support`, `remote.scoring_protection`
Neu Taktiksignale: `remote.capacity_support`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `support_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> support_tool/remote_capacity_expansion` (medium)

Target/Constraints: Subsidiary data fort capacity expansion; leaves-play overcapacity cleanup must stay rules-side. No normal TargetProfile.

Begründung: `remote.scoring_protection` ist hier falsch: Namatoki schützt keine Agenda und erzeugt kein Scorefenster, sondern erweitert nur die Fort-Kapazität. Rolle deshalb `support_tool`, nicht `scoring_tool`.

### New Galveston City Grid (`onr_v1_362_new-galveston-city-grid`)

Set: originalset-v1; Status: kleine Änderung; Priority: low; Kosten: Rez 1 / Trash 4.

Regeln: All nodes and other upgrades installed inside this fort cost 2 to trash, in addition to the normal cost. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`.

Alt Taktiksignale: `access.corp_installed_trash_tax`
Neu Taktiksignale: `access.corp_installed_trash_tax`, `remote.trash_tax_protection`
Alt Strategiesignale: -
Neu Strategiesignale: -
Alt Strategierollen: -
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Region/Fort constraint; tax protects nodes/upgrades, not agendas.

Begründung: Remote shell support, but no confirmed remote-scoring anchor because agendas are not directly protected.

### Olivia Salazar (`onr_v1_363_olivia-salazar`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 0 / Trash 1.

Regeln: For half cost, rounded down, rez a piece of ice installed on this fort. Derez that ice at the end of the run. Use this ability only once during each run on this fort.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_rez_discount`, `ice.corp_temporary_rez`, `remote.scoring_protection`
Neu Taktiksignale: `ice.corp_rez_discount`, `ice.corp_temporary_rez`, `risk.temporary_rez_liability`
Alt Strategiesignale: `corp.economy_rez_reserve`, `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `support_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/temporary_ice_rez_support` (medium)

Target/Constraints: One installed ICE on this fort; temporary derez liability remains relevant.

Begründung: `corp.economy_rez_reserve` ist zu groß für eine einmal-pro-Run temporäre Rez-Ermäßigung. Die Karte unterstützt ICE-Tax/Glacier, ist aber keine Rez-Reserve-Engine.

### Omni Kismet, Ph.D. (`onr_v1_364_omni-kismet-ph-d`)

Set: originalset-v1; Status: kleine Änderung; Priority: medium; Kosten: Rez 0 / Trash 3.

Regeln: Swap a piece of unrezzed ice on this fort with an ice card stored in HQ. The new ice card comes into play concealed. Use this ability only once during each run on this fort.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_hq_runpath_insert`
Neu Taktiksignale: `ice.corp_ice_swap`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/hq_ice_swap_support` (medium)

Target/Constraints: Unrezzed ICE on this fort plus an ICE card stored in HQ; controller-only HQ choice must remain hidden from Runner-side AI.

Begründung: `ice.corp_hq_runpath_insert` ist hier nicht präzise, weil die Karte kein ICE einfügt, sondern ein unrezzed ICE austauscht. `ice.corp_ice_swap` reicht; HQ-Quelle ist Constraint.

### Paris City Grid (`onr_v1_365_paris-city-grid`)

Set: originalset-v1; Status: ändern; Priority: high; Kosten: Rez 2 / Trash 6.

Regeln: Put [3] from the bank on Paris City Grid when you rez it. Use these bits only to pay for traces made during runs on this fort. If you use any of these bits, replace them at the start of your next turn. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `economy.corp_trace_credit_support`, `trace.corp_credit_support`
Neu Taktiksignale: `trace.corp_credit_support`
Alt Strategiesignale: `corp.tag_trace_punish`
Neu Strategiesignale: `corp.tag_trace_punish`
Alt Strategierollen: `support_tool`
Neu Strategierollen: `enabler`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_credit_enabler` (high)

Target/Constraints: Region/Fort constraint; credits only pay for traces on this fort.

Begründung: Remove economy.corp_trace_credit_support duplicate; trace-specific signal is enough.

### Red Herrings (`onr_v1_366_red-herrings`)

Set: originalset-v1; Status: kleine Änderung; Priority: high; Kosten: Rez 1 / Trash 1.

Regeln: Runner must pay 5, in addition to any other costs, to steal agendas accessed from this fort, even on the run during which Runner trashes Red Herrings.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `remote.agenda_steal_tax`
Neu Taktiksignale: `remote.agenda_steal_tax`, `tax.runner_credit`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> defensive_tool/agenda_steal_tax` (high)

Target/Constraints: Agenda access in this fort.

Begründung: Role should be defensive_tool rather than tax_tool.

### Rio de Janeiro City Grid (`onr_v1_367_rio-de-janeiro-city-grid`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 1 / Trash 6.

Regeln: Roll a die whenever Runner passes a piece of rezzed ice during a run on this fort. On a 1, end the run. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `remote.scoring_protection`
Neu Taktiksignale: `remote.scoring_protection`, `risk.random_outcome`, `run.corp_random_end_run`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> defensive_tool/random_pass_ice_end_run` (medium)

Target/Constraints: Region/Fort constraint; random outcome must stay separate.

Begründung: scoring_tool is too strong; random risk should be visible.

### Roving Submarine (`onr_v1_368_roving-submarine`)

Set: originalset-v1; Status: ändern; Priority: high; Kosten: Rez 3 / Trash 0.

Regeln: Install only inside a subsidiary data fort. This fort may be run only if you installed or advanced a card inside or on this fort during your last turn. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `run.corp_server_lock`
Neu Taktiksignale: `run.corp_server_lock`, `condition.corp_installed_or_advanced_this_fort_last_turn`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> defensive_tool/conditional_server_lock` (medium)

Target/Constraints: Subsidiary remote; condition is specifically install/advance inside or on this fort during the Corp last turn.

Begründung: Die Bedingung im Report war zu breit. Es geht nicht um irgendeine Corp-Install-/Advance-Aktion, sondern um diese Fort-Zone. Außerdem ist `high` zu stark, weil aktive Scoring-Entwicklung die Run-Erlaubnis gerade wieder öffnet.

### Singapore City Grid (`onr_v1_369_singapore-city-grid`)

Set: originalset-v1; Status: kleine Änderung; Priority: medium; Kosten: Rez 0 / Trash 5.

Regeln: Swap a piece of unrezzed ice on this fort with an ice card stored in HQ. The new ice card comes into play concealed. Use this ability only once during each run on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_hq_runpath_insert`
Neu Taktiksignale: `ice.corp_ice_swap`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/hq_ice_swap_support` (medium)

Target/Constraints: Region/Fort constraint plus unrezzed ICE on this fort and an ICE card stored in HQ; controller-only HQ choice.

Begründung: `ice.corp_hq_runpath_insert` ist auch hier zu breit. Die Karte tauscht ICE aus; sie installiert oder erzwingt keine zusätzliche Begegnung.

### Tesseract Fort Construction (`onr_v1_370_tesseract-fort-construction`)

Set: originalset-v1; Status: kleine Änderung; Priority: high; Kosten: Rez 2 / Trash 3.

Regeln: All ice on this fort has an additional subroutine, "*End the run unless Runner pays [1]," after all other subroutines.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_subroutine_support`, `remote.scoring_protection`
Neu Taktiksignale: `ice.corp_subroutine_support`, `run.corp_pay_or_end_run`, `tax.runner_credit`, `remote.scoring_protection`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Alt Strategierollen: `engine_anchor`
Neu Strategierollen: `engine_anchor`, `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> engine_anchor/fort_subroutine_tax_engine` (high); `corp.remote_scoring -> defensive_tool/fort_subroutine_remote_protection` (medium)

Target/Constraints: All ICE on this fort; persistent server-bound modifier.

Begründung: Keep engine anchor but split role by strategy.

### Tokyo-Chiba Infighting (`onr_v1_371_tokyo-chiba-infighting`)

Set: originalset-v1; Status: ändern; Priority: low; Kosten: Rez 0 / Trash 6.

Regeln: Gain 2 after each unsuccessful run on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort.

Geänderte Hint-Felder: keine semantischen Feldänderungen; Review-Metadaten ergänzt.

Alt Taktiksignale: `economy.corp_unsuccessful_run_credit`
Neu Taktiksignale: `economy.corp_unsuccessful_run_credit`
Alt Strategiesignale: -
Neu Strategiesignale: -
Alt Strategierollen: -
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Region/Fort constraint; trigger is unsuccessful run on this fort.

Begründung: Credits nach erfolglosem Run belohnen einen bereits starken Server, erzeugen aber selbst weder Tax noch ETR noch Scoring-Schutz. Der niedrige Glacier-Support aus v1 sollte nicht als Strategieanker zählen.

### Turbeau Delacroix (`onr_v1_372_turbeau-delacroix`)

Set: originalset-v1; Status: ändern; Priority: high; Kosten: Rez 1 / Trash 2.

Regeln: Trace 10-If trace is successful, give Runner a tag. Use this ability only when Runner accesses Turbeau Delacroix, and only once during each run on this fort.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `tag.source`, `trace.source`
Neu Taktiksignale: `remote.ambush`, `trace.source`, `tag.source`
Alt Strategiesignale: `corp.tag_trace_punish`
Neu Strategiesignale: `corp.tag_trace_punish`
Alt Strategierollen: `engine_anchor`
Neu Strategierollen: `enabler`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.tag_trace_punish -> enabler/access_trace_tag_source` (high)

Target/Constraints: Access trigger and trace; no target profile.

Begründung: engine_anchor is too strong; this is a tag source/enabler.

### Twenty-Four-Hour Surveillance (`onr_v1_373_twenty-four-hour-surveillance`)

Set: originalset-v1; Status: ändern; Priority: medium; Kosten: Rez 1 / Trash 2.

Regeln: During runs on this fort, Runner cannot use bits from stealth sources.

Geänderte Hint-Felder: `lineSupport`, `strategicRole`.

Alt Taktiksignale: `run.corp_stealth_credit_lockout`
Neu Taktiksignale: `run.corp_stealth_credit_lockout`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: -
Alt Strategierollen: `tax_tool`
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Fort-bound run constraint; only affects stealth credit sources.

Begründung: Stealth-Hate ist wie Worm-Hate ein taktisches Matchup-/Constraint-Signal, aber kein verlässlicher ICE-Tax-/Glacier-Anker. `tax.runner_credit` ist als Zusatzsignal zu breit, weil keine zusätzlichen Credits gezahlt werden, sondern eine Quelle gesperrt wird.

### Washington, D.C., City Grid (`onr_v1_374_washington-d-c-city-grid`)

Set: originalset-v1; Status: kleine Änderung; Priority: high; Kosten: Rez 7 / Trash 6.

Regeln: The difficulty of agendas installed inside this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`
Neu Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `scoring_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> scoring_tool/agenda_difficulty_discount` (high)

Target/Constraints: Region/Fort constraint; no separate fast-advance inference.

Begründung: Set remote-scoring pair, not fast-advance.

### Herman Revista (`onr_proteus_060_herman-revista`)

Set: proteus; Status: ändern; Priority: medium; Kosten: Rez 1 / Trash 4.

Regeln: [0]: Rearrange the ice installed on this fort. Use this ability only at the start of a run on this data fort.

Geänderte Hint-Felder: `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_reorder_fort`
Neu Taktiksignale: `ice.corp_reorder_fort`
Alt Strategiesignale: -
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: -
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_order_control` (medium)

Target/Constraints: All ICE on this fort; order is visible server state.

Begründung: Currently support-only; useful enough for glacier as tax tool.

### Lesley Major (`onr_proteus_062_lesley-major`)

Set: proteus; Status: ändern; Priority: high; Kosten: Rez 0 / Trash 0.

Regeln: Install Lesley Major only in a subsidiary data fort. [5]: Add two advancement counters, at no cost, to a card installed in this data fort. Use this ability only when Runner passes the last piece of ice on this fort, and only once per run.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `advance.corp_counter_placement`, `advance.remote_score_window_support`
Neu Taktiksignale: `advance.corp_counter_placement`, `advance.access_window_counter_support`, `condition.runner_passed_last_ice_this_fort`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.ambush_bluff`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `enabler`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ambush_bluff -> enabler/access_window_advancement_enabler` (medium)

Target/Constraints: Installed card in subsidiary fort; timing is after Runner passes the last ICE and once per run. Target should be an installed card that can use advancement counters.

Begründung: Der v1-Anker `corp.remote_scoring` ist fraglich: Das Timing vor Access schützt Agendas nicht zuverlässig und erzeugt kein Score-Closeout. Fachlich stärker ist die Karte als Access-Window-Advancement-Enabler für Ambush/Bluff-Linien.

### Lisa Blight (`onr_proteus_063_lisa-blight`)

Set: proteus; Status: kleine Änderung; Priority: medium; Kosten: Rez 0 / Trash 2.

Regeln: [1], Discard a card at random: Repeat one subroutine on a piece of ice on this fort, until the end of the run. Treat the copy of the subroutine as if it appeared immediately after the original subroutine. Use this ability only during a run.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_subroutine_repeat`, `risk.random_discard_cost`
Neu Taktiksignale: `ice.corp_subroutine_repeat`, `risk.random_discard_cost`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_subroutine_repeat_support` (high)

Target/Constraints: Installed ICE/subroutine target; random discard is cost risk.

Begründung: Old tax anchor is plausible; pair is missing.

### Marcel DeSoleil (`onr_proteus_064_marcel-desoleil`)

Set: proteus; Status: kleine Änderung; Priority: medium; Kosten: Rez 0 / Trash 2.

Regeln: [2], Trash the top two cards stored in R&D: Repeat one subroutine on a piece of ice on this fort, until the end of the run. Treat the copy of the subroutine as if it appeared immediately after the original subroutine. Use this ability only during a run.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `ice.corp_subroutine_repeat`, `risk.rnd_trash_cost`
Neu Taktiksignale: `ice.corp_subroutine_repeat`, `risk.rnd_trash_cost`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_subroutine_repeat_support` (high)

Target/Constraints: Installed ICE/subroutine target; R&D trash cost separated from tactic.

Begründung: Old tax anchor is plausible; pair is missing.

### Networked Center (`onr_proteus_065_networked-center`)

Set: proteus; Status: kleine Änderung; Priority: high; Kosten: Rez 4 / Trash 3.

Regeln: The difficulty of Gray Ops agendas installed in this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`
Neu Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `scoring_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> scoring_tool/gray_ops_agenda_difficulty_discount` (high)

Target/Constraints: Region/Fort constraint; Gray Ops agendas only.

Begründung: Set pair.

### Obfuscated Fortress (`onr_proteus_066_obfuscated-fortress`)

Set: proteus; Status: kleine Änderung; Priority: medium; Kosten: Rez 4 / Trash 0.

Regeln: At the start of a run on this fort, Runner must announce the number of bits he or she will spend during the run. Runner cannot spend more than this during that run. If Runner does not spend that many bits during that run, the Runner loses the remainder once the run is complete. You may rez Obfuscated Fortress at the start of a run on this fort.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `run.corp_spend_cap`
Neu Taktiksignale: `run.corp_spend_cap`, `tax.runner_credit`
Alt Strategiesignale: `corp.ice_tax_glacier`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/run_spend_cap_tax` (high)

Target/Constraints: Start-of-run fort constraint; no card target.

Begründung: Old tax anchor is plausible; tax.runner_credit should be explicit.

### Panic Button (`onr_proteus_067_panic-button`)

Set: proteus; Status: kleine Änderung; Priority: low; Kosten: Rez 1 / Trash 4.

Regeln: Install Panic Button only in HQ. [1]: Draw a card. Use this ability only during a run on HQ.

Geänderte Hint-Felder: `tacticSignals`.

Alt Taktiksignale: `draw.corp_draw`
Neu Taktiksignale: `draw.corp_draw`, `condition.during_hq_run`
Alt Strategiesignale: -
Neu Strategiesignale: -
Alt Strategierollen: -
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Install only in HQ; ability only during a run on HQ.

Begründung: `condition.hq_run` sollte präziser als Timing-/Nutzungscondition formuliert werden: `condition.during_hq_run`. Support-only bleibt richtig.

### Pavit Bharat (`onr_proteus_069_pavit-bharat`)

Set: proteus; Status: ändern; Priority: high; Kosten: Rez 2 / Trash 0.

Regeln: Install Pavit only in a subsidiary data fort. When you rez Pavit, uninstall all cards installed in this fort and store them in HQ. Install an equal number of cards from HQ in this fort. Rez Pavit only when Runner has passed the last piece of ice on this fort.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `hq.corp_installed_card_bounce`, `install.corp_uninstall_to_hq`
Neu Taktiksignale: `hq.corp_installed_card_bounce`, `install.corp_uninstall_to_hq`, `remote.content_swap_defense`
Alt Strategiesignale: -
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: -
Neu Strategierollen: `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> defensive_tool/remote_content_swap_defense` (medium)

Target/Constraints: Subsidiary fort contents plus HQ replacement cards; strict hidden-info boundary.

Begründung: Currently support-only, but strategically relevant as remote defense.

### Rasmin Bridger (`onr_proteus_070_rasmin-bridger`)

Set: proteus; Status: kleine Änderung; Priority: high; Kosten: Rez 4 / Trash 2.

Regeln: After Runner passes each piece of ice on this fort, Runner must pay [1] or end the run.

Geänderte Hint-Felder: `tacticSignals`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `run.corp_pay_or_end_run`
Neu Taktiksignale: `run.corp_pay_or_end_run`, `tax.runner_credit`, `remote.scoring_protection`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`, `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/pass_ice_pay_or_end_tax` (high); `corp.remote_scoring -> defensive_tool/pass_ice_pay_or_end_remote_protection` (medium)

Target/Constraints: Fort-bound during-run tax; no single target.

Begründung: Remote-defense role should be explicit.

### Raymond Ellison (`onr_proteus_071_raymond-ellison`)

Set: proteus; Status: ändern; Priority: medium; Kosten: Rez 0 / Trash 2.

Regeln: Install Raymond Ellison only in a subsidiary data fort. [T]: Remove any number of advancement counters from cards installed in this data fort. Gain [3] for each advancement counter removed. Use this ability only during a run. At the end of the run, return to the bank any of the bits gained that you did not spend.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `advance.corp_counter_bank`, `economy.corp_run_temporary_credit`, `risk.temporary_credit_drawback`
Neu Taktiksignale: `advance.corp_counter_bank`, `economy.corp_counter_cashout`, `economy.corp_run_temporary_credit`, `risk.temporary_credit_drawback`
Alt Strategiesignale: `corp.economy_rez_reserve`
Neu Strategiesignale: `corp.economy_rez_reserve`
Alt Strategierollen: `support_tool`
Neu Strategierollen: `support_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.economy_rez_reserve -> support_tool/run_temporary_credit_reserve` (medium)

Target/Constraints: Advancement counters on cards in this fort; unused credits returned.

Begründung: Add counter-cashout signal and express reserve support hierarchically.

### Research Bunker (`onr_proteus_072_research-bunker`)

Set: proteus; Status: kleine Änderung; Priority: high; Kosten: Rez 4 / Trash 3.

Regeln: The difficulty of research agendas installed in this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.research_difficulty_discount`
Neu Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.research_difficulty_discount`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `scoring_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> scoring_tool/research_agenda_difficulty_discount` (high)

Target/Constraints: Region/Fort constraint; Research agendas only.

Begründung: Set pair.

### Simon Francisco (`onr_proteus_073_simon-francisco`)

Set: proteus; Status: kleine Änderung; Priority: medium; Kosten: Rez 3 / Trash 3.

Regeln: Install Simon Francisco only in R&D or HQ. During a run in which Simon is accessed, Runner accesses one less card stored in this fort.

Geänderte Hint-Felder: `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `access.corp_central_access_reduction`
Neu Taktiksignale: `access.corp_central_access_reduction`
Alt Strategiesignale: `corp.central_stabilize`
Neu Strategiesignale: `corp.central_stabilize`
Alt Strategierollen: `support_tool`
Neu Strategierollen: `defensive_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.central_stabilize -> defensive_tool/central_multiaccess_reduction` (high)

Target/Constraints: HQ or R&D only; access reduction is central-bound.

Begründung: defensive_tool is more precise than support_tool.

### Weapons Depot (`onr_proteus_077_weapons-depot`)

Set: proteus; Status: kleine Änderung; Priority: high; Kosten: Rez 4 / Trash 3.

Regeln: The difficulty of Black Ops agendas installed in this fort is reduced by 1. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `strategySupportPairs`.

Alt Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`
Neu Taktiksignale: `remote.agenda_difficulty_discount`, `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`
Alt Strategiesignale: `corp.remote_scoring`
Neu Strategiesignale: `corp.remote_scoring`
Alt Strategierollen: `scoring_tool`
Neu Strategierollen: `scoring_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.remote_scoring -> scoring_tool/black_ops_agenda_difficulty_discount` (high)

Target/Constraints: Region/Fort constraint; Black Ops agendas only.

Begründung: Set pair.

### Simple Upgrade (`simple_upgrade`)

Set: testset; Status: behalten; Priority: low; Kosten: Rez 0 / Trash 4.

Regeln: Einfache Root-Karte ohne aktive Fähigkeit.

Geänderte Hint-Felder: keine semantischen Feldänderungen; Review-Metadaten ergänzt.

Alt Taktiksignale: -
Neu Taktiksignale: -
Alt Strategiesignale: -
Neu Strategiesignale: -
Alt Strategierollen: -
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Testset placeholder without active ability.

Begründung: No productive AI hint needed.

### London City Grid (`onr_classic_020_london-city-grid`)

Set: classic; Status: ändern; Priority: medium; Kosten: Rez 3 / Trash 6.

Regeln: Runner must pay [1], in addition to the normal cost, to use each subroutine of a noisy icebreaker during runs on this fort. Rez a region when you install it. Install a region only if you can pay to rez it. Only one region may be installed in each fort. Trash older ones.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`.

Alt Taktiksignale: `corp_ice.break_cost_tax`, `remote.scoring_protection`, `run.break_cost_penalty`, `tax.runner_persistent`
Neu Taktiksignale: `run.break_cost_penalty`, `tax.runner_persistent`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: -
Alt Strategierollen: `tax_tool`
Neu Strategierollen: -
Alt StrategySupportPairs: -
Neu StrategySupportPairs: -

Target/Constraints: Region/Fort constraint; applies only to using subroutines of noisy icebreakers during runs on this fort.

Begründung: Noisy-Icebreaker-Hate ist subtype-/matchup-spezifisch wie Worm- oder Stealth-Hate. Das ist ein taktisches Tax-/Constraint-Signal, aber kein stabiler `corp.ice_tax_glacier`- oder `corp.remote_scoring`-Anker.

### Self-Destruct (`onr_classic_022_self-destruct`)

Set: classic; Status: kleine Änderung; Priority: high; Kosten: Rez 2 / Trash 0.

Regeln: Install Self-Destruct only in a subsidiary data fort. [T]. Trash all other cards installed in or on this data fort. Do 1 Net damage for each card successfully trashed in this way. Use this ability only when Runner accesses Self-Destruct.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `access.corp_net_damage_ambush`, `access.punish`, `damage.payoff`, `ice.corp_self_trash_cost`, `remote.ambush`, `risk.trash_own_rezzed_ice`
Neu Taktiksignale: `remote.ambush`, `access.corp_net_damage_ambush`, `access.punish`, `damage.payoff`, `risk.trash_own_installed_cards`
Alt Strategiesignale: `corp.ambush_bluff`, `corp.damage_kill`
Neu Strategiesignale: `corp.ambush_bluff`, `corp.damage_kill`
Alt Strategierollen: `punish_payoff`
Neu Strategierollen: `punish_payoff`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_scaling_net_damage_ambush` (high); `corp.damage_kill -> punish_payoff/access_scaling_net_damage_payoff` (medium)

Target/Constraints: Trashes other installed cards in/on the fort; own-board risk is broader than own ICE.

Begründung: risk.trash_own_rezzed_ice is too narrow.

### Shock Treatment (`onr_classic_023_shock-treatment`)

Set: classic; Status: ändern; Priority: high; Kosten: Rez 2 / Trash 5.

Regeln: When Runner accesses Shock Treatment, trash all pieces of hardware and two programs. Ignore this effect unless Runner has four or more tags.

Geänderte Hint-Felder: `tacticSignals`, `strategySupportPairs`.

Alt Taktiksignale: `access.corp_hardware_trash`, `access.corp_program_trash`, `access.punish`, `remote.ambush`, `risk.requires_tagged_runner`, `tag.payoff`
Neu Taktiksignale: `remote.ambush`, `access.corp_hardware_trash`, `access.corp_program_trash`, `access.punish`, `condition.runner_has_four_or_more_tags`, `tag.payoff`
Alt Strategiesignale: `corp.ambush_bluff`, `corp.tag_trace_punish`
Neu Strategiesignale: `corp.ambush_bluff`, `corp.tag_trace_punish`
Alt Strategierollen: `punish_payoff`
Neu Strategierollen: `punish_payoff`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_rig_trash_payoff` (high); `corp.tag_trace_punish -> punish_payoff/tag_threshold_rig_trash_payoff` (high)

Target/Constraints: Runner installed hardware/programs; four-tag threshold is a condition.

Begründung: Use specific tag-threshold condition instead of risk.requires_tagged_runner.

### Sterdroid (`onr_classic_024_sterdroid`)

Set: classic; Status: ändern; Priority: medium; Kosten: Rez 0 / Trash 0.

Regeln: [3], [T]: Choose a piece of ice. That ice's strength is doubled until end of turn. If this would raise the ice's strength above 10, ist strength becomes 10.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategySupportPairs`.

Alt Taktiksignale: `ice.strength_modifier`, `remote.scoring_protection`
Neu Taktiksignale: `ice.corp_targeted_strength_boost`, `ice.corp_strength_support`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`
Neu Strategiesignale: `corp.ice_tax_glacier`
Alt Strategierollen: `tax_tool`
Neu Strategierollen: `tax_tool`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/targeted_ice_strength_burst` (medium)

Target/Constraints: TargetProfile needed: choose a piece of ICE; visible/known ICE state only, no hidden Runner knowledge.

Begründung: `ice.strength_modifier` ist zu generisch und nicht Corp-seitig. `remote.scoring_protection` und der Remote-Scoring-Pair sind zu breit, weil Sterdroid ein zielbares ICE-Buff-Werkzeug ist, kein remote-spezifischer Schutz.

### Street Enforcer (`onr_classic_026_street-enforcer`)

Set: classic; Status: ändern; Priority: high; Kosten: Rez 1 / Trash 3.

Regeln: At the start of each run on this data fort, Runner loses [X], where X is equal to the number of tags Runner has.

Geänderte Hint-Felder: `tacticSignals`, `lineSupport`, `strategicRole`, `strategySupportPairs`.

Alt Taktiksignale: `remote.scoring_protection`, `risk.requires_tagged_runner`, `tag.payoff`, `tax.runner_credit`, `tax.runner_persistent`
Neu Taktiksignale: `condition.runner_has_one_or_more_tags`, `tag.payoff`, `tag.runner_credit_loss_payoff`, `tax.runner_persistent`
Alt Strategiesignale: `corp.ice_tax_glacier`, `corp.remote_scoring`, `corp.tag_trace_punish`
Neu Strategiesignale: `corp.tag_trace_punish`
Alt Strategierollen: `punish_payoff`, `tax_tool`
Neu Strategierollen: `punish_payoff`
Alt StrategySupportPairs: -
Neu StrategySupportPairs: `corp.tag_trace_punish -> punish_payoff/tag_count_credit_loss_payoff` (high)

Target/Constraints: Installed in a data fort; effect scales with Runner tag count at the start of each run on that fort.

Begründung: Die v1-Zuordnung zu drei Strategien überdehnt die Karte. Fachlich ist Street Enforcer ein Tag-Payoff. ICE-Tax und Remote-Scoring sollten nicht zusätzlich ankern, weil die Tax nur aus bereits vorhandenen Tags entsteht.

