import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type PlanSchedulerResult } from "../../plans/plan-scheduler";
import { runPurposeForEvaluation } from "../../plans/runner-run-purpose";
import type {
  RunnerPressureSignal,
  RunnerRemoteContestSignal,
} from "../../plans/runner-tactical-plan-contracts";
import {
  accessCommitmentForEvaluation,
  runRiskContractForEvaluation,
} from "../../run-analysis/runner-plan-run-route-facts";
import type { RunnerRunTargetEvaluation } from "../../run-analysis/runner-run-target-types";
import { runnerEventStartsRunAfterProgramSearch } from "../../runtime/runner-canonical-card-facts";
import { runnerPostBreakStealthLossChoiceBinding } from "./run-window-break-continuation";

export function bindSelectedPlanActionOrigin(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[] = [],
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
  const selectedRunTarget = canOpenRunnerRunStartOrder
    ? runTargets.find((target) => target.actionId === selectedAction?.actionId)
    : undefined;
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
      !canOpenRunnerDrawReplacement &&
      !selectedRunTarget?.fortIceTrashObjective
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
        "Persist a Runner action continuation only with the exact selected current action, root plan and leaf executor.",
    });
  }
  if (selectedRunTarget) {
    const executor = result.portfolio.instances.find(
      (instance) => instance.instanceId === executorInstanceId,
    );
    const moduleState = executor?.moduleState as
      | { kind: "central_pressure"; signal: RunnerPressureSignal }
      | { kind: "remote_contest"; signal: RunnerRemoteContestSignal }
      | undefined;
    if (
      (moduleState?.kind === "central_pressure" ||
        moduleState?.kind === "remote_contest") &&
      moduleState.signal.serverId === selectedRunTarget.targetServerId &&
      (selectedRunTarget.fortIceTrashObjective ||
        moduleState.signal.accessCommitment?.fortIceTrashObjective)
    ) {
      // Sibling routes on the same fort can share one resident plan. Only
      // the selected action's access/replacement and risk facts may persist.
      const purpose = runPurposeForEvaluation(selectedRunTarget);
      moduleState.signal.accessCommitment = accessCommitmentForEvaluation(
        input,
        selectedRunTarget,
      );
      const riskContract = runRiskContractForEvaluation(
        input,
        selectedRunTarget,
      );
      if (riskContract) moduleState.signal.runRiskContract = riskContract;
      else delete moduleState.signal.runRiskContract;
      if (moduleState.kind === "central_pressure") {
        moduleState.signal.purpose = purpose === "contest" ? "access" : purpose;
      } else {
        moduleState.signal.purpose = selectedRunTarget.fortIceTrashObjective
          ? "access"
          : purpose === "information"
            ? "information"
            : "contest";
      }
    }
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
