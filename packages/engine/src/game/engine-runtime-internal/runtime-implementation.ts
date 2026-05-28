import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createStateRuntimeServices } from "./state-runtime-services";
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
} from "../payment";
import {
  resolvePendingChoice,
  type PendingChoiceResolutionHost,
} from "../choices/pending-choice-resolution";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  corpInstalledCardIds,
  corpRootAssetIdsInServer,
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustRun,
  mustServer,
  publicInstalledCorpCardIdentityKnown,
  rezzedRootCardIdOnServer,
  runnerInstalledCardIds,
  scoredCorpAgendaIds,
  unrezzedRootCardIdOnServer,
} from "../state/card-server-lookup";
import {
  drawCorpCard,
  drawCorpCards,
  randomHqAccess,
  rollDeterministicDie,
  shuffleStateIds,
  mustArrayValue,
  nextRandom,
  recordStateRandomMarkers,
} from "../state/draw-random";
import {
  credits,
  spendClick,
  spendClicks,
  spendCredits,
} from "../state/economy-mutation";
import {
  addCardCounter,
  cardCounter,
  cardInstanceWithoutCounters,
  clearCardCounters,
  ensureCorpTurnFlags,
  ensureRunnerTurnFlags,
  hasSuccessfulHqRunThisTurn,
  hasSuccessfulRunThisTurn,
  recordRunnerActionSpent,
  setCardCounter,
  spendCardCounter,
} from "../state/turn-flags-counters";
import {
  cleanupEmptyRemotes,
  createRemote,
  ensureSpecialZones,
  hostedCardsOn,
  removeFromAllZones,
  setHostedOn,
  uninstallCorpInstalledCardToHq,
} from "../state/zone-mutation";
export {
  getLegalActions,
  legalActionsFor,
} from "../legal-actions";
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../events/build-event";
import {
  configureEventContextHostComposition,
} from "../events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "../win-conditions";
export { checkWinConditions } from "../win-conditions";
import {
  calculateRunnerLink as calculateRunnerLinkInTrace,
  handleTraceOrchestrationAction,
  resolveTraceChoice,
  traceBidChoice,
  startTraceFromOperation as startTraceFromOperationInTrace,
  type TraceOrchestrationHost,
} from "../trace/trace-orchestration";
import {
  buildLegalAction as action,
  makeActionId,
} from "../turn/action-builders";
import {
  createMainActionHostComposition,
  type MainActionHostCompositionHost,
} from "../turn/main-action-hosts";
import {
  buildCorpDrawAction,
  buildCorpEndTurnAction,
  buildCorpGainCreditAction,
  buildCorpPurgeVirusAction,
} from "../turn/corp-basic-actions";
import {
  buildCorpNewRemoteIceInstallAction,
  buildCorpNewRemoteRootInstallAction,
  buildCorpServerIceInstallAction,
  buildCorpServerRootInstallAction,
} from "../turn/corp-install-actions";
import {
  assertCorpCanCreateNewDataFort,
  buildCorpTrashNewDataFortCreationLockActions,
  corpNewDataFortCreationLocked,
  newDataFortCreationLockForSource,
} from "../turn/corp-data-fort-lock";
import {
  buildRunnerEndTurnAction,
  buildRunnerGainCreditAction,
  buildRunnerRemoveTagAction,
} from "../turn/runner-basic-actions";
import {
  buildRunnerDrawCardActions,
  type RunnerDrawActionContext,
} from "../turn/runner-draw-actions";
import {
  addCorpActionDebt,
  corpActionDebtPending,
  purgeableRunnerVirusCounterAmount,
  purgeableRunnerVirusCounterTotal,
  purgeVirusCounters,
  type TurnBasicExecutionHost,
} from "../turn/turn-basic-execution";
import { type CreditEconomyExecutionHost } from "../economy/credit-economy-execution";
import { type TriggerAbilityExecutionHost } from "../abilities/trigger-ability-execution";
import {
  handleCounterUtilityTriggerExecution,
  type CounterUtilityTriggerExecutionHost,
} from "../abilities/counter-utility-trigger-execution";
import { handleHiddenZoneTriggerExecution } from "../abilities/hidden-zone-trigger-execution";
import {
  handleRunFortTriggerExecution,
  microtechHostedProgramIds,
  topHostedProgramOnMicrotech,
  type RunFortTriggerExecutionHost,
} from "../abilities/run-fort-trigger-execution";
import {
  applyShellTradersStartOfTurn,
  handleRunnerSpecialTriggerExecution,
  shellTradersInstallCost,
  shellTradersPreparedTargetIds,
  shellTradersPrepareTargetIds,
  topRunnerHeapCardId,
  type RunnerSpecialTriggerExecutionHost,
} from "../abilities/runner-special-trigger-execution";
import {
  installCard as executeInstallCard,
  type InstallCardHost,
} from "../install/install-card";
import {
  rezCard as executeRezCard,
  type RezCardHost,
} from "../rez/rez-card";
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
} from "../damage/damage-core";
import {
  buildRunnerHardwareInstallAction,
  buildRunnerProgramInstallAction,
  buildRunnerResourceInstallAction,
} from "../turn/runner-install-actions";
import {
  buildRunnerAgendaPointInstallAction,
  buildRunnerSelectedServerInstallAction,
} from "../turn/runner-install-context-actions";
import {
  buildRunnerHostedProgramInstallAction,
  buildRunnerZetatechOverlayInstallAction,
} from "../turn/runner-hosted-install-actions";
import {
  buildRunnerProgramTrashBeforeInstallAction,
} from "../turn/runner-program-trash-install-actions";
import { buildRunnerStackSearchProgramToGripAction } from "../turn/runner-hidden-zone-search-actions";
import {
  buildRunnerShellTradersRemoveCounterAction,
  buildRunnerShellTradersSetAsideAction,
  buildRunnerValuPakInstallAction,
  buildRunnerValuPakSequenceEndAction,
} from "../turn/runner-special-zone-install-actions";
import {
  lookTopStackShowToCorpThenInstallMatchingTargets,
  searchStackInstallTargets,
  sneakPreviewInstallableProgramIds,
  sneakPreviewSourceOptions,
  startAujourdOuiTop5Activation,
  startRunnerStackSearchChoiceActivation,
  startSelfModifyingCodeStackActivation,
  startSneakPreviewSourceActivation,
} from "../hidden-zone/search-choice-activations";
import {
  handleHiddenZoneSearchChoice,
  type HiddenZoneSearchActivationHandlerHost,
  type HiddenZoneSearchChoiceHandlerHost,
} from "../hidden-zone/search-choice-handlers";
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
} from "../hidden-zone/arrange-choice-handlers";
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
} from "../hidden-zone/nonsearch-choice-handlers";
import {
  handleCorpZoneChoice,
  resolveAiChiefFinancialOfficer,
  resolveReschedulerHqShuffleDraw,
  startCorporateDownsizingScoreChoice,
  startCorporateNegotiatingCenterChoice,
  type CorpZoneChoiceHandlerHost,
} from "../hidden-zone/corp-zone-choice-handlers";
import {
  handleCorpInstallRezSequenceChoice,
  resolveSecurityPurgeAgendaPurge,
  startDataFortReclamationChoice,
  startPriorityRequisitionChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "../corp/install-rez-sequence-handlers";
import {
  handleScoredAgendaFlowChoice,
  startEmployeeEmpowermentStartDrawChoice,
  type ScoredAgendaFlowHost,
} from "../corp/scored-agenda-flow";
import {
  buildScoredAgendaAbilityActionsForCard,
  handleScoredAgendaActivatedAbilityAction,
  type ScoredAgendaAbilityHost,
} from "../corp/scored-agenda-abilities";
import {
  buildCorpTraceDamageAbilityActionsForCard,
  handleCorpTraceDamageActivatedAbility,
  type CorpTraceDamageAbilityHost,
} from "../corp/trace-damage-abilities";
import {
  buildCorpSpecialDamageAbilityActionsForCard,
  handleCorpSpecialDamageAbilityAction,
  type CorpSpecialDamageAbilityHost,
} from "../corp/special-damage-abilities";
import {
  availableRunnerAccessTrashCredits,
  runnerAccessTrashRecurringCreditSourceIds,
  type RunnerAccessActionHost,
} from "../access/access-actions";
import {
  resolveAccessInstalledRunnerProgramReturnChoice,
  resolveAccessPaymentChoice,
  resolveChimeraDaemonTrashChoice as resolveAccessChimeraDaemonTrashChoice,
  type AccessEffectHandlerHost,
} from "../access/access-effect-handlers";
import {
  advanceArchivesBreachPastNonDecisionCards,
  type AccessFlowHost,
} from "../access/access-flow";
import {
  installedAccessBonusForServer,
  runnerHqAccessBonus as runnerHqAccessBonusForBreach,
  type BreachStateHost,
} from "../access/breach-state";
import {
  resolveMicrotechAiInterfacePreAccessChoice,
  resolvePriorityWreckSpendChoice,
  sourcePayloadForSuccessfulRunReplacement,
  type RunAccessTransitionHost,
} from "../run/run-access-transition";
import { type StartRunOptions } from "../run/run-core-execution";
import {
  applyBodyweightDataCrecheSuccessfulRun,
  resolveSuccessfulRunFollowupAbility,
  resolveSuccessfulRunInterventionChoice as resolveSuccessfulRunInterventionChoiceInRunModule,
  type SuccessfulRunInterventionHost,
} from "../run/successful-run-interventions";
import {
  handleRunEndCleanup,
  recordDupreBreakUsage,
  resetBreakerStrength,
  resolvePattelsVirusCounterChoice,
  type RunEndCleanupHost,
} from "../run/run-end-cleanup";
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
} from "../run/run-duration-payment";
import {
  resolvePassRezzedIceProgramTrashChoice as resolvePassRezzedIceProgramTrashChoiceInRunModule,
  resolveViral15ProgramTrashChoice as resolveViral15ProgramTrashChoiceInRunModule,
  type EncounterResolutionHost,
} from "../run/encounter-resolution";
import {
  applyRioDeJaneiroCityGridPassedIceTrigger,
  isSubmarineUplinkSource,
  markSubmarineUplinkJackOutAfterEncounter,
  resolveFullyBrokenPassedIceDerezAndEndRun as resolveFullyBrokenPassedIceDerezAndEndRunInRunModule,
  resolveStartupImmolatorTrashIce as resolveStartupImmolatorTrashIceInRunModule,
  resolveTooManyDoorsSecretSpendChoice as resolveTooManyDoorsSecretSpendChoiceInRunModule,
  type EncounterSpecialWindowHost,
} from "../run/encounter-special-windows";
import {
  applyPrintedTraceSuccessFollowups,
  isSupportedEncounterTraceSuccessEffect,
  type EncounterPrintedEffectHost,
} from "../run/encounter-printed-effects";
import {
  type EncounterPrintedNonTraceHost,
} from "../run/encounter-printed-nontrace-effects";
import {
  breakAbilityMatchesIce,
  breakAbilityMatchesSubroutine,
  buildRunnerEncounterActions,
  buildRunnerMovementActions,
  type RunnerEncounterActionHost,
} from "../run/encounter-actions";
import {
  buildRunnerAccessStartCardImplementationActions,
  buildCorpEncounterCardImplementationActions,
} from "../run/card-implementation-run-actions";
import {
  createGameCardImplementationRuntimeDeps,
  type GameCardImplementationRuntimeDepsHost,
} from "../card-implementation/card-implementation-runtime-deps";
import {
  type HiddenZoneRuntimeDepsHost,
} from "../card-implementation/hidden-zone-runtime-deps";
import {
  type InstallRezRuntimeDepsHost,
} from "../card-implementation/install-rez-runtime-deps";
import {
  type CounterLifecycleRuntimeDepsHost,
} from "../card-implementation/counter-lifecycle-runtime-deps";
import {
  type TraceRuntimeDepsHost,
} from "../card-implementation/trace-runtime-deps";
import {
  beginEncounter,
  isApproachIceExposeViewingWindowOpen,
  isApproachIceExposeWindowOpen,
  resolveApproachIceExposeAbility,
  resolveApproachIceExposeViewingDecision,
  runnerApproachIceExposeActions,
  runnerApproachIceExposeViewingActions,
  type EncounterEntryHost,
} from "../run/encounter-entry";
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
} from "../run/run-rez-window";
import {
  resolveFortPassAdvancementWindow,
  resolveSingaporeCityGridSwapChoice,
  resolveStartRunIceRepositionWindow,
  startSingaporeCityGridSwapChoice,
  type FortPassWindowHost,
} from "../run/fort-pass-window";
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
} from "../run/fort-run-side-families";
import {
  handleRunMovementAction,
  passApproachedIce,
  type RunMovementHost,
} from "../run/run-movement";
import {
  createRunAccessLegalActionHostComposition,
  type RunAccessLegalActionHostCompositionHost,
} from "../run/run-access-legal-action-hosts";
import { type RunnerBreakerActionExecutionHost } from "../run/runner-breaker-action-execution";
import { type StartRunActionExecutionHost } from "../run/start-run-action-execution";
import { type RezActionExecutionHost } from "../rez/rez-action-execution";
import { type PlayCardExecutionHost } from "../play/play-card-execution";
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
} from "../play/corp-operation-resolution";
import { type BoardStateActionExecutionHost } from "../board/board-state-action-execution";
import { shuffleRunnerStackAndRefreshZones } from "../hidden-zone/runner-stack-shuffle";
export { quoteCorpRezCost } from "../payment";
export {
  createGame,
  createGameAfterSetup,
} from "../create-game";
import { hashState } from "../hash";
import { applyAction as applyActionFromGame } from "../apply-action";
export { applyAction } from "../apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "../apply/apply-action-hosts";
export { applyGameAction } from "../apply-game-action";
export { getPlayerView, playerViewFor } from "../player-view";
export { replayEvents, replayGameEvents } from "../replay";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "../view/card-view";
import { toPublicEvent } from "../view/public-event-view";
export { redactPublicEventForSide } from "../view/public-event-view";
export { hashGameState, hashState } from "../hash";
import { validateGameState } from "../validation";
export {
  validateGameState,
  validateGameStateForDebug,
} from "../validation";
import {
  additionalSubroutinesForIce,
  currentEncounterAdditionalSubroutinesForIce,
} from "../../ability-engine/additional-subroutine-modifiers";
import { quoteBreakSubroutineCostModifiers } from "../../ability-engine/break-subroutine-cost-modifiers";
import {
  effectiveAgendaDifficulty,
  maxHandSize,
  runnerMemoryLimit,
  type EffectiveAgendaDifficultyDependencies,
} from "../../ability-engine/effective-values";
import {
  publicServerLabel,
  publicServerLabelForCard,
  serverChoiceDisplayLabel,
} from "../../public-context";
import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";
import { traceSuccessEffectForCardImplementation } from "../../ability-engine/trace-implementations";
import {
  icebreakerAbilitiesForDefinition,
  type RuntimeIcebreakerAbility,
} from "../../ability-engine/icebreaker-abilities";
import { iceStrengthModifierBonusFor } from "../../ability-engine/ice-strength-modifiers";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
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
} from "../../mechanics/agenda-scoring";
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
} from "../../mechanics/agenda-operation-effects";
import {
  COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID,
  DISINFECTANT_VIRUS_COUNTER_ASSET_ID,
  KRUMZ_TRACE_ASSET_CARD_ID,
  SETUP_ACCESS_AMBUSH_ASSET_CARD_ID,
  TRAP_ACCESS_AMBUSH_ASSET_CARD_ID,
} from "../../mechanics/asset-node-effects";
import {
  ABLATIVE_COUNTER_HARDWARE_CARD_ID,
  ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
  DIPLOMATIC_IMMUNITY_DAMAGE_PREVENTION_CARD_ID,
  EMERGENCY_SELF_CONSTRUCT_PROGRAM_ID,
  FULL_BODY_CONVERSION_DAMAGE_PREVENTION_CARD_ID,
  RUNTIME_DAMAGE_PREVENTION_PROFILES,
} from "../../mechanics/damage-prevention";
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
} from "../../mechanics/hidden-zone";
import { NEWSGROUP_TAUNTING_TAG_HANDSIZE_ASSET_ID } from "../../mechanics/global-modifiers";
import { COUNTER_UPGRADE_CARD_IDS } from "../../mechanics/hosting-counters";
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
} from "../../mechanics/longtail-card-effects";
import {
  corpInstalledEconomyActionPayload,
  corpInstalledEconomyActionProfileForDefinition,
  corpInstalledEconomyActionProfileForPayload,
  CORP_RECURRING_ASSET_CARD_IDS,
  type EconomyActionProfile,
} from "../../mechanics/payment-costs";
import {
  isP358HiddenReplacementCompatibilityChoiceSource,
} from "../../compatibility/payload-compatibility";
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
} from "../../compatibility/runtime-compatibility";
import {
  BOARDWALK_RANDOM_PROGRAM_CARD_ID,
  QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID,
  RUNNER_RANDOM_PROGRAM_CARD_IDS,
} from "../../mechanics/random-effects";
import {
  RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
  RUN_REPLACEMENT_OVERLAP_EVENT_CARD_ID,
  TRACE_AWARE_RUN_EVENT_CARD_ID,
} from "../../mechanics/run-access";
import {
  CRYBABY_ACCESS_COST_UPGRADE_ID,
  DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID,
  DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID,
  PARIS_CITY_GRID_TRACE_TAG_UPGRADE_ID,
  TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID,
} from "../../mechanics/server-upgrades";
import {
  RUN_TAX_UPGRADE_CARD_IDS,
  TAG_CONDITION_UPGRADE_CARD_IDS,
} from "../../mechanics/trace-tags";
import { snapshotPersistentStealCostModifiersForSource } from "../../ability-engine/steal-cost-modifiers";
import { createCardImplementationEffectAdapters } from "../../ability-engine/card-implementation-effect-adapters";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
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
} from "../../ability-engine/card-implementation-runtime";
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
} from "../../ability-engine/definition-types";

