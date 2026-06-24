import type { GameState, LegalAction } from "@netgrid/shared";

type HostFn<T = unknown> = (...args: any[]) => T;

export type CorpMainActionGenerationHost = {
  state: GameState;
  actions: {
    buildLegalAction: HostFn<LegalAction>;
    makeActionId: HostFn<string>;
    buildEndTurnAction: HostFn<LegalAction>;
    buildForgoActionDebtAction: HostFn<LegalAction>;
    buildPurgeableRunnerVirusPurgeAction: HostFn<LegalAction>;
    buildPurgeVirusAction: HostFn<LegalAction>;
    buildGainCreditAction: HostFn<LegalAction>;
    buildDrawAction: HostFn<LegalAction>;
    buildTrashNewDataFortCreationLockActions: HostFn<LegalAction[]>;
    buildNewRemoteIceInstallAction: HostFn<LegalAction>;
    buildServerIceInstallAction: HostFn<LegalAction>;
    buildNewRemoteRootInstallAction: HostFn<LegalAction>;
    buildServerRootInstallAction: HostFn<LegalAction>;
  };
  cards: {
    definitionFor: HostFn<any>;
    mustInstance: HostFn<any>;
    isUniqueCard: HostFn<boolean>;
    hasInstalledUniqueCardDefinition: HostFn<boolean>;
    cardImplementationForDefinitionId: HostFn<any>;
    rezzedCorpRootCardIds: HostFn<string[]>;
    corpInstalledCardIds: HostFn<string[]>;
    visibleVirusCounterTargetIds: HostFn<string[]>;
  };
  agenda: {
    effectiveAgendaDifficulty: HostFn<number>;
    effectiveAgendaDifficultyDeps: unknown;
    scoredAgendaKindForDefinition: HostFn<string | undefined>;
    serverChoiceDisplayLabel: HostFn<string>;
    scoredAgendaAbilityHost: HostFn<unknown>;
    buildScoredAgendaAbilityActionsForCard: HostFn<{
      handled: boolean;
      actions: LegalAction[];
    }>;
  };
  counters: {
    totalCounters: HostFn<number>;
    purgeableRunnerVirusCounterTotal: HostFn<number>;
    spyCountersForServer: HostFn<number>;
  };
  corp: {
    corpActionDebtPending: HostFn<number>;
    filterActionsForRestrictedExtraActions?: HostFn<LegalAction[]>;
    activeObligationCount: HostFn<number>;
    canPlayCorpOperation: HostFn<boolean>;
    cardImplementationOperationLegalActions: HostFn<LegalAction[]>;
    corpUtilityImplementationForDefinition: HostFn<{ kind?: string } | undefined>;
    hardwareTrashByCounterLegalActions: HostFn<LegalAction[]>;
    advancementPlacementLegalActions: HostFn<LegalAction[]>;
    corpAgendaPointTotal: HostFn<number>;
    hasCorpUtilityKind: HostFn<boolean>;
    uniqueDirectLongtailKindForDefinition: HostFn<string | undefined>;
    corpInstalledEconomyActionProfileForDefinition: HostFn<any>;
    corpInstalledEconomyActionPayload: HostFn<LegalAction["payload"]>;
  };
  runner: {
    isConcealedRunnerResource: HostFn<boolean>;
    hiddenRunnerResourceSlotId: HostFn<string>;
  };
  install: {
    corpNewDataFortCreationLocked: HostFn<boolean>;
    corpIceInstallTotalCost: HostFn<any>;
    canInstallCorpRootCardInServer: HostFn<boolean>;
    canInstallCorpRootCardInNewRemote: HostFn<boolean>;
    isRegionUpgrade: HostFn<boolean>;
    corpRegionUpgradeIdsInServer: HostFn<string[]>;
    corpRootAgendaOrNodeCapacityInServer: HostFn<number>;
    corpRootAssetIdsInServer: HostFn<string[]>;
    corpRootMainCardIdsInServer: HostFn<string[]>;
    isInstalledCorpCardAdvanceable: HostFn<boolean>;
  };
  rez: {
    rootInstallRezzesOnInstall: HostFn<boolean>;
    rezCostForCard: HostFn<number>;
    rezCostReductionSourceDefinitionIdsFor: HostFn<string[]>;
    isObligationDebtDefinition: HostFn<boolean>;
  };
  abilities: {
    corpTraceDamageAbilityHost: HostFn<unknown>;
    corpSpecialDamageAbilityHost: HostFn<unknown>;
    pushCorpTraceDamageOrCardImplementationActions: HostFn<void>;
    buildCorpSpecialDamageAbilityActionsForCard: HostFn<{
      handled: boolean;
      actions: LegalAction[];
    }>;
  };
  specialZones: {
    specialZoneHarnessActions: HostFn<LegalAction[]>;
    edgerunnerTempsInstallActionsRemaining: HostFn<number>;
  };
  constants: {
    CORP_HQ_SHUFFLE_DRAW_CARD_ID: string;
    COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID: string;
    DISINFECTANT_VIRUS_COUNTER_ASSET_ID: string;
    COUNTER_UPGRADE_CARD_IDS: ReadonlySet<string>;
    ADVANCEMENT_PLACEMENT_OPERATION_ID: string;
  };
};

