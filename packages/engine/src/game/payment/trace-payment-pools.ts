import type {
  CardDefinitionId,
  CardInstanceId,
  ServerId,
} from "@netgrid/shared";

export type TracePaymentPool<
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

export function isValidPaymentAmount(amount: number): boolean {
  return Number.isSafeInteger(amount) && amount >= 0;
}

export function validatedTracePaymentPoolAmount(
  value: number,
  poolKind: string,
): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`runtime_invalid_trace_payment_pool_amount:${poolKind}`);
  return value;
}

export function allocatedPaymentBreakdowns<
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

export function allocatedAmount<K extends string>(
  breakdown: Array<{ kind: K; amount: number }>,
  kind: K,
): number {
  return breakdown
    .filter((entry) => entry.kind === kind)
    .reduce((sum, entry) => sum + entry.amount, 0);
}
