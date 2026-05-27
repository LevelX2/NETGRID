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
  type PublicGameEvent,
  type PurgeableRunnerVirusCounterBucket,
  type PurgeableRunnerVirusCounterType,
  type ReplacementCandidate,
  type ReplacementWindow,
  type ResolvedGameEffect,
  type ReplayResult,
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
  corpServerIdForInstalledCard,
  quoteCorpIceInstallCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
  type CorpTracePaymentDependencies,
  type RunnerTracePaymentDependencies,
} from "./game/payment";
import {
  resolvePendingChoice,
  type PendingChoiceResolutionHost,
} from "./game/choices/pending-choice-resolution";
import { selectedChoiceIds } from "./game/choices/choice-validation";
export {
  getLegalActions,
  legalActionsFor,
} from "./game/legal-actions";
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "./game/legal-action-hosts";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "./game/events/build-event";
import {
  configureEventContextHostComposition,
} from "./game/events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "./game/win-conditions";
export { checkWinConditions } from "./game/win-conditions";
import {
  calculateRunnerLink as calculateRunnerLinkInTrace,
  handleTraceOrchestrationAction,
  resolveTraceChoice,
  traceBidChoice,
  startTraceFromOperation as startTraceFromOperationInTrace,
  type TraceOrchestrationHost,
} from "./game/trace/trace-orchestration";
import {
  buildLegalAction as action,
  makeActionId,
} from "./game/turn/action-builders";
import {
  createMainActionHostComposition,
  type MainActionHostCompositionHost,
} from "./game/turn/main-action-hosts";
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
  assertCorpCanCreateNewDataFort,
  buildCorpTrashNewDataFortCreationLockActions,
  corpNewDataFortCreationLocked,
  newDataFortCreationLockForSource,
} from "./game/turn/corp-data-fort-lock";
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
  addCorpActionDebt,
  corpActionDebtPending,
  purgeableRunnerVirusCounterAmount,
  purgeableRunnerVirusCounterTotal,
  purgeVirusCounters,
  type TurnBasicExecutionHost,
} from "./game/turn/turn-basic-execution";
import { type CreditEconomyExecutionHost } from "./game/economy/credit-economy-execution";
import { type TriggerAbilityExecutionHost } from "./game/abilities/trigger-ability-execution";
import {
  handleCounterUtilityTriggerExecution,
  type CounterUtilityTriggerExecutionHost,
} from "./game/abilities/counter-utility-trigger-execution";
import { handleHiddenZoneTriggerExecution } from "./game/abilities/hidden-zone-trigger-execution";
import {
  handleRunFortTriggerExecution,
  microtechHostedProgramIds,
  topHostedProgramOnMicrotech,
  type RunFortTriggerExecutionHost,
} from "./game/abilities/run-fort-trigger-execution";
import {
  applyShellTradersStartOfTurn,
  handleRunnerSpecialTriggerExecution,
  shellTradersInstallCost,
  shellTradersPreparedTargetIds,
  shellTradersPrepareTargetIds,
  topRunnerHeapCardId,
  type RunnerSpecialTriggerExecutionHost,
} from "./game/abilities/runner-special-trigger-execution";
import {
  installCard as executeInstallCard,
  type InstallCardHost,
} from "./game/install/install-card";
import {
  rezCard as executeRezCard,
  type RezCardHost,
} from "./game/rez/rez-card";
import {
  addRunnerTagsWithPrevention,
  aggregateDamageSummaries,
  configureDamageCoreHost,
  createDamageImminentEvent,
  damagePreventionSourcesForDefinition,
  doDamage,
  hiddenRunnerResourceRevealPayload,
  isRunnerHardwareDeckDefinition,
  openEventModificationWindow,
  openReplacementWindow,
  openRunnerInstalledTrashPreventionWindow,
  resolveDamageImminentEvent,
  resolveDamageOperation,
  resolveEventModificationChoice,
  resolveReplacementChoice,
  resolveRunnerInstalledTrashImminentEvent,
  setDamagePayload,
  type DamageCoreHost,
  type DamageSummary,
} from "./game/damage/damage-core";
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
  buildRunnerShellTradersRemoveCounterAction,
  buildRunnerShellTradersSetAsideAction,
  buildRunnerValuPakInstallAction,
  buildRunnerValuPakSequenceEndAction,
} from "./game/turn/runner-special-zone-install-actions";
import {
  lookTopStackShowToCorpThenInstallMatchingTargets,
  searchStackInstallTargets,
  sneakPreviewInstallableProgramIds,
  sneakPreviewSourceOptions,
  startAujourdOuiTop5Activation,
  startRunnerStackSearchChoiceActivation,
  startSelfModifyingCodeStackActivation,
  startSneakPreviewSourceActivation,
} from "./game/hidden-zone/search-choice-activations";
import {
  handleHiddenZoneSearchChoice,
  type HiddenZoneSearchActivationHandlerHost,
  type HiddenZoneSearchChoiceHandlerHost,
} from "./game/hidden-zone/search-choice-handlers";
import {
  handleHiddenZoneArrangeChoice,
  resolveNewBloodConcealAndReorder,
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
  runnerAccessTrashRecurringCreditSourceIds,
  type RunnerAccessActionHost,
} from "./game/access/access-actions";
import {
  resolveAccessInstalledRunnerProgramReturnChoice,
  resolveAccessPaymentChoice,
  resolveChimeraDaemonTrashChoice as resolveAccessChimeraDaemonTrashChoice,
  type AccessEffectHandlerHost,
} from "./game/access/access-effect-handlers";
import {
  advanceArchivesBreachPastNonDecisionCards,
  type AccessFlowHost,
} from "./game/access/access-flow";
import {
  installedAccessBonusForServer,
  runnerHqAccessBonus as runnerHqAccessBonusForBreach,
  type BreachStateHost,
} from "./game/access/breach-state";
import {
  resolveMicrotechAiInterfacePreAccessChoice,
  resolvePriorityWreckSpendChoice,
  sourcePayloadForSuccessfulRunReplacement,
  type RunAccessTransitionHost,
} from "./game/run/run-access-transition";
import { type StartRunOptions } from "./game/run/run-core-execution";
import {
  applyBodyweightDataCrecheSuccessfulRun,
  resolveSuccessfulRunFollowupAbility,
  resolveSuccessfulRunInterventionChoice as resolveSuccessfulRunInterventionChoiceInRunModule,
  type SuccessfulRunInterventionHost,
} from "./game/run/successful-run-interventions";
import {
  handleRunEndCleanup,
  recordDupreBreakUsage,
  resetBreakerStrength,
  resolvePattelsVirusCounterChoice,
  type RunEndCleanupHost,
} from "./game/run/run-end-cleanup";
import {
  activeWilsonSourceIds,
  availableRunnerRunStartCredits,
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  payRunStartTaxCredits,
  recordWilsonRunCapSpend,
  restrictedHostedCreditSourceForDefinition,
  restrictedHostedCreditSourceIds,
  restrictedHostedCredits,
  runDurationPaymentHost,
  shouldLoadLegacyRecurringCredits,
  spendHostedPaymentCredits,
  spendRestrictedHostedCredits,
  spendRunnerRunCredits,
  type RunDurationPaymentHost,
} from "./game/run/run-duration-payment";
import {
  resolvePassRezzedIceProgramTrashChoice as resolvePassRezzedIceProgramTrashChoiceInRunModule,
  resolveViral15ProgramTrashChoice as resolveViral15ProgramTrashChoiceInRunModule,
  type EncounterResolutionHost,
} from "./game/run/encounter-resolution";
import {
  applyRioDeJaneiroCityGridPassedIceTrigger,
  isSubmarineUplinkSource,
  markSubmarineUplinkJackOutAfterEncounter,
  resolveFullyBrokenPassedIceDerezAndEndRun as resolveFullyBrokenPassedIceDerezAndEndRunInRunModule,
  resolveStartupImmolatorTrashIce as resolveStartupImmolatorTrashIceInRunModule,
  resolveTooManyDoorsSecretSpendChoice as resolveTooManyDoorsSecretSpendChoiceInRunModule,
  type EncounterSpecialWindowHost,
} from "./game/run/encounter-special-windows";
import {
  applyPrintedTraceSuccessFollowups,
  isSupportedEncounterTraceSuccessEffect,
  type EncounterPrintedEffectHost,
} from "./game/run/encounter-printed-effects";
import {
  type EncounterPrintedNonTraceHost,
} from "./game/run/encounter-printed-nontrace-effects";
import {
  breakAbilityMatchesIce,
  breakAbilityMatchesSubroutine,
  buildRunnerEncounterActions,
  buildRunnerMovementActions,
  type RunnerEncounterActionHost,
} from "./game/run/encounter-actions";
import {
  buildCorpEncounterCardImplementationActions,
} from "./game/run/card-implementation-run-actions";
import {
  createGameCardImplementationRuntimeDeps,
  type GameCardImplementationRuntimeDepsHost,
} from "./game/card-implementation/card-implementation-runtime-deps";
import {
  type HiddenZoneRuntimeDepsHost,
} from "./game/card-implementation/hidden-zone-runtime-deps";
import {
  type InstallRezRuntimeDepsHost,
} from "./game/card-implementation/install-rez-runtime-deps";
import {
  type CounterLifecycleRuntimeDepsHost,
} from "./game/card-implementation/counter-lifecycle-runtime-deps";
import {
  type TraceRuntimeDepsHost,
} from "./game/card-implementation/trace-runtime-deps";
import {
  beginEncounter,
  isApproachIceExposeViewingWindowOpen,
  isApproachIceExposeWindowOpen,
  resolveApproachIceExposeAbility,
  resolveApproachIceExposeViewingDecision,
  runnerApproachIceExposeActions,
  runnerApproachIceExposeViewingActions,
  type EncounterEntryHost,
} from "./game/run/encounter-entry";
import {
  buildCorpApproachActions,
  buildCorpRunRootRezWindowActions,
  corpRunRootRezWindowKey,
  handleRunRootRezPostRez,
  isCorpRunRootRezWindowOpen,
  passCorpRunRootRezWindow,
  resolveCorpRootRezEffect,
  resolveSpeedTrapRezInterruptChoice,
  type RunRezWindowHost,
} from "./game/run/run-rez-window";
import {
  resolveFortPassAdvancementWindow,
  resolveSingaporeCityGridSwapChoice,
  resolveStartRunIceRepositionWindow,
  startSingaporeCityGridSwapChoice,
  type FortPassWindowHost,
} from "./game/run/fort-pass-window";
import {
  applyPostBreakStealthLoss,
  clearRovingSubmarineActivityMarkers,
  isRovingSubmarineRunBlocked,
  isParisTracePoolSource,
  markRovingSubmarineActivityForServer,
  parisCityGridTracePoolSource,
  parisCityGridTracePoolTotal,
  parisTracePoolCapacityForCard,
  resolveAardvarkInterceptionChoice,
  resolveHammerStealthLossChoice,
  runnerStealthRecurringCredits,
  shouldOpenAardvarkInterception,
  spendParisCityGridTracePool,
  startAardvarkInterceptionChoice,
  validateRovingSubmarineRunGate,
  type FortRunSideFamiliesHost,
} from "./game/run/fort-run-side-families";
import {
  handleRunMovementAction,
  passApproachedIce,
  type RunMovementHost,
} from "./game/run/run-movement";
import {
  createRunAccessLegalActionHostComposition,
  type RunAccessLegalActionHostCompositionHost,
} from "./game/run/run-access-legal-action-hosts";
import { type RunnerBreakerActionExecutionHost } from "./game/run/runner-breaker-action-execution";
import { type StartRunActionExecutionHost } from "./game/run/start-run-action-execution";
import { type RezActionExecutionHost } from "./game/rez/rez-action-execution";
import { type PlayCardExecutionHost } from "./game/play/play-card-execution";
import {
  canPlayCorpOperation,
  cardImplementationOperationLegalActions,
  corpUtilityImplementationForDefinition,
  hasPrintedCostOnPlayCardImplementation,
  onPlayCardImplementationEffects,
  onPlayCardImplementationAdditionalOperationCost,
  onPlayCardImplementationNeedsLastTurnResourceTarget,
  resolveCorpOperation,
  type CorpOperationResolutionHost,
} from "./game/play/corp-operation-resolution";
import { type BoardStateActionExecutionHost } from "./game/board/board-state-action-execution";
import { shuffleRunnerStackAndRefreshZones } from "./game/hidden-zone/runner-stack-shuffle";
export { quoteCorpRezCost } from "./game/payment";
export {
  createGame,
  createGameAfterSetup,
} from "./game/create-game";
import { hashState } from "./game/hash";
import { applyAction as applyActionFromGame } from "./game/apply-action";
export { applyAction } from "./game/apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "./game/apply/apply-action-hosts";
export { applyGameAction } from "./game/apply-game-action";
export { getPlayerView, playerViewFor } from "./game/player-view";
export { replayEvents, replayGameEvents } from "./game/replay";
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
  currentEncounterAdditionalSubroutinesForIce,
} from "./ability-engine/additional-subroutine-modifiers";
import { quoteBreakSubroutineCostModifiers } from "./ability-engine/break-subroutine-cost-modifiers";
import {
  effectiveAgendaDifficulty,
  maxHandSize,
  runnerMemoryLimit,
  type EffectiveAgendaDifficultyDependencies,
} from "./ability-engine/effective-values";
import {
  publicServerLabel,
  publicServerLabelForCard,
  serverChoiceDisplayLabel,
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
  EDGERUNNER_TEMPS_INSTALL_OPERATION_ID,
  FORGED_ACTIVATION_ORDERS_FORCE_REZ_EVENT_ID,
  JAPANESE_WATER_TORTURE_BREAKER_ID,
  MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
  MISC_FOR_SALE_TRASH_INSTALLED_EVENT_ID,
  OPEN_ENDED_MILEAGE_PROGRAM_TAG_RETURN_EVENT_ID,
  RABBIT_HQ_INTERFACE_PROGRAM_ID,
  SECURITY_CODE_WORM_CHIP_HQ_TRASH_EVENT_ID,
  SYNCHRONIZED_ATTACK_ON_HQ_RETAIN_EVENT_ID,
  VALU_PAK_SOFTWARE_BUNDLE_INSTALL_EVENT_ID,
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
  isP358HiddenReplacementCompatibilityChoiceSource,
} from "./compatibility/payload-compatibility";
import {
  ALL_NIGHTER_ID,
  ARMADILLO_ARMORED_ROAD_HOME_ID,
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
  GRUBB_ID,
  HELLS_RUN_ID,
  HUNT_CLUB_BBS_ID,
  INCUBATOR_ID,
  JUNKYARD_BBS_ID,
  MICROTECH_TRODE_SET_ID,
  MIT_WEST_TIER_REMOVED_FROM_GAME_REASON,
  MYSTERY_BOX_ID,
  NEVINYRRAL_ID,
  PATTELS_VIRUS_ID,
  POX_ID,
  RONIN_AROUND_ID,
  SELF_MODIFYING_CODE_ID,
  SHELL_TRADERS_ID,
  SKIVVISS_ID,
  SMARTEYE_ID,
  SNEAK_PREVIEW_ID,
  TERRORIST_REPRISAL_ID,
  TOO_MANY_DOORS_ID,
} from "./compatibility/runtime-compatibility";
import {
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
import { executeCardImplementationEffects } from "./ability-engine/effect-interpreter";
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
} from "./ability-engine/card-implementation-runtime";
import type {
  ActivatedCardAbilityImplementation,
  CardCorpUtilityImplementation,
  CardDamagePreventionSourceImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardHiddenReplacementLongtailImplementation,
  CardRemainingReplacementLongtailImplementation,
  CardRunnerEventLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardScoredAgendaImplementation,
  CardTagPreventionSourceImplementation,
  CardTraceSuccessEffectImplementation,
  CardTrashPreventionSourceImplementation,
  CardUniqueDirectLongtailImplementation,
  CardVariableRezImplementation,
  CardVirusCounterImplementation,
  MakeRunEffectImplementation,
} from "./ability-engine/definition-types";

