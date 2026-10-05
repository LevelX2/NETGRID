import type {
  GameState,
  PurgeableRunnerVirusCounterType,
} from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";
import { purgeableRunnerVirusCounterAmount } from "./turn-basic-execution";

/** Shared rule authority for actual Corp start draws and current planning facts. */
export function virusCounterDrawsAtCorpStart(state: GameState): number {
  return CARD_IMPLEMENTATIONS.reduce((sum, implementation) => {
    const virusCounter = implementation.virusCounter;
    const start = virusCounter?.startOfCorpTurn;
    if (
      !virusCounter ||
      start?.kind !== "draw_extra_cards_per_counter" ||
      virusCounter.addOnSuccessfulRun?.counterScope.kind !== "shared_corp_pool"
    )
      return sum;
    return (
      sum +
      purgeableRunnerVirusCounterAmount(
        state.purgeableRunnerVirusCounters?.corp,
        virusCounter.counterKind as PurgeableRunnerVirusCounterType,
      ) *
        start.amountPerCounter
    );
  }, 0);
}
