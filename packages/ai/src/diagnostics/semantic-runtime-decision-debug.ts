import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionDebug,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
} from "../runtime/semantic-runtime-types";
import { scrubEvidence } from "../runtime/semantic-runtime-score-components";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import { buildSemanticDecisionDebugDiagnostics } from "./decision-debug";
import { semanticRuntimeMemoryDebug } from "./semantic-runtime-memory-debug";
import {
  buildSemanticRuntimePlanSelectionDisplayContext,
  semanticRuntimeDebugActionDisplayScore,
  semanticRuntimeDebugCalibrationProfileItems,
  semanticRuntimeDebugCoverageScoreBreakdown,
  semanticRuntimeDebugDoctrineGoalItems,
  semanticRuntimeDebugMistakeSummaryItems,
  semanticRuntimeDebugPilotScopeItems,
  semanticRuntimeDebugPlanSelectionScoreBreakdown,
  semanticRuntimeDebugShadowTopItems,
  semanticRuntimeDebugTacticalPlanItems,
  semanticRuntimeDebugTargetChoiceShadowItems,
} from "./semantic-runtime-debug";

export type BuildSemanticRuntimeDecisionDebugInput = {
  input: AiDecisionInput;
  selected: SemanticRuntimeChoice;
  legacyDecision: AiDecision;
  legacyActionType?: LegalAction["type"];
  planRuntime: TacticalPlanRuntimeResult;
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
  selectedScoreBreakdown: NonNullable<AiDecisionDebug["scoreBreakdown"]>;
  rankedAlternatives: NonNullable<AiDecisionDebug["rankedAlternatives"]>;
  actionAlternatives: NonNullable<AiDecisionDebug["actionAlternatives"]>;
};

export function buildSemanticRuntimeDecisionDebug({
  input,
  selected,
  legacyDecision,
  legacyActionType,
  planRuntime,
  coverageSelection,
  selectedScoreBreakdown,
  rankedAlternatives,
  actionAlternatives,
}: BuildSemanticRuntimeDecisionDebugInput): AiDecisionDebug {
  const legacyDebug = legacyDecision.decisionDebug;
  const legacyPlanKind = legacyDebug?.planKind;
  const legacyDebugSelectedActionType = legacyDebug?.selectedActionType;
  const memoryDebug = semanticRuntimeMemoryDebug(input);
  const selectedPlan = planRuntime.selectedPlan;
  const selectedStep = planRuntime.selectedStep;
  const selectedPlanSelection = buildSemanticRuntimePlanSelectionDisplayContext({
    planRuntime,
    selectedActionId: selected.action.actionId,
    selectedChoice: selected,
    ...(coverageSelection ? { coverageSelection } : {}),
  });
  const selectedDisplayScore = semanticRuntimeDebugActionDisplayScore(
    selected,
    true,
    selectedPlanSelection,
  );
  const debugDiagnostics = buildSemanticDecisionDebugDiagnostics({
    scopeId: selected.scopeId,
    selectedActionType: selected.action.type,
    ...(coverageSelection ? { coverageEvidence: coverageSelection.evidence } : {}),
    ...(legacyActionType ? { legacyActionType } : {}),
    ...(legacyPlanKind ? { legacyPlanKind } : {}),
    ...(legacyDebugSelectedActionType ? { legacyDebugSelectedActionType } : {}),
    selectedEvidence: scrubEvidence(selected.evidence),
    ...(selectedPlan
      ? {
          selectedPlan: {
            planId: selectedPlan.planId,
            type: selectedPlan.type,
          },
        }
      : {}),
    ...(selectedStep ? { selectedStepKind: selectedStep.kind } : {}),
    ...(planRuntime.planAlternatives.length > 0 || planRuntime.previousPlan
      ? { tacticalPlanItems: semanticRuntimeDebugTacticalPlanItems(planRuntime) }
      : {}),
    ...(memoryDebug.items.length > 0
      ? { memoryItems: memoryDebug.items, memorySectionTitle: "KI-Speicher" }
      : {}),
    semanticShadowTopItems: semanticRuntimeDebugShadowTopItems(selected),
    pilotScopeItems: semanticRuntimeDebugPilotScopeItems(selected.evidence),
    calibrationProfileItems: semanticRuntimeDebugCalibrationProfileItems(
      selected.evidence,
    ),
    targetChoiceShadowItems: semanticRuntimeDebugTargetChoiceShadowItems(
      selected.action,
    ),
    doctrineGoalItems: semanticRuntimeDebugDoctrineGoalItems(
      input,
      selectedScoreBreakdown,
    ),
    mistakeSummaryItems: semanticRuntimeDebugMistakeSummaryItems(
      selected.evidence,
    ),
  });
  return {
    schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
    aiLevel: legacyDebug?.aiLevel ?? 2,
    summary: selected.explanation,
    planId: selectedPlan?.planId ?? `semantic_runtime:${selected.scopeId}`,
    planKind: selectedPlan?.type ?? selected.scopeId,
    selectedActionType: selected.action.type,
    score: selected.score,
    ...(selected.confidence !== undefined
      ? { confidence: selected.confidence }
      : {}),
    visibleReasons: scrubEvidence([
      ...(coverageSelection?.evidence ?? []),
      ...selected.evidence,
    ]).slice(0, 8),
    rankedAlternatives,
    actionAlternatives,
    scoreBreakdown: [
      ...selectedScoreBreakdown,
      ...semanticRuntimeDebugCoverageScoreBreakdown(
        selected,
        true,
        selectedPlanSelection,
      ),
      ...semanticRuntimeDebugPlanSelectionScoreBreakdown(
        selected,
        true,
        selectedDisplayScore,
        selectedPlanSelection,
      ),
    ],
    whyNot:
      legacyActionType && legacyActionType !== selected.action.type
        ? [`legacy_reference_action_type:${legacyActionType}`]
        : [],
    longTermPlan: debugDiagnostics.longTermPlan,
    ...(memoryDebug.memoryVersion
      ? { memoryVersion: memoryDebug.memoryVersion }
      : {}),
    ...(memoryDebug.facts.length > 0 ? { facts: memoryDebug.facts } : {}),
    ...(memoryDebug.hypotheses.length > 0
      ? { hypotheses: memoryDebug.hypotheses }
      : {}),
    ...(memoryDebug.invalidations.length > 0
      ? { invalidations: memoryDebug.invalidations }
      : {}),
    ...(memoryDebug.beliefUncertainty.length > 0
      ? { beliefUncertainty: memoryDebug.beliefUncertainty }
      : {}),
    ...(memoryDebug.opponentModel
      ? { opponentModel: memoryDebug.opponentModel }
      : {}),
    ...(debugDiagnostics.warnings.length > 0
      ? { warnings: debugDiagnostics.warnings }
      : {}),
    detailSections: debugDiagnostics.detailSections,
    evidence: scrubEvidence([
      ...selected.evidence,
      ...(legacyDecision.evidence ?? []).map(
        (entry) => `legacy_reference:${entry}`,
      ),
    ]).slice(0, 12),
    fallbackUsed: false,
    profileId: input.profileId,
    timeoutUsed: Boolean(legacyDecision.timeoutUsed),
  };
}
