import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  DamageType,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import type {
  CardCorpUtilityImplementation,
  CardEffectImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID,
  MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID,
  PROJECT_CONSULTANTS_ADVANCE_AGENDA_OPERATION_ID,
  SILVER_LINING_RECOVERY_PROTOCOL_ECONOMY_OPERATION_ID,
  ADVANCEMENT_PLACEMENT_OPERATION_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
} from "../../mechanics/agenda-operation-effects";
import {
  CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
  CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
} from "../../mechanics/hidden-zone";
import { EDGERUNNER_TEMPS_INSTALL_OPERATION_ID } from "../../mechanics/longtail-card-effects";
import { definitionFor, mustInstance } from "../state/card-server-lookup";
import {
  RESTRICTED_ACTION_GRANT_KEYS,
  setRestrictedActionGrant,
} from "../state/restricted-action-grants";

type CorpOperationResolver = {
  name: string;
  canPlay?: (host: CorpOperationResolutionHost) => boolean;
  resolve: (host: CorpOperationResolutionHost, legalAction: LegalAction) => void;
};

export type CorpOperationResolutionHost = {
  state: GameState;
  actions: {
    buildLegalAction: (
      state: GameState,
      side: "corp",
      type: "play_operation",
      label: string,
      source: LegalAction["source"],
      costs: LegalAction["costs"],
      payload?: LegalAction["payload"],
    ) => LegalAction;
  };
  cards: {
    isCorpInstallableCardType: (definition: CardDefinition) => boolean;
    unrezzedInstalledIceIds?: () => CardInstanceId[];
    rezCostForCard?: (cardId: CardInstanceId) => number;
  };
  corp: {
    drawCorpCard: () => void;
    ensureTurnFlags: () => NonNullable<GameState["corpTurnFlags"]>;
    runnerStoleAgendaLastTurn: () => boolean;
    runnerStolenAgendaAdvancementCountersLastTurn: () => number;
    swapCorpHqAndRdTop: () => void;
  };
  runner: {
    requireRunnerTagged: () => void;
    runnerLastTurnInstalledResourceIds: () => CardInstanceId[];
    isConcealedRunnerResource: (cardId: CardInstanceId) => boolean;
    hiddenRunnerResourceSlotId: (cardId: CardInstanceId) => string;
  };
  economy: {
    gainCorpCredits: (amount: number) => void;
    addFutureExtraActionGrant?: (input: {
      sourceCardInstanceId: CardInstanceId;
      sourceDefinitionId: CardDefinitionId;
      remainingTurns: number;
      amountPerTurn: number;
    }) => void;
    addCorpCreditForfeitDebt?: (
      sourceCardInstanceId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      amount: number,
    ) => number;
  };
  zones: {
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
  };
  damage: {
    resolveDamageOperation: (
      legalAction: LegalAction,
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    addRunnerTagsWithPrevention: (
      legalAction: LegalAction,
      amount: number,
      source: string,
    ) => void;
  };
  hiddenZone: {
    startCorpArchivesToHqChoice: (
      legalAction: LegalAction,
      sourceCardId: CardInstanceId,
    ) => void;
    startCorpRdTopReorderChoice: (
      legalAction: LegalAction,
      sourceCardId: CardInstanceId,
    ) => void;
    resolveConcealAndReorderInstalledIce: (legalAction: LegalAction) => void;
  };
  board: {
    installedAgendaOperationTarget: () => CardInstanceId | undefined;
    advanceableInstalledCardTargets: () => CardInstanceId[];
    advancementDistributionOptions: (
      amount: number,
      distribution: unknown,
    ) => unknown[];
    moveAdvancementOptions: (
      sourceCardId: CardInstanceId,
      source: unknown,
      maxAmount: number | "all",
    ) => unknown[];
    resolveAgendaCounterOperation: (
      legalAction: LegalAction,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    resolveManagementShakeUpOperation: (legalAction: LegalAction) => void;
    resolveAdvancementPlacementOperation: (
      legalAction: LegalAction,
    ) => void;
  };
  operations: {
    hardwareTrashByCounterEligibleHardwareIds: () => CardInstanceId[];
    resolveHardwareTrashByCounterOperation: (legalAction: LegalAction) => void;
  };
  cardImplementation: {
    canPlayPrintedCostOnPlay: (definition: CardDefinition) => boolean;
    executeOnPlayAbility: (
      legalAction: LegalAction,
      definition: CardDefinition,
      cardId: CardInstanceId,
    ) => void;
  };
};

const CORP_OPERATION_RESOLVERS: Record<string, CorpOperationResolver> = {
  simple_economy_operation: {
    name: "corp_operation_gain_credits_4",
    resolve: (host) => {
      host.state.corp.credits += 4;
    },
  },
  v111_core_damage_operation: {
    name: "corp_operation_core_damage_1",
    resolve: (host, legalAction) => {
      host.damage.resolveDamageOperation(
        legalAction,
        "core",
        1,
        "v111_core_damage_operation" as CardDefinitionId,
      );
    },
  },
  simple_draw_operation: {
    name: "corp_operation_draw_2",
    resolve: (host) => {
      host.corp.drawCorpCard();
      host.corp.drawCorpCard();
    },
  },
  simple_tag_punishment_operation: {
    name: "corp_operation_tag_punishment_lose_2",
    canPlay: (host) => host.state.runner.tags > 0,
    resolve: (host) => {
      if (host.state.runner.tags <= 0)
        throw new Error("Der Runner ist nicht getaggt.");
      host.state.runner.credits = Math.max(0, host.state.runner.credits - 2);
    },
  },
  v08_credit_surge_operation: {
    name: "corp_operation_gain_credits_7",
    resolve: (host) => {
      host.state.corp.credits += 7;
    },
  },
  v08_archive_planning_operation: {
    name: "corp_operation_draw_3",
    resolve: (host) => {
      host.corp.drawCorpCard();
      host.corp.drawCorpCard();
      host.corp.drawCorpCard();
    },
  },
  v098_hq_rd_swap_operation: {
    name: "corp_operation_swap_hq_rd",
    canPlay: (host) => host.state.corp.hq.length > 1 && host.state.corp.rd.length > 0,
    resolve: (host) => {
      host.corp.swapCorpHqAndRdTop();
    },
  },
  v099_bad_publicity_operation: {
    name: "corp_operation_bad_publicity_credit",
    resolve: (host) => {
      host.state.corp.credits += 3;
      host.state.corp.badPublicity += 1;
    },
  },
  [CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID]: {
    name: "onr_v1922_corp_operation_private_archives_to_hq",
    canPlay: (host) => host.state.corp.archives.length > 0,
    resolve: (host, legalAction) => {
      const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
      if (
        !sourceCardId ||
        definitionFor(host.state, sourceCardId).id !==
          CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID
      )
        throw new Error("Off-Site Backups fehlt als Quelle.");
      host.hiddenZone.startCorpArchivesToHqChoice(legalAction, sourceCardId);
    },
  },
  [CORP_RD_TOP5_REORDER_OPERATION_CARD_ID]: {
    name: "onr_v1922_corp_operation_private_rd_top5_reorder",
    canPlay: (host) => host.state.corp.rd.length >= 2,
    resolve: (host, legalAction) => {
      const sourceCardId = String(legalAction.payload?.cardId ?? "") as CardInstanceId;
      if (
        !sourceCardId ||
        definitionFor(host.state, sourceCardId).id !==
          CORP_RD_TOP5_REORDER_OPERATION_CARD_ID
      )
        throw new Error("Planning Consultants fehlt als Quelle.");
      host.hiddenZone.startCorpRdTopReorderChoice(legalAction, sourceCardId);
    },
  },
  [EDGERUNNER_TEMPS_INSTALL_OPERATION_ID]: {
    name: "onr_v1922_corp_operation_install_action_bundle",
    canPlay: (host) =>
      host.state.corp.hq.some((cardId) =>
        host.cards.isCorpInstallableCardType(definitionFor(host.state, cardId)),
      ),
    resolve: (host, legalAction) => {
      if (
        !host.state.corp.hq.some((cardId) =>
          host.cards.isCorpInstallableCardType(definitionFor(host.state, cardId)),
        )
      ) {
        throw new Error(
          "Edgerunner, Inc., Temps findet keine installierbare Korp-Karte.",
        );
      }
      const flags = host.corp.ensureTurnFlags();
      const sourceCardId = sourceCardIdFromAction(legalAction);
      setRestrictedActionGrant(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
        {
          side: "corp",
          sourceCardInstanceId: sourceCardId,
          sourceDefinitionId:
            EDGERUNNER_TEMPS_INSTALL_OPERATION_ID as CardDefinitionId,
          actionType: "install_card",
          remainingActions: 3,
          costProfile: "extra_click",
          cleanupTiming: "side_turn_end",
        },
      );
      flags.edgerunnerTempsInstallActionsRemaining = 3;
      host.state.corp.clicks += 3;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1922CorpOperationAbility: "install_action_bundle",
        gainedActions: 3,
        edgerunnerTempsInstallActionsRemaining:
          flags.edgerunnerTempsInstallActionsRemaining,
        corpClicksAfter: host.state.corp.clicks,
      };
    },
  },
  [FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (host) => corpAgendaCounterOperationTarget(host) !== undefined,
    resolve: (host, legalAction) =>
      host.board.resolveAgendaCounterOperation(
        legalAction,
        FALSIFIED_TRANSACTIONS_EXPERT_COUNTER_OPERATION_ID as CardDefinitionId,
      ),
  },
  [MANAGEMENT_SHAKE_UP_ADVANCEMENT_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_three_advancement_counters",
    canPlay: (host) => host.board.advanceableInstalledCardTargets().length > 0,
    resolve: (host, legalAction) =>
      host.board.resolveManagementShakeUpOperation(legalAction),
  },
  [PROJECT_CONSULTANTS_ADVANCE_AGENDA_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_advance_installed_agenda",
    canPlay: (host) => host.board.installedAgendaOperationTarget() !== undefined,
    resolve: (host, legalAction) => {
      const targetAgendaId = host.board.installedAgendaOperationTarget();
      if (!targetAgendaId)
        throw new Error(
          "Project Consultants findet keine installierte Agenda.",
        );
      mustInstance(host.state.cardInstances, targetAgendaId).advancementCounters += 1;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919OperationAbility: "advance_installed_agenda",
        targetCardId: targetAgendaId,
        targetCardDefinitionId: definitionFor(host.state, targetAgendaId).id,
        addedAdvancementCounters: 1,
        advancementCountersAfter:
          mustInstance(host.state.cardInstances, targetAgendaId).advancementCounters,
      };
    },
  },
  [SILVER_LINING_RECOVERY_PROTOCOL_ECONOMY_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_gain_credits_3",
    resolve: (host, legalAction) => {
      host.economy.gainCorpCredits(3);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919OperationAbility: "gain_credits",
        gainedCredits: 3,
        corpCreditsAfter: host.state.corp.credits,
      };
    },
  },
  [ADVANCEMENT_PLACEMENT_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_two_advancement_counters",
    canPlay: (host) => host.board.advanceableInstalledCardTargets().length > 0,
    resolve: (host, legalAction) =>
      host.board.resolveAdvancementPlacementOperation(legalAction),
  },
  [TEAM_RESTRUCTURING_COUNTER_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_power_counter",
    canPlay: (host) => corpAgendaCounterOperationTarget(host) !== undefined,
    resolve: (host, legalAction) =>
      host.board.resolveAgendaCounterOperation(
        legalAction,
        TEAM_RESTRUCTURING_COUNTER_OPERATION_ID as CardDefinitionId,
      ),
  },
};

