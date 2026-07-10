import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import {
  CARD_DEFINITIONS_BY_ID,
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
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
import {
  configureEventContextHostComposition,
} from "../events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "../win-conditions";
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
import { hashState } from "../hash";
import { applyAction as applyActionFromGame } from "../apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "../apply/apply-action-hosts";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "../view/card-view";
import { toPublicEvent } from "../view/public-event-view";
import { validateGameState } from "../validation";
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
import type {
  RunnerTraceCounterEffectRuntime,
  RuntimeDeps,
} from "./runtime-shared";


export function createDamageTraceRuntimeHosts(deps: RuntimeDeps) {
  function runnerTraceCounterEffectDefinitions(): RunnerTraceCounterEffectRuntime[] {
    return CARD_IMPLEMENTATIONS.flatMap((implementation) =>
      (implementation.runnerCounterEffects ?? []).map((counterEffect) => ({
        ...counterEffect,
        sourceDefinitionId: implementation.cardDefinitionId,
      })),
    );
  }

  function runnerCounterDisplayName(counterType: CounterType): string {
    if (counterType === "trace_tag_counter") return "Data-Raven-Counter";
    if (counterType === "baskerville") return "Baskerville-Counter";
    if (counterType === "cerberus") return "Cerberus-Counter";
    if (counterType === "mastiff") return "Mastiff-Counter";
    if (counterType === "link_reduction_counter") return "Doppelganger-Counter";
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

  function isObligationDebtDefinition(definitionId: CardDefinitionId): boolean {
    return (
      remainingReplacementLongtailKindForDefinition(definitionId) ===
      "obligation_debt"
    );
  }

  function isDrawTaxSourceDefinition(state: GameState, cardId: CardInstanceId): boolean {
    return (
      remainingReplacementLongtailKindForCard(state, cardId) ===
      "runner_draw_tax_tag"
    );
  }

  function isCorpInstalledEconomyCreditSource(state: GameState, cardId: CardInstanceId): boolean {
    return (
      remainingReplacementLongtailKindForCard(state, cardId) ===
      "basic_credit_diversion_to_recurring_credits"
    );
  }

  function isCorpTraceCounterPoolSource(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    return (
      remainingReplacementLongtailKindForCard(state, cardId) ===
      "trace_bit_counter_pool_asset"
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

  function corpTraceCounterPoolSourceIds(state: GameState): CardInstanceId[] {
    return corpInstalledCardIds(state)
      .filter((cardId) => {
        const instance = state.cardInstances[cardId];
        return (
          instance?.rezzed === true &&
          isCorpTraceCounterPoolSource(state, cardId)
        );
      })
      .sort();
  }

  function corpTraceCounterPoolCounterType(
    state: GameState,
    cardId: CardInstanceId,
  ): "bit" | "power" {
    return remainingReplacementLongtailImplementationForCard(state, cardId)
      ?.kind === "trace_bit_counter_pool_asset"
      ? "bit"
      : "power";
  }

  function corpTraceCounterPoolTotal(state: GameState): number {
    return corpTraceCounterPoolSourceIds(state).reduce(
      (sum, cardId) =>
        sum + cardCounter(state, cardId, corpTraceCounterPoolCounterType(state, cardId)),
      0,
    );
  }

  function spendCorpTraceCounterPoolCounters(
    state: GameState,
    amount: number,
  ): number {
    let remaining = Math.max(0, Math.floor(amount));
    let spent = 0;
    for (const cardId of corpTraceCounterPoolSourceIds(state)) {
      if (remaining <= 0) break;
      const counterType = corpTraceCounterPoolCounterType(state, cardId);
      const available = cardCounter(state, cardId, counterType);
      const cardSpent = Math.min(available, remaining);
      if (cardSpent <= 0) continue;
      spendCardCounter(state, cardId, counterType, cardSpent);
      remaining -= cardSpent;
      spent += cardSpent;
    }
    return spent;
  }

  function addCorpTraceCounterPoolCounters(state: GameState): number {
    let added = 0;
    for (const cardId of corpTraceCounterPoolSourceIds(state)) {
      addCardCounter(state, cardId, corpTraceCounterPoolCounterType(state, cardId), 1);
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
        definitionFor(state, cardId).id === HQ_INTERFACE_PROGRAM_SOURCE &&
        mustInstance(state.cardInstances, cardId).rezzed
      )
        return 1;
      return 0;
    });
    return Math.max(0, ...reductions);
  }

  return {
    runnerTraceCounterEffectDefinitions,
    runnerCounterDisplayName,
    traceCounterEffectDefinitionFor,
    runnerUtilityLongtailKindForDefinition,
    runnerUtilityLongtailKindForCard,
    runnerUtilityLongtailImplementationForCard,
    uniqueDirectLongtailImplementationForDefinition,
    uniqueDirectLongtailKindForDefinition,
    uniqueDirectLongtailImplementationForCard,
    uniqueDirectLongtailKindForCard,
    remainingReplacementLongtailImplementationForDefinition,
    remainingReplacementLongtailKindForDefinition,
    remainingReplacementLongtailImplementationForCard,
    remainingReplacementLongtailKindForCard,
    isObligationDebtDefinition,
    isDrawTaxSourceDefinition,
    isCorpInstalledEconomyCreditSource,
    isCorpTraceCounterPoolSource,
    applyRunnerTraceCounterRunStartEffects,
    corpTraceCounterPoolSourceIds,
    corpTraceCounterPoolCounterType,
    corpTraceCounterPoolTotal,
    spendCorpTraceCounterPoolCounters,
    addCorpTraceCounterPoolCounters,
    rabbitTraceLimitReductionForIceTrace,
  };
}
