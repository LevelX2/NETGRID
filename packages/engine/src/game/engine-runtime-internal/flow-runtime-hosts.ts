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
import type { RuntimeDeps } from "./runtime-shared";

export function createFlowRuntimeHosts(deps: RuntimeDeps) {
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
    accessFlow,
    acmeSavingsAndLoanObligationCount,
    activatedCardImplementationExecutionHost,
    activeCrashEverettSourceId,
    addAcmeSavingsAndLoanObligation,
    addCounterToAllInstalledRunnerIcebreakers,
    addRunnerFutureActionDebt,
    addVirusCounterWithDisinfectantPrevention,
    addVisibleCardCounter,
    advanceableInstalledCardTargets,
    advancementDistributionOptions,
    affordableRezzedInstalledIceIdsForRunner,
    agendaPoints,
    agendaPointsForScoredCard,
    appendRegionReplacementTrashEffect,
    appendResolvedEffectsToPayload,
    applyActionHostComposition,
    applyCorpStartOfTurnEffects,
    applyEffectCommands,
    applyProteusPurgeableRunnerVirusCorpStartEffects,
    applyQuestForCattekinStartOfTurn,
    applyRunnerDrawSummaryPayload,
    applyRunnerForgoNextAction,
    applyRunnerStartOfTurnEffects,
    applySystematicLayoffsAdvancementPlacement,
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
    awardRunnerEventAgendaPoint,
    backupProgramsOnMicrotechBeforeTrash,
    boardStateActionExecutionHost,
    breakAbilityForLegalAction,
    breakSubroutineCostBreakdown,
    canHostProgramOnDaemon,
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
    citySurveillanceSourceIds,
    cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay,
    clearEdgerunnerTempsInstallFlags,
    clearValuPakProgramInstallFlags,
    clickCostForAction,
    closeRunnerCostPenaltySupportWindowForPayment,
    cockroachCounterTotal,
    cockroachRandomHqDiscardActive,
    codeViralCachePurgePreserveTargets,
    completeDiscardPhase,
    consumeEdgerunnerTempsInstallAction,
    consumeRunnerFutureActionDebt,
    consumeValuPakProgramInstallAction,
    continueV1921PlayfulAiLoop,
    corpAgendaCounterOperationTarget,
    corpAgendaPointTotal,
    corpIceInstallAdditionalCost,
    corpIceInstallBaseCost,
    corpIceInstallTotalCost,
    corpInstallRezSequenceHandlerHost,
    corpOperationResolutionHost,
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
    huntClubBbsExposeOptionLabel,
    huntClubBbsExposeTargets,
    iceChoiceLabelForSide,
    iceStrengthBonusFor,
    iceStrengthFor,
    icebreakerEncounterStrengthBonus,
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
    isCorpInstallableCardType,
    isInstalledCorpCardAdvanceable,
    isRegionUpgrade,
    isUniqueCard,
    isV097OrLater,
    isV099OrLater,
    isVersionAtLeast,
    isVisibleVirusCounterCardForRunner,
    krumzTraceBitCardIds,
    krumzTraceBitTotal,
    leavePlayCleanupImplementationsForCard,
    legalActionHostComposition,
    mainActionHostComposition,
    mergeRunnerDrawSummary,
    microtechBackupDriveIds,
    microtechTrodeSetBreakAdditionalCost,
    movableAdvancementSourceIds,
    moveAdvancementOptions,
    mustInstallInsideSubsidiaryDataFort,
    newsgroupTauntingRunStartTax,
    normalizeSubtypeLabel,
    openPostMeatDamageReactionWindow,
    openRunnerCostPenaltySupportWindow,
    outermostIceExposures,
    outermostIceIndex,
    parseAdvancementDistributionValue,
    parseCodeViralCachePreserveOption,
    parsePlayfulAiChoiceSource,
    parsePlayfulAiSplit,
    parseRunnerInstalledConnectionTrashBadPublicityChoiceSource,
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
    poxCountersForServer,
    poxInstallTax,
    preventOneVirusCounterWithDisinfectant,
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
    randomCorpHqCardsWithoutReplacement,
    randomCorpHqDiscard,
    refreshRecurringCredits,
    relativeDamageSubroutineForCurrentEncounter,
    relativeIceStrengthBonusFor,
    relativeTraceSubroutinesForCurrentEncounter,
    removeAcmeSavingsAndLoanObligation,
    requireRunnerTagged,
    requiresDataFortInstallTarget,
    resolveAcmeSavingsAndLoanEndOfCorpTurn,
    resolveAgendaCounterOperation,
    resolveAnonymousTipDerezBlackIceChoice,
    resolveBizarreEncryptionDelayedAgendas,
    resolveCardImplementationAccessPaymentChoice,
    resolveCardImplementationAdvancementDistributionChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveChimeraDaemonTrashChoice,
    resolveCodeViralCachePurgeChoice,
    resolveCoreCommandJettisonIceChoice,
    resolveCorpInstalledEconomyAction,
    resolveCrashEverettDrawChoice,
    resolveDealWithMilitech,
    resolveDiscardChoice,
    resolveExposeInstalledCorpCardsChoice,
    resolveFieldReporterEndOfRunnerTurn,
    resolveForgedActivationOrdersCorpChoice,
    resolveForgedActivationOrdersTargetChoice,
    resolveHuntClubBbsExposeChoice,
    resolveIncubatorTransformChoice,
    resolveInvestmentFirmCreditChoice,
    resolveManagementShakeUpOperation,
    resolveMitWestTier,
    resolveMultiBreakSubroutinesAction,
    resolveOmniscienceFoundationEndTurnTag,
    resolveOpenEndedMileageProgramReturnChoice,
    resolveP358HiddenReplacementChoice,
    resolvePlayfulAiDiceLoopEvent,
    resolvePostMeatDamageHiddenResourceChoice,
    resolvePostOnPlayGenericFollowups,
    resolvePowerGridOverloadChoice,
    resolvePowerGridOverloadOperation,
    resolvePreyingMantisEndOfRunnerTurnDamage,
    resolveProteusRunnerProgramReturnChoice,
    resolveRunnerHostingChoice,
    resolveRunnerInstalledConnectionTrashBadPublicityChoice,
    resolveRunnerLastTurnInstalledResourceTargetId,
    resolveRunnerPrivateLookChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
    resolveRunnerTargetedEventImplementation,
    resolveSecurityCodeWormChipTrashIceChoice,
    resolveSetupMulliganChoice,
    resolveSneakPreviewTemporaryInstallReturns,
    resolveSystematicLayoffsAdvancementChoice,
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
    rezCardHost,
    rezzedBlackIceIds,
    rezzedCorpRootCardIds,
    rezzedIceOutsideThisIceCount,
    rezzedInstalledIceIds,
    rezzedInvestmentFirmIds,
    rootInstallRezzesOnInstall,
    runAccessLegalActionHostComposition,
    runBreakSubroutineAdditionalCost,
    runCardImplementationActionHost,
    runFlow,
    runFortTriggerExecutionHost,
    runRemainderStrengthBonusForBreaker,
    runStartTaxForServerUpgrades,
    runnerActionsPerTurn,
    runnerCanPayInstallCost,
    runnerCostPenaltySupportCreditCapacity,
    runnerDrawActionContext,
    runnerDrawSummaryPublicPayload,
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
    runnerTracePaymentDeps,
    runnerTrashedNodeLastTurn,
    sanitizeId,
    scoredAgendaAbilityHost,
    scoredAgendaFlowHost,
    scoredAgendaImplementationForDefinition,
    scoredAgendaImplementationForDefinitionId,
    scoredAgendaKindForDefinition,
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
    spendKrumzTraceBits,
    spendRunnerAccessTrashCredits,
    spendRunnerInstallCredits,
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
    startIncubatorTransformChoice,
    startInvestmentFirmCreditChoice,
    startOpenEndedMileageProgramReturnChoice,
    startPowerGridOverloadChoice,
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
    traceOrchestrationHost,
    traceRuntimeDepsHost,
    trashCorpInstalledCardToArchives,
    trashCorpInstalledCardsInScoredSourceServer,
    trashFaceupRdCardsForCascade,
    trashOlderRegionUpgradesInServer,
    trashPowerGridOverloadHardware,
    trashRunnerInstalledCardToHeap,
    trashRunnerInstalledProgram,
    triggerAbilityExecutionHost,
    turnBasicExecutionHost,
    unrezzedInstalledIceIds,
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
    withoutVariableIceState
  } = deps;

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

