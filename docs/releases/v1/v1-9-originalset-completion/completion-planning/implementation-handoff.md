# V1.9.10 bis V1.9.xx Implementation Handoff

Status: Übergabe an release-implementation-agent, keine Codeimplementierung in diesem Artefakt
Stand: 2026-05-12

## Auftrag

Setze die Originalset-Completion sequenziell um. Beginne mit V1.9.10 Status-/Artefaktparität, danach V1.9.11 bis V1.9.22. Jeder Slice wird erst nach grünem Gate abgeschlossen und darf keine spätere Karte implizit freigeben.

## Nicht verhandelbare Verträge

- Rules Engine bleibt einzige Regelautorität.
- UI, Server, Mensch und KI reichen nur PlayerActions ein, die aus LegalActions abgeleitet wurden.
- applyAction revalidiert Side, actionId, stateVersion, Timingpunkt, Kosten, Ziele und Choices.
- Keine Hidden-Info in PlayerViews, PublicEvents, KI-Inputs, WebSocket, Reconnect, Undo, öffentlichen Replays, Logs oder Fehlern.
- Replay und StateHash sind Gate-Pflicht.
- Zufall nutzt Seed, RandomCounter und RandomDrawRecords.
- Keine offiziellen Assets, keine externen Kartendatenbanken, kein Kartentextparser als Autorität.
- AI-supported setzt human_playable, AI-Hints, SzenarioRefs und KI-Smoke voraus.

## Arbeitsreihenfolge

| Reihenfolge | Release | Primärer Arbeitsgegenstand | Karten/Driftpunkte |
| ---: | --- | --- | ---: |
| 1 | V1.9.10 | Status-, Manifest- und Katalog-Konsolidierung | 3 |
| 2 | V1.9.11 | Hidden-Zone Search, Reveal, Reorder und Shuffle | 16 |
| 3 | V1.9.12 | Counter, Virus, Purge und Recurring Pools | 11 |
| 4 | V1.9.13 | Damage, Prevention, Avoid und Replacement Longtail | 17 |
| 5 | V1.9.14 | Trace, Link, Tags und Resource-Tag-Interaktionen | 25 |
| 6 | V1.9.15 | Run Flow, Access, Multiaccess und Ambush on Access | 14 |
| 7 | V1.9.16 | Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy | 16 |
| 8 | V1.9.17 | Generische Asset/Node-Fähigkeiten | 18 |
| 9 | V1.9.18 | Generische Upgrade-, Root-, Grid- und Server-Fähigkeiten | 15 |
| 10 | V1.9.19 | Agenda Difficulty, Scored Agenda Abilities und Overadvance | 20 |
| 11 | V1.9.20 | Globale Modifier, Handgröße, Action Economy und persistente Sonderzustände | 26 |
| 12 | V1.9.21 | Deterministischer Zufall und Würfelkarten | 6 |
| 13 | V1.9.22 | Per-card Resolver Longtail und Originalset Completion Gate | 47 |

## V1.9.10 Preflight

- Repariere oder regeneriere den lokalen Katalogindex und ergänze JSON-Validation.
- Ergänze die fehlende Implementation-Parität für Fetch 4.0.1, Hunter und Trojan Horse.
- Prüfe no-promotion für alle 231 offenen Karten.
- Harmonisiere die Zählung 143 Runtime-Karten, 143 AI-supported Karten und 231 offene Karten.
- Erstelle danach einen V1.9.10 Final Review als Gate für V1.9.11.

## Per-release Umsetzungsmuster

- Requirements, Spec, Testmatrix und Requirements Review vor Code einfrieren.
- Resolverfamilie zuerst generisch entwickeln, dann Kartenadapter anschließen.
- LegalActions und applyAction-Revalidierungen für jede neue Choice, jedes Target und jede Kostenart ergänzen.
- PlayerView/PublicEvent/Reconnect/Undo/Replay-Projektionen parallel absichern.
- AI-Hints, Decision Nodes, FallbackPolicy und DecisionDebug erst nach Engine-Vertrag ergänzen.
- Manifest, Mechanics-Coverage, Szenarien und AI-Smokes im selben Release aktualisieren.
- Final Review mit vollständiger Kartenliste, Deferred-Liste, Testbefehlen und Webclient-Version erstellen.

