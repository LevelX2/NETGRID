import type { AiDecision, AiDecisionInput, Side } from "@netgrid/shared";
import {
  type AiDecisionRuntimeOptions,
  chooseAiActionFromSides,
} from "./choose-ai-action";
import { memoizeLegacyDecision } from "./legacy-decision-provider";
import {
  chooseCorpLegacyBaselineAction,
  chooseRunnerLegacyBaselineAction,
  type LegacyBaselineChoice,
} from "../legacy/legacy-baseline";

export type AiActionEntrypointDependencies = {
  chooseSemanticRuntimeAction: (
    input: AiDecisionInput,
    legacyDecisionProvider: () => AiDecision,
    options: AiDecisionRuntimeOptions,
  ) => AiDecision;
  scoreActions: (
    input: AiDecisionInput,
    side: Side,
  ) => LegacyBaselineChoice[];
  decisionFromChoices: (
    input: AiDecisionInput,
    choices: LegacyBaselineChoice[],
  ) => AiDecision;
  hasCorpPlanAction: (input: AiDecisionInput) => boolean;
  isCorpReactiveBaselineDecision: (decision: AiDecision) => boolean;
  chooseCorpPlanAction: (
    input: AiDecisionInput,
    baselineDecision: AiDecision,
  ) => AiDecision;
  hasRunnerPlanAction: (input: AiDecisionInput) => boolean;
  isRunnerReactiveBaselineDecision: (decision: AiDecision) => boolean;
  baselineShellTradersPlanIsVisible: (
    input: AiDecisionInput,
    baselineDecision: AiDecision,
  ) => boolean;
  runnerHasConditionalPaymentContinueDecision: (
    input: AiDecisionInput,
    baselineAction: AiDecisionInput["legalActions"][number] | undefined,
  ) => boolean;
  chooseRunnerPlanAction: (
    input: AiDecisionInput,
    baselineDecision: AiDecision,
  ) => AiDecision;
  runnerSelfDamageGuardedDecision: (
    input: AiDecisionInput,
    decision: AiDecision,
  ) => AiDecision;
};

export function createAiActionEntrypoints(
  dependencies: AiActionEntrypointDependencies,
): {
  chooseAiAction: (
    input: AiDecisionInput,
    options?: AiDecisionRuntimeOptions,
  ) => AiDecision;
  chooseCorpAction: (
    input: AiDecisionInput,
    options?: AiDecisionRuntimeOptions,
  ) => AiDecision;
  chooseCorpBaselineAction: (input: AiDecisionInput) => AiDecision;
  chooseRunnerAction: (
    input: AiDecisionInput,
    options?: AiDecisionRuntimeOptions,
  ) => AiDecision;
  chooseRunnerBaselineAction: (input: AiDecisionInput) => AiDecision;
} {
  function chooseAiAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions = {},
  ): AiDecision {
    return chooseAiActionFromSides(input, options, {
      corp: chooseCorpAction,
      runner: chooseRunnerAction,
    });
  }

  function chooseCorpAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions = {},
  ): AiDecision {
    return dependencies.chooseSemanticRuntimeAction(
      input,
      memoizeLegacyDecision(() => {
        const baselineDecision = chooseCorpBaselineAction(input);
        return dependencies.hasCorpPlanAction(input) &&
          !dependencies.isCorpReactiveBaselineDecision(baselineDecision)
          ? dependencies.chooseCorpPlanAction(input, baselineDecision)
          : baselineDecision;
      }),
      options,
    );
  }

  function chooseCorpBaselineAction(input: AiDecisionInput): AiDecision {
    return chooseCorpLegacyBaselineAction(input, {
      scoreActions: dependencies.scoreActions,
      decisionFromChoices: dependencies.decisionFromChoices,
    });
  }

  function chooseRunnerAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions = {},
  ): AiDecision {
    return dependencies.chooseSemanticRuntimeAction(
      input,
      memoizeLegacyDecision(() => {
        const baselineDecision = chooseRunnerBaselineAction(input);
        const baselineAction = input.legalActions.find(
          (candidate) => candidate.actionId === baselineDecision.actionId,
        );
        const shouldUsePlanAction =
          dependencies.hasRunnerPlanAction(input) &&
          (!dependencies.isRunnerReactiveBaselineDecision(baselineDecision) ||
            dependencies.baselineShellTradersPlanIsVisible(
              input,
              baselineDecision,
            )) &&
          !dependencies.runnerHasConditionalPaymentContinueDecision(
            input,
            baselineAction,
          );
        const legacyDecision = shouldUsePlanAction
          ? dependencies.chooseRunnerPlanAction(input, baselineDecision)
          : baselineDecision;
        return dependencies.runnerSelfDamageGuardedDecision(
          input,
          legacyDecision,
        );
      }),
      options,
    );
  }

  function chooseRunnerBaselineAction(input: AiDecisionInput): AiDecision {
    return chooseRunnerLegacyBaselineAction(input, {
      scoreActions: dependencies.scoreActions,
      decisionFromChoices: dependencies.decisionFromChoices,
    });
  }

  return {
    chooseAiAction,
    chooseCorpAction,
    chooseCorpBaselineAction,
    chooseRunnerAction,
    chooseRunnerBaselineAction,
  };
}
