// @ts-nocheck
import * as runtimeDelegates from "./runtime-delegates";
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
  activeRunActionSpendingCapSourceIds,
  availableRunnerRunStartCredits,
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  payRunStartTaxCredits,
  recordRunActionSpendingCapSpend,
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
  resolveFullyBrokenPassedIceTrash as resolveFullyBrokenPassedIceTrashInRunModule,
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
  clearActivityGatedFortRunMarkers,
  isActivityGatedFortRunBlocked,
  isFortTraceBitPoolSource,
  markFortActivityForRunGate,
  fortTraceBitPoolSource,
  fortTraceBitPoolTotal,
  fortTraceBitPoolCapacityForCard,
  resolveAardvarkInterceptionChoice,
  resolveHammerStealthLossChoice,
  runnerStealthRecurringCredits,
  shouldOpenAardvarkInterception,
  spendFortTraceBitPool,
  startAardvarkInterceptionChoice,
  validateActivityGatedFortRun,
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

const { abilityMetadata, accessEffectHandlerHost, accessFlowHost, acmeSavingsAndLoanObligationCount, activatedCardImplementationExecutionHost, activeCrashEverettSourceId, addAcmeSavingsAndLoanObligation, addCounterToAllInstalledRunnerIcebreakers, addCurrentRunAccessCount, addHackerTrackerTraceCounters, addRunnerFutureActionDebt, addVirusCounterWithDisinfectantPrevention, addVisibleCardCounter, advanceableInstalledCardTargets, advancementDistributionOptions, affordableRezzedInstalledIceIdsForRunner, agendaPoints, appendRegionReplacementTrashEffect, appendResolvedEffectsToPayload, applyAiBoonRunStart, applyCorpStartOfTurnEffects, applyPurgeableRunnerVirusCorpStartEffects, applyStartTurnRandomEffectTables, applyRunnerDrawSummaryPayload, applyRunnerForgoNextAction, applyRunnerStartOfTurnEffects, applyRunnerTraceCounterRunStartEffects, applySystematicLayoffsAdvancementPlacement, archivesAccessRequiresDecisionOrEffect, assertBreakSubroutineCostQuoteValid, assertCorpIceInstallCostValid, assertCurrentSubroutineMatchesLegalAction, assertNonNegativeAmount, assertPositiveIntegerAmount, automaticCounterChangeEffect, automaticDrawCardsEffect, automaticGainCreditsEffect, automaticLoseCreditsEffect, automaticStealAgendaEffect, automaticTagEffect, automaticTrashCardEffect, availableRunnerProgramInstallCredits, availableRunnerTagRemovalCredits, awardRunnerEventAgendaPoint, backupProgramsOnMicrotechBeforeTrash, boardStateActionExecutionHost, breachStateHost, breakAbilityForLegalAction, breakSubroutineCostBreakdown, canHostProgramOnDaemon, canInstallCorpRootCardInServer, canInstallRunnerProgramFromZone, canOverlayProgramOnZetatechSoftwareInstaller, canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity, cardHasSubtype, cardImplementationRunnerEventResolver, cardInstallCapabilitiesForDefinition, choiceAction, chooseCorpAgendasForPointCost, cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay, clearEdgerunnerTempsInstallFlags, clearValuPakProgramInstallFlags, clickCostForAction, closeRunnerCostPenaltySupportWindowForPayment, cockroachCounterTotal, cockroachRandomHqDiscardActive, codeViralCachePurgePreserveTargets, completeDiscardPhase, consumeEdgerunnerTempsInstallAction, consumeRunnerFutureActionDebt, consumeValuPakProgramInstallAction, continueRun, continueV1921PlayfulAiLoop, corpAgendaCounterOperationTarget, corpAgendaPointTotal, corpIceInstallAdditionalCost, corpIceInstallBaseCost, corpIceInstallTotalCost, corpInstallRezSequenceHandlerHost, corpOperationResolutionHost, corpRegionUpgradeIdsInServer, corpRootAgendaOrNodeCapacityInServer, corpRunnerActionPaidWindowActions, corpScoredAgendaForfeitTargets, corpSpecialDamageAbilityHost, corpTraceDamageAbilityHost, corpUtilityImplementationForCard, corpZoneChoiceHandlerHost, counterUtilityTriggerExecutionHost, creditCostForAction, creditEconomyExecutionHost, creditTextForPrompt, daemonHostedMemoryUsed, daemonHostingCapacity, diePromptText, discardChoice, discardRandomCorpHqCards, drawRunnerCard, drawRunnerCards, dupreStrengthCounterBonus, edgerunnerTempsInstallActionsRemaining, effectiveSubtypesForCard, emptyRunnerDrawSummary, encounterEntryHostForState, encounterPrintedEffectHostForState, encounterPrintedNonTraceHostForState, encounterResolutionHostForState, encounterSpecialWindowHostForState, encounterTemporaryTraceCreditsAvailable, endTurn, executeEffectCommands, expireCorporateRetreatInstallCreditAbilities, exposeCorpCardInServer, exposedCorpCardInServer, exposeInstalledCorpCardForImplementation, exposeInstalledCorpCardLabel, exposeInstalledCorpCardsChoiceOptions, exposeInstalledCorpCardTargets, exposeOutermostIceOfEachDataFort, forfeitCorpAgendaForPointCost, forfeitRunnerAgendaForPointCost, fortCapacityModifiersForCard, fortPassWindowHostForState, fortRunSideFamiliesHostForState, hackerTrackerCardIds, hackerTrackerCounterTotal, hackerTrackerCounterType, hasCorpUtilityKind, hasHiddenResourceAccessStartActions, hasInstallCapabilityKindForDefinition, hasInstalledMicrotechTrodeSet, hasInstalledUniqueCardDefinition, hiddenReplacementLongtailForDefinition, hiddenZoneArrangeChoiceHandlerHost, hiddenZoneNonSearchChoiceHandlerHost, hiddenZoneSearchActivationHandlerHost, hiddenZoneSearchActivationTargetHost, hiddenZoneSearchChoiceHandlerHost, hiddenZoneSearchHandlerHostBase, hostedProgramStrengthModifier, huntClubBbsExposeOptionLabel, huntClubBbsExposeTargets, icebreakerEncounterStrengthBonus, icebreakerHasSpecial, iceChoiceLabelForSide, iceStrengthBonusFor, iceStrengthFor, identityDefinition, identityModifierAmount, incubatorCounterTotal, installCardHost, installedAgendaOperationTarget, installedCodeViralCacheIds, installedCorpCardServerContext, installedRunnerConnectionIds, installedRunnerIcebreakerIds, installedRunnerProgramTrashOptionsForInstall, installedRunnerVirusSourceIds, installedVirusCounterTotalForDefinition, installRunnerProgramForFree, installRunnerProgramFromStackWithoutClick, installRunnerProgramFromZoneWithoutClick, installTargetBindingForDefinition, isAcmeSavingsAndLoanDefinition, isCitySurveillanceCard, isCorpInstallableCardType, isHackerTrackerCentralCard, isInstalledCorpCardAdvanceable, isInvestmentFirmCard, isRegionUpgrade, isUniqueCard, isVisibleVirusCounterCardForRunner, leavePlayCleanupImplementationsForCard, mergeRunnerDrawSummary, microtechBackupDriveIds, microtechTrodeSetBreakAdditionalCost, movableAdvancementSourceIds, moveAdvancementOptions, mustInstallInsideSubsidiaryDataFort, runStartTaxForCorpRootAssets, normalizeSubtypeLabel, openPostMeatDamageReactionWindow, openRunnerCostPenaltySupportWindow, outermostIceExposures, outermostIceIndex, parseAdvancementDistributionValue, parseCodeViralCachePreserveOption, parsePlayfulAiChoiceSource, parsePlayfulAiSplit, parseRunnerInstalledConnectionTrashBadPublicityChoiceSource, passCurrentEncounteredIce, pendingChoiceResolutionHost, permanentIcebreakerStrengthCounterBonus, playCardExecutionHost, playfulAiSplitOptions, postMeatDamageHiddenResourceCandidates, powerGridOverloadEligibleHardwareIds, powerGridOverloadLegalActions, powerGridOverloadTrashCountFromChoiceSource, powerGridOverloadTrashCountFromPayload, poxCountersForServer, poxInstallTax, preventOneVirusCounterWithDisinfectant, printedCostCardImplementationMakeRunEffect, processDiscardStep, publicCardTitle, publicIcePositionLabelForCard, publicIceSelectionLabelForCard, pumpAbilityForLegalAction, pumpAmountForLegalAction, pumpDurationForLegalAction, pushCorpTraceDamageOrCardImplementationActions, queueIncubatorStartOfTurnTransforms, rabbitTraceLimitReductionForIceTrace, randomCorpHqCardsWithoutReplacement, randomCorpHqDiscard, recordBartmossEncounterUsage, recordSnowballBreakUsage, refreshRecurringCredits, relativeDamageSubroutineForCurrentEncounter, relativeIceStrengthBonusFor, relativeTraceSubroutinesForCurrentEncounter, remainingReplacementLongtailImplementationForCard, remainingReplacementLongtailImplementationForDefinition, remainingReplacementLongtailKindForCard, remainingReplacementLongtailKindForDefinition, removeAcmeSavingsAndLoanObligation, requiresDataFortInstallTarget, resolveAcmeSavingsAndLoanEndOfCorpTurn, resolveAgendaCounterOperation, resolveAnonymousTipDerezBlackIceChoice, resolveDelayedAccessEffects, resolveBlinkBreakSubroutineAction, resolveCardImplementationAccessPaymentChoice, resolveCardImplementationAdvancementDistributionChoice, resolveCardImplementationMoveAdvancementChoice, resolveChimeraDaemonTrashChoice, resolveCodeViralCachePurgeChoice, resolveCoreCommandJettisonIceChoice, resolveCorpInstalledEconomyAction, resolveCrashEverettDrawChoice, resolveDealWithMilitech, resolveDiscardChoice, resolveExposeInstalledCorpCardsChoice, resolveFieldReporterEndOfRunnerTurn, resolveForgedActivationOrdersCorpChoice, resolveForgedActivationOrdersTargetChoice, resolveHuntClubBbsExposeChoice, resolveIncubatorTransformChoice, resolveInvestmentFirmCreditChoice, resolveManagementShakeUpOperation, resolveMitWestTier, resolveMultiBreakSubroutinesAction, resolveOmniscienceFoundationEndTurnTag, resolveOpenEndedMileageProgramReturnChoice, resolveP358HiddenReplacementChoice, resolvePlayfulAiDiceLoopEvent, resolvePostMeatDamageHiddenResourceChoice, resolvePostOnPlayGenericFollowups, resolvePowerGridOverloadChoice, resolvePowerGridOverloadOperation, resolveDelayedEndTurnDamageEffects, resolveRunnerProgramReturnChoice, resolveRunnerHostingChoice, resolveRunnerInstalledConnectionTrashBadPublicityChoice, resolveRunnerPrivateLookChoice, resolveRunnerProgramTrashBeforeInstallChoice, resolveRunnerTargetedEventImplementation, resolveSecurityCodeWormChipTrashIceChoice, resolveSetupMulliganChoice, resolveSneakPreviewTemporaryInstallReturns, resolveSystematicLayoffsAdvancementChoice, resolveSystematicLayoffsAdvancementOperation, resolveTraceHardwareWreckerSuccess, resolveTraceTrashRunnerResourceSuccess, resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent, resolveV1911CorporateDownsizing, resolveV1911RunnerHiddenZoneAbility, resolveV1921PlayfulAiChoice, restoreCodeViralCachePreservedCounters, returnRunnerInstalledCardToGrip, returnRunnerInstalledProgramsToGripForAccess, revealCorpRdTop, revealRunnerStackTop, rezActionExecutionHost, rezCardHost, rezzedBlackIceIds, rezzedCorpRootCardIds, rezzedIceOutsideThisIceCount, rezzedInstalledIceIds, rezzedInvestmentFirmIds, rootInstallRezzesOnInstall, runAccessTransitionHost, runBreakSubroutineAdditionalCost, runCardImplementationActionHost, runEndCleanupHost, runFortTriggerExecutionHost, runMovementHostForState, runnerAccessActionHost, runnerActionsPerTurn, runnerBreakerActionExecutionHost, runnerCanPayInstallCost, runnerCostPenaltySupportCreditCapacity, runnerCounterDisplayName, runnerDrawActionContext, runnerDrawSummaryPublicPayload, runnerEncounterActionHostForState, runnerEventLongtailForDefinition, runnerEventLongtailKindForDefinition, runnerHasInstalledCardDefinition, runnerHasInstalledDefinition, runnerInstallableProgramIdsForValuPak, runnerInstalledCardCountByDefinition, runnerProgramInstallMemoryReachableAfterTrash, runnerProgramInstallRecurringCreditSourceIds, runnerProgramUsesMemory, runnerRecurringCredits, runnerSpecialTriggerExecutionHost, runnerTagRemovalRecurringCredits, runnerTagRemovalRecurringCreditSourceIds, runnerTraceCounterEffectDefinitions, runnerUtilityLongtailImplementationForCard, runnerUtilityLongtailKindForCard, runnerUtilityLongtailKindForDefinition, runRemainderStrengthBonusForBreaker, runRezWindowHostForState, runStartTaxForServerUpgrades, scoredAgendaAbilityHost, scoredAgendaFlowHost, scoredAgendaImplementationForDefinition, scoredAgendaImplementationForDefinitionId, scoredAgendaKindForDefinition, selectedChoiceCardIds, selectedChoiceCardIdsForChoice, serverDifficultyIncreaseFromFaitAccompli, serverDifficultyReductionFromUpgrades, setupMulliganChoice, shouldOfferRunnerProgramTrashBeforeInstall, shouldOpenInvestmentFirmCreditChoice, shuffleCorpCardIntoRd, shuffleGripTrashAndStackThenDrawForCardImplementation, shuffleRunnerStack, skivvissCounterTotal, sourcePartsForP334Choice, specialZoneHarnessActions, spendCorpAgendaPointCost, spendEncounterTemporaryTraceCredits, spendHackerTrackerCounters, spendRecurringTraceCreditPool, spendRunnerAccessTrashCredits, spendRunnerInstallCredits, spendRunnerTagRemovalCredits, spendVisibleCardCounter, spyCountersForServer, stableSubtypeList, startAnonymousTipDerezBlackIceChoice, startCardImplementationAdvancementDistributionChoice, startCardImplementationMoveAdvancementChoice, startCodeViralCachePurgeChoice, startCoreCommandJettisonIceChoice, startCorpTurn, startCrashEverettDrawChoice, startDiscardPhase, startExpertScheduleAnalyzerPostAccessChoice, startExposeInstalledCorpCardsChoice, startForgedActivationOrdersTargetChoice, startHuntClubBbsExposeChoice, startIncubatorTransformChoice, startInvestmentFirmCreditChoice, startOpenEndedMileageProgramReturnChoice, startPowerGridOverloadChoice, startRun, startRunActionExecutionHost, startRunnerHostingChoice, startRunnerPrivateLookAtSpecificCorpCards, startRunnerPrivateLookChoice, startRunnerProgramTrashBeforeInstallChoice, startRunnerTurn, startSecurityCodeWormChipTrashIceChoice, startSelfModifyingCodeFreeMuChoice, startSystematicLayoffsAdvancementChoice, startV1921PlayfulAiChoice, startVirusCounterRunnerPrivateLookAtStart, subroutinesForCurrentEncounter, successfulRunInterventionHost, swapCorpHqAndRdTop, systematicLayoffsLegalActions, systematicLayoffsPlacementOptions, takeSetupMulligan, totalCounters, traceCounterEffectDefinitionFor, traceOrchestrationHost, trashCorpInstalledCardsInScoredSourceServer, trashCorpInstalledCardToArchives, trashFaceupRdCardsForCascade, trashOlderRegionUpgradesInServer, trashPowerGridOverloadHardware, trashRunnerInstalledCardToHeap, trashRunnerInstalledProgram, triggerAbilityExecutionHost, turnBasicExecutionHost, uniqueDirectLongtailImplementationForCard, uniqueDirectLongtailImplementationForDefinition, uniqueDirectLongtailKindForCard, uniqueDirectLongtailKindForDefinition, unrezzedInstalledIceIds, untapRunnerCardsAtTurnStart, v1915InstalledRevealHelperIds, validateAdvancementDistribution, validateCorpInstalledEconomyAction, valuPakProgramInstallActionsRemaining, valuPakTemporaryProgramInstallCredits, variableRezForDefinition, variableTraceSubroutineForCurrentEncounter, virusCounterCascadeTrashAtCorpStart, virusCounterCreditsAtRunnerStart, virusCounterDrawsAtCorpStart, virusCounterImplementationForCard, virusCounterImplementationForDefinition, visibleVirusCounterTargetIds, withoutVariableIceState } = runtimeDelegates;

import {
  cloneState,
  corpScoredBlackOpsAgendaLastTurn,
  runnerStoleAgendaSubtypeThisTurn,
} from "./runtime-bootstrap-support";

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

export const RUNNER_EVENT_RESOLVERS: Record<string, RunnerEventResolver> = {
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
