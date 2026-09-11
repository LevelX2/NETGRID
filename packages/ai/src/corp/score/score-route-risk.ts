import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  compareExactProbabilities,
  type ExactProbability,
} from "../../runtime/corp-score-protection-assessment";

/** Score-owned interpretation of the exact Defense quote, never an ICE-count proxy. */
export function scoreRouteExposure(
  project: CorpScoreProjectSignal,
  stateVersion: number,
):
  | {
      knowledge: "known";
      probability: ExactProbability;
      runnerCreditsRemaining: number;
    }
  | {
      knowledge: "unknown";
      reason: "missing_or_unbound_protection" | "unknown_protection";
    } {
  if (project.sameTurnCloseout)
    return {
      knowledge: "known",
      probability: { numerator: 0, denominator: 1 },
      runnerCreditsRemaining: 0,
    };
  const need = project.protectionNeed;
  if (
    !need ||
    need.parentProjectId !== project.projectId ||
    need.targetServerId !== project.serverId ||
    need.observedAtStateVersion !== stateVersion
  ) {
    return { knowledge: "unknown", reason: "missing_or_unbound_protection" };
  }
  const baseline = need.baseline;
  if (
    baseline?.knowledge !== "known" ||
    !Number.isSafeInteger(
      baseline.protection.runnerCreditsRemainingOnBestAccessPath,
    ) ||
    baseline.protection.runnerCreditsRemainingOnBestAccessPath < 0 ||
    compareExactProbabilities(
      baseline.protection.runnerAccessSuccessProbability,
      { numerator: 0, denominator: 1 },
    ) === undefined
  ) {
    return { knowledge: "unknown", reason: "unknown_protection" };
  }
  return {
    knowledge: "known",
    probability: baseline.protection.runnerAccessSuccessProbability,
    runnerCreditsRemaining:
      baseline.protection.runnerCreditsRemainingOnBestAccessPath,
  };
}

export function scoreInstallExposurePenalty(
  project: CorpScoreProjectSignal,
  stateVersion: number,
): number {
  if (project.phase !== "install_agenda" || project.sameTurnCloseout) return 0;
  const exposure = scoreRouteExposure(project, stateVersion);
  const stake = project.conversion?.runnerStealIsMatchpoint ? 2 : 1;
  // Unknown is explicitly charged at the conservative risk ceiling. It is not
  // silently turned into a fifty-percent access estimate or a safe route.
  if (exposure.knowledge === "unknown") return 130 * stake;
  const probability =
    exposure.probability.numerator / exposure.probability.denominator;
  return (
    stake *
    Math.round(
      probability * (100 + Math.min(30, exposure.runnerCreditsRemaining)),
    )
  );
}
