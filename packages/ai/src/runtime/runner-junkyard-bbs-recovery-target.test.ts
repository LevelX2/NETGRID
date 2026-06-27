import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";

import { runnerJunkyardBbsRecoveryTargetAssessment } from "./runner-junkyard-bbs-recovery-target";

describe("runnerJunkyardBbsRecoveryTargetAssessment", () => {
  it("classifies structured recovery target roles", () => {
    expect(assessment(["setup"]).evidence[0]).toBe("target_class:setup:rig_size:0");
    expect(assessment(["build_rig"]).evidence[0]).toBe(
      "target_class:setup:rig_size:0",
    );
    expect(assessment(["memory_support"]).evidence[0]).toBe(
      "target_class:memory_support:memory_remaining:0",
    );
  });

  it("ignores substring-only recovery target role noise", () => {
    expect(assessment(["setupsomething_noise"]).evidence[0]).toBe(
      "target_class:low_value",
    );
    expect(assessment(["memoryless_noise"]).evidence[0]).toBe(
      "target_class:low_value",
    );
  });
});

function assessment(targetRoles: readonly string[]) {
  return runnerJunkyardBbsRecoveryTargetAssessment(
    {
      playerView: {
        own: {
          credits: 5,
          gripOrHq: [],
          rig: [],
          memoryLimit: 0,
          memoryUsed: 0,
        },
      },
    } as unknown as AiDecisionInput,
    undefined,
    "target-definition",
    targetRoles,
    {
      cardAddressesVisibleBreakerNeed: () => false,
      isRunnerPressureRole: () => false,
      isRunnerEconomyRole: () => false,
      fundingNeedContext: () => ({ active: false, reason: "test" }),
      badPublicityOrTraceTechCard: () => false,
    },
  );
}
