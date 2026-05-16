import { applyAction, createGameAfterSetup, getLegalActions } from "../index";
import {
  DEMO_CARDS_BY_ID,
  MVP_0_99_BASELINE,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";

export const ONR_V1_0_5K_FINAL_CARD_IDS = [
  "onr_v1_015_codeslinger",
  "onr_v1_052_raffles",
  "onr_v1_054_raptor",
  "onr_v1_070_tinweasel",
  "onr_v1_144_tycho-mem-chip",
  "onr_v1_146_zetatech-mem-chip",
  "onr_v1_203_hostile-takeover",
  "onr_v1_230_cortical-scanner",
  "onr_v1_232_crystal-wall",
  "onr_v1_237_data-wall",
  "onr_v1_238_data-wall-2-0",
  "onr_v1_239_endless-corridor",
] as const;

export const ONR_V1_0_6K_FINAL_CARD_IDS = [
  "onr_v1_079_bodyweight-synthetic-blood",
  "onr_v1_095_jack-n-joe",
  "onr_v1_097_livewires-contacts",
  "onr_v1_108_score",
  "onr_v1_072_wild-card",
  "onr_v1_145_wutech-mem-chip",
  "onr_v1_220_tycho-extension",
  "onr_v1_281_accounts-receivable",
  "onr_v1_282_annual-reviews",
  "onr_v1_285_closed-accounts",
  "onr_v1_287_datapool-by-zetatech",
  "onr_v1_288_day-shift",
  "onr_v1_290_efficiency-experts",
  "onr_v1_301_punitive-counterstrike",
  "onr_v1_302_scorched-earth",
  "onr_v1_307_urban-renewal",
  "onr_v1_244_filter",
  "onr_v1_245_fire-wall",
  "onr_v1_252_keeper",
  "onr_v1_256_mazer",
] as const;

export const ONR_V1_1_2K_FINAL_CARD_IDS = [
  "onr_v1_006_black-dahlia",
  "onr_v1_014_codecracker",
  "onr_v1_016_cyfermaster",
  "onr_v1_040_loony-goon",
  "onr_v1_060_shaka",
  "onr_v1_073_wizards-book",
  "onr_v1_253_laser-wire",
  "onr_v1_257_nerve-labyrinth",
  "onr_v1_259_in-the-face",
  "onr_v1_261_quandary",
  "onr_v1_262_razor-wire",
  "onr_v1_263_reinforced-wall",
  "onr_v1_265_rock-is-strong",
  "onr_v1_266_scramble",
  "onr_v1_269_shotgun-wire",
  "onr_v1_270_sleeper",
  "onr_v1_278_wall-of-ice",
  "onr_v1_279_wall-of-static",
  "onr_v1_293_netwatch-credit-voucher",
  "onr_v1_295_night-shift",
] as const;

export const ONR_V1_2_3_FINAL_CARD_IDS = [
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_081_custodial-position",
  "onr_v1_085_executive-wiretaps",
  "onr_v1_101_mit-west-tier",
  "onr_v1_243_fetch-4-0-1",
  "onr_v1_249_hunter",
  "onr_v1_297_overtime-incentives",
  "onr_v1_306_trojan-horse",
] as const;

export const ONR_V1_6_1_FINAL_CARD_IDS = [
  "onr_v1_023_evil-twin",
  "onr_v1_028_force-shield",
  "onr_v1_125_dermatech-bodyplating",
  "onr_v1_229_code-corpse",
  "onr_v1_231_cortical-scrub",
  "onr_v1_254_liche",
] as const;

export const ONR_V1_6_2_FINAL_CARD_IDS = [
  "onr_v1_212_priority-requisition",
  "onr_v1_215_security-net-optimization",
  "onr_v1_317_data-masons",
  "onr_v1_320_encoder-inc",
  "onr_v1_341_skalderviken-sa-beta-test-site",
] as const;

export const ONR_V1_6_3_FINAL_CARD_IDS = [
  "onr_v1_233_d-arc-knight",
  "onr_v1_267_sentinels-prime",
  "onr_v1_273_triggerman",
  "onr_v1_350_antiquated-interface-routines",
  "onr_v1_371_tokyo-chiba-infighting",
] as const;

export const ONR_V1_7_0_FINAL_CARD_IDS = [
  "onr_v1_011_cloak",
  "onr_v1_036_jackhammer",
  "onr_v1_069_succubus",
  "onr_v1_163_floating-runner-bbs",
  "onr_v1_180_smiths-pawnshop",
] as const;

export const ONR_V1_7_1_FINAL_CARD_IDS = [
  "onr_v1_114_temple-microcode-outlet",
  "onr_v1_106_private-ldl-access",
  "onr_v1_118_weather-to-finance-pipe",
  "onr_v1_084_edited-shipping-manifests",
  "onr_v1_129_hq-interface",
] as const;

export const ONR_V1_7_2_FINAL_CARD_IDS = [
  "onr_v1_283_audit-of-call-records",
  "onr_v1_284_chance-observation",
  "onr_v1_286_corporate-detective-agency",
  "onr_v1_158_danshis-second-id",
  "onr_v1_179_silicon-saloon-franchise",
] as const;

export const ONR_V1_8_0_FINAL_CARD_IDS = [
  "onr_v1_083_desperate-competitor",
  "onr_v1_090_hot-tip-for-wns",
  "onr_v1_156_corporate-ally",
  "onr_v1_159_databroker",
  "onr_v1_201_executive-extraction",
  "onr_v1_214_project-babylon",
] as const;

export const ONR_V1_8_1_FINAL_CARD_IDS = [
  "onr_v1_012_clown",
  "onr_v1_046_pattels-virus",
  "onr_v1_049_pox",
  "onr_v1_094_inside-job",
  "onr_v1_173_restrictive-net-zoning",
  "onr_v1_193_corporate-coup",
  "onr_v1_209_political-coup",
  "onr_v1_222_ball-and-chain",
  "onr_v1_225_canis-major",
  "onr_v1_226_canis-minor",
  "onr_v1_242_fatal-attractor",
  "onr_v1_268_shock-r",
] as const;

export const ONR_V1_9_0_FINAL_CARD_IDS = [
  "onr_v1_005_bartmoss-memorial-icebreaker",
  "onr_v1_007_blink",
  "onr_v1_115_terrorist-reprisal",
  "onr_v1_223_banpei",
  "onr_v1_275_vacuum-link",
] as const;

export const ONR_V1_9_1_FINAL_CARD_IDS = [
  "onr_v1_013_cockroach",
  "onr_v1_034_incubator",
  "onr_v1_030_grubb",
] as const;

export const ONR_V1_9_2_FINAL_CARD_IDS = [
  "onr_v1_076_all-nighter",
  "onr_v1_096_kilroy-was-here",
  "onr_v1_107_romp-through-hq",
  "onr_v1_184_top-runners-conference",
  "onr_v1_188_ai-chief-financial-officer",
  "onr_v1_211_polymer-breakthrough",
  "onr_v1_235_data-naga",
] as const;

export const ONR_V1_9_3_FINAL_CARD_IDS = [
  "onr_v1_207_netwatch-operations-office",
  "onr_v1_213_private-cybernet-police",
  "onr_v1_251_jack-attack",
  "onr_v1_271_tko-2-0",
] as const;

export const ONR_V1_9_4_FINAL_CARD_IDS = [
  "onr_v1_208_on-call-solo-team",
  "onr_v1_217_strike-force-kali",
] as const;
export const ONR_V1_9_5_FINAL_CARD_IDS = [
  "onr_v1_219_superior-net-barriers",
  "onr_v1_308_acme-savings-and-loan",
] as const;
export const ONR_V1_9_6_FINAL_CARD_IDS = ["onr_v1_236_data-raven"] as const;
export const ONR_V1_9_7_FINAL_CARD_IDS = ["onr_v1_001_afreet"] as const;
export const ONR_V1_9_8_FINAL_CARD_IDS = [
  "onr_v1_018_dogcatcher",
  "onr_v1_019_dropp",
] as const;
export const ONR_V1_9_9_FINAL_CARD_IDS = [
  "onr_v1_349_aardvark",
  "onr_v1_351_bizarre-encryption-scheme",
  "onr_v1_352_chester-mix",
  "onr_v1_353_chimera",
] as const;
export const ONR_V1_9_12_RELEASE_CARD_IDS = [
  "onr_v1_009_butcher-boy",
  "onr_v1_010_cascade",
  "onr_v1_017_deep-thought",
  "onr_v1_032_i-spy",
  "onr_v1_064_skivviss",
  "onr_v1_082_deal-with-militech",
  "onr_v1_091_hunt-club-bbs",
  "onr_v1_174_rigged-investments",
  "onr_v1_176_the-shell-traders",
  "onr_v1_198_detroit-police-contract",
  "onr_v1_199_employee-empowerment",
] as const;
export const ONR_V1_9_13_RELEASE_CARD_IDS = [
  "onr_v1_038_joan-of-arc",
  "onr_v1_121_armored-fridge",
  "onr_v1_127_full-body-conversion",
  "onr_v1_128_green-knight-surge-buffers",
  "onr_v1_130_lifesaver-nanosurgeons",
  "onr_v1_135_nasuko-cycle",
  "onr_v1_139_r-and-d-interface",
  "onr_v1_143_techtronica-utility-suit",
  "onr_v1_155_code-viral-cache",
  "onr_v1_161_fall-guy",
  "onr_v1_170_nomad-allies",
  "onr_v1_185_trauma-team",
  "onr_v1_186_umbrella-policy",
  "onr_v1_187_wilson-weeflerunner-apprentice",
  "onr_v1_224_bolter-cluster",
  "onr_v1_234_data-darts",
  "onr_v1_258_neural-blade",
] as const;
export const ONR_V1_9_14_WIP_CARD_IDS = [
  "onr_v1_053_ramming-piston",
  "onr_v1_056_replicator",
  "onr_v1_063_signpost",
  "onr_v1_116_total-genetic-retrofit",
  "onr_v1_120_armadillo-armored-road-home",
  "onr_v1_126_drifter-mobile-environment",
  "onr_v1_132_microtech-trode-set",
  "onr_v1_154_broker",
  "onr_v1_157_crash-everett-inventive-fixer",
  "onr_v1_162_field-reporter-for-ice-and-data",
  "onr_v1_164_hells-run",
  "onr_v1_165_junkyard-bbs",
  "onr_v1_166_karl-de-veres-corporate-stooge",
  "onr_v1_167_leland-corporate-bodyguard",
  "onr_v1_178_short-term-contract",
  "onr_v1_181_the-springboard",
  "onr_v1_183_technician-lover",
  "onr_v1_221_asp",
  "onr_v1_228_cinderella",
  "onr_v1_240_fang",
  "onr_v1_241_fang-2-0",
  "onr_v1_248_homewrecker",
  "onr_v1_260_pocket-virtual-reality",
  "onr_v1_264_rex",
  "onr_v1_299_power-grid-overload",
] as const;

export const ONR_V1_9_14_RUNNER_CARD_IDS = ONR_V1_9_14_WIP_CARD_IDS.filter(
  (cardId) => DEMO_CARDS_BY_ID[cardId]?.side === "runner",
);

export const ONR_V1_9_15_WIP_CARD_IDS = [
  "onr_v1_020_dupre",
  "onr_v1_024_expert-schedule-analyzer",
  "onr_v1_041_microtech-ai-interface",
  "onr_v1_043_mystery-box",
  "onr_v1_062_shredder-uplink-protocol",
  "onr_v1_065_smarteye",
  "onr_v1_098_lucidrine-booster-drug",
  "onr_v1_105_priority-wreck",
  "onr_v1_111_social-engineering",
  "onr_v1_112_stumble-through-wilderspace",
  "onr_v1_142_record-reconstructor",
  "onr_v1_227_cerberus",
  "onr_v1_255_mastiff",
  "onr_v1_294_new-blood",
] as const;

export const ONR_V1_9_16_WIP_CARD_IDS = [
  "onr_v1_003_baedekers-net-map",
  "onr_v1_004_bakdoor",
  "onr_v1_033_imp",
  "onr_v1_035_invisibility",
  "onr_v1_047_pile-driver",
  "onr_v1_050_r-and-d-protocol-files",
  "onr_v1_071_vewy-vewy-quiet",
  "onr_v1_140_raven-microcyb-eagle",
  "onr_v1_141_raven-microcyb-owl",
  "onr_v1_148_access-through-alpha",
  "onr_v1_149_access-to-arasaka",
  "onr_v1_150_access-to-kiribati",
  "onr_v1_152_back-door-to-hilliard",
  "onr_v1_153_back-door-to-orbital-air",
  "onr_v1_182_submarine-uplink",
  "onr_v1_246_fragmentation-storm",
] as const;

export const ONR_V1_9_17_WIP_CARD_IDS = [
  "onr_v1_309_bbs-whispering-campaign",
  "onr_v1_310_blood-cat",
  "onr_v1_311_braindance-campaign",
  "onr_v1_314_corporate-negotiating-center",
  "onr_v1_316_cowboy-sysop",
  "onr_v1_318_department-of-truth-enhancement",
  "onr_v1_319_disinfectant-inc",
  "onr_v1_321_esa-contract",
  "onr_v1_326_holovid-campaign",
  "onr_v1_329_investment-firm",
  "onr_v1_330_krumz",
  "onr_v1_333_omniscience-foundation",
  "onr_v1_336_rescheduler",
  "onr_v1_337_rockerboy-promotion",
  "onr_v1_340_setup",
  "onr_v1_342_solo-squad",
  "onr_v1_344_spinn-public-relations",
  "onr_v1_345_trap",
] as const;

export const ONR_V1_9_18_WIP_CARD_IDS = [
  "onr_v1_354_crybaby",
  "onr_v1_355_crystal-palace-station-grid",
  "onr_v1_356_dedicated-response-team",
  "onr_v1_357_dieter-esslin",
  "onr_v1_358_dr-dreff",
  "onr_v1_359_jenny-jett",
  "onr_v1_361_namatoki-plaza",
  "onr_v1_362_new-galveston-city-grid",
  "onr_v1_364_omni-kismet-ph-d",
  "onr_v1_365_paris-city-grid",
  "onr_v1_366_red-herrings",
  "onr_v1_369_singapore-city-grid",
  "onr_v1_370_tesseract-fort-construction",
  "onr_v1_372_turbeau-delacroix",
  "onr_v1_373_twenty-four-hour-surveillance",
] as const;

export const ONR_V1_9_19_WIP_CARD_IDS = [
  "onr_v1_025_fait-accompli",
  "onr_v1_078_arasaka-owns-you",
  "onr_v1_189_artificial-security-directors",
  "onr_v1_202_genetics-visionary-acquisition",
  "onr_v1_291_falsified-transactions-expert",
  "onr_v1_292_management-shake-up",
  "onr_v1_300_project-consultants",
  "onr_v1_303_silver-lining-recovery-protocol",
  "onr_v1_304_systematic-layoffs",
  "onr_v1_305_team-restructuring",
  "onr_v1_312_chicago-branch",
  "onr_v1_315_corprunners-shattered-remains",
  "onr_v1_323_experimental-ai",
  "onr_v1_328_information-laundering",
  "onr_v1_346_vacant-soulkiller",
  "onr_v1_347_vapor-ops",
  "onr_v1_348_virus-test-site",
  "onr_v1_363_olivia-salazar",
  "onr_v1_368_roving-submarine",
  "onr_v1_374_washington-d-c-city-grid",
] as const;

export const ONR_V1_9_20_WIP_CARD_IDS = [
  "onr_v1_022_emergency-self-construct",
  "onr_v1_029_gremlins",
  "onr_v1_133_militech-mram-chip",
  "onr_v1_134_mram-chip",
  "onr_v1_160_diplomatic-immunity",
  "onr_v1_168_loan-from-chiba",
  "onr_v1_171_preying-mantis",
  "onr_v1_190_bioweapons-engineering",
  "onr_v1_191_black-ice-quality-assurance",
  "onr_v1_192_corporate-boon",
  "onr_v1_200_encryption-breakthrough",
  "onr_v1_204_ice-transmutation",
  "onr_v1_205_main-office-relocation",
  "onr_v1_218_subsidiary-branch",
  "onr_v1_313_city-surveillance",
  "onr_v1_322_euromarket-consortium",
  "onr_v1_324_fortress-architects",
  "onr_v1_325_hacker-tracker-central",
  "onr_v1_327_i-got-a-rock",
  "onr_v1_331_nevinyrral",
  "onr_v1_332_newsgroup-taunting",
  "onr_v1_334_pacifica-regional-ai",
  "onr_v1_335_remote-facility",
  "onr_v1_338_rustbelt-hq-branch",
  "onr_v1_343_south-african-mining-corp",
  "onr_v1_360_jerusalem-city-grid",
] as const;

export const ONR_V1_9_21_WIP_CARD_IDS = [
  "onr_v1_002_ai-boon",
  "onr_v1_008_boardwalk",
  "onr_v1_104_playful-ai",
  "onr_v1_172_quest-for-cattekin",
  "onr_v1_339_schlaghund",
  "onr_v1_367_rio-de-janeiro-city-grid",
] as const;

export const ONR_V1_9_22_WIP_CARD_IDS = [
  "onr_v1_026_false-echo",
  "onr_v1_027_flak",
  "onr_v1_031_hammer",
  "onr_v1_037_japanese-water-torture",
  "onr_v1_044_netspace-inverter",
  "onr_v1_045_newsgroup-filter",
  "onr_v1_048_poltergeist",
  "onr_v1_051_rabbit",
  "onr_v1_055_reflector",
  "onr_v1_057_scatter-shot",
  "onr_v1_061_shield",
  "onr_v1_067_speed-trap",
  "onr_v1_068_startup-immolator",
  "onr_v1_075_zetatech-software-installer",
  "onr_v1_077_anonymous-tip",
  "onr_v1_080_core-command-jettison-ice",
  "onr_v1_086_forged-activation-orders",
  "onr_v1_093_if-you-want-it-done-right",
  "onr_v1_100_misc-for-sale",
  "onr_v1_102_open-ended-mileage-program",
  "onr_v1_103_organ-donor",
  "onr_v1_109_security-code-worm-chip",
  "onr_v1_113_synchronized-attack-on-hq",
  "onr_v1_117_valu-pak-software-bundle",
  "onr_v1_119_arasaka-portable-prototype",
  "onr_v1_122_artemis-2020",
  "onr_v1_123_bodyweight-data-creche",
  "onr_v1_124_corolla-speed-chip",
  "onr_v1_131_microtech-backup-drive",
  "onr_v1_136_pandoras-deck",
  "onr_v1_137_parraline-5750",
  "onr_v1_138_pk-6089a",
  "onr_v1_147_zz22-speed-chip",
  "onr_v1_195_corporate-retreat",
  "onr_v1_196_corporate-war",
  "onr_v1_197_data-fort-reclamation",
  "onr_v1_206_marine-arcology",
  "onr_v1_210_political-overthrow",
  "onr_v1_216_security-purge",
  "onr_v1_247_haunting-inquisition",
  "onr_v1_274_tutor",
  "onr_v1_276_viral-15",
  "onr_v1_277_virizz",
  "onr_v1_280_zombie",
  "onr_v1_289_edgerunner-inc-temps",
  "onr_v1_296_off-site-backups",
  "onr_v1_298_planning-consultants",
] as const;

export const ONR_V1_0_5K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v105k_smoke_094",
  name: "O:NR V1.0.5K Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_015_codeslinger", quantity: 2 },
    { id: "onr_v1_052_raffles", quantity: 2 },
    { id: "onr_v1_054_raptor", quantity: 2 },
    { id: "onr_v1_070_tinweasel", quantity: 2 },
    { id: "onr_v1_144_tycho-mem-chip", quantity: 1 },
    { id: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
    { id: "simple_economy_event", quantity: 2 },
  ],
};