## Release-Slices

### V1.9.11 - Hidden-Zone Search, Reveal, Reorder und Shuffle

- Karten: 042 Mouse (`onr_v1_042_mouse`), 058 SeeYa (`onr_v1_058_seeya`), 059 Self-Modifying Code (`onr_v1_059_self-modifying-code`), 087 Forgotten Backup Chip (`onr_v1_087_forgotten-backup-chip`), 088 Fortress Respecification (`onr_v1_088_fortress-respecification`), 089 Gideon’s Pawnshop (`onr_v1_089_gideons-pawnshop`), 092 Ice and Data’s Guide to the Net (`onr_v1_092_ice-and-datas-guide-to-the-net`), 099 Mantis, Fixer-at-Large (`onr_v1_099_mantis-fixer-at-large`), 110 Sneak Preview (`onr_v1_110_sneak-preview`), 151 Aujourd’Oui (`onr_v1_151_aujourdoui`), 169 N.E.T.O. (`onr_v1_169_n-e-t-o`), 175 Ronin Around (`onr_v1_175_ronin-around`), 177 The Short Circuit (`onr_v1_177_the-short-circuit`), 194 Corporate Downsizing (`onr_v1_194_corporate-downsizing`), 250 Ice Pick Willie (`onr_v1_250_ice-pick-willie`), 272 Too Many Doors (`onr_v1_272_too-many-doors`).
- Resolverfamilien: `hidden_zone_search_reveal_reorder_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.12 - Counter, Virus, Purge und Recurring Pools

- Karten: 009 Butcher Boy (`onr_v1_009_butcher-boy`), 010 Cascade (`onr_v1_010_cascade`), 017 Deep Thought (`onr_v1_017_deep-thought`), 032 I Spy (`onr_v1_032_i-spy`), 064 Skivviss (`onr_v1_064_skivviss`), 082 Deal with Militech (`onr_v1_082_deal-with-militech`), 091 Hunt Club BBS (`onr_v1_091_hunt-club-bbs`), 174 Rigged Investments (`onr_v1_174_rigged-investments`), 176 The Shell Traders (`onr_v1_176_the-shell-traders`), 198 Detroit Police Contract (`onr_v1_198_detroit-police-contract`), 199 Employee Empowerment (`onr_v1_199_employee-empowerment`).
- Resolverfamilien: `typed_counter_virus_purge_resolver`, `recurring_pool_start_turn_resolver`, `hidden_zone_search_reveal_reorder_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.13 - Damage, Prevention, Avoid und Replacement Longtail

- Karten: 038 Joan of Arc (`onr_v1_038_joan-of-arc`), 121 Armored Fridge (`onr_v1_121_armored-fridge`), 127 Full Body Conversion (`onr_v1_127_full-body-conversion`), 128 “Green Knight” Surge Buffers (`onr_v1_128_green-knight-surge-buffers`), 130 Lifesaver™ Nanosurgeons (`onr_v1_130_lifesaver-nanosurgeons`), 135 Nasuko Cycle (`onr_v1_135_nasuko-cycle`), 139 R&D Interface (`onr_v1_139_r-and-d-interface`), 143 Techtronica™ Utility Suit (`onr_v1_143_techtronica-utility-suit`), 155 Code Viral Cache (`onr_v1_155_code-viral-cache`), 161 Fall Guy (`onr_v1_161_fall-guy`), 170 Nomad Allies (`onr_v1_170_nomad-allies`), 185 Trauma Team™ (`onr_v1_185_trauma-team`), 186 Umbrella Policy (`onr_v1_186_umbrella-policy`), 187 Wilson, Weeflerunner Apprentice (`onr_v1_187_wilson-weeflerunner-apprentice`), 224 Bolter Cluster (`onr_v1_224_bolter-cluster`), 234 Data Darts (`onr_v1_234_data-darts`), 258 Neural Blade (`onr_v1_258_neural-blade`).
- Resolverfamilien: `event_modification_prevention_avoid_resolver`, `typed_counter_virus_purge_resolver`, `damage_event_prevention_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `core_brain_damage_modifier_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.14 - Trace, Link, Tags und Resource-Tag-Interaktionen

