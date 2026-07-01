# Agenda Strategy/Rolle Hierarchy Pilot Report

Datum: 2026-07-01

Scope: Alle Agenda-Karten mit aktivem AI-Hint im aktuellen Kartendatenbestand. Vorher ist `HEAD:data/ai/ai-card-hints-active.json`; Nachher ist der aktuelle Worktree `data/ai/ai-card-hints-active.json`.

## Zusammenfassung

- Geprüfte Agendas: 50 (classic: 4, originalset-v1: 33, proteus: 10, testset: 3).
- Geänderte Agendas: 25.
- Agendas mit expliziten Strategie/Rolle-Paaren nach dem Pilot: 25.
- Explizite Strategie/Rolle-Paare nach dem Pilot: 33.
- Bestehende Summary-Felder `lineSupport` und `strategicRole` bleiben erhalten; die neue geprüfte Hierarchie liegt in `strategySupportPairs`.
- Agendas ohne echten Strategieanker bleiben bewusst support-only und haben keine künstlichen Rollenpaare.

## Leseschlüssel

- Taktiksignale: direkte `tacticSignals` im aktiven Hint.
- Strategiesignale/Strategieanker: `lineSupport`.
- Strategierollen: bisheriges Summary-Feld `strategicRole`.
- Strategie/Rolle-Paare: neue hierarchische Zuordnung `strategySupportPairs`, dargestellt als `strategyId -> role/roleDetail`.

## Agenda-Liste

## Set: classic

### Data Fort Remapping (`onr_classic_001_data-fort-remapping`)

Text: Put a Remap counter on Data Fort Remapping when you score it. Remap Counter: End a run.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.action_counter_bank`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `defensive_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.action_counter_bank`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `defensive_tool`
- Strategie/Rolle-Paare:
  - `corp.remote_scoring` -> `defensive_tool/remote_defense_tool` (medium; Evidence: `score.action_counter_bank`; Grund: Scored Agenda banks a run-ending counter, protecting scored remotes and remote-score conversion without becoming a pure ICE-tax card.)

### Superserum (`onr_classic_002_superserum`)

Text: When you score Superserum, remove all Virus counters, and avoid receiving the next two Virus counters Runner gives to you.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `virus.corp_counter_prevention`
- Strategieanker: `corp.central_stabilize`
- Strategierollen: `defensive_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `virus.corp_counter_prevention`
- Strategieanker: `corp.central_stabilize`
- Strategierollen: `defensive_tool`
- Strategie/Rolle-Paare:
  - `corp.central_stabilize` -> `defensive_tool/virus_counter_defense` (medium; Evidence: `virus.corp_counter_prevention`; Grund: Virus-counter reset and prevention stabilize central pressure after scoring; the card is defensive infrastructure, not a scoring payoff.)

### Theorem Proof (`onr_classic_004_theorem-proof`)

