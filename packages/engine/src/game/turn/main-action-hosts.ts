import type { GameState } from "@netgrid/shared";
import type { CorpMainActionGenerationHost } from "./corp-main-actions";
import type { RunnerMainActionGenerationHost } from "./runner-main-actions";

type StateHostFn<T> = (state: GameState) => T;

export type MainActionHostCompositionHost = {
  actions: CorpMainActionGenerationHost["actions"] &
    RunnerMainActionGenerationHost["actions"];
  cards: CorpMainActionGenerationHost["cards"] &
    RunnerMainActionGenerationHost["cards"];
  scored: CorpMainActionGenerationHost["agenda"];
  counters: CorpMainActionGenerationHost["counters"] &
    RunnerMainActionGenerationHost["counters"];
  corp: CorpMainActionGenerationHost["corp"];
  runner: CorpMainActionGenerationHost["runner"] &
    RunnerMainActionGenerationHost["runner"];
  run: RunnerMainActionGenerationHost["run"];
  install: CorpMainActionGenerationHost["install"] &
    RunnerMainActionGenerationHost["install"];
  rez: CorpMainActionGenerationHost["rez"];
  cardImplementation: CorpMainActionGenerationHost["abilities"] &
    RunnerMainActionGenerationHost["cardImplementation"];
  specialZones: CorpMainActionGenerationHost["specialZones"] &
    RunnerMainActionGenerationHost["specialZones"];
  callbacks: {
    mustServer: RunnerMainActionGenerationHost["servers"]["mustServer"];
    serverChoiceDisplayLabel: RunnerMainActionGenerationHost["servers"]["serverChoiceDisplayLabel"];
    runnerMemoryLimit: RunnerMainActionGenerationHost["memory"]["runnerMemoryLimit"];
    exposedCorpCardInServer: RunnerMainActionGenerationHost["hiddenZone"]["exposedCorpCardInServer"];
    topHostedProgramOnMicrotech: RunnerMainActionGenerationHost["hiddenZone"]["topHostedProgramOnMicrotech"];
    microtechHostedProgramIds: RunnerMainActionGenerationHost["hiddenZone"]["microtechHostedProgramIds"];
    topRunnerHeapCardId: RunnerMainActionGenerationHost["hiddenZone"]["topRunnerHeapCardId"];
    constants: CorpMainActionGenerationHost["constants"] &
      RunnerMainActionGenerationHost["constants"];
  };
};

export type MainActionHostComposition = {
  corpMainActionGenerationHost: StateHostFn<CorpMainActionGenerationHost>;
  runnerMainActionGenerationHost: StateHostFn<RunnerMainActionGenerationHost>;
};

