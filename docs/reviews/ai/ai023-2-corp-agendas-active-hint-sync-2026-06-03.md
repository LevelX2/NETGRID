# AI023-2 Corp Agendas Active-Hint Sync

Stand: 2026-06-03
Guide: V3
Source Commit: 62e94b85

## Kurzfazit

AI023-2 synchronisiert alle 43 produktiven aktiven/compiled Corp-Agendas aus Originalset und Proteus zwischen Active Hints, Compiled Hints und Inspector. Vorher hatten 43 produktive Agendas mindestens ein in Active/Compiled vorhandenes Taktiksignal, das im Inspector nicht als Taktiksignal sichtbar war. Nach dem Sync gibt es 0 Missing-Signal-Karten.

Project Venice trägt jetzt im Inspector `score.overadvance_bonus`, `score.overadvance_scaling` und `score.recurring_extra_action`. Project Zurich trägt `score.economy_recurring`, `score.overadvance_bonus` und `score.overadvance_scaling`. Project Babylon verliert den alten abgeleiteten `corp.fast_advance`-Possible-Anchor und bleibt Overadvance-/Bonuspunkte-Support.

## Inventar

- Produktive aktive/compiled Corp-Agendas: 43
- Originalset: 33
- Proteus: 10
- Aktive Test-/V08-Agendas: 3, getrennt reportet
- Inaktive Classic-Agendas: 4, nicht aktiviert
- Count-Abweichungen: keine

## Semantikentscheidungen

- Overadvance ist kein automatisches Fast Advance: Project Babylon, Project Venice und Project Zurich haben keine `corp.fast_advance`-StrategySupportPairs.
- Economy, Draw, Hand Size und Action-Tempo bleiben Support, solange keine echte Strategie-ID und kein separater Strategieentscheid vorliegt.
- Fetal AI bleibt Access-Net-Damage/Steal-Tax/R&D-Reveal/Archives-Ausnahme, nicht Meat Damage.
- Marked Accounts bleibt Access-Tag-Ambush, nicht persistente Tag-Quelle.
- Viral Breeding Ground trennt Score-Fort-Trash von Access-Programm-Bounce.
- Bioweapons Engineering bleibt Meat-Damage-Amplifier und keine direkte Damage-Quelle.
- Corporate Headhunters bleibt tagged Meat Damage plus Hand-size Pressure, ohne Brain-Damage-Mischsignal.

## TargetProfiles und Constraints

TargetProfiles bleiben report-only Kandidaten oder schema gaps: Ice Transmutation, Priority Requisition, Security Net Optimization, Data Fort Reclamation, Security Purge, Corporate Downsizing und Viral Breeding Ground erzeugen keine Targeting-KI. Statische Scope-Effekte wie Black Ice Quality Assurance, Encryption Breakthrough und Superior Net Barriers bleiben Constraints beziehungsweise Scope-Semantik, keine TargetProfiles.

## Hidden Info

Der Sync ändert keine Runtime-Projektion. Verdeckte Corp-Agenda-Semantik wird nicht in PlayerViews, WebSocket-Payloads, Reconnect, Undo, Replay, Logs oder Client-Fehler projiziert. Der Inspector ist Entwickler-/Katalog-Evidence; Access-Ambush-Details bleiben spielseitig an bestehende Access-/Reveal-/Score-Sichtbarkeit gebunden.

## Korrigierte Inspector-Lücken

