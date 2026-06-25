/**
 * ARCH-9/10 Trace Bid Payment.
 * Quotet, validiert und zahlt Trace-Bid-/Link-Payment.
 * Orchestriert keinen Trace.
 * Keine Base-Link-Logik.
 * Keine PublicPayload-Vertragsänderung.
 * Kein Import aus index.ts.
 */
import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
  TraceState,
} from "@netgrid/shared";

export type CorpTracePaymentSourceKind =
  | "temporary_trace_credit"
  | "fort_trace_bit_pool"
  | "corp_credits"
  | "corp_trace_bit_pool"
  | "corp_trace_counter_pool";

export type RunnerTracePaymentSourceKind =
  | "runner_credits"
  | "runner_trace_link_credit";

export type RunnerTracePaymentPublicKind = "runner_trace_link_bonus_credit";

export type CorpTracePaymentBreakdown = {
  kind: CorpTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  serverId?: Exclude<ServerId, "new_remote">;
};

export type RunnerTracePaymentBreakdown = {
  kind: RunnerTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  publicKind?: RunnerTracePaymentPublicKind;
};

export type CorpTracePaymentQuote = {
  side: "corp";
  bid: number;
  canPay: boolean;
  breakdown: CorpTracePaymentBreakdown[];
  normalCreditsToPay: number;
  temporaryTraceCreditsToPay: number;
  fortTraceBitPoolToPay: number;
  corpTraceBitsToPay: number;
  corpTraceCountersToPay: number;
};

export type CorpTracePaymentReceipt = {
  temporaryTraceCreditsSpent: number;
  temporaryTraceCreditsRemaining?: number;
  fortTraceBitPoolSpent: number;
  fortTraceBitPoolRemaining?: number;
  fortTraceBitPoolServerId?: Exclude<ServerId, "new_remote">;
  corpCreditsSpent: number;
  corpTraceBitsSpent: number;
  corpTraceCountersSpent: number;
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

type TracePaymentPool<
  K extends string,
  P extends string | undefined = undefined,
> = {
  kind: K;
  priority: number;
  available: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  serverId?: Exclude<ServerId, "new_remote">;
  publicKind?: P;
};

export type CorpTracePaymentDependencies = {
  encounterTemporaryTraceCreditsAvailable: (
    state: GameState,
    trace: TraceState,
  ) => number;
  spendEncounterTemporaryTraceCredits: (
    state: GameState,
    trace: TraceState,
    amount: number,
  ) => number;
  fortTraceBitPoolTotal: (state: GameState) => number;
  spendFortTraceBitPool: (
    state: GameState,
    sourceCardId: CardInstanceId | undefined,
    serverId: Exclude<ServerId, "new_remote"> | undefined,
    amount: number,
  ) => number;
  corpCreditsAvailable: (state: GameState) => number;
  spendCorpCredits: (state: GameState, amount: number) => void;
  corpTraceBitPoolTotal: (state: GameState) => number;
  spendCorpTraceBitPool: (state: GameState, amount: number) => number;
  corpTraceCounterPoolTotal: (state: GameState) => number;
  spendCorpTraceCounterPool: (state: GameState, amount: number) => number;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: "bit",
  ) => number;
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

function isValidBidAmount(bid: number): boolean {
  return Number.isInteger(bid) && bid >= 0;
}

function isValidPaymentAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0;
}

function positiveBreakdown(
  breakdown: CorpTracePaymentBreakdown[],
): CorpTracePaymentBreakdown[] {
  return breakdown.filter((entry) => entry.amount > 0);
}

function positiveRunnerBreakdown(
  breakdown: RunnerTracePaymentBreakdown[],
): RunnerTracePaymentBreakdown[] {
  return breakdown.filter((entry) => entry.amount > 0);
}

