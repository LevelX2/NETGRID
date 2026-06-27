import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { corpVisibleCardStoredCredits } from "./visible-card-credit";

describe("visible card credit counters", () => {
  it("sums explicit credit-like counter contracts only", () => {
    expect(
      corpVisibleCardStoredCredits({
        instanceId: "asset_1",
        owner: "corp",
        controller: "corp",
        type: "asset",
        known: true,
        counters: {
          bit: 2,
          stored_credit: 3,
          restricted_credit: 4,
          recurring_credit: 5,
          credit_like_noise: 99,
          successful_hq_run_pair_credit: 7,
        },
      } as VisibleCard),
    ).toBe(14);
  });
});
