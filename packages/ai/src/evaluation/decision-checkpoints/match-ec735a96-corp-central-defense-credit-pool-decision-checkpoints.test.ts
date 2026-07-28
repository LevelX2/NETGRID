import { describe, expect, it } from "vitest";

import rdInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ec735a96-01-rd-ice-with-unbound-credit-pool-d23.json";
import hqRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ec735a96-02-rez-filter-with-unbound-credit-pool-d28.json";
import currentRdInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-940ee843-01-rd-shock-central-allocation-d24.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match EC735A96 Corp central-defense credit-pool decision checkpoints", () => {
  it("installs the available ICE on the unprotected R&D instead of treating an unbound credit pool as unknown", () => {
    expectCheckpointToPass(fixture(rdInstallJson));
  });

  it("rezzes affordable ETR ICE on HQ instead of declining because of an unbound credit pool", () => {
    expectCheckpointToPass(fixture(hqRezJson));
  });

  it("installs visible ICE on empty R&D when the follow-up match still reports an unknown central allocation", () => {
    expectCheckpointToPass(fixture(currentRdInstallJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
