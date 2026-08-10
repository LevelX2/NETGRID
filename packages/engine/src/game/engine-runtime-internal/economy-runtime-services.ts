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
  RESTRICTED_ACTION_GRANT_KEYS,
  clearRestrictedActionGrant,
  consumeRestrictedActionGrant,
  restrictedActionGrant,
  restrictedActionGrantRemaining,
  restrictedActionGrantTemporaryCredits,
  spendRestrictedActionGrantTemporaryCredits,
} from "../state/restricted-action-grants";
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

export function createEconomyRuntimeServices(
  deps: RuntimeDeps,
): import("./economy-runtime-port").EconomyRuntimePort {
  function expireScoredAgendaInstallRezCreditAbilities(state: GameState): void {
    for (const agendaId of state.corp.scoreArea) {
      const definition = definitionFor(state, agendaId);
      if (
        deps.scoredAgendaKindForDefinition(definition) ===
        "scored_agenda_credit_until_install_or_rez"
      )
        setCardCounter(state, agendaId, "mark", 0);
    }
  }

  function isCorpInstallableCardType(definition: CardDefinition): boolean {
    return (
      definition.side === "corp" &&
      (definition.type === "ice" ||
        definition.type === "agenda" ||
        definition.type === "asset" ||
        definition.type === "upgrade")
    );
  }

  function edgerunnerTempsInstallActionsRemaining(state: GameState): number {
    const grant = restrictedActionGrant(
      state.corpTurnFlags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    );
    if (grant)
      return restrictedActionGrantRemaining(
        state.corpTurnFlags,
        RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
      );
    return Math.max(
      0,
      Math.floor(
        state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining ?? 0,
      ),
    );
  }

  function clearEdgerunnerTempsInstallFlags(state: GameState): void {
    const flags = ensureCorpTurnFlags(state);
    clearRestrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    );
    flags.edgerunnerTempsInstallActionsRemaining = 0;
  }

  function consumeEdgerunnerTempsInstallAction(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      legalAction.side !== "corp" ||
      legalAction.type !== "install_card" ||
      legalAction.payload?.v1922EdgerunnerTempsInstallAction !== true
    )
      return;
    const flags = ensureCorpTurnFlags(state);
    const remainingBefore = edgerunnerTempsInstallActionsRemaining(state);
    if (remainingBefore <= 0)
      throw new Error(
        "Edgerunner, Inc., Temps hat keine Installationsaktionen mehr.",
      );
    const remainingAfter = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
    )
      ? consumeRestrictedActionGrant(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
        )
      : Math.max(0, remainingBefore - 1);
    flags.edgerunnerTempsInstallActionsRemaining = remainingAfter;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922CorpOperationAbility: "install_action_bundle",
      edgerunnerTempsInstallActionSpent: true,
      edgerunnerTempsInstallActionsRemaining:
        flags.edgerunnerTempsInstallActionsRemaining,
    };
  }

  function valuPakProgramInstallActionsRemaining(state: GameState): number {
    const flags = ensureRunnerTurnFlags(state);
    const grant = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    if (grant)
      return restrictedActionGrantRemaining(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      );
    return Math.max(
      0,
      Math.floor(flags.valuPakProgramInstallActionsRemaining ?? 0),
    );
  }

  function valuPakTemporaryProgramInstallCredits(state: GameState): number {
    const flags = ensureRunnerTurnFlags(state);
    const grant = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    if (grant)
      return restrictedActionGrantTemporaryCredits(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
      );
    return Math.max(
      0,
      Math.floor(flags.valuPakTemporaryProgramInstallCredits ?? 0),
    );
  }

  function runnerInstallableProgramIdsForValuPak(
    state: GameState,
  ): CardInstanceId[] {
    const activeBundle = valuPakProgramInstallActionsRemaining(state) > 0;
    const prospectiveTemporaryCredit = activeBundle ? 0 : 1;
    return state.runner.grip.filter((cardId) => {
      const definition = definitionFor(state, cardId);
      const uniqueBlocked =
        deps.isUniqueCard(definition) &&
        deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id);
      return (
        definition.type === "program" &&
        !uniqueBlocked &&
        deps.availableRunnerProgramInstallCredits(state) +
          prospectiveTemporaryCredit >=
          (definition.installCost ?? 0) &&
        runnerProgramInstallMemoryReachableAfterTrash(state, definition)
      );
    });
  }

  function installedRunnerProgramTrashOptionsForInstall(
    state: GameState,
  ): CardInstanceId[] {
    return state.runner.rig.programs.slice().sort();
  }

  function runnerProgramInstallMemoryReachableAfterTrash(
    state: GameState,
    definition: CardDefinition,
  ): boolean {
    const memoryCost = definition.memoryCost ?? 0;
    if (state.runner.memoryUsed + memoryCost <= runnerMemoryLimit(state))
      return true;
    const maximumFreedMemory = installedRunnerProgramTrashOptionsForInstall(
      state,
    ).reduce((sum, cardId) => {
      if (!deps.runnerProgramUsesMemory(state, cardId)) return sum;
      return sum + (definitionFor(state, cardId).memoryCost ?? 0);
    }, 0);
    return (
      state.runner.memoryUsed + memoryCost - maximumFreedMemory <=
      runnerMemoryLimit(state)
    );
  }

  function shouldOfferRunnerProgramTrashBeforeInstall(
    state: GameState,
    definition: CardDefinition,
  ): boolean {
    return (
      definition.type === "program" &&
      installedRunnerProgramTrashOptionsForInstall(state).length > 0 &&
      runnerProgramInstallMemoryReachableAfterTrash(state, definition)
    );
  }

  function clearValuPakProgramInstallFlags(state: GameState): void {
    const flags = ensureRunnerTurnFlags(state);
    clearRestrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    );
    flags.valuPakProgramInstallActionsRemaining = 0;
    flags.valuPakTemporaryProgramInstallCredits = 0;
  }

  function stopValuPakProgramInstallSequence(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      legalAction.side !== "runner" ||
      legalAction.type !== "stop_restricted_action_sequence" ||
      legalAction.payload?.v1922ValuPakSequenceStop !== true
    ) {
      throw new Error(
        "Nur die aktive Valu-Pak-Installationssequenz kann beendet werden.",
      );
    }
    const remainingActions = valuPakProgramInstallActionsRemaining(state);
    if (remainingActions <= 0) {
      throw new Error(
        "Valu-Pak Software Bundle hat keine aktive Installationssequenz.",
      );
    }
    if (state.runner.clicks < remainingActions) {
      throw new Error(
        "Die verbleibenden Valu-Pak-Aktionen überschreiten die Runner-Aktionen.",
      );
    }
    const returnedTemporaryCredits =
      valuPakTemporaryProgramInstallCredits(state);
    state.runner.clicks -= remainingActions;
    clearValuPakProgramInstallFlags(state);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "program_install_action_bundle",
      valuPakSequenceStopped: true,
      valuPakRestrictedActionsForgone: remainingActions,
      valuPakTemporaryCreditsReturned: returnedTemporaryCredits,
      runnerClicksAfter: state.runner.clicks,
    };
  }

  function consumeValuPakProgramInstallAction(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    if (
      legalAction.side !== "runner" ||
      (legalAction.type !== "install_card" &&
        !(
          legalAction.type === "resolve_choice" &&
          legalAction.payload?.runnerProgramTrashBeforeInstallResolved === true
        )) ||
      legalAction.payload?.v1922ValuPakInstallAction !== true
    )
      return;
    const flags = ensureRunnerTurnFlags(state);
    const remainingBefore = valuPakProgramInstallActionsRemaining(state);
    if (remainingBefore <= 0)
      throw new Error(
        "Valu-Pak Software Bundle hat keine Installationsaktionen mehr.",
      );
    const remainingAfter = restrictedActionGrant(
      flags,
      RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
    )
      ? consumeRestrictedActionGrant(
          flags,
          RESTRICTED_ACTION_GRANT_KEYS.valuPakProgramInstall,
        )
      : Math.max(0, remainingBefore - 1);
    flags.valuPakProgramInstallActionsRemaining = remainingAfter;
    if (remainingAfter <= 0) flags.valuPakTemporaryProgramInstallCredits = 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1922RunnerEventAbility: "program_install_action_bundle",
      valuPakInstallActionSpent: true,
      valuPakProgramInstallActionsRemaining:
        flags.valuPakProgramInstallActionsRemaining,
      valuPakTemporaryProgramInstallCreditsAfter:
        valuPakTemporaryProgramInstallCredits(state),
    };
  }

  function runnerDrawActionContext(state: GameState): RunnerDrawActionContext {
    return {
      drawTaxSourceCount: deps.drawTaxSourceIds(state).length,
      projectedDrawCount: deps.activeCrashEverettSourceId(state) ? 2 : 1,
    };
  }

  return {
    expireScoredAgendaInstallRezCreditAbilities,
    isCorpInstallableCardType,
    edgerunnerTempsInstallActionsRemaining,
    clearEdgerunnerTempsInstallFlags,
    consumeEdgerunnerTempsInstallAction,
    valuPakProgramInstallActionsRemaining,
    valuPakTemporaryProgramInstallCredits,
    runnerInstallableProgramIdsForValuPak,
    installedRunnerProgramTrashOptionsForInstall,
    runnerProgramInstallMemoryReachableAfterTrash,
    shouldOfferRunnerProgramTrashBeforeInstall,
    stopValuPakProgramInstallSequence,
    clearValuPakProgramInstallFlags,
    consumeValuPakProgramInstallAction,
    runnerDrawActionContext,
  };
}
