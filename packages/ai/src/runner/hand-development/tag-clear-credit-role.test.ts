import { expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { runnerEffectsHaveOnlyTagClearCreditPool } from "../../runner-canonical-hint-semantics";

it("consumes the actual generated restriction and initial fill together", () => {
  expect(runnerEffectsHaveOnlyTagClearCreditPool(
    AI_HINTS_BY_CARD.get("onr_v1_120_armadillo-armored-road-home")!.effects,
  )).toBe(true);
});

it("does not erase an independent unrestricted payout from a mixed card", () => {
  const effects = AI_HINTS_BY_CARD.get("onr_v1_120_armadillo-armored-road-home")!.effects!;
  expect(runnerEffectsHaveOnlyTagClearCreditPool([...effects, {
    kind: "economy", scope: "runner", timing: "install", resource: "credits",
    target: "economy.burst_credit", amount: 3,
  }])).toBe(false);
});

it("does not turn an unrelated hosted pool into tag-only credits", () => {
  const effects = AI_HINTS_BY_CARD.get("onr_v1_126_drifter-mobile-environment")!.effects!;
  expect(runnerEffectsHaveOnlyTagClearCreditPool([...effects, {
    kind: "finite_economy_pool", scope: "runner", timing: "install", resource: "credits",
    target: "economy.hosted_credit_bank", amount: 8, economyMode: "fixed_pool", finite: true,
  }])).toBe(false);
  expect(runnerEffectsHaveOnlyTagClearCreditPool(undefined)).toBe(false);
  expect(runnerEffectsHaveOnlyTagClearCreditPool(
    AI_HINTS_BY_CARD.get("onr_v1_154_broker")!.effects,
  )).toBe(false);
});
