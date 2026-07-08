import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { developmentCardStepMatchesAction } from "./tactical-plan-development-card-matching";
import {
  bankStepMatchesCandidate,
  candidateTargetMatchesPlan,
} from "./tactical-plan-candidate-matching";
import { cardProvidesBreakerCoverage } from "./tactical-plan-breaker-cards";
import {
  coverageAnswerRoleMatchesStep,
  coverageAnswerRolePriority,
  isCoverageAnswerStep,
  planRequiredBreakerCoverage,
} from "./tactical-plan-coverage-answers";
import { coverageSearchActionFit } from "./tactical-plan-coverage-search-fit";
import {
  isRunPlanStep,
  runPlanStepMatchesAction,
} from "./tactical-plan-run-action-matching";
import {
  actionTypeMatchesStep,
  candidateSemanticsMatchStep,
} from "./tactical-plan-step-semantics";
import {
  legalActionCreditGainForPlan,
  legalActionCreditNetGain,
  type TacticalPlanCreditValueDependencies,
} from "./tactical-plan-action-values";
import { runnerHasConcreteFundingNeed } from "./tactical-plan-runner-funding-need";
import type {
  PlanStep,
  TacticalPlan,
} from "./tactical-plan-types";
import { visibleCardByInstanceId } from "./tactical-plan-visible-cards";

export function planStepCandidatePriority(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
  input: AiDecisionInput,
  dependencies: TacticalPlanCreditValueDependencies,
): number {
  if (!action) return 0;
  if (isCoverageAnswerStep(step)) {
    const fit = coverageSearchActionFit(
      plan,
      step,
      candidate,
      action,
      input,
      runnerHasConcreteFundingNeed(input, []),
    );
    if (!fit?.supportsActiveCapabilityNeed) return 0;
    return coverageAnswerRolePriority(fit.answerRole);
  }
  if (step.kind === "gain_credits") {
    return legalActionCreditNetGain(input, action, dependencies) * 100;
  }
  return 0;
}

export function candidateMatchesStep(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
  input: AiDecisionInput,
  dependencies: TacticalPlanCreditValueDependencies,
): boolean {
  if (!action) return false;
  if (candidate.actorSide !== plan.side) return false;
  if (
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked"
  ) {
    return false;
  }
  if (isCoverageAnswerStep(step)) {
    const fit = coverageSearchActionFit(
      plan,
      step,
      candidate,
      action,
      input,
      runnerHasConcreteFundingNeed(input, []),
    );
    if (fit !== undefined) {
      return fit.supportsActiveCapabilityNeed &&
        coverageAnswerRoleMatchesStep(step, fit.answerRole) &&
        candidateTargetMatchesPlan(plan, candidate, action);
    }
  }
  if (step.kind === "install_development_card") {
    return developmentCardStepMatchesAction(plan, action);
  }
  if (step.kind === "gain_credits") {
    const creditGain = legalActionCreditGainForPlan(input, action, dependencies);
    return (
      creditGain > 0 &&
      candidateTargetMatchesPlan(plan, candidate, action)
    );
  }
  if (step.kind === "build_rez_reserve") {
    if (legalActionCreditGainForPlan(input, action, dependencies) > 0) {
      return candidateTargetMatchesPlan(plan, candidate, action);
    }
    return candidateSemanticsMatchStep(step, candidate) &&
      candidateTargetMatchesPlan(plan, candidate, action) &&
      bankStepMatchesCandidate(step, candidate, action);
  }
  if (step.kind === "draw_hand_buffer") {
    return (
      action.type === "draw_card" &&
      candidateTargetMatchesPlan(plan, candidate, action)
    );
  }
  if (step.kind === "install_breaker" && action.type === "install_card") {
    const requiredCoverage = planRequiredBreakerCoverage(plan, step);
    const sourceCard = visibleCardByInstanceId(input.playerView, String(action.source));
    if (!sourceCard) return false;
    if (
      sourceCard &&
      !cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
    ) {
      return false;
    }
  }
  if (isRunPlanStep(step)) {
    return runPlanStepMatchesAction(step, candidate, action, actionTypeMatchesStep) &&
      candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidateSemanticsMatchStep(step, candidate)) {
    return candidateTargetMatchesPlan(plan, candidate, action) &&
      bankStepMatchesCandidate(step, candidate, action);
  }
  if (step.desiredActionSemantics.includes(candidate.semanticActionType)) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.actionTacticSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.cardContextSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  return actionTypeMatchesStep(step, candidate.actionType) &&
    candidateTargetMatchesPlan(plan, candidate, action) &&
    bankStepMatchesCandidate(step, candidate, action);
}
