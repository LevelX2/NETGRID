import { type GameState } from "@netgrid/shared";
import { corpInstalledCardIds, definitionFor, mustInstance, publicInstalledCorpCardIdentityKnown, runnerInstalledCardIds } from "../state/card-server-lookup";
import { drawCorpCard, nextRandom } from "../state/draw-random";
import {
  credits,
  spendClick,
  spendClicks,
  spendCredits,
} from "../state/economy-mutation";
import { addCardCounter, cardCounter, ensureRunnerTurnFlags, spendCardCounter } from "../state/turn-flags-counters";
import { uninstallCorpInstalledCardToHq } from "../state/zone-mutation";
import { handleTraceOrchestrationAction } from "../trace/trace-orchestration";
import { type TurnBasicExecutionHost } from "../turn/turn-basic-execution";
import { type CreditEconomyExecutionHost } from "../economy/credit-economy-execution";
import { startCorpAssetRdTopReorderChoice } from "../hidden-zone/arrange-choice-handlers";
import { resolveReschedulerHqShuffleDraw } from "../hidden-zone/corp-zone-choice-handlers";
import { handleScoredAgendaActivatedAbilityAction } from "../corp/scored-agenda-abilities";
import { handleCorpSpecialDamageAbilityAction } from "../corp/special-damage-abilities";
import { publicServerLabelForCard } from "../../public-context";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type { RuntimeDeps } from "./runtime-shared";

export function createApplyActionRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps = {} as RuntimeDeps,
): Pick<
  import("./action-runtime-port").ActionRuntimePort,
  "turnBasicExecutionHost" | "creditEconomyExecutionHost"
> {
  function turnBasicExecutionHost(state: GameState): TurnBasicExecutionHost {
    return {
      state,
      draw: {
        drawCorpCard,
        resolveCorpMandatoryDraw: deps.resolveCorpMandatoryDraw,
        drawRunnerCards: deps.drawRunnerCards,
        applyRunnerDrawSummaryPayload: deps.applyRunnerDrawSummaryPayload,
      },
      turn: {
        spendClick,
        spendClicks,
        stopRunnerRestrictedActionSequence:
          deps.stopValuPakProgramInstallSequence,
        endTurn: deps.endTurn,
      },
      credits: {
        spendRunnerTagRemovalCredits: deps.spendRunnerTagRemovalCredits,
      },
      cards: {
        trashRunnerInstalledCardToHeap: deps.trashRunnerInstalledCardToHeap,
      },
      callbacks: {
        startVirusCounterPurgePreserveChoice:
          deps.startVirusCounterPurgePreserveChoice,
      },
    };
  }

  function creditEconomyExecutionHost(
    state: GameState,
  ): CreditEconomyExecutionHost {
    return {
      state,
      actions: {
        spendClick,
      },
      cards: {
        definitionFor,
        mustInstance,
        publicServerLabelForCard,
        hasCardImplementationForDefinition: (definitionId) =>
          Boolean(cardImplementationForDefinitionId(definitionId)),
        hasCorpUtilityKind: deps.hasCorpUtilityKind,
        uniqueDirectLongtailImplementationForCard:
          deps.uniqueDirectLongtailImplementationForCard,
        randomProgramProbeImplementationForCard: (stateForCard, cardId) => {
          const implementation = cardImplementationForDefinitionId(
            definitionFor(stateForCard, cardId).id,
          );
          if (
            implementation?.icebreakerAbilities?.some(
              (ability) =>
                ability.kind === "break_subroutine" &&
                ability.special?.kind === "run_start_random_strength_bonus",
            )
          ) {
            return {
              family: "icebreakerAbilities" as const,
              kind: "run_start_random_strength_bonus" as const,
            };
          }
          if (implementation?.virusCounter?.counterKind === "boardwalk") {
            return {
              family: "virusCounter" as const,
              kind: "boardwalk" as const,
            };
          }
          return undefined;
        },
      },
      credits: {
        gain: credits,
        spend: spendCredits,
      },
      counters: {
        cardCounter,
        addCardCounter,
        spendCardCounter,
      },
      runner: {
        installedCardIds: runnerInstalledCardIds,
        trashInstalledCardToHeap: deps.trashRunnerInstalledCardToHeap,
        forfeitAgendaForPointCost: deps.forfeitRunnerAgendaForPointCost,
        drawCards: deps.drawRunnerCards,
        applyDrawSummaryPayload: deps.applyRunnerDrawSummaryPayload,
        ensureTurnFlags: ensureRunnerTurnFlags,
      },
      corp: {
        rezzedRootCardIds: deps.rezzedCorpRootCardIds,
        installedCardIds: corpInstalledCardIds,
        publicInstalledCardIdentityKnown: publicInstalledCorpCardIdentityKnown,
        uninstallInstalledCardToHq: uninstallCorpInstalledCardToHq,
        trashInstalledCardToArchives: deps.trashCorpInstalledCardToArchives,
      },
      hiddenZone: {
        resolveV1911RunnerHiddenZoneAbility:
          deps.resolveV1911RunnerHiddenZoneAbility,
        resolveScoredAgendaCorpRdTopReveal:
          deps.resolveScoredAgendaCorpRdTopReveal,
        revealRunnerStackTop: deps.revealRunnerStackTop,
        revealCorpRdTop: deps.revealCorpRdTop,
        resolveReschedulerHqShuffleDraw: (
          stateForAction,
          legalAction,
          sourceCardId,
        ) =>
          resolveReschedulerHqShuffleDraw(
            deps.corpZoneChoiceHandlerHost(stateForAction, legalAction),
            sourceCardId,
          ),
        startCorpAssetRdTopReorderChoice: (
          stateForAction,
          legalAction,
          sourceCardId,
        ) =>
          startCorpAssetRdTopReorderChoice(
            deps.hiddenZoneArrangeChoiceHandlerHost(
              stateForAction,
              legalAction,
            ),
            sourceCardId,
          ),
      },
      delegates: {
        shouldOpenCorpInstalledEconomyCreditChoice:
          deps.shouldOpenCorpInstalledEconomyCreditChoice,
        startCorpInstalledEconomyCreditChoice:
          deps.startCorpInstalledEconomyCreditChoice,
        handleTraceOrchestrationAction: (legalAction) =>
          handleTraceOrchestrationAction(
            deps.traceOrchestrationHost(state),
            legalAction,
          ),
        handleCorpSpecialDamageAbilityAction: (legalAction) =>
          handleCorpSpecialDamageAbilityAction(
            runtime.corpSpecialDamageAbilityHost(state, legalAction),
          ),
        handleScoredAgendaActivatedAbilityAction: (legalAction) =>
          handleScoredAgendaActivatedAbilityAction(
            runtime.scoredAgendaAbilityHost(state, legalAction),
          ),
      },
      random: {
        nextRandom,
      },
    };
  }

  return {
    turnBasicExecutionHost,
    creditEconomyExecutionHost,
  };
}