Text: If Runner accesses Theorem Proof, he or she does not score it, but instead may install it as a 2 MU program that has the ability "A: Score Theorem Proof" but is removed from the game if it leaves play in any other way.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=medium`
- Taktiksignale: `access.runner_program_bounce`, `risk.high_difficulty_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `scoring_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=medium`
- Taktiksignale: `access.runner_program_bounce`, `risk.high_difficulty_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `scoring_tool`
- Strategie/Rolle-Paare:
  - `corp.remote_scoring` -> `scoring_tool/access_replacement_score_tool` (medium; Evidence: `score.closeout_agenda`, `risk.high_difficulty_agenda`, `access.runner_program_bounce`; Grund: The access replacement denies normal steal scoring and creates a difficult delayed score line, so it belongs under remote scoring as a scoring tool with high-difficulty risk.)

### Unlisted Research Lab (`onr_classic_003_unlisted-research-lab`)

Text: Draw an additional card at the start of each of your turns.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.recurring_draw`, `draw.corp_draw`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.recurring_draw`, `draw.corp_draw`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - `corp.remote_scoring` -> `engine_anchor/scored_draw_engine` (medium; Evidence: `score.recurring_draw`, `draw.corp_draw`; Grund: Recurring draw after scoring turns a completed remote score into sustained follow-up pressure and supports continued remote scoring plans.)

## Set: originalset-v1

### AI Chief Financial Officer (`onr_v1_188_ai-chief-financial-officer`)

Text: [A]: Shuffle cards stored in HQ and the Archives into R&D; then draw five cards.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.draw`, `score.hq_archive_to_rnd_shuffle`, `score.rnd_archive_recycle`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.draw`, `score.hq_archive_to_rnd_shuffle`, `score.rnd_archive_recycle`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Artificial Security Directors (`onr_v1_189_artificial-security-directors`)

Text: Difficulty of Black Ops agendas is reduced by 1.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategierollen: `enabler`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategierollen: `enabler`
- Strategie/Rolle-Paare:
  - `corp.fast_advance` -> `enabler` (medium; Evidence: `score.agenda_difficulty_discount`, `score.black_ops_difficulty_discount`; Grund: Difficulty-Reduction ist funktional Fast-Advance-Support; der Black-Ops-Subtype selbst ist kein Anker.)

### Bioweapons Engineering (`onr_v1_190_bioweapons-engineering`)

Text: Each source of meat damage inflicts +1 meat damage.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.damage_amp`, `score.meat_damage_amp`
- Strategieanker: `corp.damage_kill`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.damage_amp`, `score.meat_damage_amp`
- Strategieanker: `corp.damage_kill`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - `corp.damage_kill` -> `engine_anchor/damage_amp_anchor` (high; Evidence: `score.meat_damage_amp`, `score.damage_amp`; Grund: Verstaerkt vorhandene Meat-Damage-Quellen und traegt damit echte Kill-Linien, erzeugt aber keinen Schaden allein.)

### Black Ice Quality Assurance (`onr_v1_191_black-ice-quality-assurance`)

Text: All black ice has +2 strength.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.black_ice_strength_bonus`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.black_ice_strength_bonus`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `tax_tool/ice_type_anchor` (high; Evidence: `score.black_ice_strength_bonus`, `score.ice_type_tax_support`; Grund: Black-ICE-Staerke ist ICE-Tax/Glacier-Anker; kein Damage-Anker allein aus dem Black-ICE-Kontext.)

### Corporate Boon (`onr_v1_192_corporate-boon`)

Text: Put four Boon counters on Corporate Boon when you score it. Boon counter: Gain an action. Use this ability only once per turn and only during your turn.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.action_counter_bank`, `score.action_gain`, `score.agenda_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.action_counter_bank`, `score.action_gain`, `score.agenda_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Corporate Coup (`onr_v1_193_corporate-coup`)

Text: Put 15 from the bank on Corporate Coup when you score it. [A]: Take 3 from Corporate Coup, if it has any bits.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Corporate Downsizing (`onr_v1_194_corporate-downsizing`)

Text: When you score Corporate Downsizing, show to Runner any number of agenda cards stored in HQ. Gain bits equal to twice the combined agenda points of these cards; then shuffle them into R&D.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_conditional_burst`, `score.hq_agenda_reveal`, `score.hq_agenda_shuffle`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_conditional_burst`, `score.hq_agenda_reveal`, `score.hq_agenda_shuffle`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Corporate Retreat (`onr_v1_195_corporate-retreat`)

Text: You lose the following ability as soon as you rez or install any card. A: Gain [2].

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.loses_ability_on_install_or_rez`, `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.loses_ability_on_install_or_rez`, `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Corporate War (`onr_v1_196_corporate-war`)

Text: If you have 12 or more bits in your pool when you score Corporate War, gain 12; otherwise, lose all bits.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.economy_crash_on_score`, `risk.requires_corp_credit_threshold`, `score.economy_conditional_burst`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.economy_crash_on_score`, `risk.requires_corp_credit_threshold`, `score.economy_conditional_burst`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Data Fort Reclamation (`onr_v1_197_data-fort-reclamation`)

Text: Gain [10] and choose up to four cards stored in HQ when you score Data Fort Reclamation. Create a new data fort using the cards chosen. Install the cards one at a time; you may rez them when you install them. Then, return to the bank any of the [10] not spent.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.remote_fort_creation`, `score.remote_install_budget`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.remote_fort_creation`, `score.remote_install_budget`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - `corp.remote_scoring` -> `engine_anchor/remote_setup_engine` (high; Evidence: `score.remote_fort_creation`, `score.remote_install_budget`; Grund: Echte Remote-Setup-Engine, aber Zielwahl/Install-Sequenz passt nicht in TargetProfile V1.)

### Detroit Police Contract (`onr_v1_198_detroit-police-contract`)

Text: Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_counter_bank`, `score.economy_recurring`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_counter_bank`, `score.economy_recurring`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Employee Empowerment (`onr_v1_199_employee-empowerment`)

Text: You may choose to draw an additional card at the start of each of your turns. [A]: Draw two cards.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.draw`, `score.recurring_draw`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.draw`, `score.recurring_draw`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Encryption Breakthrough (`onr_v1_200_encryption-breakthrough`)

Text: All code gates have +1 strength. When you score Encryption Breakthrough, reveal as many code gates as you wish. Then, gain 1 for each revealed or rezzed code gate.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.code_gate_strength_bonus`, `score.ice_type_reveal_economy`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.code_gate_strength_bonus`, `score.ice_type_reveal_economy`, `score.ice_type_tax_support`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `tax_tool/ice_type_anchor` (high; Evidence: `score.code_gate_strength_bonus`, `score.ice_type_tax_support`; Grund: Code-Gate-Buff traegt ICE-Tax; Reveal-Economy bleibt Support.)

### Executive Extraction (`onr_v1_201_executive-extraction`)

Text: Difficulty of Gray Ops agendas is reduced by 1.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategierollen: `enabler`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategierollen: `enabler`
- Strategie/Rolle-Paare:
  - `corp.fast_advance` -> `enabler` (medium; Evidence: `score.agenda_difficulty_discount`, `score.gray_ops_difficulty_discount`; Grund: Difficulty-Reduction ist Fast-Advance-Support; Gray-Ops-Subtype allein bleibt kein Strategieanker.)

### Genetics-Visionary Acquisition (`onr_v1_202_genetics-visionary-acquisition`)

Text: Difficulty of Research agendas is reduced by 1.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.agenda_difficulty_discount`, `score.research_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategierollen: `enabler`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.agenda_difficulty_discount`, `score.research_difficulty_discount`
- Strategieanker: `corp.fast_advance`
- Strategierollen: `enabler`
- Strategie/Rolle-Paare:
  - `corp.fast_advance` -> `enabler` (medium; Evidence: `score.agenda_difficulty_discount`, `score.research_difficulty_discount`; Grund: Research-Difficulty-Reduction ermoeglicht Fast-Advance-Linien, nicht Research als Subtyp.)

