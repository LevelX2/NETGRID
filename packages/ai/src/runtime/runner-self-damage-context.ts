import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  runnerSelfDamageImmediateWinSemanticChoice,
  runnerSelfDamageSurvivalAssessment,
  runnerSelfDamageSurvivalExclusion,
  type RunnerSelfDamageSurvivalAssessment as RunnerSelfDamageSurvivalAssessmentResult,
  type RunnerSelfDamageSurvivalAssessmentDependencies,
} from "./runner-self-damage-choice";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeExclusion,
} from "./semantic-runtime-types";

export type RunnerSelfDamageContextDependencies =
  RunnerSelfDamageSurvivalAssessmentDependencies;

export type RunnerSelfDamageContext = {
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
