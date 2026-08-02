import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  runnerTopTrashRecoveryAction,
  runnerTopTrashRecoveryTargetAssessment,
} from "./runner-junkyard-bbs-recovery-target";

function action(
  payload: Record<string, string | number | boolean>,
): LegalAction {
  return {
    actionId: "top-trash-recovery",
    side: "runner",
    stateVersion: 1,
    timingPoint: "runner_action.main",
    type: "activated_card_ability",
    label: "Recover top trash card",
    source: "recovery-source",
    costs: [{ clicks: 1 }, { credits: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload,
  } as unknown as LegalAction;
}

describe("generic top-trash recovery action recognition", () => {
  it("recognizes the exact declarative effect and bound target", () => {
    expect(
      runnerTopTrashRecoveryAction(
        action({
          cardImplementationEffectKind: "move_top_trash_to_grip",
          cardImplementationTopTrashTargetId: "top-trash-card",
        }),
      ),
    ).toBe(true);
  });

  it("fails closed when the exact target binding is absent", () => {
    expect(
      runnerTopTrashRecoveryAction(
        action({
          cardImplementationEffectKind: "move_top_trash_to_grip",
        }),
      ),
    ).toBe(false);
  });
});

describe("runnerTopTrashRecoveryTargetAssessment", () => {
  it("classifies structured recovery target roles", () => {
    expect(assessment(["setup"]).evidence[0]).toBe(
      "target_class:setup:rig_size:0",
    );
    expect(assessment(["build_rig"]).evidence[0]).toBe(
      "target_class:setup:rig_size:0",
    );
    expect(assessment(["memory_support"]).evidence[0]).toBe(
      "target_class:memory_support:memory_remaining:0",
    );
    expect(assessment(["support_breaker_fracter"]).evidence[0]).toBe(
      "target_class:breaker_no_visible_need",
    );
  });

  it("ignores substring-only recovery target role noise", () => {
    expect(assessment(["setupsomething_noise"]).evidence[0]).toBe(
      "target_class:low_value",
    );
    expect(assessment(["memoryless_noise"]).evidence[0]).toBe(
      "target_class:low_value",
    );
    expect(assessment(["breaker_fracterish_noise"]).evidence[0]).toBe(
      "target_class:low_value",
    );
  });
});

function assessment(targetRoles: readonly string[]) {
  return runnerTopTrashRecoveryTargetAssessment(
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
