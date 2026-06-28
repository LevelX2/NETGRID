import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { rolesMatch } from "../runtime/role-match";
import { actionCreditCost } from "./tactical-plan-action-values";
import {
  coverageSearchRequiredCapability,
  type CoverageAnswerRole,
} from "./tactical-plan-coverage-answers";
import {
  cardDefinitionPlanRoleForCoverageSearch,
  cardDefinitionProvidesBreakerCoverage,
  cardPlanRoleForCoverageSearch,
  coveragePlanRoleMatches,
  recoveryTargetDefinitionId,
  recoveryTargetVisibleCard,
} from "./tactical-plan-coverage-card-roles";
import { cardProvidesBreakerCoverage } from "./tactical-plan-breaker-cards";
import {
  economyFalseMatchLoopPenalties,
  noRecoveryLoopPenalties,
  recoveryLoopPenaltiesForCoverageSearch,
  recoveryLoopPenaltyEvidence,
} from "./tactical-plan-recovery-loop-penalties";
import type {
  PlanStep,
  RequiredCapabilityKind,
  TacticalPlan,
} from "./tactical-plan-types";
import { visibleCardForAction } from "./tactical-plan-visible-cards";

type RecoveryTargetPlanFit = "none" | "low" | "medium" | "high";

export type CoverageSearchActionFit = {
  supportsActiveCapabilityNeed: boolean;
  answerRole: CoverageAnswerRole;
  recoveredCardId?: string;
  recoveredCardRole?: string;
  supportsCreditNeed: boolean;
  supportsDrawOrSearchNeed: boolean;
  supportsSurvivalNeed: boolean;
  recoveredCardPlanFit: RecoveryTargetPlanFit;
  recoveryLoopRisk: "none" | "low" | "medium" | "high";
  evidence: string[];
};