type AutomaticEffectCollector = ResolvedGameEffect[];
const PROTEUS_TAXMAN_ID = "onr_proteus_097_taxman" as CardDefinitionId;
const PROTEUS_SCALDAN_ID = "onr_proteus_094_scaldan" as CardDefinitionId;
const PROTEUS_VIRAL_PIPELINE_ID =
  "onr_proteus_099_viral-pipeline" as CardDefinitionId;
const PROTEUS_ARMAGEDDON_ID = "onr_proteus_078_armageddon" as CardDefinitionId;

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
  addCardCounter,
  cardCounter,
  spendCardCounter,
  credits,
  mustInstance,
  definitionFor,
  runnerInstalledCardIds,
  hiddenRunnerResourceRevealPayload,
  trashCorpInstalledCardToArchives,
  trashRunnerInstalledCardToHeap,
});

// Runtime dependencies define the host contract for declarative
// CardImplementation abilities and lifecycle hooks. Payment timing, movement,
// damage windows, and source trashing remain owned by index.ts primitives.
function hiddenZoneRuntimeDepsHost(): HiddenZoneRuntimeDepsHost {
  return {
    cards: {
      runnerInstalledCardIds,
      topRunnerHeapCardId,
    },
    hiddenZone: {
      searchActivationTargetHost: hiddenZoneSearchActivationTargetHost,
      searchActivationHandlerHost: hiddenZoneSearchActivationHandlerHost,
      arrangeChoiceHandlerHost: hiddenZoneArrangeChoiceHandlerHost,
      nonSearchChoiceHandlerHost: hiddenZoneNonSearchChoiceHandlerHost,
      corpZoneChoiceHandlerHost,
    },
    callbacks: {
      startRunnerPrivateLookChoice: (
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        zone,
        count,
      ) =>
        startRunnerPrivateLookChoice(
          state,
          sourceCardId,
          sourceDefinitionId,
          zone,
          count,
          "ability",
          legalAction,
        ),
      exposeInstalledCorpCardTargets,
      exposeInstalledCorpCard: exposeInstalledCorpCardForImplementation,
      startExposeInstalledCorpCardsChoice,
      exposeOutermostIceOfEachDataFort,
      outermostIceExposures,
      shuffleGripTrashAndStackThenDrawForCardImplementation,
    },
  };
}

function traceRuntimeDepsHost(): TraceRuntimeDepsHost {
  return {
    trace: {
      orchestrationHost: traceOrchestrationHost,
      resolveRunnerLastTurnInstalledResourceTargetId,
    },
  };
}

function installRezRuntimeDepsHost(): InstallRezRuntimeDepsHost {
  return {
    cards: { definitionFor },
    install: { runnerInstallableProgramIdsForValuPak },
    rez: {
      affordableRezzedInstalledIceIdsForRunner,
      unrezzedInstalledIceIds,
      installedIceIds: (state) =>
        corpInstalledCardIds(state).filter(
          (cardId) =>
            mustInstance(state.cardInstances, cardId).zone.zone === "serverIce",
        ),
      rezzedBlackIceIds,
      startCoreCommandJettisonIceChoice,
      startSecurityCodeWormChipTrashIceChoice,
      startForgedActivationOrdersTargetChoice,
      startAnonymousTipDerezBlackIceChoice,
    },
    runner: { ensureTurnFlags: ensureRunnerTurnFlags },
  };
}

function counterLifecycleRuntimeDepsHost(): CounterLifecycleRuntimeDepsHost {
  return {
    counters: {
      cardCounter,
      addCounterToAllInstalledRunnerIcebreakers,
    },
    lifecycle: {
      hasSuccessfulHqRunThisTurn,
      runnerLiberatedAgendaSubtypeThisTurn: runnerStoleAgendaSubtypeThisTurn,
      corpScoredBlackOpsAgendaLastTurn,
    },
  };
}

function gameCardImplementationRuntimeDepsHost(): GameCardImplementationRuntimeDepsHost {
  return {
    cards: {
      definitionFor,
      mustInstance,
      rezzedCorpRootCardIds,
      runnerInstalledCardIds,
    },
    credits: {
      spendClick,
      spendCredits,
    },
    actions: {
      createAction: action,
      appendResolvedEffectsToPayload,
    },
    run: {
      startRun: (state, serverId, accessCount, options, legalAction) =>
        startRun(state, serverId, undefined, accessCount, options, legalAction),
    },
    hiddenZone: {
      runtimeDepsHost: hiddenZoneRuntimeDepsHost(),
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
    },
    install: {
      runtimeDepsHost: installRezRuntimeDepsHost(),
    },
    trace: traceRuntimeDepsHost(),
    counters: counterLifecycleRuntimeDepsHost(),
    callbacks: {
      effectAdapters: cardImplementationEffectAdapters,
      shuffleSourceIntoCorpRd: (state, sourceCardId, sourceDefinitionId) =>
        shuffleCorpCardIntoRd(
          state,
          sourceCardId,
          sourceDefinitionId,
          "lifecycle",
        ),
      trashCorpInstalledCardsInSourceServer:
        trashCorpInstalledCardsInScoredSourceServer,
      awardRunnerEventAgendaPoint,
      discardRandomCorpHqCards: (state, sourceDefinitionId, count) =>
        discardRandomCorpHqCards(
          state,
          count,
          sourceDefinitionId === TERRORIST_REPRISAL_ID
            ? `v190.random.${TERRORIST_REPRISAL_ID}.hq_discard`
            : `card_implementation.random.${sourceDefinitionId}.hq_discard`,
        ),
      startDistributeAdvancementCounters:
        startCardImplementationAdvancementDistributionChoice,
      startMoveAdvancementCounters: startCardImplementationMoveAdvancementChoice,
      startOpenEndedMileageProgramReturnChoice,
    },
  };
}

const cardImplementationRuntimeDeps = createGameCardImplementationRuntimeDeps(
  gameCardImplementationRuntimeDepsHost(),
);

const runAccessLegalActionHostComposition =
  createRunAccessLegalActionHostComposition({
  cards: {
    definitionFor,
    cardInstanceFor: (state, cardId) => mustInstance(state.cardInstances, cardId),
    cardHasSubtype,
    runnerInstalledCardIds,
    publicInstalledCorpCardIdentityKnown,
    effectiveSubtypesForCard,
    hostedProgramStrengthModifier,
    icebreakerEncounterStrengthBonus,
    permanentIcebreakerStrengthCounterBonus,
  },
  servers: {
    mustServer,
    publicServerLabel,
    randomHqAccess,
  },
  run: {
    currentRun: mustRun,
    currentEncounterSubroutines: subroutinesForCurrentEncounter,
    runRemainderStrengthBonusForBreaker,
    executeCardImplementationRunnerRunStartEffects: (
      callbackState,
      legalAction,
    ) =>
      executeCardImplementationRunnerRunStartEffects(
        cardImplementationRuntimeDeps,
        callbackState,
        legalAction,
      ),
    applyRunnerTraceCounterRunStartEffects,
    applyAiBoonRunStart,
    finishRun,
    successfulRunInterventionHost,
    startExpertScheduleAnalyzerPostAccessChoice,
  },
  access: {
    advanceArchivesBreachPastNonDecisionCards,
    startRunnerPrivateLookChoice,
  },
  payment: {
    spendCredits,
    credits,
    rezCostForCard,
    creditCostForAction,
    hostedPaymentCredits,
    restrictedHostedCreditSourceIds,
    isRestrictedHostedCreditSource,
    spendRunnerAccessTrashCredits,
  },
  choices: {
    hiddenZoneArrangeChoiceHandlerHost,
    openRunnerInstalledTrashPreventionWindow,
  },
  cardImplementation: {
    accessEffectsForDefinition: (definitionId) =>
      cardImplementationForDefinitionId(definitionId)?.accessEffects ?? [],
    accessHookKindsForDefinition: (definitionId) =>
      cardImplementationForDefinitionId(definitionId)?.accessHooks?.map(
        (hook) => hook.kind,
      ) ?? [],
    runCardImplementationActionHost,
  },
  constants: {
    setup: SETUP_ACCESS_AMBUSH_ASSET_CARD_ID,
    trap: TRAP_ACCESS_AMBUSH_ASSET_CARD_ID,
    crybaby: CRYBABY_ACCESS_COST_UPGRADE_ID,
    dedicatedResponseTeam: DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID,
    dieterEsslin: DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID,
    turbeauDelacroix: TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID,
    corprunnersShatteredRemains:
      CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID,
    experimentalAi: EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID,
    vacantSoulkiller: VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID,
    virusTestSite: VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID,
    bizarreEncryptionScheme: BIZARRE_ENCRYPTION_SCHEME_ID,
    chimera: CHIMERA_ID,
  },
  callbacks: {
    rules: {
      isV097OrLater,
      isV099OrLater,
    },
    turn: {
      ensureRunnerTurnFlags,
      consumeRunnerFutureActionDebt,
    },
    trace: {
      calculateRunnerLink: (state) =>
        calculateRunnerLinkInTrace(traceOrchestrationHost(state)),
      traceBidChoice,
      addHackerTrackerTraceCounters,
      hackerTrackerCounterTotal,
      krumzTraceBitTotal,
      rabbitTraceLimitReductionForIceTrace,
      resolveTraceHardwareWreckerSuccess,
      resolveTraceTrashRunnerResourceSuccess,
      supportsTraceSuccessEffect: (effect) =>
        isSupportedEncounterTraceSuccessEffect(
          effect,
          traceCounterEffectDefinitionFor,
        ),
      startTraceFromOperation: (
        state,
        sourceDefinitionId,
        baseTraceStrength,
        legalAction,
        successEffect,
      ) =>
        startTraceFromOperationInTrace(
          traceOrchestrationHost(state),
          sourceDefinitionId,
          baseTraceStrength,
          legalAction,
          successEffect,
        ),
      traceSuccessEffectForCardImplementation,
    },
    damage: {
      createDamageImminentEvent,
      doDamage,
      openEventModificationWindow,
      openReplacementWindow,
      resolveDamageImminentEvent,
      setDamagePayload,
      resolveDamageOperation,
    },
    tags: {
      addRunnerTagsWithPrevention,
    },
    counters: {
      cardCounter,
      addCardCounter,
      setCardCounter,
      spendCardCounter,
      addVirusCounterWithDisinfectantPrevention,
      preventOneVirusCounterWithDisinfectant,
      poxCountersForServer,
      addCounterToAllInstalledRunnerIcebreakers,
    },
    ice: {
      strengthForIce: iceStrengthFor,
      icebreakerHasSpecial: (state, breakerId, special) =>
        icebreakerHasSpecial(
          state,
          breakerId,
          special as NonNullable<RuntimeIcebreakerAbility["special"]>,
        ),
      dupreStrengthCounterBonus,
      resetBreakerStrength,
      withoutVariableIceState,
    },
    zones: {
      removeFromAllZones,
      trashCorpInstalledCardToArchives,
      trashRunnerInstalledCardToHeap,
      trashRunnerInstalledProgram,
      cleanupEmptyRemotes,
      ensureSpecialZones,
      shuffleCorpCardIntoRd,
      returnRunnerInstalledProgramsToGripForAccess,
    },
    effects: {
      executeEffectCommands,
      breakAbilityForLegalAction,
      breakSubroutineCostBreakdown,
      abilityMetadata,
      revealCorpRdTop,
    },
    rng: {
      nextRandom,
      rollDie: rollDeterministicDie,
      shuffleStateIds,
    },
    misc: {
      drawCorpCards,
      acmeSavingsAndLoanObligationCount,
      addAcmeSavingsAndLoanObligation,
      applyRunnerForgoNextAction,
      hasInstalledMicrotechTrodeSet,
      traceCounterEffectDefinitionFor,
      installedRunnerVirusSourceIds,
      virusCounterImplementationForCard,
      agendaPointsForScoredCard,
      snapshotPersistentStealCostModifiersForSource,
      archivesAccessRequiresDecisionOrEffect,
      installedRevealHelperCount: (state) =>
        v1915InstalledRevealHelperIds(state).length,
    },
  },
} satisfies RunAccessLegalActionHostCompositionHost);

const runFlow = runAccessLegalActionHostComposition.runFlow;
const accessFlow = runAccessLegalActionHostComposition.accessFlow;

configureEventContextHostComposition({
  cards: {
    agendaPointsForScoredCard,
    cardCounter,
    definitionFor,
    hostedProgramStrengthModifier,
    mustInstance,
  },
  publicContext: {
    creditCostForAction,
    pumpAmountForLegalAction,
  },
  callbacks: {
    breachStateHost,
    installedAccessBonusForServer,
    runnerHqAccessBonusForBreach,
  },
  constants: {
    badPublicityLossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD,
  },
});
type VisibleCounterPayload = {
  counterType: CounterType;
  addedCounterAmount?: number;
  removedCounterAmount?: number;
  remainingCounters: number;
};

