import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
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
  SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID,
  TEAM_RESTRUCTURING_COUNTER_OPERATION_ID,
} from "../../mechanics/agenda-operation-effects";
import {
  CORP_ARCHIVES_TO_HQ_OPERATION_CARD_ID,
  CORP_RD_TOP5_REORDER_OPERATION_CARD_ID,
} from "../../mechanics/hidden-zone";
import { EDGERUNNER_TEMPS_INSTALL_OPERATION_ID } from "../../mechanics/longtail-card-effects";

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
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    isCorpInstallableCardType: (definition: CardDefinition) => boolean;
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
    resolveNewBloodConcealAndReorder: (legalAction: LegalAction) => void;
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
    resolveSystematicLayoffsAdvancementOperation: (
      legalAction: LegalAction,
    ) => void;
  };
  operations: {
    powerGridOverloadEligibleHardwareIds: () => CardInstanceId[];
    resolvePowerGridOverloadOperation: (legalAction: LegalAction) => void;
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
        host.cards.definitionFor(sourceCardId).id !==
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
        host.cards.definitionFor(sourceCardId).id !==
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
        host.cards.isCorpInstallableCardType(host.cards.definitionFor(cardId)),
      ),
    resolve: (host, legalAction) => {
      if (
        !host.state.corp.hq.some((cardId) =>
          host.cards.isCorpInstallableCardType(host.cards.definitionFor(cardId)),
        )
      ) {
        throw new Error(
          "Edgerunner, Inc., Temps findet keine installierbare Korp-Karte.",
        );
      }
      const flags = host.corp.ensureTurnFlags();
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
      host.cards.mustInstance(targetAgendaId).advancementCounters += 1;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919OperationAbility: "advance_installed_agenda",
        targetCardId: targetAgendaId,
        targetCardDefinitionId: host.cards.definitionFor(targetAgendaId).id,
        addedAdvancementCounters: 1,
        advancementCountersAfter:
          host.cards.mustInstance(targetAgendaId).advancementCounters,
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
  [SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID]: {
    name: "onr_v1919_corp_operation_add_two_advancement_counters",
    canPlay: (host) => host.board.advanceableInstalledCardTargets().length > 0,
    resolve: (host, legalAction) =>
      host.board.resolveSystematicLayoffsAdvancementOperation(legalAction),
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
        host.cards.isCorpInstallableCardType(host.cards.definitionFor(cardId)),
      );
    case "corp_archives_to_hq":
      return host.state.corp.archives.some((cardId) => {
        const sourceCardId = host.state.corp.hq.find(
          (candidate) => host.cards.definitionFor(candidate).id === _definition.id,
        );
        return cardId !== sourceCardId;
      });
    case "corp_rd_top_reorder":
      return host.state.corp.rd.length >= 2;
    case "trojan_horse_tag":
      return host.corp.runnerStoleAgendaLastTurn();
    case "silver_lining_recovery":
      return host.corp.runnerStoleAgendaLastTurn();
    case "trash_runner_resources_if_tagged":
      return host.state.runner.tags > 0;
    case "power_grid_overload":
      return (
        host.state.runner.tags > 0 &&
        host.state.corp.credits > 0 &&
        host.operations.powerGridOverloadEligibleHardwareIds().length > 0
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
    case "corp_archives_to_hq": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (!sourceCardId || host.cards.definitionFor(sourceCardId).id !== definition.id)
        throw new Error("Off-Site Backups fehlt als Quelle.");
      host.hiddenZone.startCorpArchivesToHqChoice(legalAction, sourceCardId);
      return;
    }
    case "corp_rd_top_reorder": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (!sourceCardId || host.cards.definitionFor(sourceCardId).id !== definition.id)
        throw new Error("Planning Consultants fehlt als Quelle.");
      host.hiddenZone.startCorpRdTopReorderChoice(legalAction, sourceCardId);
      return;
    }
    case "trojan_horse_tag": {
      if (!host.corp.runnerStoleAgendaLastTurn())
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      host.damage.addRunnerTagsWithPrevention(legalAction, 1, "trojan_horse");
      return;
    }
    case "silver_lining_recovery": {
      if (!host.corp.runnerStoleAgendaLastTurn())
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      const advancementCounters =
        host.corp.runnerStolenAgendaAdvancementCountersLastTurn();
      const gainedCredits =
        advancementCounters * utility.multiplierPerAdvancementCounter;
      host.economy.gainCorpCredits(gainedCredits);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "silver_lining_recovery",
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
        (cardId) => host.cards.definitionFor(cardId).id,
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
    case "power_grid_overload": {
      host.runner.requireRunnerTagged();
      host.operations.resolvePowerGridOverloadOperation(legalAction);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "power_grid_overload",
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
  if (!hasPrintedCostOnPlayCardImplementation(definition)) return [];
  const additionalCost =
    onPlayCardImplementationAdditionalOperationCost(definition);
  const totalCost = (definition.cost ?? 0) + additionalCost;
  if (host.state.corp.credits < totalCost) return [];
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
  if (hiddenLongtail?.kind === "new_blood_conceal_reorder_installed_ice") {
    return {
      name: "card_implementation_corp_operation_new_blood_conceal_reorder_installed_ice",
      resolve: (_host, legalAction) => {
        host.hiddenZone.resolveNewBloodConcealAndReorder(legalAction);
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
    traceSuccessTargetDefinitionId: host.cards.definitionFor(targetCardId).id,
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
