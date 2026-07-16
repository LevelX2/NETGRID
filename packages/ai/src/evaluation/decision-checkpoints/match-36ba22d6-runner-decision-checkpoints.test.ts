import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import openingSearchKeepJson from "../../../../../data/scenarios/ai-decision-checkpoints/match-36ba22d6-01-opening-search-keep.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 36BA22D6 runner decision checkpoints", () => {
  it("keeps the search-enabled opening despite not holding a breaker", () => {
    expectCheckpointToPass(fixture(openingSearchKeepJson));
  });

  it("still mulligans the same pressure-heavy opening without the in-hand search line", () => {
    const noSearchLine = mutateFixture(openingSearchKeepJson, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const temple = "runner_onr_v1_114_temple-microcode-outlet_2";
      const thirdPanzerRun = "runner_onr_classic_042_panzer-run_1";
      if (
        !state.runner.grip.includes(temple) ||
        !state.runner.stack.includes(thirdPanzerRun)
      ) {
        throw new Error("Expected opening-hand control cards");
      }

      state.runner.grip = state.runner.grip.map((instanceId) =>
        instanceId === temple ? thirdPanzerRun : instanceId,
      );
      state.runner.stack = state.runner.stack.map((instanceId) =>
        instanceId === thirdPanzerRun ? temple : instanceId,
      );
      state.cardInstances[temple] = {
        ...state.cardInstances[temple]!,
        zone: { side: "runner", zone: "stack" },
      };
      state.cardInstances[thirdPanzerRun] = {
        ...state.cardInstances[thirdPanzerRun]!,
        zone: { side: "runner", zone: "grip" },
      };
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "F1-NO-SEARCH-CONTROL";
      checkpoint.expectation = {
        contractKind: "correctness",
        choice: {
          mustSelectOptionIds: ["mulligan"],
          mustNotSelectOptionIds: ["keep"],
        },
      };
    });

    expectCheckpointToPass(noSearchLine);
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

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
