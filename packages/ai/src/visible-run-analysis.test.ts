import { describe, expect, it } from "vitest";
import {
  runnerKnownPathAssessmentIsCostNoAccess,
  runnerKnownPathAssessmentIsKnownNoAccess,
  runnerKnownPathAssessmentIsUnbreakableNoAccess,
  type KnownRezzedIcePathAssessment,
} from "./visible-run-analysis";

function knownPathAssessment(
  overrides: Partial<KnownRezzedIcePathAssessment> = {},
): KnownRezzedIcePathAssessment {
  return {
    blocked: false,
    canReachAccess: true,
    knownPathBlockedByUnbreakableIce: false,
    knownPathBlockedByMissingCoverage: false,
    knownPathBlockedByEtr: false,
    creditsAfterPath: 0,
    canBreakNextIceButNotFullPath: false,
    hasBypassOrSpecialAccessPlan: false,
    creditsSpentBeforeUnpayableIce: 0,
    assessedKnownIceCount: 0,
    ...overrides,
  };
}

describe("visible run analysis known-path classification", () => {
  it("classifies cost-blocked known no-access paths", () => {
    expect(
      runnerKnownPathAssessmentIsCostNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unaffordable" }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsCostNoAccess(
        knownPathAssessment({
          unpayableReason: "later_ice_unaffordable_after_prior_ice_cost",
        }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsCostNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unbreakable" }),
      ),
    ).toBe(false);
  });

  it("classifies unbreakable known no-access paths", () => {
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unbreakable" }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ knownPathBlockedByUnbreakableIce: true }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ knownPathBlockedByMissingCoverage: true }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsUnbreakableNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unaffordable" }),
      ),
    ).toBe(false);
  });

  it("keeps the aggregate known no-access predicate as the shared union", () => {
    expect(
      runnerKnownPathAssessmentIsKnownNoAccess(
        knownPathAssessment({ unpayableReason: "ice_unaffordable" }),
      ),
    ).toBe(true);
    expect(
      runnerKnownPathAssessmentIsKnownNoAccess(
        knownPathAssessment({ knownPathBlockedByMissingCoverage: true }),
      ),
    ).toBe(true);
    expect(runnerKnownPathAssessmentIsKnownNoAccess(knownPathAssessment())).toBe(
      false,
    );
  });
});