function paymentBreakdown(
  kind: CorpTracePaymentSourceKind,
  amount: number,
  sourceCardInstanceId?: CardInstanceId,
  sourceDefinitionId?: CardDefinitionId,
  serverId?: Exclude<ServerId, "new_remote">,
): CorpTracePaymentBreakdown {
  return {
    kind,
    amount,
    ...(sourceCardInstanceId ? { sourceCardInstanceId } : {}),
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    ...(serverId ? { serverId } : {}),
  };
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

function allocatedPaymentBreakdowns<
  K extends string,
  P extends string | undefined = undefined,
>(
  amount: number,
  pools: TracePaymentPool<K, P>[],
): Array<
  TracePaymentPool<K, P> & {
    amount: number;
  }
> {
  let remaining = amount;
  const breakdown: Array<TracePaymentPool<K, P> & { amount: number }> = [];
  for (const pool of pools
    .slice()
    .sort((left, right) => left.priority - right.priority)) {
    if (remaining <= 0) break;
    const available = Math.max(0, Math.floor(pool.available));
    const spent = Math.min(available, remaining);
    if (spent <= 0) continue;
    breakdown.push({ ...pool, amount: spent });
    remaining -= spent;
  }
  return breakdown;
}

function allocatedAmount<K extends string>(
  breakdown: Array<{ kind: K; amount: number }>,
  kind: K,
): number {
  return breakdown
    .filter((entry) => entry.kind === kind)
    .reduce((sum, entry) => sum + entry.amount, 0);
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
    Math.max(0, Math.floor(deps.runnerCreditsAvailable(state))),
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
    sourceDefinitionIds: sourceDefinitionIds.sort(),
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
  for (const selection of selections) {
    if (
      !Number.isInteger(selection.amount) ||
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
    const available = Math.max(0, Math.floor(pool.available));
    if (selection.amount > available) return undefined;
    selectedTotal += selection.amount;
    if (selectedTotal > amount) return undefined;
    breakdown.push({ ...pool, amount: selection.amount });
  }
  return breakdown;
}

export function quoteCorpTraceBidPayment(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  bid: number,
): CorpTracePaymentQuote {
  if (!isValidBidAmount(bid)) {
    return {
      side: "corp",
      bid,
      canPay: false,
      breakdown: [],
      normalCreditsToPay: 0,
      temporaryTraceCreditsToPay: 0,
      fortTraceBitPoolToPay: 0,
      corpTraceBitsToPay: 0,
      corpTraceCountersToPay: 0,
    };
  }

  const implementationTemporaryTraceCreditsAvailable = Math.max(
    0,
    Math.floor(trace.corpTemporaryTraceCredits?.remaining ?? 0),
  );
  const fortTraceBitPoolAvailable =
    trace.fortTraceBitPoolSourceCardInstanceId && trace.fortTraceBitPoolServerId
      ? deps.fortTraceBitPoolTotal(state)
      : 0;
  const breakdown = allocatedPaymentBreakdowns<CorpTracePaymentSourceKind>(
    bid,
    [
      {
        kind: "temporary_trace_credit",
        priority: 10,
        available:
          deps.encounterTemporaryTraceCreditsAvailable(state, trace) +
          implementationTemporaryTraceCreditsAvailable,
        ...((trace.corpTemporaryTraceCredits?.sourceCardInstanceId ??
        trace.encounterTemporaryTraceCreditSourceIceId)
          ? {
              sourceCardInstanceId:
                trace.corpTemporaryTraceCredits?.sourceCardInstanceId ??
                trace.encounterTemporaryTraceCreditSourceIceId,
            }
          : {}),
        ...((trace.corpTemporaryTraceCredits?.sourceDefinitionId ??
        trace.encounterTemporaryTraceCreditSourceDefinitionId)
          ? {
              sourceDefinitionId:
                trace.corpTemporaryTraceCredits?.sourceDefinitionId ??
                trace.encounterTemporaryTraceCreditSourceDefinitionId,
            }
          : {}),
      },
      {
        kind: "fort_trace_bit_pool",
        priority: 20,
        available: fortTraceBitPoolAvailable,
        ...(trace.fortTraceBitPoolSourceCardInstanceId
          ? { sourceCardInstanceId: trace.fortTraceBitPoolSourceCardInstanceId }
          : {}),
        ...(trace.fortTraceBitPoolServerId
          ? { serverId: trace.fortTraceBitPoolServerId }
          : {}),
      },
      {
        kind: "corp_credits",
        priority: 30,
        available: deps.corpCreditsAvailable(state),
      },
      {
        kind: "corp_trace_bit_pool",
        priority: 40,
        available: deps.corpTraceBitPoolTotal(state),
      },
      {
        kind: "corp_trace_counter_pool",
        priority: 50,
        available: deps.corpTraceCounterPoolTotal(state),
      },
    ],
  );
  const paidTotal = breakdown.reduce((sum, entry) => sum + entry.amount, 0);
  const temporaryTraceCreditsToPay = allocatedAmount(
    breakdown,
    "temporary_trace_credit",
  );
  const fortTraceBitPoolToPay = allocatedAmount(
    breakdown,
    "fort_trace_bit_pool",
  );
  const normalCreditsToPay = allocatedAmount(breakdown, "corp_credits");
  const corpTraceBitsToPay = allocatedAmount(breakdown, "corp_trace_bit_pool");
  const corpTraceCountersToPay = allocatedAmount(
    breakdown,
    "corp_trace_counter_pool",
  );
  const canPay = paidTotal === bid;

  return {
    side: "corp",
    bid,
    canPay,
    breakdown: positiveBreakdown(
      breakdown.map((entry) =>
        paymentBreakdown(
          entry.kind,
          entry.amount,
          entry.sourceCardInstanceId,
          entry.sourceDefinitionId,
          entry.serverId,
        ),
      ),
    ),
    normalCreditsToPay,
    temporaryTraceCreditsToPay,
    fortTraceBitPoolToPay,
    corpTraceBitsToPay,
    corpTraceCountersToPay,
  };
}

function quoteMatchesCurrent(
  left: CorpTracePaymentQuote,
  right: CorpTracePaymentQuote,
): boolean {
  return (
    left.bid === right.bid &&
    left.canPay === right.canPay &&
    left.normalCreditsToPay === right.normalCreditsToPay &&
    left.temporaryTraceCreditsToPay === right.temporaryTraceCreditsToPay &&
    left.fortTraceBitPoolToPay === right.fortTraceBitPoolToPay &&
    left.corpTraceBitsToPay === right.corpTraceBitsToPay &&
    left.corpTraceCountersToPay === right.corpTraceCountersToPay &&
    sameCorpBreakdown(left.breakdown, right.breakdown)
  );
}

function sameCorpBreakdown(
  left: CorpTracePaymentBreakdown[],
  right: CorpTracePaymentBreakdown[],
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
        entry.serverId === other.serverId
      );
    })
  );
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
  if (quote.purpose === "post_bid_link")
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

