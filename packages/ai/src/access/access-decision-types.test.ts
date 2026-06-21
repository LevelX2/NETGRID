import { describe, expect, it } from "vitest";
import {
  ACCESS_DECISION_REASONS,
  ACCESS_INTENTS,
  ACCESS_TARGET_KINDS,
  type AccessDecisionReason,
  type AccessIntent,
  type AccessTargetKind,
} from "./access-decision-types";

describe("access decision type contract", () => {
  it("defines the shared access intents used by commitment, projection and outcome memory", () => {
    const intents: AccessIntent[] = [
      "steal",
      "trash",
      "access_only",
      "decline",
    ];

    expect(ACCESS_INTENTS).toEqual(intents);
  });

  it("defines the shared access decision reasons without splitting funding concepts", () => {
    const reasons: AccessDecisionReason[] = [
      "agenda_payoff",
      "trash_affordable",
      "insufficient_credits",
      "reserve_would_break",
      "low_value_target",
      "finite_pool_depleted",
      "target_unavailable",
      "unknown",
    ];

    expect(ACCESS_DECISION_REASONS).toEqual(reasons);
  });

  it("defines the shared access target kinds", () => {
    const targetKinds: AccessTargetKind[] = [
      "agenda",
      "asset",
      "node",
      "upgrade",
      "unknown",
    ];

    expect(ACCESS_TARGET_KINDS).toEqual(targetKinds);
  });
});

