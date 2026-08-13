import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import * as runtimePorts from "./runtime-port-bindings";
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
export { getLegalActions, legalActionsFor } from "../legal-actions";
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
export {
  eventVisibilityForAction,
  isHiddenInfoBarrierEvent,
} from "../events/build-event";
import { configureEventContextHostComposition } from "../events/event-context-hosts";
import { BAD_PUBLICITY_LOSS_THRESHOLD } from "../win-conditions";
export { checkWinConditions } from "../win-conditions";
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
  availableRunnerRunCredits,
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
export { quoteCorpRezCost } from "../payment";
export { createGame, createGameAfterSetup } from "../create-game";
import { hashState } from "../hash";
import { applyAction as applyActionFromGame } from "../apply-action";
export { applyAction } from "../apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "../apply/apply-action-hosts";
export { applyGameAction } from "../apply-game-action";
export { getPlayerView, playerViewFor } from "../player-view";
export { replayEvents, replayGameEvents } from "../replay";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "../view/card-view";
import { toPublicEvent } from "../view/public-event-view";
export { redactPublicEventForSide } from "../view/public-event-view";
export { hashGameState, hashState } from "../hash";
import { validateGameState } from "../validation";
export { validateGameState, validateGameStateForDebug } from "../validation";
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
import type { CardImplementationDefinition } from "../../card-implementations/types";
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

import {
  cloneState,
  agendaPointsForScoredCard,
  corpScoredBlackOpsAgendaLastTurn,
  finishRun,
  isV097OrLater,
  isV099OrLater,
  recurringTraceCreditPoolTotal,
} from "./runtime-bootstrap-support";
import type { RuntimeDeps } from "./runtime-shared";

function accessSourceDefinitionIdsForRuntime(): {
  setup: CardDefinitionId;
  trap: CardDefinitionId;
  crybaby: CardDefinitionId;
  taggedRunnerMeatDamageUpgrade: CardDefinitionId;
  accessNetDamageUpgrade: CardDefinitionId;
  oncePerRunAccessTraceUpgrade: CardDefinitionId;
  hardwareTrashByAdvancementAsset: CardDefinitionId;
  programTrashByAdvancementAsset: CardDefinitionId;
  advancementCoreDamageAsset: CardDefinitionId;
} {
  const unique = (
    sourceKind: string,
    predicate: (
      implementation: (typeof CARD_IMPLEMENTATIONS)[number],
    ) => boolean,
  ): CardDefinitionId => {
    const matches = CARD_IMPLEMENTATIONS.filter(predicate)
      .map((implementation) => implementation.cardDefinitionId)
      .sort();
    if (matches.length !== 1)
      throw new Error(
        `Expected exactly one ${sourceKind} implementation, found ${matches.length}.`,
      );
    return matches[0]!;
  };
  const hasAccessEffect = (
    implementation: (typeof CARD_IMPLEMENTATIONS)[number],
    predicate: (
      effect: NonNullable<typeof implementation.accessEffects>[number],
    ) => boolean,
  ) => implementation.accessEffects?.some(predicate) === true;
  return {
    setup: unique("Setup ambush", (implementation) =>
      hasAccessEffect(
        implementation,
        (effect) =>
          effect.sourceZones.includes("installed") &&
          effect.sourceZones.includes("hq") &&
          effect.sourceZones.includes("rd") &&
          effect.ignoreIfAccessedFrom?.includes("archives") === true &&
          effect.effects.some(
            (candidate) =>
              candidate.kind === "damage" &&
              candidate.damageType === "net" &&
              candidate.amount === 2,
          ) &&
          (effect.installedSourceActivation ?? "requires_rezzed") ===
            "requires_rezzed",
      ),
    ),
    trap: unique("paid net-damage-and-tag ambush", (implementation) =>
      hasAccessEffect(
        implementation,
        (effect) =>
          effect.cost?.kind === "corp_may_pay_credits" &&
          effect.cost.amount === 4 &&
          effect.effects.some(
            (candidate) =>
              candidate.kind === "damage" &&
              candidate.damageType === "net" &&
              candidate.amount === 3,
          ) &&
          effect.effects.some((candidate) => candidate.kind === "add_tags"),
      ),
    ),
    crybaby: unique(
      "link-reduction counter upgrade",
      (implementation) =>
        implementation.remainingReplacementLongtail?.kind ===
          "link_reduction_counter_upgrade" &&
        implementation.remainingReplacementLongtail.counterType === "crying",
    ),
    taggedRunnerMeatDamageUpgrade: unique(
      "tagged-runner meat-damage access effect",
      (implementation) =>
        hasAccessEffect(
          implementation,
          (effect) =>
            effect.condition?.kind === "runner_is_tagged" &&
            effect.effects.some(
              (candidate) =>
                candidate.kind === "damage" && candidate.damageType === "meat",
            ),
        ),
    ),
    accessNetDamageUpgrade: resolveUniqueInstalledNetDamageUpgrade(
      CARD_IMPLEMENTATIONS,
      (definitionId) => CARD_DEFINITIONS_BY_ID[definitionId],
    ),
    oncePerRunAccessTraceUpgrade: unique(
      "once-per-run access trace",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "trace" &&
              "limit" in candidate &&
              candidate.limit === "once_per_run_on_this_fort_per_source",
          ),
        ),
    ),
    hardwareTrashByAdvancementAsset: unique(
      "advancement-scaled hardware-trash access effect",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "trash_installed_runner_cards" &&
              candidate.target === "hardware" &&
              typeof candidate.amount === "object" &&
              candidate.amount.kind === "source_advancement_counter_count",
          ),
        ),
    ),
    programTrashByAdvancementAsset: unique(
      "advancement-scaled program-trash access effect",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "trash_installed_runner_cards" &&
              candidate.target === "program" &&
              typeof candidate.amount === "object" &&
              candidate.amount.kind === "source_advancement_counter_count",
          ),
        ),
    ),
    advancementCoreDamageAsset: unique(
      "advancement-scaled core-damage access effect",
      (implementation) =>
        hasAccessEffect(implementation, (effect) =>
          effect.effects.some(
            (candidate) =>
              candidate.kind === "damage_from_source_advancement_counters" &&
              candidate.damageType === "core",
          ),
        ),
    ),
  };
}

