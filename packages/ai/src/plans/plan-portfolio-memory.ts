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
  return snapshot;
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
  planPortfolioMemoryByKey.set(key, snapshot);
  return snapshot;
}

export function resetPlanPortfolioMemory(): void {
  planPortfolioMemoryByKey.clear();
}

function planPortfolioMemoryKey(input: AiDecisionInput): string {
  return [
    planPortfolioMemoryContextId(input),
    input.side,
    input.profileId,
  ].join(":");
}

function planPortfolioMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}
