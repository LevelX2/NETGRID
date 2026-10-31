import type { AiDecisionInput } from "@netgrid/shared";

import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

/** Preserve a selected run through its mandatory successful-run replacement.
 * This records the current Engine window; it does not choose a payment or
 * admit an older post-run choice without its immediately preceding owner. */
export function reconcileSelectedRunnerSuccessfulReplacementChoice(
  input: AiDecisionInput,
  result: Extract<PlanSchedulerResult, { lane: "engine_window" }>,
  previous: ResidentPlanPortfolio | undefined,
): boolean {
  const run = input.playerView.run;
  const choice = input.playerView.pendingChoice;
  const version = input.playerView.stateVersion;
  const root = previous?.instances.find(
    (instance) => instance.instanceId === previous.rootForegroundInstanceId,
  );
  const executor = previous?.instances.find(
    (instance) => instance.instanceId === previous.executorInstanceId,
  );
  const executorState = executor?.moduleState as
    | { kind?: unknown; signal?: { windowId?: unknown; serverId?: unknown } }
    | undefined;
  const pending = previous?.pendingRunnerCostPenaltySupportOrigin;
  const action =
    input.legalActions.length === 1 ? input.legalActions[0] : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const options = choice?.options.map((option) => option.id) ?? [];
  const events = (input.eventTail ?? []).filter(
    (event) =>
      previous !== undefined &&
      event.stateVersionBefore >= previous.stateVersion &&
      event.stateVersionAfter <= version,
  );
  const event = events[0];
  if (
    input.side !== "runner" ||
    previous?.side !== "runner" ||
    previous.stateVersion !== version - 1 ||
    previous.turnPlanCommitment?.status !== "active" ||
    previous.turnPlanCommitment.sequenceRootPlanInstanceId !==
      root?.instanceId ||
    root?.side !== "runner" ||
    (root.moduleId !== "runner.pressure_central" &&
      root.moduleId !== "runner.contest_remote") ||
    executor?.side !== "runner" ||
    executor.moduleId !== "runner.convert_run_window" ||
    executor.executionState !== "executor" ||
    executor.parentInstanceId !== root.instanceId ||
    executorState?.kind !== "run_window" ||
    !run ||
    run.successful !== true ||
    run.phase !== "access" ||
    run.position?.kind !== "server" ||
    run.position.serverId !== run.attackedServerId ||
    executorState.signal?.windowId !== `run:${run.runId}` ||
    executorState.signal.serverId !== run.attackedServerId ||
    pending?.rootPlanInstanceId !== root.instanceId ||
    pending.executorInstanceId !== executor.instanceId ||
    pending.originalActionId !== "runner.continue_run" ||
    pending.selectedAtStateVersion !== previous.stateVersion ||
    pending.windowId !== undefined ||
    result.portfolio?.rootForegroundInstanceId !== root.instanceId ||
    result.portfolio.executorInstanceId !== executor.instanceId ||
    result.origin.side !== "runner" ||
    result.origin.rootPlanInstanceId !== `run:${run.runId}` ||
    result.origin.leafPlanInstanceId !== "rules.window_resolution" ||
    result.origin.windowKind !== "mandatory_choice" ||
    result.origin.windowId !== `${input.playerView.timingPoint}:${version}` ||
    result.origin.stateVersion !== version ||
    result.origin.timingPoint !== input.playerView.timingPoint ||
    !result.diagnostics.some(
      (item) => item.code === "engine_window_single_legal_resolution",
    ) ||
    choice?.source !==
      `successful_run.credit_loss_spend:${run.runId}:${version}` ||
    choice.choiceId !==
      `successful_run_credit_loss_spend_${run.runId}_${version}` ||
    choice.side !== "runner" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== version ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    action?.actionId !== result.actionId ||
    action.side !== "runner" ||
    action.type !== "resolve_choice" ||
    action.source !== "game_rule" ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.expiresAtStateVersion !== version ||
    action.choiceRequirements?.length !== 1 ||
    requirement?.choiceId !== choice.choiceId ||
    requirement.minSelections !== choice.minSelections ||
    requirement.maxSelections !== choice.maxSelections ||
    requirement.optionIds.length !== options.length ||
    new Set(options).size !== options.length ||
    !options.every((id) => requirement.optionIds.includes(id)) ||
    events.length !== 1 ||
    event?.stateVersionBefore !== previous.stateVersion ||
    event.stateVersionAfter !== version ||
    event.publicPayload.actor !== "runner" ||
    event.publicPayload.actionType !== "continue_run" ||
    event.publicPayload.serverId !== run.attackedServerId
  ) {
    return false;
  }
  result.portfolio.stateVersion = version;
  result.portfolio.pendingRunnerCostPenaltySupportOrigin = {
    rootPlanInstanceId: root.instanceId,
    executorInstanceId: executor.instanceId,
    sourceStepId: result.origin.windowId,
    originalActionId: action.actionId,
    selectedAtStateVersion: version,
  };
  return true;
}
