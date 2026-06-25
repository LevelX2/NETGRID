import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  runnerBadPublicityRelevanceAssessment,
  type RunnerBadPublicityRelevanceAssessment,
  type RunnerBadPublicityRelevanceAssessmentDependencies,
} from "./runner-bad-publicity-relevance-assessment";
import { runnerBadPublicityRelevanceScoreComponent } from "./runner-bad-publicity-relevance-score";

export type RunnerBadPublicityRelevanceContext = {
  runnerBadPublicityRelevanceAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerBadPublicityRelevanceAssessment | undefined;
  runnerBadPublicityRelevanceScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function createRunnerBadPublicityRelevanceContext(
  dependencies: RunnerBadPublicityRelevanceAssessmentDependencies,
): RunnerBadPublicityRelevanceContext {
  function assessment(
    input: AiDecisionInput,
    action: LegalAction,
  ): RunnerBadPublicityRelevanceAssessment | undefined {
    return runnerBadPublicityRelevanceAssessment(input, action, dependencies);
  }

  return {
    runnerBadPublicityRelevanceAssessment: assessment,
    runnerBadPublicityRelevanceScoreComponent: (input, action) =>
      runnerBadPublicityRelevanceScoreComponent(input, action, { assessment }),
  };
}
