import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
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