const damageCoreHost: DamageCoreHost = {
  cards: {
    definitionFor,
    runnerInstalledCardIds,
    scoredCorpAgendaIds,
    scoredAgendaKindForDefinition,
  },
  zones: {
    removeFromAllZones,
    trashRunnerInstalledCardToHeap,
    returnRunnerInstalledCardToGrip,
  },
  runner: {
    drawRunnerCard,
    ensureRunnerTurnFlags,
    addFutureActionDebt: addRunnerFutureActionDebt,
  },
  corp: {
    agendaPointTotal: corpAgendaPointTotal,
    chooseAgendasForPointCost: chooseCorpAgendasForPointCost,
    agendaPointsForScoredCard,
    forfeitAgendaForPointCost: forfeitCorpAgendaForPointCost,
  },
  counters: {
    cardCounter: (state, cardId, counterType) =>
      cardCounter(state, cardId, counterType as CounterType),
    spendCardCounter: (state, cardId, counterType, amount) =>
      spendCardCounter(state, cardId, counterType as CounterType, amount),
  },
  credits: {
    gain: credits,
    spend: spendCredits,
  },
  rng: {
    nextRandom,
  },
};

configureDamageCoreHost(damageCoreHost);

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

function variableRezForDefinition(
  definition: CardDefinition,
): CardVariableRezImplementation | undefined {
  return cardImplementationForDefinitionId(definition.id)?.variableRez;
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
      case "trash_installed_runner_connections_then_add_bad_publicity":
        return {
          name: "card_implementation_runner_event_trash_installed_runner_connections_then_add_bad_publicity",
          canPlay: (state) =>
            canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
              state,
              longtail,
            ),
          resolve: (state, legalAction) =>
            resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(
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

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
const INITIAL_HAND_SIZE = 5;
const TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS = new Set([
  ARMADILLO_ARMORED_ROAD_HOME_ID,
  DRIFTER_MOBILE_ENVIRONMENT_ID,
]);

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

const mainActionHostComposition = createMainActionHostComposition({
  actions: {
    buildLegalAction: action,
    makeActionId,
    buildEndTurnAction: buildCorpEndTurnAction,
    buildForgoActionDebtAction: (state) =>
      legalActionHostComposition.buildCorpForgoActionDebtAction(state),
    buildPurgeableRunnerVirusPurgeAction: (state) =>
      legalActionHostComposition.buildPurgeableRunnerVirusPurgeAction(state),
    buildPurgeVirusAction: buildCorpPurgeVirusAction,
    buildGainCreditAction: buildCorpGainCreditAction,
    buildDrawAction: buildCorpDrawAction,
    buildTrashNewDataFortCreationLockActions:
      buildCorpTrashNewDataFortCreationLockActions,
    buildNewRemoteIceInstallAction: buildCorpNewRemoteIceInstallAction,
    buildServerIceInstallAction: buildCorpServerIceInstallAction,
    buildNewRemoteRootInstallAction: buildCorpNewRemoteRootInstallAction,
    buildServerRootInstallAction: buildCorpServerRootInstallAction,
    buildRunnerEndTurnAction,
    buildRunnerGainCreditAction,
    buildRunnerRemoveTagAction,
    buildRunnerDrawCardActions,
    buildRunnerProgramInstallAction,
    buildRunnerProgramTrashBeforeInstallAction,
    buildRunnerZetatechOverlayInstallAction,
    buildRunnerHostedProgramInstallAction,
    buildRunnerAgendaPointInstallAction,
    buildRunnerHardwareInstallAction,
    buildRunnerSelectedServerInstallAction,
    buildRunnerResourceInstallAction,
    buildRunnerStackSearchProgramToGripAction,
    buildRunnerValuPakInstallAction,
    buildRunnerValuPakSequenceEndAction,
    buildRunnerShellTradersSetAsideAction,
    buildRunnerShellTradersRemoveCounterAction,
  },
  cards: {
    definitionFor,
    mustInstance,
    isUniqueCard,
    hasInstalledUniqueCardDefinition,
    cardImplementationForDefinitionId,
    rezzedCorpRootCardIds,
    corpInstalledCardIds,
    visibleVirusCounterTargetIds,
  },
  scored: {
    effectiveAgendaDifficulty,
    effectiveAgendaDifficultyDeps,
    scoredAgendaKindForDefinition,
    serverChoiceDisplayLabel,
    scoredAgendaAbilityHost,
    buildScoredAgendaAbilityActionsForCard,
  },
  counters: {
    totalCounters,
    purgeableRunnerVirusCounterTotal,
    spyCountersForServer,
    cardCounter,
    runnerTraceCounterEffectDefinitions,
    runnerCounterDisplayName,
  },
  corp: {
    corpActionDebtPending,
    acmeSavingsAndLoanObligationCount,
    canPlayCorpOperation: (stateToRead, definition) =>
      canPlayCorpOperation(corpOperationResolutionHost(stateToRead), definition),
    cardImplementationOperationLegalActions: (stateToRead, cardId, definition) =>
      cardImplementationOperationLegalActions(
        corpOperationResolutionHost(stateToRead),
        cardId,
        definition,
      ),
    corpUtilityImplementationForDefinition,
    powerGridOverloadLegalActions,
    systematicLayoffsLegalActions,
    corpAgendaPointTotal,
    hasCorpUtilityKind,
    uniqueDirectLongtailKindForDefinition,
    corpInstalledEconomyActionProfileForDefinition,
    corpInstalledEconomyActionPayload,
  },
  runner: {
    isConcealedRunnerResource,
    hiddenRunnerResourceSlotId,
    ensureRunnerTurnFlags,
    availableRunnerTagRemovalCredits,
    availableRunnerProgramInstallCredits,
    availableRunnerRunStartCredits,
    runnerDrawActionContext,
    runnerUtilityLongtailKindForCard,
    uniqueDirectLongtailImplementationForCard,
  },
  run: {
    activeWilsonSourceIds,
    runDurationPaymentHost,
    isRovingSubmarineRunBlocked,
    fortRunSideFamiliesHostForState,
    runStartTaxForServerUpgrades,
    newsgroupTauntingRunStartTax,
  },
  install: {
    corpNewDataFortCreationLocked,
    corpIceInstallTotalCost,
    canInstallCorpRootCardInServer,
    isRegionUpgrade,
    corpRegionUpgradeIdsInServer,
    corpRootAgendaOrNodeCapacityInServer,
    corpRootAssetIdsInServer,
    corpRootMainCardIdsInServer,
    isInstalledCorpCardAdvanceable,
    shouldOfferRunnerProgramTrashBeforeInstall,
    canOverlayProgramOnZetatechSoftwareInstaller,
    canHostProgramOnDaemon,
    cardImplementationAgendaPointInstallCost,
    pickRunnerAgendaForAgendaPointCost,
    requiresDataFortInstallTarget,
  },
  rez: {
    rootInstallRezzesOnInstall,
    rezCostForCard,
    rezCostReductionSourceDefinitionIdsFor,
    isAcmeSavingsAndLoanDefinition,
  },
  cardImplementation: {
    corpTraceDamageAbilityHost,
    corpSpecialDamageAbilityHost,
    pushCorpTraceDamageOrCardImplementationActions,
    buildCorpSpecialDamageAbilityActionsForCard,
    runtimeDeps: cardImplementationRuntimeDeps,
    cardImplementationForDefinitionId,
    pushEndOfRunnerTurnActions: pushCardImplementationEndOfRunnerTurnActions,
    canPlayPrintedCostOnPlayImplementation,
    runnerEventResolver: cardImplementationRunnerEventResolver,
    printedCostMakeRunEffect: printedCostCardImplementationMakeRunEffect,
    pushActivatedActions: pushActivatedCardImplementationActions,
  },
  specialZones: {
    specialZoneHarnessActions,
    edgerunnerTempsInstallActionsRemaining,
    valuPakProgramInstallActionsRemaining,
    runnerInstallableProgramIdsForValuPak,
    shellTradersPrepareTargetIds: (stateToRead) =>
      shellTradersPrepareTargetIds(
        runnerSpecialTriggerExecutionHost(stateToRead),
      ),
    shellTradersInstallCost,
    shellTradersPreparedTargetIds: (stateToRead) =>
      shellTradersPreparedTargetIds(
        runnerSpecialTriggerExecutionHost(stateToRead),
      ),
  },
  callbacks: {
    mustServer,
    serverChoiceDisplayLabel,
    runnerMemoryLimit,
    exposedCorpCardInServer,
    topHostedProgramOnMicrotech: (stateToRead, cardId) =>
      topHostedProgramOnMicrotech(runFortTriggerExecutionHost(stateToRead), cardId),
    microtechHostedProgramIds: (stateToRead, cardId) =>
      microtechHostedProgramIds(runFortTriggerExecutionHost(stateToRead), cardId),
    topRunnerHeapCardId,
    constants: {
      CODE_VIRAL_CACHE_ID,
      HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS,
      HIDDEN_ZONE_REORDER_ASSET_CARD_IDS,
      CORP_HQ_SHUFFLE_DRAW_CARD_ID,
      COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID,
      DISINFECTANT_VIRUS_COUNTER_ASSET_ID,
      COUNTER_UPGRADE_CARD_IDS,
      TAG_CONDITION_UPGRADE_CARD_IDS,
      COUNTER_ASSET_CARD_IDS,
      INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID,
      ACTION_ASSET_CARD_IDS,
      SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID,
      RUNNER_EVENT_RESOLVERS,
      STACK_SEARCH_PROGRAM_CARD_IDS,
      SELF_MODIFYING_CODE_ID,
      SHORT_CIRCUIT_RESOURCE_CARD_ID,
      AUJOURD_OUI_RESOURCE_CARD_ID,
      SERVER_EXPOSE_PROGRAM_CARD_IDS,
      STACK_TOP_REVEAL_PROGRAM_CARD_IDS,
      COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID,
      FAIT_ACCOMPLI_COUNTER_PROGRAM_ID,
      BOARDWALK_RANDOM_PROGRAM_CARD_ID,
      MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
      QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID,
      STACK_TOP_REORDER_RESOURCE_CARD_ID,
      JUNKYARD_BBS_ID,
      SHELL_TRADERS_ID,
      DANSHIS_SECOND_ID,
      BODYWEIGHT_DATA_CRECHE_ID,
      ALL_NIGHTER_ID,
    },
  },
} satisfies MainActionHostCompositionHost);

const legalActionHostComposition = configureLegalActionHostComposition({
  actions: {
    buildChoiceAction: choiceAction,
    corpRunnerActionPaidWindowActions,
  },
  counters: {
    corpActionDebtPending,
    purgeableRunnerVirusCounterTotal,
  },
  hosts: {
    corpMainActionGenerationHost:
      mainActionHostComposition.corpMainActionGenerationHost,
    runnerMainActionGenerationHost:
      mainActionHostComposition.runnerMainActionGenerationHost,
    runnerEncounterActionHost: runnerEncounterActionHostForState,
    encounterEntryHost: encounterEntryHostForState,
    runRezWindowHost: runRezWindowHostForState,
    runCardImplementationActionHost,
    runnerAccessActionHost,
  },
} satisfies LegalActionHostCompositionHost);

const applyActionHostComposition: ApplyActionHostCompositionHost = {
  actions: {
    applyAction: applyActionFromGame,
  },
  perform: {
    turn: { turnBasicExecutionHost },
    economy: { creditEconomyExecutionHost },
    abilities: { triggerAbilityExecutionHost },
    cardImplementation: { activatedCardImplementationExecutionHost },
    play: { playCardExecutionHost },
    install: { installCardHost },
    board: { boardStateActionExecutionHost },
    corp: { scoredAgendaFlowHost },
    run: {
      startRunActionExecutionHost,
      runMovementHostForState,
      runnerBreakerActionExecutionHost,
      continueRun: (state, legalAction) => runFlow.continueRun(state, legalAction),
    },
    rez: { rezActionExecutionHost },
    access: { accessFlowHost },
    choices: { pendingChoiceResolutionHost },
  },
};

configureApplyActionHostComposition(applyActionHostComposition);

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

function stableSubtypeList(subtypes: readonly string[]): string[] {
  return [...new Set(subtypes.map((subtype) => normalizeSubtypeLabel(subtype)))]
    .sort();
}

function effectiveSubtypesForCard(
  state: GameState,
  cardId: CardInstanceId,
  definition = definitionFor(state, cardId),
): string[] {
  const instance = state.cardInstances[cardId];
  const selectedSubtypes = instance?.variableIceState?.selectedSubtypes;
  if (
    definition.type === "ice" &&
    instance?.rezzed &&
    selectedSubtypes &&
    selectedSubtypes.length > 0
  )
    return stableSubtypeList(selectedSubtypes);
  return stableSubtypeList(definition.subtypes);
}

function rezzedIceOutsideThisIceCount(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const instance = state.cardInstances[iceId];
  if (!instance || instance.zone.side !== "corp" || instance.zone.zone !== "serverIce")
    return 0;
  const server = mustServer(state, instance.zone.serverId);
  const iceIndex = server.ice.indexOf(iceId);
  if (iceIndex < 0) return 0;
  return server.ice
    .slice(iceIndex + 1)
    .filter((candidateId) => state.cardInstances[candidateId]?.rezzed === true)
    .length;
}

function relativeIceStrengthBonusFor(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const relativeIce =
    cardImplementationForDefinitionId(definitionFor(state, iceId).id)?.relativeIce;
  const bonusPerCount = relativeIce?.strengthBonusPerCount;
  if (!bonusPerCount) return 0;
  return rezzedIceOutsideThisIceCount(state, iceId) * bonusPerCount;
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
    hostDefinition.type !== "program" &&
    hostDefinition.type !== "hardware"
  )
    return false;
  const implementation = cardImplementationForDefinitionId(hostDefinition.id);
  if (
    implementation?.hostedProgramCapacity?.hostedProgramsAreInstalled !== true ||
    !implementation.hostedProgramCapacity.allowedCardTypes.includes("program")
  )
    return false;
  const allowedProgramSubtypes =
    implementation.hostedProgramCapacity.allowedProgramSubtypes;
  if (
    allowedProgramSubtypes?.length &&
    !allowedProgramSubtypes.some((subtype) =>
      cardHasSubtype(programDefinition, subtype),
    )
  )
    return false;
  const maxHostedPrograms =
    implementation.hostedProgramCapacity.maxHostedPrograms;
  if (
    typeof maxHostedPrograms === "number" &&
    hostedCardsOn(state, hostId).length >= maxHostedPrograms
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

function icebreakerEncounterStrengthBonus(
  state: GameState,
  breakerId: CardInstanceId,
  encounteredIceId: CardInstanceId,
): number {
  const instance = state.cardInstances[breakerId];
  if (!instance || instance.selectedCardId !== encounteredIceId) return 0;
  const bonus =
    cardImplementationForDefinitionId(definitionFor(state, breakerId).id)
      ?.icebreakerEncounterStrengthBonus;
  if (bonus?.kind !== "against_selected_installed_ice") return 0;
  return Math.max(0, Math.floor(bonus.amount));
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
    instance.variableIceState?.family === "x_strength" &&
    typeof instance.variableIceState.strength === "number"
      ? instance.variableIceState.strength
      : (definition.strength ?? 0);
  const total =
    baseStrength +
    instance.strengthModifier +
    iceStrengthBonusFor(state, iceId) +
    relativeIceStrengthBonusFor(state, iceId) +
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

function permanentIcebreakerStrengthCounterBonus(
  state: GameState,
  breakerId: CardInstanceId,
): number {
  if (icebreakerHasSpecial(state, breakerId, "dupre_strength_counter_and_last_fort"))
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

function resolveMultiBreakSubroutinesAction(
  state: GameState,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const run = mustRun(state);
  const iceId = String(legalAction.payload?.iceId ?? "");
  if (run.phase !== "encounter_ice" || !run.encounteredIceId)
    throw new Error("Multi-Break kann nur im ICE-Encounter genutzt werden.");
  if (run.encounteredIceId !== iceId)
    throw new Error("Multi-Break zielt nicht auf das encountered ICE.");
  if (run.noBreakSubroutinesActive)
    throw new Error("Subroutinen koennen in diesem Encounter nicht gebrochen werden.");
  if (!state.runner.rig.programs.includes(breakerId))
    throw new Error("Der Icebreaker ist nicht installiert.");
  const breakerDefinition = definitionFor(state, breakerId);
  const iceDefinition = definitionFor(state, iceId);
  if (legalAction.payload?.targetIceDefinitionId !== iceDefinition.id)
    throw new Error("Multi-Break zielt auf die falsche ICE-Definition.");
  const ability = icebreakerAbilitiesForDefinition(breakerDefinition).find(
    (candidate) =>
      candidate.id === legalAction.abilityRef?.abilityId &&
      candidate.type === "break_subroutine",
  );
  if (
    !ability ||
    !breakAbilityMatchesIce(
      ability,
      effectiveSubtypesForCard(state, iceId as CardInstanceId, iceDefinition),
    )
  )
    throw new Error("Der Icebreaker hat keine gueltige Multi-Break-Faehigkeit.");
  if (
    ability.selectedIceSubtypeFromBreaker &&
    !effectiveSubtypesForCard(state, iceId as CardInstanceId, iceDefinition).includes(
      normalizeSubtypeLabel(
        mustInstance(state.cardInstances, breakerId).selectedSubtype ?? "",
      ),
    )
  )
    throw new Error("Der gewählte Icebreaker-Typ passt nicht zum ICE.");
  const breakerStrength =
    (breakerDefinition.strength ?? 0) +
    mustInstance(state.cardInstances, breakerId).strengthModifier +
    hostedProgramStrengthModifier(state, breakerId) +
    icebreakerEncounterStrengthBonus(state, breakerId, iceId) +
    cardCounter(state, breakerId, "militech") +
    permanentIcebreakerStrengthCounterBonus(state, breakerId) +
    cardCounter(state, breakerId, "pattel_antibody") * -1 +
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
  const subroutines = subroutinesForCurrentEncounter(state, iceDefinition);
  if (
    subroutineIndexes.length < 1 ||
    subroutineIndexes.length > Math.min(ability.count ?? 4, subroutines.length) ||
    new Set(subroutineIndexes).size !== subroutineIndexes.length ||
    subroutineIndexes.some((index) => !Number.isInteger(index) || index < 0)
  ) {
    throw new Error("Multi-Break hat ungueltige Subroutine-Ziele.");
  }
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
  if (runnerStealthRecurringCredits(fortRunSideFamiliesHostForState(state)) < stealthLoss)
    throw new Error("Nicht genug Stealth-Credits fuer Multi-Break.");
  const expectedCost = breakSubroutineCostBreakdown(
    state,
    ability.cost.credits,
    subroutineIndexes.length,
  ).totalCost;
  if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
    throw new Error("Multi-Break-Kosten sind nicht mehr gueltig.");
  spendRunnerRunCredits(runDurationPaymentHost(state), expectedCost, breakerId);
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
    multiBreakSubroutines: true,
    // Kept for PublicContext and older Pile Driver regression tests.
    pileDriverMultiBreak: true,
    sourceDefinitionId: breakerDefinition.id,
  };
  applyPostBreakStealthLoss(
    fortRunSideFamiliesHostForState(state),
    breakerId,
    legalAction,
  );
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
  if (
    !ability ||
    !breakAbilityMatchesIce(
      ability,
      effectiveSubtypesForCard(state, run.encounteredIceId, iceDefinition),
    )
  )
    throw new Error("Breaker hat keine gueltige Break-Faehigkeit.");
  if (
    ability.selectedIceSubtypeFromBreaker &&
    !effectiveSubtypesForCard(state, run.encounteredIceId, iceDefinition).includes(
      normalizeSubtypeLabel(
        mustInstance(state.cardInstances, breakerId).selectedSubtype ?? "",
      ),
    )
  )
    throw new Error("Der gewählte Icebreaker-Typ passt nicht zum ICE.");
  if (!breakAbilityMatchesSubroutine(ability, subroutine))
    throw new Error("Breaker kann diese Subroutine nicht brechen.");
  const breakerStrength =
    (breakerDefinition.strength ?? 0) +
    mustInstance(state.cardInstances, breakerId).strengthModifier +
    hostedProgramStrengthModifier(state, breakerId) +
    icebreakerEncounterStrengthBonus(state, breakerId, run.encounteredIceId) +
    cardCounter(state, breakerId, "militech") +
    permanentIcebreakerStrengthCounterBonus(state, breakerId) +
    cardCounter(state, breakerId, "pattel_antibody") * -1 +
    dupreStrengthCounterBonus(state, breakerId) +
    runRemainderStrengthBonusForBreaker(run, breakerId);
  if (breakerStrength < iceStrengthFor(state, run.encounteredIceId))
    throw new Error("Der Icebreaker ist nicht stark genug fuer dieses ICE.");
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
    return copies.map((copy) =>
      relativeDamageSubroutineForCurrentEncounter(
        state,
        run?.encounteredIceId,
        variableTraceSubroutineForCurrentEncounter(
          state,
          run?.encounteredIceId,
          copy,
        ),
      ),
    );
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
      state.cardInstances[run.encounteredIceId]?.variableIceState;
    if (variableIceState?.family === "paid_end_the_run_subroutines") {
      const subroutineCount = Math.max(
        0,
        Math.floor(variableIceState.subroutineCount ?? 0),
      );
      for (let index = 0; index < subroutineCount; index += 1) {
        subroutines.push({
          id: `variable_ice_paid_end_the_run_${index + 1}`,
          type: "end_the_run",
        });
      }
    }
    subroutines.push(
      ...currentEncounterAdditionalSubroutinesForIce(state, run.encounteredIceId),
    );
    subroutines.push(...relativeTraceSubroutinesForCurrentEncounter(state, run.encounteredIceId));
    subroutines.push(...additionalSubroutinesForIce(state, run.encounteredIceId));
  }
  return subroutines;
}

function variableTraceSubroutineForCurrentEncounter(
  state: GameState,
  iceId: CardInstanceId | undefined,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): NonNullable<CardDefinition["subroutines"]>[number] {
  if (!iceId || subroutine.type !== "initiate_trace") return subroutine;
  const instance = state.cardInstances[iceId];
  const variableRez = cardImplementationForDefinitionId(instance?.definitionId ?? "")
    ?.variableRez;
  const variableIceState = instance?.variableIceState;
  if (variableRez?.kind !== "x_strength" || variableIceState?.family !== "x_strength")
    return subroutine;
  const value = Math.max(0, Math.floor(variableIceState.value));
  return {
    ...subroutine,
    ...(variableRez.traceBaseFromValue ? { baseTraceStrength: value } : {}),
    ...(variableRez.traceBidLimitFromValue ? { traceBidLimit: value } : {}),
  };
}

function relativeDamageSubroutineForCurrentEncounter(
  state: GameState,
  iceId: CardInstanceId | undefined,
  subroutine: NonNullable<CardDefinition["subroutines"]>[number],
): NonNullable<CardDefinition["subroutines"]>[number] {
  if (!iceId || subroutine.type !== "do_damage") return subroutine;
  const relativeIce =
    cardImplementationForDefinitionId(definitionFor(state, iceId).id)?.relativeIce;
  const dynamicDamage = relativeIce?.dynamicDamageSubroutine;
  if (!dynamicDamage || dynamicDamage.subroutineId !== subroutine.id)
    return subroutine;
  return {
    ...subroutine,
    amount:
      rezzedIceOutsideThisIceCount(state, iceId) *
      dynamicDamage.amountPerCount,
  };
}

function relativeTraceSubroutinesForCurrentEncounter(
  state: GameState,
  iceId: CardInstanceId,
): NonNullable<CardDefinition["subroutines"]> {
  const definition = definitionFor(state, iceId);
  const dynamicTrace =
    cardImplementationForDefinitionId(definition.id)?.relativeIce
      ?.dynamicTraceSubroutines;
  if (!dynamicTrace) return [];
  const count = rezzedIceOutsideThisIceCount(state, iceId);
  return Array.from({ length: count }, (_, index) => ({
    id: `relative_ice_outside_${definition.id}.trace.${index + 1}`,
    type: "initiate_trace",
    baseTraceStrength: dynamicTrace.baseTraceStrength,
    traceSuccessEffect: dynamicTrace.traceSuccessEffect,
  }));
}

function runCardImplementationActionHost(state: GameState) {
  return {
    state,
    cards: {
      cardInstanceFor: (cardId: CardInstanceId) => state.cardInstances[cardId],
      definitionFor: (cardId: CardInstanceId) => definitionFor(state, cardId),
      runnerInstalledCardIds: () => runnerInstalledCardIds(state),
      cardImplementationForDefinitionId: (definitionId: string) =>
        cardImplementationForDefinitionId(definitionId as CardDefinitionId),
    },
    actions: {
      buildLegalAction: (
        type: LegalAction["type"],
        label: string,
        source: LegalAction["source"],
        costs?: LegalAction["costs"],
        payload?: LegalAction["payload"],
      ) => action(state, "runner", type, label, source, costs, payload),
    },
    runtime: {
      pushActivatedActionsForTiming: (
        actions: LegalAction[],
        side: Side,
        sourceCardId: CardInstanceId,
        definition: CardDefinition,
        timing: ActivatedCardAbilityImplementation["timing"],
      ) =>
        pushActivatedCardImplementationActionsForTiming(
          cardImplementationRuntimeDeps,
          state,
          actions,
          side,
          sourceCardId,
          definition,
          timing,
        ),
    },
  };
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

function turnBasicExecutionHost(state: GameState): TurnBasicExecutionHost {
  return {
    state,
    draw: {
      drawCorpCard,
      drawRunnerCards,
      applyRunnerDrawSummaryPayload,
    },
    turn: {
      spendClick,
      spendClicks,
      endTurn,
    },
    credits: {
      spendRunnerTagRemovalCredits,
    },
    cards: {
      trashRunnerInstalledCardToHeap,
    },
    callbacks: {
      startCodeViralCachePurgeChoice,
    },
  };
}

function creditEconomyExecutionHost(
  state: GameState,
): CreditEconomyExecutionHost {
  return {
    state,
    actions: {
      spendClick,
    },
    cards: {
      definitionFor,
      mustInstance,
      publicServerLabelForCard,
      hasCardImplementationForDefinition: (definitionId) =>
        Boolean(cardImplementationForDefinitionId(definitionId)),
      hasCorpUtilityKind,
      uniqueDirectLongtailImplementationForCard,
    },
    credits: {
      gain: credits,
      spend: spendCredits,
    },
    counters: {
      cardCounter,
      addCardCounter,
      spendCardCounter,
      visibleVirusCounterTargetIds,
    },
    runner: {
      installedCardIds: runnerInstalledCardIds,
      trashInstalledCardToHeap: trashRunnerInstalledCardToHeap,
      forfeitAgendaForPointCost: forfeitRunnerAgendaForPointCost,
      drawCards: drawRunnerCards,
      applyDrawSummaryPayload: applyRunnerDrawSummaryPayload,
      ensureTurnFlags: ensureRunnerTurnFlags,
    },
    corp: {
      rezzedRootCardIds: rezzedCorpRootCardIds,
      installedCardIds: corpInstalledCardIds,
      publicInstalledCardIdentityKnown: publicInstalledCorpCardIdentityKnown,
      uninstallInstalledCardToHq: uninstallCorpInstalledCardToHq,
      trashInstalledCardToArchives: trashCorpInstalledCardToArchives,
    },
    hiddenZone: {
      resolveV1911RunnerHiddenZoneAbility,
      resolveV1911CorporateDownsizing,
      revealRunnerStackTop,
      revealCorpRdTop,
      resolveReschedulerHqShuffleDraw: (
        stateForAction,
        legalAction,
        sourceCardId,
      ) =>
        resolveReschedulerHqShuffleDraw(
          corpZoneChoiceHandlerHost(stateForAction, legalAction),
          sourceCardId,
        ),
      startCorpAssetRdTopReorderChoice: (
        stateForAction,
        legalAction,
        sourceCardId,
      ) =>
        startCorpAssetRdTopReorderChoice(
          hiddenZoneArrangeChoiceHandlerHost(stateForAction, legalAction),
          sourceCardId,
        ),
    },
    delegates: {
      shouldOpenInvestmentFirmCreditChoice,
      startInvestmentFirmCreditChoice,
      resolveCorpInstalledEconomyAction,
      handleTraceOrchestrationAction: (legalAction) =>
        handleTraceOrchestrationAction(
          traceOrchestrationHost(state),
          legalAction,
        ),
      handleCorpSpecialDamageAbilityAction: (legalAction) =>
        handleCorpSpecialDamageAbilityAction(
          corpSpecialDamageAbilityHost(state, legalAction),
        ),
      handleScoredAgendaActivatedAbilityAction: (legalAction) =>
        handleScoredAgendaActivatedAbilityAction(
          scoredAgendaAbilityHost(state, legalAction),
        ),
    },
    random: {
      nextRandom,
    },
    constants: {
      COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID,
      CORP_HQ_SHUFFLE_DRAW_CARD_ID,
      HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS,
      HIDDEN_ZONE_REORDER_ASSET_CARD_IDS,
      COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID,
      DISINFECTANT_VIRUS_COUNTER_ASSET_ID,
      COUNTER_UPGRADE_CARD_IDS,
      TAG_CONDITION_UPGRADE_CARD_IDS,
      COUNTER_ASSET_CARD_IDS,
      INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID,
      ACTION_ASSET_CARD_IDS,
      RUNNER_RANDOM_PROGRAM_CARD_IDS,
      QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID,
      FAIT_ACCOMPLI_COUNTER_PROGRAM_ID,
    },
  };
}

function runnerSpecialTriggerExecutionHost(
  state: GameState,
): RunnerSpecialTriggerExecutionHost {
  return {
    state,
    actions: {
      spendClick,
    },
    cards: {
      definitionFor,
      mustInstance,
      isUniqueCard,
      hasInstalledUniqueCardDefinition,
      hasCardImplementationMemoryUnitModifier,
      shouldLoadLegacyRecurringCredits,
      publicTitle: publicCardTitle,
    },
    credits: {
      spend: spendCredits,
    },
    counters: {
      cardCounter,
      setCardCounter,
      addCardCounter,
      spendCardCounter,
    },
    zones: {
      removeFromAllZones,
      ensureSpecialZones,
      trashRunnerInstalledCardToHeap,
    },
    runner: {
      runnerMemoryLimit,
    },
    hiddenZone: {
      startSelfModifyingCodeStackActivation: (sourceCardId, legalAction) =>
        startSelfModifyingCodeStackActivation(
          hiddenZoneSearchActivationHandlerHost(state, legalAction),
          sourceCardId,
        ),
    },
    constants: {
      BUTCHER_BOY_ID,
      JUNKYARD_BBS_ID,
      SELF_MODIFYING_CODE_ID,
      SHELL_TRADERS_ID,
      SKIVVISS_ID,
    },
  };
}

function runFortTriggerExecutionHost(
  state: GameState,
): RunFortTriggerExecutionHost {
  return {
    state,
    actions: {
      spendClick,
    },
    cards: {
      definitionFor,
      mustInstance,
    },
    zones: {
      removeFromAllZones,
    },
    run: {
      resolveSuccessfulRunFollowupAbility: (legalAction) =>
        resolveSuccessfulRunFollowupAbility(
          successfulRunInterventionHost(state),
          legalAction,
        ),
      resolveFullyBrokenPassedIceDerezAndEndRun: (legalAction) =>
        resolveFullyBrokenPassedIceDerezAndEndRunInRunModule(
          encounterSpecialWindowHostForState(state),
          legalAction,
        ),
      resolveStartupImmolatorTrashIce: (legalAction) =>
        resolveStartupImmolatorTrashIceInRunModule(
          encounterSpecialWindowHostForState(state),
          legalAction,
        ),
      resolveFortPassAdvancementWindow: (legalAction) =>
        resolveFortPassAdvancementWindow(
          fortPassWindowHostForState(state),
          legalAction,
        ),
      resolveStartRunIceRepositionWindow: (legalAction) =>
        resolveStartRunIceRepositionWindow(
          fortPassWindowHostForState(state),
          legalAction,
        ),
      resolveApproachIceExposeAbility: (legalAction) =>
        resolveApproachIceExposeAbility(
          encounterEntryHostForState(state),
          legalAction,
        ),
      resolveApproachIceExposeViewingDecision: (legalAction) =>
        resolveApproachIceExposeViewingDecision(
          encounterEntryHostForState(state),
          legalAction,
        ),
      startSingaporeCityGridSwapChoice: (legalAction) =>
        startSingaporeCityGridSwapChoice(
          fortPassWindowHostForState(state),
          legalAction,
        ),
    },
    constants: {
      MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
    },
  };
}

function counterUtilityTriggerExecutionHost(
  state: GameState,
): CounterUtilityTriggerExecutionHost {
  return {
    state,
    actions: {
      spendClick,
      spendClicks,
    },
    cards: {
      definitionFor,
      runnerUtilityLongtailKindForCard,
    },
    credits: {
      spend: spendCredits,
    },
    counters: {
      cardCounter,
      spendCardCounter,
      spyCountersForServer,
      traceCounterEffectDefinitionFor,
    },
    runner: {
      ensureTurnFlags: ensureRunnerTurnFlags,
      trashInstalledCardToHeap: trashRunnerInstalledCardToHeap,
    },
    servers: {
      mustServer,
      publicServerLabel,
    },
    dataFort: {
      newDataFortCreationLockForSource,
    },
  };
}

function triggerAbilityExecutionHost(
  state: GameState,
): TriggerAbilityExecutionHost {
  return {
    state,
    actions: {
      spendClick,
    },
    cards: {
      definitionFor,
      remainingReplacementLongtailKindForCard,
      cardImplementationForDefinitionId: (definitionId) =>
        cardImplementationForDefinitionId(definitionId as CardDefinitionId),
    },
    credits: {
      spend: spendCredits,
    },
    runner: {
      trashInstalledCardToHeap: trashRunnerInstalledCardToHeap,
      ensureTurnFlags: ensureRunnerTurnFlags,
    },
    corp: {
      acmeSavingsAndLoanObligationCount,
      removeAcmeSavingsAndLoanObligation,
    },
    runnerSpecial: {
      handleRunnerSpecialTriggerExecution: (legalAction) =>
        handleRunnerSpecialTriggerExecution(
          runnerSpecialTriggerExecutionHost(state),
          legalAction,
        ),
    },
    runFort: {
      handleRunFortTriggerExecution: (legalAction) =>
        handleRunFortTriggerExecution(
          runFortTriggerExecutionHost(state),
          legalAction,
        ),
    },
    counterUtility: {
      handleCounterUtilityTriggerExecution: (legalAction) =>
        handleCounterUtilityTriggerExecution(
          counterUtilityTriggerExecutionHost(state),
          legalAction,
        ),
    },
    hiddenZone: {
      handleHiddenZoneTriggerExecution: (legalAction) =>
        handleHiddenZoneTriggerExecution(
          hiddenZoneSearchActivationHandlerHost(state, legalAction),
          legalAction,
        ),
    },
    constants: {
      CODE_VIRAL_CACHE_ID,
    },
  };
}

function installCardHost(state: GameState): InstallCardHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      isUniqueCard,
      hasInstalledUniqueCardDefinition: (side, definitionId) =>
        hasInstalledUniqueCardDefinition(state, side, definitionId),
      cardHasSubtype,
      isRunnerHardwareDeckDefinition,
      hasCardImplementationMemoryUnitModifier,
      shouldLoadLegacyRecurringCredits,
      damagePreventionSourcesForDefinition,
      cardImplementationAgendaPointInstallCost,
    },
    servers: {
      assertCorpCanCreateNewDataFort: () => assertCorpCanCreateNewDataFort(state),
      mustServer: (serverId) => mustServer(state, serverId),
      createRemote: () => createRemote(state),
      serverChoiceDisplayLabel: (serverId) =>
        serverChoiceDisplayLabel(state, serverId),
      canInstallCorpRootCardInServer: (definition, server) =>
        canInstallCorpRootCardInServer(state, definition, server),
      corpRootAgendaOrNodeCapacityInServer: (server) =>
        corpRootAgendaOrNodeCapacityInServer(state, server),
      corpRootAssetIdsInServer: (server) =>
        corpRootAssetIdsInServer(state, server),
      corpRootMainCardIdsInServer: (server) =>
        corpRootMainCardIdsInServer(state, server),
      rootInstallRezzesOnInstall,
      trashOlderRegionUpgradesInServer: (server, keepCardId, legalAction) =>
        trashOlderRegionUpgradesInServer(state, server, keepCardId, legalAction),
      markRovingSubmarineActivityForServer: (serverId, legalAction) =>
        markRovingSubmarineActivityForServer(
          fortRunSideFamiliesHostForState(state),
          serverId,
          legalAction,
        ),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      trashRunnerInstalledCardToHeap: (cardId) =>
        trashRunnerInstalledCardToHeap(state, cardId),
      trashCorpInstalledCardToArchives: (cardId, legalAction) =>
        trashCorpInstalledCardToArchives(state, cardId, legalAction),
    },
    runner: {
      ensureTurnFlags: () => ensureRunnerTurnFlags(state),
      requiresDataFortInstallTarget,
      startRunnerProgramTrashBeforeInstallChoice: (cardId) =>
        startRunnerProgramTrashBeforeInstallChoice(state, cardId),
      forfeitRunnerAgendaForPointCost: (cardId) =>
        forfeitRunnerAgendaForPointCost(state, cardId),
      consumeValuPakProgramInstallAction: (legalAction) =>
        consumeValuPakProgramInstallAction(state, legalAction),
      startRunnerHostingChoice: (cardId, legalAction) =>
        startRunnerHostingChoice(state, cardId, legalAction),
      hiddenRunnerResourceSlotId,
    },
    corp: {
      expireCorporateRetreatInstallCreditAbilities: () =>
        expireCorporateRetreatInstallCreditAbilities(state),
      consumeEdgerunnerTempsInstallAction: (legalAction) =>
        consumeEdgerunnerTempsInstallAction(state, legalAction),
      isRegionUpgrade,
      isParisTracePoolSource: (cardId) =>
        isParisTracePoolSource(fortRunSideFamiliesHostForState(state), cardId),
      parisTracePoolCapacityForCard: (cardId) =>
        parisTracePoolCapacityForCard(
          fortRunSideFamiliesHostForState(state),
          cardId,
        ),
    },
    hosting: {
      canHostProgramOnDaemon: (hostCardId, definition) =>
        canHostProgramOnDaemon(state, hostCardId, definition),
      canOverlayProgramOnZetatechSoftwareInstaller: (hostCardId, definition) =>
        canOverlayProgramOnZetatechSoftwareInstaller(
          state,
          hostCardId,
          definition,
        ),
      hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
    },
    payment: {
      assertCorpIceInstallCostValid: (cardId, definition, legalAction) =>
        assertCorpIceInstallCostValid(state, cardId, definition, legalAction),
      spendClick: (side) => spendClick(state, side),
      spendRunnerInstallCredits: (amount, cardType) =>
        spendRunnerInstallCredits(state, amount, cardType),
      spendCredits: (side, amount) => spendCredits(state, side, amount),
      rezCostForCard: (cardId) => rezCostForCard(state, cardId),
    },
    counters: {
      setCardCounter: (cardId, counterType, amount) =>
        setCardCounter(state, cardId, counterType as CounterType, amount),
      addCardCounter: (cardId, counterType, amount) =>
        addCardCounter(state, cardId, counterType as CounterType, amount),
      rollDeterministicDie: (purpose) => rollDeterministicDie(state, purpose),
    },
    lifecycle: {
      executeOnInstall: (legalAction, definition, cardId) =>
        executeCardImplementationLifecycleEffects(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
          definition,
          cardId,
          "on_install",
        ),
    },
    constants: {
      PROTEUS_ARMAGEDDON_ID,
    },
  };
}

function rezCardHost(state: GameState): RezCardHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      hasCardImplementationForDefinition: (definitionId) =>
        Boolean(cardImplementationForDefinitionId(definitionId)),
      variableRezForDefinition,
      stableSubtypeList,
    },
    run: {
      mustRun: () => mustRun(state),
      handleRunRootRezPostRez: (cardId, legalAction) =>
        handleRunRootRezPostRez(
          runRezWindowHostForState(state),
          cardId,
          legalAction,
        ),
      beginEncounter: (cardId, legalAction) =>
        beginEncounter(encounterEntryHostForState(state), cardId, legalAction),
    },
    payment: {
      rezCostForCard: (cardId) => rezCostForCard(state, cardId),
      assertCorpRezCostQuoteValid: (cardId, legalAction) =>
        assertCorpRezCostQuoteValid(state, cardId, legalAction),
      creditCostForAction,
      spendCredits: (side, amount) => spendCredits(state, side, amount),
    },
    corp: {
      isAcmeSavingsAndLoanDefinition,
      spendCorpAgendaPointCost: (requiredPoints) =>
        spendCorpAgendaPointCost(state, requiredPoints),
      acmeSavingsAndLoanObligationCount: () =>
        acmeSavingsAndLoanObligationCount(state),
    },
    runner: {
      ensureTurnFlags: () => ensureRunnerTurnFlags(state),
    },
    counters: {
      setCardCounter: (cardId, counterType, amount) =>
        setCardCounter(state, cardId, counterType as CounterType, amount),
    },
    lifecycle: {
      executeOnRez: (legalAction, definition, cardId) =>
        executeCardImplementationLifecycleEffects(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
          definition,
          cardId,
          "on_rez",
        ),
    },
    fort: {
      isParisTracePoolSource: (cardId) =>
        isParisTracePoolSource(fortRunSideFamiliesHostForState(state), cardId),
      parisTracePoolCapacityForCard: (cardId) =>
        parisTracePoolCapacityForCard(
          fortRunSideFamiliesHostForState(state),
          cardId,
        ),
    },
    constants: {
      KRUMZ_TRACE_ASSET_CARD_ID,
    },
  };
}

