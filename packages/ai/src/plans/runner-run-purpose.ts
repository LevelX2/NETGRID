import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { runnerTerminalContestThreat } from "../runtime/runner-terminal-contest-threat";
export const INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET = 1;

export function runPurposeForEvaluation(
  evaluation: RunnerRunTargetEvaluation,
): "access" | "multiaccess" | "information" | "contest" {
  if (evaluation.scoreThreat) return "contest";
  if (
    evaluation.runCommitment === "probe_only" &&
    evaluation.accessPayoff === "unknown"
  ) {
    return "information";
  }
  if (evaluation.multiaccessAvailable) return "multiaccess";
  if (
    evaluation.recommendation === "run_if_free" &&
    (evaluation.knownAccessState === "unknown" ||
      evaluation.knownAccessState === "fresh")
  ) {
    return "information";
  }
  return evaluation.targetKind === "remote" ? "contest" : "access";
}

export function runnerInformationProbeCanUseQuotedPath(
  evaluation: RunnerRunTargetEvaluation,
  directlyConvertible: boolean,
  terminalCentralAccess = false,
): boolean {
  if (
    evaluation.pathPassability !== "reachable" ||
    (evaluation.routeQuote?.fundingGap ?? 0) > 0
  ) {
    return false;
  }
  if (
    terminalCentralAccess ||
    evaluation.pathCost <= INFORMATION_PROBE_KNOWN_PATH_CREDIT_BUDGET
  ) {
    return true;
  }
  if (!directlyConvertible) return false;
  return evaluation.evidence.some(
    (entry) =>
      entry === "central_memory_payoff:partial_known" ||
      entry === "remote_memory_payoff:partial_unknown",
  );
}

export function runnerTerminalRemoteUnreachableCentralLastChance(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
): boolean {
  if (
    input.playerView.own.agendaPoints <
      input.playerView.agendaPointsToWin - 1 ||
    (evaluation.targetServerId !== "hq" &&
      evaluation.targetServerId !== "rd") ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.routeQuote?.reachability === "no_access" ||
    evaluation.prerunReserveQuote?.status === "blocked" ||
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.accessPayoffContestable === false ||
    evaluation.creditsAfterRun < 0 ||
    evaluation.visibleTraceTagHazardUnavoidable === true ||
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) > 0
  ) {
    return false;
  }
  const threat = runnerTerminalContestThreat(input);
  if (!threat || threat.remoteServerIds.length === 0) return false;

  return threat.remoteServerIds.every((serverId) => {
    const remoteEvaluations = runTargets.filter(
      (candidate) =>
        candidate.targetKind === "remote" &&
        candidate.targetServerId === serverId,
    );
    return (
      remoteEvaluations.length > 0 &&
      remoteEvaluations.every(
        (candidate) => candidate.pathPassability !== "reachable",
      )
    );
  });
}
