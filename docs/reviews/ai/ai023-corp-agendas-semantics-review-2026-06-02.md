# AI023 Corp Agenda Semantics Review

## Kurzfazit

AI023 prüft alle 43 aktiven/compiled Corp-Agendas aus Originalset und Proteus sowie 4 bekannte inaktive Classic-Agendas. Reine Agenda-Punkte, reine Economy, Draw, Hand-size und Overadvance bleiben ohne pauschalen Strategieanker. Echte Strategieanker wurden nur für Difficulty/Fast-Advance, Damage/Kill, Tag/Punish, ICE-Tax/Glacier, Remote-Setup/Closeout und Access-Punish/Ambush gesetzt.

## Scope / Out-of-Scope

- Scope: aktive/compiled Corp-Agendas aus Originalset und Proteus; bekannte inaktive Classic-Agendas als Inventarcheck.
- Out-of-Scope: Corp ICE, Operations, Nodes, Upgrades, Runner-Karten, Engine, Planner, ActionScore, PlanWeight, LegalActions, Targeting-KI und Visibility-Regeln.
- Neue Strategy IDs: keine.

## Hidden-Info-Grenzen

Corp-Agenda-Semantik ist nur side-safe. Die Corp-KI darf eigene HQ-, R&D- und installierte Agenda-Semantik nur im Rahmen bestehender AI-Inputs nutzen. Runner-KI, Inspector- und Debug-Sichten dürfen verdeckte/ungeaccessete Corp-Agendas nicht als Fetal AI, Marked Accounts, World Domination oder andere konkrete Agenda ableiten. Der Review-Report beschreibt die Karten vollständig, ändert aber keine Runtime-Projektion.

## Inventarcounts

- Originalset: 33 aktive/compiled Corp-Agendas; Spoiler-Erwartung 33.
- Proteus: 10 aktive/compiled Corp-Agendas; Spoiler-Erwartung 10.
- Classic: 4 bekannte inaktive Corp-Agendas ohne aktive Hints.

## Clusterübersicht

- access_ambush_or_access_punish: 3
- agenda_difficulty_discount: 3
- agenda_recycle_or_rnd_hq_archives_manipulation: 2
- bad_publicity_agenda: 1
- damage_source_or_damage_amp: 1
- free_rez_or_install: 1
- ice_strength_or_ice_type_buff: 5
- overadvance_or_bonus_points: 3
- remote_or_fort_setup: 1
- risk_or_drawback_agenda: 2
- score_action_engine: 4
- score_draw_or_hand: 2
- score_economy_burst: 6
- score_economy_recurring: 2
- tag_source_or_trace_agenda: 2
- tagged_damage_payoff: 3
- vanilla_or_point_dense_agenda: 2

## Neue / wiederverwendete Taktiksignale

AI023 ergänzt 69 neue kontrollierte Corp-Agenda-Signale. Wiederverwendet werden unter anderem `trace.source`, `tag.source`, `tag.payoff`, `damage.payoff`, `ice.strength_modifier`, `ice.subroutine_modifier` und `score.agenda_action`.

