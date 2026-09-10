import { describe, expect, it } from "vitest";

import { buildClassicRunnerLinkBidOptions } from "./trace-orchestration";

describe("classic trace runner link spend", () => {
  it("uses Baedeker-style 1 credit per +1 Link", () => {
    expect(
      buildClassicRunnerLinkBidOptions(3, { creditCost: 1, linkDelta: 1 }),
    ).toEqual([
      { paymentAmount: 0, linkDelta: 0 },
      { paymentAmount: 1, linkDelta: 1 },
      { paymentAmount: 2, linkDelta: 2 },
      { paymentAmount: 3, linkDelta: 3 },
    ]);
  });

  it("uses Bakdoor-style printed costs instead of generic 1:1 Link", () => {
    expect(
      buildClassicRunnerLinkBidOptions(5, { creditCost: 2, linkDelta: 1 }),
    ).toEqual([
      { paymentAmount: 0, linkDelta: 0 },
      { paymentAmount: 2, linkDelta: 1 },
      { paymentAmount: 4, linkDelta: 2 },
    ]);
  });

  it("allows no generic Link purchase without a selected Base Link modifier", () => {
    expect(buildClassicRunnerLinkBidOptions(10, undefined)).toEqual([
      { paymentAmount: 0, linkDelta: 0 },
    ]);
  });
});
