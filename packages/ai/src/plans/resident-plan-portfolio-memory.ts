import type { AiDecisionInput } from "@netgrid/shared";
import {
  assertResidentPlanPortfolio,
  RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION,
  type ResidentPlanPortfolio,
} from "./resident-plan-portfolio";
import { PlanResolutionFailure } from "./plan-resolution-failure";

const memory = new Map<string, ResidentPlanPortfolio>();

export function residentPlanPortfolioSnapshot(
  input: AiDecisionInput,
): ResidentPlanPortfolio | undefined {
  const key = memoryKey(input);
  if (input.playerView.winner !== null) {
    memory.delete(key);
    return undefined;
  }
  const snapshot = memory.get(key);
  if (!snapshot) return undefined;
  if (
    snapshot.schemaVersion !== RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION ||
    snapshot.side !== input.side ||
    snapshot.stateVersion > input.playerView.stateVersion
  ) {
    memory.delete(key);
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      removalCondition:
        "Discard incompatible resident portfolio state; no v1 migration is supported.",
    });
  }
  return structuredClone(snapshot);
}

export function rememberResidentPlanPortfolio(
  input: AiDecisionInput,
  snapshot: ResidentPlanPortfolio,
): void {
  if (
    snapshot.schemaVersion !== RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION ||
    snapshot.side !== input.side ||
    snapshot.stateVersion !== input.playerView.stateVersion
  ) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      removalCondition:
        "Persist only a current v2 resident portfolio for the matching side.",
    });
  }
  memory.set(memoryKey(input), structuredClone(snapshot));
}

export function resetResidentPlanPortfolioMemory(): void {
  memory.clear();
}

export function restoreResidentPlanPortfolioMemorySnapshot(
  input: AiDecisionInput,
  snapshot: ResidentPlanPortfolio | undefined,
): void {
  const key = memoryKey(input);
  if (!snapshot) {
    memory.delete(key);
    return;
  }
  if (
    snapshot.schemaVersion !== RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION ||
    snapshot.side !== input.side ||
    snapshot.stateVersion > input.playerView.stateVersion
  ) {
    memory.delete(key);
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      removalCondition:
        "Restore only a same-side resident v2 portfolio captured no later than the checkpoint state.",
    });
  }
  assertResidentPlanPortfolio(snapshot, input.playerView.timingPoint);
  memory.set(key, structuredClone(snapshot));
}

function memoryKey(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  return [
    decisionScope || input.seed,
    input.side,
    input.profileId,
    RESIDENT_PLAN_PORTFOLIO_SCHEMA_VERSION,
  ].join(":");
}