export function assertCorpTraceBidPaymentQuoteValid(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  quote: CorpTracePaymentQuote,
): CorpTracePaymentQuote {
  if (state.trace !== trace || trace.status !== "corp_bid")
    throw new Error("Es ist kein Korp-Trace-Bid offen.");
  if (!isValidBidAmount(quote.bid))
    throw new Error("Der Trace-Bid ist ungueltig.");
  if (typeof trace.corpBidMax === "number" && quote.bid > trace.corpBidMax)
    throw new Error("Der Korp-Trace-Bid ist nicht mehr gueltig.");
  const current = quoteCorpTraceBidPayment(deps, state, trace, quote.bid);
  if (!current.canPay)
    throw new Error("Die Korp kann den Trace-Bid nicht bezahlen.");
  if (!quoteMatchesCurrent(quote, current))
    throw new Error("Die Korp-Trace-Zahlungsquote ist nicht mehr gueltig.");
  return current;
}

export function assertCorpTraceBidPaymentValid(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  bid: number,
): CorpTracePaymentQuote {
  return assertCorpTraceBidPaymentQuoteValid(
    deps,
    state,
    trace,
    quoteCorpTraceBidPayment(deps, state, trace, bid),
  );
}

export function payCorpTraceBidQuote(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  quote: CorpTracePaymentQuote,
): CorpTracePaymentReceipt {
  const validQuote = assertCorpTraceBidPaymentQuoteValid(
    deps,
    state,
    trace,
    quote,
  );
  let remainingTemporaryTracePayment = validQuote.temporaryTraceCreditsToPay;
  let implementationTemporaryTraceCreditsSpent = 0;
  if (trace.corpTemporaryTraceCredits && remainingTemporaryTracePayment > 0) {
    implementationTemporaryTraceCreditsSpent = Math.min(
      Math.max(0, Math.floor(trace.corpTemporaryTraceCredits.remaining ?? 0)),
      remainingTemporaryTracePayment,
    );
    trace.corpTemporaryTraceCredits.remaining = Math.max(
      0,
      Math.floor(trace.corpTemporaryTraceCredits.remaining ?? 0) -
        implementationTemporaryTraceCreditsSpent,
    );
    remainingTemporaryTracePayment -= implementationTemporaryTraceCreditsSpent;
  }
  const encounterTemporaryTraceCreditsSpent =
    deps.spendEncounterTemporaryTraceCredits(
      state,
      trace,
      remainingTemporaryTracePayment,
    );
  const temporaryTraceCreditsSpent =
    implementationTemporaryTraceCreditsSpent +
    encounterTemporaryTraceCreditsSpent;
  if (temporaryTraceCreditsSpent !== validQuote.temporaryTraceCreditsToPay)
    throw new Error("Temporary Trace Credits sind nicht mehr gueltig.");
  const fortTraceBitPoolSpent = deps.spendFortTraceBitPool(
    state,
    trace.fortTraceBitPoolSourceCardInstanceId,
    trace.fortTraceBitPoolServerId,
    validQuote.fortTraceBitPoolToPay,
  );
  if (fortTraceBitPoolSpent !== validQuote.fortTraceBitPoolToPay)
    throw new Error(
      "Fort-Trace-Bit-Pool ist fuer diesen Trace nicht verfuegbar.",
    );
  deps.spendCorpCredits(state, validQuote.normalCreditsToPay);
  const corpTraceBitsSpent = deps.spendCorpTraceBitPool(
    state,
    validQuote.corpTraceBitsToPay,
  );
  if (corpTraceBitsSpent !== validQuote.corpTraceBitsToPay)
    throw new Error("Korp-Trace-Bit-Pool hat nicht genug Bits.");
  const corpTraceCountersSpent = deps.spendCorpTraceCounterPool(
    state,
    validQuote.corpTraceCountersToPay,
  );
  if (corpTraceCountersSpent !== validQuote.corpTraceCountersToPay)
    throw new Error("Korp-Trace-Counter-Pool hat nicht genug Counter.");

  const receipt: CorpTracePaymentReceipt = {
    temporaryTraceCreditsSpent,
    fortTraceBitPoolSpent,
    corpCreditsSpent: validQuote.normalCreditsToPay,
    corpTraceBitsSpent,
    corpTraceCountersSpent,
  };
  if (temporaryTraceCreditsSpent > 0) {
    receipt.temporaryTraceCreditsRemaining =
      (trace.corpTemporaryTraceCredits?.remaining ?? 0) +
      (state.run?.encounterTemporaryTraceCredits?.remaining ?? 0);
  }
  if (fortTraceBitPoolSpent > 0 && trace.fortTraceBitPoolSourceCardInstanceId) {
    receipt.fortTraceBitPoolRemaining = deps.cardCounter(
      state,
      trace.fortTraceBitPoolSourceCardInstanceId,
      "bit",
    );
  }
  if (fortTraceBitPoolSpent > 0 && trace.fortTraceBitPoolServerId) {
    receipt.fortTraceBitPoolServerId = trace.fortTraceBitPoolServerId;
  }
  return receipt;
}

