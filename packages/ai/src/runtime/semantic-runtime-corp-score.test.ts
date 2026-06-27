import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { semanticRuntimeCorpScoreComponents } from "./semantic-runtime-corp-score";

describe("semanticRuntimeCorpScoreComponents", () => {
  it("scores agenda closeout actions that match Corp tactical goals", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([
        {
          goalId: "corp.tactical.score_closeout",
          family: "corp_scoreline",
          priority: 900,
          urgency: "high",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ]),
      corpAction("score-agenda", "score_agenda"),
      "simple_score_advance",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 900,
          reason: expect.stringContaining(
            "goal:corp.tactical.score_closeout",
          ),
        }),
      ]),
    );
  });

  it("scores economy actions that match Corp economy tactical goals", () => {
    const components = semanticRuntimeCorpScoreComponents(
      corpInputWithGoals([
        {
          goalId: "corp.tactical.stabilize_economy",
          family: "economy",
          priority: 640,
          urgency: "medium",
          source: "boardstate",
          evidence: ["test_goal"],
        },
      ]),
      corpAction("gain-credit", "gain_credit"),
      "basic_economy_draw",
      testDependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "corp_goal_fit_tactical_goal",
          value: 640,
          reason: expect.stringContaining(
            "goal:corp.tactical.stabilize_economy",
          ),
        }),
      ]),
    );
  });
});

function corpInputWithGoals(
  goals: readonly TacticalGoalLike[],
): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        credits: 5,
        clicks: 3,
        gripOrHq: [],
      },
    },
    ownCorpTacticalGoals: goals,
  } as unknown as AiDecisionInput;
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    costs: [],
  } as unknown as LegalAction;
}

function testDependencies() {
  return {
    actionCreditCost: () => 0,
    rolesForAction: () => [],
    corpScoreNowSafetyGate: () => ({ allowed: true, evidence: ["test"] }),
    corpAdvanceRemoteScore: () => 0,
    corpRemoteRezFloorAssessment: () => undefined,
    corpCentralRezReserveAssessment: () => undefined,
    corpRemoteScoreContestabilityAssessment: () => undefined,
    corpActionIsScoreLine: () => false,
    corpInstallRemoteScore: () => 0,
    corpAdvancementCounterPlacementAssessment: () => undefined,
    corpHasRemoteInstability: () => false,
    corpHasRemoteRezFloorFundingNeed: () => false,
    corpHasCentralRezFloorFundingNeed: () => false,
    corpTaggedRunnerPayoffPressure: () => undefined,
    corpTaggedPayoffWindowPassiveActionPenalty: () => undefined,
    corpPassiveScoreLinePenalty: () => undefined,
  };
}
