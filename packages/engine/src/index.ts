import {
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
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
  type ResolvedGameEffect,
  type ReplayResult,
  type RunState,
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
import {
  baselineForCardPoolVersion,
  cardPoolVersionForDecks,
  metadataForDeck,
} from "./card-pool";
import {
  ACTION_ASSET_CARD_IDS,
  COUNTER_ASSET_CARD_IDS,
  COUNTER_OPERATION_CARD_IDS,
  OVERADVANCE_AGENDA_CARD_IDS,
  SCORED_REVEAL_AGENDA_CARD_IDS,
  SERVER_DIFFICULTY_UPGRADE_CARD_IDS,
} from "./mechanics/agenda-scoring";
import {
  ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
  ARTIFICIAL_SECURITY_DIRECTORS_OVERADVANCE_AGENDA_ID,
  CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID,
  EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID,
  FAIT_ACCOMPLI_COUNTER_PROGRAM_ID,
  FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
  GENETICS_VISIONARY_ACQUISITION_OVERADVANCE_AGENDA_ID,
  INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID,
  MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID,
  OLIVIA_SALAZAR_STEAL_COST_UPGRADE_ID,
  PROJECT_CONSULTANTS_ADVANCE_AGENDA_OPERATION_ID,
  ROVING_SUBMARINE_AGENDA_DIFFICULTY_UPGRADE_ID,
  SILVER_LINING_RECOVERY_PROTOCOL_ECONOMY_OPERATION_ID,
  SYSTEMATIC_LAYOFFS_FORFEIT_AGENDA_OPERATION_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
  VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID,
  VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID,
  WASHINGTON_DC_AGENDA_DIFFICULTY_UPGRADE_ID,
} from "./mechanics/agenda-operation-effects";
import {
  COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID,
  DATA_MASONS_HOSTING_ASSET_CARD_ID,
  DISINFECTANT_VIRUS_COUNTER_ASSET_ID,
  KRUMZ_TRACE_ASSET_CARD_ID,
  SETUP_ACCESS_AMBUSH_ASSET_CARD_ID,
  SOLO_SQUAD_DAMAGE_ASSET_CARD_ID,
  SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID,
  TRAP_ACCESS_AMBUSH_ASSET_CARD_ID,
} from "./mechanics/asset-node-effects";
import {
  ABLATIVE_COUNTER_HARDWARE_CARD_ID,
  ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
  DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID,
  EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
  FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID,
  RUNTIME_DAMAGE_PREVENTION_PROFILES,
} from "./mechanics/damage-prevention";
import {
  CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
  CORP_HQ_AGENDA_REVEAL_CARD_ID,
  CORP_HQ_SHUFFLE_DRAW_CARD_ID,
  CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
  COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID,
  HIDDEN_ZONE_REORDER_ASSET_CARD_IDS,
  HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS,
  RUNNER_GRIP_TRASH_EVENT_CARD_ID,
  RUNNER_STACK_TOP5_EVENT_CARD_ID,
  SERVER_EXPOSE_PROGRAM_CARD_IDS,
  SERVER_ICE_SWAP_UPGRADE_CARD_ID,
  STACK_SEARCH_PROGRAM_CARD_IDS,
  STACK_SEARCH_TRASH_ON_USE_RESOURCE_CARD_ID,
  STACK_TOP_REORDER_RESOURCE_CARD_ID,
  STACK_TOP_REVEAL_PROGRAM_CARD_IDS,
} from "./mechanics/hidden-zone";
import {
  BIOWEAPONS_ENGINEERING_CORE_DAMAGE_AGENDA_ID,
  CITY_SURVEILLANCE_TAG_DAMAGE_ASSET_ID,
  FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID,
  HACKER_TRACKER_CENTRAL_RUN_LOCK_ASSET_ID,
  ICE_TRANSMUTATION_AGENDA_ID,
  I_GOT_A_ROCK_BAD_PUBLICITY_ASSET_ID,
  JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID,
  MAIN_OFFICE_RELOCATION_HANDSIZE_AGENDA_ID,
  NEWSGROUP_TAUNTING_TAG_HANDSIZE_ASSET_ID,
  SOUTH_AFRICAN_MINING_CORP_ACTION_ASSET_ID,
} from "./mechanics/global-modifiers";
import { COUNTER_UPGRADE_CARD_IDS } from "./mechanics/hosting-counters";
import {
  ANONYMOUS_TIP_DEREZ_BLACK_ICE_EVENT_ID,
  ARASAKA_PORTABLE_PROTOTYPE_LINK_HARDWARE_ID,
  ARTEMIS_2020_STRENGTH_HARDWARE_ID,
  CORE_COMMAND_JETTISON_ICE_HQ_TRASH_EVENT_ID,
  CORPORATE_RETREAT_INSTALL_CREDIT_AGENDA_ID,
  CORPORATE_WAR_SCORE_CREDIT_AGENDA_ID,
  COROLLA_SPEED_CHIP_STRENGTH_HARDWARE_ID,
  DATA_FORT_RECLAMATION_REINSTALL_AGENDA_ID,
  EDGERUNNER_TEMPS_INSTALL_OPERATION_ID,
  FALSE_ECHO_FORCE_REZ_PROGRAM_ID,
  FORGED_ACTIVATION_ORDERS_FORCE_REZ_EVENT_ID,
  JAPANESE_WATER_TORTURE_BREAKER_ID,
  MARINE_ARCOLOGY_REPLACE_COUNTERS_AGENDA_ID,
  MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
  MISC_FOR_SALE_TRASH_INSTALLED_EVENT_ID,
  NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID,
  NEWSGROUP_FILTER_CREDIT_PROGRAM_ID,
  OPEN_ENDED_MILEAGE_PROGRAM_TAG_RETURN_EVENT_ID,
  PANDORAS_DECK_LINK_HARDWARE_ID,
  POLITICAL_OVERTHROW_AP_COUNTER_AGENDA_ID,
  RABBIT_HQ_INTERFACE_PROGRAM_ID,
  SCATTER_SHOT_UPGRADE_TRASH_PROGRAM_ID,
  SECURITY_CODE_WORM_CHIP_HQ_TRASH_EVENT_ID,
  SECURITY_PURGE_PURGE_AGENDA_ID,
  SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID,
  STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID,
  SYNCHRONIZED_ATTACK_ON_HQ_RETAIN_EVENT_ID,
  VALU_PAK_SOFTWARE_BUNDLE_INSTALL_EVENT_ID,
  VIRAL_15_PROGRAM_TRASH_ICE_ID,
  ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID,
} from "./mechanics/longtail-card-effects";
import {
  CORP_ECONOMY_ASSET_CARD_IDS,
  CORP_RECURRING_ASSET_CARD_IDS,
} from "./mechanics/payment-costs";
import { buildPublicAbilitySchemaContext } from "./mechanics/public-payload-schema";
import {
  AI_BOON_RANDOM_BREAKER_CARD_ID,
  BOARDWALK_RANDOM_PROGRAM_CARD_ID,
  PLAYFUL_AI_DICE_LOOP_EVENT_CARD_ID,
  QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID,
  RIO_DE_JANEIRO_RANDOM_UPGRADE_CARD_ID,
  RUNNER_RANDOM_PROGRAM_CARD_IDS,
  SCHLAGHUND_RANDOM_ASSET_CARD_ID,
} from "./mechanics/random-effects";
import {
  HQ_ACCESS_REPLACEMENT_CREDIT_LOSS_EVENT_CARD_ID,
  HQ_ACCESS_REPLACEMENT_DRAW_EVENT_CARD_ID,
  HQ_MULTIACCESS_EVENT_CARD_ID,
  HQ_RUN_ACCESS_RD_EVENT_CARD_ID,
  RD_MULTIACCESS_EVENT_CARD_ID,
  RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
  RUN_MULTIACCESS_EVENT_CARD_ID,
  RUN_REPLACEMENT_OVERLAP_EVENT_CARD_ID,
  TRACE_AWARE_RUN_EVENT_CARD_ID,
} from "./mechanics/run-access";
import {
  CRYSTAL_PALACE_COUNTER_UPGRADE_ID,
  CRYBABY_ACCESS_COST_UPGRADE_ID,
  DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID,
  DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID,
  NEW_GALVESTON_TRASH_COST_UPGRADE_ID,
  PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
  RED_HERRINGS_STEAL_TAX_UPGRADE_ID,
  TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID,
} from "./mechanics/server-upgrades";
import {
  RUN_TAX_UPGRADE_CARD_IDS,
  TAG_CONDITION_UPGRADE_CARD_IDS,
  TRACE_ASSET_CARD_IDS,
} from "./mechanics/trace-tags";
import { hashStateSnapshot } from "./state-hash";

type AutomaticEffectCollector = ResolvedGameEffect[];

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

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
type BreachEntryStatus = ActiveBreach["queue"][number]["status"];

const STANDARD_AGENDA_POINTS_TO_WIN = 7;
const INITIAL_HAND_SIZE = 5;
const BASE_MAX_HAND_SIZE = 5;
const BARTMOSS_ID = "onr_v1_005_bartmoss-memorial-icebreaker";
const BLINK_ID = "onr_v1_007_blink";
const BUTCHER_BOY_ID = "onr_v1_009_butcher-boy";
const COCKROACH_ID = "onr_v1_013_cockroach";
const GRUBB_ID = "onr_v1_030_grubb";
const INCUBATOR_ID = "onr_v1_034_incubator";
const ALL_NIGHTER_ID = "onr_v1_076_all-nighter";
const DEAL_WITH_MILITECH_ID = "onr_v1_082_deal-with-militech";
const HUNT_CLUB_BBS_ID = "onr_v1_091_hunt-club-bbs";
const KILROY_WAS_HERE_ID = "onr_v1_096_kilroy-was-here";
const SNEAK_PREVIEW_ID = "onr_v1_110_sneak-preview";
const ROMP_THROUGH_HQ_ID = "onr_v1_107_romp-through-hq";
const TOP_RUNNERS_CONFERENCE_ID = "onr_v1_184_top-runners-conference";
const AI_CHIEF_FINANCIAL_OFFICER_ID = "onr_v1_188_ai-chief-financial-officer";
const BLACK_ICE_QUALITY_ASSURANCE_ID =
  "onr_v1_191_black-ice-quality-assurance";
const ARMADILLO_ARMORED_ROAD_HOME_ID =
  "onr_v1_120_armadillo-armored-road-home";
const DRIFTER_MOBILE_ENVIRONMENT_ID =
  "onr_v1_126_drifter-mobile-environment";
const SELF_MODIFYING_CODE_ID = "onr_v1_059_self-modifying-code";
const BROKER_ID = "onr_v1_154_broker";
const CODE_VIRAL_CACHE_ID = "onr_v1_155_code-viral-cache";
const SHORT_TERM_CONTRACT_ID = "onr_v1_178_short-term-contract";
const THE_SPRINGBOARD_ID = "onr_v1_181_the-springboard";
const ENCRYPTION_BREAKTHROUGH_ID = "onr_v1_200_encryption-breakthrough";
const NETWATCH_OPERATIONS_OFFICE_ID = "onr_v1_207_netwatch-operations-office";
const ON_CALL_SOLO_TEAM_ID = "onr_v1_208_on-call-solo-team";
const PRIVATE_CYBERNET_POLICE_ID = "onr_v1_213_private-cybernet-police";
const STRIKE_FORCE_KALI_ID = "onr_v1_217_strike-force-kali";
const SUPERIOR_NET_BARRIERS_ID = "onr_v1_219_superior-net-barriers";
const TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS = new Set([
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
]);
const SECURITY_NET_OPTIMIZATION_ID = "onr_v1_215_security-net-optimization";
const CERBERUS_ID = "onr_v1_227_cerberus";
const DATA_RAVEN_ID = "onr_v1_236_data-raven";
const FANG_ID = "onr_v1_240_fang";
const FANG_2_0_ID = "onr_v1_241_fang-2-0";
const MICROTECH_TRODE_SET_ID = "onr_v1_132_microtech-trode-set";
const CINDERELLA_ID = "onr_v1_228_cinderella";
const HOMEWRECKER_ID = "onr_v1_248_homewrecker";
const ACME_SAVINGS_AND_LOAN_ID = "onr_v1_308_acme-savings-and-loan";
const PILE_DRIVER_ID = "onr_v1_047_pile-driver";
const RAMMING_PISTON_ID = "onr_v1_053_ramming-piston";
const SKIVVISS_ID = "onr_v1_064_skivviss";
const BODYWEIGHT_DATA_CRECHE_ID = "onr_v1_123_bodyweight-data-creche";
const RIGGED_INVESTMENTS_ID = "onr_v1_174_rigged-investments";
const AARDVARK_ID = "onr_v1_349_aardvark";
const BIZARRE_ENCRYPTION_SCHEME_ID = "onr_v1_351_bizarre-encryption-scheme";
const CHESTER_MIX_ID = "onr_v1_352_chester-mix";
const CHIMERA_ID = "onr_v1_353_chimera";
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
const PATTELS_VIRUS_ID = "onr_v1_046_pattels-virus";
const POX_ID = "onr_v1_049_pox";
const EXPERT_SCHEDULE_ANALYZER_ID = "onr_v1_024_expert-schedule-analyzer";
const MICROTECH_AI_INTERFACE_ID = "onr_v1_041_microtech-ai-interface";
const MYSTERY_BOX_ID = "onr_v1_043_mystery-box";
const POLTERGEIST_ID = "onr_v1_048_poltergeist";
const SHREDDER_UPLINK_PROTOCOL_ID = "onr_v1_062_shredder-uplink-protocol";
const SIGNPOST_ID = "onr_v1_063_signpost";
const SMARTEYE_ID = "onr_v1_065_smarteye";
const RECORD_RECONSTRUCTOR_ID = "onr_v1_142_record-reconstructor";
const R_AND_D_INTERFACE_ID = "onr_v1_139_r-and-d-interface";
const PK_6089A_ID = "onr_v1_138_pk-6089a";
const HELLS_RUN_ID = "onr_v1_164_hells-run";
const HOLOVID_CAMPAIGN_ID = "onr_v1_326_holovid-campaign";
const HOLOVID_CAMPAIGN_STARTING_BITS = 12;
const RONIN_AROUND_ID = "onr_v1_175_ronin-around";
const NEVINYRRAL_ID = "onr_v1_331_nevinyrral";
const RUSTBELT_HQ_BRANCH_ID = "onr_v1_338_rustbelt-hq-branch";
const PARIS_CITY_GRID_TRACE_POOL_BITS = 6;

const RUNNER_EVENT_RESOLVERS: Record<string, RunnerEventResolver> = {
  simple_economy_event: {
    name: "runner_event_gain_credits_4",
    resolve: (state) => {
      state.runner.credits += 4;
    },
  },
  simple_draw_event: {
    name: "runner_event_draw_2",
    resolve: (state, legalAction) => {
      let summary = drawRunnerCard(state);
      summary = mergeRunnerDrawSummary(summary, drawRunnerCard(state));
      applyRunnerDrawSummaryPayload(state, legalAction, summary);
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
    resolve: (state, legalAction) => {
      let summary = drawRunnerCard(state);
      summary = mergeRunnerDrawSummary(summary, drawRunnerCard(state));
      summary = mergeRunnerDrawSummary(summary, drawRunnerCard(state));
      applyRunnerDrawSummaryPayload(state, legalAction, summary);
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
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        removedTags,
        runnerTagsAfter: state.runner.tags,
      };
    },
  },
  [PLAYFUL_AI_DICE_LOOP_EVENT_CARD_ID]: {
    name: "onr_v1921_runner_event_playful_ai_dice_loop",
    resolve: (state, legalAction) => {
      const dieRoll = rollDeterministicDie(
        state,
        `v1921.die.${PLAYFUL_AI_DICE_LOOP_EVENT_CARD_ID}.dice_loop.initial`,
      );
      const choiceOpened = dieRoll <= 3;
      if (choiceOpened) {
        startV1921PlayfulAiChoice(
          state,
          String(legalAction.payload?.cardId ?? ""),
          dieRoll,
          0,
          1,
        );
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1921RunnerEventAbility: "playful_ai_dice_loop",
        v1921DieRoll: dieRoll,
        playfulAiDieRolls: String(dieRoll),
        playfulAiRolledDice: 1,
        playfulAiDiceQueuedAfterRolls: 0,
        playfulAiRemainingDice: 0,
        playfulAiChoiceOpened: choiceOpened,
        playfulAiComplete: !choiceOpened,
        randomCounterAfter: state.randomCounter,
      };
    },
  },
  [ANONYMOUS_TIP_DEREZ_BLACK_ICE_EVENT_ID]: {
    name: "onr_v1922_runner_event_derez_black_ice",
    canPlay: (state) => rezzedBlackIceIds(state).length > 0,
    resolve: (state, legalAction) => {
      startAnonymousTipDerezBlackIceChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "derez_black_ice",
      };
    },
  },
  [CORE_COMMAND_JETTISON_ICE_HQ_TRASH_EVENT_ID]: {
    name: "onr_v1922_runner_event_successful_hq_run_pay_rez_cost_trash_rezzed_ice",
    canPlay: (state) =>
      hasSuccessfulHqRunThisTurn(state) &&
      affordableRezzedInstalledIceIdsForRunner(state).length > 0,
    resolve: (state, legalAction) => {
      if (!hasSuccessfulHqRunThisTurn(state))
        throw new Error(
          "Core Command: Jettison Ice benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
        );
      startCoreCommandJettisonIceChoice(
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
  [FORGED_ACTIVATION_ORDERS_FORCE_REZ_EVENT_ID]: {
    name: "onr_v1922_runner_event_force_rez_or_trash_ice",
    canPlay: (state) => unrezzedInstalledIceIds(state).length > 0,
    resolve: (state, legalAction) => {
      startForgedActivationOrdersTargetChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "force_rez_or_trash_ice",
      };
    },
  },
  [RUNNER_STACK_TOP5_EVENT_CARD_ID]: {
    name: "onr_v1922_runner_event_stack_top5_choose_one_arrange_rest",
    canPlay: (state) => state.runner.stack.length > 0,
    resolve: (state, legalAction) => {
      startRunnerStackTop5Choice(
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
  [RUNNER_GRIP_TRASH_EVENT_CARD_ID]: {
    name: "onr_v1922_runner_event_trash_grip_gain_credits",
    canPlay: (state) => state.runner.grip.length > 1,
    resolve: (state, legalAction) => {
      startRunnerGripTrashForCreditsChoice(
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
  [MISC_FOR_SALE_TRASH_INSTALLED_EVENT_ID]: {
    name: "onr_v1922_runner_event_trash_installed_gain_credits",
    canPlay: (state) => runnerInstalledCardIds(state).length > 0,
    resolve: (state, legalAction) => {
      startRunnerInstalledTrashForCreditsChoice(
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
  [OPEN_ENDED_MILEAGE_PROGRAM_TAG_RETURN_EVENT_ID]: {
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
        startOpenEndedMileageProgramReturnChoice(
          state,
          String(legalAction.payload?.cardId ?? ""),
        );
    },
  },
  [SECURITY_CODE_WORM_CHIP_HQ_TRASH_EVENT_ID]: {
    name: "onr_v1922_runner_event_successful_hq_run_trash_unrezzed_ice",
    canPlay: (state) =>
      hasSuccessfulHqRunThisTurn(state) &&
      unrezzedInstalledIceIds(state).length > 0,
    resolve: (state, legalAction) => {
      if (!hasSuccessfulHqRunThisTurn(state))
        throw new Error(
          "Security Code WORM Chip benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
        );
      startSecurityCodeWormChipTrashIceChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
      };
    },
  },
  [SYNCHRONIZED_ATTACK_ON_HQ_RETAIN_EVENT_ID]: {
    name: "onr_v1922_runner_event_successful_hq_run_corp_pay_to_retain_hq",
    canPlay: (state) =>
      hasSuccessfulHqRunThisTurn(state) &&
      state.corp.hq.length > 0,
    resolve: (state, legalAction) => {
      if (!hasSuccessfulHqRunThisTurn(state))
        throw new Error(
          "Synchronized Attack on HQ benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
        );
      startSynchronizedAttackOnHqRetainChoice(
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
  [VALU_PAK_SOFTWARE_BUNDLE_INSTALL_EVENT_ID]: {
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
        hiddenZoneBarrier: true,
        exposedServerId: String(legalAction.payload?.serverId ?? ""),
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
    name: "onr_v1911_runner_event_expose_outermost_ice_each_data_fort",
    canPlay: (state) => outermostIceExposures(state).length > 0,
    resolve: (state, legalAction) => {
      exposeOutermostIceOfEachDataFort(state, legalAction);
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
  [SNEAK_PREVIEW_ID]: {
    name: "onr_v1911_runner_event_sneak_preview_temporary_program_install",
    canPlay: (state) => sneakPreviewSourceOptions(state).length > 0,
    resolve: (state, legalAction) => {
      startSneakPreviewSourceChoice(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "sneak_preview_source_choice",
      };
    },
  },
  [DEAL_WITH_MILITECH_ID]: {
    name: "onr_v1912_runner_event_deal_with_militech_counters",
    canPlay: (state) => runnerStoleAgendaSubtypeThisTurn(state, "research"),
    resolve: (state, legalAction) => {
      resolveDealWithMilitech(state, legalAction);
    },
  },
  [HUNT_CLUB_BBS_ID]: {
    name: "onr_v1912_runner_event_hunt_club_bbs_multi_expose",
    canPlay: (state) => huntClubBbsExposeTargets(state).length > 0,
    resolve: (state, legalAction) => {
      startHuntClubBbsExposeChoice(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "hunt_club_bbs_expose_choice",
      };
    },
  },
  "onr_v1_079_bodyweight-synthetic-blood": {
    name: "onr_runner_event_draw_5",
    resolve: (state, legalAction) => {
      const stackBefore = state.runner.stack.length;
      const drawSummary = drawRunnerCards(state, 5);
      const drawnCount = stackBefore - state.runner.stack.length;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        drawnCount,
        runnerGripAfter: state.runner.grip.length,
      };
      applyRunnerDrawSummaryPayload(state, legalAction, {
        ...drawSummary,
        drawnCount,
      });
    },
  },
  "onr_v1_095_jack-n-joe": {
    name: "onr_runner_event_draw_3",
    resolve: (state, legalAction) => {
      applyRunnerDrawSummaryPayload(
        state,
        legalAction,
        drawRunnerCards(state, 3),
      );
    },
  },
  "onr_v1_097_livewires-contacts": {
    name: "onr_runner_event_gain_credits_3",
    resolve: (state, legalAction) => {
      state.runner.credits += 3;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits: 3,
        runnerCreditsAfter: state.runner.credits,
      };
    },
  },
  onr_v1_108_score: {
    name: "onr_runner_event_gain_credits_9",
    resolve: (state, legalAction) => {
      state.runner.credits += 9;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits: 9,
        runnerCreditsAfter: state.runner.credits,
      };
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
  [RD_MULTIACCESS_EVENT_CARD_ID]: {
    name: "runner_event_rd_multiaccess_3",
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
  [HQ_MULTIACCESS_EVENT_CARD_ID]: {
    name: "runner_event_hq_multiaccess_3",
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
  [HQ_ACCESS_REPLACEMENT_DRAW_EVENT_CARD_ID]: {
    name: "runner_event_hq_access_replace_corp_lose1_tag_draw",
    requiresServer: true,
    canPlayForServer: (_state, serverId) => serverId === "hq",
    resolve: (state, legalAction) => {
      startRun(
        state,
        "hq",
        undefined,
        1,
        {
          successfulRunAccessReplacement: "corp_lose_credits",
          successfulRunCreditLoss: 1,
          successfulRunRunnerTagGain: 1,
          successfulRunCorpDraw: 1,
        },
        legalAction,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        serverId: "hq",
        hiddenZoneBarrier: true,
        accessReplacement: "corp_lose_credits_runner_tag_corp_draw",
      };
    },
  },
  [HQ_RUN_ACCESS_RD_EVENT_CARD_ID]: {
    name: "runner_event_hq_run_access_rd",
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
  [HQ_ACCESS_REPLACEMENT_CREDIT_LOSS_EVENT_CARD_ID]: {
    name: "runner_event_hq_access_replace_corp_lose4",
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
  [RUN_REPLACEMENT_OVERLAP_EVENT_CARD_ID]: {
    name: "runner_event_run_with_replacement_overlap",
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
  [RUN_MULTIACCESS_EVENT_CARD_ID]: {
    name: "runner_event_multiaccess_2",
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
  [RUN_ACCESS_PRESSURE_EVENT_CARD_ID]: {
    name: "runner_event_run_access_pressure",
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
  [TRACE_AWARE_RUN_EVENT_CARD_ID]: {
    name: "runner_event_trace_aware_run_access",
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
  [ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID]: {
    name: "onr_v1919_runner_event_flatline_replacement",
    canPlay: () => false,
    resolve: (state, legalAction) => {
      void state;
      void legalAction;
      throw new Error(
        "Arasaka Owns You wird als Flatline-Replacement gespielt.",
      );
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
    resolve: (state, legalAction) => {
      state.corp.credits += 9;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits: 9,
        corpCreditsAfter: state.corp.credits,
      };
    },
  },
  "onr_v1_282_annual-reviews": {
    name: "onr_corp_operation_draw_3",
    resolve: (state, legalAction) => {
      drawCorpCards(state, 3);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        drawnCards: 3,
      };
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
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      const creditsLost = state.runner.credits;
      state.runner.credits = 0;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        creditsLost,
        runnerCreditsAfter: state.runner.credits,
      };
    },
  },
  "onr_v1_286_corporate-detective-agency": {
    name: "onr_corp_operation_trash_two_runner_resources",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      const targetIds = state.runner.rig.resources.slice().sort().slice(0, 2);
      const targetDefinitionIds = targetIds.map(
        (cardId) => definitionFor(state, cardId).id,
      );
      for (const cardId of targetIds) {
        if (!state.runner.rig.resources.includes(cardId)) continue;
        trashRunnerInstalledCardToHeap(state, cardId);
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        trashedResourceCount: targetIds.length,
        trashedResourceDefinitionIds: targetDefinitionIds.join(","),
      };
    },
  },
  "onr_v1_287_datapool-by-zetatech": {
    name: "onr_corp_operation_give_two_tags",
    canPlay: (state) => state.runner.tags > 0,
    resolve: (state, legalAction) => {
      requireRunnerTagged(state);
      state.runner.tags += 2;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        tagsAdded: 2,
        runnerTagsAfter: state.runner.tags,
      };
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
    resolve: (state, legalAction) => {
      drawCorpCards(state, 2);
      state.corp.credits += 1;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        drawnCards: 2,
        gainedCredits: 1,
        corpCreditsAfter: state.corp.credits,
      };
    },
  },
  "onr_v1_290_efficiency-experts": {
    name: "onr_corp_operation_gain_credits_3",
    resolve: (state, legalAction) => {
      state.corp.credits += 3;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits: 3,
        corpCreditsAfter: state.corp.credits,
      };
    },
  },
  [CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID]: {
    name: "onr_v1922_corp_operation_private_archives_to_hq",
    canPlay: (state) => state.corp.archives.length > 0,
    resolve: (state, legalAction) => {
      const sourceCardId = String(legalAction.payload?.cardId ?? "");
      if (
        !sourceCardId ||
        definitionFor(state, sourceCardId).id !== CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID
      )
        throw new Error("Off-Site Backups fehlt als Quelle.");
      startCorpArchivesToHqChoice(state, sourceCardId, legalAction);
    },
  },
  [CORP_RD_TOP5_REORDER_OPERATION_CARD_ID]: {
    name: "onr_v1922_corp_operation_private_rd_top5_reorder",
    canPlay: (state) => state.corp.rd.length >= 2,
    resolve: (state, legalAction) => {
      const sourceCardId = String(legalAction.payload?.cardId ?? "");
      if (
        !sourceCardId ||
        definitionFor(state, sourceCardId).id !== CORP_RD_TOP5_REORDER_OPERATION_CARD_ID
      )
        throw new Error("Planning Consultants fehlt als Quelle.");
      startCorpRdTopReorderChoice(state, sourceCardId, legalAction);
    },
  },
  [EDGERUNNER_TEMPS_INSTALL_OPERATION_ID]: {
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
    resolve: (state, legalAction) => {
      state.corp.credits += 2;
      drawCorpCard(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits: 2,
        drawnCards: 1,
        corpCreditsAfter: state.corp.credits,
      };
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
    resolve: (state, legalAction) => {
      if (!runnerStoleAgendaLastTurn(state))
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      state.runner.tags += 1;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        tagsAdded: 1,
        runnerTagsAfter: state.runner.tags,
      };
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
  [FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (state) => corpAgendaCounterOperationTarget(state) !== undefined,
    resolve: (state, legalAction) =>
      resolveAgendaCounterOperation(
        state,
        legalAction,
        FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
      ),
  },
  [MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_three_advancement_counters",
    canPlay: (state) => advanceableInstalledCardTargets(state).length > 0,
    resolve: (state, legalAction) =>
      resolveManagementShakeUpOperation(state, legalAction),
  },
  [PROJECT_CONSULTANTS_ADVANCE_AGENDA_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_advance_installed_agenda",
    canPlay: (state) => installedAgendaOperationTarget(state) !== undefined,
    resolve: (state, legalAction) => {
      const targetAgendaId = installedAgendaOperationTarget(state);
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
  [SILVER_LINING_RECOVERY_PROTOCOL_ECONOMY_OPERATION_ID]: {
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
  [SYSTEMATIC_LAYOFFS_FORFEIT_AGENDA_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_forfeit_scored_agenda",
    canPlay: (state) => corpScoredAgendaForfeitTarget(state) !== undefined,
    resolve: (state, legalAction) => {
      const targets = corpScoredAgendaForfeitTargets(state);
      if (targets.length === 0)
        throw new Error(
          "Systematic Layoffs findet keine gescorte Korp-Agenda.",
        );
      if (targets.length > 1) {
        startSystematicLayoffsChoice(state, targets, legalAction);
        return;
      }
      resolveSystematicLayoffsForfeit(
        state,
        mustArrayValue(targets, 0, "Systematic-Layoffs-Ziel fehlt."),
        legalAction,
      );
    },
  },
  [TEAM_RESTRUCTURING_COUNTER_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (state) => corpAgendaCounterOperationTarget(state) !== undefined,
    resolve: (state, legalAction) =>
      resolveAgendaCounterOperation(
        state,
        legalAction,
        TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
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
    name: "corp_asset_acme_rez_gain_12_self_trash_persistent_debt",
    resolve: (state) => {
      state.corp.credits += 12;
    },
  },
};

type RunnerDrawSummary = {
  drawnCount: number;
  citySurveillanceSourceCount: number;
  citySurveillanceCreditsPaid: number;
  citySurveillanceTagsAdded: number;
};

function emptyRunnerDrawSummary(): RunnerDrawSummary {
  return {
    drawnCount: 0,
    citySurveillanceSourceCount: 0,
    citySurveillanceCreditsPaid: 0,
    citySurveillanceTagsAdded: 0,
  };
}

function mergeRunnerDrawSummary(
  left: RunnerDrawSummary,
  right: RunnerDrawSummary,
): RunnerDrawSummary {
  return {
    drawnCount: left.drawnCount + right.drawnCount,
    citySurveillanceSourceCount: Math.max(
      left.citySurveillanceSourceCount,
      right.citySurveillanceSourceCount,
    ),
    citySurveillanceCreditsPaid:
      left.citySurveillanceCreditsPaid + right.citySurveillanceCreditsPaid,
    citySurveillanceTagsAdded:
      left.citySurveillanceTagsAdded + right.citySurveillanceTagsAdded,
  };
}

function applyRunnerDrawSummaryPayload(
  state: GameState,
  legalAction: LegalAction,
  summary: RunnerDrawSummary,
): void {
  if (summary.drawnCount <= 0) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    drawnCount: summary.drawnCount,
    ...(summary.citySurveillanceSourceCount > 0
      ? {
          citySurveillanceSourceCount: summary.citySurveillanceSourceCount,
          citySurveillanceCreditsPaid: summary.citySurveillanceCreditsPaid,
          citySurveillanceTagsAdded: summary.citySurveillanceTagsAdded,
          runnerCreditsAfter: state.runner.credits,
          runnerTagsAfter: state.runner.tags,
        }
      : {}),
  };
}

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
    acmeSavingsAndLoanObligations: 0,
    corpBonusAgendaPoints: 0,
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
      stoleResearchAgendaThisTurn: false,
      stoleGrayOpsAgendaThisTurn: false,
      stoleBlackOpsAgendaThisTurn: false,
      runAttemptsThisTurn: 0,
      runAttemptsLastTurn: 0,
      successfulHqRunThisTurn: false,
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
  const sharedRunWindow =
    state.timingPoint === "run.approach_ice" ||
    state.timingPoint === "run.jack_out_window";
  if (side !== state.activeSide && !sharedRunWindow)
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
  if (state.timingPoint === "run.approach_ice") {
    if (isApproachIceExposeWindowOpen(state))
      return side === "runner" ? runnerApproachIceExposeActions(state) : [];
    return side === "corp" ? corpApproachActions(state) : [];
  }
  if (state.timingPoint === "run.encounter_ice")
    return side === "runner" ? runnerEncounterActions(state) : [];
  if (state.timingPoint === "run.jack_out_window") {
    if (side === "corp") return corpRunRootRezActions(state);
    return side === "runner" ? runnerMovementActions(state) : [];
  }
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
      ? { pendingChoice: visibleChoice(state, state.pendingChoice) }
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
  if (
    state.run?.viral15ActiveSourceIceId &&
    !state.cardInstances[state.run.viral15ActiveSourceIceId]
  )
    errors.push("Run Viral 15 source references missing ice.");
  if (
    state.run?.viral15PendingPassedIceId &&
    !state.cardInstances[state.run.viral15PendingPassedIceId]
  )
    errors.push("Run Viral 15 pending passed ice references missing ice.");
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
    if (
      state.trace.status === "runner_bid" ||
      state.trace.status === "post_bid_link"
    ) {
      if (state.pendingChoice?.side !== "runner")
        errors.push("Runner trace step requires Runner choice.");
      if (
        state.trace.corpBid === undefined ||
        state.trace.traceStrength === undefined ||
        state.trace.runnerLink === undefined
      )
        errors.push("Runner trace step is missing Corp bid context.");
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
  if (state.runnerTurnFlags?.runLockActionsPending !== undefined) {
    const pending = state.runnerTurnFlags.runLockActionsPending;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.runLockActionsPending must be a non-negative integer.",
      );
  }
  if (state.runnerTurnFlags?.fangRunLockCreditCost !== undefined) {
    const pending = state.runnerTurnFlags.fangRunLockCreditCost;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.fangRunLockCreditCost must be a non-negative integer.",
      );
  }
  if (state.runnerAgendaPointsToForfeit !== undefined) {
    const pending = state.runnerAgendaPointsToForfeit;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerAgendaPointsToForfeit must be a non-negative integer.",
      );
  }
  if (state.acmeSavingsAndLoanObligations !== undefined) {
    const obligations = state.acmeSavingsAndLoanObligations;
    if (!Number.isInteger(obligations) || obligations < 0)
      errors.push(
        "acmeSavingsAndLoanObligations must be a non-negative integer.",
      );
  }
  if (state.corpBonusAgendaPoints !== undefined) {
    const points = state.corpBonusAgendaPoints;
    if (!Number.isInteger(points) || points < 0)
      errors.push("corpBonusAgendaPoints must be a non-negative integer.");
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
  return hashStateSnapshot(state);
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
            {
              cardId: id,
              ...(definition.id === SECURITY_NET_OPTIMIZATION_ID
                ? { selectedServerId: server.id }
                : {}),
            },
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
  if (acmeSavingsAndLoanObligationCount(state) > 0 && state.corp.credits >= 12) {
    actions.push(
      action(
        state,
        "corp",
        "trigger_ability",
        "ACME Savings and Loan: 12 Credits zahlen und 1 Agenda-Punkt scoren",
        "game_rule",
        [{ clicks: 1, credits: 12 }],
        {
          acmeSavingsAndLoanAbility: "remove_obligation",
          acmeSavingsAndLoanCreditCost: 12,
          acmeSavingsAndLoanScoreAgendaPoints: 1,
          acmeSavingsAndLoanObligationsBefore:
            acmeSavingsAndLoanObligationCount(state),
        },
      ),
    );
  }
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
  if (state.corp.credits >= 5) {
    for (const id of state.runner.rig.resources.slice().sort()) {
      if (definitionFor(state, id).id !== CODE_VIRAL_CACHE_ID) continue;
      actions.push(
        action(
          state,
          "corp",
          "trigger_ability",
          "Code Viral Cache trashen",
          id,
          [{ clicks: 1, credits: 5 }],
          {
            cardId: id,
            corpAbility: "trash_code_viral_cache",
            sourceDefinitionId: CODE_VIRAL_CACHE_ID,
            trashCostPaid: 5,
          },
          {
            targetRequirements: [
              {
                id: "codeViralCache",
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
      if (
        definition.type === "agenda" ||
        definition.id === EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID ||
        definition.id === INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID ||
        definition.id === VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID
      ) {
        if (state.corp.credits >= 1)
          actions.push(
            action(
              state,
              "corp",
              "advance_card",
              `${definition.title} in ${server.label} advancen`,
              id,
              [{ clicks: 1, credits: 1 }],
              { cardId: id },
            ),
          );
      }
      const rezCost = rezCostForCard(state, id);
      const rezCostReductionSourceDefinitionIds =
        rezCostReductionSourceDefinitionIdsFor(state, id, definition);
      if (
        (definition.type === "asset" || definition.type === "upgrade") &&
        !mustInstance(state.cardInstances, id).rezzed &&
        state.corp.credits >= rezCost &&
        (definition.id !== ACME_SAVINGS_AND_LOAN_ID ||
          corpAgendaPointTotal(state) >= 1)
      ) {
        const acmeRezCost =
          definition.id === ACME_SAVINGS_AND_LOAN_ID
            ? {
                agendaPointCost: 1,
                acmeSavingsAndLoanAbility: "rez_with_agenda_point_cost",
              }
            : {};
        actions.push(
          action(
            state,
            "corp",
            "rez_ice",
            `Karte in ${server.label} rezzen`,
            id,
            [{ credits: rezCost }],
            {
              cardId: id,
              rootRez: true,
              ...acmeRezCost,
              ...(rezCostReductionSourceDefinitionIds.length > 0
                ? {
                    rezCostReductionSourceDefinitionIds:
                      rezCostReductionSourceDefinitionIds.join(","),
                    rezCostReductionAmount:
                      (definition.rezCost ?? 0) - rezCost,
                    rezCostPaid: rezCost,
                  }
                : {}),
            },
          ),
        );
      }
    }
  }
  for (const assetId of rezzedCorpRootCardIds(state).sort()) {
    const definition = definitionFor(state, assetId);
    if (TRACE_ASSET_CARD_IDS.has(definition.id)) {
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
      HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS.has(definition.id) &&
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
      HIDDEN_ZONE_REORDER_ASSET_CARD_IDS.has(definition.id) &&
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
    if (definition.id === CORP_HQ_SHUFFLE_DRAW_CARD_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: HQ in R&D mischen und ziehen`,
          assetId,
          [{ clicks: 1 }],
          { cardId: assetId, v1917AssetAbility: "rescheduler_hq_shuffle_draw" },
        ),
      );
    }
    if (
      definition.id === SOLO_SQUAD_DAMAGE_ASSET_CARD_ID &&
      state.runner.tags > 0 &&
      state.runner.grip.length > 0
    ) {
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
    if (definition.id === COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID) {
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
    if (definition.id === DISINFECTANT_VIRUS_COUNTER_ASSET_ID) {
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
    if (COUNTER_UPGRADE_CARD_IDS.has(definition.id)) {
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
      TAG_CONDITION_UPGRADE_CARD_IDS.has(definition.id) &&
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
    if (COUNTER_ASSET_CARD_IDS.has(definition.id)) {
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
    if (definition.id === INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID) {
      const advancementCounterCount = Math.max(
        0,
        Math.floor(mustInstance(state.cardInstances, assetId).advancementCounters),
      );
      const gainCreditsAmount = advancementCounterCount * 4;
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: ${gainCreditsAmount} Credits und trashen`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1919AssetAbility: "gain_credits",
            advancementCounterCount,
            gainCreditsAmount,
            trashOnUse: true,
          },
        ),
      );
    }
    if (ACTION_ASSET_CARD_IDS.has(definition.id)) {
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
    if (definition.id === SOUTH_AFRICAN_MINING_CORP_ACTION_ASSET_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 8 Credits und trashen`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1920AssetAbility: "south_african_mining_corp_gain_8_trash",
            gainCreditsAmount: 8,
            trashOnUse: true,
          },
        ),
      );
    }
    if (
      definition.id === I_GOT_A_ROCK_BAD_PUBLICITY_ASSET_ID &&
      state.runner.tags >= 2 &&
      corpAgendaPointTotal(state) >= 3
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 15 Meat Damage`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1920AssetAbility: "i_got_a_rock_tagged_meat_damage",
            agendaPointCost: 3,
            damageType: "meat",
            damageAmount: 15,
          },
        ),
      );
    }
    if (definition.id === SCHLAGHUND_RANDOM_ASSET_CARD_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Wuerfel gegen Tags werfen`,
          assetId,
          [{ clicks: 1 }],
          { cardId: assetId, v1921AssetAbility: "schlaghund_tag_damage" },
        ),
      );
    }
    if (definition.id === SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: 6 Bits laden`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1917AssetAbility: "spinn_load_pool",
            counterType: "bit",
            addCounterAmount: 6,
            gainCreditsAmount: 0,
          },
        ),
      );
      continue;
    }
    if (!CORP_ECONOMY_ASSET_CARD_IDS.has(definition.id)) continue;
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
      SCORED_REVEAL_AGENDA_CARD_IDS.has(definition.id) &&
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
      definition.id === CORPORATE_RETREAT_INSTALL_CREDIT_AGENDA_ID &&
      isCorporateRetreatInstallCreditAbilityAvailable(state, agendaId)
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
    if (definition.id === POLITICAL_OVERTHROW_AP_COUNTER_AGENDA_ID) {
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
    if (definition.id === MARINE_ARCOLOGY_REPLACE_COUNTERS_AGENDA_ID) {
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
    const agendaAbility =
      definition.id === "onr_v1_193_corporate-coup"
        ? "corporate_coup"
        : "political_coup";
    const removePowerCounterAmount = 3;
    if (cardCounter(state, agendaId, "power") < removePowerCounterAmount) continue;
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

function isCorporateRetreatInstallCreditAbilityAvailable(
  state: GameState,
  agendaId: CardInstanceId,
): boolean {
  return (
    state.corp.scoreArea.includes(agendaId) &&
    definitionFor(state, agendaId).id === CORPORATE_RETREAT_INSTALL_CREDIT_AGENDA_ID &&
    cardCounter(state, agendaId, "mark") > 0
  );
}

function expireCorporateRetreatInstallCreditAbilities(state: GameState): void {
  for (const agendaId of state.corp.scoreArea) {
    if (definitionFor(state, agendaId).id === CORPORATE_RETREAT_INSTALL_CREDIT_AGENDA_ID)
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

function clearEdgerunnerTempsInstallFlags(state: GameState): void {
  ensureCorpTurnFlags(state).edgerunnerTempsInstallActionsRemaining = 0;
}

function consumeEdgerunnerTempsInstallAction(
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

function clearValuPakProgramInstallFlags(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  flags.valuPakProgramInstallActionsRemaining = 0;
  flags.valuPakTemporaryProgramInstallCredits = 0;
}

function consumeValuPakProgramInstallAction(
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
    if (state.runner.tags > 0 && availableRunnerTagRemovalCredits(state) >= 2) {
      actions.push(
        action(state, "runner", "remove_tag", "Tag entfernen", "basic_action", [
          { clicks: 1, credits: 2 },
        ]),
      );
    }
    if (cardCounter(state, state.runner.identity, "crying") > 0 && state.runner.credits >= 4) {
      actions.push(
        action(
          state,
          "runner",
          "gain_credit",
          "Crying-Counter entfernen",
          state.runner.identity,
          [{ clicks: 1, credits: 4 }],
          {
            runnerAbility: "remove_crying_counter",
            cardId: state.runner.identity,
            counterType: "crying",
            removeCounterAmount: 1,
            gainCreditsAmount: 0,
          },
        ),
      );
    }
    if (
      cardCounter(state, state.runner.identity, "cerberus") > 0 &&
      state.runner.credits >= 4
    ) {
      actions.push(
        action(
          state,
          "runner",
          "gain_credit",
          "Cerberus-Counter entfernen",
          state.runner.identity,
          [{ clicks: 1, credits: 4 }],
          {
            runnerAbility: "remove_cerberus_counter",
            cardId: state.runner.identity,
            counterType: "cerberus",
            removeCounterAmount: 1,
            gainCreditsAmount: 0,
          },
        ),
      );
    }
    for (const dataRavenId of rezzedInstalledIceIds(state).sort()) {
      if (definitionFor(state, dataRavenId).id !== DATA_RAVEN_ID) continue;
      if (cardCounter(state, dataRavenId, "power") <= 0) continue;
      if (state.runner.credits < 1) continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          "Data-Raven-Counter entfernen",
          dataRavenId,
          [{ clicks: 1, credits: 1 }],
          {
            cardId: dataRavenId,
            runnerAbility: "remove_data_raven_counter",
            counterType: "power",
            removeCounterAmount: 1,
          },
        ),
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
        if (canOverlayProgramOnZetatechSoftwareInstaller(state, hostId, definition)) {
          const hostDefinition = definitionFor(state, hostId);
          actions.push(
            action(
              state,
              "runner",
              "install_card",
              `${definition.title} über ${hostDefinition.title} installieren`,
              id,
              [{ clicks: 1, credits: definition.installCost ?? 0 }],
              {
                cardId: id,
                hostOnCardId: hostId,
                v1922ZetatechOverlayInstall: true,
              },
              {
                targetRequirements: [
                  {
                    id: "zetatechOverlayHost",
                    kind: "card",
                    side: "runner",
                    zoneScope: ["runner.rig.programs"],
                    visibility: "public",
                  },
                ],
              },
            ),
          );
          continue;
        }
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
      if (definition.id === ARASAKA_PORTABLE_PROTOTYPE_LINK_HARDWARE_ID) {
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
              installCostReason: "arasaka_portable_prototype",
            },
            {
              targetRequirements: [
                {
                  id: "hardwareCard",
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
      if (
        definition.id === CODE_VIRAL_CACHE_ID &&
        ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true
      ) {
        continue;
      }
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
      ...state.runner.rig.hardware,
      ...state.runner.rig.resources,
    ]
      .slice()
      .sort()) {
      const definition = definitionFor(state, cardId);
      if (
        STACK_SEARCH_PROGRAM_CARD_IDS.has(definition.id) &&
        definition.id !== SELF_MODIFYING_CODE_ID &&
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
        SERVER_EXPOSE_PROGRAM_CARD_IDS.has(definition.id) &&
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
        STACK_TOP_REVEAL_PROGRAM_CARD_IDS.has(definition.id) &&
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
      if (
        definition.id === COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID &&
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
            {
              cardId,
              v1912CounterAbility: "reveal_stack_top",
              hiddenZoneAction: "v1912_reveal_stack_top",
            },
          ),
        );
      }
      if (
        definition.id === FAIT_ACCOMPLI_COUNTER_PROGRAM_ID &&
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
      if (definition.id === BOARDWALK_RANDOM_PROGRAM_CARD_ID) {
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
      if (definition.id === NEWSGROUP_FILTER_CREDIT_PROGRAM_ID) {
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
      if (
        definition.id === MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID &&
        topHostedProgramOnMicrotech(state, cardId)
      ) {
        const topHostedId = topHostedProgramOnMicrotech(state, cardId);
        if (!topHostedId) continue;
        actions.push(
          action(
            state,
            "runner",
            "trigger_ability",
            `${definition.title}: oberstes Programm in die Grip nehmen`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              targetProgramId: topHostedId,
              v1922RunnerHardwareAbility:
                "microtech_backup_drive_return_top_hosted",
              hostedProgramCount: microtechHostedProgramIds(state, cardId)
                .length,
            },
          ),
        );
      }
      if (definition.id === QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID) {
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
      if (
        definition.id === STACK_TOP_REORDER_RESOURCE_CARD_ID &&
        state.runner.stack.length >= 2
      ) {
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
      if (
        definition.id === BROKER_ID &&
        !runnerUsedBrokerThisTurn(state, resourceId)
      ) {
        const storedCredits = cardCounter(state, resourceId, "power");
        actions.push(
          action(
            state,
            "runner",
            "trigger_ability",
            `${definition.title}: 3 Credits auf Broker legen`,
            resourceId,
            [{ clicks: 1 }],
            {
              cardId: resourceId,
              resourceAbility: "broker_load_credits",
              counterType: "power",
              addCounterAmount: 3,
              gainCreditsAmount: 0,
            },
          ),
        );
        if (storedCredits > 0) {
          actions.push(
            action(
              state,
              "runner",
              "trigger_ability",
              `${definition.title}: ${storedCredits} ${storedCredits === 1 ? "Credit" : "Credits"} nehmen`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "broker_take_credits",
                counterType: "power",
                removePowerCounterAmount: storedCredits,
                gainCreditsAmount: storedCredits,
              },
            ),
          );
        }
      }
      if (definition.id === SHORT_TERM_CONTRACT_ID) {
        const storedCredits = cardCounter(state, resourceId, "power");
        if (storedCredits >= 2) {
          actions.push(
            action(
              state,
              "runner",
              "trigger_ability",
              `${definition.title}: 2 Credits nehmen`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "short_term_contract_take_credits",
                counterType: "power",
                removePowerCounterAmount: 2,
                gainCreditsAmount: 2,
              },
            ),
          );
        }
      }
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
    const rovingRunBlocked =
      rovingSubmarineIdsForServer(state, server.id).length > 0 &&
      !rovingSubmarineIdsForServer(state, server.id).some(
        (rovingId) => cardCounter(state, rovingId, "mark") > 0,
      );
    const upgradeRunStartTax = runStartTaxForServerUpgrades(state, server.id);
    const newsgroupRunTax = newsgroupTauntingRunStartTax(state);
    const runStartTaxCredits =
      upgradeRunStartTax.amount + newsgroupRunTax.amount;
    const runLockActionsPending = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.runLockActionsPending ?? 0),
    );
    const fangRunLockCreditCost = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
    );
    const runCosts = [
      {
        clicks: 1,
        ...(runStartTaxCredits > 0 ? { credits: runStartTaxCredits } : {}),
      },
    ];
    const runPayload = {
      serverId: server.id,
      ...(upgradeRunStartTax.amount > 0
        ? {
            v1918UpgradeAbility: "run_start_tax",
            runStartTaxCredits: upgradeRunStartTax.amount,
            runStartTaxSourceDefinitionIds:
              upgradeRunStartTax.sourceDefinitionIds.join(","),
          }
        : {}),
      ...(newsgroupRunTax.amount > 0
        ? {
            v1920AssetAbility: "newsgroup_taunting_run_start_tax",
            newsgroupTauntingRunStartTaxCredits: newsgroupRunTax.amount,
            newsgroupTauntingSourceDefinitionIds:
              newsgroupRunTax.sourceDefinitionIds.join(","),
          }
        : {}),
      ...(runStartTaxCredits > 0 ? { runStartTaxCredits } : {}),
    };
    if (
      hasClicks &&
      runLockActionsPending <= 0 &&
      fangRunLockCreditCost <= 0 &&
      !rovingRunBlocked
    ) {
      if (
        runStartTaxCredits === 0 ||
        availableRunnerRunStartCredits(state) >= runStartTaxCredits
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
      !rovingRunBlocked &&
      (runStartTaxCredits === 0 ||
        availableRunnerRunStartCredits(state) >= runStartTaxCredits)
    ) {
      actions.push(
        action(
          state,
          "runner",
          "start_run",
          `Bonus-Run auf ${server.label}`,
          "basic_action",
          runStartTaxCredits > 0 ? [{ credits: runStartTaxCredits }] : [],
          {
            ...runPayload,
            bonusRunNoClick: true,
            bonusRunSource:
              flags.bodyweightDataCrecheExtraRunPending === true
                ? BODYWEIGHT_DATA_CRECHE_ID
                : ALL_NIGHTER_ID,
          },
        ),
      );
    }
  }
  const fangRunLockCreditCost = Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
  );
  if (
    hasClicks &&
    fangRunLockCreditCost > 0 &&
    state.runner.credits >= fangRunLockCreditCost
  ) {
    actions.push(
      action(
        state,
        "runner",
        "trigger_ability",
        `Fang 2.0: Run-Sperre für ${fangRunLockCreditCost} Credits entfernen`,
        "game_rule",
        [{ clicks: 1, credits: fangRunLockCreditCost }],
        {
          v1920RunnerRunLockAbility: "fang_2_0_pay_to_run",
          fangRunLockCreditCost,
          gainCreditsAmount: 0,
        },
      ),
    );
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

function canOverlayProgramOnZetatechSoftwareInstaller(
  state: GameState,
  hostId: CardInstanceId,
  programDefinition: CardDefinition,
): boolean {
  if (programDefinition.type !== "program") return false;
  const hostInstance = mustInstance(state.cardInstances, hostId);
  const hostDefinition = definitionFor(state, hostId);
  return (
    hostDefinition.id === ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID &&
    hostDefinition.type === "program" &&
    state.runner.rig.programs.includes(hostId) &&
    !hostInstance.hostedOn &&
    hostedCardsOn(state, hostId).length === 0
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
      sourceDefinition.id === DATA_MASONS_HOSTING_ASSET_CARD_ID &&
      cardHasSubtype(iceDefinition, "wall")
    )
      bonus += 1;
    if (
      sourceDefinition.id === "onr_v1_350_antiquated-interface-routines" &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId
    )
      bonus += 1;
    if (
      sourceDefinition.id === JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId &&
      cardHasSubtype(iceDefinition, "wall")
    )
      bonus += 1;
  }
  for (const agendaId of scoredCorpAgendaIds(state)) {
    const agendaDefinition = definitionFor(state, agendaId);
    if (
      agendaDefinition.id === SECURITY_NET_OPTIMIZATION_ID &&
      iceServerId &&
      mustInstance(state.cardInstances, agendaId).selectedServerId === iceServerId
    )
      bonus += 1;
    if (
      agendaDefinition.id === ENCRYPTION_BREAKTHROUGH_ID &&
      cardHasSubtype(iceDefinition, "code_gate")
    )
      bonus += 1;
    if (
      agendaDefinition.id === SUPERIOR_NET_BARRIERS_ID &&
      cardHasSubtype(iceDefinition, "wall")
    )
      bonus += 1;
    if (
      agendaDefinition.id === BLACK_ICE_QUALITY_ASSURANCE_ID &&
      cardHasSubtype(iceDefinition, "black_ice")
    )
      bonus += 1;
  }
  bonus += cardCounter(state, iceId, "mark");
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

function runBreakSubroutineAdditionalCost(run: GameState["run"]): number {
  if (!run) return 0;
  return Math.max(0, Math.floor(run.breakSubroutineAdditionalCost ?? 0));
}

function microtechTrodeSetBreakAdditionalCost(state: GameState): number {
  return state.runner.rig.hardware.some(
    (cardId) => definitionFor(state, cardId).id === MICROTECH_TRODE_SET_ID,
  )
    ? 1
    : 0;
}

function hasInstalledMicrotechTrodeSet(state: GameState): boolean {
  return state.runner.rig.hardware.some(
    (cardId) => definitionFor(state, cardId).id === MICROTECH_TRODE_SET_ID,
  );
}

function iceRezCostReductionFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): number {
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  let reduction = 0;
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (
      sourceDefinition.id === DATA_MASONS_HOSTING_ASSET_CARD_ID &&
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
    if (sourceDefinition.id === FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID)
      reduction += 1;
    if (
      sourceDefinition.id === JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId &&
      cardHasSubtype(iceDefinition, "wall")
    )
      reduction += 9;
  }
  return reduction;
}

function rezCostReductionSourceDefinitionIdsFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): CardDefinitionId[] {
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  const sourceIds: CardDefinitionId[] = [];
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (
      sourceDefinition.id === DATA_MASONS_HOSTING_ASSET_CARD_ID &&
      cardHasSubtype(iceDefinition, "wall")
    )
      sourceIds.push(sourceDefinition.id);
    if (
      sourceDefinition.id === "onr_v1_320_encoder-inc" &&
      cardHasSubtype(iceDefinition, "code_gate")
    )
      sourceIds.push(sourceDefinition.id);
    if (
      sourceDefinition.id === "onr_v1_341_skalderviken-sa-beta-test-site" &&
      cardHasSubtype(iceDefinition, "black_ice")
    )
      sourceIds.push(sourceDefinition.id);
    if (sourceDefinition.id === FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID)
      sourceIds.push(sourceDefinition.id);
    if (
      sourceDefinition.id === JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId &&
      cardHasSubtype(iceDefinition, "wall")
    )
      sourceIds.push(sourceDefinition.id);
  }
  return sourceIds;
}

function rezCostForCard(state: GameState, cardId: CardInstanceId): number {
  const definition = definitionFor(state, cardId);
  const baseCost = definition.rezCost ?? 0;
  if (definition.type !== "ice") return baseCost;
  const reduction = iceRezCostReductionFor(state, cardId, definition);
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

function outermostIceIndex(server: CorpServer): number {
  return server.ice.length - 1;
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
      const rezCostReductionSourceDefinitionIds =
        rezCostReductionSourceDefinitionIdsFor(
          state,
          run.approachedIceId,
          definition,
        );
  if (!ice.rezzed && state.corp.credits >= rezCost) {
    actions.push(
      action(
        state,
        "corp",
        "rez_ice",
        `${definition.title} rezzen`,
        run.approachedIceId,
        [{ credits: rezCost }],
        {
          cardId: run.approachedIceId,
          ...(rezCostReductionSourceDefinitionIds.length > 0
            ? {
                rezCostReductionSourceDefinitionIds:
                  rezCostReductionSourceDefinitionIds.join(","),
                rezCostReductionAmount: (definition.rezCost ?? 0) - rezCost,
                rezCostPaid: rezCost,
              }
            : {}),
        },
      ),
    );
  }
  actions.push(
    action(state, "corp", "decline_rez", "Nicht rezzen", "game_rule"),
  );
  return [...actions, ...corpRunRootRezActions(state)];
}

function corpRunRootRezActions(state: GameState): LegalAction[] {
  const run = state.run;
  if (!run) return [];
  const server = mustServer(state, run.attackedServerId);
  const actions: LegalAction[] = [];
  for (const cardId of server.root.slice().sort()) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.rezzed) continue;
    const definition = definitionFor(state, cardId);
    if (definition.type !== "asset" && definition.type !== "upgrade") continue;
    const rezCost = rezCostForCard(state, cardId);
    if (state.corp.credits < rezCost) continue;
    const rezCostReductionSourceDefinitionIds =
      rezCostReductionSourceDefinitionIdsFor(state, cardId, definition);
    actions.push(
      action(
        state,
        "corp",
        "rez_ice",
        `${definition.title} in ${server.label} rezzen`,
        cardId,
        [{ credits: rezCost }],
        {
          cardId,
          rootRez: true,
          speedTrapInterruptEligible: true,
          serverId: server.id,
          ...(rezCostReductionSourceDefinitionIds.length > 0
            ? {
                rezCostReductionSourceDefinitionIds:
                  rezCostReductionSourceDefinitionIds.join(","),
                rezCostReductionAmount: (definition.rezCost ?? 0) - rezCost,
                rezCostPaid: rezCost,
              }
            : {}),
        },
      ),
    );
  }
  actions.push(...singaporeCityGridRunActions(state, run, server));
  return actions;
}

function singaporeCityGridRunActions(
  state: GameState,
  run: ActiveRun,
  server: CorpServer,
): LegalAction[] {
  if (run.attackedServerId !== server.id) return [];
  const hqIceIds = state.corp.hq
    .filter((cardId) => definitionFor(state, cardId).type === "ice")
    .sort();
  if (hqIceIds.length === 0) return [];
  const used = new Set(run.singaporeCityGridUsedSourceIdsThisRun ?? []);
  const unrezzedIceTargets = server.ice
    .map((cardId, iceIndex) => ({ cardId, iceIndex }))
    .filter(({ cardId }) => !mustInstance(state.cardInstances, cardId).rezzed)
    .sort((left, right) => left.iceIndex - right.iceIndex);
  if (unrezzedIceTargets.length === 0) return [];
  return server.root
    .slice()
    .sort()
    .filter((cardId) => !used.has(cardId))
    .filter((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return (
        instance.rezzed &&
        definitionFor(state, cardId).id === SERVER_ICE_SWAP_UPGRADE_CARD_ID
      );
    })
    .flatMap((sourceCardId) => {
      const definition = definitionFor(state, sourceCardId);
      return unrezzedIceTargets.map(({ cardId: targetIceId, iceIndex }) =>
        action(
          state,
          "corp",
          "trigger_ability",
          `${definition.title}: ICE in ${server.label} austauschen`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            targetIceId,
            serverId: server.id,
            iceIndex,
            v1918UpgradeAbility: "singapore_city_grid_hq_ice_swap",
            hiddenZoneBarrier: true,
            hiddenZoneAction: "v1918_singapore_city_grid_choice",
          },
        ),
      );
    });
}

function isApproachIceExposeWindowOpen(state: GameState): boolean {
  return Boolean(
    state.timingPoint === "run.approach_ice" &&
    state.activeSide === "runner" &&
    approachIceExposeCanBeOfferedForCurrentIce(state),
  );
}

function approachIceExposeCanBeOfferedForCurrentIce(state: GameState): boolean {
  const run = state.run;
  const approachedIceId = run?.approachedIceId;
  if (!run || !approachedIceId) return false;
  if (run.approachIceExposeSkippedIceIdsThisRun?.includes(approachedIceId))
    return false;
  if (installedApproachIceExposeSources(state).length === 0) return false;
  const ice = state.cardInstances[approachedIceId];
  return Boolean(ice && !ice.rezzed);
}

function installedApproachIceExposeSources(state: GameState): CardInstanceId[] {
  const used = new Set(state.run?.approachIceExposeUsedSourceIdsThisRun ?? []);
  return runnerInstalledCardIds(state)
    .slice()
    .sort()
    .filter((cardId) => {
      if (used.has(cardId)) return false;
      return definitionFor(state, cardId).abilities?.some(
        (ability) =>
          ability.type === "approach_ice_expose" &&
          ability.timingPoint === "run.approach_ice" &&
          ability.publicActionType === "trigger_ability",
      );
    });
}

function approachIceExposeAbilityIdForSource(
  state: GameState,
  sourceCardId: CardInstanceId,
): string {
  const ability = definitionFor(state, sourceCardId).abilities?.find(
    (candidate) =>
      candidate.type === "approach_ice_expose" &&
      candidate.timingPoint === "run.approach_ice",
  );
  if (!ability)
    throw new Error("Diese Karte hat keine Approach-Expose-Faehigkeit.");
  return ability.id;
}

function runnerApproachIceExposeActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  const approachedIceId = run.approachedIceId;
  if (!approachedIceId) return [];
  const sources = installedApproachIceExposeSources(state);
  if (sources.length === 0) return [];
  const primarySource = sources[0]!;
  const exposeActions = sources.map((sourceCardId) => {
    const definition = definitionFor(state, sourceCardId);
    const abilityId = approachIceExposeAbilityIdForSource(state, sourceCardId);
    return action(
      state,
      "runner",
      "trigger_ability",
      `${definition.title}: ICE expose`,
      sourceCardId,
      [],
      {
        cardId: sourceCardId,
        iceId: approachedIceId,
        approachIceExposeDecision: "expose",
      },
      {
        abilityRef: { sourceCardInstanceId: sourceCardId, abilityId },
        effectRef: `effect.${abilityId}`,
        targetRequirements: [
          {
            id: "approachedIce",
            kind: "card",
            side: "corp",
            zoneScope: ["corp.servers.ice"],
            visibility: "public",
          },
        ],
      },
    );
  });
  return [
    ...exposeActions,
    action(
      state,
      "runner",
      "trigger_ability",
      "Expose-Fenster überspringen",
      primarySource,
      [],
      {
        cardId: primarySource,
        iceId: approachedIceId,
        approachIceExposeDecision: "decline",
      },
    ),
  ];
}

function selfModifyingCodeEncounterActions(state: GameState): LegalAction[] {
  if (
    state.timingPoint !== "run.encounter_ice" ||
    state.activeSide !== "runner" ||
    !state.run?.encounteredIceId ||
    !state.runner.stack.some((cardId) => definitionFor(state, cardId).type === "program")
  )
    return [];
  return state.runner.rig.programs
    .slice()
    .sort()
    .filter((cardId) => definitionFor(state, cardId).id === SELF_MODIFYING_CODE_ID)
    .map((cardId) =>
      action(
        state,
        "runner",
        "trigger_ability",
        "Self-Modifying Code trashen: Programm aus Stack installieren",
        cardId,
        [],
        {
          cardId,
          v1911HiddenZoneAbility: "self_modifying_code_install_program",
          hiddenZoneBarrier: true,
        },
        {
          abilityRef: {
            sourceCardInstanceId: cardId,
            abilityId: "self_modifying_code_install_program",
          },
          effectRef: "effect.self_modifying_code_install_program",
        },
      ),
    );
}

function runnerEncounterActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  if (!run.encounteredIceId) return [];
  const encounteredIceId = run.encounteredIceId;
  const iceDefinition = definitionFor(state, run.encounteredIceId);
  const encounterSubroutines = subroutinesForCurrentEncounter(
    state,
    iceDefinition,
  );
  const encounteredIceStrength = iceStrengthFor(state, encounteredIceId);
  const actions: LegalAction[] = [];
  actions.push(...selfModifyingCodeEncounterActions(state));
  for (const breakerId of state.runner.rig.programs) {
    const breaker = definitionFor(state, breakerId);
    if (!runnerCanUseBreakerOnCurrentFort(state, breakerId)) continue;
    const breakerBaseStrength =
      breaker.id === AI_BOON_RANDOM_BREAKER_CARD_ID &&
      typeof run.aiBoonRunStrength === "number"
        ? run.aiBoonRunStrength
        : (breaker.strength ?? 0);
    const breakerStrength =
      breakerBaseStrength +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      cardCounter(state, breakerId, "militech") +
      dupreStrengthCounterBonus(state, breakerId) +
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
          `${breaker.title}: Stärke +${pump.amount ?? 1}`,
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
    const additionalBreakCost =
      runBreakSubroutineAdditionalCost(run) +
      microtechTrodeSetBreakAdditionalCost(state);
    if (
      !run.noBreakSubroutinesActive &&
      breakAbility &&
      breakerStrength >= encounteredIceStrength &&
      availableRunnerRunCredits(state, breakerId) >=
        breakAbility.cost.credits + additionalBreakCost &&
      (![RAMMING_PISTON_ID, PILE_DRIVER_ID].includes(breaker.id) ||
        runnerStealthRecurringCredits(state) >=
          (breakAbility.postBreakStealthLoss ?? 0))
    ) {
      const totalBreakCost = breakAbility.cost.credits + additionalBreakCost;
      const blinkUsedSubroutines =
        run.blinkUsedSubroutinesByBreakerThisEncounter?.[breakerId] ?? [];
      const subroutines = encounterSubroutines;
      if (breaker.id === PILE_DRIVER_ID) {
        actions.push(
          ...pileDriverBreakActions(
            state,
            breakerId,
            encounteredIceId,
            iceDefinition,
            subroutines,
            breakAbility,
            totalBreakCost,
            additionalBreakCost,
          ),
        );
        continue;
      }
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
              [{ credits: totalBreakCost }],
              {
                breakerId,
                iceId: encounteredIceId,
                subroutineIndex: index,
                targetIceDefinitionId: iceDefinition.id,
                breakSubroutineBaseCost: breakAbility.cost.credits,
                ...(additionalBreakCost > 0
                  ? {
                      breakSubroutineAdditionalCost: additionalBreakCost,
                      breakSubroutineTotalCost: totalBreakCost,
                      ...(runBreakSubroutineAdditionalCost(run) > 0
                        ? { v1922CorpIceAbility: "virizz_break_cost_modifier" }
                        : {}),
                      ...(microtechTrodeSetBreakAdditionalCost(state) > 0
                        ? {
                            runnerHardwareAbility:
                              "microtech_trode_set_break_cost_modifier",
                          }
                        : {}),
                    }
                  : {}),
              },
              abilityMetadata(breakerId, breakAbility.id, encounteredIceId),
            ),
          );
        }
      });
    }
  }
  const nextSubroutines = encounterSubroutinesForNextContinue(
    run,
    encounterSubroutines,
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
      sourceDefinitionId: iceDefinition.id,
      unbrokenSubroutineCount: nextSubroutines.length,
      encounterWillEndRun: willEndRun,
    }),
  );
  return actions;
}

function pileDriverBreakActions(
  state: GameState,
  breakerId: CardInstanceId,
  encounteredIceId: CardInstanceId,
  iceDefinition: CardDefinition,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
  breakAbility: NonNullable<CardDefinition["abilities"]>[number],
  totalBreakCost: number,
  additionalBreakCost: number,
): LegalAction[] {
  const run = mustRun(state);
  const eligibleIndexes = subroutines
    .map((subroutine, index) => ({ subroutine, index }))
    .filter(
      ({ subroutine, index }) =>
        breakAbilityMatchesSubroutine(breakAbility, subroutine) &&
        !run.brokenSubroutineIndexes.includes(index) &&
        !run.resolvedSubroutineIndexes.includes(index),
    )
    .map(({ index }) => index);
  const maxCount = Math.min(4, breakAbility.count ?? 4, eligibleIndexes.length);
  const actions: LegalAction[] = [];
  const selected: number[] = [];
  const visit = (start: number): void => {
    if (selected.length > 0) {
      const subroutineIndexes = [...selected];
      const firstIndex = subroutineIndexes[0] ?? 0;
      const label =
        subroutineIndexes.length === 1
          ? `Pile Driver: Subroutine ${firstIndex + 1} brechen`
          : `Pile Driver: ${subroutineIndexes.length} Subroutinen brechen`;
      actions.push(
        action(
          state,
          "runner",
          "break_subroutine",
          label,
          breakerId,
          [{ credits: totalBreakCost }],
          {
            breakerId,
            iceId: encounteredIceId,
            subroutineIndexes: subroutineIndexes.join(","),
            breakSubroutineCount: subroutineIndexes.length,
            pileDriverMultiBreak: true,
            targetIceDefinitionId: iceDefinition.id,
            breakSubroutineBaseCost: breakAbility.cost.credits,
            ...(additionalBreakCost > 0
              ? {
                  breakSubroutineAdditionalCost: additionalBreakCost,
                  breakSubroutineTotalCost: totalBreakCost,
                  ...(runBreakSubroutineAdditionalCost(run) > 0
                    ? { v1922CorpIceAbility: "virizz_break_cost_modifier" }
                    : {}),
                  ...(microtechTrodeSetBreakAdditionalCost(state) > 0
                    ? {
                        runnerHardwareAbility:
                          "microtech_trode_set_break_cost_modifier",
                      }
                    : {}),
                }
              : {}),
          },
          abilityMetadata(breakerId, breakAbility.id, encounteredIceId),
        ),
      );
    }
    if (selected.length >= maxCount) return;
    for (let index = start; index < eligibleIndexes.length; index += 1) {
      selected.push(eligibleIndexes[index]!);
      visit(index + 1);
      selected.pop();
    }
  };
  visit(0);
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

function dupreStrengthCounterBonus(
  state: GameState,
  breakerId: CardInstanceId,
): number {
  if (definitionFor(state, breakerId).id !== DUPRE_ID) return 0;
  const selectedServerId = mustInstance(state.cardInstances, breakerId)
    .selectedServerId;
  if (
    state.run &&
    selectedServerId &&
    selectedServerId !== state.run.attackedServerId
  )
    return 0;
  return cardCounter(state, breakerId, "power");
}

function pumpAmountForLegalAction(
  state: GameState,
  legalAction: LegalAction,
): number {
  const breakerId = String(legalAction.payload?.breakerId ?? "");
  const abilityId = legalAction.abilityRef?.abilityId;
  const definition = state.cardInstances[breakerId]
    ? definitionFor(state, breakerId)
    : undefined;
  const ability = definition?.abilities?.find(
    (candidate) =>
      candidate.type === "pump_strength" &&
      (!abilityId || candidate.id === abilityId),
  );
  const amount = ability?.amount ?? 1;
  return Number.isInteger(amount) ? amount : 1;
}

function breakAbilityMatchesSubroutine(
  ability: NonNullable<CardDefinition["abilities"]>[number],
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): boolean {
  const tags = ability.subroutineBreakTags ?? [];
  if (tags.length === 0) return true;
  if (tags.includes("trace") && subroutine.type === "initiate_trace") return true;
  const subroutineTags = subroutine.breakTags ?? [];
  return tags.some((tag) => subroutineTags.includes(tag));
}

function resolvePileDriverBreakSubroutinesAction(
  state: GameState,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const run = mustRun(state);
  const iceId = String(legalAction.payload?.iceId ?? "");
  if (run.phase !== "encounter_ice" || !run.encounteredIceId)
    throw new Error("Pile Driver kann nur im ICE-Encounter genutzt werden.");
  if (run.encounteredIceId !== iceId)
    throw new Error("Pile Driver zielt nicht auf das encountered ICE.");
  if (run.noBreakSubroutinesActive)
    throw new Error("Subroutinen koennen in diesem Encounter nicht gebrochen werden.");
  if (!state.runner.rig.programs.includes(breakerId))
    throw new Error("Pile Driver ist nicht installiert.");
  const breakerDefinition = definitionFor(state, breakerId);
  if (breakerDefinition.id !== PILE_DRIVER_ID)
    throw new Error("Die Breaker-Quelle ist nicht Pile Driver.");
  const iceDefinition = definitionFor(state, iceId);
  if (legalAction.payload?.targetIceDefinitionId !== iceDefinition.id)
    throw new Error("Pile Driver zielt auf die falsche ICE-Definition.");
  if (!cardHasSubtype(iceDefinition, "wall"))
    throw new Error("Pile Driver kann nur Wall-Subroutinen brechen.");
  const ability = breakerDefinition.abilities?.find(
    (candidate) =>
      candidate.id === legalAction.abilityRef?.abilityId &&
      candidate.type === "break_subroutine",
  );
  if (!ability || !breakAbilityMatchesIce(ability, iceDefinition))
    throw new Error("Pile Driver hat keine gueltige Break-Faehigkeit.");
  const breakerStrength =
    (breakerDefinition.strength ?? 0) +
    mustInstance(state.cardInstances, breakerId).strengthModifier +
    cardCounter(state, breakerId, "militech") +
    dupreStrengthCounterBonus(state, breakerId) +
    runRemainderStrengthBonusForBreaker(run, breakerId);
  if (breakerStrength < iceStrengthFor(state, iceId))
    throw new Error("Pile Driver ist nicht stark genug fuer dieses ICE.");
  const rawIndexes =
    typeof legalAction.payload?.subroutineIndexes === "string"
      ? legalAction.payload.subroutineIndexes
      : "";
  if (!rawIndexes) throw new Error("Pile Driver braucht Subroutine-Ziele.");
  const subroutineIndexes = rawIndexes.split(",").map((value) => Number(value));
  if (
    subroutineIndexes.length < 1 ||
    subroutineIndexes.length > Math.min(4, ability.count ?? 4) ||
    new Set(subroutineIndexes).size !== subroutineIndexes.length ||
    subroutineIndexes.some((index) => !Number.isInteger(index) || index < 0)
  ) {
    throw new Error("Pile Driver hat ungueltige Subroutine-Ziele.");
  }
  const subroutines = subroutinesForCurrentEncounter(state, iceDefinition);
  for (const subroutineIndex of subroutineIndexes) {
    const subroutine = subroutines[subroutineIndex];
    if (!subroutine)
      throw new Error("Pile Driver zielt auf eine fehlende Subroutine.");
    if (!breakAbilityMatchesSubroutine(ability, subroutine))
      throw new Error("Pile Driver kann diese Subroutine nicht brechen.");
    if (
      run.brokenSubroutineIndexes.includes(subroutineIndex) ||
      run.resolvedSubroutineIndexes.includes(subroutineIndex)
    ) {
      throw new Error("Pile Driver zielt auf eine bereits erledigte Subroutine.");
    }
  }
  const stealthLoss = ability.postBreakStealthLoss ?? 0;
  if (runnerStealthRecurringCredits(state) < stealthLoss)
    throw new Error("Nicht genug Stealth-Credits fuer Pile Driver.");
  const expectedCost =
    ability.cost.credits +
    runBreakSubroutineAdditionalCost(run) +
    microtechTrodeSetBreakAdditionalCost(state);
  if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
    throw new Error("Pile Driver-Kosten sind nicht mehr gueltig.");
  spendRunnerRunCredits(state, expectedCost, breakerId);
  executeEffectCommands(
    state,
    subroutineIndexes.map((subroutineIndex) => ({
      type: "break_subroutine",
      subroutineIndex,
    })),
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    breakSubroutineCount: subroutineIndexes.length,
    pileDriverMultiBreak: true,
    sourceDefinitionId: PILE_DRIVER_ID,
  };
  applyPostBreakStealthLoss(state, breakerId, legalAction);
}

function subroutinesForCurrentEncounter(
  state: GameState,
  iceDefinition: CardDefinition,
): NonNullable<CardDefinition["subroutines"]> {
  const run = state.run;
  const transmutationCopies = run?.encounteredIceId
    ? cardCounter(state, run.encounteredIceId, "mark")
    : 0;
  const subroutines = (iceDefinition.subroutines ?? []).flatMap((subroutine) => {
    const copies = [subroutine];
    for (let index = 0; index < transmutationCopies; index += 1) {
      copies.push({
        ...subroutine,
        id: `${subroutine.id}.v1920_ice_transmutation.${index + 1}`,
      });
    }
    return copies;
  });
  if (
    run?.encounteredIceId &&
    run.futureEncounterEndTheRunSourceIceId &&
    run.encounteredIceId !== run.futureEncounterEndTheRunSourceIceId
  ) {
    subroutines.push({
      id: "v1922_tutor_future_end_the_run",
      type: "end_the_run",
    });
  }
  return subroutines;
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
  const actions: LegalAction[] = [];
  actions.push(...startupImmolatorPostPassActions(state, run));
  actions.push(...mysteryBoxRunActions(state, run));
  const jackOutAdditionalCost = runJackOutAdditionalCost(run);
  if (availableRunnerRunCredits(state) >= jackOutAdditionalCost) {
    actions.push(
      action(
        state,
        "runner",
        "jack_out",
        jackOutAdditionalCost > 0
          ? `Jack-out (${jackOutAdditionalCost} Credit)`
          : "Jack-out",
        "game_rule",
        jackOutAdditionalCost > 0 ? [{ credits: jackOutAdditionalCost }] : [],
        jackOutAdditionalCost > 0
          ? {
              v1922CorpIceAbility: "viral_15_jack_out_tax",
              jackOutAdditionalCost,
              sourceDefinitionId: VIRAL_15_PROGRAM_TRASH_ICE_ID,
            }
          : undefined,
      ),
    );
  }
  actions.push(
    action(state, "runner", "continue_run", "Run fortsetzen", "game_rule"),
  );
  return actions;
}

function mysteryBoxRunActions(
  state: GameState,
  run: ActiveRun,
): LegalAction[] {
  const used = new Set(run.mysteryBoxUsedSourceIdsThisRun ?? []);
  if (state.runner.stack.length === 0) return [];
  return state.runner.rig.programs
    .slice()
    .sort()
    .filter((cardId) => !used.has(cardId))
    .filter((cardId) => definitionFor(state, cardId).id === MYSTERY_BOX_ID)
    .map((sourceCardId) => {
      const topCards = state.runner.stack.slice(0, 5);
      const programCount = topCards.filter(
        (cardId) => definitionFor(state, cardId).type === "program",
      ).length;
      return action(
        state,
        "runner",
        "trigger_ability",
        `${definitionFor(state, sourceCardId).title}: Stack-Spitze pruefen`,
        sourceCardId,
        [],
        {
          cardId: sourceCardId,
          v1915RunnerProgramAbility: "mystery_box_top5_program_install",
          revealCount: topCards.length,
          revealedCardDefinitionIds: topCards
            .map((cardId) => definitionFor(state, cardId).id)
            .join(","),
          revealedProgramCount: programCount,
          hiddenZoneBarrier: true,
          hiddenZoneAction: "mystery_box_stack_top5_reveal",
        },
      );
    });
}

function startupImmolatorPostPassActions(
  state: GameState,
  run: ActiveRun,
): LegalAction[] {
  const targetIceId = run.startupImmolatorPendingPassedIceId;
  if (!targetIceId || !state.cardInstances[targetIceId]) return [];
  if (!rezzedInstalledIceIds(state).includes(targetIceId)) return [];
  if (!run.fullyBrokenIceIds?.includes(targetIceId)) return [];
  const used = new Set(
    ensureRunnerTurnFlags(state).startupImmolatorUsedSourceIdsThisTurn ?? [],
  );
  const rezCost = rezCostForCard(state, targetIceId);
  if (state.runner.credits < rezCost) return [];
  const targetDefinition = definitionFor(state, targetIceId);
  return state.runner.rig.programs
    .filter((cardId) => definitionFor(state, cardId).id === STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID)
    .filter((cardId) => !used.has(cardId))
    .sort()
    .map((sourceCardId) =>
      action(
        state,
        "runner",
        "trigger_ability",
        `${definitionFor(state, sourceCardId).title}: ICE trashen`,
        sourceCardId,
        rezCost > 0 ? [{ credits: rezCost }] : [],
        {
          cardId: sourceCardId,
          targetIceId,
          targetIceDefinitionId: targetDefinition.id,
          v1922RunnerProgramAbility: "startup_immolator_trash_ice",
          rezCostPaid: rezCost,
        },
      ),
    );
}

function runJackOutAdditionalCost(run: ActiveRun): number {
  return run.viral15ActiveSourceIceId ? 1 : 0;
}

function runStartTaxForServerUpgrades(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
  const server = mustServer(state, serverId);
  const sourceDefinitionIds = server.root
    .filter((cardId) => mustInstance(state.cardInstances, cardId).rezzed)
    .map((cardId) => definitionFor(state, cardId).id)
    .filter((definitionId) => RUN_TAX_UPGRADE_CARD_IDS.has(definitionId));
  return {
    amount: sourceDefinitionIds.length,
    sourceDefinitionIds,
  };
}

function newsgroupTauntingRunStartTax(
  state: GameState,
): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
  const sourceDefinitionIds = rezzedCorpRootCardIds(state)
    .map((cardId) => definitionFor(state, cardId).id)
    .filter(
      (definitionId) =>
        definitionId === NEWSGROUP_TAUNTING_TAG_HANDSIZE_ASSET_ID,
    );
  return {
    amount: sourceDefinitionIds.length,
    sourceDefinitionIds,
  };
}

function availableRunnerRunStartCredits(state: GameState): number {
  return state.runner.credits + runnerRunRecurringCredits(state);
}

function successfulRunProgramActions(
  state: GameState,
  run: ActiveRun,
): LegalAction[] {
  if (!run.successful || run.phase !== "access") return [];
  const used = new Set(run.successfulRunAbilityUsedSourceIds ?? []);
  const actions: LegalAction[] = [];
  for (const sourceCardId of state.runner.rig.programs.slice().sort()) {
    if (used.has(sourceCardId)) continue;
    const definition = definitionFor(state, sourceCardId);
    if (definition.id === FALSE_ECHO_FORCE_REZ_PROGRAM_ID) {
      const server = mustServer(state, run.attackedServerId);
      const unrezzedCount = server.ice.filter(
        (iceId) => !mustInstance(state.cardInstances, iceId).rezzed,
      ).length;
      if (unrezzedCount <= 0) continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${definition.title}: ICE rezzen lassen`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            v1922RunnerProgramAbility: "false_echo_force_rez",
            unrezzedIceCount: unrezzedCount,
          },
        ),
      );
    }
    if (definition.id === NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID) {
      const server = mustServer(state, run.attackedServerId);
      if (server.kind === "archives" || server.ice.length <= 1) continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${definition.title}: ICE-Reihenfolge umkehren`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            v1922RunnerProgramAbility: "netspace_inverter_reverse_ice",
            iceCount: server.ice.length,
          },
        ),
      );
    }
    if (definition.id === FAIT_ACCOMPLI_COUNTER_PROGRAM_ID) {
      const server = mustServer(state, run.attackedServerId);
      if (server.kind !== "remote") continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${definition.title}: Fort mit Power-Counter markieren`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            v1919RunnerProgramAbility: "fait_accompli_successful_run_counter",
            counterType: "power",
            addCounterAmount: 1,
          },
        ),
      );
    }
  }
  return actions;
}

function runnerAccessActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  const successfulRunActions = successfulRunProgramActions(state, run);
  if (successfulRunActions.length > 0) return successfulRunActions;
  if (!run.accessedCardId) {
    const mysteryBoxActions = mysteryBoxRunActions(state, run);
    if (hasPendingAccessCandidate(state, run))
      return [
        ...mysteryBoxActions,
        action(state, "runner", "access_card", "Karte accessen", "game_rule"),
      ];
    if (mysteryBoxActions.length > 0) return mysteryBoxActions;
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
  const accessedFromArchives = isCurrentAccessFromArchives(state, run);
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
  if (accessedFromArchives) {
    return [action(state, "runner", "decline_trash", run.breach ? "Weiter accessen" : "Zugriff abschließen", "game_rule")];
  }
  if (definition.type === "asset" || definition.type === "upgrade") {
    const actions: LegalAction[] = [];
    const trashCost = effectiveAccessTrashCost(state, run.accessedCardId);
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
    } else if (
      availableRunnerAccessTrashCredits(state, run.accessedCardId) >=
      trashCost.totalCost
    ) {
      const scatterShotRecurringCreditsAvailable =
        scatterShotRecurringCreditSourceIds(state, run.accessedCardId).reduce(
          (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
          0,
        );
      const poltergeistRecurringCreditsAvailable =
        poltergeistRecurringCreditSourceIds(state, run.accessedCardId).reduce(
          (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
          0,
        );
      actions.push(
        action(
          state,
          "runner",
          "trash_accessed_card",
          `${definition.title} trashen`,
          run.accessedCardId,
          [{ credits: trashCost.totalCost }],
          {
            accessTrashBaseCost: trashCost.baseCost,
            accessTrashCostModifier: trashCost.modifier,
            accessTrashTotalCost: trashCost.totalCost,
            ...(scatterShotRecurringCreditsAvailable > 0 &&
            definition.type === "upgrade"
              ? {
                  v1922RunnerProgramAbility:
                    "scatter_shot_upgrade_trash_recurring_credit",
                  scatterShotRecurringCreditsAvailable,
                }
              : {}),
            ...(poltergeistRecurringCreditsAvailable > 0 &&
            definition.type === "asset"
              ? {
                  v1922RunnerProgramAbility:
                    "poltergeist_node_trash_recurring_credit",
                  poltergeistRecurringCreditsAvailable,
                }
              : {}),
          },
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
  return (
    rezzedRootCardIdOnServer(
      state,
      serverId,
      RED_HERRINGS_STEAL_TAX_UPGRADE_ID,
    ) ??
    run.redHerringsTaxSourceByServer?.[serverId]
  );
}

function oliviaSalazarCardIdForCurrentAccess(
  state: GameState,
  run: ActiveRun,
): CardInstanceId | undefined {
  const serverId =
    run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
  return rezzedRootCardIdOnServer(
    state,
    serverId,
    OLIVIA_SALAZAR_STEAL_COST_UPGRADE_ID,
  );
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

function isCurrentAccessFromArchives(
  state: GameState,
  run: ActiveRun,
): boolean {
  const cardId = run.accessedCardId;
  if (!cardId) return false;
  const currentEntry = run.breach?.queue[run.breach.currentIndex];
  if (currentEntry?.cardInstanceId === cardId)
    return currentEntry.zone === "archives";
  const zone = mustInstance(state.cardInstances, cardId).zone;
  return zone.side === "corp" && zone.zone === "archives";
}

function effectiveAccessTrashCost(
  state: GameState,
  cardId: CardInstanceId,
): { baseCost: number; modifier: number; totalCost: number } {
  const definition = definitionFor(state, cardId);
  const baseCost = definition.trashCost ?? 0;
  let modifier = 0;
  const zone = mustInstance(state.cardInstances, cardId).zone;
  if (
    zone.side === "corp" &&
    zone.zone === "serverRoot" &&
    (definition.type === "asset" || definition.type === "upgrade") &&
    definition.id !== NEW_GALVESTON_TRASH_COST_UPGRADE_ID
  ) {
    const server = mustServer(state, zone.serverId);
    const hasRezzedNewGalveston = server.root.some((rootId) => {
      if (rootId === cardId) return false;
      const rootInstance = state.cardInstances[rootId];
      return (
        rootInstance?.rezzed === true &&
        definitionFor(state, rootId).id ===
        NEW_GALVESTON_TRASH_COST_UPGRADE_ID
      );
    });
    if (hasRezzedNewGalveston) modifier += 2;
  }
  return { baseCost, modifier, totalCost: baseCost + modifier };
}

function scatterShotRecurringCreditSourceIds(
  state: GameState,
  accessedCardId: CardInstanceId,
): CardInstanceId[] {
  const accessedDefinition = definitionFor(state, accessedCardId);
  if (accessedDefinition.type !== "upgrade") return [];
  return state.runner.rig.programs.filter(
    (cardId) =>
      definitionFor(state, cardId).id === SCATTER_SHOT_UPGRADE_TRASH_PROGRAM_ID &&
      cardCounter(state, cardId, "recurring_credit") > 0,
  );
}

function poltergeistRecurringCreditSourceIds(
  state: GameState,
  accessedCardId: CardInstanceId,
): CardInstanceId[] {
  const accessedDefinition = definitionFor(state, accessedCardId);
  if (accessedDefinition.type !== "asset") return [];
  return state.runner.rig.programs.filter(
    (cardId) =>
      definitionFor(state, cardId).id === POLTERGEIST_ID &&
      cardCounter(state, cardId, "recurring_credit") > 0,
  );
}

function runnerAccessTrashRecurringCreditSourceIds(
  state: GameState,
  accessedCardId: CardInstanceId,
): CardInstanceId[] {
  return [
    ...scatterShotRecurringCreditSourceIds(state, accessedCardId),
    ...poltergeistRecurringCreditSourceIds(state, accessedCardId),
  ].sort();
}

function runnerAccessTrashRecurringCredits(
  state: GameState,
  accessedCardId: CardInstanceId,
): number {
  return runnerAccessTrashRecurringCreditSourceIds(state, accessedCardId).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
    0,
  );
}

function availableRunnerAccessTrashCredits(
  state: GameState,
  accessedCardId: CardInstanceId,
): number {
  return (
    state.runner.credits +
    runnerAccessTrashRecurringCredits(state, accessedCardId)
  );
}

function spendRunnerAccessTrashCredits(
  state: GameState,
  amount: number,
  accessedCardId: CardInstanceId,
): { recurringSpent: number; runnerCreditsSpent: number } {
  if (amount <= 0) return { recurringSpent: 0, runnerCreditsSpent: 0 };
  if (availableRunnerAccessTrashCredits(state, accessedCardId) < amount)
    throw new Error("Der Runner kann die Trashkosten nicht bezahlen.");
  let remaining = amount;
  let recurringSpent = 0;
  for (const cardId of runnerAccessTrashRecurringCreditSourceIds(
    state,
    accessedCardId,
  )) {
    if (remaining <= 0) break;
    const available = cardCounter(state, cardId, "recurring_credit");
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendCardCounter(state, cardId, "recurring_credit", spent);
      recurringSpent += spent;
      remaining -= spent;
    }
  }
  spendCredits(state, "runner", remaining);
  return { recurringSpent, runnerCreditsSpent: remaining };
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
        if (
          definitionFor(state, sourceCardId).id !==
          COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID
        )
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
      if (legalAction.payload?.runnerAbility === "remove_crying_counter") {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf Crying-Counter entfernen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (sourceCardId !== state.runner.identity)
          throw new Error("Crying-Counter liegen auf dem Runner-Identitaetsstatus.");
        if (cardCounter(state, state.runner.identity, "crying") <= 0)
          throw new Error("Es ist kein Crying-Counter vorhanden.");
        const removeAmount = Number(legalAction.payload?.removeCounterAmount ?? 0);
        if (!Number.isInteger(removeAmount) || removeAmount !== 1)
          throw new Error("Es wird genau 1 Crying-Counter entfernt.");
        spendCredits(state, "runner", 4);
        spendCardCounter(state, state.runner.identity, "crying", removeAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removedCounterAmount: removeAmount,
          remainingCounters: cardCounter(state, state.runner.identity, "crying"),
          runnerCreditsAfter: state.runner.credits,
        };
        return;
      }
      if (legalAction.payload?.runnerAbility === "remove_cerberus_counter") {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf Cerberus-Counter entfernen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (sourceCardId !== state.runner.identity)
          throw new Error(
            "Cerberus-Counter liegen auf dem Runner-Identitaetsstatus.",
          );
        if (cardCounter(state, state.runner.identity, "cerberus") <= 0)
          throw new Error("Es ist kein Cerberus-Counter vorhanden.");
        const removeAmount = Number(
          legalAction.payload?.removeCounterAmount ?? 0,
        );
        if (!Number.isInteger(removeAmount) || removeAmount !== 1)
          throw new Error("Es wird genau 1 Cerberus-Counter entfernt.");
        spendCredits(state, "runner", 4);
        spendCardCounter(
          state,
          state.runner.identity,
          "cerberus",
          removeAmount,
        );
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removedCounterAmount: removeAmount,
          remainingCounters: cardCounter(
            state,
            state.runner.identity,
            "cerberus",
          ),
          runnerCreditsAfter: state.runner.credits,
        };
        return;
      }
      if (legalAction.payload?.v1917AssetAbility === "spinn_load_pool") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Spinn Public Relations laden.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error("Spinn Public Relations ist nicht rezzed installiert.");
        if (
          definitionFor(state, sourceCardId).id !==
          SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID
        )
          throw new Error("Die Spinn-Faehigkeit passt nicht zur Karte.");
        const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
        if (!Number.isInteger(addAmount) || addAmount !== 6)
          throw new Error("Spinn Public Relations legt genau 6 Bits aus der Bank auf die Karte.");
        const before = cardCounter(state, sourceCardId, "bit");
        addCardCounter(state, sourceCardId, "bit", addAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          spinnPublicRelationsPoolBefore: before,
          spinnPublicRelationsPoolAfter: cardCounter(state, sourceCardId, "bit"),
          addedCounterAmount: addAmount,
          remainingCounters: cardCounter(state, sourceCardId, "bit"),
          gainedCredits: 0,
          corpCreditsAfter: state.corp.credits,
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
        if (
          !CORP_ECONOMY_ASSET_CARD_IDS.has(definition.id) ||
          definition.id === SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID
        )
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
        if (!TRACE_ASSET_CARD_IDS.has(definition.id))
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
      if (
        legalAction.payload?.v1917AssetAbility ===
        "rescheduler_hq_shuffle_draw"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Rescheduler nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error("Rescheduler ist nicht rezzed installiert.");
        if (definitionFor(state, sourceCardId).id !== CORP_HQ_SHUFFLE_DRAW_CARD_ID)
          throw new Error("Die Rescheduler-Faehigkeit passt nicht zur Karte.");
        resolveReschedulerHqShuffleDraw(state, sourceCardId, legalAction);
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
        if (!HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS.has(definition.id))
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
        if (!HIDDEN_ZONE_REORDER_ASSET_CARD_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.17-Hidden-Zone-Reorder-Faehigkeit passt nicht zur Karte.",
          );
        startCorpAssetRdTopReorderChoice(state, sourceCardId, legalAction);
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
        if (definition.id !== SOLO_SQUAD_DAMAGE_ASSET_CARD_ID)
          throw new Error(
            "Die V1.9.17-Damage-Faehigkeit passt nicht zur Karte.",
          );
        const damageAmount = Number(legalAction.payload?.damageAmount ?? 0);
        if (!Number.isInteger(damageAmount) || damageAmount !== 1)
          throw new Error(
            "Solo Squad nutzt in diesem V1.9.17-WIP genau 1 Meat Damage.",
          );
        requireRunnerTagged(state);
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
        if (definition.id !== COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID)
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
        if (definition.id !== DISINFECTANT_VIRUS_COUNTER_ASSET_ID)
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
        if (!COUNTER_UPGRADE_CARD_IDS.has(definition.id))
          throw new Error(
            "Die V1.9.18-Counter-Faehigkeit passt nicht zur Karte.",
          );
        const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
        if (!Number.isInteger(addAmount) || addAmount !== 1)
          throw new Error(
            "V1.9.18-Counter-Upgrades laden in diesem WIP genau 1 Power-Counter.",
          );
        addCardCounter(state, sourceCardId, "power", addAmount);
        const serverLabel = publicServerLabelForCard(state, sourceCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          sourceDefinitionId: definition.id,
          ...(serverLabel ? { serverLabel } : {}),
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
          NEW_GALVESTON_TRASH_COST_UPGRADE_ID
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
        if (definition.id !== PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID)
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
        if (!TAG_CONDITION_UPGRADE_CARD_IDS.has(definition.id))
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
        if (!COUNTER_ASSET_CARD_IDS.has(definition.id))
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
          sourceDefinitionId: definition.id,
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
        if (
          definition.id !==
          INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID
        )
          throw new Error(
            "Die V1.9.19-Asset-Economy-Faehigkeit passt nicht zur Karte.",
          );
        const advancementCounterCount = Math.max(
          0,
          Math.floor(mustInstance(state.cardInstances, sourceCardId).advancementCounters),
        );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        const expectedGain = advancementCounterCount * 4;
        if (!Number.isInteger(gainAmount) || gainAmount !== expectedGain)
          throw new Error(
            "Information Laundering gewaehrt 4 Credits pro Advancement-Counter.",
          );
        credits(state, "corp", gainAmount);
        trashCorpInstalledCardToArchives(state, sourceCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          advancementCounterCount,
          gainedCredits: gainAmount,
          selfTrashed: true,
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
        if (!ACTION_ASSET_CARD_IDS.has(definition.id))
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
        legalAction.payload?.v1920AssetAbility ===
        "south_african_mining_corp_gain_8_trash"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf South African Mining Corp nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "South African Mining Corp ist nicht rezzed installiert.",
          );
        if (
          definitionFor(state, sourceCardId).id !==
          SOUTH_AFRICAN_MINING_CORP_ACTION_ASSET_ID
        )
          throw new Error(
            "Die South-African-Mining-Corp-Faehigkeit passt nicht zur Karte.",
          );
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
        if (!Number.isInteger(gainAmount) || gainAmount !== 8)
          throw new Error("South African Mining Corp gewaehrt genau 8 Credits.");
        credits(state, "corp", gainAmount);
        trashCorpInstalledCardToArchives(state, sourceCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: gainAmount,
          selfTrashed: true,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (
        legalAction.payload?.v1920AssetAbility ===
        "i_got_a_rock_tagged_meat_damage"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf I Got a Rock nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error("I Got a Rock ist nicht rezzed installiert.");
        if (
          definitionFor(state, sourceCardId).id !==
          I_GOT_A_ROCK_BAD_PUBLICITY_ASSET_ID
        )
          throw new Error("Die I-Got-a-Rock-Faehigkeit passt nicht zur Karte.");
        if (state.runner.tags < 2)
          throw new Error("I Got a Rock verlangt mindestens zwei Runner-Tags.");
        resolveIGotARockDamage(state, sourceCardId, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1921AssetAbility === "deterministic_die_probe"
      ) {
        throw new Error("Schlaghund nutzt keine Wuerfelprobe mehr.");
      }
      if (
        legalAction.payload?.v1921AssetAbility === "schlaghund_tag_damage"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.21-Asset-Zufall nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.21-Asset-Zufallsfaehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (definition.id !== SCHLAGHUND_RANDOM_ASSET_CARD_ID)
          throw new Error(
            "Die V1.9.21-Asset-Zufallsfaehigkeit passt nicht zur Karte.",
          );
        const randomPurpose = `v1921.die.${definition.id}.tag_damage`;
        const dieRoll = rollDeterministicDie(state, randomPurpose);
        const runnerTags = state.runner.tags;
        const tagThresholdMet = runnerTags >= dieRoll;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          randomPurpose,
          v1921DieRoll: dieRoll,
          runnerTags,
          tagThresholdMet,
          randomCounterAfter: state.randomCounter,
        };
        if (!tagThresholdMet) return;
        resolveDamageOperation(
          state,
          legalAction,
          "meat",
          10,
          SCHLAGHUND_RANDOM_ASSET_CARD_ID,
        );
        if (!state.pendingChoice) {
          trashCorpInstalledCardToArchives(state, sourceCardId);
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            selfTrashed: true,
          };
        }
        return;
      }
      if (
        legalAction.payload?.v1921UpgradeAbility ===
        "deterministic_server_die_probe"
      ) {
        throw new Error("Rio de Janeiro City Grid nutzt automatische Trigger.");
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
        if (!RUNNER_RANDOM_PROGRAM_CARD_IDS.has(definition.id))
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
        if (definition.id !== NEWSGROUP_FILTER_CREDIT_PROGRAM_ID)
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
        if (definition.id !== QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID)
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
        if (definition.id !== FAIT_ACCOMPLI_COUNTER_PROGRAM_ID)
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
        if (definitionFor(state, sourceCardId).id !== "onr_v1_179_silicon-saloon-franchise")
          throw new Error("Die Silicon-Saloon-Faehigkeit passt nicht zur Karte.");
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
        const expectedRemoveAmount = 3;
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
        const expectedGainAmount = 3;
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
        if (definition.id !== POLITICAL_OVERTHROW_AP_COUNTER_AGENDA_ID)
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
        if (definition.id !== MARINE_ARCOLOGY_REPLACE_COUNTERS_AGENDA_ID)
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
        if (definition.id !== CORPORATE_RETREAT_INSTALL_CREDIT_AGENDA_ID)
          throw new Error(
            "Die Agenda-Aktion passt nicht zu Corporate Retreat.",
          );
        if (!isCorporateRetreatInstallCreditAbilityAvailable(state, sourceCardId))
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
        if (!SCORED_REVEAL_AGENDA_CARD_IDS.has(definition.id))
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
      if (
        legalAction.payload?.v1920RunnerRunLockAbility ===
        "fang_2_0_pay_to_run"
      ) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf die Fang-2.0-Sperre entfernen.");
        const cost = Number(legalAction.payload?.fangRunLockCreditCost ?? 0);
        if (!Number.isInteger(cost) || cost !== 2)
          throw new Error("Fang 2.0 verlangt genau 2 Credits.");
        spendCredits(state, "runner", cost);
        ensureRunnerTurnFlags(state).fangRunLockCreditCost = 0;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          fangRunLockCleared: true,
          runnerCreditsAfter: state.runner.credits,
          gainedCredits: 0,
        };
        return;
      }
      credits(state, legalAction.side, 1);
      if (legalAction.payload?.drawCardAfter === true) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf mit diesem Effekt ziehen.");
        applyRunnerDrawSummaryPayload(
          state,
          legalAction,
          drawRunnerCard(state),
        );
      }
      if (legalAction.payload?.resourceAbility === "silicon_saloon_franchise") {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gainedCredits: 1,
          runnerCreditsAfter: state.runner.credits,
        };
      }
      return;
    case "draw_card":
      spendClick(state, legalAction.side);
      if (legalAction.side === "runner") {
        applyRunnerDrawSummaryPayload(
          state,
          legalAction,
          drawRunnerCard(state),
        );
      } else {
        drawCorpCard(state);
      }
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
      {
        const advancedCardId = String(legalAction.payload?.cardId);
        mustInstance(state.cardInstances, advancedCardId).advancementCounters += 1;
        const zone = mustInstance(state.cardInstances, advancedCardId).zone;
        if (zone.side === "corp" && zone.zone === "serverRoot")
          markRovingSubmarineActivityForServer(state, zone.serverId, legalAction);
      }
      return;
    case "score_agenda":
      scoreAgenda(state, String(legalAction.payload?.cardId), legalAction);
      return;
    case "start_run":
      validateRovingSubmarineRunGate(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
      );
      if (legalAction.payload?.bonusRunNoClick === true) {
        ensureRunnerTurnFlags(state).allNighterBonusRunPending = false;
        ensureRunnerTurnFlags(state).bodyweightDataCrecheExtraRunPending = false;
      } else {
        spendClick(state, "runner");
      }
      startRun(
        state,
        String(legalAction.payload?.serverId) as Exclude<
          ServerId,
          "new_remote"
        >,
        undefined,
        1,
        undefined,
        legalAction,
      );
      if (typeof legalAction.payload?.runStartTaxCredits === "number") {
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
      {
        const jackOutAdditionalCost = legalAction.costs.reduce(
          (sum, cost) => sum + (cost.credits ?? 0),
          0,
        );
        if (jackOutAdditionalCost > 0) {
          spendRunnerRunCredits(state, jackOutAdditionalCost);
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            jackOutAdditionalCost,
            runnerCreditsAfter: state.runner.credits,
          };
        }
      }
      finishRun(state, false);
      return;
    case "rez_ice":
      rezCard(
        state,
        String(legalAction.payload?.cardId),
        legalAction.payload?.rootRez === true ||
          legalAction.payload?.assetRez === true,
        legalAction,
      );
      expireCorporateRetreatInstallCreditAbilities(state);
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
          definitionFor(state, breakerId).id === JAPANESE_WATER_TORTURE_BREAKER_ID
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
            amount: pumpAmountForLegalAction(state, legalAction),
          },
        ]);
      }
      return;
    case "break_subroutine": {
      const breakerId =
        typeof legalAction.payload?.breakerId === "string"
          ? (String(legalAction.payload.breakerId) as CardInstanceId)
          : undefined;
      if (
        breakerId &&
        definitionFor(state, breakerId).id === PILE_DRIVER_ID &&
        typeof legalAction.payload?.subroutineIndexes === "string"
      ) {
        resolvePileDriverBreakSubroutinesAction(state, breakerId, legalAction);
        recordBartmossEncounterUsage(state, breakerId);
        recordDupreBreakUsage(state, breakerId);
        return;
      }
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
        recordDupreBreakUsage(state, breakerId);
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
      stealAgenda(state, mustRun(state).accessedCardId ?? "", legalAction);
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
      declineCurrentAccess(state, legalAction);
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
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removedTags: requested,
          runnerTagsAfter: state.runner.tags,
        };
        return;
      }
      spendRunnerTagRemovalCredits(state, 2, legalAction);
      state.runner.tags = Math.max(0, state.runner.tags - 1);
      return;
    case "purge_virus_counters": {
      spendClicks(state, "corp", 3);
      if (startCodeViralCachePurgeChoice(state, legalAction)) return;
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
      endTurn(state, legalAction.side, legalAction);
      return;
    case "trigger_ability":
      if (
        legalAction.payload?.v1911HiddenZoneAbility ===
        "self_modifying_code_install_program"
      ) {
        resolveSelfModifyingCodeAbility(state, legalAction);
        return;
      }
      if (legalAction.payload?.corpAbility === "trash_code_viral_cache") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Code Viral Cache trashen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!state.runner.rig.resources.includes(sourceCardId))
          throw new Error("Code Viral Cache ist nicht installiert.");
        if (definitionFor(state, sourceCardId).id !== CODE_VIRAL_CACHE_ID)
          throw new Error("Die Code-Viral-Cache-Faehigkeit passt nicht zur Karte.");
        spendClick(state, "corp");
        spendCredits(state, "corp", 5);
        trashRunnerInstalledCardToHeap(state, sourceCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          trashedCardDefinitionId: CODE_VIRAL_CACHE_ID,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (legalAction.payload?.v1922RunnerProgramAbility === "false_echo_force_rez") {
        resolveFalseEchoForceRez(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1922RunnerProgramAbility ===
        "netspace_inverter_reverse_ice"
      ) {
        resolveNetspaceInverterReverseIce(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1919RunnerProgramAbility ===
        "fait_accompli_successful_run_counter"
      ) {
        resolveFaitAccompliSuccessfulRunCounter(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1922RunnerProgramAbility ===
        "startup_immolator_trash_ice"
      ) {
        resolveStartupImmolatorTrashIce(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1915RunnerProgramAbility ===
        "mystery_box_top5_program_install"
      ) {
        resolveMysteryBoxTop5ProgramInstall(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1922RunnerHardwareAbility ===
        "microtech_backup_drive_return_top_hosted"
      ) {
        resolveMicrotechBackupDriveReturnTopHosted(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.resourceAbility ===
        "short_term_contract_take_credits"
      ) {
        resolveShortTermContractAbility(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.resourceAbility === "broker_load_credits" ||
        legalAction.payload?.resourceAbility === "broker_take_credits"
      ) {
        resolveBrokerAbility(state, legalAction);
        return;
      }
      if (legalAction.payload?.runnerAbility === "remove_data_raven_counter") {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf Data-Raven-Counter entfernen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedInstalledIceIds(state).includes(sourceCardId))
          throw new Error("Data Raven ist nicht mehr rezzed installiert.");
        if (definitionFor(state, sourceCardId).id !== DATA_RAVEN_ID)
          throw new Error("Die Counter-Entfernung passt nicht zur Karte.");
        const removeAmount = Number(
          legalAction.payload?.removeCounterAmount ?? 0,
        );
        if (!Number.isInteger(removeAmount) || removeAmount !== 1)
          throw new Error("Es wird genau 1 Data-Raven-Counter entfernt.");
        spendClick(state, "runner");
        spendCredits(state, "runner", 1);
        spendCardCounter(state, sourceCardId, "power", removeAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removedCounterAmount: removeAmount,
          remainingCounters: cardCounter(state, sourceCardId, "power"),
          runnerCreditsAfter: state.runner.credits,
        };
        return;
      }
      if (
        legalAction.payload?.v1920RunnerRunLockAbility ===
        "fang_2_0_pay_to_run"
      ) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf die Fang-2.0-Sperre entfernen.");
        spendClick(state, "runner");
        const cost = Number(legalAction.payload?.fangRunLockCreditCost ?? 0);
        if (!Number.isInteger(cost) || cost !== 2)
          throw new Error("Fang 2.0 verlangt genau 2 Credits.");
        spendCredits(state, "runner", cost);
        ensureRunnerTurnFlags(state).fangRunLockCreditCost = 0;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          fangRunLockCleared: true,
          runnerCreditsAfter: state.runner.credits,
        };
        return;
      }
      if (
        legalAction.payload?.acmeSavingsAndLoanAbility ===
        "remove_obligation"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf ACME Savings and Loan abloesen.");
        const obligationsBefore = acmeSavingsAndLoanObligationCount(state);
        if (obligationsBefore <= 0)
          throw new Error(
            "Es gibt keine aktive ACME-Savings-and-Loan-Verpflichtung.",
          );
        const creditCost = Number(
          legalAction.payload?.acmeSavingsAndLoanCreditCost ?? 0,
        );
        if (!Number.isInteger(creditCost) || creditCost !== 12)
          throw new Error("ACME Savings and Loan verlangt genau 12 Credits.");
        const scorePoints = Number(
          legalAction.payload?.acmeSavingsAndLoanScoreAgendaPoints ?? 0,
        );
        if (!Number.isInteger(scorePoints) || scorePoints !== 1)
          throw new Error(
            "ACME Savings and Loan scored genau 1 Agenda-Punkt.",
          );
        spendClick(state, "corp");
        spendCredits(state, "corp", creditCost);
        removeAcmeSavingsAndLoanObligation(state);
        state.corpBonusAgendaPoints =
          Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)) +
          scorePoints;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          acmeSavingsAndLoanObligationsBefore: obligationsBefore,
          acmeSavingsAndLoanObligationsAfter:
            acmeSavingsAndLoanObligationCount(state),
          acmeSavingsAndLoanPaymentPaid: creditCost,
          gainedAgendaPoints: scorePoints,
          corpBonusAgendaPointsAfter: state.corpBonusAgendaPoints,
          corpCreditsAfter: state.corp.credits,
        };
        return;
      }
      if (legalAction.payload?.approachIceExposeDecision) {
        resolveApproachIceExposeAbility(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1918UpgradeAbility ===
        "singapore_city_grid_hq_ice_swap"
      ) {
        startSingaporeCityGridSwapChoice(state, legalAction);
        return;
      }
      throw new Error(
        "Generische Abilities sind vorbereitet, aber in V0.93 nicht sichtbar freigeschaltet.",
      );
  }
}

function resolveBrokerAbility(state: GameState, legalAction: LegalAction): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Broker nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Broker ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== BROKER_ID)
    throw new Error("Die Broker-Faehigkeit passt nicht zur Karte.");
  if (runnerUsedBrokerThisTurn(state, sourceCardId))
    throw new Error("Dieser Broker wurde in diesem Zug bereits genutzt.");

  spendClick(state, "runner");
  if (legalAction.payload?.resourceAbility === "broker_load_credits") {
    const addAmount = Number(legalAction.payload?.addCounterAmount ?? 0);
    if (!Number.isInteger(addAmount) || addAmount !== 3)
      throw new Error("Broker legt genau 3 Credits aus der Bank auf Broker.");
    addCardCounter(state, sourceCardId, "power", addAmount);
    markBrokerUsedThisTurn(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      addedCounterAmount: addAmount,
      remainingCounters: cardCounter(state, sourceCardId, "power"),
      gainedCredits: 0,
      runnerCreditsAfter: state.runner.credits,
    };
    return;
  }

  const storedCredits = cardCounter(state, sourceCardId, "power");
  if (storedCredits <= 0)
    throw new Error("Auf Broker liegen keine Credits.");
  const removeAmount = Number(
    legalAction.payload?.removePowerCounterAmount ?? 0,
  );
  const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
  if (
    !Number.isInteger(removeAmount) ||
    removeAmount !== storedCredits ||
    !Number.isInteger(gainAmount) ||
    gainAmount !== storedCredits
  )
    throw new Error("Broker nimmt immer alle gespeicherten Credits.");
  spendCardCounter(state, sourceCardId, "power", removeAmount);
  credits(state, "runner", gainAmount);
  markBrokerUsedThisTurn(state, sourceCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    removedCounterAmount: removeAmount,
    gainedCredits: gainAmount,
    remainingCounters: cardCounter(state, sourceCardId, "power"),
    runnerCreditsAfter: state.runner.credits,
  };
}

function resolveFalseEchoForceRez(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf False Echo nutzen.");
  const run = mustRun(state);
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (
    !run.successful ||
    run.phase !== "access" ||
    serverId !== run.attackedServerId
  )
    throw new Error("False Echo ist nur direkt nach erfolgreichem Run legal.");
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("False Echo ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== FALSE_ECHO_FORCE_REZ_PROGRAM_ID)
    throw new Error("Die False-Echo-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("False Echo wurde fuer diesen Run bereits genutzt.");
  const server = mustServer(state, serverId);
  const checkedIceIds = server.ice.slice();
  let rezzedCount = 0;
  let rezCostPaid = 0;
  for (const iceId of checkedIceIds) {
    const instance = mustInstance(state.cardInstances, iceId);
    if (instance.rezzed) continue;
    const cost = rezCostForCard(state, iceId);
    if (state.corp.credits < cost) continue;
    spendCredits(state, "corp", cost);
    state.cardInstances[iceId] = {
      ...instance,
      rezzed: true,
      faceup: true,
    };
    rezzedCount += 1;
    rezCostPaid += cost;
  }
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: FALSE_ECHO_FORCE_REZ_PROGRAM_ID,
    serverLabel: publicServerLabel(state, server.id) ?? server.id,
    checkedIceCount: checkedIceIds.length,
    rezzedIceCount: rezzedCount,
    rezCostPaid,
    corpCreditsAfter: state.corp.credits,
  };
}

function resolveNetspaceInverterReverseIce(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Netspace Inverter nutzen.");
  const run = mustRun(state);
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (
    !run.successful ||
    run.phase !== "access" ||
    serverId !== run.attackedServerId
  )
    throw new Error(
      "Netspace Inverter ist nur direkt nach erfolgreichem Run legal.",
    );
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Netspace Inverter ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID)
    throw new Error("Die Netspace-Inverter-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Netspace Inverter wurde fuer diesen Run bereits genutzt.");
  const server = mustServer(state, serverId);
  if (server.kind === "archives" || server.ice.length <= 1)
    throw new Error("Dieses Fort kann nicht umgekehrt werden.");
  server.ice.reverse();
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID,
    serverLabel: publicServerLabel(state, server.id) ?? server.id,
    iceCount: server.ice.length,
    serverIceOrderReversed: true,
  };
}

function resolveFaitAccompliSuccessfulRunCounter(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Fait Accompli nutzen.");
  const run = mustRun(state);
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (
    !run.successful ||
    run.phase !== "access" ||
    serverId !== run.attackedServerId
  )
    throw new Error("Fait Accompli ist nur direkt nach erfolgreichem Run legal.");
  const server = mustServer(state, serverId);
  if (server.kind !== "remote")
    throw new Error("Fait Accompli markiert nur subsidiary data forts.");
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Fait Accompli ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== FAIT_ACCOMPLI_COUNTER_PROGRAM_ID)
    throw new Error("Die Fait-Accompli-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Fait Accompli wurde fuer diesen Run bereits genutzt.");
  addCardCounter(state, sourceCardId, "power", 1);
  state.faitAccompliCountersByServer ??= {};
  state.faitAccompliCountersByServer[serverId] =
    Math.max(0, Math.floor(state.faitAccompliCountersByServer[serverId] ?? 0)) +
    1;
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: FAIT_ACCOMPLI_COUNTER_PROGRAM_ID,
    serverLabel: publicServerLabel(state, server.id) ?? server.id,
    addedCounterAmount: 1,
    remainingCounters: cardCounter(state, sourceCardId, "power"),
    faitAccompliServerCounters:
      state.faitAccompliCountersByServer[serverId] ?? 0,
  };
}

function resolveStartupImmolatorTrashIce(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Startup Immolator nutzen.");
  const run = mustRun(state);
  if (run.phase !== "movement")
    throw new Error("Startup Immolator ist nur nach dem Passieren von ICE legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const targetIceId = String(legalAction.payload?.targetIceId ?? "");
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Startup Immolator ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID)
    throw new Error("Die Startup-Immolator-Faehigkeit passt nicht zur Karte.");
  const flags = ensureRunnerTurnFlags(state);
  const used = flags.startupImmolatorUsedSourceIdsThisTurn ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Startup Immolator wurde in diesem Zug bereits genutzt.");
  if (
    !targetIceId ||
    run.startupImmolatorPendingPassedIceId !== targetIceId ||
    !run.fullyBrokenIceIds?.includes(targetIceId) ||
    !rezzedInstalledIceIds(state).includes(targetIceId)
  )
    throw new Error("Das Startup-Immolator-Ziel ist nicht legal.");
  const rezCost = rezCostForCard(state, targetIceId);
  const paid = Number(legalAction.payload?.rezCostPaid ?? rezCost);
  if (!Number.isInteger(paid) || paid !== rezCost)
    throw new Error("Startup Immolator muss exakt die Rez-Kosten zahlen.");
  spendCredits(state, "runner", rezCost);
  const targetDefinitionId = definitionFor(state, targetIceId).id;
  trashCorpInstalledCardToArchives(state, targetIceId);
  flags.startupImmolatorUsedSourceIdsThisTurn = [...used, sourceCardId];
  const {
    startupImmolatorPendingPassedIceId: _startupPending,
    ...runWithoutStartupPending
  } = run;
  void _startupPending;
  if (state.run) state.run = runWithoutStartupPending;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerProgramAbility: "startup_immolator_trash_ice",
    sourceDefinitionId: STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID,
    targetIceDefinitionId: targetDefinitionId,
    rezCostPaid: rezCost,
    trashedCount: 1,
    trashedCardDefinitionId: targetDefinitionId,
    runnerCreditsAfter: state.runner.credits,
    startupImmolatorExhausted: true,
  };
}

function resolveMysteryBoxTop5ProgramInstall(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Mystery Box nutzen.");
  const run = mustRun(state);
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Mystery Box ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== MYSTERY_BOX_ID)
    throw new Error("Die Mystery-Box-Faehigkeit passt nicht zur Karte.");
  const used = run.mysteryBoxUsedSourceIdsThisRun ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Mystery Box wurde in diesem Run bereits genutzt.");
  const topCards = state.runner.stack.slice(0, 5);
  if (topCards.length === 0) throw new Error("Der Stack ist leer.");
  const programIds = topCards.filter(
    (cardId) => definitionFor(state, cardId).type === "program",
  );
  run.mysteryBoxUsedSourceIdsThisRun = [...used, sourceCardId].sort();
  if (programIds.length === 0) {
    state.runner.stack = shuffleStateIds(
      state,
      state.runner.stack,
      `v1915.mystery_box.shuffle.no_program.${sourceCardId}.${run.runId}`,
    );
    for (const cardId of state.runner.stack) {
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        zone: { side: "runner", zone: "stack" },
      };
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      programFound: false,
      installedProgramCount: 0,
      selfTrashed: false,
      randomCounterAfter: state.randomCounter,
    };
    return;
  }
  startMysteryBoxProgramChoice(state, sourceCardId, topCards, programIds);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    programFound: true,
    choiceVisibility: "public",
  };
}

function startMysteryBoxProgramChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  topCards: CardInstanceId[],
  programIds: CardInstanceId[],
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `v1915_mystery_box_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1915.mystery_box:${sourceCardId}:${topCards.join(",")}:${state.stateVersion + 1}`,
    prompt: "Mystery-Box-Programm installieren",
    kind: "select_cards",
    options: programIds.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
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

function resolveMysteryBoxChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1915.mystery_box"))
    throw new Error("Es ist keine Mystery-Box-Choice offen.");
  const sourceCardId = choice.source.split(":")[1] ?? "";
  if (!sourceCardId || !state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Mystery Box ist nicht mehr installiert.");
  if (definitionFor(state, sourceCardId).id !== MYSTERY_BOX_ID)
    throw new Error("Die Mystery-Box-Choice passt nicht zur Quelle.");
  const selectedId = selectedChoiceCardIds(choice, playerAction)[0];
  const currentTopCards = state.runner.stack.slice(0, 5);
  if (!selectedId || !currentTopCards.includes(selectedId))
    throw new Error("Das gewaehlte Programm liegt nicht mehr im Reveal-Fenster.");
  const selectedDefinition = definitionFor(state, selectedId);
  if (selectedDefinition.type !== "program")
    throw new Error("Mystery Box kann nur ein Programm installieren.");
  if (
    state.runner.memoryUsed + (selectedDefinition.memoryCost ?? 0) >
    state.runner.memoryLimit
  )
    throw new Error("Nicht genug Memory fuer das Mystery-Box-Programm.");

  removeFromAllZones(state, selectedId);
  state.runner.rig.programs.push(selectedId);
  state.runner.memoryUsed += selectedDefinition.memoryCost ?? 0;
  state.cardInstances[selectedId] = {
    ...mustInstance(state.cardInstances, selectedId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
  };
  if ((selectedDefinition.recurringCredits ?? 0) > 0)
    setCardCounter(
      state,
      selectedId,
      "recurring_credit",
      selectedDefinition.recurringCredits ?? 0,
    );
  if (
    selectedDefinition.mechanics.includes("virus") &&
    selectedDefinition.id !== BUTCHER_BOY_ID &&
    selectedDefinition.id !== SKIVVISS_ID
  )
    addCardCounter(state, selectedId, "virus", 1);

  trashRunnerInstalledCardToHeap(state, sourceCardId);
  state.runner.stack = shuffleStateIds(
    state,
    state.runner.stack,
    `v1915.mystery_box.shuffle.after_install.${sourceCardId}.${selectedId}`,
  );
  for (const cardId of state.runner.stack) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "runner", zone: "stack" },
    };
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1915RunnerProgramAbility: "mystery_box_top5_program_install",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "mystery_box_program_install",
    installedProgramDefinitionId: selectedDefinition.id,
    installedProgramCount: 1,
    selfTrashed: true,
    randomCounterAfter: state.randomCounter,
  };
}

function resolveMicrotechBackupDriveReturnTopHosted(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Microtech Backup Drive nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.hardware.includes(sourceCardId))
    throw new Error("Microtech Backup Drive ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID)
    throw new Error("Die Microtech-Backup-Drive-Faehigkeit passt nicht zur Karte.");
  const targetProgramId = String(legalAction.payload?.targetProgramId ?? "");
  const topHostedId = topHostedProgramOnMicrotech(state, sourceCardId);
  if (!targetProgramId || targetProgramId !== topHostedId)
    throw new Error("Nur das oberste Microtech-Programm darf genommen werden.");
  const targetDefinitionId = definitionFor(state, targetProgramId).id;
  spendClick(state, "runner");
  removeFromAllZones(state, targetProgramId);
  state.runner.grip.push(targetProgramId);
  const instance = mustInstance(state.cardInstances, targetProgramId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  state.cardInstances[targetProgramId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "grip" },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerHardwareAbility: "microtech_backup_drive_return_top_hosted",
    sourceDefinitionId: MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
    returnedCardDefinitionId: targetDefinitionId,
    returnedToGrip: true,
    hostedProgramCountAfter: microtechHostedProgramIds(state, sourceCardId)
      .length,
  };
}

function resolveShortTermContractAbility(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Short-Term Contract nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Short-Term Contract ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== SHORT_TERM_CONTRACT_ID)
    throw new Error("Die Short-Term-Contract-Faehigkeit passt nicht zur Karte.");

  const removeAmount = Number(
    legalAction.payload?.removePowerCounterAmount ?? 0,
  );
  const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
  if (
    !Number.isInteger(removeAmount) ||
    removeAmount !== 2 ||
    !Number.isInteger(gainAmount) ||
    gainAmount !== 2
  )
    throw new Error("Short-Term Contract nimmt genau 2 Credits.");
  if (cardCounter(state, sourceCardId, "power") < removeAmount)
    throw new Error("Auf Short-Term Contract liegen nicht genug Credits.");

  spendClick(state, "runner");
  spendCardCounter(state, sourceCardId, "power", removeAmount);
  credits(state, "runner", gainAmount);
  const remainingCounters = cardCounter(state, sourceCardId, "power");
  const shortTermContractTrashed = remainingCounters === 0;
  if (shortTermContractTrashed)
    trashRunnerInstalledCardToHeap(state, sourceCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    removedCounterAmount: removeAmount,
    gainedCredits: gainAmount,
    remainingCounters,
    shortTermContractTrashed,
    runnerCreditsAfter: state.runner.credits,
  };
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
  const drawSummary = drawRunnerCards(state, 5);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "mit_west_tier_shuffle_grip_heap_stack",
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: "onr_v1_101_mit_west_tier",
  };
  applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
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
  const drawAmount = 5;
  const beforeDraw = state.corp.hq.length;
  drawCorpCards(state, drawAmount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId: agendaId,
    cardDefinitionId: AI_CHIEF_FINANCIAL_OFFICER_ID,
    sourceDefinitionId: AI_CHIEF_FINANCIAL_OFFICER_ID,
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
  if (legalAction.side === "corp") expireCorporateRetreatInstallCreditAbilities(state);
  if (legalAction.side === "runner") {
    const hostOnCardId =
      typeof legalAction.payload?.hostOnCardId === "string"
        ? String(legalAction.payload.hostOnCardId)
        : undefined;
    const zetatechOverlayInstall =
      legalAction.payload?.v1922ZetatechOverlayInstall === true;
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
      !(
        zetatechOverlayInstall
          ? canOverlayProgramOnZetatechSoftwareInstaller(
              state,
              hostOnCardId,
              definition,
            )
          : canHostProgramOnDaemon(state, hostOnCardId, definition)
      )
    ) {
      throw new Error("Der angegebene Program-Host ist ungueltig.");
    }
    if (
      definition.id === "onr_v1_173_restrictive-net-zoning" &&
      (!selectedServerId || selectedServerId === "new_remote")
    ) {
      throw new Error(
        "Restrictive Net Zoning benötigt einen gültigen Zielserver.",
      );
    }
    if (
      definition.id === CODE_VIRAL_CACHE_ID &&
      ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true
    ) {
      throw new Error(
        "Code Viral Cache darf nur nach erfolgreichem HQ-Run in diesem Zug installiert werden.",
      );
    }
    const restrictiveTargetServerId =
      selectedServerId && selectedServerId !== "new_remote"
        ? (selectedServerId as Exclude<ServerId, "new_remote">)
        : undefined;
    const zetatechRecurringBefore =
      zetatechOverlayInstall && hostOnCardId
        ? cardCounter(state, hostOnCardId, "recurring_credit")
        : 0;
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
    if (definition.id === ARASAKA_PORTABLE_PROTOTYPE_LINK_HARDWARE_ID) {
      const agendaCost = Number(
        legalAction.payload?.installAgendaPointCost ?? 0,
      );
      if (!Number.isInteger(agendaCost) || agendaCost !== 1)
        throw new Error(
          "Arasaka Portable Prototype benötigt exakt 1 Agenda-Punkt als Zusatzkosten.",
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
        specialZoneReason: "agenda_point_cost_arasaka_portable_prototype",
      };
    }
    spendRunnerInstallCredits(
      state,
      definition.installCost ?? 0,
      definition.type,
    );
    removeFromAllZones(state, cardId);
    if (definition.type === "hardware") {
      const trashedDeckDefinitionIds: string[] = [];
      if (cardHasSubtype(definition, "deck")) {
        for (const oldDeckId of state.runner.rig.hardware.slice().sort()) {
          if (!cardHasSubtype(definitionFor(state, oldDeckId), "deck"))
            continue;
          trashedDeckDefinitionIds.push(definitionFor(state, oldDeckId).id);
          trashRunnerInstalledCardToHeap(state, oldDeckId);
        }
      }
      state.runner.rig.hardware.push(cardId);
      if (definition.mechanics.includes("modify_memory_limit"))
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
      else if ((definition.memoryLimitBonus ?? 0) > 0)
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 0;
      if ((definition.recurringCredits ?? 0) > 0)
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
      if (definition.id === ABLATIVE_COUNTER_HARDWARE_CARD_ID) {
        setCardCounter(
          state,
          cardId,
          "power",
          ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
        );
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          counterType: "power",
          addedCounterAmount: ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
          remainingCounters: ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
        };
      }
      if (trashedDeckDefinitionIds.length > 0) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          deckUniqueReplacement: true,
          trashedDeckDefinitionIds: trashedDeckDefinitionIds.join(","),
        };
      }
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
      if (
        definition.mechanics.includes("virus") &&
        definition.id !== BUTCHER_BOY_ID &&
        definition.id !== SKIVVISS_ID
      )
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
      if (definition.id === SHORT_TERM_CONTRACT_ID) {
        setCardCounter(state, cardId, "power", 12);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          counterType: "power",
          addedCounterAmount: 12,
          remainingCounters: 12,
        };
      }
      if (definition.id === RIGGED_INVESTMENTS_ID) {
        setCardCounter(state, cardId, "bit", 6);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          counterType: "bit",
          addedCounterAmount: 6,
          remainingCounters: 6,
        };
      }
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
    if (zetatechOverlayInstall) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922RunnerProgramAbility: "zetatech_overlay_install",
        zetatechOverlayInstall: true,
        hostDefinitionId: ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID,
        zetatechRecurringCreditsSpent:
          zetatechOverlayInstall && hostOnCardId
            ? Math.max(
                0,
                zetatechRecurringBefore -
                  cardCounter(state, hostOnCardId, "recurring_credit"),
              )
            : 0,
        runnerCreditsAfter: state.runner.credits,
      };
    }
    consumeValuPakProgramInstallAction(state, legalAction);
    if ((definition.recurringCredits ?? 0) > 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        recurringCreditsLoaded: definition.recurringCredits ?? 0,
      };
    }
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
    server.ice.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: server.id },
    };
    markRovingSubmarineActivityForServer(state, server.id, legalAction);
    consumeEdgerunnerTempsInstallAction(state, legalAction);
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
  markRovingSubmarineActivityForServer(state, server.id, legalAction);
  consumeEdgerunnerTempsInstallAction(state, legalAction);
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
  legalAction?: LegalAction,
): void {
  const server = mustServer(state, serverId);
  const flags = ensureRunnerTurnFlags(state);
  flags.runAttemptsThisTurn = (flags.runAttemptsThisTurn ?? 0) + 1;
  trashTopRunnersConferenceOnRunStart(state);
  const installedAccessBonus = v1915InstalledAccessBonus(state, server.id);
  const installedAccessBonusSourceDefinitionIds =
    v1915InstalledAccessBonusSourceDefinitionIds(state, server.id);
  const baseAccessCount = Math.max(1, Math.floor(accessCount));
  const effectiveAccessCount = baseAccessCount + installedAccessBonus;
  state.phase = "run";
  state.activeSide = "runner";
  state.run = {
    runId: `run_${state.stateVersion + 1}`,
    attackedServerId: server.id,
    phase: "approach_ice",
    position:
      server.ice.length > 0
        ? {
            kind: "ice",
            serverId: server.id,
            iceIndex: outermostIceIndex(server),
          }
        : { kind: "server", serverId: server.id },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    bartmossUsedBreakerIdsThisEncounter: [],
    aardvarkInterceptionIceIds: [],
    blinkUsedSubroutinesByBreakerThisEncounter: {},
    successful: false,
    accessCount: effectiveAccessCount,
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
  applyCerberusRunStartDamage(state, legalAction);
  if (state.winner) return;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      serverId,
      baseAccessCount,
      installedAccessBonus,
      effectiveAccessCount,
      ...(installedAccessBonusSourceDefinitionIds.length > 0
        ? {
            installedAccessBonusSourceDefinitionIds:
              installedAccessBonusSourceDefinitionIds.join(","),
          }
        : {}),
    };
  }
  applyAiBoonRunStart(state, legalAction);
  if (server.ice.length > 0) {
    const iceIndex = outermostIceIndex(server);
    const approachedIceId = mustArrayValue(
      server.ice,
      iceIndex,
      "Server has no approached ice.",
    );
    state.run.approachedIceId = approachedIceId;
    approachOrEncounterIce(state, approachedIceId, legalAction);
  } else {
    enterAccess(state, legalAction);
  }
}

function applyCerberusRunStartDamage(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const counterCount = cardCounter(state, state.runner.identity, "cerberus");
  if (counterCount <= 0) return;
  const damageAmount = counterCount * 2;
  const summary = doDamage(state, {
    damageId: `${state.run?.runId ?? `run_${state.stateVersion + 1}`}.cerberus_counter_start_damage`,
    damageType: "net",
    amount: damageAmount,
    source: `counter:${CERBERUS_ID}`,
  });
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: CERBERUS_ID,
      cerberusCounterCount: counterCount,
      damageResolved: true,
      damageType: summary.damageType,
      damageAmount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      flatline: summary.flatline,
    };
  }
}

function applyAiBoonRunStart(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const sourceCardId = state.runner.rig.programs
    .slice()
    .sort()
    .find(
      (cardId) =>
        definitionFor(state, cardId).id === AI_BOON_RANDOM_BREAKER_CARD_ID,
    );
  if (!sourceCardId || !state.run) return;
  const randomPurpose = `v1921.die.${AI_BOON_RANDOM_BREAKER_CARD_ID}.run_start_strength`;
  const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
  const baseStrength = definitionFor(state, sourceCardId).strength ?? 0;
  const runStrength = baseStrength + dieRoll;
  state.run.aiBoonSourceCardId = sourceCardId;
  state.run.aiBoonRunStrength = runStrength;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1921RunnerProgramAbility: "ai_boon_run_start_strength",
      sourceDefinitionId: AI_BOON_RANDOM_BREAKER_CARD_ID,
      aiBoonSourceCardId: sourceCardId,
      randomPurpose,
      v1921DieRoll: dieRoll,
      aiBoonRunStrength: runStrength,
      randomCounterAfter: state.randomCounter,
    };
  }
}

function markApproachIceExposeSkippedForIce(
  run: ActiveRun,
  approachedIceId: CardInstanceId,
): void {
  const skipped = run.approachIceExposeSkippedIceIdsThisRun ?? [];
  if (!skipped.includes(approachedIceId))
    run.approachIceExposeSkippedIceIdsThisRun = [...skipped, approachedIceId];
}

function markApproachIceExposeUsedForSource(
  run: ActiveRun,
  sourceCardId: CardInstanceId,
): void {
  const used = run.approachIceExposeUsedSourceIdsThisRun ?? [];
  if (!used.includes(sourceCardId))
    run.approachIceExposeUsedSourceIdsThisRun = [...used, sourceCardId];
}

function resolveApproachIceExposeAbility(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Approach-Expose nutzen.");
  const run = mustRun(state);
  const approachedIceId = run.approachedIceId;
  if (
    !approachedIceId ||
    String(legalAction.payload?.iceId) !== approachedIceId
  )
    throw new Error("Approach-Expose passt nicht zum aktuellen ICE.");
  if (!isApproachIceExposeWindowOpen(state))
    throw new Error("Approach-Expose ist in diesem Fenster nicht legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const availableSources = installedApproachIceExposeSources(state);
  const decision = String(legalAction.payload?.approachIceExposeDecision ?? "");
  if (decision === "expose") {
    if (!availableSources.includes(sourceCardId))
      throw new Error("Die Approach-Expose-Quelle ist nicht installiert.");
    const definition = definitionFor(state, approachedIceId);
    markApproachIceExposeUsedForSource(run, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose",
      publicRevealKind: "expose",
      publicRevealDefinitionId: definition.id,
    };
  } else if (decision === "decline") {
    markApproachIceExposeSkippedForIce(run, approachedIceId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose_decline",
    };
  } else {
    throw new Error("Approach-Expose-Entscheidung ist ungueltig.");
  }

  state.activeSide = "corp";
  state.timingPoint = "run.approach_ice";
}

function rezCard(
  state: GameState,
  cardId: string,
  rootRez: boolean,
  legalAction?: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (definition.id === ACME_SAVINGS_AND_LOAN_ID) {
    if (!legalAction)
      throw new Error("ACME Savings and Loan braucht eine LegalAction.");
    const agendaCost = Number(legalAction?.payload?.agendaPointCost ?? 0);
    if (!Number.isInteger(agendaCost) || agendaCost !== 1)
      throw new Error("ACME Savings and Loan kostet genau 1 Agenda-Punkt.");
    const costResult = spendCorpAgendaPointCost(state, agendaCost);
    legalAction.payload = {
      ...(legalAction?.payload ?? {}),
      agendaPointCost: agendaCost,
      agendaPointCostPaid: costResult.paidPoints,
      acmeSavingsAndLoanAbility: "rez_with_agenda_point_cost",
      acmeSavingsAndLoanObligationsBefore:
        acmeSavingsAndLoanObligationCount(state),
      ...(costResult.bonusPointsSpent > 0
        ? { corpBonusAgendaPointsSpent: costResult.bonusPointsSpent }
        : {}),
      ...(costResult.forfeitedAgendaDefinitionIds.length > 0
        ? {
            forfeitedAgendaDefinitionIds:
              costResult.forfeitedAgendaDefinitionIds.join(","),
            specialZone: "removed_from_game",
            specialZoneVisibility: "public",
            specialZoneReason: "acme_savings_and_loan_rez_cost",
          }
        : {}),
    };
  }
  spendCredits(state, "corp", rezCostForCard(state, cardId));
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    rezzed: true,
    faceup: true,
  };
  if (definition.id === KRUMZ_TRACE_ASSET_CARD_ID) {
    setCardCounter(state, cardId as CardInstanceId, "bit", 1);
  }
  if (definition.id === PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID) {
    setCardCounter(
      state,
      cardId as CardInstanceId,
      "bit",
      PARIS_CITY_GRID_TRACE_POOL_BITS,
    );
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceDefinitionId: PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
        counterType: "bit",
        addedCounterAmount: PARIS_CITY_GRID_TRACE_POOL_BITS,
        remainingCounters: PARIS_CITY_GRID_TRACE_POOL_BITS,
      };
    }
  }
  if (definition.id === HOLOVID_CAMPAIGN_ID) {
    setCardCounter(
      state,
      cardId as CardInstanceId,
      "bit",
      HOLOVID_CAMPAIGN_STARTING_BITS,
    );
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceDefinitionId: HOLOVID_CAMPAIGN_ID,
        counterType: "bit",
        addedCounterAmount: HOLOVID_CAMPAIGN_STARTING_BITS,
        remainingCounters: HOLOVID_CAMPAIGN_STARTING_BITS,
      };
    }
  }
  if (rootRez && startSpeedTrapRezInterruptChoice(state, cardId, legalAction))
    return;
  if (rootRez && resolveCorpRootRezEffect(state, cardId, legalAction)) return;
  if (rootRez) return;
  beginEncounter(state, cardId as CardInstanceId, legalAction);
}

function resolveCorpRootRezEffect(
  state: GameState,
  cardId: string,
  legalAction?: LegalAction,
): boolean {
  const definition = definitionFor(state, cardId);
  if (!CORP_ROOT_REZ_RESOLVERS[definition.id]) return false;
  CORP_ROOT_REZ_RESOLVERS[definition.id]?.resolve(state);
  if (definition.id === ACME_SAVINGS_AND_LOAN_ID) {
    addAcmeSavingsAndLoanObligation(state, 1);
    trashCorpInstalledCardToArchives(state, cardId as CardInstanceId);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits: 12,
        selfTrashed: true,
        acmeSavingsAndLoanObligationsAfter:
          acmeSavingsAndLoanObligationCount(state),
        corpCreditsAfter: state.corp.credits,
      };
    }
  }
  return true;
}

function installedSpeedTrapIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.programs
    .filter((cardId) => definitionFor(state, cardId).id === SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID)
    .sort();
}

function startSpeedTrapRezInterruptChoice(
  state: GameState,
  rezzedCardId: string,
  legalAction?: LegalAction,
): boolean {
  const run = state.run;
  if (!run) return false;
  const definition = definitionFor(state, rezzedCardId);
  if (definition.type !== "asset" && definition.type !== "upgrade")
    return false;
  const speedTrapId = installedSpeedTrapIds(state)[0];
  if (!speedTrapId) return false;
  if (!mustServer(state, run.attackedServerId).root.includes(rezzedCardId))
    return false;
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  run.speedTrapPendingRezCardId = rezzedCardId as CardInstanceId;
  run.speedTrapPendingRezTimingPoint = state.timingPoint;
  run.speedTrapPendingRezActiveSide = state.activeSide;
  state.pendingChoice = {
    choiceId: `v1922_speed_trap_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.speed_trap:${speedTrapId}:${rezzedCardId}:${state.stateVersion + 1}`,
    prompt: "Speed Trap: Nach dem Rez jack out?",
    kind: "select_option",
    options: [
      {
        id: "jack_out",
        label: "Jack out",
        publicLabel: "Speed Trap nutzen",
        value: "jack_out",
      },
      {
        id: "pass",
        label: "Nicht nutzen",
        publicLabel: "Speed Trap nicht nutzen",
        value: "pass",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  state.activeSide = "runner";
  if (legalAction) {
    const serverLabel = publicServerLabel(state, run.attackedServerId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      sourceDefinitionId: SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID,
      speedTrapSourceCardId: speedTrapId,
      rezzedCardDefinitionId: definition.id,
      ...(serverLabel ? { serverLabel } : {}),
      speedTrapChoiceOpened: true,
    };
  }
  return true;
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
  legalAction?: LegalAction,
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
    beginEncounter(state, approachedIceId, legalAction);
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
  state.activeSide = approachIceExposeCanBeOfferedForCurrentIce(state)
    ? "runner"
    : "corp";
}

function beginEncounter(
  state: GameState,
  encounteredIceId: CardInstanceId,
  legalAction?: LegalAction,
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
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          encounterTaxForFutureIce: encounterTax,
          encounterTaxPaid: 0,
          encounterTaxSource: "onr_v1_222_ball-and-chain",
        };
      }
      finishRun(state, false, legalAction);
      return;
    }
    spendRunnerRunCredits(state, encounterTax);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        encounterTaxForFutureIce: encounterTax,
        encounterTaxPaid: encounterTax,
        encounterTaxSource: "onr_v1_222_ball-and-chain",
      };
    }
  }
  state.timingPoint = "run.encounter_ice";
  state.activeSide = "runner";
}

function continueRun(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  if (run.phase === "movement") {
    continueFromMovement(state, legalAction);
    return;
  }
  if (run.phase !== "encounter_ice" || !run.encounteredIceId) {
    if (run.phase === "access") {
      finishRun(state, true, legalAction);
      return;
    }
    throw new Error("Run kann in diesem Schritt nicht fortgesetzt werden.");
  }
  const definition = definitionFor(state, run.encounteredIceId);
  let ended = false;
  const damageSummaries: DamageSummary[] = [];
  const subroutines = subroutinesForCurrentEncounter(state, definition);
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
      const printedAmount = subroutine.amount ?? 1;
      const microtechApNetReduction =
        damageType === "net" &&
        printedAmount > 1 &&
        cardHasSubtype(definition, "ap") &&
        hasInstalledMicrotechTrodeSet(state);
      const damageAmount = microtechApNetReduction ? 1 : printedAmount;
      const event = createDamageImminentEvent(state, {
        damageId: `${run.runId}.${run.encounteredIceId}.${index}`,
        damageType,
        amount: damageAmount,
        source: `subroutine:${definition.id}:${subroutine.id}`,
      });
      if (microtechApNetReduction && legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          runnerHardwareAbility: "microtech_trode_set_ap_net_damage_reduction",
          sourceDefinitionId: MICROTECH_TRODE_SET_ID,
          printedDamageAmount: printedAmount,
          damageAmount,
        };
      }
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
        if (targetProgramId) {
          const targetDefinitionId = definitionFor(state, targetProgramId).id;
          trashRunnerInstalledProgram(state, targetProgramId);
          if (legalAction) {
            legalAction.payload = {
              ...(legalAction.payload ?? {}),
              trashedCardDefinitionId: targetDefinitionId,
              trashedCardType: "program",
              trashedCount: 1,
            };
          }
        }
      }
    }
    if (subroutine.type === "set_run_encounter_tax") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      run.encounterTaxForFutureIce =
        Math.max(0, Math.floor(run.encounterTaxForFutureIce ?? 0)) + amount;
    }
    if (subroutine.type === "set_run_break_subroutine_cost_modifier") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      run.breakSubroutineAdditionalCost =
        runBreakSubroutineAdditionalCost(run) + amount;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v1922CorpIceAbility: "virizz_break_cost_modifier",
          breakSubroutineAdditionalCost: run.breakSubroutineAdditionalCost,
          sourceDefinitionId: definition.id,
        };
      }
    }
    if (subroutine.type === "set_run_future_end_the_run_subroutine") {
      run.futureEncounterEndTheRunSourceIceId = run.encounteredIceId;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v1922CorpIceAbility: "tutor_future_end_the_run_subroutine",
          sourceDefinitionId: definition.id,
        };
      }
    }
    if (subroutine.type === "set_run_viral_15") {
      if (!run.encounteredIceId)
        throw new Error("Viral 15 benoetigt ein Encounter-ICE.");
      run.viral15ActiveSourceIceId = run.encounteredIceId;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v1922CorpIceAbility: "viral_15_run_modifier",
          jackOutAdditionalCost: runJackOutAdditionalCost(run),
          sourceDefinitionId: definition.id,
        };
      }
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
    if (
      subroutine.type === "set_next_encounter_lock" ||
      subroutine.type === "set_next_encounter_no_break_subroutines"
    ) {
      run.nextEncounterNoBreakSubroutines = true;
      if (subroutine.type === "set_next_encounter_lock")
        run.nextEncounterJackOutLock = true;
    }
    if (subroutine.type === "set_run_jack_out_lock") {
      run.jackOutLockedForRun = true;
    }
    if (subroutine.type === "set_runner_forgo_next_action") {
      applyRunnerForgoNextAction(state);
    }
    if (subroutine.type === "set_runner_run_lock_actions") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      const flags = ensureRunnerTurnFlags(state);
      flags.runLockActionsPending =
        Math.max(0, Math.floor(flags.runLockActionsPending ?? 0)) + amount;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v1922CorpIceAbility: "haunting_inquisition_run_lock",
          runLockActionsAdded: amount,
          runLockActionsPending: flags.runLockActionsPending,
          sourceDefinitionId: definition.id,
        };
      }
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
      const arrangeCount = state.corp.rd.slice(0, 2).length;
      if (arrangeCount < 2) {
        if (legalAction) {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            hiddenZoneBarrier: true,
            hiddenZoneAction: "v1911_corp_reorder_rd_top2",
            arrangedCount: arrangeCount,
          };
        }
        if (!run.resolvedSubroutineIndexes.includes(index))
          run.resolvedSubroutineIndexes.push(index);
        continue;
      }
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
    finishRun(state, false, legalAction);
    return;
  }
  applyBartmossPostEncounterTrigger(state, run, legalAction);
  movePastCurrentIce(state, legalAction);
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
  legalAction?: LegalAction,
): void {
  const usedBreakerIds = run.bartmossUsedBreakerIdsThisEncounter?.slice() ?? [];
  if (usedBreakerIds.length === 0) return;
  const encounteredIceId = run.encounteredIceId ?? "unknown_ice";
  const outcomes: Array<{
    breakerId: CardInstanceId;
    die: number;
    trashed: boolean;
  }> = [];
  for (const breakerId of usedBreakerIds) {
    if (!state.runner.rig.programs.includes(breakerId)) continue;
    if (definitionFor(state, breakerId).id !== BARTMOSS_ID) continue;
    const die = rollDeterministicDie(
      state,
      `${BARTMOSS_ID}.post_encounter.${run.runId}.${encounteredIceId}.${breakerId}`,
    );
    const trashed = die === 1;
    if (trashed) trashRunnerInstalledProgram(state, breakerId);
    outcomes.push({ breakerId, die, trashed });
  }
  if (legalAction && outcomes.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      bartmossPostEncounterChecked: true,
      bartmossPostEncounterOutcomes: outcomes
        .map(
          (outcome) =>
            `${outcome.breakerId}:${outcome.die}:${outcome.trashed ? "trashed" : "survived"}`,
        )
        .join(","),
    };
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

function recordDupreBreakUsage(
  state: GameState,
  breakerId: CardInstanceId,
): void {
  const run = state.run;
  if (!run || definitionFor(state, breakerId).id !== DUPRE_ID) return;
  const instance = mustInstance(state.cardInstances, breakerId);
  if (
    instance.selectedServerId &&
    instance.selectedServerId !== run.attackedServerId
  ) {
    setCardCounter(state, breakerId, "power", 0);
  }
  const usedBreakerIds = run.dupreUsedBreakerIdsThisRun ?? [];
  if (!usedBreakerIds.includes(breakerId)) usedBreakerIds.push(breakerId);
  run.dupreUsedBreakerIdsThisRun = usedBreakerIds;
}

function recordRunFullyBrokenIce(run: ActiveRun, iceId: CardInstanceId): void {
  const fullyBroken = run.fullyBrokenIceIds ?? [];
  if (!fullyBroken.includes(iceId)) fullyBroken.push(iceId);
  run.fullyBrokenIceIds = fullyBroken;
}

function hackerTrackerCardIds(state: GameState): CardInstanceId[] {
  return corpInstalledCardIds(state)
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      return (
        instance?.rezzed === true &&
        definitionFor(state, cardId).id === HACKER_TRACKER_CENTRAL_RUN_LOCK_ASSET_ID
      );
    })
    .sort();
}

function hackerTrackerCounterTotal(state: GameState): number {
  return hackerTrackerCardIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "power"),
    0,
  );
}

function spendHackerTrackerCounters(
  state: GameState,
  amount: number,
): number {
  let remaining = Math.max(0, Math.floor(amount));
  let spent = 0;
  for (const cardId of hackerTrackerCardIds(state)) {
    if (remaining <= 0) break;
    const available = cardCounter(state, cardId, "power");
    const cardSpent = Math.min(available, remaining);
    if (cardSpent <= 0) continue;
    spendCardCounter(state, cardId, "power", cardSpent);
    remaining -= cardSpent;
    spent += cardSpent;
  }
  return spent;
}

function addHackerTrackerTraceCounters(state: GameState): number {
  let added = 0;
  for (const cardId of hackerTrackerCardIds(state)) {
    addCardCounter(state, cardId, "power", 1);
    added += 1;
  }
  return added;
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
  const parisPoolSource = parisCityGridTracePoolSource(state);
  const baseCorpBidMax =
    state.corp.credits +
    hackerTrackerCounterTotal(state) +
    krumzTraceBitTotal(state) +
    (parisPoolSource ? cardCounter(state, parisPoolSource.cardId, "bit") : 0);
  const rabbitTraceLimitReduction = rabbitTraceLimitReductionForIceTrace(state);
  const corpBidMax = Math.max(0, baseCorpBidMax - rabbitTraceLimitReduction);
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinition.id,
    subroutineIndex,
    baseTraceStrength,
    corpBidMax,
    ...(rabbitTraceLimitReduction > 0 ? { rabbitTraceLimitReduction } : {}),
    ...(parisPoolSource
      ? {
          parisCityGridPoolSourceCardInstanceId: parisPoolSource.cardId,
          parisCityGridPoolServerId: parisPoolSource.serverId,
        }
      : {}),
    status: "corp_bid",
    successEffect,
  };
  state.pendingChoice = traceBidChoice(
    state,
    "corp",
    traceId,
    `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`,
    corpBidMax,
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
      corpBidMax,
      ...(rabbitTraceLimitReduction > 0 ? { rabbitTraceLimitReduction } : {}),
      ...(parisPoolSource
        ? {
            parisCityGridPoolAvailable: cardCounter(
              state,
              parisPoolSource.cardId,
              "bit",
            ),
            parisCityGridPoolServerId: parisPoolSource.serverId,
            sourceDefinitionId: sourceDefinition.id,
          }
        : {}),
    };
  }
}

function rabbitTraceLimitReductionForIceTrace(state: GameState): number {
  return state.runner.rig.programs.some(
    (cardId) =>
      definitionFor(state, cardId).id === RABBIT_HQ_INTERFACE_PROGRAM_ID &&
      mustInstance(state.cardInstances, cardId).rezzed,
  )
    ? 1
    : 0;
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
  const parisPoolSource = parisCityGridTracePoolSource(state);
  state.trace = {
    traceId,
    sourceCardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    baseTraceStrength,
    corpBidMax:
      state.corp.credits +
      hackerTrackerCounterTotal(state) +
      krumzTraceBitTotal(state) +
      (parisPoolSource ? cardCounter(state, parisPoolSource.cardId, "bit") : 0),
    status: "corp_bid",
    successEffect: { type: "add_tag", amount: 1 },
    ...(parisPoolSource
      ? {
          parisCityGridPoolSourceCardInstanceId: parisPoolSource.cardId,
          parisCityGridPoolServerId: parisPoolSource.serverId,
        }
      : {}),
    returnPhase: state.phase,
    returnTimingPoint: state.timingPoint,
    returnActiveSide: state.activeSide,
  };
  state.pendingChoice = traceBidChoice(
    state,
    "corp",
    traceId,
    `Korp Trace-Bid wählen (Base Trace ${baseTraceStrength})`,
    state.corp.credits +
      hackerTrackerCounterTotal(state) +
      krumzTraceBitTotal(state) +
      (parisPoolSource ? cardCounter(state, parisPoolSource.cardId, "bit") : 0),
  );
  state.activeSide = "corp";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceStarted: true,
    traceId,
    sourceCardId: sourceCardInstanceId,
    sourceDefinitionId,
    baseTraceStrength,
    ...(parisPoolSource
      ? {
          corpBidMax:
            state.corp.credits +
            hackerTrackerCounterTotal(state) +
            krumzTraceBitTotal(state) +
            cardCounter(state, parisPoolSource.cardId, "bit"),
          parisCityGridPoolAvailable: cardCounter(
            state,
            parisPoolSource.cardId,
            "bit",
          ),
          parisCityGridPoolServerId: parisPoolSource.serverId,
        }
      : {}),
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

function movePastCurrentIce(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  if (run.position.kind !== "ice")
    throw new Error("Runner ist nicht an ICE positioniert.");
  const server = mustServer(state, run.position.serverId);
  const nextIndex = run.position.iceIndex - 1;
  const passedIceId = run.encounteredIceId;
  const viral15PendingPassedIceId =
    run.viral15ActiveSourceIceId &&
    passedIceId &&
    mustInstance(state.cardInstances, passedIceId).rezzed
      ? passedIceId
      : undefined;
  const startupImmolatorPendingPassedIceId =
    passedIceId &&
    mustInstance(state.cardInstances, passedIceId).rezzed &&
    run.fullyBrokenIceIds?.includes(passedIceId)
      ? passedIceId
      : undefined;
  if (
    passedIceId &&
    mustInstance(state.cardInstances, passedIceId).rezzed &&
    applyRioDeJaneiroCityGridPassedIceTrigger(state, run, passedIceId, legalAction)
  ) {
    return;
  }
  if (nextIndex >= 0) {
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
        ...(viral15PendingPassedIceId ? { viral15PendingPassedIceId } : {}),
        ...(startupImmolatorPendingPassedIceId
          ? { startupImmolatorPendingPassedIceId }
          : {}),
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
      ...(viral15PendingPassedIceId ? { viral15PendingPassedIceId } : {}),
      ...(startupImmolatorPendingPassedIceId
        ? { startupImmolatorPendingPassedIceId }
        : {}),
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
      ...(viral15PendingPassedIceId ? { viral15PendingPassedIceId } : {}),
      ...(startupImmolatorPendingPassedIceId
        ? { startupImmolatorPendingPassedIceId }
        : {}),
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

function applyRioDeJaneiroCityGridPassedIceTrigger(
  state: GameState,
  run: ActiveRun,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): boolean {
  if (run.position.kind !== "ice") return false;
  const server = mustServer(state, run.position.serverId);
  const rioIds = server.root
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      return (
        instance?.rezzed === true &&
        definitionFor(state, cardId).id === RIO_DE_JANEIRO_RANDOM_UPGRADE_CARD_ID
      );
    })
    .sort();
  if (rioIds.length === 0) return false;

  for (const rioId of rioIds) {
    const randomPurpose = `v1921.die.${RIO_DE_JANEIRO_RANDOM_UPGRADE_CARD_ID}.passed_ice.${run.runId}.${passedIceId}.${rioId}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    const runEnded = dieRoll === 1;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
        sourceCardId: rioId,
        sourceDefinitionId: RIO_DE_JANEIRO_RANDOM_UPGRADE_CARD_ID,
        passedIceId,
        passedIceDefinitionId: definitionFor(state, passedIceId).id,
        serverLabel: server.label,
        v1921DieRoll: dieRoll,
        randomPurpose,
        randomCounterAfter: state.randomCounter,
        rioRunEnded: runEnded,
      };
    }
    if (runEnded) {
      finishRun(state, false, legalAction);
      return true;
    }
  }
  return false;
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

  let targetIndex = outermostIceIndex(server);
  let remainingRezzedBack = die;
  for (let index = currentIndex + 1; index < server.ice.length; index += 1) {
    const cardId = server.ice[index];
    if (!cardId || !mustInstance(state.cardInstances, cardId).rezzed) continue;
    remainingRezzedBack -= 1;
    if (remainingRezzedBack === 0) {
      targetIndex = index;
      break;
    }
  }
  if (remainingRezzedBack > 0) targetIndex = outermostIceIndex(server);
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

function continueFromMovement(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  if (run.viral15PendingPassedIceId) {
    const pendingPassedIceId = run.viral15PendingPassedIceId;
    const { viral15PendingPassedIceId: _pending, ...runWithoutPending } = run;
    void _pending;
    state.run = runWithoutPending;
    if (
      startViral15ProgramTrashChoice(
        state,
        pendingPassedIceId,
        legalAction,
      )
    )
      return;
  }
  if (run.startupImmolatorPendingPassedIceId) {
    const {
      startupImmolatorPendingPassedIceId: _startupPending,
      ...runWithoutStartupPending
    } = run;
    void _startupPending;
    state.run = runWithoutStartupPending;
  }
  if (run.position.kind === "ice") {
    const server = mustServer(state, run.position.serverId);
    const approachedIceId =
      run.approachedIceId ??
      mustArrayValue(server.ice, run.position.iceIndex, "Naechstes ICE fehlt.");
    state.run = { ...run, phase: "approach_ice", approachedIceId };
    approachOrEncounterIce(state, approachedIceId);
    return;
  }
  enterAccess(state, legalAction);
}

function enterAccess(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  markSuccessfulRunForTurn(state, run);
  if (run.successfulRunAccessReplacement === "corp_lose_credits") {
    applySuccessfulRunAccessReplacement(state, run, legalAction);
    finishRun(state, true, legalAction);
    return;
  }
  if (isV097OrLater(state)) {
    revealArchivesAtBreachStart(state, run, legalAction);
    const breach = buildBreachState(state, run);
    if (breach.queue.length === 0) {
      finishRun(state, true, legalAction);
      return;
    }
    if (legalAction) {
      const v1915AccessBonus = v1915InstalledAccessBonus(
        state,
        breach.serverId,
      );
      const hqAccessBonus =
        breach.serverId === "hq" ? runnerHqAccessBonus(state) : 0;
      const installedAccessBonus = v1915AccessBonus + hqAccessBonus;
      const installedAccessBonusSourceDefinitionIds =
        v1915InstalledAccessBonusSourceDefinitionIds(state, breach.serverId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        baseAccessCount: Math.max(1, breach.queue.length - installedAccessBonus),
        installedAccessBonus,
        effectiveAccessCount: breach.queue.length,
        ...(installedAccessBonusSourceDefinitionIds.length > 0
          ? {
              installedAccessBonusSourceDefinitionIds:
                installedAccessBonusSourceDefinitionIds.join(","),
            }
          : {}),
      };
    }
    const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
    void _accessedCardId;
    state.run = {
      ...runWithoutAccessedCard,
      phase: "access",
      successful: true,
      breach,
    };
    autoAdvanceArchivesBreachPastNonDecisionCards(state, legalAction);
    if (!state.run) return;
  } else {
    state.run = { ...run, phase: "access", successful: true };
  }
  state.timingPoint = "access.resolve_card";
  state.activeSide = "runner";
}

function markSuccessfulRunForTurn(state: GameState, run: ActiveRun): void {
  if (run.attackedServerId === "hq")
    ensureRunnerTurnFlags(state).successfulHqRunThisTurn = true;
}

function revealArchivesAtBreachStart(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const accessServerId = run.accessServerOverride ?? run.attackedServerId;
  if (accessServerId !== "archives") return;
  const revealedIds = state.corp.archives.filter(
    (cardId) => !mustInstance(state.cardInstances, cardId).faceup,
  );
  if (revealedIds.length === 0) return;
  for (const cardId of revealedIds) {
    const instance = mustInstance(state.cardInstances, cardId);
    state.cardInstances[cardId] = { ...instance, faceup: true, rezzed: true };
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealCount: revealedIds.length,
    };
  }
}

function autoAdvanceArchivesBreachPastNonDecisionCards(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const run = state.run;
  const breach = run?.breach;
  if (!run || !breach || breach.serverId !== "archives" || breach.completed)
    return;

  let queue = breach.queue.slice();
  let currentIndex = breach.currentIndex;
  let accessedSummaries = breach.accessedSummaries.slice();
  let autoAccessedCount = 0;

  while (true) {
    const current = queue[currentIndex];
    if (!current || current.status !== "pending") break;
    if (archivesAccessRequiresDecisionOrEffect(state, current.cardInstanceId))
      break;

    queue = queue.map((entry, index) =>
      index === currentIndex ? { ...entry, status: "accessed" as const } : entry,
    );
    accessedSummaries = [
      ...accessedSummaries,
      {
        entryId: current.entryId,
        status: "accessed" as const,
        cardDefinitionId: definitionFor(state, current.cardInstanceId).id,
      },
    ];
    autoAccessedCount += 1;

    const nextIndex = queue.findIndex(
      (entry, index) => index > currentIndex && entry.status === "pending",
    );
    if (nextIndex === -1) {
      state.run = {
        ...run,
        breach: {
          ...breach,
          queue,
          completed: true,
          accessedSummaries,
        },
      };
      recordArchivesAutoAccess(legalAction, autoAccessedCount);
      finishRun(state, true, legalAction);
      return;
    }
    currentIndex = nextIndex;
  }

  if (autoAccessedCount === 0) return;
  state.run = {
    ...run,
    breach: {
      ...breach,
      queue,
      currentIndex,
      accessedSummaries,
    },
  };
  recordArchivesAutoAccess(legalAction, autoAccessedCount);
}

function archivesAccessRequiresDecisionOrEffect(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const definition = definitionFor(state, cardId);
  if (definition.type === "agenda") return true;
  if (
    state.ambushHarness?.enabled &&
    (!state.ambushHarness.triggerDefinitionId ||
      state.ambushHarness.triggerDefinitionId === definition.id)
  )
    return true;
  if (
    definition.id === SETUP_ACCESS_AMBUSH_ASSET_CARD_ID ||
    definition.id === TRAP_ACCESS_AMBUSH_ASSET_CARD_ID ||
    definition.id === DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID ||
    definition.id === DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID ||
    definition.id === TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID ||
    definition.id === CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID ||
    definition.id === EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID ||
    definition.id === VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID ||
    definition.id === VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID ||
    definition.id === BIZARRE_ENCRYPTION_SCHEME_ID ||
    definition.id === CHIMERA_ID
  ) {
    return true;
  }
  return (definition.mechanics ?? []).some(
    (mechanic) =>
      mechanic === "access_ambush" ||
      mechanic === "access_trace" ||
      mechanic === "access_replacement",
  );
}

function recordArchivesAutoAccess(
  legalAction: LegalAction | undefined,
  count: number,
): void {
  if (!legalAction || count <= 0) return;
  const previousCount =
    typeof legalAction.payload?.archivesAutoAccessedCount === "number"
      ? legalAction.payload.archivesAutoAccessedCount
      : 0;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    archivesAutoAccessedCount: previousCount + count,
  };
}

function applySuccessfulRunAccessReplacement(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
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
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessReplacement: run.successfulRunAccessReplacement ?? "corp_lose_credits",
      creditLoss,
      corpCreditsAfter: state.corp.credits,
      tagsAdded: runnerTagGain,
      runnerTagsAfter: state.runner.tags,
      corpDrawnCount: corpDraw,
      hiddenZoneBarrier: true,
    };
  }
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
  return v1915InstalledAccessBonusSourceDefinitionIds(state, serverId).length;
}

function v1915InstalledAccessBonusSourceDefinitionIds(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): CardDefinitionId[] {
  const sources: CardDefinitionId[] = [];
  const pushIfInstalled = (definitionId: CardDefinitionId): void => {
    if (runnerHasInstalledDefinition(state, definitionId))
      sources.push(definitionId);
  };
  if (serverId === "hq")
    pushIfInstalled(EXPERT_SCHEDULE_ANALYZER_ID);
  if (serverId === "rd")
    pushIfInstalled(MICROTECH_AI_INTERFACE_ID);
  if (serverId === "rd") {
    const rdInterfaceCount = runnerInstalledCardIds(state).filter(
      (cardId) => definitionFor(state, cardId).id === R_AND_D_INTERFACE_ID,
    ).length;
    for (let index = 0; index < rdInterfaceCount; index += 1)
      sources.push(R_AND_D_INTERFACE_ID);
  }
  if (serverId === "hq" || serverId === "rd")
    pushIfInstalled(SHREDDER_UPLINK_PROTOCOL_ID);
  if (serverId === "archives")
    pushIfInstalled(RECORD_RECONSTRUCTOR_ID);
  return sources.sort();
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
      finishRun(state, true, legalAction);
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
    resolveAccessAmbushAssetEffect(state, cardId, legalAction);
    resolveUpgradeAccessEffect(state, cardId, legalAction);
    resolveAssetAccessEffect(state, cardId, legalAction);
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
      completeCurrentBreachAccess(state, "accessed", legalAction);
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
    finishRun(state, true, legalAction);
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
  resolveAccessAmbushAssetEffect(state, cardId, legalAction);
  resolveUpgradeAccessEffect(state, cardId, legalAction);
  resolveAssetAccessEffect(state, cardId, legalAction);
  resolveV199UpgradeOnAccess(state, cardId, legalAction);
  const definition = definitionFor(state, cardId);
  const freeTrashAccess = canFreeTrashCurrentAccessCard(state, run, definition);
  if (
    definition.type !== "agenda" &&
    definition.type !== "asset" &&
    definition.type !== "upgrade" &&
    !freeTrashAccess
  ) {
    finishRun(state, true, legalAction);
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

function resolveAccessAmbushAssetEffect(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (
    definition.id !== SETUP_ACCESS_AMBUSH_ASSET_CARD_ID &&
    definition.id !== TRAP_ACCESS_AMBUSH_ASSET_CARD_ID
  )
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
  const accessServerId = String(legalAction.payload?.serverId ?? "");
  const accessedFromArchives =
    accessServerId === "archives" ||
    mustInstance(state.cardInstances, cardId).zone.zone === "archives";
  if (accessedFromArchives) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_access_ambush",
      ambushDefinitionId: definition.id,
      ambushSkippedReason: "archives",
    };
    return;
  }
  if (definition.id === TRAP_ACCESS_AMBUSH_ASSET_CARD_ID)
    state.runner.tags += 1;
  const damageAmount =
    definition.id === SETUP_ACCESS_AMBUSH_ASSET_CARD_ID ? 2 : 3;
  const summary = doDamage(state, {
    damageId: `v1917.ambush.${state.run.runId}.${cardId}.${state.stateVersion + 1}`,
    damageType: "net",
    amount: damageAmount,
    source: definition.id,
  });
  setDamagePayload(legalAction, summary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_access_ambush",
    ambushDefinitionId: definition.id,
    damageAmount,
    ...(accessServerId === "rd"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
    ...(definition.id === TRAP_ACCESS_AMBUSH_ASSET_CARD_ID
      ? { tagsAdded: 1, runnerTagsAfter: state.runner.tags }
      : {}),
  };
}

function resolveUpgradeAccessEffect(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (
    definition.id !== CRYBABY_ACCESS_COST_UPGRADE_ID &&
    definition.id !== DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID &&
    definition.id !== DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID &&
    definition.id !== TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID
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

  if (definition.id === CRYBABY_ACCESS_COST_UPGRADE_ID) {
    addCardCounter(state, state.runner.identity, "crying", 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_crybaby_access_counter",
      ambushDefinitionId: definition.id,
      counterType: "crying",
      addedCounterAmount: 1,
      remainingCounters: cardCounter(state, state.runner.identity, "crying"),
    };
    return;
  }

  if (definition.id === TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID) {
    const serverId = state.run.attackedServerId;
    const consumed = state.run.turbeauAccessTraceConsumedByServer?.[serverId] ?? [];
    if (consumed.includes(cardId)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1918_upgrade_access_trace",
        ambushDefinitionId: definition.id,
        oncePerRunConsumed: true,
        serverId,
      };
      return;
    }
    state.run.turbeauAccessTraceConsumedByServer = {
      ...(state.run.turbeauAccessTraceConsumedByServer ?? {}),
      [serverId]: [...consumed, cardId],
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), cardId };
    startTraceFromOperation(state, definition.id, 4, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: definition.id,
      oncePerRunConsumed: true,
      baseTraceStrength: 4,
      serverId,
    };
    return;
  }

  const damageType =
    definition.id === DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID
      ? "meat"
      : "net";
  const damageAmount =
    definition.id === DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID ? 3 : 1;
  const runnerTagsBefore = state.runner.tags;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ambushDefinitionId: definition.id,
    damageType,
    damageAmount,
    ...(definition.id === DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID
      ? { runnerTagsBefore, tagConditionMet: runnerTagsBefore >= 1 }
      : {}),
  };
  if (
    definition.id === DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID &&
    runnerTagsBefore < 1
  ) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      damageSkippedReason: "runner_not_tagged",
    };
    return;
  }
  resolveDamageOperation(
    state,
    legalAction,
    damageType,
    damageAmount,
    definition.id,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_upgrade_access_ambush",
    ambushDefinitionId: definition.id,
    damageType,
    damageAmount,
  };
}

function resolveAssetAccessEffect(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const definition = definitionFor(state, cardId);
  if (
    definition.id !== CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID &&
    definition.id !== EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID &&
    definition.id !== VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID &&
    definition.id !== VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID
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
  const accessServerId = String(legalAction.payload?.serverId ?? "");
  const accessedFromArchives =
    accessServerId === "archives" ||
    mustInstance(state.cardInstances, cardId).zone.zone === "archives";
  if (
    accessedFromArchives &&
    definition.id === VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID
  ) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: definition.id,
      ambushSkippedReason: "archives",
    };
    return;
  }

  if (
    definition.id === CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID ||
    definition.id === EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID
  ) {
    const candidates =
      definition.id === CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID
        ? state.runner.rig.hardware
        : state.runner.rig.programs;
    const targetCardIds = candidates.slice().sort((left, right) => {
      const leftDefinition = definitionFor(state, left);
      const rightDefinition = definitionFor(state, right);
      const byInstallCost =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
    });
    const trashLimit =
      definition.id === EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID ||
      definition.id === CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID
        ? Math.max(0, mustInstance(state.cardInstances, cardId).advancementCounters)
        : 1;
    const selectedTargetIds = targetCardIds.slice(0, trashLimit);
    if (selectedTargetIds.length > 0) {
      const targetDefinitionIds = selectedTargetIds.map(
        (targetCardId) => definitionFor(state, targetCardId).id,
      );
      for (const targetCardId of selectedTargetIds)
        trashRunnerInstalledCardToHeap(state, targetCardId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1919_access_ambush_trash_installed",
        ambushDefinitionId: definition.id,
        ...(definition.id === EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID ||
        definition.id === CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID
          ? { advancementCounterCount: trashLimit }
          : {}),
        trashedCount: selectedTargetIds.length,
        trashedCardDefinitionId: targetDefinitionIds[0] ?? "",
        trashedCardDefinitionIds: targetDefinitionIds.join(","),
        trashedCardType:
          definition.id === CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID
            ? "hardware"
            : "program",
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
    definition.id === VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID
      ? "core"
      : "net";
  const advancementCounterCount = Math.max(
    0,
    Math.floor(mustInstance(state.cardInstances, cardId).advancementCounters),
  );
  const damageAmount =
    definition.id === VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID
      ? advancementCounterCount
      : definition.id === VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID
        ? Math.max(1, advancementCounterCount * 2)
        : 2;
  if (damageAmount <= 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: definition.id,
      advancementCounterCount,
      damageAmount: 0,
      ...(accessServerId === "rd"
        ? {
            publicRevealKind: "reveal",
            publicRevealDefinitionId: definition.id,
          }
        : {}),
    };
    return;
  }
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
    ...(definition.id === VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID ||
    definition.id === VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID
      ? { advancementCounterCount, damageAmount }
      : {}),
    ...(accessServerId === "rd"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
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

function stealAgenda(state: GameState, cardId: string, legalAction?: LegalAction): void {
  if (!cardId) throw new Error("Keine Agenda wird accessed.");
  if (state.run?.bizarreEncryptionSchemeActive) {
    delayBizarreEncryptionSchemeAgendaScore(state, cardId, legalAction);
    return;
  }
  const flags = ensureRunnerTurnFlags(state);
  flags.stoleAgendaThisTurn = true;
  const definition = definitionFor(state, cardId);
  if (cardHasSubtype(definition, "research"))
    flags.stoleResearchAgendaThisTurn = true;
  if (cardHasSubtype(definition, "gray_ops"))
    flags.stoleGrayOpsAgendaThisTurn = true;
  if (cardHasSubtype(definition, "black_ops"))
    flags.stoleBlackOpsAgendaThisTurn = true;
  const agendaPointValue = agendaPointsForScoredCard(state, cardId);
  const agendaDebt = Math.max(
    0,
    Math.floor(state.runnerAgendaPointsToForfeit ?? 0),
  );
  removeFromAllZones(state, cardId);
  if (agendaDebt > 0) {
    const paidDebt = Math.min(agendaDebt, agendaPointValue);
    state.runnerAgendaPointsToForfeit = agendaDebt - paidDebt;
    ensureSpecialZones(state).removedFromGame.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
    };
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919RunnerEventAbility: "arasaka_owns_you_future_agenda_forfeit",
        futureAgendaPointForfeitPaid: paidDebt,
        futureAgendaPointForfeitPending: state.runnerAgendaPointsToForfeit,
        specialZone: "removed_from_game",
        specialZoneVisibility: "public",
        specialZoneReason: "v1919_arasaka_owns_you_future_agenda_forfeit",
      };
    }
    if (state.run?.breach) {
      completeCurrentBreachAccess(state, "stolen", legalAction);
      return;
    }
    finishRun(state, true, legalAction);
    return;
  }
  state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "stolen", legalAction);
    return;
  }
  finishRun(state, true, legalAction);
}

function delayBizarreEncryptionSchemeAgendaScore(
  state: GameState,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
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
    completeCurrentBreachAccess(state, "declined", legalAction);
    return;
  }
  finishRun(state, true, legalAction);
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
  const effectiveCost = effectiveAccessTrashCost(
    state,
    cardId as CardInstanceId,
  );
  const trashCost = overrideCost ?? effectiveCost.totalCost;
  const sourceZone = mustInstance(state.cardInstances, cardId).zone;
  if (sourceZone.side === "corp" && sourceZone.zone === "archives") {
    throw new Error("Karten in Archives können beim Zugriff nicht getrasht werden.");
  }
  const trashPayment = spendRunnerAccessTrashCredits(
    state,
    trashCost,
    cardId as CardInstanceId,
  );
  if (legalAction && overrideCost === undefined) {
    const scatterShotSpent =
      definition.type === "upgrade" ? trashPayment.recurringSpent : 0;
    const poltergeistSpent =
      definition.type === "asset" ? trashPayment.recurringSpent : 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessTrashBaseCost: effectiveCost.baseCost,
      accessTrashCostModifier: effectiveCost.modifier,
      accessTrashTotalCost: trashCost,
      ...(scatterShotSpent > 0
        ? {
            v1922RunnerProgramAbility:
              "scatter_shot_upgrade_trash_recurring_credit",
            scatterShotRecurringCreditsSpent: scatterShotSpent,
            runnerCreditsSpent: trashPayment.runnerCreditsSpent,
          }
        : {}),
      ...(poltergeistSpent > 0
        ? {
            v1922RunnerProgramAbility:
              "poltergeist_node_trash_recurring_credit",
            poltergeistRecurringCreditsSpent: poltergeistSpent,
            runnerCreditsSpent: trashPayment.runnerCreditsSpent,
          }
        : {}),
    };
  }
  const run = state.run;
  if (
    run &&
    definition.id === RED_HERRINGS_STEAL_TAX_UPGRADE_ID &&
    sourceZone.side === "corp" &&
    sourceZone.zone === "serverRoot" &&
    sourceZone.serverId === (run.breach?.serverId ?? run.attackedServerId)
  ) {
    run.redHerringsTaxSourceByServer = {
      ...(run.redHerringsTaxSourceByServer ?? {}),
      [sourceZone.serverId]: cardId as CardInstanceId,
    };
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1918UpgradeAbility: "red_herrings_steal_tax",
        redHerringsCardId: cardId,
        redHerringsTaxPersistsForRun: true,
      };
    }
  }
  trashCorpInstalledCardToArchives(state, cardId, legalAction);
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "trashed", legalAction);
    return;
  }
  finishRun(state, true, legalAction);
}

function declineCurrentAccess(state: GameState, legalAction?: LegalAction): void {
  if (state.run?.breach) {
    completeCurrentBreachAccess(state, "declined", legalAction);
    return;
  }
  finishRun(state, true, legalAction);
}

function completeCurrentBreachAccess(
  state: GameState,
  status: BreachEntryStatus,
  legalAction?: LegalAction,
): void {
  const run = mustRun(state);
  const breach = run.breach;
  if (!breach) {
    finishRun(state, true, legalAction);
    return;
  }
  const current = breach.queue[breach.currentIndex];
  if (!current) {
    finishRun(state, true, legalAction);
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
    finishRun(state, true, legalAction);
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
  autoAdvanceArchivesBreachPastNonDecisionCards(state, legalAction);
  if (!state.run) return;
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
      trashedCardDefinitionId: definitionFor(state, targetProgramId).id,
      trashedCardType: "program",
      trashedCount: 1,
    };
  }
}

function trashRunnerInstalledProgram(
  state: GameState,
  cardId: CardInstanceId,
): void {
  if (!state.runner.rig.programs.includes(cardId)) return;
  const hostedIds = hostedCardsOn(state, cardId);
  const backedUpHostedIds = backupProgramsOnMicrotechBeforeTrash(
    state,
    hostedIds,
  );
  for (const hostedId of hostedIds) {
    if (backedUpHostedIds.includes(hostedId)) continue;
    trashRunnerInstalledProgram(state, hostedId);
  }
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
  clearCardCounters(state, cardId);
}

function backupProgramsOnMicrotechBeforeTrash(
  state: GameState,
  candidateProgramIds: CardInstanceId[],
): CardInstanceId[] {
  const microtechId = microtechBackupDriveIds(state)[0];
  if (!microtechId) return [];
  const eligible = candidateProgramIds
    .filter((cardId) => state.runner.rig.programs.includes(cardId))
    .filter((cardId) => definitionFor(state, cardId).type === "program")
    .filter((cardId) => cardId !== microtechId)
    .sort();
  if (eligible.length <= 1) return [];
  for (const cardId of eligible) {
    if (runnerProgramUsesMemory(state, cardId))
      state.runner.memoryUsed = Math.max(
        0,
        state.runner.memoryUsed - (definitionFor(state, cardId).memoryCost ?? 0),
      );
    setHostedOn(state, cardId, microtechId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
      hostedOn: microtechId,
    };
  }
  return eligible;
}

function runnerProgramUsesMemory(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  if (!instance.hostedOn) return true;
  const hostDefinition = definitionFor(state, instance.hostedOn);
  if (
    (hostDefinition.type === "program" &&
      cardHasSubtype(hostDefinition, "daemon")) ||
    hostDefinition.id === MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID
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
  if (definition.type === "hardware" && (definition.memoryLimitBonus ?? 0) > 0)
    state.runner.memoryLimit = Math.max(
      0,
      state.runner.memoryLimit - (definition.memoryLimitBonus ?? 0),
    );
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
  clearCardCounters(state, cardId);
}

function trashCorpInstalledCardToArchives(
  state: GameState,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  for (const hostedId of hostedCardsOn(state, cardId)) {
    const hostedInstance = mustInstance(state.cardInstances, hostedId);
    if (hostedInstance.owner === "corp")
      trashCorpInstalledCardToArchives(state, hostedId, legalAction);
  }
  const instance = mustInstance(state.cardInstances, cardId);
  const definition = definitionFor(state, cardId);
  const rezzedNevinyrralLeftPlay =
    definition.id === NEVINYRRAL_ID && instance.rezzed === true;
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
  if (rezzedNevinyrralLeftPlay) {
    state.winner = "runner";
    state.gameEndReason = "nevinyrral_left_play";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.activeSide = "runner";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gameEndReason: "nevinyrral_left_play",
        sourceDefinitionId: NEVINYRRAL_ID,
      };
    }
  }
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

function rovingSubmarineIdsForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): CardInstanceId[] {
  return mustServer(state, serverId).root
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      return (
        instance?.rezzed === true &&
        definitionFor(state, cardId).id ===
        ROVING_SUBMARINE_AGENDA_DIFFICULTY_UPGRADE_ID
      );
    })
    .sort();
}

function clearRovingSubmarineActivityMarkers(state: GameState): void {
  for (const server of state.corp.servers) {
    for (const rovingId of rovingSubmarineIdsForServer(state, server.id)) {
      setCardCounter(state, rovingId, "mark", 0);
    }
  }
}

function markRovingSubmarineActivityForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  legalAction?: LegalAction,
): void {
  const rovingIds = rovingSubmarineIdsForServer(state, serverId);
  if (rovingIds.length === 0) return;
  for (const rovingId of rovingIds) setCardCounter(state, rovingId, "mark", 1);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      rovingSubmarineActivityMarked: true,
      rovingSubmarineSourceCount: rovingIds.length,
      targetServerLabel: publicServerLabel(state, serverId) ?? serverId,
    };
  }
}

function validateRovingSubmarineRunGate(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  const rovingIds = rovingSubmarineIdsForServer(state, serverId);
  if (rovingIds.length === 0) return;
  const hasActivity = rovingIds.some(
    (rovingId) => cardCounter(state, rovingId, "mark") > 0,
  );
  if (!hasActivity)
    throw new Error(
      "Roving Submarine erlaubt Runs auf dieses Fort nur nach Korp-Aktivitaet im letzten Korpzug.",
    );
}

function tokyoChibaUnsuccessfulRunBonus(
  state: GameState,
  run: GameState["run"],
  successful: boolean,
): { amount: number; sourceCardId?: CardInstanceId } {
  if (!run || successful) return { amount: 0 };
  const attackedServer = state.corp.servers.find(
    (server) => server.id === run.attackedServerId,
  );
  if (!attackedServer) return { amount: 0 };
  const sourceCardId = attackedServer.root.find((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return (
      instance.rezzed &&
      definitionFor(state, cardId).id === "onr_v1_371_tokyo-chiba-infighting"
    );
  });
  return sourceCardId ? { amount: 2, sourceCardId } : { amount: 0 };
}

function finishRun(
  state: GameState,
  successful: boolean,
  legalAction?: LegalAction,
): void {
  const run = state.run;
  if (run) applyDupreRunEndCounters(state, run);
  if (run && successful)
    applyV181SuccessfulRunCounterTriggers(state, run, legalAction);
  if (run && successful) {
    applySkivvissSuccessfulRunCounter(state, run, legalAction);
    applyBodyweightDataCrecheSuccessfulRun(state, run, legalAction);
  }
  if (run && successful && run.attackedServerId === "hq")
    ensureRunnerTurnFlags(state).successfulHqRunThisTurn = true;
  const allNighterBonusRunOnFinish =
    run?.grantAllNighterBonusRunOnFinish === true;
  const bonus = successful ? (run?.pendingSuccessBonusCredits ?? 0) : 0;
  const corpBonus = tokyoChibaUnsuccessfulRunBonus(state, run, successful);
  state.runner.credits += bonus;
  state.corp.credits += corpBonus.amount;
  if (run && corpBonus.amount > 0 && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      tokyoChibaInfightingBonus: true,
      sourceDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
      serverId: run.attackedServerId,
      corpCreditsGained: corpBonus.amount,
      corpCreditsAfter: state.corp.credits,
      ...(corpBonus.sourceCardId
        ? { sourceCardId: corpBonus.sourceCardId }
        : {}),
    };
  }
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

function applyDupreRunEndCounters(state: GameState, run: ActiveRun): void {
  const usedBreakerIds = run.dupreUsedBreakerIdsThisRun?.slice().sort() ?? [];
  for (const breakerId of usedBreakerIds) {
    const instance = state.cardInstances[breakerId];
    if (!instance || !state.runner.rig.programs.includes(breakerId)) continue;
    if (definitionFor(state, breakerId).id !== DUPRE_ID) continue;
    if (
      instance.selectedServerId &&
      instance.selectedServerId !== run.attackedServerId
    ) {
      setCardCounter(state, breakerId, "power", 0);
    }
    state.cardInstances[breakerId] = {
      ...mustInstance(state.cardInstances, breakerId),
      selectedServerId: run.attackedServerId,
    };
    addCardCounter(state, breakerId, "power", 1);
  }
}

function applySkivvissSuccessfulRunCounter(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  if (run.attackedServerId !== "rd") return;
  const sourceIds = state.runner.rig.programs
    .filter((cardId) => definitionFor(state, cardId).id === SKIVVISS_ID)
    .sort();
  if (sourceIds.length === 0) return;
  for (const cardId of sourceIds) addCardCounter(state, cardId, "virus", 1);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      skivvissCountersAdded: sourceIds.length,
      skivvissCounterTotal: sourceIds.reduce(
        (sum, cardId) => sum + cardCounter(state, cardId, "virus"),
        0,
      ),
    };
  }
}

function applyBodyweightDataCrecheSuccessfulRun(
  state: GameState,
  _run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const sourceId = state.runner.rig.hardware
    .slice()
    .sort()
    .find((cardId) => definitionFor(state, cardId).id === BODYWEIGHT_DATA_CRECHE_ID);
  if (!sourceId) return;
  const flags = ensureRunnerTurnFlags(state);
  if (
    flags.bodyweightDataCrecheExtraRunUsedThisTurn ||
    flags.bodyweightDataCrecheExtraRunPending
  )
    return;
  flags.bodyweightDataCrecheExtraRunPending = true;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn = true;
  flags.allNighterBonusRunPending = true;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      bodyweightDataCrecheExtraRunPending: true,
      sourceDefinitionId: BODYWEIGHT_DATA_CRECHE_ID,
    };
  }
}

function applyV181SuccessfulRunCounterTriggers(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const pattelsInstalled = runnerInstalledCardCountByDefinition(
    state,
    PATTELS_VIRUS_ID,
  );
  if (pattelsInstalled > 0) {
    const targetIceIds = (run.fullyBrokenIceIds ?? []).filter(
      (targetIceId) => state.cardInstances[targetIceId],
    );
    if (targetIceIds.length === 1) {
      const targetIceId = targetIceIds[0]!;
      addCardCounter(state, targetIceId, "virus", 1);
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v181RunnerProgramAbility: "pattels_virus_counter",
          pattelsVirusCounterAdded: 1,
          targetCardDefinitionId: definitionFor(state, targetIceId).id,
          remainingCounters: cardCounter(state, targetIceId, "virus"),
        };
      }
    } else if (targetIceIds.length > 1) {
      startPattelsVirusCounterChoice(state, targetIceIds, legalAction);
    }
  }
  const poxInstalled = runnerInstalledCardCountByDefinition(
    state,
    POX_ID,
  );
  if (poxInstalled > 0) {
    const serverId = run.attackedServerId;
    const current = poxCountersForServer(state, serverId);
    state.poxCountersByServer = {
      ...(state.poxCountersByServer ?? {}),
      [serverId]: current + 1,
    };
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v181RunnerProgramAbility: "pox_counter",
        poxCounterAdded: 1,
        poxCountersAfter: current + 1,
        targetServerLabel: publicServerLabel(state, serverId) ?? serverId,
      };
    }
  }
  if (run.attackedServerId === "hq") {
    for (const cardId of state.runner.rig.programs) {
      if (definitionFor(state, cardId).id !== BUTCHER_BOY_ID) continue;
      addCardCounter(state, cardId, "virus", 1);
    }
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

function startPattelsVirusCounterChoice(
  state: GameState,
  targetIceIds: CardInstanceId[],
  legalAction?: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = targetIceIds
    .filter((cardId) => state.cardInstances[cardId])
    .sort()
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: "Gebrochenes ICE",
        value: cardId,
      };
    });
  if (options.length === 0) return;
  state.pendingChoice = {
    choiceId: `v181_pattels_virus_${state.stateVersion + 1}`,
    side: "runner",
    source: `v181.pattels_virus:${options.map((option) => option.value).join(",")}:${state.stateVersion + 1}`,
    prompt: "Pattel's Virus: ICE für Virus-Counter wählen.",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v181RunnerProgramAbility: "pattels_virus_counter_choice",
      pattelsVirusCandidateCount: options.length,
      pattelsVirusChoiceOpened: true,
      choiceVisibility: "public",
    };
  }
}

function resolvePattelsVirusCounterChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v181.pattels_virus"))
    throw new Error("Es ist keine Pattel's-Virus-Choice offen.");
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selectedId);
  const targetIceId = typeof option?.value === "string" ? option.value : "";
  if (
    !targetIceId ||
    !choice.source.includes(targetIceId) ||
    !state.cardInstances[targetIceId]
  ) {
    throw new Error("Die Pattel's-Virus-Auswahl ist ungültig.");
  }
  addCardCounter(state, targetIceId, "virus", 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v181RunnerProgramAbility: "pattels_virus_counter",
    pattelsVirusCounterAdded: 1,
    targetCardDefinitionId: definitionFor(state, targetIceId).id,
    remainingCounters: cardCounter(state, targetIceId, "virus"),
    choiceVisibility: "public",
  };
  delete state.pendingChoice;
}

function endTurn(
  state: GameState,
  side: Side,
  legalAction: LegalAction,
): void {
  const polymerBreakthroughCreditsGained =
    side === "runner"
      ? state.corp.scoreArea.reduce((sum, cardId) => {
          return definitionFor(state, cardId).id === POLYMER_BREAKTHROUGH_ID
            ? sum + 1
            : sum;
        }, 0)
      : 0;
  if (side === "runner") {
    resolveSneakPreviewTemporaryInstallReturns(state, legalAction);
    const flags = ensureRunnerTurnFlags(state);
    flags.stoleAgendaLastTurn = flags.stoleAgendaThisTurn;
    flags.stoleAgendaThisTurn = false;
    flags.stoleResearchAgendaThisTurn = false;
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
    resolveAcmeSavingsAndLoanEndOfCorpTurn(state, legalAction);
    if (state.winner) return;
  }
  startDiscardPhase(state, side, legalAction);
  if (
    side === "runner" &&
    polymerBreakthroughCreditsGained > 0 &&
    state.activeSide === "corp"
  ) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      polymerBreakthroughCreditsGained,
      corpCreditsAfter: state.corp.credits,
    };
  }
}

function resolveSneakPreviewTemporaryInstallReturns(
  state: GameState,
  legalAction: LegalAction,
): void {
  const pending = state.sneakPreviewTemporaryInstalls ?? [];
  if (pending.length === 0) return;
  const returnedDefinitionIds: string[] = [];
  for (const entry of pending) {
    const cardId = entry.cardId;
    const instance = state.cardInstances[cardId];
    if (
      instance &&
      state.runner.rig.programs.includes(cardId) &&
      instance.zone.side === "runner" &&
      instance.zone.zone === "rig"
    ) {
      const definition = definitionFor(state, cardId);
      removeFromAllZones(state, cardId);
      state.runner.grip.push(cardId);
      if (runnerProgramUsesMemory(state, cardId)) {
        state.runner.memoryUsed = Math.max(
          0,
          state.runner.memoryUsed - (definition.memoryCost ?? 0),
        );
      }
      state.cardInstances[cardId] = {
        ...cardInstanceWithoutCounters(instance),
        faceup: true,
        rezzed: true,
        zone: { side: "runner", zone: "grip" },
      };
      returnedDefinitionIds.push(definition.id);
    }
  }
  state.sneakPreviewTemporaryInstalls = [];
  if (returnedDefinitionIds.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "sneak_preview_end_turn_return",
      returnedCount: returnedDefinitionIds.length,
      returnedCardDefinitionIds: returnedDefinitionIds.join(","),
    };
  }
}

function resolveAcmeSavingsAndLoanEndOfCorpTurn(
  state: GameState,
  legalAction: LegalAction,
): void {
  const obligations = acmeSavingsAndLoanObligationCount(state);
  if (obligations <= 0) return;
  const creditsBefore = state.corp.credits;
  if (creditsBefore < obligations) {
    state.winner = "runner";
    state.gameEndReason = "acme_savings_and_loan_unpaid";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    delete state.pendingChoice;
    delete state.run;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      acmeSavingsAndLoanAbility: "end_of_turn_payment",
      acmeSavingsAndLoanObligations: obligations,
      acmeSavingsAndLoanPaymentDue: obligations,
      acmeSavingsAndLoanPaymentPaid: 0,
      acmeSavingsAndLoanPaymentFailed: true,
      corpCreditsBefore: creditsBefore,
      corpCreditsAfter: state.corp.credits,
    };
    return;
  }
  state.corp.credits -= obligations;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    acmeSavingsAndLoanAbility: "end_of_turn_payment",
    acmeSavingsAndLoanObligations: obligations,
    acmeSavingsAndLoanPaymentDue: obligations,
    acmeSavingsAndLoanPaymentPaid: obligations,
    corpCreditsBefore: creditsBefore,
    corpCreditsAfter: state.corp.credits,
  };
}

function startDiscardPhase(
  state: GameState,
  side: Side,
  legalAction?: LegalAction,
): void {
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
    processDiscardStep(state, "runner", legalAction);
    return;
  }

  state.phase = "corp_discard_phase";
  state.timingPoint = "corp_discard.select_cards";
  processDiscardStep(state, "corp", legalAction);
}

function processDiscardStep(
  state: GameState,
  side: Side,
  legalAction?: LegalAction,
): void {
  const hand = handForSide(state, side);
  const requiredDiscardCount = hand.length - maxHandSize(state, side);
  if (requiredDiscardCount <= 0) {
    completeDiscardPhase(state, side, legalAction);
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

function completeDiscardPhase(
  state: GameState,
  side: Side,
  legalAction?: LegalAction,
): void {
  const effects: AutomaticEffectCollector = [];
  if (side === "runner") {
    startCorpTurn(state, effects);
    appendResolvedEffectsToPayload(legalAction, effects);
    return;
  }
  startRunnerTurn(state, effects);
  appendResolvedEffectsToPayload(legalAction, effects);
}

function appendResolvedEffectsToPayload(
  legalAction: LegalAction | undefined,
  effects: AutomaticEffectCollector,
): void {
  if (!legalAction || effects.length === 0) return;
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    ...effects,
  ];
}

function automaticGainCreditsEffect(
  effectId: string,
  side: Side,
  amount: number,
  sourceDefinitionId: CardDefinitionId,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "gain_credits",
    visibility: "public",
    side,
    amount,
    reason: "start_of_turn",
    sourceDefinitionId,
    sourceTitle: publicCardTitle(sourceDefinitionId),
  };
}

function automaticDrawCardsEffect(
  effectId: string,
  side: Side,
  amount: number,
  sourceDefinitionId: CardDefinitionId,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "draw_cards",
    visibility: "public",
    side,
    amount,
    reason: "start_of_turn",
    sourceDefinitionId,
    sourceTitle: publicCardTitle(sourceDefinitionId),
  };
}

function automaticTagEffect(
  effectId: string,
  amount: number,
  sourceDefinitionId: CardDefinitionId,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "add_tags",
    visibility: "public",
    side: "runner",
    amount,
    reason: "start_of_turn",
    sourceDefinitionId,
    sourceTitle: publicCardTitle(sourceDefinitionId),
  };
}

function automaticTrashCardEffect(
  effectId: string,
  side: Side,
  cardDefinitionId: CardDefinitionId,
  sourceDefinitionId: CardDefinitionId,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "trash_card",
    visibility: "public",
    side,
    reason: "start_of_turn",
    cardDefinitionId,
    cardTitle: publicCardTitle(cardDefinitionId),
    sourceDefinitionId,
    sourceTitle: publicCardTitle(sourceDefinitionId),
  };
}

function automaticCounterChangeEffect(
  effectId: string,
  side: Side,
  sourceDefinitionId: CardDefinitionId,
  counterType: CounterType,
  remainingCounters: number,
  addedCounterAmount: number,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "counter_change",
    visibility: "public",
    side,
    amount: remainingCounters,
    reason: "start_of_turn",
    counterType,
    remainingCounters,
    addedCounterAmount,
    sourceDefinitionId,
    sourceTitle: publicCardTitle(sourceDefinitionId),
  };
}

function automaticStealAgendaEffect(
  effectId: string,
  cardDefinitionId: CardDefinitionId,
  sourceDefinitionId: CardDefinitionId,
  amount: number,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "steal_agenda",
    visibility: "public",
    side: "runner",
    amount,
    reason: "start_of_turn",
    cardDefinitionId,
    cardTitle: publicCardTitle(cardDefinitionId),
    sourceDefinitionId,
    sourceTitle: publicCardTitle(sourceDefinitionId),
  };
}

function publicCardTitle(definitionId: CardDefinitionId): string {
  return DEMO_CARDS_BY_ID[definitionId]?.title ?? definitionId;
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

function startCorpTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  state.activeSide = "corp";
  state.phase = "corp_draw_phase";
  state.timingPoint = "corp_draw.mandatory_draw";
  state.corp.clicks = 3;
  state.runner.clicks = 0;
  clearValuPakProgramInstallFlags(state);
  clearRovingSubmarineActivityMarkers(state);
  ensureRunnerTurnFlags(state).damagePreventionUsage = {};
  applyCorpStartOfTurnEffects(state, effects);
}

function startRunnerTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  state.corp.clicks = 0;
  clearEdgerunnerTempsInstallFlags(state);
  const flags = ensureRunnerTurnFlags(state);
  flags.stoleAgendaThisTurn = false;
  flags.stoleAgendaLastTurn = false;
  flags.stoleResearchAgendaThisTurn = false;
  flags.stoleGrayOpsAgendaThisTurn = false;
  flags.stoleBlackOpsAgendaThisTurn = false;
  flags.runAttemptsThisTurn = 0;
  flags.runAttemptsLastTurn = 0;
  flags.successfulHqRunThisTurn = false;
  flags.damagePreventionUsage = {};
  flags.brokerActionCardIdsThisTurn = [];
  flags.startOfTurnFloatingCreditsApplied = false;
  flags.allNighterBonusRunPending = false;
  flags.valuPakProgramInstallActionsRemaining = 0;
  flags.valuPakTemporaryProgramInstallCredits = 0;
  flags.bodyweightDataCrecheExtraRunPending = false;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn = false;
  flags.startupImmolatorUsedSourceIdsThisTurn = [];
  delete flags.incubatorPendingTransforms;
  consumeRunnerFutureActionDebt(state);
  resolveBizarreEncryptionDelayedAgendas(state, effects);
  refreshRecurringCredits(state, "runner", effects);
  applyRunnerStartOfTurnEffects(state, effects);
}

function resolveBizarreEncryptionDelayedAgendas(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
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
    effects?.push(
      automaticStealAgendaEffect(
        `runner.start.bizarre_encryption.${entry.agendaId}`,
        definition.id,
        BIZARRE_ENCRYPTION_SCHEME_ID,
        agendaPointsForScoredCard(state, entry.agendaId),
      ),
    );
  }
  if (remaining.length > 0) state.bizarreEncryptionDelayedAgendas = remaining;
  else delete state.bizarreEncryptionDelayedAgendas;
}

function applyCorpStartOfTurnEffects(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const skivvissDraws = state.runner.rig.programs.reduce((sum, cardId) => {
    return definitionFor(state, cardId).id === SKIVVISS_ID
      ? sum + cardCounter(state, cardId, "virus")
      : sum;
  }, 0);
  if (skivvissDraws > 0) {
    drawCorpCards(state, skivvissDraws);
    effects?.push(
      automaticDrawCardsEffect(
        "corp.start.skivviss",
        "corp",
        skivvissDraws,
        SKIVVISS_ID,
      ),
    );
  }
  const polymerCount = state.corp.scoreArea.reduce((sum, cardId) => {
    return definitionFor(state, cardId).id === POLYMER_BREAKTHROUGH_ID
      ? sum + 1
      : sum;
  }, 0);
  if (polymerCount > 0) {
    credits(state, "corp", polymerCount);
    effects?.push(
      automaticGainCreditsEffect(
        "corp.start.polymer_breakthrough",
        "corp",
        polymerCount,
        POLYMER_BREAKTHROUGH_ID,
      ),
    );
  }
  for (const cardId of rezzedCorpRootCardIds(state)) {
    const definitionId = definitionFor(state, cardId).id;
    if (
      definitionId === KRUMZ_TRACE_ASSET_CARD_ID &&
      cardCounter(state, cardId, "bit") <= 0
    ) {
      setCardCounter(state, cardId, "bit", 1);
      effects?.push(
        automaticCounterChangeEffect(
          `corp.start.krumz.${cardId}`,
          "corp",
          definitionId,
          "bit",
          1,
          1,
        ),
      );
    }
    if (
      definitionId === PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID &&
      cardCounter(state, cardId, "bit") < PARIS_CITY_GRID_TRACE_POOL_BITS
    ) {
      setCardCounter(state, cardId, "bit", PARIS_CITY_GRID_TRACE_POOL_BITS);
    }
    if (definitionId === SPINN_PUBLIC_RELATIONS_TAG_ASSET_CARD_ID) {
      if (cardCounter(state, cardId, "bit") > 0) {
        spendCardCounter(state, cardId, "bit", 1);
        credits(state, "corp", 1);
        effects?.push(
          automaticGainCreditsEffect(
            `corp.start.spinn_public_relations.${cardId}`,
            "corp",
            1,
            definitionId,
          ),
        );
      }
      continue;
    }
    if (definitionId === HOLOVID_CAMPAIGN_ID) {
      if (cardCounter(state, cardId, "bit") > 0) {
        spendCardCounter(state, cardId, "bit", 1);
        credits(state, "corp", 1);
        effects?.push(
          automaticGainCreditsEffect(
            `corp.start.holovid_campaign.${cardId}`,
            "corp",
            1,
            definitionId,
          ),
        );
      }
      if (cardCounter(state, cardId, "bit") <= 0)
        trashCorpInstalledCardToArchives(state, cardId);
      continue;
    }
    if (CORP_RECURRING_ASSET_CARD_IDS.has(definitionId)) {
      credits(state, "corp", 1);
      effects?.push(
        automaticGainCreditsEffect(
          `corp.start.recurring_asset.${cardId}`,
          "corp",
          1,
          definitionId,
        ),
      );
    }
  }
  if (!state.pendingChoice) startCorporateNegotiatingCenterChoice(state);
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
    effects?.push(
      automaticGainCreditsEffect(
        "corp.start.employee_empowerment",
        "corp",
        employeeEmpowermentCount,
        EMPLOYEE_EMPOWERMENT_ID,
      ),
    );
  }
}

function applyRunnerStartOfTurnEffects(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const flags = ensureRunnerTurnFlags(state);
  const dataRavenCounters = Object.entries(state.cardInstances).reduce(
    (sum, [cardId, instance]) => {
      return definitionFor(state, cardId).id === DATA_RAVEN_ID
        ? sum + (instance.counters?.power ?? 0)
        : sum;
    },
    0,
  );
  if (dataRavenCounters > 0) {
    state.runner.tags += dataRavenCounters;
    effects?.push(
      automaticTagEffect(
        "runner.start.data_raven",
        dataRavenCounters,
        DATA_RAVEN_ID,
      ),
    );
  }
  for (const cardId of state.runner.rig.resources.slice().sort()) {
    if (definitionFor(state, cardId).id !== RIGGED_INVESTMENTS_ID) continue;
    if (cardCounter(state, cardId, "bit") <= 0) continue;
    spendCardCounter(state, cardId, "bit", 1);
    credits(state, "runner", 1);
    effects?.push(
      automaticGainCreditsEffect(
        `runner.start.rigged_investments.${cardId}`,
        "runner",
        1,
        RIGGED_INVESTMENTS_ID,
      ),
    );
    if (cardCounter(state, cardId, "bit") <= 0) {
      trashRunnerInstalledCardToHeap(state, cardId);
      effects?.push(
        automaticTrashCardEffect(
          `runner.start.rigged_investments.trash.${cardId}`,
          "runner",
          RIGGED_INVESTMENTS_ID,
          RIGGED_INVESTMENTS_ID,
        ),
      );
    }
  }
  if (!flags.startOfTurnFloatingCreditsApplied) {
    const butcherBoyCounterTotal = installedVirusCounterTotalForDefinition(
      state,
      BUTCHER_BOY_ID,
    );
    const butcherBoyCredits = Math.floor(butcherBoyCounterTotal / 2);
    if (butcherBoyCredits > 0) {
      credits(state, "runner", butcherBoyCredits);
      effects?.push(
        automaticGainCreditsEffect(
          "runner.start.butcher_boy",
          "runner",
          butcherBoyCredits,
          BUTCHER_BOY_ID,
        ),
      );
    }
    for (const cardId of state.runner.rig.resources) {
      const definition = definitionFor(state, cardId);
      if (definition.id === "onr_v1_163_floating-runner-bbs") {
        credits(state, "runner", 1);
        effects?.push(
          automaticGainCreditsEffect(
            `runner.start.floating_runner_bbs.${cardId}`,
            "runner",
            1,
            definition.id,
          ),
        );
      }
      if (definition.id === TOP_RUNNERS_CONFERENCE_ID) {
        credits(state, "runner", 3);
        effects?.push(
          automaticGainCreditsEffect(
            `runner.start.top_runners_conference.${cardId}`,
            "runner",
            3,
            definition.id,
          ),
        );
      }
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
    return state.corp.maxHandSize + corpAgendaMaxHandSizeModifier(state);
  return (
    state.runner.maxHandSize +
    runnerInstalledMaxHandSizeModifier(state) -
    state.runner.coreDamage
  );
}

function corpAgendaMaxHandSizeModifier(state: GameState): number {
  const agendaModifier = scoredCorpAgendaIds(state).some(
    (cardId) =>
      definitionFor(state, cardId).id ===
      MAIN_OFFICE_RELOCATION_HANDSIZE_AGENDA_ID,
  )
    ? 1
    : 0;
  const rustbeltModifier = rezzedCorpRootCardIds(state).reduce(
    (sum, cardId) =>
      definitionFor(state, cardId).id === RUSTBELT_HQ_BRANCH_ID
        ? sum + 2
        : sum,
    0,
  );
  return agendaModifier + rustbeltModifier;
}

function runnerInstalledMaxHandSizeModifier(state: GameState): number {
  return state.runner.rig.hardware.reduce((sum, cardId) => {
    const bonus = definitionFor(state, cardId).maxHandSizeBonus ?? 0;
    if (!Number.isInteger(bonus))
      throw new Error("Handlimit-Bonus ist ungueltig.");
    return sum + bonus;
  }, 0);
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

function drawRunnerCard(state: GameState): RunnerDrawSummary {
  const summary = emptyRunnerDrawSummary();
  const cardId = state.runner.stack.shift();
  if (!cardId) return summary;
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: { side: "runner", zone: "grip" },
  };
  summary.drawnCount = 1;
  const citySurveillanceIds = rezzedCorpRootCardIds(state).filter(
    (sourceId) =>
      definitionFor(state, sourceId).id === CITY_SURVEILLANCE_TAG_DAMAGE_ASSET_ID,
  );
  summary.citySurveillanceSourceCount = citySurveillanceIds.length;
  for (const _sourceId of citySurveillanceIds) {
    void _sourceId;
    if (state.runner.credits > 0) {
      spendCredits(state, "runner", 1);
      summary.citySurveillanceCreditsPaid += 1;
    } else {
      state.runner.tags += 1;
      summary.citySurveillanceTagsAdded += 1;
    }
  }
  return summary;
}

function drawRunnerCards(state: GameState, amount: number): RunnerDrawSummary {
  let summary = emptyRunnerDrawSummary();
  for (let index = 0; index < amount; index += 1)
    summary = mergeRunnerDrawSummary(summary, drawRunnerCard(state));
  return summary;
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
  const payload = (legalAction.payload ??= {});
  if (typeof event.payload.baseDamageAmount === "number")
    payload.baseDamageAmount = event.payload.baseDamageAmount;
  if (typeof event.payload.bioweaponsEngineeringModifier === "number")
    payload.bioweaponsEngineeringModifier =
      event.payload.bioweaponsEngineeringModifier;
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
  const bioweaponsModifier =
    request.damageType === "meat" && corpHasScoredBioweaponsEngineering(state)
      ? 1
      : 0;
  const amount = request.amount + bioweaponsModifier;
  return {
    eventId: `imminent_damage_${state.stateVersion + 1}_${sanitizeId(request.damageId)}`,
    eventType: "damage",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      damageId: request.damageId,
      damageType: request.damageType,
      amount,
      ...(bioweaponsModifier > 0
        ? {
            baseDamageAmount: request.amount,
            bioweaponsEngineeringModifier: bioweaponsModifier,
          }
        : {}),
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
    state,
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
  if (event.payload.cannotBePrevented === true) return [];
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
    if (
      definition.id === DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID &&
      damageType === "meat"
    ) {
      candidates.push({
        candidateId: `v1920_diplomatic_immunity_prevent_${sanitizeId(cardId)}_${amount}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: corpAgendaPointTotal(state) >= 1 ? "corp" : "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: 140,
        visibility: "hidden_info_barrier",
        optional: true,
        preventAmount: amount,
      });
      continue;
    }
    if (definition.id === ABLATIVE_COUNTER_HARDWARE_CARD_ID) {
      const remainingCounters = cardCounter(state, cardId, "power");
      if (remainingCounters <= 0) continue;
      candidates.push({
        candidateId: `v1913_armored_fridge_prevent_${sanitizeId(cardId)}_${remainingCounters}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: 120,
        visibility: "hidden_info_barrier",
        optional: true,
        preventAmount: 1,
      });
      continue;
    }
    if (
      definition.id === FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID &&
      damageType === "meat"
    ) {
      candidates.push({
        candidateId: `v1922_full_body_conversion_prevent_${sanitizeId(cardId)}_${amount}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "corp",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: 119,
        visibility: "hidden_info_barrier",
        optional: true,
        preventAmount: amount,
        bypassCostPerDamage: 1,
        bypassPaymentSide: "corp",
      });
      continue;
    }
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
  if (event.payload.cannotBePrevented === true) return [];
  const candidates: ReplacementCandidate[] = [];
  const damageAmount = numberPayload(event, "amount");
  if (
    event.affectedSide === "runner" &&
    damageAmount > state.runner.grip.length
  ) {
    const arasakaId = state.runner.grip.find(
      (cardId) =>
        definitionFor(state, cardId).id ===
        ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    );
    if (arasakaId) {
      candidates.push({
        candidateId: `v1919_arasaka_owns_you_${arasakaId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: arasakaId,
          definitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
          label: "Arasaka Owns You",
        },
        replacesEventType: "damage",
        replacementEventType: "add_tag",
        priority: 80,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
    const emergencySelfConstructId = state.runner.rig.programs.find(
      (cardId) =>
        definitionFor(state, cardId).id === EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    );
    if (emergencySelfConstructId) {
      candidates.push({
        candidateId: `v1920_emergency_self_construct_${emergencySelfConstructId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: emergencySelfConstructId,
          definitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
          label: "Emergency Self-Construct",
        },
        replacesEventType: "damage",
        replacementEventType: "prevent_damage",
        priority: 82,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
  }
  const harness = state.eventModificationHarness?.damageReplacement;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return candidates;
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
  if (!state.eventModificationHarness?.damageReplacementConflict)
    return [...candidates, base];
  return [
    ...candidates,
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
        label:
          candidate.sourceRef.definitionId ===
          ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID
            ? "Arasaka Owns You spielen"
            : candidate.sourceRef.definitionId ===
                EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID
              ? "Emergency Self-Construct ausloesen"
              : `Damage durch ${candidate.tagAmount ?? 1} Tag ersetzen`,
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
  state: GameState,
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
  const diplomaticImmunityCancel =
    candidate.sourceRef.definitionId ===
      DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID &&
    candidate.controller === "corp";
  if (
    candidate.sourceRef.definitionId ===
      FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID &&
    candidate.bypassPaymentSide === "corp" &&
    candidate.bypassCostPerDamage === 1
  ) {
    const maxBypass = Math.min(amount, state.corp.credits);
    const options: ChoiceRequest["options"] = [];
    for (let paid = 0; paid <= maxBypass; paid += 1) {
      options.push({
        id: `full_body_conversion_pay_${paid}`,
        label:
          paid === 0
            ? "0 Credits zahlen: gesamten Meat Damage verhindern"
            : `${paid} Credits zahlen: ${paid} Meat Damage durchlassen`,
        publicLabel: "Event Modification",
        value: paid,
      });
    }
    return {
      choiceId: `v120_choice_${window.windowId}`,
      side: window.side,
      source: `v120.event_modification.${window.kind}`,
      prompt: "Full Body Conversion",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion,
      visibility: candidate.visibility,
    };
  }
  const options = [
    {
      id: "pass",
      label: diplomaticImmunityCancel
        ? "1 Agenda-Punkt zahlen und Prevention canceln"
        : "Nicht verhindern",
      publicLabel: "Event Modification",
    },
    {
      id: candidate.candidateId,
      label:
        diplomaticImmunityCancel
          ? "Diplomatic Immunity wirken lassen"
          : candidate.sourceRef.kind === "card"
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
    const diplomaticImmunityCancel =
      window.candidates[0]?.sourceRef.definitionId ===
        DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID &&
      window.side === "corp";
    let agendaPointCostPaid = 0;
    let forfeitedAgendaDefinitionIds = "";
    if (diplomaticImmunityCancel) {
      const forfeitedAgendaIds = chooseCorpAgendasForPointCost(state, 1);
      agendaPointCostPaid = forfeitedAgendaIds.reduce(
        (sum, cardId) => sum + agendaPointsForScoredCard(state, cardId),
        0,
      );
      if (agendaPointCostPaid < 1)
        throw new Error("Diplomatic Immunity kann nicht gecancelt werden.");
      forfeitedAgendaDefinitionIds = forfeitedAgendaIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(",");
      for (const agendaId of forfeitedAgendaIds)
        forfeitCorpAgendaForPointCost(state, agendaId);
    }
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: diplomaticImmunityCancel ? "cancel" : "pass",
      eventModificationOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
      ...(diplomaticImmunityCancel
        ? {
            sourceDefinitionId: DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID,
            agendaPointCost: 1,
            agendaPointCostPaid,
            forfeitedAgendaDefinitionIds,
            specialZone: "removed_from_game",
            specialZoneVisibility: "public",
            specialZoneReason: "diplomatic_immunity_cancel",
          }
        : {}),
    };
    setDamagePayload(legalAction, summary);
    clearEventModificationState(state);
    return;
  }
  if (selected.startsWith("full_body_conversion_pay_")) {
    const candidate = window.candidates[0];
    if (
      !candidate ||
      candidate.sourceRef.definitionId !==
        FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID ||
      candidate.bypassPaymentSide !== "corp" ||
      candidate.bypassCostPerDamage !== 1 ||
      window.side !== "corp" ||
      event.eventType !== "damage" ||
      event.affectedSide !== "runner" ||
      damageTypePayload(event) !== "meat"
    ) {
      throw new Error("Full Body Conversion passt nicht zum Fenster.");
    }
    const bypassPaid = Number(selected.replace("full_body_conversion_pay_", ""));
    const originalAmount = numberPayload(event, "amount");
    if (
      !Number.isInteger(bypassPaid) ||
      bypassPaid < 0 ||
      bypassPaid > originalAmount ||
      bypassPaid > state.corp.credits
    ) {
      throw new Error("Full Body Conversion-Bypass ist nicht bezahlbar.");
    }
    revalidateDamagePreventionCandidateSource(state, candidate);
    spendCredits(state, "corp", bypassPaid);
    const preventedAmount = Math.max(0, originalAmount - bypassPaid);
    const finalAmount = bypassPaid;
    const summary = resolveDamageImminentEvent(state, {
      ...event,
      payload: { ...event.payload, amount: finalAmount },
    });
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "apply",
      eventModificationOutcome:
        finalAmount === 0
          ? "prevented"
          : finalAmount === originalAmount
            ? "original_resolved"
            : "partially_prevented",
      candidateId: candidate.candidateId,
      originalAmount,
      preventedAmount,
      finalAmount,
      sourceKind: candidate.sourceRef.kind,
      sourceDefinitionId: FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID,
      fullBodyConversionCorpBypassPaid: bypassPaid,
      fullBodyConversionBypassCostPerDamage: 1,
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
  revalidateDamagePreventionCandidateSource(state, candidate);
  const originalAmount = numberPayload(event, "amount");
  const preventedAmount = Math.min(
    candidate.preventAmount ?? 0,
    originalAmount,
  );
  const finalAmount = Math.max(0, originalAmount - preventedAmount);
  registerDamagePreventionUsage(state, candidate, preventedAmount);
  const preventionCostPayload = applyRuntimeDamagePreventionCost(
    state,
    candidate,
    preventedAmount,
  );
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
    ...(candidate.sourceRef.definitionId
      ? { sourceDefinitionId: candidate.sourceRef.definitionId }
      : {}),
    ...preventionCostPayload,
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
    candidate.sourceRef.definitionId ===
    ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID
  ) {
    resolveArasakaOwnsYouReplacement(state, legalAction, event, candidate);
    clearReplacementState(state);
    return;
  }
  if (candidate.sourceRef.definitionId === EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID) {
    resolveEmergencySelfConstructReplacement(
      state,
      legalAction,
      event,
      candidate,
    );
    clearReplacementState(state);
    return;
  }
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

function resolveArasakaOwnsYouReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
): void {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.grip.includes(cardId))
    throw new Error("Arasaka Owns You ist nicht in der Grip verfuegbar.");
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const removedTags = state.runner.tags;
  const coreDamageRemoved = state.runner.coreDamage;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
  state.runner.coreDamage = 0;
  const targetHandSize = maxHandSize(state, "runner");
  let drawnCards = 0;
  while (state.runner.grip.length < targetHandSize && state.runner.stack.length > 0) {
    drawRunnerCard(state);
    if (state.winner) break;
    drawnCards += 1;
  }
  credits(state, "runner", 10);
  state.runner.tags = 0;
  addRunnerFutureActionDebt(state, 4);
  state.runnerAgendaPointsToForfeit =
    Math.max(0, Math.floor(state.runnerAgendaPointsToForfeit ?? 0)) + 3;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    v1919RunnerEventAbility: "arasaka_owns_you_flatline_replacement",
    sourceDefinitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    cardDefinitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    trashedCardDefinitionId: ARASAKA_OWNS_YOU_FLATLINE_REPLACEMENT_EVENT_ID,
    coreDamageRemoved,
    drawnCards,
    gainedCredits: 10,
    removedTags,
    runnerTagsAfter: state.runner.tags,
    futureActionDebtAdded: 4,
    futureAgendaPointForfeitAdded: 3,
    futureAgendaPointForfeitPending: state.runnerAgendaPointsToForfeit,
    sourceKind: "card",
  };
}

function resolveEmergencySelfConstructReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
): void {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.rig.programs.includes(cardId))
    throw new Error("Emergency Self-Construct ist nicht installiert.");
  if (definitionFor(state, cardId).id !== EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID)
    throw new Error("Die Emergency-Self-Construct-Quelle passt nicht.");
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const coreDamageRemoved = state.runner.coreDamage;
  const gripCardsLost = state.runner.grip.length;
  for (const gripCardId of state.runner.grip.slice()) {
    removeFromAllZones(state, gripCardId);
    state.runner.heap.push(gripCardId);
    state.cardInstances[gripCardId] = {
      ...mustInstance(state.cardInstances, gripCardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
  }
  state.runner.coreDamage = 0;
  state.runner.maxHandSize = Math.max(0, state.runner.maxHandSize - 1);
  trashRunnerInstalledCardToHeap(state, cardId);
  addRunnerFutureActionDebt(state, 3);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    v1920RunnerProgramAbility: "emergency_self_construct_flatline_replacement",
    sourceDefinitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    cardDefinitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    trashedCardDefinitionId: EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
    coreDamageRemoved,
    gripCardsLost,
    runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
    futureActionDebtAdded: 3,
    futureActionDebtPending: state.runnerTurnFlags?.forgoNextActionsPending ?? 0,
    sourceKind: "card",
  };
}

function windowConsumeReplacementCandidate(
  state: GameState,
  candidateId: string,
): void {
  const consumed = state.replacementWindow?.consumedCandidateIds;
  if (consumed && !consumed.includes(candidateId)) consumed.push(candidateId);
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

function applyRuntimeDamagePreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): Record<string, unknown> {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId ||
    candidate.sourceRef.definitionId !== ABLATIVE_COUNTER_HARDWARE_CARD_ID
  ) {
    return {};
  }
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!state.runner.rig.hardware.includes(sourceCardId))
    throw new Error("Armored Fridge ist nicht mehr installiert.");
  if (cardCounter(state, sourceCardId, "power") <= 0)
    throw new Error("Armored Fridge hat keine Ablative Counter mehr.");
  spendCardCounter(state, sourceCardId, "power", 1);
  const remainingCounters = cardCounter(state, sourceCardId, "power");
  const sourceTrashed = remainingCounters <= 0;
  if (sourceTrashed) trashRunnerInstalledCardToHeap(state, sourceCardId);
  return {
    counterType: "power",
    removedCounterAmount: 1,
    remainingCounters,
    sourceTrashed,
  };
}

function revalidateDamagePreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    return;
  const sourceCardId = candidate.sourceRef.instanceId;
  const expectedDefinitionId = candidate.sourceRef.definitionId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Prevention-Quelle ist nicht mehr installiert.");
  if (
    expectedDefinitionId &&
    definitionFor(state, sourceCardId).id !== expectedDefinitionId
  ) {
    throw new Error("Die Prevention-Quelle passt nicht mehr zur Karte.");
  }
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
  subtype: "research" | "gray_ops" | "black_ops",
): boolean {
  if (subtype === "research")
    return state.runnerTurnFlags?.stoleResearchAgendaThisTurn === true;
  if (subtype === "gray_ops")
    return state.runnerTurnFlags?.stoleGrayOpsAgendaThisTurn === true;
  return state.runnerTurnFlags?.stoleBlackOpsAgendaThisTurn === true;
}

function runnerHasInstalledCorporateAlly(state: GameState): boolean {
  return state.runner.rig.resources.some(
    (cardId) => definitionFor(state, cardId).id === "onr_v1_156_corporate-ally",
  );
}

function runnerUsedBrokerThisTurn(
  state: GameState,
  brokerId: CardInstanceId,
): boolean {
  return (
    ensureRunnerTurnFlags(state).brokerActionCardIdsThisTurn?.includes(
      brokerId,
    ) === true
  );
}

function markBrokerUsedThisTurn(
  state: GameState,
  brokerId: CardInstanceId,
): void {
  const flags = ensureRunnerTurnFlags(state);
  const used = flags.brokerActionCardIdsThisTurn ?? [];
  if (!used.includes(brokerId)) used.push(brokerId);
  flags.brokerActionCardIdsThisTurn = used.slice().sort();
}

function corpHasScoredExecutiveExtraction(state: GameState): boolean {
  return scoredCorpAgendaIds(state).some(
    (cardId) =>
      definitionFor(state, cardId).id === "onr_v1_201_executive-extraction",
  );
}

function corpHasScoredBioweaponsEngineering(state: GameState): boolean {
  return scoredCorpAgendaIds(state).some(
    (cardId) =>
      definitionFor(state, cardId).id ===
      BIOWEAPONS_ENGINEERING_CORE_DAMAGE_AGENDA_ID,
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
  difficulty += serverDifficultyIncreaseFromFaitAccompli(state, agendaId);
  difficulty -= serverDifficultyReductionFromUpgrades(state, agendaId);
  return Math.max(0, difficulty);
}

function serverDifficultyIncreaseFromFaitAccompli(
  state: GameState,
  agendaId: CardInstanceId,
): number {
  const zone = mustInstance(state.cardInstances, agendaId).zone;
  if (zone.side !== "corp" || zone.zone !== "serverRoot" || !zone.serverId)
    return 0;
  return Math.max(
    0,
    Math.floor(state.faitAccompliCountersByServer?.[zone.serverId] ?? 0),
  );
}

function serverDifficultyReductionFromUpgrades(
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
    const definitionId = definitionFor(state, rootCardId).id;
    if (definitionId === CRYSTAL_PALACE_COUNTER_UPGRADE_ID)
      return sum + cardCounter(state, rootCardId, "power");
    return SERVER_DIFFICULTY_UPGRADE_CARD_IDS.has(definitionId) ? sum + 1 : sum;
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

function acmeSavingsAndLoanObligationCount(state: GameState): number {
  return Math.max(0, Math.floor(state.acmeSavingsAndLoanObligations ?? 0));
}

function addAcmeSavingsAndLoanObligation(
  state: GameState,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error("ACME-Verpflichtungsmenge ist ungueltig.");
  state.acmeSavingsAndLoanObligations =
    acmeSavingsAndLoanObligationCount(state) + amount;
}

function removeAcmeSavingsAndLoanObligation(state: GameState): void {
  const current = acmeSavingsAndLoanObligationCount(state);
  if (current <= 0)
    throw new Error("Es gibt keine ACME-Savings-and-Loan-Verpflichtung.");
  state.acmeSavingsAndLoanObligations = current - 1;
}

type CorpAgendaPointCostResult = {
  paidPoints: number;
  bonusPointsSpent: number;
  forfeitedAgendaIds: CardInstanceId[];
  forfeitedAgendaDefinitionIds: CardDefinitionId[];
};

function spendCorpAgendaPointCost(
  state: GameState,
  requiredPoints: number,
): CorpAgendaPointCostResult {
  if (!Number.isInteger(requiredPoints) || requiredPoints <= 0)
    throw new Error("Agenda-Punkt-Kosten sind ungueltig.");
  let remaining = requiredPoints;
  let paidPoints = 0;
  const bonusBefore = Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0));
  const bonusPointsSpent = Math.min(bonusBefore, remaining);
  if (bonusPointsSpent > 0) {
    state.corpBonusAgendaPoints = bonusBefore - bonusPointsSpent;
    remaining -= bonusPointsSpent;
    paidPoints += bonusPointsSpent;
  }
  const forfeitedAgendaIds: CardInstanceId[] = [];
  const forfeitedAgendaDefinitionIds: CardDefinitionId[] = [];
  if (remaining > 0) {
    for (const agendaId of corpScoredAgendaForfeitTargets(state)) {
      const points = agendaPointsForScoredCard(state, agendaId);
      forfeitedAgendaIds.push(agendaId);
      forfeitedAgendaDefinitionIds.push(definitionFor(state, agendaId).id);
      paidPoints += points;
      remaining -= points;
      forfeitCorpAgendaForPointCost(state, agendaId);
      if (remaining <= 0) break;
    }
  }
  if (paidPoints < requiredPoints)
    throw new Error("Die Korp hat nicht genug Agenda-Punkte.");
  return {
    paidPoints,
    bonusPointsSpent,
    forfeitedAgendaIds,
    forfeitedAgendaDefinitionIds,
  };
}

function installedAgendaOperationTarget(
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

function corpAgendaCounterOperationTarget(
  state: GameState,
): CardInstanceId | undefined {
  const scored = state.corp.scoreArea.slice().sort()[0];
  if (scored) return scored;
  return installedAgendaOperationTarget(state);
}

function corpScoredAgendaForfeitTarget(
  state: GameState,
): CardInstanceId | undefined {
  return corpScoredAgendaForfeitTargets(state)[0];
}

function corpScoredAgendaForfeitTargets(
  state: GameState,
): CardInstanceId[] {
  return state.corp.scoreArea
    .slice()
    .sort((left, right) => {
      const byPoints =
        agendaPointsForScoredCard(state, left) -
        agendaPointsForScoredCard(state, right);
      return byPoints !== 0 ? byPoints : left.localeCompare(right);
    })
    .filter((cardId) => agendaPointsForScoredCard(state, cardId) >= 1);
}

function resolveAgendaCounterOperation(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
): void {
  const targetAgendaId = corpAgendaCounterOperationTarget(state);
  if (!targetAgendaId)
    throw new Error("Die V1.9.19-Counter-Operation findet kein Agenda-Ziel.");
  if (!COUNTER_OPERATION_CARD_IDS.has(sourceDefinitionId))
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

function advanceableInstalledCardTargets(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((server) =>
      server.root
        .slice()
        .sort()
        .filter((cardId) => {
          const definition = definitionFor(state, cardId);
          return (
            definition.type === "agenda" ||
            definition.id === EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID ||
            definition.id ===
              INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID ||
            definition.id === VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID
          );
        }),
    );
}

function resolveManagementShakeUpOperation(
  state: GameState,
  legalAction: LegalAction,
): void {
  const targets = advanceableInstalledCardTargets(state);
  if (targets.length === 0)
    throw new Error("Management Shake-Up findet keine advancebare Karte.");
  const placements: Record<CardInstanceId, number> = {};
  for (let index = 0; index < 3; index += 1) {
    const targetId = mustArrayValue(
      targets,
      index % targets.length,
      "Management-Shake-Up-Ziel fehlt.",
    );
    placements[targetId] = (placements[targetId] ?? 0) + 1;
  }
  for (const [targetId, amount] of Object.entries(placements)) {
    mustInstance(state.cardInstances, targetId).advancementCounters += amount;
  }
  const targetCount = Object.keys(placements).length;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1919OperationAbility: "add_advancement_counters",
    addedAdvancementCounters: 3,
    targetCount,
    managementShakeUpDistribution: Object.entries(placements)
      .map(([targetId, amount]) => `${sanitizeId(targetId)}:${amount}`)
      .join(","),
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
  if (OVERADVANCE_AGENDA_CARD_IDS.has(definition.id)) {
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
        ? 15
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
  if (definition.id === CORPORATE_RETREAT_INSTALL_CREDIT_AGENDA_ID) {
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
  if (definition.id === CORPORATE_WAR_SCORE_CREDIT_AGENDA_ID) {
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
  if (definition.id === DATA_FORT_RECLAMATION_REINSTALL_AGENDA_ID && legalAction) {
    startDataFortReclamationChoice(state, cardId, legalAction);
  }
  if (definition.id === ICE_TRANSMUTATION_AGENDA_ID && legalAction) {
    startIceTransmutationChoice(state, cardId, legalAction);
  }
  if (definition.id === "onr_v1_212_priority-requisition" && legalAction) {
    startPriorityRequisitionChoice(state, cardId, legalAction);
  }
  if (definition.id === ENCRYPTION_BREAKTHROUGH_ID && legalAction) {
    const codeGateIds = corpInstalledCardIds(state)
      .filter(
        (iceId) =>
          mustInstance(state.cardInstances, iceId).zone.zone === "serverIce" &&
          cardHasSubtype(definitionFor(state, iceId), "code_gate"),
      )
      .sort();
    let rezzedCodeGateCount = 0;
    const publicRevealDefinitionIds: CardDefinitionId[] = [];
    for (const iceId of codeGateIds) {
      const instance = mustInstance(state.cardInstances, iceId);
      if (instance.rezzed) rezzedCodeGateCount += 1;
      if (!instance.faceup) {
        state.cardInstances[iceId] = { ...instance, faceup: true };
      }
      publicRevealDefinitionIds.push(definitionFor(state, iceId).id);
    }
    if (codeGateIds.length > 0) credits(state, "corp", codeGateIds.length);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      agendaAbility: "encryption_breakthrough",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "encryption_breakthrough_reveal_code_gates",
      revealedCount: codeGateIds.length,
      rezzedCodeGateCount,
      gainedCredits: codeGateIds.length,
      corpCreditsAfter: state.corp.credits,
      publicRevealDefinitionIds: publicRevealDefinitionIds.join(","),
    };
  }
  if (definition.id === SECURITY_NET_OPTIMIZATION_ID && legalAction) {
    const selectedServerId =
      typeof legalAction.payload?.selectedServerId === "string"
        ? String(legalAction.payload.selectedServerId)
        : instanceBefore.zone.side === "corp" &&
            instanceBefore.zone.zone === "serverRoot"
          ? instanceBefore.zone.serverId
          : undefined;
    if (!selectedServerId || selectedServerId === "new_remote")
      throw new Error("Security Net Optimization braucht einen gueltigen Fort.");
    mustServer(state, selectedServerId as Exclude<ServerId, "new_remote">);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      selectedServerId: selectedServerId as Exclude<ServerId, "new_remote">,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      securityNetOptimizationActive: true,
      selectedServerId,
      securityNetOptimizationServerId: selectedServerId,
    };
  }
  if (definition.id === SECURITY_PURGE_PURGE_AGENDA_ID && legalAction) {
    resolveSecurityPurgeAgendaPurge(state, legalAction);
  }
  cleanupEmptyRemotes(state);
}

function priorityRequisitionCandidates(state: GameState): CardInstanceId[] {
  return Object.entries(state.cardInstances)
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
}

function startPriorityRequisitionChoice(
  state: GameState,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const candidates = priorityRequisitionCandidates(state);
  if (candidates.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      priorityRequisitionChoiceOpened: false,
      priorityRequisitionCandidateCount: 0,
    };
    return;
  }
  state.pendingChoice = {
    choiceId: `v162_priority_requisition_${state.stateVersion + 1}`,
    side: "corp",
    source: `v162.priority_requisition:${agendaId}:${state.stateVersion + 1}`,
    prompt: "Priority Requisition: ICE kostenlos rezzen",
    kind: "select_cards",
    options: candidates.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      publicLabel: "Installiertes ICE",
      value: cardId,
    })),
    minSelections: 0,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    priorityRequisitionChoiceOpened: true,
    priorityRequisitionCandidateCount: candidates.length,
  };
}

function resolvePriorityRequisitionChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v162.priority_requisition"))
    throw new Error("Es ist keine Priority-Requisition-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Priority Requisition resolven.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !state.corp.scoreArea.includes(agendaId) ||
    definitionFor(state, agendaId).id !== "onr_v1_212_priority-requisition"
  ) {
    throw new Error("Priority Requisition ist nicht mehr in der Korp-ScoreArea.");
  }
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length > 1)
    throw new Error("Priority Requisition darf hoechstens ein ICE rezzen.");
  const targetId = selectedIds[0];
  if (!targetId) {
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      priorityRequisitionFreeRez: false,
      priorityRequisitionDeclined: true,
    };
    return;
  }
  const optionValues = new Set(
    choice.options
      .map((option) => option.value)
      .filter((value): value is string => typeof value === "string"),
  );
  const instance = state.cardInstances[targetId];
  if (
    !optionValues.has(targetId) ||
    !instance ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverIce" ||
    instance.rezzed
  ) {
    throw new Error("Das Priority-Requisition-Ziel ist nicht mehr gueltig.");
  }
  state.cardInstances[targetId] = {
    ...instance,
    faceup: true,
    rezzed: true,
  };
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v162_priority_requisition_free_rez",
    priorityRequisitionFreeRez: true,
    priorityRequisitionTarget: targetId,
    priorityRequisitionTargetDefinitionId: definitionFor(state, targetId).id,
    rezCostPaid: 0,
  };
}

function resolveSecurityPurgeAgendaPurge(
  state: GameState,
  legalAction: LegalAction,
): void {
  const revealedIds = state.corp.rd.slice(0, 3);
  const installedIce: Array<{ cardId: CardInstanceId; serverId: string }> = [];
  const trashedIds: CardInstanceId[] = [];
  for (const cardId of revealedIds) {
    const definition = definitionFor(state, cardId);
    removeFromAllZones(state, cardId);
    if (definition.type === "ice") {
      const server = createRemote(state);
      server.ice.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        rezzed: true,
        zone: { side: "corp", zone: "serverIce", serverId: server.id },
      };
      installedIce.push({ cardId, serverId: server.id });
    } else {
      state.corp.archives.unshift(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        rezzed: true,
        zone: { side: "corp", zone: "archives" },
      };
      trashedIds.push(cardId);
    }
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: "v1922_security_purge",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_security_purge_rd_top3",
    publicRevealKind: "reveal",
    revealedCount: revealedIds.length,
    installedIceCount: installedIce.length,
    trashedCount: trashedIds.length,
    securityPurgeInstallContract: "new_remote_per_ice_reveal_order",
    securityPurgeWaivesPrintedRezCosts: true,
    publicRevealDefinitionIds: revealedIds
      .map((id) => definitionFor(state, id).id)
      .join(","),
    installedIceDefinitionIds: installedIce
      .map((entry) => definitionFor(state, entry.cardId).id)
      .join(","),
    trashedDefinitionIds: trashedIds
      .map((id) => definitionFor(state, id).id)
      .join(","),
  };
}

function startDataFortReclamationChoice(
  state: GameState,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = state.corp.hq
    .filter((cardId) => isCorpInstallableCardType(definitionFor(state, cardId)))
    .sort()
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922CorpAgendaAbility: "data_fort_reclamation",
      dataFortReclamationChoiceOpened: false,
      dataFortReclamationCandidateCount: 0,
    };
    return;
  }
  state.pendingChoice = {
    choiceId: `choice_v1922_data_fort_reclamation_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.data_fort_reclamation:${agendaId}:${state.stateVersion + 1}`,
    prompt: "Data Fort Reclamation: HQ-Karten fuer neues Data Fort waehlen.",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(4, options.length),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922CorpAgendaAbility: "data_fort_reclamation",
    dataFortReclamationChoiceOpened: true,
    dataFortReclamationCandidateCount: options.length,
    dataFortReclamationMaxSelections: Math.min(4, options.length),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_data_fort_reclamation_hq_choice",
  };
}

function resolveDataFortReclamationChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.data_fort_reclamation"))
    throw new Error("Data-Fort-Reclamation-Choice ist nicht offen.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    definitionFor(state, agendaId as CardInstanceId).id !==
      DATA_FORT_RECLAMATION_REINSTALL_AGENDA_ID
  )
    throw new Error("Data Fort Reclamation ist nicht gescored.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const selectedSet = new Set(selectedIds);
  if (selectedSet.size !== selectedIds.length)
    throw new Error("Eine HQ-Karte wurde doppelt gewaehlt.");
  if (selectedIds.some((cardId) => !state.corp.hq.includes(cardId)))
    throw new Error("Eine gewaehlte Karte liegt nicht mehr in HQ.");
  if (
    selectedIds.some(
      (cardId) => !isCorpInstallableCardType(definitionFor(state, cardId)),
    )
  )
    throw new Error("Eine gewaehlte Karte ist nicht installierbar.");
  const server = createRemote(state);
  let installedIceCount = 0;
  let installedRootCount = 0;
  const installedIds: CardInstanceId[] = [];
  for (const cardId of selectedIds) {
    const definition = definitionFor(state, cardId);
    removeFromAllZones(state, cardId);
    if (definition.type === "ice") {
      server.ice.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "serverIce", serverId: server.id },
      };
      installedIceCount += 1;
      installedIds.push(cardId);
      continue;
    }
    if (!canInstallCorpRootCardInServer(state, definition, server))
      throw new Error("Diese Root-Karte kann nicht in das neue Remote.");
    server.root.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverRoot", serverId: server.id },
    };
    installedRootCount += 1;
    installedIds.push(cardId);
  }
  const rezCandidates = installedIds.filter((cardId) =>
    isDataFortReclamationRezCandidate(state, cardId, server.id),
  );
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
    selectedCount: selectedIds.length,
    installedCount: installedIceCount + installedRootCount,
    installedIceCount,
    installedRootCount,
    createdServerId: server.id,
    temporaryCreditsProvided: 10,
    temporaryCreditsSpent: 0,
    corpCreditsSpent: 0,
    temporaryCreditsRemaining: 10,
    dataFortReclamationRezChoiceOpened: rezCandidates.length > 0,
    dataFortReclamationRezCandidateCount: rezCandidates.length,
  };
  if (rezCandidates.length === 0) return;
  state.pendingChoice = {
    choiceId: `choice_v1922_data_fort_reclamation_rez_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.data_fort_reclamation_rez:${agendaId}:${server.id}:10:${state.stateVersion + 1}`,
    prompt: "Data Fort Reclamation: installierte Karten rezzen.",
    kind: "select_cards",
    options: rezCandidates.sort().map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 0,
    maxSelections: rezCandidates.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function isDataFortReclamationRezCandidate(
  state: GameState,
  cardId: CardInstanceId,
  serverId: string,
): boolean {
  const instance = mustInstance(state.cardInstances, cardId);
  const definition = definitionFor(state, cardId);
  if (instance.rezzed) return false;
  if (instance.zone.side !== "corp") return false;
  if (
    instance.zone.zone !== "serverIce" &&
    instance.zone.zone !== "serverRoot"
  )
    return false;
  if (instance.zone.serverId !== serverId) return false;
  if (definition.type === "ice") return instance.zone.zone === "serverIce";
  return (
    instance.zone.zone === "serverRoot" &&
    (definition.type === "asset" || definition.type === "upgrade")
  );
}

function resolveDataFortReclamationRezChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("v1922.data_fort_reclamation_rez")
  )
    throw new Error("Data-Fort-Reclamation-Rez-Choice ist nicht offen.");
  const [, agendaId, serverId, temporaryCreditText] = choice.source.split(":");
  if (
    !serverId ||
    !agendaId ||
    !state.corp.scoreArea.includes(agendaId as CardInstanceId) ||
    definitionFor(state, agendaId as CardInstanceId).id !==
      DATA_FORT_RECLAMATION_REINSTALL_AGENDA_ID
  )
    throw new Error("Data Fort Reclamation ist nicht gescored.");
  mustServer(state, serverId);
  let temporaryCreditsRemaining = Math.max(
    0,
    Math.floor(Number(temporaryCreditText)),
  );
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const selectedSet = new Set(selectedIds);
  if (selectedSet.size !== selectedIds.length)
    throw new Error("Eine Rez-Karte wurde doppelt gewaehlt.");
  if (
    selectedIds.some(
      (cardId) =>
        !isDataFortReclamationRezCandidate(state, cardId, serverId),
    )
  )
    throw new Error("Eine gewaehlte Karte kann nicht gerezzed werden.");

  let temporaryCreditsSpent = 0;
  let corpCreditsSpent = 0;
  let rezzedIceCount = 0;
  let rezzedRootCount = 0;
  for (const cardId of selectedIds) {
    const rezCost = rezCostForCard(state, cardId);
    const temporary = Math.min(temporaryCreditsRemaining, rezCost);
    const corp = rezCost - temporary;
    if (state.corp.credits < corp)
      throw new Error(
        "Die Korp kann die Data-Fort-Reclamation-Rez-Kosten nicht bezahlen.",
      );
    temporaryCreditsRemaining -= temporary;
    temporaryCreditsSpent += temporary;
    if (corp > 0) {
      spendCredits(state, "corp", corp);
      corpCreditsSpent += corp;
    }
    const definition = definitionFor(state, cardId);
    const instance = mustInstance(state.cardInstances, cardId);
    state.cardInstances[cardId] = {
      ...instance,
      faceup: true,
      rezzed: true,
    };
    if (definition.type === "ice") {
      rezzedIceCount += 1;
    } else {
      rezzedRootCount += 1;
      CORP_ROOT_REZ_RESOLVERS[definition.id]?.resolve(state);
    }
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
    selectedCount: selectedIds.length,
    rezzedCount: rezzedIceCount + rezzedRootCount,
    rezzedIceCount,
    rezzedRootCount,
    temporaryCreditsProvided: 10,
    temporaryCreditsSpent,
    temporaryCreditsRemaining,
    corpCreditsSpent,
    corpCreditsAfter: state.corp.credits,
  };
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
  const visibility =
    type.startsWith("rez") ||
    type === "score_agenda" ||
    type === "trash_resource" ||
    payload?.v1917AssetAbility ||
    payload?.resourceAbility ||
    payload?.runnerAbility ||
    payload?.acmeSavingsAndLoanAbility ||
    (side === "runner" && type === "install_card")
      ? "public"
      : "private_to_actor";
  const payloadFields: Pick<LegalAction, "payload"> | Record<string, never> =
    payload
      ? { payload: stableLegalActionPayload(type, payload, visibility) }
      : {};
  return {
    actionId: makeActionId(type, side, payload, source),
    side,
    type,
    label,
    source,
    timingPoint: state.timingPoint,
    costs,
    targetRequirements: metadata.targetRequirements ?? [],
    visibility,
    expiresAtStateVersion: state.stateVersion,
    ...(metadata.choiceRequirements
      ? { choiceRequirements: metadata.choiceRequirements }
      : {}),
    ...(metadata.abilityRef ? { abilityRef: metadata.abilityRef } : {}),
    ...(metadata.effectRef ? { effectRef: metadata.effectRef } : {}),
    ...payloadFields,
  };
}

function stableLegalActionPayload(
  actionType: ActionType,
  payload: NonNullable<LegalAction["payload"]>,
  visibility: LegalAction["visibility"],
): NonNullable<LegalAction["payload"]> {
  const schema = buildPublicAbilitySchemaContext(
    actionType,
    payload,
    {},
    visibility === "public" ? "public" : "private_to_side",
  );
  const stableFields: Record<string, string | number | boolean> = {};
  if (schema.abilityFamily) stableFields.abilityFamily = schema.abilityFamily;
  if (schema.abilityId) stableFields.abilityId = schema.abilityId;
  if (schema.effectKind) stableFields.effectKind = schema.effectKind;
  return Object.keys(stableFields).length > 0
    ? { ...payload, ...stableFields }
    : payload;
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
  state: GameState,
  choice: ChoiceRequest,
): NonNullable<PlayerView["pendingChoice"]> {
  const stackSearchResolution =
    choice.stackSearchResolution ?? stackSearchResolutionForChoice(choice);
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => {
      const card = visibleChoiceCardForOption(state, choice, option);
      return {
        id: option.id,
        label: option.label,
        ...(option.publicLabel ? { publicLabel: option.publicLabel } : {}),
        ...(option.selectable === false ? { selectable: false } : {}),
        ...(option.value !== undefined &&
        !(
          choice.visibility === "public" &&
          option.publicLabel &&
          typeof option.value === "string" &&
          option.id.startsWith("ice_")
        )
          ? { value: option.value }
          : {}),
        ...(card ? { card } : {}),
      };
    }),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
    ...(stackSearchResolution ? { stackSearchResolution } : {}),
  };
}

function isRunnerStackSearchChoice(choice: ChoiceRequest): boolean {
  return (
    choice.kind === "select_cards" &&
    (choice.source.startsWith("v098.search_stack") ||
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.search_stack") ||
      choice.source.startsWith("v1912.search_stack") ||
      choice.source.startsWith("v1911.short_circuit_search") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install"))
  );
}

function stackSearchResolutionForChoice(
  choice: ChoiceRequest,
): ChoiceRequest["stackSearchResolution"] | undefined {
  if (!isRunnerStackSearchChoice(choice)) return undefined;
  return {
    reveal:
      choice.source.startsWith("v1911.short_circuit_search") ||
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install")
        ? "public"
        : "hidden",
    destination:
      choice.source.startsWith("v1911.self_modifying_code_install_program") ||
      choice.source.startsWith("v1911.sneak_preview_stack_install")
        ? "install_program"
        : "grip",
    shuffleAfter: true,
    ...(choice.source.startsWith("v1911.self_modifying_code_install_program") ||
    choice.source.startsWith("v1911.sneak_preview_stack_install")
      ? { publicRevealKind: "reveal" }
      : {}),
  };
}

function visibleChoiceCardForOption(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceRequest["options"][number],
): VisibleCard | undefined {
  if (typeof option.value !== "string") return undefined;
  const cardId = option.value as CardInstanceId;
  const isStackChoice = isRunnerStackSearchChoice(choice);
  const isSneakHeapChoice = choice.source.startsWith(
    "v1911.sneak_preview_heap_install",
  );
  if (!isStackChoice && !isSneakHeapChoice) return undefined;
  if (isStackChoice && !state.runner.stack.includes(cardId)) return undefined;
  if (isSneakHeapChoice && !state.runner.heap.includes(cardId)) return undefined;
  const instance = state.cardInstances[cardId];
  if (!instance || instance.owner !== "runner") return undefined;
  if (!isStackChoice && definitionFor(state, cardId).type !== "program")
    return undefined;
  return visibleOwnCard(state, cardId);
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
  if (
    selectedOptionIds.some(
      (id) =>
        choice.options.find((option) => option.id === id)?.selectable === false,
    )
  )
    return "Eine gewaehlte Option ist fuer diesen Effekt nicht auswaehlbar.";
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
    if (state.trace.status === "post_bid_link") {
      resolveTracePostBidLinkChoice(state, legalAction, playerAction);
      return;
    }
    resolveTraceRunnerBid(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1911.self_modifying_code_install_program",
    ) ||
    state.pendingChoice.source.startsWith("v098.search_stack") ||
    state.pendingChoice.source.startsWith("v1911.search_stack") ||
    state.pendingChoice.source.startsWith("v1912.search_stack") ||
    state.pendingChoice.source.startsWith("v1911.short_circuit_search")
  ) {
    if (
      state.pendingChoice.source.startsWith(
        "v1911.self_modifying_code_install_program",
      )
    ) {
      resolveSelfModifyingCodeStackChoice(state, legalAction, playerAction);
      return;
    }
    resolveRunnerStackSearchChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1911.self_modifying_code_free_mu")) {
    resolveSelfModifyingCodeFreeMuChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1911.sneak_preview_source")) {
    resolveSneakPreviewSourceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1911.sneak_preview_heap_install") ||
    state.pendingChoice.source.startsWith("v1911.sneak_preview_stack_install")
  ) {
    resolveSneakPreviewProgramChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1912.hunt_club_bbs_expose")) {
    resolveHuntClubBbsExposeChoice(state, legalAction, playerAction);
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
  if (state.pendingChoice.source.startsWith("v162.priority_requisition")) {
    resolvePriorityRequisitionChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1917.corp_rd_arrange_top2")) {
    resolveCorpAssetRdTopReorderChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1917.corp_negotiating_center")) {
    resolveCorporateNegotiatingCenterChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1919.systematic_layoffs")) {
    resolveSystematicLayoffsChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1920.ice_transmutation")) {
    resolveIceTransmutationChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1918.singapore_city_grid")) {
    resolveSingaporeCityGridSwapChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1915.mystery_box")) {
    resolveMysteryBoxChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.corp_rd_arrange_top5")) {
    resolveCorpRdTopReorderChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.corp_archives_to_hq")) {
    resolveCorpArchivesToHqChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.anonymous_tip_derez_black_ice")
  ) {
    resolveAnonymousTipDerezBlackIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.core_command_jettison_ice")
  ) {
    resolveCoreCommandJettisonIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.forged_activation_orders_target",
    )
  ) {
    resolveForgedActivationOrdersTargetChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.forged_activation_orders_corp")
  ) {
    resolveForgedActivationOrdersCorpChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.security_code_worm_chip")) {
    resolveSecurityCodeWormChipTrashIceChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.synchronized_attack_on_hq")
  ) {
    resolveSynchronizedAttackOnHqRetainChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.runner_stack_top5_choose_one_arrange_rest",
    )
  ) {
    resolveRunnerStackTop5Choice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.runner_grip_trash_gain_credits",
    )
  ) {
    resolveRunnerGripTrashForCreditsChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1921.playful_ai")) {
    resolveV1921PlayfulAiChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1922.runner_installed_trash_gain_credits",
    )
  ) {
    resolveRunnerInstalledTrashForCreditsChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.open_ended_mileage_return")
  ) {
    resolveOpenEndedMileageProgramReturnChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.hammer_stealth_loss")
  ) {
    resolveHammerStealthLossChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.viral_15_program_trash")
  ) {
    resolveViral15ProgramTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.speed_trap")) {
    resolveSpeedTrapRezInterruptChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("v1922.data_fort_reclamation_rez")
  ) {
    resolveDataFortReclamationRezChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.data_fort_reclamation")) {
    resolveDataFortReclamationChoice(state, legalAction, playerAction);
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
  if (state.pendingChoice.source.startsWith("v181.pattels_virus")) {
    resolvePattelsVirusCounterChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1913.code_viral_cache_purge")) {
    resolveCodeViralCachePurgeChoice(state, legalAction, playerAction);
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
    ...(cockroachRandomized
      ? {
          randomizedByCockroach: true,
          cockroachCounterTotal: cockroachCounterTotal(state),
        }
      : {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "discard_phase",
  };
  delete state.pendingChoice;
  completeDiscardPhase(state, side, legalAction);
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
  const hasSearchableProgram = state.runner.stack.some(
    (cardId) => definitionFor(state, cardId).type === "program",
  );
  if (!hasSearchableProgram)
    throw new Error("Keine suchbare Programmkarte im Stack.");
  const options = state.runner.stack.map((cardId) => {
    const definition = definitionFor(state, cardId);
    return {
      id: `card_${cardId}`,
      label: definition.title,
      value: cardId,
      ...(definition.type !== "program" ? { selectable: false } : {}),
    };
  });
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

function startSelfModifyingCodeStackChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
): void {
  startRunnerStackSearchChoice(
    state,
    `v1911.self_modifying_code_install_program:${sourceCardId}`,
    "v1911_self_modifying_code_install_program",
  );
  if (state.pendingChoice) {
    state.pendingChoice.stackSearchResolution = {
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
      publicRevealKind: "reveal",
    };
  }
}

function resolveSelfModifyingCodeAbility(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Self-Modifying Code nutzen.");
  if (state.timingPoint !== "run.encounter_ice" || !state.run?.encounteredIceId)
    throw new Error("Self-Modifying Code ist nur während eines ICE-Encounters legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Self-Modifying Code ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== SELF_MODIFYING_CODE_ID)
    throw new Error("Die Self-Modifying-Code-Fähigkeit passt nicht zur Karte.");
  if (!state.runner.stack.some((cardId) => definitionFor(state, cardId).type === "program"))
    throw new Error("Keine suchbare Programmkarte im Stack.");

  trashRunnerInstalledCardToHeap(state, sourceCardId);
  startSelfModifyingCodeStackChoice(state, sourceCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    sourceDefinitionId: SELF_MODIFYING_CODE_ID,
    hiddenZoneAction: "self_modifying_code_install_program",
    trashOnUse: true,
    trashedCardDefinitionId: SELF_MODIFYING_CODE_ID,
  };
}

function installRunnerProgramFromStackWithoutClick(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): boolean {
  if (!state.runner.stack.includes(cardId)) return false;
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program") return false;
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    return false;
  if (availableRunnerProgramInstallCredits(state) < (definition.installCost ?? 0))
    return false;
  if (state.runner.memoryUsed + (definition.memoryCost ?? 0) > state.runner.memoryLimit)
    return false;

  spendRunnerInstallCredits(state, definition.installCost ?? 0, "program");
  removeFromAllZones(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
  };
  if ((definition.recurringCredits ?? 0) > 0)
    setCardCounter(
      state,
      cardId,
      "recurring_credit",
      definition.recurringCredits ?? 0,
    );
  if (
    definition.mechanics.includes("virus") &&
    definition.id !== BUTCHER_BOY_ID &&
    definition.id !== SKIVVISS_ID
  )
    addCardCounter(state, cardId, "virus", 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    installedProgramDefinitionId: definition.id,
    installCostPaid: definition.installCost ?? 0,
    runnerCreditsAfter: state.runner.credits,
  };
  return true;
}

function startSelfModifyingCodeFreeMuChoice(
  state: GameState,
  selectedProgramId: CardInstanceId,
): boolean {
  const options = state.runner.rig.programs
    .filter((cardId) => runnerProgramUsesMemory(state, cardId))
    .sort()
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (options.length === 0) return false;
  state.pendingChoice = {
    choiceId: `v1911_self_modifying_code_free_mu_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1911.self_modifying_code_free_mu:${selectedProgramId}:${state.stateVersion + 1}`,
    prompt: "MU freimachen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: options.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  return true;
}

function resolveSelfModifyingCodeStackChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1911.self_modifying_code_install_program"))
    throw new Error("Es ist keine Self-Modifying-Code-Choice offen.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId || !state.runner.stack.includes(cardId))
    throw new Error("Die gewählte Karte liegt nicht im Stack.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program")
    throw new Error("Self-Modifying Code kann nur Programme installieren.");

  const canPay =
    availableRunnerProgramInstallCredits(state) >= (definition.installCost ?? 0);
  const uniqueBlocked =
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id);
  const needsMemory =
    state.runner.memoryUsed + (definition.memoryCost ?? 0) > state.runner.memoryLimit;
  if (canPay && !uniqueBlocked && needsMemory) {
    shuffleRunnerStack(state, `v1911_self_modifying_code:${choice.choiceId}:shuffle`);
    const opened = startSelfModifyingCodeFreeMuChoice(state, cardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "self_modifying_code_install_program",
      publicRevealKind: "reveal",
      publicRevealDefinitionId: definition.id,
      selectedCount: 1,
      searchDestination: "install_program",
      shuffled: true,
      installDeferredForMemory: opened,
    };
    if (!opened) delete state.pendingChoice;
    return;
  }

  const installed =
    canPay && !uniqueBlocked
      ? installRunnerProgramFromStackWithoutClick(state, cardId, legalAction)
      : false;
  shuffleRunnerStack(state, `v1911_self_modifying_code:${choice.choiceId}:shuffle`);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "self_modifying_code_install_program",
    publicRevealKind: "reveal",
    publicRevealDefinitionId: definition.id,
    selectedCount: 1,
    searchDestination: installed ? "runner_rig" : "runner_stack",
    shuffled: true,
    installed,
    ...(uniqueBlocked ? { installBlockedReason: "unique_already_installed" } : {}),
    ...(!canPay ? { installBlockedReason: "insufficient_credits" } : {}),
  };
}

function resolveSelfModifyingCodeFreeMuChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1911.self_modifying_code_free_mu"))
    throw new Error("Es ist keine Self-Modifying-Code-MU-Choice offen.");
  const selectedProgramId = choice.source.split(":")[1] as
    | CardInstanceId
    | undefined;
  if (!selectedProgramId || !state.runner.stack.includes(selectedProgramId))
    throw new Error("Das Self-Modifying-Code-Programm liegt nicht mehr im Stack.");
  const trashIds = selectedChoiceCardIds(choice, playerAction);
  if (trashIds.length === 0) throw new Error("Es wurde kein Programm gewählt.");
  const uniqueTrashIds = [...new Set(trashIds)];
  if (uniqueTrashIds.length !== trashIds.length)
    throw new Error("Die MU-Auswahl enthält doppelte Karten.");
  for (const cardId of uniqueTrashIds) {
    if (!state.runner.rig.programs.includes(cardId))
      throw new Error("Die MU-Auswahl enthält kein installiertes Programm.");
    if (!runnerProgramUsesMemory(state, cardId))
      throw new Error("Dieses Programm macht keine MU frei.");
  }
  const trashedDefinitionIds = uniqueTrashIds.map(
    (cardId) => definitionFor(state, cardId).id,
  );
  for (const cardId of uniqueTrashIds) trashRunnerInstalledCardToHeap(state, cardId);
  const installed = installRunnerProgramFromStackWithoutClick(
    state,
    selectedProgramId,
    legalAction,
  );
  if (!installed)
    throw new Error("Nach der MU-Auswahl kann das Programm nicht installiert werden.");
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "self_modifying_code_free_mu",
    trashedCount: uniqueTrashIds.length,
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
    installed: true,
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
  let shortCircuitSourceId: CardInstanceId | undefined;
  if (choice.source.startsWith("v1911.short_circuit_search:")) {
    shortCircuitSourceId = choice.source.split(":")[1] as
      | CardInstanceId
      | undefined;
    if (
      !shortCircuitSourceId ||
      !state.runner.rig.resources.includes(shortCircuitSourceId) ||
      definitionFor(state, shortCircuitSourceId).id !==
        STACK_SEARCH_TRASH_ON_USE_RESOURCE_CARD_ID
    )
      throw new Error("The Short Circuit ist nicht mehr installiert.");
    trashRunnerInstalledCardToHeap(state, shortCircuitSourceId);
  }
  shuffleRunnerStack(state, `v098_search_stack:${choice.choiceId}:shuffle`);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: shortCircuitSourceId
      ? "v1911_short_circuit_search"
      : "search_stack",
    selectedCount: 1,
    searchDestination: "runner_grip",
    shuffled: true,
    ...(shortCircuitSourceId
      ? {
          publicRevealDefinitionId: definitionFor(state, cardId).id,
          publicRevealKind: "reveal",
          trashOnUse: true,
          trashedCardDefinitionId: STACK_SEARCH_TRASH_ON_USE_RESOURCE_CARD_ID,
        }
      : {}),
  };
}

function sneakPreviewInstallableProgramIds(
  state: GameState,
  zone: "heap" | "stack",
): CardInstanceId[] {
  const source = zone === "heap" ? state.runner.heap : state.runner.stack;
  return source.filter((cardId) => {
    const definition = definitionFor(state, cardId);
    const uniqueBlocked =
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id);
    return (
      definition.type === "program" &&
      !uniqueBlocked &&
      state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
        state.runner.memoryLimit
    );
  });
}

function sneakPreviewSourceOptions(
  state: GameState,
): ChoiceRequest["options"] {
  const options: ChoiceRequest["options"] = [];
  if (sneakPreviewInstallableProgramIds(state, "heap").length > 0)
    options.push({ id: "source_heap", label: "Heap", value: "heap" });
  if (sneakPreviewInstallableProgramIds(state, "stack").length > 0)
    options.push({ id: "source_stack", label: "Stack", value: "stack" });
  return options;
}

function startSneakPreviewSourceChoice(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = sneakPreviewSourceOptions(state);
  if (options.length === 0)
    throw new Error("Sneak Preview findet kein legal installierbares Programm.");
  state.pendingChoice = {
    choiceId: `v1911_sneak_preview_source_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1911.sneak_preview_source:${state.stateVersion + 1}`,
    prompt: "Sneak-Preview-Quelle wählen",
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
    hiddenZoneAction: "sneak_preview_source_choice",
    choiceVisibility: "runner_private",
  };
}

function resolveSneakPreviewSourceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1911.sneak_preview_source"))
    throw new Error("Es ist keine Sneak-Preview-Quellenwahl offen.");
  const optionId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === optionId);
  const selectedSource = option?.value;
  if (selectedSource !== "heap" && selectedSource !== "stack")
    throw new Error("Die Sneak-Preview-Quelle ist ungueltig.");
  startSneakPreviewProgramChoice(state, selectedSource);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "sneak_preview_source_selected",
    choiceVisibility: "runner_private",
  };
}

function startSneakPreviewProgramChoice(
  state: GameState,
  sourceZone: "heap" | "stack",
): void {
  const options = sneakPreviewInstallableProgramIds(state, sourceZone).map(
    (cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    },
  );
  if (options.length === 0)
    throw new Error("In dieser Sneak-Preview-Quelle liegt kein legales Programm.");
  state.pendingChoice = {
    choiceId: `v1911_sneak_preview_${sourceZone}_install_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1911.sneak_preview_${sourceZone}_install:${state.stateVersion + 1}`,
    prompt:
      sourceZone === "heap"
        ? "Programm aus dem Heap installieren"
        : "Programm aus dem Stack installieren",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveSneakPreviewProgramChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice) throw new Error("Es ist keine Sneak-Preview-Programmauswahl offen.");
  const sourceZone = choice.source.startsWith("v1911.sneak_preview_heap_install")
    ? "heap"
    : choice.source.startsWith("v1911.sneak_preview_stack_install")
      ? "stack"
      : undefined;
  if (!sourceZone) throw new Error("Die Sneak-Preview-Choice ist ungueltig.");
  const cardId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!cardId) throw new Error("Es wurde kein Programm fuer Sneak Preview gewaehlt.");
  if (!sneakPreviewInstallableProgramIds(state, sourceZone).includes(cardId))
    throw new Error("Dieses Programm ist nicht mehr legal installierbar.");
  installRunnerProgramForFree(state, cardId);
  state.sneakPreviewTemporaryInstalls ??= [];
  state.sneakPreviewTemporaryInstalls.push({
    cardId,
    sourceCardDefinitionId: SNEAK_PREVIEW_ID,
  });
  if (sourceZone === "stack")
    shuffleRunnerStack(state, `v1911_sneak_preview:${choice.choiceId}:shuffle`);
  delete state.pendingChoice;
  const definition = definitionFor(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "sneak_preview_program_install",
    searchReveal: sourceZone === "stack" ? "public" : "hidden",
    searchDestination: "install_program",
    searchShuffleAfter: sourceZone === "stack",
    shuffled: sourceZone === "stack",
    temporaryInstall: true,
    selectedCount: 1,
    installedProgramDefinitionId: definition.id,
    ...(sourceZone === "stack"
      ? { publicRevealKind: "reveal", publicRevealDefinitionId: definition.id }
      : {}),
  };
}

function installRunnerProgramForFree(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program")
    throw new Error("Sneak Preview darf nur Programme installieren.");
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
    state.runner.memoryLimit
  )
    throw new Error("Nicht genug Memory fuer Sneak Preview.");
  removeFromAllZones(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
  };
  if ((definition.recurringCredits ?? 0) > 0)
    setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
  if (
    definition.mechanics.includes("virus") &&
    definition.id !== BUTCHER_BOY_ID &&
    definition.id !== SKIVVISS_ID
  )
    addCardCounter(state, cardId, "virus", 1);
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
  if (choice.source.startsWith("v1911.arrange_stack_top2:")) {
    const sourceCardId = choice.source.split(":")[1] as
      | CardInstanceId
      | undefined;
    if (
      !sourceCardId ||
      !state.runner.rig.resources.includes(sourceCardId) ||
      definitionFor(state, sourceCardId).id !== RONIN_AROUND_ID
    ) {
      throw new Error("Die Ronin-Around-Reorder-Quelle ist nicht mehr installiert.");
    }
  }
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

function startRunnerStackTop5Choice(
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

function startAnonymousTipDerezBlackIceChoice(
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

function resolveAnonymousTipDerezBlackIceChoice(
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

function startCoreCommandJettisonIceChoice(
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

function resolveCoreCommandJettisonIceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.core_command_jettison_ice"))
    throw new Error("Es ist keine V1.9.22-Core-Command-Choice offen.");
  if (!hasSuccessfulHqRunThisTurn(state))
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

function startForgedActivationOrdersTargetChoice(
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

function resolveForgedActivationOrdersTargetChoice(
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

function resolveForgedActivationOrdersCorpChoice(
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

function startSecurityCodeWormChipTrashIceChoice(
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

function resolveSecurityCodeWormChipTrashIceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.security_code_worm_chip"))
    throw new Error(
      "Es ist keine V1.9.22-Security-Code-WORM-Chip-Choice offen.",
    );
  if (!hasSuccessfulHqRunThisTurn(state))
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

function startSynchronizedAttackOnHqRetainChoice(
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

function resolveSynchronizedAttackOnHqRetainChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.synchronized_attack_on_hq"))
    throw new Error(
      "Es ist keine V1.9.22-Synchronized-Attack-on-HQ-Choice offen.",
    );
  if (!hasSuccessfulHqRunThisTurn(state))
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

function resolveRunnerStackTop5Choice(
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

function startRunnerGripTrashForCreditsChoice(
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

function resolveRunnerGripTrashForCreditsChoice(
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

function startRunnerInstalledTrashForCreditsChoice(
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

function resolveRunnerInstalledTrashForCreditsChoice(
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

function startOpenEndedMileageProgramReturnChoice(
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

function resolveOpenEndedMileageProgramReturnChoice(
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

function startCorpAssetRdTopReorderChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  if (!HIDDEN_ZONE_REORDER_ASSET_CARD_IDS.has(sourceDefinition.id))
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

function resolveCorpAssetRdTopReorderChoice(
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
    !HIDDEN_ZONE_REORDER_ASSET_CARD_IDS.has(definitionFor(state, sourceCardId).id)
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

function startCorporateNegotiatingCenterChoice(state: GameState): void {
  const sourceIds = rezzedCorpRootCardIds(state)
    .filter(
      (cardId) =>
        definitionFor(state, cardId).id ===
        CORP_HQ_AGENDA_REVEAL_CARD_ID,
    )
    .sort();
  if (sourceIds.length === 0) return;
  const agendaIds = state.corp.hq
    .filter((cardId) => definitionFor(state, cardId).type === "agenda")
    .sort();
  if (agendaIds.length === 0) return;
  state.pendingChoice = {
    choiceId: `v1917_corp_negotiating_center_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1917.corp_negotiating_center:${sourceIds.join(",")}:${state.stateVersion + 1}`,
    prompt: "Corporate Negotiating Center: HQ-Agenden zeigen",
    kind: "select_cards",
    options: agendaIds.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: "HQ-Agenda",
        value: cardId,
      };
    }),
    minSelections: 0,
    maxSelections: agendaIds.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveCorporateNegotiatingCenterChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1917.corp_negotiating_center"))
    throw new Error("Es ist keine Corporate-Negotiating-Center-Choice offen.");
  const sourceText = choice.source.split(":")[1] ?? "";
  const sourceIds = sourceText.split(",").filter(Boolean);
  if (
    sourceIds.length === 0 ||
    sourceIds.some(
      (sourceId) =>
        !rezzedCorpRootCardIds(state).includes(sourceId) ||
        definitionFor(state, sourceId).id !==
          CORP_HQ_AGENDA_REVEAL_CARD_ID,
    )
  )
    throw new Error("Corporate Negotiating Center ist nicht mehr aktiv.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    selectedIds.some(
      (cardId) =>
        !state.corp.hq.includes(cardId) ||
        definitionFor(state, cardId).type !== "agenda",
    )
  )
    throw new Error("Corporate Negotiating Center darf nur HQ-Agenden zeigen.");
  credits(state, "corp", selectedIds.length);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_corporate_negotiating_center_hq_agenda_reveal",
    revealedAgendaDefinitionIds: selectedIds
      .map((cardId) => definitionFor(state, cardId).id)
      .join(","),
    revealedCount: selectedIds.length,
    gainedCredits: selectedIds.length,
    corpCreditsAfter: state.corp.credits,
  };
}

function resolveReschedulerHqShuffleDraw(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const hqCards = state.corp.hq.slice();
  const hqCardCount = hqCards.length;
  const randomPurpose = `v1917.rescheduler.hq_into_rd.${sourceCardId}.${state.stateVersion + 1}`;
  state.corp.hq = [];
  state.corp.rd = shuffleStateIds(state, [...state.corp.rd, ...hqCards], randomPurpose);
  for (const cardId of state.corp.rd) {
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
  drawCorpCards(state, hqCardCount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_rescheduler_hq_shuffle_draw",
    hqCardCount,
    drawnCount: hqCardCount,
    randomDrawRecordPurpose: randomPurpose,
    randomCounterAfter: state.randomCounter,
  };
}

function startSystematicLayoffsChoice(
  state: GameState,
  targets: CardInstanceId[],
  legalAction: LegalAction,
): void {
  state.pendingChoice = {
    choiceId: `v1919_systematic_layoffs_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1919.systematic_layoffs:${state.stateVersion + 1}`,
    prompt: "Systematic Layoffs: Agenda forfeiten",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: `${definition.title} (${agendaPointsForScoredCard(state, cardId)})`,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1919OperationAbility: "forfeit_scored_agenda_choice",
    eligibleAgendaCount: targets.length,
  };
}

function resolveSystematicLayoffsChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1919.systematic_layoffs"))
    throw new Error("Es ist keine Systematic-Layoffs-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length !== 1)
    throw new Error("Systematic Layoffs braucht genau eine Agenda.");
  resolveSystematicLayoffsForfeit(
    state,
    mustArrayValue(selectedIds, 0, "Systematic-Layoffs-Auswahl fehlt."),
    legalAction,
  );
  delete state.pendingChoice;
}

function resolveSystematicLayoffsForfeit(
  state: GameState,
  targetAgendaId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (!corpScoredAgendaForfeitTargets(state).includes(targetAgendaId))
    throw new Error("Systematic Layoffs darf diese Agenda nicht forfeiten.");
  const agendaPointValue = agendaPointsForScoredCard(state, targetAgendaId);
  forfeitCorpAgendaForPointCost(state, targetAgendaId);
  credits(state, "corp", Math.max(1, agendaPointValue));
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1919OperationAbility: "forfeit_scored_agenda",
    forfeitedAgendaCardId: targetAgendaId,
    forfeitedAgendaDefinitionId: definitionFor(state, targetAgendaId).id,
    agendaPointCostPaid: agendaPointValue,
    gainedCredits: Math.max(1, agendaPointValue),
    corpCreditsAfter: state.corp.credits,
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: "v1919_systematic_layoffs",
  };
}

function corpAgendaPointTotal(state: GameState): number {
  const scoredPoints = state.corp.scoreArea.reduce(
    (sum, cardId) => sum + agendaPointsForScoredCard(state, cardId),
    0,
  );
  return scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0));
}

function chooseCorpAgendasForPointCost(
  state: GameState,
  requiredPoints: number,
): CardInstanceId[] {
  let total = 0;
  const selected: CardInstanceId[] = [];
  for (const cardId of corpScoredAgendaForfeitTargets(state)) {
    selected.push(cardId);
    total += agendaPointsForScoredCard(state, cardId);
    if (total >= requiredPoints) return selected;
  }
  return [];
}

function resolveIGotARockDamage(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const requiredPoints = 3;
  const forfeitedAgendaIds = chooseCorpAgendasForPointCost(state, requiredPoints);
  const paidPoints = forfeitedAgendaIds.reduce(
    (sum, cardId) => sum + agendaPointsForScoredCard(state, cardId),
    0,
  );
  if (paidPoints < requiredPoints)
    throw new Error("I Got a Rock braucht 3 Agenda-Punkte.");
  const forfeitedDefinitionIds = forfeitedAgendaIds
    .map((cardId) => definitionFor(state, cardId).id)
    .join(",");
  for (const agendaId of forfeitedAgendaIds) {
    forfeitCorpAgendaForPointCost(state, agendaId);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1920AssetAbility: "i_got_a_rock_tagged_meat_damage",
    sourceDefinitionId: I_GOT_A_ROCK_BAD_PUBLICITY_ASSET_ID,
    sourceCardId,
    runnerTagsBefore: state.runner.tags,
    agendaPointCost: requiredPoints,
    agendaPointCostPaid: paidPoints,
    forfeitedAgendaDefinitionIds: forfeitedDefinitionIds,
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: "v1920_i_got_a_rock",
  };
  resolveDamageOperation(
    state,
    legalAction,
    "meat",
    15,
    I_GOT_A_ROCK_BAD_PUBLICITY_ASSET_ID,
  );
}

function iceTransmutationTargetIds(state: GameState): CardInstanceId[] {
  return Object.entries(state.cardInstances)
    .filter(([, instance]) => {
      return (
        instance.zone.side === "corp" &&
        instance.zone.zone === "serverIce" &&
        instance.rezzed === true
      );
    })
    .map(([cardId]) => cardId)
    .filter((cardId) => definitionFor(state, cardId).type === "ice")
    .sort();
}

function startIceTransmutationChoice(
  state: GameState,
  agendaId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const targets = iceTransmutationTargetIds(state);
  if (targets.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      agendaAbility: "v1920_ice_transmutation",
      iceTransmutationSkippedReason: "no_rezzed_ice",
    };
    return;
  }
  state.pendingChoice = {
    choiceId: `v1920_ice_transmutation_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1920.ice_transmutation:${agendaId}:${state.stateVersion + 1}`,
    prompt: "Ice Transmutation: Rezzed ICE wählen",
    kind: "select_cards",
    options: targets.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: "v1920_ice_transmutation_choice",
    eligibleIceCount: targets.length,
  };
}

function resolveIceTransmutationChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1920.ice_transmutation"))
    throw new Error("Es ist keine Ice-Transmutation-Choice offen.");
  const [, agendaId] = choice.source.split(":");
  if (
    !agendaId ||
    !state.corp.scoreArea.includes(agendaId) ||
    definitionFor(state, agendaId).id !== ICE_TRANSMUTATION_AGENDA_ID
  )
    throw new Error("Ice Transmutation ist nicht gescored.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length !== 1)
    throw new Error("Ice Transmutation braucht genau ein ICE-Ziel.");
  const targetIceId = mustArrayValue(selectedIds, 0, "Ice-Transmutation-Ziel fehlt.");
  if (!iceTransmutationTargetIds(state).includes(targetIceId))
    throw new Error("Ice Transmutation darf nur rezzed ICE wählen.");
  addCardCounter(state, targetIceId, "mark", 1);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAbility: "v1920_ice_transmutation",
    sourceAgendaId: agendaId,
    targetIceId,
    targetIceDefinitionId: definitionFor(state, targetIceId).id,
    strengthBonus: cardCounter(state, targetIceId, "mark"),
    duplicatedSubroutineCount:
      (definitionFor(state, targetIceId).subroutines?.length ?? 0) *
      cardCounter(state, targetIceId, "mark"),
  };
}

function startSingaporeCityGridSwapChoice(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Singapore City Grid nutzen.");
  const run = mustRun(state);
  if (
    state.timingPoint !== "run.approach_ice" &&
    state.timingPoint !== "run.jack_out_window"
  )
    throw new Error("Singapore City Grid ist nur waehrend eines Runs legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  const targetIceId = String(legalAction.payload?.targetIceId ?? "");
  const iceIndex = Number(legalAction.payload?.iceIndex ?? -1);
  if (serverId !== run.attackedServerId)
    throw new Error("Singapore City Grid ist nicht an diesen Run gebunden.");
  const server = mustServer(state, serverId);
  if (!server.root.includes(sourceCardId))
    throw new Error("Singapore City Grid ist nicht im angegriffenen Fort.");
  const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
  if (
    !sourceInstance.rezzed ||
    definitionFor(state, sourceCardId).id !== SERVER_ICE_SWAP_UPGRADE_CARD_ID
  )
    throw new Error("Singapore City Grid ist nicht rezzed installiert.");
  if (run.singaporeCityGridUsedSourceIdsThisRun?.includes(sourceCardId))
    throw new Error("Singapore City Grid wurde in diesem Run bereits genutzt.");
  if (
    !Number.isInteger(iceIndex) ||
    iceIndex < 0 ||
    server.ice[iceIndex] !== targetIceId
  )
    throw new Error("Das Singapore-City-Grid-ICE-Ziel ist ungueltig.");
  const targetInstance = mustInstance(state.cardInstances, targetIceId);
  if (targetInstance.rezzed)
    throw new Error("Singapore City Grid darf nur unrezzed ICE austauschen.");
  const hqIceIds = state.corp.hq
    .filter((cardId) => definitionFor(state, cardId).type === "ice")
    .sort();
  if (hqIceIds.length === 0)
    throw new Error("In HQ liegt kein ICE fuer Singapore City Grid.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `v1918_singapore_city_grid_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1918.singapore_city_grid:${sourceCardId}:${server.id}:${targetIceId}:${iceIndex}:${run.runId}`,
    prompt: "Singapore City Grid: ICE aus HQ wählen.",
    kind: "select_cards",
    options: hqIceIds.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      publicLabel: "HQ-ICE",
      value: cardId,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_singapore_city_grid_choice",
    choiceVisibility: "hidden_info_barrier",
    selectedCount: 1,
    serverLabel: server.label,
    oncePerRunConsumed: false,
  };
}

function resolveSingaporeCityGridSwapChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1918.singapore_city_grid"))
    throw new Error("Es ist keine Singapore-City-Grid-Choice offen.");
  const [, sourceCardId, serverIdRaw, targetIceId, iceIndexRaw, runId] =
    choice.source.split(":");
  if (!sourceCardId || !serverIdRaw || !targetIceId || !runId)
    throw new Error("Die Singapore-City-Grid-Choice ist ungueltig.");
  const serverId = serverIdRaw as Exclude<ServerId, "new_remote">;
  const iceIndex = Number(iceIndexRaw ?? -1);
  const run = mustRun(state);
  if (run.runId !== runId || run.attackedServerId !== serverId)
    throw new Error(
      "Die Singapore-City-Grid-Choice gehoert nicht zu diesem Run.",
    );
  const server = mustServer(state, serverId);
  if (!server.root.includes(sourceCardId))
    throw new Error("Singapore City Grid ist nicht mehr im angegriffenen Fort.");
  if (
    definitionFor(state, sourceCardId).id !== SERVER_ICE_SWAP_UPGRADE_CARD_ID ||
    !mustInstance(state.cardInstances, sourceCardId).rezzed
  )
    throw new Error("Singapore City Grid ist nicht mehr rezzed installiert.");
  if (run.singaporeCityGridUsedSourceIdsThisRun?.includes(sourceCardId))
    throw new Error("Singapore City Grid wurde in diesem Run bereits genutzt.");
  if (
    !Number.isInteger(iceIndex) ||
    iceIndex < 0 ||
    server.ice[iceIndex] !== targetIceId
  )
    throw new Error("Das Singapore-City-Grid-ICE-Ziel ist nicht mehr legal.");
  const targetInstance = mustInstance(state.cardInstances, targetIceId);
  if (targetInstance.rezzed)
    throw new Error("Singapore City Grid darf nur unrezzed ICE austauschen.");
  const hqIceId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!hqIceId || !state.corp.hq.includes(hqIceId))
    throw new Error("Das Singapore-City-Grid-HQ-ICE ist nicht mehr in HQ.");
  if (definitionFor(state, hqIceId).type !== "ice")
    throw new Error("Singapore City Grid darf nur ICE aus HQ waehlen.");
  const hqIndex = state.corp.hq.indexOf(hqIceId);
  state.corp.hq[hqIndex] = targetIceId;
  server.ice[iceIndex] = hqIceId;
  state.cardInstances[targetIceId] = {
    ...targetInstance,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "hq" },
  };
  state.cardInstances[hqIceId] = {
    ...mustInstance(state.cardInstances, hqIceId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId },
  };
  run.singaporeCityGridUsedSourceIdsThisRun = [
    ...(run.singaporeCityGridUsedSourceIdsThisRun ?? []),
    sourceCardId,
  ];
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_singapore_city_grid_swap",
    sourceDefinitionId: SERVER_ICE_SWAP_UPGRADE_CARD_ID,
    serverLabel: server.label,
    iceIndex,
    swappedIceCount: 1,
    oncePerRunConsumed: true,
  };
}

function startCorpRdTopReorderChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (definitionFor(state, sourceCardId).id !== CORP_RD_TOP5_REORDER_OPERATION_CARD_ID)
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

function resolveCorpRdTopReorderChoice(
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
    definitionFor(state, sourceCardId).id !== CORP_RD_TOP5_REORDER_OPERATION_CARD_ID
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

function startCorpArchivesToHqChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (definitionFor(state, sourceCardId).id !== CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID)
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

function resolveCorpArchivesToHqChoice(
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
    definitionFor(state, sourceCardId).id !== CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID
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
      hiddenZoneBarrier: true,
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
      hiddenZoneBarrier: true,
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
  const [, sourceCardId = ""] = choice.source.split(":");
  if (
    !sourceCardId ||
    state.run?.accessedCardId !== sourceCardId ||
    !state.cardInstances[sourceCardId] ||
    state.cardInstances[sourceCardId]?.zone.zone === "archives" ||
    definitionFor(state, sourceCardId).id !== CHIMERA_ID
  ) {
    throw new Error("Chimera ist nicht mehr die gueltige Access-Quelle.");
  }
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

function startV1921PlayfulAiChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  dieRoll: number,
  remainingDice: number,
  rollIndex: number,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!sourceCardId || !state.cardInstances[sourceCardId])
    throw new Error("Playful AI hat keine gültige Quelle.");
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 3)
    throw new Error(
      "Playful AI darf nur bei Wurf 1, 2 oder 3 eine Choice öffnen.",
    );
  if (!Number.isInteger(remainingDice) || remainingDice < 0)
    throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
  if (!Number.isInteger(rollIndex) || rollIndex < 1)
    throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
  const choiceStateVersion = state.stateVersion + 1;
  state.pendingChoice = {
    choiceId: `v1921_playful_ai_${choiceStateVersion}`,
    side: "runner",
    source: [
      "v1921.playful_ai",
      sourceCardId,
      String(dieRoll),
      String(remainingDice),
      String(rollIndex),
      String(choiceStateVersion),
    ].join(":"),
    prompt:
      `Playful AI: ${dieRoll} ${creditTextForPrompt(dieRoll)} nehmen ` +
      `und/oder ${dieRoll} ${diePromptText(dieRoll)} beiseitelegen.`,
    kind: "select_option",
    options: playfulAiSplitOptions(dieRoll),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: choiceStateVersion,
    visibility: "public",
  };
}

function creditTextForPrompt(amount: number): string {
  return amount === 1 ? "Credit" : "Credits";
}

function diePromptText(amount: number): string {
  return amount === 1 ? "Würfel" : "Würfel";
}

function playfulAiSplitOptions(dieRoll: number): ChoiceRequest["options"] {
  return Array.from({ length: dieRoll + 1 }, (_, gainedCredits) => {
    const setAsideDice = dieRoll - gainedCredits;
    const creditText = creditTextForPrompt(gainedCredits);
    const diceText = diePromptText(setAsideDice);
    return {
      id: `gain_${gainedCredits}_set_aside_${setAsideDice}`,
      label: `${gainedCredits} ${creditText} nehmen, ${setAsideDice} ${diceText} beiseitelegen`,
      publicLabel: "Playful-AI-Aufteilung",
      value: gainedCredits,
    };
  });
}

function parsePlayfulAiChoiceSource(source: string): {
  sourceCardId: CardInstanceId;
  dieRoll: number;
  remainingDice: number;
  rollIndex: number;
} {
  const [, sourceCardId = "", dieRollRaw = "", fourth = "", fifth = ""] =
    source.split(":");
  const dieRoll = Number(dieRollRaw);
  if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6)
    throw new Error("Playful-AI-Wurf ist ungültig.");
  const remainingDice = Number(fourth);
  const rollIndex = Number(fifth);
  if (
    Number.isInteger(remainingDice) &&
    remainingDice >= 0 &&
    Number.isInteger(rollIndex) &&
    rollIndex >= 1
  ) {
    return { sourceCardId, dieRoll, remainingDice, rollIndex };
  }
  const oldRolls = fourth
    .split(",")
    .filter(Boolean)
    .map((value) => Number(value));
  if (
    oldRolls.length === 0 ||
    oldRolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > 6)
  )
    throw new Error("Playful-AI-Wurfserie ist ungültig.");
  return {
    sourceCardId,
    dieRoll,
    remainingDice: 0,
    rollIndex: oldRolls.length,
  };
}

function parsePlayfulAiSplit(
  choice: ChoiceRequest,
  selectedOptionId: string | undefined,
  dieRoll: number,
): { gainedCredits: number; setAsideDice: number } {
  const option = choice.options.find(
    (candidate) => candidate.id === selectedOptionId,
  );
  if (!option) throw new Error("Playful-AI-Auswahl ist ungültig.");
  if (option.id === "take_credits")
    return { gainedCredits: dieRoll, setAsideDice: 0 };
  if (option.id === "set_aside")
    return { gainedCredits: 0, setAsideDice: dieRoll };
  const match = /^gain_(\d+)_set_aside_(\d+)$/.exec(option.id);
  if (!match) throw new Error("Playful-AI-Auswahl ist ungültig.");
  const gainedCredits = Number(match[1]);
  const setAsideDice = Number(match[2]);
  if (
    !Number.isInteger(gainedCredits) ||
    !Number.isInteger(setAsideDice) ||
    gainedCredits < 0 ||
    setAsideDice < 0 ||
    gainedCredits + setAsideDice !== dieRoll
  )
    throw new Error("Playful-AI-Aufteilung ist ungültig.");
  return { gainedCredits, setAsideDice };
}

function continueV1921PlayfulAiLoop(
  state: GameState,
  sourceCardId: CardInstanceId,
  queuedDice: number,
  rollIndex: number,
): {
  rolledDice: number[];
  remainingDice: number;
  rollIndex: number;
  choiceOpened: boolean;
  complete: boolean;
} {
  if (!Number.isInteger(queuedDice) || queuedDice < 0)
    throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
  if (!Number.isInteger(rollIndex) || rollIndex < 1)
    throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
  let remainingDice = queuedDice;
  let nextRollIndex = rollIndex;
  const rolledDice: number[] = [];
  while (remainingDice > 0) {
    remainingDice -= 1;
    const nextRoll = rollDeterministicDie(
      state,
      `v1921.die.${PLAYFUL_AI_DICE_LOOP_EVENT_CARD_ID}.dice_loop.followup.${state.stateVersion + 1}.${nextRollIndex}`,
    );
    nextRollIndex += 1;
    rolledDice.push(nextRoll);
    if (nextRoll <= 3) {
      startV1921PlayfulAiChoice(
        state,
        sourceCardId,
        nextRoll,
        remainingDice,
        nextRollIndex,
      );
      return {
        rolledDice,
        remainingDice,
        rollIndex: nextRollIndex,
        choiceOpened: true,
        complete: false,
      };
    }
  }
  return {
    rolledDice,
    remainingDice: 0,
    rollIndex: nextRollIndex,
    choiceOpened: false,
    complete: true,
  };
}

function resolveV1921PlayfulAiChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1921.playful_ai"))
    throw new Error("Es ist keine Playful-AI-Choice offen.");
  const choiceState = parsePlayfulAiChoiceSource(choice.source);
  const { sourceCardId, dieRoll, remainingDice, rollIndex } = choiceState;
  if (
    !sourceCardId ||
    !state.runner.heap.includes(sourceCardId) ||
    definitionFor(state, sourceCardId).id !== PLAYFUL_AI_DICE_LOOP_EVENT_CARD_ID
  )
    throw new Error("Die Playful-AI-Choice gehoert nicht zur gespielten Karte.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];

  delete state.pendingChoice;
  let gainedCredits = 0;
  let setAsideDice = 0;
  let queuedDiceBeforeRolls = remainingDice;
  let progress: ReturnType<typeof continueV1921PlayfulAiLoop> = {
    rolledDice: [],
    remainingDice,
    rollIndex,
    choiceOpened: false,
    complete: true,
  };
  if (dieRoll <= 3) {
    const split = parsePlayfulAiSplit(choice, selectedOptionId, dieRoll);
    gainedCredits = split.gainedCredits;
    setAsideDice = split.setAsideDice;
    if (gainedCredits > 0) credits(state, "runner", gainedCredits);
    queuedDiceBeforeRolls = remainingDice + setAsideDice;
    progress = continueV1921PlayfulAiLoop(
      state,
      sourceCardId,
      queuedDiceBeforeRolls,
      rollIndex,
    );
  }

  const payload: NonNullable<LegalAction["payload"]> = {
    ...(legalAction.payload ?? {}),
    v1921RunnerEventAbility: "playful_ai_dice_loop",
    sourceDefinitionId: PLAYFUL_AI_DICE_LOOP_EVENT_CARD_ID,
    playfulAiDieRolls: progress.rolledDice.join(","),
    playfulAiGainedCredits: gainedCredits,
    playfulAiSetAsideDice: setAsideDice,
    playfulAiRolledDice: progress.rolledDice.length,
    playfulAiDiceQueuedBeforeRolls: queuedDiceBeforeRolls,
    playfulAiDiceQueuedAfterRolls: progress.remainingDice,
    playfulAiRemainingDice: progress.remainingDice,
    playfulAiChoiceOpened: progress.choiceOpened,
    playfulAiComplete: progress.complete,
    randomCounterAfter: state.randomCounter,
    runnerCreditsAfter: state.runner.credits,
  };
  const lastRoll = progress.rolledDice.at(-1);
  if (lastRoll !== undefined) payload.v1921DieRoll = lastRoll;
  legalAction.payload = payload;
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
  if (ability === "search_stack_program_to_grip") {
    if (!STACK_SEARCH_PROGRAM_CARD_IDS.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Stack-Search-Ability nutzen.");
    startRunnerStackSearchChoice(
      state,
      sourceDefinition.id === STACK_SEARCH_TRASH_ON_USE_RESOURCE_CARD_ID
        ? `v1911.short_circuit_search:${sourceCardId}`
        : "v1911.search_stack",
      sourceDefinition.id === STACK_SEARCH_TRASH_ON_USE_RESOURCE_CARD_ID
        ? "v1911_short_circuit_search"
        : "v1911_search_stack",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: sourceDefinition.id,
      hiddenZoneAction:
        sourceDefinition.id === STACK_SEARCH_TRASH_ON_USE_RESOURCE_CARD_ID
          ? "v1911_short_circuit_search"
          : "v1911_search_stack",
    };
    return;
  }
  if (ability === "expose_server_card") {
    if (!SERVER_EXPOSE_PROGRAM_CARD_IDS.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Expose-Ability nutzen.");
    exposeCorpCardInServer(
      state,
      String(legalAction.payload?.serverId) as Exclude<ServerId, "new_remote">,
      legalAction,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: sourceDefinition.id,
      exposedServerId: String(legalAction.payload?.serverId ?? ""),
      hiddenZoneAction: "v1911_expose_server_card",
    };
    return;
  }
  if (ability === "reveal_stack_top") {
    if (!STACK_TOP_REVEAL_PROGRAM_CARD_IDS.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Stack-Reveal-Ability nutzen.");
    revealRunnerStackTop(state, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: sourceDefinition.id,
      hiddenZoneAction: "v1911_reveal_stack_top",
    };
    return;
  }
  if (ability === "arrange_stack_top2") {
    if (sourceDefinition.id !== STACK_TOP_REORDER_RESOURCE_CARD_ID)
      throw new Error("Diese Karte darf keine Stack-Reorder-Ability nutzen.");
    startRunnerStackArrangeChoice(
      state,
      `v1911.arrange_stack_top2:${sourceCardId}`,
      "v1911_arrange_stack_top2",
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: sourceDefinition.id,
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

function installedRunnerIcebreakerIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.programs
    .filter((cardId) => cardHasSubtype(definitionFor(state, cardId), "icebreaker"))
    .sort();
}

function resolveDealWithMilitech(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (!runnerStoleAgendaSubtypeThisTurn(state, "research"))
    throw new Error("Deal with Militech benoetigt eine befreite Research-Agenda in diesem Zug.");
  const targetIds = installedRunnerIcebreakerIds(state);
  for (const cardId of targetIds) addCardCounter(state, cardId, "militech", 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: DEAL_WITH_MILITECH_ID,
    counterType: "militech",
    addedCounterAmount: targetIds.length,
    targetCount: targetIds.length,
    targetCardDefinitionIds: targetIds
      .map((cardId) => definitionFor(state, cardId).id)
      .join(","),
  };
}

function huntClubBbsExposeTargets(state: GameState): CardInstanceId[] {
  const targets: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of [...server.root, ...server.ice]) {
      const instance = mustInstance(state.cardInstances, cardId);
      if (!instance.rezzed) targets.push(cardId);
    }
  }
  return targets.sort();
}

function huntClubBbsExposeOptionLabel(
  state: GameState,
  cardId: CardInstanceId,
): string {
  const zone = mustInstance(state.cardInstances, cardId).zone;
  if (zone.side !== "corp") return "Installierte Korp-Karte";
  if (zone.zone === "serverIce") {
    const server = mustServer(state, zone.serverId);
    const index = server.ice.indexOf(cardId);
    return `${server.label} ICE ${index + 1}`;
  }
  if (zone.zone === "serverRoot") {
    const server = mustServer(state, zone.serverId);
    const index = server.root.indexOf(cardId);
    return `${server.label} Root ${index + 1}`;
  }
  return "Installierte Korp-Karte";
}

function startHuntClubBbsExposeChoice(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = huntClubBbsExposeTargets(state).map((cardId) => ({
    id: `card_${cardId}`,
    label: huntClubBbsExposeOptionLabel(state, cardId),
    value: cardId,
  }));
  if (options.length === 0)
    throw new Error("Hunt Club BBS findet keine installierte verdeckte Korp-Karte.");
  state.pendingChoice = {
    choiceId: `v1912_hunt_club_bbs_expose_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1912.hunt_club_bbs_expose:${state.stateVersion + 1}`,
    prompt: "Bis zu drei installierte Korp-Karten exposen",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(3, options.length),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose_choice",
    choiceVisibility: "runner_private",
  };
}

function resolveHuntClubBbsExposeChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1912.hunt_club_bbs_expose"))
    throw new Error("Es ist keine Hunt-Club-BBS-Expose-Choice offen.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const legalTargets = new Set(huntClubBbsExposeTargets(state));
  for (const cardId of selectedIds) {
    if (!legalTargets.has(cardId))
      throw new Error("Hunt Club BBS darf dieses Ziel nicht exposen.");
  }
  const labels = selectedIds.map((cardId) =>
    huntClubBbsExposeOptionLabel(state, cardId),
  );
  const definitionIds = selectedIds.map((cardId) => definitionFor(state, cardId).id);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose",
    publicRevealKind: "expose",
    revealedCount: selectedIds.length,
    publicRevealDefinitionIds: definitionIds.join(","),
    exposedServerLabels: labels.join(","),
  };
}

function outermostIceExposures(
  state: GameState,
): Array<{ server: CorpServer; cardId: CardInstanceId }> {
  return state.corp.servers
    .filter((server) => server.ice.length > 0)
    .map((server) => ({
      server,
      cardId: server.ice[outermostIceIndex(server)]!,
    }));
}

function exposeOutermostIceOfEachDataFort(
  state: GameState,
  legalAction: LegalAction,
): void {
  const exposures = outermostIceExposures(state);
  if (exposures.length === 0)
    throw new Error("Es liegt kein outermost ICE zum Exposen in einem Data Fort.");
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_expose_outermost_ice_each_data_fort",
    publicRevealKind: "expose",
    revealedCount: exposures.length,
    publicRevealDefinitionIds: exposures
      .map(({ cardId }) => definitionFor(state, cardId).id)
      .join(","),
    exposedServerIds: exposures.map(({ server }) => server.id).join(","),
    exposedServerLabels: exposures.map(({ server }) => server.label).join(","),
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

function krumzTraceBitCardIds(state: GameState): CardInstanceId[] {
  return rezzedCorpRootCardIds(state)
    .filter(
      (cardId) =>
        definitionFor(state, cardId).id === KRUMZ_TRACE_ASSET_CARD_ID &&
        cardCounter(state, cardId, "bit") > 0,
    )
    .sort();
}

function krumzTraceBitTotal(state: GameState): number {
  return krumzTraceBitCardIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "bit"),
    0,
  );
}

function spendKrumzTraceBits(state: GameState, amount: number): number {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Krumz-Bit-Ausgabe ist ungueltig.");
  let remaining = amount;
  let spent = 0;
  for (const cardId of krumzTraceBitCardIds(state)) {
    if (remaining <= 0) break;
    const current = cardCounter(state, cardId, "bit");
    const spend = Math.min(current, remaining);
    spendCardCounter(state, cardId, "bit", spend);
    remaining -= spend;
    spent += spend;
  }
  if (remaining > 0) throw new Error("Krumz hat nicht genug Bits.");
  return spent;
}

function parisCityGridTracePoolSource(
  state: GameState,
): { cardId: CardInstanceId; serverId: Exclude<ServerId, "new_remote"> } | undefined {
  const run = state.run;
  if (!run) return undefined;
  const server = mustServer(state, run.attackedServerId);
  const cardId = server.root
    .slice()
    .sort()
    .find((rootId) => {
      const instance = state.cardInstances[rootId];
      return (
        instance?.rezzed === true &&
        definitionFor(state, rootId).id === PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID &&
        cardCounter(state, rootId, "bit") > 0
      );
    });
  return cardId ? { cardId, serverId: server.id } : undefined;
}

function parisCityGridTracePoolTotal(state: GameState): number {
  const source = parisCityGridTracePoolSource(state);
  return source ? cardCounter(state, source.cardId, "bit") : 0;
}

function spendParisCityGridTracePool(
  state: GameState,
  sourceCardId: CardInstanceId | undefined,
  serverId: Exclude<ServerId, "new_remote"> | undefined,
  amount: number,
): number {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Paris-City-Grid-Bit-Ausgabe ist ungueltig.");
  if (amount <= 0) return 0;
  const current = parisCityGridTracePoolSource(state);
  if (
    !current ||
    current.cardId !== sourceCardId ||
    current.serverId !== serverId ||
    !state.run ||
    state.run.attackedServerId !== serverId
  ) {
    throw new Error("Paris City Grid ist fuer diesen Trace nicht verfuegbar.");
  }
  if (cardCounter(state, current.cardId, "bit") < amount)
    throw new Error("Paris City Grid hat nicht genug Bits.");
  spendCardCounter(state, current.cardId, "bit", amount);
  return amount;
}

function runnerInstalledHardwareTrashTarget(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.rig.hardware
    .slice()
    .sort((left, right) => {
      const leftDefinition = definitionFor(state, left);
      const rightDefinition = definitionFor(state, right);
      const byInstallCost =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
    })[0];
}

function resolveTraceHardwareWreckerSuccess(
  state: GameState,
  sourceDefinitionId: CardDefinitionId,
  sourceCardInstanceId: CardInstanceId,
  traceId: string,
): Record<string, unknown> {
  const targetHardwareId = runnerInstalledHardwareTrashTarget(state);
  const targetDefinitionId = targetHardwareId
    ? definitionFor(state, targetHardwareId).id
    : undefined;
  if (targetHardwareId) trashRunnerInstalledCardToHeap(state, targetHardwareId);
  const damageAmount = 2;
  const summary = doDamage(state, {
    damageId: `${traceId}.${sourceCardInstanceId}.unpreventable_meat`,
    damageType: "meat",
    amount: damageAmount,
    source: `trace_success:${sourceDefinitionId}`,
  });
  return {
    traceSuccessEffect: "hardware_trash_meat_damage_end_run",
    sourceDefinitionId,
    trashedCardType: "hardware",
    trashedCount: targetHardwareId ? 1 : 0,
    ...(targetDefinitionId ? { trashedCardDefinitionId: targetDefinitionId } : {}),
    damageCannotBePrevented: true,
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
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
  const parisCityGridPoolAvailable =
    trace.parisCityGridPoolSourceCardInstanceId &&
    trace.parisCityGridPoolServerId
      ? parisCityGridTracePoolTotal(state)
      : 0;
  const parisCityGridPoolBid = Math.min(parisCityGridPoolAvailable, bid);
  const creditBid = Math.min(
    state.corp.credits,
    bid - parisCityGridPoolBid,
  );
  const krumzBitBid = Math.min(
    krumzTraceBitTotal(state),
    bid - parisCityGridPoolBid - creditBid,
  );
  const hackerTrackerBid =
    bid - parisCityGridPoolBid - creditBid - krumzBitBid;
  if (hackerTrackerBid > hackerTrackerCounterTotal(state))
    throw new Error("Hacker Tracker Central hat nicht genug Counter.");
  const parisCityGridPoolSpent = spendParisCityGridTracePool(
    state,
    trace.parisCityGridPoolSourceCardInstanceId,
    trace.parisCityGridPoolServerId,
    parisCityGridPoolBid,
  );
  spendCredits(state, "corp", creditBid);
  const krumzBitsSpent = spendKrumzTraceBits(state, krumzBitBid);
  const hackerTrackerCountersSpent = spendHackerTrackerCounters(
    state,
    hackerTrackerBid,
  );
  const traceStrength = trace.baseTraceStrength + bid;
  const runnerLink = calculateRunnerLink(state);
  const cryingCounterCount = cardCounter(state, state.runner.identity, "crying");
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
    state.runner.credits + runnerTraceLinkCredits(state),
  );
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "corp_bid",
    baseTraceStrength: trace.baseTraceStrength,
    sourceDefinitionId: trace.sourceDefinitionId,
    ...(typeof trace.corpBidMax === "number"
      ? { corpBidMax: trace.corpBidMax }
      : {}),
    ...(typeof trace.rabbitTraceLimitReduction === "number"
      ? { rabbitTraceLimitReduction: trace.rabbitTraceLimitReduction }
      : {}),
    corpBid: bid,
    corpCreditBid: creditBid,
    ...(parisCityGridPoolSpent > 0
      ? {
          parisCityGridPoolSpent,
          parisCityGridPoolRemaining: trace.parisCityGridPoolSourceCardInstanceId
            ? cardCounter(
                state,
                trace.parisCityGridPoolSourceCardInstanceId,
                "bit",
              )
            : 0,
          parisCityGridPoolServerId: trace.parisCityGridPoolServerId,
        }
      : {}),
    ...(krumzBitsSpent > 0 ? { krumzBitsSpent } : {}),
    ...(hackerTrackerCountersSpent > 0
      ? { hackerTrackerCountersSpent }
      : {}),
    traceStrength,
    runnerLink,
    ...(cryingCounterCount > 0 ? { cryingCounterCount, cryingLinkReduction: cryingCounterCount * 2 } : {}),
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
  const tracePayment = spendRunnerTraceLinkBidCredits(state, bid);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(state);
  const traceStrength =
    trace.traceStrength ?? trace.baseTraceStrength + (trace.corpBid ?? 0);
  const runnerStrength = runnerLink + bid;
  const postBidTrace = {
    ...trace,
    status: "post_bid_link" as const,
    runnerBid: bid,
    runnerStrength,
    postBidLinkBonus: 0,
    postBidLinkSourceIds: [],
  };
  if (startTracePostBidLinkChoice(state, postBidTrace)) {
    state.trace = postBidTrace;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "runner_bid",
      baseTraceStrength: trace.baseTraceStrength,
      corpBid: trace.corpBid ?? 0,
      traceStrength,
      runnerLink,
      runnerBid: bid,
      ...(tracePayment.traceLinkCreditSpent > 0
        ? {
            traceLinkCreditsSpent: tracePayment.traceLinkCreditSpent,
            ...(tracePayment.hellsRunSpent > 0
              ? { hellsRunTraceCreditsSpent: tracePayment.hellsRunSpent }
              : {}),
            runnerCreditsSpent: tracePayment.runnerCreditsSpent,
            traceLinkCreditSourceDefinitionIds:
              tracePayment.sourceDefinitionIds.join(","),
          }
        : {}),
      runnerStrength,
      postBidTraceLinkChoiceOpened: true,
    };
    return;
  }
  const successful = traceStrength > runnerStrength;
  const tagsAdded =
    successful && trace.successEffect.type === "add_tag"
      ? trace.successEffect.amount
      : 0;
  let dataRavenCounterAdded = 0;
  const hackerTrackerCountersAdded = addHackerTrackerTraceCounters(state);
  let fangRunLockCreditCost = 0;
  let fangRunEnded = false;
  let traceHardwareWreckerPayload: Record<string, unknown> = {};
  if (successful) state.runner.tags += tagsAdded;
  let traceCounterPayload: Record<string, string | number> = {};
  if (successful && trace.successEffect.type === "add_counter") {
    addCardCounter(
      state,
      state.runner.identity,
      trace.successEffect.counterType,
      trace.successEffect.amount,
    );
    traceCounterPayload = {
      addedCounterAmount: trace.successEffect.amount,
      counterType: trace.successEffect.counterType,
      remainingCounters: cardCounter(
        state,
        state.runner.identity,
        trace.successEffect.counterType,
      ),
    };
  }
  if (successful && trace.sourceDefinitionId === DATA_RAVEN_ID) {
    addCardCounter(state, trace.sourceCardInstanceId, "power", 1);
    dataRavenCounterAdded = 1;
  }
  if (
    successful &&
    (trace.sourceDefinitionId === FANG_ID ||
      trace.sourceDefinitionId === FANG_2_0_ID)
  ) {
    fangRunLockCreditCost = 2;
    ensureRunnerTurnFlags(state).fangRunLockCreditCost = fangRunLockCreditCost;
    fangRunEnded = true;
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
    if (
      successful &&
      (trace.sourceDefinitionId === CINDERELLA_ID ||
        trace.sourceDefinitionId === HOMEWRECKER_ID)
    ) {
      traceHardwareWreckerPayload = resolveTraceHardwareWreckerSuccess(
        state,
        trace.sourceDefinitionId,
        trace.sourceCardInstanceId,
        trace.traceId,
      );
      if (!state.winner && state.run) finishRun(state, false);
    } else if (fangRunEnded) {
      finishRun(state, false);
    } else {
      state.timingPoint = "run.encounter_ice";
      state.activeSide = "runner";
    }
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
    ...(tracePayment.traceLinkCreditSpent > 0
      ? {
          traceLinkCreditsSpent: tracePayment.traceLinkCreditSpent,
          ...(tracePayment.hellsRunSpent > 0
            ? { hellsRunTraceCreditsSpent: tracePayment.hellsRunSpent }
            : {}),
          runnerCreditsSpent: tracePayment.runnerCreditsSpent,
          traceLinkCreditSourceDefinitionIds:
            tracePayment.sourceDefinitionIds.join(","),
        }
      : {}),
    runnerStrength,
    traceSuccessful: successful,
    tagsAdded,
    ...traceCounterPayload,
    ...(dataRavenCounterAdded > 0 ? { dataRavenCounterAdded } : {}),
    ...(hackerTrackerCountersAdded > 0 ? { hackerTrackerCountersAdded } : {}),
    ...(fangRunEnded
      ? {
          fangRunEnded: true,
          fangRunLockCreditCost,
        }
      : {}),
    ...traceHardwareWreckerPayload,
  };
}

function postBidTraceLinkCandidates(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
): Array<{
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
  label: string;
  linkDelta: number;
}> {
  const used = new Set(trace.postBidLinkSourceIds ?? []);
  if (state.runner.credits < 1) return [];
  const candidates: Array<{
    cardId: CardInstanceId;
    definitionId: CardDefinitionId;
    label: string;
    linkDelta: number;
  }> = [];
  for (const cardId of state.runner.rig.programs) {
    if (used.has(cardId)) continue;
    const definition = definitionFor(state, cardId);
    if (definition.id !== SIGNPOST_ID) continue;
    candidates.push({
      cardId,
      definitionId: definition.id,
      label: definition.title,
      linkDelta: 2,
    });
  }
  for (const cardId of state.runner.rig.resources) {
    if (used.has(cardId)) continue;
    const definition = definitionFor(state, cardId);
    if (definition.id !== THE_SPRINGBOARD_ID) continue;
    candidates.push({
      cardId,
      definitionId: definition.id,
      label: definition.title,
      linkDelta: 1,
    });
  }
  return candidates;
}

function startTracePostBidLinkChoice(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
): boolean {
  const candidates = postBidTraceLinkCandidates(state, trace);
  if (candidates.length === 0) return false;
  state.pendingChoice = {
    choiceId: `${trace.traceId}.post_bid_link.${state.stateVersion + 1}`,
    side: "runner",
    source: `trace_post_bid_link:${trace.traceId}`,
    prompt: "Post-bid Link-Faehigkeit nutzen",
    kind: "select_option",
    options: [
      { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      ...candidates.map((candidate) => ({
        id: `trace_link_${candidate.cardId}`,
        label: `${candidate.label}: +${candidate.linkDelta} Link`,
        publicLabel: "Trace Link",
        value: candidate.cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  state.activeSide = "runner";
  return true;
}

function resolveTracePostBidLinkChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = state.trace;
  if (!trace || trace.status !== "post_bid_link")
    throw new Error("Es ist kein Post-Bid-Link-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected !== "pass") {
    const option = state.pendingChoice?.options.find(
      (candidate) => candidate.id === selected,
    );
    const cardId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    const candidate = postBidTraceLinkCandidates(state, trace).find(
      (item) => item.cardId === cardId,
    );
    if (!candidate)
      throw new Error("Diese Post-Bid-Link-Quelle ist nicht legal.");
    spendCredits(state, "runner", 1);
    const nextTrace = {
      ...trace,
      runnerLink: (trace.runnerLink ?? 0) + candidate.linkDelta,
      runnerStrength: (trace.runnerStrength ?? 0) + candidate.linkDelta,
      postBidLinkBonus:
        (trace.postBidLinkBonus ?? 0) + candidate.linkDelta,
      postBidLinkSourceIds: [
        ...(trace.postBidLinkSourceIds ?? []),
        candidate.cardId,
      ],
    };
    delete state.pendingChoice;
    state.trace = nextTrace;
    const opensNext = startTracePostBidLinkChoice(state, nextTrace);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "post_bid_link",
      eventModificationDecision: "apply",
      sourceDefinitionId: candidate.definitionId,
      postBidTraceLinkSourceDefinitionId: candidate.definitionId,
      postBidTraceLinkCostPaid: 1,
      postBidTraceLinkDelta: candidate.linkDelta,
      postBidTraceLinkBonus: nextTrace.postBidLinkBonus ?? 0,
      runnerLink: nextTrace.runnerLink ?? 0,
      runnerStrength: nextTrace.runnerStrength ?? 0,
      postBidTraceLinkChoiceOpened: opensNext,
    };
    if (opensNext) return;
    completeTraceAfterPostBidLink(state, nextTrace, legalAction);
    return;
  }
  delete state.pendingChoice;
  completeTraceAfterPostBidLink(state, trace, legalAction);
}

function completeTraceAfterPostBidLink(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
  legalAction: LegalAction,
): void {
  const traceStrength =
    trace.traceStrength ?? trace.baseTraceStrength + (trace.corpBid ?? 0);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(state);
  const runnerBid = trace.runnerBid ?? 0;
  const runnerStrength = trace.runnerStrength ?? runnerLink + runnerBid;
  const successful = traceStrength > runnerStrength;
  const tagsAdded =
    successful && trace.successEffect.type === "add_tag"
      ? trace.successEffect.amount
      : 0;
  let dataRavenCounterAdded = 0;
  const hackerTrackerCountersAdded = addHackerTrackerTraceCounters(state);
  let fangRunLockCreditCost = 0;
  let fangRunEnded = false;
  let traceHardwareWreckerPayload: Record<string, unknown> = {};
  if (successful) state.runner.tags += tagsAdded;
  let traceCounterPayload: Record<string, string | number> = {};
  if (successful && trace.successEffect.type === "add_counter") {
    addCardCounter(
      state,
      state.runner.identity,
      trace.successEffect.counterType,
      trace.successEffect.amount,
    );
    traceCounterPayload = {
      addedCounterAmount: trace.successEffect.amount,
      counterType: trace.successEffect.counterType,
      remainingCounters: cardCounter(
        state,
        state.runner.identity,
        trace.successEffect.counterType,
      ),
    };
  }
  if (successful && trace.sourceDefinitionId === DATA_RAVEN_ID) {
    addCardCounter(state, trace.sourceCardInstanceId, "power", 1);
    dataRavenCounterAdded = 1;
  }
  if (
    successful &&
    (trace.sourceDefinitionId === FANG_ID ||
      trace.sourceDefinitionId === FANG_2_0_ID)
  ) {
    fangRunLockCreditCost = 2;
    ensureRunnerTurnFlags(state).fangRunLockCreditCost = fangRunLockCreditCost;
    fangRunEnded = true;
  }
  delete state.trace;
  if (state.run) {
    if (trace.subroutineIndex !== undefined) {
      state.run.traceSuccessBySubroutineIndex = {
        ...(state.run.traceSuccessBySubroutineIndex ?? {}),
        [trace.subroutineIndex]: successful,
      };
    }
    if (
      successful &&
      (trace.sourceDefinitionId === CINDERELLA_ID ||
        trace.sourceDefinitionId === HOMEWRECKER_ID)
    ) {
      traceHardwareWreckerPayload = resolveTraceHardwareWreckerSuccess(
        state,
        trace.sourceDefinitionId,
        trace.sourceCardInstanceId,
        trace.traceId,
      );
      if (!state.winner && state.run) finishRun(state, false);
    } else if (fangRunEnded) {
      finishRun(state, false);
    } else {
      state.timingPoint = "run.encounter_ice";
      state.activeSide = "runner";
    }
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
    traceStep: "post_bid_link",
    baseTraceStrength: trace.baseTraceStrength,
    corpBid: trace.corpBid ?? 0,
    traceStrength,
    runnerLink,
    runnerBid,
    runnerStrength,
    postBidTraceLinkBonus: trace.postBidLinkBonus ?? 0,
    traceSuccessful: successful,
    tagsAdded,
    ...traceCounterPayload,
    ...(dataRavenCounterAdded > 0 ? { dataRavenCounterAdded } : {}),
    ...(hackerTrackerCountersAdded > 0 ? { hackerTrackerCountersAdded } : {}),
    ...(fangRunEnded
      ? {
          fangRunEnded: true,
          fangRunLockCreditCost,
        }
      : {}),
    ...traceHardwareWreckerPayload,
  };
}

function isSupportedTraceSuccessEffect(effect: TraceSuccessEffect): boolean {
  if (effect.type === "none") return true;
  if (effect.type === "add_counter") {
    return (
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      effect.counterType === "cerberus"
    );
  }
  return (
    effect.type === "add_tag" &&
    Number.isInteger(effect.amount) &&
    effect.amount >= 0
  );
}

function runnerTraceLinkCreditSourceIds(state: GameState): CardInstanceId[] {
  return [...state.runner.rig.hardware, ...state.runner.rig.resources]
    .filter(
      (cardId) =>
        (definitionFor(state, cardId).id === HELLS_RUN_ID ||
          definitionFor(state, cardId).id === PK_6089A_ID) &&
        cardCounter(state, cardId, "recurring_credit") > 0,
    )
    .sort();
}

function runnerTraceLinkCredits(state: GameState): number {
  return runnerTraceLinkCreditSourceIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
    0,
  );
}

function spendRunnerTraceLinkBidCredits(
  state: GameState,
  amount: number,
): {
  traceLinkCreditSpent: number;
  hellsRunSpent: number;
  runnerCreditsSpent: number;
  sourceDefinitionIds: string[];
} {
  if (amount <= 0)
    return {
      traceLinkCreditSpent: 0,
      hellsRunSpent: 0,
      runnerCreditsSpent: 0,
      sourceDefinitionIds: [],
    };
  if (state.runner.credits + runnerTraceLinkCredits(state) < amount)
    throw new Error("Der Runner kann den Link-Bid nicht bezahlen.");
  let remaining = amount;
  let traceLinkCreditSpent = 0;
  let hellsRunSpent = 0;
  const sourceDefinitionIds = new Set<string>();
  for (const cardId of runnerTraceLinkCreditSourceIds(state)) {
    if (remaining <= 0) break;
    const spent = Math.min(
      cardCounter(state, cardId, "recurring_credit"),
      remaining,
    );
    if (spent <= 0) continue;
    spendCardCounter(state, cardId, "recurring_credit", spent);
    remaining -= spent;
    traceLinkCreditSpent += spent;
    const definitionId = definitionFor(state, cardId).id;
    if (definitionId === HELLS_RUN_ID) hellsRunSpent += spent;
    sourceDefinitionIds.add(definitionId);
  }
  spendCredits(state, "runner", remaining);
  return {
    traceLinkCreditSpent,
    hellsRunSpent,
    runnerCreditsSpent: remaining,
    sourceDefinitionIds: [...sourceDefinitionIds].sort(),
  };
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
  ].reduce((best, cardId) => {
    const cardLink = definitionFor(state, cardId).baseLink ?? 0;
    if (!Number.isInteger(cardLink) || cardLink < 0)
      throw new Error("Runner-Link ist ungueltig.");
    return Math.max(best, cardLink);
  }, 0);
  const cryingReduction = cardCounter(state, state.runner.identity, "crying") * 2;
  const link = Math.max(0, baseLink + modifier + installedLink - cryingReduction);
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
  if (payload?.iceId) parts.push(String(payload.iceId));
  if (payload?.subroutineIndex !== undefined)
    parts.push(String(payload.subroutineIndex));
  if (payload?.subroutineIndexes !== undefined)
    parts.push(String(payload.subroutineIndexes));
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
  if (payload?.resourceAbility) parts.push(String(payload.resourceAbility));
  if (payload?.runnerAbility) parts.push(String(payload.runnerAbility));
  if (payload?.acmeSavingsAndLoanAbility)
    parts.push(String(payload.acmeSavingsAndLoanAbility));
  if (payload?.agendaAbility) parts.push(String(payload.agendaAbility));
  if (payload?.redHerringsCardId) parts.push(String(payload.redHerringsCardId));
  if (payload?.oliviaSalazarCardId)
    parts.push(String(payload.oliviaSalazarCardId));
  if (payload?.targetCardId) parts.push(String(payload.targetCardId));
  if (payload?.approachIceExposeDecision)
    parts.push(String(payload.approachIceExposeDecision));
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
  const actionUseContext = publicActionUseContext(previousState, legalAction);
  const actionContext = publicContextForAction(state, legalAction);
  const publicPayload: Record<string, unknown> = {
    actor,
    actionType: legalAction.type,
    label: publicLabel(legalAction),
    ...actionUseContext,
    ...actionContext,
    ...buildPublicAbilitySchemaContext(
      legalAction.type,
      legalAction.payload,
      actionContext,
      visibilityClass,
    ),
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
  const resolvedEffects = legalAction.resolvedEffects;

  if (Array.isArray(resolvedEffects)) context.resolvedEffects = resolvedEffects;
  if (serverLabel) context.serverLabel = serverLabel;
  if (legalAction.type === "start_run" && state.run) {
    const runAccessCount = Math.max(1, Math.floor(state.run.accessCount ?? 1));
    const runInstalledAccessBonus =
      v1915InstalledAccessBonus(state, state.run.attackedServerId) +
      (state.run.attackedServerId === "hq" ? runnerHqAccessBonus(state) : 0);
    context.baseAccessCount = Math.max(
      1,
      runAccessCount - runInstalledAccessBonus,
    );
    context.installedAccessBonus = runInstalledAccessBonus;
    context.effectiveAccessCount = runAccessCount;
  }
  for (const key of [
    "baseAccessCount",
    "installedAccessBonus",
    "effectiveAccessCount",
    "vacuumLinkDieRoll",
    "vacuumLinkRewindApplied",
    "vacuumLinkRewindRezzedIceBack",
    "vacuumLinkTargetIceIndex",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number" || typeof value === "boolean")
      context[key] = value;
  }
  if (typeof legalAction.payload?.installedAccessBonusSourceDefinitionIds === "string")
    context.installedAccessBonusSourceDefinitionIds =
      legalAction.payload.installedAccessBonusSourceDefinitionIds;
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
    if (legalAction.payload?.zetatechOverlayInstall === true) {
      context.v1922RunnerProgramAbility = "zetatech_overlay_install";
      context.zetatechOverlayInstall = true;
      if (typeof legalAction.payload.hostDefinitionId === "string")
        context.hostDefinitionId = legalAction.payload.hostDefinitionId;
      if (typeof legalAction.payload.zetatechRecurringCreditsSpent === "number")
        context.zetatechRecurringCreditsSpent =
          legalAction.payload.zetatechRecurringCreditsSpent;
      if (typeof legalAction.payload.runnerCreditsAfter === "number")
        context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    }
    for (const key of [
      "agendaPointCostPaid",
      "deckUniqueReplacement",
      "forfeitedAgendaCardId",
      "iceInstallBaseCost",
      "iceInstallAdditionalCost",
      "iceInstallReduction",
      "iceInstallTotalCost",
      "recurringCreditsLoaded",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.v181RunnerProgramAbility === "string") {
    context.v181RunnerProgramAbility =
      legalAction.payload.v181RunnerProgramAbility;
    for (const key of [
      "pattelsVirusCandidateCount",
      "pattelsVirusCounterAdded",
      "poxCounterAdded",
      "poxCountersAfter",
      "remainingCounters",
    ]) {
      const value = legalAction.payload?.[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.pattelsVirusChoiceOpened === "boolean")
      context.pattelsVirusChoiceOpened =
        legalAction.payload.pattelsVirusChoiceOpened;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.targetServerLabel === "string")
      context.targetServerLabel = legalAction.payload.targetServerLabel;
    if (typeof legalAction.payload.choiceVisibility === "string")
      context.choiceVisibility = legalAction.payload.choiceVisibility;
  }
  if (legalAction.type === "trash_resource") context.zoneLabel = "Resource";
  if (legalAction.type === "rez_ice")
    context.zoneLabel =
      legalAction.payload?.rootRez === true ||
      legalAction.payload?.assetRez === true
        ? "Remote"
        : "ICE";
  if (legalAction.type === "rez_ice") {
    if (legalAction.payload?.encounterTaxForFutureIce !== undefined)
      context.result = state.run ? "continued" : "ended";
    for (const key of [
      "rezCostPaid",
      "rezCostReductionAmount",
      "rezCostReductionSourceDefinitionIds",
      "encounterTaxForFutureIce",
      "encounterTaxPaid",
      "encounterTaxSource",
      "v1922RunnerProgramAbility",
      "sourceDefinitionId",
      "counterType",
      "addedCounterAmount",
      "remainingCounters",
      "speedTrapSourceCardId",
      "rezzedCardDefinitionId",
      "serverLabel",
      "speedTrapChoiceOpened",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (
    legalAction.type === "break_subroutine" &&
    typeof legalAction.payload?.postBreakStealthLoss === "number"
  ) {
    context.postBreakStealthLoss = legalAction.payload.postBreakStealthLoss;
  }
  if (
    legalAction.type === "break_subroutine" &&
    typeof legalAction.payload?.breakSubroutineCount === "number"
  ) {
    context.breakSubroutineCount = legalAction.payload.breakSubroutineCount;
  }
  if (
    legalAction.type === "break_subroutine" &&
    legalAction.payload?.pileDriverMultiBreak === true
  ) {
    context.pileDriverMultiBreak = true;
  }
  if (
    legalAction.type === "resolve_choice" &&
    typeof legalAction.payload?.postBreakStealthLoss === "number"
  ) {
    context.postBreakStealthLoss = legalAction.payload.postBreakStealthLoss;
  }
  if (typeof legalAction.payload?.postBreakStealthLossPending === "number") {
    context.postBreakStealthLossPending =
      legalAction.payload.postBreakStealthLossPending;
  }
  if (legalAction.type === "remove_tag") {
    context.amount = Number(legalAction.payload?.removeTagAmount ?? 1);
    for (const key of [
      "armadilloRecurringCreditsSpent",
      "tagRemovalRecurringCreditsSpent",
      "runnerCreditsSpent",
      "tagRemovalCreditSourceDefinitionIds",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  } else if (legalAction.type === "draw_card") {
    context.amount = 1;
  } else if (legalAction.type === "gain_credit") {
    if (Number.isInteger(legalAction.payload?.gainCreditsAmount)) {
      context.amount = Number(legalAction.payload?.gainCreditsAmount);
    } else if (legalAction.payload?.traceStarted !== true) {
      context.amount = 1;
    }
    if (typeof legalAction.payload?.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    const agendaPointCostPaid = legalAction.payload?.agendaPointCostPaid;
    if (Number.isInteger(agendaPointCostPaid))
      context.agendaPointCostPaid = Number(agendaPointCostPaid);
  }
  if (legalAction.type === "resolve_choice") {
    context.choiceKind = legalAction.payload?.choiceKind;
    if (legalAction.payload?.discardResolved === true) {
      context.discardResolved = true;
      context.discardSide = legalAction.payload.discardSide;
      context.discardCount = legalAction.payload.discardCount;
      context.discardZone = legalAction.payload.discardZone;
      context.redactedKind = "discard";
      if (legalAction.payload.randomizedByCockroach === true)
        context.randomizedByCockroach = true;
      if (typeof legalAction.payload.cockroachCounterTotal === "number")
        context.cockroachCounterTotal = legalAction.payload.cockroachCounterTotal;
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
      "agendaPointCost",
      "agendaPointCostPaid",
      "forfeitedAgendaDefinitionIds",
      "specialZone",
      "specialZoneVisibility",
      "specialZoneReason",
      "sourceDefinitionId",
      "originalAmount",
      "preventedAmount",
      "finalAmount",
      "fullBodyConversionCorpBypassPaid",
      "fullBodyConversionBypassCostPerDamage",
      "codeViralCachePreservedCounters",
      "preservedCounterAmount",
      "remainingVirusCounters",
      "preservedCardDefinitionIds",
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
      "preventedAmount",
      "v1919RunnerEventAbility",
      "v1920RunnerProgramAbility",
      "coreDamageRemoved",
      "gripCardsLost",
      "drawnCards",
      "gainedCredits",
      "removedTags",
      "runnerMaxHandSizeAfter",
      "agendaPointCostPaid",
      "futureActionDebtAdded",
      "futureActionDebtPending",
      "futureAgendaPointForfeitAdded",
      "futureAgendaPointForfeitPending",
      "sourceDefinitionId",
      "cardDefinitionId",
      "speedTrapSourceCardId",
      "rezzedCardDefinitionId",
      "serverLabel",
      "speedTrapUsed",
      "successfulRunWithoutAccess",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    for (const key of [
      "traceId",
      "traceStep",
      "baseTraceStrength",
      "corpBidMax",
      "rabbitTraceLimitReduction",
      "sourceDefinitionId",
      "corpBid",
      "traceStrength",
      "runnerLink",
      "runnerBid",
      "traceLinkCreditsSpent",
      "hellsRunTraceCreditsSpent",
      "runnerCreditsSpent",
      "traceLinkCreditSourceDefinitionIds",
      "runnerStrength",
      "postBidTraceLinkChoiceOpened",
      "postBidTraceLinkSourceDefinitionId",
      "postBidTraceLinkCostPaid",
      "postBidTraceLinkDelta",
      "postBidTraceLinkBonus",
      "traceSuccessful",
      "tagsAdded",
      "cryingCounterCount",
      "cryingLinkReduction",
      "corpCreditBid",
      "parisCityGridPoolSpent",
      "parisCityGridPoolRemaining",
      "parisCityGridPoolServerId",
      "krumzBitsSpent",
      "hackerTrackerCountersSpent",
      "hackerTrackerCountersAdded",
      "fangRunEnded",
      "fangRunLockCreditCost",
      "traceSuccessEffect",
      "trashedCardDefinitionId",
      "trashedCardType",
      "trashedCount",
      "damageCannotBePrevented",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.type === "continue_run") {
    context.result = state.run ? "continued" : "ended";
    if (typeof legalAction.payload?.trashedCardDefinitionId === "string")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload?.trashedCardType === "string")
      context.trashedCardType = legalAction.payload.trashedCardType;
    if (typeof legalAction.payload?.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (legalAction.payload?.encounterContinue === true) {
      context.encounterContinue = true;
      context.unbrokenSubroutineCount =
        legalAction.payload.unbrokenSubroutineCount;
      context.encounterWillEndRun = legalAction.payload.encounterWillEndRun;
    }
    for (const key of [
      "encounterTaxForFutureIce",
      "encounterTaxPaid",
      "encounterTaxSource",
      "tokyoChibaInfightingBonus",
      "corpCreditsGained",
      "corpCreditsAfter",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
    if (legalAction.payload?.bartmossPostEncounterChecked === true) {
      context.bartmossPostEncounterChecked = true;
      context.bartmossPostEncounterOutcomes =
        legalAction.payload.bartmossPostEncounterOutcomes;
    }
  }
  if (legalAction.payload?.traceStarted === true) {
    if (typeof legalAction.payload.agendaAbility === "string")
      context.agendaAbility = legalAction.payload.agendaAbility;
    context.traceStarted = true;
    context.traceId = legalAction.payload.traceId;
    context.sourceCardId = legalAction.payload.sourceCardId;
    context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    context.baseTraceStrength = legalAction.payload.baseTraceStrength;
    if (typeof legalAction.payload.corpBidMax === "number")
      context.corpBidMax = legalAction.payload.corpBidMax;
    if (typeof legalAction.payload.rabbitTraceLimitReduction === "number")
      context.rabbitTraceLimitReduction =
        legalAction.payload.rabbitTraceLimitReduction;
    if (legalAction.payload.oncePerRunConsumed === true)
      context.oncePerRunConsumed = true;
  }
  if (legalAction.type === "play_operation") {
    for (const key of [
      "gainedCredits",
      "drawnCards",
      "corpCreditsAfter",
      "corpClicksAfter",
      "gainedActions",
      "tagsAdded",
      "runnerTagsAfter",
      "trashedResourceCount",
      "trashedResourceDefinitionIds",
      "runnerRunAttemptsLastTurn",
    ]) {
      const value = legalAction.payload?.[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.payload?.damageResolved === true) {
    context.damageResolved = true;
    context.damageType = legalAction.payload.damageType;
    context.damageAmount = legalAction.payload.damageAmount;
    context.cardsTrashed = legalAction.payload.cardsTrashed;
    context.flatline = legalAction.payload.flatline;
    if (typeof legalAction.payload.baseDamageAmount === "number")
      context.baseDamageAmount = legalAction.payload.baseDamageAmount;
    if (typeof legalAction.payload.bioweaponsEngineeringModifier === "number")
      context.bioweaponsEngineeringModifier =
        legalAction.payload.bioweaponsEngineeringModifier;
    if (typeof legalAction.payload.coreDamageAfter === "number")
      context.coreDamageAfter = legalAction.payload.coreDamageAfter;
    if (typeof legalAction.payload.runnerMaxHandSizeAfter === "number")
      context.runnerMaxHandSizeAfter =
        legalAction.payload.runnerMaxHandSizeAfter;
    if (typeof legalAction.payload.cerberusCounterCount === "number")
      context.cerberusCounterCount = legalAction.payload.cerberusCounterCount;
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
    if (typeof legalAction.payload.installedCount === "number")
      context.installedCount = legalAction.payload.installedCount;
    if (typeof legalAction.payload.installedIceCount === "number")
      context.installedIceCount = legalAction.payload.installedIceCount;
    if (typeof legalAction.payload.installedRootCount === "number")
      context.installedRootCount = legalAction.payload.installedRootCount;
    if (typeof legalAction.payload.swappedIceCount === "number")
      context.swappedIceCount = legalAction.payload.swappedIceCount;
    if (typeof legalAction.payload.iceIndex === "number")
      context.iceIndex = legalAction.payload.iceIndex;
    if (typeof legalAction.payload.choiceVisibility === "string")
      context.choiceVisibility = legalAction.payload.choiceVisibility;
    if (typeof legalAction.payload.temporaryCreditsProvided === "number")
      context.temporaryCreditsProvided =
        legalAction.payload.temporaryCreditsProvided;
    if (typeof legalAction.payload.temporaryCreditsSpent === "number")
      context.temporaryCreditsSpent = legalAction.payload.temporaryCreditsSpent;
    if (typeof legalAction.payload.corpCreditsSpent === "number")
      context.corpCreditsSpent = legalAction.payload.corpCreditsSpent;
    if (
      typeof legalAction.payload.dataFortReclamationRezChoiceOpened ===
      "boolean"
    )
      context.dataFortReclamationRezChoiceOpened =
        legalAction.payload.dataFortReclamationRezChoiceOpened;
    if (
      typeof legalAction.payload.dataFortReclamationRezCandidateCount ===
      "number"
    )
      context.dataFortReclamationRezCandidateCount =
        legalAction.payload.dataFortReclamationRezCandidateCount;
    if (typeof legalAction.payload.temporaryCreditsRemaining === "number")
      context.temporaryCreditsRemaining =
        legalAction.payload.temporaryCreditsRemaining;
    if (typeof legalAction.payload.rezzedCount === "number")
      context.rezzedCount = legalAction.payload.rezzedCount;
    if (typeof legalAction.payload.rezzedIceCount === "number")
      context.rezzedIceCount = legalAction.payload.rezzedIceCount;
    if (typeof legalAction.payload.rezzedRootCount === "number")
      context.rezzedRootCount = legalAction.payload.rezzedRootCount;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
    if (legalAction.payload.rezSequenceDeferred === true)
      context.rezSequenceDeferred = true;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.accessReplacement === "string")
      context.accessReplacement = legalAction.payload.accessReplacement;
    if (typeof legalAction.payload.creditLoss === "number")
      context.creditLoss = legalAction.payload.creditLoss;
    if (typeof legalAction.payload.ambushDefinitionId === "string")
      context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
    if (typeof legalAction.payload.advancementCounterCount === "number")
      context.advancementCounterCount =
        legalAction.payload.advancementCounterCount;
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
    if (typeof legalAction.payload.searchReveal === "string")
      context.searchReveal = legalAction.payload.searchReveal;
    if (typeof legalAction.payload.searchDestination === "string")
      context.searchDestination = legalAction.payload.searchDestination;
    if (typeof legalAction.payload.searchShuffleAfter === "boolean")
      context.searchShuffleAfter = legalAction.payload.searchShuffleAfter;
    if (typeof legalAction.payload.temporaryInstall === "boolean")
      context.temporaryInstall = legalAction.payload.temporaryInstall;
    if (typeof legalAction.payload.installedProgramDefinitionId === "string")
      context.installedProgramDefinitionId =
        legalAction.payload.installedProgramDefinitionId;
    for (const key of [
      "sourceTrashed",
      "shuffled",
      "muTrashChoiceOpened",
      "muTrashChoiceResolved",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "boolean") context[key] = value;
    }
    for (const key of [
      "installCostPaid",
      "runnerMemoryUsedAfter",
      "muShortfall",
      "trashedForMemoryCount",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.trashedForMemoryDefinitionIds === "string")
      context.trashedForMemoryDefinitionIds =
        legalAction.payload.trashedForMemoryDefinitionIds;
    if (typeof legalAction.payload.returnedCount === "number")
      context.returnedCount = legalAction.payload.returnedCount;
    if (typeof legalAction.payload.returnedCardDefinitionIds === "string")
      context.returnedCardDefinitionIds =
        legalAction.payload.returnedCardDefinitionIds;
    if (typeof legalAction.payload.archivesRevealCount === "number")
      context.archivesRevealCount = legalAction.payload.archivesRevealCount;
    if (typeof legalAction.payload.revealedCount === "number")
      context.revealedCount = legalAction.payload.revealedCount;
    if (typeof legalAction.payload.revealedAgendaDefinitionIds === "string")
      context.revealedAgendaDefinitionIds =
        legalAction.payload.revealedAgendaDefinitionIds;
    if (typeof legalAction.payload.hqCardCount === "number")
      context.hqCardCount = legalAction.payload.hqCardCount;
    if (typeof legalAction.payload.drawnCount === "number")
      context.drawnCount = legalAction.payload.drawnCount;
    if (typeof legalAction.payload.corpDrawnCount === "number")
      context.corpDrawnCount = legalAction.payload.corpDrawnCount;
    if (typeof legalAction.payload.randomDrawRecordPurpose === "string")
      context.randomDrawRecordPurpose =
        legalAction.payload.randomDrawRecordPurpose;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (legalAction.payload.oncePerRunConsumed === true)
      context.oncePerRunConsumed = true;
    if (typeof legalAction.payload.publicRevealDefinitionIds === "string")
      context.publicRevealDefinitionIds =
        legalAction.payload.publicRevealDefinitionIds;
    if (typeof legalAction.payload.exposedServerIds === "string")
      context.exposedServerIds = legalAction.payload.exposedServerIds;
    if (typeof legalAction.payload.exposedServerLabels === "string")
      context.exposedServerLabels = legalAction.payload.exposedServerLabels;
    if (typeof legalAction.payload.targetCardDefinitionIds === "string")
      context.targetCardDefinitionIds =
        legalAction.payload.targetCardDefinitionIds;
    context.redactedKind = "hidden_zone";
  }
  if (typeof legalAction.payload?.archivesAutoAccessedCount === "number")
    context.archivesAutoAccessedCount =
      legalAction.payload.archivesAutoAccessedCount;
  for (const key of [
    "accessTrashBaseCost",
    "accessTrashCostModifier",
    "accessTrashTotalCost",
    "scatterShotRecurringCreditsAvailable",
    "scatterShotRecurringCreditsSpent",
    "poltergeistRecurringCreditsAvailable",
    "poltergeistRecurringCreditsSpent",
    "runnerCreditsSpent",
  ]) {
    const value = legalAction.payload?.[key];
    if (typeof value === "number") context[key] = value;
  }
  if (typeof legalAction.payload?.v1922RunnerProgramAbility === "string")
    context.v1922RunnerProgramAbility =
      legalAction.payload.v1922RunnerProgramAbility;
  if (typeof legalAction.payload?.runnerHardwareAbility === "string")
    context.runnerHardwareAbility = legalAction.payload.runnerHardwareAbility;
  if (typeof legalAction.payload?.printedDamageAmount === "number")
    context.printedDamageAmount = legalAction.payload.printedDamageAmount;
  if (typeof legalAction.payload?.redHerringsCardId === "string")
    context.redHerringsCardId = legalAction.payload.redHerringsCardId;
  if (legalAction.payload?.redHerringsTaxPersistsForRun === true)
    context.redHerringsTaxPersistsForRun = true;
  if (legalAction.payload?.publicRevealKind)
    context.revealKind = legalAction.payload.publicRevealKind;
  if (typeof legalAction.payload?.publicRevealKind === "string")
    context.publicRevealKind = legalAction.payload.publicRevealKind;
  if (typeof legalAction.payload?.publicRevealDefinitionId === "string")
    context.publicRevealDefinitionId =
      legalAction.payload.publicRevealDefinitionId;
  if (typeof legalAction.payload?.exposedServerId === "string")
    context.exposedServerId = legalAction.payload.exposedServerId;
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
  if (typeof legalAction.payload?.targetCount === "number")
    context.targetCount = legalAction.payload.targetCount;
  if (typeof legalAction.payload?.targetCardDefinitionIds === "string")
    context.targetCardDefinitionIds = legalAction.payload.targetCardDefinitionIds;
  if (typeof legalAction.payload?.removedTags === "number")
    context.removedTags = legalAction.payload.removedTags;
  if (typeof legalAction.payload?.discardedCardsCount === "number")
    context.discardedCardsCount = legalAction.payload.discardedCardsCount;
  if (typeof legalAction.payload?.runnerTagsAfter === "number")
    context.runnerTagsAfter = legalAction.payload.runnerTagsAfter;
  if (legalAction.payload?.socialEngineeringRun === true)
    context.socialEngineeringRun = true;
  for (const key of [
    "gainedCredits",
    "runnerCreditsAfter",
    "corpCreditsAfter",
    "resourceAbility",
    "counterType",
    "addedCounterAmount",
    "removedCounterAmount",
    "remainingCounters",
    "shortTermContractTrashed",
    "gainCreditsAmount",
    "removePowerCounterAmount",
    "drawnCount",
    "runnerGripAfter",
    "citySurveillanceSourceCount",
    "citySurveillanceCreditsPaid",
    "citySurveillanceTagsAdded",
    "creditsLost",
    "tagsAdded",
    "runnerTagsAfter",
    "sourceDefinitionId",
    "subroutineIndex",
    "targetIceDefinitionId",
    "breakSubroutineBaseCost",
    "checkedIceCount",
    "rezzedIceCount",
    "rezCostPaid",
    "priorityRequisitionChoiceOpened",
    "priorityRequisitionCandidateCount",
    "priorityRequisitionFreeRez",
    "priorityRequisitionDeclined",
    "priorityRequisitionTargetDefinitionId",
    "iceCount",
    "serverIceOrderReversed",
    "serverLabel",
    "accessCount",
    "gainedAgendaPoints",
  ]) {
    const value = legalAction.payload?.[key];
    if (value !== undefined) context[key] = value;
  }
  if (legalAction.payload?.allNighterBonusRunOnFinish === true)
    context.allNighterBonusRunOnFinish = true;
  if (legalAction.payload?.bypassFirstIce === true)
    context.bypassFirstIce = true;
  if (legalAction.payload?.scoredAsAgenda === true)
    context.scoredAsAgenda = true;
  if (typeof legalAction.payload?.sourceTrashed === "boolean")
    context.sourceTrashed = legalAction.payload.sourceTrashed;
  if (typeof legalAction.payload?.ambushDefinitionId === "string")
    context.ambushDefinitionId = legalAction.payload.ambushDefinitionId;
  if (typeof legalAction.payload?.tagConditionMet === "boolean")
    context.tagConditionMet = legalAction.payload.tagConditionMet;
  if (typeof legalAction.payload?.damageSkippedReason === "string")
    context.damageSkippedReason = legalAction.payload.damageSkippedReason;
  if (typeof legalAction.payload?.ambushSkippedReason === "string")
    context.ambushSkippedReason = legalAction.payload.ambushSkippedReason;
  if (typeof legalAction.payload?.onScoreGainCredits === "number")
    context.onScoreGainCredits = legalAction.payload.onScoreGainCredits;
  if (typeof legalAction.payload?.securityNetOptimizationServerId === "string")
    context.securityNetOptimizationServerId =
      legalAction.payload.securityNetOptimizationServerId;
  if (typeof legalAction.payload?.selectedServerId === "string")
    context.selectedServerId = legalAction.payload.selectedServerId;
  if (typeof legalAction.payload?.agendaAbility === "string")
    context.agendaAbility = legalAction.payload.agendaAbility;
  if (typeof legalAction.payload?.cardDefinitionId === "string")
    context.cardDefinitionId = legalAction.payload.cardDefinitionId;
  if (typeof legalAction.payload?.spentPowerCounters === "number")
    context.spentPowerCounters = legalAction.payload.spentPowerCounters;
  if (typeof legalAction.payload?.gainedCredits === "number")
    context.gainedCredits = legalAction.payload.gainedCredits;
  for (const key of [
    "targetIceDefinitionId",
    "strengthBonus",
    "duplicatedSubroutineCount",
  ]) {
    const value = legalAction.payload?.[key];
    if (value !== undefined) context[key] = value;
  }
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
  if (legalAction.payload?.agendaAbility === "v1922_security_purge") {
    context.agendaAbility = "v1922_security_purge";
    context.hiddenZoneBarrier = true;
    context.hiddenZoneAction = legalAction.payload.hiddenZoneAction;
    context.revealedCount = legalAction.payload.revealedCount;
    context.installedIceCount = legalAction.payload.installedIceCount;
    context.trashedCount = legalAction.payload.trashedCount;
    context.securityPurgeInstallContract =
      legalAction.payload.securityPurgeInstallContract;
    context.securityPurgeWaivesPrintedRezCosts =
      legalAction.payload.securityPurgeWaivesPrintedRezCosts;
    context.publicRevealDefinitionIds =
      legalAction.payload.publicRevealDefinitionIds;
    context.installedIceDefinitionIds =
      legalAction.payload.installedIceDefinitionIds;
    context.trashedDefinitionIds = legalAction.payload.trashedDefinitionIds;
    context.redactedKind = "hidden_zone";
  }
  if (typeof legalAction.payload?.gainedActions === "number")
    context.gainedActions = legalAction.payload.gainedActions;
  if (typeof legalAction.payload?.v1917AssetAbility === "string") {
    context.v1917AssetAbility = legalAction.payload.v1917AssetAbility;
    for (const key of [
      "spinnPublicRelationsPoolBefore",
      "spinnPublicRelationsPoolAfter",
      "addedCounterAmount",
      "remainingCounters",
      "gainedCredits",
      "corpCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (typeof legalAction.payload?.runnerAbility === "string") {
    context.runnerAbility = legalAction.payload.runnerAbility;
    for (const key of [
      "removedCounterAmount",
      "remainingCounters",
      "runnerCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
  if (legalAction.payload?.chimeraDaemonTrashed === true) {
    context.chimeraDaemonTrashed = true;
    if (typeof legalAction.payload.chimeraDaemonDefinitionId === "string")
      context.chimeraDaemonDefinitionId =
        legalAction.payload.chimeraDaemonDefinitionId;
  }
  if (typeof legalAction.payload?.acmeSavingsAndLoanAbility === "string") {
    context.acmeSavingsAndLoanAbility =
      legalAction.payload.acmeSavingsAndLoanAbility;
    for (const key of [
      "agendaPointCost",
      "agendaPointCostPaid",
      "corpBonusAgendaPointsSpent",
      "forfeitedAgendaDefinitionIds",
      "gainedCredits",
      "selfTrashed",
      "acmeSavingsAndLoanObligations",
      "acmeSavingsAndLoanObligationsBefore",
      "acmeSavingsAndLoanObligationsAfter",
      "acmeSavingsAndLoanCreditCost",
      "acmeSavingsAndLoanPaymentDue",
      "acmeSavingsAndLoanPaymentPaid",
      "acmeSavingsAndLoanPaymentFailed",
      "acmeSavingsAndLoanScoreAgendaPoints",
      "gainedAgendaPoints",
      "corpBonusAgendaPointsAfter",
      "corpCreditsBefore",
      "corpCreditsAfter",
      "specialZone",
      "specialZoneVisibility",
      "specialZoneReason",
    ]) {
      const value = legalAction.payload[key];
      if (value !== undefined) context[key] = value;
    }
  }
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
    if (typeof legalAction.payload.advancementCounterCount === "number")
      context.advancementCounterCount =
        legalAction.payload.advancementCounterCount;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
    if (legalAction.payload.selfTrashed === true) context.selfTrashed = true;
  }
  if (typeof legalAction.payload?.v1919OperationAbility === "string") {
    context.v1919OperationAbility = legalAction.payload.v1919OperationAbility;
    if (typeof legalAction.payload.targetCardId === "string")
      context.targetCardId = legalAction.payload.targetCardId;
    if (typeof legalAction.payload.targetCardDefinitionId === "string")
      context.targetCardDefinitionId =
        legalAction.payload.targetCardDefinitionId;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.addedAdvancementCounters === "number")
      context.addedAdvancementCounters =
        legalAction.payload.addedAdvancementCounters;
    if (typeof legalAction.payload.targetCount === "number")
      context.targetCount = legalAction.payload.targetCount;
    if (typeof legalAction.payload.advancementCountersAfter === "number")
      context.advancementCountersAfter =
        legalAction.payload.advancementCountersAfter;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
    if (typeof legalAction.payload.forfeitedAgendaDefinitionId === "string")
      context.forfeitedAgendaDefinitionId =
        legalAction.payload.forfeitedAgendaDefinitionId;
    if (typeof legalAction.payload.specialZone === "string")
      context.specialZone = legalAction.payload.specialZone;
    if (typeof legalAction.payload.specialZoneVisibility === "string")
      context.specialZoneVisibility = legalAction.payload.specialZoneVisibility;
    if (typeof legalAction.payload.specialZoneReason === "string")
      context.specialZoneReason = legalAction.payload.specialZoneReason;
  }
  if (typeof legalAction.payload?.v1915RunnerProgramAbility === "string") {
    context.v1915RunnerProgramAbility =
      legalAction.payload.v1915RunnerProgramAbility;
    if (typeof legalAction.payload.revealCount === "number")
      context.revealCount = legalAction.payload.revealCount;
    if (typeof legalAction.payload.revealedCardDefinitionIds === "string")
      context.revealedCardDefinitionIds =
        legalAction.payload.revealedCardDefinitionIds;
    if (typeof legalAction.payload.revealedProgramCount === "number")
      context.revealedProgramCount = legalAction.payload.revealedProgramCount;
    if (typeof legalAction.payload.installedProgramDefinitionId === "string")
      context.installedProgramDefinitionId =
        legalAction.payload.installedProgramDefinitionId;
    if (typeof legalAction.payload.installedProgramCount === "number")
      context.installedProgramCount = legalAction.payload.installedProgramCount;
    if (typeof legalAction.payload.selfTrashed === "boolean")
      context.selfTrashed = legalAction.payload.selfTrashed;
    if (legalAction.payload.programFound === false)
      context.programFound = false;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
  }
  if (typeof legalAction.payload?.v1922RunnerProgramAbility === "string") {
    context.v1922RunnerProgramAbility =
      legalAction.payload.v1922RunnerProgramAbility;
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.rezCostPaid === "number")
      context.rezCostPaid = legalAction.payload.rezCostPaid;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.trashedCardDefinitionId === "string")
      context.trashedCardDefinitionId =
        legalAction.payload.trashedCardDefinitionId;
    if (typeof legalAction.payload.targetIceDefinitionId === "string")
      context.targetIceDefinitionId = legalAction.payload.targetIceDefinitionId;
    if (legalAction.payload.startupImmolatorExhausted === true)
      context.startupImmolatorExhausted = true;
    if (typeof legalAction.payload.futureActionDebtAdded === "number")
      context.futureActionDebtAdded = legalAction.payload.futureActionDebtAdded;
    if (typeof legalAction.payload.futureActionDebtPending === "number")
      context.futureActionDebtPending =
        legalAction.payload.futureActionDebtPending;
    if (typeof legalAction.payload.breakerStrengthAfter === "number")
      context.breakerStrengthAfter = legalAction.payload.breakerStrengthAfter;
  }
  if (typeof legalAction.payload?.v1922RunnerHardwareAbility === "string") {
    context.v1922RunnerHardwareAbility =
      legalAction.payload.v1922RunnerHardwareAbility;
    if (typeof legalAction.payload.hostedProgramCount === "number")
      context.hostedProgramCount = legalAction.payload.hostedProgramCount;
    if (typeof legalAction.payload.hostedProgramCountAfter === "number")
      context.hostedProgramCountAfter =
        legalAction.payload.hostedProgramCountAfter;
    if (typeof legalAction.payload.returnedCardDefinitionId === "string")
      context.returnedCardDefinitionId =
        legalAction.payload.returnedCardDefinitionId;
    if (legalAction.payload.returnedToGrip === true)
      context.returnedToGrip = true;
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
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.serverLabel === "string")
      context.serverLabel = legalAction.payload.serverLabel;
    if (typeof legalAction.payload.addedCounterAmount === "number")
      context.addedCounterAmount = legalAction.payload.addedCounterAmount;
    if (typeof legalAction.payload.remainingCounters === "number")
      context.remainingCounters = legalAction.payload.remainingCounters;
    if (typeof legalAction.payload.faitAccompliServerCounters === "number")
      context.faitAccompliServerCounters =
        legalAction.payload.faitAccompliServerCounters;
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
    if (typeof legalAction.payload.futureAgendaPointForfeitPaid === "number")
      context.futureAgendaPointForfeitPaid =
        legalAction.payload.futureAgendaPointForfeitPaid;
    if (
      typeof legalAction.payload.futureAgendaPointForfeitPending === "number"
    )
      context.futureAgendaPointForfeitPending =
        legalAction.payload.futureAgendaPointForfeitPending;
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
    if (typeof legalAction.payload.gainedCredits === "number")
      context.gainedCredits = legalAction.payload.gainedCredits;
    if (typeof legalAction.payload.corpCreditsAfter === "number")
      context.corpCreditsAfter = legalAction.payload.corpCreditsAfter;
    if (legalAction.payload.selfTrashed === true) context.selfTrashed = true;
    if (
      typeof legalAction.payload.newsgroupTauntingRunStartTaxCredits ===
      "number"
    )
      context.newsgroupTauntingRunStartTaxCredits =
        legalAction.payload.newsgroupTauntingRunStartTaxCredits;
    if (
      typeof legalAction.payload.newsgroupTauntingSourceDefinitionIds ===
      "string"
    )
      context.newsgroupTauntingSourceDefinitionIds =
        legalAction.payload.newsgroupTauntingSourceDefinitionIds;
    if (typeof legalAction.payload.runStartTaxPaid === "number")
      context.runStartTaxPaid = legalAction.payload.runStartTaxPaid;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
    if (typeof legalAction.payload.corpClicksAfter === "number")
      context.corpClicksAfter = legalAction.payload.corpClicksAfter;
    if (typeof legalAction.payload.agendaPointCost === "number")
      context.agendaPointCost = legalAction.payload.agendaPointCost;
    if (typeof legalAction.payload.agendaPointCostPaid === "number")
      context.agendaPointCostPaid = legalAction.payload.agendaPointCostPaid;
  }
  if (typeof legalAction.payload?.v1920RunnerRunLockAbility === "string") {
    context.v1920RunnerRunLockAbility =
      legalAction.payload.v1920RunnerRunLockAbility;
    if (typeof legalAction.payload.fangRunLockCreditCost === "number")
      context.fangRunLockCreditCost = legalAction.payload.fangRunLockCreditCost;
    if (legalAction.payload.fangRunLockCleared === true)
      context.fangRunLockCleared = true;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
  }
  if (typeof legalAction.payload?.v1921AssetAbility === "string") {
    context.v1921AssetAbility = legalAction.payload.v1921AssetAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.runnerTags === "number")
      context.runnerTags = legalAction.payload.runnerTags;
    if (typeof legalAction.payload.tagThresholdMet === "boolean")
      context.tagThresholdMet = legalAction.payload.tagThresholdMet;
    if (legalAction.payload.selfTrashed === true) context.selfTrashed = true;
    if (typeof legalAction.payload.randomCounterAfter === "number")
      context.randomCounterAfter = legalAction.payload.randomCounterAfter;
    if (typeof legalAction.payload.randomPurpose === "string")
      context.randomPurpose = legalAction.payload.randomPurpose;
  }
  if (typeof legalAction.payload?.v1921UpgradeAbility === "string") {
    context.v1921UpgradeAbility = legalAction.payload.v1921UpgradeAbility;
    if (typeof legalAction.payload.v1921DieRoll === "number")
      context.v1921DieRoll = legalAction.payload.v1921DieRoll;
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.passedIceDefinitionId === "string")
      context.passedIceDefinitionId = legalAction.payload.passedIceDefinitionId;
    if (typeof legalAction.payload.serverLabel === "string")
      context.serverLabel = legalAction.payload.serverLabel;
    if (typeof legalAction.payload.rioRunEnded === "boolean")
      context.rioRunEnded = legalAction.payload.rioRunEnded;
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
    if (typeof legalAction.payload.aiBoonRunStrength === "number")
      context.aiBoonRunStrength = legalAction.payload.aiBoonRunStrength;
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
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
  if (typeof legalAction.payload?.v1922CorpIceAbility === "string") {
    context.v1922CorpIceAbility = legalAction.payload.v1922CorpIceAbility;
    if (typeof legalAction.payload.breakSubroutineBaseCost === "number")
      context.breakSubroutineBaseCost =
        legalAction.payload.breakSubroutineBaseCost;
    if (typeof legalAction.payload.breakSubroutineAdditionalCost === "number")
      context.breakSubroutineAdditionalCost =
        legalAction.payload.breakSubroutineAdditionalCost;
    if (typeof legalAction.payload.breakSubroutineTotalCost === "number")
      context.breakSubroutineTotalCost =
        legalAction.payload.breakSubroutineTotalCost;
    if (typeof legalAction.payload.sourceDefinitionId === "string")
      context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.runLockActionsAdded === "number")
      context.runLockActionsAdded = legalAction.payload.runLockActionsAdded;
    if (typeof legalAction.payload.runLockActionsPending === "number")
      context.runLockActionsPending =
        legalAction.payload.runLockActionsPending;
    if (typeof legalAction.payload.jackOutAdditionalCost === "number")
      context.jackOutAdditionalCost =
        legalAction.payload.jackOutAdditionalCost;
    if (
      typeof legalAction.payload.viral15ProgramTrashChoiceOpened === "boolean"
    )
      context.viral15ProgramTrashChoiceOpened =
        legalAction.payload.viral15ProgramTrashChoiceOpened;
    if (
      typeof legalAction.payload.viral15ProgramTrashCandidateCount === "number"
    )
      context.viral15ProgramTrashCandidateCount =
        legalAction.payload.viral15ProgramTrashCandidateCount;
    if (typeof legalAction.payload.trashedCount === "number")
      context.trashedCount = legalAction.payload.trashedCount;
    if (typeof legalAction.payload.runnerCreditsAfter === "number")
      context.runnerCreditsAfter = legalAction.payload.runnerCreditsAfter;
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
    if (
      Array.isArray(legalAction.payload.playfulAiDieRolls) ||
      typeof legalAction.payload.playfulAiDieRolls === "string"
    )
      context.playfulAiDieRolls = legalAction.payload.playfulAiDieRolls;
    for (const key of [
      "playfulAiGainedCredits",
      "playfulAiSetAsideDice",
      "playfulAiRolledDice",
      "playfulAiDiceQueuedBeforeRolls",
      "playfulAiDiceQueuedAfterRolls",
      "playfulAiRemainingDice",
      "runnerCreditsAfter",
    ]) {
      const value = legalAction.payload[key];
      if (typeof value === "number") context[key] = value;
    }
    if (typeof legalAction.payload.playfulAiChoiceOpened === "boolean")
      context.playfulAiChoiceOpened = legalAction.payload.playfulAiChoiceOpened;
    if (typeof legalAction.payload.playfulAiComplete === "boolean")
      context.playfulAiComplete = legalAction.payload.playfulAiComplete;
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
  if (typeof legalAction.payload?.projectBabylonOveradvance === "number")
    context.projectBabylonOveradvance =
      legalAction.payload.projectBabylonOveradvance;
  if (typeof legalAction.payload?.projectBabylonBonusAgendaPoints === "number")
    context.projectBabylonBonusAgendaPoints =
      legalAction.payload.projectBabylonBonusAgendaPoints;
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
        legalAction.payload?.v1917AssetAbility === "trace_3_tag" ||
        legalAction.payload?.v1917AssetAbility === "spinn_load_pool")) ||
    (legalAction.type === "gain_credit" &&
      typeof legalAction.payload?.v1920AssetAbility === "string") ||
    (legalAction.type === "gain_credit" &&
      legalAction.payload?.traceStarted === true) ||
    (legalAction.type === "gain_credit" &&
      (legalAction.payload?.agendaAbility === "v1922_political_overthrow" ||
        legalAction.payload?.agendaAbility === "v1922_marine_arcology" ||
        legalAction.payload?.agendaAbility === "v1922_corporate_retreat")) ||
    (legalAction.side === "runner" &&
      (legalAction.type === "gain_credit" ||
        legalAction.type === "trigger_ability" ||
        legalAction.type === "remove_tag") &&
      typeof legalAction.payload?.resourceAbility === "string") ||
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
    ...(definition.maxHandSizeBonus !== undefined
      ? { maxHandSizeBonus: definition.maxHandSizeBonus }
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
  const scoredPoints = ids.reduce(
    (sum, id) => sum + agendaPointsForScoredCard(state, id),
    0,
  );
  return side === "corp"
    ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
    : scoredPoints;
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

function clearCardCounters(state: GameState, cardId: CardInstanceId): void {
  const instance = mustInstance(state.cardInstances, cardId);
  state.cardInstances[cardId] = cardInstanceWithoutCounters(instance);
}

function cardInstanceWithoutCounters(instance: CardInstance): CardInstance {
  const { counters: _counters, ...withoutCounters } = instance;
  void _counters;
  return withoutCounters;
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

type CodeViralCachePreserveTarget =
  | { kind: "card"; cardId: CardInstanceId; index: number }
  | { kind: "pox"; serverId: Exclude<ServerId, "new_remote">; index: number };

function installedCodeViralCacheIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.resources
    .filter((cardId) => definitionFor(state, cardId).id === CODE_VIRAL_CACHE_ID)
    .sort();
}

function codeViralCachePurgePreserveTargets(
  state: GameState,
): Array<CodeViralCachePreserveTarget & { optionId: string; publicLabel: string }> {
  const targets: Array<
    CodeViralCachePreserveTarget & { optionId: string; publicLabel: string }
  > = [];
  for (const cardId of visibleVirusCounterTargetIds(state).sort()) {
    const amount = cardCounter(state, cardId, "virus");
    const title = definitionFor(state, cardId).title;
    for (let index = 1; index <= amount; index += 1) {
      targets.push({
        kind: "card",
        cardId,
        index,
        optionId: `card:${cardId}:${index}`,
        publicLabel: `${title} Virus-Counter ${index}`,
      });
    }
  }
  for (const [serverId, rawAmount] of Object.entries(
    state.poxCountersByServer ?? {},
  ).sort(([left], [right]) => left.localeCompare(right))) {
    const amount = Math.max(0, Math.floor(Number(rawAmount ?? 0)));
    if (amount <= 0) continue;
    const typedServerId = serverId as Exclude<ServerId, "new_remote">;
    const label = publicServerLabel(state, typedServerId) ?? typedServerId;
    for (let index = 1; index <= amount; index += 1) {
      targets.push({
        kind: "pox",
        serverId: typedServerId,
        index,
        optionId: `pox:${typedServerId}:${index}`,
        publicLabel: `Pox auf ${label} ${index}`,
      });
    }
  }
  return targets;
}

function startCodeViralCachePurgeChoice(
  state: GameState,
  legalAction: LegalAction,
): boolean {
  const sourceIds = installedCodeViralCacheIds(state);
  if (sourceIds.length === 0) return false;
  const targets = codeViralCachePurgePreserveTargets(state);
  if (targets.length === 0) return false;
  const sourceCardId = sourceIds[0];
  state.pendingChoice = {
    choiceId: `v1913_code_viral_cache_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1913.code_viral_cache_purge:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Code Viral Cache: bis zu zwei Virus-Counter behalten.",
    kind: "select_cards",
    options: targets.map((target) => ({
      id: target.optionId,
      label: target.publicLabel,
      publicLabel: target.publicLabel,
      value: target.optionId,
    })),
    minSelections: 0,
    maxSelections: Math.min(2, targets.length),
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: CODE_VIRAL_CACHE_ID,
    codeViralCachePurgeReplacementOpened: true,
    codeViralCacheEligibleCounterCount: targets.length,
    codeViralCacheMaxPreserveCounters: Math.min(2, targets.length),
    purgedCounterType: "virus",
  };
  return true;
}

function parseCodeViralCachePreserveOption(
  optionId: string,
): CodeViralCachePreserveTarget | undefined {
  const [kind, id, indexRaw] = optionId.split(":");
  const index = Number(indexRaw);
  if (!Number.isInteger(index) || index <= 0) return undefined;
  if (kind === "card" && id)
    return { kind: "card", cardId: id as CardInstanceId, index };
  if (kind === "pox" && id && id !== "new_remote")
    return {
      kind: "pox",
      serverId: id as Exclude<ServerId, "new_remote">,
      index,
    };
  return undefined;
}

function restoreCodeViralCachePreservedCounters(
  state: GameState,
  selectedOptionIds: string[],
): { preserved: number; preservedCardDefinitionIds: CardDefinitionId[] } {
  const selectedTargets = selectedOptionIds
    .map(parseCodeViralCachePreserveOption)
    .filter((target): target is CodeViralCachePreserveTarget => Boolean(target));
  if (selectedTargets.length !== selectedOptionIds.length)
    throw new Error("Die Code-Viral-Cache-Auswahl ist ungueltig.");
  if (selectedTargets.length > 2)
    throw new Error("Code Viral Cache kann hoechstens 2 Counter behalten.");
  const beforeCardCounts = new Map<CardInstanceId, number>();
  const beforePoxCounts = new Map<Exclude<ServerId, "new_remote">, number>();
  const preservedCardDefinitionIds: CardDefinitionId[] = [];
  for (const target of selectedTargets) {
    if (target.kind === "card") {
      if (!visibleVirusCounterTargetIds(state).includes(target.cardId))
        throw new Error("Ein Code-Viral-Cache-Counterziel ist nicht mehr legal.");
      const count =
        beforeCardCounts.get(target.cardId) ??
        cardCounter(state, target.cardId, "virus");
      if (target.index > count)
        throw new Error("Ein Code-Viral-Cache-Counter existiert nicht mehr.");
      beforeCardCounts.set(target.cardId, count);
    } else {
      mustServer(state, target.serverId);
      const count =
        beforePoxCounts.get(target.serverId) ??
        Math.max(
          0,
          Math.floor(Number(state.poxCountersByServer?.[target.serverId] ?? 0)),
        );
      if (target.index > count)
        throw new Error("Ein Code-Viral-Cache-Pox-Counter existiert nicht mehr.");
      beforePoxCounts.set(target.serverId, count);
    }
  }

  purgeVirusCounters(state);

  const cardPreserveCounts = new Map<CardInstanceId, number>();
  const poxPreserveCounts = new Map<Exclude<ServerId, "new_remote">, number>();
  for (const target of selectedTargets) {
    if (target.kind === "card") {
      cardPreserveCounts.set(
        target.cardId,
        (cardPreserveCounts.get(target.cardId) ?? 0) + 1,
      );
    } else {
      poxPreserveCounts.set(
        target.serverId,
        (poxPreserveCounts.get(target.serverId) ?? 0) + 1,
      );
    }
  }
  for (const [cardId, amount] of cardPreserveCounts) {
    setCardCounter(state, cardId, "virus", amount);
    preservedCardDefinitionIds.push(definitionFor(state, cardId).id);
  }
  for (const [serverId, amount] of poxPreserveCounts) {
    state.poxCountersByServer = {
      ...(state.poxCountersByServer ?? {}),
      [serverId]: amount,
    };
  }
  return {
    preserved: selectedTargets.length,
    preservedCardDefinitionIds: preservedCardDefinitionIds.sort(),
  };
}

function resolveCodeViralCachePurgeChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1913.code_viral_cache_purge"))
    throw new Error("Es ist keine Code-Viral-Cache-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (!sourceCardId || !installedCodeViralCacheIds(state).includes(sourceCardId))
    throw new Error("Code Viral Cache ist nicht mehr installiert.");
  const selected = selectedChoiceIds(playerAction.selectedChoices);
  const legalOptionIds = new Set(choice.options.map((option) => option.id));
  if (selected.some((optionId) => !legalOptionIds.has(optionId)))
    throw new Error("Die Code-Viral-Cache-Auswahl ist nicht legal.");
  const result = restoreCodeViralCachePreservedCounters(state, selected);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: CODE_VIRAL_CACHE_ID,
    purgedCounterType: "virus",
    codeViralCachePreservedCounters: result.preserved,
    preservedCounterAmount: result.preserved,
    ...(result.preservedCardDefinitionIds.length > 0
      ? {
          preservedCardDefinitionIds:
            result.preservedCardDefinitionIds.join(","),
        }
      : {}),
    remainingVirusCounters: totalCounters(state, "virus"),
  };
  delete state.pendingChoice;
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

function microtechBackupDriveIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.hardware
    .filter(
      (cardId) => definitionFor(state, cardId).id === MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
    )
    .sort();
}

function microtechHostedProgramIds(
  state: GameState,
  hostId: CardInstanceId,
): CardInstanceId[] {
  return hostedCardsOn(state, hostId)
    .filter((cardId) => definitionFor(state, cardId).type === "program")
    .sort();
}

function topHostedProgramOnMicrotech(
  state: GameState,
  hostId: CardInstanceId,
): CardInstanceId | undefined {
  return microtechHostedProgramIds(state, hostId).at(-1);
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
  return runnerProgramInstallRecurringCreditSourceIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
    0,
  );
}

function runnerProgramInstallRecurringCreditSourceIds(
  state: GameState,
): CardInstanceId[] {
  return [
    ...state.runner.rig.hardware.filter(
      (cardId) => definitionFor(state, cardId).id === "v099_recurring_chip",
    ),
    ...state.runner.rig.programs.filter(
      (cardId) =>
        definitionFor(state, cardId).id === ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID,
    ),
  ];
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
  for (const cardId of runnerProgramInstallRecurringCreditSourceIds(state)) {
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
    const definition = definitionFor(state, cardId);
    if (
      definition.id === "onr_v1_147_zz22-speed-chip" ||
      definition.id === COROLLA_SPEED_CHIP_STRENGTH_HARDWARE_ID
    ) {
      return Boolean(
        state.run &&
          breakerId &&
          state.runner.rig.programs.includes(breakerId) &&
          cardHasSubtype(definitionFor(state, breakerId), "killer"),
      );
    }
    if (definition.id === ARTEMIS_2020_STRENGTH_HARDWARE_ID) {
      return Boolean(
        state.run &&
          breakerId &&
          state.runner.rig.programs.includes(breakerId),
      );
    }
    if (definition.id === ARASAKA_PORTABLE_PROTOTYPE_LINK_HARDWARE_ID) {
      return Boolean(
        state.run &&
          breakerId &&
          state.runner.rig.programs.includes(breakerId),
      );
    }
    if (
      definition.id === ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID ||
      definition.id === PANDORAS_DECK_LINK_HARDWARE_ID ||
      TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS.has(definition.id)
    ) {
      return false;
    }
    if (definition.id === HELLS_RUN_ID) return false;
    if (!noisyBreaker) return true;
    return !cardHasSubtype(definition, "stealth");
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

function runnerTagRemovalRecurringCreditSourceIds(
  state: GameState,
): CardInstanceId[] {
  return state.runner.rig.hardware
    .filter(
      (cardId) =>
        TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS.has(
          definitionFor(state, cardId).id,
        ) &&
        cardCounter(state, cardId, "recurring_credit") > 0,
    )
    .sort();
}

function runnerTagRemovalRecurringCredits(state: GameState): number {
  return runnerTagRemovalRecurringCreditSourceIds(state).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "recurring_credit"),
    0,
  );
}

function availableRunnerTagRemovalCredits(state: GameState): number {
  return state.runner.credits + runnerTagRemovalRecurringCredits(state);
}

function spendRunnerTagRemovalCredits(
  state: GameState,
  amount: number,
  legalAction: LegalAction,
): void {
  if (amount <= 0) return;
  if (availableRunnerTagRemovalCredits(state) < amount)
    throw new Error("Der Runner kann die Tag-Entfernung nicht bezahlen.");
  let remaining = amount;
  let recurringSpent = 0;
  let armadilloRecurringSpent = 0;
  const recurringSourceDefinitionIds: string[] = [];
  for (const cardId of runnerTagRemovalRecurringCreditSourceIds(state)) {
    if (remaining <= 0) break;
    const spent = Math.min(
      cardCounter(state, cardId, "recurring_credit"),
      remaining,
    );
    if (spent <= 0) continue;
    spendCardCounter(state, cardId, "recurring_credit", spent);
    const sourceDefinitionId = definitionFor(state, cardId).id;
    if (sourceDefinitionId === ARMADILLO_ARMORED_ROAD_HOME_ID)
      armadilloRecurringSpent += spent;
    recurringSourceDefinitionIds.push(sourceDefinitionId);
    recurringSpent += spent;
    remaining -= spent;
  }
  spendCredits(state, "runner", remaining);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    removeTagAmount: 1,
    ...(recurringSpent > 0
      ? {
          ...(armadilloRecurringSpent > 0
            ? { armadilloRecurringCreditsSpent: armadilloRecurringSpent }
            : {}),
          tagRemovalRecurringCreditsSpent: recurringSpent,
          runnerCreditsSpent: remaining,
          tagRemovalCreditSourceDefinitionIds:
            recurringSourceDefinitionIds.join(","),
        }
      : {}),
  };
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
  const stealthSources = runnerStealthRecurringCreditSources(state);
  const availableStealth = stealthSources.reduce(
    (sum, source) => sum + source.available,
    0,
  );
  const exactStealthLoss = [RAMMING_PISTON_ID, PILE_DRIVER_ID].includes(
    breakerDefinition.id,
  );
  if (exactStealthLoss && availableStealth < lossAmount)
    throw new Error("Nicht genug Stealth-Credits fuer den Break-Folgeverlust.");
  const requiredLoss = exactStealthLoss
    ? lossAmount
    : Math.min(lossAmount, availableStealth);
  if (requiredLoss <= 0) return;
  if (stealthSources.length > 1) {
    startHammerStealthLossChoice(
      state,
      breakerId,
      requiredLoss,
      stealthSources,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      postBreakStealthLossPending: requiredLoss,
    };
    return;
  }
  let remaining = lossAmount;
  let spent = 0;
  for (const { cardId } of stealthSources) {
    if (remaining <= 0) break;
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
    ...(breakerDefinition.id === RAMMING_PISTON_ID
      ? { v1922RunnerProgramAbility: "ramming_piston_stealth_loss" }
      : {}),
    ...(breakerDefinition.id === PILE_DRIVER_ID
      ? { v1922RunnerProgramAbility: "pile_driver_stealth_loss" }
      : {}),
  };
}

function runnerStealthRecurringCreditSources(
  state: GameState,
): { cardId: CardInstanceId; available: number }[] {
  const runnerRig = [
    ...state.runner.rig.hardware,
    ...state.runner.rig.programs,
    ...state.runner.rig.resources,
  ];
  const sources: { cardId: CardInstanceId; available: number }[] = [];
  for (const cardId of runnerRig) {
    if (!cardHasSubtype(definitionFor(state, cardId), "stealth")) continue;
    const available = cardCounter(state, cardId, "recurring_credit");
    if (available > 0) sources.push({ cardId, available });
  }
  return sources;
}

function runnerStealthRecurringCredits(state: GameState): number {
  return runnerStealthRecurringCreditSources(state).reduce(
    (sum, source) => sum + source.available,
    0,
  );
}

function startHammerStealthLossChoice(
  state: GameState,
  breakerId: CardInstanceId,
  requiredLoss: number,
  sources: { cardId: CardInstanceId; available: number }[],
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options: ChoiceRequest["options"] = [];
  for (const source of sources) {
    const definition = definitionFor(state, source.cardId);
    for (
      let creditIndex = 0;
      creditIndex < Math.min(source.available, requiredLoss);
      creditIndex += 1
    ) {
      options.push({
        id: `stealth_${source.cardId}_${creditIndex + 1}`,
        label: `${definition.title}: 1 Stealth-Credit verlieren`,
        value: source.cardId,
      });
    }
  }
  state.pendingChoice = {
    choiceId: `choice_v1922_hammer_stealth_loss_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.hammer_stealth_loss:${breakerId}:${state.stateVersion + 1}`,
    prompt: "Stealth-Verlust verteilen.",
    kind: "select_cards",
    options,
    minSelections: requiredLoss,
    maxSelections: requiredLoss,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveHammerStealthLossChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.hammer_stealth_loss"))
    throw new Error("Hammer-Stealth-Choice ist nicht offen.");
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length)
    throw new Error("Hammer-Stealth-Auswahl enthaelt doppelte Optionen.");
  const lossByCardId = new Map<CardInstanceId, number>();
  for (const optionId of selectedOptionIds) {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    const cardId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    if (!cardId) throw new Error("Ungueltige Hammer-Stealth-Auswahl.");
    lossByCardId.set(cardId, (lossByCardId.get(cardId) ?? 0) + 1);
  }
  const installed = runnerInstalledCardIds(state);
  for (const [cardId, amount] of lossByCardId) {
    if (!installed.includes(cardId))
      throw new Error("Die Stealth-Quelle ist nicht mehr installiert.");
    if (!cardHasSubtype(definitionFor(state, cardId), "stealth"))
      throw new Error("Nur Stealth-Karten koennen gewaehlt werden.");
    if (cardCounter(state, cardId, "recurring_credit") < amount)
      throw new Error("Nicht genug Stealth-Credits fuer die Auswahl.");
    spendCardCounter(state, cardId, "recurring_credit", amount);
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_hammer_stealth_loss_distribution",
    selectedCount: selectedOptionIds.length,
    postBreakStealthLoss: selectedOptionIds.length,
  };
}

function startViral15ProgramTrashChoice(
  state: GameState,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): boolean {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const run = mustRun(state);
  const sourceIceId = run.viral15ActiveSourceIceId;
  if (!sourceIceId) return false;
  if (definitionFor(state, sourceIceId).id !== VIRAL_15_PROGRAM_TRASH_ICE_ID)
    throw new Error("Viral-15-Quelle ist ungueltig.");
  const programOptions = state.runner.rig.programs
    .filter((cardId) => state.cardInstances[cardId])
    .sort()
    .map((cardId) => {
      const definition = definitionFor(state, cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    });
  if (programOptions.length === 0) {
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922CorpIceAbility: "viral_15_program_trash",
        sourceDefinitionId: VIRAL_15_PROGRAM_TRASH_ICE_ID,
        viral15ProgramTrashChoiceOpened: false,
        trashedCount: 0,
      };
    }
    return false;
  }
  state.pendingChoice = {
    choiceId: `choice_v1922_viral_15_program_trash_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.viral_15_program_trash:${sourceIceId}:${passedIceId}:${state.stateVersion + 1}`,
    prompt: "Viral 15: installiertes Programm trashen.",
    kind: "select_cards",
    options: programOptions,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922CorpIceAbility: "viral_15_program_trash",
      sourceDefinitionId: VIRAL_15_PROGRAM_TRASH_ICE_ID,
      viral15ProgramTrashChoiceOpened: true,
      viral15ProgramTrashCandidateCount: programOptions.length,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_viral_15_program_trash_choice",
    };
  }
  return true;
}

function resolveViral15ProgramTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.viral_15_program_trash"))
    throw new Error("Viral-15-Programmtrash-Choice ist nicht offen.");
  const [, sourceIceId, passedIceId] = choice.source.split(":");
  if (
    !sourceIceId ||
    !state.cardInstances[sourceIceId] ||
    definitionFor(state, sourceIceId).id !== VIRAL_15_PROGRAM_TRASH_ICE_ID
  )
    throw new Error("Viral-15-Quelle ist nicht mehr gueltig.");
  if (!passedIceId || !state.cardInstances[passedIceId])
    throw new Error("Das passierte ICE fuer Viral 15 fehlt.");
  const selectedProgramId = selectedChoiceCardIds(choice, playerAction)[0];
  if (
    !selectedProgramId ||
    !state.runner.rig.programs.includes(selectedProgramId)
  )
    throw new Error("Das gewaehlte Programm ist nicht installiert.");
  const selectedDefinitionId = definitionFor(state, selectedProgramId).id;
  trashRunnerInstalledProgram(state, selectedProgramId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922CorpIceAbility: "viral_15_program_trash",
    sourceDefinitionId: VIRAL_15_PROGRAM_TRASH_ICE_ID,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_viral_15_program_trash",
    trashedCount: 1,
    trashedCardDefinitionId: selectedDefinitionId,
  };
}

function resolveSpeedTrapRezInterruptChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.speed_trap"))
    throw new Error("Speed-Trap-Choice ist nicht offen.");
  const [, speedTrapId, rezzedCardId] = choice.source.split(":");
  if (
    !speedTrapId ||
    !state.runner.rig.programs.includes(speedTrapId) ||
    definitionFor(state, speedTrapId).id !== SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID
  )
    throw new Error("Speed Trap ist nicht mehr installiert.");
  const run = mustRun(state);
  if (
    !rezzedCardId ||
    run.speedTrapPendingRezCardId !== rezzedCardId ||
    !mustServer(state, run.attackedServerId).root.includes(rezzedCardId)
  )
    throw new Error("Das Speed-Trap-Rezziel ist nicht mehr gueltig.");
  const rezzedDefinition = definitionFor(state, rezzedCardId);
  if (rezzedDefinition.type !== "asset" && rezzedDefinition.type !== "upgrade")
    throw new Error("Speed Trap reagiert nur auf Nodes oder Upgrades.");
  if (!mustInstance(state.cardInstances, rezzedCardId).rezzed)
    throw new Error("Das Speed-Trap-Rezziel ist nicht gerezzt.");
  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const useSpeedTrap = selectedId === "jack_out";
  const pass = selectedId === "pass";
  if (!useSpeedTrap && !pass)
    throw new Error("Die Speed-Trap-Auswahl ist ungueltig.");
  const successfulRunWithoutAccess =
    useSpeedTrap && run.position.kind === "server";
  const serverLabel = publicServerLabel(state, run.attackedServerId);
  const pendingTimingPoint = run.speedTrapPendingRezTimingPoint;
  const pendingActiveSide = run.speedTrapPendingRezActiveSide;
  delete run.speedTrapPendingRezCardId;
  delete run.speedTrapPendingRezTimingPoint;
  delete run.speedTrapPendingRezActiveSide;
  delete state.pendingChoice;

  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerProgramAbility: "speed_trap_rez_interrupt",
    sourceDefinitionId: SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID,
    speedTrapSourceCardId: speedTrapId,
    rezzedCardDefinitionId: rezzedDefinition.id,
    ...(serverLabel ? { serverLabel } : {}),
    speedTrapUsed: useSpeedTrap,
    successfulRunWithoutAccess,
  };

  if (useSpeedTrap) {
    finishRun(state, successfulRunWithoutAccess, legalAction);
    return;
  }

  resolveCorpRootRezEffect(state, rezzedCardId, legalAction);
  if (state.run) {
    state.timingPoint =
      (pendingTimingPoint as GameState["timingPoint"] | undefined) ??
      "run.jack_out_window";
    state.activeSide = pendingActiveSide ?? "runner";
  }
}

function refreshRecurringCredits(
  state: GameState,
  side: Side,
  effects?: AutomaticEffectCollector,
): void {
  if (side !== "runner" || !isV099OrLater(state)) return;
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const recurringCredits = definition.recurringCredits ?? 0;
    if (recurringCredits > 0) {
      const previous = cardCounter(state, cardId, "recurring_credit");
      setCardCounter(
        state,
        cardId,
        "recurring_credit",
        recurringCredits,
      );
      if (previous !== recurringCredits) {
        effects?.push(
          automaticCounterChangeEffect(
            `runner.start.recurring_credit.${cardId}`,
            "runner",
            definition.id,
            "recurring_credit",
            recurringCredits,
            Math.max(0, recurringCredits - previous),
          ),
        );
      }
    }
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
  consumeRunnerRunLockAction(state);
}

function consumeRunnerRunLockAction(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  const pending = Math.max(0, Math.floor(flags.runLockActionsPending ?? 0));
  flags.runLockActionsPending = pending > 0 ? pending - 1 : 0;
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
  const wasRunnerRigCard = runnerInstalledCardIds(state).includes(cardId);
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
  if (wasRunnerRigCard) clearCardCounters(state, cardId);
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
    stoleResearchAgendaThisTurn: false,
    stoleGrayOpsAgendaThisTurn: false,
    stoleBlackOpsAgendaThisTurn: false,
    runAttemptsThisTurn: 0,
    runAttemptsLastTurn: 0,
    damagePreventionUsage: {},
    brokerActionCardIdsThisTurn: [],
    startOfTurnFloatingCreditsApplied: false,
    allNighterBonusRunPending: false,
    forgoNextActionPending: false,
    forgoNextActionsPending: 0,
    runLockActionsPending: 0,
    fangRunLockCreditCost: 0,
    valuPakProgramInstallActionsRemaining: 0,
    valuPakTemporaryProgramInstallCredits: 0,
    bodyweightDataCrecheExtraRunPending: false,
    bodyweightDataCrecheExtraRunUsedThisTurn: false,
    startupImmolatorUsedSourceIdsThisTurn: [],
  });
  flags.stoleResearchAgendaThisTurn ??= false;
  flags.stoleGrayOpsAgendaThisTurn ??= false;
  flags.stoleBlackOpsAgendaThisTurn ??= false;
  flags.runAttemptsThisTurn ??= 0;
  flags.runAttemptsLastTurn ??= 0;
  flags.successfulHqRunThisTurn ??= false;
  flags.damagePreventionUsage ??= {};
  flags.brokerActionCardIdsThisTurn ??= [];
  flags.startOfTurnFloatingCreditsApplied ??= false;
  flags.allNighterBonusRunPending ??= false;
  flags.forgoNextActionPending ??= false;
  flags.forgoNextActionsPending ??= 0;
  flags.runLockActionsPending ??= 0;
  flags.fangRunLockCreditCost ??= 0;
  flags.valuPakProgramInstallActionsRemaining ??= 0;
  flags.valuPakTemporaryProgramInstallCredits ??= 0;
  flags.bodyweightDataCrecheExtraRunPending ??= false;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn ??= false;
  flags.startupImmolatorUsedSourceIdsThisTurn ??= [];
  return flags;
}

function hasSuccessfulHqRunThisTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.successfulHqRunThisTurn === true;
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
  const movedInstance = runnerInstalledCardIds(state).includes(cardId)
    ? cardInstanceWithoutCounters(instance)
    : instance;
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
    ...movedInstance,
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
