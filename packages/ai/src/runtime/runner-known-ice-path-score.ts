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
