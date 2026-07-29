import { describe, expect, it } from "vitest";

import negativeInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c6-01-negative-install-seed001-d38.json";
import saturatedSearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c6-02-saturated-search-seed001-d63.json";
import richCreditRepeatJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c6-03-rich-credit-repeat-seed002-d300.json";
import overflowDrawJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c6-04-overflow-draw-seed005-d202.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const FIXTURES = [
  [
    "uses the exact program tutor instead of a negative persistent install",
    negativeInstallJson,
  ],
  ["stops a saturated coverage search", saturatedSearchJson],
  ["converts a rich-credit repeat into progress", richCreditRepeatJson],
  [
    "converts the overflow window into a free Archives information run",
    overflowDrawJson,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT cycle-six remediation checkpoints", () => {
  it.each(FIXTURES)("%s", (_label, checkpoint) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpoint) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
