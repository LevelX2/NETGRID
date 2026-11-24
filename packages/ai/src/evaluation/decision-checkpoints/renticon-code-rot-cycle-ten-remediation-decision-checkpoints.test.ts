import { describe, expect, it } from "vitest";

import fundExposedRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c10-01-fund-exposed-remote-seed003-d117.json";
import safeLowCreditAdvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c10-02-safe-low-credit-advance-seed004-d120.json";
import safeAdvanceControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c5-01-advance-over-passive-support-seed002-d177.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Rent-I-Con versus CODE ROT cycle-ten remediation checkpoints", () => {
  it.each([
    [
      "funds the first exact Corporate Coup score parent instead of drawing redundant ICE",
      fundExposedRemoteJson,
      "pf0wbtspdkhsgytgy7y4jsto42",
      true,
      "P3",
    ],
    [
      "converts exact burst economy before the reused Corporate Coup defense draw",
      safeAdvanceControlJson,
      "pf0wbtspdkhsgytgy7y4jsto42",
      false,
      "P4",
    ],
    [
      "converts exact burst economy before the second Corporate Coup defense draw",
      safeLowCreditAdvanceJson,
      "p2tcxni66t4khx105fvo2h746t",
      false,
      "P4",
    ],
  ] as const)(
    "%s",
    (
      _label,
      json,
      exactScoreParentPlanId,
      expectsDelegation,
      expectedPriorityClass,
    ) => {
      const result = runAiDecisionCheckpoint(
        structuredClone(json) as unknown as AiDecisionCheckpointV1,
      );

      expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
      expect(result.decision?.evidence).toContain(
        `plan_priority_class:${expectedPriorityClass}`,
      );
      if (expectsDelegation) {
        expect(result.decision?.evidence).toContain(
          `plan_priority_delegated_from:${exactScoreParentPlanId}`,
        );
      }
    },
  );
});
