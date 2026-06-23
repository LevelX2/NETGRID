// @ts-nocheck
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
  abilityUsageSourceUsed,
  clearAbilityUsageSourceIds,
  markAbilityUsageSourceUsed,
} from "../../ability-engine/card-implementation-ability-limits";
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
  startSmithsPawnshopChoice,
  startSecretSpendGuessThenTargetedBypassRunHideChoice,
  startSynchronizedAttackOnHqRetainChoice,
  type HiddenZoneNonSearchChoiceHandlerHost,
} from "../hidden-zone/nonsearch-choice-handlers";
import {
  handleCorpZoneChoice,
  resolveHqArchivesShuffleDraw,
  resolveReschedulerHqShuffleDraw,
  startScoredAgendaHqShuffleCreditsChoice,
  startCorporateNegotiatingCenterChoice,
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
  CASCADE_ID,
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
import type { RuntimeDeps } from "./runtime-shared";

export function createTurnRuntimeResolvers(deps: RuntimeDeps) {
  const {
    DEFAULT_CONTROLLERS,
    INITIAL_HAND_SIZE,
    PROTEUS_ARMAGEDDON_ID,
    PROTEUS_SCALDAN_ID,
    PROTEUS_TAXMAN_ID,
    PROTEUS_VIRAL_PIPELINE_ID,
    RUNNER_EVENT_RESOLVERS,
    TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS,
    abilityMetadata,
    accessEffectHandlerHost,
    accessFlow,
    accessFlowHost,
    activeObligationCount,
    activatedCardImplementationExecutionHost,
    activeCrashEverettSourceId,
    addActiveObligation,
    addCounterToAllInstalledRunnerIcebreakers,
    addCurrentRunAccessCount,
    addHackerTrackerTraceCounters,
    addVirusCounterWithCounterPrevention,
    addVisibleCardCounter,
    advanceableInstalledCardTargets,
    advancementDistributionOptions,
    affordableRezzedInstalledIceIdsForRunner,
    agendaPoints,
    agendaPointsForScoredCard,
    appendRegionReplacementTrashEffect,
    applyActionHostComposition,
    applyRunStartRandomStrengthBonus,
    applyEffectCommands,
    applyRunnerDrawSummaryPayload,
    applyRunnerTraceCounterRunStartEffects,
    applyAdvancementCounterPlacement,
    archivesAccessRequiresDecisionOrEffect,
    assertBreakSubroutineCostQuoteValid,
    assertCorpIceInstallCostValid,
    assertCurrentSubroutineMatchesLegalAction,
    assertNonNegativeAmount,
    assertPositiveIntegerAmount,
    availableRunnerProgramInstallCredits,
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
    cardHasSubtype,
    cardImplementationAgendaPointInstallCost,
    cardImplementationEffectAdapters,
    cardImplementationRunnerEventResolver,
    cardImplementationRuntimeDeps,
    cardInstallCapabilitiesForDefinition,
    choiceAction,
    chooseCorpAgendasForPointCost,
    drawTaxSourceIds,
    cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay,
    clearEdgerunnerTempsInstallFlags,
    clearValuPakProgramInstallFlags,
    clickCostForAction,
    closeRunnerCostPenaltySupportWindowForPayment,
    cockroachCounterTotal,
    cockroachRandomHqDiscardActive,
    virusCounterPurgePreserveTargets,
    consumeEdgerunnerTempsInstallAction,
    consumeValuPakProgramInstallAction,
    continueRun,
    continueRandomDiceLoop,
    corpAgendaCounterOperationTarget,
    corpAgendaPointTotal,
    corpIceInstallAdditionalCost,
    corpIceInstallBaseCost,
    corpIceInstallTotalCost,
    corpInstallRezSequenceHandlerHost,
    corpOperationResolutionHost,
    corpRegionUpgradeIdsInServer,
    corpRootAgendaOrNodeCapacityInServer,
    corpRunnerActionPaidWindowActions,
    corpScoredAgendaForfeitTargets,
    corpScoredBlackOpsAgendaLastTurn,
    corpSpecialDamageAbilityHost,
    corpTraceDamageAbilityHost,
    corpTracePaymentDeps,
    corpUtilityImplementationForCard,
    corpZoneChoiceHandlerHost,
    counterLifecycleRuntimeDepsHost,
    counterUtilityTriggerExecutionHost,
    creditCostForAction,
    creditEconomyExecutionHost,
    creditTextForPrompt,
    daemonHostedMemoryUsed,
    daemonHostingCapacity,
    damageCoreHost,
    diePromptText,
    discardChoice,
    discardRandomCorpHqCards,
    drawRunnerCard,
    drawRunnerCards,
    dupreStrengthCounterBonus,
    edgerunnerTempsInstallActionsRemaining,
    effectiveAgendaDifficultyDeps,
    effectiveSubtypesForCard,
    emptyRunnerDrawSummary,
    encounterEntryHostForState,
    encounterPrintedEffectHostForState,
    encounterPrintedNonTraceHostForState,
    encounterResolutionHostForState,
    encounterSpecialWindowHostForState,
    encounterTemporaryTraceCreditsAvailable,
    executeEffectCommands,
    expireScoredAgendaInstallRezCreditAbilities,
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
    fortPassWindowHostForState,
    fortRunSideFamiliesHostForState,
    gameCardImplementationRuntimeDepsHost,
    hackerTrackerCardIds,
    hackerTrackerCounterTotal,
    hackerTrackerCounterType,
    handForSide,
    hasCardImplementationMemoryUnitModifier,
    hasCorpUtilityKind,
    hasHiddenResourceAccessStartActions,
    hasInstallCapabilityKindForDefinition,
    hasInstalledMicrotechTrodeSet,
    hasInstalledUniqueCardDefinition,
    hiddenReplacementLongtailForDefinition,
    hiddenZoneArrangeChoiceHandlerHost,
    hiddenZoneNonSearchChoiceHandlerHost,
    hiddenZoneRuntimeDepsHost,
    hiddenZoneSearchActivationHandlerHost,
    hiddenZoneSearchActivationTargetHost,
    hiddenZoneSearchChoiceHandlerHost,
    hiddenZoneSearchHandlerHostBase,
    hostedProgramStrengthModifier,
    multiExposeInstalledCorpCardOptionLabel,
    multiExposeInstalledCorpCardTargets,
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
    installedVirusCounterPurgePreserveSourceIds,
    installedCorpCardServerContext,
    installedRunnerConnectionIds,
    installedRunnerIcebreakerIds,
    installedRunnerProgramTrashOptionsForInstall,
    installedRunnerVirusSourceIds,
    installedVirusCounterTotalForDefinition,
    isObligationDebtDefinition,
    isDrawTaxSourceDefinition,
    isCorpInstallableCardType,
    isHackerTrackerCentralCard,
    isInstalledCorpCardAdvanceable,
    isCorpInstalledEconomyCreditSource,
    isRegionUpgrade,
    isUniqueCard,
    isV097OrLater,
    isV099OrLater,
    isVersionAtLeast,
    isVisibleVirusCounterCardForRunner,
    recurringTraceCreditPoolSourceIds,
    recurringTraceCreditPoolTotal,
    leavePlayCleanupImplementationsForCard,
    legalActionHostComposition,
    mainActionHostComposition,
    mergeRunnerDrawSummary,
    microtechBackupDriveIds,
    microtechTrodeSetBreakAdditionalCost,
    movableAdvancementSourceIds,
    moveAdvancementOptions,
    mustInstallInsideSubsidiaryDataFort,
    runStartTaxForCorpRootAssets,
    normalizeSubtypeLabel,
    openPostMeatDamageReactionWindow,
    openRunnerCostPenaltySupportWindow,
    outermostIceExposures,
    outermostIceIndex,
    parseAdvancementDistributionValue,
    parseVirusCounterPurgePreserveOption,
    parseRandomDiceSplitChoiceSource,
    parseRandomDiceSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
    passCurrentEncounteredIce,
    pendingChoiceResolutionHost,
    permanentIcebreakerStrengthCounterBonus,
    pickRunnerAgendaForAgendaPointCost,
    playCardExecutionHost,
    randomDiceSplitOptions,
    postMeatDamageHiddenResourceCandidates,
    hardwareTrashByCounterEligibleHardwareIds,
    hardwareTrashByCounterLegalActions,
    hardwareTrashByCounterTrashCountFromChoiceSource,
    hardwareTrashByCounterTrashCountFromPayload,
    poxCountersForServer,
    poxInstallTax,
    preventOneVirusCounterWithCounterPrevention,
    printedCostCardImplementationMakeRunEffect,
    privateLookCardIds,
    publicIcePositionLabelForCard,
    publicIceSelectionLabelForCard,
    pumpAbilityForLegalAction,
    pumpAmountForLegalAction,
    pumpDurationForLegalAction,
    pushCorpTraceDamageOrCardImplementationActions,
    rabbitTraceLimitReductionForIceTrace,
    randomCorpHqDiscard,
    recordBartmossEncounterUsage,
    recordSnowballBreakUsage,
    refreshRecurringCredits,
    relativeDamageSubroutineForCurrentEncounter,
    relativeIceStrengthBonusFor,
    relativeTraceSubroutinesForCurrentEncounter,
    remainingReplacementLongtailImplementationForCard,
    remainingReplacementLongtailImplementationForDefinition,
    remainingReplacementLongtailKindForCard,
    remainingReplacementLongtailKindForDefinition,
    removeActiveObligation,
    requireRunnerTagged,
    requiresDataFortInstallTarget,
    resolveAgendaCounterOperation,
    resolveDerezRezzedBlackIceChoice,
    resolveBlinkBreakSubroutineAction,
    resolveCardImplementationAccessPaymentChoice,
    resolveCardImplementationAdvancementDistributionChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveChimeraDaemonTrashChoice,
    resolveVirusCounterPurgePreserveChoice,
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveCorpInstalledEconomyAction,
    resolveCrashEverettDrawChoice,
    resolveDealWithMilitech,
    resolveDiscardChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveIncubatorTransformChoice,
    resolveCorpInstalledEconomyCreditChoice,
    resolveManagementShakeUpOperation,
    resolveMitWestTier,
    resolveMultiBreakSubroutinesAction,
    resolvePaidSourceReturnToGripChoice,
    resolveP358HiddenReplacementChoice,
    resolveRandomDiceLoopEvent,
    resolvePostMeatDamageHiddenResourceChoice,
    resolvePostOnPlayGenericFollowups,
    resolveHardwareTrashByCounterChoice,
    resolveHardwareTrashByCounterOperation,
    resolveRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveRunnerLastTurnInstalledResourceTargetId,
    resolveRunnerPrivateLookChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
    resolveRunnerTargetedEventImplementation,
    resolveTrashUnrezzedIceChoice,
    resolveSetupMulliganChoice,
    resolveAdvancementPlacementChoice,
    resolveAdvancementPlacementOperation,
    resolveTraceHardwareWreckerSuccess,
    resolveTraceTrashRunnerResourceSuccess,
    resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent,
    resolveScoredAgendaCorpRdTopReveal,
    resolveV1911RunnerHiddenZoneAbility,
    resolveRandomDiceSplitChoice,
    restorePurgePreservedVirusCounters,
    returnRunnerInstalledCardToGrip,
    returnRunnerInstalledProgramsToGripForAccess,
    revealCorpRdTop,
    revealRunnerStackTop,
    rezActionExecutionHost,
    rezCardHost,
    rezzedBlackIceIds,
    rezzedCorpRootCardIds,
    rezzedIceOutsideThisIceCount,
    rezzedInstalledIceIds,
    rezzedCorpInstalledEconomyCreditSourceIds,
    rootInstallRezzesOnInstall,
    runAccessLegalActionHostComposition,
    runAccessTransitionHost,
    runBreakSubroutineAdditionalCost,
    runCardImplementationActionHost,
    runEndCleanupHost,
    runFlow,
    runFortTriggerExecutionHost,
    runMovementHostForState,
    runRemainderStrengthBonusForBreaker,
    runRezWindowHostForState,
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
    runnerEventLongtailForDefinition,
    runnerEventLongtailKindForDefinition,
    runnerHasInstalledCardDefinition,
    runnerHasInstalledDefinition,
    runnerInstallableProgramIdsForValuPak,
    runnerInstalledCardCountByDefinition,
    runnerInstalledHardwareTrashTarget,
    runnerInstalledResourceLastTurn,
    runnerLastTurnInstalledResourceIds,
    runnerProgramInstallMemoryReachableAfterTrash,
    runnerProgramInstallRecurringCreditSourceIds,
    runnerProgramUsesMemory,
    runnerRecurringCredits,
    runnerRunAttemptsLastTurn,
    runnerRunAttemptsThisGame,
    runnerSpecialTriggerExecutionHost,
    runnerStoleAgendaLastTurn,
    runnerStoleAgendaSubtypeThisTurn,
    runnerStolenAgendaAdvancementCountersLastTurn,
    runnerTagRemovalRecurringCreditSourceIds,
    runnerTagRemovalRecurringCredits,
    runnerTraceCounterEffectDefinitions,
    runnerTracePaymentDeps,
    runnerTrashedNodeLastTurn,
    runnerUtilityLongtailImplementationForCard,
    runnerUtilityLongtailKindForCard,
    runnerUtilityLongtailKindForDefinition,
    sanitizeId,
    scoredAgendaAbilityHost,
    scoredAgendaFlowHost,
    scoredAgendaImplementationForDefinition,
    scoredAgendaImplementationForDefinitionId,
    scoredAgendaKindForDefinition,
    selectedChoiceCardIds,
    selectedChoiceCardIdsForChoice,
    serverDifficultyIncreaseFromRunCounters,
    serverDifficultyReductionFromUpgrades,
    setupMulliganChoice,
    shouldOfferRunnerProgramTrashBeforeInstall,
    shouldOpenCorpInstalledEconomyCreditChoice,
    shuffleCorpCardIntoRd,
    shuffleGripTrashAndStackThenDrawForCardImplementation,
    shuffleRunnerStack,
    sourcePartsForP334Choice,
    specialZoneHarnessActions,
    spendCorpAgendaPointCost,
    spendEncounterTemporaryTraceCredits,
    spendHackerTrackerCounters,
    spendRecurringTraceCreditPool,
    spendRunnerAccessTrashCredits,
    spendRunnerInstallCredits,
    spendRunnerTagRemovalCredits,
    spendVisibleCardCounter,
    spyCountersForServer,
    stableSubtypeList,
    startDerezRezzedBlackIceChoice,
    startCardImplementationAdvancementDistributionChoice,
    startCardImplementationMoveAdvancementChoice,
    startVirusCounterPurgePreserveChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startCrashEverettDrawChoice,
    startPostAccessInstalledProgramChoice,
    startExposeInstalledCorpCardsChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startMultiExposeInstalledCorpCardsChoice,
    startCorpInstalledEconomyCreditChoice,
    startPaidSourceReturnToGripChoice,
    startHardwareTrashByCounterChoice,
    startRun,
    startRunActionExecutionHost,
    startRunnerHostingChoice,
    startRunnerPrivateLookChoice,
    startRunnerProgramTrashBeforeInstallChoice,
    startTrashUnrezzedIceChoice,
    startSelfModifyingCodeFreeMuChoice,
    startAdvancementPlacementChoice,
    startRandomDiceSplitChoice,
    subroutinesForCurrentEncounter,
    successfulRunInterventionHost,
    swapCorpHqAndRdTop,
    advancementPlacementLegalActions,
    advancementPlacementOptions,
    takeSetupMulligan,
    totalCounters,
    traceCounterEffectDefinitionFor,
    traceOrchestrationHost,
    traceRuntimeDepsHost,
    trashCorpInstalledCardToArchives,
    trashCorpInstalledCardsInScoredSourceServer,
    trashOlderRegionUpgradesInServer,
    trashHardwareByCounter,
    trashRunnerInstalledCardToHeap,
    trashRunnerInstalledProgram,
    triggerAbilityExecutionHost,
    turnBasicExecutionHost,
    uniqueDirectLongtailImplementationForCard,
    uniqueDirectLongtailImplementationForDefinition,
    uniqueDirectLongtailKindForCard,
    uniqueDirectLongtailKindForDefinition,
    unrezzedInstalledIceIds,
    v1915InstalledRevealHelperIds,
    validateAdvancementDistribution,
    validateCorpInstalledEconomyAction,
    validateDeckDefinition,
    valuPakProgramInstallActionsRemaining,
    valuPakTemporaryProgramInstallCredits,
    variableRezForDefinition,
    variableTraceSubroutineForCurrentEncounter,
    virusCounterImplementationForCard,
    virusCounterImplementationForDefinition,
    visibleVirusCounterTargetIds,
    withoutVariableIceState
  } = deps;

function resolveEndTurnTagIfRunnerReceivedTag(
  state: GameState,
  legalAction: LegalAction,
): void {
  if (state.runnerTurnFlags?.runnerReceivedTagThisTurn !== true) return;
  const sourceIds = rezzedCorpRootCardIds(state)
    .filter((cardId: CardInstanceId) =>
      hasCorpUtilityKind(state, cardId, "end_turn_tag_if_runner_received_tag"),
    )
    .sort();
  if (sourceIds.length === 0) return;
  const tagsBefore = state.runner.tags;
  for (const _sourceId of sourceIds) {
    addRunnerTagsWithPrevention(state, legalAction, 1, "end_turn_tag_if_runner_received_tag");
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1951CorpUtilityAbility: "end_turn_tag_if_runner_received_tag",
    endTurnTagIfRunnerReceivedTagAdded: Math.max(0, state.runner.tags - tagsBefore),
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

function resolveDelayedEndTurnDamageEffects(state: GameState, legalAction: LegalAction): void {
  const flags = ensureRunnerTurnFlags(state);
  const dueEffects = (flags.delayedEndTurnEffects ?? []).filter(
    (effect) => effect.kind === "damage",
  );
  if (dueEffects.length === 0) return;
  const totalDamage = dueEffects.reduce((sum, effect) => sum + effect.amount, 0);
  const damageType = dueEffects[0]!.damageType;
  if (!dueEffects.every((effect) => effect.damageType === damageType))
    throw new Error("Gemischte verzögerte Schadensarten sind nicht implementiert.");
  if (!dueEffects.every((effect) => effect.preventable === false))
    throw new Error("Verhinderbarer verzögerter Schaden ist nicht implementiert.");
  const damageSummary = doDamage(state, {
    damageId: `runner.end.delayed_damage.${state.stateVersion}`,
    damageType,
    amount: totalDamage,
    source: "runner_end:delayed_damage",
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerUtilityAbility: "delayed_end_turn_damage",
    damageCannotBePrevented: true,
    damageResolved: true,
    damageType: damageSummary.damageType,
    damageAmount: damageSummary.amount,
    cardsTrashed: damageSummary.cardsTrashed,
    flatline: damageSummary.flatline,
    sourceDefinitionId: dueEffects[0]!.sourceDefinitionId,
    sourceCount: dueEffects.length,
    sourceCardInstanceIds: dueEffects.map((effect) => effect.sourceCardInstanceId).sort(),
    ...(damageSummary.coreDamageAfter !== undefined
      ? { coreDamageAfter: damageSummary.coreDamageAfter }
      : {}),
  };
  flags.delayedEndTurnEffects = (flags.delayedEndTurnEffects ?? []).filter(
    (effect) => effect.kind !== "damage",
  );
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
    resolveDelayedEndTurnDamageEffects(state, legalAction);
    resolveEndTurnTagIfRunnerReceivedTag(state, legalAction);
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
    resolveEndTurnTagIfRunnerReceivedTag(state, legalAction);
    const corpFlags = ensureCorpTurnFlags(state);
    corpFlags.scoredBlackOpsAgendaLastTurn =
      corpFlags.scoredBlackOpsAgendaThisTurn;
    corpFlags.scoredBlackOpsAgendaThisTurn = false;
    resolveCorpObligationEndOfTurn(state, legalAction);
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

function resolveCorpObligationEndOfTurn(
  state: GameState,
  legalAction: LegalAction,
): void {
  const obligations = activeObligationCount(state);
  if (obligations <= 0) return;
  const creditsBefore = state.corp.credits;
  if (creditsBefore < obligations) {
    state.winner = "runner";
    state.gameEndReason = "obligation_debt_unpaid";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    delete state.pendingChoice;
    delete state.run;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      obligationDebtAbility: "end_of_turn_payment",
      activeObligationDebtCount: obligations,
      obligationDebtPaymentDue: obligations,
      obligationDebtPaymentPaid: 0,
      obligationDebtPaymentFailed: true,
      corpCreditsBefore: creditsBefore,
      corpCreditsAfter: state.corp.credits,
    };
    return;
  }
  state.corp.credits -= obligations;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    obligationDebtAbility: "end_of_turn_payment",
    activeObligationDebtCount: obligations,
    obligationDebtPaymentDue: obligations,
    obligationDebtPaymentPaid: obligations,
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

function ensureActionEconomy(state: GameState): NonNullable<GameState["actionEconomy"]> {
  return (state.actionEconomy ??= {});
}

type ActionEconomyGrant = NonNullable<
  NonNullable<GameState["actionEconomy"]>["grants"]
>[number];

function compactActionEconomy(state: GameState): void {
  const economy = state.actionEconomy;
  if (!economy) return;
  if (economy.grants)
    economy.grants = economy.grants.filter(
      (grant) =>
        grant.remaining > 0 && isTurnBoundExtraActionGrantCurrent(state, grant),
    );
  if (economy.futureGrants)
    economy.futureGrants = economy.futureGrants.filter(
      (grant) => grant.remainingTurns > 0,
    );
  if (
    economy.corpCreditForfeitDebt &&
    economy.corpCreditForfeitDebt.remaining <= 0
  )
    delete economy.corpCreditForfeitDebt;
  if (
    !economy.pendingOffer &&
    (!economy.grants || economy.grants.length === 0) &&
    (!economy.futureGrants || economy.futureGrants.length === 0) &&
    !economy.corpCreditForfeitDebt
  )
    delete state.actionEconomy;
}

function currentTurnSerial(state: GameState): number {
  return Math.max(0, Math.floor(state.turnSerial ?? 0));
}

function expireTurnBoundExtraActionGrants(state: GameState): void {
  const economy = state.actionEconomy;
  if (!economy?.grants) return;
  economy.grants = economy.grants.filter(
    (grant) =>
      grant.remaining > 0 && isTurnBoundExtraActionGrantCurrent(state, grant),
  );
  compactActionEconomy(state);
}

function isTurnBoundExtraActionGrantCurrent(
  state: GameState,
  grant: ActionEconomyGrant,
): boolean {
  if (grant.side !== state.activeSide) return false;
  if (grant.side === "corp" && state.phase !== "corp_action_phase") return false;
  if (grant.side === "runner" && state.phase !== "runner_action_phase")
    return false;
  if (grant.createdDuringTurnSerial === undefined) return true;
  return grant.createdDuringTurnSerial === currentTurnSerial(state);
}

function restrictedActionFamilyForRandomActionRoll(
  dieRoll: number,
): RestrictedActionFamily {
  if (dieRoll === 1) return "corp_install";
  if (dieRoll === 2 || dieRoll === 3) return "gain_credit";
  return "draw_card";
}

function addTurnBoundExtraActionGrant(
  state: GameState,
  input: {
    side: Side;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    restriction: RestrictedActionFamily;
    forced?: boolean;
    targetServerId?: Exclude<ServerId, "new_remote">;
    targetCardInstanceId?: CardInstanceId;
    revealToCorpOnly?: boolean;
    dieRoll?: number;
    randomPurpose?: string;
  },
): void {
  const economy = ensureActionEconomy(state);
  economy.grants = [
    ...(economy.grants ?? []),
    {
      side: input.side,
      sourceCardInstanceId: input.sourceCardInstanceId,
      sourceDefinitionId: input.sourceDefinitionId,
      restriction: input.restriction,
      optional: !input.forced,
      remaining: 1,
      createdAtStateVersion: state.stateVersion,
      createdDuringTurnSerial: currentTurnSerial(state),
      ...(input.forced ? { forced: true } : {}),
      ...(input.targetServerId ? { targetServerId: input.targetServerId } : {}),
      ...(input.targetCardInstanceId
        ? { targetCardInstanceId: input.targetCardInstanceId }
        : {}),
      ...(input.revealToCorpOnly ? { revealToCorpOnly: true } : {}),
      ...(input.dieRoll ? { dieRoll: input.dieRoll } : {}),
      ...(input.randomPurpose ? { randomPurpose: input.randomPurpose } : {}),
    },
  ];
  if (input.side === "corp") state.corp.clicks += 1;
  else state.runner.clicks += 1;
}

function consumeRestrictedExtraActionForAction(
  state: GameState,
  legalAction: LegalAction,
): void {
  const grants = state.actionEconomy?.grants;
  if (!grants || grants.length === 0) return;
  const index = grants.findIndex(
    (grant) =>
      grant.side === legalAction.side &&
      grant.remaining > 0 &&
      actionMatchesRestrictedGrant(state, legalAction, grant),
  );
  if (index < 0) return;
  const grant = grants[index]!;
  grant.remaining = Math.max(0, grant.remaining - 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    restrictedExtraActionConsumed: true,
    restrictedExtraActionSourceDefinitionId: grant.sourceDefinitionId,
    restrictedExtraActionFamily: grant.restriction,
  };
  compactActionEconomy(state);
}

function actionMatchesRestrictedGrant(
  state: GameState,
  legalAction: LegalAction,
  grant: ActionEconomyGrant,
): boolean {
  if (grant.restriction === "corp_install")
    return legalAction.type === "install_card";
  if (grant.restriction === "gain_credit")
    return legalAction.type === "gain_credit";
  if (grant.restriction === "draw_card") return legalAction.type === "draw_card";
  if (grant.restriction === "start_run") {
    if (legalAction.type !== "start_run") return false;
    return !grant.targetServerId || legalAction.payload?.serverId === grant.targetServerId;
  }
  if (grant.restriction === "play_or_install_card") {
    const target = grant.targetCardInstanceId;
    if (!target || legalAction.payload?.cardId !== target) return false;
    const definition = definitionFor(state, target);
    return definition.type === "event"
      ? legalAction.type === "play_event"
      : legalAction.type === "install_card";
  }
  return false;
}

function activeRestrictedGrantsForSide(
  state: GameState,
  side: Side,
): ActionEconomyGrant[] {
  return (state.actionEconomy?.grants ?? []).filter(
    (grant) =>
      grant.side === side &&
      grant.remaining > 0 &&
      isTurnBoundExtraActionGrantCurrent(state, grant),
  );
}

function forcedRestrictedGrantsForSide(
  state: GameState,
  side: Side,
): ActionEconomyGrant[] {
  return activeRestrictedGrantsForSide(state, side).filter(
    (grant) => grant.forced === true,
  );
}

function filterActionsForRestrictedExtraActions(
  state: GameState,
  side: Side,
  actions: LegalAction[],
): LegalAction[] {
  const grants = activeRestrictedGrantsForSide(state, side);
  if (grants.length === 0) return actions;
  const clicks = side === "corp" ? state.corp.clicks : state.runner.clicks;
  const forced = forcedRestrictedGrantsForSide(state, side);
  const relevant = forced.length > 0 ? forced : clicks <= grants.length ? grants : [];
  if (relevant.length === 0) return actions;
  const matching = actions.filter((candidate) =>
    relevant.some((grant) => actionMatchesRestrictedGrant(state, candidate, grant)),
  );
  if (forced.length > 0) {
    if (matching.length > 0) return matching;
    return forced.map((grant) =>
      action(
        state,
        side,
        "trigger_ability",
        "Erzwungene Aktion ist nicht möglich",
        "card",
        [],
        {
          actionEconomyAbility: "forced_action_not_possible",
          cardId: grant.sourceCardInstanceId,
          sourceDefinitionId: grant.sourceDefinitionId,
          restrictedActionFamily: grant.restriction,
          ...(grant.revealToCorpOnly !== true && grant.targetCardInstanceId
            ? { targetCardInstanceId: grant.targetCardInstanceId }
            : {}),
          ...(grant.targetServerId ? { targetServerId: grant.targetServerId } : {}),
          ...(grant.dieRoll !== undefined ? { dieRoll: grant.dieRoll } : {}),
          createdAtStateVersion: grant.createdAtStateVersion,
          ...(grant.createdDuringTurnSerial !== undefined
            ? { createdDuringTurnSerial: grant.createdDuringTurnSerial }
            : {}),
          hiddenZoneBarrier: grant.revealToCorpOnly === true,
        },
      ),
    );
  }
  return [
    ...matching,
    ...actions.filter((candidate) => candidate.type === "end_turn"),
  ];
}

function addFutureExtraActionGrant(
  state: GameState,
  input: {
    side: Side;
    sourceCardInstanceId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    remainingTurns: number;
    amountPerTurn: number;
    restriction?: RestrictedActionFamily;
  },
): void {
  const economy = ensureActionEconomy(state);
  economy.futureGrants = [
    ...(economy.futureGrants ?? []),
    {
      side: input.side,
      sourceCardInstanceId: input.sourceCardInstanceId,
      sourceDefinitionId: input.sourceDefinitionId,
      remainingTurns: input.remainingTurns,
      amountPerTurn: input.amountPerTurn,
      ...(input.restriction ? { restriction: input.restriction } : {}),
    },
  ];
}

function applyFutureExtraActionGrantsAtTurnStart(
  state: GameState,
  side: Side,
  effects?: AutomaticEffectCollector,
): void {
  const future = state.actionEconomy?.futureGrants ?? [];
  for (const grant of future) {
    if (grant.side !== side || grant.remainingTurns <= 0) continue;
    const amount = Math.max(0, Math.floor(grant.amountPerTurn));
    if (amount <= 0) continue;
    if (side === "corp") state.corp.clicks += amount;
    else state.runner.clicks += amount;
    grant.remainingTurns -= 1;
    for (let i = 0; i < amount; i += 1) {
      if (grant.restriction) {
        addTurnBoundExtraActionGrant(state, {
          side,
          sourceCardInstanceId: grant.sourceCardInstanceId,
          sourceDefinitionId: grant.sourceDefinitionId,
          restriction: grant.restriction,
        });
        if (side === "corp") state.corp.clicks -= 1;
        else state.runner.clicks -= 1;
      }
    }
    effects?.push({
      effectId: `${side}.start.future_extra_action.${grant.sourceCardInstanceId}.${grant.remainingTurns}`,
      kind: "gain_actions",
      visibility: "public",
      side,
      amount,
      reason: "start_of_turn",
      sourceDefinitionId: grant.sourceDefinitionId,
      sourceTitle: publicCardTitle(grant.sourceDefinitionId),
    });
  }
  compactActionEconomy(state);
}

function applyScoredAgendaActionEconomyAtCorpStart(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  for (const cardId of state.corp.scoreArea.slice().sort()) {
    const definition = definitionFor(state, cardId);
    const implementation = scoredAgendaImplementationForDefinition(definition);
    if (implementation?.kind !== "overadvance_start_of_corp_turn_actions")
      continue;
    const amount = cardCounter(state, cardId, "mark");
    if (amount <= 0) continue;
    state.corp.clicks += amount;
    effects?.push({
      effectId: `corp.start.scored_agenda.action.${cardId}`,
      kind: "gain_actions",
      visibility: "public",
      side: "corp",
      amount,
      reason: "start_of_turn",
      sourceDefinitionId: definition.id,
      sourceTitle: publicCardTitle(definition.id),
    });
  }
}

function applyScoredAgendaCreditEconomyAtCorpStart(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  for (const cardId of state.corp.scoreArea.slice().sort()) {
    const definition = definitionFor(state, cardId);
    const implementation = scoredAgendaImplementationForDefinition(definition);
    if (implementation?.kind !== "overadvance_start_of_corp_turn_credits")
      continue;
    const amount = cardCounter(state, cardId, "mark");
    if (amount <= 0) continue;
    state.corp.credits += amount;
    effects?.push(
      automaticGainCreditsEffect(
        `corp.start.scored_agenda.credit.${cardId}`,
        "corp",
        amount,
        definition.id,
      ),
    );
  }
}

function acceptExtraActionOffer(state: GameState, legalAction: LegalAction): void {
  const offer = state.actionEconomy?.pendingOffer;
  if (!offer) throw new Error("Es gibt kein Extra-Action-Angebot.");
  if (offer.side !== legalAction.side)
    throw new Error("Dieses Extra-Action-Angebot gehört der anderen Seite.");
  const sourceId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (sourceId !== offer.sourceCardInstanceId)
    throw new Error("Die Extra-Action-Quelle passt nicht mehr.");
  delete state.actionEconomy!.pendingOffer;
  addTurnBoundExtraActionGrant(state, {
    side: offer.side,
    sourceCardInstanceId: offer.sourceCardInstanceId,
    sourceDefinitionId: offer.sourceDefinitionId,
    restriction: offer.restriction,
    ...(offer.dieRoll !== undefined ? { dieRoll: offer.dieRoll } : {}),
    ...(offer.randomPurpose !== undefined
      ? { randomPurpose: offer.randomPurpose }
      : {}),
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    extraActionAccepted: true,
    gainedActions: 1,
    restrictedActionFamily: offer.restriction,
    ...(offer.side === "corp"
      ? { corpClicksAfter: state.corp.clicks }
      : { runnerClicksAfter: state.runner.clicks }),
  };
}

function declineExtraActionOffer(state: GameState, legalAction: LegalAction): void {
  const offer = state.actionEconomy?.pendingOffer;
  if (!offer) throw new Error("Es gibt kein Extra-Action-Angebot.");
  if (offer.side !== legalAction.side)
    throw new Error("Dieses Extra-Action-Angebot gehört der anderen Seite.");
  delete state.actionEconomy!.pendingOffer;
  compactActionEconomy(state);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    extraActionAccepted: false,
    restrictedActionFamily: offer.restriction,
  };
}

function resolvePdcaCounterAction(state: GameState, legalAction: LegalAction): void {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf PDCA-Counter nutzen.");
  if (state.phase !== "corp_action_phase" || state.activeSide !== "corp")
    throw new Error("PDCA-Counter sind nur im Korp-Zug nutzbar.");
  const sourceId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  if (!state.corp.scoreArea.includes(sourceId))
    throw new Error("PDCA-Counter-Quelle ist nicht gescort.");
  const definition = definitionFor(state, sourceId);
  if (
    scoredAgendaImplementationForDefinition(definition)?.kind !==
    "corp_damage_replacement_pdca_action_counter"
  )
    throw new Error("Die PDCA-Fähigkeit passt nicht zur Quelle.");
  const flags = ensureCorpTurnFlags(state);
  if (abilityUsageSourceUsed(flags.pdcaUsedSourceIdsThisTurn, sourceId))
    throw new Error("Diese PDCA-Fähigkeit wurde diesen Zug bereits genutzt.");
  if (cardCounter(state, sourceId, "pdca") <= 0)
    throw new Error("Es ist kein PDCA-Counter vorhanden.");
  spendCardCounter(state, sourceId, "pdca", 1);
  flags.pdcaUsedSourceIdsThisTurn = markAbilityUsageSourceUsed(
    flags.pdcaUsedSourceIdsThisTurn,
    sourceId,
  );
  state.corp.clicks += 1;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    gainedActions: 1,
    removedCounterAmount: 1,
    remainingCounters: cardCounter(state, sourceId, "pdca"),
    corpClicksAfter: state.corp.clicks,
  };
}

function resolveForcedActionNotPossible(
  state: GameState,
  legalAction: LegalAction,
): void {
  const sourceId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
  const restriction = String(legalAction.payload?.restrictedActionFamily ?? "");
  const targetCardId = legalAction.payload?.targetCardInstanceId
    ? (String(legalAction.payload.targetCardInstanceId) as CardInstanceId)
    : undefined;
  const grants = state.actionEconomy?.grants ?? [];
  const grant = grants.find(
    (candidate) =>
      candidate.side === legalAction.side &&
      candidate.forced === true &&
      candidate.remaining > 0 &&
      candidate.sourceCardInstanceId === sourceId &&
      candidate.restriction === restriction &&
      isTurnBoundExtraActionGrantCurrent(state, candidate) &&
      (targetCardId === undefined ||
        candidate.targetCardInstanceId === targetCardId),
  );
  if (!grant)
    throw new Error("Es gibt keine passende erzwungene Aktion zum Auflösen.");
  if (
    grant.restriction === "play_or_install_card" &&
    (!grant.targetCardInstanceId ||
      !state.runner.grip.includes(grant.targetCardInstanceId))
  )
    throw new Error("Die erzwungene Zielkarte liegt nicht mehr in der Grip.");
  grant.remaining = 0;
  compactActionEconomy(state);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    forcedActionResolvedAsNotPossible: true,
    restrictedActionFamily: grant.restriction,
    sourceDefinitionId: grant.sourceDefinitionId,
    targetCardKnownToRunnerOnly: grant.revealToCorpOnly === true,
  };
}

function startCorpTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  expireTurnBoundExtraActionGrants(state);
  state.turnSerial = currentTurnSerial(state) + 1;
  state.activeSide = "corp";
  state.phase = "corp_draw_phase";
  state.timingPoint = "corp_draw.mandatory_draw";
  state.corp.clicks = 3;
  state.runner.clicks = 0;
  clearValuPakProgramInstallFlags(state);
  clearActivityGatedFortRunMarkers(fortRunSideFamiliesHostForState(state));
  ensureRunnerTurnFlags(state).damagePreventionUsage = {};
  ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = false;
  ensureRunnerTurnFlags(state).corpRezzedIceThisTurn = 0;
  ensureCorpTurnFlags(state).counterPreventionUsedSourceIdsThisTurn =
    clearAbilityUsageSourceIds();
  ensureCorpTurnFlags(state).scoredAgendaStartDrawChoiceResolvedSourceIds = [];
  ensureCorpTurnFlags(state).pdcaUsedSourceIdsThisTurn =
    clearAbilityUsageSourceIds();
  applyFutureExtraActionGrantsAtTurnStart(state, "corp", effects);
  applyScoredAgendaCreditEconomyAtCorpStart(state, effects);
  applyScoredAgendaActionEconomyAtCorpStart(state, effects);
  applyInstalledIceCounterLifecycle(state);
  applyCorpStartOfTurnEffects(state, effects);
  openCorpStartTurnRestrictedActionOffers(state, effects);
}

function startRunnerTurn(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  expireTurnBoundExtraActionGrants(state);
  state.turnSerial = currentTurnSerial(state) + 1;
  returnCorpTemporaryInstallRezCredits(state, effects);
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = runnerActionsPerTurn(state);
  state.runner.clicks += (state.runnerTurnFlags?.persistentModifiers ?? []).reduce(
    (total, modifier) =>
      modifier.kind === "runner_extra_actions_per_turn"
        ? total + modifier.amount
        : total,
    0,
  );
  applyFutureExtraActionGrantsAtTurnStart(state, "runner", effects);
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
  flags.successfulRdRunThisTurn = false;
  flags.successfulRunThisTurn = false;
  delete flags.lastSuccessfulRunServerId;
  flags.blackOpsLiberatedOrTrashedDuringSuccessfulHqOrRdRunThisTurn = false;
  flags.trashedAdvertisementThisTurn = false;
  flags.trashedTransactionsThisTurn = false;
  flags.prearrangedDropPending = false;
  flags.promisesPromisesNextAgendaAccess = false;
  delete flags.promisesPromisesSourceDefinitionId;
  delete flags.promisesPromisesSourceTitle;
  flags.damagePreventionUsage = {};
  flags.abilityUsedSourceIdsByLimitKey = {};
  flags.startOfTurnFloatingCreditsApplied = false;
  flags.bonusRunPending = false;
  flags.valuPakProgramInstallActionsRemaining = 0;
  flags.valuPakTemporaryProgramInstallCredits = 0;
  flags.delayedInstallStartTurnResolvedSourceIds = [];
  flags.successfulRunExtraRunPending = false;
  flags.successfulRunExtraRunUsedThisTurn = false;
  flags.delayedEndTurnEffects = [];
  flags.corpRezzedIceThisTurn = 0;
  delete flags.lastRezzedBlackIceThisTurn;
  ensureCorpTurnFlags(state).counterPreventionUsedSourceIdsThisTurn =
    clearAbilityUsageSourceIds();
  delete flags.incubatorPendingTransforms;
  consumeRunnerFutureActionDebt(state);
  resolveDelayedAccessEffects(state, effects);
  refreshRecurringCredits(state, "runner", effects);
  untapRunnerCardsAtTurnStart(state);
  applyRunnerStartTurnActionEconomyEffects(state, effects);
  applyRunnerStartOfTurnEffects(state, effects);
}

function returnCorpTemporaryInstallRezCredits(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  const temporaryCredits = state.corpTemporaryInstallRezCredits;
  if (!temporaryCredits) return;
  const returned = Math.max(0, Math.floor(temporaryCredits.remaining ?? 0));
  if (returned > 0)
    state.corp.credits = Math.max(0, state.corp.credits - returned);
  effects?.push({
    effectId: `corp.end.${temporaryCredits.sourceCardInstanceId}.temporary_install_rez_credits`,
    kind: "lose_credits",
    visibility: "public",
    side: "corp",
    amount: returned,
    reason: "end_of_turn",
    sourceDefinitionId: temporaryCredits.sourceDefinitionId,
    sourceTitle: publicCardTitle(temporaryCredits.sourceDefinitionId),
  });
  delete state.corpTemporaryInstallRezCredits;
}

function applyInstalledIceCounterLifecycle(state: GameState): void {
  for (const server of state.corp.servers) {
    for (const iceId of server.ice.slice().sort()) {
      const instance = state.cardInstances[iceId];
      if (!instance || instance.controller !== "corp") continue;
      const kludge = cardCounter(state, iceId, "kludge");
      if (kludge > 0) {
        const remaining = kludge - 1;
        setCardCounter(state, iceId, "kludge", remaining);
        if (remaining <= 0) trashCorpInstalledCardToArchives(state, iceId);
      }
      const term = cardCounter(state, iceId, "term");
      if (term > 0) {
        if (state.corp.credits >= 2) {
          state.corp.credits -= 2;
          setCardCounter(state, iceId, "term", term - 1);
        } else {
          addCardCounter(state, iceId, "term", 1);
        }
      }
    }
  }
}

function untapRunnerCardsAtTurnStart(state: GameState): void {
  for (const cardId of runnerInstalledCardIds(state)) {
    const instance = state.cardInstances[cardId];
    if (!instance?.tapped) continue;
    state.cardInstances[cardId] = { ...instance, tapped: false };
  }
}

function resolveDelayedAccessEffects(state: GameState, effects?: AutomaticEffectCollector): void {
  const delayed = state.delayedAccessEffects ?? [];
  if (delayed.length === 0) return;
  const remaining: NonNullable<GameState["delayedAccessEffects"]> = [];
  for (const entry of delayed) {
    if (entry.kind !== "delayed_agenda_access_replacement" || entry.resolveAt !== "runner_start_turn") {
      remaining.push(entry);
      continue;
    }
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
        `runner.start.delayed_agenda_access.${entry.agendaId}`,
        definition.id,
        entry.sourceDefinitionId,
        agendaPointsForScoredCard(state, entry.agendaId),
      ),
    );
  }
  if (remaining.length > 0) state.delayedAccessEffects = remaining;
  else delete state.delayedAccessEffects;
}

function applyCorpStartOfTurnEffects(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  applyPurgeableRunnerVirusCorpStartEffects(state, effects);
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
    const recurringTracePool = corpUtilityImplementationForCard(state, cardId);
    if (
      recurringTracePool?.kind === "recurring_trace_credit_pool" &&
      recurringTracePool.counterType === "bit" &&
      recurringTracePool.spendWindow === "trace" &&
      recurringTracePool.refresh === "start_of_corp_turn_after_use" &&
      cardCounter(state, cardId, recurringTracePool.counterType) < recurringTracePool.amount
    ) {
      setCardCounter(state, cardId, recurringTracePool.counterType, recurringTracePool.amount);
      effects?.push(
        automaticCounterChangeEffect(
          `corp.start.recurring_trace_credit_pool.${cardId}`,
          "corp",
          definitionId,
          recurringTracePool.counterType,
          recurringTracePool.amount,
          recurringTracePool.amount,
        ),
      );
    }
    if (isFortTraceBitPoolSource(fortRunSideFamiliesHostForState(state), cardId)) {
      const capacity = fortTraceBitPoolCapacityForCard(
        fortRunSideFamiliesHostForState(state),
        cardId,
      );
      if (cardCounter(state, cardId, "bit") < capacity)
        setCardCounter(state, cardId, "bit", capacity);
    }
    if (isCorpInstalledEconomyCreditSource(state, cardId)) {
      if (cardCounter(state, cardId, "recurring_credit") > 0) {
        spendCardCounter(state, cardId, "recurring_credit", 1);
        credits(state, "corp", 1);
        const remainingCounters = cardCounter(state, cardId, "recurring_credit");
        effects?.push(
          automaticGainCreditsEffect(
            `corp.start.installed_economy_credit.${cardId}`,
            "corp",
            1,
            definitionId,
          ),
        );
        effects?.push({
          effectId: `corp.start.installed_economy_credit.counter.${cardId}`,
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
    startScoredAgendaStartDrawChoice(scoredAgendaFlowHost(state));
}

function applyPurgeableRunnerVirusCorpStartEffects(
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

function openCorpStartTurnRestrictedActionOffers(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  if (state.actionEconomy?.pendingOffer) return;
  for (const sourceId of state.corp.scoreArea.slice().sort()) {
    const definition = definitionFor(state, sourceId);
    if (
      scoredAgendaImplementationForDefinition(definition)?.kind !==
      "corp_start_turn_random_restricted_optional_action"
    )
      continue;
    const randomPurpose = `action_economy.${definition.id}.corp_start.${state.stateVersion}.${sourceId}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    const restriction = restrictedActionFamilyForRandomActionRoll(dieRoll);
    ensureActionEconomy(state).pendingOffer = {
      side: "corp",
      sourceCardInstanceId: sourceId,
      sourceDefinitionId: definition.id,
      restriction,
      optional: true,
      dieRoll,
      randomPurpose,
      createdAtStateVersion: state.stateVersion,
    };
    effects?.push({
      effectId: `corp.start.action_economy.offer.${sourceId}`,
      kind: "counter_change",
      visibility: "public",
      side: "corp",
      amount: 0,
      reason: "start_of_turn",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      dieRoll,
      randomPurpose,
      restrictedActionFamily: restriction,
      randomCounterAfter: state.randomCounter,
    } as ResolvedGameEffect);
    return;
  }
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
  const corpCascadeCounters = purgeableRunnerVirusCounterAmount(
    state.purgeableRunnerVirusCounters?.corp,
    "cascade",
  );
  const corpCascadeTrash = Math.floor(corpCascadeCounters / 2);
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
  }, {
    amount: corpCascadeTrash,
    sourceDefinitionId: corpCascadeCounters > 0 ? CASCADE_ID : undefined,
  } as { amount: number; sourceDefinitionId?: CardDefinitionId });
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
  applyStartTurnRandomEffectTables(state, effects);
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
  applyDelayedInstallStartOfTurn(
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
      "start_turn_trash_for_credits"
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

function applyStartTurnRandomEffectTables(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  for (const sourceId of state.runner.rig.resources.slice().sort()) {
    const sourceDefinitionId = definitionFor(state, sourceId).id;
    const implementation = runnerUtilityLongtailImplementationForCard(
      state,
      sourceId,
    );
    if (implementation?.kind !== "start_turn_random_effect_table") continue;
    const randomPurpose = `start_turn_random_effect_table.${sourceDefinitionId}.runner_start.${state.stateVersion}.${sourceId}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    const outcome =
      implementation.outcomes.find((candidate) => candidate.roll === dieRoll) ??
      implementation.defaultOutcome;
    const grantsAction =
      outcome.kind === "trash_source_and_grant_persistent_extra_action";
    const dealsDamage = outcome.kind === "unpreventable_damage";
    let damageSummary: DamageSummary | undefined;
    if (grantsAction) {
      const flags = ensureRunnerTurnFlags(state);
      const modifiers = (flags.persistentModifiers ??= []);
      if (!modifiers.some((modifier) => modifier.sourceCardInstanceId === sourceId)) {
        modifiers.push({
          sourceCardInstanceId: sourceId,
          sourceDefinitionId,
          kind: "runner_extra_actions_per_turn",
          amount: outcome.extraActions,
        });
        state.runner.clicks += outcome.extraActions;
      }
      trashRunnerInstalledCardToHeap(state, sourceId);
    } else if (dealsDamage) {
      damageSummary = doDamage(state, {
        damageId: `runner.start.${sourceDefinitionId}.${outcome.damageType}.${state.stateVersion}`,
        damageType: outcome.damageType,
        amount: outcome.amount,
        source: `runner_start:${sourceDefinitionId}`,
      });
    }
    effects?.push({
      effectId: `runner.start.random_effect_table.${sourceId}`,
      kind: grantsAction ? "gain_actions" : dealsDamage ? "damage" : "counter_change",
      visibility: "public",
      side: "runner",
      amount: grantsAction ? outcome.extraActions : damageSummary?.amount ?? 0,
      reason: "start_of_turn",
      sourceDefinitionId,
      sourceTitle: publicCardTitle(sourceDefinitionId),
      v1921DieRoll: dieRoll,
      randomEffectOutcome:
        grantsAction ? "permanent_action" : dealsDamage ? `${outcome.damageType}_damage` : "no_effect",
      randomPurpose,
      randomCounterAfter: state.randomCounter,
      ...(grantsAction
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

function applyRunnerStartTurnActionEconomyEffects(
  state: GameState,
  effects?: AutomaticEffectCollector,
): void {
  for (const sourceId of state.runner.rig.hardware.slice().sort()) {
    const definition = definitionFor(state, sourceId);
    const longtail =
      cardImplementationForDefinitionId(definition.id)?.uniqueDirectLongtail;
    if (
      longtail?.kind !==
      "runner_start_turn_drip_counter_action_or_core_damage"
    )
      continue;
    const current = cardCounter(state, sourceId, "drip");
    if (current >= longtail.threshold) {
      setCardCounter(state, sourceId, "drip", 0);
      const damageSummary = doDamage(state, {
        damageId: `runner.start.${definition.id}.drip_core.${state.stateVersion}`,
        damageType: "core",
        amount: 1,
        source: `runner_start:${definition.id}`,
      });
      effects?.push({
        effectId: `runner.start.drip.${sourceId}`,
        kind: "damage",
        visibility: "public",
        side: "runner",
        amount: 1,
        reason: "start_of_turn",
        counterType: "drip",
        remainingCounters: 0,
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
        damageCannotBePrevented: true,
        damageType: "core",
        cardsTrashed: damageSummary.cardsTrashed,
        ...(damageSummary.coreDamageAfter !== undefined
          ? { coreDamageAfter: damageSummary.coreDamageAfter }
          : {}),
      } as ResolvedGameEffect);
    } else {
      setCardCounter(state, sourceId, "drip", current + 1);
      state.runner.clicks += 1;
      effects?.push({
        effectId: `runner.start.drip.${sourceId}`,
        kind: "gain_actions",
        visibility: "public",
        side: "runner",
        amount: 1,
        reason: "start_of_turn",
        counterType: "drip",
        remainingCounters: current + 1,
        addedCounterAmount: 1,
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
      });
    }
  }

  for (const sourceId of state.runner.rig.resources.slice().sort()) {
    const definition = definitionFor(state, sourceId);
    const longtail =
      cardImplementationForDefinitionId(definition.id)?.uniqueDirectLongtail;
    if (longtail?.kind !== "runner_start_turn_forced_random_action") continue;
    const flags = ensureRunnerTurnFlags(state);
    if ((flags.installedResourceIdsLastTurn ?? []).includes(sourceId)) continue;
    const randomPurpose = `action_economy.${definition.id}.runner_start.${state.stateVersion}.${sourceId}`;
    const dieRoll = rollDeterministicDie(state, randomPurpose);
    const grant = runnerForcedActionGrantForRoll(
      state,
      sourceId,
      definition.id,
      dieRoll,
    );
    if (!grant) continue;
    addTurnBoundExtraActionGrant(state, {
      side: "runner",
      sourceCardInstanceId: sourceId,
      sourceDefinitionId: definition.id,
      restriction: grant.restriction,
      forced: true,
      dieRoll,
      randomPurpose,
      ...(grant.targetServerId ? { targetServerId: grant.targetServerId } : {}),
      ...(grant.targetCardInstanceId
        ? { targetCardInstanceId: grant.targetCardInstanceId }
        : {}),
      ...(grant.revealToCorpOnly ? { revealToCorpOnly: true } : {}),
    });
    effects?.push({
      effectId: `runner.start.forced_action.${sourceId}`,
      kind: "gain_actions",
      visibility: grant.revealToCorpOnly ? "hidden_info_barrier" : "public",
      side: "runner",
      amount: 1,
      reason: "start_of_turn",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
      dieRoll,
      randomPurpose,
      randomCounterAfter: state.randomCounter,
      restrictedActionFamily: grant.restriction,
      ...(grant.targetServerId ? { serverId: grant.targetServerId } : {}),
    } as ResolvedGameEffect);
  }
}

function runnerForcedActionGrantForRoll(
  state: GameState,
  sourceId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  dieRoll: number,
):
  | {
      restriction: RestrictedActionFamily;
      targetServerId?: Exclude<ServerId, "new_remote">;
      targetCardInstanceId?: CardInstanceId;
      revealToCorpOnly?: boolean;
    }
  | undefined {
  void sourceId;
  void sourceDefinitionId;
  if (dieRoll === 1) return { restriction: "draw_card" };
  if (dieRoll === 2) return { restriction: "gain_credit" };
  if (dieRoll === 3) return { restriction: "start_run", targetServerId: "rd" };
  if (dieRoll === 4) return { restriction: "start_run", targetServerId: "hq" };
  if (dieRoll === 5) {
    const remote = state.corp.servers
      .filter((server) => server.kind === "remote")
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    if (!remote) return undefined;
    return { restriction: "start_run", targetServerId: remote.id };
  }
  const target = randomRunnerGripCardId(state, "runner_forced_action.random_grip");
  if (!target) return undefined;
  return {
    restriction: "play_or_install_card",
    targetCardInstanceId: target,
    revealToCorpOnly: true,
  };
}

function randomRunnerGripCardId(
  state: GameState,
  purpose: string,
): CardInstanceId | undefined {
  if (state.runner.grip.length === 0) return undefined;
  const value = nextRandom(state, `${purpose}.${state.stateVersion}`);
  return state.runner.grip[Math.floor(value * state.runner.grip.length)];
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

  return {
    resolveEndTurnTagIfRunnerReceivedTag,
    resolveFieldReporterEndOfRunnerTurn,
    resolveDelayedEndTurnDamageEffects,
    endTurn,
    resolveSneakPreviewTemporaryInstallReturns,
    resolveCorpObligationEndOfTurn,
    startDiscardPhase,
    processDiscardStep,
    completeDiscardPhase,
    appendResolvedEffectsToPayload,
    automaticGainCreditsEffect,
    automaticLoseCreditsEffect,
    automaticDrawCardsEffect,
    automaticTagEffect,
    automaticTrashCardEffect,
    automaticCounterChangeEffect,
    automaticStealAgendaEffect,
    publicCardTitle,
    applyRunnerForgoNextAction,
    addRunnerFutureActionDebt,
    consumeRunnerFutureActionDebt,
    ensureActionEconomy,
    compactActionEconomy,
    currentTurnSerial,
    expireTurnBoundExtraActionGrants,
    filterActionsForRestrictedExtraActions,
    consumeRestrictedExtraActionForAction,
    addFutureExtraActionGrant,
    acceptExtraActionOffer,
    declineExtraActionOffer,
    resolvePdcaCounterAction,
    resolveForcedActionNotPossible,
    startCorpTurn,
    startRunnerTurn,
    returnCorpTemporaryInstallRezCredits,
    applyInstalledIceCounterLifecycle,
    untapRunnerCardsAtTurnStart,
    resolveDelayedAccessEffects,
    applyCorpStartOfTurnEffects,
    applyPurgeableRunnerVirusCorpStartEffects,
    openCorpStartTurnRestrictedActionOffers,
    virusCounterDrawsAtCorpStart,
    skivvissCounterTotal,
    virusCounterCascadeTrashAtCorpStart,
    trashFaceupRdCardsForCascade,
    applyRunnerStartOfTurnEffects,
    applyStartTurnRandomEffectTables,
    applyRunnerStartTurnActionEconomyEffects,
    runnerForcedActionGrantForRoll,
    randomRunnerGripCardId,
    virusCounterCreditsAtRunnerStart,
    startVirusCounterRunnerPrivateLookAtStart,
    randomCorpHqCardsWithoutReplacement,
    startRunnerPrivateLookAtSpecificCorpCards,
    queueIncubatorStartOfTurnTransforms,
    startIncubatorTransformChoice
  };
}
