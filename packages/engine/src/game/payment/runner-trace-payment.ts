import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
  TraceRunnerPaymentSourceKind,
} from "@netgrid/shared";
import { limitRunActionSpendingCapacity } from "./run-action-spending-cap";
import {
  allocatedPaymentBreakdowns,
  isValidPaymentAmount,
  validatedTracePaymentPoolAmount,
  type TracePaymentPool,
} from "./trace-payment-pools";

export type RunnerTracePaymentSourceKind = TraceRunnerPaymentSourceKind;

export type RunnerTracePaymentPublicKind = "runner_trace_link_bonus_credit";

export type RunnerTracePaymentBreakdown = {
  kind: RunnerTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  publicKind?: RunnerTracePaymentPublicKind;
};

export type RunnerTracePaymentPurpose = "runner_trace_bid" | "post_bid_link";

export type RunnerTracePaymentQuote = {
  side: "runner";
  purpose: RunnerTracePaymentPurpose;
  amount: number;
  canPay: boolean;
  breakdown: RunnerTracePaymentBreakdown[];
  traceLinkCreditsToPay: number;
  bonusTraceLinkCreditsToPay: number;
  normalCreditsToPay: number;
  sourceDefinitionIds: CardDefinitionId[];
};

export type RunnerTracePaymentReceipt = {
  traceLinkCreditsSpent: number;
  bonusTraceLinkCreditsSpent: number;
  runnerCreditsSpent: number;
  sourceDefinitionIds: CardDefinitionId[];
};

export type RunnerTraceLinkCreditSource = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  publicKind?: RunnerTracePaymentPublicKind;
};

export type RunnerTraceLinkCreditSelection = {
  sourceCardInstanceId: CardInstanceId;
  amount: number;
};

export type RunnerTracePaymentDependencies = {
  runnerTraceLinkCreditSources: (
    state: GameState,
  ) => RunnerTraceLinkCreditSource[];
  hostedPaymentCredits: (state: GameState, cardId: CardInstanceId) => number;
  spendHostedPaymentCredits: (
    state: GameState,
    cardId: CardInstanceId,
    amount: number,
  ) => void;
  runnerCreditsAvailable: (state: GameState) => number;
  spendRunnerCredits: (state: GameState, amount: number) => void;
  recordRunnerRunCreditSpend: (state: GameState, amount: number) => void;
  recordRunActionSpendingCapSpend: (state: GameState, amount: number) => void;
  definitionIdForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardDefinitionId;
};

function positiveRunnerBreakdown(
  breakdown: RunnerTracePaymentBreakdown[],
): RunnerTracePaymentBreakdown[] {
  return breakdown.filter((entry) => entry.amount > 0);
}

function runnerPaymentBreakdown(
  kind: RunnerTracePaymentSourceKind,
  amount: number,
  sourceCardInstanceId?: CardInstanceId,
  sourceDefinitionId?: CardDefinitionId,
  publicKind?: RunnerTracePaymentPublicKind,
): RunnerTracePaymentBreakdown {
  return {
    kind,
    amount,
    ...(sourceCardInstanceId ? { sourceCardInstanceId } : {}),
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    ...(publicKind ? { publicKind } : {}),
  };
}

function emptyRunnerTracePaymentQuote(
  purpose: RunnerTracePaymentPurpose,
  amount: number,
): RunnerTracePaymentQuote {
  return {
    side: "runner",
    purpose,
    amount,
    canPay: false,
    breakdown: [],
    traceLinkCreditsToPay: 0,
    bonusTraceLinkCreditsToPay: 0,
    normalCreditsToPay: 0,
    sourceDefinitionIds: [],
  };
}

function addSourceDefinitionId(
  sourceDefinitionIds: CardDefinitionId[],
  sourceDefinitionId: CardDefinitionId,
): void {
  if (!sourceDefinitionIds.includes(sourceDefinitionId))
    sourceDefinitionIds.push(sourceDefinitionId);
}

