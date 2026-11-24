import { isSupportedTraceSuccessEffect } from "../trace/trace-success-effect-validation";
import { type CounterType, type GameState, type LegalAction } from "@netgrid/shared";
import { definitionFor, runnerInstalledCardIds } from "../state/card-server-lookup";
import { spendCredits } from "../state/economy-mutation";
import { cardCounter } from "../state/turn-flags-counters";
import { type TraceOrchestrationHost } from "../trace/trace-orchestration";
import { handleScoredAgendaActivatedAbilityAction } from "../corp/scored-agenda-abilities";
import { handleCorpTraceDamageActivatedAbility } from "../corp/trace-damage-abilities";
import {
  hostedPaymentCredits,
  recordRunActionSpendingCapSpend,
  runDurationPaymentHost,
} from "../run/run-duration-payment";
import {
  isTraceLinkForceJackOutSource,
  markTraceLinkForceJackOutAfterEncounter,
} from "../run/encounter-special-windows";
import {
  applyPrintedTraceSuccessFollowups,
} from "../run/encounter-printed-effects";
import { fortTraceBitPoolSource } from "../run/fort-run-side-families";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { resolveActivatedCardImplementationAbility } from "../../ability-engine/card-implementation-runtime";
import type { ActivatedCardAbilityImplementation } from "../../ability-engine/definition-types";
import { activatedAbilityAtTiming } from "../../ability-engine/definition-types";
import type { RuntimeDeps } from "./runtime-shared";

export function createActivatedCardRuntimeHosts(
  deps: RuntimeDeps,
): Pick<
  import("./card-runtime-host-port").CardRuntimeHostPort,
  "traceOrchestrationHost" | "activatedCardImplementationExecutionHost"
> {
  function traceOrchestrationHost(state: GameState): TraceOrchestrationHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => definitionFor(state, cardId),
        runnerInstalledCardIds: () => runnerInstalledCardIds(state),
        hasCardImplementationForDefinition: (definitionId) =>
          Boolean(cardImplementationForDefinitionId(definitionId)),
        activatedTraceAbilities: (definition, timing) =>
          cardImplementationForDefinitionId(definition.id)
            ?.abilities?.map((ability, index) => ({ ability, index }))
            .filter(
              (
                entry,
              ): entry is {
                ability: ActivatedCardAbilityImplementation;
                index: number;
              } =>
                entry.ability.kind === "activated" &&
                activatedAbilityAtTiming(entry.ability, timing) !== undefined,
            ) ?? [],
        isTraceLinkForceJackOutSource: (cardId) =>
          isTraceLinkForceJackOutSource(state, cardId),
      },
      payment: {
        corpTracePaymentDeps: deps.corpTracePaymentDeps,
        runnerTracePaymentDeps: deps.runnerTracePaymentDeps,
        runnerTraceLinkCreditSourceIds: () =>
          deps.runnerTracePaymentDeps
            .runnerTraceLinkCreditSources(state)
            .map((source) => source.sourceCardInstanceId),
        hostedPaymentCredits: (cardId) => hostedPaymentCredits(state, cardId),
        spendRunnerCredits: (amount) => spendCredits(state, "runner", amount),
        recordRunActionSpendingCapSpend: (amount) =>
          recordRunActionSpendingCapSpend(
            runDurationPaymentHost(state),
            amount,
          ),
      },
      runner: {
        identityModifierAmount: (side, kind, duration) =>
          deps.identityModifierAmount(state, side, kind, duration),
      },
      corp: {
        rezzedCorpRootCardIds: () => deps.rezzedCorpRootCardIds(state),
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          cardCounter(state, cardId, counterType as CounterType),
        corpTraceCounterPoolTotal: () => deps.corpTraceCounterPoolTotal(state),
        recurringTraceCreditPoolTotal: () =>
          deps.recurringTraceCreditPoolTotal(state),
      },
      fort: {
        fortTraceBitPoolSource: () =>
          state.run
            ? fortTraceBitPoolSource(
                deps.fortRunSideFamiliesHostForState(state),
              )
            : undefined,
      },
      run: {
        markTraceLinkForceJackOutAfterEncounter: (cardId, legalAction) =>
          markTraceLinkForceJackOutAfterEncounter(
            deps.encounterSpecialWindowHostForState(state),
            cardId,
            legalAction,
          ),
        applyPrintedTraceSuccessFollowups: (options) =>
          applyPrintedTraceSuccessFollowups(
            deps.encounterPrintedEffectHostForState(state, options.legalAction),
            options,
          ),
      },
      trace: {
        supportsTraceSuccessEffect: (effect) =>
          isSupportedTraceSuccessEffect(
            effect,
            deps.traceCounterEffectDefinitionFor,
          ),
      },
      zones: {
        trashRunnerInstalledCardToHeap: (cardId, legalAction) =>
          deps.trashRunnerInstalledCardToHeap(state, cardId, legalAction),
      },
      callbacks: {
        sanitizeId: deps.sanitizeId,
        addCorpTraceCounterPoolCounters: () =>
          deps.addCorpTraceCounterPoolCounters(state),
        addRunnerTagsWithPrevention: (legalAction, amount, source) =>
          deps.addRunnerTagsWithPrevention(state, legalAction, amount, source),
        resolveTraceTrashRunnerResourceSuccess: (
          sourceDefinitionId,
          sourceCardInstanceId,
          traceId,
          targetCardId,
        ) =>
          deps.resolveTraceTrashRunnerResourceSuccess(
            state,
            sourceDefinitionId,
            sourceCardInstanceId,
            traceId,
            targetCardId,
          ),
      },
    };
  }

  function activatedCardImplementationExecutionHost(
    state: GameState,
    legalAction: LegalAction,
  ) {
    return {
      state,
      action: { legalAction },
      callbacks: {
        handleCorpTraceDamageActivatedAbility: (actionToResolve: LegalAction) =>
          handleCorpTraceDamageActivatedAbility(
            deps.corpTraceDamageAbilityHost(state, actionToResolve),
          ).handled,
        handleScoredAgendaActivatedAbilityAction: (
          actionToResolve: LegalAction,
        ) =>
          handleScoredAgendaActivatedAbilityAction(
            deps.scoredAgendaAbilityHost(state, actionToResolve),
          ).handled,
        resolveActivatedCardImplementationAbility: (
          actionToResolve: LegalAction,
        ) =>
          resolveActivatedCardImplementationAbility(
            deps.cardImplementationRuntimeDeps,
            state,
            actionToResolve,
          ),
      },
    };
  }

  return {
    traceOrchestrationHost,
    activatedCardImplementationExecutionHost,
  };
}
