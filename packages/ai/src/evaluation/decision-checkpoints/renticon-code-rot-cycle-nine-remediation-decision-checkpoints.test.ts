import { describe, expect, it } from "vitest";

import affordableHqIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c9-01-affordable-hq-ice-seed002-d200.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Rent-I-Con versus CODE ROT cycle-nine remediation checkpoint", () => {
  it("uses the last click for liquidity instead of over-layering HQ", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(affordableHqIceJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
