import type { CardDefinitionId, PlayerView, ServerId } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { socketCounterTypeForServer } from "../run/run-end-counter-triggers";

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

/** Public rule payoff only: it certifies neither a future successful run nor
 * absence of counter prevention, access effects or an intervening purge. */
export function quoteLastCentralCounterConversion(
  definitionId: CardDefinitionId,
  servers: PlayerView["servers"],
  successfulRunServerId: Exclude<ServerId, "new_remote">,
): CentralCounterConversionQuote {
  const implementation = cardImplementationForDefinitionId(definitionId);
  const virus = implementation?.virusCounter;
  const trigger = virus?.addOnSuccessfulRun;
  const start = virus?.startOfCorpTurn;
  const addedCounter = socketCounterTypeForServer(successfulRunServerId);
  if (
    !implementation ||
    !virus ||
    !trigger ||
    !addedCounter ||
    trigger.counterScope.kind !== "attacked_central_server_pool" ||
    trigger.server !== "central" ||
    !Number.isSafeInteger(trigger.amount) ||
    trigger.amount <= 0 ||
    start?.kind !== "forgo_actions_per_counter" ||
    start.counterSource !== "corp_purgeable_runner_virus_counter"
  )
    return { complete: false, reason: "no_matching_counter_conversion" };
  for (const ability of implementation.abilities ?? []) {
    if (
      ability.kind !== "activated" ||
      ability.timing !== "runner_paid" ||
      ability.condition !== undefined ||
      ability.costs.length === 0 ||
      ability.effects.length !== 1
    )
      continue;
    const effect = ability.effects[0]!;
    if (
      effect.kind !== "add_corp_purgeable_runner_virus_counter" ||
      effect.counterType !== virus.counterKind ||
      !Number.isSafeInteger(effect.amount) ||
      effect.amount <= 0
    )
      continue;
    let missing = 0,
      valid = true;
    for (const cost of ability.costs) {
      if (
        cost.kind !== "corp_purgeable_runner_virus_counter" ||
        !cost.server ||
        !Number.isSafeInteger(cost.amount) ||
        cost.amount <= 0
      ) {
        valid = false;
        break;
      }
      const server = servers.find((s) => s.id === cost.server);
      if (!server) {
        valid = false;
        break;
      }
      const displays = (server.counterDisplays ?? []).filter(
        (c) => c.counterType === cost.counterType,
      );
      if (
        displays.length > 1 ||
        displays.some((c) => !Number.isSafeInteger(c.amount) || c.amount < 0)
      )
        return { complete: false, reason: "invalid_public_counter" };
      const amount = displays.length === 0 ? 0 : displays[0]!.amount;
      if (amount >= cost.amount) continue;
      if (
        cost.server !== successfulRunServerId ||
        cost.counterType !== addedCounter ||
        amount + trigger.amount < cost.amount
      ) {
        valid = false;
        break;
      }
      missing += 1;
    }
    const denied = effect.amount * start.amountPerCounter;
    if (valid && missing === 1 && Number.isSafeInteger(denied) && denied > 0)
      return {
        complete: true,
        definitionId,
        missingServerId: successfulRunServerId,
        counterType: effect.counterType,
        nextCorpTurnActionsDenied: denied,
      };
  }
  return { complete: false, reason: "no_matching_counter_conversion" };
}
