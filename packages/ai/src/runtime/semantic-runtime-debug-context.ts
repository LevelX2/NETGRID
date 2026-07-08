import type {
  AiDecisionDebug,
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { semanticRuntimeCoverageSelectionDebug as buildSemanticRuntimeCoverageSelectionDebug } from "../diagnostics/coverage-selection-debug";
import { buildSemanticRuntimeActionAlternatives } from "../diagnostics/semantic-runtime-action-alternatives";
import { buildSemanticRuntimeDecisionDebug } from "../diagnostics/semantic-runtime-decision-debug";
import { buildSemanticRuntimeRankedAlternatives } from "../diagnostics/semantic-runtime-ranked-alternatives";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
} from "./semantic-runtime-types";

export type SemanticRuntimeDebugContextDependencies = {
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
    planRuntime: TacticalPlanRuntimeResult,
    actionSemanticCandidates: readonly ActionSemanticCandidate[],
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
    rankedChoices: SemanticRuntimeChoice[],
    selectedActionId: string,
  ): NonNullable<AiDecisionDebug["rankedAlternatives"]> {
    return buildSemanticRuntimeRankedAlternatives({
      rankedChoices,
      selectedActionId,
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
    });
  }

  return {
    semanticRuntimeDecisionDebug: (
      input,
      selected,
      rankedChoices,
      planRuntime,
      actionSemanticCandidates,
    ) => {
      const coverageSelection = coverageSelectionDebug(
        input,
        selected.action,
        planRuntime,
      );
      return buildSemanticRuntimeDecisionDebug({
        input,
        selected,
        actionSemanticCandidates,
        planRuntime,
        ...(coverageSelection ? { coverageSelection } : {}),
        selectedScoreBreakdown: selected.scoreBreakdown,
        rankedAlternatives: rankedAlternatives(
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
