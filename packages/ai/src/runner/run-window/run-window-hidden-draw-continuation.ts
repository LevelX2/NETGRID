import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  type EngineWindowResolution,
  type PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

export function resolvePlanBoundRunnerHiddenDrawChoice(
  context: PlanSchedulerContext,
  previous: ResidentPlanPortfolio | undefined,
): EngineWindowResolution | undefined {
  const choice = context.input.playerView.pendingChoice;
  const continuation = choice?.continuation;
  if (
    context.input.side !== "runner" ||
    continuation?.family !== "runner_hidden_draw_keep_or_top_replacement"
  )
    return undefined;
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
  const optionIds = choice?.options.map((option) => option.id) ?? [];
  const exactBinding =
    choice !== undefined &&
    choice.side === "runner" &&
    choice.kind === "select_option" &&
    choice.visibility === "hidden_info_barrier" &&
    choice.stateVersion === context.input.playerView.stateVersion &&
    choice.sourceCardInstanceId === continuation.sourceCardInstanceId &&
    choice.sourceCardDefinitionId === continuation.sourceCardDefinitionId &&
    choice.minSelections === 1 &&
    choice.maxSelections === 1 &&
    continuation.createdAtStateVersion ===
      context.input.playerView.stateVersion &&
    continuation.originActionId.length > 0 &&
    continuation.sourceCardInstanceId.length > 0 &&
    continuation.sourceCardDefinitionId.length > 0 &&
    continuation.drawnCardInstanceIds.length > 0 &&
    new Set(continuation.drawnCardInstanceIds).size ===
      continuation.drawnCardInstanceIds.length &&
    previous !== undefined &&
    previous.side === "runner" &&
    previous.stateVersion < context.input.playerView.stateVersion &&
    origin !== undefined &&
    origin.selectedAtStateVersion === previous.stateVersion &&
    origin.selectedActionId === continuation.originActionId &&
    origin.immediateChoicePolicy === "trash_lowest_visible_drawn_card" &&
    previous.rootForegroundInstanceId === origin.rootPlanInstanceId &&
    previous.executorInstanceId === origin.executorInstanceId &&
    root !== undefined &&
    executor !== undefined &&
    action !== undefined &&
    action.side === "runner" &&
    action.source === "game_rule" &&
    action.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.choiceRequirements?.length === 1 &&
    requirement?.choiceId === choice.choiceId &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
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
      removalCondition:
        "Resolve a hidden draw replacement only from the immediately preceding Runner plan executor, its exact selected action and the Engine's current private choice contract.",
      ...(executor ? { planInstanceId: executor.instanceId } : {}),
    });
  }
  return {
    actionId: action.actionId,
    reasonCode: "plan_bound_runner_hidden_draw_choice",
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