export function coverageSearchActionFit(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  input: AiDecisionInput,
  fundingNeed: boolean,
): CoverageSearchActionFit | undefined {
  const requiredCoverage = coverageSearchRequiredCapability(plan, step);
  if (requiredCoverage === undefined) return undefined;
  const sourceCard = visibleCardForAction(input.playerView, action);
  if (
    action.type === "install_card" &&
    sourceCard &&
    cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
  ) {
    return {
      supportsActiveCapabilityNeed: true,
      answerRole: "direct_breaker_install",
      ...(sourceCard.definitionId
        ? { recoveredCardId: sourceCard.definitionId }
        : {}),
      recoveredCardRole: "breaker",
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: false,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "high",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:direct_breaker_install",
        "planStepExpectedRole:install_breaker",
        "matchedActionRole:install_breaker",
        `recoveredCardPlanFit:high`,
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  const recoveryTarget = recoveryTargetEvaluation(
    input,
    action,
    requiredCoverage,
    fundingNeed,
  );
  if (recoveryTarget) return recoveryTarget;

  const sourceRole = sourceCard
    ? cardPlanRoleForCoverageSearch(sourceCard)
    : undefined;
  if (
    sourceCard &&
    sourceRole &&
    coveragePlanRoleMatches(sourceRole, ["search"])
  ) {
    const answerRole: CoverageAnswerRole =
      action.type === "install_card" ? "search_engine_setup" : "program_search";
    return {
      supportsActiveCapabilityNeed: true,
      ...(sourceCard.definitionId
        ? { recoveredCardId: sourceCard.definitionId }
        : {}),
      answerRole,
      recoveredCardRole: sourceRole,
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "high",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        `coverageAnswerRole:${answerRole}`,
        answerRole === "search_engine_setup"
          ? "planStepExpectedRole:setup_search_engine"
          : "planStepExpectedRole:search_for_answer",
        answerRole === "search_engine_setup"
          ? "matchedActionRole:search_engine_setup"
          : "matchedActionRole:program_search",
        "recoveredCardPlanFit:high",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  if (
    sourceCard &&
    sourceRole &&
    coveragePlanRoleMatches(sourceRole, ["draw"]) &&
    action.type !== "install_card"
  ) {
    return {
      supportsActiveCapabilityNeed: true,
      ...(sourceCard?.definitionId
        ? { recoveredCardId: sourceCard.definitionId }
        : {}),
      answerRole: "draw_for_answer",
      recoveredCardRole: sourceRole,
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "medium",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:draw_for_answer",
        "planStepExpectedRole:draw_for_answer",
        "matchedActionRole:draw_for_answer",
        "recoveredCardPlanFit:medium",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  if (action.type === "draw_card") {
    return {
      supportsActiveCapabilityNeed: true,
      answerRole: "basic_draw_fallback",
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "low",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:basic_draw_fallback",
        "planStepExpectedRole:draw_for_answer",
        "matchedActionRole:basic_draw_fallback",
        "recoveredCardPlanFit:low",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  if (candidateHasProgramSearchSignal(candidate)) {
    return {
      supportsActiveCapabilityNeed: true,
      answerRole: "program_search",
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "high",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:program_search",
        "planStepExpectedRole:search_for_answer",
        "matchedActionRole:program_search",
        "recoveredCardPlanFit:high",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  const matchedActionRole = sourceCard
    ? cardPlanRoleForCoverageSearch(sourceCard)
    : action.type;
  const matchedActionRoleSupportsEconomy = coveragePlanRoleMatches(
    matchedActionRole,
    ["economy"],
  );
  const supportsCreditNeed =
    actionCreditCost(action) < 0 || matchedActionRoleSupportsEconomy;
  const penalties = economyFalseMatchLoopPenalties(
    fundingNeed,
    supportsCreditNeed,
  );
  return {
    supportsActiveCapabilityNeed: false,
    answerRole: "not_coverage_answer",
    recoveredCardRole: matchedActionRole,
    supportsCreditNeed,
    supportsDrawOrSearchNeed: false,
    supportsSurvivalNeed: false,
    recoveredCardPlanFit: "none",
    recoveryLoopRisk: matchedActionRoleSupportsEconomy ? "medium" : "low",
    evidence: [
      `activeRequiredCapability:${requiredCoverage}`,
      "coverageAnswerRole:not_coverage_answer",
      "planStepExpectedRole:search_for_answer",
      `matchedActionRole:${matchedActionRole}`,
      "recoveredCardPlanFit:none",
      matchedActionRoleSupportsEconomy
        ? "why_livewire_not_search:economy_does_not_satisfy_coverage"
        : "rejectedFalseMatches:action_does_not_satisfy_coverage",
      ...recoveryLoopPenaltyEvidence(penalties),
    ],
  };
}

function candidateHasProgramSearchSignal(
  candidate: ActionSemanticCandidate,
): boolean {
  return rolesMatch(candidateCoverageSignals(candidate), [
    "program_search",
    "breaker_search",
    "search.stack",
    "search_for_answer",
  ]);
}

function candidateCoverageSignals(candidate: ActionSemanticCandidate): string[] {
  return [
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
  ].map((signal) => signal.toLocaleLowerCase("en-US"));
}

export function rejectedCoverageSearchFalseMatches(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  legalActionsById: ReadonlyMap<string, LegalAction>,
  input: AiDecisionInput,
  fundingNeed: boolean,
): string[] {
  if (coverageSearchRequiredCapability(plan, step) === undefined) return [];
  return candidates
    .map((candidate) => {
      const action = legalActionsById.get(candidate.actionId);
      if (!action || candidate.actorSide !== plan.side) return undefined;
      const fit = coverageSearchActionFit(
        plan,
        step,
        candidate,
        action,
        input,
        fundingNeed,
      );
      if (!fit || fit.supportsActiveCapabilityNeed) return undefined;
      return [
        `rejectedFalseMatches:${candidate.actionId}`,
        ...fit.evidence,
        `recoveryTargetEvaluation:${fit.recoveredCardId ?? "none"}:${fit.recoveredCardPlanFit}`,
        `recoveryLoopRisk:${fit.recoveryLoopRisk}`,
      ].join("|");
    })
    .filter((entry): entry is string => Boolean(entry));
}

export function matchedCoverageSearchRationales(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  legalActionsById: ReadonlyMap<string, LegalAction>,
  input: AiDecisionInput,
  fundingNeed: boolean,
): string[] {
  if (coverageSearchRequiredCapability(plan, step) === undefined) return [];
  return candidates
    .map((candidate) => {
      const action = legalActionsById.get(candidate.actionId);
      if (!action || candidate.actorSide !== plan.side) return undefined;
      const fit = coverageSearchActionFit(
        plan,
        step,
        candidate,
        action,
        input,
        fundingNeed,
      );
      if (!fit?.supportsActiveCapabilityNeed) return undefined;
      return [
        `matchedCoverageSearchFit:${candidate.actionId}`,
        ...fit.evidence,
        `recoveryTargetEvaluation:${fit.recoveredCardId ?? "none"}:${fit.recoveredCardPlanFit}`,
        `recoveryLoopRisk:${fit.recoveryLoopRisk}`,
      ].join("|");
    })
    .filter((entry): entry is string => Boolean(entry));
}

function recoveryTargetEvaluation(
  input: AiDecisionInput,
  action: LegalAction,
  requiredCoverage: RequiredCapabilityKind,
  fundingNeed: boolean,
): CoverageSearchActionFit | undefined {
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return undefined;
  }
  const sourceCard = visibleCardForAction(input.playerView, action);
  const sourceText = [
    sourceCard?.title,
    sourceCard?.definitionId,
    sourceCard?.rulesText,
  ].filter(Boolean).join(" ").toLowerCase();
  const targetDefinitionId = recoveryTargetDefinitionId(input, action);
  const isRecovery =
    /recovery|trash|heap|junkyard|bbs/.test(sourceText) ||
    targetDefinitionId !== undefined;
  if (!isRecovery) return undefined;
  const targetCard = recoveryTargetVisibleCard(input, action);
  const targetRole =
    targetCard
      ? cardPlanRoleForCoverageSearch(targetCard)
      : targetDefinitionId
        ? cardDefinitionPlanRoleForCoverageSearch(targetDefinitionId)
        : "unknown";
  const supportsCoverage =
    targetCard?.known === true
      ? cardProvidesBreakerCoverage(targetCard, requiredCoverage)
      : targetDefinitionId !== undefined &&
        cardDefinitionProvidesBreakerCoverage(targetDefinitionId, requiredCoverage);
  const supportsDrawOrSearchNeed =
    coveragePlanRoleMatches(targetRole, ["search", "draw"]);
  const supportsCreditNeed = coveragePlanRoleMatches(targetRole, ["economy"]);
  const recoveredCardPlanFit: RecoveryTargetPlanFit = supportsCoverage
    ? "high"
    : supportsDrawOrSearchNeed
      ? "medium"
      : supportsCreditNeed
        ? "low"
        : "none";
  const supportsActiveCapabilityNeed =
    supportsCoverage || supportsDrawOrSearchNeed;
  const recoveryLoopRisk =
    supportsActiveCapabilityNeed
      ? "none"
      : supportsCreditNeed
        ? "high"
        : "medium";
  const penalties = recoveryLoopPenaltiesForCoverageSearch(
    fundingNeed,
    supportsActiveCapabilityNeed,
    supportsCreditNeed,
  );
  return {
    supportsActiveCapabilityNeed,
    answerRole: supportsActiveCapabilityNeed
      ? "recovery_answer"
      : "not_coverage_answer",
    ...(targetDefinitionId ? { recoveredCardId: targetDefinitionId } : {}),
    recoveredCardRole: targetRole,
    supportsCreditNeed,
    supportsDrawOrSearchNeed,
    supportsSurvivalNeed: false,
    recoveredCardPlanFit,
    recoveryLoopRisk,
    evidence: [
      `activeRequiredCapability:${requiredCoverage}`,
      `coverageAnswerRole:${
        supportsActiveCapabilityNeed ? "recovery_answer" : "not_coverage_answer"
      }`,
      "planStepExpectedRole:search_for_answer",
      `matchedActionRole:recovery`,
      `recoveredCardId:${targetDefinitionId ?? "unknown"}`,
      `recoveredCardRole:${targetRole}`,
      `supportsActiveCapabilityNeed:${supportsActiveCapabilityNeed}`,
      `supportsCreditNeed:${supportsCreditNeed}`,
      `supportsDrawOrSearchNeed:${supportsDrawOrSearchNeed}`,
      `supportsSurvivalNeed:false`,
      `recoveredCardPlanFit:${recoveredCardPlanFit}`,
      `recoveryLoopRisk:${recoveryLoopRisk}`,
      ...recoveryLoopPenaltyEvidence(penalties),
      supportsActiveCapabilityNeed
        ? "why_junkyard_recovery_allowed_or_rejected:allowed_plan_fit"
        : "why_junkyard_recovery_allowed_or_rejected:rejected_no_plan_fit",
    ],
  };
}
