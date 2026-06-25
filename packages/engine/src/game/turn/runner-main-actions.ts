import {
  DEMO_CARDS_BY_ID,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type MultiServerSuccessSequenceState,
} from "@netgrid/shared";

type HostFn<T = unknown> = (...args: any[]) => T;

export type RunnerMainActionGenerationHost = {
  state: GameState;
  actions: {
    buildLegalAction: HostFn<LegalAction>;
    buildRunnerEndTurnAction: HostFn<LegalAction>;
    buildRunnerGainCreditAction: HostFn<LegalAction>;
    buildRunnerRemoveTagAction: HostFn<LegalAction>;
    buildRunnerDrawCardActions: HostFn<LegalAction[]>;
    buildRunnerProgramInstallAction: HostFn<LegalAction>;
    buildRunnerProgramTrashBeforeInstallAction: HostFn<LegalAction>;
    buildRunnerZetatechOverlayInstallAction: HostFn<LegalAction>;
    buildRunnerHostedProgramInstallAction: HostFn<LegalAction>;
    buildRunnerAgendaPointInstallAction: HostFn<LegalAction>;
    buildRunnerHardwareInstallAction: HostFn<LegalAction>;
    buildRunnerSelectedServerInstallAction: HostFn<LegalAction>;
    buildRunnerResourceInstallAction: HostFn<LegalAction>;
    buildRunnerStackSearchProgramToGripAction: HostFn<LegalAction>;
    buildRunnerValuPakInstallAction: HostFn<LegalAction>;
    buildRunnerValuPakSequenceEndAction: HostFn<LegalAction>;
    buildRunnerDelayedInstallSetAsideAction: HostFn<LegalAction>;
    buildRunnerDelayedInstallRemoveCounterAction: HostFn<LegalAction>;
  };
  cards: {
    definitionFor: HostFn<any>;
    isUniqueCard: HostFn<boolean>;
    hasInstalledUniqueCardDefinition: HostFn<boolean>;
  };
  runner: {
    ensureRunnerTurnFlags: HostFn<any>;
    filterActionsForRestrictedExtraActions?: HostFn<LegalAction[]>;
    availableRunnerTagRemovalCredits: HostFn<number>;
    availableRunnerProgramInstallCredits: HostFn<number>;
    runnerCostPenaltySupportCreditCapacity: HostFn<number>;
    availableRunnerRunStartCredits: HostFn<number>;
    runnerDrawActionContext: HostFn<any>;
    runnerUtilityLongtailKindForCard: HostFn<string | undefined>;
    uniqueDirectLongtailImplementationForCard: HostFn<any>;
  };
  servers: {
    mustServer: HostFn<any>;
    serverChoiceDisplayLabel: HostFn<string>;
  };
  run: {
    activeRunActionSpendingCapSourceIds: HostFn<string[]>;
    runDurationPaymentHost: HostFn<unknown>;
    isActivityGatedFortRunBlocked: HostFn<boolean>;
    fortRunSideFamiliesHostForState: HostFn<unknown>;
    runStartTaxForServerUpgrades: HostFn<{
      amount: number;
      sourceDefinitionIds: string[];
    }>;
    runStartTaxForCorpRootAssets: HostFn<{
      amount: number;
      sourceDefinitionIds: string[];
    }>;
  };
  install: {
    shouldOfferRunnerProgramTrashBeforeInstall: HostFn<boolean>;
    canOverlayProgramOnInstalledProgramHost: HostFn<boolean>;
    canHostProgramOnDaemon: HostFn<boolean>;
    cardImplementationAgendaPointInstallCost: HostFn<number>;
    pickRunnerAgendaForAgendaPointCost: HostFn<string | undefined>;
    requiresDataFortInstallTarget: HostFn<boolean>;
  };
  memory: {
    runnerMemoryLimit: HostFn<number>;
  };
  counters: {
    cardCounter: HostFn<number>;
    runnerTraceCounterEffectDefinitions: HostFn<any[]>;
    runnerCounterDisplayName: HostFn<string>;
  };
  hiddenZone: {
    exposedCorpCardInServer: HostFn<string | undefined>;
    topHostedProgramOnHardware: HostFn<string | undefined>;
    hostedProgramIdsOnHardware: HostFn<string[]>;
    topRunnerHeapCardId: HostFn<string | undefined>;
  };
  specialZones: {
    valuPakProgramInstallActionsRemaining: HostFn<number>;
    runnerInstallableProgramIdsForValuPak: HostFn<string[]>;
    specialZoneHarnessActions: HostFn<LegalAction[]>;
    delayedInstallPrepareTargetIds: HostFn<string[]>;
    delayedInstallCounterCost: HostFn<number>;
    delayedInstallPreparedTargetIds: HostFn<string[]>;
  };
  cardImplementation: {
    runtimeDeps: unknown;
    cardImplementationForDefinitionId: HostFn<any>;
    pushEndOfRunnerTurnActions: HostFn<void>;
    canPlayPrintedCostOnPlayImplementation: HostFn<boolean>;
    runnerEventResolver: HostFn<any>;
    printedCostMakeRunEffect: HostFn<any>;
    pushActivatedActions: HostFn<void>;
  };
  constants: {
    RUNNER_EVENT_RESOLVERS: Record<string, any>;
    STACK_SEARCH_PROGRAM_SOURCES: ReadonlySet<string>;
    SELF_MODIFYING_CODE_ID: string;
    PAID_STACK_SEARCH_RESOURCE_SOURCE: string;
    DAILY_CREDIT_RESOURCE_SOURCE: string;
    SERVER_EXPOSE_PROGRAM_SOURCES: ReadonlySet<string>;
    COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE: string;
    COUNTER_GAIN_PROGRAM_SOURCE: string;
    BOARDWALK_RANDOM_PROGRAM_SOURCE: string;
    HOST_RETURN_HARDWARE_SOURCE: string;
    RANDOM_RESOURCE_SOURCE: string;
    STACK_TOP_REORDER_RESOURCE_SOURCE: string;
    JUNKYARD_BBS_ID: string;
    SHELL_TRADERS_ID: string;
    DANSHIS_SECOND_ID: string;
    BODYWEIGHT_DATA_CRECHE_ID: string;
    ALL_NIGHTER_ID: string;
  };
};

