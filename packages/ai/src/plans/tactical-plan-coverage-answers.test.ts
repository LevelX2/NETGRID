import { describe, expect, it } from "vitest";
import type {
  PlanStep,
  RequiredCapability,
  RequiredCapabilityKind,
  TacticalPlan,
} from "./tactical-plan-types";
import {
  coverageSearchRequiredCapability,
  coverageSearchRequiredCapabilityForStep,
} from "./tactical-plan-coverage-answers";
import { mappingStatusForStep } from "./tactical-plan-mapping-helpers";

describe("coverage search required capability matching", () => {
  it("finds only typed breaker capability kinds", () => {
    const step = stepWithCapabilities(
      "breaker_wallish_noise" as RequiredCapabilityKind,
      "bank_payout",
      "breaker_wall",
    );

    expect(coverageSearchRequiredCapability(plan(), step)).toBe("breaker_wall");
    expect(coverageSearchRequiredCapabilityForStep(step)).toBe("breaker_wall");
  });

  it("does not treat breaker-like capability noise as missing breaker coverage", () => {
    expect(
      mappingStatusForStep(
        stepWithCapabilities("breaker_wallish_noise" as RequiredCapabilityKind),
        [],
      ),
    ).toBe("blocked_no_legal_action");
    expect(
      mappingStatusForStep(stepWithCapabilities("breaker_wall"), []),
    ).toBe("blocked_missing_capability");
  });
});

function plan(): TacticalPlan {
  return { requiredCapabilities: [] } as unknown as TacticalPlan;
}

function stepWithCapabilities(
  ...kinds: RequiredCapabilityKind[]
): PlanStep {
  return {
    kind: "search_for_answer",
    requiredCapabilities: kinds.map(capability),
  } as unknown as PlanStep;
}

function capability(kind: RequiredCapabilityKind): RequiredCapability {
  return {
    capabilityId: kind,
    kind,
    side: "runner",
    evidence: ["test"],
  };
}
