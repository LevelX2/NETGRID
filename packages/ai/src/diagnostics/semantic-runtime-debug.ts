import type { AiDecisionDebug, AiDecisionScoreComponent } from "@netgrid/shared";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
} from "../runtime/semantic-runtime-types";
import { buildSemanticDecisionDebugScoreComponent } from "./decision-debug";

export type SemanticRuntimeDebugPlanContext = {
  selectedChoice?: SemanticRuntimeChoice;
  selectedActionId: string;
  selectedRawScore: number;
  selectedByPlanMapping: boolean;
  planMatchDisplayBoost: number;
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
  selectedPlanId?: string;
  selectedPlanType?: string;
  mappedActionOrder: Map<string, number>;
};

export type BuildSemanticRuntimeDebugPlanContextInput = {
  selectedActionId: string;
  selectedChoice?: SemanticRuntimeChoice;
  mappedActionIds?: readonly string[];
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
  selectedPlanId?: string;
  selectedPlanType?: string;
  planMatchDisplayBoost?: number;
};

export function buildSemanticRuntimeDebugPlanContext({
  selectedActionId,
  selectedChoice,
  mappedActionIds = [],
  coverageSelection,
  selectedPlanId,
  selectedPlanType,
  planMatchDisplayBoost = 250,
}: BuildSemanticRuntimeDebugPlanContextInput): SemanticRuntimeDebugPlanContext {
  const mappedActionOrder = new Map(
    mappedActionIds.map((actionId, index) => [actionId, index]),
  );
  const selectedByPlanMapping =
    mappedActionOrder.has(selectedActionId) &&
    selectedChoice?.evidence.some((entry) =>
      entry.startsWith("tactical_plan_mapping_overridden:true"),
    ) !== true;
  return {
    ...(selectedChoice ? { selectedChoice } : {}),
    selectedActionId,
    selectedRawScore: selectedChoice?.score ?? 0,
    selectedByPlanMapping,
    planMatchDisplayBoost: selectedByPlanMapping ? planMatchDisplayBoost : 0,
    ...(coverageSelection ? { coverageSelection } : {}),
    ...(selectedPlanId ? { selectedPlanId } : {}),
    ...(selectedPlanType ? { selectedPlanType } : {}),
    mappedActionOrder,
  };
}

export function semanticRuntimeDebugCoverageScoreBreakdown(
  choice: SemanticRuntimeChoice,
  selected: boolean,
  context: SemanticRuntimeDebugPlanContext,
): AiDecisionScoreComponent[] {
  const coverageSelection = context.coverageSelection;
  if (
    !selected ||
    !coverageSelection ||
    choice.action.actionId !== context.selectedActionId
  ) {
    return [];
  }
  return [
    buildSemanticDecisionDebugScoreComponent({
      key: "runner_coverage_answer_fit",
      label: `Coverage-Suchtreffer: ${coverageSelection.capabilityLabel}`,
      value: 0,
      reason: coverageSelection.evidence.join("|"),
    }),
  ];
}

export function semanticRuntimeDebugActionDisplayScore(
  choice: SemanticRuntimeChoice,
  selected: boolean,
  context: SemanticRuntimeDebugPlanContext,
): number {
  if (choice.exclusion) return choice.score;
  if (!context.selectedByPlanMapping) return choice.score;
  const selectedFinalScore =
    context.selectedRawScore + context.planMatchDisplayBoost;
  if (selected) return selectedFinalScore;
  const selectedOrder = context.mappedActionOrder.get(context.selectedActionId);
  const choiceOrder = context.mappedActionOrder.get(choice.action.actionId);
  if (choiceOrder !== undefined && selectedOrder !== undefined) {
    if (choiceOrder > selectedOrder) {
      return Math.min(
        choice.score,
        selectedFinalScore - (choiceOrder - selectedOrder) * 25,
      );
    }
    return choice.score;
  }
  if (choice.score > selectedFinalScore) {
    return selectedFinalScore - 50;
  }
  return choice.score;
}

export function semanticRuntimeDebugPlanSelectionScoreBreakdown(
  choice: SemanticRuntimeChoice,
  selected: boolean,
  displayScore: number,
  context: SemanticRuntimeDebugPlanContext,
): AiDecisionScoreComponent[] {
  if (!context.selectedByPlanMapping || choice.exclusion) return [];
  const reason = [
    `rawSemanticScore:${choice.score}`,
    `finalSelectionScore:${displayScore}`,
    context.selectedPlanType ? `selectedPlan:${context.selectedPlanType}` : "",
    context.planMatchDisplayBoost
      ? `planMatchDisplayBoost:${context.planMatchDisplayBoost}`
      : "",
    context.mappedActionOrder.has(choice.action.actionId)
      ? "selected_by_plan_mapping_candidate:true"
      : "plan_mismatch:true",
  ]
    .filter(Boolean)
    .join("|");
  return [
    buildSemanticDecisionDebugScoreComponent({
      key: selected ? "selected_by_plan_mapping" : "plan_selection_adjustment",
      label: selected ? "Plan-Auswahl" : "Plan-Abgleich",
      value: roundScore(displayScore - choice.score),
      reason,
    }),
  ];
}

export function semanticRuntimeDebugActionWhyChosen(
  choice: SemanticRuntimeChoice,
  context: SemanticRuntimeDebugPlanContext,
): string[] {
  if (context.selectedByPlanMapping) {
    return [
      "selected_by_plan_mapping",
      `rawSemanticScore:${choice.score}`,
      `finalSelectionScore:${choice.score + context.planMatchDisplayBoost}`,
      ...(context.selectedPlanType
        ? [`selectedPlan:${context.selectedPlanType}`]
        : []),
    ];
  }
  return ["semantic_runtime_actual"];
}

export function semanticRuntimeDebugActionWhyNot(
  choice: SemanticRuntimeChoice,
  displayScore: number,
  context: SemanticRuntimeDebugPlanContext,
): string[] {
  if (context.selectedByPlanMapping) {
    const mapped = context.mappedActionOrder.has(choice.action.actionId);
    return [
      mapped ? "lower_plan_fit" : "plan_mismatch",
      mapped ? "selected_by_plan_mapping" : "excluded_by_current_plan",
      `rawSemanticScore:${choice.score}`,
      `finalSelectionScore:${displayScore}`,
      ...(displayScore < choice.score
        ? ["lower_final_score_after_adjustment"]
        : []),
    ];
  }
  return ["semantic_score_below_selected"];
}

export function semanticRuntimeDebugRankedAlternatives(
  params: {
    rankedChoices: readonly SemanticRuntimeChoice[];
    selectedActionId: string;
    scoreBreakdownForChoice: (
      choice: SemanticRuntimeChoice,
    ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
    scrubEvidence: (evidence: string[]) => string[];
  },
): NonNullable<AiDecisionDebug["rankedAlternatives"]> {
  return params.rankedChoices
    .filter((choice) => !choice.exclusion)
    .slice(0, 24)
    .map((choice, index) => ({
      rank: index + 1,
      planId: `semantic_runtime:${choice.scopeId}:${choice.action.type}`,
      planKind: choice.scopeId,
      selectedActionType: choice.action.type,
      summary: choice.explanation,
      score: choice.score,
      ...(choice.confidence !== undefined
        ? { confidence: choice.confidence }
        : {}),
      visibleReasons: params.scrubEvidence(choice.evidence).slice(0, 4),
      scoreBreakdown: params.scoreBreakdownForChoice(choice),
      whyNot:
        choice.action.actionId === params.selectedActionId
          ? ["selected_action"]
          : ["semantic_score_below_selected"],
    }));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
