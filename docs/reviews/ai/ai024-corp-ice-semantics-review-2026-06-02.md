# AI024 Corp ICE Semantics Review

## Kurzfazit

AI024 prüft 95 aktive/compiled Korp-ICE aus Originalset und Proteus sowie 11 inaktive Classic-ICE. Subtypen bleiben Kartendaten und werden nicht als Taktiksignale gespiegelt. Neue `corp_ice.*`-Signale sind read-only und erzeugen keine Planner-, ActionScore-, PlanWeight-, Targeting-, Engine-, Legalitäts-, Profil-, UI- oder Hidden-Info-Wirkung.

## Inventar

- Originalset: 60 aktive/compiled Korp-ICE; Spoiler-Erwartung 60.
- Proteus: 35 aktive/compiled Korp-ICE; Spoiler-Erwartung 35.
- Classic: 11 bekannte inaktive Korp-ICE im Repo; der aktive Classic/Originalset-Pfad ist `originalset-v1`.

## Clusterübersicht

- brain_damage_ice: 6
- conditional_end_run_or_trace_end_run: 4
- jackout_lock_or_jackout_tax: 1
- meat_damage_ice: 2
- mobile_or_position_changing_ice: 1
- multi_end_run: 3
- net_damage_ice: 18
- other_ice_utility: 10
- position_or_outer_ice_scaling: 2
- program_trash: 7
- random_or_guessing_game: 3
- rez_paid_scaling: 4
- run_lock_or_action_tax: 4
- tag_counter_or_persistent_tag: 1
- type_choice_or_mode_choice: 6
- vanilla_end_run: 23

## Neue / wiederverwendete Taktiksignale

AI024 ergänzt 29 kontrollierte Korp-ICE-Signale. Wiederverwendet werden unter anderem `ice.etr`, `ice.future_pressure`, `ice.strength_modifier`, `damage.payoff`, `trace.source` und `tag.source`, sofern SideScope und Wirkung passen.

