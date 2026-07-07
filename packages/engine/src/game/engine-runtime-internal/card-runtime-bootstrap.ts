import * as runtimeDelegates from "./runtime-delegates";
import {
  DEMO_CARDS_BY_ID,
  type ActionType,
  type ChoiceRequest,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CardType,
  type CounterType,
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
  temporaryProgramInstallableProgramIds,
  temporaryProgramInstallSourceOptions,
  startAujourdOuiTop5Activation,
  startRunnerStackSearchChoiceActivation,
  startHiddenStackProgramInstallActivation,
  startTemporaryProgramInstallSourceActivation,
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
  startInstalledCardTrashForCreditsChoice,
  startSecretSpendGuessThenTargetedBypassRunHideChoice,
  startCorpHqRetainPaymentChoice,
  type HiddenZoneNonSearchChoiceHandlerHost,
} from "../hidden-zone/nonsearch-choice-handlers";
import {
  handleCorpZoneChoice,
  resolveHqArchivesShuffleDraw,
  resolveReschedulerHqShuffleDraw,
  startScoredAgendaHqShuffleCreditsChoice,
  startCorpHqAgendaRevealChoice,
  type CorpZoneChoiceHandlerHost,
} from "../hidden-zone/corp-zone-choice-handlers";
import {
  handleCorpInstallRezSequenceChoice,
  resolveAgendaPurgeInstallTargets,
  startHqToNewRemoteInstallRezChoice,
  startScoredAgendaFreeRezChoice,
  type CorpInstallRezSequenceHandlerHost,
} from "../corp/install-rez-sequence-handlers";
import {
  handleScoredAgendaFlowChoice,
  startScoredAgendaStartDrawChoice,
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
  applySuccessfulRunExtraRunFollowup,
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
  resolveActiveIceProgramTrashChoice as resolveActiveIceProgramTrashChoiceInRunModule,
  type EncounterResolutionHost,
} from "../run/encounter-resolution";
import {
  applyPassedIceRunEndTrigger,
  isTraceLinkForceJackOutSource,
  markTraceLinkForceJackOutAfterEncounter,
  resolveFullyBrokenPassedIceDerezAndEndRun as resolveFullyBrokenPassedIceDerezAndEndRunInRunModule,
  resolveFullyBrokenPassedIceTrash as resolveFullyBrokenPassedIceTrashInRunModule,
  resolveSecretSpendCompareChoice as resolveSecretSpendCompareChoiceInRunModule,
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
  COUNTER_OPERATION_SOURCES,
  OVERADVANCE_AGENDA_SOURCES,
  scoredAgendaCounterCreditPayload,
  scoredAgendaCounterCreditProfileForDefinition,
  scoredAgendaCounterCreditProfileForPayload,
  SCORED_REVEAL_AGENDA_SOURCES,
  SERVER_DIFFICULTY_UPGRADE_SOURCES,
} from "../../mechanics/agenda-scoring";
import {
  FLATLINE_REPLACEMENT_EVENT_SOURCE,
  OVERADVANCE_DIRECTOR_AGENDA_SOURCE,
  ACCESS_HARDWARE_TRASH_ASSET_SOURCE,
  ACCESS_PROGRAM_TRASH_ASSET_SOURCE,
  COUNTER_GAIN_PROGRAM_SOURCE,
  COUNTER_CREDIT_OPERATION_SOURCE,
  OVERADVANCE_ACQUISITION_AGENDA_SOURCE,
  ADVANCEMENT_REASSIGN_OPERATION_SOURCE,
  AGENDA_ADVANCE_OPERATION_SOURCE,
  ECONOMY_RECOVERY_OPERATION_SOURCE,
  ADVANCEMENT_PLACEMENT_OPERATION_SOURCE,
  TEAM_COUNTER_OPERATION_SOURCE,
  ACCESS_CORE_DAMAGE_ASSET_SOURCE,
  ACCESS_NET_DAMAGE_ASSET_SOURCE,
} from "../../mechanics/agenda-operation-effects";
import {
  INSTALLED_CARD_LIMIT_ASSET_SOURCE,
  VIRUS_COUNTER_ASSET_SOURCE,
  ACCESS_SETUP_AMBUSH_ASSET_SOURCE,
  ACCESS_TRAP_AMBUSH_ASSET_SOURCE,
} from "../../mechanics/asset-node-effects";
import {
  ABLATIVE_COUNTER_HARDWARE_SOURCE,
  ABLATIVE_COUNTER_HARDWARE_STARTING_COUNTERS,
  RUNNER_DAMAGE_PREVENTION_RESOURCE_SOURCE,
  SELF_REPAIR_DAMAGE_PREVENTION_PROGRAM_SOURCE,
  CORE_REPLACEMENT_DAMAGE_PREVENTION_SOURCE,
  RUNTIME_DAMAGE_PREVENTION_PROFILES,
} from "../../mechanics/damage-prevention";
import {
  ARCHIVES_TO_HQ_OPERATION_SOURCE,
  HQ_AGENDA_REVEAL_ASSET_SOURCE,
  RD_TOP5_REORDER_OPERATION_SOURCE,
  COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE,
  DAILY_CREDIT_RESOURCE_SOURCE,
  GRIP_TRASH_EVENT_SOURCE,
  STACK_TOP5_EVENT_SOURCE,
  SERVER_EXPOSE_PROGRAM_SOURCES,
  SERVER_ICE_SWAP_UPGRADE_SOURCE,
  PAID_STACK_SEARCH_RESOURCE_SOURCE,
  STACK_SEARCH_PROGRAM_SOURCES,
  STACK_TOP_REORDER_RESOURCE_SOURCE,
} from "../../mechanics/hidden-zone";
import { TAG_HANDSIZE_ASSET_SOURCE } from "../../mechanics/global-modifiers";
import { COUNTER_UPGRADE_SOURCES } from "../../mechanics/hosting-counters";
import {
  BLACK_ICE_DEREZ_EVENT_SOURCE,
  HQ_ICE_JETTISON_EVENT_SOURCE,
  RUNNER_CARD_INSTALL_OPERATION_SOURCE,
  FORCE_REZ_EVENT_SOURCE,
  BREAKER_DISABLE_PROGRAM_SOURCE,
  HOST_RETURN_HARDWARE_SOURCE,
  INSTALLED_CARD_TRASH_EVENT_SOURCE,
  TAG_RETURN_EVENT_SOURCE,
  HQ_INTERFACE_PROGRAM_SOURCE,
  HQ_CARD_TRASH_EVENT_SOURCE,
  HQ_ACCESS_RETAIN_EVENT_SOURCE,
  PROGRAM_BUNDLE_INSTALL_EVENT_SOURCE,
  ZETATECH_SOFTWARE_INSTALLER_SOURCE,
} from "../../mechanics/longtail-card-effects";
import {
  corpInstalledEconomyActionPayload,
  corpInstalledEconomyActionProfileForDefinition,
  corpInstalledEconomyActionProfileForPayload,
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
  BOARDWALK_RANDOM_PROGRAM_SOURCE,
  RANDOM_RESOURCE_SOURCE,
  RUNNER_RANDOM_PROGRAM_SOURCES,
} from "../../mechanics/random-effects";
import {
  RUN_ACCESS_PRESSURE_EVENT_SOURCE,
  RUN_REPLACEMENT_OVERLAP_EVENT_SOURCE,
  TRACE_AWARE_RUN_EVENT_SOURCE,
} from "../../mechanics/run-access";
import {
  ACCESS_COST_UPGRADE_SOURCE,
  ACCESS_MEAT_DAMAGE_UPGRADE_SOURCE,
  ACCESS_NET_DAMAGE_UPGRADE_SOURCE,
  ACCESS_TRACE_DAMAGE_UPGRADE_SOURCE,
} from "../../mechanics/server-upgrades";
import {
  RUN_TAX_UPGRADE_SOURCES,
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
import {
  replaceFortCardsFromHq,
  resolveFortHqReplacementChoice,
} from "./fort-hq-replacement-runtime";

const { abilityMetadata, accessEffectHandlerHost, accessFlowHost, activeObligationCount, activatedCardImplementationExecutionHost, activeCrashEverettSourceId, addActiveObligation, addCounterToAllInstalledRunnerIcebreakers, addCurrentRunAccessCount, addCorpTraceCounterPoolCounters, addRunnerFutureActionDebt, addVirusCounterWithCounterPrevention, addVisibleCardCounter, advanceableInstalledCardTargets, advancementDistributionOptions, affordableRezzedInstalledIceIdsForRunner, agendaPoints, appendRegionReplacementTrashEffect, appendResolvedEffectsToPayload, applyRunStartRandomStrengthBonus, applyCorpStartOfTurnEffects, applyPurgeableRunnerVirusCorpStartEffects, applyStartTurnRandomEffectTables, applyRunnerDrawSummaryPayload, applyRunnerForgoNextAction, applyRunnerStartOfTurnEffects, applyRunnerTraceCounterRunStartEffects, applyAdvancementCounterPlacement, archivesAccessRequiresDecisionOrEffect, assertBreakSubroutineCostQuoteValid, assertCorpIceInstallCostValid, assertCurrentSubroutineMatchesLegalAction, assertNonNegativeAmount, assertPositiveIntegerAmount, automaticCounterChangeEffect, automaticDrawCardsEffect, automaticGainCreditsEffect, automaticLoseCreditsEffect, automaticStealAgendaEffect, automaticTagEffect, automaticTrashCardEffect, availableRunnerProgramInstallCredits, availableRunnerTagRemovalCredits, awardRunnerEventAgendaPoint, backupProgramsOnTrashBackupHardwareBeforeTrash, boardStateActionExecutionHost, breachStateHost, breakAbilityForLegalAction, breakSubroutineCostBreakdown, canHostProgramOnDaemon, canInstallCorpRootCardInServer, canInstallRunnerProgramFromZone, canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity, cardHasSubtype, cardImplementationRunnerEventResolver, cardInstallCapabilitiesForDefinition, choiceAction, chooseCorpAgendasForPointCost, cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay, clearEdgerunnerTempsInstallFlags, clearValuPakProgramInstallFlags, clickCostForAction, closeRunnerCostPenaltySupportWindowForPayment, cockroachCounterTotal, cockroachRandomHqDiscardActive, virusCounterPurgePreserveTargets, completeDiscardPhase, consumeEdgerunnerTempsInstallAction, consumeRunnerFutureActionDebt, consumeValuPakProgramInstallAction, continueRun, continueRandomDiceLoop, corpAgendaCounterOperationTarget, corpAgendaPointTotal, corpIceInstallAdditionalCost, corpIceInstallBaseCost, corpIceInstallTotalCost, corpInstallRezSequenceHandlerHost, corpOperationResolutionHost, corpRegionUpgradeIdsInServer, corpRootAgendaOrNodeCapacityInServer, corpRunnerActionPaidWindowActions, corpScoredAgendaForfeitTargets, corpSpecialDamageAbilityHost, corpTraceDamageAbilityHost, corpUtilityImplementationForCard, corpZoneChoiceHandlerHost, counterUtilityTriggerExecutionHost, creditCostForAction, creditEconomyExecutionHost, creditTextForPrompt, daemonHostedMemoryUsed, daemonHostingCapacity, diePromptText, discardChoice, discardRandomCorpHqCards, drawRunnerCard, drawRunnerCards, dupreStrengthCounterBonus, edgerunnerTempsInstallActionsRemaining, effectiveSubtypesForCard, emptyRunnerDrawSummary, encounterEntryHostForState, encounterPrintedEffectHostForState, encounterPrintedNonTraceHostForState, encounterResolutionHostForState, encounterSpecialWindowHostForState, encounterTemporaryTraceCreditsAvailable, endTurn, executeEffectCommands, expireScoredAgendaInstallRezCreditAbilities, exposeCorpCardInServer, exposedCorpCardInServer, exposeInstalledCorpCardForImplementation, exposeInstalledCorpCardLabel, exposeInstalledCorpCardsChoiceOptions, exposeInstalledCorpCardTargets, exposeOutermostIceOfEachDataFort, forfeitCorpAgendaForPointCost, forfeitRunnerAgendaForPointCost, fortCapacityModifiersForCard, fortPassWindowHostForState, fortRunSideFamiliesHostForState, corpTraceCounterPoolSourceIds, corpTraceCounterPoolTotal, corpTraceCounterPoolCounterType, hasCorpUtilityKind, hasHiddenResourceAccessStartActions, hasInstallCapabilityKindForDefinition, hasInstalledRunnerApDamageReducerHardware, hasInstalledUniqueCardDefinition, hiddenReplacementLongtailForDefinition, hiddenZoneArrangeChoiceHandlerHost, hiddenZoneNonSearchChoiceHandlerHost, hiddenZoneSearchActivationHandlerHost, hiddenZoneSearchActivationTargetHost, hiddenZoneSearchChoiceHandlerHost, hiddenZoneSearchHandlerHostBase, hostedProgramStrengthModifier, multiExposeInstalledCorpCardOptionLabel, multiExposeInstalledCorpCardTargets, icebreakerEncounterStrengthBonus, icebreakerHasSpecial, iceChoiceLabelForSide, iceStrengthBonusFor, iceStrengthFor, identityDefinition, identityModifierAmount, incubatorCounterTotal, installCardHost, installedAgendaOperationTarget, installedVirusCounterPurgePreserveSourceIds, installedCorpCardServerContext, installedRunnerConnectionIds, installedRunnerIcebreakerIds, installedRunnerProgramTrashOptionsForInstall, installedRunnerVirusSourceIds, installedVirusCounterTotalForDefinition, installRunnerProgramForFree, installRunnerProgramFromStackWithoutClick, installRunnerProgramFromZoneWithoutClick, installTargetBindingForDefinition, isObligationDebtDefinition, isDrawTaxSourceDefinition, isCorpInstallableCardType, isCorpTraceCounterPoolSource, isInstalledCorpCardAdvanceable, isCorpInstalledEconomyCreditSource, isRegionUpgrade, isUniqueCard, isVisibleVirusCounterCardForRunner, leavePlayCleanupImplementationsForCard, mergeRunnerDrawSummary, installedProgramTrashBackupHardwareIds, runnerHardwareBreakSubroutineAdditionalCost, movableAdvancementSourceIds, moveAdvancementOptions, mustInstallInsideSubsidiaryDataFort, runStartTaxForCorpRootAssets, normalizeSubtypeLabel, openPostMeatDamageReactionWindow, openRunnerCostPenaltySupportWindow, outermostIceExposures, outermostIceIndex, parseAdvancementDistributionValue, parseVirusCounterPurgePreserveOption, parseRandomDiceSplitChoiceSource, parseRandomDiceSplit, parseRunnerInstalledConnectionTrashBadPublicityChoiceSource, passCurrentEncounteredIce, pendingChoiceResolutionHost, permanentIcebreakerStrengthCounterBonus, playCardExecutionHost, randomDiceSplitOptions, postMeatDamageHiddenResourceCandidates, hardwareTrashByCounterEligibleHardwareIds, hardwareTrashByCounterLegalActions, hardwareTrashByCounterTrashCountFromChoiceSource, hardwareTrashByCounterTrashCountFromPayload, poxCountersForServer, poxInstallTax, preventOneVirusCounterWithCounterPrevention, printedCostCardImplementationMakeRunEffect, processDiscardStep, publicCardTitle, publicIcePositionLabelForCard, publicIceSelectionLabelForCard, pumpAbilityForLegalAction, pumpAmountForLegalAction, pumpDurationForLegalAction, pushCorpTraceDamageOrCardImplementationActions, queueIncubatorStartOfTurnTransforms, rabbitTraceLimitReductionForIceTrace, randomCorpHqCardsWithoutReplacement, randomCorpHqDiscard, recordBartmossEncounterUsage, recordSnowballBreakUsage, refreshRecurringCredits, relativeDamageSubroutineForCurrentEncounter, relativeIceStrengthBonusFor, relativeTraceSubroutinesForCurrentEncounter, remainingReplacementLongtailImplementationForCard, remainingReplacementLongtailImplementationForDefinition, remainingReplacementLongtailKindForCard, remainingReplacementLongtailKindForDefinition, removeActiveObligation, requiresDataFortInstallTarget, resolveCorpObligationEndOfTurn, resolveAgendaCounterOperation, resolveDerezRezzedBlackIceChoice, resolveDelayedAccessEffects, resolveBlinkBreakSubroutineAction, resolveCardImplementationAccessPaymentChoice, resolveCardImplementationAdvancementDistributionChoice, resolveCardImplementationMoveAdvancementChoice, resolveChimeraDaemonTrashChoice, resolveVirusCounterPurgePreserveChoice, resolvePayRezCostToTrashRezzedIceChoice, resolveCorpInstalledEconomyAction, resolveCrashEverettDrawChoice, resolveRunnerIcebreakerCounterEvent, resolveDiscardChoice, resolveExposeInstalledCorpCardsChoice, resolveFieldReporterEndOfRunnerTurn, resolveCorpChoiceRezOrTrashIceDecisionChoice, resolveCorpChoiceRezOrTrashIceTargetChoice, resolveMultiExposeInstalledCorpCardsChoice, resolveIncubatorTransformChoice, resolveCorpInstalledEconomyCreditChoice, resolveCorpOperationAddAdvancementCounters, resolveRunnerGripHeapStackShuffleDrawEvent, resolveMultiBreakSubroutinesAction, resolveEndTurnTagIfRunnerReceivedTag, resolvePaidSourceReturnToGripChoice, resolveP358HiddenReplacementChoice, resolveRandomDiceLoopEvent, resolvePostMeatDamageHiddenResourceChoice, resolvePostOnPlayGenericFollowups, resolveHardwareTrashByCounterChoice, resolveHardwareTrashByCounterOperation, resolveDelayedEndTurnDamageEffects, resolveRunnerProgramReturnChoice, resolveRunnerHostingChoice, resolveRunnerInstalledConnectionTrashBadPublicityChoice, resolveRunnerPrivateLookChoice, resolveRunnerProgramTrashBeforeInstallChoice, resolveRunnerTargetedEventImplementation, resolveTrashUnrezzedIceChoice, resolveSetupMulliganChoice, resolveTemporaryProgramInstallReturns, resolveAdvancementPlacementChoice, resolveAdvancementPlacementOperation, resolveTraceHardwareWreckerSuccess, resolveTraceTrashRunnerResourceSuccess, resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent, resolveScoredAgendaCorpRdTopReveal, resolveV1911RunnerHiddenZoneAbility, resolveRandomDiceSplitChoice, restorePurgePreservedVirusCounters, returnRunnerInstalledCardToGrip, returnRunnerInstalledProgramsToGripForAccess, revealCorpRdTop, revealRunnerStackTop, rezActionExecutionHost, rezCardHost, rezzedBlackIceIds, rezzedCorpRootCardIds, rezzedIceOutsideThisIceCount, rezzedInstalledIceIds, rezzedCorpInstalledEconomyCreditSourceIds, rootInstallRezzesOnInstall, runAccessTransitionHost, runBreakSubroutineAdditionalCost, runCardImplementationActionHost, runEndCleanupHost, runFortTriggerExecutionHost, runMovementHostForState, runnerAccessActionHost, runnerActionsPerTurn, runnerBreakerActionExecutionHost, runnerCanPayInstallCost, runnerCostPenaltySupportCreditCapacity, runnerCounterDisplayName, runnerDrawActionContext, runnerDrawSummaryPublicPayload, runnerEncounterActionHostForState, runnerEventLongtailForDefinition, runnerEventLongtailKindForDefinition, runnerHasInstalledCardDefinition, runnerHasInstalledDefinition, runnerInstallableProgramIdsForValuPak, runnerInstalledCardCountByDefinition, runnerProgramInstallMemoryReachableAfterTrash, runnerProgramInstallRecurringCreditSourceIds, runnerProgramUsesMemory, runnerRecurringCredits, runnerSpecialTriggerExecutionHost, runnerTagRemovalRecurringCredits, runnerTagRemovalRecurringCreditSourceIds, runnerTraceCounterEffectDefinitions, runnerUtilityLongtailImplementationForCard, runnerUtilityLongtailKindForCard, runnerUtilityLongtailKindForDefinition, runRemainderStrengthBonusForBreaker, runRezWindowHostForState, runStartTaxForServerUpgrades, scoredAgendaAbilityHost, scoredAgendaFlowHost, scoredAgendaImplementationForDefinition, scoredAgendaImplementationForDefinitionId, scoredAgendaKindForDefinition, selectedChoiceCardIds, selectedChoiceCardIdsForChoice, serverDifficultyIncreaseFromRunCounters, serverDifficultyReductionFromUpgrades, setupMulliganChoice, shouldOfferRunnerProgramTrashBeforeInstall, shouldOpenCorpInstalledEconomyCreditChoice, shuffleCorpCardIntoRd, shuffleGripTrashAndStackThenDrawForCardImplementation, shuffleRunnerStack, skivvissCounterTotal, sourcePartsForP334Choice, specialZoneHarnessActions, spendCorpAgendaPointCost, spendEncounterTemporaryTraceCredits, spendCorpTraceCounterPoolCounters, spendRecurringTraceCreditPool, spendRunnerAccessTrashCredits, spendRunnerInstallCredits, spendRunnerTagRemovalCredits, spendVisibleCardCounter, spyCountersForServer, stableSubtypeList, startDerezRezzedBlackIceChoice, startCardImplementationAdvancementDistributionChoice, startCardImplementationMoveAdvancementChoice, startVirusCounterPurgePreserveChoice, startPayRezCostToTrashRezzedIceChoice, startCorpTurn, startCrashEverettDrawChoice, startDiscardPhase, startPostAccessInstalledProgramChoice, startExposeInstalledCorpCardsChoice, startCorpChoiceRezOrTrashIceChoice, startMultiExposeInstalledCorpCardsChoice, startIncubatorTransformChoice, startCorpInstalledEconomyCreditChoice, startPaidSourceReturnToGripChoice, startHardwareTrashByCounterChoice, startRun, startRunActionExecutionHost, startRunnerHostingChoice, startRunnerPrivateLookAtSpecificCorpCards, startRunnerPrivateLookChoice, startRunnerProgramTrashBeforeInstallChoice, startRunnerTurn, startTrashUnrezzedIceChoice, startRunnerProgramFreeMemoryChoice, startAdvancementPlacementChoice, startRandomDiceSplitChoice, startVirusCounterRunnerPrivateLookAtStart, subroutinesForCurrentEncounter, successfulRunInterventionHost, swapCorpHqAndRdTop, advancementPlacementLegalActions, advancementPlacementOptions, takeSetupMulligan, totalCounters, traceCounterEffectDefinitionFor, traceOrchestrationHost, trashCorpInstalledCardsInScoredSourceServer, trashCorpInstalledCardToArchives, trashFaceupRdCardsForCascade, trashOlderRegionUpgradesInServer, trashHardwareByCounter, trashRunnerInstalledCardToHeap, trashRunnerInstalledProgram, triggerAbilityExecutionHost, turnBasicExecutionHost, uniqueDirectLongtailImplementationForCard, uniqueDirectLongtailImplementationForDefinition, uniqueDirectLongtailKindForCard, uniqueDirectLongtailKindForDefinition, unrezzedInstalledIceIds, untapRunnerCardsAtTurnStart, v1915InstalledRevealHelperIds, validateAdvancementDistribution, validateCorpInstalledEconomyAction, valuPakProgramInstallActionsRemaining, valuPakTemporaryProgramInstallCredits, variableRezForDefinition, variableTraceSubroutineForCurrentEncounter, virusCounterCascadeTrashAtCorpStart, virusCounterCreditsAtRunnerStart, virusCounterDrawsAtCorpStart, virusCounterImplementationForCard, virusCounterImplementationForDefinition, visibleVirusCounterTargetIds, withoutVariableIceState } = runtimeDelegates;

import {
  corpScoredBlackOpsAgendaLastTurn,
  finishRun,
  resolveRunnerLastTurnInstalledResourceTargetId,
  runnerStoleAgendaSubtypeThisTurn,
  scoreInstalledRunnerProgramAsAgenda,
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
        startPayRezCostToTrashRezzedIceChoice,
        startTrashUnrezzedIceChoice,
        startCorpChoiceRezOrTrashIceChoice,
        startDerezRezzedBlackIceChoice,
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

  function doubleChosenIceStrengthUntilEndOfTurn(
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    targetIceId: CardInstanceId,
    maxStrength: number,
  ): { publicPayload: Record<string, string | number | boolean> } {
    const target = mustInstance(state.cardInstances, targetIceId);
    const targetDefinition = definitionFor(state, targetIceId);
    if (
      target.controller !== "corp" ||
      target.zone.side !== "corp" ||
      target.zone.zone !== "serverIce" ||
      targetDefinition.type !== "ice" ||
      !target.rezzed
    )
      throw new Error("Sterdroid braucht ein gerezztes installiertes ICE.");
    const currentStrength = iceStrengthFor(state, targetIceId);
    const cappedStrength = Math.min(maxStrength, currentStrength * 2);
    const amount = Math.max(0, cappedStrength - currentStrength);
    if (amount > 0) {
      state.cardInstances[targetIceId] = {
        ...target,
        strengthModifier: target.strengthModifier + amount,
      };
      state.temporaryIceStrengthModifiersUntilEndOfTurn = [
        ...(state.temporaryIceStrengthModifiersUntilEndOfTurn ?? []),
        {
          sourceCardInstanceId: sourceCardId,
          sourceDefinitionId,
          targetIceId,
          amount,
          turnSerial: Math.max(0, Math.floor(state.turnSerial ?? 0)),
          expires: "turn_end",
        },
      ];
    }
    const payload = {
      sourceDefinitionId,
      targetCardDefinitionId: targetDefinition.id,
      iceStrengthBefore: currentStrength,
      iceStrengthAfter: currentStrength + amount,
      iceStrengthBonusApplied: amount,
      iceStrengthMaxCap: maxStrength,
    };
    legalAction.payload = { ...(legalAction.payload ?? {}), ...payload };
    return { publicPayload: payload };
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
      temporaryCredits.remaining = Math.max(
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
        finishRun: (state, legalAction, successful) =>
          finishRun(state, successful, legalAction),
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
        scoreSourceAsAgenda: scoreInstalledRunnerProgramAsAgenda,
        installedAdvanceableCorpCardTargetCount: (state) =>
          advanceableInstalledCardTargets(state).length,
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
        doubleChosenIceStrengthUntilEndOfTurn,
        trashTopCorpRdCards,
        rezCostForCard,
        startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice,
        startPaidSourceReturnToGripChoice,
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
