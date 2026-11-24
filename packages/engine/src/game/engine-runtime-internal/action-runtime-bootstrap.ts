import * as runtimePorts from "./runtime-port-bindings";
import {
  quoteCorpRootRezCost,
  rezCostForCard,
  rezCostReductionSourceDefinitionIdsFor,
} from "../payment";
import { startRunnerMemoryCheckpointChoice } from "../checkpoints/runner-memory-checkpoint";
import { refreshCorpBidPaymentChoice } from "../trace/trace-orchestration";
import {
  corpInstalledCardIds,
  corpRootAssetIdsInServer,
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustServer,
} from "../state/card-server-lookup";
import { cardCounter } from "../state/turn-flags-counters";
import {
  configureLegalActionHostComposition,
  type LegalActionHostCompositionHost,
} from "../legal-action-hosts";
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
  buildCorpTrashNewDataFortCreationLockActions,
  corpNewDataFortCreationLocked,
} from "../turn/corp-data-fort-lock";
import {
  buildRunnerEndTurnAction,
  buildRunnerGainCreditAction,
  buildRunnerRemoveTagAction,
} from "../turn/runner-basic-actions";
import { buildRunnerDrawCardActions } from "../turn/runner-draw-actions";
import { corpActionDebtPending, purgeableRunnerVirusCounterTotal } from "../turn/turn-basic-execution";
import {
  delayedInstallCounterCost,
  delayedInstallPreparedTargetIds,
  delayedInstallPrepareTargetIds,
} from "../abilities/runner-special-trigger-execution";
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
import {
  buildRunnerDelayedInstallRemoveCounterAction,
  buildRunnerDelayedInstallSetAsideAction,
  buildRunnerValuPakInstallAction,
  buildRunnerValuPakSequenceEndAction,
} from "../turn/runner-special-zone-install-actions";
import { buildScoredAgendaAbilityActionsForCard } from "../corp/scored-agenda-abilities";
import { buildCorpSpecialDamageAbilityActionsForCard } from "../corp/special-damage-abilities";
import {
  activeRunActionSpendingCapSourceIds,
  availableRunnerRunStartCredits,
  runDurationPaymentHost,
} from "../run/run-duration-payment";
import {
  canPlayCorpOperation,
  cardImplementationOperationLegalActions,
  corpUtilityImplementationForDefinition,
} from "../play/corp-operation-resolution";
import { applyAction as applyActionFromGame } from "../apply-action";
import {
  configureApplyActionHostComposition,
  type ApplyActionHostCompositionHost,
} from "../apply/apply-action-hosts";
import { hiddenRunnerResourceSlotId, isConcealedRunnerResource } from "../view/card-view";
import { effectiveAgendaDifficulty, runnerMemoryLimit } from "../../ability-engine/effective-values";
import { serverChoiceDisplayLabel } from "../view/server-view";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  canPlayPrintedCostOnPlayImplementation,
  pushActivatedCardImplementationActions,
  pushCardImplementationEndOfRunnerTurnActions,
} from "../../ability-engine/card-implementation-runtime";
import type { CardInstallCapabilityImplementation } from "../../ability-engine/definition-types";

import {
  cardImplementationAgendaPointInstallCost,
  effectiveAgendaDifficultyDeps,
  pickRunnerAgendaForAgendaPointCost,
} from "./runtime-bootstrap-support";
import type { RuntimeDeps } from "./runtime-shared";

