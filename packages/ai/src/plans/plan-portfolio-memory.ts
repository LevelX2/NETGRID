import type { AiDecisionInput } from "@netgrid/shared";
import type { PlanPortfolioSnapshot } from "./plan-portfolio";

const planPortfolioMemoryByKey = new Map<string, PlanPortfolioSnapshot>();

export function getPlanPortfolioMemorySnapshot(
  input: AiDecisionInput,
): PlanPortfolioSnapshot | undefined {
  const key = planPortfolioMemoryKey(input);
  if (input.playerView.winner !== null) {
    planPortfolioMemoryByKey.delete(key);
    return undefined;
  }
  const snapshot = planPortfolioMemoryByKey.get(key);
  if (!snapshot) return undefined;
  if (
    snapshot.side !== input.side ||
    snapshot.profileId !== input.profileId ||
    snapshot.stateVersion > input.playerView.stateVersion
  ) {
    planPortfolioMemoryByKey.delete(key);
    return undefined;
  }
  return structuredClone(snapshot);
}

export function rememberPlanPortfolioSnapshot(
  input: AiDecisionInput,
  snapshot: PlanPortfolioSnapshot,
): PlanPortfolioSnapshot | undefined {
  const key = planPortfolioMemoryKey(input);
  if (
    input.playerView.winner !== null ||
    snapshot.side !== input.side ||
    snapshot.profileId !== input.profileId ||
    snapshot.stateVersion !== input.playerView.stateVersion
  ) {
    planPortfolioMemoryByKey.delete(key);
    return undefined;
  }
  const storedSnapshot = structuredClone(snapshot);
  planPortfolioMemoryByKey.set(key, storedSnapshot);
  return structuredClone(storedSnapshot);
}

export function resetPlanPortfolioMemory(): void {
  planPortfolioMemoryByKey.clear();
}

export function restorePlanPortfolioMemorySnapshot(
  input: AiDecisionInput,
  snapshot: PlanPortfolioSnapshot | undefined,
): void {
  const key = planPortfolioMemoryKey(input);
  if (!snapshot) {
    planPortfolioMemoryByKey.delete(key);
    return;
  }
  if (
    snapshot.side !== input.side ||
    snapshot.profileId !== input.profileId ||
    snapshot.stateVersion > input.playerView.stateVersion
  ) {
    throw new Error("invalid_plan_portfolio_memory_checkpoint");
  }
  planPortfolioMemoryByKey.set(key, structuredClone(snapshot));
}

function planPortfolioMemoryKey(input: AiDecisionInput): string {
  return [
    planPortfolioMemoryContextId(input),
    input.side,
    input.profileId,
  ].join(":");
}

function planPortfolioMemoryContextId(input: AiDecisionInput): string {
  const matchId = input.matchId?.trim();
  if (matchId) return matchId;
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}