type AutomaticEffectCollector = ResolvedGameEffect[];
const PROTEUS_TAXMAN_ID = "onr_proteus_097_taxman" as CardDefinitionId;
const PROTEUS_SCALDAN_ID = "onr_proteus_094_scaldan" as CardDefinitionId;
const PROTEUS_VIRAL_PIPELINE_ID =
  "onr_proteus_099_viral-pipeline" as CardDefinitionId;
const PROTEUS_ARMAGEDDON_ID = "onr_proteus_078_armageddon" as CardDefinitionId;

// Effective-value helpers are pure/read-only. Legacy agenda-difficulty pieces
// are still injected through runtime wiring so this module avoids public-facade
// imports without changing existing score legality or revalidation ordering.
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
      revealHiddenRunnerResource: (state, sourceCardId) =>
        hiddenRunnerResourceRevealPayload(state, sourceCardId),
      addCurrentRunAccessCount,
      passCurrentEncounteredIce,
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
  access: {
    hasHiddenResourceAccessStartActions,
    advanceArchivesBreachPastNonDecisionCards,
    startRunnerPrivateLookChoice,
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
    hostedProgramStrengthModifier,
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
  reactions: {
    openPostMeatDamageReactionWindow,
  },
};

configureDamageCoreHost(damageCoreHost);