### Hostile Takeover (`onr_v1_203_hostile-takeover`)

Text: Gain 5 credits when scored.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_burst`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_burst`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Ice Transmutation (`onr_v1_204_ice-transmutation`)

Text: Choose a piece of rezzed ice when you score Ice Transmutation. That ice now has +1 strength, and each subroutine on it is repeated once. Treat this as if each repeated subroutine appeared immediately after the original subroutine.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `ice.subroutine_modifier`, `score.chosen_ice_strength_bonus`, `score.repeat_ice_subroutines`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `payoff_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `ice.subroutine_modifier`, `score.chosen_ice_strength_bonus`, `score.repeat_ice_subroutines`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `payoff_anchor`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `payoff_anchor/ice_upgrade_payoff` (high; Evidence: `score.chosen_ice_strength_bonus`, `score.repeat_ice_subroutines`; Grund: Gezielter ICE-Upgrade-Payoff; TargetProfile V1 waere moeglich, bleibt aber read-only Kandidat.)

### Main-Office Relocation (`onr_v1_205_main-office-relocation`)

Text: Hand size +2.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.hand_size`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.hand_size`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Marine Arcology (`onr_v1_206_marine-arcology`)

Text: A, A: Gain [3].

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Netwatch Operations Office (`onr_v1_207_netwatch-operations-office`)

Text: [A]: Trace 2 - If trace is successful, give Runner a tag.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.tag_source`, `score.trace_tag_source`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.tag_source`, `score.trace_tag_source`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - `corp.tag_trace_punish` -> `engine_anchor/tag_source` (high; Evidence: `score.trace_tag_source`, `score.tag_source`; Grund: Trace-Tag-Quelle, getrennt von Tag-Payoff.)

### On-Call Solo Team (`onr_v1_208_on-call-solo-team`)

Text: [A]: Do 1 meat damage. Use this ability only if Runner is tagged.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - `corp.damage_kill` -> `punish_payoff/damage_payoff` (high; Evidence: `score.tagged_meat_damage_payoff`, `score.meat_damage_source`; Grund: Tagged Meat-Damage-Payoff; Tag-Quelle und Payoff bleiben getrennt.)
  - `corp.tag_trace_punish` -> `punish_payoff` (high; Evidence: `risk.requires_tagged_runner`; Grund: Tagged Meat-Damage-Payoff; Tag-Quelle und Payoff bleiben getrennt.)

### Political Coup (`onr_v1_209_political-coup`)

Text: Put 12 from the bank on Political Coup when you score it. [A]: Take 3 from Political Coup, if it has any bits.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`, `score.economy_counter_bank`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Political Overthrow (`onr_v1_210_political-overthrow`)

