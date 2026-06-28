import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerBlinkRecoveryScoreComponent } from "./runner-blink-recovery-score";

describe("runnerBlinkRecoveryScoreComponent", () => {
  it("matches stable breaker recovery installs by bounded role terms", () => {
    expect(componentFor(["breaker_fracter"])?.key).toBe(
      "runner_blink_stable_coverage_recovery",
    );
    expect(componentFor(["support_breaker_fracter"])?.key).toBe(
      "runner_blink_stable_coverage_recovery",
    );
    expect(componentFor(["breaker_fracterish_noise"])).toBeUndefined();
  });
});

function componentFor(roles: string[]) {
  return runnerBlinkRecoveryScoreComponent(input(), action(), {
    targetServerId: () => undefined,
    assessment: () => ({ active: true, evidence: ["blink_recovery:test"] }),
    rolesForAction: () => roles,
  });
}

function input(): AiDecisionInput {
  return { side: "runner" } as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "install",
    side: "runner",
    type: "install_card",
  } as LegalAction;
}
