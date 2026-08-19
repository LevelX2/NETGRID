import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { effectiveCardHasNormalizedSubtype } from "../../ability-engine/card-implementation-modifiers";
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
  projectHqInstallRezOptionQuote,
  projectInstalledCorpSequenceRezPayment,
  quoteCorpIceInstallCost,
  rezCostReductionSourceDefinitionIdsFor,
  type CorpTracePaymentDependencies,
  type CorpSequenceRezPaymentProjection,
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
  finalizeCorpIceInstallAfterExternalPayment,
  finalizeCorpRootInstallAfterExternalPayment,
  type InstallCardHost,
} from "../install/install-card";
import { canInstallCorpIceInServer } from "../install/corp-ice-install-restrictions";
import {
  effectDrivenCorpIceRezAgendaPointCost,
  effectDrivenCorpIceRezVariants,
  finalizeCorpRezAfterExternalPayment,
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
  openDamageResolutionWindow,
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

export function createScoredEconomyRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps = {} as RuntimeDeps,
): Pick<
  import("./action-runtime-port").ActionRuntimePort,
  | "corpInstallRezSequenceHandlerHost"
  | "scoredAgendaFlowHost"
  | "scoredAgendaAbilityHost"
  | "corpTraceDamageAbilityHost"
  | "corpSpecialDamageAbilityHost"
