import { describe, expect, it } from "vitest";

import contestableAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c2-01-contestable-advance-seed001-d344.json";
import scorelineOverbuildJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c2-02-scoreline-overbuild-seed001-d302.json";
import declinedRezContinueJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c2-03-declined-rez-continue-seed005-d109.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const FIXTURES = [
  [
    "uses one bounded protection draw while HQ still has exact capacity",
    contestableAdvanceJson,
  ],
  [
    "funds the bound score protection gap instead of adding unfunded ICE",
    scorelineOverbuildJson,
  ],
  [
    "continues a run when bad-publicity credits still fund the path",
    declinedRezContinueJson,
  ],
] as const;

describe("Rent-I-Con versus CODE ROT cycle-two remediation checkpoints", () => {
  it.each(FIXTURES)("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
