import { describe, expect, it } from "vitest";

import noNeedSearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c7-01-no-need-search-seed001-d122.json";
import unrezzableMatchpointIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c7-02-unrezzable-matchpoint-ice-seed002-d404.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const FIXTURES = [
  ["uses the bound trash-recovery search for current setup", noNeedSearchJson],
  [
    "scores instead of installing unrezzable matchpoint ice",
    unrezzableMatchpointIceJson,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT cycle-seven remediation checkpoints", () => {
  it.each(FIXTURES)("%s", (_label, checkpoint) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpoint) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
