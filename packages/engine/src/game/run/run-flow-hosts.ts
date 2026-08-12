import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  CounterType,
  EffectCommand,
  GameState,
  LegalAction,
  ServerId,
  Side,
  SubroutineDefinition,
  TraceSuccessEffect,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { credits } from "../state/economy-mutation";
import {
  addRunnerTagsWithPrevention,
  createDamageImminentEvent,
  doDamage,
  openDamageResolutionWindow,
  openEventModificationWindow,
  openReplacementWindow,
  resolveDamageImminentEvent,
  setDamagePayload,
} from "../damage/damage-core";
import { buildLegalAction as action } from "../turn/action-builders";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";
import {
  startCorpRdArrangeChoice,
  type HiddenZoneArrangeChoiceHandlerHost,
} from "../hidden-zone/arrange-choice-handlers";
import type { BreachStateHost } from "../access/breach-state";
import type { AccessFlowHost } from "../access/access-flow";
import {
  enterAccessFromSuccessfulRun,
  type RunAccessTransitionHost,
} from "./run-access-transition";
import {
  startRun as startRunFromRunCore,
  type RunCoreExecutionHost,
  type StartRunOptions,
} from "./run-core-execution";
import {
  continueRun as continueRunFromRunContinuation,
  type RunContinuationExecutionHost,
} from "./run-continuation-execution";
import {
  applySuccessfulRunExtraRunFollowup,
  applySuccessfulRunEndCreditTriggers,
  buildSuccessfulRunFollowupActions,
  cleanupDelayedSuccessfulRunTemporaryIce,
  successfulRunInterventionCost,
  successfulRunInterventionKindForDefinition,
  type SuccessfulRunInterventionHost,
} from "./successful-run-interventions";
import {
  resetBreakerStrength,
  type RunEndCleanupHost,
} from "./run-end-cleanup";
import {
  availableRunnerRunCredits,
  hostedPaymentCredits,
  isRestrictedHostedCreditSource,
  restrictedHostedCreditSourceIds,
  runDurationPaymentHost,
  runJackOutAdditionalCost,
  spendHostedPaymentCredits,
} from "./run-duration-payment";
import {
  encounterPrintedNonTraceHost,
  resolveTraceSuccessTrashProgramSubroutine,
  type EncounterPrintedNonTraceHost,
} from "./encounter-printed-nontrace-effects";
import {
  encounterPrintedEffectHost,
  isSupportedEncounterTraceSuccessEffect,
  type EncounterPrintedEffectHost,
} from "./encounter-printed-effects";
import {
  encounterSpecialWindowHost,
  fullyBrokenPassedIcePostPassActions,
  fullyBrokenPassedIceTrashPostPassActions,
  type EncounterSpecialWindowHost,
} from "./encounter-special-windows";
import {
  encounterResolutionHost as createEncounterResolutionHost,
  type EncounterResolutionHost,
} from "./encounter-resolution";
import {
  beginEncounter,
  continueAfterCorpRootRezIfWindowIsComplete,
  approachIceExposeCanBeOfferedForCurrentIce,
  type EncounterEntryHost,
} from "./encounter-entry";
import {
  buildCanonicalPaidIceRezActions,
  corpRunRootRezActionsAvailable,
  isCorpRunRootRezWindowOpen,
  passCorpRunRootRezWindow,
  type RunRezWindowHost,
} from "./run-rez-window";
import type { FortPassWindowHost } from "./fort-pass-window";
import {
  isTokyoUnsuccessfulRunSource,
  fortTraceBitPoolSource,
  runnerCanUseBreakerOnCurrentFort,
  tokyoUnsuccessfulRunAmountForCard,
  type FortRunSideFamiliesHost,
} from "./fort-run-side-families";
import {
  approachOrEncounterIce,
  continueAfterMovementRezWindow,
  passApproachedIce,
  type RunMovementHost,
} from "./run-movement";
import type { RunnerEncounterActionHost } from "./encounter-actions";
import type { RunnerAccessActionHost } from "../access/access-actions";
import { applyHqAccessExposeInstalledCorpCards } from "../access/access-breach-lifecycle";
import type { RunFlowAdapters, RunFlowHost } from "./run-flow-contracts";

