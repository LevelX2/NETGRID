import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export type RunnerBadPublicityRelevanceScoreAssessment = {
  badPublicityRelevanceScore: number;
  evidence: string[];
};

export type RunnerBadPublicityRelevanceScoreDependencies = {
  assessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerBadPublicityRelevanceScoreAssessment | undefined;
};

export function runnerBadPublicityRelevanceScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerBadPublicityRelevanceScoreDependencies,
): AiDecisionScoreComponent | undefined {
  const assessment = dependencies.assessment(input, action);
  if (!assessment) return undefined;
  return {
    key: "runner_bad_publicity_relevance",
    label: "Bad-Publicity-Relevanz",
    value: assessment.badPublicityRelevanceScore,
    reason: sortedUnique(assessment.evidence).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
