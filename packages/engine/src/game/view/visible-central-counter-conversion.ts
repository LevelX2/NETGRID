import type { CardAbilityCostImplementation } from "@netgrid/cards/engine";
import type { CardDefinitionId, PlayerView, ServerId } from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";
import type { CardImplementationDefinition } from "../../card-implementations/types";
import { socketCounterTypeForServer } from "../run/run-end-counter-triggers";

type CentralCounterCost = Extract<
  CardAbilityCostImplementation,
  { kind: "corp_purgeable_runner_virus_counter" }
>;

type CentralCounterConversion = {
  definitionId: CardDefinitionId;
  costs: readonly CentralCounterCost[];
  requiredRunAmount: number;
  outputCounterType: string;
  nextCorpTurnActionsDenied: number;
};

export type CentralCounterConversionQuote =
  | {
      complete: false;
      reason: "no_matching_counter_conversion" | "invalid_public_counter";
    }
  | {
      complete: true;
      definitionId: string;
      missingServerId: string;
      counterType: string;
      nextCorpTurnActionsDenied: number;
    };

function centralCounterConversionsFor(
  implementation: CardImplementationDefinition,
): CentralCounterConversion[] {
  const virus = implementation.virusCounter;
  const trigger = virus?.addOnSuccessfulRun;
  const start = virus?.startOfCorpTurn;
  if (
    !virus ||
    !trigger ||
    trigger.counterScope.kind !== "attacked_central_server_pool" ||
    trigger.server !== "central" ||
    !Number.isSafeInteger(trigger.amount) ||
    trigger.amount <= 0 ||
    start?.kind !== "forgo_actions_per_counter" ||
    start.counterSource !== "corp_purgeable_runner_virus_counter"
  )
    return [];
  return (implementation.abilities ?? []).flatMap((ability) => {
    if (
      ability.kind !== "activated" ||
      ability.timing !== "runner_paid" ||
      ability.condition !== undefined ||
      ability.costs.length === 0 ||
      ability.effects.length !== 1
    )
      return [];
    const effect = ability.effects[0]!;
    if (
      effect.kind !== "add_corp_purgeable_runner_virus_counter" ||
      effect.counterType !== virus.counterKind ||
      !Number.isSafeInteger(effect.amount) ||
      effect.amount <= 0
    )
      return [];
    const costs = ability.costs.filter(
      (cost): cost is CentralCounterCost =>
        cost.kind === "corp_purgeable_runner_virus_counter" &&
        socketCounterTypeForServer(cost.server) === cost.counterType &&
        Number.isSafeInteger(cost.amount) &&
        cost.amount > 0,
    );
    const denied = effect.amount * start.amountPerCounter;
    if (
      costs.length !== ability.costs.length ||
      new Set(costs.map((cost) => cost.server)).size !== costs.length ||
      !Number.isSafeInteger(denied) ||
      denied <= 0
    )
      return [];
    return [
      {
        definitionId: implementation.cardDefinitionId,
        costs,
        requiredRunAmount: trigger.amount,
        outputCounterType: effect.counterType,
        nextCorpTurnActionsDenied: denied,
      },
    ];
  });
}

const centralCounterConversions = CARD_IMPLEMENTATIONS.flatMap(
  centralCounterConversionsFor,
);

function publicCounterAmount(
  servers: PlayerView["servers"],
  cost: CentralCounterCost,
): number | "missing_server" | "invalid_public_counter" {
  const server = servers.find(({ id }) => id === cost.server);
  if (!server) return "missing_server";
  const displays = (server.counterDisplays ?? []).filter(
    ({ counterType }) => counterType === cost.counterType,
  );
  if (
    displays.length > 1 ||
    displays.some(({ amount }) => !Number.isSafeInteger(amount) || amount < 0)
  )
    return "invalid_public_counter";
  return displays[0]?.amount ?? 0;
}

/** Public amount currently usable in complete payments for a central conversion. */
export function quoteConvertibleCentralCounterAmount(
  counterType: string | undefined,
  serverId: string | undefined,
  servers: PlayerView["servers"],
  visibleRunnerRig: PlayerView["opponent"]["rig"],
): number | undefined {
  const conversions = centralCounterConversions.flatMap((conversion) => {
    const cost = conversion.costs.find(
      (cost) => cost.counterType === counterType,
    );
    return cost ? [{ conversion, cost }] : [];
  });
  if (conversions.length === 0) return undefined;
  const matchingServer = conversions.filter(
    ({ cost }) => cost.server === serverId,
  );
  if (matchingServer.length === 0)
    throw new Error(
      `central_counter_conversion_wrong_public_server:${counterType}:${serverId}`,
    );

  return Math.max(
    ...matchingServer.map(({ conversion, cost }) => {
      if (
        !visibleRunnerRig?.some(
          (card) => card.known && card.definitionId === conversion.definitionId,
        )
      )
        return 0;
      const payableSets = conversion.costs.map((component) => {
        const amount = publicCounterAmount(servers, component);
        if (typeof amount !== "number")
          throw new Error(
            `central_counter_conversion_public_pool_unavailable:${counterType}:${component.server}:${amount}`,
          );
        return Math.floor(amount / component.amount);
      });
      return Math.min(...payableSets) * cost.amount;
    }),
  );
}

/** Public rule payoff only: it certifies neither a future successful run nor
 * absence of counter prevention, access effects or an intervening purge. */
export function quoteLastCentralCounterConversion(
  definitionId: CardDefinitionId,
  servers: PlayerView["servers"],
  successfulRunServerId: Exclude<ServerId, "new_remote">,
): CentralCounterConversionQuote {
  const addedCounter = socketCounterTypeForServer(successfulRunServerId);
  for (const conversion of centralCounterConversions) {
    if (conversion.definitionId !== definitionId || !addedCounter) continue;
    let missing = 0;
    let valid = true;
    for (const cost of conversion.costs) {
      const amount = publicCounterAmount(servers, cost);
      if (amount === "invalid_public_counter")
        return { complete: false, reason: amount };
      if (amount === "missing_server") {
        valid = false;
        break;
      }
      if (amount >= cost.amount) continue;
      if (
        cost.server !== successfulRunServerId ||
        cost.counterType !== addedCounter ||
        amount + conversion.requiredRunAmount < cost.amount
      ) {
        valid = false;
        break;
      }
      missing += 1;
    }
    if (valid && missing === 1)
      return {
        complete: true,
        definitionId,
        missingServerId: successfulRunServerId,
        counterType: conversion.outputCounterType,
        nextCorpTurnActionsDenied: conversion.nextCorpTurnActionsDenied,
      };
  }
  return { complete: false, reason: "no_matching_counter_conversion" };
}