- `corp_ice.end_run`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.multi_end_run`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.conditional_end_run`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.runner_pay_or_end_run`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.net_damage`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `corp_ice.brain_damage`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `corp_ice.meat_damage`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `corp_ice.damage_source`: supportOnly=false, mayAnchor=true, anchors=corp.damage_kill
- `corp_ice.trace_source`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.tag_source`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.persistent_tag_source`: supportOnly=false, mayAnchor=true, anchors=corp.tag_trace_punish
- `corp_ice.program_trash`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.hardware_trash`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.run_lock`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.jackout_tax`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.encounter_tax`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.break_cost_tax`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.future_strength_buff`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.future_subroutine_modifier`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.position_scaling`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.outer_ice_scaling`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.rez_paid_scaling`: supportOnly=false, mayAnchor=true, anchors=corp.ice_tax_glacier
- `corp_ice.rez_economy`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.type_choice_or_mode_choice`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.mobile_position_change`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.self_bounce_or_maintenance_drawback`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.random_or_guessing`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.rnd_reorder`: supportOnly=true, mayAnchor=false, anchors=none
- `corp_ice.other_utility`: supportOnly=true, mayAnchor=false, anchors=none

## Vermiedene Subtyp-Signale

Nicht eingeführt wurden: `corp_ice.ap`, `corp_ice.black_ice`, `corp_ice.bloodhound`, `corp_ice.brainwipe`, `corp_ice.code_gate`, `corp_ice.dec_krash`, `corp_ice.firestarter`, `corp_ice.flatline`, `corp_ice.hellbolt`, `corp_ice.hellhound`, `corp_ice.killer`, `corp_ice.knockout`, `corp_ice.pit_bull`, `corp_ice.random`, `corp_ice.sentry`, `corp_ice.stun`, `corp_ice.sword`, `corp_ice.wall`, `corp_ice.watchdog`, `corp_ice.zombie`.

## Strategieanker

Einfache ETR-, Tag-/Trace-, Damage-, Program-Trash- oder Rez-Economy-ICE erhalten nicht automatisch einen Strategieanker. Anchors stehen nur dort im Report, wo der geprüfte ICE-Befund eine stärkere Tax-/Lock-/Damage-/Persistent-Tag-Linie trägt.

- Ball and Chain: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Banpei: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Bolter Cluster: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Bolter Cluster: `corp.damage_kill` -> `damage_pressure` (high)
- Canis Major: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Canis Minor: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Cerberus: `corp.damage_kill` -> `damage_pressure` (high)
- Cinderella: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Cinderella: `corp.damage_kill` -> `damage_pressure` (medium)
- Code Corpse: `corp.damage_kill` -> `damage_pressure` (high)
- Cortical Scrub: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Cortical Scrub: `corp.damage_kill` -> `damage_pressure` (high)
- D'Arc Knight: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Data Naga: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Data Raven: `corp.tag_trace_punish` -> `persistent_tag_source` (high)
- Data Wall 2.0: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Fatal Attractor: `corp.damage_kill` -> `damage_pressure` (medium)
- Fragmentation Storm: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Haunting Inquisition: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Homewrecker™: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Homewrecker™: `corp.damage_kill` -> `damage_pressure` (medium)
- Ice Pick Willie: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Liche: `corp.damage_kill` -> `damage_pressure` (high)
- Mastiff: `corp.damage_kill` -> `damage_pressure` (high)
- Reinforced Wall: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Sentinels Prime: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Triggerman: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Tutor: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Viral 15: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Virizz: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Wall of Ice: `corp.damage_kill` -> `damage_pressure` (high)
- Brain Wash: `corp.damage_kill` -> `damage_pressure` (high)
- Bug Zapper: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Death Yo-Yo: `corp.damage_kill` -> `damage_pressure` (high)
- Digiconda: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Dog Pile: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Food Fight: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Gatekeeper: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Homing Missile: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Hunting Pack: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Mastermind: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Mastermind: `corp.damage_kill` -> `damage_pressure` (medium)
- Minotaur: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Misleading Access Menus: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Sandstorm: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)
- Toughonium™ Wall: `corp.ice_tax_glacier` -> `ice_tax_or_lock_piece` (medium)

## TargetProfile-Kandidaten

- Too Many Doors: schema_gap (secret_bid_or_guessing_game)
- Caryatid: schema_gap (on_rez_type_or_mode_choice)
- Credit Blocks: schema_gap (on_rez_type_or_mode_choice)
- Digiconda: candidate (paid_x_or_rez_scaling)
- Food Fight: candidate (paid_x_or_rez_scaling)
- Galatea: schema_gap (on_rez_type_or_mode_choice)
- Gatekeeper: candidate (paid_x_or_rez_scaling)
- Homing Missile: candidate (paid_x_or_rez_scaling)
- Lesser Arcana: schema_gap (on_rez_type_or_mode_choice)
- Mobile Barricade: schema_gap (fort_position_change)
- Sandstorm: candidate (paid_x_or_rez_scaling)
- Sphinx 2006: schema_gap (on_rez_type_or_mode_choice)
- Sumo 2008: schema_gap (on_rez_type_or_mode_choice)
- Walking Wall: schema_gap (fort_position_change)

## Hidden-Info-Grenzen

Korp-ICE-Semantik bleibt `corp_side_only_until_rezzed`, bis ein ICE rezzed, exposed oder anderweitig legal bekannt ist. AI024 ergänzt keine Runner-seitige unrezzed-ICE-Sicht und keine WebSocket-, Reconnect-, Undo-, Replay-, PublicEvents-, Log- oder Client-Fehler-Projektion.

## Deferred Items

- target_profile_v1_for_ice_mode_paid_position_choices: deferred_or_schema_gap. On-rez type/mode choice, paid-X scaling, mobile position changes and secret guessing games are report-only until side-safe TargetProfile schema support exists.
- legal_action_semantic_bridge: deferred. ICE tactic signals remain read-only and do not generate legality, planner choices, ActionScore or PlanWeight behavior.

## Post-Review-Liste

Die vollständige Kartenliste mit Funktionsfamilie, Taktiksignalen, Strategieankern, `strategySupportPairs`, TargetProfile-Status und Hidden-Info-Policy steht im JSON-Report `ai024-corp-ice-semantics-review-report-2026-06-02.json`.
