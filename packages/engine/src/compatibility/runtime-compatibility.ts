// These card-definition and source markers are still read by runtime paths in
// index.ts. Keep their values stable: several are replay, pending-choice,
// RunState, or public-payload compatibility inputs rather than removable IDs.

export const BARTMOSS_ID = "onr_v1_005_bartmoss-memorial-icebreaker";
export const BLINK_ID = "onr_v1_007_blink";
export const BUTCHER_BOY_ID = "onr_v1_009_butcher-boy";
export const CASCADE_ID = "onr_v1_010_cascade";
export const COCKROACH_ID = "onr_v1_013_cockroach";
export const GRUBB_ID = "onr_v1_030_grubb";
export const INCUBATOR_ID = "onr_v1_034_incubator";
export const ALL_NIGHTER_ID = "onr_v1_076_all-nighter";
export const DEAL_WITH_MILITECH_ID = "onr_v1_082_deal-with-militech";
export const HUNT_CLUB_BBS_ID = "onr_v1_091_hunt-club-bbs";
export const SNEAK_PREVIEW_ID = "onr_v1_110_sneak-preview";
export const ARMADILLO_ARMORED_ROAD_HOME_ID =
  "onr_v1_120_armadillo-armored-road-home";
export const DRIFTER_MOBILE_ENVIRONMENT_ID =
  "onr_v1_126_drifter-mobile-environment";
export const SELF_MODIFYING_CODE_ID = "onr_v1_059_self-modifying-code";
export const CODE_VIRAL_CACHE_ID = "onr_v1_155_code-viral-cache";
export const JUNKYARD_BBS_ID = "onr_v1_165_junkyard-bbs";
export const SHELL_TRADERS_ID = "onr_v1_176_the-shell-traders";

// Icebreaker and hosted-credit guards still participate in payment and
// revalidation paths. Their string values are compatibility inputs.
export const MICROTECH_TRODE_SET_ID = "onr_v1_132_microtech-trode-set";
export const PILE_DRIVER_ID = "onr_v1_047_pile-driver";
export const RAMMING_PISTON_ID = "onr_v1_053_ramming-piston";
export const SKIVVISS_ID = "onr_v1_064_skivviss";
export const BODYWEIGHT_DATA_CRECHE_ID = "onr_v1_123_bodyweight-data-creche";
export const BIZARRE_ENCRYPTION_SCHEME_ID =
  "onr_v1_351_bizarre-encryption-scheme";
export const CHIMERA_ID = "onr_v1_353_chimera";
export const ICE_PICK_WILLIE_ID = "onr_v1_250_ice-pick-willie";
export const TOO_MANY_DOORS_ID = "onr_v1_272_too-many-doors";
export const EMPLOYEE_EMPOWERMENT_ID = "onr_v1_199_employee-empowerment";
export const TERRORIST_REPRISAL_ID = "onr_v1_115_terrorist-reprisal";
export const DUPRE_ID = "onr_v1_020_dupre";
export const PATTELS_VIRUS_ID = "onr_v1_046_pattels-virus";
export const POX_ID = "onr_v1_049_pox";
export const MYSTERY_BOX_ID = "onr_v1_043_mystery-box";
export const POLTERGEIST_ID = "onr_v1_048_poltergeist";
export const SMARTEYE_ID = "onr_v1_065_smarteye";
export const HELLS_RUN_ID = "onr_v1_164_hells-run";
export const RONIN_AROUND_ID = "onr_v1_175_ronin-around";
export const NEVINYRRAL_ID = "onr_v1_331_nevinyrral";

// Legacy source markers below are visible in old payloads, run state, damage
// attribution, or replay records. Rename only through a migration batch.
export const DANSHIS_SECOND_ID = "onr_v1_158_danshis-second-id";
export const ZZ22_SPEED_CHIP_ID = "onr_v1_147_zz22-speed-chip";
export const MIT_WEST_TIER_REMOVED_FROM_GAME_REASON =
  "onr_v1_101_mit_west_tier";
export const BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE =
  "onr_v1_222_ball-and-chain";
export const FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE =
  "subroutine:onr_v1_242_fatal-attractor:next_encounter";
export const TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE =
  "onr_v1_371_tokyo-chiba-infighting";

// Longtail runtime markers keep legacy card-definition values at the
// compatibility boundary while productive rule paths use behavior names.
export const BLACK_ICE_DEREZ_EVENT_SOURCE = "onr_v1_077_anonymous-tip";
export const HQ_ICE_JETTISON_EVENT_SOURCE =
  "onr_v1_080_core-command-jettison-ice";
