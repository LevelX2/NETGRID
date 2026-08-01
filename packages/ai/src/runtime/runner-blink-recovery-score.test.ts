import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerRandomBreakOrDamageRecoveryScoreComponent } from "./runner-blink-recovery-score";

describe("runnerRandomBreakOrDamageRecoveryScoreComponent", () => {
  it("matches stable breaker recovery installs by bounded role terms", () => {
    expect(componentFor(["breaker_fracter"])?.key).toBe(
      "runner_random_break_damage_stable_coverage_recovery",
    );
    expect(componentFor(["support_breaker_fracter"])?.key).toBe(
      "runner_random_break_damage_stable_coverage_recovery",
    );
    expect(componentFor(["breaker_fracterish_noise"])).toBeUndefined();
  });
});

function componentFor(roles: string[]) {
  return runnerRandomBreakOrDamageRecoveryScoreComponent(input(), action(), {
    targetServerId: () => undefined,
    assessment: () => ({
      active: true,
      evidence: ["random_break_damage_recovery:test"],
    }),
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
