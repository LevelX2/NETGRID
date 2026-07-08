import {
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalPlanCreditValueDependencies } from "./tactical-plan-action-values";
import {
  coverageSearchRequiredCapability,
} from "./tactical-plan-coverage-answers";
import {
  matchedCoverageSearchRationales,
  rejectedCoverageSearchFalseMatches,
} from "./tactical-plan-coverage-search-fit";
import {
  candidateMappingRationale,
  mappingStatusForStep,
} from "./tactical-plan-mapping-helpers";
import { runnerHasConcreteFundingNeed } from "./tactical-plan-runner-funding-need";
import {
  candidateMatchesStep,
  planStepCandidatePriority,
} from "./tactical-plan-step-candidate-matching";
import type {
  PlanStep,
  PlanStepMappingResult,
  TacticalPlan,
} from "./tactical-plan-types";

export function mapPlanStepToLegalActionsWithDependencies(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
  dependencies: TacticalPlanCreditValueDependencies,
): PlanStepMappingResult {
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const matchedCandidates = candidates
    .map((candidate) => ({
      candidate,
      action: legalActionsById.get(candidate.actionId),
    }))
    .filter(({ candidate, action }) =>
      candidateMatchesStep(
        plan,
        step,
        candidate,
        action,
        input,
        dependencies,
      ),
    )
    .map(({ candidate, action }) => ({
      candidate,
      priority: planStepCandidatePriority(
        plan,
        step,
        candidate,
        action,
        input,
        dependencies,
      ),
    }))
    .sort((left, right) =>
      right.priority - left.priority ||
      left.candidate.actionId.localeCompare(right.candidate.actionId),
    );
  const matchedCandidateIds = matchedCandidates.map(
    ({ candidate }) => candidate.actionId,
  );
  const matchedCandidateValues = matchedCandidates.map(
    ({ candidate }) => candidate,
  );
  const actionPriorities = matchedCandidates.map(({ candidate, priority }) => ({
    actionId: candidate.actionId,
    priority,
  }));
  const legalActions = matchedCandidateIds
    .map((actionId) => legalActionsById.get(actionId))
    .filter((action): action is LegalAction => Boolean(action));
  const status = mappingStatusForStep(step, legalActions);
  const coverageSearchFundingNeed = runnerHasConcreteFundingNeed(input, []);
  const rejectedFalseMatches = rejectedCoverageSearchFalseMatches(
    plan,
    step,
    candidates,
    legalActionsById,
    input,
    coverageSearchFundingNeed,
  );
  const matchedCoverageSearchFits = matchedCoverageSearchRationales(
    plan,
    step,
    matchedCandidateValues,
    legalActionsById,
    input,
    coverageSearchFundingNeed,
  );
  return {
    plan,
    step: {
      ...step,
      mappingStatus: status,
      actionCandidateIds: matchedCandidateIds,
    },
    status,
    actionCandidateIds: matchedCandidateIds,
    actionPriorities,
    legalActions,
    rationale: [
      ...step.rationale,
      `mapped_candidate_count:${matchedCandidateIds.length}`,
      `mapped_legal_action_count:${legalActions.length}`,
      ...(status !== "matched" &&
      coverageSearchRequiredCapability(plan, step) !== undefined
        ? ["blocked_no_valid_search_action"]
        : []),
      ...rejectedFalseMatches.slice(0, 6),
      ...matchedCoverageSearchFits.slice(0, 4),
      ...matchedCandidateValues.slice(0, 4).map(candidateMappingRationale),
    ],
  };
}
