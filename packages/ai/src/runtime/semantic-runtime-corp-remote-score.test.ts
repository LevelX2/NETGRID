import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeCorpShouldBuildProtectedScoreRemote,
} from "./semantic-runtime-corp-remote-score";

describe("semanticRuntimeCorpShouldBuildProtectedScoreRemote", () => {
  it("uses semantic candidate credit cost for protected remote reserve checks", () => {
    const action = installIceAction();
    const input = corpInput();
    const candidate = semanticCandidate(action.actionId, 3);

    const result = semanticRuntimeCorpShouldBuildProtectedScoreRemote(
      input,
      action,
      {
        actionServerId: () => "remote_1",
        server: () => ({ id: "remote_1", ice: [], root: [] }),
        hasStabilizingAlternative: () => false,
        isRemoteServerTarget: () => true,
        emptyRemoteCount: () => 0,
        remoteIsProtected: () => false,
        actionIsScoreLine: () => false,
        remoteHasScoreLine: () => false,
        actionCreditCost: () => 99,
        advanceCompletesScore: () => false,
        visibleIceRezCost: (card) => card.rezCost,
        actionSourceCard: () => undefined,
      },
      candidate,
    );

    expect(result).toBe(true);
  });
});

function installIceAction(): LegalAction {
  return {
    actionId: "install-remote-ice",
    label: "Install remote ICE",
    type: "install_card",
    side: "corp",
    costs: [],
    timingPoint: "corp_action.main",
    visibility: "private_to_actor",
    expiresAtStateVersion: 12,
    targetRequirements: [],
    choiceRequirements: [],
    payload: {
      placement: "ice",
    },
  } as unknown as LegalAction;
}

function corpInput(): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    profileId: "test-corp",
    difficulty: "normal",
    eventTail: [],
    seed: "corp-remote-score-candidate-test",
    decisionId: "corp-remote-score-candidate-test.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 11,
      own: {
        credits: 5,
        clicks: 3,
        gripOrHq: [
          {
            known: true,
            type: "agenda",
          },
        ],
      },
      opponent: {
        identity: {
          counterDisplays: [],
        },
      },
      servers: [
        {
          id: "remote_1",
          ice: [],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function semanticCandidate(
  actionId: string,
  creditCost: number,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "explicit_ability_id",
    semanticActionType: "install.ice",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      creditCost,
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}