- AI Board Member: risk.random_action, score.random_extra_action
- Charity Takeover: risk.bad_publicity, risk.loss_condition, score.bad_publicity_gain, score.bad_publicity_win_risk, score.economy_burst
- Corporate Headhunters: damage.payoff, risk.requires_tagged_runner, score.hand_size_pressure, score.meat_damage_source, score.tagged_meat_damage_payoff, tag.payoff
- Fetal AI: access.agenda_ambush, access.agenda_net_damage, access.agenda_steal_tax, access.archives_safe_exception, access.rnd_reveal_requirement, score.net_damage_access_punish
- Marked Accounts: access.agenda_ambush, access.agenda_tag, access.rnd_reveal_requirement
- Please Don't Choke Anyone: score.action_counter_bank, score.damage_conversion_action_engine
- Project Venice: score.overadvance_bonus, score.overadvance_scaling, score.recurring_extra_action
- Project Zurich: score.economy_recurring, score.overadvance_bonus, score.overadvance_scaling
- Viral Breeding Ground: access.agenda_ambush, access.runner_program_bounce, access.runner_program_disruption, score.fort_trash_on_score
- World Domination: risk.high_difficulty_agenda, score.bonus_agenda_points, score.closeout_agenda
- AI Chief Financial Officer: score.draw, score.hq_archive_to_rnd_shuffle, score.rnd_archive_recycle
- Artificial Security Directors: score.agenda_difficulty_discount, score.black_ops_difficulty_discount
- Bioweapons Engineering: score.damage_amp, score.meat_damage_amp
- Black Ice Quality Assurance: score.black_ice_strength_bonus, score.ice_type_tax_support
- Corporate Boon: score.action_counter_bank, score.action_gain
- Corporate Coup: score.economy_action, score.economy_counter_bank
- Corporate Downsizing: score.economy_conditional_burst, score.hq_agenda_reveal, score.hq_agenda_shuffle
- Corporate Retreat: risk.loses_ability_on_install_or_rez, score.economy_action
- Corporate War: risk.economy_crash_on_score, risk.requires_corp_credit_threshold, score.economy_conditional_burst
- Data Fort Reclamation: score.remote_fort_creation, score.remote_install_budget
- Detroit Police Contract: score.economy_counter_bank, score.economy_recurring
- Employee Empowerment: score.draw, score.recurring_draw
- Encryption Breakthrough: score.code_gate_strength_bonus, score.ice_type_reveal_economy, score.ice_type_tax_support
- Executive Extraction: score.agenda_difficulty_discount, score.gray_ops_difficulty_discount
- Genetics-Visionary Acquisition: score.agenda_difficulty_discount, score.research_difficulty_discount
- Hostile Takeover: score.economy_burst
- Ice Transmutation: score.chosen_ice_strength_bonus, score.repeat_ice_subroutines
- Main-Office Relocation: score.hand_size
- Marine Arcology: score.economy_action
- Netwatch Operations Office: score.tag_source, score.trace_tag_source
- On-Call Solo Team: risk.requires_tagged_runner, score.meat_damage_source, score.tagged_meat_damage_payoff
- Political Coup: score.economy_action, score.economy_counter_bank
- Political Overthrow: score.economy_action
- Polymer Breakthrough: score.economy_recurring
- Priority Requisition: score.free_rez_ice
- Private Cybernet Police: score.tag_source, score.trace_tag_source
- Project Babylon: score.conditional_bonus_agenda_points, score.overadvance_bonus, score.overadvance_scaling
- Security Net Optimization: ice.strength_modifier, score.fort_ice_strength_bonus
- Security Purge: access.rnd_reveal_requirement, score.free_install_and_rez_ice, score.rnd_install_and_rez, score.rnd_reveal
- Strike Force Kali: risk.requires_tagged_runner, score.meat_damage_source, score.tagged_meat_damage_payoff
- Subsidiary Branch: score.recurring_extra_action
- Superior Net Barriers: score.ice_type_reveal_economy, score.ice_type_tax_support, score.wall_strength_bonus
- Tycho Extension: score.high_agenda_value, score.vanilla_points

## Artefakte

- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-hint-inspector-index.json`
- `scripts/build-ai-hint-inspector-index.mjs`
- `scripts/check-ai023-2-corp-agendas-active-hint-sync.mjs`
- `docs/reviews/ai/ai023-2-corp-agendas-active-hint-sync-report-2026-06-03.json`

## Verifikation

Die finale Checkliste steht im JSON-Report. Keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default-, UI-Derivations- oder Hidden-Info-Leak-Wirkung wurde erzeugt.