export const ONR_V1_0_5K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v105k_smoke_094",
  name: "O:NR V1.0.5K Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_230_cortical-scanner", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
    { id: "onr_v1_239_endless-corridor", quantity: 2 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

export const ONR_V1_0_6K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v106k_smoke_094",
  name: "O:NR V1.0.6K Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_079_bodyweight-synthetic-blood", quantity: 2 },
    { id: "onr_v1_095_jack-n-joe", quantity: 2 },
    { id: "onr_v1_097_livewires-contacts", quantity: 2 },
    { id: "onr_v1_108_score", quantity: 2 },
    { id: "onr_v1_072_wild-card", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
    { id: "onr_v1_015_codeslinger", quantity: 1 },
    { id: "onr_v1_070_tinweasel", quantity: 1 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

export const ONR_V1_0_6K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v106k_smoke_094",
  name: "O:NR V1.0.6K Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_281_accounts-receivable", quantity: 1 },
    { id: "onr_v1_282_annual-reviews", quantity: 1 },
    { id: "onr_v1_285_closed-accounts", quantity: 1 },
    { id: "onr_v1_287_datapool-by-zetatech", quantity: 1 },
    { id: "onr_v1_288_day-shift", quantity: 1 },
    { id: "onr_v1_290_efficiency-experts", quantity: 1 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
    { id: "onr_v1_302_scorched-earth", quantity: 1 },
    { id: "onr_v1_307_urban-renewal", quantity: 1 },
    { id: "onr_v1_244_filter", quantity: 1 },
    { id: "onr_v1_245_fire-wall", quantity: 1 },
    { id: "onr_v1_252_keeper", quantity: 1 },
    { id: "onr_v1_256_mazer", quantity: 1 },
    { id: "onr_v1_230_cortical-scanner", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 1 },
    { id: "simple_sentry_ice", quantity: 1 },
    { id: "simple_economy_operation", quantity: 1 },
  ],
};

