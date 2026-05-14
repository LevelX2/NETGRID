import {
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  MVP_0_1_BASELINE,
  MVP_0_4_BASELINE,
  MVP_0_8_BASELINE,
  MVP_0_94_BASELINE,
  MVP_0_95_BASELINE,
  MVP_0_96_BASELINE,
  MVP_0_97_BASELINE,
  MVP_0_98_BASELINE,
  MVP_0_99_BASELINE,
  type ActionType,
  type ChoiceRequest,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CounterType,
  type CorpServer,
  type CreateGameConfig,
  type DeckDefinition,
  type DeckPublicMetadata,
  type DemoDeckId,
  type DamageType,
  type EngineError,
  type EngineResult,
  type EventVisibilityClass,
  type EffectCommand,
  type EventModificationCandidate,
  type EventModificationWindow,
  type GameEvent,
  type GameEndReason,
  type GameState,
  type ImminentEvent,
  type LegalAction,
  type PlayerAction,
  type PlayerController,
  type PlayerView,
  type PublicGameEvent,
  type ReplacementCandidate,
  type ReplacementWindow,
  type ReplayResult,
  type RunState,
  type RulesBaseline,
  type SpecialZoneKind,
  type SpecialZoneState,
  type SpecialZoneVisibility,
  type ModifierKind,
  type ServerId,
  type SetupState,
  type Side,
  type StateHash,
  type TraceSuccessEffect,
  type ValidationResult,
  type VisibleCard,
  type Winner,
} from "@netgrid/shared";

export {
  DEMO_CARDS,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  MVP_0_1_BASELINE,
  MVP_0_2_BASELINE,
  MVP_0_3_BASELINE,
  MVP_0_4_BASELINE,
  MVP_0_8_BASELINE,
  MVP_0_94_BASELINE,
  MVP_0_95_BASELINE,
  MVP_0_96_BASELINE,
  MVP_0_97_BASELINE,
  MVP_0_98_BASELINE,
  MVP_0_99_BASELINE,
} from "@netgrid/shared";

export type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CounterType,
  CorpServer,
  CreateGameConfig,
  DeckDefinition,
  DeckPublicMetadata,
  DemoDeckId,
  DamageType,
  EngineError,
  EngineResult,
  EventVisibilityClass,
  EventModificationCandidate,
  EventModificationWindow,
  EffectCommand,
  GameEvent,
  GameEndReason,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
  PlayerView,
  PublicGameEvent,
  ReplacementCandidate,
  ReplacementWindow,
  ReplayResult,
  RulesBaseline,
  SpecialZoneKind,
  SpecialZoneState,
  SpecialZoneVisibility,
  SetupState,
  Side,
  StateHash,
  ValidationResult,
  VisibleCard,
  Winner,
} from "@netgrid/shared";

const DEFAULT_CONTROLLERS: {
  runner: PlayerController;
  corp: PlayerController;
} = {
  runner: {
    controllerId: "runner-local",
    side: "runner",
    type: "human_local",
    displayName: "Runner",
  },
  corp: {
    controllerId: "corp-ai",
    side: "corp",
    type: "ai",
    displayName: "Korp KI",
  },
};

type CardPoolVersion =
  | "0.1.0"
  | "0.4.0"
  | "0.8.0"
  | "0.94.0"
  | "0.95.0"
  | "0.96.0"
  | "0.97.0"
  | "0.98.0"
  | "0.99.0";

type RunnerEventResolver = {
  name: string;
  requiresServer?: boolean;
  canPlay?: (state: GameState) => boolean;
  canPlayForServer?: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => boolean;
  resolve: (state: GameState, legalAction: LegalAction) => void;
};

type CorpOperationResolver = {
  name: string;
  canPlay?: (state: GameState) => boolean;
  resolve: (state: GameState, legalAction: LegalAction) => void;
};

type CorpRootRezResolver = {
  name: string;
  resolve: (state: GameState) => void;
};

type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

type RuntimeDamagePreventionProfile = {
  maxPerTurn: number;
  damageTypes: DamageType[];
  priority: number;
};

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
type BreachEntryStatus = ActiveBreach["queue"][number]["status"];

const STANDARD_AGENDA_POINTS_TO_WIN = 7;
const INITIAL_HAND_SIZE = 5;
const BASE_MAX_HAND_SIZE = 5;
const BARTMOSS_ID = "onr_v1_005_bartmoss-memorial-icebreaker";
const BLINK_ID = "onr_v1_007_blink";
const COCKROACH_ID = "onr_v1_013_cockroach";
const GRUBB_ID = "onr_v1_030_grubb";
const INCUBATOR_ID = "onr_v1_034_incubator";
const ALL_NIGHTER_ID = "onr_v1_076_all-nighter";
const KILROY_WAS_HERE_ID = "onr_v1_096_kilroy-was-here";
const ROMP_THROUGH_HQ_ID = "onr_v1_107_romp-through-hq";
const TOP_RUNNERS_CONFERENCE_ID = "onr_v1_184_top-runners-conference";
const AI_CHIEF_FINANCIAL_OFFICER_ID = "onr_v1_188_ai-chief-financial-officer";
const NETWATCH_OPERATIONS_OFFICE_ID = "onr_v1_207_netwatch-operations-office";
const ON_CALL_SOLO_TEAM_ID = "onr_v1_208_on-call-solo-team";
const PRIVATE_CYBERNET_POLICE_ID = "onr_v1_213_private-cybernet-police";
const STRIKE_FORCE_KALI_ID = "onr_v1_217_strike-force-kali";
const SUPERIOR_NET_BARRIERS_ID = "onr_v1_219_superior-net-barriers";
const DATA_RAVEN_ID = "onr_v1_236_data-raven";
const ACME_SAVINGS_AND_LOAN_ID = "onr_v1_308_acme-savings-and-loan";
const V1917_ECONOMY_ASSET_IDS = new Set([
  "onr_v1_309_bbs-whispering-campaign",
  "onr_v1_311_braindance-campaign",
  "onr_v1_314_corporate-negotiating-center",
  "onr_v1_321_esa-contract",
  "onr_v1_326_holovid-campaign",
  "onr_v1_329_investment-firm",
  "onr_v1_337_rockerboy-promotion",
  "onr_v1_344_spinn-public-relations",
]);
const V1917_RECURRING_ASSET_IDS = new Set([
  "onr_v1_311_braindance-campaign",
  "onr_v1_314_corporate-negotiating-center",
  "onr_v1_326_holovid-campaign",
  "onr_v1_329_investment-firm",
  "onr_v1_344_spinn-public-relations",
]);
const V1917_TRACE_ASSET_IDS = new Set([
  "onr_v1_310_blood-cat",
  "onr_v1_330_krumz",
]);
const V1917_HIDDEN_REVEAL_ASSET_IDS = new Set([
  "onr_v1_314_corporate-negotiating-center",
]);
const V1917_HIDDEN_REORDER_ASSET_IDS = new Set(["onr_v1_336_rescheduler"]);
const V1917_COWBOY_SYSOP_ID = "onr_v1_316_cowboy-sysop";
const V1917_DISINFECTANT_ID = "onr_v1_319_disinfectant-inc";
const V1917_SOLO_SQUAD_ID = "onr_v1_342_solo-squad";
const V1917_SETUP_ID = "onr_v1_340_setup";
const V1917_TRAP_ID = "onr_v1_345_trap";
const V1918_DEDICATED_RESPONSE_TEAM_ID = "onr_v1_356_dedicated-response-team";
const V1918_DIETER_ESSLIN_ID = "onr_v1_357_dieter-esslin";
const V1918_CRYSTAL_PALACE_STATION_GRID_ID =
  "onr_v1_355_crystal-palace-station-grid";
const V1918_DR_DREFF_ID = "onr_v1_358_dr-dreff";
const V1918_NEW_GALVESTON_CITY_GRID_ID = "onr_v1_362_new-galveston-city-grid";
const V1918_OMNI_KISMET_ID = "onr_v1_364_omni-kismet-ph-d";
const V1918_PARIS_CITY_GRID_ID = "onr_v1_365_paris-city-grid";
const V1918_RED_HERRINGS_ID = "onr_v1_366_red-herrings";
const V1918_TURBEAU_DELACROIX_ID = "onr_v1_372_turbeau-delacroix";
const V1918_TWENTY_FOUR_HOUR_SURVEILLANCE_ID =
  "onr_v1_373_twenty-four-hour-surveillance";
const V1918_COUNTER_UPGRADE_IDS = new Set([
  V1918_CRYSTAL_PALACE_STATION_GRID_ID,
  V1918_DR_DREFF_ID,
]);
const V1918_RUN_TAX_UPGRADE_IDS = new Set([
  V1918_DR_DREFF_ID,
  V1918_TURBEAU_DELACROIX_ID,
  V1918_TWENTY_FOUR_HOUR_SURVEILLANCE_ID,
]);
const V1918_TAG_CONDITION_UPGRADE_IDS = new Set([
  V1918_OMNI_KISMET_ID,
  V1918_PARIS_CITY_GRID_ID,
]);
const V1919_ARTIFICIAL_SECURITY_DIRECTORS_ID =
  "onr_v1_189_artificial-security-directors";
const V1919_FAIT_ACCOMPLI_ID = "onr_v1_025_fait-accompli";
const V1919_ARASAKA_OWNS_YOU_ID = "onr_v1_078_arasaka-owns-you";
const V1919_GENETICS_VISIONARY_ACQUISITION_ID =
  "onr_v1_202_genetics-visionary-acquisition";
const V1919_FALSIFIED_TRANSACTIONS_EXPERT_ID =
  "onr_v1_291_falsified-transactions-expert";
const V1919_MANAGEMENT_SHAKE_UP_ID = "onr_v1_292_management-shake-up";
const V1919_PROJECT_CONSULTANTS_ID = "onr_v1_300_project-consultants";
const V1919_SILVER_LINING_RECOVERY_PROTOCOL_ID =
  "onr_v1_303_silver-lining-recovery-protocol";
const V1919_SYSTEMATIC_LAYOFFS_ID = "onr_v1_304_systematic-layoffs";
const V1919_TEAM_RESTRUCTURING_ID = "onr_v1_305_team-restructuring";
const V1919_CHICAGO_BRANCH_ID = "onr_v1_312_chicago-branch";
const V1919_CORPRUNNERS_SHATTERED_REMAINS_ID =
  "onr_v1_315_corprunners-shattered-remains";
const V1919_EXPERIMENTAL_AI_ID = "onr_v1_323_experimental-ai";
const V1919_INFORMATION_LAUNDERING_ID = "onr_v1_328_information-laundering";
const V1919_VACANT_SOULKILLER_ID = "onr_v1_346_vacant-soulkiller";
const V1919_VAPOR_OPS_ID = "onr_v1_347_vapor-ops";
const V1919_VIRUS_TEST_SITE_ID = "onr_v1_348_virus-test-site";
const V1919_OLIVIA_SALAZAR_ID = "onr_v1_363_olivia-salazar";
const V1919_ROVING_SUBMARINE_ID = "onr_v1_368_roving-submarine";
const V1919_WASHINGTON_DC_CITY_GRID_ID = "onr_v1_374_washington-d-c-city-grid";
const V1919_OVERADVANCE_AGENDA_IDS = new Set([
  V1919_ARTIFICIAL_SECURITY_DIRECTORS_ID,
  V1919_GENETICS_VISIONARY_ACQUISITION_ID,
]);
const V1919_SCORED_REVEAL_AGENDA_IDS = new Set([
  V1919_ARTIFICIAL_SECURITY_DIRECTORS_ID,
  V1919_GENETICS_VISIONARY_ACQUISITION_ID,
]);
const V1919_SERVER_DIFFICULTY_UPGRADE_IDS = new Set([
  V1919_ROVING_SUBMARINE_ID,
  V1919_WASHINGTON_DC_CITY_GRID_ID,
]);
const V1919_COUNTER_ASSET_IDS = new Set([
  V1919_CHICAGO_BRANCH_ID,
  V1919_VAPOR_OPS_ID,
]);
const V1919_COUNTER_OPERATION_IDS = new Set([
  V1919_FALSIFIED_TRANSACTIONS_EXPERT_ID,
  V1919_MANAGEMENT_SHAKE_UP_ID,
  V1919_TEAM_RESTRUCTURING_ID,
]);
const V1920_MAIN_OFFICE_RELOCATION_ID = "onr_v1_205_main-office-relocation";
const V1920_FORTRESS_ARCHITECTS_ID = "onr_v1_324_fortress-architects";
const V1920_ACTION_ASSET_IDS = new Set([
  "onr_v1_331_nevinyrral",
  "onr_v1_334_pacifica-regional-ai",
  "onr_v1_335_remote-facility",
]);
const V1921_AI_BOON_ID = "onr_v1_002_ai-boon";
const V1921_BOARDWALK_ID = "onr_v1_008_boardwalk";
const V1921_PLAYFUL_AI_ID = "onr_v1_104_playful-ai";
const V1921_QUEST_FOR_CATTEKIN_ID = "onr_v1_172_quest-for-cattekin";
const V1921_RUNNER_RANDOM_PROGRAM_IDS = new Set([
  V1921_AI_BOON_ID,
  V1921_BOARDWALK_ID,
]);
const V1921_SCHLAGHUND_ID = "onr_v1_339_schlaghund";
const V1921_RIO_DE_JANEIRO_CITY_GRID_ID = "onr_v1_367_rio-de-janeiro-city-grid";
const V1922_ANONYMOUS_TIP_ID = "onr_v1_077_anonymous-tip";
const V1922_CORE_COMMAND_JETTISON_ICE_ID =
  "onr_v1_080_core-command-jettison-ice";
const V1922_FORGED_ACTIVATION_ORDERS_ID = "onr_v1_086_forged-activation-orders";
const V1922_IF_YOU_WANT_IT_DONE_RIGHT_ID =
  "onr_v1_093_if-you-want-it-done-right";
const V1922_MISC_FOR_SALE_ID = "onr_v1_100_misc-for-sale";
const V1922_OPEN_ENDED_MILEAGE_PROGRAM_ID =
  "onr_v1_102_open-ended-mileage-program";
const V1922_ORGAN_DONOR_ID = "onr_v1_103_organ-donor";
const V1922_SECURITY_CODE_WORM_CHIP_ID = "onr_v1_109_security-code-worm-chip";
const V1922_SYNCHRONIZED_ATTACK_ON_HQ_ID =
  "onr_v1_113_synchronized-attack-on-hq";
const V1922_VALU_PAK_SOFTWARE_BUNDLE_ID = "onr_v1_117_valu-pak-software-bundle";
const V1922_NEWSGROUP_FILTER_ID = "onr_v1_045_newsgroup-filter";
const V1922_SHIELD_ID = "onr_v1_061_shield";
const V1922_JAPANESE_WATER_TORTURE_ID = "onr_v1_037_japanese-water-torture";
const V1922_CORPORATE_RETREAT_ID = "onr_v1_195_corporate-retreat";
const V1922_CORPORATE_WAR_ID = "onr_v1_196_corporate-war";
const V1922_MARINE_ARCOLOGY_ID = "onr_v1_206_marine-arcology";
const V1922_POLITICAL_OVERTHROW_ID = "onr_v1_210_political-overthrow";
const V1922_EDGERUNNER_TEMPS_ID = "onr_v1_289_edgerunner-inc-temps";
const V1922_OFF_SITE_BACKUPS_ID = "onr_v1_296_off-site-backups";
const V1922_PLANNING_CONSULTANTS_ID = "onr_v1_298_planning-consultants";
const AARDVARK_ID = "onr_v1_349_aardvark";
const BIZARRE_ENCRYPTION_SCHEME_ID = "onr_v1_351_bizarre-encryption-scheme";
const CHESTER_MIX_ID = "onr_v1_352_chester-mix";
const CHIMERA_ID = "onr_v1_353_chimera";
const MOUSE_ID = "onr_v1_042_mouse";
const SEEYA_ID = "onr_v1_058_seeya";
const SELF_MODIFYING_CODE_ID = "onr_v1_059_self-modifying-code";
const I_SPY_ID = "onr_v1_032_i-spy";
const AUJOURD_OUI_ID = "onr_v1_151_aujourdoui";
const NETO_ID = "onr_v1_169_n-e-t-o";
const RONIN_AROUND_ID = "onr_v1_175_ronin-around";
const THE_SHORT_CIRCUIT_ID = "onr_v1_177_the-short-circuit";
const CORPORATE_DOWNSIZING_ID = "onr_v1_194_corporate-downsizing";
const ICE_PICK_WILLIE_ID = "onr_v1_250_ice-pick-willie";
const TOO_MANY_DOORS_ID = "onr_v1_272_too-many-doors";
const DETROIT_POLICE_CONTRACT_ID = "onr_v1_198_detroit-police-contract";
const EMPLOYEE_EMPOWERMENT_ID = "onr_v1_199_employee-empowerment";
const POLYMER_BREAKTHROUGH_ID = "onr_v1_211_polymer-breakthrough";
const TERRORIST_REPRISAL_ID = "onr_v1_115_terrorist-reprisal";
const BANPEI_ID = "onr_v1_223_banpei";
const VACUUM_LINK_ID = "onr_v1_275_vacuum-link";
const DUPRE_ID = "onr_v1_020_dupre";
const EXPERT_SCHEDULE_ANALYZER_ID = "onr_v1_024_expert-schedule-analyzer";
const MICROTECH_AI_INTERFACE_ID = "onr_v1_041_microtech-ai-interface";
const MYSTERY_BOX_ID = "onr_v1_043_mystery-box";
const SHREDDER_UPLINK_PROTOCOL_ID = "onr_v1_062_shredder-uplink-protocol";
const SMARTEYE_ID = "onr_v1_065_smarteye";
const RECORD_RECONSTRUCTOR_ID = "onr_v1_142_record-reconstructor";

const RUNTIME_DAMAGE_PREVENTION_PROFILES: Record<
  string,
  RuntimeDamagePreventionProfile
> = {
  "onr_v1_023_evil-twin": {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 90,
  },
  "onr_v1_028_force-shield": {
    maxPerTurn: 2,
    damageTypes: ["net", "core"],
    priority: 100,
  },
  "onr_v1_038_joan-of-arc": {
    maxPerTurn: 1,
    damageTypes: ["net", "core"],
    priority: 120,
  },
  "onr_v1_121_armored-fridge": {
    maxPerTurn: 2,
    damageTypes: ["meat"],
    priority: 120,
  },
  "onr_v1_125_dermatech-bodyplating": {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 110,
  },
  "onr_v1_127_full-body-conversion": {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 121,
  },
  "onr_v1_128_green-knight-surge-buffers": {
    maxPerTurn: 2,
    damageTypes: ["net"],
    priority: 121,
  },
  "onr_v1_130_lifesaver-nanosurgeons": {
    maxPerTurn: 1,
    damageTypes: ["core"],
    priority: 121,
  },
  "onr_v1_135_nasuko-cycle": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 122,
  },
  "onr_v1_139_r-and-d-interface": {
    maxPerTurn: 1,
    damageTypes: ["net"],
    priority: 123,
  },
  "onr_v1_143_techtronica-utility-suit": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 124,
  },
  "onr_v1_155_code-viral-cache": {
    maxPerTurn: 1,
    damageTypes: ["net"],
    priority: 125,
  },
  "onr_v1_161_fall-guy": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 126,
  },
  "onr_v1_170_nomad-allies": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat"],
    priority: 127,
  },
  "onr_v1_185_trauma-team": {
    maxPerTurn: 2,
    damageTypes: ["meat"],
    priority: 128,
  },
  "onr_v1_186_umbrella-policy": {
    maxPerTurn: 1,
    damageTypes: ["net", "meat", "core"],
    priority: 129,
  },
  "onr_v1_187_wilson-weeflerunner-apprentice": {
    maxPerTurn: 1,
    damageTypes: ["meat"],
    priority: 130,
  },
  [V1922_SHIELD_ID]: { maxPerTurn: 2, damageTypes: ["net"], priority: 131 },
};

const RUNNER_EVENT_RESOLVERS: Record<string, RunnerEventResolver> = {
  simple_economy_event: {
    name: "runner_event_gain_credits_4",
    resolve: (state) => {
      state.runner.credits += 4;
    },
  },
  simple_draw_event: {
    name: "runner_event_draw_2",
    resolve: (state) => {
      drawRunnerCard(state);
      drawRunnerCard(state);
    },
  },
  simple_run_event: {
    name: "runner_event_run_success_2",
    requiresServer: true,
    resolve: (state, legalAction) => {
      startRun(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        2,
      );
    },
  },
  v08_burst_credit_event: {
    name: "runner_event_gain_credits_6",
    resolve: (state) => {
      state.runner.credits += 6;
    },
  },
  v08_deep_draw_event: {
    name: "runner_event_draw_3",
    resolve: (state) => {
      drawRunnerCard(state);
      drawRunnerCard(state);
      drawRunnerCard(state);
    },
  },
  v08_overclock_run_event: {
    name: "runner_event_run_success_3",
    requiresServer: true,
    resolve: (state, legalAction) => {
      startRun(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        3,
      );
    },
  },
  v097_deep_dive_event: {
    name: "runner_event_run_multiaccess_2",
    requiresServer: true,
    resolve: (state, legalAction) => {
      startRun(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        undefined,
        2,
      );
    },
  },
  v098_stack_search_event: {
    name: "runner_event_search_stack_program",
    canPlay: (state) =>
      state.runner.stack.some(
        (id) => definitionFor(state, id).type === "program",
      ),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "search_stack",
      };
    },
  },
  v098_stack_arrange_event: {
    name: "runner_event_arrange_stack_top_2",
    canPlay: (state) => state.runner.stack.length >= 2,
    resolve: (state, legalAction) => {
      startRunnerStackArrangeChoice(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "arrange_stack",
      };
    },
  },
  v098_reveal_top_event: {
    name: "runner_event_reveal_stack_top",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      revealRunnerStackTop(state, legalAction);
    },
  },
  v098_expose_event: {
    name: "runner_event_expose_unrezzed_server_card",
    requiresServer: true,
    canPlayForServer: (state, serverId) =>
      exposedCorpCardInServer(state, serverId) !== undefined,
    resolve: (state, legalAction) => {
      exposeCorpCardInServer(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        legalAction,
      );
    },
  },
  "onr_v1_116_total-genetic-retrofit": {
    name: "onr_v1914_runner_event_clear_visible_tag",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      const removedTags = state.runner.tags;
      state.runner.tags = 0;
      legalAction.payload = { ...(legalAction.payload ?? {}), removedTags };
    },
  },
  [V1921_PLAYFUL_AI_ID]: {
    name: "onr_v1921_runner_event_deterministic_die_probe",
    resolve: (state, legalAction) => {
      const randomPurpose = `v1921.die.${V1921_PLAYFUL_AI_ID}.event_probe`;
      const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1921RunnerEventAbility: "deterministic_die_probe",
        randomPurpose,
        v1921DieRoll: dieRoll,
        randomCounterAfter: state.randomCounter,
      };
    },
  },
  [V1922_ANONYMOUS_TIP_ID]: {
    name: "onr_v1922_runner_event_derez_black_ice",
    canPlay: (state) => rezzedBlackIceIds(state).length > 0,
    resolve: (state, legalAction) => {
      startV1922AnonymousTipChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "derez_black_ice",
      };
    },
  },
  [V1922_CORE_COMMAND_JETTISON_ICE_ID]: {
    name: "onr_v1922_runner_event_successful_hq_run_pay_rez_cost_trash_rezzed_ice",
    canPlay: (state) =>
      ensureRunnerTurnFlags(state).successfulHqRunThisTurn === true &&
      affordableRezzedInstalledIceIdsForRunner(state).length > 0,
    resolve: (state, legalAction) => {
      if (ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true)
        throw new Error(
          "Core Command: Jettison Ice benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
        );
      startV1922CoreCommandJettisonIceChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility:
          "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      };
    },
  },
  [V1922_FORGED_ACTIVATION_ORDERS_ID]: {
    name: "onr_v1922_runner_event_force_rez_or_trash_ice",
    canPlay: (state) => unrezzedInstalledIceIds(state).length > 0,
    resolve: (state, legalAction) => {
      startV1922ForgedActivationOrdersTargetChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
      };
    },
  },
  [V1922_IF_YOU_WANT_IT_DONE_RIGHT_ID]: {
    name: "onr_v1922_runner_event_stack_top5_choose_one_arrange_rest",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      startV1922RunnerStackTop5Choice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
      };
    },
  },
  [V1922_ORGAN_DONOR_ID]: {
    name: "onr_v1922_runner_event_trash_grip_gain_credits",
    canPlay: (state) => state.runner.grip.length > 1,
    resolve: (state, legalAction) => {
      startV1922RunnerGripTrashChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_runner_grip_trash_gain_credits",
      };
    },
  },
  [V1922_MISC_FOR_SALE_ID]: {
    name: "onr_v1922_runner_event_trash_installed_gain_credits",
    canPlay: (state) => runnerInstalledCardIds(state).length > 0,
    resolve: (state, legalAction) => {
      startV1922RunnerInstalledTrashChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_runner_installed_trash_gain_credits",
      };
    },
  },
  [V1922_OPEN_ENDED_MILEAGE_PROGRAM_ID]: {
    name: "onr_v1922_runner_event_remove_tag_optional_return",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      const removedTags = Math.min(1, state.runner.tags);
      state.runner.tags = Math.max(0, state.runner.tags - removedTags);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "remove_tag_optional_return",
        removedTags,
        runnerTagsAfter: state.runner.tags,
      };
      if (state.runner.credits > 0)
        startV1922OpenEndedMileageReturnChoice(
          state,
          String(legalAction.payload?.cardId ?? ""),
        );
    },
  },
  [V1922_SECURITY_CODE_WORM_CHIP_ID]: {
    name: "onr_v1922_runner_event_successful_hq_run_trash_unrezzed_ice",
    canPlay: (state) =>
      ensureRunnerTurnFlags(state).successfulHqRunThisTurn === true &&
      unrezzedInstalledIceIds(state).length > 0,
    resolve: (state, legalAction) => {
      if (ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true)
        throw new Error(
          "Security Code WORM Chip benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
        );
      startV1922SecurityCodeWormChipChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
      };
    },
  },
  [V1922_SYNCHRONIZED_ATTACK_ON_HQ_ID]: {
    name: "onr_v1922_runner_event_successful_hq_run_corp_pay_to_retain_hq",
    canPlay: (state) =>
      ensureRunnerTurnFlags(state).successfulHqRunThisTurn === true &&
      state.corp.hq.length > 0,
    resolve: (state, legalAction) => {
      if (ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true)
        throw new Error(
          "Synchronized Attack on HQ benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
        );
      startV1922SynchronizedAttackOnHqChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
      };
    },
  },
  [V1922_VALU_PAK_SOFTWARE_BUNDLE_ID]: {
    name: "onr_v1922_runner_event_program_install_action_bundle",
    canPlay: (state) => runnerInstallableProgramIdsForValuPak(state).length > 0,
    resolve: (state, legalAction) => {
      const installablePrograms = runnerInstallableProgramIdsForValuPak(state);
      if (installablePrograms.length === 0)
        throw new Error(
          "Valu-Pak Software Bundle findet kein installierbares Programm.",
        );
      const flags = ensureRunnerTurnFlags(state);
      flags.valuPakProgramInstallActionsRemaining = 5;
      flags.valuPakTemporaryProgramInstallCredits = 1;
      state.runner.clicks += 5;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "program_install_action_bundle",
        gainedActions: 5,
        temporaryProgramInstallCredits: 1,
        valuPakProgramInstallActionsRemaining:
          flags.valuPakProgramInstallActionsRemaining,
        runnerClicksAfter: state.runner.clicks,
      };
    },
  },
  "onr_v1_087_forgotten-backup-chip": {
    name: "onr_v1911_runner_event_search_stack_program_to_hand",
    canPlay: (state) =>
      state.runner.stack.some(
        (id) => definitionFor(state, id).type === "program",
      ),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1911_search_stack",
      };
    },
  },
  "onr_v1_088_fortress-respecification": {
    name: "onr_v1911_runner_event_expose_unrezzed_server_card",
    requiresServer: true,
    canPlayForServer: (state, serverId) =>
      exposedCorpCardInServer(state, serverId) !== undefined,
    resolve: (state, legalAction) => {
      exposeCorpCardInServer(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        legalAction,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneAction: "v1911_expose_server_card",
      };
    },
  },
  "onr_v1_089_gideons-pawnshop": {
    name: "onr_v1911_runner_event_search_stack_program_to_hand",
    canPlay: (state) =>
      state.runner.stack.some(
        (id) => definitionFor(state, id).type === "program",
      ),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1911_search_stack",
      };
    },
  },
  "onr_v1_092_ice-and-datas-guide-to-the-net": {
    name: "onr_v1911_runner_event_reveal_stack_top",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      revealRunnerStackTop(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneAction: "v1911_reveal_stack_top",
      };
    },
  },
  "onr_v1_099_mantis-fixer-at-large": {
    name: "onr_v1911_runner_event_search_stack_program_to_hand",
    canPlay: (state) =>
      state.runner.stack.some(
        (id) => definitionFor(state, id).type === "program",
      ),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1911_search_stack",
      };
    },
  },
  "onr_v1_110_sneak-preview": {
    name: "onr_v1911_runner_event_reveal_stack_top",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      revealRunnerStackTop(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneAction: "v1911_reveal_stack_top",
      };
    },
  },
  "onr_v1_082_deal-with-militech": {
    name: "onr_v1912_runner_event_search_stack_program_to_hand",
    canPlay: (state) =>
      state.runner.stack.some(
        (id) => definitionFor(state, id).type === "program",
      ),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(
        state,
        "v1912.search_stack",
        "v1912_search_stack",
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1912_search_stack",
      };
    },
  },
  "onr_v1_091_hunt-club-bbs": {
    name: "onr_v1912_runner_event_reveal_stack_top",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      revealRunnerStackTop(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneAction: "v1912_reveal_stack_top",
      };
    },
  },
  "onr_v1_079_bodyweight-synthetic-blood": {
    name: "onr_runner_event_draw_5",
    resolve: (state) => {
      drawRunnerCards(state, 5);
    },
  },
  "onr_v1_095_jack-n-joe": {
    name: "onr_runner_event_draw_3",
    resolve: (state) => {
      drawRunnerCards(state, 3);
    },
  },
  "onr_v1_097_livewires-contacts": {
    name: "onr_runner_event_gain_credits_3",
    resolve: (state) => {
      state.runner.credits += 3;
    },
  },
  onr_v1_108_score: {
    name: "onr_runner_event_gain_credits_9",
    resolve: (state) => {
      state.runner.credits += 9;
    },
  },
  [TERRORIST_REPRISAL_ID]: {
    name: "onr_runner_event_terrorist_reprisal_hq_random_discard",
    canPlay: (state) => corpScoredBlackOpsAgendaLastTurn(state),
    resolve: (state, legalAction) => {
      if (!corpScoredBlackOpsAgendaLastTurn(state)) {
        throw new Error(
          "Die Korp hat im letzten Korp-Zug keine Black Ops Agenda gescored.",
        );
      }
      const discardedCardIds = discardRandomCorpHqCards(
        state,
        5,
        `v190.random.${TERRORIST_REPRISAL_ID}.hq_discard`,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "hq_random_discard",
        discardedCardsCount: discardedCardIds.length,
      };
    },
  },
  [ALL_NIGHTER_ID]: {
    name: "onr_runner_event_all_nighter_bonus_run",
    requiresServer: true,
    resolve: (state, legalAction) => {
      const serverId = String(legalAction.payload?.serverId) as Exclude<
        ServerId,
        "new_remote"
      >;
      startRun(state, serverId, undefined, 1, {
        grantAllNighterBonusRunOnFinish: true,
      });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId,
        allNighterBonusRunOnFinish: true,
      };
    },
  },
  "onr_v1_081_custodial-position": {
    name: "onr_runner_event_run_rd_multiaccess_3",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "rd",
    resolve: (state, legalAction) => {
      startRun(state, "rd", undefined, 3);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "rd",
        accessCount: 3,
      };
    },
  },
  "onr_v1_083_desperate-competitor": {
    name: "onr_runner_event_desperate_competitor",
    canPlay: (state) => runnerStoleAgendaSubtypeThisTurn(state, "gray_ops"),
    resolve: (state, legalAction) => {
      if (!runnerStoleAgendaSubtypeThisTurn(state, "gray_ops")) {
        throw new Error(
          "Im aktuellen Runner-Zug wurde keine Gray Ops Agenda gestohlen.",
        );
      }
      awardRunnerEventAgendaPoint(
        state,
        legalAction,
        "onr_v1_083_desperate-competitor",
      );
    },
  },
  "onr_v1_085_executive-wiretaps": {
    name: "onr_runner_event_run_hq_multiaccess_3",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(state, "hq", undefined, 3);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "hq",
        accessCount: 3,
      };
    },
  },
  "onr_v1_090_hot-tip-for-wns": {
    name: "onr_runner_event_hot_tip_for_wns",
    canPlay: (state) => runnerStoleAgendaSubtypeThisTurn(state, "black_ops"),
    resolve: (state, legalAction) => {
      if (!runnerStoleAgendaSubtypeThisTurn(state, "black_ops")) {
        throw new Error(
          "Im aktuellen Runner-Zug wurde keine Black Ops Agenda gestohlen.",
        );
      }
      awardRunnerEventAgendaPoint(
        state,
        legalAction,
        "onr_v1_090_hot-tip-for-wns",
      );
    },
  },
  "onr_v1_094_inside-job": {
    name: "onr_runner_event_inside_job",
    requiresServer: true,
    resolve: (state, legalAction) => {
      const serverId = String(legalAction.payload?.serverId) as Exclude<
        ServerId,
        "new_remote"
      >;
      startRun(state, serverId, undefined, 1, {
        bypassFirstIceRemaining: true,
      });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId,
        bypassFirstIce: true,
      };
    },
  },
  [KILROY_WAS_HERE_ID]: {
    name: "onr_runner_event_kilroy_was_here_free_trash_rd",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "rd",
    resolve: (state, legalAction) => {
      startRun(state, "rd", undefined, 1, { freeTrashAccessZones: ["rd"] });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "rd",
        freeTrashAccessZones: "rd",
      };
    },
  },
  "onr_v1_084_edited-shipping-manifests": {
    name: "onr_runner_event_hq_access_replace_corp_lose1_tag_draw",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(state, "hq", undefined, 1, {
        successfulRunAccessReplacement: "corp_lose_credits",
        successfulRunCreditLoss: 1,
        successfulRunRunnerTagGain: 1,
        successfulRunCorpDraw: 1,
      });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "hq",
        hiddenZoneBarrier: true,
        accessReplacement: "corp_lose_credits_runner_tag_corp_draw",
      };
    },
  },
  "onr_v1_106_private-ldl-access": {
    name: "onr_runner_event_hq_run_access_rd",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(state, "hq", undefined, 1, { accessServerOverride: "rd" });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "hq",
        hiddenZoneBarrier: true,
        accessServerOverride: "rd",
      };
    },
  },
  "onr_v1_114_temple-microcode-outlet": {
    name: "onr_runner_event_search_stack_program_to_hand",
    canPlay: (state) =>
      state.runner.stack.some(
        (id) => definitionFor(state, id).type === "program",
      ),
    resolve: (state, legalAction) => {
      startRunnerStackSearchChoice(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "search_stack",
      };
    },
  },
  "onr_v1_118_weather-to-finance-pipe": {
    name: "onr_runner_event_hq_access_replace_corp_lose4",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(state, "hq", undefined, 1, {
        successfulRunAccessReplacement: "corp_lose_credits",
        successfulRunCreditLoss: 4,
      });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "hq",
        hiddenZoneBarrier: true,
        accessReplacement: "corp_lose_credits",
      };
    },
  },
  "onr_v1_101_mit-west-tier": {
    name: "onr_runner_event_mit_west_tier",
    resolve: (state, legalAction) => {
      resolveMitWestTier(state, legalAction);
    },
  },
  [ROMP_THROUGH_HQ_ID]: {
    name: "onr_runner_event_romp_through_hq_free_trash_hq",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(state, "hq", undefined, 1, { freeTrashAccessZones: ["hq"] });
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "hq",
        freeTrashAccessZones: "hq",
      };
    },
  },
  "onr_v1_098_lucidrine-booster-drug": {
    name: "onr_v1915_runner_event_run_with_replacement_overlap",
    requiresServer: true,
    resolve: (state, legalAction) => {
      const serverId = String(legalAction.payload?.serverId) as Exclude<
        ServerId,
        "new_remote"
      >;
      startRun(state, serverId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId,
        eventModificationOverlap: true,
      };
    },
  },
  "onr_v1_105_priority-wreck": {
    name: "onr_v1915_runner_event_run_multiaccess_2",
    requiresServer: true,
    resolve: (state, legalAction) => {
      const serverId = String(legalAction.payload?.serverId) as Exclude<
        ServerId,
        "new_remote"
      >;
      startRun(state, serverId, undefined, 2);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId,
        accessCount: 2,
      };
    },
  },
  "onr_v1_111_social-engineering": {
    name: "onr_v1915_runner_event_run_access_pressure",
    requiresServer: true,
    resolve: (state, legalAction) => {
      const serverId = String(legalAction.payload?.serverId) as Exclude<
        ServerId,
        "new_remote"
      >;
      startRun(state, serverId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId,
        socialEngineeringRun: true,
      };
    },
  },
  "onr_v1_112_stumble-through-wilderspace": {
    name: "onr_v1915_runner_event_trace_aware_run_access",
    requiresServer: true,
    resolve: (state, legalAction) => {
      const serverId = String(legalAction.payload?.serverId) as Exclude<
        ServerId,
        "new_remote"
      >;
      startRun(state, serverId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId,
        traceAwareRun: true,
      };
    },
  },
  [V1919_ARASAKA_OWNS_YOU_ID]: {
    name: "onr_v1919_runner_event_forfeit_agenda_remove_tags",
    canPlay: (state) =>
      state.runner.tags > 0 &&
      pickRunnerAgendaForAgendaPointCost(state) !== undefined,
    resolve: (state, legalAction) => {
      if (state.runner.tags <= 0)
        throw new Error("Arasaka Owns You benoetigt einen getaggten Runner.");
      const forfeitAgendaCardId = pickRunnerAgendaForAgendaPointCost(state);
      if (!forfeitAgendaCardId)
        throw new Error(
          "Arasaka Owns You benoetigt eine Runner-Agenda als Kosten.",
        );
      const removedTags = state.runner.tags;
      forfeitRunnerAgendaForPointCost(state, forfeitAgendaCardId);
      state.runner.tags = 0;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919RunnerEventAbility: "forfeit_agenda_remove_tags",
        forfeitAgendaCardId,
        agendaPointCostPaid: 1,
        removedTags,
        runnerTagsAfter: state.runner.tags,
        specialZone: "removed_from_game",
        specialZoneVisibility: "public",
        specialZoneReason: "v1919_arasaka_owns_you",
      };
    },
  },
};

const CORP_OPERATION_RESOLVERS: Record<string, CorpOperationResolver> = {
  simple_economy_operation: {
    name: "corp_operation_gain_credits_4",
    resolve: (state) => {
      state.corp.credits += 4;
    },
  },
  v111_core_damage_operation: {
    name: "corp_operation_core_damage_1",
    resolve: (state, legalAction) => {
      resolveDamageOperation(
        state,
        legalAction,
        "core",
        1,
        "v111_core_damage_operation",
      );
    },
  },
  simple_draw_operation: {
    name: "corp_operation_draw_2",
    resolve: (state) => {
      drawCorpCard(state);
      drawCorpCard(state);
    },
  },
  simple_tag_punishment_operation: {
    name: "corp_operation_tag_punishment_lose_2",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      if (state.runner.tags <= 0)
        throw new Error("Der Runner ist nicht getaggt.");
      state.runner.credits = Math.max(0, state.runner.credits - 2);
    },
  },
  v08_credit_surge_operation: {
    name: "corp_operation_gain_credits_7",
    resolve: (state) => {
      state.corp.credits += 7;
    },
  },
  v08_archive_planning_operation: {
    name: "corp_operation_draw_3",
    resolve: (state) => {
      drawCorpCard(state);
      drawCorpCard(state);
      drawCorpCard(state);
    },
  },
  v098_hq_rd_swap_operation: {
    name: "corp_operation_swap_hq_rd",
    canPlay: (state) => state.corp.hq.length > 1 && state.corp.rd.length > 0,
    resolve: (state) => {
      swapCorpHqAndRdTop(state);
    },
  },
  v099_bad_publicity_operation: {
    name: "corp_operation_bad_publicity_credit",
    resolve: (state) => {
      state.corp.credits += 3;
      state.corp.badPublicity += 1;
    },
  },
  "onr_v1_281_accounts-receivable": {
    name: "onr_corp_operation_gain_credits_9",
    resolve: (state) => {
      state.corp.credits += 9;
    },
  },
  "onr_v1_282_annual-reviews": {
    name: "onr_corp_operation_draw_3",
    resolve: (state) => {
      drawCorpCards(state, 3);
    },
  },
  "onr_v1_283_audit-of-call-records": {
    name: "onr_corp_operation_trace_5_after_two_run_attempts",
    canPlay: (state) => runnerRunAttemptsLastTurn(state) >= 2,
    resolve: (state, legalAction) => {
      if (runnerRunAttemptsLastTurn(state) < 2)
        throw new Error(
          "Der Runner hat im letzten Zug nicht mindestens zwei Runs versucht.",
        );
      startTraceFromOperation(
        state,
        "onr_v1_283_audit-of-call-records",
        5,
        legalAction,
      );
    },
  },
  "onr_v1_284_chance-observation": {
    name: "onr_corp_operation_trace_5_after_run_attempt",
    canPlay: (state) => runnerRunAttemptsLastTurn(state) >= 1,
    resolve: (state, legalAction) => {
      if (runnerRunAttemptsLastTurn(state) < 1)
        throw new Error("Der Runner hat im letzten Zug keinen Run versucht.");
      startTraceFromOperation(
        state,
        "onr_v1_284_chance-observation",
        5,
        legalAction,
      );
    },
  },
  "onr_v1_285_closed-accounts": {
    name: "onr_corp_operation_closed_accounts",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      requireRunnerTagged(state);
      state.runner.credits = 0;
    },
  },
  "onr_v1_286_corporate-detective-agency": {
    name: "onr_corp_operation_trash_two_runner_resources",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      const targetIds = state.runner.rig.resources.slice().sort().slice(0, 2);
      for (const cardId of targetIds) {
        if (!state.runner.rig.resources.includes(cardId)) continue;
        trashRunnerInstalledCardToHeap(state, cardId);
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        trashedResourceCount: targetIds.length,
        trashedResourceIds: targetIds.join(","),
      };
    },
  },
  "onr_v1_287_datapool-by-zetatech": {
    name: "onr_corp_operation_give_two_tags",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      requireRunnerTagged(state);
      state.runner.tags += 2;
    },
  },
  "onr_v1_299_power-grid-overload": {
    name: "onr_corp_operation_tagged_runner_trash_hardware",
    canPlay: (state) =>
      state.runner.tags > 0 && state.runner.rig.hardware.length > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      const targetHardwareId = state.runner.rig.hardware
        .slice()
        .sort((left, right) => {
          const leftDefinition = definitionFor(state, left);
          const rightDefinition = definitionFor(state, right);
          const byInstallCost =
            (rightDefinition.installCost ?? 0) -
            (leftDefinition.installCost ?? 0);
          if (byInstallCost !== 0) return byInstallCost;
          return left.localeCompare(right);
        })[0];
      if (!targetHardwareId)
        throw new Error("Der Runner hat keine installierte Hardware.");
      trashRunnerInstalledCardToHeap(state, targetHardwareId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        trashedHardwareId: targetHardwareId,
        trashedHardwareDefinitionId: definitionFor(state, targetHardwareId).id,
      };
    },
  },
  "onr_v1_288_day-shift": {
    name: "onr_corp_operation_draw_2_gain_1",
    resolve: (state) => {
      drawCorpCards(state, 2);
      state.corp.credits += 1;
    },
  },
  "onr_v1_290_efficiency-experts": {
    name: "onr_corp_operation_gain_credits_3",
    resolve: (state) => {
      state.corp.credits += 3;
    },
  },
  [V1922_OFF_SITE_BACKUPS_ID]: {
    name: "onr_v1922_corp_operation_private_archives_to_hq",
    canPlay: (state) => state.corp.archives.length > 0,
    resolve: (state, legalAction) => {
      const sourceCardId = String(legalAction.payload?.cardId ?? "");
      if (
        !sourceCardId ||
        definitionFor(state, sourceCardId).id !== V1922_OFF_SITE_BACKUPS_ID
      )
        throw new Error("Off-Site Backups fehlt als Quelle.");
      startV1922CorpArchivesToHqChoice(state, sourceCardId, legalAction);
    },
  },
  [V1922_PLANNING_CONSULTANTS_ID]: {
    name: "onr_v1922_corp_operation_private_rd_top5_reorder",
    canPlay: (state) => state.corp.rd.length >= 2,
    resolve: (state, legalAction) => {
      const sourceCardId = String(legalAction.payload?.cardId ?? "");
      if (
        !sourceCardId ||
        definitionFor(state, sourceCardId).id !== V1922_PLANNING_CONSULTANTS_ID
      )
        throw new Error("Planning Consultants fehlt als Quelle.");
      startV1922CorpRdTopReorderChoice(state, sourceCardId, legalAction);
    },
  },
  [V1922_EDGERUNNER_TEMPS_ID]: {
    name: "onr_v1922_corp_operation_install_action_bundle",
    canPlay: (state) =>
      state.corp.hq.some((cardId) =>
        isCorpInstallableCardType(definitionFor(state, cardId)),
      ),
    resolve: (state, legalAction) => {
      if (
        !state.corp.hq.some((cardId) =>
          isCorpInstallableCardType(definitionFor(state, cardId)),
        )
      ) {
        throw new Error(
          "Edgerunner, Inc., Temps findet keine installierbare Korp-Karte.",
        );
      }
      const flags = ensureCorpTurnFlags(state);
      flags.edgerunnerTempsInstallActionsRemaining = 3;
      state.corp.clicks += 3;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922CorpOperationAbility: "install_action_bundle",
        gainedActions: 3,
        edgerunnerTempsInstallActionsRemaining:
          flags.edgerunnerTempsInstallActionsRemaining,
        corpClicksAfter: state.corp.clicks,
      };
    },
  },
  "onr_v1_293_netwatch-credit-voucher": {
    name: "onr_corp_operation_tag_runner_gain_1",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state) => {
      requireRunnerTagged(state);
      state.runner.tags += 1;
      state.corp.credits += 1;
    },
  },
  "onr_v1_295_night-shift": {
    name: "onr_corp_operation_gain_2_draw_1",
    resolve: (state) => {
      state.corp.credits += 2;
      drawCorpCard(state);
    },
  },
  "onr_v1_301_punitive-counterstrike": {
    name: "onr_corp_operation_meat_damage_2",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      resolveDamageOperation(
        state,
        legalAction,
        "meat",
        2,
        "onr_v1_301_punitive-counterstrike",
      );
    },
  },
  "onr_v1_302_scorched-earth": {
    name: "onr_corp_operation_meat_damage_4",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      resolveDamageOperation(
        state,
        legalAction,
        "meat",
        4,
        "onr_v1_302_scorched-earth",
      );
    },
  },
  "onr_v1_306_trojan-horse": {
    name: "onr_corp_operation_trojan_horse_tag",
    canPlay: (state) => runnerStoleAgendaLastTurn(state),
    resolve: (state) => {
      if (!runnerStoleAgendaLastTurn(state))
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      state.runner.tags += 1;
    },
  },
  "onr_v1_307_urban-renewal": {
    name: "onr_corp_operation_meat_damage_5",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      resolveDamageOperation(
        state,
        legalAction,
        "meat",
        5,
        "onr_v1_307_urban-renewal",
      );
    },
  },
  "onr_v1_297_overtime-incentives": {
    name: "onr_corp_operation_gain_two_actions",
    resolve: (state, legalAction) => {
      state.corp.clicks += 2;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedActions: 2,
        corpClicksAfter: state.corp.clicks,
      };
    },
  },
  "onr_v1_294_new-blood": {
    name: "onr_v1915_corp_operation_run_pressure_credit",
    canPlay: (state) => runnerRunAttemptsLastTurn(state) >= 1,
    resolve: (state, legalAction) => {
      if (runnerRunAttemptsLastTurn(state) < 1)
        throw new Error("Der Runner hat im letzten Zug keinen Run versucht.");
      state.corp.credits += 3;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runnerRunAttemptsLastTurn: runnerRunAttemptsLastTurn(state),
        recurringPressureCredits: 3,
      };
    },
  },
  [V1919_FALSIFIED_TRANSACTIONS_EXPERT_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (state) => v1919CorpAgendaCounterTarget(state) !== undefined,
    resolve: (state, legalAction) =>
      resolveV1919CounterOperation(
        state,
        legalAction,
        V1919_FALSIFIED_TRANSACTIONS_EXPERT_ID,
      ),
  },
  [V1919_MANAGEMENT_SHAKE_UP_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (state) => v1919CorpAgendaCounterTarget(state) !== undefined,
    resolve: (state, legalAction) =>
      resolveV1919CounterOperation(
        state,
        legalAction,
        V1919_MANAGEMENT_SHAKE_UP_ID,
      ),
  },
  [V1919_PROJECT_CONSULTANTS_ID]: {
    name: "onr_v1919_corp_operation_advance_installed_agenda",
    canPlay: (state) => v1919InstalledAgendaTarget(state) !== undefined,
    resolve: (state, legalAction) => {
      const targetAgendaId = v1919InstalledAgendaTarget(state);
      if (!targetAgendaId)
        throw new Error(
          "Project Consultants findet keine installierte Agenda.",
        );
      mustInstance(state.cardInstances, targetAgendaId).advancementCounters +=
        1;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919OperationAbility: "advance_installed_agenda",
        targetCardId: targetAgendaId,
        targetCardDefinitionId: definitionFor(state, targetAgendaId).id,
        addedAdvancementCounters: 1,
        advancementCountersAfter: mustInstance(
          state.cardInstances,
          targetAgendaId,
        ).advancementCounters,
      };
    },
  },
  [V1919_SILVER_LINING_RECOVERY_PROTOCOL_ID]: {
    name: "onr_v1919_corp_operation_gain_credits_3",
    resolve: (state, legalAction) => {
      credits(state, "corp", 3);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919OperationAbility: "gain_credits",
        gainedCredits: 3,
        corpCreditsAfter: state.corp.credits,
      };
    },
  },
  [V1919_SYSTEMATIC_LAYOFFS_ID]: {
    name: "onr_v1919_corp_operation_forfeit_scored_agenda",
    canPlay: (state) => v1919CorpScoredAgendaForfeitTarget(state) !== undefined,
    resolve: (state, legalAction) => {
      const targetAgendaId = v1919CorpScoredAgendaForfeitTarget(state);
      if (!targetAgendaId)
        throw new Error(
          "Systematic Layoffs findet keine gescorte Korp-Agenda.",
        );
      const agendaPointValue = agendaPointsForScoredCard(state, targetAgendaId);
      forfeitCorpAgendaForPointCost(state, targetAgendaId);
      credits(state, "corp", Math.max(1, agendaPointValue));
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919OperationAbility: "forfeit_scored_agenda",
        forfeitedAgendaCardId: targetAgendaId,
        agendaPointCostPaid: agendaPointValue,
        gainedCredits: Math.max(1, agendaPointValue),
        corpCreditsAfter: state.corp.credits,
        specialZone: "removed_from_game",
        specialZoneVisibility: "public",
        specialZoneReason: "v1919_systematic_layoffs",
      };
    },
  },
  [V1919_TEAM_RESTRUCTURING_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (state) => v1919CorpAgendaCounterTarget(state) !== undefined,
    resolve: (state, legalAction) =>
      resolveV1919CounterOperation(
        state,
        legalAction,
        V1919_TEAM_RESTRUCTURING_ID,
      ),
  },
};

const CORP_ROOT_REZ_RESOLVERS: Record<string, CorpRootRezResolver> = {
  simple_economy_asset: {
    name: "corp_asset_rez_gain_3",
    resolve: (state) => {
      state.corp.credits += 3;
    },
  },
  v08_cashout_asset: {
    name: "corp_asset_rez_gain_4",
    resolve: (state) => {
      state.corp.credits += 4;
    },
  },
  [ACME_SAVINGS_AND_LOAN_ID]: {
    name: "corp_asset_acme_rez_gain_3",
    resolve: (state) => {
      state.corp.credits += 3;
    },
  },
};

export function createGame(config: CreateGameConfig = {}): GameState {
  const seed = config.seed ?? "mvp-0.1-default-seed";
  const random = { counter: 0, records: [] as GameState["randomDrawRecords"] };
  const instances: Record<CardInstanceId, CardInstance> = {};
  const runnerDeckId = config.runnerDeckId ?? "demo_runner_001";
  const corpDeckId = config.corpDeckId ?? "demo_corp_001";
  const runnerDeckDefinition = config.runnerDeck ?? DEMO_DECKS[runnerDeckId];
  const corpDeckDefinition = config.corpDeck ?? DEMO_DECKS[corpDeckId];
  const cardPoolVersion = cardPoolVersionForDecks(
    runnerDeckDefinition,
    corpDeckDefinition,
  );
  const runnerDeckMetadata =
    config.runnerDeckMetadata ??
    metadataForDeck(runnerDeckDefinition, cardPoolVersion);
  const corpDeckMetadata =
    config.corpDeckMetadata ??
    metadataForDeck(corpDeckDefinition, cardPoolVersion);

  const runnerIdentity = createInstance(
    "runner",
    runnerDeckDefinition.identity,
    0,
    {
      side: "runner",
      zone: "rig",
    },
  );
  const corpIdentity = createInstance("corp", corpDeckDefinition.identity, 0, {
    side: "corp",
    zone: "scoreArea",
  });
  instances[runnerIdentity.instanceId] = runnerIdentity;
  instances[corpIdentity.instanceId] = corpIdentity;

  const runnerDeck = expandDeck(
    "runner",
    runnerDeckDefinition.cards,
    instances,
  );
  const corpDeck = expandDeck("corp", corpDeckDefinition.cards, instances);

  const runnerStack = shuffleIds(
    runnerDeck,
    seed,
    "setup.shuffle.runner.start_stack",
    random,
  );
  const corpRd = shuffleIds(
    corpDeck,
    seed,
    "setup.shuffle.corp.start_rnd",
    random,
  );
  const runnerGrip = runnerStack.splice(0, INITIAL_HAND_SIZE);
  const corpHq = corpRd.splice(0, INITIAL_HAND_SIZE);
  recordRandomMarkers(
    seed,
    "setup.draw.runner.initial_hand",
    runnerGrip.length,
    random,
  );
  recordRandomMarkers(
    seed,
    "setup.draw.corp.initial_hand",
    corpHq.length,
    random,
  );

  for (const id of runnerGrip)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "runner", zone: "grip" },
    };
  for (const id of runnerStack)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "runner", zone: "stack" },
    };
  for (const id of corpHq)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "corp", zone: "hq" },
    };
  for (const id of corpRd)
    instances[id] = {
      ...mustInstance(instances, id),
      zone: { side: "corp", zone: "rd" },
    };

  const state: GameState = {
    matchId: config.matchId ?? "local-demo-match",
    baseline: config.baseline ?? baselineForCardPoolVersion(cardPoolVersion),
    stateVersion: 0,
    seed,
    randomCounter: random.counter,
    randomDrawRecords: random.records,
    activeSide: config.setupMode === "completed" ? "corp" : "runner",
    phase: config.setupMode === "completed" ? "corp_draw_phase" : "setup",
    timingPoint:
      config.setupMode === "completed"
        ? "corp_draw.mandatory_draw"
        : "setup.mulligan.runner",
    corp: {
      identity: corpIdentity.instanceId,
      credits: 5,
      clicks: 3,
      maxHandSize: BASE_MAX_HAND_SIZE,
      badPublicity: 0,
      hq: corpHq,
      rd: corpRd,
      archives: [],
      scoreArea: [],
      servers: [
        { id: "hq", kind: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", kind: "rd", label: "R&D", ice: [], root: [] },
        {
          id: "archives",
          kind: "archives",
          label: "Archives",
          ice: [],
          root: [],
        },
      ],
    },
    runner: {
      identity: runnerIdentity.instanceId,
      credits: 5,
      clicks: 0,
      maxHandSize: BASE_MAX_HAND_SIZE,
      coreDamage: 0,
      tags: 0,
      memoryUsed: 0,
      memoryLimit: 4,
      grip: runnerGrip,
      stack: runnerStack,
      heap: [],
      scoreArea: [],
      rig: { programs: [], hardware: [], resources: [] },
    },
    specialZones: { setAside: [], removedFromGame: [] },
    cardInstances: instances,
    eventLog: [],
    winner: null,
    agendaPointsToWin:
      config.agendaPointsToWin ?? STANDARD_AGENDA_POINTS_TO_WIN,
    setup:
      config.setupMode === "completed"
        ? {
            status: "complete",
            initialHandSize: INITIAL_HAND_SIZE,
            resolved: { runner: "keep", corp: "keep" },
            mulligansTaken: {},
          }
        : {
            status: "mulligan_runner",
            initialHandSize: INITIAL_HAND_SIZE,
            resolved: {},
            mulligansTaken: {},
          },
    deckMetadata: {
      runner: runnerDeckMetadata,
      corp: corpDeckMetadata,
    },
    runnerTurnFlags: {
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: false,
      stoleGrayOpsAgendaThisTurn: false,
      stoleBlackOpsAgendaThisTurn: false,
      runAttemptsThisTurn: 0,
      runAttemptsLastTurn: 0,
      damagePreventionUsage: {},
    },
    corpTurnFlags: {
      scoredBlackOpsAgendaThisTurn: false,
      scoredBlackOpsAgendaLastTurn: false,
    },
  };

  applyIdentityStaticModifiers(state);
  applyIdentitySetupAbilities(state);
  if (config.setupMode !== "completed")
    state.pendingChoice = setupMulliganChoice(state, "runner");

  const initialHash = hashState(state);
  state.eventLog.push({
    eventId: "evt_0",
    type: "game_created",
    stateVersionBefore: 0,
    stateVersionAfter: 0,
    stateHashAfter: initialHash,
    publicPayload: {
      baseline: state.baseline,
      runnerDeckId: runnerDeckDefinition.id,
      corpDeckId: corpDeckDefinition.id,
      runnerDeck: runnerDeckMetadata,
      corpDeck: corpDeckMetadata,
      agendaPointsToWin: state.agendaPointsToWin,
      ...(state.setup ? { setupStatus: state.setup.status } : {}),
    },
  });

  return state;
}

export function createGameAfterSetup(config: CreateGameConfig = {}): GameState {
  return createGame({ ...config, setupMode: "completed" });
}

export function getLegalActions(state: GameState, side: Side): LegalAction[] {
  if (state.winner || state.phase === "game_over") return [];
  if (state.pendingChoice)
    return side === state.pendingChoice.side
      ? [choiceAction(state, state.pendingChoice)]
      : [];
  if (side !== state.activeSide && state.timingPoint !== "run.approach_ice")
    return [];

  if (state.timingPoint === "corp_draw.mandatory_draw") {
    return side === "corp"
      ? [
          action(
            state,
            "corp",
            "mandatory_draw",
            "Korp Pflichtkarte ziehen",
            "game_rule",
          ),
        ]
      : [];
  }

  if (state.timingPoint === "corp_action.main")
    return side === "corp" ? corpMainActions(state) : [];
  if (state.timingPoint === "runner_action.main")
    return side === "runner" ? runnerMainActions(state) : [];
  if (state.timingPoint === "run.approach_ice")
    return side === "corp" ? corpApproachActions(state) : [];
  if (state.timingPoint === "run.encounter_ice")
    return side === "runner" ? runnerEncounterActions(state) : [];
  if (state.timingPoint === "run.jack_out_window")
    return side === "runner" ? runnerMovementActions(state) : [];
  if (state.timingPoint === "access.resolve_card")
    return side === "runner" ? runnerAccessActions(state) : [];
  return [];
}

export function applyAction(
  state: GameState,
  playerAction: PlayerAction,
): EngineResult {
  if (playerAction.matchId !== state.matchId) {
    return fail(
      state,
      "ERR_INVALID_TARGET",
      "Diese Aktion gehört nicht zu diesem Spiel.",
    );
  }
  if (playerAction.clientKnownStateVersion !== state.stateVersion) {
    return fail(
      state,
      "ERR_STALE_STATE",
      "Der Spielzustand ist veraltet. Bitte aktualisiere die Ansicht.",
    );
  }

  const legalActions = getLegalActions(state, playerAction.side);
  const legalAction = legalActions.find(
    (candidate) => candidate.actionId === playerAction.actionId,
  );
  if (!legalAction) {
    return fail(
      state,
      playerAction.side === state.activeSide
        ? "ERR_UNKNOWN_ACTION"
        : "ERR_WRONG_SIDE",
      "Diese Aktion ist im aktuellen Fenster nicht legal.",
    );
  }

  const choiceError = validateChoiceAction(
    state.pendingChoice,
    legalAction,
    playerAction,
  );
  if (choiceError) return fail(state, "ERR_INVALID_CHOICE", choiceError);

  const next = cloneState(state);
  const before = state.stateVersion;

  try {
    performAction(next, legalAction, playerAction);
    checkWinConditions(next);
    next.stateVersion = before + 1;
    const validation = validateGameState(next);
    if (!validation.ok) {
      return fail(
        state,
        "ERR_INVARIANT_FAILED",
        `Der Spielzustand ist ungültig: ${validation.errors[0] ?? "unbekannter Fehler"}`,
      );
    }
  } catch (error) {
    return fail(
      state,
      "ERR_INVALID_TARGET",
      error instanceof Error
        ? error.message
        : "Die Aktion konnte nicht ausgeführt werden.",
    );
  }

  const stateHash = hashState(next);
  const event = buildEvent(
    before,
    next.stateVersion,
    stateHash,
    state,
    next,
    legalAction,
    playerAction,
  );
  next.eventLog.push(event);

  return {
    ok: true,
    state: next,
    event,
    publicEvents: next.eventLog.map(toPublicEvent),
    stateHash,
  };
}

export function getPlayerView(state: GameState, side: Side): PlayerView {
  const own = side === "runner" ? state.runner : state.corp;
  const opponent = side === "runner" ? state.corp : state.runner;
  const runnerSide = side === "runner";
  const visibleServers = state.corp.servers.map((server) => ({
    id: server.id,
    label: server.label,
    ice: server.ice.map((id) => visibleCorpCard(state, id, side, "ice")),
    root:
      server.id === "archives"
        ? visibleCorpArchives(state, side)
        : server.root.map((id) => visibleCorpCard(state, id, side, "root")),
  }));

  const run = state.run
    ? {
        attackedServerId: state.run.attackedServerId,
        phase: state.run.phase,
        ...(state.run.encounteredIceId
          ? {
              encounteredIce: visibleCorpCard(
                state,
                state.run.encounteredIceId,
                side,
                "ice",
              ),
            }
          : {}),
        ...(state.run.accessedCardId
          ? {
              accessedCard: visibleCorpCard(
                state,
                state.run.accessedCardId,
                side,
                "root",
              ),
            }
          : {}),
        ...(state.run.breach
          ? {
              breach: {
                breachId: state.run.breach.breachId,
                serverId: state.run.breach.serverId,
                currentIndex: state.run.breach.currentIndex,
                remainingCount: state.run.breach.queue.filter(
                  (entry) => entry.status === "pending",
                ).length,
                completed: state.run.breach.completed,
              },
            }
          : {}),
        ...(state.run.badPublicityCredits !== undefined
          ? { badPublicityCredits: state.run.badPublicityCredits }
          : {}),
        successful: state.run.successful,
      }
    : undefined;

  return {
    side,
    stateVersion: state.stateVersion,
    timingPoint: state.timingPoint,
    activeSide: state.activeSide,
    phase: state.phase,
    own: runnerSide
      ? {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          gripOrHq: state.runner.grip.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.runner.stack.length,
          heapOrArchives: state.runner.heap.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.runner.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          rig: [
            ...state.runner.rig.programs,
            ...state.runner.rig.hardware,
            ...state.runner.rig.resources,
          ].map((id) => visibleOwnCard(state, id)),
          memoryUsed: state.runner.memoryUsed,
          memoryLimit: state.runner.memoryLimit,
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          tags: state.runner.tags,
        }
      : {
          identity: visibleOwnCard(state, state.corp.identity),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          gripOrHq: state.corp.hq.map((id) => visibleOwnCard(state, id)),
          stackOrRdCount: state.corp.rd.length,
          heapOrArchives: state.corp.archives.map((id) =>
            visibleOwnCard(state, id),
          ),
          scoreArea: state.corp.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          maxHandSize: maxHandSize(state, "corp"),
          tags: state.runner.tags,
        },
    opponent: runnerSide
      ? {
          identity: visibleOwnCard(state, state.corp.identity),
          credits: state.corp.credits,
          clicks: state.corp.clicks,
          agendaPoints: agendaPoints(state, "corp"),
          tags: state.runner.tags,
          handCount: state.corp.hq.length,
          maxHandSize: maxHandSize(state, "corp"),
          deckCount: state.corp.rd.length,
          discardCount: state.corp.archives.length,
          scoreArea: state.corp.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
        }
      : {
          identity: visibleOwnCard(state, state.runner.identity),
          credits: state.runner.credits,
          clicks: state.runner.clicks,
          agendaPoints: agendaPoints(state, "runner"),
          tags: state.runner.tags,
          handCount: state.runner.grip.length,
          maxHandSize: maxHandSize(state, "runner"),
          coreDamage: state.runner.coreDamage,
          deckCount: state.runner.stack.length,
          discardCount: state.runner.heap.length,
          scoreArea: state.runner.scoreArea.map((id) =>
            visibleOwnCard(state, id),
          ),
          rig: [
            ...state.runner.rig.programs,
            ...state.runner.rig.hardware,
            ...state.runner.rig.resources,
          ].map((id) => visibleOwnCard(state, id)),
        },
    servers: visibleServers,
    specialZones: visibleSpecialZones(state, side),
    ...(run ? { run } : {}),
    ...(state.pendingChoice?.side === side
      ? { pendingChoice: visibleChoice(state.pendingChoice) }
      : {}),
    ...(state.deckMetadata
      ? {
          deckMetadata: {
            own:
              side === "runner"
                ? state.deckMetadata.runner
                : state.deckMetadata.corp,
            opponent:
              side === "runner"
                ? state.deckMetadata.corp
                : state.deckMetadata.runner,
          },
        }
      : {}),
    publicEvents: state.eventLog.map((event) =>
      redactPublicEventForSide(toPublicEvent(event), side),
    ),
    legalActions: getLegalActions(state, side),
    winner: state.winner,
    agendaPointsToWin: state.agendaPointsToWin,
    ...(state.gameEndReason ? { gameEndReason: state.gameEndReason } : {}),
  };
}

export function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];
  const placements = new Map<CardInstanceId, string>();
  const addPlacement = (id: CardInstanceId, zone: string) => {
    if (placements.has(id))
      errors.push(`CardInstance ${id} appears multiple times.`);
    placements.set(id, zone);
    if (!state.cardInstances[id])
      errors.push(`Zone references missing CardInstance ${id}.`);
  };

  addPlacement(state.corp.identity, "corp.identity");
  addPlacement(state.runner.identity, "runner.identity");
  for (const id of state.corp.hq) addPlacement(id, "corp.hq");
  for (const id of state.corp.rd) addPlacement(id, "corp.rd");
  for (const id of state.corp.archives) addPlacement(id, "corp.archives");
  for (const id of state.corp.scoreArea) addPlacement(id, "corp.scoreArea");
  for (const server of state.corp.servers) {
    for (const id of server.ice) addPlacement(id, `${server.id}.ice`);
    for (const id of server.root) addPlacement(id, `${server.id}.root`);
  }
  for (const id of state.runner.grip) addPlacement(id, "runner.grip");
  for (const id of state.runner.stack) addPlacement(id, "runner.stack");
  for (const id of state.runner.heap) addPlacement(id, "runner.heap");
  for (const id of state.runner.scoreArea) addPlacement(id, "runner.scoreArea");
  for (const id of state.runner.rig.programs)
    addPlacement(id, "runner.rig.programs");
  for (const id of state.runner.rig.hardware)
    addPlacement(id, "runner.rig.hardware");
  for (const id of state.runner.rig.resources)
    addPlacement(id, "runner.rig.resources");
  for (const id of state.specialZones?.setAside ?? [])
    addPlacement(id, "special.set_aside");
  for (const id of state.specialZones?.removedFromGame ?? [])
    addPlacement(id, "special.removed_from_game");

  for (const id of Object.keys(state.cardInstances)) {
    if (!placements.has(id))
      errors.push(`CardInstance ${id} is not in any zone.`);
  }

  for (const [id, instance] of Object.entries(state.cardInstances)) {
    const placement = placements.get(id);
    const expected = placementForZoneRef(instance.zone);
    if (
      id !== state.corp.identity &&
      id !== state.runner.identity &&
      placement &&
      expected &&
      placement !== expected
    ) {
      errors.push(
        `CardInstance ${id} zoneRef ${expected} does not match placement ${placement}.`,
      );
    }
    if (instance.owner !== "corp" && instance.owner !== "runner")
      errors.push(`CardInstance ${id} has invalid owner.`);
    if (instance.controller !== "corp" && instance.controller !== "runner")
      errors.push(`CardInstance ${id} has invalid controller.`);
    if (instance.zone.side === "special") {
      if (
        instance.zone.zone !== "set_aside" &&
        instance.zone.zone !== "removed_from_game"
      )
        errors.push(`CardInstance ${id} has invalid special zone.`);
      if (
        instance.zone.visibility !== "public" &&
        instance.zone.visibility !== "side_private" &&
        instance.zone.visibility !== "hidden" &&
        instance.zone.visibility !== "replay_only"
      ) {
        errors.push(`CardInstance ${id} has invalid special zone visibility.`);
      }
      if (
        instance.zone.zone === "removed_from_game" &&
        instance.zone.returnZone
      )
        errors.push(
          `Removed-from-game CardInstance ${id} must not have a return zone.`,
        );
    }
  }

  if (state.corp.credits < 0 || state.runner.credits < 0)
    errors.push("Credits must not be negative.");
  if (state.corp.clicks < 0 || state.runner.clicks < 0)
    errors.push("Clicks must not be negative.");
  if (!Number.isInteger(state.corp.maxHandSize) || state.corp.maxHandSize < 0)
    errors.push("Corp max hand size must be a non-negative integer.");
  if (
    !Number.isInteger(state.runner.maxHandSize) ||
    state.runner.maxHandSize < 0
  )
    errors.push("Runner base max hand size must be a non-negative integer.");
  if (!Number.isInteger(state.runner.coreDamage) || state.runner.coreDamage < 0)
    errors.push("Runner core damage must be a non-negative integer.");
  if (!Number.isInteger(state.corp.badPublicity) || state.corp.badPublicity < 0)
    errors.push("Corp bad publicity must be a non-negative integer.");
  if (state.runner.tags < 0) errors.push("Runner tags must not be negative.");
  if (
    !Number.isInteger(state.runner.memoryLimit) ||
    state.runner.memoryLimit < 0
  )
    errors.push("Runner memory limit must be a non-negative integer.");
  if (!Number.isInteger(state.runner.memoryUsed) || state.runner.memoryUsed < 0)
    errors.push("Runner memory used must be a non-negative integer.");
  if (state.runner.memoryUsed > state.runner.memoryLimit)
    errors.push("Runner memory limit exceeded.");
  for (const id of state.runner.rig.programs) {
    if (definitionFor(state, id).type !== "program")
      errors.push(`Runner rig program slot contains non-program ${id}.`);
  }
  for (const id of state.runner.rig.hardware) {
    if (definitionFor(state, id).type !== "hardware")
      errors.push(`Runner rig hardware slot contains non-hardware ${id}.`);
  }
  for (const id of state.runner.rig.resources) {
    if (definitionFor(state, id).type !== "resource")
      errors.push(`Runner rig resource slot contains non-resource ${id}.`);
  }
  for (const [id, instance] of Object.entries(state.cardInstances)) {
    for (const [counterType, amount] of Object.entries(
      instance.counters ?? {},
    )) {
      if (!Number.isInteger(amount) || amount < 0)
        errors.push(
          `Counter ${counterType} on ${id} must be a non-negative integer.`,
        );
    }
    if (instance.hostedOn) {
      if (instance.hostedOn === id)
        errors.push(`CardInstance ${id} cannot host itself.`);
      if (!state.cardInstances[instance.hostedOn])
        errors.push(
          `CardInstance ${id} references missing host ${instance.hostedOn}.`,
        );
      if (hasHostingCycle(state, id))
        errors.push(`CardInstance ${id} has a hosting cycle.`);
    }
  }
  if (
    state.run?.encounteredIceId &&
    !state.cardInstances[state.run.encounteredIceId]
  )
    errors.push("Run references missing encountered ice.");
  if (state.run && !Array.isArray(state.run.resolvedSubroutineIndexes))
    errors.push("Run resolved subroutine index list is missing.");
  if (state.run?.remainderStrengthBonusByBreaker) {
    for (const [breakerId, amount] of Object.entries(
      state.run.remainderStrengthBonusByBreaker,
    )) {
      if (amount === undefined || !Number.isInteger(amount) || amount < 0) {
        errors.push(
          `Run remainder strength bonus for ${breakerId} must be a non-negative integer.`,
        );
      }
    }
  }
  if (state.run?.breach) {
    const effectiveAccessServerId =
      state.run.accessServerOverride ?? state.run.attackedServerId;
    if (state.run.phase !== "access")
      errors.push("Breach is only valid during access.");
    if (state.run.breach.serverId !== effectiveAccessServerId)
      errors.push("Breach server must match effective access server.");
    if (
      !state.run.breach.completed &&
      (state.run.breach.currentIndex < 0 ||
        state.run.breach.currentIndex >= state.run.breach.queue.length)
    ) {
      errors.push("Breach current index is invalid.");
    }
    const entryIds = new Set<string>();
    for (const entry of state.run.breach.queue) {
      if (entryIds.has(entry.entryId))
        errors.push(`Breach entry ${entry.entryId} appears multiple times.`);
      entryIds.add(entry.entryId);
      if (!state.cardInstances[entry.cardInstanceId])
        errors.push(
          `Breach references missing CardInstance ${entry.cardInstanceId}.`,
        );
      if (entry.serverId !== effectiveAccessServerId)
        errors.push("Breach entry server must match effective access server.");
    }
    const currentEntry = state.run.breach.queue[state.run.breach.currentIndex];
    if (
      state.run.accessedCardId &&
      currentEntry &&
      currentEntry.cardInstanceId !== state.run.accessedCardId
    ) {
      errors.push("Accessed card must match the current breach entry.");
    }
  }
  if (state.trace) {
    if (!state.cardInstances[state.trace.sourceCardInstanceId])
      errors.push("Trace references missing source card.");
    if (
      !Number.isInteger(state.trace.baseTraceStrength) ||
      state.trace.baseTraceStrength < 0
    )
      errors.push("Trace base strength is invalid.");
    if (!isSupportedTraceSuccessEffect(state.trace.successEffect))
      errors.push("Trace success effect is outside supported scope.");
    if (!state.pendingChoice)
      errors.push("Trace requires an open PendingChoice.");
    if (
      state.trace.status === "corp_bid" &&
      state.pendingChoice?.side !== "corp"
    )
      errors.push("Corp trace bid requires Corp choice.");
    if (state.trace.status === "runner_bid") {
      if (state.pendingChoice?.side !== "runner")
        errors.push("Runner trace bid requires Runner choice.");
      if (
        state.trace.corpBid === undefined ||
        state.trace.traceStrength === undefined ||
        state.trace.runnerLink === undefined
      )
        errors.push("Runner trace bid is missing Corp bid context.");
    }
  }
  if (state.identityAbilityUsage) {
    for (const side of ["corp", "runner"] as const) {
      const usage = state.identityAbilityUsage[side];
      if (!usage) continue;
      const setupAbilities = Array.isArray(usage.setupAbilities)
        ? usage.setupAbilities
        : [];
      const usedThisTurn = Array.isArray(usage.usedThisTurn)
        ? usage.usedThisTurn
        : [];
      if (
        !Array.isArray(usage.setupAbilities) ||
        !Array.isArray(usage.usedThisTurn)
      )
        errors.push(`Identity usage for ${side} must contain ability arrays.`);
      if (!Number.isInteger(usage.turn) || usage.turn < 0)
        errors.push(`Identity usage for ${side} has invalid turn.`);
      if (new Set(setupAbilities).size !== setupAbilities.length)
        errors.push(`Identity setup usage for ${side} must be unique.`);
      if (new Set(usedThisTurn).size !== usedThisTurn.length)
        errors.push(`Identity turn usage for ${side} must be unique.`);
      if (
        ![...setupAbilities, ...usedThisTurn].every(
          (id) => typeof id === "string" && id.length > 0,
        )
      ) {
        errors.push(`Identity usage for ${side} has invalid ability ids.`);
      }
    }
  }
  if (state.pendingChoice) {
    if (
      state.pendingChoice.side !== "corp" &&
      state.pendingChoice.side !== "runner"
    )
      errors.push("PendingChoice has invalid side.");
    if (state.pendingChoice.stateVersion !== state.stateVersion)
      errors.push("PendingChoice stateVersion must match current GameState.");
    if (
      state.pendingChoice.minSelections < 0 ||
      state.pendingChoice.maxSelections < state.pendingChoice.minSelections
    )
      errors.push("PendingChoice has invalid selection bounds.");
    const optionIds = new Set(
      state.pendingChoice.options.map((option) => option.id),
    );
    if (optionIds.size !== state.pendingChoice.options.length)
      errors.push("PendingChoice option ids must be unique.");
  }
  if (state.runnerTurnFlags?.incubatorPendingTransforms !== undefined) {
    const pending = state.runnerTurnFlags.incubatorPendingTransforms;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.incubatorPendingTransforms must be a non-negative integer.",
      );
  }
  if (
    state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining !== undefined
  ) {
    const remaining =
      state.runnerTurnFlags.valuPakProgramInstallActionsRemaining;
    if (!Number.isInteger(remaining) || remaining < 0 || remaining > 5)
      errors.push(
        "runnerTurnFlags.valuPakProgramInstallActionsRemaining must be an integer from 0 to 5.",
      );
  }
  if (state.runnerTurnFlags?.forgoNextActionsPending !== undefined) {
    const pending = state.runnerTurnFlags.forgoNextActionsPending;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.forgoNextActionsPending must be a non-negative integer.",
      );
  }
  if (
    state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits !== undefined
  ) {
    const credits = state.runnerTurnFlags.valuPakTemporaryProgramInstallCredits;
    if (!Number.isInteger(credits) || credits < 0 || credits > 1)
      errors.push(
        "runnerTurnFlags.valuPakTemporaryProgramInstallCredits must be an integer from 0 to 1.",
      );
  }
  if (
    state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining !== undefined
  ) {
    const remaining =
      state.corpTurnFlags.edgerunnerTempsInstallActionsRemaining;
    if (!Number.isInteger(remaining) || remaining < 0 || remaining > 3)
      errors.push(
        "corpTurnFlags.edgerunnerTempsInstallActionsRemaining must be an integer from 0 to 3.",
      );
  }
  if (state.eventModificationWindow) {
    if (!state.imminentEvent)
      errors.push("EventModificationWindow requires an ImminentEvent.");
    if (state.eventModificationWindow.eventId !== state.imminentEvent?.eventId)
      errors.push("EventModificationWindow eventId must match ImminentEvent.");
    if (
      state.eventModificationWindow.candidates.some(
        (candidate) =>
          candidate.eventId !== state.eventModificationWindow?.eventId,
      )
    ) {
      errors.push(
        "EventModification candidates must reference the open event.",
      );
    }
  }
  if (state.replacementWindow) {
    if (!state.imminentEvent)
      errors.push("ReplacementWindow requires an ImminentEvent.");
    if (
      state.replacementWindow.originalEventId !== state.imminentEvent?.eventId
    )
      errors.push(
        "ReplacementWindow originalEventId must match ImminentEvent.",
      );
    const consumed = new Set(state.replacementWindow.consumedCandidateIds);
    if (consumed.size !== state.replacementWindow.consumedCandidateIds.length)
      errors.push("Replacement consumedCandidateIds must be unique.");
  }

  return { ok: errors.length === 0, errors };
}

function placementForZoneRef(zone: CardInstance["zone"]): string | undefined {
  if (zone.side === "corp" && zone.zone === "hq") return "corp.hq";
  if (zone.side === "corp" && zone.zone === "rd") return "corp.rd";
  if (zone.side === "corp" && zone.zone === "archives") return "corp.archives";
  if (zone.side === "corp" && zone.zone === "scoreArea")
    return "corp.scoreArea";
  if (zone.side === "corp" && zone.zone === "serverIce")
    return `${zone.serverId}.ice`;
  if (zone.side === "corp" && zone.zone === "serverRoot")
    return `${zone.serverId}.root`;
  if (zone.side === "runner" && zone.zone === "grip") return "runner.grip";
  if (zone.side === "runner" && zone.zone === "stack") return "runner.stack";
  if (zone.side === "runner" && zone.zone === "heap") return "runner.heap";
  if (zone.side === "runner" && zone.zone === "scoreArea")
    return "runner.scoreArea";
  if (zone.side === "runner" && zone.zone === "rig") {
    return undefined;
  }
  if (zone.side === "special" && zone.zone === "set_aside")
    return "special.set_aside";
  if (zone.side === "special" && zone.zone === "removed_from_game")
    return "special.removed_from_game";
  return undefined;
}

export function validateDeckDefinition(
  deck: DeckDefinition,
  options: {
    expectedSide?: Side;
    allowedDeckIds?: string[];
    minimumAgendaPoints?: number;
  } = {},
): ValidationResult {
  const errors: string[] = [];
  if (options.allowedDeckIds && !options.allowedDeckIds.includes(deck.id))
    errors.push(`Deck ${deck.id} is not in the curated allowlist.`);
  if (options.expectedSide && deck.side !== options.expectedSide)
    errors.push(
      `Deck ${deck.id} has side ${deck.side}, expected ${options.expectedSide}.`,
    );

  const identity = DEMO_CARDS_BY_ID[deck.identity];
  if (!identity)
    errors.push(
      `Deck ${deck.id} references missing identity ${deck.identity}.`,
    );
  else {
    if (identity.type !== "identity")
      errors.push(
        `Deck ${deck.id} identity ${deck.identity} is not an identity.`,
      );
    if (identity.side !== deck.side)
      errors.push(`Deck ${deck.id} identity ${deck.identity} has wrong side.`);
  }

  let agendaPointsTotal = 0;
  for (const entry of deck.cards) {
    const definition = DEMO_CARDS_BY_ID[entry.id];
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0)
      errors.push(`Deck ${deck.id} has invalid quantity for ${entry.id}.`);
    if (!definition) {
      errors.push(`Deck ${deck.id} references unknown card ${entry.id}.`);
      continue;
    }
    if (cardHasSubtype(definition, "unique") && entry.quantity > 1) {
      errors.push(
        `Deck ${deck.id} includes more than one copy of unique card ${entry.id}.`,
      );
    }
    if (definition.side !== deck.side)
      errors.push(`Deck ${deck.id} includes wrong-side card ${entry.id}.`);
    if (definition.implementationStatus !== "playable_mvp")
      errors.push(`Deck ${deck.id} includes non-playable card ${entry.id}.`);
    agendaPointsTotal += (definition.agendaPoints ?? 0) * entry.quantity;
  }
  if (
    deck.side === "corp" &&
    options.minimumAgendaPoints !== undefined &&
    agendaPointsTotal < options.minimumAgendaPoints
  ) {
    errors.push(
      `Deck ${deck.id} has ${agendaPointsTotal} agenda points, expected at least ${options.minimumAgendaPoints}.`,
    );
  }

  return { ok: errors.length === 0, errors };
}

export function checkWinConditions(state: GameState): Winner | null {
  if (state.winner) {
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.gameEndReason ??= "unknown";
    return state.winner;
  }
  const runnerPoints = agendaPoints(state, "runner");
  const corpPoints = agendaPoints(state, "corp");
  if (
    runnerPoints >= state.agendaPointsToWin &&
    corpPoints >= state.agendaPointsToWin
  )
    state.winner = "draw";
  else if (runnerPoints >= state.agendaPointsToWin) state.winner = "runner";
  else if (corpPoints >= state.agendaPointsToWin) state.winner = "corp";
  if (state.winner) {
    state.gameEndReason = "agenda_points";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
  }
  return state.winner;
}

export function replayEvents(
  initialState: GameState,
  eventLog: GameEvent[],
): ReplayResult {
  let current = cloneState({
    ...initialState,
    eventLog: initialState.eventLog.slice(0, 1),
  });
  const errors: string[] = [];
  for (const event of eventLog) {
    if (event.type === "game_created") continue;
    const actionPayload =
      event.privatePayload?.[event.publicPayload.actor as Side]?.action;
    if (!isReplayAction(actionPayload)) {
      errors.push(`Event ${event.eventId} has no replayable action.`);
      continue;
    }
    const result = applyAction(current, actionPayload);
    if (!result.ok) {
      errors.push(`Replay failed at ${event.eventId}: ${result.error.code}`);
      break;
    }
    current = result.state;
    if (result.stateHash !== event.stateHashAfter) {
      errors.push(`StateHash mismatch at ${event.eventId}.`);
      break;
    }
  }
  const lastHash = eventLog.at(-1)?.stateHashAfter;
  return {
    ok: errors.length === 0,
    state: current,
    ...(lastHash ? { expectedFinalStateHash: lastHash } : {}),
    actualFinalStateHash: hashState(current),
    errors,
  };
}

export function hashState(state: GameState): StateHash {
  const canonical = stableStringify(stripForHash(state));
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function applyEffectCommands(
  state: GameState,
  commands: EffectCommand[],
): GameState {
  const next = cloneState(state);
  executeEffectCommands(next, commands);
  const validation = validateGameState(next);
  if (!validation.ok)
    throw new Error(
      validation.errors[0] ?? "Effect command left invalid state.",
    );
  return next;
}

export function eventVisibilityForAction(
  legalAction: LegalAction,
): EventVisibilityClass {
  if (
    legalAction.type === "move_to_set_aside" ||
    legalAction.type === "move_to_removed_from_game" ||
    legalAction.type === "return_from_set_aside"
  ) {
    return legalAction.payload?.specialZoneVisibility === "public"
      ? "public"
      : "hidden_info_barrier";
  }
  if (legalAction.type === "change_card_control") {
    const visibility = legalAction.payload?.controlChangeVisibility;
    return visibility === "hidden_info_barrier" ||
      visibility === "private_to_side" ||
      visibility === "replay_only" ||
      visibility === "public"
      ? visibility
      : "public";
  }
  if (legalAction.type === "resolve_choice") {
    const choiceVisibility = legalAction.payload?.choiceVisibility;
    return choiceVisibility === "hidden_info_barrier" ||
      choiceVisibility === "private_to_side" ||
      choiceVisibility === "replay_only" ||
      choiceVisibility === "public"
      ? choiceVisibility
      : "private_to_side";
  }
  if (legalAction.payload?.traceStarted === true) return "public";
  if (legalAction.payload?.damageResolved === true)
    return "hidden_info_barrier";
  if (legalAction.payload?.hiddenZoneBarrier === true)
    return "hidden_info_barrier";
  if (
    [
      "access_card",
      "rez_ice",
      "score_agenda",
      "steal_agenda",
      "trash_accessed_card",
      "play_operation",
    ].includes(legalAction.type)
  )
    return "hidden_info_barrier";
  if (["mandatory_draw", "draw_card"].includes(legalAction.type))
    return "private_to_side";
  if (legalAction.type === "purge_virus_counters") return "public";
  if (legalAction.type === "jack_out") return "public";
  if (legalAction.visibility === "public") return "public";
  if (legalAction.type === "play_event") return "public";
  return "private_to_side";
}

export function isHiddenInfoBarrierEvent(event: GameEvent): boolean {
  if (event.visibilityClass === "hidden_info_barrier") return true;
  if (event.publicPayload.damageResolved === true) return true;
  if (event.publicPayload.hiddenZoneBarrier === true) return true;
  if (
    event.publicPayload.specialZoneVisibility &&
    event.publicPayload.specialZoneVisibility !== "public"
  )
    return true;
  return [
    "access_card",
    "rez_ice",
    "score_agenda",
    "steal_agenda",
    "trash_accessed_card",
    "play_operation",
  ].includes(event.type);
}

function corpMainActions(state: GameState): LegalAction[] {
  const actions: LegalAction[] = [];
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (
        definition.type === "agenda" &&
        effectiveAgendaDifficulty(state, id) <=
          mustInstance(state.cardInstances, id).advancementCounters
      ) {
        actions.push(
          action(
            state,
            "corp",
            "score_agenda",
            `Agenda in ${server.label} scoren`,
            id,
            [],
            { cardId: id },
          ),
        );
      }
    }
  }
  if (state.corp.clicks <= 0) {
    actions.push(action(state, "corp", "end_turn", "Zug beenden", "game_rule"));
    return actions;
  }
  if (state.corp.clicks >= 3 && totalCounters(state, "virus") > 0) {
    actions.push(
      action(
        state,
        "corp",
        "purge_virus_counters",
        "Virus-Counter purgen",
        "basic_action",
        [{ clicks: 3 }],
        { purgedCounterType: "virus" },
        { targetRequirements: [] },
      ),
    );
  }
  actions.push(
    action(state, "corp", "gain_credit", "1 Credit nehmen", "basic_action", [
      { clicks: 1 },
    ]),
  );
  if (state.corp.rd.length > 0)
    actions.push(
      action(state, "corp", "draw_card", "Karte ziehen", "basic_action", [
        { clicks: 1 },
      ]),
    );
  if (state.runner.tags > 0 && state.corp.credits >= 2) {
    for (const id of state.runner.rig.resources) {
      const definition = definitionFor(state, id);
      actions.push(
        action(
          state,
          "corp",
          "trash_resource",
          `${definition.title} trashen`,
          "basic_action",
          [{ clicks: 1, credits: 2 }],
          { cardId: id, resourceId: id },
          {
            targetRequirements: [
              {
                id: "resource",
                kind: "card",
                side: "runner",
                zoneScope: ["runner.rig.resources"],
                visibility: "public",
              },
            ],
          },
        ),
      );
    }
  }
  for (const id of state.corp.hq) {
    const definition = definitionFor(state, id);
    if (
      definition.type === "operation" &&
      state.corp.credits >= (definition.cost ?? 0) &&
      canPlayCorpOperation(state, definition)
    ) {
      actions.push(
        action(
          state,
          "corp",
          "play_operation",
          `${definition.title} spielen`,
          id,
          [{ clicks: 1, credits: definition.cost ?? 0 }],
          { cardId: id },
        ),
      );
    }
    if (definition.type === "ice") {
      actions.push(
        action(
          state,
          "corp",
          "install_card",
          `ICE vor neuem Remote installieren`,
          id,
          [{ clicks: 1 }],
          { cardId: id, serverId: "new_remote", placement: "ice" },
        ),
      );
      for (const server of state.corp.servers) {
        const { baseCost, additionalCost, reduction, totalCost } =
          corpIceInstallTotalCost(state, server);
        if (state.corp.credits < totalCost) continue;
        actions.push(
          action(
            state,
            "corp",
            "install_card",
            `ICE vor ${server.label} installieren`,
            id,
            [{ clicks: 1, ...(totalCost > 0 ? { credits: totalCost } : {}) }],
            {
              cardId: id,
              serverId: server.id,
              placement: "ice",
              iceInstallBaseCost: baseCost,
              iceInstallAdditionalCost: additionalCost,
              iceInstallReduction: reduction,
              iceInstallTotalCost: totalCost,
            },
          ),
        );
      }
    }
    if (
      definition.type === "agenda" ||
      definition.type === "asset" ||
      definition.type === "upgrade"
    ) {
      if (
        isUniqueCard(definition) &&
        hasInstalledUniqueCardDefinition(state, "corp", definition.id)
      )
        continue;
      const regionInstallCost = isRegionUpgrade(definition)
        ? rezCostForCard(state, id)
        : 0;
      if (state.corp.credits >= regionInstallCost) {
        actions.push(
          action(
            state,
            "corp",
            "install_card",
            `Karte in neuem Remote installieren`,
            id,
            [
              {
                clicks: 1,
                ...(regionInstallCost > 0
                  ? { credits: regionInstallCost }
                  : {}),
              },
            ],
            { cardId: id, serverId: "new_remote", placement: "root" },
          ),
        );
      }
      for (const server of state.corp.servers.filter(
        (candidate) => candidate.kind === "remote",
      )) {
        if (
          canInstallCorpRootCardInServer(state, definition, server) &&
          state.corp.credits >= regionInstallCost
        ) {
          actions.push(
            action(
              state,
              "corp",
              "install_card",
              `Karte in ${server.label} installieren`,
              id,
              [
                {
                  clicks: 1,
                  ...(regionInstallCost > 0
                    ? { credits: regionInstallCost }
                    : {}),
                },
              ],
              { cardId: id, serverId: server.id, placement: "root" },
            ),
          );
        }
      }
    }
  }
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (definition.type === "agenda") {
        if (state.corp.credits >= 1)
          actions.push(
            action(
              state,
              "corp",
              "advance_card",
              `Agenda in ${server.label} advancen`,
              id,
              [{ clicks: 1, credits: 1 }],
              { cardId: id },
            ),
          );
      }
      const rezCost = rezCostForCard(state, id);
      if (
        (definition.type === "asset" || definition.type === "upgrade") &&
        !mustInstance(state.cardInstances, id).rezzed &&
        state.corp.credits >= rezCost
      ) {
        actions.push(
          action(
            state,
            "corp",
            "rez_ice",
            `Karte in ${server.label} rezzen`,
            id,
            [{ credits: rezCost }],
            { cardId: id, rootRez: true },
          ),
        );
      }
    }
  }
  for (const assetId of rezzedCorpRootCardIds(state).sort()) {
    const definition = definitionFor(state, assetId);
    if (V1917_TRACE_ASSET_IDS.has(definition.id)) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Trace ${definition.id === "onr_v1_310_blood-cat" ? 5 : 3} starten`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1917AssetAbility: "trace_3_tag",
            traceStrength: definition.id === "onr_v1_310_blood-cat" ? 5 : 3,
          },
        ),
      );
    }
    if (
      V1917_HIDDEN_REVEAL_ASSET_IDS.has(definition.id) &&
      state.corp.rd.length > 0
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: R&D-Spitze revealn`,
          assetId,
          [{ clicks: 1 }],
          { cardId: assetId, v1917AssetAbility: "reveal_rd_top" },
        ),
      );
    }
    if (
      V1917_HIDDEN_REORDER_ASSET_IDS.has(definition.id) &&
      state.corp.rd.length >= 2
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: R&D-Spitze anordnen`,
          assetId,
          [{ clicks: 1 }],
          { cardId: assetId, v1917AssetAbility: "reorder_rd_top2" },
        ),
      );
    }
    if (definition.id === V1917_SOLO_SQUAD_ID && state.runner.grip.length > 0) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 1 Meat Damage`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1917AssetAbility: "meat_damage_1",
            damageType: "meat",
            damageAmount: 1,
          },
        ),
      );
    }
    if (definition.id === V1917_COWBOY_SYSOP_ID) {
      for (const targetCardId of runnerInstalledCardIds(state).sort()) {
        const targetDefinition = definitionFor(state, targetCardId);
        actions.push(
          action(
            state,
            "corp",
            "gain_credit",
            `${definition.title}: ${targetDefinition.title} trashen`,
            assetId,
            [{ clicks: 1 }],
            {
              cardId: assetId,
              v1917AssetAbility: "trash_installed_runner_card",
              targetCardId,
            },
          ),
        );
      }
    }
    if (definition.id === V1917_DISINFECTANT_ID) {
      for (const targetCardId of visibleVirusCounterTargetIds(state).sort()) {
        const targetDefinition = definitionFor(state, targetCardId);
        actions.push(
          action(
            state,
            "corp",
            "gain_credit",
            `${definition.title}: Virus-Counter von ${targetDefinition.title} entfernen`,
            assetId,
            [{ clicks: 1 }],
            {
              cardId: assetId,
              v1917AssetAbility: "remove_virus_counter",
              targetCardId,
              counterType: "virus",
              removeCounterAmount: 1,
            },
          ),
        );
      }
    }
    if (V1918_COUNTER_UPGRADE_IDS.has(definition.id)) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Power-Counter laden`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1918UpgradeAbility: "add_power_counter",
            counterType: "power",
            addCounterAmount: 1,
          },
        ),
      );
    }
    if (
      definition.id === V1918_NEW_GALVESTON_CITY_GRID_ID &&
      state.corp.rd.length > 0
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: R&D-Spitze revealn`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1918UpgradeAbility: "reveal_rd_top",
            hiddenZoneAction: "v1918_city_grid_reveal_rd_top",
          },
        ),
      );
    }
    if (definition.id === V1918_PARIS_CITY_GRID_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Trace 2 starten`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1918UpgradeAbility: "trace_2_tag",
            traceStrength: 2,
          },
        ),
      );
    }
    if (
      V1918_TAG_CONDITION_UPGRADE_IDS.has(definition.id) &&
      state.runner.tags > 0
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: getaggten Runner besteuern`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1918UpgradeAbility: "tag_condition_credit",
            gainCreditsAmount: 1,
          },
        ),
      );
    }
    if (V1919_COUNTER_ASSET_IDS.has(definition.id)) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Power-Counter laden`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1919AssetAbility: "add_power_counter",
            counterType: "power",
            addCounterAmount: 1,
          },
        ),
      );
    }
    if (definition.id === V1919_INFORMATION_LAUNDERING_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 2 Credits`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1919AssetAbility: "gain_credits",
            gainCreditsAmount: 2,
          },
        ),
      );
    }
    if (V1920_ACTION_ASSET_IDS.has(definition.id)) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 2 Aktionen nehmen`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1920AssetAbility: "gain_actions",
            gainedActions: 2,
          },
        ),
      );
    }
    if (definition.id === V1921_SCHLAGHUND_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: deterministischen Wuerfel werfen`,
          assetId,
          [{ clicks: 1 }],
          { cardId: assetId, v1921AssetAbility: "deterministic_die_probe" },
        ),
      );
    }
    if (definition.id === V1921_RIO_DE_JANEIRO_CITY_GRID_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Server-Wuerfelprobe`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1921UpgradeAbility: "deterministic_server_die_probe",
          },
        ),
      );
    }
    if (!V1917_ECONOMY_ASSET_IDS.has(definition.id)) continue;
    actions.push(
      action(
        state,
        "corp",
        "gain_credit",
        `${definition.title}: 2 Credits`,
        assetId,
        [{ clicks: 1 }],
        {
          cardId: assetId,
          v1917AssetAbility: "gain_credits",
          gainCreditsAmount: 2,
        },
      ),
    );
  }
  for (const agendaId of state.corp.scoreArea.slice().sort()) {
    const definition = definitionFor(state, agendaId);
    if (
      definition.id === NETWATCH_OPERATIONS_OFFICE_ID ||
      definition.id === PRIVATE_CYBERNET_POLICE_ID
    ) {
      const traceStrength =
        definition.id === NETWATCH_OPERATIONS_OFFICE_ID ? 2 : 5;
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Trace ${traceStrength} starten`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility:
              definition.id === NETWATCH_OPERATIONS_OFFICE_ID
                ? "netwatch_operations_office"
                : "private_cybernet_police",
            traceStrength,
          },
        ),
      );
      continue;
    }
    if (
      definition.id === ON_CALL_SOLO_TEAM_ID ||
      definition.id === STRIKE_FORCE_KALI_ID
    ) {
      if (state.runner.tags <= 0) continue;
      const damageAmount = definition.id === ON_CALL_SOLO_TEAM_ID ? 1 : 2;
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: ${damageAmount} Meat Damage`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility:
              definition.id === ON_CALL_SOLO_TEAM_ID
                ? "on_call_solo_team"
                : "strike_force_kali",
            damageType: "meat",
            damageAmount,
          },
        ),
      );
      continue;
    }
    if (definition.id === AI_CHIEF_FINANCIAL_OFFICER_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: HQ/Archives in R&D mischen, 5 ziehen`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "ai_chief_financial_officer",
            drawCardsAmount: 5,
          },
        ),
      );
      continue;
    }
    if (definition.id === CORPORATE_DOWNSIZING_ID && state.corp.rd.length > 0) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: R&D-Spitze revealn`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "v1911_corporate_downsizing_reveal_rd_top",
            hiddenZoneAction: "v1911_corp_reveal_rd_top",
          },
        ),
      );
      continue;
    }
    if (
      definition.id === DETROIT_POLICE_CONTRACT_ID &&
      cardCounter(state, agendaId, "power") > 0
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 1 Credit aus Contract-Counter`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "v1912_detroit_police_contract",
            counterType: "power",
            removePowerCounterAmount: 1,
            gainCreditsAmount: 1,
          },
        ),
      );
      continue;
    }
    if (
      V1919_SCORED_REVEAL_AGENDA_IDS.has(definition.id) &&
      state.corp.rd.length > 0
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: R&D-Spitze revealn`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "v1919_scored_agenda_reveal_rd_top",
            hiddenZoneAction: "v1919_scored_agenda_reveal_rd_top",
          },
        ),
      );
      continue;
    }
    if (
      definition.id === V1922_CORPORATE_RETREAT_ID &&
      isV1922CorporateRetreatAbilityAvailable(state, agendaId)
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 2 Credits`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "v1922_corporate_retreat",
            gainCreditsAmount: 2,
          },
        ),
      );
      continue;
    }
    if (definition.id === V1922_POLITICAL_OVERTHROW_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 3 Credits`,
          agendaId,
          [{ clicks: 1 }],
          {
            cardId: agendaId,
            agendaAbility: "v1922_political_overthrow",
            gainCreditsAmount: 3,
          },
        ),
      );
      continue;
    }
    if (definition.id === V1922_MARINE_ARCOLOGY_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 3 Credits`,
          agendaId,
          [{ clicks: 2 }],
          {
            cardId: agendaId,
            agendaAbility: "v1922_marine_arcology",
            gainCreditsAmount: 3,
          },
        ),
      );
      continue;
    }
    if (
      definition.id !== "onr_v1_193_corporate-coup" &&
      definition.id !== "onr_v1_209_political-coup"
    )
      continue;
    if (cardCounter(state, agendaId, "power") <= 0) continue;
    const agendaAbility =
      definition.id === "onr_v1_193_corporate-coup"
        ? "corporate_coup"
        : "political_coup";
    const removePowerCounterAmount = agendaAbility === "political_coup" ? 3 : 1;
    actions.push(
      action(
        state,
        "corp",
        "gain_credit",
        `${definition.title}: ${removePowerCounterAmount} Credit${removePowerCounterAmount > 1 ? "s" : ""} aus Coup-Counter`,
        agendaId,
        [{ clicks: 1 }],
        {
          cardId: agendaId,
          agendaAbility,
          removePowerCounterAmount,
          gainCreditsAmount: removePowerCounterAmount,
        },
      ),
    );
  }
  actions.push(...specialZoneHarnessActions(state, "corp"));
  actions.push(action(state, "corp", "end_turn", "Zug beenden", "game_rule"));
  if (edgerunnerTempsInstallActionsRemaining(state) > 0) {
    return actions
      .filter(
        (candidate) =>
          candidate.type === "install_card" || candidate.type === "end_turn",
      )
      .map((candidate) =>
        candidate.type === "install_card"
          ? {
              ...candidate,
              payload: {
                ...(candidate.payload ?? {}),
                v1922EdgerunnerTempsInstallAction: true,
              },
              actionId: makeActionId(
                candidate.type,
                candidate.side,
                {
                  ...(candidate.payload ?? {}),
                  v1922EdgerunnerTempsInstallAction: true,
                },
                candidate.source,
              ),
            }
          : candidate,
      );
  }
  return actions;
}

function isV1922CorporateRetreatAbilityAvailable(
  state: GameState,
  agendaId: CardInstanceId,
): boolean {
  return (
    state.corp.scoreArea.includes(agendaId) &&
    definitionFor(state, agendaId).id === V1922_CORPORATE_RETREAT_ID &&
    cardCounter(state, agendaId, "mark") > 0
  );
}

function expireV1922CorporateRetreatAbilities(state: GameState): void {
  for (const agendaId of state.corp.scoreArea) {
    if (definitionFor(state, agendaId).id === V1922_CORPORATE_RETREAT_ID)
      setCardCounter(state, agendaId, "mark", 0);
  }
}

function isCorpInstallableCardType(definition: CardDefinition): boolean {
  return (
    definition.side === "corp" &&
    (definition.type === "ice" ||
      definition.type === "agenda" ||
      definition.type === "asset" ||
      definition.type === "upgrade")
  );
}

function edgerunnerTempsInstallActionsRemaining(state: GameState): number {
  return Math.max(
    0,
    Math.floor(
      state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining ?? 0,
    ),
  );
}

function clearV1922EdgerunnerTempsFlags(state: GameState): void {
  ensureCorpTurnFlags(state).edgerunnerTempsInstallActionsRemaining = 0;
}

function consumeV1922EdgerunnerTempsInstallAction(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (
    legalAction.side !== "corp" ||
    legalAction.type !== "install_card" ||
    legalAction.payload?.v1922EdgerunnerTempsInstallAction !== true
  )
    return;
  const flags = ensureCorpTurnFlags(state);
  const remainingBefore = edgerunnerTempsInstallActionsRemaining(state);
  if (remainingBefore <= 0)
    throw new Error(
      "Edgerunner, Inc., Temps hat keine Installationsaktionen mehr.",
    );
  flags.edgerunnerTempsInstallActionsRemaining = Math.max(
    0,
    remainingBefore - 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922CorpOperationAbility: "install_action_bundle",
    edgerunnerTempsInstallActionSpent: true,
    edgerunnerTempsInstallActionsRemaining:
      flags.edgerunnerTempsInstallActionsRemaining,
  };
}

function valuPakProgramInstallActionsRemaining(state: GameState): number {
  return Math.max(
    0,
    Math.floor(
      ensureRunnerTurnFlags(state).valuPakProgramInstallActionsRemaining ?? 0,
    ),
  );
}

function valuPakTemporaryProgramInstallCredits(state: GameState): number {
  return Math.max(
    0,
    Math.floor(
      ensureRunnerTurnFlags(state).valuPakTemporaryProgramInstallCredits ?? 0,
    ),
  );
}

function runnerInstallableProgramIdsForValuPak(
  state: GameState,
): CardInstanceId[] {
  return state.runner.grip.filter((cardId) => {
    const definition = definitionFor(state, cardId);
    const uniqueBlocked =
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id);
    return (
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >=
        (definition.installCost ?? 0) &&
      state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
        state.runner.memoryLimit
    );
  });
}

function clearV1922ValuPakRunnerFlags(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  flags.valuPakProgramInstallActionsRemaining = 0;
  flags.valuPakTemporaryProgramInstallCredits = 0;
}

function consumeV1922ValuPakInstallAction(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "install_card" ||
    legalAction.payload?.v1922ValuPakInstallAction !== true
  )
    return;
  const flags = ensureRunnerTurnFlags(state);
  const remainingBefore = valuPakProgramInstallActionsRemaining(state);
  if (remainingBefore <= 0)
    throw new Error(
      "Valu-Pak Software Bundle hat keine Installationsaktionen mehr.",
    );
  flags.valuPakProgramInstallActionsRemaining = Math.max(
    0,
    remainingBefore - 1,
  );
  if (flags.valuPakProgramInstallActionsRemaining <= 0)
    flags.valuPakTemporaryProgramInstallCredits = 0;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "program_install_action_bundle",
    valuPakInstallActionSpent: true,
    valuPakProgramInstallActionsRemaining:
      flags.valuPakProgramInstallActionsRemaining,
    valuPakTemporaryProgramInstallCreditsAfter:
      valuPakTemporaryProgramInstallCredits(state),
  };
}

function runnerMainActions(state: GameState): LegalAction[] {
  const actions: LegalAction[] = [];
  const flags = ensureRunnerTurnFlags(state);
  const hasClicks = state.runner.clicks > 0;
  const bonusRunPending = flags.allNighterBonusRunPending === true;
  if (!hasClicks && !bonusRunPending) {
    actions.push(
      action(state, "runner", "end_turn", "Zug beenden", "game_rule"),
    );
    return actions;
  }
  if (valuPakProgramInstallActionsRemaining(state) > 0) {
    for (const id of runnerInstallableProgramIdsForValuPak(state)) {
      const definition = definitionFor(state, id);
      actions.push(
        action(
          state,
          "runner",
          "install_card",
          `${definition.title} installieren`,
          id,
          [{ clicks: 1, credits: definition.installCost ?? 0 }],
          {
            cardId: id,
            v1922ValuPakInstallAction: true,
          },
        ),
      );
    }
    actions.push(
      action(state, "runner", "end_turn", "Zug beenden", "game_rule", [], {
        v1922ValuPakSequenceEnd: true,
      }),
    );
    return actions;
  }
  if (hasClicks) {
    actions.push(
      action(
        state,
        "runner",
        "gain_credit",
        "1 Credit nehmen",
        "basic_action",
        [{ clicks: 1 }],
      ),
    );
    if (state.runner.stack.length > 0)
      actions.push(
        action(state, "runner", "draw_card", "Karte ziehen", "basic_action", [
          { clicks: 1 },
        ]),
      );
    if (state.runner.tags > 0 && state.runner.credits >= 2) {
      actions.push(
        action(state, "runner", "remove_tag", "Tag entfernen", "basic_action", [
          { clicks: 1, credits: 2 },
        ]),
      );
    }
  }
  for (const id of state.runner.grip) {
    const definition = definitionFor(state, id);
    const uniqueBlocked =
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id);
    if (
      hasClicks &&
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >=
        (definition.installCost ?? 0) &&
      state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
        state.runner.memoryLimit
    ) {
      actions.push(
        action(
          state,
          "runner",
          "install_card",
          `${definition.title} installieren`,
          id,
          [{ clicks: 1, credits: definition.installCost ?? 0 }],
          { cardId: id },
        ),
      );
    }
    if (
      hasClicks &&
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >=
        (definition.installCost ?? 0)
    ) {
      for (const hostId of state.runner.rig.programs) {
        if (!canHostProgramOnDaemon(state, hostId, definition)) continue;
        const hostDefinition = definitionFor(state, hostId);
        actions.push(
          action(
            state,
            "runner",
            "install_card",
            `${definition.title} in ${hostDefinition.title} hosten`,
            id,
            [{ clicks: 1, credits: definition.installCost ?? 0 }],
            { cardId: id, hostOnCardId: hostId },
            {
              targetRequirements: [
                {
                  id: "hostProgram",
                  kind: "card",
                  side: "runner",
                  zoneScope: ["runner.rig.programs"],
                  visibility: "public",
                },
              ],
            },
          ),
        );
      }
    }
    if (
      hasClicks &&
      definition.type === "hardware" &&
      !uniqueBlocked &&
      state.runner.credits >= (definition.installCost ?? 0)
    ) {
      actions.push(
        action(
          state,
          "runner",
          "install_card",
          `${definition.title} installieren`,
          id,
          [{ clicks: 1, credits: definition.installCost ?? 0 }],
          { cardId: id },
        ),
      );
    }
    if (
      hasClicks &&
      definition.type === "resource" &&
      !uniqueBlocked &&
      state.runner.credits >= (definition.installCost ?? 0)
    ) {
      if (definition.id === "onr_v1_156_corporate-ally") {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (!forfeitAgendaId) continue;
        actions.push(
          action(
            state,
            "runner",
            "install_card",
            `${definition.title} installieren`,
            id,
            [{ clicks: 1, credits: definition.installCost ?? 0 }],
            {
              cardId: id,
              installAgendaPointCost: 1,
              forfeitAgendaCardId: forfeitAgendaId,
              installCostReason: "corporate_ally",
            },
            {
              targetRequirements: [
                {
                  id: "resourceCard",
                  kind: "card",
                  side: "runner",
                  zoneScope: ["runner.grip"],
                  visibility: "known_to_actor",
                },
              ],
            },
          ),
        );
        continue;
      }
      if (definition.id === "onr_v1_173_restrictive-net-zoning") {
        for (const server of state.corp.servers) {
          actions.push(
            action(
              state,
              "runner",
              "install_card",
              `${definition.title} auf ${server.label} ausrichten`,
              id,
              [{ clicks: 1, credits: definition.installCost ?? 0 }],
              { cardId: id, selectedServerId: server.id },
              {
                targetRequirements: [
                  {
                    id: "resourceCard",
                    kind: "card",
                    side: "runner",
                    zoneScope: ["runner.grip"],
                    visibility: "known_to_actor",
                  },
                ],
              },
            ),
          );
        }
        continue;
      }
      actions.push(
        action(
          state,
          "runner",
          "install_card",
          `${definition.title} installieren`,
          id,
          [{ clicks: 1, credits: definition.installCost ?? 0 }],
          { cardId: id },
          {
            targetRequirements: [
              {
                id: "resourceCard",
                kind: "card",
                side: "runner",
                zoneScope: ["runner.grip"],
                visibility: "known_to_actor",
              },
            ],
          },
        ),
      );
    }
    if (
      hasClicks &&
      definition.type === "event" &&
      state.runner.credits >= (definition.cost ?? 0)
    ) {
      const resolver = RUNNER_EVENT_RESOLVERS[definition.id];
      if (!resolver) continue;
      if (resolver.canPlay && !resolver.canPlay(state)) continue;
      if (resolver.requiresServer) {
        for (const server of state.corp.servers) {
          if (
            resolver.canPlayForServer &&
            !resolver.canPlayForServer(state, server.id)
          )
            continue;
          actions.push(
            action(
              state,
              "runner",
              "play_event",
              `${definition.title} auf ${server.label}`,
              id,
              [{ clicks: 1, credits: definition.cost ?? 0 }],
              { cardId: id, serverId: server.id },
            ),
          );
        }
      } else {
        actions.push(
          action(
            state,
            "runner",
            "play_event",
            `${definition.title} spielen`,
            id,
            [{ clicks: 1, credits: definition.cost ?? 0 }],
            { cardId: id },
          ),
        );
      }
    }
  }
  if (hasClicks) {
    for (const cardId of [
      ...state.runner.rig.programs,
      ...state.runner.rig.resources,
    ]
      .slice()
      .sort()) {
      const definition = definitionFor(state, cardId);
      if (
        (definition.id === SELF_MODIFYING_CODE_ID ||
          definition.id === AUJOURD_OUI_ID ||
          definition.id === NETO_ID) &&
        state.runner.stack.some(
          (id) => definitionFor(state, id).type === "program",
        )
      ) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Stack nach Programm durchsuchen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1911HiddenZoneAbility: "search_stack_program_to_grip" },
          ),
        );
      }
      if (
        (definition.id === MOUSE_ID || definition.id === SEEYA_ID) &&
        state.corp.servers.some(
          (server) => exposedCorpCardInServer(state, server.id) !== undefined,
        )
      ) {
        for (const server of state.corp.servers) {
          if (exposedCorpCardInServer(state, server.id) === undefined) continue;
          actions.push(
            action(
              state,
              "runner",
              "gain_credit",
              `${definition.title}: Karte in ${server.label} expose`,
              cardId,
              [{ clicks: 1 }],
              {
                cardId,
                serverId: server.id,
                v1911HiddenZoneAbility: "expose_server_card",
              },
            ),
          );
        }
      }
      if (
        (definition.id === THE_SHORT_CIRCUIT_ID ||
          definition.id === AUJOURD_OUI_ID) &&
        state.runner.stack.length > 0
      ) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Stack-Spitze revealn`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1911HiddenZoneAbility: "reveal_stack_top" },
          ),
        );
      }
      if (definition.id === I_SPY_ID && state.runner.stack.length > 0) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Stack-Spitze revealn`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              v1912CounterAbility: "reveal_stack_top",
              hiddenZoneAction: "v1912_reveal_stack_top",
            },
          ),
        );
      }
      if (
        definition.id === V1919_FAIT_ACCOMPLI_ID &&
        state.runner.scoreArea.length > 0
      ) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Power-Counter laden`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              v1919RunnerProgramAbility: "add_power_counter",
              counterType: "power",
              addCounterAmount: 1,
            },
          ),
        );
      }
      if (V1921_RUNNER_RANDOM_PROGRAM_IDS.has(definition.id)) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: deterministischen Wuerfel werfen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1921RunnerProgramAbility: "deterministic_die_probe" },
          ),
        );
      }
      if (definition.id === V1922_NEWSGROUP_FILTER_ID) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: 2 Credits`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              v1922RunnerProgramAbility: "newsgroup_filter_gain_2",
              gainCreditsAmount: 2,
            },
          ),
        );
      }
      if (definition.id === V1921_QUEST_FOR_CATTEKIN_ID) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: deterministischen Wuerfel werfen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1921RunnerResourceAbility: "deterministic_die_probe" },
          ),
        );
      }
      if (definition.id === RONIN_AROUND_ID && state.runner.stack.length >= 2) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Stack-Spitze anordnen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1911HiddenZoneAbility: "arrange_stack_top2" },
          ),
        );
      }
    }
    for (const resourceId of state.runner.rig.resources.slice().sort()) {
      const definition = definitionFor(state, resourceId);
      if (definition.id === "onr_v1_159_databroker") {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (forfeitAgendaId) {
          actions.push(
            action(
              state,
              "runner",
              "gain_credit",
              `${definition.title}: 10 Credits (1 Agenda-Punkt, trashen)`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "databroker",
                forfeitAgendaCardId: forfeitAgendaId,
                agendaPointCost: 1,
                trashOnUse: true,
                gainCreditsAmount: 10,
              },
            ),
          );
        }
      }
      if (
        definition.id === "onr_v1_158_danshis-second-id" &&
        state.runner.tags > 0
      ) {
        const removeAmount = Math.min(3, state.runner.tags);
        for (let amount = 1; amount <= removeAmount; amount += 1) {
          actions.push(
            action(
              state,
              "runner",
              "remove_tag",
              `${definition.title}: ${amount} Tag entfernen`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "danshis_second_id",
                removeTagAmount: amount,
                trashOnUse: true,
              },
            ),
          );
        }
      }
      if (definition.id === "onr_v1_179_silicon-saloon-franchise") {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: 1 Credit und 1 Karte ziehen`,
            resourceId,
            [{ clicks: 1 }],
            {
              cardId: resourceId,
              resourceAbility: "silicon_saloon_franchise",
              drawCardAfter: true,
            },
          ),
        );
      }
    }
  }
  for (const server of state.corp.servers) {
    const v1918RunTax = v1918RunStartTaxForServer(state, server.id);
    const runCosts = [
      {
        clicks: 1,
        ...(v1918RunTax.amount > 0 ? { credits: v1918RunTax.amount } : {}),
      },
    ];
    const runPayload = {
      serverId: server.id,
      ...(v1918RunTax.amount > 0
        ? {
            v1918UpgradeAbility: "run_start_tax",
            runStartTaxCredits: v1918RunTax.amount,
            runStartTaxSourceDefinitionIds:
              v1918RunTax.sourceDefinitionIds.join(","),
          }
        : {}),
    };
    if (hasClicks) {
      if (
        v1918RunTax.amount === 0 ||
        availableRunnerRunStartCredits(state) >= v1918RunTax.amount
      ) {
        actions.push(
          action(
            state,
            "runner",
            "start_run",
            `Run auf ${server.label}`,
            "basic_action",
            runCosts,
            runPayload,
          ),
        );
      }
    }
    if (
      bonusRunPending &&
      (v1918RunTax.amount === 0 ||
        availableRunnerRunStartCredits(state) >= v1918RunTax.amount)
    ) {
      actions.push(
        action(
          state,
          "runner",
          "start_run",
          `Bonus-Run auf ${server.label}`,
          "basic_action",
          v1918RunTax.amount > 0 ? [{ credits: v1918RunTax.amount }] : [],
          {
            ...runPayload,
            bonusRunNoClick: true,
            bonusRunSource: ALL_NIGHTER_ID,
          },
        ),
      );
    }
  }
  actions.push(...specialZoneHarnessActions(state, "runner"));
  actions.push(action(state, "runner", "end_turn", "Zug beenden", "game_rule"));
  return actions;
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return definition.subtypes.some(
    (candidate) => normalizeSubtypeLabel(candidate) === target,
  );
}

function isRegionUpgrade(definition: CardDefinition): boolean {
  return definition.type === "upgrade" && cardHasSubtype(definition, "region");
}

function isUniqueCard(definition: CardDefinition): boolean {
  return cardHasSubtype(definition, "unique");
}

function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
}

function corpInstalledCardIds(state: GameState): CardInstanceId[] {
  const installed: CardInstanceId[] = [];
  for (const server of state.corp.servers)
    installed.push(...server.root, ...server.ice);
  return installed;
}

function rezzedBlackIceIds(state: GameState): CardInstanceId[] {
  return corpInstalledCardIds(state).filter((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return (
      instance.zone.zone === "serverIce" &&
      instance.rezzed &&
      cardHasSubtype(definitionFor(state, cardId), "black_ice")
    );
  });
}

function rezzedInstalledIceIds(state: GameState): CardInstanceId[] {
  return corpInstalledCardIds(state).filter((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return instance.zone.zone === "serverIce" && instance.rezzed;
  });
}

function affordableRezzedInstalledIceIdsForRunner(
  state: GameState,
): CardInstanceId[] {
  return rezzedInstalledIceIds(state).filter(
    (cardId) => state.runner.credits >= rezCostForCard(state, cardId),
  );
}

function unrezzedInstalledIceIds(state: GameState): CardInstanceId[] {
  return corpInstalledCardIds(state).filter((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return instance.zone.zone === "serverIce" && !instance.rezzed;
  });
}

function hasInstalledUniqueCardDefinition(
  state: GameState,
  side: Side,
  definitionId: CardDefinitionId,
): boolean {
  const installed =
    side === "runner"
      ? runnerInstalledCardIds(state)
      : corpInstalledCardIds(state);
  return installed.some(
    (cardId) => definitionFor(state, cardId).id === definitionId,
  );
}

function daemonHostingCapacity(definition: CardDefinition): number {
  if (definition.id === "onr_v1_069_succubus") return 3;
  if (definition.id === "onr_v1_001_afreet") return 3;
  if (definition.id === "onr_v1_033_imp") return 2;
  return 0;
}

function daemonHostedMemoryUsed(
  state: GameState,
  hostId: CardInstanceId,
): number {
  return hostedCardsOn(state, hostId).reduce((sum, cardId) => {
    const definition = definitionFor(state, cardId);
    if (definition.type !== "program") return sum;
    return sum + (definition.memoryCost ?? 0);
  }, 0);
}

function canHostProgramOnDaemon(
  state: GameState,
  hostId: CardInstanceId,
  programDefinition: CardDefinition,
): boolean {
  if (programDefinition.type !== "program") return false;
  const hostDefinition = definitionFor(state, hostId);
  if (
    hostDefinition.type !== "program" ||
    !cardHasSubtype(hostDefinition, "daemon")
  )
    return false;
  const capacity = daemonHostingCapacity(hostDefinition);
  if (capacity <= 0) return false;
  return (
    daemonHostedMemoryUsed(state, hostId) +
      (programDefinition.memoryCost ?? 0) <=
    capacity
  );
}

function corpServerIdForInstalledCard(
  state: GameState,
  cardId: CardInstanceId,
): Exclude<ServerId, "new_remote"> | undefined {
  const zone = mustInstance(state.cardInstances, cardId).zone;
  if (
    zone.side === "corp" &&
    (zone.zone === "serverIce" || zone.zone === "serverRoot")
  )
    return zone.serverId;
  return undefined;
}

function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of server.root) {
      if (mustInstance(state.cardInstances, cardId).rezzed) ids.push(cardId);
    }
  }
  return ids;
}

function visibleVirusCounterTargetIds(state: GameState): CardInstanceId[] {
  const targets = new Set<CardInstanceId>();
  for (const cardId of runnerInstalledCardIds(state)) {
    if (cardCounter(state, cardId, "virus") > 0) targets.add(cardId);
  }
  for (const cardId of corpInstalledCardIds(state)) {
    const instance = state.cardInstances[cardId];
    if (!instance?.rezzed) continue;
    if (cardCounter(state, cardId, "virus") > 0) targets.add(cardId);
  }
  return [...targets];
}

function scoredCorpAgendaIds(state: GameState): CardInstanceId[] {
  return state.corp.scoreArea.slice();
}

function iceStrengthBonusFor(state: GameState, iceId: CardInstanceId): number {
  const iceDefinition = definitionFor(state, iceId);
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  let bonus = 0;
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (
      sourceDefinition.id === "onr_v1_317_data-masons" &&
      cardHasSubtype(iceDefinition, "wall")
    )
      bonus += 1;
    if (
      sourceDefinition.id === "onr_v1_350_antiquated-interface-routines" &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId
    )
      bonus += 1;
  }
  for (const agendaId of scoredCorpAgendaIds(state)) {
    const agendaDefinition = definitionFor(state, agendaId);
    if (agendaDefinition.id === "onr_v1_215_security-net-optimization")
      bonus += 1;
    if (
      agendaDefinition.id === SUPERIOR_NET_BARRIERS_ID &&
      cardHasSubtype(iceDefinition, "wall")
    )
      bonus += 1;
  }
  return bonus;
}

function iceStrengthFor(state: GameState, iceId: CardInstanceId): number {
  const definition = definitionFor(state, iceId);
  const instance = mustInstance(state.cardInstances, iceId);
  const runEncounterBonus =
    state.run?.encounteredIceId === iceId
      ? Math.max(0, Math.floor(state.run.futureEncounterIceStrengthBonus ?? 0))
      : 0;
  const clownReduction =
    state.run?.encounteredIceId === iceId &&
    runnerHasInstalledCardDefinition(state, "runner", "onr_v1_012_clown")
      ? 1
      : 0;
  const pattelsReduction = cardCounter(state, iceId, "virus");
  const total =
    (definition.strength ?? 0) +
    instance.strengthModifier +
    iceStrengthBonusFor(state, iceId) +
    runEncounterBonus -
    clownReduction -
    pattelsReduction;
  return Math.max(0, total);
}

function runRemainderStrengthBonusForBreaker(
  run: GameState["run"],
  breakerId: CardInstanceId,
): number {
  if (!run) return 0;
  return Math.max(
    0,
    Math.floor(run.remainderStrengthBonusByBreaker?.[breakerId] ?? 0),
  );
}

function iceRezCostReductionFor(
  state: GameState,
  iceDefinition: CardDefinition,
): number {
  let reduction = 0;
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (
      sourceDefinition.id === "onr_v1_317_data-masons" &&
      cardHasSubtype(iceDefinition, "wall")
    )
      reduction += 2;
    if (
      sourceDefinition.id === "onr_v1_320_encoder-inc" &&
      cardHasSubtype(iceDefinition, "code_gate")
    )
      reduction += 2;
    if (
      sourceDefinition.id === "onr_v1_341_skalderviken-sa-beta-test-site" &&
      cardHasSubtype(iceDefinition, "black_ice")
    )
      reduction += 2;
    if (sourceDefinition.id === V1920_FORTRESS_ARCHITECTS_ID) reduction += 1;
  }
  return reduction;
}

function rezCostForCard(state: GameState, cardId: CardInstanceId): number {
  const definition = definitionFor(state, cardId);
  const baseCost = definition.rezCost ?? 0;
  if (definition.type !== "ice") return baseCost;
  const reduction = iceRezCostReductionFor(state, definition);
  return Math.max(0, baseCost - reduction);
}

function runnerHasInstalledCardDefinition(
  state: GameState,
  side: Side,
  definitionId: CardDefinitionId,
): boolean {
  const installed =
    side === "runner"
      ? runnerInstalledCardIds(state)
      : corpInstalledCardIds(state);
  return installed.some(
    (cardId) => definitionFor(state, cardId).id === definitionId,
  );
}

function runnerInstalledCardCountByDefinition(
  state: GameState,
  definitionId: CardDefinitionId,
): number {
  return runnerInstalledCardIds(state).reduce(
    (count, cardId) =>
      definitionFor(state, cardId).id === definitionId ? count + 1 : count,
    0,
  );
}

function installedVirusCounterTotalForDefinition(
  state: GameState,
  definitionId: CardDefinitionId,
): number {
  return runnerInstalledCardIds(state).reduce((sum, cardId) => {
    if (definitionFor(state, cardId).id !== definitionId) return sum;
    return sum + cardCounter(state, cardId, "virus");
  }, 0);
}

function cockroachCounterTotal(state: GameState): number {
  return installedVirusCounterTotalForDefinition(state, COCKROACH_ID);
}

function incubatorCounterTotal(state: GameState): number {
  return installedVirusCounterTotalForDefinition(state, INCUBATOR_ID);
}

function cockroachRandomHqDiscardActive(state: GameState): boolean {
  return cockroachCounterTotal(state) >= 2;
}

function isVisibleVirusCounterCardForRunner(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  if (instance.owner === "runner") return true;
  if (instance.rezzed) return true;
  if (state.corp.scoreArea.includes(cardId)) return true;
  if (state.corp.archives.includes(cardId) && instance.faceup) return true;
  if (state.run?.accessedCardId === cardId) return true;
  return false;
}

function corpIceInstallBaseCost(server: CorpServer): number {
  return Math.max(0, server.ice.length);
}

function poxCountersForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.max(0, Math.floor(state.poxCountersByServer?.[serverId] ?? 0));
}

function restrictiveNetZoningInstallTax(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return state.runner.rig.resources.reduce((sum, cardId) => {
    const definition = definitionFor(state, cardId);
    if (definition.id !== "onr_v1_173_restrictive-net-zoning") return sum;
    const instance = mustInstance(state.cardInstances, cardId);
    return instance.selectedServerId === serverId ? sum + 1 : sum;
  }, 0);
}

function poxInstallTax(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.floor(poxCountersForServer(state, serverId) / 2);
}

function corpIceInstallAdditionalCost(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return (
    restrictiveNetZoningInstallTax(state, serverId) +
    poxInstallTax(state, serverId)
  );
}

function chesterMixIceInstallReduction(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  const server = mustServer(state, serverId);
  return server.root.reduce((sum, cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    if (!instance.rezzed) return sum;
    return definitionFor(state, cardId).id === CHESTER_MIX_ID ? sum + 1 : sum;
  }, 0);
}

function corpIceInstallTotalCost(
  state: GameState,
  server: CorpServer,
): {
  baseCost: number;
  additionalCost: number;
  reduction: number;
  totalCost: number;
} {
  const baseCost = corpIceInstallBaseCost(server);
  const additionalCost = corpIceInstallAdditionalCost(state, server.id);
  const reduction = chesterMixIceInstallReduction(state, server.id);
  return {
    baseCost,
    additionalCost,
    reduction,
    totalCost: Math.max(0, baseCost + additionalCost - reduction),
  };
}

function rezzedRootCardIdOnServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  definitionId: CardDefinitionId,
): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return server.root
    .slice()
    .sort()
    .find((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return (
        instance.rezzed && definitionFor(state, cardId).id === definitionId
      );
    });
}

function unrezzedRootCardIdOnServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  definitionId: CardDefinitionId,
): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return server.root
    .slice()
    .sort()
    .find((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return (
        !instance.rezzed && definitionFor(state, cardId).id === definitionId
      );
    });
}

function isWormBreaker(state: GameState, breakerId: CardInstanceId): boolean {
  const definition = definitionFor(state, breakerId);
  return definition.type === "program" && cardHasSubtype(definition, "worm");
}

function runnerCanUseBreakerOnCurrentFort(
  state: GameState,
  breakerId: CardInstanceId,
): boolean {
  const run = state.run;
  if (!run || !isWormBreaker(state, breakerId)) return true;
  return !rezzedRootCardIdOnServer(state, run.attackedServerId, AARDVARK_ID);
}

function shouldOpenAardvarkInterception(
  state: GameState,
  breakerId: CardInstanceId,
): boolean {
  const run = state.run;
  if (!run?.encounteredIceId || !isWormBreaker(state, breakerId)) return false;
  if (rezzedRootCardIdOnServer(state, run.attackedServerId, AARDVARK_ID))
    return false;
  if (run.aardvarkInterceptionIceIds?.includes(run.encounteredIceId))
    return false;
  const aardvarkId = unrezzedRootCardIdOnServer(
    state,
    run.attackedServerId,
    AARDVARK_ID,
  );
  if (!aardvarkId) return false;
  return state.corp.credits >= rezCostForCard(state, aardvarkId);
}

function startAardvarkInterceptionChoice(
  state: GameState,
  breakerId: CardInstanceId,
  actionType: "pump_breaker" | "break_subroutine",
  legalAction: LegalAction,
): void {
  const run = mustRun(state);
  if (!run.encounteredIceId)
    throw new Error("Aardvark benötigt ein aktives Encounter-ICE.");
  const aardvarkId = unrezzedRootCardIdOnServer(
    state,
    run.attackedServerId,
    AARDVARK_ID,
  );
  if (!aardvarkId)
    throw new Error("Aardvark ist auf diesem Server nicht verfügbar.");
  const cost = Math.max(0, Math.floor(legalAction.costs[0]?.credits ?? 0));
  const subroutineIndex =
    legalAction.payload?.subroutineIndex === undefined
      ? "none"
      : String(legalAction.payload.subroutineIndex);
  const usedIceIds = run.aardvarkInterceptionIceIds ?? [];
  if (!usedIceIds.includes(run.encounteredIceId))
    usedIceIds.push(run.encounteredIceId);
  run.aardvarkInterceptionIceIds = usedIceIds;
  state.pendingChoice = {
    choiceId: `v199_aardvark_${state.stateVersion + 1}`,
    side: "corp",
    source: `v199.aardvark:${aardvarkId}:${breakerId}:${run.encounteredIceId}:${actionType}:${subroutineIndex}:${cost}`,
    prompt: "Aardvark rezzen und Worm trashen?",
    kind: "select_option",
    options: [
      {
        id: "rez_trash_worm",
        label: "Aardvark rezzen",
        publicLabel: "Aardvark wird gerezzt",
        value: "rez_trash_worm",
      },
      {
        id: "decline",
        label: "Nicht rezzen",
        publicLabel: "Aardvark wird nicht gerezzt",
        value: "decline",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "private_to_side",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "aardvark_interception_window",
    aardvarkWindowOpened: true,
  };
}

function specialZoneHarnessActions(
  state: GameState,
  side: Side,
): LegalAction[] {
  const harness = state.specialZoneHarness;
  if (
    !harness ||
    harness.actor !== side ||
    !state.cardInstances[harness.cardInstanceId]
  )
    return [];
  const cardId = harness.cardInstanceId;
  const instance = mustInstance(state.cardInstances, cardId);
  const actions: LegalAction[] = [];
  if (harness.setAside && instance.zone.side !== "special") {
    actions.push(
      action(
        state,
        side,
        "move_to_set_aside",
        "Karte testweise set-aside legen",
        "game_rule",
        [],
        {
          cardId,
          specialZone: "set_aside",
          specialZoneVisibility: harness.setAside.visibility,
          ...(harness.setAside.visibilitySide
            ? { specialZoneVisibilitySide: harness.setAside.visibilitySide }
            : {}),
          specialZoneReason: harness.setAside.reason ?? "v1.2.2_test_harness",
        },
        {
          targetRequirements: [
            { id: "card", kind: "card", visibility: "engine_only" },
          ],
        },
      ),
    );
  }
  if (harness.removedFromGame && instance.zone.side !== "special") {
    actions.push(
      action(
        state,
        side,
        "move_to_removed_from_game",
        "Karte testweise aus dem Spiel entfernen",
        "game_rule",
        [],
        {
          cardId,
          specialZone: "removed_from_game",
          specialZoneVisibility: harness.removedFromGame.visibility,
          ...(harness.removedFromGame.visibilitySide
            ? {
                specialZoneVisibilitySide:
                  harness.removedFromGame.visibilitySide,
              }
            : {}),
          specialZoneReason:
            harness.removedFromGame.reason ?? "v1.2.2_test_harness",
        },
        {
          targetRequirements: [
            { id: "card", kind: "card", visibility: "engine_only" },
          ],
        },
      ),
    );
  }
  if (
    harness.setAside?.allowReturn &&
    instance.zone.side === "special" &&
    instance.zone.zone === "set_aside"
  ) {
    actions.push(
      action(
        state,
        side,
        "return_from_set_aside",
        "Karte testweise aus Set Aside zurückholen",
        "game_rule",
        [],
        {
          cardId,
          specialZone: "set_aside",
          specialZoneReason:
            harness.setAside.reason ?? "v1.2.2_test_harness_return",
        },
        {
          targetRequirements: [
            {
              id: "card",
              kind: "card",
              zoneScope: ["special.set_aside"],
              visibility: "engine_only",
            },
          ],
        },
      ),
    );
  }
  if (
    harness.controlChange &&
    instance.controller !== harness.controlChange.newController
  ) {
    actions.push(
      action(
        state,
        side,
        "change_card_control",
        "Kartenkontrolle testweise wechseln",
        "game_rule",
        [],
        {
          cardId,
          oldController: instance.controller,
          newController: harness.controlChange.newController,
          controlChangeVisibility: harness.controlChange.visibility ?? "public",
          controlChangeReason:
            harness.controlChange.reason ?? "v1.2.2_test_harness",
        },
        {
          targetRequirements: [
            { id: "card", kind: "card", visibility: "engine_only" },
            {
              id: "controller",
              kind: "side",
              allowedSides: ["corp", "runner"],
            },
          ],
        },
      ),
    );
  }
  return actions;
}

function corpApproachActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.approachedIceId) return [];
  const ice = mustInstance(state.cardInstances, run.approachedIceId);
  const definition = definitionFor(state, run.approachedIceId);
  const actions: LegalAction[] = [];
  const rezCost = rezCostForCard(state, run.approachedIceId);
  if (!ice.rezzed && state.corp.credits >= rezCost) {
    actions.push(
      action(
        state,
        "corp",
        "rez_ice",
        `${definition.title} rezzen`,
        run.approachedIceId,
        [{ credits: rezCost }],
        { cardId: run.approachedIceId },
      ),
    );
  }
  actions.push(
    action(state, "corp", "decline_rez", "Nicht rezzen", "game_rule"),
  );
  return actions;
}

function runnerEncounterActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.encounteredIceId) return [];
  const encounteredIceId = run.encounteredIceId;
  const iceDefinition = definitionFor(state, run.encounteredIceId);
  const encounteredIceStrength = iceStrengthFor(state, encounteredIceId);
  const actions: LegalAction[] = [];
  for (const breakerId of state.runner.rig.programs) {
    const breaker = definitionFor(state, breakerId);
    if (!runnerCanUseBreakerOnCurrentFort(state, breakerId)) continue;
    const breakerStrength =
      (breaker.strength ?? 0) +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      runRemainderStrengthBonusForBreaker(run, breakerId);
    const pump = breaker.abilities?.find(
      (ability) => ability.type === "pump_strength",
    );
    if (
      pump &&
      availableRunnerRunCredits(state, breakerId) >= pump.cost.credits
    ) {
      actions.push(
        action(
          state,
          "runner",
          "pump_breaker",
          `${breaker.title}: Stärke +1`,
          breakerId,
          [{ credits: pump.cost.credits }],
          { breakerId, iceId: encounteredIceId },
          abilityMetadata(breakerId, pump.id, encounteredIceId),
        ),
      );
    }
    const breakAbility = breaker.abilities?.find(
      (ability) =>
        ability.type === "break_subroutine" &&
        breakAbilityMatchesIce(ability, iceDefinition),
    );
    if (
      !run.noBreakSubroutinesActive &&
      breakAbility &&
      breakerStrength >= encounteredIceStrength &&
      availableRunnerRunCredits(state, breakerId) >= breakAbility.cost.credits
    ) {
      const blinkUsedSubroutines =
        run.blinkUsedSubroutinesByBreakerThisEncounter?.[breakerId] ?? [];
      const subroutines = iceDefinition.subroutines ?? [];
      subroutines.forEach((subroutine, index) => {
        if (breaker.id === BLINK_ID && blinkUsedSubroutines.includes(index))
          return;
        if (!breakAbilityMatchesSubroutine(breakAbility, subroutine)) return;
        if (
          !run.brokenSubroutineIndexes.includes(index) &&
          !run.resolvedSubroutineIndexes.includes(index)
        ) {
          const subroutineLabel =
            subroutines.length > 1
              ? `Subroutine ${index + 1} brechen`
              : "Subroutine brechen";
          actions.push(
            action(
              state,
              "runner",
              "break_subroutine",
              `${breaker.title}: ${subroutineLabel}`,
              breakerId,
              [{ credits: breakAbility.cost.credits }],
              { breakerId, iceId: encounteredIceId, subroutineIndex: index },
              abilityMetadata(breakerId, breakAbility.id, encounteredIceId),
            ),
          );
        }
      });
    }
  }
  const nextSubroutines = encounterSubroutinesForNextContinue(
    run,
    iceDefinition.subroutines ?? [],
  );
  const willEndRun = nextSubroutines.some(
    (subroutine) => subroutine.type === "end_the_run",
  );
  const continueLabel =
    nextSubroutines.length === 0
      ? "ICE passieren"
      : willEndRun
        ? "Subroutinen auslösen (Run endet)"
        : "Subroutinen auslösen";
  actions.push(
    action(state, "runner", "continue_run", continueLabel, "game_rule", [], {
      encounterContinue: true,
      unbrokenSubroutineCount: nextSubroutines.length,
      encounterWillEndRun: willEndRun,
    }),
  );
  return actions;
}

function breakAbilityMatchesIce(
  ability: NonNullable<CardDefinition["abilities"]>[number],
  iceDefinition: CardDefinition,
): boolean {
  if (ability.type !== "break_subroutine") return false;
  if (
    ability.iceSubtype &&
    !iceDefinition.subtypes.includes(ability.iceSubtype)
  )
    return false;
  return true;
}

function breakAbilityMatchesSubroutine(
  ability: NonNullable<CardDefinition["abilities"]>[number],
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): boolean {
  const tags = ability.subroutineBreakTags ?? [];
  if (tags.length === 0) return true;
  const subroutineTags = subroutine.breakTags ?? [];
  return tags.some((tag) => subroutineTags.includes(tag));
}

function encounterSubroutinesForNextContinue(
  run: RunState,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
): NonNullable<CardDefinition["subroutines"]> {
  const nextSubroutines: NonNullable<CardDefinition["subroutines"]> = [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    )
      continue;
    nextSubroutines.push(subroutine);
    if (subroutine.type === "initiate_trace") break;
  }
  return nextSubroutines;
}

function runnerMovementActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (
    run.jackOutLockedUntilEncounterEnds ||
    run.nextEncounterJackOutLock ||
    run.jackOutLockedForRun
  ) {
    return [
      action(state, "runner", "continue_run", "Run fortsetzen", "game_rule"),
    ];
  }
  return [
    action(state, "runner", "jack_out", "Jack-out", "game_rule"),
    action(state, "runner", "continue_run", "Run fortsetzen", "game_rule"),
  ];
}

function v1918RunStartTaxForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
  const server = mustServer(state, serverId);
  const sourceDefinitionIds = server.root
    .filter((cardId) => mustInstance(state.cardInstances, cardId).rezzed)
    .map((cardId) => definitionFor(state, cardId).id)
    .filter((definitionId) => V1918_RUN_TAX_UPGRADE_IDS.has(definitionId));
  return {
    amount: sourceDefinitionIds.length,
    sourceDefinitionIds,
  };
}

function availableRunnerRunStartCredits(state: GameState): number {
  return state.runner.credits + runnerRunRecurringCredits(state);
}

function runnerAccessActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.accessedCardId) {
    if (hasPendingAccessCandidate(state, run))
      return [
        action(state, "runner", "access_card", "Karte accessen", "game_rule"),
      ];
    return [
      action(
        state,
        "runner",
        "continue_run",
        "Zugriff abschließen",
        "game_rule",
      ),
    ];
  }
  const definition = definitionFor(state, run.accessedCardId);
  const freeTrashEnabled = canFreeTrashCurrentAccessCard(
    state,
    run,
    definition,
  );
  if (definition.type === "agenda") {
    const oliviaSalazarId = oliviaSalazarCardIdForCurrentAccess(state, run);
    if (oliviaSalazarId) {
      const forfeitAgendaCardId = pickRunnerAgendaForAgendaPointCost(state);
      if (!forfeitAgendaCardId) {
        return [
          action(
            state,
            "runner",
            "decline_trash",
            `${definition.title} nicht stehlen`,
            "game_rule",
            [],
            {
              cardId: run.accessedCardId,
              v1919UpgradeAbility: "olivia_salazar_steal_cost",
              oliviaSalazarCardId: oliviaSalazarId,
              stealBlockedByAgendaPointCost: true,
            },
          ),
        ];
      }
      return [
        action(
          state,
          "runner",
          "steal_agenda",
          `${definition.title} stehlen`,
          run.accessedCardId,
          [],
          {
            cardId: run.accessedCardId,
            v1919UpgradeAbility: "olivia_salazar_steal_cost",
            oliviaSalazarCardId: oliviaSalazarId,
            forfeitAgendaCardId,
            agendaPointCost: 1,
          },
        ),
      ];
    }
    const redHerringsId = redHerringsCardIdForCurrentAccess(state, run);
    if (redHerringsId) {
      const stealCost = 5;
      if (state.runner.credits < stealCost) {
        return [
          action(
            state,
            "runner",
            "decline_trash",
            `${definition.title} nicht stehlen`,
            "game_rule",
            [],
            {
              cardId: run.accessedCardId,
              v1918UpgradeAbility: "red_herrings_steal_tax",
              redHerringsCardId: redHerringsId,
              stealAdditionalCost: stealCost,
              stealBlockedByCost: true,
            },
          ),
        ];
      }
      return [
        action(
          state,
          "runner",
          "steal_agenda",
          `${definition.title} stehlen`,
          run.accessedCardId,
          [{ credits: stealCost }],
          {
            cardId: run.accessedCardId,
            v1918UpgradeAbility: "red_herrings_steal_tax",
            redHerringsCardId: redHerringsId,
            stealAdditionalCost: stealCost,
          },
        ),
      ];
    }
    return [
      action(
        state,
        "runner",
        "steal_agenda",
        `${definition.title} stehlen`,
        run.accessedCardId,
      ),
    ];
  }
  if (definition.type === "asset" || definition.type === "upgrade") {
    const actions: LegalAction[] = [];
    if (freeTrashEnabled) {
      actions.push(
        action(
          state,
          "runner",
          "trash_accessed_card",
          `${definition.title} kostenlos trashen`,
          run.accessedCardId,
          [],
          {
            accessTrashCostOverride: 0,
            freeAccessTrash: true,
          },
        ),
      );
    } else if (state.runner.credits >= (definition.trashCost ?? 0)) {
      actions.push(
        action(
          state,
          "runner",
          "trash_accessed_card",
          `${definition.title} trashen`,
          run.accessedCardId,
          [{ credits: definition.trashCost ?? 0 }],
        ),
      );
    }
    actions.push(
      action(state, "runner", "decline_trash", "Nicht trashen", "game_rule"),
    );
    return actions;
  }
  if (freeTrashEnabled) {
    return [
      action(
        state,
        "runner",
        "trash_accessed_card",
        `${definition.title} kostenlos trashen`,
        run.accessedCardId,
        [],
        {
          accessTrashCostOverride: 0,
          freeAccessTrash: true,
        },
      ),
      action(
        state,
        "runner",
        "decline_trash",
        run.breach ? "Weiter accessen" : "Access abschließen",
        "game_rule",
      ),
    ];
  }
  return [
    action(
      state,
      "runner",
      "decline_trash",
      run.breach ? "Weiter accessen" : "Access abschließen",
      "game_rule",
    ),
  ];
}

function redHerringsCardIdForCurrentAccess(
  state: GameState,
  run: ActiveRun,
): CardInstanceId | undefined {
  const serverId =
    run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
  return rezzedRootCardIdOnServer(state, serverId, V1918_RED_HERRINGS_ID);
}

function oliviaSalazarCardIdForCurrentAccess(
  state: GameState,
  run: ActiveRun,
): CardInstanceId | undefined {
  const serverId =
    run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
  return rezzedRootCardIdOnServer(state, serverId, V1919_OLIVIA_SALAZAR_ID);
}

function hasPendingAccessCandidate(state: GameState, run: ActiveRun): boolean {
  if (run.breach)
    return run.breach.queue[run.breach.currentIndex]?.status === "pending";
  const server = mustServer(state, run.attackedServerId);
  if (server.id === "rd") return state.corp.rd.length > 0;
  if (server.id === "hq") return state.corp.hq.length > 0;
  if (server.id === "archives") return state.corp.archives.length > 0;
  return server.root.length > 0;
}

function canFreeTrashCurrentAccessCard(
  state: GameState,
  run: ActiveRun,
  definition: CardDefinition,
): boolean {
  if (definition.type === "agenda") return false;
  const allowedZones = run.freeTrashAccessZones ?? [];
  if (allowedZones.length === 0) return false;
  const currentZone =
    run.breach?.queue[run.breach.currentIndex]?.zone ??
    accessQueueZone(run.accessServerOverride ?? run.attackedServerId);
  if (currentZone !== "rd" && currentZone !== "hq") return false;
  return allowedZones.includes(currentZone);
}

function performAction(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  switch (legalAction.type) {
    case "mandatory_draw":
      drawCorpCard(state);
      if (state.winner) return;
      state.phase = "corp_action_phase";
      state.timingPoint = "corp_action.main";
      state.activeSide = "corp";
      return;
    case "gain_credit":
      spendClick(state, legalAction.side);
      if (legalAction.payload?.v1911HiddenZoneAbility) {
        resolveV1911RunnerHiddenZoneAbility(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.agendaAbility ===
        "v1911_corporate_downsizing_reveal_rd_top"
      ) {
        resolveV1911CorporateDownsizing(state, legalAction);
        return;
      }
      if (legalAction.payload?.v1912CounterAbility === "reveal_stack_top") {
        if (legalAction.side !== "runner")
          throw new Error(
            "Nur der Runner darf diese V1.9.12 Counter-Faehigkeit nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.programs.includes(sourceCardId))
          throw new Error(
            "Die V1.9.12 Counter-Faehigkeit ist nicht installiert.",
          );
        if (definitionFor(state, sourceCardId).id !== I_SPY_ID)
          throw new Error(
            "Die V1.9.12 Counter-Faehigkeit passt nicht zur Karte.",
          );
        revealRunnerStackTop(state, legalAction);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneAction: "v1912_reveal_stack_top",
        };
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "gain_credits") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.17-Asset-Faehigkeiten nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1917_ECONOMY_ASSET_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.17-Asset-Faehigkeit passt nicht zur Karte.",
          );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 2)
          throw new Error(
            "V1.9.17-Economy-Assets gewaehrt in diesem WIP genau 2 Credits.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "trace_3_tag") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.17-Asset-Traces nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-Trace-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1917_TRACE_ASSET_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.17-Trace-Asset-Faehigkeit passt nicht zur Karte.",
          );
        const traceStrength = Number(legalAction.payload?.traceStrength ?? 0);
        const expectedTraceStrength =
          definition.id === "onr_v1_310_blood-cat" ? 5 : 3;
        if (
          !Number.isInteger(traceStrength) ||
          traceStrength !== expectedTraceStrength
        ) {
          throw new Error(
            "V1.9.17-Trace-Assets starten mit der kartenspezifischen Trace-Staerke.",
          );
        }
        startTraceFromOperation(
          state,
          definition.id,
          traceStrength,
          legalAction,
        );
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "reveal_rd_top") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.17-Hidden-Zone-Assets nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-Hidden-Zone-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1917_HIDDEN_REVEAL_ASSET_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.17-Hidden-Zone-Reveal-Faehigkeit passt nicht zur Karte.",
          );
        revealCorpRdTop(state, legalAction);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneAction: "v1917_corp_reveal_rd_top",
        };
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "reorder_rd_top2") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.17-Hidden-Zone-Assets nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-Hidden-Zone-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1917_HIDDEN_REORDER_ASSET_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.17-Hidden-Zone-Reorder-Faehigkeit passt nicht zur Karte.",
          );
        startV1917CorpRdArrangeChoice(state, sourceCardId, legalAction);
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "meat_damage_1") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.17-Damage-Assets nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-Damage-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1917_SOLO_SQUAD_ID)
          throw new Error(
            "Die V1.9.17-Damage-Faehigkeit passt nicht zur Karte.",
          );
        const damageAmount = Number(legalAction.payload?.damageAmount ?? 0);
        if (!Number.isInteger(damageAmount) || damageAmount !== 1)
          throw new Error(
            "Solo Squad nutzt in diesem V1.9.17-WIP genau 1 Meat Damage.",
          );
        resolveDamageOperation(
          state,
          legalAction,
          "meat",
          damageAmount,
          definition.id,
        );
        return;
      }
      if (
        legalAction.payload?.v1917AssetAbility === "trash_installed_runner_card"
      ) {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.17-installed-card-Assets nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-installed-card-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1917_COWBOY_SYSOP_ID)
          throw new Error(
            "Die V1.9.17-installed-card-Faehigkeit passt nicht zur Karte.",
          );
        const targetCardId = String(legalAction.payload?.targetCardId ?? "");
        if (!runnerInstalledCardIds(state).includes(targetCardId))
          throw new Error(
            "Das V1.9.17-installed-card-Ziel ist nicht mehr installiert.",
          );
        const targetDefinitionId = definitionFor(state, targetCardId).id;
        trashRunnerInstalledCardToHeap(state, targetCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "v1917_trash_installed_runner_card",
          trashedCardDefinitionId: targetDefinitionId,
        };
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "remove_virus_counter") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.17-Virus-Counter-Assets nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.17-Virus-Counter-Asset-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1917_DISINFECTANT_ID)
          throw new Error(
            "Die V1.9.17-Virus-Counter-Faehigkeit passt nicht zur Karte.",
          );
        const targetCardId = String(legalAction.payload?.targetCardId ?? "");
        if (!visibleVirusCounterTargetIds(state).includes(targetCardId))
          throw new Error(
            "Das V1.9.17-Virus-Counter-Ziel ist nicht mehr gueltig.",
          );
        const removeAmount = Number(
          legalAction.payload?.removeCounterAmount ?? 0,
        );
        if (!Number.isInteger(removeAmount) || removeAmount !== 1)
          throw new Error(
            "Disinfectant, Inc. entfernt in V1.9.17 genau 1 Virus-Counter.",
          );
        spendCardCounter(state, targetCardId, "virus", removeAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "v1917_remove_virus_counter",
          counterType: "virus",
          removedCounterAmount: removeAmount,
          remainingCounters: cardCounter(state, targetCardId, "virus"),
          targetCardDefinitionId: definitionFor(state, targetCardId).id,
        };
        return;
      }
      if (legalAction.payload?.v1918UpgradeAbility === "add_power_counter") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.18-Upgrade-Counter nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.18-Upgrade-Counter-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1918_COUNTER_UPGRADE_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.18-Counter-Faehigkeit passt nicht zur Karte.",
          );
        const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
        if (!Number.isInteger(addAmount) || addAmount !== 1)
          throw new Error(
            "V1.9.18-Counter-Upgrades laden in diesem WIP genau 1 Power-Counter.",
          );
        addCardCounter(state, sourceCardId, "power", addAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          addedCounterAmount: addAmount,
          remainingCounters: cardCounter(state, sourceCardId, "power"),
        };
        return;
      }
      if (legalAction.payload?.v1918UpgradeAbility === "reveal_rd_top") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.18-City-Grid-Reveals nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.18-City-Grid-Faehigkeit ist nicht rezzed installiert.",
          );
        if (
          definitionFor(state, sourceCardId).id !==
          V1918_NEW_GALVESTON_CITY_GRID_ID
        )
          throw new Error(
            "Die V1.9.18-City-Grid-Reveal-Faehigkeit passt nicht zur Karte.",
          );
        revealCorpRdTop(state, legalAction);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneAction: "v1918_city_grid_reveal_rd_top",
        };
        return;
      }
      if (legalAction.payload?.v1918UpgradeAbility === "trace_2_tag") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.18-City-Grid-Traces nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.18-City-Grid-Trace-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1918_PARIS_CITY_GRID_ID)
          throw new Error(
            "Die V1.9.18-City-Grid-Trace-Faehigkeit passt nicht zur Karte.",
          );
        const traceStrength = Number(legalAction.payload?.traceStrength ?? 0);
        if (!Number.isInteger(traceStrength) || traceStrength !== 2)
          throw new Error(
            "Paris City Grid startet in diesem WIP genau Trace 2.",
          );
        startTraceFromOperation(
          state,
          definition.id,
          traceStrength,
          legalAction,
        );
        return;
      }
      if (legalAction.payload?.v1918UpgradeAbility === "tag_condition_credit") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.18-Tag-Condition-Upgrades nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.18-Tag-Condition-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1918_TAG_CONDITION_UPGRADE_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.18-Tag-Condition-Faehigkeit passt nicht zur Karte.",
          );
        if (state.runner.tags <= 0)
          throw new Error("Der Runner ist nicht getaggt.");
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 1)
          throw new Error(
            "V1.9.18-Tag-Condition-Upgrades gewaehrten in diesem WIP genau 1 Credit.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          corpCreditsAfter: state.corp.credits,
          runnerTagsAfter: state.runner.tags,
        };
        return;
      }
      if (legalAction.payload?.v1919AssetAbility === "add_power_counter") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.19-Asset-Counter nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.19-Asset-Counter-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1919_COUNTER_ASSET_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.19-Asset-Counter-Faehigkeit passt nicht zur Karte.",
          );
        const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
        if (!Number.isInteger(addAmount) || addAmount !== 1)
          throw new Error(
            "V1.9.19-Counter-Assets laden in diesem WIP genau 1 Power-Counter.",
          );
        addCardCounter(state, sourceCardId, "power", addAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          addedCounterAmount: addAmount,
          remainingCounters: cardCounter(state, sourceCardId, "power"),
        };
        return;
      }
      if (legalAction.payload?.v1919AssetAbility === "gain_credits") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.19-Asset-Economy nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.19-Asset-Economy-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1919_INFORMATION_LAUNDERING_ID)
          throw new Error(
            "Die V1.9.19-Asset-Economy-Faehigkeit passt nicht zur Karte.",
          );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 2)
          throw new Error(
            "Information Laundering gewaehrt in diesem V1.9.19-WIP genau 2 Credits.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (legalAction.payload?.v1920AssetAbility === "gain_actions") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.20-Asset-Action-Economy nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.20-Asset-Action-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1920_ACTION_ASSET_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.20-Asset-Action-Faehigkeit passt nicht zur Karte.",
          );
        const gainedActions = Number(legalAction.payload?.gainedActions ?? 0);
        if (!Number.isInteger(gainedActions) || gainedActions !== 2)
          throw new Error(
            "V1.9.20-Action-Assets gewaehrten in diesem WIP genau 2 Aktionen.",
          );
        state.corp.clicks += gainedActions;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedActions,
          corpClicksAfter: state.corp.clicks,
        };
        return;
      }
      if (
        legalAction.payload?.v1921AssetAbility === "deterministic_die_probe"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.21-Asset-Zufall nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.21-Asset-Zufallsfaehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1921_SCHLAGHUND_ID)
          throw new Error(
            "Die V1.9.21-Asset-Zufallsfaehigkeit passt nicht zur Karte.",
          );
        const randomPurpose = `v1921.die.${definition.id}.asset_probe`;
        const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          randomPurpose,
          v1921DieRoll: dieRoll,
          randomCounterAfter: state.randomCounter,
        };
        return;
      }
      if (
        legalAction.payload?.v1921UpgradeAbility ===
        "deterministic_server_die_probe"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.21-Upgrade-Zufall nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.21-Upgrade-Zufallsfaehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1921_RIO_DE_JANEIRO_CITY_GRID_ID)
          throw new Error(
            "Die V1.9.21-Upgrade-Zufallsfaehigkeit passt nicht zur Karte.",
          );
        const randomPurpose = `v1921.die.${definition.id}.server_probe`;
        const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          randomPurpose,
          v1921DieRoll: dieRoll,
          randomCounterAfter: state.randomCounter,
        };
        return;
      }
      if (
        legalAction.payload?.v1921RunnerProgramAbility ===
        "deterministic_die_probe"
      ) {
        if (legalAction.side !== "runner")
          throw new Error(
            "Nur der Runner darf V1.9.21-Programm-Zufall nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.programs.includes(sourceCardId))
          throw new Error(
            "Die V1.9.21-Programm-Zufallsfaehigkeit ist nicht installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (!V1921_RUNNER_RANDOM_PROGRAM_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.21-Programm-Zufallsfaehigkeit passt nicht zur Karte.",
          );
        const randomPurpose = `v1921.die.${definition.id}.program_probe`;
        const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          randomPurpose,
          v1921DieRoll: dieRoll,
          randomCounterAfter: state.randomCounter,
        };
        return;
      }
      if (
        legalAction.payload?.v1922RunnerProgramAbility ===
        "newsgroup_filter_gain_2"
      ) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf Newsgroup Filter nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.programs.includes(sourceCardId))
          throw new Error("Newsgroup Filter ist nicht installiert.");
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1922_NEWSGROUP_FILTER_ID)
          throw new Error(
            "Die V1.9.22-Programm-Faehigkeit passt nicht zu Newsgroup Filter.",
          );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 2)
          throw new Error(
            "Newsgroup Filter gewaehrt in diesem Scope genau 2 Credits.",
          );
        credits(state, "runner", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          runnerCreditsAfter: state.runner.credits,
        };
        return;
      }
      if (
        legalAction.payload?.v1921RunnerResourceAbility ===
        "deterministic_die_probe"
      ) {
        if (legalAction.side !== "runner")
          throw new Error(
            "Nur der Runner darf V1.9.21-Ressourcen-Zufall nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.resources.includes(sourceCardId))
          throw new Error(
            "Die V1.9.21-Ressourcen-Zufallsfaehigkeit ist nicht installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1921_QUEST_FOR_CATTEKIN_ID)
          throw new Error(
            "Die V1.9.21-Ressourcen-Zufallsfaehigkeit passt nicht zur Karte.",
          );
        const randomPurpose = `v1921.die.${definition.id}.resource_probe`;
        const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          randomPurpose,
          v1921DieRoll: dieRoll,
          randomCounterAfter: state.randomCounter,
        };
        return;
      }
      if (
        legalAction.payload?.v1919RunnerProgramAbility === "add_power_counter"
      ) {
        if (legalAction.side !== "runner")
          throw new Error(
            "Nur der Runner darf V1.9.19-Programm-Counter nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.programs.includes(sourceCardId))
          throw new Error(
            "Die V1.9.19-Programm-Counter-Faehigkeit ist nicht installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1919_FAIT_ACCOMPLI_ID)
          throw new Error(
            "Die V1.9.19-Programm-Counter-Faehigkeit passt nicht zur Karte.",
          );
        if (state.runner.scoreArea.length === 0)
          throw new Error(
            "Fait Accompli benoetigt eine Runner-Agenda als Agenda-Bezug.",
          );
        const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
        if (!Number.isInteger(addAmount) || addAmount !== 1)
          throw new Error(
            "Fait Accompli laedt in diesem V1.9.19-WIP genau 1 Power-Counter.",
          );
        addCardCounter(state, sourceCardId, "power", addAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          addedCounterAmount: addAmount,
          remainingCounters: cardCounter(state, sourceCardId, "power"),
        };
        return;
      }
      if (legalAction.payload?.resourceAbility === "databroker") {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf Databroker nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.resources.includes(sourceCardId))
          throw new Error("Databroker ist nicht installiert.");
        const agendaCost = Number(legalAction.payload?.agendaPointCost ?? 0);
        if (!Number.isInteger(agendaCost) || agendaCost !== 1)
          throw new Error("Der Databroker-Agenda-Kostenpfad ist ungueltig.");
        const forfeitAgendaCardId = String(
          legalAction.payload?.forfeitAgendaCardId ?? "",
        );
        forfeitRunnerAgendaForPointCost(state, forfeitAgendaCardId);
        if (legalAction.payload?.trashOnUse === true)
          trashRunnerInstalledCardToHeap(state, sourceCardId);
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 10);
        if (!Number.isInteger(gainAmount) || gainAmount <= 0)
          throw new Error("Der Databroker-Creditgewinn ist ungueltig.");
        credits(state, "runner", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          forfeitedAgendaCardId: forfeitAgendaCardId,
          agendaPointCostPaid: agendaCost,
          gainedCredits: gainAmount,
          specialZone: "removed_from_game",
          specialZoneVisibility: "public",
          specialZoneReason: "agenda_point_cost_databroker",
        };
        return;
      }
      if (legalAction.payload?.resourceAbility === "silicon_saloon_franchise") {
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.resources.includes(sourceCardId))
          throw new Error("Silicon Saloon Franchise ist nicht installiert.");
      }
      if (
        legalAction.payload?.agendaAbility === "corporate_coup" ||
        legalAction.payload?.agendaAbility === "political_coup"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Coup-Agenda-Counter ausgeben.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Die gewaehlte Coup-Agenda ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        const expectedDefinitionId =
          legalAction.payload?.agendaAbility === "corporate_coup"
            ? "onr_v1_193_corporate-coup"
            : "onr_v1_209_political-coup";
        if (definition.id !== expectedDefinitionId)
          throw new Error(
            "Die Agenda-Aktion passt nicht zur ausgewaehlten Coup-Agenda.",
          );
        const removeAmount = Number(
          legalAction.payload?.removePowerCounterAmount ?? 0,
        );
        const expectedRemoveAmount =
          definition.id === "onr_v1_193_corporate-coup" ? 1 : 3;
        if (
          !Number.isInteger(removeAmount) ||
          removeAmount !== expectedRemoveAmount
        )
          throw new Error(
            "Coup-Agenda muss genau den gültigen Counter-Betrag ausgeben.",
          );
        if (cardCounter(state, sourceCardId, "power") < removeAmount)
          throw new Error("Auf der Coup-Agenda sind nicht genug Counter.");
        spendCardCounter(state, sourceCardId, "power", removeAmount);
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        const expectedGainAmount =
          definition.id === "onr_v1_193_corporate-coup" ? 1 : 3;
        if (!Number.isInteger(gainAmount) || gainAmount !== expectedGainAmount)
          throw new Error(
            "Coup-Agenda gewaehrt in diesem Scope die falsche Anzahl Credits.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          spentPowerCounters: removeAmount,
          gainedCredits: gainAmount,
          remainingPowerCounters: cardCounter(state, sourceCardId, "power"),
        };
        return;
      }
      if (legalAction.payload?.agendaAbility === "v1922_political_overthrow") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Political Overthrow nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Political Overthrow ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1922_POLITICAL_OVERTHROW_ID)
          throw new Error(
            "Die Agenda-Aktion passt nicht zu Political Overthrow.",
          );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 3)
          throw new Error(
            "Political Overthrow gewaehrt in diesem Scope genau 3 Credits.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (legalAction.payload?.agendaAbility === "v1922_marine_arcology") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Marine Arcology nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Marine Arcology ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1922_MARINE_ARCOLOGY_ID)
          throw new Error("Die Agenda-Aktion passt nicht zu Marine Arcology.");
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 3)
          throw new Error(
            "Marine Arcology gewaehrt in diesem Scope genau 3 Credits.",
          );
        spendClick(state, "corp");
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (legalAction.payload?.agendaAbility === "v1922_corporate_retreat") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Corporate Retreat nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Corporate Retreat ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== V1922_CORPORATE_RETREAT_ID)
          throw new Error(
            "Die Agenda-Aktion passt nicht zu Corporate Retreat.",
          );
        if (!isV1922CorporateRetreatAbilityAvailable(state, sourceCardId))
          throw new Error(
            "Corporate Retreat ist nach Install oder Rez nicht mehr verfuegbar.",
          );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 2)
          throw new Error(
            "Corporate Retreat gewaehrt in diesem Scope genau 2 Credits.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (
        legalAction.payload?.agendaAbility === "v1912_detroit_police_contract"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Detroit Police Contract nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Detroit Police Contract ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== DETROIT_POLICE_CONTRACT_ID)
          throw new Error(
            "Die Agenda-Aktion passt nicht zu Detroit Police Contract.",
          );
        const removeAmount = Number(
          legalAction.payload?.removePowerCounterAmount ?? 0,
        );
        if (!Number.isInteger(removeAmount) || removeAmount !== 1)
          throw new Error(
            "Detroit Police Contract muss genau 1 Counter ausgeben.",
          );
        if (cardCounter(state, sourceCardId, "power") < removeAmount)
          throw new Error(
            "Auf Detroit Police Contract sind nicht genug Counter.",
          );
        spendCardCounter(state, sourceCardId, "power", removeAmount);
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 1)
          throw new Error(
            "Detroit Police Contract gewaehrt in diesem Scope genau 1 Credit.",
          );
        credits(state, "corp", gainAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          spentPowerCounters: removeAmount,
          gainedCredits: gainAmount,
          remainingPowerCounters: cardCounter(state, sourceCardId, "power"),
        };
        return;
      }
      if (
        legalAction.payload?.agendaAbility ===
        "v1919_scored_agenda_reveal_rd_top"
      ) {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf V1.9.19-Scored-Agenda-Faehigkeiten nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Die V1.9.19-Scored-Agenda ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        if (!V1919_SCORED_REVEAL_AGENDA_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.19-Scored-Agenda-Faehigkeit passt nicht zur Karte.",
          );
        revealCorpRdTop(state, legalAction);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneAction: "v1919_scored_agenda_reveal_rd_top",
        };
        return;
      }
      if (legalAction.payload?.agendaAbility === "ai_chief_financial_officer") {
        if (legalAction.side !== "corp")
          throw new Error(
            "Nur die Korp darf die AI Chief Financial Officer Agenda-Aktion nutzen.",
          );
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error(
            "Die gewaehlte AI Chief Financial Officer Agenda ist nicht gescort.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== AI_CHIEF_FINANCIAL_OFFICER_ID)
          throw new Error(
            "Die Agenda-Aktion passt nicht zur ausgewaehlten AI Chief Financial Officer Agenda.",
          );
        resolveAiChiefFinancialOfficer(state, sourceCardId, legalAction);
        return;
      }
      if (
        legalAction.payload?.agendaAbility === "netwatch_operations_office" ||
        legalAction.payload?.agendaAbility === "private_cybernet_police"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf diese Agenda-Aktion nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Die gewaehlte Trace-Agenda ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        const expectedDefinitionId =
          legalAction.payload?.agendaAbility === "netwatch_operations_office"
            ? NETWATCH_OPERATIONS_OFFICE_ID
            : PRIVATE_CYBERNET_POLICE_ID;
        if (definition.id !== expectedDefinitionId)
          throw new Error(
            "Die Agenda-Aktion passt nicht zur ausgewaehlten Trace-Agenda.",
          );
        const traceStrength = Number(legalAction.payload?.traceStrength ?? 0);
        const expectedTraceStrength =
          legalAction.payload?.agendaAbility === "netwatch_operations_office"
            ? 2
            : 5;
        if (
          !Number.isInteger(traceStrength) ||
          traceStrength !== expectedTraceStrength
        )
          throw new Error("Die Agenda-Trace-Staerke ist ungueltig.");
        startTraceFromOperation(
          state,
          definition.id,
          traceStrength,
          legalAction,
        );
        return;
      }
      if (
        legalAction.payload?.agendaAbility === "on_call_solo_team" ||
        legalAction.payload?.agendaAbility === "strike_force_kali"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf diese Agenda-Aktion nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.corp.scoreArea.includes(sourceCardId))
          throw new Error("Die gewaehlte Damage-Agenda ist nicht gescort.");
        const definition = definitionFor(state, sourceCardId);
        const expectedDefinitionId =
          legalAction.payload?.agendaAbility === "on_call_solo_team"
            ? ON_CALL_SOLO_TEAM_ID
            : STRIKE_FORCE_KALI_ID;
        if (definition.id !== expectedDefinitionId)
          throw new Error(
            "Die Agenda-Aktion passt nicht zur ausgewaehlten Damage-Agenda.",
          );
        requireRunnerTagged(state);
        const damageAmount = Number(legalAction.payload?.damageAmount ?? 0);
        const expectedDamageAmount =
          definition.id === ON_CALL_SOLO_TEAM_ID ? 1 : 2;
        if (
          !Number.isInteger(damageAmount) ||
          damageAmount !== expectedDamageAmount
        )
          throw new Error("Die Damage-Menge der Agenda-Aktion ist ungueltig.");
        resolveDamageOperation(
          state,
          legalAction,
          "meat",
          damageAmount,
          definition.id,
        );
        return;
      }
      credits(state, legalAction.side, 1);
      if (legalAction.payload?.drawCardAfter === true) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf mit diesem Effekt ziehen.");
        drawRunnerCard(state);
      }
      return;
    case "draw_card":
      spendClick(state, legalAction.side);
      legalAction.side === "runner"
        ? drawRunnerCard(state)
        : drawCorpCard(state);
      return;
    case "play_event":
      playRunnerEvent(state, legalAction);
      return;
    case "play_operation":
      spendClick(state, "corp");
      spendCredits(state, "corp", legalAction.costs[0]?.credits ?? 0);
      if (legalAction.payload?.cardId) {
        const cardId = String(legalAction.payload.cardId);
        const definition = definitionFor(state, cardId);
        removeFromAllZones(state, cardId);
        state.corp.archives.push(cardId);
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          faceup: true,
          rezzed: true,
          zone: { side: "corp", zone: "archives" },
        };
        resolveCorpOperation(state, definition, legalAction);
        if (definition.id === "v098_hq_rd_swap_operation") {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            hiddenZoneBarrier: true,
            hiddenZoneAction: "swap_hq_rd",
          };
        }
        if (definition.id === "v099_bad_publicity_operation") {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            badPublicityAfter: state.corp.badPublicity,
          };
        }
      }
      return;
    case "install_card":
      installCard(state, legalAction);
      return;
    case "advance_card":
      spendClick(state, "corp");
      spendCredits(state, "corp", 1);
      mustInstance(
        state.cardInstances,
        String(legalAction.payload?.cardId),
      ).advancementCounters += 1;
      return;
    case "score_agenda":
      scoreAgenda(state, String(legalAction.payload?.cardId), legalAction);
      return;
    case "start_run":
      if (legalAction.payload?.bonusRunNoClick === true) {
        ensureRunnerTurnFlags(state).allNighterBonusRunPending = false;
      } else {
        spendClick(state, "runner");
      }
      startRun(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
      );
      if (legalAction.payload?.v1918UpgradeAbility === "run_start_tax") {
        const taxCredits = legalAction.costs.reduce(
          (sum, cost) =>
            sum + (Number.isInteger(cost.credits) ? (cost.credits ?? 0) : 0),
          0,
        );
        if (taxCredits > 0) spendRunnerRunCredits(state, taxCredits);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          runStartTaxPaid: taxCredits,
          runnerCreditsAfter: state.runner.credits,
        };
      }
      return;
    case "jack_out":
      finishRun(state, false);
      return;
    case "rez_ice":
      rezCard(
        state,
        String(legalAction.payload?.cardId),
        legalAction.payload?.rootRez === true ||
          legalAction.payload?.assetRez === true,
      );
      expireV1922CorporateRetreatAbilities(state);
      return;
    case "decline_rez":
      passApproachedIce(state);
      return;
    case "pump_breaker":
      {
        const breakerId =
          typeof legalAction.payload?.breakerId === "string"
            ? (String(legalAction.payload.breakerId) as CardInstanceId)
            : undefined;
        spendRunnerRunCredits(
          state,
          legalAction.costs[0]?.credits ?? 1,
          breakerId,
        );
        if (breakerId && shouldOpenAardvarkInterception(state, breakerId)) {
          startAardvarkInterceptionChoice(
            state,
            breakerId,
            "pump_breaker",
            legalAction,
          );
          return;
        }
        if (
          breakerId &&
          definitionFor(state, breakerId).id === GRUBB_ID &&
          state.run
        ) {
          const run = mustRun(state);
          const previous = runRemainderStrengthBonusForBreaker(run, breakerId);
          run.remainderStrengthBonusByBreaker = {
            ...(run.remainderStrengthBonusByBreaker ?? {}),
            [breakerId]: previous + 1,
          };
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            runRemainderStrengthBonusApplied: true,
            runRemainderStrengthBonusAfter: previous + 1,
          };
          return;
        }
        if (
          breakerId &&
          definitionFor(state, breakerId).id === V1922_JAPANESE_WATER_TORTURE_ID
        ) {
          executeEffectCommands(state, [
            { type: "change_breaker_strength", breakerId, amount: 1 },
          ]);
          addRunnerFutureActionDebt(state, 1);
          const pendingDebt = Math.max(
            0,
            Math.floor(
              ensureRunnerTurnFlags(state).forgoNextActionsPending ?? 0,
            ),
          );
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            v1922RunnerProgramAbility:
              "japanese_water_torture_future_action_debt",
            futureActionDebtAdded: 1,
            futureActionDebtPending: pendingDebt,
            breakerStrengthAfter:
              (definitionFor(state, breakerId).strength ?? 0) +
              mustInstance(state.cardInstances, breakerId).strengthModifier,
          };
          return;
        }
        executeEffectCommands(state, [
          {
            type: "change_breaker_strength",
            breakerId: String(legalAction.payload?.breakerId),
            amount: 1,
          },
        ]);
      }
      return;
    case "break_subroutine": {
      const breakerId =
        typeof legalAction.payload?.breakerId === "string"
          ? (String(legalAction.payload.breakerId) as CardInstanceId)
          : undefined;
      spendRunnerRunCredits(
        state,
        legalAction.costs[0]?.credits ?? 1,
        breakerId,
      );
      if (breakerId && shouldOpenAardvarkInterception(state, breakerId)) {
        startAardvarkInterceptionChoice(
          state,
          breakerId,
          "break_subroutine",
          legalAction,
        );
        return;
      }
      if (breakerId) {
        const breakerDefinition = definitionFor(state, breakerId);
        if (breakerDefinition.id === BLINK_ID) {
          resolveBlinkBreakSubroutineAction(
            state,
            breakerId,
            Number(legalAction.payload?.subroutineIndex),
            legalAction,
          );
          return;
        }
      }
      executeEffectCommands(state, [
        {
          type: "break_subroutine",
          subroutineIndex: Number(legalAction.payload?.subroutineIndex),
        },
      ]);
      if (breakerId) {
        applyPostBreakStealthLoss(state, breakerId, legalAction);
        recordBartmossEncounterUsage(state, breakerId);
      }
      return;
    }
    case "continue_run":
      continueRun(state, legalAction);
      return;
    case "access_card":
      accessCurrentCard(state, legalAction);
      return;
    case "steal_agenda":
      spendCredits(state, "runner", legalAction.costs[0]?.credits ?? 0);
      if (
        legalAction.payload?.v1919UpgradeAbility === "olivia_salazar_steal_cost"
      ) {
        if (legalAction.side !== "runner")
          throw new Error(
            "Nur der Runner darf Olivia Salazar-Stehlkosten bezahlen.",
          );
        const run = mustRun(state);
        const oliviaSalazarId = oliviaSalazarCardIdForCurrentAccess(state, run);
        if (
          !oliviaSalazarId ||
          oliviaSalazarId !== legalAction.payload.oliviaSalazarCardId
        ) {
          throw new Error(
            "Olivia Salazar ist fuer diesen Zugriff nicht aktiv.",
          );
        }
        const agendaCost = Number(legalAction.payload.agendaPointCost ?? 0);
        if (!Number.isInteger(agendaCost) || agendaCost !== 1)
          throw new Error("Olivia Salazar verlangt genau 1 Agenda-Punkt.");
        const forfeitAgendaCardId = String(
          legalAction.payload.forfeitAgendaCardId ?? "",
        );
        forfeitRunnerAgendaForPointCost(state, forfeitAgendaCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          forfeitedAgendaCardId: forfeitAgendaCardId,
          agendaPointCostPaid: agendaCost,
          specialZone: "removed_from_game",
          specialZoneVisibility: "public",
          specialZoneReason: "v1919_olivia_salazar",
        };
      }
      stealAgenda(state, mustRun(state).accessedCardId ?? "");
      return;
    case "trash_accessed_card":
      trashAccessedCard(
        state,
        mustRun(state).accessedCardId ?? "",
        legalAction,
      );
      return;
    case "trash_resource":
      trashResource(
        state,
        String(
          legalAction.payload?.resourceId ?? legalAction.payload?.cardId ?? "",
        ),
      );
      return;
    case "decline_trash":
      declineCurrentAccess(state);
      return;
    case "remove_tag":
      spendClick(state, "runner");
      if (legalAction.payload?.resourceAbility === "danshis_second_id") {
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.resources.includes(sourceCardId))
          throw new Error("Danshi's Second ID ist nicht installiert.");
        const requested = Number(legalAction.payload?.removeTagAmount ?? 0);
        if (!Number.isInteger(requested) || requested <= 0 || requested > 3)
          throw new Error("Die Tag-Entfernung ist ungueltig.");
        state.runner.tags = Math.max(0, state.runner.tags - requested);
        if (legalAction.payload?.trashOnUse === true) {
          trashRunnerInstalledCardToHeap(state, sourceCardId);
        }
        return;
      }
      spendCredits(state, "runner", 2);
      state.runner.tags = Math.max(0, state.runner.tags - 1);
      return;
    case "purge_virus_counters": {
      spendClicks(state, "corp", 3);
      const purged = purgeVirusCounters(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        purgedVirusCounters: purged,
        purgedCounterType: "virus",
      };
      return;
    }
    case "move_to_set_aside":
      moveToSpecialZone(state, legalAction, "set_aside");
      return;
    case "move_to_removed_from_game":
      moveToSpecialZone(state, legalAction, "removed_from_game");
      return;
    case "return_from_set_aside":
      returnFromSetAside(state, legalAction);
      return;
    case "change_card_control":
      changeCardControl(state, legalAction);
      return;
    case "resolve_choice":
      resolvePendingChoice(state, legalAction, playerAction);
      return;
    case "end_turn":
      endTurn(state, legalAction.side);
      return;
    case "trigger_ability":
      throw new Error(
        "Generische Abilities sind vorbereitet, aber in V0.93 nicht sichtbar freigeschaltet.",
      );
  }
}

function playRunnerEvent(state: GameState, legalAction: LegalAction): void {
  spendClick(state, "runner");
  spendCredits(state, "runner", legalAction.costs[0]?.credits ?? 0);
  const cardId = String(legalAction.payload?.cardId);
  const definition = definitionFor(state, cardId);
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    zone: { side: "runner", zone: "heap" },
  };
  const resolver = RUNNER_EVENT_RESOLVERS[definition.id];
  if (!resolver) throw new Error(`Kein Event-Resolver fuer ${definition.id}.`);
  resolver.resolve(state, legalAction);
}

function resolveMitWestTier(state: GameState, legalAction: LegalAction): void {
  const cardId = String(legalAction.payload?.cardId);
  removeFromAllZones(state, cardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.removedFromGame.push(cardId);
  specialZones.removedFromGame.sort();
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    zone: { side: "special", zone: "removed_from_game", visibility: "public" },
  };

  const allIds = [
    ...state.runner.grip,
    ...state.runner.heap,
    ...state.runner.stack,
  ].filter((id) => id !== cardId);
  state.runner.grip = [];
  state.runner.heap = [];
  state.runner.stack = shuffleStateIds(
    state,
    allIds,
    `onr_v1_101_mit_west_tier:${state.stateVersion + 1}`,
  );
  for (const id of state.runner.stack) {
    state.cardInstances[id] = {
      ...mustInstance(state.cardInstances, id),
      zone: { side: "runner", zone: "stack" },
    };
  }
  drawRunnerCards(state, 5);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "mit_west_tier_shuffle_grip_heap_stack",
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: "onr_v1_101_mit_west_tier",
  };
}

function resolveAiChiefFinancialOfficer(
  state: GameState,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const previousHq = state.corp.hq.slice();
  const previousArchives = state.corp.archives.slice();
  const merge = [...state.corp.rd, ...previousHq, ...previousArchives];
  state.corp.hq = [];
  state.corp.archives = [];
  state.corp.rd = shuffleStateIds(
    state,
    merge,
    `v192.shuffle.${AI_CHIEF_FINANCIAL_OFFICER_ID}.hq_archives_into_rd.${state.stateVersion + 1}`,
  );
  for (const cardId of state.corp.rd) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "rd" },
    };
  }
  const drawAmount = Math.max(
    0,
    Math.floor(Number(legalAction.payload?.drawCardsAmount ?? 5)),
  );
  const beforeDraw = state.corp.hq.length;
  drawCorpCards(state, drawAmount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId: agendaId,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "ai_cfo_shuffle_hq_archives_into_rd",
    shuffledCardsCount: previousHq.length + previousArchives.length,
    drawnCardsCount: state.corp.hq.length - beforeDraw,
  };
}

function installCard(state: GameState, legalAction: LegalAction): void {
  const cardId = String(legalAction.payload?.cardId);
  const definition = definitionFor(state, cardId);
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, legalAction.side, definition.id)
  ) {
    throw new Error(
      "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
    );
  }
  spendClick(state, legalAction.side);
  if (legalAction.side === "corp") expireV1922CorporateRetreatAbilities(state);
  if (legalAction.side === "runner") {
    const hostOnCardId =
      typeof legalAction.payload?.hostOnCardId === "string"
        ? String(legalAction.payload.hostOnCardId)
        : undefined;
    const selectedServerId =
      typeof legalAction.payload?.selectedServerId === "string"
        ? String(legalAction.payload.selectedServerId)
        : undefined;
    if (definition.type !== "program" && hostOnCardId) {
      throw new Error("Nur Programme koennen gehostet installiert werden.");
    }
    if (
      definition.type === "program" &&
      hostOnCardId &&
      !state.runner.rig.programs.includes(hostOnCardId)
    ) {
      throw new Error("Der angegebene Host ist nicht installiert.");
    }
    if (
      definition.type === "program" &&
      hostOnCardId &&
      !canHostProgramOnDaemon(state, hostOnCardId, definition)
    ) {
      throw new Error("Der angegebene Daemon-Host hat nicht genug freie MU.");
    }
    if (
      definition.id === "onr_v1_173_restrictive-net-zoning" &&
      (!selectedServerId || selectedServerId === "new_remote")
    ) {
      throw new Error(
        "Restrictive Net Zoning benötigt einen gültigen Zielserver.",
      );
    }
    const restrictiveTargetServerId =
      selectedServerId && selectedServerId !== "new_remote"
        ? (selectedServerId as Exclude<ServerId, "new_remote">)
        : undefined;
    if (definition.id === "onr_v1_156_corporate-ally") {
      const agendaCost = Number(
        legalAction.payload?.installAgendaPointCost ?? 0,
      );
      if (!Number.isInteger(agendaCost) || agendaCost !== 1)
        throw new Error(
          "Corporate Ally benötigt exakt 1 Agenda-Punkt als Zusatzkosten.",
        );
      const forfeitAgendaCardId = String(
        legalAction.payload?.forfeitAgendaCardId ?? "",
      );
      forfeitRunnerAgendaForPointCost(state, forfeitAgendaCardId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        agendaPointCostPaid: agendaCost,
        forfeitedAgendaCardId: forfeitAgendaCardId,
        specialZone: "removed_from_game",
        specialZoneVisibility: "public",
        specialZoneReason: "agenda_point_cost_corporate_ally",
      };
    }
    spendRunnerInstallCredits(
      state,
      definition.installCost ?? 0,
      definition.type,
    );
    removeFromAllZones(state, cardId);
    if (definition.type === "hardware") {
      state.runner.rig.hardware.push(cardId);
      if (definition.mechanics.includes("modify_memory_limit"))
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
      if ((definition.recurringCredits ?? 0) > 0)
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
    } else if (definition.type === "program") {
      state.runner.rig.programs.push(cardId);
      if (!hostOnCardId) state.runner.memoryUsed += definition.memoryCost ?? 0;
      if ((definition.recurringCredits ?? 0) > 0)
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
      if (definition.mechanics.includes("virus"))
        addCardCounter(state, cardId, "virus", 1);
    } else if (definition.type === "resource") {
      state.runner.rig.resources.push(cardId);
      if ((definition.recurringCredits ?? 0) > 0)
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
    } else {
      throw new Error(
        "Nur Programme, Hardware und Resources koennen vom Runner installiert werden.",
      );
    }
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
      ...(hostOnCardId ? { hostedOn: hostOnCardId } : {}),
      ...(definition.id === "onr_v1_173_restrictive-net-zoning" &&
      restrictiveTargetServerId
        ? { selectedServerId: restrictiveTargetServerId }
        : {}),
    };
    consumeV1922ValuPakInstallAction(state, legalAction);
    if (definition.id === "v099_host_resource")
      startRunnerHostingChoice(state, cardId, legalAction);
    return;
  }

  removeFromAllZones(state, cardId);
  const placement = legalAction.payload?.placement;
  if (placement === "ice") {
    const server =
      legalAction.payload?.serverId === "new_remote"
        ? createRemote(state)
        : mustServer(state, String(legalAction.payload?.serverId));
    spendCredits(state, "corp", legalAction.costs[0]?.credits ?? 0);
    server.ice.unshift(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: server.id },
    };
    consumeV1922EdgerunnerTempsInstallAction(state, legalAction);
    return;
  }

  const server =
    legalAction.payload?.serverId === "new_remote"
      ? createRemote(state)
      : mustServer(state, String(legalAction.payload?.serverId));
  if (!canInstallCorpRootCardInServer(state, definition, server)) {
    throw new Error(
      "In einem Außenserver darf nur eine Agenda oder ein Asset im Root installiert sein.",
    );
  }
  server.root.push(cardId);
  const regionInstall = isRegionUpgrade(definition);
  if (regionInstall) {
    spendCredits(
      state,
      "corp",
      legalAction.costs[0]?.credits ?? rezCostForCard(state, cardId),
    );
  }
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: regionInstall,
    rezzed: regionInstall,
    zone: { side: "corp", zone: "serverRoot", serverId: server.id },
  };
  if (regionInstall) {
    trashOlderRegionUpgradesInServer(state, server, cardId);
  }
  consumeV1922EdgerunnerTempsInstallAction(state, legalAction);
}

function canInstallCorpRootCardInServer(
  state: GameState,
  definition: CardDefinition,
  server: CorpServer,
): boolean {
  if (server.kind !== "remote") return false;
  if (definition.type === "upgrade") return true;
  if (definition.type !== "agenda" && definition.type !== "asset") return false;
  return !server.root.some((id) => {
    const installedType = definitionFor(state, id).type;
    return installedType === "agenda" || installedType === "asset";
  });
}

function trashTopRunnersConferenceOnRunStart(state: GameState): void {
  const toTrash = state.runner.rig.resources
    .filter(
      (cardId) => definitionFor(state, cardId).id === TOP_RUNNERS_CONFERENCE_ID,
    )
    .sort();
  for (const cardId of toTrash) {
    trashRunnerInstalledCardToHeap(state, cardId);
  }
}

type StartRunOptions = Pick<
  RunState,
  | "freeTrashAccessZones"
  | "grantAllNighterBonusRunOnFinish"
  | "accessServerOverride"
  | "successfulRunAccessReplacement"
  | "successfulRunCreditLoss"
  | "successfulRunRunnerTagGain"
  | "successfulRunCorpDraw"
  | "bypassFirstIceRemaining"
>;

function startRun(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  pendingSuccessBonusCredits?: number,
  accessCount = 1,
  options?: StartRunOptions,
): void {
  const server = mustServer(state, serverId);
  const flags = ensureRunnerTurnFlags(state);
  flags.runAttemptsThisTurn = (flags.runAttemptsThisTurn ?? 0) + 1;
  trashTopRunnersConferenceOnRunStart(state);
  const installedAccessBonus = v1915InstalledAccessBonus(state, server.id);
  applyV1915RunStartCounterHelpers(state);
  state.phase = "run";
  state.activeSide = "runner";
  state.run = {
    runId: `run_${state.stateVersion + 1}`,
    attackedServerId: server.id,
    phase: "approach_ice",
    position:
      server.ice.length > 0
        ? { kind: "ice", serverId: server.id, iceIndex: 0 }
        : { kind: "server", serverId: server.id },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    bartmossUsedBreakerIdsThisEncounter: [],
    aardvarkInterceptionIceIds: [],
    blinkUsedSubroutinesByBreakerThisEncounter: {},
    successful: false,
    accessCount: Math.max(1, Math.floor(accessCount)) + installedAccessBonus,
    ...(options?.freeTrashAccessZones?.length
      ? { freeTrashAccessZones: options.freeTrashAccessZones.slice() }
      : {}),
    ...(options?.grantAllNighterBonusRunOnFinish
      ? { grantAllNighterBonusRunOnFinish: true }
      : {}),
    ...(options?.accessServerOverride
      ? { accessServerOverride: options.accessServerOverride }
      : {}),
    ...(options?.successfulRunAccessReplacement
      ? {
          successfulRunAccessReplacement:
            options.successfulRunAccessReplacement,
        }
      : {}),
    ...(options?.successfulRunCreditLoss && options.successfulRunCreditLoss > 0
      ? { successfulRunCreditLoss: options.successfulRunCreditLoss }
      : {}),
    ...(options?.successfulRunRunnerTagGain &&
    options.successfulRunRunnerTagGain > 0
      ? { successfulRunRunnerTagGain: options.successfulRunRunnerTagGain }
      : {}),
    ...(options?.successfulRunCorpDraw && options.successfulRunCorpDraw > 0
      ? { successfulRunCorpDraw: options.successfulRunCorpDraw }
      : {}),
    ...(options?.bypassFirstIceRemaining
      ? { bypassFirstIceRemaining: true }
      : {}),
    ...(isV099OrLater(state)
      ? { badPublicityCredits: state.corp.badPublicity }
      : {}),
    ...(pendingSuccessBonusCredits ? { pendingSuccessBonusCredits } : {}),
  };
  if (server.ice.length > 0) {
    const approachedIceId = mustArrayValue(
      server.ice,
      0,
      "Server has no approached ice.",
    );
    state.run.approachedIceId = approachedIceId;
    approachOrEncounterIce(state, approachedIceId);
  } else {
    enterAccess(state);
  }
}

function rezCard(state: GameState, cardId: string, rootRez: boolean): void {
  const definition = definitionFor(state, cardId);
  spendCredits(state, "corp", rezCostForCard(state, cardId));
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    rezzed: true,
    faceup: true,
  };
  if (rootRez && CORP_ROOT_REZ_RESOLVERS[definition.id]) {
    CORP_ROOT_REZ_RESOLVERS[definition.id]?.resolve(state);
    return;
  }
  if (rootRez) return;
  beginEncounter(state, cardId as CardInstanceId);
}

function passApproachedIce(state: GameState): void {
  const run = mustRun(state);
  if (!run.approachedIceId) throw new Error("Kein ICE wird approached.");
  const ice = mustInstance(state.cardInstances, run.approachedIceId);
  if (ice.rezzed) {
    beginEncounter(state, run.approachedIceId);
    return;
  }
  movePastCurrentIce(state);
}

function approachOrEncounterIce(
  state: GameState,
  approachedIceId: CardInstanceId,
): void {
  const run = mustRun(state);
  const ice = mustInstance(state.cardInstances, approachedIceId);
  run.approachedIceId = approachedIceId;
  if (run.bypassFirstIceRemaining) {
    run.bypassFirstIceRemaining = false;
    movePastCurrentIce(state);
    return;
  }
  if (ice.rezzed) {
    beginEncounter(state, approachedIceId);
    return;
  }
  const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
  void _encounteredIceId;
  state.run = {
    ...runWithoutEncounter,
    phase: "approach_ice",
    approachedIceId,
  };
  state.timingPoint = "run.approach_ice";
  state.activeSide = "corp";
}

function beginEncounter(
  state: GameState,
  encounteredIceId: CardInstanceId,
): void {
  const run = mustRun(state);
  run.phase = "encounter_ice";
  run.encounteredIceId = encounteredIceId;
  run.brokenSubroutineIndexes = [];
  run.resolvedSubroutineIndexes = [];
  run.traceSuccessBySubroutineIndex = {};
  run.bartmossUsedBreakerIdsThisEncounter = [];
  run.blinkUsedSubroutinesByBreakerThisEncounter = {};
  if (run.nextEncounterNoBreakSubroutines) {
    run.noBreakSubroutinesActive = true;
    run.nextEncounterNoBreakSubroutines = false;
  } else {
    run.noBreakSubroutinesActive = false;
  }
  if (run.nextEncounterJackOutLock) {
    run.jackOutLockedUntilEncounterEnds = true;
    run.nextEncounterJackOutLock = false;
  } else {
    run.jackOutLockedUntilEncounterEnds = false;
  }
  const queuedFatalDamage = Math.max(
    0,
    Math.floor(run.nextEncounterFatalDamage ?? 0),
  );
  run.fatalDamageActiveForEncounter = queuedFatalDamage > 0;
  if (queuedFatalDamage > 0)
    run.fatalDamageAmountForEncounter = queuedFatalDamage;
  else delete run.fatalDamageAmountForEncounter;
  run.nextEncounterFatalDamage = 0;
  const encounterTax = Math.max(
    0,
    Math.floor(run.encounterTaxForFutureIce ?? 0),
  );
  if (encounterTax > 0) {
    if (availableRunnerRunCredits(state) < encounterTax) {
      finishRun(state, false);
      return;
    }
    spendRunnerRunCredits(state, encounterTax);
  }
  state.timingPoint = "run.encounter_ice";
  state.activeSide = "runner";
}

function continueRun(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  if (run.phase === "movement") {
    continueFromMovement(state);
    return;
  }
  if (run.phase !== "encounter_ice" || !run.encounteredIceId) {
    if (run.phase === "access") {
      finishRun(state, true);
      return;
    }
    throw new Error("Run kann in diesem Schritt nicht fortgesetzt werden.");
  }
  const definition = definitionFor(state, run.encounteredIceId);
  let ended = false;
  const damageSummaries: DamageSummary[] = [];
  const subroutines = definition.subroutines ?? [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      state.winner ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index) ||
      ended
    )
      continue;
    if (subroutine.requiresSuccessfulTraceSubroutineIndex !== undefined) {
      const traceIndex = subroutine.requiresSuccessfulTraceSubroutineIndex;
      if (run.traceSuccessBySubroutineIndex?.[traceIndex] !== true) {
        if (!run.resolvedSubroutineIndexes.includes(index))
          run.resolvedSubroutineIndexes.push(index);
        continue;
      }
    }
    if (subroutine.type === "corp_gain_credit")
      state.corp.credits += subroutine.amount ?? 1;
    if (subroutine.type === "runner_lose_credits")
      state.runner.credits = Math.max(
        0,
        state.runner.credits - (subroutine.amount ?? 1),
      );
    if (subroutine.type === "give_runner_tag")
      state.runner.tags += subroutine.amount ?? 1;
    if (subroutine.type === "initiate_trace") {
      startTraceFromSubroutine(
        state,
        run.encounteredIceId,
        index,
        subroutine,
        legalAction,
      );
      return;
    }
    if (subroutine.type === "do_damage") {
      const damageType = subroutine.damageType ?? "net";
      const event = createDamageImminentEvent(state, {
        damageId: `${run.runId}.${run.encounteredIceId}.${index}`,
        damageType,
        amount: subroutine.amount ?? 1,
        source: `subroutine:${definition.id}:${subroutine.id}`,
      });
      if (
        legalAction &&
        (openReplacementWindow(state, event, legalAction) ||
          openEventModificationWindow(state, event, legalAction))
      ) {
        if (!run.resolvedSubroutineIndexes.includes(index))
          run.resolvedSubroutineIndexes.push(index);
        return;
      }
      const summary = resolveDamageImminentEvent(state, event);
      damageSummaries.push(summary);
      if (legalAction) {
        setDamagePayload(
          legalAction,
          aggregateDamageSummaries(damageSummaries),
        );
      }
      if (state.winner) return;
    }
    if (subroutine.type === "trash_installed_program") {
      if (definition.id === BANPEI_ID) {
        resolveBanpeiProgramTrashSubroutine(state, legalAction);
      } else {
        const targetProgramId = pickRunnerProgramForUninstall(state);
        if (targetProgramId)
          trashRunnerInstalledProgram(state, targetProgramId);
      }
    }
    if (subroutine.type === "set_run_encounter_tax") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      run.encounterTaxForFutureIce =
        Math.max(0, Math.floor(run.encounterTaxForFutureIce ?? 0)) + amount;
    }
    if (subroutine.type === "set_run_future_strength_bonus") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      run.futureEncounterIceStrengthBonus =
        Math.max(0, Math.floor(run.futureEncounterIceStrengthBonus ?? 0)) +
        amount;
    }
    if (subroutine.type === "set_next_encounter_unless_fully_break_damage") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      run.nextEncounterFatalDamage =
        Math.max(0, Math.floor(run.nextEncounterFatalDamage ?? 0)) + amount;
    }
    if (subroutine.type === "set_next_encounter_lock") {
      run.nextEncounterNoBreakSubroutines = true;
      run.nextEncounterJackOutLock = true;
    }
    if (subroutine.type === "set_run_jack_out_lock") {
      run.jackOutLockedForRun = true;
    }
    if (subroutine.type === "set_runner_forgo_next_action") {
      applyRunnerForgoNextAction(state);
    }
    if (subroutine.type === "reveal_corp_rd_top") {
      if (definition.id !== ICE_PICK_WILLIE_ID)
        throw new Error("Die R&D-Reveal-Subroutine passt nicht zum ICE.");
      if (!legalAction)
        throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reveal.");
      revealCorpRdTop(state, legalAction);
    }
    if (subroutine.type === "reorder_corp_rd_top2") {
      if (definition.id !== TOO_MANY_DOORS_ID)
        throw new Error("Die R&D-Reorder-Subroutine passt nicht zum ICE.");
      startCorpRdArrangeChoice(state, run.encounteredIceId, index, legalAction);
      if (!run.resolvedSubroutineIndexes.includes(index))
        run.resolvedSubroutineIndexes.push(index);
      return;
    }
    if (subroutine.type === "rewind_run_to_rezzed_ice_by_die") {
      if (resolveVacuumLinkRewindSubroutine(state, run, legalAction)) return;
    }
    if (subroutine.type === "end_the_run") ended = true;
  }
  if (state.winner) return;
  const encounteredIceId = run.encounteredIceId;
  const encounterFullyBroken = encounteredIceId
    ? encounterWasFullyBrokenByRunner(run, subroutines)
    : false;
  if (encounteredIceId && encounterFullyBroken)
    recordRunFullyBrokenIce(run, encounteredIceId);
  if (run.fatalDamageActiveForEncounter) {
    const fatalDamageAmount = Math.max(
      0,
      Math.floor(run.fatalDamageAmountForEncounter ?? 0),
    );
    if (!encounterFullyBroken && fatalDamageAmount > 0 && encounteredIceId) {
      const summary = doDamage(state, {
        damageId: `${run.runId}.${encounteredIceId}.fatal_attractor`,
        damageType: "net",
        amount: fatalDamageAmount,
        source: "subroutine:onr_v1_242_fatal-attractor:next_encounter",
      });
      damageSummaries.push(summary);
      if (legalAction) {
        setDamagePayload(
          legalAction,
          aggregateDamageSummaries(damageSummaries),
        );
      }
      if (state.winner) return;
    }
  }
  run.fatalDamageActiveForEncounter = false;
  delete run.fatalDamageAmountForEncounter;
  run.noBreakSubroutinesActive = false;
  run.jackOutLockedUntilEncounterEnds = false;
  resetBreakerStrength(state);
  if (ended) {
    finishRun(state, false);
    return;
  }
  applyBartmossPostEncounterTrigger(state, run);
  movePastCurrentIce(state);
}

function encounterWasFullyBrokenByRunner(
  run: ActiveRun,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
): boolean {
  if (subroutines.length === 0) return true;
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (!subroutine) continue;
    if (!run.brokenSubroutineIndexes.includes(index)) return false;
  }
  return true;
}

function applyBartmossPostEncounterTrigger(
  state: GameState,
  run: ActiveRun,
): void {
  const usedBreakerIds = run.bartmossUsedBreakerIdsThisEncounter?.slice() ?? [];
  if (usedBreakerIds.length === 0) return;
  const encounteredIceId = run.encounteredIceId ?? "unknown_ice";
  for (const breakerId of usedBreakerIds) {
    if (!state.runner.rig.programs.includes(breakerId)) continue;
    if (definitionFor(state, breakerId).id !== BARTMOSS_ID) continue;
    const die = rollDeterministicDie(
      state,
      `${BARTMOSS_ID}.post_encounter.${run.runId}.${encounteredIceId}.${breakerId}`,
    );
    if (die === 1) trashRunnerInstalledProgram(state, breakerId);
  }
}

function resolveBlinkBreakSubroutineAction(
  state: GameState,
  breakerId: CardInstanceId,
  subroutineIndex: number,
  legalAction: LegalAction,
): void {
  const run = mustRun(state);
  const encounteredIceId = run.encounteredIceId;
  if (!encounteredIceId)
    throw new Error(
      "Blink kann nur waehrend eines ICE-Encounters verwendet werden.",
    );
  if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
    throw new Error("Blink-Subroutinenziel ist ungueltig.");
  const iceDefinition = definitionFor(state, encounteredIceId);
  const subroutine = iceDefinition.subroutines?.[subroutineIndex];
  if (!subroutine) throw new Error("Blink-Subroutine existiert nicht.");
  if (
    run.brokenSubroutineIndexes.includes(subroutineIndex) ||
    run.resolvedSubroutineIndexes.includes(subroutineIndex)
  ) {
    throw new Error("Diese Subroutine ist bereits aufgeloest.");
  }
  const blinkUsageByBreaker =
    (run.blinkUsedSubroutinesByBreakerThisEncounter ??= {});
  const usedIndexes = blinkUsageByBreaker[breakerId] ?? [];
  if (usedIndexes.includes(subroutineIndex))
    throw new Error(
      "Blink darf diese Subroutine in diesem Encounter nicht erneut anvisieren.",
    );
  usedIndexes.push(subroutineIndex);
  blinkUsageByBreaker[breakerId] = usedIndexes;

  const die = rollDeterministicDie(
    state,
    `${BLINK_ID}.break.${run.runId}.${encounteredIceId}.${breakerId}.${subroutineIndex}`,
  );
  legalAction.payload = { ...(legalAction.payload ?? {}), blinkDieRoll: die };
  if (die >= 4) {
    executeEffectCommands(state, [
      { type: "break_subroutine", subroutineIndex },
    ]);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      blinkBreakSuccess: true,
      blinkDamageAmount: 0,
    };
    return;
  }

  const damageSummary = doDamage(state, {
    damageId: `v190.blink.${run.runId}.${encounteredIceId}.${breakerId}.${subroutineIndex}`,
    damageType: "net",
    amount: die,
    source: `ability:${BLINK_ID}`,
  });
  setDamagePayload(legalAction, damageSummary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    blinkBreakSuccess: false,
    blinkDamageAmount: die,
  };
}

function recordBartmossEncounterUsage(
  state: GameState,
  breakerId: CardInstanceId,
): void {
  const run = state.run;
  if (!run || run.phase !== "encounter_ice") return;
  if (definitionFor(state, breakerId).id !== BARTMOSS_ID) return;
  const usedBreakerIds = run.bartmossUsedBreakerIdsThisEncounter ?? [];
  if (!usedBreakerIds.includes(breakerId)) usedBreakerIds.push(breakerId);
  run.bartmossUsedBreakerIdsThisEncounter = usedBreakerIds;
}

function recordRunFullyBrokenIce(run: ActiveRun, iceId: CardInstanceId): void {
  const fullyBroken = run.fullyBrokenIceIds ?? [];
  if (!fullyBroken.includes(iceId)) fullyBroken.push(iceId);
  run.fullyBrokenIceIds = fullyBroken;
}

function startTraceFromSubroutine(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  subroutineIndex: number,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  legalAction?: LegalAction,
): void {
  if (state.trace || state.pendingChoice)
    throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  const baseTraceStrength =
    subroutine.baseTraceStrength ?? subroutine.amount ?? 0;
  if (!Number.isInteger(baseTraceStrength) || baseTraceStrength < 0)
    throw new Error("Trace strength ist ungueltig.");
  const successEffect = subroutine.traceSuccessEffect;
  if (!successEffect || !isSupportedTraceSuccessEffect(successEffect))
    throw new Error("Dieser Trace-Effekt ist nicht freigegeben.");

  const run = mustRun(state);
  if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
    run.resolvedSubroutineIndexes.push(subroutineIndex);
  const sourceDefinition = definitionFor(state, sourceCardInstanceId);
  const traceId = `${run.runId}.${sourceCardInstanceId}.${subroutineIndex}.trace`;
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinition.id,
    subroutineIndex,
    baseTraceStrength,
    status: "corp_bid",
    successEffect,
  };
  state.pendingChoice = traceBidChoice(
    state,
    "corp",
    traceId,
    `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`,
    state.corp.credits,
  );
  state.activeSide = "corp";
  state.timingPoint = "run.encounter_ice";
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceStarted: true,
      traceId,
      sourceCardId: sourceCardInstanceId,
      sourceDefinitionId: sourceDefinition.id,
      baseTraceStrength,
    };
  }
}

function startTraceFromOperation(
  state: GameState,
  sourceDefinitionId: string,
  baseTraceStrength: number,
  legalAction: LegalAction,
): void {
  if (state.trace || state.pendingChoice)
    throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  if (!Number.isInteger(baseTraceStrength) || baseTraceStrength < 0)
    throw new Error("Trace strength ist ungueltig.");
  const sourceCardInstanceId = String(legalAction.payload?.cardId ?? "");
  if (!sourceCardInstanceId || !state.cardInstances[sourceCardInstanceId])
    throw new Error("Trace-Operation hat keine gueltige Quellenkarte.");
  const traceId = `op_trace.${state.stateVersion + 1}.${sanitizeId(sourceDefinitionId)}.${sourceCardInstanceId}`;
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    baseTraceStrength,
    status: "corp_bid",
    successEffect: { type: "add_tag", amount: 1 },
    returnPhase: state.phase,
    returnTimingPoint: state.timingPoint,
    returnActiveSide: state.activeSide,
  };
  state.pendingChoice = traceBidChoice(
    state,
    "corp",
    traceId,
    `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`,
    state.corp.credits,
  );
  state.activeSide = "corp";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceStarted: true,
    traceId,
    sourceCardId: sourceCardInstanceId,
    sourceDefinitionId,
    baseTraceStrength,
  };
}

function traceBidChoice(
  state: GameState,
  side: Side,
  traceId: string,
  prompt: string,
  maxBid: number,
): ChoiceRequest {
  const boundedMax = Math.max(0, Math.floor(maxBid));
  return {
    choiceId: `${traceId}.${side}.bid.${state.stateVersion + 1}`,
    side,
    source: `trace:${traceId}`,
    prompt,
    kind: "bid_amount",
    options: Array.from({ length: boundedMax + 1 }, (_, amount) => ({
      id: `bid_${amount}`,
      label: `${amount} Credits`,
      publicLabel: `${amount} Credits`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function movePastCurrentIce(state: GameState): void {
  const run = mustRun(state);
  if (run.position.kind !== "ice")
    throw new Error("Runner ist nicht an ICE positioniert.");
  const server = mustServer(state, run.position.serverId);
  const nextIndex = run.position.iceIndex + 1;
  if (nextIndex < server.ice.length) {
    const approachedIceId = mustArrayValue(
      server.ice,
      nextIndex,
      "Naechstes ICE fehlt.",
    );
    if (isV097OrLater(state)) {
      const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } =
        run;
      void _encounteredIceId;
      state.run = {
        ...runWithoutEncounter,
        phase: "movement",
        position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
        approachedIceId,
        brokenSubroutineIndexes: [],
        resolvedSubroutineIndexes: [],
      };
      state.timingPoint = "run.jack_out_window";
      state.activeSide = "runner";
      return;
    }
    state.run = {
      ...run,
      phase: "approach_ice",
      position: { kind: "ice", serverId: server.id, iceIndex: nextIndex },
      approachedIceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    };
    approachOrEncounterIce(state, approachedIceId);
    return;
  }
  if (isV097OrLater(state)) {
    const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
    void _encounteredIceId;
    state.run = {
      ...runWithoutEncounter,
      position: { kind: "server", serverId: server.id },
      phase: "movement",
    };
    state.timingPoint = "run.jack_out_window";
    state.activeSide = "runner";
    return;
  }
  state.run = {
    ...run,
    position: { kind: "server", serverId: server.id },
    phase: "access",
  };
  enterAccess(state);
}

function resolveVacuumLinkRewindSubroutine(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): boolean {
  if (!run.encounteredIceId)
    throw new Error("Vacuum-Link-Rewind benötigt einen aktiven ICE-Encounter.");
  if (run.position.kind !== "ice")
    throw new Error("Vacuum-Link-Rewind erwartet eine ICE-Position.");
  const server = mustServer(state, run.position.serverId);
  const currentIndex =
    server.ice[run.position.iceIndex] === run.encounteredIceId
      ? run.position.iceIndex
      : server.ice.findIndex((cardId) => cardId === run.encounteredIceId);
  if (currentIndex < 0)
    throw new Error(
      "Vacuum-Link-Rewind konnte das Encounter-ICE nicht finden.",
    );

  const die = rollDeterministicDie(
    state,
    `${VACUUM_LINK_ID}.rewind.${run.runId}.${run.encounteredIceId}`,
  );
  if (legalAction)
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      vacuumLinkDieRoll: die,
    };
  if (die >= 4) {
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        vacuumLinkRewindApplied: false,
      };
    return false;
  }

  let targetIndex = 0;
  let remainingRezzedBack = die;
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const cardId = server.ice[index];
    if (!cardId || !mustInstance(state.cardInstances, cardId).rezzed) continue;
    remainingRezzedBack -= 1;
    if (remainingRezzedBack === 0) {
      targetIndex = index;
      break;
    }
  }
  if (remainingRezzedBack > 0) targetIndex = 0;
  const targetIceId = mustArrayValue(
    server.ice,
    targetIndex,
    "Vacuum-Link-Ziel-ICE fehlt.",
  );

  const {
    encounteredIceId: _encounteredIceId,
    accessedCardId: _accessedCardId,
    ...runWithoutEncounter
  } = run;
  void _encounteredIceId;
  void _accessedCardId;
  state.run = {
    ...runWithoutEncounter,
    phase: "movement",
    position: { kind: "ice", serverId: server.id, iceIndex: targetIndex },
    approachedIceId: targetIceId,
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
  };
  state.timingPoint = "run.jack_out_window";
  state.activeSide = "runner";
  resetBreakerStrength(state);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      vacuumLinkRewindApplied: true,
      vacuumLinkRewindRezzedIceBack: die,
      vacuumLinkTargetIceId: targetIceId,
      vacuumLinkTargetIceIndex: targetIndex,
    };
  }
  return true;
}

function continueFromMovement(state: GameState): void {
  const run = mustRun(state);
  if (run.position.kind === "ice") {
    const server = mustServer(state, run.position.serverId);
    const approachedIceId =
      run.approachedIceId ??
      mustArrayValue(server.ice, run.position.iceIndex, "Naechstes ICE fehlt.");
    state.run = { ...run, phase: "approach_ice", approachedIceId };
    approachOrEncounterIce(state, approachedIceId);
    return;
  }
  enterAccess(state);
}

function enterAccess(state: GameState): void {
  const run = mustRun(state);
  if (run.successfulRunAccessReplacement === "corp_lose_credits") {
    applySuccessfulRunAccessReplacement(state, run);
    finishRun(state, true);
    return;
  }
  if (isV097OrLater(state)) {
    const breach = buildBreachState(state, run);
    if (breach.queue.length === 0) {
      finishRun(state, true);
      return;
    }
    const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
    void _accessedCardId;
    state.run = {
      ...runWithoutAccessedCard,
      phase: "access",
      successful: true,
      breach,
    };
  } else {
    state.run = { ...run, phase: "access", successful: true };
  }
  state.timingPoint = "access.resolve_card";
  state.activeSide = "runner";
}

function applySuccessfulRunAccessReplacement(
  state: GameState,
  run: ActiveRun,
): void {
  const creditLoss = Math.max(0, Math.floor(run.successfulRunCreditLoss ?? 0));
  if (creditLoss > 0) {
    state.corp.credits = Math.max(0, state.corp.credits - creditLoss);
  }
  const runnerTagGain = Math.max(
    0,
    Math.floor(run.successfulRunRunnerTagGain ?? 0),
  );
  if (runnerTagGain > 0) state.runner.tags += runnerTagGain;
  const corpDraw = Math.max(0, Math.floor(run.successfulRunCorpDraw ?? 0));
  if (corpDraw > 0) drawCorpCards(state, corpDraw);
}

function buildBreachState(state: GameState, run: ActiveRun): ActiveBreach {
  const accessServerId = run.accessServerOverride ?? run.attackedServerId;
  const server = mustServer(state, accessServerId);
  const accessCount = Math.max(1, run.accessCount ?? 1);
  const queueIds = accessQueueIds(state, server, run, accessCount);
  return {
    breachId: `${run.runId}.breach`,
    serverId: server.id,
    accessMode: accessCount > 1 ? "multi" : "single",
    queue: queueIds.map((cardId, index) => ({
      entryId: `${run.runId}.breach.${index}`,
      cardInstanceId: cardId,
      serverId: server.id,
      zone: accessQueueZone(server.id),
      status: "pending",
      hiddenInfo: isBreachEntryHidden(state, cardId),
    })),
    currentIndex: 0,
    completed: false,
    accessedSummaries: [],
  };
}

function accessQueueIds(
  state: GameState,
  server: CorpServer,
  run: ActiveRun,
  accessCount: number,
): CardInstanceId[] {
  if (server.id === "rd")
    return state.corp.rd.slice(0, Math.min(accessCount, state.corp.rd.length));
  if (server.id === "hq") {
    const bonus = runnerHqAccessBonus(state);
    return randomHqAccessQueue(state, run.runId, accessCount + bonus);
  }
  if (server.id === "archives") return state.corp.archives.slice();
  return server.root.slice();
}

function v1915InstalledAccessBonus(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  let bonus = 0;
  if (
    serverId === "hq" &&
    runnerHasInstalledDefinition(state, EXPERT_SCHEDULE_ANALYZER_ID)
  )
    bonus += 1;
  if (
    serverId === "rd" &&
    runnerHasInstalledDefinition(state, MICROTECH_AI_INTERFACE_ID)
  )
    bonus += 1;
  if (
    (serverId === "hq" || serverId === "rd") &&
    runnerHasInstalledDefinition(state, SHREDDER_UPLINK_PROTOCOL_ID)
  )
    bonus += 1;
  if (
    serverId === "archives" &&
    runnerHasInstalledDefinition(state, RECORD_RECONSTRUCTOR_ID)
  )
    bonus += 1;
  return bonus;
}

function applyV1915RunStartCounterHelpers(state: GameState): void {
  for (const cardId of state.runner.rig.programs) {
    if (definitionFor(state, cardId).id !== DUPRE_ID) continue;
    addCardCounter(state, cardId, "power", 1);
  }
}

function v1915InstalledRevealHelperIds(state: GameState): CardDefinitionId[] {
  const helperIds = [MYSTERY_BOX_ID, SMARTEYE_ID, RECORD_RECONSTRUCTOR_ID];
  return helperIds.filter((definitionId) =>
    runnerHasInstalledDefinition(state, definitionId),
  );
}

function runnerHasInstalledDefinition(
  state: GameState,
  definitionId: CardDefinitionId,
): boolean {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ].some((cardId) => definitionFor(state, cardId).id === definitionId);
}

function runnerHqAccessBonus(state: GameState): number {
  return state.runner.rig.hardware.reduce((sum, cardId) => {
    const definition = definitionFor(state, cardId);
    return definition.id === "onr_v1_129_hq-interface" ? sum + 1 : sum;
  }, 0);
}

function accessQueueZone(
  serverId: Exclude<ServerId, "new_remote">,
): ActiveBreach["queue"][number]["zone"] {
  if (serverId === "rd") return "rd";
  if (serverId === "hq") return "hq";
  if (serverId === "archives") return "archives";
  return "remote_root";
}

function isBreachEntryHidden(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  if (state.corp.archives.includes(cardId)) return !instance.faceup;
  return !instance.rezzed && !instance.faceup;
}

function randomHqAccessQueue(
  state: GameState,
  runId: string,
  accessCount: number,
): CardInstanceId[] {
  const available = state.corp.hq.slice();
  const selected: CardInstanceId[] = [];
  const limit = Math.min(accessCount, available.length);
  for (let index = 0; index < limit; index += 1) {
    const value = nextRandom(
      state,
      `hq_multiaccess:${runId}:selection:${index}`,
    );
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(
      available,
      selectedIndex,
      "HQ access selection missing.",
    );
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }
  return selected;
}

function discardRandomCorpHqCards(
  state: GameState,
  maxCount: number,
  purposePrefix: string,
): CardInstanceId[] {
  const available = state.corp.hq.slice();
  const discarded: CardInstanceId[] = [];
  const limit = Math.min(Math.max(0, Math.floor(maxCount)), available.length);
  for (let index = 0; index < limit; index += 1) {
    const value = nextRandom(state, `${purposePrefix}:selection:${index}`);
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(
      available,
      selectedIndex,
      "HQ discard selection missing.",
    );
    available.splice(selectedIndex, 1);
    removeFromAllZones(state, cardId);
    state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "archives" },
    };
    discarded.push(cardId);
  }
  return discarded;
}

function accessCurrentCard(state: GameState, legalAction: LegalAction): void {
  const run = mustRun(state);
  if (run.breach) {
    const breach = run.breach;
    const entry = breach.queue[breach.currentIndex];
    if (!entry || entry.status !== "pending") {
      finishRun(state, true);
      return;
    }
    const cardId = entry.cardInstanceId;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessedCardId: cardId,
      serverId: breach.serverId,
      breachId: breach.breachId,
      accessIndex: breach.currentIndex,
    };
    markV1915InstalledRevealAccess(state, entry, legalAction);
    const updatedQueue = breach.queue.map((candidate, index) =>
      index === breach.currentIndex
        ? { ...candidate, status: "accessed" as const }
        : candidate,
    );
    state.run = {
      ...run,
      accessedCardId: cardId,
      breach: {
        ...breach,
        queue: updatedQueue,
      },
    };
    const instance = mustInstance(state.cardInstances, cardId);
    state.cardInstances[cardId] = { ...instance, faceup: true };
    resolveAmbushOnAccessFoundation(state, cardId, legalAction);
    resolveV1917AmbushOnAccess(state, cardId, legalAction);
    resolveV1918UpgradeOnAccess(state, cardId, legalAction);
    resolveV1919AssetOnAccess(state, cardId, legalAction);
    resolveV199UpgradeOnAccess(state, cardId, legalAction);
    const definition = definitionFor(state, cardId);
    const freeTrashAccess = canFreeTrashCurrentAccessCard(
      state,
      run,
      definition,
    );
    if (
      definition.type !== "agenda" &&
      definition.type !== "asset" &&
      definition.type !== "upgrade" &&
      !freeTrashAccess
    ) {
      completeCurrentBreachAccess(state, "accessed");
    }
    return;
  }
  const server = mustServer(state, run.attackedServerId);
  let cardId: string | undefined;
  if (server.id === "rd") cardId = state.corp.rd[0];
  else if (server.id === "hq") cardId = randomHqAccess(state);
  else if (server.id === "archives") cardId = state.corp.archives[0];
  else cardId = server.root[0];
  if (!cardId) {
    finishRun(state, true);
    return;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    accessedCardId: cardId,
    serverId: server.id,
  };
  markV1915InstalledRevealAccess(
    state,
    {
      hiddenInfo: isBreachEntryHidden(state, cardId),
      zone: accessQueueZone(server.id),
    },
    legalAction,
  );
  state.run = { ...run, accessedCardId: cardId };
  const instance = mustInstance(state.cardInstances, cardId);
  state.cardInstances[cardId] = { ...instance, faceup: true };
  resolveAmbushOnAccessFoundation(state, cardId, legalAction);
  resolveV1917AmbushOnAccess(state, cardId, legalAction);
  resolveV1918UpgradeOnAccess(state, cardId, legalAction);
  resolveV1919AssetOnAccess(state, cardId, legalAction);
  resolveV199UpgradeOnAccess(state, cardId, legalAction);
  const definition = definitionFor(state, cardId);
  const freeTrashAccess = canFreeTrashCurrentAccessCard(state, run, definition);
  if (
    definition.type !== "agenda" &&
    definition.type !== "asset" &&
    definition.type !== "upgrade" &&
    !freeTrashAccess
  ) {
    finishRun(state, true);
  }
}

function markV1915InstalledRevealAccess(
  state: GameState,
  entry: { hiddenInfo: boolean; zone: ActiveBreach["queue"][number]["zone"] },
  legalAction: LegalAction,
): void {
  if (!entry.hiddenInfo || !["rd", "hq", "archives"].includes(entry.zone))
    return;
  const helperIds = v1915InstalledRevealHelperIds(state);
  if (helperIds.length === 0) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1915_installed_access_reveal",
    revealHelperCount: helperIds.length,
  };
}

function resolveAmbushOnAccessFoundation(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const harness = state.ambushHarness;
  if (!harness?.enabled) return;
  const definition = definitionFor(state, cardId);
  const triggered =
    !harness.triggerDefinitionId ||
    harness.triggerDefinitionId === definition.id;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "ambush_on_access_foundation",
    ambushFoundationChecked: true,
    ambushFoundationTriggered: triggered,
    ...(triggered ? { ambushFoundationDefinitionId: definition.id } : {}),
  };
}

function resolveV1917AmbushOnAccess(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (definition.id !== V1917_SETUP_ID && definition.id !== V1917_TRAP_ID)
    return;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.17-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  if (definition.id === V1917_TRAP_ID) state.runner.tags += 1;
  const summary = doDamage(state, {
    damageId: `v1917.ambush.${state.run.runId}.${cardId}.${state.stateVersion + 1}`,
    damageType: "net",
    amount: 1,
    source: definition.id,
  });
  setDamagePayload(legalAction, summary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_access_ambush",
    ambushDefinitionId: definition.id,
    ...(definition.id === V1917_TRAP_ID
      ? { tagsAdded: 1, runnerTagsAfter: state.runner.tags }
      : {}),
  };
}

function resolveV1918UpgradeOnAccess(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (
    definition.id !== V1918_DEDICATED_RESPONSE_TEAM_ID &&
    definition.id !== V1918_DIETER_ESSLIN_ID &&
    definition.id !== V1918_TURBEAU_DELACROIX_ID
  )
    return;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.18-Upgrade-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  if (!mustInstance(state.cardInstances, cardId).rezzed) return;

  if (definition.id === V1918_TURBEAU_DELACROIX_ID) {
    legalAction.payload = { ...(legalAction.payload ?? {}), cardId };
    startTraceFromOperation(state, definition.id, 10, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: definition.id,
    };
    return;
  }

  if (definition.id === V1918_DEDICATED_RESPONSE_TEAM_ID)
    state.runner.tags += 1;
  const damageType =
    definition.id === V1918_DEDICATED_RESPONSE_TEAM_ID ? "meat" : "net";
  const summary = doDamage(state, {
    damageId: `v1918.upgrade_access.${state.run.runId}.${cardId}.${state.stateVersion + 1}`,
    damageType,
    amount: 1,
    source: definition.id,
  });
  setDamagePayload(legalAction, summary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_upgrade_access_ambush",
    ambushDefinitionId: definition.id,
    ...(definition.id === V1918_DEDICATED_RESPONSE_TEAM_ID
      ? { tagsAdded: 1, runnerTagsAfter: state.runner.tags }
      : {}),
  };
}

function resolveV1919AssetOnAccess(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (
    definition.id !== V1919_CORPRUNNERS_SHATTERED_REMAINS_ID &&
    definition.id !== V1919_EXPERIMENTAL_AI_ID &&
    definition.id !== V1919_VACANT_SOULKILLER_ID &&
    definition.id !== V1919_VIRUS_TEST_SITE_ID
  ) {
    return;
  }
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.19-Asset-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }

  if (
    definition.id === V1919_CORPRUNNERS_SHATTERED_REMAINS_ID ||
    definition.id === V1919_EXPERIMENTAL_AI_ID
  ) {
    const candidates =
      definition.id === V1919_CORPRUNNERS_SHATTERED_REMAINS_ID
        ? state.runner.rig.hardware
        : state.runner.rig.programs;
    const targetCardId = candidates.slice().sort((left, right) => {
      const leftDefinition = definitionFor(state, left);
      const rightDefinition = definitionFor(state, right);
      const byInstallCost =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
    })[0];
    if (targetCardId) {
      const targetDefinition = definitionFor(state, targetCardId);
      trashRunnerInstalledCardToHeap(state, targetCardId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1919_access_ambush_trash_installed",
        ambushDefinitionId: definition.id,
        trashedCardDefinitionId: targetDefinition.id,
        trashedCardType: targetDefinition.type,
      };
      return;
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_no_target",
      ambushDefinitionId: definition.id,
    };
    return;
  }

  const damageType: DamageType =
    definition.id === V1919_VACANT_SOULKILLER_ID ? "core" : "net";
  const damageAmount = definition.id === V1919_VACANT_SOULKILLER_ID ? 1 : 2;
  const summary = doDamage(state, {
    damageId: `v1919.asset_access.${state.run.runId}.${cardId}.${state.stateVersion + 1}`,
    damageType,
    amount: damageAmount,
    source: definition.id,
  });
  setDamagePayload(legalAction, summary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1919_access_ambush_damage",
    ambushDefinitionId: definition.id,
  };
}

function resolveV199UpgradeOnAccess(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (definition.id === BIZARRE_ENCRYPTION_SCHEME_ID && state.run) {
    state.run.bizarreEncryptionSchemeActive = true;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      bizarreEncryptionSchemeAccessed: true,
    };
  }
  if (definition.id === CHIMERA_ID) {
    startChimeraDaemonTrashChoice(state, cardId, legalAction);
  }
}

function startChimeraDaemonTrashChoice(
  state: GameState,
  chimeraId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.rig.programs
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        definition.type === "program" && cardHasSubtype(definition, "daemon")
      );
    })
    .sort((left, right) => {
      const leftDefinition = definitionFor(state, left);
      const rightDefinition = definitionFor(state, right);
      const costCompare =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      if (costCompare !== 0) return costCompare;
      const memoryCompare =
        (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
      if (memoryCompare !== 0) return memoryCompare;
      return left.localeCompare(right);
    })
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: "Daemon",
        value: cardId,
      };
    });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    chimeraAccessed: true,
    chimeraDaemonCandidateCount: options.length,
  };
  if (options.length === 0) return;
  state.pendingChoice = {
    choiceId: `v199_chimera_${state.stateVersion + 1}`,
    side: "runner",
    source: `v199.chimera_daemon_trash:${chimeraId}:${state.stateVersion + 1}`,
    prompt: "Daemon für Chimera trashen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function stealAgenda(state: GameState, cardId: string): void {
  if (!cardId) throw new Error("Keine Agenda wird accessed.");
  if (state.run?.bizarreEncryptionSchemeActive) {
    delayBizarreEncryptionSchemeAgendaScore(state, cardId);
    return;
  }
  const flags = ensureRunnerTurnFlags(state);
  flags.stoleAgendaThisTurn = true;
  const definition = definitionFor(state, cardId);
  if (cardHasSubtype(definition, "gray_ops"))
    flags.stoleGrayOpsAgendaThisTurn = true;
  if (cardHasSubtype(definition, "black_ops"))
    flags.stoleBlackOpsAgendaThisTurn = true;
  removeFromAllZones(state, cardId);
  state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "stolen");
    return;
  }
  finishRun(state, true);
}

function delayBizarreEncryptionSchemeAgendaScore(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const run = mustRun(state);
  const definition = definitionFor(state, cardId);
  if (definition.type !== "agenda")
    throw new Error(
      "Bizarre Encryption Scheme kann nur Agenda-Scoring verzögern.",
    );
  const serverId = run.breach?.serverId ?? run.attackedServerId;
  const zone = mustInstance(state.cardInstances, cardId).zone;
  if (
    zone.side !== "corp" ||
    zone.zone !== "serverRoot" ||
    zone.serverId !== serverId
  ) {
    throw new Error("Die verzögerte Agenda liegt nicht im betroffenen Fort.");
  }
  const existing = state.bizarreEncryptionDelayedAgendas ?? [];
  if (!existing.some((entry) => entry.agendaId === cardId)) {
    state.bizarreEncryptionDelayedAgendas = [
      ...existing,
      { agendaId: cardId, serverId },
    ];
  }
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "declined");
    return;
  }
  finishRun(state, true);
}

function trashAccessedCard(
  state: GameState,
  cardId: string,
  legalAction?: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  const rawOverride = legalAction?.payload?.accessTrashCostOverride;
  const overrideCost =
    typeof rawOverride === "number"
      ? Math.max(0, Math.floor(rawOverride))
      : undefined;
  const trashCost = overrideCost ?? definition.trashCost ?? 0;
  spendCredits(state, "runner", trashCost);
  const sourceZone = mustInstance(state.cardInstances, cardId).zone;
  if (sourceZone.side === "corp" && sourceZone.zone === "archives") {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
    if (state.run?.breach) {
      completeCurrentBreachAccess(state, "trashed");
      return;
    }
    finishRun(state, true);
    return;
  }
  trashCorpInstalledCardToArchives(state, cardId);
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "trashed");
    return;
  }
  finishRun(state, true);
}

function declineCurrentAccess(state: GameState): void {
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "declined");
    return;
  }
  finishRun(state, true);
}

function completeCurrentBreachAccess(
  state: GameState,
  status: BreachEntryStatus,
): void {
  const run = mustRun(state);
  const breach = run.breach;
  if (!breach) {
    finishRun(state, true);
    return;
  }
  const current = breach.queue[breach.currentIndex];
  if (!current) {
    finishRun(state, true);
    return;
  }
  const finalStatus: BreachEntryStatus =
    status === "pending" ? "accessed" : status;
  const queue = breach.queue.map((entry, index) =>
    index === breach.currentIndex ? { ...entry, status: finalStatus } : entry,
  );
  const nextIndex = queue.findIndex(
    (entry, index) => index > breach.currentIndex && entry.status === "pending",
  );
  const accessedSummaries = [
    ...breach.accessedSummaries,
    {
      entryId: current.entryId,
      status: finalStatus,
      cardDefinitionId: definitionFor(state, current.cardInstanceId).id,
    },
  ];
  const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
  void _accessedCardId;
  if (nextIndex === -1) {
    state.run = {
      ...runWithoutAccessedCard,
      breach: {
        ...breach,
        queue,
        completed: true,
        accessedSummaries,
      },
    };
    finishRun(state, true);
    return;
  }
  state.run = {
    ...runWithoutAccessedCard,
    breach: {
      ...breach,
      queue,
      currentIndex: nextIndex,
      accessedSummaries,
    },
  };
  state.timingPoint = "access.resolve_card";
  state.activeSide = "runner";
}

function trashResource(state: GameState, cardId: string): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
  if (!state.runner.rig.resources.includes(cardId))
    throw new Error("Diese Resource ist nicht installiert.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "resource")
    throw new Error("Nur installierte Resources koennen getrasht werden.");
  spendClick(state, "corp");
  spendCredits(state, "corp", 2);
  trashRunnerInstalledCardToHeap(state, cardId);
}

function pickRunnerProgramForUninstall(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.rig.programs.slice().sort((left, right) => {
    const leftDefinition = definitionFor(state, left);
    const rightDefinition = definitionFor(state, right);
    const byInstallCost =
      (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
    if (byInstallCost !== 0) return byInstallCost;
    const byMemoryCost =
      (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
    if (byMemoryCost !== 0) return byMemoryCost;
    return left.localeCompare(right);
  })[0];
}

function resolveBanpeiProgramTrashSubroutine(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const targetProgramId = pickRunnerProgramForUninstall(state);
  if (!targetProgramId) {
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        banpeiProgramTrashed: false,
      };
    return;
  }
  trashRunnerInstalledProgram(state, targetProgramId);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      banpeiProgramTrashed: true,
      banpeiProgramId: targetProgramId,
      banpeiProgramDefinitionId: definitionFor(state, targetProgramId).id,
    };
  }
}

function trashRunnerInstalledProgram(
  state: GameState,
  cardId: CardInstanceId,
): void {
  if (!state.runner.rig.programs.includes(cardId)) return;
  const hostedIds = hostedCardsOn(state, cardId);
  for (const hostedId of hostedIds)
    trashRunnerInstalledProgram(state, hostedId);
  const definition = definitionFor(state, cardId);
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  if (runnerProgramUsesMemory(state, cardId)) {
    state.runner.memoryUsed = Math.max(
      0,
      state.runner.memoryUsed - (definition.memoryCost ?? 0),
    );
  }
  state.cardInstances[cardId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
}

function runnerProgramUsesMemory(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  if (!instance.hostedOn) return true;
  const hostDefinition = definitionFor(state, instance.hostedOn);
  if (
    hostDefinition.type === "program" &&
    cardHasSubtype(hostDefinition, "daemon")
  )
    return false;
  return true;
}

function trashRunnerInstalledCardToHeap(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const definition = definitionFor(state, cardId);
  if (definition.type === "program") {
    trashRunnerInstalledProgram(state, cardId);
    return;
  }
  if (definition.type !== "hardware" && definition.type !== "resource") return;
  const rig =
    definition.type === "hardware"
      ? state.runner.rig.hardware
      : state.runner.rig.resources;
  if (!rig.includes(cardId)) return;
  for (const hostedId of hostedCardsOn(state, cardId)) {
    const hostedDefinition = definitionFor(state, hostedId);
    if (hostedDefinition.type === "program")
      trashRunnerInstalledProgram(state, hostedId);
  }
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
}

function trashCorpInstalledCardToArchives(
  state: GameState,
  cardId: CardInstanceId,
): void {
  for (const hostedId of hostedCardsOn(state, cardId)) {
    const hostedInstance = mustInstance(state.cardInstances, hostedId);
    if (hostedInstance.owner === "corp")
      trashCorpInstalledCardToArchives(state, hostedId);
  }
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.corp.archives.push(cardId);
  state.cardInstances[cardId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "corp", zone: "archives" },
  };
}

function trashOlderRegionUpgradesInServer(
  state: GameState,
  server: CorpServer,
  keepCardId: CardInstanceId,
): void {
  const olderRegions = server.root
    .filter((cardId) => cardId !== keepCardId)
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        definition.type === "upgrade" && cardHasSubtype(definition, "region")
      );
    })
    .sort();
  for (const cardId of olderRegions)
    trashCorpInstalledCardToArchives(state, cardId);
}

function tokyoChibaUnsuccessfulRunBonus(
  state: GameState,
  run: GameState["run"],
  successful: boolean,
): number {
  if (!run || successful) return 0;
  const attackedServer = state.corp.servers.find(
    (server) => server.id === run.attackedServerId,
  );
  if (!attackedServer) return 0;
  return attackedServer.root.some((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return (
      instance.rezzed &&
      definitionFor(state, cardId).id === "onr_v1_371_tokyo-chiba-infighting"
    );
  })
    ? 2
    : 0;
}

function finishRun(state: GameState, successful: boolean): void {
  const run = state.run;
  if (run && successful) applyV181SuccessfulRunCounterTriggers(state, run);
  if (run && successful && run.attackedServerId === "hq")
    ensureRunnerTurnFlags(state).successfulHqRunThisTurn = true;
  const allNighterBonusRunOnFinish =
    run?.grantAllNighterBonusRunOnFinish === true;
  const bonus = successful ? (run?.pendingSuccessBonusCredits ?? 0) : 0;
  const corpBonus = tokyoChibaUnsuccessfulRunBonus(state, run, successful);
  state.runner.credits += bonus;
  state.corp.credits += corpBonus;
  if (allNighterBonusRunOnFinish && !state.winner) {
    ensureRunnerTurnFlags(state).allNighterBonusRunPending = true;
  }
  resetBreakerStrength(state);
  delete state.run;
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.activeSide = "runner";
  consumeRunnerFutureActionDebt(state);
  cleanupEmptyRemotes(state);
}

function applyV181SuccessfulRunCounterTriggers(
  state: GameState,
  run: ActiveRun,
): void {
  const pattelsInstalled = runnerInstalledCardCountByDefinition(
    state,
    "onr_v1_046_pattels-virus",
  );
  if (pattelsInstalled > 0) {
    const targetIceId = run.fullyBrokenIceIds?.[0];
    if (targetIceId && state.cardInstances[targetIceId])
      addCardCounter(state, targetIceId, "virus", 1);
  }
  const poxInstalled = runnerInstalledCardCountByDefinition(
    state,
    "onr_v1_049_pox",
  );
  if (poxInstalled > 0) {
    const serverId = run.attackedServerId;
    const current = poxCountersForServer(state, serverId);
    state.poxCountersByServer = {
      ...(state.poxCountersByServer ?? {}),
      [serverId]: current + 1,
    };
  }
  if (run.attackedServerId === "hq") {
    for (const cardId of state.runner.rig.programs) {
      if (definitionFor(state, cardId).id !== COCKROACH_ID) continue;
      addCardCounter(state, cardId, "virus", 1);
    }
  }
  for (const cardId of state.runner.rig.programs) {
    if (definitionFor(state, cardId).id !== INCUBATOR_ID) continue;
    addCardCounter(state, cardId, "virus", 1);
  }
}

function endTurn(state: GameState, side: Side): void {
  if (side === "runner") {
    const flags = ensureRunnerTurnFlags(state);
    flags.stoleAgendaLastTurn = flags.stoleAgendaThisTurn;
    flags.stoleAgendaThisTurn = false;
    flags.stoleGrayOpsAgendaThisTurn = false;
    flags.stoleBlackOpsAgendaThisTurn = false;
    flags.runAttemptsLastTurn = flags.runAttemptsThisTurn ?? 0;
    flags.runAttemptsThisTurn = 0;
    flags.successfulHqRunThisTurn = false;
  } else {
    const corpFlags = ensureCorpTurnFlags(state);
    corpFlags.scoredBlackOpsAgendaLastTurn =
      corpFlags.scoredBlackOpsAgendaThisTurn;
    corpFlags.scoredBlackOpsAgendaThisTurn = false;
  }
  startDiscardPhase(state, side);
}

function startDiscardPhase(state: GameState, side: Side): void {
  state.activeSide = side;
  if (side === "runner") {
    state.phase = "runner_discard_phase";
    state.timingPoint = "runner_discard.flatline_check";
    if (maxHandSize(state, "runner") < 0) {
      state.winner = "corp";
      state.gameEndReason = "flatline";
      state.phase = "game_over";
      state.timingPoint = "game.checkpoint";
      delete state.pendingChoice;
      delete state.run;
      return;
    }
    processDiscardStep(state, "runner");
    return;
  }

  state.phase = "corp_discard_phase";
  state.timingPoint = "corp_discard.select_cards";
  processDiscardStep(state, "corp");
}

function processDiscardStep(state: GameState, side: Side): void {
  const hand = handForSide(state, side);
  const requiredDiscardCount = hand.length - maxHandSize(state, side);
  if (requiredDiscardCount <= 0) {
    completeDiscardPhase(state, side);
    return;
  }
  state.timingPoint =
    side === "corp"
      ? "corp_discard.select_cards"
      : "runner_discard.select_cards";
  state.pendingChoice = discardChoice(
    state,
    side,
    requiredDiscardCount,
    state.stateVersion + 1,
  );
}

function completeDiscardPhase(state: GameState, side: Side): void {
  if (side === "runner") {
    startCorpTurn(state);
    return;
  }
  startRunnerTurn(state);
}

function applyRunnerForgoNextAction(state: GameState): void {
  if (state.runner.clicks > 0) {
    state.runner.clicks = Math.max(0, state.runner.clicks - 1);
    return;
  }
  addRunnerFutureActionDebt(state, 1);
}

function addRunnerFutureActionDebt(state: GameState, amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) return;
  const flags = ensureRunnerTurnFlags(state);
  flags.forgoNextActionsPending =
    Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) + amount;
}

function consumeRunnerFutureActionDebt(state: GameState): number {
  const flags = ensureRunnerTurnFlags(state);
  let pending = Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0));
  if (flags.forgoNextActionPending === true) pending += 1;
  flags.forgoNextActionPending = false;
  if (pending <= 0 || state.runner.clicks <= 0) {
    flags.forgoNextActionsPending = pending;
    return 0;
  }
  const consumed = Math.min(state.runner.clicks, pending);
  state.runner.clicks -= consumed;
  flags.forgoNextActionsPending = pending - consumed;
  return consumed;
}

function startCorpTurn(state: GameState): void {
  state.activeSide = "corp";
  state.phase = "corp_draw_phase";
  state.timingPoint = "corp_draw.mandatory_draw";
  state.corp.clicks = 3;
  state.runner.clicks = 0;
  clearV1922ValuPakRunnerFlags(state);
  ensureRunnerTurnFlags(state).damagePreventionUsage = {};
  applyCorpStartOfTurnEffects(state);
}

function startRunnerTurn(state: GameState): void {
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  state.corp.clicks = 0;
  clearV1922EdgerunnerTempsFlags(state);
  const flags = ensureRunnerTurnFlags(state);
  flags.stoleAgendaThisTurn = false;
  flags.stoleAgendaLastTurn = false;
  flags.stoleGrayOpsAgendaThisTurn = false;
  flags.stoleBlackOpsAgendaThisTurn = false;
  flags.runAttemptsThisTurn = 0;
  flags.runAttemptsLastTurn = 0;
  flags.successfulHqRunThisTurn = false;
  flags.damagePreventionUsage = {};
  flags.startOfTurnFloatingCreditsApplied = false;
  flags.allNighterBonusRunPending = false;
  flags.valuPakProgramInstallActionsRemaining = 0;
  flags.valuPakTemporaryProgramInstallCredits = 0;
  delete flags.incubatorPendingTransforms;
  consumeRunnerFutureActionDebt(state);
  resolveBizarreEncryptionDelayedAgendas(state);
  refreshRecurringCredits(state, "runner");
  applyRunnerStartOfTurnEffects(state);
}

function resolveBizarreEncryptionDelayedAgendas(state: GameState): void {
  const delayed = state.bizarreEncryptionDelayedAgendas ?? [];
  if (delayed.length === 0) return;
  const remaining: NonNullable<GameState["bizarreEncryptionDelayedAgendas"]> =
    [];
  for (const entry of delayed) {
    const instance = state.cardInstances[entry.agendaId];
    const server = state.corp.servers.find(
      (candidate) => candidate.id === entry.serverId,
    );
    if (
      !instance ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverRoot" ||
      instance.zone.serverId !== entry.serverId ||
      !server?.root.includes(entry.agendaId)
    ) {
      continue;
    }
    const definition = DEMO_CARDS_BY_ID[instance.definitionId];
    if (!definition || definition.type !== "agenda") {
      remaining.push(entry);
      continue;
    }
    removeFromAllZones(state, entry.agendaId);
    state.runner.scoreArea.push(entry.agendaId);
    state.cardInstances[entry.agendaId] = {
      ...instance,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "scoreArea" },
    };
  }
  if (remaining.length > 0) state.bizarreEncryptionDelayedAgendas = remaining;
  else delete state.bizarreEncryptionDelayedAgendas;
}

function applyCorpStartOfTurnEffects(state: GameState): void {
  const polymerCount = state.corp.scoreArea.reduce((sum, cardId) => {
    return definitionFor(state, cardId).id === POLYMER_BREAKTHROUGH_ID
      ? sum + 1
      : sum;
  }, 0);
  if (polymerCount > 0) {
    credits(state, "corp", polymerCount);
  }
  const acmeCount = rezzedCorpRootCardIds(state).reduce((sum, cardId) => {
    return definitionFor(state, cardId).id === ACME_SAVINGS_AND_LOAN_ID
      ? sum + 1
      : sum;
  }, 0);
  if (acmeCount > 0) {
    credits(state, "corp", acmeCount);
  }
  const v1917RecurringAssetCount = rezzedCorpRootCardIds(state).reduce(
    (sum, cardId) => {
      return V1917_RECURRING_ASSET_IDS.has(definitionFor(state, cardId).id)
        ? sum + 1
        : sum;
    },
    0,
  );
  if (v1917RecurringAssetCount > 0) {
    credits(state, "corp", v1917RecurringAssetCount);
  }
  const employeeEmpowermentCount = state.corp.scoreArea.reduce(
    (sum, cardId) => {
      return definitionFor(state, cardId).id === EMPLOYEE_EMPOWERMENT_ID
        ? sum + 1
        : sum;
    },
    0,
  );
  if (employeeEmpowermentCount > 0) {
    credits(state, "corp", employeeEmpowermentCount);
  }
}

function applyRunnerStartOfTurnEffects(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  const dataRavenCounters = Object.entries(state.cardInstances).reduce(
    (sum, [cardId, instance]) => {
      return definitionFor(state, cardId).id === DATA_RAVEN_ID
        ? sum + (instance.counters?.power ?? 0)
        : sum;
    },
    0,
  );
  if (dataRavenCounters > 0) state.runner.tags += dataRavenCounters;
  if (!flags.startOfTurnFloatingCreditsApplied) {
    for (const cardId of state.runner.rig.resources) {
      const definition = definitionFor(state, cardId);
      if (definition.id === "onr_v1_163_floating-runner-bbs")
        credits(state, "runner", 1);
      if (definition.id === TOP_RUNNERS_CONFERENCE_ID)
        credits(state, "runner", 3);
    }
    flags.startOfTurnFloatingCreditsApplied = true;
  }
  if (state.pendingChoice) return;
  if (queueIncubatorStartOfTurnTransforms(state)) return;
  for (const cardId of state.runner.rig.resources.slice().sort()) {
    if (state.pendingChoice) break;
    const definition = definitionFor(state, cardId);
    if (definition.id === "onr_v1_180_smiths-pawnshop")
      startSmithsPawnshopChoice(state, cardId);
  }
}

function queueIncubatorStartOfTurnTransforms(state: GameState): boolean {
  const flags = ensureRunnerTurnFlags(state);
  if (flags.incubatorPendingTransforms === undefined) {
    const counterTotal = incubatorCounterTotal(state);
    let pending = 0;
    for (let index = 0; index < counterTotal; index += 1) {
      const die = rollDeterministicDie(
        state,
        `v191.die.${INCUBATOR_ID}.start_of_turn.roll.${state.stateVersion}.${index}`,
      );
      if (die === 6) pending += 1;
    }
    flags.incubatorPendingTransforms = pending;
  }
  if ((flags.incubatorPendingTransforms ?? 0) <= 0) return false;
  return startIncubatorTransformChoice(state);
}

function startIncubatorTransformChoice(state: GameState): boolean {
  const flags = ensureRunnerTurnFlags(state);
  const pending = Math.max(
    0,
    Math.floor(flags.incubatorPendingTransforms ?? 0),
  );
  if (pending <= 0) return false;

  const cardTargets = Object.keys(state.cardInstances)
    .sort()
    .filter((cardId) => cardCounter(state, cardId, "virus") > 0)
    .filter((cardId) => isVisibleVirusCounterCardForRunner(state, cardId))
    .map((cardId) => {
      const title = definitionFor(state, cardId).title;
      const amount = cardCounter(state, cardId, "virus");
      return {
        id: `card_${cardId}`,
        label: `${title} (${amount})`,
        publicLabel: "Virus-Counter",
        value: `card:${cardId}`,
      };
    });

  const poxTargets = state.corp.servers
    .map((server) => ({
      serverId: server.id,
      amount: poxCountersForServer(state, server.id),
    }))
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      id: `pox_${entry.serverId}`,
      label: `Pox auf ${publicServerLabel(state, entry.serverId) ?? entry.serverId} (${entry.amount})`,
      publicLabel: "Virus-Counter",
      value: `pox:${entry.serverId}`,
    }));

  const options = [...cardTargets, ...poxTargets];
  if (options.length === 0) {
    flags.incubatorPendingTransforms = 0;
    return false;
  }

  state.pendingChoice = {
    choiceId: `v191_incubator_transform_${state.stateVersion + 1}_${pending}`,
    side: "runner",
    source: `v191.incubator_transform:${state.stateVersion + 1}`,
    prompt: "Incubator: Wähle einen Virus-Counter für die Verdopplung.",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  return true;
}

function startSmithsPawnshopChoice(
  state: GameState,
  pawnshopId: CardInstanceId,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!state.runner.rig.resources.includes(pawnshopId)) return;
  const eligible = runnerInstalledCardIds(state)
    .filter((cardId) => cardId !== pawnshopId)
    .sort();
  if (eligible.length === 0) return;
  state.pendingChoice = {
    choiceId: `v170_smiths_pawnshop_${state.stateVersion + 1}`,
    side: "runner",
    source: `v170.smiths_pawnshop:${pawnshopId}:${state.stateVersion + 1}`,
    prompt:
      "Smith's Pawnshop: Eine andere installierte Karte trashen und 1 Credit nehmen?",
    kind: "select_option",
    options: [
      { id: "pass", label: "Nein" },
      ...eligible.map((cardId) => ({
        id: `card_${cardId}`,
        label: definitionFor(state, cardId).title,
        value: cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function handForSide(state: GameState, side: Side): CardInstanceId[] {
  return side === "corp" ? state.corp.hq : state.runner.grip;
}

function maxHandSize(state: GameState, side: Side): number {
  if (side === "corp")
    return state.corp.maxHandSize + v1920CorpMaxHandSizeModifier(state);
  return state.runner.maxHandSize - state.runner.coreDamage;
}

function v1920CorpMaxHandSizeModifier(state: GameState): number {
  return scoredCorpAgendaIds(state).some(
    (cardId) =>
      definitionFor(state, cardId).id === V1920_MAIN_OFFICE_RELOCATION_ID,
  )
    ? 1
    : 0;
}

function drawCorpCard(state: GameState): void {
  const cardId = state.corp.rd.shift();
  if (!cardId) {
    state.winner = "runner";
    state.gameEndReason = "corp_deck_empty";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    return;
  }
  state.corp.hq.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: { side: "corp", zone: "hq" },
  };
}

function drawCorpCards(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) drawCorpCard(state);
}

function drawRunnerCard(state: GameState): void {
  const cardId = state.runner.stack.shift();
  if (!cardId) return;
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: { side: "runner", zone: "grip" },
  };
}

function drawRunnerCards(state: GameState, amount: number): void {
  for (let index = 0; index < amount; index += 1) drawRunnerCard(state);
}

function doDamage(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  },
): DamageSummary {
  assertPositiveIntegerAmount(request.amount);
  if (request.amount > state.runner.grip.length) {
    state.winner = "corp";
    state.gameEndReason = "flatline";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.activeSide = "corp";
    delete state.run;
    return {
      damageType: request.damageType,
      amount: request.amount,
      cardsTrashed: 0,
      flatline: true,
    };
  }

  const available = state.runner.grip.slice();
  const selected: CardInstanceId[] = [];
  for (let index = 0; index < request.amount; index += 1) {
    const value = nextRandom(
      state,
      `damage:${request.damageId}:${request.damageType}:${request.source}:${request.amount}:selection:${index}`,
    );
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(
      available,
      selectedIndex,
      "Damage-Auswahl fehlt.",
    );
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }

  for (const cardId of selected) {
    removeFromAllZones(state, cardId);
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
  }

  if (request.damageType === "core") state.runner.coreDamage += request.amount;

  return {
    damageType: request.damageType,
    amount: request.amount,
    cardsTrashed: selected.length,
    flatline: false,
    ...(request.damageType === "core"
      ? {
          coreDamageAfter: state.runner.coreDamage,
          runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
        }
      : {}),
  };
}

function aggregateDamageSummaries(summaries: DamageSummary[]): DamageSummary {
  const first = mustArrayValue(summaries, 0, "Damage-Zusammenfassung fehlt.");
  const lastCoreSummary = summaries
    .slice()
    .reverse()
    .find(
      (summary) =>
        summary.coreDamageAfter !== undefined ||
        summary.runnerMaxHandSizeAfter !== undefined,
    );
  return {
    damageType: first.damageType,
    amount: summaries.reduce((total, summary) => total + summary.amount, 0),
    cardsTrashed: summaries.reduce(
      (total, summary) => total + summary.cardsTrashed,
      0,
    ),
    flatline: summaries.some((summary) => summary.flatline),
    ...(lastCoreSummary?.coreDamageAfter !== undefined
      ? { coreDamageAfter: lastCoreSummary.coreDamageAfter }
      : {}),
    ...(lastCoreSummary?.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: lastCoreSummary.runnerMaxHandSizeAfter }
      : {}),
  };
}

function setDamagePayload(
  legalAction: LegalAction,
  summary: DamageSummary,
): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    ...(summary.coreDamageAfter !== undefined
      ? { coreDamageAfter: summary.coreDamageAfter }
      : {}),
    ...(summary.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
      : {}),
  };
}

function resolveDamageOperation(
  state: GameState,
  legalAction: LegalAction,
  damageType: DamageType,
  amount: number,
  source: string,
): void {
  const request = {
    damageId: `${state.matchId}.${state.stateVersion}.${source}`,
    damageType,
    amount,
    source: `operation:${source}`,
  };
  const event = createDamageImminentEvent(state, request);
  if (openReplacementWindow(state, event, legalAction)) return;
  if (openEventModificationWindow(state, event, legalAction)) return;
  const summary = resolveDamageImminentEvent(state, event);
  setDamagePayload(legalAction, summary);
}

function createDamageImminentEvent(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  },
): ImminentEvent {
  return {
    eventId: `imminent_damage_${state.stateVersion + 1}_${sanitizeId(request.damageId)}`,
    eventType: "damage",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      damageId: request.damageId,
      damageType: request.damageType,
      amount: request.amount,
      source: request.source,
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

function openEventModificationWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const candidates = collectEventModificationCandidates(state, event);
  if (candidates.length === 0) return false;
  const sorted = candidates.slice().sort(compareEventModificationCandidate);
  if (hasEventModificationConflict(sorted))
    throw new Error("Event-Modification-Konflikt blockiert.");
  const candidate = sorted[0];
  if (!candidate) return false;
  const windowId = `v120_window_${event.eventId}`;
  const window: EventModificationWindow = {
    windowId,
    eventId: event.eventId,
    eventType: event.eventType,
    kind: candidate.kind,
    side: candidate.controller,
    candidates: sorted,
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.eventModificationWindow = window;
  state.pendingChoice = eventModificationChoice(
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    eventModificationWindowOpened: true,
    eventModificationKind: window.kind,
    eventModificationWindowId: window.windowId,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    candidateCount: window.candidates.length,
    redactedKind: "event_modification",
  };
  return true;
}

function collectEventModificationCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  if (event.eventType !== "damage") return [];
  const runtime = collectRuntimeDamagePreventionCandidates(state, event);
  const harness = collectHarnessDamagePreventionCandidates(state, event);
  return [...runtime, ...harness];
}

function collectRuntimeDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const installed = [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of installed) {
    const definition = definitionFor(state, cardId);
    const profile = RUNTIME_DAMAGE_PREVENTION_PROFILES[definition.id];
    if (!profile || !profile.damageTypes.includes(damageType)) continue;
    const used = damagePreventionUsedThisTurn(state, cardId);
    const remaining = Math.max(0, profile.maxPerTurn - used);
    if (remaining <= 0) continue;
    const preventAmount = Math.min(amount, remaining);
    candidates.push({
      candidateId: `v161_damage_prevent_${sanitizeId(cardId)}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: "runner",
      sourceRef: {
        kind: "card",
        instanceId: cardId,
        definitionId: definition.id,
        label: definition.title,
      },
      priority: profile.priority,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount,
    });
  }
  return candidates;
}

function collectHarnessDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const harness = state.eventModificationHarness?.damagePrevention;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return [];
  const preventAmount = Math.min(harness.preventAmount, amount);
  if (!Number.isInteger(preventAmount) || preventAmount <= 0) return [];
  return [
    {
      candidateId: `v120_damage_prevent_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: harness.side,
      sourceRef: {
        kind: "test_harness",
        label: harness.sourceLabel ?? "Test-only Damage Prevention",
      },
      priority: 100,
      visibility: harness.visibility ?? "hidden_info_barrier",
      optional: harness.optional ?? true,
      preventAmount,
    },
  ];
}

function openReplacementWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const candidates = collectReplacementCandidates(state, event).sort(
    compareReplacementCandidate,
  );
  if (candidates.length === 0) return false;
  if (hasReplacementConflict(candidates))
    throw new Error("Replacement-Konflikt blockiert.");
  const candidate = candidates[0];
  if (!candidate) return false;
  const windowId = `v121_window_${event.eventId}`;
  const window: ReplacementWindow = {
    windowId,
    originalEventId: event.eventId,
    eventType: event.eventType,
    candidates,
    consumedCandidateIds: [],
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.replacementWindow = window;
  state.pendingChoice = replacementChoice(
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementWindowOpened: true,
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    replacementCandidateCount: window.candidates.length,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement",
  };
  return true;
}

function collectReplacementCandidates(
  state: GameState,
  event: ImminentEvent,
): ReplacementCandidate[] {
  if (event.eventType !== "damage") return [];
  const harness = state.eventModificationHarness?.damageReplacement;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return [];
  const base: ReplacementCandidate = {
    candidateId: `v121_damage_replace_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${harness.tagAmount}`,
    controller: harness.side,
    sourceRef: {
      kind: "test_harness",
      label: harness.sourceLabel ?? "Test-only Damage Replacement",
    },
    replacesEventType: "damage",
    replacementEventType: "add_tag",
    priority: harness.priority ?? 100,
    visibility: harness.visibility ?? "hidden_info_barrier",
    optional: harness.optional ?? true,
    tagAmount: harness.tagAmount,
  };
  if (!state.eventModificationHarness?.damageReplacementConflict) return [base];
  return [
    base,
    {
      ...base,
      candidateId: `${base.candidateId}_conflict`,
      tagAmount: base.tagAmount ? base.tagAmount + 1 : 2,
    },
  ];
}

function replacementChoice(
  window: ReplacementWindow,
  event: ImminentEvent,
  stateVersion: number,
): ChoiceRequest {
  const candidate = mustArrayValue(
    window.candidates,
    0,
    "Replacement-Kandidat fehlt.",
  );
  return {
    choiceId: `v121_choice_${window.windowId}`,
    side: candidate.controller,
    source: "v121.replacement.damage",
    prompt: "Damage Replacement",
    kind: "select_option",
    options: [
      { id: "pass", label: "Nicht ersetzen", publicLabel: "Replacement" },
      {
        id: candidate.candidateId,
        label: `Damage durch ${candidate.tagAmount ?? 1} Tag ersetzen`,
        publicLabel: "Replacement",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility,
  };
}

function eventModificationChoice(
  window: EventModificationWindow,
  event: ImminentEvent,
  stateVersion: number,
): ChoiceRequest {
  const candidate = mustArrayValue(
    window.candidates,
    0,
    "Event-Modification-Kandidat fehlt.",
  );
  const amount = numberPayload(event, "amount");
  const options = [
    {
      id: "pass",
      label: "Nicht verhindern",
      publicLabel: "Event Modification",
    },
    {
      id: candidate.candidateId,
      label:
        candidate.sourceRef.kind === "card"
          ? `${candidate.sourceRef.label}: ${candidate.preventAmount ?? amount} Schaden verhindern`
          : `${candidate.preventAmount ?? amount} Schaden verhindern`,
      publicLabel: "Event Modification",
    },
  ];
  return {
    choiceId: `v120_choice_${window.windowId}`,
    side: window.side,
    source: `v120.event_modification.${window.kind}`,
    prompt: "Damage Prevention",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility,
  };
}

function resolveEventModificationChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const window = state.eventModificationWindow;
  const event = state.imminentEvent;
  if (!window || !event)
    throw new Error("Es ist kein Event-Modification-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected)
    throw new Error("Es wurde keine Event-Modification-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    eventModificationWindowId: window.windowId,
    eventModificationKind: window.kind,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "event_modification",
  };
  if (selected === "pass") {
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "pass",
      eventModificationOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
    };
    setDamagePayload(legalAction, summary);
    clearEventModificationState(state);
    return;
  }
  const candidate = window.candidates.find(
    (item) => item.candidateId === selected,
  );
  if (!candidate)
    throw new Error("Dieser Event-Modification-Kandidat ist nicht legal.");
  if (candidate.eventId !== event.eventId || candidate.kind !== "prevent")
    throw new Error(
      "Dieser Event-Modification-Kandidat passt nicht zum Fenster.",
    );
  const originalAmount = numberPayload(event, "amount");
  const preventedAmount = Math.min(
    candidate.preventAmount ?? 0,
    originalAmount,
  );
  const finalAmount = Math.max(0, originalAmount - preventedAmount);
  registerDamagePreventionUsage(state, candidate, preventedAmount);
  const summary = resolveDamageImminentEvent(state, {
    ...event,
    payload: { ...event.payload, amount: finalAmount },
  });
  legalAction.payload = {
    ...basePayload,
    eventModificationDecision: "apply",
    eventModificationOutcome:
      finalAmount === 0 ? "prevented" : "partially_prevented",
    candidateId: candidate.candidateId,
    originalAmount,
    preventedAmount,
    finalAmount,
    sourceKind: candidate.sourceRef.kind,
  };
  setDamagePayload(legalAction, summary);
  clearEventModificationState(state);
}

function resolveReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const window = state.replacementWindow;
  const event = state.imminentEvent;
  if (!window || !event)
    throw new Error("Es ist kein Replacement-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected) throw new Error("Es wurde keine Replacement-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement",
  };
  if (selected === "pass") {
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
    };
    setDamagePayload(legalAction, summary);
    clearReplacementState(state);
    return;
  }
  const candidate = window.candidates.find(
    (item) => item.candidateId === selected,
  );
  if (!candidate)
    throw new Error("Dieser Replacement-Kandidat ist nicht legal.");
  if (window.consumedCandidateIds.includes(candidate.candidateId))
    throw new Error(
      "Dieser Replacement-Kandidat wurde in diesem Fenster bereits genutzt.",
    );
  if (
    candidate.replacesEventType !== event.eventType ||
    candidate.replacementEventType !== "add_tag"
  ) {
    throw new Error(
      "Dieser Replacement-Kandidat passt nicht zum Originalevent.",
    );
  }
  window.consumedCandidateIds.push(candidate.candidateId);
  const tagAmount = candidate.tagAmount ?? 1;
  state.runner.tags += tagAmount;
  legalAction.payload = {
    ...basePayload,
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "add_tag",
    originalAmount: numberPayload(event, "amount"),
    tagsAdded: tagAmount,
    sourceKind: candidate.sourceRef.kind,
  };
  clearReplacementState(state);
}

function resolveDamageImminentEvent(
  state: GameState,
  event: ImminentEvent,
): DamageSummary {
  if (event.eventType !== "damage")
    throw new Error("Nur Damage-ImminentEvents sind in V1.2.0 auflösbar.");
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0)
    return { damageType, amount: 0, cardsTrashed: 0, flatline: false };
  return doDamage(state, {
    damageId: stringPayload(event, "damageId"),
    damageType,
    amount,
    source: stringPayload(event, "source"),
  });
}

function clearEventModificationState(state: GameState): void {
  delete state.pendingChoice;
  delete state.eventModificationWindow;
  delete state.imminentEvent;
}

function clearReplacementState(state: GameState): void {
  delete state.pendingChoice;
  delete state.replacementWindow;
  delete state.imminentEvent;
}

function compareEventModificationCandidate(
  left: EventModificationCandidate,
  right: EventModificationCandidate,
): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

function hasEventModificationConflict(
  candidates: EventModificationCandidate[],
): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority && candidate.kind !== first.kind,
  );
}

function compareReplacementCandidate(
  left: ReplacementCandidate,
  right: ReplacementCandidate,
): number {
  return (
    left.priority - right.priority ||
    left.controller.localeCompare(right.controller) ||
    (left.sourceRef.instanceId ?? "").localeCompare(
      right.sourceRef.instanceId ?? "",
    ) ||
    left.candidateId.localeCompare(right.candidateId)
  );
}

function hasReplacementConflict(candidates: ReplacementCandidate[]): boolean {
  if (candidates.length <= 1) return false;
  const first = candidates[0];
  return candidates.some(
    (candidate) =>
      candidate.priority === first?.priority &&
      (candidate.replacementEventType !== first.replacementEventType ||
        candidate.tagAmount !== first.tagAmount ||
        candidate.controller !== first.controller),
  );
}

function numberPayload(event: ImminentEvent, key: string): number {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringPayload(event: ImminentEvent, key: string): string {
  const value = event.payload[key];
  return typeof value === "string" ? value : "";
}

function damageTypePayload(event: ImminentEvent): DamageType {
  const value = event.payload.damageType;
  return value === "meat" || value === "core" ? value : "net";
}

function damagePreventionUsedThisTurn(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const flags = ensureRunnerTurnFlags(state);
  return flags.damagePreventionUsage?.[cardId] ?? 0;
}

function registerDamagePreventionUsage(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): void {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return;
  const flags = ensureRunnerTurnFlags(state);
  const usage = (flags.damagePreventionUsage ??= {});
  usage[candidate.sourceRef.instanceId] =
    (usage[candidate.sourceRef.instanceId] ?? 0) + preventedAmount;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

function requireRunnerTagged(state: GameState): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
}

function runnerStoleAgendaLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.stoleAgendaLastTurn === true;
}

function runnerRunAttemptsLastTurn(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
  );
}

function corpScoredBlackOpsAgendaLastTurn(state: GameState): boolean {
  return ensureCorpTurnFlags(state).scoredBlackOpsAgendaLastTurn === true;
}

function runnerStoleAgendaSubtypeThisTurn(
  state: GameState,
  subtype: "gray_ops" | "black_ops",
): boolean {
  if (subtype === "gray_ops")
    return state.runnerTurnFlags?.stoleGrayOpsAgendaThisTurn === true;
  return state.runnerTurnFlags?.stoleBlackOpsAgendaThisTurn === true;
}

function runnerHasInstalledCorporateAlly(state: GameState): boolean {
  return state.runner.rig.resources.some(
    (cardId) => definitionFor(state, cardId).id === "onr_v1_156_corporate-ally",
  );
}

function corpHasScoredExecutiveExtraction(state: GameState): boolean {
  return scoredCorpAgendaIds(state).some(
    (cardId) =>
      definitionFor(state, cardId).id === "onr_v1_201_executive-extraction",
  );
}

function effectiveAgendaDifficulty(
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const definition = definitionFor(state, agendaId);
  if (definition.type !== "agenda")
    throw new Error("Difficulty kann nur fuer Agenda-Karten berechnet werden.");
  let difficulty = definition.advancementRequirement ?? 0;
  if (runnerHasInstalledCorporateAlly(state)) difficulty += 1;
  if (
    corpHasScoredExecutiveExtraction(state) &&
    cardHasSubtype(definition, "gray_ops")
  )
    difficulty -= 1;
  difficulty -= v1919ServerDifficultyReduction(state, agendaId);
  return Math.max(0, difficulty);
}

function v1919ServerDifficultyReduction(
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const zone = mustInstance(state.cardInstances, agendaId).zone;
  if (zone.side !== "corp" || zone.zone !== "serverRoot" || !zone.serverId)
    return 0;
  const server = mustServer(state, zone.serverId);
  return server.root.reduce((sum, rootCardId) => {
    if (rootCardId === agendaId) return sum;
    const instance = mustInstance(state.cardInstances, rootCardId);
    if (!instance.rezzed) return sum;
    return V1919_SERVER_DIFFICULTY_UPGRADE_IDS.has(
      definitionFor(state, rootCardId).id,
    )
      ? sum + 1
      : sum;
  }, 0);
}

function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const definition = definitionFor(state, cardId);
  const basePoints = definition.agendaPoints ?? 0;
  const bonusPoints = cardCounter(state, cardId, "agenda");
  return Math.max(0, basePoints + bonusPoints);
}

function pickRunnerAgendaForAgendaPointCost(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.scoreArea
    .slice()
    .sort((left, right) => {
      const byPoints =
        agendaPointsForScoredCard(state, left) -
        agendaPointsForScoredCard(state, right);
      return byPoints !== 0 ? byPoints : left.localeCompare(right);
    })
    .find((cardId) => agendaPointsForScoredCard(state, cardId) >= 1);
}

function forfeitRunnerAgendaForPointCost(
  state: GameState,
  cardId: CardInstanceId,
): void {
  if (!cardId || !state.runner.scoreArea.includes(cardId))
    throw new Error(
      "Der Runner kann diese Agenda nicht fuer Kosten forfeiten.",
    );
  if (agendaPointsForScoredCard(state, cardId) < 1)
    throw new Error(
      "Die gewaehlte Runner-Agenda liefert keinen Agenda-Punkt fuer Kosten.",
    );
  const instance = mustInstance(state.cardInstances, cardId);
  removeFromAllZones(state, cardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.removedFromGame.push(cardId);
  specialZones.removedFromGame.sort();
  state.cardInstances[cardId] = {
    ...instance,
    faceup: true,
    rezzed: true,
    zone: { side: "special", zone: "removed_from_game", visibility: "public" },
  };
}

function forfeitCorpAgendaForPointCost(
  state: GameState,
  cardId: CardInstanceId,
): void {
  if (!cardId || !state.corp.scoreArea.includes(cardId))
    throw new Error("Die Korp kann diese Agenda nicht fuer Kosten forfeiten.");
  if (agendaPointsForScoredCard(state, cardId) < 1)
    throw new Error(
      "Die gewaehlte Korp-Agenda liefert keinen Agenda-Punkt fuer Kosten.",
    );
  const instance = mustInstance(state.cardInstances, cardId);
  removeFromAllZones(state, cardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.removedFromGame.push(cardId);
  specialZones.removedFromGame.sort();
  state.cardInstances[cardId] = {
    ...instance,
    faceup: true,
    rezzed: true,
    zone: { side: "special", zone: "removed_from_game", visibility: "public" },
  };
}

function v1919InstalledAgendaTarget(
  state: GameState,
): CardInstanceId | undefined {
  return state.corp.servers
    .flatMap((server) => server.root)
    .filter((cardId) => definitionFor(state, cardId).type === "agenda")
    .sort((left, right) => {
      const leftRemaining = Math.max(
        0,
        effectiveAgendaDifficulty(state, left) -
          mustInstance(state.cardInstances, left).advancementCounters,
      );
      const rightRemaining = Math.max(
        0,
        effectiveAgendaDifficulty(state, right) -
          mustInstance(state.cardInstances, right).advancementCounters,
      );
      return rightRemaining - leftRemaining || left.localeCompare(right);
    })[0];
}

function v1919CorpAgendaCounterTarget(
  state: GameState,
): CardInstanceId | undefined {
  const scored = state.corp.scoreArea.slice().sort()[0];
  if (scored) return scored;
  return v1919InstalledAgendaTarget(state);
}

function v1919CorpScoredAgendaForfeitTarget(
  state: GameState,
): CardInstanceId | undefined {
  return state.corp.scoreArea
    .slice()
    .sort((left, right) => {
      const byPoints =
        agendaPointsForScoredCard(state, left) -
        agendaPointsForScoredCard(state, right);
      return byPoints !== 0 ? byPoints : left.localeCompare(right);
    })
    .find((cardId) => agendaPointsForScoredCard(state, cardId) >= 1);
}

function resolveV1919CounterOperation(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
): void {
  const targetAgendaId = v1919CorpAgendaCounterTarget(state);
  if (!targetAgendaId)
    throw new Error("Die V1.9.19-Counter-Operation findet kein Agenda-Ziel.");
  if (!V1919_COUNTER_OPERATION_IDS.has(sourceDefinitionId))
    throw new Error("Die V1.9.19-Counter-Operation passt nicht zur Quelle.");
  addCardCounter(state, targetAgendaId, "power", 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1919OperationAbility: "add_power_counter",
    targetCardId: targetAgendaId,
    targetCardDefinitionId: definitionFor(state, targetAgendaId).id,
    addedCounterAmount: 1,
    remainingCounters: cardCounter(state, targetAgendaId, "power"),
  };
}

function awardRunnerEventAgendaPoint(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
): void {
  const cardId = String(legalAction.payload?.cardId ?? "");
  if (!cardId || !state.cardInstances[cardId])
    throw new Error("Die Event-Karte fuer Agenda-Punkt-Gewinn fehlt.");
  removeFromAllZones(state, cardId);
  state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  setCardCounter(state, cardId, "agenda", 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    scoredAsAgenda: true,
    sourceDefinitionId,
    gainedAgendaPoints: 1,
  };
}

function scoreAgenda(
  state: GameState,
  cardId: string,
  legalAction?: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (definition.type !== "agenda")
    throw new Error("Nur Agendas koennen gescored werden.");
  const instanceBefore = mustInstance(state.cardInstances, cardId);
  const requiredDifficulty = effectiveAgendaDifficulty(state, cardId);
  if (instanceBefore.advancementCounters < requiredDifficulty)
    throw new Error("Agenda hat nicht genug Advancements.");
  removeFromAllZones(state, cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "corp", zone: "scoreArea" },
  };
  if (cardHasSubtype(definition, "black_ops")) {
    ensureCorpTurnFlags(state).scoredBlackOpsAgendaThisTurn = true;
  }
  if (definition.id === "onr_v1_214_project-babylon") {
    const overadvance = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    const bonusAgendaPoints = Math.floor(overadvance / 2);
    setCardCounter(state, cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        projectBabylonOveradvance: overadvance,
        projectBabylonBonusAgendaPoints: bonusAgendaPoints,
      };
    }
  }
  if (V1919_OVERADVANCE_AGENDA_IDS.has(definition.id)) {
    const overadvance = Math.max(
      0,
      instanceBefore.advancementCounters - requiredDifficulty,
    );
    const bonusAgendaPoints = Math.floor(overadvance / 2);
    setCardCounter(state, cardId, "agenda", bonusAgendaPoints);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919AgendaDifficulty: requiredDifficulty,
        v1919Overadvance: overadvance,
        v1919BonusAgendaPoints: bonusAgendaPoints,
      };
    }
  }
  if (
    definition.id === "onr_v1_193_corporate-coup" ||
    definition.id === "onr_v1_209_political-coup" ||
    definition.id === DETROIT_POLICE_CONTRACT_ID
  ) {
    const counterAmount =
      definition.id === "onr_v1_193_corporate-coup"
        ? 5
        : definition.id === "onr_v1_209_political-coup"
          ? 12
          : 4;
    setCardCounter(state, cardId, "power", counterAmount);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        powerCountersAdded: counterAmount,
        agendaAbility:
          definition.id === "onr_v1_193_corporate-coup"
            ? "corporate_coup"
            : definition.id === "onr_v1_209_political-coup"
              ? "political_coup"
              : "v1912_detroit_police_contract",
      };
    }
  }
  if (definition.id === V1922_CORPORATE_RETREAT_ID) {
    setCardCounter(state, cardId, "mark", 1);
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        agendaAbility: "v1922_corporate_retreat",
        corporateRetreatAvailable: true,
      };
  }
  if (definition.id === "onr_v1_203_hostile-takeover") {
    state.corp.credits += 5;
    if (legalAction)
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        onScoreGainCredits: 5,
        corpCreditsAfter: state.corp.credits,
      };
  }
  if (definition.id === V1922_CORPORATE_WAR_ID) {
    const corpCreditsBefore = state.corp.credits;
    const thresholdMet = corpCreditsBefore >= 12;
    if (thresholdMet) {
      state.corp.credits += 12;
    } else {
      state.corp.credits = 0;
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922CorporateWarThreshold: 12,
        corpCreditsBeforeCorporateWar: corpCreditsBefore,
        corporateWarThresholdMet: thresholdMet,
        onScoreGainCredits: thresholdMet ? 12 : 0,
        onScoreLostAllCredits: !thresholdMet,
        corpCreditsAfter: state.corp.credits,
      };
    }
  }
  if (definition.id === "onr_v1_212_priority-requisition") {
    const candidates = Object.entries(state.cardInstances)
      .filter(
        ([, instance]) =>
          instance.zone.side === "corp" &&
          instance.zone.zone === "serverIce" &&
          !instance.rezzed,
      )
      .map(([instanceId]) => instanceId as CardInstanceId)
      .sort((left, right) => {
        const leftCost = definitionFor(state, left).rezCost ?? 0;
        const rightCost = definitionFor(state, right).rezCost ?? 0;
        return rightCost - leftCost || left.localeCompare(right);
      });
    const freeRezTarget = candidates[0];
    if (freeRezTarget) {
      state.cardInstances[freeRezTarget] = {
        ...mustInstance(state.cardInstances, freeRezTarget),
        faceup: true,
        rezzed: true,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          priorityRequisitionFreeRez: true,
          priorityRequisitionTarget: freeRezTarget,
          priorityRequisitionTargetDefinitionId: definitionFor(
            state,
            freeRezTarget,
          ).id,
        };
      }
    }
  }
  if (definition.id === "onr_v1_215_security-net-optimization" && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      securityNetOptimizationActive: true,
    };
  }
  cleanupEmptyRemotes(state);
}

function action(
  state: GameState,
  side: Side,
  type: ActionType,
  label: string,
  source: LegalAction["source"],
  costs: LegalAction["costs"] = [],
  payload?: LegalAction["payload"],
  metadata: Partial<
    Pick<
      LegalAction,
      "abilityRef" | "effectRef" | "choiceRequirements" | "targetRequirements"
    >
  > = {},
): LegalAction {
  return {
    actionId: makeActionId(type, side, payload, source),
    side,
    type,
    label,
    source,
    timingPoint: state.timingPoint,
    costs,
    targetRequirements: metadata.targetRequirements ?? [],
    visibility:
      type.startsWith("rez") ||
      type === "score_agenda" ||
      type === "trash_resource" ||
      payload?.v1917AssetAbility ||
      (side === "runner" && type === "install_card")
        ? "public"
        : "private_to_actor",
    expiresAtStateVersion: state.stateVersion,
    ...(metadata.choiceRequirements
      ? { choiceRequirements: metadata.choiceRequirements }
      : {}),
    ...(metadata.abilityRef ? { abilityRef: metadata.abilityRef } : {}),
    ...(metadata.effectRef ? { effectRef: metadata.effectRef } : {}),
    ...(payload ? { payload } : {}),
  };
}

function choiceAction(state: GameState, choice: ChoiceRequest): LegalAction {
  return action(
    state,
    choice.side,
    "resolve_choice",
    choice.prompt,
    "game_rule",
    [],
    {
      choiceId: choice.choiceId,
      choiceVisibility: choice.visibility,
      choiceKind: choice.kind,
    },
    {
      choiceRequirements: [
        {
          choiceId: choice.choiceId,
          minSelections: choice.minSelections,
          maxSelections: choice.maxSelections,
          optionIds: choice.options.map((option) => option.id),
        },
      ],
    },
  );
}

function abilityMetadata(
  sourceCardInstanceId: CardInstanceId,
  abilityId: string,
  encounteredIceId?: CardInstanceId,
): Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements"> {
  return {
    abilityRef: { sourceCardInstanceId, abilityId },
    effectRef: `effect.${abilityId}`,
    targetRequirements: [
      { id: "encounteredIce", kind: "card", visibility: "public" },
      {
        id: "subroutine",
        kind: "subroutine",
        ...(encounteredIceId ? { sourceIceRef: encounteredIceId } : {}),
      },
    ],
  };
}

function visibleChoice(
  choice: ChoiceRequest,
): NonNullable<PlayerView["pendingChoice"]> {
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => ({
      id: option.id,
      label: option.label,
      ...(option.publicLabel ? { publicLabel: option.publicLabel } : {}),
      ...(option.value !== undefined &&
      !(
        choice.visibility === "public" &&
        option.publicLabel &&
        typeof option.value === "string" &&
        option.id.startsWith("ice_")
      )
        ? { value: option.value }
        : {}),
    })),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
  };
}

function validateChoiceAction(
  choice: ChoiceRequest | undefined,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): string | undefined {
  if (!choice)
    return legalAction.type === "resolve_choice"
      ? "Es ist keine Choice offen."
      : undefined;
  if (legalAction.type !== "resolve_choice")
    return "Solange eine Choice offen ist, sind keine anderen Aktionen legal.";
  if (playerAction.side !== choice.side)
    return "Diese Choice gehoert der anderen Seite.";
  if (choice.stateVersion !== playerAction.clientKnownStateVersion)
    return "Diese Choice gehoert zu einem anderen Spielzustand.";
  if (playerAction.selectedChoices?.choiceId !== choice.choiceId)
    return "Die ChoiceId ist ungueltig.";
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  if (
    selectedOptionIds.length < choice.minSelections ||
    selectedOptionIds.length > choice.maxSelections
  )
    return "Die Anzahl der gewaehlten Optionen ist ungueltig.";
  const optionIds = new Set(choice.options.map((option) => option.id));
  if (selectedOptionIds.some((id) => !optionIds.has(id)))
    return "Eine gewaehlte Option ist nicht legal.";
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length)
    return "Eine Option wurde doppelt gewaehlt.";
  return undefined;
}

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}

function resolvePendingChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choiceId = String(legalAction.payload?.choiceId ?? "");
  if (!state.pendingChoice || state.pendingChoice.choiceId !== choiceId)
    throw new Error("Diese Choice ist nicht offen.");
  if (state.pendingChoice.source === "setup.mulligan") {
    resolveSetupMulliganChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source === "discard_phase") {
    resolveDiscardChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v121.replacement")) {
    resolveReplacementChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v120.event_modification")) {
    resolveEventModificationChoice(state, legalAction, playerAction);
    return;
  }
  if (state.trace) {
    if (state.trace.status === "corp_bid") {
      resolveTraceCorpBid(state, legalAction, playerAction);
      return;
    }
    resolveTraceRunnerBid(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v098.search_stack") ||
    state.pendingChoice.source.startsWith("v1911.search_stack") ||
    state.pendingChoice.source.startsWith("v1912.search_stack")
  ) {
    resolveRunnerStackSearchChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v098.arrange_stack_top2") ||
    state.pendingChoice.source.startsWith("v1911.arrange_stack_top2")
  ) {
    resolveRunnerStackArrangeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1911.corp_rd_arrange_top2")) {
    resolveCorpRdArrangeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1917.corp_rd_arrange_top2")) {
    resolveV1917CorpRdArrangeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.corp_rd_arrange_top5")) {
    resolveV1922CorpRdTopReorderChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.corp_archives_to_hq")) {
    resolveV1922CorpArchivesToHqChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.anonymous_tip_derez_black_ice")
  ) {
    resolveV1922AnonymousTipChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.core_command_jettison_ice")
  ) {
    resolveV1922CoreCommandJettisonIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.forged_activation_orders_target",
    )
  ) {
    resolveV1922ForgedActivationOrdersTargetChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.forged_activation_orders_corp")
  ) {
    resolveV1922ForgedActivationOrdersCorpChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.security_code_worm_chip")) {
    resolveV1922SecurityCodeWormChipChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.synchronized_attack_on_hq")
  ) {
    resolveV1922SynchronizedAttackOnHqChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.runner_stack_top5_choose_one_arrange_rest",
    )
  ) {
    resolveV1922RunnerStackTop5Choice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.runner_grip_trash_gain_credits",
    )
  ) {
    resolveV1922RunnerGripTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.runner_installed_trash_gain_credits",
    )
  ) {
    resolveV1922RunnerInstalledTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.open_ended_mileage_return")
  ) {
    resolveV1922OpenEndedMileageReturnChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v099.host_program")) {
    resolveRunnerHostingChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v191.incubator_transform")) {
    resolveIncubatorTransformChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v199.aardvark")) {
    resolveAardvarkInterceptionChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v199.chimera_daemon_trash")) {
    resolveChimeraDaemonTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v170.smiths_pawnshop")) {
    resolveSmithsPawnshopChoice(state, legalAction, playerAction);
    return;
  }
  delete state.pendingChoice;
}

function setupMulliganChoice(
  state: GameState,
  side: Side,
  stateVersion = state.stateVersion,
): ChoiceRequest {
  return {
    choiceId: `setup_mulligan_${side}_${stateVersion}`,
    side,
    source: "setup.mulligan",
    prompt: side === "runner" ? "Runner-Starthand" : "Korp-Starthand",
    kind: "select_option",
    options: [
      {
        id: "keep",
        label: "Starthand behalten",
        publicLabel: "Setup-Entscheidung",
      },
      {
        id: "mulligan",
        label: "Mulligan nehmen",
        publicLabel: "Setup-Entscheidung",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: "hidden_info_barrier",
  };
}

function discardChoice(
  state: GameState,
  side: Side,
  requiredDiscardCount: number,
  stateVersion = state.stateVersion,
): ChoiceRequest {
  const hand = handForSide(state, side);
  return {
    choiceId: `discard_${side}_${stateVersion}`,
    side,
    source: "discard_phase",
    prompt: side === "corp" ? "Korp-Discard wählen" : "Runner-Discard wählen",
    kind: "select_cards",
    options: hand.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      publicLabel: "Handkarte",
      value: cardId,
    })),
    minSelections: requiredDiscardCount,
    maxSelections: requiredDiscardCount,
    stateVersion,
    visibility: "hidden_info_barrier",
  };
}

function resolveDiscardChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || choice.source !== "discard_phase")
    throw new Error("Es ist keine Discard-Choice offen.");
  const side = choice.side;
  if (
    state.timingPoint !==
    (side === "corp"
      ? "corp_discard.select_cards"
      : "runner_discard.select_cards")
  ) {
    throw new Error("Discard ist im aktuellen Timingpoint nicht legal.");
  }
  const expectedCount =
    handForSide(state, side).length - maxHandSize(state, side);
  if (expectedCount !== choice.minSelections)
    throw new Error("Die Discard-Anzahl ist nicht mehr gueltig.");
  const cockroachRandomized =
    side === "corp" && cockroachRandomHqDiscardActive(state);
  let selectedCards: CardInstanceId[] = [];
  if (cockroachRandomized) {
    selectedCards = discardRandomCorpHqCards(
      state,
      expectedCount,
      `v191.random.${COCKROACH_ID}.hq_discard_phase`,
    );
  } else {
    const selectedIds = selectedChoiceIds(playerAction.selectedChoices);
    selectedCards = selectedIds.map((optionId) => {
      const option = choice.options.find(
        (candidate) => candidate.id === optionId,
      );
      if (typeof option?.value !== "string")
        throw new Error("Die Discard-Auswahl ist ungueltig.");
      return option.value;
    });
    if (selectedCards.length !== expectedCount)
      throw new Error("Die Discard-Anzahl ist nicht mehr gueltig.");
    const hand = handForSide(state, side);
    for (const cardId of selectedCards) {
      const instance = mustInstance(state.cardInstances, cardId);
      if (instance.owner !== side || !hand.includes(cardId))
        throw new Error("Eine Discard-Karte liegt nicht in der Hand.");
    }

    for (const cardId of selectedCards) {
      removeFromAllZones(state, cardId);
      if (side === "corp") {
        state.corp.archives.push(cardId);
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          faceup: false,
          rezzed: false,
          zone: { side: "corp", zone: "archives" },
        };
      } else {
        state.runner.heap.push(cardId);
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          faceup: true,
          rezzed: true,
          zone: { side: "runner", zone: "heap" },
        };
      }
    }
  }

  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    discardResolved: true,
    discardSide: side,
    discardCount: selectedCards.length,
    discardZone: side === "corp" ? "archives" : "heap",
    ...(cockroachRandomized ? { randomizedByCockroach: true } : {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "discard_phase",
  };
  delete state.pendingChoice;
  completeDiscardPhase(state, side);
}

function resolveSetupMulliganChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const setup = state.setup ?? {
    status:
      state.pendingChoice?.side === "runner"
        ? "mulligan_runner"
        : "mulligan_corp",
    initialHandSize: INITIAL_HAND_SIZE,
    resolved: {},
    mulligansTaken: {},
  };
  const side = state.pendingChoice?.side;
  if (!side) throw new Error("Es ist keine Setup-Choice offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (selected !== "keep" && selected !== "mulligan")
    throw new Error("Die Mulligan-Auswahl ist ungueltig.");
  if (setup.resolved[side])
    throw new Error(
      "Diese Seite hat ihre Mulligan-Entscheidung bereits getroffen.",
    );

  if (selected === "mulligan") {
    if ((setup.mulligansTaken[side] ?? 0) >= 1)
      throw new Error("Diese Seite hat bereits einen Mulligan genommen.");
    takeSetupMulligan(state, side, setup.initialHandSize);
    setup.mulligansTaken[side] = (setup.mulligansTaken[side] ?? 0) + 1;
  }
  setup.resolved[side] = selected;
  state.setup = setup;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    setupStep: "mulligan",
    setupSide: side,
    setupDecisionPublic: "resolved",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "setup_mulligan",
  };

  if (side === "runner") {
    setup.status = "mulligan_corp";
    state.activeSide = "corp";
    state.phase = "setup";
    state.timingPoint = "setup.mulligan.corp";
    state.pendingChoice = setupMulliganChoice(
      state,
      "corp",
      state.stateVersion + 1,
    );
    return;
  }

  setup.status = "complete";
  delete state.pendingChoice;
  state.activeSide = "corp";
  state.phase = "corp_draw_phase";
  state.timingPoint = "corp_draw.mandatory_draw";
}

function takeSetupMulligan(
  state: GameState,
  side: Side,
  handSize: number,
): void {
  if (side === "runner") {
    const allIds = [...state.runner.grip, ...state.runner.stack];
    for (const id of allIds)
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "runner", zone: "stack" },
      };
    const shuffled = shuffleStateIds(
      state,
      allIds,
      "setup.shuffle.runner.mulligan",
    );
    const grip = shuffled.splice(0, handSize);
    state.runner.grip = grip;
    state.runner.stack = shuffled;
    for (const id of grip)
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "runner", zone: "grip" },
      };
    recordStateRandomMarkers(
      state,
      "setup.draw.runner.mulligan_hand",
      grip.length,
    );
    return;
  }

  const allIds = [...state.corp.hq, ...state.corp.rd];
  for (const id of allIds)
    state.cardInstances[id] = {
      ...mustInstance(state.cardInstances, id),
      zone: { side: "corp", zone: "rd" },
    };
  const shuffled = shuffleStateIds(
    state,
    allIds,
    "setup.shuffle.corp.mulligan",
  );
  const hq = shuffled.splice(0, handSize);
  state.corp.hq = hq;
  state.corp.rd = shuffled;
  for (const id of hq)
    state.cardInstances[id] = {
      ...mustInstance(state.cardInstances, id),
      zone: { side: "corp", zone: "hq" },
    };
  recordStateRandomMarkers(state, "setup.draw.corp.mulligan_hand", hq.length);
}

function startRunnerStackSearchChoice(
  state: GameState,
  sourcePrefix = "v098.search_stack",
  choiceIdPrefix = "v098_search_stack",
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.stack
    .filter((cardId) => definitionFor(state, cardId).type === "program")
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0)
    throw new Error("Keine suchbare Programmkarte im Stack.");
  state.pendingChoice = {
    choiceId: `${choiceIdPrefix}_${state.stateVersion + 1}`,
    side: "runner",
    source: `${sourcePrefix}:${state.stateVersion + 1}`,
    prompt: "Stack durchsuchen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveRunnerStackSearchChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Search-Choice offen.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId || !state.runner.stack.includes(cardId))
    throw new Error("Die gewaehlte Karte liegt nicht im Stack.");
  if (definitionFor(state, cardId).type !== "program")
    throw new Error("Nur Programme sind in dieser Search-Harness legal.");
  removeFromAllZones(state, cardId);
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: { side: "runner", zone: "grip" },
  };
  shuffleRunnerStack(state, `v098_search_stack:${choice.choiceId}:shuffle`);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "search_stack",
    selectedCount: 1,
    shuffled: true,
  };
}

function startRunnerStackArrangeChoice(
  state: GameState,
  sourcePrefix = "v098.arrange_stack_top2",
  choiceIdPrefix = "v098_arrange_stack_top2",
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const topCards = state.runner.stack.slice(0, 2);
  if (topCards.length < 2) throw new Error("Nicht genug Karten fuer Arrange.");
  state.pendingChoice = {
    choiceId: `${choiceIdPrefix}_${state.stateVersion + 1}`,
    side: "runner",
    source: `${sourcePrefix}:${state.stateVersion + 1}`,
    prompt: "Top 2 Karten anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveRunnerStackArrangeChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Arrange-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const topCards = state.runner.stack.slice(0, choice.options.length);
  if (selectedIds.length !== topCards.length)
    throw new Error("Die Arrange-Auswahl ist unvollstaendig.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    topCards.some((cardId) => !selectedSet.has(cardId))
  )
    throw new Error("Die Arrange-Auswahl enthaelt ungueltige Karten.");
  state.runner.stack = [
    ...selectedIds,
    ...state.runner.stack.slice(topCards.length),
  ];
  for (const cardId of selectedIds) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "runner", zone: "stack" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "arrange_stack",
    arrangedCount: selectedIds.length,
  };
}

function startV1922RunnerStackTop5Choice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const topCards = state.runner.stack.slice(0, 5);
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  state.pendingChoice = {
    choiceId: `v1922_runner_stack_top5_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.runner_stack_top5_choose_one_arrange_rest:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Stack-Spitze wählen und anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function startV1922AnonymousTipChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = rezzedBlackIceIds(state);
  if (targets.length === 0)
    throw new Error("Keine gerezzte Black ICE als Ziel fuer Anonymous Tip.");
  state.pendingChoice = {
    choiceId: `v1922_anonymous_tip_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.anonymous_tip_derez_black_ice:${sourceCardId}`,
    prompt: "Black ICE derezzen",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = definitionFor(state, cardId);
      const serverLabel = publicServerLabelForCard(state, cardId) ?? "Server";
      return {
        id: `card_${cardId}`,
        label: `${definition.title} (${serverLabel})`,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveV1922AnonymousTipChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.anonymous_tip_derez_black_ice")
  )
    throw new Error("Es ist keine V1.9.22-Anonymous-Tip-Choice offen.");
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !rezzedBlackIceIds(state).includes(selectedId))
    throw new Error("Das Anonymous-Tip-Ziel ist keine gerezzte Black ICE.");
  const targetDefinition = definitionFor(state, selectedId);
  state.cardInstances[selectedId] = {
    ...mustInstance(state.cardInstances, selectedId),
    faceup: false,
    rezzed: false,
  };
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "derez_black_ice",
    derezzedCount: 1,
    targetCardDefinitionId: targetDefinition.id,
  };
}

function startV1922CoreCommandJettisonIceChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = affordableRezzedInstalledIceIdsForRunner(state);
  if (targets.length === 0)
    throw new Error(
      "Keine bezahlbare gerezzte ICE als Ziel fuer Core Command: Jettison Ice.",
    );
  state.pendingChoice = {
    choiceId: `v1922_core_command_jettison_ice_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.core_command_jettison_ice:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Gerezzte ICE trashen",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = definitionFor(state, cardId);
      const serverLabel = publicServerLabelForCard(state, cardId) ?? "Server";
      return {
        id: `card_${cardId}`,
        label: `${definition.title} (${serverLabel})`,
        publicLabel: `${definition.title} (${serverLabel})`,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveV1922CoreCommandJettisonIceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.core_command_jettison_ice"))
    throw new Error("Es ist keine V1.9.22-Core-Command-Choice offen.");
  if (ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true)
    throw new Error(
      "Core Command: Jettison Ice benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !rezzedInstalledIceIds(state).includes(selectedId))
    throw new Error(
      "Das Core-Command-Ziel ist keine gerezzte installierte ICE.",
    );
  const rezCost = rezCostForCard(state, selectedId);
  if (state.runner.credits < rezCost)
    throw new Error(
      "Der Runner kann die Rez-Kosten fuer Core Command nicht zahlen.",
    );
  const definition = definitionFor(state, selectedId);
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  spendCredits(state, "runner", rezCost);
  trashCorpInstalledCardToArchives(state, selectedId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
    rezCostPaid: rezCost,
    runnerCreditsAfter: state.runner.credits,
    trashedCount: 1,
    targetCardDefinitionId: definition.id,
    targetServerLabel: serverLabel,
  };
}

function startV1922ForgedActivationOrdersTargetChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = unrezzedInstalledIceIds(state);
  if (targets.length === 0)
    throw new Error(
      "Keine unrezzte ICE als Ziel fuer Forged Activation Orders.",
    );
  state.pendingChoice = {
    choiceId: `v1922_forged_activation_orders_target_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.forged_activation_orders_target:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "ICE für Rez-/Trash-Entscheidung wählen",
    kind: "select_cards",
    options: targets.map((cardId, index) => {
      const serverLabel = publicServerLabelForCard(state, cardId) ?? "Server";
      return {
        id: `ice_${index + 1}`,
        label: `ICE in ${serverLabel}`,
        publicLabel: `ICE in ${serverLabel}`,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveV1922ForgedActivationOrdersTargetChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.forged_activation_orders_target")
  )
    throw new Error(
      "Es ist keine V1.9.22-Forged-Activation-Orders-Ziel-Choice offen.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !unrezzedInstalledIceIds(state).includes(selectedId))
    throw new Error(
      "Das Forged-Activation-Orders-Ziel ist keine unrezzte installierte ICE.",
    );
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  state.pendingChoice = {
    choiceId: `v1922_forged_activation_orders_corp_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.forged_activation_orders_corp:${selectedId}:${state.stateVersion + 1}`,
    prompt: "ICE rezzen oder trashen",
    kind: "select_option",
    options: [
      ...(state.corp.credits >= rezCostForCard(state, selectedId)
        ? [
            {
              id: "rez_ice",
              label: "ICE rezzen",
              publicLabel: "ICE gerezzt",
              value: "rez_ice",
            },
          ]
        : []),
      {
        id: "trash_ice",
        label: "ICE trashen",
        publicLabel: "ICE getrasht",
        value: "trash_ice",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "force_rez_or_trash_ice",
    targetServerLabel: serverLabel,
    targetVisibility: "installed_ice_position",
  };
}

function resolveV1922ForgedActivationOrdersCorpChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.forged_activation_orders_corp")
  )
    throw new Error(
      "Es ist keine V1.9.22-Forged-Activation-Orders-Korp-Choice offen.",
    );
  const [, targetIceId] = choice.source.split(":");
  if (!targetIceId || !unrezzedInstalledIceIds(state).includes(targetIceId))
    throw new Error(
      "Das Forged-Activation-Orders-Ziel ist nicht mehr unrezzte installierte ICE.",
    );
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const definition = definitionFor(state, targetIceId);
  const serverLabel = publicServerLabelForCard(state, targetIceId) ?? "Server";
  if (selected === "rez_ice") {
    const rezCost = rezCostForCard(state, targetIceId);
    spendCredits(state, "corp", rezCost);
    state.cardInstances[targetIceId] = {
      ...mustInstance(state.cardInstances, targetIceId),
      rezzed: true,
      faceup: true,
    };
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "rez_ice",
      rezCostPaid: rezCost,
      targetCardDefinitionId: definition.id,
      targetServerLabel: serverLabel,
    };
    return;
  }
  if (selected !== "trash_ice")
    throw new Error(
      "Die Forged-Activation-Orders-Korp-Entscheidung ist ungueltig.",
    );
  trashCorpInstalledCardToArchives(state, targetIceId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "force_rez_or_trash_ice",
    corpDecision: "trash_ice",
    trashedCount: 1,
    targetCardDefinitionId: definition.id,
    targetServerLabel: serverLabel,
  };
}

function startV1922SecurityCodeWormChipChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = unrezzedInstalledIceIds(state);
  if (targets.length === 0)
    throw new Error(
      "Keine unrezzte ICE als Ziel fuer Security Code WORM Chip.",
    );
  state.pendingChoice = {
    choiceId: `v1922_security_code_worm_chip_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.security_code_worm_chip:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Unrezzte ICE trashen",
    kind: "select_cards",
    options: targets.map((cardId, index) => {
      const serverLabel = publicServerLabelForCard(state, cardId) ?? "Server";
      return {
        id: `ice_${index + 1}`,
        label: `ICE in ${serverLabel}`,
        publicLabel: `ICE in ${serverLabel}`,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveV1922SecurityCodeWormChipChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.security_code_worm_chip"))
    throw new Error(
      "Es ist keine V1.9.22-Security-Code-WORM-Chip-Choice offen.",
    );
  if (ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true)
    throw new Error(
      "Security Code WORM Chip benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !unrezzedInstalledIceIds(state).includes(selectedId))
    throw new Error(
      "Das Security-Code-WORM-Chip-Ziel ist keine unrezzte installierte ICE.",
    );
  const definition = definitionFor(state, selectedId);
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  trashCorpInstalledCardToArchives(state, selectedId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
    targetVisibility: "installed_ice_position",
    targetServerLabel: serverLabel,
    trashedCount: 1,
    targetCardDefinitionId: definition.id,
  };
}

function startV1922SynchronizedAttackOnHqChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (state.corp.hq.length === 0)
    throw new Error("HQ enthaelt keine Karten fuer Synchronized Attack on HQ.");
  state.pendingChoice = {
    choiceId: `v1922_synchronized_attack_on_hq_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.synchronized_attack_on_hq:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "HQ-Karten fuer je 2 Credits behalten",
    kind: "select_cards",
    options: state.corp.hq.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 0,
    maxSelections: Math.min(
      state.corp.hq.length,
      Math.floor(state.corp.credits / 2),
    ),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveV1922SynchronizedAttackOnHqChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.synchronized_attack_on_hq"))
    throw new Error(
      "Es ist keine V1.9.22-Synchronized-Attack-on-HQ-Choice offen.",
    );
  if (ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true)
    throw new Error(
      "Synchronized Attack on HQ benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
    );
  const retainedIds = selectedChoiceCardIds(choice, playerAction);
  const retainedSet = new Set(retainedIds);
  if (
    retainedSet.size !== retainedIds.length ||
    retainedIds.some((cardId) => !state.corp.hq.includes(cardId))
  )
    throw new Error("Eine gewaehlte HQ-Karte ist nicht legal.");
  const cost = retainedIds.length * 2;
  if (state.corp.credits < cost)
    throw new Error("Die Korp kann die behaltenen HQ-Karten nicht bezahlen.");
  const discardedIds = state.corp.hq.filter(
    (cardId) => !retainedSet.has(cardId),
  );
  spendCredits(state, "corp", cost);
  for (const cardId of discardedIds) {
    removeFromAllZones(state, cardId);
    state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "archives" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
    retainedCount: retainedIds.length,
    discardedCount: discardedIds.length,
    paidCredits: cost,
    corpCreditsAfter: state.corp.credits,
  };
}

function resolveV1922RunnerStackTop5Choice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine V1.9.22-Stack-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const topCards = state.runner.stack.slice(0, choice.options.length);
  if (selectedIds.length !== topCards.length)
    throw new Error("Die Stack-Auswahl ist unvollstaendig.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    topCards.some((cardId) => !selectedSet.has(cardId))
  )
    throw new Error("Die Stack-Auswahl enthaelt ungueltige Karten.");
  const chosenCard = selectedIds[0];
  if (!chosenCard)
    throw new Error("Es wurde keine Karte fuer die Grip gewaehlt.");
  const arrangedRest = selectedIds.slice(1);
  state.runner.stack = [
    ...arrangedRest,
    ...state.runner.stack.slice(topCards.length),
  ];
  state.runner.grip.push(chosenCard);
  state.cardInstances[chosenCard] = {
    ...mustInstance(state.cardInstances, chosenCard),
    zone: { side: "runner", zone: "grip" },
  };
  for (const cardId of arrangedRest) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "runner", zone: "stack" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
    selectedCount: 1,
    arrangedCount: arrangedRest.length,
  };
}

function startV1922RunnerGripTrashChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.grip.map((cardId) => {
    const definition = definitionFor(state, cardId);
    return { id: `card_${cardId}`, label: definition.title, value: cardId };
  });
  if (options.length === 0) throw new Error("Keine Karten in der Grip.");
  state.pendingChoice = {
    choiceId: `v1922_runner_grip_trash_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.runner_grip_trash_gain_credits:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Grip-Karten trashen",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(5, options.length),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveV1922RunnerGripTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine V1.9.22-Grip-Trash-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length > 5)
    throw new Error("Organ Donor darf hoechstens fuenf Karten trashen.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    selectedIds.some((cardId) => !state.runner.grip.includes(cardId))
  )
    throw new Error("Die Grip-Auswahl enthaelt ungueltige Karten.");
  for (const cardId of selectedIds) {
    removeFromAllZones(state, cardId);
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      zone: { side: "runner", zone: "heap" },
    };
  }
  const gainedCredits = selectedIds.length * 2;
  if (gainedCredits > 0) credits(state, "runner", gainedCredits);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_runner_grip_trash_gain_credits",
    trashedCount: selectedIds.length,
    gainedCredits,
    runnerCreditsAfter: state.runner.credits,
  };
}

function startV1922RunnerInstalledTrashChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const installed = runnerInstalledCardIds(state);
  if (installed.length === 0)
    throw new Error("Keine installierten Runner-Karten.");
  state.pendingChoice = {
    choiceId: `v1922_runner_installed_trash_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.runner_installed_trash_gain_credits:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Installierte Karten trashen",
    kind: "select_cards",
    options: installed.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 0,
    maxSelections: installed.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveV1922RunnerInstalledTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice)
    throw new Error("Es ist keine V1.9.22-Installed-Trash-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const installed = runnerInstalledCardIds(state);
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    selectedIds.some((cardId) => !installed.includes(cardId))
  )
    throw new Error("Die Installed-Auswahl enthaelt ungueltige Karten.");
  for (const cardId of selectedIds) {
    removeFromAllZones(state, cardId);
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      zone: { side: "runner", zone: "heap" },
    };
  }
  const gainedCredits = selectedIds.length * 3;
  if (gainedCredits > 0) credits(state, "runner", gainedCredits);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_runner_installed_trash_gain_credits",
    trashedCount: selectedIds.length,
    gainedCredits,
    runnerCreditsAfter: state.runner.credits,
  };
}

function startV1922OpenEndedMileageReturnChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `v1922_open_ended_mileage_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.open_ended_mileage_return:${sourceCardId}`,
    prompt: "Open-Ended Mileage Program zuruecknehmen?",
    kind: "select_option",
    options: [
      {
        id: "leave_in_heap",
        label: "Im Heap lassen",
        publicLabel: "Nicht zurueckgenommen",
        value: "leave_in_heap",
      },
      {
        id: "pay_1_return_to_grip",
        label: "1 Credit zahlen und zuruecknehmen",
        publicLabel: "Zurueckgenommen",
        value: "pay_1_return_to_grip",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
}

function resolveV1922OpenEndedMileageReturnChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.open_ended_mileage_return"))
    throw new Error("Es ist keine V1.9.22-Open-Ended-Mileage-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (!sourceCardId)
    throw new Error("Open-Ended Mileage Program hat keine Quellkarte.");
  const selectedOptionIds = Array.isArray(
    playerAction.selectedChoices?.selectedOptionIds,
  )
    ? playerAction.selectedChoices.selectedOptionIds.map((optionId) =>
        String(optionId),
      )
    : [];
  const selectedOptionId = selectedOptionIds[0] ?? "";
  if (selectedOptionId === "pay_1_return_to_grip") {
    if (!state.runner.heap.includes(sourceCardId))
      throw new Error("Open-Ended Mileage Program liegt nicht im Heap.");
    spendCredits(state, "runner", 1);
    removeFromAllZones(state, sourceCardId);
    state.runner.grip.push(sourceCardId);
    state.cardInstances[sourceCardId] = {
      ...mustInstance(state.cardInstances, sourceCardId),
      faceup: true,
      zone: { side: "runner", zone: "grip" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "remove_tag_optional_return",
    returnDecision: selectedOptionId,
    returnedToGrip: selectedOptionId === "pay_1_return_to_grip",
    paidCredits: selectedOptionId === "pay_1_return_to_grip" ? 1 : 0,
    runnerCreditsAfter: state.runner.credits,
  };
}

function startCorpRdArrangeChoice(
  state: GameState,
  sourceIceId: CardInstanceId,
  subroutineIndex: number,
  legalAction?: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const topCards = state.corp.rd.slice(0, 2);
  if (topCards.length < 2)
    throw new Error("Nicht genug Karten fuer R&D-Arrange.");
  state.pendingChoice = {
    choiceId: `v1911_corp_rd_arrange_top2_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1911.corp_rd_arrange_top2:${sourceIceId}:${subroutineIndex}:${state.stateVersion + 1}`,
    prompt: "R&D-Spitze anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_corp_reorder_rd_top2",
      arrangedCount: topCards.length,
    };
  }
}

function resolveCorpRdArrangeChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1911.corp_rd_arrange_top2"))
    throw new Error("Es ist keine R&D-Arrange-Choice offen.");
  const [, sourceIceId, subroutineIndexRaw] = choice.source.split(":");
  if (
    !sourceIceId ||
    definitionFor(state, sourceIceId).id !== TOO_MANY_DOORS_ID
  )
    throw new Error("Die R&D-Arrange-Choice gehoert nicht zu Too Many Doors.");
  const subroutineIndex = Number(subroutineIndexRaw);
  if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
    throw new Error("Die R&D-Arrange-Subroutine ist ungueltig.");
  const run = mustRun(state);
  if (run.encounteredIceId !== sourceIceId)
    throw new Error(
      "Die R&D-Arrange-Choice gehoert nicht mehr zum aktuellen Encounter.",
    );
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const topCards = state.corp.rd.slice(0, choice.options.length);
  if (selectedIds.length !== topCards.length)
    throw new Error("Die R&D-Arrange-Auswahl ist unvollstaendig.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    topCards.some((cardId) => !selectedSet.has(cardId))
  )
    throw new Error("Die R&D-Arrange-Auswahl enthaelt ungueltige Karten.");
  state.corp.rd = [...selectedIds, ...state.corp.rd.slice(topCards.length)];
  for (const cardId of selectedIds) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
  if (!run.resolvedSubroutineIndexes.includes(subroutineIndex))
    run.resolvedSubroutineIndexes.push(subroutineIndex);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_corp_reorder_rd_top2",
    arrangedCount: selectedIds.length,
  };
}

function startV1917CorpRdArrangeChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  if (!V1917_HIDDEN_REORDER_ASSET_IDS.has(sourceDefinition.id))
    throw new Error(
      "Diese Karte darf keine V1.9.17-R&D-Reorder-Choice oeffnen.",
    );
  const topCards = state.corp.rd.slice(0, 2);
  if (topCards.length < 2)
    throw new Error("Nicht genug Karten fuer R&D-Reorder.");
  state.pendingChoice = {
    choiceId: `v1917_corp_rd_arrange_top2_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1917.corp_rd_arrange_top2:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "R&D-Spitze anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_corp_reorder_rd_top2",
    arrangedCount: topCards.length,
  };
}

function resolveV1917CorpRdArrangeChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1917.corp_rd_arrange_top2"))
    throw new Error("Es ist keine V1.9.17-R&D-Reorder-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (!sourceCardId || !rezzedCorpRootCardIds(state).includes(sourceCardId))
    throw new Error(
      "Die V1.9.17-R&D-Reorder-Quelle ist nicht mehr rezzed installiert.",
    );
  if (
    !V1917_HIDDEN_REORDER_ASSET_IDS.has(definitionFor(state, sourceCardId).id)
  )
    throw new Error(
      "Die V1.9.17-R&D-Reorder-Choice gehoert nicht zur passenden Karte.",
    );
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const topCards = state.corp.rd.slice(0, choice.options.length);
  if (selectedIds.length !== topCards.length)
    throw new Error("Die V1.9.17-R&D-Reorder-Auswahl ist unvollstaendig.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    topCards.some((cardId) => !selectedSet.has(cardId))
  )
    throw new Error(
      "Die V1.9.17-R&D-Reorder-Auswahl enthaelt ungueltige Karten.",
    );
  state.corp.rd = [...selectedIds, ...state.corp.rd.slice(topCards.length)];
  for (const cardId of selectedIds) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_corp_reorder_rd_top2",
    arrangedCount: selectedIds.length,
  };
}

function startV1922CorpRdTopReorderChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (definitionFor(state, sourceCardId).id !== V1922_PLANNING_CONSULTANTS_ID)
    throw new Error("Die R&D-Reorder-Quelle ist nicht Planning Consultants.");
  const topCards = state.corp.rd.slice(0, 5);
  if (topCards.length < 2)
    throw new Error("Nicht genug Karten fuer Planning Consultants.");
  state.pendingChoice = {
    choiceId: `v1922_corp_rd_arrange_top5_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.corp_rd_arrange_top5:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "R&D-Spitze anordnen",
    kind: "select_cards",
    options: topCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: topCards.length,
    maxSelections: topCards.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_rd_reorder_top5",
    arrangedCount: topCards.length,
  };
}

function resolveV1922CorpRdTopReorderChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.corp_rd_arrange_top5"))
    throw new Error("Es ist keine V1.9.22-R&D-Reorder-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (
    !sourceCardId ||
    definitionFor(state, sourceCardId).id !== V1922_PLANNING_CONSULTANTS_ID
  )
    throw new Error(
      "Die V1.9.22-R&D-Reorder-Choice gehoert nicht zu Planning Consultants.",
    );
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const topCards = state.corp.rd.slice(0, choice.options.length);
  if (selectedIds.length !== topCards.length)
    throw new Error("Die V1.9.22-R&D-Reorder-Auswahl ist unvollstaendig.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    topCards.some((cardId) => !selectedSet.has(cardId))
  )
    throw new Error(
      "Die V1.9.22-R&D-Reorder-Auswahl enthaelt ungueltige Karten.",
    );
  state.corp.rd = [...selectedIds, ...state.corp.rd.slice(topCards.length)];
  for (const cardId of selectedIds) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_rd_reorder_top5",
    arrangedCount: selectedIds.length,
  };
}

function startV1922CorpArchivesToHqChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (definitionFor(state, sourceCardId).id !== V1922_OFF_SITE_BACKUPS_ID)
    throw new Error("Die Archives-Quelle ist nicht Off-Site Backups.");
  const archiveCards = state.corp.archives.filter(
    (cardId) => cardId !== sourceCardId,
  );
  if (archiveCards.length === 0) throw new Error("Archives ist leer.");
  state.pendingChoice = {
    choiceId: `v1922_corp_archives_to_hq_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.corp_archives_to_hq:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Archives-Karte nach HQ nehmen",
    kind: "select_cards",
    options: archiveCards.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_archives_to_hq",
    eligibleCount: archiveCards.length,
  };
}

function resolveV1922CorpArchivesToHqChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.corp_archives_to_hq"))
    throw new Error("Es ist keine V1.9.22-Archives-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (
    !sourceCardId ||
    definitionFor(state, sourceCardId).id !== V1922_OFF_SITE_BACKUPS_ID
  )
    throw new Error(
      "Die V1.9.22-Archives-Choice gehoert nicht zu Off-Site Backups.",
    );
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!selectedId || !state.corp.archives.includes(selectedId))
    throw new Error("Die gewaehlte Archives-Karte ist ungueltig.");
  state.corp.archives = state.corp.archives.filter(
    (cardId) => cardId !== selectedId,
  );
  state.corp.hq.unshift(selectedId);
  state.cardInstances[selectedId] = {
    ...mustInstance(state.cardInstances, selectedId),
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_archives_to_hq",
    movedCount: 1,
  };
}

function startRunnerHostingChoice(
  state: GameState,
  hostId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const host = mustInstance(state.cardInstances, hostId);
  if (
    host.definitionId !== "v099_host_resource" ||
    !state.runner.rig.resources.includes(hostId)
  )
    throw new Error("Diese Karte kann in V0.99 nicht hosten.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.runner.grip
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        definition.type === "program" &&
        state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
          state.runner.memoryLimit
      );
    })
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) return;
  state.pendingChoice = {
    choiceId: `v099_host_program_${state.stateVersion + 1}`,
    side: "runner",
    source: `v099.host_program:${hostId}:${state.stateVersion + 1}`,
    prompt: "Programm hosten",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "host_program",
    hostId,
  };
}

function resolveRunnerHostingChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Hosting-Choice offen.");
  const sourceParts = choice.source.split(":");
  const hostId = sourceParts[1];
  if (!hostId || !state.runner.rig.resources.includes(hostId))
    throw new Error("Der Host ist nicht mehr installiert.");
  const hostDefinition = definitionFor(state, hostId);
  if (hostDefinition.id !== "v099_host_resource")
    throw new Error("Diese Karte kann in V0.99 nicht hosten.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId || !state.runner.grip.includes(cardId))
    throw new Error("Die gewählte Karte liegt nicht in der Grip.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program")
    throw new Error(
      "Nur Programme können in dieser Hosting-Harness gehostet werden.",
    );
  if (
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
    state.runner.memoryLimit
  )
    throw new Error("Nicht genug Memory für das gehostete Programm.");
  setHostedOn(state, cardId, hostId);
  removeFromAllZones(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
    hostedOn: hostId,
  };
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "host_program",
    hostedCount: 1,
    hostId,
  };
}

function resolveSmithsPawnshopChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v170.smiths_pawnshop"))
    throw new Error("Es ist keine Smith's-Pawnshop-Choice offen.");
  const sourceParts = choice.source.split(":");
  const pawnshopId = sourceParts[1];
  if (!pawnshopId || !state.runner.rig.resources.includes(pawnshopId))
    throw new Error("Smith's Pawnshop ist nicht mehr installiert.");
  const selectedId =
    selectedChoiceIds(playerAction.selectedChoices)[0] ?? "pass";
  if (selectedId !== "pass") {
    const option = choice.options.find(
      (candidate) => candidate.id === selectedId,
    );
    const cardId = typeof option?.value === "string" ? option.value : "";
    if (!cardId) throw new Error("Die gewaehlte Karte ist ungueltig.");
    if (cardId === pawnshopId)
      throw new Error("Smith's Pawnshop kann sich nicht selbst trashen.");
    if (!runnerInstalledCardIds(state).includes(cardId))
      throw new Error("Die gewaehlte Karte ist nicht mehr installiert.");
    trashRunnerInstalledCardToHeap(state, cardId);
    credits(state, "runner", 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      smithsPawnshopTriggered: true,
      smithsPawnshopCardId: pawnshopId,
      trashedCardId: cardId,
      creditsGained: 1,
    };
  } else {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      smithsPawnshopTriggered: false,
      smithsPawnshopCardId: pawnshopId,
    };
  }
  delete state.pendingChoice;
}

function resolveIncubatorTransformChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v191.incubator_transform"))
    throw new Error("Es ist keine Incubator-Choice offen.");
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const selectedOption = choice.options.find(
    (option) => option.id === selectedId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Die Incubator-Auswahl ist ungültig.");

  const value = selectedOption.value;
  if (value.startsWith("card:")) {
    const cardId = value.slice("card:".length);
    if (!cardId || !state.cardInstances[cardId])
      throw new Error("Der gewählte Karten-Counter ist ungültig.");
    const available = cardCounter(state, cardId, "virus");
    if (available <= 0)
      throw new Error("Der gewählte Karten-Counter ist nicht mehr verfügbar.");
    spendCardCounter(state, cardId, "virus", 1);
    addCardCounter(state, cardId, "virus", 2);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "incubator_transform",
      incubatorTargetKind: "card",
    };
  } else if (value.startsWith("pox:")) {
    const serverId = value.slice("pox:".length) as Exclude<
      ServerId,
      "new_remote"
    >;
    const available = poxCountersForServer(state, serverId);
    if (available <= 0)
      throw new Error("Der gewählte Pox-Counter ist nicht mehr verfügbar.");
    state.poxCountersByServer = {
      ...(state.poxCountersByServer ?? {}),
      [serverId]: available + 1,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "incubator_transform",
      incubatorTargetKind: "server",
    };
  } else {
    throw new Error("Die Incubator-Auswahl hat einen ungültigen Targettyp.");
  }

  const flags = ensureRunnerTurnFlags(state);
  const remaining = Math.max(
    0,
    Math.floor((flags.incubatorPendingTransforms ?? 0) - 1),
  );
  flags.incubatorPendingTransforms = remaining;
  delete state.pendingChoice;
  if (remaining > 0) {
    startIncubatorTransformChoice(state);
    return;
  }
  applyRunnerStartOfTurnEffects(state);
}

function resolveAardvarkInterceptionChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v199.aardvark"))
    throw new Error("Es ist keine Aardvark-Choice offen.");
  const [, aardvarkId, breakerId, iceId, actionType, subroutineIndexRaw] =
    choice.source.split(":");
  if (
    !aardvarkId ||
    !breakerId ||
    !iceId ||
    (actionType !== "pump_breaker" && actionType !== "break_subroutine")
  ) {
    throw new Error("Die Aardvark-Choice ist ungueltig.");
  }
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected !== "rez_trash_worm" && selected !== "decline")
    throw new Error("Die Aardvark-Auswahl ist ungueltig.");
  const run = mustRun(state);
  if (run.encounteredIceId !== iceId)
    throw new Error("Die Aardvark-Choice gehoert nicht mehr zu diesem ICE.");
  if (!isWormBreaker(state, breakerId))
    throw new Error("Aardvark kann nur einen Worm abfangen.");

  if (selected === "rez_trash_worm") {
    const aardvark = mustInstance(state.cardInstances, aardvarkId);
    if (aardvark.definitionId !== AARDVARK_ID)
      throw new Error("Aardvark-Ziel ist ungueltig.");
    if (aardvark.rezzed) throw new Error("Aardvark ist bereits gerezzt.");
    spendCredits(state, "corp", rezCostForCard(state, aardvarkId));
    state.cardInstances[aardvarkId] = {
      ...aardvark,
      rezzed: true,
      faceup: true,
    };
    trashRunnerInstalledProgram(state, breakerId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      publicRevealDefinitionId: AARDVARK_ID,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "aardvark_rez_trash_worm",
      aardvarkRezzed: true,
      aardvarkWormTrashed: true,
    };
  } else if (actionType === "pump_breaker") {
    executeEffectCommands(state, [
      { type: "change_breaker_strength", breakerId, amount: 1 },
    ]);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneAction: "aardvark_declined_worm_use",
      aardvarkRezzed: false,
    };
  } else {
    const subroutineIndex = Number(subroutineIndexRaw);
    if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
      throw new Error("Die Aardvark-Subroutine ist ungueltig.");
    executeEffectCommands(state, [
      { type: "break_subroutine", subroutineIndex },
    ]);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneAction: "aardvark_declined_worm_use",
      aardvarkRezzed: false,
    };
  }

  delete state.pendingChoice;
}

function resolveChimeraDaemonTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v199.chimera_daemon_trash"))
    throw new Error("Es ist keine Chimera-Choice offen.");
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find(
    (candidate) => candidate.id === selectedId,
  );
  const daemonId = typeof option?.value === "string" ? option.value : "";
  if (!daemonId || !state.runner.rig.programs.includes(daemonId))
    throw new Error("Der gewaehlte Daemon ist nicht installiert.");
  const definition = definitionFor(state, daemonId);
  if (definition.type !== "program" || !cardHasSubtype(definition, "daemon"))
    throw new Error("Chimera darf nur einen Daemon trashen.");
  trashRunnerInstalledProgram(state, daemonId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    chimeraDaemonTrashed: true,
    chimeraDaemonDefinitionId: definition.id,
  };
  delete state.pendingChoice;
}

function selectedChoiceCardIds(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value;
  });
}

function shuffleRunnerStack(state: GameState, purpose: string): void {
  const random = {
    counter: state.randomCounter,
    records: state.randomDrawRecords,
  };
  state.runner.stack = shuffleIds(
    state.runner.stack,
    state.seed,
    purpose,
    random,
  );
  state.randomCounter = random.counter;
}

function revealRunnerStackTop(
  state: GameState,
  legalAction: LegalAction,
): void {
  const cardId = state.runner.stack[0];
  if (!cardId) throw new Error("Der Stack ist leer.");
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    publicRevealKind: "reveal",
    publicRevealDefinitionId: definition.id,
  };
}

function revealCorpRdTop(state: GameState, legalAction: LegalAction): void {
  const cardId = state.corp.rd[0];
  if (!cardId) throw new Error("R&D ist leer.");
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_corp_reveal_rd_top",
    publicRevealKind: "reveal",
    publicRevealDefinitionId: definition.id,
  };
}

function resolveV1911RunnerHiddenZoneAbility(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf V1.9.11-Hidden-Zone-Helfer nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const installed = runnerInstalledCardIds(state);
  if (!installed.includes(sourceCardId))
    throw new Error("Der V1.9.11-Hidden-Zone-Helfer ist nicht installiert.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  const ability = String(legalAction.payload?.v1911HiddenZoneAbility ?? "");
  const allowedSearchIds = new Set([
    SELF_MODIFYING_CODE_ID,
    AUJOURD_OUI_ID,
    NETO_ID,
  ]);
  const allowedExposeIds = new Set([MOUSE_ID, SEEYA_ID]);
  const allowedRevealIds = new Set([THE_SHORT_CIRCUIT_ID, AUJOURD_OUI_ID]);
  if (ability === "search_stack_program_to_grip") {
    if (!allowedSearchIds.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Stack-Search-Ability nutzen.");
    startRunnerStackSearchChoice(
      state,
      "v1911.search_stack",
      "v1911_search_stack",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_search_stack",
    };
    return;
  }
  if (ability === "expose_server_card") {
    if (!allowedExposeIds.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Expose-Ability nutzen.");
    exposeCorpCardInServer(
      state,
      String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">,
      legalAction,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_expose_server_card",
    };
    return;
  }
  if (ability === "reveal_stack_top") {
    if (!allowedRevealIds.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Stack-Reveal-Ability nutzen.");
    revealRunnerStackTop(state, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_reveal_stack_top",
    };
    return;
  }
  if (ability === "arrange_stack_top2") {
    if (sourceDefinition.id !== RONIN_AROUND_ID)
      throw new Error("Diese Karte darf keine Stack-Reorder-Ability nutzen.");
    startRunnerStackArrangeChoice(
      state,
      "v1911.arrange_stack_top2",
      "v1911_arrange_stack_top2",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1911_arrange_stack",
    };
    return;
  }
  throw new Error("Unbekannte V1.9.11-Hidden-Zone-Ability.");
}

function resolveV1911CorporateDownsizing(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Corporate Downsizing nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.corp.scoreArea.includes(sourceCardId))
    throw new Error("Corporate Downsizing ist nicht gescort.");
  if (definitionFor(state, sourceCardId).id !== CORPORATE_DOWNSIZING_ID)
    throw new Error("Die Agenda-Aktion passt nicht zu Corporate Downsizing.");
  revealCorpRdTop(state, legalAction);
}

function exposedCorpCardInServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): CardInstanceId | undefined {
  const server = mustServer(state, serverId);
  return [...server.root, ...server.ice].find((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return !instance.rezzed;
  });
}

function exposeCorpCardInServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  legalAction: LegalAction,
): void {
  const cardId = exposedCorpCardInServer(state, serverId);
  if (!cardId)
    throw new Error(
      "In diesem Server liegt keine unrezzed installierte Korp-Karte.",
    );
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    publicRevealKind: "expose",
    publicRevealDefinitionId: definition.id,
  };
}

function swapCorpHqAndRdTop(state: GameState): void {
  const hqCardId = state.corp.hq[0];
  const rdCardId = state.corp.rd[0];
  if (!hqCardId || !rdCardId)
    throw new Error("HQ und R&D brauchen je eine Karte fuer Swap.");
  state.corp.hq[0] = rdCardId;
  state.corp.rd[0] = hqCardId;
  state.cardInstances[hqCardId] = {
    ...mustInstance(state.cardInstances, hqCardId),
    zone: { side: "corp", zone: "rd" },
  };
  state.cardInstances[rdCardId] = {
    ...mustInstance(state.cardInstances, rdCardId),
    zone: { side: "corp", zone: "hq" },
  };
}

function resolveTraceCorpBid(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = state.trace;
  if (!trace || trace.status !== "corp_bid")
    throw new Error("Es ist kein Korp-Trace-Bid offen.");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  spendCredits(state, "corp", bid);
  const traceStrength = trace.baseTraceStrength + bid;
  const runnerLink = calculateRunnerLink(state);
  state.trace = {
    ...trace,
    status: "runner_bid",
    corpBid: bid,
    traceStrength,
    runnerLink,
  };
  state.pendingChoice = traceBidChoice(
    state,
    "runner",
    trace.traceId,
    `Runner Link-Bid wählen (Trace ${traceStrength}, Link ${runnerLink})`,
    state.runner.credits,
  );
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "corp_bid",
    baseTraceStrength: trace.baseTraceStrength,
    corpBid: bid,
    traceStrength,
    runnerLink,
  };
}

function resolveTraceRunnerBid(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = state.trace;
  if (!trace || trace.status !== "runner_bid")
    throw new Error("Es ist kein Runner-Trace-Bid offen.");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  spendCredits(state, "runner", bid);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(state);
  const traceStrength =
    trace.traceStrength ?? trace.baseTraceStrength + (trace.corpBid ?? 0);
  const runnerStrength = runnerLink + bid;
  const successful = traceStrength > runnerStrength;
  const tagsAdded =
    successful && trace.successEffect.type === "add_tag"
      ? trace.successEffect.amount
      : 0;
  let dataRavenCounterAdded = 0;
  if (successful) state.runner.tags += tagsAdded;
  if (successful && trace.sourceDefinitionId === DATA_RAVEN_ID) {
    addCardCounter(state, trace.sourceCardInstanceId, "power", 1);
    dataRavenCounterAdded = 1;
  }
  delete state.pendingChoice;
  delete state.trace;
  if (state.run) {
    if (trace.subroutineIndex !== undefined) {
      state.run.traceSuccessBySubroutineIndex = {
        ...(state.run.traceSuccessBySubroutineIndex ?? {}),
        [trace.subroutineIndex]: successful,
      };
    }
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
  } else if (
    trace.returnTimingPoint &&
    trace.returnActiveSide &&
    trace.returnPhase
  ) {
    state.timingPoint = trace.returnTimingPoint;
    state.activeSide = trace.returnActiveSide;
    state.phase = trace.returnPhase;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "runner_bid",
    baseTraceStrength: trace.baseTraceStrength,
    corpBid: trace.corpBid ?? 0,
    traceStrength,
    runnerLink,
    runnerBid: bid,
    runnerStrength,
    traceSuccessful: successful,
    tagsAdded,
    ...(dataRavenCounterAdded > 0 ? { dataRavenCounterAdded } : {}),
  };
}

function isSupportedTraceSuccessEffect(effect: TraceSuccessEffect): boolean {
  if (effect.type === "none") return true;
  return (
    effect.type === "add_tag" &&
    Number.isInteger(effect.amount) &&
    effect.amount >= 0
  );
}

function selectedBidAmount(
  choice: ChoiceRequest | undefined,
  playerAction: PlayerAction,
): number {
  if (!choice) throw new Error("Es ist keine Bid-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selected = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  const amount =
    typeof selected?.value === "number" ? selected.value : Number.NaN;
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Der Trace-Bid ist ungueltig.");
  return amount;
}

function calculateRunnerLink(state: GameState): number {
  const identity = definitionFor(state, state.runner.identity);
  const baseLink = identity.baseLink ?? 0;
  if (!Number.isInteger(baseLink) || baseLink < 0)
    throw new Error("Runner-Link ist ungueltig.");
  const modifier = identityModifierAmount(
    state,
    "runner",
    "base_link",
    "static",
  );
  const installedLink = [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ].reduce((sum, cardId) => {
    const cardLink = definitionFor(state, cardId).baseLink ?? 0;
    if (!Number.isInteger(cardLink) || cardLink < 0)
      throw new Error("Runner-Link ist ungueltig.");
    return sum + cardLink;
  }, 0);
  const link = baseLink + modifier + installedLink;
  if (!Number.isInteger(link) || link < 0)
    throw new Error("Runner-Link ist ungueltig.");
  return link;
}

function applyIdentityStaticModifiers(state: GameState): void {
  const memoryModifier = identityModifierAmount(
    state,
    "runner",
    "memory_limit",
    "static",
  );
  state.runner.memoryLimit += memoryModifier;
  if (
    !Number.isInteger(state.runner.memoryLimit) ||
    state.runner.memoryLimit < 0
  ) {
    throw new Error("Runner-Memory-Limit ist ungueltig.");
  }
}

function applyIdentitySetupAbilities(state: GameState): void {
  for (const side of ["corp", "runner"] as const) {
    const identity = identityDefinition(state, side);
    for (const modifier of identity.modifiers ?? []) {
      if (
        modifier.duration !== "setup" ||
        modifier.kind !== "starting_credits" ||
        modifier.side !== side
      )
        continue;
      if (!Number.isInteger(modifier.amount) || modifier.amount < 0)
        throw new Error("Setup-Credit-Modifier ist ungueltig.");
      credits(state, side, modifier.amount);
      recordIdentitySetupAbility(state, side, modifier.modifierId);
    }
  }
}

function identityModifierAmount(
  state: GameState,
  side: Side,
  kind: ModifierKind,
  duration: "setup" | "static",
): number {
  const identity = identityDefinition(state, side);
  return (identity.modifiers ?? [])
    .filter(
      (modifier) =>
        modifier.side === side &&
        modifier.kind === kind &&
        modifier.duration === duration,
    )
    .reduce((sum, modifier) => {
      if (!Number.isInteger(modifier.amount))
        throw new Error("Identity-Modifier ist ungueltig.");
      return sum + modifier.amount;
    }, 0);
}

function identityDefinition(state: GameState, side: Side): CardDefinition {
  return definitionFor(
    state,
    side === "runner" ? state.runner.identity : state.corp.identity,
  );
}

function recordIdentitySetupAbility(
  state: GameState,
  side: Side,
  modifierId: string,
): void {
  const usage = (state.identityAbilityUsage ??= {});
  const sideUsage = (usage[side] ??= {
    setupAbilities: [],
    turn: 0,
    usedThisTurn: [],
  });
  if (!sideUsage.setupAbilities.includes(modifierId))
    sideUsage.setupAbilities.push(modifierId);
}

function executeEffectCommands(
  state: GameState,
  commands: EffectCommand[],
): void {
  for (const command of commands) {
    switch (command.type) {
      case "gain_credits":
        assertNonNegativeAmount(command.amount);
        credits(state, command.side, command.amount);
        break;
      case "spend_credits":
        assertNonNegativeAmount(command.amount);
        spendCredits(state, command.side, command.amount);
        break;
      case "draw_card":
        for (let count = 0; count < (command.amount ?? 1); count += 1) {
          command.side === "corp" ? drawCorpCard(state) : drawRunnerCard(state);
        }
        break;
      case "do_damage":
        doDamage(state, {
          damageId: `effect.${command.source ?? "unknown"}.${state.stateVersion}.${state.randomCounter}`,
          damageType: command.damageType,
          amount: command.amount,
          source: command.source ?? "effect_command",
        });
        break;
      case "add_tag":
        assertNonNegativeAmount(command.amount);
        state.runner.tags += command.amount;
        break;
      case "remove_tag":
        assertNonNegativeAmount(command.amount);
        state.runner.tags = Math.max(0, state.runner.tags - command.amount);
        break;
      case "change_breaker_strength":
        mustInstance(state.cardInstances, command.breakerId).strengthModifier +=
          command.amount;
        break;
      case "break_subroutine": {
        const run = mustRun(state);
        if (!run.brokenSubroutineIndexes.includes(command.subroutineIndex))
          run.brokenSubroutineIndexes.push(command.subroutineIndex);
        break;
      }
      case "set_pending_choice":
        if (state.pendingChoice)
          throw new Error("Es ist bereits eine Choice offen.");
        state.pendingChoice = cloneState(command.choice);
        break;
      case "complete_pending_choice":
        if (
          !state.pendingChoice ||
          state.pendingChoice.choiceId !== command.choiceId
        )
          throw new Error("Diese Choice ist nicht offen.");
        delete state.pendingChoice;
        break;
      case "emit_event":
        throw new Error(
          "Effect-Event-Emission wird in V0.93 nur spezifiziert, aber nicht vom State-Only-Executor geschrieben.",
        );
    }
  }
}

function assertNonNegativeAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("Effect amount ist ungueltig.");
}

function assertPositiveIntegerAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error("Damage amount ist ungueltig.");
}

function makeActionId(
  type: ActionType,
  side: Side,
  payload: LegalAction["payload"] | undefined,
  source: LegalAction["source"],
): string {
  const parts = [
    side,
    type,
    source === "basic_action" || source === "game_rule" ? "" : source,
  ];
  if (payload?.serverId) parts.push(String(payload.serverId));
  if (payload?.selectedServerId) parts.push(String(payload.selectedServerId));
  if (payload?.cardId) parts.push(String(payload.cardId));
  if (payload?.hostOnCardId) parts.push(String(payload.hostOnCardId));
  if (payload?.breakerId) parts.push(String(payload.breakerId));
  if (payload?.subroutineIndex !== undefined)
    parts.push(String(payload.subroutineIndex));
  if (payload?.removeTagAmount !== undefined)
    parts.push(String(payload.removeTagAmount));
  if (payload?.v1917AssetAbility) parts.push(String(payload.v1917AssetAbility));
  if (payload?.v1918UpgradeAbility)
    parts.push(String(payload.v1918UpgradeAbility));
  if (payload?.v1919AssetAbility) parts.push(String(payload.v1919AssetAbility));
  if (payload?.v1919OperationAbility)
    parts.push(String(payload.v1919OperationAbility));
  if (payload?.v1919UpgradeAbility)
    parts.push(String(payload.v1919UpgradeAbility));
  if (payload?.v1919RunnerProgramAbility)
    parts.push(String(payload.v1919RunnerProgramAbility));
  if (payload?.v1919RunnerEventAbility)
    parts.push(String(payload.v1919RunnerEventAbility));
  if (payload?.v1920AssetAbility) parts.push(String(payload.v1920AssetAbility));
  if (payload?.v1921AssetAbility) parts.push(String(payload.v1921AssetAbility));
  if (payload?.v1921UpgradeAbility)
    parts.push(String(payload.v1921UpgradeAbility));
  if (payload?.v1921RunnerProgramAbility)
    parts.push(String(payload.v1921RunnerProgramAbility));
  if (payload?.v1921RunnerResourceAbility)
    parts.push(String(payload.v1921RunnerResourceAbility));
  if (payload?.agendaAbility) parts.push(String(payload.agendaAbility));
  if (payload?.redHerringsCardId) parts.push(String(payload.redHerringsCardId));
  if (payload?.oliviaSalazarCardId)
    parts.push(String(payload.oliviaSalazarCardId));
  if (payload?.targetCardId) parts.push(String(payload.targetCardId));
  return parts.filter(Boolean).join(".");
}

function buildEvent(
  before: number,
  after: number,
  stateHashAfter: StateHash,
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): GameEvent {
  const actor = legalAction.side;
  const reveal = revealForPublicEvent(state, legalAction);
  const visibilityClass = eventVisibilityForAction(legalAction);
  const publicPayload: Record<string, unknown> = {
    actor,
    actionType: legalAction.type,
    label: publicLabel(legalAction),
    ...publicActionUseContext(previousState, legalAction),
    ...publicContextForAction(state, legalAction),
    ...reveal,
  };
  return {
    eventId: `evt_${after}`,
    type: legalAction.type,
    stateVersionBefore: before,
    stateVersionAfter: after,
    stateHashAfter,
    visibilityClass,
    publicPayload,
    privatePayload: {
      [actor]: {
        action: playerAction,
        legalAction,
      },
    },
  };
}

function publicActionUseContext(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  const actionCostClicks = clickCostForAction(legalAction);
  if (actionCostClicks <= 0) return {};
  const clicksBefore = clicksForSide(state, legalAction.side);
  const turnCapacity = Math.max(
    baseClicksForSide(legalAction.side),
    clicksBefore,
  );
  const usedBefore = Math.max(0, turnCapacity - clicksBefore);
  return {
    actionCostClicks,
    turnActionOrdinalStart: usedBefore + 1,
    turnActionOrdinalEnd: usedBefore + actionCostClicks,
  };
}

function clickCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.clicks) && cost.clicks ? cost.clicks : 0),
    0,
  );
}

function clicksForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.clicks : state.runner.clicks;
}

function baseClicksForSide(side: Side): number {
  return side === "corp" ? 3 : 4;
}

function publicLabel(legalAction: LegalAction): string {
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.setupStep === "mulligan"
  )
    return "Setup-Entscheidung wurde beantwortet.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.discardResolved === true
  )
    return "Discard wurde abgeschlossen.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.replacementDecision
  )
    return "Replacement-Entscheidung wurde beantwortet.";
  if (
    legalAction.type === "resolve_choice" &&
    legalAction.payload?.eventModificationDecision
  )
    return "Event-Modification-Entscheidung wurde beantwortet.";
  if (legalAction.type === "resolve_choice") return "Choice wurde beantwortet.";
  if (legalAction.type === "move_to_set_aside")
    return "Eine Karte wurde in Set Aside bewegt.";
  if (legalAction.type === "move_to_removed_from_game")
    return "Eine Karte wurde aus dem Spiel entfernt.";
  if (legalAction.type === "return_from_set_aside")
    return "Eine Karte ist aus Set Aside zurückgekehrt.";
  if (legalAction.type === "change_card_control")
    return "Die Kontrolle einer Karte wurde geändert.";
  if (legalAction.side === "corp" && legalAction.type === "install_card")
    return "Korp installiert eine Karte.";
  if (legalAction.side === "corp" && legalAction.type === "advance_card")
    return "Korp advanced eine Karte.";
  return legalAction.label;
}

function publicContextForAction(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const cardId =
    typeof legalAction.payload?.cardId === "string"
      ? legalAction.payload.cardId
      : typeof legalAction.payload?.accessedCardId === "string"
        ? legalAction.payload.accessedCardId
        : undefined;
  const sourceCardId =
    typeof legalAction.source === "string" &&
    state.cardInstances[legalAction.source]
      ? legalAction.source
      : undefined;
  const serverLabel =
    publicServerLabelForCard(state, cardId) ??
    publicServerLabel(state, legalAction.payload?.serverId);
  const agendaId = cardId ?? sourceCardId;

  if (serverLabel) context.serverLabel = serverLabel;
  if (legalAction.type === "install_card") {
    const definition = cardId ? definitionFor(state, cardId) : undefined;
    context.zoneLabel =
      legalAction.side === "runner"
        ? definition?.type === "resource"
          ? "Resource"
          : "Rig"
        : legalAction.payload?.placement === "ice"
          ? "ICE"
          : "Remote";
  }
  if (legalAction.type === "trash_resource") context.zoneLabel = "Resource";
  if (legalAction.type === "rez_ice")
    context.zoneLabel =
      legalAction.payload?.rootRez === true ||
      legalAction.payload?.assetRez === true
        ? "Remote"
        : "ICE";
  if (
    legalAction.type === "break_subroutine" &&
    typeof legalAction.payload?.postBreakStealthLoss === "number"
  ) {
    context.postBreakStealthLoss = legalAction.payload.postBreakStealthLoss;
  }
  if (
    legalAction.type === "gain_credit" ||
    legalAction.type === "draw_card" ||
    legalAction.type === "remove_tag"
  ) {
    context.amount =
      legalAction.type === "remove_tag"
        ? Number(legalAction.payload?.removeTagAmount ?? 1)
        : Number.isInteger(legalAction.payload?.gainCreditsAmount)
          ? Number(legalAction.payload?.gainCreditsAmount)
          : 1;
  }
  if (legalAction.type === "resolve_choice") {
    context.choiceKind = legalAction.payload?.choiceKind;
    if (legalAction.payload?.discardResolved === true) {
      context.discardResolved = true;
      context.discardSide = legalAction.payload.discardSide;
      context.discardCount = legalAction.payload.discardCount;
      context.discardZone = legalAction.payload.discardZone;
      context.redactedKind = "discard";
    }
    if (legalAction.payload?.setupStep === "mulligan") {
      context.setupStep = "mulligan";
      context.setupSide = legalAction.payload.setupSide;
      context.setupStatus = state.setup?.status ?? "complete";
    }
    if (legalAction.payload?.choiceVisibility === "public")
      context.choiceId = legalAction.payload?.choiceId;
    else context.redactedKind = "choice";
    for (const key of [
      "eventModificationWindowId",
      "eventModificationKind",
      "eventModificationDecision",
      "eventModificationOutcome",
      "imminentEventId",
      "imminentEventType",
      "affectedSide",
      "originalAmount",
      "preventedAmount",
      "finalAmount",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "replacementWindowId",
      "replacementDecision",
      "replacementOutcome",
      "originalEventId",
      "originalEventType",
      "replacementEventId",
      "replacementEventType",
      "tagsAdded",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "traceId",
      "traceStep",
      "baseTraceStrength",
      "corpBid",
      "traceStrength",
      "runnerLink",
      "runnerBid",
      "runnerStrength",
      "traceSuccessful",
      "tagsAdded",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.type === "continue_run") {
    context.result = state.run ? "continued" : "ended";
    if (legalAction.payload?.encounterContinue === true) {
      context.encounterContinue = true;
      context.unbrokenSubroutineCount =
        legalAction.payload.unbrokenSubroutineCount;
      context.encounterWillEndRun = legalAction.payload.encounterWillEndRun;
    }
  }
  if (legalAction.payload?.traceStarted === true) {
    context.traceStarted = true;
    context.traceId = legalAction.payload.traceId;
    context.sourceCardId = legalAction.payload.sourceCardId;
    context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    context.baseTraceStrength = legalAction.payload.baseTraceStrength;
  }
  if (legalAction.payload?.damageResolved === true) {
    context.damageResolved = true;
    context.damageType = legalAction.payload.damageType;
    context.damageAmount = legalAction.payload.damageAmount;
    context.cardsTrashed = legalAction.payload.cardsTrashed;
    context.flatline = legalAction.payload.flatline;
    if (typeof legalAction.payload.coreDamageAfter === "number")
      context.coreDamageAfter = legalAction.payload.coreDamageAfter;
    if (typeof legalAction.payload.runnerMaxHandSizeAfter === "number")
      context.runnerMaxHandSizeAfter =
        legalAction.payload.runnerMaxHandSizeAfter;
  }
  if (legalAction.payload?.eventModificationWindowOpened === true) {
    context.eventModificationWindowOpened = true;
    context.eventModificationKind = legalAction.payload.eventModificationKind;
    context.eventModificationWindowId =
      legalAction.payload.eventModificationWindowId;
    context.imminentEventId = legalAction.payload.imminentEventId;
    context.imminentEventType = legalAction.payload.imminentEventType;
    context.affectedSide = legalAction.payload.affectedSide;
    context.candidateCount = legalAction.payload.candidateCount;
    context.redactedKind = "event_modification";
  }
  if (legalAction.payload?.replacementWindowOpened === true) {
    context.replacementWindowOpened = true;
    context.replacementWindowId = legalAction.payload.replacementWindowId;
    context.originalEventId = legalAction.payload.originalEventId;
    context.originalEventType = legalAction.payload.originalEventType;
    context.replacementCandidateCount =
      legalAction.payload.replacementCandidateCount;
    context.affectedSide = legalAction.payload.affectedSide;
    context.redactedKind = "replacement";
  }
  if (legalAction.type === "purge_virus_counters") {
    context.purgedCounterType = "virus";
    context.purgedVirusCounters = legalAction.payload?.purgedVirusCounters ?? 0;
  }
  if (legalAction.payload?.hiddenZoneBarrier === true) {
    context.hiddenZoneBarrier = true;
    context.hiddenZoneAction = legalAction.payload.hiddenZoneAction;
    if (typeof legalAction.payload.selectedCount === "number")
      context.selectedCount = legalAction.payload.selectedCount;
    if (typeof legalAction.payload.arrangedCount === "number")
      context.arrangedCount = legalAction.payload.arrangedCount;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.ambushDefinitionId === "string")
      context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.trashedCardDefinitionId === "string")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.removedCounterAmount === "number")
      context.removedCounterAmount = legalAction.payload.removedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    context.redactedKind = "hidden_zone";
  }
  if (legalAction.payload?.publicRevealKind)
    context.revealKind = legalAction.payload.publicRevealKind;
  if (
    legalAction.type === "move_to_set_aside" ||
    legalAction.type === "move_to_removed_from_game" ||
    legalAction.type === "return_from_set_aside"
  ) {
    context.specialZone = legalAction.payload?.specialZone;
    context.specialZoneVisibility = legalAction.payload?.specialZoneVisibility;
    context.specialZoneReason = legalAction.payload?.specialZoneReason;
    context.redactedKind = "special_zone";
  }
  if (legalAction.type === "change_card_control") {
    context.oldController = legalAction.payload?.oldController;
    context.newController = legalAction.payload?.newController;
    context.ownershipChanged = false;
    context.controlChangeReason = legalAction.payload?.controlChangeReason;
    context.redactedKind = "control_change";
  }
  if (typeof legalAction.payload?.badPublicityAfter === "number")
    context.badPublicityAfter = legalAction.payload.badPublicityAfter;
  if (typeof legalAction.payload?.onScoreGainCredits === "number")
    context.onScoreGainCredits = legalAction.payload.onScoreGainCredits;
  if (typeof legalAction.payload?.corpCreditsBeforeCorporateWar === "number")
    context.corpCreditsBeforeCorporateWar =
      legalAction.payload.corpCreditsBeforeCorporateWar;
  if (typeof legalAction.payload?.v1922CorporateWarThreshold === "number")
    context.v1922CorporateWarThreshold =
      legalAction.payload.v1922CorporateWarThreshold;
  if (typeof legalAction.payload?.corporateWarThresholdMet === "boolean")
    context.corporateWarThresholdMet =
      legalAction.payload.corporateWarThresholdMet;
  if (legalAction.payload?.onScoreLostAllCredits === true)
    context.onScoreLostAllCredits = true;
  if (typeof legalAction.payload?.corpCreditsAfter === "number")
    context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
  if (
    legalAction.payload?.agendaAbility === "v1922_political_overthrow" ||
    legalAction.payload?.agendaAbility === "v1922_marine_arcology" ||
    legalAction.payload?.agendaAbility === "v1922_corporate_retreat"
  ) {
    context.agendaAbility = legalAction.payload.agendaAbility;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
  }
  if (typeof legalAction.payload?.gainedActions === "number")
    context.gainedActions = legalAction.payload.gainedActions;
  if (typeof legalAction.payload?.v1918UpgradeAbility === "string") {
    context.v1918UpgradeAbility = legalAction.payload.v1918UpgradeAbility;
    if (typeof legalAction.payload.runStartTaxPaid === "number")
      context.runStartTaxPaid = legalAction.payload.runStartTaxPaid;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.runStartTaxSourceDefinitionIds === "string")
      context.runStartTaxSourceDefinitionIds =
        legalAction.payload.runStartTaxSourceDefinitionIds;
  }
  if (legalAction.payload?.v1918UpgradeAbility === "red_herrings_steal_tax") {
    context.v1918UpgradeAbility = "red_herrings_steal_tax";
    context.stealAdditionalCost = legalAction.payload.stealAdditionalCost;
    if (legalAction.payload.stealBlockedByCost === true)
      context.stealBlockedByCost = true;
  }
  if (
    legalAction.payload?.agendaAbility === "v1919_scored_agenda_reveal_rd_top"
  ) {
    context.agendaAbility = "v1919_scored_agenda_reveal_rd_top";
  }
  if (typeof legalAction.payload?.v1919AssetAbility === "string") {
    context.v1919AssetAbility = legalAction.payload.v1919AssetAbility;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
  }
  if (typeof legalAction.payload?.v1919OperationAbility === "string") {
    context.v1919OperationAbility = legalAction.payload.v1919OperationAbility;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.addedAdvancementCounters === "number")
      context.addedAdvancementCounters =
        legalAction.payload.addedAdvancementCounters;
    if (typeof legalAction.payload.advancementCountersAfter === "number")
      context.advancementCountersAfter =
        legalAction.payload.advancementCountersAfter;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
  }
  if (typeof legalAction.payload?.v1922RunnerProgramAbility === "string") {
    context.v1922RunnerProgramAbility =
      legalAction.payload.v1922RunnerProgramAbility;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.futureActionDebtAdded === "number")
      context.futureActionDebtAdded = legalAction.payload.futureActionDebtAdded;
    if (typeof legalAction.payload.futureActionDebtPending === "number")
      context.futureActionDebtPending =
        legalAction.payload.futureActionDebtPending;
    if (typeof legalAction.payload.breakerStrengthAfter === "number")
      context.breakerStrengthAfter = legalAction.payload.breakerStrengthAfter;
  }
  if (typeof legalAction.payload?.v1919UpgradeAbility === "string") {
    context.v1919UpgradeAbility = legalAction.payload.v1919UpgradeAbility;
    if (typeof legalAction.payload.agendaPointCost === "number")
      context.agendaPointCost = legalAction.payload.agendaPointCost;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (legalAction.payload.stealBlockedByAgendaPointCost === true)
      context.stealBlockedByAgendaPointCost = true;
    if (legalAction.payload.specialZone)
      context.specialZone = legalAction.payload.specialZone;
    if (legalAction.payload.specialZoneVisibility)
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (legalAction.payload.specialZoneReason)
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.v1919RunnerProgramAbility === "string") {
    context.v1919RunnerProgramAbility =
      legalAction.payload.v1919RunnerProgramAbility;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
  }
  if (typeof legalAction.payload?.v1919RunnerEventAbility === "string") {
    context.v1919RunnerEventAbility =
      legalAction.payload.v1919RunnerEventAbility;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.removedTags === "number")
      context.removedTags = legalAction.payload.removedTags;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (legalAction.payload.specialZone)
      context.specialZone = legalAction.payload.specialZone;
    if (legalAction.payload.specialZoneVisibility)
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (legalAction.payload.specialZoneReason)
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.v1920AssetAbility === "string") {
    context.v1920AssetAbility = legalAction.payload.v1920AssetAbility;
    if (typeof legalAction.payload.gainedActions === "number")
      context.gainedActions = legalAction.payload.gainedActions;
    if (typeof legalAction.payload.corpClicksAfter === "number")
      context.corpClicksAfter = legalAction.payload.corpClicksAfter;
  }
  if (typeof legalAction.payload?.v1921AssetAbility === "string") {
    context.v1921AssetAbility = legalAction.payload.v1921AssetAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921UpgradeAbility === "string") {
    context.v1921UpgradeAbility = legalAction.payload.v1921UpgradeAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921RunnerProgramAbility === "string") {
    context.v1921RunnerProgramAbility =
      legalAction.payload.v1921RunnerProgramAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1922RunnerEventAbility === "string") {
    context.v1922RunnerEventAbility =
      legalAction.payload.v1922RunnerEventAbility;
    if (typeof legalAction.payload.removedTags === "number")
      context.removedTags = legalAction.payload.removedTags;
    if (typeof legalAction.payload.runnerTagsAfter === "number")
      context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
    if (typeof legalAction.payload.returnedToGrip === "boolean")
      context.returnedToGrip = legalAction.payload.returnedToGrip;
    if (typeof legalAction.payload.paidCredits === "number")
      context.paidCredits = legalAction.payload.paidCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.runnerClicksAfter === "number")
      context.runnerClicksAfter = legalAction.payload.runnerClicksAfter;
    if (typeof legalAction.payload.temporaryProgramInstallCredits === "number")
      context.temporaryProgramInstallCredits =
        legalAction.payload.temporaryProgramInstallCredits;
    if (
      typeof legalAction.payload.valuPakProgramInstallActionsRemaining ===
      "number"
    ) {
      context.valuPakProgramInstallActionsRemaining =
        legalAction.payload.valuPakProgramInstallActionsRemaining;
    }
    if (
      typeof legalAction.payload.valuPakTemporaryProgramInstallCreditsAfter ===
      "number"
    ) {
      context.valuPakTemporaryProgramInstallCreditsAfter =
        legalAction.payload.valuPakTemporaryProgramInstallCreditsAfter;
    }
    if (legalAction.payload.valuPakInstallActionSpent === true)
      context.valuPakInstallActionSpent = true;
    if (typeof legalAction.payload.derezzedCount === "number")
      context.derezzedCount = legalAction.payload.derezzedCount;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.targetServerLabel === "string")
      context.targetServerLabel = legalAction.payload.targetServerLabel;
    if (typeof legalAction.payload.targetVisibility === "string")
      context.targetVisibility = legalAction.payload.targetVisibility;
    if (typeof legalAction.payload.corpDecision === "string")
      context.corpDecision = legalAction.payload.corpDecision;
    if (typeof legalAction.payload.rezCostPaid === "number")
      context.rezCostPaid = legalAction.payload.rezCostPaid;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.retainedCount === "number")
      context.retainedCount = legalAction.payload.retainedCount;
    if (typeof legalAction.payload.discardedCount === "number")
      context.discardedCount = legalAction.payload.discardedCount;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
  }
  if (typeof legalAction.payload?.v1922CorpOperationAbility === "string") {
    context.v1922CorpOperationAbility =
      legalAction.payload.v1922CorpOperationAbility;
    if (typeof legalAction.payload.gainedActions === "number")
      context.gainedActions = legalAction.payload.gainedActions;
    if (
      typeof legalAction.payload.edgerunnerTempsInstallActionsRemaining ===
      "number"
    ) {
      context.edgerunnerTempsInstallActionsRemaining =
        legalAction.payload.edgerunnerTempsInstallActionsRemaining;
    }
    if (typeof legalAction.payload.corpClicksAfter === "number")
      context.corpClicksAfter = legalAction.payload.corpClicksAfter;
  }
  if (legalAction.payload?.v1922EdgerunnerTempsInstallAction === true) {
    context.v1922CorpOperationAbility = "install_action_bundle";
    if (legalAction.payload.edgerunnerTempsInstallActionSpent === true)
      context.edgerunnerTempsInstallActionSpent = true;
    if (
      typeof legalAction.payload.edgerunnerTempsInstallActionsRemaining ===
      "number"
    ) {
      context.edgerunnerTempsInstallActionsRemaining =
        legalAction.payload.edgerunnerTempsInstallActionsRemaining;
    }
  }
  if (typeof legalAction.payload?.v1921RunnerEventAbility === "string") {
    context.v1921RunnerEventAbility =
      legalAction.payload.v1921RunnerEventAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921RunnerResourceAbility === "string") {
    context.v1921RunnerResourceAbility =
      legalAction.payload.v1921RunnerResourceAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1919AgendaDifficulty === "number")
    context.v1919AgendaDifficulty = legalAction.payload.v1919AgendaDifficulty;
  if (typeof legalAction.payload?.v1919Overadvance === "number")
    context.v1919Overadvance = legalAction.payload.v1919Overadvance;
  if (typeof legalAction.payload?.v1919BonusAgendaPoints === "number")
    context.v1919BonusAgendaPoints = legalAction.payload.v1919BonusAgendaPoints;
  if (state.winner && state.gameEndReason)
    context.gameEndReason = state.gameEndReason;
  if (state.run?.phase) context.runPhase = state.run.phase;
  if (
    (legalAction.type === "score_agenda" ||
      legalAction.type === "steal_agenda") &&
    agendaId
  ) {
    const definition = definitionFor(state, agendaId);
    if (definition.type === "agenda") {
      context.agendaPoints = definition.agendaPoints ?? 0;
      const bonusAgendaPoints = cardCounter(state, agendaId, "agenda");
      if (bonusAgendaPoints > 0) context.agendaPointBonus = bonusAgendaPoints;
      context.totalAgendaPoints = agendaPointsForScoredCard(state, agendaId);
    }
  }
  if (
    legalAction.side === "corp" &&
    (legalAction.type === "install_card" || legalAction.type === "advance_card")
  )
    context.redactedKind = "installed_card";

  return context;
}

function publicServerLabel(
  state: GameState,
  serverId: unknown,
): string | undefined {
  if (typeof serverId !== "string") return undefined;
  if (serverId === "new_remote") return "neuem Remote";
  return state.corp.servers.find((server) => server.id === serverId)?.label;
}

function publicServerLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  const zone = state.cardInstances[cardId]?.zone;
  const serverId = zone && "serverId" in zone ? zone.serverId : undefined;
  return publicServerLabel(state, serverId);
}

function revealForPublicEvent(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  if (typeof legalAction.payload?.publicRevealDefinitionId === "string") {
    const definition =
      DEMO_CARDS_BY_ID[legalAction.payload.publicRevealDefinitionId];
    if (definition)
      return { cardDefinitionId: definition.id, title: definition.title };
  }
  if (
    (legalAction.type === "move_to_set_aside" ||
      legalAction.type === "move_to_removed_from_game" ||
      legalAction.type === "return_from_set_aside" ||
      legalAction.type === "change_card_control") &&
    (legalAction.payload?.specialZoneVisibility === "public" ||
      legalAction.payload?.controlChangeVisibility === "public")
  ) {
    const cardId =
      typeof legalAction.payload?.cardId === "string"
        ? legalAction.payload.cardId
        : undefined;
    if (cardId && state.cardInstances[cardId]) {
      const definition = definitionFor(state, cardId);
      return { cardDefinitionId: definition.id, title: definition.title };
    }
  }
  const revealsCard =
    [
      "access_card",
      "rez_ice",
      "score_agenda",
      "steal_agenda",
      "trash_accessed_card",
      "trash_resource",
      "play_event",
      "play_operation",
      "pump_breaker",
      "break_subroutine",
    ].includes(legalAction.type) ||
    (legalAction.type === "gain_credit" &&
      (legalAction.payload?.v1917AssetAbility === "gain_credits" ||
        legalAction.payload?.v1917AssetAbility === "trace_3_tag")) ||
    (legalAction.type === "gain_credit" &&
      (legalAction.payload?.agendaAbility === "v1922_political_overthrow" ||
        legalAction.payload?.agendaAbility === "v1922_marine_arcology" ||
        legalAction.payload?.agendaAbility === "v1922_corporate_retreat")) ||
    (legalAction.side === "runner" && legalAction.type === "install_card");
  if (revealsCard && typeof legalAction.source === "string") {
    const cardId =
      legalAction.type === "access_card"
        ? typeof legalAction.payload?.accessedCardId === "string"
          ? legalAction.payload.accessedCardId
          : state.run?.accessedCardId
        : (legalAction.payload?.cardId ?? legalAction.source);
    if (typeof cardId === "string" && state.cardInstances[cardId]) {
      const definition = definitionFor(state, cardId);
      return { cardDefinitionId: definition.id, title: definition.title };
    }
    if (typeof cardId === "string" && DEMO_CARDS_BY_ID[cardId])
      return {
        cardDefinitionId: cardId,
        title: DEMO_CARDS_BY_ID[cardId]?.title,
      };
  }
  return {};
}

function toPublicEvent(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass
      ? { visibilityClass: event.visibilityClass }
      : {}),
    publicPayload: event.publicPayload,
  };
}

export function redactPublicEventForSide(
  event: PublicGameEvent,
  viewerSide: Side,
): PublicGameEvent {
  const actor = event.publicPayload.actor;
  const actionType = event.publicPayload.actionType;
  if (
    actionType !== "access_card" ||
    actor !== "runner" ||
    viewerSide !== "corp"
  )
    return event;
  const serverLabel =
    typeof event.publicPayload.serverLabel === "string"
      ? event.publicPayload.serverLabel
      : "";
  const serverId =
    typeof event.publicPayload.serverId === "string"
      ? event.publicPayload.serverId
      : "";
  const rdHiddenAccess =
    serverId === "rd" ||
    serverLabel === "R&D" ||
    serverLabel === "F&E (R&D)" ||
    serverLabel === "F&E";
  if (!rdHiddenAccess) return event;
  const {
    cardDefinitionId: _cardDefinitionId,
    title: _title,
    ...publicPayload
  } = event.publicPayload;
  void _cardDefinitionId;
  void _title;
  return {
    ...event,
    publicPayload: {
      ...publicPayload,
      redactedKind: "accessed_card",
    },
  };
}

function visibleOwnCard(state: GameState, id: CardInstanceId): VisibleCard {
  const definition = definitionFor(state, id);
  const instance = mustInstance(state.cardInstances, id);
  const runRemainderStrengthBonus =
    definition.type === "program"
      ? runRemainderStrengthBonusForBreaker(state.run, id)
      : 0;
  return {
    instanceId: id,
    known: true,
    title: definition.title,
    definitionId: definition.id,
    type: definition.type,
    subtypes: definition.subtypes,
    rulesText: definition.rulesText,
    ...(definition.cost !== undefined ? { cost: definition.cost } : {}),
    ...(definition.installCost !== undefined
      ? { installCost: definition.installCost }
      : {}),
    ...(definition.memoryCost !== undefined
      ? { memoryCost: definition.memoryCost }
      : {}),
    ...(definition.memoryLimitBonus !== undefined
      ? { memoryLimitBonus: definition.memoryLimitBonus }
      : {}),
    ...(definition.rezCost !== undefined
      ? { rezCost: definition.rezCost }
      : {}),
    ...(definition.baseLink !== undefined
      ? { baseLink: definition.baseLink }
      : {}),
    rezzed: instance.rezzed,
    advancementCounters: instance.advancementCounters,
    ...(definition.advancementRequirement !== undefined
      ? { advancementRequirement: definition.advancementRequirement }
      : {}),
    ...(definition.strength !== undefined
      ? {
          strength:
            definition.type === "ice"
              ? iceStrengthFor(state, id)
              : definition.strength +
                instance.strengthModifier +
                runRemainderStrengthBonus,
        }
      : {}),
    ...(definition.agendaPoints !== undefined
      ? { agendaPoints: definition.agendaPoints }
      : {}),
    ...(definition.trashCost !== undefined
      ? { trashCost: definition.trashCost }
      : {}),
    ...(instance.counters
      ? { counters: cloneCounters(instance.counters) }
      : {}),
    ...(instance.hostedOn ? { hostedOn: instance.hostedOn } : {}),
    owner: instance.owner,
    controller: instance.controller,
  };
}

function visibleCorpCard(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
  area: "ice" | "root",
): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  const definition = definitionFor(state, id);
  const accessed = state.run?.accessedCardId === id;
  const visible =
    viewer === "corp" ||
    instance.rezzed ||
    accessed ||
    state.corp.scoreArea.includes(id) ||
    (state.corp.archives.includes(id) && instance.faceup);
  if (!visible) {
    return {
      instanceId: hiddenVisibleCardId(id),
      known: false,
      rezzed: false,
      advancementCounters: area === "root" ? instance.advancementCounters : 0,
    };
  }
  return visibleOwnCard(state, id);
}

function visibleCorpArchives(state: GameState, viewer: Side): VisibleCard[] {
  return state.corp.archives
    .filter(
      (id) => viewer === "corp" || mustInstance(state.cardInstances, id).faceup,
    )
    .map((id) => visibleCorpCard(state, id, viewer, "root"));
}

function visibleSpecialZones(
  state: GameState,
  viewer: Side,
): NonNullable<PlayerView["specialZones"]> {
  const zones = state.specialZones ?? { setAside: [], removedFromGame: [] };
  return {
    setAside: zones.setAside.map((id) =>
      visibleSpecialZoneCard(state, id, viewer),
    ),
    removedFromGame: zones.removedFromGame.map((id) =>
      visibleSpecialZoneCard(state, id, viewer),
    ),
    setAsideCount: zones.setAside.length,
    removedFromGameCount: zones.removedFromGame.length,
  };
}

function visibleSpecialZoneCard(
  state: GameState,
  id: CardInstanceId,
  viewer: Side,
): VisibleCard {
  const instance = mustInstance(state.cardInstances, id);
  if (instance.zone.side !== "special") return visibleOwnCard(state, id);
  if (canSeeSpecialZoneCard(instance, viewer)) return visibleOwnCard(state, id);
  return {
    instanceId: hiddenVisibleCardId(id),
    known: false,
  };
}

function canSeeSpecialZoneCard(instance: CardInstance, viewer: Side): boolean {
  if (instance.zone.side !== "special") return true;
  if (instance.zone.visibility === "public") return true;
  if (instance.zone.visibility === "side_private")
    return viewer === (instance.zone.visibilitySide ?? instance.owner);
  return false;
}

function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  return ids.reduce((sum, id) => sum + agendaPointsForScoredCard(state, id), 0);
}

function credits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
}

function cloneCounters(
  counters: Partial<Record<CounterType, number>>,
): Partial<Record<CounterType, number>> {
  return Object.fromEntries(
    Object.entries(counters).filter(
      ([, amount]) => typeof amount === "number" && amount > 0,
    ),
  ) as Partial<Record<CounterType, number>>;
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

function setCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const instance = mustInstance(state.cardInstances, cardId);
  const counters = { ...(instance.counters ?? {}) };
  if (amount === 0) delete counters[counterType];
  else counters[counterType] = amount;
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  state.cardInstances[cardId] =
    Object.keys(counters).length > 0
      ? { ...withoutCounters, counters }
      : withoutCounters;
}

function addCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  setCardCounter(
    state,
    cardId,
    counterType,
    cardCounter(state, cardId, counterType) + amount,
  );
}

function spendCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Counter amount ist ungueltig.");
  const current = cardCounter(state, cardId, counterType);
  if (current < amount) throw new Error("Nicht genug Counter vorhanden.");
  setCardCounter(state, cardId, counterType, current - amount);
}

function totalCounters(state: GameState, counterType: CounterType): number {
  const cardCounterTotal = Object.keys(state.cardInstances).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, counterType),
    0,
  );
  if (counterType !== "virus") return cardCounterTotal;
  let poxTotal = 0;
  for (const amount of Object.values(state.poxCountersByServer ?? {})) {
    poxTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
  }
  return cardCounterTotal + poxTotal;
}

function purgeVirusCounters(state: GameState): number {
  const total = totalCounters(state, "virus");
  if (total <= 0) throw new Error("Es gibt keine Virus-Counter zu purgen.");
  for (const cardId of Object.keys(state.cardInstances)) {
    setCardCounter(state, cardId, "virus", 0);
  }
  if (state.poxCountersByServer) state.poxCountersByServer = {};
  return total;
}

function hostedCardsOn(
  state: GameState,
  hostId: CardInstanceId,
): CardInstanceId[] {
  return Object.entries(state.cardInstances)
    .filter(([, instance]) => instance.hostedOn === hostId)
    .map(([cardId]) => cardId)
    .sort();
}

function setHostedOn(
  state: GameState,
  cardId: CardInstanceId,
  hostId: CardInstanceId,
): void {
  if (cardId === hostId)
    throw new Error("Eine Karte kann nicht auf sich selbst gehostet werden.");
  if (!state.cardInstances[hostId]) throw new Error("Host-Karte fehlt.");
  let current: CardInstanceId | undefined = hostId;
  while (current) {
    if (current === cardId)
      throw new Error("Hosting-Zyklus ist nicht erlaubt.");
    current = state.cardInstances[current]?.hostedOn;
  }
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    hostedOn: hostId,
  };
}

function hasHostingCycle(state: GameState, cardId: CardInstanceId): boolean {
  const seen = new Set<CardInstanceId>([cardId]);
  let current = state.cardInstances[cardId]?.hostedOn;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = state.cardInstances[current]?.hostedOn;
  }
  return false;
}

function spendCredits(state: GameState, side: Side, amount: number): void {
  if (amount <= 0) return;
  if (side === "corp") {
    if (state.corp.credits < amount)
      throw new Error("Die Korp kann die Kosten nicht bezahlen.");
    state.corp.credits -= amount;
    return;
  }
  if (state.runner.credits < amount)
    throw new Error("Der Runner kann die Kosten nicht bezahlen.");
  state.runner.credits -= amount;
}

function availableRunnerProgramInstallCredits(state: GameState): number {
  return (
    state.runner.credits +
    runnerRecurringCredits(state) +
    valuPakTemporaryProgramInstallCredits(state)
  );
}

function runnerRecurringCredits(state: GameState): number {
  return state.runner.rig.hardware.reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
    0,
  );
}

function spendRunnerInstallCredits(
  state: GameState,
  amount: number,
  cardType: CardDefinition["type"],
): void {
  if (amount <= 0) return;
  if (cardType !== "program") {
    spendCredits(state, "runner", amount);
    return;
  }
  if (availableRunnerProgramInstallCredits(state) < amount)
    throw new Error("Der Runner kann die Installationskosten nicht bezahlen.");
  let remaining = amount;
  const flags = ensureRunnerTurnFlags(state);
  const temporary = Math.min(
    valuPakTemporaryProgramInstallCredits(state),
    remaining,
  );
  if (temporary > 0) {
    flags.valuPakTemporaryProgramInstallCredits = Math.max(
      0,
      valuPakTemporaryProgramInstallCredits(state) - temporary,
    );
    remaining -= temporary;
  }
  for (const cardId of state.runner.rig.hardware) {
    if (remaining <= 0) break;
    const available = cardCounter(state, cardId, "recurring_credit");
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendCardCounter(state, cardId, "recurring_credit", spent);
      remaining -= spent;
    }
  }
  spendCredits(state, "runner", remaining);
}

function runnerRunRecurringCreditSourceIds(
  state: GameState,
  breakerId?: CardInstanceId,
): CardInstanceId[] {
  const noisyBreaker =
    breakerId &&
    state.cardInstances[breakerId] &&
    state.runner.rig.programs.includes(breakerId)
      ? cardHasSubtype(definitionFor(state, breakerId), "noisy")
      : false;
  const runnerRig = [
    ...state.runner.rig.hardware,
    ...state.runner.rig.programs,
    ...state.runner.rig.resources,
  ];
  return runnerRig.filter((cardId) => {
    if (cardCounter(state, cardId, "recurring_credit") <= 0) return false;
    if (!noisyBreaker) return true;
    return !cardHasSubtype(definitionFor(state, cardId), "stealth");
  });
}

function runnerRunRecurringCredits(
  state: GameState,
  breakerId?: CardInstanceId,
): number {
  return runnerRunRecurringCreditSourceIds(state, breakerId).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
    0,
  );
}

function availableRunnerRunCredits(
  state: GameState,
  breakerId?: CardInstanceId,
): number {
  return (
    state.runner.credits +
    (state.run?.badPublicityCredits ?? 0) +
    runnerRunRecurringCredits(state, breakerId)
  );
}

function spendRunnerRunCredits(
  state: GameState,
  amount: number,
  breakerId?: CardInstanceId,
): void {
  if (amount <= 0) return;
  if (availableRunnerRunCredits(state, breakerId) < amount)
    throw new Error("Der Runner kann die Run-Kosten nicht bezahlen.");
  const run = mustRun(state);
  let remaining = amount;
  const fromBadPublicity = Math.min(run.badPublicityCredits ?? 0, remaining);
  if (fromBadPublicity > 0) {
    run.badPublicityCredits = (run.badPublicityCredits ?? 0) - fromBadPublicity;
    remaining -= fromBadPublicity;
  }
  for (const cardId of runnerRunRecurringCreditSourceIds(state, breakerId)) {
    if (remaining <= 0) break;
    const available = cardCounter(state, cardId, "recurring_credit");
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendCardCounter(state, cardId, "recurring_credit", spent);
      remaining -= spent;
    }
  }
  spendCredits(state, "runner", remaining);
}

function applyPostBreakStealthLoss(
  state: GameState,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const breakerDefinition = definitionFor(state, breakerId);
  const ability = breakerDefinition.abilities?.find(
    (candidate) =>
      candidate.id === legalAction.abilityRef?.abilityId &&
      candidate.type === "break_subroutine",
  );
  const lossAmount = ability?.postBreakStealthLoss ?? 0;
  if (lossAmount <= 0) return;
  let remaining = lossAmount;
  let spent = 0;
  for (const cardId of [
    ...state.runner.rig.hardware,
    ...state.runner.rig.programs,
    ...state.runner.rig.resources,
  ]) {
    if (remaining <= 0) break;
    if (!cardHasSubtype(definitionFor(state, cardId), "stealth")) continue;
    const available = cardCounter(state, cardId, "recurring_credit");
    const cardSpent = Math.min(available, remaining);
    if (cardSpent > 0) {
      spendCardCounter(state, cardId, "recurring_credit", cardSpent);
      remaining -= cardSpent;
      spent += cardSpent;
    }
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    postBreakStealthLoss: spent,
  };
}

function refreshRecurringCredits(state: GameState, side: Side): void {
  if (side !== "runner" || !isV099OrLater(state)) return;
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    if ((definition.recurringCredits ?? 0) > 0)
      setCardCounter(
        state,
        cardId,
        "recurring_credit",
        definition.recurringCredits ?? 0,
      );
  }
}

function spendClick(state: GameState, side: Side): void {
  if (side === "corp") {
    if (state.corp.clicks <= 0)
      throw new Error("Die Korp hat keine Clicks mehr.");
    state.corp.clicks -= 1;
    return;
  }
  if (state.runner.clicks <= 0)
    throw new Error("Der Runner hat keine Clicks mehr.");
  state.runner.clicks -= 1;
}

function spendClicks(state: GameState, side: Side, amount: number): void {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Click amount ist ungueltig.");
  if (side === "corp") {
    if (state.corp.clicks < amount)
      throw new Error("Die Korp hat nicht genug Clicks.");
    state.corp.clicks -= amount;
    return;
  }
  if (state.runner.clicks < amount)
    throw new Error("Der Runner hat nicht genug Clicks.");
  state.runner.clicks -= amount;
}

function randomHqAccess(state: GameState): CardInstanceId | undefined {
  if (state.corp.hq.length === 0) return undefined;
  const value = nextRandom(state, "hq_random_access");
  const index = Math.floor(value * state.corp.hq.length);
  return state.corp.hq[index];
}

function nextRandom(state: GameState, purpose: string): number {
  const value = deterministicNumber(
    `${state.seed}:${purpose}:${state.randomCounter}`,
  );
  state.randomDrawRecords.push({
    counter: state.randomCounter,
    purpose,
    value,
  });
  state.randomCounter += 1;
  return value;
}

function rollDeterministicDie(state: GameState, purpose: string): number {
  const scopedPurpose = /^v\d+\.die\./.test(purpose)
    ? purpose
    : `v190.die.${purpose}`;
  const value = nextRandom(state, scopedPurpose);
  return Math.floor(value * 6) + 1;
}

function deterministicNumber(input: string): number {
  let hashA = 0xdeadbeef ^ input.length;
  let hashB = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    hashA = Math.imul(hashA ^ code, 0x9e3779b1);
    hashB = Math.imul(hashB ^ code, 0x5f356495);
  }
  hashA =
    Math.imul(hashA ^ (hashA >>> 16), 0x85ebca6b) ^
    Math.imul(hashB ^ (hashB >>> 13), 0xc2b2ae35);
  hashB =
    Math.imul(hashB ^ (hashB >>> 16), 0x85ebca6b) ^
    Math.imul(hashA ^ (hashA >>> 13), 0xc2b2ae35);
  return (0x100000000 * (hashB & 0x1fffff) + (hashA >>> 0)) / 0x20000000000000;
}

function hiddenVisibleCardId(id: CardInstanceId): CardInstanceId {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `hidden_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function shuffleIds(
  ids: CardInstanceId[],
  seed: string,
  purpose: string,
  random: { counter: number; records: GameState["randomDrawRecords"] },
): CardInstanceId[] {
  const shuffled = ids.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const value = deterministicNumber(`${seed}:${purpose}:${random.counter}`);
    random.records.push({ counter: random.counter, purpose, value });
    random.counter += 1;
    const swapIndex = Math.floor(value * (index + 1));
    const current = mustArrayValue(shuffled, index, "Shuffle index missing.");
    shuffled[index] = mustArrayValue(
      shuffled,
      swapIndex,
      "Shuffle swap missing.",
    );
    shuffled[swapIndex] = current;
  }
  return shuffled;
}

function shuffleStateIds(
  state: GameState,
  ids: CardInstanceId[],
  purpose: string,
): CardInstanceId[] {
  const random = {
    counter: state.randomCounter,
    records: state.randomDrawRecords,
  };
  const shuffled = shuffleIds(ids, state.seed, purpose, random);
  state.randomCounter = random.counter;
  return shuffled;
}

function recordRandomMarkers(
  seed: string,
  purpose: string,
  amount: number,
  random: { counter: number; records: GameState["randomDrawRecords"] },
): void {
  for (let index = 0; index < amount; index += 1) {
    const value = deterministicNumber(`${seed}:${purpose}:${random.counter}`);
    random.records.push({ counter: random.counter, purpose, value });
    random.counter += 1;
  }
}

function recordStateRandomMarkers(
  state: GameState,
  purpose: string,
  amount: number,
): void {
  const random = {
    counter: state.randomCounter,
    records: state.randomDrawRecords,
  };
  recordRandomMarkers(state.seed, purpose, amount, random);
  state.randomCounter = random.counter;
}

function expandDeck(
  side: Side,
  cards: Array<{ id: string; quantity: number }>,
  instances: Record<CardInstanceId, CardInstance>,
): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const card of cards) {
    for (let copy = 1; copy <= card.quantity; copy += 1) {
      const instance = createInstance(
        side,
        card.id,
        copy,
        side === "corp"
          ? { side: "corp", zone: "rd" }
          : { side: "runner", zone: "stack" },
      );
      instances[instance.instanceId] = instance;
      ids.push(instance.instanceId);
    }
  }
  return ids;
}

function cardPoolVersionForDecks(
  runnerDeck: DeckDefinition,
  corpDeck: DeckDefinition,
): CardPoolVersion {
  if (usesMvp099CardPool(runnerDeck) || usesMvp099CardPool(corpDeck))
    return "0.99.0";
  if (usesMvp098CardPool(runnerDeck) || usesMvp098CardPool(corpDeck))
    return "0.98.0";
  if (usesMvp097CardPool(runnerDeck) || usesMvp097CardPool(corpDeck))
    return "0.97.0";
  if (usesMvp096CardPool(runnerDeck) || usesMvp096CardPool(corpDeck))
    return "0.96.0";
  if (usesMvp095CardPool(runnerDeck) || usesMvp095CardPool(corpDeck))
    return "0.95.0";
  if (usesMvp094CardPool(runnerDeck) || usesMvp094CardPool(corpDeck))
    return "0.94.0";
  if (usesMvp08CardPool(runnerDeck) || usesMvp08CardPool(corpDeck))
    return "0.8.0";
  if (usesExpandedCardPool(runnerDeck) || usesExpandedCardPool(corpDeck))
    return "0.4.0";
  return "0.1.0";
}

function baselineForCardPoolVersion(version: CardPoolVersion): RulesBaseline {
  if (version === "0.99.0") return MVP_0_99_BASELINE;
  if (version === "0.98.0") return MVP_0_98_BASELINE;
  if (version === "0.97.0") return MVP_0_97_BASELINE;
  if (version === "0.96.0") return MVP_0_96_BASELINE;
  if (version === "0.95.0") return MVP_0_95_BASELINE;
  if (version === "0.94.0") return MVP_0_94_BASELINE;
  if (version === "0.8.0") return MVP_0_8_BASELINE;
  if (version === "0.4.0") return MVP_0_4_BASELINE;
  return MVP_0_1_BASELINE;
}

function usesMvp099CardPool(deck: DeckDefinition): boolean {
  if (
    deck.id.endsWith("_099") ||
    deck.id.includes("_0_99") ||
    deck.id.includes("_v0_99")
  )
    return true;
  if (deck.identity.startsWith("v099_")) return true;
  return deck.cards.some((card) => card.id.startsWith("v099_"));
}

function usesMvp098CardPool(deck: DeckDefinition): boolean {
  if (usesMvp099CardPool(deck)) return true;
  if (
    deck.id.endsWith("_098") ||
    deck.id.includes("_0_98") ||
    deck.id.includes("_v0_98")
  )
    return true;
  if (deck.identity.startsWith("v098_")) return true;
  return deck.cards.some((card) => card.id.startsWith("v098_"));
}

function usesMvp097CardPool(deck: DeckDefinition): boolean {
  if (usesMvp098CardPool(deck)) return true;
  if (
    deck.id.endsWith("_097") ||
    deck.id.includes("_0_97") ||
    deck.id.includes("_v0_97")
  )
    return true;
  return deck.cards.some((card) => card.id.startsWith("v097_"));
}

function usesMvp096CardPool(deck: DeckDefinition): boolean {
  if (
    deck.id.endsWith("_096") ||
    deck.id.includes("_0_96") ||
    deck.id.includes("_v0_96")
  )
    return true;
  return deck.cards.some((card) => card.id.startsWith("v096_"));
}

function usesMvp095CardPool(deck: DeckDefinition): boolean {
  if (usesMvp096CardPool(deck)) return true;
  if (
    deck.id.endsWith("_095") ||
    deck.id.includes("_0_95") ||
    deck.id.includes("_v0_95")
  )
    return true;
  return deck.cards.some((card) => card.id.startsWith("v095_"));
}

function usesMvp094CardPool(deck: DeckDefinition): boolean {
  if (
    deck.id.endsWith("_094") ||
    deck.id.includes("_0_94") ||
    deck.id.includes("_v0_94")
  )
    return true;
  return deck.cards.some(
    (card) => card.id.startsWith("v094_") || card.id.startsWith("onr_v1_"),
  );
}

function usesMvp08CardPool(deck: DeckDefinition): boolean {
  if (usesMvp094CardPool(deck)) return true;
  if (
    deck.id.endsWith("_008") ||
    deck.id.includes("_0_8") ||
    deck.id.includes("_v0_8")
  )
    return true;
  return deck.cards.some((card) => card.id.startsWith("v08_"));
}

function usesExpandedCardPool(deck: DeckDefinition): boolean {
  if (usesMvp08CardPool(deck)) return true;
  if (deck.id.endsWith("_004") || deck.id.includes("_0_6")) return true;
  return deck.cards.some((card) =>
    [
      "simple_draw_event",
      "simple_setup_hardware",
      "efficient_fracter",
      "simple_priority_agenda",
      "simple_draw_operation",
      "simple_taxing_barrier_ice",
      "simple_upgrade",
      "simple_tag_ice",
      "simple_tag_punishment_operation",
    ].includes(card.id),
  );
}

function metadataForDeck(
  deck: DeckDefinition,
  cardPoolVersion: CardPoolVersion,
): DeckPublicMetadata {
  const expandedCardPool = cardPoolVersion !== "0.1.0";
  return {
    side: deck.side,
    identityCardId: deck.identity,
    deckName: deck.name,
    cardPoolSnapshotId:
      cardPoolVersion === "0.99.0"
        ? "card-snapshot-0.99"
        : cardPoolVersion === "0.98.0"
          ? "card-snapshot-0.98"
          : cardPoolVersion === "0.97.0"
            ? "card-snapshot-0.97"
            : cardPoolVersion === "0.96.0"
              ? "card-snapshot-0.96"
              : cardPoolVersion === "0.95.0"
                ? "card-snapshot-0.95"
                : cardPoolVersion === "0.94.0"
                  ? "card-snapshot-0.94"
                  : cardPoolVersion === "0.8.0"
                    ? "card-snapshot-0.8"
                    : expandedCardPool
                      ? "card-snapshot-0.5"
                      : "mvp-0.1-demo",
    formatProfileId:
      cardPoolVersion === "0.99.0"
        ? "local-demo-v0.99"
        : cardPoolVersion === "0.98.0"
          ? "local-demo-v0.98"
          : cardPoolVersion === "0.97.0"
            ? "local-demo-v0.97"
            : cardPoolVersion === "0.96.0"
              ? "local-demo-v0.96"
              : cardPoolVersion === "0.95.0"
                ? "local-demo-v0.95"
                : cardPoolVersion === "0.94.0"
                  ? "local-demo-v0.94"
                  : cardPoolVersion === "0.8.0"
                    ? "local-demo-v0.8"
                    : expandedCardPool
                      ? "local-demo-v0.6"
                      : "legacy-demo",
    deckHash: `legacy:${deck.id}`,
  };
}

function isV097OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 97);
}

function isV099OrLater(state: GameState): boolean {
  return isVersionAtLeast(state, 99);
}

function isVersionAtLeast(state: GameState, minorGate: number): boolean {
  const version = state.baseline.engineSchemaVersion
    .split(".")
    .map((part) => Number(part));
  const [major = 0, minor = 0, patch = 0] = version;
  if (major !== 0) return major > 0;
  if (minor !== minorGate) return minor > minorGate;
  return patch >= 0;
}

function canPlayCorpOperation(
  state: GameState,
  definition: CardDefinition,
): boolean {
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  return Boolean(resolver && (resolver.canPlay?.(state) ?? true));
}

function resolveCorpOperation(
  state: GameState,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  if (!resolver)
    throw new Error(`Kein Operation-Resolver fuer ${definition.id}.`);
  resolver.resolve(state, legalAction);
}

function createInstance(
  side: Side,
  definitionId: string,
  copy: number,
  zone: CardInstance["zone"],
): CardInstance {
  return {
    instanceId: `${side}_${definitionId}_${copy}`,
    definitionId,
    owner: side,
    controller: side,
    zone,
    faceup:
      side === "runner" || DEMO_CARDS_BY_ID[definitionId]?.type === "identity",
    rezzed:
      side === "runner" || DEMO_CARDS_BY_ID[definitionId]?.type === "identity",
    advancementCounters: 0,
    strengthModifier: 0,
  };
}

function removeFromAllZones(state: GameState, cardId: string): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
  const specialZones = ensureSpecialZones(state);
  specialZones.setAside = specialZones.setAside.filter((id) => id !== cardId);
  specialZones.removedFromGame = specialZones.removedFromGame.filter(
    (id) => id !== cardId,
  );
}

function ensureSpecialZones(state: GameState): SpecialZoneState {
  state.specialZones ??= { setAside: [], removedFromGame: [] };
  state.specialZones.setAside ??= [];
  state.specialZones.removedFromGame ??= [];
  return state.specialZones;
}

function ensureRunnerTurnFlags(
  state: GameState,
): NonNullable<GameState["runnerTurnFlags"]> {
  const flags = (state.runnerTurnFlags ??= {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
    stoleGrayOpsAgendaThisTurn: false,
    stoleBlackOpsAgendaThisTurn: false,
    runAttemptsThisTurn: 0,
    runAttemptsLastTurn: 0,
    damagePreventionUsage: {},
    startOfTurnFloatingCreditsApplied: false,
    allNighterBonusRunPending: false,
    forgoNextActionPending: false,
    forgoNextActionsPending: 0,
    valuPakProgramInstallActionsRemaining: 0,
    valuPakTemporaryProgramInstallCredits: 0,
  });
  flags.stoleGrayOpsAgendaThisTurn ??= false;
  flags.stoleBlackOpsAgendaThisTurn ??= false;
  flags.runAttemptsThisTurn ??= 0;
  flags.runAttemptsLastTurn ??= 0;
  flags.successfulHqRunThisTurn ??= false;
  flags.damagePreventionUsage ??= {};
  flags.startOfTurnFloatingCreditsApplied ??= false;
  flags.allNighterBonusRunPending ??= false;
  flags.forgoNextActionPending ??= false;
  flags.forgoNextActionsPending ??= 0;
  flags.valuPakProgramInstallActionsRemaining ??= 0;
  flags.valuPakTemporaryProgramInstallCredits ??= 0;
  return flags;
}

function ensureCorpTurnFlags(
  state: GameState,
): NonNullable<GameState["corpTurnFlags"]> {
  const flags = (state.corpTurnFlags ??= {
    scoredBlackOpsAgendaThisTurn: false,
    scoredBlackOpsAgendaLastTurn: false,
  });
  flags.scoredBlackOpsAgendaThisTurn ??= false;
  flags.scoredBlackOpsAgendaLastTurn ??= false;
  flags.edgerunnerTempsInstallActionsRemaining ??= 0;
  return flags;
}

function moveToSpecialZone(
  state: GameState,
  legalAction: LegalAction,
  zone: SpecialZoneKind,
): void {
  const cardId = stringLegalPayload(legalAction, "cardId");
  const instance = mustInstance(state.cardInstances, cardId);
  const harness = state.specialZoneHarness;
  const harnessConfig =
    zone === "set_aside" ? harness?.setAside : harness?.removedFromGame;
  if (
    !harness ||
    harness.actor !== legalAction.side ||
    harness.cardInstanceId !== cardId ||
    !harnessConfig
  ) {
    throw new Error(
      "Special-Zone-Harness ist fuer diese Aktion nicht freigegeben.",
    );
  }
  if (instance.zone.side === "special")
    throw new Error("Karte liegt bereits in einer Spezialzone.");
  const previousZone = instance.zone as Exclude<
    CardInstance["zone"],
    { side: "special" }
  >;
  const visibility = specialZoneVisibilityPayload(
    legalAction,
    harnessConfig.visibility,
  );
  const visibilitySide = specialZoneVisibilitySidePayload(
    legalAction,
    harnessConfig.visibilitySide,
  );
  removeFromAllZones(state, cardId);
  const specialZones = ensureSpecialZones(state);
  const target =
    zone === "set_aside" ? specialZones.setAside : specialZones.removedFromGame;
  target.push(cardId);
  target.sort();
  state.cardInstances[cardId] = {
    ...instance,
    zone: {
      side: "special",
      zone,
      visibility,
      ...(visibilitySide ? { visibilitySide } : {}),
      ...(zone === "set_aside"
        ? { returnZone: harness.setAside?.returnZone ?? previousZone }
        : {}),
    },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    specialZone: zone,
    specialZoneVisibility: visibility,
    ...(visibilitySide ? { specialZoneVisibilitySide: visibilitySide } : {}),
    specialZoneReason: String(
      legalAction.payload?.specialZoneReason ??
        harnessConfig.reason ??
        "v1.2.2_test_harness",
    ),
    redactedKind: "special_zone",
  };
}

function returnFromSetAside(state: GameState, legalAction: LegalAction): void {
  const cardId = stringLegalPayload(legalAction, "cardId");
  const instance = mustInstance(state.cardInstances, cardId);
  const harness = state.specialZoneHarness;
  if (
    !harness?.setAside?.allowReturn ||
    harness.actor !== legalAction.side ||
    harness.cardInstanceId !== cardId
  ) {
    throw new Error("Rueckkehr aus Set Aside ist nur test-only freigegeben.");
  }
  if (instance.zone.side !== "special" || instance.zone.zone !== "set_aside")
    throw new Error("Karte liegt nicht in Set Aside.");
  const returnZone = harness.setAside.returnZone ?? instance.zone.returnZone;
  if (!returnZone)
    throw new Error("Keine Rueckkehrzone fuer Set Aside definiert.");
  removeFromAllZones(state, cardId);
  placeCardInZone(state, cardId, returnZone);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: returnZone,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    specialZone: "set_aside",
    specialZoneReason: String(
      legalAction.payload?.specialZoneReason ??
        harness.setAside.reason ??
        "v1.2.2_test_harness_return",
    ),
    redactedKind: "special_zone",
  };
}

function changeCardControl(state: GameState, legalAction: LegalAction): void {
  const cardId = stringLegalPayload(legalAction, "cardId");
  const instance = mustInstance(state.cardInstances, cardId);
  const newController = sideLegalPayload(legalAction, "newController");
  const harness = state.specialZoneHarness;
  if (
    !harness?.controlChange ||
    harness.actor !== legalAction.side ||
    harness.cardInstanceId !== cardId ||
    harness.controlChange.newController !== newController
  ) {
    throw new Error("Control-Wechsel ist fuer diese Aktion nicht freigegeben.");
  }
  if (instance.controller === newController)
    throw new Error("Die Karte hat diesen Controller bereits.");
  state.cardInstances[cardId] = { ...instance, controller: newController };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    oldController: instance.controller,
    newController,
    controlChangeVisibility: harness.controlChange.visibility ?? "public",
    controlChangeReason: harness.controlChange.reason ?? "v1.2.2_test_harness",
    ownershipChanged: false,
    redactedKind: "control_change",
  };
}

function placeCardInZone(
  state: GameState,
  cardId: CardInstanceId,
  zone: Exclude<CardInstance["zone"], { side: "special" }>,
): void {
  if (zone.side === "corp" && zone.zone === "hq") state.corp.hq.push(cardId);
  else if (zone.side === "corp" && zone.zone === "rd")
    state.corp.rd.push(cardId);
  else if (zone.side === "corp" && zone.zone === "archives")
    state.corp.archives.push(cardId);
  else if (zone.side === "corp" && zone.zone === "scoreArea")
    state.corp.scoreArea.push(cardId);
  else if (zone.side === "corp" && zone.zone === "serverIce")
    mustServer(state, zone.serverId).ice.push(cardId);
  else if (zone.side === "corp" && zone.zone === "serverRoot")
    mustServer(state, zone.serverId).root.push(cardId);
  else if (zone.side === "runner" && zone.zone === "grip")
    state.runner.grip.push(cardId);
  else if (zone.side === "runner" && zone.zone === "stack")
    state.runner.stack.push(cardId);
  else if (zone.side === "runner" && zone.zone === "heap")
    state.runner.heap.push(cardId);
  else if (zone.side === "runner" && zone.zone === "scoreArea")
    state.runner.scoreArea.push(cardId);
  else if (zone.side === "runner" && zone.zone === "rig") {
    const definition = definitionFor(state, cardId);
    if (definition.type === "program") state.runner.rig.programs.push(cardId);
    else if (definition.type === "hardware")
      state.runner.rig.hardware.push(cardId);
    else if (definition.type === "resource")
      state.runner.rig.resources.push(cardId);
    else
      throw new Error(
        "Nur Runner-Programme, Hardware und Resources koennen in die Rig zurueckkehren.",
      );
  }
}

function specialZoneVisibilityPayload(
  legalAction: LegalAction,
  fallback: SpecialZoneVisibility,
): SpecialZoneVisibility {
  const value = legalAction.payload?.specialZoneVisibility;
  return value === "public" ||
    value === "side_private" ||
    value === "hidden" ||
    value === "replay_only"
    ? value
    : fallback;
}

function specialZoneVisibilitySidePayload(
  legalAction: LegalAction,
  fallback: Side | undefined,
): Side | undefined {
  const value = legalAction.payload?.specialZoneVisibilitySide;
  return value === "corp" || value === "runner" ? value : fallback;
}

function stringLegalPayload(legalAction: LegalAction, key: string): string {
  const value = legalAction.payload?.[key];
  if (typeof value !== "string" || value.length === 0)
    throw new Error(`Payload ${key} fehlt.`);
  return value;
}

function sideLegalPayload(legalAction: LegalAction, key: string): Side {
  const value = legalAction.payload?.[key];
  if (value !== "corp" && value !== "runner")
    throw new Error(`Payload ${key} ist keine Seite.`);
  return value;
}

function createRemote(state: GameState): CorpServer {
  const remoteIds = state.corp.servers
    .filter((server) => server.kind === "remote")
    .map((server) => Number(server.id.replace("remote_", "")));
  const nextId = Math.max(0, ...remoteIds) + 1;
  const server: CorpServer = {
    id: `remote_${nextId}`,
    kind: "remote",
    label: `Remote ${nextId}`,
    ice: [],
    root: [],
  };
  state.corp.servers.push(server);
  return server;
}

function cleanupEmptyRemotes(state: GameState): void {
  state.corp.servers = state.corp.servers.filter(
    (server) =>
      server.kind !== "remote" ||
      server.ice.length > 0 ||
      server.root.length > 0 ||
      state.run?.attackedServerId === server.id,
  );
}

function resetBreakerStrength(state: GameState): void {
  for (const id of state.runner.rig.programs) {
    const instance = mustInstance(state.cardInstances, id);
    state.cardInstances[id] = { ...instance, strengthModifier: 0 };
  }
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function mustRun(state: GameState): NonNullable<GameState["run"]> {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}

function mustServer(state: GameState, id: string): CorpServer {
  const server = state.corp.servers.find((candidate) => candidate.id === id);
  if (!server) throw new Error(`Server fehlt: ${id}`);
  return server;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function fail(
  state: GameState,
  code: EngineError["code"],
  message: string,
): EngineResult {
  return { ok: false, error: { code, message }, state };
}

function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}

function stripForHash(state: GameState): unknown {
  const copy = cloneState(state);
  copy.eventLog = [];
  return copy;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function isReplayAction(value: unknown): value is PlayerAction {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PlayerAction>;
  return (
    typeof record.matchId === "string" &&
    typeof record.side === "string" &&
    typeof record.actionId === "string" &&
    typeof record.clientKnownStateVersion === "number"
  );
}
