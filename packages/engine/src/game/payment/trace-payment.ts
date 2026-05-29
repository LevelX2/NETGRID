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
  | "paris_city_grid_pool"
  | "corp_credits"
  | "krumz_trace_bit"
  | "hacker_tracker_counter";

export type RunnerTracePaymentSourceKind =
  | "runner_credits"
  | "restricted_trace_link_credit"
  | "hells_run_trace_credit";

export type CorpTracePaymentBreakdown = {
  kind: CorpTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
};

export type RunnerTracePaymentBreakdown = {
  kind: RunnerTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
};

export type CorpTracePaymentQuote = {
  side: "corp";
  bid: number;
  canPay: boolean;
  breakdown: CorpTracePaymentBreakdown[];
  normalCreditsToPay: number;
  temporaryTraceCreditsToPay: number;
  parisCityGridPoolToPay: number;
  krumzBitsToPay: number;
  hackerTrackerCountersToPay: number;
};

export type CorpTracePaymentReceipt = {
  temporaryTraceCreditsSpent: number;
  temporaryTraceCreditsRemaining?: number;
  parisCityGridPoolSpent: number;
  parisCityGridPoolRemaining?: number;
  parisCityGridPoolServerId?: Exclude<ServerId, "new_remote">;
  corpCreditsSpent: number;
  krumzBitsSpent: number;
  hackerTrackerCountersSpent: number;
};

export type RunnerTracePaymentPurpose = "runner_trace_bid" | "post_bid_link";

export type RunnerTracePaymentQuote = {
  side: "runner";
  purpose: RunnerTracePaymentPurpose;
  amount: number;
  canPay: boolean;
  breakdown: RunnerTracePaymentBreakdown[];
  traceLinkCreditsToPay: number;
  hellsRunCreditsToPay: number;
  normalCreditsToPay: number;
  sourceDefinitionIds: CardDefinitionId[];
};

export type RunnerTracePaymentReceipt = {
  traceLinkCreditsSpent: number;
  hellsRunTraceCreditsSpent: number;
  runnerCreditsSpent: number;
  sourceDefinitionIds: CardDefinitionId[];
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
  parisCityGridTracePoolTotal: (state: GameState) => number;
  spendParisCityGridTracePool: (
    state: GameState,
    sourceCardId: CardInstanceId | undefined,
    serverId: Exclude<ServerId, "new_remote"> | undefined,
    amount: number,
  ) => number;
  corpCreditsAvailable: (state: GameState) => number;
  spendCorpCredits: (state: GameState, amount: number) => void;
  krumzTraceBitTotal: (state: GameState) => number;
  spendKrumzTraceBits: (state: GameState, amount: number) => number;
  hackerTrackerCounterTotal: (state: GameState) => number;
  spendHackerTrackerCounters: (state: GameState, amount: number) => number;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: "bit",
  ) => number;
};

export type RunnerTracePaymentDependencies = {
  runnerTraceLinkCreditSourceIds: (state: GameState) => CardInstanceId[];
  hostedPaymentCredits: (state: GameState, cardId: CardInstanceId) => number;
  spendHostedPaymentCredits: (
    state: GameState,
    cardId: CardInstanceId,
    amount: number,
  ) => void;
  runnerCreditsAvailable: (state: GameState) => number;
  spendRunnerCredits: (state: GameState, amount: number) => void;
  recordRunnerRunCreditSpend: (state: GameState, amount: number) => void;
  definitionIdForCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => CardDefinitionId;
  hellsRunDefinitionId: CardDefinitionId;
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
): CorpTracePaymentBreakdown {
  return {
    kind,
    amount,
    ...(sourceCardInstanceId ? { sourceCardInstanceId } : {}),
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
  };
}

function runnerPaymentBreakdown(
  kind: RunnerTracePaymentSourceKind,
  amount: number,
  sourceCardInstanceId?: CardInstanceId,
  sourceDefinitionId?: CardDefinitionId,
): RunnerTracePaymentBreakdown {
  return {
    kind,
    amount,
    ...(sourceCardInstanceId ? { sourceCardInstanceId } : {}),
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
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
    hellsRunCreditsToPay: 0,
    normalCreditsToPay: 0,
    sourceDefinitionIds: [],
  };
}