export const ONR_V1_1_2K_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v112k_smoke_094",
  name: "O:NR V1.1.2K Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_006_black-dahlia", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_016_cyfermaster", quantity: 2 },
    { id: "onr_v1_040_loony-goon", quantity: 2 },
    { id: "onr_v1_060_shaka", quantity: 2 },
    { id: "onr_v1_073_wizards-book", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

export const ONR_V1_1_2K_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v112k_smoke_094",
  name: "O:NR V1.1.2K Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
    { id: "onr_v1_295_night-shift", quantity: 1 },
    { id: "onr_v1_253_laser-wire", quantity: 1 },
    { id: "onr_v1_257_nerve-labyrinth", quantity: 1 },
    { id: "onr_v1_259_in-the-face", quantity: 1 },
    { id: "onr_v1_261_quandary", quantity: 1 },
    { id: "onr_v1_262_razor-wire", quantity: 1 },
    { id: "onr_v1_263_reinforced-wall", quantity: 1 },
    { id: "onr_v1_265_rock-is-strong", quantity: 1 },
    { id: "onr_v1_266_scramble", quantity: 1 },
    { id: "onr_v1_269_shotgun-wire", quantity: 1 },
    { id: "onr_v1_270_sleeper", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 1 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

export const ONR_V1_2_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v123_smoke_094",
  name: "O:NR V1.2.3 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_039_krash", quantity: 2 },
    { id: "onr_v1_066_snowball", quantity: 2 },
    { id: "onr_v1_074_worm", quantity: 2 },
    { id: "onr_v1_081_custodial-position", quantity: 1 },
    { id: "onr_v1_085_executive-wiretaps", quantity: 1 },
    { id: "onr_v1_101_mit-west-tier", quantity: 2 },
  ],
};

export const ONR_V1_2_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v123_smoke_094",
  name: "O:NR V1.2.3 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_243_fetch-4-0-1", quantity: 2 },
    { id: "onr_v1_249_hunter", quantity: 2 },
    { id: "onr_v1_297_overtime-incentives", quantity: 3 },
    { id: "onr_v1_306_trojan-horse", quantity: 1 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_261_quandary", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_259_in-the-face", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_6_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v161_smoke_094",
  name: "O:NR V1.6.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_023_evil-twin", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "onr_v1_125_dermatech-bodyplating", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

export const ONR_V1_6_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v161_smoke_094",
  name: "O:NR V1.6.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_229_code-corpse", quantity: 1 },
    { id: "onr_v1_231_cortical-scrub", quantity: 1 },
    { id: "onr_v1_254_liche", quantity: 1 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
    { id: "onr_v1_302_scorched-earth", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_6_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v162_smoke_094",
  name: "O:NR V1.6.2 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_023_evil-twin", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "onr_v1_125_dermatech-bodyplating", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

export const ONR_V1_6_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v162_smoke_094",
  name: "O:NR V1.6.2 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_212_priority-requisition", quantity: 1 },
    { id: "onr_v1_215_security-net-optimization", quantity: 1 },
    { id: "onr_v1_317_data-masons", quantity: 2 },
    { id: "onr_v1_320_encoder-inc", quantity: 2 },
    { id: "onr_v1_341_skalderviken-sa-beta-test-site", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_230_cortical-scanner", quantity: 2 },
    { id: "onr_v1_231_cortical-scrub", quantity: 2 },
    { id: "simple_economy_operation", quantity: 2 },
  ],
};

export const ONR_V1_6_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v163_smoke_094",
  name: "O:NR V1.6.3 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_023_evil-twin", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

