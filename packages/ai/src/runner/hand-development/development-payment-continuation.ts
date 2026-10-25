import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import type {
  DevelopmentState,
  RunnerDevelopmentSignal,
} from "./development-types";

/** Payment support completes an already selected search; rediscovery cannot
 * replace its exact source, target or selected version with a fresh proposal. */
export function preserveSelectedRunnerDevelopmentSearchAcrossPaymentStep(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "plan" | "engine_window" }>,
  previous: ResidentPlanPortfolio | undefined,
  pending: NonNullable<
    ResidentPlanPortfolio["pendingRunnerCostPenaltySupportOrigin"]
  >,
): void {
  const oldExecutor = previous?.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  );
  if (oldExecutor?.moduleId !== "runner.develop_board_and_hand") return;
  const oldState = oldExecutor.moduleState as DevelopmentState | undefined;
  const keys = ["programSearchCommitment", "recoverySearchCommitment"] as const;
  const activeKeys = keys.filter(
    (key) => oldState?.signal?.[key] !== undefined,
  );
  if (activeKeys.length === 0) return;
  const key = activeKeys[0]!;
  const selected = oldState?.signal?.[key];
  const nextExecutor = result.portfolio?.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  );
  const nextState = nextExecutor?.moduleState as DevelopmentState | undefined;
  const rediscovered = nextState?.signal?.[key];
  const sameTarget =
    selected &&
    rediscovered &&
    selected.sourceCardInstanceId === rediscovered.sourceCardInstanceId &&
    selected.sourceDefinitionId === rediscovered.sourceDefinitionId &&
    selected.targetDefinitionId === rediscovered.targetDefinitionId &&
    selected.targetPurpose === rediscovered.targetPurpose &&
    (!("targetCardInstanceId" in selected) ||
      ("targetCardInstanceId" in rediscovered &&
        selected.targetCardInstanceId === rediscovered.targetCardInstanceId &&
        "searchFilter" in rediscovered &&
        selected.searchFilter === rediscovered.searchFilter));
  let ancestor = oldExecutor;
  const visited = new Set<string>();
  while (ancestor.parentInstanceId && !visited.has(ancestor.instanceId)) {
    visited.add(ancestor.instanceId);
    const parent = previous?.instances.find(
      (i) => i.instanceId === ancestor.parentInstanceId,
    );
    if (!parent) break;
    ancestor = parent;
  }
  if (
    activeKeys.length !== 1 ||
    oldState?.kind !== "development" ||
    oldState.signal.phase !== "execute" ||
    nextState?.kind !== "development" ||
    nextState.signal.phase !== "execute" ||
    nextExecutor?.moduleId !== oldExecutor.moduleId ||
    ancestor.instanceId !== pending.rootPlanInstanceId ||
    !sameTarget ||
    selected?.selectedActionId !== pending.originalActionId ||
    selected.plannedAtStateVersion !== pending.selectedAtStateVersion ||
    selected.selectedAtStateVersion !== pending.selectedAtStateVersion ||
    selected.engineContinuationAtStateVersion !== undefined ||
    !oldState.signal.actionIds.includes(pending.originalActionId) ||
    input.playerView.stateVersion <= pending.selectedAtStateVersion
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [pending.originalActionId],
      owner: "support_graph",
      planInstanceId: pending.executorInstanceId,
      stepId: pending.sourceStepId,
      removalCondition:
        "Preserve the unchanged selected development search source, target, root and action version through the exact Engine payment window.",
    });
  }
  const signal: RunnerDevelopmentSignal = { ...nextState.signal };
  if (key === "programSearchCommitment")
    signal.programSearchCommitment = structuredClone(
      oldState.signal.programSearchCommitment!,
    );
  else
    signal.recoverySearchCommitment = structuredClone(
      oldState.signal.recoverySearchCommitment!,
    );
  nextExecutor.moduleState = { ...nextState, signal };
}
