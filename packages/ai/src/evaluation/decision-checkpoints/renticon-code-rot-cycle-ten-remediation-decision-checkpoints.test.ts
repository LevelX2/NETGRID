import { describe, expect, it } from "vitest";

import fundExposedRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c10-01-fund-exposed-remote-seed003-d117.json";
import safeLowCreditAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c10-02-safe-low-credit-advance-seed004-d120.json";
import safeAdvanceControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c5-01-advance-over-passive-support-seed002-d177.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Rent-I-Con versus CODE ROT cycle-ten remediation checkpoints", () => {
  it.each([
    [
      "draws defense for the first exact Corporate Coup score parent",
      fundExposedRemoteJson,
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_193_corporate-coup_1%3Aremote_1",
    ],
    [
      "keeps the reused Corporate Coup control on the same exact defense draw",
      safeAdvanceControlJson,
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_193_corporate-coup_1%3Aremote_1",
    ],
    [
      "draws defense for the second exact Corporate Coup score parent",
      safeLowCreditAdvanceJson,
      "plan:corp.score_agenda:agenda%3Acorp_onr_v1_193_corporate-coup_2%3Aremote_1",
    ],
  ] as const)("%s", (_label, json, exactScoreParentPlanId) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(json) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toContain("plan_priority_class:P4");
    expect(result.decision?.evidence).toContain(
      `plan_priority_delegated_from:${exactScoreParentPlanId}`,
    );
  });
});