export const ONR_V1_6_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v163_smoke_094",
  name: "O:NR V1.6.3 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_233_d-arc-knight", quantity: 1 },
    { id: "onr_v1_267_sentinels-prime", quantity: 1 },
    { id: "onr_v1_273_triggerman", quantity: 1 },
    { id: "onr_v1_350_antiquated-interface-routines", quantity: 2 },
    { id: "onr_v1_371_tokyo-chiba-infighting", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_7_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v170_smoke_094",
  name: "O:NR V1.7.0 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_011_cloak", quantity: 2 },
    { id: "onr_v1_036_jackhammer", quantity: 2 },
    { id: "onr_v1_069_succubus", quantity: 2 },
    { id: "onr_v1_163_floating-runner-bbs", quantity: 2 },
    { id: "onr_v1_180_smiths-pawnshop", quantity: 1 },
    { id: "onr_v1_021_dwarf", quantity: 1 },
    { id: "onr_v1_028_force-shield", quantity: 1 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 3 },
  ],
};

export const ONR_V1_7_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v170_smoke_094",
  name: "O:NR V1.7.0 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_233_d-arc-knight", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_7_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v171_smoke_094",
  name: "O:NR V1.7.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_114_temple-microcode-outlet", quantity: 2 },
    { id: "onr_v1_106_private-ldl-access", quantity: 2 },
    { id: "onr_v1_118_weather-to-finance-pipe", quantity: 2 },
    { id: "onr_v1_084_edited-shipping-manifests", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_036_jackhammer", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

export const ONR_V1_7_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v171_smoke_094",
  name: "O:NR V1.7.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_233_d-arc-knight", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "onr_v1_295_night-shift", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

export const ONR_V1_7_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v172_smoke_094",
  name: "O:NR V1.7.2 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_158_danshis-second-id", quantity: 2 },
    { id: "onr_v1_179_silicon-saloon-franchise", quantity: 2 },
    { id: "onr_v1_163_floating-runner-bbs", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

export const ONR_V1_7_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v172_smoke_094",
  name: "O:NR V1.7.2 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_283_audit-of-call-records", quantity: 2 },
    { id: "onr_v1_284_chance-observation", quantity: 2 },
    { id: "onr_v1_286_corporate-detective-agency", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

export const ONR_V1_8_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v180_smoke_094",
  name: "O:NR V1.8.0 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_083_desperate-competitor", quantity: 2 },
    { id: "onr_v1_090_hot-tip-for-wns", quantity: 2 },
    { id: "onr_v1_156_corporate-ally", quantity: 1 },
    { id: "onr_v1_159_databroker", quantity: 1 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_036_jackhammer", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

export const ONR_V1_8_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v180_smoke_094",
  name: "O:NR V1.8.0 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_201_executive-extraction", quantity: 2 },
    { id: "onr_v1_214_project-babylon", quantity: 2 },
    { id: "simple_agenda", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_8_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v181_smoke_094",
  name: "O:NR V1.8.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_012_clown", quantity: 2 },
    { id: "onr_v1_046_pattels-virus", quantity: 2 },
    { id: "onr_v1_049_pox", quantity: 2 },
    { id: "onr_v1_094_inside-job", quantity: 2 },
    { id: "onr_v1_173_restrictive-net-zoning", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

export const ONR_V1_8_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v181_smoke_094",
  name: "O:NR V1.8.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_193_corporate-coup", quantity: 2 },
    { id: "onr_v1_209_political-coup", quantity: 2 },
    { id: "onr_v1_222_ball-and-chain", quantity: 2 },
    { id: "onr_v1_225_canis-major", quantity: 2 },
    { id: "onr_v1_226_canis-minor", quantity: 2 },
    { id: "onr_v1_242_fatal-attractor", quantity: 2 },
    { id: "onr_v1_268_shock-r", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_0_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v190_smoke_094",
  name: "O:NR V1.9.0 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_005_bartmoss-memorial-icebreaker", quantity: 2 },
    { id: "onr_v1_007_blink", quantity: 2 },
    { id: "onr_v1_115_terrorist-reprisal", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

export const ONR_V1_9_0_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v190_smoke_094",
  name: "O:NR V1.9.0 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_193_corporate-coup", quantity: 2 },
    { id: "onr_v1_209_political-coup", quantity: 2 },
    { id: "onr_v1_223_banpei", quantity: 2 },
    { id: "onr_v1_275_vacuum-link", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v191_smoke_094",
  name: "O:NR V1.9.1 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_013_cockroach", quantity: 2 },
    { id: "onr_v1_034_incubator", quantity: 2 },
    { id: "onr_v1_030_grubb", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v191_smoke_094",
  name: "O:NR V1.9.1 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_279_wall-of-static", quantity: 3 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_2_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v192_smoke_094",
  name: "O:NR V1.9.2 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_076_all-nighter", quantity: 2 },
    { id: "onr_v1_096_kilroy-was-here", quantity: 2 },
    { id: "onr_v1_107_romp-through-hq", quantity: 2 },
    { id: "onr_v1_184_top-runners-conference", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_economy_event", quantity: 4 },
  ],
};

export const ONR_V1_9_2_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v192_smoke_094",
  name: "O:NR V1.9.2 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_188_ai-chief-financial-officer", quantity: 2 },
    { id: "onr_v1_211_polymer-breakthrough", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 2 },
    { id: "onr_v1_235_data-naga", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_3_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v193_smoke_094",
  name: "O:NR V1.9.3 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_129_hq-interface", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_3_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v193_smoke_094",
  name: "O:NR V1.9.3 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_207_netwatch-operations-office", quantity: 2 },
    { id: "onr_v1_213_private-cybernet-police", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 2 },
    { id: "onr_v1_251_jack-attack", quantity: 2 },
    { id: "onr_v1_271_tko-2-0", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_4_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v194_smoke_094",
  name: "O:NR V1.9.4 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_028_force-shield", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_4_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v194_smoke_094",
  name: "O:NR V1.9.4 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_208_on-call-solo-team", quantity: 2 },
    { id: "onr_v1_217_strike-force-kali", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
    { id: "onr_v1_302_scorched-earth", quantity: 2 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_5_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v195_smoke_094",
  name: "O:NR V1.9.5 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_5_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v195_smoke_094",
  name: "O:NR V1.9.5 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_219_superior-net-barriers", quantity: 2 },
    { id: "onr_v1_308_acme-savings-and-loan", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_6_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v196_smoke_094",
  name: "O:NR V1.9.6 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_6_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v196_smoke_094",
  name: "O:NR V1.9.6 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_236_data-raven", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_7_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v197_smoke_094",
  name: "O:NR V1.9.7 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_001_afreet", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_7_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v197_smoke_094",
  name: "O:NR V1.9.7 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_8_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v198_smoke_094",
  name: "O:NR V1.9.8 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_018_dogcatcher", quantity: 2 },
    { id: "onr_v1_019_dropp", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_8_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v198_smoke_094",
  name: "O:NR V1.9.8 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "onr_v1_220_tycho-extension", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_9_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v199_smoke_094",
  name: "O:NR V1.9.9 Runner Smoke",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_001_afreet", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_074_worm", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_9_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v199_smoke_094",
  name: "O:NR V1.9.9 Corp Smoke",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_349_aardvark", quantity: 2 },
    { id: "onr_v1_351_bizarre-encryption-scheme", quantity: 2 },
    { id: "onr_v1_352_chester-mix", quantity: 2 },
    { id: "onr_v1_353_chimera", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_279_wall-of-static", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 3 },
  ],
};

export const ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1911_hidden_zone_wip",
  name: "O:NR V1.9.11 Hidden-Zone WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_042_mouse", quantity: 1 },
    { id: "onr_v1_058_seeya", quantity: 1 },
    { id: "onr_v1_059_self-modifying-code", quantity: 1 },
    { id: "onr_v1_087_forgotten-backup-chip", quantity: 1 },
    { id: "onr_v1_088_fortress-respecification", quantity: 1 },
    { id: "onr_v1_089_gideons-pawnshop", quantity: 1 },
    { id: "onr_v1_092_ice-and-datas-guide-to-the-net", quantity: 1 },
    { id: "onr_v1_099_mantis-fixer-at-large", quantity: 1 },
    { id: "onr_v1_110_sneak-preview", quantity: 1 },
    { id: "onr_v1_151_aujourdoui", quantity: 1 },
    { id: "onr_v1_169_n-e-t-o", quantity: 1 },
    { id: "onr_v1_175_ronin-around", quantity: 1 },
    { id: "onr_v1_177_the-short-circuit", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1911_hidden_zone_wip",
  name: "O:NR V1.9.11 Hidden-Zone WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_194_corporate-downsizing", quantity: 1 },
    { id: "onr_v1_250_ice-pick-willie", quantity: 1 },
    { id: "onr_v1_272_too-many-doors", quantity: 1 },
    { id: "simple_agenda", quantity: 3 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_upgrade", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
    { id: "simple_sentry_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

export const ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1912_counter_recurring_wip",
  name: "O:NR V1.9.12 Counter Recurring WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_009_butcher-boy", quantity: 1 },
    { id: "onr_v1_010_cascade", quantity: 1 },
    { id: "onr_v1_017_deep-thought", quantity: 1 },
    { id: "onr_v1_032_i-spy", quantity: 1 },
    { id: "onr_v1_064_skivviss", quantity: 1 },
    { id: "onr_v1_082_deal-with-militech", quantity: 1 },
    { id: "onr_v1_091_hunt-club-bbs", quantity: 1 },
    { id: "onr_v1_174_rigged-investments", quantity: 1 },
    { id: "onr_v1_176_the-shell-traders", quantity: 1 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1912_counter_recurring_wip",
  name: "O:NR V1.9.12 Counter Recurring WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_198_detroit-police-contract", quantity: 2 },
    { id: "onr_v1_199_employee-empowerment", quantity: 2 },
    { id: "onr_v1_203_hostile-takeover", quantity: 3 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

export const ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1913_damage_prevention_wip",
  name: "O:NR V1.9.13 Damage Prevention WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_038_joan-of-arc", quantity: 1 },
    { id: "onr_v1_121_armored-fridge", quantity: 1 },
    { id: "onr_v1_127_full-body-conversion", quantity: 1 },
    { id: "onr_v1_128_green-knight-surge-buffers", quantity: 1 },
    { id: "onr_v1_130_lifesaver-nanosurgeons", quantity: 1 },
    { id: "onr_v1_135_nasuko-cycle", quantity: 1 },
    { id: "onr_v1_139_r-and-d-interface", quantity: 1 },
    { id: "onr_v1_143_techtronica-utility-suit", quantity: 1 },
    { id: "onr_v1_155_code-viral-cache", quantity: 1 },
    { id: "onr_v1_161_fall-guy", quantity: 1 },
    { id: "onr_v1_170_nomad-allies", quantity: 1 },
    { id: "onr_v1_185_trauma-team", quantity: 1 },
    { id: "onr_v1_186_umbrella-policy", quantity: 1 },
    { id: "onr_v1_187_wilson-weeflerunner-apprentice", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_economy_event", quantity: 8 },
  ],
};

