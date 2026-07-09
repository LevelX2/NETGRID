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
import type { PlanStep, TacticalPlan } from "./tactical-plan-types";
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
  if (step.kind === "clear_tags") {
    return tagClearStepPriority(candidate, action, input);
  }
  if (step.kind === "convert_success_window") {
    return successWindowStepPriority(candidate, action);
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
      return (
        fit.supportsActiveCapabilityNeed &&
        coverageAnswerRoleMatchesStep(step, fit.answerRole) &&
        candidateTargetMatchesPlan(plan, candidate, action)
      );
    }
  }
  if (step.kind === "install_development_card") {
    return developmentCardStepMatchesAction(plan, action);
  }
  if (step.kind === "gain_credits") {
    const creditGain = legalActionCreditGainForPlan(
      input,
      action,
      dependencies,
    );
    return (
      creditGain > 0 && candidateTargetMatchesPlan(plan, candidate, action)
    );
  }
  if (step.kind === "build_rez_reserve") {
    if (legalActionCreditGainForPlan(input, action, dependencies) > 0) {
      return candidateTargetMatchesPlan(plan, candidate, action);
    }
    return (
      candidateSemanticsMatchStep(step, candidate) &&
      candidateTargetMatchesPlan(plan, candidate, action) &&
      bankStepMatchesCandidate(step, candidate, action)
    );
  }
  if (step.kind === "draw_hand_buffer") {
    return (
      action.type === "draw_card" &&
      candidateTargetMatchesPlan(plan, candidate, action)
    );
  }
  if (step.kind === "install_breaker" && action.type === "install_card") {
    const requiredCoverage = planRequiredBreakerCoverage(plan, step);
    const sourceCard = visibleCardByInstanceId(
      input.playerView,
      String(action.source),
    );
    if (!sourceCard) return false;
    if (
      sourceCard &&
      !cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
    ) {
      return false;
    }
  }
  if (isRunPlanStep(step)) {
    return (
      runPlanStepMatchesAction(
        step,
        candidate,
        action,
        actionTypeMatchesStep,
      ) && candidateTargetMatchesPlan(plan, candidate, action)
    );
  }
  if (candidateSemanticsMatchStep(step, candidate)) {
    return (
      candidateTargetMatchesPlan(plan, candidate, action) &&
      bankStepMatchesCandidate(step, candidate, action)
    );
  }
  if (step.desiredActionSemantics.includes(candidate.semanticActionType)) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (
    candidate.actionTacticSignals.some((signal) =>
      step.desiredActionSemantics.includes(signal),
    )
  ) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (
    candidate.cardContextSignals.some((signal) =>
      step.desiredActionSemantics.includes(signal),
    )
  ) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  return (
    actionTypeMatchesStep(step, candidate.actionType) &&
    candidateTargetMatchesPlan(plan, candidate, action) &&
    bankStepMatchesCandidate(step, candidate, action)
  );
}

function tagClearStepPriority(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  input: AiDecisionInput,
): number {
  const profile = candidate.tagEffectProfile;
  if (profile?.acuteTagRemoval !== true && action.type !== "remove_tag") {
    return 0;
  }
  const currentTags = Math.max(0, Math.floor(input.playerView.own.tags ?? 0));
  const reduction = tagReductionValue(
    profile?.currentTagReduction,
    currentTags,
  );
  const modeRank =
    profile?.mode === "all"
      ? 300
      : profile?.mode === "up_to_amount"
        ? 200
        : profile?.mode === "amount"
          ? 100
          : 0;
  return modeRank + reduction * 100 - actionCreditPenalty(action);
}

function tagReductionValue(
  value: ActionSemanticCandidate["tagEffectProfile"] extends infer Profile
    ? Profile extends { currentTagReduction?: infer Reduction }
      ? Reduction | undefined
      : never
    : never,
  currentTags: number,
): number {
  if (value === "all") return Math.max(1, currentTags);
  if (typeof value === "number") return Math.max(0, Math.floor(value));
  return 1;
}

function successWindowStepPriority(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): number {
  const tokens = candidateStepPriorityTokens(candidate, action);
  let priority = 0;
  if (hasAnyPriorityToken(tokens, ["fort.all_rezzed_ice_trash"])) {
    priority += 700;
  }
  if (hasAnyPriorityToken(tokens, ["ice.trash_rezzed", "trash_rezzed_ice"])) {
    priority += 600;
  }
  if (hasAnyPriorityToken(tokens, ["free_trash", "access.free_trash"])) {
    priority += 500;
  }
  if (hasAnyPriorityToken(tokens, ["access.payoff"])) {
    priority += 300;
  }
  if (
    hasAnyPriorityToken(tokens, [
      "run.followup_run",
      "followup_run",
      "run.extra_run_after_success",
      "extra_run_after_success",
    ])
  ) {
    priority += 220;
  }
  if (
    hasAnyPriorityToken(tokens, [
      "successful_run_before_access",
      "successful_run_before_access_effect",
      "run.success_followup",
      "success_followup",
      "requires_successful_run",
      "successful_run",
    ])
  ) {
    priority += 120;
  }
  return priority - actionCreditPenalty(action);
}

function candidateStepPriorityTokens(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ReadonlySet<string> {
  const tokens = new Set<string>();
  addPriorityToken(tokens, candidate.semanticActionType);
  addPriorityToken(tokens, candidate.abilityId);
  addPriorityToken(tokens, candidate.abilityKey);
  for (const signal of candidate.actionTacticSignals) {
    addPriorityToken(tokens, signal);
  }
  for (const signal of candidate.cardContextSignals) {
    addPriorityToken(tokens, signal);
  }
  for (const evidence of candidate.evidence) addPriorityToken(tokens, evidence);
  for (const value of Object.values(action.payload ?? {})) {
    if (typeof value === "string") addPriorityToken(tokens, value);
  }
  return tokens;
}

function addPriorityToken(
  tokens: Set<string>,
  value: string | undefined,
): void {
  if (!value) return;
  const normalized = value.toLocaleLowerCase("en-US");
  if (!normalized) return;
  tokens.add(normalized);
  tokens.add(normalized.replace(/[-_\s]+/g, "."));
  tokens.add(normalized.replace(/[.\s-]+/g, "_"));
}

function hasAnyPriorityToken(
  tokens: ReadonlySet<string>,
  options: readonly string[],
): boolean {
  return options.some((option) =>
    tokens.has(option.toLocaleLowerCase("en-US")),
  );
}

function actionCreditPenalty(action: LegalAction): number {
  return Math.max(0, actionCreditCostLike(action)) * 10;
}

function actionCreditCostLike(action: LegalAction): number {
  const payloadCost = action.payload?.creditCost ?? action.payload?.cost;
  if (typeof payloadCost === "number") return payloadCost;
  return (action.costs ?? []).reduce(
    (sum, cost) => sum + Math.max(0, Math.floor(cost.credits ?? 0)),
    0,
  );
}
