import { describe, expect, it } from "vitest";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { runnerLoanCriticalBreakerFundingNeed } from "./runner-loan-funding-need";

describe("runnerLoanCriticalBreakerFundingNeed", () => {
  it("matches critical breaker funding roles by bounded role terms", () => {
    expect(criticalBreakerFundingActive(["breaker_fracter"])).toBe(true);
    expect(criticalBreakerFundingActive(["support_breaker_fracter"])).toBe(true);
    expect(criticalBreakerFundingActive(["breaker_fracterish_noise"])).toBe(false);
  });
});

function criticalBreakerFundingActive(roles: readonly string[]): boolean {
  return runnerLoanCriticalBreakerFundingNeed(input(), 3, true, {
    rolesForCardId: () => roles,
    cardAddressesVisibleBreakerNeed: () => true,
    visibleCardPlayOrInstallCost: () => 2,
  }).active;
}

function input(): AiDecisionInput {
  return {
    playerView: {
      own: {
        gripOrHq: [card()],
      },
    },
  } as unknown as AiDecisionInput;
}

function card(): VisibleCard {
  return {
    instanceId: "breaker-instance",
    definitionId: "breaker-definition",
    title: "Breaker",
    type: "program",
    known: true,
  } as VisibleCard;
}
