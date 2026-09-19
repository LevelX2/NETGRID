import type { GameState, PlayerView } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

/** Uses only the public run effect, installed hardware and public usage flags. */
export function publicRunFollowupOpportunity(
  state: GameState,
): NonNullable<PlayerView["run"]>["followupRunOpportunity"] {
  if (!state.run) return undefined;
  if (state.run.grantBonusRunOnFinish || state.runnerTurnFlags?.bonusRunPending)
    return "after_run";
  if (
    state.runnerTurnFlags?.successfulRunExtraRunUsedThisTurn ||
    state.runnerTurnFlags?.successfulRunExtraRunPending
  )
    return undefined;
  const source = state.runner.rig.hardware.some((id) => {
    const card = state.cardInstances[id];
    return (
      card &&
      cardImplementationForDefinitionId(
        card.definitionId,
      )?.successfulRunFollowups?.some(
        (followup) =>
          followup.kind === "optional_make_run_after_successful_run",
      )
    );
  });
  return source ? "after_successful_run" : undefined;
}

/** Public event sequences advance even when their current run is stopped. */
export function publicPendingSequenceRunCount(state: GameState): number {
  const sequences = new Map(
    (state.runnerTurnFlags?.pendingSequences ?? []).map((sequence) => [
      sequence.sourceCardId,
      sequence.pendingServerIds.length,
    ]),
  );
  const active = state.run?.activeSequence;
  if (active)
    sequences.set(
      active.sourceCardId,
      active.pendingServerIds.filter((id) => id !== state.run!.attackedServerId)
        .length,
    );
  return [...sequences.values()].reduce((sum, count) => sum + count, 0);
}