function quoteRunnerTracePayment(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  purpose: RunnerTracePaymentPurpose,
  amount: number,
): RunnerTracePaymentQuote {
  if (!isValidPaymentAmount(amount))
    return emptyRunnerTracePaymentQuote(purpose, amount);

  let remaining = amount;
  let traceLinkCreditsToPay = 0;
  let hellsRunCreditsToPay = 0;
  const breakdown: RunnerTracePaymentBreakdown[] = [];
  const sourceDefinitionIds = new Set<CardDefinitionId>();
  for (const cardId of deps.runnerTraceLinkCreditSourceIds(state)) {
    if (remaining <= 0) break;
    const available = Math.max(
      0,
      Math.floor(deps.hostedPaymentCredits(state, cardId)),
    );
    const spent = Math.min(available, remaining);
    if (spent <= 0) continue;
    const definitionId = deps.definitionIdForCard(state, cardId);
    const isHellsRun = definitionId === deps.hellsRunDefinitionId;
    breakdown.push(
      runnerPaymentBreakdown(
        isHellsRun ? "hells_run_trace_credit" : "restricted_trace_link_credit",
        spent,
        cardId,
        definitionId,
      ),
    );
    remaining -= spent;
    traceLinkCreditsToPay += spent;
    if (isHellsRun) hellsRunCreditsToPay += spent;
    sourceDefinitionIds.add(definitionId);
  }

  const normalCreditsToPay = Math.min(
    Math.max(0, Math.floor(deps.runnerCreditsAvailable(state))),
    remaining,
  );
  remaining -= normalCreditsToPay;
  if (normalCreditsToPay > 0)
    breakdown.push(runnerPaymentBreakdown("runner_credits", normalCreditsToPay));

  return {
    side: "runner",
    purpose,
    amount,
    canPay: remaining === 0,
    breakdown: positiveRunnerBreakdown(breakdown),
    traceLinkCreditsToPay,
    hellsRunCreditsToPay,
    normalCreditsToPay,
    sourceDefinitionIds: [...sourceDefinitionIds].sort(),
  };
}

export function quoteRunnerTraceBidPayment(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  bid: number,
): RunnerTracePaymentQuote {
  return quoteRunnerTracePayment(deps, state, "runner_trace_bid", bid);
}

