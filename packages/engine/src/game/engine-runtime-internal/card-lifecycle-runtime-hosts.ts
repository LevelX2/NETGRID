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
  assertCorpRootRezCostQuoteValid,
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
import {
  runnerInstallPaymentChoiceSourceSuffix,
  runnerInstallPaymentPayloadForChoiceSource,
  runnerInstallPaymentPublicPayload,
} from "../install/runner-program-install-payment";
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

export function createCardLifecycleRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps,
): Pick<
  import("./card-runtime-host-port").CardRuntimeHostPort,
  | "installCardHost"
  | "rezCardHost"
  | "resolveRunnerTargetedEventImplementation"
  | "resolvePostOnPlayGenericFollowups"
  | "resolveRunnerGripHeapStackShuffleDrawEvent"
  | "shuffleGripTrashAndStackThenDrawForCardImplementation"
  | "startRunnerProgramTrashBeforeInstallChoice"
  | "resolveRunnerProgramTrashBeforeInstallChoice"
> {
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
        isUniqueCard: deps.isUniqueCard,
        hasInstalledUniqueCardDefinition: (side, definitionId) =>
          deps.hasInstalledUniqueCardDefinition(state, side, definitionId),
        cardHasSubtype: deps.cardHasSubtype,
        isRunnerHardwareDeckDefinition,
        hasCardImplementationMemoryUnitModifier:
          deps.hasCardImplementationMemoryUnitModifier,
        shouldLoadLegacyRecurringCredits,
        damagePreventionSourcesForDefinition,
        cardImplementationAgendaPointInstallCost:
          deps.cardImplementationAgendaPointInstallCost,
      },
      servers: {
        assertCorpCanCreateNewDataFort: () =>
          assertCorpCanCreateNewDataFort(state),
        mustServer: (serverId) => mustServer(state, serverId),
        createRemote: () => createRemote(state),
        serverChoiceDisplayLabel: (serverId) =>
          serverChoiceDisplayLabel(state, serverId),
        canInstallCorpRootCardInServer: (definition, server) =>
          deps.canInstallCorpRootCardInServer(state, definition, server),
        corpRootAgendaOrNodeCapacityInServer: (server) =>
          deps.corpRootAgendaOrNodeCapacityInServer(state, server),
        corpRootAssetIdsInServer: (server) =>
          corpRootAssetIdsInServer(state, server),
        corpRootMainCardIdsInServer: (server) =>
          corpRootMainCardIdsInServer(state, server),
        rootInstallRezzesOnInstall: deps.rootInstallRezzesOnInstall,
        trashOlderRegionUpgradesInServer: (server, keepCardId, legalAction) =>
          deps.trashOlderRegionUpgradesInServer(
            state,
            server,
            keepCardId,
            legalAction,
          ),
        markFortActivityForRunGate: (serverId, legalAction) =>
          markFortActivityForRunGate(
            deps.fortRunSideFamiliesHostForState(state),
            serverId,
            legalAction,
          ),
      },
      zones: {
        removeFromAllZones: (cardId) => removeFromAllZones(state, cardId),
        trashRunnerInstalledCardToHeap: (cardId) =>
          deps.trashRunnerInstalledCardToHeap(state, cardId),
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          deps.trashCorpInstalledCardToArchives(state, cardId, legalAction),
      },
      runner: {
        ensureTurnFlags: () => ensureRunnerTurnFlags(state),
        requiresDataFortInstallTarget: deps.requiresDataFortInstallTarget,
        startRunnerProgramTrashBeforeInstallChoice: (cardId, legalAction) =>
          startRunnerProgramTrashBeforeInstallChoice(
            state,
            cardId,
            legalAction,
          ),
        forfeitRunnerAgendaForPointCost: (cardId) =>
          deps.forfeitRunnerAgendaForPointCost(state, cardId),
        consumeValuPakProgramInstallAction: (legalAction) =>
          deps.consumeValuPakProgramInstallAction(state, legalAction),
        hiddenRunnerResourceSlotId,
      },
      corp: {
        expireScoredAgendaInstallRezCreditAbilities: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
        consumeEdgerunnerTempsInstallAction: (legalAction) =>
          deps.consumeEdgerunnerTempsInstallAction(state, legalAction),
        isRegionUpgrade: deps.isRegionUpgrade,
        isFortTraceBitPoolSource: (cardId) =>
          isFortTraceBitPoolSource(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        fortTraceBitPoolCapacityForCard: (cardId) =>
          fortTraceBitPoolCapacityForCard(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
      hosting: {
        canHostProgramOnDaemon: (hostCardId, definition) =>
          deps.canHostProgramOnDaemon(state, hostCardId, definition),
        hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
      },
      payment: {
        assertCorpIceInstallCostValid: (cardId, definition, legalAction) =>
          deps.assertCorpIceInstallCostValid(
            state,
            cardId,
            definition,
            legalAction,
          ),
        spendClick: (side) => spendClick(state, side),
        spendRunnerInstallCredits: (amount, cardType, paymentPayload) =>
          deps.spendRunnerInstallCredits(
            state,
            amount,
            cardType,
            paymentPayload,
          ),
        runnerCanPayInstallCost: (amount, cardType) =>
          deps.runnerCanPayInstallCost(state, amount, cardType),
        openRunnerCostPenaltySupportWindow: (legalAction, amount, cardType) =>
          deps.openRunnerCostPenaltySupportWindow(
            state,
            legalAction,
            amount,
            cardType,
          ),
        closeRunnerCostPenaltySupportWindowForPayment: (legalAction, amount) =>
          deps.closeRunnerCostPenaltySupportWindowForPayment(
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
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
            "on_install",
          ),
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
        variableRezForDefinition: deps.variableRezForDefinition,
        stableSubtypeList: deps.stableSubtypeList,
      },
      run: {
        mustRun: () => mustRun(state),
        handleRunRootRezPostRez: (cardId, legalAction) =>
          handleRunRootRezPostRez(
            deps.runRezWindowHostForState(state),
            cardId,
            legalAction,
          ),
        handlePostIceRezContinuation: (cardId, legalAction) => {
          const run = state.run;
          const rootRezWindowStillOpen = Boolean(
            state.timingPoint === "run.approach_ice" &&
            run?.phase === "approach_ice" &&
            run.approachedIceId === cardId &&
            corpRunRootRezActionsAvailable(
              deps.runRezWindowHostForState(state),
            ),
          );
          if (rootRezWindowStillOpen) return true;
          if (
            state.timingPoint === "run.approach_ice" &&
            run?.phase === "approach_ice" &&
            run.approachedIceId === cardId &&
            (run.secretSpendGuessRunAutoPassIceId === cardId ||
              run.bypassFirstIceRemaining === true)
          ) {
            passApproachedIce(deps.runMovementHostForState(state), legalAction);
            return true;
          }
          const continuation = continueAfterCorpRootRezIfWindowIsComplete(
            deps.encounterEntryHostForState(state),
            legalAction,
          );
          if (continuation.handled) return true;
          return false;
        },
        beginEncounter: (cardId, legalAction) =>
          beginEncounter(
            deps.encounterEntryHostForState(state),
            cardId,
            legalAction,
          ),
      },
      payment: {
        rezCostForCard: (cardId) => rezCostForCard(state, cardId),
        assertCorpRezCostQuoteValid: (cardId, legalAction) =>
          assertCorpRezCostQuoteValid(state, cardId, legalAction),
        assertCorpRootRezCostQuoteValid: (cardId, legalAction) =>
          assertCorpRootRezCostQuoteValid(state, cardId, legalAction),
        creditCostForAction: deps.creditCostForAction,
        spendCredits: (side, amount) =>
          side === "corp"
            ? spendCorpInstallRezCredits(state, amount)
            : spendCredits(state, side, amount),
      },
      corp: {
        isObligationDebtDefinition: deps.isObligationDebtDefinition,
        spendCorpAgendaPointCost: (requiredPoints) =>
          deps.spendCorpAgendaPointCost(state, requiredPoints),
        activeObligationCount: () => deps.activeObligationCount(state),
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
            deps.cardImplementationRuntimeDeps,
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
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        fortTraceBitPoolCapacityForCard: (cardId) =>
          fortTraceBitPoolCapacityForCard(
            deps.fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
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
    if (!deps.cardHasSubtype(targetDefinition, "icebreaker"))
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
    const remoteServerTrashTagSequenceEffect = effects.find(
      (effect) =>
        effect.kind ===
        "trash_rezzed_ice_on_last_successful_run_fort_and_add_tags",
    );
    if (remoteServerTrashTagSequenceEffect) {
      const tagAmount = remoteServerTrashTagSequenceEffect.tagAmount;
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
        deps.trashCorpInstalledCardToArchives(state, iceId, legalAction);
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        remoteServerTrashTagSequenceResolved: true,
        serverId,
        trashedRezzedIceCount: trashedDefinitionIds.length,
        trashedCount: trashedDefinitionIds.length,
        ...(trashedDefinitionIds.length > 0
          ? { trashedCardDefinitionIds: trashedDefinitionIds.sort().join(",") }
          : {}),
      };
      state.pendingAddTagContinuation = {
        kind: "terminal",
        sourceDefinitionId: definition.id,
      };
      const runnerTagsBefore = state.runner.tags;
      if (
        addRunnerTagsWithPrevention(
          state,
          legalAction,
          tagAmount,
          definition.id,
        )
      )
        return;
      delete state.pendingAddTagContinuation;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        tagsAdded: Math.max(0, state.runner.tags - runnerTagsBefore),
        runnerTagsAfter: state.runner.tags,
      };
    }
  }

  function resolveRunnerGripHeapStackShuffleDrawEvent(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const cardId = String(legalAction.payload?.cardId);
    const sourceDefinitionId = mustInstance(
      state.cardInstances,
      cardId,
    ).definitionId;
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
      `${sourceDefinitionId}.shuffle_grip_heap_stack:${state.stateVersion + 1}`,
    );
    for (const id of state.runner.stack) {
      state.cardInstances[id] = {
        ...mustInstance(state.cardInstances, id),
        zone: { side: "runner", zone: "stack" },
      };
    }
    const drawSummary = deps.drawRunnerCards(state, 5);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      cardId,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_shuffle_grip_heap_stack_then_draw",
      specialZone: "removed_from_game",
      specialZoneVisibility: "public",
      specialZoneReason: sourceDefinitionId,
    };
    deps.applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
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
      throw new Error(
        "Diese Shuffle-Draw-Implementierung muss die ausgespielte Karte aus dem Spiel entfernen.",
      );
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
    const drawSummary = deps.drawRunnerCards(state, drawCount);
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
    deps.applyRunnerDrawSummaryPayload(state, legalAction, drawSummary);
    return { publicPayload: legalAction.payload ?? payload };
  }

  function startRunnerProgramTrashBeforeInstallChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction: LegalAction,
  ): void {
    if (!state.runner.grip.includes(sourceCardId))
      throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
    const definition = definitionFor(state, sourceCardId);
    if (definition.type !== "program")
      throw new Error(
        "Nur Programme koennen vor der Installation Programmtrash oeffnen.",
      );
    if (
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      deps.availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      throw new Error("Nicht genug Credits fuer die Programminstallation.");
    const options = deps
      .installedRunnerProgramTrashOptionsForInstall(state)
      .map((cardId: CardInstanceId) => {
        const optionDefinition = definitionFor(state, cardId);
        return {
          id: `card_${cardId}`,
          label: optionDefinition.title,
          value: cardId,
        };
      });
    if (options.length === 0)
      throw new Error("Es gibt kein installiertes Programm zum Trashen.");
    if (!deps.runnerProgramInstallMemoryReachableAfterTrash(state, definition))
      throw new Error(
        "Durch Programmtrash kann nicht genug MU freigemacht werden.",
      );
    state.pendingChoice = {
      choiceId: `runner_program_trash_before_install_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner_program_trash_before_install:${sourceCardId}:${state.stateVersion + 1}${runnerInstallPaymentChoiceSourceSuffix(legalAction.payload)}${legalAction.payload?.v1922ValuPakInstallAction === true ? ":valu_pak" : ""}`,
      sourceCardInstanceId: sourceCardId,
      sourceCardDefinitionId: definition.id,
      continuation: {
        family: "runner_program_trash_before_install",
        originActionId: legalAction.actionId,
        sourceCardInstanceId: sourceCardId,
        sourceCardDefinitionId: definition.id,
        ...(typeof legalAction.payload?.selectedCardId === "string"
          ? { selectedCardId: legalAction.payload.selectedCardId }
          : {}),
        ...(typeof legalAction.payload?.selectedSubtype === "string"
          ? { selectedSubtype: legalAction.payload.selectedSubtype }
          : {}),
        createdAtStateVersion: state.stateVersion + 1,
      },
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
    const continuation = choice.continuation;
    if (
      continuation?.family !== "runner_program_trash_before_install" ||
      continuation.createdAtStateVersion !== choice.stateVersion ||
      continuation.originActionId.length === 0 ||
      choice.sourceCardInstanceId !== continuation.sourceCardInstanceId ||
      choice.sourceCardDefinitionId !== continuation.sourceCardDefinitionId
    )
      throw new Error(
        "Die Programmtrash-Installationsfortsetzung ist ungültig.",
      );
    const sourceCardId = continuation.sourceCardInstanceId;
    if (!sourceCardId || !state.runner.grip.includes(sourceCardId))
      throw new Error("Die Programmquelle liegt nicht mehr im Grip.");
    // The authoritative install action may open this choice immediately before
    // another resolver moves the game into a run. The pending choice freezes
    // all other actions, so resolution remains bound to that validated install
    // even if the phase has advanced in the meantime.
    if (state.runner.clicks <= 0)
      throw new Error("Der Runner hat keinen Klick fuer die Installation.");
    const definition = definitionFor(state, sourceCardId);
    if (definition.id !== continuation.sourceCardDefinitionId)
      throw new Error(
        "Die Programmtrash-Installationsquelle stimmt nicht mehr überein.",
      );
    if (definition.type !== "program")
      throw new Error(
        "Nur Programme koennen ueber diese Choice installiert werden.",
      );
    if (
      deps.isUniqueCard(definition) &&
      deps.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
    )
      throw new Error(
        "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
      );
    if (
      deps.availableRunnerProgramInstallCredits(state) <
      (definition.installCost ?? 0)
    )
      throw new Error("Nicht genug Credits fuer die Programminstallation.");

    const trashIds = deps.selectedChoiceCardIds(
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
        if (!deps.runnerProgramUsesMemory(state, cardId)) return sum;
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
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerInstallPaymentPayloadForChoiceSource(choice.source),
      ...(choice.source.split(":").includes("valu_pak")
        ? { v1922ValuPakInstallAction: true }
        : {}),
      cardId: sourceCardId,
      ...(continuation.selectedCardId
        ? { selectedCardId: continuation.selectedCardId }
        : {}),
      ...(continuation.selectedSubtype
        ? { selectedSubtype: continuation.selectedSubtype }
        : {}),
      runnerProgramTrashBeforeInstall: true,
      runnerProgramTrashBeforeInstallResolved: true,
      runnerProgramTrashBeforeInstallCostsPrepaid: true,
      trashedCount: uniqueTrashIds.length,
      ...(trashedDefinitionIds.length > 0
        ? { trashedCardDefinitionIds: trashedDefinitionIds.join(",") }
        : {}),
    };
    const paymentResult = deps.spendRunnerInstallCredits(
      state,
      definition.installCost ?? 0,
      definition.type,
      legalAction.payload,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerInstallPaymentPublicPayload(paymentResult),
    };
    for (const cardId of uniqueTrashIds)
      deps.trashRunnerInstalledCardToHeap(state, cardId);
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
    resolveRunnerGripHeapStackShuffleDrawEvent,
    shuffleGripTrashAndStackThenDrawForCardImplementation,
    startRunnerProgramTrashBeforeInstallChoice,
    resolveRunnerProgramTrashBeforeInstallChoice,
  };
}
