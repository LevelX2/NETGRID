import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { type ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import { uniqueBy } from "../runtime/collection";
import { runnerRunLockReleaseProjection } from "../runtime/runner-run-lock-release-score";
type RunnerRunLockReleaseRoute = {
  actionId?: string;
  serverId: string;
  terminal: boolean;
  ready: boolean;
  value: number;
  targetCredits: number;
  fundingGap: number;
  supportNeedId?: string;
  parentPlanInstanceId: string;
  evidenceCode: string;
  projectionEvidenceCode: string;
};

export function runnerRunLockReleaseRoutes(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  previous: ResidentPlanPortfolio | undefined,
): RunnerRunLockReleaseRoute[] {
  const preferredServerIds = runnerRunLockPreferredServerIds(previous);
  const action = input.legalActions.find(
    (entry) =>
      entry.type === "trigger_ability" &&
      (entry.payload?.abilityId === "pay_to_remove_run_lock" ||
        entry.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock"),
  );
  const projection = runnerRunLockReleaseProjection(
    input,
    action,
    preferredServerIds,
  );
  if (!projection) return [];
  const candidate = action
    ? candidates.find((entry) => entry.actionId === action.actionId)
    : undefined;
  if (action && !candidate) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      unresolvedActionIds: [action.actionId],
      owner: "plan_module",
      removalCondition:
        "A legal run-lock release must have an exact semantic candidate before it can be bound to its parent Run plan.",
    });
  }
  const remote = projection.serverId.startsWith("remote_");
  const dedupeKey = remote
    ? `remote:${projection.serverId}`
    : `central:${projection.serverId}`;
  const parentModule = remote
    ? "runner.contest_remote"
    : "runner.pressure_central";
  const supportNeedId =
    projection.status === "blocked_funding"
      ? `run-lock-support:${dedupeKey}`
      : undefined;
  return [
    {
      ...(candidate ? { actionId: candidate.actionId } : {}),
      serverId: projection.serverId,
      terminal: projection.terminal,
      ready: projection.status === "ready",
      value: projection.value,
      targetCredits: projection.targetCredits,
      fundingGap: projection.fundingGap,
      ...(supportNeedId ? { supportNeedId } : {}),
      parentPlanInstanceId: `plan:${parentModule}:${encodeURIComponent(dedupeKey)}`,
      evidenceCode: projection.terminal
        ? "runner_matchpoint_run_lock_release"
        : "runner_viable_followup_run_lock_release",
      projectionEvidenceCode: [
        projection.terminal
          ? "runner_matchpoint_run_lock_release"
          : "runner_viable_followup_run_lock_release",
        `run_lock_release_projection_status:${projection.status}`,
        `run_lock_release_target_credits:${projection.targetCredits}`,
        `run_lock_release_funding_gap:${projection.fundingGap}`,
        ...projection.evidence,
      ].join("|"),
    },
  ];
}

export function runnerRunLockPreferredServerIds(
  previous: ResidentPlanPortfolio | undefined,
): string[] {
  const relevant = (previous?.instances ?? []).filter(
    (instance) =>
      (instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote") &&
      instance.target?.kind === "server" &&
      instance.viability !== "completed" &&
      instance.viability !== "abandoned",
  );
  return uniqueBy(
    [
      ...relevant
        .filter(
          (instance) =>
            instance.instanceId === previous?.executorInstanceId ||
            instance.instanceId === previous?.rootForegroundInstanceId,
        )
        .map((instance) => instance.target!.id),
      ...relevant.map((instance) => instance.target!.id),
    ],
    (serverId) => serverId,
  );
}