function quoteRunnerTracePayment(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  purpose: RunnerTracePaymentPurpose,
  amount: number,
  traceLinkSelections?: RunnerTraceLinkCreditSelection[],
): RunnerTracePaymentQuote {
  if (!isValidPaymentAmount(amount))
    return emptyRunnerTracePaymentQuote(purpose, amount);
  if (limitRunActionSpendingCapacity(state, amount) < amount)
    return emptyRunnerTracePaymentQuote(purpose, amount);

  const traceLinkPools = deps.runnerTraceLinkCreditSources(state).map(
    (
      source,
      index,
    ): TracePaymentPool<
      RunnerTracePaymentSourceKind,
      RunnerTracePaymentPublicKind | undefined
    > => ({
      kind: "runner_trace_link_credit",
      priority: index,
      available: deps.hostedPaymentCredits(state, source.sourceCardInstanceId),
      sourceCardInstanceId: source.sourceCardInstanceId,
      sourceDefinitionId: source.sourceDefinitionId,
      ...(source.publicKind ? { publicKind: source.publicKind } : {}),
    }),
  );
  const traceLinkBreakdown =
    traceLinkSelections === undefined
      ? allocatedPaymentBreakdowns(amount, traceLinkPools)
      : selectedTraceLinkBreakdowns(
          amount,
          traceLinkPools,
          traceLinkSelections,
        );
  if (traceLinkBreakdown === undefined)
    return emptyRunnerTracePaymentQuote(purpose, amount);
  let remaining =
    amount - traceLinkBreakdown.reduce((sum, entry) => sum + entry.amount, 0);
  const sourceDefinitionIds: CardDefinitionId[] = [];
  const breakdown: RunnerTracePaymentBreakdown[] = traceLinkBreakdown.map(
    (entry) => {
      if (entry.sourceDefinitionId)
        addSourceDefinitionId(sourceDefinitionIds, entry.sourceDefinitionId);
      return runnerPaymentBreakdown(
        entry.kind,
        entry.amount,
        entry.sourceCardInstanceId,
        entry.sourceDefinitionId,
        entry.publicKind,
      );
    },
  );
  const traceLinkCreditsToPay = traceLinkBreakdown.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const bonusTraceLinkCreditsToPay = traceLinkBreakdown
    .filter((entry) => entry.publicKind === "runner_trace_link_bonus_credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  for (const entry of breakdown) {
    if (entry.sourceDefinitionId) {
      const currentDefinitionId =
        entry.sourceCardInstanceId !== undefined
          ? deps.definitionIdForCard(state, entry.sourceCardInstanceId)
          : entry.sourceDefinitionId;
      if (currentDefinitionId !== entry.sourceDefinitionId)
        throw new Error("Trace-Link-Zahlungsquelle ist ungueltig.");
    }
  }

  const normalCreditsToPay = Math.min(
    validatedTracePaymentPoolAmount(
      deps.runnerCreditsAvailable(state),
      "runner_credits",
    ),
    remaining,
  );
  remaining -= normalCreditsToPay;
  if (normalCreditsToPay > 0)
    breakdown.push(
      runnerPaymentBreakdown("runner_credits", normalCreditsToPay),
    );

  return {
    side: "runner",
    purpose,
    amount,
    canPay: remaining === 0,
    breakdown: positiveRunnerBreakdown(breakdown),
    traceLinkCreditsToPay,
    bonusTraceLinkCreditsToPay,
    normalCreditsToPay,
    sourceDefinitionIds: sourceDefinitionIds.sort(
      (left, right) => left - right,
    ),
  };
}

export function quoteRunnerTraceBidPayment(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  bid: number,
  traceLinkSelections?: RunnerTraceLinkCreditSelection[],
): RunnerTracePaymentQuote {
  return quoteRunnerTracePayment(
    deps,
    state,
    "runner_trace_bid",
    bid,
    traceLinkSelections,
  );
}

export function quotePostBidLinkPayment(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  amount: number,
): RunnerTracePaymentQuote {
  return quoteRunnerTracePayment(deps, state, "post_bid_link", amount);
}

