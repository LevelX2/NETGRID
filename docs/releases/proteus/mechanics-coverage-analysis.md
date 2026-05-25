# Proteus Mechanics Coverage Analysis

Datum: 2026-05-17

## Ergebnis

Alle 154 Proteus-Karten aus `data/card-import/proteus-card-basis-2026-05-17.json` haben eine erste Mechanikabdeckungs-Einschätzung. Diese Analyse ist Planungsinput; sie implementiert keine Karte, erzeugt keine Decklegalität und erstellt keine AI-Hints.

Maschinenlesbare Matrix: `data/rules/proteus-mechanics-coverage-2026-05-17.json`

## Statusverteilung

| Status | Karten |
| --- | ---: |
| wahrscheinlich abgedeckt | 17 |
| kleiner Resolver nötig | 56 |
| Mechanikvertiefung nötig | 80 |
| blockiert/Regelklärung nötig | 1 |

## Mechanikcluster

| Cluster | ID | Karten |
| --- | --- | ---: |
| ICE-Encounter/Subroutinen | `ice_encounter_subroutines` | 35 |
| Economy/Draw-Basis | `economy_draw_basics` | 31 |
| Runner-Prep/Event ausspielen | `runner_prep_play` | 27 |
| Damage/Prevention/Core/Handgröße | `damage_prevention_and_core_hand_size` | 25 |
| Run-Event-Basis | `run_event_basics` | 23 |
| Runner-Programm installieren | `runner_program_install` | 23 |
| Icebreaker Break/Pump | `icebreaker_breaker_pump` | 22 |
| Runner-Resource installieren | `runner_resource_install` | 21 |
| Verdeckte Runner-Resources | `hidden_runner_resources` | 16 |
| Access/Breach/Multiaccess/Ambush | `access_breach_multiaccess_ambush` | 15 |
| Prevention/Avoid/Replacement | `prevention_avoid_replacement` | 15 |
| Trash/Forfeit/Sabotage | `trash_forfeit_sabotage` | 14 |
| Virus-/Antibody-/Counter-Familie | `virus_antibody_counter_family` | 13 |
| Corp-Upgrade installieren/rezzen/accessen | `corp_upgrade_root_install_rez_access` | 13 |
| Trace-/Link-Modifikatoren | `trace_link_modifiers` | 12 |
| Tag-Fluss | `tag_flow` | 11 |
| Variable Rez-Zusatzkosten/Stärke/Subroutinen | `variable_rez_cost_strength_subroutines` | 11 |
| Corp-Node/Asset installieren/rezzen/accessen | `corp_node_asset_install_rez_access` | 11 |
| Agenda-Scoring-Grundmodell | `agenda_scoring_core` | 10 |
| Bad-Publicity-Loss-Gate | `bad_publicity_loss_gate` | 10 |
| Würfel-/Random-Resolver | `random_die_resolution` | 9 |
| Korp-Operation ausspielen | `corp_operation_play` | 8 |
| Zusätzliche Aktionsökonomie | `additional_action_economy` | 7 |
| Agenda-Punkte/Overadvance | `agenda_point_modification_overadvance` | 6 |
| Pass-Trigger mit ICE-Uninstall/HQ | `pass_trigger_uninstall_ice` | 6 |
| Runner-Hardware installieren | `runner_hardware_install` | 6 |
| Positions-/ICE-Zählung im Fort | `installed_ice_relative_counting` | 4 |
| Cybernetics/Deck-Hardware | `cybernetics_deck_hardware` | 4 |
| Hidden-Zone-Search/Install/Tutor | `hidden_zone_search_install_tutor` | 3 |
| ICE-Repositionierung | `ice_repositioning` | 2 |
| Data-Fort-Erstellungssperre | `data_fort_creation_lock` | 1 |

## Blockierende Reviewpunkte

