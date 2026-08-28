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
    ["CP-7BFE-05 directly protects pressured R&D instead of agenda-free HQ", cp05Json],
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

  it("keeps score-remote hardening ahead of a nonterminal Closed Accounts payoff", () => {
    const fixtureWithCredits = mutateFixture(cp04Json, (fixture) => {
      fixture.engine.testOnlyGameState.runner.credits = 3;
      fixture.expectation = {
        acceptableActions: [
          {
            actionId:
              "corp.install_card.corp_onr_v1_279_wall-of-static_1.new_remote.corp_onr_v1_279_wall-of-static_1",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.defend_servers"],
          acceptableCapabilities: ["improve_remote_protection_path"],
          requiredAssessmentEvidence: [
            "corp_layered_remote_ice_staging:remote:strategic-score-remote:new_remote:corp.install_card.corp_onr_v1_279_wall-of-static_1.new_remote.corp_onr_v1_279_wall-of-static_1:layers_0:unrezzed_0:rez_gap_2",
          ],
        },
      };
    });

    expectCheckpointToPass(fixtureWithCredits);
  });

  it("uses the earlier action for measurable R&D protection", () => {
    const earlierWindow = mutateFixture(cp05Json, (fixture) => {
      fixture.engine.testOnlyGameState.corp.clicks = 2;
      fixture.expectation = {
        acceptableActions: [
          {
            actionId:
              "corp.install_card.corp_onr_v1_244_filter_1.rd.corp_onr_v1_244_filter_1.4",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["corp.defend_servers"],
          acceptableCapabilities: ["allocate_server_defense"],
          requiredAssessmentEvidence: [
            "engine_certified_global_defense_access_probability_reduced",
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
