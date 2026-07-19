import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";

import defensiveDrawD9Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-03-defensive-draw-d9.json";
import defensiveDrawD10Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-04-defensive-draw-d10.json";
import defensiveDrawD11Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-05-defensive-draw-d11.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 3bb14 Corp draw near-tie decision checkpoints", () => {
  it.each([
    ["draws for missing central defense at historical D9", defensiveDrawD9Json],
    [
      "draws instead of repeating the one-point credit tiebreak at D10",
      defensiveDrawD10Json,
    ],
    [
      "draws instead of repeating the one-point credit tiebreak at D11",
      defensiveDrawD11Json,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not reward an optional draw when the current hand is full", () => {
    const checkpoint = fixture(defensiveDrawD9Json);
    checkpoint.engine.testOnlyGameState.corp.maxHandSize = 4;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [{ type: "gain_credit" }],
      forbiddenActions: [{ type: "draw_card" }],
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps concrete blocking ICE development ahead of speculative draw", () => {
    const checkpoint = fixture(defensiveDrawD9Json);
    const shock =
      checkpoint.engine.testOnlyGameState.cardInstances[
        "corp_onr_v1_268_shock-r_2"
      ];
    if (!shock) throw new Error("Missing captured Shock.r instance");
    shock.definitionId = "onr_v1_263_reinforced-wall";
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [{ type: "install_card" }],
      forbiddenActions: [{ type: "draw_card" }],
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
