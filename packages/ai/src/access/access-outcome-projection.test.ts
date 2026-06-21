import { describe, expect, it } from "vitest";
import {
  createObservedAccessOutcome,
  createProjectedAccessOutcome,
} from "./access-outcome-projection";

describe("access outcome projection", () => {
  it("keeps projected access outcomes distinct from observed outcomes", () => {
    const projected = createProjectedAccessOutcome({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      projectedIntent: "decline",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    expect(projected.kind).toBe("projected_access_outcome");
    expect(projected.evidence).toContain(
      "projected_access_outcome_intent:decline",
    );
    expect(projected.evidence).not.toContain(
      "remote_access_outcome_decision:declined_trash",
    );
  });

  it("models observed access outcomes separately", () => {
    const observed = createObservedAccessOutcome({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      observedIntent: "trash",
      reason: "trash_affordable",
      stateVersion: 13,
    });

    expect(observed.kind).toBe("observed_access_outcome");
    expect(observed.evidence).toEqual(
      expect.arrayContaining([
        "observed_access_outcome_intent:trash",
        "observed_access_outcome_reason:trash_affordable",
      ]),
    );
  });
});

