import type {
  AiDecision,
  AiDecisionDebug,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { semanticRuntimeCoverageSelectionDebug as buildSemanticRuntimeCoverageSelectionDebug } from "../diagnostics/coverage-selection-debug";
import { buildSemanticRuntimeActionAlternatives } from "../diagnostics/semantic-runtime-action-alternatives";
import { buildSemanticRuntimeDecisionDebug } from "../diagnostics/semantic-runtime-decision-debug";
import { buildSemanticRuntimeRankedAlternatives } from "../diagnostics/semantic-runtime-ranked-alternatives";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
  SemanticRuntimeExclusion,
} from "./semantic-runtime-types";

export type SemanticRuntimeDebugContextDependencies = {
  scoreBreakdown: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    exclusion?: SemanticRuntimeExclusion,
  ) => NonNullable<AiDecisionDebug["scoreBreakdown"]>;
  visibleSourceCard: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => Pick<VisibleCard, "title" | "definitionId"> | undefined;
};

export type SemanticRuntimeDebugContext = {
  semanticRuntimeDecisionDebug: (
    input: AiDecisionInput,
    selected: SemanticRuntimeChoice,
    rankedChoices: SemanticRuntimeChoice[],
    legacyDecision: AiDecision,
    legacyActionType: LegalAction["type"] | undefined,
    planRuntime: TacticalPlanRuntimeResult,
  ) => AiDecisionDebug;
  semanticRuntimeCoverageSelectionDebug: (
    input: AiDecisionInput,
    action: LegalAction,
    planRuntime: TacticalPlanRuntimeResult,
  ) => SemanticRuntimeCoverageSelectionDebug | undefined;
};

export function createSemanticRuntimeDebugContext(
  dependencies: SemanticRuntimeDebugContextDependencies,
): SemanticRuntimeDebugContext {
  function coverageSelectionDebug(
    input: AiDecisionInput,
    action: LegalAction,
    planRuntime: TacticalPlanRuntimeResult,
  ): SemanticRuntimeCoverageSelectionDebug | undefined {
    return buildSemanticRuntimeCoverageSelectionDebug(
      input,
      action,
      planRuntime,
      {
        visibleSourceCard: dependencies.visibleSourceCard,
      },
    );
  }

  function rankedAlternatives(
    input: AiDecisionInput,
    rankedChoices: SemanticRuntimeChoice[],
    selectedActionId: string,
  ): NonNullable<AiDecisionDebug["rankedAlternatives"]> {
    return buildSemanticRuntimeRankedAlternatives({
      rankedChoices,
      selectedActionId,
      scoreBreakdownForChoice: (choice) =>
        dependencies.scoreBreakdown(
          input,
          choice.action,
          choice.scopeId,
          choice.exclusion,
        ),
    });
  }

  function actionAlternatives(
    input: AiDecisionInput,
    rankedChoices: SemanticRuntimeChoice[],
    selectedActionId: string,
    planRuntime: TacticalPlanRuntimeResult,
  ): NonNullable<AiDecisionDebug["actionAlternatives"]> {
    const selectedChoice = rankedChoices.find(
      (choice) => choice.action.actionId === selectedActionId,
    );
    const coverageSelection = selectedChoice
      ? coverageSelectionDebug(input, selectedChoice.action, planRuntime)
      : undefined;
    return buildSemanticRuntimeActionAlternatives({
      rankedChoices,
      selectedActionId,
      planRuntime,
      ...(coverageSelection ? { coverageSelection } : {}),
      sourceTitleForChoice: (choice) =>
        dependencies.visibleSourceCard(input, choice.action)?.title,
      scoreBreakdownForChoice: (choice) =>
        dependencies.scoreBreakdown(
          input,
          choice.action,
          choice.scopeId,
          choice.exclusion,
        ),
    });
  }

  return {
    semanticRuntimeDecisionDebug: (
      input,
      selected,
      rankedChoices,
      legacyDecision,
      legacyActionType,
      planRuntime,
    ) => {
      const coverageSelection = coverageSelectionDebug(
        input,
        selected.action,
        planRuntime,
      );
      const selectedScoreBreakdown = dependencies.scoreBreakdown(
        input,
        selected.action,
        selected.scopeId,
      );
      return buildSemanticRuntimeDecisionDebug({
        input,
        selected,
        legacyDecision,
        ...(legacyActionType ? { legacyActionType } : {}),
        planRuntime,
        ...(coverageSelection ? { coverageSelection } : {}),
        selectedScoreBreakdown,
        rankedAlternatives: rankedAlternatives(
          input,
          rankedChoices,
          selected.action.actionId,
        ),
        actionAlternatives: actionAlternatives(
          input,
          rankedChoices,
          selected.action.actionId,
          planRuntime,
        ),
      });
    },
    semanticRuntimeCoverageSelectionDebug: coverageSelectionDebug,
  };
}