export const ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1913_damage_prevention_wip",
  name: "O:NR V1.9.13 Damage Prevention WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_224_bolter-cluster", quantity: 2 },
    { id: "onr_v1_234_data-darts", quantity: 2 },
    { id: "onr_v1_258_neural-blade", quantity: 2 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 6 },
  ],
};

export const ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1914_trace_tag_resource",
  name: "O:NR V1.9.14 Trace Tag Resource Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_053_ramming-piston", quantity: 1 },
    { id: "onr_v1_056_replicator", quantity: 1 },
    { id: "onr_v1_063_signpost", quantity: 1 },
    { id: "onr_v1_116_total-genetic-retrofit", quantity: 1 },
    { id: "onr_v1_120_armadillo-armored-road-home", quantity: 1 },
    { id: "onr_v1_126_drifter-mobile-environment", quantity: 1 },
    { id: "onr_v1_132_microtech-trode-set", quantity: 1 },
    { id: "onr_v1_154_broker", quantity: 1 },
    { id: "onr_v1_157_crash-everett-inventive-fixer", quantity: 1 },
    { id: "onr_v1_162_field-reporter-for-ice-and-data", quantity: 1 },
    { id: "onr_v1_164_hells-run", quantity: 1 },
    { id: "onr_v1_165_junkyard-bbs", quantity: 1 },
    { id: "onr_v1_166_karl-de-veres-corporate-stooge", quantity: 1 },
    { id: "onr_v1_167_leland-corporate-bodyguard", quantity: 1 },
    { id: "onr_v1_178_short-term-contract", quantity: 1 },
    { id: "onr_v1_181_the-springboard", quantity: 1 },
    { id: "onr_v1_183_technician-lover", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1914_trace_tag_resource",
  name: "O:NR V1.9.14 Trace Tag Resource Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_221_asp", quantity: 2 },
    { id: "onr_v1_228_cinderella", quantity: 2 },
    { id: "onr_v1_240_fang", quantity: 2 },
    { id: "onr_v1_241_fang-2-0", quantity: 2 },
    { id: "onr_v1_248_homewrecker", quantity: 2 },
    { id: "onr_v1_260_pocket-virtual-reality", quantity: 2 },
    { id: "onr_v1_264_rex", quantity: 2 },
    { id: "onr_v1_325_hacker-tracker-central", quantity: 1 },
    { id: "onr_v1_299_power-grid-overload", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

export const ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1915_run_access",
  name: "O:NR V1.9.15 Run Access WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_020_dupre", quantity: 1 },
    { id: "onr_v1_024_expert-schedule-analyzer", quantity: 1 },
    { id: "onr_v1_041_microtech-ai-interface", quantity: 1 },
    { id: "onr_v1_043_mystery-box", quantity: 1 },
    { id: "onr_v1_062_shredder-uplink-protocol", quantity: 1 },
    { id: "onr_v1_065_smarteye", quantity: 1 },
    { id: "onr_v1_098_lucidrine-booster-drug", quantity: 1 },
    { id: "onr_v1_105_priority-wreck", quantity: 2 },
    { id: "onr_v1_111_social-engineering", quantity: 1 },
    { id: "onr_v1_112_stumble-through-wilderspace", quantity: 1 },
    { id: "onr_v1_142_record-reconstructor", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_15_RUN_ACCESS_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1915_run_access",
  name: "O:NR V1.9.15 Run Access WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_227_cerberus", quantity: 2 },
    { id: "onr_v1_255_mastiff", quantity: 2 },
    { id: "onr_v1_294_new-blood", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

export const ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1916_program_subtype",
  name: "O:NR V1.9.16 Program Subtype WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_003_baedekers-net-map", quantity: 1 },
    { id: "onr_v1_004_bakdoor", quantity: 1 },
    { id: "onr_v1_033_imp", quantity: 1 },
    { id: "onr_v1_035_invisibility", quantity: 1 },
    { id: "onr_v1_047_pile-driver", quantity: 1 },
    { id: "onr_v1_050_r-and-d-protocol-files", quantity: 1 },
    { id: "onr_v1_071_vewy-vewy-quiet", quantity: 1 },
    { id: "onr_v1_140_raven-microcyb-eagle", quantity: 1 },
    { id: "onr_v1_141_raven-microcyb-owl", quantity: 1 },
    { id: "onr_v1_148_access-through-alpha", quantity: 1 },
    { id: "onr_v1_149_access-to-arasaka", quantity: 1 },
    { id: "onr_v1_150_access-to-kiribati", quantity: 1 },
    { id: "onr_v1_152_back-door-to-hilliard", quantity: 1 },
    { id: "onr_v1_153_back-door-to-orbital-air", quantity: 1 },
    { id: "onr_v1_182_submarine-uplink", quantity: 1 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1916_program_subtype",
  name: "O:NR V1.9.16 Program Subtype WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_246_fragmentation-storm", quantity: 2 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
    { id: "simple_economy_asset", quantity: 2 },
  ],
};