Text: A: Gain [3].

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.agenda_action`, `score.economy_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Polymer Breakthrough (`onr_v1_211_polymer-breakthrough`)

Text: Gain 1 at the start of each of your turns.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_recurring`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_recurring`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Priority Requisition (`onr_v1_212_priority-requisition`)

Text: You may rez a piece of ice, at no cost, when you score Priority Requisition.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.free_rez_ice`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategierollen: `scoring_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.free_rez_ice`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategierollen: `scoring_tool`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `scoring_tool/tempo_payoff` (high; Evidence: `score.free_rez_ice`; Grund: Free-rez-payoff stuetzt ICE-Tax und Scoring-Window; nicht Economy-Reserve.)
  - `corp.remote_scoring` -> `scoring_tool/score_window_payoff` (medium; Evidence: `score.free_rez_ice`; Grund: Free-rez-payoff stuetzt ICE-Tax und Scoring-Window; nicht Economy-Reserve.)

### Private Cybernet Police (`onr_v1_213_private-cybernet-police`)

Text: [A]: Trace 5 - If trace is successful, give Runner a tag.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.tag_source`, `score.trace_tag_source`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `score.tag_source`, `score.trace_tag_source`, `tag.source`, `trace.source`
- Strategieanker: `corp.tag_trace_punish`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - `corp.tag_trace_punish` -> `engine_anchor/tag_source` (high; Evidence: `score.trace_tag_source`, `score.tag_source`; Grund: Trace-Tag-Quelle, getrennt von Payoff.)

### Project Babylon (`onr_v1_214_project-babylon`)

Text: Score 1 additional agenda point for every two advancement counters over Project Babylon's difficulty that are on Project Babylon when you score it.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.conditional_bonus_agenda_points`, `score.overadvance_bonus`, `score.overadvance_scaling`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.conditional_bonus_agenda_points`, `score.overadvance_bonus`, `score.overadvance_scaling`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Security Net Optimization (`onr_v1_215_security-net-optimization`)

Text: Choose a fort when scored. Ice installed on that fort gets +1 strength.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.fort_ice_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.fort_ice_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `tax_tool/fort_tax_anchor` (high; Evidence: `score.fort_ice_strength_bonus`; Grund: Fortbezogener ICE-Buff traegt ICE-Tax und Remote-Defense.)
  - `corp.remote_scoring` -> `tax_tool/remote_defense_anchor` (medium; Evidence: `score.fort_ice_strength_bonus`; Grund: Fortbezogener ICE-Buff traegt ICE-Tax und Remote-Defense.)

