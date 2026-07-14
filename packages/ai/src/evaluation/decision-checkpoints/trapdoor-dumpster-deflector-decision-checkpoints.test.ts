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
    ["avoids the known unaffordable R&D redirect path", avoidUnaffordableRunJson],
    ["accepts an unaffordable Trapdoor redirect in the encounter", unaffordableEncounterControlJson],
    ["continues the redirected run on free Archives", archivesContinueJson],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("may start the same visible R&D path when Trapdoor is affordable", () => {
    const affordable = fixture(avoidUnaffordableRunJson);
    affordable.engine.testOnlyGameState.runner.credits = 10;
    affordable.engine.stateHash = hashGameState(
      affordable.engine.testOnlyGameState,
    );
    affordable.expectation = {
      acceptableActions: [{ type: "start_run", targetServerId: "rd" }],
    };

    const result = runAiDecisionCheckpoint(affordable);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