export function corpUtilityImplementationForDefinition(
  definitionId: CardDefinitionId,
): CardCorpUtilityImplementation | undefined {
  return cardImplementationForDefinitionId(definitionId)?.corpUtility;
}

export function canPlayCorpOperation(
  host: CorpOperationResolutionHost,
  definition: CardDefinition,
): boolean {
  if (hasPrintedCostOnPlayCardImplementation(definition))
    return (
      host.state.corp.credits >=
        (definition.cost ?? 0) +
          onPlayCardImplementationAdditionalOperationCost(definition) &&
      host.cardImplementation.canPlayPrintedCostOnPlay(definition) &&
      onPlayCardImplementationChoicesAreAvailable(host, definition)
    );
  const utility = corpUtilityImplementationForDefinition(definition.id);
  if (utility) return canPlayCorpUtilityOperation(host, definition, utility);
  const implementationResolver =
    cardImplementationCorpOperationResolver(host, definition);
  if (implementationResolver)
    return implementationResolver.canPlay?.(host) ?? true;
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  if (resolver) return resolver.canPlay?.(host) ?? true;
  return host.cardImplementation.canPlayPrintedCostOnPlay(definition);
}

export function resolveCorpOperation(
  host: CorpOperationResolutionHost,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  if (hasPrintedCostOnPlayCardImplementation(definition)) {
    host.cardImplementation.executeOnPlayAbility(
      legalAction,
      definition,
      sourceCardIdFromAction(legalAction),
    );
    return;
  }
  const utility = corpUtilityImplementationForDefinition(definition.id);
  if (utility) {
    resolveCorpUtilityOperation(host, definition, legalAction, utility);
    return;
  }
  const implementationResolver =
    cardImplementationCorpOperationResolver(host, definition);
  if (implementationResolver) {
    implementationResolver.resolve(host, legalAction);
    return;
  }
  const resolver = CORP_OPERATION_RESOLVERS[definition.id];
  if (resolver) {
    resolver.resolve(host, legalAction);
    return;
  }
  host.cardImplementation.executeOnPlayAbility(
    legalAction,
    definition,
    sourceCardIdFromAction(legalAction),
  );
}

