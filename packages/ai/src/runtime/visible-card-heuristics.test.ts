import { describe, expect, it } from "vitest";

import type { VisibleCard } from "@netgrid/shared";
import {
  runnerBadPublicityOrTraceTechCard,
  runnerCardLooksLikeCreditPayout,
} from "./visible-card-heuristics";

describe("visible card heuristics", () => {
  it("uses structured bad-publicity and trace roles", () => {
    expect(
      runnerBadPublicityOrTraceTechCard(undefined, ["bad_publicity"], undefined),
    ).toBe(true);
    expect(
      runnerBadPublicityOrTraceTechCard(undefined, ["trace_support"], undefined),
    ).toBe(true);
  });

  it("ignores substring-only bad-publicity and trace role noise", () => {
    expect(
      runnerBadPublicityOrTraceTechCard(
        undefined,
        ["bad_publicityish_noise"],
        undefined,
      ),
    ).toBe(false);
    expect(
      runnerBadPublicityOrTraceTechCard(undefined, ["traceroute_noise"], undefined),
    ).toBe(false);
  });

  it("matches credit payout mechanics by bounded terms", () => {
    expect(
      runnerCardLooksLikeCreditPayout(card(), {
        mechanics: ["gain_credits"],
      }),
    ).toBe(true);
    expect(
      runnerCardLooksLikeCreditPayout(card(), {
        mechanics: ["gain_credits_per_counter"],
      }),
    ).toBe(true);
    expect(
      runnerCardLooksLikeCreditPayout(card(), {
        mechanics: ["again_credits_noise"],
      }),
    ).toBe(false);
  });
});

function card(): VisibleCard {
  return {
    instanceId: "card",
    known: true,
    rulesText: "",
  } as VisibleCard;
}
