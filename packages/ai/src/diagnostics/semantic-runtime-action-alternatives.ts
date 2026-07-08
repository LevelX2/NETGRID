import type { AiDecisionDebug } from "@netgrid/shared";
import type {
  SemanticRuntimeChoice,
  SemanticRuntimeCoverageSelectionDebug,
} from "../runtime/semantic-runtime-types";
import type { TacticalPlanRuntimeResult } from "../tactical-plans";
import {
  buildSemanticRuntimePlanSelectionDisplayContext,
  semanticRuntimeDebugActionDisplayScore,
  semanticRuntimeDebugActionWhyChosen,
  semanticRuntimeDebugActionWhyNot,
  semanticRuntimeDebugCoverageScoreBreakdown,
  semanticRuntimeDebugExcludedActionWhyNot,
  semanticRuntimeDebugPlanSelectionScoreBreakdown,
} from "./semantic-runtime-debug";

export type BuildSemanticRuntimeActionAlternativesInput = {
  rankedChoices: readonly SemanticRuntimeChoice[];
  selectedActionId: string;
  planRuntime: TacticalPlanRuntimeResult;
  coverageSelection?: SemanticRuntimeCoverageSelectionDebug;
  sourceTitleForChoice: (choice: SemanticRuntimeChoice) => string | undefined;
};

export function buildSemanticRuntimeActionAlternatives({
  rankedChoices,
  selectedActionId,
  planRuntime,
  coverageSelection,
  sourceTitleForChoice,
}: BuildSemanticRuntimeActionAlternativesInput): NonNullable<
  AiDecisionDebug["actionAlternatives"]
> {
  const selectedChoice = rankedChoices.find(
    (choice) => choice.action.actionId === selectedActionId,
  );
  const planSelection = buildSemanticRuntimePlanSelectionDisplayContext({
    planRuntime,
    selectedActionId,
    ...(selectedChoice ? { selectedChoice } : {}),
    ...(coverageSelection ? { coverageSelection } : {}),
  });
  const orderedChoices = rankedChoices.slice().sort((left, right) => {
    const leftSelected = left.action.actionId === selectedActionId;
    const rightSelected = right.action.actionId === selectedActionId;
    if (leftSelected !== rightSelected) return leftSelected ? -1 : 1;
    return 0;
  });
  return orderedChoices.slice(0, 32).map((choice, index) => {
    const selected = choice.action.actionId === selectedActionId;
    const displayScore = semanticRuntimeDebugActionDisplayScore(
      choice,
      selected,
      planSelection,
    );
    const planScoreBreakdown = semanticRuntimeDebugPlanSelectionScoreBreakdown(
      choice,
      selected,
      displayScore,
      planSelection,
    );
    const coverageScoreBreakdown = semanticRuntimeDebugCoverageScoreBreakdown(
      choice,
      selected,
      planSelection,
    );
    const sourceTitle = sourceTitleForChoice(choice);
    return {
      rank: index + 1,
      actionId: choice.action.actionId,
      actionType: choice.action.type,
      label: choice.action.label,
      source: String(choice.action.source),
      ...(sourceTitle ? { sourceTitle } : {}),
      selected,
      score: choice.score,
      ...(choice.exclusion ? { excluded: true } : { priority: displayScore }),
      scoreBreakdown: [
        ...choice.scoreBreakdown,
        ...coverageScoreBreakdown,
        ...planScoreBreakdown,
      ],
      ...(selected
        ? {
            whyChosen: semanticRuntimeDebugActionWhyChosen(
              choice,
              planSelection,
            ),
          }
        : {
            whyNot: choice.exclusion
              ? semanticRuntimeDebugExcludedActionWhyNot(
                  choice,
                  displayScore,
                  planSelection,
                )
              : semanticRuntimeDebugActionWhyNot(
                  choice,
                  displayScore,
                  planSelection,
                ),
          }),
    };
  });
}
