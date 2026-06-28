import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { SemanticRuntimeCoverageSelectionDebug } from "../runtime/semantic-runtime-types";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";

export type CoverageSelectionDebugDependencies = {
  visibleSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => Pick<VisibleCard, "title" | "definitionId"> | undefined;
};

export function semanticRuntimeCoverageSelectionDebug(
  input: AiDecisionInput,
  action: LegalAction,
  planRuntime: TacticalPlanRuntimeResult,
  dependencies: CoverageSelectionDebugDependencies,
): SemanticRuntimeCoverageSelectionDebug | undefined {
  const selectedPlan = planRuntime.selectedPlan;
  const selectedStep = planRuntime.selectedStep;
  const selectedMapping = planRuntime.selectedMapping;
  if (
    selectedPlan?.type !== "runner.obtain_breaker_coverage" ||
    !selectedStep ||
    !selectedMapping ||
    !selectedMapping.legalActions.some(
      (candidate) => candidate.actionId === action.actionId,
    )
  ) {
    return undefined;
  }
  const capabilityKind = selectedStep.requiredCapabilities.find((candidate) =>
    candidate.kind.startsWith("breaker_"),
  )?.kind;
  if (!capabilityKind) return undefined;
  const capabilityLabel = semanticRuntimeCoverageCapabilityLabel(capabilityKind);
  const answerRole = semanticRuntimeCoverageAnswerRoleFromMapping(
    selectedMapping.rationale,
  );
  const answerFit = semanticRuntimeCoverageAnswerFit(
    answerRole,
    selectedStep.kind,
    action,
  );
  const sourceCard = dependencies.visibleSourceCard(input, action);
  const sourceTitle = sourceCard?.title ?? action.label;
  const sourceIdentity = [
    sourceTitle,
    sourceCard?.definitionId,
    String(action.source),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const evidence = [
    `activeRequiredCapability:${capabilityLabel}`,
    `activeRequiredCapabilityRaw:${capabilityKind}`,
    `coverageAnswerFit:${answerFit}`,
    `coverageAnswerSource:${sourceTitle}`,
    `coverageAnswerRole:${answerRole ?? "unknown"}`,
    "why_coverage_answer_selected:searches_for_required_breaker_coverage",
    ...(sourceIdentityHasMantisToken(sourceIdentity)
      ? ["why_mantis_selected:searches_for_required_breaker_coverage"]
      : []),
  ];
  return {
    capabilityKind,
    capabilityLabel,
    answerFit,
    sourceTitle,
    evidence,
  };
}

function sourceIdentityHasMantisToken(sourceIdentity: string): boolean {
  return sourceIdentity
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .includes("mantis");
}

function semanticRuntimeCoverageAnswerRoleFromMapping(
  rationale: readonly string[],
): string | undefined {
  const joined = rationale.join("|");
  const roles = [
    ...[...joined.matchAll(/coverageAnswerRole:([a-z_]+)/g)].map(
      (match) => match[1],
    ),
    ...[...joined.matchAll(/coverage_answer_role:([a-z_]+)/g)].map(
      (match) => match[1],
    ),
  ].filter((role): role is string => Boolean(role));
  const priority = [
    "direct_breaker_install",
    "program_search",
    "recovery_answer",
    "search_engine_setup",
    "draw_for_answer",
    "basic_draw_fallback",
    "not_coverage_answer",
  ];
  return priority.find((role) => roles.includes(role)) ?? roles[0];
}

function semanticRuntimeCoverageAnswerFit(
  answerRole: string | undefined,
  stepKind: string,
  action: LegalAction,
): string {
  if (answerRole === "program_search") return "direct_card_search";
  if (answerRole === "search_engine_setup") return "search_engine_setup";
  if (answerRole === "direct_breaker_install") return "direct_breaker_install";
  if (answerRole === "draw_for_answer") return "draw_for_answer";
  if (answerRole === "basic_draw_fallback") return "basic_draw_fallback";
  if (answerRole === "recovery_answer") return "recovery_answer";
  if (stepKind === "search_for_answer" && action.type !== "install_card") {
    return "direct_card_search";
  }
  if (stepKind === "setup_search_engine") return "search_engine_setup";
  if (stepKind === "draw_for_answer") return "draw_for_answer";
  return "coverage_answer";
}

function semanticRuntimeCoverageCapabilityLabel(kind: string): string {
  switch (kind) {
    case "breaker_wall":
    case "breaker_coverage":
      return "Wall-Breaker";
    case "breaker_sentry":
      return "Sentry-Breaker";
    case "breaker_code_gate":
      return "Code-Gate-Breaker";
    case "breaker_ap":
      return "AP-Breaker";
    case "breaker_trace":
      return "Trace-Breaker";
    case "breaker_watchdog":
      return "Watchdog-Breaker";
    case "breaker_black_ice":
      return "Black-Ice-Breaker";
    case "breaker_universal":
      return "Universal-Breaker";
    default:
      return kind;
  }
}
