import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerBlinkBreakRiskAssessment = {
  stableCoverageAvailable: boolean;
  evidence: string[];
};

export type RunnerBlinkBreakExclusionDependencies = {
  riskAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerBlinkBreakRiskAssessment | undefined;
  shouldAvoidRun: (
    assessment: RunnerBlinkBreakRiskAssessment | undefined,
  ) => boolean;
};

export type RunnerBlinkBreakExclusionContext = {
  semanticRuntimeRunnerBlinkBreakExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerBlinkBreakExclusionContext(
  dependencies: RunnerBlinkBreakExclusionDependencies,
): RunnerBlinkBreakExclusionContext {
  function semanticRuntimeRunnerBlinkBreakExclusion(
    input: AiDecisionInput,
    action: LegalAction,
  ): SemanticRuntimeExclusion | undefined {
    return runnerBlinkBreakExclusion(input, action, dependencies);
  }

  return { semanticRuntimeRunnerBlinkBreakExclusion };
}

export function runnerBlinkBreakExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerBlinkBreakExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const assessment = dependencies.riskAssessment(input, action);
  if (!assessment) return undefined;
  if (assessment.stableCoverageAvailable) {
    return {
      key: "blink_break_stable_alternative_available",
      label: "Stabiler Breaker statt Blink",
      reason: sortedUnique([
        ...assessment.evidence,
        "why_blink_break_blocked:stable_breaker_available",
      ]).join("|"),
    };
  }
  if (!dependencies.shouldAvoidRun(assessment)) return undefined;
  return {
    key: "blink_break_self_net_damage_risk",
    label: "Blink-Break mit Self-Net-Damage-Risiko",
    reason: sortedUnique([
      ...assessment.evidence,
      "why_blink_break_blocked:self_net_damage_buffer_too_low",
    ]).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