function traceOrchestrationHost(state: GameState): TraceOrchestrationHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      runnerInstalledCardIds: () => runnerInstalledCardIds(state),
      hasCardImplementationForDefinition: (definitionId) =>
        Boolean(cardImplementationForDefinitionId(definitionId)),
      activatedTraceAbilities: (definition, timing) =>
        cardImplementationForDefinitionId(definition.id)?.abilities
          ?.map((ability, index) => ({ ability, index }))
          .filter(
            (
              entry,
            ): entry is {
              ability: ActivatedCardAbilityImplementation;
              index: number;
            } =>
              entry.ability.kind === "activated" &&
              entry.ability.timing === timing,
          ) ?? [],
      isSubmarineUplinkSource: (cardId) =>
        isSubmarineUplinkSource(state, cardId),
    },
    payment: {
      corpTracePaymentDeps,
      runnerTracePaymentDeps,
      runnerTraceLinkCreditSourceIds: () =>
        runnerTracePaymentDeps.runnerTraceLinkCreditSourceIds(state),
      hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
      spendRunnerCredits: (amount) => spendCredits(state, "runner", amount),
    },
    runner: {
      identityModifierAmount: (side, kind, duration) =>
        identityModifierAmount(state, side, kind, duration),
    },
    corp: {
      rezzedCorpRootCardIds: () => rezzedCorpRootCardIds(state),
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        cardCounter(state, cardId, counterType as CounterType),
      hackerTrackerCounterTotal: () => hackerTrackerCounterTotal(state),
      krumzTraceBitTotal: () => krumzTraceBitTotal(state),
    },
    fort: {
      parisCityGridTracePoolSource: () =>
        parisCityGridTracePoolSource(fortRunSideFamiliesHostForState(state)),
    },
    run: {
      markSubmarineUplinkJackOutAfterEncounter: (cardId, legalAction) =>
        markSubmarineUplinkJackOutAfterEncounter(
          encounterSpecialWindowHostForState(state),
          cardId,
          legalAction,
        ),
      applyPrintedTraceSuccessFollowups: (options) =>
        applyPrintedTraceSuccessFollowups(
          encounterPrintedEffectHostForState(state, options.legalAction),
          options,
        ),
    },
    trace: {
      supportsTraceSuccessEffect: (effect) =>
        isSupportedEncounterTraceSuccessEffect(
          effect,
          traceCounterEffectDefinitionFor,
        ),
    },
    callbacks: {
      sanitizeId,
    },
    constants: {
      PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
    },
  };
}