export function corpTracePaymentPublicPayload(
  trace: TraceState,
  quote: CorpTracePaymentQuote,
  receipt: CorpTracePaymentReceipt,
): NonNullable<LegalAction["payload"]> {
  return {
    corpBid: quote.bid,
    ...(receipt.temporaryTraceCreditsSpent > 0
      ? {
          temporaryTraceCreditsSpent: receipt.temporaryTraceCreditsSpent,
          temporaryTraceCreditsRemaining:
            receipt.temporaryTraceCreditsRemaining ?? 0,
          temporaryTraceCreditsSourceDefinitionId:
            trace.corpTemporaryTraceCredits?.sourceDefinitionId ??
            trace.encounterTemporaryTraceCreditSourceDefinitionId,
        }
      : {}),
    corpCreditBid: receipt.corpCreditsSpent,
    ...(receipt.fortTraceBitPoolSpent > 0
      ? {
          fortTraceBitPoolSpent: receipt.fortTraceBitPoolSpent,
          fortTraceBitPoolRemaining: receipt.fortTraceBitPoolRemaining ?? 0,
          fortTraceBitPoolServerId: receipt.fortTraceBitPoolServerId,
        }
      : {}),
    ...(receipt.corpTraceBitsSpent > 0
      ? { recurringTraceCreditPoolSpent: receipt.corpTraceBitsSpent }
      : {}),
    ...(receipt.corpTraceCountersSpent > 0
      ? {
          hackerTrackerCountersSpent: receipt.corpTraceCountersSpent,
          traceHostedCreditBoost: receipt.corpTraceCountersSpent,
        }
      : {}),
  };
}
