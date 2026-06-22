import type { Side } from "@netgrid/shared";

export type TraceBidOption = {
  id: string;
  amount: number;
};

export type TraceBidEfficiencyReason =
  | "trace_bid_no_outcome_delta"
  | "trace_bid_minimal_outcome_bid"
  | "trace_bid_existing_choice"
  | "trace_bid_unknown_context";

export type TraceBidEfficiencyInput = {
  side: Side;
  bidOptions: readonly TraceBidOption[];
  desiredAmount: number;
  traceStrength?: number;
  runnerLink?: number;
  corpBid?: number;
};

export type TraceBidEfficiencySelection = {
  option?: TraceBidOption;
  reason: TraceBidEfficiencyReason;
};

export function selectEfficientTraceBidOption(
  input: TraceBidEfficiencyInput,
): TraceBidEfficiencySelection {
  const bidOptions = input.bidOptions
    .filter((option) => Number.isInteger(option.amount) && option.amount >= 0)
    .slice()
    .sort((left, right) => left.amount - right.amount);
  if (bidOptions.length === 0) {
    return { reason: "trace_bid_unknown_context" };
  }

  const desiredOption = closestBidOptionAtOrBelow(
    bidOptions,
    input.desiredAmount,
  );
  if (input.side !== "runner") {
    return { option: desiredOption, reason: "trace_bid_unknown_context" };
  }

  const traceStrength = input.traceStrength;
  const runnerLink = input.runnerLink;
  const corpBid = input.corpBid;
  if (
    typeof traceStrength !== "number" ||
    typeof runnerLink !== "number" ||
    typeof corpBid !== "number" ||
    !Number.isInteger(traceStrength) ||
    !Number.isInteger(runnerLink) ||
    !Number.isInteger(corpBid)
  ) {
    return { option: desiredOption, reason: "trace_bid_unknown_context" };
  }

  const corpTotal = Math.max(0, traceStrength) + Math.max(0, corpBid);
  const runnerBase = Math.max(0, runnerLink);
  const desiredOutcome = runnerAvoidsTrace(
    runnerBase,
    desiredOption.amount,
    corpTotal,
  );
  const sameOutcomeOptions = bidOptions.filter(
    (option) =>
      runnerAvoidsTrace(runnerBase, option.amount, corpTotal) ===
      desiredOutcome,
  );
  const minimalSameOutcome = sameOutcomeOptions[0] ?? desiredOption;
  if (minimalSameOutcome.amount < desiredOption.amount) {
    return {
      option: minimalSameOutcome,
      reason: desiredOutcome
        ? "trace_bid_minimal_outcome_bid"
        : "trace_bid_no_outcome_delta",
    };
  }
  return { option: desiredOption, reason: "trace_bid_existing_choice" };
}

function closestBidOptionAtOrBelow(
  bidOptions: readonly TraceBidOption[],
  desiredAmount: number,
): TraceBidOption {
  const clampedDesired = Math.max(0, Math.floor(desiredAmount));
  let selected = bidOptions[0] ?? { id: "bid_0", amount: 0 };
  for (const option of bidOptions) {
    if (option.amount > clampedDesired) break;
    selected = option;
  }
  return selected;
}

function runnerAvoidsTrace(
  runnerBase: number,
  runnerBid: number,
  corpTotal: number,
): boolean {
  return runnerBase + runnerBid >= corpTotal;
}
