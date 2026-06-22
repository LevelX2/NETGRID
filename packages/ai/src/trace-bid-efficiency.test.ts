import { describe, expect, it } from "vitest";
import { selectEfficientTraceBidOption } from "./trace-bid-efficiency";

describe("Trace bid efficiency", () => {
  it("reduces an unwinnable Runner Trace bid to zero", () => {
    const selection = selectEfficientTraceBidOption({
      side: "runner",
      bidOptions: [
        { id: "bid_0", amount: 0 },
        { id: "bid_1", amount: 1 },
        { id: "bid_2", amount: 2 },
      ],
      desiredAmount: 2,
      traceStrength: 5,
      runnerLink: 0,
      corpBid: 3,
    });

    expect(selection).toEqual({
      option: { id: "bid_0", amount: 0 },
      reason: "trace_bid_no_outcome_delta",
    });
  });

  it("keeps the cheapest Runner bid that changes the Trace outcome", () => {
    const selection = selectEfficientTraceBidOption({
      side: "runner",
      bidOptions: [
        { id: "bid_0", amount: 0 },
        { id: "bid_1", amount: 1 },
        { id: "bid_2", amount: 2 },
        { id: "bid_3", amount: 3 },
      ],
      desiredAmount: 3,
      traceStrength: 2,
      runnerLink: 0,
      corpBid: 1,
    });

    expect(selection).toEqual({
      option: { id: "bid_3", amount: 3 },
      reason: "trace_bid_existing_choice",
    });
  });

  it("lowers overbids to the minimal bid with the same favorable outcome", () => {
    const selection = selectEfficientTraceBidOption({
      side: "runner",
      bidOptions: [
        { id: "bid_0", amount: 0 },
        { id: "bid_1", amount: 1 },
        { id: "bid_2", amount: 2 },
        { id: "bid_3", amount: 3 },
      ],
      desiredAmount: 3,
      traceStrength: 2,
      runnerLink: 1,
      corpBid: 1,
    });

    expect(selection).toEqual({
      option: { id: "bid_2", amount: 2 },
      reason: "trace_bid_minimal_outcome_bid",
    });
  });

  it("falls back to the existing desired bid when context is unknown", () => {
    const selection = selectEfficientTraceBidOption({
      side: "runner",
      bidOptions: [
        { id: "bid_0", amount: 0 },
        { id: "bid_1", amount: 1 },
        { id: "bid_2", amount: 2 },
      ],
      desiredAmount: 2,
      traceStrength: 5,
      runnerLink: 0,
    });

    expect(selection).toEqual({
      option: { id: "bid_2", amount: 2 },
      reason: "trace_bid_unknown_context",
    });
  });
});
