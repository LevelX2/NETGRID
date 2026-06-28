import { describe, expect, it } from "vitest";
import type { RequiredCapabilityKind } from "./tactical-plan-types";
import { isBreakerRequiredCapabilityKind } from "./tactical-plan-coverage-kinds";

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
