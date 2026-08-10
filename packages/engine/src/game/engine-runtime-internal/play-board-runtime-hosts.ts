import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { createChoiceHiddenZoneRuntime } from "./choice-hidden-zone-runtime";
import { createLifecycleRuntime } from "./lifecycle-runtime";
import { createTurnCorpRuntime } from "./turn-corp-runtime";
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
  startCorpHqCardToRdChoice,
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
import type { RuntimeDeps } from "./runtime-shared";

export function createPlayBoardRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps = {} as RuntimeDeps,
): Pick<
  import("./action-runtime-port").ActionRuntimePort,
  | "playCardExecutionHost"
  | "corpOperationResolutionHost"
  | "boardStateActionExecutionHost"
> {
  function playCardExecutionHost(state: GameState): PlayCardExecutionHost {
    const operationHost = corpOperationResolutionHost(state);
    return {
      state,
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
      },
      payment: {
        spendClick: (side) => spendClick(state, side),
        spendCredits: (side, amount) => spendCredits(state, side, amount),
        spendRunnerEventCredits: (amount, legalAction) => {
          const requested = Math.max(0, Math.floor(amount));
          const restricted = spendRestrictedHostedCredits(
            state,
            "play_events",
            requested,
          );
          const normalCreditsSpent = Math.max(0, requested - restricted.spent);
          if (normalCreditsSpent > 0)
            spendCredits(state, "runner", normalCreditsSpent);
          if (legalAction) {
            legalAction.payload = {
              ...(legalAction.payload ?? {}),
              ...(restricted.spent > 0
                ? {
                    hostedCreditsSpent: restricted.spent,
                    hostedCreditSourceDefinitionIds:
                      restricted.sourceDefinitionIds.join(","),
                  }
                : {}),
              normalCreditsSpent,
              runnerCreditsAfter: state.runner.credits,
            };
          }
        },
      },
      events: {
        runnerEventResolver: (definition) =>
          deps.cardImplementationRunnerEventResolver(definition) ??
          deps.RUNNER_EVENT_RESOLVERS[definition.id],
      },
      operations: {
        canPlayCorpOperation: (definition) =>
          canPlayCorpOperation(operationHost, definition),
        resolveCorpOperation: (definition, legalAction) =>
          resolveCorpOperation(operationHost, definition, legalAction),
        resolveRunnerLastTurnInstalledResourceTargetId: (targetCardId) =>
          deps.resolveRunnerLastTurnInstalledResourceTargetId(
            state,
            targetCardId,
          ),
      },
      cardImplementation: {
        canPlayPrintedCostOnPlay: (definition) =>
          canPlayPrintedCostOnPlayImplementation(
            deps.cardImplementationRuntimeDeps,
            state,
            definition,
          ),
        executeOnPlayAbility: (legalAction, definition, cardId) =>
          executeOnPlayCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
          ),
        resolveRunnerTargetedEventImplementation: (definition, legalAction) =>
          deps.resolveRunnerTargetedEventImplementation(
            state,
            definition,
            legalAction,
          ),
        resolvePostOnPlayGenericFollowups: (definition, legalAction) =>
          deps.resolvePostOnPlayGenericFollowups(
            state,
            definition,
            legalAction,
          ),
        hasPrintedCostOnPlay: hasPrintedCostOnPlayCardImplementation,
        additionalOperationCost:
          onPlayCardImplementationAdditionalOperationCost,
        needsLastTurnResourceTarget:
          onPlayCardImplementationNeedsLastTurnResourceTarget,
      },
    };
  }

  function corpOperationResolutionHost(
    state: GameState,
  ): CorpOperationResolutionHost {
    return {
      state,
      actions: {
        buildLegalAction: action,
      },
      cards: {
        isCorpInstallableCardType: deps.isCorpInstallableCardType,
        unrezzedInstalledIceIds: () =>
          Object.entries(state.cardInstances)
            .filter(
              ([cardId, instance]: any) =>
                instance?.controller === "corp" &&
                instance.zone?.zone === "serverIce" &&
                instance.rezzed !== true &&
                definitionFor(state, cardId).type === "ice",
            )
            .map(([cardId]) => cardId),
        rezCostForCard: (cardId) => rezCostForCard(state, cardId),
      },
      corp: {
        drawCorpCards: (amount, continuation) =>
          drawCorpCards(state, amount, continuation),
        ensureTurnFlags: () => ensureCorpTurnFlags(state),
        runnerStoleAgendaLastTurn: () => deps.runnerStoleAgendaLastTurn(state),
        runnerStolenAgendaAdvancementCountersLastTurn: () =>
          deps.runnerStolenAgendaAdvancementCountersLastTurn(state),
        swapCorpHqAndRdTop: () => deps.swapCorpHqAndRdTop(state),
      },
      runner: {
        requireRunnerTagged: () => deps.requireRunnerTagged(state),
        runnerLastTurnInstalledResourceIds: () =>
          deps.runnerLastTurnInstalledResourceIds(state),
        isConcealedRunnerResource: (cardId) =>
          isConcealedRunnerResource(state, cardId),
        hiddenRunnerResourceSlotId,
      },
      economy: {
        gainCorpCredits: (amount) => credits(state, "corp", amount),
        addFutureExtraActionGrant: (input) => {
          const economy = (state.actionEconomy ??= {});
          economy.futureGrants = [
            ...(economy.futureGrants ?? []),
            { side: "corp", ...input },
          ];
        },
        addCorpCreditForfeitDebt: (
          sourceCardInstanceId,
          sourceDefinitionId,
          amount,
        ) => {
          const economy = (state.actionEconomy ??= {});
          economy.corpCreditForfeitDebt = {
            remaining:
              Math.max(
                0,
                Math.floor(economy.corpCreditForfeitDebt?.remaining ?? 0),
              ) + amount,
            sourceCardInstanceId,
            sourceDefinitionId,
          };
          return economy.corpCreditForfeitDebt.remaining;
        },
      },
      zones: {
        trashRunnerInstalledCardToHeap: (cardId) =>
          deps.trashRunnerInstalledCardToHeap(state, cardId),
      },
      damage: {
        resolveDamageOperation: (
          legalAction,
          damageType,
          amount,
          sourceDefinitionId,
        ) =>
          resolveDamageOperation(
            state,
            legalAction,
            damageType,
            amount,
            sourceDefinitionId,
          ),
        addRunnerTagsWithPrevention: (legalAction, amount, source) =>
          addRunnerTagsWithPrevention(state, legalAction, amount, source),
      },
      hiddenZone: {
        startCorpArchivesToHqChoice: (legalAction, sourceCardId) =>
          startCorpArchivesToHqChoice(
            deps.hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
            sourceCardId,
          ),
        startCorpHqCardToRdChoice: (legalAction, sourceCardId) =>
          startCorpHqCardToRdChoice(
            deps.hiddenZoneNonSearchChoiceHandlerHost(state, legalAction),
            sourceCardId,
          ),
        startCorpRdTopReorderChoice: (legalAction, sourceCardId) =>
          startCorpRdTopReorderChoice(
            deps.hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
            sourceCardId,
          ),
        resolveConcealAndReorderInstalledIce: (legalAction) =>
          resolveConcealAndReorderInstalledIce(
            deps.hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
          ),
      },
      board: {
        installedAgendaOperationTarget: () =>
          deps.installedAgendaOperationTarget(state),
        advanceableInstalledCardTargets: () =>
          deps.advanceableInstalledCardTargets(state),
        advancementDistributionOptions: (amount, distribution) =>
          deps.advancementDistributionOptions(
            state,
            amount,
            distribution as never,
          ),
        moveAdvancementOptions: (sourceCardId, source, maxAmount) =>
          deps.moveAdvancementOptions(
            state,
            sourceCardId,
            source as never,
            maxAmount,
          ),
        resolveAgendaCounterOperation: (legalAction, sourceDefinitionId) =>
          deps.resolveAgendaCounterOperation(
            state,
            legalAction,
            sourceDefinitionId,
          ),
        resolveCorpOperationAddAdvancementCounters: (legalAction) =>
          deps.resolveCorpOperationAddAdvancementCounters(state, legalAction),
        resolveAdvancementPlacementOperation: (legalAction) =>
          deps.resolveAdvancementPlacementOperation(state, legalAction),
      },
      operations: {
        hardwareTrashByCounterEligibleHardwareIds: () =>
          deps.hardwareTrashByCounterEligibleHardwareIds(state),
        resolveHardwareTrashByCounterOperation: (legalAction) =>
          deps.resolveHardwareTrashByCounterOperation(state, legalAction),
      },
      cardImplementation: {
        canPlayPrintedCostOnPlay: (definition) =>
          canPlayPrintedCostOnPlayImplementation(
            deps.cardImplementationRuntimeDeps,
            state,
            definition,
          ),
        executeOnPlayAbility: (legalAction, definition, cardId) =>
          executeOnPlayCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
          ),
      },
    };
  }

  function boardStateActionExecutionHost(
    state: GameState,
  ): BoardStateActionExecutionHost {
    return {
      state,
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        serverById: (serverId) => mustServer(state, serverId),
      },
      payment: {
        spendClick: (side) => spendClick(state, side),
        spendCredits: (side, amount) => spendCredits(state, side, amount),
      },
      runner: {
        resolveHiddenRunnerResourceSlot: (slotId) =>
          resolveHiddenRunnerResourceSlot(state, slotId),
        isConcealedRunnerResource: (cardId) =>
          isConcealedRunnerResource(state, cardId),
        hiddenRunnerResourceSlotId,
        trashInstalledCardToHeap: (cardId, legalAction) =>
          deps.trashRunnerInstalledCardToHeap(state, cardId, legalAction),
      },
      fort: {
        markFortActivityForRunGate: (serverId, legalAction) =>
          markFortActivityForRunGate(
            deps.fortRunSideFamiliesHostForState(state),
            serverId,
            legalAction,
          ),
      },
    };
  }

  return {
    playCardExecutionHost,
    corpOperationResolutionHost,
    boardStateActionExecutionHost,
  };
}
