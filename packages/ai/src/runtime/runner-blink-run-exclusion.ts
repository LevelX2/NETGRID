import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerRandomBreakRiskAssessment = {
  evidence: string[];
};

export type RunnerRandomBreakMultiRunEvaluation = {
  randomBreakOrDamageRiskAssessment?: RunnerRandomBreakRiskAssessment;
  evidence: string[];
};

export type RunnerRandomBreakOrDamageRunExclusionDependencies = {
  multiRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ) => RunnerRandomBreakMultiRunEvaluation | undefined;
  runRiskAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRandomBreakRiskAssessment | undefined;
  shouldAvoidRun: (
    assessment: RunnerRandomBreakRiskAssessment | undefined,
  ) => boolean;
};

export type RunnerRandomBreakOrDamageRiskEvidenceDependencies = {
  multiRunTargetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ) => RunnerRandomBreakMultiRunEvaluation | undefined;
  runRiskAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRandomBreakRiskAssessment | undefined;
  breakRiskAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRandomBreakRiskAssessment | undefined;
};

export function runnerRandomBreakOrDamageRunExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRandomBreakOrDamageRunExclusionDependencies,
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
    evaluation?.randomBreakOrDamageRiskAssessment ??
    dependencies.runRiskAssessment(input, action);
  if (!dependencies.shouldAvoidRun(assessment)) return undefined;
  return {
    key: "random_break_damage_run_self_damage_risk",
    label: "Run mit zufälligem Eigenschaden-Risiko",
    reason: sortedUnique([
      ...(assessment?.evidence ?? []),
      ...(evaluation?.evidence.slice(0, 16) ?? []),
      "why_random_break_damage_run_blocked:self_damage_buffer_too_low",
    ]).join("|"),
  };
}

export function runnerRandomBreakOrDamageRiskEvidenceForAction(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRandomBreakOrDamageRiskEvidenceDependencies,
): string[] {
  if (input.side !== "runner") return [];
  if (action.type === "start_run") {
    const targetServerId = semanticRuntimeServerId(action);
    if (!targetServerId) return [];
    const evaluation = dependencies.multiRunTargetEvaluation(
      input,
      action,
      targetServerId,
    );
    return (
      evaluation?.randomBreakOrDamageRiskAssessment?.evidence ??
      dependencies.runRiskAssessment(input, action)?.evidence ??
      []
    );
  }
  return dependencies.breakRiskAssessment(input, action)?.evidence ?? [];
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
