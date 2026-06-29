import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedBidChoiceOptionId } from "./bid-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

describe("selectedBidChoiceOptionId", () => {
  it("keeps normal Corp trace bids conservative", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard"),
        bidChoice("trace:corp", [0, 1, 2, 3, 4]),
        {},
      ),
    ).toBe("bid_2");
  });

  it("biases Social Engineering guesses high on hard without hidden Runner data", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard"),
        bidChoice(
          "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:source:42",
          [0, 1, 2, 3, 4, 5, 6, 7, 8],
          "guess",
        ),
        {},
      ),
    ).toBe("guess_8");
  });
});

function input(
  side: AiDecisionInput["side"],
  difficulty: AiDecisionInput["difficulty"],
): AiDecisionInput {
  return {
    matchId: "match",
    side,
    difficulty,
    profileId: "test",
    playerView: {
      stateVersion: 1,
      side,
      phase: "runner_action_phase",
      activeSide: side,
      timingPoint: "choice.pending",
      own: {
        identity: { instanceId: "identity", title: "Identity", known: true },
        credits: 0,
        clicks: 0,
        tags: 0,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        credits: 0,
        clicks: 0,
        tags: 0,
        agendaPoints: 0,
        gripOrHqCount: 0,
        heapOrArchivesCount: 0,
        scoreArea: [],
      },
      servers: [],
    },
    legalActions: [],
    eventTail: [],
  } as unknown as AiDecisionInput;
}

function bidChoice(
  source: string,
  amounts: readonly number[],
  prefix = "bid",
): PendingChoice {
  return {
    choiceId: "choice_1",
    side: "corp",
    source,
    prompt: "Bid",
    kind: "bid_amount",
    options: amounts.map((amount) => ({
      id: `${prefix}_${amount}`,
      label: `${amount}`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
  } as PendingChoice;
}
