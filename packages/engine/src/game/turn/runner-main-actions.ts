import { DEMO_CARDS_BY_ID, type GameState, type LegalAction } from "@netgrid/shared";

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
    buildRunnerShellTradersSetAsideAction: HostFn<LegalAction>;
    buildRunnerShellTradersRemoveCounterAction: HostFn<LegalAction>;
  };
  cards: {
    definitionFor: HostFn<any>;
    isUniqueCard: HostFn<boolean>;
    hasInstalledUniqueCardDefinition: HostFn<boolean>;
  };
  runner: {
    ensureRunnerTurnFlags: HostFn<any>;
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
    activeWilsonSourceIds: HostFn<string[]>;
    runDurationPaymentHost: HostFn<unknown>;
    isRovingSubmarineRunBlocked: HostFn<boolean>;
    fortRunSideFamiliesHostForState: HostFn<unknown>;
    runStartTaxForServerUpgrades: HostFn<{
      amount: number;
      sourceDefinitionIds: string[];
    }>;
    newsgroupTauntingRunStartTax: HostFn<{
      amount: number;
      sourceDefinitionIds: string[];
    }>;
  };
  install: {
    shouldOfferRunnerProgramTrashBeforeInstall: HostFn<boolean>;
    canOverlayProgramOnZetatechSoftwareInstaller: HostFn<boolean>;
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
    topHostedProgramOnMicrotech: HostFn<string | undefined>;
    microtechHostedProgramIds: HostFn<string[]>;
    topRunnerHeapCardId: HostFn<string | undefined>;
  };
  specialZones: {
    valuPakProgramInstallActionsRemaining: HostFn<number>;
    runnerInstallableProgramIdsForValuPak: HostFn<string[]>;
    specialZoneHarnessActions: HostFn<LegalAction[]>;
    shellTradersPrepareTargetIds: HostFn<string[]>;
    shellTradersInstallCost: HostFn<number>;
    shellTradersPreparedTargetIds: HostFn<string[]>;
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
    CODE_VIRAL_CACHE_ID: string;
    STACK_SEARCH_PROGRAM_CARD_IDS: ReadonlySet<string>;
    SELF_MODIFYING_CODE_ID: string;
    SHORT_CIRCUIT_RESOURCE_CARD_ID: string;
    AUJOURD_OUI_RESOURCE_CARD_ID: string;
    SERVER_EXPOSE_PROGRAM_CARD_IDS: ReadonlySet<string>;
    STACK_TOP_REVEAL_PROGRAM_CARD_IDS: ReadonlySet<string>;
    COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID: string;
    FAIT_ACCOMPLI_COUNTER_PROGRAM_ID: string;
    BOARDWALK_RANDOM_PROGRAM_CARD_ID: string;
    MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID: string;
    QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID: string;
    STACK_TOP_REORDER_RESOURCE_CARD_ID: string;
    JUNKYARD_BBS_ID: string;
    SHELL_TRADERS_ID: string;
    DANSHIS_SECOND_ID: string;
    BODYWEIGHT_DATA_CRECHE_ID: string;
    ALL_NIGHTER_ID: string;
  };
};

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
  const buildRunnerShellTradersSetAsideAction =
    host.actions.buildRunnerShellTradersSetAsideAction;
  const buildRunnerShellTradersRemoveCounterAction =
    host.actions.buildRunnerShellTradersRemoveCounterAction;
  const definitionFor = host.cards.definitionFor;
  const mustServer = host.servers.mustServer;
  const serverChoiceDisplayLabel = host.servers.serverChoiceDisplayLabel;
  const isUniqueCard = host.cards.isUniqueCard;
  const hasInstalledUniqueCardDefinition =
    host.cards.hasInstalledUniqueCardDefinition;
  const cardImplementationForDefinitionId =
    host.cardImplementation.cardImplementationForDefinitionId;
  const ensureRunnerTurnFlags = host.runner.ensureRunnerTurnFlags;
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
  const shellTradersPrepareTargetIds =
    host.specialZones.shellTradersPrepareTargetIds;
  const shellTradersInstallCost = host.specialZones.shellTradersInstallCost;
  const shellTradersPreparedTargetIds =
    host.specialZones.shellTradersPreparedTargetIds;
  const activeWilsonSourceIds = host.run.activeWilsonSourceIds;
  const runDurationPaymentHost = host.run.runDurationPaymentHost;
  const isRovingSubmarineRunBlocked = host.run.isRovingSubmarineRunBlocked;
  const fortRunSideFamiliesHostForState =
    host.run.fortRunSideFamiliesHostForState;
  const runStartTaxForServerUpgrades = host.run.runStartTaxForServerUpgrades;
  const newsgroupTauntingRunStartTax =
    host.run.newsgroupTauntingRunStartTax;
  const shouldOfferRunnerProgramTrashBeforeInstall =
    host.install.shouldOfferRunnerProgramTrashBeforeInstall;
  const canOverlayProgramOnZetatechSoftwareInstaller =
    host.install.canOverlayProgramOnZetatechSoftwareInstaller;
  const canHostProgramOnDaemon = host.install.canHostProgramOnDaemon;
  const cardImplementationAgendaPointInstallCost =
    host.install.cardImplementationAgendaPointInstallCost;
  const pickRunnerAgendaForAgendaPointCost =
    host.install.pickRunnerAgendaForAgendaPointCost;
  const requiresDataFortInstallTarget = host.install.requiresDataFortInstallTarget;
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
  const topHostedProgramOnMicrotech =
    host.hiddenZone.topHostedProgramOnMicrotech;
  const microtechHostedProgramIds = host.hiddenZone.microtechHostedProgramIds;
  const runnerUtilityLongtailKindForCard =
    host.runner.runnerUtilityLongtailKindForCard;
  const uniqueDirectLongtailImplementationForCard =
    host.runner.uniqueDirectLongtailImplementationForCard;
  const topRunnerHeapCardId = host.hiddenZone.topRunnerHeapCardId;
  const RUNNER_EVENT_RESOLVERS = host.constants.RUNNER_EVENT_RESOLVERS;
  const CODE_VIRAL_CACHE_ID = host.constants.CODE_VIRAL_CACHE_ID;
  const STACK_SEARCH_PROGRAM_CARD_IDS =
    host.constants.STACK_SEARCH_PROGRAM_CARD_IDS;
  const SELF_MODIFYING_CODE_ID = host.constants.SELF_MODIFYING_CODE_ID;
  const SHORT_CIRCUIT_RESOURCE_CARD_ID =
    host.constants.SHORT_CIRCUIT_RESOURCE_CARD_ID;
  const AUJOURD_OUI_RESOURCE_CARD_ID =
    host.constants.AUJOURD_OUI_RESOURCE_CARD_ID;
  const SERVER_EXPOSE_PROGRAM_CARD_IDS =
    host.constants.SERVER_EXPOSE_PROGRAM_CARD_IDS;
  const STACK_TOP_REVEAL_PROGRAM_CARD_IDS =
    host.constants.STACK_TOP_REVEAL_PROGRAM_CARD_IDS;
  const COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID =
    host.constants.COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID;
  const FAIT_ACCOMPLI_COUNTER_PROGRAM_ID =
    host.constants.FAIT_ACCOMPLI_COUNTER_PROGRAM_ID;
  const BOARDWALK_RANDOM_PROGRAM_CARD_ID =
    host.constants.BOARDWALK_RANDOM_PROGRAM_CARD_ID;
  const MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID =
    host.constants.MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID;
  const QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID =
    host.constants.QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID;
  const STACK_TOP_REORDER_RESOURCE_CARD_ID =
    host.constants.STACK_TOP_REORDER_RESOURCE_CARD_ID;
  const JUNKYARD_BBS_ID = host.constants.JUNKYARD_BBS_ID;
  const SHELL_TRADERS_ID = host.constants.SHELL_TRADERS_ID;
  const DANSHIS_SECOND_ID = host.constants.DANSHIS_SECOND_ID;
  const BODYWEIGHT_DATA_CRECHE_ID = host.constants.BODYWEIGHT_DATA_CRECHE_ID;
  const ALL_NIGHTER_ID = host.constants.ALL_NIGHTER_ID;

  const actions: LegalAction[] = [];
  const flags = ensureRunnerTurnFlags(state);
  const hasClicks = state.runner.clicks > 0;
  const bonusRunPending = flags.allNighterBonusRunPending === true;
  if (!hasClicks && !bonusRunPending) {
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
    for (const sourceCardId of activeWilsonSourceIds(runDurationPaymentHost(state))) {
      const used = flags.wilsonUsedSourceIdsThisTurn ?? [];
      if (!used.includes(sourceCardId)) {
        actions.push(
          action(
            state,
            "runner",
            "trigger_ability",
            "Wilson: Run-Aktion erhalten",
            sourceCardId,
            [],
            {
              cardId: sourceCardId,
              runnerAbility: "wilson_gain_run_action",
              sourceDefinitionId: definitionFor(state, sourceCardId).id,
              gainActionsAmount: 1,
              runSpendingCap: 3,
            },
          ),
        );
      }
    }
    actions.push(buildRunnerGainCreditAction(state));
    if (state.runner.stack.length > 0)
      actions.push(
        ...buildRunnerDrawCardActions(state, runnerDrawActionContext(state)),
      );
    if (state.runner.tags > 0 && availableRunnerTagRemovalCredits(state) >= 2) {
      actions.push(buildRunnerRemoveTagAction(state));
    }
    if (cardCounter(state, state.runner.identity, "crying") > 0 && state.runner.credits >= 2) {
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
      if (cardCounter(state, state.runner.identity, counterEffect.counterType) <= 0)
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
    const subtypeChange =
      cardImplementationForDefinitionId(sourceDefinition.id)?.icebreakerSubtypeChange;
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
      const installBinding =
        cardImplementationForDefinitionId(definition.id)?.installTargetBinding;
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
      } else if (installBinding?.kind === "choose_icebreaker_subtype_on_install") {
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
        if (canOverlayProgramOnZetatechSoftwareInstaller(state, hostId, definition)) {
          const hostDefinition = definitionFor(state, hostId);
          actions.push(
            buildRunnerZetatechOverlayInstallAction(
              state,
              {
                cardId: id,
                definition,
                hostCardId: hostId,
                hostTitle: hostDefinition.title,
              },
            ),
          );
          continue;
        }
        if (!canHostProgramOnDaemon(state, hostId, definition)) continue;
        const hostDefinition = definitionFor(state, hostId);
        actions.push(
          buildRunnerHostedProgramInstallAction(
            state,
            {
              cardId: id,
              definition,
              hostCardId: hostId,
              hostTitle: hostDefinition.title,
            },
          ),
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
      if (
        definition.id === CODE_VIRAL_CACHE_ID &&
        ensureRunnerTurnFlags(state).successfulHqRunThisTurn !== true
      ) {
        continue;
      }
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
      const targetedEvent =
        cardImplementationForDefinitionId(definition.id)?.runnerEventTargetedEffect;
      if (targetedEvent?.kind === "add_strength_counter_to_installed_icebreaker") {
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
      if (!canPlayCardImplementation && resolver?.canPlay && !resolver.canPlay(state))
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
        const makeRunEffect = printedCostCardImplementationMakeRunEffect(definition);
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
              { cardId: id, serverId: server.id },
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
                { cardId: id, serverId: server.id },
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
        STACK_SEARCH_PROGRAM_CARD_IDS.has(definition.id) &&
        !cardImplementationForDefinitionId(definition.id) &&
        definition.id !== SELF_MODIFYING_CODE_ID &&
        (definition.id !== SHORT_CIRCUIT_RESOURCE_CARD_ID ||
          state.runner.credits >= 1) &&
        (definition.id === AUJOURD_OUI_RESOURCE_CARD_ID
          ? state.runner.stack.length > 0
          : state.runner.stack.some(
              (id) => definitionFor(state, id).type === "program",
            ))
      ) {
        actions.push(
          buildRunnerStackSearchProgramToGripAction(
            state,
            {
              cardId,
              definition,
              mode:
                definition.id === AUJOURD_OUI_RESOURCE_CARD_ID
                  ? "top5_programs"
                  : "stack_program",
              creditCost:
                definition.id === SHORT_CIRCUIT_RESOURCE_CARD_ID ? 1 : 0,
            },
          ),
        );
      }
    if (
      SERVER_EXPOSE_PROGRAM_CARD_IDS.has(definition.id) &&
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
        STACK_TOP_REVEAL_PROGRAM_CARD_IDS.has(definition.id) &&
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
            { cardId, v1911HiddenZoneAbility: "reveal_stack_top" },
          ),
        );
      }
      if (
        definition.id === COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID &&
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
        definition.id === FAIT_ACCOMPLI_COUNTER_PROGRAM_ID &&
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
      if (definition.id === BOARDWALK_RANDOM_PROGRAM_CARD_ID) {
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
        definition.id === MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID &&
        topHostedProgramOnMicrotech(state, cardId)
      ) {
        const topHostedId = topHostedProgramOnMicrotech(state, cardId);
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
                "microtech_backup_drive_return_top_hosted",
              hostedProgramCount: microtechHostedProgramIds(state, cardId)
                .length,
            },
          ),
        );
      }
      if (definition.id === QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID) {
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
        "preying_mantis_optional_action_unpreventable_core_damage"
      ) {
        const used = new Set(
          ensureRunnerTurnFlags(state).preyingMantisUsedSourceIdsThisTurn ?? [],
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
                runnerUtilityAbility: "preying_mantis_gain_action",
                gainedActions: 1,
              },
            ),
          );
        }
      }
      if (
        definition.id === STACK_TOP_REORDER_RESOURCE_CARD_ID &&
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
      const uniqueDirectLongtail =
        uniqueDirectLongtailImplementationForCard(state, resourceId);
      if (uniqueDirectLongtail?.kind === "databroker_agenda_point_credits") {
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
                resourceAbility: "junkyard_bbs_return_top_heap",
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
        for (const targetCardId of shellTradersPrepareTargetIds(state)) {
          const targetDefinition = definitionFor(state, targetCardId);
          const shellCounterAmount = shellTradersInstallCost(targetDefinition);
          actions.push(
            buildRunnerShellTradersSetAsideAction(state, {
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
          for (const targetCardId of shellTradersPreparedTargetIds(state)) {
            const remainingCounters = cardCounter(state, targetCardId, "shell");
            actions.push(
              buildRunnerShellTradersRemoveCounterAction(state, {
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
                resourceAbility: "danshis_second_id",
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
    const rovingRunBlocked = isRovingSubmarineRunBlocked(
      fortRunSideFamiliesHostForState(state),
      server.id,
    );
    const upgradeRunStartTax = runStartTaxForServerUpgrades(state, server.id);
    const newsgroupRunTax = newsgroupTauntingRunStartTax(state);
    const runStartTaxCredits =
      upgradeRunStartTax.amount + newsgroupRunTax.amount;
    const runLockActionsPending = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.runLockActionsPending ?? 0),
    );
    const fangRunLockCreditCost = Math.max(
      0,
      Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
    );
    const runCosts = [
      {
        clicks: 1,
        ...(runStartTaxCredits > 0 ? { credits: runStartTaxCredits } : {}),
      },
    ];
    const runPayload = {
      serverId: server.id,
      ...(upgradeRunStartTax.amount > 0
        ? {
            v1918UpgradeAbility: "run_start_tax",
            runStartTaxCredits: upgradeRunStartTax.amount,
            runStartTaxSourceDefinitionIds:
              upgradeRunStartTax.sourceDefinitionIds.join(","),
          }
        : {}),
      ...(newsgroupRunTax.amount > 0
        ? {
            v1920AssetAbility: "newsgroup_taunting_run_start_tax",
            newsgroupTauntingRunStartTaxCredits: newsgroupRunTax.amount,
            newsgroupTauntingSourceDefinitionIds:
              newsgroupRunTax.sourceDefinitionIds.join(","),
          }
        : {}),
      ...(runStartTaxCredits > 0 ? { runStartTaxCredits } : {}),
    };
    if (
      hasClicks &&
      runLockActionsPending <= 0 &&
      fangRunLockCreditCost <= 0 &&
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
    if (
      Math.max(0, Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0)) > 0 &&
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
          `Wilson-Run auf ${server.label}`,
          "basic_action",
          runCosts,
          {
            ...runPayload,
            wilsonRunOnlyAction: true,
            runSpendingCap: 3,
          },
        ),
      );
    }
    if (
      bonusRunPending &&
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
            bonusRunSource:
              flags.bodyweightDataCrecheExtraRunPending === true
                ? BODYWEIGHT_DATA_CRECHE_ID
                : ALL_NIGHTER_ID,
          },
        ),
      );
    }
  }
  const fangRunLockCreditCost = Math.max(
    0,
    Math.floor(state.runnerTurnFlags?.fangRunLockCreditCost ?? 0),
  );
  if (
    hasClicks &&
    fangRunLockCreditCost > 0 &&
    state.runner.credits >= fangRunLockCreditCost
  ) {
    actions.push(
      action(
        state,
        "runner",
        "trigger_ability",
        `Run-Sperre für ${fangRunLockCreditCost} Credits entfernen`,
        "game_rule",
        [{ clicks: 1, credits: fangRunLockCreditCost }],
        {
          v1920RunnerRunLockAbility: "fang_2_0_pay_to_run",
          fangRunLockCreditCost,
          runnerRunLockCreditCost: fangRunLockCreditCost,
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
  const wilsonRestrictedActions = Math.max(
    0,
    Math.floor(flags.wilsonRunOnlyActionsRemaining ?? 0),
  );
  if (wilsonRestrictedActions > 0 && state.runner.clicks <= wilsonRestrictedActions) {
    return actions.filter(
      (candidate) =>
        candidate.type === "end_turn" ||
        (candidate.type === "start_run" &&
          candidate.payload?.wilsonRunOnlyAction === true),
    );
  }
  return actions;
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
      const definition = definitionId ? DEMO_CARDS_BY_ID[definitionId] : undefined;
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
