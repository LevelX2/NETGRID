import type { AiDecision } from "@netgrid/shared";

export type ActionCapacitySimulationDiagnostics = {
  actionCapacityOpportunity?: boolean;
  actionCapacityLegalSourceCount?: number;
  actionCapacitySourceUsed?: boolean;
  actionCapacityPlanConversionUsed?: boolean;
  actionCapacityDominatedAlternativeCount?: number;
};

const ACTION_CAPACITY_SOURCE_COMPONENTS = new Set([
  "action_capacity_plan_conversion",
  "action_capacity_followup_conversion",
  "action_capacity_amortized_conversion",
]);

export function actionCapacityDiagnosticsForSimulationDecision(
  decision: AiDecision,
): ActionCapacitySimulationDiagnostics {
  const debug = decision.decisionDebug;
  const alternatives = debug?.actionAlternatives ?? [];
  const capacityAlternatives = alternatives.filter((alternative) =>
    alternative.scoreBreakdown?.some((component) =>
      ACTION_CAPACITY_SOURCE_COMPONENTS.has(component.key),
    ),
  );
  const selectedAlternative = alternatives.find(
    (alternative) => alternative.selected,
  );
  const selectedComponents = [
    ...(selectedAlternative?.scoreBreakdown ?? []),
    ...(debug?.scoreBreakdown ?? []),
  ];
  const sourceUsed = selectedComponents.some((component) =>
    ACTION_CAPACITY_SOURCE_COMPONENTS.has(component.key),
  );
  const planConversionUsed = selectedComponents.some(
    (component) => component.key === "action_capacity_plan_conversion",
  );
  const dominatedAlternativeCount = alternatives.filter((alternative) =>
    (alternative.whyNot ?? []).some(
      (entry) =>
        entry.includes("action_capacity_dominant:") ||
        entry.includes("action_capacity_dominated:") ||
        entry.includes("action_capacity_dominance"),
    ),
  ).length;
  return {
    ...(capacityAlternatives.length > 0
      ? {
          actionCapacityOpportunity: true,
          actionCapacityLegalSourceCount: capacityAlternatives.length,
        }
      : {}),
    ...(sourceUsed ? { actionCapacitySourceUsed: true } : {}),
    ...(planConversionUsed ? { actionCapacityPlanConversionUsed: true } : {}),
    ...(dominatedAlternativeCount > 0
      ? { actionCapacityDominatedAlternativeCount: dominatedAlternativeCount }
      : {}),
  };
}
