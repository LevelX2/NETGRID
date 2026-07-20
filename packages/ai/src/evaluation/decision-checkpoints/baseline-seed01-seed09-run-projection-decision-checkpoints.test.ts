import { describe, expect, it } from "vitest";

import seed01Decision196Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed01-01-rd-protocol-known-blocked-d196.json";
import seed01Decision278Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed01-02-rd-protocol-known-blocked-d278.json";
import seed01Decision347Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed01-03-rd-protocol-known-blocked-d347.json";
import seed09Decision290Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed09-01-rd-protocol-known-blocked-d290.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("baseline Seed 01 and Seed 09 card-run projection checkpoints", () => {
  it.each([
    ["Seed 01 decision 196", seed01Decision196Json],
    ["Seed 01 decision 278", seed01Decision278Json],
    ["Seed 01 decision 347", seed01Decision347Json],
    ["Seed 09 decision 290", seed09Decision290Json],
  ])("blocks the unreachable R&D-Protocol run at %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(json) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});
