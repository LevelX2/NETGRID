import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedPostBidLinkChoiceOptionId } from "./post-bid-link-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

describe("post-bid link choice option", () => {
  it("uses structured option metadata to select the minimal outcome-changing link", () => {
    const choice = postBidChoice([
      { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      {
        id: "trace_link_large",
        label: "Large Link: +9 Link",
        metadata: { postBidTraceLinkDelta: 9 },
      },
      {
        id: "trace_link_small",
        label: "Small Link: +2 Link",
        metadata: { postBidTraceLinkDelta: 2 },
      },
    ]);

    expect(
      selectedPostBidLinkChoiceOptionId(choice, {
        traceValue: 1,
        runnerLink: 0,
        runnerBid: 0,
        traceRulesProfile: "classic_blind_corp_ties",
      }),
    ).toBe("trace_link_small");
  });

  it("skips disabled link and pass options", () => {
    const choice = postBidChoice([
      { id: "pass", label: "Pass", selectable: false },
      {
        id: "trace_link_disabled",
        label: "Disabled",
        selectable: false,
        metadata: { postBidTraceLinkDelta: 1 },
      },
      {
        id: "trace_link_current",
        label: "Current",
        metadata: { postBidTraceLinkDelta: 2 },
      },
    ]);
    expect(
      selectedPostBidLinkChoiceOptionId(choice, {
        traceValue: 1,
        runnerLink: 0,
        runnerBid: 0,
        traceRulesProfile: "modern_open",
      }),
    ).toBe("trace_link_current");
  });

  it("does not infer link deltas from labels without metadata", () => {
    const choice = postBidChoice([
      { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      { id: "trace_link_label_only", label: "Label Only: +9 Link" },
    ]);

    expect(
      selectedPostBidLinkChoiceOptionId(choice, {
        traceValue: 1,
        runnerLink: 0,
        runnerBid: 0,
        traceRulesProfile: "classic_blind_corp_ties",
      }),
    ).toBe("pass");
  });
});

function postBidChoice(options: PendingChoice["options"]): PendingChoice {
  return {
    choiceId: "1.post_bid_link.1",
    side: "runner",
    source: "trace_post_bid_link:1",
    prompt: "Post-bid Link-Faehigkeit nutzen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
  };
}