- `Ice and Data Special Report`: Kostenangabe `3 (0)` braucht Quellen-/Regelklärung.
- Quellenkopf weicht bei Typzählungen ab: `26 Prep`/`7 Hardware` gegenüber geparsten `27 Prep/Event`/`6 Hardware`; Gesamtzählung und Seitenzählung bleiben korrekt.
- Variable Stärke/Rez-Werte: `Digiconda` und `Homing Missile` brauchen vor Runtime einen variablen Rez-/Stärkevertrag.

## Erste umsetzbare Slices

- Variable Proteus-ICE: variable Rez-Zusatzkosten, dynamische Stärke/Subroutinen und Pass-Trigger für ICE.
- Hidden Runner Resources: verdeckte Installation, Aktivierungsfenster, Trash-/Reveal-Vertrag und PublicEvents.
- Bad-Publicity-Loss-Gate: zentrale Loss-Condition aus Corp- und Runner-Effekten, einschließlich Gleichzeitigkeit mit Victory Conditions.
- Virus/Antibody-Counter: Proteus-spezifische Virus-/Antibody-Familie mit Counter- und Access-/Score-Fenstern.
- Cybernetics/Deck-Hardware: Ein-Deck-Regel, Handgrößen-/MU-/Recurring-Bits und ältere Decks trashen.

## Per-Card-Matrix

