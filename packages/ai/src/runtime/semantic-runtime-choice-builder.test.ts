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
      evidence: (_input, _action, _scopeId, actionSemanticCandidate) => [
        `evidence_candidate_cost:${actionSemanticCandidate?.costProfile.creditCost ?? "none"}`,
      ],
      explanation: () => "test choice",
      compareAction: () => 0,
    });

    expect(choice?.evidence).toEqual(
      expect.arrayContaining([
        "credit_cost:4",
        "evidence_candidate_cost:4",
      ]),
    );
  });

  it("uses structured score component keys for corp tag punish reasons", () => {
    const action = corpAction("corp-tag-punish");
    const [choice] = buildSemanticRuntimeChoices(corpInput(action), [], {
      ...dependencies(),
      scoreBreakdown: () => [
        {
          key: "corp_tagged_meat_damage_payoff_pressure",
          label: "Tagged payoff",
          value: 80,
        },
      ],
    });

    expect(choice?.reasonCode).toBe("corp.semantic.corp_tag_punish");
    expect(choice?.score).toBe(80);
    expect(choice?.scoreBreakdown).toEqual([
      {
        key: "corp_tagged_meat_damage_payoff_pressure",
        label: "Tagged payoff",
        value: 80,
      },
    ]);
  });

  it("ignores tag punish text in score component reasons without the structured key", () => {
    const action = corpAction("corp-tag-punish-text");
    const [choice] = buildSemanticRuntimeChoices(corpInput(action), [], {
      ...dependencies(),
      scoreBreakdown: () => [
        {
          key: "generic_damage_text",
          label: "Generic damage",
          value: 80,
          reason: "corp_tagged_meat_damage_payoff:true",
        },
      ],
    });

    expect(choice?.reasonCode).toBe("corp.semantic.basic_economy_draw");
  });

  it("exposes Corp board triage component keys as structured choice evidence", () => {
    const action = corpAction("corp-triage-mismatch");
    const [choice] = buildSemanticRuntimeChoices(corpInput(action), [], {
      ...dependencies(),
      scoreBreakdown: () => [
        {
          key: "corp_board_triage_mismatch",
          label: "Corp board triage",
          value: -4200,
        },
        {
          key: "corp_install_remote_context",
          label: "Remote context",
          value: 1350,
        },
      ],
    });

    expect(choice?.evidence).toContain(
      "semantic_score_component:corp_board_triage_mismatch",
    );
    expect(choice?.evidence).not.toContain(
      "semantic_score_component:corp_install_remote_context",
    );
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

function corpAction(actionId: string): LegalAction {
  return {
    actionId,
    label: "Corp action",
    type: "gain_credit",
    side: "corp",
    source: "basic_action",
    costs: [{ credits: 0 }],
    timingPoint: "corp_action.main",
    visibility: "public",
    expiresAtStateVersion: 12,
    targetRequirements: [],
    choiceRequirements: [],
    payload: {},
  } as unknown as LegalAction;
}

function dependencies() {
  return {
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
  };
}

function corpInput(action: LegalAction): AiDecisionInput {
  return {
    ...runnerInput(action),
    side: "corp",
    profileId: "test-corp",
    decisionId: "semantic-runtime-choice-builder-corp-test.1",
  } as unknown as AiDecisionInput;
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
