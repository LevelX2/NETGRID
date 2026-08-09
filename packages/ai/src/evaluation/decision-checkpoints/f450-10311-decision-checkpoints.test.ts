import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-01.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-02.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-03.json";
import cp03ControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-03-control.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f450-10311-04.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("F450 and 10311 exact decision checkpoints", () => {
  it.each([
    ["reachable movement path is continued", cp01Json],
    [
      "guaranteed score conversion precedes later matchpoint pressure",
      cp02Json,
    ],
    ["comfortable Streetware bank is not overfilled", cp03Json],
    [
      "captured R&D pressure is executed instead of a vacuous action class",
      cp04Json,
    ],
  ])("satisfies %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("still scores an installed agenda without opponent matchpoint", () => {
    const noMatchpoint = mutateFixture(cp02Json, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const agendaId = state.corp.scoreArea.at(-1);
      if (!agendaId) throw new Error("Missing scored Corp agenda");
      state.corp.scoreArea = state.corp.scoreArea.filter(
        (cardId) => cardId !== agendaId,
      );
      state.corp.rd.push(agendaId);
      state.cardInstances[agendaId] = {
        ...state.cardInstances[agendaId]!,
        zone: { side: "corp", zone: "rd" },
        faceup: false,
        rezzed: false,
      };
      checkpoint.expectation = {
        acceptableActions: [
          {
            type: "activated_card_ability",
            sourceDefinitionId: "onr_classic_004_theorem-proof",
          },
        ],
      };
    });

    expectCheckpointToPass(noMatchpoint);
  });

  it("may load Streetware in the historical low-credit control", () => {
    expectCheckpointToPass(fixture(cp03ControlJson));
  });

  it("converts rich credits into R&D pressure while Cybermodem remains unaffordable", () => {
    const stillUnaffordable = mutateFixture(cp04Json, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 10;
      checkpoint.expectation = {
        acceptableActions: [{ type: "start_run", targetServerId: "rd" }],
      };
    });

    expectCheckpointToPass(stillUnaffordable);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-f450-10311-funded-cybermodem"],
  );
  if (checkpoint.checkpointId === "cp-f450-10311-funded-cybermodem") {
    checkpoint.expectation.planExecution!.acceptableCapabilities = [
      "pressure_rd_access",
    ];
  }
  return checkpoint;
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

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