function continueRun(state: GameState, legalAction?: LegalAction): void {
  runFlow.continueRun(state, legalAction);
}

function addCurrentRunAccessCount(
  state: GameState,
  server: Extract<ServerId, "hq" | "rd">,
  amount: number,
): { publicPayload: Record<string, string | number | boolean> } {
  const run = state.run;
  if (!run || run.phase === "access")
    throw new Error("Zusaetzlicher Access ist nur vor dem Access-Fenster moeglich.");
  if (run.attackedServerId !== server)
    throw new Error("Diese Access-Faehigkeit passt nicht zum aktuellen Server.");
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error("Die Access-Anzahl ist ungueltig.");
  run.accessCount = Math.max(0, Math.floor(run.accessCount ?? 1)) + amount;
  return {
    publicPayload: {
      hiddenZoneBarrier: true,
      hiddenResourceAccessBonus: true,
      accessedServerId: server,
      additionalAccessCount: amount,
      runAccessCountAfter: run.accessCount,
    },
  };
}

function passCurrentEncounteredIce(
  state: GameState,
  legalAction: LegalAction,
  subtypeRequired?: "ap",
): { publicPayload: Record<string, string | number | boolean> } {
  const run = state.run;
  if (
    state.timingPoint !== "run.encounter_ice" ||
    run?.phase !== "encounter_ice" ||
    !run.encounteredIceId
  )
    throw new Error("Es gibt keine aktuelle ICE-Encounter zum Passieren.");
  const iceDefinition = definitionFor(state, run.encounteredIceId);
  if (subtypeRequired && !cardHasSubtype(iceDefinition, subtypeRequired))
    throw new Error("Diese ICE hat nicht den benoetigten Subtyp.");
  const subroutines = subroutinesForCurrentEncounter(state, iceDefinition);
  for (let index = 0; index < subroutines.length; index += 1) {
    if (
      !run.brokenSubroutineIndexes.includes(index) &&
      !run.resolvedSubroutineIndexes.includes(index)
    ) {
      run.resolvedSubroutineIndexes.push(index);
    }
  }
  continueRun(state, legalAction);
  return {
    publicPayload: {
      passedEncounteredIce: true,
      passedIceDefinitionId: iceDefinition.id,
      skippedSubroutineCount: subroutines.length,
    },
  };
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

  return {
    canInstallCorpRootCardInServer,
    corpRootAgendaOrNodeCapacityInServer,
    corpRegionUpgradeIdsInServer,
    startRun,
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
    isAcmeSavingsAndLoanDefinition,
    isCitySurveillanceCard,
    isInvestmentFirmCard,
    isHackerTrackerCentralCard,
    applyRunnerTraceCounterRunStartEffects,
    applyAiBoonRunStart,
    continueRun,
    addCurrentRunAccessCount,
    passCurrentEncounteredIce,
    resolveBlinkBreakSubroutineAction,
    recordBartmossEncounterUsage,
    recordSnowballBreakUsage,
    icebreakerHasSpecial,
    hackerTrackerCardIds,
    hackerTrackerCounterType,
    hackerTrackerCounterTotal,
    spendHackerTrackerCounters,
    addHackerTrackerTraceCounters,
    rabbitTraceLimitReductionForIceTrace,
    archivesAccessRequiresDecisionOrEffect,
    runnerAccessActionHost,
    runnerEncounterActionHostForState,
    runMovementHostForState,
    runRezWindowHostForState,
    fortPassWindowHostForState,
    fortRunSideFamiliesHostForState,
    encounterEntryHostForState,
    successfulRunInterventionHost,
    encounterResolutionHostForState,
    encounterSpecialWindowHostForState,
    encounterPrintedEffectHostForState,
    encounterPrintedNonTraceHostForState,
    runEndCleanupHost,
    runnerBreakerActionExecutionHost,
    startRunActionExecutionHost,
    rezActionExecutionHost,
    breachStateHost,
    accessFlowHost,
    runAccessTransitionHost,
    accessEffectHandlerHost
  };
}
