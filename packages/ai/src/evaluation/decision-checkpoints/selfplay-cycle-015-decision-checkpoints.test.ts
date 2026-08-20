import { describe, expect, it } from "vitest";

import knownAccessContractJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-015-01-known-access-contract-d151.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("selfplay cycle 015 decision checkpoints", () => {
  it("recovers before repeating a known lethal and unfunded agenda access", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(knownAccessContractJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
