import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";

type RunnerKnownIcePathServer =
  AiDecisionInput["playerView"]["servers"][number];

export type RunnerKnownIcePathScoreDependencies = {
  assessment: (
    input: AiDecisionInput,
    server: RunnerKnownIcePathServer,
  ) => KnownRezzedIcePathAssessment;
  reason: (
    assessment: KnownRezzedIcePathAssessment,
    serverId: string,
  ) => string;
};

export function runnerKnownIcePathScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  server: RunnerKnownIcePathServer | undefined,
  dependencies: RunnerKnownIcePathScoreDependencies,
): AiDecisionScoreComponent[] {
  if (action.type !== "start_run" || !server) return [];
  const assessment = dependencies.assessment(input, server);
  if (assessment.assessedKnownIceCount <= 0) return [];
  if (!assessment.canReachAccess) return [];
  if ((assessment.visibleBreakCost ?? 0) <= 0) return [];
  return [
    {
      key: "runner_visible_ice_path_cost",
      label: "Sichtbare ICE-Kosten",
      value: -Math.min(
        1800,
        (assessment.visibleBreakCost ?? 0) * 220 +
          Math.max(0, 2 - assessment.creditsAfterPath) * 350,
      ),
      reason: dependencies.reason(assessment, server.id),
    },
  ];
}

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