function selectedTraceLinkBreakdowns(
  amount: number,
  pools: Array<
    TracePaymentPool<
      RunnerTracePaymentSourceKind,
      RunnerTracePaymentPublicKind | undefined
    >
  >,
  selections: RunnerTraceLinkCreditSelection[],
):
  | Array<
      TracePaymentPool<
        RunnerTracePaymentSourceKind,
        RunnerTracePaymentPublicKind | undefined
      > & {
        amount: number;
      }
    >
  | undefined {
  const seen = new Set<CardInstanceId>();
  let selectedTotal = 0;
  const breakdown: Array<
    TracePaymentPool<
      RunnerTracePaymentSourceKind,
      RunnerTracePaymentPublicKind | undefined
    > & {
      amount: number;
    }
  > = [];
  for (const pool of pools)
    validatedTracePaymentPoolAmount(pool.available, pool.kind);
  for (const selection of selections) {
    if (
      !Number.isSafeInteger(selection.amount) ||
      selection.amount < 0 ||
      seen.has(selection.sourceCardInstanceId)
    ) {
      return undefined;
    }
    seen.add(selection.sourceCardInstanceId);
    if (selection.amount === 0) continue;
    const pool = pools.find(
      (candidate) =>
        candidate.sourceCardInstanceId === selection.sourceCardInstanceId,
    );
    if (!pool) return undefined;
    const available = validatedTracePaymentPoolAmount(
      pool.available,
      pool.kind,
    );
    if (selection.amount > available) return undefined;
    selectedTotal += selection.amount;
    if (selectedTotal > amount) return undefined;
    breakdown.push({ ...pool, amount: selection.amount });
  }
  return breakdown;
}

function sameDefinitionIds(
  left: CardDefinitionId[],
  right: CardDefinitionId[],
): boolean {
  return (
    left.length === right.length &&
    left.every((definitionId, index) => definitionId === right[index])
  );
}

function sameRunnerBreakdown(
  left: RunnerTracePaymentBreakdown[],
  right: RunnerTracePaymentBreakdown[],
): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => {
      const other = right[index];
      return (
        other !== undefined &&
        entry.kind === other.kind &&
        entry.amount === other.amount &&
        entry.sourceCardInstanceId === other.sourceCardInstanceId &&
        entry.sourceDefinitionId === other.sourceDefinitionId &&
        entry.publicKind === other.publicKind
      );
    })
  );
}

function runnerQuoteMatchesCurrent(
  left: RunnerTracePaymentQuote,
  right: RunnerTracePaymentQuote,
): boolean {
  return (
    left.purpose === right.purpose &&
    left.amount === right.amount &&
    left.canPay === right.canPay &&
    left.traceLinkCreditsToPay === right.traceLinkCreditsToPay &&
    left.bonusTraceLinkCreditsToPay === right.bonusTraceLinkCreditsToPay &&
    left.normalCreditsToPay === right.normalCreditsToPay &&
    sameDefinitionIds(left.sourceDefinitionIds, right.sourceDefinitionIds) &&
    sameRunnerBreakdown(left.breakdown, right.breakdown)
  );
}

export function assertRunnerTraceBidPaymentQuoteValid(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  quote: RunnerTracePaymentQuote,
): RunnerTracePaymentQuote {
  if (state.trace?.status !== "runner_bid")
    throw new Error("Es ist kein Runner-Trace-Bid offen.");
  if (quote.purpose !== "runner_trace_bid")
    throw new Error(
      "Die Runner-Trace-Zahlungsquote ist nicht fuer Runner-Bids.",
    );
  if (!isValidPaymentAmount(quote.amount))
    throw new Error("Der Trace-Bid ist ungueltig.");
  const current = quoteRunnerTraceBidPayment(
    deps,
    state,
    quote.amount,
    quote.breakdown
      .filter((entry) => entry.kind === "runner_trace_link_credit")
      .map((entry) => {
        if (!entry.sourceCardInstanceId)
          throw new Error("Trace-Link-Zahlungsquelle fehlt.");
        return {
          sourceCardInstanceId: entry.sourceCardInstanceId,
          amount: entry.amount,
        };
      }),
  );
  if (!current.canPay)
    throw new Error("Der Runner kann den Link-Bid nicht bezahlen.");
  if (!runnerQuoteMatchesCurrent(quote, current))
    throw new Error("Die Runner-Trace-Zahlungsquote ist nicht mehr gueltig.");
  return current;
}

