import { describe, expect, it } from "vitest";

import type { VisibleCard } from "@netgrid/shared";
import {
  runnerBadPublicityOrTraceTechCard,
  runnerCardLooksLikeCreditPayout,
  visibleCardPlayOrInstallCost,
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

  it("matches bad-publicity and trace card text by bounded tokens", () => {
    expect(
      runnerBadPublicityOrTraceTechCard(
        card({ rulesText: "Prevent bad publicity." }),
        [],
        undefined,
      ),
    ).toBe(true);
    expect(
      runnerBadPublicityOrTraceTechCard(
        card({ rulesText: "Trace support." }),
        [],
        undefined,
      ),
    ).toBe(true);
    expect(
      runnerBadPublicityOrTraceTechCard(
        card({ rulesText: "Badly publicized traceroute support." }),
        [],
        undefined,
      ),
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
    expect(
      runnerCardLooksLikeCreditPayout(
        card({ rulesText: "Gain [3] credits." }),
        undefined,
      ),
    ).toBe(true);
    expect(
      runnerCardLooksLikeCreditPayout(
        card({ rulesText: "Regain [3] creditsish." }),
        undefined,
      ),
    ).toBe(false);
  });

  it("uses fixed and variable-X play-cost models for visible play cards", () => {
    expect(
      visibleCardPlayOrInstallCost(
        card({
          type: "event",
          playCost: { kind: "fixed", credits: 3 },
        }),
        undefined,
      ),
    ).toBe(3);
    expect(
      visibleCardPlayOrInstallCost(
        card({
          type: "operation",
          playCost: {
            kind: "variable_x",
            minimumX: 1,
            creditsPerX: 1,
            maximumX: { kind: "context" },
          },
        }),
        undefined,
      ),
    ).toBe(1);
    expect(
      visibleCardPlayOrInstallCost(
        card({
          type: "operation",
          playCost: {
            kind: "variable_x",
            minimumX: 0,
            creditsPerX: 1,
            maximumX: { kind: "context" },
          },
        }),
        undefined,
      ),
    ).toBe(0);
  });

  it("fails closed when a visible play card has no play-cost model", () => {
    expect(() =>
      visibleCardPlayOrInstallCost(card({ type: "event" }), undefined),
    ).toThrow(
      "Invalid visible play-cost projection for a known event or operation.",
    );
  });
});

function card(overrides: Partial<VisibleCard> = {}): VisibleCard {
  return {
    instanceId: "card",
    known: true,
    rulesText: "",
    ...overrides,
  } as VisibleCard;
}