export const FORCE_REZ_EVENT_SOURCE = "onr_v1_086_forged-activation-orders";
export const INSTALLED_CARD_TRASH_EVENT_SOURCE = "onr_v1_100_misc-for-sale";
export const TAG_RETURN_EVENT_SOURCE =
  "onr_v1_102_open-ended-mileage-program";
export const HQ_CARD_TRASH_EVENT_SOURCE =
  "onr_v1_109_security-code-worm-chip";
export const HQ_ACCESS_RETAIN_EVENT_SOURCE =
  "onr_v1_113_synchronized-attack-on-hq";
export const PROGRAM_BUNDLE_INSTALL_EVENT_SOURCE =
  "onr_v1_117_valu-pak-software-bundle";
export const BREAKER_DISABLE_PROGRAM_SOURCE =
  "onr_v1_037_japanese-water-torture";
export const ZETATECH_SOFTWARE_INSTALLER_SOURCE =
  "onr_v1_075_zetatech-software-installer";
export const HQ_INTERFACE_PROGRAM_SOURCE = "onr_v1_051_rabbit";
export const UPGRADE_TRASH_PROGRAM_SOURCE = "onr_v1_057_scatter-shot";
export const RUN_STRENGTH_HARDWARE_SOURCE =
  "onr_v1_124_corolla-speed-chip";
export const SUCCESSFUL_RUN_FORCE_REZ_PROGRAM_SOURCE =
  "onr_v1_026_false-echo";
export const ICE_ORDER_REVERSAL_PROGRAM_SOURCE =
  "onr_v1_044_netspace-inverter";
export const REZ_INTERRUPT_PROGRAM_SOURCE = "onr_v1_067_speed-trap";
export const HOST_RETURN_HARDWARE_SOURCE =
  "onr_v1_131_microtech-backup-drive";
export const RUNNER_CARD_INSTALL_OPERATION_SOURCE =
  "onr_v1_289_edgerunner-inc-temps";
export const ACTIVE_ICE_TRASH_PROGRAM_SOURCE = "onr_v1_276_viral-15";

export const RUNNER_DAMAGE_PREVENTION_RESOURCE_SOURCE =
  "onr_v1_160_diplomatic-immunity";
export const ABLATIVE_COUNTER_HARDWARE_SOURCE = "onr_v1_121_armored-fridge";
export const CORE_REPLACEMENT_DAMAGE_PREVENTION_SOURCE =
  "onr_v1_127_full-body-conversion";
export const SELF_REPAIR_DAMAGE_PREVENTION_PROGRAM_SOURCE =
  "onr_v1_022_emergency-self-construct";
export const DUAL_DAMAGE_BUFFER_PROGRAM_SOURCE = "onr_v1_023_evil-twin";
export const TWO_DAMAGE_PREVENTION_PROGRAM_SOURCE =
  "onr_v1_028_force-shield";
export const SINGLE_DAMAGE_PREVENTION_PROGRAM_SOURCE =
  "onr_v1_038_joan-of-arc";
export const MEAT_ARMOR_HARDWARE_SOURCE =
  "onr_v1_125_dermatech-bodyplating";
export const NET_SURGE_BUFFER_HARDWARE_SOURCE =
  "onr_v1_128_green-knight-surge-buffers";
export const CORE_DAMAGE_PREVENTION_HARDWARE_SOURCE =
  "onr_v1_130_lifesaver-nanosurgeons";
export const NET_MEAT_DAMAGE_PREVENTION_HARDWARE_SOURCE =
  "onr_v1_135_nasuko-cycle";
export const NET_MEAT_UTILITY_HARDWARE_SOURCE =
  "onr_v1_143_techtronica-utility-suit";
export const MEAT_DAMAGE_PREVENTION_RESOURCE_SOURCE =
  "onr_v1_185_trauma-team";
export const NET_DAMAGE_PREVENTION_PROGRAM_SOURCE = "onr_v1_061_shield";

export const OVERADVANCE_DIRECTOR_AGENDA_SOURCE =
  "onr_v1_189_artificial-security-directors";
export const COUNTER_GAIN_PROGRAM_SOURCE = "onr_v1_025_fait-accompli";
export const FLATLINE_REPLACEMENT_EVENT_SOURCE =
  "onr_v1_078_arasaka-owns-you";
export const OVERADVANCE_ACQUISITION_AGENDA_SOURCE =
  "onr_v1_202_genetics-visionary-acquisition";
export const COUNTER_CREDIT_OPERATION_SOURCE =
  "onr_v1_291_falsified-transactions-expert";
export const ADVANCEMENT_REASSIGN_OPERATION_SOURCE =
  "onr_v1_292_management-shake-up";
export const AGENDA_ADVANCE_OPERATION_SOURCE =
  "onr_v1_300_project-consultants";