export function assertRunnerTraceBidPaymentValid(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  bid: number,
): RunnerTracePaymentQuote {
  return assertRunnerTraceBidPaymentQuoteValid(
    deps,
    state,
    quoteRunnerTraceBidPayment(deps, state, bid),
  );
}

export function assertPostBidLinkPaymentQuoteValid(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  quote: RunnerTracePaymentQuote,
): RunnerTracePaymentQuote {
  if (state.trace?.status !== "post_bid_link")
    throw new Error("Es ist kein Post-Bid-Link-Fenster offen.");
  if (quote.purpose !== "post_bid_link")
    throw new Error(
      "Die Runner-Trace-Zahlungsquote ist nicht fuer Post-Bid-Link.",
    );
  if (!isValidPaymentAmount(quote.amount))
    throw new Error("Die Post-Bid-Link-Kosten sind ungueltig.");
  const current = quotePostBidLinkPayment(deps, state, quote.amount);
  if (!current.canPay)
    throw new Error("Der Runner kann den Link-Bid nicht bezahlen.");
  if (!runnerQuoteMatchesCurrent(quote, current))
    throw new Error("Die Post-Bid-Link-Zahlungsquote ist nicht mehr gueltig.");
  return current;
}

export function assertPostBidLinkPaymentValid(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  amount: number,
): RunnerTracePaymentQuote {
  return assertPostBidLinkPaymentQuoteValid(
    deps,
    state,
    quotePostBidLinkPayment(deps, state, amount),
  );
}

function payRunnerTracePaymentQuote(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  quote: RunnerTracePaymentQuote,
): RunnerTracePaymentReceipt {
  deps.recordRunActionSpendingCapSpend(state, quote.amount);
  deps.recordRunnerRunCreditSpend(state, quote.amount);
  for (const entry of quote.breakdown) {
    if (entry.kind !== "runner_trace_link_credit") continue;
    if (!entry.sourceCardInstanceId)
      throw new Error("Trace-Link-Zahlungsquelle fehlt.");
    deps.spendHostedPaymentCredits(
      state,
      entry.sourceCardInstanceId,
      entry.amount,
    );
  }
  deps.spendRunnerCredits(state, quote.normalCreditsToPay);
  return {
    traceLinkCreditsSpent: quote.traceLinkCreditsToPay,
    bonusTraceLinkCreditsSpent: quote.bonusTraceLinkCreditsToPay,
    runnerCreditsSpent: quote.normalCreditsToPay,
    sourceDefinitionIds: quote.sourceDefinitionIds,
  };
}

export function payRunnerTraceBidQuote(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  quote: RunnerTracePaymentQuote,
): RunnerTracePaymentReceipt {
  return payRunnerTracePaymentQuote(
    deps,
    state,
    assertRunnerTraceBidPaymentQuoteValid(deps, state, quote),
  );
}

export function payPostBidLinkPaymentQuote(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  quote: RunnerTracePaymentQuote,
): RunnerTracePaymentReceipt {
  return payRunnerTracePaymentQuote(
    deps,
    state,
    assertPostBidLinkPaymentQuoteValid(deps, state, quote),
  );
}

export function runnerTracePaymentPublicPayload(
  receipt: RunnerTracePaymentReceipt,
): NonNullable<LegalAction["payload"]> {
  return receipt.traceLinkCreditsSpent > 0
    ? {
        traceLinkCreditsSpent: receipt.traceLinkCreditsSpent,
        ...(receipt.bonusTraceLinkCreditsSpent > 0
          ? { bonusTraceLinkCreditsSpent: receipt.bonusTraceLinkCreditsSpent }
          : {}),
        runnerCreditsSpent: receipt.runnerCreditsSpent,
        traceLinkCreditSourceDefinitionIds:
          receipt.sourceDefinitionIds.join(","),
      }
    : {};
}

export function postBidLinkPaymentPublicPayload(
  receipt: RunnerTracePaymentReceipt,
): NonNullable<LegalAction["payload"]> {
  return receipt.traceLinkCreditsSpent > 0
    ? {
        traceLinkCreditsSpent: receipt.traceLinkCreditsSpent,
        runnerCreditsSpent: receipt.runnerCreditsSpent,
        traceLinkCreditSourceDefinitionIds:
          receipt.sourceDefinitionIds.join(","),
      }
    : {};
}
