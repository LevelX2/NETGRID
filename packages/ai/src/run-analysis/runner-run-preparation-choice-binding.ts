import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import { type PlanSchedulerResult } from "../plans/plan-scheduler";
import {
  runnerActionRequiresTargetedBypassPlan,
  type RunnerTargetedBypassChoiceContinuation,
  type RunnerTargetedBypassCommitment,
} from "../runner/run-window/runner-targeted-bypass-plan";
import {
  runnerActionRequiresTargetedIceTrashPlan,
  type RunnerTargetedIceTrashChoiceContinuation,
  type RunnerTargetedIceTrashCommitment,
} from "../runtime/runner-targeted-ice-trash-plan";
export function bindSelectedRunnerTargetedBypassChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (result.lane !== "plan") return;
  const selectedCandidate = candidates.find(
    (candidate) => candidate.actionId === result.route.head.actionId,
  );
  const requiresTargetedBypassBinding =
    selectedCandidate !== undefined &&
    runnerActionRequiresTargetedBypassPlan(selectedCandidate);
  if (result.route.head.semanticActionType !== "play.runner_event") {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      (instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote"),
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          targetedBypassCommitment?: unknown;
        };
        choiceContinuation?: unknown;
      }
    | undefined;
  const commitment = moduleState?.signal?.targetedBypassCommitment as
    | RunnerTargetedBypassCommitment
    | undefined;
  if (!requiresTargetedBypassBinding && !commitment) return;
  const exactBinding =
    input.side === "runner" &&
    (moduleState?.kind === "central_pressure" ||
      moduleState?.kind === "remote_contest") &&
    commitment?.kind === "targeted_bypass_run" &&
    commitment.ownerModuleId === executor?.moduleId &&
    commitment.sourceActionId === result.route.head.actionId &&
    commitment.plannedAtStateVersion === input.playerView.stateVersion;
  if (!executor || !commitment || !exactBinding) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "A targeted-bypass event must be selected by its exact preflighted central/remote plan and source action.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  moduleState.choiceContinuation = {
    ...commitment,
    family: "runner_targeted_bypass",
    selectedActionId: result.route.head.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
  } satisfies RunnerTargetedBypassChoiceContinuation;
}

export function bindSelectedRunnerTargetedIceTrashChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (result.lane !== "plan") return;
  const selectedCandidate = candidates.find(
    (candidate) => candidate.actionId === result.route.head.actionId,
  );
  const requiresTargetedIceTrashBinding =
    selectedCandidate !== undefined &&
    runnerActionRequiresTargetedIceTrashPlan(selectedCandidate);
  if (result.route.head.semanticActionType !== "play.runner_event") {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      (instance.moduleId === "runner.pressure_central" ||
        instance.moduleId === "runner.contest_remote"),
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: {
          targetedIceTrashCommitment?: unknown;
        };
        choiceContinuation?: unknown;
      }
    | undefined;
  const commitment = moduleState?.signal?.targetedIceTrashCommitment as
    | RunnerTargetedIceTrashCommitment
    | undefined;
  if (!requiresTargetedIceTrashBinding && !commitment) return;
  const exactBinding =
    input.side === "runner" &&
    (moduleState?.kind === "central_pressure" ||
      moduleState?.kind === "remote_contest") &&
    commitment?.kind === "targeted_ice_trash" &&
    commitment.ownerModuleId === executor?.moduleId &&
    commitment.sourceActionId === result.route.head.actionId &&
    commitment.plannedAtStateVersion === input.playerView.stateVersion;
  if (!executor || !commitment || !exactBinding) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "continuation",
      removalCondition:
        "A targeted ICE-trash event must be selected by its exact preflighted central/remote plan, source action and side-safe ICE slot.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  moduleState.choiceContinuation = {
    ...commitment,
    family: "runner_targeted_ice_trash",
    selectedActionId: result.route.head.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
  } satisfies RunnerTargetedIceTrashChoiceContinuation;
}
