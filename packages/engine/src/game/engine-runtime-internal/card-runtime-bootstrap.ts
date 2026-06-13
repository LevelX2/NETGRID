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
import { credits, spendClick, spendClicks, spendCredits } from "../state/economy-mutation";
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
import { orderedFortRebuildPublicPayload } from "../corp/scored-agenda/ordered-fort-rebuild-sequence";
import { runIsAtServerAfterPassingLastIce } from "../run/windows/after-passing-last-ice-window";
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

const { abilityMetadata, accessEffectHandlerHost, accessFlowHost, acmeSavingsAndLoanObligationCount, activatedCardImplementationExecutionHost, activeCrashEverettSourceId, addAcmeSavingsAndLoanObligation, addCounterToAllInstalledRunnerIcebreakers, addCurrentRunAccessCount, addHackerTrackerTraceCounters, addRunnerFutureActionDebt, addVirusCounterWithDisinfectantPrevention, addVisibleCardCounter, advanceableInstalledCardTargets, advancementDistributionOptions, affordableRezzedInstalledIceIdsForRunner, agendaPoints, appendRegionReplacementTrashEffect, appendResolvedEffectsToPayload, applyAiBoonRunStart, applyCorpStartOfTurnEffects, applyPurgeableRunnerVirusCorpStartEffects, applyStartTurnRandomEffectTables, applyRunnerDrawSummaryPayload, applyRunnerForgoNextAction, applyRunnerStartOfTurnEffects, applyRunnerTraceCounterRunStartEffects, applySystematicLayoffsAdvancementPlacement, archivesAccessRequiresDecisionOrEffect, assertBreakSubroutineCostQuoteValid, assertCorpIceInstallCostValid, assertCurrentSubroutineMatchesLegalAction, assertNonNegativeAmount, assertPositiveIntegerAmount, automaticCounterChangeEffect, automaticDrawCardsEffect, automaticGainCreditsEffect, automaticLoseCreditsEffect, automaticStealAgendaEffect, automaticTagEffect, automaticTrashCardEffect, availableRunnerProgramInstallCredits, availableRunnerTagRemovalCredits, awardRunnerEventAgendaPoint, backupProgramsOnMicrotechBeforeTrash, boardStateActionExecutionHost, breachStateHost, breakAbilityForLegalAction, breakSubroutineCostBreakdown, canHostProgramOnDaemon, canInstallCorpRootCardInServer, canInstallRunnerProgramFromZone, canOverlayProgramOnZetatechSoftwareInstaller, canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity, cardHasSubtype, cardImplementationRunnerEventResolver, cardInstallCapabilitiesForDefinition, choiceAction, chooseCorpAgendasForPointCost, cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay, clearEdgerunnerTempsInstallFlags, clearValuPakProgramInstallFlags, clickCostForAction, closeRunnerCostPenaltySupportWindowForPayment, cockroachCounterTotal, cockroachRandomHqDiscardActive, codeViralCachePurgePreserveTargets, completeDiscardPhase, consumeEdgerunnerTempsInstallAction, consumeRunnerFutureActionDebt, consumeValuPakProgramInstallAction, continueRun, continueV1921PlayfulAiLoop, corpAgendaCounterOperationTarget, corpAgendaPointTotal, corpIceInstallAdditionalCost, corpIceInstallBaseCost, corpIceInstallTotalCost, corpInstallRezSequenceHandlerHost, corpOperationResolutionHost, corpRegionUpgradeIdsInServer, corpRootAgendaOrNodeCapacityInServer, corpRunnerActionPaidWindowActions, corpScoredAgendaForfeitTargets, corpSpecialDamageAbilityHost, corpTraceDamageAbilityHost, corpUtilityImplementationForCard, corpZoneChoiceHandlerHost, counterUtilityTriggerExecutionHost, creditCostForAction, creditEconomyExecutionHost, creditTextForPrompt, daemonHostedMemoryUsed, daemonHostingCapacity, diePromptText, discardChoice, discardRandomCorpHqCards, drawRunnerCard, drawRunnerCards, dupreStrengthCounterBonus, edgerunnerTempsInstallActionsRemaining, effectiveSubtypesForCard, emptyRunnerDrawSummary, encounterEntryHostForState, encounterPrintedEffectHostForState, encounterPrintedNonTraceHostForState, encounterResolutionHostForState, encounterSpecialWindowHostForState, encounterTemporaryTraceCreditsAvailable, endTurn, executeEffectCommands, expireCorporateRetreatInstallCreditAbilities, exposeCorpCardInServer, exposedCorpCardInServer, exposeInstalledCorpCardForImplementation, exposeInstalledCorpCardLabel, exposeInstalledCorpCardsChoiceOptions, exposeInstalledCorpCardTargets, exposeOutermostIceOfEachDataFort, forfeitCorpAgendaForPointCost, forfeitRunnerAgendaForPointCost, fortCapacityModifiersForCard, fortPassWindowHostForState, fortRunSideFamiliesHostForState, hackerTrackerCardIds, hackerTrackerCounterTotal, hackerTrackerCounterType, hasCorpUtilityKind, hasHiddenResourceAccessStartActions, hasInstallCapabilityKindForDefinition, hasInstalledMicrotechTrodeSet, hasInstalledUniqueCardDefinition, hiddenReplacementLongtailForDefinition, hiddenZoneArrangeChoiceHandlerHost, hiddenZoneNonSearchChoiceHandlerHost, hiddenZoneSearchActivationHandlerHost, hiddenZoneSearchActivationTargetHost, hiddenZoneSearchChoiceHandlerHost, hiddenZoneSearchHandlerHostBase, hostedProgramStrengthModifier, huntClubBbsExposeOptionLabel, huntClubBbsExposeTargets, icebreakerEncounterStrengthBonus, icebreakerHasSpecial, iceChoiceLabelForSide, iceStrengthBonusFor, iceStrengthFor, identityDefinition, identityModifierAmount, incubatorCounterTotal, installCardHost, installedAgendaOperationTarget, installedCodeViralCacheIds, installedCorpCardServerContext, installedRunnerConnectionIds, installedRunnerIcebreakerIds, installedRunnerProgramTrashOptionsForInstall, installedRunnerVirusSourceIds, installedVirusCounterTotalForDefinition, installRunnerProgramForFree, installRunnerProgramFromStackWithoutClick, installRunnerProgramFromZoneWithoutClick, installTargetBindingForDefinition, isAcmeSavingsAndLoanDefinition, isCitySurveillanceCard, isCorpInstallableCardType, isHackerTrackerCentralCard, isInstalledCorpCardAdvanceable, isInvestmentFirmCard, isRegionUpgrade, isUniqueCard, isVisibleVirusCounterCardForRunner, leavePlayCleanupImplementationsForCard, mergeRunnerDrawSummary, microtechBackupDriveIds, microtechTrodeSetBreakAdditionalCost, movableAdvancementSourceIds, moveAdvancementOptions, mustInstallInsideSubsidiaryDataFort, newsgroupTauntingRunStartTax, normalizeSubtypeLabel, openPostMeatDamageReactionWindow, openRunnerCostPenaltySupportWindow, outermostIceExposures, outermostIceIndex, parseAdvancementDistributionValue, parseCodeViralCachePreserveOption, parsePlayfulAiChoiceSource, parsePlayfulAiSplit, parseRunnerInstalledConnectionTrashBadPublicityChoiceSource, passCurrentEncounteredIce, pendingChoiceResolutionHost, permanentIcebreakerStrengthCounterBonus, playCardExecutionHost, playfulAiSplitOptions, postMeatDamageHiddenResourceCandidates, powerGridOverloadEligibleHardwareIds, powerGridOverloadLegalActions, powerGridOverloadTrashCountFromChoiceSource, powerGridOverloadTrashCountFromPayload, poxCountersForServer, poxInstallTax, preventOneVirusCounterWithDisinfectant, printedCostCardImplementationMakeRunEffect, processDiscardStep, publicCardTitle, publicIcePositionLabelForCard, publicIceSelectionLabelForCard, pumpAbilityForLegalAction, pumpAmountForLegalAction, pumpDurationForLegalAction, pushCorpTraceDamageOrCardImplementationActions, queueIncubatorStartOfTurnTransforms, rabbitTraceLimitReductionForIceTrace, randomCorpHqCardsWithoutReplacement, randomCorpHqDiscard, recordBartmossEncounterUsage, recordSnowballBreakUsage, refreshRecurringCredits, relativeDamageSubroutineForCurrentEncounter, relativeIceStrengthBonusFor, relativeTraceSubroutinesForCurrentEncounter, remainingReplacementLongtailImplementationForCard, remainingReplacementLongtailImplementationForDefinition, remainingReplacementLongtailKindForCard, remainingReplacementLongtailKindForDefinition, removeAcmeSavingsAndLoanObligation, requiresDataFortInstallTarget, resolveAcmeSavingsAndLoanEndOfCorpTurn, resolveAgendaCounterOperation, resolveAnonymousTipDerezBlackIceChoice, resolveBizarreEncryptionDelayedAgendas, resolveBlinkBreakSubroutineAction, resolveCardImplementationAccessPaymentChoice, resolveCardImplementationAdvancementDistributionChoice, resolveCardImplementationMoveAdvancementChoice, resolveChimeraDaemonTrashChoice, resolveCodeViralCachePurgeChoice, resolveCoreCommandJettisonIceChoice, resolveCorpInstalledEconomyAction, resolveCrashEverettDrawChoice, resolveDealWithMilitech, resolveDiscardChoice, resolveExposeInstalledCorpCardsChoice, resolveFieldReporterEndOfRunnerTurn, resolveForgedActivationOrdersCorpChoice, resolveForgedActivationOrdersTargetChoice, resolveHuntClubBbsExposeChoice, resolveIncubatorTransformChoice, resolveInvestmentFirmCreditChoice, resolveManagementShakeUpOperation, resolveMitWestTier, resolveMultiBreakSubroutinesAction, resolveOmniscienceFoundationEndTurnTag, resolveOpenEndedMileageProgramReturnChoice, resolveP358HiddenReplacementChoice, resolvePlayfulAiDiceLoopEvent, resolvePostMeatDamageHiddenResourceChoice, resolvePostOnPlayGenericFollowups, resolvePowerGridOverloadChoice, resolvePowerGridOverloadOperation, resolveDelayedEndTurnDamageEffects, resolveRunnerProgramReturnChoice, resolveRunnerHostingChoice, resolveRunnerInstalledConnectionTrashBadPublicityChoice, resolveRunnerPrivateLookChoice, resolveRunnerProgramTrashBeforeInstallChoice, resolveRunnerTargetedEventImplementation, resolveSecurityCodeWormChipTrashIceChoice, resolveSetupMulliganChoice, resolveSneakPreviewTemporaryInstallReturns, resolveSystematicLayoffsAdvancementChoice, resolveSystematicLayoffsAdvancementOperation, resolveTraceHardwareWreckerSuccess, resolveTraceTrashRunnerResourceSuccess, resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent, resolveV1911CorporateDownsizing, resolveV1911RunnerHiddenZoneAbility, resolveV1921PlayfulAiChoice, restoreCodeViralCachePreservedCounters, returnRunnerInstalledCardToGrip, returnRunnerInstalledProgramsToGripForAccess, revealCorpRdTop, revealRunnerStackTop, rezActionExecutionHost, rezCardHost, rezzedBlackIceIds, rezzedCorpRootCardIds, rezzedIceOutsideThisIceCount, rezzedInstalledIceIds, rezzedInvestmentFirmIds, rootInstallRezzesOnInstall, runAccessTransitionHost, runBreakSubroutineAdditionalCost, runCardImplementationActionHost, runEndCleanupHost, runFortTriggerExecutionHost, runMovementHostForState, runnerAccessActionHost, runnerActionsPerTurn, runnerBreakerActionExecutionHost, runnerCanPayInstallCost, runnerCostPenaltySupportCreditCapacity, runnerCounterDisplayName, runnerDrawActionContext, runnerDrawSummaryPublicPayload, runnerEncounterActionHostForState, runnerEventLongtailForDefinition, runnerEventLongtailKindForDefinition, runnerHasInstalledCardDefinition, runnerHasInstalledDefinition, runnerInstallableProgramIdsForValuPak, runnerInstalledCardCountByDefinition, runnerProgramInstallMemoryReachableAfterTrash, runnerProgramInstallRecurringCreditSourceIds, runnerProgramUsesMemory, runnerRecurringCredits, runnerSpecialTriggerExecutionHost, runnerTagRemovalRecurringCredits, runnerTagRemovalRecurringCreditSourceIds, runnerTraceCounterEffectDefinitions, runnerUtilityLongtailImplementationForCard, runnerUtilityLongtailKindForCard, runnerUtilityLongtailKindForDefinition, runRemainderStrengthBonusForBreaker, runRezWindowHostForState, runStartTaxForServerUpgrades, scoredAgendaAbilityHost, scoredAgendaFlowHost, scoredAgendaImplementationForDefinition, scoredAgendaImplementationForDefinitionId, scoredAgendaKindForDefinition, selectedChoiceCardIds, selectedChoiceCardIdsForChoice, serverDifficultyIncreaseFromFaitAccompli, serverDifficultyReductionFromUpgrades, setupMulliganChoice, shouldOfferRunnerProgramTrashBeforeInstall, shouldOpenInvestmentFirmCreditChoice, shuffleCorpCardIntoRd, shuffleGripTrashAndStackThenDrawForCardImplementation, shuffleRunnerStack, skivvissCounterTotal, sourcePartsForP334Choice, specialZoneHarnessActions, spendCorpAgendaPointCost, spendEncounterTemporaryTraceCredits, spendHackerTrackerCounters, spendRecurringTraceCreditPool, spendRunnerAccessTrashCredits, spendRunnerInstallCredits, spendRunnerTagRemovalCredits, spendVisibleCardCounter, spyCountersForServer, stableSubtypeList, startAnonymousTipDerezBlackIceChoice, startCardImplementationAdvancementDistributionChoice, startCardImplementationMoveAdvancementChoice, startCodeViralCachePurgeChoice, startCoreCommandJettisonIceChoice, startCorpTurn, startCrashEverettDrawChoice, startDiscardPhase, startExpertScheduleAnalyzerPostAccessChoice, startExposeInstalledCorpCardsChoice, startForgedActivationOrdersTargetChoice, startHuntClubBbsExposeChoice, startIncubatorTransformChoice, startInvestmentFirmCreditChoice, startOpenEndedMileageProgramReturnChoice, startPowerGridOverloadChoice, startRun, startRunActionExecutionHost, startRunnerHostingChoice, startRunnerPrivateLookAtSpecificCorpCards, startRunnerPrivateLookChoice, startRunnerProgramTrashBeforeInstallChoice, startRunnerTurn, startSecurityCodeWormChipTrashIceChoice, startSelfModifyingCodeFreeMuChoice, startSystematicLayoffsAdvancementChoice, startV1921PlayfulAiChoice, startVirusCounterRunnerPrivateLookAtStart, subroutinesForCurrentEncounter, successfulRunInterventionHost, swapCorpHqAndRdTop, systematicLayoffsLegalActions, systematicLayoffsPlacementOptions, takeSetupMulligan, totalCounters, traceCounterEffectDefinitionFor, traceOrchestrationHost, trashCorpInstalledCardsInScoredSourceServer, trashCorpInstalledCardToArchives, trashFaceupRdCardsForCascade, trashOlderRegionUpgradesInServer, trashPowerGridOverloadHardware, trashRunnerInstalledCardToHeap, trashRunnerInstalledProgram, triggerAbilityExecutionHost, turnBasicExecutionHost, uniqueDirectLongtailImplementationForCard, uniqueDirectLongtailImplementationForDefinition, uniqueDirectLongtailKindForCard, uniqueDirectLongtailKindForDefinition, unrezzedInstalledIceIds, untapRunnerCardsAtTurnStart, v1915InstalledRevealHelperIds, validateAdvancementDistribution, validateCorpInstalledEconomyAction, valuPakProgramInstallActionsRemaining, valuPakTemporaryProgramInstallCredits, variableRezForDefinition, variableTraceSubroutineForCurrentEncounter, virusCounterCascadeTrashAtCorpStart, virusCounterCreditsAtRunnerStart, virusCounterDrawsAtCorpStart, virusCounterImplementationForCard, virusCounterImplementationForDefinition, visibleVirusCounterTargetIds, withoutVariableIceState } = runtimeDelegates;

