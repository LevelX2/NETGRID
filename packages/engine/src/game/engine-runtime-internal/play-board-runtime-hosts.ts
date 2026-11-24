import { type GameState } from "@netgrid/shared";
import { rezCostForCard } from "../payment";
import { definitionFor, mustServer } from "../state/card-server-lookup";
import { drawCorpCards } from "../state/draw-random";
import { credits, spendClick, spendCredits } from "../state/economy-mutation";
import { ensureCorpTurnFlags } from "../state/turn-flags-counters";
import { removeFromAllZones } from "../state/zone-mutation";
import { buildLegalAction as action } from "../turn/action-builders";
import { addRunnerTagsWithPrevention, resolveDamageOperation } from "../damage/damage-core";
import {
  resolveConcealAndReorderInstalledIce,
  startCorpRdTopReorderChoice,
} from "../hidden-zone/arrange-choice-handlers";
import {
  startCorpArchivesToHqChoice,
  startCorpHqCardToRdChoice,
} from "../hidden-zone/nonsearch-choice-handlers";
import { spendRestrictedHostedCredits } from "../run/run-duration-payment";
import { markFortActivityForRunGate } from "../run/fort-run-side-families";
import { type PlayCardExecutionHost } from "../play/play-card-execution";
import {
  canPlayCorpOperation,
  hasPrintedCostOnPlayCardImplementation,
  onPlayCardImplementationAdditionalOperationCost,
  onPlayCardImplementationNeedsLastTurnResourceTarget,
  resolveCorpOperation,
  type CorpOperationResolutionHost,
} from "../play/corp-operation-resolution";
import { type BoardStateActionExecutionHost } from "../board/board-state-action-execution";
import {
  hiddenRunnerResourceSlotId,
  isConcealedRunnerResource,
  resolveHiddenRunnerResourceSlot,
} from "../view/card-view";
import {
  canPlayPrintedCostOnPlayImplementation,
  executeOnPlayCardImplementationAbility,
} from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export function createPlayBoardRuntimeHosts(
  deps: RuntimeDeps,
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
        runnerEventResolver: deps.cardImplementationRunnerEventResolver,
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
              ([cardId, instance]) =>
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
        hiddenRunnerResourceSlotId: (cardId) =>
          hiddenRunnerResourceSlotId(state, cardId),
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
        moveAdvancementOptions: (
          sourceCardId,
          source,
          maxAmount,
          minimumAmount,
        ) =>
          deps.moveAdvancementOptions(
            state,
            sourceCardId,
            source as never,
            maxAmount,
            minimumAmount,
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
        resolveTaggedRunnerResourceMultiTrashOperation: (
          legalAction,
          minimumTargets,
          maximumTargets,
          selectionOrdering,
        ) =>
          deps.resolveTaggedRunnerResourceMultiTrashOperation(
            state,
            legalAction,
            minimumTargets,
            maximumTargets,
            selectionOrdering,
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
        hiddenRunnerResourceSlotId: (cardId) =>
          hiddenRunnerResourceSlotId(state, cardId),
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
