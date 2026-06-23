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
  hostedProgramIdsOnHardware,
  topHostedProgramOnHardware,
  type RunFortTriggerExecutionHost,
} from "../abilities/run-fort-trigger-execution";
import {
  applyDelayedInstallStartOfTurn,
  handleRunnerSpecialTriggerExecution,
  delayedInstallCounterCost,
  delayedInstallPreparedTargetIds,
  delayedInstallPrepareTargetIds,
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
  openDamageResolutionWindow,
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
  buildRunnerDelayedInstallRemoveCounterAction,
  buildRunnerDelayedInstallSetAsideAction,
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
  startHiddenStackProgramInstallActivation,
  startSneakPreviewSourceActivation,
} from "../hidden-zone/search-choice-activations";
import {
  handleHiddenZoneSearchChoice,
  type HiddenZoneSearchActivationHandlerHost,
  type HiddenZoneSearchChoiceHandlerHost,
} from "../hidden-zone/search-choice-handlers";
import {
  handleHiddenZoneArrangeChoice,
  resolveConcealAndReorderInstalledIce,
  startCorpAssetRdTopReorderChoice,
  startCorpRdArrangeChoice,
  startCorpRdTopReorderChoice,
  startSuccessfulRunFortIceReorderChoice,
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
  startSecretSpendGuessThenTargetedBypassRunHideChoice,
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
  resolvePreAccessTopRdReorderChoice,
  resolveSuccessfulRunCreditLossSpendChoice,
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
  resolveBrokenIceVirusCounterChoice,
  type RunEndCleanupHost,
} from "../run/run-end-cleanup";
import {
  activeRunActionSpendingCapSourceIds,
  availableRunnerRunCredits,
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
  resolveRezInterruptJackOutChoice,
  type RunRezWindowHost,
} from "../run/run-rez-window";
import {
  resolveFortPassAdvancementWindow,
  resolveHqIceSwapChoice,
  resolveStartRunIceRepositionWindow,
  startHqIceSwapChoice,
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
  ADVANCEMENT_PLACEMENT_OPERATION_ID,
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

const { abilityMetadata, accessEffectHandlerHost, accessFlowHost, activeObligationCount, activatedCardImplementationExecutionHost, activeCrashEverettSourceId, addActiveObligation, addCounterToAllInstalledRunnerIcebreakers, addCurrentRunAccessCount, addHackerTrackerTraceCounters, addRunnerFutureActionDebt, addVirusCounterWithCounterPrevention, addVisibleCardCounter, advanceableInstalledCardTargets, advancementDistributionOptions, affordableRezzedInstalledIceIdsForRunner, agendaPoints, appendRegionReplacementTrashEffect, appendResolvedEffectsToPayload, applyRunStartRandomStrengthBonus, applyCorpStartOfTurnEffects, applyPurgeableRunnerVirusCorpStartEffects, applyStartTurnRandomEffectTables, applyRunnerDrawSummaryPayload, applyRunnerForgoNextAction, applyRunnerStartOfTurnEffects, applyRunnerTraceCounterRunStartEffects, applyAdvancementCounterPlacement, archivesAccessRequiresDecisionOrEffect, assertBreakSubroutineCostQuoteValid, assertCorpIceInstallCostValid, assertCurrentSubroutineMatchesLegalAction, assertNonNegativeAmount, assertPositiveIntegerAmount, automaticCounterChangeEffect, automaticDrawCardsEffect, automaticGainCreditsEffect, automaticLoseCreditsEffect, automaticStealAgendaEffect, automaticTagEffect, automaticTrashCardEffect, availableRunnerProgramInstallCredits, availableRunnerTagRemovalCredits, awardRunnerEventAgendaPoint, backupProgramsOnMicrotechBeforeTrash, boardStateActionExecutionHost, breachStateHost, breakAbilityForLegalAction, breakSubroutineCostBreakdown, canHostProgramOnDaemon, canInstallCorpRootCardInServer, canInstallRunnerProgramFromZone, canOverlayProgramOnZetatechSoftwareInstaller, canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity, cardHasSubtype, cardImplementationRunnerEventResolver, cardInstallCapabilitiesForDefinition, choiceAction, chooseCorpAgendasForPointCost, cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay, clearEdgerunnerTempsInstallFlags, clearValuPakProgramInstallFlags, clickCostForAction, closeRunnerCostPenaltySupportWindowForPayment, cockroachCounterTotal, cockroachRandomHqDiscardActive, virusCounterPurgePreserveTargets, completeDiscardPhase, consumeEdgerunnerTempsInstallAction, consumeRunnerFutureActionDebt, consumeValuPakProgramInstallAction, continueRun, continueRandomDiceLoop, corpAgendaCounterOperationTarget, corpAgendaPointTotal, corpIceInstallAdditionalCost, corpIceInstallBaseCost, corpIceInstallTotalCost, corpInstallRezSequenceHandlerHost, corpOperationResolutionHost, corpRegionUpgradeIdsInServer, corpRootAgendaOrNodeCapacityInServer, corpRunnerActionPaidWindowActions, corpScoredAgendaForfeitTargets, corpSpecialDamageAbilityHost, corpTraceDamageAbilityHost, corpUtilityImplementationForCard, corpZoneChoiceHandlerHost, counterUtilityTriggerExecutionHost, creditCostForAction, creditEconomyExecutionHost, creditTextForPrompt, daemonHostedMemoryUsed, daemonHostingCapacity, diePromptText, discardChoice, discardRandomCorpHqCards, drawRunnerCard, drawRunnerCards, dupreStrengthCounterBonus, edgerunnerTempsInstallActionsRemaining, effectiveSubtypesForCard, emptyRunnerDrawSummary, encounterEntryHostForState, encounterPrintedEffectHostForState, encounterPrintedNonTraceHostForState, encounterResolutionHostForState, encounterSpecialWindowHostForState, encounterTemporaryTraceCreditsAvailable, endTurn, executeEffectCommands, expireCorporateRetreatInstallCreditAbilities, exposeCorpCardInServer, exposedCorpCardInServer, exposeInstalledCorpCardForImplementation, exposeInstalledCorpCardLabel, exposeInstalledCorpCardsChoiceOptions, exposeInstalledCorpCardTargets, exposeOutermostIceOfEachDataFort, forfeitCorpAgendaForPointCost, forfeitRunnerAgendaForPointCost, fortCapacityModifiersForCard, fortPassWindowHostForState, fortRunSideFamiliesHostForState, hackerTrackerCardIds, hackerTrackerCounterTotal, hackerTrackerCounterType, hasCorpUtilityKind, hasHiddenResourceAccessStartActions, hasInstallCapabilityKindForDefinition, hasInstalledMicrotechTrodeSet, hasInstalledUniqueCardDefinition, hiddenReplacementLongtailForDefinition, hiddenZoneArrangeChoiceHandlerHost, hiddenZoneNonSearchChoiceHandlerHost, hiddenZoneSearchActivationHandlerHost, hiddenZoneSearchActivationTargetHost, hiddenZoneSearchChoiceHandlerHost, hiddenZoneSearchHandlerHostBase, hostedProgramStrengthModifier, multiExposeInstalledCorpCardOptionLabel, multiExposeInstalledCorpCardTargets, icebreakerEncounterStrengthBonus, icebreakerHasSpecial, iceChoiceLabelForSide, iceStrengthBonusFor, iceStrengthFor, identityDefinition, identityModifierAmount, incubatorCounterTotal, installCardHost, installedAgendaOperationTarget, installedVirusCounterPurgePreserveSourceIds, installedCorpCardServerContext, installedRunnerConnectionIds, installedRunnerIcebreakerIds, installedRunnerProgramTrashOptionsForInstall, installedRunnerVirusSourceIds, installedVirusCounterTotalForDefinition, installRunnerProgramForFree, installRunnerProgramFromStackWithoutClick, installRunnerProgramFromZoneWithoutClick, installTargetBindingForDefinition, isObligationDebtDefinition, isDrawTaxSourceDefinition, isCorpInstallableCardType, isHackerTrackerCentralCard, isInstalledCorpCardAdvanceable, isCorpInstalledEconomyCreditSource, isRegionUpgrade, isUniqueCard, isVisibleVirusCounterCardForRunner, leavePlayCleanupImplementationsForCard, mergeRunnerDrawSummary, microtechBackupDriveIds, microtechTrodeSetBreakAdditionalCost, movableAdvancementSourceIds, moveAdvancementOptions, mustInstallInsideSubsidiaryDataFort, runStartTaxForCorpRootAssets, normalizeSubtypeLabel, openPostMeatDamageReactionWindow, openRunnerCostPenaltySupportWindow, outermostIceExposures, outermostIceIndex, parseAdvancementDistributionValue, parseVirusCounterPurgePreserveOption, parseRandomDiceSplitChoiceSource, parseRandomDiceSplit, parseRunnerInstalledConnectionTrashBadPublicityChoiceSource, passCurrentEncounteredIce, pendingChoiceResolutionHost, permanentIcebreakerStrengthCounterBonus, playCardExecutionHost, randomDiceSplitOptions, postMeatDamageHiddenResourceCandidates, hardwareTrashByCounterEligibleHardwareIds, hardwareTrashByCounterLegalActions, hardwareTrashByCounterTrashCountFromChoiceSource, hardwareTrashByCounterTrashCountFromPayload, poxCountersForServer, poxInstallTax, preventOneVirusCounterWithCounterPrevention, printedCostCardImplementationMakeRunEffect, processDiscardStep, publicCardTitle, publicIcePositionLabelForCard, publicIceSelectionLabelForCard, pumpAbilityForLegalAction, pumpAmountForLegalAction, pumpDurationForLegalAction, pushCorpTraceDamageOrCardImplementationActions, queueIncubatorStartOfTurnTransforms, rabbitTraceLimitReductionForIceTrace, randomCorpHqCardsWithoutReplacement, randomCorpHqDiscard, recordBartmossEncounterUsage, recordSnowballBreakUsage, refreshRecurringCredits, relativeDamageSubroutineForCurrentEncounter, relativeIceStrengthBonusFor, relativeTraceSubroutinesForCurrentEncounter, remainingReplacementLongtailImplementationForCard, remainingReplacementLongtailImplementationForDefinition, remainingReplacementLongtailKindForCard, remainingReplacementLongtailKindForDefinition, removeActiveObligation, requiresDataFortInstallTarget, resolveCorpObligationEndOfTurn, resolveAgendaCounterOperation, resolveDerezRezzedBlackIceChoice, resolveDelayedAccessEffects, resolveBlinkBreakSubroutineAction, resolveCardImplementationAccessPaymentChoice, resolveCardImplementationAdvancementDistributionChoice, resolveCardImplementationMoveAdvancementChoice, resolveChimeraDaemonTrashChoice, resolveVirusCounterPurgePreserveChoice, resolvePayRezCostToTrashRezzedIceChoice, resolveCorpInstalledEconomyAction, resolveCrashEverettDrawChoice, resolveDealWithMilitech, resolveDiscardChoice, resolveExposeInstalledCorpCardsChoice, resolveFieldReporterEndOfRunnerTurn, resolveCorpChoiceRezOrTrashIceDecisionChoice, resolveCorpChoiceRezOrTrashIceTargetChoice, resolveMultiExposeInstalledCorpCardsChoice, resolveIncubatorTransformChoice, resolveCorpInstalledEconomyCreditChoice, resolveManagementShakeUpOperation, resolveMitWestTier, resolveMultiBreakSubroutinesAction, resolveEndTurnTagIfRunnerReceivedTag, resolvePaidSourceReturnToGripChoice, resolveP358HiddenReplacementChoice, resolveRandomDiceLoopEvent, resolvePostMeatDamageHiddenResourceChoice, resolvePostOnPlayGenericFollowups, resolveHardwareTrashByCounterChoice, resolveHardwareTrashByCounterOperation, resolveDelayedEndTurnDamageEffects, resolveRunnerProgramReturnChoice, resolveRunnerHostingChoice, resolveRunnerInstalledConnectionTrashBadPublicityChoice, resolveRunnerPrivateLookChoice, resolveRunnerProgramTrashBeforeInstallChoice, resolveRunnerTargetedEventImplementation, resolveTrashUnrezzedIceChoice, resolveSetupMulliganChoice, resolveSneakPreviewTemporaryInstallReturns, resolveAdvancementPlacementChoice, resolveAdvancementPlacementOperation, resolveTraceHardwareWreckerSuccess, resolveTraceTrashRunnerResourceSuccess, resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent, resolveV1911CorporateDownsizing, resolveV1911RunnerHiddenZoneAbility, resolveRandomDiceSplitChoice, restorePurgePreservedVirusCounters, returnRunnerInstalledCardToGrip, returnRunnerInstalledProgramsToGripForAccess, revealCorpRdTop, revealRunnerStackTop, rezActionExecutionHost, rezCardHost, rezzedBlackIceIds, rezzedCorpRootCardIds, rezzedIceOutsideThisIceCount, rezzedInstalledIceIds, rezzedCorpInstalledEconomyCreditSourceIds, rootInstallRezzesOnInstall, runAccessTransitionHost, runBreakSubroutineAdditionalCost, runCardImplementationActionHost, runEndCleanupHost, runFortTriggerExecutionHost, runMovementHostForState, runnerAccessActionHost, runnerActionsPerTurn, runnerBreakerActionExecutionHost, runnerCanPayInstallCost, runnerCostPenaltySupportCreditCapacity, runnerCounterDisplayName, runnerDrawActionContext, runnerDrawSummaryPublicPayload, runnerEncounterActionHostForState, runnerEventLongtailForDefinition, runnerEventLongtailKindForDefinition, runnerHasInstalledCardDefinition, runnerHasInstalledDefinition, runnerInstallableProgramIdsForValuPak, runnerInstalledCardCountByDefinition, runnerProgramInstallMemoryReachableAfterTrash, runnerProgramInstallRecurringCreditSourceIds, runnerProgramUsesMemory, runnerRecurringCredits, runnerSpecialTriggerExecutionHost, runnerTagRemovalRecurringCredits, runnerTagRemovalRecurringCreditSourceIds, runnerTraceCounterEffectDefinitions, runnerUtilityLongtailImplementationForCard, runnerUtilityLongtailKindForCard, runnerUtilityLongtailKindForDefinition, runRemainderStrengthBonusForBreaker, runRezWindowHostForState, runStartTaxForServerUpgrades, scoredAgendaAbilityHost, scoredAgendaFlowHost, scoredAgendaImplementationForDefinition, scoredAgendaImplementationForDefinitionId, scoredAgendaKindForDefinition, selectedChoiceCardIds, selectedChoiceCardIdsForChoice, serverDifficultyIncreaseFromRunCounters, serverDifficultyReductionFromUpgrades, setupMulliganChoice, shouldOfferRunnerProgramTrashBeforeInstall, shouldOpenCorpInstalledEconomyCreditChoice, shuffleCorpCardIntoRd, shuffleGripTrashAndStackThenDrawForCardImplementation, shuffleRunnerStack, skivvissCounterTotal, sourcePartsForP334Choice, specialZoneHarnessActions, spendCorpAgendaPointCost, spendEncounterTemporaryTraceCredits, spendHackerTrackerCounters, spendRecurringTraceCreditPool, spendRunnerAccessTrashCredits, spendRunnerInstallCredits, spendRunnerTagRemovalCredits, spendVisibleCardCounter, spyCountersForServer, stableSubtypeList, startDerezRezzedBlackIceChoice, startCardImplementationAdvancementDistributionChoice, startCardImplementationMoveAdvancementChoice, startVirusCounterPurgePreserveChoice, startPayRezCostToTrashRezzedIceChoice, startCorpTurn, startCrashEverettDrawChoice, startDiscardPhase, startPostAccessInstalledProgramChoice, startExposeInstalledCorpCardsChoice, startCorpChoiceRezOrTrashIceChoice, startMultiExposeInstalledCorpCardsChoice, startIncubatorTransformChoice, startCorpInstalledEconomyCreditChoice, startPaidSourceReturnToGripChoice, startHardwareTrashByCounterChoice, startRun, startRunActionExecutionHost, startRunnerHostingChoice, startRunnerPrivateLookAtSpecificCorpCards, startRunnerPrivateLookChoice, startRunnerProgramTrashBeforeInstallChoice, startRunnerTurn, startTrashUnrezzedIceChoice, startSelfModifyingCodeFreeMuChoice, startAdvancementPlacementChoice, startRandomDiceSplitChoice, startVirusCounterRunnerPrivateLookAtStart, subroutinesForCurrentEncounter, successfulRunInterventionHost, swapCorpHqAndRdTop, advancementPlacementLegalActions, advancementPlacementOptions, takeSetupMulligan, totalCounters, traceCounterEffectDefinitionFor, traceOrchestrationHost, trashCorpInstalledCardsInScoredSourceServer, trashCorpInstalledCardToArchives, trashFaceupRdCardsForCascade, trashOlderRegionUpgradesInServer, trashHardwareByCounter, trashRunnerInstalledCardToHeap, trashRunnerInstalledProgram, triggerAbilityExecutionHost, turnBasicExecutionHost, uniqueDirectLongtailImplementationForCard, uniqueDirectLongtailImplementationForDefinition, uniqueDirectLongtailKindForCard, uniqueDirectLongtailKindForDefinition, unrezzedInstalledIceIds, untapRunnerCardsAtTurnStart, v1915InstalledRevealHelperIds, validateAdvancementDistribution, validateCorpInstalledEconomyAction, valuPakProgramInstallActionsRemaining, valuPakTemporaryProgramInstallCredits, variableRezForDefinition, variableTraceSubroutineForCurrentEncounter, virusCounterCascadeTrashAtCorpStart, virusCounterCreditsAtRunnerStart, virusCounterDrawsAtCorpStart, virusCounterImplementationForCard, virusCounterImplementationForDefinition, visibleVirusCounterTargetIds, withoutVariableIceState } = runtimeDelegates;

import {
  cloneState,
  agendaPointsForScoredCard,
  corpScoredBlackOpsAgendaLastTurn,
  finishRun,
  isV097OrLater,
  isV099OrLater,
  recurringTraceCreditPoolTotal,
} from "./runtime-bootstrap-support";

export function configureFlowRuntimeBootstrap({ cardImplementationRuntimeDeps }) {
  function utilityInstalledOnFort(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    kind: Extract<
      CardCorpUtilityImplementation["kind"],
      | "fort_start_reorder_ice"
      | "fort_start_runner_spend_cap"
      | "start_run_redirect_to_source_fort"
    >,
    options: { rezzedOnly?: boolean; unrezzedOnly?: boolean } = {},
  ): CardInstanceId[] {
    return mustServer(state, serverId).root
      .slice()
      .sort()
      .filter((cardId): cardId is CardInstanceId => {
        const instance = state.cardInstances[cardId];
        if (!instance?.definitionId || instance.controller !== "corp") return false;
        if (options.rezzedOnly && instance.rezzed !== true) return false;
        if (options.unrezzedOnly && instance.rezzed === true) return false;
        return corpUtilityImplementationForDefinition(instance.definitionId)?.kind === kind;
      });
  }

  function startOfRunRedirectSourceIds(
    state: GameState,
    originalServerId: Exclude<ServerId, "new_remote">,
  ): CardInstanceId[] {
    return state.corp.servers
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .flatMap((server) =>
        server.id === originalServerId ||
        !canRunnerBeRedirectedToFort(state, server.id)
          ? []
          : utilityInstalledOnFort(
              state,
              server.id,
              "start_run_redirect_to_source_fort",
              {
                rezzedOnly: true,
              },
            ),
      );
  }

  function canRunnerBeRedirectedToFort(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    if (
      isActivityGatedFortRunBlocked(
        fortRunSideFamiliesHostForState(state),
        serverId,
      )
    )
      return false;
    const upgradeRunStartTax = runStartTaxForServerUpgrades(state, serverId);
    const rootAssetRunTax = runStartTaxForCorpRootAssets(state);
    const runStartTaxCredits =
      upgradeRunStartTax.amount + rootAssetRunTax.amount;
    return (
      runStartTaxCredits === 0 ||
      availableRunnerRunStartCredits(runDurationPaymentHost(state)) >=
        runStartTaxCredits
    );
  }

  function startRunRedirectCostCredits(
    state: GameState,
    sourceCardId: CardInstanceId,
  ): number {
    const utility = corpUtilityImplementationForCard(state, sourceCardId);
    if (
      utility?.kind !== "start_run_redirect_to_source_fort" ||
      utility.timing !== "run_start" ||
      utility.redirectTarget !== "source_fort"
    )
      throw new Error("Die Run-Redirect-Quelle ist nicht legal.");
    const credits = Math.max(0, Math.floor(utility.cost.credits));
    if (!Number.isInteger(credits))
      throw new Error("Die Run-Redirect-Kosten sind ungueltig.");
    return credits;
  }

  function openStartOfRunFortUtilityWindow(
    state: GameState,
    legalAction?: LegalAction,
  ): boolean {
    const run = state.run;
    const availableCredits = Math.max(
      0,
      state.corp.credits -
        Math.max(0, Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0)),
    );
    if (!run || state.pendingChoice) return false;
    const originalServerId = run.attackedServerId;
    const redirectSourceIds = startOfRunRedirectSourceIds(
      state,
      originalServerId,
    ).filter(
      (cardId) => startRunRedirectCostCredits(state, cardId) <= availableCredits,
    );
    const reorderSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_reorder_ice",
      { rezzedOnly: true },
    );
    const rezzedSpendCapSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_runner_spend_cap",
      { rezzedOnly: true },
    );
    const unrezzedSpendCapSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_runner_spend_cap",
      { unrezzedOnly: true },
    ).filter((cardId) => state.corp.credits >= rezCostForCard(state, cardId));
    if (
      redirectSourceIds.length === 0 &&
      reorderSourceIds.length === 0 &&
      rezzedSpendCapSourceIds.length === 0 &&
      unrezzedSpendCapSourceIds.length === 0
    )
      return false;
    if (
      redirectSourceIds.length === 0 &&
      reorderSourceIds.length === 0 &&
      unrezzedSpendCapSourceIds.length === 0 &&
      rezzedSpendCapSourceIds.length > 0
    ) {
      openRunnerRunSpendCapChoice(state, rezzedSpendCapSourceIds[0]!, legalAction);
      return true;
    }
    run.runStartInterventions = redirectSourceIds.map((cardId) => ({
      kind: "start_run_redirect_to_source_fort",
      originalServerId,
      sourceCardInstanceId: cardId,
      sourceDefinitionId: definitionFor(state, cardId).id,
      targetServerId: mustInstance(state.cardInstances, cardId).zone.serverId,
      costCredits: startRunRedirectCostCredits(state, cardId),
    }));
    state.pendingChoice = {
      choiceId: `corp_start_of_run_redirect_${state.stateVersion + 1}`,
      side: "corp",
      source: `corp.start_of_run_redirect:${run.runId}:${originalServerId}`,
      prompt: "Start-of-run Utility",
      kind: "select_option",
      options: [
        { id: "pass", label: "Run nicht umlenken" },
        ...redirectSourceIds.map((cardId) => ({
          id: `redirect_${cardId}`,
          label: `${definitionFor(state, cardId).title}: Run umlenken`,
          publicLabel: "Start-of-run Redirect",
          value: cardId,
          serverId: mustInstance(state.cardInstances, cardId).zone.serverId,
        })),
        ...reorderSourceIds.map((cardId) => ({
          id: `herman_${cardId}`,
          label: `${definitionFor(state, cardId).title}: ICE neu anordnen`,
          publicLabel: "Start-of-run Fort-Utility",
          value: cardId,
          serverId: originalServerId,
        })),
        ...rezzedSpendCapSourceIds.map((cardId) => ({
          id: `obfuscated_${cardId}`,
          label: `${definitionFor(state, cardId).title}: Ansage erzwingen`,
          publicLabel: "Start-of-run Spend-Cap",
          value: cardId,
          serverId: originalServerId,
        })),
        ...unrezzedSpendCapSourceIds.map((cardId) => ({
          id: `obfuscated_rez_${cardId}`,
          label: `${definitionFor(state, cardId).title}: rezzen und Ansage erzwingen`,
          publicLabel: "Start-of-run Rez",
          value: cardId,
          serverId: originalServerId,
        })),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "corp";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        startOfRunRedirectWindowOpened: true,
        originalServerId,
        redirectSourceDefinitionIds:
          run.runStartInterventions
            .map((intervention) => intervention.sourceDefinitionId)
            .sort()
            .join(","),
      };
    }
    return true;
  }

  function openRunnerRunSpendCapChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    const run = mustRun(state);
    const source = mustInstance(state.cardInstances, sourceCardId);
    const serverId = source.zone.serverId;
    if (serverId !== run.attackedServerId)
      throw new Error("Die Spend-Cap-Quelle liegt nicht auf dem laufenden Fort.");
    if (
      !source.rezzed ||
      corpUtilityImplementationForDefinition(source.definitionId)?.kind !==
        "fort_start_runner_spend_cap"
    )
      throw new Error("Die Spend-Cap-Quelle ist nicht rezzed.");
    const maxAnnouncement = Math.max(
      0,
      Math.floor(availableRunnerRunCredits(runDurationPaymentHost(state))),
    );
    state.pendingChoice = {
      choiceId: `runner_run_spend_cap_${state.stateVersion + 1}`,
      side: "runner",
      source: `corp.start_of_run_redirect.runner_spend_cap:${run.runId}:${sourceCardId}:${serverId}`,
      prompt: "Run-Bit-Ausgabe ansagen",
      kind: "select_option",
      options: Array.from({ length: maxAnnouncement + 1 }, (_, amount) => ({
        id: `spend_${amount}`,
        label: `${amount}`,
        value: amount,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "runner";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runCreditSpendCapChoiceOpened: true,
        sourceDefinitionId: source.definitionId,
        serverId,
      };
    }
  }

  function canReplaceFortCardsFromHq(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    const server = mustServer(state, serverId);
    const removedCount = server.ice.length + server.root.length;
    if (removedCount === 0) return true;
    const candidates = state.corp.hq
      .filter((cardId) => {
        const definition = definitionFor(state, cardId);
        return (
          definition.side === "corp" &&
          (definition.type === "ice" ||
            definition.type === "asset" ||
            definition.type === "agenda" ||
            definition.type === "upgrade")
        );
      })
      .sort();
    const orderIsLegal = (order: CardInstanceId[]): boolean => {
      const testState = cloneState(state);
      const testServer = mustServer(testState, server.id);
      testServer.ice = [];
      testServer.root = [];
      for (const cardId of order) {
        const definition = definitionFor(testState, cardId);
        removeFromAllZones(testState, cardId);
        if (definition.type === "ice") {
          testServer.ice.push(cardId);
          testState.cardInstances[cardId] = {
            ...mustInstance(testState.cardInstances, cardId),
            zone: { side: "corp", zone: "serverIce", serverId: testServer.id },
          };
          continue;
        }
        if (!canInstallCorpRootCardInServer(testState, definition, testServer))
          return false;
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
    };
    const visit = (startIndex: number, selected: CardInstanceId[]): boolean => {
      if (selected.length === removedCount) return orderIsLegal(selected);
      for (let index = startIndex; index < candidates.length; index += 1) {
        if (visit(index + 1, [...selected, candidates[index]!])) return true;
      }
      return false;
    };
    return visit(0, []);
  }

  function spendCorpRunTemporaryCreditsForCurrentRunCost(
    state: GameState,
    amount: number,
  ): void {
    if (amount <= 0) return;
    if (!state.run) throw new Error("Run-Kosten brauchen einen laufenden Run.");
    const installRezReserved = Math.max(
      0,
      Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
    );
    const spendableCorpCredits = Math.max(0, state.corp.credits - installRezReserved);
    if (spendableCorpCredits < amount)
      throw new Error("Die Korp kann die Run-Kosten nicht bezahlen.");
    const runTemporarySpend = Math.min(
      amount,
      Math.max(0, Math.floor(state.run.corpRunTemporaryCredits?.remaining ?? 0)),
    );
    if (runTemporarySpend > 0 && state.run.corpRunTemporaryCredits)
      state.run.corpRunTemporaryCredits.remaining = Math.max(
        0,
        state.run.corpRunTemporaryCredits.remaining - runTemporarySpend,
      );
    state.corp.credits -= amount;
  }

  function resolveTestSpinRunEnd(
    state: GameState,
    run: NonNullable<GameState["run"]>,
    legalAction?: LegalAction,
  ): { handled: boolean; stateChanged?: boolean } {
    const pending = run.testSpinTemporaryInstall;
    if (!pending) return { handled: false };
    const sourceDefinition = DEMO_CARDS_BY_ID[pending.sourceDefinitionId];
    const instance = state.cardInstances[pending.cardId];
    if (
      instance &&
      state.runner.rig.programs.includes(pending.cardId) &&
      instance.zone.side === "runner" &&
      instance.zone.zone === "rig"
    ) {
      const definition = definitionFor(state, pending.cardId);
      removeFromAllZones(state, pending.cardId);
      state.runner.stack.push(pending.cardId);
      if (runnerProgramUsesMemory(state, pending.cardId)) {
        state.runner.memoryUsed = Math.max(
          0,
          state.runner.memoryUsed - (definition.memoryCost ?? 0),
        );
      }
      state.cardInstances[pending.cardId] = {
        ...cardInstanceWithoutCounters(instance),
        faceup: false,
        rezzed: false,
        zone: { side: "runner", zone: "stack" },
      };
      shuffleRunnerStack(
        state,
        `run_end.test_spin.return_to_stack.${run.runId}.${pending.cardId}`,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "pro018_test_spin_return_to_stack",
          sourceDefinitionId: pending.sourceDefinitionId,
          sourceTitle: sourceDefinition?.title ?? "Test Spin",
          returnedProgramDefinitionId: definition.id,
          returnedToStack: true,
          shufflePerformed: true,
          shuffled: true,
          randomCounterAfter: state.randomCounter,
        };
      }
      return { handled: true, stateChanged: true };
    }
    const penalty = 4 + Math.max(0, Math.floor(pending.installCostPenalty));
    const paid = Math.min(state.runner.credits, penalty);
    if (paid > 0) spendCredits(state, "runner", paid);
    const unpaid = penalty - paid;
    let damageSummary: DamageSummary | undefined;
    if (unpaid > 0) {
      damageSummary = doDamage(state, {
        damageId: `${run.runId}.${pending.sourceDefinitionId}.test_spin_penalty`,
        damageType: "meat",
        amount: unpaid,
        source: `run_end:${pending.sourceDefinitionId}`,
      });
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "pro018_test_spin_penalty",
        sourceDefinitionId: pending.sourceDefinitionId,
        sourceTitle: sourceDefinition?.title ?? "Test Spin",
        returnedToStack: false,
        penaltyAmount: penalty,
        penaltyCreditsPaid: paid,
        runnerCreditsAfter: state.runner.credits,
        ...(damageSummary
          ? {
              damageResolved: true,
              damageType: damageSummary.damageType,
              damageAmount: damageSummary.amount,
              cardsTrashed: damageSummary.cardsTrashed,
              flatline: damageSummary.flatline,
            }
          : {}),
      };
    }
    return { handled: true, stateChanged: true };
  }

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
      canReplaceFortCardsFromHq,
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
      applyRunStartRandomStrengthBonus,
      openStartOfRunFortUtilityWindow,
      finishRun,
      successfulRunInterventionHost,
      startPostAccessInstalledProgramChoice,
    },
    payment: {
      spendCredits,
      credits,
      rezCostForCard,
      creditCostForAction,
      hostedPaymentCredits,
      spendCorpRunTemporaryCreditsForCurrentRunCost,
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
      hiddenReplacementLongtailKindForDefinition: (definitionId) =>
        cardImplementationForDefinitionId(definitionId)?.hiddenReplacementLongtail
          ?.kind,
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
      taggedRunnerMeatDamageUpgrade: DEDICATED_RESPONSE_TEAM_ACCESS_DAMAGE_UPGRADE_ID,
      accessNetDamageUpgrade: DIETER_ESSLIN_ACCESS_DAMAGE_UPGRADE_ID,
      oncePerRunAccessTraceUpgrade: TURBEAU_DELACROIX_ACCESS_DAMAGE_UPGRADE_ID,
      hardwareTrashByAdvancementAsset:
        CORPRUNNERS_SHATTERED_REMAINS_ACCESS_DAMAGE_ASSET_ID,
      programTrashByAdvancementAsset: EXPERIMENTAL_AI_ACCESS_DAMAGE_ASSET_ID,
      advancementCoreDamageAsset: VACANT_SOULKILLER_ACCESS_DAMAGE_ASSET_ID,
      advancementNetDamageAsset: VIRUS_TEST_SITE_ACCESS_DAMAGE_ASSET_ID,
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
        recurringTraceCreditPoolTotal,
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
        openDamageResolutionWindow,
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
        addVirusCounterWithCounterPrevention,
        preventOneVirusCounterWithCounterPrevention,
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
        awardRunnerEventAgendaPoint,
        activeObligationCount,
        addActiveObligation,
        applyRunnerForgoNextAction,
        hasInstalledMicrotechTrodeSet,
        traceCounterEffectDefinitionFor,
        installedRunnerVirusSourceIds,
        virusCounterImplementationForCard,
        agendaPointsForScoredCard,
        snapshotPersistentStealCostModifiersForSource,
        archivesAccessRequiresDecisionOrEffect,
        resolveTestSpinRunEnd,
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

  return {
    runAccessLegalActionHostComposition,
    runFlow,
    accessFlow,
    damageCoreHost,
  };
}