export function resolveUniqueInstalledNetDamageUpgrade(
  implementations: readonly CardImplementationDefinition[],
  definitionFor: (definitionId: CardDefinitionId) => CardDefinition | undefined,
): CardDefinitionId {
  const matches = implementations
    .filter((implementation) =>
      isInstalledNetDamageUpgrade(
        implementation,
        definitionFor(implementation.cardDefinitionId),
      ),
    )
    .map((implementation) => implementation.cardDefinitionId)
    .sort();
  if (matches.length !== 1)
    throw new Error(
      `Expected exactly one installed net-damage upgrade implementation, found ${matches.length}.`,
    );
  return matches[0]!;
}

export function isInstalledNetDamageUpgrade(
  implementation: CardImplementationDefinition,
  definition: CardDefinition | undefined,
): boolean {
  if (definition?.type !== "upgrade") return false;
  const effects = implementation.accessEffects ?? [];
  return effects.some(
    (effect) =>
      effect.kind === "on_access" &&
      effect.sourceZones.length === 1 &&
      effect.sourceZones[0] === "installed" &&
      effect.installedSourceActivation === undefined &&
      effect.condition === undefined &&
      effect.cost === undefined &&
      effect.optional === undefined &&
      effect.effects.length === 1 &&
      effect.effects[0]?.kind === "damage" &&
      effect.effects[0].recipient === "runner" &&
      effect.effects[0].damageType === "net" &&
      effect.effects[0].amount === 1 &&
      effect.effects[0].preventable === true,
  );
}