function openPostMeatDamageReactionWindow(
  state: GameState,
  summary: DamageSummary,
): boolean {
  if (
    summary.damageType !== "meat" ||
    summary.cardsTrashed <= 0 ||
    state.winner ||
    state.pendingChoice
  )
    return false;
  const candidates = postMeatDamageHiddenResourceCandidates(state);
  if (candidates.length === 0) return false;
  state.pendingChoice = {
    choiceId: `hidden_resource_post_meat_damage_${state.stateVersion + 1}`,
    side: "runner",
    source: `hidden_resource.post_meat_damage:${summary.cardsTrashed}`,
    prompt: "Hidden Resource nach Meat Damage nutzen",
    kind: "select_option",
    options: [
      { id: "pass", label: "Keine Hidden Resource nutzen" },
      ...candidates.map((candidate) => ({
        id: `post_meat_damage_${candidate.cardId}`,
        label: `${candidate.title}: Korp wirft ${candidate.amount} HQ-Karten ab`,
        publicLabel: "Hidden Resource",
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

function postMeatDamageHiddenResourceCandidates(
  state: GameState,
): Array<{
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
  title: string;
  amount: number;
}> {
  return state.runner.rig.resources
    .slice()
    .sort()
    .flatMap((cardId) => {
      const instance = state.cardInstances[cardId];
      if (!instance || instance.tapped === true) return [];
      const definition = definitionFor(state, cardId);
      const implementation = runnerUtilityLongtailImplementationForCard(
        state,
        cardId,
      );
      if (
        implementation?.kind !==
        "hidden_resource_post_meat_damage_random_hq_discard"
      )
        return [];
      const amount = Math.max(0, Math.floor(implementation.amount));
      if (amount <= 0) return [];
      return [{ cardId, definitionId: definition.id, title: definition.title, amount }];
    });
}

function resolvePostMeatDamageHiddenResourceChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("hidden_resource.post_meat_damage"))
    throw new Error("Es ist kein Hidden-Resource-Meat-Damage-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected === "pass") {
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenResourcePostMeatDamageDecision: "pass",
    };
    return;
  }
  const option = choice.options.find((candidate) => candidate.id === selected);
  const sourceCardId =
    typeof option?.value === "string"
      ? (option.value as CardInstanceId)
      : undefined;
  const candidate = postMeatDamageHiddenResourceCandidates(state).find(
    (item) => item.cardId === sourceCardId,
  );
  if (!candidate)
    throw new Error("Diese Hidden-Resource-Reaktion ist nicht legal.");
  const sourceInstance = mustInstance(state.cardInstances, candidate.cardId);
  const revealPayload = hiddenRunnerResourceRevealPayload(state, candidate.cardId);
  state.cardInstances[candidate.cardId] = {
    ...sourceInstance,
    faceup: true,
    rezzed: true,
    tapped: true,
  };
  const discardedIds = randomCorpHqDiscard(
    state,
    candidate.amount,
    `hidden_resource.post_meat_damage.${candidate.definitionId}.${choice.choiceId}`,
  );
  delete state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenResourcePostMeatDamageDecision: "apply",
    sourceDefinitionId: candidate.definitionId,
    ...revealPayload,
    sourceTapped: true,
    discardedHqCount: discardedIds.length,
    corpHqAfter: state.corp.hq.length,
    randomCounterAfter: state.randomCounter,
  };
}

function randomCorpHqDiscard(
  state: GameState,
  amount: number,
  purposePrefix: string,
): CardInstanceId[] {
  const discarded: CardInstanceId[] = [];
  const discardCount = Math.min(Math.max(0, Math.floor(amount)), state.corp.hq.length);
  for (let index = 0; index < discardCount; index += 1) {
    const value = nextRandom(state, `${purposePrefix}:selection:${index}`);
    const selectedIndex = Math.floor(value * state.corp.hq.length);
    const cardId = mustArrayValue(
      state.corp.hq,
      selectedIndex,
      "HQ-Discard-Auswahl fehlt.",
    );
    removeFromAllZones(state, cardId);
    state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
    discarded.push(cardId);
  }
  return discarded;
}

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
    runnerCostPenaltySupportCreditCapacity,
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
    runMovementHost: runMovementHostForState,
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

function corpRunnerActionPaidWindowActions(...args: any[]): any {
  return (actionRuntimeHosts.corpRunnerActionPaidWindowActions as any)(...args);
}

function expireCorporateRetreatInstallCreditAbilities(...args: any[]): any {
  return (stateRuntimeServices.expireCorporateRetreatInstallCreditAbilities as any)(...args);
}

function isCorpInstallableCardType(...args: any[]): any {
  return (stateRuntimeServices.isCorpInstallableCardType as any)(...args);
}

function edgerunnerTempsInstallActionsRemaining(...args: any[]): any {
  return (stateRuntimeServices.edgerunnerTempsInstallActionsRemaining as any)(...args);
}

function clearEdgerunnerTempsInstallFlags(...args: any[]): any {
  return (stateRuntimeServices.clearEdgerunnerTempsInstallFlags as any)(...args);
}

function consumeEdgerunnerTempsInstallAction(...args: any[]): any {
  return (stateRuntimeServices.consumeEdgerunnerTempsInstallAction as any)(...args);
}

function valuPakProgramInstallActionsRemaining(...args: any[]): any {
  return (stateRuntimeServices.valuPakProgramInstallActionsRemaining as any)(...args);
}

function valuPakTemporaryProgramInstallCredits(...args: any[]): any {
  return (stateRuntimeServices.valuPakTemporaryProgramInstallCredits as any)(...args);
}

function runnerInstallableProgramIdsForValuPak(...args: any[]): any {
  return (stateRuntimeServices.runnerInstallableProgramIdsForValuPak as any)(...args);
}

function installedRunnerProgramTrashOptionsForInstall(...args: any[]): any {
  return (stateRuntimeServices.installedRunnerProgramTrashOptionsForInstall as any)(...args);
}

function runnerProgramInstallMemoryReachableAfterTrash(...args: any[]): any {
  return (stateRuntimeServices.runnerProgramInstallMemoryReachableAfterTrash as any)(...args);
}

function shouldOfferRunnerProgramTrashBeforeInstall(...args: any[]): any {
  return (stateRuntimeServices.shouldOfferRunnerProgramTrashBeforeInstall as any)(...args);
}

function clearValuPakProgramInstallFlags(...args: any[]): any {
  return (stateRuntimeServices.clearValuPakProgramInstallFlags as any)(...args);
}

function consumeValuPakProgramInstallAction(...args: any[]): any {
  return (stateRuntimeServices.consumeValuPakProgramInstallAction as any)(...args);
}

function runnerDrawActionContext(...args: any[]): any {
  return (stateRuntimeServices.runnerDrawActionContext as any)(...args);
}

function normalizeSubtypeLabel(...args: any[]): any {
  return (stateRuntimeServices.normalizeSubtypeLabel as any)(...args);
}

function cardHasSubtype(...args: any[]): any {
  return (stateRuntimeServices.cardHasSubtype as any)(...args);
}

function stableSubtypeList(...args: any[]): any {
  return (stateRuntimeServices.stableSubtypeList as any)(...args);
}

function effectiveSubtypesForCard(...args: any[]): any {
  return (stateRuntimeServices.effectiveSubtypesForCard as any)(...args);
}

function rezzedIceOutsideThisIceCount(...args: any[]): any {
  return (stateRuntimeServices.rezzedIceOutsideThisIceCount as any)(...args);
}

function relativeIceStrengthBonusFor(...args: any[]): any {
  return (stateRuntimeServices.relativeIceStrengthBonusFor as any)(...args);
}

function isRegionUpgrade(...args: any[]): any {
  return (stateRuntimeServices.isRegionUpgrade as any)(...args);
}

function isUniqueCard(...args: any[]): any {
  return (stateRuntimeServices.isUniqueCard as any)(...args);
}

function rezzedBlackIceIds(...args: any[]): any {
  return (stateRuntimeServices.rezzedBlackIceIds as any)(...args);
}

function rezzedInstalledIceIds(...args: any[]): any {
  return (stateRuntimeServices.rezzedInstalledIceIds as any)(...args);
}

function affordableRezzedInstalledIceIdsForRunner(...args: any[]): any {
  return (stateRuntimeServices.affordableRezzedInstalledIceIdsForRunner as any)(...args);
}

function unrezzedInstalledIceIds(...args: any[]): any {
  return (stateRuntimeServices.unrezzedInstalledIceIds as any)(...args);
}

function hasInstalledUniqueCardDefinition(...args: any[]): any {
  return (stateRuntimeServices.hasInstalledUniqueCardDefinition as any)(...args);
}

function daemonHostingCapacity(...args: any[]): any {
  return (stateRuntimeServices.daemonHostingCapacity as any)(...args);
}

function daemonHostedMemoryUsed(...args: any[]): any {
  return (stateRuntimeServices.daemonHostedMemoryUsed as any)(...args);
}

function canHostProgramOnDaemon(...args: any[]): any {
  return (stateRuntimeServices.canHostProgramOnDaemon as any)(...args);
}

function hostedProgramStrengthModifier(...args: any[]): any {
  return (stateRuntimeServices.hostedProgramStrengthModifier as any)(...args);
}

function icebreakerEncounterStrengthBonus(...args: any[]): any {
  return (stateRuntimeServices.icebreakerEncounterStrengthBonus as any)(...args);
}

function canOverlayProgramOnZetatechSoftwareInstaller(...args: any[]): any {
  return (stateRuntimeServices.canOverlayProgramOnZetatechSoftwareInstaller as any)(...args);
}

function rezzedCorpRootCardIds(...args: any[]): any {
  return (stateRuntimeServices.rezzedCorpRootCardIds as any)(...args);
}

function visibleVirusCounterTargetIds(...args: any[]): any {
  return (stateRuntimeServices.visibleVirusCounterTargetIds as any)(...args);
}

function iceStrengthBonusFor(...args: any[]): any {
  return (stateRuntimeServices.iceStrengthBonusFor as any)(...args);
}

function iceStrengthFor(...args: any[]): any {
  return (stateRuntimeServices.iceStrengthFor as any)(...args);
}

function runRemainderStrengthBonusForBreaker(...args: any[]): any {
  return (stateRuntimeServices.runRemainderStrengthBonusForBreaker as any)(...args);
}

function runBreakSubroutineAdditionalCost(...args: any[]): any {
  return (stateRuntimeServices.runBreakSubroutineAdditionalCost as any)(...args);
}

function microtechTrodeSetBreakAdditionalCost(...args: any[]): any {
  return (stateRuntimeServices.microtechTrodeSetBreakAdditionalCost as any)(...args);
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

function breakSubroutineCostBreakdown(...args: any[]): any {
  return (stateRuntimeServices.breakSubroutineCostBreakdown as any)(...args);
}

function hasInstalledMicrotechTrodeSet(...args: any[]): any {
  return (stateRuntimeServices.hasInstalledMicrotechTrodeSet as any)(...args);
}

function runnerHasInstalledCardDefinition(...args: any[]): any {
  return (stateRuntimeServices.runnerHasInstalledCardDefinition as any)(...args);
}

function runnerInstalledCardCountByDefinition(...args: any[]): any {
  return (stateRuntimeServices.runnerInstalledCardCountByDefinition as any)(...args);
}

function installedVirusCounterTotalForDefinition(...args: any[]): any {
  return (stateRuntimeServices.installedVirusCounterTotalForDefinition as any)(...args);
}

function virusCounterImplementationForDefinition(...args: any[]): any {
  return (stateRuntimeServices.virusCounterImplementationForDefinition as any)(...args);
}

function virusCounterImplementationForCard(...args: any[]): any {
  return (stateRuntimeServices.virusCounterImplementationForCard as any)(...args);
}

function corpUtilityImplementationForCard(...args: any[]): any {
  return (stateRuntimeServices.corpUtilityImplementationForCard as any)(...args);
}

function hasCorpUtilityKind(...args: any[]): any {
  return (stateRuntimeServices.hasCorpUtilityKind as any)(...args);
}

function cardInstallCapabilitiesForDefinition(...args: any[]): any {
  return (stateRuntimeServices.cardInstallCapabilitiesForDefinition as any)(...args);
}

function hasInstallCapabilityKindForDefinition(...args: any[]): any {
  return (stateRuntimeServices.hasInstallCapabilityKindForDefinition as any)(...args);
}

function rootInstallRezzesOnInstall(...args: any[]): any {
  return (stateRuntimeServices.rootInstallRezzesOnInstall as any)(...args);
}

function mustInstallInsideSubsidiaryDataFort(...args: any[]): any {
  return (stateRuntimeServices.mustInstallInsideSubsidiaryDataFort as any)(...args);
}

function fortCapacityModifiersForCard(...args: any[]): any {
  return (stateRuntimeServices.fortCapacityModifiersForCard as any)(...args);
}

function leavePlayCleanupImplementationsForCard(...args: any[]): any {
  return (stateRuntimeServices.leavePlayCleanupImplementationsForCard as any)(...args);
}

function installedRunnerVirusSourceIds(...args: any[]): any {
  return (stateRuntimeServices.installedRunnerVirusSourceIds as any)(...args);
}

function cockroachCounterTotal(...args: any[]): any {
  return (stateRuntimeServices.cockroachCounterTotal as any)(...args);
}

function incubatorCounterTotal(...args: any[]): any {
  return (stateRuntimeServices.incubatorCounterTotal as any)(...args);
}

function cockroachRandomHqDiscardActive(...args: any[]): any {
  return (stateRuntimeServices.cockroachRandomHqDiscardActive as any)(...args);
}

function isVisibleVirusCounterCardForRunner(...args: any[]): any {
  return (stateRuntimeServices.isVisibleVirusCounterCardForRunner as any)(...args);
}

function corpIceInstallBaseCost(...args: any[]): any {
  return (stateRuntimeServices.corpIceInstallBaseCost as any)(...args);
}

function outermostIceIndex(...args: any[]): any {
  return (stateRuntimeServices.outermostIceIndex as any)(...args);
}

function poxCountersForServer(...args: any[]): any {
  return (stateRuntimeServices.poxCountersForServer as any)(...args);
}

function spyCountersForServer(...args: any[]): any {
  return (stateRuntimeServices.spyCountersForServer as any)(...args);
}

function poxInstallTax(...args: any[]): any {
  return (stateRuntimeServices.poxInstallTax as any)(...args);
}

function corpIceInstallAdditionalCost(...args: any[]): any {
  return (stateRuntimeServices.corpIceInstallAdditionalCost as any)(...args);
}

function corpIceInstallTotalCost(...args: any[]): any {
  return (stateRuntimeServices.corpIceInstallTotalCost as any)(...args);
}

function assertCorpIceInstallCostValid(...args: any[]): any {
  return (stateRuntimeServices.assertCorpIceInstallCostValid as any)(...args);
}

function specialZoneHarnessActions(...args: any[]): any {
  return (actionRuntimeHosts.specialZoneHarnessActions as any)(...args);
}

function dupreStrengthCounterBonus(...args: any[]): any {
  return (cardRuntimeHosts.dupreStrengthCounterBonus as any)(...args);
}

function permanentIcebreakerStrengthCounterBonus(...args: any[]): any {
  return (cardRuntimeHosts.permanentIcebreakerStrengthCounterBonus as any)(...args);
}

function pumpAmountForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.pumpAmountForLegalAction as any)(...args);
}

function pumpAbilityForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.pumpAbilityForLegalAction as any)(...args);
}

function breakAbilityForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.breakAbilityForLegalAction as any)(...args);
}

function pumpDurationForLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.pumpDurationForLegalAction as any)(...args);
}

function assertCurrentSubroutineMatchesLegalAction(...args: any[]): any {
  return (cardRuntimeHosts.assertCurrentSubroutineMatchesLegalAction as any)(...args);
}

function resolveMultiBreakSubroutinesAction(...args: any[]): any {
  return (cardRuntimeHosts.resolveMultiBreakSubroutinesAction as any)(...args);
}

function assertBreakSubroutineCostQuoteValid(...args: any[]): any {
  return (cardRuntimeHosts.assertBreakSubroutineCostQuoteValid as any)(...args);
}

function subroutinesForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.subroutinesForCurrentEncounter as any)(...args);
}

function variableTraceSubroutineForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.variableTraceSubroutineForCurrentEncounter as any)(...args);
}

function relativeDamageSubroutineForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.relativeDamageSubroutineForCurrentEncounter as any)(...args);
}

function relativeTraceSubroutinesForCurrentEncounter(...args: any[]): any {
  return (cardRuntimeHosts.relativeTraceSubroutinesForCurrentEncounter as any)(...args);
}

function runCardImplementationActionHost(...args: any[]): any {
  return (cardRuntimeHosts.runCardImplementationActionHost as any)(...args);
}

function runStartTaxForServerUpgrades(...args: any[]): any {
  return (cardRuntimeHosts.runStartTaxForServerUpgrades as any)(...args);
}

function newsgroupTauntingRunStartTax(...args: any[]): any {
  return (cardRuntimeHosts.newsgroupTauntingRunStartTax as any)(...args);
}

function spendRunnerAccessTrashCredits(...args: any[]): any {
  return (cardRuntimeHosts.spendRunnerAccessTrashCredits as any)(...args);
}

function turnBasicExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.turnBasicExecutionHost as any)(...args);
}

function creditEconomyExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.creditEconomyExecutionHost as any)(...args);
}

function runnerSpecialTriggerExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.runnerSpecialTriggerExecutionHost as any)(...args);
}

function runFortTriggerExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.runFortTriggerExecutionHost as any)(...args);
}

function counterUtilityTriggerExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.counterUtilityTriggerExecutionHost as any)(...args);
}

function triggerAbilityExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.triggerAbilityExecutionHost as any)(...args);
}

function installCardHost(...args: any[]): any {
  return (cardRuntimeHosts.installCardHost as any)(...args);
}

function rezCardHost(...args: any[]): any {
  return (cardRuntimeHosts.rezCardHost as any)(...args);
}

function traceOrchestrationHost(...args: any[]): any {
  return (cardRuntimeHosts.traceOrchestrationHost as any)(...args);
}

function activatedCardImplementationExecutionHost(...args: any[]): any {
  return (cardRuntimeHosts.activatedCardImplementationExecutionHost as any)(...args);
}
function resolveRunnerTargetedEventImplementation(...args: any[]): any {
  return (cardRuntimeHosts.resolveRunnerTargetedEventImplementation as any)(...args);
}

function resolvePostOnPlayGenericFollowups(...args: any[]): any {
  return (cardRuntimeHosts.resolvePostOnPlayGenericFollowups as any)(...args);
}

function resolveMitWestTier(...args: any[]): any {
  return (cardRuntimeHosts.resolveMitWestTier as any)(...args);
}

function shuffleGripTrashAndStackThenDrawForCardImplementation(...args: any[]): any {
  return (cardRuntimeHosts.shuffleGripTrashAndStackThenDrawForCardImplementation as any)(...args);
}

function startRunnerProgramTrashBeforeInstallChoice(...args: any[]): any {
  return (cardRuntimeHosts.startRunnerProgramTrashBeforeInstallChoice as any)(...args);
}

function resolveRunnerProgramTrashBeforeInstallChoice(...args: any[]): any {
  return (cardRuntimeHosts.resolveRunnerProgramTrashBeforeInstallChoice as any)(...args);
}

function canInstallCorpRootCardInServer(...args: any[]): any {
  return (flowRuntimeHosts.canInstallCorpRootCardInServer as any)(...args);
}

function corpRootAgendaOrNodeCapacityInServer(...args: any[]): any {
  return (flowRuntimeHosts.corpRootAgendaOrNodeCapacityInServer as any)(...args);
}

function corpRegionUpgradeIdsInServer(...args: any[]): any {
  return (flowRuntimeHosts.corpRegionUpgradeIdsInServer as any)(...args);
}

function startRun(...args: any[]): any {
  return (flowRuntimeHosts.startRun as any)(...args);
}

type RunnerTraceCounterEffectRuntime =
  NonNullable<(typeof CARD_IMPLEMENTATIONS)[number]["runnerCounterEffects"]>[number] & {
    sourceDefinitionId: CardDefinitionId;
  };

function runnerTraceCounterEffectDefinitions(...args: any[]): any {
  return (flowRuntimeHosts.runnerTraceCounterEffectDefinitions as any)(...args);
}

function runnerCounterDisplayName(...args: any[]): any {
  return (flowRuntimeHosts.runnerCounterDisplayName as any)(...args);
}

function traceCounterEffectDefinitionFor(...args: any[]): any {
  return (flowRuntimeHosts.traceCounterEffectDefinitionFor as any)(...args);
}

function runnerUtilityLongtailKindForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.runnerUtilityLongtailKindForDefinition as any)(...args);
}

function runnerUtilityLongtailKindForCard(...args: any[]): any {
  return (flowRuntimeHosts.runnerUtilityLongtailKindForCard as any)(...args);
}

function runnerUtilityLongtailImplementationForCard(...args: any[]): any {
  return (flowRuntimeHosts.runnerUtilityLongtailImplementationForCard as any)(...args);
}

function uniqueDirectLongtailImplementationForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailImplementationForDefinition as any)(...args);
}

function uniqueDirectLongtailKindForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailKindForDefinition as any)(...args);
}

function uniqueDirectLongtailImplementationForCard(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailImplementationForCard as any)(...args);
}

function uniqueDirectLongtailKindForCard(...args: any[]): any {
  return (flowRuntimeHosts.uniqueDirectLongtailKindForCard as any)(...args);
}

function remainingReplacementLongtailImplementationForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailImplementationForDefinition as any)(...args);
}

function remainingReplacementLongtailKindForDefinition(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailKindForDefinition as any)(...args);
}

function remainingReplacementLongtailImplementationForCard(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailImplementationForCard as any)(...args);
}

function remainingReplacementLongtailKindForCard(...args: any[]): any {
  return (flowRuntimeHosts.remainingReplacementLongtailKindForCard as any)(...args);
}

function isAcmeSavingsAndLoanDefinition(...args: any[]): any {
  return (flowRuntimeHosts.isAcmeSavingsAndLoanDefinition as any)(...args);
}

function isCitySurveillanceCard(...args: any[]): any {
  return (flowRuntimeHosts.isCitySurveillanceCard as any)(...args);
}

function isInvestmentFirmCard(...args: any[]): any {
  return (flowRuntimeHosts.isInvestmentFirmCard as any)(...args);
}

function isHackerTrackerCentralCard(...args: any[]): any {
  return (flowRuntimeHosts.isHackerTrackerCentralCard as any)(...args);
}

function applyRunnerTraceCounterRunStartEffects(...args: any[]): any {
  return (flowRuntimeHosts.applyRunnerTraceCounterRunStartEffects as any)(...args);
}

function applyAiBoonRunStart(...args: any[]): any {
  return (flowRuntimeHosts.applyAiBoonRunStart as any)(...args);
}

function continueRun(...args: any[]): any {
  return (flowRuntimeHosts.continueRun as any)(...args);
}

function addCurrentRunAccessCount(...args: any[]): any {
  return (flowRuntimeHosts.addCurrentRunAccessCount as any)(...args);
}

function passCurrentEncounteredIce(...args: any[]): any {
  return (flowRuntimeHosts.passCurrentEncounteredIce as any)(...args);
}
function resolveBlinkBreakSubroutineAction(...args: any[]): any {
  return (flowRuntimeHosts.resolveBlinkBreakSubroutineAction as any)(...args);
}

function recordBartmossEncounterUsage(...args: any[]): any {
  return (flowRuntimeHosts.recordBartmossEncounterUsage as any)(...args);
}

function recordSnowballBreakUsage(...args: any[]): any {
  return (flowRuntimeHosts.recordSnowballBreakUsage as any)(...args);
}

function icebreakerHasSpecial(...args: any[]): any {
  return (flowRuntimeHosts.icebreakerHasSpecial as any)(...args);
}

function hackerTrackerCardIds(...args: any[]): any {
  return (flowRuntimeHosts.hackerTrackerCardIds as any)(...args);
}

function hackerTrackerCounterType(...args: any[]): any {
  return (flowRuntimeHosts.hackerTrackerCounterType as any)(...args);
}

function hackerTrackerCounterTotal(...args: any[]): any {
  return (flowRuntimeHosts.hackerTrackerCounterTotal as any)(...args);
}

function spendHackerTrackerCounters(...args: any[]): any {
  return (flowRuntimeHosts.spendHackerTrackerCounters as any)(...args);
}

function addHackerTrackerTraceCounters(...args: any[]): any {
  return (flowRuntimeHosts.addHackerTrackerTraceCounters as any)(...args);
}

function rabbitTraceLimitReductionForIceTrace(...args: any[]): any {
  return (flowRuntimeHosts.rabbitTraceLimitReductionForIceTrace as any)(...args);
}