export const ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1917_generic_asset",
  name: "O:NR V1.9.17 Generic Asset WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "onr_v1_035_invisibility", quantity: 1 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_17_GENERIC_ASSET_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1917_generic_asset",
  name: "O:NR V1.9.17 Generic Asset WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_309_bbs-whispering-campaign", quantity: 1 },
    { id: "onr_v1_310_blood-cat", quantity: 1 },
    { id: "onr_v1_311_braindance-campaign", quantity: 1 },
    { id: "onr_v1_314_corporate-negotiating-center", quantity: 1 },
    { id: "onr_v1_316_cowboy-sysop", quantity: 1 },
    { id: "onr_v1_318_department-of-truth-enhancement", quantity: 1 },
    { id: "onr_v1_319_disinfectant-inc", quantity: 1 },
    { id: "onr_v1_321_esa-contract", quantity: 1 },
    { id: "onr_v1_326_holovid-campaign", quantity: 1 },
    { id: "onr_v1_329_investment-firm", quantity: 1 },
    { id: "onr_v1_330_krumz", quantity: 1 },
    { id: "onr_v1_333_omniscience-foundation", quantity: 1 },
    { id: "onr_v1_336_rescheduler", quantity: 1 },
    { id: "onr_v1_337_rockerboy-promotion", quantity: 1 },
    { id: "onr_v1_340_setup", quantity: 1 },
    { id: "onr_v1_342_solo-squad", quantity: 1 },
    { id: "onr_v1_344_spinn-public-relations", quantity: 1 },
    { id: "onr_v1_345_trap", quantity: 1 },
    { id: "onr_v1_354_crybaby", quantity: 1 },
    { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
    { id: "onr_v1_356_dedicated-response-team", quantity: 1 },
    { id: "onr_v1_357_dieter-esslin", quantity: 1 },
    { id: "onr_v1_358_dr-dreff", quantity: 1 },
    { id: "onr_v1_359_jenny-jett", quantity: 1 },
    { id: "onr_v1_361_namatoki-plaza", quantity: 1 },
    { id: "onr_v1_362_new-galveston-city-grid", quantity: 1 },
    { id: "onr_v1_364_omni-kismet-ph-d", quantity: 1 },
    { id: "onr_v1_365_paris-city-grid", quantity: 1 },
    { id: "onr_v1_366_red-herrings", quantity: 1 },
    { id: "onr_v1_369_singapore-city-grid", quantity: 1 },
    { id: "onr_v1_370_tesseract-fort-construction", quantity: 1 },
    { id: "onr_v1_372_turbeau-delacroix", quantity: 1 },
    { id: "onr_v1_373_twenty-four-hour-surveillance", quantity: 1 },
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

export const ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1919_agenda_overadvance",
  name: "O:NR V1.9.19 Agenda/Overadvance WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_025_fait-accompli", quantity: 1 },
    { id: "onr_v1_078_arasaka-owns-you", quantity: 1 },
    { id: "simple_setup_hardware", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1919_agenda_overadvance",
  name: "O:NR V1.9.19 Agenda/Overadvance WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_189_artificial-security-directors", quantity: 1 },
    { id: "onr_v1_202_genetics-visionary-acquisition", quantity: 1 },
    { id: "onr_v1_291_falsified-transactions-expert", quantity: 1 },
    { id: "onr_v1_292_management-shake-up", quantity: 1 },
    { id: "onr_v1_300_project-consultants", quantity: 1 },
    { id: "onr_v1_303_silver-lining-recovery-protocol", quantity: 1 },
    { id: "onr_v1_304_systematic-layoffs", quantity: 1 },
    { id: "onr_v1_305_team-restructuring", quantity: 1 },
    { id: "onr_v1_312_chicago-branch", quantity: 1 },
    { id: "onr_v1_315_corprunners-shattered-remains", quantity: 1 },
    { id: "onr_v1_323_experimental-ai", quantity: 1 },
    { id: "onr_v1_328_information-laundering", quantity: 1 },
    { id: "onr_v1_346_vacant-soulkiller", quantity: 1 },
    { id: "onr_v1_347_vapor-ops", quantity: 1 },
    { id: "onr_v1_348_virus-test-site", quantity: 1 },
    { id: "onr_v1_363_olivia-salazar", quantity: 1 },
    { id: "onr_v1_368_roving-submarine", quantity: 1 },
    { id: "onr_v1_374_washington-d-c-city-grid", quantity: 1 },
    { id: "onr_v1_302_scorched-earth", quantity: 1 },
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

export const ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_v1920_global_modifier",
  name: "O:NR V1.9.20 Global Modifier WIP Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_022_emergency-self-construct", quantity: 1 },
    { id: "onr_v1_029_gremlins", quantity: 1 },
    { id: "onr_v1_133_militech-mram-chip", quantity: 1 },
    { id: "onr_v1_134_mram-chip", quantity: 1 },
    { id: "onr_v1_160_diplomatic-immunity", quantity: 1 },
    { id: "onr_v1_168_loan-from-chiba", quantity: 1 },
    { id: "onr_v1_171_preying-mantis", quantity: 1 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_economy_event", quantity: 6 },
  ],
};

export const ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_v1920_global_modifier",
  name: "O:NR V1.9.20 Global Modifier WIP Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_190_bioweapons-engineering", quantity: 1 },
    { id: "onr_v1_191_black-ice-quality-assurance", quantity: 1 },
    { id: "onr_v1_192_corporate-boon", quantity: 1 },
    { id: "onr_v1_200_encryption-breakthrough", quantity: 1 },
    { id: "onr_v1_204_ice-transmutation", quantity: 1 },
    { id: "onr_v1_205_main-office-relocation", quantity: 1 },
    { id: "onr_v1_218_subsidiary-branch", quantity: 1 },
    { id: "onr_v1_313_city-surveillance", quantity: 1 },
    { id: "onr_v1_322_euromarket-consortium", quantity: 1 },
    { id: "onr_v1_324_fortress-architects", quantity: 1 },
    { id: "onr_v1_325_hacker-tracker-central", quantity: 1 },
    { id: "onr_v1_327_i-got-a-rock", quantity: 1 },
    { id: "onr_v1_331_nevinyrral", quantity: 1 },
    { id: "onr_v1_332_newsgroup-taunting", quantity: 1 },
    { id: "onr_v1_334_pacifica-regional-ai", quantity: 1 },
    { id: "onr_v1_335_remote-facility", quantity: 1 },
    { id: "onr_v1_338_rustbelt-hq-branch", quantity: 1 },
    { id: "onr_v1_343_south-african-mining-corp", quantity: 1 },
    { id: "onr_v1_360_jerusalem-city-grid", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 1 },
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_economy_operation", quantity: 4 },
  ],
};

export const ONR_V1_RUNNER_DECK: DeckDefinition = {
  id: "onr_v1_runner_test_harness_094",
  name: "O:NR v1 Limited Runner Test Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "onr_v1_079_bodyweight-synthetic-blood", quantity: 2 },
    { id: "onr_v1_095_jack-n-joe", quantity: 2 },
    { id: "onr_v1_097_livewires-contacts", quantity: 2 },
    { id: "onr_v1_108_score", quantity: 2 },
    { id: "onr_v1_006_black-dahlia", quantity: 2 },
    { id: "onr_v1_014_codecracker", quantity: 2 },
    { id: "onr_v1_016_cyfermaster", quantity: 2 },
    { id: "onr_v1_040_loony-goon", quantity: 2 },
    { id: "onr_v1_060_shaka", quantity: 2 },
    { id: "onr_v1_072_wild-card", quantity: 2 },
    { id: "onr_v1_073_wizards-book", quantity: 2 },
    { id: "onr_v1_145_wutech-mem-chip", quantity: 2 },
  ],
};

export const ONR_V1_CORP_DECK: DeckDefinition = {
  id: "onr_v1_corp_test_harness_094",
  name: "O:NR v1 Limited Corp Test Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "onr_v1_220_tycho-extension", quantity: 2 },
    { id: "onr_v1_281_accounts-receivable", quantity: 1 },
    { id: "onr_v1_282_annual-reviews", quantity: 1 },
    { id: "onr_v1_285_closed-accounts", quantity: 1 },
    { id: "onr_v1_287_datapool-by-zetatech", quantity: 1 },
    { id: "onr_v1_288_day-shift", quantity: 1 },
    { id: "onr_v1_290_efficiency-experts", quantity: 1 },
    { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
    { id: "onr_v1_295_night-shift", quantity: 1 },
    { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
    { id: "onr_v1_302_scorched-earth", quantity: 1 },
    { id: "onr_v1_307_urban-renewal", quantity: 1 },
    { id: "onr_v1_230_cortical-scanner", quantity: 1 },
    { id: "onr_v1_232_crystal-wall", quantity: 1 },
    { id: "onr_v1_237_data-wall", quantity: 1 },
    { id: "onr_v1_238_data-wall-2-0", quantity: 1 },
    { id: "onr_v1_239_endless-corridor", quantity: 1 },
    { id: "onr_v1_244_filter", quantity: 1 },
    { id: "onr_v1_245_fire-wall", quantity: 1 },
    { id: "onr_v1_252_keeper", quantity: 1 },
    { id: "onr_v1_253_laser-wire", quantity: 1 },
    { id: "onr_v1_256_mazer", quantity: 1 },
    { id: "onr_v1_257_nerve-labyrinth", quantity: 1 },
    { id: "onr_v1_259_in-the-face", quantity: 1 },
    { id: "onr_v1_261_quandary", quantity: 1 },
    { id: "onr_v1_262_razor-wire", quantity: 1 },
    { id: "onr_v1_263_reinforced-wall", quantity: 1 },
    { id: "onr_v1_265_rock-is-strong", quantity: 1 },
    { id: "onr_v1_266_scramble", quantity: 1 },
    { id: "onr_v1_269_shotgun-wire", quantity: 1 },
    { id: "onr_v1_270_sleeper", quantity: 1 },
    { id: "onr_v1_278_wall-of-ice", quantity: 1 },
    { id: "onr_v1_279_wall-of-static", quantity: 1 },
  ],
};

export const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - Damage Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
  ],
};

export const V094_CORP_DECK: DeckDefinition = {
  id: "demo_corp_094",
  name: "Corp Demo Deck 0.94 - Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
  ],
};

