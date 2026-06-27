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

export type PostBidTraceLinkOption = {
  id: string;
  label: string;
  linkDelta?: number;
};

export type PostBidTraceLinkEfficiencyReason =
  | "post_bid_link_already_avoided"
  | "post_bid_link_minimal_outcome_delta"
  | "post_bid_link_no_outcome_delta"
  | "post_bid_link_existing_choice"
  | "post_bid_link_unknown_context";

export type PostBidTraceLinkEfficiencyInput = {
  options: readonly PostBidTraceLinkOption[];
  fallbackOptionId?: string;
  traceStrength?: number;
  runnerLink?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postBidTraceLinkBonus?: number;
};

export type PostBidTraceLinkEfficiencySelection = {
  option?: PostBidTraceLinkOption;
  reason: PostBidTraceLinkEfficiencyReason;
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
  if (
    typeof traceStrength !== "number" ||
    typeof runnerLink !== "number" ||
    !Number.isInteger(traceStrength) ||
    !Number.isInteger(runnerLink)
  ) {
    return { option: desiredOption, reason: "trace_bid_unknown_context" };
  }

  const corpTotal = Math.max(0, traceStrength);
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

export function selectEfficientPostBidLinkOption(
  input: PostBidTraceLinkEfficiencyInput,
): PostBidTraceLinkEfficiencySelection {
  const fallbackOption =
    input.options.find((option) => option.id === input.fallbackOptionId) ??
    input.options[0];
  const passOption = input.options.find((option) => option.id === "pass");
  const traceStrength = input.traceStrength;
  const runnerBase = currentRunnerTraceStrength(input);
  if (
    typeof traceStrength !== "number" ||
    !Number.isInteger(traceStrength) ||
    typeof runnerBase !== "number" ||
    !Number.isInteger(runnerBase)
  ) {
    return postBidTraceLinkSelection(
      fallbackOption,
      "post_bid_link_unknown_context",
    );
  }

  const corpTotal = Math.max(0, traceStrength);
  const currentRunnerTotal = Math.max(0, runnerBase);
  if (currentRunnerTotal >= corpTotal) {
    return postBidTraceLinkSelection(
      passOption ?? fallbackOption,
      passOption
        ? "post_bid_link_already_avoided"
        : "post_bid_link_existing_choice",
    );
  }

  const improvingOptions = input.options
    .flatMap((option) => {
      if (!option.id.startsWith("trace_link_")) return [];
      const delta = option.linkDelta;
      return Number.isInteger(delta) && typeof delta === "number" && delta > 0
        ? [{ option, delta }]
        : [];
    })
    .filter((candidate) => currentRunnerTotal + candidate.delta >= corpTotal)
    .sort(
      (left, right) =>
        left.delta - right.delta ||
        left.option.label.localeCompare(right.option.label, "de") ||
        left.option.id.localeCompare(right.option.id),
    );
  const minimalImprovingOption = improvingOptions[0]?.option;
  if (!minimalImprovingOption) {
    return postBidTraceLinkSelection(
      passOption ?? fallbackOption,
      passOption
        ? "post_bid_link_no_outcome_delta"
        : "post_bid_link_existing_choice",
    );
  }
  if (minimalImprovingOption.id === input.fallbackOptionId) {
    return postBidTraceLinkSelection(
      minimalImprovingOption,
      "post_bid_link_existing_choice",
    );
  }
  return postBidTraceLinkSelection(
    minimalImprovingOption,
    "post_bid_link_minimal_outcome_delta",
  );
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

function currentRunnerTraceStrength(
  input: Pick<
    PostBidTraceLinkEfficiencyInput,
    "runnerStrength" | "runnerLink" | "runnerBid" | "postBidTraceLinkBonus"
  >,
): number | undefined {
  if (Number.isInteger(input.runnerStrength)) return input.runnerStrength;
  const runnerLink = input.runnerLink;
  const runnerBid = input.runnerBid;
  if (
    typeof runnerLink === "number" &&
    typeof runnerBid === "number" &&
    Number.isInteger(runnerLink) &&
    Number.isInteger(runnerBid)
  ) {
    return (
      Math.max(0, runnerLink) +
      Math.max(0, runnerBid) +
      Math.max(0, input.postBidTraceLinkBonus ?? 0)
    );
  }
  return undefined;
}

function postBidTraceLinkSelection(
  option: PostBidTraceLinkOption | undefined,
  reason: PostBidTraceLinkEfficiencyReason,
): PostBidTraceLinkEfficiencySelection {
  return option ? { option, reason } : { reason };
}