- Karten: 053 Ramming Piston (`onr_v1_053_ramming-piston`), 056 Replicator (`onr_v1_056_replicator`), 063 Signpost (`onr_v1_063_signpost`), 116 Total Genetic Retrofit (`onr_v1_116_total-genetic-retrofit`), 120 “Armadillo” Armored Road Home (`onr_v1_120_armadillo-armored-road-home`), 126 “Drifter” Mobile Environment (`onr_v1_126_drifter-mobile-environment`), 132 Microtech ’Trode Set (`onr_v1_132_microtech-trode-set`), 154 Broker (`onr_v1_154_broker`), 157 Crash Everett, Inventive Fixer (`onr_v1_157_crash-everett-inventive-fixer`), 162 Field Reporter for Ice and Data (`onr_v1_162_field-reporter-for-ice-and-data`), 164 Hell's Run (`onr_v1_164_hells-run`), 165 Junkyard BBS (`onr_v1_165_junkyard-bbs`), 166 Karl de Veres, Corporate Stooge (`onr_v1_166_karl-de-veres-corporate-stooge`), 167 Leland, Corporate Bodyguard (`onr_v1_167_leland-corporate-bodyguard`), 178 Short-Term Contract (`onr_v1_178_short-term-contract`), 181 The Springboard (`onr_v1_181_the-springboard`), 183 Technician Lover (`onr_v1_183_technician-lover`), 221 Asp (`onr_v1_221_asp`), 228 Cinderella (`onr_v1_228_cinderella`), 240 Fang (`onr_v1_240_fang`), 241 Fang 2.0 (`onr_v1_241_fang-2-0`), 248 Homewrecker™ (`onr_v1_248_homewrecker`), 260 Pocket Virtual Reality (`onr_v1_260_pocket-virtual-reality`), 264 Rex (`onr_v1_264_rex`), 299 Power Grid Overload (`onr_v1_299_power-grid-overload`).
- Resolverfamilien: `trace_link_bid_window_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `event_modification_prevention_avoid_resolver`, `tag_condition_avoid_remove_resolver`, `damage_event_prevention_resolver`, `resource_tag_interaction_resolver`, `typed_counter_virus_purge_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.15 - Run Flow, Access, Multiaccess und Ambush on Access

- Karten: 020 Dupré (`onr_v1_020_dupre`), 024 Expert Schedule Analyzer (`onr_v1_024_expert-schedule-analyzer`), 041 Microtech AI Interface (`onr_v1_041_microtech-ai-interface`), 043 Mystery Box (`onr_v1_043_mystery-box`), 062 Shredder Uplink Protocol (`onr_v1_062_shredder-uplink-protocol`), 065 Smarteye (`onr_v1_065_smarteye`), 098 Lucidrine™ Booster Drug (`onr_v1_098_lucidrine-booster-drug`), 105 Priority Wreck (`onr_v1_105_priority-wreck`), 111 Social Engineering (`onr_v1_111_social-engineering`), 112 Stumble through Wilderspace (`onr_v1_112_stumble-through-wilderspace`), 142 Record Reconstructor (`onr_v1_142_record-reconstructor`), 227 Cerberus (`onr_v1_227_cerberus`), 255 Mastiff (`onr_v1_255_mastiff`), 294 New Blood (`onr_v1_294_new-blood`).
- Resolverfamilien: `run_flow_lock_resolver`, `typed_counter_virus_purge_resolver`, `access_breach_multiaccess_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `event_modification_prevention_avoid_resolver`, `trace_link_bid_window_resolver`, `recurring_pool_start_turn_resolver`, `damage_event_prevention_resolver`, `core_brain_damage_modifier_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.16 - Program Subtypes, Hosting, Stealth, Worm und Installed-card Destroy