export const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - Core Damage Harness",
  cards: [
    ...V094_CORP_DECK.cards,
    { id: "v111_core_damage_operation", quantity: 2 },
  ],
};

export const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - Resource Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "v095_safehouse_resource", quantity: 2 },
  ],
};

export const V095_CORP_DECK: DeckDefinition = {
  id: "demo_corp_095",
  name: "Corp Demo Deck 0.95 - Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "simple_code_gate_ice", quantity: 2 },
  ],
};

export function v094DamageGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V094_RUNNER_DECK,
    corpDeck: V094_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function onrV1Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_RUNNER_DECK,
    corpDeck: ONR_V1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v105kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_5K_RUNNER_DECK,
    corpDeck: ONR_V1_0_5K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v106kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
    corpDeck: ONR_V1_0_6K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v112kCardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
    corpDeck: ONR_V1_1_2K_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v123CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_2_3_RUNNER_DECK,
    corpDeck: ONR_V1_2_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v161CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_1_RUNNER_DECK,
    corpDeck: ONR_V1_6_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v162CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_2_RUNNER_DECK,
    corpDeck: ONR_V1_6_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v163CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_6_3_RUNNER_DECK,
    corpDeck: ONR_V1_6_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v170CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_7_0_RUNNER_DECK,
    corpDeck: ONR_V1_7_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v171CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_7_1_RUNNER_DECK,
    corpDeck: ONR_V1_7_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v172CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_7_2_RUNNER_DECK,
    corpDeck: ONR_V1_7_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v180CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_8_0_RUNNER_DECK,
    corpDeck: ONR_V1_8_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v181CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_8_1_RUNNER_DECK,
    corpDeck: ONR_V1_8_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v190CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_0_RUNNER_DECK,
    corpDeck: ONR_V1_9_0_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v191CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_1_RUNNER_DECK,
    corpDeck: ONR_V1_9_1_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v192CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_2_RUNNER_DECK,
    corpDeck: ONR_V1_9_2_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v193CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_3_RUNNER_DECK,
    corpDeck: ONR_V1_9_3_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v194CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_4_RUNNER_DECK,
    corpDeck: ONR_V1_9_4_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v195CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_5_RUNNER_DECK,
    corpDeck: ONR_V1_9_5_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v196CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_6_RUNNER_DECK,
    corpDeck: ONR_V1_9_6_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v197CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_7_RUNNER_DECK,
    corpDeck: ONR_V1_9_7_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v198CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_8_RUNNER_DECK,
    corpDeck: ONR_V1_9_8_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v199CardReleaseGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_9_RUNNER_DECK,
    corpDeck: ONR_V1_9_9_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1911HiddenZoneGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1912CounterRecurringGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1913DamagePreventionGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK,
    corpDeck: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1914TraceTagResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK,
    corpDeck: ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1915RunAccessGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK,
    corpDeck: ONR_V1_9_15_RUN_ACCESS_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1916ProgramSubtypeGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK,
    corpDeck: ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1917GenericAssetGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK,
    corpDeck: ONR_V1_9_17_GENERIC_ASSET_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v1919AgendaOveradvanceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
    corpDeck: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export const MECHANIC_SMOKE_CARD_IDS = {
  counterRecurring: ONR_V1_9_12_RELEASE_CARD_IDS,
  damagePrevention: ONR_V1_9_13_RELEASE_CARD_IDS,
  traceTags: ONR_V1_9_14_WIP_CARD_IDS,
  traceTagRunner: ONR_V1_9_14_RUNNER_CARD_IDS,
  runAccess: ONR_V1_9_15_WIP_CARD_IDS,
  programSubtypeHosting: ONR_V1_9_16_WIP_CARD_IDS,
  assetNodeEffects: ONR_V1_9_17_WIP_CARD_IDS,
  serverUpgrades: ONR_V1_9_18_WIP_CARD_IDS,
  agendaScoring: ONR_V1_9_19_WIP_CARD_IDS,
  globalModifiers: ONR_V1_9_20_WIP_CARD_IDS,
  randomEffects: ONR_V1_9_21_WIP_CARD_IDS,
  longtailEffects: ONR_V1_9_22_WIP_CARD_IDS,
} as const;

export const MECHANIC_SMOKE_DECKS = {
  hiddenZone: {
    runner: ONR_V1_9_11_HIDDEN_ZONE_WIP_RUNNER_DECK,
    corp: ONR_V1_9_11_HIDDEN_ZONE_WIP_CORP_DECK,
  },
  counterRecurring: {
    runner: ONR_V1_9_12_COUNTER_RECURRING_WIP_RUNNER_DECK,
    corp: ONR_V1_9_12_COUNTER_RECURRING_WIP_CORP_DECK,
  },
  damagePrevention: {
    runner: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_RUNNER_DECK,
    corp: ONR_V1_9_13_DAMAGE_PREVENTION_WIP_CORP_DECK,
  },
  traceTags: {
    runner: ONR_V1_9_14_TRACE_TAG_RESOURCE_RUNNER_DECK,
    corp: ONR_V1_9_14_TRACE_TAG_RESOURCE_CORP_DECK,
  },
  runAccess: {
    runner: ONR_V1_9_15_RUN_ACCESS_RUNNER_DECK,
    corp: ONR_V1_9_15_RUN_ACCESS_CORP_DECK,
  },
  programSubtypeHosting: {
    runner: ONR_V1_9_16_PROGRAM_SUBTYPE_RUNNER_DECK,
    corp: ONR_V1_9_16_PROGRAM_SUBTYPE_CORP_DECK,
  },
  assetNodeEffects: {
    runner: ONR_V1_9_17_GENERIC_ASSET_RUNNER_DECK,
    corp: ONR_V1_9_17_GENERIC_ASSET_CORP_DECK,
  },
  agendaScoring: {
    runner: ONR_V1_9_19_AGENDA_OVERADVANCE_RUNNER_DECK,
    corp: ONR_V1_9_19_AGENDA_OVERADVANCE_CORP_DECK,
  },
  globalModifiers: {
    runner: ONR_V1_9_20_GLOBAL_MODIFIER_RUNNER_DECK,
    corp: ONR_V1_9_20_GLOBAL_MODIFIER_CORP_DECK,
  },
} as const;

export const MECHANIC_SMOKE_GAMES = {
  hiddenZone: v1911HiddenZoneGame,
  counterRecurring: v1912CounterRecurringGame,
  damagePrevention: v1913DamagePreventionGame,
  traceTags: v1914TraceTagResourceGame,
  runAccess: v1915RunAccessGame,
  programSubtypeHosting: v1916ProgramSubtypeGame,
  assetNodeEffects: v1917GenericAssetGame,
  agendaScoring: v1919AgendaOveradvanceGame,
} as const;

export function v095ResourceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeck: V095_RUNNER_DECK,
    corpDeck: V095_CORP_DECK,
    agendaPointsToWin: 7,
  });
}

export function v096TraceGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_096",
    corpDeckId: "demo_corp_096",
    agendaPointsToWin: 7,
  });
}

export function v097RunGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_097",
    corpDeckId: "demo_corp_097",
    agendaPointsToWin: 7,
  });
}

export function v098IdentityGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_098",
    corpDeckId: "demo_corp_098",
    agendaPointsToWin: 7,
  });
}

export function v099CounterHostingGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    runnerDeckId: "demo_runner_099",
    corpDeckId: "demo_corp_099",
    agendaPointsToWin: 7,
  });
}

export function installedResourceCorpTurn(seed: string): GameState {
  let state = toRunnerTurn(v095ResourceGame(seed));
  state.runner.credits = 6;
  moveRunnerCardToGrip(state, "v095_safehouse_resource");
  state = apply(
    state,
    "runner",
    (action) =>
      action.type === "install_card" &&
      sourceDefinition(state, action) === "v095_safehouse_resource",
  );
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 5;
  state.runner.tags = 1;
  return state;
}

