import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { parseCanonicalCapabilityId } from "@netgrid/cards/engine";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
import { createActionRuntimeHosts } from "./action-runtime-hosts";
import { createCardRuntimeHosts } from "./card-runtime-hosts";
import { createFlowRuntimeHosts } from "./flow-runtime-hosts";
import { createStateRuntimeServices } from "./state-runtime-services";
import {
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
  type AbilityPayloadDiscriminatorField,
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
  fixedPlayCostCredits,
  playCostForDefinition,
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
import { eligibleInstalledRunnerHardwareIds } from "../state/installed-runner-hardware";
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
import { buildRunnerHostedProgramInstallAction } from "../turn/runner-hosted-install-actions";
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
  recordFortBoundBreakerUsage,
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
import { scoreConversionCapabilityPayloadForEffects } from "../../ability-engine/card-implementation-runtime-activated-targets";
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
import { TAG_HANDSIZE_ASSET_SOURCE } from "../../mechanics/global-modifiers";
import { COUNTER_UPGRADE_SOURCES } from "../../mechanics/hosting-counters";
import {
  corpInstalledEconomyActionPayload,
  corpInstalledEconomyActionProfileForDefinition,
  corpInstalledEconomyActionProfileForPayload,
  type EconomyActionProfile,
} from "../../mechanics/payment-costs";
import { isP358HiddenReplacementCompatibilityChoiceSource } from "../../compatibility/payload-compatibility";
import {
  BOARDWALK_RANDOM_PROGRAM_SOURCE,
  RANDOM_RESOURCE_SOURCE,
} from "../../mechanics/random-effects";
import { RUN_TAX_UPGRADE_SOURCES } from "../../mechanics/trace-tags";
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
import type { CorpAgendaPointCostResult, RuntimeDeps } from "./runtime-shared";

export function createCorpRuntimeResolvers(
  deps: RuntimeDeps,
  turnCorpRuntime:
    | import("./turn-corp-runtime-port").TurnCorpRuntimePort
    | undefined = deps.turnCorpRuntime,
): import("./corp-runtime-port").CorpRuntimePort {
  if (!turnCorpRuntime)
    throw new Error("Turn-Corp-Runtime muss vor den Corp-Resolvern bestehen.");
  const {
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
  } = turnCorpRuntime;

  function forfeitRunnerAgendaForPointCost(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    if (!cardId || !state.runner.scoreArea.includes(cardId))
      throw new Error(
        "Der Runner kann mit dieser Agenda keine Kosten bezahlen.",
      );
    if (deps.agendaPointsForScoredCard(state, cardId) < 1)
      throw new Error(
        "Die gewaehlte Runner-Agenda liefert keinen Agenda-Punkt fuer Kosten.",
      );
    deps.spendAgendaPointFromScoredCard(state, cardId);
  }

  function forfeitCorpAgendaForPointCost(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    if (!cardId || !state.corp.scoreArea.includes(cardId))
      throw new Error("Die Korp kann mit dieser Agenda keine Kosten bezahlen.");
    if (deps.agendaPointsForScoredCard(state, cardId) < 1)
      throw new Error(
        "Die gewaehlte Korp-Agenda liefert keinen Agenda-Punkt fuer Kosten.",
      );
    deps.spendAgendaPointFromScoredCard(state, cardId);
  }

  function activeObligationCount(state: GameState): number {
    return Math.max(0, Math.floor(state.activeObligationDebtCount ?? 0));
  }

  function addActiveObligation(state: GameState, amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("ACME-Verpflichtungsmenge ist ungueltig.");
    state.activeObligationDebtCount = activeObligationCount(state) + amount;
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
    if (deps.corpAgendaPointTotal(state) < requiredPoints)
      throw new Error("Die Korp hat nicht genug Agenda-Punkte.");
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
    const spentAgendaIds: CardInstanceId[] = [];
    const spentAgendaDefinitionIds: CardDefinitionId[] = [];
    if (remaining > 0) {
      for (const agendaId of corpScoredAgendaForfeitTargets(state)) {
        const points = deps.agendaPointsForScoredCard(state, agendaId);
        const spentFromAgenda = Math.min(points, remaining);
        if (spentFromAgenda <= 0) continue;
        spentAgendaIds.push(agendaId);
        spentAgendaDefinitionIds.push(definitionFor(state, agendaId).id);
        for (let index = 0; index < spentFromAgenda; index += 1) {
          deps.spendAgendaPointFromScoredCard(state, agendaId);
        }
        paidPoints += spentFromAgenda;
        remaining -= spentFromAgenda;
        if (remaining <= 0) break;
      }
    }
    if (paidPoints < requiredPoints)
      throw new Error("Die Korp hat nicht genug Agenda-Punkte.");
    return {
      paidPoints,
      bonusPointsSpent,
      spentAgendaIds,
      spentAgendaDefinitionIds,
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
            deps.effectiveAgendaDifficultyDeps,
            state,
            left,
          ) - mustInstance(state.cardInstances, left).advancementCounters,
        );
        const rightRemaining = Math.max(
          0,
          effectiveAgendaDifficulty(
            deps.effectiveAgendaDifficultyDeps,
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
          deps.agendaPointsForScoredCard(state, left) -
          deps.agendaPointsForScoredCard(state, right);
        return byPoints !== 0 ? byPoints : left.localeCompare(right);
      })
      .filter((cardId) => deps.agendaPointsForScoredCard(state, cardId) >= 1);
  }

  function hardwareTrashByCounterEligibleHardwareIds(
    state: GameState,
  ): CardInstanceId[] {
    return eligibleInstalledRunnerHardwareIds(state, "cybernetics");
  }

  function hardwareTrashByCounterLegalActions(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): LegalAction[] {
    const playCost = playCostForDefinition(definition);
    if (playCost.kind !== "variable_x")
      throw new Error(
        "Hardware-Trash-by-Counter braucht variable X-Play-Kosten.",
      );
    const eligibleHardwareIds =
      hardwareTrashByCounterEligibleHardwareIds(state);
    const maxTrashCount = Math.min(
      eligibleHardwareIds.length,
      Math.floor(state.corp.credits / playCost.creditsPerX),
    );
    const actions: LegalAction[] = [];
    for (
      let trashCount = playCost.minimumX;
      trashCount <= maxTrashCount;
      trashCount += 1
    ) {
      actions.push(
        action(
          state,
          "corp",
          "play_operation",
          `${definition.title}: ${trashCount} Hardware trashen`,
          cardId,
          [{ clicks: 1, credits: trashCount * playCost.creditsPerX }],
          {
            cardId,
            hardwareTrashByCounterTrashCount: trashCount,
            eligibleHardwareCount: eligibleHardwareIds.length,
            xValue: trashCount,
            xMinimum: playCost.minimumX,
            xMaximum: maxTrashCount,
            xUpperBound: maxTrashCount,
            xCreditsPerUnit: playCost.creditsPerX,
            variableCostKind: "printed_play_cost",
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
      legalAction.payload?.hardwareTrashByCounterTrashCount,
    );
    if (!Number.isInteger(trashCount) || trashCount < 0)
      throw new Error(
        "Hardware-Trash-by-Counter braucht eine gueltige X-Auswahl.",
      );
    return trashCount;
  }

  function resolveHardwareTrashByCounterOperation(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const trashCount = hardwareTrashByCounterTrashCountFromPayload(legalAction);
    const eligibleHardwareIds =
      hardwareTrashByCounterEligibleHardwareIds(state);
    const cardId = String(legalAction.payload?.cardId) as CardInstanceId;
    const definition = definitionFor(state, cardId);
    const playCost = playCostForDefinition(definition);
    if (playCost.kind !== "variable_x")
      throw new Error(
        "Hardware-Trash-by-Counter braucht variable X-Play-Kosten.",
      );
    const paidCredits = Number(legalAction.costs[0]?.credits);
    const creditsBeforePlay = state.corp.credits + paidCredits;
    const currentMaximum = Math.min(
      eligibleHardwareIds.length,
      Math.floor(creditsBeforePlay / playCost.creditsPerX),
    );
    if (
      !Number.isInteger(paidCredits) ||
      trashCount < playCost.minimumX ||
      paidCredits !== trashCount * playCost.creditsPerX ||
      Number(legalAction.payload?.xValue) !== trashCount ||
      Number(legalAction.payload?.xMinimum) !== playCost.minimumX ||
      Number(legalAction.payload?.xMaximum) !== currentMaximum ||
      Number(legalAction.payload?.xUpperBound) !== currentMaximum ||
      Number(legalAction.payload?.xCreditsPerUnit) !== playCost.creditsPerX ||
      legalAction.payload?.variableCostKind !== "printed_play_cost"
    )
      throw new Error(
        "Hardware-Trash-by-Counter hat keinen gueltigen X-Kostenvertrag.",
      );
    if (eligibleHardwareIds.length < trashCount)
      throw new Error(
        "Hardware-Trash-by-Counter findet nicht genug nicht-Cybernetics-Hardware.",
      );
    if (trashCount === 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hardwareTrashByCounterTrashCount: 0,
        trashedHardwareCount: 0,
      };
      return;
    }
    startRunnerInstalledMultiTrashChoice(
      state,
      legalAction,
      {
        effectKind: "installed_hardware_trash_by_counter",
        targetCardType: "hardware",
        minimumTargets: trashCount,
        maximumTargets: trashCount,
        selectionOrdering: "ordered",
        excludesSubtype: "cybernetics",
      },
      eligibleHardwareIds,
    );
  }

  function resolveTaggedRunnerResourceMultiTrashOperation(
    state: GameState,
    legalAction: LegalAction,
    minimumTargets: number,
    maximumTargets: number,
    selectionOrdering: "ordered" | "unordered",
  ): void {
    const resourceIds = state.runner.rig.resources.slice();
    const boundedMaximum = Math.min(maximumTargets, resourceIds.length);
    if (boundedMaximum === 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runnerInstalledMultiTrashTargetCount: 0,
        trashedResourceCount: 0,
      };
      return;
    }
    startRunnerInstalledMultiTrashChoice(
      state,
      legalAction,
      {
        effectKind: "trash_runner_resources_if_tagged",
        targetCardType: "resource",
        minimumTargets: Math.min(minimumTargets, boundedMaximum),
        maximumTargets: boundedMaximum,
        selectionOrdering,
      },
      resourceIds,
    );
  }

  function startRunnerInstalledMultiTrashChoice(
    state: GameState,
    legalAction: LegalAction,
    input: {
      effectKind: NonNullable<
        GameState["pendingRunnerInstalledMultiTrash"]
      >["effectKind"];
      targetCardType: "resource" | "hardware" | "program";
      minimumTargets: number;
      maximumTargets: number;
      selectionOrdering: "ordered" | "unordered";
      excludesSubtype?: string;
    },
    eligibleCardIds: CardInstanceId[],
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    if (state.pendingRunnerInstalledMultiTrash)
      throw new Error("Es ist bereits ein Multi-Trash-Vertrag aktiv.");
    const sourceCardInstanceId = String(
      legalAction.payload?.cardId ?? legalAction.source ?? "",
    ) as CardInstanceId;
    const sourceDefinitionId = definitionFor(state, sourceCardInstanceId).id;
    const eligibleTargets = eligibleCardIds.map((cardId) => {
      const concealed =
        input.targetCardType === "resource" &&
        isConcealedRunnerResource(state, cardId);
      return {
        cardInstanceId: cardId,
        choiceValue: concealed ? hiddenRunnerResourceSlotId(cardId) : cardId,
      };
    });
    state.pendingRunnerInstalledMultiTrash = {
      sourceCardInstanceId,
      sourceDefinitionId,
      ...input,
      eligibleTargets,
    };
    state.pendingChoice = {
      choiceId: `runner_installed_multi_trash_${state.stateVersion + 1}`,
      side: "corp",
      source: "card_implementation.runner_installed_multi_trash",
      sourceCardInstanceId,
      sourceCardDefinitionId: sourceDefinitionId,
      prompt:
        input.effectKind === "trash_runner_resources_if_tagged"
          ? `Bis zu ${input.maximumTargets} Runner-Ressourcen trashen`
          : `${input.maximumTargets} ${input.targetCardType === "program" ? "Programme" : "Hardware"} in Trash-Reihenfolge auswählen`,
      kind: "select_cards",
      options: eligibleTargets.map(({ cardInstanceId, choiceValue }) => {
        const concealed = choiceValue !== cardInstanceId;
        const definition = definitionFor(state, cardInstanceId);
        return {
          id: `target_${choiceValue}`,
          label: concealed ? "Verdeckte Runner-Ressource" : definition.title,
          publicLabel: concealed
            ? "Verdeckte Runner-Ressource"
            : definition.title,
          value: choiceValue,
        };
      }),
      minSelections: input.minimumTargets,
      maxSelections: input.maximumTargets,
      selectionOrdering: input.selectionOrdering,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerInstalledMultiTrashChoiceOpened: true,
      runnerInstalledMultiTrashMinimumTargets: input.minimumTargets,
      runnerInstalledMultiTrashMaximumTargets: input.maximumTargets,
      runnerInstalledMultiTrashOrdering: input.selectionOrdering,
      ...(input.effectKind === "installed_hardware_trash_by_counter"
        ? {
            hardwareTrashByCounterChoiceOpened: true,
            eligibleHardwareCount: eligibleCardIds.length,
            hardwareTrashByCounterTrashCount: input.maximumTargets,
          }
        : { eligibleResourceCount: eligibleCardIds.length }),
    };
  }

  function resolveRunnerInstalledMultiTrashChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    const continuation = state.pendingRunnerInstalledMultiTrash;
    if (
      !choice ||
      choice.source !== "card_implementation.runner_installed_multi_trash" ||
      !continuation
    )
      throw new Error("Es ist keine Runner-Multi-Trash-Choice offen.");
    const selectedValues = deps.selectedChoiceCardIds(choice, playerAction);
    if (
      selectedValues.length < continuation.minimumTargets ||
      selectedValues.length > continuation.maximumTargets
    )
      throw new Error(
        "Die Runner-Multi-Trash-Choice hat eine ungueltige Zielanzahl.",
      );
    const targetByChoiceValue = new Map(
      continuation.eligibleTargets.map((target) => [
        target.choiceValue,
        target.cardInstanceId,
      ]),
    );
    const selectedIds = selectedValues.map((value) => {
      const cardId = targetByChoiceValue.get(value);
      if (!cardId)
        throw new Error("Ein Runner-Multi-Trash-Ziel ist nicht gebunden.");
      return cardId;
    });
    if (new Set(selectedIds).size !== selectedIds.length)
      throw new Error("Ein Runner-Multi-Trash-Ziel wurde doppelt gewählt.");
    if (
      continuation.effectKind === "installed_hardware_trash_by_counter" &&
      !continuation.excludesSubtype
    )
      throw new Error("Der Hardware-Multi-Trash braucht seine Subtypgrenze.");
    const currentLegalTargets = new Set(
      continuation.targetCardType === "hardware"
        ? continuation.excludesSubtype
          ? eligibleInstalledRunnerHardwareIds(
              state,
              continuation.excludesSubtype,
            )
          : state.runner.rig.hardware
        : continuation.targetCardType === "program"
          ? state.runner.rig.programs
          : state.runner.rig.resources,
    );
    for (const cardId of selectedIds) {
      if (!currentLegalTargets.has(cardId))
        throw new Error("Ein Runner-Multi-Trash-Ziel ist nicht mehr legal.");
    }
    delete state.pendingChoice;
    delete state.pendingRunnerInstalledMultiTrash;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId: continuation.sourceCardInstanceId,
      sourceDefinitionId: continuation.sourceDefinitionId,
    };
    trashRunnerInstalledCardsAsBatch(
      state,
      selectedIds,
      continuation.effectKind,
      legalAction,
    );
  }

  function trashRunnerInstalledCardsAsBatch(
    state: GameState,
    targetIds: CardInstanceId[],
    effectKind: NonNullable<
      GameState["pendingRunnerInstalledMultiTrash"]
    >["effectKind"],
    legalAction: LegalAction,
  ): void {
    const definitionIds = targetIds.map(
      (cardId) => definitionFor(state, cardId).id,
    );
    if (targetIds.length === 0) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runnerInstalledMultiTrashTargetCount: 0,
        ...(effectKind === "installed_hardware_trash_by_counter"
          ? { trashedHardwareCount: 0 }
          : effectKind === "access_hardware_trash_by_advancement"
            ? { trashedHardwareCount: 0 }
            : effectKind === "access_program_trash_by_advancement"
              ? { trashedProgramCount: 0 }
              : { trashedResourceCount: 0 }),
      };
      return;
    }
    if (
      openRunnerInstalledTrashPreventionWindow(
        state,
        legalAction,
        targetIds,
        effectKind,
        "ordered_batch",
      )
    )
      return;
    deps.trashRunnerInstalledCardsToHeapBatch(state, targetIds, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerInstalledMultiTrashTargetCount: targetIds.length,
      runnerInstalledMultiTrashOrdering: "ordered",
      ...(effectKind === "installed_hardware_trash_by_counter"
        ? {
            hardwareTrashByCounterTrashCount: targetIds.length,
            trashedHardwareCount: targetIds.length,
            trashedHardwareDefinitionIds: definitionIds.join(","),
          }
        : effectKind === "access_hardware_trash_by_advancement" ||
            effectKind === "access_program_trash_by_advancement"
          ? {
              hiddenZoneBarrier: true,
              hiddenZoneAction: "v1919_access_ambush_trash_installed",
              ambushDefinitionId: definitionFor(
                state,
                String(legalAction.payload?.cardId ?? "") as CardInstanceId,
              ).id,
              advancementCounterCount: Math.max(
                0,
                Math.floor(
                  mustInstance(
                    state.cardInstances,
                    String(legalAction.payload?.cardId ?? "") as CardInstanceId,
                  ).advancementCounters,
                ),
              ),
              targetTrashCount: targetIds.length,
              trashedCount: targetIds.length,
              ...(effectKind === "access_hardware_trash_by_advancement"
                ? { trashedHardwareCount: targetIds.length }
                : { trashedProgramCount: targetIds.length }),
              trashedCardType:
                effectKind === "access_hardware_trash_by_advancement"
                  ? "hardware"
                  : "program",
              trashedCardDefinitionId: definitionIds[0] ?? "",
              trashedCardDefinitionIds: definitionIds.join(","),
            }
          : {
              trashedResourceCount: targetIds.length,
              trashedResourceDefinitionIds: definitionIds.join(","),
            }),
    };
  }

  function advancementPlacementLegalActions(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): LegalAction[] {
    const scoreConversionPayload = scoreConversionCapabilityPayloadForEffects(
      onPlayCardImplementationEffects(definition),
    );
    return [
      action(
        state,
        "corp",
        "play_operation",
        `${definition.title} spielen`,
        cardId,
        [{ clicks: 1, credits: fixedPlayCostCredits(definition) }],
        { cardId, ...scoreConversionPayload },
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
    if (!COUNTER_OPERATION_SOURCES.has(sourceDefinitionId))
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
          id: `placement_${deps.sanitizeId(firstTargetId)}_${deps.sanitizeId(secondTargetId)}`,
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
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!state.cardInstances[sourceCardId])
      throw new Error(
        "Advancement-Placement braucht eine vorhandene Operationsquelle.",
      );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definitionFor(state, sourceCardId).id,
      v1919OperationAbility: "add_advancement_counters",
      targetCardId: firstTargetId,
      targetCardDefinitionId: definitionFor(state, firstTargetId).id,
      advancementCounterTargetCardIds: placementEntries
        .map(([targetId]) => targetId)
        .join(","),
      targetCardDefinitionIds: placementEntries
        .map(([targetId]) => definitionFor(state, targetId).id)
        .join(","),
      addedAdvancementCounters: 2,
      targetCount,
      advancementPlacementDistribution: placementEntries
        .map(([targetId, amount]) => `${deps.sanitizeId(targetId)}:${amount}`)
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
    sourceAbilityId: string,
    encounteredIceId?: CardInstanceId,
  ): Pick<LegalAction, "abilityRef" | "effectRef" | "targetRequirements"> {
    parseCanonicalCapabilityId(sourceAbilityId);
    return {
      abilityRef: { sourceCardInstanceId, sourceAbilityId },
      effectRef: `effect.${sourceAbilityId}`,
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
    const gain = credits(state, "corp", profile.creditGain, {
      kind: "card_effect",
      sourceDefinitionId: profile.sourceDefinitionId,
      sourceCardId,
      gainOrdinal: 1,
      reason: "corp_installed_economy_action",
    });
    if (profile.trashSource)
      deps.trashCorpInstalledCardToArchives(state, sourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: profile.sourceDefinitionId,
      gainedCredits: gain.creditedAmount,
      ...(profile.trashSource ? { selfTrashed: true } : {}),
      corpCreditsAfter: gain.creditsAfter,
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
    if (!deps.rezzedCorpRootCardIds(state).includes(sourceCardId))
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

  function rezzedCorpInstalledEconomyCreditSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return deps
      .rezzedCorpRootCardIds(state)
      .filter((cardId: CardInstanceId) =>
        deps.isCorpInstalledEconomyCreditSource(state, cardId),
      )
      .sort();
  }

  function shouldOpenCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
  ): boolean {
    const payloadEntries = Object.entries(legalAction.payload ?? {});
    const canonicalBasicCreditPayload =
      payloadEntries.length === 0 ||
      (legalAction.payload?.gainCreditsAmount === 1 &&
        (legalAction.payload?.effectKind === undefined ||
          legalAction.payload.effectKind === "gain_credits") &&
        payloadEntries.every(([key]) =>
          ["gainCreditsAmount", "effectKind"].includes(key),
        ));
    return (
      legalAction.side === "corp" &&
      legalAction.source === "basic_action" &&
      legalAction.type === "gain_credit" &&
      canonicalBasicCreditPayload &&
      rezzedCorpInstalledEconomyCreditSourceIds(state).length > 0
    );
  }

  function startCorpInstalledEconomyCreditChoice(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const economyCreditSourceIds =
      rezzedCorpInstalledEconomyCreditSourceIds(state);
    if (economyCreditSourceIds.length === 0)
      throw new Error(
        "Es ist keine rezzed installierte Economy-Credit-Quelle vorhanden.",
      );
    const sourceDefinitionId = definitionFor(
      state,
      economyCreditSourceIds[0]!,
    ).id;
    state.pendingChoice = {
      choiceId: `corp_installed_economy_credit_choice_${state.stateVersion + 1}`,
      side: "corp",
      source: `corp_installed_economy.credit_choice:${state.stateVersion + 1}`,
      prompt: "Credit nehmen oder 2 Credits auf eine Economy-Quelle legen?",
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
    if (
      !choice ||
      !choice.source.startsWith("corp_installed_economy.credit_choice")
    )
      throw new Error("Es ist keine Economy-Credit-Choice offen.");
    if (choice.side !== "corp" || legalAction.side !== "corp")
      throw new Error("Nur die Korp darf diese Economy-Credit-Choice nutzen.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    if (selected === "take_credit") {
      const sourceCardId = rezzedCorpInstalledEconomyCreditSourceIds(state)[0]!;
      const sourceDefinitionId = definitionFor(state, sourceCardId).id;
      const gain = credits(state, "corp", 1, {
        kind: "card_effect",
        sourceDefinitionId,
        sourceCardId,
        gainOrdinal: 1,
        reason: "corp_installed_economy_credit_choice",
      });
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        choiceVisibility: "public",
        sourceDefinitionId,
        gainCreditsAmount: 1,
        gainedCredits: gain.creditedAmount,
        corpCreditsAfter: gain.creditsAfter,
      };
      return;
    }
    const selectedOption = choice.options.find(
      (option) => option.id === selected,
    );
    const sourceCardId = String(selectedOption?.value ?? "");
    if (
      !rezzedCorpInstalledEconomyCreditSourceIds(state).includes(sourceCardId)
    )
      throw new Error(
        "Die gewaehlte Economy-Credit-Quelle ist nicht mehr legal.",
      );
    const counterPayload = deps.addVisibleCardCounter(
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
    resolveTaggedRunnerResourceMultiTrashOperation,
    startRunnerInstalledMultiTrashChoice,
    resolveRunnerInstalledMultiTrashChoice,
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
