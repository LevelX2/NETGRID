import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "./plan-resolution-failure";

/** A current Engine fact, shared by Economy funding and turn-plan safety. */
export function currentCorpCreditObligation(
  input: AiDecisionInput,
): number | undefined {
  const quote = input.playerView.own.corpEndTurnCreditObligation;
  if (quote === undefined) return undefined;
  if (
    input.side !== "corp" ||
    input.playerView.side !== "corp" ||
    !Number.isSafeInteger(quote.creditsDue) ||
    quote.creditsDue <= 0 ||
    quote.expiresAtStateVersion !== input.playerView.stateVersion ||
    quote.deadline !== "end_of_corp_turn" ||
    quote.consequence !== "lose_game"
  ) {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      owner: "action_semantics",
      removalCondition:
        "Provide the current complete Engine-owned mandatory Corp credit obligation.",
    });
  }
  return input.playerView.activeSide === "corp" &&
    input.playerView.timingPoint === "corp_action.main"
    ? quote.creditsDue
    : undefined;
}
