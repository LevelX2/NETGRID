import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
  TraceCorpBidPaymentCommitment,
  TraceCorpPaymentChoice,
  TraceCorpPaymentSourceKind,
  TraceCorpPaymentSourceOffer,
  TraceState,
} from "@netgrid/shared";
import { traceRulesDefinitionForTrace } from "../trace/trace-rules-profile";
import {
  allocatedAmount,
  allocatedPaymentBreakdowns,
  isValidPaymentAmount,
  validatedTracePaymentPoolAmount,
  type TracePaymentPool,
} from "./trace-payment-pools";

export type CorpTracePaymentSourceKind = TraceCorpPaymentSourceKind;

export type CorpTracePaymentBreakdown = {
  kind: CorpTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  serverId?: Exclude<ServerId, "new_remote">;
};

export type CorpTracePaymentSelection = {
  kind: Extract<
    CorpTracePaymentSourceKind,
    "corp_trace_bit_pool" | "corp_trace_counter_pool"
  >;
  sourceCardInstanceId: CardInstanceId;
  amount: number;
};

export type CorpTraceSpecializedPaymentSource = {
  kind: CorpTracePaymentSelection["kind"];
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  available: number;
};

export type CorpTracePaymentQuote = TraceCorpBidPaymentCommitment;

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
  corpTraceBitPoolSources?: (
    state: GameState,
  ) => CorpTraceSpecializedPaymentSource[];
  spendCorpTraceBitPoolSource?: (
    state: GameState,
    sourceCardInstanceId: CardInstanceId,
    amount: number,
  ) => number;
  corpTraceCounterPoolSources?: (
    state: GameState,
  ) => CorpTraceSpecializedPaymentSource[];
  spendCorpTraceCounterPoolSource?: (
    state: GameState,
    sourceCardInstanceId: CardInstanceId,
    amount: number,
  ) => number;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: "bit",
  ) => number;
};

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

