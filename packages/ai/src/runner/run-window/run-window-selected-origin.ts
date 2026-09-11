import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type PlanSchedulerResult } from "../../plans/plan-scheduler";
import { runnerEventStartsRunAfterProgramSearch } from "../../runtime/runner-canonical-card-facts";
import { runnerPostBreakStealthLossChoiceBinding } from "./run-window-break-continuation";

export function bindSelectedPlanActionOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
): void {
  if (input.side !== "runner" || result.lane !== "plan") return;
  const rootPlanInstanceId = result.portfolio.rootForegroundInstanceId;
  const executorInstanceId = result.portfolio.executorInstanceId;
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === result.route.head.actionId,
  );
  const selectedCandidate = candidates.find(
    (candidate) => candidate.actionId === result.route.head.actionId,
  );
  const canOpenRunnerDrawReplacement =
    selectedAction?.type === "draw_card" ||
    selectedCandidate?.functionalEffects?.some(
      (effect) => effect.kind === "draw",
    ) === true;
  const canOpenRunnerRunStartOrder =
    selectedAction?.type === "start_run" ||
    (selectedAction?.type === "play_event" &&
      runnerEventStartsRunAfterProgramSearch(
        selectedCandidate?.sourceDefinitionId,
      )) ||
    ((selectedAction?.type === "play_event" ||
      selectedAction?.type === "activated_card_ability") &&
      (selectedAction.payload?.runnerEventRun === true ||
        selectedAction.payload?.runActionKind === "make_run" ||
        selectedAction.payload?.cardImplementationEffectKind === "make_run" ||
        selectedAction.payload?.cardImplementationEffectKind ===
          "secret_spend_guess_then_targeted_bypass_run"));
  const canOpenRunnerVacuumLinkRewind =
    selectedAction?.type === "continue_run" &&
    selectedAction.payload?.sourceDefinitionId === "onr_v1_275_vacuum-link" &&
    Number(selectedAction.payload?.unbrokenSubroutineCount) > 0 &&
    input.playerView.run?.encounteredIce?.definitionId ===
      "onr_v1_275_vacuum-link";
  const postBreakStealthLoss = selectedAction
    ? runnerPostBreakStealthLossChoiceBinding(input, selectedAction)
    : undefined;
  if (
    !canOpenRunnerDrawReplacement &&
    !canOpenRunnerRunStartOrder &&
    !canOpenRunnerVacuumLinkRewind &&
    !postBreakStealthLoss
  )
    return;
  const invalidCurrentPlanAction =
    !rootPlanInstanceId ||
    !executorInstanceId ||
    !selectedAction ||
    selectedAction.side !== "runner" ||
    selectedAction.expiresAtStateVersion !== input.playerView.stateVersion ||
    !result.portfolio.instances.some(
      (instance) =>
        instance.instanceId === rootPlanInstanceId &&
        instance.side === "runner",
    ) ||
    !result.portfolio.instances.some(
      (instance) =>
        instance.instanceId === executorInstanceId &&
        instance.executionState === "executor" &&
        instance.side === "runner",
    );
  if (invalidCurrentPlanAction) {
    if (
      (canOpenRunnerRunStartOrder || canOpenRunnerVacuumLinkRewind) &&
      !canOpenRunnerDrawReplacement
    )
      return;
    throw new PlanResolutionFailure("window_origin_missing", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: [result.route.head.actionId],
      owner: "continuation",
      removalCondition:
        "Persist a possible immediate Runner draw-replacement choice only with the exact selected current draw action, root plan and leaf executor.",
    });
  }
  result.portfolio.selectedActionOrigin = postBreakStealthLoss
    ? {
        rootPlanInstanceId,
        executorInstanceId,
        selectedActionId: selectedAction.actionId,
        selectedAtStateVersion: input.playerView.stateVersion,
        immediateChoicePolicy: "resolve_runner_post_break_stealth_loss",
        sourceStepId: result.route.step.stepId,
        sourceActionType: "break_subroutine",
        breakerInstanceId: postBreakStealthLoss.breakerInstanceId,
        requiredLoss: postBreakStealthLoss.requiredLoss,
        sourceMode: postBreakStealthLoss.sourceMode,
      }
    : canOpenRunnerDrawReplacement
      ? {
          rootPlanInstanceId,
          executorInstanceId,
          selectedActionId: selectedAction.actionId,
          selectedAtStateVersion: input.playerView.stateVersion,
          immediateChoicePolicy: "trash_lowest_visible_drawn_card",
        }
      : canOpenRunnerVacuumLinkRewind
        ? {
            rootPlanInstanceId,
            executorInstanceId,
            selectedActionId: selectedAction.actionId,
            selectedAtStateVersion: input.playerView.stateVersion,
            immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
            sourceStepId: result.route.step.stepId,
            sourceActionType: "continue_run",
            sourceCardInstanceId:
              input.playerView.run!.encounteredIce!.instanceId,
            sourceCardDefinitionId: "onr_v1_275_vacuum-link",
          }
        : {
            rootPlanInstanceId,
            executorInstanceId,
            selectedActionId: selectedAction.actionId,
            selectedAtStateVersion: input.playerView.stateVersion,
            immediateChoicePolicy: "resolve_runner_run_start_order",
            sourceStepId: result.route.step.stepId,
            sourceActionType:
              selectedAction.type === "activated_card_ability"
                ? "activated_card_ability"
                : selectedAction.type === "play_event"
                  ? "play_event"
                  : "start_run",
            continuedThroughStateVersion: input.playerView.stateVersion,
          };
}
