import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import cp01Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-dfe6-01-archives-matchpoint-first.json";
import cp02Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-dfe6-02-archives-matchpoint-repeat.json";
import cp03Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-dfe6-03-archives-before-winning-rd.json";
import cp04Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-dfe6-04-survival-draw-over-fall-guy.json";
import cp05Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-dfe6-05-first-fall-guy-control.json";
import cp06Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-dfe6-06-unaffordable-liche-control.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match DFE6 exact decision checkpoints", () => {
  it.each([
    ["DFE6-F01 first unsupported Archives run", cp01Json],
    ["DFE6-F01 repeated unsupported Archives run", cp02Json],
    ["DFE6-F01 develops Score while central routes are blocked", cp03Json],
    ["DFE6-F02 draw over redundant Fall Guy", cp04Json],
    ["DFE6-F03 unaffordable Liche break score contract", cp06Json],
  ])("satisfies %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps the first useful Fall Guy install available", () => {
    expectCheckpointToPass(fixture(cp05Json));
  });

  it("does not infer an Archives payoff merely from a low Corp deck count", () => {
    const deckPressure = mutateFixture(cp01Json, (checkpoint) => {
      const state = checkpoint.engine.testOnlyGameState;
      const movedToArchives = state.corp.rd.splice(6);
      state.corp.archives.push(...movedToArchives);
      for (const cardId of movedToArchives) {
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "corp", zone: "archives" },
        };
      }
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "DFE6-F01-CORP-DECK-PRESSURE";
      checkpoint.expectation = {
        acceptableActions: [
          { type: "start_run", targetServerId: "remote_1" },
          { type: "start_run", targetServerId: "rd" },
        ],
        forbiddenActions: [{ type: "start_run", targetServerId: "archives" }],
        planExecution: {
          acceptablePlanKinds: [
            "runner.contest_remote",
            "runner.pressure_central",
          ],
          acceptableCapabilities: ["contest_remote", "pressure_rd_information"],
        },
      };
    });

    expectCheckpointToPass(deckPressure);
  });

  it("keeps the Liche break line when the full sequence is affordable", () => {
    const affordableBreak = mutateFixture(cp06Json, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 20;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "DFE6-F03-AFFORDABLE-LICHE";
      checkpoint.expectation = {
        acceptableActions: [{ type: "pump_breaker" }],
      };
    });

    expectCheckpointToPass(affordableBreak);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-dfe6-03-archives-before-winning-rd"],
  );
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
