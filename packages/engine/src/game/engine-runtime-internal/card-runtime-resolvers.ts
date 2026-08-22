import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { engineCardByDefinitionId } from "@netgrid/cards/engine";
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
import { creditGainPublicPayload } from "../economy/credit-gain";
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
  startSearchStackToGripActivation,
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
import { isPrintedCostOnPlayAbility } from "../../ability-engine/card-implementation-runtime-shared";
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
  RunnerDrawSummary,
  RunnerEventResolver,
  RuntimeDeps,
} from "./runtime-shared";
import { runnerProgramInstallMemoryReachable } from "../install/runner-program-install-memory";

export function createCardRuntimeResolvers(
  deps: RuntimeDeps,
): import("./card-runtime-resolver-port").CardRuntimeResolverPort {
  function openPostMeatDamageReactionWindow(
    state: GameState,
    summary: DamageSummary,
  ): boolean {
    if (
      summary.damageType !== "meat" ||
      summary.cardsTrashed <= 0 ||
      state.winner ||
      state.pendingChoice
    )
      return false;
    const candidates = postMeatDamageHiddenResourceCandidates(state);
    if (candidates.length === 0) return false;
    state.pendingChoice = {
      choiceId: `hidden_resource_post_meat_damage_${state.stateVersion + 1}`,
      side: "runner",
      source: `hidden_resource.post_meat_damage:${summary.cardsTrashed}`,
      prompt: "Hidden Resource nach Meat Damage nutzen",
      kind: "select_option",
      options: [
        { id: "pass", label: "Keine Hidden Resource nutzen" },
        ...candidates.map((candidate) => ({
          id: `post_meat_damage_${candidate.cardId}`,
          label: `${candidate.title}: Korp wirft ${candidate.amount} HQ-Karten ab`,
          publicLabel: "Hidden Resource",
          value: candidate.cardId,
        })),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    state.activeSide = "runner";
    return true;
  }

  function postMeatDamageHiddenResourceCandidates(state: GameState): Array<{
    cardId: CardInstanceId;
    definitionId: CardDefinitionId;
    title: string;
    amount: number;
  }> {
    return state.runner.rig.resources
      .slice()
      .sort()
      .flatMap((cardId) => {
        const instance = state.cardInstances[cardId];
        if (!instance) return [];
        const definition = definitionFor(state, cardId);
        const implementation = deps.runnerUtilityLongtailImplementationForCard(
          state,
          cardId,
        );
        if (
          implementation?.kind !==
          "hidden_resource_post_meat_damage_random_hq_discard"
        )
          return [];
        if (implementation.cost.kind !== "trash_source") return [];
        const amount = Math.max(0, Math.floor(implementation.amount));
        if (amount <= 0) return [];
        return [
          {
            cardId,
            definitionId: definition.id,
            title: definition.title,
            amount,
          },
        ];
      });
  }

  function resolvePostMeatDamageHiddenResourceChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("hidden_resource.post_meat_damage")
    )
      throw new Error("Es ist kein Hidden-Resource-Meat-Damage-Fenster offen.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    if (selected === "pass") {
      delete state.pendingChoice;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenResourcePostMeatDamageDecision: "pass",
      };
      return;
    }
    const option = choice.options.find(
      (candidate) => candidate.id === selected,
    );
    const sourceCardId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    const candidate = postMeatDamageHiddenResourceCandidates(state).find(
      (item) => item.cardId === sourceCardId,
    );
    if (!candidate)
      throw new Error("Diese Hidden-Resource-Reaktion ist nicht legal.");
    const revealPayload = hiddenRunnerResourceRevealPayload(
      state,
      candidate.cardId,
    );
    deps.trashRunnerInstalledCardToHeap(state, candidate.cardId, legalAction);
    const discardedIds = randomCorpHqDiscard(
      state,
      candidate.amount,
      `hidden_resource.post_meat_damage.${candidate.definitionId}.${choice.choiceId}`,
    );
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenResourcePostMeatDamageDecision: "apply",
      sourceDefinitionId: candidate.definitionId,
      ...revealPayload,
      sourceTrashed: true,
      trashedCardDefinitionId: candidate.definitionId,
      discardedHqCount: discardedIds.length,
      corpHqAfter: state.corp.hq.length,
      randomCounterAfter: state.randomCounter,
    };
  }

  function randomCorpHqDiscard(
    state: GameState,
    amount: number,
    purposePrefix: string,
  ): CardInstanceId[] {
    const discarded: CardInstanceId[] = [];
    const discardCount = Math.min(
      Math.max(0, Math.floor(amount)),
      state.corp.hq.length,
    );
    for (let index = 0; index < discardCount; index += 1) {
      const value = nextRandom(state, `${purposePrefix}:selection:${index}`);
      const selectedIndex = Math.floor(value * state.corp.hq.length);
      const cardId = mustArrayValue(
        state.corp.hq,
        selectedIndex,
        "HQ-Discard-Auswahl fehlt.",
      );
      removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        rezzed: true,
        zone: { side: "corp", zone: "archives" },
      };
      discarded.push(cardId);
    }
    return discarded;
  }

  function installTargetBindingForDefinition(definition: CardDefinition) {
    return cardImplementationForDefinitionId(definition.id)
      ?.installTargetBinding;
  }

  function requiresDataFortInstallTarget(definition: CardDefinition): boolean {
    return (
      installTargetBindingForDefinition(definition)?.kind ===
      "choose_data_fort_on_install"
    );
  }

  function runnerEventLongtailForDefinition(
    definition: CardDefinition,
  ): CardRunnerEventLongtailImplementation | undefined {
    return cardImplementationForDefinitionId(definition.id)
      ?.runnerEventLongtail;
  }

  function variableRezForDefinition(
    definition: CardDefinition,
  ): CardVariableRezImplementation | undefined {
    return cardImplementationForDefinitionId(definition.id)?.variableRez;
  }

  function runnerEventLongtailKindForDefinition(
    definition: CardDefinition,
  ): CardRunnerEventLongtailImplementation["kind"] | undefined {
    return runnerEventLongtailForDefinition(definition)?.kind;
  }

  type GripInstallTemporaryCreditLongtail = Extract<
    CardRunnerEventLongtailImplementation,
    { kind: "grip_install_program_or_hardware_with_temporary_credits" }
  >;

  function pro018GripInstallCandidates(
    state: GameState,
    sourceCardId: CardInstanceId,
    longtail: GripInstallTemporaryCreditLongtail,
  ): CardInstanceId[] {
    const temporaryCredits = Math.max(
      0,
      Math.floor(longtail.temporaryCredits ?? 0),
    );
    return state.runner.grip.filter((cardId) => {
      if (cardId === sourceCardId) return false;
      const definition = definitionFor(state, cardId);
      if (definition.type !== "program" && definition.type !== "hardware")
        return false;
      if (!longtail.allowedTypes.includes(definition.type)) return false;
      if (
        deps.isUniqueCard(definition) &&
        deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
      )
        return false;
      if (definition.type === "program") {
        const trashableMemoryCosts = state.runner.rig.programs
          .filter((installedId) =>
            deps.runnerProgramUsesMemory(state, installedId),
          )
          .map(
            (installedId) => definitionFor(state, installedId).memoryCost ?? 0,
          );
        if (
          !runnerProgramInstallMemoryReachable({
            memoryUsed: state.runner.memoryUsed,
            targetMemoryCost: definition.memoryCost ?? 0,
            memoryLimit: runnerMemoryLimit(state),
            trashableMemoryCosts,
          })
        )
          return false;
      }
      return (
        state.runner.credits + temporaryCredits >= (definition.installCost ?? 0)
      );
    });
  }

  function startPro018GripInstallChoice(
    state: GameState,
    legalAction: LegalAction,
    definition: CardDefinition,
    longtail: GripInstallTemporaryCreditLongtail,
  ): void {
    const canonicalLongtail = engineCardByDefinitionId(definition.id)?.engine
      .runnerEventLongtail;
    if (
      canonicalLongtail?.kind !==
      "grip_install_program_or_hardware_with_temporary_credits"
    )
      throw new Error(
        "Die Runner-Event-Install-Choice besitzt keine eindeutige kanonische Capability.",
      );
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    const candidates = pro018GripInstallCandidates(
      state,
      sourceCardId,
      longtail,
    );
    if (candidates.length === 0)
      throw new Error(
        "Im Grip liegt keine legal installierbare Programm- oder Hardware-Karte.",
      );
    state.pendingChoice = {
      choiceId: `pro018_grip_install_temporary_credits_${state.stateVersion + 1}`,
      stateVersion: state.stateVersion + 1,
      side: "runner",
      source: `card_implementation.pro018_grip_install_temporary_credits:${sourceCardId}:${definition.id}:${longtail.temporaryCredits}:${state.stateVersion + 1}`,
      prompt: "Programm oder Hardware installieren",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      continuation: {
        family: "runner_grip_install_with_temporary_credits",
        originActionId: legalAction.actionId,
        sourceCardInstanceId: sourceCardId,
        sourceCardDefinitionId: definition.id,
        sourceCapabilityKey: canonicalLongtail.capabilityKey,
        temporaryCredits: longtail.temporaryCredits,
        allowedTypes: [...longtail.allowedTypes],
        createdAtStateVersion: state.stateVersion + 1,
      },
      options: state.runner.grip
        .filter((cardId) => cardId !== sourceCardId)
        .map((cardId) => {
          const candidateDefinition = definitionFor(state, cardId);
          return {
            id: `card_${cardId}`,
            label: candidateDefinition.title,
            value: cardId,
            ...(!candidates.includes(cardId) ? { selectable: false } : {}),
          };
        }),
      visibility: "hidden_info_barrier",
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "pro018_grip_install_temporary_credits",
      sourceDefinitionId: definition.id,
      choiceVisibility: "runner_private",
    };
  }

  function runnerEventInstallChoiceActionPayload(
    state: GameState,
    cardId: CardInstanceId,
    definition: CardDefinition,
  ): Record<string, unknown> | undefined {
    const longtail = runnerEventLongtailForDefinition(definition);
    const canonicalLongtail = engineCardByDefinitionId(definition.id)?.engine
      .runnerEventLongtail;
    if (
      longtail?.kind !==
        "grip_install_program_or_hardware_with_temporary_credits" ||
      canonicalLongtail?.kind !==
        "grip_install_program_or_hardware_with_temporary_credits"
    )
      return undefined;
    const selectableTargetIds = pro018GripInstallCandidates(
      state,
      cardId,
      longtail,
    );
    return {
      runnerEventInstallChoiceQuoteSchemaVersion:
        "runner-event-install-choice-quote-v1",
      runnerEventInstallChoiceQuoteComplete: true,
      runnerEventInstallChoiceQuoteSourceCapabilityKey:
        canonicalLongtail.capabilityKey,
      runnerEventInstallChoiceQuoteTemporaryCredits:
        canonicalLongtail.temporaryCredits,
      runnerEventInstallChoiceQuoteAllowedTypes:
        canonicalLongtail.allowedTypes.join(","),
      runnerEventInstallChoiceQuoteSelectableTargetIds:
        selectableTargetIds.join(","),
    };
  }

  function startPro018StackInstallRunCleanupChoice(
    state: GameState,
    legalAction: LegalAction,
    definition: CardDefinition,
  ): void {
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    const candidates = searchStackInstallTargets(
      deps.hiddenZoneSearchActivationTargetHost(state),
      "program",
      "free",
    );
    if (candidates.length === 0)
      throw new Error("Im Stack liegt kein legal installierbares Programm.");
    state.pendingChoice = {
      choiceId: `pro018_stack_install_run_cleanup_${state.stateVersion + 1}`,
      stateVersion: state.stateVersion + 1,
      side: "runner",
      source: `card_implementation.pro018_stack_install_run_cleanup:${sourceCardId}:${definition.id}:${String(legalAction.payload?.serverId ?? "hq")}:${state.stateVersion + 1}`,
      sourceCardInstanceId: sourceCardId,
      sourceCardDefinitionId: definition.id,
      prompt: "Programm aus dem Stack installieren",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      options: state.runner.stack.map((cardId) => {
        const candidateDefinition = definitionFor(state, cardId);
        return {
          id: `card_${cardId}`,
          label: candidateDefinition.title,
          value: cardId,
          ...(!candidates.includes(cardId) ? { selectable: false } : {}),
        };
      }),
      visibility: "hidden_info_barrier",
      cardSearchPresentation: {
        sourceZone: "stack",
        selectableFilter: "program",
        destination: "install_program",
        shuffleAfter: true,
        showNonMatchingCards: true,
        reveal: "hidden",
      },
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "pro018_stack_install_run_cleanup",
      sourceDefinitionId: definition.id,
      choiceVisibility: "runner_private",
    };
  }

  function hiddenReplacementLongtailForDefinition(
    definition: CardDefinition,
  ): CardHiddenReplacementLongtailImplementation | undefined {
    return cardImplementationForDefinitionId(definition.id)
      ?.hiddenReplacementLongtail;
  }

  function cardImplementationRunnerEventResolver(
    definition: CardDefinition,
  ): RunnerEventResolver | undefined {
    const longtail = runnerEventLongtailForDefinition(definition);
    if (longtail) {
      switch (longtail.kind) {
        case "random_dice_loop":
          return {
            name: "card_implementation_runner_event_random_dice_loop",
            resolve: (state, legalAction) =>
              deps.resolveRandomDiceLoopEvent(
                state,
                legalAction,
                definition.id,
                longtail,
              ),
          };
        case "three_dice_gain_credits":
          return {
            name: "card_implementation_runner_event_three_dice_gain_credits",
            resolve: (state, legalAction) =>
              resolveThreeDiceGainCreditsEvent(
                state,
                legalAction,
                definition.id,
              ),
          };
        case "trash_installed_runner_connections_then_add_bad_publicity":
          return {
            name: "card_implementation_runner_event_trash_installed_runner_connections_then_add_bad_publicity",
            canPlay: (state) =>
              deps.canPlayTrashInstalledRunnerConnectionsThenAddBadPublicity(
                state,
                longtail,
              ),
            resolve: (state, legalAction) =>
              deps.resolveTrashInstalledRunnerConnectionsThenAddBadPublicityEvent(
                state,
                legalAction,
                definition.id,
                longtail,
              ),
          };
        case "grip_install_program_or_hardware_with_temporary_credits":
          return {
            name: "card_implementation_runner_event_grip_install_program_or_hardware_with_temporary_credits",
            canPlay: (state) =>
              pro018GripInstallCandidates(state, "" as CardInstanceId, longtail)
                .length > 0,
            actionPayload: ({ state, cardId, definition: eventDefinition }) =>
              runnerEventInstallChoiceActionPayload(
                state,
                cardId,
                eventDefinition,
              ) ?? {},
            resolve: (state, legalAction) =>
              startPro018GripInstallChoice(
                state,
                legalAction,
                definition,
                longtail,
              ),
          };
        case "search_stack_install_program_free_then_run_return_or_penalty":
          return {
            name: "card_implementation_runner_event_search_stack_install_program_free_then_run_return_or_penalty",
            requiresServer: true,
            canPlay: (state) =>
              searchStackInstallTargets(
                deps.hiddenZoneSearchActivationTargetHost(state),
                "program",
                "free",
              ).length > 0,
            canPlayForServer: () => true,
            resolve: (state, legalAction) =>
              startPro018StackInstallRunCleanupChoice(
                state,
                legalAction,
                definition,
              ),
          };
        case "trash_grip_search_stack_to_grip_equal_count":
          return {
            name: "card_implementation_runner_event_trash_grip_search_stack_to_grip_equal_count",
            canPlay: (state) => state.runner.grip.length > 0,
            resolve: (state, legalAction) =>
              resolveTrashGripSearchStackToGripEvent(
                state,
                legalAction,
                definition.id,
              ),
          };
        case "runner_corruption_agenda_point_transfer":
          return {
            name: "card_implementation_runner_event_corruption_agenda_point_transfer",
            canPlay: canPlayRunnerCorruption,
            resolve: (state, legalAction) =>
              resolveRunnerCorruptionEvent(
                state,
                legalAction,
                definition.id,
                longtail,
              ),
          };
        case "do_the_drine_unpreventable_core_damage_for_credits":
          return {
            name: "card_implementation_runner_event_do_the_drine",
            canPlay: (state) => maxDoTheDrineDamage(state) > 0,
            legalActions: ({
              state,
              cardId,
              definition: eventDefinition,
              buildAction,
              clickCost,
              creditCost,
            }) => {
              const maxDamage = maxDoTheDrineDamage(state, cardId);
              const actions: LegalAction[] = [];
              for (let amount = 1; amount <= maxDamage; amount += 1) {
                actions.push(
                  buildAction(
                    state,
                    "runner",
                    "play_event",
                    `${eventDefinition.title}: ${amount} Core Damage`,
                    cardId,
                    [{ clicks: clickCost, credits: creditCost }],
                    {
                      cardId,
                      xValue: amount,
                      gainCreditsAmount:
                        amount *
                        Math.max(0, Math.floor(longtail.creditsPerDamage)),
                      damageCannotBePrevented: true,
                      damageType: "core",
                      damageAmount: amount,
                    },
                  ),
                );
              }
              return actions;
            },
            resolve: (state, legalAction) =>
              resolveDoTheDrineEvent(
                state,
                legalAction,
                definition.id,
                longtail,
              ),
          };
        case "library_search_run":
          return {
            name: "card_implementation_runner_event_library_search_run",
            requiresServer: true,
            startsRun: true,
            canPlayForServer: (_state, serverId) =>
              longtail.allowedServers.includes(
                serverId as Extract<ServerId, "hq" | "rd">,
              ),
            resolve: (state, legalAction) =>
              resolveLibrarySearchRunEvent(
                state,
                legalAction,
                definition,
                longtail,
              ),
          };
        default: {
          const unknown = longtail as { kind?: string };
          throw new Error(
            `Unsupported runner event longtail: ${unknown.kind ?? "unknown"}`,
          );
        }
      }
    }
    const hiddenLongtail = hiddenReplacementLongtailForDefinition(definition);
    if (hiddenLongtail?.kind === "successful_run_fort_ice_reorder") {
      return {
        name: "card_implementation_runner_event_successful_run_fort_ice_reorder",
        canPlay: (state) => hasSuccessfulRunThisTurn(state),
        resolve: (state, legalAction) => {
          if (!hasSuccessfulRunThisTurn(state))
            throw new Error(
              "Fortress Respecification benoetigt einen erfolgreichen Run in diesem Zug.",
            );
          startSuccessfulRunFortIceReorderChoice(
            deps.hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
            String(legalAction.payload?.cardId ?? ""),
          );
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            hiddenZoneBarrier: true,
            hiddenZoneAction: "successful_run_fort_ice_reorder",
          };
        },
      };
    }
    if (
      hiddenLongtail?.kind === "secret_spend_guess_then_targeted_bypass_run"
    ) {
      return {
        name: "card_implementation_runner_event_secret_spend_guess_then_targeted_bypass_run",
        canPlay: (state) =>
          state.runner.credits >=
          Math.max(0, Math.floor(definition.cost ?? 0)) + 2,
        resolve: (state, legalAction) => {
          if (state.runner.credits < 2)
            throw new Error(
              "Social Engineering benoetigt nach den Spielkosten mindestens 2 Credits.",
            );
          startSecretSpendGuessThenTargetedBypassRunHideChoice(
            deps.hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
            String(legalAction.payload?.cardId ?? ""),
          );
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            hiddenZoneBarrier: true,
            hiddenZoneAction: "secret_spend_guess_then_targeted_bypass_run",
            sourceDefinitionId: definition.id,
          };
        },
      };
    }
    return undefined;
  }

  function resolveTrashGripSearchStackToGripEvent(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
  ): void {
    const sourceCardId = runnerEventSourceCardId(state, legalAction);
    const trashedIds = state.runner.grip.slice();
    for (const cardId of trashedIds) {
      removeFromAllZones(state, cardId);
      state.runner.heap.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        zone: { side: "runner", zone: "heap" },
      };
    }
    const selectionCount = Math.min(
      trashedIds.length,
      state.runner.stack.length,
    );
    if (selectionCount > 0) {
      startSearchStackToGripActivation(
        deps.hiddenZoneSearchActivationHandlerHost(state, legalAction),
        {
          sourceCardId,
          sourceDefinitionId,
          filter: "any_card",
          revealToCorp: false,
          shuffleAfterwards: true,
          selectionCount,
        },
      );
    } else {
      deps.shuffleRunnerStack(
        state,
        `runner_event_trash_grip_search:${sourceDefinitionId}:empty_search`,
      );
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerEventAbility: "trash_grip_search_stack_to_grip_equal_count",
      sourceDefinitionId,
      cardId: sourceCardId,
      trashedCount: trashedIds.length,
      searchedCount: selectionCount,
      movedToGripCount: 0,
      stackShuffled: selectionCount === 0,
      hiddenZoneBarrier: true,
      randomCounterAfter: state.randomCounter,
      ...(selectionCount > 0 ? { choiceVisibility: "runner_private" } : {}),
    };
  }

  function canPlayRunnerCorruption(state: GameState): boolean {
    return runnerCorruptionAgendaIds(state).length > 0;
  }

  function runnerCorruptionAgendaIds(state: GameState): CardInstanceId[] {
    const stolenIds = new Set(
      state.runnerTurnFlags?.stolenAgendaIdsThisTurn ?? [],
    );
    return state.runner.scoreArea
      .filter((cardId) => stolenIds.has(cardId))
      .filter((cardId) => definitionFor(state, cardId).type === "agenda");
  }

  function resolveRunnerCorruptionEvent(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    longtail: Extract<
      CardRunnerEventLongtailImplementation,
      { kind: "runner_corruption_agenda_point_transfer" }
    >,
  ): void {
    const agendaIds = runnerCorruptionAgendaIds(state);
    if (agendaIds.length === 0)
      throw new Error("Corruption braucht in diesem Zug gestohlene Agenden.");
    let agendaPointsLost = 0;
    const agendaDefinitionIds: CardDefinitionId[] = [];
    for (const agendaId of agendaIds) {
      const agendaPointsFromCard = deps.agendaPointsForScoredCard(
        state,
        agendaId,
      );
      agendaPointsLost += agendaPointsFromCard;
      agendaDefinitionIds.push(definitionFor(state, agendaId).id);
      for (let index = 0; index < agendaPointsFromCard; index += 1) {
        deps.spendAgendaPointFromScoredCard(state, agendaId);
      }
    }
    state.corpBonusAgendaPoints =
      Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0)) +
      agendaPointsLost;
    const gainedCredits =
      agendaPointsLost *
      Math.max(0, Math.floor(longtail.creditsPerAgendaPoint));
    const gain = gainRunnerEventCredits(
      state,
      legalAction,
      sourceDefinitionId,
      gainedCredits,
    );
    const tagsBefore = state.runner.tags;
    if (longtail.tagRunner > 0)
      addRunnerTagsWithPrevention(
        state,
        legalAction,
        longtail.tagRunner,
        "classic_corruption",
      );
    if (state.runnerTurnFlags)
      state.runnerTurnFlags.stolenAgendaIdsThisTurn = (
        state.runnerTurnFlags.stolenAgendaIdsThisTurn ?? []
      ).filter((cardId) => !agendaIds.includes(cardId));
    const spentAgendaDefinitionIds = agendaDefinitionIds.sort().join(",");
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerEventAbility: "runner_corruption_agenda_point_transfer",
      sourceDefinitionId,
      corruptedAgendaCount: agendaIds.length,
      corruptedAgendaDefinitionIds: spentAgendaDefinitionIds,
      spentAgendaDefinitionIds,
      agendaPointsLost,
      corpBonusAgendaPointsAfter: state.corpBonusAgendaPoints,
      ...creditGainPublicPayload(gain),
      tagsAdded: Math.max(0, state.runner.tags - tagsBefore),
      runnerTagsAfter: state.runner.tags,
    };
  }

  function maxDoTheDrineDamage(
    state: GameState,
    sourceCardId?: CardInstanceId,
  ): number {
    const sourceInGrip =
      sourceCardId !== undefined && state.runner.grip.includes(sourceCardId)
        ? 1
        : 0;
    const gripAfterPlay = state.runner.grip.length - sourceInGrip;
    return Math.max(0, Math.min(gripAfterPlay, maxHandSize(state, "runner")));
  }

  function resolveDoTheDrineEvent(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    longtail: Extract<
      CardRunnerEventLongtailImplementation,
      { kind: "do_the_drine_unpreventable_core_damage_for_credits" }
    >,
  ): void {
    const amount = Number(legalAction.payload?.xValue ?? 0);
    const maxDamage = maxDoTheDrineDamage(state);
    if (!Number.isInteger(amount) || amount <= 0 || amount > maxDamage)
      throw new Error("Do the Drine-Damage ist nicht legal.");
    const summary = doDamage(state, {
      damageId: `runner_event.${sourceDefinitionId}.core.${state.stateVersion + 1}`,
      damageType: "core",
      amount,
      source: `runner_event:${sourceDefinitionId}`,
    });
    const gainedCredits =
      amount * Math.max(0, Math.floor(longtail.creditsPerDamage));
    const gain = gainRunnerEventCredits(
      state,
      legalAction,
      sourceDefinitionId,
      gainedCredits,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerEventAbility: "do_the_drine_unpreventable_core_damage_for_credits",
      sourceDefinitionId,
      xValue: amount,
      damageCannotBePrevented: true,
      damageType: summary.damageType,
      damageAmount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      coreDamageAfter: summary.coreDamageAfter ?? state.runner.coreDamage,
      ...(summary.runnerMaxHandSizeAfter !== undefined
        ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
        : {}),
      flatline: summary.flatline,
      ...creditGainPublicPayload(gain),
    };
  }

  function resolveLibrarySearchRunEvent(
    state: GameState,
    legalAction: LegalAction,
    definition: CardDefinition,
    longtail: Extract<
      CardRunnerEventLongtailImplementation,
      { kind: "library_search_run" }
    >,
  ): void {
    const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
      ServerId,
      "new_remote"
    >;
    if (
      !longtail.allowedServers.includes(
        serverId as Extract<ServerId, "hq" | "rd">,
      )
    )
      throw new Error("Library Search kann nur auf HQ oder R&D laufen.");
    const sourceCardId = runnerEventSourceCardId(state, legalAction);
    deps.startRun(
      state,
      serverId,
      undefined,
      1,
      {
        successfulRunSourceCardId: sourceCardId,
        successfulRunSourceDefinitionId: definition.id,
        successfulRunSourceTitle: definition.title,
        conditionalAccessBonus: {
          kind: longtail.condition,
          amount: longtail.accessBonus,
          sourceDefinitionId: definition.id,
        },
      },
      legalAction,
    );
  }

  function runnerEventSourceCardId(
    state: GameState,
    legalAction: LegalAction,
  ): CardInstanceId {
    const sourceCardId = String(
      legalAction.payload?.cardId ?? "",
    ) as CardInstanceId;
    if (!sourceCardId || !state.cardInstances[sourceCardId])
      throw new Error("Runner-Event braucht eine gueltige Quellenkarte.");
    return sourceCardId;
  }

  function resolveThreeDiceGainCreditsEvent(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
  ): void {
    const rolls = [0, 1, 2].map((index) =>
      rollDeterministicDie(
        state,
        `v1921.die.${sourceDefinitionId}.three_dice.${index + 1}`,
      ),
    );
    const gainedCredits = rolls.reduce((sum, roll) => sum + roll, 0);
    const gain = gainRunnerEventCredits(
      state,
      legalAction,
      sourceDefinitionId,
      gainedCredits,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1921RunnerEventAbility: "three_dice_gain_credits",
      sourceDefinitionId,
      randomDiceLoopRolls: rolls.join(","),
      randomDiceLoopRolledDice: rolls.length,
      randomDiceLoopComplete: true,
      ...creditGainPublicPayload(gain),
      randomCounterAfter: state.randomCounter,
    };
  }

  function gainRunnerEventCredits(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    amount: number,
  ) {
    const sourceCardId =
      typeof legalAction.payload?.cardId === "string"
        ? (legalAction.payload.cardId as CardInstanceId)
        : undefined;
    return credits(state, "runner", amount, {
      kind: "card_effect",
      sourceDefinitionId,
      ...(sourceCardId ? { sourceCardId } : {}),
      gainOrdinal: 1,
      reason: "runner_event_resolver",
    });
  }

  function printedCostCardImplementationMakeRunEffect(
    definition: CardDefinition,
  ): MakeRunEffectImplementation | undefined {
    const ability = cardImplementationForDefinitionId(
      definition.id,
    )?.abilities?.find(isPrintedCostOnPlayAbility);
    return ability?.effects.find(
      (effect): effect is MakeRunEffectImplementation =>
        effect.kind === "make_run",
    );
  }

  function scoredAgendaImplementationForDefinitionId(
    definitionId: CardDefinitionId,
  ): CardScoredAgendaImplementation | undefined {
    return cardImplementationForDefinitionId(definitionId)?.scoredAgenda;
  }

  function scoredAgendaImplementationForDefinition(
    definition: CardDefinition,
  ): CardScoredAgendaImplementation | undefined {
    return scoredAgendaImplementationForDefinitionId(definition.id);
  }

  function scoredAgendaKindForDefinition(
    definition: CardDefinition,
  ): CardScoredAgendaImplementation["kind"] | undefined {
    return scoredAgendaImplementationForDefinition(definition)?.kind;
  }

  function emptyRunnerDrawSummary(): RunnerDrawSummary {
    return {
      drawnCount: 0,
      drawnCardIds: [],
      drawTaxSourceCount: 0,
      drawTaxCreditsPaid: 0,
      drawTaxTagsAdded: 0,
    };
  }

  function mergeRunnerDrawSummary(
    left: RunnerDrawSummary,
    right: RunnerDrawSummary,
  ): RunnerDrawSummary {
    return {
      drawnCount: left.drawnCount + right.drawnCount,
      drawnCardIds: [
        ...(left.drawnCardIds ?? []),
        ...(right.drawnCardIds ?? []),
      ],
      drawTaxSourceCount: Math.max(
        left.drawTaxSourceCount,
        right.drawTaxSourceCount,
      ),
      drawTaxCreditsPaid: left.drawTaxCreditsPaid + right.drawTaxCreditsPaid,
      drawTaxTagsAdded: left.drawTaxTagsAdded + right.drawTaxTagsAdded,
      crashEverettChoiceOpened:
        left.crashEverettChoiceOpened === true ||
        right.crashEverettChoiceOpened === true,
      ...((left.crashEverettSourceCardId ?? right.crashEverettSourceCardId)
        ? {
            crashEverettSourceCardId:
              left.crashEverettSourceCardId ?? right.crashEverettSourceCardId,
          }
        : {}),
    };
  }

  function applyRunnerDrawSummaryPayload(
    state: GameState,
    legalAction: LegalAction,
    summary: RunnerDrawSummary,
  ): void {
    if (summary.drawnCount <= 0) return;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerDrawSummaryPublicPayload(state, summary),
    };
  }

  function runnerDrawSummaryPublicPayload(
    state: GameState,
    summary: RunnerDrawSummary,
  ): Record<string, string | number | boolean> {
    if (summary.drawnCount <= 0) return {};
    return {
      drawnCount: summary.drawnCount,
      ...(summary.crashEverettChoiceOpened && summary.crashEverettSourceCardId
        ? {
            drawReplacementSourceTitle: "Crash Everett, Inventive Fixer",
            drawReplacementExtraDrawn: 1,
            crashEverettChoiceOpened: true,
          }
        : {}),
      ...(summary.drawTaxSourceCount > 0
        ? {
            drawTaxSourceCount: summary.drawTaxSourceCount,
            drawTaxCreditsPaid: summary.drawTaxCreditsPaid,
            drawTaxTagsAdded: summary.drawTaxTagsAdded,
            drawTaxTags: summary.drawTaxTagsAdded,
            runnerCreditsAfter: state.runner.credits,
            runnerTagsAfter: state.runner.tags,
          }
        : {}),
    };
  }

  return {
    openPostMeatDamageReactionWindow,
    postMeatDamageHiddenResourceCandidates,
    resolvePostMeatDamageHiddenResourceChoice,
    randomCorpHqDiscard,
    installTargetBindingForDefinition,
    requiresDataFortInstallTarget,
    runnerEventLongtailForDefinition,
    variableRezForDefinition,
    runnerEventLongtailKindForDefinition,
    runnerEventInstallChoiceActionPayload,
    hiddenReplacementLongtailForDefinition,
    cardImplementationRunnerEventResolver,
    printedCostCardImplementationMakeRunEffect,
    scoredAgendaImplementationForDefinitionId,
    scoredAgendaImplementationForDefinition,
    scoredAgendaKindForDefinition,
    emptyRunnerDrawSummary,
    mergeRunnerDrawSummary,
    applyRunnerDrawSummaryPayload,
    runnerDrawSummaryPublicPayload,
  };
}