export function buildCorpMainActions(
  host: CorpMainActionGenerationHost,
): LegalAction[] {
  const state = host.state;
  const action = host.actions.buildLegalAction;
  const makeActionId = host.actions.makeActionId;
  const buildCorpEndTurnAction = host.actions.buildEndTurnAction;
  const buildCorpForgoActionDebtAction = host.actions.buildForgoActionDebtAction;
  const buildPurgeableRunnerVirusPurgeAction =
    host.actions.buildPurgeableRunnerVirusPurgeAction;
  const buildCorpPurgeVirusAction = host.actions.buildPurgeVirusAction;
  const buildCorpGainCreditAction = host.actions.buildGainCreditAction;
  const buildCorpDrawAction = host.actions.buildDrawAction;
  const buildCorpTrashNewDataFortCreationLockActions =
    host.actions.buildTrashNewDataFortCreationLockActions;
  const buildCorpNewRemoteIceInstallAction =
    host.actions.buildNewRemoteIceInstallAction;
  const buildCorpServerIceInstallAction =
    host.actions.buildServerIceInstallAction;
  const buildCorpNewRemoteRootInstallAction =
    host.actions.buildNewRemoteRootInstallAction;
  const buildCorpServerRootInstallAction =
    host.actions.buildServerRootInstallAction;
  const definitionFor = host.cards.definitionFor;
  const mustInstance = host.cards.mustInstance;
  const isUniqueCard = host.cards.isUniqueCard;
  const hasInstalledUniqueCardDefinition =
    host.cards.hasInstalledUniqueCardDefinition;
  const cardImplementationForDefinitionId =
    host.cards.cardImplementationForDefinitionId;
  const rezzedCorpRootCardIds = host.cards.rezzedCorpRootCardIds;
  const corpInstalledCardIds = host.cards.corpInstalledCardIds;
  const visibleVirusCounterTargetIds =
    host.cards.visibleVirusCounterTargetIds;
  const effectiveAgendaDifficulty = host.agenda.effectiveAgendaDifficulty;
  const effectiveAgendaDifficultyDeps = host.agenda.effectiveAgendaDifficultyDeps;
  const scoredAgendaKindForDefinition =
    host.agenda.scoredAgendaKindForDefinition;
  const serverChoiceDisplayLabel = host.agenda.serverChoiceDisplayLabel;
  const scoredAgendaAbilityHost = host.agenda.scoredAgendaAbilityHost;
  const buildScoredAgendaAbilityActionsForCard =
    host.agenda.buildScoredAgendaAbilityActionsForCard;
  const totalCounters = host.counters.totalCounters;
  const purgeableRunnerVirusCounterTotal =
    host.counters.purgeableRunnerVirusCounterTotal;
  const spyCountersForServer = host.counters.spyCountersForServer;
  const corpActionDebtPending = host.corp.corpActionDebtPending;
  const filterActionsForRestrictedExtraActions =
    host.corp.filterActionsForRestrictedExtraActions ??
    ((_state: GameState, _side: "corp", candidateActions: LegalAction[]) =>
      candidateActions);
  const activeObligationCount =
    host.corp.activeObligationCount;
  const canPlayCorpOperation = host.corp.canPlayCorpOperation;
  const corpUtilityImplementationForDefinition =
    host.corp.corpUtilityImplementationForDefinition;
  const hardwareTrashByCounterLegalActions = host.corp.hardwareTrashByCounterLegalActions;
  const advancementPlacementLegalActions = host.corp.advancementPlacementLegalActions;
  const corpAgendaPointTotal = host.corp.corpAgendaPointTotal;
  const hasCorpUtilityKind = host.corp.hasCorpUtilityKind;
  const uniqueDirectLongtailKindForDefinition =
    host.corp.uniqueDirectLongtailKindForDefinition;
  const corpInstalledEconomyActionProfileForDefinition =
    host.corp.corpInstalledEconomyActionProfileForDefinition;
  const corpInstalledEconomyActionPayload =
    host.corp.corpInstalledEconomyActionPayload;
  const isConcealedRunnerResource = host.runner.isConcealedRunnerResource;
  const hiddenRunnerResourceSlotId = host.runner.hiddenRunnerResourceSlotId;
  const corpNewDataFortCreationLocked =
    host.install.corpNewDataFortCreationLocked;
  const corpIceInstallTotalCost = host.install.corpIceInstallTotalCost;
  const canInstallCorpRootCardInServer =
    host.install.canInstallCorpRootCardInServer;
  const isRegionUpgrade = host.install.isRegionUpgrade;
  const corpRegionUpgradeIdsInServer =
    host.install.corpRegionUpgradeIdsInServer;
  const corpRootAgendaOrNodeCapacityInServer =
    host.install.corpRootAgendaOrNodeCapacityInServer;
  const corpRootAssetIdsInServer = host.install.corpRootAssetIdsInServer;
  const corpRootMainCardIdsInServer =
    host.install.corpRootMainCardIdsInServer;
  const isInstalledCorpCardAdvanceable =
    host.install.isInstalledCorpCardAdvanceable;
  const rootInstallRezzesOnInstall = host.rez.rootInstallRezzesOnInstall;
  const rezCostForCard = host.rez.rezCostForCard;
  const rezCostReductionSourceDefinitionIdsFor =
    host.rez.rezCostReductionSourceDefinitionIdsFor;
  const isObligationDebtDefinition =
    host.rez.isObligationDebtDefinition;
  const corpTraceDamageAbilityHost = host.abilities.corpTraceDamageAbilityHost;
  const corpSpecialDamageAbilityHost =
    host.abilities.corpSpecialDamageAbilityHost;
  const pushCorpTraceDamageOrCardImplementationActions =
    host.abilities.pushCorpTraceDamageOrCardImplementationActions;
  const buildCorpSpecialDamageAbilityActionsForCard =
    host.abilities.buildCorpSpecialDamageAbilityActionsForCard;
  const specialZoneHarnessActions = host.specialZones.specialZoneHarnessActions;
  const edgerunnerTempsInstallActionsRemaining =
    host.specialZones.edgerunnerTempsInstallActionsRemaining;
  const CORP_HQ_SHUFFLE_DRAW_CARD_ID =
    host.constants.CORP_HQ_SHUFFLE_DRAW_CARD_ID;
  const COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID =
    host.constants.COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID;
  const DISINFECTANT_VIRUS_COUNTER_ASSET_ID =
    host.constants.DISINFECTANT_VIRUS_COUNTER_ASSET_ID;
  const COUNTER_UPGRADE_CARD_IDS = host.constants.COUNTER_UPGRADE_CARD_IDS;
  const ADVANCEMENT_PLACEMENT_OPERATION_ID =
    host.constants.ADVANCEMENT_PLACEMENT_OPERATION_ID;

  const actions: LegalAction[] = [];
  if (state.actionEconomy?.pendingOffer?.side === "corp") {
    const offer = state.actionEconomy.pendingOffer;
    return [
      action(
        state,
        "corp",
        "trigger_ability",
        "Zusätzliche Aktion annehmen",
        offer.sourceCardInstanceId,
        [],
        {
          actionEconomyAbility: "accept_extra_action_offer",
          cardId: offer.sourceCardInstanceId,
          sourceDefinitionId: offer.sourceDefinitionId,
          restrictedActionFamily: offer.restriction,
          ...(offer.dieRoll ? { dieRoll: offer.dieRoll } : {}),
        },
      ),
      action(
        state,
        "corp",
        "trigger_ability",
        "Zusätzliche Aktion ablehnen",
        offer.sourceCardInstanceId,
        [],
        {
          actionEconomyAbility: "decline_extra_action_offer",
          cardId: offer.sourceCardInstanceId,
          sourceDefinitionId: offer.sourceDefinitionId,
          restrictedActionFamily: offer.restriction,
          ...(offer.dieRoll ? { dieRoll: offer.dieRoll } : {}),
        },
      ),
    ];
  }
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (
        definition.type === "agenda" &&
        effectiveAgendaDifficulty(effectiveAgendaDifficultyDeps, state, id) <=
          mustInstance(state.cardInstances, id).advancementCounters
      ) {
        if (
          scoredAgendaKindForDefinition(definition) ===
          "choose_fort_ice_strength_bonus"
        ) {
          for (const targetServer of state.corp.servers) {
            actions.push(
              action(
                state,
                "corp",
                "score_agenda",
                `Security Net Optimization scoren und ${serverChoiceDisplayLabel(
                  state,
                  targetServer.id,
                )} wählen`,
                id,
                [],
                { cardId: id, selectedServerId: targetServer.id },
              ),
            );
          }
        } else {
          actions.push(
            action(
              state,
              "corp",
              "score_agenda",
              `Agenda in ${server.label} scoren`,
              id,
              [],
              { cardId: id },
            ),
          );
        }
      }
    }
  }
  if (state.corp.clicks <= 0) {
    actions.push(buildCorpEndTurnAction(state));
    return actions;
  }
  if (corpActionDebtPending(state) > 0) {
    return [buildCorpForgoActionDebtAction(state)];
  }
  if (purgeableRunnerVirusCounterTotal(state) > 0) {
    actions.push(buildPurgeableRunnerVirusPurgeAction(state));
  }
  if (state.corp.clicks >= 3 && totalCounters(state, "virus") > 0) {
    actions.push(buildCorpPurgeVirusAction(state));
  }
  if (state.corp.credits >= 4) {
    for (const server of state.corp.servers) {
      const count = spyCountersForServer(state, server.id);
      if (count <= 0) continue;
      actions.push(
        action(
          state,
          "corp",
          "trigger_ability",
          `Spy-Counter in ${server.label} entfernen`,
          "game_rule",
          [{ clicks: 1, credits: 4 }],
          {
            serverId: server.id,
            corpAbility: "remove_spy_counter",
            counterType: "spy",
            removedCounterAmount: 1,
          },
        ),
      );
    }
  }
  actions.push(buildCorpGainCreditAction(state));
  if (activeObligationCount(state) > 0 && state.corp.credits >= 12) {
    actions.push(
      action(
        state,
        "corp",
        "trigger_ability",
        "ACME Savings and Loan: 12 Credits zahlen und 1 Agenda-Punkt scoren",
        "game_rule",
        [{ clicks: 1, credits: 12 }],
        {
          obligationDebtAbility: "remove_obligation",
          obligationDebtCreditCost: 12,
          obligationDebtScoreAgendaPoints: 1,
          obligationDebtCountBefore:
            activeObligationCount(state),
        },
      ),
    );
  }
  if (state.corp.rd.length > 0)
    actions.push(buildCorpDrawAction(state));
  if (state.runner.tags > 0 && state.corp.credits >= 2) {
    for (const id of state.runner.rig.resources) {
      const hiddenResource = isConcealedRunnerResource(state, id);
      const resourceSlotId = hiddenResource
        ? hiddenRunnerResourceSlotId(id)
        : id;
      const definition = hiddenResource ? undefined : definitionFor(state, id);
      actions.push(
        action(
          state,
          "corp",
          "trash_resource",
          hiddenResource
            ? "Verdeckte Runner-Resource trashen"
            : `${definition?.title ?? "Resource"} trashen`,
          "basic_action",
          [{ clicks: 1, credits: 2 }],
          hiddenResource
            ? {
                cardId: resourceSlotId,
                resourceSlotId,
                hiddenResourceSlotId: resourceSlotId,
                hiddenRunnerResource: true,
                redactedKind: "hidden_runner_resource",
              }
            : { cardId: id, resourceId: id },
          {
            targetRequirements: [
              {
                id: "resource",
                kind: "card",
                side: "runner",
                zoneScope: ["runner.rig.resources"],
                visibility: "public",
              },
            ],
          },
        ),
      );
    }
  }
  for (const id of state.runner.rig.resources.slice().sort()) {
    if (isConcealedRunnerResource(state, id)) continue;
    const definition = definitionFor(state, id);
    const corpTrashAbility =
      cardImplementationForDefinitionId(definition.id)
        ?.corpTrashInstalledRunnerSource;
    if (
      !corpTrashAbility ||
      corpTrashAbility.kind !== "corp_trash_installed_runner_resource" ||
      corpTrashAbility.timing !== "corp_main" ||
      corpTrashAbility.target !== "source" ||
      state.corp.credits < corpTrashAbility.cost.credits
    ) {
      continue;
    }
    actions.push(
      action(
        state,
        "corp",
        "trigger_ability",
        `${definition.title} trashen`,
        id,
        [
          {
            clicks: corpTrashAbility.cost.clicks,
            credits: corpTrashAbility.cost.credits,
          },
        ],
        {
          cardId: id,
          corpAbility: "trash_installed_runner_resource_source",
          abilityKind: "corp_trash_installed_runner_resource",
          sourceDefinitionId: definition.id,
          trashCostPaid: corpTrashAbility.cost.credits,
        },
        {
          targetRequirements: [
            {
              id: "runnerResourceSource",
              kind: "card",
              side: "runner",
              zoneScope: ["runner.rig.resources"],
              visibility: "public",
            },
          ],
        },
      ),
    );
  }
  actions.push(...buildCorpTrashNewDataFortCreationLockActions(state));
  const newDataFortCreationLocked = corpNewDataFortCreationLocked(state);
  for (const id of state.corp.hq) {
    const definition = definitionFor(state, id);
    if (
      definition.type === "operation" &&
      state.corp.credits >= (definition.cost ?? 0) &&
      canPlayCorpOperation(state, definition)
    ) {
      if (
        corpUtilityImplementationForDefinition(definition.id)?.kind ===
        "installed_hardware_trash_by_counter"
      ) {
        actions.push(...hardwareTrashByCounterLegalActions(state, id, definition));
        continue;
      }
      if (definition.id === ADVANCEMENT_PLACEMENT_OPERATION_ID) {
        actions.push(...advancementPlacementLegalActions(state, id, definition));
        continue;
      }
      const implementationActions =
        host.corp.cardImplementationOperationLegalActions(state, id, definition);
      if (implementationActions.length > 0) {
        actions.push(...implementationActions);
        continue;
      }
      actions.push(
        action(
          state,
          "corp",
          "play_operation",
          `${definition.title} spielen`,
          id,
          [{ clicks: 1, credits: definition.cost ?? 0 }],
          { cardId: id },
        ),
      );
    }
    if (definition.type === "ice") {
      if (!newDataFortCreationLocked)
        actions.push(buildCorpNewRemoteIceInstallAction(state, id));
      for (const server of state.corp.servers) {
        const {
          baseCost,
          additionalCost,
          reduction,
          reductionSourceDefinitionIds,
          increaseSourceDefinitionIds,
          totalCost,
        } =
          corpIceInstallTotalCost(state, id, server);
        if (state.corp.credits < totalCost) continue;
        actions.push(
          buildCorpServerIceInstallAction(
            state,
            id,
            server,
            {
              baseCost,
              additionalCost,
              reduction,
              ...(reductionSourceDefinitionIds
                ? { reductionSourceDefinitionIds }
                : {}),
              ...(increaseSourceDefinitionIds
                ? { increaseSourceDefinitionIds }
                : {}),
              totalCost,
            },
          ),
        );
      }
    }
    if (
      definition.type === "agenda" ||
      definition.type === "asset" ||
      definition.type === "upgrade"
    ) {
      if (
        isUniqueCard(definition) &&
        hasInstalledUniqueCardDefinition(state, "corp", definition.id)
      )
        continue;
      const rootRezOnInstall = rootInstallRezzesOnInstall(definition);
      const regionInstallCost = rootRezOnInstall
        ? rezCostForCard(state, id)
        : 0;
      if (
        state.corp.credits >= regionInstallCost &&
        !newDataFortCreationLocked &&
        host.install.canInstallCorpRootCardInNewRemote(definition)
      ) {
        actions.push(
          buildCorpNewRemoteRootInstallAction(state, id, regionInstallCost),
        );
      }
      for (const server of state.corp.servers) {
        if (
          canInstallCorpRootCardInServer(state, definition, server) &&
          state.corp.credits >= regionInstallCost
        ) {
          const replacesRegion =
            isRegionUpgrade(definition) &&
            corpRegionUpgradeIdsInServer(state, server).length > 0;
          const rootCapacity = corpRootAgendaOrNodeCapacityInServer(state, server);
          const replacesRootAsset =
            definition.type === "agenda" &&
            corpRootAssetIdsInServer(state, server).length > 0 &&
            corpRootMainCardIdsInServer(state, server).length >= rootCapacity;
          actions.push(
            buildCorpServerRootInstallAction(
              state,
              id,
              server,
              regionInstallCost,
              { replacesRootAsset, replacesRegion },
            ),
          );
        }
      }
    }
  }
  for (const server of state.corp.servers) {
    for (const id of server.root) {
      const definition = definitionFor(state, id);
      if (isInstalledCorpCardAdvanceable(state, id, definition)) {
        if (state.corp.credits >= 1)
          actions.push(
            action(
              state,
              "corp",
              "advance_card",
              `${definition.title} in ${server.label} advancen`,
              id,
              [{ clicks: 1, credits: 1 }],
              { cardId: id },
            ),
          );
      }
      const rezCost = rezCostForCard(state, id);
      const rezCostReductionSourceDefinitionIds =
        rezCostReductionSourceDefinitionIdsFor(state, id, definition);
      if (
        (definition.type === "asset" || definition.type === "upgrade") &&
        !mustInstance(state.cardInstances, id).rezzed &&
        state.corp.credits >= rezCost &&
        (!isObligationDebtDefinition(definition.id) ||
          corpAgendaPointTotal(state) >= 1)
      ) {
        const acmeRezCost =
          isObligationDebtDefinition(definition.id)
            ? {
                agendaPointCost: 1,
                obligationDebtAbility: "rez_with_agenda_point_cost",
              }
            : {};
        actions.push(
          action(
            state,
            "corp",
            "rez_ice",
            `Karte in ${server.label} rezzen`,
            id,
            [{ credits: rezCost }],
            {
              cardId: id,
              rootRez: true,
              ...acmeRezCost,
              ...(rezCostReductionSourceDefinitionIds.length > 0
                ? {
                    rezCostReductionSourceDefinitionIds:
                      rezCostReductionSourceDefinitionIds.join(","),
                    rezCostReductionAmount:
                      (definition.rezCost ?? 0) - rezCost,
                    rezCostPaid: rezCost,
                  }
                : {}),
            },
          ),
        );
      }
    }
  }
  const corpTraceDamageAbilityActionsHost = corpTraceDamageAbilityHost(state);
  const corpSpecialDamageAbilityActionsHost = corpSpecialDamageAbilityHost(state);
  for (const assetId of rezzedCorpRootCardIds(state).sort()) {
    const definition = definitionFor(state, assetId);
    pushCorpTraceDamageOrCardImplementationActions(
      state,
      actions,
      assetId,
      corpTraceDamageAbilityActionsHost,
    );
    const specialDamageActions = buildCorpSpecialDamageAbilityActionsForCard(
      corpSpecialDamageAbilityActionsHost,
      assetId,
    );
    if (specialDamageActions.handled)
      actions.push(...specialDamageActions.actions);
    if (
      definition.id === CORP_HQ_SHUFFLE_DRAW_CARD_ID ||
      hasCorpUtilityKind(state, assetId, "shuffle_hq_into_rd_then_draw_same_count")
    ) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: HQ in R&D mischen und ziehen`,
          assetId,
          [{ clicks: 1 }],
          { cardId: assetId, v1917AssetAbility: "rescheduler_hq_shuffle_draw" },
        ),
      );
    }
    if (hasCorpUtilityKind(state, assetId, "move_installed_corp_card_to_hq")) {
      for (const targetCardId of corpInstalledCardIds(state).sort()) {
        const targetDefinition = definitionFor(state, targetCardId);
        actions.push(
          action(
            state,
            "corp",
            "gain_credit",
            `${definition.title}: ${targetDefinition.title} nach HQ nehmen`,
            assetId,
            [{ clicks: 1 }],
            {
              cardId: assetId,
              v1951CorpUtilityAbility: "corp_installed_card_to_hq",
              targetCardId,
            },
          ),
        );
      }
    }
    if (
      definition.id === DISINFECTANT_VIRUS_COUNTER_ASSET_ID &&
      !hasCorpUtilityKind(state, assetId, "counter_prevention_replacement")
    ) {
      for (const targetCardId of visibleVirusCounterTargetIds(state).sort()) {
        const targetDefinition = definitionFor(state, targetCardId);
        actions.push(
          action(
            state,
            "corp",
            "gain_credit",
            `${definition.title}: Virus-Counter von ${targetDefinition.title} entfernen`,
            assetId,
            [{ clicks: 1 }],
            {
              cardId: assetId,
              v1917AssetAbility: "remove_virus_counter",
              targetCardId,
              counterType: "virus",
              removeCounterAmount: 1,
            },
          ),
        );
      }
    }
    if (COUNTER_UPGRADE_CARD_IDS.has(definition.id)) {
      actions.push(
        action(
          state,
          "corp",
          "gain_credit",
          `${definition.title}: Power-Counter laden`,
          assetId,
          [{ clicks: 1 }],
          {
            cardId: assetId,
            v1918UpgradeAbility: "add_power_counter",
            counterType: "power",
            addCounterAmount: 1,
          },
        ),
      );
    }
    const economyProfile = corpInstalledEconomyActionProfileForDefinition(
      definition.id,
    );
    if (!economyProfile) continue;
    const gainLabel =
      `${definition.title}: ${economyProfile.creditGain} Credits` +
      (economyProfile.trashSource ? " und trashen" : "");
    actions.push(
      action(
        state,
        "corp",
        "gain_credit",
        gainLabel,
        assetId,
        [
          {
            clicks: economyProfile.clickCost,
            ...(economyProfile.creditCost > 0
              ? { credits: economyProfile.creditCost }
              : {}),
          },
        ],
        corpInstalledEconomyActionPayload(economyProfile, assetId),
      ),
    );
  }
  const scoredAgendaAbilityActionsHost = scoredAgendaAbilityHost(state);
  const scoredAgendaTraceDamageAbilityActionsHost = corpTraceDamageAbilityHost(state);
  for (const agendaId of state.corp.scoreArea.slice().sort()) {
    const scoredAgendaAbilityActions = buildScoredAgendaAbilityActionsForCard(
      scoredAgendaAbilityActionsHost,
      agendaId,
    );
    if (scoredAgendaAbilityActions.handled) {
      actions.push(...scoredAgendaAbilityActions.actions);
      continue;
    }
    pushCorpTraceDamageOrCardImplementationActions(
      state,
      actions,
      agendaId,
      scoredAgendaTraceDamageAbilityActionsHost,
    );
  }
  actions.push(...specialZoneHarnessActions(state, "corp"));
  actions.push(buildCorpEndTurnAction(state));
  if (edgerunnerTempsInstallActionsRemaining(state) > 0) {
    return filterActionsForRestrictedExtraActions(
      state,
      "corp",
      actions
      .filter(
        (candidate) =>
          candidate.type === "install_card" || candidate.type === "end_turn",
      )
      .map((candidate) =>
        candidate.type === "install_card"
          ? {
              ...candidate,
              payload: {
                ...(candidate.payload ?? {}),
                v1922EdgerunnerTempsInstallAction: true,
              },
              actionId: makeActionId(
                candidate.type,
                candidate.side,
                {
                  ...(candidate.payload ?? {}),
                  v1922EdgerunnerTempsInstallAction: true,
                },
                candidate.source,
              ),
            }
          : candidate,
      ),
    );
  }
  return filterActionsForRestrictedExtraActions(state, "corp", actions);
}
