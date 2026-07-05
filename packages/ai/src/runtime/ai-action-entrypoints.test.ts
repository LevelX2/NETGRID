import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createAiActionEntrypoints } from "./ai-action-entrypoints";

describe("AI action entrypoints", () => {
  it("does not attach a legacy provider to default semantic decisions", () => {
    const legacyProviders: Array<(() => AiDecision) | undefined> = [];
    const entrypoints = createAiActionEntrypoints({
      chooseSemanticRuntimeAction: (_input, _options, legacyDecisionProvider) => {
        legacyProviders.push(legacyDecisionProvider);
        return decision("semantic-default");
      },
      scoreActions: () => {
        throw new Error("default semantic decisions must not score legacy actions");
      },
      decisionFromChoices: () => {
        throw new Error("default semantic decisions must not build legacy choices");
      },
      hasCorpPlanAction: () => false,
      isCorpReactiveBaselineDecision: () => false,
      chooseCorpPlanAction: () => {
        throw new Error("default semantic decisions must not choose legacy corp plans");
      },
      hasRunnerPlanAction: () => false,
      isRunnerReactiveBaselineDecision: () => false,
      baselineShellTradersPlanIsVisible: () => false,
      runnerHasConditionalPaymentContinueDecision: () => false,
      chooseRunnerPlanAction: () => {
        throw new Error("default semantic decisions must not choose legacy runner plans");
      },
      runnerSelfDamageGuardedDecision: (_input, decision) => decision,
    });

    expect(entrypoints.chooseCorpAction(input("corp")).actionId).toBe(
      "semantic-default",
    );
    expect(entrypoints.chooseRunnerAction(input("runner")).actionId).toBe(
      "semantic-default",
    );
    expect(legacyProviders).toEqual([undefined, undefined]);
  });
});

function input(side: AiDecisionInput["side"]): AiDecisionInput {
  return {
    side,
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function decision(actionId: string): AiDecision {
  return {
    actionId,
    reasonCode: "semantic.default",
    explanation: "Semantic default test decision.",
    consideredActionIds: [],
    fallbackUsed: false,
  };
}
