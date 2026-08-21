import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CorpDrawContinuation,
  DamageType,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { CARD_VIRUS_COUNTER_TYPES } from "@netgrid/shared";
import type {
  CardCorpUtilityImplementation,
  CardEffectImplementation,
} from "../../ability-engine/definition-types";
import {
  isPrintedCostOnPlayAbility,
  onPlayCardImplementationClickCost,
} from "../../ability-engine/card-implementation-runtime-shared";
import { scoreConversionCapabilityPayloadForEffects } from "../../ability-engine/card-implementation-runtime-activated-targets";
import { actionCapacityLegalActionPayloadForEffects } from "../../ability-engine/card-implementation-action-capacity";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  fixedPlayCostCredits,
  minimumPlayCostCredits,
  playCostForDefinition,
} from "../payment/play-cost";
import { definitionFor } from "../state/card-server-lookup";
import { cardCounter } from "../state/turn-flags-counters";
import {
  RESTRICTED_ACTION_GRANT_KEYS,
  setRestrictedActionGrant,
} from "../state/restricted-action-grants";

type CorpOperationResolver = {
  name: string;
  canPlay?: (host: CorpOperationResolutionHost) => boolean;
  resolve: (
    host: CorpOperationResolutionHost,
    legalAction: LegalAction,
  ) => void;
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
    drawCorpCards: (
      amount: number,
      continuation?: CorpDrawContinuation,
    ) => void;
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
    startCorpHqCardToRdChoice: (
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
      minimumAmount?: 0 | 1,
    ) => unknown[];
    resolveAgendaCounterOperation: (
      legalAction: LegalAction,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    resolveCorpOperationAddAdvancementCounters: (
      legalAction: LegalAction,
    ) => void;
    resolveAdvancementPlacementOperation: (legalAction: LegalAction) => void;
  };
  operations: {
    hardwareTrashByCounterEligibleHardwareIds: () => CardInstanceId[];
    resolveHardwareTrashByCounterOperation: (legalAction: LegalAction) => void;
    resolveTaggedRunnerResourceMultiTrashOperation: (
      legalAction: LegalAction,
      minimumTargets: number,
      maximumTargets: number,
      selectionOrdering: "ordered" | "unordered",
    ) => void;
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

const CORP_OPERATION_RESOLVERS: Record<string, CorpOperationResolver> = {};

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
      host.state.corp.clicks >=
        onPlayCardImplementationClickCostForDefinition(definition) &&
      host.state.corp.credits >=
        minimumPlayCostCredits(definition) +
          onPlayCardImplementationAdditionalOperationCost(definition) &&
      host.cardImplementation.canPlayPrintedCostOnPlay(definition) &&
      onPlayCardImplementationChoicesAreAvailable(host, definition)
    );
  const utility = corpUtilityImplementationForDefinition(definition.id);
  if (utility)
    return (
      host.state.corp.clicks >= corpUtilityPlayClickCost(utility) &&
      canPlayCorpUtilityOperation(host, definition, utility)
    );
  const implementationResolver = cardImplementationCorpOperationResolver(
    host,
    definition,
  );
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
  const implementationResolver = cardImplementationCorpOperationResolver(
    host,
    definition,
  );
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
      return (
        host.state.corp.hq.some((cardId) =>
          host.cards.isCorpInstallableCardType(
            definitionFor(host.state, cardId),
          ),
        ) || hasVirusCountersToPurge(host.state)
      );
    case "x_future_actions_and_credit_forfeit":
      return host.state.corp.credits >= utility.costMultiplier;
    case "corp_archives_to_hq":
      return host.state.corp.archives.some((cardId) => {
        const sourceCardId = host.state.corp.hq.find(
          (candidate) =>
            definitionFor(host.state, candidate).id === _definition.id,
        );
        if (cardId === sourceCardId) return false;
        if (utility.filter?.cardType === "ice")
          return definitionFor(host.state, cardId).type === "ice";
        return true;
      });
    case "draw_corp_cards_then_shuffle_hq_card_into_rd":
      return (
        host.state.corp.rd.length > 0 ||
        host.state.corp.hq.some(
          (cardId) => definitionFor(host.state, cardId).id !== _definition.id,
        )
      );
    case "corp_rd_top_reorder":
      return true;
    case "encounter_tag":
      return host.corp.runnerStoleAgendaLastTurn();
    case "gain_credits_from_stolen_agenda_advancement_history":
      return host.corp.runnerStoleAgendaLastTurn();
    case "trash_runner_resources_if_tagged":
      return host.state.runner.tags > 0;
    case "installed_hardware_trash_by_counter": {
      const playCost = playCostForDefinition(_definition);
      if (playCost.kind !== "variable_x") return false;
      return (
        host.state.runner.tags > 0 &&
        (playCost.minimumX === 0 ||
          (host.state.corp.credits >= playCost.creditsPerX &&
            host.operations.hardwareTrashByCounterEligibleHardwareIds().length >
              0))
      );
    }
    case "runner_memory_limit_modifier_until_end_of_turn":
      return host.state.runner.tags > 0;
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
          conversions: [
            {
              actionType: "purge_virus_counters",
              requiredActions: utility.amount,
            },
          ],
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
    case "runner_memory_limit_modifier_until_end_of_turn": {
      if (!canPlayCorpUtilityOperation(host, definition, utility)) {
        throw new Error("Badtimes braucht einen getaggten Runner.");
      }
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (!sourceCardId) throw new Error("Badtimes braucht eine Quellenkarte.");
      const amount = Math.max(0, Math.floor(utility.amount));
      if (amount <= 0) throw new Error("Badtimes-MU-Reduktion ist ungueltig.");
      host.state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn = [
        ...(host.state.temporaryRunnerMemoryLimitModifiersUntilEndOfTurn ?? []),
        {
          sourceCardInstanceId: sourceCardId,
          sourceDefinitionId: definition.id,
          amount,
          turnSerial: Math.max(0, Math.floor(host.state.turnSerial ?? 0)),
          expires: "turn_end",
        },
      ];
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        classicCorpUtilityAbility:
          "runner_memory_limit_modifier_until_end_of_turn",
        temporaryRunnerMemoryLimitReduction: amount,
      };
      return;
    }
    case "corp_archives_to_hq": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (
        !sourceCardId ||
        definitionFor(host.state, sourceCardId).id !== definition.id
      )
        throw new Error("Off-Site Backups fehlt als Quelle.");
      host.hiddenZone.startCorpArchivesToHqChoice(legalAction, sourceCardId);
      return;
    }
    case "draw_corp_cards_then_shuffle_hq_card_into_rd": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (
        !sourceCardId ||
        definitionFor(host.state, sourceCardId).id !== definition.id
      )
        throw new Error("Corporate Shuffle fehlt als Quelle.");
      const rdBefore = host.state.corp.rd.length;
      host.corp.drawCorpCards(utility.drawCount, {
        kind: "corporate_shuffle_hq_to_rd",
        sourceCardId,
        sourceDefinitionId: definition.id,
      });
      const drawnCards = Math.min(utility.drawCount, rdBefore);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "classic_corporate_shuffle_draw_then_hq_to_rd",
        drawnCards,
        corpHqAfterDraw:
          host.state.corp.hq.length +
          (host.state.pendingCorpDraw ? drawnCards : 0),
      };
      if (host.state.phase !== "game_over" && !host.state.pendingCorpDraw)
        host.hiddenZone.startCorpHqCardToRdChoice(legalAction, sourceCardId);
      return;
    }
    case "corp_rd_top_reorder": {
      const sourceCardId = sourceCardIdFromAction(legalAction);
      if (
        !sourceCardId ||
        definitionFor(host.state, sourceCardId).id !== definition.id
      )
        throw new Error("Planning Consultants fehlt als Quelle.");
      host.hiddenZone.startCorpRdTopReorderChoice(legalAction, sourceCardId);
      return;
    }
    case "encounter_tag": {
      if (!host.corp.runnerStoleAgendaLastTurn())
        throw new Error("Runner hat im letzten Zug keine Agenda gestohlen.");
      host.damage.addRunnerTagsWithPrevention(
        legalAction,
        1,
        "corp_operation_encounter_tag",
      );
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
        v1951CorpUtilityAbility:
          "gain_credits_from_stolen_agenda_advancement_history",
        stolenAgendaAdvancementCountersLastTurn: advancementCounters,
        gainedCredits,
        corpCreditsAfter: host.state.corp.credits,
      };
      return;
    }
    case "trash_runner_resources_if_tagged": {
      host.runner.requireRunnerTagged();
      host.operations.resolveTaggedRunnerResourceMultiTrashOperation(
        legalAction,
        utility.min,
        utility.max,
        utility.selectionOrdering,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1951CorpUtilityAbility: "trash_runner_resources_if_tagged",
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

function hasVirusCountersToPurge(state: GameState): boolean {
  if (
    Object.keys(state.cardInstances).some((cardId) =>
      CARD_VIRUS_COUNTER_TYPES.some(
        (counterType) =>
          cardCounter(state, cardId as CardInstanceId, counterType) > 0,
      ),
    )
  )
    return true;
  return [
    ...Object.values(state.poxCountersByServer ?? {}),
    ...Object.values(state.serverAgendaCostCountersByServer ?? {}),
  ].some((amount) => Math.max(0, Math.floor(Number(amount ?? 0))) > 0);
}

export function hasPrintedCostOnPlayCardImplementation(
  definition: CardDefinition,
): boolean {
  return Boolean(
    cardImplementationForDefinitionId(definition.id)?.abilities?.some(
      isPrintedCostOnPlayAbility,
    ),
  );
}

export function onPlayCardImplementationClickCostForDefinition(
  definition: CardDefinition,
): number {
  const ability = cardImplementationForDefinitionId(
    definition.id,
  )?.abilities?.find(isPrintedCostOnPlayAbility);
  return ability ? onPlayCardImplementationClickCost(ability) : 1;
}

export function corpUtilityPlayClickCost(
  utility: CardCorpUtilityImplementation | undefined,
): number {
  return utility?.playCost?.kind === "printed"
    ? 1 + utility.playCost.additionalClicks
    : 1;
}

export function onPlayCardImplementationAdditionalOperationCost(
  definition: CardDefinition,
): number {
  return onPlayCardImplementationEffects(definition).reduce((sum, effect) => {
    if (effect.kind !== "trace") return sum;
    const perPoint = Math.max(
      0,
      Math.floor(effect.additionalPlayCostPerTraceLimitPointAboveZero ?? 0),
    );
    return sum + perPoint * Math.max(0, effect.traceLimit);
  }, 0);
}

export function onPlayCardImplementationVariableOperationCreditCostForAction(
  definition: CardDefinition,
  legalAction: LegalAction,
): number | undefined {
  const freeRezEffect = onPlayCardImplementationEffects(definition).find(
    (effect) => effect.kind === "free_rez_installed_ice_with_counters",
  );
  if (
    freeRezEffect?.kind === "free_rez_installed_ice_with_counters" &&
    freeRezEffect.counterType === "kludge"
  ) {
    const xValue = Number(legalAction.payload?.xValue);
    const xMinimum = Number(legalAction.payload?.xMinimum);
    const xMaximum = Number(legalAction.payload?.xMaximum);
    const xUpperBound = Number(legalAction.payload?.xUpperBound);
    const xCreditsPerUnit = Number(legalAction.payload?.xCreditsPerUnit);
    const variableCostKind = String(
      legalAction.payload?.variableCostKind ?? "",
    );
    if (
      !Number.isInteger(xValue) ||
      xValue < 1 ||
      xMinimum !== 1 ||
      !Number.isInteger(xMaximum) ||
      xMaximum < xValue ||
      xMaximum !== xUpperBound ||
      xCreditsPerUnit !== 1 ||
      variableCostKind !== "printed_play_cost"
    )
      throw new Error("Die variablen Operation-X-Kosten sind nicht gueltig.");
    return xValue;
  }
  return undefined;
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
            actionCapacityTiming: "future_turn_start",
            actionCapacityRestriction: "unrestricted",
            actionCapacityReliability: "guaranteed",
            actionCapacityExpiresAt: "duration_end",
            actionCapacityGainAmountPerTurn: 1,
            actionCapacityDurationTurns: x,
          },
        ),
      );
    }
    return actions;
  }
  const utilityClickCost = corpUtilityPlayClickCost(utility);
  if (utility && utilityClickCost > 1) {
    const totalCost = fixedPlayCostCredits(definition);
    if (
      host.state.corp.clicks < utilityClickCost ||
      host.state.corp.credits < totalCost ||
      !canPlayCorpUtilityOperation(host, definition, utility)
    )
      return [];
    return [
      host.actions.buildLegalAction(
        host.state,
        "corp",
        "play_operation",
        `${definition.title} spielen`,
        cardId,
        [{ clicks: utilityClickCost, credits: totalCost }],
        { cardId },
      ),
    ];
  }
  if (!hasPrintedCostOnPlayCardImplementation(definition)) return [];
  const clickCost = onPlayCardImplementationClickCostForDefinition(definition);
  if (host.state.corp.clicks < clickCost) return [];
  const additionalCost =
    onPlayCardImplementationAdditionalOperationCost(definition);
  const freeRezEffect = onPlayCardImplementationEffects(definition).find(
    (effect) => effect.kind === "free_rez_installed_ice_with_counters",
  ) as
    | Extract<
        CardEffectImplementation,
        { kind: "free_rez_installed_ice_with_counters" }
      >
    | undefined;
  const isVariableKludgeRez =
    freeRezEffect?.kind === "free_rez_installed_ice_with_counters" &&
    freeRezEffect.counterType === "kludge";
  const totalCost = isVariableKludgeRez
    ? undefined
    : fixedPlayCostCredits(definition) + additionalCost;
  if (
    !isVariableKludgeRez &&
    totalCost !== undefined &&
    host.state.corp.credits < totalCost
  ) {
    return [];
  }
  if (freeRezEffect) {
    const actions: LegalAction[] = [];
    for (const targetCardId of host.cards.unrezzedInstalledIceIds?.() ?? []) {
      const targetDefinition = definitionFor(host.state, targetCardId);
      const targetRezCost = host.cards.rezCostForCard?.(targetCardId) ?? 0;
      if (freeRezEffect.counterType === "kludge") {
        const xUpperBound =
          freeRezEffect.amount.kind === "bounded_x_by_rez_cost_min_one"
            ? Math.min(
                Math.max(1, targetRezCost),
                Math.max(0, Math.floor(host.state.corp.credits)),
              )
            : Math.max(0, Math.floor(host.state.corp.credits));
        for (let x = 1; x <= xUpperBound; x += 1) {
          actions.push(
            host.actions.buildLegalAction(
              host.state,
              "corp",
              "play_operation",
              `${definition.title}: ${targetDefinition.title} rezzen (X=${x})`,
              cardId,
              [{ clicks: clickCost, credits: x }],
              {
                cardId,
                targetCardId,
                targetDefinitionId: targetDefinition.id,
                targetRezCost,
                xValue: x,
                xMinimum: 1,
                xMaximum: xUpperBound,
                xUpperBound,
                xCreditsPerUnit: 1,
                variableCostKind: "printed_play_cost",
              },
            ),
          );
        }
      } else {
        if (totalCost === undefined)
          throw new Error(
            `${definition.id}: Feste Operation-Kosten fehlen fuer die LegalAction-Projektion.`,
          );
        actions.push(
          host.actions.buildLegalAction(
            host.state,
            "corp",
            "play_operation",
            `${definition.title}: ${targetDefinition.title} rezzen`,
            cardId,
            [{ clicks: clickCost, credits: totalCost }],
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
  if (totalCost === undefined)
    throw new Error(
      `${definition.id}: Feste Operation-Kosten fehlen fuer die LegalAction-Projektion.`,
    );
  const needsResourceTarget =
    onPlayCardImplementationNeedsLastTurnResourceTarget(definition);
  const advancementDistribution = onPlayCardImplementationEffects(
    definition,
  ).find((effect) => effect.kind === "distribute_advancement_counters");
  const advancementMove = onPlayCardImplementationEffects(definition).find(
    (effect) => effect.kind === "move_advancement_counters",
  );
  const scoreConversionPayload = scoreConversionCapabilityPayloadForEffects(
    onPlayCardImplementationEffects(definition),
  );
  const actionCapacityPayload = actionCapacityLegalActionPayloadForEffects(
    onPlayCardImplementationEffects(definition),
    "corp",
  );
  const advancementPayload = advancementDistribution
    ? {
        cardImplementationEffectKind: "distribute_advancement_counters",
        advancementCounterAmount: advancementDistribution.amount,
        advancementCounterChoiceMode: advancementDistribution.distribution,
      }
    : {};
  const advancementMovePayload =
    advancementMove?.kind === "move_advancement_counters"
      ? {
          cardImplementationEffectKind: "move_advancement_counters",
          advancementCounterMoveMaximum: advancementMove.maxAmount,
          advancementCounterMoveSource: advancementMove.source,
          advancementCounterMoveTarget: advancementMove.target,
        }
      : {};
  if (
    !needsResourceTarget &&
    additionalCost === 0 &&
    Object.keys(scoreConversionPayload).length === 0
  )
    return [];
  if (!needsResourceTarget)
    return [
      host.actions.buildLegalAction(
        host.state,
        "corp",
        "play_operation",
        `${definition.title} spielen`,
        cardId,
        [{ clicks: clickCost, credits: totalCost }],
        {
          cardId,
          ...advancementPayload,
          ...advancementMovePayload,
          ...scoreConversionPayload,
          ...actionCapacityPayload,
          ...(additionalCost > 0
            ? { additionalTracePlayCost: additionalCost }
            : {}),
        },
      ),
    ];
  return host.runner
    .runnerLastTurnInstalledResourceIds()
    .map((targetCardId) => {
      return host.actions.buildLegalAction(
        host.state,
        "corp",
        "play_operation",
        `${definition.title} spielen`,
        cardId,
        [{ clicks: clickCost, credits: totalCost }],
        {
          cardId,
          ...runnerLastTurnResourceTargetPayload(host, targetCardId),
          ...(additionalCost > 0
            ? { additionalTracePlayCost: additionalCost }
            : {}),
        },
      );
    });
}

function cardImplementationCorpOperationResolver(
  host: CorpOperationResolutionHost,
  definition: CardDefinition,
): CorpOperationResolver | undefined {
  const hiddenLongtail = cardImplementationForDefinitionId(
    definition.id,
  )?.hiddenReplacementLongtail;
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
      isPrintedCostOnPlayAbility,
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
        effect.minimumAmount ?? 1,
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
    const hiddenResourceSlotId =
      host.runner.hiddenRunnerResourceSlotId(targetCardId);
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
