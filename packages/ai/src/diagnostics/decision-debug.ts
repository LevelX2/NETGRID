import type { AiDecisionDebug, AiDecisionScoreComponent } from "@netgrid/shared";
import type {
  SemanticDecisionTraceDiagnosticSection,
  SemanticDecisionTraceDiagnosticSectionId,
} from "../decision/semantic-decision-trace";
import {
  containsForbiddenSemanticMarker,
  redactSemanticString,
} from "./semantic-redaction";

type AiDecisionDetailSection = NonNullable<
  AiDecisionDebug["detailSections"]
>[number];

const DETAIL_SELECTED_EVIDENCE_PREFIXES = [
  "run_only_action_",
  "run_action_spending_cap_",
] as const;

export type SemanticDecisionDebugPlanReference = {
  planId: string;
  type: string;
};

export type SemanticDecisionDebugDiagnosticsInput = {
  scopeId: string;
  selectedActionType: string;
  coverageEvidence?: readonly string[];
  legacyActionType?: string;
  legacyPlanKind?: string;
  legacyDebugSelectedActionType?: string;
  selectedEvidence?: readonly string[];
  selectedPlan?: SemanticDecisionDebugPlanReference;
  selectedStepKind?: string;
  tacticalPlanItems?: readonly string[];
  memoryItems?: readonly string[];
  memorySectionTitle?: string;
  semanticShadowTopItems?: readonly string[];
  pilotScopeItems?: readonly string[];
  calibrationProfileItems?: readonly string[];
  targetChoiceShadowItems?: readonly string[];
  doctrineGoalItems?: readonly string[];
  mistakeSummaryItems?: readonly string[];
};

export type SemanticDecisionDebugDiagnostics = {
  warnings: string[];
  detailItems: string[];
  detailSections: AiDecisionDetailSection[];
  longTermPlan: string[];
};

export type SemanticDecisionDebugScoreComponentInput = {
  key: string;
  label: string;
  value: number;
  weight?: number;
  reason?: string;
};

export type SemanticDecisionDebugPilotScopeDecisionMatrix = {
  topActionId: string;
  scoreGap: number;
  scopes: readonly {
    scope: string;
    allowed: boolean;
    reason: string;
    evidence: readonly string[];
  }[];
};

const TRACE_DIAGNOSTIC_SECTION_TITLES = {
  semantic_shadow_top: "Semantic Shadow Top",
  pilot_scope: "Pilot Scope",
  calibration_profile: "Calibration Profile",
  target_choice_shadow: "Target Choice Shadow",
  doctrine_goal: "Doctrine Goal",
  mistake_summary: "Mistake Summary",
} as const satisfies Record<SemanticDecisionTraceDiagnosticSectionId, string>;

export function buildSemanticDecisionDebugScoreComponent(
  input: SemanticDecisionDebugScoreComponentInput,
): AiDecisionScoreComponent {
  return {
    key: sideSafeDebugValue(input.key),
    label: sideSafeDebugValue(input.label),
    value: input.value,
    ...(input.weight !== undefined ? { weight: input.weight } : {}),
    ...(input.reason !== undefined
      ? { reason: sideSafeDebugValue(input.reason) }
      : {}),
  };
}

export function buildPilotScopeDecisionMatrixDebugItems(
  matrix: SemanticDecisionDebugPilotScopeDecisionMatrix,
): string[] {
  return sideSafeDebugItems([
    `pilot_scope_matrix_top_action:${matrix.topActionId}`,
    `pilot_scope_matrix_score_gap:${matrix.scoreGap}`,
    `pilot_scope_matrix_scope_count:${matrix.scopes.length}`,
    ...matrix.scopes.flatMap((scope) => [
      `pilot_scope_matrix_scope:${scope.scope}`,
      `pilot_scope_matrix_allowed:${scope.scope}:${scope.allowed}`,
      `pilot_scope_matrix_reason:${scope.scope}:${scope.reason}`,
      ...scope.evidence.map(
        (entry) => `pilot_scope_matrix_evidence:${scope.scope}:${entry}`,
      ),
    ]),
  ]);
}

