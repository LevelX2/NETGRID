import { type AiDecisionInput } from "@netgrid/shared";

import { selectEfficientTraceBidOption } from "../trace-bid-efficiency";
import { assessCorpTraceBid } from "./corp-trace-bid-assessment";
import { type LatestTraceContext } from "./trace-context";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

export function selectedBidChoiceOptionId(
  input: AiDecisionInput,
  choice: PendingChoice,
  traceContext: LatestTraceContext,
): string | undefined {
  const bidOptions = choice.options
    .map((option) => ({
      id: option.id,
      amount: typeof option.value === "number" ? option.value : Number.NaN,
    }))
    .filter((option) => Number.isInteger(option.amount) && option.amount >= 0)
    .sort((left, right) => left.amount - right.amount);
  const maxBid = bidOptions.at(-1)?.amount ?? 0;
  let desired = 0;
  if (input.side === "corp") {
    desired = corpDesiredBidAmount(input, choice, traceContext, maxBid);
  } else {
    const tieBid = Math.max(
      0,
      (traceContext.traceStrength ?? 0) - (traceContext.runnerLink ?? 0),
    );
    desired = input.difficulty === "easy" ? 0 : Math.min(maxBid, tieBid);
  }
  let selected =
    bidOptions.find((option) => option.amount === desired) ?? bidOptions[0];
  if (input.side === "runner" && selected) {
    selected =
      selectEfficientTraceBidOption({
        side: input.side,
        bidOptions,
        desiredAmount: desired,
        ...traceContext,
      }).option ?? selected;
  }
  return selected?.id;
}

function corpDesiredBidAmount(
  input: AiDecisionInput,
  choice: PendingChoice,
  traceContext: LatestTraceContext,
  maxBid: number,
): number {
  if (
    choice.source.startsWith(
      "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:",
    )
  ) {
    if (input.difficulty === "hard") return maxBid;
    if (input.difficulty === "normal")
      return Math.max(2, Math.ceil(maxBid * 0.75));
    return Math.min(2, maxBid);
  }
  if (input.difficulty === "easy") return 0;
  return assessCorpTraceBid({
    input,
    traceContext,
    maxBid,
  }).recommendedBid;
}