export function canPlayCorpUtilityOperation(
  host: CorpOperationResolutionHost,
  _definition: CardDefinition,
  utility: CardCorpUtilityImplementation,
): boolean {
  switch (utility.kind) {
    case "gain_restricted_install_actions":
      return host.state.corp.hq.some((cardId) =>
        host.cards.isCorpInstallableCardType(definitionFor(host.state, cardId)),
      );
    case "x_future_actions_and_credit_forfeit":
      return host.state.corp.credits >= utility.costMultiplier;
    case "corp_archives_to_hq":
      return host.state.corp.archives.some((cardId) => {
        const sourceCardId = host.state.corp.hq.find(
          (candidate) => definitionFor(host.state, candidate).id === _definition.id,
        );
        return cardId !== sourceCardId;
      });
    case "corp_rd_top_reorder":
      return host.state.corp.rd.length >= 2;
    case "encounter_tag":
      return host.corp.runnerStoleAgendaLastTurn();
    case "gain_credits_from_stolen_agenda_advancement_history":
      return host.corp.runnerStoleAgendaLastTurn();
    case "trash_runner_resources_if_tagged":
      return host.state.runner.tags > 0;
    case "installed_hardware_trash_by_counter":
      return (
        host.state.runner.tags > 0 &&
        host.state.corp.credits > 0 &&
        host.operations.hardwareTrashByCounterEligibleHardwareIds().length > 0
      );
    default:
      return false;
  }
}