import {
  cloneState,
  corpScoredBlackOpsAgendaLastTurn,
  resolveRunnerLastTurnInstalledResourceTargetId,
  runnerStoleAgendaSubtypeThisTurn,
} from "./runtime-bootstrap-support";
export function configureCardRuntimeBootstrap() {
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

  function trashTopCorpRdCards(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    amount: 2,
  ): { publicPayload: Record<string, string | number | boolean> } {
    if (amount !== 2 || state.corp.rd.length < amount)
      throw new Error("R&D enthält nicht genug Karten für diese Kosten.");
    const trashed = state.corp.rd.slice(0, amount);
    for (const cardId of trashed) {
      removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "archives" },
      };
    }
    const payload = {
      hiddenZoneBarrier: true,
      hiddenZoneAction: "trash_top_corp_rd",
      sourceDefinitionId,
      trashedCardsCount: trashed.length,
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    return { publicPayload: payload };
  }

  function rezInstalledIceWithLifecycleCounters(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    input: {
      counterType: Extract<CounterType, "kludge" | "term">;
      amount: number;
      lifecycle:
        | "remove_one_counter_start_corp_turn_trash_on_last"
        | "rent_to_own_start_corp_turn";
    },
  ): { publicPayload: Record<string, string | number | boolean> } {
    void sourceCardId;
    const targetCardId = String(legalAction.payload?.targetCardId ?? "") as
      | CardInstanceId
      | "";
    const target = targetCardId ? state.cardInstances[targetCardId] : undefined;
    const definition = targetCardId ? definitionFor(state, targetCardId) : undefined;
    if (
      !target ||
      !definition ||
      target.controller !== "corp" ||
      target.zone.side !== "corp" ||
      target.zone.zone !== "serverIce" ||
      definition.type !== "ice" ||
      target.rezzed === true
    )
      throw new Error("Das Rez-Ziel ist nicht legal.");
    const targetRezCost = rezCostForCard(state, targetCardId);
    if (Number(legalAction.payload?.targetRezCost) !== targetRezCost)
      throw new Error("Die gebundene Rez-Kostenangabe ist nicht mehr gültig.");
    let counterAmount = Math.max(0, Math.floor(input.amount));
    if (input.counterType === "kludge") {
      counterAmount = Math.max(
        0,
        Math.floor(Number(legalAction.payload?.xValue ?? 0)),
      );
      const upperBound = Math.max(1, targetRezCost);
      if (
        Number(legalAction.payload?.xUpperBound) !== upperBound ||
        counterAmount < 1 ||
        counterAmount > upperBound
      )
        throw new Error("Die gewählte Counter-Anzahl ist nicht legal.");
    } else {
      counterAmount = targetRezCost;
    }
    state.cardInstances[targetCardId] = {
      ...target,
      rezzed: true,
      faceup: true,
    };
    if (counterAmount > 0)
      addCardCounter(state, targetCardId, input.counterType, counterAmount);
    const payload = {
      sourceDefinitionId,
      targetCardId,
      targetDefinitionId: definition.id,
      targetRezCost,
      freeRez: true,
      counterType: input.counterType,
      addedCounterAmount: counterAmount,
      remainingCounters: cardCounter(state, targetCardId, input.counterType),
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      targetCardId,
      "on_rez",
    );
    return { publicPayload: payload };
  }

  function replaceFortCardsFromHq(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
  ): { publicPayload: Record<string, string | number | boolean> } {
    const source = mustInstance(state.cardInstances, sourceCardId);
    if (
      source.controller !== "corp" ||
      source.zone.side !== "corp" ||
      source.zone.zone !== "serverRoot"
    )
      throw new Error("Die Quelle muss in einem Remote-Root installiert sein.");
    const server = mustServer(state, source.zone.serverId);
    if (server.kind !== "remote")
      throw new Error("Fort-Ersatz darf nur in einem Remote ausloesen.");
    if (
      !state.run ||
      !runIsAtServerAfterPassingLastIce(state.run, server)
    )
      throw new Error("Fort-Ersatz darf nur nach der letzten ICE dieses Forts ausloesen.");
    const removedIce = server.ice.slice();
    const removedRoot = server.root.slice();
    const removedCount = removedIce.length + removedRoot.length;
    const legalCandidates = legalFortReplacementHqCardIds(state, server, removedCount);
    if (legalCandidates.length < removedCount)
      throw new Error("Es gibt nicht genug legale HQ-Ersatzkarten.");
    const hqSelection = String(legalAction.payload?.fortReplacementHqCardIds ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) as CardInstanceId[];
    if (hqSelection.length === 0 && legalCandidates.length > removedCount) {
      openFortHqReplacementChoice(
        state,
        sourceCardId,
        sourceDefinitionId,
        server,
        removedCount,
        legalCandidates,
      );
      const payload = {
        ...orderedFortRebuildPublicPayload({
          sourceDefinitionId,
          targetServerId: server.id,
          removedCardCount: removedCount,
          replacementCardCount: 0,
          installedIceCount: 0,
          installedRootCount: 0,
        }),
        sourceDefinitionId,
        serverId: server.id,
        serverLabel: server.label,
        orderedFortRebuildChoiceOpened: true,
        replacementCount: removedCount,
        hqCandidateCount: legalCandidates.length,
      };
      legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
      return { publicPayload: payload };
    }
    const selected =
      hqSelection.length > 0 ? hqSelection : legalCandidates.slice(0, removedCount);
    if (selected.length !== removedCount)
      throw new Error("Fort-Ersatz braucht exakt gleich viele HQ-Ersatzkarten.");
    if (new Set(selected).size !== selected.length)
      throw new Error("Die Fort-Ersatz-Auswahl enthaelt Duplikate.");
    for (const cardId of selected) {
      if (!state.corp.hq.includes(cardId))
        throw new Error("Eine Fort-Ersatzkarte liegt nicht mehr in HQ.");
      if (!legalCandidates.includes(cardId))
        throw new Error("Eine Fort-Ersatzkarte ist nicht installierbar.");
    }
    const validInstallOrder = validFortReplacementInstallOrder(state, server, selected);
    if (!validInstallOrder)
      throw new Error("Die Fort-Ersatzkarten sind gemeinsam nicht installierbar.");
    for (const cardId of [...removedIce, ...removedRoot]) {
      uninstallCorpInstalledCardToHq(state, cardId);
    }
    server.ice = [];
    server.root = [];
    for (const cardId of validInstallOrder) {
      const definition = definitionFor(state, cardId);
      if (definition.type === "ice") {
        removeFromAllZones(state, cardId);
        server.ice.push(cardId);
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          faceup: false,
          rezzed: false,
          zone: { side: "corp", zone: "serverIce", serverId: server.id },
        };
      } else if (
        definition.type === "asset" ||
        definition.type === "agenda" ||
        definition.type === "upgrade"
      ) {
        if (!canInstallCorpRootCardInServer(state, definition, server))
          throw new Error("Eine Fort-Root-Ersatzkarte ist nicht legal.");
        removeFromAllZones(state, cardId);
        server.root.push(cardId);
        state.cardInstances[cardId] = {
          ...mustInstance(state.cardInstances, cardId),
          faceup: false,
          rezzed: false,
          zone: { side: "corp", zone: "serverRoot", serverId: server.id },
        };
      } else {
        throw new Error("Diese HQ-Karte kann nicht in das Fort installiert werden.");
      }
    }
    const payload = {
      ...orderedFortRebuildPublicPayload({
        sourceDefinitionId,
        targetServerId: server.id,
        removedCardCount: removedCount,
        replacementCardCount: selected.length,
        installedIceCount: server.ice.length,
        installedRootCount: server.root.length,
      }),
      serverId: server.id,
      orderedFortRebuildChoiceOpened: false,
      uninstalledCardsCount: removedCount,
      installedCardsCount: selected.length,
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    return { publicPayload: payload };
  }
  function legalFortReplacementHqCardIds(
    state: GameState,
    server: CorpServer,
    removedCount: number,
  ): CardInstanceId[] {
    if (removedCount <= 0) return [];
    if (!hasLegalFortReplacementHqCombination(state, server, removedCount)) return [];
    const serverAfterRemoval: CorpServer = { ...server, ice: [], root: [] };
    return state.corp.hq
      .filter((cardId) => {
        const definition = definitionFor(state, cardId);
        if (definition.type === "ice") return true;
        if (!isFortReplacementInstallableCandidateDefinition(definition)) return false;
        return canInstallCorpRootCardInServer(state, definition, serverAfterRemoval);
      })
      .sort();
  }
  function hasLegalFortReplacementHqCombination(
    state: GameState,
    server: CorpServer,
    count: number,
  ): boolean {
    const candidates = state.corp.hq
      .filter((cardId) =>
        isFortReplacementInstallableCandidateDefinition(definitionFor(state, cardId)),
      )
      .sort();
    const visit = (startIndex: number, selected: CardInstanceId[]): boolean => {
      if (selected.length === count)
        return Boolean(validFortReplacementInstallOrder(state, server, selected));
      for (let index = startIndex; index < candidates.length; index += 1) {
        selected.push(candidates[index]!);
        if (visit(index + 1, selected)) return true;
        selected.pop();
      }
      return false;
    };
    return visit(0, []);
  }
  function validFortReplacementInstallOrder(
    state: GameState,
    server: CorpServer,
    selected: CardInstanceId[],
  ): CardInstanceId[] | undefined {
    if (new Set(selected).size !== selected.length) return undefined;
    if (selected.some((cardId) => !state.corp.hq.includes(cardId))) return undefined;
    if (
      selected.some(
        (cardId) =>
          !isFortReplacementInstallableCandidateDefinition(definitionFor(state, cardId)),
      )
    )
      return undefined;
    return firstValidFortReplacementInstallPermutation(state, server, selected, []);
  }
  function firstValidFortReplacementInstallPermutation(
    state: GameState,
    server: CorpServer,
    remaining: CardInstanceId[],
    prefix: CardInstanceId[],
  ): CardInstanceId[] | undefined {
    if (remaining.length === 0)
      return fortReplacementInstallOrderIsLegal(state, server, prefix)
        ? prefix
        : undefined;
    for (let index = 0; index < remaining.length; index += 1) {
      const next = remaining[index]!;
      const result = firstValidFortReplacementInstallPermutation(
        state,
        server,
        remaining.filter((_, candidateIndex) => candidateIndex !== index),
        [...prefix, next],
      );
      if (result) return result;
    }
    return undefined;
  }
  function fortReplacementInstallOrderIsLegal(
    state: GameState,
    server: CorpServer,
    order: CardInstanceId[],
  ): boolean {
    const testState = cloneState(state);
    const testServer = mustServer(testState, server.id);
    testServer.ice = [];
    testServer.root = [];
    for (const cardId of order) {
      const definition = definitionFor(testState, cardId);
      if (definition.type === "ice") {
        removeFromAllZones(testState, cardId);
        testServer.ice.push(cardId);
        testState.cardInstances[cardId] = {
          ...mustInstance(testState.cardInstances, cardId),
          zone: { side: "corp", zone: "serverIce", serverId: testServer.id },
        };
        continue;
      }
      if (!canInstallCorpRootCardInServer(testState, definition, testServer))
        return false;
      removeFromAllZones(testState, cardId);
      testServer.root.push(cardId);
      testState.cardInstances[cardId] = {
        ...mustInstance(testState.cardInstances, cardId),
        zone: { side: "corp", zone: "serverRoot", serverId: testServer.id },
      };
      if (
        corpRootMainCardIdsInServer(testState, testServer).length >
        corpRootAgendaOrNodeCapacityInServer(testState, testServer)
      )
        return false;
    }
    return true;
  }
  function isFortReplacementInstallableCandidateDefinition(
    definition: CardDefinition,
  ): boolean {
    return (
      definition.side === "corp" &&
      (definition.type === "ice" ||
        definition.type === "asset" ||
        definition.type === "agenda" ||
        definition.type === "upgrade")
    );
  }
  function openFortHqReplacementChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    server: CorpServer,
    replacementCount: number,
    legalCandidates: CardInstanceId[],
  ): void {
    if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `fort_hq_replacement_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.fort_hq_replacement:${sourceCardId}:${sourceDefinitionId}:${server.id}:${replacementCount}:${state.stateVersion + 1}`,
      prompt: "HQ-Ersatzkarten waehlen",
      kind: "select_cards",
      options: legalCandidates.map((cardId) => ({
        id: `card_${cardId}`,
        label: definitionFor(state, cardId).title,
        publicLabel: "HQ-Karte",
        value: cardId,
      })),
      minSelections: replacementCount,
      maxSelections: replacementCount,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    state.activeSide = "corp";
  }
  function resolveFortHqReplacementChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice?.source.startsWith("card_implementation.fort_hq_replacement"))
      throw new Error("Es ist keine Fort-Ersatz-Choice offen.");
    const [, sourceCardId = "", sourceDefinitionId = "", , count = ""] =
      choice.source.split(":");
    const selectedIds = selectedChoiceCardIds(choice, playerAction);
    if (selectedIds.length !== Number(count))
      throw new Error("Fort-Ersatz braucht exakt die geforderte Ersatzkartenzahl.");
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      fortReplacementHqCardIds: selectedIds.join(","),
    };
    replaceFortCardsFromHq(
      state,
      legalAction,
      sourceCardId as CardInstanceId,
      sourceDefinitionId as CardDefinitionId,
    );
  }
  function revalidateLastRezzedBlackIce(
    state: GameState,
  ): NonNullable<NonNullable<GameState["runnerTurnFlags"]>["lastRezzedBlackIceThisTurn"]> {
    const target = state.runnerTurnFlags?.lastRezzedBlackIceThisTurn;
    if (!target?.cardId) throw new Error("In diesem Zug wurde kein Black ICE gerezzt.");
    const instance = state.cardInstances[target.cardId];
    const definition = instance ? definitionFor(state, target.cardId) : undefined;
    if (
      !instance ||
      !definition ||
      instance.controller !== "corp" ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "serverIce" ||
      instance.zone.serverId !== target.serverId ||
      instance.rezzed !== true ||
      definition.id !== target.definitionId ||
      definition.type !== "ice" ||
      !cardHasSubtype(definition, "black_ice")
    )
      throw new Error("Das zuletzt gerezzte Black ICE ist nicht mehr legal.");
    return target;
  }

  function startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
  ): { publicPayload: Record<string, string | number | boolean> } {
    const sourceDefinition = definitionFor(state, sourceCardId);
    const target = revalidateLastRezzedBlackIce(state);
    if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `derez_last_rezzed_black_ice_or_bad_publicity_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.derez_last_rezzed_black_ice_or_bad_publicity:${sourceCardId}:${sourceDefinition.id}:${target.cardId}:${target.definitionId}:${target.serverId}:${state.stateVersion + 1}`,
      prompt: "Black ICE derezzen oder Bad Publicity erhalten",
      kind: "select_option",
      options: [
        {
          id: "derez",
          label: `${definitionFor(state, target.cardId).title} derezzen`,
          publicLabel: "Black ICE derezzen",
          value: "derez",
        },
        {
          id: "bad_publicity",
          label: "2 Bad Publicity erhalten",
          publicLabel: "2 Bad Publicity erhalten",
          value: "bad_publicity",
        },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "corp";
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      derezOrBadPublicityChoiceOpened: true,
      sourceDefinitionId: sourceDefinition.id,
      targetCardDefinitionId: target.definitionId,
      targetServerId: target.serverId,
    };
    return { publicPayload: legalAction.payload };
  }

  function resolveSenatorialFieldTripChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice?.source.startsWith(
        "card_implementation.derez_last_rezzed_black_ice_or_bad_publicity:",
      )
    )
      throw new Error("Es ist keine Black-ICE-Choice offen.");
    const [
      ,
      sourceCardId = "",
      sourceDefinitionId = "",
      targetCardId = "",
      targetDefinitionId = "",
      targetServerId = "",
    ] = choice.source.split(":");
    if (!state.runner.heap.includes(sourceCardId as CardInstanceId))
      throw new Error("Die Quelle liegt nicht mehr im Heap.");
    if (definitionFor(state, sourceCardId as CardInstanceId).id !== sourceDefinitionId)
      throw new Error("Die Choice passt nicht mehr zur Quelle.");
    const target = revalidateLastRezzedBlackIce(state);
    if (
      target.cardId !== targetCardId ||
      target.definitionId !== targetDefinitionId ||
      target.serverId !== targetServerId
    )
      throw new Error("Das Black-ICE-Ziel ist veraltet.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    delete state.pendingChoice;
    if (selected === "derez") {
      state.cardInstances[target.cardId] = {
        ...withoutVariableIceState(mustInstance(state.cardInstances, target.cardId)),
        faceup: false,
        rezzed: false,
      };
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        derezOrBadPublicityDecision: "derez",
        sourceDefinitionId,
        targetCardDefinitionId: target.definitionId,
        derezzedCardDefinitionId: target.definitionId,
      };
      return;
    }
    if (selected !== "bad_publicity")
      throw new Error("Die Black-ICE-Choice-Auswahl ist ungueltig.");
    const result = executeCardImplementationEffects(
      state,
      {
        sourceCardId: sourceCardId as CardInstanceId,
        sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
        sourceTitle: definitionFor(state, sourceCardId as CardInstanceId).title,
        controller: "runner",
      },
      [{ kind: "add_bad_publicity", amount: 2, visibility: "public" }],
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      derezOrBadPublicityDecision: "bad_publicity",
      sourceDefinitionId,
      targetCardDefinitionId: target.definitionId,
      ...result.publicPayload,
    };
    appendResolvedEffectsToPayload(legalAction, result.resolvedEffects);
  }

  function gameCardImplementationRuntimeDepsHost(): GameCardImplementationRuntimeDepsHost {
    const spendCardImplementationCredits = (state: GameState, side: Side, amount: number): void => {
      spendCredits(state, side, amount);
      const temporaryCredits = state.run?.corpRunTemporaryCredits;
      if (side !== "corp" || amount <= 0 || !temporaryCredits) return;
      state.run.corpRunTemporaryCredits.remaining = Math.max(
        0,
        Math.floor(temporaryCredits.remaining ?? 0) - amount,
      );
    };
    return {
      cards: {
        definitionFor,
        mustInstance,
        rezzedCorpRootCardIds,
        runnerInstalledCardIds,
      },
      credits: {
        spendClick,
        spendCredits: spendCardImplementationCredits,
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
        rezInstalledIceWithLifecycleCounters,
        replaceFortCardsFromHq,
        trashTopCorpRdCards,
        rezCostForCard,
        startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice,
        startOpenEndedMileageProgramReturnChoice,
      },
    };
  }

  const cardImplementationRuntimeDeps = createGameCardImplementationRuntimeDeps(
    gameCardImplementationRuntimeDepsHost(),
  );
  return {
    cardImplementationEffectAdapters,
    hiddenZoneRuntimeDepsHost,
    traceRuntimeDepsHost,
    installRezRuntimeDepsHost,
    counterLifecycleRuntimeDepsHost,
    gameCardImplementationRuntimeDepsHost,
    cardImplementationRuntimeDeps,
    resolveFortHqReplacementChoice,
    resolveSenatorialFieldTripChoice,
  };
}