export const ECONOMY_RECOVERY_OPERATION_SOURCE =
  "onr_v1_303_silver-lining-recovery-protocol";
export const ADVANCEMENT_PLACEMENT_OPERATION_SOURCE =
  "onr_v1_304_systematic-layoffs";
export const TEAM_COUNTER_OPERATION_SOURCE =
  "onr_v1_305_team-restructuring";
export const ACCESS_HARDWARE_TRASH_ASSET_SOURCE =
  "onr_v1_315_corprunners-shattered-remains";
export const ACCESS_PROGRAM_TRASH_ASSET_SOURCE =
  "onr_v1_323_experimental-ai";
export const ACCESS_CORE_DAMAGE_ASSET_SOURCE =
  "onr_v1_346_vacant-soulkiller";
export const ACCESS_NET_DAMAGE_ASSET_SOURCE =
  "onr_v1_348_virus-test-site";

export const HQ_AGENDA_REVEAL_ASSET_SOURCE =
  "onr_v1_314_corporate-negotiating-center";
export const SERVER_ICE_SWAP_UPGRADE_SOURCE =
  "onr_v1_369_singapore-city-grid";
export const STACK_TOP5_EVENT_SOURCE =
  "onr_v1_093_if-you-want-it-done-right";
export const DAILY_CREDIT_RESOURCE_SOURCE = "onr_v1_151_aujourdoui";
export const GRIP_TRASH_EVENT_SOURCE = "onr_v1_103_organ-donor";
export const ARCHIVES_TO_HQ_OPERATION_SOURCE =
  "onr_v1_296_off-site-backups";
export const RD_TOP5_REORDER_OPERATION_SOURCE =
  "onr_v1_298_planning-consultants";
export const SERVER_EXPOSE_PROGRAM_SOURCES = new Set([
  "onr_v1_042_mouse",
  "onr_v1_058_seeya",
]);
export const STACK_SEARCH_PROGRAM_SOURCES = new Set([
  "onr_v1_059_self-modifying-code",
  DAILY_CREDIT_RESOURCE_SOURCE,
  "onr_v1_169_n-e-t-o",
  "onr_v1_177_the-short-circuit",
]);
export const COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE = "onr_v1_032_i-spy";
export const STACK_TOP_REORDER_RESOURCE_SOURCE = "onr_v1_175_ronin-around";
export const PAID_STACK_SEARCH_RESOURCE_SOURCE =
  "onr_v1_177_the-short-circuit";

export const ACCESS_MEAT_DAMAGE_UPGRADE_SOURCE =
  "onr_v1_356_dedicated-response-team";
export const ACCESS_NET_DAMAGE_UPGRADE_SOURCE = "onr_v1_357_dieter-esslin";
export const ACCESS_COST_UPGRADE_SOURCE = "onr_v1_354_crybaby";
export const COUNTER_RUN_TAX_UPGRADE_SOURCE = "onr_v1_358_dr-dreff";
export const ACCESS_TRACE_DAMAGE_UPGRADE_SOURCE =
  "onr_v1_372_turbeau-delacroix";
export const RUN_REPLACEMENT_OVERLAP_EVENT_SOURCE =
  "onr_v1_098_lucidrine-booster-drug";
export const RUN_ACCESS_PRESSURE_EVENT_SOURCE =
  "onr_v1_111_social-engineering";
export const TRACE_AWARE_RUN_EVENT_SOURCE =
  "onr_v1_112_stumble-through-wilderspace";
export const INSTALLED_CARD_LIMIT_ASSET_SOURCE = "onr_v1_316_cowboy-sysop";
export const VIRUS_COUNTER_ASSET_SOURCE = "onr_v1_319_disinfectant-inc";
export const ACCESS_SETUP_AMBUSH_ASSET_SOURCE = "onr_v1_340_setup";
export const ACCESS_TRAP_AMBUSH_ASSET_SOURCE = "onr_v1_345_trap";
export const RANDOM_BREAKER_PROGRAM_SOURCE = "onr_v1_002_ai-boon";
export const BOARDWALK_RANDOM_PROGRAM_SOURCE = "onr_v1_008_boardwalk";
export const RANDOM_RESOURCE_SOURCE = "onr_v1_172_quest-for-cattekin";
export const RUNNER_RANDOM_PROGRAM_SOURCES = new Set([
  RANDOM_BREAKER_PROGRAM_SOURCE,
  BOARDWALK_RANDOM_PROGRAM_SOURCE,
]);
export const TAG_HANDSIZE_ASSET_SOURCE = "onr_v1_332_newsgroup-taunting";
export const BREAK_COST_MODIFIER_SOURCE = "onr_v1_277_virizz";