function activatedCardImplementationExecutionHost(
  state: GameState,
  legalAction: LegalAction,
) {
  return {
    state,
    action: { legalAction },
    callbacks: {
      handleCorpTraceDamageActivatedAbility: (actionToResolve: LegalAction) =>
        handleCorpTraceDamageActivatedAbility(
          corpTraceDamageAbilityHost(state, actionToResolve),
        ).handled,
      handleScoredAgendaActivatedAbilityAction: (actionToResolve: LegalAction) =>
        handleScoredAgendaActivatedAbilityAction(
          scoredAgendaAbilityHost(state, actionToResolve),
        ).handled,
      resolveActivatedCardImplementationAbility: (actionToResolve: LegalAction) =>
        resolveActivatedCardImplementationAbility(
          cardImplementationRuntimeDeps,
          state,
          actionToResolve,
        ),
    },
  };
}

function resolveRunnerTargetedEventImplementation(
  state: GameState,
  definition: CardDefinition,
  legalAction: LegalAction,
): boolean {
  const effect =
    cardImplementationForDefinitionId(definition.id)?.runnerEventTargetedEffect;
  if (effect?.kind !== "add_strength_counter_to_installed_icebreaker")
    return false;
  const targetCardId = String(legalAction.payload?.targetCardId ?? "") as CardInstanceId;
  if (!state.runner.rig.programs.includes(targetCardId))
    throw new Error("Das Ziel-Icebreaker-Programm ist nicht installiert.");
  const targetDefinition = definitionFor(state, targetCardId);
  if (!cardHasSubtype(targetDefinition, "icebreaker"))
    throw new Error("Das Ziel ist kein Icebreaker.");
  addCardCounter(state, targetCardId, effect.counterType, effect.amount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    targetDefinitionId: targetDefinition.id,
    counterType: effect.counterType,
    counterAmountAdded: effect.amount,
    remainingCounters: cardCounter(state, targetCardId, effect.counterType),
  };
  return true;
}