### Security Purge (`onr_v1_216_security-purge`)

Text: Show the top three cards of R&D to Runner when you score Security Purge. If any of those cards are ice, install and rez them, at no cost. Trash the rest of those cards.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.rnd_reveal_requirement`, `score.free_install_and_rez_ice`, `score.rnd_install_and_rez`, `score.rnd_reveal`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategierollen: `scoring_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.rnd_reveal_requirement`, `score.free_install_and_rez_ice`, `score.rnd_install_and_rez`, `score.rnd_reveal`
- Strategieanker: `corp.ice_tax_glacier`, `corp.remote_scoring`
- Strategierollen: `scoring_tool`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `scoring_tool/setup_payoff` (medium; Evidence: `score.free_install_and_rez_ice`, `score.rnd_install_and_rez`; Grund: R&D-Reveal plus free install/rez ist Setup-Payoff; Sequenzzielwahl bleibt schema gap.)
  - `corp.remote_scoring` -> `scoring_tool/setup_payoff` (medium; Evidence: `score.free_install_and_rez_ice`, `score.rnd_install_and_rez`; Grund: R&D-Reveal plus free install/rez ist Setup-Payoff; Sequenzzielwahl bleibt schema gap.)

### Strike Force Kali (`onr_v1_217_strike-force-kali`)

Text: [A]: Do 2 meat damage. Use this ability only if Runner is tagged.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - `corp.damage_kill` -> `punish_payoff/damage_payoff` (high; Evidence: `score.tagged_meat_damage_payoff`, `score.meat_damage_source`; Grund: Staerkerer Tagged Meat-Damage-Payoff; Tag-Quelle bleibt externe Bedingung.)
  - `corp.tag_trace_punish` -> `punish_payoff` (high; Evidence: `risk.requires_tagged_runner`; Grund: Staerkerer Tagged Meat-Damage-Payoff; Tag-Quelle bleibt externe Bedingung.)

### Subsidiary Branch (`onr_v1_218_subsidiary-branch`)

Text: Gain an action during each of your turns.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.recurring_extra_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.recurring_extra_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Superior Net Barriers (`onr_v1_219_superior-net-barriers`)

Text: All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain 1 for each revealed or rezzed wall.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.ice_type_reveal_economy`, `score.ice_type_tax_support`, `score.wall_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `ice.strength_modifier`, `score.ice_type_reveal_economy`, `score.ice_type_tax_support`, `score.wall_strength_bonus`
- Strategieanker: `corp.ice_tax_glacier`
- Strategierollen: `tax_tool`
- Strategie/Rolle-Paare:
  - `corp.ice_tax_glacier` -> `tax_tool/ice_type_anchor` (high; Evidence: `score.wall_strength_bonus`, `score.ice_type_tax_support`; Grund: Wall-Buff traegt ICE-Tax; Reveal-Economy bleibt Support.)

### Tycho Extension (`onr_v1_220_tycho-extension`)

Text: No additional ability.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.high_agenda_value`, `score.vanilla_points`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.high_agenda_value`, `score.vanilla_points`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

## Set: proteus

### AI Board Member (`onr_proteus_001_ai-board-member`)

Text: You may gain an action during each of your turns. At the start of each of your turns, roll a die to see what the action will be for that turn, and then decide whether to take it. On a 1, you may use the action only to install a card; on a 2 or 3, only to gain 1; on a 4, 5, or 6, only to draw a card.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.random_action`, `score.random_extra_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.random_action`, `score.random_extra_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Charity Takeover (`onr_proteus_002_charity-takeover`)

Text: Gain [9] and 1 Bad Publicity point. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.bad_publicity`, `risk.loss_condition`, `score.bad_publicity_gain`, `score.bad_publicity_win_risk`, `score.economy_burst`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `risk.bad_publicity`, `risk.loss_condition`, `score.bad_publicity_gain`, `score.bad_publicity_win_risk`, `score.economy_burst`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Corporate Headhunters (`onr_proteus_003_corporate-headhunters`)