function archivesAccessRequiresDecisionOrEffect(...args: any[]): any {
  return (flowRuntimeHosts.archivesAccessRequiresDecisionOrEffect as any)(...args);
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
    .filter((cardId: CardInstanceId) =>
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

function citySurveillanceSourceIds(state: GameState): CardInstanceId[] {
  return rezzedCorpRootCardIds(state).filter((sourceId: CardInstanceId) =>
    isCitySurveillanceCard(state, sourceId),
  );
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
  const selectedIds = selectedChoiceCardIds(choice, playerAction) as CardInstanceId[];
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
  const targets = advanceableInstalledCardTargets(state) as CardInstanceId[];
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
  const eligibleTargets = new Set<CardInstanceId>(
    advanceableInstalledCardTargets(state) as CardInstanceId[],
  );
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

function advanceableInstalledCardTargets(...args: any[]): any {
  return (turnCorpRuntime.advanceableInstalledCardTargets as any)(...args);
}

function isInstalledCorpCardAdvanceable(...args: any[]): any {
  return (turnCorpRuntime.isInstalledCorpCardAdvanceable as any)(...args);
}

function advancementDistributionOptions(...args: any[]): any {
  return (turnCorpRuntime.advancementDistributionOptions as any)(...args);
}

function startCardImplementationAdvancementDistributionChoice(...args: any[]): any {
  return (turnCorpRuntime.startCardImplementationAdvancementDistributionChoice as any)(...args);
}

function parseAdvancementDistributionValue(...args: any[]): any {
  return (turnCorpRuntime.parseAdvancementDistributionValue as any)(...args);
}

function sourcePartsForP334Choice(...args: any[]): any {
  return (turnCorpRuntime.sourcePartsForP334Choice as any)(...args);
}

function validateAdvancementDistribution(...args: any[]): any {
  return (turnCorpRuntime.validateAdvancementDistribution as any)(...args);
}

function resolveCardImplementationAdvancementDistributionChoice(...args: any[]): any {
  return (turnCorpRuntime.resolveCardImplementationAdvancementDistributionChoice as any)(...args);
}

function movableAdvancementSourceIds(...args: any[]): any {
  return (turnCorpRuntime.movableAdvancementSourceIds as any)(...args);
}

function moveAdvancementOptions(...args: any[]): any {
  return (turnCorpRuntime.moveAdvancementOptions as any)(...args);
}

function startCardImplementationMoveAdvancementChoice(...args: any[]): any {
  return (turnCorpRuntime.startCardImplementationMoveAdvancementChoice as any)(...args);
}

function resolveCardImplementationMoveAdvancementChoice(...args: any[]): any {
  return (turnCorpRuntime.resolveCardImplementationMoveAdvancementChoice as any)(...args);
}

function resolveManagementShakeUpOperation(...args: any[]): any {
  return (turnCorpRuntime.resolveManagementShakeUpOperation as any)(...args);
}

function awardRunnerEventAgendaPoint(...args: any[]): any {
  return (turnCorpRuntime.awardRunnerEventAgendaPoint as any)(...args);
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
    .filter((cardId: CardInstanceId) => isInvestmentFirmCard(state, cardId))
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

function discardRandomCorpHqCards(...args: any[]): any {
  return (lifecycleRuntime.discardRandomCorpHqCards as any)(...args);
}

function trashRunnerInstalledProgram(...args: any[]): any {
  return (lifecycleRuntime.trashRunnerInstalledProgram as any)(...args);
}

function backupProgramsOnMicrotechBeforeTrash(...args: any[]): any {
  return (lifecycleRuntime.backupProgramsOnMicrotechBeforeTrash as any)(...args);
}

function runnerProgramUsesMemory(...args: any[]): any {
  return (lifecycleRuntime.runnerProgramUsesMemory as any)(...args);
}

function trashRunnerInstalledCardToHeap(...args: any[]): any {
  return (lifecycleRuntime.trashRunnerInstalledCardToHeap as any)(...args);
}

function returnRunnerInstalledCardToGrip(...args: any[]): any {
  return (lifecycleRuntime.returnRunnerInstalledCardToGrip as any)(...args);
}

function returnRunnerInstalledProgramsToGripForAccess(...args: any[]): any {
  return (lifecycleRuntime.returnRunnerInstalledProgramsToGripForAccess as any)(...args);
}

function trashCorpInstalledCardToArchives(...args: any[]): any {
  return (lifecycleRuntime.trashCorpInstalledCardToArchives as any)(...args);
}

function cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(...args: any[]): any {
  return (lifecycleRuntime.cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay as any)(...args);
}

function drawRunnerCard(...args: any[]): any {
  return (lifecycleRuntime.drawRunnerCard as any)(...args);
}

function activeCrashEverettSourceId(...args: any[]): any {
  return (lifecycleRuntime.activeCrashEverettSourceId as any)(...args);
}

function startCrashEverettDrawChoice(...args: any[]): any {
  return (lifecycleRuntime.startCrashEverettDrawChoice as any)(...args);
}

function drawRunnerCards(...args: any[]): any {
  return (lifecycleRuntime.drawRunnerCards as any)(...args);
}

function resolveCrashEverettDrawChoice(...args: any[]): any {
  return (lifecycleRuntime.resolveCrashEverettDrawChoice as any)(...args);
}

function corpInstallRezSequenceHandlerHost(...args: any[]): any {
  return (actionRuntimeHosts.corpInstallRezSequenceHandlerHost as any)(...args);
}

function scoredAgendaFlowHost(...args: any[]): any {
  return (actionRuntimeHosts.scoredAgendaFlowHost as any)(...args);
}

function scoredAgendaAbilityHost(...args: any[]): any {
  return (actionRuntimeHosts.scoredAgendaAbilityHost as any)(...args);
}

function corpTraceDamageAbilityHost(...args: any[]): any {
  return (actionRuntimeHosts.corpTraceDamageAbilityHost as any)(...args);
}

function corpSpecialDamageAbilityHost(...args: any[]): any {
  return (actionRuntimeHosts.corpSpecialDamageAbilityHost as any)(...args);
}

function runnerAccessActionHost(...args: any[]): any {
  return (flowRuntimeHosts.runnerAccessActionHost as any)(...args);
}

function runnerEncounterActionHostForState(...args: any[]): any {
  return (flowRuntimeHosts.runnerEncounterActionHostForState as any)(...args);
}

function runMovementHostForState(...args: any[]): any {
  return (flowRuntimeHosts.runMovementHostForState as any)(...args);
}

function runRezWindowHostForState(...args: any[]): any {
  return (flowRuntimeHosts.runRezWindowHostForState as any)(...args);
}

function fortPassWindowHostForState(...args: any[]): any {
  return (flowRuntimeHosts.fortPassWindowHostForState as any)(...args);
}

function fortRunSideFamiliesHostForState(...args: any[]): any {
  return (flowRuntimeHosts.fortRunSideFamiliesHostForState as any)(...args);
}

function encounterEntryHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterEntryHostForState as any)(...args);
}

function successfulRunInterventionHost(...args: any[]): any {
  return (flowRuntimeHosts.successfulRunInterventionHost as any)(...args);
}

function encounterResolutionHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterResolutionHostForState as any)(...args);
}

function encounterSpecialWindowHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterSpecialWindowHostForState as any)(...args);
}

function encounterPrintedEffectHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterPrintedEffectHostForState as any)(...args);
}

function encounterPrintedNonTraceHostForState(...args: any[]): any {
  return (flowRuntimeHosts.encounterPrintedNonTraceHostForState as any)(...args);
}

function runEndCleanupHost(...args: any[]): any {
  return (flowRuntimeHosts.runEndCleanupHost as any)(...args);
}

function runnerBreakerActionExecutionHost(...args: any[]): any {
  return (flowRuntimeHosts.runnerBreakerActionExecutionHost as any)(...args);
}

function startRunActionExecutionHost(...args: any[]): any {
  return (flowRuntimeHosts.startRunActionExecutionHost as any)(...args);
}

function rezActionExecutionHost(...args: any[]): any {
  return (flowRuntimeHosts.rezActionExecutionHost as any)(...args);
}

function playCardExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.playCardExecutionHost as any)(...args);
}

function corpOperationResolutionHost(...args: any[]): any {
  return (actionRuntimeHosts.corpOperationResolutionHost as any)(...args);
}

function boardStateActionExecutionHost(...args: any[]): any {
  return (actionRuntimeHosts.boardStateActionExecutionHost as any)(...args);
}

function breachStateHost(...args: any[]): any {
  return (flowRuntimeHosts.breachStateHost as any)(...args);
}

function accessFlowHost(...args: any[]): any {
  return (flowRuntimeHosts.accessFlowHost as any)(...args);
}

function runAccessTransitionHost(...args: any[]): any {
  return (flowRuntimeHosts.runAccessTransitionHost as any)(...args);
}

function hasHiddenResourceAccessStartActions(...args: any[]): any {
  return (actionRuntimeHosts.hasHiddenResourceAccessStartActions as any)(...args);
}

function accessEffectHandlerHost(...args: any[]): any {
  return (flowRuntimeHosts.accessEffectHandlerHost as any)(...args);
}

function pushCorpTraceDamageOrCardImplementationActions(...args: any[]): any {
  return (actionRuntimeHosts.pushCorpTraceDamageOrCardImplementationActions as any)(...args);
}

function hiddenZoneSearchHandlerHostBase(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchHandlerHostBase as any)(...args);
}

function hiddenZoneSearchActivationTargetHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchActivationTargetHost as any)(...args);
}

function hiddenZoneSearchChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchChoiceHandlerHost as any)(...args);
}

function hiddenZoneSearchActivationHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneSearchActivationHandlerHost as any)(...args);
}

function hiddenZoneArrangeChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneArrangeChoiceHandlerHost as any)(...args);
}

function hiddenZoneNonSearchChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.hiddenZoneNonSearchChoiceHandlerHost as any)(...args);
}

function corpZoneChoiceHandlerHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.corpZoneChoiceHandlerHost as any)(...args);
}

function pendingChoiceResolutionHost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.pendingChoiceResolutionHost as any)(...args);
}

function setupMulliganChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.setupMulliganChoice as any)(...args);
}

function discardChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.discardChoice as any)(...args);
}

function resolveDiscardChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveDiscardChoice as any)(...args);
}

function resolveSetupMulliganChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveSetupMulliganChoice as any)(...args);
}

function takeSetupMulligan(...args: any[]): any {
  return (choiceHiddenZoneRuntime.takeSetupMulligan as any)(...args);
}

function installRunnerProgramFromStackWithoutClick(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installRunnerProgramFromStackWithoutClick as any)(...args);
}

function canInstallRunnerProgramFromZone(...args: any[]): any {
  return (choiceHiddenZoneRuntime.canInstallRunnerProgramFromZone as any)(...args);
}

function installRunnerProgramFromZoneWithoutClick(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installRunnerProgramFromZoneWithoutClick as any)(...args);
}

function startSelfModifyingCodeFreeMuChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startSelfModifyingCodeFreeMuChoice as any)(...args);
}

function installRunnerProgramForFree(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installRunnerProgramForFree as any)(...args);
}

function startAnonymousTipDerezBlackIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startAnonymousTipDerezBlackIceChoice as any)(...args);
}

function resolveAnonymousTipDerezBlackIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveAnonymousTipDerezBlackIceChoice as any)(...args);
}

function startCoreCommandJettisonIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startCoreCommandJettisonIceChoice as any)(...args);
}

function resolveCoreCommandJettisonIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveCoreCommandJettisonIceChoice as any)(...args);
}

function publicIcePositionLabelForCard(...args: any[]): any {
  return (choiceHiddenZoneRuntime.publicIcePositionLabelForCard as any)(...args);
}

function publicIceSelectionLabelForCard(...args: any[]): any {
  return (choiceHiddenZoneRuntime.publicIceSelectionLabelForCard as any)(...args);
}

function startForgedActivationOrdersTargetChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startForgedActivationOrdersTargetChoice as any)(...args);
}

function resolveForgedActivationOrdersTargetChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveForgedActivationOrdersTargetChoice as any)(...args);
}

function resolveForgedActivationOrdersCorpChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveForgedActivationOrdersCorpChoice as any)(...args);
}

function startSecurityCodeWormChipTrashIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startSecurityCodeWormChipTrashIceChoice as any)(...args);
}

function resolveSecurityCodeWormChipTrashIceChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveSecurityCodeWormChipTrashIceChoice as any)(...args);
}

function startOpenEndedMileageProgramReturnChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startOpenEndedMileageProgramReturnChoice as any)(...args);
}

function resolveOpenEndedMileageProgramReturnChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveOpenEndedMileageProgramReturnChoice as any)(...args);
}

function corpAgendaPointTotal(...args: any[]): any {
  return (choiceHiddenZoneRuntime.corpAgendaPointTotal as any)(...args);
}

function chooseCorpAgendasForPointCost(...args: any[]): any {
  return (choiceHiddenZoneRuntime.chooseCorpAgendasForPointCost as any)(...args);
}

function startRunnerHostingChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startRunnerHostingChoice as any)(...args);
}

function resolveRunnerHostingChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveRunnerHostingChoice as any)(...args);
}

function resolveIncubatorTransformChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveIncubatorTransformChoice as any)(...args);
}

function resolveChimeraDaemonTrashChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveChimeraDaemonTrashChoice as any)(...args);
}

function resolveCardImplementationAccessPaymentChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveCardImplementationAccessPaymentChoice as any)(...args);
}

function resolveProteusRunnerProgramReturnChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveProteusRunnerProgramReturnChoice as any)(...args);
}

function selectedChoiceCardIds(...args: any[]): any {
  return (choiceHiddenZoneRuntime.selectedChoiceCardIds as any)(...args);
}

function iceChoiceLabelForSide(...args: any[]): any {
  return (choiceHiddenZoneRuntime.iceChoiceLabelForSide as any)(...args);
}

function resolveP358HiddenReplacementChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveP358HiddenReplacementChoice as any)(...args);
}

function installedRunnerConnectionIds(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installedRunnerConnectionIds as any)(...args);
}

function canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(...args: any[]): any {
  return (choiceHiddenZoneRuntime.canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity as any)(...args);
}

function resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent as any)(...args);
}

function parseRunnerInstalledConnectionTrashBadPublicityChoiceSource(...args: any[]): any {
  return (choiceHiddenZoneRuntime.parseRunnerInstalledConnectionTrashBadPublicityChoiceSource as any)(...args);
}

function selectedChoiceCardIdsForChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.selectedChoiceCardIdsForChoice as any)(...args);
}

function resolveRunnerInstalledConnectionTrashBadPublicityChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveRunnerInstalledConnectionTrashBadPublicityChoice as any)(...args);
}

function resolvePlayfulAiDiceLoopEvent(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolvePlayfulAiDiceLoopEvent as any)(...args);
}

function startV1921PlayfulAiChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startV1921PlayfulAiChoice as any)(...args);
}

function creditTextForPrompt(...args: any[]): any {
  return (choiceHiddenZoneRuntime.creditTextForPrompt as any)(...args);
}

function diePromptText(...args: any[]): any {
  return (choiceHiddenZoneRuntime.diePromptText as any)(...args);
}

function playfulAiSplitOptions(...args: any[]): any {
  return (choiceHiddenZoneRuntime.playfulAiSplitOptions as any)(...args);
}

function parsePlayfulAiChoiceSource(...args: any[]): any {
  return (choiceHiddenZoneRuntime.parsePlayfulAiChoiceSource as any)(...args);
}

function parsePlayfulAiSplit(...args: any[]): any {
  return (choiceHiddenZoneRuntime.parsePlayfulAiSplit as any)(...args);
}

function continueV1921PlayfulAiLoop(...args: any[]): any {
  return (choiceHiddenZoneRuntime.continueV1921PlayfulAiLoop as any)(...args);
}

function resolveV1921PlayfulAiChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveV1921PlayfulAiChoice as any)(...args);
}

function shuffleRunnerStack(...args: any[]): any {
  return (choiceHiddenZoneRuntime.shuffleRunnerStack as any)(...args);
}

function revealRunnerStackTop(...args: any[]): any {
  return (choiceHiddenZoneRuntime.revealRunnerStackTop as any)(...args);
}

function revealCorpRdTop(...args: any[]): any {
  return (choiceHiddenZoneRuntime.revealCorpRdTop as any)(...args);
}

function resolveV1911RunnerHiddenZoneAbility(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveV1911RunnerHiddenZoneAbility as any)(...args);
}

function resolveV1911CorporateDownsizing(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveV1911CorporateDownsizing as any)(...args);
}

function exposedCorpCardInServer(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposedCorpCardInServer as any)(...args);
}

function exposeCorpCardInServer(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeCorpCardInServer as any)(...args);
}

function installedCorpCardServerContext(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installedCorpCardServerContext as any)(...args);
}

function exposeInstalledCorpCardTargets(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardTargets as any)(...args);
}

function exposeInstalledCorpCardLabel(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardLabel as any)(...args);
}

function exposeInstalledCorpCardForImplementation(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardForImplementation as any)(...args);
}

function installedRunnerIcebreakerIds(...args: any[]): any {
  return (choiceHiddenZoneRuntime.installedRunnerIcebreakerIds as any)(...args);
}

function addCounterToAllInstalledRunnerIcebreakers(...args: any[]): any {
  return (choiceHiddenZoneRuntime.addCounterToAllInstalledRunnerIcebreakers as any)(...args);
}

function shuffleCorpCardIntoRd(...args: any[]): any {
  return (choiceHiddenZoneRuntime.shuffleCorpCardIntoRd as any)(...args);
}

function trashCorpInstalledCardsInScoredSourceServer(...args: any[]): any {
  return (choiceHiddenZoneRuntime.trashCorpInstalledCardsInScoredSourceServer as any)(...args);
}

function resolveDealWithMilitech(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveDealWithMilitech as any)(...args);
}

function huntClubBbsExposeTargets(...args: any[]): any {
  return (choiceHiddenZoneRuntime.huntClubBbsExposeTargets as any)(...args);
}

function huntClubBbsExposeOptionLabel(...args: any[]): any {
  return (choiceHiddenZoneRuntime.huntClubBbsExposeOptionLabel as any)(...args);
}

function exposeInstalledCorpCardsChoiceOptions(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeInstalledCorpCardsChoiceOptions as any)(...args);
}

function startHuntClubBbsExposeChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startHuntClubBbsExposeChoice as any)(...args);
}

function startExposeInstalledCorpCardsChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.startExposeInstalledCorpCardsChoice as any)(...args);
}

function resolveHuntClubBbsExposeChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveHuntClubBbsExposeChoice as any)(...args);
}

function resolveExposeInstalledCorpCardsChoice(...args: any[]): any {
  return (choiceHiddenZoneRuntime.resolveExposeInstalledCorpCardsChoice as any)(...args);
}

function outermostIceExposures(...args: any[]): any {
  return (choiceHiddenZoneRuntime.outermostIceExposures as any)(...args);
}

function exposeOutermostIceOfEachDataFort(...args: any[]): any {
  return (choiceHiddenZoneRuntime.exposeOutermostIceOfEachDataFort as any)(...args);
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
      (cardId: CardInstanceId) =>
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
    .filter((cardId: CardInstanceId) =>
      hasCorpUtilityKind(state, cardId, "disinfectant_avoid_virus_counter"),
    )
    .filter((cardId: CardInstanceId) => !used.has(cardId))
    .sort()[0];
  if (!sourceId || state.corp.credits < 1) return { prevented: false, creditsPaid: 0 };
  state.corp.credits -= 1;
  flags.disinfectantUsedSourceIdsThisTurn = [
    ...(flags.disinfectantUsedSourceIdsThisTurn ?? []),
    sourceId,
  ];
  return { prevented: true, creditsPaid: 1 };
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

function runnerCanPayInstallCost(
  state: GameState,
  amount: number,
  cardType: CardDefinition["type"],
): boolean {
  if (amount <= 0) return true;
  if (cardType === "program")
    return availableRunnerProgramInstallCredits(state) >= amount;
  return state.runner.credits >= amount;
}

function runnerCostPenaltySupportCreditCapacity(state: GameState): number {
  let availableCredits = state.runner.credits;
  let gainedCredits = 0;
  for (const cardId of runnerInstalledCardIds(state).slice().sort()) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.tapped === true) continue;
    const implementation = cardImplementationForDefinitionId(instance.definitionId);
    const abilities = implementation?.abilities ?? [];
    let bestNet = 0;
    for (const ability of abilities) {
      if (ability.kind !== "activated") continue;
      if (ability.timing !== "runner_cost_penalty_support") continue;
      if (ability.costs.some((cost) => cost.kind === "action")) continue;
      const creditCost = ability.costs
        .filter((cost) => cost.kind === "credit")
        .reduce((sum, cost) => sum + cost.amount, 0);
      if (creditCost > availableCredits) continue;
      const creditGain = ability.effects.reduce((sum, effect) => {
        if (
          effect.kind !== "gain_credits" ||
          (effect.recipient !== "runner" && effect.recipient !== "controller")
        )
          return sum;
        return sum + effect.amount;
      }, 0);
      const net = creditGain - creditCost;
      if (net > bestNet) bestNet = net;
    }
    if (bestNet <= 0) continue;
    availableCredits += bestNet;
    gainedCredits += bestNet;
  }
  return gainedCredits;
}

function openRunnerCostPenaltySupportWindow(
  state: GameState,
  legalAction: LegalAction,
  amount: number,
  cardType: CardDefinition["type"],
): boolean {
  const available = cardType === "program"
    ? availableRunnerProgramInstallCredits(state)
    : state.runner.credits;
  if (
    legalAction.side !== "runner" ||
    amount <= 0 ||
    available + runnerCostPenaltySupportCreditCapacity(state) < amount
  )
    return false;
  state.runnerCostPenaltySupportWindow = {
    windowId: `runner_cost_penalty_support.${state.stateVersion + 1}`,
    originalActionId: legalAction.actionId,
    amountDue: amount,
    kind: "cost",
    createdAtStateVersion: state.stateVersion,
  };
  state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerCostPenaltySupportWindowOpened: true,
    runnerCostPenaltySupportWindowId: state.runnerCostPenaltySupportWindow.windowId,
  };
  return true;
}

function closeRunnerCostPenaltySupportWindowForPayment(
  state: GameState,
  legalAction: LegalAction,
  amount: number,
): void {
  const window = state.runnerCostPenaltySupportWindow;
  if (!window) return;
  if (
    window.originalActionId !== legalAction.actionId ||
    window.kind !== "cost" ||
    window.amountDue !== amount
  )
    throw new Error("Das Runner-Kostenfenster passt nicht zur Zahlung.");
  delete state.runnerCostPenaltySupportWindow;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerCostPenaltySupportWindowClosed: true,
  };
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