- `score.high_agenda_value`: supportOnly=true, mayAnchor=false, anchors=none
- `score.vanilla_points`: supportOnly=true, mayAnchor=false, anchors=none
- `score.bonus_agenda_points`: supportOnly=true, mayAnchor=false, anchors=none
- `score.conditional_bonus_agenda_points`: supportOnly=true, mayAnchor=false, anchors=none
- `score.overadvance_bonus`: supportOnly=true, mayAnchor=false, anchors=none
- `score.overadvance_scaling`: supportOnly=true, mayAnchor=false, anchors=none
- `score.closeout_agenda`: supportOnly=false, mayAnchor=true, anchors=corp.remote_scoring
- `score.agenda_difficulty_discount`: supportOnly=false, mayAnchor=true, anchors=corp.fast_advance
- `score.black_ops_difficulty_discount`: supportOnly=true, mayAnchor=false, anchors=none
- `score.gray_ops_difficulty_discount`: supportOnly=true, mayAnchor=false, anchors=none
- `score.research_difficulty_discount`: supportOnly=true, mayAnchor=false, anchors=none
- `score.economy_burst`: supportOnly=true, mayAnchor=false, anchors=none
- `score.economy_conditional_burst`: supportOnly=true, mayAnchor=false, anchors=none
- `score.economy_recurring`: supportOnly=true, mayAnchor=false, anchors=none
- `score.economy_counter_bank`: supportOnly=true, mayAnchor=false, anchors=none
- `score.economy_action`: supportOnly=true, mayAnchor=false, anchors=none
- `score.bad_publicity_gain`: supportOnly=true, mayAnchor=false, anchors=none
- `score.bad_publicity_win_risk`: supportOnly=true, mayAnchor=false, anchors=none
- `score.action_counter_bank`: supportOnly=true, mayAnchor=false, anchors=none
- `score.action_gain`: supportOnly=true, mayAnchor=false, anchors=none
- `score.recurring_extra_action`: supportOnly=true, mayAnchor=false, anchors=none
- `score.random_extra_action`: supportOnly=true, mayAnchor=false, anchors=none
- `score.damage_conversion_action_engine`: supportOnly=true, mayAnchor=false, anchors=none
- `score.draw`: supportOnly=true, mayAnchor=false, anchors=none
- `score.recurring_draw`: supportOnly=true, mayAnchor=false, anchors=none
- `score.hand_size`: supportOnly=true, mayAnchor=false, anchors=none
- `score.hq_archive_to_rnd_shuffle`: supportOnly=true, mayAnchor=false, anchors=none
- `score.rnd_archive_recycle`: supportOnly=true, mayAnchor=false, anchors=none
- `score.hq_agenda_reveal`: supportOnly=true, mayAnchor=false, anchors=none
- `score.hq_agenda_shuffle`: supportOnly=true, mayAnchor=false, anchors=none
- `score.rnd_reveal`: supportOnly=true, mayAnchor=false, anchors=none
- `score.rnd_install_and_rez`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier, corp.remote_scoring
- `score.free_rez_ice`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier, corp.remote_scoring
- `score.free_install_and_rez_ice`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier, corp.remote_scoring
- `score.remote_fort_creation`: supportOnly=false, mayAnchor=true, anchors=corp.remote_scoring
- `score.remote_install_budget`: supportOnly=false, mayAnchor=true, anchors=corp.remote_scoring
- `score.fort_ice_strength_bonus`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier, corp.remote_scoring
- `score.chosen_ice_strength_bonus`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `score.repeat_ice_subroutines`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `score.code_gate_strength_bonus`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `score.wall_strength_bonus`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `score.black_ice_strength_bonus`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `score.ice_type_reveal_economy`: supportOnly=true, mayAnchor=false, anchors=none
- `score.ice_type_tax_support`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `score.trace_tag_source`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `score.tag_source`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `score.tagged_meat_damage_payoff`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill, corp.tag_trace_punish
- `score.meat_damage_source`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `score.meat_damage_amp`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `score.damage_amp`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `score.hand_size_pressure`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `score.net_damage_access_punish`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff, corp.damage_kill
- `score.fort_trash_on_score`: supportOnly=true, mayAnchor=false, anchors=none
- `access.agenda_ambush`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff
- `access.agenda_net_damage`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff, corp.damage_kill
- `access.agenda_tag`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff, corp.tag_trace_punish
- `access.agenda_steal_tax`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff
- `access.rnd_reveal_requirement`: supportOnly=true, mayAnchor=false, anchors=none
- `access.archives_safe_exception`: supportOnly=true, mayAnchor=false, anchors=none
- `access.runner_program_bounce`: supportOnly=true, mayAnchor=false, anchors=none
- `access.runner_program_disruption`: supportOnly=false, mayAnchor=true, anchors=corp.ambush_bluff
- `risk.economy_crash_on_score`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.bad_publicity`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.loss_condition`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.requires_corp_credit_threshold`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.loses_ability_on_install_or_rez`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.random_action`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.requires_tagged_runner`: supportOnly=true, mayAnchor=false, anchors=none
- `risk.high_difficulty_agenda`: supportOnly=true, mayAnchor=false, anchors=none

## Geänderte bestehende Signale

Keine bestehenden Taktiksignale wurden fachlich geändert.

## Strategieanker und strategySupportPairs

Alle kanonischen Rollen stehen als eindeutige `strategySupportPairs` im JSON-Report. Karten ohne Strategieanker erhalten keine kanonische strategische Rolle.

