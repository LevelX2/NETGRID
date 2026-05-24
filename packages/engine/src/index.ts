import {
  DEMO_CARDS_BY_ID,
  type ActionType,
  type ChoiceRequest,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CardType,
  type CounterType,
  type CorpServer,
  type DeckDefinition,
  type DemoDeckId,
  type DamageType,
  type ApplyActionOptions,
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
  type LegacyAbilityPayloadField,
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
  assertCorpRezCostQuoteValid,
  assertCorpTraceBidPaymentValid,
  assertPostBidLinkPaymentValid,
  assertRunnerTraceBidPaymentValid,
  corpServerIdForInstalledCard,
  corpTracePaymentPublicPayload,
  costQuotePublicPayload,
  costQuoteToLegalActionCosts,
  oliviaSalazarRezSourcesForRunIce,
  payPostBidLinkPaymentQuote,
  payCorpTraceBidQuote,
  payRunnerTraceBidQuote,
  postBidLinkPaymentPublicPayload,
  quoteCorpIceInstallCost,
  quoteCorpRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
  runnerTracePaymentPublicPayload,
  type CorpTracePaymentDependencies,
  type RunnerTracePaymentDependencies,
} from "./game/payment";
import {
  assertTraceBaseLinkChoiceValid,
  installedTraceBaseLinkCardImplementation,
  quoteTraceBaseLinkChoices,
  traceBaseLinkChoicePublicPayload,
} from "./game/trace/base-link";
import {
  requireTracePhase,
  traceIsInPhase,
  tracePostBidLinkSourceUsed,
} from "./game/trace/trace-state";
import { describeTraceResultFromTrace } from "./game/trace/trace-result";
import {
  buildLegalAction as action,
  makeActionId,
} from "./game/turn/action-builders";
import {
  buildCorpDrawAction,
  buildCorpEndTurnAction,
  buildCorpGainCreditAction,
  buildCorpPurgeVirusAction,
} from "./game/turn/corp-basic-actions";
import {
  buildCorpNewRemoteIceInstallAction,
  buildCorpNewRemoteRootInstallAction,
  buildCorpServerIceInstallAction,
  buildCorpServerRootInstallAction,
} from "./game/turn/corp-install-actions";
import {
  buildRunnerEndTurnAction,
  buildRunnerGainCreditAction,
  buildRunnerRemoveTagAction,
} from "./game/turn/runner-basic-actions";
import {
  buildRunnerDrawCardActions,
  type RunnerDrawActionContext,
} from "./game/turn/runner-draw-actions";
import {
  buildRunnerHardwareInstallAction,
  buildRunnerProgramInstallAction,
  buildRunnerResourceInstallAction,
} from "./game/turn/runner-install-actions";
import {
  buildRunnerAgendaPointInstallAction,
  buildRunnerSelectedServerInstallAction,
} from "./game/turn/runner-install-context-actions";
import {
  buildRunnerHostedProgramInstallAction,
  buildRunnerZetatechOverlayInstallAction,
} from "./game/turn/runner-hosted-install-actions";
import {
  buildRunnerProgramTrashBeforeInstallAction,
} from "./game/turn/runner-program-trash-install-actions";
import { buildRunnerStackSearchProgramToGripAction } from "./game/turn/runner-hidden-zone-search-actions";
import {
  buildRunnerSelfModifyingCodeInstallAction,
  buildRunnerShellTradersRemoveCounterAction,
  buildRunnerShellTradersSetAsideAction,
  buildRunnerValuPakInstallAction,
  buildRunnerValuPakSequenceEndAction,
} from "./game/turn/runner-special-zone-install-actions";
import {
  handleMysteryBoxTopFiveProgramInstallActivation,
  lookTopStackShowToCorpThenInstallMatchingTargets,
  lookTopStackTakeMatchingTargets,
  searchStackInstallTargets,
  searchStackToGripTargets,
  searchTrashToGripTargets,
  sneakPreviewInstallableProgramIds,
  sneakPreviewSourceOptions,
  stackOrTrashProgramInstallTargets,
  startAujourdOuiTop5Activation,
  startLookTopStackShowToCorpThenInstallMatchingActivation,
  startLookTopStackTakeMatchingActivation,
  startRunnerStackSearchChoiceActivation,
  startSearchStackInstallActivation,
  startSearchStackToGripActivation,
  startSearchTrashToGripActivation,
  startSelfModifyingCodeStackActivation,
  startSneakPreviewSourceActivation,
  startStackOrTrashProgramInstallActivation,
} from "./game/hidden-zone/search-choice-activations";
import {
  handleHiddenZoneSearchChoice,
  type HiddenZoneSearchActivationHandlerHost,
  type HiddenZoneSearchChoiceHandlerHost,
} from "./game/hidden-zone/search-choice-handlers";
import {
  handleHiddenZoneArrangeChoice,
  moveTopTrashToGripForCardImplementation,
  resolveNewBloodConcealAndReorder,
  startCardImplementationLookTopStackTakeOneArrangeRestChoice,
  startCorpAssetRdTopReorderChoice,
  startCorpRdArrangeChoice,
  startCorpRdTopReorderChoice,
  startFortressRespecificationReorderChoice,
  startRunnerStackArrangeChoice,
  startRunnerStackTop5Choice,
  type HiddenZoneArrangeChoiceHandlerHost,
} from "./game/hidden-zone/arrange-choice-handlers";
import {
  handleHiddenZoneNonSearchChoice,
  startCardImplementationTrashCardsFromGripForCreditsChoice,
  startCardImplementationTrashOwnInstalledCardsForCreditsChoice,
  startCorpArchivesToHqChoice,
  startCorpDiscardHqWithRetainPaymentChoice,
  startRunnerGripTrashForCreditsChoice,
  startRunnerInstalledTrashForCreditsChoice,
  startSmithsPawnshopChoice,
  startSocialEngineeringHideChoice,
  startSynchronizedAttackOnHqRetainChoice,
  type HiddenZoneNonSearchChoiceHandlerHost,
} from "./game/hidden-zone/nonsearch-choice-handlers";
import {
  handleCorpZoneChoice,
  resolveAiChiefFinancialOfficer,
  resolveReschedulerHqShuffleDraw,
  startCorporateDownsizingScoreChoice,
  startCorporateNegotiatingCenterChoice,
  startShowHqAgendasForCreditsChoice,
  type CorpZoneChoiceHandlerHost,
} from "./game/hidden-zone/corp-zone-choice-handlers";
import {
  handleCorpInstallRezSequenceChoice,
  resolveSecurityPurgeAgendaPurge,
  startDataFortReclamationChoice,
  startPriorityRequisitionChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "./game/corp/install-rez-sequence-handlers";
import {
  handleScoredAgendaFlowChoice,
  scoreAgenda,
  startEmployeeEmpowermentStartDrawChoice,
  type ScoredAgendaFlowHost,
} from "./game/corp/scored-agenda-flow";
import {
  buildScoredAgendaAbilityActionsForCard,
  handleScoredAgendaActivatedAbilityAction,
  type ScoredAgendaAbilityHost,
} from "./game/corp/scored-agenda-abilities";
import {
  buildCorpTraceDamageAbilityActionsForCard,
  handleCorpTraceDamageActivatedAbility,
  type CorpTraceDamageAbilityHost,
} from "./game/corp/trace-damage-abilities";
import {
  buildCorpSpecialDamageAbilityActionsForCard,
  handleCorpSpecialDamageAbilityAction,
  type CorpSpecialDamageAbilityHost,
} from "./game/corp/special-damage-abilities";
import {
  availableRunnerAccessTrashCredits,
  buildRunnerAccessActions,
  runnerAccessTrashRecurringCreditSourceIds,
  type RunnerAccessActionHost,
} from "./game/access/access-actions";
import {
  handleAccessEffectsForCard,
  resolveAccessPaymentChoice,
  resolveChimeraDaemonTrashChoice as resolveAccessChimeraDaemonTrashChoice,
  type AccessEffectHandlerHost,
} from "./game/access/access-effect-handlers";
import {
  advanceArchivesBreachPastNonDecisionCards,
  handleAccessExecution,
  type AccessFlowHost,
} from "./game/access/access-flow";
import {
  installedAccessBonusForServer,
  installedAccessBonusSourceDefinitionIdsForServer,
  runnerHqAccessBonus as runnerHqAccessBonusForBreach,
  type BreachStateHost,
} from "./game/access/breach-state";
import {
  enterAccessFromSuccessfulRun,
  resolveMicrotechAiInterfacePreAccessChoice,
  resolvePriorityWreckSpendChoice,
  sourcePayloadForSuccessfulRunReplacement,
  type SuccessfulRunInterventionKind,
  type RunAccessTransitionHost,
} from "./game/run/run-access-transition";
import { shuffleRunnerStackAndRefreshZones } from "./game/hidden-zone/runner-stack-shuffle";
export { quoteCorpRezCost } from "./game/payment";
export {
  createGame,
  createGameAfterSetup,
} from "./game/create-game";
import { hashState } from "./game/hash";
import { buildPlayerViewProjection } from "./game/view/player-view-projection";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "./game/view/card-view";
import { toPublicEvent } from "./game/view/public-event-view";
export { redactPublicEventForSide } from "./game/view/public-event-view";
export { hashGameState, hashState } from "./game/hash";
import { validateGameState } from "./game/validation";
export {
  validateGameState,
  validateGameStateForDebug,
} from "./game/validation";
import {
  additionalSubroutinesForIce,
  dynamicSubroutineAttributionFor,
} from "./ability-engine/additional-subroutine-modifiers";
import { quoteBreakSubroutineCostModifiers } from "./ability-engine/break-subroutine-cost-modifiers";
import { runnerCardImplementationAbilityLimitHost } from "./ability-engine/card-implementation-ability-limits";
import {
  effectiveAgendaDifficulty,
  maxHandSize,
  runnerMemoryLimit,
  type EffectiveAgendaDifficultyDependencies,
} from "./ability-engine/effective-values";
import {
  publicContextForAction,
  publicServerLabel,
  publicServerLabelForCard,
  serverChoiceDisplayLabel,
  type PublicContextForActionDependencies,
} from "./public-context";
import { printedSubroutinesForCardImplementation } from "./ability-engine/printed-subroutine-implementations";
import { traceSuccessEffectForCardImplementation } from "./ability-engine/trace-implementations";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "./ability-engine/icebreaker-abilities";
import { iceStrengthModifierBonusFor } from "./ability-engine/ice-strength-modifiers";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "./card-implementations/registry";
import {
  ACTION_ASSET_CARD_IDS,
  COUNTER_ASSET_CARD_IDS,
  COUNTER_OPERATION_CARD_IDS,
  OVERADVANCE_AGENDA_CARD_IDS,
  scoredAgendaCounterCreditPayload,
  scoredAgendaCounterCreditProfileForDefinition,
  scoredAgendaCounterCreditProfileForPayload,
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
  PROJECT_CONSULTANTS_ADVANCE_AGENDA_OPERATION_ID,
  SILVER_LINING_RECOVERY_PROTOCOL_ECONOMY_OPERATION_ID,
  SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
  VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID,
  VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID,
} from "./mechanics/agenda-operation-effects";
import {
  COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID,
  DISINFECTANT_VIRUS_COUNTER_ASSET_ID,
  KRUMZ_TRACE_ASSET_CARD_ID,
  SETUP_ACCESS_AMBUSH_ASSET_CARD_ID,
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
  AUJOURD_OUI_RESOURCE_CARD_ID,
  HIDDEN_ZONE_REORDER_ASSET_CARD_IDS,
  HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS,
  RUNNER_GRIP_TRASH_EVENT_CARD_ID,
  RUNNER_STACK_TOP5_EVENT_CARD_ID,
  SERVER_EXPOSE_PROGRAM_CARD_IDS,
  SERVER_ICE_SWAP_UPGRADE_CARD_ID,
  SHORT_CIRCUIT_RESOURCE_CARD_ID,
  STACK_SEARCH_PROGRAM_CARD_IDS,
  STACK_TOP_REORDER_RESOURCE_CARD_ID,
  STACK_TOP_REVEAL_PROGRAM_CARD_IDS,
} from "./mechanics/hidden-zone";
import { NEWSGROUP_TAUNTING_TAG_HANDSIZE_ASSET_ID } from "./mechanics/global-modifiers";
import { COUNTER_UPGRADE_CARD_IDS } from "./mechanics/hosting-counters";
import {
  ANONYMOUS_TIP_DEREZ_BLACK_ICE_EVENT_ID,
  CORE_COMMAND_JETTISON_ICE_HQ_TRASH_EVENT_ID,
  COROLLA_SPEED_CHIP_STRENGTH_HARDWARE_ID,
  EDGERUNNER_TEMPS_INSTALL_OPERATION_ID,
  FALSE_ECHO_FORCE_REZ_PROGRAM_ID,
  FORGED_ACTIVATION_ORDERS_FORCE_REZ_EVENT_ID,
  JAPANESE_WATER_TORTURE_BREAKER_ID,
  MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
  MISC_FOR_SALE_TRASH_INSTALLED_EVENT_ID,
  NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID,
  OPEN_ENDED_MILEAGE_PROGRAM_TAG_RETURN_EVENT_ID,
  RABBIT_HQ_INTERFACE_PROGRAM_ID,
  SECURITY_CODE_WORM_CHIP_HQ_TRASH_EVENT_ID,
  SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID,
  STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID,
  SYNCHRONIZED_ATTACK_ON_HQ_RETAIN_EVENT_ID,
  VALU_PAK_SOFTWARE_BUNDLE_INSTALL_EVENT_ID,
  VIRAL_15_PROGRAM_TRASH_ICE_ID,
  ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID,
} from "./mechanics/longtail-card-effects";
import {
  corpInstalledEconomyActionPayload,
  corpInstalledEconomyActionProfileForDefinition,
  corpInstalledEconomyActionProfileForPayload,
  CORP_RECURRING_ASSET_CARD_IDS,
  type EconomyActionProfile,
} from "./mechanics/payment-costs";
import {
  buildPublicAbilitySchemaContext,
  legacyAbilityPayloadEntries,
} from "./mechanics/public-payload-schema";
import {
  isP358HiddenReplacementCompatibilityChoiceSource,
  isReplayCompatibilityActionPayload,
} from "./compatibility/payload-compatibility";
import {
  ALL_NIGHTER_ID,
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
  BARTMOSS_ID,
  BIZARRE_ENCRYPTION_SCHEME_ID,
  BLINK_ID,
  BODYWEIGHT_DATA_CRECHE_ID,
  BUTCHER_BOY_ID,
  CHIMERA_ID,
  COCKROACH_ID,
  CODE_VIRAL_CACHE_ID,
  DANSHIS_SECOND_ID,
  DEAL_WITH_MILITECH_ID,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
  DUPRE_ID,
  EMPLOYEE_EMPOWERMENT_ID,
  FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE,
  GRUBB_ID,
  HELLS_RUN_ID,
  HUNT_CLUB_BBS_ID,
  ICE_PICK_WILLIE_ID,
  INCUBATOR_ID,
  JUNKYARD_BBS_ID,
  MICROTECH_TRODE_SET_ID,
  MIT_WEST_TIER_REMOVED_FROM_GAME_REASON,
  MYSTERY_BOX_ID,
  NEVINYRRAL_ID,
  PATTELS_VIRUS_ID,
  PILE_DRIVER_ID,
  POX_ID,
  RAMMING_PISTON_ID,
  RONIN_AROUND_ID,
  SELF_MODIFYING_CODE_ID,
  SHELL_TRADERS_ID,
  SKIVVISS_ID,
  SMARTEYE_ID,
  SNEAK_PREVIEW_ID,
  TERRORIST_REPRISAL_ID,
  TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE,
  TOO_MANY_DOORS_ID,
  ZZ22_SPEED_CHIP_ID,
} from "./compatibility/runtime-compatibility";
import {
  AI_BOON_RANDOM_BREAKER_CARD_ID,
  BOARDWALK_RANDOM_PROGRAM_CARD_ID,
  QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID,
  RUNNER_RANDOM_PROGRAM_CARD_IDS,
} from "./mechanics/random-effects";
import {
  RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
  RUN_REPLACEMENT_OVERLAP_EVENT_CARD_ID,
  TRACE_AWARE_RUN_EVENT_CARD_ID,
} from "./mechanics/run-access";
import {
  CRYBABY_ACCESS_COST_UPGRADE_ID,
  DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID,
  DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID,
  PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
  TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID,
} from "./mechanics/server-upgrades";
import {
  RUN_TAX_UPGRADE_CARD_IDS,
  TAG_CONDITION_UPGRADE_CARD_IDS,
} from "./mechanics/trace-tags";
import { snapshotPersistentStealCostModifiersForSource } from "./ability-engine/steal-cost-modifiers";
import { createCardImplementationEffectAdapters } from "./ability-engine/card-implementation-effect-adapters";
import {
  canPlayPrintedCostOnPlayImplementation,
  executeCardImplementationLifecycleEffects,
  executeCardImplementationRunnerRunStartEffects,
  executeCardImplementationStartOfCorpTurnEffects,
  executeCardImplementationStartOfRunnerTurnEffects,
  executeOnPlayCardImplementationAbility,
  pushActivatedCardImplementationActions,
  pushActivatedCardImplementationActionsForTiming,
  pushCardImplementationEndOfRunnerTurnActions,
  resolveActivatedCardImplementationAbility,
  resolveCardImplementationEndOfRunnerTurnAction,
  type CardImplementationRuntimeDependencies,
} from "./ability-engine/card-implementation-runtime";
import type {
  ActivatedCardAbilityImplementation,
  CardCorpUtilityImplementation,
  CardDamagePreventionSourceImplementation,
  CardEffectImplementation,
  CardFortRunWindowImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardHiddenReplacementLongtailImplementation,
  CardRemainingReplacementLongtailImplementation,
  CardRunEncounterInterventionImplementation,
  CardRunnerEventLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardScoredAgendaImplementation,
  CardTagPreventionSourceImplementation,
  CardTraceSuccessEffectImplementation,
  CardTrashPreventionSourceImplementation,
  CardUniqueDirectLongtailImplementation,
  CardVirusCounterImplementation,
  IncreaseTraceLinkEffectImplementation,
  MakeRunEffectImplementation,
  RestrictedHostedCreditUse,
} from "./ability-engine/definition-types";

type AutomaticEffectCollector = ResolvedGameEffect[];

// Effective-value helpers are pure/read-only. Legacy agenda-difficulty pieces
// are still injected from index.ts so the extracted module avoids index imports
// without changing existing score legality or revalidation ordering.
const effectiveAgendaDifficultyDeps: EffectiveAgendaDifficultyDependencies = {
  definitionFor,
  serverDifficultyIncreaseFromFaitAccompli,
  serverDifficultyReductionFromUpgrades,
};

// CardImplementation effect adapters are the mutation boundary for effects that
// still need host primitives. The adapters may call these functions, but card
// files and runtime code stay free of index.ts imports and card-specific logic.
const cardImplementationEffectAdapters = createCardImplementationEffectAdapters({
  drawCorpCards,
  drawRunnerCards,
  runnerDrawSummaryPublicPayload,
  createDamageImminentEvent,
  openReplacementWindow,
  openEventModificationWindow,
  resolveDamageImminentEvent,
  addCardCounter,
  cardCounter,
  spendCardCounter,
  credits,
  mustInstance,
  definitionFor,
  runnerInstalledCardIds,
  trashCorpInstalledCardToArchives,
  trashRunnerInstalledCardToHeap,
});

// Runtime dependencies define the host contract for declarative
// CardImplementation abilities and lifecycle hooks. Payment timing, movement,
// damage windows, and source trashing remain owned by index.ts primitives.
const cardImplementationRuntimeDeps: CardImplementationRuntimeDependencies = {
  definitionFor,
  mustInstance,
  cardCounter,
  rezzedCorpRootCardIds,
  runnerInstalledCardIds,
  runnerRunAttemptsLastTurn,
  runnerWasDamagedDuringLastThreeActions,
  runnerMadeSuccessfulRunOnServerThisTurn: (state, server) =>
    server === "hq" && hasSuccessfulHqRunThisTurn(state),
  runnerLiberatedAgendaSubtypeThisTurn: (state, subtype) =>
    runnerStoleAgendaSubtypeThisTurn(state, subtype),
  corpScoredAgendaSubtypeLastTurn: (state, subtype) =>
    subtype === "black_ops" && corpScoredBlackOpsAgendaLastTurn(state),
  spendClick,
  spendCredits,
  createAction: action,
  appendResolvedEffectsToPayload,
  ...cardImplementationEffectAdapters,
  startTrace: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    baseTraceStrength,
    successEffect,
  ) => {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId: sourceCardId,
    };
    return startTraceFromOperation(
      state,
      sourceDefinitionId,
      baseTraceStrength,
      legalAction,
      successEffect,
    );
  },
  startRun: (state, legalAction, serverId, options) => {
    const sourceCardId =
      typeof legalAction.source === "string" &&
      state.cardInstances[legalAction.source]
        ? legalAction.source
        : typeof legalAction.payload?.cardId === "string" &&
            state.cardInstances[legalAction.payload.cardId]
          ? legalAction.payload.cardId
          : undefined;
    const sourceDefinitionId = sourceCardId
      ? definitionFor(state, sourceCardId).id
      : undefined;
    startRun(
      state,
      serverId,
      undefined,
      options.accessCount ?? 1,
      {
        ...(options.freeTrashAccessZones
          ? { freeTrashAccessZones: options.freeTrashAccessZones.slice() }
          : {}),
        ...(options.accessServerOverride
          ? { accessServerOverride: options.accessServerOverride }
          : {}),
        ...(options.successfulRunAccessReplacement
          ? {
              successfulRunAccessReplacement:
                options.successfulRunAccessReplacement,
            }
          : {}),
        ...(options.successfulRunCreditLoss !== undefined
          ? { successfulRunCreditLoss: options.successfulRunCreditLoss }
          : {}),
        ...(options.successfulRunRunnerTagGain !== undefined
          ? { successfulRunRunnerTagGain: options.successfulRunRunnerTagGain }
          : {}),
        ...(options.successfulRunRunnerCreditGain !== undefined
          ? {
              successfulRunRunnerCreditGain:
                options.successfulRunRunnerCreditGain,
            }
          : {}),
        ...(options.successfulRunRequiresCorpCredits !== undefined
          ? {
              successfulRunRequiresCorpCredits:
                options.successfulRunRequiresCorpCredits,
            }
          : {}),
        ...(options.successfulRunPrivateLookCount !== undefined
          ? { successfulRunPrivateLookCount: options.successfulRunPrivateLookCount }
          : {}),
        ...(options.successfulRunArchivesMoveCount !== undefined
          ? { successfulRunArchivesMoveCount: options.successfulRunArchivesMoveCount }
          : {}),
        ...(options.followupRunOnEnd === "optional"
          ? { grantAllNighterBonusRunOnFinish: true }
          : {}),
        ...(options.bypassFirstIce ? { bypassFirstIceRemaining: true } : {}),
        ...(options.runTraceLinkBonus !== undefined
          ? { runTraceLinkBonus: options.runTraceLinkBonus }
          : {}),
        ...(options.runTemporaryCredits !== undefined
          ? {
              runnerRunTemporaryCredits: {
                sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
                remaining: options.runTemporaryCredits.amount,
                returnUnusedAtRunEnd: true,
              },
            }
          : {}),
        ...(options.afterRunCompletedUnpreventableCoreDamage !== undefined
          ? {
              unpreventableCoreDamageAtRunEnd: {
                sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
                amount: options.afterRunCompletedUnpreventableCoreDamage,
              },
            }
          : {}),
        ...(options.runTraceLinkBonus !== undefined &&
        sourceDefinitionId
          ? {
              runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
            }
          : {}),
        ...(sourceCardId && sourceDefinitionId
          ? {
              successfulRunSourceCardId: sourceCardId,
              successfulRunSourceDefinitionId: sourceDefinitionId,
              successfulRunSourceTitle: definitionFor(state, sourceCardId).title,
            }
          : {}),
      },
      legalAction,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...(options.followupRunOnEnd === "optional"
        ? { allNighterBonusRunOnFinish: true }
        : {}),
      ...(options.bypassFirstIce ? { bypassFirstIce: true } : {}),
      ...(options.runTraceLinkBonus !== undefined
        ? {
            runTraceLinkBonus: options.runTraceLinkBonus,
            ...(typeof legalAction.source === "string" &&
            sourceCardId &&
            sourceDefinitionId
              ? {
                  runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
                }
              : {}),
          }
        : {}),
      ...(options.runTemporaryCredits !== undefined
        ? {
            v1922RunnerEventAbility: "lucidrine_booster_drug_run_temporary_credits",
            temporaryRunCredits: options.runTemporaryCredits.amount,
            temporaryRunCreditsRemaining:
              state.run?.runnerRunTemporaryCredits?.remaining ?? 0,
          }
        : {}),
      ...(options.afterRunCompletedUnpreventableCoreDamage !== undefined
        ? {
            afterRunUnpreventableCoreDamage:
              options.afterRunCompletedUnpreventableCoreDamage,
          }
        : {}),
    };
    return { publicPayload: legalAction.payload ?? {} };
  },
  startPrivateLook: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    zone,
    count,
  ) => {
    startRunnerPrivateLookChoice(
      state,
      sourceCardId,
      sourceDefinitionId,
      zone,
      count,
      "ability",
      legalAction,
    );
    return { publicPayload: legalAction.payload ?? {} };
  },
  exposeInstalledCorpCardTargets: (state, scope) =>
    exposeInstalledCorpCardTargets(state, scope),
  exposeInstalledCorpCard: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    targetCardId,
    scope,
  ) =>
    exposeInstalledCorpCardForImplementation(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      targetCardId,
      scope,
    ),
  startExposeInstalledCorpCardsChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    min,
    max,
  ) =>
    startExposeInstalledCorpCardsChoice(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      min,
      max,
    ),
  exposeOutermostIceEachDataFort: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
  ) =>
    exposeOutermostIceOfEachDataFort(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
    ),
  outermostIceEachDataFortExposeCount: (state) =>
    outermostIceExposures(state).length,
  startShowHqAgendasForCreditsChoice: (
    state,
    sourceCardId,
    sourceDefinitionId,
    creditPerAgenda,
  ) =>
    startShowHqAgendasForCreditsChoice(
      corpZoneChoiceHandlerHost(
        state,
        { side: "corp", payload: {} } as LegalAction,
      ),
      { sourceCardId, sourceDefinitionId, creditPerAgenda },
    ),
  searchTrashToGripTargetCount: (state, filter) =>
    searchTrashToGripTargets(hiddenZoneSearchActivationTargetHost(state), filter)
      .length,
  searchStackToGripTargetCount: (state, filter) =>
    searchStackToGripTargets(hiddenZoneSearchActivationTargetHost(state), filter)
      .length,
  topTrashToGripTargetCount: (state) =>
    topRunnerHeapCardId(state) ? 1 : 0,
  topTrashToGripTargetId: (state) => topRunnerHeapCardId(state),
  searchStackInstallTargetCount: (state, filter, installCost) =>
    searchStackInstallTargets(
      hiddenZoneSearchActivationTargetHost(state),
      filter,
      installCost,
    ).length,
  stackOrTrashProgramInstallTargetCount: (state, installCost) =>
    stackOrTrashProgramInstallTargets(
      hiddenZoneSearchActivationTargetHost(state),
      installCost,
    ).length,
  lookTopStackShowToCorpThenInstallMatchingTargetCount: (
    state,
    count,
    allowedTypes,
    installCost,
  ) =>
    lookTopStackShowToCorpThenInstallMatchingTargets(
      hiddenZoneSearchActivationTargetHost(state),
      count,
      allowedTypes,
      installCost,
    ).length,
  lookTopStackTakeMatchingTargetCount: (state, count, allowedTypes) =>
    lookTopStackTakeMatchingTargets(
      hiddenZoneSearchActivationTargetHost(state),
      count,
      allowedTypes,
    ).length,
  startSearchTrashToGripChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    filter,
  ) =>
    startSearchTrashToGripActivation(
      hiddenZoneSearchActivationHandlerHost(state, legalAction),
      {
      sourceCardId,
      sourceDefinitionId,
      filter,
      },
    ),
  startSearchStackToGripChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    filter,
    revealToCorp,
    shuffleAfterwards,
  ) =>
    startSearchStackToGripActivation(
      hiddenZoneSearchActivationHandlerHost(state, legalAction),
      {
      sourceCardId,
      sourceDefinitionId,
      filter,
      revealToCorp,
      shuffleAfterwards,
      },
    ),
  moveTopTrashToGrip: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
  ) =>
    moveTopTrashToGripForCardImplementation(
      hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
      { sourceDefinitionId },
    ),
  startSearchStackInstallChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    filter,
    installCost,
    shuffleAfterwards,
  ) =>
    startSearchStackInstallActivation(
      hiddenZoneSearchActivationHandlerHost(state, legalAction),
      {
      sourceCardId,
      sourceDefinitionId,
      filter,
      installCost,
      shuffleAfterwards,
      },
    ),
  startStackOrTrashProgramInstallChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    installCost,
    shuffleStackIfSearched,
    returnInstalledCardToGripAtEndOfTurn,
  ) =>
    startStackOrTrashProgramInstallActivation(
      hiddenZoneSearchActivationHandlerHost(state, legalAction),
      {
      sourceCardId,
      sourceDefinitionId,
      installCost,
      shuffleStackIfSearched,
      returnInstalledCardToGripAtEndOfTurn,
      },
    ),
  startLookTopStackShowToCorpThenInstallMatchingChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    count,
    allowedTypes,
    installCost,
    trashSourceIfInstalled,
    shuffleAfterwards,
  ) =>
    startLookTopStackShowToCorpThenInstallMatchingActivation(
      hiddenZoneSearchActivationHandlerHost(state, legalAction),
      {
      sourceCardId,
      sourceDefinitionId,
      count,
      allowedTypes,
      installCost,
      trashSourceIfInstalled,
      shuffleAfterwards,
      },
    ),
  startLookTopStackTakeMatchingChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    count,
    allowedTypes,
    costPerTaken,
    revealTakenToCorp,
    shuffleRemainder,
  ) =>
    startLookTopStackTakeMatchingActivation(
      hiddenZoneSearchActivationHandlerHost(state, legalAction),
      {
      sourceCardId,
      sourceDefinitionId,
      count,
      allowedTypes,
      costPerTaken,
      revealTakenToCorp,
      shuffleRemainder,
      },
    ),
  startLookTopStackTakeOneArrangeRestChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    count,
  ) =>
    startCardImplementationLookTopStackTakeOneArrangeRestChoice(
      hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
      { sourceCardId, sourceDefinitionId, count },
    ),
  trashOwnInstalledCardTargetCount: (state) => runnerInstalledCardIds(state).length,
  trashGripCardTargetCount: (state) => state.runner.grip.length,
  startTrashOwnInstalledCardsForCreditsChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    min,
    max,
    gainPerTrashed,
  ) =>
    startCardImplementationTrashOwnInstalledCardsForCreditsChoice(
      hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
      { sourceCardId, sourceDefinitionId, min, max, gainPerTrashed },
    ),
  startTrashCardsFromGripForCreditsChoice: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    max,
    gainPerTrashed,
  ) =>
    startCardImplementationTrashCardsFromGripForCreditsChoice(
      hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
      { sourceCardId, sourceDefinitionId, max, gainPerTrashed },
    ),
  shuffleGripTrashAndStackThenDraw: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    drawCount,
    removePlayedCardFromGame,
  ) =>
    shuffleGripTrashAndStackThenDrawForCardImplementation(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      drawCount,
      removePlayedCardFromGame,
    ),
  rezzedIceTargetCount: (state) =>
    affordableRezzedInstalledIceIdsForRunner(state).length,
  unrezzedIceTargetCount: (state) => unrezzedInstalledIceIds(state).length,
  installedIceTargetCount: (state) =>
    corpInstalledCardIds(state).filter(
      (cardId) => mustInstance(state.cardInstances, cardId).zone.zone === "serverIce",
    ).length,
  rezzedBlackIceTargetCount: (state) => rezzedBlackIceIds(state).length,
  corpHqCardCount: (state) => state.corp.hq.length,
  runnerValuPakInstallableProgramCount: (state) =>
    runnerInstallableProgramIdsForValuPak(state).length,
  startPayRezCostToTrashRezzedIceChoice: (state, legalAction, sourceCardId) => {
    startCoreCommandJettisonIceChoice(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      p3_48RunnerRunControl: "pay_rez_cost_to_trash_rezzed_ice",
      v1922RunnerEventAbility:
        "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
    };
    return { publicPayload: legalAction.payload ?? {} };
  },
  startTrashUnrezzedIceChoice: (state, legalAction, sourceCardId) => {
    startSecurityCodeWormChipTrashIceChoice(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      p3_48RunnerRunControl: "trash_unrezzed_ice",
      v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
    };
    return { publicPayload: legalAction.payload ?? {} };
  },
  startCorpChoiceRezOrTrashIceChoice: (state, legalAction, sourceCardId) => {
    startForgedActivationOrdersTargetChoice(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      p3_48RunnerRunControl: "corp_choice_rez_or_trash_ice",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
    };
    return { publicPayload: legalAction.payload ?? {} };
  },
  startDerezRezzedBlackIceChoice: (state, legalAction, sourceCardId) => {
    startAnonymousTipDerezBlackIceChoice(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "derez_black_ice",
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
    };
    return { publicPayload: legalAction.payload ?? {} };
  },
  startCorpDiscardHqWithRetainPayment: (
    state,
    legalAction,
    sourceCardId,
    retainCostPerCard,
  ) =>
    startCorpDiscardHqWithRetainPaymentChoice(
      hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
      { sourceCardId, retainCostPerCard },
    ),
  startRunnerProgramInstallActionBundle: (
    state,
    legalAction,
    actionCount,
    temporaryCredit,
  ) => {
    if (actionCount !== 5 || temporaryCredit !== 1)
      throw new Error("Valu-Pak Software Bundle profile is invalid.");
    const installablePrograms = runnerInstallableProgramIdsForValuPak(state);
    if (installablePrograms.length === 0)
      throw new Error(
        "Valu-Pak Software Bundle findet kein installierbares Programm.",
      );
    const flags = ensureRunnerTurnFlags(state);
    flags.valuPakProgramInstallActionsRemaining = actionCount;
    flags.valuPakTemporaryProgramInstallCredits = temporaryCredit;
    state.runner.clicks += actionCount;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "program_install_action_bundle",
      gainedActions: actionCount,
      temporaryProgramInstallCredits: temporaryCredit,
      valuPakProgramInstallActionsRemaining:
        flags.valuPakProgramInstallActionsRemaining,
      runnerClicksAfter: state.runner.clicks,
    };
    return { publicPayload: legalAction.payload ?? {} };
  },
  addCounterToAllInstalledRunnerIcebreakers: (state, counterType, amount) =>
    addCounterToAllInstalledRunnerIcebreakers(state, counterType, amount),
  gainRunnerEventAgendaPoint: (
    state,
    legalAction,
    sourceDefinitionId,
    amount,
  ) => {
    if (amount !== 1)
      throw new Error("Runner event agenda point amount must be 1.");
    awardRunnerEventAgendaPoint(state, legalAction, sourceDefinitionId);
    return { publicPayload: legalAction.payload ?? {} };
  },
  corpRandomDiscardFromHq: (state, sourceDefinitionId, count) => {
    const discardedCardIds = discardRandomCorpHqCards(
      state,
      count,
      sourceDefinitionId === TERRORIST_REPRISAL_ID
        ? `v190.random.${TERRORIST_REPRISAL_ID}.hq_discard`
        : `card_implementation.random.${sourceDefinitionId}.hq_discard`,
    );
    return {
      publicPayload: {
        hiddenZoneBarrier: true,
        hiddenZoneAction: "hq_random_discard",
        discardedCardsCount: discardedCardIds.length,
      },
    };
  },
  startDistributeAdvancementCounters: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    amount,
    distribution,
  ) =>
    startCardImplementationAdvancementDistributionChoice(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      amount,
      distribution,
    ),
  startMoveAdvancementCounters: (
    state,
    legalAction,
    sourceCardId,
    sourceDefinitionId,
    source,
    maxAmount,
  ) =>
    startCardImplementationMoveAdvancementChoice(
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      source,
      maxAmount,
    ),
  removeRunnerTags: (state, mode, amount) =>
    removeRunnerTagsForCardImplementation(state, mode, amount),
  avoidNextTag: (state, amount) =>
    addRunnerTagAvoidanceCredit(state, amount),
  returnSourceToGripIfPaid: (state, legalAction, sourceCardId, amount) =>
    startReturnSourceToGripIfPaidChoice(
      state,
      legalAction,
      sourceCardId,
      amount,
    ),
  abilityLimits: runnerCardImplementationAbilityLimitHost,
};

// Public context generation is read-only and injected here to avoid an import
// cycle. It may format already-public payload data, but it must not decide
// action legality or reveal hidden card identities.
const publicContextDeps: PublicContextForActionDependencies = {
  agendaPointsForScoredCard,
  cardCounter,
  cardStrengthModifier: (state, cardId) =>
    mustInstance(state.cardInstances, cardId).strengthModifier +
    hostedProgramStrengthModifier(state, cardId),
  creditCostForAction,
  definitionFor,
  pumpAmountForLegalAction,
  runnerHqAccessBonus: (state) =>
    runnerHqAccessBonusForBreach(breachStateHost(state)),
  v1915InstalledAccessBonus: (state, serverId) =>
    installedAccessBonusForServer(breachStateHost(state), serverId),
};
type VisibleCounterPayload = {
  counterType: CounterType;
  addedCounterAmount?: number;
  removedCounterAmount?: number;
  remainingCounters: number;
};

const BAD_PUBLICITY_LOSS_THRESHOLD = 7;

export {
  DEMO_CARDS,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  CURRENT_RULES_BASELINE,
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

function installTargetBindingForDefinition(definition: CardDefinition) {
  return cardImplementationForDefinitionId(definition.id)?.installTargetBinding;
}

function requiresDataFortInstallTarget(definition: CardDefinition): boolean {
  return (
    installTargetBindingForDefinition(definition)?.kind ===
    "choose_data_fort_on_install"
  );
}

function runnerEventLongtailForDefinition(
  definition: CardDefinition,
): CardRunnerEventLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)?.runnerEventLongtail;
}

function runnerEventLongtailKindForDefinition(
  definition: CardDefinition,
): CardRunnerEventLongtailImplementation["kind"] | undefined {
  return runnerEventLongtailForDefinition(definition)?.kind;
}

function hiddenReplacementLongtailForDefinition(
  definition: CardDefinition,
): CardHiddenReplacementLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)
    ?.hiddenReplacementLongtail;
}

function cardImplementationRunnerEventResolver(
  definition: CardDefinition,
): RunnerEventResolver | undefined {
  const longtail = runnerEventLongtailForDefinition(definition);
  if (longtail) {
    switch (longtail.kind) {
      case "playful_ai_dice_loop":
        return {
          name: "card_implementation_runner_event_playful_ai_dice_loop",
          resolve: (state, legalAction) =>
            resolvePlayfulAiDiceLoopEvent(
              state,
              legalAction,
              definition.id,
              longtail,
            ),
        };
      default: {
        const unknown = longtail as { kind?: string };
        throw new Error(
          `Unsupported runner event longtail: ${unknown.kind ?? "unknown"}`,
        );
      }
    }
  }
  const hiddenLongtail = hiddenReplacementLongtailForDefinition(definition);
  if (hiddenLongtail?.kind === "fortress_respecification_ice_reorder") {
    return {
      name: "card_implementation_runner_event_fortress_respecification_ice_reorder",
      canPlay: (state) => hasSuccessfulRunThisTurn(state),
      resolve: (state, legalAction) => {
        if (!hasSuccessfulRunThisTurn(state))
          throw new Error(
            "Fortress Respecification benoetigt einen erfolgreichen Run in diesem Zug.",
          );
        startFortressRespecificationReorderChoice(
          hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
          String(legalAction.payload?.cardId ?? ""),
        );
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "p3_58_fortress_respecification_reorder",
        };
      },
    };
  }
  return undefined;
}

function printedCostCardImplementationMakeRunEffect(
  definition: CardDefinition,
): MakeRunEffectImplementation | undefined {
  const ability = cardImplementationForDefinitionId(definition.id)?.abilities?.find(
    (candidate) => candidate.kind === "on_play" && candidate.costs === "printed",
  );
  return ability?.effects.find(
    (effect): effect is MakeRunEffectImplementation => effect.kind === "make_run",
  );
}

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
const INITIAL_HAND_SIZE = 5;
const PROTEUS_DIGICONDA_ID = "onr_proteus_020_digiconda";
const PROTEUS_FOOD_FIGHT_ID = "onr_proteus_022_food-fight";
const TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS = new Set([
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
]);
const PARIS_CITY_GRID_TRACE_POOL_BITS = 3;

function scoredAgendaImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardScoredAgendaImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.scoredAgenda;
}

function scoredAgendaImplementationForDefinition(
  definition: CardDefinition,
): CardScoredAgendaImplementation | undefined {
  return scoredAgendaImplementationForDefinitionId(definition.id);
}

function scoredAgendaKindForDefinition(
  definition: CardDefinition,
): CardScoredAgendaImplementation["kind"] | undefined {
  return scoredAgendaImplementationForDefinition(definition)?.kind;
}

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
      const summary = drawRunnerCards(state, 2);
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
      const summary = drawRunnerCards(state, 3);
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
      startRunnerStackSearchChoiceActivation(
        hiddenZoneSearchActivationHandlerHost(state, legalAction),
      );
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
      startRunnerStackArrangeChoice(
        hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
      );
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
        hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        { sourceCardId: String(legalAction.payload?.cardId ?? "") },
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
        hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
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
        hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
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
        hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
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
  [SNEAK_PREVIEW_ID]: {
    name: "onr_v1911_runner_event_sneak_preview_temporary_program_install",
    canPlay: (state) =>
      sneakPreviewSourceOptions(hiddenZoneSearchActivationTargetHost(state))
        .length > 0,
    resolve: (state, legalAction) => {
      startSneakPreviewSourceActivation(
        hiddenZoneSearchActivationHandlerHost(state, legalAction),
      );
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
  [RUN_ACCESS_PRESSURE_EVENT_CARD_ID]: {
    name: "onr_v1958_runner_event_social_engineering_secret_guess",
    canPlay: (state) => state.runner.credits >= 2,
    resolve: (state, legalAction) => {
      if (state.runner.credits < 2)
        throw new Error("Social Engineering benoetigt mindestens 2 Credits.");
      startSocialEngineeringHideChoice(
        hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
        String(legalAction.payload?.cardId ?? ""),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        socialEngineeringSecretChoiceOpened: true,
        hiddenZoneBarrier: true,
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
      startCorpArchivesToHqChoice(
        hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
        sourceCardId,
      );
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
      startCorpRdTopReorderChoice(
        hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        sourceCardId,
      );
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
  [SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_two_advancement_counters",
    canPlay: (state) => advanceableInstalledCardTargets(state).length > 0,
    resolve: (state, legalAction) =>
      resolveSystematicLayoffsAdvancementOperation(state, legalAction),
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
};

type RunnerDrawSummary = {
  drawnCount: number;
  drawnCardIds?: CardInstanceId[];
  citySurveillanceSourceCount: number;
  citySurveillanceCreditsPaid: number;
  citySurveillanceTagsAdded: number;
  crashEverettSourceCardId?: CardInstanceId;
  crashEverettChoiceOpened?: boolean;
};

type CitySurveillanceDrawDecision = "auto" | "pay" | "tag";

function emptyRunnerDrawSummary(): RunnerDrawSummary {
  return {
    drawnCount: 0,
    drawnCardIds: [],
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
    drawnCardIds: [...(left.drawnCardIds ?? []), ...(right.drawnCardIds ?? [])],
    citySurveillanceSourceCount: Math.max(
      left.citySurveillanceSourceCount,
      right.citySurveillanceSourceCount,
    ),
    citySurveillanceCreditsPaid:
      left.citySurveillanceCreditsPaid + right.citySurveillanceCreditsPaid,
    citySurveillanceTagsAdded:
      left.citySurveillanceTagsAdded + right.citySurveillanceTagsAdded,
    crashEverettChoiceOpened:
      left.crashEverettChoiceOpened === true ||
      right.crashEverettChoiceOpened === true,
    ...((left.crashEverettSourceCardId ?? right.crashEverettSourceCardId)
      ? {
          crashEverettSourceCardId:
            left.crashEverettSourceCardId ?? right.crashEverettSourceCardId,
        }
      : {}),
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
    ...runnerDrawSummaryPublicPayload(state, summary),
  };
}

function runnerDrawSummaryPublicPayload(
  state: GameState,
  summary: RunnerDrawSummary,
): Record<string, string | number | boolean> {
  if (summary.drawnCount <= 0) return {};
  return {
    drawnCount: summary.drawnCount,
    ...(summary.crashEverettChoiceOpened && summary.crashEverettSourceCardId
      ? {
          drawReplacementSourceTitle: "Crash Everett, Inventive Fixer",
          drawReplacementExtraDrawn: 1,
          crashEverettChoiceOpened: true,
        }
      : {}),
    ...(summary.citySurveillanceSourceCount > 0
      ? {
          citySurveillanceSourceCount: summary.citySurveillanceSourceCount,
          citySurveillanceCreditsPaid: summary.citySurveillanceCreditsPaid,
          citySurveillanceTagsAdded: summary.citySurveillanceTagsAdded,
          citySurveillanceTags: summary.citySurveillanceTagsAdded,
          runnerCreditsAfter: state.runner.credits,
          runnerTagsAfter: state.runner.tags,
        }
      : {}),
  };
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
  const inactiveCorpRunnerActionPaidWindow =
    state.timingPoint === "runner_action.main" && side === "corp";
  if (
    side !== state.activeSide &&
    !sharedRunWindow &&
    !inactiveCorpRunnerActionPaidWindow
  )
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
  if (state.timingPoint === "runner_action.main") {
    if (side === "runner") return runnerMainActions(state);
    return side === "corp" ? corpRunnerActionPaidWindowActions(state) : [];
  }
  if (state.timingPoint === "run.approach_ice") {
    if (isApproachIceExposeViewingWindowOpen(state))
      return side === "runner" ? runnerApproachIceExposeViewingActions(state) : [];
    if (isApproachIceExposeWindowOpen(state))
      return side === "runner" ? runnerApproachIceExposeActions(state) : [];
    return side === "corp" ? corpApproachActions(state) : [];
  }
  if (state.timingPoint === "run.encounter_ice")
    return side === "runner" ? runnerEncounterActions(state) : [];
  if (state.timingPoint === "run.jack_out_window") {
    if (side === "corp") return corpRunRootRezWindowActions(state);
    if (isCorpRunRootRezWindowOpen(state)) return [];
    return side === "runner" ? runnerMovementActions(state) : [];
  }
  if (state.timingPoint === "access.resolve_card")
    return side === "runner"
      ? buildRunnerAccessActions(runnerAccessActionHost(state)).legalActions
      : [];
  return [];
}

export function legalActionsFor(state: GameState, side: Side): LegalAction[] {
  return getLegalActions(state, side);
}

export function applyAction(
  state: GameState,
  playerAction: PlayerAction,
  options: ApplyActionOptions = {},
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

  const next = cloneGameStateForAction(state);
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
    publicEvents:
      options.publicEventsMode === "latest"
        ? [toPublicEvent(event)]
        : next.eventLog.map(toPublicEvent),
    stateHash,
  };
}

export function applyGameAction(
  state: GameState,
  playerAction: PlayerAction,
  options: ApplyActionOptions = {},
): EngineResult {
  return applyAction(state, playerAction, options);
}

export function getPlayerView(state: GameState, side: Side): PlayerView {
  return buildPlayerViewProjection(state, side, getLegalActions(state, side));
}

export function playerViewFor(state: GameState, side: Side): PlayerView {
  return getPlayerView(state, side);
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
  if (state.corp.badPublicity >= BAD_PUBLICITY_LOSS_THRESHOLD) {
    state.winner = "runner";
    state.gameEndReason = "bad_publicity_7";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    delete state.pendingChoice;
    delete state.run;
    return state.winner;
  }
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
    if (!isReplayCompatibilityActionPayload(actionPayload)) {
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

export function replayGameEvents(
  initialState: GameState,
  eventLog: GameEvent[],
): ReplayResult {
  return replayEvents(initialState, eventLog);
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
  if (legalAction.type === "decline_rez") return "public";
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

function corpRunnerActionPaidWindowActions(state: GameState): LegalAction[] {
  const actions: LegalAction[] = [];
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      const instance = mustInstance(state.cardInstances, id);
      if (
        (definition.type !== "asset" && definition.type !== "upgrade") ||
        instance.rezzed
      )
        continue;
      const rezCost = rezCostForCard(state, id);
      if (state.corp.credits < rezCost) continue;
      if (
        isAcmeSavingsAndLoanDefinition(definition.id) &&
        corpAgendaPointTotal(state) < 1
      )
        continue;
      const rezCostReductionSourceDefinitionIds =
        rezCostReductionSourceDefinitionIdsFor(state, id, definition);
      const acmeRezCost = isAcmeSavingsAndLoanDefinition(definition.id)
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
          `${definition.title} in ${server.label} rezzen`,
          id,
          [{ credits: rezCost }],
          {
            cardId: id,
            rootRez: true,
            runnerActionPaidWindowRez: true,
            serverId: server.id,
            ...acmeRezCost,
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
  }
  return actions;
}

function corpMainActions(state: GameState): LegalAction[] {
  const actions: LegalAction[] = [];
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (
        definition.type === "agenda" &&
        effectiveAgendaDifficulty(effectiveAgendaDifficultyDeps, state, id) <=
          mustInstance(state.cardInstances, id).advancementCounters
      ) {
        if (
          scoredAgendaKindForDefinition(definition) ===
          "choose_fort_ice_strength_bonus"
        ) {
          for (const targetServer of state.corp.servers) {
            actions.push(
              action(
                state,
                "corp",
                "score_agenda",
                `Security Net Optimization scoren und ${serverChoiceDisplayLabel(
                  state,
                  targetServer.id,
                )} wählen`,
                id,
                [],
                { cardId: id, selectedServerId: targetServer.id },
              ),
            );
          }
        } else {
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
  }
  if (state.corp.clicks <= 0) {
    actions.push(buildCorpEndTurnAction(state));
    return actions;
  }
  if (state.corp.clicks >= 3 && totalCounters(state, "virus") > 0) {
    actions.push(buildCorpPurgeVirusAction(state));
  }
  if (state.corp.credits >= 4) {
    for (const server of state.corp.servers) {
      const count = spyCountersForServer(state, server.id);
      if (count <= 0) continue;
      actions.push(
        action(
          state,
          "corp",
          "trigger_ability",
          `Spy-Counter in ${server.label} entfernen`,
          "game_rule",
          [{ clicks: 1, credits: 4 }],
          {
            serverId: server.id,
            corpAbility: "remove_spy_counter",
            counterType: "spy",
            removedCounterAmount: 1,
          },
        ),
      );
    }
  }
  actions.push(buildCorpGainCreditAction(state));
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
    actions.push(buildCorpDrawAction(state));
  if (state.runner.tags > 0 && state.corp.credits >= 2) {
    for (const id of state.runner.rig.resources) {
      const hiddenResource = isConcealedRunnerResource(state, id);
      const resourceSlotId = hiddenResource
        ? hiddenRunnerResourceSlotId(id)
        : id;
      const definition = hiddenResource ? undefined : definitionFor(state, id);
      actions.push(
        action(
          state,
          "corp",
          "trash_resource",
          hiddenResource
            ? "Verdeckte Runner-Resource trashen"
            : `${definition?.title ?? "Resource"} trashen`,
          "basic_action",
          [{ clicks: 1, credits: 2 }],
          hiddenResource
            ? {
                cardId: resourceSlotId,
                resourceSlotId,
                hiddenResourceSlotId: resourceSlotId,
                hiddenRunnerResource: true,
                redactedKind: "hidden_runner_resource",
              }
            : { cardId: id, resourceId: id },
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
      if (
        corpUtilityImplementationForDefinition(definition.id)?.kind ===
        "power_grid_overload"
      ) {
        actions.push(...powerGridOverloadLegalActions(state, id, definition));
        continue;
      }
      if (definition.id === SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID) {
        actions.push(...systematicLayoffsLegalActions(state, id, definition));
        continue;
      }
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
      actions.push(buildCorpNewRemoteIceInstallAction(state, id));
      for (const server of state.corp.servers) {
        const {
          baseCost,
          additionalCost,
          reduction,
          reductionSourceDefinitionIds,
          increaseSourceDefinitionIds,
          totalCost,
        } =
          corpIceInstallTotalCost(state, id, server);
        if (state.corp.credits < totalCost) continue;
        actions.push(
          buildCorpServerIceInstallAction(
            state,
            id,
            server,
            {
              baseCost,
              additionalCost,
              reduction,
              ...(reductionSourceDefinitionIds
                ? { reductionSourceDefinitionIds }
                : {}),
              ...(increaseSourceDefinitionIds
                ? { increaseSourceDefinitionIds }
                : {}),
              totalCost,
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
      const rootRezOnInstall = rootInstallRezzesOnInstall(definition);
      const regionInstallCost = rootRezOnInstall
        ? rezCostForCard(state, id)
        : 0;
      if (state.corp.credits >= regionInstallCost) {
        actions.push(
          buildCorpNewRemoteRootInstallAction(state, id, regionInstallCost),
        );
      }
      for (const server of state.corp.servers) {
        if (
          canInstallCorpRootCardInServer(state, definition, server) &&
          state.corp.credits >= regionInstallCost
        ) {
          const replacesRegion =
            isRegionUpgrade(definition) &&
            corpRegionUpgradeIdsInServer(state, server).length > 0;
          const rootCapacity = corpRootAgendaOrNodeCapacityInServer(state, server);
          const replacesRootAsset =
            definition.type === "agenda" &&
            corpRootAssetIdsInServer(state, server).length > 0 &&
            corpRootMainCardIdsInServer(state, server).length >= rootCapacity;
          actions.push(
            buildCorpServerRootInstallAction(
              state,
              id,
              server,
              regionInstallCost,
              { replacesRootAsset, replacesRegion },
            ),
          );
        }
      }
    }
  }
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (isInstalledCorpCardAdvanceable(state, id, definition)) {
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
        (!isAcmeSavingsAndLoanDefinition(definition.id) ||
          corpAgendaPointTotal(state) >= 1)
      ) {
        const acmeRezCost =
          isAcmeSavingsAndLoanDefinition(definition.id)
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
  const corpTraceDamageAbilityActionsHost = corpTraceDamageAbilityHost(state);
  const corpSpecialDamageAbilityActionsHost = corpSpecialDamageAbilityHost(state);
  for (const assetId of rezzedCorpRootCardIds(state).sort()) {
    const definition = definitionFor(state, assetId);
    pushCorpTraceDamageOrCardImplementationActions(
      state,
      actions,
      assetId,
      corpTraceDamageAbilityActionsHost,
    );
    const specialDamageActions = buildCorpSpecialDamageAbilityActionsForCard(
      corpSpecialDamageAbilityActionsHost,
      assetId,
    );
    if (specialDamageActions.handled)
      actions.push(...specialDamageActions.actions);
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
    if (
      definition.id === CORP_HQ_SHUFFLE_DRAW_CARD_ID ||
      hasCorpUtilityKind(state, assetId, "rescheduler_hq_shuffle_draw")
    ) {
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
      definition.id === COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID ||
      hasCorpUtilityKind(state, assetId, "cowboy_sysop_uninstall_corp_card_to_hq")
    ) {
      for (const targetCardId of corpInstalledCardIds(state).sort()) {
        const targetDefinition = definitionFor(state, targetCardId);
        actions.push(
          action(
            state,
            "corp",
            "gain_credit",
            `${definition.title}: ${targetDefinition.title} nach HQ nehmen`,
            assetId,
            [{ clicks: 1 }],
            {
              cardId: assetId,
              v1951CorpUtilityAbility: "cowboy_sysop_uninstall_corp_card_to_hq",
              targetCardId,
            },
          ),
        );
      }
    }
    if (
      definition.id === DISINFECTANT_VIRUS_COUNTER_ASSET_ID &&
      !hasCorpUtilityKind(state, assetId, "disinfectant_avoid_virus_counter")
    ) {
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
      !cardImplementationForDefinitionId(definition.id) &&
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
    if (
      COUNTER_ASSET_CARD_IDS.has(definition.id) &&
      !cardImplementationForDefinitionId(definition.id)
    ) {
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
    if (
      definition.id === INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID &&
      !cardImplementationForDefinitionId(definition.id)
    ) {
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
    if (
      ACTION_ASSET_CARD_IDS.has(definition.id) &&
      !cardImplementationForDefinitionId(definition.id) &&
      uniqueDirectLongtailKindForDefinition(definition.id) !==
        "nevinyrral_action_and_lose_on_rezzed_leave"
    ) {
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
    const economyProfile = corpInstalledEconomyActionProfileForDefinition(
      definition.id,
    );
    if (!economyProfile) continue;
    const gainLabel =
      `${definition.title}: ${economyProfile.creditGain} Credits` +
      (economyProfile.trashSource ? " und trashen" : "");
    actions.push(
      action(
        state,
        "corp",
        "gain_credit",
        gainLabel,
        assetId,
        [
          {
            clicks: economyProfile.clickCost,
            ...(economyProfile.creditCost > 0
              ? { credits: economyProfile.creditCost }
              : {}),
          },
        ],
        corpInstalledEconomyActionPayload(economyProfile, assetId),
      ),
    );
  }
  const scoredAgendaAbilityActionsHost = scoredAgendaAbilityHost(state);
  const scoredAgendaTraceDamageAbilityActionsHost = corpTraceDamageAbilityHost(state);
  for (const agendaId of state.corp.scoreArea.slice().sort()) {
    const scoredAgendaAbilityActions = buildScoredAgendaAbilityActionsForCard(
      scoredAgendaAbilityActionsHost,
      agendaId,
    );
    if (scoredAgendaAbilityActions.handled) {
      actions.push(...scoredAgendaAbilityActions.actions);
      continue;
    }
    pushCorpTraceDamageOrCardImplementationActions(
      state,
      actions,
      agendaId,
      scoredAgendaTraceDamageAbilityActionsHost,
    );
  }
  actions.push(...specialZoneHarnessActions(state, "corp"));
  actions.push(buildCorpEndTurnAction(state));
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

function expireCorporateRetreatInstallCreditAbilities(state: GameState): void {
  for (const agendaId of state.corp.scoreArea) {
    const definition = definitionFor(state, agendaId);
    if (
      scoredAgendaKindForDefinition(definition) ===
      "corporate_retreat_disable_on_rez_or_install"
    )
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
        runnerMemoryLimit(state)
    );
  });
}

function installedRunnerProgramTrashOptionsForInstall(
  state: GameState,
): CardInstanceId[] {
  return state.runner.rig.programs.slice().sort();
}

function runnerProgramInstallMemoryReachableAfterTrash(
  state: GameState,
  definition: CardDefinition,
): boolean {
  const memoryCost = definition.memoryCost ?? 0;
  if (state.runner.memoryUsed + memoryCost <= runnerMemoryLimit(state))
    return true;
  const maximumFreedMemory = installedRunnerProgramTrashOptionsForInstall(
    state,
  ).reduce((sum, cardId) => {
    if (!runnerProgramUsesMemory(state, cardId)) return sum;
    return sum + (definitionFor(state, cardId).memoryCost ?? 0);
  }, 0);
  return (
    state.runner.memoryUsed + memoryCost - maximumFreedMemory <=
    runnerMemoryLimit(state)
  );
}

function shouldOfferRunnerProgramTrashBeforeInstall(
  state: GameState,
  definition: CardDefinition,
): boolean {
  return (
    definition.type === "program" &&
    installedRunnerProgramTrashOptionsForInstall(state).length > 0 &&
    runnerProgramInstallMemoryReachableAfterTrash(state, definition)
  );
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
    pushCardImplementationEndOfRunnerTurnActions(
      cardImplementationRuntimeDeps,
      state,
      actions,
    );
    actions.push(buildRunnerEndTurnAction(state));
    return actions;
  }
  if (valuPakProgramInstallActionsRemaining(state) > 0) {
    for (const id of runnerInstallableProgramIdsForValuPak(state)) {
      const definition = definitionFor(state, id);
      actions.push(
        buildRunnerValuPakInstallAction(state, {
          cardId: id,
          definition,
        }),
      );
    }
    pushCardImplementationEndOfRunnerTurnActions(
      cardImplementationRuntimeDeps,
      state,
      actions,
    );
    actions.push(buildRunnerValuPakSequenceEndAction(state));
    return actions;
  }
  if (hasClicks) {
    for (const sourceCardId of activeWilsonSourceIds(state)) {
      const used = flags.wilsonUsedSourceIdsThisTurn ?? [];
      if (!used.includes(sourceCardId)) {
        actions.push(
          action(
            state,
            "runner",
            "trigger_ability",
            "Wilson: Run-Aktion erhalten",
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              runnerAbility: "wilson_gain_run_action",
              sourceDefinitionId: definitionFor(state, sourceCardId).id,
              gainActionsAmount: 1,
              runSpendingCap: 3,
            },
          ),
        );
      }
    }
    actions.push(buildRunnerGainCreditAction(state));
    if (state.runner.stack.length > 0)
      actions.push(
        ...buildRunnerDrawCardActions(state, runnerDrawActionContext(state)),
      );
    if (state.runner.tags > 0 && availableRunnerTagRemovalCredits(state) >= 2) {
      actions.push(buildRunnerRemoveTagAction(state));
    }
    if (cardCounter(state, state.runner.identity, "crying") > 0 && state.runner.credits >= 2) {
      actions.push(
        action(
          state,
          "runner",
          "gain_credit",
          "Crying-Counter entfernen",
          state.runner.identity,
          [{ clicks: 1, credits: 2 }],
          {
            runnerAbility: "remove_crying_counter",
            cardId: state.runner.identity,
            counterType: "crying",
            removeCounterAmount: 1,
            counterRemoveCreditCost: 2,
            gainCreditsAmount: 0,
          },
        ),
      );
    }
    for (const counterEffect of runnerTraceCounterEffectDefinitions()) {
      if (counterEffect.counterType === "crying") continue;
      if (cardCounter(state, state.runner.identity, counterEffect.counterType) <= 0)
        continue;
      if (state.runner.credits < counterEffect.removeCost) continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${runnerCounterDisplayName(counterEffect.counterType)} entfernen`,
          state.runner.identity,
          [{ clicks: 1, credits: counterEffect.removeCost }],
          {
            cardId: state.runner.identity,
            runnerAbility: "remove_runner_trace_counter",
            sourceDefinitionId: counterEffect.sourceDefinitionId,
            counterType: counterEffect.counterType,
            removeCounterAmount: 1,
            counterRemoveCreditCost: counterEffect.removeCost,
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
        runnerMemoryLimit(state)
    ) {
      actions.push(buildRunnerProgramInstallAction(state, id, definition));
    }
    if (
      hasClicks &&
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >=
        (definition.installCost ?? 0) &&
      shouldOfferRunnerProgramTrashBeforeInstall(state, definition)
    ) {
      actions.push(
        buildRunnerProgramTrashBeforeInstallAction(state, id, definition),
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
            buildRunnerZetatechOverlayInstallAction(
              state,
              {
                cardId: id,
                definition,
                hostCardId: hostId,
                hostTitle: hostDefinition.title,
              },
            ),
          );
          continue;
        }
        if (!canHostProgramOnDaemon(state, hostId, definition)) continue;
        const hostDefinition = definitionFor(state, hostId);
        actions.push(
          buildRunnerHostedProgramInstallAction(
            state,
            {
              cardId: id,
              definition,
              hostCardId: hostId,
              hostTitle: hostDefinition.title,
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
      const installAgendaPointCost =
        cardImplementationAgendaPointInstallCost(definition);
      if (installAgendaPointCost > 0) {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (!forfeitAgendaId) continue;
        actions.push(
          buildRunnerAgendaPointInstallAction(state, {
            cardId: id,
            definition,
            installAgendaPointCost,
            forfeitAgendaCardId: forfeitAgendaId,
            targetRequirementId: "hardwareCard",
          }),
        );
        continue;
      }
      actions.push(buildRunnerHardwareInstallAction(state, id, definition));
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
      const installAgendaPointCost =
        cardImplementationAgendaPointInstallCost(definition);
      if (installAgendaPointCost > 0) {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (!forfeitAgendaId) continue;
        actions.push(
          buildRunnerAgendaPointInstallAction(state, {
            cardId: id,
            definition,
            installAgendaPointCost,
            forfeitAgendaCardId: forfeitAgendaId,
            targetRequirementId: "resourceCard",
          }),
        );
        continue;
      }
      if (requiresDataFortInstallTarget(definition)) {
        for (const server of state.corp.servers) {
          const serverLabel = serverChoiceDisplayLabel(state, server.id);
          actions.push(
            buildRunnerSelectedServerInstallAction(state, {
              cardId: id,
              definition,
              selectedServerId: server.id,
              selectedServerLabel: serverLabel,
            }),
          );
        }
        continue;
      }
      actions.push(buildRunnerResourceInstallAction(state, id, definition));
    }
    if (
      hasClicks &&
      definition.type === "event" &&
      state.runner.credits >= (definition.cost ?? 0)
    ) {
      const canPlayCardImplementation = canPlayPrintedCostOnPlayImplementation(
        cardImplementationRuntimeDeps,
        state,
        definition,
      );
      const resolver =
        cardImplementationRunnerEventResolver(definition) ??
        RUNNER_EVENT_RESOLVERS[definition.id];
      if (!resolver && !canPlayCardImplementation) continue;
      if (!canPlayCardImplementation && resolver?.canPlay && !resolver.canPlay(state))
        continue;
      if (!canPlayCardImplementation && resolver?.requiresServer) {
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
        const makeRunEffect = printedCostCardImplementationMakeRunEffect(definition);
        if (makeRunEffect?.target.kind === "central_server") {
          const server = mustServer(state, makeRunEffect.target.server);
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
          continue;
        }
        if (makeRunEffect?.target.kind === "chosen_server") {
          for (const server of state.corp.servers) {
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
          continue;
        }
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
        !cardImplementationForDefinitionId(definition.id) &&
        definition.id !== SELF_MODIFYING_CODE_ID &&
        (definition.id !== SHORT_CIRCUIT_RESOURCE_CARD_ID ||
          state.runner.credits >= 1) &&
        (definition.id === AUJOURD_OUI_RESOURCE_CARD_ID
          ? state.runner.stack.length > 0
          : state.runner.stack.some(
              (id) => definitionFor(state, id).type === "program",
            ))
      ) {
        actions.push(
          buildRunnerStackSearchProgramToGripAction(
            state,
            {
              cardId,
              definition,
              mode:
                definition.id === AUJOURD_OUI_RESOURCE_CARD_ID
                  ? "top5_programs"
                  : "stack_program",
              creditCost:
                definition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID ? 1 : 0,
            },
          ),
        );
      }
    if (
      SERVER_EXPOSE_PROGRAM_CARD_IDS.has(definition.id) &&
      !cardImplementationForDefinitionId(definition.id) &&
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
      pushActivatedCardImplementationActions(
        cardImplementationRuntimeDeps,
        state,
        actions,
        "runner",
        cardId,
        definition,
      );
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
        runnerUtilityLongtailKindForCard(state, cardId) ===
        "preying_mantis_optional_action_unpreventable_core_damage"
      ) {
        const used = new Set(
          ensureRunnerTurnFlags(state).preyingMantisUsedSourceIdsThisTurn ?? [],
        );
        if (!used.has(cardId)) {
          actions.push(
            action(
              state,
              "runner",
              "trigger_ability",
              `${definition.title}: Aktion gewinnen`,
              cardId,
              [],
              {
                cardId,
                runnerUtilityAbility: "preying_mantis_gain_action",
                gainedActions: 1,
              },
            ),
          );
        }
      }
      if (
        definition.id === STACK_TOP_REORDER_RESOURCE_CARD_ID &&
        !cardImplementationForDefinitionId(definition.id) &&
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
      const uniqueDirectLongtail =
        uniqueDirectLongtailImplementationForCard(state, resourceId);
      if (uniqueDirectLongtail?.kind === "databroker_agenda_point_credits") {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (forfeitAgendaId) {
          const agendaPointCost = uniqueDirectLongtail.agendaPointCost;
          const gainCreditsAmount = uniqueDirectLongtail.gainCredits;
          actions.push(
            action(
              state,
              "runner",
              "gain_credit",
              `${definition.title}: ${gainCreditsAmount} Credits (${agendaPointCost} Agenda-Punkt, trashen)`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "databroker",
                forfeitAgendaCardId: forfeitAgendaId,
                agendaPointCost,
                trashOnUse: true,
                gainCreditsAmount,
              },
            ),
          );
        }
      }
      if (
        definition.id === JUNKYARD_BBS_ID &&
        !cardImplementationForDefinitionId(definition.id) &&
        state.runner.credits >= 1
      ) {
        const targetCardId = topRunnerHeapCardId(state);
        if (targetCardId) {
          actions.push(
            action(
              state,
              "runner",
              "trigger_ability",
              `${definition.title}: oberste Heap-Karte in die Grip nehmen`,
              resourceId,
              [{ clicks: 1, credits: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "junkyard_bbs_return_top_heap",
                targetCardId,
                targetCardDefinitionId: definitionFor(state, targetCardId).id,
                sourceDefinitionId: JUNKYARD_BBS_ID,
                sourceZone: "heap",
                destinationZone: "grip",
                abilityFamily: "hidden-zone",
                effectKind: "hidden_zone",
              },
              {
                targetRequirements: [
                  {
                    id: "heapTopCard",
                    kind: "card",
                    side: "runner",
                    zoneScope: ["runner.heap"],
                    visibility: "public",
                  },
                ],
              },
            ),
          );
        }
      }
      if (definition.id === SHELL_TRADERS_ID) {
        for (const targetCardId of shellTradersPrepareTargetIds(state)) {
          const targetDefinition = definitionFor(state, targetCardId);
          const shellCounterAmount = shellTradersInstallCost(targetDefinition);
          actions.push(
            buildRunnerShellTradersSetAsideAction(state, {
              sourceCardId: resourceId,
              sourceTitle: definition.title,
              sourceDefinitionId: SHELL_TRADERS_ID,
              targetCardId,
              targetDefinition,
              shellCounterAmount,
            }),
          );
        }
        if (state.runner.credits >= 1) {
          for (const targetCardId of shellTradersPreparedTargetIds(state)) {
            const remainingCounters = cardCounter(state, targetCardId, "shell");
            actions.push(
              buildRunnerShellTradersRemoveCounterAction(state, {
                sourceCardId: resourceId,
                sourceTitle: definition.title,
                sourceDefinitionId: SHELL_TRADERS_ID,
                targetCardId,
                targetDefinitionId: definitionFor(state, targetCardId).id,
                remainingCountersBefore: remainingCounters,
              }),
            );
          }
        }
      }
      if (
        definition.id === DANSHIS_SECOND_ID &&
        state.runner.tags > 0 &&
        !cardImplementationForDefinitionId(definition.id)?.abilities?.some(
          (ability) => ability.kind === "activated",
        )
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
      Math.max(0, Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0)) > 0 &&
      !rovingRunBlocked &&
      (runStartTaxCredits === 0 ||
        availableRunnerRunStartCredits(state) >= runStartTaxCredits)
    ) {
      actions.push(
        action(
          state,
          "runner",
          "start_run",
          `Wilson-Run auf ${server.label}`,
          "basic_action",
          runCosts,
          {
            ...runPayload,
            wilsonRunOnlyAction: true,
            runSpendingCap: 3,
          },
        ),
      );
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
        `Run-Sperre für ${fangRunLockCreditCost} Credits entfernen`,
        "game_rule",
        [{ clicks: 1, credits: fangRunLockCreditCost }],
        {
          v1920RunnerRunLockAbility: "fang_2_0_pay_to_run",
          fangRunLockCreditCost,
          runnerRunLockCreditCost: fangRunLockCreditCost,
          gainCreditsAmount: 0,
        },
      ),
    );
  }
  actions.push(...specialZoneHarnessActions(state, "runner"));
  pushCardImplementationEndOfRunnerTurnActions(
    cardImplementationRuntimeDeps,
    state,
    actions,
  );
  actions.push(buildRunnerEndTurnAction(state));
  const wilsonRestrictedActions = Math.max(
    0,
    Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0),
  );
  if (wilsonRestrictedActions > 0 && state.runner.clicks <= wilsonRestrictedActions) {
    return actions.filter(
      (candidate) =>
        candidate.type === "end_turn" ||
        (candidate.type === "start_run" &&
          candidate.payload?.wilsonRunOnlyAction === true),
    );
  }
  return actions;
}

function runnerDrawActionContext(state: GameState): RunnerDrawActionContext {
  return {
    citySurveillanceSourceCount: citySurveillanceSourceIds(state).length,
    projectedDrawCount: activeCrashEverettSourceId(state) ? 2 : 1,
  };
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
  return (
    cardHasSubtype(definition, "unique") ||
    cardImplementationForDefinitionId(definition.id)?.unique?.kind ===
      "unique_by_title"
  );
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
  return Math.max(
    0,
    Math.floor(
      cardImplementationForDefinitionId(definition.id)?.hostedProgramCapacity
        ?.capacityMu ?? 0,
    ),
  );
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
  if (cardHasSubtype(programDefinition, "daemon")) return false;
  const hostInstance = mustInstance(state.cardInstances, hostId);
  if (hostInstance.hostedOn) return false;
  const hostDefinition = definitionFor(state, hostId);
  if (
    hostDefinition.type !== "program" ||
    !cardHasSubtype(hostDefinition, "daemon")
  )
    return false;
  const implementation = cardImplementationForDefinitionId(hostDefinition.id);
  if (
    implementation?.hostedProgramCapacity?.hostedProgramsAreInstalled !== true ||
    !implementation.hostedProgramCapacity.allowedCardTypes.includes("program")
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

function hostedProgramStrengthModifier(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const instance = state.cardInstances[cardId];
  if (!instance?.hostedOn) return 0;
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program" || !cardHasSubtype(definition, "icebreaker"))
    return 0;
  const hostDefinition = definitionFor(state, instance.hostedOn);
  const modifiers =
    cardImplementationForDefinitionId(hostDefinition.id)?.hostedProgramModifiers ??
    [];
  return modifiers.reduce((sum, modifier) => {
    if (
      modifier.appliesTo !== "hosted_icebreakers" ||
      modifier.kind !== "icebreaker_strength"
    )
      return sum;
    const amount = Math.max(0, Math.floor(modifier.amount));
    return sum + (modifier.operation === "reduce" ? -amount : amount);
  }, 0);
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
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  let bonus = 0;
  for (const agendaId of scoredCorpAgendaIds(state)) {
    const agendaDefinition = definitionFor(state, agendaId);
    const scoredAgenda = scoredAgendaImplementationForDefinition(agendaDefinition);
    if (scoredAgenda?.kind === "choose_fort_ice_strength_bonus") {
      if (
        iceServerId &&
        mustInstance(state.cardInstances, agendaId).selectedServerId === iceServerId
      )
        bonus += scoredAgenda.amount;
    }
  }
  bonus += iceStrengthModifierBonusFor(state, iceId);
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
  const pattelsReduction = cardCounter(state, iceId, "virus");
  const baseStrength =
    instance.proteusVariableIceState?.family === "x_strength" &&
    typeof instance.proteusVariableIceState.strength === "number"
      ? instance.proteusVariableIceState.strength
      : (definition.strength ?? 0);
  const total =
    baseStrength +
    instance.strengthModifier +
    iceStrengthBonusFor(state, iceId) +
    runEncounterBonus -
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

type BreakSubroutineCostBreakdown = {
  baseCost: number;
  legacyRunAdditionalCost: number;
  runnerHardwareAdditionalCost: number;
  cardImplementationAdditionalCost: number;
  additionalCost: number;
  totalCost: number;
  publicPayload: NonNullable<LegalAction["payload"]>;
};

function breakSubroutineCostBreakdown(
  state: GameState,
  baseCost: number,
  subroutineCount = 1,
): BreakSubroutineCostBreakdown {
  const run = mustRun(state);
  const encounteredIceId = run.encounteredIceId;
  if (!encounteredIceId)
    throw new Error("Break-Subroutine-Kosten brauchen ein encountered ICE.");
  const legacyRunAdditionalCost = runBreakSubroutineAdditionalCost(run);
  const runnerHardwareAdditionalCost =
    microtechTrodeSetBreakAdditionalCost(state);
  const cardImplementationQuote = quoteBreakSubroutineCostModifiers(
    state,
    encounteredIceId,
    subroutineCount,
  );
  const cardImplementationAdditionalCost =
    cardImplementationQuote.totalAdditionalCost;
  const additionalCost =
    legacyRunAdditionalCost +
    runnerHardwareAdditionalCost +
    cardImplementationAdditionalCost;
  const totalCost = baseCost + additionalCost;
  return {
    baseCost,
    legacyRunAdditionalCost,
    runnerHardwareAdditionalCost,
    cardImplementationAdditionalCost,
    additionalCost,
    totalCost,
    publicPayload: {
      breakSubroutineBaseCost: baseCost,
      ...(additionalCost > 0
        ? {
            breakSubroutineAdditionalCost: additionalCost,
            breakSubroutineTotalCost: totalCost,
            ...(legacyRunAdditionalCost > 0
              ? { v1922CorpIceAbility: "virizz_break_cost_modifier" }
              : {}),
            ...(runnerHardwareAdditionalCost > 0
              ? {
                  runnerHardwareAbility:
                    "microtech_trode_set_break_cost_modifier",
                }
              : {}),
            ...cardImplementationQuote.publicPayload,
          }
        : {}),
    },
  };
}

function hasInstalledMicrotechTrodeSet(state: GameState): boolean {
  return state.runner.rig.hardware.some(
    (cardId) => definitionFor(state, cardId).id === MICROTECH_TRODE_SET_ID,
  );
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

function virusCounterImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardVirusCounterImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.virusCounter;
}

function virusCounterImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardVirusCounterImplementation | undefined {
  return virusCounterImplementationForDefinition(definitionFor(state, cardId).id);
}

function corpUtilityImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardCorpUtilityImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.corpUtility;
}

function corpUtilityImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardCorpUtilityImplementation | undefined {
  return corpUtilityImplementationForDefinition(definitionFor(state, cardId).id);
}

function hasCorpUtilityKind(
  state: GameState,
  cardId: CardInstanceId,
  kind: CardCorpUtilityImplementation["kind"],
): boolean {
  return corpUtilityImplementationForCard(state, cardId)?.kind === kind;
}

function fortRunWindowImplementationsForDefinition(
  definitionId: CardDefinitionId,
): readonly CardFortRunWindowImplementation[] {
  return cardImplementationForDefinitionId(definitionId)?.fortRunWindows ?? [];
}

function hasFortRunWindowKind(
  state: GameState,
  cardId: CardInstanceId,
  kind: CardFortRunWindowImplementation["kind"],
): boolean {
  return fortRunWindowImplementationsForDefinition(
    definitionFor(state, cardId).id,
  ).some((window) => window.kind === kind);
}

function fortRunWindowImplementationForCard<
  K extends CardFortRunWindowImplementation["kind"],
>(
  state: GameState,
  cardId: CardInstanceId,
  kind: K,
): Extract<CardFortRunWindowImplementation, { kind: K }> | undefined {
  return fortRunWindowImplementationsForDefinition(
    definitionFor(state, cardId).id,
  ).find(
    (window): window is Extract<CardFortRunWindowImplementation, { kind: K }> =>
      window.kind === kind,
  );
}

function cardInstallCapabilitiesForDefinition(
  definitionId: CardDefinitionId,
) {
  return cardImplementationForDefinitionId(definitionId)?.installCapabilities ?? [];
}

function hasInstallCapabilityKindForDefinition(
  definitionId: CardDefinitionId,
  kind: NonNullable<
    ReturnType<typeof cardInstallCapabilitiesForDefinition>
  >[number]["kind"],
): boolean {
  return cardInstallCapabilitiesForDefinition(definitionId).some(
    (capability) => capability.kind === kind,
  );
}

function rootInstallRezzesOnInstall(definition: CardDefinition): boolean {
  return (
    isRegionUpgrade(definition) ||
    hasInstallCapabilityKindForDefinition(definition.id, "rez_on_install")
  );
}

function mustInstallInsideSubsidiaryDataFort(
  definition: CardDefinition,
): boolean {
  return hasInstallCapabilityKindForDefinition(
    definition.id,
    "install_only_inside_subsidiary_data_fort",
  );
}

function fortCapacityModifiersForCard(
  state: GameState,
  cardId: CardInstanceId,
) {
  return (
    cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.fortCapacityModifiers ?? []
  );
}

function leavePlayCleanupImplementationsForCard(
  state: GameState,
  cardId: CardInstanceId,
) {
  return (
    cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.leavePlayCleanup ?? []
  );
}

function runEncounterInterventionsForDefinition(
  definitionId: CardDefinitionId,
): readonly CardRunEncounterInterventionImplementation[] {
  return (
    cardImplementationForDefinitionId(definitionId)?.runEncounterInterventions ??
    []
  );
}

function hasRunEncounterInterventionKind(
  state: GameState,
  cardId: CardInstanceId,
  kind: CardRunEncounterInterventionImplementation["kind"],
): boolean {
  return runEncounterInterventionsForDefinition(
    definitionFor(state, cardId).id,
  ).some((intervention) => intervention.kind === kind);
}

function isFortIceSwapSource(state: GameState, cardId: CardInstanceId): boolean {
  return hasFortRunWindowKind(state, cardId, "swap_unrezzed_fort_ice_with_hq_ice");
}

function isAardvarkSource(state: GameState, cardId: CardInstanceId): boolean {
  return hasFortRunWindowKind(state, cardId, "aardvark_worm_lock_and_reaction");
}

function hasStealthPaymentBlockOnServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): boolean {
  return mustServer(state, serverId).root.some((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return (
      instance.rezzed &&
      hasFortRunWindowKind(
        state,
        cardId,
        "block_stealth_bits_during_runs_on_this_fort",
      )
    );
  });
}

function parisTracePoolImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
):
  | Extract<
      CardFortRunWindowImplementation,
      { kind: "corp_trace_bits_during_runs_on_this_fort" }
    >
  | undefined {
  return fortRunWindowImplementationForCard(
    state,
    cardId,
    "corp_trace_bits_during_runs_on_this_fort",
  );
}

function isParisTracePoolSource(state: GameState, cardId: CardInstanceId): boolean {
  return Boolean(parisTracePoolImplementationForCard(state, cardId));
}

function parisTracePoolCapacityForCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  return (
    parisTracePoolImplementationForCard(state, cardId)?.amount ??
    PARIS_CITY_GRID_TRACE_POOL_BITS
  );
}

function isRioPassRezzedIceSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return hasFortRunWindowKind(
    state,
    cardId,
    "roll_die_on_pass_rezzed_ice_on_same_fort",
  );
}

function isRovingRunRestrictionSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return hasFortRunWindowKind(
    state,
    cardId,
    "can_run_fort_only_if_last_corp_turn_activity_on_fort",
  );
}

function tokyoUnsuccessfulRunWindowForCard(
  state: GameState,
  cardId: CardInstanceId,
):
  | Extract<
      CardFortRunWindowImplementation,
      { kind: "gain_credits_after_unsuccessful_run_on_same_fort" }
    >
  | undefined {
  return fortRunWindowImplementationForCard(
    state,
    cardId,
    "gain_credits_after_unsuccessful_run_on_same_fort",
  );
}

function isTokyoUnsuccessfulRunSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return Boolean(tokyoUnsuccessfulRunWindowForCard(state, cardId));
}

function hasSuccessfulRunForceRezFollowup(
  definitionId: CardDefinitionId,
): boolean {
  return (
    cardImplementationForDefinitionId(definitionId)?.successfulRunFollowups?.some(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    ) ?? false
  );
}

function successfulRunForceRezFollowupCreditCost(
  definitionId: CardDefinitionId,
): number {
  const implementation =
    cardImplementationForDefinitionId(definitionId)?.successfulRunFollowups?.find(
      (followup) =>
        followup.kind === "force_rez_ice_outermost_inward_after_successful_run",
    );
  if (implementation?.kind !== "force_rez_ice_outermost_inward_after_successful_run")
    return 0;
  return implementation.cost.amount;
}

function installedRunnerVirusSourceIds(
  state: GameState,
  predicate?: (implementation: CardVirusCounterImplementation) => boolean,
): CardInstanceId[] {
  return state.runner.rig.programs
    .slice()
    .sort()
    .filter((cardId) => {
      const implementation = virusCounterImplementationForCard(state, cardId);
      return implementation !== undefined && (!predicate || predicate(implementation));
    });
}

function cockroachCounterTotal(state: GameState): number {
  const implementationTotal = Object.keys(state.cardInstances).reduce(
    (sum, cardId) => {
      const implementation = virusCounterImplementationForCard(state, cardId);
      if (
        implementation?.continuousEffect?.kind !==
        "randomize_corp_hq_discards_at_threshold"
      )
        return sum;
      return sum + cardCounter(state, cardId, "virus");
    },
    0,
  );
  return implementationTotal > 0
    ? implementationTotal
    : installedVirusCounterTotalForDefinition(state, COCKROACH_ID);
}

function incubatorCounterTotal(state: GameState): number {
  const implementationTotal = Object.keys(state.cardInstances).reduce(
    (sum, cardId) => {
      const implementation = virusCounterImplementationForCard(state, cardId);
      if (implementation?.startOfRunnerTurn?.kind !== "incubator_duplicate_virus_counter")
        return sum;
      return sum + cardCounter(state, cardId, "virus");
    },
    0,
  );
  return implementationTotal > 0
    ? implementationTotal
    : installedVirusCounterTotalForDefinition(state, INCUBATOR_ID);
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

function spyCountersForServer(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): number {
  return Math.max(0, Math.floor(state.spyCountersByServer?.[serverId] ?? 0));
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
  return poxInstallTax(state, serverId);
}

function corpIceInstallTotalCost(
  state: GameState,
  cardId: CardInstanceId,
  server: CorpServer,
): {
  baseCost: number;
  additionalCost: number;
  reduction: number;
  reductionSourceDefinitionIds?: string;
  increaseSourceDefinitionIds?: string;
  totalCost: number;
} {
  const additionalCost = corpIceInstallAdditionalCost(state, server.id);
  const quote = quoteCorpIceInstallCost(state, cardId, server, {
    additionalCredits: additionalCost,
  });
  return {
    baseCost: quote.baseCredits,
    additionalCost:
      typeof quote.publicPayload.iceInstallAdditionalCost === "number"
        ? quote.publicPayload.iceInstallAdditionalCost
        : additionalCost,
    reduction: quote.modifiers.reduce(
      (sum, modifier) =>
        modifier.kind === "reduction" ? sum + modifier.amount : sum,
      0,
    ),
    reductionSourceDefinitionIds: quote.modifiers
      .filter((modifier) => modifier.kind === "reduction")
      .map((modifier) => modifier.sourceDefinitionId)
      .join(","),
    increaseSourceDefinitionIds: quote.modifiers
      .filter((modifier) => modifier.kind === "increase")
      .map((modifier) => modifier.sourceDefinitionId)
      .join(","),
    totalCost: quote.finalCredits,
  };
}

function assertCorpIceInstallCostValid(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
  legalAction: LegalAction,
) {
  if (
    legalAction.side !== "corp" ||
    legalAction.type !== "install_card" ||
    legalAction.payload?.placement !== "ice"
  )
    return undefined;
  if (definition.type !== "ice")
    throw new Error("Corp-ICE-Installkosten gelten nur fuer ICE.");
  const serverId = legalAction.payload?.serverId;
  if (serverId === "new_remote") {
    if ((legalAction.costs[0]?.credits ?? 0) !== 0)
      throw new Error("Corp-ICE-Installkosten sind nicht mehr gueltig.");
    return undefined;
  }
  const server = mustServer(state, String(serverId));
  const additionalCost = corpIceInstallAdditionalCost(state, server.id);
  const quote = quoteCorpIceInstallCost(state, cardId, server, {
    additionalCredits: additionalCost,
  });
  if (!quote.canPay) throw new Error("Corp kann die Installkosten nicht zahlen.");
  if ((legalAction.costs[0]?.credits ?? 0) !== quote.finalCredits)
    throw new Error("Corp-ICE-Installkosten sind nicht mehr gueltig.");
  return quote;
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
  return !mustServer(state, run.attackedServerId).root.some((cardId) => {
    const instance = mustInstance(state.cardInstances, cardId);
    return instance.rezzed && isAardvarkSource(state, cardId);
  });
}

function shouldOpenAardvarkInterception(
  state: GameState,
  breakerId: CardInstanceId,
): boolean {
  const run = state.run;
  if (!run?.encounteredIceId || !isWormBreaker(state, breakerId)) return false;
  if (
    mustServer(state, run.attackedServerId).root.some((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return instance.rezzed && isAardvarkSource(state, cardId);
    })
  )
    return false;
  if (run.aardvarkInterceptionIceIds?.includes(run.encounteredIceId))
    return false;
  const aardvarkId = mustServer(state, run.attackedServerId)
    .root.slice()
    .sort()
    .find((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return !instance.rezzed && isAardvarkSource(state, cardId);
    });
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
  const aardvarkId = mustServer(state, run.attackedServerId)
    .root.slice()
    .sort()
    .find((cardId) => {
      const instance = mustInstance(state.cardInstances, cardId);
      return !instance.rezzed && isAardvarkSource(state, cardId);
    });
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
  const rezQuote = quoteCorpRezCost(state, run.approachedIceId);
  const rezCostReductionSourceDefinitionIds = rezQuote.modifiers.map(
    (modifier) => modifier.sourceDefinitionId,
  );
  if (!ice.rezzed && rezQuote.canPay) {
    const variableRezActions = proteusVariableIceRezActions(
      state,
      run.approachedIceId,
      definition,
      rezQuote.finalCredits,
      rezCostReductionSourceDefinitionIds,
    );
    if (variableRezActions.length > 0) {
      actions.push(...variableRezActions);
    } else {
      actions.push(
        action(
          state,
          "corp",
          "rez_ice",
          `${definition.title} rezzen`,
          run.approachedIceId,
          costQuoteToLegalActionCosts(rezQuote),
          costQuotePublicPayload(rezQuote),
        ),
      );
    }
  }
  if (
    !ice.rezzed &&
    definition.id !== PROTEUS_DIGICONDA_ID &&
    definition.id !== PROTEUS_FOOD_FIGHT_ID
  ) {
    for (const sourceId of oliviaSalazarRezSourcesForRunIce(
      state,
      run.approachedIceId,
    )) {
      const oliviaRezQuote = quoteCorpRezCost(state, run.approachedIceId, {
        oliviaSalazarSourceCardId: sourceId,
      });
      if (!oliviaRezQuote.canPay) continue;
      const oliviaRezCost = oliviaRezQuote.finalCredits;
      actions.push(
        action(
          state,
          "corp",
          "rez_ice",
          `Olivia Salazar: ${definition.title} für ${oliviaRezCost} ${oliviaRezCost === 1 ? "Credit" : "Credits"} rezzen`,
          run.approachedIceId,
          costQuoteToLegalActionCosts(oliviaRezQuote),
          costQuotePublicPayload(oliviaRezQuote),
        ),
      );
    }
  }
  actions.push(
    action(state, "corp", "decline_rez", "Nicht rezzen", "game_rule"),
  );
  return [...actions, ...corpRunRootRezActions(state)];
}

function proteusVariableIceRezActions(
  state: GameState,
  iceId: CardInstanceId,
  definition: CardDefinition,
  baseRezCost: number,
  rezCostReductionSourceDefinitionIds: string[],
): LegalAction[] {
  if (
    definition.id !== PROTEUS_DIGICONDA_ID &&
    definition.id !== PROTEUS_FOOD_FIGHT_ID
  )
    return [];
  const availableAdditionalCredits = state.corp.credits - baseRezCost;
  if (availableAdditionalCredits < 0) return [];
  if (definition.id === PROTEUS_DIGICONDA_ID) {
    const maxX = Math.min(6, availableAdditionalCredits);
    return Array.from({ length: maxX + 1 }, (_, x) => {
      const totalCost = baseRezCost + x;
      return action(
        state,
        "corp",
        "rez_ice",
        `${definition.title} mit X=${x} rezzen`,
        iceId,
        [{ credits: totalCost }],
        {
          cardId: iceId,
          proteusVariableRez: "x_strength",
          baseRezCost,
          variableRezAdditionalCost: x,
          variableRezValue: x,
          variableRezCap: 6,
          rezCostPaid: totalCost,
          effectiveStrengthAfterRez: x,
          ...(rezCostReductionSourceDefinitionIds.length > 0
            ? {
                rezCostReductionSourceDefinitionIds:
                  rezCostReductionSourceDefinitionIds.join(","),
                rezCostReductionAmount: (definition.rezCost ?? 0) - baseRezCost,
              }
            : {}),
        },
      );
    });
  }
  const maxSubroutineCount = Math.floor(availableAdditionalCredits / 2);
  return Array.from({ length: maxSubroutineCount + 1 }, (_, subroutineCount) => {
    const additionalCost = subroutineCount * 2;
    const totalCost = baseRezCost + additionalCost;
    return action(
      state,
      "corp",
      "rez_ice",
      `${definition.title} mit ${subroutineCount} ETR-Subroutinen rezzen`,
      iceId,
      [{ credits: totalCost }],
      {
        cardId: iceId,
        proteusVariableRez: "paid_etr_subroutines",
        baseRezCost,
        variableRezAdditionalCost: additionalCost,
        variableRezValue: subroutineCount,
        rezCostPaid: totalCost,
        effectiveSubroutineCountAfterRez: subroutineCount,
        ...(rezCostReductionSourceDefinitionIds.length > 0
          ? {
              rezCostReductionSourceDefinitionIds:
                rezCostReductionSourceDefinitionIds.join(","),
              rezCostReductionAmount: (definition.rezCost ?? 0) - baseRezCost,
            }
          : {}),
      },
    );
  });
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

function corpRunRootRezWindowActions(state: GameState): LegalAction[] {
  const actions = corpRunRootRezActions(state);
  if (actions.length === 0 || !isCorpRunRootRezWindowOpen(state)) return [];
  const run = mustRun(state);
  const server = mustServer(state, run.attackedServerId);
  return [
    ...actions,
    action(
      state,
      "corp",
      "decline_rez",
      "Nichts rezzen / Weiter",
      "game_rule",
      [],
      {
        runRootRezPass: true,
        serverId: server.id,
        serverLabel: server.label,
      },
    ),
  ];
}

function isCorpRunRootRezWindowOpen(state: GameState): boolean {
  if (state.timingPoint !== "run.jack_out_window") return false;
  const run = state.run;
  if (!run) return false;
  if (run.rootRezWindowPassedKeys?.includes(corpRunRootRezWindowKey(run)))
    return false;
  return corpRunRootRezActions(state).length > 0;
}

function corpRunRootRezWindowKey(run: ActiveRun): string {
  const position =
    run.position.kind === "ice"
      ? `ice:${run.position.serverId}:${run.position.iceIndex}`
      : `server:${run.position.serverId}`;
  return `${run.runId}:${position}`;
}

function passCorpRunRootRezWindow(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.timingPoint !== "run.jack_out_window")
    throw new Error("Root-Rez-Fenster ist nicht offen.");
  const run = mustRun(state);
  if (!isCorpRunRootRezWindowOpen(state))
    throw new Error("Root-Rez-Fenster wurde bereits geschlossen.");
  const server = mustServer(state, run.attackedServerId);
  const key = corpRunRootRezWindowKey(run);
  run.rootRezWindowPassedKeys = Array.from(
    new Set([...(run.rootRezWindowPassedKeys ?? []), key]),
  ).sort();
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runRootRezPass: true,
    serverId: server.id,
    serverLabel: server.label,
  };
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
      return instance.rezzed && isFortIceSwapSource(state, cardId);
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

function isApproachIceExposeViewingWindowOpen(state: GameState): boolean {
  return Boolean(
    state.timingPoint === "run.approach_ice" &&
    state.activeSide === "runner" &&
    state.run?.approachIceExposeViewingIceId &&
    state.run?.approachIceExposeViewingSourceCardId,
  );
}

function approachIceExposeCanBeOfferedForCurrentIce(state: GameState): boolean {
  const run = state.run;
  const approachedIceId = run?.approachedIceId;
  if (!run || !approachedIceId) return false;
  if (run.approachIceExposeViewingIceId) return false;
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
      const definition = definitionFor(state, cardId);
      if (
        hasRunEncounterInterventionKind(
          state,
          cardId,
          "approach_ice_expose_then_jack_out_before_rez",
        )
      )
        return true;
      if (cardImplementationForDefinitionId(definition.id)) return false;
      return definition.abilities?.some(
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
  const definition = definitionFor(state, sourceCardId);
  if (
    hasRunEncounterInterventionKind(
      state,
      sourceCardId,
      "approach_ice_expose_then_jack_out_before_rez",
    )
  )
    return `card_implementation.${definition.id}.approach_ice_expose`;
  const ability = definition.abilities?.find(
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
      `${definition.title}: ICE ansehen`,
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
      `${definitionFor(state, primarySource).title}: Ansehen überspringen`,
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

function runnerApproachIceExposeViewingActions(state: GameState): LegalAction[] {
  const run = mustRun(state);
  const sourceCardId = run.approachIceExposeViewingSourceCardId;
  const viewedIceId = run.approachIceExposeViewingIceId;
  if (!sourceCardId || !viewedIceId) return [];
  const definition = definitionFor(state, sourceCardId);
  return [
    action(
      state,
      "runner",
      "trigger_ability",
      `${definition.title}: Ansehen beenden`,
      sourceCardId,
      [],
      {
        cardId: sourceCardId,
        iceId: viewedIceId,
        approachIceExposeViewDecision: "finish",
      },
    ),
    action(
      state,
      "runner",
      "jack_out",
      "Jack-out",
      "game_rule",
      [],
      {
        cardId: sourceCardId,
        iceId: viewedIceId,
        approachIceExposeJackOut: true,
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
    .filter(
      (cardId) =>
        !cardImplementationForDefinitionId(definitionFor(state, cardId).id),
    )
    .map((cardId) =>
      buildRunnerSelfModifyingCodeInstallAction(state, cardId),
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
  actions.push(...runnerDuringRunCardImplementationActions(state));
  actions.push(...selfModifyingCodeEncounterActions(state));
  for (const breakerId of state.runner.rig.programs) {
    const breaker = definitionFor(state, breakerId);
    if (!runnerCanUseBreakerOnCurrentFort(state, breakerId)) continue;
    const breakerBaseStrength =
      typeof run.aiBoonRunStrengthByBreaker?.[breakerId] === "number"
        ? run.aiBoonRunStrengthByBreaker[breakerId]
        : breaker.id === AI_BOON_RANDOM_BREAKER_CARD_ID &&
            typeof run.aiBoonRunStrength === "number"
          ? run.aiBoonRunStrength
        : (breaker.strength ?? 0);
    const breakerStrength =
      breakerBaseStrength +
      mustInstance(state.cardInstances, breakerId).strengthModifier +
      hostedProgramStrengthModifier(state, breakerId) +
      cardCounter(state, breakerId, "militech") +
      dupreStrengthCounterBonus(state, breakerId) +
      runRemainderStrengthBonusForBreaker(run, breakerId);
    const breakerAbilities = icebreakerAbilitiesForDefinition(breaker);
    const breakAbilities = breakerAbilities.filter(
      (ability) =>
        ability.type === "break_subroutine" &&
        breakAbilityMatchesIce(ability, iceDefinition),
    );
    const hasEligibleBreakTarget = breakAbilities.some((ability) =>
      encounterSubroutines.some(
        (subroutine, index) =>
          breakAbilityMatchesSubroutine(ability, subroutine) &&
          !run.brokenSubroutineIndexes.includes(index) &&
          !run.resolvedSubroutineIndexes.includes(index),
      ),
    );
    const pump = breakerAbilities.find(
      (ability) => ability.type === "pump_strength",
    );
    if (
      pump &&
      !run.noBreakSubroutinesActive &&
      hasEligibleBreakTarget &&
      availableRunnerRunCredits(state, breakerId) >= pump.cost.credits
    ) {
      const variableStrength = pump.variableStrength;
      if (variableStrength) {
        const maxAmount = Math.max(
          0,
          Math.floor(availableRunnerRunCredits(state, breakerId)),
        );
        for (
          let amount = Math.max(1, Math.floor(variableStrength.min));
          amount <= maxAmount;
          amount += 1
        ) {
          actions.push(
            action(
              state,
              "runner",
              "pump_breaker",
              `${breaker.title}: Stärke +${amount}`,
              breakerId,
              [{ credits: amount }],
              {
                breakerId,
                iceId: encounteredIceId,
                pumpAmount: amount,
                futureActionDebtAdded: amount,
              },
              abilityMetadata(breakerId, pump.id, encounteredIceId),
            ),
          );
        }
      } else {
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
    }
    const canPayAtLeastOneBreakAbility = breakAbilities.some((ability) => {
      const cost = breakSubroutineCostBreakdown(state, ability.cost.credits, 1);
      return availableRunnerRunCredits(state, breakerId) >= cost.totalCost;
    });
    if (
      !run.noBreakSubroutinesActive &&
      breakAbilities.length > 0 &&
      breakerStrength >= encounteredIceStrength &&
      canPayAtLeastOneBreakAbility &&
      breakAbilities.every(
        (ability) =>
          breaker.id !== PILE_DRIVER_ID ||
          ability.postBreakStealthLossMode !== "total_if_available" ||
          runnerStealthRecurringCredits(state) >=
            (ability.postBreakStealthLoss ?? 0),
      )
    ) {
      const blinkUsedSubroutines =
        run.blinkUsedSubroutinesByBreakerThisEncounter?.[breakerId] ?? [];
      const subroutines = encounterSubroutines;
      if (breakAbilities.some((ability) => (ability.count ?? 1) > 1)) {
        const breakAbility = breakAbilities[0];
        if (!breakAbility) continue;
        actions.push(
          ...pileDriverBreakActions(
            state,
            breakerId,
            encounteredIceId,
            iceDefinition,
            subroutines,
            breakAbility,
          ),
        );
        continue;
      }
      subroutines.forEach((subroutine, index) => {
        if (breaker.id === BLINK_ID && blinkUsedSubroutines.includes(index))
          return;
        const breakAbility = breakAbilities.find((candidate) =>
          breakAbilityMatchesSubroutine(candidate, subroutine),
        );
        if (!breakAbility) return;
        const singleBreakCost = breakSubroutineCostBreakdown(
          state,
          breakAbility.cost.credits,
          1,
        );
        if (availableRunnerRunCredits(state, breakerId) < singleBreakCost.totalCost)
          return;
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
              [{ credits: singleBreakCost.totalCost }],
              {
                breakerId,
                iceId: encounteredIceId,
                subroutineIndex: index,
                subroutineId: subroutine.id,
                targetIceDefinitionId: iceDefinition.id,
                targetIceTitle: iceDefinition.title,
                ...dynamicSubroutinePayload(subroutine),
                ...(singleBreakCost?.publicPayload ?? {
                  breakSubroutineBaseCost: breakAbility.cost.credits,
                }),
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
  const nextSubroutineIndexes = encounterSubroutineIndexesForNextContinue(
    run,
    encounterSubroutines,
  );
  const willEndRun = nextSubroutines.some(
    (subroutine) =>
      subroutine.type === "end_the_run" ||
      subroutine.type === "end_the_run_unless_runner_pays",
  );
  const hardEndRun = nextSubroutines.some(
    (subroutine) => subroutine.type === "end_the_run",
  );
  const payOrEndRunEntries = nextSubroutineIndexes
    .map((index) => ({ index, subroutine: encounterSubroutines[index] }))
    .filter(
      (
        entry,
      ): entry is {
        index: number;
        subroutine: NonNullable<CardDefinition["subroutines"]>[number];
      } => entry.subroutine?.type === "end_the_run_unless_runner_pays",
    );
  const payOrEndRunAmount = payOrEndRunEntries.reduce(
    (sum, entry) => sum + Math.max(0, Math.floor(entry.subroutine.amount ?? 0)),
    0,
  );
  const encounterSubroutineIds = nextSubroutines
    .map((subroutine) => subroutine.id)
    .join(",");
  const continueLabel =
    nextSubroutines.length === 0
      ? "ICE passieren"
      : willEndRun
        ? "Subroutinen auslösen (Run endet)"
        : "Subroutinen auslösen";
  if (
    payOrEndRunAmount > 0 &&
    !hardEndRun &&
    availableRunnerRunCredits(state) >= payOrEndRunAmount
  ) {
    actions.push(
      action(
        state,
        "runner",
        "continue_run",
        `Subroutinen auslösen (Runner zahlt ${payOrEndRunAmount} Credit)`,
        "game_rule",
        [{ credits: payOrEndRunAmount }],
        {
          encounterContinue: true,
          sourceDefinitionId: iceDefinition.id,
          unbrokenSubroutineCount: nextSubroutines.length,
          encounterWillEndRun: false,
          encounterSubroutineIds,
          payOrEndRunSubroutineIndexes: payOrEndRunEntries
            .map((entry) => entry.index)
            .join(","),
          payOrEndRunSubroutinePayment: payOrEndRunAmount,
        },
      ),
    );
  }
  actions.push(
    action(state, "runner", "continue_run", continueLabel, "game_rule", [], {
      encounterContinue: true,
      sourceDefinitionId: iceDefinition.id,
      unbrokenSubroutineCount: nextSubroutines.length,
      encounterWillEndRun: willEndRun,
      encounterSubroutineIds,
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
  breakAbility: RuntimeIcebreakerAbility,
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
      const breakCost = breakSubroutineCostBreakdown(
        state,
        breakAbility.cost.credits,
        subroutineIndexes.length,
      );
      if (availableRunnerRunCredits(state, breakerId) < breakCost.totalCost)
        return;
      actions.push(
        action(
          state,
          "runner",
          "break_subroutine",
          label,
          breakerId,
          [{ credits: breakCost.totalCost }],
          {
            breakerId,
            iceId: encounteredIceId,
            subroutineIndexes: subroutineIndexes.join(","),
            breakSubroutineCount: subroutineIndexes.length,
            pileDriverMultiBreak: true,
            targetIceDefinitionId: iceDefinition.id,
            targetIceTitle: iceDefinition.title,
            ...breakCost.publicPayload,
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
  ability: RuntimeIcebreakerAbility,
  iceDefinition: CardDefinition,
): boolean {
  if (ability.type !== "break_subroutine") return false;
  if (
    ability.iceSubtype &&
    !iceDefinition.subtypes.includes(ability.iceSubtype)
  )
    return false;
  if (
    ability.iceSubtypes?.length &&
    !ability.iceSubtypes.some((subtype) =>
      iceDefinition.subtypes.includes(subtype),
    )
  )
    return false;
  return true;
}

function dupreStrengthCounterBonus(
  state: GameState,
  breakerId: CardInstanceId,
): number {
  if (!icebreakerHasSpecial(state, breakerId, "dupre_strength_counter_and_last_fort"))
    return 0;
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
  const payloadAmount = Number(legalAction.payload?.pumpAmount);
  if (Number.isInteger(payloadAmount) && payloadAmount >= 0)
    return payloadAmount;
  const breakerId = String(legalAction.payload?.breakerId ?? "");
  const abilityId = legalAction.abilityRef?.abilityId;
  const definition = state.cardInstances[breakerId]
    ? definitionFor(state, breakerId)
    : undefined;
  const ability = definition
    ? icebreakerAbilitiesForDefinition(definition).find(
        (candidate) =>
          candidate.type === "pump_strength" &&
          (!abilityId || candidate.id === abilityId),
      )
    : undefined;
  const amount = ability?.amount ?? 1;
  return Number.isInteger(amount) ? amount : 1;
}

function pumpAbilityForLegalAction(
  state: GameState,
  legalAction: LegalAction,
): RuntimeIcebreakerAbility | undefined {
  const breakerId = String(legalAction.payload?.breakerId ?? "");
  const abilityId = legalAction.abilityRef?.abilityId;
  const definition = state.cardInstances[breakerId]
    ? definitionFor(state, breakerId)
    : undefined;
  return definition
    ? icebreakerAbilitiesForDefinition(definition).find(
        (candidate) =>
          candidate.type === "pump_strength" &&
          (!abilityId || candidate.id === abilityId),
      )
    : undefined;
}

function breakAbilityForLegalAction(
  state: GameState,
  legalAction: LegalAction,
): RuntimeIcebreakerAbility | undefined {
  const breakerId = String(legalAction.payload?.breakerId ?? "");
  const abilityId = legalAction.abilityRef?.abilityId;
  const definition = state.cardInstances[breakerId]
    ? definitionFor(state, breakerId)
    : undefined;
  return definition
    ? icebreakerAbilitiesForDefinition(definition).find(
        (candidate) =>
          candidate.type === "break_subroutine" &&
          (!abilityId || candidate.id === abilityId),
      )
    : undefined;
}

function pumpDurationForLegalAction(
  state: GameState,
  legalAction: LegalAction,
): "current_encounter" | "current_run" {
  const breakerId = String(legalAction.payload?.breakerId ?? "");
  const abilityId = legalAction.abilityRef?.abilityId;
  const definition = state.cardInstances[breakerId]
    ? definitionFor(state, breakerId)
    : undefined;
  const ability = definition
    ? icebreakerAbilitiesForDefinition(definition).find(
        (candidate) =>
          candidate.type === "pump_strength" &&
          (!abilityId || candidate.id === abilityId),
      )
    : undefined;
  return ability?.strengthDuration ?? "current_encounter";
}

function breakAbilityMatchesSubroutine(
  ability: RuntimeIcebreakerAbility,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): boolean {
  const tags = ability.subroutineBreakTags ?? [];
  if (tags.length === 0) return true;
  if (tags.includes("trace") && subroutine.type === "initiate_trace") return true;
  const subroutineTags = subroutine.breakTags ?? [];
  return tags.some((tag) => subroutineTags.includes(tag));
}

function dynamicSubroutinePayload(
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): NonNullable<LegalAction["payload"]> {
  const attribution = dynamicSubroutineAttributionFor(subroutine);
  if (!attribution) return {};
  return {
    dynamicSourceDefinitionId: attribution.sourceDefinitionId,
    dynamicSourceTitle: attribution.sourceTitle,
    dynamicSourceKind: attribution.modifierKind,
    dynamicSubroutineKind: attribution.subroutineKind,
  };
}

function assertCurrentSubroutineMatchesLegalAction(
  state: GameState,
  iceDefinition: CardDefinition,
  subroutineIndex: number,
  legalAction: LegalAction,
): NonNullable<CardDefinition["subroutines"]>[number] {
  const subroutine = subroutinesForCurrentEncounter(
    state,
    iceDefinition,
  )[subroutineIndex];
  if (!subroutine) throw new Error("Subroutine existiert nicht mehr.");
  const expectedSubroutineId =
    typeof legalAction.payload?.subroutineId === "string"
      ? legalAction.payload.subroutineId
      : undefined;
  if (expectedSubroutineId && subroutine.id !== expectedSubroutineId)
    throw new Error("Subroutine-Ziel ist nicht mehr gueltig.");
  return subroutine;
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
    throw new Error("Der Icebreaker ist nicht installiert.");
  const breakerDefinition = definitionFor(state, breakerId);
  const iceDefinition = definitionFor(state, iceId);
  if (legalAction.payload?.targetIceDefinitionId !== iceDefinition.id)
    throw new Error("Pile Driver zielt auf die falsche ICE-Definition.");
  const ability = icebreakerAbilitiesForDefinition(breakerDefinition).find(
    (candidate) =>
      candidate.id === legalAction.abilityRef?.abilityId &&
      candidate.type === "break_subroutine",
  );
  if (!ability || !breakAbilityMatchesIce(ability, iceDefinition))
    throw new Error("Der Icebreaker hat keine gueltige Multi-Break-Faehigkeit.");
  const breakerStrength =
    (breakerDefinition.strength ?? 0) +
    mustInstance(state.cardInstances, breakerId).strengthModifier +
    hostedProgramStrengthModifier(state, breakerId) +
    cardCounter(state, breakerId, "militech") +
    dupreStrengthCounterBonus(state, breakerId) +
    runRemainderStrengthBonusForBreaker(run, breakerId);
  if (breakerStrength < iceStrengthFor(state, iceId))
    throw new Error("Der Icebreaker ist nicht stark genug fuer dieses ICE.");
  const rawIndexes =
    typeof legalAction.payload?.subroutineIndexes === "string"
      ? legalAction.payload.subroutineIndexes
      : "";
  if (!rawIndexes) throw new Error("Multi-Break braucht Subroutine-Ziele.");
  const subroutineIndexes = rawIndexes.split(",").map((value) => Number(value));
  if (
    subroutineIndexes.length < 1 ||
    subroutineIndexes.length > Math.min(4, ability.count ?? 4) ||
    new Set(subroutineIndexes).size !== subroutineIndexes.length ||
    subroutineIndexes.some((index) => !Number.isInteger(index) || index < 0)
  ) {
    throw new Error("Multi-Break hat ungueltige Subroutine-Ziele.");
  }
  const subroutines = subroutinesForCurrentEncounter(state, iceDefinition);
  for (const subroutineIndex of subroutineIndexes) {
    const subroutine = subroutines[subroutineIndex];
    if (!subroutine)
      throw new Error("Multi-Break zielt auf eine fehlende Subroutine.");
    if (!breakAbilityMatchesSubroutine(ability, subroutine))
      throw new Error("Multi-Break kann diese Subroutine nicht brechen.");
    if (
      run.brokenSubroutineIndexes.includes(subroutineIndex) ||
      run.resolvedSubroutineIndexes.includes(subroutineIndex)
    ) {
      throw new Error("Multi-Break zielt auf eine bereits erledigte Subroutine.");
    }
  }
  const stealthLoss = ability.postBreakStealthLoss ?? 0;
  if (runnerStealthRecurringCredits(state) < stealthLoss)
    throw new Error("Nicht genug Stealth-Credits fuer Multi-Break.");
  const expectedCost = breakSubroutineCostBreakdown(
    state,
    ability.cost.credits,
    subroutineIndexes.length,
  ).totalCost;
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
    sourceDefinitionId: breakerDefinition.id,
  };
  applyPostBreakStealthLoss(state, breakerId, legalAction);
}

function assertBreakSubroutineCostQuoteValid(
  state: GameState,
  breakerId: CardInstanceId | undefined,
  legalAction: LegalAction,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): void {
  if (!breakerId) throw new Error("Break-Subroutine-Quelle fehlt.");
  const run = mustRun(state);
  if (run.phase !== "encounter_ice" || !run.encounteredIceId)
    throw new Error("Subroutine kann nur im ICE-Encounter gebrochen werden.");
  if (!state.runner.rig.programs.includes(breakerId))
    throw new Error("Breaker ist nicht installiert.");
  const breakerDefinition = definitionFor(state, breakerId);
  const iceDefinition = definitionFor(state, run.encounteredIceId);
  const ability = icebreakerAbilitiesForDefinition(breakerDefinition).find(
    (candidate) =>
      candidate.id === legalAction.abilityRef?.abilityId &&
      candidate.type === "break_subroutine",
  );
  if (!ability || !breakAbilityMatchesIce(ability, iceDefinition))
    throw new Error("Breaker hat keine gueltige Break-Faehigkeit.");
  if (!breakAbilityMatchesSubroutine(ability, subroutine))
    throw new Error("Breaker kann diese Subroutine nicht brechen.");
  const expectedCost = breakSubroutineCostBreakdown(
    state,
    ability.cost.credits,
    1,
  ).totalCost;
  if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
    throw new Error("Break-Subroutine-Kosten sind nicht mehr gueltig.");
}

function subroutinesForCurrentEncounter(
  state: GameState,
  iceDefinition: CardDefinition,
): NonNullable<CardDefinition["subroutines"]> {
  const run = state.run;
  const transmutationCopies = run?.encounteredIceId
    ? cardCounter(state, run.encounteredIceId, "mark")
    : 0;
  const printedSubroutines =
    printedSubroutinesForCardImplementation(iceDefinition) ??
    iceDefinition.subroutines ??
    [];
  const subroutines = printedSubroutines.flatMap((subroutine) => {
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
  if (run?.encounteredIceId) {
    const variableIceState =
      state.cardInstances[run.encounteredIceId]?.proteusVariableIceState;
    if (variableIceState?.family === "paid_etr_subroutines") {
      const subroutineCount = Math.max(
        0,
        Math.floor(variableIceState.subroutineCount ?? 0),
      );
      for (let index = 0; index < subroutineCount; index += 1) {
        subroutines.push({
          id: `onr_proteus_022_food_fight_etr_${index + 1}`,
          type: "end_the_run",
        });
      }
    }
    subroutines.push(...additionalSubroutinesForIce(state, run.encounteredIceId));
  }
  return subroutines;
}

function encounterSubroutinesForNextContinue(
  run: RunState,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
): NonNullable<CardDefinition["subroutines"]> {
  return encounterSubroutineIndexesForNextContinue(run, subroutines).flatMap(
    (index) => {
      const subroutine = subroutines[index];
      return subroutine ? [subroutine] : [];
    },
  );
}

function encounterSubroutineIndexesForNextContinue(
  run: RunState,
  subroutines: NonNullable<CardDefinition["subroutines"]>,
): number[] {
  const indexes: number[] = [];
  for (let index = 0; index < subroutines.length; index += 1) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    )
      continue;
    indexes.push(index);
    if (subroutine.type === "initiate_trace") break;
  }
  return indexes;
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
  actions.push(...runnerDuringRunCardImplementationActions(state));
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
              ...(run.viral15ActiveSourceIceId
                ? {
                    sourceDefinitionId: definitionFor(
                      state,
                      run.viral15ActiveSourceIceId,
                    ).id,
                  }
                : {}),
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
    .filter(
      (cardId) =>
        !cardImplementationForDefinitionId(definitionFor(state, cardId).id),
    )
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

function runnerDuringRunCardImplementationActions(
  state: GameState,
): LegalAction[] {
  if (!state.run) return [];
  const actions: LegalAction[] = [];
  for (const cardId of runnerInstalledCardIds(state).slice().sort()) {
    const definition = definitionFor(state, cardId);
    pushActivatedCardImplementationActionsForTiming(
      cardImplementationRuntimeDeps,
      state,
      actions,
      "runner",
      cardId,
      definition,
      "during_run",
    );
  }
  return actions;
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
    .filter(
      (cardId) =>
        runnerUtilityLongtailKindForCard(state, cardId) ===
          "startup_immolator_trash_fully_broken_ice" ||
        definitionFor(state, cardId).id === STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID,
    )
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
  return (
    Math.max(0, Math.floor(run.jackOutAdditionalCostForRun ?? 0)) +
    (run.viral15ActiveSourceIceId ? 1 : 0)
  );
}

function clearEncounterTemporaryTraceCredits(
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const credits = run.encounterTemporaryTraceCredits;
  if (!credits) return;
  const returned = Math.max(0, Math.floor(credits.remaining ?? 0));
  delete run.encounterTemporaryTraceCredits;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      temporaryCreditsReturned: returned,
      temporaryTraceCreditsSourceDefinitionId: credits.sourceDefinitionId,
    };
  }
}

function runStartTaxForServerUpgrades(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
  const server = mustServer(state, serverId);
  const sourceDefinitionIds = server.root
    .filter((cardId) => mustInstance(state.cardInstances, cardId).rezzed)
    .map((cardId) => definitionFor(state, cardId).id)
    .filter(
      (definitionId) =>
        RUN_TAX_UPGRADE_CARD_IDS.has(definitionId) &&
        !cardImplementationForDefinitionId(definitionId),
    );
  return {
    amount: sourceDefinitionIds.length,
    sourceDefinitionIds,
  };
}

function newsgroupTauntingRunStartTax(
  state: GameState,
): { amount: number; sourceDefinitionIds: CardDefinitionId[] } {
  const sourceDefinitionIds = rezzedCorpRootCardIds(state)
    .filter(
      (cardId) =>
        definitionFor(state, cardId).id === NEWSGROUP_TAUNTING_TAG_HANDSIZE_ASSET_ID ||
        hasCorpUtilityKind(state, cardId, "newsgroup_taunting_run_start_tax"),
    )
    .map((cardId) => definitionFor(state, cardId).id);
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
    const forceRezFollowup =
      hasSuccessfulRunForceRezFollowup(definition.id) ||
      (!cardImplementationForDefinitionId(definition.id) &&
        definition.id === FALSE_ECHO_FORCE_REZ_PROGRAM_ID);
    if (forceRezFollowup) {
      const server = mustServer(state, run.attackedServerId);
      const unrezzedCount = server.ice.filter(
        (iceId) => !mustInstance(state.cardInstances, iceId).rezzed,
      ).length;
      if (unrezzedCount <= 0) continue;
      const abilityCost = successfulRunForceRezFollowupCreditCost(definition.id);
      if (state.runner.credits < abilityCost) continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${definition.title}: ICE rezzen lassen`,
          sourceCardId,
          abilityCost > 0 ? [{ credits: abilityCost }] : [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            v1922RunnerProgramAbility: "false_echo_force_rez",
            falseEchoCreditCost: abilityCost,
            unrezzedIceCount: unrezzedCount,
          },
        ),
      );
    }
    const successfulRunFollowups =
      cardImplementationForDefinitionId(definition.id)?.successfulRunFollowups ??
      [];
    if (
      successfulRunFollowups.some(
        (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
      ) ||
      (!cardImplementationForDefinitionId(definition.id) &&
        definition.id === NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID)
    ) {
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
    if (
      definition.id === FAIT_ACCOMPLI_COUNTER_PROGRAM_ID &&
      !cardImplementationForDefinitionId(definition.id)?.virusCounter
    ) {
      const server = mustServer(state, run.attackedServerId);
      if (server.kind !== "remote") continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${definition.title}: Remote mit Power-Counter markieren`,
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
    if (
      runnerUtilityLongtailKindForCard(state, sourceCardId) ===
      "i_spy_successful_run_fort_counter_expose"
    ) {
      const server = mustServer(state, run.attackedServerId);
      if (server.kind === "archives") continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${definition.title}: Spy-Counter platzieren`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            serverId: server.id,
            runnerUtilityAbility: "i_spy_put_spy_counter",
            counterType: "spy",
          },
        ),
      );
    }
  }
  return actions;
}

function spendRunnerAccessTrashCredits(
  state: GameState,
  amount: number,
  accessedCardId: CardInstanceId,
): { recurringSpent: number; runnerCreditsSpent: number } {
  if (amount <= 0) return { recurringSpent: 0, runnerCreditsSpent: 0 };
  const host = runnerAccessActionHost(state);
  if (availableRunnerAccessTrashCredits(host, accessedCardId) < amount)
    throw new Error("Der Runner kann die Trashkosten nicht bezahlen.");
  let remaining = amount;
  let recurringSpent = 0;
  for (const cardId of runnerAccessTrashRecurringCreditSourceIds(host, accessedCardId)) {
    if (remaining <= 0) break;
    const available = hostedPaymentCredits(state, cardId);
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendHostedPaymentCredits(state, cardId, spent);
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
    case "activated_card_ability":
      if (
        handleCorpTraceDamageActivatedAbility(
          corpTraceDamageAbilityHost(state, legalAction),
        ).handled
      )
        return;
      if (
        handleScoredAgendaActivatedAbilityAction(
          scoredAgendaAbilityHost(state, legalAction),
        ).handled
      )
        return;
      if (
        !resolveActivatedCardImplementationAbility(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
        )
      )
        throw new Error("Die aktivierte Kartenfaehigkeit ist nicht gueltig.");
      return;
    case "gain_credit":
      spendClick(state, legalAction.side);
      if (shouldOpenInvestmentFirmCreditChoice(state, legalAction)) {
        startInvestmentFirmCreditChoice(state, legalAction);
        return;
      }
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
        const cost = Number(legalAction.payload?.counterRemoveCreditCost ?? 2);
        if (!Number.isInteger(cost) || cost !== 2)
          throw new Error("Crying-Counter entfernen kostet genau 2 Credits.");
        spendCredits(state, "runner", cost);
        spendCardCounter(state, state.runner.identity, "crying", removeAmount);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          removedCounterAmount: removeAmount,
          remainingCounters: cardCounter(state, state.runner.identity, "crying"),
          runnerCreditsAfter: state.runner.credits,
        };
        return;
      }
      if (resolveCorpInstalledEconomyAction(state, legalAction)) {
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
        resolveReschedulerHqShuffleDraw(
          corpZoneChoiceHandlerHost(state, legalAction),
          sourceCardId,
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
        startCorpAssetRdTopReorderChoice(
          hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
          sourceCardId,
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
      if (
        legalAction.payload?.v1951CorpUtilityAbility ===
        "cowboy_sysop_uninstall_corp_card_to_hq"
      ) {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf Cowboy Sysop nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error("Cowboy Sysop ist nicht rezzed installiert.");
        if (
          !hasCorpUtilityKind(
            state,
            sourceCardId,
            "cowboy_sysop_uninstall_corp_card_to_hq",
          )
        )
          throw new Error("Die Cowboy-Sysop-Faehigkeit passt nicht zur Karte.");
        const targetCardId = String(legalAction.payload?.targetCardId ?? "");
        if (!corpInstalledCardIds(state).includes(targetCardId))
          throw new Error("Das Cowboy-Sysop-Ziel ist nicht mehr installiert.");
        const targetDefinitionId = definitionFor(state, targetCardId).id;
        const targetIdentityKnown = publicInstalledCorpCardIdentityKnown(
          state,
          targetCardId,
        );
        uninstallCorpInstalledCardToHq(state, targetCardId);
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "v1951_cowboy_sysop_uninstall_to_hq",
          movedCardCount: 1,
          ...(targetIdentityKnown ? { movedCardDefinitionId: targetDefinitionId } : {}),
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
      if (legalAction.payload?.v1918UpgradeAbility === "trace_2_tag") {
        if (legalAction.side !== "corp")
          throw new Error("Nur die Korp darf V1.9.18-City-Grid-Traces nutzen.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
          throw new Error(
            "Die V1.9.18-City-Grid-Trace-Faehigkeit ist nicht rezzed installiert.",
          );
        const definition = definitionFor(state, sourceCardId);
        if (
          definition.id !== PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID ||
          cardImplementationForDefinitionId(definition.id)
        )
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
        if (
          !TAG_CONDITION_UPGRADE_CARD_IDS.has(definition.id) ||
          cardImplementationForDefinitionId(definition.id)
        )
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
        handleCorpSpecialDamageAbilityAction(
          corpSpecialDamageAbilityHost(state, legalAction),
        ).handled
      )
        return;
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
        const implementation =
          uniqueDirectLongtailImplementationForCard(state, sourceCardId);
        if (implementation?.kind !== "databroker_agenda_point_credits")
          throw new Error("Die Databroker-Faehigkeit passt nicht zur Karte.");
        const agendaCost = Number(legalAction.payload?.agendaPointCost ?? 0);
        const expectedAgendaCost = implementation.agendaPointCost;
        if (!Number.isInteger(agendaCost) || agendaCost !== expectedAgendaCost)
          throw new Error("Der Databroker-Agenda-Kostenpfad ist ungueltig.");
        const forfeitAgendaCardId = String(
          legalAction.payload?.forfeitAgendaCardId ?? "",
        );
        forfeitRunnerAgendaForPointCost(state, forfeitAgendaCardId);
        if (legalAction.payload?.trashOnUse === true)
          trashRunnerInstalledCardToHeap(state, sourceCardId);
        const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 10);
        const expectedGainAmount = implementation.gainCredits;
        if (
          !Number.isInteger(gainAmount) ||
          gainAmount !== expectedGainAmount ||
          gainAmount <= 0
        )
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
      if (
        handleScoredAgendaActivatedAbilityAction(
          scoredAgendaAbilityHost(state, legalAction),
        ).handled
      ) {
        return;
      }
      if (
        legalAction.payload?.v1920RunnerRunLockAbility ===
        "fang_2_0_pay_to_run"
      ) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf die Run-Sperre entfernen.");
        const cost = Number(legalAction.payload?.fangRunLockCreditCost ?? 0);
        const pendingCost = Math.max(
          0,
          Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
        );
        if (!Number.isInteger(cost) || cost <= 0 || cost !== pendingCost)
          throw new Error("Die Run-Sperre verlangt den aktuellen Betrag.");
        spendCredits(state, "runner", cost);
        ensureRunnerTurnFlags(state).fangRunLockCreditCost = 0;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          fangRunLockCleared: true,
          runnerRunLockCleared: true,
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
          drawRunnerCards(state, 1),
        );
      }
      return;
    case "draw_card":
      spendClick(state, legalAction.side);
      if (legalAction.side === "runner") {
        applyRunnerDrawSummaryPayload(
          state,
          legalAction,
          drawRunnerCards(
            state,
            1,
            citySurveillanceDrawDecisionFromPayload(legalAction),
          ),
        );
      } else {
        drawCorpCard(state);
      }
      return;
    case "play_event":
      playRunnerEvent(state, legalAction);
      return;
    case "play_operation":
      if (!legalAction.payload?.cardId)
        throw new Error("Die Operation hat keine gueltige Karte.");
      {
        const cardId = String(legalAction.payload.cardId);
        const definition = definitionFor(state, cardId);
        if (!canPlayCorpOperation(state, definition))
          throw new Error("Diese Operation ist im aktuellen Zustand nicht spielbar.");
      }
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
      scoreAgenda(
        scoredAgendaFlowHost(state, legalAction),
        String(legalAction.payload?.cardId) as CardInstanceId,
      );
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
      if (legalAction.payload?.wilsonRunOnlyAction === true) {
        const flags = ensureRunnerTurnFlags(state);
        const remaining = Math.max(
          0,
          Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0),
        );
        if (remaining <= 0)
          throw new Error("Es ist keine Wilson-Run-Aktion verfuegbar.");
        flags.wilsonRunOnlyActionsRemaining = remaining - 1;
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
      if (legalAction.payload?.wilsonRunOnlyAction === true && state.run) {
        const sourceCardId = activeWilsonSourceIds(state)[0];
        state.run.wilsonRunSpendingCap = {
          sourceCardInstanceId: sourceCardId ?? ("" as CardInstanceId),
          limit: 3,
          spent: 0,
        };
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          runSpendingCap: 3,
          runSpendingCapSpent: 0,
          wilsonRunSpendingCapActive: true,
        };
      }
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
        const run = state.run;
        const serverLabel = run ? publicServerLabel(state, run.attackedServerId) : undefined;
        const reachedServerBeforeAccess = run?.position.kind === "server";
        const jackOutPayload = {
          ...(legalAction.payload ?? {}),
          ...(serverLabel ? { serverLabel } : {}),
          ...(reachedServerBeforeAccess ? { jackOutBeforeAccess: true } : {}),
        };
        if (jackOutAdditionalCost > 0) {
          spendRunnerRunCredits(state, jackOutAdditionalCost);
          legalAction.payload = {
            ...jackOutPayload,
            jackOutAdditionalCost,
            runnerCreditsAfter: state.runner.credits,
          };
        } else {
          legalAction.payload = jackOutPayload;
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
      if (legalAction.payload?.runRootRezPass === true) {
        passCorpRunRootRezWindow(state, legalAction);
        return;
      }
      passApproachedIce(state);
      return;
    case "pump_breaker":
      {
        const breakerId =
          typeof legalAction.payload?.breakerId === "string"
            ? (String(legalAction.payload.breakerId) as CardInstanceId)
            : undefined;
        const pumpAbility = pumpAbilityForLegalAction(state, legalAction);
        const pumpAmount = pumpAmountForLegalAction(state, legalAction);
        const isVariablePump =
          pumpAbility?.variableStrength !== undefined ||
          legalAction.payload?.pumpAmount !== undefined;
        if (isVariablePump) {
          const expectedCost = pumpAmount;
          if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
            throw new Error("Variable Icebreaker-Pump-Kosten sind nicht mehr gueltig.");
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
            "pump_breaker",
            legalAction,
          );
          return;
        }
        if (
          breakerId &&
          pumpDurationForLegalAction(state, legalAction) === "current_run" &&
          state.run
        ) {
          const run = mustRun(state);
          const previous = runRemainderStrengthBonusForBreaker(run, breakerId);
          run.remainderStrengthBonusByBreaker = {
            ...(run.remainderStrengthBonusByBreaker ?? {}),
            [breakerId]: previous + pumpAmount,
          };
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            runRemainderStrengthBonusApplied: true,
            runRemainderStrengthBonusAfter: previous + pumpAmount,
          };
          if (pumpAbility?.onUseEndRun) finishRun(state, false, legalAction);
          return;
        }
        if (breakerId && isVariablePump) {
          executeEffectCommands(state, [
            { type: "change_breaker_strength", breakerId, amount: pumpAmount },
          ]);
          addRunnerFutureActionDebt(state, pumpAmount);
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
            futureActionDebtAdded: pumpAmount,
            futureActionDebtPending: pendingDebt,
            breakerStrengthAfter:
              (definitionFor(state, breakerId).strength ?? 0) +
              mustInstance(state.cardInstances, breakerId).strengthModifier,
          };
          if (pumpAbility?.onUseEndRun) finishRun(state, false, legalAction);
          return;
        }
        executeEffectCommands(state, [
          {
            type: "change_breaker_strength",
            breakerId: String(legalAction.payload?.breakerId),
            amount: pumpAmount,
          },
        ]);
        if (breakerId && pumpAbility?.onUseEndRun) finishRun(state, false, legalAction);
      }
      return;
    case "break_subroutine": {
      const breakerId =
        typeof legalAction.payload?.breakerId === "string"
          ? (String(legalAction.payload.breakerId) as CardInstanceId)
          : undefined;
      const breakAbility = breakAbilityForLegalAction(state, legalAction);
      if (
        breakerId &&
        (breakAbility?.count ?? 1) > 1 &&
        typeof legalAction.payload?.subroutineIndexes === "string"
      ) {
        resolvePileDriverBreakSubroutinesAction(state, breakerId, legalAction);
        recordBartmossEncounterUsage(state, breakerId);
        recordDupreBreakUsage(state, breakerId);
        recordSnowballBreakUsage(state, breakerId);
        if (breakAbility?.onUseEndRun) finishRun(state, false, legalAction);
        return;
      }
      if (!state.run?.encounteredIceId)
        throw new Error("Subroutine kann nur im ICE-Encounter gebrochen werden.");
      if (state.run.noBreakSubroutinesActive)
        throw new Error("Subroutinen koennen in diesem Encounter nicht gebrochen werden.");
      const iceDefinition = definitionFor(state, state.run.encounteredIceId);
      const currentSubroutine = assertCurrentSubroutineMatchesLegalAction(
        state,
        iceDefinition,
        Number(legalAction.payload?.subroutineIndex),
        legalAction,
      );
      assertBreakSubroutineCostQuoteValid(
        state,
        breakerId,
        legalAction,
        currentSubroutine,
      );
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
        if (breakAbility?.special === "blink_random_break_or_net_damage") {
          resolveBlinkBreakSubroutineAction(
            state,
            breakerId,
            Number(legalAction.payload?.subroutineIndex),
            legalAction,
          );
          if (breakAbility.onUseEndRun) finishRun(state, false, legalAction);
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
        recordSnowballBreakUsage(state, breakerId);
        if (breakAbility?.onUseEndRun) finishRun(state, false, legalAction);
      }
      return;
    }
    case "continue_run":
      continueRun(state, legalAction);
      return;
    case "access_card":
    case "steal_agenda":
    case "trash_accessed_card":
      if (handleAccessExecution(accessFlowHost(state), legalAction).handled)
        return;
      throw new Error("Die Access-Aktion ist nicht gueltig.");
    case "trash_resource":
      trashResource(
        state,
        String(
          legalAction.payload?.resourceId ?? legalAction.payload?.cardId ?? "",
        ),
        legalAction,
      );
      return;
    case "decline_trash":
      if (handleAccessExecution(accessFlowHost(state), legalAction).handled)
        return;
      throw new Error("Die Access-Aktion ist nicht gueltig.");
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
        handleMysteryBoxTopFiveProgramInstallActivation(
          hiddenZoneSearchActivationHandlerHost(state, legalAction),
        );
        return;
      }
      if (
        legalAction.payload?.v1922RunnerHardwareAbility ===
        "microtech_backup_drive_return_top_hosted"
      ) {
        resolveMicrotechBackupDriveReturnTopHosted(state, legalAction);
        return;
      }
      if (legalAction.payload?.runnerUtilityAbility === "preying_mantis_gain_action") {
        resolvePreyingMantisGainAction(state, legalAction);
        return;
      }
      if (legalAction.payload?.runnerUtilityAbility === "i_spy_put_spy_counter") {
        resolveISpyPutSpyCounter(state, legalAction);
        return;
      }
      if (legalAction.payload?.corpAbility === "remove_spy_counter") {
        resolveCorpRemoveSpyCounter(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.resourceAbility ===
        "junkyard_bbs_return_top_heap"
      ) {
        resolveJunkyardBbsAbility(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.shellTradersAbility === "set_aside_from_grip"
      ) {
        resolveShellTradersSetAside(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.shellTradersAbility === "remove_shell_counter"
      ) {
        resolveShellTradersRemoveCounter(state, legalAction);
        return;
      }
      if (legalAction.payload?.runnerAbility === "wilson_gain_run_action") {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf Wilson nutzen.");
        if (state.phase !== "runner_action_phase" || state.activeSide !== "runner")
          throw new Error("Wilson ist nur im Runner-Zug nutzbar.");
        const sourceCardId = String(legalAction.payload?.cardId ?? "");
        if (
          !state.runner.rig.resources.includes(sourceCardId as CardInstanceId) ||
          remainingReplacementLongtailKindForCard(
            state,
            sourceCardId as CardInstanceId,
          ) !== "wilson_run_action_spending_cap"
        )
          throw new Error("Wilson ist nicht installiert.");
        const flags = ensureRunnerTurnFlags(state);
        const used = flags.wilsonUsedSourceIdsThisTurn ?? [];
        if (used.includes(sourceCardId as CardInstanceId))
          throw new Error("Wilson wurde diesen Zug bereits genutzt.");
        flags.wilsonUsedSourceIdsThisTurn = [
          ...used,
          sourceCardId as CardInstanceId,
        ];
        flags.wilsonRunOnlyActionsRemaining =
          Math.max(0, Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0)) + 1;
        state.runner.clicks += 1;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          wilsonRunOnlyActionsRemaining: flags.wilsonRunOnlyActionsRemaining,
          runnerClicksAfter: state.runner.clicks,
        };
        return;
      }
      if (legalAction.payload?.runnerAbility === "remove_runner_trace_counter") {
        resolveRemoveRunnerTraceCounter(state, legalAction);
        return;
      }
      if (
        legalAction.payload?.v1920RunnerRunLockAbility ===
        "fang_2_0_pay_to_run"
      ) {
        if (legalAction.side !== "runner")
          throw new Error("Nur der Runner darf die Run-Sperre entfernen.");
        spendClick(state, "runner");
        const cost = Number(legalAction.payload?.fangRunLockCreditCost ?? 0);
        const pendingCost = Math.max(
          0,
          Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
        );
        if (!Number.isInteger(cost) || cost <= 0 || cost !== pendingCost)
          throw new Error("Die Run-Sperre verlangt den aktuellen Betrag.");
        spendCredits(state, "runner", cost);
        ensureRunnerTurnFlags(state).fangRunLockCreditCost = 0;
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          fangRunLockCleared: true,
          runnerRunLockCleared: true,
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
          acmeDebtActive: acmeSavingsAndLoanObligationCount(state) > 0,
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
      if (legalAction.payload?.approachIceExposeViewDecision) {
        resolveApproachIceExposeViewingDecision(state, legalAction);
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

function topRunnerHeapCardId(state: GameState): CardInstanceId | undefined {
  return state.runner.heap.at(-1);
}

function resolveJunkyardBbsAbility(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Junkyard BBS nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Junkyard BBS ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== JUNKYARD_BBS_ID)
    throw new Error("Die Junkyard-BBS-Faehigkeit passt nicht zur Karte.");
  if (
    clickCostForAction(legalAction) !== 1 ||
    creditCostForAction(legalAction) !== 1
  )
    throw new Error("Junkyard BBS verlangt genau 1 Klick und 1 Credit.");

  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  const currentTopCardId = topRunnerHeapCardId(state);
  if (!targetCardId || !currentTopCardId || targetCardId !== currentTopCardId)
    throw new Error("Die Zielkarte ist nicht die oberste Karte im Heap.");
  if (!state.runner.heap.includes(targetCardId))
    throw new Error("Die Junkyard-BBS-Zielkarte liegt nicht im Heap.");
  const targetDefinition = definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Junkyard-BBS-Zielkarte hat sich geaendert.");

  spendClick(state, "runner");
  spendCredits(state, "runner", 1);
  state.runner.heap = state.runner.heap.filter((id) => id !== targetCardId);
  state.runner.grip.unshift(targetCardId);
  state.cardInstances[targetCardId] = {
    ...mustInstance(state.cardInstances, targetCardId),
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: JUNKYARD_BBS_ID,
    targetCardDefinitionId: targetDefinition.id,
    returnedCardDefinitionId: targetDefinition.id,
    returnedCount: 1,
    sourceZone: "heap",
    destinationZone: "grip",
    returnedToGrip: true,
    runnerCreditsAfter: state.runner.credits,
  };
}

function shellTradersInstallCost(definition: CardDefinition): number {
  const value = Number(definition.installCost ?? 0);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0)
    throw new Error("Shell-Traders-Installationskosten sind ungueltig.");
  return value;
}

function shellTradersPrepareTargetIds(state: GameState): CardInstanceId[] {
  return state.runner.grip
    .filter((cardId) => shellTradersCanPrepareTarget(state, cardId))
    .sort();
}

function shellTradersCanPrepareTarget(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  if (!state.runner.grip.includes(cardId)) return false;
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program" && definition.type !== "hardware")
    return false;
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    return false;
  if (
    definition.type === "program" &&
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      runnerMemoryLimit(state)
  )
    return false;
  return true;
}

function shellTradersPreparedTargetIds(state: GameState): CardInstanceId[] {
  return (state.specialZones?.setAside ?? [])
    .filter((cardId) => {
      const instance = state.cardInstances[cardId];
      if (!instance) return false;
      if (instance.owner !== "runner" || instance.zone.side !== "special")
        return false;
      if (instance.zone.zone !== "set_aside") return false;
      if (instance.zone.visibility !== "public") return false;
      if (cardCounter(state, cardId, "shell") <= 0) return false;
      const definition = definitionFor(state, cardId);
      return definition.type === "program" || definition.type === "hardware";
    })
    .sort();
}

function resolveShellTradersSetAside(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf The Shell Traders nutzen.");
  if (state.phase !== "runner_action_phase")
    throw new Error("The Shell Traders darf nur im Runner-Zug genutzt werden.");
  if (
    clickCostForAction(legalAction) !== 1 ||
    creditCostForAction(legalAction) !== 0
  )
    throw new Error("The Shell Traders verlangt genau 1 Klick.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("The Shell Traders ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== SHELL_TRADERS_ID)
    throw new Error("Die Shell-Traders-Faehigkeit passt nicht zur Karte.");
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  if (!shellTradersCanPrepareTarget(state, targetCardId))
    throw new Error("The Shell Traders hat kein gueltiges Ziel.");
  const targetDefinition = definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Shell-Traders-Zielkarte hat sich geaendert.");
  const shellCounterAmount = shellTradersInstallCost(targetDefinition);
  const payloadCounterAmount = Number(
    legalAction.payload?.shellCounterAmount ?? shellCounterAmount,
  );
  if (
    !Number.isInteger(payloadCounterAmount) ||
    payloadCounterAmount !== shellCounterAmount
  )
    throw new Error("Die Shell-Counter-Anzahl passt nicht mehr zum Ziel.");

  spendClick(state, "runner");
  removeFromAllZones(state, targetCardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.setAside.push(targetCardId);
  specialZones.setAside.sort();
  state.cardInstances[targetCardId] = {
    ...mustInstance(state.cardInstances, targetCardId),
    faceup: true,
    rezzed: true,
    zone: {
      side: "special",
      zone: "set_aside",
      visibility: "public",
      returnZone: { side: "runner", zone: "rig" },
    },
  };
  setCardCounter(state, targetCardId, "shell", shellCounterAmount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "shell_traders_set_aside",
    sourceDefinitionId: SHELL_TRADERS_ID,
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    addedCounterAmount: shellCounterAmount,
    shellCounterAmount,
    remainingCounters: shellCounterAmount,
    specialZone: "set_aside",
    specialZoneVisibility: "public",
  };
}

function resolveShellTradersRemoveCounter(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf The Shell Traders nutzen.");
  if (state.phase !== "runner_action_phase")
    throw new Error("The Shell Traders darf nur im Runner-Zug genutzt werden.");
  if (
    clickCostForAction(legalAction) !== 0 ||
    creditCostForAction(legalAction) !== 1
  )
    throw new Error("Shell-Counter entfernen kostet genau 1 Credit.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("The Shell Traders ist nicht installiert.");
  if (definitionFor(state, sourceCardId).id !== SHELL_TRADERS_ID)
    throw new Error("Die Shell-Traders-Faehigkeit passt nicht zur Karte.");
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  if (!shellTradersPreparedTargetIds(state).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht vorbereitet.");
  const targetDefinition = definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Shell-Traders-Zielkarte hat sich geaendert.");

  spendCredits(state, "runner", 1);
  const result = removeShellCounterAndMaybeInstall(
    state,
    targetCardId,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: SHELL_TRADERS_ID,
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    removedCounterAmount: 1,
    remainingCounters: result.remainingCounters,
    shellTradersInstalledTarget: result.installed,
    runnerCreditsAfter: state.runner.credits,
  };
}

function removeShellCounterAndMaybeInstall(
  state: GameState,
  targetCardId: CardInstanceId,
): { remainingCounters: number; installed: boolean } {
  if (!shellTradersPreparedTargetIds(state).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht vorbereitet.");
  spendCardCounter(state, targetCardId, "shell", 1);
  const remainingCounters = cardCounter(state, targetCardId, "shell");
  if (remainingCounters > 0)
    return { remainingCounters, installed: false };
  installShellTradersPreparedCardForFree(state, targetCardId);
  return { remainingCounters, installed: true };
}

function installShellTradersPreparedCardForFree(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const definition = definitionFor(state, cardId);
  const instance = mustInstance(state.cardInstances, cardId);
  if (
    instance.owner !== "runner" ||
    instance.zone.side !== "special" ||
    instance.zone.zone !== "set_aside"
  )
    throw new Error("The Shell Traders kann nur vorbereitete Runner-Karten installieren.");
  if (definition.type !== "program" && definition.type !== "hardware")
    throw new Error("The Shell Traders installiert nur Programme oder Hardware.");
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (
    definition.type === "program" &&
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      runnerMemoryLimit(state)
  )
    throw new Error("Nicht genug Memory fuer The Shell Traders.");

  removeFromAllZones(state, cardId);
  if (definition.type === "program") {
    state.runner.rig.programs.push(cardId);
    state.runner.memoryUsed += definition.memoryCost ?? 0;
  } else {
    state.runner.rig.hardware.push(cardId);
    if (!hasCardImplementationMemoryUnitModifier(definition)) {
      if (definition.mechanics.includes("modify_memory_limit"))
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
      else if ((definition.memoryLimitBonus ?? 0) > 0)
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 0;
    }
  }
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
  };
  setCardCounter(state, cardId, "shell", 0);
  if (shouldLoadLegacyRecurringCredits(definition))
    setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
  if (
    definition.type === "program" &&
    definition.mechanics.includes("virus") &&
    definition.id !== BUTCHER_BOY_ID &&
    definition.id !== SKIVVISS_ID
  )
    addCardCounter(state, cardId, "virus", 1);
}

function applyShellTradersStartOfTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const flags = ensureRunnerTurnFlags(state);
  const resolvedSourceIds = (flags.shellTradersStartTurnResolvedSourceIds ??= []);
  for (const sourceCardId of state.runner.rig.resources.slice().sort()) {
    if (definitionFor(state, sourceCardId).id !== SHELL_TRADERS_ID) continue;
    if (resolvedSourceIds.includes(sourceCardId)) continue;
    const targetCardId = shellTradersPreparedTargetIds(state)[0];
    if (!targetCardId) continue;
    resolvedSourceIds.push(sourceCardId);
    const targetDefinition = definitionFor(state, targetCardId);
    const result = removeShellCounterAndMaybeInstall(state, targetCardId);
    effects?.push({
      effectId: `runner.start.shell_traders.${sourceCardId}.${targetCardId}`,
      kind: "counter_change",
      visibility: "public",
      side: "runner",
      amount: result.remainingCounters,
      reason: "start_of_turn",
      counterType: "shell",
      removedCounterAmount: 1,
      remainingCounters: result.remainingCounters,
      sourceDefinitionId: SHELL_TRADERS_ID,
      sourceTitle: publicCardTitle(SHELL_TRADERS_ID),
      cardDefinitionId: targetDefinition.id,
      cardTitle: publicCardTitle(targetDefinition.id),
    });
  }
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
  const sourceDefinitionId = definitionFor(state, sourceCardId).id;
  if (
    !hasSuccessfulRunForceRezFollowup(sourceDefinitionId) &&
    !(
      !cardImplementationForDefinitionId(sourceDefinitionId) &&
      sourceDefinitionId === FALSE_ECHO_FORCE_REZ_PROGRAM_ID
    )
  )
    throw new Error("Die False-Echo-Faehigkeit passt nicht zur Karte.");
  const abilityCost = successfulRunForceRezFollowupCreditCost(sourceDefinitionId);
  if (creditCostForAction(legalAction) !== abilityCost)
    throw new Error("False Echo hat nicht mehr die erwarteten Kosten.");
  if (state.runner.credits < abilityCost)
    throw new Error("Runner kann False Echo nicht bezahlen.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("False Echo wurde fuer diesen Run bereits genutzt.");
  const server = mustServer(state, serverId);
  if (abilityCost > 0) spendCredits(state, "runner", abilityCost);
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
    sourceDefinitionId,
    falseEchoCreditCost: abilityCost,
    serverLabel: publicServerLabel(state, server.id) ?? server.id,
    checkedIceCount: checkedIceIds.length,
    rezzedIceCount: rezzedCount,
    rezCostPaid,
    corpCreditsAfter: state.corp.credits,
    runnerCreditsAfter: state.runner.credits,
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
  const sourceDefinition = definitionFor(state, sourceCardId);
  const reverseFollowup =
    cardImplementationForDefinitionId(sourceDefinition.id)?.successfulRunFollowups?.some(
      (followup) => followup.kind === "reverse_ice_on_successful_run_fort",
    ) ?? false;
  if (
    !reverseFollowup &&
    sourceDefinition.id !== NETSPACE_INVERTER_REVERSE_ICE_PROGRAM_ID
  )
    throw new Error("Die Netspace-Inverter-Faehigkeit passt nicht zur Karte.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Netspace Inverter wurde fuer diesen Run bereits genutzt.");
  const server = mustServer(state, serverId);
  if (server.kind === "archives" || server.ice.length <= 1)
    throw new Error("Dieses Remote kann nicht umgekehrt werden.");
  server.ice.reverse();
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: sourceDefinition.id,
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
  if (
    runnerUtilityLongtailKindForCard(state, sourceCardId) !==
      "startup_immolator_trash_fully_broken_ice" &&
    definitionFor(state, sourceCardId).id !== STARTUP_IMMOLATOR_TRASH_ICE_PROGRAM_ID
  )
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
    sourceDefinitionId: definitionFor(state, sourceCardId).id,
    targetIceDefinitionId: targetDefinitionId,
    rezCostPaid: rezCost,
    trashedCount: 1,
    trashedCardDefinitionId: targetDefinitionId,
    runnerCreditsAfter: state.runner.credits,
    startupImmolatorExhausted: true,
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

function resolvePreyingMantisGainAction(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Preying Mantis nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Preying Mantis ist nicht installiert.");
  if (
    runnerUtilityLongtailKindForCard(state, sourceCardId) !==
    "preying_mantis_optional_action_unpreventable_core_damage"
  )
    throw new Error("Die Preying-Mantis-Faehigkeit passt nicht zur Karte.");
  const flags = ensureRunnerTurnFlags(state);
  const used = flags.preyingMantisUsedSourceIdsThisTurn ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Preying Mantis wurde in diesem Zug bereits genutzt.");
  state.runner.clicks += 1;
  flags.preyingMantisUsedSourceIdsThisTurn = [...used, sourceCardId].sort();
  flags.preyingMantisDamageDueSourceIdsThisTurn = [
    ...(flags.preyingMantisDamageDueSourceIdsThisTurn ?? []),
    sourceCardId,
  ].sort();
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definitionFor(state, sourceCardId).id,
    gainedActions: 1,
    runnerClicksAfter: state.runner.clicks,
    unpreventableDamageDueAtEndOfTurn: true,
  };
}

function resolveISpyPutSpyCounter(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf I Spy nutzen.");
  const run = mustRun(state);
  if (!run.successful || run.phase !== "access")
    throw new Error("I Spy ist nur direkt nach einem erfolgreichen Run legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("I Spy ist nicht installiert.");
  if (
    runnerUtilityLongtailKindForCard(state, sourceCardId) !==
    "i_spy_successful_run_fort_counter_expose"
  )
    throw new Error("Die I-Spy-Faehigkeit passt nicht zur Karte.");
  if (serverId !== run.attackedServerId)
    throw new Error("I Spy kann nur den gerade erfolgreichen Fort markieren.");
  const server = mustServer(state, serverId);
  if (server.kind === "archives")
    throw new Error("I Spy kann nur einen Data Fort markieren.");
  const used = run.successfulRunAbilityUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("I Spy wurde fuer diesen Run bereits genutzt.");
  trashRunnerInstalledCardToHeap(state, sourceCardId, legalAction);
  state.spyCountersByServer = {
    ...(state.spyCountersByServer ?? {}),
    [server.id]: spyCountersForServer(state, server.id) + 1,
  };
  run.successfulRunAbilityUsedSourceIds = [...used, sourceCardId].sort();
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: definitionFor(state, sourceCardId).id,
    serverId: server.id,
    serverLabel: publicServerLabel(state, server.id) ?? server.id,
    counterType: "spy",
    addedCounterAmount: 1,
    spyCounterFort: server.id,
    spyCountersAfter: spyCountersForServer(state, server.id),
    exposedServerId: server.id,
    exposedCount: server.ice.length + server.root.length,
  };
}

function resolveCorpRemoveSpyCounter(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Spy-Counter entfernen.");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  const server = mustServer(state, serverId);
  if (spyCountersForServer(state, server.id) <= 0)
    throw new Error("In diesem Fort liegt kein Spy-Counter.");
  if (clickCostForAction(legalAction) !== 1 || creditCostForAction(legalAction) !== 4)
    throw new Error("Spy-Counter entfernen kostet genau 1 Aktion und 4 Credits.");
  spendClick(state, "corp");
  spendCredits(state, "corp", 4);
  state.spyCountersByServer = {
    ...(state.spyCountersByServer ?? {}),
    [server.id]: Math.max(0, spyCountersForServer(state, server.id) - 1),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    serverId: server.id,
    serverLabel: publicServerLabel(state, server.id) ?? server.id,
    counterType: "spy",
    removedCounterAmount: 1,
    remainingCounters: spyCountersForServer(state, server.id),
    removedSpyCounter: true,
    corpCreditsAfter: state.corp.credits,
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
  const resolver =
    cardImplementationRunnerEventResolver(definition) ??
    RUNNER_EVENT_RESOLVERS[definition.id];
  if (canPlayPrintedCostOnPlayImplementation(
    cardImplementationRuntimeDeps,
    state,
    definition,
  )) {
    executeOnPlayCardImplementationAbility(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
    );
    return;
  }
  if (resolver) {
    resolver.resolve(state, legalAction);
    return;
  }
  throw new Error(`Kein Runner-Event-Resolver fuer ${definition.id}.`);
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
    `${MIT_WEST_TIER_REMOVED_FROM_GAME_REASON}:${state.stateVersion + 1}`,
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
    specialZoneReason: MIT_WEST_TIER_REMOVED_FROM_GAME_REASON,
  };
  applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
}

function shuffleGripTrashAndStackThenDrawForCardImplementation(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinition["id"],
  drawCount: number,
  removePlayedCardFromGame: true,
): { publicPayload: Record<string, string | number | boolean> } {
  if (removePlayedCardFromGame !== true)
    throw new Error("MIT West Tier muss aus dem Spiel entfernt werden.");
  removeFromAllZones(state, sourceCardId);
  const specialZones = ensureSpecialZones(state);
  specialZones.removedFromGame.push(sourceCardId);
  specialZones.removedFromGame.sort();
  state.cardInstances[sourceCardId] = {
    ...mustInstance(state.cardInstances, sourceCardId),
    faceup: true,
    zone: { side: "special", zone: "removed_from_game", visibility: "public" },
  };

  const gripCount = state.runner.grip.length;
  const heapCount = state.runner.heap.length;
  const stackCount = state.runner.stack.length;
  const allIds = [
    ...state.runner.grip,
    ...state.runner.heap,
    ...state.runner.stack,
  ].filter((id) => id !== sourceCardId);
  state.runner.grip = [];
  state.runner.heap = [];
  state.runner.stack = shuffleStateIds(
    state,
    allIds,
    `${sourceDefinitionId}.shuffle_grip_heap_stack:${state.stateVersion + 1}`,
  );
  for (const id of state.runner.stack) {
    state.cardInstances[id] = {
      ...mustInstance(state.cardInstances, id),
      zone: { side: "runner", zone: "stack" },
    };
  }
  const drawSummary = drawRunnerCards(state, drawCount);
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_47_shuffle_grip_heap_stack_then_draw",
    sourceDefinitionId,
    shuffledGripCount: gripCount,
    shuffledTrashCount: heapCount,
    shuffledStackCount: stackCount,
    shuffledCardsCount: allIds.length,
    drawnCount: drawSummary.drawnCount,
    removedFromGame: true,
    specialZone: "removed_from_game",
    specialZoneVisibility: "public",
    specialZoneReason: sourceDefinitionId,
    randomCounterAfter: state.randomCounter,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
  return { publicPayload: legalAction.payload ?? payload };
}

function startRunnerProgramTrashBeforeInstallChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
): void {
  if (!state.runner.grip.includes(sourceCardId))
    throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
  const definition = definitionFor(state, sourceCardId);
  if (definition.type !== "program")
    throw new Error(
      "Nur Programme koennen vor der Installation Programmtrash oeffnen.",
    );
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (availableRunnerProgramInstallCredits(state) < (definition.installCost ?? 0))
    throw new Error("Nicht genug Credits fuer die Programminstallation.");
  const options = installedRunnerProgramTrashOptionsForInstall(state).map(
    (cardId) => {
      const optionDefinition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: optionDefinition.title,
        value: cardId,
      };
    },
  );
  if (options.length === 0)
    throw new Error("Es gibt kein installiertes Programm zum Trashen.");
  if (!runnerProgramInstallMemoryReachableAfterTrash(state, definition))
    throw new Error("Durch Programmtrash kann nicht genug MU freigemacht werden.");
  state.pendingChoice = {
    choiceId: `runner_program_trash_before_install_${state.stateVersion + 1}`,
    side: "runner",
    source: `runner_program_trash_before_install:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "Programme vor Installation trashen",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: options.length,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function resolveRunnerProgramTrashBeforeInstallChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("runner_program_trash_before_install"))
    throw new Error("Es ist keine Programmtrash-Installationschoice offen.");
  const sourceCardId = choice.source.split(":")[1] as
    | CardInstanceId
    | undefined;
  if (!sourceCardId || !state.runner.grip.includes(sourceCardId))
    throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
  if (state.phase !== "runner_action_phase" || state.timingPoint !== "runner_action.main")
    throw new Error("Programme koennen nur im Runner-Aktionsfenster installiert werden.");
  if (state.runner.clicks <= 0)
    throw new Error("Der Runner hat keinen Klick fuer die Installation.");
  const definition = definitionFor(state, sourceCardId);
  if (definition.type !== "program")
    throw new Error("Nur Programme koennen ueber diese Choice installiert werden.");
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (availableRunnerProgramInstallCredits(state) < (definition.installCost ?? 0))
    throw new Error("Nicht genug Credits fuer die Programminstallation.");

  const trashIds = selectedChoiceCardIds(choice, playerAction);
  const uniqueTrashIds = [...new Set(trashIds)];
  if (uniqueTrashIds.length !== trashIds.length)
    throw new Error("Die Programmtrash-Auswahl enthaelt doppelte Karten.");
  for (const cardId of uniqueTrashIds) {
    if (!state.runner.rig.programs.includes(cardId))
      throw new Error("Die Programmtrash-Auswahl enthaelt kein installiertes Programm.");
    if (definitionFor(state, cardId).type !== "program")
      throw new Error("Nur installierte Programme koennen getrasht werden.");
  }

  const memoryAfterSelection =
    state.runner.memoryUsed +
    (definition.memoryCost ?? 0) -
    uniqueTrashIds.reduce((sum, cardId) => {
      if (!runnerProgramUsesMemory(state, cardId)) return sum;
      return sum + (definitionFor(state, cardId).memoryCost ?? 0);
    }, 0);
  const needsMemory = memoryAfterSelection > runnerMemoryLimit(state);
  if (needsMemory && uniqueTrashIds.length === 0) {
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: definition.id,
      runnerProgramTrashBeforeInstall: true,
      installed: false,
      installCancelled: true,
      installBlockedReason: "insufficient_memory",
    };
    return;
  }
  if (needsMemory)
    throw new Error("Die Programmtrash-Auswahl macht nicht genug MU frei.");

  const trashedDefinitionIds = uniqueTrashIds.map(
    (cardId) => definitionFor(state, cardId).id,
  );
  for (const cardId of uniqueTrashIds) trashRunnerInstalledCardToHeap(state, cardId);
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId: sourceCardId,
    runnerProgramTrashBeforeInstall: true,
    runnerProgramTrashBeforeInstallResolved: true,
    trashedCount: uniqueTrashIds.length,
    ...(trashedDefinitionIds.length > 0
      ? { trashedCardDefinitionIds: trashedDefinitionIds.join(",") }
      : {}),
  };
  installCard(state, legalAction);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    sourceDefinitionId: definition.id,
    installed: true,
    memoryUsedAfter: state.runner.memoryUsed,
    memoryLimitAfter: runnerMemoryLimit(state),
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
  const corpIceInstallQuote = assertCorpIceInstallCostValid(
    state,
    cardId,
    definition,
    legalAction,
  );
  if (
    legalAction.side === "runner" &&
    definition.type === "program" &&
    legalAction.payload?.runnerProgramTrashBeforeInstall === true &&
    legalAction.payload?.runnerProgramTrashBeforeInstallResolved !== true
  ) {
    startRunnerProgramTrashBeforeInstallChoice(state, cardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerProgramTrashChoiceOpened: true,
    };
    return;
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
    if (requiresDataFortInstallTarget(definition) && (!selectedServerId || selectedServerId === "new_remote")) {
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
    if (requiresDataFortInstallTarget(definition) && restrictiveTargetServerId) {
      mustServer(state, restrictiveTargetServerId);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        selectedServerLabel: serverChoiceDisplayLabel(
          state,
          restrictiveTargetServerId,
        ),
      };
    }
    const zetatechRecurringBefore =
      zetatechOverlayInstall && hostOnCardId
        ? hostedPaymentCredits(state, hostOnCardId)
        : 0;
    const concealedHiddenRunnerResource =
      definition.type === "resource" && cardHasSubtype(definition, "hidden");
    const cardImplementationAgendaPointCost =
      cardImplementationAgendaPointInstallCost(definition);
    if (cardImplementationAgendaPointCost > 0) {
      const agendaCost = Number(
        legalAction.payload?.installAgendaPointCost ?? 0,
      );
      if (
        !Number.isInteger(agendaCost) ||
        agendaCost !== cardImplementationAgendaPointCost
      )
        throw new Error(
          "Die CardImplementation-Installation benötigt exakt die deklarierten Agenda-Punkt-Zusatzkosten.",
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
        specialZoneReason: "agenda_point_cost_card_implementation_install",
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
      if (isRunnerHardwareDeckDefinition(definition)) {
        for (const oldDeckId of state.runner.rig.hardware.slice().sort()) {
          if (!isRunnerHardwareDeckDefinition(definitionFor(state, oldDeckId)))
            continue;
          trashedDeckDefinitionIds.push(definitionFor(state, oldDeckId).id);
          trashRunnerInstalledCardToHeap(state, oldDeckId);
        }
      }
      state.runner.rig.hardware.push(cardId);
      if (!hasCardImplementationMemoryUnitModifier(definition)) {
        if (definition.mechanics.includes("modify_memory_limit"))
          state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
        else if ((definition.memoryLimitBonus ?? 0) > 0)
          state.runner.memoryLimit += definition.memoryLimitBonus ?? 0;
      }
      if (shouldLoadLegacyRecurringCredits(definition))
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
      if (
        definition.id === ABLATIVE_COUNTER_HARDWARE_CARD_ID &&
        damagePreventionSourcesForDefinition(definition).length === 0
      ) {
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
      if (shouldLoadLegacyRecurringCredits(definition))
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
      if (
        definition.mechanics.includes("virus") &&
        !cardImplementationForDefinitionId(definition.id)?.virusCounter &&
        definition.id !== BUTCHER_BOY_ID &&
        definition.id !== SKIVVISS_ID
      )
        addCardCounter(state, cardId, "virus", 1);
    } else if (definition.type === "resource") {
      state.runner.rig.resources.push(cardId);
      if (shouldLoadLegacyRecurringCredits(definition) && !concealedHiddenRunnerResource)
        setCardCounter(
          state,
          cardId,
          "recurring_credit",
          definition.recurringCredits ?? 0,
        );
      if (concealedHiddenRunnerResource) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenRunnerResourceInstall: true,
          hiddenResourceSlotId: hiddenRunnerResourceSlotId(cardId),
          redactedKind: "hidden_runner_resource",
        };
      }
    } else {
      throw new Error(
        "Nur Programme, Hardware und Resources koennen vom Runner installiert werden.",
      );
    }
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: !concealedHiddenRunnerResource,
      rezzed: !concealedHiddenRunnerResource,
      zone: { side: "runner", zone: "rig" },
      ...(hostOnCardId ? { hostedOn: hostOnCardId } : {}),
      ...(requiresDataFortInstallTarget(definition) && restrictiveTargetServerId
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
                  hostedPaymentCredits(state, hostOnCardId),
              )
            : 0,
        runnerCreditsAfter: state.runner.credits,
      };
    }
    consumeValuPakProgramInstallAction(state, legalAction);
    if (shouldLoadLegacyRecurringCredits(definition)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        recurringCreditsLoaded: definition.recurringCredits ?? 0,
      };
    }
    if (definition.id === "v099_host_resource")
      startRunnerHostingChoice(state, cardId, legalAction);
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_install",
    );
    return;
  }

  removeFromAllZones(state, cardId);
  const placement = legalAction.payload?.placement;
  if (placement === "ice") {
    const server =
      legalAction.payload?.serverId === "new_remote"
        ? createRemote(state)
        : mustServer(state, String(legalAction.payload?.serverId));
    if (corpIceInstallQuote) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...costQuotePublicPayload(corpIceInstallQuote),
      };
    }
    spendCredits(
      state,
      "corp",
      corpIceInstallQuote?.finalCredits ?? legalAction.costs[0]?.credits ?? 0,
    );
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
      "In diesem Server darf diese Karte nicht im Root installiert sein.",
    );
  }
  const rootCapacity = corpRootAgendaOrNodeCapacityInServer(state, server);
  const replacedRootAssetIds =
    definition.type === "agenda" &&
    corpRootMainCardIdsInServer(state, server).length >= rootCapacity
      ? corpRootAssetIdsInServer(state, server)
      : [];
  const replacedRootDefinitionIds = replacedRootAssetIds.map(
    (replacedId) => definitionFor(state, replacedId).id,
  );
  for (const replacedId of replacedRootAssetIds) {
    trashCorpInstalledCardToArchives(state, replacedId, legalAction);
  }
  if (replacedRootAssetIds.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      rootReplacement: "asset_to_agenda",
      replacedRootCardIds: replacedRootAssetIds.join(","),
      replacedRootDefinitionIds: replacedRootDefinitionIds.join(","),
      replacedRootCardType: "asset",
    };
  }
  server.root.push(cardId);
  const rootRezOnInstall = rootInstallRezzesOnInstall(definition);
  if (rootRezOnInstall) {
    spendCredits(
      state,
      "corp",
      legalAction.costs[0]?.credits ?? rezCostForCard(state, cardId),
    );
  }
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: rootRezOnInstall,
    rezzed: rootRezOnInstall,
    zone: { side: "corp", zone: "serverRoot", serverId: server.id },
  };
  if (rootRezOnInstall && isParisTracePoolSource(state, cardId)) {
    const capacity = parisTracePoolCapacityForCard(state, cardId);
    setCardCounter(state, cardId, "bit", capacity);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definition.id,
      counterType: "bit",
      addedCounterAmount: capacity,
      remainingCounters: capacity,
    };
  }
  executeCardImplementationLifecycleEffects(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
    definition,
    cardId,
    "on_install",
  );
  if (isRegionUpgrade(definition)) {
    trashOlderRegionUpgradesInServer(state, server, cardId, legalAction);
  }
  markRovingSubmarineActivityForServer(state, server.id, legalAction);
  consumeEdgerunnerTempsInstallAction(state, legalAction);
}

function canInstallCorpRootCardInServer(
  state: GameState,
  definition: CardDefinition,
  server: CorpServer,
): boolean {
  if (mustInstallInsideSubsidiaryDataFort(definition) && server.kind !== "remote")
    return false;
  if (definition.type === "upgrade") return server.kind !== "archives";
  if (server.kind !== "remote") return false;
  if (definition.type !== "agenda" && definition.type !== "asset") return false;
  const capacity = corpRootAgendaOrNodeCapacityInServer(state, server);
  const mainIds = corpRootMainCardIdsInServer(state, server);
  if (mainIds.length < capacity) return true;
  if (definition.type === "agenda") {
    const hasAgenda = server.root.some(
      (id) => definitionFor(state, id).type === "agenda",
    );
    return !hasAgenda && corpRootAssetIdsInServer(state, server).length > 0;
  }
  return false;
}

function corpRootAgendaOrNodeCapacityInServer(
  state: GameState,
  server: CorpServer,
): number {
  return (
    1 +
    server.root.reduce((sum, cardId) => {
      const instance = state.cardInstances[cardId];
      if (
        instance?.zone.side !== "corp" ||
        instance.zone.zone !== "serverRoot" ||
        instance.zone.serverId !== server.id
      )
        return sum;
      return (
        sum +
        fortCapacityModifiersForCard(state, cardId)
          .filter(
            (modifier) =>
              modifier.kind === "additional_agenda_or_node_slot_inside_fort" &&
              modifier.activeWhile === "installed",
          )
          .reduce((innerSum, modifier) => innerSum + modifier.amount, 0)
      );
    }, 0)
  );
}

function corpRootAssetIdsInServer(
  state: GameState,
  server: CorpServer,
): CardInstanceId[] {
  return server.root
    .filter((id) => definitionFor(state, id).type === "asset")
    .sort();
}

function corpRootMainCardIdsInServer(
  state: GameState,
  server: CorpServer,
): CardInstanceId[] {
  return server.root
    .filter((id) => {
      const installedType = definitionFor(state, id).type;
      return installedType === "agenda" || installedType === "asset";
    })
    .sort();
}

function corpRegionUpgradeIdsInServer(
  state: GameState,
  server: CorpServer,
): CardInstanceId[] {
  return server.root
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return definition.type === "upgrade" && cardHasSubtype(definition, "region");
    })
    .sort();
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
  | "successfulRunRunnerCreditGain"
  | "successfulRunRequiresCorpCredits"
  | "successfulRunPrivateLookCount"
  | "successfulRunArchivesMoveCount"
  | "successfulRunSourceCardId"
  | "successfulRunSourceDefinitionId"
  | "successfulRunSourceTitle"
  | "bypassFirstIceRemaining"
  | "runTraceLinkBonus"
  | "runTraceLinkBonusSourceDefinitionId"
  | "runnerRunTemporaryCredits"
  | "unpreventableCoreDamageAtRunEnd"
  | "socialEngineeringAutoPassIceId"
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
  executeCardImplementationRunnerRunStartEffects(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
  );
  const breachHost = breachStateHost(state);
  const installedAccessBonus = installedAccessBonusForServer(
    breachHost,
    server.id,
  );
  const installedAccessBonusSourceDefinitionIds =
    installedAccessBonusSourceDefinitionIdsForServer(breachHost, server.id);
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
    ...(options?.successfulRunRunnerCreditGain &&
    options.successfulRunRunnerCreditGain > 0
      ? { successfulRunRunnerCreditGain: options.successfulRunRunnerCreditGain }
      : {}),
    ...(options?.successfulRunRequiresCorpCredits
      ? { successfulRunRequiresCorpCredits: true }
      : {}),
    ...(options?.successfulRunPrivateLookCount &&
    options.successfulRunPrivateLookCount > 0
      ? { successfulRunPrivateLookCount: options.successfulRunPrivateLookCount }
      : {}),
    ...(options?.successfulRunArchivesMoveCount &&
    options.successfulRunArchivesMoveCount > 0
      ? { successfulRunArchivesMoveCount: options.successfulRunArchivesMoveCount }
      : {}),
    ...(options?.successfulRunSourceCardId
      ? { successfulRunSourceCardId: options.successfulRunSourceCardId }
      : {}),
    ...(options?.successfulRunSourceDefinitionId
      ? { successfulRunSourceDefinitionId: options.successfulRunSourceDefinitionId }
      : {}),
    ...(options?.successfulRunSourceTitle
      ? { successfulRunSourceTitle: options.successfulRunSourceTitle }
      : {}),
    ...(options?.bypassFirstIceRemaining
      ? { bypassFirstIceRemaining: true }
      : {}),
    ...(options?.runTraceLinkBonus && options.runTraceLinkBonus > 0
      ? { runTraceLinkBonus: options.runTraceLinkBonus }
      : {}),
    ...(options?.runTraceLinkBonusSourceDefinitionId
      ? {
          runTraceLinkBonusSourceDefinitionId:
            options.runTraceLinkBonusSourceDefinitionId,
        }
      : {}),
    ...(isV099OrLater(state)
      ? { badPublicityCredits: state.corp.badPublicity }
      : {}),
    ...(options?.runnerRunTemporaryCredits
      ? {
          runnerRunTemporaryCredits: {
            ...options.runnerRunTemporaryCredits,
          },
        }
      : {}),
    ...(options?.unpreventableCoreDamageAtRunEnd
      ? {
          unpreventableCoreDamageAtRunEnd: {
            ...options.unpreventableCoreDamageAtRunEnd,
          },
        }
      : {}),
    ...(options?.socialEngineeringAutoPassIceId
      ? { socialEngineeringAutoPassIceId: options.socialEngineeringAutoPassIceId }
      : {}),
    ...(pendingSuccessBonusCredits ? { pendingSuccessBonusCredits } : {}),
  };
  applyRunnerTraceCounterRunStartEffects(state, legalAction);
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
    enterAccessFromSuccessfulRun(runAccessTransitionHost(state), legalAction);
  }
}

type RunnerTraceCounterEffectRuntime =
  NonNullable<(typeof CARD_IMPLEMENTATIONS)[number]["runnerCounterEffects"]>[number] & {
    sourceDefinitionId: CardDefinitionId;
  };

function runnerTraceCounterEffectDefinitions(): RunnerTraceCounterEffectRuntime[] {
  return CARD_IMPLEMENTATIONS.flatMap((implementation) =>
    (implementation.runnerCounterEffects ?? []).map((counterEffect) => ({
      ...counterEffect,
      sourceDefinitionId: implementation.cardDefinitionId,
    })),
  );
}

function runnerCounterDisplayName(counterType: CounterType): string {
  if (counterType === "data_raven") return "Data-Raven-Counter";
  if (counterType === "cerberus") return "Cerberus-Counter";
  if (counterType === "mastiff") return "Mastiff-Counter";
  return "Counter";
}

function traceCounterEffectDefinitionFor(
  counterType: unknown,
): RunnerTraceCounterEffectRuntime | undefined {
  return runnerTraceCounterEffectDefinitions().find(
    (effect) => effect.counterType === counterType,
  );
}

function runnerUtilityLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardRunnerUtilityLongtailImplementation["kind"] | undefined {
  return cardImplementationForDefinitionId(definitionId)?.runnerUtilityLongtail
    ?.kind;
}

function runnerUtilityLongtailKindForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardRunnerUtilityLongtailImplementation["kind"] | undefined {
  return runnerUtilityLongtailKindForDefinition(definitionFor(state, cardId).id);
}

function runnerUtilityLongtailImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardRunnerUtilityLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definitionFor(state, cardId).id)
    ?.runnerUtilityLongtail;
}

function uniqueDirectLongtailImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardUniqueDirectLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.uniqueDirectLongtail;
}

function uniqueDirectLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardUniqueDirectLongtailImplementation["kind"] | undefined {
  return uniqueDirectLongtailImplementationForDefinition(definitionId)?.kind;
}

function uniqueDirectLongtailImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardUniqueDirectLongtailImplementation | undefined {
  return uniqueDirectLongtailImplementationForDefinition(
    definitionFor(state, cardId).id,
  );
}

function uniqueDirectLongtailKindForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardUniqueDirectLongtailImplementation["kind"] | undefined {
  return uniqueDirectLongtailImplementationForCard(state, cardId)?.kind;
}

function remainingReplacementLongtailImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardRemainingReplacementLongtailImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)
    ?.remainingReplacementLongtail;
}

function remainingReplacementLongtailKindForDefinition(
  definitionId: CardDefinitionId,
): CardRemainingReplacementLongtailImplementation["kind"] | undefined {
  return remainingReplacementLongtailImplementationForDefinition(definitionId)
    ?.kind;
}

function remainingReplacementLongtailImplementationForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardRemainingReplacementLongtailImplementation | undefined {
  return remainingReplacementLongtailImplementationForDefinition(
    definitionFor(state, cardId).id,
  );
}

function remainingReplacementLongtailKindForCard(
  state: GameState,
  cardId: CardInstanceId,
): CardRemainingReplacementLongtailImplementation["kind"] | undefined {
  return remainingReplacementLongtailImplementationForCard(state, cardId)?.kind;
}

function isAcmeSavingsAndLoanDefinition(definitionId: CardDefinitionId): boolean {
  return (
    remainingReplacementLongtailKindForDefinition(definitionId) ===
    "acme_savings_and_loan_debt"
  );
}

function isCitySurveillanceCard(state: GameState, cardId: CardInstanceId): boolean {
  return (
    remainingReplacementLongtailKindForCard(state, cardId) ===
    "city_surveillance_draw_tag"
  );
}

function isInvestmentFirmCard(state: GameState, cardId: CardInstanceId): boolean {
  return (
    remainingReplacementLongtailKindForCard(state, cardId) ===
    "investment_firm_credit_diversion"
  );
}

function isHackerTrackerCentralCard(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return (
    remainingReplacementLongtailKindForCard(state, cardId) ===
    "hacker_tracker_trace_bits"
  );
}

function isSubmarineUplinkSource(state: GameState, cardId: CardInstanceId): boolean {
  return (
    runnerUtilityLongtailKindForCard(state, cardId) ===
    "submarine_uplink_trace_link_force_jack_out"
  );
}

function markSubmarineUplinkJackOutAfterEncounter(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  if (!state.run || !isSubmarineUplinkSource(state, cardId)) return;
  state.run.forceJackOutAfterEncounterSourceId = cardId;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    forceJackOutAfterEncounter: true,
    sourceDefinitionId: definitionFor(state, cardId).id,
  };
}

function resolveRemoveRunnerTraceCounter(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Runner-Trace-Counter entfernen.");
  if (legalAction.payload?.cardId !== state.runner.identity)
    throw new Error("Trace-Counter liegen auf der Runner-Identitaet.");
  const counterType = legalAction.payload?.counterType;
  const counterEffect = traceCounterEffectDefinitionFor(counterType);
  if (!counterEffect)
    throw new Error("Dieser Runner-Trace-Counter ist nicht entfernbar.");
  const removeAmount = Number(legalAction.payload?.removeCounterAmount ?? 0);
  if (!Number.isInteger(removeAmount) || removeAmount !== 1)
    throw new Error("Es kann genau ein Runner-Trace-Counter entfernt werden.");
  const cost = Number(legalAction.payload?.counterRemoveCreditCost ?? 0);
  if (!Number.isInteger(cost) || cost !== counterEffect.removeCost)
    throw new Error("Der Counter verlangt den aktuellen Entfernen-Betrag.");
  if (cardCounter(state, state.runner.identity, counterEffect.counterType) < 1)
    throw new Error("Es ist kein passender Counter vorhanden.");
  spendClick(state, "runner");
  spendCredits(state, "runner", counterEffect.removeCost);
  spendCardCounter(state, state.runner.identity, counterEffect.counterType, 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: counterEffect.sourceDefinitionId,
    counterType: counterEffect.counterType,
    removedCounterAmount: 1,
    remainingCounters: cardCounter(
      state,
      state.runner.identity,
      counterEffect.counterType,
    ),
    runnerCreditsAfter: state.runner.credits,
  };
}

function applyRunnerTraceCounterRunStartEffects(
  state: GameState,
  legalAction?: LegalAction,
): void {
  for (const counterEffect of runnerTraceCounterEffectDefinitions()) {
    if (!counterEffect.runStart) continue;
    const counterCount = cardCounter(
      state,
      state.runner.identity,
      counterEffect.counterType,
    );
    if (counterCount <= 0) continue;
    const damageAmount =
      counterCount * counterEffect.runStart.amountPerCounter;
    const damageType =
      counterEffect.runStart.damageType === "brain" ? "core" : "net";
    const summary = doDamage(state, {
      damageId: `${state.run?.runId ?? `run_${state.stateVersion + 1}`}.${counterEffect.counterType}_counter_start_damage`,
      damageType,
      amount: damageAmount,
      source: `counter:${counterEffect.sourceDefinitionId}`,
    });
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceDefinitionId: counterEffect.sourceDefinitionId,
        counterType: counterEffect.counterType,
        counterCount,
        [`${counterEffect.counterType}CounterCount`]: counterCount,
        damageResolved: true,
        damageType: summary.damageType,
        damageAmount: summary.amount,
        cardsTrashed: summary.cardsTrashed,
        flatline: summary.flatline,
        ...(summary.coreDamageAfter !== undefined
          ? {
              coreDamageAfter: summary.coreDamageAfter,
              runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter,
            }
          : {}),
      };
    }
    if (state.winner) return;
  }
}

function applyAiBoonRunStart(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const sourceCardIds = state.runner.rig.programs
    .slice()
    .sort()
    .filter((cardId) =>
      icebreakerHasSpecial(state, cardId, "ai_boon_run_start_random_strength"),
    );
  if (sourceCardIds.length === 0 || !state.run) return;
  const outcomes: string[] = [];
  for (const sourceCardId of sourceCardIds) {
    const definition = definitionFor(state, sourceCardId);
    const randomPurpose = `v1921.die.${definition.id}.run_start_strength`;
    const dieRoll = Math.floor(nextRandom(state, randomPurpose) * 6) + 1;
    const baseStrength = definition.strength ?? 0;
    const runStrength = baseStrength + dieRoll;
    state.run.aiBoonRunStrengthByBreaker = {
      ...(state.run.aiBoonRunStrengthByBreaker ?? {}),
      [sourceCardId]: runStrength,
    };
    state.run.aiBoonSourceCardId = sourceCardId;
    state.run.aiBoonRunStrength = runStrength;
    outcomes.push(`${sourceCardId}:${dieRoll}:${runStrength}`);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1921RunnerProgramAbility: "ai_boon_run_start_strength",
        sourceDefinitionId: definition.id,
        aiBoonSourceCardId: sourceCardId,
        randomPurpose,
        v1921DieRoll: dieRoll,
        aiBoonRunStrength: runStrength,
        randomCounterAfter: state.randomCounter,
      };
    }
  }
  if (legalAction && outcomes.length > 1) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1921RunnerProgramAbility: "ai_boon_run_start_strength",
      aiBoonRunStrengthOutcomes: outcomes.join(","),
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
      exposedCardDefinitionId: definition.id,
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

  if (decision === "expose") {
    run.approachIceExposeViewingIceId = approachedIceId;
    run.approachIceExposeViewingSourceCardId = sourceCardId;
    state.activeSide = "runner";
  } else {
    state.activeSide = "corp";
  }
  state.timingPoint = "run.approach_ice";
}

function resolveApproachIceExposeViewingDecision(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf das Ansehen beenden.");
  if (!isApproachIceExposeViewingWindowOpen(state))
    throw new Error("Es ist kein Ansehen-Fenster offen.");
  const run = mustRun(state);
  const viewedIceId = run.approachIceExposeViewingIceId;
  const sourceCardId = run.approachIceExposeViewingSourceCardId;
  if (
    String(legalAction.payload?.iceId) !== viewedIceId ||
    String(legalAction.payload?.cardId) !== sourceCardId
  )
    throw new Error("Das Ansehen passt nicht mehr zum aktuellen ICE.");
  if (legalAction.payload?.approachIceExposeViewDecision !== "finish")
    throw new Error("Die Ansehen-Entscheidung ist ungueltig.");
  delete run.approachIceExposeViewingIceId;
  delete run.approachIceExposeViewingSourceCardId;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "approach_ice_expose_finish",
  };
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
  let creditCost = rezCostForCard(state, cardId);
  const proteusVariableIceState = proteusVariableIceStateForRezAction(
    state,
    cardId,
    definition,
    creditCost,
    legalAction,
  );
  if (proteusVariableIceState) {
    creditCost += proteusVariableIceState.additionalCostPaid;
  }
  const shouldUseCorpRezCostQuote =
    legalAction?.type === "rez_ice" &&
    !rootRez &&
    definition.type === "ice" &&
    !legalAction.payload?.proteusVariableRez;
  if (shouldUseCorpRezCostQuote && legalAction) {
    const iceId = cardId as CardInstanceId;
    const quote = assertCorpRezCostQuoteValid(state, iceId, legalAction);
    creditCost = quote.finalCredits;
    const quotePayload = costQuotePublicPayload(quote);
    const sourceId =
      typeof quotePayload.oliviaSalazarRezSourceCardId === "string"
        ? (quotePayload.oliviaSalazarRezSourceCardId as CardInstanceId)
        : undefined;
    if (sourceId) {
      const run = mustRun(state);
      run.oliviaSalazarUsedSourceIdsThisRun = [
        ...(run.oliviaSalazarUsedSourceIdsThisRun ?? []),
        sourceId,
      ].sort();
      run.oliviaSalazarTemporaryRezzedIceIds = [
        ...new Set([...(run.oliviaSalazarTemporaryRezzedIceIds ?? []), iceId]),
      ].sort();
      quotePayload.serverId = run.attackedServerId;
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...quotePayload,
    };
  }
  if (isAcmeSavingsAndLoanDefinition(definition.id)) {
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
  spendCredits(state, "corp", creditCost);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    rezzed: true,
    faceup: true,
    ...(proteusVariableIceState ? { proteusVariableIceState } : {}),
  };
  if (definition.type === "ice") {
    const flags = ensureRunnerTurnFlags(state);
    flags.corpRezzedIceThisTurn =
      Math.max(0, Math.floor(flags.corpRezzedIceThisTurn ?? 0)) + 1;
  }
  if (
    definition.id === KRUMZ_TRACE_ASSET_CARD_ID &&
    !cardImplementationForDefinitionId(definition.id)
  ) {
    setCardCounter(state, cardId as CardInstanceId, "bit", 1);
  }
  if (isParisTracePoolSource(state, cardId as CardInstanceId)) {
    const capacity = parisTracePoolCapacityForCard(state, cardId as CardInstanceId);
    setCardCounter(state, cardId as CardInstanceId, "bit", capacity);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        sourceDefinitionId: definition.id,
        counterType: "bit",
        addedCounterAmount: capacity,
        remainingCounters: capacity,
      };
    }
  }
  if (legalAction)
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId as CardInstanceId,
      "on_rez",
    );
  if (rootRez && startSpeedTrapRezInterruptChoice(state, cardId, legalAction))
    return;
  if (rootRez && resolveCorpRootRezEffect(state, cardId, legalAction)) return;
  if (rootRez) {
    continueAfterCorpRootRezIfWindowIsComplete(state, legalAction);
    return;
  }
  beginEncounter(state, cardId as CardInstanceId, legalAction);
}

function continueAfterCorpRootRezIfWindowIsComplete(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const run = state.run;
  if (
    state.timingPoint !== "run.approach_ice" ||
    run?.phase !== "approach_ice" ||
    !run.approachedIceId ||
    corpRunRootRezActions(state).length > 0
  )
    return;
  const approachedIce = mustInstance(state.cardInstances, run.approachedIceId);
  if (!approachedIce.rezzed) return;
  beginEncounter(state, run.approachedIceId, legalAction);
}

function proteusVariableIceStateForRezAction(
  state: GameState,
  cardId: string,
  definition: CardDefinition,
  baseRezCost: number,
  legalAction?: LegalAction,
): CardInstance["proteusVariableIceState"] | undefined {
  if (
    definition.id !== PROTEUS_DIGICONDA_ID &&
    definition.id !== PROTEUS_FOOD_FIGHT_ID
  )
    return undefined;
  if (!legalAction)
    throw new Error("Proteus-variable ICE brauchen eine LegalAction.");
  if (legalAction.payload?.cardId !== cardId)
    throw new Error("Proteus-variable Rez-Zielkarte ist ungueltig.");
  const additionalCost = Number(legalAction.payload.variableRezAdditionalCost);
  const value = Number(legalAction.payload.variableRezValue);
  const rezCostPaid = Number(legalAction.payload.rezCostPaid);
  const actionCreditCost = creditCostForAction(legalAction);
  if (
    !Number.isInteger(additionalCost) ||
    additionalCost < 0 ||
    !Number.isInteger(value) ||
    value < 0 ||
    rezCostPaid !== baseRezCost + additionalCost ||
    actionCreditCost !== rezCostPaid ||
    state.corp.credits < rezCostPaid
  )
    throw new Error("Proteus-variable Rez-Kosten sind nicht mehr gueltig.");
  if (definition.id === PROTEUS_DIGICONDA_ID) {
    if (
      legalAction.payload.proteusVariableRez !== "x_strength" ||
      additionalCost !== value ||
      value > 6 ||
      legalAction.payload.variableRezCap !== 6 ||
      legalAction.payload.effectiveStrengthAfterRez !== value
    )
      throw new Error("Digiconda-X ist nicht legal.");
    return {
      family: "x_strength",
      additionalCostPaid: additionalCost,
      value,
      cap: 6,
      strength: value,
    };
  }
  if (
    legalAction.payload.proteusVariableRez !== "paid_etr_subroutines" ||
    additionalCost % 2 !== 0 ||
    value !== additionalCost / 2 ||
    legalAction.payload.effectiveSubroutineCountAfterRez !== value
  )
    throw new Error("Food-Fight-Zusatzkosten sind nicht legal.");
  return {
    family: "paid_etr_subroutines",
    additionalCostPaid: additionalCost,
    value,
    subroutineCount: value,
  };
}

function cardImplementationCorpRootRezResolver(
  definition: CardDefinition,
): CorpRootRezResolver | undefined {
  const longtail = remainingReplacementLongtailImplementationForDefinition(
    definition.id,
  );
  if (longtail?.kind === "acme_savings_and_loan_debt") {
    return {
      name: "card_implementation_corp_root_rez_acme_savings_and_loan_debt",
      resolve: (state) => {
        state.corp.credits += longtail.gainCreditsOnRez;
      },
    };
  }
  return undefined;
}

function resolveCorpRootRezEffect(
  state: GameState,
  cardId: string,
  legalAction?: LegalAction,
): boolean {
  const definition = definitionFor(state, cardId);
  const resolver =
    cardImplementationCorpRootRezResolver(definition) ??
    CORP_ROOT_REZ_RESOLVERS[definition.id];
  if (!resolver) return false;
  resolver.resolve(state);
  if (isAcmeSavingsAndLoanDefinition(definition.id)) {
    const acmeLongtail = remainingReplacementLongtailImplementationForDefinition(
      definition.id,
    );
    const gainedCredits =
      acmeLongtail?.kind === "acme_savings_and_loan_debt"
        ? acmeLongtail.gainCreditsOnRez
        : 12;
    addAcmeSavingsAndLoanObligation(state, 1);
    trashCorpInstalledCardToArchives(state, cardId as CardInstanceId);
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        gainedCredits,
        selfTrashed: true,
        acmeDebtActive: acmeSavingsAndLoanObligationCount(state) > 0,
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
    .filter((cardId) => {
      const definitionId = definitionFor(state, cardId).id;
      if (
        hasRunEncounterInterventionKind(
          state,
          cardId,
          "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
        )
      )
        return true;
      return (
        !cardImplementationForDefinitionId(definitionId) &&
        definitionId === SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID
      );
    })
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
    const speedTrapDefinitionId = definitionFor(state, speedTrapId).id;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      sourceDefinitionId: speedTrapDefinitionId,
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
  if (run.socialEngineeringAutoPassIceId === approachedIceId) {
    delete run.socialEngineeringAutoPassIceId;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        autoPassChosenIce: true,
        socialEngineeringAutoPassedIce: true,
      };
    }
    movePastCurrentIce(state);
    return;
  }
  if (run.bypassFirstIceRemaining) {
    run.bypassFirstIceRemaining = false;
    movePastCurrentIce(state);
    return;
  }
  if (ice.rezzed) {
    if (corpRunRootRezActions(state).length > 0) {
      const { encounteredIceId: _encounteredIceId, ...runWithoutEncounter } = run;
      void _encounteredIceId;
      state.run = {
        ...runWithoutEncounter,
        phase: "approach_ice",
        approachedIceId,
      };
      state.timingPoint = "run.approach_ice";
      state.activeSide = "corp";
      return;
    }
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
  delete run.encounterTemporaryTraceCredits;
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
          encounterTaxSource: BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
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
        encounterTaxSource: BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE,
      };
    }
  }
  const encounteredDefinition = definitionFor(state, encounteredIceId);
  const iceEncounter = cardImplementationForDefinitionId(
    encounteredDefinition.id,
  )?.iceEncounter;
  if (iceEncounter?.kind === "add_encounter_temporary_credits") {
    const amount = Math.max(0, Math.floor(iceEncounter.amount));
    if (
      amount > 0 &&
      iceEncounter.side === "corp" &&
      iceEncounter.usableFor === "this_ice_printed_trace_subroutines"
    ) {
      run.encounterTemporaryTraceCredits = {
        sourceIceId: encounteredIceId,
        sourceDefinitionId: encounteredDefinition.id,
        remaining: amount,
        usableFor: iceEncounter.usableFor,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          temporaryTraceCredits: amount,
          temporaryTraceCreditsSourceDefinitionId: encounteredDefinition.id,
        };
      }
    }
  }
  state.timingPoint = "run.encounter_ice";
  state.activeSide = "runner";
}

function finalizeDelayedSuccessfulRunAfterPassedIce(
  state: GameState,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  const run = state.run;
  const delayed = run?.delayedSuccessfulRun;
  if (!run || !delayed) return;
  const matched =
    delayed.temporaryIceId === passedIceId || delayed.installedIceId === passedIceId;
  if (!matched) return;
  if (delayed.temporaryIceId) {
    const instance = state.cardInstances[delayed.temporaryIceId];
    if (instance?.zone.side === "corp" && instance.zone.zone === "serverIce") {
      trashCorpInstalledCardToArchives(state, delayed.temporaryIceId, legalAction);
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          temporaryEncounterTrashed: true,
          temporaryIceSourceTitle: definitionFor(
            state,
            delayed.interventionSourceId,
          ).title,
        };
      }
    }
  }
  const { delayedSuccessfulRun: _delayed, ...runWithoutDelayed } = run;
  void _delayed;
  state.run = {
    ...runWithoutDelayed,
    successfulRunInterventionWindowClosed: true,
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      successfulRunFinalizedAfterIntervention: true,
      delayedSuccessfulRun: false,
    };
  }
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
  const payOrEndRunIndexesForThisContinue = new Set(
    encounterSubroutineIndexesForNextContinue(run, subroutines).filter(
      (index) =>
        subroutines[index]?.type === "end_the_run_unless_runner_pays",
    ),
  );
  const expectedSubroutineIds =
    typeof legalAction?.payload?.encounterSubroutineIds === "string"
      ? String(legalAction.payload.encounterSubroutineIds)
      : undefined;
  if (expectedSubroutineIds !== undefined) {
    const currentSubroutineIds = encounterSubroutinesForNextContinue(
      run,
      subroutines,
    )
      .map((subroutine) => subroutine.id)
      .join(",");
    if (currentSubroutineIds !== expectedSubroutineIds)
      throw new Error("Die Encounter-Subroutinen sind nicht mehr gueltig.");
  }
  const paidPayOrEndRunIndexes = new Set<number>();
  const payOrEndRunIndexPayload =
    typeof legalAction?.payload?.payOrEndRunSubroutineIndexes === "string"
      ? String(legalAction.payload.payOrEndRunSubroutineIndexes)
      : "";
  for (const rawIndex of payOrEndRunIndexPayload.split(",")) {
    if (!rawIndex) continue;
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0)
      throw new Error("Die Pay-or-End-the-Run-Subroutine ist ungueltig.");
    paidPayOrEndRunIndexes.add(index);
  }
  let expectedPayOrEndRunPayment = 0;
  for (const index of paidPayOrEndRunIndexes) {
    const subroutine = subroutines[index];
    if (
      !subroutine ||
      subroutine.type !== "end_the_run_unless_runner_pays" ||
      run.brokenSubroutineIndexes.includes(index) ||
      run.resolvedSubroutineIndexes.includes(index)
    ) {
      throw new Error("Die Pay-or-End-the-Run-Subroutine ist nicht mehr gueltig.");
    }
    expectedPayOrEndRunPayment += Math.max(
      0,
      Math.floor(subroutine.amount ?? 0),
    );
  }
  if (expectedPayOrEndRunPayment > 0) {
    const declaredPayment = Math.max(
      0,
      Math.floor(
        Number(legalAction?.payload?.payOrEndRunSubroutinePayment ?? 0),
      ),
    );
    const declaredCost = Math.max(
      0,
      Math.floor(
        (legalAction?.costs ?? []).reduce(
          (sum, cost) => sum + (cost.credits ?? 0),
          0,
        ),
      ),
    );
    if (
      declaredPayment !== expectedPayOrEndRunPayment ||
      declaredCost !== expectedPayOrEndRunPayment
    )
      throw new Error("Die Pay-or-End-the-Run-Kosten sind nicht mehr gueltig.");
    spendRunnerRunCredits(state, expectedPayOrEndRunPayment);
  }
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
      appendResolvedSubroutineEffect(legalAction, definition, index, subroutine, summary);
      if (legalAction) {
        setDamagePayload(
          legalAction,
          aggregateDamageSummaries(damageSummaries),
        );
      }
      if (state.winner) return;
    }
    if (subroutine.type === "trash_installed_program") {
      const trashResult = resolveTrashInstalledProgramSubroutine(
        state,
        legalAction,
      );
      appendResolvedSubroutineEffect(
        legalAction,
        definition,
        index,
        subroutine,
        undefined,
        trashResult
          ? {
              cardDefinitionId: trashResult.definitionId,
              cardTitle: trashResult.title,
              cardsTrashed: 1,
            }
          : { cardsTrashed: 0 },
      );
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
    if (subroutine.type === "set_run_jack_out_additional_cost") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      run.jackOutAdditionalCostForRun =
        Math.max(0, Math.floor(run.jackOutAdditionalCostForRun ?? 0)) + amount;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          jackOutAdditionalCost: runJackOutAdditionalCost(run),
          sourceDefinitionId: definition.id,
        };
      }
    }
    if (subroutine.type === "set_run_pass_rezzed_ice_program_trash") {
      if (!run.encounteredIceId)
        throw new Error("Program-Trash-Runmodifier benoetigt ein Encounter-ICE.");
      run.passRezzedIceProgramTrashSourceIceId = run.encounteredIceId;
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          passIceTrashProgramPrompt: true,
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
      if (!legalAction)
        throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reorder.");
      startCorpRdArrangeChoice(
        hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        {
          sourceIceId: run.encounteredIceId,
          subroutineIndex: index,
          updatePayload: true,
        },
      );
      if (!run.resolvedSubroutineIndexes.includes(index))
        run.resolvedSubroutineIndexes.push(index);
      return;
    }
    if (
      subroutine.type ===
      "secret_spend_compare_end_run_unless_corp_spent_at_least_runner"
    ) {
      startTooManyDoorsSecretSpendCorpChoice(
        state,
        run.encounteredIceId,
        index,
        legalAction,
      );
      if (!run.resolvedSubroutineIndexes.includes(index))
        run.resolvedSubroutineIndexes.push(index);
      return;
    }
    if (subroutine.type === "rewind_run_to_rezzed_ice_by_die") {
      if (resolveVacuumLinkRewindSubroutine(state, run, legalAction)) return;
    }
    if (subroutine.type === "end_the_run") {
      appendResolvedSubroutineEffect(legalAction, definition, index, subroutine);
      ended = true;
    }
    if (subroutine.type === "end_the_run_unless_runner_pays") {
      const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
      if (paidPayOrEndRunIndexes.has(index)) {
        appendResolvedSubroutineEffect(
          legalAction,
          definition,
          index,
          subroutine,
          undefined,
          { paidCredits: amount, endedRun: false },
        );
      } else {
        appendResolvedSubroutineEffect(
          legalAction,
          definition,
          index,
          subroutine,
          undefined,
          { paidCredits: 0, endedRun: true },
        );
        ended = true;
      }
    }
  }
  for (const index of payOrEndRunIndexesForThisContinue) {
    if (ended) break;
    if (paidPayOrEndRunIndexes.has(index)) continue;
    const alreadyResolved = (legalAction?.resolvedEffects ?? []).some(
      (effect) =>
        effect.kind === "resolve_subroutine" &&
        effect.subroutineIndex === index,
    );
    if (alreadyResolved) continue;
    const subroutine = subroutines[index];
    if (!subroutine || subroutine.type !== "end_the_run_unless_runner_pays")
      continue;
    appendResolvedSubroutineEffect(
      legalAction,
      definition,
      index,
      subroutine,
      undefined,
      { paidCredits: 0, endedRun: true },
    );
    ended = true;
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
        source: FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE,
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
  if (encounteredIceId)
    finalizeDelayedSuccessfulRunAfterPassedIce(state, encounteredIceId, legalAction);
  movePastCurrentIce(state, legalAction);
}

function appendResolvedSubroutineEffect(
  legalAction: LegalAction | undefined,
  definition: CardDefinition,
  subroutineIndex: number,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
  damageSummary?: DamageSummary,
  options: {
    paidCredits?: number;
    endedRun?: boolean;
    cardDefinitionId?: string;
    cardTitle?: string;
    cardsTrashed?: number;
  } = {},
): void {
  if (!legalAction) return;
  const dynamicAttribution = dynamicSubroutineAttributionFor(subroutine);
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: `subroutine_${subroutineIndex + 1}`,
      kind: "resolve_subroutine",
      visibility: "public",
      side: "runner",
      reason: "ice_subroutine",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      subroutineIndex,
      subroutineType: subroutine.type,
      ...(dynamicAttribution
        ? {
            cardDefinitionId: dynamicAttribution.sourceDefinitionId,
            cardTitle: dynamicAttribution.sourceTitle,
          }
        : {}),
      ...(damageSummary
        ? {
            damageType: damageSummary.damageType,
            amount: damageSummary.amount,
            cardsTrashed: damageSummary.cardsTrashed,
          }
        : {}),
      ...(options.paidCredits !== undefined
        ? { paidCredits: options.paidCredits }
        : {}),
      ...(options.cardDefinitionId
        ? { cardDefinitionId: options.cardDefinitionId }
        : {}),
      ...(options.cardTitle ? { cardTitle: options.cardTitle } : {}),
      ...(options.cardsTrashed !== undefined
        ? { cardsTrashed: options.cardsTrashed }
        : {}),
      ...(subroutine.type === "end_the_run" || options.endedRun
        ? { endedRun: true }
        : {}),
    },
  ];
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
    if (!icebreakerHasSpecial(state, breakerId, "bartmoss_post_encounter_self_trash_check"))
      continue;
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
  assertCurrentSubroutineMatchesLegalAction(
    state,
    iceDefinition,
    subroutineIndex,
    legalAction,
  );
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
  if (!icebreakerHasSpecial(state, breakerId, "bartmoss_post_encounter_self_trash_check"))
    return;
  const usedBreakerIds = run.bartmossUsedBreakerIdsThisEncounter ?? [];
  if (!usedBreakerIds.includes(breakerId)) usedBreakerIds.push(breakerId);
  run.bartmossUsedBreakerIdsThisEncounter = usedBreakerIds;
}

function recordDupreBreakUsage(
  state: GameState,
  breakerId: CardInstanceId,
): void {
  const run = state.run;
  if (!run || !icebreakerHasSpecial(state, breakerId, "dupre_strength_counter_and_last_fort"))
    return;
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

function recordSnowballBreakUsage(
  state: GameState,
  breakerId: CardInstanceId,
): void {
  const run = state.run;
  if (!run || !icebreakerHasSpecial(state, breakerId, "snowball_run_strength_per_successful_break"))
    return;
  const previous = runRemainderStrengthBonusForBreaker(run, breakerId);
  run.remainderStrengthBonusByBreaker = {
    ...(run.remainderStrengthBonusByBreaker ?? {}),
    [breakerId]: previous + 1,
  };
}

function icebreakerHasSpecial(
  state: GameState,
  breakerId: CardInstanceId,
  special: NonNullable<RuntimeIcebreakerAbility["special"]>,
): boolean {
  if (!state.cardInstances[breakerId]) return false;
  return icebreakerAbilitiesForDefinition(definitionFor(state, breakerId)).some(
    (ability) => ability.special === special,
  );
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
        isHackerTrackerCentralCard(state, cardId)
      );
    })
    .sort();
}

function hackerTrackerCounterType(
  state: GameState,
  cardId: CardInstanceId,
): "bit" | "power" {
  return remainingReplacementLongtailImplementationForCard(state, cardId)
    ?.kind === "hacker_tracker_trace_bits"
    ? "bit"
    : "power";
}

function hackerTrackerCounterTotal(state: GameState): number {
  return hackerTrackerCardIds(state).reduce(
    (sum, cardId) =>
      sum + cardCounter(state, cardId, hackerTrackerCounterType(state, cardId)),
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
    const counterType = hackerTrackerCounterType(state, cardId);
    const available = cardCounter(state, cardId, counterType);
    const cardSpent = Math.min(available, remaining);
    if (cardSpent <= 0) continue;
    spendCardCounter(state, cardId, counterType, cardSpent);
    remaining -= cardSpent;
    spent += cardSpent;
  }
  return spent;
}

function addHackerTrackerTraceCounters(state: GameState): number {
  let added = 0;
  for (const cardId of hackerTrackerCardIds(state)) {
    addCardCounter(state, cardId, hackerTrackerCounterType(state, cardId), 1);
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
  const encounterTemporaryTraceCredits =
    run.encounterTemporaryTraceCredits?.sourceIceId === sourceCardInstanceId
      ? Math.max(0, Math.floor(run.encounterTemporaryTraceCredits.remaining ?? 0))
      : 0;
  const baseCorpBidMax =
    state.corp.credits +
    encounterTemporaryTraceCredits +
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
    ...(encounterTemporaryTraceCredits > 0
      ? {
          encounterTemporaryTraceCreditSourceIceId: sourceCardInstanceId,
          encounterTemporaryTraceCreditSourceDefinitionId: sourceDefinition.id,
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
      ...(encounterTemporaryTraceCredits > 0
        ? {
            temporaryTraceCreditsAvailable: encounterTemporaryTraceCredits,
            temporaryTraceCreditsSourceDefinitionId: sourceDefinition.id,
          }
        : {}),
    };
  }
}

function rabbitTraceLimitReductionForIceTrace(state: GameState): number {
  const reductions = state.runner.rig.programs.map((cardId) => {
    const implementation = runnerUtilityLongtailImplementationForCard(state, cardId);
    if (
      implementation?.kind === "rabbit_ice_trace_limit_reduction" &&
      mustInstance(state.cardInstances, cardId).rezzed
    )
      return implementation.amount;
    if (
      !implementation &&
      definitionFor(state, cardId).id === RABBIT_HQ_INTERFACE_PROGRAM_ID &&
      mustInstance(state.cardInstances, cardId).rezzed
    )
      return 1;
    return 0;
  });
  return Math.max(0, ...reductions);
}

function startTraceFromOperation(
  state: GameState,
  sourceDefinitionId: string,
  baseTraceStrength: number,
  legalAction: LegalAction,
  successEffect: TraceSuccessEffect = { type: "add_tag", amount: 1 },
): Record<string, string | number | boolean> {
  if (state.trace || state.pendingChoice)
    throw new Error("Es ist bereits ein Trace oder eine Choice offen.");
  if (!Number.isInteger(baseTraceStrength) || baseTraceStrength < 0)
    throw new Error("Trace strength ist ungueltig.");
  if (!isSupportedTraceSuccessEffect(successEffect))
    throw new Error("Dieser Trace-Erfolgseffekt wird nicht unterstuetzt.");
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
    successEffect,
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
  const publicPayload = {
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
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...publicPayload,
  };
  return publicPayload;
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

function secretSpendChoice(
  state: GameState,
  side: Side,
  source: string,
  prompt: string,
  maxSpend: number,
): ChoiceRequest {
  const boundedMax = Math.min(2, Math.max(0, Math.floor(maxSpend)));
  return {
    choiceId: `${source}.${side}.${state.stateVersion + 1}`,
    side,
    source,
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
    visibility: "hidden_info_barrier",
  };
}

function startTooManyDoorsSecretSpendCorpChoice(
  state: GameState,
  sourceIceId: CardInstanceId,
  subroutineIndex: number,
  legalAction?: LegalAction,
): void {
  if (state.pendingChoice || state.secretSpendComparison)
    throw new Error("Es ist bereits eine Secret-Spend-Choice offen.");
  const run = mustRun(state);
  const source = `p3_56.too_many_doors_secret_spend:${run.runId}:${sourceIceId}:${subroutineIndex}`;
  state.secretSpendComparison = {
    source: "too_many_doors",
    runId: run.runId,
    sourceIceId,
    subroutineIndex,
  };
  state.pendingChoice = secretSpendChoice(
    state,
    "corp",
    source,
    "Too Many Doors: Korp geheim 0, 1 oder 2 Credits ausgeben.",
    state.corp.credits,
  );
  state.activeSide = "corp";
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      secretSpendStarted: true,
      sourceDefinitionId: definitionFor(state, sourceIceId).id,
      secretSpendAmounts: "0,1,2",
    };
  }
}

function resolveTooManyDoorsSecretSpendChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  const comparison = state.secretSpendComparison;
  if (
    !choice ||
    !comparison ||
    !choice.source.startsWith("p3_56.too_many_doors_secret_spend")
  )
    throw new Error("Too-Many-Doors-Secret-Spend-Choice ist nicht offen.");
  const selected = selectedBidAmount(choice, playerAction);
  if (selected < 0 || selected > 2)
    throw new Error("Too Many Doors erlaubt nur 0, 1 oder 2 Credits.");
  if (choice.side === "corp") {
    if (state.corp.credits < selected)
      throw new Error("Die Korp kann diesen Secret Spend nicht bezahlen.");
    state.secretSpendComparison = {
      ...comparison,
      corpSpend: selected,
    };
    state.pendingChoice = secretSpendChoice(
      state,
      "runner",
      choice.source,
      "Too Many Doors: Runner geheim 0, 1 oder 2 Credits ausgeben.",
      state.runner.credits,
    );
    state.activeSide = "runner";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      secretSpendStep: "corp_selected",
      sourceDefinitionId: definitionFor(state, comparison.sourceIceId).id,
      hiddenInfoBarrier: true,
    };
    return;
  }
  const corpSpend = comparison.corpSpend;
  if (corpSpend === undefined)
    throw new Error("Der Korp-Secret-Spend fehlt.");
  if (state.corp.credits < corpSpend || state.runner.credits < selected)
    throw new Error("Secret Spend ist nicht mehr bezahlbar.");
  spendCredits(state, "corp", corpSpend);
  spendCredits(state, "runner", selected);
  const endRun = corpSpend < selected;
  delete state.pendingChoice;
  delete state.secretSpendComparison;
  if (state.run) {
    state.timingPoint = "run.encounter_ice";
    state.activeSide = "runner";
    if (endRun) finishRun(state, false, legalAction);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "public",
    secretSpendRevealed: true,
    secretSpendCorp: corpSpend,
    secretSpendRunner: selected,
    tooManyDoorsEndRun: endRun,
    sourceDefinitionId: definitionFor(state, comparison.sourceIceId).id,
  };
}

function movePastCurrentIce(state: GameState, legalAction?: LegalAction): void {
  const run = mustRun(state);
  if (run.position.kind !== "ice")
    throw new Error("Runner ist nicht an ICE positioniert.");
  const server = mustServer(state, run.position.serverId);
  const nextIndex = run.position.iceIndex - 1;
  const passedIceId = run.encounteredIceId;
  clearEncounterTemporaryTraceCredits(run, legalAction);
  const viral15PendingPassedIceId =
    run.viral15ActiveSourceIceId &&
    passedIceId &&
    mustInstance(state.cardInstances, passedIceId).rezzed
      ? passedIceId
      : undefined;
  const passRezzedIceProgramTrashPendingPassedIceId =
    run.passRezzedIceProgramTrashSourceIceId &&
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
  if (run.forceJackOutAfterEncounterSourceId) {
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        forcedJackOutAfterEncounter: true,
        forceJackOutAfterEncounterSourceDefinitionId: definitionFor(
          state,
          run.forceJackOutAfterEncounterSourceId,
        ).id,
      };
    }
    finishRun(state, false, legalAction);
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
        ...(passRezzedIceProgramTrashPendingPassedIceId
          ? { passRezzedIceProgramTrashPendingPassedIceId }
          : {}),
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
      ...(passRezzedIceProgramTrashPendingPassedIceId
        ? { passRezzedIceProgramTrashPendingPassedIceId }
        : {}),
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
      ...(passRezzedIceProgramTrashPendingPassedIceId
        ? { passRezzedIceProgramTrashPendingPassedIceId }
        : {}),
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
  enterAccessFromSuccessfulRun(runAccessTransitionHost(state));
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
        isRioPassRezzedIceSource(state, cardId)
      );
    })
    .sort();
  if (rioIds.length === 0) return false;

  for (const rioId of rioIds) {
    const rioDefinitionId = definitionFor(state, rioId).id;
    const randomPurpose = `v1921.die.${rioDefinitionId}.passed_ice.${run.runId}.${passedIceId}.${rioId}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    const runEnded = dieRoll === 1;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1921UpgradeAbility: "rio_de_janeiro_passed_ice",
        sourceCardId: rioId,
        sourceDefinitionId: rioDefinitionId,
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
    `${definitionFor(state, run.encounteredIceId).id}.rewind.${run.runId}.${run.encounteredIceId}`,
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
  if (state.run?.passRezzedIceProgramTrashPendingPassedIceId) {
    const pendingPassedIceId =
      state.run.passRezzedIceProgramTrashPendingPassedIceId;
    const {
      passRezzedIceProgramTrashPendingPassedIceId: _pending,
      ...runWithoutPending
    } = state.run;
    void _pending;
    state.run = runWithoutPending;
    if (
      startPassRezzedIceProgramTrashChoice(
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
  enterAccessFromSuccessfulRun(runAccessTransitionHost(state), legalAction);
}

function applyUniqueDirectSuccessfulRunTriggers(
  state: GameState,
  legalAction?: LegalAction,
): void {
  const karlSources = state.runner.rig.resources
    .slice()
    .sort()
    .filter(
      (cardId) =>
        uniqueDirectLongtailKindForCard(state, cardId) ===
        "karl_successful_run_credit",
    );
  if (karlSources.length === 0) return;
  let gainedCredits = 0;
  const sourceDefinitionIds: CardDefinitionId[] = [];
  for (const sourceId of karlSources) {
    const implementation = uniqueDirectLongtailImplementationForCard(
      state,
      sourceId,
    );
    if (implementation?.kind !== "karl_successful_run_credit") continue;
    credits(state, "runner", implementation.amount);
    gainedCredits += implementation.amount;
    sourceDefinitionIds.push(definitionFor(state, sourceId).id);
  }
  if (gainedCredits <= 0 || !legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    successfulRunRunnerCreditGain:
      Number(legalAction.payload?.successfulRunRunnerCreditGain ?? 0) +
      gainedCredits,
    gainedCredits:
      Number(legalAction.payload?.gainedCredits ?? 0) + gainedCredits,
    karlSuccessfulRunCreditGain: gainedCredits,
    karlSuccessfulRunSourceDefinitionIds: sourceDefinitionIds.sort().join(","),
    runnerCreditsAfter: state.runner.credits,
  };
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

function privateLookCardIds(
  state: GameState,
  zone: Extract<ServerId, "rd" | "hq">,
  count: number | "all",
): CardInstanceId[] {
  const ids = zone === "rd" ? state.corp.rd : state.corp.hq;
  const limit =
    count === "all" ? ids.length : Math.min(Math.max(0, Math.floor(count)), ids.length);
  return ids.slice(0, limit);
}

function startRunnerPrivateLookChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  zone: Extract<ServerId, "rd" | "hq">,
  count: number | "all",
  reason: "ability" | "successful_run" | "post_access",
  legalAction?: LegalAction,
): boolean {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const cardIds = privateLookCardIds(state, zone, count);
  if (cardIds.length === 0) return false;
  const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
  state.pendingChoice = {
    choiceId: `p3_33_private_look_${zone}_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_33.private_look:${reason}:${sourceCardId}:${zone}:${state.stateVersion + 1}`,
    prompt:
      zone === "rd"
        ? `R&D ansehen (${cardIds.length})`
        : `HQ ansehen (${cardIds.length})`,
    kind: "select_cards",
    options: [
      ...cardIds.map((cardId, index) => ({
        id: `card_${cardId}`,
        label: definitionFor(state, cardId).title,
        publicLabel: "Verdeckte Korp-Karte",
        value: cardId,
        selectable: false,
      })),
      { id: "done", label: "Fertig", publicLabel: "Fertig", value: "done" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_33_private_look",
      privateLookZone: zone,
      privateLookCount: cardIds.length,
      sourceDefinitionId,
      ...(sourceDefinition ? { sourceTitle: sourceDefinition.title } : {}),
    };
  }
  return true;
}

function resolveRunnerPrivateLookChoice(
  state: GameState,
  legalAction: LegalAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_33.private_look"))
    throw new Error("Es ist keine private Look-Choice offen.");
  const [, reason, sourceCardId, zone] = choice.source.split(":");
  if (zone !== "rd" && zone !== "hq")
    throw new Error("Die private Look-Zone ist ungueltig.");
  if (
    reason === "ability" &&
    (!sourceCardId || !runnerInstalledCardIds(state).includes(sourceCardId))
  )
    throw new Error("Die private Look-Quelle ist nicht mehr installiert.");
  const privateLookCount = choice.options.filter((option) =>
    option.id.startsWith("card_"),
  ).length;
  const knownPrivateLookDefinitionIds = choice.options
    .filter((option) => option.id.startsWith("card_"))
    .map((option) =>
      typeof option.value === "string" &&
      state.cardInstances[option.value]
        ? definitionFor(state, option.value).id
        : undefined,
    )
    .filter((definitionId): definitionId is CardDefinitionId =>
      Boolean(definitionId),
    );
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_33_private_look",
    privateLookZone: zone,
    privateLookCount,
    ...(knownPrivateLookDefinitionIds.length > 0
      ? {
          knownPrivateLookDefinitionIdsCsv:
            knownPrivateLookDefinitionIds.join("|"),
        }
      : {}),
    ...(sourceCardId ? { cardId: sourceCardId } : {}),
    ...(sourceCardId && state.cardInstances[sourceCardId]
      ? {
          sourceDefinitionId: definitionFor(state, sourceCardId).id,
          sourceTitle: definitionFor(state, sourceCardId).title,
        }
      : {}),
  };
  if (reason === "successful_run" || reason === "post_access")
    finishRun(state, true, legalAction);
}

function startExpertScheduleAnalyzerPostAccessChoice(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): boolean {
  const breach = run.breach;
  if (!breach || breach.serverId !== "hq" || !breach.completed) return false;
  if (breach.accessedSummaries.length === 0) return false;
  const sourceCardId = state.runner.rig.programs
    .slice()
    .sort()
    .find((cardId) =>
      cardImplementationForDefinitionId(definitionFor(state, cardId).id)
        ?.accessHooks?.some(
          (hook) =>
            hook.kind === "post_access_private_look" &&
            hook.afterAccessServer === "hq" &&
            hook.lookZone === "hq",
        ),
    );
  if (!sourceCardId) return false;
  return startRunnerPrivateLookChoice(
    state,
    sourceCardId,
    definitionFor(state, sourceCardId).id,
    "hq",
    "all",
    "post_access",
    legalAction,
  );
}

function v1915InstalledRevealHelperIds(state: GameState): CardDefinitionId[] {
  const helperIds = [MYSTERY_BOX_ID, SMARTEYE_ID];
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

function trashResource(
  state: GameState,
  cardId: string,
  legalAction?: LegalAction,
): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
  const resolvedCardId =
    state.runner.rig.resources.includes(cardId)
      ? cardId
      : resolveHiddenRunnerResourceSlot(state, cardId);
  if (!resolvedCardId || !state.runner.rig.resources.includes(resolvedCardId))
    throw new Error("Diese Resource ist nicht installiert.");
  const definition = definitionFor(state, resolvedCardId);
  if (definition.type !== "resource")
    throw new Error("Nur installierte Resources koennen getrasht werden.");
  const wasConcealedHiddenResource = isConcealedRunnerResource(
    state,
    resolvedCardId,
  );
  const hiddenResourceSlotId = hiddenRunnerResourceSlotId(resolvedCardId);
  spendClick(state, "corp");
  spendCredits(state, "corp", 2);
  trashRunnerInstalledCardToHeap(state, resolvedCardId, legalAction);
  if (legalAction && wasConcealedHiddenResource) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId: hiddenResourceSlotId,
      resourceSlotId: hiddenResourceSlotId,
      hiddenResourceSlotId,
      hiddenRunnerResource: true,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: definition.id,
      redactedKind: "hidden_runner_resource",
    };
  }
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

function resolveTrashInstalledProgramSubroutine(
  state: GameState,
  legalAction?: LegalAction,
): { definitionId: string; title: string } | undefined {
  const targetProgramId = pickRunnerProgramForUninstall(state);
  if (!targetProgramId) return undefined;
  const targetDefinition = definitionFor(state, targetProgramId);
  const targetDefinitionId = targetDefinition.id;
  if (
    legalAction &&
    openRunnerInstalledTrashPreventionWindow(
      state,
      legalAction,
      [targetProgramId],
      "trash_program_subroutine",
    )
  )
    return undefined;
  trashRunnerInstalledProgram(state, targetProgramId);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      trashedCardDefinitionId: targetDefinitionId,
      trashedCardType: "program",
      trashedCount: 1,
    };
  }
  return { definitionId: targetDefinitionId, title: targetDefinition.title };
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
  if (eligible.length === 0) return [];
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
    runnerUtilityLongtailKindForDefinition(hostDefinition.id) ===
      "microtech_backup_drive_program_trash_replacement" ||
    hostDefinition.id === MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID
  )
    return false;
  return true;
}

function trashRunnerInstalledCardToHeap(
  state: GameState,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
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
  executeCardImplementationLifecycleEffects(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
    definition,
    cardId,
    "on_leave_play",
  );
  for (const hostedId of hostedCardsOn(state, cardId)) {
    const hostedDefinition = definitionFor(state, hostedId);
    if (hostedDefinition.type === "program")
      trashRunnerInstalledProgram(state, hostedId);
  }
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  if (
    definition.type === "hardware" &&
    !hasCardImplementationMemoryUnitModifier(definition) &&
    (definition.memoryLimitBonus ?? 0) > 0
  )
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

function returnRunnerInstalledCardToGrip(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const definition = definitionFor(state, cardId);
  if (!runnerInstalledCardIds(state).includes(cardId)) return;
  if (definition.type === "program" && runnerProgramUsesMemory(state, cardId)) {
    state.runner.memoryUsed = Math.max(
      0,
      state.runner.memoryUsed - (definition.memoryCost ?? 0),
    );
  }
  if (
    definition.type === "hardware" &&
    !hasCardImplementationMemoryUnitModifier(definition) &&
    (definition.memoryLimitBonus ?? 0) > 0
  )
    state.runner.memoryLimit = Math.max(
      0,
      state.runner.memoryLimit - (definition.memoryLimitBonus ?? 0),
    );
  const instance = mustInstance(state.cardInstances, cardId);
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    ...withoutHost,
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "grip" },
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
  const sourceServerId =
    instance.zone.side === "corp" && instance.zone.zone === "serverRoot"
      ? instance.zone.serverId
      : undefined;
  const leavesFortCapacityModifier = leavePlayCleanupImplementationsForCard(
    state,
    cardId,
  ).some(
    (cleanup) =>
      cleanup.kind === "trash_agenda_or_node_if_fort_over_capacity" &&
      cleanup.target === "agenda_or_node_inside_same_fort",
  );
  const rezzedNevinyrralLeftPlay =
    (uniqueDirectLongtailKindForDefinition(definition.id) ===
      "nevinyrral_action_and_lose_on_rezzed_leave" ||
      (definition.id === NEVINYRRAL_ID &&
        !cardImplementationForDefinitionId(definition.id))) &&
    instance.rezzed === true;
  const { hostedOn: _hostedOn, ...withoutHost } = instance;
  void _hostedOn;
  removeFromAllZones(state, cardId);
  state.corp.archives.push(cardId);
  state.cardInstances[cardId] = {
    ...withoutProteusVariableIceState(withoutHost),
    faceup: true,
    rezzed: true,
    zone: { side: "corp", zone: "archives" },
  };
  clearCardCounters(state, cardId);
  if (sourceServerId && leavesFortCapacityModifier) {
    cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(
      state,
      sourceServerId,
      definition.id,
      legalAction,
    );
  }
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
        sourceDefinitionId: definition.id,
      };
    }
  }
}

function cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  sourceDefinitionId: CardDefinitionId,
  legalAction?: LegalAction,
): void {
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) return;
  const capacity = corpRootAgendaOrNodeCapacityInServer(state, server);
  const mainIds = corpRootMainCardIdsInServer(state, server);
  if (mainIds.length <= capacity) return;
  const targetId = mainIds[0];
  if (!targetId) return;
  const targetDefinition = definitionFor(state, targetId);
  if (legalAction) {
    const effectIndex = legalAction.resolvedEffects?.length ?? 0;
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      {
        effectId: `corp.fort_capacity_cleanup.${server.id}.${effectIndex}`,
        kind: "trash_card",
        visibility: "public",
        side: "corp",
        reason: "fort_capacity_exceeded",
        serverId: server.id,
        serverLabel: server.label,
        sourceDefinitionId,
        sourceTitle: publicCardTitle(sourceDefinitionId),
        cardDefinitionId: targetDefinition.id,
        cardTitle: targetDefinition.title,
      },
    ];
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      namatokiCleanupTrash: true,
      namatokiCleanupTrashedCardDefinitionId: targetDefinition.id,
      fortCapacityAfter: capacity,
      fortAgendaNodeCountBeforeCleanup: mainIds.length,
    };
  }
  trashCorpInstalledCardToArchives(state, targetId, legalAction);
}

function trashOlderRegionUpgradesInServer(
  state: GameState,
  server: CorpServer,
  keepCardId: CardInstanceId,
  legalAction?: LegalAction,
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
  for (const cardId of olderRegions) {
    appendRegionReplacementTrashEffect(state, server, keepCardId, cardId, legalAction);
    trashCorpInstalledCardToArchives(state, cardId);
  }
}

function appendRegionReplacementTrashEffect(
  state: GameState,
  server: CorpServer,
  sourceCardId: CardInstanceId,
  trashedCardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  if (!legalAction) return;
  const sourceDefinition = definitionFor(state, sourceCardId);
  const trashedInstance = mustInstance(state.cardInstances, trashedCardId);
  const trashedDefinition = definitionFor(state, trashedCardId);
  const trashedRegionWasPublic =
    trashedInstance.faceup === true || trashedInstance.rezzed === true;
  const effectIndex = legalAction.resolvedEffects?.length ?? 0;
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: `corp.region_replacement.${server.id}.${effectIndex}`,
      kind: "trash_card",
      visibility: "public",
      side: "corp",
      reason: "region_limit",
      serverId: server.id,
      serverLabel: server.label,
      sourceDefinitionId: sourceDefinition.id,
      sourceTitle: sourceDefinition.title,
      ...(trashedRegionWasPublic ? {} : { redactedKind: "installed_card" }),
      ...(trashedRegionWasPublic
        ? {
            cardDefinitionId: trashedDefinition.id,
            cardTitle: trashedDefinition.title,
          }
        : {}),
    },
  ];
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
        isRovingRunRestrictionSource(state, cardId)
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
      "Roving Submarine erlaubt Runs auf dieses Remote nur nach Korp-Aktivitaet im letzten Korpzug.",
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
    return instance.rezzed && isTokyoUnsuccessfulRunSource(state, cardId);
  });
  return sourceCardId
    ? {
        amount: tokyoUnsuccessfulRunWindowForCard(state, sourceCardId)?.amount ?? 2,
        sourceCardId,
      }
    : { amount: 0 };
}

function finishRun(
  state: GameState,
  successful: boolean,
  legalAction?: LegalAction,
): void {
  const run = state.run;
  if (run) clearEncounterTemporaryTraceCredits(run, legalAction);
  if (run) applyDupreRunEndCounters(state, run);
  if (run) derezOliviaSalazarTemporaryIce(state, run, legalAction);
  if (run && successful)
    applyV181SuccessfulRunCounterTriggers(state, run, legalAction);
  if (run && successful) {
    applyBodyweightDataCrecheSuccessfulRun(state, run, legalAction);
  }
  if (run && successful) {
    const flags = ensureRunnerTurnFlags(state);
    flags.successfulRunThisTurn = true;
    flags.lastSuccessfulRunServerId = run.attackedServerId;
    if (run.attackedServerId === "hq") flags.successfulHqRunThisTurn = true;
  }
  const allNighterBonusRunOnFinish =
    run?.grantAllNighterBonusRunOnFinish === true;
  const bonus = successful ? (run?.pendingSuccessBonusCredits ?? 0) : 0;
  const corpBonus = tokyoChibaUnsuccessfulRunBonus(state, run, successful);
  if (run?.delayedSuccessfulRun?.temporaryIceId) {
    const temporaryIceId = run.delayedSuccessfulRun.temporaryIceId;
    const instance = state.cardInstances[temporaryIceId];
    if (instance?.zone.side === "corp" && instance.zone.zone === "serverIce") {
      trashCorpInstalledCardToArchives(state, temporaryIceId, legalAction);
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          temporaryEncounterTrashed: true,
        };
      }
    }
  }
  state.runner.credits += bonus;
  state.corp.credits += corpBonus.amount;
  if (run && corpBonus.amount > 0 && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      tokyoChibaInfightingBonus: true,
      sourceDefinitionId: corpBonus.sourceCardId
        ? definitionFor(state, corpBonus.sourceCardId).id
        : TOKYO_CHIBA_INFIGHTING_FALLBACK_SOURCE,
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
  applyRunnerRunTemporaryCreditCleanupAndDamage(state, run, legalAction);
  resetBreakerStrength(state);
  delete state.run;
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.activeSide = "runner";
  consumeRunnerFutureActionDebt(state);
  cleanupEmptyRemotes(state);
}

function applyRunnerRunTemporaryCreditCleanupAndDamage(
  state: GameState,
  run: ActiveRun | undefined,
  legalAction?: LegalAction,
): void {
  if (!run) return;
  const runTemporaryCredits = run.runnerRunTemporaryCredits;
  const unpreventableCoreDamage = run.unpreventableCoreDamageAtRunEnd;
  if (!runTemporaryCredits && !unpreventableCoreDamage) return;
  const unusedTemporaryCredits = runTemporaryCredits?.remaining ?? 0;
  let damageSummary: DamageSummary | undefined;
  if (unpreventableCoreDamage && unpreventableCoreDamage.amount > 0) {
    damageSummary = doDamage(state, {
      damageId: `${run.runId}.${unpreventableCoreDamage.sourceDefinitionId}.run_end_unpreventable_core`,
      damageType: "core",
      amount: unpreventableCoreDamage.amount,
      source: `run_end:${unpreventableCoreDamage.sourceDefinitionId}`,
    });
  }
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...(runTemporaryCredits
      ? {
          temporaryRunCreditsReturned: unusedTemporaryCredits,
          temporaryRunCreditsRemaining: 0,
        }
      : {}),
    ...(damageSummary
      ? {
          damageCannotBePrevented: true,
          damageResolved: true,
          damageType: damageSummary.damageType,
          damageAmount: damageSummary.amount,
          cardsTrashed: damageSummary.cardsTrashed,
          flatline: damageSummary.flatline,
          ...(damageSummary.coreDamageAfter !== undefined
            ? { coreDamageAfter: damageSummary.coreDamageAfter }
            : {}),
          ...(damageSummary.runnerMaxHandSizeAfter !== undefined
            ? { runnerMaxHandSizeAfter: damageSummary.runnerMaxHandSizeAfter }
            : {}),
        }
      : {}),
  };
}

function derezOliviaSalazarTemporaryIce(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const iceIds = [...new Set(run.oliviaSalazarTemporaryRezzedIceIds ?? [])].sort();
  let derezzedCount = 0;
  for (const iceId of iceIds) {
    const instance = state.cardInstances[iceId];
    if (!instance?.rezzed) continue;
    if (
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.zone.serverId !== run.attackedServerId
    )
      continue;
    state.cardInstances[iceId] = {
      ...withoutProteusVariableIceState(instance),
      faceup: false,
      rezzed: false,
    };
    derezzedCount += 1;
  }
  if (derezzedCount > 0 && legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      oliviaSalazarRunEndDerez: true,
      derezzedCount,
    };
  }
}

function applyDupreRunEndCounters(state: GameState, run: ActiveRun): void {
  const usedBreakerIds = run.dupreUsedBreakerIdsThisRun?.slice().sort() ?? [];
  for (const breakerId of usedBreakerIds) {
    const instance = state.cardInstances[breakerId];
    if (!instance || !state.runner.rig.programs.includes(breakerId)) continue;
    if (!icebreakerHasSpecial(state, breakerId, "dupre_strength_counter_and_last_fort"))
      continue;
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

function applyBodyweightDataCrecheSuccessfulRun(
  state: GameState,
  _run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const sourceId = state.runner.rig.hardware
    .slice()
    .sort()
    .find((cardId) => {
      const definition = definitionFor(state, cardId);
      const implementation = cardImplementationForDefinitionId(definition.id);
      return implementation?.successfulRunFollowups?.some(
        (followup) => followup.kind === "optional_make_run_after_successful_run",
      );
    });
  if (!sourceId) return;
  const sourceDefinitionId = definitionFor(state, sourceId).id;
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
      sourceDefinitionId,
    };
  }
}

function applyV181SuccessfulRunCounterTriggers(
  state: GameState,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const sourceIds = installedRunnerVirusSourceIds(
    state,
    (implementation) =>
      implementation.addOnSuccessfulRun !== undefined &&
      successfulRunMatchesVirusTrigger(state, run, implementation),
  );
  const pattelSources = sourceIds.filter(
    (cardId) =>
      virusCounterImplementationForCard(state, cardId)?.addOnSuccessfulRun
        ?.target === "chosen_fully_broken_ice",
  );
  if (pattelSources.length > 0) {
    const targetIceIds = (run.fullyBrokenIceIds ?? []).filter(
      (targetIceId) => state.cardInstances[targetIceId],
    );
    if (targetIceIds.length === 1) {
      const targetIceId = targetIceIds[0]!;
      const added = addVirusCounterWithDisinfectantPrevention(
        state,
        targetIceId,
        pattelSources.length,
        legalAction,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v181RunnerProgramAbility: "pattels_virus_counter",
          pattelsVirusCounterAdded: added,
          targetCardDefinitionId: definitionFor(state, targetIceId).id,
          remainingCounters: cardCounter(state, targetIceId, "virus"),
        };
      }
    } else if (targetIceIds.length > 1) {
      startPattelsVirusCounterChoice(
        state,
        targetIceIds,
        legalAction,
        pattelSources.length,
      );
    }
  }

  for (const cardId of sourceIds) {
    const implementation = virusCounterImplementationForCard(state, cardId);
    const trigger = implementation?.addOnSuccessfulRun;
    if (!implementation || !trigger || trigger.target === "chosen_fully_broken_ice")
      continue;
    const definition = definitionFor(state, cardId);
    if (trigger.target === "source") {
      const added = addVirusCounterWithDisinfectantPrevention(
        state,
        cardId,
        trigger.amount,
        legalAction,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "source",
          sourceDefinitionId: definition.id,
          virusCountersAfter: cardCounter(state, cardId, "virus"),
        };
      }
      continue;
    }
    const serverId = run.attackedServerId;
    if (implementation.counterKind === "pox") {
      const current = poxCountersForServer(state, serverId);
      const added = preventOneVirusCounterWithDisinfectant(state).prevented
        ? 0
        : trigger.amount;
      state.poxCountersByServer = {
        ...(state.poxCountersByServer ?? {}),
        [serverId]: current + added,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          v181RunnerProgramAbility: "pox_counter",
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "server",
          sourceDefinitionId: definition.id,
          poxCounterAdded: added,
          poxCountersAfter: current + added,
          targetServerLabel: publicServerLabel(state, serverId) ?? serverId,
        };
      }
      continue;
    }
    if (implementation.counterKind === "fait") {
      const current = Math.max(
        0,
        Math.floor(state.faitAccompliCountersByServer?.[serverId] ?? 0),
      );
      const added = preventOneVirusCounterWithDisinfectant(state).prevented
        ? 0
        : trigger.amount;
      state.faitAccompliCountersByServer = {
        ...(state.faitAccompliCountersByServer ?? {}),
        [serverId]: current + added,
      };
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          virusCounterAdded: added,
          virusCounterType: implementation.counterKind,
          virusCounterLocation: "server",
          sourceDefinitionId: definition.id,
          faitCounterAdded: added,
          faitCountersAfter: current + added,
          targetServerLabel: publicServerLabel(state, serverId) ?? serverId,
        };
      }
    }
  }
}

function successfulRunMatchesVirusTrigger(
  state: GameState,
  run: ActiveRun,
  implementation: CardVirusCounterImplementation,
): boolean {
  const trigger = implementation.addOnSuccessfulRun;
  if (!trigger) return false;
  if (trigger.server === "any") return true;
  if (trigger.server === "hq" || trigger.server === "rd")
    return run.attackedServerId === trigger.server;
  if (trigger.server === "subsidiary_data_fort") {
    return mustServer(state, run.attackedServerId).kind === "remote";
  }
  return false;
}

function startPattelsVirusCounterChoice(
  state: GameState,
  targetIceIds: CardInstanceId[],
  legalAction?: LegalAction,
  amount = 1,
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
    source: `v181.pattels_virus:${options.map((option) => option.value).join(",")}:${state.stateVersion + 1}:amount=${amount}`,
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
      pattelsVirusCounterAmount: amount,
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
  const amount = Math.max(
    1,
    Math.floor(Number(choice.source.match(/amount=(\d+)/)?.[1] ?? 1)),
  );
  const added = addVirusCounterWithDisinfectantPrevention(
    state,
    targetIceId,
    amount,
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v181RunnerProgramAbility: "pattels_virus_counter",
    pattelsVirusCounterAdded: added,
    targetCardDefinitionId: definitionFor(state, targetIceId).id,
    remainingCounters: cardCounter(state, targetIceId, "virus"),
    choiceVisibility: "public",
  };
  delete state.pendingChoice;
}

function resolveOmniscienceFoundationEndTurnTag(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.runnerTurnFlags?.runnerReceivedTagThisTurn !== true) return;
  const sourceIds = rezzedCorpRootCardIds(state)
    .filter((cardId) =>
      hasCorpUtilityKind(state, cardId, "omniscience_foundation_end_turn_tag"),
    )
    .sort();
  if (sourceIds.length === 0) return;
  const tagsBefore = state.runner.tags;
  for (const _sourceId of sourceIds) {
    addRunnerTagsWithPrevention(state, legalAction, 1, "omniscience_foundation");
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1951CorpUtilityAbility: "omniscience_foundation_end_turn_tag",
    omniscienceFoundationTagsAdded: Math.max(0, state.runner.tags - tagsBefore),
    sourceCount: sourceIds.length,
    runnerTagsAfter: state.runner.tags,
  };
}

function resolveFieldReporterEndOfRunnerTurn(
  state: GameState,
  legalAction: LegalAction,
): void {
  const sourceIds = state.runner.rig.resources
    .slice()
    .sort()
    .filter(
      (cardId) =>
        runnerUtilityLongtailKindForCard(state, cardId) ===
        "field_reporter_end_turn_rezzed_ice_payout",
    );
  if (sourceIds.length === 0) return;
  const rezzedIceCount = Math.max(
    0,
    Math.floor(ensureRunnerTurnFlags(state).corpRezzedIceThisTurn ?? 0),
  );
  if (rezzedIceCount <= 0) return;
  let gained = 0;
  for (const sourceId of sourceIds) {
    const implementation = runnerUtilityLongtailImplementationForCard(
      state,
      sourceId,
    );
    if (
      implementation?.kind !==
      "field_reporter_end_turn_rezzed_ice_payout"
    )
      continue;
    gained += rezzedIceCount * implementation.amountPerRezzedIce;
  }
  if (gained <= 0) return;
  credits(state, "runner", gained);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerUtilityAbility: "field_reporter_end_turn_rezzed_ice_payout",
    corpRezzedIceThisTurnCount: rezzedIceCount,
    gainedCredits: gained,
    runnerCreditsAfter: state.runner.credits,
    sourceDefinitionId: definitionFor(state, sourceIds[0]!).id,
    sourceCount: sourceIds.length,
  };
}

function resolvePreyingMantisEndOfRunnerTurnDamage(
  state: GameState,
  legalAction: LegalAction,
): void {
  const dueSourceIds =
    ensureRunnerTurnFlags(state).preyingMantisDamageDueSourceIdsThisTurn ?? [];
  if (dueSourceIds.length === 0) return;
  const damageSummary = doDamage(state, {
    damageId: `runner.end.preying_mantis.${state.stateVersion}`,
    damageType: "core",
    amount: dueSourceIds.length,
    source: "runner_end:preying_mantis",
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerUtilityAbility: "preying_mantis_end_turn_damage",
    damageCannotBePrevented: true,
    damageResolved: true,
    damageType: damageSummary.damageType,
    damageAmount: damageSummary.amount,
    cardsTrashed: damageSummary.cardsTrashed,
    flatline: damageSummary.flatline,
    sourceDefinitionId: definitionFor(state, dueSourceIds[0]!).id,
    sourceCount: dueSourceIds.length,
    ...(damageSummary.coreDamageAfter !== undefined
      ? { coreDamageAfter: damageSummary.coreDamageAfter }
      : {}),
  };
  ensureRunnerTurnFlags(state).preyingMantisDamageDueSourceIdsThisTurn = [];
}

function endTurn(
  state: GameState,
  side: Side,
  legalAction: LegalAction,
): void {
  if (side === "runner") {
    resolveCardImplementationEndOfRunnerTurnAction(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
    );
    if (state.winner) return;
    resolveFieldReporterEndOfRunnerTurn(state, legalAction);
    resolvePreyingMantisEndOfRunnerTurnDamage(state, legalAction);
    resolveOmniscienceFoundationEndTurnTag(state, legalAction);
    resolveSneakPreviewTemporaryInstallReturns(state, legalAction);
    const flags = ensureRunnerTurnFlags(state);
    flags.stoleAgendaLastTurn = flags.stoleAgendaThisTurn;
    flags.stolenAgendaAdvancementCountersLastTurn =
      flags.stolenAgendaAdvancementCountersThisTurn ?? 0;
    flags.stoleAgendaThisTurn = false;
    flags.stolenAgendaAdvancementCountersThisTurn = 0;
    flags.runnerReceivedTagThisTurn = false;
    flags.stoleResearchAgendaThisTurn = false;
    flags.stoleGrayOpsAgendaThisTurn = false;
    flags.stoleBlackOpsAgendaThisTurn = false;
    flags.runAttemptsLastTurn = flags.runAttemptsThisTurn ?? 0;
    flags.runAttemptsThisTurn = 0;
    flags.successfulHqRunThisTurn = false;
    flags.successfulRunThisTurn = false;
    delete flags.lastSuccessfulRunServerId;
    flags.runnerActionsTakenThisTurn = 0;
    delete flags.lastDamageRunnerActionOrdinal;
  } else {
    resolveOmniscienceFoundationEndTurnTag(state, legalAction);
    const corpFlags = ensureCorpTurnFlags(state);
    corpFlags.scoredBlackOpsAgendaLastTurn =
      corpFlags.scoredBlackOpsAgendaThisTurn;
    corpFlags.scoredBlackOpsAgendaThisTurn = false;
    resolveAcmeSavingsAndLoanEndOfCorpTurn(state, legalAction);
    if (state.winner) return;
    ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = false;
  }
  delete state.cancelledDamagePreventionSourceIdsUntilEndOfTurn;
  startDiscardPhase(state, side, legalAction);
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
  ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = false;
  ensureRunnerTurnFlags(state).corpRezzedIceThisTurn = 0;
  ensureCorpTurnFlags(state).disinfectantUsedSourceIdsThisTurn = [];
  ensureCorpTurnFlags(state).employeeEmpowermentStartTurnResolvedSourceIds = [];
  applyCorpStartOfTurnEffects(state, effects);
}

function startRunnerTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = runnerActionsPerTurn(state);
  if (state.runnerTurnFlags?.questForCattekinPermanentActionGain)
    state.runner.clicks += 1;
  state.corp.clicks = 0;
  clearEdgerunnerTempsInstallFlags(state);
  const flags = ensureRunnerTurnFlags(state);
  flags.stoleAgendaThisTurn = false;
  flags.stoleAgendaLastTurn = false;
  flags.stolenAgendaAdvancementCountersThisTurn = 0;
  flags.stolenAgendaAdvancementCountersLastTurn = 0;
  flags.runnerReceivedTagThisTurn = false;
  flags.stoleResearchAgendaThisTurn = false;
  flags.stoleGrayOpsAgendaThisTurn = false;
  flags.stoleBlackOpsAgendaThisTurn = false;
  flags.runAttemptsThisTurn = 0;
  flags.runAttemptsLastTurn = 0;
  flags.successfulHqRunThisTurn = false;
  flags.successfulRunThisTurn = false;
  delete flags.lastSuccessfulRunServerId;
  flags.damagePreventionUsage = {};
  flags.brokerActionCardIdsThisTurn = [];
  flags.startOfTurnFloatingCreditsApplied = false;
  flags.allNighterBonusRunPending = false;
  flags.valuPakProgramInstallActionsRemaining = 0;
  flags.valuPakTemporaryProgramInstallCredits = 0;
  flags.shellTradersStartTurnResolvedSourceIds = [];
  flags.bodyweightDataCrecheExtraRunPending = false;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn = false;
  flags.startupImmolatorUsedSourceIdsThisTurn = [];
  flags.preyingMantisUsedSourceIdsThisTurn = [];
  flags.preyingMantisDamageDueSourceIdsThisTurn = [];
  flags.corpRezzedIceThisTurn = 0;
  ensureCorpTurnFlags(state).disinfectantUsedSourceIdsThisTurn = [];
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
  const skivvissDraws = virusCounterDrawsAtCorpStart(state);
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
  const cascadeTrash = virusCounterCascadeTrashAtCorpStart(state);
  if (cascadeTrash.amount > 0) {
    if (!cascadeTrash.sourceDefinitionId)
      throw new Error("Cascade-Virus-Quelle fehlt.");
    const trashed = trashFaceupRdCardsForCascade(state, cascadeTrash.amount);
    if (trashed.length > 0) {
      effects?.push({
        effectId: "corp.start.cascade.trash_faceup_rd",
        kind: "trash_card",
        visibility: "hidden_info_barrier",
        side: "corp",
        amount: trashed.length,
        reason: "start_of_turn",
        sourceDefinitionId: cascadeTrash.sourceDefinitionId,
        sourceTitle: publicCardTitle(cascadeTrash.sourceDefinitionId),
        cardDefinitionId: definitionFor(state, trashed[0]!).id,
        cardTitle: publicCardTitle(definitionFor(state, trashed[0]!).id),
      });
    }
  }
  executeCardImplementationStartOfCorpTurnEffects(
    cardImplementationRuntimeDeps,
    state,
    effects,
  );
  for (const cardId of rezzedCorpRootCardIds(state)) {
    const definitionId = definitionFor(state, cardId).id;
    if (
      (definitionId === KRUMZ_TRACE_ASSET_CARD_ID ||
        hasCorpUtilityKind(state, cardId, "krumz_trace_bit")) &&
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
    if (isParisTracePoolSource(state, cardId)) {
      const capacity = parisTracePoolCapacityForCard(state, cardId);
      if (cardCounter(state, cardId, "bit") < capacity)
        setCardCounter(state, cardId, "bit", capacity);
    }
    if (isInvestmentFirmCard(state, cardId)) {
      if (cardCounter(state, cardId, "recurring_credit") > 0) {
        spendCardCounter(state, cardId, "recurring_credit", 1);
        credits(state, "corp", 1);
        const remainingCounters = cardCounter(state, cardId, "recurring_credit");
        effects?.push(
          automaticGainCreditsEffect(
            `corp.start.investment_firm.${cardId}`,
            "corp",
            1,
            definitionId,
          ),
        );
        effects?.push({
          effectId: `corp.start.investment_firm.counter.${cardId}`,
          kind: "counter_change",
          visibility: "public",
          side: "corp",
          amount: remainingCounters,
          reason: "start_of_turn",
          counterType: "recurring_credit",
          removedCounterAmount: 1,
          remainingCounters,
          sourceDefinitionId: definitionId,
          sourceTitle: publicCardTitle(definitionId),
        });
      }
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
  if (!state.pendingChoice)
    startCorporateNegotiatingCenterChoice(
      corpZoneChoiceHandlerHost(
        state,
        { side: "corp", payload: {} } as LegalAction,
      ),
    );
  if (!state.pendingChoice)
    startEmployeeEmpowermentStartDrawChoice(scoredAgendaFlowHost(state));
}

function virusCounterDrawsAtCorpStart(state: GameState): number {
  return Object.keys(state.cardInstances).reduce((sum, cardId) => {
    const implementation = virusCounterImplementationForCard(state, cardId);
    const start = implementation?.startOfCorpTurn;
    if (start?.kind !== "draw_extra_cards_per_counter") return sum;
    return sum + cardCounter(state, cardId, "virus") * start.amountPerCounter;
  }, 0);
}

function skivvissCounterTotal(state: GameState): number {
  return Object.keys(state.cardInstances).reduce((sum, cardId) => {
    if (definitionFor(state, cardId).id !== SKIVVISS_ID) return sum;
    return sum + cardCounter(state, cardId, "virus");
  }, 0);
}

function virusCounterCascadeTrashAtCorpStart(state: GameState): {
  amount: number;
  sourceDefinitionId?: CardDefinitionId;
} {
  return Object.keys(state.cardInstances).reduce((result, cardId) => {
    const implementation = virusCounterImplementationForCard(state, cardId);
    const start = implementation?.startOfCorpTurn;
    if (start?.kind !== "trash_faceup_rd_cards_per_two_counters") return result;
    const amount =
      Math.floor(cardCounter(state, cardId, "virus") / start.perCounters) *
      start.countPerGroup;
    return {
      amount: result.amount + amount,
      sourceDefinitionId:
        result.sourceDefinitionId ?? definitionFor(state, cardId).id,
    };
  }, { amount: 0 } as { amount: number; sourceDefinitionId?: CardDefinitionId });
}

function trashFaceupRdCardsForCascade(
  state: GameState,
  maxCount: number,
): CardInstanceId[] {
  const selected = state.corp.rd
    .filter((cardId) => state.cardInstances[cardId]?.faceup === true)
    .slice(0, Math.max(0, Math.floor(maxCount)));
  for (const cardId of selected) {
    removeFromAllZones(state, cardId);
    state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
  }
  return selected;
}

function applyRunnerStartOfTurnEffects(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const flags = ensureRunnerTurnFlags(state);
  for (const counterEffect of runnerTraceCounterEffectDefinitions()) {
    if (!counterEffect.startOfRunnerTurn) continue;
    const counterCount = cardCounter(
      state,
      state.runner.identity,
      counterEffect.counterType,
    );
    if (counterCount <= 0) continue;
    const tagsAdded =
      counterCount * counterEffect.startOfRunnerTurn.amountPerCounter;
    state.runner.tags += tagsAdded;
    effects?.push(
      automaticTagEffect(
        `runner.start.${counterEffect.counterType}`,
        tagsAdded,
        counterEffect.sourceDefinitionId,
      ),
    );
  }
  executeCardImplementationStartOfRunnerTurnEffects(
    cardImplementationRuntimeDeps,
    state,
    effects,
  );
  applyQuestForCattekinStartOfTurn(state, effects);
  if (!flags.startOfTurnFloatingCreditsApplied) {
    const virusCredits = virusCounterCreditsAtRunnerStart(state);
    if (virusCredits.amount > 0) {
      if (!virusCredits.sourceDefinitionId)
        throw new Error("Virus-Credit-Quelle fehlt.");
      credits(state, "runner", virusCredits.amount);
      effects?.push(
        automaticGainCreditsEffect(
          "runner.start.virus_counter_credits",
          "runner",
          virusCredits.amount,
          virusCredits.sourceDefinitionId,
        ),
      );
    }
    flags.startOfTurnFloatingCreditsApplied = true;
  }
  applyShellTradersStartOfTurn(state, effects);
  if (state.pendingChoice) return;
  if (queueIncubatorStartOfTurnTransforms(state)) return;
  if (startVirusCounterRunnerPrivateLookAtStart(state)) return;
  for (const cardId of state.runner.rig.resources.slice().sort()) {
    if (state.pendingChoice) break;
    if (
      uniqueDirectLongtailKindForCard(state, cardId) ===
      "smiths_pawnshop_start_turn_trash_for_credits"
    )
      startSmithsPawnshopChoice(
        hiddenZoneNonSearchChoiceHandlerHost(state, {
          side: "runner",
          payload: {},
        } as LegalAction),
        cardId,
      );
  }
}

function applyQuestForCattekinStartOfTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const sourceIds = state.runner.rig.resources
    .slice()
    .sort()
    .filter(
      (cardId) =>
        runnerUtilityLongtailKindForCard(state, cardId) ===
        "quest_for_cattekin_start_turn_random_permanent_action",
    );
  for (const sourceId of sourceIds) {
    const sourceDefinitionId = definitionFor(state, sourceId).id;
    const randomPurpose = `p3_59.die.${sourceDefinitionId}.start_runner_turn.${state.stateVersion}.${sourceId}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    let damageSummary: DamageSummary | undefined;
    if (dieRoll === 6) {
      ensureRunnerTurnFlags(state).questForCattekinPermanentActionGain = true;
      state.runner.clicks += 1;
      trashRunnerInstalledCardToHeap(state, sourceId);
    } else if (dieRoll === 1) {
      damageSummary = doDamage(state, {
        damageId: `runner.start.${sourceDefinitionId}.core.${state.stateVersion}`,
        damageType: "core",
        amount: 1,
        source: `runner_start:${sourceDefinitionId}`,
      });
    } else if (dieRoll === 2) {
      damageSummary = doDamage(state, {
        damageId: `runner.start.${sourceDefinitionId}.net.${state.stateVersion}`,
        damageType: "net",
        amount: 1,
        source: `runner_start:${sourceDefinitionId}`,
      });
    }
    effects?.push({
      effectId: `runner.start.quest_for_cattekin.${sourceId}`,
      kind:
        dieRoll === 6
          ? "gain_actions"
        : dieRoll === 1 || dieRoll === 2
            ? "damage"
            : "counter_change",
      visibility: "public",
      side: "runner",
      amount: dieRoll === 6 ? 1 : damageSummary?.amount ?? 0,
      reason: "start_of_turn",
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
      v1921DieRoll: dieRoll,
      randomPurpose,
      randomCounterAfter: state.randomCounter,
      ...(dieRoll === 6
        ? {
            permanentActionGain: true,
            sourceTrashed: true,
            runnerClicksAfter: state.runner.clicks,
          }
        : {}),
      ...(damageSummary
        ? {
            damageCannotBePrevented: true,
            damageType: damageSummary.damageType,
            cardsTrashed: damageSummary.cardsTrashed,
            flatline: damageSummary.flatline,
            ...(damageSummary.coreDamageAfter !== undefined
              ? { coreDamageAfter: damageSummary.coreDamageAfter }
              : {}),
          }
        : {}),
    } as ResolvedGameEffect);
  }
}

function virusCounterCreditsAtRunnerStart(state: GameState): {
  amount: number;
  sourceDefinitionId?: CardDefinitionId;
} {
  return Object.keys(state.cardInstances).reduce((result, cardId) => {
    const implementation = virusCounterImplementationForCard(state, cardId);
    const start = implementation?.startOfRunnerTurn;
    if (start?.kind !== "gain_credits_per_two_counters") return result;
    const amount =
      Math.floor(cardCounter(state, cardId, "virus") / start.perCounters) *
      start.amountPerGroup;
    return {
      amount: result.amount + amount,
      sourceDefinitionId:
        result.sourceDefinitionId ?? definitionFor(state, cardId).id,
    };
  }, { amount: 0 } as { amount: number; sourceDefinitionId?: CardDefinitionId });
}

function startVirusCounterRunnerPrivateLookAtStart(state: GameState): boolean {
  const boardwalk = Object.keys(state.cardInstances).reduce((result, cardId) => {
    const implementation = virusCounterImplementationForCard(state, cardId);
    const start = implementation?.startOfRunnerTurn;
    if (start?.kind !== "random_reveal_hq_cards_per_two_counters") return result;
    const amount =
      Math.floor(cardCounter(state, cardId, "virus") / start.perCounters) *
      start.countPerGroup;
    return {
      amount: result.amount + amount,
      sourceDefinitionId:
        result.sourceDefinitionId ?? definitionFor(state, cardId).id,
    };
  }, { amount: 0 } as { amount: number; sourceDefinitionId?: CardDefinitionId });
  if (boardwalk.amount > 0 && state.corp.hq.length > 0) {
    const selected = randomCorpHqCardsWithoutReplacement(
      state,
      Math.min(boardwalk.amount, state.corp.hq.length),
      `p3_49.random.boardwalk.hq_reveal.${state.stateVersion}`,
    );
    return startRunnerPrivateLookAtSpecificCorpCards(
      state,
      boardwalk.sourceDefinitionId ?? definitionFor(state, state.runner.identity).id,
      "hq",
      selected,
      "Boardwalk: zufällige HQ-Karten ansehen.",
    );
  }

  const deepThoughtSourceCardId = Object.keys(state.cardInstances).find((cardId) => {
    const implementation = virusCounterImplementationForCard(state, cardId);
    const start = implementation?.startOfRunnerTurn;
    return (
      start?.kind === "private_look_top_rd_at_threshold" &&
      cardCounter(state, cardId, "virus") >= start.threshold
    );
  });
  if (!deepThoughtSourceCardId || state.corp.rd.length === 0) return false;
  return startRunnerPrivateLookChoice(
    state,
    deepThoughtSourceCardId,
    definitionFor(state, deepThoughtSourceCardId).id,
    "rd",
    1,
    "ability",
  );
}

function randomCorpHqCardsWithoutReplacement(
  state: GameState,
  count: number,
  purpose: string,
): CardInstanceId[] {
  const pool = state.corp.hq.slice();
  const selected: CardInstanceId[] = [];
  const limit = Math.min(Math.max(0, Math.floor(count)), pool.length);
  for (let index = 0; index < limit; index += 1) {
    const value = nextRandom(state, `${purpose}.${index}`);
    const selectedIndex = Math.floor(value * pool.length);
    const [cardId] = pool.splice(selectedIndex, 1);
    if (cardId) selected.push(cardId);
  }
  return selected;
}

function startRunnerPrivateLookAtSpecificCorpCards(
  state: GameState,
  sourceDefinitionId: CardDefinitionId,
  zone: Extract<ServerId, "rd" | "hq">,
  cardIds: CardInstanceId[],
  prompt: string,
): boolean {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const visibleIds = cardIds.filter((cardId) => {
    const instance = state.cardInstances[cardId];
    return instance?.owner === "corp";
  });
  if (visibleIds.length === 0) return false;
  state.pendingChoice = {
    choiceId: `p3_49_virus_private_look_${zone}_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_33.private_look:ability:${sourceDefinitionId}:${zone}:${state.stateVersion + 1}`,
    prompt,
    kind: "select_cards",
    options: [
      ...visibleIds.map((cardId) => ({
        id: `card_${cardId}`,
        label: definitionFor(state, cardId).title,
        publicLabel: "Verdeckte Korp-Karte",
        value: cardId,
        selectable: false,
      })),
      { id: "done", label: "Fertig", publicLabel: "Fertig", value: "done" },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  return true;
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

  const faitTargets = state.corp.servers
    .map((server) => ({
      serverId: server.id,
      amount: Math.max(
        0,
        Math.floor(state.faitAccompliCountersByServer?.[server.id] ?? 0),
      ),
    }))
    .filter((entry) => entry.amount > 0)
    .map((entry) => ({
      id: `fait_${entry.serverId}`,
      label: `Fait auf ${publicServerLabel(state, entry.serverId) ?? entry.serverId} (${entry.amount})`,
      publicLabel: "Virus-Counter",
      value: `fait:${entry.serverId}`,
    }));

  const options = [...cardTargets, ...poxTargets, ...faitTargets];
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

function handForSide(state: GameState, side: Side): CardInstanceId[] {
  return side === "corp" ? state.corp.hq : state.runner.grip;
}

function hasCardImplementationMemoryUnitModifier(
  definition: CardDefinition,
): boolean {
  return (
    cardImplementationForDefinitionId(definition.id)?.modifiers?.some(
      (modifier) => modifier.kind === "memory_units",
    ) === true
  );
}

function cardImplementationAgendaPointInstallCost(
  definition: CardDefinition,
): number {
  return (cardImplementationForDefinitionId(definition.id)
    ?.installAdditionalCosts ?? []).reduce((sum, cost) => {
    if (cost.kind !== "agenda_point") return sum;
    if (!Number.isInteger(cost.amount) || cost.amount <= 0)
      throw new Error("Agenda-Punkt-Installationskosten sind ungueltig.");
    return sum + cost.amount;
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

function citySurveillanceSourceIds(state: GameState): CardInstanceId[] {
  return rezzedCorpRootCardIds(state).filter((sourceId) =>
    isCitySurveillanceCard(state, sourceId),
  );
}

function citySurveillanceDrawDecisionFromPayload(
  legalAction: LegalAction,
): CitySurveillanceDrawDecision {
  const decision = legalAction.payload?.citySurveillanceDrawDecision;
  if (decision === "pay" || decision === "tag") return decision;
  return "auto";
}

function drawRunnerCard(
  state: GameState,
  citySurveillanceDecision: CitySurveillanceDrawDecision = "auto",
): RunnerDrawSummary {
  const summary = emptyRunnerDrawSummary();
  const cardId = state.runner.stack.shift();
  if (!cardId) return summary;
  state.runner.grip.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    zone: { side: "runner", zone: "grip" },
  };
  summary.drawnCount = 1;
  (summary.drawnCardIds ??= []).push(cardId);
  const citySurveillanceIds = citySurveillanceSourceIds(state);
  summary.citySurveillanceSourceCount = citySurveillanceIds.length;
  for (const _sourceId of citySurveillanceIds) {
    void _sourceId;
    if (
      citySurveillanceDecision === "pay" ||
      (citySurveillanceDecision === "auto" && state.runner.credits > 0)
    ) {
      if (state.runner.credits <= 0)
        throw new Error("City Surveillance kann nicht bezahlt werden.");
      spendCredits(state, "runner", 1);
      summary.citySurveillanceCreditsPaid += 1;
    } else {
      state.runner.tags += 1;
      summary.citySurveillanceTagsAdded += 1;
    }
  }
  return summary;
}

function activeCrashEverettSourceId(state: GameState): CardInstanceId | undefined {
  return state.runner.rig.resources
    .filter(
      (cardId) =>
        remainingReplacementLongtailKindForCard(state, cardId) ===
        "crash_everett_draw_extra_choose_trash_or_top",
    )
    .sort()[0];
}

function activeWilsonSourceIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.resources
    .filter(
      (cardId) =>
        remainingReplacementLongtailKindForCard(state, cardId) ===
        "wilson_run_action_spending_cap",
    )
    .sort();
}

function startCrashEverettDrawChoice(
  state: GameState,
  sourceCardId: CardInstanceId,
  drawnCardIds: readonly CardInstanceId[],
): void {
  if (drawnCardIds.length === 0) return;
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = drawnCardIds.flatMap((cardId) => {
    const title = definitionFor(state, cardId).title;
    return [
      {
        id: `trash_${cardId}`,
        label: `${title} trashen`,
        publicLabel: "Gezogene Karte trashen",
        value: `${cardId}:trash`,
      },
      {
        id: `top_${cardId}`,
        label: `${title} oben auf den Stack legen`,
        publicLabel: "Gezogene Karte oben auf den Stack legen",
        value: `${cardId}:top`,
      },
    ];
  });
  state.pendingChoice = {
    choiceId: `p3_61_crash_draw_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_61.crash_draw:${sourceCardId}:${drawnCardIds.join(",")}:${
      state.stateVersion + 1
    }`,
    prompt: "Crash Everett: gezogene Karte waehlen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function drawRunnerCards(
  state: GameState,
  amount: number,
  citySurveillanceDecision: CitySurveillanceDrawDecision = "auto",
): RunnerDrawSummary {
  let summary = emptyRunnerDrawSummary();
  const crashSourceId = amount > 0 ? activeCrashEverettSourceId(state) : undefined;
  const drawAmount = amount + (crashSourceId ? 1 : 0);
  for (let index = 0; index < drawAmount; index += 1)
    summary = mergeRunnerDrawSummary(
      summary,
      drawRunnerCard(state, citySurveillanceDecision),
    );
  if (crashSourceId && (summary.drawnCardIds?.length ?? 0) > 0) {
    startCrashEverettDrawChoice(state, crashSourceId, summary.drawnCardIds ?? []);
    summary.crashEverettSourceCardId = crashSourceId;
    summary.crashEverettChoiceOpened = true;
  }
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
  recordRunnerDamageDuringCurrentAction(state);

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

function createAddTagImminentEvent(
  state: GameState,
  amount: number,
  source: string,
): ImminentEvent {
  return {
    eventId: `imminent_tag_${state.stateVersion + 1}_${sanitizeId(source)}`,
    eventType: "add_tag",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      amount,
      source,
    },
    visibility: "public",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

function addRunnerTagsWithPrevention(
  state: GameState,
  legalAction: LegalAction,
  amount: number,
  source: string,
): void {
  if (amount <= 0) return;
  const oneShotAvoidance = Math.max(
    0,
    Math.floor(state.runnerTagAvoidanceCredits ?? 0),
  );
  if (oneShotAvoidance > 0) {
    state.runnerTagAvoidanceCredits = oneShotAvoidance - 1;
    const tagsAdded = Math.max(0, amount - 1);
    state.runner.tags += tagsAdded;
    recordRunnerReceivedTags(state, tagsAdded);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      tagsAdded,
      preventedTags: 1,
      runnerTagsAfter: state.runner.tags,
      tagAvoidanceCreditsAfter: state.runnerTagAvoidanceCredits,
    };
    return;
  }
  const event = createAddTagImminentEvent(state, amount, source);
  if (openEventModificationWindow(state, event, legalAction)) return;
  resolveAddTagImminentEvent(state, event, legalAction);
}

function resolveAddTagImminentEvent(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
  preventedTags = 0,
): void {
  if (event.eventType !== "add_tag")
    throw new Error("Nur Add-Tag-ImminentEvents koennen Tags geben.");
  const amount = numberPayload(event, "amount");
  const tagsAdded = Math.max(0, amount - preventedTags);
  state.runner.tags += tagsAdded;
  recordRunnerReceivedTags(state, tagsAdded);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    tagsAdded,
    ...(preventedTags > 0 ? { preventedTags } : {}),
    runnerTagsAfter: state.runner.tags,
  };
}

function recordRunnerReceivedTags(state: GameState, amount: number): void {
  if (amount > 0) ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = true;
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
  if (event.payload.cannotBePrevented === true) return [];
  if (event.eventType === "damage") {
    const runtime = collectRuntimeDamagePreventionCandidates(state, event);
    const harness = collectHarnessDamagePreventionCandidates(state, event);
    return [...runtime, ...harness];
  }
  if (event.eventType === "add_tag")
    return collectRuntimeTagPreventionCandidates(state, event);
  if (event.eventType === "runner_installed_trash")
    return collectRuntimeTrashPreventionCandidates(state, event);
  return [];
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
  if (
    state.runnerPermanentMeatDamagePrevention === true &&
    damageType === "meat"
  ) {
    candidates.push({
      candidateId: `card_implementation_permanent_meat_prevent_${amount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: "runner",
      sourceRef: {
        kind: "game_rule",
        label: "Emergency Self-Construct",
      },
      priority: 141,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount: amount,
    });
  }
  for (const cardId of installed) {
    if (
      state.cancelledDamagePreventionSourceIdsUntilEndOfTurn?.includes(cardId)
    )
      continue;
    const definition = definitionFor(state, cardId);
    const cardImplementationPreventionSources =
      damagePreventionSourcesForDefinition(definition);
    if (cardImplementationPreventionSources.length > 0) {
      candidates.push(
        ...cardImplementationDamagePreventionCandidates(
          state,
          event,
          cardId,
          definition,
          cardImplementationPreventionSources,
        ),
      );
      continue;
    }
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

function damagePreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardDamagePreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.damagePreventionSources ?? []
  );
}

function tagPreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardTagPreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.tagPreventionSources ?? []
  );
}

function trashPreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardTrashPreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.trashPreventionSources ?? []
  );
}

function flatlineReplacementSourcesForDefinition(
  definition: CardDefinition,
): readonly CardFlatlineReplacementSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.flatlineReplacementSources ??
    []
  );
}

function isRunnerHardwareDeckDefinition(definition: CardDefinition): boolean {
  return (
    definition.type === "hardware" &&
    (cardHasSubtype(definition, "deck") ||
      cardImplementationForDefinitionId(definition.id)?.hardwareDeck === true)
  );
}

function cardImplementationDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
  cardId: CardInstanceId,
  definition: CardDefinition,
  sources: readonly CardDamagePreventionSourceImplementation[],
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  const candidates: EventModificationCandidate[] = [];
  sources.forEach((source, sourceIndex) => {
    if (
      source.kind !== "damage_prevention" ||
      source.visibility !== "public" ||
      !source.damageTypes.includes(damageType)
    )
      return;
    if (!cardImplementationDamagePreventionSourceCanPay(state, cardId, source))
      return;
    const sourceAmount = source.amount === "all" ? amount : source.amount;
    const preventAmount =
      source.limit?.kind === "per_turn"
        ? Math.min(
            amount,
            Math.max(
              0,
              source.limit.amount - damagePreventionUsedThisTurn(state, cardId),
            ),
          )
        : Math.min(amount, sourceAmount);
    if (preventAmount <= 0) return;
    candidates.push({
      candidateId: `card_implementation_damage_prevent_${sanitizeId(cardId)}_${sourceIndex}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: source.corpMayPayToBypass
        ? "corp"
        : source.corpMayCancelUntilEndOfTurn &&
            corpAgendaPointTotal(state) >=
              source.corpMayCancelUntilEndOfTurn.agendaPointCost
          ? "corp"
          : "runner",
      sourceRef: {
        kind: "card",
        instanceId: cardId,
        definitionId: definition.id,
        label: definition.title,
      },
      priority: source.priority,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount,
      preventionSourceIndex: sourceIndex,
      ...(source.corpMayPayToBypass
        ? {
            bypassCostPerDamage: source.corpMayPayToBypass.costPerDamage,
            bypassPaymentSide: "corp" as const,
          }
        : {}),
    });
  });
  return candidates;
}

function cardImplementationDamagePreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardDamagePreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "none") return true;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "credit")
    return state.runner.credits >= source.cost.amount;
  return cardCounter(state, cardId, source.cost.counterType) >= source.cost.amount;
}

function collectRuntimeTagPreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const sources = tagPreventionSourcesForDefinition(definition);
    sources.forEach((source, sourceIndex) => {
      if (
        source.kind !== "avoid_tag" ||
        source.visibility !== "public" ||
        !cardImplementationTagPreventionSourceCanPay(state, cardId, source)
      )
        return;
      candidates.push({
        candidateId: `card_implementation_avoid_tag_${sanitizeId(cardId)}_${sourceIndex}`,
        eventId: event.eventId,
        kind: "avoid",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: source.priority,
        visibility: "hidden_info_barrier",
        optional: true,
        preventedTags: Math.min(amount, source.amount),
        tagPreventionSourceIndex: sourceIndex,
      });
    });
  }
  return candidates;
}

function collectRuntimeTrashPreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const targetIds = trashTargetIdsFromEvent(event);
  if (targetIds.length === 0 || event.affectedSide !== "runner") return [];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const sources = trashPreventionSourcesForDefinition(definition);
    sources.forEach((source, sourceIndex) => {
      if (
        source.kind !== "prevent_installed_card_trash" ||
        source.visibility !== "public" ||
        !cardImplementationTrashPreventionSourceCanPay(state, cardId, source)
      )
        return;
      const protectedTargets = targetIds.filter((targetId) =>
        cardImplementationTrashPreventionProtectsTarget(
          state,
          cardId,
          source,
          targetId,
        ),
      );
      const preventedTrashTargetIds =
        source.mode === "one_card"
          ? protectedTargets.slice(0, 1)
          : protectedTargets;
      if (preventedTrashTargetIds.length === 0) return;
      candidates.push({
        candidateId: `card_implementation_prevent_trash_${sanitizeId(cardId)}_${sourceIndex}_${preventedTrashTargetIds.length}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: source.priority,
        visibility: "hidden_info_barrier",
        optional: true,
        preventedTrashTargetIds,
        trashPreventionSourceIndex: sourceIndex,
      });
    });
  }
  return candidates;
}

function cardImplementationTagPreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardTagPreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "trash_source") return true;
  return state.runner.credits >= source.cost.amount;
}

function cardImplementationTrashPreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardTrashPreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "trash_source") return true;
  return state.runner.credits >= source.cost.amount;
}

function cardImplementationTrashPreventionProtectsTarget(
  state: GameState,
  sourceCardId: CardInstanceId,
  source: CardTrashPreventionSourceImplementation,
  targetCardId: CardInstanceId,
): boolean {
  if (source.excludesSelf === true && sourceCardId === targetCardId)
    return false;
  if (!runnerInstalledCardIds(state).includes(targetCardId)) return false;
  const targetDefinition = definitionFor(state, targetCardId);
  return source.protectsCardTypes.includes(
    targetDefinition.type as Extract<CardType, "program" | "hardware">,
  );
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
      (cardId) => {
        const definition = definitionFor(state, cardId);
        return flatlineReplacementSourcesForDefinition(definition).some(
          (source) =>
            source.kind === "flatline_replacement_from_grip" &&
            source.replacement === "arasaka_owns_you" &&
            source.visibility === "public",
        );
      },
    );
    if (arasakaId) {
      const definition = definitionFor(state, arasakaId);
      candidates.push({
        candidateId: `v1919_arasaka_owns_you_${arasakaId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: arasakaId,
          definitionId: definition.id,
          label: definition.title,
        },
        replacesEventType: "damage",
        replacementEventType: "add_tag",
        priority: 80,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
    const emergencySelfConstructId = state.runner.rig.programs.find(
      (cardId) => {
        const definition = definitionFor(state, cardId);
        return flatlineReplacementSourcesForDefinition(definition).some(
          (source) =>
            source.kind === "flatline_replacement_installed" &&
            source.replacement === "emergency_self_construct" &&
            source.visibility === "public",
        );
      },
    );
    if (emergencySelfConstructId) {
      const definition = definitionFor(state, emergencySelfConstructId);
      candidates.push({
        candidateId: `v1920_emergency_self_construct_${emergencySelfConstructId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: emergencySelfConstructId,
          definitionId: definition.id,
          label: definition.title,
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
        : event.eventType === "add_tag"
          ? "Tag nicht vermeiden"
          : event.eventType === "runner_installed_trash"
            ? "Trash nicht verhindern"
            : "Nicht verhindern",
      publicLabel: "Event Modification",
    },
    {
      id: candidate.candidateId,
      label:
        diplomaticImmunityCancel
          ? "Diplomatic Immunity wirken lassen"
          : event.eventType === "add_tag"
            ? `${candidate.sourceRef.label}: ${candidate.preventedTags ?? 1} Tag vermeiden`
            : event.eventType === "runner_installed_trash"
              ? `${candidate.sourceRef.label}: ${candidate.preventedTrashTargetIds?.length ?? 1} Trash verhindern`
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
    if (event.eventType === "add_tag") {
      resolveAddTagImminentEvent(state, event, legalAction);
      legalAction.payload = {
        ...basePayload,
        ...(legalAction.payload ?? {}),
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        originalAmount: numberPayload(event, "amount"),
      };
      clearEventModificationState(state);
      return;
    }
    if (event.eventType === "runner_installed_trash") {
      const summary = resolveRunnerInstalledTrashImminentEvent(
        state,
        event,
        legalAction,
        [],
      );
      legalAction.payload = {
        ...basePayload,
        ...(legalAction.payload ?? {}),
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        originalAmount: summary.originalCount,
      };
      clearEventModificationState(state);
      return;
    }
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
      const sourceInstanceId = window.candidates[0]?.sourceRef.instanceId;
      if (sourceInstanceId) {
        state.cancelledDamagePreventionSourceIdsUntilEndOfTurn = [
          ...new Set([
            ...(state.cancelledDamagePreventionSourceIdsUntilEndOfTurn ?? []),
            sourceInstanceId,
          ]),
        ];
      }
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
  if (
    candidate.eventId !== event.eventId ||
    !(
      candidate.kind === "prevent" ||
      (event.eventType === "add_tag" && candidate.kind === "avoid")
    )
  )
    throw new Error(
      "Dieser Event-Modification-Kandidat passt nicht zum Fenster.",
    );
  if (event.eventType === "add_tag") {
    revalidateTagPreventionCandidateSource(state, candidate);
    const originalAmount = numberPayload(event, "amount");
    const preventedTags = Math.min(
      candidate.preventedTags ?? 0,
      originalAmount,
    );
    const preventionCostPayload = applyRuntimeTagPreventionCost(
      state,
      candidate,
      preventedTags,
    );
    resolveAddTagImminentEvent(state, event, legalAction, preventedTags);
    legalAction.payload = {
      ...basePayload,
      ...(legalAction.payload ?? {}),
      eventModificationDecision: "apply",
      eventModificationOutcome:
        originalAmount === preventedTags ? "avoided" : "partially_avoided",
      candidateId: candidate.candidateId,
      originalAmount,
      preventedTags,
      finalAmount: Math.max(0, originalAmount - preventedTags),
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      ...preventionCostPayload,
    };
    clearEventModificationState(state);
    return;
  }
  if (event.eventType === "runner_installed_trash") {
    revalidateTrashPreventionCandidateSource(state, candidate, event);
    const preventedTrashTargetIds = candidate.preventedTrashTargetIds ?? [];
    const preventionCostPayload = applyRuntimeTrashPreventionCost(
      state,
      candidate,
      preventedTrashTargetIds.length,
    );
    const summary = resolveRunnerInstalledTrashImminentEvent(
      state,
      event,
      legalAction,
      preventedTrashTargetIds,
    );
    legalAction.payload = {
      ...basePayload,
      ...(legalAction.payload ?? {}),
      eventModificationDecision: "apply",
      eventModificationOutcome:
        summary.trashedCount === 0 ? "prevented" : "partially_prevented",
      candidateId: candidate.candidateId,
      originalAmount: summary.originalCount,
      preventedTrashCount: summary.preventedCount,
      trashedCount: summary.trashedCount,
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      ...preventionCostPayload,
    };
    clearEventModificationState(state);
    return;
  }
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
  state.runnerActionsPerTurnOverride = 3;
  state.runnerPermanentMeatDamagePrevention = true;
  trashRunnerInstalledCardToHeap(state, cardId);
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
    runnerActionsPerTurnOverride: state.runnerActionsPerTurnOverride,
    permanentMeatDamagePrevention: true,
    runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
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

function trashTargetIdsFromEvent(event: ImminentEvent): CardInstanceId[] {
  const raw = stringPayload(event, "targetCardIds");
  if (!raw) return [];
  return raw.split(",").filter((cardId) => cardId.length > 0);
}

function createRunnerInstalledTrashImminentEvent(
  state: GameState,
  targetCardIds: CardInstanceId[],
  source: string,
): ImminentEvent {
  return {
    eventId: `imminent_runner_trash_${state.stateVersion + 1}_${sanitizeId(source)}`,
    eventType: "runner_installed_trash",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      targetCardIds: targetCardIds.join(","),
      targetDefinitionIds: targetCardIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(","),
      amount: targetCardIds.length,
      source,
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

function openRunnerInstalledTrashPreventionWindow(
  state: GameState,
  legalAction: LegalAction,
  targetCardIds: CardInstanceId[],
  source: string,
): boolean {
  const installedTargets = targetCardIds.filter((cardId) =>
    runnerInstalledCardIds(state).includes(cardId),
  );
  if (installedTargets.length === 0) return false;
  const event = createRunnerInstalledTrashImminentEvent(
    state,
    installedTargets,
    source,
  );
  return openEventModificationWindow(state, event, legalAction);
}

function resolveRunnerInstalledTrashImminentEvent(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
  preventedTargetIds: CardInstanceId[],
): { originalCount: number; preventedCount: number; trashedCount: number } {
  if (event.eventType !== "runner_installed_trash")
    throw new Error("Nur Runner-Trash-ImminentEvents koennen Trash aufloesen.");
  const targetIds = trashTargetIdsFromEvent(event);
  const prevented = new Set(preventedTargetIds);
  const trashedDefinitionIds: CardDefinitionId[] = [];
  let trashedCount = 0;
  for (const targetId of targetIds) {
    if (prevented.has(targetId)) continue;
    if (!runnerInstalledCardIds(state).includes(targetId)) continue;
    trashedDefinitionIds.push(definitionFor(state, targetId).id);
    trashRunnerInstalledCardToHeap(state, targetId, legalAction);
    trashedCount += 1;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    preventedTrashCount: preventedTargetIds.length,
    trashedCount,
    trashedCardDefinitionId: trashedDefinitionIds[0] ?? "",
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
  };
  return {
    originalCount: targetIds.length,
    preventedCount: preventedTargetIds.length,
    trashedCount,
  };
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
    !candidate.sourceRef.instanceId
  ) {
    return {};
  }
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const implementationSource = cardImplementationDamagePreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (implementationSource) {
    if (implementationSource.cost.kind === "none") return {};
    if (implementationSource.cost.kind === "trash_source") {
      trashRunnerInstalledCardToHeap(state, sourceCardId);
      return {
        sourceTrashed: true,
        trashedCardDefinitionId: definition.id,
      };
    }
    if (implementationSource.cost.kind === "credit") {
      spendCredits(state, "runner", implementationSource.cost.amount);
      return {
        paidCredits: implementationSource.cost.amount,
        runnerCreditsAfter: state.runner.credits,
      };
    }
    const { counterType, amount, trashSourceWhenEmpty } =
      implementationSource.cost;
    if (cardCounter(state, sourceCardId, counterType) < amount)
      throw new Error("Die Prevention-Quelle hat nicht genug Counter.");
    spendCardCounter(state, sourceCardId, counterType, amount);
    const remainingCounters = cardCounter(state, sourceCardId, counterType);
    const sourceTrashed =
      trashSourceWhenEmpty === true && remainingCounters <= 0;
    if (sourceTrashed) trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      counterType,
      removedCounterAmount: amount,
      remainingCounters,
      sourceTrashed,
      ...(sourceTrashed ? { trashedCardDefinitionId: definition.id } : {}),
    };
  }
  if (candidate.sourceRef.definitionId !== ABLATIVE_COUNTER_HARDWARE_CARD_ID)
    return {};
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

function applyRuntimeTagPreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): Record<string, unknown> {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return {};
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const source = cardImplementationTagPreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (!source) return {};
  if (source.cost.kind === "trash_source") {
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  spendCredits(state, "runner", source.cost.amount);
  return {
    paidCredits: source.cost.amount,
    runnerCreditsAfter: state.runner.credits,
  };
}

function applyRuntimeTrashPreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedCount: number,
): Record<string, unknown> {
  if (
    preventedCount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return {};
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const source = cardImplementationTrashPreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (!source) return {};
  if (source.cost.kind === "trash_source") {
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  spendCredits(state, "runner", source.cost.amount);
  returnRunnerInstalledCardToGrip(state, sourceCardId);
  return {
    paidCredits: source.cost.amount,
    returnedSourceToGrip: true,
    runnerCreditsAfter: state.runner.credits,
  };
}

function cardImplementationDamagePreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardDamagePreventionSourceImplementation | undefined {
  const sourceIndex = candidate.preventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return damagePreventionSourcesForDefinition(definition)[sourceIndex];
}

function cardImplementationTagPreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardTagPreventionSourceImplementation | undefined {
  const sourceIndex = candidate.tagPreventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return tagPreventionSourcesForDefinition(definition)[sourceIndex];
}

function cardImplementationTrashPreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardTrashPreventionSourceImplementation | undefined {
  const sourceIndex = candidate.trashPreventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return trashPreventionSourcesForDefinition(definition)[sourceIndex];
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
  const implementationSource = cardImplementationDamagePreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    implementationSource &&
    !cardImplementationDamagePreventionSourceCanPay(
      state,
      sourceCardId,
      implementationSource,
    )
  )
    throw new Error("Die Prevention-Quelle kann die Kosten nicht mehr zahlen.");
}

function revalidateTagPreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    throw new Error("Die Tag-Prevention-Quelle fehlt.");
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Tag-Prevention-Quelle ist nicht mehr installiert.");
  if (
    candidate.sourceRef.definitionId &&
    definitionFor(state, sourceCardId).id !== candidate.sourceRef.definitionId
  )
    throw new Error("Die Tag-Prevention-Quelle passt nicht mehr.");
  const source = cardImplementationTagPreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    !source ||
    !cardImplementationTagPreventionSourceCanPay(state, sourceCardId, source)
  )
    throw new Error("Die Tag-Prevention-Quelle kann nicht mehr zahlen.");
}

function revalidateTrashPreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
  event: ImminentEvent,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    throw new Error("Die Trash-Prevention-Quelle fehlt.");
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Trash-Prevention-Quelle ist nicht mehr installiert.");
  if (
    candidate.sourceRef.definitionId &&
    definitionFor(state, sourceCardId).id !== candidate.sourceRef.definitionId
  )
    throw new Error("Die Trash-Prevention-Quelle passt nicht mehr.");
  const source = cardImplementationTrashPreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    !source ||
    !cardImplementationTrashPreventionSourceCanPay(state, sourceCardId, source)
  )
    throw new Error("Die Trash-Prevention-Quelle kann nicht mehr zahlen.");
  const legalTargets = new Set(trashTargetIdsFromEvent(event));
  const protectedIds = candidate.preventedTrashTargetIds ?? [];
  if (
    protectedIds.length === 0 ||
    protectedIds.some(
      (targetId) =>
        !legalTargets.has(targetId) ||
        !cardImplementationTrashPreventionProtectsTarget(
          state,
          sourceCardId,
          source,
          targetId,
        ),
    )
  )
    throw new Error("Die Trash-Prevention-Ziele sind nicht mehr gueltig.");
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

function requireRunnerTagged(state: GameState): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
}

function removeRunnerTagsForCardImplementation(
  state: GameState,
  mode: "amount" | "up_to_amount" | "all",
  amount?: number,
): {
  removedTags: number;
  runnerTagsAfter: number;
  publicPayload: Record<string, string | number | boolean>;
} {
  const maxAmount =
    mode === "all" ? state.runner.tags : Math.max(0, Math.floor(amount ?? 0));
  const removedTags = Math.min(state.runner.tags, maxAmount);
  state.runner.tags = Math.max(0, state.runner.tags - removedTags);
  return {
    removedTags,
    runnerTagsAfter: state.runner.tags,
    publicPayload: {
      removedTags,
      runnerTagsAfter: state.runner.tags,
    },
  };
}

function addRunnerTagAvoidanceCredit(
  state: GameState,
  amount: 1,
): {
  amount: number;
  publicPayload: Record<string, string | number | boolean>;
} {
  state.runnerTagAvoidanceCredits =
    Math.max(0, Math.floor(state.runnerTagAvoidanceCredits ?? 0)) + amount;
  return {
    amount,
    publicPayload: {
      avoidNextTag: true,
      tagAvoidanceCreditsAfter: state.runnerTagAvoidanceCredits,
    },
  };
}

function startReturnSourceToGripIfPaidChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  amount: number,
): {
  choiceOpened: boolean;
  publicPayload: Record<string, string | number | boolean>;
} {
  if (state.runner.credits < amount) {
    return {
      choiceOpened: false,
      publicPayload: {
        returnToGripCost: amount,
        returnToGripChoiceOpened: false,
      },
    };
  }
  startOpenEndedMileageProgramReturnChoice(state, sourceCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "remove_tag_optional_return",
    returnToGripCost: amount,
    returnToGripChoiceOpened: true,
  };
  return {
    choiceOpened: true,
    publicPayload: {
      v1922RunnerEventAbility: "remove_tag_optional_return",
      returnToGripCost: amount,
      returnToGripChoiceOpened: true,
    },
  };
}

function runnerStoleAgendaLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.stoleAgendaLastTurn === true;
}

function runnerStolenAgendaAdvancementCountersLastTurn(
  state: GameState,
): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.stolenAgendaAdvancementCountersLastTurn ?? 0),
  );
}

function runnerRunAttemptsLastTurn(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
  );
}

function runnerWasDamagedDuringLastThreeActions(state: GameState): boolean {
  const flags = state.runnerTurnFlags;
  const lastDamageOrdinal = Math.floor(flags?.lastDamageRunnerActionOrdinal ?? 0);
  if (lastDamageOrdinal <= 0) return false;
  const actionsTaken = Math.floor(flags?.runnerActionsTakenThisTurn ?? 0);
  return actionsTaken - lastDamageOrdinal < 3;
}

function recordRunnerActionSpent(state: GameState, amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) return;
  const flags = ensureRunnerTurnFlags(state);
  flags.runnerActionsTakenThisTurn =
    Math.max(0, Math.floor(flags.runnerActionsTakenThisTurn ?? 0)) + amount;
}

function recordRunnerDamageDuringCurrentAction(state: GameState): void {
  const flags = ensureRunnerTurnFlags(state);
  const currentOrdinal = Math.floor(flags.runnerActionsTakenThisTurn ?? 0);
  if (state.activeSide !== "runner" || currentOrdinal <= 0) return;
  flags.lastDamageRunnerActionOrdinal = currentOrdinal;
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

function corpHasScoredBioweaponsEngineering(state: GameState): boolean {
  return scoredCorpAgendaIds(state).some(
    (cardId) =>
      scoredAgendaKindForDefinition(definitionFor(state, cardId)) ===
      "meat_damage_bonus",
  );
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
    Math.floor(
      Math.max(
        0,
        Math.floor(state.faitAccompliCountersByServer?.[zone.serverId] ?? 0),
      ) / 2,
    ),
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
        effectiveAgendaDifficulty(effectiveAgendaDifficultyDeps, state, left) -
          mustInstance(state.cardInstances, left).advancementCounters,
      );
      const rightRemaining = Math.max(
        0,
        effectiveAgendaDifficulty(effectiveAgendaDifficultyDeps, state, right) -
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

function powerGridOverloadEligibleHardwareIds(
  state: GameState,
): CardInstanceId[] {
  return state.runner.rig.hardware
    .slice()
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        definition.type === "hardware" &&
        !cardHasSubtype(definition, "cybernetics")
      );
    })
    .sort((left, right) => {
      const leftDefinition = definitionFor(state, left);
      const rightDefinition = definitionFor(state, right);
      const byTitle = leftDefinition.title.localeCompare(rightDefinition.title);
      if (byTitle !== 0) return byTitle;
      return left.localeCompare(right);
    });
}

function powerGridOverloadLegalActions(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): LegalAction[] {
  const eligibleHardwareIds = powerGridOverloadEligibleHardwareIds(state);
  const maxTrashCount = Math.min(eligibleHardwareIds.length, state.corp.credits);
  const actions: LegalAction[] = [];
  for (let trashCount = 1; trashCount <= maxTrashCount; trashCount += 1) {
    actions.push(
      action(
        state,
        "corp",
        "play_operation",
        `${definition.title}: ${trashCount} Hardware trashen`,
        cardId,
        [{ clicks: 1, credits: trashCount }],
        {
          cardId,
          powerGridOverloadTrashCount: trashCount,
          eligibleHardwareCount: eligibleHardwareIds.length,
        },
      ),
    );
  }
  return actions;
}

function powerGridOverloadTrashCountFromPayload(
  legalAction: LegalAction,
): number {
  const trashCount = Number(
    legalAction.payload?.powerGridOverloadTrashCount ?? 1,
  );
  if (!Number.isInteger(trashCount) || trashCount <= 0)
    throw new Error("Power Grid Overload braucht eine gueltige X-Auswahl.");
  return trashCount;
}

function resolvePowerGridOverloadOperation(
  state: GameState,
  legalAction: LegalAction,
): void {
  const trashCount = powerGridOverloadTrashCountFromPayload(legalAction);
  const eligibleHardwareIds = powerGridOverloadEligibleHardwareIds(state);
  if (eligibleHardwareIds.length < trashCount)
    throw new Error(
      "Power Grid Overload findet nicht genug nicht-Cybernetics-Hardware.",
    );
  if (eligibleHardwareIds.length > trashCount) {
    startPowerGridOverloadChoice(
      state,
      eligibleHardwareIds,
      trashCount,
      legalAction,
    );
    return;
  }
  trashPowerGridOverloadHardware(state, eligibleHardwareIds, legalAction);
}

function startPowerGridOverloadChoice(
  state: GameState,
  eligibleHardwareIds: CardInstanceId[],
  trashCount: number,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `v1914_power_grid_overload_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1914.power_grid_overload:${trashCount}:${state.stateVersion + 1}`,
    prompt: `Power Grid Overload: ${trashCount} Hardware trashen`,
    kind: "select_cards",
    options: eligibleHardwareIds.map((cardId) => {
      const definition = definitionFor(state, cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: definition.title,
        value: cardId,
      };
    }),
    minSelections: trashCount,
    maxSelections: trashCount,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    powerGridOverloadChoiceOpened: true,
    eligibleHardwareCount: eligibleHardwareIds.length,
    powerGridOverloadTrashCount: trashCount,
  };
}

function powerGridOverloadTrashCountFromChoiceSource(source: string): number {
  const [, rawTrashCount] = source.split(":");
  const trashCount = Number(rawTrashCount);
  if (!Number.isInteger(trashCount) || trashCount <= 0)
    throw new Error("Power-Grid-Overload-Choice hat keine gueltige X-Auswahl.");
  return trashCount;
}

function resolvePowerGridOverloadChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1914.power_grid_overload"))
    throw new Error("Es ist keine Power-Grid-Overload-Choice offen.");
  const trashCount = powerGridOverloadTrashCountFromChoiceSource(choice.source);
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  if (selectedIds.length !== trashCount)
    throw new Error("Power Grid Overload braucht genau X Hardware-Ziele.");
  const legalTargets = new Set(powerGridOverloadEligibleHardwareIds(state));
  for (const cardId of selectedIds) {
    if (!legalTargets.has(cardId))
      throw new Error(
        "Power Grid Overload darf dieses Hardware-Ziel nicht trashen.",
      );
  }
  delete state.pendingChoice;
  trashPowerGridOverloadHardware(state, selectedIds, legalAction);
}

function trashPowerGridOverloadHardware(
  state: GameState,
  hardwareIds: CardInstanceId[],
  legalAction: LegalAction,
): void {
  const definitionIds = hardwareIds.map(
    (cardId) => definitionFor(state, cardId).id,
  );
  if (
    openRunnerInstalledTrashPreventionWindow(
      state,
      legalAction,
      hardwareIds,
      "power_grid_overload",
    )
  )
    return;
  for (const cardId of hardwareIds) {
    if (!powerGridOverloadEligibleHardwareIds(state).includes(cardId))
      throw new Error(
        "Power Grid Overload darf dieses Hardware-Ziel nicht mehr trashen.",
      );
    trashRunnerInstalledCardToHeap(state, cardId);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    powerGridOverloadTrashCount: hardwareIds.length,
    trashedHardwareCount: hardwareIds.length,
    trashedHardwareDefinitionIds: definitionIds.join(","),
  };
}

function systematicLayoffsLegalActions(
  state: GameState,
  cardId: CardInstanceId,
  definition: CardDefinition,
): LegalAction[] {
  return [
    action(
      state,
      "corp",
      "play_operation",
      `${definition.title} spielen`,
      cardId,
      [{ clicks: 1, credits: definition.cost ?? 0 }],
      { cardId },
    ),
  ];
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

function resolveSystematicLayoffsAdvancementOperation(
  state: GameState,
  legalAction: LegalAction,
): void {
  const options = systematicLayoffsPlacementOptions(state);
  if (options.length === 0)
    throw new Error("Systematic Layoffs findet kein advancebares Ziel.");
  startSystematicLayoffsAdvancementChoice(state, options, legalAction);
}

function systematicLayoffsPlacementOptions(state: GameState): Array<{
  firstTargetId: CardInstanceId;
  secondTargetId?: CardInstanceId;
  id: string;
  label: string;
  publicLabel: string;
  value: string;
}> {
  const targets = advanceableInstalledCardTargets(state);
  const options: Array<{
    firstTargetId: CardInstanceId;
    secondTargetId?: CardInstanceId;
    id: string;
    label: string;
    publicLabel: string;
    value: string;
  }> = [];
  for (let firstIndex = 0; firstIndex < targets.length; firstIndex += 1) {
    const firstTargetId = mustArrayValue(
      targets,
      firstIndex,
      "Systematic-Layoffs-Ziel fehlt.",
    );
    for (
      let secondIndex = firstIndex;
      secondIndex < targets.length;
      secondIndex += 1
    ) {
      const secondTargetId = mustArrayValue(
        targets,
        secondIndex,
        "Systematic-Layoffs-Ziel fehlt.",
      );
      const splitTargets = firstTargetId !== secondTargetId;
      const firstTitle = definitionFor(state, firstTargetId).title;
      const secondTitle = definitionFor(state, secondTargetId).title;
      const label = splitTargets
        ? `Je 1 Advancement-Counter auf ${firstTitle} und ${secondTitle}`
        : `2 Advancement-Counter auf ${firstTitle}`;
      options.push({
        firstTargetId,
        ...(splitTargets ? { secondTargetId } : {}),
        id: `placement_${sanitizeId(firstTargetId)}_${sanitizeId(secondTargetId)}`,
        label,
        publicLabel: label,
        value: splitTargets
          ? `${firstTargetId}|${secondTargetId}`
          : `${firstTargetId}|${firstTargetId}`,
      });
    }
  }
  return options;
}

function startSystematicLayoffsAdvancementChoice(
  state: GameState,
  options: ReturnType<typeof systematicLayoffsPlacementOptions>,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `v1919_systematic_layoffs_advancement_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1919.systematic_layoffs_advancement:${state.stateVersion + 1}`,
    prompt: "Systematic Layoffs: Advancement-Counter legen",
    kind: "select_option",
    options: options.map((option) => ({
      id: option.id,
      label: option.label,
      publicLabel: option.publicLabel,
      value: option.value,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1919OperationAbility: "add_advancement_counters_choice",
    eligiblePlacementCount: options.length,
  };
}

function resolveSystematicLayoffsAdvancementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1919.systematic_layoffs_advancement"))
    throw new Error("Es ist keine Systematic-Layoffs-Advancement-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Systematic Layoffs braucht genau eine Placement-Auswahl.");
  const [firstTargetId, secondTargetId] = selectedOption.value.split("|") as [
    CardInstanceId | undefined,
    CardInstanceId | undefined,
  ];
  if (!firstTargetId || !secondTargetId)
    throw new Error("Systematic Layoffs hat keine gueltige Placement-Auswahl.");
  applySystematicLayoffsAdvancementPlacement(
    state,
    firstTargetId,
    secondTargetId === firstTargetId ? undefined : secondTargetId,
    legalAction,
  );
  delete state.pendingChoice;
}

function applySystematicLayoffsAdvancementPlacement(
  state: GameState,
  firstTargetId: CardInstanceId,
  secondTargetId: CardInstanceId | undefined,
  legalAction: LegalAction,
): void {
  const eligibleTargets = new Set(advanceableInstalledCardTargets(state));
  if (!firstTargetId || !eligibleTargets.has(firstTargetId))
    throw new Error("Systematic Layoffs findet kein advancebares Ziel.");
  if (secondTargetId && !eligibleTargets.has(secondTargetId))
    throw new Error("Systematic Layoffs findet kein zweites advancebares Ziel.");

  const placements: Record<CardInstanceId, number> = {
    [firstTargetId]: secondTargetId ? 1 : 2,
  };
  if (secondTargetId) placements[secondTargetId] = 1;
  for (const [targetId, amount] of Object.entries(placements)) {
    mustInstance(state.cardInstances, targetId).advancementCounters += amount;
  }
  const placementEntries = Object.entries(placements);
  const targetCount = placementEntries.length;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID,
    v1919OperationAbility: "add_advancement_counters",
    targetCardId: firstTargetId,
    targetCardDefinitionId: definitionFor(state, firstTargetId).id,
    targetCardDefinitionIds: placementEntries
      .map(([targetId]) => definitionFor(state, targetId).id)
      .join(","),
    addedAdvancementCounters: 2,
    targetCount,
    systematicLayoffsDistribution: placementEntries
      .map(([targetId, amount]) => `${sanitizeId(targetId)}:${amount}`)
      .join(","),
    ...(targetCount === 1
      ? {
          advancementCountersAfter: mustInstance(
            state.cardInstances,
            firstTargetId,
          ).advancementCounters,
        }
      : {}),
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
          return isInstalledCorpCardAdvanceable(state, cardId, definition);
        }),
    );
}

function isInstalledCorpCardAdvanceable(
  state: GameState,
  cardId: CardInstanceId,
  definition = definitionFor(state, cardId),
): boolean {
  const instance = state.cardInstances[cardId];
  if (
    !instance ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverRoot" ||
    !state.corp.servers.some((server) => server.root.includes(cardId))
  )
    return false;
  if (definition.type === "agenda") return true;
  if (
    cardImplementationForDefinitionId(definition.id)?.advanceable?.while ===
    "installed_before_and_after_rez"
  )
    return true;
  return false;
}

type AdvancementDistributionMode =
  | "single_target"
  | "any_combination"
  | "up_to_distinct_targets_one_each";

type AdvancementDistributionOption = {
  id: string;
  label: string;
  publicLabel: string;
  value: string;
};

function advancementDistributionOptions(
  state: GameState,
  amount: number,
  distribution: AdvancementDistributionMode,
): AdvancementDistributionOption[] {
  const targets = advanceableInstalledCardTargets(state);
  if (amount <= 0 || targets.length === 0) return [];
  if (distribution === "single_target") {
    return targets.map((targetId) => {
      const title = definitionFor(state, targetId).title;
      const label = `${amount} Advancement-Counter auf ${title}`;
      return {
        id: `placement_${sanitizeId(targetId)}_${amount}`,
        label,
        publicLabel: label,
        value: `${targetId}:${amount}`,
      };
    });
  }
  if (distribution === "up_to_distinct_targets_one_each") {
    const options: AdvancementDistributionOption[] = [];
    for (let firstIndex = 0; firstIndex < targets.length; firstIndex += 1) {
      const firstTargetId = mustArrayValue(
        targets,
        firstIndex,
        "Advancement-Ziel fehlt.",
      );
      const firstTitle = definitionFor(state, firstTargetId).title;
      const singleLabel = `1 Advancement-Counter auf ${firstTitle}`;
      options.push({
        id: `placement_${sanitizeId(firstTargetId)}_one`,
        label: singleLabel,
        publicLabel: singleLabel,
        value: `${firstTargetId}:1`,
      });
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < targets.length;
        secondIndex += 1
      ) {
        const secondTargetId = mustArrayValue(
          targets,
          secondIndex,
          "Advancement-Ziel fehlt.",
        );
        const secondTitle = definitionFor(state, secondTargetId).title;
        const label = `Je 1 Advancement-Counter auf ${firstTitle} und ${secondTitle}`;
        options.push({
          id: `placement_${sanitizeId(firstTargetId)}_${sanitizeId(
            secondTargetId,
          )}`,
          label,
          publicLabel: label,
          value: `${firstTargetId}:1|${secondTargetId}:1`,
        });
      }
    }
    return options;
  }
  const options: AdvancementDistributionOption[] = [];
  const build = (
    targetIndex: number,
    remaining: number,
    placements: Array<[CardInstanceId, number]>,
  ): void => {
    if (targetIndex >= targets.length) {
      if (remaining !== 0 || placements.length === 0) return;
      const label = placements
        .map(([targetId, placed]) => {
          const title = definitionFor(state, targetId).title;
          return `${placed} auf ${title}`;
        })
        .join(", ");
      options.push({
        id: `placement_${placements
          .map(([targetId, placed]) => `${sanitizeId(targetId)}_${placed}`)
          .join("_")}`,
        label,
        publicLabel: label,
        value: placements
          .map(([targetId, placed]) => `${targetId}:${placed}`)
          .join("|"),
      });
      return;
    }
    const targetId = mustArrayValue(targets, targetIndex, "Advancement-Ziel fehlt.");
    for (let placed = remaining; placed >= 0; placed -= 1) {
      build(
        targetIndex + 1,
        remaining - placed,
        placed > 0 ? [...placements, [targetId, placed]] : placements,
      );
    }
  };
  build(0, amount, []);
  return options;
}

function startCardImplementationAdvancementDistributionChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  amount: number,
  distribution: AdvancementDistributionMode,
): { publicPayload?: Record<string, string | number | boolean> } {
  const options = advancementDistributionOptions(state, amount, distribution);
  if (options.length === 0)
    throw new Error("Die Karte findet kein advancebares installiertes Ziel.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `p3_34_advancement_distribution_${state.stateVersion + 1}`,
    side: "corp",
    source: `p3_34.distribute_advancement:${sourceDefinitionId}:${sourceCardId}:${amount}:${distribution}:${state.stateVersion + 1}`,
    prompt: "Advancement-Counter legen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    advancementCounterChoiceOpened: true,
    advancementCounterChoiceMode: distribution,
    advancementCounterAmount: amount,
    eligiblePlacementCount: options.length,
  };
  return { publicPayload: legalAction.payload };
}

function parseAdvancementDistributionValue(
  value: string,
): Array<[CardInstanceId, number]> {
  if (!value) throw new Error("Advancement-Choice hat keine Auswahl.");
  return value.split("|").map((entry) => {
    const [targetId, rawAmount] = entry.split(":");
    const amount = Number(rawAmount);
    if (!targetId || !Number.isInteger(amount) || amount <= 0)
      throw new Error("Advancement-Choice enthaelt ungueltige Placement-Daten.");
    return [targetId as CardInstanceId, amount];
  });
}

function sourcePartsForP334Choice(
  source: string,
): {
  sourceDefinitionId: CardDefinitionId;
  sourceCardId: CardInstanceId;
  amount: number;
  mode: AdvancementDistributionMode;
} {
  const [, sourceDefinitionId, sourceCardId, rawAmount, mode] = source.split(":");
  const amount = Number(rawAmount);
  if (
    !sourceDefinitionId ||
    !sourceCardId ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    (mode !== "single_target" &&
      mode !== "any_combination" &&
      mode !== "up_to_distinct_targets_one_each")
  )
    throw new Error("Advancement-Choice hat ungueltige Quelldaten.");
  return {
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    sourceCardId: sourceCardId as CardInstanceId,
    amount,
    mode,
  };
}

function validateAdvancementDistribution(
  state: GameState,
  placements: Array<[CardInstanceId, number]>,
  amount: number,
  mode: AdvancementDistributionMode,
): void {
  const eligibleTargets = new Set(advanceableInstalledCardTargets(state));
  const seen = new Set<CardInstanceId>();
  let total = 0;
  for (const [targetId, placed] of placements) {
    if (!eligibleTargets.has(targetId))
      throw new Error("Advancement-Counter duerfen nur auf advancebare Ziele.");
    total += placed;
    if (mode === "up_to_distinct_targets_one_each") {
      if (placed !== 1)
        throw new Error("Team Restructuring legt nur je einen Counter.");
      if (seen.has(targetId))
        throw new Error("Team Restructuring braucht verschiedene Ziele.");
      seen.add(targetId);
    }
  }
  if (mode === "up_to_distinct_targets_one_each") {
    if (total < 1 || total > amount)
      throw new Error("Team Restructuring braucht bis zu zwei Ziele.");
    return;
  }
  if (total !== amount)
    throw new Error("Die Advancement-Verteilung hat die falsche Counterzahl.");
}

function resolveCardImplementationAdvancementDistributionChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_34.distribute_advancement"))
    throw new Error("Es ist keine Advancement-Counter-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Die Advancement-Counter-Choice braucht eine Auswahl.");
  const { sourceDefinitionId, amount, mode } = sourcePartsForP334Choice(
    choice.source,
  );
  const placements = parseAdvancementDistributionValue(selectedOption.value);
  validateAdvancementDistribution(state, placements, amount, mode);
  for (const [targetId, placed] of placements) {
    mustInstance(state.cardInstances, targetId).advancementCounters += placed;
  }
  const firstTargetId = placements[0]?.[0];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    v1919OperationAbility: "add_advancement_counters",
    advancementCounterChoiceResolved: true,
    advancementCounterChoiceMode: mode,
    advancementCountersAdded: placements.reduce(
      (sum, [, placed]) => sum + placed,
      0,
    ),
    addedAdvancementCounters: placements.reduce(
      (sum, [, placed]) => sum + placed,
      0,
    ),
    targetCount: placements.length,
    targetCardDefinitionIds: placements
      .map(([targetId]) => definitionFor(state, targetId).id)
      .join(","),
    advancementCounterDistribution: placements
      .map(([targetId, placed]) => `${sanitizeId(targetId)}:${placed}`)
      .join(","),
    ...(firstTargetId
      ? {
          targetCardId: firstTargetId,
          targetCardDefinitionId: definitionFor(state, firstTargetId).id,
          advancementCountersAfter: mustInstance(
            state.cardInstances,
            firstTargetId,
          ).advancementCounters,
        }
      : {}),
  };
  delete state.pendingChoice;
}

function movableAdvancementSourceIds(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((server) =>
      server.root
        .slice()
        .sort()
        .filter((cardId) => {
          const instance = state.cardInstances[cardId];
          return Boolean(instance && instance.advancementCounters > 0);
        }),
    );
}

function moveAdvancementOptions(
  state: GameState,
  sourceCardId: CardInstanceId,
  sourceMode: "chosen_card" | "source_card",
  maxAmount: number | "all",
): AdvancementDistributionOption[] {
  const sourceIds =
    sourceMode === "source_card" ? [sourceCardId] : movableAdvancementSourceIds(state);
  const targetIds = advanceableInstalledCardTargets(state);
  const options: AdvancementDistributionOption[] = [];
  for (const fromId of sourceIds) {
    const fromInstance = state.cardInstances[fromId];
    if (!fromInstance || fromInstance.advancementCounters <= 0) continue;
    const cappedAmount =
      maxAmount === "all"
        ? Math.floor(fromInstance.advancementCounters)
        : Math.min(Math.floor(fromInstance.advancementCounters), maxAmount);
    if (cappedAmount <= 0) continue;
    for (const toId of targetIds) {
      if (toId === fromId) continue;
      for (let amount = 1; amount <= cappedAmount; amount += 1) {
        const fromTitle = definitionFor(state, fromId).title;
        const toTitle = definitionFor(state, toId).title;
        const label = `${amount} Advancement-Counter von ${fromTitle} auf ${toTitle} bewegen`;
        options.push({
          id: `move_${sanitizeId(fromId)}_${sanitizeId(toId)}_${amount}`,
          label,
          publicLabel: label,
          value: `${fromId}|${toId}|${amount}`,
        });
      }
    }
  }
  return options;
}

function startCardImplementationMoveAdvancementChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  sourceMode: "chosen_card" | "source_card",
  maxAmount: number | "all",
): { publicPayload?: Record<string, string | number | boolean> } {
  const options = moveAdvancementOptions(
    state,
    sourceCardId,
    sourceMode,
    maxAmount,
  );
  if (options.length === 0)
    throw new Error("Die Karte findet keine bewegbaren Advancement-Counter.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `p3_34_move_advancement_${state.stateVersion + 1}`,
    side: "corp",
    source: `p3_34.move_advancement:${sourceDefinitionId}:${sourceCardId}:${sourceMode}:${maxAmount}:${state.stateVersion + 1}`,
    prompt: "Advancement-Counter bewegen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    advancementCounterMoveChoiceOpened: true,
    eligibleMoveCount: options.length,
  };
  return { publicPayload: legalAction.payload };
}

function resolveCardImplementationMoveAdvancementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_34.move_advancement"))
    throw new Error("Es ist keine Advancement-Move-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Die Advancement-Move-Choice braucht eine Auswahl.");
  const [, sourceDefinitionId, sourceCardId, sourceMode, rawMaxAmount] =
    choice.source.split(":");
  const [fromId, toId, rawAmount] = selectedOption.value.split("|");
  const amount = Number(rawAmount);
  if (
    !sourceDefinitionId ||
    !sourceCardId ||
    (sourceMode !== "chosen_card" && sourceMode !== "source_card") ||
    !fromId ||
    !toId ||
    !Number.isInteger(amount) ||
    amount <= 0
  )
    throw new Error("Die Advancement-Move-Choice ist ungueltig.");
  const maxAmount =
    rawMaxAmount === "all" ? "all" : Number(rawMaxAmount ?? Number.NaN);
  if (
    maxAmount !== "all" &&
    (!Number.isInteger(maxAmount) || amount > maxAmount)
  )
    throw new Error("Die Advancement-Move-Choice bewegt zu viele Counter.");
  if (sourceMode === "source_card" && fromId !== sourceCardId)
    throw new Error("Diese Karte darf nur eigene Advancement-Counter bewegen.");
  if (fromId === toId)
    throw new Error("Advancement-Counter muessen auf eine andere Karte wechseln.");
  const fromInstance = state.cardInstances[fromId];
  if (!fromInstance || fromInstance.advancementCounters < amount)
    throw new Error("Die Quellkarte hat nicht genug Advancement-Counter.");
  if (!isInstalledCorpCardAdvanceable(state, toId as CardInstanceId))
    throw new Error("Das Ziel ist nicht advancebar installiert.");
  fromInstance.advancementCounters -= amount;
  const toInstance = mustInstance(state.cardInstances, toId as CardInstanceId);
  toInstance.advancementCounters += amount;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    v1919OperationAbility: "move_advancement_counters",
    advancementCountersMoved: amount,
    movedAdvancementCounters: amount,
    advancementCounterSourceCardId: fromId,
    advancementCounterSourceDefinitionId: definitionFor(
      state,
      fromId as CardInstanceId,
    ).id,
    advancementCounterTargetCardId: toId,
    advancementCounterTargetDefinitionId: definitionFor(
      state,
      toId as CardInstanceId,
    ).id,
    advancementCounterSourceAfter: fromInstance.advancementCounters,
    advancementCounterTargetAfter: toInstance.advancementCounters,
  };
  delete state.pendingChoice;
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

function resolveCorpInstalledEconomyAction(
  state: GameState,
  legalAction: LegalAction,
): boolean {
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!sourceCardId) return false;
  const definition = state.cardInstances[sourceCardId]
    ? definitionFor(state, sourceCardId)
    : undefined;
  if (!definition) return false;
  const profile = corpInstalledEconomyActionProfileForPayload(
    definition.id,
    legalAction.payload,
  );
  if (!profile) return false;
  validateCorpInstalledEconomyAction(state, legalAction, sourceCardId, profile);
  for (let spentClicks = 1; spentClicks < profile.clickCost; spentClicks += 1) {
    spendClick(state, "corp");
  }
  if (profile.creditCost > 0) spendCredits(state, "corp", profile.creditCost);
  credits(state, "corp", profile.creditGain);
  if (profile.trashSource) trashCorpInstalledCardToArchives(state, sourceCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: profile.sourceDefinitionId,
    gainedCredits: profile.creditGain,
    ...(profile.trashSource ? { selfTrashed: true } : {}),
    corpCreditsAfter: state.corp.credits,
  };
  return true;
}

function validateCorpInstalledEconomyAction(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: string,
  profile: EconomyActionProfile,
): void {
  if (legalAction.side !== profile.side)
    throw new Error("Nur die Korp darf diese Economy-Faehigkeit nutzen.");
  if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
    throw new Error("Diese Economy-Faehigkeit ist nur in der Korp-Aktionsphase nutzbar.");
  if (!rezzedCorpRootCardIds(state).includes(sourceCardId))
    throw new Error("Die Economy-Faehigkeit ist nicht rezzed installiert.");
  if (definitionFor(state, sourceCardId).id !== profile.sourceDefinitionId)
    throw new Error("Die Economy-Faehigkeit passt nicht zur Karte.");
  if (
    legalAction.payload?.[profile.abilityPayloadKey] !==
    profile.abilityPayloadValue
  )
    throw new Error("Die Economy-Faehigkeit passt nicht zum Profil.");
  const gainAmount = Number(legalAction.payload?.gainCreditsAmount ?? 0);
  if (!Number.isInteger(gainAmount) || gainAmount !== profile.creditGain)
    throw new Error("Die Economy-Faehigkeit hat einen ungueltigen Creditbetrag.");
  if (Boolean(legalAction.payload?.trashOnUse) !== Boolean(profile.trashSource))
    throw new Error("Die Economy-Faehigkeit hat einen ungueltigen Trash-Parameter.");
}

function rezzedInvestmentFirmIds(state: GameState): CardInstanceId[] {
  return rezzedCorpRootCardIds(state)
    .filter((cardId) => isInvestmentFirmCard(state, cardId))
    .sort();
}

function shouldOpenInvestmentFirmCreditChoice(
  state: GameState,
  legalAction: LegalAction,
): boolean {
  return (
    legalAction.side === "corp" &&
    legalAction.source === "basic_action" &&
    legalAction.type === "gain_credit" &&
    Object.keys(legalAction.payload ?? {}).length === 0 &&
    rezzedInvestmentFirmIds(state).length > 0
  );
}

function startInvestmentFirmCreditChoice(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const investmentFirmIds = rezzedInvestmentFirmIds(state);
  if (investmentFirmIds.length === 0)
    throw new Error("Investment Firm ist nicht rezzed installiert.");
  const sourceDefinitionId = definitionFor(state, investmentFirmIds[0]!).id;
  state.pendingChoice = {
    choiceId: `v1917_investment_firm_credit_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1917.investment_firm_credit:${state.stateVersion + 1}`,
    prompt: "Investment Firm: Credit nehmen oder 2 Credits auf die Karte legen?",
    kind: "select_option",
    options: [
      {
        id: "take_credit",
        label: "1 Credit nehmen",
        publicLabel: "1 Credit genommen",
        value: "take_credit",
      },
      ...investmentFirmIds.map((cardId, index) => ({
        id: `investment_firm_${cardId}`,
        label:
          investmentFirmIds.length === 1
            ? "2 Credits auf Investment Firm legen"
            : `2 Credits auf Investment Firm ${index + 1} legen`,
        publicLabel: "2 Credits auf Investment Firm gelegt",
        value: cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    investmentFirmChoiceOpened: true,
    gainCreditsAmount: 0,
    sourceDefinitionId,
  };
}

function resolveInvestmentFirmCreditChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1917.investment_firm_credit"))
    throw new Error("Es ist keine Investment-Firm-Choice offen.");
  if (choice.side !== "corp" || legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Investment Firm nutzen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected === "take_credit") {
    const sourceDefinitionId = definitionFor(
      state,
      rezzedInvestmentFirmIds(state)[0]!,
    ).id;
    credits(state, "corp", 1);
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      choiceVisibility: "public",
      sourceDefinitionId,
      gainCreditsAmount: 1,
      gainedCredits: 1,
      corpCreditsAfter: state.corp.credits,
    };
    return;
  }
  const selectedOption = choice.options.find((option) => option.id === selected);
  const sourceCardId = String(selectedOption?.value ?? "");
  if (!rezzedInvestmentFirmIds(state).includes(sourceCardId))
    throw new Error("Die gewaehlte Investment Firm ist nicht mehr legal.");
  const counterPayload = addVisibleCardCounter(
    state,
    sourceCardId,
    "recurring_credit",
    2,
  );
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "public",
    cardDefinitionId: definitionFor(state, sourceCardId).id,
    sourceDefinitionId: definitionFor(state, sourceCardId).id,
    ...counterPayload,
    gainCreditsAmount: 0,
    gainedCredits: 0,
    corpCreditsAfter: state.corp.credits,
  };
}

function resolveCrashEverettDrawChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_61.crash_draw"))
    throw new Error("Es ist keine Crash-Everett-Choice offen.");
  if (choice.side !== "runner" || legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Crash Everett nutzen.");
  const [, sourceCardId = "", drawnList = ""] = choice.source.split(":");
  if (
    !state.runner.rig.resources.includes(sourceCardId as CardInstanceId) ||
    remainingReplacementLongtailKindForCard(
      state,
      sourceCardId as CardInstanceId,
    ) !== "crash_everett_draw_extra_choose_trash_or_top"
  )
    throw new Error("Crash Everett ist nicht mehr installiert.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selected);
  const [cardId = "", disposition = ""] = String(option?.value ?? "").split(":");
  const legalDrawnCardIds = new Set(drawnList.split(",").filter(Boolean));
  if (!legalDrawnCardIds.has(cardId))
    throw new Error("Die gewaehlte Karte wurde nicht in diesem Draw gezogen.");
  if (!state.runner.grip.includes(cardId as CardInstanceId))
    throw new Error("Die gewaehlte Karte ist nicht mehr im Grip.");
  removeFromAllZones(state, cardId as CardInstanceId);
  if (disposition === "trash") {
    state.runner.heap.push(cardId as CardInstanceId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId as CardInstanceId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
  } else if (disposition === "top") {
    state.runner.stack.unshift(cardId as CardInstanceId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId as CardInstanceId),
      faceup: false,
      rezzed: false,
      zone: { side: "runner", zone: "stack" },
    };
  } else {
    throw new Error("Crash Everett braucht Trash oder Stack-Top.");
  }
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    choiceVisibility: "hidden_info_barrier",
    drawReplacementSourceTitle: "Crash Everett, Inventive Fixer",
    sourceDefinitionId: definitionFor(state, sourceCardId as CardInstanceId).id,
    crashEverettDisposition: disposition,
    crashEverettDrawnCardCount: legalDrawnCardIds.size,
    ...(disposition === "trash"
      ? { trashedCount: 1, destinationZone: "heap" }
      : { returnedToStackTop: true, destinationZone: "stack" }),
  };
}

function hiddenZoneSearchHandlerHostBase(
  state: GameState,
  legalAction: LegalAction,
): HiddenZoneSearchActivationHandlerHost {
  return {
    state,
    legalAction,
    constants: {
      aujourdOuiResourceCardId: AUJOURD_OUI_RESOURCE_CARD_ID,
      mysteryBoxId: MYSTERY_BOX_ID,
      selfModifyingCodeId: SELF_MODIFYING_CODE_ID,
      shortCircuitResourceCardId: SHORT_CIRCUIT_RESOURCE_CARD_ID,
      sneakPreviewId: SNEAK_PREVIEW_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      isUniqueRunnerDefinitionInstalled: (definition) =>
        isUniqueCard(definition) &&
        hasInstalledUniqueCardDefinition(state, "runner", definition.id),
      runnerProgramUsesMemory: (cardId) => runnerProgramUsesMemory(state, cardId),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      addToGrip: (cardId) => state.runner.grip.push(cardId),
      trashRunnerInstalledCardToHeap: (cardId) =>
        trashRunnerInstalledCardToHeap(state, cardId),
    },
    shuffleRunnerStack: (purpose) => shuffleRunnerStack(state, purpose),
    spendRunnerCredits: (amount) => spendCredits(state, "runner", amount),
    installRunnerProgramFromStackWithoutClick: (cardId) =>
      installRunnerProgramFromStackWithoutClick(state, cardId, legalAction),
    startSelfModifyingCodeFreeMuChoice: (cardId) =>
      startSelfModifyingCodeFreeMuChoice(state, cardId),
    availableRunnerProgramInstallCredits: () =>
      availableRunnerProgramInstallCredits(state),
    runnerMemoryLimit: () => runnerMemoryLimit(state),
    install: {
      canInstallRunnerProgramFromZone: (cardId, sourceZone, installCost) =>
        canInstallRunnerProgramFromZone(state, cardId, sourceZone, installCost),
      installRunnerProgramFromZoneWithoutClick: (
        cardId,
        sourceZone,
        installCost,
      ) =>
        installRunnerProgramFromZoneWithoutClick(
          state,
          cardId,
          sourceZone,
          installCost,
          legalAction,
        ),
      installRunnerProgramForFree: (cardId, options) =>
        installRunnerProgramForFree(state, cardId, legalAction, options),
      searchStackInstallTargets: (filter, installCost) =>
        searchStackInstallTargets(
          hiddenZoneSearchActivationTargetHost(state),
          filter,
          installCost,
        ),
      sneakPreviewInstallableProgramIds: (sourceZone) =>
        sneakPreviewInstallableProgramIds(
          hiddenZoneSearchActivationTargetHost(state),
          sourceZone,
        ),
      lookTopStackShowToCorpThenInstallMatchingTargets: (
        count,
        allowedTypes,
        installCost,
      ) =>
        lookTopStackShowToCorpThenInstallMatchingTargets(
          hiddenZoneSearchActivationTargetHost(state),
          count,
          allowedTypes,
          installCost,
        ),
    },
  };
}

function hiddenZoneSearchActivationTargetHost(state: GameState) {
  return {
    state,
    constants: {
      aujourdOuiResourceCardId: AUJOURD_OUI_RESOURCE_CARD_ID,
      mysteryBoxId: MYSTERY_BOX_ID,
      selfModifyingCodeId: SELF_MODIFYING_CODE_ID,
      shortCircuitResourceCardId: SHORT_CIRCUIT_RESOURCE_CARD_ID,
      sneakPreviewId: SNEAK_PREVIEW_ID,
    },
    cards: {
      definitionFor: (cardId: CardInstanceId) => definitionFor(state, cardId),
      isUniqueRunnerDefinitionInstalled: (definition: CardDefinition) =>
        isUniqueCard(definition) &&
        hasInstalledUniqueCardDefinition(state, "runner", definition.id),
    },
    install: {
      canInstallRunnerProgramFromZone: (
        cardId: CardInstanceId,
        sourceZone: "heap" | "stack",
        installCost: "normal" | "free",
      ) =>
        canInstallRunnerProgramFromZone(
          state,
          cardId,
          sourceZone,
          installCost,
        ),
    },
    runnerMemoryLimit: () => runnerMemoryLimit(state),
    shuffleRunnerStack: (purpose: string) => shuffleRunnerStack(state, purpose),
  };
}

function hiddenZoneSearchChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): HiddenZoneSearchChoiceHandlerHost {
  if (!state.pendingChoice) throw new Error("Diese Choice ist nicht offen.");
  return {
    ...hiddenZoneSearchHandlerHostBase(state, legalAction),
    choice: state.pendingChoice,
    playerAction,
  };
}

function hiddenZoneSearchActivationHandlerHost(
  state: GameState,
  legalAction: LegalAction,
): HiddenZoneSearchActivationHandlerHost {
  return hiddenZoneSearchHandlerHostBase(state, legalAction);
}

function hiddenZoneArrangeChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): HiddenZoneArrangeChoiceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    constants: {
      corpRdTop5ReorderOperationCardId: CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
      roninAroundId: RONIN_AROUND_ID,
      tooManyDoorsId: TOO_MANY_DOORS_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      hiddenReplacementLongtailKind: (definitionId) =>
        cardImplementationForDefinitionId(definitionId)
          ?.hiddenReplacementLongtail?.kind,
      isHiddenZoneReorderAssetDefinition: (definitionId) =>
        HIDDEN_ZONE_REORDER_ASSET_CARD_IDS.has(definitionId),
      hasCorpUtilityKind: (cardId, kind) =>
        hasCorpUtilityKind(
          state,
          cardId,
          kind as Parameters<typeof hasCorpUtilityKind>[2],
        ),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      rezzedCorpRootCardIds: () => rezzedCorpRootCardIds(state),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
      publicServerLabel: (serverId) => publicServerLabel(state, serverId),
    },
    choices: {
      iceChoiceLabelForSide: (cardId, visibleTo, fallback) =>
        iceChoiceLabelForSide(state, cardId, visibleTo, fallback),
    },
    callbacks: {
      runnerTurnFlags: () => ensureRunnerTurnFlags(state),
    },
  };
}

function hiddenZoneNonSearchChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): HiddenZoneNonSearchChoiceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    constants: {
      corpArchivesToHqOperationCardId: CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
      runAccessPressureEventCardId: RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      hasCorpUtilityKind: (cardId, kind) =>
        hasCorpUtilityKind(
          state,
          cardId,
          kind as Parameters<typeof hasCorpUtilityKind>[2],
        ),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      smithsPawnshopGainCredits: (cardId) => {
        const implementation = uniqueDirectLongtailImplementationForDefinition(
          definitionFor(state, cardId).id,
        );
        return implementation?.kind ===
          "smiths_pawnshop_start_turn_trash_for_credits"
          ? implementation.gainCredits
          : 2;
      },
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      trashRunnerInstalledCardToHeap: (cardId) =>
        trashRunnerInstalledCardToHeap(state, cardId),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
      publicServerLabel: (serverId) => publicServerLabel(state, serverId),
      iceChoiceLabelForSide: (cardId, visibleTo, fallback) =>
        iceChoiceLabelForSide(state, cardId, visibleTo, fallback),
    },
    callbacks: {
      hasSuccessfulHqRunThisTurn: () => hasSuccessfulHqRunThisTurn(state),
      spendCorpCredits: (amount) => spendCredits(state, "corp", amount),
      gainRunnerCredits: (amount) => credits(state, "runner", amount),
      startRunWithAutoPass: (serverId, iceId) =>
        startRun(
          state,
          serverId,
          undefined,
          1,
          { socialEngineeringAutoPassIceId: iceId },
          legalAction,
        ),
    },
  };
}

function corpZoneChoiceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): CorpZoneChoiceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    constants: {
      corpHqAgendaRevealCardId: CORP_HQ_AGENDA_REVEAL_CARD_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      hasCardImplementation: (definitionId) =>
        Boolean(cardImplementationForDefinitionId(definitionId)),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      scoredAgendaKind: (cardId) =>
        scoredAgendaImplementationForDefinition(definitionFor(state, cardId))
          ?.kind,
      scoredAgendaDrawCount: (cardId) => {
        const implementation = scoredAgendaImplementationForDefinition(
          definitionFor(state, cardId),
        );
        return implementation?.kind ===
          "ai_cfo_shuffle_hq_archives_into_rd_draw"
          ? implementation.drawCount
          : 5;
      },
    },
    zones: {
      rezzedCorpRootCardIds: () => rezzedCorpRootCardIds(state),
      shuffleCorpRnd: (cardIds, randomPurpose) =>
        shuffleStateIds(state, cardIds, randomPurpose),
    },
    credits: {
      gainCorpCredits: (amount) => credits(state, "corp", amount),
    },
    draw: {
      drawCorpCards: (amount) => drawCorpCards(state, amount),
    },
  };
}

function corpInstallRezSequenceHandlerHost(
  state: GameState,
  legalAction: LegalAction,
  playerAction?: PlayerAction,
): CorpInstallRezSequenceHandlerHost {
  return {
    state,
    legalAction,
    ...(playerAction ? { playerAction } : {}),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      scoredAgendaKind: (cardId) =>
        scoredAgendaKindForDefinition(definitionFor(state, cardId)),
      isCorpInstallableCardType: (definition) =>
        isCorpInstallableCardType(definition),
      canInstallCorpRootCardInServer: (definition, server) =>
        canInstallCorpRootCardInServer(state, definition, server),
      rezCostForCard: (cardId) => rezCostForCard(state, cardId),
      isPriorityRequisitionCandidate: (cardId) => {
        const instance = state.cardInstances[cardId];
        return (
          instance?.zone.side === "corp" &&
          instance.zone.zone === "serverIce" &&
          !instance.rezzed
        );
      },
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      moveCardToArchivesFaceup: (cardId) => {
        state.corp.archives.unshift(cardId);
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          faceup: true,
          rezzed: true,
          zone: { side: "corp", zone: "archives" },
        };
      },
    },
    servers: {
      createRemote: () => createRemote(state),
      mustServer: (serverId) => mustServer(state, serverId),
    },
    credits: {
      spendCorpCredits: (amount) => spendCredits(state, "corp", amount),
    },
    callbacks: {
      resolveCorpRootRez: (cardId) => {
        const definition = definitionFor(state, cardId);
        (
          cardImplementationCorpRootRezResolver(definition) ??
          CORP_ROOT_REZ_RESOLVERS[definition.id]
        )?.resolve(state);
      },
    },
  };
}

function scoredAgendaFlowHost(
  state: GameState,
  legalAction?: LegalAction,
  playerAction?: PlayerAction,
): ScoredAgendaFlowHost {
  return {
    state,
    ...(legalAction ? { legalAction } : {}),
    ...(playerAction ? { playerAction } : {}),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      scoredAgendaForDefinition: (definition) =>
        scoredAgendaImplementationForDefinition(definition),
      effectiveAgendaDifficulty: (cardId) =>
        effectiveAgendaDifficulty(effectiveAgendaDifficultyDeps, state, cardId),
      hasSubtype: (definition, subtype) => cardHasSubtype(definition, subtype),
      isOveradvanceAgendaDefinition: (definitionId) =>
        OVERADVANCE_AGENDA_CARD_IDS.has(definitionId as CardDefinitionId),
    },
    constants: {
      employeeEmpowermentId: EMPLOYEE_EMPOWERMENT_ID,
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      cleanupEmptyRemotes: () => cleanupEmptyRemotes(state),
      corpInstalledCardIds: () => corpInstalledCardIds(state),
      mustServer: (serverId) => mustServer(state, serverId),
    },
    counters: {
      setCardCounter: (cardId, counterType, amount) =>
        setCardCounter(state, cardId, counterType, amount),
      addCardCounter: (cardId, counterType, amount) =>
        addCardCounter(state, cardId, counterType, amount),
      cardCounter: (cardId, counterType) => cardCounter(state, cardId, counterType),
    },
    credits: {
      gainCredits: (side, amount) => credits(state, side, amount),
      setCorpCredits: (amount) => {
        state.corp.credits = amount;
      },
    },
    flags: {
      markScoredBlackOpsAgendaThisTurn: () => {
        ensureCorpTurnFlags(state).scoredBlackOpsAgendaThisTurn = true;
      },
      employeeEmpowermentResolvedSourceIds: () =>
        ensureCorpTurnFlags(state).employeeEmpowermentStartTurnResolvedSourceIds ??
        [],
      markEmployeeEmpowermentResolved: (cardId) => {
        const flags = ensureCorpTurnFlags(state);
        flags.employeeEmpowermentStartTurnResolvedSourceIds = [
          ...(flags.employeeEmpowermentStartTurnResolvedSourceIds ?? []),
          cardId,
        ];
      },
    },
    effects: {
      executeOnScore: (definition, cardId) => {
        if (!legalAction) return;
        executeCardImplementationLifecycleEffects(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
          definition,
          cardId,
          "on_score",
        );
      },
      appendEmployeeEmpowermentDrawEffect: (cardId, drawnCount) => {
        if (!legalAction) return;
        legalAction.resolvedEffects = [
          ...(legalAction.resolvedEffects ?? []),
          automaticDrawCardsEffect(
            `corp.start.employee_empowerment.${cardId}`,
            "corp",
            drawnCount,
            EMPLOYEE_EMPOWERMENT_ID,
          ),
        ];
      },
    },
    draw: {
      drawCorpCard: () => drawCorpCard(state),
    },
    choices: {
      startDataFortReclamation: (cardId) => {
        if (!legalAction) throw new Error("Data Fort Reclamation braucht eine LegalAction.");
        startDataFortReclamationChoice(
          corpInstallRezSequenceHandlerHost(state, legalAction),
          cardId,
        );
      },
      startPriorityRequisition: (cardId) => {
        if (!legalAction) throw new Error("Priority Requisition braucht eine LegalAction.");
        startPriorityRequisitionChoice(
          corpInstallRezSequenceHandlerHost(state, legalAction),
          cardId,
        );
      },
      startCorporateDownsizing: (cardId, creditPerAgendaPoint) => {
        if (!legalAction) throw new Error("Corporate Downsizing braucht eine LegalAction.");
        startCorporateDownsizingScoreChoice(
          corpZoneChoiceHandlerHost(state, legalAction),
          { sourceCardId: cardId, creditPerAgendaPoint },
        );
      },
      resolveSecurityPurge: () => {
        if (!legalAction) throw new Error("Security Purge braucht eine LegalAction.");
        resolveSecurityPurgeAgendaPurge(
          corpInstallRezSequenceHandlerHost(state, legalAction),
        );
      },
    },
  };
}

function scoredAgendaAbilityHost(
  state: GameState,
  legalAction?: LegalAction,
): ScoredAgendaAbilityHost {
  return {
    state,
    ...(legalAction ? { legalAction } : {}),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      scoredAgendaKindForDefinition: (definition) =>
        scoredAgendaKindForDefinition(definition),
      scoredAgendaForDefinition: (definition) =>
        scoredAgendaImplementationForDefinition(definition),
      isScoredRevealAgendaDefinition: (definitionId) =>
        SCORED_REVEAL_AGENDA_CARD_IDS.has(definitionId as CardDefinitionId),
    },
    actions: {
      createLegalAction: (side, type, label, source, costs, payload) =>
        action(state, side, type, label, source, costs, payload),
    },
    counters: {
      cardCounter: (cardId, counterType) => cardCounter(state, cardId, counterType),
      spendVisibleCardCounter: (cardId, counterType, amount) =>
        spendVisibleCardCounter(state, cardId, counterType, amount),
    },
    credits: {
      gainCorpCredits: (amount) => credits(state, "corp", amount),
    },
    actionProfiles: {
      scoredAgendaCounterCreditProfileForDefinition: (definitionId) =>
        scoredAgendaCounterCreditProfileForDefinition(definitionId),
      scoredAgendaCounterCreditProfileForPayload: (definitionId, payload) =>
        scoredAgendaCounterCreditProfileForPayload(definitionId, payload),
      scoredAgendaCounterCreditPayload: (profile, cardId) =>
        scoredAgendaCounterCreditPayload(profile, cardId),
    },
    callbacks: {
      pushActivatedCardImplementationActions: (actions, cardId, definition) =>
        pushActivatedCardImplementationActions(
          cardImplementationRuntimeDeps,
          state,
          actions,
          "corp",
          cardId,
          definition,
        ),
      resolveActivatedCardImplementationAbility: () => {
        if (!legalAction) return false;
        return resolveActivatedCardImplementationAbility(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
        );
      },
      revealCorpRdTop: () => {
        if (!legalAction) throw new Error("Scored-Agenda-Aktion fehlt.");
        revealCorpRdTop(state, legalAction);
      },
      resolveAiChiefFinancialOfficer: (sourceCardId) => {
        if (!legalAction) throw new Error("AI CFO braucht eine LegalAction.");
        resolveAiChiefFinancialOfficer(
          corpZoneChoiceHandlerHost(state, legalAction),
          sourceCardId,
        );
      },
    },
  };
}

function corpTraceDamageAbilityHost(
  state: GameState,
  legalAction?: LegalAction,
): CorpTraceDamageAbilityHost {
  return {
    state,
    ...(legalAction ? { legalAction } : {}),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
    },
    callbacks: {
      pushActivatedCardImplementationActions: (actions, cardId, definition) =>
        pushActivatedCardImplementationActions(
          cardImplementationRuntimeDeps,
          state,
          actions,
          "corp",
          cardId,
          definition,
        ),
      resolveActivatedCardImplementationAbility: () => {
        if (!legalAction) return false;
        return resolveActivatedCardImplementationAbility(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
        );
      },
    },
  };
}

function corpSpecialDamageAbilityHost(
  state: GameState,
  legalAction?: LegalAction,
): CorpSpecialDamageAbilityHost {
  return {
    state,
    ...(legalAction ? { legalAction } : {}),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      uniqueDirectLongtailImplementationForCard: (cardId) =>
        uniqueDirectLongtailImplementationForCard(state, cardId),
      uniqueDirectLongtailImplementationForDefinition: (definitionId) =>
        uniqueDirectLongtailImplementationForDefinition(definitionId),
      rezzedCorpRootCardIds: () => rezzedCorpRootCardIds(state),
    },
    actions: {
      buildLegalAction: (side, type, label, source, costs, payload) =>
        action(state, side, type, label, source, costs, payload),
    },
    agendaPoints: {
      total: () => corpAgendaPointTotal(state),
      scoredForfeitTargets: () => corpScoredAgendaForfeitTargets(state),
      pointsForScoredCard: (cardId) => agendaPointsForScoredCard(state, cardId),
      forfeitCorpAgendaForPointCost: (cardId) =>
        forfeitCorpAgendaForPointCost(state, cardId),
    },
    damage: {
      resolveDamageOperation: (damageType, amount, sourceDefinitionId) => {
        if (!legalAction) throw new Error("Damage-Aktion fehlt.");
        resolveDamageOperation(
          state,
          legalAction,
          damageType,
          amount,
          sourceDefinitionId,
        );
      },
    },
    rng: {
      rollDie: (purpose) => rollDeterministicDie(state, purpose),
      randomCounter: () => state.randomCounter,
    },
    trash: {
      trashCorpInstalledCardToArchives: (cardId) =>
        trashCorpInstalledCardToArchives(state, cardId),
    },
  };
}

function runnerAccessActionHost(state: GameState): RunnerAccessActionHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
      cardHasSubtype: (definition, subtype) => cardHasSubtype(definition, subtype),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
    },
    actions: {
      buildLegalAction: (side, type, label, source, costs, payload) =>
        action(state, side, type, label, source, costs, payload),
    },
    payment: {
      hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
      restrictedHostedCreditSourceIds: (use, options) =>
        restrictedHostedCreditSourceIds(state, use, options),
      isRestrictedHostedCreditSource: (definition) =>
        isRestrictedHostedCreditSource(definition),
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        cardCounter(state, cardId, counterType as CounterType),
    },
    callbacks: {
      successfulRunProgramActions: (run) => successfulRunProgramActions(state, run),
      runnerDuringRunCardImplementationActions: () =>
        runnerDuringRunCardImplementationActions(state),
      mysteryBoxRunActions: (run) => mysteryBoxRunActions(state, run),
    },
  };
}

function breachStateHost(state: GameState): BreachStateHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
    },
    rng: {
      nextRandom: (purpose) => nextRandom(state, purpose),
    },
  };
}

function accessFlowHost(state: GameState): AccessFlowHost {
  return {
    state,
    accessActions: runnerAccessActionHost(state),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
      cardHasSubtype: (definition, subtype) => cardHasSubtype(definition, subtype),
    },
    servers: {
      mustServer: (serverId) => mustServer(state, serverId),
      randomHqAccess: () => randomHqAccess(state),
    },
    effects: {
      executeAccessEffects: (cardId, legalAction) =>
        handleAccessEffectsForCard(accessEffectHandlerHost(state, legalAction), cardId),
      archivesAccessRequiresDecisionOrEffect: (cardId) =>
        archivesAccessRequiresDecisionOrEffect(state, cardId),
    },
    runner: {
      ensureTurnFlags: () => ensureRunnerTurnFlags(state),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      ensureSpecialZones: () => ensureSpecialZones(state),
    },
    payment: {
      spendRunnerCredits: (amount) => spendCredits(state, "runner", amount),
      spendRunnerAccessTrashCredits: (amount, accessedCardId) =>
        spendRunnerAccessTrashCredits(state, amount, accessedCardId),
    },
    steal: {
      agendaPointsForScoredCard: (cardId) =>
        agendaPointsForScoredCard(state, cardId),
      snapshotPersistentStealCostModifiersForSource: (
        cardId,
        serverId,
        legalAction,
      ) =>
        snapshotPersistentStealCostModifiersForSource(
          state,
          cardId,
          serverId,
          legalAction,
        ),
    },
    trash: {
      trashCorpInstalledCardToArchives: (cardId, legalAction) =>
        trashCorpInstalledCardToArchives(state, cardId, legalAction),
    },
    run: {
      finishRun: (successful, legalAction) =>
        finishRun(state, successful, legalAction),
      startExpertScheduleAnalyzerPostAccessChoice: (run, legalAction) =>
        startExpertScheduleAnalyzerPostAccessChoice(state, run, legalAction),
    },
    access: {
      installedRevealHelperCount: () => v1915InstalledRevealHelperIds(state).length,
    },
  };
}

function runAccessTransitionHost(state: GameState): RunAccessTransitionHost {
  return {
    state,
    breach: breachStateHost(state),
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
    },
    runner: {
      ensureTurnFlags: () => ensureRunnerTurnFlags(state),
    },
    draw: {
      drawCorpCards: (count) => drawCorpCards(state, count),
    },
    rng: {
      shuffleStateIds: (ids, purpose) => shuffleStateIds(state, ids, purpose),
    },
    access: {
      advanceArchivesBreachPastNonDecisionCards: (legalAction) =>
        advanceArchivesBreachPastNonDecisionCards(
          accessFlowHost(state),
          legalAction,
        ),
      findMicrotechAiInterfacePreAccessSource: (run) => {
        if (run.microtechAiInterfacePreAccessResolved) return undefined;
        const accessServerId = run.accessServerOverride ?? run.attackedServerId;
        if (accessServerId !== "rd") return undefined;
        return runnerInstalledCardIds(state)
          .slice()
          .sort()
          .find((cardId) =>
            cardImplementationForDefinitionId(definitionFor(state, cardId).id)
              ?.accessHooks?.some((hook) => hook.kind === "pre_access_rd_cut"),
          );
      },
      isMicrotechAiInterfacePreAccessSource: (cardId) =>
        runnerInstalledCardIds(state).includes(cardId) &&
        Boolean(
          cardImplementationForDefinitionId(definitionFor(state, cardId).id)
            ?.accessHooks?.some((hook) => hook.kind === "pre_access_rd_cut"),
        ),
      startRunnerPrivateLookChoice: (
        sourceCardId,
        sourceDefinitionId,
        zone,
        count,
        reason,
        legalAction,
      ) =>
        startRunnerPrivateLookChoice(
          state,
          sourceCardId,
          sourceDefinitionId,
          zone,
          count,
          reason,
          legalAction,
        ),
    },
    run: {
      isV097OrLater: () => isV097OrLater(state),
      finishRun: (successful, legalAction) =>
        finishRun(state, successful, legalAction),
      applyUniqueDirectSuccessfulRunTriggers: (legalAction) =>
        applyUniqueDirectSuccessfulRunTriggers(state, legalAction),
      successfulRunInterventionKindForSource: (sourceCardId) => {
        const window = fortRunWindowImplementationsForDefinition(
          definitionFor(state, sourceCardId).id,
        ).find(
          (candidate) =>
            candidate.kind ===
              "temporary_hq_ice_encounter_after_successful_run" ||
            candidate.kind === "install_hq_ice_innermost_after_successful_run",
        );
        return window?.kind as SuccessfulRunInterventionKind | undefined;
      },
      successfulRunInterventionCost: (kind, serverId, hqIceId) => {
        if (kind === "temporary_hq_ice_encounter_after_successful_run")
          return Math.max(0, Math.floor(rezCostForCard(state, hqIceId) / 2));
        return Math.max(0, Math.floor(mustServer(state, serverId).ice.length));
      },
    },
    choices: {
      selectedChoiceIds: (selectedChoices) => selectedChoiceIds(selectedChoices),
    },
  };
}

function accessEffectHandlerHost(
  state: GameState,
  legalAction?: LegalAction,
): AccessEffectHandlerHost {
  return {
    state,
    ...(legalAction ? { legalAction } : {}),
    definitions: {
      setup: SETUP_ACCESS_AMBUSH_ASSET_CARD_ID,
      trap: TRAP_ACCESS_AMBUSH_ASSET_CARD_ID,
      crybaby: CRYBABY_ACCESS_COST_UPGRADE_ID,
      dedicatedResponseTeam: DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID,
      dieterEsslin: DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID,
      turbeauDelacroix: TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID,
      corprunnersShatteredRemains: CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID,
      experimentalAi: EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID,
      vacantSoulkiller: VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID,
      virusTestSite: VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID,
      bizarreEncryptionScheme: BIZARRE_ENCRYPTION_SCHEME_ID,
      chimera: CHIMERA_ID,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      cardHasSubtype: (definition, subtype) => cardHasSubtype(definition, subtype),
      accessEffectsForDefinition: (definitionId) =>
        cardImplementationForDefinitionId(definitionId)?.accessEffects ?? [],
    },
    damage: {
      resolveDamageOperation: (damageType, amount, sourceDefinitionId) => {
        if (!legalAction) throw new Error("Damage-Aktion fehlt.");
        resolveDamageOperation(
          state,
          legalAction,
          damageType,
          amount,
          sourceDefinitionId,
        );
      },
      doDamage: (damageId, damageType, amount, sourceDefinitionId) =>
        doDamage(state, {
          damageId,
          damageType,
          amount,
          source: sourceDefinitionId,
        }),
      setDamagePayload: (summary) => {
        if (!legalAction) throw new Error("Damage-Aktion fehlt.");
        setDamagePayload(legalAction, summary);
      },
    },
    tags: {
      addRunnerTagsWithPrevention: (amount, sourceDefinitionId) => {
        if (!legalAction) throw new Error("Tag-Aktion fehlt.");
        addRunnerTagsWithPrevention(state, legalAction, amount, sourceDefinitionId);
      },
    },
    trace: {
      startTraceFromOperation: (sourceDefinitionId, baseTraceStrength, successEffect) => {
        if (!legalAction) throw new Error("Trace-Aktion fehlt.");
        startTraceFromOperation(
          state,
          sourceDefinitionId,
          baseTraceStrength,
          legalAction,
          successEffect as TraceSuccessEffect | undefined,
        );
      },
      traceSuccessEffectForCardImplementation: (effects) =>
        traceSuccessEffectForCardImplementation(effects),
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        cardCounter(state, cardId, counterType as CounterType),
      addCardCounter: (cardId, counterType, amount) =>
        addCardCounter(state, cardId, counterType as CounterType, amount),
    },
    payment: {
      spendCorpCredits: (amount) => spendCredits(state, "corp", amount),
    },
    trash: {
      trashRunnerInstalledCardToHeap: (cardId) =>
        trashRunnerInstalledCardToHeap(state, cardId),
      openRunnerInstalledTrashPreventionWindow: (targetIds, sourceDefinitionId) => {
        if (!legalAction) throw new Error("Trash-Prevention-Aktion fehlt.");
        return openRunnerInstalledTrashPreventionWindow(
          state,
          legalAction,
          targetIds,
          sourceDefinitionId,
        );
      },
    },
  };
}

function pushCorpTraceDamageOrCardImplementationActions(
  state: GameState,
  actions: LegalAction[],
  cardId: CardInstanceId,
  host: CorpTraceDamageAbilityHost = corpTraceDamageAbilityHost(state),
): void {
  const traceDamageActions = buildCorpTraceDamageAbilityActionsForCard(
    host,
    cardId,
  );
  if (traceDamageActions.handled) {
    actions.push(...traceDamageActions.actions);
    return;
  }
  pushActivatedCardImplementationActions(
    cardImplementationRuntimeDeps,
    state,
    actions,
    "corp",
    cardId,
    definitionFor(state, cardId),
  );
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
    if (traceIsInPhase(state, "corp_bid")) {
      resolveTraceCorpBid(state, legalAction, playerAction);
      return;
    }
    if (traceIsInPhase(state, "base_link")) {
      resolveTraceBaseLinkChoice(state, legalAction, playerAction);
      return;
    }
    if (traceIsInPhase(state, "post_bid_link")) {
      resolveTracePostBidLinkChoice(state, legalAction, playerAction);
      return;
    }
    resolveTraceRunnerBid(state, legalAction, playerAction);
    return;
  }
  const hiddenZoneArrangeChoice = handleHiddenZoneArrangeChoice(
    hiddenZoneArrangeChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneArrangeChoice.handled) return;
  const hiddenZoneNonSearchChoice = handleHiddenZoneNonSearchChoice(
    hiddenZoneNonSearchChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneNonSearchChoice.handled) return;
  const corpZoneChoice = handleCorpZoneChoice(
    corpZoneChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (corpZoneChoice.handled) return;
  const corpInstallRezSequenceChoice = handleCorpInstallRezSequenceChoice(
    corpInstallRezSequenceHandlerHost(state, legalAction, playerAction),
  );
  if (corpInstallRezSequenceChoice.handled) return;
  const scoredAgendaFlowChoice = handleScoredAgendaFlowChoice(
    scoredAgendaFlowHost(state, legalAction, playerAction),
  );
  if (scoredAgendaFlowChoice.handled) return;
  if (
    isP358HiddenReplacementCompatibilityChoiceSource(
      state.pendingChoice.source,
    )
  ) {
    resolveP358HiddenReplacementChoice(state, legalAction, playerAction);
    return;
  }
  const hiddenZoneSearchChoice = handleHiddenZoneSearchChoice(
    hiddenZoneSearchChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneSearchChoice.handled) {
    if (hiddenZoneSearchChoice.deletePendingChoice) delete state.pendingChoice;
    return;
  }
  if (
    state.pendingChoice.source.startsWith("runner_program_trash_before_install")
  ) {
    resolveRunnerProgramTrashBeforeInstallChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1912.hunt_club_bbs_expose")) {
    resolveHuntClubBbsExposeChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_36.expose_installed_cards")) {
    resolveExposeInstalledCorpCardsChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1917.investment_firm_credit")) {
    resolveInvestmentFirmCreditChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_61.crash_draw")) {
    resolveCrashEverettDrawChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1914.power_grid_overload")) {
    resolvePowerGridOverloadChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith(
      "v1919.systematic_layoffs_advancement",
    )
  ) {
    resolveSystematicLayoffsAdvancementChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("v1918.singapore_city_grid")) {
    resolveSingaporeCityGridSwapChoice(state, legalAction, playerAction);
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
  if (state.pendingChoice.source.startsWith("v1921.playful_ai")) {
    resolveV1921PlayfulAiChoice(state, legalAction, playerAction);
    return;
  }
  if (
    state.pendingChoice.source.startsWith("p3_56.too_many_doors_secret_spend")
  ) {
    resolveTooManyDoorsSecretSpendChoice(state, legalAction, playerAction);
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
  if (
    state.pendingChoice.source.startsWith("p3_56.pass_ice_program_trash")
  ) {
    resolvePassRezzedIceProgramTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v1922.speed_trap")) {
    resolveSpeedTrapRezInterruptChoice(state, legalAction, playerAction);
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
  if (state.pendingChoice.source.startsWith("p3_54.delayed_success")) {
    resolveSuccessfulRunInterventionChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("v199.chimera_daemon_trash")) {
    resolveChimeraDaemonTrashChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_35.access_payment")) {
    resolveCardImplementationAccessPaymentChoice(state, legalAction, playerAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.priority_wreck")) {
    resolvePriorityWreckSpendChoice(
      runAccessTransitionHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.private_look")) {
    resolveRunnerPrivateLookChoice(state, legalAction);
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_33.microtech_ai_interface")) {
    resolveMicrotechAiInterfacePreAccessChoice(
      runAccessTransitionHost(state),
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_34.distribute_advancement")) {
    resolveCardImplementationAdvancementDistributionChoice(
      state,
      legalAction,
      playerAction,
    );
    return;
  }
  if (state.pendingChoice.source.startsWith("p3_34.move_advancement")) {
    resolveCardImplementationMoveAdvancementChoice(
      state,
      legalAction,
      playerAction,
    );
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
    setupDecision: selected,
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
  startSelfModifyingCodeStackActivation(
    hiddenZoneSearchActivationHandlerHost(state, legalAction),
    sourceCardId,
  );
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
  if (state.runner.memoryUsed + (definition.memoryCost ?? 0) > runnerMemoryLimit(state))
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
  if (shouldLoadLegacyRecurringCredits(definition))
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
  executeCardImplementationLifecycleEffects(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
    definition,
    cardId,
    "on_install",
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    installedProgramDefinitionId: definition.id,
    installCostPaid: definition.installCost ?? 0,
    runnerCreditsAfter: state.runner.credits,
  };
  return true;
}

function canInstallRunnerProgramFromZone(
  state: GameState,
  cardId: CardInstanceId,
  zone: "heap" | "stack",
  installCost: "normal" | "free",
): boolean {
  const zoneIds = zone === "heap" ? state.runner.heap : state.runner.stack;
  if (!zoneIds.includes(cardId)) return false;
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program") return false;
  if (
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    return false;
  if (
    installCost === "normal" &&
    availableRunnerProgramInstallCredits(state) < (definition.installCost ?? 0)
  )
    return false;
  return (
    state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
    runnerMemoryLimit(state)
  );
}

function installRunnerProgramFromZoneWithoutClick(
  state: GameState,
  cardId: CardInstanceId,
  zone: "heap" | "stack",
  installCost: "normal" | "free",
  legalAction: LegalAction,
): boolean {
  if (!canInstallRunnerProgramFromZone(state, cardId, zone, installCost))
    return false;
  const definition = definitionFor(state, cardId);
  if (installCost === "normal")
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
  if (shouldLoadLegacyRecurringCredits(definition))
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
  executeCardImplementationLifecycleEffects(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
    definition,
    cardId,
    "on_install",
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    installedProgramDefinitionId: definition.id,
    installedCardDefinitionId: definition.id,
    installedFromZone: zone === "heap" ? "runner_heap" : "runner_stack",
    installCostPaid: installCost === "normal" ? definition.installCost ?? 0 : 0,
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

function installRunnerProgramForFree(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
  options: {
    checkUnique?: boolean;
    typeError?: string;
    memoryError?: string;
  } = {},
): CardInstanceId {
  const definition = definitionFor(state, cardId);
  if (definition.type !== "program")
    throw new Error(options.typeError ?? "Sneak Preview darf nur Programme installieren.");
  if (
    (options.checkUnique ?? true) &&
    isUniqueCard(definition) &&
    hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
    runnerMemoryLimit(state)
  )
    throw new Error(options.memoryError ?? "Nicht genug Memory fuer Sneak Preview.");
  removeFromAllZones(state, cardId);
  state.runner.rig.programs.push(cardId);
  state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
  };
  if (shouldLoadLegacyRecurringCredits(definition))
    setCardCounter(state, cardId, "recurring_credit", definition.recurringCredits ?? 0);
  if (
    definition.mechanics.includes("virus") &&
    definition.id !== BUTCHER_BOY_ID &&
    definition.id !== SKIVVISS_ID
  )
    addCardCounter(state, cardId, "virus", 1);
  executeCardImplementationLifecycleEffects(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
    definition,
    cardId,
    "on_install",
  );
  return cardId;
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
    ...withoutProteusVariableIceState(
      mustInstance(state.cardInstances, selectedId),
    ),
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
  const icePositionLabel =
    publicIcePositionLabelForCard(state, selectedId) ?? serverLabel;
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
    targetIcePositionLabel: icePositionLabel,
  };
}

function publicIcePositionLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  const zone = state.cardInstances[cardId]?.zone;
  const serverId = zone && "serverId" in zone ? zone.serverId : undefined;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const serverLabel = publicServerLabel(state, serverId);
  if (!server || !serverLabel) return serverLabel;
  const iceIndex = server.ice.indexOf(cardId);
  return iceIndex >= 0
    ? `ICE ${iceIndex + 1} in ${serverLabel}`
    : `ICE in ${serverLabel}`;
}

function publicIceSelectionLabelForCard(
  state: GameState,
  cardId: string | undefined,
): string | undefined {
  if (!cardId) return undefined;
  return publicIcePositionLabelForCard(state, cardId);
}

function startForgedActivationOrdersTargetChoice(
  state: GameState,
  sourceCardId: string,
): void {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const targets = corpInstalledCardIds(state)
    .filter(
      (cardId) =>
        mustInstance(state.cardInstances, cardId).zone.zone === "serverIce",
    );
  if (targets.length === 0)
    throw new Error(
      "Keine ICE als Ziel fuer Forged Activation Orders.",
    );
  state.pendingChoice = {
    choiceId: `v1922_forged_activation_orders_target_${state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.forged_activation_orders_target:${sourceCardId}:${state.stateVersion + 1}`,
    prompt: "ICE für Rez-/Trash-Entscheidung wählen",
    kind: "select_cards",
    options: targets.map((cardId, index) => {
      const iceLabel = publicIceSelectionLabelForCard(state, cardId) ?? "ICE";
      return {
        id: `ice_${index + 1}`,
        label: iceLabel,
        publicLabel: iceLabel,
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
  if (
    !selectedId ||
    !corpInstalledCardIds(state).includes(selectedId) ||
    mustInstance(state.cardInstances, selectedId).zone.zone !== "serverIce"
  )
    throw new Error(
      "Das Forged-Activation-Orders-Ziel ist keine installierte ICE.",
    );
  const serverLabel = publicServerLabelForCard(state, selectedId) ?? "Server";
  const icePositionLabel =
    publicIcePositionLabelForCard(state, selectedId) ?? serverLabel;
  state.pendingChoice = {
    choiceId: `v1922_forged_activation_orders_corp_${state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.forged_activation_orders_corp:${selectedId}:${state.stateVersion + 1}`,
    prompt: "ICE rezzen oder trashen",
    kind: "select_option",
    options: [
      ...(!mustInstance(state.cardInstances, selectedId).rezzed &&
      state.corp.credits >= rezCostForCard(state, selectedId)
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
    targetIcePositionLabel: icePositionLabel,
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
  if (
    !targetIceId ||
    !corpInstalledCardIds(state).includes(targetIceId) ||
    mustInstance(state.cardInstances, targetIceId).zone.zone !== "serverIce"
  )
    throw new Error(
      "Das Forged-Activation-Orders-Ziel ist nicht mehr installierte ICE.",
    );
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const definition = definitionFor(state, targetIceId);
  const serverLabel = publicServerLabelForCard(state, targetIceId) ?? "Server";
  const icePositionLabel =
    publicIcePositionLabelForCard(state, targetIceId) ?? serverLabel;
  if (selected === "rez_ice") {
    if (mustInstance(state.cardInstances, targetIceId).rezzed)
      throw new Error("Die ICE ist bereits gerezzt.");
    const rezCost = rezCostForCard(state, targetIceId);
    if (state.corp.credits < rezCost)
      throw new Error("Die Korp kann die ICE nicht rezzen.");
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
      targetIcePositionLabel: icePositionLabel,
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
    targetIcePositionLabel: icePositionLabel,
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
      const iceLabel = publicIceSelectionLabelForCard(state, cardId) ?? "ICE";
      return {
        id: `ice_${index + 1}`,
        label: iceLabel,
        publicLabel: iceLabel,
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
    if (state.runner.credits < 1)
      throw new Error("Der Runner kann Open-Ended Mileage Program nicht bezahlen.");
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
    throw new Error("Singapore City Grid ist nicht im angegriffenen Remote.");
  const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
  if (
    !sourceInstance.rezzed ||
    !isFortIceSwapSource(state, sourceCardId)
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
    throw new Error("Singapore City Grid ist nicht mehr im angegriffenen Remote.");
  if (
    !isFortIceSwapSource(state, sourceCardId) ||
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
    ...withoutProteusVariableIceState(targetInstance),
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
    sourceDefinitionId: definitionFor(state, sourceCardId).id,
    serverLabel: server.label,
    iceIndex,
    swappedIceCount: 1,
    oncePerRunConsumed: true,
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
          runnerMemoryLimit(state)
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
    runnerMemoryLimit(state)
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
  } else if (value.startsWith("fait:")) {
    const serverId = value.slice("fait:".length) as Exclude<
      ServerId,
      "new_remote"
    >;
    mustServer(state, serverId);
    const available = Math.max(
      0,
      Math.floor(state.faitAccompliCountersByServer?.[serverId] ?? 0),
    );
    if (available <= 0)
      throw new Error("Der gewählte Fait-Counter ist nicht mehr verfügbar.");
    state.faitAccompliCountersByServer = {
      ...(state.faitAccompliCountersByServer ?? {}),
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
    if (!isAardvarkSource(state, aardvarkId))
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
      publicRevealDefinitionId: definitionFor(state, aardvarkId).id,
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

function resolveSuccessfulRunInterventionChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_54.delayed_success"))
    throw new Error("Es ist keine Delayed-Success-Choice offen.");
  const [, sourceCardId = "", kind = "", serverId = ""] = choice.source.split(":");
  if (
    kind !== "temporary_hq_ice_encounter_after_successful_run" &&
    kind !== "install_hq_ice_innermost_after_successful_run"
  )
    throw new Error("Die Delayed-Success-Choice ist ungueltig.");
  const run = mustRun(state);
  if (
    !sourceCardId ||
    !state.cardInstances[sourceCardId] ||
    run.attackedServerId !== serverId ||
    run.position.kind !== "server" ||
    run.delayedSuccessfulRun
  )
    throw new Error("Der Delayed-Success-Kontext ist nicht mehr gueltig.");
  const server = mustServer(state, run.attackedServerId);
  if (!server.root.includes(sourceCardId) || !mustInstance(state.cardInstances, sourceCardId).rezzed)
    throw new Error("Die Delayed-Success-Quelle ist nicht mehr gueltig.");
  const transitionHost = runAccessTransitionHost(state);
  const interventionKind = kind as SuccessfulRunInterventionKind;
  if (
    transitionHost.run.successfulRunInterventionKindForSource(sourceCardId) !==
    interventionKind
  )
    throw new Error("Die Delayed-Success-Quelle passt nicht zur Karte.");
  const used = run.successfulRunInterventionUsedSourceIds ?? [];
  if (used.includes(sourceCardId))
    throw new Error("Diese Delayed-Success-Quelle wurde bereits genutzt.");

  const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selectedId);
  if (!option) throw new Error("Die Delayed-Success-Auswahl ist ungueltig.");
  const definition = definitionFor(state, sourceCardId);
  if (option.value === "decline") {
    run.successfulRunInterventionWindowClosed = true;
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      delayedSuccessfulRun: false,
      fortWindowSourceTitle: definition.title,
      sourceDefinitionId: definition.id,
      sourceCardId,
      serverId: run.attackedServerId,
    };
    enterAccessFromSuccessfulRun(transitionHost, legalAction);
    return;
  }

  const hqIceId = typeof option.value === "string" ? option.value : "";
  if (!hqIceId || !state.corp.hq.includes(hqIceId))
    throw new Error("Das gewaehlte HQ-ICE ist nicht mehr in HQ.");
  if (definitionFor(state, hqIceId).type !== "ice")
    throw new Error("Delayed Success darf nur ICE aus HQ waehlen.");
  const cost = transitionHost.run.successfulRunInterventionCost(
    interventionKind,
    server.id,
    hqIceId,
  );
  spendCredits(state, "corp", cost);
  removeFromAllZones(state, hqIceId);
  server.ice.unshift(hqIceId);
  run.successfulRunInterventionUsedSourceIds = [...used, sourceCardId];
  run.successfulRunInterventionWindowClosed = true;
  delete state.pendingChoice;

  if (kind === "temporary_hq_ice_encounter_after_successful_run") {
    state.cardInstances[hqIceId] = {
      ...mustInstance(state.cardInstances, hqIceId),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverIce", serverId: server.id },
    };
    state.run = {
      ...run,
      phase: "encounter_ice",
      position: { kind: "ice", serverId: server.id, iceIndex: 0 },
      approachedIceId: hqIceId,
      delayedSuccessfulRun: {
        originalServerId: server.id,
        interventionSourceId: sourceCardId,
        pendingMode: "temporary_hq_ice_encounter",
        temporaryIceId: hqIceId,
      },
    };
    beginEncounter(state, hqIceId, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      delayedSuccessfulRun: true,
      temporaryEncounter: true,
      temporaryIceSourceTitle: definition.title,
      fortWindowSourceTitle: definition.title,
      sourceDefinitionId: definition.id,
      sourceCardId,
      selectedIceDefinitionId: definitionFor(state, hqIceId).id,
      rezCostPaid: cost,
      serverId: server.id,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_54_dr_dreff_temporary_encounter",
    };
    return;
  }

  state.cardInstances[hqIceId] = {
    ...mustInstance(state.cardInstances, hqIceId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId: server.id },
  };
  state.run = {
    ...run,
    phase: "approach_ice",
    position: { kind: "ice", serverId: server.id, iceIndex: 0 },
    approachedIceId: hqIceId,
    delayedSuccessfulRun: {
      originalServerId: server.id,
      interventionSourceId: sourceCardId,
      pendingMode: "installed_ice_immediate_approach",
      installedIceId: hqIceId,
    },
  };
  approachOrEncounterIce(state, hqIceId, legalAction);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    delayedSuccessfulRun: true,
    installedInnermost: true,
    fortWindowSourceTitle: definition.title,
    sourceDefinitionId: definition.id,
    sourceCardId,
    installCostPaid: cost,
    serverId: server.id,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_54_jenny_jett_install_approach",
  };
}

function resolveChimeraDaemonTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  resolveAccessChimeraDaemonTrashChoice(
    accessEffectHandlerHost(state, legalAction),
    selectedChoiceIds(playerAction.selectedChoices)[0] ?? "",
  );
}

function resolveCardImplementationAccessPaymentChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  resolveAccessPaymentChoice(
    accessEffectHandlerHost(state, legalAction),
    selectedChoiceIds(playerAction.selectedChoices)[0] ?? "",
  );
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

function iceChoiceLabelForSide(
  state: GameState,
  cardId: CardInstanceId,
  visibleTo: Side,
  fallback: string,
): { label: string; publicLabel: string } {
  const instance = mustInstance(state.cardInstances, cardId);
  const definition = definitionFor(state, cardId);
  if (visibleTo === "corp" || instance.rezzed || instance.faceup) {
    return { label: definition.title, publicLabel: definition.title };
  }
  return { label: fallback, publicLabel: fallback };
}

function resolveP358HiddenReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const source = state.pendingChoice?.source ?? "";
  const hiddenZoneArrangeChoice = handleHiddenZoneArrangeChoice(
    hiddenZoneArrangeChoiceHandlerHost(state, legalAction, playerAction),
  );
  if (hiddenZoneArrangeChoice.handled) return;
  void legalAction;
  void playerAction;
  throw new Error("Unbekannte P3.58-Choice.");
}

function resolvePlayfulAiDiceLoopEvent(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
  implementation: CardRunnerEventLongtailImplementation,
): void {
  if (
    implementation.kind !== "playful_ai_dice_loop" ||
    implementation.dieFaces !== 6 ||
    implementation.visibility !== "public"
  )
    throw new Error("Playful-AI-Implementation ist ungueltig.");
  const dieRoll = rollDeterministicDie(
    state,
    `v1921.die.${sourceDefinitionId}.dice_loop.initial`,
  );
  const choiceOpened = implementation.choiceOn.includes(
    dieRoll as (typeof implementation.choiceOn)[number],
  );
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
    sourceDefinitionId,
    v1921DieRoll: dieRoll,
    playfulAiDieRolls: String(dieRoll),
    playfulAiRolledDice: 1,
    playfulAiDiceQueuedAfterRolls: 0,
    playfulAiRemainingDice: 0,
    playfulAiChoiceOpened: choiceOpened,
    playfulAiComplete: !choiceOpened,
    randomCounterAfter: state.randomCounter,
  };
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
  sourceDefinitionId: CardDefinitionId,
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
      `v1921.die.${sourceDefinitionId}.dice_loop.followup.${state.stateVersion + 1}.${nextRollIndex}`,
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
    runnerEventLongtailKindForDefinition(definitionFor(state, sourceCardId)) !==
      "playful_ai_dice_loop"
  )
    throw new Error("Die Playful-AI-Choice gehoert nicht zur gespielten Karte.");
  const sourceDefinitionId = definitionFor(state, sourceCardId).id;
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
      sourceDefinitionId,
      queuedDiceBeforeRolls,
      rollIndex,
    );
  }

  const payload: NonNullable<LegalAction["payload"]> = {
    ...(legalAction.payload ?? {}),
    v1921RunnerEventAbility: "playful_ai_dice_loop",
    sourceDefinitionId,
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
  const result = shuffleRunnerStackAndRefreshZones({
    stack: state.runner.stack,
    cardInstances: state.cardInstances,
    shuffle: (stack) => shuffleStateIds(state, stack, purpose),
  });
  state.runner.stack = result.shuffledStack;
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
    if (cardImplementationForDefinitionId(sourceDefinition.id))
      throw new Error("Diese Stack-Search-Ability wird deklarativ abgewickelt.");
    spendCredits(state, "runner", creditCostForAction(legalAction));
    if (sourceDefinition.id === AUJOURD_OUI_RESOURCE_CARD_ID) {
      startAujourdOuiTop5Activation(
        hiddenZoneSearchActivationHandlerHost(state, legalAction),
        sourceCardId,
      );
    } else {
      startRunnerStackSearchChoiceActivation(
        hiddenZoneSearchActivationHandlerHost(state, legalAction),
        {
          sourcePrefix:
            sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
              ? `v1911.short_circuit_search:${sourceCardId}`
              : "v1911.search_stack",
          choiceIdPrefix:
            sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
              ? "v1911_short_circuit_search"
              : "v1911_search_stack",
        },
      );
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      sourceDefinitionId: sourceDefinition.id,
      hiddenZoneAction:
        sourceDefinition.id === AUJOURD_OUI_RESOURCE_CARD_ID
          ? "v1911_aujourdoui_top5"
          : sourceDefinition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID
          ? "v1911_short_circuit_search"
          : "v1911_search_stack",
    };
    return;
  }
  if (ability === "expose_server_card") {
    if (!SERVER_EXPOSE_PROGRAM_CARD_IDS.has(sourceDefinition.id))
      throw new Error("Diese Karte darf keine Expose-Ability nutzen.");
    if (cardImplementationForDefinitionId(sourceDefinition.id))
      throw new Error("Diese Expose-Ability wird deklarativ abgewickelt.");
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
      hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
      {
        sourcePrefix: `v1911.arrange_stack_top2:${sourceCardId}`,
        choiceIdPrefix: "v1911_arrange_stack_top2",
      },
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
  if (
    scoredAgendaKindForDefinition(definitionFor(state, sourceCardId)) !==
    "corporate_downsizing_hq_agendas"
  )
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

function installedCorpCardServerContext(
  state: GameState,
  cardId: CardInstanceId,
): { server: CorpServer; area: "root" | "ice"; index: number } | undefined {
  for (const server of state.corp.servers) {
    const rootIndex = server.root.indexOf(cardId);
    if (rootIndex >= 0) return { server, area: "root", index: rootIndex };
    const iceIndex = server.ice.indexOf(cardId);
    if (iceIndex >= 0) return { server, area: "ice", index: iceIndex };
  }
  return undefined;
}

function exposeInstalledCorpCardTargets(
  state: GameState,
  _scope: "inside_data_fort" | "any_installed",
): CardInstanceId[] {
  const targets: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of [...server.root, ...server.ice]) {
      const instance = mustInstance(state.cardInstances, cardId);
      if (!instance.rezzed) targets.push(cardId);
    }
  }
  return targets.sort();
}

function exposeInstalledCorpCardLabel(
  state: GameState,
  cardId: CardInstanceId,
): string {
  const context = installedCorpCardServerContext(state, cardId);
  if (!context) return "Installierte Korp-Karte";
  return context.area === "ice"
    ? `${context.server.label} ICE ${context.index + 1}`
    : `${context.server.label} Root ${context.index + 1}`;
}

function exposeInstalledCorpCardForImplementation(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinition["id"],
  targetCardId: CardInstanceId,
  scope: "inside_data_fort" | "any_installed",
): { publicPayload: Record<string, string | number | boolean> } {
  const legalTargets = new Set(exposeInstalledCorpCardTargets(state, scope));
  if (!legalTargets.has(targetCardId))
    throw new Error("Diese installierte Korp-Karte kann nicht exposed werden.");
  const targetDefinition = definitionFor(state, targetCardId);
  const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
  const context = installedCorpCardServerContext(state, targetCardId);
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_expose_server_card",
    publicRevealKind: "expose",
    publicRevealDefinitionId: targetDefinition.id,
    cardDefinitionId: targetDefinition.id,
    targetDefinitionId: targetDefinition.id,
    exposedCardDefinitionId: targetDefinition.id,
    exposedCardTitle: targetDefinition.title,
    exposedCardInstanceId: targetCardId,
    sourceCardId,
    sourceDefinitionId,
    ...(sourceDefinition ? { sourceTitle: sourceDefinition.title } : {}),
    ...(context
      ? {
          exposedServerId: context.server.id,
          exposedServerLabel: context.server.label,
          exposedArea: context.area,
          exposedIndex: context.index,
          exposedPositionKey: `${context.area}:${context.index}`,
        }
      : {}),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
}

function installedRunnerIcebreakerIds(state: GameState): CardInstanceId[] {
  return state.runner.rig.programs
    .filter((cardId) => cardHasSubtype(definitionFor(state, cardId), "icebreaker"))
    .sort();
}

function addCounterToAllInstalledRunnerIcebreakers(
  state: GameState,
  counterType: Extract<CounterType, "militech">,
  amount: number,
): { amount: number; counterType: Extract<CounterType, "militech">; countersAfter: number; publicPayload: Record<string, string | number | boolean> } {
  const targetIds = installedRunnerIcebreakerIds(state);
  for (const cardId of targetIds) addCardCounter(state, cardId, counterType, amount);
  return {
    amount: targetIds.length * amount,
    counterType,
    countersAfter: targetIds.reduce(
      (sum, cardId) => sum + cardCounter(state, cardId, counterType),
      0,
    ),
    publicPayload: {
      counterType,
      addedCounterAmount: targetIds.length * amount,
      targetCount: targetIds.length,
      targetCardDefinitionIds: targetIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(","),
    },
  };
}

function resolveDealWithMilitech(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (!runnerStoleAgendaSubtypeThisTurn(state, "research"))
    throw new Error("Deal with Militech benoetigt eine befreite Research-Agenda in diesem Zug.");
  const result = addCounterToAllInstalledRunnerIcebreakers(
    state,
    "militech",
    1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: DEAL_WITH_MILITECH_ID,
    ...result.publicPayload,
  };
}

function huntClubBbsExposeTargets(state: GameState): CardInstanceId[] {
  return exposeInstalledCorpCardTargets(state, "any_installed");
}

function huntClubBbsExposeOptionLabel(
  state: GameState,
  cardId: CardInstanceId,
): string {
  return exposeInstalledCorpCardLabel(state, cardId);
}

function exposeInstalledCorpCardsChoiceOptions(state: GameState) {
  return exposeInstalledCorpCardTargets(state, "any_installed").map((cardId) => ({
    id: `card_${cardId}`,
    label: exposeInstalledCorpCardLabel(state, cardId),
    value: cardId,
  }));
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

function startExposeInstalledCorpCardsChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinition["id"],
  min: number,
  max: number,
): { publicPayload: Record<string, string | number | boolean> } {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = exposeInstalledCorpCardsChoiceOptions(state);
  if (options.length === 0)
    throw new Error("Es gibt keine installierte verdeckte Korp-Karte.");
  state.pendingChoice = {
    choiceId: `p3_36_expose_installed_cards_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_36.expose_installed_cards:${sourceCardId}:${sourceDefinitionId}:${state.stateVersion + 1}`,
    prompt: "Bis zu drei installierte Korp-Karten exposen",
    kind: "select_cards",
    options,
    minSelections: Math.min(min, options.length),
    maxSelections: Math.min(max, options.length),
    stateVersion: state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose_choice",
    choiceVisibility: "runner_private",
    sourceDefinitionId,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
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

function resolveExposeInstalledCorpCardsChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_36.expose_installed_cards"))
    throw new Error("Es ist keine Expose-Choice offen.");
  const [, sourceCardId = "", sourceDefinitionId = ""] = choice.source.split(":");
  if (!sourceCardId || !state.cardInstances[sourceCardId])
    throw new Error("Die Expose-Quelle ist nicht mehr installiert.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  if (sourceDefinition.id !== sourceDefinitionId)
    throw new Error("Die Expose-Quelle passt nicht mehr zur Choice.");
  const selectedIds = selectedChoiceCardIds(choice, playerAction);
  const legalTargets = new Set(exposeInstalledCorpCardTargets(state, "any_installed"));
  for (const cardId of selectedIds) {
    if (!legalTargets.has(cardId))
      throw new Error("Diese installierte Korp-Karte darf nicht exposed werden.");
  }
  const labels = selectedIds.map((cardId) =>
    exposeInstalledCorpCardLabel(state, cardId),
  );
  const definitions = selectedIds.map((cardId) => definitionFor(state, cardId));
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "hunt_club_bbs_expose",
    publicRevealKind: "expose",
    sourceDefinitionId,
    sourceTitle: sourceDefinition.title,
    revealedCount: selectedIds.length,
    publicRevealDefinitionIds: definitions
      .map((definition) => definition.id)
      .join(","),
    publicRevealTitles: definitions
      .map((definition) => definition.title)
      .join("||"),
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
  sourceCardId?: CardInstanceId,
  sourceDefinitionId?: CardDefinition["id"],
): { publicPayload: Record<string, string | number | boolean> } {
  const exposures = outermostIceExposures(state);
  if (exposures.length === 0)
    throw new Error("Es liegt kein outermost ICE zum Exposen in einem Data Fort.");
  const sourceDefinition = sourceDefinitionId
    ? DEMO_CARDS_BY_ID[sourceDefinitionId]
    : undefined;
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1911_expose_outermost_ice_each_data_fort",
    publicRevealKind: "expose",
    ...(sourceCardId ? { sourceCardId } : {}),
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    ...(sourceDefinition ? { sourceTitle: sourceDefinition.title } : {}),
    revealedCount: exposures.length,
    publicRevealDefinitionIds: exposures
      .map(({ cardId }) => definitionFor(state, cardId).id)
      .join(","),
    exposedServerIds: exposures.map(({ server }) => server.id).join(","),
    exposedServerLabels: exposures.map(({ server }) => server.label).join(","),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...payload,
  };
  return { publicPayload: payload };
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
        (definitionFor(state, cardId).id === KRUMZ_TRACE_ASSET_CARD_ID ||
          hasCorpUtilityKind(state, cardId, "krumz_trace_bit")) &&
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
        isParisTracePoolSource(state, rootId) &&
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

function encounterTemporaryTraceCreditsAvailable(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
): number {
  const credits = state.run?.encounterTemporaryTraceCredits;
  if (
    !credits ||
    credits.sourceIceId !== trace.sourceCardInstanceId ||
    credits.sourceIceId !== trace.encounterTemporaryTraceCreditSourceIceId
  )
    return 0;
  return Math.max(0, Math.floor(credits.remaining ?? 0));
}

function spendEncounterTemporaryTraceCredits(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
  amount: number,
): number {
  const credits = state.run?.encounterTemporaryTraceCredits;
  if (
    !credits ||
    credits.sourceIceId !== trace.sourceCardInstanceId ||
    amount <= 0
  )
    return 0;
  const spent = Math.min(Math.max(0, Math.floor(amount)), credits.remaining);
  credits.remaining = Math.max(0, credits.remaining - spent);
  return spent;
}

const corpTracePaymentDeps: CorpTracePaymentDependencies = {
  encounterTemporaryTraceCreditsAvailable,
  spendEncounterTemporaryTraceCredits,
  parisCityGridTracePoolTotal,
  spendParisCityGridTracePool,
  corpCreditsAvailable: (state) => state.corp.credits,
  spendCorpCredits: (state, amount) => spendCredits(state, "corp", amount),
  krumzTraceBitTotal,
  spendKrumzTraceBits,
  hackerTrackerCounterTotal,
  spendHackerTrackerCounters,
  cardCounter,
};

const runnerTracePaymentDeps: RunnerTracePaymentDependencies = {
  runnerTraceLinkCreditSourceIds,
  hostedPaymentCredits,
  spendHostedPaymentCredits,
  runnerCreditsAvailable: (state) => state.runner.credits,
  spendRunnerCredits: (state, amount) => spendCredits(state, "runner", amount),
  recordWilsonRunCapSpend,
  definitionIdForCard: (state, cardId) => definitionFor(state, cardId).id,
  hellsRunDefinitionId: HELLS_RUN_ID,
};

function resolveTraceCorpBid(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = requireTracePhase(state, "corp_bid");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  const tracePaymentQuote = assertCorpTraceBidPaymentValid(
    corpTracePaymentDeps,
    state,
    trace,
    bid,
  );
  const tracePaymentReceipt = payCorpTraceBidQuote(
    corpTracePaymentDeps,
    state,
    trace,
    tracePaymentQuote,
  );
  const tracePaymentPayload = corpTracePaymentPublicPayload(
    trace,
    tracePaymentQuote,
    tracePaymentReceipt,
  );
  const traceStrength = trace.baseTraceStrength + bid;
  const runnerLink = calculateRunnerLink(state);
  const cryingCounterCount = cardCounter(state, state.runner.identity, "crying");
  const baseLinkTrace = {
    ...trace,
    status: "base_link" as const,
    corpBid: bid,
    traceStrength,
    runnerLink,
  };
  if (startTraceBaseLinkChoice(state, baseLinkTrace)) {
    state.trace = baseLinkTrace;
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
      ...tracePaymentPayload,
      traceStrength,
      runnerLink,
      traceBaseLinkChoiceOpened: true,
      ...(cryingCounterCount > 0 ? { cryingCounterCount, cryingLinkReduction: cryingCounterCount * 2 } : {}),
    };
    return;
  }
  state.trace = {
    ...baseLinkTrace,
    status: "runner_bid",
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
    ...tracePaymentPayload,
    traceStrength,
    runnerLink,
    ...(cryingCounterCount > 0 ? { cryingCounterCount, cryingLinkReduction: cryingCounterCount * 2 } : {}),
    traceBaseLinkChoiceOpened: false,
  };
}

type TracePostBidLinkCandidate = {
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
  label: string;
  linkDelta: number;
  creditCost: number;
  limitOncePerTrace: boolean;
};

function creditCostForTraceAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  const creditCosts = ability.costs.filter((cost) => cost.kind === "credit");
  if (
    ability.costs.length !== 1 ||
    creditCosts.length !== 1 ||
    !Number.isInteger(creditCosts[0]?.amount) ||
    (creditCosts[0]?.amount ?? 0) < 0
  ) {
    throw new Error(
      "Trace CardImplementation ability supports exactly one nonnegative credit cost.",
    );
  }
  return creditCosts[0]!.amount;
}

function activatedCardImplementationTraceAbilities(
  definition: CardDefinition,
  timing: Extract<
    ActivatedCardAbilityImplementation["timing"],
    "trace_base_link_window" | "trace_post_bid_link_window"
  >,
): Array<{ ability: ActivatedCardAbilityImplementation; index: number }> {
  return (
    cardImplementationForDefinitionId(definition.id)?.abilities
      ?.map((ability, index) => ({ ability, index }))
      .filter(
        (
          entry,
        ): entry is {
          ability: ActivatedCardAbilityImplementation;
          index: number;
        } => entry.ability.kind === "activated" && entry.ability.timing === timing,
      ) ?? []
  );
}

function increaseTraceLinkEffect(
  ability: ActivatedCardAbilityImplementation,
): IncreaseTraceLinkEffectImplementation | undefined {
  const effects = ability.effects.filter(
    (effect): effect is IncreaseTraceLinkEffectImplementation =>
      effect.kind === "increase_trace_link",
  );
  if (effects.length > 1)
    throw new Error(
      "Trace link ability has multiple increase_trace_link effects.",
    );
  return effects[0];
}

function startTraceBaseLinkChoice(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
): boolean {
  const candidates = quoteTraceBaseLinkChoices(state, trace);
  if (candidates.length === 0) return false;
  state.pendingChoice = {
    choiceId: `${trace.traceId}.base_link.${state.stateVersion + 1}`,
    side: "runner",
    source: `trace_base_link:${trace.traceId}`,
    prompt: "Base-Link-Karte fuer Trace nutzen",
    kind: "select_option",
    options: [
      { id: "pass", label: "Keine Base-Link-Karte nutzen" },
      ...candidates.map((candidate) => ({
        id: `trace_base_link_${candidate.sourceCardInstanceId}`,
        label: `${candidate.label}: Base Link ${candidate.baseLinkValue}`,
        publicLabel: "Base Link",
        value: candidate.sourceCardInstanceId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  state.activeSide = "runner";
  return true;
}

function openTraceRunnerBidChoice(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
): void {
  state.trace = {
    ...trace,
    status: "runner_bid",
  };
  state.pendingChoice = traceBidChoice(
    state,
    "runner",
    trace.traceId,
    `Runner Link-Bid wählen (Trace ${trace.traceStrength ?? trace.baseTraceStrength}, Link ${trace.runnerLink ?? calculateRunnerLink(state)})`,
    state.runner.credits + runnerTraceLinkCredits(state),
  );
  state.activeSide = "runner";
}

function resolveTraceBaseLinkChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = requireTracePhase(state, "base_link");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const baseRunnerLink = trace.runnerLink ?? calculateRunnerLink(state);
  if (selected === "pass") {
    delete state.pendingChoice;
    const nextTrace = {
      ...trace,
      runnerLink: baseRunnerLink,
    };
    openTraceRunnerBidChoice(state, nextTrace);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "base_link",
      baseTraceStrength: trace.baseTraceStrength,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceStrength: trace.traceStrength ?? trace.baseTraceStrength,
      baseLinkUsed: false,
      runnerLink: baseRunnerLink,
    };
    return;
  }
  const option = state.pendingChoice?.options.find(
    (candidate) => candidate.id === selected,
  );
  const cardId =
    typeof option?.value === "string"
      ? (option.value as CardInstanceId)
      : undefined;
  if (!cardId) throw new Error("Diese Base-Link-Quelle ist nicht legal.");
  const candidate = assertTraceBaseLinkChoiceValid(state, cardId);
  spendCredits(state, "runner", candidate.creditCost);
  markSubmarineUplinkJackOutAfterEncounter(
    state,
    candidate.sourceCardInstanceId,
    legalAction,
  );
  const runnerLink = calculateRunnerLinkCore(state) + candidate.baseLinkValue;
  const nextTrace = {
    ...trace,
    baseLinkSourceId: candidate.sourceCardInstanceId,
    baseLinkValue: candidate.baseLinkValue,
    baseLinkCostPaid: candidate.creditCost,
    runnerLink,
  };
  delete state.pendingChoice;
  openTraceRunnerBidChoice(state, nextTrace);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    traceId: trace.traceId,
    traceStep: "base_link",
    baseTraceStrength: trace.baseTraceStrength,
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceStrength: trace.traceStrength ?? trace.baseTraceStrength,
    ...traceBaseLinkChoicePublicPayload(candidate),
    runnerLink,
    runnerCreditsAfter: state.runner.credits,
  };
}

function resolveTraceRunnerBid(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const trace = requireTracePhase(state, "runner_bid");
  const bid = selectedBidAmount(state.pendingChoice, playerAction);
  const tracePaymentQuote = assertRunnerTraceBidPaymentValid(
    runnerTracePaymentDeps,
    state,
    bid,
  );
  const tracePaymentReceipt = payRunnerTraceBidQuote(
    runnerTracePaymentDeps,
    state,
    tracePaymentQuote,
  );
  const tracePaymentPayload =
    runnerTracePaymentPublicPayload(tracePaymentReceipt);
  const runnerLink = trace.runnerLink ?? calculateRunnerLink(state);
  const postBidTraceBase = {
    ...trace,
    status: "post_bid_link" as const,
    runnerLink,
    runnerBid: bid,
    postBidLinkBonus: 0,
    postBidLinkSourceIds: [],
  };
  const result = describeTraceResultFromTrace(postBidTraceBase, {
    runnerLinkFallback: runnerLink,
  });
  const traceStrength = result.corpTraceStrength;
  const runnerStrength = result.runnerTraceStrength;
  const successful = result.successful;
  const postBidTrace = {
    ...postBidTraceBase,
    traceStrength,
    runnerStrength,
  };
  if (startTracePostBidLinkChoice(state, postBidTrace)) {
    state.trace = postBidTrace;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      traceId: trace.traceId,
      traceStep: "runner_bid",
      baseTraceStrength: trace.baseTraceStrength,
      sourceDefinitionId: trace.sourceDefinitionId,
      corpBid: trace.corpBid ?? 0,
      traceStrength,
      runnerLink,
      runnerBid: bid,
      ...tracePaymentPayload,
      runnerStrength,
      postBidTraceLinkChoiceOpened: true,
    };
    return;
  }
  const tagsAdded =
    successful && trace.successEffect.type === "add_tag_and_counter"
      ? trace.successEffect.tagAmount
      : successful && trace.successEffect.type === "add_tag"
      ? trace.successEffect.amount
      : 0;
  const hackerTrackerCountersAdded = addHackerTrackerTraceCounters(state);
  let runnerRunLockCreditCost = 0;
  let runnerRunEnded = false;
  let traceHardwareWreckerPayload: Record<string, unknown> = {};
  if (successful) state.runner.tags += tagsAdded;
  let traceCounterPayload: Record<string, string | number> = {};
  if (
    successful &&
    (trace.successEffect.type === "add_counter" ||
      trace.successEffect.type === "add_tag_and_counter")
  ) {
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
  if (
    successful &&
    (trace.successEffect.type === "end_run_and_run_lock" ||
      trace.successEffect.type === "end_run_trash_program_and_run_lock")
  ) {
    runnerRunLockCreditCost = trace.successEffect.amount;
    ensureRunnerTurnFlags(state).fangRunLockCreditCost =
      runnerRunLockCreditCost;
    runnerRunEnded = true;
    if (trace.successEffect.type === "end_run_trash_program_and_run_lock")
      resolveTrashInstalledProgramSubroutine(state, legalAction);
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
      trace.successEffect.type ===
        "end_run_trash_hardware_and_unpreventable_meat_damage"
    ) {
      traceHardwareWreckerPayload = resolveTraceHardwareWreckerSuccess(
        state,
        trace.sourceDefinitionId,
        trace.sourceCardInstanceId,
        trace.traceId,
      );
      if (!state.winner && state.run) finishRun(state, false);
    } else if (runnerRunEnded) {
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
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceStrength,
    runnerLink,
    runnerBid: bid,
    ...tracePaymentPayload,
    runnerStrength,
    traceSuccessful: successful,
    tagsAdded,
    ...traceCounterPayload,
    ...(hackerTrackerCountersAdded > 0
      ? {
          hackerTrackerCountersAdded,
          traceHostedCreditsAdded: hackerTrackerCountersAdded,
        }
      : {}),
    ...(runnerRunEnded
      ? {
          fangRunEnded: true,
          runnerRunEnded: true,
          fangRunLockCreditCost: runnerRunLockCreditCost,
          runnerRunLockCreditCost,
        }
      : {}),
    ...traceHardwareWreckerPayload,
  };
}

function postBidTraceLinkCandidates(
  state: GameState,
  trace: NonNullable<GameState["trace"]>,
): TracePostBidLinkCandidate[] {
  const candidates: TracePostBidLinkCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state).sort()) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = definitionFor(state, cardId);
    for (const { ability } of activatedCardImplementationTraceAbilities(
      definition,
      "trace_post_bid_link_window",
    )) {
      const effect = increaseTraceLinkEffect(ability);
      if (!effect) continue;
      if (isSubmarineUplinkSource(state, cardId) && !state.run) continue;
      const creditCost = creditCostForTraceAbility(ability);
      if (state.runner.credits + runnerTraceLinkCredits(state) < creditCost)
        continue;
      const limitOncePerTrace =
        ability.limit?.kind === "once_per_trace_per_source" &&
        ability.limit.scope === "source";
      if (limitOncePerTrace && tracePostBidLinkSourceUsed(trace, cardId))
        continue;
      if (
        !Number.isInteger(effect.amount) ||
        effect.amount <= 0 ||
        effect.visibility !== "public"
      )
        throw new Error("Trace link effect is invalid.");
      candidates.push({
        cardId,
        definitionId: definition.id,
        label: definition.title,
        linkDelta: effect.amount,
        creditCost,
        limitOncePerTrace,
      });
    }
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
  const trace = requireTracePhase(state, "post_bid_link");
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
    const paymentQuote = assertPostBidLinkPaymentValid(
      runnerTracePaymentDeps,
      state,
      candidate.creditCost,
    );
    const paymentReceipt = payPostBidLinkPaymentQuote(
      runnerTracePaymentDeps,
      state,
      paymentQuote,
    );
    const paymentPayload = postBidLinkPaymentPublicPayload(paymentReceipt);
    markSubmarineUplinkJackOutAfterEncounter(
      state,
      candidate.cardId,
      legalAction,
    );
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
      postBidTraceLinkCostPaid: candidate.creditCost,
      ...paymentPayload,
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
  const result = describeTraceResultFromTrace(trace, {
    runnerLinkFallback: calculateRunnerLink(state),
  });
  const traceStrength = result.corpTraceStrength;
  const runnerLink = result.runnerLink;
  const runnerBid = result.runnerBid;
  const runnerStrength = result.runnerTraceStrength;
  const successful = result.successful;
  const tagsAdded =
    successful && trace.successEffect.type === "add_tag_and_counter"
      ? trace.successEffect.tagAmount
      : successful && trace.successEffect.type === "add_tag"
      ? trace.successEffect.amount
      : 0;
  const hackerTrackerCountersAdded = addHackerTrackerTraceCounters(state);
  let runnerRunLockCreditCost = 0;
  let runnerRunEnded = false;
  let traceHardwareWreckerPayload: Record<string, unknown> = {};
  if (successful) state.runner.tags += tagsAdded;
  let traceCounterPayload: Record<string, string | number> = {};
  if (
    successful &&
    (trace.successEffect.type === "add_counter" ||
      trace.successEffect.type === "add_tag_and_counter")
  ) {
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
  if (
    successful &&
    (trace.successEffect.type === "end_run_and_run_lock" ||
      trace.successEffect.type === "end_run_trash_program_and_run_lock")
  ) {
    runnerRunLockCreditCost = trace.successEffect.amount;
    ensureRunnerTurnFlags(state).fangRunLockCreditCost =
      runnerRunLockCreditCost;
    runnerRunEnded = true;
    if (trace.successEffect.type === "end_run_trash_program_and_run_lock")
      resolveTrashInstalledProgramSubroutine(state, legalAction);
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
      trace.successEffect.type ===
        "end_run_trash_hardware_and_unpreventable_meat_damage"
    ) {
      traceHardwareWreckerPayload = resolveTraceHardwareWreckerSuccess(
        state,
        trace.sourceDefinitionId,
        trace.sourceCardInstanceId,
        trace.traceId,
      );
      if (!state.winner && state.run) finishRun(state, false);
    } else if (runnerRunEnded) {
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
    sourceDefinitionId: trace.sourceDefinitionId,
    corpBid: trace.corpBid ?? 0,
    traceStrength,
    runnerLink,
    runnerBid,
    runnerStrength,
    postBidTraceLinkBonus: trace.postBidLinkBonus ?? 0,
    traceSuccessful: successful,
    tagsAdded,
    ...traceCounterPayload,
    ...(hackerTrackerCountersAdded > 0
      ? {
          hackerTrackerCountersAdded,
          traceHostedCreditsAdded: hackerTrackerCountersAdded,
        }
      : {}),
    ...(runnerRunEnded
      ? {
          fangRunEnded: true,
          runnerRunEnded: true,
          fangRunLockCreditCost: runnerRunLockCreditCost,
          runnerRunLockCreditCost,
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
      traceCounterEffectDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (effect.type === "add_tag_and_counter") {
    return (
      Number.isInteger(effect.tagAmount) &&
      effect.tagAmount >= 0 &&
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      traceCounterEffectDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (
    effect.type === "end_run_and_run_lock" ||
    effect.type === "end_run_trash_program_and_run_lock"
  ) {
    return Number.isInteger(effect.amount) && effect.amount > 0;
  }
  if (effect.type === "end_run_trash_hardware_and_unpreventable_meat_damage")
    return Number.isInteger(effect.amount) && effect.amount > 0;
  return (
    effect.type === "add_tag" &&
    Number.isInteger(effect.amount) &&
    effect.amount >= 0
  );
}

function runnerTraceLinkCreditSourceIds(state: GameState): CardInstanceId[] {
  return [
    ...restrictedHostedCreditSourceIds(state, "increase_link"),
    ...[...state.runner.rig.hardware, ...state.runner.rig.resources].filter(
      (cardId) =>
        !isRestrictedHostedCreditSource(definitionFor(state, cardId)) &&
        definitionFor(state, cardId).id === HELLS_RUN_ID &&
        cardCounter(state, cardId, "recurring_credit") > 0,
    ),
  ].sort();
}

function runnerTraceLinkCredits(state: GameState): number {
  return runnerTraceLinkCreditSourceIds(state).reduce(
    (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
    0,
  );
}

function recordWilsonRunCapSpend(state: GameState, amount: number): void {
  if (amount <= 0) return;
  const cap = state.run?.wilsonRunSpendingCap;
  if (!cap) return;
  const nextSpent = Math.max(0, Math.floor(cap.spent ?? 0)) + amount;
  if (nextSpent > cap.limit)
    throw new Error("Wilson erlaubt maximal 3 Credits fuer Icebreaker oder Link.");
  cap.spent = nextSpent;
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

function calculateRunnerLinkCore(state: GameState): number {
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
  const cryingReduction = cardCounter(state, state.runner.identity, "crying") * 2;
  const link = Math.max(0, baseLink + modifier - cryingReduction);
  if (!Number.isInteger(link) || link < 0)
    throw new Error("Runner-Link ist ungueltig.");
  return link;
}

function calculateRunnerLink(state: GameState): number {
  const coreLink = calculateRunnerLinkCore(state);
  const traceBaseLink = state.trace?.baseLinkValue ?? 0;
  if (!Number.isInteger(traceBaseLink) || traceBaseLink < 0)
    throw new Error("Runner-Link ist ungueltig.");
  const installedLink =
    traceBaseLink > 0
      ? 0
      : [
          ...state.runner.rig.programs,
          ...state.runner.rig.hardware,
          ...state.runner.rig.resources,
        ].reduce((best, cardId) => {
          const definition = definitionFor(state, cardId);
          if (installedTraceBaseLinkCardImplementation(definition)) return best;
          const cardLink = definition.baseLink ?? 0;
          if (!Number.isInteger(cardLink) || cardLink < 0)
            throw new Error("Runner-Link ist ungueltig.");
          return Math.max(best, cardLink);
        }, 0);
  const link = Math.max(0, coreLink + installedLink + traceBaseLink);
  const runTraceLinkBonus = Math.max(
    0,
    Math.floor(state.run?.runTraceLinkBonus ?? 0),
  );
  const effectiveLink = link + runTraceLinkBonus;
  if (!Number.isInteger(effectiveLink) || effectiveLink < 0)
    throw new Error("Runner-Link ist ungueltig.");
  return effectiveLink;
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
        if (command.side === "corp") {
          for (let count = 0; count < (command.amount ?? 1); count += 1)
            drawCorpCard(state);
        } else {
          drawRunnerCards(state, command.amount ?? 1);
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

function withoutProteusVariableIceState(instance: CardInstance): CardInstance {
  const { proteusVariableIceState: _proteusVariableIceState, ...rest } =
    instance;
  void _proteusVariableIceState;
  return rest;
}

function hasLegacyAbilityPayload(
  payload: LegalAction["payload"] | undefined,
  field: LegacyAbilityPayloadField,
  abilityIds?: readonly string[],
): boolean {
  return legacyAbilityPayloadEntries(payload, [field]).some(
    (entry) => !abilityIds || abilityIds.includes(entry.abilityId),
  );
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
  // Public context is constructed after action resolution from already-public
  // payload data. buildEvent owns final PublicPayload assembly, while
  // public-context.ts remains read-only and free of state mutation.
  const actionContext = publicContextForAction(state, legalAction, publicContextDeps);
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
  if (state.gameEndReason === "bad_publicity_7") {
    publicPayload.badPublicityThreshold = BAD_PUBLICITY_LOSS_THRESHOLD;
    publicPayload.corpBadPublicityBefore = previousState.corp.badPublicity;
    publicPayload.corpBadPublicityAfter = state.corp.badPublicity;
    publicPayload.sourceVisibility =
      publicPayload.sourceVisibility === "redacted" ? "redacted" : "public";
    if (publicPayload.sourceVisibility === "redacted") {
      delete publicPayload.sourceCardDefinitionId;
      delete publicPayload.sourceDefinitionId;
      delete publicPayload.sourceTitle;
      publicPayload.redactedKind = "hidden_resource_source";
    }
  }
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
    baseClicksForSide(state, legalAction.side),
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

function creditCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.credits) && cost.credits ? cost.credits : 0),
    0,
  );
}

function clicksForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.clicks : state.runner.clicks;
}

function baseClicksForSide(state: GameState, side: Side): number {
  return side === "corp" ? 3 : runnerActionsPerTurn(state);
}

function runnerActionsPerTurn(state: GameState): number {
  const override = Math.floor(state.runnerActionsPerTurnOverride ?? 4);
  return Math.max(0, override);
}

function publicLabel(legalAction: LegalAction): string {
  if (
    legalAction.type === "install_card" &&
    legalAction.payload?.hiddenRunnerResourceInstall === true
  )
    return "Runner installiert eine verdeckte Resource.";
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

function revealForPublicEvent(
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  if (
    legalAction.type === "install_card" &&
    legalAction.payload?.hiddenRunnerResourceInstall === true
  )
    return {};
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
      hasLegacyAbilityPayload(legalAction.payload, "v1917AssetAbility", [
        "gain_credits",
      ])) ||
    (legalAction.type === "gain_credit" &&
      hasLegacyAbilityPayload(legalAction.payload, "v1920AssetAbility")) ||
    (legalAction.type === "gain_credit" &&
      legalAction.payload?.traceStarted === true) ||
    legalAction.type === "activated_card_ability" ||
    (legalAction.type === "gain_credit" &&
      hasLegacyAbilityPayload(legalAction.payload, "agendaAbility", [
        "v1922_corporate_retreat",
      ])) ||
    (legalAction.side === "runner" &&
      (legalAction.type === "gain_credit" ||
        legalAction.type === "trigger_ability" ||
        legalAction.type === "remove_tag") &&
      hasLegacyAbilityPayload(legalAction.payload, "resourceAbility")) ||
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

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return mustInstance(state.cardInstances, cardId).counters?.[counterType] ?? 0;
}

// Counter mutation stays in index.ts because many legacy mechanics still share
// this primitive. CardImplementation adapters call through dependencies instead
// of importing these functions directly.
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

function addVirusCounterWithDisinfectantPrevention(
  state: GameState,
  targetCardId: CardInstanceId,
  amount: number,
  legalAction?: LegalAction,
): number {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Virus-Counter amount ist ungueltig.");
  let added = 0;
  let prevented = 0;
  let creditsPaid = 0;
  for (let index = 0; index < amount; index += 1) {
    const prevention = preventOneVirusCounterWithDisinfectant(state);
    if (prevention.prevented) {
      prevented += 1;
      creditsPaid += prevention.creditsPaid;
      continue;
    }
    addCardCounter(state, targetCardId, "virus", 1);
    added += 1;
  }
  if (legalAction && prevented > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      virusCounterAvoided: prevented,
      disinfectantCreditsPaid: creditsPaid,
      corpCreditsAfter: state.corp.credits,
    };
  }
  return added;
}

function preventOneVirusCounterWithDisinfectant(
  state: GameState,
): { prevented: boolean; creditsPaid: number } {
  const flags = ensureCorpTurnFlags(state);
  const used = new Set(flags.disinfectantUsedSourceIdsThisTurn ?? []);
  const sourceId = rezzedCorpRootCardIds(state)
    .filter((cardId) =>
      hasCorpUtilityKind(state, cardId, "disinfectant_avoid_virus_counter"),
    )
    .filter((cardId) => !used.has(cardId))
    .sort()[0];
  if (!sourceId || state.corp.credits < 1) return { prevented: false, creditsPaid: 0 };
  state.corp.credits -= 1;
  flags.disinfectantUsedSourceIdsThisTurn = [
    ...(flags.disinfectantUsedSourceIdsThisTurn ?? []),
    sourceId,
  ];
  return { prevented: true, creditsPaid: 1 };
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

function addVisibleCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): VisibleCounterPayload {
  addCardCounter(state, cardId, counterType, amount);
  return {
    counterType,
    addedCounterAmount: amount,
    remainingCounters: cardCounter(state, cardId, counterType),
  };
}

function spendVisibleCardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
  amount: number,
): VisibleCounterPayload {
  spendCardCounter(state, cardId, counterType, amount);
  return {
    counterType,
    removedCounterAmount: amount,
    remainingCounters: cardCounter(state, cardId, counterType),
  };
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
  let faitTotal = 0;
  for (const amount of Object.values(state.faitAccompliCountersByServer ?? {})) {
    faitTotal += Math.max(0, Math.floor(Number(amount ?? 0)));
  }
  return cardCounterTotal + poxTotal + faitTotal;
}

function purgeVirusCounters(state: GameState): number {
  const total = totalCounters(state, "virus");
  if (total <= 0) throw new Error("Es gibt keine Virus-Counter zu purgen.");
  for (const cardId of Object.keys(state.cardInstances)) {
    setCardCounter(state, cardId, "virus", 0);
  }
  if (state.poxCountersByServer) state.poxCountersByServer = {};
  if (state.faitAccompliCountersByServer)
    state.faitAccompliCountersByServer = {};
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
      (cardId) =>
        runnerUtilityLongtailKindForCard(state, cardId) ===
          "microtech_backup_drive_program_trash_replacement" ||
        definitionFor(state, cardId).id === MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
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

type RestrictedHostedCreditPaymentOptions = {
  breakerId?: CardInstanceId | undefined;
  accessedCardId?: CardInstanceId | undefined;
  installCardType?: CardDefinition["type"] | undefined;
};

function restrictedHostedCreditSourceForDefinition(
  definition: CardDefinition,
) {
  return cardImplementationForDefinitionId(definition.id)
    ?.restrictedHostedCreditSource;
}

function isRestrictedHostedCreditSource(definition: CardDefinition): boolean {
  return Boolean(restrictedHostedCreditSourceForDefinition(definition));
}

function shouldLoadLegacyRecurringCredits(definition: CardDefinition): boolean {
  return (
    (definition.recurringCredits ?? 0) > 0 &&
    !isRestrictedHostedCreditSource(definition) &&
    !cardImplementationForDefinitionId(definition.id)?.virusCounter
  );
}

function hostedPaymentCounterTypeForSource(
  state: GameState,
  cardId: CardInstanceId,
): Extract<CounterType, "bit" | "recurring_credit"> {
  return isRestrictedHostedCreditSource(definitionFor(state, cardId))
    ? "bit"
    : "recurring_credit";
}

function hostedPaymentCredits(
  state: GameState,
  cardId: CardInstanceId,
): number {
  return cardCounter(state, cardId, hostedPaymentCounterTypeForSource(state, cardId));
}

function spendHostedPaymentCredits(
  state: GameState,
  cardId: CardInstanceId,
  amount: number,
): void {
  spendCardCounter(
    state,
    cardId,
    hostedPaymentCounterTypeForSource(state, cardId),
    amount,
  );
}

function restrictedHostedCreditSourceMatchesUse(
  state: GameState,
  cardId: CardInstanceId,
  use: RestrictedHostedCreditUse,
  options: RestrictedHostedCreditPaymentOptions = {},
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  const definition = definitionFor(state, cardId);
  const source = restrictedHostedCreditSourceForDefinition(definition);
  if (!source || source.counterType !== "bit" || !source.usableFor.includes(use))
    return false;
  if (cardCounter(state, cardId, "bit") <= 0) return false;
  if (
    state.run &&
    cardHasSubtype(definition, "stealth") &&
    hasStealthPaymentBlockOnServer(state, state.run.attackedServerId)
  )
    return false;
  if (
    use === "using_icebreaker_during_run" ||
    use === "using_icebreaker_during_run_non_noisy" ||
    use === "using_killer_during_run"
  ) {
    const breakerId = options.breakerId;
    if (!state.run || !breakerId || !state.runner.rig.programs.includes(breakerId))
      return false;
    const breakerDefinition = definitionFor(state, breakerId);
    if (!cardHasSubtype(breakerDefinition, "icebreaker")) return false;
    if (use === "using_icebreaker_during_run") return true;
    if (use === "using_icebreaker_during_run_non_noisy")
      return !cardHasSubtype(breakerDefinition, "noisy");
    return cardHasSubtype(breakerDefinition, "killer");
  }
  if (use === "trash_nodes" || use === "trash_upgrades") {
    const accessedCardId = options.accessedCardId;
    if (!accessedCardId || !state.cardInstances[accessedCardId]) return false;
    const accessedDefinition = definitionFor(state, accessedCardId);
    return use === "trash_nodes"
      ? accessedDefinition.type === "asset"
      : accessedDefinition.type === "upgrade";
  }
  if (use === "install_programs") return options.installCardType === "program";
  return use === "increase_link" || use === "remove_tags";
}

function restrictedHostedCreditSourceIds(
  state: GameState,
  use: RestrictedHostedCreditUse,
  options: RestrictedHostedCreditPaymentOptions = {},
): CardInstanceId[] {
  return runnerInstalledCardIds(state)
    .filter((cardId) =>
      restrictedHostedCreditSourceMatchesUse(state, cardId, use, options),
    )
    .sort();
}

function restrictedHostedCredits(
  state: GameState,
  use: RestrictedHostedCreditUse,
  options: RestrictedHostedCreditPaymentOptions = {},
): number {
  return restrictedHostedCreditSourceIds(state, use, options).reduce(
    (sum, cardId) => sum + cardCounter(state, cardId, "bit"),
    0,
  );
}

function spendRestrictedHostedCredits(
  state: GameState,
  use: RestrictedHostedCreditUse,
  amount: number,
  options: RestrictedHostedCreditPaymentOptions = {},
): {
  spent: number;
  sourceDefinitionIds: string[];
} {
  let remaining = Math.max(0, Math.floor(amount));
  let spent = 0;
  const sourceDefinitionIds = new Set<string>();
  for (const cardId of restrictedHostedCreditSourceIds(state, use, options)) {
    if (remaining <= 0) break;
    const cardSpent = Math.min(cardCounter(state, cardId, "bit"), remaining);
    if (cardSpent <= 0) continue;
    spendCardCounter(state, cardId, "bit", cardSpent);
    remaining -= cardSpent;
    spent += cardSpent;
    sourceDefinitionIds.add(definitionFor(state, cardId).id);
  }
  return { spent, sourceDefinitionIds: [...sourceDefinitionIds].sort() };
}

function availableRunnerProgramInstallCredits(state: GameState): number {
  return (
    state.runner.credits +
    runnerRecurringCredits(state) +
    restrictedHostedCredits(state, "install_programs", {
      installCardType: "program",
    }) +
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
  ].filter((cardId) => !isRestrictedHostedCreditSource(definitionFor(state, cardId)));
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
  const restricted = spendRestrictedHostedCredits(
    state,
    "install_programs",
    remaining,
    { installCardType: cardType },
  );
  remaining -= restricted.spent;
  for (const cardId of runnerProgramInstallRecurringCreditSourceIds(state)) {
    if (remaining <= 0) break;
    const available = hostedPaymentCredits(state, cardId);
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendHostedPaymentCredits(state, cardId, spent);
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
  const restrictedRunCostSources =
    breakerId === undefined
      ? runnerRig.filter((cardId) => {
          const source =
            restrictedHostedCreditSourceForDefinition(definitionFor(state, cardId));
          return (
            Boolean(source) &&
            source?.counterType === "bit" &&
            source.usableFor.includes("using_icebreaker_during_run_non_noisy") &&
            cardCounter(state, cardId, "bit") > 0
          );
        })
      : [];
  const restrictedSources = [
    ...restrictedRunCostSources,
    ...restrictedHostedCreditSourceIds(state, "using_icebreaker_during_run", {
      breakerId,
    }),
    ...restrictedHostedCreditSourceIds(
      state,
      "using_icebreaker_during_run_non_noisy",
      { breakerId },
    ),
    ...restrictedHostedCreditSourceIds(state, "using_killer_during_run", {
      breakerId,
    }),
  ];
  const legacySources = runnerRig.filter((cardId) => {
    if (isRestrictedHostedCreditSource(definitionFor(state, cardId))) return false;
    if (cardCounter(state, cardId, "recurring_credit") <= 0) return false;
    const definition = definitionFor(state, cardId);
    if (
      definition.id === ZZ22_SPEED_CHIP_ID ||
      definition.id === COROLLA_SPEED_CHIP_STRENGTH_HARDWARE_ID
    ) {
      return Boolean(
        state.run &&
          breakerId &&
          state.runner.rig.programs.includes(breakerId) &&
          cardHasSubtype(definitionFor(state, breakerId), "killer"),
      );
    }
    if (
      definition.id === ZETATECH_SOFTWARE_INSTALLER_OVERLAY_HOST_ID ||
      TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS.has(definition.id)
    ) {
      return false;
    }
    if (definition.id === HELLS_RUN_ID) return false;
    if (!noisyBreaker) return true;
    return !cardHasSubtype(definition, "stealth");
  });
  return [...new Set([...restrictedSources, ...legacySources])].sort();
}

function runnerRunRecurringCredits(
  state: GameState,
  breakerId?: CardInstanceId,
): number {
  return runnerRunRecurringCreditSourceIds(state, breakerId).reduce(
    (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
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
    (state.run?.runnerRunTemporaryCredits?.remaining ?? 0) +
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
  if (breakerId) recordWilsonRunCapSpend(state, amount);
  const run = mustRun(state);
  let remaining = amount;
  const fromBadPublicity = Math.min(run.badPublicityCredits ?? 0, remaining);
  if (fromBadPublicity > 0) {
    run.badPublicityCredits = (run.badPublicityCredits ?? 0) - fromBadPublicity;
    remaining -= fromBadPublicity;
  }
  const runTemporaryCredits = run.runnerRunTemporaryCredits;
  const fromRunTemporaryCredits = Math.min(
    runTemporaryCredits?.remaining ?? 0,
    remaining,
  );
  if (runTemporaryCredits && fromRunTemporaryCredits > 0) {
    runTemporaryCredits.remaining -= fromRunTemporaryCredits;
    remaining -= fromRunTemporaryCredits;
  }
  for (const cardId of runnerRunRecurringCreditSourceIds(state, breakerId)) {
    if (remaining <= 0) break;
    const available = hostedPaymentCredits(state, cardId);
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      spendHostedPaymentCredits(state, cardId, spent);
      remaining -= spent;
    }
  }
  spendCredits(state, "runner", remaining);
}

function runnerTagRemovalRecurringCreditSourceIds(
  state: GameState,
): CardInstanceId[] {
  return [
    ...restrictedHostedCreditSourceIds(state, "remove_tags"),
    ...state.runner.rig.hardware.filter(
      (cardId) =>
        !isRestrictedHostedCreditSource(definitionFor(state, cardId)) &&
        TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS.has(
          definitionFor(state, cardId).id,
        ) &&
        cardCounter(state, cardId, "recurring_credit") > 0,
    ),
  ].sort();
}

function runnerTagRemovalRecurringCredits(state: GameState): number {
  return runnerTagRemovalRecurringCreditSourceIds(state).reduce(
    (sum, cardId) => sum + hostedPaymentCredits(state, cardId),
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
      hostedPaymentCredits(state, cardId),
      remaining,
    );
    if (spent <= 0) continue;
    spendHostedPaymentCredits(state, cardId, spent);
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
  const ability = breakAbilityForLegalAction(state, legalAction);
  const lossAmount = ability?.postBreakStealthLoss ?? 0;
  if (lossAmount <= 0) return;
  const stealthSources = runnerStealthRecurringCreditSources(state);
  const availableStealth = stealthSources.reduce(
    (sum, source) => sum + source.available,
    0,
  );
  const exactStealthLoss = breakerDefinition.id === PILE_DRIVER_ID;
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
    const available = hostedPaymentCredits(state, cardId);
    const cardSpent = Math.min(available, remaining);
    if (cardSpent > 0) {
      spendHostedPaymentCredits(state, cardId, cardSpent);
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
    const available = hostedPaymentCredits(state, cardId);
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
    if (hostedPaymentCredits(state, cardId) < amount)
      throw new Error("Nicht genug Stealth-Credits fuer die Auswahl.");
    spendHostedPaymentCredits(state, cardId, amount);
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

function startPassRezzedIceProgramTrashChoice(
  state: GameState,
  passedIceId: CardInstanceId,
  legalAction?: LegalAction,
): boolean {
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const run = mustRun(state);
  const sourceIceId = run.passRezzedIceProgramTrashSourceIceId;
  if (!sourceIceId) return false;
  const sourceDefinition = definitionFor(state, sourceIceId);
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
        passIceTrashProgramPrompt: false,
        sourceDefinitionId: sourceDefinition.id,
        programTrashCount: 0,
      };
    }
    return false;
  }
  state.pendingChoice = {
    choiceId: `p3_56_pass_ice_program_trash_${state.stateVersion + 1}`,
    side: "runner",
    source: `p3_56.pass_ice_program_trash:${sourceIceId}:${passedIceId}:${state.stateVersion + 1}`,
    prompt: `${sourceDefinition.title}: installiertes Programm trashen.`,
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
      passIceTrashProgramPrompt: true,
      sourceDefinitionId: sourceDefinition.id,
      passIceTrashProgramCandidateCount: programOptions.length,
      hiddenZoneBarrier: true,
    };
  }
  return true;
}

function resolvePassRezzedIceProgramTrashChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_56.pass_ice_program_trash"))
    throw new Error("Pass-ICE-Programmtrash-Choice ist nicht offen.");
  const [, sourceIceId, passedIceId] = choice.source.split(":");
  if (!sourceIceId || !state.cardInstances[sourceIceId])
    throw new Error("Die Programmtrash-Quelle ist nicht mehr gueltig.");
  if (!passedIceId || !state.cardInstances[passedIceId])
    throw new Error("Das passierte ICE fuer Programmtrash fehlt.");
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
    passIceTrashProgramPrompt: false,
    sourceDefinitionId: definitionFor(state, sourceIceId).id,
    hiddenZoneBarrier: true,
    programTrashCount: 1,
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
    !state.runner.rig.programs.includes(speedTrapId)
  )
    throw new Error("Speed Trap ist nicht mehr installiert.");
  const speedTrapDefinitionId = definitionFor(state, speedTrapId).id;
  if (
    !hasRunEncounterInterventionKind(
      state,
      speedTrapId,
      "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
    ) &&
    (cardImplementationForDefinitionId(speedTrapDefinitionId) ||
      speedTrapDefinitionId !== SPEED_TRAP_REZ_INTERRUPT_PROGRAM_ID)
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
    sourceDefinitionId: speedTrapDefinitionId,
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
    const restrictedSource = restrictedHostedCreditSourceForDefinition(definition);
    if (restrictedSource) {
      if (
        restrictedSource.counterType !== "bit" ||
        restrictedSource.refresh.timing !== "start_of_runner_turn" ||
        restrictedSource.refresh.mode !== "refill_to_capacity_if_used"
      )
        throw new Error("Restricted hosted credit source is invalid.");
      const capacity = Math.max(0, Math.floor(restrictedSource.capacity));
      const previous = cardCounter(state, cardId, "bit");
      if (previous < capacity) {
        setCardCounter(state, cardId, "bit", capacity);
        effects?.push(
          automaticCounterChangeEffect(
            `runner.start.restricted_hosted_credit.${cardId}`,
            "runner",
            definition.id,
            "bit",
            capacity,
            capacity - previous,
          ),
        );
      }
      continue;
    }
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
  // Click payment is a host primitive. CardImplementation runtime revalidates
  // abilities first, then calls this through dependencies so stale actions do
  // not pay costs before source/timing/limit checks pass.
  if (side === "corp") {
    if (state.corp.clicks <= 0)
      throw new Error("Die Korp hat keine Clicks mehr.");
    state.corp.clicks -= 1;
    return;
  }
  if (state.runner.clicks <= 0)
    throw new Error("Der Runner hat keine Clicks mehr.");
  state.runner.clicks -= 1;
  recordRunnerActionSpent(state, 1);
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
  recordRunnerActionSpent(state, amount);
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

function cardImplementationCorpOperationResolver(
  definition: CardDefinition,
): CorpOperationResolver | undefined {
  const hiddenLongtail = hiddenReplacementLongtailForDefinition(definition);
  if (hiddenLongtail?.kind === "new_blood_conceal_reorder_installed_ice") {
    return {
      name: "card_implementation_corp_operation_new_blood_conceal_reorder_installed_ice",
      resolve: (state, legalAction) => {
        resolveNewBloodConcealAndReorder(
          hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        );
      },
    };
  }
  return undefined;
}

function canPlayCorpOperation(
  state: GameState,
  definition: CardDefinition,
): boolean {
  if (hasPrintedCostOnPlayCardImplementation(definition))
    return canPlayPrintedCostOnPlayImplementation(
      cardImplementationRuntimeDeps,
      state,
      definition,
    ) && onPlayCardImplementationChoicesAreAvailable(state, definition);
  const utility = corpUtilityImplementationForDefinition(definition.id);
  if (utility) return canPlayCorpUtilityOperation(state, definition, utility);
  const implementationResolver =
    cardImplementationCorpOperationResolver(definition);
  if (implementationResolver)
    return implementationResolver.canPlay?.(state) ?? true;
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  if (resolver) return resolver.canPlay?.(state) ?? true;
  return canPlayPrintedCostOnPlayImplementation(
    cardImplementationRuntimeDeps,
    state,
    definition,
  );
}

function resolveCorpOperation(
  state: GameState,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  if (hasPrintedCostOnPlayCardImplementation(definition)) {
    const cardId =
      typeof legalAction.payload?.cardId === "string"
        ? (legalAction.payload.cardId as CardInstanceId)
        : "";
    executeOnPlayCardImplementationAbility(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
    );
    return;
  }
  const utility = corpUtilityImplementationForDefinition(definition.id);
  if (utility) {
    resolveCorpUtilityOperation(state, definition, legalAction, utility);
    return;
  }
  const implementationResolver =
    cardImplementationCorpOperationResolver(definition);
  if (implementationResolver) {
    implementationResolver.resolve(state, legalAction);
    return;
  }
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  if (resolver) {
    resolver.resolve(state, legalAction);
    return;
  }
  const cardId =
    typeof legalAction.payload?.cardId === "string"
      ? (legalAction.payload.cardId as CardInstanceId)
      : "";
  executeOnPlayCardImplementationAbility(
    cardImplementationRuntimeDeps,
    state,
    legalAction,
    definition,
    cardId,
  );
}

function canPlayCorpUtilityOperation(
  state: GameState,
  definition: CardDefinition,
  utility: CardCorpUtilityImplementation,
): boolean {
  switch (utility.kind) {
    case "gain_restricted_install_actions":
      return state.corp.hq.some((cardId) =>
        isCorpInstallableCardType(definitionFor(state, cardId)),
      );
    case "corp_archives_to_hq":
      return state.corp.archives.some((cardId) => {
        const sourceCardId = state.corp.hq.find(
          (candidate) => definitionFor(state, candidate).id === definition.id,
        );
        return cardId !== sourceCardId;
      });
    case "corp_rd_top_reorder":
      return state.corp.rd.length >= 2;
    case "trojan_horse_tag":
      return runnerStoleAgendaLastTurn(state);
    case "silver_lining_recovery":
      return runnerStoleAgendaLastTurn(state);
    case "trash_runner_resources_if_tagged":
      return state.runner.tags > 0;
    case "power_grid_overload":
      return (
        state.runner.tags > 0 &&
        state.corp.credits > 0 &&
        powerGridOverloadEligibleHardwareIds(state).length > 0
      );
    default:
      return false;
  }
}

function resolveCorpUtilityOperation(
  state: GameState,
  definition: CardDefinition,
  legalAction: LegalAction,
  utility: CardCorpUtilityImplementation,
): void {
  switch (utility.kind) {
    case "gain_restricted_install_actions": {
      if (!canPlayCorpUtilityOperation(state, definition, utility)) {
        throw new Error(
          "Edgerunner, Inc., Temps findet keine installierbare Korp-Karte.",
        );
      }
      const flags = ensureCorpTurnFlags(state);
      flags.edgerunnerTempsInstallActionsRemaining = utility.amount;
      state.corp.clicks += utility.amount;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "install_action_bundle",
        v1922CorpOperationAbility: "install_action_bundle",
        gainedActions: utility.amount,
        restrictedActionSequence: "corp_install",
        edgerunnerTempsInstallActionsRemaining:
          flags.edgerunnerTempsInstallActionsRemaining,
        corpClicksAfter: state.corp.clicks,
      };
      return;
    }
    case "corp_archives_to_hq": {
      const sourceCardId = String(legalAction.payload?.cardId ?? "");
      if (!sourceCardId || definitionFor(state, sourceCardId).id !== definition.id)
        throw new Error("Off-Site Backups fehlt als Quelle.");
      startCorpArchivesToHqChoice(
        hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
        sourceCardId,
      );
      return;
    }
    case "corp_rd_top_reorder": {
      const sourceCardId = String(legalAction.payload?.cardId ?? "");
      if (!sourceCardId || definitionFor(state, sourceCardId).id !== definition.id)
        throw new Error("Planning Consultants fehlt als Quelle.");
      startCorpRdTopReorderChoice(
        hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        sourceCardId,
      );
      return;
    }
    case "trojan_horse_tag": {
      if (!runnerStoleAgendaLastTurn(state))
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      addRunnerTagsWithPrevention(state, legalAction, 1, "trojan_horse");
      return;
    }
    case "silver_lining_recovery": {
      if (!runnerStoleAgendaLastTurn(state))
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      const advancementCounters = runnerStolenAgendaAdvancementCountersLastTurn(state);
      const gainedCredits = advancementCounters * utility.multiplierPerAdvancementCounter;
      credits(state, "corp", gainedCredits);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "silver_lining_recovery",
        stolenAgendaAdvancementCountersLastTurn: advancementCounters,
        gainedCredits,
        corpCreditsAfter: state.corp.credits,
      };
      return;
    }
    case "trash_runner_resources_if_tagged": {
      requireRunnerTagged(state);
      const targetIds = state.runner.rig.resources
        .slice()
        .sort()
        .slice(0, utility.max);
      const targetDefinitionIds = targetIds.map(
        (cardId) => definitionFor(state, cardId).id,
      );
      for (const cardId of targetIds) {
        if (!state.runner.rig.resources.includes(cardId)) continue;
        trashRunnerInstalledCardToHeap(state, cardId);
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "trash_runner_resources_if_tagged",
        trashedResourceCount: targetIds.length,
        trashedResourceDefinitionIds: targetDefinitionIds.join(","),
      };
      return;
    }
    case "power_grid_overload": {
      requireRunnerTagged(state);
      resolvePowerGridOverloadOperation(state, legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "power_grid_overload",
      };
      return;
    }
    default:
      throw new Error("Diese Korp-Utility-Operation ist nicht spielbar.");
  }
}

function hasPrintedCostOnPlayCardImplementation(
  definition: CardDefinition,
): boolean {
  return Boolean(
    cardImplementationForDefinitionId(definition.id)?.abilities?.some(
      (ability) => ability.kind === "on_play" && ability.costs === "printed",
    ),
  );
}

function onPlayCardImplementationEffects(
  definition: CardDefinition,
): readonly CardEffectImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.abilities?.find(
      (ability) => ability.kind === "on_play" && ability.costs === "printed",
    )?.effects ?? []
  );
}

function onPlayCardImplementationChoicesAreAvailable(
  state: GameState,
  definition: CardDefinition,
): boolean {
  for (const effect of onPlayCardImplementationEffects(definition)) {
    if (
      effect.kind === "distribute_advancement_counters" &&
      advancementDistributionOptions(
        state,
        effect.amount,
        effect.distribution,
      ).length === 0
    )
      return false;
    if (
      effect.kind === "move_advancement_counters" &&
      moveAdvancementOptions(
        state,
        "" as CardInstanceId,
        effect.source,
        effect.maxAmount,
      ).length === 0
    )
      return false;
  }
  return true;
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

function publicInstalledCorpCardIdentityKnown(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  const instance = state.cardInstances[cardId];
  return instance?.faceup === true || instance?.rezzed === true;
}

function uninstallCorpInstalledCardToHq(
  state: GameState,
  cardId: CardInstanceId,
): void {
  const instance = mustInstance(state.cardInstances, cardId);
  removeFromAllZones(state, cardId);
  state.corp.hq.unshift(cardId);
  state.cardInstances[cardId] = {
    ...instance,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "hq" },
  };
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
    stolenAgendaAdvancementCountersThisTurn: 0,
    stolenAgendaAdvancementCountersLastTurn: 0,
    runnerReceivedTagThisTurn: false,
    stoleResearchAgendaThisTurn: false,
    stoleGrayOpsAgendaThisTurn: false,
    stoleBlackOpsAgendaThisTurn: false,
    runAttemptsThisTurn: 0,
    runAttemptsLastTurn: 0,
    successfulHqRunThisTurn: false,
    successfulRunThisTurn: false,
    damagePreventionUsage: {},
    runnerActionsTakenThisTurn: 0,
    brokerActionCardIdsThisTurn: [],
    startOfTurnFloatingCreditsApplied: false,
    allNighterBonusRunPending: false,
    forgoNextActionPending: false,
    forgoNextActionsPending: 0,
    runLockActionsPending: 0,
    fangRunLockCreditCost: 0,
    valuPakProgramInstallActionsRemaining: 0,
    valuPakTemporaryProgramInstallCredits: 0,
    shellTradersStartTurnResolvedSourceIds: [],
    bodyweightDataCrecheExtraRunPending: false,
    bodyweightDataCrecheExtraRunUsedThisTurn: false,
    startupImmolatorUsedSourceIdsThisTurn: [],
  });
  flags.stolenAgendaAdvancementCountersThisTurn ??= 0;
  flags.stolenAgendaAdvancementCountersLastTurn ??= 0;
  flags.runnerReceivedTagThisTurn ??= false;
  flags.stoleResearchAgendaThisTurn ??= false;
  flags.stoleGrayOpsAgendaThisTurn ??= false;
  flags.stoleBlackOpsAgendaThisTurn ??= false;
  flags.runAttemptsThisTurn ??= 0;
  flags.runAttemptsLastTurn ??= 0;
  flags.successfulHqRunThisTurn ??= false;
  flags.successfulRunThisTurn ??= false;
  flags.damagePreventionUsage ??= {};
  flags.runnerActionsTakenThisTurn ??= 0;
  flags.brokerActionCardIdsThisTurn ??= [];
  flags.startOfTurnFloatingCreditsApplied ??= false;
  flags.allNighterBonusRunPending ??= false;
  flags.forgoNextActionPending ??= false;
  flags.forgoNextActionsPending ??= 0;
  flags.runLockActionsPending ??= 0;
  flags.fangRunLockCreditCost ??= 0;
  flags.valuPakProgramInstallActionsRemaining ??= 0;
  flags.valuPakTemporaryProgramInstallCredits ??= 0;
  flags.shellTradersStartTurnResolvedSourceIds ??= [];
  flags.bodyweightDataCrecheExtraRunPending ??= false;
  flags.bodyweightDataCrecheExtraRunUsedThisTurn ??= false;
  flags.startupImmolatorUsedSourceIdsThisTurn ??= [];
  flags.preyingMantisUsedSourceIdsThisTurn ??= [];
  flags.preyingMantisDamageDueSourceIdsThisTurn ??= [];
  flags.corpRezzedIceThisTurn ??= 0;
  return flags;
}

function hasSuccessfulHqRunThisTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.successfulHqRunThisTurn === true;
}

function hasSuccessfulRunThisTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.successfulRunThisTurn === true;
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
  flags.disinfectantUsedSourceIdsThisTurn ??= [];
  flags.employeeEmpowermentStartTurnResolvedSourceIds ??= [];
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

function cloneGameStateForAction(state: GameState): GameState {
  return {
    ...cloneState({ ...state, eventLog: [] }),
    eventLog: state.eventLog.slice(),
  };
}
