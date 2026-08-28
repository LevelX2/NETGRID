import type { Side, TraceRulesProfile } from "@netgrid/shared";

export type TraceBidOption = {
  id: string;
  /** Actual credits/bits committed and paid. */
  amount: number;
  /** Link increase produced by that payment. Defaults to amount for Modern Open. */
  linkDelta?: number;
};

export type TraceBidEfficiencyReason =
  | "trace_bid_no_outcome_delta"
  | "trace_bid_minimal_outcome_bid"
  | "trace_bid_existing_choice"
  | "trace_bid_unknown_context";

export type TraceBidEfficiencyInput<
  TOption extends TraceBidOption = TraceBidOption,
> = {
  side: Side;
  bidOptions: readonly TOption[];
  desiredAmount: number;
  traceValue?: number;
  runnerLink?: number;
  corpBid?: number;
  traceRulesProfile?: TraceRulesProfile;
};

export type TraceBidEfficiencySelection<
  TOption extends TraceBidOption = TraceBidOption,
> = {
  option?: TOption;
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
  traceValue?: number;
  runnerLink?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postBidTraceLinkBonus?: number;
  traceRulesProfile?: TraceRulesProfile;
};

export type PostBidTraceLinkEfficiencySelection = {
  option?: PostBidTraceLinkOption;
  reason: PostBidTraceLinkEfficiencyReason;
};

export function selectEfficientTraceBidOption<
  TOption extends TraceBidOption,
>(
  input: TraceBidEfficiencyInput<TOption>,
): TraceBidEfficiencySelection<TOption> {
  const bidOptions = input.bidOptions
    .filter(
      (option) =>
        Number.isInteger(option.amount) &&
        option.amount >= 0 &&
        (option.linkDelta === undefined ||
          (Number.isInteger(option.linkDelta) && option.linkDelta >= 0)),
    )
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

  const traceValue = input.traceValue;
  const runnerLink = input.runnerLink;
  if (
    typeof traceValue !== "number" ||
    typeof runnerLink !== "number" ||
    !Number.isInteger(traceValue) ||
    !Number.isInteger(runnerLink)
  ) {
    return { option: desiredOption, reason: "trace_bid_unknown_context" };
  }

  const corpTotal = Math.max(0, traceValue);
  const runnerBase = Math.max(0, runnerLink);
  const desiredOutcome = runnerAvoidsTrace(
    runnerBase,
    traceBidLinkDelta(desiredOption),
    corpTotal,
    input.traceRulesProfile,
  );
  const sameOutcomeOptions = bidOptions.filter(
    (option) =>
      runnerAvoidsTrace(
        runnerBase,
        traceBidLinkDelta(option),
        corpTotal,
        input.traceRulesProfile,
      ) === desiredOutcome,
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
  const traceValue = input.traceValue;
  const runnerBase = currentRunnerTraceStrength(input);
  if (
    typeof traceValue !== "number" ||
    !Number.isInteger(traceValue) ||
    typeof runnerBase !== "number" ||
    !Number.isInteger(runnerBase)
  ) {
    return postBidTraceLinkSelection(
      fallbackOption,
      "post_bid_link_unknown_context",
    );
  }

  const corpTotal = Math.max(0, traceValue);
  const currentRunnerTotal = Math.max(0, runnerBase);
  if (
    runnerAvoidsTrace(0, currentRunnerTotal, corpTotal, input.traceRulesProfile)
  ) {
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
    .filter((candidate) =>
      runnerAvoidsTrace(
        0,
        currentRunnerTotal + candidate.delta,
        corpTotal,
        input.traceRulesProfile,
      ),
    )
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

function closestBidOptionAtOrBelow<TOption extends TraceBidOption>(
  bidOptions: readonly TOption[],
  desiredAmount: number,
): TOption {
  const clampedDesired = Math.max(0, Math.floor(desiredAmount));
  let selected = bidOptions[0]!;
  for (const option of bidOptions) {
    if (option.amount > clampedDesired) break;
    selected = option;
  }
  return selected;
}

function traceBidLinkDelta(option: TraceBidOption): number {
  return Math.max(0, option.linkDelta ?? option.amount);
}

function runnerAvoidsTrace(
  runnerBase: number,
  runnerBid: number,
  corpTotal: number,
  profile: TraceRulesProfile | undefined,
): boolean {
  const runnerStrength = runnerBase + runnerBid;
  return profile === undefined || profile === "classic_blind_corp_ties"
    ? runnerStrength > corpTotal
    : runnerStrength >= corpTotal;
}

function currentRunnerTraceStrength(
  input: Pick<
    PostBidTraceLinkEfficiencyInput,
    | "runnerStrength"
    | "runnerLink"
    | "runnerBid"
    | "postBidTraceLinkBonus"
    | "traceRulesProfile"
  >,
): number | undefined {
  if (Number.isInteger(input.runnerStrength)) return input.runnerStrength;
  const runnerLink = input.runnerLink;
  if (typeof runnerLink !== "number" || !Number.isInteger(runnerLink)) {
    return undefined;
  }
  const postBidBonus = Math.max(0, input.postBidTraceLinkBonus ?? 0);
  if (
    input.traceRulesProfile === "classic_blind" ||
    input.traceRulesProfile === "classic_blind_corp_ties"
  ) {
    // In Classic, runnerLink is already the card-derived pre-reveal strength.
    // runnerBid is the amount paid and must not be added a second time.
    return Math.max(0, runnerLink) + postBidBonus;
  }
  const runnerBid = input.runnerBid;
  if (typeof runnerBid !== "number" || !Number.isInteger(runnerBid)) {
    return undefined;
  }
  return Math.max(0, runnerLink) + Math.max(0, runnerBid) + postBidBonus;
}

function postBidTraceLinkSelection(
  option: PostBidTraceLinkOption | undefined,
  reason: PostBidTraceLinkEfficiencyReason,
): PostBidTraceLinkEfficiencySelection {
  return option ? { option, reason } : { reason };
}
