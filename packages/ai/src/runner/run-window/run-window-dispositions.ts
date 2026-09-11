import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type PlanActionDisposition } from "../../plans/plan-scheduler";
import { type RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import { runnerRestrictedRunSequenceAction } from "./run-window-action-facts";

export function addRunnerRunWindowDispositions({
  domain,
  input,
  candidates,
  add,
}: {
  domain: Pick<RunnerPlanDomain, "runWindows" | "remoteContests">;
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  add: (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => void;
}) {
  for (const window of domain.runWindows) {
    for (const [actionId, assessment] of Object.entries(
      window.actionAssessments ?? {},
    )) {
      if (assessment.admissible) continue;
      // An optional restricted run can already be an exact executable Remote
      // route. The run-window's local reserve/value rejection is not a global
      // veto of that owner-certified route (for example a matchpoint contest).
      // Actual route safety remains part of the Remote action assessment.
      if (
        !input.playerView.run &&
        candidates.some(
          (candidate) =>
            candidate.actionId === actionId &&
            runnerRestrictedRunSequenceAction(input, candidate) !== undefined,
        ) &&
        domain.remoteContests.some(
          (signal) =>
            signal.runActionAssessments[actionId]?.verdict === "executable",
        )
      ) {
        continue;
      }
      add(
        actionId,
        "runner.convert_run_window",
        assessment.evidenceCodes[0] ??
          "runner_run_window_action_explicitly_excluded",
      );
    }
  }
}