export function originalsetReorderCounterRunlockGame(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    baseline: MVP_0_99_BASELINE,
    runnerDeck: {
      id: "originalset_spotcheck_reorder_counter_runlock_runner",
      name: "Originalset Spotcheck Reorder Counter Runlock Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_014_codecracker", quantity: 2 },
        { id: "onr_v1_006_black-dahlia", quantity: 1 },
        { id: "onr_v1_021_dwarf", quantity: 2 },
        { id: "onr_v1_023_evil-twin", quantity: 3 },
        { id: "onr_v1_032_i-spy", quantity: 1 },
        { id: "onr_v1_055_reflector", quantity: 1 },
        { id: "simple_decoder", quantity: 3 },
        { id: "simple_fracter", quantity: 3 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    },
    corpDeck: {
      id: "originalset_spotcheck_reorder_counter_runlock_corp",
      name: "Originalset Spotcheck Reorder Counter Runlock Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_v1_195_corporate-retreat", quantity: 1 },
        { id: "onr_v1_203_hostile-takeover", quantity: 3 },
        { id: "onr_v1_233_d-arc-knight", quantity: 2 },
        { id: "onr_v1_242_fatal-attractor", quantity: 2 },
        { id: "onr_v1_254_liche", quantity: 1 },
        { id: "onr_v1_262_razor-wire", quantity: 1 },
        { id: "onr_v1_268_shock-r", quantity: 2 },
        { id: "onr_v1_272_too-many-doors", quantity: 2 },
        { id: "onr_v1_312_chicago-branch", quantity: 1 },
        { id: "onr_v1_347_vapor-ops", quantity: 1 },
        { id: "simple_agenda", quantity: 3 },
        { id: "simple_barrier_ice", quantity: 3 },
        { id: "simple_code_gate_ice", quantity: 3 },
        { id: "simple_economy_operation", quantity: 6 },
      ],
    },
    agendaPointsToWin: 7,
  });
}

export function encounterIce(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): GameState {
  let next = apply(
    state,
    "runner",
    (action) => action.type === "start_run" && action.payload?.serverId === serverId,
  );
  next = apply(
    next,
    "corp",
    (action) =>
      action.type === "rez_ice" && sourceDefinition(next, action) === definitionId,
  );
  return next;
}

export function breakCurrentSubroutine(
  state: GameState,
  breakerDefinitionId: string,
  subroutineIndex: number,
): GameState {
  const breakerId = state.runner.rig.programs.find(
    (id) => state.cardInstances[id]?.definitionId === breakerDefinitionId,
  );
  if (!breakerId) throw new Error(`Missing breaker ${breakerDefinitionId}`);
  let next = state;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const breakerAction = getLegalActions(next, "runner").find(
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === breakerId &&
        action.payload?.subroutineIndex === subroutineIndex,
    );
    if (breakerAction) {
      return apply(
        next,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          String(action.payload?.breakerId) === breakerId &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
    }
    const pumpAction = getLegalActions(next, "runner").find(
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === breakerId,
    );
    if (!pumpAction) break;
    next = apply(
      next,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        String(action.payload?.breakerId) === breakerId,
    );
  }
  throw new Error(
    `Missing break action for ${breakerDefinitionId} subroutine ${subroutineIndex}`,
  );
}

export function apply(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const selected = mustAction(state, side, predicate);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function applyChoice(
  state: GameState,
  side: Side,
  selectedOptionId: string,
): GameState {
  return applyChoices(state, side, [selectedOptionId]);
}

export function applyChoices(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const selected = mustAction(
    state,
    side,
    (action) => action.type === "resolve_choice",
  );
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function mustAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): LegalAction {
  const legalActions = getLegalActions(state, side);
  const selected = legalActions.find(predicate);
  if (!selected) throw new Error("Missing legal action");
  return selected;
}

export function toRunnerTurn(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

export function toRunnerTurnFromCorpMain(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "end_turn");
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyChoice(next, "corp", String(next.pendingChoice.options[0]?.id));
  }
  return next;
}

export function sourceDefinition(
  state: GameState,
  action: LegalAction,
): string | undefined {
  if (
    typeof action.source !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule"
  )
    return undefined;
  return state.cardInstances[action.source]?.definitionId;
}

export function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  const scoredPoints = ids.reduce(
    (sum, id) =>
      sum +
      (DEMO_CARDS_BY_ID[state.cardInstances[id]?.definitionId ?? ""]
        ?.agendaPoints ?? 0),
    0,
  );
  return side === "corp"
    ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
    : scoredPoints;
}

export function cardCounterAmount(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return state.cardInstances[cardId]?.counters?.[counterType] ?? 0;
}

export function setCardCounterForTest(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    counters: {
      ...(state.cardInstances[cardId]?.counters ?? {}),
      [counterType]: amount,
    },
  };
}

export function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "v093_test_choice",
    prompt: "private prompt",
    kind: "select_option",
    options: [
      { id: "keep", label: "Keep private option" },
      { id: "ship", label: "Ship private option" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side",
  };
}

export function moveRunnerCardToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function scoreRunnerAgendaForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.scoreArea.includes(id) &&
      !state.corp.scoreArea.includes(id),
  );
  if (!entry) throw new Error(`Missing unscored ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function scoreCorpAgendaForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.scoreArea.includes(id) &&
      !state.corp.scoreArea.includes(id),
  );
  if (!entry) throw new Error(`Missing unscored ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.scoreArea.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function moveRunnerCardCopyToGrip(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id) &&
      !state.runner.rig.hardware.includes(id) &&
      !state.runner.rig.resources.includes(id) &&
      !state.runner.scoreArea.includes(id),
  );
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function putRunnerCardOnTopOfStack(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "stack" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function drawRunnerCardsForTest(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) {
    const id = state.runner.stack.shift();
    if (!id) throw new Error("Missing runner stack card");
    state.runner.grip.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
    };
  }
}

export function moveCorpCardToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function moveCorpCardCopyToHq(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId && !state.corp.hq.includes(id),
  );
  if (!entry) throw new Error(`Missing HQ copy ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function moveCorpCardToArchives(
  state: GameState,
  definitionId: string,
  faceup = true,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "archives" },
    faceup,
    rezzed: faceup,
  };
  return id;
}

export function keepOnlyCorpHqCard(state: GameState, id: CardInstanceId): void {
  const movedToRd = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.hq = [id];
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

export function keepOnlyCorpHqCards(state: GameState, ids: CardInstanceId[]): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.hq.filter((cardId) => !keep.has(cardId));
  state.corp.hq = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

export function keepOnlyCorpArchivesCards(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

export function putCorpCardOnTopOfRd(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function putCorpIceOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing server");
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function putCorpIceCopyOnServer(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing server");
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !server.ice.includes(id as CardInstanceId),
  );
  if (!entry) throw new Error(`Missing ICE copy ${definitionId}`);
  const id = entry[0] as CardInstanceId;
  removeEverywhere(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function putCorpRootInRemote(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) {
    server = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  removeEverywhere(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

export function installRunnerProgramForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function installRunnerHardwareForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.hardware.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function installRunnerResourceForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCard(state, definitionId);
  removeEverywhere(state, id);
  state.runner.rig.resources.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function installRunnerProgramCopyForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([id, card]) =>
      card.definitionId === definitionId &&
      !state.runner.rig.programs.includes(id),
  );
  if (!entry) throw new Error(`Missing uninstalled ${definitionId}`);
  const id = entry[0];
  removeEverywhere(state, id);
  state.runner.rig.programs.push(id);
  state.runner.memoryUsed += 1;
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

export function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
}

export function scoreTwoAgendasForTest(state: GameState): void {
  for (let index = 0; index < 2; index += 1) {
    const entry = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        card.definitionId === "simple_agenda" &&
        !state.corp.scoreArea.includes(id),
    );
      if (!entry) throw new Error("Missing agenda");
    const id = entry[0];
    removeEverywhere(state, id);
    state.corp.scoreArea.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
  }
}

export function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entries = Object.entries(state.cardInstances).filter(
    ([, card]) => card.definitionId === definitionId,
  );
  const entry =
    entries.find(
      ([id]) =>
        !state.corp.scoreArea.includes(id) &&
        !state.runner.scoreArea.includes(id),
    ) ?? entries[0];
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

export function removeEverywhere(state: GameState, id: string): void {
  state.corp.hq = state.corp.hq.filter((cardId) => cardId !== id);
  state.corp.rd = state.corp.rd.filter((cardId) => cardId !== id);
  state.corp.archives = state.corp.archives.filter((cardId) => cardId !== id);
  state.corp.scoreArea = state.corp.scoreArea.filter((cardId) => cardId !== id);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((cardId) => cardId !== id);
    server.root = server.root.filter((cardId) => cardId !== id);
  }
  state.runner.grip = state.runner.grip.filter((cardId) => cardId !== id);
  state.runner.stack = state.runner.stack.filter((cardId) => cardId !== id);
  state.runner.heap = state.runner.heap.filter((cardId) => cardId !== id);
  state.runner.scoreArea = state.runner.scoreArea.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (cardId) => cardId !== id,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (cardId) => cardId !== id,
  );
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter(
      (cardId) => cardId !== id,
    );
    state.specialZones.removedFromGame =
      state.specialZones.removedFromGame.filter((cardId) => cardId !== id);
  }
}
