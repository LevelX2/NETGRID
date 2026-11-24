import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";

export function runnerKnownIcePathReason(
  assessment: KnownRezzedIcePathAssessment,
  serverId: string,
): string {
  return [
    `server:${serverId}`,
    `known_ice:${assessment.assessedKnownIceCount}`,
    `can_reach_access:${assessment.canReachAccess}`,
    `reason:${assessment.noAccessReason ?? "reachable"}`,
    `unpayable:${assessment.unpayableReason ?? "none"}`,
    `break_cost:${assessment.visibleBreakCost ?? 0}`,
    `credits_after:${assessment.creditsAfterPath}`,
    ...(assessment.missingCoverage?.length
      ? [`missing:${assessment.missingCoverage.join("|")}`]
      : []),
    ...(assessment.unbreakableIceTitle
      ? [`ice:${assessment.unbreakableIceTitle}`]
      : []),
    ...(assessment.hardUnbrokenEffectIceTitle
      ? [`hard_effect_ice:${assessment.hardUnbrokenEffectIceTitle}`]
      : []),
    ...(assessment.hardUnbrokenRunEffects?.length
      ? [`hard_effect:${assessment.hardUnbrokenRunEffects.join("|")}`]
      : []),
  ].join(";");
}
