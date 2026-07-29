import { describe, expect, it } from "vitest";

import fundedLastClickD10Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-01-rd-funded-last-click-d10.json";
import rezSupportD13Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-02-rd-rez-support-route-d13.json";
import retainDefenseD30Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-03-retain-rd-defense-package-d30.json";
import fundedLastClickD34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-04-rd-funded-last-click-d34.json";
import stagedLastClickD45Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f809-05-rd-staged-bluff-last-click-d45.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match f809 Corp defense decision checkpoints", () => {
  it.each([
    [
      "uses the last click for funded R&D defense after the first access",
      fundedLastClickD10Json,
    ],
    [
      "starts the R&D defense route while rez support is available",
      rezSupportD13Json,
    ],
    [
      "uses the last click for funded R&D defense after repeated accesses",
      fundedLastClickD34Json,
    ],
    [
      "stages R&D ICE when installation and delayed funding reach the same rez horizon",
      stagedLastClickD45Json,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("retains an executable R&D defense package during the HQ payment choice", () => {
    expectCheckpointToPass(fixture(retainDefenseD30Json));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
