import { describe, expect, it } from "vitest";
import {
  selectEfficientPostBidLinkOption,
  selectEfficientTraceBidOption,
} from "./trace-bid-efficiency";

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
      traceStrength: 8,
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
      traceStrength: 3,
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
      traceStrength: 3,
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
    });

    expect(selection).toEqual({
      option: { id: "bid_2", amount: 2 },
      reason: "trace_bid_unknown_context",
    });
  });

  it("passes post-bid Link choices when the Runner already avoided the Trace", () => {
    const selection = selectEfficientPostBidLinkOption({
      options: [
        { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
        {
          id: "trace_link_signpost",
          label: "Signpost: +2 Link",
          linkDelta: 2,
        },
      ],
      fallbackOptionId: "trace_link_signpost",
      traceStrength: 5,
      runnerStrength: 5,
    });

    expect(selection).toEqual({
      option: { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      reason: "post_bid_link_already_avoided",
    });
  });

  it("chooses the smallest post-bid Link bonus that avoids the Trace", () => {
    const selection = selectEfficientPostBidLinkOption({
      options: [
        { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
        {
          id: "trace_link_signpost",
          label: "Signpost: +2 Link",
          linkDelta: 2,
        },
        {
          id: "trace_link_springboard",
          label: "The Springboard: +1 Link",
          linkDelta: 1,
        },
      ],
      fallbackOptionId: "trace_link_signpost",
      traceStrength: 1,
      runnerLink: 0,
      runnerBid: 0,
    });

    expect(selection).toEqual({
      option: {
        id: "trace_link_springboard",
        label: "The Springboard: +1 Link",
        linkDelta: 1,
      },
      reason: "post_bid_link_minimal_outcome_delta",
    });
  });

  it("ignores label-only post-bid Link numbers", () => {
    const selection = selectEfficientPostBidLinkOption({
      options: [
        { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
        { id: "trace_link_signpost", label: "Signpost: +2 Link" },
      ],
      fallbackOptionId: "trace_link_signpost",
      traceStrength: 2,
      runnerLink: 0,
      runnerBid: 0,
    });

    expect(selection).toEqual({
      option: { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      reason: "post_bid_link_no_outcome_delta",
    });
  });

  it("passes post-bid Link choices when no option can change the outcome", () => {
    const selection = selectEfficientPostBidLinkOption({
      options: [
        { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
        {
          id: "trace_link_springboard",
          label: "The Springboard: +1 Link",
          linkDelta: 1,
        },
      ],
      fallbackOptionId: "trace_link_springboard",
      traceStrength: 5,
      runnerLink: 0,
      runnerBid: 0,
    });

    expect(selection).toEqual({
      option: { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      reason: "post_bid_link_no_outcome_delta",
    });
  });

  it("keeps the existing post-bid Link fallback when context is unknown", () => {
    const selection = selectEfficientPostBidLinkOption({
      options: [
        { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
        {
          id: "trace_link_signpost",
          label: "Signpost: +2 Link",
          linkDelta: 2,
        },
      ],
      fallbackOptionId: "trace_link_signpost",
      traceStrength: 5,
    });

    expect(selection).toEqual({
      option: {
        id: "trace_link_signpost",
        label: "Signpost: +2 Link",
        linkDelta: 2,
      },
      reason: "post_bid_link_unknown_context",
    });
  });
});
