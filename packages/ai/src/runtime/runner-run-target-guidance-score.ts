import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

export type RunnerRunTargetGuidanceScoreDependencies = {
  evaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRunTargetEvaluation | undefined;
  guidanceValue: (evaluation: RunnerRunTargetEvaluation) => number;
  visibleHighPayoffRunOverride: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function runnerRunTargetGuidanceScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRunTargetGuidanceScoreDependencies,
): AiDecisionScoreComponent | undefined {
  const evaluation = dependencies.evaluationForAction(input, action);
  if (!evaluation) return undefined;
  const value = dependencies.guidanceValue(evaluation);
  if (
    value < 0 &&
    dependencies.visibleHighPayoffRunOverride(input, action)
  ) {
    return undefined;
  }
  if (value === 0) return undefined;
  return {
    key: "runner_run_target_semantic_guidance",
    label: "RunTarget-Empfehlung",
    value,
    reason: [
      `target:${evaluation.targetServerId}`,
      `access:${evaluation.accessServerId}`,
      `recommendation:${evaluation.recommendation}`,
      `payoff:${evaluation.accessPayoff}`,
      `known_access:${evaluation.knownAccessState}`,
      `path:${evaluation.pathPassability}`,
      `credits_after:${evaluation.creditsAfterRun}`,
      ...evaluation.evidence
        .filter(
          (entry) =>
            entry.startsWith("visible_ice_hazard:") ||
            entry.startsWith("visible_ice_trace_base:") ||
            entry.startsWith("visible_trace_") ||
            entry.startsWith("unavoidable_visible_ice_hazard_count:"),
        )
        .slice(0, 24),
      ...(evaluation.blinkRiskAssessment?.evidence.slice(0, 24) ?? []),
    ].join("|"),
  };
}