export function resolveCorpUtilityOperation(
  host: CorpOperationResolutionHost,
  definition: CardDefinition,
  legalAction: LegalAction,
  utility: CardCorpUtilityImplementation,
): void {
  switch (utility.kind) {
    case "gain_restricted_install_actions": {
      if (!canPlayCorpUtilityOperation(host, definition, utility)) {
        throw new Error(
          "Edgerunner, Inc., Temps findet keine installierbare Korp-Karte.",
        );
      }
      const flags = host.corp.ensureTurnFlags();
      const sourceCardId = sourceCardIdFromAction(legalAction);
      setRestrictedActionGrant(
        flags,
        RESTRICTED_ACTION_GRANT_KEYS.edgerunnerTempsInstall,
        {
          side: "corp",
          sourceCardInstanceId: sourceCardId,
          sourceDefinitionId: definition.id,
          actionType: "install_card",
          remainingActions: utility.amount,
          costProfile: "extra_click",
          cleanupTiming: "side_turn_end",
        },
      );
      flags.edgerunnerTempsInstallActionsRemaining = utility.amount;
      host.state.corp.clicks += utility.amount;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "install_action_bundle",
        v1922CorpOperationAbility: "install_action_bundle",
        gainedActions: utility.amount,
        restrictedActionSequence: "corp_install",
        edgerunnerTempsInstallActionsRemaining:
          flags.edgerunnerTempsInstallActionsRemaining,
        corpClicksAfter: host.state.corp.clicks,
      };
      return;
    }
    case "x_future_actions_and_credit_forfeit": {
      const x = Number(legalAction.payload?.xValue ?? 0);
      if (!Number.isInteger(x) || x <= 0)
        throw new Error("Future-action X muss positiv sein.");
      const expectedCost = x * utility.costMultiplier;
      if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
        throw new Error("Future-action X-Kosten passen nicht.");
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (
        !host.economy.addFutureExtraActionGrant ||
        !host.economy.addCorpCreditForfeitDebt
      )
        throw new Error("Future-action economy callbacks fehlen.");
      host.economy.addFutureExtraActionGrant({
        sourceCardInstanceId: sourceCardId,
        sourceDefinitionId: definition.id,
        remainingTurns: x,
        amountPerTurn: 1,
      });
      const remainingDebt = host.economy.addCorpCreditForfeitDebt(
        sourceCardId,
        definition.id,
        x,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        xValue: x,
        futureActionTurns: x,
        corpCreditForfeitAdded: x,
        corpCreditForfeitRemaining: remainingDebt,
      };
      return;
    }
    case "corp_archives_to_hq": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (!sourceCardId || definitionFor(host.state, sourceCardId).id !== definition.id)
        throw new Error("Off-Site Backups fehlt als Quelle.");
      host.hiddenZone.startCorpArchivesToHqChoice(legalAction, sourceCardId);
      return;
    }
    case "corp_rd_top_reorder": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (!sourceCardId || definitionFor(host.state, sourceCardId).id !== definition.id)
        throw new Error("Planning Consultants fehlt als Quelle.");
      host.hiddenZone.startCorpRdTopReorderChoice(legalAction, sourceCardId);
      return;
    }
    case "encounter_tag": {
      if (!host.corp.runnerStoleAgendaLastTurn())
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      host.damage.addRunnerTagsWithPrevention(legalAction, 1, "trojan_horse");
      return;
    }
    case "gain_credits_from_stolen_agenda_advancement_history": {
      if (!host.corp.runnerStoleAgendaLastTurn())
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      const advancementCounters =
        host.corp.runnerStolenAgendaAdvancementCountersLastTurn();
      const gainedCredits =
        advancementCounters * utility.multiplierPerAdvancementCounter;
      host.economy.gainCorpCredits(gainedCredits);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "gain_credits_from_stolen_agenda_advancement_history",
        stolenAgendaAdvancementCountersLastTurn: advancementCounters,
        gainedCredits,
        corpCreditsAfter: host.state.corp.credits,
      };
      return;
    }
    case "trash_runner_resources_if_tagged": {
      host.runner.requireRunnerTagged();
      const targetIds = host.state.runner.rig.resources
        .slice()
        .sort()
        .slice(0, utility.max);
      const targetDefinitionIds = targetIds.map(
        (cardId) => definitionFor(host.state, cardId).id,
      );
      for (const cardId of targetIds) {
        if (!host.state.runner.rig.resources.includes(cardId)) continue;
        host.zones.trashRunnerInstalledCardToHeap(cardId);
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "trash_runner_resources_if_tagged",
        trashedResourceCount: targetIds.length,
        trashedResourceDefinitionIds: targetDefinitionIds.join(","),
      };
      return;
    }
    case "installed_hardware_trash_by_counter": {
      host.runner.requireRunnerTagged();
      host.operations.resolveHardwareTrashByCounterOperation(legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "installed_hardware_trash_by_counter",
      };
      return;
    }
    default:
      throw new Error("Diese Korp-Utility-Operation ist nicht spielbar.");
  }
}

