import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  coverageAnswerRolePriority,
  type CoverageAnswerRole,
} from "./tactical-plan-coverage-answers";
import {
  cardDefinitionPlanRoleForCoverageSearch,
  cardDefinitionProvidesBreakerCoverage,
  cardPlanRoleForCoverageSearch,
  coveragePlanRoleMatches,
  recoveryTargetDefinitionId,
} from "./tactical-plan-coverage-card-roles";
import { cardProvidesBreakerCoverage } from "./tactical-plan-breaker-cards";
import type { RequiredCapabilityKind } from "./tactical-plan-types";
import { visibleCardForAction } from "./tactical-plan-visible-cards";

export function bestLegalCoverageAnswerRole(
  input: AiDecisionInput,
  requiredCoverage: RequiredCapabilityKind,
): CoverageAnswerRole | undefined {
  const roles = input.legalActions
    .map((action) =>
      coverageAnswerRoleForLegalAction(input, action, requiredCoverage),
    )
    .filter(
      (role): role is CoverageAnswerRole =>
        role !== undefined && role !== "not_coverage_answer",
    )
    .sort(
      (left, right) =>
        coverageAnswerRolePriority(right) - coverageAnswerRolePriority(left),
    );
  return roles[0];
}

function coverageAnswerRoleForLegalAction(
  input: AiDecisionInput,
  action: LegalAction,
  requiredCoverage: RequiredCapabilityKind,
): CoverageAnswerRole | undefined {
  if (action.side !== "runner") return undefined;
  const sourceCard = visibleCardForAction(input.playerView, action);
  if (
    action.type === "install_card" &&
    sourceCard &&
    cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
  ) {
    return "direct_breaker_install";
  }
  const sourceRole = sourceCard
    ? cardPlanRoleForCoverageSearch(sourceCard)
    : undefined;
  if (coveragePlanRoleMatches(sourceRole, ["search"])) {
    return action.type === "install_card"
      ? "search_engine_setup"
      : "program_search";
  }
  if (
    coveragePlanRoleMatches(sourceRole, ["draw"]) &&
    action.type !== "install_card"
  ) {
    return "draw_for_answer";
  }
  if (
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    const targetDefinitionId = recoveryTargetDefinitionId(input, action);
    const sourceText = [
      sourceCard?.title,
      sourceCard?.definitionId,
      sourceCard?.rulesText,
    ].filter(Boolean).join(" ").toLowerCase();
    if (
      /recovery|trash|heap|junkyard|bbs/.test(sourceText) ||
      targetDefinitionId !== undefined
    ) {
      const targetRole = targetDefinitionId
        ? cardDefinitionPlanRoleForCoverageSearch(targetDefinitionId)
        : "unknown";
      if (
        targetDefinitionId !== undefined &&
        cardDefinitionProvidesBreakerCoverage(targetDefinitionId, requiredCoverage)
      ) return "recovery_answer";
      if (coveragePlanRoleMatches(targetRole, ["search", "draw"])) {
        return "recovery_answer";
      }
    }
  }
  if (action.type === "draw_card") return "basic_draw_fallback";
  return undefined;
}
