import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";
import { runnerObservedFreeStopEventId } from "../../run-analysis/runner-free-stop-observation";

/** Admission for the pressure owner's information route; current Engine
 * reachability and the known access payoff remain authoritative. */
export function runnerRepeatedFreeStopProbeEvidence(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): string | undefined {
  const action = input.legalActions.find(
    (a) => a.actionId === evaluation.actionId,
  );
  if (
    (evaluation.targetServerId !== "hq" &&
      evaluation.targetServerId !== "rd") ||
    evaluation.runCommitment !== "probe_only" ||
    evaluation.routeQuote?.reachability === "guaranteed_access" ||
    evaluation.accessPayoff !== "unknown" ||
    action?.type !== "start_run" ||
    action.source !== "basic_action"
  )
    return undefined;
  const stoppedEventId = runnerObservedFreeStopEventId(
    input,
    evaluation.targetServerId,
  );
  return stoppedEventId
    ? `runner_central_information_probe_free_stop_already_observed:${evaluation.targetServerId}:${stoppedEventId}`
    : undefined;
}