function readCorpTraceBidPaymentPools(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  bid: number,
): {
  pools: TracePaymentPool<CorpTracePaymentSourceKind>[];
  requiredTraceCounters: number;
  corpTraceCounterPoolAvailable: number;
} {
  const implementationTemporaryTraceCreditsAvailable =
    validatedTracePaymentPoolAmount(
      trace.corpTemporaryTraceCredits?.remaining ?? 0,
      "temporary_trace_credit",
    );
  const corpCreditsAvailable = validatedTracePaymentPoolAmount(
    deps.corpCreditsAvailable(state),
    "corp_credits",
  );
  const normalCorpCreditsAvailable = validatedTracePaymentPoolAmount(
    corpCreditsAvailable - implementationTemporaryTraceCreditsAvailable,
    "corp_credits_excluding_temporary_trace_credit",
  );
  const fortTraceBitPoolAvailable =
    trace.fortTraceBitPoolSourceCardInstanceId && trace.fortTraceBitPoolServerId
      ? validatedTracePaymentPoolAmount(
          deps.fortTraceBitPoolTotal(state),
          "fort_trace_bit_pool",
        )
      : 0;
  const corpTraceCounterPoolAvailable = validatedTracePaymentPoolAmount(
    deps.corpTraceCounterPoolTotal(state),
    "corp_trace_counter_pool",
  );
  const encounterTemporaryTraceCreditsAvailable =
    validatedTracePaymentPoolAmount(
      deps.encounterTemporaryTraceCreditsAvailable(state, trace),
      "encounter_temporary_trace_credit",
    );
  const effectiveBaseTraceLimit = Math.max(
    0,
    trace.traceLimit - (trace.rabbitTraceLimitReduction ?? 0),
  );
  const requiredTraceCounters =
    traceRulesDefinitionForTrace(trace).corpBidLimitMode ===
    "effective_trace_limit"
      ? Math.max(0, bid - effectiveBaseTraceLimit)
      : 0;
  const temporarySourceCardId =
    trace.corpTemporaryTraceCredits?.sourceCardInstanceId ??
    trace.encounterTemporaryTraceCreditSourceIceId;
  const temporarySourceDefinitionId =
    trace.corpTemporaryTraceCredits?.sourceDefinitionId ??
    trace.encounterTemporaryTraceCreditSourceDefinitionId;
  return {
    requiredTraceCounters,
    corpTraceCounterPoolAvailable,
    pools: [
      {
        kind: "temporary_trace_credit",
        priority: 10,
        available:
          encounterTemporaryTraceCreditsAvailable +
          implementationTemporaryTraceCreditsAvailable,
        ...(temporarySourceCardId
          ? { sourceCardInstanceId: temporarySourceCardId }
          : {}),
        ...(temporarySourceDefinitionId
          ? { sourceDefinitionId: temporarySourceDefinitionId }
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
        available: normalCorpCreditsAvailable,
      },
    ],
  };
}

export function quoteCorpTraceBidPayment(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  bid: number,
  specializedSelections?: CorpTracePaymentSelection[],
): CorpTracePaymentQuote {
  if (!isValidPaymentAmount(bid)) return emptyCorpTracePaymentQuote(bid);
  const { pools, requiredTraceCounters, corpTraceCounterPoolAvailable } =
    readCorpTraceBidPaymentPools(deps, state, trace, bid);
  if (requiredTraceCounters > corpTraceCounterPoolAvailable)
    return emptyCorpTracePaymentQuote(bid);

  const specializedSources = corpTraceSpecializedPaymentSources(deps, state);
  const selectedSpecialized = specializedSelections
    ? selectedCorpTraceSpecializedBreakdowns(
        specializedSources,
        specializedSelections,
        bid,
      )
    : undefined;
  if (specializedSelections && !selectedSpecialized)
    return emptyCorpTracePaymentQuote(bid);
  const selectedTraceCounters = allocatedAmount(
    selectedSpecialized ?? [],
    "corp_trace_counter_pool",
  );
  if (specializedSelections && selectedTraceCounters < requiredTraceCounters)
    return emptyCorpTracePaymentQuote(bid);
  const selectedSpecializedTotal = (selectedSpecialized ?? []).reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  if (!specializedSelections) {
    pools.push(
      {
        kind: "corp_trace_bit_pool",
        priority: 40,
        available: deps.corpTraceBitPoolTotal(state),
      },
      {
        kind: "corp_trace_counter_pool",
        priority: 50,
        available: corpTraceCounterPoolAvailable - requiredTraceCounters,
      },
    );
  }
  const nonSpecializedBreakdown = allocatedPaymentBreakdowns(
    bid -
      (specializedSelections
        ? selectedSpecializedTotal
        : requiredTraceCounters),
    pools,
  );
  const breakdown = [
    ...nonSpecializedBreakdown,
    ...(selectedSpecialized ?? []),
  ];
  if (!specializedSelections && requiredTraceCounters > 0) {
    const existingCounterPayment = breakdown.find(
      (entry) => entry.kind === "corp_trace_counter_pool",
    );
    if (existingCounterPayment)
      existingCounterPayment.amount += requiredTraceCounters;
    else
      breakdown.push({
        kind: "corp_trace_counter_pool",
        amount: requiredTraceCounters,
      });
  }
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

function emptyCorpTracePaymentQuote(bid: number): CorpTracePaymentQuote {
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

export function quoteCorpTracePaymentChoice(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  bid: number,
):
  | {
      choice: TraceCorpPaymentChoice;
      sources: Array<
        TraceCorpPaymentSourceOffer & { sourceCardInstanceId: CardInstanceId }
      >;
      hasAlternatives: boolean;
    }
  | undefined {
  if (!isValidPaymentAmount(bid) || bid === 0) return undefined;
  const sources = corpTraceSpecializedPaymentSources(deps, state)
    .filter(({ available }) => available > 0)
    .map(({ kind, sourceCardInstanceId, available }) => ({
      kind,
      sourceCardInstanceId,
      maxAmount: Math.min(bid, available),
      recommendedAmount: 0,
    }));
  if (sources.length === 0) return undefined;

  const { pools, requiredTraceCounters, corpTraceCounterPoolAvailable } =
    readCorpTraceBidPaymentPools(deps, state, trace, bid);
  if (requiredTraceCounters > corpTraceCounterPoolAvailable)
    throw new Error("Die Trace-Zahlung hat zu wenige Trace-Counter.");
  const otherCapacity = pools.reduce(
    (capacity, pool) =>
      Math.min(
        bid,
        capacity + validatedTracePaymentPoolAmount(pool.available, pool.kind),
      ),
    0,
  );
  const minimumSpecializedAmount = bid - otherCapacity;
  let missingCounters = requiredTraceCounters;
  for (const source of sources) {
    if (source.kind !== "corp_trace_counter_pool") continue;
    source.recommendedAmount = Math.min(source.maxAmount, missingCounters);
    missingCounters -= source.recommendedAmount;
  }
  if (missingCounters !== 0)
    throw new Error("Die Trace-Zahlung hat zu wenige Trace-Counter.");
  let remaining = bid - requiredTraceCounters;
  let countersPaid = requiredTraceCounters;
  for (const kind of [
    "corp_trace_bit_pool",
    "corp_trace_counter_pool",
  ] as const) {
    for (const source of sources) {
      if (source.kind !== kind) continue;
      const amount = Math.min(
        remaining,
        source.maxAmount - source.recommendedAmount,
      );
      source.recommendedAmount += amount;
      remaining -= amount;
      if (kind === "corp_trace_counter_pool") countersPaid += amount;
    }
  }
  if (remaining > otherCapacity)
    throw new Error("Die Trace-Zahlung ist nicht mehr bezahlbar.");

  // Beyond the minimum, the total can change. At a fixed total, an alternative
  // exists exactly when one assigned unit can move to another eligible source.
  const receivingSources = sources.filter(
    (source) => source.recommendedAmount < source.maxAmount,
  );
  const receivingCounters = receivingSources.filter(
    (source) => source.kind === "corp_trace_counter_pool",
  );
  const hasAlternatives =
    bid - remaining >
      Math.max(minimumSpecializedAmount, requiredTraceCounters) ||
    sources.some((source) => {
      if (source.recommendedAmount === 0) return false;
      const mustPreserveCounter =
        source.kind === "corp_trace_counter_pool" &&
        countersPaid === requiredTraceCounters;
      const receivers = mustPreserveCounter
        ? receivingCounters
        : receivingSources;
      return (
        receivers.length > (source.recommendedAmount < source.maxAmount ? 1 : 0)
      );
    });
  return {
    choice: { bid, minimumSpecializedAmount, requiredTraceCounters },
    sources,
    hasAlternatives,
  };
}

function corpTraceSpecializedPaymentSources(
  deps: CorpTracePaymentDependencies,
  state: GameState,
): CorpTraceSpecializedPaymentSource[] {
  if (!deps.corpTraceBitPoolSources || !deps.corpTraceCounterPoolSources)
    return [];
  const sources = [
    ...deps.corpTraceBitPoolSources(state),
    ...deps.corpTraceCounterPoolSources(state),
  ]
    .map((source) => ({
      ...source,
      available: validatedTracePaymentPoolAmount(
        source.available,
        `${source.kind}:${source.sourceCardInstanceId}`,
      ),
    }))
    .sort((left, right) =>
      left.sourceCardInstanceId.localeCompare(right.sourceCardInstanceId),
    );
  const sourceIds = new Set(
    sources.map((source) => source.sourceCardInstanceId),
  );
  if (sourceIds.size !== sources.length)
    throw new Error("runtime_duplicate_corp_trace_payment_source");
  return sources;
}

function selectedCorpTraceSpecializedBreakdowns(
  sources: CorpTraceSpecializedPaymentSource[],
  selections: CorpTracePaymentSelection[],
  bid: number,
): CorpTracePaymentBreakdown[] | undefined {
  const seen = new Set<CardInstanceId>();
  const sourcesById = new Map(
    sources.map((source) => [source.sourceCardInstanceId, source]),
  );
  const breakdown: CorpTracePaymentBreakdown[] = [];
  let total = 0;
  for (const selection of selections) {
    if (seen.has(selection.sourceCardInstanceId)) return undefined;
    seen.add(selection.sourceCardInstanceId);
    if (!isValidPaymentAmount(selection.amount)) return undefined;
    const source = sourcesById.get(selection.sourceCardInstanceId);
    if (
      !source ||
      source.kind !== selection.kind ||
      selection.amount > source.available
    )
      return undefined;
    total += selection.amount;
    if (total > bid) return undefined;
    if (selection.amount > 0)
      breakdown.push(
        paymentBreakdown(
          source.kind,
          selection.amount,
          source.sourceCardInstanceId,
          source.sourceDefinitionId,
        ),
      );
  }
  return breakdown;
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

export function assertCorpTraceBidPaymentQuoteValid(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  quote: CorpTracePaymentQuote,
): CorpTracePaymentQuote {
  if (state.trace !== trace || trace.status !== "corp_bid")
    throw new Error("Es ist kein Korp-Trace-Bid offen.");
  return assertCorpTraceBidPaymentQuoteMatchesCurrent(
    deps,
    state,
    trace,
    quote,
  );
}

export function assertCommittedCorpTraceBidPaymentQuoteValid(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  quote: CorpTracePaymentQuote,
): CorpTracePaymentQuote {
  if (
    state.trace !== trace ||
    traceRulesDefinitionForTrace(trace).resolutionMode !==
      "hidden_commit_reveal" ||
    trace.status !== "runner_bid" ||
    trace.corpBidPaymentCommitment !== quote ||
    trace.corpBid !== quote.bid ||
    trace.bidsRevealed === true
  )
    throw new Error("Der verdeckte Korp-Trace-Payment-Commit ist ungueltig.");
  return assertCorpTraceBidPaymentQuoteMatchesCurrent(
    deps,
    state,
    trace,
    quote,
  );
}

function assertCorpTraceBidPaymentQuoteMatchesCurrent(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  quote: CorpTracePaymentQuote,
): CorpTracePaymentQuote {
  if (!isValidPaymentAmount(quote.bid))
    throw new Error("Der Trace-Bid ist ungueltig.");
  if (typeof trace.corpBidMax === "number" && quote.bid > trace.corpBidMax)
    throw new Error("Der Korp-Trace-Bid ist nicht mehr gueltig.");
  const specializedSelections = quote.breakdown
    .filter(
      (entry) =>
        (entry.kind === "corp_trace_bit_pool" ||
          entry.kind === "corp_trace_counter_pool") &&
        entry.sourceCardInstanceId,
    )
    .map((entry) => ({
      kind: entry.kind as CorpTracePaymentSelection["kind"],
      sourceCardInstanceId: entry.sourceCardInstanceId!,
      amount: entry.amount,
    }));
  const current =
    specializedSelections.length > 0
      ? quoteCorpTraceBidPayment(
          deps,
          state,
          trace,
          quote.bid,
          corpTraceSpecializedPaymentSources(deps, state).map(
            (source) =>
              specializedSelections.find(
                (selection) =>
                  selection.sourceCardInstanceId ===
                  source.sourceCardInstanceId,
              ) ?? {
                kind: source.kind,
                sourceCardInstanceId: source.sourceCardInstanceId,
                amount: 0,
              },
          ),
        )
      : quoteCorpTraceBidPayment(deps, state, trace, quote.bid);
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
  return payValidatedCorpTraceBidQuote(deps, state, trace, validQuote);
}

export function payCommittedCorpTraceBidQuote(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  quote: CorpTracePaymentQuote,
): CorpTracePaymentReceipt {
  const validQuote = assertCommittedCorpTraceBidPaymentQuoteValid(
    deps,
    state,
    trace,
    quote,
  );
  return payValidatedCorpTraceBidQuote(deps, state, trace, validQuote);
}

function payValidatedCorpTraceBidQuote(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  validQuote: CorpTracePaymentQuote,
): CorpTracePaymentReceipt {
  let remainingTemporaryTracePayment = validQuote.temporaryTraceCreditsToPay;
  let implementationTemporaryTraceCreditsSpent = 0;
  if (trace.corpTemporaryTraceCredits && remainingTemporaryTracePayment > 0) {
    implementationTemporaryTraceCreditsSpent = Math.min(
      validatedTracePaymentPoolAmount(
        trace.corpTemporaryTraceCredits.remaining,
        "temporary_trace_credit",
      ),
      remainingTemporaryTracePayment,
    );
    deps.spendCorpCredits(state, implementationTemporaryTraceCreditsSpent);
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
  const bitBreakdowns = validQuote.breakdown.filter(
    (entry) => entry.kind === "corp_trace_bit_pool",
  );
  const corpTraceBitsSpent = bitBreakdowns.some(
    (entry) => entry.sourceCardInstanceId,
  )
    ? bitBreakdowns.reduce(
        (sum, entry) =>
          sum +
          (deps.spendCorpTraceBitPoolSource?.(
            state,
            entry.sourceCardInstanceId!,
            entry.amount,
          ) ?? 0),
        0,
      )
    : deps.spendCorpTraceBitPool(state, validQuote.corpTraceBitsToPay);
  if (corpTraceBitsSpent !== validQuote.corpTraceBitsToPay)
    throw new Error("Korp-Trace-Bit-Pool hat nicht genug Bits.");
  const counterBreakdowns = validQuote.breakdown.filter(
    (entry) => entry.kind === "corp_trace_counter_pool",
  );
  const corpTraceCountersSpent = counterBreakdowns.some(
    (entry) => entry.sourceCardInstanceId,
  )
    ? counterBreakdowns.reduce(
        (sum, entry) =>
          sum +
          (deps.spendCorpTraceCounterPoolSource?.(
            state,
            entry.sourceCardInstanceId!,
            entry.amount,
          ) ?? 0),
        0,
      )
    : deps.spendCorpTraceCounterPool(state, validQuote.corpTraceCountersToPay);
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
      validatedTracePaymentPoolAmount(
        trace.corpTemporaryTraceCredits?.remaining ?? 0,
        "temporary_trace_credit",
      ) +
      validatedTracePaymentPoolAmount(
        state.run?.encounterTemporaryTraceCredits?.remaining ?? 0,
        "encounter_temporary_trace_credit",
      );
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
          traceLimitAndValueBoost: receipt.corpTraceCountersSpent,
        }
      : {}),
  };
}