> {
  function corpInstallRezSequenceHandlerHost(
    state: GameState,
    legalAction: LegalAction,
    playerAction?: PlayerAction,
  ): CorpInstallRezSequenceHandlerHost {
    const payAndFinalizeSequenceRez = (
      cardId: CardInstanceId,
      quote: Extract<CorpSequenceRezPaymentProjection, { complete: true }>,
    ) => {
      if (
        quote.regularCreditsAvailable !== state.corp.credits ||
        quote.temporaryCreditsApplied > quote.temporaryCreditsAvailable ||
        quote.regularCreditsRequired !==
          quote.finalCredits - quote.temporaryCreditsApplied ||
        quote.creditPayable !==
          state.corp.credits >= quote.regularCreditsRequired ||
        !quote.creditPayable ||
        !quote.additionalCostsPayable ||
        !quote.affordable
      )
        throw new Error(
          "Die Data-Fort-Reclamation-Rez-Quote ist nicht mehr bezahlbar.",
        );
      const agendaPointCost = quote.mandatoryAdditionalCosts.agendaPoints;
      if (agendaPointCost > 0) {
        const costResult = deps.spendCorpAgendaPointCost(
          state,
          agendaPointCost,
        );
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          agendaPointCost,
          agendaPointCostPaid: costResult.paidPoints,
          ...(costResult.bonusPointsSpent > 0
            ? { corpBonusAgendaPointsSpent: costResult.bonusPointsSpent }
            : {}),
          ...(costResult.spentAgendaDefinitionIds.length > 0
            ? {
                spentAgendaDefinitionIds:
                  costResult.spentAgendaDefinitionIds.join(","),
              }
            : {}),
        };
      }
      if (quote.regularCreditsRequired > 0)
        spendCredits(state, "corp", quote.regularCreditsRequired);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        cardId,
        rezCostPaid: quote.finalCredits,
        temporaryCreditsSpent: quote.temporaryCreditsApplied,
        corpCreditsSpent: quote.regularCreditsRequired,
        ...(quote.reductionSourceDefinitionIds?.length
          ? {
              rezCostReductionSourceDefinitionIds:
                quote.reductionSourceDefinitionIds.join(","),
            }
          : {}),
        ...(quote.increaseSourceDefinitionIds?.length
          ? {
              rezCostIncreaseSourceDefinitionIds:
                quote.increaseSourceDefinitionIds.join(","),
            }
          : {}),
      };
      finalizeCorpRezAfterExternalPayment(
        deps.rezCardHost(state),
        cardId,
        legalAction,
      );
      if (quote.cardType !== "ice")
        resolveCorpRootRezEffect(
          deps.runRezWindowHostForState(state),
          cardId,
          legalAction,
        );
      return {
        temporaryCreditsSpent: quote.temporaryCreditsApplied,
        temporaryCreditsRemaining:
          quote.temporaryCreditsAvailable - quote.temporaryCreditsApplied,
        corpCreditsSpent: quote.regularCreditsRequired,
      };
    };
    const availableEffectDrivenRezVariants = (cardId: CardInstanceId) => {
      const definition = definitionFor(state, cardId);
      const agendaPointCost = effectDrivenCorpIceRezAgendaPointCost(definition);
      if (deps.corpAgendaPointTotal(state) < agendaPointCost) return [];
      return effectDrivenCorpIceRezVariants(definition, state.corp.credits);
    };
    const effectDrivenInstallCredits = (
      cardId: CardInstanceId,
      server: CorpServer,
    ) => {
      const installQuote = deps.corpIceInstallTotalCost(state, cardId, server);
      const increaseCredits = Math.max(
        0,
        installQuote.totalCost -
          installQuote.baseCost -
          installQuote.additionalCost +
          installQuote.reduction,
      );
      return {
        installQuote,
        installCreditsPaid: installQuote.additionalCost + increaseCredits,
      };
    };
    const rezInstalledIceWaivingBaseCost = (
      cardId: CardInstanceId,
      variantId: string,
    ) => {
      const definition = definitionFor(state, cardId);
      const variant = availableEffectDrivenRezVariants(cardId).find(
        (candidate) => candidate.variantId === variantId,
      );
      if (!variant)
        throw new Error(
          "Die effect-driven Rez-Variante ist nicht mehr bezahlbar.",
        );
      const instance = state.cardInstances[cardId];
      if (
        definition.type !== "ice" ||
        !instance ||
        instance.zone.side !== "corp" ||
        instance.zone.zone !== "serverIce" ||
        instance.rezzed
      )
        throw new Error("Das effect-driven Rez-Ziel ist nicht mehr gueltig.");
      const agendaPointCost = effectDrivenCorpIceRezAgendaPointCost(definition);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...variant.payload,
        cardId,
        effectDrivenInstallRez: true,
        effectDrivenBaseRezCreditsWaived: true,
        ...(agendaPointCost > 0 ? { agendaPointCost } : {}),
      };
      executeRezCard(deps.rezCardHost(state), cardId, false, legalAction, {
        runContinuation: "none",
        waiveBaseCreditCost: true,
      });
      deps.expireScoredAgendaInstallRezCreditAbilities(state);
      return {
        installCreditsPaid: 0,
        rezAdditionalCreditsPaid: variant.additionalCreditCost,
        rezAgendaPointsPaid: agendaPointCost,
        installed: true,
        rezzed: true,
      };
    };
    const installAndRezIceWaivingBaseCosts = (
      cardId: CardInstanceId,
      server: CorpServer,
      variantId: string,
    ) => {
      const definition = definitionFor(state, cardId);
      if (definition.type !== "ice")
        throw new Error("Der effect-driven Install-/Rez-Pfad braucht ICE.");
      const { installQuote, installCreditsPaid } = effectDrivenInstallCredits(
        cardId,
        server,
      );
      if (state.corp.credits < installCreditsPaid)
        throw new Error(
          "Die zusaetzlichen effect-driven ICE-Installkosten sind nicht bezahlbar.",
        );
      if (installCreditsPaid > 0)
        spendCredits(state, "corp", installCreditsPaid);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        cardId,
        serverId: server.id,
        effectDrivenInstallRez: true,
        effectDrivenBaseInstallCreditsWaived: installQuote.baseCost,
        effectDrivenAdditionalInstallCreditsPaid: installCreditsPaid,
        ...(installQuote.increaseSourceDefinitionIds
          ? {
              iceInstallCostIncreaseSourceDefinitionIds:
                installQuote.increaseSourceDefinitionIds,
            }
          : {}),
      };
      finalizeCorpIceInstallAfterExternalPayment(
        deps.installCardHost(state),
        cardId,
        server,
        legalAction,
      );
      const installedInstance = state.cardInstances[cardId];
      if (
        installedInstance?.zone.side !== "corp" ||
        installedInstance.zone.zone !== "serverIce" ||
        installedInstance.zone.serverId !== server.id
      ) {
        return {
          installCreditsPaid,
          rezAdditionalCreditsPaid: 0,
          rezAgendaPointsPaid: 0,
          installed: false,
          rezzed: false,
        };
      }
      const rezReceipt = rezInstalledIceWaivingBaseCost(cardId, variantId);
      return { ...rezReceipt, installCreditsPaid };
    };
    return {
      state,
      legalAction,
      ...(playerAction ? { playerAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
        scoredAgendaKind: (cardId) =>
          deps.scoredAgendaKindForDefinition(definitionFor(state, cardId)),
        scoredAgendaForCard: (cardId) =>
          deps.scoredAgendaImplementationForDefinition(
            definitionFor(state, cardId),
          ),
        isCorpInstallableCardType: (definition) =>
          deps.isCorpInstallableCardType(definition),
        canInstallCorpRootCardInServer: (definition, server) =>
          deps.canInstallCorpRootCardInServer(state, definition, server),
        isRegionUpgrade: deps.isRegionUpgrade,
        rootInstallRezzesOnInstall: deps.rootInstallRezzesOnInstall,
        isScoredAgendaFreeRezCandidate: (cardId) => {
          const instance = state.cardInstances[cardId];
          return (
            instance?.zone.side === "corp" &&
            instance.zone.zone === "serverIce" &&
            !instance.rezzed
          );
        },
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        moveCardToArchivesFaceup: (cardId) => {
          state.corp.archives.unshift(cardId);
          state.cardInstances[cardId] = {
            ...mustInstance(state.cardInstances, cardId),
            faceup: true,
            rezzed: true,
            zone: { side: "corp", zone: "archives" },
          };
        },
      },
      servers: {
        createRemote: () => createRemote(state),
        mustServer: (serverId) => mustServer(state, serverId),
        trashOlderRegionUpgradesInServer: (server, keepCardId, legalAction) =>
          deps.trashOlderRegionUpgradesInServer(
            state,
            server,
            keepCardId,
            legalAction,
          ),
      },
      credits: {
        spendCorpCredits: (amount) => spendCredits(state, "corp", amount),
      },
      callbacks: {
        payHqInstallCost: (cardId, server, temporaryCreditsAvailable) => {
          const definition = definitionFor(state, cardId);
          const installCost =
            definition.type === "ice"
              ? deps.corpIceInstallTotalCost(state, cardId, server).totalCost
              : 0;
          const temporaryCreditsSpent = Math.min(
            installCost,
            temporaryCreditsAvailable,
          );
          const corpCreditsSpent = installCost - temporaryCreditsSpent;
          if (state.corp.credits < corpCreditsSpent)
            throw new Error(
              "Die Data-Fort-Reclamation-Installkosten sind nicht bezahlbar.",
            );
          if (corpCreditsSpent > 0)
            spendCredits(state, "corp", corpCreditsSpent);
          return {
            temporaryCreditsSpent,
            temporaryCreditsRemaining:
              temporaryCreditsAvailable - temporaryCreditsSpent,
            corpCreditsSpent,
          };
        },
        recordSuccessfulCorpInstall: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
        finalizeCorpInstallAfterExternalPayment: (cardId, server) => {
          const definition = definitionFor(state, cardId);
          if (definition.type === "ice") {
            finalizeCorpIceInstallAfterExternalPayment(
              deps.installCardHost(state),
              cardId,
              server,
              legalAction,
            );
            return;
          }
          finalizeCorpRootInstallAfterExternalPayment(
            deps.installCardHost(state),
            cardId,
            server,
            legalAction,
          );
        },
        resolveCorpRootRez: (cardId) => {
          resolveCorpRootRezEffect(
            deps.runRezWindowHostForState(state),
            cardId,
          );
        },
        preflightMandatoryHqInstallRez: (
          selectedCardIds,
          temporaryCreditsAvailable,
        ) => {
          const previewState = structuredClone(state);
          const previewLegalAction = structuredClone(legalAction);
          const previewHost = corpInstallRezSequenceHandlerHost(
            previewState,
            previewLegalAction,
          );
          const previewServer = createRemote(previewState);
          let temporaryCreditsRemaining = temporaryCreditsAvailable;
          for (const cardId of selectedCardIds) {
            const definition = definitionFor(previewState, cardId);
            const installPayment = previewHost.callbacks.payHqInstallCost(
              cardId,
              previewServer,
              temporaryCreditsRemaining,
            );
            temporaryCreditsRemaining =
              installPayment.temporaryCreditsRemaining;
            previewHost.callbacks.finalizeCorpInstallAfterExternalPayment(
              cardId,
              previewServer,
            );
            previewHost.callbacks.recordSuccessfulCorpInstall();
            const previewInstance = previewState.cardInstances[cardId];
            if (
              previewInstance?.zone.side !== "corp" ||
              (previewInstance.zone.zone !== "serverIce" &&
                previewInstance.zone.zone !== "serverRoot")
            )
              continue;
            if (definition.type === "ice") continue;
            if (
              !deps.isRegionUpgrade(definition) &&
              !deps.rootInstallRezzesOnInstall(definition)
            )
              continue;
            const payment =
              previewHost.callbacks.payAndFinalizeMandatoryHqInstallRez(
                cardId,
                temporaryCreditsRemaining,
              );
            temporaryCreditsRemaining = payment.temporaryCreditsRemaining;
            if (deps.isRegionUpgrade(definition))
              deps.trashOlderRegionUpgradesInServer(
                previewState,
                previewServer,
                cardId,
                previewLegalAction,
              );
          }
        },
        projectHqInstallRezOptionQuote: (choice, option) =>
          projectHqInstallRezOptionQuote(state, choice, option),
        payAndFinalizeHqInstallRezOption: (cardId, quote) => {
          if (
            quote.cardId !== cardId ||
            quote.stateVersion !== state.stateVersion
          )
            throw new Error(
              "Die Data-Fort-Reclamation-Rez-Quote ist nicht mehr gebunden.",
            );
          return payAndFinalizeSequenceRez(cardId, quote);
        },
        payAndFinalizeMandatoryHqInstallRez: (
          cardId,
          temporaryCreditsAvailable,
        ) => {
          const quote = projectInstalledCorpSequenceRezPayment(
            state,
            cardId,
            temporaryCreditsAvailable,
          );
          if (!quote.complete || !quote.affordable)
            throw new Error(
              "Die verpflichtende Data-Fort-Reclamation-Rez-Quote ist unvollstaendig oder unbezahlbar.",
            );
          return payAndFinalizeSequenceRez(cardId, quote);
        },
        effectDrivenRezVariants: availableEffectDrivenRezVariants,
        rezInstalledIceWaivingBaseCost,
        installAndRezIceWaivingBaseCosts,
        preflightInstallAndRezIceWaivingBaseCosts: (entries) => {
          const previewState = structuredClone(state);
          const previewAction = structuredClone(legalAction);
          const previewHost = corpInstallRezSequenceHandlerHost(
            previewState,
            previewAction,
          );
          for (const entry of entries) {
            const server =
              entry.serverId === "new_remote"
                ? createRemote(previewState)
                : mustServer(previewState, entry.serverId);
            previewHost.callbacks.installAndRezIceWaivingBaseCosts(
              entry.cardId,
              server,
              entry.variantId,
            );
          }
        },
        canInstallAndRezIceWaivingBaseCosts: (cardId, serverId, variantId) => {
          if (serverId === "new_remote" && corpNewDataFortCreationLocked(state))
            return false;
          const definition = definitionFor(state, cardId);
          const server =
            serverId === "new_remote"
              ? ({
                  id: "remote_0",
                  label: "Neues Remote",
                  kind: "remote",
                  ice: [],
                  root: [],
                } as CorpServer)
              : state.corp.servers.find(
                  (candidate) => candidate.id === serverId,
                );
          if (
            definition.type !== "ice" ||
            !server ||
            !canInstallCorpIceInServer(definition, server) ||
            (deps.isUniqueCard(definition) &&
              deps.hasInstalledUniqueCardDefinition(
                state,
                "corp",
                definition.id,
              ))
          )
            return false;
          const variant = availableEffectDrivenRezVariants(cardId).find(
            (candidate) => candidate.variantId === variantId,
          );
          if (!variant) return false;
          const { installCreditsPaid } = effectDrivenInstallCredits(
            cardId,
            server,
          );
          return (
            state.corp.credits >=
            installCreditsPaid + variant.additionalCreditCost
          );
        },
      },
    };
  }

  function scoredAgendaFlowHost(
    state: GameState,
    legalAction?: LegalAction,
    playerAction?: PlayerAction,
  ): ScoredAgendaFlowHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      ...(playerAction ? { playerAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        mustInstance: (cardId) => mustInstance(state.cardInstances, cardId),
        scoredAgendaForDefinition: (definition) =>
          deps.scoredAgendaImplementationForDefinition(definition),
        effectiveAgendaDifficulty: (cardId) =>
          effectiveAgendaDifficulty(
            deps.effectiveAgendaDifficultyDeps,
            state,
            cardId,
          ),
        hasSubtype: (definition, subtype) =>
          deps.cardHasSubtype(definition, subtype),
        effectiveHasSubtype: (cardId, subtype) =>
          effectiveCardHasNormalizedSubtype(
            state,
            cardId,
            subtype,
            definitionFor(state, cardId),
          ),
        isOveradvanceAgendaDefinition: (definitionId) =>
          OVERADVANCE_AGENDA_SOURCES.has(definitionId as CardDefinitionId),
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        cleanupEmptyRemotes: () => cleanupEmptyRemotes(state),
        corpInstalledCardIds: () => corpInstalledCardIds(state),
        mustServer: (serverId) => mustServer(state, serverId),
      },
      counters: {
        setCardCounter: (cardId, counterType, amount) =>
          setCardCounter(state, cardId, counterType, amount),
        addCardCounter: (cardId, counterType, amount) =>
          addCardCounter(state, cardId, counterType, amount),
        cardCounter: (cardId, counterType) =>
          cardCounter(state, cardId, counterType),
      },
      credits: {
        gainCredits: (side, amount) => credits(state, side, amount),
        setCorpCredits: (amount) => {
          state.corp.credits = amount;
        },
      },
      flags: {
        markScoredBlackOpsAgendaThisTurn: () => {
          ensureCorpTurnFlags(state).scoredBlackOpsAgendaThisTurn = true;
        },
        scoredAgendaStartDrawChoiceResolvedSourceIds: () =>
          ensureCorpTurnFlags(state)
            .scoredAgendaStartDrawChoiceResolvedSourceIds ?? [],
        markScoredAgendaStartDrawChoiceResolved: (cardId) => {
          const flags = ensureCorpTurnFlags(state);
          flags.scoredAgendaStartDrawChoiceResolvedSourceIds = [
            ...(flags.scoredAgendaStartDrawChoiceResolvedSourceIds ?? []),
            cardId,
          ];
        },
        markScoredAgendaStartDrawChoiceSelected: (cardId) => {
          const flags = ensureCorpTurnFlags(state);
          flags.scoredAgendaStartDrawChoiceSelectedSourceIds = [
            ...(flags.scoredAgendaStartDrawChoiceSelectedSourceIds ?? []),
            cardId,
          ];
        },
      },
      effects: {
        executeOnScore: (definition, cardId) => {
          if (!legalAction) return;
          executeCardImplementationLifecycleEffects(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
            "on_score",
          );
        },
        appendScoredAgendaStartDrawChoiceEffect: (
          cardId,
          sourceDefinitionId,
          drawnCount,
        ) => {
          if (!legalAction) return;
          legalAction.resolvedEffects = [
            ...(legalAction.resolvedEffects ?? []),
            deps.automaticDrawCardsEffect(
              `corp.start.scored_agenda_start_draw.${cardId}`,
              "corp",
              drawnCount,
              sourceDefinitionId,
            ),
          ];
        },
      },
      draw: {
        drawCorpCard: () => drawCorpCard(state),
      },
      choices: {
        startHqToNewRemoteInstallRez: (cardId) => {
          if (!legalAction)
            throw new Error("Data Fort Reclamation braucht eine LegalAction.");
          startHqToNewRemoteInstallRezChoice(
            corpInstallRezSequenceHandlerHost(state, legalAction),
            cardId,
          );
        },
        startScoredAgendaFreeRez: (cardId) => {
          if (!legalAction)
            throw new Error("Priority Requisition braucht eine LegalAction.");
          startScoredAgendaFreeRezChoice(
            corpInstallRezSequenceHandlerHost(state, legalAction),
            cardId,
          );
        },
        startScoredAgendaHqShuffleCredits: (cardId, creditPerAgendaPoint) => {
          if (!legalAction)
            throw new Error("HQ-Agenda-Shuffle braucht eine LegalAction.");
          startScoredAgendaHqShuffleCreditsChoice(
            deps.corpZoneChoiceHandlerHost(state, legalAction),
            { sourceCardId: cardId, creditPerAgendaPoint },
          );
        },
        resolveAgendaPurge: (cardId) => {
          if (!legalAction)
            throw new Error("Security Purge braucht eine LegalAction.");
          resolveAgendaPurgeInstallTargets(
            corpInstallRezSequenceHandlerHost(state, legalAction),
            cardId,
          );
        },
      },
    };
  }

  function scoredAgendaAbilityHost(
    state: GameState,
    legalAction?: LegalAction,
  ): ScoredAgendaAbilityHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        scoredAgendaKindForDefinition: (definition) =>
          deps.scoredAgendaKindForDefinition(definition),
        scoredAgendaForDefinition: (definition) =>
          deps.scoredAgendaImplementationForDefinition(definition),
        isScoredRevealAgendaDefinition: (definitionId) =>
          SCORED_REVEAL_AGENDA_SOURCES.has(definitionId as CardDefinitionId),
      },
      actions: {
        createLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          cardCounter(state, cardId, counterType),
        spendVisibleCardCounter: (cardId, counterType, amount) =>
          deps.spendVisibleCardCounter(state, cardId, counterType, amount),
      },
      credits: {
        gainCorpCredits: (amount) => credits(state, "corp", amount),
      },
      damage: {
        dealRunnerMeatDamage: (sourceCardId, amount) => {
          const definition = definitionFor(state, sourceCardId);
          if (!legalAction) throw new Error("Damage-Aktion fehlt.");
          const event = createDamageImminentEvent(state, {
            damageId: `corp.scored_agenda.${definition.id}.meat.${state.stateVersion}`,
            damageType: "meat",
            amount,
            source: `scored_agenda:${definition.id}`,
          });
          if (openDamageResolutionWindow(state, event, legalAction)) {
            return {
              damageAmount: amount,
              cardsTrashed: 0,
              flatline: false,
            };
          }
          const summary = resolveDamageImminentEvent(state, event);
          setDamagePayload(legalAction, summary);
          return {
            damageAmount: summary.amount,
            cardsTrashed: summary.cardsTrashed,
            flatline: summary.flatline,
          };
        },
      },
      actionProfiles: {
        scoredAgendaCounterCreditProfileForDefinition: (definitionId) =>
          scoredAgendaCounterCreditProfileForDefinition(definitionId),
        scoredAgendaCounterCreditProfileForPayload: (definitionId, payload) =>
          scoredAgendaCounterCreditProfileForPayload(definitionId, payload),
        scoredAgendaCounterCreditPayload: (profile, cardId) =>
          scoredAgendaCounterCreditPayload(profile, cardId),
      },
      callbacks: {
        pushActivatedCardImplementationActions: (actions, cardId, definition) =>
          pushActivatedCardImplementationActions(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            "corp",
            cardId,
            definition,
          ),
        pushActivatedCardImplementationRunActions: (
          actions,
          cardId,
          definition,
        ) =>
          pushActivatedCardImplementationActionsForTiming(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            "corp",
            cardId,
            definition,
            "corp_during_run",
          ),
        resolveActivatedCardImplementationAbility: () => {
          if (!legalAction) return false;
          return resolveActivatedCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
          );
        },
        revealCorpRdTop: () => {
          if (!legalAction) throw new Error("Scored-Agenda-Aktion fehlt.");
          deps.revealCorpRdTop(state, legalAction);
        },
        resolveHqArchivesShuffleDraw: (sourceCardId) => {
          if (!legalAction)
            throw new Error(
              "HQ/Archives-Shuffle-Draw braucht eine LegalAction.",
            );
          resolveHqArchivesShuffleDraw(
            deps.corpZoneChoiceHandlerHost(state, legalAction),
            sourceCardId,
          );
        },
      },
    };
  }

  function corpTraceDamageAbilityHost(
    state: GameState,
    legalAction?: LegalAction,
  ): CorpTraceDamageAbilityHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        implementationForDefinition: (definition) =>
          cardImplementationForDefinitionId(definition.id),
      },
      callbacks: {
        pushActivatedCardImplementationActions: (actions, cardId, definition) =>
          pushActivatedCardImplementationActions(
            deps.cardImplementationRuntimeDeps,
            state,
            actions,
            "corp",
            cardId,
            definition,
          ),
        resolveActivatedCardImplementationAbility: () => {
          if (!legalAction) return false;
          return resolveActivatedCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
          );
        },
      },
    };
  }

  function corpSpecialDamageAbilityHost(
    state: GameState,
    legalAction?: LegalAction,
  ): CorpSpecialDamageAbilityHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        uniqueDirectLongtailImplementationForCard: (cardId) =>
          deps.uniqueDirectLongtailImplementationForCard(state, cardId),
        uniqueDirectLongtailImplementationForDefinition: (definitionId) =>
          deps.uniqueDirectLongtailImplementationForDefinition(definitionId),
        rezzedCorpRootCardIds: () => deps.rezzedCorpRootCardIds(state),
      },
      actions: {
        buildLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      agendaPoints: {
        total: () => deps.corpAgendaPointTotal(state),
        scoredForfeitTargets: () => deps.corpScoredAgendaForfeitTargets(state),
        pointsForScoredCard: (cardId) =>
          deps.agendaPointsForScoredCard(state, cardId),
        forfeitCorpAgendaForPointCost: (cardId) =>
          deps.forfeitCorpAgendaForPointCost(state, cardId),
        spendPointCost: (requiredPoints) =>
          deps.spendCorpAgendaPointCost(state, requiredPoints),
      },
      damage: {
        resolveDamageOperation: (damageType, amount, sourceDefinitionId) => {
          if (!legalAction) throw new Error("Damage-Aktion fehlt.");
          resolveDamageOperation(
            state,
            legalAction,
            damageType,
            amount,
            sourceDefinitionId,
          );
        },
      },
      rng: {
        rollDie: (purpose) => rollDeterministicDie(state, purpose),
        randomCounter: () => state.randomCounter,
      },
      trash: {
        trashCorpInstalledCardToArchives: (cardId) =>
          deps.trashCorpInstalledCardToArchives(state, cardId),
      },
    };
  }

  return {
    corpInstallRezSequenceHandlerHost,
    scoredAgendaFlowHost,
    scoredAgendaAbilityHost,
    corpTraceDamageAbilityHost,
    corpSpecialDamageAbilityHost,
  };
}
