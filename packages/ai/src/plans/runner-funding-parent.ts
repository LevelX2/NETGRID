import type { PlanInstance } from "./plan-kernel-types";
import type {
  RunnerPressureSignal,
  RunnerRemoteContestSignal,
} from "./runner-tactical-plan-contracts";

export function runnerRunFundingParentHasCurrentNeed(
  parents: {
    centralPressure: readonly RunnerPressureSignal[];
    remoteContests: readonly RunnerRemoteContestSignal[];
  },
  need: { parentPlanInstanceId: string; needId: string },
): boolean {
  return (
    parents.centralPressure.some(
      (signal) =>
        need.parentPlanInstanceId ===
          `plan:runner.pressure_central:${encodeURIComponent(signal.pressureId)}` &&
        signal.supportNeedId === need.needId &&
        signal.marginalValue > 0,
    ) ||
    parents.remoteContests.some(
      (signal) =>
        need.parentPlanInstanceId ===
          `plan:runner.contest_remote:${encodeURIComponent(signal.contestId)}` &&
        signal.supportNeedId === need.needId &&
        signal.marginalValue > 0,
    )
  );
}

export function runnerFundingParentMaterialValue(
  candidate: PlanInstance,
  need: { parentPlanInstanceId: string; needId: string },
): number | undefined {
  if (
    candidate.instanceId !== need.parentPlanInstanceId ||
    (candidate.viability !== "ready" && candidate.viability !== "blocked")
  ) {
    return undefined;
  }
  const moduleState = candidate.moduleState as
    | {
        signal?: {
          supportNeedId?: unknown;
          marginalValue?: unknown;
          value?: unknown;
        };
      }
    | undefined;
  const waitsOnlyForThisFunding =
    candidate.blockers.length === 0 ||
    candidate.blockers.every(
      (blocker) =>
        blocker.code === "waiting_for_bound_funding_support" &&
        blocker.resumeCondition?.code === need.needId,
    );
  if (
    !waitsOnlyForThisFunding ||
    moduleState?.signal?.supportNeedId !== need.needId
  ) {
    return undefined;
  }
  if (
    typeof moduleState.signal.marginalValue === "number" &&
    moduleState.signal.marginalValue > 0
  ) {
    return moduleState.signal.marginalValue;
  }
  return typeof moduleState.signal.value === "number" &&
    moduleState.signal.value > 0
    ? moduleState.signal.value
    : undefined;
}