export function configureFlowRuntimeBootstrap({
  cardImplementationRuntimeDeps,
}: Pick<RuntimeDeps, "cardImplementationRuntimeDeps">) {
  const accessSourceDefinitionIds = accessSourceDefinitionIdsForRuntime();
  function utilityInstalledOnFort(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    kind: Extract<
      CardCorpUtilityImplementation["kind"],
      | "fort_start_reorder_ice"
      | "fort_start_runner_spend_cap"
      | "start_run_redirect_to_source_fort"
    >,
    options: { rezzedOnly?: boolean; unrezzedOnly?: boolean } = {},
  ): CardInstanceId[] {
    return mustServer(state, serverId)
      .root.slice()
      .sort()
      .filter((cardId): cardId is CardInstanceId => {
        const instance = state.cardInstances[cardId];
        if (!instance?.definitionId || instance.controller !== "corp")
          return false;
        if (options.rezzedOnly && instance.rezzed !== true) return false;
        if (options.unrezzedOnly && instance.rezzed === true) return false;
        return (
          corpUtilityImplementationForDefinition(instance.definitionId)
            ?.kind === kind
        );
      });
  }

  function startOfRunRedirectSourceIds(
    state: GameState,
    originalServerId: Exclude<ServerId, "new_remote">,
  ): CardInstanceId[] {
    return state.corp.servers
      .slice()
      .sort((left, right) => left.id.localeCompare(right.id))
      .flatMap((server) =>
        server.id === originalServerId ||
        !canRunnerBeRedirectedToFort(state, server.id)
          ? []
          : utilityInstalledOnFort(
              state,
              server.id,
              "start_run_redirect_to_source_fort",
              {
                rezzedOnly: true,
              },
            ),
      );
  }

  function canRunnerBeRedirectedToFort(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    if (
      isActivityGatedFortRunBlocked(
        runtimePorts.fortRunSideFamiliesHostForState(state),
        serverId,
      )
    )
      return false;
    const upgradeRunStartTax = runtimePorts.runStartTaxForServerUpgrades(
      state,
      serverId,
    );
    const rootAssetRunTax = runtimePorts.runStartTaxForCorpRootAssets(state);
    const runStartTaxCredits =
      upgradeRunStartTax.amount + rootAssetRunTax.amount;
    return (
      runStartTaxCredits === 0 ||
      availableRunnerRunStartCredits(runDurationPaymentHost(state)) >=
        runStartTaxCredits
    );
  }

  function startRunRedirectCostCredits(
    state: GameState,
    sourceCardId: CardInstanceId,
  ): number {
    const utility = runtimePorts.corpUtilityImplementationForCard(
      state,
      sourceCardId,
    );
    if (
      utility?.kind !== "start_run_redirect_to_source_fort" ||
      utility.timing !== "run_start" ||
      utility.redirectTarget !== "source_fort"
    )
      throw new Error("Die Run-Redirect-Quelle ist nicht legal.");
    const credits = Math.max(0, Math.floor(utility.cost.credits));
    if (!Number.isInteger(credits))
      throw new Error("Die Run-Redirect-Kosten sind ungueltig.");
    return credits;
  }

  function openStartOfRunFortUtilityWindow(
    state: GameState,
    legalAction?: LegalAction,
  ): boolean {
    const run = state.run;
    const availableCredits = Math.max(
      0,
      state.corp.credits -
        Math.max(
          0,
          Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
        ),
    );
    if (!run || state.pendingChoice) return false;
    const originalServerId = run.attackedServerId;
    const redirectSourceIds = startOfRunRedirectSourceIds(
      state,
      originalServerId,
    ).filter(
      (cardId) =>
        startRunRedirectCostCredits(state, cardId) <= availableCredits,
    );
    const reorderSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_reorder_ice",
      { rezzedOnly: true },
    );
    const rezzedSpendCapSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_runner_spend_cap",
      { rezzedOnly: true },
    );
    const unrezzedSpendCapSourceIds = utilityInstalledOnFort(
      state,
      originalServerId,
      "fort_start_runner_spend_cap",
      { unrezzedOnly: true },
    ).filter((cardId) => state.corp.credits >= rezCostForCard(state, cardId));
    if (
      redirectSourceIds.length === 0 &&
      reorderSourceIds.length === 0 &&
      rezzedSpendCapSourceIds.length === 0 &&
      unrezzedSpendCapSourceIds.length === 0
    )
      return false;
    if (
      redirectSourceIds.length === 0 &&
      reorderSourceIds.length === 0 &&
      unrezzedSpendCapSourceIds.length === 0 &&
      rezzedSpendCapSourceIds.length > 0
    ) {
      openRunnerRunSpendCapChoice(
        state,
        rezzedSpendCapSourceIds[0]!,
        legalAction,
      );
      return true;
    }
    run.runStartInterventions = redirectSourceIds.map((cardId) => {
      const targetServerId = corpServerIdForInstalledCard(state, cardId);
      if (!targetServerId)
        throw new Error("Die Redirect-Quelle liegt nicht in einem Korp-Fort.");
      return {
        kind: "start_run_redirect_to_source_fort",
        originalServerId,
        sourceCardInstanceId: cardId,
        sourceDefinitionId: definitionFor(state, cardId).id,
        targetServerId,
        costCredits: startRunRedirectCostCredits(state, cardId),
      };
    });
    state.pendingChoice = {
      choiceId: `corp_start_of_run_redirect_${state.stateVersion + 1}`,
      side: "corp",
      source: `corp.start_of_run_redirect:${run.runId}:${originalServerId}`,
      prompt: "Start-of-run Utility",
      kind: "select_option",
      options: [
        { id: "pass", label: "Run nicht umlenken" },
        ...redirectSourceIds.map((cardId) => {
          const targetServerId = corpServerIdForInstalledCard(state, cardId);
          if (!targetServerId)
            throw new Error(
              "Die Redirect-Quelle liegt nicht in einem Korp-Fort.",
            );
          return {
            id: `redirect_${cardId}`,
            label: `${definitionFor(state, cardId).title}: Run umlenken`,
            publicLabel: "Start-of-run Redirect",
            value: cardId,
            serverId: targetServerId,
          };
        }),
        ...reorderSourceIds.map((cardId) => ({
          id: `herman_${cardId}`,
          label: `${definitionFor(state, cardId).title}: ICE neu anordnen`,
          publicLabel: "Start-of-run Fort-Utility",
          value: cardId,
          serverId: originalServerId,
        })),
        ...rezzedSpendCapSourceIds.map((cardId) => ({
          id: `obfuscated_${cardId}`,
          label: `${definitionFor(state, cardId).title}: Ansage erzwingen`,
          publicLabel: "Start-of-run Spend-Cap",
          value: cardId,
          serverId: originalServerId,
        })),
        ...unrezzedSpendCapSourceIds.map((cardId) => ({
          id: `obfuscated_rez_${cardId}`,
          label: `${definitionFor(state, cardId).title}: rezzen und Ansage erzwingen`,
          publicLabel: "Start-of-run Rez",
          value: cardId,
          serverId: originalServerId,
        })),
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "corp";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        startOfRunRedirectWindowOpened: true,
        originalServerId,
        redirectSourceDefinitionIds: run.runStartInterventions
          .map((intervention) => intervention.sourceDefinitionId)
          .sort()
          .join(","),
      };
    }
    return true;
  }

  function openRunnerRunSpendCapChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    const run = mustRun(state);
    const source = mustInstance(state.cardInstances, sourceCardId);
    const serverId = corpServerIdForInstalledCard(state, sourceCardId);
    if (!serverId)
      throw new Error("Die Spend-Cap-Quelle liegt nicht in einem Korp-Fort.");
    if (serverId !== run.attackedServerId)
      throw new Error(
        "Die Spend-Cap-Quelle liegt nicht auf dem laufenden Fort.",
      );
    if (
      !source.rezzed ||
      corpUtilityImplementationForDefinition(source.definitionId)?.kind !==
        "fort_start_runner_spend_cap"
    )
      throw new Error("Die Spend-Cap-Quelle ist nicht rezzed.");
    const maxAnnouncement = Math.max(
      0,
      Math.floor(availableRunnerRunCredits(runDurationPaymentHost(state))),
    );
    state.pendingChoice = {
      choiceId: `runner_run_spend_cap_${state.stateVersion + 1}`,
      side: "runner",
      source: `corp.start_of_run_redirect.runner_spend_cap:${run.runId}:${sourceCardId}:${serverId}`,
      prompt: "Run-Bit-Ausgabe ansagen",
      kind: "select_option",
      options: Array.from({ length: maxAnnouncement + 1 }, (_, amount) => ({
        id: `spend_${amount}`,
        label: `${amount}`,
        value: amount,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
    state.activeSide = "runner";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        runCreditSpendCapChoiceOpened: true,
        sourceDefinitionId: source.definitionId,
        serverId,
      };
    }
  }

  function canReplaceFortCardsFromHq(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ): boolean {
    const server = mustServer(state, serverId);
    const removedCount = server.root.length;
    if (removedCount === 0) return true;
    const candidates = state.corp.hq
      .filter((cardId) => {
        const definition = definitionFor(state, cardId);
        return (
          definition.side === "corp" &&
          (definition.type === "asset" ||
            definition.type === "agenda" ||
            definition.type === "upgrade")
        );
      })
      .sort();
    const orderIsLegal = (order: CardInstanceId[]): boolean => {
      const testState = cloneState(state);
      const testServer = mustServer(testState, server.id);
      testServer.root = [];
      for (const cardId of order) {
        const definition = definitionFor(testState, cardId);
        removeFromAllZones(testState, cardId);
        if (
          !runtimePorts.canInstallCorpRootCardInServer(
            testState,
            definition,
            testServer,
          )
        )
          return false;
        testServer.root.push(cardId);
        testState.cardInstances[cardId] = {
          ...mustInstance(testState.cardInstances, cardId),
          zone: { side: "corp", zone: "serverRoot", serverId: testServer.id },
        };
        if (
          corpRootMainCardIdsInServer(testState, testServer).length >
          runtimePorts.corpRootAgendaOrNodeCapacityInServer(
            testState,
            testServer,
          )
        )
          return false;
      }
      return true;
    };
    const visit = (startIndex: number, selected: CardInstanceId[]): boolean => {
      if (selected.length === removedCount) return orderIsLegal(selected);
      for (let index = startIndex; index < candidates.length; index += 1) {
        if (visit(index + 1, [...selected, candidates[index]!])) return true;
      }
      return false;
    };
    return visit(0, []);
  }

  function spendCorpRunTemporaryCreditsForCurrentRunCost(
    state: GameState,
    amount: number,
  ): void {
    if (amount <= 0) return;
    if (!state.run) throw new Error("Run-Kosten brauchen einen laufenden Run.");
    const installRezReserved = Math.max(
      0,
      Math.floor(state.corpTemporaryInstallRezCredits?.remaining ?? 0),
    );
    const spendableCorpCredits = Math.max(
      0,
      state.corp.credits - installRezReserved,
    );
    if (spendableCorpCredits < amount)
      throw new Error("Die Korp kann die Run-Kosten nicht bezahlen.");
    const runTemporarySpend = Math.min(
      amount,
      Math.max(
        0,
        Math.floor(state.run.corpRunTemporaryCredits?.remaining ?? 0),
      ),
    );
    if (runTemporarySpend > 0 && state.run.corpRunTemporaryCredits)
      state.run.corpRunTemporaryCredits.remaining = Math.max(
        0,
        state.run.corpRunTemporaryCredits.remaining - runTemporarySpend,
      );
    state.corp.credits -= amount;
  }

  function resolveTestSpinRunEnd(
    state: GameState,
    run: NonNullable<GameState["run"]>,
    legalAction?: LegalAction,
  ): { handled: boolean; stateChanged?: boolean } {
    const pending = run.testSpinTemporaryInstall;
    if (!pending) return { handled: false };
    const sourceDefinition = CARD_DEFINITIONS_BY_ID[pending.sourceDefinitionId];
    const instance = state.cardInstances[pending.cardId];
    if (
      instance &&
      state.runner.rig.programs.includes(pending.cardId) &&
      instance.zone.side === "runner" &&
      instance.zone.zone === "rig"
    ) {
      const definition = definitionFor(state, pending.cardId);
      removeFromAllZones(state, pending.cardId);
      state.runner.stack.push(pending.cardId);
      if (runtimePorts.runnerProgramUsesMemory(state, pending.cardId)) {
        state.runner.memoryUsed = Math.max(
          0,
          state.runner.memoryUsed - (definition.memoryCost ?? 0),
        );
      }
      state.cardInstances[pending.cardId] = {
        ...cardInstanceWithoutCounters(instance),
        faceup: false,
        rezzed: false,
        zone: { side: "runner", zone: "stack" },
      };
      runtimePorts.shuffleRunnerStack(
        state,
        `run_end.test_spin.return_to_stack.${run.runId}.${pending.cardId}`,
      );
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "pro018_test_spin_return_to_stack",
          sourceDefinitionId: pending.sourceDefinitionId,
          sourceTitle: sourceDefinition?.title ?? "Test Spin",
          returnedProgramDefinitionId: definition.id,
          returnedToStack: true,
          shufflePerformed: true,
          shuffled: true,
          randomCounterAfter: state.randomCounter,
        };
      }
      return { handled: true, stateChanged: true };
    }
    const penalty = 4 + Math.max(0, Math.floor(pending.installCostPenalty));
    const paid = Math.min(state.runner.credits, penalty);
    if (paid > 0) spendCredits(state, "runner", paid);
    const unpaid = penalty - paid;
    let damageSummary: DamageSummary | undefined;
    if (unpaid > 0) {
      damageSummary = doDamage(state, {
        damageId: `${run.runId}.${pending.sourceDefinitionId}.test_spin_penalty`,
        damageType: "meat",
        amount: unpaid,
        source: `run_end:${pending.sourceDefinitionId}`,
      });
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "pro018_test_spin_penalty",
        sourceDefinitionId: pending.sourceDefinitionId,
        sourceTitle: sourceDefinition?.title ?? "Test Spin",
        returnedToStack: false,
        penaltyAmount: penalty,
        penaltyCreditsPaid: paid,
        runnerCreditsAfter: state.runner.credits,
        ...(damageSummary
          ? {
              damageResolved: true,
              damageType: damageSummary.damageType,
              damageAmount: damageSummary.amount,
              cardsTrashed: damageSummary.cardsTrashed,
              flatline: damageSummary.flatline,
            }
          : {}),
      };
    }
    return { handled: true, stateChanged: true };
  }

  const runAccessLegalActionHostComposition =
    createRunAccessLegalActionHostComposition({
      cards: {
        definitionFor,
        cardInstanceFor: (state, cardId) =>
          mustInstance(state.cardInstances, cardId),
        cardHasSubtype: runtimePorts.cardHasSubtype,
        runnerProgramUsesMemory: runtimePorts.runnerProgramUsesMemory,
        runnerInstalledCardIds,
        publicInstalledCorpCardIdentityKnown,
        effectiveSubtypesForCard: runtimePorts.effectiveSubtypesForCard,
        hostedProgramStrengthModifier:
          runtimePorts.hostedProgramStrengthModifier,
        icebreakerEncounterStrengthBonus:
          runtimePorts.icebreakerEncounterStrengthBonus,
        permanentIcebreakerStrengthCounterBonus:
          runtimePorts.permanentIcebreakerStrengthCounterBonus,
        canReplaceFortCardsFromHq,
      },
      servers: {
        mustServer,
        publicServerLabel,
        randomHqAccess,
      },
      access: {
        hasHiddenResourceAccessStartActions:
          runtimePorts.hasHiddenResourceAccessStartActions,
        advanceArchivesBreachPastNonDecisionCards,
        startRunnerPrivateLookChoice: runtimePorts.startRunnerPrivateLookChoice,
      },
      run: {
        currentRun: mustRun,
        currentEncounterSubroutines:
          runtimePorts.subroutinesForCurrentEncounter,
        runRemainderStrengthBonusForBreaker:
          runtimePorts.runRemainderStrengthBonusForBreaker,
        beginRunnerRunStartOrdering: runtimePorts.beginRunnerRunStartOrdering,
        applyRunnerTraceCounterRunStartEffects:
          runtimePorts.applyRunnerTraceCounterRunStartEffects,
        applyRunStartRandomStrengthBonus:
          runtimePorts.applyRunStartRandomStrengthBonus,
        openStartOfRunFortUtilityWindow,
        finishRun,
        successfulRunInterventionHost:
          runtimePorts.successfulRunInterventionHost,
        startPostAccessInstalledProgramChoice:
          runtimePorts.startPostAccessInstalledProgramChoice,
      },
      payment: {
        spendCredits,
        credits,
        rezCostForCard,
        creditCostForAction: runtimePorts.creditCostForAction,
        hostedPaymentCredits,
        spendCorpRunTemporaryCreditsForCurrentRunCost,
        restrictedHostedCreditSourceIds,
        isRestrictedHostedCreditSource,
        spendRunnerAccessTrashCredits:
          runtimePorts.spendRunnerAccessTrashCredits,
      },
      choices: {
        hiddenZoneArrangeChoiceHandlerHost:
          runtimePorts.hiddenZoneArrangeChoiceHandlerHost,
        openRunnerInstalledTrashPreventionWindow,
        startRunnerInstalledMultiTrashChoice: (
          state,
          legalAction,
          sourceCardId,
          input,
          eligibleCardIds,
        ) => {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            cardId: sourceCardId,
          };
          runtimePorts.startRunnerInstalledMultiTrashChoice(
            state,
            legalAction,
            input,
            eligibleCardIds,
          );
        },
      },
      cardImplementation: {
        accessEffectsForDefinition: (definitionId) =>
          cardImplementationForDefinitionId(definitionId)?.accessEffects ?? [],
        hiddenReplacementLongtailKindForDefinition: (definitionId) =>
          cardImplementationForDefinitionId(definitionId)
            ?.hiddenReplacementLongtail?.kind,
        accessHookKindsForDefinition: (definitionId) =>
          cardImplementationForDefinitionId(definitionId)?.accessHooks?.map(
            (hook) => hook.kind,
          ) ?? [],
        runCardImplementationActionHost:
          runtimePorts.runCardImplementationActionHost,
      },
      constants: {
        setup: accessSourceDefinitionIds.setup,
        trap: accessSourceDefinitionIds.trap,
        crybaby: accessSourceDefinitionIds.crybaby,
        taggedRunnerMeatDamageUpgrade:
          accessSourceDefinitionIds.taggedRunnerMeatDamageUpgrade,
        accessNetDamageUpgrade:
          accessSourceDefinitionIds.accessNetDamageUpgrade,
        oncePerRunAccessTraceUpgrade:
          accessSourceDefinitionIds.oncePerRunAccessTraceUpgrade,
        hardwareTrashByAdvancementAsset:
          accessSourceDefinitionIds.hardwareTrashByAdvancementAsset,
        programTrashByAdvancementAsset:
          accessSourceDefinitionIds.programTrashByAdvancementAsset,
        advancementCoreDamageAsset:
          accessSourceDefinitionIds.advancementCoreDamageAsset,
      },
      callbacks: {
        rules: {
          isV097OrLater,
          isV099OrLater,
        },
        turn: {
          ensureRunnerTurnFlags,
          consumeRunnerFutureActionDebt:
            runtimePorts.consumeRunnerFutureActionDebt,
        },
        trace: {
          calculateRunnerLink: (state) =>
            calculateRunnerLinkInTrace(
              runtimePorts.traceOrchestrationHost(state),
            ),
          traceBidChoice,
          addCorpTraceCounterPoolCounters:
            runtimePorts.addCorpTraceCounterPoolCounters,
          corpTraceCounterPoolTotal: runtimePorts.corpTraceCounterPoolTotal,
          recurringTraceCreditPoolTotal,
          rabbitTraceLimitReductionForIceTrace:
            runtimePorts.rabbitTraceLimitReductionForIceTrace,
          resolveTraceHardwareWreckerSuccess:
            runtimePorts.resolveTraceHardwareWreckerSuccess,
          resolveTraceTrashRunnerResourceSuccess:
            runtimePorts.resolveTraceTrashRunnerResourceSuccess,
          supportsTraceSuccessEffect: (effect) =>
            isSupportedEncounterTraceSuccessEffect(
              effect,
              runtimePorts.traceCounterEffectDefinitionFor,
            ),
          startTraceFromOperation: (
            state,
            sourceDefinitionId,
            traceLimit,
            legalAction,
            successEffect,
          ) =>
            startTraceFromOperationInTrace(
              runtimePorts.traceOrchestrationHost(state),
              sourceDefinitionId,
              traceLimit,
              legalAction,
              successEffect,
            ),
          traceSuccessEffectForCardImplementation,
        },
        damage: {
          addRunnerTagsWithPrevention,
          createDamageImminentEvent,
          doDamage,
          openDamageResolutionWindow,
          openEventModificationWindow,
          openReplacementWindow,
          resolveDamageImminentEvent,
          setDamagePayload,
          resolveDamageOperation,
        },
        tags: {
          addRunnerTagsWithPrevention,
        },
        counters: {
          cardCounter,
          addCardCounter,
          setCardCounter,
          spendCardCounter,
          addVirusCounterWithCounterPrevention:
            runtimePorts.addVirusCounterWithCounterPrevention,
          preventOneVirusCounterWithCounterPrevention:
            runtimePorts.preventOneVirusCounterWithCounterPrevention,
          poxCountersForServer: runtimePorts.poxCountersForServer,
          addCounterToAllInstalledRunnerIcebreakers:
            runtimePorts.addCounterToAllInstalledRunnerIcebreakers,
        },
        ice: {
          strengthForIce: runtimePorts.iceStrengthFor,
          icebreakerHasSpecial: (state, breakerId, special) =>
            runtimePorts.icebreakerHasSpecial(
              state,
              breakerId,
              special as NonNullable<RuntimeIcebreakerAbility["special"]>,
            ),
          selectedServerIcebreakerStrengthCounterBonus:
            runtimePorts.selectedServerIcebreakerStrengthCounterBonus,
          resetBreakerStrength,
          withoutVariableIceState: runtimePorts.withoutVariableIceState,
        },
        zones: {
          removeFromAllZones,
          trashCorpInstalledCardToArchives:
            runtimePorts.trashCorpInstalledCardToArchives,
          trashRunnerInstalledCardToHeap:
            runtimePorts.trashRunnerInstalledCardToHeap,
          trashRunnerInstalledProgram: runtimePorts.trashRunnerInstalledProgram,
          cleanupEmptyRemotes,
          ensureSpecialZones,
          shuffleCorpCardIntoRd: runtimePorts.shuffleCorpCardIntoRd,
          returnRunnerInstalledProgramsToGripForAccess:
            runtimePorts.returnRunnerInstalledProgramsToGripForAccess,
        },
        effects: {
          executeEffectCommands: runtimePorts.executeEffectCommands,
          breakAbilityForLegalAction: runtimePorts.breakAbilityForLegalAction,
          breakSubroutineCostBreakdown:
            runtimePorts.breakSubroutineCostBreakdown,
          abilityMetadata: runtimePorts.abilityMetadata,
          revealCorpRdTop: runtimePorts.revealCorpRdTop,
        },
        rng: {
          nextRandom,
          rollDie: rollDeterministicDie,
          shuffleStateIds,
        },
        misc: {
          drawCorpCards,
          drawRunnerCards: runtimePorts.drawRunnerCards,
          awardRunnerEventAgendaPoint: runtimePorts.awardRunnerEventAgendaPoint,
          activeObligationCount: runtimePorts.activeObligationCount,
          addActiveObligation: runtimePorts.addActiveObligation,
          applyRunnerForgoNextAction: runtimePorts.applyRunnerForgoNextAction,
          hasInstalledRunnerApDamageReducerHardware:
            runtimePorts.hasInstalledRunnerApDamageReducerHardware,
          traceCounterEffectDefinitionFor:
            runtimePorts.traceCounterEffectDefinitionFor,
          installedRunnerVirusSourceIds:
            runtimePorts.installedRunnerVirusSourceIds,
          virusCounterImplementationForCard:
            runtimePorts.virusCounterImplementationForCard,
          agendaPointsForScoredCard,
          snapshotPersistentStealCostModifiersForSource,
          archivesAccessRequiresDecisionOrEffect:
            runtimePorts.archivesAccessRequiresDecisionOrEffect,
          resolveTestSpinRunEnd,
          rezIceWithoutRunContinuation: (state, cardId, legalAction) =>
            executeRezCard(
              runtimePorts.rezCardHost(state),
              cardId,
              false,
              legalAction,
              { runContinuation: "none" },
            ),
          installedRevealHelperCount: (state) =>
            runtimePorts.v1915InstalledRevealHelperIds(state).length,
        },
      },
    } satisfies RunAccessLegalActionHostCompositionHost);

  const runFlow = runAccessLegalActionHostComposition.runFlow;
  const accessFlow = runAccessLegalActionHostComposition.accessFlow;

  configureEventContextHostComposition({
    cards: {
      agendaPointsForScoredCard,
      cardCounter,
      hostedProgramStrengthModifier: runtimePorts.hostedProgramStrengthModifier,
    },
    publicContext: {
      creditCostForAction: runtimePorts.creditCostForAction,
      pumpAmountForLegalAction: runtimePorts.pumpAmountForLegalAction,
    },
    callbacks: {
      breachStateHost: runtimePorts.breachStateHost,
      installedAccessBonusForServer,
      runnerHqAccessBonusForBreach,
    },
    constants: {
      badPublicityLossThreshold: BAD_PUBLICITY_LOSS_THRESHOLD,
    },
  });
  type VisibleCounterPayload = {
    counterType: CounterType;
    addedCounterAmount?: number;
    removedCounterAmount?: number;
    remainingCounters: number;
  };

  const damageCoreHost: DamageCoreHost = {
    cards: {
      definitionFor,
      runnerInstalledCardIds,
      scoredCorpAgendaIds,
      scoredAgendaKindForDefinition: runtimePorts.scoredAgendaKindForDefinition,
    },
    zones: {
      removeFromAllZones,
      trashRunnerInstalledCardToHeap:
        runtimePorts.trashRunnerInstalledCardToHeap,
      trashRunnerInstalledCardsToHeapBatch:
        runtimePorts.trashRunnerInstalledCardsToHeapBatch,
      returnRunnerInstalledCardToGrip:
        runtimePorts.returnRunnerInstalledCardToGrip,
    },
    runner: {
      drawRunnerCard: runtimePorts.drawRunnerCard,
      ensureRunnerTurnFlags,
      addFutureActionDebt: runtimePorts.addRunnerFutureActionDebt,
    },
    corp: {
      agendaPointTotal: runtimePorts.corpAgendaPointTotal,
      chooseAgendasForPointCost: runtimePorts.chooseCorpAgendasForPointCost,
      agendaPointsForScoredCard,
      forfeitAgendaForPointCost: runtimePorts.forfeitCorpAgendaForPointCost,
      spendAgendaPointCost: runtimePorts.spendCorpAgendaPointCost,
    },
    counters: {
      cardCounter: (state, cardId, counterType) =>
        cardCounter(state, cardId, counterType as CounterType),
      spendCardCounter: (state, cardId, counterType, amount) =>
        spendCardCounter(state, cardId, counterType as CounterType, amount),
    },
    credits: {
      gain: credits,
      spend: spendCredits,
    },
    rng: {
      nextRandom,
    },
    reactions: {
      openPostMeatDamageReactionWindow:
        runtimePorts.openPostMeatDamageReactionWindow,
    },
  };

  configureDamageCoreHost(damageCoreHost);

  return {
    runAccessLegalActionHostComposition,
    runFlow,
    accessFlow,
    damageCoreHost,
  };
}
