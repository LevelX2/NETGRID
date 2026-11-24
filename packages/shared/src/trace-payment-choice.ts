import type {
  TraceCorpPaymentChoice,
  TraceCorpPaymentSourceOffer,
} from "./index";

type PaymentAmount = Pick<TraceCorpPaymentSourceOffer, "kind" | "maxAmount"> & {
  amount: number;
};

export function traceCorpPaymentBalance(
  payment: TraceCorpPaymentChoice,
  sources: readonly PaymentAmount[],
): { otherAmount: number; canPay: boolean } | undefined {
  const { bid, minimumSpecializedAmount, requiredTraceCounters } = payment;
  if (
    !Number.isSafeInteger(bid) ||
    bid <= 0 ||
    ![minimumSpecializedAmount, requiredTraceCounters].every(
      (amount) => Number.isSafeInteger(amount) && amount >= 0 && amount <= bid,
    )
  )
    return undefined;

  let specialized = 0;
  let counters = 0;
  for (const { kind, maxAmount, amount } of sources) {
    if (
      (kind !== "corp_trace_bit_pool" && kind !== "corp_trace_counter_pool") ||
      !Number.isSafeInteger(maxAmount) ||
      maxAmount <= 0 ||
      maxAmount > bid ||
      !Number.isSafeInteger(amount) ||
      amount < 0 ||
      amount > maxAmount ||
      amount > bid - specialized
    )
      return undefined;
    specialized += amount;
    if (kind === "corp_trace_counter_pool") counters += amount;
  }
  return {
    otherAmount: bid - specialized,
    canPay:
      specialized >= minimumSpecializedAmount &&
      counters >= requiredTraceCounters,
  };
}