const runtimeDomainDeps = {
  AUJOURD_OUI_RESOURCE_CARD_ID,
  BUTCHER_BOY_ID,
  COCKROACH_ID,
  CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
  CORP_HQ_AGENDA_REVEAL_CARD_ID,
  CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
  DEAL_WITH_MILITECH_ID,
  DEMO_CARDS_BY_ID,
  HIDDEN_ZONE_REORDER_ASSET_CARD_IDS,
  INITIAL_HAND_SIZE,
  MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID,
  MYSTERY_BOX_ID,
  NEVINYRRAL_ID,
  RONIN_AROUND_ID,
  RUN_ACCESS_PRESSURE_EVENT_CARD_ID,
  SELF_MODIFYING_CODE_ID,
  SERVER_EXPOSE_PROGRAM_CARD_IDS,
  SHORT_CIRCUIT_RESOURCE_CARD_ID,
  SKIVVISS_ID,
  SNEAK_PREVIEW_ID,
  STACK_SEARCH_PROGRAM_CARD_IDS,
  STACK_TOP_REORDER_RESOURCE_CARD_ID,
  STACK_TOP_REVEAL_PROGRAM_CARD_IDS,
  TOO_MANY_DOORS_ID,
  accessEffectHandlerHost,
  addCardCounter,
  affordableRezzedInstalledIceIdsForRunner,
  agendaPointsForScoredCard,
  appendResolvedEffectsToPayload,
  applyRunnerStartOfTurnEffects,
  availableRunnerProgramInstallCredits,
  cardCounter,
  cardHasSubtype,
  cardImplementationForDefinitionId,
  cardImplementationRuntimeDeps,
  citySurveillanceSourceIds,
  clearCardCounters,
  cockroachCounterTotal,
  cockroachRandomHqDiscardActive,
  completeDiscardPhase,
  corpInstallRezSequenceHandlerHost,
  corpInstalledCardIds,
  corpRootAgendaOrNodeCapacityInServer,
  corpRootMainCardIdsInServer,
  corpScoredAgendaForfeitTargets,
  creditCostForAction,
  definitionFor,
  discardRandomCorpHqCards,
  drawCorpCards,
  emptyRunnerDrawSummary,
  encounterResolutionHostForState,
  encounterSpecialWindowHostForState,
  ensureRunnerTurnFlags,
  executeCardImplementationEffects,
  executeCardImplementationLifecycleEffects,
  fortPassWindowHostForState,
  fortRunSideFamiliesHostForState,
  handForSide,
  handleCorpInstallRezSequenceChoice,
  handleCorpZoneChoice,
  handleHiddenZoneArrangeChoice,
  handleHiddenZoneNonSearchChoice,
  handleHiddenZoneSearchChoice,
  handleScoredAgendaFlowChoice,
  hasCardImplementationMemoryUnitModifier,
  hasCorpUtilityKind,
  hasInstalledUniqueCardDefinition,
  hasSuccessfulHqRunThisTurn,
  hostedCardsOn,
  isP358HiddenReplacementCompatibilityChoiceSource,
  isUniqueCard,
  leavePlayCleanupImplementationsForCard,
  lookTopStackShowToCorpThenInstallMatchingTargets,
  maxHandSize,
  mergeRunnerDrawSummary,
  microtechBackupDriveIds,
  mustArrayValue,
  mustServer,
  nextRandom,
  outermostIceIndex,
  poxCountersForServer,
  publicCardTitle,
  publicServerLabel,
  publicServerLabelForCard,
  recordStateRandomMarkers,
  remainingReplacementLongtailKindForCard,
  removeFromAllZones,
  resolveAardvarkInterceptionChoice,
  resolveAccessChimeraDaemonTrashChoice,
  resolveAccessInstalledRunnerProgramReturnChoice,
  resolveAccessPaymentChoice,
  resolveCardImplementationAdvancementDistributionChoice,
  resolveCardImplementationMoveAdvancementChoice,
  resolveCodeViralCachePurgeChoice,
  resolveCrashEverettDrawChoice,
  resolveEventModificationChoice,
  resolveHammerStealthLossChoice,
  resolveInvestmentFirmCreditChoice,
  resolveMicrotechAiInterfacePreAccessChoice,
  resolvePassRezzedIceProgramTrashChoiceInRunModule,
  resolvePattelsVirusCounterChoice,
  resolvePostMeatDamageHiddenResourceChoice,
  resolvePowerGridOverloadChoice,
  resolvePriorityWreckSpendChoice,
  resolveReplacementChoice,
  resolveRunnerPrivateLookChoice,
  resolveRunnerProgramTrashBeforeInstallChoice,
  resolveSingaporeCityGridSwapChoice,
  resolveSpeedTrapRezInterruptChoice,
  resolveSuccessfulRunInterventionChoiceInRunModule,
  resolveSystematicLayoffsAdvancementChoice,
  resolveTooManyDoorsSecretSpendChoiceInRunModule,
  resolveTraceChoice,
  resolveViral15ProgramTrashChoiceInRunModule,
  rezCostForCard,
  rezzedBlackIceIds,
  rezzedCorpRootCardIds,
  rezzedInstalledIceIds,
  rollDeterministicDie,
  runAccessTransitionHost,
  runEndCleanupHost,
  runRezWindowHostForState,
  runnerEventLongtailForDefinition,
  runnerEventLongtailKindForDefinition,
  runnerInstalledCardIds,
  runnerMemoryLimit,
  runnerProgramUsesMemory,
  runnerStoleAgendaSubtypeThisTurn,
  runnerUtilityLongtailKindForDefinition,
  sanitizeId,
  scoredAgendaFlowHost,
  scoredAgendaImplementationForDefinition,
  scoredAgendaKindForDefinition,
  searchStackInstallTargets,
  selectedChoiceIds,
  setCardCounter,
  setHostedOn,
  shouldLoadLegacyRecurringCredits,
  shuffleRunnerStackAndRefreshZones,
  shuffleStateIds,
  sneakPreviewInstallableProgramIds,
  spendCardCounter,
  spendCredits,
  spendRunnerInstallCredits,
  startAujourdOuiTop5Activation,
  startIncubatorTransformChoice,
  startRun,
  startRunnerStackArrangeChoice,
  startRunnerStackSearchChoiceActivation,
  successfulRunInterventionHost,
  traceOrchestrationHost,
  trashCorpInstalledCardToArchives,
  trashRunnerInstalledCardToHeap,
  uniqueDirectLongtailImplementationForDefinition,
  uniqueDirectLongtailKindForDefinition,
  unrezzedInstalledIceIds,
  mustInstance,
  credits,
  withoutVariableIceState,
  DEFAULT_CONTROLLERS,
  PROTEUS_ARMAGEDDON_ID,
  PROTEUS_SCALDAN_ID,
  PROTEUS_TAXMAN_ID,
  PROTEUS_VIRAL_PIPELINE_ID,
  RUNNER_EVENT_RESOLVERS,
  TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS,
  abilityMetadata,
  accessFlow,
  accessFlowHost,
  acmeSavingsAndLoanObligationCount,
  activatedCardImplementationExecutionHost,
  activeCrashEverettSourceId,
  addAcmeSavingsAndLoanObligation,
  addCounterToAllInstalledRunnerIcebreakers,
  addCurrentRunAccessCount,
  addHackerTrackerTraceCounters,
  addRunnerFutureActionDebt,
  addVirusCounterWithDisinfectantPrevention,
  addVisibleCardCounter,
  advanceableInstalledCardTargets,
  advancementDistributionOptions,
  agendaPoints,
  appendRegionReplacementTrashEffect,
  applyActionHostComposition,
  applyAiBoonRunStart,
  applyCorpStartOfTurnEffects,
  applyEffectCommands,
  applyProteusPurgeableRunnerVirusCorpStartEffects,
  applyQuestForCattekinStartOfTurn,
  applyRunnerDrawSummaryPayload,
  applyRunnerForgoNextAction,
  applyRunnerTraceCounterRunStartEffects,
  applySystematicLayoffsAdvancementPlacement,
  archivesAccessRequiresDecisionOrEffect,
  assertBreakSubroutineCostQuoteValid,
  assertCorpIceInstallCostValid,
  assertCurrentSubroutineMatchesLegalAction,
  assertNonNegativeAmount,
  assertPositiveIntegerAmount,
  automaticCounterChangeEffect,
  automaticDrawCardsEffect,
  automaticGainCreditsEffect,
  automaticLoseCreditsEffect,
  automaticStealAgendaEffect,
  automaticTagEffect,
  automaticTrashCardEffect,
  availableRunnerTagRemovalCredits,
  awardRunnerEventAgendaPoint,
  backupProgramsOnMicrotechBeforeTrash,
  boardStateActionExecutionHost,
  breachStateHost,
  breakAbilityForLegalAction,
  breakSubroutineCostBreakdown,
  canHostProgramOnDaemon,
  canInstallCorpRootCardInServer,
  canInstallRunnerProgramFromZone,
  canOverlayProgramOnZetatechSoftwareInstaller,
  canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
  cardImplementationAgendaPointInstallCost,
  cardImplementationEffectAdapters,
  cardImplementationRunnerEventResolver,
  cardInstallCapabilitiesForDefinition,
  choiceAction,
  chooseCorpAgendasForPointCost,
  cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay,
  clearEdgerunnerTempsInstallFlags,
  clearValuPakProgramInstallFlags,
  clickCostForAction,
  closeRunnerCostPenaltySupportWindowForPayment,
  codeViralCachePurgePreserveTargets,
  consumeEdgerunnerTempsInstallAction,
  consumeRunnerFutureActionDebt,
  consumeValuPakProgramInstallAction,
  continueRun,
  continueV1921PlayfulAiLoop,
  corpAgendaCounterOperationTarget,
  corpAgendaPointTotal,
  corpIceInstallAdditionalCost,
  corpIceInstallBaseCost,
  corpIceInstallTotalCost,
  corpOperationResolutionHost,
  corpRegionUpgradeIdsInServer,
  corpRunnerActionPaidWindowActions,
  corpScoredBlackOpsAgendaLastTurn,
  corpSpecialDamageAbilityHost,
  corpTraceDamageAbilityHost,
  corpTracePaymentDeps,
  corpUtilityImplementationForCard,
  corpZoneChoiceHandlerHost,
  counterLifecycleRuntimeDepsHost,
  counterUtilityTriggerExecutionHost,
  creditEconomyExecutionHost,
  creditTextForPrompt,
  daemonHostedMemoryUsed,
  daemonHostingCapacity,
  damageCoreHost,
  diePromptText,
  discardChoice,
  drawRunnerCard,
  drawRunnerCards,
  dupreStrengthCounterBonus,
  edgerunnerTempsInstallActionsRemaining,
  effectiveAgendaDifficultyDeps,
  effectiveSubtypesForCard,
  encounterEntryHostForState,
  encounterPrintedEffectHostForState,
  encounterPrintedNonTraceHostForState,
  encounterTemporaryTraceCreditsAvailable,
  endTurn,
  executeEffectCommands,
  expireCorporateRetreatInstallCreditAbilities,
  exposeCorpCardInServer,
  exposeInstalledCorpCardForImplementation,
  exposeInstalledCorpCardLabel,
  exposeInstalledCorpCardTargets,
  exposeInstalledCorpCardsChoiceOptions,
  exposeOutermostIceOfEachDataFort,
  exposedCorpCardInServer,
  finishRun,
  forfeitCorpAgendaForPointCost,
  forfeitRunnerAgendaForPointCost,
  fortCapacityModifiersForCard,
  gameCardImplementationRuntimeDepsHost,
  hackerTrackerCardIds,
  hackerTrackerCounterTotal,
  hackerTrackerCounterType,
  hasHiddenResourceAccessStartActions,
  hasInstallCapabilityKindForDefinition,
  hasInstalledMicrotechTrodeSet,
  hiddenReplacementLongtailForDefinition,
  hiddenZoneArrangeChoiceHandlerHost,
  hiddenZoneNonSearchChoiceHandlerHost,
  hiddenZoneRuntimeDepsHost,
  hiddenZoneSearchActivationHandlerHost,
  hiddenZoneSearchActivationTargetHost,
  hiddenZoneSearchChoiceHandlerHost,
  hiddenZoneSearchHandlerHostBase,
  hostedProgramStrengthModifier,
  huntClubBbsExposeOptionLabel,
  huntClubBbsExposeTargets,
  iceChoiceLabelForSide,
  iceStrengthBonusFor,
  iceStrengthFor,
  icebreakerEncounterStrengthBonus,
  icebreakerHasSpecial,
  identityDefinition,
  identityModifierAmount,
  incubatorCounterTotal,
  installCardHost,
  installRezRuntimeDepsHost,
  installRunnerProgramForFree,
  installRunnerProgramFromStackWithoutClick,
  installRunnerProgramFromZoneWithoutClick,
  installTargetBindingForDefinition,
  installedAgendaOperationTarget,
  installedCodeViralCacheIds,
  installedCorpCardServerContext,
  installedRunnerConnectionIds,
  installedRunnerIcebreakerIds,
  installedRunnerProgramTrashOptionsForInstall,
  installedRunnerVirusSourceIds,
  installedVirusCounterTotalForDefinition,
  isAcmeSavingsAndLoanDefinition,
  isCitySurveillanceCard,
  isCorpInstallableCardType,
  isHackerTrackerCentralCard,
  isInstalledCorpCardAdvanceable,
  isInvestmentFirmCard,
  isRegionUpgrade,
  isV097OrLater,
  isV099OrLater,
  isVersionAtLeast,
  isVisibleVirusCounterCardForRunner,
  krumzTraceBitCardIds,
  krumzTraceBitTotal,
  legalActionHostComposition,
  mainActionHostComposition,
  microtechTrodeSetBreakAdditionalCost,
  movableAdvancementSourceIds,
  moveAdvancementOptions,
  mustInstallInsideSubsidiaryDataFort,
  newsgroupTauntingRunStartTax,
  normalizeSubtypeLabel,
  openPostMeatDamageReactionWindow,
  openRunnerCostPenaltySupportWindow,
  outermostIceExposures,
  parseAdvancementDistributionValue,
  parseCodeViralCachePreserveOption,
  parsePlayfulAiChoiceSource,
  parsePlayfulAiSplit,
  parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
  passCurrentEncounteredIce,
  pendingChoiceResolutionHost,
  permanentIcebreakerStrengthCounterBonus,
  pickRunnerAgendaForAgendaPointCost,
  playCardExecutionHost,
  playfulAiSplitOptions,
  postMeatDamageHiddenResourceCandidates,
  powerGridOverloadEligibleHardwareIds,
  powerGridOverloadLegalActions,
  powerGridOverloadTrashCountFromChoiceSource,
  powerGridOverloadTrashCountFromPayload,
  poxInstallTax,
  preventOneVirusCounterWithDisinfectant,
  printedCostCardImplementationMakeRunEffect,
  privateLookCardIds,
  processDiscardStep,
  publicIcePositionLabelForCard,
  publicIceSelectionLabelForCard,
  pumpAbilityForLegalAction,
  pumpAmountForLegalAction,
  pumpDurationForLegalAction,
  pushCorpTraceDamageOrCardImplementationActions,
  queueIncubatorStartOfTurnTransforms,
  rabbitTraceLimitReductionForIceTrace,
  randomCorpHqCardsWithoutReplacement,
  randomCorpHqDiscard,
  recordBartmossEncounterUsage,
  recordSnowballBreakUsage,
  refreshRecurringCredits,
  relativeDamageSubroutineForCurrentEncounter,
  relativeIceStrengthBonusFor,
  relativeTraceSubroutinesForCurrentEncounter,
  remainingReplacementLongtailImplementationForCard,
  remainingReplacementLongtailImplementationForDefinition,
  remainingReplacementLongtailKindForDefinition,
  removeAcmeSavingsAndLoanObligation,
  requireRunnerTagged,
  requiresDataFortInstallTarget,
  resolveAcmeSavingsAndLoanEndOfCorpTurn,
  resolveAgendaCounterOperation,
  resolveAnonymousTipDerezBlackIceChoice,
  resolveBizarreEncryptionDelayedAgendas,
  resolveBlinkBreakSubroutineAction,
  resolveCardImplementationAccessPaymentChoice,
  resolveChimeraDaemonTrashChoice,
  resolveCoreCommandJettisonIceChoice,
  resolveCorpInstalledEconomyAction,
  resolveDealWithMilitech,
  resolveDiscardChoice,
  resolveExposeInstalledCorpCardsChoice,
  resolveFieldReporterEndOfRunnerTurn,
  resolveForgedActivationOrdersCorpChoice,
  resolveForgedActivationOrdersTargetChoice,
  resolveHuntClubBbsExposeChoice,
  resolveIncubatorTransformChoice,
  resolveManagementShakeUpOperation,
  resolveMitWestTier,
  resolveMultiBreakSubroutinesAction,
  resolveOmniscienceFoundationEndTurnTag,
  resolveOpenEndedMileageProgramReturnChoice,
  resolveP358HiddenReplacementChoice,
  resolvePlayfulAiDiceLoopEvent,
  resolvePostOnPlayGenericFollowups,
  resolvePowerGridOverloadOperation,
  resolvePreyingMantisEndOfRunnerTurnDamage,
  resolveProteusRunnerProgramReturnChoice,
  resolveRunnerHostingChoice,
  resolveRunnerInstalledConnectionTrashBadPublicityChoice,
  resolveRunnerLastTurnInstalledResourceTargetId,
  resolveRunnerTargetedEventImplementation,
  resolveSecurityCodeWormChipTrashIceChoice,
  resolveSetupMulliganChoice,
  resolveSneakPreviewTemporaryInstallReturns,
  resolveSystematicLayoffsAdvancementOperation,
  resolveTraceHardwareWreckerSuccess,
  resolveTraceTrashRunnerResourceSuccess,
  resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
  resolveV1911CorporateDownsizing,
  resolveV1911RunnerHiddenZoneAbility,
  resolveV1921PlayfulAiChoice,
  restoreCodeViralCachePreservedCounters,
  returnRunnerInstalledCardToGrip,
  returnRunnerInstalledProgramsToGripForAccess,
  revealCorpRdTop,
  revealRunnerStackTop,
  rezActionExecutionHost,
  rezCardHost,
  rezzedIceOutsideThisIceCount,
  rezzedInvestmentFirmIds,
  rootInstallRezzesOnInstall,
  runAccessLegalActionHostComposition,
  runBreakSubroutineAdditionalCost,
  runCardImplementationActionHost,
  runFlow,
  runFortTriggerExecutionHost,
  runMovementHostForState,
  runRemainderStrengthBonusForBreaker,
  runStartTaxForServerUpgrades,
  runnerAccessActionHost,
  runnerActionsPerTurn,
  runnerBreakerActionExecutionHost,
  runnerCanPayInstallCost,
  runnerCostPenaltySupportCreditCapacity,
  runnerCounterDisplayName,
  runnerDrawActionContext,
  runnerDrawSummaryPublicPayload,
  runnerEncounterActionHostForState,
  runnerHasInstalledCardDefinition,
  runnerHasInstalledDefinition,
  runnerInstallableProgramIdsForValuPak,
  runnerInstalledCardCountByDefinition,
  runnerInstalledHardwareTrashTarget,
  runnerInstalledResourceLastTurn,
  runnerLastTurnInstalledResourceIds,
  runnerProgramInstallMemoryReachableAfterTrash,
  runnerProgramInstallRecurringCreditSourceIds,
  runnerRecurringCredits,
  runnerRunAttemptsLastTurn,
  runnerRunAttemptsThisGame,
  runnerSpecialTriggerExecutionHost,
  runnerStoleAgendaLastTurn,
  runnerStolenAgendaAdvancementCountersLastTurn,
  runnerTagRemovalRecurringCreditSourceIds,
  runnerTagRemovalRecurringCredits,
  runnerTraceCounterEffectDefinitions,
  runnerTracePaymentDeps,
  runnerTrashedNodeLastTurn,
  runnerUtilityLongtailImplementationForCard,
  runnerUtilityLongtailKindForCard,
  scoredAgendaAbilityHost,
  scoredAgendaImplementationForDefinitionId,
  selectedChoiceCardIds,
  selectedChoiceCardIdsForChoice,
  serverDifficultyIncreaseFromFaitAccompli,
  serverDifficultyReductionFromUpgrades,
  setupMulliganChoice,
  shouldOfferRunnerProgramTrashBeforeInstall,
  shouldOpenInvestmentFirmCreditChoice,
  shuffleCorpCardIntoRd,
  shuffleGripTrashAndStackThenDrawForCardImplementation,
  shuffleRunnerStack,
  skivvissCounterTotal,
  sourcePartsForP334Choice,
  specialZoneHarnessActions,
  spendCorpAgendaPointCost,
  spendEncounterTemporaryTraceCredits,
  spendHackerTrackerCounters,
  spendKrumzTraceBits,
  spendRunnerAccessTrashCredits,
  spendRunnerTagRemovalCredits,
  spendVisibleCardCounter,
  spyCountersForServer,
  stableSubtypeList,
  startAnonymousTipDerezBlackIceChoice,
  startCardImplementationAdvancementDistributionChoice,
  startCardImplementationMoveAdvancementChoice,
  startCodeViralCachePurgeChoice,
  startCoreCommandJettisonIceChoice,
  startCorpTurn,
  startCrashEverettDrawChoice,
  startDiscardPhase,
  startExpertScheduleAnalyzerPostAccessChoice,
  startExposeInstalledCorpCardsChoice,
  startForgedActivationOrdersTargetChoice,
  startHuntClubBbsExposeChoice,
  startInvestmentFirmCreditChoice,
  startOpenEndedMileageProgramReturnChoice,
  startPowerGridOverloadChoice,
  startRunActionExecutionHost,
  startRunnerHostingChoice,
  startRunnerPrivateLookAtSpecificCorpCards,
  startRunnerPrivateLookChoice,
  startRunnerProgramTrashBeforeInstallChoice,
  startRunnerTurn,
  startSecurityCodeWormChipTrashIceChoice,
  startSelfModifyingCodeFreeMuChoice,
  startSystematicLayoffsAdvancementChoice,
  startV1921PlayfulAiChoice,
  startVirusCounterRunnerPrivateLookAtStart,
  subroutinesForCurrentEncounter,
  swapCorpHqAndRdTop,
  systematicLayoffsLegalActions,
  systematicLayoffsPlacementOptions,
  takeSetupMulligan,
  totalCounters,
  traceCounterEffectDefinitionFor,
  traceRuntimeDepsHost,
  trashCorpInstalledCardsInScoredSourceServer,
  trashFaceupRdCardsForCascade,
  trashOlderRegionUpgradesInServer,
  trashPowerGridOverloadHardware,
  trashRunnerInstalledProgram,
  triggerAbilityExecutionHost,
  turnBasicExecutionHost,
  uniqueDirectLongtailImplementationForCard,
  uniqueDirectLongtailKindForCard,
  untapRunnerCardsAtTurnStart,
  v1915InstalledRevealHelperIds,
  validateAdvancementDistribution,
  validateCorpInstalledEconomyAction,
  validateDeckDefinition,
  valuPakProgramInstallActionsRemaining,
  valuPakTemporaryProgramInstallCredits,
  variableRezForDefinition,
  variableTraceSubroutineForCurrentEncounter,
  virusCounterCascadeTrashAtCorpStart,
  virusCounterCreditsAtRunnerStart,
  virusCounterDrawsAtCorpStart,
  virusCounterImplementationForCard,
  virusCounterImplementationForDefinition,
  visibleVirusCounterTargetIds,
};

const stateRuntimeServices = createStateRuntimeServices(runtimeDomainDeps);
const cardRuntimeHosts = createCardRuntimeHosts(runtimeDomainDeps);
const flowRuntimeHosts = createFlowRuntimeHosts(runtimeDomainDeps);
const actionRuntimeHosts = createActionRuntimeHosts(runtimeDomainDeps);

const lifecycleRuntime = createLifecycleRuntime(runtimeDomainDeps);
const turnCorpRuntime = createTurnCorpRuntime(runtimeDomainDeps);
const choiceHiddenZoneRuntime = createChoiceHiddenZoneRuntime(runtimeDomainDeps);

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

function cloneState<T>(state: T): T {
  return structuredClone(state) as T;
}