export function buildSemanticDecisionDebugDiagnostics(
  input: SemanticDecisionDebugDiagnosticsInput,
): SemanticDecisionDebugDiagnostics {
  const detailItems = sideSafeDebugItems([
    `semantic_runtime_scope:${input.scopeId}`,
    `semantic_actual_action_type:${input.selectedActionType}`,
    ...(input.coverageEvidence ?? []),
    ...(input.legacyActionType
      ? [`legacy_reference_action_type:${input.legacyActionType}`]
      : []),
    ...(input.legacyPlanKind
      ? [`legacy_reference_plan:${input.legacyPlanKind}`]
      : []),
    ...(input.legacyDebugSelectedActionType
      ? [
          `legacy_debug_selected_action_type:${input.legacyDebugSelectedActionType}`,
        ]
      : []),
    ...(input.selectedEvidence ?? [])
      .filter((entry) =>
        DETAIL_SELECTED_EVIDENCE_PREFIXES.some((prefix) =>
          entry.startsWith(prefix),
        ),
      )
      .slice(0, 8),
  ]);

  const longTermPlan = sideSafeDebugItems([
    ...(input.selectedPlan
      ? [
          `tactical_plan:${input.selectedPlan.planId}`,
          `tactical_plan_type:${input.selectedPlan.type}`,
          ...(input.selectedStepKind
            ? [`tactical_step:${input.selectedStepKind}`]
            : []),
        ]
      : [`semantic_runtime_scope:${input.scopeId}`]),
    ...(input.legacyPlanKind
      ? [`legacy_reference_plan:${input.legacyPlanKind}`]
      : []),
  ]);

  const detailSections: AiDecisionDetailSection[] = [
    {
      id: "semantic_runtime",
      title: "Semantic Runtime",
      items: detailItems,
    },
    ...semanticDecisionTraceDiagnosticSections([
      {
        id: "semantic_shadow_top",
        items: input.semanticShadowTopItems,
      },
      {
        id: "pilot_scope",
        items: input.pilotScopeItems,
      },
      {
        id: "calibration_profile",
        items: input.calibrationProfileItems,
      },
      {
        id: "target_choice_shadow",
        items: input.targetChoiceShadowItems,
      },
      {
        id: "doctrine_goal",
        items: input.doctrineGoalItems,
      },
      {
        id: "mistake_summary",
        items: input.mistakeSummaryItems,
      },
    ]),
    ...(input.tacticalPlanItems && input.tacticalPlanItems.length > 0
      ? [
          {
            id: "tactical_plan",
            title: "Tactical Plan",
            items: sideSafeDebugItems(input.tacticalPlanItems),
          },
        ]
      : []),
    ...(input.memoryItems && input.memoryItems.length > 0
      ? [
          {
            id: "semantic_memory",
            title: input.memorySectionTitle ?? "Semantic Memory",
            items: sideSafeDebugItems(input.memoryItems),
          },
        ]
      : []),
  ];

  return {
    warnings:
      input.legacyActionType !== undefined &&
      input.legacyActionType !== input.selectedActionType
        ? ["semantic_runtime_actual_differs_from_legacy_debug"]
        : input.legacyDebugSelectedActionType !== undefined &&
            input.legacyDebugSelectedActionType !== input.selectedActionType
          ? ["semantic_runtime_actual_differs_from_legacy_debug"]
          : [],
    detailItems,
    detailSections,
    longTermPlan,
  };
}

function semanticDecisionTraceDiagnosticSections(
  sections: readonly {
    id: SemanticDecisionTraceDiagnosticSectionId;
    items?: readonly string[] | undefined;
  }[],
): SemanticDecisionTraceDiagnosticSection[] {
  return sections.flatMap((section) => {
    const items = sideSafeDebugItems(section.items ?? []);
    if (items.length === 0) return [];
    return [
      {
        id: section.id,
        title: TRACE_DIAGNOSTIC_SECTION_TITLES[section.id],
        items,
      },
    ];
  });
}

function sideSafeDebugItems(items: readonly string[]): string[] {
  return items.filter((item) => !containsForbiddenSemanticMarker(item));
}

function sideSafeDebugValue(value: string): string {
  return redactSemanticString(value);
}
