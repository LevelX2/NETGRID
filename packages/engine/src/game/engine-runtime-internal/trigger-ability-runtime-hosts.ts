import { type CardDefinitionId, type CardInstanceId, type GameState } from "@netgrid/shared";
import { definitionFor, mustInstance, mustServer } from "../state/card-server-lookup";
import { spendClick, spendClicks, spendCredits } from "../state/economy-mutation";
import { addCardCounter, cardCounter, ensureRunnerTurnFlags, setCardCounter, spendCardCounter } from "../state/turn-flags-counters";
import { ensureSpecialZones, removeFromAllZones } from "../state/zone-mutation";
import { newDataFortCreationLockForSource } from "../turn/corp-data-fort-lock";
import { type TriggerAbilityExecutionHost } from "../abilities/trigger-ability-execution";
import {
  handleCounterUtilityTriggerExecution,
  type CounterUtilityTriggerExecutionHost,
} from "../abilities/counter-utility-trigger-execution";
import { handleHiddenZoneTriggerExecution } from "../abilities/hidden-zone-trigger-execution";
import { handleRunFortTriggerExecution, type RunFortTriggerExecutionHost } from "../abilities/run-fort-trigger-execution";
import { handleRunnerSpecialTriggerExecution, type RunnerSpecialTriggerExecutionHost } from "../abilities/runner-special-trigger-execution";
import { openRunnerInstalledTrashPreventionWindow } from "../damage/damage-core";
import { startHiddenStackProgramInstallActivation } from "../hidden-zone/search-choice-activations";
import { resolveSuccessfulRunFollowupAbility } from "../run/successful-run-interventions";
import { shouldLoadLegacyRecurringCredits } from "../run/run-duration-payment";
import { resolveFullyBrokenPassedIceDerez as resolveFullyBrokenPassedIceDerezInRunModule, resolveFullyBrokenPassedIceDerezAndEndRun as resolveFullyBrokenPassedIceDerezAndEndRunInRunModule, resolveFullyBrokenPassedIceTrash as resolveFullyBrokenPassedIceTrashInRunModule } from "../run/encounter-special-windows";
import { resolveApproachIceExposeAbility, resolveApproachIceExposeViewingDecision } from "../run/encounter-entry";
import { resolveFortPassAdvancementWindow, resolveStartRunIceRepositionWindow, startHqIceSwapChoice } from "../run/fort-pass-window";
import { runnerMemoryLimit } from "../../ability-engine/effective-values";
import { publicServerLabel } from "../../public-context";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { executeCardImplementationLifecycleEffects } from "../../ability-engine/card-implementation-runtime";
import type { RuntimeDeps } from "./runtime-shared";

export function createTriggerAbilityRuntimeHosts(
  deps: RuntimeDeps,
  runtime: RuntimeDeps,
): Pick<
  import("./card-runtime-host-port").CardRuntimeHostPort,
  | "runnerSpecialTriggerExecutionHost"
  | "runFortTriggerExecutionHost"
  | "counterUtilityTriggerExecutionHost"
  | "triggerAbilityExecutionHost"
