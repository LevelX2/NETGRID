// @ts-nocheck
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
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
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
import { configureEventContextHostComposition } from "../events/event-context-hosts";
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
import { rezCard as executeRezCard, type RezCardHost } from "../rez/rez-card";
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
import { buildRunnerProgramTrashBeforeInstallAction } from "../turn/runner-program-trash-install-actions";
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
import { type EncounterPrintedNonTraceHost } from "../run/encounter-printed-nontrace-effects";
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
import { type HiddenZoneRuntimeDepsHost } from "../card-implementation/hidden-zone-runtime-deps";
import { type InstallRezRuntimeDepsHost } from "../card-implementation/install-rez-runtime-deps";
import { type CounterLifecycleRuntimeDepsHost } from "../card-implementation/counter-lifecycle-runtime-deps";
import { type TraceRuntimeDepsHost } from "../card-implementation/trace-runtime-deps";
import {
  beginEncounter,
  continueAfterCorpRootRezIfWindowIsComplete,
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
  corpRunRootRezActionsAvailable,
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
import { isP358HiddenReplacementCompatibilityChoiceSource } from "../../compatibility/payload-compatibility";
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
import type { RuntimeDeps } from "./runtime-shared";

export function createCardLifecycleRuntimeHosts(
  deps: RuntimeDeps,
  runtime: Record<string, unknown>,
) {
  const {
    PROTEUS_ARMAGEDDON_ID,
    activeObligationCount,
    applyRunnerDrawSummaryPayload,
    assertCorpIceInstallCostValid,
    availableRunnerProgramInstallCredits,
    canHostProgramOnDaemon,
    canInstallCorpRootCardInServer,
    canOverlayProgramOnZetatechSoftwareInstaller,
    cardHasSubtype,
    cardImplementationAgendaPointInstallCost,
    cardImplementationRuntimeDeps,
    closeRunnerCostPenaltySupportWindowForPayment,
    consumeEdgerunnerTempsInstallAction,
    consumeValuPakProgramInstallAction,
    corpRootAgendaOrNodeCapacityInServer,
    creditCostForAction,
    drawRunnerCards,
    encounterEntryHostForState,
    expireScoredAgendaInstallRezCreditAbilities,
    forfeitRunnerAgendaForPointCost,
    fortRunSideFamiliesHostForState,
    hasCardImplementationMemoryUnitModifier,
    hasInstalledUniqueCardDefinition,
    installedRunnerProgramTrashOptionsForInstall,
    isObligationDebtDefinition,
    isRegionUpgrade,
    isUniqueCard,
    openRunnerCostPenaltySupportWindow,
    requiresDataFortInstallTarget,
    rootInstallRezzesOnInstall,
    runRezWindowHostForState,
    runnerCanPayInstallCost,
    runnerProgramInstallMemoryReachableAfterTrash,
    runnerProgramUsesMemory,
    selectedChoiceCardIds,
    spendCorpAgendaPointCost,
    spendRunnerInstallCredits,
    stableSubtypeList,
    startRunnerHostingChoice,
    trashCorpInstalledCardToArchives,
    trashOlderRegionUpgradesInServer,
    trashRunnerInstalledCardToHeap,
    variableRezForDefinition,
  } = deps;

  function spendCorpInstallRezCredits(state: GameState, amount: number): void {
    spendCredits(state, "corp", amount);
    if (amount <= 0 || !state.corpTemporaryInstallRezCredits) return;
    state.corpTemporaryInstallRezCredits.remaining = Math.max(
      0,
      Math.floor(state.corpTemporaryInstallRezCredits.remaining ?? 0) - amount,
    );
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
        assertCorpCanCreateNewDataFort: () =>
          assertCorpCanCreateNewDataFort(state),
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
          trashOlderRegionUpgradesInServer(
            state,
            server,
            keepCardId,
            legalAction,
          ),
        markFortActivityForRunGate: (serverId, legalAction) =>
          markFortActivityForRunGate(
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
        expireScoredAgendaInstallRezCreditAbilities: () =>
          expireScoredAgendaInstallRezCreditAbilities(state),
        consumeEdgerunnerTempsInstallAction: (legalAction) =>
          consumeEdgerunnerTempsInstallAction(state, legalAction),
        isRegionUpgrade,
        isFortTraceBitPoolSource: (cardId) =>
          isFortTraceBitPoolSource(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        fortTraceBitPoolCapacityForCard: (cardId) =>
          fortTraceBitPoolCapacityForCard(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
      hosting: {
        canHostProgramOnDaemon: (hostCardId, definition) =>
          canHostProgramOnDaemon(state, hostCardId, definition),
        canOverlayProgramOnZetatechSoftwareInstaller: (
          hostCardId,
          definition,
        ) =>
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
        runnerCanPayInstallCost: (amount, cardType) =>
          runnerCanPayInstallCost(state, amount, cardType),
        openRunnerCostPenaltySupportWindow: (legalAction, amount, cardType) =>
          openRunnerCostPenaltySupportWindow(
            state,
            legalAction,
            amount,
            cardType,
          ),
        closeRunnerCostPenaltySupportWindowForPayment: (legalAction, amount) =>
          closeRunnerCostPenaltySupportWindowForPayment(
            state,
            legalAction,
            amount,
          ),
        spendCredits: (side, amount) =>
          side === "corp"
            ? spendCorpInstallRezCredits(state, amount)
            : spendCredits(state, side, amount),
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
        handlePostIceRezContinuation: (cardId, legalAction) => {
          const continuation = continueAfterCorpRootRezIfWindowIsComplete(
            encounterEntryHostForState(state),
            legalAction,
          );
          if (continuation.handled) return true;
          const run = state.run;
          return Boolean(
            state.timingPoint === "run.approach_ice" &&
            run?.phase === "approach_ice" &&
            run.approachedIceId === cardId &&
            corpRunRootRezActionsAvailable(runRezWindowHostForState(state)),
          );
        },
        beginEncounter: (cardId, legalAction) =>
          beginEncounter(
            encounterEntryHostForState(state),
            cardId,
            legalAction,
          ),
      },
      payment: {
        rezCostForCard: (cardId) => rezCostForCard(state, cardId),
        assertCorpRezCostQuoteValid: (cardId, legalAction) =>
          assertCorpRezCostQuoteValid(state, cardId, legalAction),
        creditCostForAction,
        spendCredits: (side, amount) =>
          side === "corp"
            ? spendCorpInstallRezCredits(state, amount)
            : spendCredits(state, side, amount),
      },
      corp: {
        isObligationDebtDefinition,
        spendCorpAgendaPointCost: (requiredPoints) =>
          spendCorpAgendaPointCost(state, requiredPoints),
        activeObligationCount: () =>
          activeObligationCount(state),
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
        isFortTraceBitPoolSource: (cardId) =>
          isFortTraceBitPoolSource(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        fortTraceBitPoolCapacityForCard: (cardId) =>
          fortTraceBitPoolCapacityForCard(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
      constants: {},
    };
  }

  function resolveRunnerTargetedEventImplementation(
    state: GameState,
    definition: CardDefinition,
    legalAction: LegalAction,
  ): boolean {
    const effect = cardImplementationForDefinitionId(
      definition.id,
    )?.runnerEventTargetedEffect;
    if (effect?.kind !== "add_strength_counter_to_installed_icebreaker")
      return false;
    const targetCardId = String(
      legalAction.payload?.targetCardId ?? "",
    ) as CardInstanceId;
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

  function resolveMitWestTier(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const cardId = String(legalAction.payload?.cardId);
    removeFromAllZones(state, cardId);
    const specialZones = ensureSpecialZones(state);
    specialZones.removedFromGame.push(cardId);
    specialZones.removedFromGame.sort();
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
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
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
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
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
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
      throw new Error(
        "Durch Programmtrash kann nicht genug MU freigemacht werden.",
      );
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
    if (
      !choice ||
      !choice.source.startsWith("runner_program_trash_before_install")
    )
      throw new Error("Es ist keine Programmtrash-Installationschoice offen.");
    const sourceCardId = choice.source.split(":")[1] as
      | CardInstanceId
      | undefined;
    if (!sourceCardId || !state.runner.grip.includes(sourceCardId))
      throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
    if (
      state.phase !== "runner_action_phase" ||
      state.timingPoint !== "runner_action.main"
    )
      throw new Error(
        "Programme koennen nur im Runner-Aktionsfenster installiert werden.",
      );
    if (state.runner.clicks <= 0)
      throw new Error("Der Runner hat keinen Klick fuer die Installation.");
    const definition = definitionFor(state, sourceCardId);
    if (definition.type !== "program")
      throw new Error(
        "Nur Programme koennen ueber diese Choice installiert werden.",
      );
    if (
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      throw new Error("Nicht genug Credits fuer die Programminstallation.");

    const trashIds = selectedChoiceCardIds(
      choice,
      playerAction,
    ) as CardInstanceId[];
    const uniqueTrashIds = [...new Set(trashIds)];
    if (uniqueTrashIds.length !== trashIds.length)
      throw new Error("Die Programmtrash-Auswahl enthaelt doppelte Karten.");
    for (const cardId of uniqueTrashIds) {
      if (!state.runner.rig.programs.includes(cardId))
        throw new Error(
          "Die Programmtrash-Auswahl enthaelt kein installiertes Programm.",
        );
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
    for (const cardId of uniqueTrashIds)
      trashRunnerInstalledCardToHeap(state, cardId);
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

  return {
    installCardHost,
    rezCardHost,
    resolveRunnerTargetedEventImplementation,
    resolvePostOnPlayGenericFollowups,
    resolveMitWestTier,
    shuffleGripTrashAndStackThenDrawForCardImplementation,
    startRunnerProgramTrashBeforeInstallChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
  };
}
