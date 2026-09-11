import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { PlanSchedulerContext } from "./plan-scheduler";
import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";
import { visibleRunnerTraceThreatOnServer } from "../runner/hand-development/runner-persistent-install-evaluation";
export function runnerCardRunHasVisibleDifferentialPayoff(
  input: PlanSchedulerContext["input"],
  candidate: ActionSemanticCandidate,
  serverId: string,
  runTargetEvaluations?: readonly RunnerRunTargetEvaluation[],
): boolean {
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (!server) return false;
  if (candidate.conditions.some((condition) => condition.status === "absent")) {
    return false;
  }
  if (
    candidate.conditions.some(
      (condition) => condition.kind === "requires_encounter",
    ) &&
    server.ice.length === 0
  ) {
    return false;
  }
  if (
    candidate.conditions.some(
      (condition) => condition.kind === "requires_rezzed_ice",
    ) &&
    !server.ice.some((ice) => ice.rezzed === true)
  ) {
    return false;
  }
  return (candidate.effectTargets ?? []).some((target) => {
    if (
      target === "make_run" ||
      target === "make_chosen_server_run" ||
      (target.startsWith("make_") && target.endsWith("_run")) ||
      target === "ends_run_after_effect" ||
      target === "run.successful_run_self_tag"
    ) {
      return false;
    }
    if (target === "derez" || target.includes("trash_rezzed_ice_on_fort")) {
      return server.ice.some((ice) => ice.rezzed === true);
    }
    if (target === "bypass_first_ice") {
      if (server.ice.length === 0) return false;
      const bypassEvaluation = runTargetEvaluations?.find(
        (evaluation) => evaluation.actionId === candidate.actionId,
      );
      if (!bypassEvaluation) return true;
      const directRunDominates = runTargetEvaluations?.some(
        (evaluation) =>
          evaluation.actionId !== bypassEvaluation.actionId &&
          evaluation.runActionProjection.sourceKind === "basic_action" &&
          evaluation.targetServerId === bypassEvaluation.targetServerId &&
          evaluation.accessServerId === bypassEvaluation.accessServerId &&
          runnerBasicRunDominatesBypassRoute(evaluation, bypassEvaluation),
      );
      return directRunDominates !== true;
    }
    if (target === "run.trace_link_bonus") {
      return visibleRunnerTraceThreatOnServer(input, serverId);
    }
    return true;
  });
}

function runnerBasicRunDominatesBypassRoute(
  directRun: RunnerRunTargetEvaluation,
  bypassRun: RunnerRunTargetEvaluation,
): boolean {
  if (
    directRun.pathPassability !== "reachable" ||
    bypassRun.pathPassability !== "reachable" ||
    directRun.recommendation !== bypassRun.recommendation ||
    directRun.accessPayoff !== bypassRun.accessPayoff ||
    directRun.knownAccessState !== bypassRun.knownAccessState ||
    directRun.multiaccessAvailable !== bypassRun.multiaccessAvailable ||
    directRun.runCommitment !== bypassRun.runCommitment ||
    directRun.creditsAfterRun < bypassRun.creditsAfterRun ||
    (directRun.unknownUnrezzedIceCount ?? 0) >
      (bypassRun.unknownUnrezzedIceCount ?? 0) ||
    (directRun.visibleIceHazardPenalty ?? 0) >
      (bypassRun.visibleIceHazardPenalty ?? 0) ||
    (directRun.futureClicksLost ?? 0) > (bypassRun.futureClicksLost ?? 0) ||
    (directRun.expectedTagsFromVisibleIce ?? 0) >
      (bypassRun.expectedTagsFromVisibleIce ?? 0) ||
    (directRun.unavoidableVisibleIceHazardCount ?? 0) >
      (bypassRun.unavoidableVisibleIceHazardCount ?? 0) ||
    directRun.visibleTraceTagHazardUnavoidable === true ||
    directRun.randomBreakOrDamageRiskAssessment !== undefined ||
    bypassRun.randomBreakOrDamageRiskAssessment !== undefined
  ) {
    return false;
  }
  return true;
}
