import type { AiDecisionInput } from "@netgrid/shared";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import { runnerUnfundedExposedIceRezCredits } from "../run-window/run-window-expose-viewing";

export function bindSelectedRunnerExposeInformationMemory(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (input.side !== "runner" || result.lane !== "plan") return;
  const executor = result.portfolio.instances.find(
    (instance) => instance.instanceId === result.portfolio.executorInstanceId,
  );
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const targetIceInstanceId = selectedAction?.payload?.iceId;
  const sourceCardInstanceId = selectedAction?.payload?.cardId;
  const serverId = input.playerView.run?.attackedServerId;
  if (
    executor?.moduleId === "runner.convert_run_window" &&
    selectedAction?.type === "trigger_ability" &&
    selectedAction.payload?.approachIceExposeViewDecision === "finish"
  ) {
    const previouslyUnfundedRezCredits = runnerUnfundedExposedIceRezCredits(input);
    const records = result.portfolio.runnerExposeInformationMemory;
    if (previouslyUnfundedRezCredits !== undefined && records) {
      result.portfolio.runnerExposeInformationMemory = records.map((record) =>
        record.targetIceInstanceId === targetIceInstanceId &&
        record.sourceCardInstanceId === sourceCardInstanceId &&
        record.serverId === serverId &&
        record.selectedAtStateVersion + 1 === input.playerView.stateVersion
          ? { ...record, previouslyUnfundedRezCredits }
          : record,
      );
    }
    return;
  }
  if (
    executor?.moduleId !== "runner.expose_information" ||
    selectedAction?.type !== "trigger_ability" ||
    selectedAction.payload?.approachIceExposeDecision !== "expose" ||
    typeof targetIceInstanceId !== "string" ||
    typeof sourceCardInstanceId !== "string" ||
    typeof serverId !== "string" ||
    selectedAction.expiresAtStateVersion !== input.playerView.stateVersion
  ) {
    return;
  }
  const previousRecords = result.portfolio.runnerExposeInformationMemory ?? [];
  result.portfolio.runnerExposeInformationMemory = [
    ...previousRecords.filter(
      (record) => record.targetIceInstanceId !== targetIceInstanceId,
    ),
    {
      targetIceInstanceId,
      serverId,
      sourceCardInstanceId,
      selectedAtStateVersion: input.playerView.stateVersion,
    },
  ].sort((left, right) =>
    left.targetIceInstanceId.localeCompare(right.targetIceInstanceId),
  );
  result.diagnostics.push({
    stage: "route",
    code: "runner_expose_information_memory_bound",
    instanceId: executor.instanceId,
    moduleId: executor.moduleId,
  });
}
