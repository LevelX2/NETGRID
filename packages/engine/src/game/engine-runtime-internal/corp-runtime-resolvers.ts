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

export function createCorpRuntimeResolvers(deps: RuntimeDeps) {
  const {
    DEFAULT_CONTROLLERS,
    INITIAL_HAND_SIZE,
    PROTEUS_ARMAGEDDON_ID,
    PROTEUS_SCALDAN_ID,
    PROTEUS_TAXMAN_ID,
    PIPE_COUNTER_CORP_START_EFFECT_SOURCE_ID,
    RUNNER_EVENT_RESOLVERS,
    TAG_REMOVAL_RECURRING_CREDIT_DEFINITION_IDS,
    accessEffectHandlerHost,
    accessFlow,
    accessFlowHost,
    activatedCardImplementationExecutionHost,
    activeCrashEverettSourceId,
    addCounterToAllInstalledRunnerIcebreakers,
    addCurrentRunAccessCount,
    addCorpTraceCounterPoolCounters,
    addRunnerFutureActionDebt,
    addVirusCounterWithCounterPrevention,
    addVisibleCardCounter,
    affordableRezzedInstalledIceIdsForRunner,
    agendaPoints,
    agendaPointsForScoredCard,
    appendRegionReplacementTrashEffect,
    appendResolvedEffectsToPayload,
    applyActionHostComposition,
    applyRunStartRandomStrengthBonus,
    applyCorpStartOfTurnEffects,
    applyEffectCommands,
    applyPurgeableRunnerVirusCorpStartEffects,
    applyStartTurnRandomEffectTables,
    applyRunnerDrawSummaryPayload,
    applyRunnerForgoNextAction,
    applyRunnerStartOfTurnEffects,
    applyRunnerTraceCounterRunStartEffects,
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
    availableRunnerProgramInstallCredits,
    availableRunnerTagRemovalCredits,
    backupProgramsOnTrashBackupHardwareBeforeTrash,
    boardStateActionExecutionHost,
    breachStateHost,
    breakAbilityForLegalAction,
    breakSubroutineCostBreakdown,
    canHostProgramOnDaemon,
    canInstallCorpRootCardInServer,
    canInstallRunnerProgramFromZone,
    canOverlayProgramOnInstalledProgramHost,
    canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity,
    cardHasSubtype,
    cardImplementationAgendaPointInstallCost,
    cardImplementationEffectAdapters,
    cardImplementationRunnerEventResolver,
    cardImplementationRuntimeDeps,
    cardInstallCapabilitiesForDefinition,
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
    completeDiscardPhase,
    consumeEdgerunnerTempsInstallAction,
    consumeRunnerFutureActionDebt,
    consumeValuPakProgramInstallAction,
    continueRun,
    continueRandomDiceLoop,
    corpAgendaPointTotal,
    corpIceInstallAdditionalCost,
    corpIceInstallBaseCost,
    corpIceInstallTotalCost,
    corpInstallRezSequenceHandlerHost,
    corpOperationResolutionHost,
    corpRegionUpgradeIdsInServer,
    corpRootAgendaOrNodeCapacityInServer,
    corpRunnerActionPaidWindowActions,
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
    endTurn,
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
    fortCapacityModifiersForCard,
    fortPassWindowHostForState,
    fortRunSideFamiliesHostForState,
    gameCardImplementationRuntimeDepsHost,
    corpTraceCounterPoolSourceIds,
    corpTraceCounterPoolTotal,
    corpTraceCounterPoolCounterType,
    handForSide,
    hasCardImplementationMemoryUnitModifier,
    hasCorpUtilityKind,
    hasHiddenResourceAccessStartActions,
    hasInstallCapabilityKindForDefinition,
    hasInstalledRunnerApDamageReducerHardware,
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
    isCorpTraceCounterPoolSource,
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
    installedProgramTrashBackupHardwareIds,
    runnerHardwareBreakSubroutineAdditionalCost,
    mustInstallInsideSubsidiaryDataFort,
    runStartTaxForCorpRootAssets,
    normalizeSubtypeLabel,
    openPostMeatDamageReactionWindow,
    openRunnerCostPenaltySupportWindow,
    outermostIceExposures,
    outermostIceIndex,
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
    poxCountersForServer,
    poxInstallTax,
    preventOneVirusCounterWithCounterPrevention,
    printedCostCardImplementationMakeRunEffect,
    privateLookCardIds,
    processDiscardStep,
    publicCardTitle,
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
    remainingReplacementLongtailKindForCard,
    remainingReplacementLongtailKindForDefinition,
    requireRunnerTagged,
    requiresDataFortInstallTarget,
    resolveCorpObligationEndOfTurn,
    resolveDerezRezzedBlackIceChoice,
    resolveDelayedAccessEffects,
    resolveBlinkBreakSubroutineAction,
    resolveCardImplementationAccessPaymentChoice,
    resolveChimeraDaemonTrashChoice,
    resolveVirusCounterPurgePreserveChoice,
    resolvePayRezCostToTrashRezzedIceChoice,
    resolveCrashEverettDrawChoice,
    resolveRunnerIcebreakerCounterEvent,
    resolveDiscardChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveFieldReporterEndOfRunnerTurn,
    resolveCorpChoiceRezOrTrashIceDecisionChoice,
    resolveCorpChoiceRezOrTrashIceTargetChoice,
    resolveMultiExposeInstalledCorpCardsChoice,
    resolveIncubatorTransformChoice,
    resolveRunnerGripHeapStackShuffleDrawEvent,
    resolveMultiBreakSubroutinesAction,
    resolveEndTurnTagIfRunnerReceivedTag,
    resolvePaidSourceReturnToGripChoice,
    resolveP358HiddenReplacementChoice,
    resolveRandomDiceLoopEvent,
    resolvePostMeatDamageHiddenResourceChoice,
    resolvePostOnPlayGenericFollowups,
    resolveDelayedEndTurnDamageEffects,
    resolveRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveRunnerLastTurnInstalledResourceTargetId,
    resolveRunnerPrivateLookChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
    resolveRunnerTargetedEventImplementation,
    resolveTrashUnrezzedIceChoice,
    resolveSetupMulliganChoice,
    resolveTemporaryProgramInstallReturns,
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
    shuffleCorpCardIntoRd,
    shuffleGripTrashAndStackThenDrawForCardImplementation,
    shuffleRunnerStack,
    skivvissCounterTotal,
    specialZoneHarnessActions,
    spendEncounterTemporaryTraceCredits,
    spendCorpTraceCounterPoolCounters,
    spendRecurringTraceCreditPool,
    spendRunnerAccessTrashCredits,
    spendRunnerInstallCredits,
    spendRunnerTagRemovalCredits,
    spendVisibleCardCounter,
    spyCountersForServer,
    stableSubtypeList,
    startDerezRezzedBlackIceChoice,
    startVirusCounterPurgePreserveChoice,
    startPayRezCostToTrashRezzedIceChoice,
    startCorpTurn,
    startCrashEverettDrawChoice,
    startDiscardPhase,
    startPostAccessInstalledProgramChoice,
    startExposeInstalledCorpCardsChoice,
    startCorpChoiceRezOrTrashIceChoice,
    startMultiExposeInstalledCorpCardsChoice,
    startIncubatorTransformChoice,
    startPaidSourceReturnToGripChoice,
    startRun,
    startRunActionExecutionHost,
    startRunnerHostingChoice,
    startRunnerPrivateLookAtSpecificCorpCards,
    startRunnerPrivateLookChoice,
    startRunnerProgramTrashBeforeInstallChoice,
    startRunnerTurn,
    startTrashUnrezzedIceChoice,
    startRunnerProgramFreeMemoryChoice,
    startRandomDiceSplitChoice,
    startVirusCounterRunnerPrivateLookAtStart,
    subroutinesForCurrentEncounter,
    successfulRunInterventionHost,
    swapCorpHqAndRdTop,
    takeSetupMulligan,
    totalCounters,
    traceCounterEffectDefinitionFor,
    traceOrchestrationHost,
    traceRuntimeDepsHost,
    trashCorpInstalledCardToArchives,
    trashCorpInstalledCardsInScoredSourceServer,
    trashFaceupRdCardsForCascade,
    trashOlderRegionUpgradesInServer,
    trashRunnerInstalledCardToHeap,
    trashRunnerInstalledProgram,
    triggerAbilityExecutionHost,
    turnCorpRuntime,
    turnBasicExecutionHost,
    uniqueDirectLongtailImplementationForCard,
    uniqueDirectLongtailImplementationForDefinition,
    uniqueDirectLongtailKindForCard,
    uniqueDirectLongtailKindForDefinition,
    unrezzedInstalledIceIds,
    untapRunnerCardsAtTurnStart,
    v1915InstalledRevealHelperIds,
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
    withoutVariableIceState,
  } = deps;

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
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
    };
  }

  function forfeitCorpAgendaForPointCost(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    if (!cardId || !state.corp.scoreArea.includes(cardId))
      throw new Error(
        "Die Korp kann diese Agenda nicht fuer Kosten forfeiten.",
      );
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
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
    };
  }

  function activeObligationCount(state: GameState): number {
    return Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0));
  }

  function addActiveObligation(
    state: GameState,
    amount: number,
  ): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("ACME-Verpflichtungsmenge ist ungueltig.");
    state.activeObligationDebtCount =
      activeObligationCount(state) + amount;
  }

  function removeActiveObligation(state: GameState): void {
    const current = activeObligationCount(state);
    if (current <= 0)
      throw new Error("Es gibt keine ACME-Savings-and-Loan-Verpflichtung.");
    state.activeObligationDebtCount = current - 1;
  }

  function spendCorpAgendaPointCost(
    state: GameState,
    requiredPoints: number,
  ): CorpAgendaPointCostResult {
    if (!Number.isInteger(requiredPoints) || requiredPoints <= 0)
      throw new Error("Agenda-Punkt-Kosten sind ungueltig.");
    let remaining = requiredPoints;
    let paidPoints = 0;
    const bonusBefore = Math.max(
      0,
      Math.floor(state.corpBonusAgendaPoints ?? 0),
    );
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
          effectiveAgendaDifficulty(
            effectiveAgendaDifficultyDeps,
            state,
            left,
          ) - mustInstance(state.cardInstances, left).advancementCounters,
        );
        const rightRemaining = Math.max(
          0,
          effectiveAgendaDifficulty(
            effectiveAgendaDifficultyDeps,
            state,
            right,
          ) - mustInstance(state.cardInstances, right).advancementCounters,
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

  function corpScoredAgendaForfeitTargets(state: GameState): CardInstanceId[] {
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

  function hardwareTrashByCounterEligibleHardwareIds(
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
        const byTitle = leftDefinition.title.localeCompare(
          rightDefinition.title,
        );
        if (byTitle !== 0) return byTitle;
        return left.localeCompare(right);
      });
  }

  function hardwareTrashByCounterLegalActions(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): LegalAction[] {
    const eligibleHardwareIds = hardwareTrashByCounterEligibleHardwareIds(state);
    const maxTrashCount = Math.min(
      eligibleHardwareIds.length,
      state.corp.credits,
    );
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
            hardwareTrashByCounterTrashCount: trashCount,
            eligibleHardwareCount: eligibleHardwareIds.length,
          },
        ),
      );
    }
    return actions;
  }

  function hardwareTrashByCounterTrashCountFromPayload(
    legalAction: LegalAction,
  ): number {
    const trashCount = Number(
      legalAction.payload?.hardwareTrashByCounterTrashCount ?? 1,
    );
    if (!Number.isInteger(trashCount) || trashCount <= 0)
      throw new Error("Hardware-Trash-by-Counter braucht eine gueltige X-Auswahl.");
    return trashCount;
  }

  function resolveHardwareTrashByCounterOperation(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const trashCount = hardwareTrashByCounterTrashCountFromPayload(legalAction);
    const eligibleHardwareIds = hardwareTrashByCounterEligibleHardwareIds(state);
    if (eligibleHardwareIds.length < trashCount)
      throw new Error(
        "Hardware-Trash-by-Counter findet nicht genug nicht-Cybernetics-Hardware.",
      );
    if (eligibleHardwareIds.length > trashCount) {
      startHardwareTrashByCounterChoice(
        state,
        eligibleHardwareIds,
        trashCount,
        legalAction,
      );
      return;
    }
    trashHardwareByCounter(state, eligibleHardwareIds, legalAction);
  }

  function startHardwareTrashByCounterChoice(
    state: GameState,
    eligibleHardwareIds: CardInstanceId[],
    trashCount: number,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `installed_hardware_trash_by_counter_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.installed_hardware_trash_by_counter:${trashCount}:${state.stateVersion + 1}`,
      prompt: `Hardware-Trash-by-Counter: ${trashCount} Hardware trashen`,
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
      hardwareTrashByCounterChoiceOpened: true,
      eligibleHardwareCount: eligibleHardwareIds.length,
      hardwareTrashByCounterTrashCount: trashCount,
    };
  }

  function hardwareTrashByCounterTrashCountFromChoiceSource(source: string): number {
    const [, rawTrashCount] = source.split(":");
    const trashCount = Number(rawTrashCount);
    if (!Number.isInteger(trashCount) || trashCount <= 0)
      throw new Error(
        "Hardware-Trash-by-Counter-Choice hat keine gueltige X-Auswahl.",
      );
    return trashCount;
  }

  function resolveHardwareTrashByCounterChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("card_implementation.installed_hardware_trash_by_counter"))
      throw new Error("Es ist keine Hardware-Trash-by-Counter-Choice offen.");
    const trashCount = hardwareTrashByCounterTrashCountFromChoiceSource(
      choice.source,
    );
    const selectedIds = selectedChoiceCardIds(
      choice,
      playerAction,
    ) as CardInstanceId[];
    if (selectedIds.length !== trashCount)
      throw new Error("Hardware-Trash-by-Counter braucht genau X Hardware-Ziele.");
    const legalTargets = new Set(hardwareTrashByCounterEligibleHardwareIds(state));
    for (const cardId of selectedIds) {
      if (!legalTargets.has(cardId))
        throw new Error(
          "Hardware-Trash-by-Counter darf dieses Hardware-Ziel nicht trashen.",
        );
    }
    delete state.pendingChoice;
    trashHardwareByCounter(state, selectedIds, legalAction);
  }

  function trashHardwareByCounter(
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
        "installed_hardware_trash_by_counter",
      )
    )
      return;
    for (const cardId of hardwareIds) {
      if (!hardwareTrashByCounterEligibleHardwareIds(state).includes(cardId))
        throw new Error(
          "Hardware-Trash-by-Counter darf dieses Hardware-Ziel nicht mehr trashen.",
        );
      trashRunnerInstalledCardToHeap(state, cardId);
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hardwareTrashByCounterTrashCount: hardwareIds.length,
      trashedHardwareCount: hardwareIds.length,
      trashedHardwareDefinitionIds: definitionIds.join(","),
    };
  }

  function advancementPlacementLegalActions(
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

  function resolveAdvancementPlacementOperation(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const options = advancementPlacementOptions(state);
    if (options.length === 0)
      throw new Error("Advancement-Placement findet kein advancebares Ziel.");
    startAdvancementPlacementChoice(state, options, legalAction);
  }

  function advancementPlacementOptions(state: GameState): Array<{
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
        "Advancement-Placement-Ziel fehlt.",
      );
      for (
        let secondIndex = firstIndex;
        secondIndex < targets.length;
        secondIndex += 1
      ) {
        const secondTargetId = mustArrayValue(
          targets,
          secondIndex,
          "Advancement-Placement-Ziel fehlt.",
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

  function startAdvancementPlacementChoice(
    state: GameState,
    options: ReturnType<typeof advancementPlacementOptions>,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `advancement_placement_${state.stateVersion + 1}`,
      side: "corp",
      source: `card_implementation.advancement_placement:${state.stateVersion + 1}`,
      prompt: "Advancement-Placement: Advancement-Counter legen",
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

  function resolveAdvancementPlacementChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("card_implementation.advancement_placement")
    )
      throw new Error(
        "Es ist keine Advancement-Placement-Advancement-Choice offen.",
      );
    const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
    const selectedOption = choice.options.find(
      (option) => option.id === selectedOptionId,
    );
    if (!selectedOption || typeof selectedOption.value !== "string")
      throw new Error(
        "Advancement-Placement braucht genau eine Placement-Auswahl.",
      );
    const [firstTargetId, secondTargetId] = selectedOption.value.split("|") as [
      CardInstanceId | undefined,
      CardInstanceId | undefined,
    ];
    if (!firstTargetId || !secondTargetId)
      throw new Error(
        "Advancement-Placement hat keine gueltige Placement-Auswahl.",
      );
    applyAdvancementCounterPlacement(
      state,
      firstTargetId,
      secondTargetId === firstTargetId ? undefined : secondTargetId,
      legalAction,
    );
    delete state.pendingChoice;
  }

  function applyAdvancementCounterPlacement(
    state: GameState,
    firstTargetId: CardInstanceId,
    secondTargetId: CardInstanceId | undefined,
    legalAction: LegalAction,
  ): void {
    const eligibleTargets = new Set<CardInstanceId>(
      advanceableInstalledCardTargets(state) as CardInstanceId[],
    );
    if (!firstTargetId || !eligibleTargets.has(firstTargetId))
      throw new Error("Advancement-Placement findet kein advancebares Ziel.");
    if (secondTargetId && !eligibleTargets.has(secondTargetId))
      throw new Error(
        "Advancement-Placement findet kein zweites advancebares Ziel.",
      );

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
      sourceDefinitionId: ADVANCEMENT_PLACEMENT_OPERATION_ID,
      v1919OperationAbility: "add_advancement_counters",
      targetCardId: firstTargetId,
      targetCardDefinitionId: definitionFor(state, firstTargetId).id,
      targetCardDefinitionIds: placementEntries
        .map(([targetId]) => definitionFor(state, targetId).id)
        .join(","),
      addedAdvancementCounters: 2,
      targetCount,
      advancementPlacementDistribution: placementEntries
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

  type RuntimeObject = { [key: string]: unknown };

  function callTurnCorpRuntime(delegateName: string, args: any[]): any {
    const delegate = (turnCorpRuntime as RuntimeObject)[delegateName];
    if (typeof delegate !== "function")
      throw new Error(`Turn-Corp-Runtime-Delegate fehlt: ${delegateName}.`);
    return delegate(...args);
  }

  function advanceableInstalledCardTargets(...args: any[]): any {
    return callTurnCorpRuntime("advanceableInstalledCardTargets", args);
  }

  function isInstalledCorpCardAdvanceable(...args: any[]): any {
    return callTurnCorpRuntime("isInstalledCorpCardAdvanceable", args);
  }

  function advancementDistributionOptions(...args: any[]): any {
    return callTurnCorpRuntime("advancementDistributionOptions", args);
  }

  function startCardImplementationAdvancementDistributionChoice(
    ...args: any[]
  ): any {
    return callTurnCorpRuntime(
      "startCardImplementationAdvancementDistributionChoice",
      args,
    );
  }

  function parseAdvancementDistributionValue(...args: any[]): any {
    return callTurnCorpRuntime("parseAdvancementDistributionValue", args);
  }

  function sourcePartsForP334Choice(...args: any[]): any {
    return callTurnCorpRuntime("sourcePartsForP334Choice", args);
  }

  function validateAdvancementDistribution(...args: any[]): any {
    return callTurnCorpRuntime("validateAdvancementDistribution", args);
  }

  function resolveCardImplementationAdvancementDistributionChoice(
    ...args: any[]
  ): any {
    return callTurnCorpRuntime(
      "resolveCardImplementationAdvancementDistributionChoice",
      args,
    );
  }

  function movableAdvancementSourceIds(...args: any[]): any {
    return callTurnCorpRuntime("movableAdvancementSourceIds", args);
  }

  function moveAdvancementOptions(...args: any[]): any {
    return callTurnCorpRuntime("moveAdvancementOptions", args);
  }

  function startCardImplementationMoveAdvancementChoice(...args: any[]): any {
    return callTurnCorpRuntime(
      "startCardImplementationMoveAdvancementChoice",
      args,
    );
  }

  function resolveCardImplementationMoveAdvancementChoice(...args: any[]): any {
    return callTurnCorpRuntime(
      "resolveCardImplementationMoveAdvancementChoice",
      args,
    );
  }

  function resolveCorpOperationAddAdvancementCounters(...args: any[]): any {
    return callTurnCorpRuntime("resolveCorpOperationAddAdvancementCounters", args);
  }

  function awardRunnerEventAgendaPoint(...args: any[]): any {
    return callTurnCorpRuntime("awardRunnerEventAgendaPoint", args);
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
    validateCorpInstalledEconomyAction(
      state,
      legalAction,
      sourceCardId,
      profile,
    );
    for (
      let spentClicks = 1;
      spentClicks < profile.clickCost;
      spentClicks += 1
    ) {
      spendClick(state, "corp");
    }
    if (profile.creditCost > 0) spendCredits(state, "corp", profile.creditCost);
    credits(state, "corp", profile.creditGain);
    if (profile.trashSource)
      trashCorpInstalledCardToArchives(state, sourceCardId);
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
      throw new Error(
        "Diese Economy-Faehigkeit ist nur in der Korp-Aktionsphase nutzbar.",
      );
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
      throw new Error(
        "Die Economy-Faehigkeit hat einen ungueltigen Creditbetrag.",
      );
    if (
      Boolean(legalAction.payload?.trashOnUse) !== Boolean(profile.trashSource)
    )
      throw new Error(
        "Die Economy-Faehigkeit hat einen ungueltigen Trash-Parameter.",
      );
  }

  function rezzedCorpInstalledEconomyCreditSourceIds(state: GameState): CardInstanceId[] {
    return rezzedCorpRootCardIds(state)
      .filter((cardId: CardInstanceId) => isCorpInstalledEconomyCreditSource(state, cardId))
      .sort();
  }

  function shouldOpenCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    return (
      legalAction.side === "corp" &&
      legalAction.source === "basic_action" &&
      legalAction.type === "gain_credit" &&
      Object.keys(legalAction.payload ?? {}).length === 0 &&
      rezzedCorpInstalledEconomyCreditSourceIds(state).length > 0
    );
  }

  function startCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const economyCreditSourceIds = rezzedCorpInstalledEconomyCreditSourceIds(state);
    if (economyCreditSourceIds.length === 0)
      throw new Error("Es ist keine rezzed installierte Economy-Credit-Quelle vorhanden.");
    const sourceDefinitionId = definitionFor(state, economyCreditSourceIds[0]!).id;
    state.pendingChoice = {
      choiceId: `corp_installed_economy_credit_choice_${state.stateVersion + 1}`,
      side: "corp",
      source: `corp_installed_economy.credit_choice:${state.stateVersion + 1}`,
      prompt:
        "Credit nehmen oder 2 Credits auf eine Economy-Quelle legen?",
      kind: "select_option",
      options: [
        {
          id: "take_credit",
          label: "1 Credit nehmen",
          publicLabel: "1 Credit genommen",
          value: "take_credit",
        },
        ...economyCreditSourceIds.map((cardId, index) => ({
          id: `corp_installed_economy_credit_${cardId}`,
          label:
            economyCreditSourceIds.length === 1
              ? "2 Credits auf die Economy-Quelle legen"
              : `2 Credits auf Economy-Quelle ${index + 1} legen`,
          publicLabel: "2 Credits auf Economy-Quelle gelegt",
          value: cardId,
        })),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    legalAction.payload = {
      corpInstalledEconomyCreditChoiceOpened: true,
      gainCreditsAmount: 0,
      sourceDefinitionId,
    };
  }

  function resolveCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("corp_installed_economy.credit_choice"))
      throw new Error("Es ist keine Economy-Credit-Choice offen.");
    if (choice.side !== "corp" || legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Economy-Credit-Choice nutzen.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    if (selected === "take_credit") {
      const sourceDefinitionId = definitionFor(
        state,
        rezzedCorpInstalledEconomyCreditSourceIds(state)[0]!,
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
    const selectedOption = choice.options.find(
      (option) => option.id === selected,
    );
    const sourceCardId = String(selectedOption?.value ?? "");
    if (!rezzedCorpInstalledEconomyCreditSourceIds(state).includes(sourceCardId))
      throw new Error("Die gewaehlte Economy-Credit-Quelle ist nicht mehr legal.");
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

  return {
    forfeitRunnerAgendaForPointCost,
    forfeitCorpAgendaForPointCost,
    activeObligationCount,
    addActiveObligation,
    removeActiveObligation,
    spendCorpAgendaPointCost,
    installedAgendaOperationTarget,
    corpAgendaCounterOperationTarget,
    corpScoredAgendaForfeitTargets,
    hardwareTrashByCounterEligibleHardwareIds,
    hardwareTrashByCounterLegalActions,
    hardwareTrashByCounterTrashCountFromPayload,
    resolveHardwareTrashByCounterOperation,
    startHardwareTrashByCounterChoice,
    hardwareTrashByCounterTrashCountFromChoiceSource,
    resolveHardwareTrashByCounterChoice,
    trashHardwareByCounter,
    advancementPlacementLegalActions,
    resolveAgendaCounterOperation,
    resolveAdvancementPlacementOperation,
    advancementPlacementOptions,
    startAdvancementPlacementChoice,
    resolveAdvancementPlacementChoice,
    applyAdvancementCounterPlacement,
    advanceableInstalledCardTargets,
    isInstalledCorpCardAdvanceable,
    advancementDistributionOptions,
    startCardImplementationAdvancementDistributionChoice,
    parseAdvancementDistributionValue,
    sourcePartsForP334Choice,
    validateAdvancementDistribution,
    resolveCardImplementationAdvancementDistributionChoice,
    movableAdvancementSourceIds,
    moveAdvancementOptions,
    startCardImplementationMoveAdvancementChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveCorpOperationAddAdvancementCounters,
    awardRunnerEventAgendaPoint,
    choiceAction,
    abilityMetadata,
    resolveCorpInstalledEconomyAction,
    validateCorpInstalledEconomyAction,
    rezzedCorpInstalledEconomyCreditSourceIds,
    shouldOpenCorpInstalledEconomyCreditChoice,
    startCorpInstalledEconomyCreditChoice,
    resolveCorpInstalledEconomyCreditChoice,
  };
}
