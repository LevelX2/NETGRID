import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-mrgsg-01.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match MRGSG exact decision checkpoints", () => {
  it("does not treat unknown Archives cards as payoff while stronger visible options remain", () => {
    const result = runAiDecisionCheckpoint(fixture(cp01Json));

    expect(result.ok, result.message).toBe(true);
  });

  it("keeps the planned R&D run when Archives is empty and R&D is open", () => {
    const openRnd = mutateFixture(cp01Json, (fixture) => {
      const state = fixture.engine.testOnlyGameState;
      const rnd = state.corp.servers.find((server) => server.id === "rd");
      if (!rnd) throw new Error("Missing captured R&D server");

      for (const cardId of state.corp.archives.splice(0)) {
        state.corp.rd.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "rd" },
          faceup: false,
          rezzed: false,
        };
      }
      for (const iceId of rnd.ice.splice(0)) {
        state.corp.hq.push(iceId);
        state.cardInstances[iceId] = {
          ...state.cardInstances[iceId]!,
          zone: { side: "corp", zone: "hq" },
          faceup: false,
          rezzed: false,
        };
      }
      state.runner.credits = 10;
      fixture.expectation = {
        acceptableActions: [{ type: "start_run", targetServerId: "rd" }],
      };
    });

    const result = runAiDecisionCheckpoint(openRnd);

    expect(result.ok, result.message).toBe(true);
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