function runnerInstallCapabilitiesMet(
  host: RunnerMainActionGenerationHost,
  definition: any,
): boolean {
  const installCapabilities =
    host.cardImplementation.cardImplementationForDefinitionId(definition.id)
      ?.installCapabilities ?? [];
  for (const capability of installCapabilities) {
    if (capability.kind !== "runner_made_successful_run_on_server_this_turn")
      continue;
    const flags = host.runner.ensureRunnerTurnFlags(host.state);
    if (capability.server === "hq" && flags.successfulHqRunThisTurn !== true)
      return false;
    if (capability.server === "rd" && flags.successfulRdRunThisTurn !== true)
      return false;
    if (
      capability.server === "any_data_fort" &&
      flags.successfulRunThisTurn !== true
    )
      return false;
  }
  return true;
}

export function buildRunnerMainActions(
  host: RunnerMainActionGenerationHost,
): LegalAction[] {
  const state = host.state;
  const action = host.actions.buildLegalAction;
  const buildRunnerEndTurnAction = host.actions.buildRunnerEndTurnAction;
  const buildRunnerGainCreditAction = host.actions.buildRunnerGainCreditAction;
  const buildRunnerRemoveTagAction = host.actions.buildRunnerRemoveTagAction;
  const buildRunnerDrawCardActions = host.actions.buildRunnerDrawCardActions;
  const buildRunnerProgramInstallAction =
    host.actions.buildRunnerProgramInstallAction;
  const buildRunnerProgramTrashBeforeInstallAction =
    host.actions.buildRunnerProgramTrashBeforeInstallAction;
  const buildRunnerZetatechOverlayInstallAction =
    host.actions.buildRunnerZetatechOverlayInstallAction;
  const buildRunnerHostedProgramInstallAction =
    host.actions.buildRunnerHostedProgramInstallAction;
  const buildRunnerAgendaPointInstallAction =
    host.actions.buildRunnerAgendaPointInstallAction;
  const buildRunnerHardwareInstallAction =
    host.actions.buildRunnerHardwareInstallAction;
  const buildRunnerSelectedServerInstallAction =
    host.actions.buildRunnerSelectedServerInstallAction;
  const buildRunnerResourceInstallAction =
    host.actions.buildRunnerResourceInstallAction;
  const buildRunnerStackSearchProgramToGripAction =
    host.actions.buildRunnerStackSearchProgramToGripAction;
  const buildRunnerValuPakInstallAction =
    host.actions.buildRunnerValuPakInstallAction;
  const buildRunnerValuPakSequenceEndAction =
    host.actions.buildRunnerValuPakSequenceEndAction;
  const buildRunnerDelayedInstallSetAsideAction =
    host.actions.buildRunnerDelayedInstallSetAsideAction;
  const buildRunnerDelayedInstallRemoveCounterAction =
    host.actions.buildRunnerDelayedInstallRemoveCounterAction;
  const definitionFor = host.cards.definitionFor;
  const mustServer = host.servers.mustServer;
  const serverChoiceDisplayLabel = host.servers.serverChoiceDisplayLabel;
  const isUniqueCard = host.cards.isUniqueCard;
  const hasInstalledUniqueCardDefinition =
    host.cards.hasInstalledUniqueCardDefinition;
  const cardImplementationForDefinitionId =
    host.cardImplementation.cardImplementationForDefinitionId;
  const ensureRunnerTurnFlags = host.runner.ensureRunnerTurnFlags;
  const filterActionsForRestrictedExtraActions =
    host.runner.filterActionsForRestrictedExtraActions ??
    ((_state: GameState, _side: "runner", candidateActions: LegalAction[]) =>
      candidateActions);
  const availableRunnerTagRemovalCredits =
    host.runner.availableRunnerTagRemovalCredits;
  const availableRunnerProgramInstallCredits =
    host.runner.availableRunnerProgramInstallCredits;
  const runnerCostPenaltySupportCreditCapacity =
    host.runner.runnerCostPenaltySupportCreditCapacity;
  const availableRunnerRunStartCredits =
    host.runner.availableRunnerRunStartCredits;
  const runnerMemoryLimit = host.memory.runnerMemoryLimit;
  const cardCounter = host.counters.cardCounter;
  const runnerTraceCounterEffectDefinitions =
    host.counters.runnerTraceCounterEffectDefinitions;
  const runnerCounterDisplayName = host.counters.runnerCounterDisplayName;
  const valuPakProgramInstallActionsRemaining =
    host.specialZones.valuPakProgramInstallActionsRemaining;
  const runnerInstallableProgramIdsForValuPak =
    host.specialZones.runnerInstallableProgramIdsForValuPak;
  const specialZoneHarnessActions = host.specialZones.specialZoneHarnessActions;
  const delayedInstallPrepareTargetIds =
    host.specialZones.delayedInstallPrepareTargetIds;
  const delayedInstallCounterCost = host.specialZones.delayedInstallCounterCost;
  const delayedInstallPreparedTargetIds =
    host.specialZones.delayedInstallPreparedTargetIds;
  const activeRunActionSpendingCapSourceIds =
    host.run.activeRunActionSpendingCapSourceIds;
  const runDurationPaymentHost = host.run.runDurationPaymentHost;
  const isActivityGatedFortRunBlocked = host.run.isActivityGatedFortRunBlocked;
  const fortRunSideFamiliesHostForState =
    host.run.fortRunSideFamiliesHostForState;
  const runStartTaxForServerUpgrades = host.run.runStartTaxForServerUpgrades;
  const runStartTaxForCorpRootAssets = host.run.runStartTaxForCorpRootAssets;
  const shouldOfferRunnerProgramTrashBeforeInstall =
    host.install.shouldOfferRunnerProgramTrashBeforeInstall;
  const canOverlayProgramOnInstalledProgramHost =
    host.install.canOverlayProgramOnInstalledProgramHost;
  const canHostProgramOnDaemon = host.install.canHostProgramOnDaemon;
  const cardImplementationAgendaPointInstallCost =
    host.install.cardImplementationAgendaPointInstallCost;
  const pickRunnerAgendaForAgendaPointCost =
    host.install.pickRunnerAgendaForAgendaPointCost;
  const requiresDataFortInstallTarget =
    host.install.requiresDataFortInstallTarget;
  const cardImplementationRuntimeDeps = host.cardImplementation.runtimeDeps;
  const pushCardImplementationEndOfRunnerTurnActions =
    host.cardImplementation.pushEndOfRunnerTurnActions;
  const canPlayPrintedCostOnPlayImplementation =
    host.cardImplementation.canPlayPrintedCostOnPlayImplementation;
  const cardImplementationRunnerEventResolver =
    host.cardImplementation.runnerEventResolver;
  const printedCostCardImplementationMakeRunEffect =
    host.cardImplementation.printedCostMakeRunEffect;
  const pushActivatedCardImplementationActions =
    host.cardImplementation.pushActivatedActions;
  const runnerDrawActionContext = host.runner.runnerDrawActionContext;
  const exposedCorpCardInServer = host.hiddenZone.exposedCorpCardInServer;
  const topHostedProgramOnHardware =
    host.hiddenZone.topHostedProgramOnHardware;
  const hostedProgramIdsOnHardware = host.hiddenZone.hostedProgramIdsOnHardware;
  const runnerUtilityLongtailKindForCard =
    host.runner.runnerUtilityLongtailKindForCard;
  const uniqueDirectLongtailImplementationForCard =
    host.runner.uniqueDirectLongtailImplementationForCard;
  const topRunnerHeapCardId = host.hiddenZone.topRunnerHeapCardId;
  const RUNNER_EVENT_RESOLVERS = host.constants.RUNNER_EVENT_RESOLVERS;
  const STACK_SEARCH_PROGRAM_SOURCES =
    host.constants.STACK_SEARCH_PROGRAM_SOURCES;
  const SELF_MODIFYING_CODE_ID = host.constants.SELF_MODIFYING_CODE_ID;
  const PAID_STACK_SEARCH_RESOURCE_SOURCE =
    host.constants.PAID_STACK_SEARCH_RESOURCE_SOURCE;
  const DAILY_CREDIT_RESOURCE_SOURCE =
    host.constants.DAILY_CREDIT_RESOURCE_SOURCE;
  const SERVER_EXPOSE_PROGRAM_SOURCES =
    host.constants.SERVER_EXPOSE_PROGRAM_SOURCES;
  const COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE =
    host.constants.COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE;
  const COUNTER_GAIN_PROGRAM_SOURCE =
    host.constants.COUNTER_GAIN_PROGRAM_SOURCE;
  const BOARDWALK_RANDOM_PROGRAM_SOURCE =
    host.constants.BOARDWALK_RANDOM_PROGRAM_SOURCE;
  const HOST_RETURN_HARDWARE_SOURCE =
    host.constants.HOST_RETURN_HARDWARE_SOURCE;
  const RANDOM_RESOURCE_SOURCE =
    host.constants.RANDOM_RESOURCE_SOURCE;
  const STACK_TOP_REORDER_RESOURCE_SOURCE =
    host.constants.STACK_TOP_REORDER_RESOURCE_SOURCE;
  const JUNKYARD_BBS_ID = host.constants.JUNKYARD_BBS_ID;
  const SHELL_TRADERS_ID = host.constants.SHELL_TRADERS_ID;
  const DANSHIS_SECOND_ID = host.constants.DANSHIS_SECOND_ID;
  const BODYWEIGHT_DATA_CRECHE_ID = host.constants.BODYWEIGHT_DATA_CRECHE_ID;
  const ALL_NIGHTER_ID = host.constants.ALL_NIGHTER_ID;

  const actions: LegalAction[] = [];
  const flags = ensureRunnerTurnFlags(state);
  const hasClicks = state.runner.clicks > 0;
  const unusedRunOnlyActionSourceIds = activeRunActionSpendingCapSourceIds(
    runDurationPaymentHost(state),
  ).filter(
    (sourceCardId) =>
      !(flags.runOnlyActionUsedSourceIdsThisTurn ?? []).includes(sourceCardId),
  );
  const pendingSequence = nextMultiServerSuccessSequence(flags);
  const nextSequenceServerId = pendingSequence?.pendingServerIds[0];
  if (pendingSequence && nextSequenceServerId) {
    const forcedRunActions = buildMultiServerSuccessSequenceForcedRunActions(host, {
      pendingSequence,
      nextSequenceServerId,
      runDurationPaymentHost: runDurationPaymentHost(state),
    });
    if (forcedRunActions.length > 0) return forcedRunActions;
    return [
      action(
        state,
        "runner",
        "trigger_ability",
        `${pendingSequence.sourceTitle}: Sequenz scheitert`,
        "game_rule",
        [],
        {
          runnerAbility: "multi_server_success_sequence_failed",
          sourceDefinitionId: pendingSequence.sourceDefinitionId,
          multiServerSuccessSequenceFailed: true,
          actionDebtAdded: 1,
        },
      ),
    ];
  }
  const bonusRunPending =
    flags.bonusRunPending === true ||
    nextSequenceServerId !== undefined;
  if (
    !hasClicks &&
    !bonusRunPending &&
    unusedRunOnlyActionSourceIds.length === 0
  ) {
    pushCardImplementationEndOfRunnerTurnActions(
      cardImplementationRuntimeDeps,
      state,
      actions,
    );
    actions.push(buildRunnerEndTurnAction(state));
    return actions;
  }
  if (valuPakProgramInstallActionsRemaining(state) > 0) {
    for (const id of runnerInstallableProgramIdsForValuPak(state)) {
      const definition = definitionFor(state, id);
      actions.push(
        buildRunnerValuPakInstallAction(state, {
          cardId: id,
          definition,
        }),
      );
    }
    pushCardImplementationEndOfRunnerTurnActions(
      cardImplementationRuntimeDeps,
      state,
      actions,
    );
    actions.push(buildRunnerValuPakSequenceEndAction(state));
    return actions;
  }
  if (hasClicks) {
    actions.push(buildRunnerGainCreditAction(state));
    if (state.runner.stack.length > 0)
      actions.push(
        ...buildRunnerDrawCardActions(state, runnerDrawActionContext(state)),
      );
    if (state.runner.tags > 0 && availableRunnerTagRemovalCredits(state) >= 2) {
      actions.push(buildRunnerRemoveTagAction(state));
    }
    if (
      cardCounter(state, state.runner.identity, "crying") > 0 &&
      state.runner.credits >= 2
    ) {
      actions.push(
        action(
          state,
          "runner",
          "gain_credit",
          "Crying-Counter entfernen",
          state.runner.identity,
          [{ clicks: 1, credits: 2 }],
          {
            runnerAbility: "remove_crying_counter",
            cardId: state.runner.identity,
            counterType: "crying",
            removeCounterAmount: 1,
            counterRemoveCreditCost: 2,
            gainCreditsAmount: 0,
          },
        ),
      );
    }
    for (const counterEffect of runnerTraceCounterEffectDefinitions()) {
      if (counterEffect.counterType === "crying") continue;
      if (
        cardCounter(state, state.runner.identity, counterEffect.counterType) <=
        0
      )
        continue;
      if (state.runner.credits < counterEffect.removeCost) continue;
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${runnerCounterDisplayName(counterEffect.counterType)} entfernen`,
          state.runner.identity,
          [{ clicks: 1, credits: counterEffect.removeCost }],
          {
            cardId: state.runner.identity,
            runnerAbility: "remove_runner_trace_counter",
            sourceDefinitionId: counterEffect.sourceDefinitionId,
            counterType: counterEffect.counterType,
            removeCounterAmount: 1,
            counterRemoveCreditCost: counterEffect.removeCost,
          },
        ),
      );
    }
  }
  for (const sourceCardId of state.runner.rig.programs.slice().sort()) {
    const sourceDefinition = definitionFor(state, sourceCardId);
    const subtypeChange = cardImplementationForDefinitionId(
      sourceDefinition.id,
    )?.icebreakerSubtypeChange;
    if (!subtypeChange || subtypeChange.timing !== "runner_main") continue;
    const clickCost = subtypeChange.cost.clicks;
    if (clickCost > 0 && !hasClicks) continue;
    const currentSubtype = state.cardInstances[sourceCardId]?.selectedSubtype;
    if (subtypeChange.limit === "once_until_selected" && currentSubtype)
      continue;
    for (const subtype of subtypeChange.choices) {
      if (subtype === currentSubtype) continue;
      if (state.runner.credits < subtypeChange.cost.credits) continue;
      const costs =
        clickCost > 0 || subtypeChange.cost.credits > 0
          ? [
              {
                clicks: clickCost,
                credits: subtypeChange.cost.credits,
              },
            ]
          : [];
      actions.push(
        action(
          state,
          "runner",
          "trigger_ability",
          `${sourceDefinition.title}: ${icebreakerSubtypeLabel(subtype)} wählen`,
          sourceCardId,
          costs,
          {
            cardId: sourceCardId,
            runnerAbility: "change_icebreaker_subtype",
            selectedSubtype: subtype,
          },
        ),
      );
    }
  }
  for (const id of state.runner.grip) {
    const definition = definitionFor(state, id);
    const uniqueBlocked =
      isUniqueCard(definition) &&
      hasInstalledUniqueCardDefinition(state, "runner", definition.id);
    if (
      hasClicks &&
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) +
        runnerCostPenaltySupportCreditCapacity(state) >=
        (definition.installCost ?? 0) &&
      state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
        runnerMemoryLimit(state)
    ) {
      const installBinding = cardImplementationForDefinitionId(
        definition.id,
      )?.installTargetBinding;
      if (installBinding?.kind === "choose_installed_ice_on_install") {
        for (const targetIceId of installedCorpIceTargetIds(state)) {
          actions.push(
            action(
              state,
              "runner",
              "install_card",
              `${definition.title}: installiertes ICE wählen`,
              id,
              [{ clicks: 1, credits: definition.installCost ?? 0 }],
              { cardId: id, selectedCardId: targetIceId },
              {
                targetRequirements: [
                  {
                    id: "targetIce",
                    kind: "card",
                    side: "corp",
                    zoneScope: ["corp.servers.ice"],
                    visibility: "public",
                  },
                ],
              },
            ),
          );
        }
      } else if (
        installBinding?.kind === "choose_icebreaker_subtype_on_install"
      ) {
        for (const subtype of installBinding.choices ?? [
          "code_gate",
          "sentry",
          "wall",
        ]) {
          actions.push(
            action(
              state,
              "runner",
              "install_card",
              `${definition.title}: ${icebreakerSubtypeLabel(subtype)} wählen`,
              id,
              [{ clicks: 1, credits: definition.installCost ?? 0 }],
              { cardId: id, selectedSubtype: subtype },
            ),
          );
        }
      } else {
        actions.push(buildRunnerProgramInstallAction(state, id, definition));
      }
    }
    if (
      hasClicks &&
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >=
        (definition.installCost ?? 0) &&
      shouldOfferRunnerProgramTrashBeforeInstall(state, definition)
    ) {
      actions.push(
        buildRunnerProgramTrashBeforeInstallAction(state, id, definition),
      );
    }
    if (
      hasClicks &&
      definition.type === "program" &&
      !uniqueBlocked &&
      availableRunnerProgramInstallCredits(state) >=
        (definition.installCost ?? 0)
    ) {
      for (const hostId of [
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
      ]) {
        if (
          canOverlayProgramOnInstalledProgramHost(
            state,
            hostId,
            definition,
          )
        ) {
          const hostDefinition = definitionFor(state, hostId);
          actions.push(
            buildRunnerZetatechOverlayInstallAction(state, {
              cardId: id,
              definition,
              hostCardId: hostId,
              hostTitle: hostDefinition.title,
            }),
          );
          continue;
        }
        if (!canHostProgramOnDaemon(state, hostId, definition)) continue;
        const hostDefinition = definitionFor(state, hostId);
        actions.push(
          buildRunnerHostedProgramInstallAction(state, {
            cardId: id,
            definition,
            hostCardId: hostId,
            hostTitle: hostDefinition.title,
          }),
        );
      }
    }
    if (
      hasClicks &&
      definition.type === "hardware" &&
      !uniqueBlocked &&
      state.runner.credits + runnerCostPenaltySupportCreditCapacity(state) >=
        (definition.installCost ?? 0)
    ) {
      const installAgendaPointCost =
        cardImplementationAgendaPointInstallCost(definition);
      if (installAgendaPointCost > 0) {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (!forfeitAgendaId) continue;
        actions.push(
          buildRunnerAgendaPointInstallAction(state, {
            cardId: id,
            definition,
            installAgendaPointCost,
            forfeitAgendaCardId: forfeitAgendaId,
            targetRequirementId: "hardwareCard",
          }),
        );
        continue;
      }
      actions.push(buildRunnerHardwareInstallAction(state, id, definition));
    }
    if (
      hasClicks &&
      definition.type === "resource" &&
      !uniqueBlocked &&
      state.runner.credits + runnerCostPenaltySupportCreditCapacity(state) >=
        (definition.installCost ?? 0)
    ) {
      if (!runnerInstallCapabilitiesMet(host, definition)) continue;
      const installAgendaPointCost =
        cardImplementationAgendaPointInstallCost(definition);
      if (installAgendaPointCost > 0) {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (!forfeitAgendaId) continue;
        actions.push(
          buildRunnerAgendaPointInstallAction(state, {
            cardId: id,
            definition,
            installAgendaPointCost,
            forfeitAgendaCardId: forfeitAgendaId,
            targetRequirementId: "resourceCard",
          }),
        );
        continue;
      }
      if (requiresDataFortInstallTarget(definition)) {
        for (const server of state.corp.servers) {
          const serverLabel = serverChoiceDisplayLabel(state, server.id);
          actions.push(
            buildRunnerSelectedServerInstallAction(state, {
              cardId: id,
              definition,
              selectedServerId: server.id,
              selectedServerLabel: serverLabel,
            }),
          );
        }
        continue;
      }
      actions.push(buildRunnerResourceInstallAction(state, id, definition));
    }
    if (
      hasClicks &&
      definition.type === "event" &&
      state.runner.credits >= (definition.cost ?? 0)
    ) {
      const canPlayCardImplementation = canPlayPrintedCostOnPlayImplementation(
        cardImplementationRuntimeDeps,
        state,
        definition,
      );
      const targetedEvent = cardImplementationForDefinitionId(
        definition.id,
      )?.runnerEventTargetedEffect;
      if (
        targetedEvent?.kind === "add_strength_counter_to_installed_icebreaker"
      ) {
        for (const targetCardId of installedRunnerIcebreakerIds(state)) {
          const targetDefinition = definitionFor(state, targetCardId);
          actions.push(
            action(
              state,
              "runner",
              "play_event",
              `${definition.title}: ${targetDefinition.title} verstärken`,
              id,
              [{ clicks: 1, credits: definition.cost ?? 0 }],
              { cardId: id, targetCardId },
            ),
          );
        }
        continue;
      }
      const resolver =
        cardImplementationRunnerEventResolver(definition) ??
        RUNNER_EVENT_RESOLVERS[definition.id];
      if (!resolver && !canPlayCardImplementation) continue;
      if (
        !canPlayCardImplementation &&
        resolver?.canPlay &&
        !resolver.canPlay(state)
      )
        continue;
      if (!canPlayCardImplementation && resolver?.requiresServer) {
        for (const server of state.corp.servers) {
          if (
            resolver.canPlayForServer &&
            !resolver.canPlayForServer(state, server.id)
          )
            continue;
          actions.push(
            action(
              state,
              "runner",
              "play_event",
              `${definition.title} auf ${server.label}`,
              id,
              [{ clicks: 1, credits: definition.cost ?? 0 }],
              { cardId: id, serverId: server.id },
            ),
          );
        }
      } else {
        const makeRunEffect =
          printedCostCardImplementationMakeRunEffect(definition);
        if (makeRunEffect?.target.kind === "central_server") {
          const server = mustServer(state, makeRunEffect.target.server);
          actions.push(
            action(
              state,
              "runner",
              "play_event",
              `${definition.title} auf ${server.label}`,
              id,
              [{ clicks: 1, credits: definition.cost ?? 0 }],
              { cardId: id, serverId: server.id, runnerEventRun: true },
            ),
          );
          continue;
        }
        if (makeRunEffect?.target.kind === "chosen_server") {
          for (const server of state.corp.servers) {
            actions.push(
              action(
                state,
                "runner",
                "play_event",
                `${definition.title} auf ${server.label}`,
                id,
                [{ clicks: 1, credits: definition.cost ?? 0 }],
                { cardId: id, serverId: server.id, runnerEventRun: true },
              ),
            );
          }
          continue;
        }
        actions.push(
          action(
            state,
            "runner",
            "play_event",
            `${definition.title} spielen`,
            id,
            [{ clicks: 1, credits: definition.cost ?? 0 }],
            { cardId: id },
          ),
        );
      }
    }
  }
  if (hasClicks) {
    for (const cardId of [
      ...state.runner.rig.programs,
      ...state.runner.rig.hardware,
      ...state.runner.rig.resources,
    ]
      .slice()
      .sort()) {
      const definition = definitionFor(state, cardId);
      if (
        STACK_SEARCH_PROGRAM_SOURCES.has(definition.id) &&
        !cardImplementationForDefinitionId(definition.id) &&
        definition.id !== SELF_MODIFYING_CODE_ID &&
        (definition.id !== PAID_STACK_SEARCH_RESOURCE_SOURCE ||
          state.runner.credits >= 1) &&
        (definition.id === DAILY_CREDIT_RESOURCE_SOURCE
          ? state.runner.stack.length > 0
          : state.runner.stack.some(
              (id) => definitionFor(state, id).type === "program",
            ))
      ) {
        actions.push(
          buildRunnerStackSearchProgramToGripAction(state, {
            cardId,
            definition,
            mode:
              definition.id === DAILY_CREDIT_RESOURCE_SOURCE
                ? "top5_programs"
                : "stack_program",
            creditCost:
              definition.id === PAID_STACK_SEARCH_RESOURCE_SOURCE ? 1 : 0,
          }),
        );
      }
      if (
        SERVER_EXPOSE_PROGRAM_SOURCES.has(definition.id) &&
        !cardImplementationForDefinitionId(definition.id) &&
        state.corp.servers.some(
          (server) => exposedCorpCardInServer(state, server.id) !== undefined,
        )
      ) {
        for (const server of state.corp.servers) {
          if (exposedCorpCardInServer(state, server.id) === undefined) continue;
          actions.push(
            action(
              state,
              "runner",
              "gain_credit",
              `${definition.title}: Karte in ${server.label} expose`,
              cardId,
              [{ clicks: 1 }],
              {
                cardId,
                serverId: server.id,
                v1911HiddenZoneAbility: "expose_server_card",
              },
            ),
          );
        }
      }
      if (
        definition.id === COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE &&
        state.runner.stack.length > 0
      ) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Stack-Spitze revealn`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              v1912CounterAbility: "reveal_stack_top",
              hiddenZoneAction: "v1912_reveal_stack_top",
            },
          ),
        );
      }
      if (
        definition.id === COUNTER_GAIN_PROGRAM_SOURCE &&
        state.runner.scoreArea.length > 0
      ) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Power-Counter laden`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              v1919RunnerProgramAbility: "add_power_counter",
              counterType: "power",
              addCounterAmount: 1,
            },
          ),
        );
      }
      if (definition.id === BOARDWALK_RANDOM_PROGRAM_SOURCE) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: deterministischen Wuerfel werfen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1921RunnerProgramAbility: "deterministic_die_probe" },
          ),
        );
      }
      pushActivatedCardImplementationActions(
        cardImplementationRuntimeDeps,
        state,
        actions,
        "runner",
        cardId,
        definition,
      );
      if (
        definition.id === HOST_RETURN_HARDWARE_SOURCE &&
        topHostedProgramOnHardware(state, cardId)
      ) {
        const topHostedId = topHostedProgramOnHardware(state, cardId);
        if (!topHostedId) continue;
        actions.push(
          action(
            state,
            "runner",
            "trigger_ability",
            `${definition.title}: oberstes Programm in die Grip nehmen`,
            cardId,
            [{ clicks: 1 }],
            {
              cardId,
              targetProgramId: topHostedId,
              v1922RunnerHardwareAbility:
                "return_top_hosted_program",
              hostedProgramCount: hostedProgramIdsOnHardware(state, cardId)
                .length,
            },
          ),
        );
      }
      if (definition.id === RANDOM_RESOURCE_SOURCE) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: deterministischen Wuerfel werfen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1921RunnerResourceAbility: "deterministic_die_probe" },
          ),
        );
      }
      if (
        runnerUtilityLongtailKindForCard(state, cardId) ===
        "optional_extra_action_with_delayed_damage"
      ) {
        const limitKey = "optional_extra_action_with_delayed_damage";
        const used = new Set(
          ensureRunnerTurnFlags(state).abilityUsedSourceIdsByLimitKey?.[
            limitKey
          ] ?? [],
        );
        if (!used.has(cardId)) {
          actions.push(
            action(
              state,
              "runner",
              "trigger_ability",
              `${definition.title}: Aktion gewinnen`,
              cardId,
              [],
              {
                cardId,
                runnerUtilityAbility:
                  "optional_extra_action_with_delayed_damage",
                gainedActions: 1,
                delayedDamageAmount: 1,
                delayedDamageType: "core",
                damageTiming: "end_of_turn",
                damagePreventable: false,
                abilityLimitKey: limitKey,
              },
            ),
          );
        }
      }
      if (
        definition.id === STACK_TOP_REORDER_RESOURCE_SOURCE &&
        !cardImplementationForDefinitionId(definition.id) &&
        state.runner.stack.length >= 2
      ) {
        actions.push(
          action(
            state,
            "runner",
            "gain_credit",
            `${definition.title}: Stack-Spitze anordnen`,
            cardId,
            [{ clicks: 1 }],
            { cardId, v1911HiddenZoneAbility: "arrange_stack_top2" },
          ),
        );
      }
    }
    for (const resourceId of state.runner.rig.resources.slice().sort()) {
      const definition = definitionFor(state, resourceId);
      const uniqueDirectLongtail = uniqueDirectLongtailImplementationForCard(
        state,
        resourceId,
      );
      if (uniqueDirectLongtail?.kind === "agenda_point_for_credits_resource") {
        const forfeitAgendaId = pickRunnerAgendaForAgendaPointCost(state);
        if (forfeitAgendaId) {
          const agendaPointCost = uniqueDirectLongtail.agendaPointCost;
          const gainCreditsAmount = uniqueDirectLongtail.gainCredits;
          actions.push(
            action(
              state,
              "runner",
              "gain_credit",
              `${definition.title}: ${gainCreditsAmount} Credits (${agendaPointCost} Agenda-Punkt, trashen)`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "databroker",
                forfeitAgendaCardId: forfeitAgendaId,
                agendaPointCost,
                trashOnUse: true,
                gainCreditsAmount,
              },
            ),
          );
        }
      }
      if (
        definition.id === JUNKYARD_BBS_ID &&
        !cardImplementationForDefinitionId(definition.id) &&
        state.runner.credits >= 1
      ) {
        const targetCardId = topRunnerHeapCardId(state);
        if (targetCardId) {
          actions.push(
            action(
              state,
              "runner",
              "trigger_ability",
              `${definition.title}: oberste Heap-Karte in die Grip nehmen`,
              resourceId,
              [{ clicks: 1, credits: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "return_top_heap_card",
                targetCardId,
                targetCardDefinitionId: definitionFor(state, targetCardId).id,
                sourceDefinitionId: JUNKYARD_BBS_ID,
                sourceZone: "heap",
                destinationZone: "grip",
                abilityFamily: "hidden-zone",
                effectKind: "hidden_zone",
              },
              {
                targetRequirements: [
                  {
                    id: "heapTopCard",
                    kind: "card",
                    side: "runner",
                    zoneScope: ["runner.heap"],
                    visibility: "public",
                  },
                ],
              },
            ),
          );
        }
      }
      if (definition.id === SHELL_TRADERS_ID) {
        for (const targetCardId of delayedInstallPrepareTargetIds(state)) {
          const targetDefinition = definitionFor(state, targetCardId);
          const shellCounterAmount = delayedInstallCounterCost(targetDefinition);
          actions.push(
            buildRunnerDelayedInstallSetAsideAction(state, {
              sourceCardId: resourceId,
              sourceTitle: definition.title,
              sourceDefinitionId: SHELL_TRADERS_ID,
              targetCardId,
              targetDefinition,
              shellCounterAmount,
            }),
          );
        }
        if (state.runner.credits >= 1) {
          for (const targetCardId of delayedInstallPreparedTargetIds(state)) {
            const remainingCounters = cardCounter(state, targetCardId, "shell");
            actions.push(
              buildRunnerDelayedInstallRemoveCounterAction(state, {
                sourceCardId: resourceId,
                sourceTitle: definition.title,
                sourceDefinitionId: SHELL_TRADERS_ID,
                targetCardId,
                targetDefinitionId: definitionFor(state, targetCardId).id,
                remainingCountersBefore: remainingCounters,
              }),
            );
          }
        }
      }
      if (
        definition.id === DANSHIS_SECOND_ID &&
        state.runner.tags > 0 &&
        !cardImplementationForDefinitionId(definition.id)?.abilities?.some(
          (ability: { kind?: string }) => ability.kind === "activated",
        )
      ) {
        const removeAmount = Math.min(3, state.runner.tags);
        for (let amount = 1; amount <= removeAmount; amount += 1) {
          actions.push(
            action(
              state,
              "runner",
              "remove_tag",
              `${definition.title}: ${amount} Tag entfernen`,
              resourceId,
              [{ clicks: 1 }],
              {
                cardId: resourceId,
                resourceAbility: "remove_tags_trash_resource",
                removeTagAmount: amount,
                trashOnUse: true,
              },
            ),
          );
        }
      }
    }
  }
  for (const server of state.corp.servers) {
    const rovingRunBlocked = isActivityGatedFortRunBlocked(
      fortRunSideFamiliesHostForState(state),
      server.id,
    );
    const upgradeRunStartTax = runStartTaxForServerUpgrades(state, server.id);
    const rootAssetRunTax = runStartTaxForCorpRootAssets(state);
    const runStartTaxCredits =
      upgradeRunStartTax.amount + rootAssetRunTax.amount;
    const runStartTaxSourceDefinitionIds = [
      ...upgradeRunStartTax.sourceDefinitionIds,
      ...rootAssetRunTax.sourceDefinitionIds,
    ];
    const runLockActionsPending = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.runLockActionsPending ?? 0),
    );
    const runnerRunLockCreditCost = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.runnerRunLockCreditCost ?? 0),
    );
    const runCosts = [
      {
        clicks: 1,
        ...(runStartTaxCredits > 0 ? { credits: runStartTaxCredits } : {}),
      },
    ];
    const runPayload = {
      serverId: server.id,
      ...(runStartTaxCredits > 0
        ? {
            runStartTaxCredits,
            runStartTaxSourceDefinitionIds:
              runStartTaxSourceDefinitionIds.join(","),
          }
        : {}),
    };
    if (
      hasClicks &&
      runLockActionsPending <= 0 &&
      runnerRunLockCreditCost <= 0 &&
      !rovingRunBlocked
    ) {
      if (
        runStartTaxCredits === 0 ||
        availableRunnerRunStartCredits(runDurationPaymentHost(state)) >=
          runStartTaxCredits
      ) {
        actions.push(
          action(
            state,
            "runner",
            "start_run",
            `Run auf ${server.label}`,
            "basic_action",
            runCosts,
            runPayload,
          ),
        );
      }
    }
    for (const sourceCardId of unusedRunOnlyActionSourceIds) {
      const sourceDefinition = definitionFor(state, sourceCardId);
      if (
        !rovingRunBlocked &&
        (runStartTaxCredits === 0 ||
          availableRunnerRunStartCredits(runDurationPaymentHost(state)) >=
            runStartTaxCredits)
      ) {
        actions.push(
          action(
            state,
            "runner",
            "start_run",
            `${sourceDefinition.title}: Run auf ${server.label}`,
            sourceCardId,
            runCosts,
            {
              ...runPayload,
              cardId: sourceCardId,
              runnerAbility: "gain_run_only_action",
              sourceDefinitionId: sourceDefinition.id,
              gainActionsAmount: 1,
              restrictedActionGrantActionType: "start_run",
              restrictedActionGrantCostProfile: "extra_click",
              restrictedActionGrantRemainingActions: 1,
              runOnlyAction: true,
              runOnlyActionSourceCardId: sourceCardId,
              runSpendingCap: 3,
            },
          ),
        );
      }
    }
    if (
      bonusRunPending &&
      (!nextSequenceServerId || nextSequenceServerId === server.id) &&
      !rovingRunBlocked &&
      (runStartTaxCredits === 0 ||
        availableRunnerRunStartCredits(runDurationPaymentHost(state)) >=
          runStartTaxCredits)
    ) {
      actions.push(
        action(
          state,
          "runner",
          "start_run",
          `Bonus-Run auf ${server.label}`,
          "basic_action",
          runStartTaxCredits > 0 ? [{ credits: runStartTaxCredits }] : [],
          {
            ...runPayload,
            bonusRunNoClick: true,
            bonusRunSource: nextSequenceServerId
              ? pendingSequence?.sourceDefinitionId
              : flags.successfulRunExtraRunPending === true
                ? BODYWEIGHT_DATA_CRECHE_ID
                : ALL_NIGHTER_ID,
            restrictedActionGrantActionType: "start_run",
            restrictedActionGrantCostProfile: "no_click",
            restrictedActionGrantRemainingActions: 1,
            ...(nextSequenceServerId
              ? { multiServerSuccessSequenceRun: true }
              : {}),
          },
        ),
      );
    }
  }
  const runnerRunLockCreditCost = Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.runnerRunLockCreditCost ?? 0),
  );
  if (
    hasClicks &&
    runnerRunLockCreditCost > 0 &&
    state.runner.credits >= runnerRunLockCreditCost
  ) {
    actions.push(
      action(
        state,
        "runner",
        "trigger_ability",
        `Run-Sperre für ${runnerRunLockCreditCost} Credits entfernen`,
        "game_rule",
        [{ clicks: 1, credits: runnerRunLockCreditCost }],
        {
          v1920RunnerRunLockAbility: "pay_to_remove_run_lock",
          runnerRunLockCreditCost,
          gainCreditsAmount: 0,
        },
      ),
    );
  }
  actions.push(...specialZoneHarnessActions(state, "runner"));
  pushCardImplementationEndOfRunnerTurnActions(
    cardImplementationRuntimeDeps,
    state,
    actions,
  );
  actions.push(buildRunnerEndTurnAction(state));
  return filterActionsForRestrictedExtraActions(state, "runner", actions);
}

function nextMultiServerSuccessSequence(
  flags: NonNullable<GameState["runnerTurnFlags"]>,
): MultiServerSuccessSequenceState | undefined {
  return flags.pendingSequences?.find(
    (sequence) =>
      sequence.kind === "multi_server_success_sequence" &&
      sequence.pendingServerIds.length > 0,
  );
}

function buildMultiServerSuccessSequenceForcedRunActions(
  host: RunnerMainActionGenerationHost,
  input: {
    pendingSequence: MultiServerSuccessSequenceState;
    nextSequenceServerId: string;
    runDurationPaymentHost: unknown;
  },
): LegalAction[] {
  const state = host.state;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === input.nextSequenceServerId,
  );
  if (!server) return [];
  if (
    host.run.isActivityGatedFortRunBlocked(
      host.run.fortRunSideFamiliesHostForState(state),
      server.id,
    )
  )
    return [];
  const upgradeRunStartTax = host.run.runStartTaxForServerUpgrades(
    state,
    server.id,
  );
  const rootAssetRunTax = host.run.runStartTaxForCorpRootAssets(state);
  const runStartTaxCredits =
    upgradeRunStartTax.amount + rootAssetRunTax.amount;
  const runStartTaxSourceDefinitionIds = [
    ...upgradeRunStartTax.sourceDefinitionIds,
    ...rootAssetRunTax.sourceDefinitionIds,
  ];
  if (
    runStartTaxCredits > 0 &&
    host.runner.availableRunnerRunStartCredits(input.runDurationPaymentHost) <
      runStartTaxCredits
  )
    return [];
  const runPayload = {
    serverId: server.id,
    ...(runStartTaxCredits > 0
      ? {
          runStartTaxCredits,
          runStartTaxSourceDefinitionIds:
            runStartTaxSourceDefinitionIds.join(","),
        }
      : {}),
    bonusRunNoClick: true,
    bonusRunSource: input.pendingSequence.sourceDefinitionId,
    restrictedActionGrantActionType: "start_run",
    restrictedActionGrantCostProfile: "no_click",
    restrictedActionGrantRemainingActions: 1,
    multiServerSuccessSequenceRun: true,
  };
  return [
    host.actions.buildLegalAction(
      state,
      "runner",
      "start_run",
      `Sequenz-Run auf ${server.label}`,
      "game_rule",
      runStartTaxCredits > 0 ? [{ credits: runStartTaxCredits }] : [],
      runPayload,
    ),
  ];
}

function installedCorpIceTargetIds(state: GameState): string[] {
  const ids: string[] = [];
  for (const server of state.corp.servers) ids.push(...server.ice);
  return ids.filter((cardId) => state.cardInstances[cardId]).sort();
}

function installedRunnerIcebreakerIds(state: GameState): string[] {
  return state.runner.rig.programs
    .filter((cardId) => {
      const definitionId = state.cardInstances[cardId]?.definitionId;
      const definition = definitionId
        ? DEMO_CARDS_BY_ID[definitionId]
        : undefined;
      return definition?.subtypes.includes("icebreaker") === true;
    })
    .sort();
}

function icebreakerSubtypeLabel(subtype: string): string {
  if (subtype === "code_gate") return "Code Gate";
  if (subtype === "sentry") return "Sentry";
  if (subtype === "wall") return "Wall";
  return subtype;
}