> {
  function runnerSpecialTriggerExecutionHost(
    state: GameState,
  ): RunnerSpecialTriggerExecutionHost {
    return {
      state,
      actions: {
        spendClick,
      },
      cards: {
        definitionFor,
        mustInstance,
        isUniqueCard: deps.isUniqueCard,
        hasInstalledUniqueCardDefinition: deps.hasInstalledUniqueCardDefinition,
        hasCardImplementationMemoryUnitModifier:
          deps.hasCardImplementationMemoryUnitModifier,
        shouldLoadLegacyRecurringCredits,
        hiddenReplacementLongtailKindForDefinition: (definition) =>
          cardImplementationForDefinitionId(definition.id)
            ?.hiddenReplacementLongtail?.kind,
        publicTitle: deps.publicCardTitle,
        additionalAgendaPointInstallCost:
          deps.cardImplementationAgendaPointInstallCost,
      },
      credits: {
        spend: spendCredits,
      },
      counters: {
        cardCounter,
        setCardCounter,
        addCardCounter,
        spendCardCounter,
      },
      zones: {
        removeFromAllZones,
        ensureSpecialZones,
        trashRunnerInstalledCardToHeap: deps.trashRunnerInstalledCardToHeap,
      },
      runner: {
        runnerMemoryLimit,
        canHostProgramOnDaemon: deps.canHostProgramOnDaemon,
        runnerProgramUsesMemory: deps.runnerProgramUsesMemory,
        pickAgendaPointCostSource: () =>
          deps.pickRunnerAgendaForAgendaPointCost(state) as
            | CardInstanceId
            | undefined,
        spendAgendaPointFromScoredCard: (cardId) =>
          deps.spendAgendaPointFromScoredCard(state, cardId),
      },
      hiddenZone: {
        startHiddenStackProgramInstallActivation: (sourceCardId, legalAction) =>
          startHiddenStackProgramInstallActivation(
            deps.hiddenZoneSearchActivationHandlerHost(state, legalAction),
            sourceCardId,
          ),
      },
      lifecycle: {
        executeOnInstall: (legalAction, definition, cardId, effects) =>
          executeCardImplementationLifecycleEffects(
            deps.cardImplementationRuntimeDeps,
            state,
            legalAction,
            definition,
            cardId,
            "on_install",
            effects,
          ),
      },
    };
  }

  function runFortTriggerExecutionHost(
    state: GameState,
  ): RunFortTriggerExecutionHost {
    return {
      state,
      actions: {
        spendClick,
      },
      cards: {
        definitionFor,
        mustInstance,
        runnerUtilityLongtailKindForDefinition: (definition) =>
          cardImplementationForDefinitionId(definition.id)
            ?.runnerUtilityLongtail?.kind,
      },
      zones: {
        removeFromAllZones,
      },
      run: {
        resolveSuccessfulRunFollowupAbility: (legalAction) =>
          resolveSuccessfulRunFollowupAbility(
            deps.successfulRunInterventionHost(state),
            legalAction,
          ),
        resolveFullyBrokenPassedIceDerezAndEndRun: (legalAction) =>
          resolveFullyBrokenPassedIceDerezAndEndRunInRunModule(
            deps.encounterSpecialWindowHostForState(state),
            legalAction,
          ),
        resolveFullyBrokenPassedIceDerez: (legalAction) =>
          resolveFullyBrokenPassedIceDerezInRunModule(
            deps.encounterSpecialWindowHostForState(state),
            legalAction,
          ),
        resolveFullyBrokenPassedIceTrash: (legalAction) =>
          resolveFullyBrokenPassedIceTrashInRunModule(
            deps.encounterSpecialWindowHostForState(state),
            legalAction,
          ),
        resolveFortPassAdvancementWindow: (legalAction) =>
          resolveFortPassAdvancementWindow(
            deps.fortPassWindowHostForState(state),
            legalAction,
          ),
        resolveStartRunIceRepositionWindow: (legalAction) =>
          resolveStartRunIceRepositionWindow(
            deps.fortPassWindowHostForState(state),
            legalAction,
          ),
        resolveApproachIceExposeAbility: (legalAction) =>
          resolveApproachIceExposeAbility(
            deps.encounterEntryHostForState(state),
            legalAction,
          ),
        resolveApproachIceExposeViewingDecision: (legalAction) =>
          resolveApproachIceExposeViewingDecision(
            deps.encounterEntryHostForState(state),
            legalAction,
          ),
        startHqIceSwapChoice: (legalAction) =>
          startHqIceSwapChoice(
            deps.fortPassWindowHostForState(state),
            legalAction,
          ),
      },
    };
  }

  function counterUtilityTriggerExecutionHost(
    state: GameState,
  ): CounterUtilityTriggerExecutionHost {
    return {
      state,
      actions: {
        spendClick,
        spendClicks,
      },
      cards: {
        definitionFor,
        runnerUtilityLongtailKindForCard: deps.runnerUtilityLongtailKindForCard,
        runnerUtilityLongtailImplementationForCard:
          deps.runnerUtilityLongtailImplementationForCard,
      },
      credits: {
        spend: spendCredits,
      },
      counters: {
        cardCounter,
        spendCardCounter,
        spyCountersForServer: deps.spyCountersForServer,
        traceCounterEffectDefinitionFor: deps.traceCounterEffectDefinitionFor,
      },
      runner: {
        ensureTurnFlags: ensureRunnerTurnFlags,
        trashInstalledCardToHeap: deps.trashRunnerInstalledCardToHeap,
      },
      servers: {
        mustServer,
        publicServerLabel,
      },
      dataFort: {
        newDataFortCreationLockForSource,
      },
    };
  }

  function triggerAbilityExecutionHost(
    state: GameState,
  ): TriggerAbilityExecutionHost {
    return {
      state,
      actions: {
        spendClick,
      },
      cards: {
        definitionFor,
        remainingReplacementLongtailKindForCard:
          deps.remainingReplacementLongtailKindForCard,
        cardImplementationForDefinitionId: (definitionId) =>
          cardImplementationForDefinitionId(definitionId as CardDefinitionId),
      },
      credits: {
        spend: spendCredits,
      },
      runner: {
        openInstalledTrashPreventionWindow:
          openRunnerInstalledTrashPreventionWindow,
        trashInstalledCardToHeap: deps.trashRunnerInstalledCardToHeap,
        ensureTurnFlags: ensureRunnerTurnFlags,
      },
      corp: {
        activeObligationCount: deps.activeObligationCount,
        removeActiveObligation: deps.removeActiveObligation,
      },
      actionEconomy: {
        acceptExtraActionOffer: deps.acceptExtraActionOffer,
        declineExtraActionOffer: deps.declineExtraActionOffer,
        resolvePdcaCounterAction: deps.resolvePdcaCounterAction,
        resolveForcedActionNotPossible: deps.resolveForcedActionNotPossible,
      },
      runnerSpecial: {
        handleRunnerSpecialTriggerExecution: (legalAction) =>
          handleRunnerSpecialTriggerExecution(
            runnerSpecialTriggerExecutionHost(state),
            legalAction,
          ),
      },
      runFort: {
        handleRunFortTriggerExecution: (legalAction) =>
          handleRunFortTriggerExecution(
            runFortTriggerExecutionHost(state),
            legalAction,
          ),
      },
      counterUtility: {
        handleCounterUtilityTriggerExecution: (legalAction) =>
          handleCounterUtilityTriggerExecution(
            counterUtilityTriggerExecutionHost(state),
            legalAction,
          ),
      },
      hiddenZone: {
        handleHiddenZoneTriggerExecution: (legalAction) =>
          handleHiddenZoneTriggerExecution(
            deps.hiddenZoneSearchActivationHandlerHost(state, legalAction),
            legalAction,
          ),
      },
    };
  }

  return {
    runnerSpecialTriggerExecutionHost,
    runFortTriggerExecutionHost,
    counterUtilityTriggerExecutionHost,
    triggerAbilityExecutionHost,
  };
}
