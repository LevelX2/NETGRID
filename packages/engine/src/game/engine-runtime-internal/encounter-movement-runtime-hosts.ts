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
  recordRunEndTrashBreakerUsage,
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
  applyOncePerRunBreakTagAndAllStealthLoss,
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

export function createEncounterMovementRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps,
): import("./encounter-movement-runtime-port").EncounterMovementRuntimePort {
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
    deps.assertCurrentSubroutineMatchesLegalAction(
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

    const sourceDefinitionId = definitionFor(state, breakerId).id;
    const die = rollDeterministicDie(
      state,
      `icebreaker.random_break_or_damage.${sourceDefinitionId}.${run.runId}.${encounteredIceId}.${breakerId}.${subroutineIndex}`,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      randomBreakOutcomeKind: "random_break_or_damage",
      randomBreakOutcomeRoll: die,
    };
    if (die >= 4) {
      deps.executeEffectCommands(state, [
        { type: "break_subroutine", subroutineIndex },
      ]);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        randomBreakOutcomeSuccess: true,
        randomBreakOutcomeDamageAmount: 0,
      };
      return;
    }

    const damageSummary = doDamage(state, {
      damageId: `v190.blink.${run.runId}.${encounteredIceId}.${breakerId}.${subroutineIndex}`,
      damageType: "net",
      amount: die,
      source: `ability:${sourceDefinitionId}`,
    });
    setDamagePayload(legalAction, damageSummary);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      randomBreakOutcomeSuccess: false,
      randomBreakOutcomeDamageAmount: die,
    };
  }

  function recordBartmossEncounterUsage(
    state: GameState,
    breakerId: CardInstanceId,
  ): void {
    const run = state.run;
    if (!run || run.phase !== "encounter_ice") return;
    if (
      !icebreakerHasSpecial(
        state,
        breakerId,
        "bartmoss_post_encounter_self_trash_check",
      )
    )
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
    if (
      !run ||
      !icebreakerHasSpecial(
        state,
        breakerId,
        "snowball_run_strength_per_successful_break",
      )
    )
      return;
    const breakerState = run.breakerState ?? {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [],
    };
    run.breakerState = {
      ...breakerState,
      brokenSubroutineCountByBreakerInstanceId: {
        ...breakerState.brokenSubroutineCountByBreakerInstanceId,
        [breakerId]:
          (breakerState.brokenSubroutineCountByBreakerInstanceId[breakerId] ??
            0) + 1,
      },
      strengthModifiersByBreakerInstanceId: {
        ...breakerState.strengthModifiersByBreakerInstanceId,
        [breakerId]: [
          ...(breakerState.strengthModifiersByBreakerInstanceId[breakerId] ??
            []),
          { amount: 1, duration: "current_run", source: "successful_break" },
        ],
      },
    };
  }

  function icebreakerHasSpecial(
    state: GameState,
    breakerId: CardInstanceId,
    special: NonNullable<RuntimeIcebreakerAbility["special"]>,
  ): boolean {
    if (!state.cardInstances[breakerId]) return false;
    return icebreakerAbilitiesForDefinition(
      definitionFor(state, breakerId),
    ).some((ability) => ability.special === special);
  }

  function runnerAccessActionHost(state: GameState): RunnerAccessActionHost {
    return deps.accessFlow.runnerAccessActionHost(state);
  }

  function runnerEncounterActionHostForState(
    state: GameState,
  ): RunnerEncounterActionHost {
    return deps.runFlow.runnerEncounterActionHostForState(state);
  }

  function runMovementHostForState(state: GameState): RunMovementHost {
    return deps.runFlow.runMovementHostForState(state);
  }

  function runRezWindowHostForState(state: GameState): RunRezWindowHost {
    return deps.runFlow.runRezWindowHostForState(state);
  }

  function fortPassWindowHostForState(state: GameState): FortPassWindowHost {
    return deps.runFlow.fortPassWindowHostForState(state);
  }

  function fortRunSideFamiliesHostForState(
    state: GameState,
  ): FortRunSideFamiliesHost {
    return deps.runFlow.fortRunSideFamiliesHostForState(state);
  }

  function encounterEntryHostForState(state: GameState): EncounterEntryHost {
    return deps.runFlow.encounterEntryHostForState(state);
  }

  function successfulRunInterventionHost(
    state: GameState,
  ): SuccessfulRunInterventionHost {
    return deps.runFlow.successfulRunInterventionHost(state);
  }

  function encounterResolutionHostForState(
    state: GameState,
  ): EncounterResolutionHost {
    return deps.runFlow.encounterResolutionHostForState(state);
  }

  function encounterSpecialWindowHostForState(
    state: GameState,
  ): EncounterSpecialWindowHost {
    return deps.runFlow.encounterSpecialWindowHostForState(state);
  }

  function encounterPrintedEffectHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedEffectHost {
    return deps.runFlow.encounterPrintedEffectHostForState(state, legalAction);
  }

  function encounterPrintedNonTraceHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedNonTraceHost {
    return deps.runFlow.encounterPrintedNonTraceHostForState(
      state,
      legalAction,
    );
  }

  function runEndCleanupHost(state: GameState): RunEndCleanupHost {
    return deps.runFlow.runEndCleanupHost(state);
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
          deps.effectiveSubtypesForCard(state, cardId, definition),
      },
      run: {
        currentRun: () => mustRun(state),
        currentEncounterSubroutines: (iceDefinition) =>
          deps.subroutinesForCurrentEncounter(state, iceDefinition),
        runRemainderStrengthBonusForBreaker:
          deps.runRemainderStrengthBonusForBreaker,
        finishRun: (successful, legalAction) =>
          deps.finishRun(state, successful, legalAction),
      },
      breaker: {
        pumpAbilityForLegalAction: (legalAction) =>
          deps.pumpAbilityForLegalAction(state, legalAction),
        pumpAmountForLegalAction: (legalAction) =>
          deps.pumpAmountForLegalAction(state, legalAction),
        pumpDurationForLegalAction: (legalAction) =>
          deps.pumpDurationForLegalAction(state, legalAction),
        breakAbilityForLegalAction: (legalAction) =>
          deps.breakAbilityForLegalAction(state, legalAction),
        assertCurrentSubroutineMatchesLegalAction: (
          iceDefinition,
          subroutineIndex,
          legalAction,
        ) =>
          deps.assertCurrentSubroutineMatchesLegalAction(
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
          deps.assertBreakSubroutineCostQuoteValid(
            state,
            breakerId,
            legalAction,
            subroutine,
          ),
        resolveMultiBreakSubroutinesAction: (breakerId, legalAction) =>
          deps.resolveMultiBreakSubroutinesAction(
            state,
            breakerId,
            legalAction,
          ),
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
        spendRunnerRunCredits: (amount, breakerId, legalAction) =>
          spendRunnerRunCredits(
            runDurationPaymentHost(state),
            amount,
            breakerId,
            legalAction,
          ),
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
        applyOncePerRunBreakTagAndAllStealthLoss: (breakerId, legalAction) =>
          applyOncePerRunBreakTagAndAllStealthLoss(
            fortRunSideFamiliesHostForState(state),
            breakerId,
            legalAction,
          ),
      },
      effects: {
        executeEffectCommands: (commands) =>
          deps.executeEffectCommands(state, commands),
        addRunnerFutureActionDebt: (amount) =>
          deps.addRunnerFutureActionDebt(state, amount),
      },
      turn: {
        ensureRunnerTurnFlags: () => ensureRunnerTurnFlags(state),
      },
      tracking: {
        recordBartmossEncounterUsage: (breakerId) =>
          recordBartmossEncounterUsage(state, breakerId),
        recordFortBoundBreakerUsage: (breakerId, awardsRunEndCounter) =>
          recordFortBoundBreakerUsage(
            runEndCleanupHost(state),
            breakerId,
            awardsRunEndCounter,
          ),
        recordSnowballBreakUsage: (breakerId) =>
          recordSnowballBreakUsage(state, breakerId),
        recordRunEndTrashBreakerUsage: (breakerId) =>
          recordRunEndTrashBreakerUsage(runEndCleanupHost(state), breakerId),
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
        startRun: (serverId, legalAction, options) =>
          runtime.startRun(state, serverId, undefined, 1, options, legalAction),
        activeRunActionSpendingCapSourceIds: () =>
          activeRunActionSpendingCapSourceIds(runDurationPaymentHost(state)),
      },
    };
  }

  function rezActionExecutionHost(state: GameState): RezActionExecutionHost {
    return {
      rez: {
        executeRezCard: (cardId, rootRez, legalAction) =>
          executeRezCard(deps.rezCardHost(state), cardId, rootRez, legalAction),
        expireScoredAgendaInstallRezCreditAbilities: () =>
          deps.expireScoredAgendaInstallRezCreditAbilities(state),
      },
      run: {
        passCorpRunRootRezWindow: (legalAction) =>
          passCorpRunRootRezWindow(
            runRezWindowHostForState(state),
            legalAction,
          ),
        passApproachedIce: (legalAction) =>
          passApproachedIce(runMovementHostForState(state), legalAction),
      },
    };
  }

  return {
    resolveBlinkBreakSubroutineAction,
    recordBartmossEncounterUsage,
    recordSnowballBreakUsage,
    icebreakerHasSpecial,
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
  };
}