- Artificial Security Directors: `corp.fast_advance` -> `enabler` (medium)
- Bioweapons Engineering: `corp.damage_kill` -> `damage_amp_anchor` (high)
- Black Ice Quality Assurance: `corp.ice_tax_glacier` -> `ice_type_anchor` (high)
- Data Fort Reclamation: `corp.remote_scoring` -> `remote_setup_engine` (high)
- Encryption Breakthrough: `corp.ice_tax_glacier` -> `ice_type_anchor` (high)
- Executive Extraction: `corp.fast_advance` -> `enabler` (medium)
- Genetics-Visionary Acquisition: `corp.fast_advance` -> `enabler` (medium)
- Ice Transmutation: `corp.ice_tax_glacier` -> `ice_upgrade_payoff` (high)
- Netwatch Operations Office: `corp.tag_trace_punish` -> `tag_source` (high)
- On-Call Solo Team: `corp.damage_kill` -> `damage_payoff` (high)
- On-Call Solo Team: `corp.tag_trace_punish` -> `punish_payoff` (high)
- Priority Requisition: `corp.ice_tax_glacier` -> `tempo_payoff` (high)
- Priority Requisition: `corp.remote_scoring` -> `score_window_payoff` (medium)
- Private Cybernet Police: `corp.tag_trace_punish` -> `tag_source` (high)
- Security Net Optimization: `corp.ice_tax_glacier` -> `fort_tax_anchor` (high)
- Security Net Optimization: `corp.remote_scoring` -> `remote_defense_anchor` (medium)
- Security Purge: `corp.ice_tax_glacier` -> `setup_payoff` (medium)
- Security Purge: `corp.remote_scoring` -> `setup_payoff` (medium)
- Strike Force Kali: `corp.damage_kill` -> `damage_payoff` (high)
- Strike Force Kali: `corp.tag_trace_punish` -> `punish_payoff` (high)
- Superior Net Barriers: `corp.ice_tax_glacier` -> `ice_type_anchor` (high)
- Corporate Headhunters: `corp.damage_kill` -> `damage_engine` (high)
- Corporate Headhunters: `corp.tag_trace_punish` -> `punish_payoff` (high)
- Fetal AI: `corp.damage_kill` -> `access_punish` (high)
- Fetal AI: `corp.ambush_bluff` -> `access_punish` (high)
- Marked Accounts: `corp.tag_trace_punish` -> `access_tag_source` (high)
- Marked Accounts: `corp.ambush_bluff` -> `access_punish` (medium)
- Viral Breeding Ground: `corp.ambush_bluff` -> `access_punish` (medium)
- World Domination: `corp.remote_scoring` -> `win_condition` (medium)

## Entscheidungen

- Fast-Advance/Overadvance: Difficulty-Reduction-Agendas ankern `corp.fast_advance`; Project Babylon, Project Venice, Project Zurich und Tycho Extension bleiben ohne Strategieanker.
- Damage/Kill: Bioweapons Engineering, On-Call Solo Team, Strike Force Kali, Corporate Headhunters und Fetal AI ankern `corp.damage_kill`; Please Don't Choke Anyone nicht.
- Tag/Punish: Netwatch Operations Office, Private Cybernet Police, Marked Accounts, On-Call Solo Team, Strike Force Kali und Corporate Headhunters trennen Tag-Quelle und Payoff.
- ICE-Tax/Glacier: Black Ice Quality Assurance, Encryption Breakthrough, Superior Net Barriers, Ice Transmutation, Security Net Optimization, Priority Requisition und Security Purge ankern `corp.ice_tax_glacier`.
- Economy/Tempo: Economy-Agendas und reine Action-/Draw-/Handsize-Supportkarten bleiben ohne neue Economy-/Tempo-Strategy-ID.
- Access-Punish/Ambush: Fetal AI, Marked Accounts und Viral Breeding Ground erhalten Access-Punish-/Ambush-Semantik ohne Runner-Hidden-Info-Leak.

## TargetProfile-Kandidaten

- Corporate Downsizing: schema_gap (choose_hq_agendas_to_reveal_and_shuffle)
- Data Fort Reclamation: schema_gap (multi_card_hq_install_sequence, optional_rez_sequence)
- Encryption Breakthrough: schema_gap (reveal_code_gates_if_choice_supported)
- Ice Transmutation: candidate (use_target:rezzed_ice)
- Priority Requisition: candidate (use_target:installed_ice)
- Security Net Optimization: candidate (use_target:server)
- Security Purge: schema_gap (top_three_rnd_reveal_install_rez_sequence)
- Superior Net Barriers: schema_gap (reveal_walls_if_choice_supported)
- Viral Breeding Ground: schema_gap (access_choose_programs_by_advancement_counter)

## Deferred Items

- corp_tempo_or_agenda_economy_strategy: deferred. Corporate Boon, Subsidiary Branch und starke Economy-Agendas erhalten Taktiksignale, aber keine neue Strategy-ID ohne separate Taxonomieentscheidung.
- target_profile_v1_on_score_choices: deferred. Mehrere Agenda-Zielwahlen sind on-score oder mehrstufig; TargetProfile V1 bleibt diagnostischer Kandidat oder schema_gap ohne Targeting-KI.

## Post-Review-Liste

Die vollständige Kartenliste mit Taktiksignalen, Strategieankern, `strategySupportPairs`, TargetProfile-Status, Hidden-Info-Policy und Rationale steht im JSON-Report `ai023-corp-agendas-semantics-review-report-2026-06-02.json`.

## Verifikation

Nach dem Apply-Lauf sind die bestehenden AI-Gates und der AI023-Invariant-Check auszuführen. Der Review selbst setzt keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung.
