import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7bfe-01.json";
import cp02aJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7bfe-02a.json";
import cp02bJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7bfe-02b.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7bfe-03.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7bfe-04.json";
import cp05Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7bfe-05.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 7BFE exact decision checkpoints", () => {
  it.each([
    ["CP-7BFE-01 central protection", cp01Json],
    ["CP-7BFE-02a staged five-credit score campaign", cp02aJson],
    ["CP-7BFE-02b parent-bound score protection follow-up", cp02bJson],
    ["CP-7BFE-03 strategy-aware discard", cp03Json],
    ["CP-7BFE-04 zero-effect Closed Accounts", cp04Json],
    ["CP-7BFE-05 funds pressured R&D instead of agenda-free HQ", cp05Json],
  ])("satisfies %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, result.message).toBe(true);
  });

  it("keeps the six-credit Corporate War closeout available", () => {
    const fixtureAtSix = mutateFixture(cp02aJson, (fixture) => {
      fixture.engine.testOnlyGameState.corp.credits = 6;
      fixture.expectation = {
        acceptableActions: [
          {
            type: "install_card",
            sourceDefinitionId: "onr_v1_196_corporate-war",
          },
        ],
      };
    });

    expectCheckpointToPass(fixtureAtSix);
  });

  it("does not fabricate a Closed Accounts payoff without a decision-local Engine quote", () => {
    const fixtureWithCredits = mutateFixture(cp04Json, (fixture) => {
      fixture.engine.testOnlyGameState.runner.credits = 3;
      fixture.expectation = {
        acceptableActions: [
          {
            type: "draw_card",
          },
        ],
        forbiddenActions: [
          {
            type: "play_operation",
            sourceDefinitionId: "onr_v1_285_closed-accounts",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.hand_and_agenda_management"],
          acceptableCapabilities: ["draw_for_plan"],
          requiredAssessmentEvidence: [
            "corp_score_campaign_missing_agenda_material",
          ],
        },
      };
    });

    expectCheckpointToPass(fixtureWithCredits);
  });

  it("uses exact basic liquidity before the final action", () => {
    const earlierWindow = mutateFixture(cp05Json, (fixture) => {
      fixture.engine.testOnlyGameState.corp.clicks = 2;
      fixture.expectation = {
        acceptableActions: [{ type: "draw_card" }],
        planExecution: {
          acceptablePlanKinds: ["corp.hand_and_agenda_management"],
          acceptableCapabilities: ["draw_for_plan"],
          requiredAssessmentEvidence: [
            "corp_score_campaign_missing_agenda_material",
          ],
        },
      };
    });

    expectCheckpointToPass(earlierWindow);
  });

  it("keeps I Got a Rock when its agenda-point prerequisite is live", () => {
    const enabledPayoff = mutateFixture(cp03Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const agendaId = state.runner.scoreArea.shift();
      if (!agendaId)
        throw new Error("Missing captured agenda for counterprobe");
      state.corp.scoreArea.push(agendaId);
      state.cardInstances[agendaId] = {
        ...state.cardInstances[agendaId]!,
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "scoreArea" },
        faceup: true,
      };
      state.runner.tags = 2;
      fixture.expectation = {
        discardChoice: {
          mustRetainDefinitionIds: ["onr_v1_327_i-got-a-rock"],
        },
      };
    });

    expectCheckpointToPass(enabledPayoff);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(fixture: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(fixture);
  expect(result.ok, result.message).toBe(true);
}
