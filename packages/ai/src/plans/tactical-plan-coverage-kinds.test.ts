import { describe, expect, it } from "vitest";
import type { RequiredCapabilityKind } from "./tactical-plan-types";
import { coverageKindForAssessment, isBreakerRequiredCapabilityKind } from "./tactical-plan-coverage-kinds";

describe("isBreakerRequiredCapabilityKind", () => {
  it("matches only typed breaker capability kinds", () => {
    expect(isBreakerRequiredCapabilityKind("breaker_coverage")).toBe(true);
    expect(isBreakerRequiredCapabilityKind("breaker_wall")).toBe(true);
    expect(isBreakerRequiredCapabilityKind("breaker_universal")).toBe(true);
    expect(isBreakerRequiredCapabilityKind("bank_payout")).toBe(false);
    expect(isBreakerRequiredCapabilityKind("remote_protection")).toBe(false);
    expect(
      isBreakerRequiredCapabilityKind(
        "breaker_wallish_noise" as RequiredCapabilityKind,
      ),
    ).toBe(false);
  });
});

describe("coverageKindForAssessment", () => {
  it.each([
    [["ap", "sentry"], "breaker_sentry"],
    [["sentry", "ap"], "breaker_sentry"],
    [["ap", "code_gate"], "breaker_code_gate"],
    [["ap", "wall"], "breaker_wall"],
    [["sentry", "trace"], "breaker_sentry"],
    [["ap"], "breaker_ap"],
    [["trace"], "breaker_trace"],
    [["unknown_special"], "breaker_universal"],
    [[], undefined],
  ])("uses a structural ICE category before supplementary tags: %j", (missingCoverage, expected) => {
    const assessment = { missingCoverage } as Parameters<typeof coverageKindForAssessment>[0];
    expect(coverageKindForAssessment(assessment)).toBe(expected);
  });
});