- Karten: 003 Baedeker’s Net Map (`onr_v1_003_baedekers-net-map`), 004 Bakdoor™ (`onr_v1_004_bakdoor`), 033 Imp (`onr_v1_033_imp`), 035 Invisibility (`onr_v1_035_invisibility`), 047 Pile Driver (`onr_v1_047_pile-driver`), 050 R&D-Protocol Files (`onr_v1_050_r-and-d-protocol-files`), 071 Vewy Vewy Quiet (`onr_v1_071_vewy-vewy-quiet`), 140 Raven Microcyb Eagle (`onr_v1_140_raven-microcyb-eagle`), 141 Raven Microcyb Owl (`onr_v1_141_raven-microcyb-owl`), 148 Access through Alpha (`onr_v1_148_access-through-alpha`), 149 Access to Arasaka (`onr_v1_149_access-to-arasaka`), 150 Access to Kiribati (`onr_v1_150_access-to-kiribati`), 152 Back Door to Hilliard (`onr_v1_152_back-door-to-hilliard`), 153 Back Door to Orbital Air (`onr_v1_153_back-door-to-orbital-air`), 182 Submarine Uplink (`onr_v1_182_submarine-uplink`), 246 Fragmentation Storm (`onr_v1_246_fragmentation-storm`).
- Resolverfamilien: `program_subtype_daemon_stealth_worm_resolver`, `trace_link_bid_window_resolver`, `hosting_hosted_lifecycle_resolver`, `typed_counter_virus_purge_resolver`, `installed_card_destroy_uninstall_resolver`, `damage_event_prevention_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.17 - Generische Asset/Node-Fähigkeiten

- Karten: 309 BBS Whispering Campaign (`onr_v1_309_bbs-whispering-campaign`), 310 Blood Cat (`onr_v1_310_blood-cat`), 311 Braindance Campaign (`onr_v1_311_braindance-campaign`), 314 Corporate Negotiating Center (`onr_v1_314_corporate-negotiating-center`), 316 Cowboy Sysop (`onr_v1_316_cowboy-sysop`), 318 Department of Truth Enhancement (`onr_v1_318_department-of-truth-enhancement`), 319 Disinfectant, Inc. (`onr_v1_319_disinfectant-inc`), 321 ESA Contract (`onr_v1_321_esa-contract`), 326 Holovid Campaign (`onr_v1_326_holovid-campaign`), 329 Investment Firm (`onr_v1_329_investment-firm`), 330 Krumz (`onr_v1_330_krumz`), 333 Omniscience Foundation (`onr_v1_333_omniscience-foundation`), 336 Rescheduler (`onr_v1_336_rescheduler`), 337 Rockerboy Promotion (`onr_v1_337_rockerboy-promotion`), 340 Setup! (`onr_v1_340_setup`), 342 Solo Squad (`onr_v1_342_solo-squad`), 344 Spinn® Public Relations (`onr_v1_344_spinn-public-relations`), 345 TRAP! (`onr_v1_345_trap`).
- Resolverfamilien: `generic_asset_node_ability_resolver`, `hosting_hosted_lifecycle_resolver`, `trace_link_bid_window_resolver`, `recurring_pool_start_turn_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `installed_card_destroy_uninstall_resolver`, `event_modification_prevention_avoid_resolver`, `typed_counter_virus_purge_resolver`, `access_breach_multiaccess_resolver`, `access_ambush_resolver`, `damage_event_prevention_resolver`, `tag_condition_avoid_remove_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.18 - Generische Upgrade-, Root-, Grid- und Server-Fähigkeiten

- Karten: 354 Crybaby (`onr_v1_354_crybaby`), 355 Crystal Palace Station Grid (`onr_v1_355_crystal-palace-station-grid`), 356 Dedicated Response Team (`onr_v1_356_dedicated-response-team`), 357 Dieter Esslin (`onr_v1_357_dieter-esslin`), 358 Dr. Dreff (`onr_v1_358_dr-dreff`), 359 Jenny Jett (`onr_v1_359_jenny-jett`), 361 Namatoki Plaza (`onr_v1_361_namatoki-plaza`), 362 New Galveston City Grid (`onr_v1_362_new-galveston-city-grid`), 364 Omni Kismet, Ph.D. (`onr_v1_364_omni-kismet-ph-d`), 365 Paris City Grid (`onr_v1_365_paris-city-grid`), 366 Red Herrings (`onr_v1_366_red-herrings`), 369 Singapore City Grid (`onr_v1_369_singapore-city-grid`), 370 Tesseract Fort Construction (`onr_v1_370_tesseract-fort-construction`), 372 Turbeau Delacroix (`onr_v1_372_turbeau-delacroix`), 373 Twenty-Four-Hour Surveillance (`onr_v1_373_twenty-four-hour-surveillance`).
- Resolverfamilien: `generic_asset_node_ability_resolver`, `generic_upgrade_root_server_resolver`, `trace_link_bid_window_resolver`, `access_breach_multiaccess_resolver`, `typed_counter_virus_purge_resolver`, `access_ambush_resolver`, `event_modification_prevention_avoid_resolver`, `tag_condition_avoid_remove_resolver`, `damage_event_prevention_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `run_flow_lock_resolver`, `program_subtype_daemon_stealth_worm_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.19 - Agenda Difficulty, Scored Agenda Abilities und Overadvance

- Karten: 025 Fait Accompli (`onr_v1_025_fait-accompli`), 078 Arasaka Owns You (`onr_v1_078_arasaka-owns-you`), 189 Artificial Security Directors (`onr_v1_189_artificial-security-directors`), 202 Genetics-Visionary Acquisition (`onr_v1_202_genetics-visionary-acquisition`), 291 Falsified-Transactions Expert (`onr_v1_291_falsified-transactions-expert`), 292 Management Shake-Up (`onr_v1_292_management-shake-up`), 300 Project Consultants (`onr_v1_300_project-consultants`), 303 Silver Lining Recovery Protocol (`onr_v1_303_silver-lining-recovery-protocol`), 304 Systematic Layoffs (`onr_v1_304_systematic-layoffs`), 305 Team Restructuring (`onr_v1_305_team-restructuring`), 312 Chicago Branch (`onr_v1_312_chicago-branch`), 315 Corprunner's Shattered Remains (`onr_v1_315_corprunners-shattered-remains`), 323 Experimental AI (`onr_v1_323_experimental-ai`), 328 Information Laundering (`onr_v1_328_information-laundering`), 346 Vacant Soulkiller (`onr_v1_346_vacant-soulkiller`), 347 Vapor Ops (`onr_v1_347_vapor-ops`), 348 Virus Test Site (`onr_v1_348_virus-test-site`), 363 Olivia Salazar (`onr_v1_363_olivia-salazar`), 368 Roving Submarine (`onr_v1_368_roving-submarine`), 374 Washington, D.C., City Grid (`onr_v1_374_washington-d-c-city-grid`).
- Resolverfamilien: `scored_agenda_static_active_resolver`, `typed_counter_virus_purge_resolver`, `agenda_difficulty_overadvance_resolver`, `event_modification_prevention_avoid_resolver`, `tag_condition_avoid_remove_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `generic_asset_node_ability_resolver`, `installed_card_destroy_uninstall_resolver`, `access_breach_multiaccess_resolver`, `access_ambush_resolver`, `core_brain_damage_modifier_resolver`, `damage_event_prevention_resolver`, `generic_upgrade_root_server_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.20 - Globale Modifier, Handgröße, Action Economy und persistente Sonderzustände

- Karten: 022 Emergency Self-Construct (`onr_v1_022_emergency-self-construct`), 029 Gremlins (`onr_v1_029_gremlins`), 133 Militech MRAM Chip (`onr_v1_133_militech-mram-chip`), 134 MRAM Chip (`onr_v1_134_mram-chip`), 160 Diplomatic Immunity (`onr_v1_160_diplomatic-immunity`), 168 Loan from Chiba (`onr_v1_168_loan-from-chiba`), 171 Preying Mantis (`onr_v1_171_preying-mantis`), 190 Bioweapons Engineering (`onr_v1_190_bioweapons-engineering`), 191 Black Ice Quality Assurance (`onr_v1_191_black-ice-quality-assurance`), 192 Corporate Boon (`onr_v1_192_corporate-boon`), 200 Encryption Breakthrough (`onr_v1_200_encryption-breakthrough`), 204 Ice Transmutation (`onr_v1_204_ice-transmutation`), 205 Main-Office Relocation (`onr_v1_205_main-office-relocation`), 218 Subsidiary Branch (`onr_v1_218_subsidiary-branch`), 313 City Surveillance (`onr_v1_313_city-surveillance`), 322 Euromarket Consortium (`onr_v1_322_euromarket-consortium`), 324 Fortress Architects (`onr_v1_324_fortress-architects`), 325 Hacker Tracker Central (`onr_v1_325_hacker-tracker-central`), 327 I Got a Rock (`onr_v1_327_i-got-a-rock`), 331 Nevinyrral (`onr_v1_331_nevinyrral`), 332 Newsgroup Taunting (`onr_v1_332_newsgroup-taunting`), 334 Pacifica Regional AI (`onr_v1_334_pacifica-regional-ai`), 335 Remote Facility (`onr_v1_335_remote-facility`), 338 Rustbelt HQ Branch (`onr_v1_338_rustbelt-hq-branch`), 343 South African Mining Corp (`onr_v1_343_south-african-mining-corp`), 360 Jerusalem City Grid (`onr_v1_360_jerusalem-city-grid`).
- Resolverfamilien: `event_modification_prevention_avoid_resolver`, `persistent_special_state_resolver`, `core_brain_damage_modifier_resolver`, `action_economy_handsize_modifier_resolver`, `damage_event_prevention_resolver`, `typed_counter_virus_purge_resolver`, `scored_agenda_static_active_resolver`, `agenda_difficulty_overadvance_resolver`, `global_static_modifier_layer_resolver`, `recurring_pool_start_turn_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `generic_asset_node_ability_resolver`, `trace_link_bid_window_resolver`, `run_flow_lock_resolver`, `generic_upgrade_root_server_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.21 - Deterministischer Zufall und Würfelkarten

- Karten: 002 AI Boon (`onr_v1_002_ai-boon`), 008 Boardwalk (`onr_v1_008_boardwalk`), 104 Playful AI (`onr_v1_104_playful-ai`), 172 Quest for Cattekin (`onr_v1_172_quest-for-cattekin`), 339 Schlaghund (`onr_v1_339_schlaghund`), 367 Rio de Janeiro City Grid (`onr_v1_367_rio-de-janeiro-city-grid`).
- Resolverfamilien: `deterministic_random_card_resolver`, `run_flow_lock_resolver`, `recurring_pool_start_turn_resolver`, `hidden_zone_search_reveal_reorder_resolver`, `typed_counter_virus_purge_resolver`, `generic_asset_node_ability_resolver`, `event_modification_prevention_avoid_resolver`, `persistent_special_state_resolver`, `core_brain_damage_modifier_resolver`, `action_economy_handsize_modifier_resolver`, `damage_event_prevention_resolver`, `generic_upgrade_root_server_resolver`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

### V1.9.22 - Per-card Resolver Longtail und Originalset Completion Gate

- Karten: 026 False Echo (`onr_v1_026_false-echo`), 027 Flak (`onr_v1_027_flak`), 031 Hammer (`onr_v1_031_hammer`), 037 Japanese Water Torture (`onr_v1_037_japanese-water-torture`), 044 Netspace Inverter (`onr_v1_044_netspace-inverter`), 045 Newsgroup Filter (`onr_v1_045_newsgroup-filter`), 048 Poltergeist (`onr_v1_048_poltergeist`), 051 Rabbit (`onr_v1_051_rabbit`), 055 Reflector (`onr_v1_055_reflector`), 057 Scatter Shot (`onr_v1_057_scatter-shot`), 061 Shield (`onr_v1_061_shield`), 067 Speed Trap (`onr_v1_067_speed-trap`), 068 Startup Immolator (`onr_v1_068_startup-immolator`), 075 Zetatech Software Installer (`onr_v1_075_zetatech-software-installer`), 077 Anonymous Tip (`onr_v1_077_anonymous-tip`), 080 Core Command: Jettison Ice (`onr_v1_080_core-command-jettison-ice`), 086 Forged Activation Orders (`onr_v1_086_forged-activation-orders`), 093 If You Want It Done Right... (`onr_v1_093_if-you-want-it-done-right`), 100 misc.for-sale (`onr_v1_100_misc-for-sale`), 102 Open-Ended® Mileage Program (`onr_v1_102_open-ended-mileage-program`), 103 Organ Donor (`onr_v1_103_organ-donor`), 109 Security Code WORM Chip (`onr_v1_109_security-code-worm-chip`), 113 Synchronized Attack on HQ (`onr_v1_113_synchronized-attack-on-hq`), 117 Valu-Pak Software Bundle (`onr_v1_117_valu-pak-software-bundle`), 119 Arasaka Portable Prototype (`onr_v1_119_arasaka-portable-prototype`), 122 Artemis 2020 (`onr_v1_122_artemis-2020`), 123 Bodyweight™ Data Crèche (`onr_v1_123_bodyweight-data-creche`), 124 Corolla Speed Chip (`onr_v1_124_corolla-speed-chip`), 131 Microtech Backup Drive (`onr_v1_131_microtech-backup-drive`), 136 Pandora’s Deck (`onr_v1_136_pandoras-deck`), 137 Parraline 5750 (`onr_v1_137_parraline-5750`), 138 PK-6089a (`onr_v1_138_pk-6089a`), 147 ZZ22 Speed Chip (`onr_v1_147_zz22-speed-chip`), 195 Corporate Retreat (`onr_v1_195_corporate-retreat`), 196 Corporate War (`onr_v1_196_corporate-war`), 197 Data Fort Reclamation (`onr_v1_197_data-fort-reclamation`), 206 Marine Arcology (`onr_v1_206_marine-arcology`), 210 Political Overthrow (`onr_v1_210_political-overthrow`), 216 Security Purge (`onr_v1_216_security-purge`), 247 Haunting Inquisition (`onr_v1_247_haunting-inquisition`), 274 Tutor (`onr_v1_274_tutor`), 276 Viral 15 (`onr_v1_276_viral-15`), 277 Virizz (`onr_v1_277_virizz`), 280 Zombie (`onr_v1_280_zombie`), 289 Edgerunner, Inc., Temps (`onr_v1_289_edgerunner-inc-temps`), 296 Off-Site Backups (`onr_v1_296_off-site-backups`), 298 Planning Consultants (`onr_v1_298_planning-consultants`).
- Resolverfamilien: `per_card_longtail_resolver_gate`.
- Gate: Jede Karte hat Resolver/Ability, LegalAction-Vertrag, Tests, Szenario, Visibility, Replay/StateHash und side-sichere KI.

## Testbefehle als Mindestlauf

- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`

## Übergabe an test-quality-agent

Nach jedem Release: gezielte Prüfung der neuen Resolverfamilie, Hidden-Info-Grenzen, StateHash-Reproduktion, stale/illegal-action-Abdeckung und AI-Smokes. Nach V1.9.22: vollständige Originalset-Gateprüfung vor V2.x.