export function createMainActionHostComposition(
  host: MainActionHostCompositionHost,
): MainActionHostComposition {
  const actions = requiredGroup(host.actions, "actions");
  const cards = requiredGroup(host.cards, "cards");
  const scored = requiredGroup(host.scored, "scored");
  const counters = requiredGroup(host.counters, "counters");
  const corp = requiredGroup(host.corp, "corp");
  const runner = requiredGroup(host.runner, "runner");
  const run = requiredGroup(host.run, "run");
  const install = requiredGroup(host.install, "install");
  const rez = requiredGroup(host.rez, "rez");
  const cardImplementation = requiredGroup(
    host.cardImplementation,
    "cardImplementation",
  );
  const specialZones = requiredGroup(host.specialZones, "specialZones");
  const callbacks = requiredGroup(host.callbacks, "callbacks");

  return {
    corpMainActionGenerationHost: (state) => ({
      state,
      actions: {
        buildLegalAction: actions.buildLegalAction,
        makeActionId: actions.makeActionId,
        buildEndTurnAction: actions.buildEndTurnAction,
        buildForgoActionDebtAction: actions.buildForgoActionDebtAction,
        buildPurgeableRunnerVirusPurgeAction:
          actions.buildPurgeableRunnerVirusPurgeAction,
        buildPurgeVirusAction: actions.buildPurgeVirusAction,
        buildGainCreditAction: actions.buildGainCreditAction,
        buildDrawAction: actions.buildDrawAction,
        buildTrashNewDataFortCreationLockActions:
          actions.buildTrashNewDataFortCreationLockActions,
        buildNewRemoteIceInstallAction: actions.buildNewRemoteIceInstallAction,
        buildServerIceInstallAction: actions.buildServerIceInstallAction,
        buildNewRemoteRootInstallAction:
          actions.buildNewRemoteRootInstallAction,
        buildServerRootInstallAction: actions.buildServerRootInstallAction,
      },
      cards: {
        definitionFor: cards.definitionFor,
        mustInstance: cards.mustInstance,
        isUniqueCard: cards.isUniqueCard,
        hasInstalledUniqueCardDefinition:
          cards.hasInstalledUniqueCardDefinition,
        cardImplementationForDefinitionId:
          cards.cardImplementationForDefinitionId,
        rezzedCorpRootCardIds: cards.rezzedCorpRootCardIds,
        corpInstalledCardIds: cards.corpInstalledCardIds,
        visibleVirusCounterTargetIds: cards.visibleVirusCounterTargetIds,
      },
      agenda: {
        effectiveAgendaDifficulty: scored.effectiveAgendaDifficulty,
        effectiveAgendaDifficultyDeps: scored.effectiveAgendaDifficultyDeps,
        scoredAgendaKindForDefinition: scored.scoredAgendaKindForDefinition,
        serverChoiceDisplayLabel: callbacks.serverChoiceDisplayLabel,
        scoredAgendaAbilityHost: scored.scoredAgendaAbilityHost,
        buildScoredAgendaAbilityActionsForCard:
          scored.buildScoredAgendaAbilityActionsForCard,
      },
      counters: {
        totalCounters: counters.totalCounters,
        purgeableRunnerVirusCounterTotal:
          counters.purgeableRunnerVirusCounterTotal,
        spyCountersForServer: counters.spyCountersForServer,
      },
      corp: {
        corpActionDebtPending: corp.corpActionDebtPending,
        acmeSavingsAndLoanObligationCount:
          corp.acmeSavingsAndLoanObligationCount,
        canPlayCorpOperation: corp.canPlayCorpOperation,
        cardImplementationOperationLegalActions:
          corp.cardImplementationOperationLegalActions,
        corpUtilityImplementationForDefinition:
          corp.corpUtilityImplementationForDefinition,
        powerGridOverloadLegalActions: corp.powerGridOverloadLegalActions,
        systematicLayoffsLegalActions: corp.systematicLayoffsLegalActions,
        corpAgendaPointTotal: corp.corpAgendaPointTotal,
        hasCorpUtilityKind: corp.hasCorpUtilityKind,
        uniqueDirectLongtailKindForDefinition:
          corp.uniqueDirectLongtailKindForDefinition,
        corpInstalledEconomyActionProfileForDefinition:
          corp.corpInstalledEconomyActionProfileForDefinition,
        corpInstalledEconomyActionPayload:
          corp.corpInstalledEconomyActionPayload,
        ...(corp.filterActionsForRestrictedExtraActions
          ? {
              filterActionsForRestrictedExtraActions:
                corp.filterActionsForRestrictedExtraActions,
            }
          : {}),
      },
      runner: {
        isConcealedRunnerResource: runner.isConcealedRunnerResource,
        hiddenRunnerResourceSlotId: runner.hiddenRunnerResourceSlotId,
      },
      install: {
        corpNewDataFortCreationLocked: install.corpNewDataFortCreationLocked,
        corpIceInstallTotalCost: install.corpIceInstallTotalCost,
        canInstallCorpRootCardInServer: install.canInstallCorpRootCardInServer,
        canInstallCorpRootCardInNewRemote:
          install.canInstallCorpRootCardInNewRemote,
        isRegionUpgrade: install.isRegionUpgrade,
        corpRegionUpgradeIdsInServer: install.corpRegionUpgradeIdsInServer,
        corpRootAgendaOrNodeCapacityInServer:
          install.corpRootAgendaOrNodeCapacityInServer,
        corpRootAssetIdsInServer: install.corpRootAssetIdsInServer,
        corpRootMainCardIdsInServer: install.corpRootMainCardIdsInServer,
        isInstalledCorpCardAdvanceable: install.isInstalledCorpCardAdvanceable,
      },
      rez: {
        rootInstallRezzesOnInstall: rez.rootInstallRezzesOnInstall,
        rezCostForCard: rez.rezCostForCard,
        rezCostReductionSourceDefinitionIdsFor:
          rez.rezCostReductionSourceDefinitionIdsFor,
        isAcmeSavingsAndLoanDefinition: rez.isAcmeSavingsAndLoanDefinition,
      },
      abilities: {
        corpTraceDamageAbilityHost:
          cardImplementation.corpTraceDamageAbilityHost,
        corpSpecialDamageAbilityHost:
          cardImplementation.corpSpecialDamageAbilityHost,
        pushCorpTraceDamageOrCardImplementationActions:
          cardImplementation.pushCorpTraceDamageOrCardImplementationActions,
        buildCorpSpecialDamageAbilityActionsForCard:
          cardImplementation.buildCorpSpecialDamageAbilityActionsForCard,
      },
      specialZones: {
        specialZoneHarnessActions: specialZones.specialZoneHarnessActions,
        edgerunnerTempsInstallActionsRemaining:
          specialZones.edgerunnerTempsInstallActionsRemaining,
      },
      constants: callbacks.constants,
    }),
    runnerMainActionGenerationHost: (state) => ({
      state,
      actions: {
        buildLegalAction: actions.buildLegalAction,
        buildRunnerEndTurnAction: actions.buildRunnerEndTurnAction,
        buildRunnerGainCreditAction: actions.buildRunnerGainCreditAction,
        buildRunnerRemoveTagAction: actions.buildRunnerRemoveTagAction,
        buildRunnerDrawCardActions: actions.buildRunnerDrawCardActions,
        buildRunnerProgramInstallAction:
          actions.buildRunnerProgramInstallAction,
        buildRunnerProgramTrashBeforeInstallAction:
          actions.buildRunnerProgramTrashBeforeInstallAction,
        buildRunnerZetatechOverlayInstallAction:
          actions.buildRunnerZetatechOverlayInstallAction,
        buildRunnerHostedProgramInstallAction:
          actions.buildRunnerHostedProgramInstallAction,
        buildRunnerAgendaPointInstallAction:
          actions.buildRunnerAgendaPointInstallAction,
        buildRunnerHardwareInstallAction:
          actions.buildRunnerHardwareInstallAction,
        buildRunnerSelectedServerInstallAction:
          actions.buildRunnerSelectedServerInstallAction,
        buildRunnerResourceInstallAction:
          actions.buildRunnerResourceInstallAction,
        buildRunnerStackSearchProgramToGripAction:
          actions.buildRunnerStackSearchProgramToGripAction,
        buildRunnerValuPakInstallAction:
          actions.buildRunnerValuPakInstallAction,
        buildRunnerValuPakSequenceEndAction:
          actions.buildRunnerValuPakSequenceEndAction,
        buildRunnerShellTradersSetAsideAction:
          actions.buildRunnerShellTradersSetAsideAction,
        buildRunnerShellTradersRemoveCounterAction:
          actions.buildRunnerShellTradersRemoveCounterAction,
      },
      cards: {
        definitionFor: cards.definitionFor,
        isUniqueCard: cards.isUniqueCard,
        hasInstalledUniqueCardDefinition:
          cards.hasInstalledUniqueCardDefinition,
      },
      runner: {
        ensureRunnerTurnFlags: runner.ensureRunnerTurnFlags,
        availableRunnerTagRemovalCredits:
          runner.availableRunnerTagRemovalCredits,
        availableRunnerProgramInstallCredits:
          runner.availableRunnerProgramInstallCredits,
        runnerCostPenaltySupportCreditCapacity:
          runner.runnerCostPenaltySupportCreditCapacity,
        availableRunnerRunStartCredits: runner.availableRunnerRunStartCredits,
        runnerDrawActionContext: runner.runnerDrawActionContext,
        runnerUtilityLongtailKindForCard:
          runner.runnerUtilityLongtailKindForCard,
        uniqueDirectLongtailImplementationForCard:
          runner.uniqueDirectLongtailImplementationForCard,
        ...(runner.filterActionsForRestrictedExtraActions
          ? {
              filterActionsForRestrictedExtraActions:
                runner.filterActionsForRestrictedExtraActions,
            }
          : {}),
      },
      servers: {
        mustServer: callbacks.mustServer,
        serverChoiceDisplayLabel: callbacks.serverChoiceDisplayLabel,
      },
      run: {
        activeRunActionSpendingCapSourceIds:
          run.activeRunActionSpendingCapSourceIds,
        runDurationPaymentHost: run.runDurationPaymentHost,
        isActivityGatedFortRunBlocked: run.isActivityGatedFortRunBlocked,
        fortRunSideFamiliesHostForState: run.fortRunSideFamiliesHostForState,
        runStartTaxForServerUpgrades: run.runStartTaxForServerUpgrades,
        runStartTaxForCorpRootAssets: run.runStartTaxForCorpRootAssets,
      },
      install: {
        shouldOfferRunnerProgramTrashBeforeInstall:
          install.shouldOfferRunnerProgramTrashBeforeInstall,
        canOverlayProgramOnZetatechSoftwareInstaller:
          install.canOverlayProgramOnZetatechSoftwareInstaller,
        canHostProgramOnDaemon: install.canHostProgramOnDaemon,
        cardImplementationAgendaPointInstallCost:
          install.cardImplementationAgendaPointInstallCost,
        pickRunnerAgendaForAgendaPointCost:
          install.pickRunnerAgendaForAgendaPointCost,
        requiresDataFortInstallTarget: install.requiresDataFortInstallTarget,
      },
      memory: {
        runnerMemoryLimit: callbacks.runnerMemoryLimit,
      },
      counters: {
        cardCounter: counters.cardCounter,
        runnerTraceCounterEffectDefinitions:
          counters.runnerTraceCounterEffectDefinitions,
        runnerCounterDisplayName: counters.runnerCounterDisplayName,
      },
      hiddenZone: {
        exposedCorpCardInServer: callbacks.exposedCorpCardInServer,
        topHostedProgramOnMicrotech: callbacks.topHostedProgramOnMicrotech,
        microtechHostedProgramIds: callbacks.microtechHostedProgramIds,
        topRunnerHeapCardId: callbacks.topRunnerHeapCardId,
      },
      specialZones: {
        valuPakProgramInstallActionsRemaining:
          specialZones.valuPakProgramInstallActionsRemaining,
        runnerInstallableProgramIdsForValuPak:
          specialZones.runnerInstallableProgramIdsForValuPak,
        specialZoneHarnessActions: specialZones.specialZoneHarnessActions,
        shellTradersPrepareTargetIds: specialZones.shellTradersPrepareTargetIds,
        shellTradersInstallCost: specialZones.shellTradersInstallCost,
        shellTradersPreparedTargetIds:
          specialZones.shellTradersPreparedTargetIds,
      },
      cardImplementation: {
        runtimeDeps: cardImplementation.runtimeDeps,
        cardImplementationForDefinitionId:
          cardImplementation.cardImplementationForDefinitionId,
        pushEndOfRunnerTurnActions:
          cardImplementation.pushEndOfRunnerTurnActions,
        canPlayPrintedCostOnPlayImplementation:
          cardImplementation.canPlayPrintedCostOnPlayImplementation,
        runnerEventResolver: cardImplementation.runnerEventResolver,
        printedCostMakeRunEffect: cardImplementation.printedCostMakeRunEffect,
        pushActivatedActions: cardImplementation.pushActivatedActions,
      },
      constants: callbacks.constants,
    }),
  };
}

function requiredGroup<T>(value: T | undefined, name: string): T {
  if (!value)
    throw new Error(`MainActionHostCompositionHost.${name} ist erforderlich.`);
  return value;
}
