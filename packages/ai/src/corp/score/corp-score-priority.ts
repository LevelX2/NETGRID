import {
  CorpScorePriorityClass,
  CorpScoreProjectSignal,
} from "../../plans/corp-score-contracts";

export function corpScorePriorityClass(
  signal: CorpScoreProjectSignal,
): CorpScorePriorityClass {
  if (signal.terminalScore && signal.sameTurnCloseout) return "P1";
  if (
    signal.preventsTerminalSteal ||
    (signal.lastDrawScoreSurvival && signal.terminalScore && signal.feasible)
  ) {
    return "P2";
  }
  if (signal.sameTurnCloseout || signal.deadlinePressure) return "P3";
  return "P4";
}

/**
 * Returns only the current, Engine-quoted credit delta that makes an already
 * installed score-defense portfolio satisfy its parent's protection policy.
 * Unknown protection futures remain local and never manufacture a funding
 * objective.
 */
export function knownScoreProtectionFundingGap(
  signal: Pick<CorpScoreProjectSignal, "projectId" | "protectionNeed">,
): number | undefined {
  const need = signal.protectionNeed;
  if (
    !need ||
    need.parentProjectId !== signal.projectId ||
    need.baseline.knowledge !== "known"
  ) {
    return undefined;
  }
  const gap = need.baseline.minimumAdditionalCreditsToSatisfy;
  return typeof gap === "number" && Number.isSafeInteger(gap) && gap > 0
    ? gap
    : undefined;
}
