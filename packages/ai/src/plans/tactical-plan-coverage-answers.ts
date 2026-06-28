import type {
  PlanStep,
  RequiredCapabilityKind,
  TacticalPlan,
} from "./tactical-plan-types";
import { isBreakerRequiredCapabilityKind } from "./tactical-plan-coverage-kinds";

export type CoverageAnswerRole =
  | "direct_breaker_install"
  | "program_search"
  | "search_engine_setup"
  | "draw_for_answer"
  | "basic_draw_fallback"
  | "recovery_answer"
  | "not_coverage_answer";

export function coverageAnswerRolePriority(role: CoverageAnswerRole): number {
  switch (role) {
    case "direct_breaker_install":
      return 1000;
    case "program_search":
      return 900;
    case "recovery_answer":
      return 850;
    case "search_engine_setup":
      return 760;
    case "draw_for_answer":
      return 650;
    case "basic_draw_fallback":
      return 500;
    case "not_coverage_answer":
      return 0;
  }
}

export function isCoverageAnswerStep(step: PlanStep): boolean {
  return (
    step.kind === "search_for_answer" ||
    step.kind === "setup_search_engine" ||
    step.kind === "draw_for_answer"
  ) && coverageSearchRequiredCapabilityForStep(step) !== undefined;
}

export function coverageAnswerRoleMatchesStep(
  step: PlanStep,
  role: CoverageAnswerRole,
): boolean {
  switch (step.kind) {
    case "search_for_answer":
      return role === "program_search" || role === "recovery_answer";
    case "setup_search_engine":
      return role === "search_engine_setup";
    case "draw_for_answer":
      return role === "draw_for_answer" || role === "basic_draw_fallback";
    default:
      return false;
  }
}

export function coverageSearchRequiredCapability(
  plan: TacticalPlan,
  step: PlanStep,
): RequiredCapabilityKind | undefined {
  const capability = [
    ...step.requiredCapabilities,
    ...plan.requiredCapabilities,
  ].find((candidate) => isBreakerRequiredCapabilityKind(candidate.kind));
  return capability?.kind;
}

export function planRequiredBreakerCoverage(
  plan: TacticalPlan,
  step: PlanStep,
): RequiredCapabilityKind {
  return coverageSearchRequiredCapability(plan, step) ?? "breaker_coverage";
}

export function coverageSearchRequiredCapabilityForStep(
  step: PlanStep,
): RequiredCapabilityKind | undefined {
  const capability = step.requiredCapabilities.find((candidate) =>
    isBreakerRequiredCapabilityKind(candidate.kind),
  );
  return capability?.kind;
}
