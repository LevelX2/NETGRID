import { describe, expect, it } from "vitest";

import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/corp-rez-payoff-menus.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Corp rez payoff decision checkpoint", () => {
  it("rezzes a visible ICE when its guaranteed rez payoff remains valuable", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});
