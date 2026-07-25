import { describe, expect, it } from "vitest";

import unsafeWindowAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c4-01-unsafe-window-advance-seed001-d418.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Rent-I-Con versus CODE ROT cycle-four remediation checkpoint", () => {
  it("holds an already funded score parent instead of forcing an unsafe advance", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(unsafeWindowAdvanceJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
