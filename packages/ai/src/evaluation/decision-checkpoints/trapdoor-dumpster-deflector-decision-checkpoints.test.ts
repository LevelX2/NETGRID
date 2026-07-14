import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import pumpTrapdoorJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-01-pump.json";
import avoidUnaffordableRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-02-no-run.json";
import unaffordableEncounterControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-03-unaffordable-control.json";
import archivesContinueJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-trapdoor-dumpster-deflector-04-archives-continue.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Trapdoor and Dumpster exact decision checkpoints", () => {
  it.each([
    ["starts the affordable Trapdoor break sequence", pumpTrapdoorJson],
    ["starts the visible R&D path with restricted breaker credits", avoidUnaffordableRunJson],
    ["starts the second affordable Trapdoor break sequence", unaffordableEncounterControlJson],
    ["continues the redirected run on free Archives", archivesContinueJson],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("avoids the same visible R&D path when all breaker resources are insufficient", () => {
    const underfunded = fixture(avoidUnaffordableRunJson);
    underfunded.engine.testOnlyGameState.runner.credits = 1;
    underfunded.engine.stateHash = hashGameState(
      underfunded.engine.testOnlyGameState,
    );
    underfunded.expectation = {
      forbiddenActions: [{ type: "start_run", targetServerId: "rd" }],
    };

    const result = runAiDecisionCheckpoint(underfunded);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
