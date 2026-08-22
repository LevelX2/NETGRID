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
  TraceCorpBidPaymentCommitment,
  TraceCorpPaymentSourceKind,
  TraceRunnerPaymentSourceKind,
  TraceState,
} from "@netgrid/shared";
import { traceRulesDefinitionForTrace } from "../trace/trace-rules-profile";

export type CorpTracePaymentSourceKind = TraceCorpPaymentSourceKind;

export type RunnerTracePaymentSourceKind = TraceRunnerPaymentSourceKind;

export type RunnerTracePaymentPublicKind = "runner_trace_link_bonus_credit";

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

export type RunnerTracePaymentBreakdown = {
  kind: RunnerTracePaymentSourceKind;
  amount: number;
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  publicKind?: RunnerTracePaymentPublicKind;
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
  return Number.isSafeInteger(bid) && bid >= 0;
}

function isValidPaymentAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount >= 0;
}

function validatedTracePaymentPoolAmount(
  value: number,
  poolKind: string,
): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`runtime_invalid_trace_payment_pool_amount:${poolKind}`);
  return value;
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
  const validatedPools = pools.map((pool) => ({
    ...pool,
    available: validatedTracePaymentPoolAmount(pool.available, pool.kind),
  }));
  for (const pool of validatedPools
    .slice()
    .sort((left, right) => left.priority - right.priority)) {
    if (remaining <= 0) break;
    const available = pool.available;
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

export function quoteCorpTraceBidPayment(
  deps: CorpTracePaymentDependencies,
  state: GameState,
  trace: TraceState,
  bid: number,
  specializedSelections?: CorpTracePaymentSelection[],
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
  if (requiredTraceCounters > corpTraceCounterPoolAvailable) {
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
  const selectedTraceCounters = (selectedSpecialized ?? [])
    .filter((entry) => entry.kind === "corp_trace_counter_pool")
    .reduce((sum, entry) => sum + entry.amount, 0);
  if (specializedSelections && selectedTraceCounters < requiredTraceCounters)
    return emptyCorpTracePaymentQuote(bid);
  const selectedSpecializedTotal = (selectedSpecialized ?? []).reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
  const nonSpecializedBreakdown =
    allocatedPaymentBreakdowns<CorpTracePaymentSourceKind>(
      specializedSelections
        ? bid - selectedSpecializedTotal
        : bid - requiredTraceCounters,
      [
        {
          kind: "temporary_trace_credit",
          priority: 10,
          available:
            encounterTemporaryTraceCreditsAvailable +
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
            ? {
                sourceCardInstanceId:
                  trace.fortTraceBitPoolSourceCardInstanceId,
              }
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
        ...(specializedSelections
          ? []
          : [
              {
                kind: "corp_trace_bit_pool" as const,
                priority: 40,
                available: deps.corpTraceBitPoolTotal(state),
              },
              {
                kind: "corp_trace_counter_pool" as const,
                priority: 50,
                available:
                  corpTraceCounterPoolAvailable - requiredTraceCounters,
              },
            ]),
      ],
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

export function corpTraceSpecializedPaymentSources(
  deps: CorpTracePaymentDependencies,
  state: GameState,
): CorpTraceSpecializedPaymentSource[] {
  if (deps.corpTraceBitPoolSources && deps.corpTraceCounterPoolSources)
    return [
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
  return [];
}

function selectedCorpTraceSpecializedBreakdowns(
  sources: CorpTraceSpecializedPaymentSource[],
  selections: CorpTracePaymentSelection[],
  bid: number,
): CorpTracePaymentBreakdown[] | undefined {
  const seen = new Set<CardInstanceId>();
  const breakdown: CorpTracePaymentBreakdown[] = [];
  let total = 0;
  for (const selection of selections) {
    if (seen.has(selection.sourceCardInstanceId)) return undefined;
    seen.add(selection.sourceCardInstanceId);
    if (!isValidPaymentAmount(selection.amount)) return undefined;
    const source = sources.find(
      (candidate) =>
        candidate.sourceCardInstanceId === selection.sourceCardInstanceId &&
        candidate.kind === selection.kind,
    );
    if (!source || selection.amount > source.available) return undefined;
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
  if (selections.length !== sources.length) return undefined;
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
  if (!isValidBidAmount(quote.bid))
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
