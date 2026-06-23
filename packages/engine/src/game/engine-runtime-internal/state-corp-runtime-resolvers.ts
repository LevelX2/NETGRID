// @ts-nocheck
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createStateRuntimeServices } from "./state-runtime-services";
import { createCardRuntimeResolvers } from "./card-runtime-resolvers";
import { createChoiceHiddenZoneResolvers } from "./choice-hidden-zone-resolvers";
import { createCorpRuntimeResolvers } from "./corp-runtime-resolvers";
import { createStateRuntimeResolvers } from "./state-runtime-resolvers";
import { createTurnRuntimeResolvers } from "./turn-runtime-resolvers";
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

export function createStateCorpRuntimeResolvers(deps: RuntimeDeps) {
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
    acmeSavingsAndLoanObligationCount,
    activatedCardImplementationExecutionHost,
    activeCrashEverettSourceId,
    addAcmeSavingsAndLoanObligation,
    addCounterToAllInstalledRunnerIcebreakers,
    addCurrentRunAccessCount,
    addHackerTrackerTraceCounters,
    addRunnerFutureActionDebt,
    addVirusCounterWithCounterPrevention,
    addVisibleCardCounter,
    advanceableInstalledCardTargets,
    advancementDistributionOptions,
    affordableRezzedInstalledIceIdsForRunner,
    agendaPoints,
    agendaPointsForScoredCard,
    appendRegionReplacementTrashEffect,
    appendResolvedEffectsToPayload,
    applyActionHostComposition,
    applyAiBoonRunStart,
    applyCorpStartOfTurnEffects,
    applyEffectCommands,
    applyPurgeableRunnerVirusCorpStartEffects,
    applyStartTurnRandomEffectTables,
    applyRunnerDrawSummaryPayload,
    applyRunnerForgoNextAction,
    applyRunnerStartOfTurnEffects,
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
    continueRun,
    continueV1921PlayfulAiLoop,
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
    removeAcmeSavingsAndLoanObligation,
    requireRunnerTagged,
    requiresDataFortInstallTarget,
    resolveAcmeSavingsAndLoanEndOfCorpTurn,
    resolveAgendaCounterOperation,
    resolveAnonymousTipDerezBlackIceChoice,
    resolveDelayedAccessEffects,
    resolveBlinkBreakSubroutineAction,
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
    resolveEndTurnTagIfRunnerReceivedTag,
    resolveOpenEndedMileageProgramReturnChoice,
    resolveP358HiddenReplacementChoice,
    resolvePlayfulAiDiceLoopEvent,
    resolvePostMeatDamageHiddenResourceChoice,
    resolvePostOnPlayGenericFollowups,
    resolvePowerGridOverloadChoice,
    resolvePowerGridOverloadOperation,
    resolveDelayedEndTurnDamageEffects,
    resolveRunnerProgramReturnChoice,
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
    rezActionExecutionHost,
    rezCardHost,
    rezzedBlackIceIds,
    rezzedCorpRootCardIds,
    rezzedIceOutsideThisIceCount,
    rezzedInstalledIceIds,
    rezzedInvestmentFirmIds,
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
    startRun,
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
    successfulRunInterventionHost,
    systematicLayoffsLegalActions,
    systematicLayoffsPlacementOptions,
    takeSetupMulligan,
    totalCounters,
    traceCounterEffectDefinitionFor,
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
    uniqueDirectLongtailImplementationForCard,
    uniqueDirectLongtailImplementationForDefinition,
    uniqueDirectLongtailKindForCard,
    uniqueDirectLongtailKindForDefinition,
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

function spendRecurringTraceCreditPool(state: GameState, amount: number): number {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Recurring-Trace-Credit-Ausgabe ist ungueltig.");
  let remaining = amount;
  let spent = 0;
  for (const cardId of recurringTraceCreditPoolSourceIds(state)) {
    if (remaining <= 0) break;
    const current = cardCounter(state, cardId, "bit");
    const spend = Math.min(current, remaining);
    spendCardCounter(state, cardId, "bit", spend);
    remaining -= spend;
    spent += spend;
  }
  if (remaining > 0)
    throw new Error("Der Recurring-Trace-Credit-Pool reicht nicht aus.");
  return spent;
}

  return {
    serverDifficultyIncreaseFromFaitAccompli,
    serverDifficultyReductionFromUpgrades,
    swapCorpHqAndRdTop,
    spendRecurringTraceCreditPool
  };
}