export function createRunFlowAdapters(host: RunFlowHost): RunFlowAdapters {
  assertRequiredHostGroups(host);

  function startRun(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    pendingSuccessBonusCredits?: number,
    accessCount = 1,
    options?: StartRunOptions,
    legalAction?: LegalAction,
  ): void {
    startRunFromRunCore(
      runCoreExecutionHost(state),
      serverId,
      pendingSuccessBonusCredits,
      accessCount,
      options,
      legalAction,
    );
  }

  function runCoreExecutionHost(state: GameState): RunCoreExecutionHost {
    return {
      state,
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
      },
      turn: {
        ensureRunnerTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      },
      access: {
        breachStateHost: () => host.access.breachStateHost(state),
        runAccessTransitionHost: () => runAccessTransitionHost(state),
      },
      run: {
        movementHost: () => runMovementHostForState(state),
        corpDuringRunCardImplementationLegalActions:
          host.run.corpDuringRunCardImplementationLegalActions,
      },
      rules: {
        isV099OrLater: () => host.rules.isV099OrLater(state),
      },
      callbacks: {
        executeCardImplementationRunnerRunStartEffects:
          host.run.executeCardImplementationRunnerRunStartEffects,
        applyRunnerTraceCounterRunStartEffects:
          host.run.applyRunnerTraceCounterRunStartEffects,
        applyRunStartRandomStrengthBonus:
          host.run.applyRunStartRandomStrengthBonus,
        openStartOfRunFortUtilityWindow:
          host.run.openStartOfRunFortUtilityWindow,
      },
    };
  }

  function continueRun(state: GameState, legalAction?: LegalAction): void {
    continueRunFromRunContinuation(
      runContinuationExecutionHost(state),
      legalAction,
    );
  }

  function runContinuationExecutionHost(
    state: GameState,
  ): RunContinuationExecutionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
      },
      encounter: {
        currentSubroutines: (iceDefinition) =>
          host.run.currentEncounterSubroutines(state, iceDefinition),
        resolutionHost: () => encounterResolutionHostForState(state),
        printedEffectHost: (legalAction) =>
          encounterPrintedEffectHostForState(state, legalAction),
        printedNonTraceHost: (legalAction) =>
          encounterPrintedNonTraceHostForState(state, legalAction),
        specialWindowHost: () => encounterSpecialWindowHostForState(state),
        successfulRunInterventionHost: () =>
          successfulRunInterventionHost(state),
      },
      movement: {
        host: () => runMovementHostForState(state),
      },
      damage: {
        dealDamage: (input) => host.damage.doDamage(state, input),
        setDamagePayload: (legalAction, summary) =>
          host.damage.setDamagePayload(legalAction, summary),
      },
      cleanup: {
        resetBreakerStrength: () => host.ice.resetBreakerStrength(state),
      },
      callbacks: {
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        icebreakerSpecialSourceDefinitionId: (breakerId, special) => {
          const definition = host.cards.definitionFor(state, breakerId);
          const hasSpecial = (
            cardImplementationForDefinitionId(definition.id)
              ?.icebreakerAbilities ?? []
          ).some(
            (ability) =>
              ability.kind === "break_subroutine" &&
              ability.special?.kind === special,
          );
          return hasSpecial ? definition.id : undefined;
        },
        rollDeterministicDie: (purpose) => host.rng.rollDie(state, purpose),
        trashRunnerInstalledProgram: (breakerId) =>
          host.zones.trashRunnerInstalledProgram(state, breakerId),
      },
    };
  }

  function runnerEncounterActionHostForState(
    state: GameState,
  ): RunnerEncounterActionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType as CounterType),
        effectiveSubtypesForCard: (cardId, definition) =>
          definition
            ? host.cards.effectiveSubtypesForCard(state, cardId, definition)
            : [],
        hostedProgramStrengthModifier: (cardId) =>
          host.cards.hostedProgramStrengthModifier(state, cardId),
        icebreakerEncounterStrengthBonus: (breakerId, encounteredIceId) =>
          host.cards.icebreakerEncounterStrengthBonus(
            state,
            breakerId,
            encounteredIceId,
          ),
        permanentIcebreakerStrengthCounterBonus: (breakerId) =>
          host.cards.permanentIcebreakerStrengthCounterBonus(state, breakerId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      run: {
        currentRun: () => host.run.currentRun(state),
        currentEncounterSubroutines: (iceDefinition) =>
          host.run.currentEncounterSubroutines(state, iceDefinition),
        runnerDuringRunCardImplementationLegalActions: () =>
          host.run.runnerDuringRunCardImplementationLegalActions(state),
        runRemainderStrengthBonusForBreaker: (breakerId) =>
          host.run.runRemainderStrengthBonusForBreaker(state.run, breakerId),
        canUseBreakerOnCurrentFort: (breakerId) =>
          runnerCanUseBreakerOnCurrentFort(
            fortRunSideFamiliesHostForState(state),
            breakerId,
          ),
      },
      ice: {
        strengthForIce: (iceId) => host.ice.strengthForIce(state, iceId),
      },
      breaker: {
        selectedServerIcebreakerStrengthCounterBonus: (breakerId) =>
          host.ice.selectedServerIcebreakerStrengthCounterBonus(
            state,
            breakerId,
          ),
      },
      payment: {
        availableRunnerRunCredits: (breakerId) =>
          availableRunnerRunCredits(runDurationPaymentHost(state), breakerId),
        runJackOutAdditionalCost: (run) => runJackOutAdditionalCost(run),
      },
      actions: {
        buildLegalAction: (type, label, source, costs, payload, metadata) =>
          action(
            state,
            "runner",
            type,
            label,
            source,
            costs,
            payload,
            metadata,
          ),
        abilityMetadata: host.effects.abilityMetadata,
      },
      costs: {
        breakSubroutineCostBreakdown: (baseCost, subroutineCount, breakerId) =>
          host.effects.breakSubroutineCostBreakdown(
            state,
            baseCost,
            subroutineCount,
            breakerId,
          ),
      },
      callbacks: {
        postPassSpecialWindowActions: () => [
          ...fullyBrokenPassedIcePostPassActions(
            encounterSpecialWindowHostForState(state),
          ),
          ...fullyBrokenPassedIceTrashPostPassActions(
            encounterSpecialWindowHostForState(state),
          ),
        ],
      },
    };
  }

  function runMovementHostForState(state: GameState): RunMovementHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      rules: {
        isV097OrLater: () => host.rules.isV097OrLater(state),
        corpRunRootRezActionsAvailable: () =>
          corpRunRootRezActionsAvailable(runRezWindowHostForState(state)),
        corpRunRootRezWindowOpen: () =>
          isCorpRunRootRezWindowOpen(runRezWindowHostForState(state)),
        approachIceExposeCanBeOfferedForCurrentIce: () =>
          approachIceExposeCanBeOfferedForCurrentIce(
            encounterEntryHostForState(state),
          ),
      },
      actions: {
        buildLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      encounter: {
        encounterResolutionHost: () => encounterResolutionHostForState(state),
        encounterSpecialWindowHost: () =>
          encounterSpecialWindowHostForState(state),
        beginEncounter: (iceId, legalAction) =>
          beginEncounter(encounterEntryHostForState(state), iceId, legalAction),
      },
      access: {
        startAccessFromSuccessfulRun: (legalAction) =>
          enterAccessFromSuccessfulRun(
            runAccessTransitionHost(state),
            legalAction,
          ),
      },
      cleanup: {
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
      },
    };
  }

  function runRezWindowHostForState(state: GameState): RunRezWindowHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        runnerInstalledProgramIds: () => state.runner.rig.programs,
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      fortPass: fortPassWindowHostForState(state),
      choices: {
        selectedChoiceIds: (selectedChoices) =>
          selectedChoiceIds(selectedChoices),
      },
      callbacks: {
        continueAfterRootRez: (legalAction) => {
          const run = state.run;
          if (
            state.timingPoint === "run.movement_rez_window" &&
            run?.phase === "movement" &&
            !isCorpRunRootRezWindowOpen(runRezWindowHostForState(state))
          ) {
            continueAfterMovementRezWindow(
              runMovementHostForState(state),
              legalAction,
            );
            return;
          }
          const approachedIceId = run?.approachedIceId;
          if (
            state.timingPoint === "run.approach_ice" &&
            run?.phase === "approach_ice" &&
            run.bypassFirstIceRemaining === true &&
            approachedIceId !== undefined &&
            state.cardInstances[approachedIceId]?.rezzed === true &&
            !corpRunRootRezActionsAvailable(runRezWindowHostForState(state))
          ) {
            passApproachedIce(runMovementHostForState(state), legalAction);
            return;
          }
          continueAfterCorpRootRezIfWindowIsComplete(
            encounterEntryHostForState(state),
            legalAction,
          );
        },
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
        canReplaceFortCardsFromHq: (serverId) =>
          host.cards.canReplaceFortCardsFromHq(state, serverId),
        activeObligationCount: () =>
          host.callbacks.activeObligationCount(state),
        addActiveObligation: (amount) =>
          host.callbacks.addActiveObligation(state, amount),
      },
    };
  }

  function fortPassWindowHostForState(state: GameState): FortPassWindowHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        publicInstalledCorpCardIdentityKnown: (cardId) =>
          host.cards.publicInstalledCorpCardIdentityKnown(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
      },
      payment: {
        spendCorpCredits: (amount) =>
          host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
            state,
            amount,
          ),
      },
    };
  }

  function fortRunSideFamiliesHostForState(
    state: GameState,
  ): FortRunSideFamiliesHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardHasSubtype: host.cards.cardHasSubtype,
        runnerInstalledCardIds: () => host.cards.runnerInstalledCardIds(state),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType),
        setCardCounter: (cardId, counterType, amount) =>
          host.counters.setCardCounter(state, cardId, counterType, amount),
        spendCardCounter: (cardId, counterType, amount) =>
          host.counters.spendCardCounter(state, cardId, counterType, amount),
      },
      payment: {
        hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
        spendHostedPaymentCredits: (cardId, amount) =>
          spendHostedPaymentCredits(state, cardId, amount),
        rezCostForCard: (cardId) => host.payment.rezCostForCard(state, cardId),
        spendCorpCredits: (amount) =>
          host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
            state,
            amount,
          ),
      },
      breaker: {
        breakAbilityForLegalAction: (legalAction) =>
          host.effects.breakAbilityForLegalAction(state, legalAction),
      },
      effects: {
        executeEffectCommands: (commands) =>
          host.effects.executeEffectCommands(state, commands),
        trashRunnerInstalledProgram: (cardId) =>
          host.zones.trashRunnerInstalledProgram(state, cardId),
      },
      tags: {
        addRunnerTagsWithPrevention: (legalAction, amount, source) =>
          host.damage.addRunnerTagsWithPrevention(
            state,
            legalAction,
            amount,
            source,
          ),
      },
    };
  }

  function encounterEntryHostForState(state: GameState): EncounterEntryHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        runnerInstalledCardIds: () => host.cards.runnerInstalledCardIds(state),
        effectiveSubtypesForCard: (cardId, definition) =>
          host.cards.effectiveSubtypesForCard(state, cardId, definition),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      run: {
        corpRootRezActionsAvailable: () =>
          corpRunRootRezActionsAvailable(runRezWindowHostForState(state)),
      },
      callbacks: {
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        continueRun: (legalAction) => continueRun(state, legalAction),
        rollDie: (purpose) => host.rng.rollDie(state, purpose),
      },
    };
  }

  function successfulRunInterventionHost(
    state: GameState,
  ): SuccessfulRunInterventionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      actions: {
        createRunnerTriggerAction: (label, sourceCardId, costs, payload) =>
          action(
            state,
            "runner",
            "trigger_ability",
            label,
            sourceCardId,
            costs,
            payload,
          ),
      },
      choices: {
        selectedChoiceIds: (selectedChoices) =>
          selectedChoiceIds(selectedChoices),
      },
      costs: {
        creditCostForAction: (legalAction) =>
          host.payment.creditCostForAction(legalAction),
        rezCostForCard: (cardId) => host.payment.rezCostForCard(state, cardId),
      },
      credits: {
        spend: (side, amount) =>
          side === "corp"
            ? host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
                state,
                amount,
              )
            : host.payment.spendCredits(state, side, amount),
        gainRunner: (amount) => host.payment.credits(state, "runner", amount),
      },
      rez: {
        canonicalPaidActionsForIce: (cardId) =>
          buildCanonicalPaidIceRezActions(
            runRezWindowHostForState(state),
            cardId,
          ),
        executeCanonicalPaidRezWithoutRunContinuation: (cardId, legalAction) =>
          host.callbacks.rezIceWithoutRunContinuation(
            state,
            cardId,
            legalAction,
          ),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType as CounterType),
        addCardCounter: (cardId, counterType, amount) =>
          host.counters.addCardCounter(
            state,
            cardId,
            counterType as CounterType,
            amount,
          ),
      },
      runnerCards: {
        shuffleGripIntoStack: (purpose) => {
          const gripIds = state.runner.grip.slice();
          if (gripIds.length === 0) return 0;
          state.runner.grip = [];
          const stackIds = [...state.runner.stack, ...gripIds];
          state.runner.stack = host.rng.shuffleStateIds(
            state,
            stackIds,
            purpose,
          );
          for (const cardId of gripIds) {
            state.cardInstances[cardId] = {
              ...host.cards.cardInstanceFor(state, cardId),
              faceup: false,
              rezzed: false,
              zone: { side: "runner", zone: "stack" },
            };
          }
          return gripIds.length;
        },
        drawCards: (amount) => host.callbacks.drawRunnerCards(state, amount),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      },
      zones: {
        removeFromAllZones: (cardId) =>
          host.zones.removeFromAllZones(state, cardId),
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
        trashRunnerInstalledCardToHeap: (cardId, legalAction) =>
          host.zones.trashRunnerInstalledCardToHeap(state, cardId, legalAction),
      },
      encounter: {
        beginEncounter: (iceId, legalAction) =>
          beginEncounter(encounterEntryHostForState(state), iceId, legalAction),
        approachOrEncounterIce: (iceId, legalAction) =>
          approachOrEncounterIce(
            runMovementHostForState(state),
            iceId,
            legalAction,
          ),
      },
      access: {
        startAccessFromSuccessfulRun: (legalAction) =>
          enterAccessFromSuccessfulRun(
            runAccessTransitionHost(state),
            legalAction,
          ),
        finishSuccessfulRun: (legalAction) =>
          host.callbacks.finishRun(state, true, legalAction),
      },
    };
  }

  function encounterResolutionHostForState(
    state: GameState,
  ): EncounterResolutionHost {
    return createEncounterResolutionHost(state, {
      applyRunnerForgoNextAction: () =>
        host.callbacks.applyRunnerForgoNextAction(state),
      trashRunnerInstalledProgram: (cardId) =>
        host.zones.trashRunnerInstalledProgram(state, cardId),
    });
  }

  function encounterSpecialWindowHostForState(
    state: GameState,
  ): EncounterSpecialWindowHost {
    return encounterSpecialWindowHost(state, {
      derezCorpInstalledCard: (cardId) => {
        state.cardInstances[cardId] = {
          ...host.ice.withoutVariableIceState(
            host.cards.cardInstanceFor(state, cardId),
          ),
          faceup: false,
          rezzed: false,
        };
      },
      finishRun: (successful, legalAction) =>
        host.callbacks.finishRun(state, successful, legalAction),
      quoteIceRezCost: (iceId) => host.payment.rezCostForCard(state, iceId),
      resetBreakerStrength: () => host.ice.resetBreakerStrength(state),
      rollDie: (purpose) => host.rng.rollDie(state, purpose),
      spendCredits: (side, amount) =>
        side === "corp"
          ? host.payment.spendCorpRunTemporaryCreditsForCurrentRunCost(
              state,
              amount,
            )
          : host.payment.spendCredits(state, side, amount),
      trashCorpInstalledCard: (cardId) =>
        host.zones.trashCorpInstalledCardToArchives(state, cardId),
      trashRunnerInstalledCardToHeap: (cardId, legalAction) =>
        host.zones.trashRunnerInstalledCardToHeap(state, cardId, legalAction),
    });
  }

  function encounterPrintedEffectHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedEffectHost {
    return encounterPrintedEffectHost(state, {
      addCardCounter: (cardId, counterType, amount) =>
        host.counters.addCardCounter(state, cardId, counterType, amount),
      addCorpTraceCounterPoolCounters: () =>
        host.trace.addCorpTraceCounterPoolCounters(state),
      addRunnerTagsWithPrevention: (action, amount, source) =>
        host.damage.addRunnerTagsWithPrevention(state, action, amount, source),
      calculateRunnerLink: () => host.trace.calculateRunnerLink(state),
      cardCounter: (cardId, counterType) =>
        host.counters.cardCounter(state, cardId, counterType),
      createDamageImminentEvent: (request) =>
        host.damage.createDamageImminentEvent(state, request),
      definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
      ensureRunnerTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      finishRun: (successful) => host.callbacks.finishRun(state, successful),
      corpTraceCounterPoolTotal: () =>
        host.trace.corpTraceCounterPoolTotal(state),
      recurringTraceCreditPoolTotal: () =>
        host.trace.recurringTraceCreditPoolTotal(state),
      openEventModificationWindow: (event, action) =>
        host.damage.openEventModificationWindow(state, event, action),
      openReplacementWindow: (event, action) =>
        host.damage.openReplacementWindow(state, event, action),
      openDamageResolutionWindow: (event, action) =>
        host.damage.openDamageResolutionWindow(state, event, action),
      fortTraceBitPoolSource: () =>
        state.run
          ? fortTraceBitPoolSource(fortRunSideFamiliesHostForState(state))
          : undefined,
      rabbitTraceLimitReductionForIceTrace: () =>
        host.trace.rabbitTraceLimitReductionForIceTrace(state),
      resolveDamageImminentEvent: (event) =>
        host.damage.resolveDamageImminentEvent(state, event),
      resolveTraceHardwareWreckerSuccess: (
        sourceDefinitionId,
        sourceCardInstanceId,
        traceId,
      ) =>
        host.trace.resolveTraceHardwareWreckerSuccess(
          state,
          sourceDefinitionId as CardDefinitionId,
          sourceCardInstanceId,
          traceId,
        ),
      resolveTraceTrashRunnerResourceSuccess: (
        sourceDefinitionId,
        sourceCardInstanceId,
        traceId,
        targetCardId,
      ) =>
        host.trace.resolveTraceTrashRunnerResourceSuccess(
          state,
          sourceDefinitionId as CardDefinitionId,
          sourceCardInstanceId,
          traceId,
          targetCardId,
        ),
      resolveTraceSuccessTrashProgramSubroutine: (trace, actionToResolve) => {
        if (trace.subroutineIndex === undefined)
          throw new Error(
            "Trace-Programmtrash benötigt einen gebundenen Subroutine-Index.",
          );
        const definition = host.cards.definitionFor(
          state,
          trace.sourceCardInstanceId,
        );
        if (definition.id !== trace.sourceDefinitionId)
          throw new Error(
            "Trace-Programmtrash-Quelle passt nicht zur Trace-Definition.",
          );
        const subroutine = definition.subroutines?.[trace.subroutineIndex];
        if (!subroutine)
          throw new Error(
            "Trace-Programmtrash-Subroutine ist nicht mehr vorhanden.",
          );
        const trashResult = resolveTraceSuccessTrashProgramSubroutine(
          encounterPrintedNonTraceHostForState(state, actionToResolve),
          {
            definition,
            subroutine,
            subroutineIndex: trace.subroutineIndex,
            legalAction: actionToResolve,
          },
        );
        return { suspended: trashResult.suspended === true };
      },
      rollDie: (purpose) => host.rng.rollDie(state, purpose),
      setDamagePayload: (summary) => {
        if (legalAction) host.damage.setDamagePayload(legalAction, summary);
      },
      supportsTraceSuccessEffect: (effect) =>
        isSupportedEncounterTraceSuccessEffect(
          effect,
          host.callbacks.traceCounterEffectDefinitionFor,
        ),
      traceBidChoice: (side, traceId, prompt, maxBid) =>
        host.trace.traceBidChoice(state, side, traceId, prompt, maxBid),
    });
  }

  function encounterPrintedNonTraceHostForState(
    state: GameState,
    legalAction?: LegalAction,
  ): EncounterPrintedNonTraceHost {
    return encounterPrintedNonTraceHost(state, {
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      encounter: {
        resolutionHost: encounterResolutionHostForState(state),
      },
      payment: {
        spendCorpCredits: (amount) =>
          host.payment.spendCredits(state, "corp", amount),
      },
      tags: {
        addRunnerTagsWithPrevention: (action, amount, source) =>
          host.damage.addRunnerTagsWithPrevention(
            state,
            action,
            amount,
            source,
          ),
      },
      trash: {
        openRunnerInstalledTrashPreventionWindow: (
          targetCardIds,
          source,
          actionToResolve,
        ) =>
          host.choices.openRunnerInstalledTrashPreventionWindow(
            state,
            actionToResolve,
            targetCardIds,
            source,
          ),
        trashRunnerInstalledProgram: (cardId) =>
          host.zones.trashRunnerInstalledProgram(state, cardId),
      },
      choices: {
        selectedChoiceIds: (selectedChoices) =>
          selectedChoiceIds(selectedChoices),
        revealCorpRdTop: (actionToResolve) =>
          host.effects.revealCorpRdTop(state, actionToResolve),
        startCorpRdArrangeChoice: (input) => {
          if (!legalAction)
            throw new Error("Continue-Run LegalAction fehlt fuer R&D-Reorder.");
          startCorpRdArrangeChoice(
            host.choices.hiddenZoneArrangeChoiceHandlerHost(state, legalAction),
            input,
          );
        },
      },
      callbacks: {
        beginEncounter: (iceId, actionToResolve) =>
          beginEncounter(
            encounterEntryHostForState(state),
            iceId,
            actionToResolve,
          ),
        resetBreakerStrength: () => host.ice.resetBreakerStrength(state),
      },
    });
  }

  function runEndCleanupHost(state: GameState): RunEndCleanupHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        withoutVariableIceState: host.ice.withoutVariableIceState,
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        publicServerLabel: (serverId) =>
          host.servers.publicServerLabel(state, serverId),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
        consumeFutureActionDebt: () => {
          host.turn.consumeRunnerFutureActionDebt(state);
        },
        awardEventAgendaPoint: (
          sourceCardId,
          sourceDefinitionId,
          legalAction,
        ) => {
          if (!legalAction)
            throw new Error("Runner-Agenda-Punkt braucht eine LegalAction.");
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            cardId: sourceCardId,
          };
          if (!host.callbacks.awardRunnerEventAgendaPoint)
            throw new Error("Runner-Agenda-Punkt-Callback fehlt.");
          host.callbacks.awardRunnerEventAgendaPoint(
            state,
            legalAction,
            sourceDefinitionId,
          );
        },
        addFutureActionDebt: (amount) => {
          const flags = host.turn.ensureRunnerTurnFlags(state);
          flags.forgoNextActionsPending =
            Math.max(0, Math.floor(flags.forgoNextActionsPending ?? 0)) +
            amount;
        },
      },
      choices: {
        selectedChoiceIds: (selectedChoices) =>
          selectedChoiceIds(selectedChoices),
      },
      credits: {
        gainRunner: (amount) => {
          credits(state, "runner", amount, {
            kind: "run_effect",
            reason: "run_end_credit_gain",
          });
        },
        gainCorp: (amount) => {
          credits(state, "corp", amount, {
            kind: "run_effect",
            reason: "run_end_credit_gain",
          });
        },
      },
      damage: {
        dealUnpreventableCoreDamage: (run, sourceDefinitionId, amount) =>
          host.damage.doDamage(state, {
            damageId: `${run.runId}.${sourceDefinitionId}.run_end_unpreventable_core`,
            damageType: "core",
            amount,
            source: `run_end:${sourceDefinitionId}`,
          }),
      },
      tags: {
        addRunnerTagsWithPrevention: (legalAction, amount, source) =>
          host.damage.addRunnerTagsWithPrevention(
            state,
            legalAction,
            amount,
            source,
          ),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType),
        setCardCounter: (cardId, counterType, amount) =>
          host.counters.setCardCounter(state, cardId, counterType, amount),
        addCardCounter: (cardId, counterType, amount) =>
          host.counters.addCardCounter(state, cardId, counterType, amount),
        addVirusCounterWithCounterPrevention: (
          cardId,
          counterType,
          amount,
          legalAction,
        ) =>
          host.counters.addVirusCounterWithCounterPrevention(
            state,
            cardId,
            counterType,
            amount,
            legalAction,
          ),
        preventOneVirusCounterWithCounterPrevention: () =>
          host.counters.preventOneVirusCounterWithCounterPrevention(state),
        poxCountersForServer: (serverId) =>
          host.counters.poxCountersForServer(state, serverId),
      },
      ice: {
        icebreakerHasSpecial: (breakerId, special) =>
          host.ice.icebreakerHasSpecial(state, breakerId, special),
      },
      virus: {
        installedRunnerVirusSourceIds: (predicate) =>
          host.callbacks.installedRunnerVirusSourceIds(state, predicate),
        virusCounterImplementationForCard: (cardId) =>
          host.callbacks.virusCounterImplementationForCard(state, cardId),
      },
      aftermath: {
        tokyoUnsuccessfulRunAmountForCard: (cardId) =>
          tokyoUnsuccessfulRunAmountForCard(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
        isTokyoUnsuccessfulRunSource: (cardId) =>
          isTokyoUnsuccessfulRunSource(
            fortRunSideFamiliesHostForState(state),
            cardId,
          ),
      },
      followups: {
        applySuccessfulRunEndCreditTriggers: (legalAction) =>
          applySuccessfulRunEndCreditTriggers(
            successfulRunInterventionHost(state),
            legalAction,
          ),
        applySuccessfulRunExtraRunFollowup: (legalAction) =>
          applySuccessfulRunExtraRunFollowup(
            successfulRunInterventionHost(state),
            legalAction,
          ),
        cleanupDelayedSuccessfulRunTemporaryIce: (run, legalAction) =>
          cleanupDelayedSuccessfulRunTemporaryIce(
            successfulRunInterventionHost(state),
            run,
            legalAction,
          ),
        resolveTestSpinRunEnd: (run, legalAction) =>
          host.callbacks.resolveTestSpinRunEnd(state, run, legalAction),
      },
      cleanup: {
        cleanupEmptyRemotes: () => host.zones.cleanupEmptyRemotes(state),
        trashRunnerInstalledProgram: (cardId) =>
          host.zones.trashRunnerInstalledProgram(state, cardId),
      },
    };
  }

  function runAccessTransitionHost(state: GameState): RunAccessTransitionHost {
    return {
      state,
      breach: host.access.breachStateHost(state),
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
        awardEventAgendaPoint: (
          sourceCardId,
          sourceDefinitionId,
          legalAction,
        ) => {
          if (!legalAction)
            throw new Error("Runner-Agenda-Punkt braucht eine LegalAction.");
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            cardId: sourceCardId,
          };
          if (!host.callbacks.awardRunnerEventAgendaPoint)
            throw new Error("Runner-Agenda-Punkt-Callback fehlt.");
          host.callbacks.awardRunnerEventAgendaPoint(
            state,
            legalAction,
            sourceDefinitionId,
          );
        },
      },
      draw: {
        drawCorpCards: (count) => host.callbacks.drawCorpCards(state, count),
      },
      tags: {
        addRunnerTagsWithPrevention: (legalAction, amount, source) =>
          host.damage.addRunnerTagsWithPrevention(
            state,
            legalAction,
            amount,
            source,
          ),
      },
      trash: {
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
      },
      rng: {
        shuffleStateIds: (ids, purpose) =>
          host.rng.shuffleStateIds(state, ids, purpose),
      },
      access: {
        hasHiddenResourceAccessStartActions: (run, serverId) =>
          host.access.hasHiddenResourceAccessStartActions(state, run, serverId),
        advanceArchivesBreachPastNonDecisionCards: (legalAction) =>
          host.access.advanceArchivesBreachPastNonDecisionCards(
            host.access.accessFlowHost(state),
            legalAction,
          ),
        applyHqAccessExposeInstalledCorpCards: (serverId, legalAction) =>
          applyHqAccessExposeInstalledCorpCards(
            host.access.accessFlowHost(state),
            serverId,
            legalAction,
          ),
        findPreAccessTopRdReorderSource: (run) => {
          if (run.preAccessTopRdReorderResolved) return undefined;
          const accessServerId =
            run.accessServerOverride ?? run.attackedServerId;
          if (accessServerId !== "rd") return undefined;
          return host.cards
            .runnerInstalledCardIds(state)
            .slice()
            .sort()
            .find((cardId) =>
              host.cards
                .cardImplementationAccessHookKindsForDefinition(
                  host.cards.definitionFor(state, cardId).id,
                )
                .includes("pre_access_rd_cut"),
            );
        },
        isPreAccessTopRdReorderSource: (cardId) =>
          host.cards.runnerInstalledCardIds(state).includes(cardId) &&
          host.cards
            .cardImplementationAccessHookKindsForDefinition(
              host.cards.definitionFor(state, cardId).id,
            )
            .includes("pre_access_rd_cut"),
        startRunnerPrivateLookChoice: (
          sourceCardId,
          sourceDefinitionId,
          zone,
          count,
          reason,
          legalAction,
        ) =>
          host.access.startRunnerPrivateLookChoice(
            state,
            sourceCardId,
            sourceDefinitionId,
            zone,
            count,
            reason,
            legalAction,
          ),
      },
      run: {
        isV097OrLater: () => host.rules.isV097OrLater(state),
        finishRun: (successful, legalAction) =>
          host.callbacks.finishRun(state, successful, legalAction),
        successfulRunInterventionKindForSource: (sourceCardId) => {
          return successfulRunInterventionKindForDefinition(
            host.cards.definitionFor(state, sourceCardId).id,
          );
        },
        successfulRunInterventionCost: (kind, serverId, hqIceId) =>
          successfulRunInterventionCost(
            successfulRunInterventionHost(state),
            kind,
            serverId,
            hqIceId,
          ),
      },
      choices: {
        selectedChoiceIds: (selectedChoices) =>
          selectedChoiceIds(selectedChoices),
      },
    };
  }

  return {
    startRun,
    continueRun,
    runCoreExecutionHost,
    runContinuationExecutionHost,
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
    runAccessTransitionHost,
  };
}

export function assertRequiredHostGroups(host: RunFlowHost): void {
  for (const group of [
    "cards",
    "servers",
    "rules",
    "turn",
    "access",
    "run",
    "trace",
    "damage",
    "payment",
    "counters",
    "ice",
    "zones",
    "choices",
    "effects",
    "rng",
    "callbacks",
  ] as const) {
    if (!host[group]) throw new Error(`RunFlowHost missing group: ${group}`);
  }
}

export type { RunFlowAdapters, RunFlowHost } from "./run-flow-contracts";
