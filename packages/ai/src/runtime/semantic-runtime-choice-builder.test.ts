import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticRuntimeChoices } from "./semantic-runtime-choice-builder";

describe("buildSemanticRuntimeChoices", () => {
  it("uses semantic candidate credit cost in choice evidence", () => {
    const action = paidAction();
    const input = runnerInput(action);
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
      projectionMode: "basic_semantics",
    });
    if (!candidate) throw new Error("Expected paid candidate");

    const [choice] = buildSemanticRuntimeChoices(input, [candidate], {
      scope: {
        isRemoteServerTarget: () => false,
        runnerSourceCardAnswerRole: () => undefined,
      },
      actionExclusion: () => undefined,
      scoreBreakdown: () => [],
      actionCreditCost: () => 0,
      evidence: () => [],
      explanation: () => "test choice",
      compareAction: () => 0,
    });

    expect(choice?.evidence).toEqual(expect.arrayContaining(["credit_cost:4"]));
  });
});

function paidAction(): LegalAction {
  return {
    actionId: "runner-paid-action",
    label: "Runner paid action",
    type: "play_event",
    side: "runner",
    source: "runner-paid-card",
    costs: [{ credits: 4 }],
    timingPoint: "runner_action.main",
    visibility: "private_to_actor",
    expiresAtStateVersion: 12,
    targetRequirements: [],
    choiceRequirements: [],
    payload: {},
  } as unknown as LegalAction;
}

function runnerInput(action: LegalAction): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [action],
    profileId: "test-runner",
    difficulty: "normal",
    eventTail: [],
    seed: "semantic-runtime-choice-builder-test",
    decisionId: "semantic-runtime-choice-builder-test.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 11,
      own: {
        credits: 4,
        gripOrHq: [],
      },
      opponent: {
        identity: {
          counterDisplays: [],
        },
      },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}
