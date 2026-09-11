import { type AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
  type PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

export function advanceSelectedRunnerRunStartOrderOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  previous: ResidentPlanPortfolio | undefined,
): void {
  const origin = previous?.selectedActionOrigin;
  if (
    input.side !== "runner" ||
    result.lane !== "engine_window" ||
    !result.portfolio ||
    !result.diagnostics.some((diagnostic) =>
      [
        "plan_bound_runner_run_start_order_choice",
        "plan_bound_runner_delayed_program_search_choice",
        "plan_bound_runner_event_install_memory_choice",
      ].includes(diagnostic.code),
    ) ||
    origin?.immediateChoicePolicy !== "resolve_runner_run_start_order" ||
    result.origin.rootPlanInstanceId !== origin.rootPlanInstanceId ||
    result.origin.leafPlanInstanceId !== origin.executorInstanceId
  ) {
    return;
  }
  result.portfolio.stateVersion = input.playerView.stateVersion;
  result.portfolio.selectedActionOrigin = {
    ...structuredClone(origin),
    continuedThroughStateVersion: input.playerView.stateVersion,
  };
}

export function resolvePlanBoundRunnerRunStartOrderChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  if (
    context.input.side !== "runner" ||
    choice?.kind !== "select_cards" ||
    !choice.source.startsWith("runner_run_start.order:")
  ) {
    return undefined;
  }
  const origin = previous?.selectedActionOrigin;
  const executor = previous?.instances.find(
    (instance) =>
      instance.instanceId === origin?.executorInstanceId &&
      instance.executionState === "executor",
  );
  const root = previous?.instances.find(
    (instance) => instance.instanceId === origin?.rootPlanInstanceId,
  );
  const choiceActions = context.input.legalActions.filter(
    (action) => action.type === "resolve_choice",
  );
  const action = choiceActions.length === 1 ? choiceActions[0] : undefined;
  const [requirement] = action?.choiceRequirements ?? [];
  const optionIds = choice.options.map((option) => option.id);
  const sourceRunId = /^runner_run_start\.order:([^:\s]+)$/.exec(
    choice.source,
  )?.[1];
  const originIsRunStartOrder =
    origin?.immediateChoicePolicy === "resolve_runner_run_start_order";
  const continuationEvents = (context.input.eventTail ?? []).filter(
    (event) =>
      originIsRunStartOrder &&
      event.stateVersionBefore >= origin.selectedAtStateVersion &&
      // The setup snapshot (v0 -> v0) is not a selected action transition.
      event.stateVersionAfter > origin.selectedAtStateVersion &&
      event.stateVersionAfter <= context.input.playerView.stateVersion,
  );
  const exactRunStartContinuation =
    originIsRunStartOrder &&
    continuationEvents.length >= 1 &&
    continuationEvents[0]?.stateVersionBefore ===
      origin.selectedAtStateVersion &&
    continuationEvents[0]?.publicPayload?.actor === "runner" &&
    continuationEvents[0]?.publicPayload?.actionType ===
      origin.sourceActionType &&
    continuationEvents.every(
      (event, index) =>
        event.stateVersionAfter === event.stateVersionBefore + 1 &&
        (index === 0 ||
          (continuationEvents[index - 1]?.stateVersionAfter ===
            event.stateVersionBefore &&
            event.publicPayload?.actor === "runner" &&
            event.publicPayload?.actionType === "resolve_choice")),
    ) &&
    continuationEvents.at(-1)?.stateVersionAfter ===
      context.input.playerView.stateVersion;
  const exactBinding =
    originIsRunStartOrder &&
    choice.side === "runner" &&
    choice.choiceId ===
      `runner_run_start_order_${context.input.playerView.stateVersion}` &&
    sourceRunId !== undefined &&
    sourceRunId === context.input.playerView.run?.runId &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion === context.input.playerView.stateVersion - 1 &&
    origin.selectedAtStateVersion <= previous.stateVersion &&
    origin.continuedThroughStateVersion === previous.stateVersion &&
    exactRunStartContinuation &&
    ((origin.sourceActionType === "start_run" &&
      origin.selectedActionId.startsWith("runner.start_run.")) ||
      (origin.sourceActionType === "play_event" &&
        origin.selectedActionId.startsWith("runner.play_event.")) ||
      (origin.sourceActionType === "activated_card_ability" &&
        origin.selectedActionId.startsWith(
          "runner.activated_card_ability.",
        ))) &&
    origin.sourceStepId.trim().length > 0 &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root?.side === "runner" &&
    executor?.side === "runner" &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === optionIds.length &&
    optionIds.every((optionId) => requirement.optionIds.includes(optionId));
  if (!exactBinding || !action || !previous || !origin) {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: choiceActions.map(
        (legalAction) => legalAction.actionId,
      ),
      owner: "continuation",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
      removalCondition:
        "Resolve Runner run-start ordering only from the exact plan-owned start-run route and its contiguous same-run ordering choices, exact root and executor, active run and complete current Engine choice contract.",
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_run_start_order_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
      side: "runner",
      windowKind: "mandatory_choice",
      windowId: choice.choiceId,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
    },
  };
}
