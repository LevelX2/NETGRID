import {
  scoreActionsForLegacy,
  type LegacyActionScorerDependencies,
} from "../legacy/legacy-entrypoints";
import {
  createAiActionEntrypoints,
  type AiActionEntrypointDependencies,
} from "./ai-action-entrypoints";

export type AiActionEntrypointsCompositionDependencies =
  Omit<AiActionEntrypointDependencies, "scoreActions"> &
    LegacyActionScorerDependencies;

export function createAiActionEntrypointsComposition(
  dependencies: AiActionEntrypointsCompositionDependencies,
) {
  const entrypoints = createAiActionEntrypoints({
    chooseSemanticRuntimeAction: dependencies.chooseSemanticRuntimeAction,
    scoreActions: (input, side) =>
      scoreActionsForLegacy(input, side, {
        extractAiFeatures: dependencies.extractAiFeatures,
        scoreRunnerAction: dependencies.scoreRunnerAction,
        scoreCorpAction: dependencies.scoreCorpAction,
      }),
    decisionFromChoices: dependencies.decisionFromChoices,
    hasCorpPlanAction: dependencies.hasCorpPlanAction,
    isCorpReactiveBaselineDecision:
      dependencies.isCorpReactiveBaselineDecision,
    chooseCorpPlanAction: dependencies.chooseCorpPlanAction,
    hasRunnerPlanAction: dependencies.hasRunnerPlanAction,
    isRunnerReactiveBaselineDecision:
      dependencies.isRunnerReactiveBaselineDecision,
    baselineShellTradersPlanIsVisible:
      dependencies.baselineShellTradersPlanIsVisible,
    runnerHasConditionalPaymentContinueDecision:
      dependencies.runnerHasConditionalPaymentContinueDecision,
    chooseRunnerPlanAction: dependencies.chooseRunnerPlanAction,
    runnerSelfDamageGuardedDecision:
      dependencies.runnerSelfDamageGuardedDecision,
  });

  return {
    ...entrypoints,
    scoreRunnerAction: dependencies.scoreRunnerAction,
    scoreCorpAction: dependencies.scoreCorpAction,
  };
}