export function hasPrintedCostOnPlayCardImplementation(
  definition: CardDefinition,
): boolean {
  return Boolean(
    cardImplementationForDefinitionId(definition.id)?.abilities?.some(
      (ability) => ability.kind === "on_play" && ability.costs === "printed",
    ),
  );
}

export function onPlayCardImplementationAdditionalOperationCost(
  definition: CardDefinition,
): number {
  return onPlayCardImplementationEffects(definition).reduce((sum, effect) => {
    if (effect.kind !== "trace") return sum;
    const perPoint = Math.max(
      0,
      Math.floor(effect.additionalPlayCostPerBaseTracePointAboveZero ?? 0),
    );
    return sum + perPoint * Math.max(0, effect.baseTraceStrength);
  }, 0);
}

export function onPlayCardImplementationNeedsLastTurnResourceTarget(
  definition: CardDefinition,
): boolean {
  return onPlayCardImplementationEffects(definition).some(
    (effect) =>
      effect.kind === "trace" &&
      effect.onSuccess.some(
        (success) => success.kind === "trash_runner_resource_and_add_tag",
      ),
  );
}

export function cardImplementationOperationLegalActions(
  host: CorpOperationResolutionHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
): LegalAction[] {
  const utility = corpUtilityImplementationForDefinition(definition.id);
  if (utility?.kind === "x_future_actions_and_credit_forfeit") {
    const maxX = Math.floor(host.state.corp.credits / utility.costMultiplier);
    const actions: LegalAction[] = [];
    for (let x = 1; x <= maxX; x += 1) {
      actions.push(
        host.actions.buildLegalAction(
          host.state,
          "corp",
          "play_operation",
          `${definition.title}: X=${x}`,
          cardId,
          [{ clicks: 1, credits: x * utility.costMultiplier }],
          {
            cardId,
            xValue: x,
            corpUtilityAbility: "x_future_actions_and_credit_forfeit",
          },
        ),
      );
    }
    return actions;
  }
  if (!hasPrintedCostOnPlayCardImplementation(definition)) return [];
  const additionalCost =
    onPlayCardImplementationAdditionalOperationCost(definition);
  const totalCost = (definition.cost ?? 0) + additionalCost;
  if (host.state.corp.credits < totalCost) return [];
  const freeRezEffect = onPlayCardImplementationEffects(definition).find(
    (effect) => effect.kind === "free_rez_installed_ice_with_counters",
  ) as
    | Extract<CardEffectImplementation, { kind: "free_rez_installed_ice_with_counters" }>
    | undefined;
  if (freeRezEffect) {
    const actions: LegalAction[] = [];
    for (const targetCardId of host.cards.unrezzedInstalledIceIds?.() ?? []) {
      const targetDefinition = definitionFor(host.state, targetCardId);
      const targetRezCost = host.cards.rezCostForCard?.(targetCardId) ?? 0;
      const xUpperBound = Math.max(1, targetRezCost);
      if (freeRezEffect.counterType === "kludge") {
        for (let x = 1; x <= xUpperBound; x += 1) {
          actions.push(
            host.actions.buildLegalAction(
              host.state,
              "corp",
              "play_operation",
              `${definition.title}: ${targetDefinition.title} rezzen (X=${x})`,
              cardId,
              [{ clicks: 1, credits: totalCost }],
              {
                cardId,
                targetCardId,
                targetDefinitionId: targetDefinition.id,
                targetRezCost,
                xValue: x,
                xUpperBound,
              },
            ),
          );
        }
      } else {
        actions.push(
          host.actions.buildLegalAction(
            host.state,
            "corp",
            "play_operation",
            `${definition.title}: ${targetDefinition.title} rezzen`,
            cardId,
            [{ clicks: 1, credits: totalCost }],
            {
              cardId,
              targetCardId,
              targetDefinitionId: targetDefinition.id,
              targetRezCost,
            },
          ),
        );
      }
    }
    return actions;
  }
  const needsResourceTarget =
    onPlayCardImplementationNeedsLastTurnResourceTarget(definition);
  if (!needsResourceTarget && additionalCost === 0) return [];
  if (!needsResourceTarget)
    return [
      host.actions.buildLegalAction(
        host.state,
        "corp",
        "play_operation",
        `${definition.title} spielen`,
        cardId,
        [{ clicks: 1, credits: totalCost }],
        {
          cardId,
          ...(additionalCost > 0 ? { additionalTracePlayCost: additionalCost } : {}),
        },
      ),
    ];
  return host.runner.runnerLastTurnInstalledResourceIds().map((targetCardId) => {
    return host.actions.buildLegalAction(
      host.state,
      "corp",
      "play_operation",
      `${definition.title} spielen`,
      cardId,
      [{ clicks: 1, credits: totalCost }],
      {
        cardId,
        ...runnerLastTurnResourceTargetPayload(host, targetCardId),
        ...(additionalCost > 0 ? { additionalTracePlayCost: additionalCost } : {}),
      },
    );
  });
}

