import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { createAiActionEntrypoints } from "./ai-action-entrypoints";

describe("AI action entrypoints", () => {
  it("routes default decisions directly to the semantic runtime", () => {
    const calls: AiDecisionInput["side"][] = [];
    const entrypoints = createAiActionEntrypoints({
      chooseSemanticRuntimeAction: (input) => {
        calls.push(input.side);
        return decision("semantic-default");
      },
    });

    expect(entrypoints.chooseCorpAction(input("corp")).actionId).toBe(
      "semantic-default",
    );
    expect(entrypoints.chooseRunnerAction(input("runner")).actionId).toBe(
      "semantic-default",
    );
    expect(calls).toEqual(["corp", "runner"]);
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
