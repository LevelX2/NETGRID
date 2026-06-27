import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  runnerSelfDamageGuardedDecision,
  runnerSelfDamageImmediateWinSemanticChoice,
  runnerSelfDamageSurvivalAssessment,
  runnerSelfDamageSurvivalExclusion,
  type RunnerSelfDamageGuardedDecisionDependencies,
  type RunnerSelfDamageSurvivalAssessment as RunnerSelfDamageSurvivalAssessmentResult,
  type RunnerSelfDamageSurvivalAssessmentDependencies,
} from "./runner-self-damage-choice";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeExclusion,
} from "./semantic-runtime-types";

export type RunnerSelfDamageContextDependencies =
  RunnerSelfDamageSurvivalAssessmentDependencies &
    Omit<RunnerSelfDamageGuardedDecisionDependencies, "survivalAssessment">;

export type RunnerSelfDamageContext = {
  runnerSelfDamageGuardedDecision: (
    input: AiDecisionInput,
    decision: AiDecision,
  ) => AiDecision;
  runnerSelfDamageImmediateWinSemanticChoice: (
    input: AiDecisionInput,
    choices: readonly SemanticRuntimeChoice[],
  ) => SemanticRuntimeChoice | undefined;
  runnerSelfDamageSurvivalAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => RunnerSelfDamageSurvivalAssessmentResult | undefined;
  runnerSelfDamageSurvivalExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerSelfDamageContext(
  dependencies: RunnerSelfDamageContextDependencies,
): RunnerSelfDamageContext {
  function survivalAssessment(
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ): RunnerSelfDamageSurvivalAssessmentResult | undefined {
    return runnerSelfDamageSurvivalAssessment(
      input,
      action,
      dependencies,
      actionSemanticCandidate,
    );
  }

  return {
    runnerSelfDamageGuardedDecision: (input, decision) =>
      runnerSelfDamageGuardedDecision(input, decision, {
        ...dependencies,
        survivalAssessment,
      }),
    runnerSelfDamageImmediateWinSemanticChoice: (input, choices) =>
      runnerSelfDamageImmediateWinSemanticChoice(input, choices, {
        survivalAssessment,
      }),
    runnerSelfDamageSurvivalAssessment: survivalAssessment,
    runnerSelfDamageSurvivalExclusion: (
      input,
      action,
      actionSemanticCandidate,
    ) =>
      runnerSelfDamageSurvivalExclusion(input, action, {
        survivalAssessment: (assessmentInput, assessmentAction) =>
          survivalAssessment(
            assessmentInput,
            assessmentAction,
            actionSemanticCandidate,
          ),
      }),
  };
}
