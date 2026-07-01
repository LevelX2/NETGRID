# Agenda Semantic Review v1 Ergebnis

Status: `complete-local`

Stand: 2026-07-01

Umfang: 50 Agendas, 46 mit Feldänderungen, 4 ohne Feldänderung gegenüber dem importierten Vorher-Stand.

## Legende

- Taktiksignale: konkrete, nutzbare Spielwirkung für die KI.
- Strategieanker: wiederverwendbarer Corp-Spielplan, den die Karte ankern oder wesentlich tragen kann.
- Strategische Rolle: hierarchische Rolle innerhalb eines konkreten Strategieankers, gespeichert als `strategySupportPairs`.

## Karten

### Data Fort Remapping (onr_classic_001_data-fort-remapping)

Set: classic

Text: Put a Remap counter on Data Fort Remapping when you score it. Remap Counter: End a run.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.action_counter_bank`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.remote_scoring -> defensive_tool/remote_defense_tool (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `score.run_end_counter_bank`, `run.corp_end_run_counter`, `defense.corp_run_end_counter`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.remote_scoring -> defensive_tool/run_end_score_window_protection (medium)`

Änderungen: tacticSignals: +`score.run_end_counter_bank`, `run.corp_end_run_counter`, `defense.corp_run_end_counter` / -`score.action_counter_bank`; strategySupportPairs: 1 -> 1

Review-Begründung: Eine gescorte Agenda mit Run-End-Counter schützt Scorefenster und Remotes, ist aber kein ICE-Tax-Tool. Remote-Scoring-Anker bleibt plausibel, aber nur defensiv.

Target-/Constraint-Hinweis aus Review: kein TargetProfile nötig; Counter-Nutzung ist LegalAction-/Timing-Semantik

### Superserum (onr_classic_002_superserum)

Set: classic