| Karte | Titel | Seite | Typ | Status | Cluster |
| --- | --- | --- | --- | --- | --- |
| onr_proteus_001_ai-board-member | AI Board Member | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `additional_action_economy`, `random_die_resolution`, `economy_draw_basics` |
| onr_proteus_002_charity-takeover | Charity Takeover | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `bad_publicity_loss_gate`, `economy_draw_basics` |
| onr_proteus_003_corporate-headhunters | Corporate Headhunters | corp | agenda | kleiner Resolver nötig | `agenda_scoring_core`, `damage_prevention_and_core_hand_size` |
| onr_proteus_004_fetal-ai | Fetal AI | corp | agenda | kleiner Resolver nötig | `agenda_scoring_core`, `damage_prevention_and_core_hand_size`, `access_breach_multiaccess_ambush` |
| onr_proteus_005_marked-accounts | Marked Accounts | corp | agenda | kleiner Resolver nötig | `agenda_scoring_core`, `tag_flow`, `access_breach_multiaccess_ambush` |
| onr_proteus_006_please-dont-choke-anyone | Please Don't Choke Anyone | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `additional_action_economy`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| onr_proteus_007_project-venice | Project Venice | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `additional_action_economy`, `agenda_point_modification_overadvance` |
| onr_proteus_008_project-zurich | Project Zurich | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `agenda_point_modification_overadvance`, `economy_draw_basics` |
| onr_proteus_009_viral-breeding-ground | Viral Breeding Ground | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `access_breach_multiaccess_ambush`, `virus_antibody_counter_family`, `trash_forfeit_sabotage` |
| onr_proteus_010_world-domination | World Domination | corp | agenda | Mechanikvertiefung nötig | `agenda_scoring_core`, `agenda_point_modification_overadvance` |
| onr_proteus_011_brain-wash | Brain Wash | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `damage_prevention_and_core_hand_size` |
| onr_proteus_012_bug-zapper | Bug Zapper | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `damage_prevention_and_core_hand_size`, `installed_ice_relative_counting` |
| onr_proteus_013_caryatid | Caryatid | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_014_chihuahua | Chihuahua | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `trace_link_modifiers`, `damage_prevention_and_core_hand_size`, `economy_draw_basics` |
| onr_proteus_015_colonel-failure | Colonel Failure | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `trash_forfeit_sabotage` |
| onr_proteus_016_coyote | Coyote | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `icebreaker_breaker_pump`, `economy_draw_basics` |
| onr_proteus_017_credit-blocks | Credit Blocks | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_018_datacomb | Datacomb | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `pass_trigger_uninstall_ice` |
| onr_proteus_019_death-yo-yo | Death Yo-Yo | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `pass_trigger_uninstall_ice`, `damage_prevention_and_core_hand_size`, `economy_draw_basics` |
| onr_proteus_020_digiconda | Digiconda | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines`, `damage_prevention_and_core_hand_size` |
| onr_proteus_021_dog-pile | Dog Pile | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `damage_prevention_and_core_hand_size`, `icebreaker_breaker_pump`, `installed_ice_relative_counting` |
| onr_proteus_022_food-fight | Food Fight | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_023_galatea | Galatea | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_024_gatekeeper | Gatekeeper | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_025_homing-missile | Homing Missile | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines`, `trace_link_modifiers` |
| onr_proteus_026_hunting-pack | Hunting Pack | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `trace_link_modifiers`, `tag_flow`, `installed_ice_relative_counting` |
| onr_proteus_027_iceberg | Iceberg | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `damage_prevention_and_core_hand_size` |
| onr_proteus_028_lesser-arcana | Lesser Arcana | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_029_marionette | Marionette | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `pass_trigger_uninstall_ice`, `trash_forfeit_sabotage` |
| onr_proteus_030_mastermind | Mastermind | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `damage_prevention_and_core_hand_size`, `icebreaker_breaker_pump`, `installed_ice_relative_counting` |
| onr_proteus_031_minotaur | Minotaur | corp | ice | wahrscheinlich abgedeckt | `ice_encounter_subroutines` |
| onr_proteus_032_misleading-access-menus | Misleading Access Menus | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `economy_draw_basics` |
| onr_proteus_033_mobile-barricade | Mobile Barricade | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `ice_repositioning`, `damage_prevention_and_core_hand_size` |
| onr_proteus_034_riddler | Riddler | corp | ice | wahrscheinlich abgedeckt | `ice_encounter_subroutines` |
| onr_proteus_035_roadblock | Roadblock | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `random_die_resolution` |
| onr_proteus_036_sandstorm | Sandstorm | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_037_scaffolding | Scaffolding | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `pass_trigger_uninstall_ice`, `economy_draw_basics` |
| onr_proteus_038_snowbank | Snowbank | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `economy_draw_basics` |
| onr_proteus_039_sphinx-2006 | Sphinx 2006 | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_040_sumo-2008 | Sumo 2008 | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `variable_rez_cost_strength_subroutines` |
| onr_proteus_041_toughoniumtm-wall | Toughonium™ Wall | corp | ice | wahrscheinlich abgedeckt | `ice_encounter_subroutines` |
| onr_proteus_042_tumblers | Tumblers | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `pass_trigger_uninstall_ice`, `economy_draw_basics` |
| onr_proteus_043_twisty-passages | Twisty Passages | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `pass_trigger_uninstall_ice` |
| onr_proteus_044_walking-wall | Walking Wall | corp | ice | Mechanikvertiefung nötig | `ice_encounter_subroutines`, `ice_repositioning` |
| onr_proteus_045_washed-up-solo-construct | Washed-Up Solo Construct | corp | ice | kleiner Resolver nötig | `ice_encounter_subroutines`, `trash_forfeit_sabotage`, `economy_draw_basics` |
| onr_proteus_046_corporate-guard-r-temps | Corporate Guard(R) Temps | corp | operation | Mechanikvertiefung nötig | `corp_operation_play`, `additional_action_economy`, `trash_forfeit_sabotage` |
| onr_proteus_047_credit-consolidation | Credit Consolidation | corp | operation | kleiner Resolver nötig | `corp_operation_play`, `economy_draw_basics` |
| onr_proteus_048_data-sifters | Data Sifters | corp | operation | kleiner Resolver nötig | `corp_operation_play`, `tag_flow` |
| onr_proteus_049_emergency-rig | Emergency Rig | corp | operation | wahrscheinlich abgedeckt | `corp_operation_play` |
| onr_proteus_050_manhunt | Manhunt | corp | operation | kleiner Resolver nötig | `corp_operation_play`, `trace_link_modifiers` |
| onr_proteus_051_rent-to-own-contract | Rent-to-Own Contract | corp | operation | wahrscheinlich abgedeckt | `corp_operation_play` |
| onr_proteus_052_schlaghund-pointers | Schlaghund Pointers | corp | operation | kleiner Resolver nötig | `corp_operation_play`, `trace_link_modifiers`, `tag_flow` |
| onr_proteus_053_underworld-mole | Underworld Mole | corp | operation | kleiner Resolver nötig | `corp_operation_play`, `trace_link_modifiers`, `tag_flow` |
| onr_proteus_054_bel-digmo-antibody | Bel-Digmo Antibody | corp | asset | Mechanikvertiefung nötig | `corp_node_asset_install_rez_access`, `damage_prevention_and_core_hand_size`, `access_breach_multiaccess_ambush`, `virus_antibody_counter_family` |
| onr_proteus_055_cybertech-think-tank | Cybertech Think Tank | corp | asset | kleiner Resolver nötig | `corp_node_asset_install_rez_access`, `damage_prevention_and_core_hand_size` |
| onr_proteus_056_department-of-misinformation | Department of Misinformation | corp | asset | kleiner Resolver nötig | `corp_node_asset_install_rez_access`, `prevention_avoid_replacement` |
| onr_proteus_057_doppelganger-antibody | Doppelganger Antibody | corp | asset | Mechanikvertiefung nötig | `corp_node_asset_install_rez_access`, `additional_action_economy`, `access_breach_multiaccess_ambush`, `virus_antibody_counter_family` |
| onr_proteus_058_executive-boot-camp | Executive Boot Camp | corp | asset | Mechanikvertiefung nötig | `corp_node_asset_install_rez_access`, `random_die_resolution`, `economy_draw_basics` |
| onr_proteus_059_government-contract | Government Contract | corp | asset | kleiner Resolver nötig | `corp_node_asset_install_rez_access`, `economy_draw_basics` |
| onr_proteus_060_herman-revista | Herman Revista | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_061_ldl-traffic-analyzers | LDL Traffic Analyzers | corp | asset | kleiner Resolver nötig | `corp_node_asset_install_rez_access`, `trace_link_modifiers`, `economy_draw_basics` |
| onr_proteus_062_lesley-major | Lesley Major | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_063_lisa-blight | Lisa Blight | corp | upgrade | Mechanikvertiefung nötig | `corp_upgrade_root_install_rez_access`, `random_die_resolution` |
| onr_proteus_064_marcel-desoleil | Marcel DeSoleil | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_065_networked-center | Networked Center | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_066_obfuscated-fortress | Obfuscated Fortress | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_067_panic-button | Panic Button | corp | upgrade | kleiner Resolver nötig | `corp_upgrade_root_install_rez_access`, `economy_draw_basics`, `run_event_basics` |
| onr_proteus_068_pattel-antibody | Pattel Antibody | corp | asset | Mechanikvertiefung nötig | `corp_node_asset_install_rez_access`, `access_breach_multiaccess_ambush`, `virus_antibody_counter_family`, `icebreaker_breaker_pump` |
| onr_proteus_069_pavit-bharat | Pavit Bharat | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_070_rasmin-bridger | Rasmin Bridger | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_071_raymond-ellison | Raymond Ellison | corp | upgrade | kleiner Resolver nötig | `corp_upgrade_root_install_rez_access`, `economy_draw_basics` |
| onr_proteus_072_research-bunker | Research Bunker | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_073_simon-francisco | Simon Francisco | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_074_siren | Siren | corp | asset | kleiner Resolver nötig | `corp_node_asset_install_rez_access`, `run_event_basics` |
| onr_proteus_075_stereogram-antibody | Stereogram Antibody | corp | asset | Mechanikvertiefung nötig | `corp_node_asset_install_rez_access`, `damage_prevention_and_core_hand_size`, `access_breach_multiaccess_ambush`, `virus_antibody_counter_family` |
| onr_proteus_076_syd-meyer-superstores | Syd Meyer Superstores | corp | asset | kleiner Resolver nötig | `corp_node_asset_install_rez_access`, `economy_draw_basics` |
| onr_proteus_077_weapons-depot | Weapons Depot | corp | upgrade | wahrscheinlich abgedeckt | `corp_upgrade_root_install_rez_access` |
| onr_proteus_078_armageddon | Armageddon | runner | program | Mechanikvertiefung nötig | `runner_program_install`, `random_die_resolution`, `virus_antibody_counter_family`, `run_event_basics` |
| onr_proteus_079_big-frackin-gun | Big Frackin' Gun | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_080_black-widow | Black Widow | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_081_boring-bit | Boring Bit | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_082_bulldozer | Bulldozer | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_083_corrosion | Corrosion | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_084_crumble | Crumble | runner | program | Mechanikvertiefung nötig | `runner_program_install`, `virus_antibody_counter_family`, `trash_forfeit_sabotage`, `run_event_basics` |
| onr_proteus_085_disintegrator | Disintegrator | runner | program | wahrscheinlich abgedeckt | `runner_program_install` |
| onr_proteus_086_enterprise-inc-shields | Enterprise, Inc., Shields | runner | program | kleiner Resolver nötig | `runner_program_install`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| onr_proteus_087_forwards-legacy | Forward's Legacy | runner | program | Mechanikvertiefung nötig | `runner_program_install`, `random_die_resolution`, `icebreaker_breaker_pump` |
| onr_proteus_088_fubar | Fubar | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_089_garbage-in | Garbage In | runner | program | Mechanikvertiefung nötig | `runner_program_install`, `access_breach_multiaccess_ambush`, `virus_antibody_counter_family`, `trash_forfeit_sabotage`, `run_event_basics` |
| onr_proteus_090_highlighter | Highlighter | runner | program | umgesetzt in Phase 8d | `runner_program_install`, `virus_antibody_counter_family`, `run_event_basics` |
| onr_proteus_091_lockjaw | Lockjaw | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_092_morphing-tool | Morphing Tool | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_093_redecorator | Redecorator | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_094_scaldan | Scaldan | runner | program | Mechanikvertiefung nötig | `runner_program_install`, `bad_publicity_loss_gate`, `random_die_resolution`, `virus_antibody_counter_family`, `run_event_basics` |
| onr_proteus_095_skeleton-passkeys | Skeleton Passkeys | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_096_skullcap | Skullcap | runner | program | kleiner Resolver nötig | `runner_program_install`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| onr_proteus_097_taxman | Taxman | runner | program | umgesetzt in Phase 8d | `runner_program_install`, `virus_antibody_counter_family`, `run_event_basics` |
| onr_proteus_098_vienna-22 | Vienna 22 | runner | program | umgesetzt in Phase 8d | `runner_program_install`, `virus_antibody_counter_family`, `run_event_basics` |
| onr_proteus_099_viral-pipeline | Viral Pipeline | runner | program | umgesetzt in Phase 8d | `runner_program_install`, `virus_antibody_counter_family` |
| onr_proteus_100_wrecking-ball | Wrecking Ball | runner | program | kleiner Resolver nötig | `runner_program_install`, `icebreaker_breaker_pump` |
| onr_proteus_101_all-hands | All-Hands | runner | event | kleiner Resolver nötig | `runner_prep_play`, `access_breach_multiaccess_ambush`, `icebreaker_breaker_pump`, `run_event_basics` |
| onr_proteus_102_blackmail | Blackmail | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `agenda_point_modification_overadvance`, `run_event_basics` |
| onr_proteus_103_cruising-for-netwatch | Cruising for Netwatch | runner | event | kleiner Resolver nötig | `runner_prep_play`, `economy_draw_basics` |
| onr_proteus_104_decoy-signal | Decoy Signal | runner | event | kleiner Resolver nötig | `runner_prep_play`, `run_event_basics` |
| onr_proteus_105_demolition-run | Demolition Run | runner | event | kleiner Resolver nötig | `runner_prep_play`, `tag_flow`, `trash_forfeit_sabotage`, `run_event_basics` |
| onr_proteus_106_disgruntled-ice-technician | Disgruntled Ice Technician | runner | event | kleiner Resolver nötig | `runner_prep_play`, `run_event_basics` |
| onr_proteus_107_drone-for-a-day | Drone for a Day | runner | event | kleiner Resolver nötig | `runner_prep_play`, `tag_flow`, `economy_draw_basics` |
| onr_proteus_108_faked-hit | Faked Hit | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| onr_proteus_109_frame-up | Frame-Up | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate`, `access_breach_multiaccess_ambush` |
| onr_proteus_110_hijack | Hijack | runner | event | kleiner Resolver nötig | `runner_prep_play`, `hidden_zone_search_install_tutor`, `economy_draw_basics` |
| onr_proteus_111_ice-and-data-special-report | Ice and Data Special Report | runner | event | blockiert/Regelklärung nötig | `runner_prep_play` |
| onr_proteus_112_identity-donor | Identity Donor | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| onr_proteus_113_live-news-feed | Live News Feed | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate`, `tag_flow`, `access_breach_multiaccess_ambush`, `run_event_basics` |
| onr_proteus_114_on-the-fast-track | On the Fast Track | runner | event | kleiner Resolver nötig | `runner_prep_play`, `economy_draw_basics` |
| onr_proteus_115_personal-touch-the | Personal Touch, The | runner | event | kleiner Resolver nötig | `runner_prep_play`, `icebreaker_breaker_pump` |
| onr_proteus_116_pirate-broadcast | Pirate Broadcast | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `agenda_point_modification_overadvance`, `run_event_basics` |
| onr_proteus_117_poisoned-water-supply | Poisoned Water Supply | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate`, `trash_forfeit_sabotage` |
| onr_proteus_118_prearranged-drop | Prearranged Drop | runner | event | kleiner Resolver nötig | `runner_prep_play`, `economy_draw_basics` |
| onr_proteus_119_promises-promises | Promises, Promises | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `agenda_point_modification_overadvance` |
| onr_proteus_120_reconnaissance | Reconnaissance | runner | event | kleiner Resolver nötig | `runner_prep_play`, `economy_draw_basics`, `run_event_basics` |
| onr_proteus_121_remote-detonator | Remote Detonator | runner | event | kleiner Resolver nötig | `runner_prep_play`, `tag_flow`, `trash_forfeit_sabotage` |
| onr_proteus_122_rush-hour | Rush Hour | runner | event | kleiner Resolver nötig | `runner_prep_play`, `access_breach_multiaccess_ambush`, `icebreaker_breaker_pump`, `run_event_basics` |
| onr_proteus_123_senatorial-field-trip | Senatorial Field Trip | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate` |
| onr_proteus_124_stakeout | Stakeout | runner | event | kleiner Resolver nötig | `runner_prep_play`, `economy_draw_basics` |
| onr_proteus_125_subliminal-corruption | Subliminal Corruption | runner | event | Mechanikvertiefung nötig | `runner_prep_play`, `bad_publicity_loss_gate`, `run_event_basics` |
| onr_proteus_126_test-spin | Test Spin | runner | event | kleiner Resolver nötig | `runner_prep_play`, `damage_prevention_and_core_hand_size`, `hidden_zone_search_install_tutor`, `run_event_basics` |
| onr_proteus_127_weefle-initiation | Weefle Initiation | runner | event | kleiner Resolver nötig | `runner_prep_play`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement`, `run_event_basics` |
| onr_proteus_128_airport-locker | Airport Locker | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources`, `hidden_zone_search_install_tutor` |
| onr_proteus_129_back-door-to-netwatch | Back Door to Netwatch | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `bad_publicity_loss_gate`, `trace_link_modifiers`, `tag_flow`, `prevention_avoid_replacement`, `hidden_runner_resources` |
| onr_proteus_130_back-door-to-rivals | Back Door to Rivals | runner | resource | kleiner Resolver nötig | `runner_resource_install`, `trace_link_modifiers`, `prevention_avoid_replacement`, `economy_draw_basics` |
| onr_proteus_131_bargain-with-viacox | Bargain with Viacox | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `additional_action_economy`, `random_die_resolution`, `economy_draw_basics`, `run_event_basics` |
| onr_proteus_132_bolt-hole | Bolt-Hole | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement`, `hidden_runner_resources` |
| onr_proteus_133_chiba-bank-account | Chiba Bank Account | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources`, `economy_draw_basics` |
| onr_proteus_134_cortical-cybermodem | Cortical Cybermodem | runner | hardware | Mechanikvertiefung nötig | `runner_hardware_install`, `cybernetics_deck_hardware`, `icebreaker_breaker_pump` |
| onr_proteus_135_cortical-stimulators | Cortical Stimulators | runner | hardware | Mechanikvertiefung nötig | `runner_hardware_install`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement`, `cybernetics_deck_hardware` |
| onr_proteus_136_credit-subversion | Credit Subversion | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources`, `trash_forfeit_sabotage`, `run_event_basics` |
| onr_proteus_137_death-from-above | Death from Above | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources`, `trash_forfeit_sabotage` |
| onr_proteus_138_deck-the | Deck, The | runner | hardware | Mechanikvertiefung nötig | `runner_hardware_install`, `trace_link_modifiers`, `cybernetics_deck_hardware` |
| onr_proteus_139_eurocorpse-tm-spin-chip | Eurocorpse (TM) Spin Chip | runner | hardware | kleiner Resolver nötig | `runner_hardware_install`, `icebreaker_breaker_pump` |
| onr_proteus_140_expendable-family-member | Expendable Family Member | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `tag_flow`, `prevention_avoid_replacement`, `hidden_runner_resources` |
| onr_proteus_141_get-ready-to-rumble | Get Ready to Rumble | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `random_die_resolution`, `damage_prevention_and_core_hand_size`, `hidden_runner_resources` |
| onr_proteus_142_hq-mole | HQ Mole | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `access_breach_multiaccess_ambush`, `hidden_runner_resources` |
| onr_proteus_143_liberated-savings-account | Liberated Savings Account | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `access_breach_multiaccess_ambush`, `hidden_runner_resources`, `economy_draw_basics` |
| onr_proteus_144_lucidrinetm-drip-feed | Lucidrine™ Drip Feed | runner | hardware | Mechanikvertiefung nötig | `runner_hardware_install`, `additional_action_economy`, `damage_prevention_and_core_hand_size`, `prevention_avoid_replacement` |
| onr_proteus_145_mercenary-subcontract | Mercenary Subcontract | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources`, `trash_forfeit_sabotage` |
| onr_proteus_146_precision-bribery | Precision Bribery | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `trash_forfeit_sabotage`, `data_fort_creation_lock` |
| onr_proteus_147_r-and-d-mole | R&D Mole | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `access_breach_multiaccess_ambush`, `hidden_runner_resources` |
| onr_proteus_148_runner-sensei | Runner Sensei | runner | resource | kleiner Resolver nötig | `runner_resource_install`, `trace_link_modifiers`, `prevention_avoid_replacement`, `economy_draw_basics` |
| onr_proteus_149_simulacrum | Simulacrum | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources` |
| onr_proteus_150_streetware-distributor | Streetware Distributor | runner | resource | wahrscheinlich abgedeckt | `runner_resource_install` |
| onr_proteus_151_sunburst-cranial-interface | Sunburst Cranial Interface | runner | hardware | Mechanikvertiefung nötig | `runner_hardware_install`, `cybernetics_deck_hardware`, `icebreaker_breaker_pump` |
| onr_proteus_152_swiss-bank-account | Swiss Bank Account | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `hidden_runner_resources`, `economy_draw_basics` |
| onr_proteus_153_time-to-collect | Time to Collect | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `prevention_avoid_replacement`, `hidden_runner_resources` |
| onr_proteus_154_wired-switchboard | Wired Switchboard | runner | resource | Mechanikvertiefung nötig | `runner_resource_install`, `trace_link_modifiers`, `hidden_runner_resources` |
