import type { AiDecisionInput } from "@netgrid/shared";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

/** A payment window cannot rediscover a different parent for its bound action. */
export function preserveCoveragePaymentAncestry(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio,
  next: ResidentPlanPortfolio,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const fail = (): never => {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "support_graph",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Preserve the original coverage payment ancestry only while every exact parent and support need remains resident and intact.",
    });
  };
  const edges: Array<{ before: PlanInstance; after: PlanInstance }> = [];
  const visited = new Set<string>();
  let currentId = pending.executorInstanceId;
  while (true) {
    if (visited.has(currentId)) fail();
    visited.add(currentId);
    const before = previous.instances.find(
      (instance) => instance.instanceId === currentId,
    );
    const after = next.instances.find(
      (instance) => instance.instanceId === currentId,
    );
    if (
      !before ||
      !after ||
      before.side !== "runner" ||
      after.side !== "runner" ||
      before.moduleId !== after.moduleId
    )
      return fail();
    edges.push({ before, after });
    if (!before.parentInstanceId) {
      if (
        before.parentNeedId !== undefined ||
        currentId !== pending.rootPlanInstanceId
      )
        fail();
      break;
    }
    const oldParent = previous.instances.find(
      (instance) => instance.instanceId === before.parentInstanceId,
    );
    const nextParent = next.instances.find(
      (instance) => instance.instanceId === before.parentInstanceId,
    );
    if (
      !oldParent ||
      !nextParent ||
      (before.parentNeedId !== undefined &&
        (!oldParent.openNeedIds.includes(before.parentNeedId) ||
          !nextParent.openNeedIds.includes(before.parentNeedId)))
    )
      fail();
    currentId = before.parentInstanceId;
  }
  // Validate the complete chain before changing any preserved edge. Do not
  // revive removed parents or synthesize their needs from the coverage gap.
  for (const { before, after } of edges) {
    if (before.parentInstanceId !== undefined)
      after.parentInstanceId = before.parentInstanceId;
    else delete after.parentInstanceId;
    if (before.parentNeedId !== undefined)
      after.parentNeedId = before.parentNeedId;
    else delete after.parentNeedId;
  }
}