function cardImplementationCorpOperationResolver(
  host: CorpOperationResolutionHost,
  definition: CardDefinition,
): CorpOperationResolver | undefined {
  const hiddenLongtail = cardImplementationForDefinitionId(definition.id)
    ?.hiddenReplacementLongtail;
  if (hiddenLongtail?.kind === "conceal_and_reorder_installed_ice") {
    return {
      name: "card_implementation_corp_operation_conceal_and_reorder_installed_ice",
      resolve: (_host, legalAction) => {
        host.hiddenZone.resolveConcealAndReorderInstalledIce(legalAction);
      },
    };
  }
  return undefined;
}

export function onPlayCardImplementationEffects(
  definition: CardDefinition,
): readonly CardEffectImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.abilities?.find(
      (ability) => ability.kind === "on_play" && ability.costs === "printed",
    )?.effects ?? []
  );
}

function onPlayCardImplementationChoicesAreAvailable(
  host: CorpOperationResolutionHost,
  definition: CardDefinition,
): boolean {
  for (const effect of onPlayCardImplementationEffects(definition)) {
    if (
      effect.kind === "distribute_advancement_counters" &&
      host.board.advancementDistributionOptions(
        effect.amount,
        effect.distribution,
      ).length === 0
    )
      return false;
    if (
      effect.kind === "move_advancement_counters" &&
      host.board.moveAdvancementOptions(
        "" as CardInstanceId,
        effect.source,
        effect.maxAmount,
      ).length === 0
    )
      return false;
  }
  return true;
}

function runnerLastTurnResourceTargetPayload(
  host: CorpOperationResolutionHost,
  targetCardId: CardInstanceId,
): Record<string, string | number | boolean> {
  if (host.runner.isConcealedRunnerResource(targetCardId)) {
    const hiddenResourceSlotId = host.runner.hiddenRunnerResourceSlotId(targetCardId);
    return {
      traceSuccessTargetCardId: hiddenResourceSlotId,
      traceSuccessTargetResourceSlotId: hiddenResourceSlotId,
      hiddenResourceSlotId,
      hiddenRunnerResource: true,
      redactedKind: "hidden_runner_resource",
    };
  }
  return {
    traceSuccessTargetCardId: targetCardId,
    traceSuccessTargetDefinitionId: definitionFor(host.state, targetCardId).id,
  };
}

function sourceCardIdFromAction(legalAction: LegalAction): CardInstanceId {
  return String(legalAction.payload?.cardId ?? "") as CardInstanceId;
}

function corpAgendaCounterOperationTarget(
  host: CorpOperationResolutionHost,
): CardInstanceId | undefined {
  return host.board.installedAgendaOperationTarget();
}
