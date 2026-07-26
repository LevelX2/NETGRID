import { describe, expect, it } from "vitest";

import advanceOverPassiveSupportJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c5-01-advance-over-passive-support-seed002-d177.json";
import fundUnsafeWindowJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c5-02-fund-unsafe-window-seed005-d295.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const FIXTURES = [
  [
    "uses explicit burst funding for the committed scoreline",
    advanceOverPassiveSupportJson,
  ],
  [
    "continues the current bound score step despite incomplete future projection",
    fundUnsafeWindowJson,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT cycle-five remediation checkpoints", () => {
  it.each(FIXTURES)("%s", (_label, checkpoint) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpoint) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