export function quotePostBidLinkPayment(
  deps: RunnerTracePaymentDependencies,
  state: GameState,
  amount: number,
): RunnerTracePaymentQuote {
  return quoteRunnerTracePayment(deps, state, "post_bid_link", amount);
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
      parisCityGridPoolToPay: 0,
      krumzBitsToPay: 0,
      hackerTrackerCountersToPay: 0,
    };
  }

  const implementationTemporaryTraceCreditsAvailable = Math.max(
    0,
    Math.floor(trace.corpTemporaryTraceCredits?.remaining ?? 0),
  );
  const temporaryTraceCreditsToPay = Math.min(
    deps.encounterTemporaryTraceCreditsAvailable(state, trace) +
      implementationTemporaryTraceCreditsAvailable,
    bid,
  );
  const parisCityGridPoolAvailable =
    trace.parisCityGridPoolSourceCardInstanceId &&
    trace.parisCityGridPoolServerId
      ? deps.parisCityGridTracePoolTotal(state)
      : 0;
  const parisCityGridPoolToPay = Math.min(
    parisCityGridPoolAvailable,
    bid - temporaryTraceCreditsToPay,
  );
  const normalCreditsToPay = Math.min(
    deps.corpCreditsAvailable(state),
    bid - temporaryTraceCreditsToPay - parisCityGridPoolToPay,
  );
  const krumzBitsToPay = Math.min(
    deps.krumzTraceBitTotal(state),
    bid -
      temporaryTraceCreditsToPay -
      parisCityGridPoolToPay -
      normalCreditsToPay,
  );
  const hackerTrackerCountersToPay =
    bid -
    temporaryTraceCreditsToPay -
    parisCityGridPoolToPay -
    normalCreditsToPay -
    krumzBitsToPay;
  const canPay =
    hackerTrackerCountersToPay <= deps.hackerTrackerCounterTotal(state);

  return {
    side: "corp",
    bid,
    canPay,
    breakdown: positiveBreakdown([
      paymentBreakdown(
        "temporary_trace_credit",
        temporaryTraceCreditsToPay,
        trace.corpTemporaryTraceCredits?.sourceCardInstanceId ??
          trace.encounterTemporaryTraceCreditSourceIceId,
        trace.corpTemporaryTraceCredits?.sourceDefinitionId ??
          trace.encounterTemporaryTraceCreditSourceDefinitionId,
      ),
      paymentBreakdown(
        "paris_city_grid_pool",
        parisCityGridPoolToPay,
        trace.parisCityGridPoolSourceCardInstanceId,
      ),
      paymentBreakdown("corp_credits", normalCreditsToPay),
      paymentBreakdown("krumz_trace_bit", krumzBitsToPay),
      paymentBreakdown("hacker_tracker_counter", hackerTrackerCountersToPay),
    ]),
    normalCreditsToPay,
    temporaryTraceCreditsToPay,
    parisCityGridPoolToPay,
    krumzBitsToPay,
    hackerTrackerCountersToPay,
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
    left.parisCityGridPoolToPay === right.parisCityGridPoolToPay &&
    left.krumzBitsToPay === right.krumzBitsToPay &&
    left.hackerTrackerCountersToPay === right.hackerTrackerCountersToPay
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
        entry.sourceDefinitionId === other.sourceDefinitionId
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
    left.hellsRunCreditsToPay === right.hellsRunCreditsToPay &&
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
    throw new Error("Die Runner-Trace-Zahlungsquote ist nicht fuer Runner-Bids.");
  if (!isValidPaymentAmount(quote.amount))
    throw new Error("Der Trace-Bid ist ungueltig.");
  const current = quoteRunnerTraceBidPayment(deps, state, quote.amount);
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
  deps.recordRunnerRunCreditSpend(state, quote.amount);
  for (const entry of quote.breakdown) {
    if (
      entry.kind !== "restricted_trace_link_credit" &&
      entry.kind !== "hells_run_trace_credit"
    )
      continue;
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
    hellsRunTraceCreditsSpent: quote.hellsRunCreditsToPay,
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
        ...(receipt.hellsRunTraceCreditsSpent > 0
          ? { hellsRunTraceCreditsSpent: receipt.hellsRunTraceCreditsSpent }
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
    implementationTemporaryTraceCreditsSpent + encounterTemporaryTraceCreditsSpent;
  if (temporaryTraceCreditsSpent !== validQuote.temporaryTraceCreditsToPay)
    throw new Error("Temporary Trace Credits sind nicht mehr gueltig.");
  const parisCityGridPoolSpent = deps.spendParisCityGridTracePool(
    state,
    trace.parisCityGridPoolSourceCardInstanceId,
    trace.parisCityGridPoolServerId,
    validQuote.parisCityGridPoolToPay,
  );
  if (parisCityGridPoolSpent !== validQuote.parisCityGridPoolToPay)
    throw new Error("Paris City Grid ist fuer diesen Trace nicht verfuegbar.");
  deps.spendCorpCredits(state, validQuote.normalCreditsToPay);
  const krumzBitsSpent = deps.spendKrumzTraceBits(
    state,
    validQuote.krumzBitsToPay,
  );
  if (krumzBitsSpent !== validQuote.krumzBitsToPay)
    throw new Error("Krumz hat nicht genug Bits.");
  const hackerTrackerCountersSpent = deps.spendHackerTrackerCounters(
    state,
    validQuote.hackerTrackerCountersToPay,
  );
  if (hackerTrackerCountersSpent !== validQuote.hackerTrackerCountersToPay)
    throw new Error("Hacker Tracker Central hat nicht genug Counter.");

  const receipt: CorpTracePaymentReceipt = {
    temporaryTraceCreditsSpent,
    parisCityGridPoolSpent,
    corpCreditsSpent: validQuote.normalCreditsToPay,
    krumzBitsSpent,
    hackerTrackerCountersSpent,
  };
  if (temporaryTraceCreditsSpent > 0) {
    receipt.temporaryTraceCreditsRemaining =
      (trace.corpTemporaryTraceCredits?.remaining ?? 0) +
      (state.run?.encounterTemporaryTraceCredits?.remaining ?? 0);
  }
  if (parisCityGridPoolSpent > 0 && trace.parisCityGridPoolSourceCardInstanceId) {
    receipt.parisCityGridPoolRemaining = deps.cardCounter(
      state,
      trace.parisCityGridPoolSourceCardInstanceId,
      "bit",
    );
  }
  if (parisCityGridPoolSpent > 0 && trace.parisCityGridPoolServerId) {
    receipt.parisCityGridPoolServerId = trace.parisCityGridPoolServerId;
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
    ...(receipt.parisCityGridPoolSpent > 0
      ? {
          parisCityGridPoolSpent: receipt.parisCityGridPoolSpent,
          parisCityGridPoolRemaining: receipt.parisCityGridPoolRemaining ?? 0,
          parisCityGridPoolServerId: receipt.parisCityGridPoolServerId,
        }
      : {}),
    ...(receipt.krumzBitsSpent > 0
      ? { krumzBitsSpent: receipt.krumzBitsSpent }
      : {}),
    ...(receipt.hackerTrackerCountersSpent > 0
      ? {
          hackerTrackerCountersSpent: receipt.hackerTrackerCountersSpent,
          traceHostedCreditBoost: receipt.hackerTrackerCountersSpent,
        }
      : {}),
  };
}
