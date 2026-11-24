import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import type { PlanSchedulerResult } from "../plans/plan-scheduler";
import type {
  RunnerPressureSignal,
  RunnerRemoteContestSignal,
} from "../plans/runner-tactical-plan-contracts";
import {
  runnerActionRequiresTargetedBypassPlan,
  type RunnerTargetedBypassChoiceContinuation,
} from "../runner/run-window/runner-targeted-bypass-plan";
import {
  runnerActionRequiresTargetedIceTrashPlan,
  type RunnerTargetedIceTrashChoiceContinuation,
} from "../runtime/runner-targeted-ice-trash-plan";

type TargetedRunPreparationState = {
  kind: "central_pressure" | "remote_contest";
  signal: RunnerPressureSignal | RunnerRemoteContestSignal;
  choiceContinuation?:
    | RunnerTargetedBypassChoiceContinuation
    | RunnerTargetedIceTrashChoiceContinuation;
};

export function bindSelectedRunnerTargetedPreparationChoiceContinuation(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (result.lane !== "plan") return;
  const { head } = result.route;
  const selected = candidates.find(
    (candidate) => candidate.actionId === head.actionId,
  );
  const { portfolio } = result;
  const executor = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.executorInstanceId,
  );
  const state = executor?.moduleState as
    | TargetedRunPreparationState
    | undefined;
  const bypassCommitment = state?.signal?.targetedBypassCommitment;
  const trashCommitment = state?.signal?.targetedIceTrashCommitment;
  const bypass =
    bypassCommitment?.sourceActionId === head.actionId ||
    (selected !== undefined &&
      runnerActionRequiresTargetedBypassPlan(selected));
  const trash =
    trashCommitment?.sourceActionId === head.actionId ||
    (selected !== undefined &&
      runnerActionRequiresTargetedIceTrashPlan(selected));
  if (!bypass && !trash) return;
  const commitment = bypass ? bypassCommitment : trashCommitment;
  if (
    input.side !== "runner" ||
    !selected ||
    (bypass && trash) ||
    portfolio.side !== input.side ||
    portfolio.stateVersion !== input.playerView.stateVersion ||
    head.stateVersion !== input.playerView.stateVersion ||
    head.actionType !== "play_event" ||
    head.semanticActionType !== selected.semanticActionType ||
    !executor ||
    executor.executionState !== "executor" ||
    executor.instanceId !== head.planInstanceId ||
    (executor.moduleId === "runner.pressure_central"
      ? state?.kind !== "central_pressure"
      : executor.moduleId !== "runner.contest_remote" ||
        state?.kind !== "remote_contest") ||
    !state ||
    !commitment ||
    commitment.kind !==
      (bypass ? "targeted_bypass_run" : "targeted_ice_trash") ||
    commitment.ownerModuleId !== executor.moduleId ||
    commitment.ownerDedupeKey !== executor.dedupeKey ||
    commitment.sourceActionId !== head.actionId ||
    commitment.sourceCardInstanceId !== selected.sourceCardInstanceId ||
    commitment.sourceDefinitionId !== selected.sourceDefinitionId ||
    commitment.plannedAtStateVersion !== input.playerView.stateVersion
  ) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [head.actionId],
      owner: "continuation",
      removalCondition:
        "Bind the selected targeted run preparation to its current central or remote executor, source action and exact preflighted ICE.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  const binding = {
    selectedActionId: head.actionId,
    selectedAtStateVersion: input.playerView.stateVersion,
  };
  state.choiceContinuation =
    commitment.kind === "targeted_bypass_run"
      ? { ...commitment, ...binding, family: "runner_targeted_bypass" }
      : { ...commitment, ...binding, family: "runner_targeted_ice_trash" };
}