function resolvePostOnPlayGenericFollowups(
  state: GameState,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  const effects = onPlayCardImplementationEffects(definition);
  const remoteDetonatorEffect = effects.find(
    (effect) =>
      effect.kind ===
      "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
  );
  if (remoteDetonatorEffect) {
    const tagAmount = remoteDetonatorEffect.tagAmount;
    if (!Number.isInteger(tagAmount) || tagAmount <= 0)
      throw new Error("Remote-Detonator-Tagmenge ist ungueltig.");
    const serverId = state.runnerTurnFlags?.lastSuccessfulRunServerId;
    if (!serverId)
      throw new Error("Es gibt keinen erfolgreichen Run-Fort in diesem Zug.");
    const server = mustServer(state, serverId);
    const trashedDefinitionIds: CardDefinitionId[] = [];
    for (const iceId of server.ice.slice()) {
      if (mustInstance(state.cardInstances, iceId).rezzed !== true) continue;
      trashedDefinitionIds.push(definitionFor(state, iceId).id);
      trashCorpInstalledCardToArchives(state, iceId, legalAction);
    }
    state.runner.tags += tagAmount;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      remoteDetonatorResolved: true,
      serverId,
      trashedRezzedIceCount: trashedDefinitionIds.length,
      trashedCount: trashedDefinitionIds.length,
      ...(trashedDefinitionIds.length > 0
        ? { trashedCardDefinitionIds: trashedDefinitionIds.sort().join(",") }
        : {}),
      tagsAdded: tagAmount,
      runnerTagsAfter: state.runner.tags,
    };
  }
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
  executeInstallCard(installCardHost(state), legalAction);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    sourceDefinitionId: definition.id,
    installed: true,
    memoryUsedAfter: state.runner.memoryUsed,
    memoryLimitAfter: runnerMemoryLimit(state),
  };
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

