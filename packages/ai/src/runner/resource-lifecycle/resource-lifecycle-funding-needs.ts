import { planInstanceIdForProposal } from "../../plans/plan-instance";
import type { RunnerFundingNeedSignal } from "../../plans/runner-funding-contracts";
import type { RunnerResourceLifecycleSignal } from "./resource-lifecycle-types";

export function runnerResourceLifecycleFundingNeeds(
  resourceLifecycle: readonly RunnerResourceLifecycleSignal[],
  currentCredits: number,
  stateVersion: number,
): RunnerFundingNeedSignal[] {
  return resourceLifecycle.flatMap((signal) => {
    if (
      !signal.supportNeedId ||
      (signal.marginalValue ?? 0) <= 0 ||
      signal.leavePlayPaymentAmount === undefined ||
      signal.fundingGap === undefined ||
      signal.fundingGap <= 0 ||
      !signal.fundingRouteAssessment ||
      !signal.fundingRouteActionIds ||
      signal.fundingRouteActionIds.length === 0
    ) {
      return [];
    }
    return [
      {
        kind: "parent_plan_support" as const,
        needId: signal.supportNeedId,
        parentPlanInstanceId: planInstanceIdForProposal({
          moduleId: "runner.resource_lifecycle",
          dedupeKey: signal.lifecycleId,
        }),
        driver: {
          kind: "resource_lifecycle" as const,
          targetId: signal.sourceCardInstanceId,
          reasonCode: "fund_exact_lifecycle_leave_play_payment",
        },
        targetCredits: signal.leavePlayPaymentAmount,
        currentCreditsAtRevalidation: currentCredits,
        gap: signal.fundingGap,
        priorityClass: "P5" as const,
        revalidation: {
          stateVersion: stateVersion,
          status: "material_parent_open" as const,
        },
        routeActionIds: signal.fundingRouteActionIds,
        routeAssessment: signal.fundingRouteAssessment,
        evidenceCode:
          signal.evidenceCodes[0] ??
          "runner_resource_lifecycle_exact_funding_support",
      },
    ];
  });
}
