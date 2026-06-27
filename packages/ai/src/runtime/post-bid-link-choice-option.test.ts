import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedPostBidLinkChoiceOptionId } from "./post-bid-link-choice-option";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

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
        label: "Small Link: +1 Link",
        metadata: { postBidTraceLinkDelta: 1 },
      },
    ]);

    expect(
      selectedPostBidLinkChoiceOptionId(choice, {
        traceStrength: 1,
        runnerLink: 0,
        runnerBid: 0,
      }),
    ).toBe("trace_link_small");
  });

  it("does not infer link deltas from labels without metadata", () => {
    const choice = postBidChoice([
      { id: "pass", label: "Keine Link-Faehigkeit nutzen" },
      { id: "trace_link_label_only", label: "Label Only: +9 Link" },
    ]);

    expect(
      selectedPostBidLinkChoiceOptionId(choice, {
        traceStrength: 1,
        runnerLink: 0,
        runnerBid: 0,
      }),
    ).toBe("pass");
  });
});

function postBidChoice(options: PendingChoice["options"]): PendingChoice {
  return {
    choiceId: "trace_1.post_bid_link.1",
    side: "runner",
    source: "trace_post_bid_link:trace_1",
    prompt: "Post-bid Link-Faehigkeit nutzen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
  };
}
