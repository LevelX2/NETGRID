import { describe, expect, it } from "vitest";

import { runnerBadPublicityOrTraceTechCard } from "./visible-card-heuristics";

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
});