function startRun(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
  pendingSuccessBonusCredits?: number,
  accessCount = 1,
  options?: StartRunOptions,
  legalAction?: LegalAction,
): void {
  runFlow.startRun(
    state,
    serverId,
    pendingSuccessBonusCredits,
    accessCount,
    options,
    legalAction,
  );
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
  if (counterType === "doppelganger_antibody") return "Doppelganger-Counter";
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

function returnRunnerInstalledProgramsToGripForAccess(
  state: GameState,
  cardIds: readonly CardInstanceId[],
): { publicPayload: Record<string, string | number | boolean> } {
  let daemonHostedTrashCount = 0;
  const returnedDefinitionIds: string[] = [];
  for (const cardId of cardIds) {
    if (!state.runner.rig.programs.includes(cardId)) continue;
    if (definitionFor(state, cardId).type !== "program") continue;
    const hostedIds = hostedCardsOn(state, cardId);
    for (const hostedId of hostedIds) {
      if (!state.runner.rig.programs.includes(hostedId)) continue;
      trashRunnerInstalledCardToHeap(state, hostedId);
      daemonHostedTrashCount += 1;
    }
    returnedDefinitionIds.push(definitionFor(state, cardId).id);
    returnRunnerInstalledCardToGrip(state, cardId);
  }
  return {
    publicPayload: {
      returnedProgramCount: returnedDefinitionIds.length,
      returnedProgramDefinitionIds: returnedDefinitionIds.join(","),
      daemonHostedTrashCount,
      runnerGripAfter: state.runner.grip.length,
    },
  };
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
    ...withoutVariableIceState(withoutHost),
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

function finishRun(
  state: GameState,
  successful: boolean,
  legalAction?: LegalAction,
): void {
  handleRunEndCleanup(runEndCleanupHost(state), successful, legalAction);
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
    flags.trashedNodeLastTurn = flags.trashedNodeThisTurn === true;
    flags.trashedNodeThisTurn = false;
    flags.trashedAdvertisementThisTurn = false;
    flags.trashedTransactionsThisTurn = false;
    flags.prearrangedDropPending = false;
    flags.installedResourceIdsLastTurn = (
      flags.installedResourceIdsThisTurn ?? []
    ).slice();
    flags.installedResourceIdsThisTurn = [];
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

function automaticLoseCreditsEffect(
  effectId: string,
  side: Side,
  amount: number,
  sourceDefinitionId: CardDefinitionId,
): ResolvedGameEffect {
  return {
    effectId,
    kind: "lose_credits",
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
  clearRovingSubmarineActivityMarkers(fortRunSideFamiliesHostForState(state));
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
  flags.trashedAdvertisementThisTurn = false;
  flags.trashedTransactionsThisTurn = false;
  flags.prearrangedDropPending = false;
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
  untapRunnerCardsAtTurnStart(state);
  applyRunnerStartOfTurnEffects(state, effects);
}

function untapRunnerCardsAtTurnStart(state: GameState): void {
  for (const cardId of runnerInstalledCardIds(state)) {
    const instance = state.cardInstances[cardId];
    if (!instance?.tapped) continue;
    state.cardInstances[cardId] = { ...instance, tapped: false };
  }
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
  applyProteusPurgeableRunnerVirusCorpStartEffects(state, effects);
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
    if (isParisTracePoolSource(fortRunSideFamiliesHostForState(state), cardId)) {
      const capacity = parisTracePoolCapacityForCard(
        fortRunSideFamiliesHostForState(state),
        cardId,
      );
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

function applyProteusPurgeableRunnerVirusCorpStartEffects(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const corpCounters = state.purgeableRunnerVirusCounters?.corp;
  const scaldanCounters = purgeableRunnerVirusCounterAmount(
    corpCounters,
    "scaldan",
  );
  for (let index = 0; index < scaldanCounters; index += 1) {
    const randomPurpose = `proteus.scaldan.corp_start.${state.stateVersion}.${index}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    const badPublicityAdded = dieRoll >= 5 ? 1 : 0;
    if (badPublicityAdded > 0) state.corp.badPublicity += badPublicityAdded;
    effects?.push({
      effectId: `corp.start.proteus.scaldan.${index}`,
      kind: badPublicityAdded > 0 ? "add_bad_publicity" : "counter_change",
      visibility: "public",
      side: "corp",
      amount: badPublicityAdded,
      reason: "start_of_turn",
      counterType: "scaldan",
      remainingCounters: scaldanCounters,
      sourceDefinitionId: PROTEUS_SCALDAN_ID,
      sourceTitle: publicCardTitle(PROTEUS_SCALDAN_ID),
      randomPurpose,
      dieSize: 6,
      dieRoll,
      randomCounterAfter: state.randomCounter,
      ...(badPublicityAdded > 0
        ? {
            badPublicityAdded,
            corpBadPublicityAfter: state.corp.badPublicity,
          }
        : {}),
    } as ResolvedGameEffect);
  }
  const taxCounters = purgeableRunnerVirusCounterAmount(corpCounters, "tax");
  const taxLoss = Math.min(state.corp.credits, Math.floor(taxCounters / 2));
  if (taxLoss > 0) {
    state.corp.credits -= taxLoss;
    effects?.push(
      automaticLoseCreditsEffect(
        "corp.start.proteus.taxman",
        "corp",
        taxLoss,
        PROTEUS_TAXMAN_ID,
      ),
    );
  }

  const pipeCounters = purgeableRunnerVirusCounterAmount(corpCounters, "pipe");
  if (pipeCounters <= 0) return;
  addCorpActionDebt(state, {
    amount: pipeCounters,
    reason: "pipe_counter",
    source: "start_of_turn_effect",
  });
  effects?.push({
    effectId: "corp.start.proteus.viral_pipeline.pipe",
    kind: "counter_change",
    visibility: "public",
    side: "corp",
    amount: pipeCounters,
    reason: "start_of_turn",
    counterType: "pipe",
    remainingCounters: pipeCounters,
    sourceDefinitionId: PROTEUS_VIRAL_PIPELINE_ID,
    sourceTitle: publicCardTitle(PROTEUS_VIRAL_PIPELINE_ID),
  });
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
    const amount = counterCount * counterEffect.startOfRunnerTurn.amountPerCounter;
    if (counterEffect.startOfRunnerTurn.kind === "add_tags") {
      state.runner.tags += amount;
      effects?.push(
        automaticTagEffect(
          `runner.start.${counterEffect.counterType}`,
          amount,
          counterEffect.sourceDefinitionId,
        ),
      );
    }
    if (counterEffect.startOfRunnerTurn.kind === "lose_credits") {
      const lost = Math.min(state.runner.credits, amount);
      state.runner.credits -= lost;
      effects?.push(
        automaticLoseCreditsEffect(
          `runner.start.${counterEffect.counterType}`,
          "runner",
          lost,
          counterEffect.sourceDefinitionId,
        ),
      );
    }
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
  applyShellTradersStartOfTurn(
    runnerSpecialTriggerExecutionHost(state),
    effects,
  );
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
      questForCattekinOutcome:
        dieRoll === 6
          ? "permanent_action"
          : dieRoll === 1
            ? "core_damage"
            : dieRoll === 2
              ? "net_damage"
              : "no_effect",
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

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, "_").slice(0, 80);
}

function requireRunnerTagged(state: GameState): void {
  if (state.runner.tags <= 0) throw new Error("Der Runner ist nicht getaggt.");
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

function runnerRunAttemptsThisGame(state: GameState): number {
  return Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runAttemptsThisGame ?? 0),
  );
}

function runnerTrashedNodeLastTurn(state: GameState): boolean {
  return state.runnerTurnFlags?.trashedNodeLastTurn === true;
}

function runnerLastTurnInstalledResourceIds(state: GameState): CardInstanceId[] {
  return (state.runnerTurnFlags?.installedResourceIdsLastTurn ?? [])
    .filter((cardId) => state.runner.rig.resources.includes(cardId))
    .sort();
}

function resolveRunnerLastTurnInstalledResourceTargetId(
  state: GameState,
  targetRef: string,
): CardInstanceId | undefined {
  const eligible = runnerLastTurnInstalledResourceIds(state);
  if (eligible.includes(targetRef as CardInstanceId))
    return targetRef as CardInstanceId;
  const hiddenResourceId = resolveHiddenRunnerResourceSlot(state, targetRef);
  return hiddenResourceId && eligible.includes(hiddenResourceId)
    ? hiddenResourceId
    : undefined;
}

function runnerInstalledResourceLastTurn(state: GameState): boolean {
  return runnerLastTurnInstalledResourceIds(state).length > 0;
}

function recordRunnerActionSpent(state: GameState, amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0) return;
  const flags = ensureRunnerTurnFlags(state);
  flags.runnerActionsTakenThisTurn =
    Math.max(0, Math.floor(flags.runnerActionsTakenThisTurn ?? 0)) + amount;
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
        resolveCorpRootRezEffect(runRezWindowHostForState(state), cardId);
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
  return accessFlow.runnerAccessActionHost(state);
}

function runnerEncounterActionHostForState(
  state: GameState,
): RunnerEncounterActionHost {
  return runFlow.runnerEncounterActionHostForState(state);
}

function runMovementHostForState(state: GameState): RunMovementHost {
  return runFlow.runMovementHostForState(state);
}

function runRezWindowHostForState(state: GameState): RunRezWindowHost {
  return runFlow.runRezWindowHostForState(state);
}

function fortPassWindowHostForState(state: GameState): FortPassWindowHost {
  return runFlow.fortPassWindowHostForState(state);
}

function fortRunSideFamiliesHostForState(
  state: GameState,
): FortRunSideFamiliesHost {
  return runFlow.fortRunSideFamiliesHostForState(state);
}

function encounterEntryHostForState(state: GameState): EncounterEntryHost {
  return runFlow.encounterEntryHostForState(state);}

function successfulRunInterventionHost(
  state: GameState,
): SuccessfulRunInterventionHost {
  return runFlow.successfulRunInterventionHost(state);
}

function encounterResolutionHostForState(state: GameState): EncounterResolutionHost {
  return runFlow.encounterResolutionHostForState(state);
}

function encounterSpecialWindowHostForState(
  state: GameState,
): EncounterSpecialWindowHost {
  return runFlow.encounterSpecialWindowHostForState(state);
}

function encounterPrintedEffectHostForState(
  state: GameState,
  legalAction?: LegalAction,
): EncounterPrintedEffectHost {
  return runFlow.encounterPrintedEffectHostForState(state, legalAction);
}

function encounterPrintedNonTraceHostForState(
  state: GameState,
  legalAction?: LegalAction,
): EncounterPrintedNonTraceHost {
  return runFlow.encounterPrintedNonTraceHostForState(state, legalAction);
}

function runEndCleanupHost(state: GameState): RunEndCleanupHost {
  return runFlow.runEndCleanupHost(state);
}

function runnerBreakerActionExecutionHost(
  state: GameState,
): RunnerBreakerActionExecutionHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
      effectiveSubtypesForCard: (cardId, definition) =>
        effectiveSubtypesForCard(state, cardId, definition),
    },
    run: {
      currentRun: () => mustRun(state),
      currentEncounterSubroutines: (iceDefinition) =>
        subroutinesForCurrentEncounter(state, iceDefinition),
      runRemainderStrengthBonusForBreaker,
      finishRun: (successful, legalAction) => finishRun(state, successful, legalAction),
    },
    breaker: {
      pumpAbilityForLegalAction: (legalAction) =>
        pumpAbilityForLegalAction(state, legalAction),
      pumpAmountForLegalAction: (legalAction) =>
        pumpAmountForLegalAction(state, legalAction),
      pumpDurationForLegalAction: (legalAction) =>
        pumpDurationForLegalAction(state, legalAction),
      breakAbilityForLegalAction: (legalAction) =>
        breakAbilityForLegalAction(state, legalAction),
      assertCurrentSubroutineMatchesLegalAction: (
        iceDefinition,
        subroutineIndex,
        legalAction,
      ) =>
        assertCurrentSubroutineMatchesLegalAction(
          state,
          iceDefinition,
          subroutineIndex,
          legalAction,
        ),
      assertBreakSubroutineCostQuoteValid: (
        breakerId,
        legalAction,
        subroutine,
      ) =>
        assertBreakSubroutineCostQuoteValid(
          state,
          breakerId,
          legalAction,
          subroutine,
        ),
      resolveMultiBreakSubroutinesAction: (breakerId, legalAction) =>
        resolveMultiBreakSubroutinesAction(state, breakerId, legalAction),
      resolveBlinkBreakSubroutineAction: (
        breakerId,
        subroutineIndex,
        legalAction,
      ) =>
        resolveBlinkBreakSubroutineAction(
          state,
          breakerId,
          subroutineIndex,
          legalAction,
        ),
    },
    payment: {
      spendRunnerRunCredits: (amount, breakerId) =>
        spendRunnerRunCredits(runDurationPaymentHost(state), amount, breakerId),
    },
    fort: {
      shouldOpenAardvarkInterception: (breakerId) =>
        shouldOpenAardvarkInterception(
          fortRunSideFamiliesHostForState(state),
          breakerId,
        ),
      startAardvarkInterceptionChoice: (breakerId, actionType, legalAction) =>
        startAardvarkInterceptionChoice(
          fortRunSideFamiliesHostForState(state),
          breakerId,
          actionType,
          legalAction,
        ),
      applyPostBreakStealthLoss: (breakerId, legalAction) =>
        applyPostBreakStealthLoss(
          fortRunSideFamiliesHostForState(state),
          breakerId,
          legalAction,
        ),
    },
    effects: {
      executeEffectCommands: (commands) => executeEffectCommands(state, commands),
      addRunnerFutureActionDebt: (amount) =>
        addRunnerFutureActionDebt(state, amount),
    },
    turn: {
      ensureRunnerTurnFlags: () => ensureRunnerTurnFlags(state),
    },
    tracking: {
      recordBartmossEncounterUsage: (breakerId) =>
        recordBartmossEncounterUsage(state, breakerId),
      recordDupreBreakUsage: (breakerId) =>
        recordDupreBreakUsage(runEndCleanupHost(state), breakerId),
      recordSnowballBreakUsage: (breakerId) =>
        recordSnowballBreakUsage(state, breakerId),
    },
  };
}

function startRunActionExecutionHost(
  state: GameState,
): StartRunActionExecutionHost {
  return {
    state,
    payment: {
      spendRunnerClick: () => spendClick(state, "runner"),
      payRunStartTaxCredits: (legalAction) =>
        payRunStartTaxCredits(runDurationPaymentHost(state), legalAction),
    },
    turn: {
      ensureRunnerTurnFlags: () => ensureRunnerTurnFlags(state),
    },
    run: {
      validateRovingSubmarineRunGate: (serverId) =>
        validateRovingSubmarineRunGate(
          fortRunSideFamiliesHostForState(state),
          serverId,
        ),
      startRun: (serverId, legalAction) =>
        startRun(state, serverId, undefined, 1, undefined, legalAction),
      activeWilsonSourceIds: () =>
        activeWilsonSourceIds(runDurationPaymentHost(state)),
    },
  };
}

function rezActionExecutionHost(state: GameState): RezActionExecutionHost {
  return {
    rez: {
      executeRezCard: (cardId, rootRez, legalAction) =>
        executeRezCard(rezCardHost(state), cardId, rootRez, legalAction),
      expireCorporateRetreatInstallCreditAbilities: () =>
        expireCorporateRetreatInstallCreditAbilities(state),
    },
    run: {
      passCorpRunRootRezWindow: (legalAction) =>
        passCorpRunRootRezWindow(runRezWindowHostForState(state), legalAction),
      passApproachedIce: () => passApproachedIce(runMovementHostForState(state)),
    },
  };
}

function playCardExecutionHost(state: GameState): PlayCardExecutionHost {
  const operationHost = corpOperationResolutionHost(state);
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
    },
    payment: {
      spendClick: (side) => spendClick(state, side),
      spendCredits: (side, amount) => spendCredits(state, side, amount),
    },
    events: {
      runnerEventResolver: (definition) =>
        cardImplementationRunnerEventResolver(definition) ??
        RUNNER_EVENT_RESOLVERS[definition.id],
    },
    operations: {
      canPlayCorpOperation: (definition) =>
        canPlayCorpOperation(operationHost, definition),
      resolveCorpOperation: (definition, legalAction) =>
        resolveCorpOperation(operationHost, definition, legalAction),
      resolveRunnerLastTurnInstalledResourceTargetId: (targetCardId) =>
        resolveRunnerLastTurnInstalledResourceTargetId(state, targetCardId),
    },
    cardImplementation: {
      canPlayPrintedCostOnPlay: (definition) =>
        canPlayPrintedCostOnPlayImplementation(
          cardImplementationRuntimeDeps,
          state,
          definition,
        ),
      executeOnPlayAbility: (legalAction, definition, cardId) =>
        executeOnPlayCardImplementationAbility(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
          definition,
          cardId,
        ),
      resolveRunnerTargetedEventImplementation: (definition, legalAction) =>
        resolveRunnerTargetedEventImplementation(state, definition, legalAction),
      resolvePostOnPlayGenericFollowups: (definition, legalAction) =>
        resolvePostOnPlayGenericFollowups(state, definition, legalAction),
      hasPrintedCostOnPlay: hasPrintedCostOnPlayCardImplementation,
      additionalOperationCost: onPlayCardImplementationAdditionalOperationCost,
      needsLastTurnResourceTarget:
        onPlayCardImplementationNeedsLastTurnResourceTarget,
    },
  };
}

function corpOperationResolutionHost(
  state: GameState,
): CorpOperationResolutionHost {
  return {
    state,
    actions: {
      buildLegalAction: action,
    },
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
      isCorpInstallableCardType,
    },
    corp: {
      drawCorpCard: () => drawCorpCard(state),
      ensureTurnFlags: () => ensureCorpTurnFlags(state),
      runnerStoleAgendaLastTurn: () => runnerStoleAgendaLastTurn(state),
      runnerStolenAgendaAdvancementCountersLastTurn: () =>
        runnerStolenAgendaAdvancementCountersLastTurn(state),
      swapCorpHqAndRdTop: () => swapCorpHqAndRdTop(state),
    },
    runner: {
      requireRunnerTagged: () => requireRunnerTagged(state),
      runnerLastTurnInstalledResourceIds: () =>
        runnerLastTurnInstalledResourceIds(state),
      isConcealedRunnerResource: (cardId) =>
        isConcealedRunnerResource(state, cardId),
      hiddenRunnerResourceSlotId,
    },
    economy: {
      gainCorpCredits: (amount) => credits(state, "corp", amount),
    },
    zones: {
      trashRunnerInstalledCardToHeap: (cardId) =>
        trashRunnerInstalledCardToHeap(state, cardId),
    },
    damage: {
      resolveDamageOperation: (legalAction, damageType, amount, sourceDefinitionId) =>
        resolveDamageOperation(
          state,
          legalAction,
          damageType,
          amount,
          sourceDefinitionId,
        ),
      addRunnerTagsWithPrevention: (legalAction, amount, source) =>
        addRunnerTagsWithPrevention(state, legalAction, amount, source),
    },
    hiddenZone: {
      startCorpArchivesToHqChoice: (legalAction, sourceCardId) =>
        startCorpArchivesToHqChoice(
          hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
          sourceCardId,
        ),
      startCorpRdTopReorderChoice: (legalAction, sourceCardId) =>
        startCorpRdTopReorderChoice(
          hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
          sourceCardId,
        ),
      resolveNewBloodConcealAndReorder: (legalAction) =>
        resolveNewBloodConcealAndReorder(
          hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
        ),
    },
    board: {
      installedAgendaOperationTarget: () => installedAgendaOperationTarget(state),
      advanceableInstalledCardTargets: () => advanceableInstalledCardTargets(state),
      advancementDistributionOptions: (amount, distribution) =>
        advancementDistributionOptions(state, amount, distribution as never),
      moveAdvancementOptions: (sourceCardId, source, maxAmount) =>
        moveAdvancementOptions(state, sourceCardId, source as never, maxAmount),
      resolveAgendaCounterOperation: (legalAction, sourceDefinitionId) =>
        resolveAgendaCounterOperation(state, legalAction, sourceDefinitionId),
      resolveManagementShakeUpOperation: (legalAction) =>
        resolveManagementShakeUpOperation(state, legalAction),
      resolveSystematicLayoffsAdvancementOperation: (legalAction) =>
        resolveSystematicLayoffsAdvancementOperation(state, legalAction),
    },
    operations: {
      powerGridOverloadEligibleHardwareIds: () =>
        powerGridOverloadEligibleHardwareIds(state),
      resolvePowerGridOverloadOperation: (legalAction) =>
        resolvePowerGridOverloadOperation(state, legalAction),
    },
    cardImplementation: {
      canPlayPrintedCostOnPlay: (definition) =>
        canPlayPrintedCostOnPlayImplementation(
          cardImplementationRuntimeDeps,
          state,
          definition,
        ),
      executeOnPlayAbility: (legalAction, definition, cardId) =>
        executeOnPlayCardImplementationAbility(
          cardImplementationRuntimeDeps,
          state,
          legalAction,
          definition,
          cardId,
        ),
    },
  };
}

function boardStateActionExecutionHost(
  state: GameState,
): BoardStateActionExecutionHost {
  return {
    state,
    cards: {
      definitionFor: (cardId) => definitionFor(state, cardId),
      cardInstanceFor: (cardId) => mustInstance(state.cardInstances, cardId),
    },
    zones: {
      removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      serverById: (serverId) => mustServer(state, serverId),
    },
    payment: {
      spendClick: (side) => spendClick(state, side),
      spendCredits: (side, amount) => spendCredits(state, side, amount),
    },
    runner: {
      resolveHiddenRunnerResourceSlot: (slotId) =>
        resolveHiddenRunnerResourceSlot(state, slotId),
      isConcealedRunnerResource: (cardId) =>
        isConcealedRunnerResource(state, cardId),
      hiddenRunnerResourceSlotId,
      trashInstalledCardToHeap: (cardId, legalAction) =>
        trashRunnerInstalledCardToHeap(state, cardId, legalAction),
    },
    fort: {
      markRovingSubmarineActivityForServer: (serverId, legalAction) =>
        markRovingSubmarineActivityForServer(
          fortRunSideFamiliesHostForState(state),
          serverId,
          legalAction,
        ),
    },
  };
}

function breachStateHost(state: GameState): BreachStateHost {
  return accessFlow.breachStateHost(state);
}

function accessFlowHost(state: GameState): AccessFlowHost {
  return accessFlow.accessFlowHost(state);
}

function runAccessTransitionHost(state: GameState): RunAccessTransitionHost {
  return runFlow.runAccessTransitionHost(state);
}

function accessEffectHandlerHost(
  state: GameState,
  legalAction?: LegalAction,
): AccessEffectHandlerHost {
  return accessFlow.accessEffectHandlerHost(state, legalAction);
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

function pendingChoiceResolutionHost(
  state: GameState,
): PendingChoiceResolutionHost {
  return {
    state,
    setup: {
      resolveSetupMulliganChoice,
      resolveDiscardChoice,
    },
    replacement: {
      resolveReplacementChoice,
      resolveEventModificationChoice,
    },
    trace: {
      resolveTraceChoice: (_state, actionToResolve, playerActionToResolve) =>
        resolveTraceChoice(
          traceOrchestrationHost(state),
          actionToResolve,
          playerActionToResolve,
        ),
    },
    hiddenZone: {
      handleHiddenZoneArrangeChoice,
      hiddenZoneArrangeChoiceHandlerHost,
      handleHiddenZoneNonSearchChoice,
      hiddenZoneNonSearchChoiceHandlerHost,
      handleCorpZoneChoice,
      corpZoneChoiceHandlerHost,
      isP358HiddenReplacementCompatibilityChoiceSource,
      resolveP358HiddenReplacementChoice,
      handleHiddenZoneSearchChoice,
      hiddenZoneSearchChoiceHandlerHost,
      resolveHuntClubBbsExposeChoice,
      resolveExposeInstalledCorpCardsChoice,
      resolveInvestmentFirmCreditChoice,
      resolveCrashEverettDrawChoice,
      resolvePowerGridOverloadChoice,
      resolveSystematicLayoffsAdvancementChoice,
      resolveAnonymousTipDerezBlackIceChoice,
      resolveCoreCommandJettisonIceChoice,
      resolveForgedActivationOrdersTargetChoice,
      resolveForgedActivationOrdersCorpChoice,
      resolveSecurityCodeWormChipTrashIceChoice,
      resolveV1921PlayfulAiChoice,
      resolveRunnerInstalledConnectionTrashBadPublicityChoice,
      resolveOpenEndedMileageProgramReturnChoice,
      resolveRunnerHostingChoice,
      resolveIncubatorTransformChoice,
      resolveCodeViralCachePurgeChoice,
      resolveChimeraDaemonTrashChoice,
      resolveProteusRunnerProgramReturnChoice,
      resolveRunnerPrivateLookChoice,
    },
    corp: {
      handleCorpInstallRezSequenceChoice,
      corpInstallRezSequenceHandlerHost,
      handleScoredAgendaFlowChoice,
      scoredAgendaFlowHost,
    },
    runner: {
      resolveRunnerProgramTrashBeforeInstallChoice,
    },
    run: {
      resolveSingaporeCityGridSwapChoice,
      fortPassWindowHostForState,
      resolveTooManyDoorsSecretSpendChoiceInRunModule,
      encounterSpecialWindowHostForState,
      resolveHammerStealthLossChoice,
      fortRunSideFamiliesHostForState,
      resolveViral15ProgramTrashChoiceInRunModule,
      encounterResolutionHostForState,
      resolvePassRezzedIceProgramTrashChoiceInRunModule,
      resolveSpeedTrapRezInterruptChoice,
      runRezWindowHostForState,
      resolvePattelsVirusCounterChoice,
      runEndCleanupHost,
      resolveAardvarkInterceptionChoice,
      resolveSuccessfulRunInterventionChoiceInRunModule,
      successfulRunInterventionHost,
    },
    access: {
      resolvePriorityWreckSpendChoice,
      runAccessTransitionHost,
      resolveMicrotechAiInterfacePreAccessChoice,
    },
    cardImplementation: {
      resolveCardImplementationAccessPaymentChoice,
      resolveCardImplementationAdvancementDistributionChoice,
      resolveCardImplementationMoveAdvancementChoice,
    },
    constants: {
      RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
    },
  };
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
    ...withoutVariableIceState(
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

function resolveProteusRunnerProgramReturnChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  resolveAccessInstalledRunnerProgramReturnChoice(
    accessEffectHandlerHost(state, legalAction),
    selectedChoiceIds(playerAction.selectedChoices),
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

const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE =
  "card_implementation.runner_installed_connection_trash_bad_publicity";
const RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION =
  "card_implementation_runner_installed_connection_trash_bad_publicity";

type TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation = Extract<
  CardRunnerEventLongtailImplementation,
  { kind: "trash_installed_runner_connections_then_add_bad_publicity" }
>;

function installedRunnerConnectionIds(state: GameState): CardInstanceId[] {
  return runnerInstalledCardIds(state).filter((cardId) => {
    const definition = definitionFor(state, cardId);
    return definition.type === "resource" && cardHasSubtype(definition, "connection");
  });
}

function canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
  state: GameState,
  implementation: TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation,
): boolean {
  return installedRunnerConnectionIds(state).length >= implementation.count;
}

function resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
  implementation: TrashInstalledRunnerConnectionsThenAddBadPublicityImplementation,
): void {
  if (
    implementation.kind !==
      "trash_installed_runner_connections_then_add_bad_publicity" ||
    implementation.count !== 2 ||
    implementation.badPublicity !== 1 ||
    implementation.visibility !== "hidden_info_barrier"
  )
    throw new Error("Runner-Connection-Trash-Implementation ist ungueltig.");
  if (
    !canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
      state,
      implementation,
    )
  )
    throw new Error("Es sind nicht genug installierte Connections vorhanden.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!sourceCardId || !state.runner.heap.includes(sourceCardId))
    throw new Error("Die Runner-Event-Quelle liegt nicht im Heap.");

  const eligible = installedRunnerConnectionIds(state).sort();
  const choiceStateVersion = state.stateVersion + 1;
  state.pendingChoice = {
    choiceId: `card_impl_runner_connection_trash_${choiceStateVersion}`,
    side: "runner",
    source: [
      RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE,
      sourceCardId,
      sourceDefinitionId,
      String(implementation.count),
      String(choiceStateVersion),
    ].join(":"),
    prompt: "Zwei installierte Connections trashen",
    kind: "select_cards",
    options: eligible.map((cardId) => ({
      id: `card_${cardId}`,
      label: definitionFor(state, cardId).title,
      value: cardId,
    })),
    minSelections: implementation.count,
    maxSelections: implementation.count,
    stateVersion: choiceStateVersion,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    sourceDefinitionId,
    requiredConnectionTrashCount: implementation.count,
    eligibleConnectionCount: eligible.length,
    installedConnectionTrashChoiceOpened: true,
  };
}

function parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(
  source: string,
): {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  count: number;
} {
  const [kind, sourceCardId = "", sourceDefinitionId = "", countRaw = ""] =
    source.split(":");
  if (kind !== RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE)
    throw new Error("Es ist keine Runner-Connection-Trash-Choice offen.");
  const count = Number(countRaw);
  if (!sourceCardId || !sourceDefinitionId || !Number.isInteger(count) || count <= 0)
    throw new Error("Die Runner-Connection-Trash-Choice ist ungueltig.");
  return {
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    count,
  };
}

function selectedChoiceCardIdsForChoice(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value as CardInstanceId;
  });
}

function resolveRunnerInstalledConnectionTrashBadPublicityChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith(
      `${RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_CHOICE_SOURCE}:`,
    )
  )
    throw new Error("Es ist keine Runner-Connection-Trash-Choice offen.");
  const { sourceCardId, sourceDefinitionId, count } =
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(choice.source);
  if (!state.runner.heap.includes(sourceCardId))
    throw new Error("Die Runner-Connection-Trash-Choice gehoert nicht zur gespielten Karte.");
  const sourceDefinition = definitionFor(state, sourceCardId);
  const implementation = runnerEventLongtailForDefinition(sourceDefinition);
  if (
    sourceDefinition.id !== sourceDefinitionId ||
    implementation?.kind !==
      "trash_installed_runner_connections_then_add_bad_publicity" ||
    implementation.count !== count
  )
    throw new Error("Die Runner-Connection-Trash-Choice gehoert nicht zur gespielten Karte.");

  const selectedIds = selectedChoiceCardIdsForChoice(choice, playerAction);
  if (selectedIds.length !== count || new Set(selectedIds).size !== selectedIds.length)
    throw new Error("Genau zwei unterschiedliche Connections muessen gewaehlt werden.");
  const eligible = new Set(installedRunnerConnectionIds(state));
  for (const cardId of selectedIds) {
    if (!eligible.has(cardId))
      throw new Error("Eine gewaehlte Karte ist keine installierte Connection.");
  }
  const trashedCardDefinitionIds = selectedIds.map(
    (cardId) => definitionFor(state, cardId).id,
  );

  delete state.pendingChoice;
  for (const cardId of selectedIds)
    trashRunnerInstalledCardToHeap(state, cardId, legalAction);

  const result = executeCardImplementationEffects(
    state,
    {
      sourceCardId,
      sourceDefinitionId,
      sourceTitle: sourceDefinition.title,
      controller: "runner",
    },
    [
      {
        kind: "add_bad_publicity",
        amount: implementation.badPublicity,
        visibility: "public",
      },
    ],
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: RUNNER_INSTALLED_CONNECTION_TRASH_BAD_PUBLICITY_ACTION,
    sourceDefinitionId,
    trashedCount: selectedIds.length,
    installedConnectionTrashCount: selectedIds.length,
    trashedCardDefinitionIds: trashedCardDefinitionIds.join(","),
    installedConnectionTrashChoiceResolved: true,
    ...result.publicPayload,
  };
  appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
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
  counterType: CounterType,
  amount: number,
): { amount: number; counterType: Extract<CounterType, "militech" | "pattel_antibody">; countersAfter: number; publicPayload: Record<string, string | number | boolean> } {
  if (counterType !== "militech" && counterType !== "pattel_antibody")
    throw new Error("Dieser Icebreaker-Counter-Typ wird nicht unterstuetzt.");
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

function shuffleCorpCardIntoRd(
  state: GameState,
  cardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  reason: "lifecycle" | "access",
): { publicPayload: Record<string, string | number | boolean> } {
  const instance = mustInstance(state.cardInstances, cardId);
  if (instance.owner !== "corp")
    throw new Error("Nur Korp-Karten koennen in R&D gemischt werden.");
  removeFromAllZones(state, cardId);
  state.corp.rd.push(cardId);
  state.cardInstances[cardId] = {
    ...instance,
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "rd" },
  };
  state.corp.rd = shuffleStateIds(
    state,
    state.corp.rd,
    `card_implementation.${sourceDefinitionId}.${reason}.shuffle_into_rd`,
  );
  for (const rdCardId of state.corp.rd) {
    state.cardInstances[rdCardId] = {
      ...mustInstance(state.cardInstances, rdCardId),
      zone: { side: "corp", zone: "rd" },
    };
  }
  return {
    publicPayload: {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "shuffle_source_into_corp_rd",
      movedCardCount: 1,
      sourceDefinitionId,
    },
  };
}

function trashCorpInstalledCardsInScoredSourceServer(
  state: GameState,
  legalAction: LegalAction | undefined,
  _sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
): { publicPayload: Record<string, string | number | boolean> } {
  const serverId =
    typeof legalAction?.payload?.scoredFromServerId === "string"
      ? legalAction.payload.scoredFromServerId
      : undefined;
  if (!serverId || serverId === "new_remote")
    throw new Error("Die gescorte Agenda hat keinen gueltigen Installationsserver.");
  const server = mustServer(state, serverId as Exclude<ServerId, "new_remote">);
  const targetIds = [...server.root, ...server.ice].sort();
  const publicDefinitionIds = targetIds
    .filter((targetId) => {
      const instance = mustInstance(state.cardInstances, targetId);
      return instance.rezzed === true || instance.faceup === true;
    })
    .map((targetId) => definitionFor(state, targetId).id);
  for (const targetId of targetIds) {
    trashCorpInstalledCardToArchives(state, targetId, legalAction);
  }
  return {
    publicPayload: {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "proteus_trash_source_server_installed_corp_cards",
      sourceDefinitionId,
      scoredFromServerId: server.id,
      trashedInstalledCount: targetIds.length,
      publicTrashedCardDefinitionIds: publicDefinitionIds.join(","),
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

function resolveTraceTrashRunnerResourceSuccess(
  state: GameState,
  sourceDefinitionId: CardDefinitionId,
  sourceCardInstanceId: CardInstanceId,
  traceId: string,
  targetCardId: CardInstanceId,
): Record<string, unknown> {
  if (!runnerLastTurnInstalledResourceIds(state).includes(targetCardId))
    throw new Error("Die Runner-Resource ist fuer diesen Trace nicht mehr legal.");
  const hiddenResource = isConcealedRunnerResource(state, targetCardId);
  const hiddenResourceSlotId = hiddenRunnerResourceSlotId(targetCardId);
  const targetDefinitionId = definitionFor(state, targetCardId).id;
  trashRunnerInstalledCardToHeap(state, targetCardId);
  return {
    traceSuccessEffect: "trash_runner_resource_and_add_tag",
    sourceDefinitionId,
    sourceCardInstanceId,
    traceId,
    trashedCardType: "resource",
    trashedCount: 1,
    trashedCardDefinitionId: targetDefinitionId,
    ...(hiddenResource
      ? {
          hiddenResourceSlotId,
          hiddenRunnerResource: true,
          hiddenRunnerResourceRevealed: true,
          redactedKind: "hidden_runner_resource",
        }
      : {}),
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
  parisCityGridTracePoolTotal: (state) =>
    parisCityGridTracePoolTotal(fortRunSideFamiliesHostForState(state)),
  spendParisCityGridTracePool: (state, sourceCardId, serverId, amount) =>
    spendParisCityGridTracePool(
      fortRunSideFamiliesHostForState(state),
      sourceCardId,
      serverId,
      amount,
    ),
  corpCreditsAvailable: (state) => state.corp.credits,
  spendCorpCredits: (state, amount) => spendCredits(state, "corp", amount),
  krumzTraceBitTotal,
  spendKrumzTraceBits,
  hackerTrackerCounterTotal,
  spendHackerTrackerCounters,
  cardCounter,
};

const runnerTracePaymentDeps: RunnerTracePaymentDependencies = {
  runnerTraceLinkCreditSourceIds: (state) =>
    [
      ...restrictedHostedCreditSourceIds(state, "increase_link"),
      ...[...state.runner.rig.hardware, ...state.runner.rig.resources].filter(
        (cardId) =>
          !isRestrictedHostedCreditSource(definitionFor(state, cardId)) &&
          definitionFor(state, cardId).id === HELLS_RUN_ID &&
          cardCounter(state, cardId, "recurring_credit") > 0,
      ),
    ].sort(),
  hostedPaymentCredits,
  spendHostedPaymentCredits,
  runnerCreditsAvailable: (state) => state.runner.credits,
  spendRunnerCredits: (state, amount) => spendCredits(state, "runner", amount),
  recordWilsonRunCapSpend: (state, amount) =>
    recordWilsonRunCapSpend(runDurationPaymentHost(state), amount),
  definitionIdForCard: (state, cardId) => definitionFor(state, cardId).id,
  hellsRunDefinitionId: HELLS_RUN_ID,
};

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

function withoutVariableIceState(instance: CardInstance): CardInstance {
  const { variableIceState: _variableIceState, ...rest } =
    instance;
  void _variableIceState;
  return rest;
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

function runnerActionsPerTurn(state: GameState): number {
  const override = Math.floor(state.runnerActionsPerTurnOverride ?? 4);
  return Math.max(0, override);
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
    runAttemptsThisGame: 0,
    trashedNodeThisTurn: false,
    trashedNodeLastTurn: false,
    trashedAdvertisementThisTurn: false,
    trashedTransactionsThisTurn: false,
    prearrangedDropPending: false,
    installedResourceIdsThisTurn: [],
    installedResourceIdsLastTurn: [],
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
  flags.runAttemptsThisGame ??= 0;
  flags.trashedNodeThisTurn ??= false;
  flags.trashedNodeLastTurn ??= false;
  flags.trashedAdvertisementThisTurn ??= false;
  flags.trashedTransactionsThisTurn ??= false;
  flags.prearrangedDropPending ??= false;
  flags.installedResourceIdsThisTurn ??= [];
  flags.installedResourceIdsLastTurn ??= [];
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

function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}
