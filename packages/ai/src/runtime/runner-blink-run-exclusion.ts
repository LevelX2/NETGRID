import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerBlinkRiskAssessment = {
  evidence: string[];
};

export type RunnerBlinkMultiRunEvaluation = {
  blinkRiskAssessment?: RunnerBlinkRiskAssessment;
  evidence: string[];
};

export type RunnerBlinkRunExclusionDependencies = {
  multiRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ) => RunnerBlinkMultiRunEvaluation | undefined;
  runRiskAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerBlinkRiskAssessment | undefined;
  shouldAvoidRun: (assessment: RunnerBlinkRiskAssessment | undefined) => boolean;
};

export function runnerBlinkRunExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerBlinkRunExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  if (input.side !== "runner" || action.type !== "start_run") {
    return undefined;
  }
  const targetServerId = semanticRuntimeServerId(action);
  if (!targetServerId) return undefined;
  const evaluation = dependencies.multiRunTargetEvaluation(
    input,
    action,
    targetServerId,
  );
  const assessment =
    evaluation?.blinkRiskAssessment ??
    dependencies.runRiskAssessment(input, action);
  if (!dependencies.shouldAvoidRun(assessment)) return undefined;
  return {
    key: "blink_run_self_net_damage_risk",
    label: "Blink-Run mit Self-Net-Damage-Risiko",
    reason: sortedUnique([
      ...(assessment?.evidence ?? []),
      ...(evaluation?.evidence.slice(0, 16) ?? []),
      "why_blink_run_blocked:self_net_damage_buffer_too_low",
    ]).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
