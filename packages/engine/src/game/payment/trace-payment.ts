/**
 * ARCH-9 Corp Trace Bid Payment.
 * Quotet, validiert und zahlt nur Corp-Bids.
 * Orchestriert keinen Trace.
 * Keine Runner-Bids.
 * Keine Base-Link-/Post-Bid-Link-Logik.
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

export type CorpTracePaymentBreakdown = {
  kind: CorpTracePaymentSourceKind;
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

function isValidBidAmount(bid: number): boolean {
  return Number.isInteger(bid) && bid >= 0;
}

function positiveBreakdown(
  breakdown: CorpTracePaymentBreakdown[],
): CorpTracePaymentBreakdown[] {
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

  const temporaryTraceCreditsToPay = Math.min(
    deps.encounterTemporaryTraceCreditsAvailable(state, trace),
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
        trace.encounterTemporaryTraceCreditSourceIceId,
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
  const temporaryTraceCreditsSpent =
    deps.spendEncounterTemporaryTraceCredits(
      state,
      trace,
      validQuote.temporaryTraceCreditsToPay,
    );
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
      state.run?.encounterTemporaryTraceCredits?.remaining ?? 0;
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