export function configureActionRuntimeBootstrap({
  cardImplementationRuntimeDeps,
  runFlow,
}: Pick<RuntimeDeps, "cardImplementationRuntimeDeps" | "runFlow">) {
  const mainActionHostComposition = createMainActionHostComposition({
    actions: {
      buildLegalAction: action,
      makeActionId,
      buildEndTurnAction: buildCorpEndTurnAction,
      buildForgoActionDebtAction: (state) =>
        legalActionHostComposition.buildCorpForgoActionDebtAction(state),
      buildPurgeableRunnerVirusPurgeAction: (state) =>
        legalActionHostComposition.buildPurgeableRunnerVirusPurgeAction(state),
      buildPurgeVirusAction: buildCorpPurgeVirusAction,
      buildGainCreditAction: buildCorpGainCreditAction,
      buildDrawAction: buildCorpDrawAction,
      buildTrashNewDataFortCreationLockActions:
        buildCorpTrashNewDataFortCreationLockActions,
      buildNewRemoteIceInstallAction: buildCorpNewRemoteIceInstallAction,
      buildServerIceInstallAction: buildCorpServerIceInstallAction,
      buildNewRemoteRootInstallAction: buildCorpNewRemoteRootInstallAction,
      buildServerRootInstallAction: buildCorpServerRootInstallAction,
      buildRunnerEndTurnAction,
      buildRunnerGainCreditAction,
      buildRunnerRemoveTagAction,
      buildRunnerDrawCardActions,
      buildRunnerProgramInstallAction,
      buildRunnerProgramTrashBeforeInstallAction,
      buildRunnerHostedProgramInstallAction,
      buildRunnerAgendaPointInstallAction,
      buildRunnerHardwareInstallAction,
      buildRunnerSelectedServerInstallAction,
      buildRunnerResourceInstallAction,
      buildRunnerValuPakInstallAction,
      buildRunnerValuPakSequenceEndAction,
      buildRunnerDelayedInstallSetAsideAction,
      buildRunnerDelayedInstallRemoveCounterAction,
    },
    cards: {
      definitionFor,
      mustInstance,
      isUniqueCard: runtimePorts.isUniqueCard,
      hasInstalledUniqueCardDefinition:
        runtimePorts.hasInstalledUniqueCardDefinition,
      cardImplementationForDefinitionId,
      rezzedCorpRootCardIds: runtimePorts.rezzedCorpRootCardIds,
      corpInstalledCardIds,
    },
    scored: {
      effectiveAgendaDifficulty: (state, agendaId) =>
        effectiveAgendaDifficulty(
          effectiveAgendaDifficultyDeps,
          state,
          agendaId,
        ),
      scoredAgendaKindForDefinition: runtimePorts.scoredAgendaKindForDefinition,
      serverChoiceDisplayLabel,
      bindScoredAgendaAbilityActions: (state) => {
        const host = runtimePorts.scoredAgendaAbilityHost(state);
        return (agendaId) =>
          buildScoredAgendaAbilityActionsForCard(host, agendaId);
      },
    },
    counters: {
      totalCounters: runtimePorts.totalCounters,
      purgeableRunnerVirusCounterTotal,
      spyCountersForServer: runtimePorts.spyCountersForServer,
      cardCounter,
      runnerTraceCounterEffectDefinitions:
        runtimePorts.runnerTraceCounterEffectDefinitions,
      runnerCounterDisplayName: runtimePorts.runnerCounterDisplayName,
    },
    corp: {
      corpActionDebtPending,
      activeObligationCount: runtimePorts.activeObligationCount,
      canPlayCorpOperation: (stateToRead, definition) =>
        canPlayCorpOperation(
          runtimePorts.corpOperationResolutionHost(stateToRead),
          definition,
        ),
      cardImplementationOperationLegalActions: (
        stateToRead,
        cardId,
        definition,
      ) =>
        cardImplementationOperationLegalActions(
          runtimePorts.corpOperationResolutionHost(stateToRead),
          cardId,
          definition,
        ),
      corpUtilityImplementationForDefinition,
      hardwareTrashByCounterLegalActions:
        runtimePorts.hardwareTrashByCounterLegalActions,
      corpAgendaPointTotal: runtimePorts.corpAgendaPointTotal,
      hasCorpUtilityKind: runtimePorts.hasCorpUtilityKind,
      filterActionsForRestrictedExtraActions:
        runtimePorts.filterActionsForRestrictedExtraActions,
    },
    runner: {
      isConcealedRunnerResource,
      hiddenRunnerResourceSlotId,
      availableRunnerTagRemovalCredits:
        runtimePorts.availableRunnerTagRemovalCredits,
      availableRunnerProgramInstallCredits:
        runtimePorts.availableRunnerProgramInstallCredits,
      runnerCostPenaltySupportCreditCapacity:
        runtimePorts.runnerCostPenaltySupportCreditCapacity,
      availableRunnerRunStartCredits,
      runnerDrawActionContext: runtimePorts.runnerDrawActionContext,
      runnerUtilityLongtailKindForCard:
        runtimePorts.runnerUtilityLongtailKindForCard,
      uniqueDirectLongtailImplementationForCard:
        runtimePorts.uniqueDirectLongtailImplementationForCard,
      filterActionsForRestrictedExtraActions:
        runtimePorts.filterActionsForRestrictedExtraActions,
    },
    run: {
      activeRunActionSpendingCapSourceIds,
      runDurationPaymentHost,
      runStartCreditLossForServer: runtimePorts.runStartCreditLossForServer,
      runStartTaxForCorpRootAssets: runtimePorts.runStartTaxForCorpRootAssets,
    },
    install: {
      corpNewDataFortCreationLocked,
      corpIceInstallTotalCost: runtimePorts.corpIceInstallTotalCost,
      canInstallCorpRootCardInServer:
        runtimePorts.canInstallCorpRootCardInServer,
      canInstallCorpRootCardInNewRemote: (definition) =>
        !runtimePorts.requiresDataFortInstallTarget(definition) &&
        !runtimePorts
          .cardInstallCapabilitiesForDefinition(definition.id)
          .some(
            (capability: CardInstallCapabilityImplementation) =>
              capability.kind === "install_only_in_hq_or_rd" ||
              capability.kind === "install_only_in_hq",
          ) &&
        (definition.type === "agenda" ||
          definition.type === "asset" ||
          definition.type === "upgrade"),
      isRegionUpgrade: runtimePorts.isRegionUpgrade,
      corpRegionUpgradeIdsInServer: runtimePorts.corpRegionUpgradeIdsInServer,
      corpRootAgendaOrNodeCapacityInServer:
        runtimePorts.corpRootAgendaOrNodeCapacityInServer,
      corpRootAssetIdsInServer,
      corpRootMainCardIdsInServer,
      isInstalledCorpCardAdvanceable:
        runtimePorts.isInstalledCorpCardAdvanceable,
      shouldOfferRunnerProgramTrashBeforeInstall:
        runtimePorts.shouldOfferRunnerProgramTrashBeforeInstall,
      canHostProgramOnDaemon: runtimePorts.canHostProgramOnDaemon,
      cardImplementationAgendaPointInstallCost,
      pickRunnerAgendaForAgendaPointCost,
      requiresDataFortInstallTarget: runtimePorts.requiresDataFortInstallTarget,
    },
    rez: {
      rootInstallRezzesOnInstall: runtimePorts.rootInstallRezzesOnInstall,
      rezCostForCard,
      quoteCorpRootRezCost,
      rezCostReductionSourceDefinitionIdsFor,
      isObligationDebtDefinition: runtimePorts.isObligationDebtDefinition,
    },
    cardImplementation: {
      bindTraceDamageActions: (state) => {
        const host = runtimePorts.corpTraceDamageAbilityHost(state);
        return (actions, cardId) =>
          runtimePorts.pushCorpTraceDamageOrCardImplementationActions(
            state,
            actions,
            cardId,
            host,
          );
      },
      bindSpecialDamageActions: (state) => {
        const host = runtimePorts.corpSpecialDamageAbilityHost(state);
        return (cardId) =>
          buildCorpSpecialDamageAbilityActionsForCard(host, cardId);
      },
      cardImplementationForDefinitionId,
      pushEndOfRunnerTurnActions: (state, actions) =>
        pushCardImplementationEndOfRunnerTurnActions(
          cardImplementationRuntimeDeps,
          state,
          actions,
        ),
      canPlayPrintedCostOnPlayImplementation: (state, definition) =>
        canPlayPrintedCostOnPlayImplementation(
          cardImplementationRuntimeDeps,
          state,
          definition,
        ),
      runnerEventResolver: runtimePorts.cardImplementationRunnerEventResolver,
      printedCostMakeRunEffect:
        runtimePorts.printedCostCardImplementationMakeRunEffect,
      pushActivatedActions: (
        state,
        actions,
        side,
        cardId,
        definition,
        options,
      ) =>
        pushActivatedCardImplementationActions(
          cardImplementationRuntimeDeps,
          state,
          actions,
          side,
          cardId,
          definition,
          options,
        ),
    },
    specialZones: {
      specialZoneHarnessActions: runtimePorts.specialZoneHarnessActions,
      edgerunnerTempsInstallActionsRemaining:
        runtimePorts.edgerunnerTempsInstallActionsRemaining,
      valuPakProgramInstallActionsRemaining:
        runtimePorts.valuPakProgramInstallActionsRemaining,
      runnerInstallableProgramIdsForValuPak:
        runtimePorts.runnerInstallableProgramIdsForValuPak,
      delayedInstallPrepareTargetIds: (stateToRead) =>
        delayedInstallPrepareTargetIds(
          runtimePorts.runnerSpecialTriggerExecutionHost(stateToRead),
        ),
      delayedInstallCounterCost,
      delayedInstallPreparedTargetIds: (stateToRead) =>
        delayedInstallPreparedTargetIds(
          runtimePorts.runnerSpecialTriggerExecutionHost(stateToRead),
        ),
    },
    callbacks: {
      mustServer,
      serverChoiceDisplayLabel,
      runnerMemoryLimit,
    },
  } satisfies MainActionHostCompositionHost);

  const legalActionHostComposition = configureLegalActionHostComposition({
    actions: {
      buildChoiceAction: runtimePorts.choiceAction,
      corpRunnerActionPaidWindowActions:
        runtimePorts.corpRunnerActionPaidWindowActions,
      runnerRunSpecialEffectActions: runtimePorts.runnerRunSpecialEffectActions,
    },
    counters: {
      corpActionDebtPending,
      purgeableRunnerVirusCounterTotal,
    },
    hosts: {
      corpMainActionGenerationHost:
        mainActionHostComposition.corpMainActionGenerationHost,
      runnerMainActionGenerationHost:
        mainActionHostComposition.runnerMainActionGenerationHost,
      runnerEncounterActionHost: runtimePorts.runnerEncounterActionHostForState,
      encounterEntryHost: runtimePorts.encounterEntryHostForState,
      runRezWindowHost: runtimePorts.runRezWindowHostForState,
      runMovementHost: runtimePorts.runMovementHostForState,
      runCardImplementationActionHost:
        runtimePorts.runCardImplementationActionHost,
      runnerAccessActionHost: runtimePorts.runnerAccessActionHost,
    },
  } satisfies LegalActionHostCompositionHost);

  const applyActionHostComposition: ApplyActionHostCompositionHost = {
    actions: {
      applyAction: applyActionFromGame,
      afterPerformAction: (state, legalAction) => {
        if (runtimePorts.clickCostForAction(legalAction) > 0)
          runtimePorts.consumeRestrictedExtraActionForAction(
            state,
            legalAction,
          );
        startRunnerMemoryCheckpointChoice({
          state,
          runnerMemoryLimit: () => runnerMemoryLimit(state),
          runnerProgramUsesMemory: (cardId) =>
            runtimePorts.runnerProgramUsesMemory(state, cardId),
          definitionFor: (cardId) => definitionFor(state, cardId),
          trashRunnerInstalledCardToHeap: (cardId, action) =>
            runtimePorts.trashRunnerInstalledCardToHeap(state, cardId, action),
        });
        if (
          legalAction.type !== "resolve_choice" &&
          state.pendingChoice?.traceCorpPayment
        )
          refreshCorpBidPaymentChoice(
            runtimePorts.traceOrchestrationHost(state),
          );
        if (
          !state.pendingChoice &&
          !state.imminentEvent &&
          !state.eventModificationWindow &&
          !state.replacementWindow
        )
          delete state.runnerTurnFlags?.currentRunnerActionOrdinal;
      },
    },
    perform: {
      turn: { turnBasicExecutionHost: runtimePorts.turnBasicExecutionHost },
      economy: {
        creditEconomyExecutionHost: runtimePorts.creditEconomyExecutionHost,
      },
      abilities: {
        triggerAbilityExecutionHost: runtimePorts.triggerAbilityExecutionHost,
      },
      cardImplementation: {
        activatedCardImplementationExecutionHost:
          runtimePorts.activatedCardImplementationExecutionHost,
      },
      play: { playCardExecutionHost: runtimePorts.playCardExecutionHost },
      install: { installCardHost: runtimePorts.installCardHost },
      board: {
        boardStateActionExecutionHost:
          runtimePorts.boardStateActionExecutionHost,
      },
      corp: { scoredAgendaFlowHost: runtimePorts.scoredAgendaFlowHost },
      run: {
        startRunActionExecutionHost: runtimePorts.startRunActionExecutionHost,
        runMovementHostForState: runtimePorts.runMovementHostForState,
        runnerBreakerActionExecutionHost:
          runtimePorts.runnerBreakerActionExecutionHost,
        continueRun: (state, legalAction) =>
          runFlow.continueRun(state, legalAction),
      },
      rez: { rezActionExecutionHost: runtimePorts.rezActionExecutionHost },
      access: { accessFlowHost: runtimePorts.accessFlowHost },
      choices: {
        pendingChoiceResolutionHost: runtimePorts.pendingChoiceResolutionHost,
      },
    },
  };

  configureApplyActionHostComposition(applyActionHostComposition);

  return {
    mainActionHostComposition,
    legalActionHostComposition,
    applyActionHostComposition,
  };
}