Text: When you score Superserum, remove all Virus counters, and avoid receiving the next two Virus counters Runner gives to you.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `virus.corp_counter_prevention`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.central_stabilize -> defensive_tool/virus_counter_defense (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `virus.corp_counter_clear`, `virus.corp_counter_prevention`, `defense.virus_counter_defense`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.central_stabilize -> defensive_tool/virus_counter_defense (medium)`

Änderungen: tacticSignals: +`virus.corp_counter_clear`, `defense.virus_counter_defense` / -keine; strategySupportPairs: 1 -> 1

Review-Begründung: Die Karte stabilisiert gegen Virusdruck nach dem Score; sie ist kein Scoring-Payoff. Pair ist inhaltlich okay, sollte aber Clear + Prevention ausdrücklich zeigen.

Target-/Constraint-Hinweis aus Review: keins

### Theorem Proof (onr_classic_004_theorem-proof)

Set: classic

Text: If Runner accesses Theorem Proof, he or she does not score it, but instead may install it as a 2 MU program that has the ability "A: Score Theorem Proof" but is removed from the game if it leaves play in any other way.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `access.runner_program_bounce`, `risk.high_difficulty_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.remote_scoring -> scoring_tool/access_replacement_score_tool (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `access.corp_agenda_steal_replacement`, `access.corp_delayed_agenda_score`, `access.corp_runner_agenda_program_install`, `risk.runner_memory_burden`, `risk.fragile_delayed_score`, `risk.program_removal_denies_score`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.remote_scoring -> defensive_tool/agenda_steal_friction_tool (medium)`

Änderungen: tacticSignals: +`access.corp_agenda_steal_replacement`, `access.corp_delayed_agenda_score`, `access.corp_runner_agenda_program_install`, `risk.runner_memory_burden`, `risk.fragile_delayed_score`, `risk.program_removal_denies_score` / -`access.runner_program_bounce`, `risk.high_difficulty_agenda`; strategicRole: +`defensive_tool` / -`scoring_tool`; strategySupportPairs: 1 -> 1

Review-Begründung: Erfolgreicher Access wird nicht sofort zum Score, sondern in eine verwundbare Runner-Installation mit späterer Aktion verschoben. Das ist Steal-Friction, nicht Corp-Score-Closeout.

Target-/Constraint-Hinweis aus Review: Action-Semantik muss die spätere Runner-Ability `A: Score Theorem Proof` separat erkennen; 2-MU-Programminstallation als spezieller Access-Replacement-Fall.

### Unlisted Research Lab (onr_classic_003_unlisted-research-lab)

Set: classic

Text: Draw an additional card at the start of each of your turns.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.recurring_draw`, `draw.corp_draw`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.remote_scoring -> engine_anchor/scored_draw_engine (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `draw.corp_recurring`, `score.recurring_draw`
- Strategieanker: `corp.draw_engine`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.draw_engine -> engine_anchor/scored_recurring_draw_engine (high)`

Änderungen: tacticSignals: +`draw.corp_recurring` / -`draw.corp_draw`; lineSupport: +`corp.draw_engine` / -`corp.remote_scoring`; strategySupportPairs: 1 -> 1

Review-Begründung: Die Karte hilft jeder Corp-Linie nach dem Score. Ohne eigene Draw-/Value-Engine-Strategie sollte sie support-only bleiben; sonst muss Employee Empowerment konsistent auch geankert werden.

Target-/Constraint-Hinweis aus Review: keins

### AI Chief Financial Officer (onr_v1_188_ai-chief-financial-officer)

Set: originalset-v1

Text: [A]: Shuffle cards stored in HQ and the Archives into R&D; then draw five cards.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.draw`, `score.hq_archive_to_rnd_shuffle`, `score.rnd_archive_recycle`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `draw.corp_action_draw`, `hq.corp_hand_to_rnd_shuffle`, `archives.corp_recycle_to_rnd`, `rnd.corp_shuffle_recycle`
- Strategieanker: `corp.deck_recycle_engine`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.deck_recycle_engine -> engine_anchor/scored_zone_recycle_draw_engine (medium)`

Änderungen: tacticSignals: +`draw.corp_action_draw`, `hq.corp_hand_to_rnd_shuffle`, `archives.corp_recycle_to_rnd`, `rnd.corp_shuffle_recycle` / -`score.draw`, `score.hq_archive_to_rnd_shuffle`, `score.rnd_archive_recycle`; lineSupport: +`corp.deck_recycle_engine` / -keine; strategicRole: +`engine_anchor` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Starke Engine, aber nicht automatisch Remote, Fast Advance oder Central Stabilize. Als Strategy-Anker nur sinnvoll, wenn eine eigene Deck-Recycle-/Value-Strategie eingeführt wird.

Target-/Constraint-Hinweis aus Review: Ability-ID wichtig, weil die Aktion aus einer gescorten Agenda kommt.

### Artificial Security Directors (onr_v1_189_artificial-security-directors)

Set: originalset-v1

Text: Difficulty of Black Ops agendas is reduced by 1.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.fast_advance -> enabler (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.fast_advance -> enabler/black_ops_difficulty_enabler (medium)`

Änderungen: strategySupportPairs: 1 -> 1

Review-Begründung: Subtype-Difficulty-Reduction erleichtert zukünftige Scores und kann Fast-Advance-/Scorefenster ermöglichen, trägt aber keine Black-Ops-Strategie als solche.

Target-/Constraint-Hinweis aus Review: constraint.only_black_ops_agendas

### Bioweapons Engineering (onr_v1_190_bioweapons-engineering)

Set: originalset-v1

Text: Each source of meat damage inflicts +1 meat damage.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.damage_amp`, `score.meat_damage_amp`
- Strategieanker: `corp.damage_kill`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.damage_kill -> engine_anchor/damage_amp_anchor (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.corp_meat_damage_amplifier`, `score.meat_damage_amp`
- Strategieanker: `corp.damage_kill`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.damage_kill -> enabler/meat_damage_amp_anchor (high)`

Änderungen: tacticSignals: +`damage.corp_meat_damage_amplifier` / -`score.damage_amp`; strategicRole: +`enabler` / -`engine_anchor`; strategySupportPairs: 1 -> 1

Review-Begründung: Die Karte macht vorhandene Meat-Damage-Quellen killfähiger, ist aber ohne Quellen unvollständig. DeckDoctrine sollte sie als Amplifier, nicht als Quelle zählen.

Target-/Constraint-Hinweis aus Review: keins

### Black Ice Quality Assurance (onr_v1_191_black-ice-quality-assurance)

Set: originalset-v1

Text: All black ice has +2 strength.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.strength_modifier`, `score.black_ice_strength_bonus`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_type_anchor (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.corp_strength_bonus`, `ice.corp_black_ice_strength_bonus`, `score.black_ice_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/black_ice_tax_anchor (high)`

Änderungen: tacticSignals: +`ice.corp_strength_bonus`, `ice.corp_black_ice_strength_bonus` / -`ice.strength_modifier`, `score.ice_type_tax_support`; strategySupportPairs: 1 -> 1

Review-Begründung: Globaler Stärke-Buff auf Black ICE trägt ICE-Tax/Glacier. Kein Damage-Anker nur wegen Black-Ice-Kontext.

Target-/Constraint-Hinweis aus Review: constraint.only_black_ice; kein TargetProfile, weil statischer globaler Buff

### Corporate Boon (onr_v1_192_corporate-boon)

Set: originalset-v1

Text: Put four Boon counters on Corporate Boon when you score it.
Boon counter: Gain an action. Use this ability only once per turn and only during your turn.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.action_counter_bank`, `score.action_gain`, `score.agenda_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `action.corp_counter_bank`, `action.corp_extra_action`, `score.action_counter_bank`, `limit.once_per_turn`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.action_tempo -> payoff_anchor/extra_action_counter_bank (medium)`

Änderungen: tacticSignals: +`action.corp_counter_bank`, `action.corp_extra_action`, `limit.once_per_turn` / -`score.action_gain`, `score.agenda_action`; lineSupport: +`corp.action_tempo` / -keine; strategicRole: +`payoff_anchor` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Vier banked extra actions sind stark, aber ohne dokumentierte Corp-Tempo-Strategy kein Fast-Advance- oder Remote-Anker. Extra Actions können Scores unterstützen, sind aber nicht automatisch Strategie.

Target-/Constraint-Hinweis aus Review: Self/counter cashout; keine echte Zielwahl

### Corporate Coup (onr_v1_193_corporate-coup)

Set: originalset-v1

Text: Put 15 from the bank on Corporate Coup when you score it.
[A]: Take 3 from Corporate Coup, if it has any bits.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.agenda_action`, `score.economy_action`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_counter_bank`, `economy.corp_counter_cashout_action`, `score.economy_counter_bank`, `score.agenda_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_counter_bank`, `economy.corp_counter_cashout_action` / -`score.economy_action`

Review-Begründung: Banked Credits nach Score sind starke Economy, aber reine Economy erzeugt keinen Strategieanker.

Target-/Constraint-Hinweis aus Review: Self/counter cashout

### Corporate Downsizing (onr_v1_194_corporate-downsizing)

Set: originalset-v1

Text: When you score Corporate Downsizing, show to Runner any number of agenda cards stored in HQ. Gain bits equal to twice the combined agenda points of these cards; then shuffle them into R&D.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.economy_conditional_burst`, `score.hq_agenda_reveal`, `score.hq_agenda_shuffle`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `economy.corp_agenda_reveal_burst`, `hq.corp_agenda_density_reduction`, `rnd.corp_agenda_shuffle_from_hq`, `score.hq_agenda_reveal`, `score.hq_agenda_shuffle`
- Strategieanker: `corp.central_stabilize`
- Strategische Rollen: `defensive_tool`
- StrategySupportPairs: `corp.central_stabilize -> defensive_tool/hq_agenda_flood_cleanup (medium)`

Änderungen: tacticSignals: +`economy.corp_agenda_reveal_burst`, `hq.corp_agenda_density_reduction`, `rnd.corp_agenda_shuffle_from_hq` / -`score.economy_conditional_burst`; lineSupport: +`corp.central_stabilize` / -keine; strategicRole: +`defensive_tool` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Der Effekt ist nicht nur Economy: er räumt Agendas aus HQ und stabilisiert gegen HQ-Steals. Wegen Konditionalität medium.

Target-/Constraint-Hinweis aus Review: Choice: any number of agenda cards in HQ; side-safe, weil eigene HQ-Karten.

### Corporate Retreat (onr_v1_195_corporate-retreat)

Set: originalset-v1

Text: You lose the following ability as soon as you rez or install any card. A: Gain [2].

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `risk.loses_ability_on_install_or_rez`, `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_credit_action`, `score.agenda_action`, `risk.loses_ability_on_install_or_rez`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_credit_action` / -`score.economy_action`

Review-Begründung: Die Karte ist riskante, langsame Economy. Kein Strategieanker, weil der Nutzen generisch ist und der Drawback stark einschränkt.

Target-/Constraint-Hinweis aus Review: constraint.ability_lost_on_install_or_rez

### Corporate War (onr_v1_196_corporate-war)

Set: originalset-v1

Text: If you have 12 or more bits in your pool when you score Corporate War, gain 12; otherwise, lose all bits.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `risk.economy_crash_on_score`, `risk.requires_corp_credit_threshold`, `score.economy_conditional_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_threshold_burst`, `score.economy_conditional_burst`, `risk.requires_corp_credit_threshold`, `risk.economy_crash_on_score`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_threshold_burst` / -keine

Review-Begründung: Reiner Economy-Swing mit hartem Risiko. Kein Fast-Advance-Anker nur wegen viel Geld.

Target-/Constraint-Hinweis aus Review: condition.corp_credits_at_score_at_least_12

### Data Fort Reclamation (onr_v1_197_data-fort-reclamation)

Set: originalset-v1

Text: Gain [10] and choose up to four cards stored in HQ when you score Data Fort Reclamation. Create a new data fort using the cards chosen. Install the cards one at a time; you may rez them when you install them. Then, return to the bank any of the [10] not spent.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.remote_fort_creation`, `score.remote_install_budget`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.remote_scoring -> engine_anchor/remote_setup_engine (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `install.corp_new_remote_fort_from_hq`, `economy.corp_install_rez_budget`, `score.remote_fort_creation`, `score.remote_install_budget`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.remote_scoring -> engine_anchor/remote_setup_engine (high)`

Änderungen: tacticSignals: +`install.corp_new_remote_fort_from_hq`, `economy.corp_install_rez_budget` / -keine; strategySupportPairs: 1 -> 1

Review-Begründung: Das ist eine echte Remote-Setup-Engine nach Score. Der Report liegt hier fachlich richtig; nur Zielwahl/Sequenz müssen nachgezogen werden.

Target-/Constraint-Hinweis aus Review: TargetProfile nötig: bis zu vier HQ-Karten wählen, Install-Reihenfolge, optional rezzen, Budget-Nutzung.

### Detroit Police Contract (onr_v1_198_detroit-police-contract)

Set: originalset-v1

Text: Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.economy_counter_bank`, `score.economy_recurring`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_recurring_counter_bank`, `economy.corp_start_turn_payout`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_recurring_counter_bank`, `economy.corp_start_turn_payout` / -`score.economy_recurring`

Review-Begründung: Recurring Credits sind nützlich, aber generische Economy bleibt support-only.

Target-/Constraint-Hinweis aus Review: Self counter bank; keine Zielwahl

### Employee Empowerment (onr_v1_199_employee-empowerment)

Set: originalset-v1

Text: You may choose to draw an additional card at the start of each of your turns. [A]: Draw two cards.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.agenda_action`, `score.draw`, `score.recurring_draw`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `draw.corp_recurring_optional`, `draw.corp_action_draw`, `score.recurring_draw`, `score.agenda_action`
- Strategieanker: `corp.draw_engine`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.draw_engine -> engine_anchor/scored_optional_draw_engine (medium)`

Änderungen: tacticSignals: +`draw.corp_recurring_optional`, `draw.corp_action_draw` / -`score.draw`; lineSupport: +`corp.draw_engine` / -keine; strategicRole: +`engine_anchor` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Wiederholbarer Draw ist stark, aber generisch. Ohne eigene Draw-Engine-Strategy kein Strategieanker.

Target-/Constraint-Hinweis aus Review: keins

### Encryption Breakthrough (onr_v1_200_encryption-breakthrough)

Set: originalset-v1

Text: All code gates have +1 strength. When you score Encryption Breakthrough, reveal as many code gates as you wish. Then, gain 1 for each revealed or rezzed code gate.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.strength_modifier`, `score.code_gate_strength_bonus`, `score.ice_type_reveal_economy`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_type_anchor (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.corp_code_gate_strength_bonus`, `ice.corp_strength_bonus`, `economy.corp_ice_type_reveal_burst`, `score.code_gate_strength_bonus`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/code_gate_tax_anchor (high)`

Änderungen: tacticSignals: +`ice.corp_code_gate_strength_bonus`, `ice.corp_strength_bonus`, `economy.corp_ice_type_reveal_burst` / -`ice.strength_modifier`, `score.ice_type_reveal_economy`; strategySupportPairs: 1 -> 1

Review-Begründung: Code-Gate-Buff trägt ICE-Tax. Reveal-Economy ist Supporting Evidence, nicht der Ankergrund.

Target-/Constraint-Hinweis aus Review: constraint.only_code_gates; kein TargetProfile für globalen Buff

### Executive Extraction (onr_v1_201_executive-extraction)

Set: originalset-v1

Text: Difficulty of Gray Ops agendas is reduced by 1.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.fast_advance -> enabler (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.fast_advance -> enabler/gray_ops_difficulty_enabler (medium)`

Änderungen: strategySupportPairs: 1 -> 1

Review-Begründung: Difficulty-Reduction erleichtert zukünftige Scores; Gray Ops bleibt Scope, keine Strategie.

Target-/Constraint-Hinweis aus Review: constraint.only_gray_ops_agendas

### Genetics-Visionary Acquisition (onr_v1_202_genetics-visionary-acquisition)

Set: originalset-v1

Text: Difficulty of Research agendas is reduced by 1.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.agenda_difficulty_discount`, `score.research_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.fast_advance -> enabler (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `score.agenda_difficulty_discount`, `score.research_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.fast_advance -> enabler/research_difficulty_enabler (medium)`

Änderungen: strategySupportPairs: 1 -> 1

Review-Begründung: Research-Difficulty-Reduction ist Score-Enabler. Nicht aus Research-Subtype eine eigene Strategie ableiten.

Target-/Constraint-Hinweis aus Review: constraint.only_research_agendas

### Hostile Takeover (onr_v1_203_hostile-takeover)

Set: originalset-v1

Text: Gain 5 credits when scored.

Review-Status: behalten; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.economy_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `economy.corp_credit_burst`, `score.economy_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_credit_burst` / -keine

Review-Begründung: 5 Credits beim Score sind generischer Support und tragen keine Decklinie direkt.

Target-/Constraint-Hinweis aus Review: keins

### Ice Transmutation (onr_v1_204_ice-transmutation)

Set: originalset-v1

Text: Choose a piece of rezzed ice when you score Ice Transmutation. That ice now has +1 strength, and each subroutine on it is repeated once. Treat this as if each repeated subroutine appeared immediately after the original subroutine.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.strength_modifier`, `ice.subroutine_modifier`, `score.chosen_ice_strength_bonus`, `score.repeat_ice_subroutines`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.ice_tax_glacier -> payoff_anchor/ice_upgrade_payoff (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.corp_strength_bonus_chosen`, `ice.corp_subroutine_repeat`, `score.chosen_ice_strength_bonus`, `score.repeat_ice_subroutines`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.ice_tax_glacier -> payoff_anchor/ice_upgrade_payoff (high)`

Änderungen: tacticSignals: +`ice.corp_strength_bonus_chosen`, `ice.corp_subroutine_repeat` / -`ice.strength_modifier`, `ice.subroutine_modifier`; strategySupportPairs: 1 -> 1

Review-Begründung: Permanenter gezielter ICE-Upgrade-Payoff ist klarer ICE-Tax/Glacier-Anker.

Target-/Constraint-Hinweis aus Review: TargetProfile nötig: Choose a rezzed ICE; priorisiere sichtbares, zentrales oder Remote-schützendes ICE mit starken Subroutinen.

### Main-Office Relocation (onr_v1_205_main-office-relocation)

Set: originalset-v1

Text: Hand size +2.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.hand_size`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `setup.corp_hand_size`, `score.hand_size`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`setup.corp_hand_size` / -keine

Review-Begründung: Handsize ist generischer Setup-/Stabilitätsnutzen. Kein Strategieanker.

Target-/Constraint-Hinweis aus Review: keins

### Marine Arcology (onr_v1_206_marine-arcology)

Set: originalset-v1

Text: A, A: Gain [3].

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_two_action_credit_gain`, `score.agenda_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_two_action_credit_gain` / -`score.economy_action`

Review-Begründung: A,A für 3 Credits ist generische Economy. Keine Decklinie.

Target-/Constraint-Hinweis aus Review: keins

### Netwatch Operations Office (onr_v1_207_netwatch-operations-office)

Set: originalset-v1

Text: [A]: Trace 2 - If trace is successful, give Runner a tag.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.tag_source`, `score.trace_tag_source`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.tag_trace_punish -> engine_anchor/tag_source (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `trace.corp_source`, `tag.corp_trace_tag_source`, `condition.trace_success`, `score.trace_tag_source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_tag_source (high)`

Änderungen: tacticSignals: +`trace.corp_source`, `tag.corp_trace_tag_source`, `condition.trace_success` / -`score.tag_source`, `tag.source`, `trace.source`; strategicRole: +`enabler` / -`engine_anchor`; strategySupportPairs: 1 -> 1

Review-Begründung: Wiederholbare Trace→Tag-Ability ist Tag-Quelle, kein Payoff. Geringe Trace-Stärke betrifft Action-Scoring, nicht die Rollenklasse.

Target-/Constraint-Hinweis aus Review: keins

### On-Call Solo Team (onr_v1_208_on-call-solo-team)

Set: originalset-v1

Text: [A]: Do 1 meat damage. Use this ability only if Runner is tagged.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/damage_payoff (high)`; `corp.tag_trace_punish -> punish_payoff (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.corp_meat_damage_source`, `tag.corp_tagged_runner_payoff`, `condition.requires_tagged_runner`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/tagged_meat_damage_payoff (high)`; `corp.tag_trace_punish -> punish_payoff/tagged_runner_punish_payoff (high)`

Änderungen: tacticSignals: +`damage.corp_tagged_meat_payoff`, `damage.corp_meat_damage_source`, `tag.corp_tagged_runner_payoff`, `condition.requires_tagged_runner` / -`damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`; strategySupportPairs: 2 -> 2

Review-Begründung: Die Karte nutzt Tags als Bedingung und verursacht Meat Damage. Sie ist keine Tagquelle, sondern Payoff für Tag-/Damage-Linien.

Target-/Constraint-Hinweis aus Review: keins

### Political Coup (onr_v1_209_political-coup)

Set: originalset-v1

Text: Put 12 from the bank on Political Coup when you score it.
[A]: Take 3 from Political Coup, if it has any bits.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.agenda_action`, `score.economy_action`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_counter_bank`, `economy.corp_counter_cashout_action`, `score.economy_counter_bank`, `score.agenda_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_counter_bank`, `economy.corp_counter_cashout_action` / -`score.economy_action`

Review-Begründung: Banked Credits nach Score sind Economy-Support, keine Strategie.

Target-/Constraint-Hinweis aus Review: Self/counter cashout

### Political Overthrow (onr_v1_210_political-overthrow)

Set: originalset-v1

Text: A: Gain [3].

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `score.high_agenda_value`, `score.vanilla_points`, `economy.corp_credit_action`, `score.agenda_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`score.high_agenda_value`, `score.vanilla_points`, `economy.corp_credit_action` / -`score.economy_action`

Review-Begründung: Die eigentliche strategische Relevanz ist der 6-Punkte-Score, nicht A: Gain 3. Als generelle Regel sollte `score.high_agenda_value` aber nicht automatisch Remote-Scoring erzeugen, sonst würden vanilla große Agendas zu Strategieankern.

Target-/Constraint-Hinweis aus Review: keins

### Polymer Breakthrough (onr_v1_211_polymer-breakthrough)

Set: originalset-v1

Text: Gain 1 at the start of each of your turns.

Review-Status: behalten; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.economy_recurring`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `economy.corp_recurring_credit`, `score.economy_recurring`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_recurring_credit` / -keine

Review-Begründung: Einfache wiederkehrende Credits sind Support-only.

Target-/Constraint-Hinweis aus Review: keins

### Priority Requisition (onr_v1_212_priority-requisition)

Set: originalset-v1

Text: You may rez a piece of ice, at no cost, when you score Priority Requisition.

Review-Status: kleine Änderung; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.free_rez_ice`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> scoring_tool/tempo_payoff (high)`; `corp.remote_scoring -> scoring_tool/score_window_payoff (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.corp_free_rez_on_score`, `score.free_rez_ice`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategische Rollen: `payoff_anchor`, `scoring_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> payoff_anchor/free_rez_ice_payoff (high)`; `corp.remote_scoring -> scoring_tool/free_rez_remote_defense (medium)`

Änderungen: tacticSignals: +`ice.corp_free_rez_on_score` / -keine; strategicRole: +`payoff_anchor` / -keine; strategySupportPairs: 2 -> 2

Review-Begründung: Free Rez ist ein echter ICE-Tax-Payoff und kann ein Scorefenster absichern. Kein Credit-Economy-Signal.

Target-/Constraint-Hinweis aus Review: TargetProfile nötig: choose a piece of ICE; priorisiere teures, relevantes, bisher unrezzed ICE auf gefährdetem Server/Scoring-Remote.

### Private Cybernet Police (onr_v1_213_private-cybernet-police)

Set: originalset-v1

Text: [A]: Trace 5 - If trace is successful, give Runner a tag.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.tag_source`, `score.trace_tag_source`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.tag_trace_punish -> engine_anchor/tag_source (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `trace.corp_source`, `tag.corp_trace_tag_source`, `condition.trace_success`, `score.trace_tag_source`
- Strategieanker: `corp.tag_trace_punish`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/trace_tag_source (high)`

Änderungen: tacticSignals: +`trace.corp_source`, `tag.corp_trace_tag_source`, `condition.trace_success` / -`score.tag_source`, `tag.source`, `trace.source`; strategicRole: +`enabler` / -`engine_anchor`; strategySupportPairs: 1 -> 1

Review-Begründung: Repeatable Trace 5→Tag ist klare Tag-Quelle, kein Payoff.

Target-/Constraint-Hinweis aus Review: keins

### Project Babylon (onr_v1_214_project-babylon)

Set: originalset-v1

Text: Score 1 additional agenda point for every two advancement counters over Project Babylon's difficulty that are on Project Babylon when you score it.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.conditional_bonus_agenda_points`, `score.overadvance_bonus`, `score.overadvance_scaling`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `score.conditional_bonus_agenda_points`, `score.overadvance_bonus`, `score.overadvance_scaling`, `advance.overadvance_payoff`, `risk.overadvance_investment`
- Strategieanker: `corp.overadvance_value`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: `corp.overadvance_value -> win_condition/overadvance_agenda_point_payoff (high)`

Änderungen: tacticSignals: +`advance.overadvance_payoff`, `risk.overadvance_investment` / -keine; lineSupport: +`corp.overadvance_value` / -keine; strategicRole: +`win_condition` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Bonus-Agenda-Punkte durch Overadvance sind ein echter Score-/Closeout-Payoff. Nicht Fast Advance, aber Remote-/Overadvance-Scoreplan.

Target-/Constraint-Hinweis aus Review: keins; Overadvance-Bewertung braucht Boardstate/Scorefenster, aber keine Zielwahl.

### Security Net Optimization (onr_v1_215_security-net-optimization)

Set: originalset-v1

Text: Choose a fort when scored. Ice installed on that fort gets +1 strength.

Review-Status: kleine Änderung; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.strength_modifier`, `score.fort_ice_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/fort_tax_anchor (high)`; `corp.remote_scoring -> tax_tool/remote_defense_anchor (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.corp_fort_strength_bonus`, `ice.corp_strength_bonus`, `score.fort_ice_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategische Rollen: `tax_tool`, `defensive_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/fort_tax_anchor (high)`; `corp.remote_scoring -> defensive_tool/remote_defense_anchor (medium)`

Änderungen: tacticSignals: +`ice.corp_fort_strength_bonus`, `ice.corp_strength_bonus` / -`ice.strength_modifier`; strategicRole: +`defensive_tool` / -keine; strategySupportPairs: 2 -> 2

Review-Begründung: Fortbezogener ICE-Buff trägt ICE-Tax; Remote-Pair nur dann mittelbar, wenn der gewählte Fort ein Scoring-/Schutzserver ist.

Target-/Constraint-Hinweis aus Review: TargetProfile nötig: choose a fort; priorisiere scoring remote oder stark contestete zentrale Forts je Boardstate.

### Security Purge (onr_v1_216_security-purge)

Set: originalset-v1

Text: Show the top three cards of R&D to Runner when you score Security Purge. If any of those cards are ice, install and rez them, at no cost. Trash the rest of those cards.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `access.rnd_reveal_requirement`, `score.free_install_and_rez_ice`, `score.rnd_install_and_rez`, `score.rnd_reveal`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategische Rollen: `scoring_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> scoring_tool/setup_payoff (medium)`; `corp.remote_scoring -> scoring_tool/setup_payoff (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `info.corp_reveal_top_rnd_to_runner`, `install.corp_rnd_ice_install`, `ice.corp_free_rez`, `score.free_install_and_rez_ice`, `risk.trash_revealed_non_ice`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.ice_tax_glacier -> enabler/free_install_rez_ice (medium)`

Änderungen: tacticSignals: +`info.corp_reveal_top_rnd_to_runner`, `install.corp_rnd_ice_install`, `ice.corp_free_rez`, `risk.trash_revealed_non_ice` / -`access.rnd_reveal_requirement`, `score.rnd_install_and_rez`, `score.rnd_reveal`; lineSupport: +keine / -`corp.remote_scoring`; strategicRole: +`enabler` / -`scoring_tool`; strategySupportPairs: 2 -> 1

Review-Begründung: Die Karte baut ICE-Board auf und unterstützt Glacier. Remote-Scoring ist nur möglicher Verwendungsort, nicht primärer Strategieanker.

Target-/Constraint-Hinweis aus Review: TargetProfile/Sequence nötig: installiere/rezzed ICE aus R&D; Server/Position wählen; Non-ICE werden getrasht.

### Strike Force Kali (onr_v1_217_strike-force-kali)

Set: originalset-v1

Text: [A]: Do 2 meat damage. Use this ability only if Runner is tagged.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/damage_payoff (high)`; `corp.tag_trace_punish -> punish_payoff (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.corp_meat_damage_source`, `tag.corp_tagged_runner_payoff`, `condition.requires_tagged_runner`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/tagged_meat_damage_payoff (high)`; `corp.tag_trace_punish -> punish_payoff/tagged_runner_punish_payoff (high)`

Änderungen: tacticSignals: +`damage.corp_tagged_meat_payoff`, `damage.corp_meat_damage_source`, `tag.corp_tagged_runner_payoff`, `condition.requires_tagged_runner` / -`damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`; strategySupportPairs: 2 -> 2

Review-Begründung: 2 Meat Damage pro Aktion ist klarer tagged Runner Damage-Payoff. Keine Tagquelle.

Target-/Constraint-Hinweis aus Review: keins

### Subsidiary Branch (onr_v1_218_subsidiary-branch)

Set: originalset-v1

Text: Gain an action during each of your turns.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.recurring_extra_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `action.corp_recurring_extra_action`, `tempo.corp_recurring_action`, `score.recurring_extra_action`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.action_tempo -> engine_anchor/recurring_extra_action_engine (medium)`

Änderungen: tacticSignals: +`action.corp_recurring_extra_action`, `tempo.corp_recurring_action` / -keine; lineSupport: +`corp.action_tempo` / -keine; strategicRole: +`engine_anchor` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Dauerhafte zusätzliche Aktionen sind stark und deckprägend, aber laut aktueller Leitlinie nicht automatisch Fast Advance/Remote. Es fehlt wahrscheinlich eine eigene Action-Tempo-Strategy.

Target-/Constraint-Hinweis aus Review: keins

### Superior Net Barriers (onr_v1_219_superior-net-barriers)

Set: originalset-v1

Text: All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain 1 for each revealed or rezzed wall.

Review-Status: kleine Änderung; Priorität: low.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.strength_modifier`, `score.ice_type_reveal_economy`, `score.ice_type_tax_support`, `score.wall_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/ice_type_anchor (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `ice.corp_wall_strength_bonus`, `ice.corp_strength_bonus`, `economy.corp_ice_type_reveal_burst`, `score.wall_strength_bonus`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategische Rollen: `tax_tool`
- StrategySupportPairs: `corp.ice_tax_glacier -> tax_tool/wall_tax_anchor (high)`

Änderungen: tacticSignals: +`ice.corp_wall_strength_bonus`, `ice.corp_strength_bonus`, `economy.corp_ice_type_reveal_burst` / -`ice.strength_modifier`, `score.ice_type_reveal_economy`; strategySupportPairs: 1 -> 1

Review-Begründung: Wall-Buff trägt ICE-Tax/Glacier. Reveal-Economy bleibt Supporting Evidence.

Target-/Constraint-Hinweis aus Review: constraint.only_walls; kein TargetProfile für globalen Buff

### Tycho Extension (onr_v1_220_tycho-extension)

Set: originalset-v1

Text: No additional ability.

Review-Status: behalten; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.high_agenda_value`, `score.vanilla_points`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.high_agenda_value`, `score.vanilla_points`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: _keine Feldänderung_

Review-Begründung: Keine Fähigkeit. Die Punktezahl ist wichtig für Bewertung, sollte aber nicht automatisch Remote-Scoring-Anker sein.

Target-/Constraint-Hinweis aus Review: keins

### AI Board Member (onr_proteus_001_ai-board-member)

Set: proteus

Text: You may gain an action during each of your turns. At the start of each of your turns, roll a die to see what the action will be for that turn, and then decide whether to take it. On a 1, you may use the action only to install a card; on a 2 or 3, only to gain 1; on a 4, 5, or 6, only to draw a card.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `risk.random_action`, `score.random_extra_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `action.corp_random_recurring_extra_action`, `risk.random_action_mode`, `action.corp_install_only_action`, `economy.corp_credit_action`, `draw.corp_draw_action`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `utility`
- StrategySupportPairs: `corp.action_tempo -> utility/random_recurring_action_mode (medium)`

Änderungen: tacticSignals: +`action.corp_random_recurring_extra_action`, `risk.random_action_mode`, `action.corp_install_only_action`, `economy.corp_credit_action`, `draw.corp_draw_action` / -`risk.random_action`, `score.random_extra_action`; lineSupport: +`corp.action_tempo` / -keine; strategicRole: +`utility` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Recurring Extra Action ist potenziell deckprägend, aber zufällig und nicht automatisch Fast Advance/Remote. Eigene Tempo-Strategie wäre sauberer.

Target-/Constraint-Hinweis aus Review: Random mode resolution; keine Zielwahl außer Folgeaktion.

### Charity Takeover (onr_proteus_002_charity-takeover)

Set: proteus

Text: Gain [9] and 1 Bad Publicity point. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `risk.bad_publicity`, `risk.loss_condition`, `score.bad_publicity_gain`, `score.bad_publicity_win_risk`, `score.economy_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=medium
- Taktiksignale: `economy.corp_credit_burst`, `risk.bad_publicity_gain`, `risk.bad_publicity_loss_condition`, `score.economy_burst`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: tacticSignals: +`economy.corp_credit_burst`, `risk.bad_publicity_gain`, `risk.bad_publicity_loss_condition` / -`risk.bad_publicity`, `risk.loss_condition`, `score.bad_publicity_gain`, `score.bad_publicity_win_risk`

Review-Begründung: 9 Credits sind einfache Economy mit hartem Bad-Publicity-Drawback. Keine Bad-Publicity-Strategy und kein Remote/Fast-Advance-Anker.

Target-/Constraint-Hinweis aus Review: condition.corp_bad_publicity_threshold_7_loss

### Corporate Headhunters (onr_proteus_003_corporate-headhunters)

Set: proteus

Text: Whenever Corporate Headhunters successfully does damage, Runner 's hand size is reduced by 1. A: Do 1 meat damage. Use this ability only if Runner is tagged.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.hand_size_pressure`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/damage_engine (high)`; `corp.tag_trace_punish -> punish_payoff (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `damage.corp_tagged_meat_payoff`, `damage.corp_meat_damage_source`, `damage.corp_hand_size_pressure_on_successful_damage`, `tag.corp_tagged_runner_payoff`, `condition.requires_tagged_runner`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategische Rollen: `engine_anchor`, `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> engine_anchor/tagged_meat_hand_size_pressure (high)`; `corp.tag_trace_punish -> punish_payoff/tagged_runner_punish_payoff (high)`

Änderungen: tacticSignals: +`damage.corp_tagged_meat_payoff`, `damage.corp_meat_damage_source`, `damage.corp_hand_size_pressure_on_successful_damage`, `tag.corp_tagged_runner_payoff`, `condition.requires_tagged_runner` / -`damage.payoff`, `risk.requires_tagged_runner`, `score.hand_size_pressure`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`; strategicRole: +`engine_anchor` / -keine; strategySupportPairs: 2 -> 2

Review-Begründung: Die Karte ist Kill-Engine: sie macht getaggten Schaden und reduziert zusätzlich Runner-Handgröße bei erfolgreichem Damage. Keine Brain-Damage-Semantik.

Target-/Constraint-Hinweis aus Review: keins

### Fetal AI (onr_proteus_004_fetal-ai)

Set: proteus

Text: When Runner accesses Fetal AI, do 2 Net damage, even if it is not installed. Ignore this effect if Runner accesses Fetal AI from the Archives. If Fetal AI is accessed from R&D, Runner must show it to you. Runner must pay 2 to steal Fetal AI, in addition to any other costs.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `access.agenda_ambush`, `access.agenda_net_damage`, `access.agenda_steal_tax`, `access.archives_safe_exception`, `access.rnd_reveal_requirement`, `damage.payoff`, `score.net_damage_access_punish`
- Strategieanker: `corp.damage_kill`, `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/access_punish (high)`; `corp.ambush_bluff -> punish_payoff/access_punish (high)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `access.corp_net_damage_ambush`, `access.corp_agenda_steal_tax`, `access.archives_safe_exception`, `access.rnd_reveal_requirement`, `damage.corp_net_damage_access_punish`
- Strategieanker: `corp.damage_kill`, `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.damage_kill -> punish_payoff/net_damage_steal_tax (high)`; `corp.ambush_bluff -> punish_payoff/agenda_net_damage_ambush (high)`

Änderungen: tacticSignals: +`access.corp_net_damage_ambush`, `access.corp_agenda_steal_tax`, `damage.corp_net_damage_access_punish` / -`access.agenda_ambush`, `access.agenda_net_damage`, `access.agenda_steal_tax`, `damage.payoff`, `score.net_damage_access_punish`; strategySupportPairs: 2 -> 2

Review-Begründung: Net-Damage beim Access plus Steal-Tax ist konkreter Access-Punish. `damage.payoff` darf nur Oberklasse sein.

Target-/Constraint-Hinweis aus Review: keins

### Marked Accounts (onr_proteus_005_marked-accounts)

Set: proteus

Text: When Runner accesses Marked Accounts, give Runner a tag, even if it is not installed. If Marked Accounts is accessed from R&D, Runner must show it to you.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `access.agenda_ambush`, `access.agenda_tag`, `access.rnd_reveal_requirement`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`, `corp.ambush_bluff`
- Strategische Rollen: `engine_anchor`
- StrategySupportPairs: `corp.tag_trace_punish -> engine_anchor/access_tag_source (high)`; `corp.ambush_bluff -> engine_anchor/access_punish (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `access.corp_tag_ambush`, `access.rnd_reveal_requirement`, `tag.corp_access_tag_source`
- Strategieanker: `corp.tag_trace_punish`, `corp.ambush_bluff`
- Strategische Rollen: `enabler`, `punish_payoff`
- StrategySupportPairs: `corp.tag_trace_punish -> enabler/access_tag_source (high)`; `corp.ambush_bluff -> punish_payoff/access_tag_ambush (medium)`

Änderungen: tacticSignals: +`access.corp_tag_ambush`, `tag.corp_access_tag_source` / -`access.agenda_ambush`, `access.agenda_tag`, `tag.source`; strategicRole: +`enabler`, `punish_payoff` / -`engine_anchor`; strategySupportPairs: 2 -> 2

Review-Begründung: Access-Tag ist Tagquelle und Ambush-Punish, aber kein persistenter Tag-Source und kein Payoff.

Target-/Constraint-Hinweis aus Review: keins

### Please Don't Choke Anyone (onr_proteus_006_please-dont-choke-anyone)

Set: proteus

Text: For each 1 damage you successfully do, you may choose instead to prevent that damage and put a PDCA counter on Please Don't Choke Anyone. PDCA counter: Gain an action. Use this ability only once per turn and only during your turn.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.action_counter_bank`, `score.damage_conversion_action_engine`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `damage.corp_prevent_own_damage_for_counter`, `action.corp_damage_conversion_counter_bank`, `action.corp_counter_to_extra_action`, `limit.once_per_turn`
- Strategieanker: `corp.action_tempo`
- Strategische Rollen: `enabler`
- StrategySupportPairs: `corp.action_tempo -> enabler/damage_conversion_extra_action_bank (medium)`

Änderungen: tacticSignals: +`damage.corp_prevent_own_damage_for_counter`, `action.corp_damage_conversion_counter_bank`, `action.corp_counter_to_extra_action`, `limit.once_per_turn` / -`score.action_counter_bank`, `score.damage_conversion_action_engine`; lineSupport: +`corp.action_tempo` / -keine; strategicRole: +`enabler` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Die Karte nutzt Damage-Quellen, verhindert den Schaden aber. Daher kein Damage-Kill-Payoff, sondern alternative Tempo-Engine.

Target-/Constraint-Hinweis aus Review: Conversion trigger on successful damage; keine klassische Zielwahl

### Project Venice (onr_proteus_007_project-venice)

Set: proteus

Text: For every three advancement counters over Project Venice 's difficulty that are on Project Venice when you score it, gain an action during each of your turns.

Review-Status: ändern; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.overadvance_bonus`, `score.overadvance_scaling`, `score.recurring_extra_action`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `advance.overadvance_payoff`, `score.overadvance_bonus`, `score.overadvance_scaling`, `action.corp_recurring_extra_action`
- Strategieanker: `corp.overadvance_value`, `corp.action_tempo`
- Strategische Rollen: `win_condition`, `payoff_anchor`
- StrategySupportPairs: `corp.overadvance_value -> win_condition/overadvance_extra_action_payoff (high)`; `corp.action_tempo -> payoff_anchor/recurring_extra_action_payoff (medium)`

Änderungen: tacticSignals: +`advance.overadvance_payoff`, `action.corp_recurring_extra_action` / -`score.recurring_extra_action`; lineSupport: +`corp.overadvance_value`, `corp.action_tempo` / -keine; strategicRole: +`win_condition`, `payoff_anchor` / -keine; strategySupportPairs: 0 -> 2; quality.strategyCovered: false -> true

Review-Begründung: Recurring Extra Actions aus Overadvance sind ein starker Payoff, aber ohne eigene Overadvance-/Tempo-Strategie sollte kein Fast-Advance-Anker erzwungen werden.

Target-/Constraint-Hinweis aus Review: keins

### Project Zurich (onr_proteus_008_project-zurich)

Set: proteus

Text: For every two advancement counters over Project Zurich 's difficulty that are on Project Zurich when you score it, gain 1 at the start of each of your turns.

Review-Status: ändern; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: `score.economy_recurring`, `score.overadvance_bonus`, `score.overadvance_scaling`
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `advance.overadvance_payoff`, `score.overadvance_bonus`, `score.overadvance_scaling`, `economy.corp_recurring_credit`
- Strategieanker: `corp.overadvance_value`
- Strategische Rollen: `payoff_anchor`
- StrategySupportPairs: `corp.overadvance_value -> payoff_anchor/overadvance_recurring_credit_payoff (medium)`

Änderungen: tacticSignals: +`advance.overadvance_payoff`, `economy.corp_recurring_credit` / -`score.economy_recurring`; lineSupport: +`corp.overadvance_value` / -keine; strategicRole: +`payoff_anchor` / -keine; strategySupportPairs: 0 -> 1; quality.strategyCovered: false -> true

Review-Begründung: Overadvance erzeugt recurring Economy. Das ist Value-Support, aber ohne eigene Overadvance-Strategy kein Strategieanker.

Target-/Constraint-Hinweis aus Review: keins

### Viral Breeding Ground (onr_proteus_009_viral-breeding-ground)

Set: proteus

Text: When you score Breeding Ground, trash all cards installed in or on the fort Breeding Ground was installed in. When Runner accesses Breeding Ground, choose up to two programs for each advancement counter on Breeding Ground; Runner brings those programs into his or her hand.

Review-Status: ändern; Priorität: high.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `access.agenda_ambush`, `access.runner_program_bounce`, `access.runner_program_disruption`, `score.fort_trash_on_score`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/access_punish (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `access.corp_runner_program_bounce`, `access.corp_program_disruption`, `access.agenda_ambush`, `score.own_fort_trash_on_score`, `risk.trash_own_fort_on_score`
- Strategieanker: `corp.ambush_bluff`
- Strategische Rollen: `punish_payoff`
- StrategySupportPairs: `corp.ambush_bluff -> punish_payoff/program_bounce_ambush (medium)`

Änderungen: tacticSignals: +`access.corp_runner_program_bounce`, `access.corp_program_disruption`, `score.own_fort_trash_on_score`, `risk.trash_own_fort_on_score` / -`access.runner_program_bounce`, `access.runner_program_disruption`, `score.fort_trash_on_score`; strategySupportPairs: 1 -> 1

Review-Begründung: Access-Punish ist Programmbounce, nicht Damage. Der Score-Effekt zerstört eigene Fort-Karten und darf nicht als positiver Remote-Setup-Anker gelesen werden.

Target-/Constraint-Hinweis aus Review: TargetProfile nötig: choose up to two programs per advancement counter; eigene Score-Resolution trashing in/on fort beachten.

### World Domination (onr_proteus_010_world-domination)

Set: proteus

Text: Score an additional 4 agenda points when you score World Domination.

Review-Status: kleine Änderung; Priorität: medium.

Vorher:
- AI-Status: strategyCovered=true, confidence=high
- Taktiksignale: `risk.high_difficulty_agenda`, `score.bonus_agenda_points`, `score.closeout_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: `corp.remote_scoring -> win_condition (medium)`

Nachher:
- AI-Status: strategyCovered=true, confidence=medium
- Taktiksignale: `score.bonus_agenda_points`, `score.closeout_agenda`, `risk.large_advancement_investment`, `risk.high_difficulty_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategische Rollen: `win_condition`
- StrategySupportPairs: `corp.remote_scoring -> win_condition/one_card_score_closeout (medium)`

Änderungen: tacticSignals: +`risk.large_advancement_investment` / -keine; strategySupportPairs: 1 -> 1

Review-Begründung: Die Karte ist eine klare Win-Condition, aber der riesige Advance-Aufwand senkt die praktische Confidence. Nicht Fast Advance.

Target-/Constraint-Hinweis aus Review: keins

### Project Agenda (v08_project_agenda)

Set: testset

Text: _kein Kartentext gefunden_

Review-Status: behalten; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=low
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: _keine Feldänderung_

Review-Begründung: Keine Semantik nötig außer Test-/Fixture-Trennung.

Target-/Constraint-Hinweis aus Review: testOnly/fixtureOnly markieren; no_signal_reason=vanilla_fixture

### Simple Agenda (simple_agenda)

Set: testset

Text: _kein Kartentext gefunden_

Review-Status: behalten; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=low
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: _keine Feldänderung_

Review-Begründung: Keine Semantik nötig außer Test-/Fixture-Trennung.

Target-/Constraint-Hinweis aus Review: testOnly/fixtureOnly markieren; no_signal_reason=vanilla_fixture

### Simple Priority Agenda (simple_priority_agenda)

Set: testset

Text: _kein Kartentext gefunden_

Review-Status: behalten; Priorität: low.

Vorher:
- AI-Status: strategyCovered=false, confidence=low
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Nachher:
- AI-Status: strategyCovered=false, confidence=high
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategische Rollen: _keine_
- StrategySupportPairs: _keine_

Änderungen: _keine Feldänderung_

Review-Begründung: Keine Semantik nötig außer Test-/Fixture-Trennung.

Target-/Constraint-Hinweis aus Review: testOnly/fixtureOnly markieren; no_signal_reason=vanilla_fixture

