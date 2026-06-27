import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { runnerLoanSpendCandidateKind } from "./runner-loan-spend-candidate";

describe("runnerLoanSpendCandidateKind", () => {
  it("classifies structured spend roles", () => {
    expect(kind(["breaker_fracter"])).toBe("direct_plan");
    expect(kind(["card_draw"])).toBe("generic_setup");
    expect(kind(["stack_search"])).toBe("generic_setup");
  });

  it("ignores substring-only spend role noise", () => {
    expect(kind(["withdrawal_noise"])).toBe("ignore");
    expect(kind(["searchlight_noise"])).toBe("ignore");
    expect(kind(["breakerish_noise"])).toBe("ignore");
  });
});

function kind(roles: readonly string[]) {
  return runnerLoanSpendCandidateKind({} as AiDecisionInput, card(), roles, {
    cardAddressesVisibleBreakerNeed: () => false,
    isRunnerEconomyRole: () => false,
    isRunnerPressureRole: () => false,
  });
}

function card(): VisibleCard {
  return {
    instanceId: "event-instance",
    definitionId: "event-definition",
    title: "Event",
    type: "event",
    known: true,
  } as VisibleCard;
}