Text: Whenever Corporate Headhunters successfully does damage, Runner 's hand size is reduced by 1. A: Do 1 meat damage. Use this ability only if Runner is tagged.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.hand_size_pressure`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `damage.payoff`, `risk.requires_tagged_runner`, `score.hand_size_pressure`, `score.meat_damage_source`, `score.tagged_meat_damage_payoff`, `tag.payoff`
- Strategieanker: `corp.damage_kill`, `corp.tag_trace_punish`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - `corp.damage_kill` -> `punish_payoff/damage_engine` (high; Evidence: `score.tagged_meat_damage_payoff`, `score.meat_damage_source`, `score.hand_size_pressure`; Grund: Tagged Meat-Damage plus Hand-size-Pressure ist Kill-Engine/Payoff; der Kartentext wird nicht als Brain-Damage-Quelle modelliert.)
  - `corp.tag_trace_punish` -> `punish_payoff` (high; Evidence: `risk.requires_tagged_runner`; Grund: Tagged Meat-Damage plus Hand-size-Pressure ist Kill-Engine/Payoff; der Kartentext wird nicht als Brain-Damage-Quelle modelliert.)

### Fetal AI (`onr_proteus_004_fetal-ai`)

Text: When Runner accesses Fetal AI, do 2 Net damage, even if it is not installed. Ignore this effect if Runner accesses Fetal AI from the Archives. If Fetal AI is accessed from R&D, Runner must show it to you. Runner must pay 2 to steal Fetal AI, in addition to any other costs.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.agenda_ambush`, `access.agenda_net_damage`, `access.agenda_steal_tax`, `access.archives_safe_exception`, `access.rnd_reveal_requirement`, `damage.payoff`, `score.net_damage_access_punish`
- Strategieanker: `corp.damage_kill`, `corp.ambush_bluff`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.agenda_ambush`, `access.agenda_net_damage`, `access.agenda_steal_tax`, `access.archives_safe_exception`, `access.rnd_reveal_requirement`, `damage.payoff`, `score.net_damage_access_punish`
- Strategieanker: `corp.damage_kill`, `corp.ambush_bluff`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - `corp.damage_kill` -> `punish_payoff/access_punish` (high; Evidence: `access.agenda_net_damage`, `score.net_damage_access_punish`; Grund: Access-Ambush mit Net-Damage und Steal-Tax; keine Runner-seitige verdeckte Semantik vor Access/Revealed.)
  - `corp.ambush_bluff` -> `punish_payoff/access_punish` (high; Evidence: `access.agenda_ambush`, `access.agenda_steal_tax`; Grund: Access-Ambush mit Net-Damage und Steal-Tax; keine Runner-seitige verdeckte Semantik vor Access/Revealed.)

### Marked Accounts (`onr_proteus_005_marked-accounts`)

Text: When Runner accesses Marked Accounts, give Runner a tag, even if it is not installed. If Marked Accounts is accessed from R&D, Runner must show it to you.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.agenda_ambush`, `access.agenda_tag`, `access.rnd_reveal_requirement`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`, `corp.ambush_bluff`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.agenda_ambush`, `access.agenda_tag`, `access.rnd_reveal_requirement`, `tag.source`
- Strategieanker: `corp.tag_trace_punish`, `corp.ambush_bluff`
- Strategierollen: `engine_anchor`
- Strategie/Rolle-Paare:
  - `corp.tag_trace_punish` -> `engine_anchor/access_tag_source` (high; Evidence: `access.agenda_tag`; Grund: Access-Tag-Quelle; Tag-source und spaetere Payoffs bleiben getrennt.)
  - `corp.ambush_bluff` -> `engine_anchor/access_punish` (medium; Evidence: `access.agenda_ambush`, `access.agenda_tag`; Grund: Access-Tag-Quelle; Tag-source und spaetere Payoffs bleiben getrennt.)

### Please Don't Choke Anyone (`onr_proteus_006_please-dont-choke-anyone`)

Text: For each 1 damage you successfully do, you may choose instead to prevent that damage and put a PDCA counter on Please Don't Choke Anyone. PDCA counter: Gain an action. Use this ability only once per turn and only during your turn.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.action_counter_bank`, `score.damage_conversion_action_engine`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.action_counter_bank`, `score.damage_conversion_action_engine`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Project Venice (`onr_proteus_007_project-venice`)

Text: For every three advancement counters over Project Venice 's difficulty that are on Project Venice when you score it, gain an action during each of your turns.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.overadvance_bonus`, `score.overadvance_scaling`, `score.recurring_extra_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.overadvance_bonus`, `score.overadvance_scaling`, `score.recurring_extra_action`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Project Zurich (`onr_proteus_008_project-zurich`)

