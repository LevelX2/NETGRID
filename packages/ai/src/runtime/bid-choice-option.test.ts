import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { selectedBidChoiceOptionId } from "./bid-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

describe("selectedBidChoiceOptionId", () => {
  it("does not spend on a Corp trace without public trace context", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard"),
        bidChoice("trace:corp", [0, 1, 2, 3, 4]),
        {},
      ),
    ).toBe("bid_0");
  });

  it("uses the minimum guaranteed bid for the historical visible punish window", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 18,
          ownClicks: 1,
          runnerCredits: 11,
          hq: [
            card("closed", "onr_v1_285_closed-accounts", 1),
            card("scorched", "onr_v1_302_scorched-earth", 3),
          ],
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_7");
  });

  it("bids zero without a visible tag-punish followup", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 18,
          ownClicks: 2,
          runnerCredits: 11,
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("uses the minimum winning bid for a source-visible native Rex trace payoff", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 0,
          runnerCredits: 5,
          encounteredIceDefinitionId: "onr_v1_264_rex",
        }),
        bidChoice("trace:run_1.rex.0.trace", range(0, 5)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_1");
  });

  it("does not go all-in for Rex when guaranteeing the native payoff is too expensive", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 0,
          runnerCredits: 11,
          encounteredIceDefinitionId: "onr_v1_264_rex",
        }),
        bidChoice("trace:run_1.rex.0.trace", range(0, 8)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("does not treat an operation trace as a native ICE trace payoff", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 0,
          runnerCredits: 5,
          encounteredIceDefinitionId: "onr_v1_284_chance-observation",
        }),
        bidChoice("trace:chance-observation", range(0, 5)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("bids zero when guarantee plus payoff is unaffordable", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 7,
          ownClicks: 1,
          runnerCredits: 11,
          hq: [card("closed", "onr_v1_285_closed-accounts", 1)],
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("uses the smallest winning bid instead of the difficulty cap", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 1,
          runnerCredits: 5,
          hq: [card("closed", "onr_v1_285_closed-accounts", 1)],
        }),
        bidChoice("trace:corp", range(0, 5)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_1");
  });

  it("bids zero when no followup click remains", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 18,
          ownClicks: 0,
          runnerCredits: 11,
          hq: [card("closed", "onr_v1_285_closed-accounts", 1)],
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceStrength: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
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

  it("pays the exact visible Seed-7 trace guarantee when the Corp cannot bid", () => {
    expect(
      selectedBidChoiceOptionId(
        input("runner", "normal", {
          ownCredits: 6,
          runnerCredits: 0,
          encounteredIceDefinitionId: "onr_v1_246_fragmentation-storm",
        }),
        bidChoice("trace:seed7.fragmentation-storm", range(0, 6)),
        {
          traceStrength: 4,
          baseTraceStrength: 4,
          runnerLink: 0,
          sourceDefinitionId: "onr_v1_246_fragmentation-storm",
        },
      ),
    ).toBe("bid_4");
  });
});

function input(
  side: AiDecisionInput["side"],
  difficulty: AiDecisionInput["difficulty"],
  overrides: {
    ownCredits?: number;
    ownClicks?: number;
    runnerCredits?: number;
    hq?: Array<Record<string, unknown>>;
    encounteredIceDefinitionId?: string;
  } = {},
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
        credits: overrides.ownCredits ?? 0,
        clicks: overrides.ownClicks ?? 0,
        tags: 0,
        agendaPoints: 0,
        gripOrHq: overrides.hq ?? [],
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        credits: overrides.runnerCredits ?? 0,
        clicks: 0,
        tags: 0,
        agendaPoints: 0,
        gripOrHqCount: 0,
        heapOrArchivesCount: 0,
        scoreArea: [],
      },
      servers: [],
      ...(overrides.encounteredIceDefinitionId
        ? {
            run: {
              encounteredIce: {
                instanceId: "encountered-ice",
                definitionId: overrides.encounteredIceDefinitionId,
                title: "Encountered ICE",
                type: "ice",
                known: true,
                rezzed: true,
              },
            },
          }
        : {}),
    },
    legalActions: [],
    eventTail: [],
  } as unknown as AiDecisionInput;
}

function card(instanceId: string, definitionId: string, cost: number) {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type: "operation",
    cost,
    known: true,
    owner: "corp",
    controller: "corp",
  };
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
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
