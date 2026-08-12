import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assessCorpTraceBid } from "./corp-trace-bid-assessment";

describe("Corp trace-bid play-cost projection", () => {
  it("reserves the explicit minimum cost of a variable-X payoff", () => {
    const assessment = assessCorpTraceBid({
      input: inputWithPayoff(
        payoffCard({
          kind: "variable_x",
          minimumX: 1,
          creditsPerX: 1,
          maximumX: { kind: "context" },
        }),
      ),
      traceContext: { traceLimit: 1, runnerLink: 0 },
      maxBid: 1,
    });

    expect(assessment).toMatchObject({
      recommendedBid: 0,
      reason: "unconvertible_visible_payoff",
      minimumGuaranteedBid: 2,
      followupCreditReserve: 1,
      followupCardId: "power-grid",
    });
  });

  it("does not invent a free payoff when the visible cost model is missing", () => {
    const assessment = assessCorpTraceBid({
      input: inputWithPayoff(payoffCard()),
      traceContext: { traceLimit: 1, runnerLink: 0 },
      maxBid: 1,
    });

    expect(assessment).toEqual({
      recommendedBid: 0,
      reason: "no_visible_payoff",
    });
  });
});

function payoffCard(playCost?: VisibleCard["playCost"]): VisibleCard {
  return {
    instanceId: "power-grid",
    definitionId: "onr_v1_299_power-grid-overload",
    title: "Power Grid Overload",
    owner: "corp",
    controller: "corp",
    type: "operation",
    known: true,
    ...(playCost ? { playCost } : {}),
  };
}

function inputWithPayoff(payoff: VisibleCard): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      own: {
        credits: 1,
        clicks: 1,
        gripOrHq: [payoff],
      },
      opponent: {
        credits: 1,
      },
    },
  } as unknown as AiDecisionInput;
}