Text: For every two advancement counters over Project Zurich 's difficulty that are on Project Zurich when you score it, gain 1 at the start of each of your turns.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_recurring`, `score.overadvance_bonus`, `score.overadvance_scaling`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=false`, `confidence=high`
- Taktiksignale: `score.economy_recurring`, `score.overadvance_bonus`, `score.overadvance_scaling`
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Viral Breeding Ground (`onr_proteus_009_viral-breeding-ground`)

Text: When you score Breeding Ground, trash all cards installed in or on the fort Breeding Ground was installed in. When Runner accesses Breeding Ground, choose up to two programs for each advancement counter on Breeding Ground; Runner brings those programs into his or her hand.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.agenda_ambush`, `access.runner_program_bounce`, `access.runner_program_disruption`, `score.fort_trash_on_score`
- Strategieanker: `corp.ambush_bluff`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `access.agenda_ambush`, `access.runner_program_bounce`, `access.runner_program_disruption`, `score.fort_trash_on_score`
- Strategieanker: `corp.ambush_bluff`
- Strategierollen: `punish_payoff`
- Strategie/Rolle-Paare:
  - `corp.ambush_bluff` -> `punish_payoff/access_punish` (medium; Evidence: `access.agenda_ambush`, `access.runner_program_disruption`; Grund: Programmbounce/-Disruption ist Access-Punish, kein Damage-Kill; Access-Zielwahl bleibt schema gap.)

### World Domination (`onr_proteus_010_world-domination`)

Text: Score an additional 4 agenda points when you score World Domination.

Änderungsstatus: **geändert**

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `risk.high_difficulty_agenda`, `score.bonus_agenda_points`, `score.closeout_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `win_condition`
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=true`, `strategyCovered=true`, `confidence=high`
- Taktiksignale: `risk.high_difficulty_agenda`, `score.bonus_agenda_points`, `score.closeout_agenda`
- Strategieanker: `corp.remote_scoring`
- Strategierollen: `win_condition`
- Strategie/Rolle-Paare:
  - `corp.remote_scoring` -> `win_condition` (medium; Evidence: `score.bonus_agenda_points`, `score.closeout_agenda`; Grund: Extrem hoher Score-Payoff ist Closeout/Win-Condition, aber wegen Difficulty kein Fast-Advance-Anker.)

## Set: testset

### Project Agenda (`v08_project_agenda`)

Text: Keine zusätzliche Fähigkeit.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=false`, `strategyCovered=false`, `confidence=low`
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=false`, `strategyCovered=false`, `confidence=low`
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Simple Agenda (`simple_agenda`)

Text: Keine zusätzliche Fähigkeit.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=false`, `strategyCovered=false`, `confidence=low`
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=false`, `strategyCovered=false`, `confidence=low`
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

### Simple Priority Agenda (`simple_priority_agenda`)

Text: Keine zusätzliche Fähigkeit.

Änderungsstatus: _unverändert_

**Vorher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=false`, `strategyCovered=false`, `confidence=low`
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_

**Nachher**

- Status: `aiSupportStatus=ai_supported`, `hintReviewed=false`, `strategyCovered=false`, `confidence=low`
- Taktiksignale: _keine_
- Strategieanker: _keine_
- Strategierollen: _keine_
- Strategie/Rolle-Paare:
  - _keine_
